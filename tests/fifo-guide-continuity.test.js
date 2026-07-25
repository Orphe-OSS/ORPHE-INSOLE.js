const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../examples/fifo-guide/continuity.js');
const Fifo = require('../src/InsoleFifo.js');

// InsoleToolkit.js は読み込み時に insoles = [new OrpheInsole(0), ...] を作るため、
// Node では最小のスタブを先に置いてから require する（他のToolkitテストと同じ流儀）。
class BootstrapInsole {
    constructor(id = 0) {
        this.id = id;
        this._afterReconnectSuccess = [];
    }
}
global.OrpheInsole = BootstrapInsole;
const { insoleToolkitMeasurementToCSV } = require('../src/InsoleToolkit.js');

const GUIDE_DIR = path.join(__dirname, '..', 'examples', 'fifo-guide');
const read = (name) => fs.readFileSync(path.join(GUIDE_DIR, name), 'utf8');

// ── 約30秒バッファの根拠が SDK の実装定数と一致していること ─────────────────
// ページ・README が示す換算式が、src/InsoleFifo.js の定数から外れたら落とす。
{
    assert.equal(C.RING_BUFFER_CAPACITY, Fifo.RING_BUFFER_CAPACITY,
        'continuity.js の RING_BUFFER_CAPACITY が InsoleFifo.js と一致していない');
    assert.equal(C.FRAMES_PER_PACKET, 4);
    assert.equal(C.FRAME_INTERVAL_MS, 5);
    assert.equal(C.PACKET_INTERVAL_MS, 20);
    assert.equal(C.BUFFER_WINDOW_MS, 30000);

    // 1 serial packet が 4 フレーム × 5 ms であることをデコーダ実装で裏取りする
    const dv = new DataView(new ArrayBuffer(104));
    dv.setUint8(0, 0x36);
    dv.setUint16(1, 1000);
    const decoded = Fifo.decodePacket(dv);
    assert.equal(decoded.samples.length, C.FRAMES_PER_PACKET);
    const deltas = decoded.samples.map((sample) => sample.t - decoded.timestamp);
    assert.deepEqual(deltas, [0, 5, 10, 15]);
    assert.equal(
        C.RING_BUFFER_CAPACITY * C.FRAMES_PER_PACKET * C.FRAME_INTERVAL_MS,
        C.BUFFER_WINDOW_MS
    );
}

// ── 判定ロジックに表示文字列（日本語）を持たせていないこと ─────────────────
// 英語表示に日本語が混ざるのを防ぐため、continuity.js は code + params だけを返す。
{
    const source = read('continuity.js');
    const body = source.split('(function (global) {')[1];
    const offending = body.split('\n').filter((line) => (
        /[\u3040-\u30ff\u4e00-\u9faf]/.test(line) && !/^\s*(\*|\/\/|\/\*)/.test(line)
    ));
    assert.deepEqual(offending, [], `continuity.js に表示用の日本語が残っている:\n${offending.join('\n')}`);
}

// ── 欠損0 → PASS（緑） ──────────────────────────────────────────────────
{
    const serials = [];
    for (let i = 1000; i < 1500; i += 1) serials.push(i);
    const analysis = C.analyzeSerials(serials);
    assert.equal(analysis.first, 1000);
    assert.equal(analysis.last, 1499);
    assert.equal(analysis.expected, 500);
    assert.equal(analysis.received, 500);
    assert.equal(analysis.missing, 0);
    assert.equal(analysis.missingRate, 0);
    assert.deepEqual(analysis.missingRanges, []);

    const verdict = C.evaluateRecording({ analysis, dropped: 0, durationMs: 10000, maxLag: 60 });
    assert.equal(verdict.level, 'pass');
    assert.equal(verdict.label, 'PASS');
    assert.equal(verdict.continuity.level, 'pass');
    assert.equal(verdict.continuity.label, 'PASS');
    assert.equal(verdict.continuity.text, undefined);   // 表示文字列は持たない
    assert.equal(verdict.cautions.length, 0);
}

// ── 単一欠損 → FAIL（赤） ───────────────────────────────────────────────
{
    const serials = [];
    for (let i = 100; i <= 110; i += 1) {
        if (i === 105) continue;
        serials.push(i);
    }
    const analysis = C.analyzeSerials(serials);
    assert.equal(analysis.expected, 11);
    assert.equal(analysis.received, 10);
    assert.equal(analysis.missing, 1);
    assert.deepEqual(analysis.missingRanges.map((r) => r.label), ['105']);

    const verdict = C.evaluateRecording({ analysis, dropped: 0, durationMs: 10000 });
    assert.equal(verdict.level, 'fail');
    assert.equal(verdict.label, 'FAIL');
    assert.equal(verdict.continuity.level, 'fail');
}

