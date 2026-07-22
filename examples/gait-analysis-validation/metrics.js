/**
 * Pure metrics for the ORPHE INSOLE gait-analysis validation page.
 *
 * This module deliberately recomputes the derived metrics and classifications
 * instead of calling InsoleGait.js helpers.  The page can therefore catch a
 * decoder/aggregation regression instead of merely repeating its answer.
 */
(function (global) {
  'use strict';

  const PACKET_LENGTH = 20;
  const PACKET_HEADER = 51;
  const SUBHEADERS = [0, 1, 2, 4];
  const REQUIRED_STEP_TYPES = ['overview', 'stride', 'pronation'];

  const FOOT_STRIKE_MID_THRESHOLD = -3.0;
  const FOOT_STRIKE_FORE_THRESHOLD = 2.0;
  const PRONATION_AVERAGE = -9.4;
  const PRONATION_STD = 3.5;

  function asDataView(input) {
    if (input && typeof input.getUint8 === 'function') return input;
    if (input instanceof Uint8Array) return new DataView(input.buffer, input.byteOffset, input.byteLength);
    if (input instanceof ArrayBuffer) return new DataView(input);
    return null;
  }

  function f16be(dv, offset) {
    const half = dv.getUint16(offset, false);
    const sign = (half & 0x8000) ? -1 : 1;
    const exponent = (half >> 10) & 0x1f;
    const fraction = half & 0x03ff;
    if (exponent === 0) return sign * fraction * Math.pow(2, -24);
    if (exponent === 0x1f) return fraction ? NaN : sign * Infinity;
    return sign * (1 + fraction / 1024) * Math.pow(2, exponent - 15);
  }

  function nullable(value) {
    return Number.isFinite(value) ? value : null;
  }

  /** Independent decoder used to cross-check the SDK decoder byte-for-byte. */
  function decodeRawPacket(input) {
    const dv = asDataView(input);
    if (!dv || dv.byteLength !== PACKET_LENGTH || dv.getUint8(0) !== PACKET_HEADER) return null;
    const subheader = dv.getUint8(1);
    if (!SUBHEADERS.includes(subheader)) return null;
    const base = { subheader, step_number: dv.getUint16(2, false) };
    if (subheader === 0) {
      const flags = dv.getUint8(4);
      return {
        ...base,
        type: 'overview',
        gait_type: ['none', 'walk', 'run', 'stance'][(flags >> 6) & 0x03] || 'unknown',
        stride_direction: ['none', 'forward', 'backward', 'inside', 'outside'][(flags >> 3) & 0x07] || 'unknown',
        calorie: nullable(f16be(dv, 6)),
        distance_m: nullable(dv.getFloat32(8, false)),
        stance_phase_s: nullable(dv.getFloat32(12, false)),
        swing_phase_s: nullable(dv.getFloat32(16, false)),
      };
    }
    if (subheader === 1) {
      return {
        ...base,
        type: 'stride',
        foot_angle: nullable(dv.getFloat32(4, false)),
        stride_x: nullable(dv.getFloat32(8, false)),
        stride_y: nullable(dv.getFloat32(12, false)),
        stride_z: nullable(dv.getFloat32(16, false)),
      };
    }
    if (subheader === 2) {
      return {
        ...base,
        type: 'pronation',
        landing_force: nullable(dv.getFloat32(4, false)),
        pronation_x: nullable(dv.getFloat32(8, false)),
        pronation_y: nullable(dv.getFloat32(12, false)),
        pronation_z: nullable(dv.getFloat32(16, false)),
      };
    }
    const flags = dv.getUint8(4);
    return {
      ...base,
      type: 'motion',
      gait_cycle_phase: (flags >> 6) & 0x03,
      gait_cycle_period: (flags >> 3) & 0x07,
      gait_cycle_event: flags & 0x07,
      quat_w: nullable(f16be(dv, 6)),
      quat_x: nullable(f16be(dv, 8)),
      quat_y: nullable(f16be(dv, 10)),
      quat_z: nullable(f16be(dv, 12)),
      delta_x: nullable(f16be(dv, 14)),
      delta_y: nullable(f16be(dv, 16)),
      delta_z: nullable(f16be(dv, 18)),
    };
  }

  function compareDecoded(independent, sdkPacket) {
    if (!independent || !sdkPacket) return ['packet'];
    const mismatches = [];
    const fields = new Set(Object.keys(independent).concat(Object.keys(sdkPacket)));
    for (const field of fields) {
      const left = independent[field];
      const right = sdkPacket[field];
      if (typeof left === 'number' || typeof right === 'number') {
        if (!almostEqual(left, right, 1e-6)) mismatches.push(field);
      } else if (left !== right) {
        mismatches.push(field);
      }
    }
    return mismatches;
  }

  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function almostEqual(actual, expected, tolerance = 1e-5) {
    if (!finite(actual) || !finite(expected)) return false;
    return Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected));
  }

  function mean(values) {
    const clean = values.filter(finite);
    if (clean.length === 0) return null;
    return clean.reduce((sum, value) => sum + value, 0) / clean.length;
  }

  function median(values) {
    const clean = values.filter(finite).slice().sort((a, b) => a - b);
    if (clean.length === 0) return null;
    const middle = Math.floor(clean.length / 2);
    return clean.length % 2 === 0 ? (clean[middle - 1] + clean[middle]) / 2 : clean[middle];
  }

  function percentile(values, quantile) {
    const clean = values.filter(finite).slice().sort((a, b) => a - b);
    if (clean.length === 0) return null;
    if (clean.length === 1) return clean[0];
    const position = Math.max(0, Math.min(1, quantile)) * (clean.length - 1);
    const lower = Math.floor(position);
    const fraction = position - lower;
    return clean[lower + 1] === undefined
      ? clean[lower]
      : clean[lower] + fraction * (clean[lower + 1] - clean[lower]);
  }

  function relativeDifference(a, b) {
    if (!finite(a) || !finite(b)) return null;
    const denominator = Math.max(Math.abs(a), Math.abs(b));
    return denominator === 0 ? 0 : Math.abs(a - b) / denominator;
  }

  function forwardStepDelta(previous, current) {
    if (!Number.isInteger(previous) || !Number.isInteger(current)) return null;
    return (current - previous + 65536) % 65536;
  }

  function stepContinuity(rows) {
    const ordered = [];
    const seen = new Set();
    let duplicateRows = 0;
    for (const row of rows) {
      const step = row.step_number;
      if (!Number.isInteger(step)) continue;
      if (seen.has(step)) {
        duplicateRows += 1;
        continue;
      }
      seen.add(step);
      ordered.push(step);
    }

    let missedSteps = 0;
    let gapEvents = 0;
    let outOfOrder = 0;
    const gaps = [];
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const current = ordered[index];
      const delta = forwardStepDelta(previous, current);
      if (delta === 1) continue;
      if (delta === 0) {
        duplicateRows += 1;
      } else if (delta < 32768) {
        const missed = delta - 1;
        missedSteps += missed;
        gapEvents += 1;
        gaps.push({ previous, current, missed });
      } else {
        outOfOrder += 1;
      }
    }

    const expectedSteps = ordered.length + missedSteps;
    return {
      firstStep: ordered.length ? ordered[0] : null,
      lastStep: ordered.length ? ordered[ordered.length - 1] : null,
      uniqueSteps: ordered.length,
      duplicateRows,
      missedSteps,
      gapEvents,
      outOfOrder,
      gapRate: expectedSteps > 0 ? missedSteps / expectedSteps : null,
      gaps,
    };
  }

  function classifyFootStrike(strikeAngle) {
    if (!finite(strikeAngle)) return 'none';
    if (strikeAngle > FOOT_STRIKE_FORE_THRESHOLD) return 'forefoot';
    if (strikeAngle > FOOT_STRIKE_MID_THRESHOLD) return 'midfoot';
    return 'heelStrike';
  }

  function classifyPronation(pronationAngle) {
    if (!finite(pronationAngle)) return 'none';
    const lowerOne = PRONATION_AVERAGE - PRONATION_STD;
    const upperOne = PRONATION_AVERAGE + PRONATION_STD;
    const lowerThree = PRONATION_AVERAGE - PRONATION_STD * 3;
    const upperThree = PRONATION_AVERAGE + PRONATION_STD * 3;
    if (pronationAngle >= lowerOne && pronationAngle <= upperOne) return 'neutral';
    if (pronationAngle > upperOne && pronationAngle <= upperThree) return 'over';
    if (pronationAngle > upperThree) return 'severeOver';
    if (pronationAngle >= lowerThree && pronationAngle < lowerOne) return 'under';
    if (pronationAngle < lowerThree) return 'severeUnder';
    return 'none';
  }

  function validateRow(row) {
    const equationIssues = [];
    const classificationIssues = [];
    const finiteIssues = [];

    const expectedDuration = finite(row.stance_phase_s) && finite(row.swing_phase_s)
      ? row.stance_phase_s + row.swing_phase_s
      : null;
    const expectedNorm = finite(row.stride_x_m) && finite(row.stride_y_m) && finite(row.stride_z_m)
      ? Math.hypot(row.stride_x_m, row.stride_y_m, row.stride_z_m)
      : null;
    const expectedCadence = finite(expectedDuration) && expectedDuration > 0 ? 1 / expectedDuration : null;
    const expectedSpeed = finite(expectedNorm) && finite(expectedDuration) && expectedDuration > 0
      ? expectedNorm / expectedDuration
      : null;

    const equations = [
      ['duration_s', row.duration_s, expectedDuration],
      ['stride_norm_m', row.stride_norm_m, expectedNorm],
      ['cadence_hz', row.cadence_hz, expectedCadence],
      ['speed_mps', row.speed_mps, expectedSpeed],
    ];
    for (const [field, actual, expected] of equations) {
      if (expected === null) {
        if (actual !== null && actual !== undefined) equationIssues.push(field);
      } else if (!almostEqual(actual, expected)) {
        equationIssues.push(field);
      }
    }

    if (row.foot_strike !== classifyFootStrike(row.strike_angle_deg)) {
      classificationIssues.push('foot_strike');
    }
    if (row.pronation_type !== classifyPronation(row.pronation_deg)) {
      classificationIssues.push('pronation_type');
    }

    const nullableNumbers = [
      'distance_m', 'stance_phase_s', 'swing_phase_s', 'duration_s', 'cadence_hz', 'speed_mps',
      'foot_angle_deg', 'stride_x_m', 'stride_y_m', 'stride_z_m', 'stride_norm_m',
      'landing_force', 'strike_angle_deg', 'pronation_deg', 'pronation_z_deg', 'calorie',
    ];
    for (const field of nullableNumbers) {
      const value = row[field];
      if (value !== null && value !== undefined && !finite(value)) finiteIssues.push(field);
    }

    return { equationIssues, classificationIssues, finiteIssues };
  }

  function packetRate(rawPackets) {
    if (rawPackets.length < 2) return null;
    const first = rawPackets[0].at;
    const last = rawPackets[rawPackets.length - 1].at;
    const seconds = (last - first) / 1000;
    return seconds > 0 ? (rawPackets.length - 1) / seconds : null;
  }

  function packetIntervals(rawPackets) {
    const intervals = [];
    for (let index = 1; index < rawPackets.length; index += 1) {
      const interval = rawPackets[index].at - rawPackets[index - 1].at;
      if (finite(interval) && interval >= 0) intervals.push(interval);
    }
    return intervals;
  }

  function rawStepCompleteness(rawPackets) {
    const byStep = new Map();
    for (const raw of rawPackets) {
      if (![0, 1, 2].includes(raw.subheader) || !Number.isInteger(raw.stepNumber)) continue;
      let entry = byStep.get(raw.stepNumber);
      if (!entry) {
        entry = { stepNumber: raw.stepNumber, firstAt: raw.at, lastAt: raw.at, counts: {} };
        byStep.set(raw.stepNumber, entry);
      }
      entry.lastAt = raw.at;
      const type = raw.subheader === 0 ? 'overview' : (raw.subheader === 1 ? 'stride' : 'pronation');
      entry.counts[type] = (entry.counts[type] || 0) + 1;
    }
    const ordered = Array.from(byStep.values()).sort((a, b) => a.firstAt - b.firstAt);
    const interior = ordered.length > 2 ? ordered.slice(1, -1) : [];
    const incomplete = interior.filter((entry) => REQUIRED_STEP_TYPES.some((type) => !entry.counts[type]));
    const duplicateShape = interior.filter((entry) => REQUIRED_STEP_TYPES.some((type) => (entry.counts[type] || 0) > 2));
    return {
      observedSteps: ordered.length,
      interiorSteps: interior.length,
      incompleteSteps: incomplete.length,
      incomplete: incomplete.map((entry) => ({ stepNumber: entry.stepNumber, counts: entry.counts })),
      overDuplicatedSteps: duplicateShape.length,
    };
  }

  function fieldStats(rows, field) {
    const values = rows.map((row) => row[field]).filter(finite);
    return {
      count: values.length,
      min: values.length ? Math.min(...values) : null,
      median: median(values),
      mean: mean(values),
      max: values.length ? Math.max(...values) : null,
    };
  }

  function monotonicDistance(rows) {
    let decreases = 0;
    let previous = null;
    for (const row of rows) {
      if (!finite(row.distance_m)) continue;
      if (previous !== null && row.distance_m < previous - 0.01) decreases += 1;
      previous = row.distance_m;
    }
    return decreases;
  }

  function segmentDistance(rows) {
    const values = rows.map((row) => row.distance_m).filter(finite);
    if (values.length < 2) return null;
    return values[values.length - 1] - values[0];
  }

  function makeCheck(id, label, status, observed, expected) {
    return { id, label, status, observed, expected };
  }

  function rangeStatus(value, min, max, missingStatus = 'warn') {
    if (!finite(value)) return missingStatus;
    return value >= min && value <= max ? 'pass' : 'warn';
  }

  function summarizeCapture(capture, options = {}) {
    const excludeLastRows = Math.max(0, Number(options.excludeLastRows) || 0);
    const rows = Array.isArray(capture.rows) ? capture.rows : [];
    const analyzedRows = excludeLastRows > 0 ? rows.slice(0, Math.max(0, rows.length - excludeLastRows)) : rows.slice();
    const rawPackets = Array.isArray(capture.rawPackets) ? capture.rawPackets : [];
    const decodedPackets = Array.isArray(capture.decodedPackets) ? capture.decodedPackets : [];
    const invalidRaw = rawPackets.filter((packet) => packet.length !== PACKET_LENGTH
      || packet.header !== PACKET_HEADER || !SUBHEADERS.includes(packet.subheader));
    const decoderMismatchCount = rawPackets.filter((packet) => Array.isArray(packet.mismatchFields)
      && packet.mismatchFields.length > 0).length;
    const subheaders = { 0: 0, 1: 0, 2: 0, 4: 0 };
    for (const packet of rawPackets) {
      if (Object.prototype.hasOwnProperty.call(subheaders, packet.subheader)) subheaders[packet.subheader] += 1;
    }

    const continuity = stepContinuity(rows);
    const completeness = rawStepCompleteness(rawPackets);
    let equationIssueRows = 0;
    let classificationIssueRows = 0;
    let finiteIssueRows = 0;
    const rowIssues = [];
    for (const row of rows) {
      const result = validateRow(row);
      if (result.equationIssues.length) equationIssueRows += 1;
      if (result.classificationIssues.length) classificationIssueRows += 1;
      if (result.finiteIssues.length) finiteIssueRows += 1;
      if (result.equationIssues.length || result.classificationIssues.length || result.finiteIssues.length) {
        rowIssues.push({ stepNumber: row.step_number, ...result });
      }
    }

    const intervals = packetIntervals(rawPackets);
    const walkRows = analyzedRows.filter((row) => row.gait_type === 'walk').length;
    const forwardRows = analyzedRows.filter((row) => row.stride_direction === 'forward').length;
    const nullLandingRows = analyzedRows.filter((row) => row.landing_force === null || row.landing_force === undefined).length;
    const durationSeconds = finite(capture.startedAt) && finite(capture.stoppedAt)
      ? Math.max(0, (capture.stoppedAt - capture.startedAt) / 1000)
      : null;

    return {
      deviceId: capture.deviceId,
      side: capture.side || '?',
      info: capture.info || null,
      startedAt: capture.startedAt || null,
      stoppedAt: capture.stoppedAt || null,
      durationSeconds,
      rawCount: rawPackets.length,
      decodedCount: decodedPackets.length,
      invalidRawCount: invalidRaw.length,
      undecodedCount: Math.max(0, rawPackets.length - decodedPackets.length),
      decoderMismatchCount,
      packetRateHz: packetRate(rawPackets),
      packetIntervalMedianMs: median(intervals),
      packetIntervalP95Ms: percentile(intervals, 0.95),
      subheaders,
      rowCount: rows.length,
      analyzedRowCount: analyzedRows.length,
      excludedTerminalRows: Math.min(excludeLastRows, rows.length),
      continuity,
      completeness,
      equationIssueRows,
      classificationIssueRows,
      finiteIssueRows,
      rowIssues,
      walkFraction: analyzedRows.length ? walkRows / analyzedRows.length : null,
      forwardFraction: analyzedRows.length ? forwardRows / analyzedRows.length : null,
      nullLandingFraction: analyzedRows.length ? nullLandingRows / analyzedRows.length : null,
      distanceDecreases: monotonicDistance(analyzedRows),
      segmentDistanceM: segmentDistance(analyzedRows),
      sensorRateHz: finite(capture.sensorRateHz) ? capture.sensorRateHz : null,
      postStopPackets: Number(capture.postStopPackets) || 0,
      stats: {
        duration: fieldStats(analyzedRows, 'duration_s'),
        cadence: fieldStats(analyzedRows, 'cadence_hz'),
        speed: fieldStats(analyzedRows, 'speed_mps'),
        stride: fieldStats(analyzedRows, 'stride_norm_m'),
        footAngle: fieldStats(analyzedRows, 'foot_angle_deg'),
        pronation: fieldStats(analyzedRows, 'pronation_deg'),
        landingForce: fieldStats(analyzedRows, 'landing_force'),
      },
    };
  }

  function checksForSummary(summary, options = {}) {
    const checks = [];
    checks.push(makeCheck(
      'raw-schema', '20 byte / header 51 / supported subheader',
      summary.rawCount > 0 && summary.invalidRawCount === 0 && summary.undecodedCount === 0 ? 'pass' : 'fail',
      `${summary.rawCount} raw, ${summary.invalidRawCount} invalid, ${summary.undecodedCount} undecoded`,
      'invalid=0, undecoded=0'
    ));
    checks.push(makeCheck(
      'decoder-match', 'independent decoder vs SDK decoder',
      summary.decoderMismatchCount === 0 ? 'pass' : 'fail',
      `${summary.decoderMismatchCount} mismatched packets`, '0 mismatches'
    ));
    checks.push(makeCheck(
      'notify-rate', 'STEP_ANALYSIS notify rate',
      summary.packetRateHz === null ? 'fail' : rangeStatus(summary.packetRateHz, 30, 80),
      summary.packetRateHz === null ? '-' : `${summary.packetRateHz.toFixed(1)} Hz (p95 gap ${summary.packetIntervalP95Ms?.toFixed(0) ?? '-'} ms)`,
      'engineering sanity range 30-80 Hz'
    ));
    checks.push(makeCheck(
      'motion', 'motion subheader',
      summary.subheaders[4] > 0 ? 'pass' : 'fail',
      `${summary.subheaders[4]} packets`, '> 0'
    ));
    checks.push(makeCheck(
      'step-parts', 'overview / stride / pronation',
      summary.subheaders[0] > 0 && summary.subheaders[1] > 0 && summary.subheaders[2] > 0 ? 'pass' : 'fail',
      `overview ${summary.subheaders[0]}, stride ${summary.subheaders[1]}, pronation ${summary.subheaders[2]}`,
      'all three observed'
    ));
    checks.push(makeCheck(
      'rows', 'aggregated gait rows',
      summary.rowCount >= 4 ? 'pass' : 'fail',
      `${summary.rowCount} rows (${summary.analyzedRowCount} analyzed)`, 'at least 4 per foot'
    ));
    checks.push(makeCheck(
      'equations', 'derived-metric equations',
      summary.equationIssueRows === 0 ? 'pass' : 'fail',
      `${summary.equationIssueRows} inconsistent rows`,
      'duration, norm, cadence and speed all agree'
    ));
    checks.push(makeCheck(
      'classifications', 'independent classification check',
      summary.classificationIssueRows === 0 ? 'pass' : 'fail',
      `${summary.classificationIssueRows} mismatched rows`,
      'foot strike and pronation thresholds agree'
    ));
    checks.push(makeCheck(
      'finite', 'NaN/Infinity sanitization',
      summary.finiteIssueRows === 0 ? 'pass' : 'fail',
      `${summary.finiteIssueRows} rows contain non-finite values`, '0 rows'
    ));
    checks.push(makeCheck(
      'duplicate-rows', 'one output row per step',
      summary.continuity.duplicateRows === 0 ? 'pass' : 'fail',
      `${summary.continuity.duplicateRows} duplicates`, '0 duplicates'
    ));
    checks.push(makeCheck(
      'step-gaps', 'completed-step continuity',
      summary.continuity.missedSteps === 0 ? 'pass' : 'warn',
      `${summary.continuity.missedSteps} missed (${summary.continuity.gapRate === null ? '-' : (summary.continuity.gapRate * 100).toFixed(1) + '%'})`,
      '0 preferred; BLE loss is reported as warning'
    ));
    checks.push(makeCheck(
      'raw-completeness', 'interior step triplets complete',
      summary.completeness.incompleteSteps === 0 ? 'pass' : 'warn',
      `${summary.completeness.incompleteSteps}/${summary.completeness.interiorSteps} incomplete`,
      '0 preferred; first/last boundary steps excluded'
    ));
    checks.push(makeCheck(
      'distance-monotonic', 'firmware cumulative distance monotonic',
      summary.distanceDecreases === 0 ? 'pass' : 'fail',
      `${summary.distanceDecreases} decreases`, '0 decreases'
    ));
    checks.push(makeCheck(
      'walk-label', 'walking rows labeled walk',
      summary.walkFraction !== null && summary.walkFraction >= 0.8 ? 'pass' : 'warn',
      summary.walkFraction === null ? '-' : `${(summary.walkFraction * 100).toFixed(0)}%`, '>= 80%'
    ));
    checks.push(makeCheck(
      'forward-label', 'straight-walk rows labeled forward',
      summary.forwardFraction !== null && summary.forwardFraction >= 0.8 ? 'pass' : 'warn',
      summary.forwardFraction === null ? '-' : `${(summary.forwardFraction * 100).toFixed(0)}%`, '>= 80%'
    ));
    checks.push(makeCheck(
      'duration-range', 'median stride duration',
      rangeStatus(summary.stats.duration.median, 0.6, 2.0),
      summary.stats.duration.median === null ? '-' : `${summary.stats.duration.median.toFixed(3)} s`,
      'broad engineering range 0.6-2.0 s'
    ));
    checks.push(makeCheck(
      'cadence-range', 'median same-foot cadence',
      rangeStatus(summary.stats.cadence.median, 0.5, 1.7),
      summary.stats.cadence.median === null ? '-' : `${summary.stats.cadence.median.toFixed(3)} Hz`,
      'broad engineering range 0.5-1.7 Hz'
    ));
    checks.push(makeCheck(
      'stride-range', 'median stride norm',
      rangeStatus(summary.stats.stride.median, 0.2, 2.0),
      summary.stats.stride.median === null ? '-' : `${summary.stats.stride.median.toFixed(3)} m`,
      'broad engineering range 0.2-2.0 m'
    ));
    checks.push(makeCheck(
      'speed-range', 'median speed',
      rangeStatus(summary.stats.speed.median, 0.2, 2.5),
      summary.stats.speed.median === null ? '-' : `${summary.stats.speed.median.toFixed(3)} m/s`,
      'broad engineering range 0.2-2.5 m/s'
    ));
    checks.push(makeCheck(
      'sensor-stream', 'SENSOR_VALUES continues during gait capture',
      summary.sensorRateHz === null ? 'warn' : (summary.sensorRateHz >= 50 ? 'pass' : 'fail'),
      summary.sensorRateHz === null ? '-' : `${summary.sensorRateHz.toFixed(1)} samples/s`,
      '>= 50 samples/s in mode 4'
    ));
    checks.push(makeCheck(
      'post-stop', 'no STEP_ANALYSIS callbacks after stop',
      summary.postStopPackets === 0 ? 'pass' : 'fail',
      `${summary.postStopPackets} packets in 300 ms grace window`, '0 packets'
    ));

    const targetDistance = Number(options.targetDistanceM);
    if (finite(targetDistance) && targetDistance > 0) {
      const error = finite(summary.segmentDistanceM)
        ? Math.abs(summary.segmentDistanceM - targetDistance) / targetDistance
        : null;
      checks.push(makeCheck(
        'course-distance', 'segment distance vs measured course',
        error !== null && error <= 0.3 ? 'pass' : 'warn',
        summary.segmentDistanceM === null ? '-' : `${summary.segmentDistanceM.toFixed(2)} m (${(error * 100).toFixed(0)}% error)`,
        `${targetDistance.toFixed(2)} m, <= 30% error`
      ));
    }
    return checks;
  }

  function pairChecks(summaries, captures, options = {}) {
    const checks = [];
    checks.push(makeCheck(
      'pair-count', 'both insoles captured',
      summaries.length === 2 ? 'pass' : 'fail',
      `${summaries.length} device(s)`, '2 devices'
    ));
    if (summaries.length !== 2) return checks;

    const sides = summaries.map((summary) => summary.side);
    checks.push(makeCheck(
      'pair-sides', 'mount position is one L and one R',
      sides.includes('L') && sides.includes('R') ? 'pass' : 'fail',
      sides.join(' / '), 'L / R'
    ));

    const rowDifference = Math.abs(summaries[0].analyzedRowCount - summaries[1].analyzedRowCount);
    checks.push(makeCheck(
      'pair-step-count', 'left/right row-count balance',
      rowDifference <= 2 ? 'pass' : 'warn',
      `${summaries[0].analyzedRowCount} vs ${summaries[1].analyzedRowCount} (diff ${rowDifference})`,
      'difference <= 2'
    ));

    const cadenceDifference = relativeDifference(summaries[0].stats.cadence.median, summaries[1].stats.cadence.median);
    checks.push(makeCheck(
      'pair-cadence', 'left/right median cadence agreement',
      cadenceDifference !== null && cadenceDifference <= 0.2 ? 'pass' : 'warn',
      cadenceDifference === null ? '-' : `${(cadenceDifference * 100).toFixed(1)}% difference`,
      '<= 20%'
    ));

    const distanceDifference = relativeDifference(summaries[0].segmentDistanceM, summaries[1].segmentDistanceM);
    checks.push(makeCheck(
      'pair-distance', 'left/right segment-distance agreement',
      distanceDifference !== null && distanceDifference <= 0.25 ? 'pass' : 'warn',
      distanceDifference === null ? '-' : `${(distanceDifference * 100).toFixed(1)}% difference`,
      '<= 25%'
    ));

    const manualSteps = Number(options.manualTotalSteps);
    if (finite(manualSteps) && manualSteps > 0) {
      const completed = summaries.reduce((sum, summary) => sum + summary.analyzedRowCount, 0);
      const difference = Math.abs(completed - manualSteps);
      checks.push(makeCheck(
        'manual-step-count', 'aggregated rows vs manual step count',
        difference <= 2 ? 'pass' : 'warn',
        `${completed} rows vs ${manualSteps} manual (diff ${difference})`,
        'difference <= 2'
      ));
    }

    const smoke = captures.map((capture) => capture.smokeCycles || []);
    if (smoke.some((cycles) => cycles.length > 0)) {
      const allCycles = smoke.flat();
      const goodCycles = allCycles.filter((cycle) => cycle.rawCount > 0 && cycle.rateHz >= 20 && cycle.rateHz <= 90);
      checks.push(makeCheck(
        'start-stop-restart', 'start / stop / restart smoke test',
        goodCycles.length === allCycles.length && allCycles.length >= summaries.length * 2 ? 'pass' : 'fail',
        `${goodCycles.length}/${allCycles.length} cycles in range`,
        'two successful cycles per connected device'
      ));
    }
    return checks;
  }

  /**
   * Summarize every disconnect -> reconnect window in one capture.
   * Recovery requires both characteristics to produce new data after reconnect:
   * SENSOR_VALUES (press) and STEP_ANALYSIS (raw + one completed gait row).
   */
  function evaluateReconnectCapture(capture) {
    const disconnects = (capture.disconnectEvents || []).slice().sort((a, b) => a.at - b.at);
    const reconnects = (capture.reconnectEvents || []).slice().sort((a, b) => a.at - b.at);
    const attempts = capture.reconnectAttempts || [];
    const rawPackets = capture.rawPackets || [];
    const rows = capture.rows || [];
    const pressEvents = capture.pressEvents || [];
    const stoppedAt = finite(capture.stoppedAt) ? capture.stoppedAt : Infinity;

    const cycles = disconnects.map((disconnect, index) => {
      const nextDisconnectAt = disconnects[index + 1] ? disconnects[index + 1].at : stoppedAt;
      const reconnect = reconnects.find((event) => event.at >= disconnect.at && event.at < nextDisconnectAt) || null;
      const windowEnd = nextDisconnectAt;
      const reconnectAt = reconnect ? reconnect.at : Infinity;
      const pressAfter = pressEvents.filter((at) => at > reconnectAt && at < windowEnd).length;
      const rawAfter = rawPackets.filter((packet) => packet.at > reconnectAt && packet.at < windowEnd).length;
      const rowsAfter = rows.filter((row) => row.hostReceivedAt > reconnectAt && row.hostReceivedAt < windowEnd).length;
      const attemptCount = attempts.filter((attempt) => attempt.at >= disconnect.at
        && attempt.at < (reconnect ? reconnect.at : windowEnd)).length;
      const recovered = !!reconnect && pressAfter > 0 && rawAfter > 0 && rowsAfter > 0;
      return {
        disconnectAt: disconnect.at,
        reconnectAt: reconnect ? reconnect.at : null,
        latencyMs: reconnect ? Math.max(0, reconnect.at - disconnect.at) : null,
        attemptCount,
        pressAfter,
        rawAfter,
        rowsAfter,
        recovered,
      };
    });

    return {
      deviceId: capture.deviceId,
      side: capture.side,
      disconnectCount: disconnects.length,
      reconnectCount: reconnects.length,
      cycles,
      status: cycles.length > 0 && cycles.every((cycle) => cycle.recovered) ? 'pass' : 'fail',
    };
  }

  function overallStatus(checks) {
    if (checks.some((check) => check.status === 'fail')) return 'fail';
    if (checks.some((check) => check.status === 'warn')) return 'warn';
    return 'pass';
  }

  function evaluateCaptures(captures, options = {}) {
    const summaries = captures.map((capture) => summarizeCapture(capture, options));
    const devices = summaries.map((summary) => ({ summary, checks: checksForSummary(summary, options) }));
    const pair = pairChecks(summaries, captures, options);
    const checks = devices.flatMap((device) => device.checks).concat(pair);
    return {
      generatedAt: new Date().toISOString(),
      options: { ...options },
      status: overallStatus(checks),
      devices,
      pairChecks: pair,
      counts: {
        pass: checks.filter((check) => check.status === 'pass').length,
        warn: checks.filter((check) => check.status === 'warn').length,
        fail: checks.filter((check) => check.status === 'fail').length,
      },
    };
  }

  const api = {
    PACKET_LENGTH,
    PACKET_HEADER,
    SUBHEADERS,
    f16be,
    decodeRawPacket,
    compareDecoded,
    almostEqual,
    mean,
    median,
    percentile,
    relativeDifference,
    forwardStepDelta,
    stepContinuity,
    classifyFootStrike,
    classifyPronation,
    validateRow,
    rawStepCompleteness,
    summarizeCapture,
    checksForSummary,
    evaluateReconnectCapture,
    evaluateCaptures,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.OrpheGaitValidationMetrics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
