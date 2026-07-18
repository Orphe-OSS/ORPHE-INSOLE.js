/**
 * GIP Gait Module — gait phase + gait parameters from two shoe IMUs.
 *
 * Paper: GIP's Gait Module is a Transformer that regresses, per frame, the 4-way
 * gait phase (heel-strike / toe-contact / heel-off / toe-off), 6D joint angles,
 * root velocity, root height and foot height, using acceleration + angular velocity
 * in the SENSOR coordinate frame only (deliberately no global orientation, to avoid
 * yaw drift). The paper also reports an "Integration + ZUPT" baseline that recovers
 * the foot trajectory directly.
 *
 * This module reproduces the measurable parts of that with signal processing rather
 * than a trained Transformer:
 *   - gait phase / stance detection (using the 6-channel INSOLE pressure when present,
 *     which ORPHE CORE in the paper did NOT have — a strict improvement the paper lists
 *     as future work), or IMU-only detection as a fallback;
 *   - the paper's Integration + ZUPT foot-trajectory recovery, with per-stride
 *     zero-velocity update and linear drift removal;
 *   - stride length, cadence, walking speed and left/right symmetry.
 * The learned joint-angle regression is handled downstream by the pose reconstructor,
 * driven by these measured gait parameters.
 *
 * Pure functions + an online FootTracker. No DOM. Loadable in Node for unit testing.
 */