// ── 連続欠損 → FAIL + range 表記 ─────────────────────────────────────────
{
    const serials = [];
    for (let i = 1190; i <= 1220; i += 1) {
        if (i >= 1200 && i <= 1208) continue;   // 9連続欠損
        if (i === 1215) continue;               // 単発欠損
        serials.push(i);
    }
    const analysis = C.analyzeSerials(serials);
    assert.equal(analysis.expected, 31);
    assert.equal(analysis.missing, 10);
    assert.deepEqual(analysis.missingRanges.map((r) => r.label), ['1200–1208', '1215']);
    assert.deepEqual(analysis.missingRanges.map((r) => r.count), [9, 1]);
    assert.equal(C.formatMissingRanges(analysis.missingRanges), '1200–1208, 1215');
    // 「残り N 件」の文言は表示側から渡す（continuity.js に表示文字列を持たせない）
    assert.equal(
        C.formatMissingRanges(analysis.missingRanges, { limit: 1, moreText: '… ほか {count} 区間' }),
        '1200–1208 … ほか 1 区間'
    );
    assert.equal(
        C.formatMissingRanges(analysis.missingRanges, { limit: 1, moreText: '… and {count} more ranges' }),
        '1200–1208 … and 1 more ranges'
    );
    assert.equal(C.formatMissingRanges(analysis.missingRanges, { limit: 1 }), '1200–1208 (+1)');

    const verdict = C.evaluateRecording({ analysis, dropped: 10, durationMs: 20000 });
    assert.equal(verdict.level, 'fail');
}

// ── uint16 65535→0 の wraparound ────────────────────────────────────────
{
    const analysis = C.analyzeSerials([65533, 65534, 65535, 0, 1, 2]);
    assert.equal(analysis.first, 65533);
    assert.equal(analysis.last, 2);
    assert.equal(analysis.expected, 6);
    assert.equal(analysis.received, 6);
    assert.equal(analysis.missing, 0);

    // wrap をまたいだ欠損も serial 番号として正しく表示される
    const gapped = C.analyzeSerials([65534, 65535, 1, 2]);
    assert.equal(gapped.expected, 5);
    assert.equal(gapped.received, 4);
    assert.equal(gapped.missing, 1);
    assert.deepEqual(gapped.missingRanges.map((r) => r.label), ['0']);

    // 65530,65531 / [65532..2 が欠損] / 3,4 → スパン11・欠損7、range は wrap をまたぐ
    const wrapRange = C.analyzeSerials([65530, 65531, 3, 4]);
    assert.equal(wrapRange.first, 65530);
    assert.equal(wrapRange.last, 4);
    assert.equal(wrapRange.expected, 11);
    assert.equal(wrapRange.received, 4);
    assert.equal(wrapRange.missing, 7);
    assert.deepEqual(wrapRange.missingRanges.map((r) => r.label), ['65532–2']);
}

// ── 重複 serial は received を増やさない ─────────────────────────────────
{
    const analysis = C.analyzeSerials([10, 11, 11, 12, 12, 12, 13]);
    assert.equal(analysis.expected, 4);
    assert.equal(analysis.received, 4);
    assert.equal(analysis.missing, 0);
    assert.equal(analysis.duplicates, 3);
}

// ── 順不同（drain / 再要求で後から届く）でも整合する ─────────────────────
{
    // 先頭 serial が最初の要求で落ち、あとの再要求で回収されたケース
    const analysis = C.analyzeSerials([501, 502, 505, 503, 504, 500]);
    assert.equal(analysis.first, 500);
    assert.equal(analysis.last, 505);
    assert.equal(analysis.expected, 6);
    assert.equal(analysis.received, 6);
    assert.equal(analysis.missing, 0);
    assert.ok(analysis.outOfOrder >= 1);

    // received / expected / missing の恒等式
    assert.equal(analysis.received + analysis.missing, analysis.expected);
}

// ── received/expected/missing の整合性（ランダム欠損） ────────────────────
{
    let seed = 20260725;
    const random = () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
    };
    const serials = [];
    const dropped = new Set();
    for (let i = 0; i < 3000; i += 1) {
        const serial = (64000 + i) % 65536;   // wrap をまたぐ長いスパン
        if (random() < 0.02) { dropped.add(serial); continue; }
        serials.push(serial);
    }
    const analysis = C.analyzeSerials(serials);
    assert.equal(analysis.received, serials.length);
    assert.equal(analysis.received + analysis.missing, analysis.expected);
    // 先頭・末尾が落ちるとスパンが縮むので「スパン内の欠損数」と一致することを確認
    const spanMissing = analysis.missingRanges.reduce((sum, range) => sum + range.count, 0);
    assert.equal(spanMissing, analysis.missing);
}

