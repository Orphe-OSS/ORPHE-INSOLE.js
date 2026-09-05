(function gaitReportApp(root) {
  "use strict";

  const Stats = root.GaitReportStats;
  const I18n = root.GaitReportI18n;

  if (!Stats) {
    throw new Error("gait-report: report.js must be loaded before app.js");
  }
  if (!I18n) {
    throw new Error("gait-report: i18n.js must be loaded before app.js");
  }

  const TARGET = Stats.TARGET_STEPS;
  const SIDES = Stats.SIDES;
  const DEVICE_IDS = [0, 1];
  const DEMO_STEP_INTERVAL_MS = 530;
  const PAGE_PARAMS = new URLSearchParams(root.location ? root.location.search : "");
  // ?verify=0: FW疎通デバッグ用。Step Analysis のliveness検証を外して接続を維持し、
  // 通知が「いつか来るのか/一切来ないのか」を観察できるようにする。
  const VERIFY_GAIT = PAGE_PARAMS.get("verify") !== "0";

  const state = {
    sessions: [null, null],
    deviceSides: ["left", "right"],
    connected: [false, false],
    recording: false,
    complete: false,
    startedAt: null,
    completedAt: null,
    lastStepAt: null,
    idleReceiving: false,
    sessionSource: null,
    rows: { left: [], right: [] },
    source: "waiting",
    sourceCopy: null,
    demo: {
      running: false,
      timer: null,
      nextStepAt: 0,
      nextSide: "left",
      counts: { left: 0, right: 0 }
    },
    dom: {}
  };

  // ---------------------------------------------------------------- helpers

  function t(key, params, fallback) {
    return I18n.t(key, params, fallback);
  }

  function locale() {
    return I18n.getLanguage() === "ja" ? "ja-JP" : "en-US";
  }

  function nowMs() {
    return root.performance && typeof root.performance.now === "function"
      ? root.performance.now()
      : Date.now();
  }

  function fmt(value, decimals) {
    return Stats.formatNumber(value, decimals);
  }

  function cacheDom() {
    const byId = (id) => document.getElementById(id);
    state.dom = {
      sourceBadge: byId("source-badge"),
      sourceTitle: byId("source-title"),
      sourceDetail: byId("source-detail"),
      recordButton: byId("record-button"),
      demoToggle: byId("demo-toggle"),
      clearButton: byId("clear-button"),
      printButton: byId("print-button"),
      progressStrip: document.querySelector(".progress-strip"),
      progressStatus: byId("progress-status"),
      progLeftBar: byId("prog-left-bar"),
      progRightBar: byId("prog-right-bar"),
      progLeftCount: byId("prog-left-count"),
      progRightCount: byId("prog-right-count"),
      reportFrame: byId("report-frame"),
      reportStatus: byId("report-status"),
      reportDate: byId("report-date"),
      reportSource: byId("report-source"),
      reportSteps: byId("report-steps"),
      statGrid: byId("stat-grid"),
      lrBody: byId("lr-body"),
      distStrike: byId("dist-strike"),
      distPronation: byId("dist-pronation"),
      lastStepTime: byId("last-step-time")
    };
  }

  // ------------------------------------------------------------ source copy

  function applySourceCopy() {
    const copy = state.sourceCopy;
    if (!copy) return;
    state.dom.sourceBadge.className = `source-badge ${copy.badge}`;
    state.dom.sourceBadge.textContent = copy.badge.toUpperCase();
    state.dom.sourceTitle.textContent = t(copy.titleKey, copy.titleParams);
    if (copy.detailRaw) {
      state.dom.sourceDetail.textContent = copy.detailRaw;
    } else if (copy.detailKey) {
      const params = copy.detailSideKey
        ? { ...copy.detailParams, side: t(copy.detailSideKey) }
        : copy.detailParams;
      state.dom.sourceDetail.textContent = t(copy.detailKey, params);
    } else {
      state.dom.sourceDetail.textContent = "";
    }
  }

  function setSourceCopy(badge, titleKey, detailKey, options = {}) {
    state.sourceCopy = {
      badge,
      titleKey,
      detailKey,
      titleParams: options.titleParams || null,
      detailParams: options.detailParams || null,
      detailSideKey: options.detailSideKey || null,
      detailRaw: options.detailRaw || null
    };
    applySourceCopy();
  }

  function connectedDeviceIds() {
    return DEVICE_IDS.filter((deviceId) => state.connected[deviceId]);
  }

  function resolveDeviceSide(deviceId) {
    const insole = Array.isArray(root.insoles) ? root.insoles[deviceId] : null;
    const mount = insole && insole.device_information
      ? insole.device_information.mount_position
      : null;
    const side = Stats.sideFromMountPosition(mount, deviceId);
    state.deviceSides[deviceId] = side;
    return side;
  }

  function updateConnectionSource() {
    if (state.demo.running) {
      state.source = "demo";
      setSourceCopy("demo", "demoPlayingTitle", "demoPlayingDetail");
      return;
    }
    const ids = connectedDeviceIds();
    if (ids.length === 0) {
      state.source = "waiting";
      setSourceCopy("waiting", "sourceConnectTitle", "sourceConnectDetail");
      return;
    }
    state.source = "live";
    const sides = ids.map((deviceId) => state.deviceSides[deviceId]);
    if (ids.length === 2 && sides[0] === sides[1]) {
      setSourceCopy("warning", "sourceLiveTitle", "sourceDuplicateSide", {
        titleParams: { count: ids.length }
      });
      return;
    }
    if (ids.length === 2) {
      setSourceCopy("live", "sourceLiveTitle", "sourceLiveBoth", {
        titleParams: { count: 2 }
      });
      return;
    }
    setSourceCopy("live", "sourceLiveTitle", "sourceLiveOne", {
      titleParams: { count: 1 },
      detailSideKey: sides[0] === "right" ? "sideRight" : "sideLeft"
    });
  }

  // Optional, page-local observer channel; no SDK callback replacement or recorder coupling.
  function notifyCG(type, detail = {}) {
    if (typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") {
      root.dispatchEvent(new root.CustomEvent("gait-report:cg-" + type, { detail }));
    }
  }

  // -------------------------------------------------------------- recording

  function expectedSides() {
    const set = new Set();
    for (const deviceId of DEVICE_IDS) {
      if (state.connected[deviceId]) set.add(state.deviceSides[deviceId]);
    }
    for (const side of SIDES) {
      if (state.rows[side].length > 0) set.add(side);
    }
    return SIDES.filter((side) => set.has(side));
  }

  function startRecording() {
    notifyCG("reset");
    state.rows = { left: [], right: [] };
    state.recording = true;
    state.complete = false;
    state.startedAt = Date.now();
    state.completedAt = null;
    state.idleReceiving = false;
    state.sessionSource = state.demo.running ? "demo" : "live";
    renderAll();
  }

  function completeReport() {
    state.recording = false;
    state.complete = true;
    state.completedAt = Date.now();
    if (state.demo.running) stopDemo({ preserveSource: true });
    renderAll();
  }

  function clearData() {
    notifyCG("reset");
    state.rows = { left: [], right: [] };
    state.recording = false;
    state.complete = false;
    state.startedAt = null;
    state.completedAt = null;
    state.idleReceiving = false;
    state.sessionSource = null;
    renderAll();
  }

  function pulseReport(side) {
    const frame = state.dom.reportFrame;
    const cls = side === "right" ? "is-stepping-right" : "is-stepping-left";
    frame.classList.remove("is-stepping-left", "is-stepping-right");
    void frame.offsetWidth;
    frame.classList.add(cls);
  }

  function handleStepRow(deviceId, incomingRow, options = {}) {
    const side = options.side || resolveDeviceSide(deviceId);
    if (options.source !== "demo") noteLiveData(deviceId);

    // Notify even before Record and after the 20-cycle report is complete.
    notifyCG("step", { side, source: options.source === "demo" ? "demo" : "live", row: { ...incomingRow } });
    state.lastStepAt = Date.now();
    state.dom.lastStepTime.textContent =
      new Date(state.lastStepAt).toLocaleTimeString(locale(), { hour12: false });

    if (!state.recording) {
      if (!state.complete && !state.idleReceiving) {
        state.idleReceiving = true;
        renderProgress();
      }
      return;
    }
    if (state.rows[side].length >= TARGET) return;

    state.rows[side].push({
      ...incomingRow,
      _side: side,
      _device_id: deviceId,
      _received_at: state.lastStepAt
    });
    pulseReport(side);

    const expected = expectedSides();
    const done = expected.length > 0
      && expected.every((expectedSide) => state.rows[expectedSide].length >= TARGET);
    if (done) {
      completeReport();
      return;
    }
    renderAll();
  }

  // ------------------------------------------------------------------- demo

  function demoRow(side, stepNumber) {
    const sidePhase = side === "left" ? 0 : 0.73;
    const wave = Math.sin(stepNumber * 0.72 + sidePhase);
    const cycle = (side === "left" ? 1.06 : 1.08) + wave * 0.028;
    const stanceRatio = (side === "left" ? 0.605 : 0.615)
      + Math.sin(stepNumber * 0.38 + sidePhase) * 0.012;
    const stride = (side === "left" ? 1.28 : 1.24)
      + Math.cos(stepNumber * 0.55 + sidePhase) * 0.05;
    const pronation = (side === "left" ? -8.6 : -10.2) + wave * 1.8;
    const strike = (side === "left" ? -5.2 : -4.5) + Math.cos(stepNumber * 0.44) * 2.4;
    const footStrike = strike > 2 ? "forefoot" : strike > -3 ? "midfoot" : "heelStrike";
    const pronationType = pronation > -5.9 ? "over" : pronation < -12.9 ? "under" : "neutral";
    return {
      step_number: stepNumber,
      gait_type: "walk",
      stride_direction: "forward",
      distance_m: stepNumber * stride,
      stance_phase_s: cycle * stanceRatio,
      swing_phase_s: cycle * (1 - stanceRatio),
      duration_s: cycle,
      cadence_hz: 1 / cycle,
      speed_mps: stride / cycle,
      foot_angle_deg: 8.5 + wave * 2.2,
      stride_x_m: stride * 0.98,
      stride_y_m: (side === "left" ? -1 : 1) * 0.05,
      stride_z_m: 0.035,
      stride_norm_m: stride,
      landing_force: (side === "left" ? 1.18 : 1.24) + Math.abs(wave) * 0.16,
      strike_angle_deg: strike,
      foot_strike: footStrike,
      pronation_deg: pronation,
      pronation_type: pronationType,
      pronation_z_deg: (side === "left" ? -2 : 2) + wave,
      calorie: stepNumber * 0.0015
    };
  }

  function demoTick() {
    const now = nowMs();
    if (now < state.demo.nextStepAt) return;
    const side = state.demo.nextSide;
    state.demo.counts[side] += 1;
    handleStepRow(-1, demoRow(side, state.demo.counts[side]), {
      side,
      source: "demo"
    });
    state.demo.nextSide = side === "left" ? "right" : "left";
    state.demo.nextStepAt = now + DEMO_STEP_INTERVAL_MS;
  }

  function startDemo() {
    if (connectedDeviceIds().length > 0) {
      setSourceCopy("live", "demoBlockedTitle", "demoBlockedDetail");
      return;
    }
    state.demo.running = true;
    state.demo.nextStepAt = nowMs() + 350;
    state.demo.nextSide = "left";
    state.demo.counts = { left: 0, right: 0 };
    state.demo.timer = root.setInterval(demoTick, 60);
    updateConnectionSource();
    startRecording();
  }

  function stopDemo(options = {}) {
    if (state.demo.timer) {
      root.clearInterval(state.demo.timer);
      state.demo.timer = null;
    }
    state.demo.running = false;
    if (!options.preserveSource) updateConnectionSource();
    renderButtons();
  }

  function toggleDemo() {
    if (state.demo.running) {
      stopDemo();
      renderAll();
    } else {
      startDemo();
    }
  }

  // -------------------------------------------------------------- live glue

  function activateLiveConnection(deviceId, options = {}) {
    const demoWasRunning = state.demo.running;
    if (demoWasRunning) {
      stopDemo({ preserveSource: true });
      clearData();
    }
    state.connected[deviceId] = true;
    resolveDeviceSide(deviceId);
    if (
      options.forceSource
      || demoWasRunning
      || (state.source !== "live")
    ) {
      updateConnectionSource();
    }
  }

  function noteLiveData(deviceId) {
    if (deviceId >= 0 && !state.connected[deviceId]) {
      activateLiveConnection(deviceId);
    }
  }

  function installDevice(deviceId) {
    if (typeof root.buildInsoleToolkit !== "function" || !Array.isArray(root.insoles)) {
      setSourceCopy("error", "toolkitLoadErrorTitle", "toolkitLoadErrorDetail");
      return;
    }

    root.buildInsoleToolkit(
      document.getElementById(`toolkit${deviceId}`),
      `INSOLE 0${deviceId + 1}`,
      deviceId,
      {
        profile: "realtime-full-step",
        autoReconnect: true,
        reconnectIntervalMs: 2000,
        gait: {
          verifyNotifications: VERIFY_GAIT,
          onGait(id, row) {
            handleStepRow(id, row);
          },
          onError(error) {
            const message = error && error.message ? error.message : String(error);
            setSourceCopy("error", "stepErrorTitle", "", {
              titleParams: { device: deviceId + 1 },
              detailRaw: message
            });
          }
        },
        onStateChange(snapshot) {
          if (snapshot.connected) {
            activateLiveConnection(deviceId, { forceSource: true });
          } else {
            notifyCG("disconnect", { side: state.deviceSides[deviceId] });
            state.connected[deviceId] = false;
            resolveDeviceSide(deviceId);
            updateConnectionSource();
          }
        },
        onError(error) {
          if (error && error.name === "NotFoundError") {
            updateConnectionSource();
            return;
          }
          const message = error && error.message ? error.message : String(error);
          setSourceCopy("error", "toolkitErrorTitle", "", {
            titleParams: { device: deviceId + 1 },
            detailRaw: message
          });
        }
      }
    );

    state.sessions[deviceId] = root.getInsoleToolkitSession(deviceId);
    const insole = root.insoles[deviceId];
    insole.setup();

    insole.onConnect = function onConnect() {
      activateLiveConnection(this.id, { forceSource: true });
    };
    insole.onDisconnect = function onDisconnect() {
      notifyCG("disconnect", { side: state.deviceSides[this.id] });
      if (!state.demo.running) {
        setSourceCopy("waiting", "reconnectTitle", "reconnectWait", {
          titleParams: { device: this.id + 1 }
        });
      }
    };
    insole.onReconnectAttempt = function onReconnectAttempt(info) {
      if (!state.demo.running) {
        setSourceCopy("waiting", "reconnectTitle", "reconnectAttempt", {
          titleParams: { device: this.id + 1 },
          detailParams: { attempt: info.attempt, maxAttempts: info.maxAttempts }
        });
      }
    };
    insole.onReconnectSuccess = function onReconnectSuccess() {
      activateLiveConnection(this.id, { forceSource: true });
    };
    insole.onReconnectFailed = function onReconnectFailed(info) {
      state.connected[this.id] = false;
      const message = info && info.error && info.error.message ? info.error.message : null;
      setSourceCopy("error", "reconnectFailedTitle", "reconnectFailedFallback", {
        titleParams: { device: this.id + 1 },
        ...(message ? { detailRaw: message } : {})
      });
    };
    insole.onError = function onError(error) {
      if (error && error.name === "NotFoundError") return;
      const message = error && error.message ? error.message : String(error);
      setSourceCopy("error", "toolkitErrorTitle", "", {
        titleParams: { device: this.id + 1 },
        detailRaw: message
      });
    };
  }

  // -------------------------------------------------------------- rendering

  const TILE_FIELDS = ["speed_mps", "cadence_spm", "stride_m", "cycle_s", "stance_pct"];

  function refLine(fieldId) {
    const range = Stats.REFERENCE_RANGES[fieldId];
    if (!range) return "";
    const field = Stats.fieldById(fieldId);
    return t("refRangeLabel", {
      min: range.min,
      max: range.max,
      unit: field ? field.unit : ""
    });
  }

  function renderButtons() {
    const record = state.dom.recordButton;
    if (state.complete) {
      record.innerHTML = t("recordAgainHtml");
    } else if (state.recording) {
      record.innerHTML = t("recordRestartHtml");
    } else {
      record.innerHTML = t("recordStartHtml");
    }
    record.classList.toggle("recording", state.recording);

    const demoButton = state.dom.demoToggle;
    demoButton.innerHTML = state.demo.running ? t("demoStopHtml") : t("demoPlayHtml");
    demoButton.classList.toggle("active", state.demo.running);
  }

  function renderProgress() {
    const dom = state.dom;
    let statusKey = "progressIdle";
    if (state.complete) statusKey = "progressComplete";
    else if (state.recording) statusKey = "progressRecording";
    else if (state.idleReceiving) statusKey = "progressIdleReceiving";
    dom.progressStatus.textContent = t(statusKey, { target: TARGET });
    dom.progressStrip.classList.toggle("is-complete", state.complete);

    const bars = { left: dom.progLeftBar, right: dom.progRightBar };
    const counts = { left: dom.progLeftCount, right: dom.progRightCount };
    for (const side of SIDES) {
      const count = Math.min(state.rows[side].length, TARGET);
      bars[side].style.width = `${(count / TARGET) * 100}%`;
      counts[side].textContent = t("progressSide", { count, target: TARGET });
    }
  }

  function summaryText(summary, decimals) {
    if (!summary || summary.count === 0 || summary.mean === null) return null;
    return {
      mean: fmt(summary.mean, decimals),
      sd: summary.sd === null ? "—" : fmt(summary.sd, decimals),
      count: summary.count
    };
  }

  function renderStatGrid(report) {
    const parts = [];
    for (const fieldId of TILE_FIELDS) {
      const field = Stats.fieldById(fieldId);
      const text = summaryText(report.combined.fields[fieldId], field.decimals);
      const value = text
        ? `${text.mean} <small>${field.unit}</small>`
        : `${t("noData")}`;
      const sub = text
        ? `${t("meanSdPattern", { sd: text.sd })} ・ ${t("nOfSteps", { count: text.count })}`
        : "";
      parts.push(`<div class="stat-tile">
        <span class="stat-label">${t(`metric_${fieldId}_label`)}</span>
        <span class="stat-value">${value}</span>
        <span class="stat-sub">${sub}</span>
        <span class="stat-ref">${refLine(fieldId)}</span>
      </div>`);
    }

    const cvLeft = report.sides.left.cv;
    const cvRight = report.sides.right.cv;
    const cvValue = (cvLeft === null && cvRight === null)
      ? t("noData")
      : `${t("cvTileValue", {
        left: cvLeft === null ? "—" : `${fmt(cvLeft, 1)}%`,
        right: cvRight === null ? "—" : `${fmt(cvRight, 1)}%`
      })}`;
    parts.push(`<div class="stat-tile">
      <span class="stat-label">${t("cvTileLabel")}</span>
      <span class="stat-value" style="font-size:0.95rem">${cvValue}</span>
      <span class="stat-sub"></span>
      <span class="stat-ref">${t("refCvLabel", { max: Stats.REFERENCE_RANGES.cv_pct.max })}</span>
    </div>`);

    state.dom.statGrid.innerHTML = parts.join("");
  }

  function symmetryCell(value) {
    if (value === null) {
      return `<span class="sym-value">${t("noData")}</span>`;
    }
    const abs = Math.abs(value);
    const label = abs < 0.05
      ? t("symEven")
      : t(value > 0 ? "symLeftLarger" : "symRightLarger", { value: fmt(abs, 1) });
    const width = Math.min(abs, 20) / 20 * 50;
    const fill = value > 0
      ? `<div class="sym-bar-fill toward-left" style="width:${width}%"></div>`
      : `<div class="sym-bar-fill toward-right" style="width:${width}%"></div>`;
    return `<span class="sym-value">${label}</span><div class="sym-bar">${fill}</div>`;
  }

  const LR_TABLE_FIELDS = ["stride_m", "stance_s", "swing_s", "pronation_deg", "landing_force"];

  function deltaCell(value, unit) {
    if (value === null) {
      return `<span class="sym-value">${t("noData")}</span>`;
    }
    return `<span class="sym-value">${t("symDelta", { value: fmt(Math.abs(value), 1), unit })}</span>`;
  }

  function renderLrTable(report) {
    const rows = [];
    for (const fieldId of LR_TABLE_FIELDS) {
      const field = Stats.fieldById(fieldId);
      const left = summaryText(report.sides.left.fields[fieldId], field.decimals);
      const right = summaryText(report.sides.right.fields[fieldId], field.decimals);
      const cell = (text) => (text
        ? `${text.mean} <span class="lr-sd">± ${text.sd}</span>`
        : t("noData"));
      const sym = Stats.DELTA_FIELDS.includes(fieldId)
        ? deltaCell(report.deltas[fieldId], field.unit)
        : symmetryCell(report.symmetry[fieldId]);
      rows.push(`<tr>
        <th scope="row">${t(`metric_${fieldId}_label`)}${field.unit ? ` <span class="lr-unit">(${field.unit})</span>` : ""}</th>
        <td class="lr-left">${cell(left)}</td>
        <td class="lr-right">${cell(right)}</td>
        <td class="sym-cell">${sym}</td>
      </tr>`);
    }
    state.dom.lrBody.innerHTML = rows.join("");
  }

  function distBlock(titleKey, distBySide, keys) {
    const rows = SIDES.map((side) => {
      const dist = distBySide[side];
      const chips = keys.map((key) => {
        const count = dist.counts[key] || 0;
        return `<span class="dist-chip${count > 0 ? " has-count" : ""}">${t(`text${key.charAt(0).toUpperCase()}${key.slice(1)}`)} <b>${count}</b></span>`;
      }).join("");
      return `<div class="dist-row ${side}">
        <span class="dist-side">${side === "left" ? "LEFT" : "RIGHT"}</span>
        <span class="dist-chips">${chips}</span>
      </div>`;
    }).join("");
    return `<h4>${t(titleKey)}</h4>${rows}`;
  }

  function renderDistributions(report) {
    state.dom.distStrike.innerHTML = distBlock("distStrike", {
      left: report.sides.left.strike,
      right: report.sides.right.strike
    }, Stats.STRIKE_KEYS);
    state.dom.distPronation.innerHTML = distBlock("distPronation", {
      left: report.sides.left.pronation,
      right: report.sides.right.pronation
    }, Stats.PRONATION_KEYS);
  }

  function renderReportHead(report) {
    const dom = state.dom;
    let statusKey = "statusIdle";
    let statusClass = "idle";
    if (state.complete) {
      statusKey = "statusComplete";
      statusClass = "complete";
    } else if (state.recording) {
      statusKey = "statusRecording";
      statusClass = "recording";
    }
    dom.reportStatus.textContent = t(statusKey);
    dom.reportStatus.className = `report-status ${statusClass}`;

    if (state.startedAt) {
      const start = new Date(state.startedAt).toLocaleString(locale(), { hour12: false });
      dom.reportDate.textContent = state.completedAt
        ? `${start} – ${new Date(state.completedAt).toLocaleTimeString(locale(), { hour12: false })}`
        : start;
    } else {
      dom.reportDate.textContent = t("noData");
    }

    if (state.sessionSource === "demo") {
      dom.reportSource.textContent = t("sourceValueDemo");
    } else if (state.sessionSource === "live") {
      dom.reportSource.textContent = t("sourceValueLive");
    } else {
      dom.reportSource.textContent = t("sourceValueNone");
    }

    dom.reportSteps.textContent = report.combined.count > 0
      ? t("reportStepsValue", {
        left: report.sides.left.count,
        right: report.sides.right.count
      })
      : t("noData");
  }

  function renderReport() {
    const report = Stats.buildReport(state.rows, TARGET);
    renderReportHead(report);
    renderStatGrid(report);
    renderLrTable(report);
    renderDistributions(report);
  }

  function renderAll() {
    renderButtons();
    renderProgress();
    renderReport();
  }

  // ------------------------------------------------------------------- init

  function refreshLanguage() {
    applySourceCopy();
    renderAll();
    if (state.lastStepAt) {
      state.dom.lastStepTime.textContent =
        new Date(state.lastStepAt).toLocaleTimeString(locale(), { hour12: false });
    }
  }

  function init() {
    cacheDom();
    state.dom.recordButton.addEventListener("click", startRecording);
    state.dom.demoToggle.addEventListener("click", toggleDemo);
    state.dom.clearButton.addEventListener("click", clearData);
    state.dom.printButton.addEventListener("click", () => root.print());

    // i18n.js の初期 setLanguage は DOMContentLoaded の先頭で発火するため、
    // languagechange の購読は cacheDom() 後（=描画できる状態）に登録する。
    root.addEventListener("gait-report:languagechange", refreshLanguage);

    for (const deviceId of DEVICE_IDS) installDevice(deviceId);
    updateConnectionSource();
    renderAll();

    if (PAGE_PARAMS.get("demo") !== "0" && connectedDeviceIds().length === 0) {
      startDemo();
    }
  }

  if (root.document) {
    root.document.addEventListener("DOMContentLoaded", init);
  }

  root.GaitReportLive = {
    state,
    handleStepRow,
    startRecording,
    clearData,
    startDemo,
    stopDemo,
    demoRow,
    renderAll
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
