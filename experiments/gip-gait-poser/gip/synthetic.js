/**
 * GIP synthetic-gait generator — ground-truth walking pose -> synthetic foot IMU.
 *
 * Paper: because motion-capture gait datasets rarely contain real shoe-IMU signals,
 * GIP *synthesises* IMU acceleration/angular-velocity from the SMPL mesh motion (it
 * defines an IMU frame on the foot mesh and differentiates the global orientation and
 * acceleration). We do the same here at stick-figure resolution: a prescribed normal
 * gait (from the pose template + Body Module) produces a ground-truth full-body pose,
 * and we differentiate each foot's world position/orientation to synthesise the
 * accelerometer (with gravity), gyroscope, and a plausible 6-channel pressure signal.
 *
 * Feeding this through the Gait Module closes the loop: the estimate can be compared
 * against the known ground truth, giving the simulation real error numbers
 * (stride-length error, cadence error, phase accuracy) — no hardware required.
 *
 * Deterministic (seeded) so results are reproducible and Node-testable.
 */
(function (global) {
  'use strict';

  const Pose = (typeof require !== 'undefined')
    ? require('./pose.js')
    : global.OrpheGipPose;

  const G = 9.80665;
  const DEG = 180 / Math.PI;

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function quatAboutY(p) {
    return { w: Math.cos(p / 2), x: 0, y: Math.sin(p / 2), z: 0 };
  }
  function conj(q) { return { w: q.w, x: -q.x, y: -q.y, z: -q.z }; }
  function rotateByQuat(q, v) {
    const { w, x, y, z } = q;
    const tx = 2 * (y * v.z - z * v.y);
    const ty = 2 * (z * v.x - x * v.z);
    const tz = 2 * (x * v.y - y * v.x);
    return {
      x: v.x + w * tx + (y * tz - z * ty),
      y: v.y + w * ty + (z * tx - x * tz),
      z: v.z + w * tz + (x * ty - y * tx)
    };
  }
  function periodicBump(phase, center, width) {
    let d = Math.abs(phase - center);
    if (d > 0.5) d = 1 - d;
    return Math.exp(-(d * d) / (2 * width * width));
  }

  // Plausible 6-channel INSOLE pressure (ADC-ish) from one foot's cycle phase.
  // Heel (ch5) loads at heel-strike; forefoot (ch0-3) loads through terminal stance;
  // near-zero during swing (phase >= ~0.62).
  function pressureFromPhase(phase, rnd) {
    const stance = phase < 0.62 ? 1 : 0;
    const heel = 5200 * periodicBump(phase, 0.08, 0.10) * stance;
    const fore = 6000 * periodicBump(phase, 0.48, 0.16) * stance;
    const mid = 2600 * periodicBump(phase, 0.30, 0.20) * stance;
    const n = () => (rnd() - 0.5) * 120;
    return [
      Math.max(0, Math.round(fore * 0.30 + n())),
      Math.max(0, Math.round(fore * 0.30 + n())),
      Math.max(0, Math.round(fore * 0.22 + n())),
      Math.max(0, Math.round(fore * 0.18 + n())),
      Math.max(0, Math.round(mid + n())),
      Math.max(0, Math.round(heel + n()))
    ];
  }

  function smoothstep(t) {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  }

  class Walker {
    /**
     * @param {object} skeleton  OrpheGipBodyModel.estimateSkeleton output
     * @param {{cadence?:number, strideScale?:number, fs?:number, noise?:number, seed?:number}} [opts]
     */
    constructor(skeleton, opts) {
      const o = opts || {};
      this.skeleton = skeleton;
      this.cadence = o.cadence > 0 ? o.cadence : 110;      // steps/min
      this.strideScale = o.strideScale > 0 ? o.strideScale : 1;
      this.fs = o.fs > 0 ? o.fs : 100;
      this.noise = Number.isFinite(o.noise) ? o.noise : 0.03;
      this.rnd = mulberry32(o.seed || 12345);
      this.periodMs = 120000 / this.cadence;               // one full cycle (2 steps)
      // Prescribed stride (metres advanced per full gait cycle). Comfortable adult
      // stride ~0.83*H; scaled by the requested stride factor. This is the ground
      // truth the ZUPT estimate is checked against.
      this.strideLength = skeleton.preferredStride * this.strideScale;
      this.speed = this.strideLength / (this.periodMs / 1000);
      this.swingLift = 0.12;                                // foot clearance (m)
      this.stanceFraction = 0.62;                           // toe-off at ~62%
      this.reset();
    }
    reset() {
      this.t = 0;
      this.hist = { left: [], right: [] };
    }
    // Analytically-planted world foot position: fixed during stance (no skating),
    // smooth forward swing arc to the next plant during swing.
    _footWorld(phase, plantX, side) {
      let x, z;
      if (phase < this.stanceFraction) {
        x = plantX; z = 0;
      } else {
        const sf = (phase - this.stanceFraction) / (1 - this.stanceFraction);
        x = plantX + this.strideLength * smoothstep(sf);
        z = this.swingLift * Math.sin(Math.PI * sf);
      }
      return { x: x, y: side * this.skeleton.segments.hipWidth / 2, z: z };
    }
    _footImu(side, world, pitch, phase, dt) {
      const h = this.hist[side];
      h.push({ pos: world, pitch: pitch });
      if (h.length > 3) h.shift();
      let acc = { x: 0, y: 0, z: 0 };
      let gyroY = 0;
      if (h.length === 3) {
        const p0 = h[0].pos, p1 = h[1].pos, p2 = h[2].pos;
        acc = {
          x: (p2.x - 2 * p1.x + p0.x) / (dt * dt),
          y: (p2.y - 2 * p1.y + p0.y) / (dt * dt),
          z: (p2.z - 2 * p1.z + p0.z) / (dt * dt)
        };
        gyroY = ((h[2].pitch - h[1].pitch) / dt) * DEG;
      }
      const accWorldG = { x: acc.x / G, y: acc.y / G, z: acc.z / G + 1 };
      const q = quatAboutY(pitch);
      const accSensor = rotateByQuat(conj(q), accWorldG);
      const nz = () => (this.rnd() - 0.5) * this.noise;
      return {
        acc: { x: accSensor.x + nz(), y: accSensor.y + nz(), z: accSensor.z + nz() },
        gyro: { x: nz() * 30, y: gyroY + nz() * 30, z: nz() * 30 },
        quat: q,
        press: pressureFromPhase(phase, this.rnd)
      };
    }
    /** Advance one frame. Returns the ground truth + both feet's synthetic IMU. */
    step() {
      const dt = 1 / this.fs; // s
      this.t += dt * 1000;
      const prog = this.t / this.periodMs;
      const phaseL = prog % 1;
      const phaseR = (prog + 0.5) % 1;
      // successive same-foot plants are one stride apart; L/R interleaved by half a stride
      const plantXL = Math.floor(prog) * this.strideLength;
      const plantXR = Math.floor(prog + 0.5) * this.strideLength + this.strideLength / 2;

      const footL = this._footWorld(phaseL, plantXL, +1);
      const footR = this._footWorld(phaseR, plantXR, -1);
      const pitchL = (Pose.angleAt(Pose.ANKLE, phaseL) * Math.PI) / 180;
      const pitchR = (Pose.angleAt(Pose.ANKLE, phaseR) * Math.PI) / 180;

      const tread = Pose.reconstruct(this.skeleton, { phaseL: phaseL, phaseR: phaseR, strideScale: this.strideScale, rootX: 0 });
      const left = this._footImu('left', footL, pitchL, phaseL, dt);
      const right = this._footImu('right', footR, pitchR, phaseR, dt);

      return {
        t: this.t,
        phaseL: phaseL,
        phaseR: phaseR,
        gtPose: tread,
        gtRootX: this.speed * (this.t / 1000),
        gtFootL: footL,
        gtFootR: footR,
        strideLength: this.strideLength,
        cadence: this.cadence,
        speed: this.speed,
        left: Object.assign({ t: this.t }, left),
        right: Object.assign({ t: this.t }, right)
      };
    }
    /** Convenience: produce `seconds` of frames as an array (for tests / batch). */
    sequence(seconds) {
      const frames = [];
      const n = Math.round(seconds * this.fs);
      for (let i = 0; i < n; i++) frames.push(this.step());
      return frames;
    }
  }

  const Synthetic = { Walker: Walker, pressureFromPhase: pressureFromPhase };

  if (typeof global.OrpheGipSynthetic === 'undefined') {
    global.OrpheGipSynthetic = Synthetic;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Synthetic;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
