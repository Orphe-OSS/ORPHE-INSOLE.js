const assert = require('node:assert/strict');
const {
  AdaptiveYawBiasTracker,
  AngleTracker,
  DeviceAccumulator,
  GapCoincidenceTracker,
  RunningStats,
  compareCommunicationRuns,
  connectionCoverage,
  evaluateCommunication,
  evaluateQuaternion,
  evaluateStatic,
  evaluateStreamingMode,
  evaluateYawDrift,
  quatNorm,
  quaternionToEuler,
  serialGap,
  wrappedDeltaDegrees,
  yawRateFromGyroBias,
} = require('../examples/quaternion-validation/metrics.js');

function near(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

{
  const euler = quaternionToEuler({
    w: 0.7501220703125,
    x: 0.039794921875,
    y: 0.0106201171875,
    z: -0.659912109375,
  });
  near(euler.pitch, 0.06851801278422916, 2e-5, 'known quaternion pitch');
  near(euler.roll, 0.045815136890290264, 2e-5, 'known quaternion roll');
  near(euler.yaw, -1.441445715336655, 2e-4, 'known quaternion yaw');
  assert.equal(quaternionToEuler({ w: 0, x: 0, y: 0, z: 0 }), null);
}

{
  const uninterrupted = connectionCoverage([], 0, 1000);
  near(uninterrupted.connectionCoveragePercent, 100, 1e-12, 'uninterrupted coverage');
  const partial = connectionCoverage([
    { type: 'disconnect', deviceId: 0, elapsedMs: 200 },
    { type: 'reconnect', deviceId: 0, elapsedMs: 500 },
    { type: 'disconnect', deviceId: 0, elapsedMs: 900 },
    { type: 'disconnect', deviceId: 1, elapsedMs: 100 },
  ], 0, 1000);
  near(partial.connectedDurationMs, 600, 1e-12, 'partial connected duration');
  near(partial.connectionCoveragePercent, 60, 1e-12, 'partial connection coverage');
  assert.equal(partial.disconnects, 2);
  assert.equal(partial.reconnects, 1);
  assert.equal(partial.connectedAtEnd, false);
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
  near(yawRateFromGyroBias({ x: 0, y: 0, z: 1 }, { roll: Math.PI / 3, pitch: 0 }), 0.5, 1e-12, 'bias projected to Euler yaw rate');
  assert.equal(yawRateFromGyroBias({ x: 0, y: 0, z: 1 }, { roll: 0, pitch: Math.PI / 2 }), null);
}

{
  const tracker = new AdaptiveYawBiasTracker({
    stationaryDwellMs: 500,
    biasTimeConstantMs: 1000,
  });
  for (let elapsedMs = 0; elapsedMs <= 60000; elapsedMs += 100) {
    const yawDeg = 1.2 * elapsedMs / 1000;
    tracker.addFrame({
      mode: 4,
      timestamp: elapsedMs,
      gyro: { x: 0.1, y: -0.2, z: 1.2 },
      acc: { x: 0, y: 0, z: 1 },
      euler: { pitch: 0, roll: 0, yaw: yawDeg * Math.PI / 180 },
    }, elapsedMs);
  }
  const snapshot = tracker.snapshot();
  assert.equal(snapshot.ready, true);
  assert.equal(snapshot.state, 'updating');
  near(snapshot.bias.x, 0.1, 1e-9, 'adaptive gyro x bias');
  near(snapshot.bias.y, -0.2, 1e-9, 'adaptive gyro y bias');
  near(snapshot.bias.z, 1.2, 1e-9, 'adaptive gyro z bias');
  near(snapshot.correctedYaw.deltaDeg, 0, 1e-8, 'constant bias corrected yaw delta');
  near(snapshot.correctedYaw.driftDegPerMin, 0, 0.02, 'constant bias corrected yaw drift');
  near(snapshot.observedCorrectedYaw.deltaDeg, 0, 1e-8, 'observed yaw bias corrected yaw delta');
}

{
  const tracker = new AdaptiveYawBiasTracker({
    stationaryDwellMs: 500,
    biasTimeConstantMs: 1000,
  });
  for (let elapsedMs = 0; elapsedMs <= 60000; elapsedMs += 100) {
    const yawDeg = 1.0 * elapsedMs / 1000;
    tracker.addFrame({
      mode: 4,
      timestamp: elapsedMs,
      gyro: { x: 0, y: 0, z: 1.2 },
      acc: { x: 0, y: 0, z: 1 },
      euler: { pitch: 0, roll: 0, yaw: yawDeg * Math.PI / 180 },
    }, elapsedMs);
  }
  const snapshot = tracker.snapshot();
  assert.equal(snapshot.observedYawReady, true);
  near(snapshot.observedYawBiasRateDegPerSecond, 1, 1e-9, 'observed yaw drift rate');
  near(snapshot.correctedYaw.driftDegPerMin, -12, 0.02, 'gyro projection exposes scale mismatch');
  near(snapshot.observedCorrectedYaw.driftDegPerMin, 0, 0.02, 'observed yaw correction handles scale mismatch');
}

{
  const tracker = new AdaptiveYawBiasTracker({ stationaryDwellMs: 500 });
  for (let elapsedMs = 0; elapsedMs <= 4000; elapsedMs += 100) {
    const moving = elapsedMs > 2000;
    const yawDeg = moving
      ? -4 - 92 * (elapsedMs - 2000) / 1000
      : -2 * elapsedMs / 1000;
    tracker.addFrame({
      mode: 4,
      timestamp: elapsedMs,
      gyro: { x: 0, y: 0, z: moving ? -92 : -2 },
      acc: { x: 0, y: 0, z: 1 },
      euler: { pitch: 0, roll: 0, yaw: yawDeg * Math.PI / 180 },
    }, elapsedMs);
  }
  const snapshot = tracker.snapshot();
  assert.equal(snapshot.ready, true);
  assert.equal(snapshot.state, 'holding');
  near(snapshot.bias.z, -2, 1e-9, 'movement holds learned bias');
  near(snapshot.correctedYaw.deltaDeg, -180, 1e-8, 'learned bias removed during rotation');
  near(snapshot.observedYawBiasRateDegPerSecond, -2, 1e-9, 'movement holds observed yaw bias');
  near(snapshot.observedCorrectedYaw.deltaDeg, -180, 1e-8, 'observed yaw bias removed during rotation');
}

{
  const tracker = new AdaptiveYawBiasTracker({ stationaryDwellMs: 200 });
  for (let elapsedMs = 0; elapsedMs <= 1000; elapsedMs += 100) {
    tracker.addFrame({
      mode: 4,
      timestamp: elapsedMs,
      gyro: { x: 0, y: 0, z: 1 },
      acc: { x: 0, y: 0, z: 1.4 },
      euler: { pitch: 0, roll: 0, yaw: 0 },
    }, elapsedMs);
  }
  const snapshot = tracker.snapshot();
  assert.equal(snapshot.ready, false);
  assert.equal(snapshot.state, 'waiting');
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
  assert.equal(snapshot.gyroReferencedYaw.count, 3);
  near(snapshot.observedDurationMs, 20, 1e-12, 'observed duration');
  near(snapshot.completionPercent, 200 / 3, 1e-9, 'measurement completion');
  near(snapshot.coveragePercent, 200 / 3, 1e-9, 'measurement coverage');
  assert.equal(evaluateQuaternion(snapshot).status, 'warn');
  assert.equal(evaluateQuaternion(snapshot, { ignoreCommunication: true }).status, 'pass');
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
  const accumulator = new DeviceAccumulator(0, 0, 4);
  const frame = { mode: 4, euler: { yaw: 0 }, gyro: { z: 1 } };
  accumulator.addFrame({ ...frame, timestamp: 1000 }, 0);
  accumulator.addFrame({ ...frame, timestamp: 999 }, 10);
  const snapshot = accumulator.snapshot(20);
  assert.equal(snapshot.deviceClockResets, 1);
  assert.equal(snapshot.yawDeviceClock.count, 1);
  near(snapshot.gyroZDeviceTimeIntegralDeg, 0, 1e-12, 'backward device clock excluded from integration');
}

{
  const accumulator = new DeviceAccumulator(0, 0, 4);
  for (let second = 0; second <= 600; second += 1) {
    const yawDeg = -0.2 * second;
    accumulator.addFrame({
      serial: second,
      mode: 4,
      timestamp: second * 1000,
      euler: { yaw: yawDeg * Math.PI / 180 },
      gyro: { z: -0.2 },
    }, second * 1000);
  }
  const snapshot = accumulator.snapshot(601000);
  assert.equal(snapshot.driftWindows5Min.length, 3);
  near(snapshot.hostToDeviceDurationRatio, 1, 1e-12, 'host/device clock duration ratio');
  near(snapshot.yawDeviceClock.driftDegPerMin, -12, 1e-9, 'device-clock yaw drift');
  near(snapshot.gyroReferencedYawDeviceClock.driftDegPerMin, 0, 1e-9, 'device-clock gyro-referenced drift');
  near(snapshot.driftWindows5Min[0].yawDriftDegPerMin, -12, 1e-9, 'first window yaw drift');
  near(snapshot.driftWindows5Min[1].gyroZBiasDegPerMin, -12, 1e-9, 'second window gyro bias');
  near(snapshot.driftWindows5Min[1].gyroReferencedYawDriftDegPerMin, 0, 1e-9, 'window gyro-referenced drift');
  const evaluation = evaluateYawDrift(snapshot);
  assert.equal(evaluation.windowCount, 2);
  assert.equal(evaluation.windowStable, true);
  near(evaluation.fixedCalibration.postYawCalibrationResidual.maxAbsDegPerMin, 0, 1e-9, 'stable fixed yaw calibration');
  near(evaluation.fixedCalibration.postGyroCalibrationResidual.maxAbsDegPerMin, 0, 1e-9, 'stable fixed gyro calibration');
}

{
  const accumulator = new DeviceAccumulator(0, 0, 4);
  for (let window = 0; window <= 288; window += 1) {
    const elapsedMs = window * 5 * 60 * 1000;
    accumulator.addFrame({
      mode: 4,
      timestamp: elapsedMs,
      euler: { yaw: 0 },
      gyro: { z: 0 },
    }, elapsedMs);
  }
  const snapshot = accumulator.snapshot(288 * 5 * 60 * 1000);
  assert.equal(snapshot.driftWindows5Min.length, 288);
  assert.equal(snapshot.driftWindowsTruncated, true);
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
  const stableBias = {
    durationMs: 180000,
    observedDurationMs: 179000,
    yaw: { driftDegPerMin: -54, residualStdDeg: 1, rSquared: 0.9998 },
    gyroZBiasDegPerMin: -50,
  };
  const stable = evaluateYawDrift(stableBias);
  assert.equal(stable.kind, 'gyro-bias-dominant');
  near(stable.yawToGyroScaleRatio, 1.08, 1e-12, 'yaw to gyro scale ratio');
  near(stable.differenceDegPerMin, -4, 1e-12, 'yaw minus gyro drift');
  const integrated = evaluateYawDrift({ ...stableBias, gyroReferencedYaw: { driftDegPerMin: -3 } });
  near(integrated.differenceDegPerMin, -3, 1e-12, 'integrated gyro referenced drift');
  assert.equal(integrated.differenceSource, 'host-time-integrated-gyro');
  assert.equal(evaluateYawDrift({ ...stableBias, yaw: { ...stableBias.yaw, residualStdDeg: 20, rSquared: 0.98 } }).kind, 'gyro-bias-time-varying');
  const windowVarying = evaluateYawDrift({
    ...stableBias,
    driftWindows5Min: [
      { durationMs: 299000, yawDriftDegPerMin: -50, gyroZBiasDegPerMin: -46, gyroReferencedYawDriftDegPerMin: -4 },
      { durationMs: 299000, yawDriftDegPerMin: -70, gyroZBiasDegPerMin: -55, gyroReferencedYawDriftDegPerMin: -15 },
    ],
  });
  assert.equal(windowVarying.kind, 'gyro-bias-time-varying');
  assert.equal(windowVarying.windowStable, false);
  near(windowVarying.fixedCalibration.postYawCalibrationResidual.maxAbsDegPerMin, 20, 1e-12, 'varying fixed yaw calibration');
  near(windowVarying.fixedCalibration.postGyroCalibrationResidual.maxAbsDegPerMin, 24, 1e-12, 'varying fixed gyro calibration');
  assert.equal(evaluateYawDrift({ ...stableBias, gyroZBiasDegPerMin: -20 }).kind, 'mixed-or-unexplained');
  assert.equal(evaluateYawDrift({ ...stableBias, gyroZBiasDegPerMin: 20 }).kind, 'direction-mismatch');
  assert.equal(evaluateYawDrift({ ...stableBias, observedDurationMs: 30000 }).kind, 'insufficient');
}

{
  const staticSnapshot = {
    mode: 4,
    durationMs: 180000,
    observedDurationMs: 179000,
    sampleRateHz: 30,
    observedSampleRateHz: 30,
    expectedSampleRateHz: 100,
    packetLossPercent: 40,
    presence: { euler: 3000 },
    norm: { count: 3000, mean: 1, min: 0.9999, max: 1.0001 },
    yaw: { driftDegPerMin: -12, residualStdDeg: 0.1, rSquared: 0.9999 },
    gyroZBiasDegPerMin: -11,
  };
  const evaluation = evaluateStatic(staticSnapshot);
  assert.equal(evaluation.status, 'pass');
  assert.equal(evaluation.rateStatus, 'fail');
  assert.equal(evaluation.communicationExcluded, true);
  assert.equal(evaluation.quat.status, 'pass');
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
