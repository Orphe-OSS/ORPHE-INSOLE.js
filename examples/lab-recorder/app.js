(function labRecorderApp(root) {
  "use strict";

  /**
   * Lab Recorder — 研究室が被験者・試行を替えながら回すための収録機。
   *
   * 狙いは「ロスレス」ではなく「同期」と「来歴」:
   *   - 同期イベントマーカー（MARK / Space）: ホスト時刻・経過・直近 serial・ラベル
   *   - 踏み込みインパルスの自動検出（候補提示のみ。確定は人間）
   *   - 試行メタデータ（participant / trial / condition / surface / footwear / notes）
   *   - CSV の来歴列（firmware_version / sdk_version / device_time / host_time_est / ...）
   *   - データ辞書・欠損レポート・試行の連続実行・左右アライメント表示
   *
   * FIFO のセッション処理（読み取りモード切替・serial 指定の再要求・drain）は
   *   src/InsoleFifo.js / src/InsoleToolkit.js（startMeasurement / stopMeasurement）
   * に任せ、このファイルは呼ぶだけ。時刻付け・突き合わせ・書き出しは ./recorder-core.js（純関数）。
   *
   * やらないこと: 歩容指標・スコア・判定、クラウド送信、未検証の導出値（フットクリアランス等）。
   */

  const Core = root.LabRecorderCore;
  const I18n = root.LabRecorderI18n;
  if (!Core) throw new Error("lab-recorder: recorder-core.js must be loaded before app.js");
  if (!I18n) throw new Error("lab-recorder: i18n.js must be loaded before app.js");

  const DEVICE_IDS = [0, 1];
  const DEVICE_COLORS = ["#7fa4ff", "#f6c860"];
  const MAX_SAMPLES = 150000;          // Toolkit の計測バッファ上限（約 12 分 / 台）
  const MAX_LOG_ENTRIES = 500;
  const STORAGE_KEY = "orphe-lab-recorder:v1";
  const DOWNLOAD_STAGGER_MS = 350;
  const WEAK_IMPULSE_RATIO = 2;        // ピーク / 中央値 がこれ未満なら「弱い候補」と注記（実測: 踏み込みなし 1.05×、あり 4.4〜6.3×）

  const METRIC_ROWS = [
    "m_duration", "m_samples", "m_first", "m_last", "m_expected", "m_received", "m_missing",
    "m_missing_rate", "m_ranges", "m_dropped", "m_max_lag", "m_recovered", "m_rate",
    "m_clock_offset", "m_clock_spread", "m_complete"
  ];

  const dom = {};
  const logEntries = [];

  function createLive() {
    return {
      firstSerial: null, latestSerial: null, firstDeviceTimeMs: null, latestDeviceTimeMs: null,
      samples: 0, batches: [], lag: 0, maxLag: 0, droppedLive: 0,
      droppedTotal: null, drainRecovered: 0, catchupRecovered: 0
    };
  }

  function createDeviceState(id) {
    return {
      id,
      session: null,
      connected: false,
      side: null,
      firmwareVersion: null,
      inRun: false,
      live: createLive(),
      result: null,
      report: null
    };
  }

  const state = {
    phase: "idle",              // idle | ready | preparing | recording | draining | review
    recording: false,
    startedHostMs: 0,
    stoppedHostMs: 0,
    tickTimer: null,
    devices: DEVICE_IDS.map(createDeviceState),
    runDeviceIds: [],
    markers: [],
    trial: null,                // review 中の試行（analyzeDevice 済み devices を含む）
    trials: [],                 // 保存済み試行の要約
    sdkVersion: null,
    sdkVersionDate: null,
    sourceCopy: null,
    renderQueued: false
  };

  const t = (key, params) => I18n.t(key, params);
  const device = (id) => state.devices[id];
  const connectedIds = () => DEVICE_IDS.filter((id) => device(id).connected);
  const shownIds = () => (state.runDeviceIds.length > 0 ? state.runDeviceIds : connectedIds());
  const tzOffsetMinutes = () => -new Date().getTimezoneOffset();
  const timeZoneName = () => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch (error) { void error; return null; }
  };

  // ── 起動 ────────────────────────────────────────────────────────────
  root.document.addEventListener("DOMContentLoaded", () => {
    cacheDom();
    restoreMetadata();
    buildMetricTable();
    buildLiveGrid();
    syncDeviceVisibility();   // live カード生成後に、未接続の 2 台目を隠す
    wireControls();
    wireKeyboard();
    for (const id of DEVICE_IDS) installDevice(id);
    setPhase("idle");
    renderMarkers();
    renderImpulse();
    renderTrials();
    renderLive();
    renderEnvLine();
    resolveSdkVersion();
    log("info", "logPageReady");

    root.addEventListener("lab-recorder:languagechange", () => {
      buildMetricTable();
      refreshDeviceNames();
      refreshSourceCopy();
      renderMarkers();
      renderImpulse();
      renderTrials();
      renderResult();
      renderLive();
      renderLog();
      renderEnvLine();
      dom.recordButton.innerHTML = t(state.recording ? "recordStopHtml" : "recordStartHtml");
    });
  });

  function cacheDom() {
    const ids = [
      "toolkit0", "toolkit1", "source-badge", "source-title", "source-detail",
      "elapsed-text", "record-button", "save-next-button", "discard-button",
      "metadata-form", "impulse-window",
      "trials-body", "trials-empty", "session-csv-button", "session-json-button", "dictionary-button", "clear-session-button",
      "marker-button", "marker-label", "marker-body", "marker-empty",
      "live-grid", "alignment-canvas", "alignment-text",
      "impulse-cards", "impulse-empty",
      "result-card", "result-verdict", "result-summary", "metric-table-body", "metric-head-0", "metric-head-1",
      "csv-button", "markers-csv-button", "trial-json-button", "loss-json-button",
      "event-log", "env-line", "copy-log-button", "clear-log-button"
    ];
    for (const id of ids) dom[camel(id)] = root.document.getElementById(id);
    dom.metricHead = [dom.metricHead0, dom.metricHead1];
    dom.metaInputs = {};
    for (const field of Core.METADATA_FIELDS) dom.metaInputs[field] = root.document.getElementById(`meta-${field}`);
  }

  function camel(id) {
    return id.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase());
  }

  // ── メタデータ（localStorage） ───────────────────────────────────────
  function readMetadataForm() {
    const raw = {};
    for (const field of Core.METADATA_FIELDS) raw[field] = dom.metaInputs[field] ? dom.metaInputs[field].value : "";
    return Core.normalizeMetadata(raw);
  }

  function impulseWindowMs() {
    return Core.clampImpulseWindowMs(Number(dom.impulseWindow.value) * 1000);
  }

  function persistMetadata() {
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        metadata: readMetadataForm(),
        impulseWindowSec: Math.round(impulseWindowMs() / 1000)
      }));
    } catch (error) { void error; }
  }

  function restoreMetadata() {
    let saved = null;
    try { saved = JSON.parse(root.localStorage.getItem(STORAGE_KEY) || "null"); } catch (error) { void error; }
    if (!saved) return;
    const metadata = Core.normalizeMetadata(saved.metadata);
    for (const field of Core.METADATA_FIELDS) {
      if (dom.metaInputs[field]) dom.metaInputs[field].value = metadata[field];
    }
    if (Number.isFinite(Number(saved.impulseWindowSec))) {
      dom.impulseWindow.value = String(Math.round(Core.clampImpulseWindowMs(Number(saved.impulseWindowSec) * 1000) / 1000));
    }
  }

  function setMetadataEnabled(enabled) {
    for (const field of Core.METADATA_FIELDS) {
      if (dom.metaInputs[field]) dom.metaInputs[field].disabled = !enabled;
    }
    dom.impulseWindow.disabled = !enabled;
  }

  // ── SDK version（package.json を同一オリジンから読む。読めなければ null） ─
  async function resolveSdkVersion() {
    state.sdkVersionDate = typeof root.orphe_js_version_date === "string"
      ? root.orphe_js_version_date.replace(/Last modified:\s*/i, "").trim()
      : null;
    try {
      const response = await root.fetch("../../package.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const pkg = await response.json();
      state.sdkVersion = typeof pkg.version === "string" ? pkg.version : null;
    } catch (error) {
      void error;
      state.sdkVersion = null;
    }
    if (state.sdkVersion) log("info", "logSdkVersion", { version: state.sdkVersion });
    else log("warn", "logSdkVersionUnknown");
    renderEnvLine();
  }

  // ── Toolkit ─────────────────────────────────────────────────────────
  function installDevice(id) {
    if (typeof root.buildInsoleToolkit !== "function" || !Array.isArray(root.insoles)) {
      setSourceCopy("error", "toolkitLoadErrorTitle", "toolkitLoadErrorDetail");
      return;
    }
    root.buildInsoleToolkit(dom[`toolkit${id}`], `INSOLE ${id + 1}`, id, {
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
        onError(error) { handleSessionError(id, error); }
      }
    });
    device(id).session = root.getInsoleToolkitSession(id);
    // buildInsoleToolkit() は setup() を呼ばない
    root.insoles[id].setup();
  }

  function deviceLabel(id) {
    const side = device(id).side;
    if (!side) return t("deviceLabel", { n: id + 1 });
    return t("deviceLabelWithSide", { n: id + 1, side: t(side === "right" ? "sideRight" : "sideLeft") });
  }

  function refreshDeviceNames() {
    for (const id of DEVICE_IDS) {
      if (dom.metricHead[id]) dom.metricHead[id].textContent = deviceLabel(id);
      const name = root.document.querySelector(`.live-device[data-device="${id}"] .live-name b`);
      if (name) name.textContent = deviceLabel(id);
    }
  }

  function syncDeviceVisibility() {
    const visible = shownIds();
    for (const id of DEVICE_IDS) {
      const show = visible.includes(id) || id === 0;
      if (dom.metricHead[id]) dom.metricHead[id].hidden = !show;
      root.document.querySelectorAll(`#metric-table-body td[data-device="${id}"]`).forEach((cell) => { cell.hidden = !show; });
      const card = root.document.querySelector(`.live-device[data-device="${id}"]`);
      if (card) card.hidden = !show;
    }
    refreshDeviceNames();
  }

  function sideFromMountPosition(mountPosition) {
    if (!Number.isInteger(mountPosition)) return null;
    return (mountPosition & 1) === 1 ? "right" : "left";
  }

  function mountPositionOf(id) {
    const insole = Array.isArray(root.insoles) ? root.insoles[id] : null;
    return insole && insole.device_information ? insole.device_information.mount_position : null;
  }

  async function resolveFirmware(id) {
    const insole = Array.isArray(root.insoles) ? root.insoles[id] : null;
    let version = null;
    try {
      if (insole && typeof insole.getFirmwareVersion === "function") version = await insole.getFirmwareVersion();
    } catch (error) { void error; }
    if (!version && insole && insole.lastStatus && insole.lastStatus.version) version = insole.lastStatus.version;
    device(id).firmwareVersion = version || null;
    if (version) log("info", "logFirmware", { device: deviceLabel(id), version });
    else log("warn", "logFirmwareUnknown", { device: deviceLabel(id) });
    renderLive();
  }

  function handleSessionState(id, snapshot) {
    const entry = device(id);
    const wasConnected = entry.connected;
    entry.connected = !!snapshot.connected;
    if (entry.connected && !wasConnected) {
      entry.side = sideFromMountPosition(mountPositionOf(id));
      log("success", "logConnectedDevice", { device: deviceLabel(id) });
      syncDeviceVisibility();
      resolveFirmware(id);
      if (state.phase === "idle" || state.phase === "ready") setPhase("ready");
    }
    if (!entry.connected && wasConnected) {
      if (state.recording && entry.inRun) {
        log("error", "logDisconnectedWhileRecording", { device: deviceLabel(id) });
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
      if (state.phase !== "review") setPhase(connectedIds().length > 0 ? "ready" : "disconnected");
      return;
    }
    applyButtonState();
  }

  function handleSessionError(id, error) {
    if (isUserCancel(error)) {
      log("info", "logChooserCancelled");
      return;
    }
    log("error", "logErrorDevice", { device: deviceLabel(id), message: describeError(error) });
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

  // ── FIFO コールバック ──────────────────────────────────────────────
  function handleFifoSamples(id, samples) {
    if (!Array.isArray(samples) || samples.length === 0) return;
    const entry = device(id);
    if (!entry.inRun) return;
    const hostRxMs = Date.now();
    const live = entry.live;
    let maxT = -Infinity;
    const serials = new Set();
    for (const sample of samples) {
      if (!sample || !Number.isInteger(sample.serial_number)) continue;
      serials.add(sample.serial_number);
      if (Number.isFinite(sample.t) && sample.t > maxT) maxT = sample.t;
      if (live.firstSerial === null) {
        live.firstSerial = sample.serial_number;
        live.firstDeviceTimeMs = Number.isFinite(sample.t) ? sample.t : null;
      }
      // 最新 = 収録開始 serial からの前方距離が最大のもの（到着順は前後しうる）
      if (live.latestSerial === null
        || Core.serialDistance(live.firstSerial, sample.serial_number) >= Core.serialDistance(live.firstSerial, live.latestSerial)) {
        live.latestSerial = sample.serial_number;
        live.latestDeviceTimeMs = Number.isFinite(sample.t) ? sample.t : live.latestDeviceTimeMs;
      }
      live.samples += 1;
    }
    if (serials.size > 0) {
      live.batches.push({
        hostRxMs,
        deviceTimeMaxMs: Number.isFinite(maxT) ? maxT : null,
        serials: Array.from(serials)
      });
    }
    queueLiveRender();
  }

  function handleFifoProgress(id, info) {
    const live = device(id).live;
    const lag = Number(info && info.lag) || 0;
    live.lag = lag;
    if (lag > live.maxLag) live.maxLag = lag;
    queueLiveRender();
  }

  function handleFifoDataLoss(id, info) {
    const live = device(id).live;
    live.droppedLive = Number(info && info.cumulative) || live.droppedLive;
    log("error", "logDataLossDevice", {
      device: deviceLabel(id), dropped: info.dropped, cumulative: info.cumulative, reason: info.reason
    });
    queueLiveRender();
  }

  function handleFifoStopped(id, info) {
    const live = device(id).live;
    live.droppedTotal = Number(info && info.dropped) || 0;
    live.drainRecovered = Number(info && info.drainRecovered) || 0;
    live.catchupRecovered = Number(info && info.catchupRecovered) || 0;
    log("info", "logFifoStoppedDevice", {
      device: deviceLabel(id), collected: info.collected, dropped: info.dropped, recovered: live.drainRecovered
    });
  }

  // ── 収録 ─────────────────────────────────────────────────────────────
  function wireControls() {
    dom.recordButton.addEventListener("click", () => {
      if (state.recording) stopRecording("manual");
      else startRecording();
    });
    dom.saveNextButton.addEventListener("click", saveAndNext);
    dom.discardButton.addEventListener("click", discardTrial);
    dom.markerButton.addEventListener("click", () => addMarker("button"));
    dom.metadataForm.addEventListener("submit", (event) => event.preventDefault());
    dom.metadataForm.addEventListener("input", persistMetadata);
    dom.csvButton.addEventListener("click", () => exportTrial("csv"));
    dom.markersCsvButton.addEventListener("click", () => exportTrial("markers"));
    dom.trialJsonButton.addEventListener("click", () => exportTrial("json"));
    dom.lossJsonButton.addEventListener("click", () => exportTrial("loss"));
    dom.sessionCsvButton.addEventListener("click", exportSessionCsv);
    dom.sessionJsonButton.addEventListener("click", exportSessionJson);
    dom.dictionaryButton.addEventListener("click", exportDictionary);
    dom.clearSessionButton.addEventListener("click", () => {
      if (state.trials.length === 0) return;
      if (!root.confirm(t("clearSessionConfirm"))) return;
      state.trials = [];
      renderTrials();
    });
    dom.copyLogButton.addEventListener("click", copyLog);
    dom.clearLogButton.addEventListener("click", () => { logEntries.length = 0; renderLog(); });
    root.addEventListener("resize", drawAlignment);
  }

  function wireKeyboard() {
    root.document.addEventListener("keydown", (event) => {
      if (event.code !== "Space" && event.key !== " ") return;
      const target = event.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select" || (target && target.isContentEditable)) return;
      if (tag === "button" && target !== dom.markerButton) return;
      if (!state.recording) return;
      event.preventDefault();
      addMarker("space");
    });
  }

  async function startRecording() {
    const ids = connectedIds();
    if (ids.length === 0) {
      log("warn", "logNotConnected");
      return;
    }
    persistMetadata();
    const metadata = readMetadataForm();
    resetRunState(ids);
    setPhase("preparing");
    log("info", "logPreparing", { count: ids.length });

    const started = await Promise.allSettled(ids.map((id) => device(id).session.startMeasurement({
      profile: "fifo-recording",
      restoreProfile: true,
      maxSamples: MAX_SAMPLES,
      metadata: { page: "lab-recorder", ...metadata }
    })));
    const active = [];
    started.forEach((outcome, index) => {
      const id = ids[index];
      if (outcome.status === "fulfilled") {
        device(id).inRun = true;
        active.push(id);
      } else {
        log("error", "logStartFailedDevice", { device: deviceLabel(id), message: describeError(outcome.reason) });
      }
    });
    if (active.length === 0) {
      state.runDeviceIds = [];
      setPhase(connectedIds().length > 0 ? "ready" : "idle");
      return;
    }
    state.runDeviceIds = active;
    syncDeviceVisibility();

    state.recording = true;
    state.startedHostMs = Date.now();
    state.markers = [];
    state.trial = {
      metadata,
      startedHostMs: state.startedHostMs,
      stoppedHostMs: null,
      tzOffsetMinutes: tzOffsetMinutes(),
      timeZoneName: timeZoneName(),
      sdkVersion: state.sdkVersion,
      sdkVersionDate: state.sdkVersionDate,
      impulseWindowMs: impulseWindowMs(),
      devices: [],
      markers: state.markers,
      environment: environmentInfo()
    };
    setPhase("recording");
    renderMarkers();
    log("success", "logStarted", { count: active.length });
    state.tickTimer = root.setInterval(onTick, 100);
  }

  function onTick() {
    const elapsed = Date.now() - state.startedHostMs;
    dom.elapsedText.textContent = `${(elapsed / 1000).toFixed(1)} s`;
  }

  async function stopRecording(reason) {
    if (!state.recording) return;
    state.recording = false;
    clearTimers();
    state.stoppedHostMs = Date.now();
    if (state.trial) state.trial.stoppedHostMs = state.stoppedHostMs;
    dom.elapsedText.textContent = `${((state.stoppedHostMs - state.startedHostMs) / 1000).toFixed(1)} s`;
    const ids = state.runDeviceIds.slice();
    setPhase("draining");
    log("info", "logStopped");

    const results = await Promise.allSettled(ids.map((id) => device(id).session.stopMeasurement({ reason })));
    const reports = [];
    results.forEach((outcome, index) => {
      const id = ids[index];
      const entry = device(id);
      let result = outcome.value || null;
      if (outcome.status === "rejected") {
        log("error", "logStopFailedDevice", { device: deviceLabel(id), message: describeError(outcome.reason) });
        result = entry.session.lastMeasurement || null;
      }
      if (!result) {
        log("error", "logNoResultDevice", { device: deviceLabel(id) });
        return;
      }
      entry.result = result;
      entry.report = analyzeDeviceResult(id, result);
      reports.push(entry.report);
    });

    if (reports.length === 0 || !state.trial) {
      state.trial = null;
      setPhase(connectedIds().length > 0 ? "ready" : "idle");
      return;
    }
    state.trial.devices = reports;
    for (const report of reports) {
      log(report.complete ? "success" : "warn", "logResultDevice", {
        device: deviceLabel(report.deviceId),
        seconds: report.durationMs === null ? "?" : (report.durationMs / 1000).toFixed(1),
        samples: report.sampleCount,
        expected: report.continuity.expected,
        received: report.continuity.received,
        missing: report.continuity.missing,
        dropped: report.dropped,
        maxLag: report.maxLag
      });
      if (report.impulse) {
        log("info", "logImpulseCandidate", {
          device: deviceLabel(report.deviceId),
          serial: report.impulse.serial_number,
          elapsed: report.impulse.elapsed_ms === null ? "?" : (report.impulse.elapsed_ms / 1000).toFixed(2),
          peak: report.impulse.acc_norm_g.toFixed(2)
        });
      } else {
        log("warn", "logImpulseNone", { device: deviceLabel(report.deviceId) });
      }
    }
    setPhase("review");
    renderResult();
    renderMarkers();
    renderImpulse();
    renderLive();
  }

  function analyzeDeviceResult(id, result) {
    const entry = device(id);
    const live = entry.live;
    const samples = Array.isArray(result.raw && result.raw.samples) ? result.raw.samples : [];
    // dropped は「収録中に回復不能と判定された累計」（onStopped の dropped が正）。
    const dropped = live.droppedTotal !== null
      ? live.droppedTotal
      : Math.max(0, Number(result.fifo && result.fifo.dropped) || 0);
    return Core.analyzeDevice({
      deviceId: id,
      side: entry.side,
      firmwareVersion: entry.firmwareVersion,
      samples,
      batches: live.batches,
      dropped,
      maxLag: live.maxLag,
      drainRecovered: live.drainRecovered,
      catchupRecovered: live.catchupRecovered,
      durationMs: result.durationMs,
      truncated: !!(result.raw && result.raw.truncated),
      impulseWindowMs: state.trial ? state.trial.impulseWindowMs : impulseWindowMs(),
      trialStartHostMs: state.startedHostMs,
      tzOffsetMinutes: state.trial ? state.trial.tzOffsetMinutes : tzOffsetMinutes()
    });
  }

  function clearTimers() {
    if (state.tickTimer) { root.clearInterval(state.tickTimer); state.tickTimer = null; }
  }

  function resetRunState(ids) {
    state.runDeviceIds = ids.slice();
    state.markers = [];
    state.trial = null;
    for (const id of DEVICE_IDS) {
      const entry = device(id);
      entry.inRun = false;
      entry.live = createLive();
      entry.result = null;
      entry.report = null;
    }
    dom.elapsedText.textContent = "0.0 s";
    syncDeviceVisibility();
    renderResult();
    renderMarkers();
    renderImpulse();
    renderLive();
  }

  // ── 同期マーカー ──────────────────────────────────────────────────
  function addMarker(source) {
    if (!state.recording || !state.trial) return;
    const now = Date.now();
    const lastReceived = {};
    for (const id of state.runDeviceIds) lastReceived[id] = device(id).live.latestSerial;
    const marker = {
      marker_index: state.markers.length + 1,
      label: dom.markerLabel.value.trim(),
      host_time_ms: now,
      elapsed_ms: now - state.startedHostMs,
      last_received_serial: lastReceived,
      source
    };
    state.markers.push(marker);
    dom.markerButton.classList.add("flash");
    root.setTimeout(() => dom.markerButton.classList.remove("flash"), 160);
    log("info", "logMarker", {
      index: marker.marker_index,
      elapsed: (marker.elapsed_ms / 1000).toFixed(3),
      label: marker.label ? ` "${marker.label}"` : "",
      serials: state.runDeviceIds.map((id) => `${deviceLabel(id)}=${lastReceived[id] === null ? "—" : lastReceived[id]}`).join(", ")
    });
    renderMarkers();
  }

  function renderMarkers() {
    const body = dom.markerBody;
    body.innerHTML = "";
    const markers = state.markers;
    dom.markerEmpty.hidden = markers.length > 0;
    const aligned = state.trial && state.trial.devices.length > 0 ? Core.alignMarkers(state.trial) : null;
    markers.forEach((marker, index) => {
      const row = root.document.createElement("tr");
      const ids = state.runDeviceIds.length > 0 ? state.runDeviceIds : Object.keys(marker.last_received_serial).map(Number);
      const lastText = ids.map((id) => `${deviceLabel(id)}: ${marker.last_received_serial[id] === null || marker.last_received_serial[id] === undefined ? "—" : marker.last_received_serial[id]}`).join(" / ");
      let alignedText = state.phase === "review" ? t("markerAlignedNone") : t("markerAlignedPending");
      if (aligned && aligned[index]) {
        alignedText = ids.map((id) => {
          const detail = aligned[index].devices[id];
          if (!detail || detail.aligned_serial === null) return `${deviceLabel(id)}: —`;
          return `${deviceLabel(id)}: serial ${detail.aligned_serial}/${detail.aligned_packet_number} (#${detail.aligned_sample_index}, Δ${detail.alignment_residual_ms.toFixed(1)} ms)`;
        }).join(" / ");
      }
      row.innerHTML = [
        `<td class="num">${marker.marker_index}</td>`,
        `<td>${escapeHtml(marker.label || "")}</td>`,
        `<td class="num">${escapeHtml(Core.formatIsoWithOffset(marker.host_time_ms))}</td>`,
        `<td class="num">${(marker.elapsed_ms / 1000).toFixed(3)} s</td>`,
        `<td class="num">${escapeHtml(lastText)}</td>`,
        `<td class="aligned">${escapeHtml(alignedText)}</td>`
      ].join("");
      body.appendChild(row);
    });
  }

  // ── インパルス候補 ────────────────────────────────────────────────
  function renderImpulse() {
    const container = dom.impulseCards;
    container.innerHTML = "";
    const reports = state.trial && state.phase === "review" ? state.trial.devices : [];
    dom.impulseEmpty.hidden = reports.length > 0;
    for (const report of reports) {
      const card = root.document.createElement("article");
      const impulse = report.impulse;
      const status = impulse ? impulse.status : "none";
      card.className = `impulse-card ${status}`;
      card.dataset.device = String(report.deviceId);
      const statusKey = status === "accepted" ? "impulseStatusAccepted" : status === "rejected" ? "impulseStatusRejected" : "impulseStatusPending";
      const facts = impulse ? [
        ["impulsePeak", `${impulse.acc_norm_g.toFixed(2)} G`],
        ["impulseSerial", `${impulse.serial_number} / ${impulse.packet_number} (#${impulse.sample_index})`],
        ["impulseTime", `${impulse.device_time_ms.toFixed(1)} ms / ${impulse.elapsed_ms === null ? "—" : `+${(impulse.elapsed_ms / 1000).toFixed(3)} s`}`],
        ["impulseWindow", `${(impulse.window_ms / 1000).toFixed(0)} s · ${impulse.window_samples} samples`],
        ["impulseProminence", impulse.prominence === null ? "—" : `${impulse.prominence.toFixed(2)}× (median ${impulse.median_norm_g.toFixed(2)} G)`],
        ["markerColHost", impulse.host_time_est || "—"]
      ] : [];
      card.innerHTML = [
        `<header><span>${escapeHtml(deviceLabel(report.deviceId))}</span>`,
        impulse ? `<span class="impulse-status ${status}">${escapeHtml(t(statusKey))}</span>` : "",
        "</header>",
        impulse
          ? `<dl class="impulse-facts">${facts.map(([key, value]) => `<div><dt>${escapeHtml(t(key))}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`
          : `<p class="empty-note">${escapeHtml(t("impulseNone"))}</p>`,
        impulse && impulse.prominence !== null && impulse.prominence < WEAK_IMPULSE_RATIO
          ? `<p class="caution-line weak"><i class="bi bi-exclamation-circle" aria-hidden="true"></i> <span>${escapeHtml(t("impulseWeak", { ratio: impulse.prominence.toFixed(2) }))}</span></p>`
          : "",
        impulse ? [
          '<div class="actions">',
          `<button type="button" class="button secondary tiny" data-decision="accepted" ${status === "accepted" ? "disabled" : ""}>${escapeHtml(t("impulseAccept"))}</button>`,
          `<button type="button" class="button ghost tiny" data-decision="rejected" ${status === "rejected" ? "disabled" : ""}>${escapeHtml(t("impulseReject"))}</button>`,
          `<button type="button" class="button ghost tiny" data-decision="pending" ${status === "pending" ? "disabled" : ""}>${escapeHtml(t("impulseReset"))}</button>`,
          "</div>"
        ].join("") : ""
      ].join("");
      card.querySelectorAll("button[data-decision]").forEach((button) => {
        button.addEventListener("click", () => {
          if (!report.impulse) return;
          report.impulse.status = button.dataset.decision;
          log("info", "logImpulseDecision", { device: deviceLabel(report.deviceId), status: t(statusKeyFor(report.impulse.status)) });
          renderImpulse();
        });
      });
      container.appendChild(card);
    }
  }

  function statusKeyFor(status) {
    return status === "accepted" ? "impulseStatusAccepted" : status === "rejected" ? "impulseStatusRejected" : "impulseStatusPending";
  }

  // ── ライブ表示 ────────────────────────────────────────────────────
  function buildLiveGrid() {
    dom.liveGrid.innerHTML = "";
    for (const id of DEVICE_IDS) {
      const card = root.document.createElement("div");
      card.className = "live-device";
      card.dataset.device = String(id);
      card.innerHTML = [
        `<div class="live-name"><i style="background:${DEVICE_COLORS[id]}"></i><b></b><span class="fw"></span></div>`,
        '<div class="live-stats">',
        ["liveSerial", "liveDeviceTime", "liveSamples", "liveBatches", "liveLag", "liveDropped"]
          .map((key) => `<div><span data-stat-label="${key}"></span><b data-stat="${key}">—</b></div>`).join(""),
        "</div>"
      ].join("");
      dom.liveGrid.appendChild(card);
    }
  }

  function queueLiveRender() {
    if (state.renderQueued) return;
    state.renderQueued = true;
    root.requestAnimationFrame(() => {
      state.renderQueued = false;
      renderLive();
    });
  }

  function renderLive() {
    for (const id of DEVICE_IDS) {
      const card = root.document.querySelector(`.live-device[data-device="${id}"]`);
      if (!card) continue;
      const entry = device(id);
      const live = entry.live;
      card.querySelector(".live-name b").textContent = deviceLabel(id);
      card.querySelector(".live-name .fw").textContent = entry.firmwareVersion ? `FW ${entry.firmwareVersion}` : "";
      card.querySelectorAll("[data-stat-label]").forEach((label) => { label.textContent = t(label.dataset.statLabel); });
      const set = (key, value, alert) => {
        const cell = card.querySelector(`[data-stat="${key}"]`);
        cell.textContent = value;
        cell.classList.toggle("alert", !!alert);
      };
      const busy = state.phase === "recording" || state.phase === "draining" || state.phase === "review";
      set("liveSerial", live.latestSerial === null ? t("liveWaiting") : String(live.latestSerial));
      set("liveDeviceTime", live.latestDeviceTimeMs === null ? t("liveWaiting") : formatDeviceClock(live.latestDeviceTimeMs));
      set("liveSamples", live.samples > 0 ? String(live.samples) : t("liveWaiting"));
      set("liveBatches", live.batches.length > 0 ? String(live.batches.length) : t("liveWaiting"));
      set("liveLag", busy ? `${live.lag} / 1500` : t("liveWaiting"), live.lag >= 1500 * 0.6);
      const dropped = live.droppedTotal !== null ? live.droppedTotal : live.droppedLive;
      set("liveDropped", busy ? String(dropped) : t("liveWaiting"), dropped > 0);
    }
    drawAlignment();
  }

  function formatDeviceClock(ms) {
    const total = Math.floor(((ms % Core.DAY_MS) + Core.DAY_MS) % Core.DAY_MS);
    const h = Math.floor(total / 3600000);
    const m = Math.floor((total % 3600000) / 60000);
    const s = Math.floor((total % 60000) / 1000);
    const milli = total % 1000;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(milli).padStart(3, "0")}`;
  }

  function drawAlignment() {
    const canvas = dom.alignmentCanvas;
    if (!canvas) return;
    const ratio = root.devicePixelRatio || 1;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight || 56);
    if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = "#0b141b";
    ctx.fillRect(0, 0, width, height);

    const ids = state.runDeviceIds.length > 0 ? state.runDeviceIds : connectedIds();
    const summary = ids.length >= 2 ? Core.alignmentSummary(device(ids[0]).live, device(ids[1]).live) : null;
    if (!summary || !summary.available) {
      dom.alignmentText.textContent = t("alignmentWaiting");
      return;
    }
    const maxAdvance = Math.max(1, summary.a.serials, summary.b.serials);
    const barH = 14;
    const gap = 10;
    [summary.a, summary.b].forEach((advance, index) => {
      const y = 8 + index * (barH + gap);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(8, y, width - 16, barH);
      ctx.fillStyle = DEVICE_COLORS[ids[index]];
      ctx.fillRect(8, y, (width - 16) * (advance.serials / maxAdvance), barH);
    });
    dom.alignmentText.textContent = t("alignmentSummary", {
      a: deviceLabel(ids[0]),
      b: deviceLabel(ids[1]),
      aSerials: summary.a.serials,
      bSerials: summary.b.serials,
      delta: summary.deltaSerials > 0 ? `+${summary.deltaSerials}` : String(summary.deltaSerials),
      deltaMs: summary.deltaSerialsAsMs.toFixed(0),
      timeDelta: summary.deltaTimeMs === null ? "—" : summary.deltaTimeMs.toFixed(0)
    });
  }

  // ── 結果テーブル ──────────────────────────────────────────────────
  function buildMetricTable() {
    const body = dom.metricTableBody;
    body.innerHTML = "";
    for (const key of METRIC_ROWS) {
      const row = root.document.createElement("tr");
      row.dataset.metric = key;
      const label = root.document.createElement("th");
      label.scope = "row";
      label.textContent = t(key);
      row.appendChild(label);
      for (const id of DEVICE_IDS) {
        const cell = root.document.createElement("td");
        cell.dataset.device = String(id);
        cell.className = "metric-value";
        cell.textContent = t("valueEmpty");
        row.appendChild(cell);
      }
      const note = root.document.createElement("td");
      note.className = "metric-note";
      note.textContent = t(`${key}_note`);
      row.appendChild(note);
      body.appendChild(row);
    }
    syncDeviceVisibility();
    renderResult();
  }

  function setMetric(id, key, value, level, wrap) {
    const cell = dom.metricTableBody.querySelector(`tr[data-metric="${key}"] td[data-device="${id}"]`);
    if (!cell) return;
    cell.textContent = value;
    cell.className = `metric-value${level ? ` level-${level}` : ""}${wrap ? " wrap" : ""}`;
  }

  function renderResult() {
    const reports = state.trial && state.phase === "review" ? state.trial.devices : [];
    const hasResult = reports.length > 0;
    for (const id of DEVICE_IDS) {
      const report = reports.find((item) => item.deviceId === id);
      if (!report) {
        for (const key of METRIC_ROWS) setMetric(id, key, hasResult ? t("deviceNotUsed") : t("valueEmpty"), null);
        continue;
      }
      const c = report.continuity;
      setMetric(id, "m_duration", report.durationMs === null ? t("valueEmpty") : `${(report.durationMs / 1000).toFixed(1)} s`);
      setMetric(id, "m_samples", String(report.sampleCount), report.sampleCount > 0 ? "ok" : "bad");
      setMetric(id, "m_first", c.first === null ? t("valueEmpty") : String(c.first));
      setMetric(id, "m_last", c.last === null ? t("valueEmpty") : String(c.last));
      setMetric(id, "m_expected", String(c.expected));
      setMetric(id, "m_received", String(c.received));
      setMetric(id, "m_missing", String(c.missing), c.missing === 0 ? "ok" : "bad");
      setMetric(id, "m_missing_rate", `${(c.missingRate * 100).toFixed(3)} %`, c.missing === 0 ? "ok" : "bad");
      setMetric(id, "m_ranges", c.ranges.length === 0 ? t("valueEmpty") : Core.formatRanges(c.ranges, 30), c.ranges.length === 0 ? "ok" : "bad", true);
      setMetric(id, "m_dropped", String(report.dropped), report.dropped === 0 ? "ok" : "bad");
      setMetric(id, "m_max_lag", `${report.maxLag} / 1500`, report.maxLag >= 1500 ? "bad" : report.maxLag >= 900 ? "warn" : "ok");
      setMetric(id, "m_recovered", `${report.drainRecovered} / ${report.catchupRecovered}`);
      setMetric(id, "m_rate", report.measuredRateHz === null ? t("valueEmpty") : `${report.measuredRateHz.toFixed(2)} Hz`,
        report.measuredRateHz !== null && Math.abs(report.measuredRateHz - Core.NOMINAL_IMU_ODR_HZ) > 2 ? "warn" : null);
      setMetric(id, "m_clock_offset", report.clock.available ? `${report.clock.offsetMs.toFixed(1)} ms (n=${report.clock.batches})` : t("valueEmpty"));
      setMetric(id, "m_clock_spread", Number.isFinite(report.clock.offsetSpreadMs) ? `${report.clock.offsetSpreadMs.toFixed(1)} ms` : t("valueEmpty"),
        Number.isFinite(report.clock.offsetSpreadMs) && report.clock.offsetSpreadMs > 500 ? "warn" : null);
      setMetric(id, "m_complete", t(report.complete ? "yes" : "no"), report.complete ? "ok" : "bad");
    }

    if (!hasResult) {
      dom.resultCard.className = "verdict-bar result-empty";
      dom.resultVerdict.className = "verdict-badge";
      dom.resultVerdict.textContent = t("verdictWaiting");
      dom.resultSummary.textContent = t("resultSummaryWaiting");
      return;
    }
    const complete = reports.every((report) => report.complete);
    dom.resultCard.className = `verdict-bar result-${complete ? "complete" : "incomplete"}`;
    dom.resultVerdict.className = `verdict-badge verdict-${complete ? "complete" : "incomplete"}`;
    dom.resultVerdict.textContent = t(complete ? "verdictComplete" : "verdictIncomplete");
    dom.resultSummary.textContent = t(complete ? "resultSummaryComplete" : "resultSummaryIncomplete");
  }

  // ── 試行の保存・連続実行 ────────────────────────────────────────────
  function trialFiles(trial) {
    const base = Core.trialBaseName(trial);
    return {
      csv: { name: `${base}_samples.csv`, type: "text/csv", build: () => Core.buildTrialCsv(trial) },
      markers: { name: `${base}_markers.csv`, type: "text/csv", build: () => Core.buildMarkersCsv(trial) },
      json: { name: `${base}_trial.json`, type: "application/json", build: () => JSON.stringify(Core.buildTrialJson(trial), null, 2) },
      loss: { name: `${base}_loss-report.json`, type: "application/json", build: () => JSON.stringify(Core.buildLossReport(trial), null, 2) }
    };
  }

  function exportTrial(kind) {
    if (!state.trial || state.phase !== "review") return;
    const file = trialFiles(state.trial)[kind];
    if (!file) return;
    saveBlob(file.build(), file.type, file.name);
  }

  function saveAndNext() {
    if (!state.trial || state.phase !== "review") return;
    const trial = state.trial;
    const files = trialFiles(trial);
    const order = ["csv", "markers", "json"];
    log("info", "logDownloadHint");
    order.forEach((kind, index) => {
      root.setTimeout(() => saveBlob(files[kind].build(), files[kind].type, files[kind].name), index * DOWNLOAD_STAGGER_MS);
    });
    state.trials.push(Core.summarizeTrial(trial));
    renderTrials();

    const nextTrial = Core.nextTrialNumber(trial.metadata.trial_number);
    if (dom.metaInputs.trial_number) dom.metaInputs.trial_number.value = nextTrial;
    persistMetadata();
    log("success", "logSaved", {
      trial: trial.metadata.trial_number || "—",
      files: order.map((kind) => files[kind].name).join(", "),
      next: nextTrial
    });
    finishReview();
  }

  function discardTrial() {
    if (!state.trial || state.phase !== "review") return;
    if (!root.confirm(t("discardConfirm"))) return;
    log("warn", "logDiscarded");
    finishReview();
  }

  function finishReview() {
    state.trial = null;
    state.markers = [];
    state.runDeviceIds = [];
    for (const id of DEVICE_IDS) {
      device(id).live = createLive();
      device(id).result = null;
      device(id).report = null;
    }
    dom.elapsedText.textContent = "0.0 s";
    setPhase(connectedIds().length > 0 ? "ready" : "idle");
    syncDeviceVisibility();
    renderResult();
    renderMarkers();
    renderImpulse();
    renderLive();
  }

  function renderTrials() {
    const body = dom.trialsBody;
    body.innerHTML = "";
    dom.trialsEmpty.hidden = state.trials.length > 0;
    dom.sessionCsvButton.disabled = state.trials.length === 0;
    dom.sessionJsonButton.disabled = state.trials.length === 0;
    dom.clearSessionButton.disabled = state.trials.length === 0;
    for (const summary of state.trials) {
      const row = root.document.createElement("tr");
      row.innerHTML = [
        `<td class="num">${escapeHtml(summary.trial_number || "—")}</td>`,
        `<td>${escapeHtml(summary.condition || "—")}</td>`,
        `<td class="num">${summary.samples}</td>`,
        `<td class="num ${summary.complete ? "complete-yes" : "complete-no"}">${summary.missing} / ${summary.dropped}</td>`,
        `<td class="num">${summary.markers}</td>`,
        `<td>${escapeHtml(summary.impulse_status)}</td>`
      ].join("");
      body.appendChild(row);
    }
  }

  function sessionBaseName() {
    const metadata = readMetadataForm();
    return `orphe-lab-session_${Core.sanitizeFilename(metadata.participant_id, "anon")}_${Core.compactTimestamp(Date.now())}`;
  }

  function exportSessionCsv() {
    if (state.trials.length === 0) return;
    saveBlob(Core.buildSessionCsv(state.trials), "text/csv", `${sessionBaseName()}_trials.csv`);
    log("success", "logSessionExported", { count: state.trials.length });
  }

  function exportSessionJson() {
    if (state.trials.length === 0) return;
    const payload = {
      format_version: Core.CSV_FORMAT_VERSION,
      generator: "ORPHE-INSOLE.js examples/lab-recorder",
      sdk_version: state.sdkVersion,
      exported_at: Core.formatIsoWithOffset(Date.now()),
      host_timezone: Core.formatTimezoneLabel(tzOffsetMinutes(), timeZoneName()),
      environment: environmentInfo(),
      trials: state.trials
    };
    saveBlob(JSON.stringify(payload, null, 2), "application/json", `${sessionBaseName()}.json`);
    log("success", "logSessionExported", { count: state.trials.length });
  }

  function exportDictionary() {
    saveBlob(Core.buildDataDictionary({ sdkVersion: state.sdkVersion }), "text/markdown", "orphe-lab-recorder_data-dictionary.md");
    log("success", "logDictionarySaved");
  }

  // ── 状態表示 ─────────────────────────────────────────────────────────
  const PHASE_SOURCE = {
    idle: ["waiting", "sourceConnectTitle", "sourceConnectDetail"],
    ready: ["ready", "sourceReadyTitle", "sourceReadyDetail"],
    preparing: ["preparing", "sourcePreparingTitle", "sourcePreparingDetail"],
    recording: ["recording", "sourceRecordingTitle", "sourceRecordingDetail"],
    draining: ["draining", "sourceDrainingTitle", "sourceDrainingDetail"],
    review: ["review", "sourceReviewTitle", "sourceReviewDetail"],
    disconnected: ["waiting", "sourceDisconnectedTitle", "sourceDisconnectedDetail"]
  };

  const BADGE_TEXT = {
    waiting: "WAITING", ready: "READY", preparing: "PREPARING", recording: "RECORDING",
    draining: "DRAINING", review: "REVIEW", error: "ERROR"
  };

  function setPhase(phase) {
    state.phase = phase === "disconnected" ? "idle" : phase;
    const entry = PHASE_SOURCE[phase] || PHASE_SOURCE.idle;
    setSourceCopy(entry[0], entry[1], entry[2]);
    dom.recordButton.innerHTML = t(phase === "recording" ? "recordStopHtml" : "recordStartHtml");
    dom.recordButton.classList.toggle("active", phase === "recording");
    applyButtonState();
  }

  function applyButtonState() {
    const phase = state.phase;
    const busy = phase === "preparing" || phase === "recording" || phase === "draining";
    dom.recordButton.disabled = phase === "recording"
      ? false
      : phase === "preparing" || phase === "draining" || phase === "review" || connectedIds().length === 0;
    dom.markerButton.disabled = phase !== "recording";
    dom.markerLabel.disabled = phase !== "recording" && phase !== "ready" && phase !== "idle";
    dom.saveNextButton.disabled = phase !== "review";
    dom.discardButton.disabled = phase !== "review";
    setMetadataEnabled(!busy && phase !== "review");
    const exportable = phase === "review" && !!state.trial;
    dom.csvButton.disabled = !exportable;
    dom.markersCsvButton.disabled = !exportable;
    dom.trialJsonButton.disabled = !exportable;
    dom.lossJsonButton.disabled = !exportable;
  }

  function setSourceCopy(source, titleKey, detailKey) {
    state.sourceCopy = { source, titleKey, detailKey };
    refreshSourceCopy();
  }

  function refreshSourceCopy() {
    const copy = state.sourceCopy;
    if (!copy) return;
    dom.sourceBadge.className = `source-badge ${copy.source}`;
    dom.sourceBadge.textContent = BADGE_TEXT[copy.source] || BADGE_TEXT.waiting;
    dom.sourceTitle.textContent = t(copy.titleKey);
    dom.sourceDetail.textContent = copy.detailKey ? t(copy.detailKey) : "";
  }

  // ── ログ / 環境 ──────────────────────────────────────────────────────
  function log(level, key, params) {
    logEntries.push({ at: new Date(), level, key, params: params || null });
    if (logEntries.length > MAX_LOG_ENTRIES) logEntries.splice(0, logEntries.length - MAX_LOG_ENTRIES);
    renderLog();
  }

  function renderLog() {
    if (!dom.eventLog) return;
    dom.eventLog.innerHTML = logEntries.map((entry) => (
      `<div class="log-line log-${entry.level}">${escapeHtml(entry.at.toTimeString().slice(0, 8))} ${escapeHtml(t(entry.key, entry.params))}</div>`
    )).join("");
    dom.eventLog.scrollTop = dom.eventLog.scrollHeight;
  }

  function environmentInfo() {
    return {
      platform: root.navigator.platform,
      userAgent: root.navigator.userAgent,
      webBluetooth: typeof root.navigator.bluetooth !== "undefined",
      language: I18n.getLanguage(),
      sdk_version: state.sdkVersion,
      sdk_version_date: state.sdkVersionDate,
      profile: "fifo-recording"
    };
  }

  function renderEnvLine() {
    if (!dom.envLine) return;
    const env = environmentInfo();
    dom.envLine.textContent = [
      `sdk=${env.sdk_version || "?"}`,
      `platform=${env.platform}`,
      `webBluetooth=${env.webBluetooth ? "available" : "unavailable"}`,
      `tz=${Core.formatTimezoneLabel(tzOffsetMinutes(), timeZoneName())}`,
      `language=${env.language}`,
      "profile=fifo-recording"
    ].join(" / ");
  }

  async function copyLog() {
    const text = [
      "# ORPHE INSOLE lab-recorder log",
      ...Object.entries(environmentInfo()).map(([key, value]) => `# ${key}=${value}`),
      ...logEntries.map((entry) => `${entry.at.toISOString()} [${entry.level}] ${t(entry.key, entry.params)}`)
    ].join("\n");
    const original = dom.copyLogButton.innerHTML;
    dom.copyLogButton.disabled = true;
    try {
      if (root.navigator.clipboard && root.navigator.clipboard.writeText) {
        await root.navigator.clipboard.writeText(text);
      } else {
        const area = root.document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        root.document.body.appendChild(area);
        area.select();
        root.document.execCommand("copy");
        root.document.body.removeChild(area);
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
    }, 1500);
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
