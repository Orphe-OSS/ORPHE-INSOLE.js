/**
 * FIFO Guide — serial continuity / buffer guidance (pure functions)
 *
 * ページ表示用の判定ロジックをDOMから切り離して Node で単体テストできるようにしたもの。
 * 「画面に出ている missing」と「保存したCSVから数え直した missing」が一致することを
 * tests/fifo-guide-continuity.test.js が検証する。
 *
 * ── FIFO バッファ約30秒の根拠（推測ではなく実装定数からの換算） ──────────────
 *   src/InsoleFifo.js:
 *     RING_BUFFER_CAPACITY = 1500   … 追従遅れ(lag)がこれを超えた分を回復不能として扱う上限
 *     NOTIFY_DATA_NUM      = 4      … 1 serial packet に含まれるフレーム数
 *     decodePacket()                … フレーム間隔は 5 ms（packet_number * 5）
 *   → 1 packet = 4 frame × 5 ms = 20 ms
 *   → 1500 packet × 20 ms = 30,000 ms = 約30秒
 *   （等価な言い方: 200 sample/s ÷ 4 sample/packet = 50 packet/s、1500 / 50 = 30 s）
 *
 * 注意: これは「30秒以内なら必ず無欠損」という保証ではない。回収（ポーリング）が
 * 生成に追いつかなければ 30 秒以内でも上書きは起こりうる。逆に 30 秒を超えても
 * 追いつけていれば欠損しない。あくまで「端末内に保持しておける長さの目安」。
 */