// ── timeline 集約後も欠損数が一致する ────────────────────────────────────
{
    const serials = [];
    const missingSet = new Set([1200, 1201, 1202, 1500, 3000, 3001, 3002, 3003]);
    for (let i = 1000; i < 4000; i += 1) {
        if (missingSet.has(i)) continue;
        serials.push(i);
    }
    const analysis = C.analyzeSerials(serials);
    assert.equal(analysis.missing, missingSet.size);

    for (const binCount of [1, 7, 60, 240, 1000, 5000]) {
        const bins = C.buildTimelineBins(analysis, binCount);
        const totalMissing = bins.reduce((sum, bin) => sum + bin.missing, 0);
        const totalReceived = bins.reduce((sum, bin) => sum + bin.received, 0);
        const total = bins.reduce((sum, bin) => sum + bin.total, 0);
        assert.equal(totalMissing, analysis.missing, `binCount=${binCount} の missing 合計が一致しない`);
        assert.equal(totalReceived, analysis.received, `binCount=${binCount} の received 合計が一致しない`);
        assert.equal(total, analysis.expected, `binCount=${binCount} の serial 総数が一致しない`);
        // 集約表示でも bin 数は上限を超えない（DOM/メモリを増やさない）
        assert.ok(bins.length <= Math.max(1, Math.min(binCount, analysis.expected)));
    }

    // 欠損0なら赤いbinが1つも出ない
    const clean = C.analyzeSerials(Array.from({ length: 500 }, (_, i) => 2000 + i));
    assert.equal(C.buildTimelineBins(clean, 240).every((bin) => bin.missing === 0), true);
}

// ── 長時間データでも配列・メモリが無制限に増えない ───────────────────────
{
    // 10分相当（30000 serial）でも bin 数は固定、内部 Set は serial 空間で上限
    const serials = [];
    for (let i = 0; i < 30000; i += 1) serials.push((10000 + i) % 65536);
    const analysis = C.analyzeSerials(serials);
    assert.equal(analysis.expected, 30000);
    assert.ok(analysis.offsets.size <= C.SERIAL_MOD);
    const bins = C.buildTimelineBins(analysis, C.DEFAULT_BIN_COUNT);
    assert.equal(bins.length, C.DEFAULT_BIN_COUNT);
    assert.equal(bins.reduce((sum, bin) => sum + bin.total, 0), analysis.expected);
}

// ── 30秒以下 / 超過の表示判定 ────────────────────────────────────────────
{
    assert.equal(C.bufferGuidance(10000).level, 'recommended');
    assert.equal(C.bufferGuidance(10000).expectedPackets, 500);
    assert.equal(C.bufferGuidance(30000).level, 'recommended');   // ちょうど30秒は推奨帯
    assert.equal(C.bufferGuidance(30000).withinWindow, true);
    assert.equal(C.bufferGuidance(30001).level, 'caution');        // 選択値の表示は許容幅なし
    assert.equal(C.bufferGuidance(60000).level, 'caution');
    assert.equal(C.bufferGuidance(60000).expectedPackets, 3000);

    const clean = C.analyzeSerials(Array.from({ length: 100 }, (_, i) => i + 1));

    // 欠損0 + 30秒以内 → 緑
    assert.equal(C.evaluateRecording({ analysis: clean, dropped: 0, durationMs: 29000 }).level, 'pass');

    // 「30秒」を選んだ収録の実測は 30,00x ms になる。これを警告にしない（実機で踏んだ回帰）
    assert.equal(C.BUFFER_WINDOW_TOLERANCE_MS, 1000);
    for (const durationMs of [30000, 30003, 30250, 31000]) {
        const jitter = C.evaluateRecording({ analysis: clean, dropped: 0, durationMs, maxLag: 298 });
        assert.equal(jitter.level, 'pass', `durationMs=${durationMs} が pass にならない`);
        assert.equal(jitter.cautions.length, 0, `durationMs=${durationMs} に不要な注意が出ている`);
        assert.equal(jitter.buffer.withinWindow, true);
    }
    // 許容幅を超えたら警告に戻る
    assert.equal(C.evaluateRecording({ analysis: clean, dropped: 0, durationMs: 31001 }).level, 'caution');
    // 許容幅は呼び出し側で明示指定もできる
    assert.equal(
        C.evaluateRecording({ analysis: clean, dropped: 0, durationMs: 30003, toleranceMs: 0 }).level,
        'caution'
    );

    // 欠損0 + 30秒超過 → 黄（欠損なしの表示は維持する）
    const over = C.evaluateRecording({ analysis: clean, dropped: 0, durationMs: 60000 });
    assert.equal(over.level, 'caution');
    assert.equal(over.label, 'WARN');
    assert.equal(over.continuity.level, 'pass');
    assert.equal(over.cautions.length, 1);
    // 注意は言語非依存の code + params（英語表示に日本語が混ざらないようにする）
    assert.equal(over.cautions[0].code, 'overBuffer');
    assert.equal(over.cautions[0].params.window, 30);
    for (const caution of over.cautions) {
        assert.equal(typeof caution.code, 'string');
        assert.doesNotMatch(caution.code, /[^\x20-\x7e]/);   // ASCII のみ = 表示文字列ではない
    }

    // 欠損0 + lag がバッファ容量へ接近 → 黄
    const tight = C.evaluateRecording({ analysis: clean, dropped: 0, durationMs: 10000, maxLag: 900 });
    assert.equal(tight.level, 'caution');
    assert.equal(tight.cautions[0].code, 'lagHigh');
    assert.equal(tight.cautions[0].params.maxLag, 900);
    assert.equal(tight.cautions[0].params.percent, 60);
    assert.equal(tight.buffer.lagOverCapacity, false);

    // lag が上限を超えたら「上書き確定」として別コードにする（実機2台で maxLag 1560 を観測）
    const overCapacity = C.evaluateRecording({
        analysis: clean, dropped: 0, durationMs: 60000, maxLag: 1560,
    });
    assert.equal(overCapacity.buffer.lagOverCapacity, true);
    assert.deepEqual(overCapacity.cautions.map((caution) => caution.code),
        ['overBuffer', 'lagOverCapacity']);
    // 上限超のときは lagHigh を重ねない
    assert.equal(overCapacity.cautions.filter((caution) => caution.code === 'lagHigh').length, 0);
    assert.equal(C.evaluateRecording({ analysis: clean, dropped: 0, durationMs: 10000, maxLag: 1500 })
        .buffer.lagOverCapacity, false);

    // 欠損があれば 30秒以内でも赤（黄で上書きされない）
    const lossy = C.evaluateRecording({ analysis: clean, missing: 3, dropped: 0, durationMs: 60000 });
    assert.equal(lossy.level, 'fail');

    // dropped だけが 0 でない場合も赤（missing と dropped は別指標）
    const droppedOnly = C.evaluateRecording({ analysis: clean, dropped: 5, durationMs: 10000 });
    assert.equal(droppedOnly.level, 'fail');
    assert.equal(droppedOnly.missing, 0);
    assert.equal(droppedOnly.dropped, 5);
}

