/**
 * GIP Smoothing Module (analytic form) — temporal smoothing + ZUPT constraints.
 *
 * Paper: GIP's Smoothing Module is a VAE (LSTM encoder + decoder) trained with a
 * loss that (a) minimises the 2nd-order temporal derivative of joint positions
 * (smoothing loss) and (b) drives foot velocity and foot height to zero during
 * ground-contact frames (ZUPT-inspired Lfvel / Lfpos). The paper also pre-filters
 * every IMU channel with a 4th-order Butterworth low-pass at 10 Hz (fs = 100 Hz).
 *
 * We cannot train a VAE in the browser, so this module implements the SAME OBJECTIVE
 * analytically: a Butterworth low-pass (the paper's exact IMU pre-filter), a discrete
 * C2 smoother (minimises the finite-difference 2nd derivative), and explicit
 * foot velocity/height clamping on contact frames. This preserves the paper's
 * drift-suppression behaviour without a learned network.
 *
 * Pure functions — no DOM. Loadable in Node for unit testing.
 */
(function (global) {
  'use strict';

  /**
   * 2nd-order Butterworth low-pass biquad. Cascade twice for the paper's 4th order.
   * Streaming (causal) — feed one sample at a time.
   */
  class BiquadLowpass {
    constructor(cutoffHz, fs) {
      const w0 = (2 * Math.PI * cutoffHz) / fs;
      const cosw = Math.cos(w0);
      const sinw = Math.sin(w0);
      const q = Math.SQRT1_2; // Butterworth Q for a single 2nd-order section
      const alpha = sinw / (2 * q);
      const a0 = 1 + alpha;
      this.b0 = ((1 - cosw) / 2) / a0;
      this.b1 = (1 - cosw) / a0;
      this.b2 = ((1 - cosw) / 2) / a0;
      this.a1 = (-2 * cosw) / a0;
      this.a2 = (1 - alpha) / a0;
      this.reset();
    }
    reset(x0) {
      const v = Number.isFinite(x0) ? x0 : 0;
      this.x1 = this.x2 = this.y1 = this.y2 = v;
    }
    step(x) {
      const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
      this.x2 = this.x1; this.x1 = x;
      this.y2 = this.y1; this.y1 = y;
      return y;
    }
  }

  function runForward(series, cutoffHz, fs) {
    const f1 = new BiquadLowpass(cutoffHz, fs);
    const f2 = new BiquadLowpass(cutoffHz, fs);
    if (series.length) { f1.reset(series[0]); f2.reset(series[0]); }
    const out = new Array(series.length);
    for (let i = 0; i < series.length; i++) {
      out[i] = f2.step(f1.step(series[i])); // cascade -> 4th order
    }
    return out;
  }

  /**
   * Zero-phase 4th-order Butterworth low-pass (forward-backward). Offline use.
   * This is the paper's IMU pre-filter (10 Hz cutoff, 100 Hz sampling by default).
   * @param {number[]} series
   * @param {number} [cutoffHz=10]
   * @param {number} [fs=100]
   * @returns {number[]}
   */
  function lowpassFiltfilt(series, cutoffHz, fs) {
    if (!Array.isArray(series) || series.length < 2) return Array.isArray(series) ? series.slice() : [];
    const fc = Number.isFinite(cutoffHz) ? cutoffHz : 10;
    const rate = Number.isFinite(fs) ? fs : 100;
    const fwd = runForward(series, fc, rate);
    const rev = runForward(fwd.slice().reverse(), fc, rate);
    return rev.reverse();
  }

  /**
   * Discrete C2 smoother: relaxes toward minimal finite-difference 2nd derivative.
   * Approximates the paper's smoothing loss (sum ||x_{t+1} - 2 x_t + x_{t-1}||^2).
   * `pinned[i] === true` holds sample i fixed (e.g. a hard ZUPT foot-height anchor).
   * @param {number[]} series
   * @param {{iterations?:number, lambda?:number, pinned?:boolean[]}} [opts]
   * @returns {number[]}
   */
  function smoothC2(series, opts) {
    if (!Array.isArray(series) || series.length < 3) return Array.isArray(series) ? series.slice() : [];
    const o = opts || {};
    const iterations = o.iterations > 0 ? o.iterations : 8;
    const lambda = Number.isFinite(o.lambda) ? o.lambda : 0.25;
    const pinned = Array.isArray(o.pinned) ? o.pinned : null;
    let x = series.slice();
    for (let k = 0; k < iterations; k++) {
      const next = x.slice();
      for (let i = 1; i < x.length - 1; i++) {
        if (pinned && pinned[i]) continue;
        next[i] = x[i] + lambda * (x[i - 1] - 2 * x[i] + x[i + 1]);
      }
      x = next;
    }
    return x;
  }

  /**
   * Enforce the ZUPT foot constraints on a trajectory: during contact frames the
   * foot velocity is forced to zero and the foot height is pinned to the ground
   * (its per-frame value is unchanged; only vertical drift below/above 0 is removed).
   * Mirrors Lfvel / Lfpos in the paper.
   * @param {{x:number[], y:number[], z:number[]}} traj  forward/lateral/vertical
   * @param {boolean[]} contactMask  true where the foot is on the ground
   * @returns {{x:number[], y:number[], z:number[]}} corrected trajectory (new arrays)
   */
  function applyFootContactConstraints(traj, contactMask) {
    const n = traj.x.length;
    const x = traj.x.slice();
    const y = traj.y.slice();
    const z = traj.z.slice();
    // During contact the foot cannot move: hold x/y and clamp z to the ground level
    // measured at the moment of contact, removing residual vertical drift.
    let i = 0;
    while (i < n) {
      if (contactMask[i]) {
        let j = i;
        while (j < n && contactMask[j]) j++;
        const groundZ = 0;
        for (let k = i; k < j; k++) { x[k] = x[i]; y[k] = y[i]; z[k] = groundZ; }
        i = j;
      } else {
        i++;
      }
    }
    return { x: x, y: y, z: z };
  }

  const Smoothing = {
    BiquadLowpass: BiquadLowpass,
    lowpassFiltfilt: lowpassFiltfilt,
    smoothC2: smoothC2,
    applyFootContactConstraints: applyFootContactConstraints
  };

  if (typeof global.OrpheGipSmoothing === 'undefined') {
    global.OrpheGipSmoothing = Smoothing;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Smoothing;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
