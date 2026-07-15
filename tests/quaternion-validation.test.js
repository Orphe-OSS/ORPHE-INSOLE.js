const assert = require('node:assert/strict');
const {
  AngleTracker,
  DeviceAccumulator,
  RunningStats,
  evaluateQuaternion,
  quatNorm,
  serialGap,
  wrappedDeltaDegrees,
} = require('../examples/quaternion-validation/metrics.js');

function near(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

{
  const stats = new RunningStats();
  [1, 2, 3, 4].forEach(value => stats.push(value));
  const snapshot = stats.snapshot();
  assert.equal(snapshot.count, 4);
  near(snapshot.mean, 2.5, 1e-12, 'running mean');
  near(snapshot.std, Math.sqrt(1.25), 1e-12, 'population std');
  assert.equal(snapshot.min, 1);
  assert.equal(snapshot.max, 4);
}

{
  assert.equal(wrappedDeltaDegrees(-170, 170), 20);
  assert.equal(wrappedDeltaDegrees(170, -170), -20);
  const yaw = new AngleTracker();
  yaw.push(170, 0);
  yaw.push(-170, 1000);
  yaw.push(-150, 2000);
  const snapshot = yaw.snapshot();
  near(snapshot.deltaDeg, 40, 1e-12, 'unwrapped yaw delta');
  near(snapshot.driftDegPerMin, 1200, 1e-9, 'yaw regression slope');
}

{
  assert.equal(serialGap(0, 65535), 0);
  assert.equal(serialGap(13, 10), 2);
  assert.equal(serialGap(10, 10), 0);
  assert.equal(serialGap(40000, 100), null);
}

{
  near(quatNorm({ w: Math.SQRT1_2, x: 0, y: 0, z: Math.SQRT1_2 }), 1, 1e-12, 'quat norm');
  assert.equal(quatNorm({ w: NaN, x: 0, y: 0, z: 1 }), null);
}

{
  const accumulator = new DeviceAccumulator(0, 1000, 4);
  const base = {
    mode: 4,
    quat: { w: 1, x: 0, y: 0, z: 0 },
    euler: { yaw: 170 * Math.PI / 180 },
    gyro: { z: 10 },
    press: [1, 2, 3, 4, 5, 6],
    acc: { x: 0, y: 0, z: 1 },
  };
  accumulator.addFrame({ ...base, serial: 65535, packetNumber: 0 }, 1000);
  accumulator.addFrame({ ...base, serial: 65535, packetNumber: 1 }, 1010);
  accumulator.addFrame({ ...base, serial: 1, packetNumber: 0, euler: { yaw: -170 * Math.PI / 180 } }, 1020);
  const snapshot = accumulator.snapshot(1030);
  assert.equal(snapshot.samples, 3);
  assert.equal(snapshot.receivedPackets, 2);
  assert.equal(snapshot.lostPackets, 1);
  near(snapshot.packetLossPercent, 100 / 3, 1e-9, 'packet loss percent');
  near(snapshot.norm.mean, 1, 1e-12, 'norm mean');
  near(snapshot.yaw.deltaDeg, 20, 1e-12, 'device yaw unwrap');
  near(snapshot.gyroZIntegralDeg, 0.3, 1e-12, 'nominal gyro integration');
  assert.equal(evaluateQuaternion(snapshot).status, 'warn');
}

{
  const accumulator = new DeviceAccumulator(1, 0, 4);
  accumulator.addFrame({ serial: 1, mode: 4, quat: { w: 0.5, x: 0, y: 0, z: 0 }, euler: { yaw: 0 } }, 10);
  assert.equal(evaluateQuaternion(accumulator.snapshot(20)).status, 'fail');
}

console.log('quaternion-validation.test.js passed');
