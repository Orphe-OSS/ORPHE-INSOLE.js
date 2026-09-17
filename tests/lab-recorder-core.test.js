const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Core = require('../examples/lab-recorder/recorder-core.js');
const Fifo = require('../src/InsoleFifo.js');

const PAGE_DIR = path.join(__dirname, '..', 'examples', 'lab-recorder');
const read = (name) => fs.readFileSync(path.join(PAGE_DIR, name), 'utf8');

// 固定タイムゾーン（+09:00）でテストを決定的にする
const TZ = 540;

// ── SDK 定数との整合 ────────────────────────────────────────────────
{
    assert.equal(Core.NOMINAL_IMU_ODR_HZ, Fifo.IMU_ODR_HZ, 'recorder-core の ODR が InsoleFifo.js と一致していない');
    assert.ok(Math.abs(Core.FRAME_INTERVAL_MS - Fifo.FRAME_INTERVAL_MS) < 1e-9);
    assert.equal(Core.FRAMES_PER_PACKET, 4);
}

// ── ISO 8601（ミリ秒・オフセット付き） ──────────────────────────────
{
    const iso = Core.formatIsoWithOffset(Date.UTC(2026, 8, 16, 4, 45, 12, 345), TZ);
    assert.equal(iso, '2026-09-16T13:45:12.345+09:00');
    assert.equal(Core.formatIsoWithOffset(Date.UTC(2026, 0, 1, 0, 0, 0, 5), -300), '2025-12-31T19:00:00.005-05:00');
    assert.equal(Core.formatIsoWithOffset(NaN, TZ), '');
    assert.equal(Core.formatTimezoneLabel(TZ, 'Asia/Tokyo'), 'Asia/Tokyo (UTC+09:00)');
    assert.equal(Core.formatTimezoneLabel(-330), 'UTC-05:30');
    assert.equal(Core.compactTimestamp(Date.UTC(2026, 8, 16, 4, 45, 12, 345), TZ), '20260916-134512');
}

// ── サンプル生成ヘルパ ──────────────────────────────────────────────
function makeSample(serial, packet, tBaseMs, extra = {}) {
    return {
        serial_number: serial & 0xffff,
        packet_number: packet,
        t: (tBaseMs + packet * Core.FRAME_INTERVAL_MS) % Core.DAY_MS, // FW の時刻カウンタは日跨ぎで 0 に戻る
        converted_gyro: { x: 1.5, y: -2.25, z: 0.125 },
        converted_acc: { x: 0, y: 0, z: 1 },
        press: { values: [10, 20, 30, 40, 50, 60] },
        ...extra,
    };
}

/** serial 連番の packets 個 × 4 frame。start から 20 ms 間隔（端末時刻） */
function makeSeries(startSerial, packets, tStartMs, options = {}) {
    const samples = [];
    for (let i = 0; i < packets; i += 1) {
        const serial = (startSerial + i) & 0xffff;
        if (options.skip && options.skip.includes(serial)) continue;
        for (let packet = 0; packet < 4; packet += 1) {
            samples.push(makeSample(serial, packet, tStartMs + i * Core.PACKET_INTERVAL_MS));
        }
    }
    return samples;
}

// ── orderSamples: 順不同・重複・wraparound・日跨ぎ ────────────────────
{
    const series = makeSeries(65534, 4, 86399950); // 65534,65535,0,1 と 23:59:59.950 → 翌日へ
    const shuffled = [series[9], series[0], series[15], series[3], series[0], ...series];
    const entries = Core.orderSamples(shuffled);
    assert.equal(entries.length, 16, '重複は1件に畳まれる');
    assert.deepEqual(entries.slice(0, 5).map((e) => [e.serial_number, e.packet_number]),
        [[65534, 0], [65534, 1], [65534, 2], [65534, 3], [65535, 0]]);
    assert.deepEqual(entries.slice(8, 10).map((e) => e.serial_number), [0, 0], 'wrap 後の 0 は 65535 の次');
    for (let i = 1; i < entries.length; i += 1) {
        assert.ok(entries[i].device_time_ms > entries[i - 1].device_time_ms,
            `端末時刻が単調増加でない index=${i}`);
        assert.equal(entries[i].sample_index, i);
    }
    // 日跨ぎ後の生の t は小さいが unwrap 後は前日分 + DAY_MS になる
    const last = entries[entries.length - 1];
    assert.ok(last.raw_device_time_ms < 1000);
    assert.ok(last.device_time_ms > Core.DAY_MS);
    assert.deepEqual(Core.orderSamples([]), []);
    assert.deepEqual(Core.orderSamples([{ foo: 1 }]), []);
}

