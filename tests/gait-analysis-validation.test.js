const assert = require('node:assert/strict');
const Metrics = require('../examples/gait-analysis-validation/metrics.js');

function row(step, overrides = {}) {
  const base = {
    step_number: step,
    gait_type: 'walk',
    stride_direction: 'forward',
    distance_m: step,
    stance_phase_s: 0.7,
    swing_phase_s: 0.5,
    duration_s: 1.2,
    cadence_hz: 1 / 1.2,
    speed_mps: Math.hypot(1, 0.1, 0.05) / 1.2,
    foot_angle_deg: -10,
    stride_x_m: 1,
    stride_y_m: 0.1,
    stride_z_m: 0.05,
    stride_norm_m: Math.hypot(1, 0.1, 0.05),
    landing_force: 0.4,
    strike_angle_deg: -10,
    foot_strike: 'heelStrike',
    pronation_deg: -9.4,
    pronation_type: 'neutral',
    pronation_z_deg: 0,
    calorie: 0.1,
  };
  return { ...base, ...overrides };
}

function packets(startStep, count, startAt = 0) {
  const result = [];
  let at = startAt;
  for (let index = 0; index < count; index += 1) {
    const stepNumber = (startStep + index) % 65536;
    for (const subheader of [0, 1, 2]) {
      result.push({ at, length: 20, header: 51, subheader, stepNumber });
      at += 2;
    }
    for (let motion = 0; motion < 20; motion += 1) {
      result.push({ at, length: 20, header: 51, subheader: 4, stepNumber });
      at += 20;
    }
  }
  return result;
}

function capture(deviceId, side, startStep = 10) {
  const rows = Array.from({ length: 7 }, (_, index) => row((startStep + index) % 65536, {
    distance_m: 20 + index,
  }));
  const rawPackets = packets(startStep, 7, 1000);
  return {
    deviceId,
    side,
    info: { mount_position: side === 'R' ? 1 : 0 },
    startedAt: 1000,
    stoppedAt: rawPackets[rawPackets.length - 1].at,
    rawPackets,
    decodedPackets: rawPackets.map((packet) => ({ at: packet.at })),
    rows,
    sensorRateHz: 100,
  };
}

// Independent equations and classifications.
{
  const valid = Metrics.validateRow(row(1));
  assert.deepEqual(valid.equationIssues, []);
  assert.deepEqual(valid.classificationIssues, []);

  const invalid = Metrics.validateRow(row(1, { speed_mps: 99, foot_strike: 'forefoot' }));
  assert.deepEqual(invalid.equationIssues, ['speed_mps']);
  assert.deepEqual(invalid.classificationIssues, ['foot_strike']);

  assert.equal(Metrics.classifyFootStrike(3), 'forefoot');
  assert.equal(Metrics.classifyFootStrike(0), 'midfoot');
  assert.equal(Metrics.classifyFootStrike(-10), 'heelStrike');
  assert.equal(Metrics.classifyPronation(-9.4), 'neutral');
  assert.equal(Metrics.classifyPronation(5), 'severeOver');
}

// Independent raw decoder covers big-endian offsets without calling InsoleGait.js.
{
  const dv = new DataView(new ArrayBuffer(20));
  dv.setUint8(0, 51);
  dv.setUint8(1, 1);
  dv.setUint16(2, 65535, false);
  dv.setFloat32(4, -12.5, false);
  dv.setFloat32(8, 1.1, false);
  dv.setFloat32(12, 0.2, false);
  dv.setFloat32(16, 0.05, false);
  const decoded = Metrics.decodeRawPacket(dv);
  assert.equal(decoded.type, 'stride');
  assert.equal(decoded.step_number, 65535);
  assert.equal(decoded.foot_angle, -12.5);
  assert.ok(Metrics.almostEqual(decoded.stride_x, 1.1));
  assert.deepEqual(Metrics.compareDecoded(decoded, { ...decoded }), []);
  assert.deepEqual(Metrics.compareDecoded(decoded, { ...decoded, stride_z: 9 }), ['stride_z']);
}

// uint16 wrap is continuous, while a real gap is counted.
{
  const continuity = Metrics.stepContinuity([
    row(65534), row(65535), row(0), row(2), row(2),
  ]);
  assert.equal(continuity.missedSteps, 1);
  assert.equal(continuity.gapEvents, 1);
  assert.equal(continuity.duplicateRows, 1);
  assert.deepEqual(continuity.gaps[0], { previous: 0, current: 2, missed: 1 });
}