(function (global) {
    'use strict';

    const SERIAL_MOD = 65536;
    const HALF_SERIAL_RANGE = SERIAL_MOD / 2;

    /** 1 serial packet に含まれるフレーム数（src/InsoleFifo.js NOTIFY_DATA_NUM） */
    const FRAMES_PER_PACKET = 4;
    /** フレーム間隔 ms（src/InsoleFifo.js decodePacket の packet_number * 5） */
    const FRAME_INTERVAL_MS = 5;
    /** 1 serial packet が表す時間 ms */
    const PACKET_INTERVAL_MS = FRAMES_PER_PACKET * FRAME_INTERVAL_MS;
    /** FW リングバッファ相当の上限 packet 数（src/InsoleFifo.js RING_BUFFER_CAPACITY） */
    const RING_BUFFER_CAPACITY = 1500;
    /** 端末内バッファが保持できる目安の長さ ms */
    const BUFFER_WINDOW_MS = RING_BUFFER_CAPACITY * PACKET_INTERVAL_MS;

    /** lag / RING_BUFFER_CAPACITY がこれを超えたらバッファ逼迫として警告する */
    const LAG_CAUTION_RATIO = 0.5;

    /**
     * 実測 durationMs を窓と比べるときの許容幅。
     * 「30秒」を選んでも停止タイマの発火揺らぎで実測は 30,00x ms になるため、
     * これを入れないと推奨どおりの収録が毎回「30秒超過」の警告になる（実機で確認）。
     * 選択値そのものを表示するガイド帯は許容幅なし（既定 0）で判定する。
     */
    const BUFFER_WINDOW_TOLERANCE_MS = 1000;

    /** 収録スパンが予定時間のこの割合を下回ったら「末尾が短い」と表示する */
    const SPAN_COVERAGE_OK_RATIO = 0.9;

    /** Canvas timeline の集約bin数の既定。数千serialでも定数メモリで描くため。 */
    const DEFAULT_BIN_COUNT = 240;

    function serialForwardDistance(from, to) {
        return ((to - from) % SERIAL_MOD + SERIAL_MOD) % SERIAL_MOD;
    }

    function normalizeSerial(serial) {
        return Number(serial) & 0xffff;
    }

    /**
     * 収録スパン内の serial 連続性を集計する。
     *
     * - 順不同・重複・uint16 の 65535→0 wraparound を吸収する
     * - anchor（最初に渡された serial）からの符号付きオフセットで扱うので、
     *   スパンが半周（32768 packet ≒ 10.9 分）未満であれば wrap をまたいでも正しい
     *
     * @param {Iterable<number>} serials 回収済み device serial（順不同可）
     * @returns {{first:number|null,last:number|null,expected:number,received:number,
     *   missing:number,missingRate:number,duplicates:number,outOfOrder:number,
     *   spanStartOffset:number,spanEndOffset:number,offsets:Set<number>,anchor:number|null,
     *   missingRanges:Array<{start:number,end:number,count:number,label:string}>}}
     */
    function analyzeSerials(serials) {
        const offsets = new Set();
        let anchor = null;
        let duplicates = 0;
        let outOfOrder = 0;
        let minOffset = 0;
        let maxOffset = 0;
        let previousOffset = null;

        for (const raw of serials) {
            if (raw === null || raw === undefined || !Number.isFinite(Number(raw))) continue;
            const serial = normalizeSerial(raw);
            if (anchor === null) {
                anchor = serial;
                offsets.add(0);
                previousOffset = 0;
                continue;
            }
            const forward = serialForwardDistance(anchor, serial);
            // 半周を超える前方距離は「anchorより前（古い）」と解釈する（wrap対応）
            const offset = forward < HALF_SERIAL_RANGE ? forward : forward - SERIAL_MOD;
            if (offsets.has(offset)) {
                duplicates += 1;
                continue;
            }
            if (previousOffset !== null && offset < previousOffset) outOfOrder += 1;
            previousOffset = offset;
            offsets.add(offset);
            if (offset < minOffset) minOffset = offset;
            if (offset > maxOffset) maxOffset = offset;
        }

        if (anchor === null) {
            return {
                first: null,
                last: null,
                expected: 0,
                received: 0,
                missing: 0,
                missingRate: 0,
                duplicates: 0,
                outOfOrder: 0,
                spanStartOffset: 0,
                spanEndOffset: -1,
                offsets,
                anchor: null,
                missingRanges: [],
            };
        }

        const expected = maxOffset - minOffset + 1;
        const received = offsets.size;
        const missing = Math.max(0, expected - received);
        const serialAt = (offset) => normalizeSerial(anchor + offset);

        const missingRanges = [];
        if (missing > 0) {
            let runStart = null;
            for (let offset = minOffset; offset <= maxOffset; offset += 1) {
                if (!offsets.has(offset)) {
                    if (runStart === null) runStart = offset;
                    continue;
                }
                if (runStart !== null) {
                    missingRanges.push(makeRange(serialAt(runStart), serialAt(offset - 1), offset - runStart));
                    runStart = null;
                }
            }
            if (runStart !== null) {
                missingRanges.push(makeRange(serialAt(runStart), serialAt(maxOffset), maxOffset - runStart + 1));
            }
        }

        return {
            first: serialAt(minOffset),
            last: serialAt(maxOffset),
            expected,
            received,
            missing,
            missingRate: expected > 0 ? missing / expected : 0,
            duplicates,
            outOfOrder,
            spanStartOffset: minOffset,
            spanEndOffset: maxOffset,
            offsets,
            anchor,
            missingRanges,
        };
    }

    function makeRange(start, end, count) {
        return {
            start,
            end,
            count,
            label: start === end ? String(start) : `${start}–${end}`,
        };
    }

    /**
     * timeline 用の集約bin。serial を1つずつDOM化せず、固定数のbinへ畳む。
     * bin ごとの missing 合計は analysis.missing と必ず一致する（テストで検証）。
     *
     * @param {ReturnType<typeof analyzeSerials>} analysis
     * @param {number} [binCount=DEFAULT_BIN_COUNT]
     */
    function buildTimelineBins(analysis, binCount = DEFAULT_BIN_COUNT) {
        const bins = [];
        const total = analysis ? analysis.expected : 0;
        if (!analysis || total <= 0) return bins;
        const count = Math.max(1, Math.min(Math.floor(binCount) || 1, total));
        const { spanStartOffset, spanEndOffset, offsets, anchor } = analysis;

        for (let i = 0; i < count; i += 1) {
            // 端数を切り捨てずに全 serial をどこかのbinへ入れる（合計一致のため）
            const from = spanStartOffset + Math.floor((total * i) / count);
            const to = spanStartOffset + Math.floor((total * (i + 1)) / count) - 1;
            let received = 0;
            let missing = 0;
            for (let offset = from; offset <= to && offset <= spanEndOffset; offset += 1) {
                if (offsets.has(offset)) received += 1;
                else missing += 1;
            }
            bins.push({
                index: i,
                firstSerial: normalizeSerial(anchor + from),
                lastSerial: normalizeSerial(anchor + Math.min(to, spanEndOffset)),
                total: received + missing,
                received,
                missing,
            });
        }
        return bins;
    }

    /**
     * 計測時間から端末内バッファの余裕を判定する。
     * 「30秒以内なら絶対に無欠損」ではなく「バッファに収まる長さかどうか」の目安。
     *
     * @param {number} durationMs
     * @param {object} [options]
     * @param {number} [options.toleranceMs=0] 窓の判定に加える許容幅。
     *   選択値の表示は 0、実測 durationMs の判定は BUFFER_WINDOW_TOLERANCE_MS を渡す。
     */
    function bufferGuidance(durationMs, options = {}) {
        const ms = Math.max(0, Number(durationMs) || 0);
        const toleranceMs = Math.max(0, Number(options.toleranceMs) || 0);
        const ratio = BUFFER_WINDOW_MS > 0 ? ms / BUFFER_WINDOW_MS : 0;
        const withinWindow = ms <= BUFFER_WINDOW_MS + toleranceMs;
        return {
            durationMs: ms,
            windowMs: BUFFER_WINDOW_MS,
            windowSeconds: BUFFER_WINDOW_MS / 1000,
            toleranceMs,
            ratio,
            withinWindow,
            level: withinWindow ? 'recommended' : 'caution',
            expectedPackets: Math.round(ms / PACKET_INTERVAL_MS),
        };
    }

    /**
     * 収録スパン（CSVが実際に覆う時間）と予定時間の比。
     *
     * 停止時点で端末内に残っていた「まだ要求していない」分（lag）は収録スパンに入らない。
     * drain は *要求済みで未着* の再要求を回収するフェーズであり、未要求の新規シリアルは
     * 取りに行かないため、CSV のスパンは予定時間よりわずかに短くなる（実機で 30.0 s 指定 →
     * 1325 serial = 26.5 s を確認）。これは欠損（missing）ではなく「区間の末尾が短い」だけなので、
     * missing とは別の指標として表示する。
     *
     * @param {number} expectedSerials 収録スパンの serial 数（analyzeSerials().expected）
     * @param {number} plannedMs 予定していた計測時間
     */
    function spanCoverage(expectedSerials, plannedMs) {
        const serials = Math.max(0, Number(expectedSerials) || 0);
        const planned = Math.max(0, Number(plannedMs) || 0);
        const spanMs = serials * PACKET_INTERVAL_MS;
        const ratio = planned > 0 ? spanMs / planned : 0;
        return {
            serials,
            spanMs,
            plannedMs: planned,
            ratio,
            shortfallMs: Math.max(0, planned - spanMs),
            shortfallSerials: Math.max(0, Math.round((planned - spanMs) / PACKET_INTERVAL_MS)),
            level: planned === 0 || ratio >= SPAN_COVERAGE_OK_RATIO ? 'ok' : 'warn',
        };
    }

    /**
     * 収録結果の判定。
     * - continuity: missing / dropped がどちらも 0 なら PASS、そうでなければ FAIL
     * - buffer:     30秒超過、または追従遅れ(lag)がバッファ容量に迫ったら CAUTION
     * - level:      カード色（fail=赤 / caution=黄 / pass=緑）
     *
     * missing（最終CSV区間の欠損数）と dropped（収録中に発生した回復不能ロスの累計イベント数）は
     * 定義が違うので同一指標として扱わない。両方 0 のときだけ「欠損なし」と表示する。
     */
    function evaluateRecording(input = {}) {
        const analysis = input.analysis || null;
        const missing = Number(input.missing ?? analysis?.missing ?? 0);
        const dropped = Number(input.dropped || 0);
        const durationMs = Number(input.durationMs || 0);
        const maxLag = Number(input.maxLag || 0);
        // 実測 durationMs はタイマの揺らぎで選択値をわずかに超えるため許容幅つきで判定する
        const buffer = bufferGuidance(durationMs, {
            toleranceMs: input.toleranceMs != null ? input.toleranceMs : BUFFER_WINDOW_TOLERANCE_MS,
        });
        const lagRatio = RING_BUFFER_CAPACITY > 0 ? maxLag / RING_BUFFER_CAPACITY : 0;

        const continuity = missing === 0 && dropped === 0
            ? { level: 'pass', label: 'PASS', text: '欠損なし' }
            : { level: 'fail', label: 'FAIL', text: `欠損 ${missing} serial / dropped ${dropped}` };

        const cautions = [];
        if (!buffer.withinWindow) {
            cautions.push(`計測 ${(durationMs / 1000).toFixed(1)} 秒は端末内バッファの目安 ${buffer.windowSeconds} 秒を超えています`);
        }
        if (lagRatio >= LAG_CAUTION_RATIO) {
            cautions.push(`追従遅れの最大値 ${maxLag} が上限 ${RING_BUFFER_CAPACITY} の ${Math.round(lagRatio * 100)}% に達しました`);
        }
        const bufferLevel = cautions.length > 0 ? 'caution' : 'ok';

        let level = 'pass';
        if (continuity.level === 'fail') level = 'fail';
        else if (bufferLevel === 'caution') level = 'caution';

        return {
            level,
            label: level === 'fail' ? 'FAIL' : level === 'caution' ? 'WARN' : 'PASS',
            continuity,
            buffer: { ...buffer, level: bufferLevel, lagRatio, maxLag },
            cautions,
            missing,
            dropped,
        };
    }

    /** 欠損rangeを表示用の文字列にする（多すぎるときは先頭だけ出して残数を添える） */
    function formatMissingRanges(ranges, limit = 20) {
        if (!ranges || ranges.length === 0) return '';
        const shown = ranges.slice(0, limit).map((range) => range.label);
        const rest = ranges.length - shown.length;
        return rest > 0 ? `${shown.join(', ')} … ほか ${rest} 区間` : shown.join(', ');
    }

    /**
     * CSV（insoleToolkitMeasurementToCSV(result,'raw')）から serial 列を取り出す。
     * 画面表示と保存データの突き合わせに使う。
     */
    function extractSerialsFromCsv(csv) {
        const serials = [];
        if (typeof csv !== 'string' || csv.length === 0) return serials;
        const lines = csv.split(/\r?\n/);
        if (lines.length < 2) return serials;
        const header = lines[0].split(',');
        const index = header.indexOf('serial_number');
        if (index < 0) return serials;
        for (let i = 1; i < lines.length; i += 1) {
            const line = lines[i];
            if (!line) continue;
            const value = Number(line.split(',')[index]);
            if (Number.isFinite(value)) serials.push(normalizeSerial(value));
        }
        return serials;
    }

    const api = {
        SERIAL_MOD,
        FRAMES_PER_PACKET,
        FRAME_INTERVAL_MS,
        PACKET_INTERVAL_MS,
        RING_BUFFER_CAPACITY,
        BUFFER_WINDOW_MS,
        BUFFER_WINDOW_TOLERANCE_MS,
        SPAN_COVERAGE_OK_RATIO,
        LAG_CAUTION_RATIO,
        DEFAULT_BIN_COUNT,
        serialForwardDistance,
        analyzeSerials,
        buildTimelineBins,
        bufferGuidance,
        spanCoverage,
        evaluateRecording,
        formatMissingRanges,
        extractSerialsFromCsv,
    };

    global.FifoGuideContinuity = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