// ── estimateClockMap: 最小遅延法 ───────────────────────────────────
{
    // 端末時刻 1000 ms 台、ホストは epoch 1,700,000,000,000 台。真の offset = 1.7e12 - 0、遅延は 250〜600 ms
    const base = 1700000000000;
    const batches = [
        { hostRxMs: base + 1000 + 400, deviceTimeMaxMs: 1000 },
        { hostRxMs: base + 1500 + 250, deviceTimeMaxMs: 1500 },
        { hostRxMs: base + 2000 + 600, deviceTimeMaxMs: 2000 },
        { hostRxMs: base + 2500 + 300, deviceTimeMaxMs: 2500 },
    ];
    const map = Core.estimateClockMap(batches);
    assert.equal(map.available, true);
    assert.equal(map.method, 'min-latency');
    assert.equal(map.offsetMs, base + 250, '最小遅延の観測が offset になる');
    assert.equal(map.offsetMinMs, base + 250);
    assert.equal(map.offsetMaxMs, base + 600);
    assert.equal(map.offsetMedianMs, base + 350);
    assert.equal(map.batches, 4);
    assert.equal(map.spanMs, 1500);
    assert.equal(map.offsetSpreadMs, 350, 'spread = max − min');
    assert.equal(map.frontierBatches, 4);
    // 再要求で古い serial だけが届いたバッチ（端末時刻が後退）は offset が大きいが spread に混ぜない
    const withReRequest = Core.estimateClockMap([...batches, { hostRxMs: base + 3000 + 300, deviceTimeMaxMs: 1200 }]);
    assert.equal(withReRequest.offsetMs, base + 250, '最小 offset は変わらない');
    assert.equal(withReRequest.offsetSpreadMs, 350, '再送バッチ（offset 2100 ms）は spread に入らない');
    assert.equal(withReRequest.offsetMaxMs, base + 600);
    assert.equal(withReRequest.batches, 5);
    assert.equal(withReRequest.frontierBatches, 4);
    assert.equal(Object.prototype.hasOwnProperty.call(map, 'driftPpm'), false, 'clock drift は出力しない（FIFO 追従遅れが支配的で誤解を招く）');
    assert.equal(Core.deviceToHostMs(map, 1234), base + 1484);
    assert.equal(Core.hostToDeviceMs(map, base + 1484), 1234);

    const empty = Core.estimateClockMap([]);
    assert.equal(empty.available, false);
    assert.equal(Core.deviceToHostMs(empty, 1), null);
    assert.equal(Core.hostToDeviceMs(empty, 1), null);

    // 日跨ぎ: 端末時刻が 0 に戻っても offset が跳ねない
    const midnight = Core.estimateClockMap([
        { hostRxMs: base + 300, deviceTimeMaxMs: 86399900 },
        { hostRxMs: base + 400 + 200, deviceTimeMaxMs: 100 },
    ]);
    assert.equal(midnight.offsetMs, base + 300 - 86399900);
    assert.equal(midnight.spanMs, 200);
}

// ── detectImpulse: 窓内の最大ノルム、窓外の大きなピークは無視 ────────
{
    const samples = makeSeries(100, 1000, 5000); // 約 19.2 s
    // 3.0 s 付近に 4.5 G、15 s 付近に 9 G（窓外）
    const hit = samples.findIndex((s) => s.t >= 5000 + 3000);
    samples[hit].converted_acc = { x: 3, y: 0, z: 3.354 }; // norm ≈ 4.5
    const late = samples.findIndex((s) => s.t >= 5000 + 15000);
    samples[late].converted_acc = { x: 9, y: 0, z: 0 };
    const entries = Core.orderSamples(samples);
    const impulse = Core.detectImpulse(entries, { windowMs: 10000 });
    assert.equal(impulse.serial_number, samples[hit].serial_number);
    assert.equal(impulse.packet_number, samples[hit].packet_number);
    assert.ok(Math.abs(impulse.acc_norm_g - 4.5) < 0.01);
    assert.ok(Math.abs(impulse.median_norm_g - 1) < 1e-9);
    assert.ok(impulse.prominence > 4);
    assert.equal(impulse.window_ms, 10000);
    assert.ok(impulse.window_samples > 2000 && impulse.window_samples < 2100);
    // 窓を広げれば窓外だったピークが候補になる
    const wide = Core.detectImpulse(entries, { windowMs: 20000 });
    assert.equal(wide.serial_number, samples[late].serial_number);
    assert.equal(Core.detectImpulse([], {}), null);
    // 窓のクランプ
    assert.equal(Core.clampImpulseWindowMs('abc'), Core.DEFAULT_IMPULSE_WINDOW_MS);
    assert.equal(Core.clampImpulseWindowMs(0), Core.MIN_IMPULSE_WINDOW_MS);
    assert.equal(Core.clampImpulseWindowMs(1e9), Core.MAX_IMPULSE_WINDOW_MS);
}

