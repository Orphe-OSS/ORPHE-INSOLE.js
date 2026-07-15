const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  WalkComparisonTracker,
  eulerWithoutNormalization,
  expectedSignedDegrees,
  legacyEulerFromFixedQuaternion,
  legacyQuaternionFromFixed,
  normalizedEuler,
  quaternionNorm,
  summarizeWalk,
} = require('../examples/yaw-walk-comparison/comparison.js');
const { DeviceAccumulator } = require('../examples/quaternion-validation/metrics.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'examples/yaw-walk-comparison/index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'examples/yaw-walk-comparison/app.js'), 'utf8');

function near(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

function yawQuaternion(degrees) {
  const radians = degrees * Math.PI / 180;
  return {
    w: Math.cos(radians / 2),
    x: 0,
    y: 0,
    z: Math.sin(radians / 2),
  };
}

{
  const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), match => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'HTML ids must be unique');
  const referencedIds = Array.from(app.matchAll(/\$\('([^']+)'\)/g), match => match[1]);
  referencedIds.forEach(id => assert.ok(ids.includes(id), `app.js references missing #${id}`));
  [0, 1].forEach(deviceId => {
    ['deviceCard', 'deviceTitle', 'deviceDetail', 'connect', 'legend'].forEach(prefix => {
      assert.ok(ids.includes(`${prefix}${deviceId}`), `missing dynamic #${prefix}${deviceId}`);
    });
  });
  assert.match(html, /name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(html, /旧スケール解釈/);
  assert.match(html, /スケール修正後/);
  assert.match(html, /静止ドリフト補正後/);
  assert.match(html, /10秒間動かない/);
  assert.match(html, /id="downloadCsv"/);
  assert.match(html, /src="\.\/comparison\.js"/);
  assert.match(app, /OrpheInsole\.parseSensorValues/);
  assert.match(app, /legacy_yaw_delta_deg/);
  assert.match(app, /corrected_yaw_delta_deg/);
}

{
  const fixed = yawQuaternion(90);
  const legacy = legacyQuaternionFromFixed(fixed);
  near(quaternionNorm(fixed), 1, 1e-12, 'fixed quaternion norm');
  near(quaternionNorm(legacy), 0.5, 1e-12, 'legacy quaternion norm');
  near(normalizedEuler(fixed).yaw * 180 / Math.PI, 90, 1e-12, 'fixed yaw');
  near(legacyEulerFromFixedQuaternion(fixed).yaw * 180 / Math.PI, 18.43494882292201, 1e-12, 'legacy compressed yaw');
}

{
  const unit = yawQuaternion(135);
  const half = legacyQuaternionFromFixed(unit);
  near(eulerWithoutNormalization(half).yaw, legacyEulerFromFixedQuaternion(unit).yaw, 1e-12, 'legacy helper reproduces non-normalized Euler');
}

{
  const tracker = new WalkComparisonTracker();
  tracker.push(yawQuaternion(0), 0);
  assert.equal(tracker.markWalkOrigin(), true);
  for (let degrees = -2; degrees >= -360; degrees -= 2) {
    tracker.push(yawQuaternion(degrees), degrees + 4);
  }
  const snapshot = tracker.snapshot();
  near(snapshot.fixed.deltaDeg, -360, 1e-9, 'fixed yaw unwraps one clockwise loop');
  near(snapshot.corrected.deltaDeg, -356, 1e-9, 'corrected yaw is tracked independently');
  assert.ok(snapshot.legacy.rangeDeg < 40, `legacy range should remain compressed, got ${snapshot.legacy.rangeDeg}`);
  assert.ok(Math.abs(snapshot.legacy.deltaDeg) < 1e-9, `legacy final delta should return near zero, got ${snapshot.legacy.deltaDeg}`);

  const summary = summarizeWalk(snapshot, -360);
  near(summary.fixedErrorDeg, 0, 1e-9, 'fixed error');
  near(summary.correctedErrorDeg, 4, 1e-9, 'corrected error');
  near(summary.errorChangeDeg, -4, 1e-9, 'negative improvement when correction worsens result');
}

{
  const accumulator = new DeviceAccumulator(0, 0, 4, {
    adaptiveBias: {
      enabled: true,
      gyroThresholdDegPerSecond: 4,
      accToleranceG: 0.12,
      stationaryDwellMs: 500,
      biasTimeConstantMs: 3000,
    },
  });
  const tracker = new WalkComparisonTracker();
  const biasRateDegPerSecond = -1;
  for (let elapsedMs = 0; elapsedMs <= 10000; elapsedMs += 10) {
    const yawDeg = biasRateDegPerSecond * elapsedMs / 1000;
    const frame = {
      mode: 4,
      timestamp: elapsedMs,
      serial: Math.floor(elapsedMs / 20),
      packetNumber: (elapsedMs / 10) % 2,
      quat: yawQuaternion(yawDeg),
      euler: { pitch: 0, roll: 0, yaw: yawDeg * Math.PI / 180 },
      gyro: { x: 0, y: 0, z: biasRateDegPerSecond },
      acc: { x: 0, y: 0, z: 1 },
      press: [1, 1, 1, 1, 1, 1],
    };
    const analysis = accumulator.addFrame(frame, elapsedMs);
    tracker.push(frame.quat, analysis.adaptiveYawBias.observedCorrectedYaw.endDeg);
  }
  assert.equal(accumulator.snapshot(10000).adaptiveYawBias.observedYawReady, true, 'stationary calibration should become ready');
  assert.equal(tracker.markWalkOrigin(), true, 'calibrated tracker should mark walk origin');

  for (let walkMs = 10; walkMs <= 12000; walkMs += 10) {
    const elapsedMs = 10000 + walkMs;
    const yawDeg = -10 - 720 * walkMs / 12000 + biasRateDegPerSecond * walkMs / 1000;
    const frame = {
      mode: 4,
      timestamp: elapsedMs,
      serial: Math.floor(elapsedMs / 20),
      packetNumber: (elapsedMs / 10) % 2,
      quat: yawQuaternion(yawDeg),
      euler: { pitch: 0, roll: 0, yaw: yawDeg * Math.PI / 180 },
      gyro: { x: 0, y: 0, z: -61 },
      acc: { x: 0.1, y: 0, z: 1 },
      press: [1, 1, 1, 1, 1, 1],
    };
    const analysis = accumulator.addFrame(frame, elapsedMs);
    tracker.push(frame.quat, analysis.adaptiveYawBias.observedCorrectedYaw.endDeg);
  }

  const summary = summarizeWalk(tracker.snapshot(), -720);
  near(summary.fixedDeltaDeg, -732, 0.05, 'raw yaw includes calibrated stationary drift');
  near(summary.correctedDeltaDeg, -720, 0.1, 'observed-yaw correction removes calibrated drift');
  assert.ok(summary.legacyRangeDeg < 40, `legacy two-loop range remains compressed, got ${summary.legacyRangeDeg}`);
  assert.ok(summary.errorChangeDeg > 11.8, `correction should reduce error by about 12 degrees, got ${summary.errorChangeDeg}`);
}

{
  assert.equal(expectedSignedDegrees(1, 'CW'), -360);
  assert.equal(expectedSignedDegrees(2, 'CCW'), 720);
  assert.equal(expectedSignedDegrees(0, 'CW'), -360);
}

console.log('yaw walk comparison tests passed');
