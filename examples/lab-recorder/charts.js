(function attachLabRecorderCharts(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LabRecorderCharts = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createLabRecorderCharts() {
  "use strict";

  /**
   * Lab Recorder — IMU / FSR 生データのグラフ（Canvas、外部ライブラリなし）。
   *
   * 収録中: FIFO バッチ（数百 ms 遅れ・順不同で再要求分が混ざる）を時刻順に差し込みながら
   *         直近ウィンドウを描く。
   * 収録後: 試行全体を描き、マーカー線・インパルス候補線・欠損区間の網掛けを重ねる。
   *
   * データ構造（store）と数値処理（niceRange / envelope / nearestIndex / gapShades）は
   * DOM 非依存で Node からテストする。描画関数だけが Canvas 2D を使う。
   */

  const KINDS = ["acc", "gyro", "press"];
  const CHANNELS = {
    acc: ["x", "y", "z"],
    gyro: ["x", "y", "z"],
    press: ["1", "2", "3", "4", "5", "6"]
  };
  const COLORS = {
    acc: ["#ff7a7a", "#6fe3a1", "#7fa4ff"],
    gyro: ["#ff7a7a", "#6fe3a1", "#7fa4ff"],
    press: ["#ffd166", "#f4a261", "#e76f51", "#8ecae6", "#219ebc", "#c77dff"]
  };
  const UNITS = { acc: "G", gyro: "dps", press: "ADC" };
  /** 自動スケールの最小レンジ（静止時にノイズが拡大表示されないように） */
  const MIN_SPAN = { acc: 2, gyro: 250, press: 1000 };
  const SYMMETRIC = { acc: true, gyro: true, press: false };
  const LIVE_KEEP_SECONDS = 90;

  const BG = "#0b141b";
  const GRID = "rgba(255,255,255,0.07)";
  const AXIS_TEXT = "#8ea0ac";
  const MARKER_COLOR = "#c77dff";
  const IMPULSE_COLORS = { pending: "#ffd166", accepted: "#35d1b6", rejected: "#8b8378" };
  const MISSING_FILL = "rgba(255,117,89,0.22)";

  // ── store ─────────────────────────────────────────────────────────────
  function createStore() {
    return {
      x: [],                       // 秒（ウィンドウ判定・描画の x）
      acc: [[], [], []],
      gyro: [[], [], []],
      press: [[], [], [], [], [], []],
      serial: [],
      dirty: false,                // 追記で順序が崩れた（再要求分が後から届いた）
      baseMs: null                 // ライブ時の x=0 に対応する端末時刻
    };
  }

  function sampleTimeMs(sample) {
    return sample && Number.isFinite(sample.t) ? sample.t : null;
  }

  function pushRow(store, x, sample) {
    const acc = sample.converted_acc || {};
    const gyro = sample.converted_gyro || {};
    const press = sample.press && Array.isArray(sample.press.values) ? sample.press.values : [];
    const last = store.x.length > 0 ? store.x[store.x.length - 1] : -Infinity;
    if (x < last) store.dirty = true;
    store.x.push(x);
    store.acc[0].push(num(acc.x)); store.acc[1].push(num(acc.y)); store.acc[2].push(num(acc.z));
    store.gyro[0].push(num(gyro.x)); store.gyro[1].push(num(gyro.y)); store.gyro[2].push(num(gyro.z));
    for (let i = 0; i < 6; i += 1) store.press[i].push(num(press[i]));
    store.serial.push(Number.isInteger(sample.serial_number) ? sample.serial_number : null);
  }

  function num(value) {
    return Number.isFinite(value) ? value : NaN;
  }

  /**
   * ライブ用: FIFO バッチをそのまま追記する。x は最初のサンプルの端末時刻を 0 とした秒。
   * 端末時刻の日跨ぎ（0 に戻る）は +86400 s で吸収する。
   * @returns {number} 追記した数
   */
  function appendSamples(store, samples, options = {}) {
    if (!Array.isArray(samples)) return 0;
    const keepSeconds = Number.isFinite(options.keepSeconds) ? options.keepSeconds : LIVE_KEEP_SECONDS;
    let added = 0;
    for (const sample of samples) {
      const t = sampleTimeMs(sample);
      if (t === null) continue;
      if (store.baseMs === null) store.baseMs = t;
      let x = (t - store.baseMs) / 1000;
      if (x < -43200) x += 86400;          // 日跨ぎ（基準が前日、サンプルが翌日）
      else if (x > 43200) x -= 86400;      // 日跨ぎ（基準が翌日、再要求で前日分が後から届く）
      pushRow(store, x, sample);
      added += 1;
    }
    if (added > 0 && keepSeconds > 0) trimStore(store, keepSeconds);
    return added;
  }

  /** 先頭の古いデータを落として最新 keepSeconds だけ残す（dirty ならまず並べ替える） */
  function trimStore(store, keepSeconds) {
    if (store.x.length === 0) return;
    if (store.dirty) sortStore(store);
    const cutoff = store.x[store.x.length - 1] - keepSeconds;
    let drop = 0;
    while (drop < store.x.length && store.x[drop] < cutoff) drop += 1;
    if (drop > 0) spliceStore(store, drop);
  }

  function spliceStore(store, count) {
    store.x.splice(0, count);
    store.serial.splice(0, count);
    for (const kind of KINDS) for (const channel of store[kind]) channel.splice(0, count);
  }

  /** x 昇順に並べ替える（再要求で古い serial が後から届いたとき） */
  function sortStore(store) {
    const order = store.x.map((_, i) => i).sort((a, b) => store.x[a] - store.x[b]);
    const reorder = (array) => order.map((i) => array[i]);
    store.x = reorder(store.x);
    store.serial = reorder(store.serial);
    for (const kind of KINDS) store[kind] = store[kind].map(reorder);
    store.dirty = false;
    return store;
  }

  /**
   * 収録後用: recorder-core の orderSamples() が返す entries（時刻順・重複なし）から作る。
   * @param {Array} entries
   * @param {(entry:object) => number|null} xOf entry → 秒
   */
  function fromEntries(entries, xOf) {
    const store = createStore();
    for (const entry of entries || []) {
      const x = xOf(entry);
      if (!Number.isFinite(x)) continue;
      pushRow(store, x, entry.sample || {});
    }
    if (store.dirty) sortStore(store);
    return store;
  }

  function extent(store) {
    if (store.x.length === 0) return null;
    return { x0: store.x[0], x1: store.x[store.x.length - 1] };
  }

  // ── 数値処理 ───────────────────────────────────────────────────────────
  /**
   * 見やすい y レンジ。symmetric なら 0 を中心に ±、そうでなければ 0 から。
   * minSpan 未満には縮めない（静止時にノイズを拡大しない）。
   */
  function niceRange(min, max, options = {}) {
    const minSpan = Number.isFinite(options.minSpan) ? options.minSpan : 1;
    const symmetric = !!options.symmetric;
    let lo = Number.isFinite(min) ? min : 0;
    let hi = Number.isFinite(max) ? max : 0;
    if (symmetric) {
      const amp = Math.max(Math.abs(lo), Math.abs(hi), minSpan / 2);
      const nice = niceCeil(amp * 1.05);
      return { min: -nice, max: nice };
    }
    lo = Math.min(0, lo);
    hi = Math.max(hi, lo + minSpan);
    return { min: lo, max: niceCeil(hi * 1.05) };
  }

  function niceCeil(value) {
    if (!(value > 0)) return 1;
    const power = Math.pow(10, Math.floor(Math.log10(value)));
    const mantissa = value / power;
    const step = mantissa <= 1 ? 1 : mantissa <= 2 ? 2 : mantissa <= 2.5 ? 2.5 : mantissa <= 5 ? 5 : 10;
    return step * power;
  }

  /** [i0, i1) = x が [x0, x1] に入る index 範囲（x 昇順前提、二分探索） */
  function indexRange(xs, x0, x1) {
    return [lowerBound(xs, x0), upperBound(xs, x1)];
  }

  function lowerBound(xs, target) {
    let lo = 0;
    let hi = xs.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] < target) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  function upperBound(xs, target) {
    let lo = 0;
    let hi = xs.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] <= target) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  /**
   * 列ごとの min/max 包絡（ピークを潰さない間引き）。
   * @returns {Array<{min:number,max:number}|null>} columns 個
   */
  function envelope(xs, ys, x0, x1, columns) {
    const result = new Array(columns).fill(null);
    if (!(x1 > x0) || columns <= 0) return result;
    const [i0, i1] = indexRange(xs, x0, x1);
    const scale = columns / (x1 - x0);
    for (let i = i0; i < i1; i += 1) {
      const y = ys[i];
      if (!Number.isFinite(y)) continue;
      let column = Math.floor((xs[i] - x0) * scale);
      if (column >= columns) column = columns - 1;
      const cell = result[column];
      if (!cell) result[column] = { min: y, max: y };
      else {
        if (y < cell.min) cell.min = y;
        if (y > cell.max) cell.max = y;
      }
    }
    return result;
  }

  /** 範囲内の全チャネルの min / max */
  function rangeOf(store, kind, x0, x1) {
    const [i0, i1] = indexRange(store.x, x0, x1);
    let min = Infinity;
    let max = -Infinity;
    for (const channel of store[kind]) {
      for (let i = i0; i < i1; i += 1) {
        const y = channel[i];
        if (!Number.isFinite(y)) continue;
        if (y < min) min = y;
        if (y > max) max = y;
      }
    }
    return min === Infinity ? null : { min, max };
  }

  /** x に最も近い index（x 昇順前提） */
  function nearestIndex(xs, x) {
    if (!xs || xs.length === 0 || !Number.isFinite(x)) return -1;
    const i = lowerBound(xs, x);
    if (i <= 0) return 0;
    if (i >= xs.length) return xs.length - 1;
    return Math.abs(xs[i] - x) < Math.abs(xs[i - 1] - x) ? i : i - 1;
  }

  /**
   * 欠損区間の網掛け: 連続する entry の serial 差が 2 以上なら、その間を欠損とみなす。
   * @param {Array} entries orderSamples() の結果（serial_number / packet_number 付き）
   * @param {(entry:object) => number|null} xOf
   * @returns {Array<{x0:number,x1:number,serials:number}>}
   */
  function gapShades(entries, xOf) {
    const shades = [];
    for (let i = 1; i < (entries || []).length; i += 1) {
      const previous = entries[i - 1];
      const current = entries[i];
      const gap = ((current.serial_number - previous.serial_number) % 65536 + 65536) % 65536;
      if (gap <= 1) continue;
      const x0 = xOf(previous);
      const x1 = xOf(current);
      if (Number.isFinite(x0) && Number.isFinite(x1) && x1 > x0) shades.push({ x0, x1, serials: gap - 1 });
    }
    return shades;
  }

  /** ウィンドウ指定（秒 or "all"）から表示範囲を決める。ライブは末尾に追従する。 */
  function resolveView(store, window, zoom) {
    const ext = extent(store);
    if (!ext) return { x0: 0, x1: window === "all" ? 10 : Number(window) || 10 };
    if (zoom && Number.isFinite(zoom.x0) && Number.isFinite(zoom.x1) && zoom.x1 > zoom.x0) return { x0: zoom.x0, x1: zoom.x1 };
    if (window === "all") {
      const span = Math.max(1, ext.x1 - ext.x0);
      return { x0: ext.x0, x1: ext.x0 + span };
    }
    const seconds = Number(window) || 10;
    return { x0: Math.max(ext.x0, ext.x1 - seconds), x1: Math.max(ext.x0 + seconds, ext.x1) };
  }

  // ── 描画 ──────────────────────────────────────────────────────────────
  const PAD = { left: 44, right: 8, top: 8, bottom: 18 };

  function prepareCanvas(canvas, ratio) {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight || Number(canvas.getAttribute("height")) || 140);
    const pixelWidth = Math.floor(width * ratio);
    const pixelHeight = Math.floor(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width, height };
  }

  /**
   * 1 面を描く。
   * @param {HTMLCanvasElement} canvas
   * @param {object} store
   * @param {"acc"|"gyro"|"press"} kind
   * @param {{x0:number,x1:number}} view
   * @param {{markers?:Array<{x:number,label?:string,color?:string,dashed?:boolean}>,
   *          shades?:Array<{x0:number,x1:number}>, hoverX?:number|null, title?:string,
   *          emptyText?:string, ratio?:number, showXAxis?:boolean}} [overlays]
   */
  function drawPanel(canvas, store, kind, view, overlays = {}) {
    const ratio = overlays.ratio || 1;
    const { ctx, width, height } = prepareCanvas(canvas, ratio);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, width, height);
    const plotX = PAD.left;
    const plotY = PAD.top;
    const plotW = Math.max(1, width - PAD.left - PAD.right);
    const plotH = Math.max(1, height - PAD.top - PAD.bottom);
    const { x0, x1 } = view;
    const span = Math.max(1e-6, x1 - x0);
    const xToPx = (x) => plotX + ((x - x0) / span) * plotW;

    const range = store ? rangeOf(store, kind, x0, x1) : null;
    const yr = niceRange(range ? range.min : 0, range ? range.max : 0, { symmetric: SYMMETRIC[kind], minSpan: MIN_SPAN[kind] });
    const yToPx = (y) => plotY + plotH - ((y - yr.min) / (yr.max - yr.min)) * plotH;

    // 欠損の網掛け
    for (const shade of overlays.shades || []) {
      const a = Math.max(plotX, xToPx(shade.x0));
      const b = Math.min(plotX + plotW, xToPx(shade.x1));
      if (b <= a) continue;
      ctx.fillStyle = MISSING_FILL;
      ctx.fillRect(a, plotY, Math.max(1, b - a), plotH);
    }

    // グリッドと y ラベル
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = AXIS_TEXT;
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    const yTicks = SYMMETRIC[kind] ? [yr.min, yr.min / 2, 0, yr.max / 2, yr.max] : [yr.min, (yr.min + yr.max) / 2, yr.max];
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const tick of yTicks) {
      const y = yToPx(tick);
      ctx.beginPath(); ctx.moveTo(plotX, y); ctx.lineTo(plotX + plotW, y); ctx.stroke();
      ctx.fillText(formatTick(tick), plotX - 4, y);
    }
    // x グリッドとラベル
    const xStep = niceStep(span / 6);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let tick = Math.ceil(x0 / xStep) * xStep; tick <= x1 + 1e-9; tick += xStep) {
      const x = xToPx(tick);
      ctx.beginPath(); ctx.moveTo(x, plotY); ctx.lineTo(x, plotY + plotH); ctx.stroke();
      if (overlays.showXAxis !== false) ctx.fillText(`${formatTick(tick)}s`, x, plotY + plotH + 4);
    }

    // タイトル・単位
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = AXIS_TEXT;
    ctx.fillText(`${overlays.title || kind.toUpperCase()} [${UNITS[kind]}]`, plotX + 4, plotY + 2);

    // 系列
    const hasData = store && store.x.length > 0 && indexRange(store.x, x0, x1)[1] > indexRange(store.x, x0, x1)[0];
    if (!hasData) {
      ctx.fillStyle = "#5d707d";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(overlays.emptyText || "—", plotX + plotW / 2, plotY + plotH / 2);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.rect(plotX, plotY, plotW, plotH);
      ctx.clip();
      const [i0, i1] = indexRange(store.x, x0, x1);
      const count = i1 - i0;
      const columns = Math.floor(plotW);
      store[kind].forEach((channel, index) => {
        ctx.strokeStyle = COLORS[kind][index];
        ctx.lineWidth = 1.2;
        if (count > columns * 2) {
          // 包絡（列ごとの min..max の縦線）でピークを保つ
          const env = envelope(store.x, channel, x0, x1, columns);
          ctx.beginPath();
          for (let c = 0; c < columns; c += 1) {
            const cell = env[c];
            if (!cell) continue;
            const px = plotX + c + 0.5;
            ctx.moveTo(px, yToPx(cell.max) - 0.5);
            ctx.lineTo(px, yToPx(cell.min) + 0.5);
          }
          ctx.stroke();
        } else {
          ctx.beginPath();
          let pen = false;
          for (let i = Math.max(0, i0 - 1); i < Math.min(store.x.length, i1 + 1); i += 1) {
            const y = channel[i];
            if (!Number.isFinite(y)) { pen = false; continue; }
            const px = xToPx(store.x[i]);
            const py = yToPx(y);
            if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    // マーカー・候補の縦線
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    for (const marker of overlays.markers || []) {
      if (!Number.isFinite(marker.x) || marker.x < x0 || marker.x > x1) continue;
      const px = xToPx(marker.x);
      ctx.strokeStyle = marker.color || MARKER_COLOR;
      ctx.lineWidth = 1.5;
      ctx.setLineDash(marker.dashed ? [4, 3] : []);
      ctx.beginPath(); ctx.moveTo(px, plotY); ctx.lineTo(px, plotY + plotH); ctx.stroke();
      ctx.setLineDash([]);
      if (marker.label) {
        ctx.fillStyle = marker.color || MARKER_COLOR;
        ctx.fillText(marker.label, Math.min(px + 3, plotX + plotW - 60), plotY + 14);
      }
    }

    // ホバーの十字線
    if (Number.isFinite(overlays.hoverX) && overlays.hoverX >= x0 && overlays.hoverX <= x1) {
      const px = xToPx(overlays.hoverX);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, plotY); ctx.lineTo(px, plotY + plotH); ctx.stroke();
    }

    return { plotX, plotW, x0, x1 };
  }

  /** canvas 上のピクセル x → データの x（秒） */
  function pixelToX(canvas, pixelX, view) {
    const width = Math.max(1, canvas.clientWidth);
    const plotW = Math.max(1, width - PAD.left - PAD.right);
    const ratio = (pixelX - PAD.left) / plotW;
    return view.x0 + Math.min(1, Math.max(0, ratio)) * (view.x1 - view.x0);
  }

  function niceStep(raw) {
    if (!(raw > 0)) return 1;
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const mantissa = raw / power;
    const step = mantissa <= 1 ? 1 : mantissa <= 2 ? 2 : mantissa <= 5 ? 5 : 10;
    return step * power;
  }

  function formatTick(value) {
    if (Math.abs(value) >= 1000) return String(Math.round(value));
    if (Math.abs(value) >= 10) return value.toFixed(Math.abs(value - Math.round(value)) < 1e-9 ? 0 : 1);
    if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
    return value.toFixed(Math.abs(value) < 1 ? 2 : 1);
  }

  /** ホバー位置の値を 1 行にする */
  function readoutAt(store, index) {
    if (!store || index < 0 || index >= store.x.length) return "";
    const f = (v, d) => (Number.isFinite(v) ? v.toFixed(d) : "—");
    return [
      `t=${store.x[index].toFixed(3)} s`,
      `serial ${store.serial[index] === null ? "—" : store.serial[index]}`,
      `acc ${f(store.acc[0][index], 2)} / ${f(store.acc[1][index], 2)} / ${f(store.acc[2][index], 2)} G`,
      `gyro ${f(store.gyro[0][index], 0)} / ${f(store.gyro[1][index], 0)} / ${f(store.gyro[2][index], 0)} dps`,
      `press ${store.press.map((channel) => f(channel[index], 0)).join(" ")}`
    ].join("  ·  ");
  }

  const api = {
    KINDS,
    CHANNELS,
    COLORS,
    UNITS,
    MIN_SPAN,
    SYMMETRIC,
    LIVE_KEEP_SECONDS,
    MARKER_COLOR,
    IMPULSE_COLORS,
    createStore,
    appendSamples,
    trimStore,
    sortStore,
    fromEntries,
    extent,
    niceRange,
    niceCeil,
    indexRange,
    envelope,
    rangeOf,
    nearestIndex,
    gapShades,
    resolveView,
    drawPanel,
    pixelToX,
    readoutAt,
    formatTick,
    niceStep
  };

  return Object.freeze(api);
});