// ── alignMarker: 最近傍サンプル・residual ─────────────────────────────
{
    const base = 1700000000000;
    const samples = makeSeries(10, 50, 1000); // 端末 1000〜約1942 ms（1 packet ≈ 19.23 ms）
    const entries = Core.orderSamples(samples);
    const clock = Core.estimateClockMap([{ hostRxMs: base + 2000 + 300, deviceTimeMaxMs: entries[entries.length - 1].device_time_ms }]);
    // 端末 1500.0 ms に相当するホスト時刻で打刻 → serial 10 + 26 = 36 の packet 0 (26 × 4 × 1000/208 = 500.0 ms)
    const marker = { host_time_ms: Core.deviceToHostMs(clock, 1500) };
    const aligned = Core.alignMarker(marker, entries, clock);
    assert.equal(aligned.aligned_serial, 36);
    assert.equal(aligned.aligned_packet_number, 0);
    assert.ok(Math.abs(aligned.alignment_residual_ms) < 1e-6);
    // 端末 1502 ms → 最近傍は packet 0 (1500) ではなく… 1500 と 1504.8 の間で 1500 が近い
    const aligned2 = Core.alignMarker({ host_time_ms: Core.deviceToHostMs(clock, 1502) }, entries, clock);
    assert.equal(aligned2.aligned_sample_index, aligned.aligned_sample_index);
    assert.ok(Math.abs(aligned2.alignment_residual_ms - 2) < 1e-6);
    // 範囲外は端にクランプされ residual が大きくなる
    const outside = Core.alignMarker({ host_time_ms: Core.deviceToHostMs(clock, 5000) }, entries, clock);
    assert.equal(outside.aligned_sample_index, entries.length - 1);
    assert.ok(outside.alignment_residual_ms > 3000);
    assert.equal(Core.alignMarker(marker, entries, Core.estimateClockMap([])), null);
}

// ── serialContinuity: wraparound と欠損 range ─────────────────────────
{
    const c = Core.serialContinuity([65533, 65534, 0, 2, 3, 65534, 5]);
    assert.equal(c.first, 65533);
    assert.equal(c.last, 5);
    assert.equal(c.expected, 9);
    assert.equal(c.received, 6);
    assert.equal(c.missing, 3);
    assert.equal(c.expected, c.received + c.missing, '不変条件');
    assert.deepEqual(c.ranges, [
        { start: 65535, end: 65535, count: 1 },
        { start: 1, end: 1, count: 1 },
        { start: 4, end: 4, count: 1 },
    ]);
    const clean = Core.serialContinuity([1, 2, 3]);
    assert.equal(clean.missing, 0);
    assert.deepEqual(clean.ranges, []);
    const trailing = Core.serialContinuity([10, 11, 12, 20]);
    assert.deepEqual(trailing.ranges, [{ start: 13, end: 19, count: 7 }]);
    assert.equal(Core.formatRanges(trailing.ranges), '13-19');
    assert.equal(Core.formatRanges([]), '');
    assert.deepEqual(Core.serialContinuity([]).expected, 0);
}

// ── analyzeDevice + buildTrialCsv: 来歴列・単位・欠損表現 ─────────────
function makeTrial(options = {}) {
    const base = 1700000000000;
    const samples0 = makeSeries(100, 20, 36000000, { skip: options.skip0 || [] }); // 10:00:00.000
    const samples1 = makeSeries(500, 20, 36000000);
    const batchesFor = (samples) => {
        const batches = [];
        for (let i = 0; i < samples.length; i += 40) {
            const chunk = samples.slice(i, i + 40);
            batches.push({
                hostRxMs: base + Math.max(...chunk.map((s) => s.t)) - 36000000 + 350 + (i % 80 === 0 ? 100 : 0),
                deviceTimeMaxMs: Math.max(...chunk.map((s) => s.t)),
                serials: Array.from(new Set(chunk.map((s) => s.serial_number))),
            });
        }
        return batches;
    };
    const startedHostMs = base - 500;
    const device0 = Core.analyzeDevice({
        deviceId: 0, side: 'left', firmwareVersion: '1.2.3', samples: samples0, batches: batchesFor(samples0),
        dropped: options.dropped0 || 0, maxLag: 12, drainRecovered: 2, catchupRecovered: 1, durationMs: 400,
        impulseWindowMs: 10000, trialStartHostMs: startedHostMs, tzOffsetMinutes: TZ,
    });
    const device1 = Core.analyzeDevice({
        deviceId: 1, side: 'right', firmwareVersion: null, samples: samples1, batches: batchesFor(samples1),
        dropped: 0, maxLag: 3, durationMs: 400, impulseWindowMs: 10000, trialStartHostMs: startedHostMs, tzOffsetMinutes: TZ,
    });
    return {
        metadata: { participant_id: 'P01', trial_number: '3', condition: 'normal walk', surface: 'lab floor', footwear: 'sneaker, "own"', notes: 'line1\nline2' },
        startedHostMs,
        stoppedHostMs: base + 400,
        tzOffsetMinutes: TZ,
        timeZoneName: 'Asia/Tokyo',
        sdkVersion: '1.3.4',
        sdkVersionDate: '2026/09/06',
        devices: [device1, device0],
        markers: [
            { marker_index: 1, label: 'vicon start', host_time_ms: base + 100, elapsed_ms: 600, last_received_serial: { 0: 104, 1: 503 } },
            { marker_index: 2, label: 'stomp, "hard"', host_time_ms: base + 200, elapsed_ms: 700, last_received_serial: { 0: 109 } },
        ],
    };
}

