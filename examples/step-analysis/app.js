(function stepAnalysisLiveApp(root) {
  "use strict";

  const Metrics = root.StepAnalysisMetrics;
  const I18n = root.StepAnalysisI18n;
  const RAW_WINDOW_MS = 10000;
  const RAW_MAX_POINTS = 700;
  const STEP_HISTORY_LIMIT = 240;
  const STEP_TREND_POINTS = Metrics.ROLLING_WINDOW_STEPS;
  const STEP_PACKET_GRACE_MS = 8000;
  const DEVICE_IDS = [0, 1];
  const SIDES = ["left", "right"];
  const SIDE_COLORS = { left: "#35d1b6", right: "#ff7559" };

  if (!Metrics) {
    throw new Error("step-analysis: metrics.js must be loaded before app.js");
  }
  if (!I18n) {
    throw new Error("step-analysis: i18n.js must be loaded before app.js");
  }

  const state = {
    sessions: [null, null],
    deviceSides: ["left", "right"],
    connected: [false, false],
    reconnecting: [false, false],
    frequency: [0, 0],
    rawFirstAt: [null, null],
    pendingRaw: [
      { pressure: null, acc: null, gyro: null, lastCommit: 0 },
      { pressure: null, acc: null, gyro: null, lastCommit: 0 }
    ],
    rows: { left: [], right: [] },
    allRows: [],
    raw: { left: [], right: [] },
    stepPackets: { left: 0, right: 0 },
    source: "waiting",
    sourceCopy: null,
    lastStepAt: null,
    pulseTokens: { left: 0, right: 0 },
    demo: {
      running: false,
      timer: null,
      startedAt: 0,
      nextStepAt: 0,
      nextSide: "left",
      counts: { left: 0, right: 0 }
    },
    stepTrendDirty: true,
    chartDirty: true,
    lastChartDraw: 0,
    dom: {}
  };

  const TEXT_KEYS = {
    walk: "textWalk",
    run: "textRun",
    stance: "textStance",
    none: "textNone",
    unknown: "textUnknown",
    forward: "textForward",
    backward: "textBackward",
    inside: "textInside",
    outside: "textOutside",
    heelStrike: "textHeelStrike",
    midfoot: "textMidfoot",
    forefoot: "textForefoot",
    neutral: "textNeutral",
    over: "textOver",
    severeOver: "textSevereOver",
    under: "textUnder",
    severeUnder: "textSevereUnder"
  };

  const SOURCE_KEYS = {
    "通知": "sourceNotification",
    "算出": "sourceCalculated",
    "推定": "sourceEstimated",
    "分類": "sourceClassification"
  };

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

  function cacheDom() {
    state.dom = {
      sourceBadge: document.getElementById("source-badge"),
      sourceTitle: document.getElementById("source-title"),
      sourceDetail: document.getElementById("source-detail"),
      demoToggle: document.getElementById("demo-toggle"),
      clearButton: document.getElementById("clear-button"),
      csvButton: document.getElementById("csv-button"),
      stepTrendChart: document.getElementById("step-trend-chart"),
      leftTrendSpeed: document.getElementById("left-trend-speed"),
      leftTrendStep: document.getElementById("left-trend-step"),
      rightTrendSpeed: document.getElementById("right-trend-speed"),
      rightTrendStep: document.getElementById("right-trend-step"),
      tableFrame: document.getElementById("gait-table-frame"),
      leftHead: document.getElementById("side-column-left"),
      rightHead: document.getElementById("side-column-right"),
      tableBody: document.getElementById("gait-table-body"),
      leftMeta: document.getElementById("left-meta"),
      rightMeta: document.getElementById("right-meta"),
      lastStepTime: document.getElementById("last-step-time"),
      rawRate: document.getElementById("raw-rate"),
      rawChart: document.getElementById("raw-chart")
    };
  }

  function buildTable() {
    state.dom.tableBody.replaceChildren();
    for (const metric of Metrics.METRICS) {
      const row = document.createElement("tr");

      const heading = document.createElement("th");
      heading.scope = "row";
      const label = document.createElement("span");
      label.className = "metric-label";
      label.textContent = t(`metric_${metric.id}_label`, null, metric.label);
      heading.appendChild(label);
      if (metric.unit) {
        const unit = document.createElement("span");
        unit.className = "metric-unit";
        unit.textContent = `(${metric.unit})`;
        heading.appendChild(unit);
      }
      row.appendChild(heading);

      for (const side of SIDES) {
        const cell = document.createElement("td");
        cell.className = `metric-cell ${side}`;
        cell.id = `metric-${metric.id}-${side}`;
        const current = document.createElement("span");
        current.className = "metric-current";
        current.textContent = "—";
        const summary = document.createElement("span");
        summary.className = "metric-summary";
        summary.textContent = metric.type === "text"
          ? t("summaryLatestClass")
          : t("summaryRecentEmpty");
        cell.append(current, summary);
        row.appendChild(cell);
      }

      const source = document.createElement("td");
      source.className = "metric-source";
      const tag = document.createElement("span");
      tag.className = "source-tag";
      tag.textContent = t(SOURCE_KEYS[metric.source], null, metric.source);
      const description = document.createElement("small");
      description.textContent = t(`metric_${metric.id}_description`, null, metric.description);
      source.append(tag, description);
      row.appendChild(source);

      state.dom.tableBody.appendChild(row);
    }
  }

  function translateText(value) {
    if (value === null || value === undefined || value === "") return "—";
    const key = TEXT_KEYS[value];
    return key ? t(key, null, String(value)) : String(value);
  }

  function renderMetricCell(side, metric) {
    const cell = document.getElementById(`metric-${metric.id}-${side}`);
    if (!cell) return;
    const rows = state.rows[side];
    const latest = rows[rows.length - 1] || null;
    const value = Metrics.metricValue(latest, metric);
    const current = cell.querySelector(".metric-current");
    const summary = cell.querySelector(".metric-summary");

    if (metric.type === "text") {
      current.textContent = translateText(value);
      const recentValues = rows
        .slice(-Metrics.ROLLING_WINDOW_STEPS)
        .map((row) => Metrics.metricValue(row, metric))
        .filter(Boolean);
      const counts = recentValues.reduce((accumulator, item) => {
        accumulator[item] = (accumulator[item] || 0) + 1;
        return accumulator;
      }, {});
      const mode = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      summary.textContent = mode
        ? t("summaryRecentMode", {
          count: recentValues.length,
          value: translateText(mode[0]),
          frequency: mode[1]
        })
        : t("summaryLatestClass");
    } else {
      current.textContent = Metrics.formatNumber(value, metric.decimals);
      const stats = Metrics.summarizeRows(rows, metric);
      summary.textContent = stats && stats.count > 0
        ? t("summaryRecentNumeric", {
          count: stats.count,
          mean: Metrics.formatNumber(stats.mean, metric.decimals),
          sd: Metrics.formatNumber(stats.sd, metric.decimals)
        })
        : t("summaryRecentEmpty");
    }

  }

  function pulseSide(side) {
    const cells = Array.from(document.querySelectorAll(`.metric-cell.${side}`));
    const head = state.dom[`${side}Head`];
    const frameClass = `is-stepping-${side}`;
    const token = state.pulseTokens[side] + 1;
    state.pulseTokens[side] = token;

    cells.forEach((cell) => cell.classList.remove("is-updating"));
    if (head) head.classList.remove("is-updating");
    if (state.dom.tableFrame) state.dom.tableFrame.classList.remove(frameClass);
    if (state.dom.tableFrame) void state.dom.tableFrame.offsetWidth;

    cells.forEach((cell) => cell.classList.add("is-updating"));
    if (head) head.classList.add("is-updating");
    if (state.dom.tableFrame) state.dom.tableFrame.classList.add(frameClass);

    root.setTimeout(() => {
      if (state.pulseTokens[side] !== token) return;
      cells.forEach((cell) => cell.classList.remove("is-updating"));
      if (head) head.classList.remove("is-updating");
      if (state.dom.tableFrame) state.dom.tableFrame.classList.remove(frameClass);
    }, 940);
  }

  function renderSide(side, pulse = false) {
    for (const metric of Metrics.METRICS) {
      renderMetricCell(side, metric);
    }
    updateSideMeta();
    if (pulse) pulseSide(side);
  }

  function resolveDeviceSide(deviceId) {
    const insole = Array.isArray(root.insoles) ? root.insoles[deviceId] : null;
    const mountPosition = insole && insole.device_information
      ? insole.device_information.mount_position
      : null;
    const side = Metrics.sideFromMountPosition(mountPosition, deviceId);
    state.deviceSides[deviceId] = side;
    return side;
  }

  function connectedDeviceIds() {
    return DEVICE_IDS.filter((id) => {
      const session = state.sessions[id];
      return state.connected[id] || Boolean(session && session.snapshot().connected);
    });
  }

  function updateSideMeta() {
    for (const side of SIDES) {
      const rows = state.rows[side];
      const devices = DEVICE_IDS.filter((id) => state.deviceSides[id] === side && state.connected[id]);
      const frequencies = devices.map((id) => state.frequency[id]).filter((value) => value > 0);
      let stateText = t("sideStateWaiting");
      if (state.demo.running) {
        stateText = "DEMO";
      } else if (devices.length > 0) {
        stateText = frequencies.length > 0
          ? `${Math.max(...frequencies).toFixed(0)} Hz`
          : t("sideStateConnected");
      }
      state.dom[`${side}Meta`].textContent = t("sideMeta", {
        count: rows.length,
        state: stateText
      });
    }
  }

  function renderSource(source, title, detail) {
    state.source = source;
    state.dom.sourceBadge.className = `source-badge ${source}`;
    state.dom.sourceBadge.textContent =
      source === "live"
        ? "LIVE"
        : source === "demo"
          ? "DEMO"
          : source === "warning"
            ? "CHECK"
            : source === "error"
              ? "ERROR"
              : "WAITING";
    state.dom.sourceTitle.textContent = title;
    state.dom.sourceDetail.textContent = detail;
  }

  function setSourceCopy(source, titleKey, detailKey, options = {}) {
    state.sourceCopy = {
      source,
      titleKey,
      detailKey,
      titleParams: options.titleParams || null,
      detailParams: options.detailParams || null,
      detailRaw: Object.prototype.hasOwnProperty.call(options, "detailRaw")
        ? options.detailRaw
        : null
    };
    const detail = state.sourceCopy.detailRaw !== null
      ? state.sourceCopy.detailRaw
      : t(detailKey, state.sourceCopy.detailParams);
    renderSource(source, t(titleKey, state.sourceCopy.titleParams), detail);
  }

  function refreshSourceCopy() {
    if (!state.sourceCopy) {
      updateConnectionSource();
      return;
    }
    const copy = state.sourceCopy;
    const detail = copy.detailRaw !== null
      ? copy.detailRaw
      : t(copy.detailKey, copy.detailParams);
    renderSource(copy.source, t(copy.titleKey, copy.titleParams), detail);
  }

  function updateConnectionSource() {
    if (state.demo.running) return;
    const ids = connectedDeviceIds();
    if (ids.length === 0) {
      setSourceCopy(
        "waiting",
        "sourceConnectTitle",
        "sourceConnectDetail"
      );
      return;
    }

    ids.forEach(resolveDeviceSide);
    const sides = ids.map((id) => state.deviceSides[id]);
    const duplicateSide = ids.length > 1 && new Set(sides).size !== ids.length;
    const detailKey = duplicateSide
      ? "sourceDuplicateSide"
      : ids.length === 2
        ? "sourceLiveBoth"
        : "sourceLiveOne";
    setSourceCopy(
      "live",
      "sourceLiveTitle",
      detailKey,
      {
        titleParams: { count: ids.length },
        detailParams: {
          side: sides[0] === "left" ? t("sideLeft") : t("sideRight")
        }
      }
    );
    updateSideMeta();
  }

  function updateStepHealth(now) {
    if (state.demo.running || state.source === "error") return;
    const ids = connectedDeviceIds();
    if (ids.length === 0) return;
    const rawIds = ids.filter((id) => state.rawFirstAt[id] !== null);
    if (rawIds.length === 0) return;
    const graceElapsed = rawIds.every((id) => now - state.rawFirstAt[id] >= STEP_PACKET_GRACE_MS);
    const totalPackets = state.stepPackets.left + state.stepPackets.right;
    if (!graceElapsed || totalPackets > 0) return;
    if (state.source !== "warning") {
      setSourceCopy(
        "warning",
        "sourceStepMissingTitle",
        "sourceStepMissingDetail"
      );
    }
  }

  function stopDemo(options = {}) {
    if (state.demo.timer) {
      root.clearInterval(state.demo.timer);
      state.demo.timer = null;
    }
    state.demo.running = false;
    state.dom.demoToggle.classList.remove("active");
    state.dom.demoToggle.innerHTML = t("demoPlayHtml");
    if (!options.preserveSource) updateConnectionSource();
  }

  function activateLiveConnection(deviceId, options = {}) {
    const demoWasRunning = state.demo.running;
    if (demoWasRunning) {
      stopDemo({ preserveSource: true });
      clearData({ preserveSource: true });
    }
    state.connected[deviceId] = true;
    state.reconnecting[deviceId] = false;
    resolveDeviceSide(deviceId);
    if (
      options.forceSource
      || demoWasRunning
      || (state.source !== "live" && state.source !== "warning")
    ) {
      updateConnectionSource();
    }
  }

  function noteLiveData(deviceId) {
    activateLiveConnection(deviceId);
  }

  function handleStepRow(deviceId, incomingRow, options = {}) {
    const side = options.side || resolveDeviceSide(deviceId);
    if (options.source !== "demo") noteLiveData(deviceId);
    const receivedAt = Date.now();
    const row = {
      ...incomingRow,
      _side: side,
      _device_id: deviceId,
      _source: options.source || "live",
      _received_at: receivedAt
    };

    state.rows[side].push(row);
    if (state.rows[side].length > STEP_HISTORY_LIMIT) state.rows[side].shift();
    state.allRows.push(row);
    if (state.allRows.length > STEP_HISTORY_LIMIT * 2) state.allRows.shift();
    state.lastStepAt = receivedAt;
    state.dom.lastStepTime.textContent =
      new Date(receivedAt).toLocaleTimeString(locale(), { hour12: false });
    state.dom.csvButton.disabled = state.allRows.length === 0;
    state.stepTrendDirty = true;
    renderSide(side, true);
  }

  function handleStepPacket(deviceId, packet, options = {}) {
    const side = options.side || resolveDeviceSide(deviceId);
    if (options.source !== "demo") noteLiveData(deviceId);
    if (packet && packet.type) state.stepPackets[side] += 1;
    if (options.source !== "demo" && state.source === "warning") updateConnectionSource();
    updateSideMeta();
  }

  function magnitude(vector) {
    if (!vector) return null;
    const x = Metrics.finite(vector.x);
    const y = Metrics.finite(vector.y);
    const z = Metrics.finite(vector.z);
    if (x === null || y === null || z === null) return null;
    return Math.sqrt(x * x + y * y + z * z);
  }

  function pressureTotal(values) {
    if (!Array.isArray(values)) return null;
    return values.slice(0, 6).reduce((sum, value) => {
      const number = Metrics.finite(value);
      return sum + (number === null ? 0 : number);
    }, 0);
  }

  function appendRaw(side, point) {
    const data = state.raw[side];
    data.push(point);
    const cutoff = point.t - RAW_WINDOW_MS - 1000;
    while (data.length > 0 && (data[0].t < cutoff || data.length > RAW_MAX_POINTS)) {
      data.shift();
    }
    state.chartDirty = true;
  }

  function commitLiveRaw(deviceId) {
    const pending = state.pendingRaw[deviceId];
    const now = nowMs();
    if (now - pending.lastCommit < 28) return;
    const pressure = pressureTotal(pending.pressure);
    const acc = magnitude(pending.acc);
    const gyro = magnitude(pending.gyro);
    if (pressure === null && acc === null && gyro === null) return;
    pending.lastCommit = now;
    if (state.rawFirstAt[deviceId] === null) state.rawFirstAt[deviceId] = now;
    noteLiveData(deviceId);
    appendRaw(resolveDeviceSide(deviceId), { t: now, pressure, acc, gyro });
  }

  function installDevice(deviceId) {
    if (typeof root.buildInsoleToolkit !== "function" || !Array.isArray(root.insoles)) {
      setSourceCopy(
        "error",
        "toolkitLoadErrorTitle",
        "toolkitLoadErrorDetail"
      );
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
          onRaw(id, packet) {
            handleStepPacket(id, packet);
          },
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

    insole.gotBLEFrequency = function gotBLEFrequency(freq) {
      state.frequency[this.id] = Metrics.finite(freq) || 0;
      updateSideMeta();
    };
    insole.gotConvertedAcc = function gotConvertedAcc(acc) {
      state.pendingRaw[this.id].acc = acc;
    };
    insole.gotConvertedGyro = function gotConvertedGyro(gyro) {
      state.pendingRaw[this.id].gyro = gyro;
    };
    insole.gotPress = function gotPress(press) {
      state.pendingRaw[this.id].pressure = press && press.values;
      commitLiveRaw(this.id);
    };
    insole.onConnect = function onConnect() {
      activateLiveConnection(this.id, { forceSource: true });
    };
    insole.onDisconnect = function onDisconnect() {
      state.reconnecting[this.id] = true;
      if (!state.demo.running) {
        setSourceCopy(
          "waiting",
          "reconnectTitle",
          "reconnectWait",
          { titleParams: { device: this.id + 1 } }
        );
      }
    };
    insole.onReconnectAttempt = function onReconnectAttempt(info) {
      state.reconnecting[this.id] = true;
      if (!state.demo.running) {
        setSourceCopy(
          "waiting",
          "reconnectTitle",
          "reconnectAttempt",
          {
            titleParams: { device: this.id + 1 },
            detailParams: {
              attempt: info.attempt,
              maxAttempts: info.maxAttempts
            }
          }
        );
      }
    };
    insole.onReconnectSuccess = function onReconnectSuccess() {
      activateLiveConnection(this.id, { forceSource: true });
    };
    insole.onReconnectFailed = function onReconnectFailed(info) {
      state.connected[this.id] = false;
      state.reconnecting[this.id] = false;
      const message = info && info.error && info.error.message
        ? info.error.message
        : null;
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

  function demoRow(side, stepNumber, elapsedSeconds) {
    const sidePhase = side === "left" ? 0 : 0.73;
    const wave = Math.sin(stepNumber * 0.72 + sidePhase);
    const cycle = (side === "left" ? 1.1 : 1.12) + wave * 0.035;
    const stanceRatio = (side === "left" ? 0.605 : 0.615) + Math.sin(stepNumber * 0.38 + sidePhase) * 0.012;
    const stride = (side === "left" ? 1.02 : 0.98) + Math.cos(stepNumber * 0.55 + sidePhase) * 0.055;
    const pronation = (side === "left" ? -8.6 : -10.2) + wave * 1.8;
    const strike = (side === "left" ? -5.2 : -4.5) + Math.cos(stepNumber * 0.44) * 2.4;
    const footStrike = strike > 2 ? "forefoot" : strike > -3 ? "midfoot" : "heelStrike";
    const pronationType = pronation > -5.9 ? "over" : pronation < -12.9 ? "under" : "neutral";
    return {
      step_number: stepNumber,
      gait_type: "walk",
      stride_direction: "forward",
      distance_m: Math.max(0, elapsedSeconds * stride / cycle),
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
      calorie: elapsedSeconds * 0.0014
    };
  }

  function appendDemoRaw(elapsedMs) {
    const phase = elapsedMs / 1120;
    for (const side of SIDES) {
      const offset = side === "left" ? 0 : Math.PI;
      const angle = phase * Math.PI * 2 + offset;
      const contact = Math.max(0, Math.sin(angle));
      const impact = Math.pow(Math.max(0, Math.sin(angle + 0.7)), 8);
      appendRaw(side, {
        t: nowMs(),
        pressure: 1800 + contact * 24500 + Math.sin(angle * 3) * 600,
        acc: 1 + impact * 1.5 + Math.abs(Math.sin(angle * 2)) * 0.16,
        gyro: 18 + Math.abs(Math.sin(angle - 0.9)) * 310
      });
    }
  }

  function demoTick() {
    const now = nowMs();
    const elapsed = now - state.demo.startedAt;
    appendDemoRaw(elapsed);
    if (now < state.demo.nextStepAt) return;

    const side = state.demo.nextSide;
    state.demo.counts[side] += 1;
    const stepNumber = state.demo.counts[side];
    state.stepPackets[side] += 6;
    handleStepRow(-1, demoRow(side, stepNumber, elapsed / 1000), {
      side,
      source: "demo"
    });
    state.demo.nextSide = side === "left" ? "right" : "left";
    state.demo.nextStepAt = now + 555;
  }

  function startDemo() {
    if (connectedDeviceIds().length > 0) {
      setSourceCopy(
        "live",
        "demoBlockedTitle",
        "demoBlockedDetail"
      );
      return;
    }
    clearData({ preserveSource: true });
    state.demo.running = true;
    state.demo.startedAt = nowMs();
    state.demo.nextStepAt = state.demo.startedAt + 280;
    state.demo.nextSide = "left";
    state.demo.counts = { left: 0, right: 0 };
    state.dom.demoToggle.classList.add("active");
    state.dom.demoToggle.innerHTML = t("demoStopHtml");
    setSourceCopy(
      "demo",
      "demoPlayingTitle",
      "demoPlayingDetail"
    );
    state.demo.timer = root.setInterval(demoTick, 40);
    demoTick();
  }

  function toggleDemo() {
    if (state.demo.running) stopDemo();
    else startDemo();
  }

  function clearData(options = {}) {
    state.rows.left = [];
    state.rows.right = [];
    state.allRows = [];
    state.raw.left = [];
    state.raw.right = [];
    state.stepPackets.left = 0;
    state.stepPackets.right = 0;
    state.rawFirstAt = [null, null];
    state.lastStepAt = null;
    state.pulseTokens.left += 1;
    state.pulseTokens.right += 1;
    state.dom.lastStepTime.textContent = "—";
    state.dom.csvButton.disabled = true;
    renderSide("left");
    renderSide("right");
    state.stepTrendDirty = true;
    state.chartDirty = true;
    if (!options.preserveSource) updateConnectionSource();
  }

  function csvCell(value) {
    if (value === null || value === undefined) return "";
    const string = String(value);
    return /[",\n]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
  }

  function downloadStepCsv() {
    if (state.allRows.length === 0) return;
    const fields = [
      "_received_at", "_source", "_side", "_device_id",
      "step_number", "gait_type", "stride_direction", "distance_m",
      "stance_phase_s", "swing_phase_s", "duration_s", "cadence_hz", "speed_mps",
      "foot_angle_deg", "stride_x_m", "stride_y_m", "stride_z_m", "stride_norm_m",
      "landing_force", "strike_angle_deg", "foot_strike",
      "pronation_deg", "pronation_type", "pronation_z_deg", "calorie"
    ];
    const header = fields.map((field) => field.replace(/^_/, "")).join(",");
    const lines = state.allRows.map((row) => fields.map((field) => csvCell(row[field])).join(","));
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    anchor.href = url;
    anchor.download = `orphe-step-analysis-${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    root.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function niceMaximum(value) {
    if (!Number.isFinite(value) || value <= 0) return 1;
    const exponent = Math.floor(Math.log10(value));
    const power = Math.pow(10, exponent);
    const normalized = value / power;
    const rounded = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return rounded * power;
  }

  function trendMetric(metricId) {
    return Metrics.metricById(metricId);
  }

  function latestTrendValue(side, metricId) {
    const rows = state.rows[side];
    const latest = rows[rows.length - 1] || null;
    return Metrics.metricValue(latest, trendMetric(metricId));
  }

  function updateStepTrendLatest() {
    for (const side of SIDES) {
      const speed = latestTrendValue(side, "speed_mps");
      const stepLength = latestTrendValue(side, "step_length_m");
      state.dom[`${side}TrendSpeed`].textContent =
        `${Metrics.formatNumber(speed, 2)} m/s`;
      state.dom[`${side}TrendStep`].textContent =
        `${Metrics.formatNumber(stepLength, 2)} m`;
    }
  }

  function drawStepTrendChart() {
    const canvas = state.dom.stepTrendChart;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(120, rect.height);
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    const targetWidth = Math.round(width * dpr);
    const targetHeight = Math.round(height * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0b141b";
    ctx.fillRect(0, 0, width, height);

    const margin = { left: 68, right: 14, top: 6, bottom: 18 };
    const gap = 6;
    const plotWidth = width - margin.left - margin.right;
    const laneHeight = (height - margin.top - margin.bottom - gap) / 2;
    const lanes = [
      { metricId: "speed_mps", label: t("trendSpeedLabel"), unit: "m/s", floor: 1.2 },
      { metricId: "step_length_m", label: t("trendStepLengthLabel"), unit: "m", floor: 0.8 }
    ];
    const hasData = SIDES.some((side) => state.rows[side].length > 0);

    ctx.font = "600 9px Inter, 'Noto Sans JP', system-ui, sans-serif";
    ctx.lineWidth = 1;

    lanes.forEach((lane, laneIndex) => {
      const metric = trendMetric(lane.metricId);
      const top = margin.top + laneIndex * (laneHeight + gap);
      const bottom = top + laneHeight;
      let observedMax = lane.floor;

      for (const side of SIDES) {
        for (const row of state.rows[side].slice(-STEP_TREND_POINTS)) {
          const value = Metrics.metricValue(row, metric);
          if (value !== null) observedMax = Math.max(observedMax, value);
        }
      }
      const scaleMax = niceMaximum(observedMax * 1.12);

      ctx.fillStyle = laneIndex === 0 ? "#0e1921" : "#0c171e";
      ctx.fillRect(margin.left, top, plotWidth, laneHeight);

      ctx.strokeStyle = "rgba(166, 192, 205, 0.14)";
      for (let division = 0; division <= 4; division += 1) {
        const y = top + (laneHeight * division) / 4;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
      }
      for (let step = 0; step < STEP_TREND_POINTS; step += 1) {
        const x = margin.left + (step / (STEP_TREND_POINTS - 1)) * plotWidth;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }

      ctx.fillStyle = "#aabcc6";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(lane.label, margin.left + 7, top + 4);
      ctx.fillStyle = "#657986";
      ctx.fillText(lane.unit, margin.left + 7, top + 15);
      ctx.textAlign = "right";
      ctx.fillText(scaleMax.toFixed(scaleMax < 1 ? 1 : 0), margin.left - 10, top + 2);
      ctx.textBaseline = "bottom";
      ctx.fillText("0", margin.left - 10, bottom - 2);

      for (const side of SIDES) {
        const rows = state.rows[side].slice(-STEP_TREND_POINTS);
        const startIndex = STEP_TREND_POINTS - rows.length;
        const points = rows
          .map((row, rowIndex) => ({
            index: startIndex + rowIndex,
            value: Metrics.metricValue(row, metric)
          }))
          .filter((point) => point.value !== null);

        ctx.strokeStyle = SIDE_COLORS[side];
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        points.forEach((point, pointIndex) => {
          const x = margin.left + (point.index / (STEP_TREND_POINTS - 1)) * plotWidth;
          const y = bottom - Math.min(1, Math.max(0, point.value / scaleMax)) * laneHeight;
          if (pointIndex === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        points.forEach((point, pointIndex) => {
          const x = margin.left + (point.index / (STEP_TREND_POINTS - 1)) * plotWidth;
          const y = bottom - Math.min(1, Math.max(0, point.value / scaleMax)) * laneHeight;
          const isLatest = pointIndex === points.length - 1;
          ctx.beginPath();
          ctx.fillStyle = SIDE_COLORS[side];
          ctx.arc(x, y, isLatest ? 4.5 : 2.5, 0, Math.PI * 2);
          ctx.fill();
          if (isLatest) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
            ctx.lineWidth = 2;
            ctx.arc(x, y, 7.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        });

        ctx.font = "700 7.5px Inter, 'Noto Sans JP', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        points.forEach((point) => {
          const x = margin.left + (point.index / (STEP_TREND_POINTS - 1)) * plotWidth;
          const y = bottom - Math.min(1, Math.max(0, point.value / scaleMax)) * laneHeight;
          const labelX = Math.min(width - 18, Math.max(margin.left + 18, x));
          const label = Metrics.formatNumber(point.value, 2);
          const isLeft = side === "left";
          const labelY = isLeft
            ? Math.max(top + 9, y - 5)
            : Math.min(bottom - 9, y + 5);

          ctx.textBaseline = isLeft ? "bottom" : "top";
          ctx.strokeStyle = "rgba(11, 20, 27, 0.96)";
          ctx.strokeText(label, labelX, labelY);
          ctx.fillStyle = SIDE_COLORS[side];
          ctx.fillText(label, labelX, labelY);
        });
      }
    });

    ctx.fillStyle = "#657986";
    ctx.font = "600 8px Inter, 'Noto Sans JP', system-ui, sans-serif";
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillText(t("trendOldest"), margin.left, height - 5);
    ctx.textAlign = "right";
    ctx.fillText(t("trendLatest"), width - margin.right, height - 5);

    if (!hasData) {
      ctx.fillStyle = "rgba(220, 232, 238, 0.72)";
      ctx.font = "700 10px Inter, 'Noto Sans JP', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t("trendEmpty"), width / 2, height / 2);
    }

    updateStepTrendLatest();
    state.stepTrendDirty = false;
  }

  function rawRate(side, now) {
    const points = state.raw[side];
    const cutoff = now - 1000;
    let count = 0;
    for (let index = points.length - 1; index >= 0; index -= 1) {
      if (points[index].t < cutoff) break;
      count += 1;
    }
    return count;
  }

  function trimRaw(now) {
    const cutoff = now - RAW_WINDOW_MS - 1000;
    for (const side of SIDES) {
      const points = state.raw[side];
      while (points.length > 0 && points[0].t < cutoff) points.shift();
    }
  }

  function drawRawChart(now) {
    const canvas = state.dom.rawChart;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(138, rect.height);
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    const targetWidth = Math.round(width * dpr);
    const targetHeight = Math.round(height * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0b141b";
    ctx.fillRect(0, 0, width, height);

    trimRaw(now);
    const hasData = SIDES.some((side) => state.raw[side].length > 0);
    const margin = { left: 72, right: 14, top: 5, bottom: 18 };
    const gap = 5;
    const plotWidth = width - margin.left - margin.right;
    const laneHeight = (height - margin.top - margin.bottom - gap * 2) / 3;
    const cutoff = now - RAW_WINDOW_MS;
    const lanes = [
      { key: "pressure", label: "PRESSURE Σ6ch", unit: "ADC", floor: 10000 },
      { key: "acc", label: "ACC magnitude", unit: "G", floor: 2 },
      { key: "gyro", label: "GYRO magnitude", unit: "deg/s", floor: 200 }
    ];

    ctx.font = "600 8px Inter, system-ui, sans-serif";
    ctx.lineWidth = 1;

    lanes.forEach((lane, laneIndex) => {
      const top = margin.top + laneIndex * (laneHeight + gap);
      const bottom = top + laneHeight;
      let observedMax = lane.floor;
      for (const side of SIDES) {
        for (const point of state.raw[side]) {
          const value = Metrics.finite(point[lane.key]);
          if (point.t >= cutoff && value !== null) observedMax = Math.max(observedMax, value);
        }
      }
      const scaleMax = niceMaximum(observedMax * 1.08);

      ctx.fillStyle = laneIndex % 2 === 0 ? "#0d1820" : "#0c161d";
      ctx.fillRect(margin.left, top, plotWidth, laneHeight);

      ctx.strokeStyle = "rgba(166, 192, 205, 0.14)";
      for (let division = 0; division <= 4; division += 1) {
        const y = top + (laneHeight * division) / 4;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
      }
      for (let seconds = 0; seconds <= 10; seconds += 2) {
        const x = margin.left + (seconds / 10) * plotWidth;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }

      ctx.fillStyle = "#aabcc6";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(lane.label, margin.left + 7, top + 3);
      ctx.fillStyle = "#657986";
      ctx.fillText(lane.unit, margin.left + 7, top + 13);
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(scaleMax >= 1000 ? scaleMax.toLocaleString("en-US") : String(scaleMax), margin.left - 10, top + 2);
      ctx.textBaseline = "bottom";
      ctx.fillText("0", margin.left - 10, bottom - 2);

      for (const side of SIDES) {
        const points = state.raw[side];
        ctx.strokeStyle = SIDE_COLORS[side];
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        let drawing = false;
        for (const point of points) {
          if (point.t < cutoff) continue;
          const value = Metrics.finite(point[lane.key]);
          if (value === null) {
            drawing = false;
            continue;
          }
          const x = margin.left + ((point.t - cutoff) / RAW_WINDOW_MS) * plotWidth;
          const y = bottom - Math.min(1, Math.max(0, value / scaleMax)) * laneHeight;
          if (!drawing) {
            ctx.moveTo(x, y);
            drawing = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    });

    ctx.fillStyle = "#657986";
    ctx.textBaseline = "bottom";
    ctx.textAlign = "center";
    for (let seconds = 0; seconds <= 10; seconds += 2) {
      const x = margin.left + (seconds / 10) * plotWidth;
      ctx.fillText(`${seconds - 10}s`, x, height - 5);
    }

    if (!hasData) {
      ctx.fillStyle = "rgba(220, 232, 238, 0.72)";
      ctx.font = "700 10px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t("rawEmpty"), width / 2, height / 2);
    }

    state.dom.rawRate.textContent =
      `Plot: L ${rawRate("left", now)} Hz / R ${rawRate("right", now)} Hz`;
    state.chartDirty = false;
    state.lastChartDraw = now;
  }

  function animationLoop() {
    const now = nowMs();
    updateStepHealth(now);
    if (state.stepTrendDirty) drawStepTrendChart();
    if (state.chartDirty || now - state.lastChartDraw > 120) drawRawChart(now);
    root.requestAnimationFrame(animationLoop);
  }

  function refreshLanguage() {
    buildTable();
    renderSide("left");
    renderSide("right");
    state.dom.demoToggle.innerHTML = state.demo.running
      ? t("demoStopHtml")
      : t("demoPlayHtml");
    state.dom.lastStepTime.textContent = state.lastStepAt === null
      ? "—"
      : new Date(state.lastStepAt).toLocaleTimeString(locale(), { hour12: false });

    if (
      state.sourceCopy
      && ["sourceConnectTitle", "sourceLiveTitle"].includes(state.sourceCopy.titleKey)
    ) {
      updateConnectionSource();
    } else {
      refreshSourceCopy();
    }
    state.stepTrendDirty = true;
    state.chartDirty = true;
  }

  function bindEvents() {
    state.dom.demoToggle.addEventListener("click", toggleDemo);
    state.dom.clearButton.addEventListener("click", () => clearData());
    state.dom.csvButton.addEventListener("click", downloadStepCsv);
    root.addEventListener("step-analysis:languagechange", refreshLanguage);
    root.addEventListener("resize", () => {
      state.stepTrendDirty = true;
      state.chartDirty = true;
    });
    if (typeof root.ResizeObserver === "function") {
      const observer = new root.ResizeObserver(() => {
        state.stepTrendDirty = true;
        state.chartDirty = true;
      });
      observer.observe(state.dom.stepTrendChart);
      observer.observe(state.dom.rawChart);
    }
  }

  function init() {
    cacheDom();
    buildTable();
    bindEvents();
    DEVICE_IDS.forEach(installDevice);
    updateSideMeta();
    updateConnectionSource();
    root.requestAnimationFrame(animationLoop);
    const demoParam = new URLSearchParams(root.location.search).get("demo");
    if (demoParam !== "0") startDemo();
  }

  root.StepAnalysisLive = {
    state,
    handleStepRow,
    handleStepPacket,
    startDemo,
    stopDemo,
    clearData,
    refreshLanguage
  };
  document.addEventListener("DOMContentLoaded", init);
})(typeof globalThis !== "undefined" ? globalThis : window);
