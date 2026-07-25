(function fifoGuideApp(root) {
  "use strict";

  /**
   * FIFO Guide — 初めてFIFOを使う人向けの実機example。1台でも2台（左右同時）でも収録できる。
   *
   * FIFOプロトコル（serial指定・再要求・drain）はこのファイルでは一切実装しない。
   *   - src/InsoleFifo.js    … FIFO収集ループ本体（デバイスごとに1インスタンス）
   *   - src/InsoleToolkit.js … 接続UI / 'fifo-recording' プロファイル /
   *                            startMeasurement()・stopMeasurement()（drain待ち込み）/
   *                            insoleToolkitMeasurementToCSV()
   * 判定ロジック（serial連続性・欠損range・timeline集約・30秒バッファ判定・
   * 複数デバイスの判定合成）は ./continuity.js に純関数として切り出し、Node で単体テストしている。
   *
   * 2台同時収録はホスト側の Bluetooth 負荷が上がり、片側だけ欠損することがある。
   * デバイスごとに独立して集計・表示し、全体判定は最も悪い側に合わせる。
   */

  const C = root.FifoGuideContinuity;
  const I18n = root.FifoGuideI18n;

  if (!C) throw new Error("fifo-guide: continuity.js must be loaded before app.js");
  if (!I18n) throw new Error("fifo-guide: i18n.js must be loaded before app.js");

  const DEVICE_IDS = [0, 1];
  const MAX_LOG_ENTRIES = 400;
  const LIVE_HISTORY_SIZE = 600;   // デバイスごとの固定長リングバッファ
  const MAX_SAMPLES = 120000;      // 600 s 相当。超えたら結果に truncated 注意を出す
  const TIMELINE_BINS = C.DEFAULT_BIN_COUNT;
  const BAR_FULL_SCALE_MS = 60000; // バッファガイドバーの右端
  const PRESSURE_FULL_SCALE = 20000;
  const DEVICE_COLORS = ["#7fa4ff", "#f6c860"];

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
    { key: "m_span", note: "m_span_note" },
    { key: "m_dropped", note: "m_dropped_note" },
    { key: "m_drain_recovered", note: "m_drain_note" },
    { key: "m_drain_ms", note: "m_drain_ms_note" },
    { key: "m_max_lag", note: "m_max_lag_note" },
    { key: "m_csv", note: "m_csv_note" }
  ];

  const dom = {};
  const logEntries = [];

  function createDeviceState(id) {
    return {
      id,
      session: null,
      connected: false,
      side: null,             // 'left' | 'right' | null（mount_position 未取得）
      inRun: false,           // 現在の収録に参加しているか
      drainStartedAt: 0,
      drainMs: null,
      drainRecovered: 0,
      maxLag: 0,
      lag: 0,
      droppedLive: 0,         // onDataLoss(info.cumulative) の最新値
      droppedTotal: null,     // onStopped(info.dropped) = この収録の回復不能ロス累計
      batchCount: 0,
      lastBatchAt: 0,
      lastBatchGapMs: null,
      lastBatchSize: 0,
      latestSample: null,
      live: { pressure: new Float32Array(LIVE_HISTORY_SIZE), count: 0, head: 0 },
      result: null,
      analysis: null,
      verdict: null,
      coverage: null,
      dropped: 0,
      cautions: [],
      csv: ""
    };
  }

  const state = {
    phase: "idle",           // idle | ready | preparing | recording | draining | done
    recording: false,
    plannedMs: 30000,
    startedAt: 0,
    stopTimer: null,
    tickTimer: null,
    devices: DEVICE_IDS.map(createDeviceState),
    runDeviceIds: [],        // 直近の収録に参加したデバイス
    overallVerdict: null,
    lastUpdateAt: null,
    sourceCopy: null,
    renderQueued: false
  };

  const t = (key, params) => I18n.t(key, params);
  const device = (id) => state.devices[id];
  const connectedIds = () => DEVICE_IDS.filter((id) => device(id).connected);
  const shownIds = () => (state.runDeviceIds.length > 0 ? state.runDeviceIds : connectedIds());

  // ── 起動 ────────────────────────────────────────────────────────────
  root.document.addEventListener("DOMContentLoaded", () => {
    cacheDom();
    buildMetricTable();
    buildLiveMeta();
    wireControls();
    renderEnvLine();
    for (const id of DEVICE_IDS) installDevice(id);
    setPhase("idle");
    for (const id of DEVICE_IDS) drawTimeline(id, []);
    renderLive();
    log("info", "logPageReady");

    // 言語切替時は、動的に組み立てた文字列も作り直す
    root.addEventListener("fifo-guide:languagechange", () => {
      buildMetricTable();
      buildLiveMeta();
      refreshDeviceNames();
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
      "toolkit0", "toolkit1", "source-badge", "source-title", "source-detail",
      "duration-select", "duration-custom", "record-button", "csv-button", "json-button",
      "elapsed-text", "buffer-guide-text", "buffer-bar-cursor", "buffer-bar-mark",
      "live-canvas", "live-rate", "live-meta", "latest-sample",
      "result-card", "result-verdict", "result-summary", "result-cautions",
      "metric-table-body", "metric-head-0", "metric-head-1", "last-update-time",
      "event-log", "env-line", "copy-log-button", "clear-log-button"
    ];
    for (const id of ids) dom[camel(id)] = root.document.getElementById(id);
    // デバイス別要素
    dom.deviceCards = DEVICE_IDS.map((id) => root.document.querySelector(`.device-card[data-device="${id}"]`));
    dom.timelineCanvas = DEVICE_IDS.map((id) => root.document.getElementById(`timeline-canvas-${id}`));
    dom.timelineCaption = DEVICE_IDS.map((id) => root.document.getElementById(`timeline-caption-${id}`));
    dom.continuityRate = DEVICE_IDS.map((id) => root.document.getElementById(`continuity-rate-${id}`));
    dom.missingRanges = DEVICE_IDS.map((id) => root.document.getElementById(`missing-ranges-${id}`));
    dom.missingRangesWrap = DEVICE_IDS.map((id) => root.document.getElementById(`missing-ranges-wrap-${id}`));
    dom.continuityName = DEVICE_IDS.map((id) => root.document.getElementById(`continuity-name-${id}`));
    dom.liveName = DEVICE_IDS.map((id) => root.document.getElementById(`live-name-${id}`));
    dom.metricHead = [dom.metricHead0, dom.metricHead1];
  }

  function camel(id) {
    return id.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase());
  }

  /** デバイス表示名。mount_position が取れていれば L / R も添える */
  function deviceLabel(id) {
    const side = device(id).side;
    if (!side) return t("deviceLabel", { n: id + 1 });
    return t("deviceLabelWithSide", {
      n: id + 1,
      side: t(side === "right" ? "sideRight" : "sideLeft")
    });
  }

  function refreshDeviceNames() {
    for (const id of DEVICE_IDS) {
      const label = deviceLabel(id);
      if (dom.continuityName[id]) dom.continuityName[id].textContent = label;
      if (dom.liveName[id]) dom.liveName[id].textContent = label;
      if (dom.metricHead[id]) dom.metricHead[id].textContent = label;
    }
  }

  /** 表示するデバイス列・カードを、収録に参加した（または接続済みの）デバイスに合わせる */
  function syncDeviceVisibility() {
    const visible = shownIds();
    for (const id of DEVICE_IDS) {
      const show = visible.includes(id) || id === 0;
      if (dom.deviceCards[id]) dom.deviceCards[id].hidden = !show;
      if (dom.metricHead[id]) dom.metricHead[id].hidden = !show;
      root.document.querySelectorAll(`#metric-table-body td[data-device="${id}"]`)
        .forEach((cell) => { cell.hidden = !show; });
    }
    refreshDeviceNames();
  }

  /** 結果テーブルを i18n ラベルで組み立てる（言語切替時は値を保ったまま作り直す） */
  function buildMetricTable() {
    const body = dom.metricTableBody;
    if (!body) return;
    const previous = new Map();
    body.querySelectorAll("tr").forEach((row) => {
      previous.set(row.dataset.metric, {
        values: DEVICE_IDS.map((id) => {
          const cell = row.querySelector(`td[data-device="${id}"]`);
          return cell ? { text: cell.textContent, level: cell.className } : null;
        })
      });
    });
    body.innerHTML = "";
    for (const metric of METRIC_ROWS) {
      const row = root.document.createElement("tr");
      row.dataset.metric = metric.key;
      const label = root.document.createElement("th");
      label.scope = "row";
      label.textContent = t(metric.key);
      row.appendChild(label);
      for (const id of DEVICE_IDS) {
        const cell = root.document.createElement("td");
        cell.dataset.device = String(id);
        const restored = previous.get(metric.key);
        const saved = restored ? restored.values[id] : null;
        cell.className = saved ? saved.level : "metric-value";
        cell.textContent = saved ? saved.text : t("valueEmpty");
        row.appendChild(cell);
      }
      const note = root.document.createElement("td");
      note.className = "metric-note";
      note.textContent = t(metric.note);
      row.appendChild(note);
      body.appendChild(row);
    }
    syncDeviceVisibility();
  }

  function buildLiveMeta() {
    const container = dom.liveMeta;
    if (!container) return;
    container.innerHTML = "";
    for (const id of DEVICE_IDS) {
      const cell = root.document.createElement("span");
      cell.dataset.device = String(id);
      cell.innerHTML = `<i class="live-meta-name"></i><strong></strong>`;
      container.appendChild(cell);
    }
    renderLiveMeta();
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
      for (const id of DEVICE_IDS) {
        const analysis = device(id).analysis;
        drawTimeline(id, analysis ? C.buildTimelineBins(analysis, TIMELINE_BINS) : []);
      }
      drawLive();
    });
    updateBufferGuide(0);
  }

  function installDevice(id) {
    if (typeof root.buildInsoleToolkit !== "function" || !Array.isArray(root.insoles)) {
      setSourceCopy("error", "toolkitLoadErrorTitle", "toolkitLoadErrorDetail");
      return;
    }
    root.buildInsoleToolkit(dom[`toolkit${id}`], `INSOLE 0${id + 1}`, id, {
      // 接続時は Realtime。収録開始時に 'fifo-recording' へ切り替え、停止後に戻す。
      profile: "realtime-full",
      autoReconnect: true,
      reconnectIntervalMs: 2000,
      onStateChange(snapshot) { handleSessionState(id, snapshot); },
      onError(error) { handleSessionError(id, error); },
      fifo: {
        startupDelayMs: 1000,
        drainTimeoutMs: 5000,
        onSamples(deviceId, samples) { handleFifoSamples(deviceId, samples); },
        onProgress(info) { handleFifoProgress(id, info); },
        onDataLoss(info) { handleFifoDataLoss(id, info); },
        onStopped(info) { handleFifoStopped(id, info); },
        onAnomaly(info) { handleFifoAnomaly(id, info); },
        onError(error) { handleSessionError(id, error); }
      }
    });
    device(id).session = root.getInsoleToolkitSession(id);
    // buildInsoleToolkit() は setup() を呼ばない（simulator 指定時のみ内部で呼ぶ）。
    // 未呼び出しだと hashUUID が空のままで、接続時に serviceUUID 参照で失敗する。
    root.insoles[id].setup();
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

  // ── 収録（接続中の全デバイスを同時に開始・停止する） ──────────────────
  async function startRecording() {
    const ids = connectedIds();
    if (ids.length === 0) {
      log("warn", "logNotConnected");
      return;
    }
    state.plannedMs = selectedDurationMs();
    resetRunState(ids);
    setPhase("preparing");
    log("info", ids.length > 1 ? "logPreparingDual" : "logPreparing", {
      seconds: state.plannedMs / 1000,
      count: ids.length
    });

    const started = await Promise.allSettled(ids.map((id) => device(id).session.startMeasurement({
      profile: "fifo-recording",
      restoreProfile: true,
      maxSamples: MAX_SAMPLES,
      metadata: {
        page: "fifo-guide",
        plannedDurationMs: state.plannedMs,
        deviceCount: ids.length,
        platform: root.navigator.platform
      }
    })));

    const failed = [];
    started.forEach((outcome, index) => {
      const id = ids[index];
      if (outcome.status === "fulfilled") {
        device(id).inRun = true;
      } else {
        failed.push(id);
        log("error", "logStartFailedDevice", {
          device: deviceLabel(id),
          message: describeError(outcome.reason)
        });
      }
    });
    const active = ids.filter((id) => device(id).inRun);
    if (active.length === 0) {
      state.runDeviceIds = [];
      setPhase(connectedIds().length > 0 ? "ready" : "idle");
      return;
    }
    if (failed.length > 0) {
      // 一部だけ開始できたときは、開始できたデバイスだけで続行する
      state.runDeviceIds = active;
      syncDeviceVisibility();
    }

    state.recording = true;
    state.startedAt = Date.now();
    setPhase("recording");
    log("success", "logStarted", { count: active.length });
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
    const ids = state.runDeviceIds.slice();
    const stoppedAt = Date.now();
    for (const id of ids) device(id).drainStartedAt = stoppedAt;
    setPhase("draining");
    log("info", reason === "duration" ? "logStoppedByDuration" : "logStoppedManually");

    const results = await Promise.allSettled(
      ids.map((id) => device(id).session.stopMeasurement({ reason }))
    );

    let finalized = 0;
    results.forEach((outcome, index) => {
      const id = ids[index];
      const entry = device(id);
      if (entry.drainMs === null) entry.drainMs = Date.now() - entry.drainStartedAt;
      let result = outcome.value || null;
      if (outcome.status === "rejected") {
        log("error", "logStopFailedDevice", {
          device: deviceLabel(id),
          message: describeError(outcome.reason)
        });
        // Toolkit はプロファイル復元に失敗しても直近の計測結果を保持する
        result = entry.session.lastMeasurement || null;
      }
      if (!result) {
        log("error", "logNoResultDevice", { device: deviceLabel(id) });
        return;
      }
      finalizeDeviceResult(id, result);
      finalized += 1;
    });

    if (finalized === 0) {
      setPhase(connectedIds().length > 0 ? "ready" : "idle");
      return;
    }
    finalizeRun();
    setPhase("done");
  }

  function clearTimers() {
    if (state.stopTimer) { root.clearTimeout(state.stopTimer); state.stopTimer = null; }
    if (state.tickTimer) { root.clearInterval(state.tickTimer); state.tickTimer = null; }
  }

  function resetRunState(ids) {
    state.runDeviceIds = ids.slice();
    state.overallVerdict = null;
    for (const id of DEVICE_IDS) {
      const entry = device(id);
      const wasSession = entry.session;
      const connected = entry.connected;
      const side = entry.side;
      Object.assign(entry, createDeviceState(id), { session: wasSession, connected, side });
      entry.inRun = false;
    }
    dom.elapsedText.textContent = "0.0 s";
    dom.csvButton.disabled = true;
    dom.jsonButton.disabled = true;
    resetMetricTable();
    syncDeviceVisibility();
    renderResult();
    for (const id of DEVICE_IDS) drawTimeline(id, []);
    renderLive();
  }

  function resetMetricTable() {
    dom.metricTableBody.querySelectorAll("td[data-device]").forEach((cell) => {
      cell.className = "metric-value";
      cell.textContent = t("valueEmpty");
    });
    for (const id of DEVICE_IDS) {
      dom.continuityRate[id].textContent = "missing 0 / expected 0";
      dom.timelineCaption[id].textContent = t("continuityEmpty");
      dom.missingRanges[id].textContent = t("missingRangesNone");
      dom.missingRangesWrap[id].className = "missing-ranges clean";
    }
  }

  // ── FIFO コールバック（デバイスごと） ─────────────────────────────────
  function handleFifoSamples(id, samples) {
    if (!Array.isArray(samples) || samples.length === 0) return;
    const entry = device(id);
    const now = root.performance.now();
    entry.batchCount += 1;
    entry.lastBatchSize = samples.length;
    if (entry.lastBatchAt > 0) entry.lastBatchGapMs = now - entry.lastBatchAt;
    entry.lastBatchAt = now;
    entry.latestSample = samples[samples.length - 1];
    state.lastUpdateAt = new Date();

    for (const sample of samples) {
      const press = sample && sample.press && Array.isArray(sample.press.values)
        ? sample.press.values.reduce((sum, value) => sum + (Number(value) || 0), 0)
        : 0;
      entry.live.pressure[entry.live.head] = press;
      entry.live.head = (entry.live.head + 1) % LIVE_HISTORY_SIZE;
      if (entry.live.count < LIVE_HISTORY_SIZE) entry.live.count += 1;
    }
    queueLiveRender();
  }

  function handleFifoProgress(id, info) {
    const entry = device(id);
    const lag = Number(info && info.lag) || 0;
    entry.lag = lag;
    if (lag > entry.maxLag) entry.maxLag = lag;
    if (info && info.draining) {
      setSourceCopy("draining", "sourceDrainingTitle", "sourceDrainingProgress", {
        detailParams: { collected: info.collected, lag }
      });
    }
    queueLiveRender();
  }

  function handleFifoDataLoss(id, info) {
    const entry = device(id);
    entry.droppedLive = Number(info && info.cumulative) || entry.droppedLive;
    log("error", "logDataLossDevice", {
      device: deviceLabel(id),
      dropped: info.dropped,
      cumulative: info.cumulative,
      reason: info.reason
    });
  }

  function handleFifoStopped(id, info) {
    const entry = device(id);
    entry.drainRecovered = Number(info && info.drainRecovered) || 0;
    entry.droppedTotal = Number(info && info.dropped) || 0;
    if (entry.drainStartedAt > 0 && entry.drainMs === null) {
      entry.drainMs = Date.now() - entry.drainStartedAt;
    }
    log("info", "logFifoStoppedDevice", {
      device: deviceLabel(id),
      collected: info.collected,
      dropped: info.dropped,
      recovered: entry.drainRecovered
    });
  }

  function handleFifoAnomaly(id, info) {
    // 到着待ちの再要求は正常動作。記録はするが警告扱いにはしない。
    log("info", "logReRequestDevice", {
      device: deviceLabel(id),
      expected: info.expected,
      received: info.received,
      noData: info.noData
    });
  }

  /**
   * 接続状態の遷移は Toolkit の onStateChange 経由で拾う。
   * insole.on* を上書きしないので、Toolkit のヘッダ表示や自動再接続と競合しない。
   */
  function handleSessionState(id, snapshot) {
    const entry = device(id);
    const wasConnected = entry.connected;
    entry.connected = !!snapshot.connected;
    if (snapshot.measurementPhase === "draining" && entry.drainStartedAt === 0) {
      entry.drainStartedAt = Date.now();
    }
    if (entry.connected && !wasConnected) {
      entry.side = C.sideFromMountPosition(mountPositionOf(id));
      log("success", "logConnectedDevice", { device: deviceLabel(id) });
      syncDeviceVisibility();
      if (state.phase === "idle" || state.phase === "ready") setPhase("ready");
    }
    if (!entry.connected && wasConnected) {
      if (state.recording && entry.inRun) {
        log("error", "logDisconnectedWhileRecording", { device: deviceLabel(id) });
        // 計測ウィンドウを閉じておく。閉じないと activeMeasurement が残り、
        // 再接続後に MEASUREMENT_ACTIVE で次の収録を開始できなくなる。
        Promise.resolve(entry.session.stopMeasurement({ reason: "disconnect" }))
          .catch((error) => log("warn", "logStopAfterDisconnect", { message: describeError(error) }));
        entry.inRun = false;
        state.runDeviceIds = state.runDeviceIds.filter((other) => other !== id);
        if (state.runDeviceIds.length === 0) {
          state.recording = false;
          clearTimers();
        }
      }
      log("warn", "logDisconnectedDevice", { device: deviceLabel(id) });
      setPhase(connectedIds().length > 0 ? "ready" : "disconnected");
      return;
    }
    applyButtonState();
  }

  function mountPositionOf(id) {
    const insole = Array.isArray(root.insoles) ? root.insoles[id] : null;
    return insole && insole.device_information ? insole.device_information.mount_position : null;
  }

  function handleSessionError(id, error) {
    if (isUserCancel(error)) {
      log("info", "logChooserCancelled");
      return;
    }
    log("error", "logErrorDevice", { device: deviceLabel(id), message: describeError(error) });
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
  function finalizeDeviceResult(id, result) {
    const entry = device(id);
    const samples = Array.isArray(result.raw && result.raw.samples) ? result.raw.samples : [];
    const analysis = C.analyzeSerials(samples.map((sample) => sample.serial_number));
    // dropped は「収録中に回復不能と判定された累計」。onStopped(info.dropped) が正。
    // result.fifo.dropped は checkpoint 区間の再集計値なので定義が異なる。
    const dropped = entry.droppedTotal !== null
      ? entry.droppedTotal
      : Math.max(0, Number(result.fifo && result.fifo.dropped) || 0);
    const verdict = C.evaluateRecording({
      analysis,
      missing: analysis.missing,
      dropped,
      durationMs: result.durationMs,
      maxLag: entry.maxLag
    });
    // CSVが実際に覆う時間。停止時点で未要求だった分は収録スパンに入らない（missing ではない）
    const coverage = C.spanCoverage(analysis.expected, state.plannedMs);

    entry.result = result;
    entry.analysis = analysis;
    entry.verdict = verdict;
    entry.coverage = coverage;
    entry.dropped = dropped;
    entry.csv = samples.length > 0 ? root.insoleToolkitMeasurementToCSV(result, "raw") : "";

    entry.cautions = verdict.cautions.map((text) => ({ raw: text }));
    if (result.raw.truncated) {
      entry.cautions.push({ key: "cautionTruncated", params: { max: MAX_SAMPLES } });
    }
    if (coverage.level !== "ok") {
      entry.cautions.push({
        key: "cautionShortSpan",
        params: {
          spanSeconds: (coverage.spanMs / 1000).toFixed(1),
          plannedSeconds: (coverage.plannedMs / 1000).toFixed(0),
          percent: Math.round(coverage.ratio * 100),
          shortfallSerials: coverage.shortfallSerials
        }
      });
    }
    if (dropped !== analysis.missing) {
      entry.cautions.push({
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
    if (entry.csv) {
      const fromCsv = C.analyzeSerials(C.extractSerialsFromCsv(entry.csv));
      const matched = fromCsv.missing === analysis.missing && fromCsv.expected === analysis.expected;
      log(matched ? "success" : "error", "logCsvCrossCheckDevice", {
        device: deviceLabel(id),
        expected: fromCsv.expected,
        received: fromCsv.received,
        missing: fromCsv.missing,
        verdict: t(matched ? "logCsvMatched" : "logCsvMismatched")
      });
    }

    log(verdict.level === "fail" ? "error" : verdict.level === "caution" ? "warn" : "success",
      "logResultDevice", {
        device: deviceLabel(id),
        label: verdict.label,
        seconds: (result.durationMs / 1000).toFixed(1),
        samples: samples.length,
        received: analysis.received,
        expected: analysis.expected,
        missing: analysis.missing,
        dropped,
        recovered: entry.drainRecovered,
        drainMs: entry.drainMs,
        maxLag: entry.maxLag
      });
  }

  function finalizeRun() {
    const ids = state.runDeviceIds.filter((id) => device(id).verdict);
    state.overallVerdict = C.combineVerdicts(ids.map((id) => device(id).verdict));
    state.lastUpdateAt = new Date();

    // 2台同時は片側だけ欠損することがある。1台の基準と比べるよう促す。
    if (ids.length > 1) {
      const sides = ids.map((id) => device(id).side);
      if (sides[0] && sides[0] === sides[1]) {
        device(ids[0]).cautions.push({
          key: "cautionSameSide",
          params: { side: t(sides[0] === "right" ? "sideRight" : "sideLeft") }
        });
      }
    }

    renderResult();
    const exportable = ids.some((id) => device(id).csv);
    dom.csvButton.disabled = !exportable;
    dom.jsonButton.disabled = false;

    log(state.overallVerdict.level === "fail" ? "error"
      : state.overallVerdict.level === "caution" ? "warn" : "success",
      "logResultOverall", {
        label: state.overallVerdict.label,
        count: ids.length,
        seconds: (state.plannedMs / 1000).toFixed(0)
      });
  }

  function renderResult() {
    const overall = state.overallVerdict;
    const ids = state.runDeviceIds.filter((id) => device(id).verdict);

    if (!overall || ids.length === 0) {
      dom.resultCard.className = "verdict-bar result-empty";
      dom.resultVerdict.className = "verdict-badge";
      dom.resultVerdict.textContent = t("verdictWaiting");
      dom.resultSummary.textContent = t("resultSummaryWaiting");
      dom.resultCautions.innerHTML = "";
      dom.lastUpdateTime.textContent = "—";
      return;
    }

    const level = overall.level;
    dom.resultCard.className = `verdict-bar result-${level === "caution" ? "caution" : level}`;
    dom.resultVerdict.className = `verdict-badge verdict-${level}`;
    dom.resultVerdict.textContent = t(
      level === "fail" ? "verdictFail" : level === "caution" ? "verdictWarn" : "verdictPass"
    );
    dom.resultSummary.textContent = ids.length > 1
      ? `${t(level === "fail" ? "resultSummaryFail"
        : level === "caution" ? "resultSummaryWarn" : "resultSummaryPass")} `
        + ids.map((id) => `${deviceLabel(id)}: ${device(id).verdict.label}`).join(" / ")
      : t(level === "fail" ? "resultSummaryFail"
        : level === "caution" ? "resultSummaryWarn" : "resultSummaryPass");

    for (const id of DEVICE_IDS) renderDeviceMetrics(id);

    const cautions = [];
    for (const id of ids) {
      for (const entry of device(id).cautions) {
        const text = entry.raw !== undefined ? entry.raw : t(entry.key, entry.params);
        cautions.push(ids.length > 1 ? `${deviceLabel(id)}: ${text}` : text);
      }
    }
    if (ids.length > 1) cautions.push(t("cautionDualLoad"));
    dom.resultCautions.innerHTML = cautions.length === 0 ? "" : [
      '<div class="caution-box">',
      `<strong>${escapeHtml(t("cautionsTitle"))}</strong><ul>`,
      ...cautions.map((text) => `<li>${escapeHtml(text)}</li>`),
      "</ul></div>"
    ].join("");

    dom.lastUpdateTime.textContent = state.lastUpdateAt
      ? state.lastUpdateAt.toLocaleTimeString()
      : "—";
  }

  function renderDeviceMetrics(id) {
    const entry = device(id);
    const inRun = state.runDeviceIds.includes(id);
    if (!inRun || !entry.result || !entry.analysis || !entry.verdict) {
      if (!inRun) {
        for (const metric of METRIC_ROWS) setMetric(id, metric.key, t("deviceNotUsed"), null);
      }
      drawTimeline(id, []);
      return;
    }
    const result = entry.result;
    const analysis = entry.analysis;
    const verdict = entry.verdict;
    const coverage = entry.coverage || C.spanCoverage(analysis.expected, state.plannedMs);
    const samples = Array.isArray(result.raw.samples) ? result.raw.samples.length : 0;

    setMetric(id, "m_duration", `${(result.durationMs / 1000).toFixed(1)} s`,
      verdict.buffer.withinWindow ? "ok" : "warn");
    setMetric(id, "m_samples", String(samples), samples > 0 ? "ok" : "bad");
    setMetric(id, "m_first", analysis.first === null ? t("valueEmpty") : String(analysis.first));
    setMetric(id, "m_last", analysis.last === null ? t("valueEmpty") : String(analysis.last));
    setMetric(id, "m_expected", String(analysis.expected));
    setMetric(id, "m_received", String(analysis.received));
    setMetric(id, "m_missing", String(analysis.missing), analysis.missing === 0 ? "ok" : "bad");
    setMetric(id, "m_missing_rate", `${(analysis.missingRate * 100).toFixed(3)} %`,
      analysis.missing === 0 ? "ok" : "bad");
    setMetric(id, "m_span",
      `${(coverage.spanMs / 1000).toFixed(1)} s (${Math.round(coverage.ratio * 100)} %)`,
      coverage.level);
    setMetric(id, "m_dropped", String(entry.dropped), entry.dropped === 0 ? "ok" : "bad");
    setMetric(id, "m_drain_recovered", String(entry.drainRecovered));
    setMetric(id, "m_drain_ms", entry.drainMs === null ? t("valueEmpty") : `${entry.drainMs} ms`);
    setMetric(id, "m_max_lag", `${entry.maxLag} / ${C.RING_BUFFER_CAPACITY}`,
      verdict.buffer.lagRatio >= C.LAG_CAUTION_RATIO ? "warn" : "ok");
    setMetric(id, "m_csv", samples > 0 ? t("csvAvailable") : t("csvUnavailable"),
      samples > 0 ? "ok" : "bad");

    const bins = C.buildTimelineBins(analysis, TIMELINE_BINS);
    drawTimeline(id, bins);
    dom.continuityRate[id].textContent = `missing ${analysis.missing} / expected ${analysis.expected}`;
    dom.timelineCaption[id].textContent = analysis.expected === 0
      ? t("continuityEmpty")
      : t("continuityCaption", {
        first: analysis.first,
        last: analysis.last,
        bins: bins.length,
        perBin: Math.max(1, Math.round(analysis.expected / Math.max(1, bins.length)))
      });
    if (analysis.missingRanges.length > 0) {
      dom.missingRangesWrap[id].className = "missing-ranges";
      dom.missingRanges[id].textContent = C.formatMissingRanges(analysis.missingRanges, 30);
    } else {
      dom.missingRangesWrap[id].className = "missing-ranges clean";
      dom.missingRanges[id].textContent = t("missingRangesNone");
    }
  }

  function setMetric(id, key, value, level) {
    const cell = dom.metricTableBody.querySelector(`tr[data-metric="${key}"] td[data-device="${id}"]`);
    if (!cell) return;
    cell.textContent = value;
    cell.className = level ? `metric-value level-${level}` : "metric-value";
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
    renderLiveMeta();
    const plotted = DEVICE_IDS.reduce((sum, id) => sum + device(id).live.count, 0);
    dom.liveRate.textContent = plotted > 0 ? `${plotted} samples plotted` : "";

    const lines = [];
    for (const id of shownIds()) {
      const sample = device(id).latestSample;
      if (!sample) continue;
      lines.push(
        `${deviceLabel(id)}`,
        `  serial_number : ${sample.serial_number}  (packet_number ${sample.packet_number})`,
        `  t             : ${sample.t} ms`,
        `  gyro   [dps]  : ${formatVector(sample.converted_gyro)}`,
        `  acc    [G]    : ${formatVector(sample.converted_acc)}`,
        `  press  [ADC]  : ${sample.press && sample.press.values ? sample.press.values.join(", ") : "—"}`
      );
    }
    if (lines.length > 0) lines.push(t("latestSampleQuatNote"));
    dom.latestSample.textContent = lines.length > 0 ? lines.join("\n") : t("latestSampleEmpty");
    drawLive();
  }

  function renderLiveMeta() {
    const container = dom.liveMeta;
    if (!container) return;
    const visible = shownIds();
    container.querySelectorAll("span[data-device]").forEach((cell) => {
      const id = Number(cell.dataset.device);
      const entry = device(id);
      const show = visible.includes(id) || id === 0;
      cell.hidden = !show;
      cell.querySelector(".live-meta-name").textContent = deviceLabel(id);
      const lag = state.recording || state.phase === "draining"
        ? `${entry.lag} / ${C.RING_BUFFER_CAPACITY}`
        : "—";
      const gap = entry.lastBatchGapMs === null ? "—" : `${Math.round(entry.lastBatchGapMs)} ms`;
      const strong = cell.querySelector("strong");
      strong.textContent = [
        `${t("liveBatches")} ${entry.batchCount}`,
        `${t("liveBatchSize")} ${entry.lastBatchSize > 0 ? entry.lastBatchSize : "—"}`,
        `${t("liveBatchGap")} ${gap}`,
        `${t("liveLag")} ${lag}`
      ].join(" · ");
      strong.className = entry.lag >= C.RING_BUFFER_CAPACITY * C.LAG_CAUTION_RATIO ? "alert" : "";
    });
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
  function drawTimeline(id, bins) {
    const canvas = dom.timelineCanvas[id];
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
    const total = DEVICE_IDS.reduce((sum, id) => sum + device(id).live.count, 0);
    if (total === 0) {
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
    for (const id of DEVICE_IDS) {
      drawSeries(ctx, width, height, device(id).live, PRESSURE_FULL_SCALE, DEVICE_COLORS[id]);
    }
  }

  function drawSeries(ctx, width, height, live, fullScale, color) {
    if (live.count === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < live.count; i += 1) {
      const index = (live.head - live.count + i + LIVE_HISTORY_SIZE * 2) % LIVE_HISTORY_SIZE;
      const value = Math.min(1, Math.max(0, live.pressure[index] / fullScale));
      const x = (i / Math.max(1, live.count - 1)) * width;
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
    const count = connectedIds().length;
    if (phase === "ready" && count > 1) {
      setSourceCopy("ready", "sourceReadyDualTitle", "sourceReadyDualDetail", {
        titleParams: { count }
      });
    } else {
      setSourceCopy(entry[0], entry[1], entry[2]);
    }
    dom.recordButton.innerHTML = t(phase === "recording" ? "recordStopHtml" : "recordStartHtml");
    dom.recordButton.classList.toggle("active", phase === "recording");
    applyButtonState();
  }

  /** 収録開始/停止ボタンと計測時間入力の有効・無効は phase から一元的に決める */
  function applyButtonState() {
    const phase = state.phase;
    dom.recordButton.disabled = phase === "recording"
      ? false
      : phase === "preparing" || phase === "draining" || connectedIds().length === 0;
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
      `deviceCount=${state.runDeviceIds.length || connectedIds().length}`,
      `devices=${(state.runDeviceIds.length ? state.runDeviceIds : connectedIds())
        .map((id) => `${id}:${device(id).side || "unknown"}`).join(",") || "none"}`,
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

  /**
   * 2台ぶんを1つのCSVにまとめる。insoleToolkitMeasurementToCSV() が先頭列に
   * device_id を出すため、ヘッダ1行 + 各デバイスの行で1ファイルにできる。
   */
  function combinedCsv() {
    const parts = state.runDeviceIds.map((id) => device(id).csv).filter(Boolean);
    if (parts.length === 0) return "";
    const header = parts[0].split("\n")[0];
    const rows = parts.flatMap((csv) => csv.split("\n").slice(1)).filter((line) => line.length > 0);
    return [header, ...rows].join("\n");
  }

  function downloadCsv() {
    const csv = combinedCsv();
    if (!csv) return;
    saveBlob(csv, "text/csv", `orphe-insole-fifo-guide-${timestampSuffix()}.csv`);
    log("success", "logCsvSaved");
  }

  function downloadJson() {
    const payload = {
      page: "fifo-guide",
      savedAt: new Date().toISOString(),
      environment: environmentLines(),
      plannedDurationMs: state.plannedMs,
      deviceCount: state.runDeviceIds.length,
      overallVerdict: state.overallVerdict ? state.overallVerdict.label : null,
      devices: state.runDeviceIds.map((id) => {
        const entry = device(id);
        const analysis = entry.analysis;
        const result = entry.result;
        return {
          deviceId: id,
          label: deviceLabel(id),
          side: entry.side,
          verdict: entry.verdict ? entry.verdict.label : null,
          durationMs: result ? result.durationMs : null,
          profileId: result ? result.profileId : null,
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
          spanCoverage: entry.coverage,
          fifo: {
            droppedTotal: entry.droppedTotal,
            droppedLiveCumulative: entry.droppedLive,
            checkpointDropped: result && result.fifo ? result.fifo.dropped : null,
            drainRecovered: entry.drainRecovered,
            drainMs: entry.drainMs,
            maxLag: entry.maxLag
          }
        };
      }),
      fifoLimits: {
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
