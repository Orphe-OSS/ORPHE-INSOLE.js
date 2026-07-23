const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const metrics = require('../examples/data-modes/metrics.js');

{
    const tracker = metrics.createSerialTracker();
    [65534, 65535, 0, 1].forEach((serial) => metrics.recordSerial(tracker, serial));
    assert.deepEqual(metrics.summarizeSerialTracker(tracker), {
        first: 65534,
        last: 1,
        expected: 4,
        received: 4,
        missing: 0,
        missingRate: 0,
        duplicates: 0,
        outOfOrder: 0,
    });
}

{
    const tracker = metrics.createSerialTracker();
    [10, 11, 14, 12, 13, 14].forEach((serial) => metrics.recordSerial(tracker, serial));
    const summary = metrics.summarizeSerialTracker(tracker);
    assert.equal(summary.expected, 5);
    assert.equal(summary.received, 5);
    assert.equal(summary.missing, 0);
    assert.equal(summary.outOfOrder, 2);
    assert.equal(summary.duplicates, 1);
    assert.equal(tracker.gapEvents[0].missing, 2);
}

{
    const tracker = metrics.createSerialTracker();
    [11, 12, 13, 10].forEach((serial) => metrics.recordSerial(tracker, serial));
    const summary = metrics.summarizeSerialTracker(tracker);
    assert.equal(summary.first, 10);
    assert.equal(summary.expected, 4);
    assert.equal(summary.received, 4);
    assert.equal(summary.missing, 0);
}

{
    const arrivalSummary = {
        first: 112,
        last: 115,
        expected: 4,
        received: 4,
        missing: 0,
        missingRate: 0,
        duplicates: 0,
        outOfOrder: 0,
    };
    const checkpointSummary = {
        available: true,
        first: 110,
        last: 115,
        expected: 6,
        received: 6,
        missing: 0,
        missingRate: 0,
        dropped: 0,
    };
    assert.equal(
        metrics.selectSerialSummary(metrics.PRESET_EXPECTATIONS.fifo, arrivalSummary, checkpointSummary),
        checkpointSummary
    );
    assert.equal(
        metrics.selectSerialSummary(metrics.PRESET_EXPECTATIONS.rt4, arrivalSummary, checkpointSummary),
        arrivalSummary
    );
}

{
    const arrivals = metrics.summarizeArrivals([1000, 1020, 1040, 1100]);
    assert.equal(arrivals.count, 4);
    assert.equal(arrivals.rateHz, 30);
    assert.equal(arrivals.intervals.median, 20);
    assert.equal(arrivals.intervals.max, 60);
    assert.equal(metrics.percentile([1, 2, 3, 4], 0.5), 2.5);
}

{
    const now = new Date(2026, 6, 23, 0, 0, 0, 100).getTime();
    const previousDayMs = 23 * 3600000 + 59 * 60000 + 59900;
    assert.equal(metrics.deviceTimestampToEpoch(previousDayMs, now), now - 200);
}

{
    const fifoSample = {
        converted_acc: { x: 0, y: 0, z: 1 },
        converted_gyro: { x: 0, y: 0, z: 0 },
        press: { values: [1, 2, 3, 4, 5, 6] },
    };
    assert.equal(metrics.sampleHasField(fifoSample, 'acc'), true);
    assert.equal(metrics.sampleHasField(fifoSample, 'gyro'), true);
    assert.equal(metrics.sampleHasField(fifoSample, 'press'), true);
    assert.equal(metrics.sampleHasField(fifoSample, 'quat'), false);
}

{
    assert.deepEqual(
        metrics.safeOutputBridge(
            { sensorValues: true, stepAnalysis: false },
            { sensorValues: false, stepAnalysis: true }
        ),
        { sensorValues: true, stepAnalysis: true }
    );
    assert.deepEqual(
        metrics.safeOutputBridge(
            { sensorValues: false, stepAnalysis: true },
            { sensorValues: true, stepAnalysis: false }
        ),
        { sensorValues: true, stepAnalysis: true }
    );
}

{
    const evaluation = metrics.evaluateDeviceRun({
        durationSec: 10,
        rawPackets: 500,
        rawSamples: 1000,
        fieldCounts: { acc: 1000, gyro: 1000, press: 1000, quat: 1000 },
        serial: { missing: 0, expected: 500 },
        fifoDropped: 0,
        stepPackets: 0,
        completedSteps: 0,
    }, metrics.PRESET_EXPECTATIONS.rt4);
    assert.equal(evaluation.level, 'pass');
}

{
    const evaluation = metrics.evaluateDeviceRun({
        durationSec: 10,
        rawPackets: 500,
        rawSamples: 1000,
        fieldCounts: { acc: 1000, gyro: 1000, press: 1000, quat: 1000 },
        serial: { missing: 0, expected: 500 },
        fifoDropped: 0,
        stepPackets: 100,
        completedSteps: 4,
    }, metrics.PRESET_EXPECTATIONS['rt4-step']);
    assert.equal(evaluation.level, 'pass');
}