(function (global) {
  'use strict';

  const G = 9.80665;

  // Default INSOLE channel groups (see src/InsoleUtils.js SENSOR_LAYOUT: +y = toe).
  // Channel-to-position mapping can differ per hardware model; override via opts.
  const DEFAULT_HEEL_CH = [5];
  const DEFAULT_FOREFOOT_CH = [0, 1, 2, 3];

  const PHASE = { SWING: 0, HEEL_STRIKE: 1, FOOT_FLAT: 2, HEEL_OFF: 3 };
  const PHASE_NAMES = ['swing', 'heel_strike', 'foot_flat', 'heel_off'];

  // ---- small vector / quaternion helpers ----------------------------------
  function rotateByQuat(q, v) {
    // rotate v by unit quaternion q = {w,x,y,z}
    const { w, x, y, z } = q;
    const vx = v.x, vy = v.y, vz = v.z;
    // t = 2 * cross(q.xyz, v)
    const tx = 2 * (y * vz - z * vy);
    const ty = 2 * (z * vx - x * vz);
    const tz = 2 * (x * vy - y * vx);
    return {
      x: vx + w * tx + (y * tz - z * ty),
      y: vy + w * ty + (z * tx - x * tz),
      z: vz + w * tz + (x * ty - y * tx)
    };
  }

  function sum(arr, idx) {
    let s = 0;
    for (let i = 0; i < idx.length; i++) s += arr[idx[i]] || 0;
    return s;
  }

  const V = {
    add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
    sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
    scale: (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s }),
    dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,
    cross: (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }),
    norm: (a) => Math.hypot(a.x, a.y, a.z)
  };

  // ---- stance detection ---------------------------------------------------
  /**
   * Stance mask from total pressure with hysteresis (preferred for INSOLE).
   * @param {number[][]} press per-frame 6ch values
   * @param {{on?:number, off?:number}} [opts]
   * @returns {boolean[]}
   */
  function stanceFromPressure(press, opts) {
    const o = opts || {};
    const on = Number.isFinite(o.on) ? o.on : 1200;
    const off = Number.isFinite(o.off) ? o.off : 700;
    const mask = new Array(press.length);
    let contact = false;
    for (let i = 0; i < press.length; i++) {
      const total = press[i] ? press[i].reduce((a, b) => a + (b || 0), 0) : 0;
      if (!contact && total > on) contact = true;
      else if (contact && total < off) contact = false;
      mask[i] = contact;
    }
    return mask;
  }

  /**
   * Stance mask from IMU only: foot is (near) stationary -> |acc|~1g and |gyro| small.
   * @param {Array<{acc:{x,y,z}, gyro:{x,y,z}}>} samples  acc in G, gyro in deg/s
   * @param {{accLow?:number, accHigh?:number, gyroMax?:number, minFrames?:number}} [opts]
   * @returns {boolean[]}
   */
  function stanceFromImu(samples, opts) {
    const o = opts || {};
    const accLow = Number.isFinite(o.accLow) ? o.accLow : 0.85;
    const accHigh = Number.isFinite(o.accHigh) ? o.accHigh : 1.15;
    const gyroMax = Number.isFinite(o.gyroMax) ? o.gyroMax : 60;
    const minFrames = o.minFrames > 0 ? o.minFrames : 3;
    const raw = samples.map((s) => {
      const am = Math.hypot(s.acc.x, s.acc.y, s.acc.z);
      const gm = Math.hypot(s.gyro.x, s.gyro.y, s.gyro.z);
      return am > accLow && am < accHigh && gm < gyroMax;
    });
    // require minFrames consecutive true to count as stance (debounce)
    const mask = raw.slice();
    let run = 0;
    for (let i = 0; i < raw.length; i++) {
      run = raw[i] ? run + 1 : 0;
      if (raw[i] && run < minFrames) {
        for (let k = i; k >= 0 && k > i - minFrames && raw[k]; k--) mask[k] = false;
      }
    }
    return mask;
  }

  // ---- gait events + 4-phase labelling ------------------------------------
  /** Rising edges of the contact mask = heel-strike frame indices. */
  function heelStrikeIndices(contact) {
    const idx = [];
    for (let i = 1; i < contact.length; i++) {
      if (contact[i] && !contact[i - 1]) idx.push(i);
    }
    if (contact.length && contact[0]) idx.unshift(0);
    return idx;
  }

  /**
   * Per-frame 4-phase label. Uses pressure heel/forefoot split when available,
   * otherwise a stance-time-fraction heuristic.
   */
  function phaseLabels(contact, press, opts) {
    const o = opts || {};
    const heelCh = o.heelChannels || DEFAULT_HEEL_CH;
    const foreCh = o.forefootChannels || DEFAULT_FOREFOOT_CH;
    const loadOn = Number.isFinite(o.groupOn) ? o.groupOn : 300;
    const n = contact.length;
    const labels = new Array(n).fill(PHASE.SWING);

    // segment contiguous stance intervals
    let i = 0;
    while (i < n) {
      if (!contact[i]) { i++; continue; }
      let j = i;
      while (j < n && contact[j]) j++;
      const len = j - i;
      for (let k = i; k < j; k++) {
        if (press && press[k]) {
          const heel = sum(press[k], heelCh);
          const fore = sum(press[k], foreCh);
          const heelOn = heel > loadOn;
          const foreOn = fore > loadOn;
          if (heelOn && !foreOn) labels[k] = PHASE.HEEL_STRIKE;
          else if (heelOn && foreOn) labels[k] = PHASE.FOOT_FLAT;
          else if (!heelOn && foreOn) labels[k] = PHASE.HEEL_OFF;
          else labels[k] = PHASE.FOOT_FLAT;
        } else {
          const f = (k - i) / Math.max(1, len - 1); // 0..1 through stance
          if (f < 0.12) labels[k] = PHASE.HEEL_STRIKE;
          else if (f < 0.70) labels[k] = PHASE.FOOT_FLAT;
          else labels[k] = PHASE.HEEL_OFF;
        }
      }
      i = j;
    }
    return labels;
  }

  // ---- ZUPT foot trajectory (paper's Integration + ZUPT baseline) ---------
  /**
   * Recover a foot trajectory from one stride's samples with zero-velocity update.
   * Straight-line assumption: the horizontal travel direction is found by PCA of the
   * horizontal path (no global yaw needed — the paper's central design choice).
   *
   * @param {Array<{t:number, acc:{x,y,z}, gyro:{x,y,z}, quat?:{w,x,y,z}}>} samples
   * @param {boolean[]} contact
   * @param {object} [opts]
   * @returns {{x:number[], y:number[], z:number[], forward:number[], strideLength:number}}
   *          x/y/z = forward / lateral / vertical (m); forward[] = signed forward pos.
   */
  function zuptTrajectory(samples, contact, opts) {
    const n = samples.length;
    if (n < 2) return { x: [], y: [], z: [], forward: [], strideLength: 0 };
    const o = opts || {};

    // 1) linear acceleration (m/s^2), gravity removed, in a fixed frame + up vector.
    // Preferred: rotate acc into the device world frame with the (gravity-referenced)
    // quaternion, then estimate gravity as the mean world acceleration over the buffer
    // (linear accel averages to ~0 across a stride). This is convention-agnostic — it
    // does not assume which axis is "up" — and keeps forward motion in the horizontal
    // plane. Fallback (no quaternion, e.g. streaming mode 3): gyro-integrated
    // orientation with a low-passed accelerometer gravity estimate.
    const aLin = new Array(n);
    let up = { x: 0, y: 0, z: 1 };
    const useQuat = o.useQuat !== false && samples.every((s) => s.quat);
    if (useQuat) {
      const world = new Array(n);
      let gx = 0, gy = 0, gz = 0;
      for (let i = 0; i < n; i++) {
        const w = rotateByQuat(samples[i].quat, samples[i].acc); // g, world frame
        world[i] = w; gx += w.x; gy += w.y; gz += w.z;
      }
      const grav = { x: gx / n, y: gy / n, z: gz / n };
      const gm = V.norm(grav) || 1;
      up = { x: grav.x / gm, y: grav.y / gm, z: grav.z / gm };
      for (let i = 0; i < n; i++) {
        aLin[i] = { x: (world[i].x - grav.x) * G, y: (world[i].y - grav.y) * G, z: (world[i].z - grav.z) * G };
      }
    } else {
      // integrate gyro to an orientation R (fixed <- sensor), rotate accel into the
      // fixed frame, then use the SAME mean-gravity method: gravity is the mean rotated
      // acceleration during stance (the foot is still, so it reads pure gravity there).
      const world = new Array(n);
      let R = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      for (let i = 0; i < n; i++) {
        if (i > 0) {
          const dt = Math.max(1e-3, (samples[i].t - samples[i - 1].t) / 1000);
          const ox = (samples[i].gyro.x * Math.PI / 180) * dt;
          const oy = (samples[i].gyro.y * Math.PI / 180) * dt;
          const oz = (samples[i].gyro.z * Math.PI / 180) * dt;
          R = matMul(R, [1, -oz, oy, oz, 1, -ox, -oy, ox, 1]);
        }
        world[i] = matVec(R, samples[i].acc);
      }
      let gx = 0, gy = 0, gz = 0, c = 0;
      for (let i = 0; i < n; i++) {
        if (contact[i]) { gx += world[i].x; gy += world[i].y; gz += world[i].z; c++; }
      }
      if (c === 0) { for (let i = 0; i < n; i++) { gx += world[i].x; gy += world[i].y; gz += world[i].z; } c = n; }
      const grav = { x: gx / c, y: gy / c, z: gz / c };
      const gm = V.norm(grav) || 1;
      up = { x: grav.x / gm, y: grav.y / gm, z: grav.z / gm };
      for (let i = 0; i < n; i++) {
        aLin[i] = { x: (world[i].x - grav.x) * G, y: (world[i].y - grav.y) * G, z: (world[i].z - grav.z) * G };
      }
    }

    // 2) velocity by integration with ZUPT (zero during stance) + linear de-drift.
    const vel = new Array(n);
    vel[0] = { x: 0, y: 0, z: 0 };
    for (let i = 1; i < n; i++) {
      const dt = Math.max(1e-3, (samples[i].t - samples[i - 1].t) / 1000);
      vel[i] = contact[i] ? { x: 0, y: 0, z: 0 } : V.add(vel[i - 1], V.scale(aLin[i], dt));
    }
    deDriftSwings(vel, samples, contact);

    // 3) position by integration; remove vertical drift by pinning height (pos . up)
    //    to 0 during stance.
    const pos = new Array(n);
    pos[0] = { x: 0, y: 0, z: 0 };
    for (let i = 1; i < n; i++) {
      const dt = Math.max(1e-3, (samples[i].t - samples[i - 1].t) / 1000);
      let p = V.add(pos[i - 1], V.scale(vel[i], dt));
      if (contact[i]) p = V.sub(p, V.scale(up, V.dot(p, up))); // drop vertical component
      pos[i] = p;
    }

    // 4) forward = principal horizontal direction (perpendicular to up).
    const fwd = principalHorizontalAxis(pos, up);
    const lat = V.cross(up, fwd);
    const x = new Array(n), y = new Array(n), z = new Array(n), forward = new Array(n);
    for (let i = 0; i < n; i++) {
      forward[i] = V.dot(pos[i], fwd);
      x[i] = forward[i];
      y[i] = V.dot(pos[i], lat);
      z[i] = V.dot(pos[i], up);
    }
    const strideLength = Math.max(...forward) - Math.min(...forward);
    return { x: x, y: y, z: z, forward: forward, strideLength: strideLength };
  }

  function matMul(a, b) {
    const c = new Array(9);
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 3; col++) {
        c[r * 3 + col] = a[r * 3] * b[col] + a[r * 3 + 1] * b[3 + col] + a[r * 3 + 2] * b[6 + col];
      }
    }
    return c;
  }
  function matVec(m, v) {
    return {
      x: m[0] * v.x + m[1] * v.y + m[2] * v.z,
      y: m[3] * v.x + m[4] * v.y + m[5] * v.z,
      z: m[6] * v.x + m[7] * v.y + m[8] * v.z
    };
  }

  function deDriftSwings(vel, samples, contact) {
    const n = vel.length;
    let i = 0;
    while (i < n) {
      // find a swing interval [s, e): contact false
      if (contact[i]) { i++; continue; }
      let s = i;
      while (i < n && !contact[i]) i++;
      const e = i; // first contact frame after swing (or n)
      // velocity should be ~0 at s-1 (stance) and e (stance). Any residual at e is drift.
      const driftV = e < n ? vel[e === 0 ? 0 : e] : { x: 0, y: 0, z: 0 };
      const t0 = samples[Math.max(0, s - 1)].t;
      const t1 = samples[Math.min(n - 1, e)].t;
      const span = Math.max(1, t1 - t0);
      for (let k = s; k < e; k++) {
        const f = (samples[k].t - t0) / span; // 0..1 across swing
        vel[k].x -= driftV.x * f;
        vel[k].y -= driftV.y * f;
        vel[k].z -= driftV.z * f;
      }
    }
  }

  // Principal direction of the horizontal path (plane perpendicular to `up`).
  function principalHorizontalAxis(pos, up) {
    // orthonormal basis {e1, e2} spanning the plane perpendicular to up
    const seed = Math.abs(up.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    let e1 = V.sub(seed, V.scale(up, V.dot(seed, up)));
    const e1n = V.norm(e1) || 1;
    e1 = V.scale(e1, 1 / e1n);
    const e2 = V.cross(up, e1);
    // 2D PCA of the projected path
    let ma = 0, mb = 0;
    const A = new Array(pos.length), B = new Array(pos.length);
    for (let i = 0; i < pos.length; i++) {
      A[i] = V.dot(pos[i], e1); B[i] = V.dot(pos[i], e2);
      ma += A[i]; mb += B[i];
    }
    ma /= pos.length; mb /= pos.length;
    let saa = 0, sab = 0, sbb = 0;
    for (let i = 0; i < pos.length; i++) {
      const da = A[i] - ma, db = B[i] - mb;
      saa += da * da; sab += da * db; sbb += db * db;
    }
    const tr = saa + sbb, det = saa * sbb - sab * sab;
    const l = tr / 2 + Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
    let ca = l - sbb, cb = sab;
    const cn = Math.hypot(ca, cb) || 1;
    ca /= cn; cb /= cn;
    let fwd = V.add(V.scale(e1, ca), V.scale(e2, cb));
    const fn = V.norm(fwd) || 1;
    return V.scale(fwd, 1 / fn);
  }

  // ---- batch analysis (test API) ------------------------------------------
  /**
   * Analyze one foot's sample stream.
   * @param {Array<{t:number, acc:{x,y,z}, gyro:{x,y,z}, press?:number[], quat?:object}>} samples
   * @param {object} [opts]
   */
  function analyzeFoot(samples, opts) {
    const o = opts || {};
    const press = samples.map((s) => s.press || null);
    const hasPress = press.some((p) => p);
    const contact = hasPress ? stanceFromPressure(press, o.pressure) : stanceFromImu(samples, o.imu);
    const labels = phaseLabels(contact, hasPress ? press : null, o);
    const hs = heelStrikeIndices(contact);
    const traj = zuptTrajectory(samples, contact, o);

    // stride timing from consecutive heel strikes
    const strides = [];
    for (let i = 1; i < hs.length; i++) {
      const t0 = samples[hs[i - 1]].t, t1 = samples[hs[i]].t;
      strides.push({ startIndex: hs[i - 1], endIndex: hs[i], periodMs: t1 - t0 });
    }
    const meanPeriod = strides.length
      ? strides.reduce((a, s) => a + s.periodMs, 0) / strides.length
      : NaN;
    const cadence = Number.isFinite(meanPeriod) ? 120000 / meanPeriod : NaN; // steps/min
    const stanceFrames = contact.filter(Boolean).length;
    const stanceRatio = contact.length ? stanceFrames / contact.length : NaN;

    // Stride length = mean forward advance per gait cycle (heel strike -> heel strike).
    // Falls back to the single-window span when fewer than two heel strikes are seen.
    let strideLength = traj.strideLength;
    if (hs.length >= 2 && traj.forward.length) {
      let sumStride = 0, count = 0;
      for (let i = 1; i < hs.length; i++) {
        sumStride += Math.abs(traj.forward[hs[i]] - traj.forward[hs[i - 1]]);
        count++;
      }
      if (count) strideLength = sumStride / count;
    }

    return {
      contact: contact,
      phase: labels,
      phaseNames: PHASE_NAMES,
      heelStrikes: hs,
      strides: strides,
      trajectory: traj,
      strideLength: strideLength,
      spanLength: traj.strideLength,
      cadence: cadence,
      strideePeriodMs: meanPeriod,
      stanceRatio: stanceRatio
    };
  }

  /**
   * Combine two feet into a symmetry / speed summary.
   */
  function summarize(left, right) {
    const sl = left.strideLength, sr = right.strideLength;
    const symmetry = Number.isFinite(sl) && Number.isFinite(sr) && (sl + sr) > 0
      ? 1 - Math.abs(sl - sr) / (sl + sr)
      : NaN;
    const cadence = avgFinite(left.cadence, right.cadence);
    const period = avgFinite(left.strideePeriodMs, right.strideePeriodMs);
    const stride = avgFinite(sl, sr);
    const speed = Number.isFinite(stride) && Number.isFinite(period) && period > 0
      ? stride / (period / 1000)
      : NaN;
    return { cadence: cadence, strideLength: stride, speed: speed, symmetry: symmetry };
  }

  function avgFinite(a, b) {
    const xs = [a, b].filter((v) => Number.isFinite(v));
    return xs.length ? xs.reduce((p, c) => p + c, 0) / xs.length : NaN;
  }

  // ---- online tracker (live rendering) ------------------------------------
  /**
   * Incremental per-foot tracker for real-time use. Feeds are cheap; a full ZUPT
   * pass runs once per completed stride.
   */
  class FootTracker {
    constructor(opts) {
      this.opts = opts || {};
      this.reset();
    }
    reset() {
      this.buffer = [];          // samples for the current stride
      this.contact = false;
      this.lastHeelStrikeT = null;
      this.periodMs = 1100;      // smoothed stride period
      this.strideLength = this.opts.fallbackStride || 1.3;
      this.cadence = NaN;
      this.speed = NaN;
      this.phase = 0;            // 0..1 through the gait cycle
      this.discretePhase = PHASE.SWING;
      this.lastTraj = null;
      this._pressOn = Number.isFinite(this.opts.pressureOn) ? this.opts.pressureOn : 1200;
      this._pressOff = Number.isFinite(this.opts.pressureOff) ? this.opts.pressureOff : 700;
      this._total = 0;
    }
    /**
     * @param {{t:number, acc:{x,y,z}, gyro:{x,y,z}, press?:number[], quat?:object}} s
     * @returns {{newStride:boolean, strideLength:number, periodMs:number}|null}
     */
    push(s) {
      this.buffer.push(s);
      if (this.buffer.length > 600) this.buffer.shift(); // ~3-6 s guard

      // contact via pressure (preferred) or IMU quiescence
      let contactNow;
      if (s.press) {
        this._total = s.press.reduce((a, b) => a + (b || 0), 0);
        contactNow = this.contact ? this._total > this._pressOff : this._total > this._pressOn;
      } else {
        const am = Math.hypot(s.acc.x, s.acc.y, s.acc.z);
        const gm = Math.hypot(s.gyro.x, s.gyro.y, s.gyro.z);
        contactNow = am > 0.85 && am < 1.15 && gm < 60;
      }

      let result = null;
      const rising = contactNow && !this.contact;
      this.contact = contactNow;
      this.discretePhase = this._discretePhase(s, contactNow);

      if (rising) {
        if (this.lastHeelStrikeT !== null) {
          const period = s.t - this.lastHeelStrikeT;
          if (period > 300 && period < 3000) {
            this.periodMs = 0.6 * this.periodMs + 0.4 * period;
            result = this._closeStride();
          }
        }
        this.lastHeelStrikeT = s.t;
      }

      // update continuous phase estimate
      if (this.lastHeelStrikeT !== null) {
        this.phase = Math.min(1, Math.max(0, (s.t - this.lastHeelStrikeT) / this.periodMs));
      }
      this.cadence = 120000 / this.periodMs;
      this.speed = this.strideLength / (this.periodMs / 1000);
      return result;
    }
    _discretePhase(s, contactNow) {
      if (!contactNow) return PHASE.SWING;
      if (s.press) {
        const heelCh = this.opts.heelChannels || DEFAULT_HEEL_CH;
        const foreCh = this.opts.forefootChannels || DEFAULT_FOREFOOT_CH;
        const heel = sum(s.press, heelCh) > 300;
        const fore = sum(s.press, foreCh) > 300;
        if (heel && !fore) return PHASE.HEEL_STRIKE;
        if (heel && fore) return PHASE.FOOT_FLAT;
        if (!heel && fore) return PHASE.HEEL_OFF;
        return PHASE.FOOT_FLAT;
      }
      return PHASE.FOOT_FLAT;
    }
    _closeStride() {
      const samples = this.buffer.slice();
      // recompute contact over the stride buffer for a clean ZUPT
      const press = samples.map((x) => x.press || null);
      const hasPress = press.some((p) => p);
      const contact = hasPress
        ? stanceFromPressure(press, { on: this._pressOn, off: this._pressOff })
        : stanceFromImu(samples, this.opts.imu);
      const traj = zuptTrajectory(samples, contact, this.opts);
      if (Number.isFinite(traj.strideLength) && traj.strideLength > 0.2 && traj.strideLength < 2.5) {
        this.strideLength = 0.5 * this.strideLength + 0.5 * traj.strideLength;
      }
      this.lastTraj = traj;
      this.buffer = []; // start fresh for the next stride
      return { newStride: true, strideLength: this.strideLength, periodMs: this.periodMs, trajectory: traj };
    }
  }

  const GaitModule = {
    G: G,
    PHASE: PHASE,
    PHASE_NAMES: PHASE_NAMES,
    DEFAULT_HEEL_CH: DEFAULT_HEEL_CH,
    DEFAULT_FOREFOOT_CH: DEFAULT_FOREFOOT_CH,
    stanceFromPressure: stanceFromPressure,
    stanceFromImu: stanceFromImu,
    heelStrikeIndices: heelStrikeIndices,
    phaseLabels: phaseLabels,
    zuptTrajectory: zuptTrajectory,
    analyzeFoot: analyzeFoot,
    summarize: summarize,
    FootTracker: FootTracker
  };

  if (typeof global.OrpheGipGaitModule === 'undefined') {
    global.OrpheGipGaitModule = GaitModule;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GaitModule;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
