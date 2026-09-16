(function attachLabRecorderCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LabRecorderCore = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createLabRecorderCore() {
  "use strict";

  /**
   * Lab Recorder — 純関数モジュール（DOM / BLE 非依存。Node で単体テストする）。
   *
   * FIFO 収録そのもの（読み取りモード切替・シリアル指定の再要求・drain）は
   * src/InsoleFifo.js / src/InsoleToolkit.js が担当し、ここでは一切実装しない。
   * このファイルが担当するのは「収録済みサンプルと打刻をどう並べ、どう時刻付けし、
   * どう書き出すか」だけ:
   *
   *   - 端末時刻（FW の時刻カウンタ）の日跨ぎ unwrap とサンプルの順序付け
   *   - FIFO バッチ到着時刻からの 端末時刻 → ホスト時刻 写像（最小遅延法）
   *   - 同期マーカー（ホスト時刻）と最近傍サンプルの突き合わせ
   *   - 収録冒頭の踏み込みインパルス候補（加速度ノルム最大）の検出
   *   - serial 連続性（uint16 wraparound 対応）と欠損 range
   *   - 来歴列つき CSV / マーカー CSV / 欠損レポート / 試行 JSON / データ辞書
   *
   * 歩容指標の算出・スコアリング・判定は行わない（収録と検証に徹する）。
   */

  const CSV_FORMAT_VERSION = 1;
  const SERIAL_MOD = 65536;
  const HALF_SERIAL = 32768;
  const DAY_MS = 86400000;
  const FRAMES_PER_PACKET = 4;
  /** 実測 IMU ODR。src/InsoleFifo.js の IMU_ODR_HZ と一致することをテストで保証する。 */
  const NOMINAL_IMU_ODR_HZ = 208;
  const FRAME_INTERVAL_MS = 1000 / NOMINAL_IMU_ODR_HZ;
  const PACKET_INTERVAL_MS = FRAME_INTERVAL_MS * FRAMES_PER_PACKET;
  const DEFAULT_IMPULSE_WINDOW_MS = 10000;
  const MIN_IMPULSE_WINDOW_MS = 1000;
  const MAX_IMPULSE_WINDOW_MS = 120000;

  const METADATA_FIELDS = ["participant_id", "trial_number", "condition", "surface", "footwear", "notes"];

  /** サンプル CSV の列。単位は列名に含める（単位行は持たない）。 */
  const SAMPLE_COLUMNS = [
    "device_id", "side", "firmware_version", "sdk_version",
    "sample_index", "serial_number", "packet_number",
    "device_time_ms", "host_time_est", "host_time_est_ms", "host_rx_ms", "elapsed_ms",
    "sampling_rate_hz",
    "gyro_x_dps", "gyro_y_dps", "gyro_z_dps",
    "acc_x_g", "acc_y_g", "acc_z_g",
    "press_1_adc", "press_2_adc", "press_3_adc", "press_4_adc", "press_5_adc", "press_6_adc"
  ];

  const MARKER_BASE_COLUMNS = ["marker_index", "label", "host_time", "host_time_ms", "elapsed_ms"];
  const MARKER_DEVICE_COLUMNS = [
    "last_received_serial", "aligned_serial", "aligned_sample_index", "aligned_device_time_ms", "alignment_residual_ms"
  ];

  // ── 基本ユーティリティ ──────────────────────────────────────────────
  function serialDistance(from, to) {
    return ((Number(to) - Number(from)) % SERIAL_MOD + SERIAL_MOD) % SERIAL_MOD;
  }

  function normalizeSerial(serial) {
    return Number(serial) & 0xffff;
  }

  /** anchor からの符号付きオフセット（半周を超える前方距離は「anchor より前」と解釈） */
  function signedSerialOffset(anchor, serial) {
    const forward = serialDistance(anchor, serial);
    return forward < HALF_SERIAL ? forward : forward - SERIAL_MOD;
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function pad(value, width) {
    return String(value).padStart(width, "0");
  }

  /**
   * ISO 8601（ミリ秒・ローカルタイムゾーンのオフセット付き）。
   * 例: 2026-09-16T13:45:12.345+09:00
   * @param {number} epochMs
   * @param {number} [tzOffsetMinutes] 省略時は実行環境のオフセット（Date#getTimezoneOffset の符号反転）
   */
  function formatIsoWithOffset(epochMs, tzOffsetMinutes) {
    if (!isFiniteNumber(epochMs)) return "";
    const date = new Date(epochMs);
    const offset = isFiniteNumber(tzOffsetMinutes) ? tzOffsetMinutes : -date.getTimezoneOffset();
    const local = new Date(epochMs + offset * 60000);
    const sign = offset < 0 ? "-" : "+";
    const abs = Math.abs(offset);
    return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1, 2)}-${pad(local.getUTCDate(), 2)}`
      + `T${pad(local.getUTCHours(), 2)}:${pad(local.getUTCMinutes(), 2)}:${pad(local.getUTCSeconds(), 2)}`
      + `.${pad(local.getUTCMilliseconds(), 3)}${sign}${pad(Math.floor(abs / 60), 2)}:${pad(abs % 60, 2)}`;
  }

  function formatTimezoneLabel(tzOffsetMinutes, timeZoneName) {
    const offset = isFiniteNumber(tzOffsetMinutes) ? tzOffsetMinutes : -new Date().getTimezoneOffset();
    const sign = offset < 0 ? "-" : "+";
    const abs = Math.abs(offset);
    const label = `UTC${sign}${pad(Math.floor(abs / 60), 2)}:${pad(abs % 60, 2)}`;
    return timeZoneName ? `${timeZoneName} (${label})` : label;
  }

  function compactTimestamp(epochMs, tzOffsetMinutes) {
    const iso = formatIsoWithOffset(epochMs, tzOffsetMinutes);
    return iso ? iso.slice(0, 19).replace(/[-:]/g, "").replace("T", "-") : "";
  }

  // ── サンプルの順序付け・端末時刻 unwrap ────────────────────────────
  /**
   * FIFO で回収したサンプル（到着順・順不同・重複あり）を serial → packet_number の順に並べ、
   * 端末時刻（FW の時刻カウンタ ms。日跨ぎで 0 に戻る）を単調増加へ unwrap する。
   * 重複（同じ serial + packet_number）は最初の1件だけ残す。
   *
   * @param {Array<{serial_number:number, packet_number:number, t:number}>} samples
   * @returns {Array<{sample_index:number, serial_number:number, packet_number:number,
   *   serial_offset:number, device_time_ms:number, raw_device_time_ms:number, sample:object}>}
   */
  function orderSamples(samples) {
    if (!Array.isArray(samples) || samples.length === 0) return [];
    let anchor = null;
    const seen = new Set();
    const entries = [];
    for (const sample of samples) {
      if (!sample || !Number.isInteger(sample.serial_number)) continue;
      const serial = normalizeSerial(sample.serial_number);
      if (anchor === null) anchor = serial;
      const packet = Number.isInteger(sample.packet_number) ? sample.packet_number : 0;
      const key = serial * FRAMES_PER_PACKET + packet;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({
        serial_number: serial,
        packet_number: packet,
        serial_offset: signedSerialOffset(anchor, serial),
        raw_device_time_ms: isFiniteNumber(sample.t) ? sample.t : null,
        sample
      });
    }
    entries.sort((a, b) => (a.serial_offset - b.serial_offset) || (a.packet_number - b.packet_number));

    let dayShift = 0;
    let previous = null;
    entries.forEach((entry, index) => {
      entry.sample_index = index;
      if (entry.raw_device_time_ms === null) {
        entry.device_time_ms = null;
        return;
      }
      if (previous !== null && entry.raw_device_time_ms + dayShift < previous - DAY_MS / 2) {
        dayShift += DAY_MS;
      }
      entry.device_time_ms = entry.raw_device_time_ms + dayShift;
      previous = entry.device_time_ms;
    });
    return entries;
  }

  // ── 端末時刻 → ホスト時刻 写像 ────────────────────────────────────
  /**
   * FIFO はプル型なのでサンプルの到着時刻はホスト時刻より数百 ms 遅れる。
   * 各バッチについて「到着ホスト時刻 − バッチ内の最新端末時刻」を取り、その最小値
   * （最も遅延の小さかった観測）を offset として採用する（最小遅延法）。
   * offset の最大−最小（spread）は回収ジッタの大きさで、写像誤差の上界の目安になる。
   * 注: 回帰の傾きを「clock drift」として出すのは誤り。FIFO の追従遅れ（lag の増減）が
   * 支配的で、実機では 10^5 ppm 級の値が出た（2026-09-16 実測）ため出力しない。
   *
   * @param {Array<{hostRxMs:number, deviceTimeMaxMs:number}>} batches 到着順
   * @returns {{available:boolean, method:string, offsetMs:number|null, offsetMinMs:number|null,
   *   offsetMedianMs:number|null, offsetMaxMs:number|null, offsetSpreadMs:number|null,
   *   batches:number, spanMs:number}}
   */
  function estimateClockMap(batches) {
    const points = [];
    let dayShift = 0;
    let previous = null;
    for (const batch of Array.isArray(batches) ? batches : []) {
      if (!batch || !isFiniteNumber(batch.hostRxMs) || !isFiniteNumber(batch.deviceTimeMaxMs)) continue;
      if (previous !== null && batch.deviceTimeMaxMs + dayShift < previous - DAY_MS / 2) dayShift += DAY_MS;
      const deviceTime = batch.deviceTimeMaxMs + dayShift;
      previous = deviceTime;
      points.push({ deviceTime, offset: batch.hostRxMs - deviceTime });
    }
    if (points.length === 0) {
      return {
        available: false, method: "min-latency", offsetMs: null, offsetMinMs: null,
        offsetMedianMs: null, offsetMaxMs: null, offsetSpreadMs: null, batches: 0, spanMs: 0
      };
    }
    const offsets = points.map((point) => point.offset).sort((a, b) => a - b);
    const offsetMin = offsets[0];
    const offsetMax = offsets[offsets.length - 1];
    const median = offsets.length % 2 === 1
      ? offsets[(offsets.length - 1) / 2]
      : (offsets[offsets.length / 2 - 1] + offsets[offsets.length / 2]) / 2;
    const first = points[0].deviceTime;
    const last = points[points.length - 1].deviceTime;
    const spanMs = last - first;
    return {
      available: true,
      method: "min-latency",
      offsetMs: offsetMin,
      offsetMinMs: offsetMin,
      offsetMedianMs: median,
      offsetMaxMs: offsetMax,
      offsetSpreadMs: offsetMax - offsetMin,
      batches: points.length,
      spanMs
    };
  }

  function deviceToHostMs(clockMap, deviceTimeMs) {
    if (!clockMap || !clockMap.available || !isFiniteNumber(deviceTimeMs)) return null;
    return deviceTimeMs + clockMap.offsetMs;
  }

  function hostToDeviceMs(clockMap, hostMs) {
    if (!clockMap || !clockMap.available || !isFiniteNumber(hostMs)) return null;
    return hostMs - clockMap.offsetMs;
  }

  // ── 最近傍サンプル ───────────────────────────────────────────────
  /** device_time_ms でソート済みの entries から、目標端末時刻に最も近い entry を二分探索で返す */
  function nearestEntryByDeviceTime(entries, targetDeviceMs) {
    if (!Array.isArray(entries) || entries.length === 0 || !isFiniteNumber(targetDeviceMs)) return null;
    const timed = entries.filter((entry) => isFiniteNumber(entry.device_time_ms));
    if (timed.length === 0) return null;
    let low = 0;
    let high = timed.length - 1;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (timed[mid].device_time_ms < targetDeviceMs) low = mid + 1;
      else high = mid;
    }
    let best = timed[low];
    if (low > 0) {
      const before = timed[low - 1];
      if (Math.abs(before.device_time_ms - targetDeviceMs) <= Math.abs(best.device_time_ms - targetDeviceMs)) {
        best = before;
      }
    }
    return best;
  }

  /**
   * 同期マーカー（ホスト時刻で打刻）を、そのデバイスのサンプル列に突き合わせる。
   * @returns {{aligned_serial:number, aligned_packet_number:number, aligned_sample_index:number,
   *   aligned_device_time_ms:number, alignment_residual_ms:number}|null}
   *   residual = 目標端末時刻 − 最近傍サンプルの端末時刻（正なら目標がサンプルより後）
   */
  function alignMarker(marker, entries, clockMap) {
    const target = hostToDeviceMs(clockMap, marker && marker.host_time_ms);
    const entry = nearestEntryByDeviceTime(entries, target);
    if (!entry) return null;
    return {
      aligned_serial: entry.serial_number,
      aligned_packet_number: entry.packet_number,
      aligned_sample_index: entry.sample_index,
      aligned_device_time_ms: entry.device_time_ms,
      alignment_residual_ms: target - entry.device_time_ms
    };
  }

  // ── 踏み込みインパルス候補 ───────────────────────────────────────
  function accNorm(sample) {
    const acc = sample && sample.converted_acc;
    if (!acc || !isFiniteNumber(acc.x) || !isFiniteNumber(acc.y) || !isFiniteNumber(acc.z)) return null;
    return Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
  }

  function clampImpulseWindowMs(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return DEFAULT_IMPULSE_WINDOW_MS;
    return Math.min(MAX_IMPULSE_WINDOW_MS, Math.max(MIN_IMPULSE_WINDOW_MS, numeric));
  }

  /**
   * 収録開始後 windowMs の区間で加速度ノルム |acc| [G] が最大のサンプルを候補として返す。
   * 自動確定はしない（呼び出し側で人間が accept / reject する）。
   *
   * @param {ReturnType<typeof orderSamples>} entries
   * @param {{windowMs?:number}} [options]
   * @returns {{sample_index:number, serial_number:number, packet_number:number, device_time_ms:number,
   *   acc_norm_g:number, median_norm_g:number, prominence:number, window_ms:number,
   *   window_samples:number, window_start_device_time_ms:number}|null}
   */
  function detectImpulse(entries, options = {}) {
    if (!Array.isArray(entries) || entries.length === 0) return null;
    const windowMs = clampImpulseWindowMs(options.windowMs);
    const timed = entries.filter((entry) => isFiniteNumber(entry.device_time_ms));
    if (timed.length === 0) return null;
    const start = timed[0].device_time_ms;
    const norms = [];
    let best = null;
    let bestNorm = -Infinity;
    for (const entry of timed) {
      if (entry.device_time_ms - start > windowMs) break;
      const norm = accNorm(entry.sample);
      if (norm === null) continue;
      norms.push(norm);
      if (norm > bestNorm) {
        bestNorm = norm;
        best = entry;
      }
    }
    if (!best) return null;
    const sorted = norms.slice().sort((a, b) => a - b);
    const median = sorted.length % 2 === 1
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    return {
      sample_index: best.sample_index,
      serial_number: best.serial_number,
      packet_number: best.packet_number,
      device_time_ms: best.device_time_ms,
      acc_norm_g: bestNorm,
      median_norm_g: median,
      prominence: median > 0 ? bestNorm / median : null,
      window_ms: windowMs,
      window_samples: norms.length,
      window_start_device_time_ms: start
    };
  }

  // ── serial 連続性 ────────────────────────────────────────────────
  /**
   * 回収済み serial（順不同・重複可・wraparound 可）の連続性と欠損 range。
   * expected = received + missing が常に成り立つ。
   */
  function serialContinuity(serials) {
    const offsets = new Set();
    let anchor = null;
    let minOffset = 0;
    let maxOffset = 0;
    for (const raw of serials || []) {
      if (raw === null || raw === undefined || !Number.isFinite(Number(raw))) continue;
      const serial = normalizeSerial(raw);
      if (anchor === null) {
        anchor = serial;
        offsets.add(0);
        continue;
      }
      const offset = signedSerialOffset(anchor, serial);
      offsets.add(offset);
      if (offset < minOffset) minOffset = offset;
      if (offset > maxOffset) maxOffset = offset;
    }
    if (anchor === null) {
      return { first: null, last: null, expected: 0, received: 0, missing: 0, missingRate: 0, ranges: [] };
    }
    const expected = maxOffset - minOffset + 1;
    const received = offsets.size;
    const missing = Math.max(0, expected - received);
    const serialAt = (offset) => normalizeSerial(anchor + offset);
    const ranges = [];
    let runStart = null;
    for (let offset = minOffset; offset <= maxOffset + 1; offset += 1) {
      const present = offset > maxOffset ? true : offsets.has(offset);
      if (!present) {
        if (runStart === null) runStart = offset;
        continue;
      }
      if (runStart !== null) {
        ranges.push({ start: serialAt(runStart), end: serialAt(offset - 1), count: offset - runStart });
        runStart = null;
      }
    }
    return {
      first: serialAt(minOffset),
      last: serialAt(maxOffset),
      expected,
      received,
      missing,
      missingRate: expected > 0 ? missing / expected : 0,
      ranges
    };
  }

  function formatRanges(ranges, limit = 20) {
    if (!Array.isArray(ranges) || ranges.length === 0) return "";
    const shown = ranges.slice(0, limit).map((range) => (
      range.start === range.end ? String(range.start) : `${range.start}-${range.end}`
    ));
    if (ranges.length > limit) shown.push(`… (+${ranges.length - limit})`);
    return shown.join(" ");
  }

  // ── デバイス単位の解析（順序付け＋時刻写像＋連続性＋インパルス） ──
  /**
   * @param {object} input
   * @param {number} input.deviceId
   * @param {string|null} [input.side] 'left' | 'right' | null
   * @param {string|null} [input.firmwareVersion]
   * @param {Array} input.samples FIFO で回収したサンプル（Toolkit の result.raw.samples）
   * @param {Array<{hostRxMs:number, deviceTimeMaxMs:number, serials:number[]}>} input.batches
   * @param {number} [input.dropped] 回復不能ロス累計（OrpheInsoleFifo onStopped の dropped）
   * @param {number} [input.maxLag]
   * @param {number} [input.drainRecovered]
   * @param {number} [input.catchupRecovered]
   * @param {number} [input.durationMs]
   * @param {boolean} [input.truncated]
   * @param {number} [input.impulseWindowMs]
   * @param {number} [input.trialStartHostMs]
   */
  function analyzeDevice(input) {
    const entries = orderSamples(input.samples);
    const clock = estimateClockMap(input.batches);
    const continuity = serialContinuity(entries.map((entry) => entry.serial_number));
    const impulse = detectImpulse(entries, { windowMs: input.impulseWindowMs });
    const hostRxBySerial = new Map();
    for (const batch of Array.isArray(input.batches) ? input.batches : []) {
      if (!batch || !Array.isArray(batch.serials)) continue;
      for (const serial of batch.serials) {
        const key = normalizeSerial(serial);
        if (!hostRxBySerial.has(key)) hostRxBySerial.set(key, batch.hostRxMs);
      }
    }
    const timed = entries.filter((entry) => isFiniteNumber(entry.device_time_ms));
    const deviceSpanMs = timed.length > 1
      ? timed[timed.length - 1].device_time_ms - timed[0].device_time_ms
      : 0;
    const measuredRateHz = deviceSpanMs > 0 ? ((timed.length - 1) / deviceSpanMs) * 1000 : null;
    const dropped = Math.max(0, Number(input.dropped) || 0);

    let impulseDetail = null;
    if (impulse) {
      const hostMs = deviceToHostMs(clock, impulse.device_time_ms);
      impulseDetail = {
        ...impulse,
        host_time_est_ms: hostMs,
        host_time_est: hostMs === null ? null : formatIsoWithOffset(hostMs, input.tzOffsetMinutes),
        elapsed_ms: hostMs !== null && isFiniteNumber(input.trialStartHostMs) ? hostMs - input.trialStartHostMs : null,
        status: "pending"
      };
    }

    return {
      deviceId: input.deviceId,
      side: input.side || null,
      firmwareVersion: input.firmwareVersion || null,
      entries,
      hostRxBySerial,
      clock,
      continuity,
      impulse: impulseDetail,
      dropped,
      maxLag: Math.max(0, Number(input.maxLag) || 0),
      drainRecovered: Math.max(0, Number(input.drainRecovered) || 0),
      catchupRecovered: Math.max(0, Number(input.catchupRecovered) || 0),
      durationMs: isFiniteNumber(input.durationMs) ? input.durationMs : null,
      truncated: !!input.truncated,
      sampleCount: entries.length,
      deviceSpanMs,
      measuredRateHz,
      complete: continuity.missing === 0 && dropped === 0 && !input.truncated
    };
  }

  // ── 左右アライメント（ライブ表示用） ────────────────────────────
  /**
   * 2台の「収録開始からの進み」を比較する。
   * @param {{firstSerial:number, latestSerial:number, firstDeviceTimeMs:number, latestDeviceTimeMs:number}|null} a
   * @param {{...}|null} b
   */
  function alignmentSummary(a, b) {
    const advance = (state) => {
      if (!state || !Number.isInteger(state.firstSerial) || !Number.isInteger(state.latestSerial)) return null;
      const serials = serialDistance(state.firstSerial, state.latestSerial);
      const timeMs = isFiniteNumber(state.firstDeviceTimeMs) && isFiniteNumber(state.latestDeviceTimeMs)
        ? ((state.latestDeviceTimeMs - state.firstDeviceTimeMs) % DAY_MS + DAY_MS) % DAY_MS
        : null;
      return { serials, timeMs };
    };
    const advanceA = advance(a);
    const advanceB = advance(b);
    if (!advanceA || !advanceB) {
      return { available: false, a: advanceA, b: advanceB, deltaSerials: null, deltaTimeMs: null, deltaSerialsAsMs: null };
    }
    const deltaSerials = advanceB.serials - advanceA.serials;
    return {
      available: true,
      a: advanceA,
      b: advanceB,
      deltaSerials,
      deltaSerialsAsMs: deltaSerials * PACKET_INTERVAL_MS,
      deltaTimeMs: advanceA.timeMs !== null && advanceB.timeMs !== null ? advanceB.timeMs - advanceA.timeMs : null
    };
  }

  // ── メタデータ・ファイル名 ───────────────────────────────────────
  function normalizeMetadata(raw) {
    const result = {};
    for (const field of METADATA_FIELDS) {
      const value = raw && raw[field] !== undefined && raw[field] !== null ? String(raw[field]) : "";
      result[field] = value.trim();
    }
    return result;
  }

  /** "3" → "4", "T03" → "T04", "" → "1", "abc" → "abc" */
  function nextTrialNumber(value) {
    const text = value === undefined || value === null ? "" : String(value).trim();
    if (text === "") return "1";
    const match = /^(.*?)(\d+)$/.exec(text);
    if (!match) return text;
    const digits = match[2];
    const next = String(Number(digits) + 1);
    return `${match[1]}${next.length < digits.length ? next.padStart(digits.length, "0") : next}`;
  }

  function sanitizeFilename(part, fallback = "na") {
    const text = String(part === undefined || part === null ? "" : part)
      .normalize("NFKC")
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(0, 40);
    return text || fallback;
  }

  function trialBaseName(trial) {
    const metadata = normalizeMetadata(trial && trial.metadata);
    return [
      "orphe-lab",
      sanitizeFilename(metadata.participant_id, "anon"),
      `T${sanitizeFilename(metadata.trial_number, "0")}`,
      sanitizeFilename(metadata.condition, "cond"),
      compactTimestamp(trial && trial.startedHostMs, trial && trial.tzOffsetMinutes) || "time"
    ].join("_");
  }

  // ── CSV ─────────────────────────────────────────────────────────
  function csvEscape(value) {
    if (value === undefined || value === null) return "";
    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function fixed(value, digits) {
    return isFiniteNumber(value) ? value.toFixed(digits) : "";
  }

  /**
   * 試行の全デバイスのサンプルを来歴列つきの行へ展開する（device_id 昇順 → sample_index 昇順）。
   * @param {object} trial analyzeDevice() の結果を devices に持つ試行
   * @returns {Array<object>} SAMPLE_COLUMNS をキーに持つ行
   */
  function buildSampleRows(trial) {
    const rows = [];
    const devices = (trial.devices || []).slice().sort((a, b) => a.deviceId - b.deviceId);
    for (const report of devices) {
      for (const entry of report.entries) {
        const sample = entry.sample || {};
        const gyro = sample.converted_gyro || {};
        const acc = sample.converted_acc || {};
        const press = sample.press && Array.isArray(sample.press.values) ? sample.press.values : [];
        const hostEstMs = deviceToHostMs(report.clock, entry.device_time_ms);
        const hostRx = report.hostRxBySerial.get(entry.serial_number);
        rows.push({
          device_id: report.deviceId,
          side: report.side || "",
          firmware_version: report.firmwareVersion || "",
          sdk_version: trial.sdkVersion || "",
          sample_index: entry.sample_index,
          serial_number: entry.serial_number,
          packet_number: entry.packet_number,
          device_time_ms: fixed(entry.device_time_ms, 3),
          host_time_est: hostEstMs === null ? "" : formatIsoWithOffset(hostEstMs, trial.tzOffsetMinutes),
          host_time_est_ms: fixed(hostEstMs, 3),
          host_rx_ms: isFiniteNumber(hostRx) ? String(hostRx) : "",
          elapsed_ms: hostEstMs !== null && isFiniteNumber(trial.startedHostMs) ? fixed(hostEstMs - trial.startedHostMs, 3) : "",
          sampling_rate_hz: NOMINAL_IMU_ODR_HZ,
          gyro_x_dps: fixed(gyro.x, 3),
          gyro_y_dps: fixed(gyro.y, 3),
          gyro_z_dps: fixed(gyro.z, 3),
          acc_x_g: fixed(acc.x, 4),
          acc_y_g: fixed(acc.y, 4),
          acc_z_g: fixed(acc.z, 4),
          press_1_adc: isFiniteNumber(press[0]) ? press[0] : "",
          press_2_adc: isFiniteNumber(press[1]) ? press[1] : "",
          press_3_adc: isFiniteNumber(press[2]) ? press[2] : "",
          press_4_adc: isFiniteNumber(press[3]) ? press[3] : "",
          press_5_adc: isFiniteNumber(press[4]) ? press[4] : "",
          press_6_adc: isFiniteNumber(press[5]) ? press[5] : ""
        });
      }
    }
    return rows;
  }

  /** CSV 冒頭の `# key: value` 行（メタデータと時刻源の注記）。 */
  function buildCsvHeaderLines(trial) {
    const metadata = normalizeMetadata(trial.metadata);
    const lines = [
      `# orphe_lab_recorder_csv_version: ${CSV_FORMAT_VERSION}`,
      "# generator: ORPHE-INSOLE.js examples/lab-recorder",
      `# sdk_version: ${trial.sdkVersion || ""}`
    ];
    for (const field of METADATA_FIELDS) {
      lines.push(`# ${field}: ${String(metadata[field]).replace(/\r?\n/g, " ")}`);
    }
    lines.push(
      `# recording_start_host: ${formatIsoWithOffset(trial.startedHostMs, trial.tzOffsetMinutes)}`,
      `# recording_stop_host: ${formatIsoWithOffset(trial.stoppedHostMs, trial.tzOffsetMinutes)}`,
      `# host_timezone: ${formatTimezoneLabel(trial.tzOffsetMinutes, trial.timeZoneName)}`
    );
    for (const report of (trial.devices || []).slice().sort((a, b) => a.deviceId - b.deviceId)) {
      lines.push(
        `# device_${report.deviceId}_side: ${report.side || ""}`,
        `# device_${report.deviceId}_firmware_version: ${report.firmwareVersion || ""}`,
        `# device_${report.deviceId}_clock_offset_ms: ${report.clock.available ? report.clock.offsetMs.toFixed(3) : ""}`,
        `# device_${report.deviceId}_clock_offset_spread_ms: ${isFiniteNumber(report.clock.offsetSpreadMs) ? report.clock.offsetSpreadMs.toFixed(3) : ""}`
      );
    }
    lines.push(
      "# device_time_source: firmware time-of-day counter at packet base (HH:MM:SS.mmm), plus packet_number * 1000/208 ms; unwrapped across midnight",
      "# host_time_est_method: device_time_ms + min over FIFO batches of (host_rx_ms - max device_time_ms in batch); host_rx_ms is the batch arrival time (FIFO pull adds latency)",
      `# sampling_rate_hz_note: nominal IMU ODR ${NOMINAL_IMU_ODR_HZ} Hz (4 frames per serial packet); see loss report for the measured rate`,
      "# pressure_note: press_N_adc uses the official sensor numbering 1..6 (SDK press.values[N-1]); raw ADC counts, not calibrated force",
      "# missing_value: empty field",
      "# read_hint: skip lines starting with '#' (pandas comment='#', MATLAB detectImportOptions + CommentStyle '#')"
    );
    return lines;
  }

  function buildTrialCsv(trial) {
    const rows = buildSampleRows(trial);
    return [
      ...buildCsvHeaderLines(trial),
      SAMPLE_COLUMNS.join(","),
      ...rows.map((row) => SAMPLE_COLUMNS.map((column) => csvEscape(row[column])).join(","))
    ].join("\n");
  }

  function markerColumnsFor(trial) {
    const columns = MARKER_BASE_COLUMNS.slice();
    for (const report of (trial.devices || []).slice().sort((a, b) => a.deviceId - b.deviceId)) {
      for (const column of MARKER_DEVICE_COLUMNS) columns.push(`device_${report.deviceId}_${column}`);
    }
    return columns;
  }

  /**
   * マーカーへ各デバイスの突き合わせ結果を付与する（元の配列は変更しない）。
   * marker: { marker_index, label, host_time_ms, elapsed_ms, last_received_serial: {deviceId: serial} }
   */
  function alignMarkers(trial) {
    const devices = (trial.devices || []).slice().sort((a, b) => a.deviceId - b.deviceId);
    return (trial.markers || []).map((marker) => {
      const perDevice = {};
      for (const report of devices) {
        const alignment = alignMarker(marker, report.entries, report.clock);
        const last = marker.last_received_serial && marker.last_received_serial[report.deviceId];
        perDevice[report.deviceId] = {
          last_received_serial: Number.isInteger(last) ? last : null,
          ...(alignment || {
            aligned_serial: null, aligned_packet_number: null, aligned_sample_index: null,
            aligned_device_time_ms: null, alignment_residual_ms: null
          })
        };
      }
      return {
        marker_index: marker.marker_index,
        label: marker.label || "",
        host_time: formatIsoWithOffset(marker.host_time_ms, trial.tzOffsetMinutes),
        host_time_ms: marker.host_time_ms,
        elapsed_ms: isFiniteNumber(marker.elapsed_ms) ? marker.elapsed_ms : null,
        devices: perDevice
      };
    });
  }

  function buildMarkersCsv(trial) {
    const columns = markerColumnsFor(trial);
    const aligned = alignMarkers(trial);
    const lines = [columns.join(",")];
    for (const marker of aligned) {
      const values = columns.map((column) => {
        const deviceMatch = /^device_(\d+)_(.+)$/.exec(column);
        if (deviceMatch) {
          const detail = marker.devices[Number(deviceMatch[1])];
          const value = detail ? detail[deviceMatch[2]] : null;
          return csvEscape(isFiniteNumber(value) && !Number.isInteger(value) ? value.toFixed(3) : value);
        }
        return csvEscape(marker[column]);
      });
      lines.push(values.join(","));
    }
    return lines.join("\n");
  }

  // ── 欠損レポート / 試行 JSON / セッション CSV ─────────────────────
  function buildLossReport(trial) {
    return {
      format_version: CSV_FORMAT_VERSION,
      generator: "ORPHE-INSOLE.js examples/lab-recorder",
      trial_base_name: trialBaseName(trial),
      participant_id: normalizeMetadata(trial.metadata).participant_id,
      trial_number: normalizeMetadata(trial.metadata).trial_number,
      recording_start_host: formatIsoWithOffset(trial.startedHostMs, trial.tzOffsetMinutes),
      recording_stop_host: formatIsoWithOffset(trial.stoppedHostMs, trial.tzOffsetMinutes),
      nominal_rate_hz: NOMINAL_IMU_ODR_HZ,
      frames_per_serial_packet: FRAMES_PER_PACKET,
      definitions: {
        expected: "number of serial packets between the first and last received serial (inclusive, uint16 wraparound aware)",
        received: "number of distinct serial packets recovered",
        missing: "expected - received; serial packets absent from the CSV",
        missing_rate: "missing / expected",
        dropped: "serial packets the FIFO loop declared unrecoverable during recording (OrpheInsoleFifo droppedCount); may differ from missing",
        max_lag: "maximum number of not-yet-fetched serials observed while polling; the device ring buffer holds 1500",
        complete: "true only when missing == 0 and dropped == 0 and the sample buffer was not truncated"
      },
      devices: (trial.devices || []).slice().sort((a, b) => a.deviceId - b.deviceId).map((report) => ({
        device_id: report.deviceId,
        side: report.side,
        firmware_version: report.firmwareVersion,
        duration_ms: report.durationMs,
        device_time_span_ms: report.deviceSpanMs,
        samples: report.sampleCount,
        measured_rate_hz: report.measuredRateHz,
        first_serial: report.continuity.first,
        last_serial: report.continuity.last,
        expected: report.continuity.expected,
        received: report.continuity.received,
        missing: report.continuity.missing,
        missing_rate: report.continuity.missingRate,
        dropped: report.dropped,
        max_lag: report.maxLag,
        drain_recovered: report.drainRecovered,
        catchup_recovered: report.catchupRecovered,
        truncated: report.truncated,
        missing_ranges: report.continuity.ranges.map((range) => ({ start: range.start, end: range.end, count: range.count })),
        complete: report.complete
      }))
    };
  }

  function buildTrialJson(trial) {
    const metadata = normalizeMetadata(trial.metadata);
    return {
      format_version: CSV_FORMAT_VERSION,
      generator: "ORPHE-INSOLE.js examples/lab-recorder",
      sdk_version: trial.sdkVersion || null,
      sdk_version_date: trial.sdkVersionDate || null,
      base_name: trialBaseName(trial),
      metadata,
      timing: {
        recording_start_host: formatIsoWithOffset(trial.startedHostMs, trial.tzOffsetMinutes),
        recording_start_host_ms: trial.startedHostMs,
        recording_stop_host: formatIsoWithOffset(trial.stoppedHostMs, trial.tzOffsetMinutes),
        recording_stop_host_ms: trial.stoppedHostMs,
        host_timezone: formatTimezoneLabel(trial.tzOffsetMinutes, trial.timeZoneName),
        device_time_source: "firmware time-of-day counter (ms), unwrapped across midnight",
        host_time_est_method: "min-latency: device_time_ms + min(host_rx_ms - max device_time_ms per FIFO batch)"
      },
      environment: trial.environment || null,
      devices: (trial.devices || []).slice().sort((a, b) => a.deviceId - b.deviceId).map((report) => ({
        device_id: report.deviceId,
        side: report.side,
        firmware_version: report.firmwareVersion,
        samples: report.sampleCount,
        duration_ms: report.durationMs,
        clock: {
          method: report.clock.method,
          available: report.clock.available,
          offset_ms: report.clock.offsetMs,
          offset_median_ms: report.clock.offsetMedianMs,
          offset_max_ms: report.clock.offsetMaxMs,
          offset_spread_ms: report.clock.offsetSpreadMs,
          batches: report.clock.batches,
          span_ms: report.clock.spanMs
        },
        impulse_candidate: report.impulse,
        continuity: {
          first: report.continuity.first,
          last: report.continuity.last,
          expected: report.continuity.expected,
          received: report.continuity.received,
          missing: report.continuity.missing,
          missing_rate: report.continuity.missingRate
        }
      })),
      markers: alignMarkers(trial),
      loss_report: buildLossReport(trial),
      files: {
        samples_csv: `${trialBaseName(trial)}_samples.csv`,
        markers_csv: `${trialBaseName(trial)}_markers.csv`,
        trial_json: `${trialBaseName(trial)}_trial.json`
      }
    };
  }

  const SESSION_COLUMNS = [
    "trial_number", "participant_id", "condition", "surface", "footwear", "notes",
    "recording_start_host", "duration_ms", "devices", "samples", "missing", "dropped", "complete",
    "markers", "impulse_status", "base_name"
  ];

  /** セッション内の試行一覧（1試行1行）。 */
  function buildSessionCsv(summaries) {
    const lines = [SESSION_COLUMNS.join(",")];
    for (const summary of summaries || []) {
      lines.push(SESSION_COLUMNS.map((column) => csvEscape(summary[column])).join(","));
    }
    return lines.join("\n");
  }

  /** 試行 → セッション一覧用の要約（サンプル本体は含めない）。 */
  function summarizeTrial(trial) {
    const metadata = normalizeMetadata(trial.metadata);
    const devices = (trial.devices || []).slice().sort((a, b) => a.deviceId - b.deviceId);
    const impulseStatuses = devices.map((report) => (report.impulse ? report.impulse.status : "none"));
    return {
      trial_number: metadata.trial_number,
      participant_id: metadata.participant_id,
      condition: metadata.condition,
      surface: metadata.surface,
      footwear: metadata.footwear,
      notes: metadata.notes,
      recording_start_host: formatIsoWithOffset(trial.startedHostMs, trial.tzOffsetMinutes),
      duration_ms: isFiniteNumber(trial.startedHostMs) && isFiniteNumber(trial.stoppedHostMs)
        ? trial.stoppedHostMs - trial.startedHostMs
        : null,
      devices: devices.map((report) => `${report.deviceId}:${report.side || "?"}`).join(" "),
      samples: devices.reduce((sum, report) => sum + report.sampleCount, 0),
      missing: devices.reduce((sum, report) => sum + report.continuity.missing, 0),
      dropped: devices.reduce((sum, report) => sum + report.dropped, 0),
      complete: devices.length > 0 && devices.every((report) => report.complete),
      markers: (trial.markers || []).length,
      impulse_status: impulseStatuses.join(" "),
      base_name: trialBaseName(trial)
    };
  }

  // ── データ辞書（Markdown・英語） ─────────────────────────────────
  const SAMPLE_COLUMN_DOCS = {
    device_id: ["—", "Toolkit slot of the device (0 or 1). Not the physical side; see `side`.", "0, 1", "never empty"],
    side: ["—", "Foot the insole reported through `mount_position` bit0 at connection time.", "`left`, `right`, or empty when unavailable", "empty"],
    firmware_version: ["—", "Device firmware version read from the BLE Device Information service, or from the advertisement when DIS is unavailable. Known firmware differences affect axis conventions and Step Analysis availability, so always keep this column.", "e.g. `1.2.3`", "empty"],
    sdk_version: ["—", "ORPHE-INSOLE.js version that produced the file (from package.json).", "e.g. `1.3.4`", "empty"],
    sample_index: ["—", "0-based index of the sample within this device's ordered series (serial then packet_number).", "integer", "never empty"],
    serial_number: ["—", "Firmware serial number of the FIFO packet the sample belongs to. uint16, wraps 65535 → 0. Each serial packet carries 4 frames.", "0–65535", "never empty"],
    packet_number: ["—", "Frame index inside the serial packet (oldest first).", "0–3", "never empty"],
    device_time_ms: ["ms", "Device clock: firmware time-of-day counter at the packet base plus `packet_number × 1000/208` ms, unwrapped across midnight so it increases monotonically within a trial. The firmware clock is not synchronised to wall time.", "≥ 0", "empty"],
    host_time_est: ["ISO 8601", "Estimated host (PC) wall-clock time of the sample, with milliseconds and the host timezone offset. Computed as `device_time_ms + clock_offset_ms` where the offset is the minimum over FIFO batches of (batch arrival time − newest device time in the batch). This is an estimate: FIFO retrieval adds latency, so the true offset is at most the recorded value.", "e.g. `2026-09-16T13:45:12.345+09:00`", "empty"],
    host_time_est_ms: ["ms (Unix epoch)", "Same instant as `host_time_est` as milliseconds since 1970-01-01T00:00Z.", "number", "empty"],
    host_rx_ms: ["ms (Unix epoch)", "Host time at which the FIFO batch containing this sample arrived. Upper bound of the true sample time; use it to judge the clock mapping, not as the sample time.", "number", "empty"],
    elapsed_ms: ["ms", "`host_time_est_ms − recording_start_host_ms` (header line). Same time base as marker `elapsed_ms`.", "number", "empty"],
    sampling_rate_hz: ["Hz", "Nominal IMU output data rate used for frame spacing (SDK constant). The measured rate per device is in the loss report.", "208", "never empty"],
    gyro_x_dps: ["deg/s", "Angular rate about X (right when facing the toe direction). Converted from raw int16 with the range-specific sensitivity.", "number", "empty"],
    gyro_y_dps: ["deg/s", "Angular rate about Y (toe direction, long axis of the insole).", "number", "empty"],
    gyro_z_dps: ["deg/s", "Angular rate about Z (normal to the insole surface, up).", "number", "empty"],
    acc_x_g: ["G", "Acceleration along X.", "number", "empty"],
    acc_y_g: ["G", "Acceleration along Y.", "number", "empty"],
    acc_z_g: ["G", "Acceleration along Z. About +1 G when the insole lies flat.", "number", "empty"],
    press_1_adc: ["ADC counts", "Pressure sensor 1 (toe, medial) in the official numbering; SDK `press.values[0]`. Raw uint16 ADC counts, not calibrated force.", "0–65535", "empty"],
    press_2_adc: ["ADC counts", "Pressure sensor 2 (first metatarsal head, medial); `press.values[1]`.", "0–65535", "empty"],
    press_3_adc: ["ADC counts", "Pressure sensor 3 (toe, lateral); `press.values[2]`.", "0–65535", "empty"],
    press_4_adc: ["ADC counts", "Pressure sensor 4 (midfoot, central); `press.values[3]`.", "0–65535", "empty"],
    press_5_adc: ["ADC counts", "Pressure sensor 5 (midfoot, lateral); `press.values[4]`.", "0–65535", "empty"],
    press_6_adc: ["ADC counts", "Pressure sensor 6 (heel); `press.values[5]`.", "0–65535", "empty"]
  };

  const MARKER_COLUMN_DOCS = {
    marker_index: ["—", "1-based order of the marker within the trial.", "integer"],
    label: ["—", "Free-text label typed by the operator (may be empty).", "text"],
    host_time: ["ISO 8601", "Host wall-clock time when the marker button / space key was pressed.", "timestamp with ms and offset"],
    host_time_ms: ["ms (Unix epoch)", "Same instant as `host_time`.", "number"],
    elapsed_ms: ["ms", "`host_time_ms − recording_start_host_ms`.", "number"],
    "device_N_last_received_serial": ["—", "Newest serial that had already been received from device N when the marker was pressed. Because FIFO retrieval lags, this is typically a few packets *behind* the true instant.", "0–65535 or empty"],
    "device_N_aligned_serial": ["—", "Serial of the sample whose estimated host time is nearest to `host_time_ms` (post-hoc, using the trial's clock mapping).", "0–65535 or empty"],
    "device_N_aligned_sample_index": ["—", "`sample_index` of that nearest sample in the samples CSV.", "integer or empty"],
    "device_N_aligned_device_time_ms": ["ms", "`device_time_ms` of that nearest sample.", "number or empty"],
    "device_N_alignment_residual_ms": ["ms", "Target device time − nearest sample device time. Magnitude above ~5 ms means the marker fell into a gap in the data.", "number or empty"]
  };

  function buildDataDictionary(options = {}) {
    const lines = [
      "# ORPHE INSOLE Lab Recorder — Data Dictionary",
      "",
      `Format version ${CSV_FORMAT_VERSION}. Generated by ORPHE-INSOLE.js \`examples/lab-recorder\``
      + (options.sdkVersion ? ` (SDK ${options.sdkVersion}).` : "."),
      "",
      "Files per trial: `<base>_samples.csv` (one row per IMU/pressure frame), `<base>_markers.csv` (one row per sync marker), `<base>_trial.json` (metadata, provenance, clock mapping, impulse candidate, markers, loss report). Per session: `<session>_trials.csv` (one row per trial) and this dictionary.",
      "",
      "## Reading the samples CSV",
      "",
      "Lines starting with `#` are metadata (`# key: value`). Skip them when parsing, e.g. pandas `read_csv(path, comment='#')`, MATLAB `opts = detectImportOptions(path); opts.CommentStyle = '#'; readtable(path, opts)`. Missing values are empty fields. Units are part of the column name. Rows are ordered by `device_id`, then `sample_index`.",
      "",
      "Recording mode: FIFO (lossless pull from the device ring buffer). In this mode the device does not stream quaternions and Step Analysis is not available, so the CSV has no orientation or gait columns by design.",
      "",
      "## `*_samples.csv` columns",
      "",
      "| column | unit | definition | values | when missing |",
      "|---|---|---|---|---|"
    ];
    for (const column of SAMPLE_COLUMNS) {
      const doc = SAMPLE_COLUMN_DOCS[column];
      lines.push(`| \`${column}\` | ${doc[0]} | ${doc[1]} | ${doc[2]} | ${doc[3]} |`);
    }
    lines.push(
      "",
      "## `*_samples.csv` header lines",
      "",
      "| key | meaning |",
      "|---|---|",
      "| `orphe_lab_recorder_csv_version` | this format version |",
      "| `sdk_version` | ORPHE-INSOLE.js version |",
      "| `participant_id`, `trial_number`, `condition`, `surface`, `footwear`, `notes` | operator-entered metadata (free text, may be empty) |",
      "| `recording_start_host`, `recording_stop_host` | host wall-clock at start / stop button (ISO 8601 with offset) |",
      "| `host_timezone` | IANA zone name and UTC offset of the host |",
      "| `device_N_side`, `device_N_firmware_version` | per-device provenance |",
      "| `device_N_clock_offset_ms` | host − device offset used for `host_time_est` (min-latency) |",
      "| `device_N_clock_offset_spread_ms` | max − min of (host_rx − device_time) across FIFO batches: the retrieval jitter, an upper bound on the `host_time_est` mapping error. No clock-drift estimate is exported because FIFO retrieval lag dominates over a trial |",
      "| `device_time_source`, `host_time_est_method`, `sampling_rate_hz_note`, `pressure_note`, `missing_value`, `read_hint` | fixed explanatory notes |",
      "",
      "## `*_markers.csv` columns",
      "",
      "| column | unit | definition | values |",
      "|---|---|---|---|"
    );
    for (const [column, doc] of Object.entries(MARKER_COLUMN_DOCS)) {
      lines.push(`| \`${column}\` | ${doc[0]} | ${doc[1]} | ${doc[2]} |`);
    }
    lines.push(
      "",
      "`N` is the `device_id`. Markers are intended for events that another instrument also sees (motion-capture start, a heel stomp), so that time axes can be aligned afterwards.",
      "",
      "## Impulse candidate (`*_trial.json` → `devices[].impulse_candidate`)",
      "",
      "| field | unit | definition |",
      "|---|---|---|",
      "| `sample_index`, `serial_number`, `packet_number` | — | sample with the largest acceleration norm in the detection window |",
      "| `device_time_ms`, `host_time_est`, `elapsed_ms` | ms / ISO 8601 / ms | time of that sample in each time base |",
      "| `acc_norm_g` | G | √(x²+y²+z²) of the converted acceleration at the peak |",
      "| `median_norm_g`, `prominence` | G / ratio | median norm within the window and peak ÷ median (context, not a threshold) |",
      "| `window_ms`, `window_samples` | ms / — | detection window from the first sample, and the number of samples examined |",
      "| `status` | — | `pending` (not reviewed), `accepted`, or `rejected` — set by the operator; never automatic |",
      "",
      "## Loss report (`*_trial.json` → `loss_report.devices[]`)",
      "",
      "| field | definition |",
      "|---|---|",
      "| `expected` | serial packets between first and last received serial, inclusive (uint16 wraparound aware) |",
      "| `received` | distinct serial packets recovered |",
      "| `missing`, `missing_rate` | `expected − received` and its ratio; these serials are absent from the samples CSV |",
      "| `missing_ranges` | contiguous runs of missing serials (`start`, `end`, `count`) |",
      "| `dropped` | serial packets declared unrecoverable by the FIFO loop during recording; a different tally from `missing` — only `missing == 0 && dropped == 0` means lossless |",
      "| `max_lag` | maximum number of not-yet-fetched serials observed while polling (device ring buffer: 1500 packets ≈ 30 s) |",
      "| `drain_recovered`, `catchup_recovered` | serials recovered after the stop button during the drain / catch-up phase |",
      "| `measured_rate_hz` | `(samples − 1) / device_time_span`; compare with the nominal 208 Hz |",
      "| `truncated` | true if the in-browser sample buffer limit was hit (the CSV is then incomplete even if `missing == 0`) |",
      "| `complete` | `missing == 0 && dropped == 0 && !truncated` |",
      "",
      "## Coordinate frame",
      "",
      "Right-handed, Z-up. Y points toward the toe (long axis of the insole), X to the right when facing the toe direction, Z is the surface normal (up). Acceleration and angular rate are in this device frame; no orientation estimate is included.",
      "",
      "## Not included on purpose",
      "",
      "No gait parameters, scores, or derived clearance / stride values are exported. The page records and verifies; analysis is left to the lab's own pipeline."
    );
    return lines.join("\n");
  }

  const api = {
    CSV_FORMAT_VERSION,
    SERIAL_MOD,
    DAY_MS,
    FRAMES_PER_PACKET,
    NOMINAL_IMU_ODR_HZ,
    FRAME_INTERVAL_MS,
    PACKET_INTERVAL_MS,
    DEFAULT_IMPULSE_WINDOW_MS,
    MIN_IMPULSE_WINDOW_MS,
    MAX_IMPULSE_WINDOW_MS,
    METADATA_FIELDS,
    SAMPLE_COLUMNS,
    MARKER_BASE_COLUMNS,
    MARKER_DEVICE_COLUMNS,
    SESSION_COLUMNS,
    SAMPLE_COLUMN_DOCS,
    MARKER_COLUMN_DOCS,
    serialDistance,
    normalizeSerial,
    signedSerialOffset,
    formatIsoWithOffset,
    formatTimezoneLabel,
    compactTimestamp,
    orderSamples,
    estimateClockMap,
    deviceToHostMs,
    hostToDeviceMs,
    nearestEntryByDeviceTime,
    alignMarker,
    alignMarkers,
    clampImpulseWindowMs,
    detectImpulse,
    serialContinuity,
    formatRanges,
    analyzeDevice,
    alignmentSummary,
    normalizeMetadata,
    nextTrialNumber,
    sanitizeFilename,
    trialBaseName,
    csvEscape,
    buildSampleRows,
    buildCsvHeaderLines,
    buildTrialCsv,
    markerColumnsFor,
    buildMarkersCsv,
    buildLossReport,
    buildTrialJson,
    buildSessionCsv,
    summarizeTrial,
    buildDataDictionary
  };

  return Object.freeze(api);
});
