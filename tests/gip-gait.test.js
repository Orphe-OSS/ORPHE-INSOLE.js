// Unit tests for the GIP gait-poser experiment (experiments/gip-gait-poser/gip/*).
// Validates the pure modules and the closed loop: synthetic foot-IMU generated from a
// known ground-truth gait must be recovered (stride length, cadence) by the Gait Module.
const assert = require('node:assert/strict');

const BodyModel = require('../experiments/gip-gait-poser/gip/body-model.js');
const Pose = require('../experiments/gip-gait-poser/gip/pose.js');
const Smoothing = require('../experiments/gip-gait-poser/gip/smoothing.js');
const Gait = require('../experiments/gip-gait-poser/gip/gait-module.js');
const Synthetic = require('../experiments/gip-gait-poser/gip/synthetic.js');

function main() {
  // ── Body Module: anthropometric proportions ──────────────────────────
  {
    const sk = BodyModel.estimateSkeleton({ heightCm: 170, weightKg: 62, age: 35, gender: 'neutral' });
    assert.equal(sk.heightM, 1.7);
    approx(sk.segments.thigh, 0.245 * 1.7, 1e-6, 'thigh = 0.245H');
    approx(sk.segments.shank, 0.246 * 1.7, 1e-6, 'shank = 0.246H');
    approx(sk.segments.trunk, 0.288 * 1.7, 1e-6, 'trunk = 0.288H');
    approx(sk.hipHeight, 0.530 * 1.7, 1e-6, 'hip height = 0.530H');
    assert.ok(sk.legLength > 0.8 && sk.legLength < 1.0, 'plausible leg length');
    // taller subject -> longer segments
    const tall = BodyModel.estimateSkeleton({ heightCm: 190 });
    assert.ok(tall.segments.thigh > sk.segments.thigh);
  }

  // ── Pose: standing-ish reconstruction is grounded and upright ─────────
  {
    const sk = BodyModel.estimateSkeleton({ heightCm: 170 });
    const p = Pose.reconstruct(sk, { phaseL: 0, phaseR: 0.5, strideScale: 1 });
    assert.ok(p.rootHeight > 0.7 && p.rootHeight < 1.0, 'pelvis at plausible height');
    // lowest foot rests on/above the ground
    const feetZ = [p.joints.ankleL.z, p.joints.ankleR.z, p.joints.toeL.z, p.joints.toeR.z];
    assert.ok(Math.min(...feetZ) > -0.02, 'no foot punches through the floor');
    assert.ok(p.joints.head.z > p.joints.pelvis.z, 'head above pelvis');
    assert.equal(p.bones.length, 17, 'full skeleton bone count');
  }
  // periodic angle interpolation wraps cleanly
  approx(Pose.angleAt(Pose.HIP, 0), Pose.angleAt(Pose.HIP, 1), 1e-9, 'HIP curve periodic');

  // ── Smoothing: Butterworth passes DC, C2 smooths, contact clamps z ────
  {
    const dc = new Array(200).fill(3.0);
    const out = Smoothing.lowpassFiltfilt(dc, 10, 100);
    approx(out[100], 3.0, 1e-6, 'DC passes low-pass');
    // high-frequency noise is attenuated
    const noisy = [];
    for (let i = 0; i < 200; i++) noisy.push(1 + (i % 2 === 0 ? 1 : -1));
    const filt = Smoothing.lowpassFiltfilt(noisy, 10, 100);
    const va = variance(noisy), vb = variance(filt);
    assert.ok(vb < va * 0.2, 'alternating noise attenuated');
    // C2 smoother reduces roughness
    const c2 = Smoothing.smoothC2(noisy, { iterations: 20, lambda: 0.3 });
    assert.ok(variance(c2) < va, 'C2 reduces variance');
    // contact constraint pins z=0 and freezes x during contact
    const traj = { x: [0, 1, 2, 3], y: [0, 0, 0, 0], z: [0.1, 0.2, 0.05, 0.0] };
    const mask = [true, true, false, false];
    const cc = Smoothing.applyFootContactConstraints(traj, mask);
    assert.equal(cc.z[0], 0); assert.equal(cc.z[1], 0);
    assert.equal(cc.x[1], cc.x[0], 'foot frozen during contact');
  }

  // ── Gait Module: events + pressure stance hysteresis ─────────────────
  {
    const contact = [false, true, true, false, false, true, true];
    assert.deepEqual(Gait.heelStrikeIndices(contact), [1, 5]);
    const press = [
      [0, 0, 0, 0, 0, 0],       // below on
      [300, 300, 300, 0, 0, 300], // total 1200 == on(1200) -> not > on, stays off
      [400, 400, 400, 0, 0, 400], // total 1600 > 1200 -> contact
      [300, 300, 200, 0, 0, 100], // total 900 (700<900<1200) -> stays contact (hysteresis)
      [100, 100, 0, 0, 0, 0]      // total 200 < 700 -> off
    ];
    const mask = Gait.stanceFromPressure(press, { on: 1200, off: 700 });
    assert.deepEqual(mask, [false, false, true, true, false]);
  }

  // ── Closed loop: synthetic IMU -> Gait Module recovers gait params ────
  {
    const sk = BodyModel.estimateSkeleton({ heightCm: 172, weightKg: 68, gender: 'male' });
    const cadence = 108;
    const walker = new Synthetic.Walker(sk, { cadence: cadence, strideScale: 1.0, fs: 200, seed: 7, noise: 0.02 });
    const frames = walker.sequence(8); // 8 s
    const leftSamples = frames.map((f) => f.left);
    const gt = walker.strideLength;
    const res = Gait.analyzeFoot(leftSamples, {}); // default: quaternion (mode-4) path

    assert.ok(res.heelStrikes.length >= 5, 'detected multiple strides, got ' + res.heelStrikes.length);
    approx(res.cadence, cadence, 12, 'cadence recovered (steps/min)');
    // ZUPT stride length should closely match ground truth on the quaternion path
    assert.ok(res.strideLength > 0.8 * gt && res.strideLength < 1.2 * gt,
      `stride length within 20%: est=${res.strideLength.toFixed(2)} gt=${gt.toFixed(2)}`);
    // gyro-only fallback (streaming mode 3, no quaternion) stays in the right ballpark
    const resGyro = Gait.analyzeFoot(leftSamples, { useQuat: false });
    assert.ok(resGyro.strideLength > 0.6 * gt && resGyro.strideLength < 1.4 * gt,
      `gyro-path stride: est=${resGyro.strideLength.toFixed(2)} gt=${gt.toFixed(2)}`);
    assert.ok(res.stanceRatio > 0.45 && res.stanceRatio < 0.8, 'stance ratio plausible: ' + res.stanceRatio.toFixed(2));

    // FootTracker (online) produces per-stride results too
    const tracker = new Gait.FootTracker({});
    let strides = 0;
    for (const s of leftSamples) { if (tracker.push(s)) strides++; }
    assert.ok(strides >= 4, 'online tracker closed strides: ' + strides);
    assert.ok(Number.isFinite(tracker.cadence), 'tracker cadence finite');

    console.log(`[gip] cadence est=${res.cadence.toFixed(1)} gt=${cadence} | ` +
      `stride est=${res.strideLength.toFixed(2)}m gt=${gt.toFixed(2)}m | ` +
      `strides=${res.heelStrikes.length} stanceRatio=${res.stanceRatio.toFixed(2)} online=${strides}`);
  }

  console.log('gip-gait.test.js: all assertions passed');
}

function approx(actual, expected, tol, msg) {
  assert.ok(Math.abs(actual - expected) <= tol, `${msg || 'approx'}: |${actual} - ${expected}| > ${tol}`);
}
function variance(arr) {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((a, b) => a + (b - m) * (b - m), 0) / arr.length;
}

main();