{
    assert.deepEqual(metrics.classifyRunProfile(metrics.PRESET_EXPECTATIONS.rt4, 2), {
        id: 'standard',
        label: '2台 通常計測',
        fifo: false,
        dualHostStress: false,
    });
    assert.equal(
        metrics.classifyRunProfile(metrics.PRESET_EXPECTATIONS.fifo, 1).id,
        'fifo-single-baseline'
    );
    assert.equal(
        metrics.classifyRunProfile(metrics.PRESET_EXPECTATIONS.fifo, 2).id,
        'fifo-dual-host-stress'
    );
}

{
    const evaluation = metrics.evaluateDeviceRun({
        durationSec: 10,
        rawPackets: 500,
        rawSamples: 2000,
        unexpectedRealtimePackets: 0,
        fieldCounts: { acc: 2000, gyro: 2000, press: 2000, quat: 0 },
        serial: { missing: 0, expected: 500 },
        fifoDropped: 0,
        fifoStopped: true,
        fifoDrainRecovered: 2,
        fifoDrainMs: 180,
        finished: true,
        stepPackets: 0,
        completedSteps: 0,
    }, metrics.PRESET_EXPECTATIONS.fifo);
    assert.equal(evaluation.level, 'pass');
}

{
    const evaluation = metrics.evaluateDeviceRun({
        durationSec: 10,
        rawPackets: 0,
        rawSamples: 0,
        unexpectedRealtimePackets: 0,
        fieldCounts: { acc: 0, gyro: 0, press: 0, quat: 0 },
        serial: { missing: 0, expected: 0 },
        fifoDropped: 0,
        stepPackets: 100,
        completedSteps: 4,
    }, metrics.PRESET_EXPECTATIONS.step);
    assert.equal(evaluation.level, 'pass');
}

{
    const evaluation = metrics.evaluateDeviceRun({
        durationSec: 10,
        rawPackets: 0,
        rawSamples: 0,
        unexpectedRealtimePackets: 1,
        fieldCounts: { acc: 0, gyro: 0, press: 0, quat: 0 },
        serial: { missing: 0, expected: 0 },
        fifoDropped: 0,
        stepPackets: 100,
        completedSteps: 4,
    }, metrics.PRESET_EXPECTATIONS.step);
    assert.equal(evaluation.level, 'warn');
}

{
    const pageRoot = path.join(__dirname, '..', 'examples', 'data-modes');
    const html = fs.readFileSync(path.join(pageRoot, 'index.html'), 'utf8');
    const app = fs.readFileSync(path.join(pageRoot, 'app.js'), 'utf8');
    const attitude = fs.readFileSync(path.join(pageRoot, 'attitude-viz.js'), 'utf8');
    const legacy = fs.readFileSync(
        path.join(__dirname, 'manual', 'toolkit-mode-validation', 'index.html'),
        'utf8'
    );
    assert.match(html, /id="copy_event_log_button"/);
    assert.match(html, /STEP 3 計測・記録を開始/);
    assert.match(html, /3つの通信経路の違い/);
    assert.match(html, /data-guide-preset="fifo"/);
    assert.match(html, /id="profile_code"/);
    assert.match(app, /dom\.copyLog\.addEventListener\('click', copyEventLog\)/);
    assert.match(app, /RUN_PROGRESS_LOG_INTERVAL_MS = 5000/);
    assert.match(app, /events: eventEntries\.slice\(\)/);
    assert.match(app, /Rawライブプレビュー受信開始/);
    assert.match(app, /session\.applyProfile\(preset\.profileId\)/);
    assert.match(app, /sessions\[id\]\.startMeasurement/);
    assert.match(app, /sessions\[id\]\.stopMeasurement/);
    assert.match(app, /insoleToolkitMeasurementToCSV/);
    assert.doesNotMatch(app, /sensorValues:\s*false,\s*stepAnalysis:\s*false/);
    assert.match(html, /id="validation_canvas3d"/);
    assert.match(html, /attitude-viz\.js/);
    assert.match(attitude, /\.\.\/showcase\/assets\/models\/orphe_shoeL3\.stl/);
    assert.match(html, /id="fifo_history_chart"/);
    assert.match(html, /id="step_history_body"/);
    assert.match(html, /id="step_packet_summary_0"/);
    assert.match(html, /id="step_packet_summary_1"/);
    assert.match(html, /id="fifo_load_context"/);
    assert.match(html, /id="host_label_input"/);
    assert.match(html, /id="fifo_baseline_0"/);
    assert.match(html, /id="fifo_dual_status"/);
    assert.match(app, /function appendFifoHistory/);
    assert.match(app, /function renderFifoLoadContext/);
    assert.match(app, /function renderFifoHistory/);
    assert.match(app, /function recordStepHistory/);
    assert.match(app, /function recordStepPacket/);
    assert.match(app, /function renderStepPacketStatus/);
    assert.match(app, /function renderStepHistory/);
    assert.match(app, /REALTIME_HEADER_BY_MODE/);
    assert.match(app, /createCheckpoint/);
    assert.match(app, /summarizeSince/);
    assert.match(html, /data-preset="rt4-step"/);
    assert.doesNotMatch(html, /data-preset="fifo-step"/);
    assert.match(legacy, /examples\/data-modes/);
}

console.log('toolkit-mode-validation tests: ok');