// ── 収録スパン（CSVが覆う時間）と予定時間の比 ───────────────────────────────
// 停止時点で未要求だった分は収録スパンに入らないため、CSVは予定より少し短くなる。
// これは missing ではないので別指標として出す。実機: 30.0 s 指定 → 1325 serial = 26.5 s。
{
    const exact = C.spanCoverage(1500, 30000);
    assert.equal(exact.spanMs, 30000);
    assert.equal(exact.ratio, 1);
    assert.equal(exact.level, 'ok');
    assert.equal(exact.shortfallSerials, 0);

    const observed = C.spanCoverage(1325, 30000);
    assert.equal(observed.spanMs, 26500);          // 1325 × 20 ms
    assert.equal(Math.round(observed.ratio * 100), 88);
    assert.equal(observed.level, 'warn');          // 90% 未満は「末尾が短い」
    assert.equal(observed.shortfallMs, 3500);
    assert.equal(observed.shortfallSerials, 175);

    // 閾値ちょうど（90%）は ok
    assert.equal(C.spanCoverage(1350, 30000).level, 'ok');
    assert.equal(C.spanCoverage(1349, 30000).level, 'warn');
    // 予定不明（0）のときは判定しない
    assert.equal(C.spanCoverage(500, 0).level, 'ok');
    assert.equal(C.spanCoverage(0, 30000).spanMs, 0);
    assert.equal(C.SPAN_COVERAGE_OK_RATIO, 0.9);

    // スパンが短いことは欠損（missing）とは無関係 — 判定は PASS のまま
    const clean = C.analyzeSerials(Array.from({ length: 1325 }, (_, i) => 1000 + i));
    assert.equal(clean.missing, 0);
    assert.equal(C.evaluateRecording({ analysis: clean, dropped: 0, durationMs: 30003 }).level, 'pass');
}

// ── 装着位置（mount_position bit0）とデバイス番号 ─────────────────────────
{
    assert.equal(C.sideFromMountPosition(0), 'left');
    assert.equal(C.sideFromMountPosition(1), 'right');
    assert.equal(C.sideFromMountPosition(0b10), 'left');    // bit1 は足背/足底なので無視
    assert.equal(C.sideFromMountPosition(0b11), 'right');
    // 未取得ならデバイス番号から推測しない（insoles[0] が左とは限らない）
    assert.equal(C.sideFromMountPosition(null), null);
    assert.equal(C.sideFromMountPosition(undefined), null);
    assert.equal(C.sideFromMountPosition('x'), null);
}

