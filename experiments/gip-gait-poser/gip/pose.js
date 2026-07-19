/**
 * GIP full-body reconstruction (gait-aware kinematics).
 *
 * Paper: GIP's Gait Module regresses per-frame 6D joint angles from the two shoe
 * IMUs (learned Transformer), then forward-kinematics through the SMPL skeleton give
 * full-body joint positions. The reconstruction is deliberately restricted to
 * straight-line walking, which is periodic.
 *
 * Without the released weights we reproduce the same OUTPUT (a full-body walking pose
 * per frame) by driving a normative-gait joint-angle template with the *measured*
 * gait parameters from the Gait Module: each foot's cycle phase (timing/asymmetry),
 * the ZUPT stride length (step amplitude), cadence and speed, plus the personalized
 * skeleton from the Body Module. Sagittal hip/knee/ankle curves are Winter's normal
 * adult gait data; arm swing is anti-phase to the ipsilateral leg. This yields a
 * gait-aware pose that tracks the real measurement, which is exactly the paper's goal
 * — the learned network is replaced by a measurement-driven template.
 *
 * Frame: x = forward (walking direction), y = left, z = up.  Pure — no DOM.
 */
(function (global) {
  'use strict';

  const DEG = Math.PI / 180;

  // Normative sagittal-plane joint angles over the gait cycle (0% = heel strike),
  // degrees. Hip/knee +flexion, ankle +dorsiflexion. Winter, normal adult walking
  // (~105 steps/min); toe-off ~60-62%. Values are ±~5deg template targets.
  const HIP = [[0, 25], [10, 20], [20, 12], [30, 3], [40, -5], [50, -10], [60, -3], [70, 15], [80, 25], [90, 30], [100, 25]];
  const KNEE = [[0, 3], [10, 18], [20, 12], [30, 6], [40, 6], [50, 12], [60, 38], [70, 60], [80, 50], [90, 20], [100, 3]];
  const ANKLE = [[0, 0], [10, -5], [20, 0], [30, 5], [40, 10], [50, 8], [60, -16], [70, -5], [80, 0], [90, 0], [100, 0]];

  /** Linear interpolation over keyframes [[pct,val],...] at phase in [0,1). */
  function angleAt(curve, phase) {
    const p = ((phase % 1) + 1) % 1 * 100;
    for (let i = 1; i < curve.length; i++) {
      if (p <= curve[i][0]) {
        const [p0, v0] = curve[i - 1];
        const [p1, v1] = curve[i];
        const f = (p - p0) / (p1 - p0 || 1);
        return v0 + f * (v1 - v0);
      }
    }
    return curve[curve.length - 1][1];
  }

  function add(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }

  // A segment of `length` at absolute sagittal angle `theta` (from straight-down),
  // lateral offset preserved. theta>0 tilts the far end toward +x (forward).
  function segEnd(start, theta, length) {
    return { x: start.x + Math.sin(theta) * length, y: start.y, z: start.z - Math.cos(theta) * length };
  }

  /**
   * Reconstruct a full-body pose for the current frame.
   * @param {object} skeleton  output of OrpheGipBodyModel.estimateSkeleton
   * @param {object} params
   *   phaseL, phaseR : each foot's cycle phase in [0,1)
   *   strideScale    : measuredStride / preferredStride (clamped 0.5..1.5)
   *   rootX          : forward position of the pelvis (m), default 0 (treadmill view)
   *   armSwing       : arm-swing amplitude scale, default 1
   * @returns {{joints:Object, bones:Array, rootHeight:number}}
   */
  function reconstruct(skeleton, params) {
    const s = skeleton.segments;
    const p = params || {};
    const phaseL = Number.isFinite(p.phaseL) ? p.phaseL : 0;
    const phaseR = Number.isFinite(p.phaseR) ? p.phaseR : 0.5;
    const strideScale = clamp(Number.isFinite(p.strideScale) ? p.strideScale : 1, 0.5, 1.5);
    const armSwing = Number.isFinite(p.armSwing) ? p.armSwing : 1;
    const rootX = Number.isFinite(p.rootX) ? p.rootX : 0;

    // --- legs, computed relative to the pelvis centre (root at origin first) ---
    const half = s.hipWidth / 2;
    function leg(sign, phase) {
      const hip = { x: 0, y: sign * half, z: 0 };
      const hipA = angleAt(HIP, phase) * strideScale * DEG;
      const kneeA = angleAt(KNEE, phase) * DEG;
      const ankleA = angleAt(ANKLE, phase) * DEG;
      const thighEnd = segEnd(hip, hipA, s.thigh);            // knee
      const shankAbs = hipA - kneeA;                          // knee flexes shank back
      const ankle = segEnd(thighEnd, shankAbs, s.shank);
      // foot: forward of the ankle by footLength, tilted by ankle dorsi/plantarflexion
      const toe = {
        x: ankle.x + s.footLength * Math.cos(ankleA),
        y: ankle.y,
        z: ankle.z + s.footLength * Math.sin(ankleA)
      };
      return { hip: hip, knee: thighEnd, ankle: ankle, toe: toe };
    }
    const L = leg(+1, phaseL);
    const R = leg(-1, phaseR);

    // pelvis vertical position so the lower foot rests on the ground (z = 0)
    const lowest = Math.min(L.ankle.z - s.ankleHeight, R.ankle.z - s.ankleHeight);
    const rootHeight = -lowest;

    const root = { x: rootX, y: 0, z: rootHeight };
    const off = (pt) => add(pt, root);

    // --- upper body ---
    const pelvis = { x: rootX, y: 0, z: rootHeight };
    const spine = { x: rootX, y: 0, z: rootHeight + s.trunk * 0.55 };
    const neck = { x: rootX, y: 0, z: rootHeight + s.trunk };
    const head = { x: rootX, y: 0, z: rootHeight + s.trunk + s.headNeck };
    const shHalf = s.shoulderWidth / 2;

    function arm(sign, legPhase) {
      // arm swings anti-phase to the ipsilateral leg
      const shoulder = { x: rootX, y: sign * shHalf, z: rootHeight + s.trunk * 0.95 };
      const swing = -25 * armSwing * Math.cos(2 * Math.PI * legPhase) * DEG;
      const elbow = segEnd(shoulder, swing, s.upperArm);
      const wrist = segEnd(elbow, swing - 20 * DEG, s.forearm); // slight constant elbow flex
      return { shoulder: shoulder, elbow: elbow, wrist: wrist };
    }
    const armL = arm(+1, phaseL);
    const armR = arm(-1, phaseR);

    const joints = {
      pelvis: pelvis,
      spine: spine,
      neck: neck,
      head: head,
      hipL: off(L.hip), kneeL: off(L.knee), ankleL: off(L.ankle), toeL: off(L.toe),
      hipR: off(R.hip), kneeR: off(R.knee), ankleR: off(R.ankle), toeR: off(R.toe),
      shoulderL: armL.shoulder, elbowL: armL.elbow, wristL: armL.wrist,
      shoulderR: armR.shoulder, elbowR: armR.elbow, wristR: armR.wrist
    };

    const bones = [
      ['pelvis', 'hipL'], ['pelvis', 'hipR'],
      ['hipL', 'kneeL'], ['kneeL', 'ankleL'], ['ankleL', 'toeL'],
      ['hipR', 'kneeR'], ['kneeR', 'ankleR'], ['ankleR', 'toeR'],
      ['pelvis', 'spine'], ['spine', 'neck'], ['neck', 'head'],
      ['neck', 'shoulderL'], ['shoulderL', 'elbowL'], ['elbowL', 'wristL'],
      ['neck', 'shoulderR'], ['shoulderR', 'elbowR'], ['elbowR', 'wristR']
    ];

    return { joints: joints, bones: bones, rootHeight: rootHeight };
  }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  const Pose = {
    HIP: HIP, KNEE: KNEE, ANKLE: ANKLE,
    angleAt: angleAt,
    reconstruct: reconstruct
  };

  if (typeof global.OrpheGipPose === 'undefined') {
    global.OrpheGipPose = Pose;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pose;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
