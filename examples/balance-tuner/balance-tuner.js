(function attachBalanceTuner(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.BalanceTuner = api;
  if (root.document) {
    root.addEventListener("DOMContentLoaded", () => api.initApp());
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createBalanceTunerApi(root) {
  "use strict";

  const SIDE_LEFT = "left";
  const SIDE_RIGHT = "right";
  const SENSOR_COUNT = 6;
  const MIN_LOAD = 1;
  const MAX_SENSOR_VALUE = 8192;
  const TRACE_WINDOW_MS = 30000;
  const MAX_TRACE_SAMPLES = 2400;
  const FOOT_CENTER_X = {
    [SIDE_LEFT]: -0.28,
    [SIDE_RIGHT]: 0.28
  };
  const FOOT_LOCAL_X_RANGE = 0.58;
  const FOOT_LOCAL_Y_RANGE = 0.9;
  const AUDIO_MODES = {
    tuner: "tuner",
    harmony: "harmony"
  };

  // 圧力チャネルの画像座標は SDK の共通定義（OrpheInsoleUtils.SENSOR_LAYOUT_IMAGE）を正とする。
  // Node（テスト）では require、ブラウザでは script タグのグローバルから解決する。
  const InsoleUtils = root.OrpheInsoleUtils ||
    (typeof require === "function" ? require("../../src/InsoleUtils.js") : null);
  if (!InsoleUtils) {
    throw new Error('balance-tuner: InsoleUtils.js を先に読み込んでください（<script src="../../src/InsoleUtils.js"></script>）');
  }
  const SensorLayout = InsoleUtils.SENSOR_LAYOUT_IMAGE.map(
    (sensor) => createSensorPoint(sensor.x, sensor.y, sensor.label)
  );

  const appState = {
    runningDemo: true,
    selectedMode: 4,
    audioMode: AUDIO_MODES.tuner,
    audioEnabled: false,
    audioUnsupported: false,
    statusMessage: "",
    statusMessageUntil: 0,
    centerOffset: { x: 0, y: 0 },
    samples: [],
    latest: null,
    feet: {
      [SIDE_LEFT]: createFootStore(SIDE_LEFT),
      [SIDE_RIGHT]: createFootStore(SIDE_RIGHT)
    },
    devices: [],
    dom: {},
    audio: null
  };

  function createSensorPoint(imageX, imageY, label) {
    return {
      x: (imageX - 0.5) * FOOT_LOCAL_X_RANGE,
      y: (0.5 - imageY) * FOOT_LOCAL_Y_RANGE,
      imageX,
      imageY,
      label
    };
  }

  function createFootStore(side) {
    return {
      side,
      connected: false,
      lastTimestamp: 0,
      lastLocalTime: 0,
      values: new Array(SENSOR_COUNT).fill(0),
      load: 0,
      local: null,
      global: null,
      valid: false,
      issues: []
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(from, to, ratio) {
    return from + (to - from) * ratio;
  }

  function nowMs() {
    return root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now();
  }

  function validatePressureValues(values) {
    const issues = [];
    if (!Array.isArray(values) || values.length < SENSOR_COUNT) {
      return {
        valid: false,
        values: new Array(SENSOR_COUNT).fill(0),
        issues: ["missing pressure channels"]
      };
    }

    const normalized = values.slice(0, SENSOR_COUNT).map((value, index) => {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        issues.push(`P${index} is not finite`);
        return 0;
      }
      if (numericValue < 0) {
        issues.push(`P${index} is negative`);
        return 0;
      }
      if (numericValue > MAX_SENSOR_VALUE) {
        issues.push(`P${index} is above expected raw range`);
      }
      return clamp(numericValue, 0, MAX_SENSOR_VALUE);
    });

    return {
      valid: issues.length === 0,
      values: normalized,
      issues
    };
  }

  function footLocalToGlobal(side, point) {
    const direction = side === SIDE_LEFT ? -1 : 1;
    return {
      x: FOOT_CENTER_X[side] + point.x * direction,
      y: point.y
    };
  }

  function footLocalToImage(point) {
    return {
      x: clamp(point.x / FOOT_LOCAL_X_RANGE + 0.5, 0, 1),
      y: clamp(0.5 - point.y / FOOT_LOCAL_Y_RANGE, 0, 1)
    };
  }

  function computeFootState(values, side) {
    const validation = validatePressureValues(values);
    const load = validation.values.reduce((sum, value) => sum + value, 0);
    if (load < MIN_LOAD) {
      return {
        side,
        valid: false,
        load,
        local: null,
        global: null,
        values: validation.values,
        issues: validation.issues.concat(["load below threshold"])
      };
    }

    const local = SensorLayout.reduce((point, sensor, index) => {
      const weight = validation.values[index] / load;
      point.x += sensor.x * weight;
      point.y += sensor.y * weight;
      return point;
    }, { x: 0, y: 0 });

    return {
      side,
      valid: validation.issues.length === 0,
      load,
      local,
      global: footLocalToGlobal(side, local),
      values: validation.values,
      issues: validation.issues
    };
  }

  function combineFootStates(leftFoot, rightFoot, centerOffset) {
    const usableFeet = [leftFoot, rightFoot].filter((foot) => foot && foot.global && foot.load >= MIN_LOAD);
    const totalLoad = usableFeet.reduce((sum, foot) => sum + foot.load, 0);
    if (!usableFeet.length || totalLoad < MIN_LOAD) {
      return null;
    }

    const raw = usableFeet.reduce((point, foot) => {
      point.x += foot.global.x * foot.load / totalLoad;
      point.y += foot.global.y * foot.load / totalLoad;
      return point;
    }, { x: 0, y: 0 });
    const leftLoad = leftFoot && Number.isFinite(leftFoot.load) ? leftFoot.load : 0;
    const rightLoad = rightFoot && Number.isFinite(rightFoot.load) ? rightFoot.load : 0;
    const bothLoads = leftLoad + rightLoad;

    return {
      x: raw.x - centerOffset.x,
      y: raw.y - centerOffset.y,
      rawX: raw.x,
      rawY: raw.y,
      totalLoad,
      leftLoad,
      rightLoad,
      leftRatio: bothLoads > 0 ? leftLoad / bothLoads : 0.5,
      paired: Boolean(leftFoot && rightFoot && leftFoot.load >= MIN_LOAD && rightFoot.load >= MIN_LOAD)
    };
  }

  function mapSonification(centerState, mode) {
    const state = centerState || {
      x: 0,
      y: 0,
      rawX: 0,
      rawY: 0,
      leftRatio: 0.5,
      totalLoad: 0,
      paired: false
    };
    const x = clamp(Number(state.x) || 0, -0.45, 0.45);
    const y = clamp(Number(state.y) || 0, -0.42, 0.42);
    const leftRatio = clamp(Number(state.leftRatio) || 0.5, 0, 1);
    const balanceError = clamp(Math.abs(leftRatio - 0.5) * 2, 0, 1);
    const centerDistance = clamp(Math.hypot(x / 0.36, y / 0.34), 0, 1);
    const pan = clamp(x / 0.38, -1, 1);
    const selectedMode = mode === AUDIO_MODES.harmony ? AUDIO_MODES.harmony : AUDIO_MODES.tuner;

    if (selectedMode === AUDIO_MODES.harmony) {
      const tension = balanceError;
      const rootFrequency = clamp(174 + y * 80, 132, 240);
      const intervals = [
        1,
        lerp(1.25, 1.06, tension),
        lerp(1.5, 1.4142, tension),
        lerp(2, 1.92, tension)
      ];
      return {
        mode: selectedMode,
        label: tension < 0.18 ? "協和音" : tension < 0.52 ? "少し濁る" : "不協和",
        tension,
        balanceError,
        centerDistance,
        pan,
        frequencies: intervals.map((interval) => rootFrequency * interval),
        gains: [0.34, 0.24, 0.2, 0.11],
        detunes: [0, -4 - tension * 18, 4 + tension * 28, tension * 14],
        wobbleRate: 0.28 + tension * 7.8,
        wobbleDepth: 0.0008 + tension * 0.015,
        filterFrequency: lerp(2100, 760, tension),
        colorRatio: tension
      };
    }

    const tension = centerDistance;
    const rootFrequency = clamp(196 + y * 92 + pan * 10, 150, 270);
    const intervals = [
      1,
      lerp(1.25, 1.214, tension),
      lerp(1.5, 1.46, tension),
      lerp(2, 1.96, tension)
    ];
    return {
      mode: selectedMode,
      label: tension < 0.2 ? "澄んだ和音" : tension < 0.55 ? "揺れた和音" : "濁った揺れ",
      tension,
      balanceError,
      centerDistance,
      pan,
      frequencies: intervals.map((interval) => rootFrequency * interval),
      gains: [0.32, 0.22, 0.18, 0.12],
      detunes: [0, -2 - tension * 12, 3 + tension * 18, tension * 10],
      wobbleRate: 0.22 + tension * 6.5,
      wobbleDepth: 0.0006 + tension * 0.012,
      filterFrequency: lerp(2600, 940, tension),
      colorRatio: tension
    };
  }

  function generateFootPressureFromTarget(localTarget, targetLoad, phase) {
    const sigmaX = 0.17;
    const sigmaY = 0.27;
    const weights = SensorLayout.map((sensor, index) => {
      const dx = (sensor.x - localTarget.x) / sigmaX;
      const dy = (sensor.y - localTarget.y) / sigmaY;
      const pulse = 0.05 * Math.sin(phase + index * 1.7);
      return 0.12 + Math.exp(-0.5 * (dx * dx + dy * dy)) + pulse;
    });
    const sum = weights.reduce((total, weight) => total + Math.max(0.01, weight), 0);
    return weights.map((weight, index) => {
      const breathing = 1 + 0.03 * Math.sin(phase * 0.77 + index * 0.9);
      return Math.max(0, Math.round(targetLoad * Math.max(0.01, weight) / sum * breathing));
    });
  }

  function generateDemoFrame(timeSeconds) {
    const swayX = 0.13 * Math.sin(timeSeconds * 0.42) + 0.035 * Math.sin(timeSeconds * 1.7 + 0.8);
    const swayY = 0.09 * Math.sin(timeSeconds * 0.37 + 1.6) + 0.028 * Math.sin(timeSeconds * 1.25);
    const globalTarget = {
      x: clamp(swayX, -0.36, 0.36),
      y: clamp(swayY, -0.32, 0.32)
    };
    const totalLoad = 6600 + 360 * Math.sin(timeSeconds * 0.51);
    const leftRatio = clamp(0.5 - globalTarget.x * 0.76 + 0.035 * Math.sin(timeSeconds * 0.28), 0.12, 0.88);
    const leftLoad = totalLoad * leftRatio;
    const rightLoad = totalLoad - leftLoad;
    const leftLocal = {
      x: clamp((globalTarget.x - FOOT_CENTER_X[SIDE_LEFT]) * -0.34, -0.18, 0.18),
      y: clamp(globalTarget.y + 0.018 * Math.sin(timeSeconds * 0.9), -0.26, 0.26)
    };
    const rightLocal = {
      x: clamp((globalTarget.x - FOOT_CENTER_X[SIDE_RIGHT]) * 0.34, -0.18, 0.18),
      y: clamp(globalTarget.y + 0.018 * Math.cos(timeSeconds * 0.8), -0.26, 0.26)
    };

    return {
      [SIDE_LEFT]: generateFootPressureFromTarget(leftLocal, leftLoad, timeSeconds),
      [SIDE_RIGHT]: generateFootPressureFromTarget(rightLocal, rightLoad, timeSeconds + 0.9)
    };
  }

  class BalanceAudioEngine {
    constructor(hostRoot) {
      this.root = hostRoot;
      this.context = null;
      this.master = null;
      this.filter = null;
      this.panner = null;
      this.voices = [];
      this.enabled = false;
      this.volume = 0.55;
      this.unsupported = false;
    }

    ensure() {
      if (this.context || this.unsupported) {
        return Boolean(this.context);
      }
      const AudioContextClass = this.root.AudioContext || this.root.webkitAudioContext;
      if (typeof AudioContextClass !== "function") {
        this.unsupported = true;
        return false;
      }

      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.filter = this.context.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 1800;
      this.filter.Q.value = 0.75;
      this.panner = typeof this.context.createStereoPanner === "function" ? this.context.createStereoPanner() : null;

      if (this.panner) {
        this.filter.connect(this.panner);
        this.panner.connect(this.master);
      } else {
        this.filter.connect(this.master);
      }
      this.master.connect(this.context.destination);

      const waveTypes = ["sine", "triangle", "sine", "triangle"];
      this.voices = waveTypes.map((type) => {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = type;
        oscillator.frequency.value = 220;
        gain.gain.value = 0;
        oscillator.connect(gain);
        gain.connect(this.filter);
        oscillator.start();
        return { oscillator, gain };
      });
      return true;
    }

    async setEnabled(enabled) {
      if (enabled && !this.ensure()) {
        return false;
      }
      this.enabled = enabled;
      if (this.context && this.context.state === "suspended") {
        await this.context.resume();
      }
      this.applyMasterGain();
      return true;
    }

    setVolume(volume) {
      this.volume = clamp(volume, 0, 1);
      this.applyMasterGain();
    }

    applyMasterGain() {
      if (!this.master || !this.context) {
        return;
      }
      const target = this.enabled ? this.volume * 0.22 : 0;
      this.master.gain.setTargetAtTime(target, this.context.currentTime, 0.08);
    }

    update(params, timestampMs) {
      if (!this.context || !this.enabled || !params) {
        return;
      }
      const time = this.context.currentTime;
      const modulationTime = timestampMs / 1000;
      if (this.panner) {
        this.panner.pan.setTargetAtTime(params.pan, time, 0.06);
      }
      this.filter.frequency.setTargetAtTime(params.filterFrequency, time, 0.08);

      this.voices.forEach((voice, index) => {
        const baseFrequency = params.frequencies[index] || params.frequencies[0] || 220;
        const wobble = 1 + Math.sin(modulationTime * params.wobbleRate + index * 1.27) * params.wobbleDepth;
        voice.oscillator.frequency.setTargetAtTime(baseFrequency * wobble, time, 0.035);
        voice.oscillator.detune.setTargetAtTime(params.detunes[index] || 0, time, 0.05);
        voice.gain.gain.setTargetAtTime(params.gains[index] || 0.1, time, 0.06);
      });
    }
  }

  function initApp() {
    const documentRef = root.document;
    if (!documentRef) {
      return;
    }

    appState.dom = {
      canvas: documentRef.getElementById("tuner-canvas"),
      sourceBadge: documentRef.getElementById("source-badge"),
      pairBadge: documentRef.getElementById("pair-badge"),
      audioBadge: documentRef.getElementById("audio-badge"),
      modeTuner: documentRef.getElementById("mode-tuner"),
      modeHarmony: documentRef.getElementById("mode-harmony"),
      audioToggle: documentRef.getElementById("audio-toggle"),
      volumeSlider: documentRef.getElementById("volume-slider"),
      centerButton: documentRef.getElementById("center-button"),
      demoToggle: documentRef.getElementById("demo-toggle"),
      centerReadout: documentRef.getElementById("center-readout"),
      loadReadout: documentRef.getElementById("load-readout"),
      soundReadout: documentRef.getElementById("sound-readout"),
      streamingMode: documentRef.getElementById("streaming-mode"),
      toolkitPlaceholder: documentRef.getElementById("toolkit-placeholder"),
      leftFootMap: documentRef.getElementById("left-foot-map"),
      rightFootMap: documentRef.getElementById("right-foot-map"),
      leftLoad: documentRef.getElementById("left-load"),
      rightLoad: documentRef.getElementById("right-load"),
      leftVerticalMeter: documentRef.getElementById("left-vertical-meter"),
      rightVerticalMeter: documentRef.getElementById("right-vertical-meter"),
      leftMeterReadout: documentRef.getElementById("left-meter-readout"),
      rightMeterReadout: documentRef.getElementById("right-meter-readout")
    };

    if (!appState.dom.canvas) {
      return;
    }

    appState.audio = new BalanceAudioEngine(root);
    appState.audioUnsupported = typeof root.AudioContext !== "function" && typeof root.webkitAudioContext !== "function";
    setupFootMap(appState.dom.leftFootMap, SIDE_LEFT);
    setupFootMap(appState.dom.rightFootMap, SIDE_RIGHT);
    setupEvents();
    setupDevices();
    updateBadges();
    updateModeButtons();
    root.requestAnimationFrame(animationLoop);
  }

  function setupEvents() {
    const dom = appState.dom;
    dom.modeTuner.addEventListener("click", () => selectMode(AUDIO_MODES.tuner, true));
    dom.modeHarmony.addEventListener("click", () => selectMode(AUDIO_MODES.harmony, true));
    dom.audioToggle.addEventListener("click", () => toggleAudio());
    dom.volumeSlider.addEventListener("input", () => {
      if (appState.audio) {
        appState.audio.setVolume(Number(dom.volumeSlider.value) / 100);
      }
    });
    dom.centerButton.addEventListener("click", () => calibrateCenter());
    dom.demoToggle.addEventListener("click", () => {
      appState.runningDemo = !appState.runningDemo;
      updateBadges();
    });
    dom.streamingMode.addEventListener("change", () => {
      appState.selectedMode = Number(dom.streamingMode.value);
      appState.devices.forEach((deviceState) => applyStreamingMode(deviceState));
    });
    root.addEventListener("resize", () => drawScene(nowMs()));
  }

  function setupFootMap(container, side) {
    if (!container) {
      return;
    }
    container.innerHTML = "";
    const centerMarker = root.document.createElement("div");
    centerMarker.className = "foot-estimated-center";
    centerMarker.setAttribute("aria-hidden", "true");
    container.appendChild(centerMarker);

    SensorLayout.forEach((sensor, index) => {
      const dot = root.document.createElement("div");
      dot.className = "sensor-dot";
      dot.dataset.index = String(index);
      dot.style.left = `${sensor.imageX * 100}%`;
      dot.style.top = `${sensor.imageY * 100}%`;
      dot.innerHTML = `<span>${sensor.label}</span><small>0</small>`;
      container.appendChild(dot);
    });

    container.dataset.side = side;
  }

  function setupDevices() {
    const toolkitInsoles = Array.isArray(root.insoles) ? root.insoles : (typeof insoles !== "undefined" && Array.isArray(insoles) ? insoles : null);
    const toolkitBles = toolkitInsoles || (Array.isArray(root.bles) ? root.bles : (typeof bles !== "undefined" && Array.isArray(bles) ? bles : null));
    const insoleBuilder = typeof root.buildInsoleToolkit === "function" ? root.buildInsoleToolkit : (typeof buildInsoleToolkit !== "undefined" ? buildInsoleToolkit : null);
    const coreBuilder = typeof root.buildCoreToolkit === "function" ? root.buildCoreToolkit : (typeof buildCoreToolkit !== "undefined" ? buildCoreToolkit : null);
    const toolkitBuilder = insoleBuilder || coreBuilder;
    if (!toolkitBles || typeof toolkitBuilder !== "function") {
      renderToolkitMessage("InsoleToolkit を読み込めません。src/ORPHE-INSOLE.js と src/InsoleToolkit.js を確認してください。");
      return;
    }

    appState.devices = [0, 1].map((deviceIndex) => {
      const instance = toolkitBles[deviceIndex];
      const deviceState = {
        index: deviceIndex,
        insole: instance,
        connected: false,
        side: deviceIndex === 0 ? SIDE_LEFT : SIDE_RIGHT
      };

      instance.setup();
      instance.onConnect = () => {
        deviceState.connected = true;
        appState.runningDemo = false;
        updateBadges();
        refreshToolkitButton(deviceIndex);
      };
      instance.onDisconnect = () => {
        deviceState.connected = false;
        appState.feet[deviceState.side].connected = false;
        updateBadges();
        refreshToolkitButton(deviceIndex);
      };
      instance.onClear = () => {
        deviceState.connected = false;
        appState.feet[deviceState.side].connected = false;
        updateBadges();
        refreshToolkitButton(deviceIndex);
      };
      instance.onStartNotify = () => {
        applyStreamingMode(deviceState);
      };
      instance.onError = (error) => {
        if (isConnectionCancelError(error)) {
          showTransientStatus("接続キャンセル");
        } else {
          console.error("BalanceTuner connection error:", error);
          showTransientStatus("接続エラー");
        }
        root.setTimeout(() => refreshToolkitButton(deviceIndex), 0);
      };
      instance.gotPress = (press) => {
        const side = resolveDeviceSide(deviceState);
        updateFootPressure(side, press.values, press.timestamp || nowMs(), true);
      };

      const toolkitOptions = { streamingMode: appState.selectedMode, autoReconnect: true };
      if (toolkitBuilder === insoleBuilder) {
        toolkitBuilder(appState.dom.toolkitPlaceholder, `INSOLE 0${deviceIndex + 1}`, deviceIndex, toolkitOptions);
      } else {
        toolkitBuilder(appState.dom.toolkitPlaceholder, `INSOLE 0${deviceIndex + 1}`, deviceIndex, "SENSOR_VALUES", toolkitOptions);
      }
      enhanceToolkitControl(deviceIndex);
      return deviceState;
    });
  }

  function renderToolkitMessage(message) {
    if (appState.dom.toolkitPlaceholder) {
      appState.dom.toolkitPlaceholder.innerHTML = `<div class="toolkit-message">${message}</div>`;
    }
  }

  function isConnectionCancelError(error) {
    const message = error && error.message ? error.message : String(error || "");
    return Boolean(error && error.name === "NotFoundError") || /cancelled|canceled|chooser/i.test(message);
  }

  function showTransientStatus(message, durationMs) {
    appState.statusMessage = message;
    appState.statusMessageUntil = nowMs() + (durationMs || 1800);
    updateBadges();
  }

  function enhanceToolkitControl(deviceIndex) {
    const control = root.document.getElementById(`insole_toolkit${deviceIndex}`) || root.document.getElementById(`core_toolkit${deviceIndex}`);
    const input = root.document.getElementById(`switch_ble${deviceIndex}`);
    const label = control ? control.querySelector(".form-check-label") : null;
    if (!control || !input || !label) {
      return;
    }

    control.classList.add("toolkit-connect-control");
    label.setAttribute("for", input.id);
    label.innerHTML = `<strong>INSOLE 0${deviceIndex + 1}</strong><small>connect</small>`;
    input.addEventListener("change", () => refreshToolkitButton(deviceIndex));
    refreshToolkitButton(deviceIndex);
  }

  function refreshToolkitButton(deviceIndex) {
    const control = root.document.getElementById(`insole_toolkit${deviceIndex}`) || root.document.getElementById(`core_toolkit${deviceIndex}`);
    const input = root.document.getElementById(`switch_ble${deviceIndex}`);
    if (!control || !input) {
      return;
    }
    const labelSmall = control.querySelector(".form-check-label small");
    if (labelSmall) {
      labelSmall.textContent = input.checked ? "disconnect" : "connect";
    }
    control.classList.toggle("is-connected", input.checked);
  }

  async function applyStreamingMode(deviceState) {
    if (!deviceState || !deviceState.connected || !deviceState.insole || typeof deviceState.insole.setDataStreamingMode !== "function") {
      return;
    }
    try {
      await deviceState.insole.setDataStreamingMode(appState.selectedMode);
    } catch (error) {
      console.error("BalanceTuner mode change failed:", error);
    }
  }

  function resolveDeviceSide(deviceState) {
    const deviceInfo = deviceState.insole && deviceState.insole.device_information;
    if (deviceInfo && Number.isFinite(deviceInfo.mount_position)) {
      deviceState.side = (deviceInfo.mount_position & 1) === 0 ? SIDE_LEFT : SIDE_RIGHT;
    }
    return deviceState.side;
  }

  function updateFootPressure(side, values, timestamp, live) {
    const footState = computeFootState(values, side);
    const store = appState.feet[side];
    Object.assign(store, footState, {
      connected: Boolean(live),
      lastTimestamp: timestamp,
      lastLocalTime: nowMs()
    });
    appendCombinedSample(timestamp);
  }

  function appendCombinedSample(timestamp) {
    const localTime = nowMs();
    const leftFoot = isFootFresh(appState.feet[SIDE_LEFT], localTime) ? appState.feet[SIDE_LEFT] : null;
    const rightFoot = isFootFresh(appState.feet[SIDE_RIGHT], localTime) ? appState.feet[SIDE_RIGHT] : null;
    const combined = combineFootStates(leftFoot, rightFoot, appState.centerOffset);
    if (!combined) {
      return;
    }

    const sample = {
      timestamp,
      localTime,
      center: { x: combined.x, y: combined.y },
      rawCenter: { x: combined.rawX, y: combined.rawY },
      totalLoad: combined.totalLoad,
      leftLoad: combined.leftLoad,
      rightLoad: combined.rightLoad,
      leftRatio: combined.leftRatio,
      paired: combined.paired
    };

    appState.latest = combined;
    appState.samples.push(sample);
    const cutoff = localTime - TRACE_WINDOW_MS;
    while (appState.samples.length > MAX_TRACE_SAMPLES || (appState.samples[0] && appState.samples[0].localTime < cutoff)) {
      appState.samples.shift();
    }
  }

  function isFootFresh(foot, localTime) {
    return Boolean(foot && foot.global && foot.load >= MIN_LOAD && localTime - foot.lastLocalTime < 700);
  }

  function selectMode(mode, shouldStartAudio) {
    appState.audioMode = mode === AUDIO_MODES.harmony ? AUDIO_MODES.harmony : AUDIO_MODES.tuner;
    updateModeButtons();
    if (shouldStartAudio && !appState.audioEnabled) {
      toggleAudio(true);
    }
  }

  async function toggleAudio(forceOn) {
    const nextEnabled = typeof forceOn === "boolean" ? forceOn : !appState.audioEnabled;
    if (!appState.audio || appState.audioUnsupported) {
      appState.audioEnabled = false;
      updateBadges();
      return;
    }
    let ok = false;
    try {
      ok = await appState.audio.setEnabled(nextEnabled);
    } catch (error) {
      console.warn("BalanceTuner audio start failed:", error);
      ok = false;
    }
    appState.audioUnsupported = !ok && nextEnabled;
    appState.audioEnabled = ok ? nextEnabled : false;
    updateBadges();
  }

  function calibrateCenter() {
    if (!appState.latest) {
      return;
    }
    appState.centerOffset = {
      x: appState.latest.rawX,
      y: appState.latest.rawY
    };
    appState.samples = [];
  }

  function updateModeButtons() {
    const isTuner = appState.audioMode === AUDIO_MODES.tuner;
    appState.dom.modeTuner.classList.toggle("is-active", isTuner);
    appState.dom.modeHarmony.classList.toggle("is-active", !isTuner);
    appState.dom.modeTuner.setAttribute("aria-pressed", String(isTuner));
    appState.dom.modeHarmony.setAttribute("aria-pressed", String(!isTuner));
    if (root.document && root.document.body) {
      root.document.body.dataset.sonificationMode = appState.audioMode;
    }
  }

  function updateBadges() {
    const currentTime = nowMs();
    const liveConnected = appState.devices.some((deviceState) => deviceState.connected);
    const leftFresh = isFootFresh(appState.feet[SIDE_LEFT], currentTime);
    const rightFresh = isFootFresh(appState.feet[SIDE_RIGHT], currentTime);
    appState.dom.sourceBadge.textContent = appState.runningDemo ? "DEMO" : liveConnected ? "LIVE" : "WAIT";
    appState.dom.sourceBadge.classList.toggle("is-live", liveConnected && !appState.runningDemo);
    appState.dom.pairBadge.textContent = appState.statusMessage && currentTime < appState.statusMessageUntil ? appState.statusMessage : leftFresh && rightFresh ? "左右入力" : leftFresh || rightFresh ? "片足入力" : "入力待機";
    appState.dom.pairBadge.classList.toggle("is-live", leftFresh || rightFresh);
    appState.dom.audioBadge.textContent = appState.audioUnsupported ? "Audio unsupported" : appState.audioEnabled ? "Audio on" : "Audio off";
    appState.dom.audioBadge.classList.toggle("is-live", appState.audioEnabled);
    appState.dom.audioToggle.textContent = appState.audioUnsupported ? "Audio unsupported" : appState.audioEnabled ? "音を止める" : "音を開始";
    appState.dom.audioToggle.disabled = appState.audioUnsupported;
    appState.dom.demoToggle.textContent = appState.runningDemo ? "Demo on" : "Demo off";
  }

  function animationLoop(timestamp) {
    if (appState.runningDemo) {
      const frame = generateDemoFrame(timestamp / 1000);
      updateFootPressure(SIDE_LEFT, frame[SIDE_LEFT], timestamp, false);
      updateFootPressure(SIDE_RIGHT, frame[SIDE_RIGHT], timestamp, false);
    }

    drawScene(timestamp);
    updateFootMaps();
    updateReadouts(timestamp);
    if (appState.audio) {
      appState.audio.update(mapSonification(appState.latest, appState.audioMode), timestamp);
    }
    root.requestAnimationFrame(animationLoop);
  }

  function prepareCanvas(canvas) {
    const dpr = root.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { context, width: rect.width, height: rect.height };
  }

  function drawScene(timestamp) {
    const canvas = appState.dom.canvas;
    const { context, width, height } = prepareCanvas(canvas);
    const sound = mapSonification(appState.latest, appState.audioMode);
    context.clearRect(0, 0, width, height);
    drawStageBackground(context, width, height, timestamp, sound);
    drawTrace(context, width, height);
    drawCurrentPoint(context, width, height, timestamp, sound);
    drawLoadMeters(context, width, height);
  }

  function drawStageBackground(context, width, height, timestamp, sound) {
    context.fillStyle = "#040504";
    context.fillRect(0, 0, width, height);

    const center = getSceneCenter(width, height);
    const scale = getSceneScale(width, height);
    const targetScore = clamp(1 - sound.tension, 0, 1);
    const harmonyScore = clamp(1 - sound.balanceError, 0, 1);

    context.save();
    context.translate(center.x, center.y);
    context.strokeStyle = "rgba(238, 245, 235, 0.1)";
    context.lineWidth = 1;
    for (let ring = 1; ring <= 5; ring += 1) {
      context.beginPath();
      context.ellipse(0, 0, scale * ring / 5, scale * ring / 5, 0, 0, Math.PI * 2);
      context.stroke();
    }

    context.strokeStyle = "rgba(64, 224, 208, 0.28)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(-scale, 0);
    context.lineTo(scale, 0);
    context.moveTo(0, -scale);
    context.lineTo(0, scale);
    context.stroke();

    if (appState.audioMode === AUDIO_MODES.harmony) {
      drawHarmonyTarget(context, scale, timestamp, harmonyScore);
    } else {
      drawTunerTarget(context, scale, timestamp, targetScore);
    }
    context.restore();

    context.fillStyle = "rgba(231, 242, 236, 0.72)";
    context.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText("CENTER", center.x + 12, center.y - 12);
    context.fillText("LEFT", Math.max(24, center.x - scale - 2), center.y - 10);
    context.fillText("RIGHT", Math.min(width - 70, center.x + scale - 36), center.y - 10);
    context.fillText("TOE", center.x + 12, center.y - scale + 18);
    context.fillText("HEEL", center.x + 12, center.y + scale - 10);
  }

  function drawTunerTarget(context, scale, timestamp, targetScore) {
    const wave = (timestamp * 0.00018) % 1;
    const brightness = 0.16 + targetScore * 0.56;

    for (let index = 0; index < 5; index += 1) {
      const phase = (wave + index * 0.2) % 1;
      const radius = scale * (0.1 + phase * 0.34);
      const alpha = (1 - phase) * brightness;
      context.strokeStyle = `rgba(238, 255, 244, ${alpha})`;
      context.lineWidth = 1 + targetScore * 2.4;
      context.setLineDash([]);
      context.beginPath();
      context.ellipse(0, 0, radius, radius, 0, 0, Math.PI * 2);
      context.stroke();
    }

    context.fillStyle = `rgba(238, 255, 244, ${0.05 + targetScore * 0.16})`;
    context.beginPath();
    context.arc(0, 0, scale * (0.12 + targetScore * 0.06), 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = `rgba(64, 224, 208, ${0.28 + targetScore * 0.46})`;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, scale * 0.18, 0, Math.PI * 2);
    context.stroke();
  }

  function drawHarmonyTarget(context, scale, timestamp, harmonyScore) {
    const glow = 0.18 + harmonyScore * 0.54;
    const beat = 0.5 + 0.5 * Math.sin(timestamp * 0.0035);
    const columnHeight = scale * 1.28;
    const columnWidth = Math.max(12, scale * 0.07);
    const gap = scale * 0.22;

    [-1, 1].forEach((side) => {
      const x = side * gap;
      const gradient = context.createLinearGradient(x, -columnHeight / 2, x, columnHeight / 2);
      gradient.addColorStop(0, `rgba(64, 224, 208, ${0.08 + harmonyScore * 0.18})`);
      gradient.addColorStop(0.5, `rgba(238, 255, 244, ${0.12 + harmonyScore * 0.24})`);
      gradient.addColorStop(1, `rgba(246, 197, 90, ${0.08 + harmonyScore * 0.18})`);
      context.fillStyle = gradient;
      context.fillRect(x - columnWidth / 2, -columnHeight / 2, columnWidth, columnHeight);
      context.strokeStyle = `rgba(238, 255, 244, ${glow})`;
      context.lineWidth = 1.2 + harmonyScore * 1.6;
      context.strokeRect(x - columnWidth / 2, -columnHeight / 2, columnWidth, columnHeight);
    });

    context.strokeStyle = `rgba(238, 255, 244, ${0.22 + harmonyScore * 0.54})`;
    context.lineWidth = 1 + harmonyScore * 2 + beat * harmonyScore;
    context.beginPath();
    context.moveTo(-scale * 0.48, 0);
    context.bezierCurveTo(-scale * 0.22, -scale * 0.08 * (1 - harmonyScore), scale * 0.22, scale * 0.08 * (1 - harmonyScore), scale * 0.48, 0);
    context.stroke();

    context.fillStyle = `rgba(238, 255, 244, ${0.06 + harmonyScore * 0.14})`;
    context.fillRect(-scale * 0.48, -scale * 0.015, scale * 0.96, scale * 0.03);
  }

  function drawTrace(context, width, height) {
    const samples = appState.samples;
    if (samples.length < 2) {
      return;
    }
    context.save();
    context.lineWidth = 2;
    context.lineJoin = "round";
    context.lineCap = "round";
    for (let index = 1; index < samples.length; index += 1) {
      const previous = mapScenePoint(samples[index - 1].center, width, height);
      const current = mapScenePoint(samples[index].center, width, height);
      const ageRatio = index / samples.length;
      context.strokeStyle = `rgba(${Math.round(lerp(70, 246, ageRatio))}, ${Math.round(lerp(180, 212, ageRatio))}, ${Math.round(lerp(160, 88, ageRatio))}, ${0.12 + ageRatio * 0.58})`;
      context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.lineTo(current.x, current.y);
      context.stroke();
    }
    context.restore();
  }

  function drawCurrentPoint(context, width, height, timestamp, sound) {
    const latest = appState.latest || { x: 0, y: 0, leftRatio: 0.5 };
    const point = mapScenePoint(latest, width, height);
    const tension = sound.colorRatio;
    const radius = 13 + tension * 16;
    const pulse = 1 + Math.sin(timestamp * 0.006) * 0.18;
    const red = Math.round(lerp(60, 246, tension));
    const green = Math.round(lerp(224, 91, tension));
    const blue = Math.round(lerp(208, 74, tension));

    context.save();
    context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.15)`;
    context.beginPath();
    context.arc(point.x, point.y, radius * 2.4 * pulse, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(245, 252, 247, 0.92)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(point.x, point.y, radius + 5, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  function drawLoadMeters(context, width, height) {
    const latest = appState.latest || { leftRatio: 0.5, leftLoad: 0, rightLoad: 0 };
    const meterWidth = Math.min(520, width * 0.56);
    const meterHeight = 10;
    const x = (width - meterWidth) / 2;
    const y = height - Math.max(130, height * 0.17);
    const leftRatio = clamp(latest.leftRatio || 0.5, 0, 1);

    context.save();
    context.fillStyle = "rgba(235, 244, 238, 0.13)";
    context.fillRect(x, y, meterWidth, meterHeight);
    context.fillStyle = "#40e0d0";
    context.fillRect(x, y, meterWidth * leftRatio, meterHeight);
    context.fillStyle = "#f6c55a";
    context.fillRect(x + meterWidth * leftRatio, y, meterWidth * (1 - leftRatio), meterHeight);
    context.strokeStyle = "rgba(255, 255, 255, 0.85)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x + meterWidth / 2, y - 8);
    context.lineTo(x + meterWidth / 2, y + meterHeight + 8);
    context.stroke();
    context.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillStyle = "rgba(238, 246, 240, 0.82)";
    context.fillText(`L ${Math.round(leftRatio * 100)}%`, x, y + 32);
    context.fillText(`R ${Math.round((1 - leftRatio) * 100)}%`, x + meterWidth - 48, y + 32);
    context.restore();
  }

  function getSceneCenter(width, height) {
    return {
      x: width / 2,
      y: height * 0.46
    };
  }

  function getSceneScale(width, height) {
    return Math.min(width * 0.34, height * 0.28, 280);
  }

  function mapScenePoint(point, width, height) {
    const center = getSceneCenter(width, height);
    const scale = getSceneScale(width, height);
    return {
      x: center.x + clamp(point.x || 0, -0.45, 0.45) / 0.45 * scale,
      y: center.y - clamp(point.y || 0, -0.42, 0.42) / 0.42 * scale
    };
  }

  function updateFootMaps() {
    updateFootMap(appState.dom.leftFootMap, appState.feet[SIDE_LEFT]);
    updateFootMap(appState.dom.rightFootMap, appState.feet[SIDE_RIGHT]);
    appState.dom.leftLoad.textContent = Math.round(appState.feet[SIDE_LEFT].load).toString();
    appState.dom.rightLoad.textContent = Math.round(appState.feet[SIDE_RIGHT].load).toString();
  }

  function updateFootMap(container, foot) {
    if (!container || !foot) {
      return;
    }
    const dots = container.querySelectorAll(".sensor-dot");
    foot.values.forEach((value, index) => {
      const dot = dots[index];
      if (!dot) {
        return;
      }
      const level = clamp(Math.sqrt(value / MAX_SENSOR_VALUE), 0, 1);
      const red = Math.round(lerp(24, 245, level));
      const green = Math.round(lerp(190, 88, level));
      const blue = Math.round(lerp(176, 62, level));
      const size = 28 + level * 22;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.background = `rgb(${red}, ${green}, ${blue})`;
      dot.style.boxShadow = `0 0 ${12 + level * 22}px rgba(${red}, ${green}, ${blue}, ${0.18 + level * 0.42})`;
      const valueElement = dot.querySelector("small");
      if (valueElement) {
        valueElement.textContent = Math.round(value).toString();
      }
    });

    const marker = container.querySelector(".foot-estimated-center");
    if (marker && foot.local) {
      const imagePoint = footLocalToImage(foot.local);
      marker.style.left = `${imagePoint.x * 100}%`;
      marker.style.top = `${imagePoint.y * 100}%`;
      marker.classList.add("is-visible");
    } else if (marker) {
      marker.classList.remove("is-visible");
    }
  }

  function updateReadouts(timestamp) {
    const latest = appState.latest;
    const sound = mapSonification(latest, appState.audioMode);
    if (latest) {
      appState.dom.centerReadout.textContent = `x ${latest.x.toFixed(3)} / y ${latest.y.toFixed(3)}`;
      appState.dom.loadReadout.textContent = `${Math.round(latest.leftRatio * 100)} / ${Math.round((1 - latest.leftRatio) * 100)}`;
    } else {
      appState.dom.centerReadout.textContent = "x 0.000 / y 0.000";
      appState.dom.loadReadout.textContent = "50 / 50";
    }
    appState.dom.soundReadout.textContent = sound.label;
    updateVerticalMeters(latest, sound);

    if (Math.round(timestamp) % 30 === 0) {
      updateBadges();
    }
  }

  function updateVerticalMeters(latest, sound) {
    const leftRatio = latest ? clamp(latest.leftRatio || 0.5, 0, 1) : 0.5;
    const rightRatio = 1 - leftRatio;
    const harmonyScore = clamp(1 - sound.balanceError, 0, 1);
    const tunerScore = clamp(1 - sound.centerDistance, 0, 1);
    const meterGlow = appState.audioMode === AUDIO_MODES.harmony ? harmonyScore : tunerScore;

    updateVerticalMeter(appState.dom.leftVerticalMeter, leftRatio, meterGlow);
    updateVerticalMeter(appState.dom.rightVerticalMeter, rightRatio, meterGlow);
    if (appState.dom.leftMeterReadout) {
      appState.dom.leftMeterReadout.textContent = `${Math.round(leftRatio * 100)}%`;
    }
    if (appState.dom.rightMeterReadout) {
      appState.dom.rightMeterReadout.textContent = `${Math.round(rightRatio * 100)}%`;
    }
  }

  function updateVerticalMeter(element, ratio, glow) {
    if (!element) {
      return;
    }
    const percent = clamp(ratio, 0, 1) * 100;
    element.style.height = `${percent}%`;
    element.style.opacity = String(0.56 + glow * 0.44);
    element.style.boxShadow = `0 0 ${10 + glow * 28}px rgba(64, 224, 208, ${0.22 + glow * 0.44})`;
  }

  return {
    AUDIO_MODES,
    SensorLayout,
    validatePressureValues,
    computeFootState,
    combineFootStates,
    mapSonification,
    generateDemoFrame,
    initApp
  };
});