// ── 2台同時: デバイスごとに判定し、全体は最も悪い側に合わせる ────────────────
{
    const clean = C.analyzeSerials(Array.from({ length: 500 }, (_, i) => 1000 + i));
    const lossy = C.analyzeSerials(
        Array.from({ length: 500 }, (_, i) => 1000 + i).filter((serial) => serial !== 1200)
    );
    const pass = C.evaluateRecording({ analysis: clean, dropped: 0, durationMs: 10000 });
    const warn = C.evaluateRecording({ analysis: clean, dropped: 0, durationMs: 60000 });
    const fail = C.evaluateRecording({ analysis: lossy, dropped: 1, durationMs: 10000 });

    assert.equal(C.combineVerdicts([pass, pass]).level, 'pass');
    assert.equal(C.combineVerdicts([pass, pass]).label, 'PASS');
    // 片側だけ欠損 → 全体 FAIL（2台走行では片側だけ落ちることがある）
    assert.equal(C.combineVerdicts([pass, fail]).level, 'fail');
    assert.equal(C.combineVerdicts([fail, pass]).label, 'FAIL');
    // caution は fail に負ける
    assert.equal(C.combineVerdicts([warn, fail]).level, 'fail');
    assert.equal(C.combineVerdicts([pass, warn]).level, 'caution');
    // デバイスごとの判定は保持される
    assert.equal(C.combineVerdicts([pass, fail]).devices.length, 2);
    assert.equal(C.combineVerdicts([pass, fail]).devices[1].continuity.level, 'fail');
    // 1台・0台
    assert.equal(C.combineVerdicts([fail]).level, 'fail');
    assert.equal(C.combineVerdicts([]).level, 'pass');
    assert.deepEqual(C.combineVerdicts([]).devices, []);
    assert.equal(C.combineVerdicts([null, pass]).devices.length, 1);
}

// ── 空データ ────────────────────────────────────────────────────────────
{
    const empty = C.analyzeSerials([]);
    assert.equal(empty.first, null);
    assert.equal(empty.expected, 0);
    assert.equal(empty.missing, 0);
    assert.deepEqual(C.buildTimelineBins(empty, 240), []);
    assert.equal(C.formatMissingRanges(empty.missingRanges), '');
}

// ── CSV（正式計測区間のみ / stop後のdrain sampleを含む）との突き合わせ ─────
{
    // FIFO の 1 serial = 4 フレーム = CSV 4行 になることを、計測結果CSVで確認する。
    const makeSamples = (serial) => Array.from({ length: 4 }, (_, packetNumber) => ({
        serial_number: serial,
        packet_number: packetNumber,
        timestamp: serial * 20 + packetNumber * 5,
        converted_gyro: { x: 1, y: 2, z: 3 },
        converted_acc: { x: 0, y: 0, z: 1 },
        press: { values: [1, 2, 3, 4, 5, 6] },
    }));

    // 正式計測区間: serial 1000..1004。1002 は収録中に届かず、
    // stop 後の drain で回収された（＝CSVに含まれる）ものとして末尾に置く。
    const windowSerials = [1000, 1001, 1003, 1004];
    const samples = windowSerials.flatMap(makeSamples).concat(makeSamples(1002));
    const result = {
        deviceId: 0,
        profileId: 'fifo-recording',
        durationMs: 10000,
        raw: { samples, truncated: false },
        step: { rows: [] },
    };

    const csv = insoleToolkitMeasurementToCSV(result, 'raw');
    const lines = csv.split('\n');
    assert.equal(lines.length, 1 + samples.length);            // header + sample行
    assert.equal(lines.length - 1, 5 * 4);                     // 5 serial × 4行

    // drain で回収した serial 1002 が CSV に含まれる
    const csvSerials = C.extractSerialsFromCsv(csv);
    assert.equal(csvSerials.length, samples.length);
    assert.ok(csvSerials.includes(1002));

    // 画面表示（samples から再計算）と CSV から数え直した欠損数が一致する
    const fromSamples = C.analyzeSerials(samples.map((sample) => sample.serial_number));
    const fromCsv = C.analyzeSerials(csvSerials);
    assert.equal(fromCsv.expected, fromSamples.expected);
    assert.equal(fromCsv.received, fromSamples.received);
    assert.equal(fromCsv.missing, fromSamples.missing);
    assert.equal(fromCsv.missing, 0);                          // drain で埋まったので欠損なし
    assert.equal(fromCsv.received, 5);                         // 20行 = 5 serial

    // timeline 集約後の欠損数も CSV 由来の欠損数と一致する
    const bins = C.buildTimelineBins(fromCsv, 240);
    assert.equal(bins.reduce((sum, bin) => sum + bin.missing, 0), fromCsv.missing);

    // 計測区間外の serial を混ぜていないこと（CSVは measurement の samples のみ由来）
    assert.equal(csvSerials.every((serial) => serial >= 1000 && serial <= 1004), true);

    // drain で埋まらなかった場合は CSV でも欠損として現れる
    const lossyResult = {
        ...result,
        raw: { samples: windowSerials.flatMap(makeSamples), truncated: false },
    };
    const lossyCsv = insoleToolkitMeasurementToCSV(lossyResult, 'raw');
    const lossyAnalysis = C.analyzeSerials(C.extractSerialsFromCsv(lossyCsv));
    assert.equal(lossyAnalysis.expected, 5);
    assert.equal(lossyAnalysis.received, 4);
    assert.equal(lossyAnalysis.missing, 1);
    assert.deepEqual(lossyAnalysis.missingRanges.map((r) => r.label), ['1002']);
    assert.equal(
        C.buildTimelineBins(lossyAnalysis, 240).reduce((sum, bin) => sum + bin.missing, 0),
        lossyAnalysis.missing
    );
}