// First/last partial steps are capture boundaries; an interior partial step is evidence of loss.
{
  const raw = [
    { at: 1, subheader: 1, stepNumber: 1 },
    { at: 2, subheader: 0, stepNumber: 2 },
    { at: 3, subheader: 1, stepNumber: 2 },
    { at: 4, subheader: 2, stepNumber: 2 },
    { at: 5, subheader: 0, stepNumber: 3 },
    { at: 6, subheader: 2, stepNumber: 3 },
    { at: 7, subheader: 0, stepNumber: 4 },
  ];
  const completeness = Metrics.rawStepCompleteness(raw);
  assert.equal(completeness.interiorSteps, 2);
  assert.equal(completeness.incompleteSteps, 1);
  assert.equal(completeness.incomplete[0].stepNumber, 3);
}

// Terminal artifact exclusion removes the final outlier from plausibility statistics.
{
  const c = capture(0, 'L');
  c.rows[c.rows.length - 1] = row(16, {
    distance_m: 26.1,
    stride_x_m: 0.01,
    stride_y_m: 0,
    stride_z_m: 0,
    stride_norm_m: 0.01,
    speed_mps: 0.01 / 1.2,
    foot_angle_deg: 106,
  });
  const withoutExclusion = Metrics.summarizeCapture(c, { excludeLastRows: 0 });
  const withExclusion = Metrics.summarizeCapture(c, { excludeLastRows: 1 });
  assert.equal(withoutExclusion.analyzedRowCount, 7);
  assert.equal(withExclusion.analyzedRowCount, 6);
  assert.ok(withExclusion.stats.stride.min > withoutExclusion.stats.stride.min);
}

// Full pair evaluation passes hard consistency gates and reports broad plausibility checks.
{
  const left = capture(0, 'L', 65532);
  const right = capture(1, 'R', 102);
  const report = Metrics.evaluateCaptures([left, right], {
    excludeLastRows: 1,
    targetDistanceM: 5,
    manualTotalSteps: 12,
  });
  assert.equal(report.counts.fail, 0);
  assert.equal(report.devices.length, 2);
  assert.equal(report.devices[0].summary.continuity.missedSteps, 0);
  assert.equal(report.pairChecks.find((check) => check.id === 'pair-sides').status, 'pass');
  assert.equal(report.pairChecks.find((check) => check.id === 'manual-step-count').status, 'pass');
}

// Invalid raw data and an internally inconsistent row are hard failures.
{
  const broken = capture(0, 'L');
  broken.rawPackets[5].header = 50;
  broken.rows[2] = row(12, { cadence_hz: 123 });
  const report = Metrics.evaluateCaptures([broken], { excludeLastRows: 0 });
  assert.equal(report.status, 'fail');
  const checks = report.devices[0].checks;
  assert.equal(checks.find((check) => check.id === 'raw-schema').status, 'fail');
  assert.equal(checks.find((check) => check.id === 'equations').status, 'fail');
}

// Reconnect validation requires both SENSOR_VALUES and STEP_ANALYSIS data after reconnect.
{
  const recovered = {
    deviceId: 0,
    side: 'R',
    stoppedAt: 1000,
    disconnectEvents: [{ at: 100 }],
    reconnectAttempts: [{ at: 120 }, { at: 160 }],
    reconnectEvents: [{ at: 200 }],
    pressEvents: [210, 220],
    rawPackets: [{ at: 230 }],
    rows: [{ hostReceivedAt: 250 }],
  };
  const summary = Metrics.evaluateReconnectCapture(recovered);
  assert.equal(summary.status, 'pass');
  assert.equal(summary.cycles.length, 1);
  assert.equal(summary.cycles[0].latencyMs, 100);
  assert.equal(summary.cycles[0].attemptCount, 2);
  assert.equal(summary.cycles[0].recovered, true);

  const pressOnly = {
    ...recovered,
    rawPackets: [],
    rows: [],
  };
  const failed = Metrics.evaluateReconnectCapture(pressOnly);
  assert.equal(failed.status, 'fail');
  assert.equal(failed.cycles[0].pressAfter, 2);
  assert.equal(failed.cycles[0].rawAfter, 0);
  assert.equal(failed.cycles[0].rowsAfter, 0);
}

console.log('gait-analysis-validation.test.js passed');