{
    const trial = makeTrial({ skip0: [105, 106] });
    const report0 = trial.devices.find((d) => d.deviceId === 0);
    assert.equal(report0.continuity.expected, 20);
    assert.equal(report0.continuity.received, 18);
    assert.equal(report0.continuity.missing, 2);
    assert.deepEqual(report0.continuity.ranges, [{ start: 105, end: 106, count: 2 }]);
    assert.equal(report0.complete, false);
    assert.equal(report0.sampleCount, 72);
    assert.equal(report0.impulse.status, 'pending');
    assert.ok(typeof report0.impulse.host_time_est === 'string' && /\+09:00$/.test(report0.impulse.host_time_est));
    assert.ok(Number.isFinite(report0.impulse.elapsed_ms));
    const report1 = trial.devices.find((d) => d.deviceId === 1);
    assert.equal(report1.complete, true);
    assert.ok(report1.measuredRateHz > 207 && report1.measuredRateHz < 209, `実測レート ${report1.measuredRateHz}`);
    assert.ok(report0.measuredRateHz < report1.measuredRateHz, '欠損があるデバイスは実測レートが下がる（サンプル数/端末時刻スパン）');

    const csv = Core.buildTrialCsv(trial);
    const lines = csv.split('\n');
    const headerLines = lines.filter((line) => line.startsWith('#'));
    const headerIndex = lines.findIndex((line) => !line.startsWith('#'));
    assert.equal(lines[headerIndex], Core.SAMPLE_COLUMNS.join(','));
    assert.ok(headerLines.some((line) => line === '# participant_id: P01'));
    assert.ok(headerLines.some((line) => line === '# trial_number: 3'));
    assert.ok(headerLines.some((line) => line === '# notes: line1 line2'), '改行を含む notes は1行に畳む');
    assert.ok(headerLines.some((line) => line === '# device_0_firmware_version: 1.2.3'));
    assert.ok(headerLines.some((line) => line === '# device_1_firmware_version: '), 'FW 不明は空欄で明示');
    assert.ok(headerLines.some((line) => line === '# host_timezone: Asia/Tokyo (UTC+09:00)'));
    assert.ok(headerLines.some((line) => /^# recording_start_host: 2023-11-15T07:13:19\.500\+09:00$/.test(line)), headerLines.join('\n'));
    assert.ok(headerLines.some((line) => line.startsWith('# device_time_source:')));
    assert.ok(headerLines.some((line) => line.startsWith('# host_time_est_method:')));
    assert.ok(headerLines.some((line) => /^# device_0_clock_offset_spread_ms: \d+\.\d{3}$/.test(line)), headerLines.join('\n'));
    assert.equal(headerLines.some((line) => /drift/.test(line)), false);

    const dataLines = lines.slice(headerIndex + 1);
    assert.equal(dataLines.length, 72 + 80, 'device0 72 行 + device1 80 行');
    const first = dataLines[0].split(',');
    assert.equal(first.length, Core.SAMPLE_COLUMNS.length, '列数が一定');
    const col = (name) => first[Core.SAMPLE_COLUMNS.indexOf(name)];
    assert.equal(col('device_id'), '0', 'device_id 昇順に並ぶ');
    assert.equal(col('side'), 'left');
    assert.equal(col('firmware_version'), '1.2.3');
    assert.equal(col('sdk_version'), '1.3.4');
    assert.equal(col('sample_index'), '0');
    assert.equal(col('serial_number'), '100');
    assert.equal(col('packet_number'), '0');
    assert.equal(col('device_time_ms'), '36000000.000');
    assert.match(col('host_time_est'), /^2023-11-15T\d{2}:\d{2}:\d{2}\.\d{3}\+09:00$/);
    assert.equal(col('sampling_rate_hz'), '208');
    assert.equal(col('gyro_x_dps'), '1.500');
    assert.equal(col('acc_z_g'), '1.0000');
    assert.equal(col('press_1_adc'), '10', 'press_1 = press.values[0]');
    assert.equal(col('press_6_adc'), '60', 'press_6 = press.values[5]');
    // host_time_est_ms - startedHostMs = elapsed_ms
    assert.ok(Math.abs(Number(col('host_time_est_ms')) - trial.startedHostMs - Number(col('elapsed_ms'))) < 1e-6);
    // host_rx はバッチ到着時刻（host_time_est 以上）
    assert.ok(Number(col('host_rx_ms')) >= Number(col('host_time_est_ms')));
    // device 1 は FW 不明 → 空欄
    const device1Line = dataLines[72].split(',');
    assert.equal(device1Line[Core.SAMPLE_COLUMNS.indexOf('device_id')], '1');
    assert.equal(device1Line[Core.SAMPLE_COLUMNS.indexOf('firmware_version')], '');
    // 欠損 serial 105/106 は CSV に現れない
    const serials = new Set(dataLines.slice(0, 72).map((line) => Number(line.split(',')[Core.SAMPLE_COLUMNS.indexOf('serial_number')])));
    assert.equal(serials.has(105), false);
    assert.equal(serials.has(107), true);
    // 4 行 / serial
    assert.equal(dataLines.slice(0, 72).filter((line) => line.split(',')[Core.SAMPLE_COLUMNS.indexOf('serial_number')] === '104').length, 4);
}

// ── マーカー CSV: 突き合わせ列と CSV エスケープ ─────────────────────────
{
    const trial = makeTrial();
    const columns = Core.markerColumnsFor(trial);
    assert.deepEqual(columns.slice(0, 5), Core.MARKER_BASE_COLUMNS);
    assert.ok(columns.includes('device_0_aligned_serial'));
    assert.ok(columns.includes('device_1_alignment_residual_ms'));
    const csv = Core.buildMarkersCsv(trial);
    const lines = csv.split('\n');
    assert.equal(lines[0], columns.join(','));
    assert.equal(lines.length, 3);
    assert.ok(lines[2].includes('"stomp, ""hard"""'), 'カンマと引用符を含むラベルはエスケープされる');
    const aligned = Core.alignMarkers(trial);
    assert.equal(aligned[0].devices[0].last_received_serial, 104);
    assert.equal(aligned[1].devices[1].last_received_serial, null, '記録が無いデバイスは null');
    assert.ok(Number.isInteger(aligned[0].devices[0].aligned_serial));
    assert.ok(Number.isInteger(aligned[0].devices[1].aligned_sample_index));
    assert.match(aligned[0].host_time, /\+09:00$/);
    // マーカーは元の配列を変更しない
    assert.equal(Object.prototype.hasOwnProperty.call(trial.markers[0], 'devices'), false);
}

// ── 欠損レポート / 試行 JSON / セッション CSV ────────────────────────
{
    const trial = makeTrial({ skip0: [110], dropped0: 1 });
    const loss = Core.buildLossReport(trial);
    assert.equal(loss.nominal_rate_hz, 208);
    assert.equal(loss.devices.length, 2);
    assert.deepEqual(loss.devices.map((d) => d.device_id), [0, 1]);
    const d0 = loss.devices[0];
    assert.equal(d0.expected, d0.received + d0.missing);
    assert.equal(d0.missing, 1);
    assert.equal(d0.dropped, 1);
    assert.equal(d0.max_lag, 12);
    assert.equal(d0.drain_recovered, 2);
    assert.equal(d0.catchup_recovered, 1);
    assert.deepEqual(d0.missing_ranges, [{ start: 110, end: 110, count: 1 }]);
    assert.equal(d0.complete, false);
    assert.equal(loss.devices[1].complete, true);
    assert.ok(typeof loss.definitions.dropped === 'string');

    const json = Core.buildTrialJson(trial);
    assert.equal(json.sdk_version, '1.3.4');
    assert.equal(json.metadata.participant_id, 'P01');
    assert.equal(json.metadata.notes, 'line1\nline2', 'JSON は改行を保持する');
    assert.equal(json.devices[0].device_id, 0);
    assert.equal(json.devices[0].clock.method, 'min-latency');
    assert.ok(Number.isFinite(json.devices[0].clock.offset_spread_ms));
    assert.equal('drift_ppm' in json.devices[0].clock, false);
    assert.equal(json.devices[0].impulse_candidate.status, 'pending');
    assert.equal(json.markers.length, 2);
    assert.equal(json.loss_report.devices[0].missing, 1);
    assert.equal(json.files.samples_csv, `${Core.trialBaseName(trial)}_samples.csv`);
    assert.doesNotThrow(() => JSON.stringify(json));
    assert.equal(JSON.stringify(json).includes('"entries"'), false, 'サンプル本体は JSON に含めない');

    const summary = Core.summarizeTrial(trial);
    assert.equal(summary.trial_number, '3');
    assert.equal(summary.samples, 76 + 80);
    assert.equal(summary.missing, 1);
    assert.equal(summary.dropped, 1);
    assert.equal(summary.complete, false);
    assert.equal(summary.markers, 2);
    assert.equal(summary.impulse_status, 'pending pending');
    assert.equal(summary.devices, '0:left 1:right');
    const sessionCsv = Core.buildSessionCsv([summary]);
    const sessionLines = sessionCsv.split('\n');
    assert.equal(sessionLines[0], Core.SESSION_COLUMNS.join(','));
    assert.equal(sessionLines.length, 3, 'notes の改行は引用符内に保持される（1行 + 引用符内改行）');
    assert.ok(sessionCsv.includes('"line1\nline2"'));
}

// ── ファイル名・trial_number ─────────────────────────────────────────
{
    assert.equal(Core.nextTrialNumber('3'), '4');
    assert.equal(Core.nextTrialNumber('T03'), 'T04');
    assert.equal(Core.nextTrialNumber('009'), '010');
    assert.equal(Core.nextTrialNumber('99'), '100');
    assert.equal(Core.nextTrialNumber(''), '1');
    assert.equal(Core.nextTrialNumber(null), '1');
    assert.equal(Core.nextTrialNumber('abc'), 'abc');
    assert.equal(Core.sanitizeFilename('P 01/α'), 'P-01');
    assert.equal(Core.sanitizeFilename(''), 'na');
    assert.equal(Core.sanitizeFilename('--x--'), 'x');
    assert.equal(Core.sanitizeFilename('a'.repeat(80)).length, 40);
    const trial = makeTrial();
    assert.equal(Core.trialBaseName(trial), 'orphe-lab_P01_T3_normal-walk_20231115-071319');
    assert.equal(Core.trialBaseName({ metadata: {}, startedHostMs: NaN }), 'orphe-lab_anon_T0_cond_time');
    const meta = Core.normalizeMetadata({ participant_id: '  P1 ', extra: 'x' });
    assert.deepEqual(Object.keys(meta), Core.METADATA_FIELDS);
    assert.equal(meta.participant_id, 'P1');
    assert.equal(meta.notes, '');
}

// ── 左右アライメント ─────────────────────────────────────────────────
{
    const a = { firstSerial: 65530, latestSerial: 20, firstDeviceTimeMs: 1000, latestDeviceTimeMs: 1000 + 26 * Core.PACKET_INTERVAL_MS };
    const b = { firstSerial: 100, latestSerial: 124, firstDeviceTimeMs: 5000, latestDeviceTimeMs: 5000 + 24 * Core.PACKET_INTERVAL_MS };
    const summary = Core.alignmentSummary(a, b);
    assert.equal(summary.available, true);
    assert.equal(summary.a.serials, 26, 'wrap をまたいだ進み');
    assert.equal(summary.b.serials, 24);
    assert.equal(summary.deltaSerials, -2);
    assert.ok(Math.abs(summary.deltaSerialsAsMs - (-2 * Core.PACKET_INTERVAL_MS)) < 1e-9);
    assert.ok(Math.abs(summary.deltaTimeMs - (-2 * Core.PACKET_INTERVAL_MS)) < 1e-6);
    assert.equal(Core.alignmentSummary(a, null).available, false);
    assert.equal(Core.alignmentSummary(null, null).deltaSerials, null);
}

// ── データ辞書: CSV の全列を説明していること ──────────────────────────
{
    const dictionary = Core.buildDataDictionary({ sdkVersion: '1.3.4' });
    for (const column of Core.SAMPLE_COLUMNS) {
        assert.ok(dictionary.includes(`| \`${column}\` |`), `データ辞書に列 ${column} が無い`);
        assert.ok(Core.SAMPLE_COLUMN_DOCS[column], `SAMPLE_COLUMN_DOCS に ${column} が無い`);
    }
    for (const column of Core.MARKER_BASE_COLUMNS) {
        assert.ok(dictionary.includes(`| \`${column}\` |`), `データ辞書にマーカー列 ${column} が無い`);
    }
    for (const column of Core.MARKER_DEVICE_COLUMNS) {
        assert.ok(dictionary.includes(`device_N_${column}`), `データ辞書にマーカー列 device_N_${column} が無い`);
    }
    assert.ok(dictionary.includes('SDK 1.3.4'));
    assert.ok(dictionary.includes('comment=\'#\''));
    assert.ok(/quaternion/i.test(dictionary) && /Step Analysis/.test(dictionary), 'FIFO の制約を辞書にも書く');
    assert.equal(/clearance/i.test(dictionary) && !/No gait parameters/.test(dictionary), false);
    assert.equal(Object.keys(Core.SAMPLE_COLUMN_DOCS).length, Core.SAMPLE_COLUMNS.length);
}

// ── ページ資産: i18n の ja/en キー一致、index.html の参照キーが定義済み、app.js が SDK の FIFO を使う ──
{
    const I18n = require('../examples/lab-recorder/i18n.js');
    const ja = Object.keys(I18n.translations.ja).sort();
    const en = Object.keys(I18n.translations.en).sort();
    assert.deepEqual(ja, en, 'i18n の ja / en でキーが一致していない');
    const html = read('index.html');
    const referenced = new Set();
    for (const match of html.matchAll(/data-i18n(?:-html|-aria-label)?="([^"]+)"/g)) referenced.add(match[1]);
    for (const key of referenced) {
        assert.ok(I18n.translations.ja[key] !== undefined, `index.html が参照する i18n キー ${key} が ja に無い`);
    }
    assert.ok(referenced.size > 40, 'index.html の i18n 参照が少なすぎる');
    // ページの制約明記（FIFO では Step Analysis と quaternion が使えない）
    assert.match(I18n.translations.ja.fifoConstraint, /Step Analysis/);
    assert.match(I18n.translations.en.fifoConstraint, /quaternion/i);
    // app.js の i18n キー参照が定義済みであること（t("key") / "logXxx" 形式の静的参照だけ拾う）
    const app = read('app.js');
    for (const match of app.matchAll(/\bt\(\s*"([A-Za-z0-9_]+)"/g)) {
        assert.ok(I18n.translations.ja[match[1]] !== undefined, `app.js が参照する i18n キー ${match[1]} が未定義`);
    }
    for (const match of app.matchAll(/\blog\(\s*"[a-z]+",\s*"([A-Za-z0-9_]+)"/g)) {
        assert.ok(I18n.translations.ja[match[1]] !== undefined, `app.js のログキー ${match[1]} が未定義`);
    }
    // FIFO プロトコルは SDK 経由で使う（自前実装しない）
    assert.match(app, /startMeasurement\(\{[\s\S]*profile:\s*"fifo-recording"/);
    assert.match(app, /stopMeasurement\(/);
    assert.equal(/new\s+OrpheInsoleFifo\(/.test(app), false, 'Toolkit セッション経由で FIFO を使う');
    assert.equal(/gotGait|OrpheInsoleGait|stride_z|clearance/.test(app), false, '歩容指標・未検証導出値は扱わない');
    assert.match(html, /recorder-core\.js/);
    assert.match(html, /InsoleFifo\.js/);
    assert.match(html, /InsoleToolkit\.js/);
    assert.equal(/InsoleGait\.js/.test(html), false, 'Step Analysis は読み込まない（FIFO と併用不可）');
    // fifo-guide の資産は参照しない（fifo-guide は変更禁止・独立させる）
    assert.equal(/fifo-guide/.test(html), false);
}

// ── charts.js: store / 数値処理（Canvas 非依存の部分） ─────────────────────
{
    const Charts = require('../examples/lab-recorder/charts.js');
    assert.deepEqual(Charts.KINDS, ['acc', 'gyro', 'press']);
    assert.equal(Charts.CHANNELS.press.length, 6);
    assert.equal(Charts.COLORS.press.length, 6);

    // niceRange: 対称は 0 中心・最小レンジで下限、非対称は 0 始まり
    assert.deepEqual(Charts.niceRange(-0.3, 1.1, { symmetric: true, minSpan: 2 }), { min: -2, max: 2 });
    assert.deepEqual(Charts.niceRange(-4.2, 6.37, { symmetric: true, minSpan: 2 }), { min: -10, max: 10 });
    assert.deepEqual(Charts.niceRange(200, 800, { symmetric: false, minSpan: 1000 }), { min: 0, max: 2000 });
    assert.deepEqual(Charts.niceRange(0, 5976, { symmetric: false, minSpan: 1000 }), { min: 0, max: 10000 });
    assert.deepEqual(Charts.niceRange(NaN, NaN, { symmetric: true, minSpan: 2 }), { min: -2, max: 2 });
    assert.equal(Charts.niceCeil(0), 1);
    assert.equal(Charts.niceCeil(1.05), 2);
    assert.equal(Charts.niceCeil(230), 250);
    assert.equal(Charts.niceStep(2.3), 5);

    // appendSamples: 順不同（再要求分）が dirty になり、sort で時刻順へ。日跨ぎも吸収
    const store = Charts.createStore();
    const batchA = makeSeries(10, 3, 86399950);        // 23:59:59.950 → 日跨ぎ
    const batchB = makeSeries(13, 2, 86399950 + 3 * Core.PACKET_INTERVAL_MS);
    assert.equal(Charts.appendSamples(store, batchB), 8);
    // trim なしで追記すると順序が崩れて dirty になる
    const raw = Charts.createStore();
    Charts.appendSamples(raw, batchB, { keepSeconds: 0 });
    Charts.appendSamples(raw, batchA, { keepSeconds: 0 });
    assert.equal(raw.dirty, true, '古い serial が後から届くと dirty');
    Charts.sortStore(raw);
    assert.equal(raw.dirty, false);
    // 既定（trim あり）では追記時に並べ替えまで済む
    assert.equal(Charts.appendSamples(store, batchA), 12, '古い serial が後から届く');
    assert.equal(store.dirty, false, 'trim が sort を済ませる');
    for (let i = 1; i < store.x.length; i += 1) assert.ok(store.x[i] > store.x[i - 1], `x 単調増加 index=${i}`);
    assert.equal(store.x.length, 20);
    // baseMs は最初に届いた batchB の先頭。batchA はそれより前なので x は負
    const negatives = store.x.filter((x) => x < 0).length;
    assert.equal(negatives, 12, 'batchA（12 サンプル）は基準より前なので負の x');
    assert.equal(store.serial[0], 10);
    // 末尾のサンプル（日跨ぎ後）も基準からの秒として正しく連続する
    const ext = Charts.extent(store);
    assert.ok(ext.x1 - ext.x0 > 0.09 && ext.x1 - ext.x0 < 0.1, `span ${ext.x1 - ext.x0}`);
    assert.equal(store.acc[2][0], 1);
    assert.equal(store.press[5][0], 60);

    // trim: keepSeconds より古いものを落とす
    const long = Charts.createStore();
    Charts.appendSamples(long, makeSeries(0, 600, 1000), { keepSeconds: 5 }); // 約 11.5 s
    const longExt = Charts.extent(long);
    assert.ok(longExt.x1 - longExt.x0 <= 5.05 && longExt.x1 - longExt.x0 > 4.9, `trim 後 span ${longExt.x1 - longExt.x0}`);
    assert.equal(long.x.length, long.serial.length);
    assert.equal(long.x.length, long.press[0].length);

    // fromEntries + gapShades: 欠損 serial の区間だけ網掛け
    const samples = makeSeries(100, 20, 36000000, { skip: [105, 106, 112] });
    const entries = Core.orderSamples(samples);
    const xOf = (entry) => (entry.device_time_ms - 36000000) / 1000;
    const review = Charts.fromEntries(entries, xOf);
    assert.equal(review.x.length, 68);
    assert.equal(review.x[0], 0);
    const shades = Charts.gapShades(entries, xOf);
    assert.equal(shades.length, 2);
    assert.equal(shades[0].serials, 2);
    assert.equal(shades[1].serials, 1);
    assert.ok(Math.abs(shades[0].x0 - (4 * Core.PACKET_INTERVAL_MS + 3 * Core.FRAME_INTERVAL_MS) / 1000) < 1e-9, '欠損直前の最後の frame から');
    assert.ok(Math.abs(shades[0].x1 - (7 * Core.PACKET_INTERVAL_MS) / 1000) < 1e-9, '欠損直後の最初の frame まで');
    assert.deepEqual(Charts.gapShades(Core.orderSamples(makeSeries(1, 5, 0)), xOf), []);

    // envelope: 列ごとの min/max がピークを保つ
    const xs = review.x;
    const ys = review.acc[2].map((v, i) => (i === 30 ? 9 : v));
    const env = Charts.envelope(xs, ys, xs[0], xs[xs.length - 1], 8);
    assert.equal(env.length, 8);
    assert.equal(Math.max(...env.filter(Boolean).map((c) => c.max)), 9, 'ピークが残る');
    assert.equal(Math.min(...env.filter(Boolean).map((c) => c.min)), 1);
    assert.deepEqual(Charts.envelope(xs, ys, 5, 5, 4), [null, null, null, null]);

    // indexRange / nearestIndex / rangeOf
    assert.deepEqual(Charts.indexRange([0, 1, 2, 3, 4], 1, 3), [1, 4]);
    assert.equal(Charts.nearestIndex([0, 1, 2, 3], 1.4), 1);
    assert.equal(Charts.nearestIndex([0, 1, 2, 3], 1.6), 2);
    assert.equal(Charts.nearestIndex([0, 1, 2, 3], -5), 0);
    assert.equal(Charts.nearestIndex([0, 1, 2, 3], 99), 3);
    assert.equal(Charts.nearestIndex([], 1), -1);
    assert.deepEqual(Charts.rangeOf(review, 'press', 0, 1), { min: 10, max: 60 });
    assert.equal(Charts.rangeOf(Charts.createStore(), 'acc', 0, 1), null);

    // resolveView: ライブは末尾追従、all は全体、zoom 優先、空は既定幅
    const liveView = Charts.resolveView(long, '5', null);
    assert.ok(Math.abs(liveView.x1 - longExt.x1) < 1e-9 && Math.abs(liveView.x1 - liveView.x0 - 5) < 1e-9);
    const allView = Charts.resolveView(review, 'all', null);
    assert.equal(allView.x0, 0);
    assert.ok(allView.x1 >= review.x[review.x.length - 1]);
    assert.deepEqual(Charts.resolveView(review, 'all', { x0: 0.1, x1: 0.2 }), { x0: 0.1, x1: 0.2 });
    assert.deepEqual(Charts.resolveView(Charts.createStore(), '10', null), { x0: 0, x1: 10 });

    // readoutAt / formatTick
    const line = Charts.readoutAt(review, 0);
    assert.match(line, /^t=0\.000 s {2}· {2}serial 100 {2}· {2}acc 0\.00 \/ 0\.00 \/ 1\.00 G/);
    assert.match(line, /press 10 20 30 40 50 60$/);
    assert.equal(Charts.readoutAt(review, 999), '');
    assert.equal(Charts.formatTick(2), '2');
    assert.equal(Charts.formatTick(0.5), '0.50');
    assert.equal(Charts.formatTick(12.5), '12.5');
    assert.equal(Charts.formatTick(2000), '2000');

    // ページ資産: charts.js を読み込み、app.js が store を使う
    const html = read('index.html');
    assert.match(html, /charts\.js/);
    assert.ok(html.indexOf('charts.js') < html.indexOf('app.js?'), 'charts.js は app.js より前に読み込む');
    const app = read('app.js');
    assert.match(app, /Charts\.appendSamples\(/);
    // sdk_version は SDK 定数 → package.json → ソースの @version の順で解決（Pages では package.json が 404）
    assert.match(app, /OrpheInsole\.SDK_VERSION/);
    assert.match(app, /@version\\s\+/);
    assert.match(app, /Charts\.fromEntries\(/);
    assert.match(app, /Charts\.gapShades\(/);
}

console.log('lab-recorder-core tests passed');