// ── 2台ぶんのCSVを device_id 列つきで1ファイルにまとめられること ───────────
{
    const makeSamples = (deviceId, serial) => Array.from({ length: 4 }, (_, packetNumber) => ({
        serial_number: serial,
        packet_number: packetNumber,
        timestamp: serial * 20 + packetNumber * 5,
        converted_gyro: { x: 1, y: 2, z: 3 },
        converted_acc: { x: 0, y: 0, z: 1 },
        press: { values: [deviceId, 2, 3, 4, 5, 6] },
    }));
    const makeResult = (deviceId, serials) => ({
        deviceId,
        profileId: 'fifo-recording',
        durationMs: 10000,
        raw: { samples: serials.flatMap((serial) => makeSamples(deviceId, serial)), truncated: false },
        step: { rows: [] },
    });

    const csv0 = insoleToolkitMeasurementToCSV(makeResult(0, [1000, 1001]), 'raw');
    const csv1 = insoleToolkitMeasurementToCSV(makeResult(1, [5000, 5001]), 'raw');
    const header = csv0.split('\n')[0];
    assert.equal(header.split(',')[0], 'device_id');

    // app.js の combinedCsv() と同じ結合手順
    const rows = [csv0, csv1].flatMap((csv) => csv.split('\n').slice(1)).filter((line) => line.length > 0);
    const combined = [header, ...rows].join('\n');

    const lines = combined.split('\n');
    assert.equal(lines.length, 1 + 16);                       // header + 4 serial × 4行
    assert.equal(lines.filter((line) => line === header).length, 1);   // ヘッダは1行だけ
    const deviceIds = new Set(lines.slice(1).map((line) => line.split(',')[0]));
    assert.deepEqual([...deviceIds].sort(), ['0', '1']);

    // 結合しても各デバイスの serial 連続性は独立に数えられる
    const all = C.extractSerialsFromCsv(combined);
    assert.equal(all.length, 16);
    const perDevice = { 0: [], 1: [] };
    for (const line of lines.slice(1)) {
        const columns = line.split(',');
        perDevice[columns[0]].push(Number(columns[3]));
    }
    for (const id of ['0', '1']) {
        const analysis = C.analyzeSerials(perDevice[id]);
        assert.equal(analysis.expected, 2);
        assert.equal(analysis.received, 2);
        assert.equal(analysis.missing, 0);
    }
}

