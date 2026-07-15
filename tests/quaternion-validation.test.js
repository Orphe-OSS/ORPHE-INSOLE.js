const assert = require('node:assert/strict');
const {
  AngleTracker,
  DeviceAccumulator,
  GapCoincidenceTracker,
  RunningStats,
  compareCommunicationRuns,
  evaluateCommunication,
  evaluateQuaternion,
  evaluateStreamingMode,
  quatNorm,
  serialGap,
  wrappedDeltaDegrees,
} = require('../examples/quaternion-validation/metrics.js');

function near(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

{
  const tracker = new GapCoincidenceTracker([0, 1], 25);
  tracker.add(0, 100);
  tracker.add(1, 120);
  tracker.add(0, 200);
  tracker.add(1, 240);
  const snapshot = tracker.snapshot();
  assert.equal(snapshot.matchedPairs, 1);
  assert.equal(snapshot.devices[0].matchedEvents, 1);
  assert.equal(snapshot.devices[1].matchedEvents, 1);
  near(snapshot.devices[0].matchedPercent, 50, 1e-12, 'gap coincidence device 0');
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
  near(snapshot.rangeDeg, 40, 1e-12, 'yaw range');
  near(snapshot.residualStdDeg, 0, 1e-12, 'linear yaw residual');
  near(snapshot.rSquared, 1, 1e-12, 'linear yaw r squared');
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
  assert.equal(snapshot.gapEvents, 1);
  assert.equal(snapshot.maxGap, 1);
  assert.equal(snapshot.gapHistogram.one, 1);
  near(snapshot.packetIntervalMs.mean, 20, 1e-12, 'packet interval mean');
  near(snapshot.packetLossPercent, 100 / 3, 1e-9, 'packet loss percent');
  near(snapshot.norm.mean, 1, 1e-12, 'norm mean');
  near(snapshot.yaw.deltaDeg, 20, 1e-12, 'device yaw unwrap');
  near(snapshot.gyroZIntegralDeg, 0.3, 1e-12, 'nominal gyro integration');
  near(snapshot.gyroZHostTimeIntegralDeg, 0.2, 1e-12, 'host-time gyro integration');
  near(snapshot.gyroZ.mean, 10, 1e-12, 'gyro z mean');
  near(snapshot.gyroZBiasDegPerMin, 600, 1e-12, 'gyro bias equivalent');
  assert.equal(evaluateQuaternion(snapshot).status, 'warn');
  assert.equal(evaluateCommunication(snapshot).status, 'fail');
}

{
  const accumulator = new DeviceAccumulator(0, 0, 4);
  accumulator.addFrame({ serial: 10, mode: 4 }, 0);
  accumulator.addFrame({ serial: 13, mode: 4 }, 60);
  const snapshot = accumulator.snapshot(100);
  assert.equal(snapshot.lostPackets, 2);
  assert.equal(snapshot.gapEvents, 1);
  assert.equal(snapshot.maxGap, 2);
  assert.equal(snapshot.gapHistogram.twoToThree, 1);
}

{
  const runA = {
    devices: [
      { deviceId: 0, side: 'L', connectionRank: 1, packetLossPercent: 12 },
      { deviceId: 1, side: 'R', connectionRank: 2, packetLossPercent: 2 },
    ],
  };
  const runBSlotOrOrder = {
    devices: [
      { deviceId: 0, side: 'R', connectionRank: 1, packetLossPercent: 13 },
      { deviceId: 1, side: 'L', connectionRank: 2, packetLossPercent: 3 },
    ],
  };
  const runCSlot = {
    devices: [
      { deviceId: 0, side: 'R', connectionRank: 2, packetLossPercent: 14 },
      { deviceId: 1, side: 'L', connectionRank: 1, packetLossPercent: 4 },
    ],
  };
  const runBPhysical = {
    devices: [
      { deviceId: 0, side: 'R', connectionRank: 1, packetLossPercent: 3 },
      { deviceId: 1, side: 'L', connectionRank: 2, packetLossPercent: 13 },
    ],
  };
  const runCPhysical = {
    devices: [
      { deviceId: 0, side: 'R', connectionRank: 2, packetLossPercent: 3 },
      { deviceId: 1, side: 'L', connectionRank: 1, packetLossPercent: 14 },
    ],
  };
  const runCOrder = {
    devices: [
      { deviceId: 0, side: 'R', connectionRank: 2, packetLossPercent: 3 },
      { deviceId: 1, side: 'L', connectionRank: 1, packetLossPercent: 14 },
    ],
  };
  assert.equal(compareCommunicationRuns([runA, runBSlotOrOrder]).kind, 'confounded');
  assert.equal(compareCommunicationRuns([runA, runBSlotOrOrder, runCSlot]).kind, 'follows-slot');
  assert.equal(compareCommunicationRuns([runA, runBPhysical, runCPhysical]).kind, 'follows-physical-side');
  assert.equal(compareCommunicationRuns([runA, runBSlotOrOrder, runCOrder]).kind, 'follows-connection-order');
  assert.equal(compareCommunicationRuns([runA, runA]).kind, 'awaiting-change');
}

{
  const healthy = {
    mode: 3,
    sampleRateHz: 190,
    expectedSampleRateHz: 200,
    packetRateHz: 49,
    expectedPacketRateHz: 50,
    packetLossPercent: 0.5,
    receivedPackets: 100,
    maxGap: 1,
    presence: { press: 380, acc: 380, gyro: 380, quat: 0, euler: 0 },
  };
  assert.equal(evaluateStreamingMode(healthy).status, 'pass');
  assert.equal(evaluateStreamingMode({ ...healthy, sampleRateHz: 175 }).status, 'warn');
  assert.equal(evaluateStreamingMode({ ...healthy, sampleRateHz: 153.8, packetRateHz: 38.9, packetLossPercent: 23.58 }).status, 'fail');
  assert.equal(evaluateStreamingMode({ ...healthy, sampleRateHz: 191.2, packetLossPercent: 5.03 }).status, 'fail');
}

{
  const accumulator = new DeviceAccumulator(1, 0, 4);
  accumulator.addFrame({ serial: 1, mode: 4, quat: { w: 0.5, x: 0, y: 0, z: 0 }, euler: { yaw: 0 } }, 10);
  assert.equal(evaluateQuaternion(accumulator.snapshot(20)).status, 'fail');
}

console.log('quaternion-validation.test.js passed');
