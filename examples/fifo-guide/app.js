(function fifoGuideApp(root) {
  "use strict";

  /**
   * FIFO Guide — 初めてFIFOを使う人向けの実機example。
   *
   * FIFOプロトコル（serial指定・再要求・drain）はこのファイルでは一切実装しない。
   *   - src/InsoleFifo.js    … FIFO収集ループ本体
   *   - src/InsoleToolkit.js … 接続UI / 'fifo-recording' プロファイル /
   *                            startMeasurement()・stopMeasurement()（drain待ち込み）/
   *                            insoleToolkitMeasurementToCSV()
   * 判定ロジック（serial連続性・欠損range・timeline集約・30秒バッファ判定）は
   * ./continuity.js に純関数として切り出し、Node で単体テストしている。
   */

  const C = root.FifoGuideContinuity;
  const I18n = root.FifoGuideI18n;

  if (!C) throw new Error("fifo-guide: continuity.js must be loaded before app.js");
  if (!I18n) throw new Error("fifo-guide: i18n.js must be loaded before app.js");

  const DEVICE_ID = 0;
  const MAX_LOG_ENTRIES = 400;
  const LIVE_HISTORY_SIZE = 600;   // 固定長リングバッファ（長時間開いてもメモリが増えない）
  const MAX_SAMPLES = 120000;      // 600 s 相当。超えたら結果に truncated 注意を出す
  const TIMELINE_BINS = C.DEFAULT_BIN_COUNT;
  const BAR_FULL_SCALE_MS = 60000; // バッファガイドバーの右端
  const PRESSURE_FULL_SCALE = 20000;
  const ACC_FULL_SCALE = 4;        // G

  /** 結果テーブルの行定義。key = i18n キー、note = 説明の i18n キー */
  const METRIC_ROWS = [
    { key: "m_duration", note: "m_duration_note" },
    { key: "m_samples", note: "m_samples_note" },
    { key: "m_first", note: "m_first_note" },
    { key: "m_last", note: "m_last_note" },
    { key: "m_expected", note: "m_expected_note" },
    { key: "m_received", note: "m_received_note" },
    { key: "m_missing", note: "m_missing_note" },
    { key: "m_missing_rate", note: "m_missing_rate_note" },
    { key: "m_dropped", note: "m_dropped_note" },
    { key: "m_drain_recovered", note: "m_drain_note" },
    { key: "m_drain_ms", note: "m_drain_ms_note" },
    { key: "m_max_lag", note: "m_max_lag_note" },
    { key: "m_csv", note: "m_csv_note" }
  ];

  const dom = {};
  const logEntries = [];
  const state = {
    phase: "idle",           // idle | ready | preparing | recording | draining | done
    session: null,
    connected: false,
    recording: false,
    plannedMs: 30000,
    startedAt: 0,
    stopTimer: null,
    tickTimer: null,
    drainStartedAt: 0,
    drainMs: null,
    drainRecovered: 0,
    maxLag: 0,
    lag: 0,
    droppedLive: 0,          // onDataLoss(info.cumulative) の最新値
    droppedTotal: null,      // onStopped(info.dropped) = この収録の回復不能ロス累計
    batchCount: 0,
    lastBatchAt: 0,
    lastBatchGapMs: null,
    lastBatchSize: 0,
    latestSample: null,
    live: {
      pressure: new Float32Array(LIVE_HISTORY_SIZE),
      acc: new Float32Array(LIVE_HISTORY_SIZE),
      count: 0,
      head: 0
    },
    result: null,
    analysis: null,
    verdict: null,
    dropped: 0,
    cautions: [],
    csv: "",
    lastUpdateAt: null,
    sourceCopy: null,
    renderQueued: false
  };

  const t = (key, params) => I18n.t(key, params);

  // ── 起動 ────────────────────────────────────────────────────────────
  root.document.addEventListener("DOMContentLoaded", () => {
    cacheDom();
    buildMetricTable();
    wireControls();
    renderEnvLine();
    installDevice();
    setPhase("idle");
    drawTimeline([]);
    renderLive();
    log("info", "logPageReady");

    // 言語切替時は、動的に組み立てた文字列も作り直す
    root.addEventListener("fifo-guide:languagechange", () => {
      buildMetricTable();
      refreshSourceCopy();
      renderResult();
      renderLive();
      renderLog();
      renderEnvLine();
      updateBufferGuide(state.recording ? Date.now() - state.startedAt : 0);
      dom.recordButton.innerHTML = t(state.recording ? "recordStopHtml" : "recordStartHtml");
    });
  });

  function cacheDom() {
    const ids = [
      "toolkit0", "source-badge", "source-title", "source-detail",
      "duration-select", "duration-custom", "record-button", "csv-button", "json-button",
      "elapsed-text", "buffer-guide-text", "buffer-bar-cursor", "buffer-bar-mark",
      "timeline-canvas", "timeline-caption", "continuity-rate",
      "missing-ranges", "missing-ranges-wrap",
      "live-canvas", "live-rate", "batch-count", "batch-size", "batch-gap", "live-lag",
      "latest-sample",
      "result-card", "result-verdict", "result-summary", "result-cautions",
      "metric-table-body", "last-update-time",
      "event-log", "env-line", "copy-log-button", "clear-log-button"
    ];
    for (const id of ids) dom[camel(id)] = root.document.getElementById(id);
  }

  function camel(id) {
    return id.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase());
  }

  /** 結果テーブルを i18n ラベルで組み立てる（言語切替時は値を保ったまま作り直す） */
  function buildMetricTable() {
    const body = dom.metricTableBody;
    if (!body) return;
    const previous = new Map();
    body.querySelectorAll("tr").forEach((row) => {
      previous.set(row.dataset.metric, {
        value: row.querySelector(".metric-value").textContent,
        level: row.className
      });
    });
    body.innerHTML = "";
    for (const metric of METRIC_ROWS) {
      const row = root.document.createElement("tr");
      row.dataset.metric = metric.key;
      const restored = previous.get(metric.key);
      if (restored) row.className = restored.level;
      const label = root.document.createElement("th");
      label.scope = "row";
      label.textContent = t(metric.key);
      const value = root.document.createElement("td");
      value.className = "metric-value";
      value.textContent = restored ? restored.value : t("valueEmpty");
      const note = root.document.createElement("td");
      note.className = "metric-note";
      note.textContent = t(metric.note);
      row.append(label, value, note);
      body.appendChild(row);
    }
  }

  function wireControls() {
    dom.durationSelect.addEventListener("change", () => {
      const custom = dom.durationSelect.value === "custom";
      dom.durationCustom.disabled = !custom;
      if (custom) dom.durationCustom.focus();
      updateBufferGuide(0);
    });
    dom.durationCustom.addEventListener("input", () => updateBufferGuide(0));
    dom.recordButton.addEventListener("click", () => {
      if (state.recording) stopRecording("manual");
      else startRecording();
    });
    dom.csvButton.addEventListener("click", downloadCsv);
    dom.jsonButton.addEventListener("click", downloadJson);
    dom.copyLogButton.addEventListener("click", copyLog);
    dom.clearLogButton.addEventListener("click", () => {
      logEntries.length = 0;
      renderLog();
    });
    root.addEventListener("resize", () => {
      drawTimeline(state.analysis ? C.buildTimelineBins(state.analysis, TIMELINE_BINS) : []);
      drawLive();
    });
    updateBufferGuide(0);
  }

  function installDevice() {
    if (typeof root.buildInsoleToolkit !== "function" || !Array.isArray(root.insoles)) {
      setSourceCopy("error", "toolkitLoadErrorTitle", "toolkitLoadErrorDetail");
      return;
    }
    root.buildInsoleToolkit(dom.toolkit0, "INSOLE 01", DEVICE_ID, {
      // 接続時は Realtime。収録開始時に 'fifo-recording' へ切り替え、停止後に戻す。
      profile: "realtime-full",
      autoReconnect: true,
      reconnectIntervalMs: 2000,
      onStateChange: handleSessionState,
      onError: handleSessionError,
      fifo: {
        startupDelayMs: 1000,
        drainTimeoutMs: 5000,
        onSamples: handleFifoSamples,
        onProgress: handleFifoProgress,
        onDataLoss: handleFifoDataLoss,
        onStopped: handleFifoStopped,
        onAnomaly: handleFifoAnomaly,
        onError: handleSessionError
      }
    });
    state.session = root.getInsoleToolkitSession(DEVICE_ID);
    // buildInsoleToolkit() は setup() を呼ばない（simulator 指定時のみ内部で呼ぶ）。
    // 未呼び出しだと hashUUID が空のままで、接続時に serviceUUID 参照で失敗する。
    root.insoles[DEVICE_ID].setup();
  }

  // ── 計測時間とバッファガイド ─────────────────────────────────────────
  function selectedDurationMs() {
    if (dom.durationSelect.value === "custom") {
      const seconds = Math.max(3, Math.min(600, Number(dom.durationCustom.value) || 30));
      return seconds * 1000;
    }
    return Number(dom.durationSelect.value) || 30000;
  }

  function updateBufferGuide(elapsedMs) {
    const planned = selectedDurationMs();
    const guide = C.bufferGuidance(planned);
    const cursorMs = state.recording ? elapsedMs : planned;
    dom.bufferBarCursor.style.left = `${Math.min(100, (cursorMs / BAR_FULL_SCALE_MS) * 100)}%`;
    dom.bufferBarCursor.classList.toggle("over", cursorMs > C.BUFFER_WINDOW_MS);
    dom.bufferBarMark.style.left = `${(C.BUFFER_WINDOW_MS / BAR_FULL_SCALE_MS) * 100}%`;

    const params = {
      seconds: planned / 1000,
      packets: guide.expectedPackets,
      window: guide.windowSeconds
    };
    dom.bufferGuideText.className = `buffer-guide-text ${guide.withinWindow ? "ok" : "caution"}`;
    dom.bufferGuideText.textContent = guide.withinWindow
      ? t("bufferWithinWindow", params)
      : t("bufferOverWindow", params);
  }

  // ── 収録 ────────────────────────────────────────────────────────────
  async function startRecording() {
    if (!state.session || !state.connected) {
      log("warn", "logNotConnected");
      return;
    }
    state.plannedMs = selectedDurationMs();
    resetRunState();
    setPhase("preparing");
    log("info", "logPreparing", { seconds: state.plannedMs / 1000 });

    try {
      await state.session.startMeasurement({
        profile: "fifo-recording",
        restoreProfile: true,
        maxSamples: MAX_SAMPLES,
        metadata: {
          page: "fifo-guide",
          plannedDurationMs: state.plannedMs,
          platform: root.navigator.platform
        }
      });
    } catch (error) {
      setPhase(state.connected ? "ready" : "idle");
      log("error", "logStartFailed", { message: describeError(error) });
      return;
    }

    state.recording = true;
    state.startedAt = Date.now();
    setPhase("recording");
    log("success", "logStarted");
    state.tickTimer = root.setInterval(onTick, 100);
    state.stopTimer = root.setTimeout(() => stopRecording("duration"), state.plannedMs);
  }

  function onTick() {
    const elapsed = Date.now() - state.startedAt;
    dom.elapsedText.textContent = `${(elapsed / 1000).toFixed(1)} s`;
    updateBufferGuide(elapsed);
  }

  async function stopRecording(reason) {
    if (!state.recording) return;
    state.recording = false;
    clearTimers();
    state.drainStartedAt = Date.now();
    setPhase("draining");
    log("info", reason === "duration" ? "logStoppedByDuration" : "logStoppedManually");

    let result = null;
    try {
      result = await state.session.stopMeasurement({ reason });
    } catch (error) {
      log("error", "logStopFailed", { message: describeError(error) });
      // Toolkit はプロファイル復元に失敗しても直近の計測結果を保持する
      result = state.session.lastMeasurement || null;
    }
    if (state.drainMs === null) state.drainMs = Date.now() - state.drainStartedAt;

    if (!result) {
      setPhase(state.connected ? "ready" : "idle");
      log("error", "logNoResult");
      return;
    }
    finalizeResult(result);
    setPhase("done");
  }

  function clearTimers() {
    if (state.stopTimer) { root.clearTimeout(state.stopTimer); state.stopTimer = null; }
    if (state.tickTimer) { root.clearInterval(state.tickTimer); state.tickTimer = null; }
  }

  function resetRunState() {
    state.drainStartedAt = 0;
    state.drainMs = null;
    state.drainRecovered = 0;
    state.maxLag = 0;
    state.lag = 0;
    state.droppedLive = 0;
    state.droppedTotal = null;
    state.batchCount = 0;
    state.lastBatchAt = 0;
    state.lastBatchGapMs = null;
    state.lastBatchSize = 0;
    state.latestSample = null;
    state.live.count = 0;
    state.live.head = 0;
    state.result = null;
    state.analysis = null;
    state.verdict = null;
    state.dropped = 0;
    state.cautions = [];
    state.csv = "";
    dom.elapsedText.textContent = "0.0 s";
    dom.csvButton.disabled = true;
    dom.jsonButton.disabled = true;
    resetMetricTable();
    renderResult();
    drawTimeline([]);
    renderLive();
  }

  function resetMetricTable() {
    dom.metricTableBody.querySelectorAll("tr").forEach((row) => {
      row.className = "";
      row.querySelector(".metric-value").textContent = t("valueEmpty");
    });
    dom.continuityRate.textContent = "missing 0 / expected 0";
    dom.timelineCaption.textContent = t("continuityEmpty");
    dom.missingRanges.textContent = t("missingRangesNone");
    dom.missingRangesWrap.className = "missing-ranges clean";
  }

  // ── FIFO コールバック ────────────────────────────────────────────────
  function handleFifoSamples(deviceId, samples) {
    if (!Array.isArray(samples) || samples.length === 0) return;
    const now = root.performance.now();
    state.batchCount += 1;
    state.lastBatchSize = samples.length;
    if (state.lastBatchAt > 0) state.lastBatchGapMs = now - state.lastBatchAt;
    state.lastBatchAt = now;
    state.latestSample = samples[samples.length - 1];
    state.lastUpdateAt = new Date();

    for (const sample of samples) {
      const press = sample && sample.press && Array.isArray(sample.press.values)
        ? sample.press.values.reduce((sum, value) => sum + (Number(value) || 0), 0)
        : 0;
      const acc = sample && sample.converted_acc;
      const norm = acc ? Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z) : 0;
      state.live.pressure[state.live.head] = press;
      state.live.acc[state.live.head] = norm;
      state.live.head = (state.live.head + 1) % LIVE_HISTORY_SIZE;
      if (state.live.count < LIVE_HISTORY_SIZE) state.live.count += 1;
    }
    queueLiveRender();
  }

  function handleFifoProgress(info) {
    const lag = Number(info && info.lag) || 0;
    state.lag = lag;
    if (lag > state.maxLag) state.maxLag = lag;
    if (info && info.draining) {
      setSourceCopy("draining", "sourceDrainingTitle", "sourceDrainingProgress", {
        detailParams: { collected: info.collected, lag }
      });
    }
    queueLiveRender();
  }

  function handleFifoDataLoss(info) {
    state.droppedLive = Number(info && info.cumulative) || state.droppedLive;
    log("error", "logDataLoss", {
      dropped: info.dropped,
      cumulative: info.cumulative,
      reason: info.reason
    });
  }

  function handleFifoStopped(info) {
    state.drainRecovered = Number(info && info.drainRecovered) || 0;
    state.droppedTotal = Number(info && info.dropped) || 0;
    if (state.drainStartedAt > 0 && state.drainMs === null) {
      state.drainMs = Date.now() - state.drainStartedAt;
    }
    log("info", "logFifoStopped", {
      collected: info.collected,
      dropped: info.dropped,
      recovered: state.drainRecovered
    });
  }

  function handleFifoAnomaly(info) {
    // 到着待ちの再要求は正常動作。記録はするが警告扱いにはしない。
    log("info", "logReRequest", {
      expected: info.expected,
      received: info.received,
      noData: info.noData
    });
  }

  /**
   * 接続状態の遷移は Toolkit の onStateChange 経由で拾う。
   * insole.on* を上書きしないので、Toolkit のヘッダ表示や自動再接続と競合しない。
   */
  function handleSessionState(snapshot) {
    const wasConnected = state.connected;
    state.connected = !!snapshot.connected;
    if (snapshot.measurementPhase === "draining" && state.drainStartedAt === 0) {
      state.drainStartedAt = Date.now();
    }
    if (state.connected && !wasConnected) {
      log("success", "logConnected");
      if (state.phase === "idle") setPhase("ready");
    }
    if (!state.connected && wasConnected) {
      if (state.recording) {
        clearTimers();
        state.recording = false;
        log("error", "logDisconnectedWhileRecording");
        // 計測ウィンドウを閉じておく。閉じないと activeMeasurement が残り、
        // 再接続後に MEASUREMENT_ACTIVE で次の収録を開始できなくなる。
        Promise.resolve(state.session.stopMeasurement({ reason: "disconnect" }))
          .catch((error) => log("warn", "logStopAfterDisconnect", { message: describeError(error) }));
      }
      log("warn", "logDisconnected");
      setPhase("disconnected");
      return;
    }
    applyButtonState();
  }

  function handleSessionError(error) {
    if (isUserCancel(error)) {
      log("info", "logChooserCancelled");
      return;
    }
    log("error", "logError", { message: describeError(error) });
    setSourceCopy("error", "sourceErrorTitle", "", { detailRaw: describeError(error) });
  }

  function isUserCancel(error) {
    if (!error) return false;
    if (error.name === "NotFoundError") return true;
    const message = error.message ? String(error.message) : String(error);
    return /cancel+ed|chooser/i.test(message);
  }

  function describeError(error) {
    if (!error) return "unknown";
    const code = error.code ? ` [${error.code}]` : "";
    return `${error.message || String(error)}${code}`;
  }

  // ── 結果の確定 ───────────────────────────────────────────────────────
  function finalizeResult(result) {
    const samples = Array.isArray(result.raw && result.raw.samples) ? result.raw.samples : [];
    const analysis = C.analyzeSerials(samples.map((sample) => sample.serial_number));
    // dropped は「収録中に回復不能と判定された累計」。onStopped(info.dropped) が正。
    // result.fifo.dropped は checkpoint 区間の再集計値なので定義が異なる。
    const dropped = state.droppedTotal !== null
      ? state.droppedTotal
      : Math.max(0, Number(result.fifo && result.fifo.dropped) || 0);
    const verdict = C.evaluateRecording({
      analysis,
      missing: analysis.missing,
      dropped,
      durationMs: result.durationMs,
      maxLag: state.maxLag
    });

    state.result = result;
    state.analysis = analysis;
    state.verdict = verdict;
    state.dropped = dropped;
    state.csv = samples.length > 0 ? root.insoleToolkitMeasurementToCSV(result, "raw") : "";
    state.lastUpdateAt = new Date();

    state.cautions = verdict.cautions.map((text) => ({ raw: text }));
    if (result.raw.truncated) {
      state.cautions.push({ key: "cautionTruncated", params: { max: MAX_SAMPLES } });
    }
    if (dropped !== analysis.missing) {
      state.cautions.push({
        key: "cautionDroppedMismatch",
        params: { dropped, missing: analysis.missing }
      });
    }

    // 画面表示とSDK側の集計がずれていないかを突き合わせる
    const sdkSerial = (result.raw && result.raw.serial) || null;
    if (sdkSerial && Number.isInteger(sdkSerial.missing) && sdkSerial.missing !== analysis.missing) {
      log("warn", "logSdkMismatch", { sdk: sdkSerial.missing, recomputed: analysis.missing });
    }
    // 保存するCSVから数え直した欠損数と画面表示が一致することを確認する
    if (state.csv) {
      const fromCsv = C.analyzeSerials(C.extractSerialsFromCsv(state.csv));
      const matched = fromCsv.missing === analysis.missing && fromCsv.expected === analysis.expected;
      log(matched ? "success" : "error", "logCsvCrossCheck", {
        expected: fromCsv.expected,
        received: fromCsv.received,
        missing: fromCsv.missing,
        verdict: t(matched ? "logCsvMatched" : "logCsvMismatched")
      });
    }

    renderResult();
    dom.csvButton.disabled = samples.length === 0;
    dom.jsonButton.disabled = false;

    log(verdict.level === "fail" ? "error" : verdict.level === "caution" ? "warn" : "success", "logResult", {
      label: verdict.label,
      seconds: (result.durationMs / 1000).toFixed(1),
      samples: samples.length,
      received: analysis.received,
      expected: analysis.expected,
      missing: analysis.missing,
      dropped,
      recovered: state.drainRecovered,
      drainMs: state.drainMs,
      maxLag: state.maxLag
    });
  }

  function renderResult() {
    const result = state.result;
    const analysis = state.analysis;
    const verdict = state.verdict;

    if (!result || !analysis || !verdict) {
      dom.resultCard.className = "verdict-bar result-empty";
      dom.resultVerdict.className = "verdict-badge";
      dom.resultVerdict.textContent = t("verdictWaiting");
      dom.resultSummary.textContent = t("resultSummaryWaiting");
      dom.resultCautions.innerHTML = "";
      dom.lastUpdateTime.textContent = "—";
      return;
    }

    const level = verdict.level;
    dom.resultCard.className = `verdict-bar result-${level === "caution" ? "caution" : level}`;
    dom.resultVerdict.className = `verdict-badge verdict-${level}`;
    dom.resultVerdict.textContent = t(
      level === "fail" ? "verdictFail" : level === "caution" ? "verdictWarn" : "verdictPass"
    );
    dom.resultSummary.textContent = t(
      level === "fail" ? "resultSummaryFail"
        : level === "caution" ? "resultSummaryWarn"
          : "resultSummaryPass"
    );

    const samples = Array.isArray(result.raw.samples) ? result.raw.samples.length : 0;
    setMetric("m_duration", `${(result.durationMs / 1000).toFixed(1)} s`,
      verdict.buffer.withinWindow ? "ok" : "warn");
    setMetric("m_samples", String(samples), samples > 0 ? "ok" : "bad");
    setMetric("m_first", analysis.first === null ? t("valueEmpty") : String(analysis.first));
    setMetric("m_last", analysis.last === null ? t("valueEmpty") : String(analysis.last));
    setMetric("m_expected", String(analysis.expected));
    setMetric("m_received", String(analysis.received));
    setMetric("m_missing", String(analysis.missing), analysis.missing === 0 ? "ok" : "bad");
    setMetric("m_missing_rate", `${(analysis.missingRate * 100).toFixed(3)} %`,
      analysis.missing === 0 ? "ok" : "bad");
    setMetric("m_dropped", String(state.dropped), state.dropped === 0 ? "ok" : "bad");
    setMetric("m_drain_recovered", String(state.drainRecovered));
    setMetric("m_drain_ms", state.drainMs === null ? t("valueEmpty") : `${state.drainMs} ms`);
    setMetric("m_max_lag", `${state.maxLag} / ${C.RING_BUFFER_CAPACITY}`,
      verdict.buffer.lagRatio >= C.LAG_CAUTION_RATIO ? "warn" : "ok");
    setMetric("m_csv", samples > 0 ? t("csvAvailable") : t("csvUnavailable"), samples > 0 ? "ok" : "bad");

    const cautions = state.cautions.map((entry) => (
      entry.raw !== undefined ? entry.raw : t(entry.key, entry.params)
    ));
    dom.resultCautions.innerHTML = cautions.length === 0 ? "" : [
      '<div class="caution-box">',
      `<strong>${escapeHtml(t("cautionsTitle"))}</strong><ul>`,
      ...cautions.map((text) => `<li>${escapeHtml(text)}</li>`),
      "</ul></div>"
    ].join("");

    const bins = C.buildTimelineBins(analysis, TIMELINE_BINS);
    drawTimeline(bins);
    dom.continuityRate.textContent = `missing ${analysis.missing} / expected ${analysis.expected}`;
    dom.timelineCaption.textContent = analysis.expected === 0
      ? t("continuityEmpty")
      : t("continuityCaption", {
        first: analysis.first,
        last: analysis.last,
        bins: bins.length,
        perBin: Math.max(1, Math.round(analysis.expected / Math.max(1, bins.length)))
      });

    if (analysis.missingRanges.length > 0) {
      dom.missingRangesWrap.className = "missing-ranges";
      dom.missingRanges.textContent = C.formatMissingRanges(analysis.missingRanges, 30);
    } else {
      dom.missingRangesWrap.className = "missing-ranges clean";
      dom.missingRanges.textContent = t("missingRangesNone");
    }
    dom.lastUpdateTime.textContent = state.lastUpdateAt
      ? state.lastUpdateAt.toLocaleTimeString()
      : "—";
  }

  function setMetric(key, value, level) {
    const row = dom.metricTableBody.querySelector(`tr[data-metric="${key}"]`);
    if (!row) return;
    row.querySelector(".metric-value").textContent = value;
    row.className = level ? `level-${level}` : "";
  }

  // ── 描画 ────────────────────────────────────────────────────────────
  function queueLiveRender() {
    if (state.renderQueued) return;
    state.renderQueued = true;
    root.requestAnimationFrame(() => {
      state.renderQueued = false;
      renderLive();
    });
  }

  function renderLive() {
    dom.batchCount.textContent = String(state.batchCount);
    dom.batchSize.textContent = state.lastBatchSize > 0 ? String(state.lastBatchSize) : "—";
    dom.batchGap.textContent = state.lastBatchGapMs === null
      ? "—"
      : `${Math.round(state.lastBatchGapMs)} ms`;
    dom.liveLag.textContent = state.recording || state.phase === "draining"
      ? `${state.lag} / ${C.RING_BUFFER_CAPACITY}`
      : "—";
    dom.liveLag.className = state.lag >= C.RING_BUFFER_CAPACITY * C.LAG_CAUTION_RATIO ? "alert" : "";
    dom.liveRate.textContent = state.live.count > 0 ? `${state.live.count} samples plotted` : "";

    const sample = state.latestSample;
    dom.latestSample.textContent = sample
      ? [
        `serial_number : ${sample.serial_number}  (packet_number ${sample.packet_number})`,
        `t             : ${sample.t} ms`,
        `gyro   [dps]  : ${formatVector(sample.converted_gyro)}`,
        `acc    [G]    : ${formatVector(sample.converted_acc)}`,
        `press  [ADC]  : ${sample.press && sample.press.values ? sample.press.values.join(", ") : "—"}`,
        t("latestSampleQuatNote")
      ].join("\n")
      : t("latestSampleEmpty");
    drawLive();
  }

  function formatVector(vector) {
    if (!vector) return "—";
    return `x=${vector.x.toFixed(2)} y=${vector.y.toFixed(2)} z=${vector.z.toFixed(2)}`;
  }

  function prepareCanvas(canvas) {
    const ratio = root.devicePixelRatio || 1;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight || Number(canvas.getAttribute("height")) || 80);
    const pixelWidth = Math.floor(width * ratio);
    const pixelHeight = Math.floor(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    return { ctx, width, height };
  }

  function drawPlaceholder(ctx, width, height, text) {
    ctx.fillStyle = "#0b141b";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#5d707d";
    ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(text, 12, height / 2 + 4);
  }

  /** timeline は bin 単位で Canvas に描く（serialごとのDOM要素は作らない） */
  function drawTimeline(bins) {
    const canvas = dom.timelineCanvas;
    if (!canvas) return;
    const { ctx, width, height } = prepareCanvas(canvas);
    if (!bins || bins.length === 0) {
      drawPlaceholder(ctx, width, height, t("continuityEmpty"));
      return;
    }
    const binWidth = width / bins.length;
    for (let i = 0; i < bins.length; i += 1) {
      const bin = bins[i];
      const x = i * binWidth;
      const w = Math.max(1, binWidth + 0.5);
      ctx.fillStyle = "#35d1b6";
      ctx.fillRect(x, 0, w, height);
      if (bin.missing > 0) {
        // 欠損が1つでもあるbinは赤で塗り、割合を高さで示す（見落とし防止）
        const ratio = bin.total > 0 ? bin.missing / bin.total : 1;
        ctx.fillStyle = "#ff7559";
        ctx.fillRect(x, 0, w, Math.max(height * 0.5, height * ratio));
      }
    }
  }

  function drawLive() {
    const canvas = dom.liveCanvas;
    if (!canvas) return;
    const { ctx, width, height } = prepareCanvas(canvas);
    if (state.live.count === 0) {
      drawPlaceholder(ctx, width, height, t("liveEmpty"));
      return;
    }
    ctx.fillStyle = "#0b141b";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    drawSeries(ctx, width, height, state.live.pressure, PRESSURE_FULL_SCALE, "#7fa4ff");
    drawSeries(ctx, width, height, state.live.acc, ACC_FULL_SCALE, "#f6c860");
  }

  function drawSeries(ctx, width, height, buffer, fullScale, color) {
    const { count, head } = state.live;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < count; i += 1) {
      const index = (head - count + i + LIVE_HISTORY_SIZE * 2) % LIVE_HISTORY_SIZE;
      const value = Math.min(1, Math.max(0, buffer[index] / fullScale));
      const x = (i / Math.max(1, count - 1)) * width;
      const y = height - value * (height - 6) - 3;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // ── 状態表示 ─────────────────────────────────────────────────────────
  const PHASE_SOURCE = {
    idle: ["waiting", "sourceConnectTitle", "sourceConnectDetail"],
    ready: ["ready", "sourceReadyTitle", "sourceReadyDetail"],
    preparing: ["preparing", "sourcePreparingTitle", "sourcePreparingDetail"],
    recording: ["recording", "sourceRecordingTitle", "sourceRecordingDetail"],
    draining: ["draining", "sourceDrainingTitle", "sourceDrainingDetail"],
    done: ["done", "sourceDoneTitle", "sourceDoneDetail"],
    disconnected: ["waiting", "sourceDisconnectedTitle", "sourceDisconnectedDetail"]
  };

  const BADGE_TEXT = {
    waiting: "WAITING",
    ready: "READY",
    preparing: "PREPARING",
    recording: "RECORDING",
    draining: "DRAINING",
    done: "DONE",
    error: "ERROR"
  };

  function setPhase(phase) {
    state.phase = phase === "disconnected" ? "idle" : phase;
    const entry = PHASE_SOURCE[phase] || PHASE_SOURCE.idle;
    setSourceCopy(entry[0], entry[1], entry[2]);
    dom.recordButton.innerHTML = t(phase === "recording" ? "recordStopHtml" : "recordStartHtml");
    dom.recordButton.classList.toggle("active", phase === "recording");
    applyButtonState();
  }

  /** 収録開始/停止ボタンと計測時間入力の有効・無効は phase から一元的に決める */
  function applyButtonState() {
    const phase = state.phase;
    dom.recordButton.disabled = phase === "recording"
      ? false
      : phase === "preparing" || phase === "draining" || !state.connected;
    const busy = phase === "preparing" || phase === "recording" || phase === "draining";
    dom.durationSelect.disabled = busy;
    dom.durationCustom.disabled = busy || dom.durationSelect.value !== "custom";
  }

  function renderSource(source, title, detail) {
    dom.sourceBadge.className = `source-badge ${source}`;
    dom.sourceBadge.textContent = BADGE_TEXT[source] || BADGE_TEXT.waiting;
    dom.sourceTitle.textContent = title;
    dom.sourceDetail.textContent = detail;
  }

  function setSourceCopy(source, titleKey, detailKey, options = {}) {
    state.sourceCopy = {
      source,
      titleKey,
      detailKey,
      titleParams: options.titleParams || null,
      detailParams: options.detailParams || null,
      detailRaw: Object.prototype.hasOwnProperty.call(options, "detailRaw") ? options.detailRaw : null
    };
    refreshSourceCopy();
  }

  function refreshSourceCopy() {
    const copy = state.sourceCopy;
    if (!copy) return;
    const detail = copy.detailRaw !== null
      ? copy.detailRaw
      : (copy.detailKey ? t(copy.detailKey, copy.detailParams) : "");
    renderSource(copy.source, t(copy.titleKey, copy.titleParams), detail);
  }

  // ── ログ / エクスポート ──────────────────────────────────────────────
  function log(level, key, params) {
    logEntries.push({ at: new Date(), level, key, params: params || null });
    if (logEntries.length > MAX_LOG_ENTRIES) {
      logEntries.splice(0, logEntries.length - MAX_LOG_ENTRIES);
    }
    renderLog();
  }

  function logText(entry) {
    return t(entry.key, entry.params);
  }

  function renderLog() {
    dom.eventLog.innerHTML = logEntries.map((entry) => (
      `<div class="log-line log-${entry.level}">`
      + `${escapeHtml(entry.at.toTimeString().slice(0, 8))} ${escapeHtml(logText(entry))}`
      + "</div>"
    )).join("");
    dom.eventLog.scrollTop = dom.eventLog.scrollHeight;
  }

  function environmentLines() {
    return [
      `platform=${root.navigator.platform}`,
      `userAgent=${root.navigator.userAgent}`,
      `webBluetooth=${typeof root.navigator.bluetooth !== "undefined" ? "available" : "unavailable"}`,
      `language=${I18n.getLanguage()}`,
      `plannedDurationMs=${state.plannedMs}`,
      "deviceCount=1",
      "profile=fifo-recording"
    ];
  }

  function renderEnvLine() {
    dom.envLine.textContent = environmentLines().join(" / ");
  }

  async function copyLog() {
    const text = [
      "# ORPHE INSOLE fifo-guide log",
      ...environmentLines().map((line) => `# ${line}`),
      ...logEntries.map((entry) => `${entry.at.toISOString()} [${entry.level}] ${logText(entry)}`)
    ].join("\n");
    const original = dom.copyLogButton.innerHTML;
    dom.copyLogButton.disabled = true;
    try {
      if (root.navigator.clipboard && root.navigator.clipboard.writeText) {
        await root.navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      dom.copyLogButton.textContent = t("copyLogDone", { count: logEntries.length });
    } catch (error) {
      void error;
      dom.copyLogButton.textContent = t("copyLogFailed");
    } finally {
      root.setTimeout(() => {
        dom.copyLogButton.innerHTML = original;
        dom.copyLogButton.disabled = false;
      }, 1600);
    }
  }

  function fallbackCopy(text) {
    const area = root.document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    root.document.body.appendChild(area);
    area.select();
    root.document.execCommand("copy");
    root.document.body.removeChild(area);
  }

  function downloadCsv() {
    if (!state.csv) return;
    saveBlob(state.csv, "text/csv", `orphe-insole-fifo-guide-${timestampSuffix()}.csv`);
    log("success", "logCsvSaved");
  }

  function downloadJson() {
    const analysis = state.analysis;
    const result = state.result;
    const payload = {
      page: "fifo-guide",
      savedAt: new Date().toISOString(),
      environment: environmentLines(),
      plannedDurationMs: state.plannedMs,
      durationMs: result ? result.durationMs : null,
      profileId: result ? result.profileId : null,
      verdict: state.verdict ? state.verdict.label : null,
      samples: result && Array.isArray(result.raw.samples) ? result.raw.samples.length : 0,
      truncated: result ? !!result.raw.truncated : false,
      serial: analysis ? {
        first: analysis.first,
        last: analysis.last,
        expected: analysis.expected,
        received: analysis.received,
        missing: analysis.missing,
        missingRate: analysis.missingRate,
        duplicates: analysis.duplicates,
        outOfOrder: analysis.outOfOrder,
        missingRanges: analysis.missingRanges.map((range) => range.label)
      } : null,
      sdkSerial: result && result.raw ? result.raw.serial : null,
      fifo: {
        droppedTotal: state.droppedTotal,
        droppedLiveCumulative: state.droppedLive,
        checkpointDropped: result && result.fifo ? result.fifo.dropped : null,
        drainRecovered: state.drainRecovered,
        drainMs: state.drainMs,
        maxLag: state.maxLag,
        ringBufferCapacity: C.RING_BUFFER_CAPACITY,
        bufferWindowMs: C.BUFFER_WINDOW_MS
      },
      log: logEntries.map((entry) => ({
        at: entry.at.toISOString(),
        level: entry.level,
        message: logText(entry)
      }))
    };
    saveBlob(JSON.stringify(payload, null, 2), "application/json",
      `orphe-insole-fifo-guide-${timestampSuffix()}.json`);
    log("success", "logJsonSaved");
  }

  function timestampSuffix() {
    return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  }

  function saveBlob(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = root.document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    root.document.body.appendChild(anchor);
    anchor.click();
    root.setTimeout(() => {
      URL.revokeObjectURL(url);
      if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
    }, 1000);
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