// ── ページ側の実装が公開APIを再利用していること（FIFO再実装の防止） ────────
{
    const app = read('app.js');
    assert.match(app, /buildInsoleToolkit\(/);
    assert.match(app, /getInsoleToolkitSession\(/);
    // setup() を忘れると hashUUID が空で接続時に serviceUUID 参照で落ちる
    // （buildInsoleToolkit は simulator 指定時以外 setup() を呼ばない）。実機で踏んだので固定する。
    assert.match(app, /root\.insoles\[id\]\.setup\(\)/);
    // 2台ぶんの Toolkit を作り、収録は接続中の全デバイスで同時に開始・停止する
    assert.match(app, /const DEVICE_IDS = \[0, 1\]/);
    assert.match(app, /for \(const id of DEVICE_IDS\) installDevice\(id\)/);
    assert.match(app, /Promise\.allSettled\(ids\.map\(\(id\) => device\(id\)\.session\.startMeasurement/);
    assert.match(app, /Promise\.allSettled\(\s*ids\.map\(\(id\) => device\(id\)\.session\.stopMeasurement/);
    // 左右は mount_position から判定する（デバイス番号から推測しない）
    assert.match(app, /C\.sideFromMountPosition\(mountPositionOf\(id\)\)/);
    // 全体判定はデバイスごとの判定を合成する
    assert.match(app, /C\.combineVerdicts\(/);
    // continuity.js の注意コードを i18n キーへ写している（日本語を app に持たない）
    assert.match(app, /const CAUTION_KEYS = \{/);
    assert.match(app, /overBuffer: "cautionOverBuffer"/);
    assert.match(app, /lagOverCapacity: "cautionLagOverCapacity"/);
    // 2台ぶんのCSVは device_id 列つきで1ファイルにまとめる
    assert.match(app, /function combinedCsv\(\)/);
    assert.match(app, /startMeasurement\(\{[\s\S]*?profile: "fifo-recording"/);
    assert.match(app, /stopMeasurement\(/);
    assert.match(app, /insoleToolkitMeasurementToCSV\(result, "raw"\)/);
    // FIFO プロトコルを example 側で組み立てていないこと
    assert.doesNotMatch(app, /new OrpheInsoleFifo\(/);
    assert.doesNotMatch(app, /createGetSensorDataRequest|0x0B|SUB_GET_DATA/);
    // CSV ボタンは stop/drain 完了まで無効
    assert.match(app, /csvButton\.disabled = true/);
    // ライブ表示・ログは固定長バッファ（デバイスごと）
    assert.match(app, /LIVE_HISTORY_SIZE/);
    assert.match(app, /MAX_LOG_ENTRIES/);
    // Bluetooth chooser のキャンセルを error 表示にしない
    assert.match(app, /isUserCancel/);
}

// ── step-analysis と同じ example テンプレートに沿っていること ────────────────
{
    const html = read('index.html');
    // ヘッダ（戻りリンク / JA-EN 切替 / eyebrow / toolkit スロット）
    assert.match(html, /<header class="app-header">/);
    assert.match(html, /href="\.\.\/\.\.\/index\.html#examples"/);
    assert.match(html, /data-lang-button="ja"/);
    assert.match(html, /data-lang-button="en"/);
    assert.match(html, /class="eyebrow"/);
    assert.match(html, /id="toolkit0" class="toolkit-slot"/);
    assert.match(html, /id="toolkit1" class="toolkit-slot"/);
    // 操作 → 設定ガイド → 可視化 → 結果 → 解説 → コード → ログ → footer の順
    const order = [
        'class="control-strip"',
        'class="settings-guide"',
        'class="buffer-strip"',
        'class="graphs-section"',
        'class="result-section"',
        'class="explain-section"',
        'class="how-section"',
        'class="log-section"',
        '<footer',
    ].map((needle) => {
        const index = html.indexOf(needle);
        assert.ok(index >= 0, `index.html に ${needle} がない`);
        return index;
    });
    for (let i = 1; i < order.length; i += 1) {
        assert.ok(order[i] > order[i - 1], 'テンプレートのセクション順が崩れている');
    }
    // 共通コンポーネント（step-analysis と同じクラス名）
    for (const needle of ['source-badge', 'section-heading', 'chart-card', 'chart-toolbar',
        'table-frame', 'notify-strip', 'scope-note', 'code-card']) {
        assert.ok(html.includes(needle), `index.html に ${needle} がない`);
    }
    // 数千serialをDOM化せず Canvas で描く（デバイスごとに1本）
    assert.match(html, /<canvas id="timeline-canvas-0"/);
    assert.match(html, /<canvas id="timeline-canvas-1"/);
    assert.match(html, /<canvas id="live-canvas"/);
    // 2台目のカード・列は既定で隠し、接続時に出す
    assert.match(html, /class="chart-card device-card" data-device="1" hidden/);
    assert.match(html, /id="metric-head-1" hidden/);
    // 結果テーブルは app.js が i18n ラベルで組み立てる
    assert.match(html, /id="metric-table-body"/);
    // 静的テキストは i18n キー経由（ハードコードした日本語だけの画面にしない）
    assert.match(html, /data-i18n="leadCopy"/);
    assert.match(html, /data-i18n-html="scopeNote"/);
    // 30秒バッファの換算式はページ本体にも出す
    assert.match(html, /RING_BUFFER_CAPACITY = 1500/);
    assert.match(html, /30,000 ms {2}≈ 30 s/);
    // スクリプトの読み込み順（continuity → i18n → app）
    const scriptOrder = ['./continuity.js', './i18n.js', './app.js']
        .map((src) => html.indexOf(src));
    assert.ok(scriptOrder[0] < scriptOrder[1] && scriptOrder[1] < scriptOrder[2]);
}

// ── 2言語とも必要な内容を含むこと（30秒の非保証 / dropped ≠ missing など） ───
{
    const i18n = require('../examples/fifo-guide/i18n.js');
    assert.deepEqual(Object.keys(i18n.translations).sort(), ['en', 'ja']);

    // ja / en でキーが欠けていないこと（片方だけ翻訳漏れがあると英語へ暗黙fallbackする）
    const jaKeys = Object.keys(i18n.translations.ja).sort();
    const enKeys = Object.keys(i18n.translations.en).sort();
    assert.deepEqual(jaKeys, enKeys, 'ja / en の翻訳キーが一致していない');

    // 必須メトリクスのラベルと説明が両言語にある
    for (const key of ['m_duration', 'm_samples', 'm_first', 'm_last', 'm_expected',
        'm_received', 'm_missing', 'm_missing_rate', 'm_span', 'm_dropped', 'm_drain_recovered',
        'm_drain_ms', 'm_max_lag', 'm_csv']) {
        assert.ok(i18n.translations.ja[key], `ja に ${key} がない`);
        assert.ok(i18n.translations.en[key], `en に ${key} がない`);
    }

    // 30秒を「絶対保証」と書かず、非保証であることを明記している
    assert.match(i18n.translations.ja.scopeNote, /30秒以内なら絶対に無欠損」ではありません/);
    assert.match(i18n.translations.en.scopeNote, /not a guarantee of zero loss/);
    for (const language of ['ja', 'en']) {
        assert.doesNotMatch(i18n.translations[language].scopeNote, /guaranteed lossless|必ず無欠損/);
    }

    // dropped と missing を別指標として説明している
    assert.match(i18n.translations.ja.scopeNote, /<code>dropped<\/code> と <code>missing<\/code> は別指標/);
    assert.match(i18n.translations.en.scopeNote, /different metrics/);
    assert.match(i18n.translations.ja.m_dropped_note, /missing とは別指標/);
    assert.match(i18n.translations.en.m_dropped_note, /different metric from missing/);

    // 収録スパンが予定より短くなる理由を両言語で説明している（missing ではないこと）
    assert.match(i18n.translations.ja.cautionShortSpan, /未要求分（停止時のlag）/);
    assert.match(i18n.translations.ja.cautionShortSpan, /欠損（missing）ではなく末尾が短いだけ/);
    assert.match(i18n.translations.en.cautionShortSpan, /still unrequested when recording stopped/);
    assert.match(i18n.translations.en.cautionShortSpan, /rather than loss/);

    // CSV 1行と serial packet の関係
    assert.match(i18n.translations.ja.resultFootnote, /1 serial = 4行/);
    assert.match(i18n.translations.en.resultFootnote, /one serial is four CSV rows/);

    // FIFO Raw に quat が無く、Step Analysis と同時取得しないこと
    assert.match(i18n.translations.ja.fifoCardBody, /quaternionは含まれません/);
    assert.match(i18n.translations.ja.fifoCardBody, /Step Analysisと同時に取得できません/);
    assert.match(i18n.translations.en.fifoCardBody, /No quaternion/);
    assert.match(i18n.translations.en.fifoCardBody, /cannot run together with Step Analysis/);

    // continuity.js の caution code に対応する文言が両言語にある
    for (const key of ['cautionOverBuffer', 'cautionLagHigh', 'cautionLagOverCapacity',
        'cautionDroppedExceedsSpan', 'cautionUnknown']) {
        assert.ok(i18n.translations.ja[key], `ja に ${key} がない`);
        assert.ok(i18n.translations.en[key], `en に ${key} がない`);
    }
    // dropped が収録スパンを超える理由（再同期ごとの再計上）を両言語で説明する
    assert.match(i18n.translations.ja.cautionDroppedExceedsSpan, /再同期のたびに未回収バックログを再計上/);
    assert.match(i18n.translations.en.cautionDroppedExceedsSpan, /Each resync re-counts the outstanding backlog/);

    // 2台同時のときの注意（片側だけ欠損しうる）が両言語にある
    assert.match(i18n.translations.ja.cautionDualLoad, /片側だけに欠損が出た場合/);
    assert.match(i18n.translations.ja.cautionDualLoad, /1台収録と比べ/);
    assert.match(i18n.translations.en.cautionDualLoad, /loss appeared on only one side/);
    assert.match(i18n.translations.en.cautionDualLoad, /single-device run/);
    // 左右が同じ mount position のときの警告
    assert.match(i18n.translations.ja.cautionSameSide, /同じ装着位置/);
    assert.match(i18n.translations.en.cautionSameSide, /same mount position/);
    // デバイス名は L / R を添えられる
    assert.equal(i18n.t('deviceLabel', { n: 1 }), 'INSOLE 01');
    assert.equal(i18n.t('deviceLabelWithSide', { n: 2, side: i18n.t('sideRight') }), 'INSOLE 02 (R)');

    // 医療・診断を断定せず免責を明記
    for (const language of ['ja', 'en']) {
        assert.match(i18n.translations[language].footerNote, /医療機器ではなく|not a medical device/);
        assert.doesNotMatch(i18n.translations[language].footerNote, /診断できます|can diagnose/);
    }

    // 言語自動判定（step-analysis と同じ規則）
    assert.equal(i18n.detectDefaultLanguage('Asia/Tokyo', 'en-US'), 'ja');
    assert.equal(i18n.detectDefaultLanguage('Europe/Berlin', 'ja-JP'), 'en');
    assert.equal(i18n.detectDefaultLanguage('', 'ja-JP'), 'ja');
    assert.equal(i18n.detectDefaultLanguage('', 'fr-FR'), 'en');

    // 補間（バッファガイド・結果ログ）
    assert.equal(
        i18n.t('bufferWithinWindow', { seconds: 10, packets: 500, window: 30 }),
        '推奨帯: 10秒 ≒ 500 serial（端末内バッファ約30秒に収まりやすい）'
    );
    i18n.setLanguage('en', { notify: false });
    assert.match(i18n.t('bufferOverWindow', { seconds: 60, packets: 3000, window: 30 }),
        /Caution: 60 s ≈ 3000 serials/);
    i18n.setLanguage('ja', { notify: false });
}

// ── README ──────────────────────────────────────────────────────────────
{
    const readme = read('README.md');
    assert.match(readme, /1500/);
    assert.match(readme, /30,000 ms|30000 ms/);
    assert.match(readme, /RING_BUFFER_CAPACITY/);
    assert.match(readme, /\?lang=ja|\?lang=en/);
}

console.log('fifo-guide-continuity tests: ok');
