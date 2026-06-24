(function attachBalanceSway(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.BalanceSway = api;
  if (root.document) {
    root.addEventListener("DOMContentLoaded", () => api.initApp());
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function createBalanceSwayApi(root) {
  "use strict";

  const SIDE_LEFT = "left";
  const SIDE_RIGHT = "right";
  const SENSOR_COUNT = 6;
  const DEFAULT_WINDOW_MS = 30000;
  const MAX_HISTORY_SAMPLES = 9000;
  const MIN_LOAD = 1;
  const MAX_SENSOR_VALUE = 8192;
  const FOOT_CENTER_X = {
    [SIDE_LEFT]: -0.28,
    [SIDE_RIGHT]: 0.28
  };
  const FOOT_LOCAL_X_RANGE = 0.58;
  const FOOT_LOCAL_Y_RANGE = 0.9;
  const PRESSURE_IMAGE_PATHS = {
    [SIDE_LEFT]: "../showcase/assets/orphe-insole-left.png",
    [SIDE_RIGHT]: "../showcase/assets/orphe-insole-right.png"
  };
  const I18N = {
    ja: {
      languageToggle: "English",
      languageToggleLabel: "英語表示に切り替え",
      heroEyebrow: "Center of Pressure Lab",
      heroTitle: "重心動揺計風ビジュアライゼーション",
      heroCopy: "ORPHE INSOLE の片足6点圧力センサから圧力中心を推定し、左右荷重・軌跡長・揺れ速度をリアルタイムに観察するexampleです。",
      heroNotice: "※可視化のexampleであり、実際の重心動揺計としては使えません。",
      sourceKicker: "入力",
      demoStream: "デモストリーム",
      modeLabel: "モード",
      protocolLabel: "プロトコル",
      protocolQuiet: "静止立位",
      protocolRomberg: "ロンベルグ風",
      protocolShift: "荷重移動",
      secondsLabel: "記録時間",
      secondsUnit: "秒",
      trialKicker: "記録",
      start: "記録開始",
      stop: "記録停止",
      center: "中心を合わせる",
      centerTitle: "現在位置を中心として補正",
      centerHelp: "今の立ち位置を基準にします",
      reset: "やり直し",
      resetTitle: "軌跡をリセット",
      resetHelp: "軌跡と記録を消します",
      csv: "CSV保存",
      csvTitle: "CSVを書き出し",
      csvHelp: "記録データを書き出します",
      recordingKicker: "記録",
      recordingTitle: "圧力データを記録できます",
      recordingCopy: "両足をそろえて立ち、記録開始ボタンを押します。設定した秒数が経過すると、CSV形式で保存できる記録が作成されます。",
      liveDemoTitle: "実機 / デモ",
      liveDemoCopy: "実機未接続でも合成データで動作します。INSOLEを接続するとLIVE表示になり、圧力・CoP・左右荷重が実測値に切り替わります。",
      toolkitConnect: "接続する",
      toolkitDisconnect: "切断する",
      toolkitUnavailable: "InsoleToolkitを読み込めません",
      guideEyebrow: "How to Test",
      guideTitle: "検査の進め方",
      guideStepPrepare: "安全のため、支えられる人が横に立ちます。足幅・靴・床・姿勢を毎回そろえます。",
      guideStepOpen: "開眼: 正面の一点を見て、話さず静かに立ちます。Centerで現在位置を基準にしてStartします。",
      guideStepClosed: "閉眼: 開眼で安全に立てる場合だけ実施します。目を閉じると視覚情報が減るため揺れやすくなります。",
      guideStepStop: "足が動く、支えが必要、強い不安がある場合は中止し、その試行は比較から外します。",
      postureEyebrow: "Posture",
      postureTitle: "姿勢",
      postureCopy: "両足でまっすぐ立ち、腕は自然に下ろします。膝を固めすぎず、検査中は足を踏み替えません。",
      readingEyebrow: "Result Guide",
      readingTitle: "結果の見方",
      readingCopy: "まず全体CoP軌跡で揺れの大きさを確認し、軌跡長・揺れ速度・楕円面積で揺れ量を見ます。最後に左右荷重で偏りを確認します。",
      judgementEyebrow: "Compare",
      judgementTitle: "比較のポイント",
      judgementCopy: "1回の数値だけで良し悪しを決めず、同じ姿勢・同じ秒数・同じ人で比較します。開眼/閉眼や前回との差を見ると変化が読み取りやすくなります。",
      metricSteadiness: "安定度",
      metricSteadinessDef: "100に近いほど、この試行内では揺れが少なく安定。",
      metricPath: "軌跡長",
      metricPathDef: "重心点が動いた距離の合計。小さいほど揺れが少ない。",
      metricVelocity: "揺れ速度",
      metricVelocityDef: "1秒あたりの揺れ量。大きいほど速く補正している。",
      metricEllipse: "楕円面積",
      metricEllipseDef: "揺れが広がった範囲。大きいほど広く動いている。",
      metricLoad: "左右荷重",
      metricLoadDef: "左/右の荷重割合。50/50に近いほど左右均等。",
      metricTrial: "計測",
      metricTrialDef: "計測中は残り時間、終了後は記録秒数を表示。",
      copEyebrow: "Statokinesigram",
      copTitle: "全体CoP軌跡",
      copDefinition: "左右足CoPを荷重で合成した全体CoPの30秒軌跡。",
      pressureEyebrow: "Pressure Map",
      pressureTitle: "片足6点圧力マップ",
      pressureDefinition: "左右各6点のADC生値と足内CoP。",
      lowLoad: "低荷重",
      highLoad: "高荷重",
      pressureExplainer: "左右それぞれ6か所の圧力センサを足型の上に表示します。値が大きいセンサほど暖色になり、水色の印は足裏の圧力中心を示します。圧力値はADC生値です。実機接続時はモード3または4で圧力を配信します。荷重[N]へ換算する場合は別途キャリブレーションが必要です。",
      stabilogramEyebrow: "Front / Back Sway",
      stabilogramTitle: "前後方向の揺れ",
      stabilogramDefinition: "オレンジの線は重心がつま先側・踵側へ動いた量です。線の上下が大きいほど、前後方向の揺れが大きい状態です。",
      loadEyebrow: "Weight Bearing",
      loadTitle: "左右荷重比",
      loadDefinition: "緑線は全荷重のうち左足に乗っている割合です。破線の50%に近いほど左右均等で、上なら左足荷重、下なら右足荷重です。",
      notConnected: "未接続",
      connecting: "接続中...",
      connectionError: "接続エラー",
      connectionFailed: "接続失敗",
      disconnectFailed: "切断失敗",
      modeChangeFailed: "モード変更失敗",
      sdkMissing: "Web Bluetooth SDKなし",
      idle: "待機中",
      paired: "左右接続",
      singleFoot: "片足のみ",
      axisMl: "内外側",
      axisAp: "前後方向",
      leftLoadRatioLabel: "左荷重比",
      legendMl: "左右",
      legendAp: "前後",
      leftFoot: "左足",
      rightFoot: "右足",
      connected: (side) => `${side === SIDE_LEFT ? "左" : "右"} 接続済み`,
      modeStatus: (side, mode) => `${side === SIDE_LEFT ? "左" : "右"} mode ${mode}`
    },
    en: {
      languageToggle: "日本語",
      languageToggleLabel: "Switch to Japanese",
      heroEyebrow: "Center of Pressure Lab",
      heroTitle: "Stabilometer-style Visualization",
      heroCopy: "Estimate center of pressure from the six pressure sensors in each ORPHE INSOLE and monitor left/right load, path length, and sway velocity in real time.",
      heroNotice: "Visualization example only; not a medical stabilometer or force-plate system.",
      sourceKicker: "Source",
      demoStream: "Demo Stream",
      modeLabel: "Mode",
      protocolLabel: "Protocol",
      protocolQuiet: "Quiet stance",
      protocolRomberg: "Romberg style",
      protocolShift: "Weight shift",
      secondsLabel: "Duration",
      secondsUnit: "sec",
      trialKicker: "Recording",
      start: "Start recording",
      stop: "Stop recording",
      center: "Set center",
      centerTitle: "Re-center the current CoP position",
      centerHelp: "Use current stance as the baseline",
      reset: "Clear trial",
      resetTitle: "Clear the trace",
      resetHelp: "Remove trace and recorded samples",
      csv: "Save CSV",
      csvTitle: "Export CSV",
      csvHelp: "Export recorded data",
      recordingKicker: "Recording",
      recordingTitle: "Record pressure data",
      recordingCopy: "Stand with both feet aligned, then press Start recording. After the selected duration, the trial is ready to save as CSV.",
      liveDemoTitle: "Live / Demo",
      liveDemoCopy: "The page runs with synthetic data until hardware is connected. When an INSOLE connects, pressure, CoP, and left/right load switch to LIVE measurements.",
      toolkitConnect: "Connect",
      toolkitDisconnect: "Disconnect",
      toolkitUnavailable: "InsoleToolkit is not loaded",
      guideEyebrow: "How to Test",
      guideTitle: "Test Flow",
      guideStepPrepare: "For safety, keep a spotter beside the participant. Keep foot width, shoes, floor, and posture the same every trial.",
      guideStepOpen: "Eyes open: look at one point ahead, stand quietly, do not talk. Press Center, then Start.",
      guideStepClosed: "Eyes closed: run only if eyes-open standing is safe. Closing the eyes removes visual input and usually increases sway.",
      guideStepStop: "Stop the trial if the feet move, support is needed, or the participant feels unsafe; exclude that trial from comparison.",
      postureEyebrow: "Posture",
      postureTitle: "Posture",
      postureCopy: "Stand upright on both feet with arms relaxed. Avoid locking the knees and do not step or shift foot position during the trial.",
      readingEyebrow: "Result Guide",
      readingTitle: "How to Read Results",
      readingCopy: "Start with the whole-body CoP trace, then use path, sway velocity, and ellipse area to understand sway amount. Finish by checking left/right load bias.",
      judgementEyebrow: "Compare",
      judgementTitle: "Comparison Points",
      judgementCopy: "Do not judge from one value alone. Compare the same person with the same posture and duration. Eyes-open/eyes-closed differences and previous trials make changes easier to read.",
      metricSteadiness: "Steadiness",
      metricSteadinessDef: "Closer to 100 means less sway in this trial.",
      metricPath: "Path",
      metricPathDef: "Total distance traveled by the CoP. Lower usually means less sway.",
      metricVelocity: "Velocity",
      metricVelocityDef: "Sway amount per second. Higher means faster corrections.",
      metricEllipse: "Ellipse",
      metricEllipseDef: "Area covered by the sway. Larger means a wider sway spread.",
      metricLoad: "L/R Load",
      metricLoadDef: "Left/right load share. Near 50/50 is evenly weighted.",
      metricTrial: "Trial",
      metricTrialDef: "Shows remaining time during measurement and recorded duration after.",
      copEyebrow: "Statokinesigram",
      copTitle: "Global CoP Trace",
      copDefinition: "30 s trace of whole-body CoP estimated from left/right insole CoP and load.",
      pressureEyebrow: "Pressure Map",
      pressureTitle: "Six Sensors / Foot",
      pressureDefinition: "Raw ADC pressure from six sensors per foot and in-foot CoP.",
      lowLoad: "Low load",
      highLoad: "High load",
      pressureExplainer: "Each foot shows six pressure sensor positions. Higher values appear warmer, and the cyan marker shows the pressure center under the foot. Pressure values are raw ADC readings. Use mode 3 or 4 for live pressure streaming; force [N] conversion requires separate calibration.",
      stabilogramEyebrow: "Front / Back Sway",
      stabilogramTitle: "Front-to-Back Sway",
      stabilogramDefinition: "The orange line shows how far the CoP moves toward the toes or heel. Larger vertical movement means more front-to-back sway.",
      loadEyebrow: "Weight Bearing",
      loadTitle: "Left / Right Ratio",
      loadDefinition: "The green line is the percentage of total load carried by the left foot. Near the 50% dashed line is balanced; above is left-foot load, below is right-foot load.",
      notConnected: "Not connected",
      connecting: "Connecting...",
      connectionError: "Connection error",
      connectionFailed: "Connection failed",
      disconnectFailed: "Disconnect failed",
      modeChangeFailed: "Mode change failed",
      sdkMissing: "Web Bluetooth SDK missing",
      idle: "Idle",
      paired: "paired",
      singleFoot: "single foot",
      axisMl: "Medial / Lateral",
      axisAp: "Anterior / Posterior",
      leftLoadRatioLabel: "Left load ratio",
      legendMl: "ML",
      legendAp: "AP",
      leftFoot: "LEFT",
      rightFoot: "RIGHT",
      connected: (side) => `${side.toUpperCase()} connected`,
      modeStatus: (side, mode) => `${side.toUpperCase()} mode ${mode}`
    }
  };

  // Real-device check showed channels P0/P2 and P1/P4 are mirrored from the
  // original visual-only layout. Keep array order as raw channel order so CSV
  // columns remain left_p0..p5/right_p0..p5. imageX/imageY are aligned to the
  // white cross markers baked into the insole image asset.
  const SensorLayout = [
    createSensorPoint(0.7596, 0.1680, "P0"),
    createSensorPoint(0.7513, 0.3320, "P1"),
    createSensorPoint(0.4024, 0.2210, "P2"),
    createSensorPoint(0.5245, 0.3483, "P3"),
    createSensorPoint(0.2884, 0.3681, "P4"),
    createSensorPoint(0.5552, 0.8206, "P5")
  ];

  function createSensorPoint(imageX, imageY, label) {
    return {
      x: (imageX - 0.5) * FOOT_LOCAL_X_RANGE,
      y: (0.5 - imageY) * FOOT_LOCAL_Y_RANGE,
      imageX,
      imageY,
      label
    };
  }

  const appState = {
    startedAt: 0,
    language: getInitialLanguage(),
    runningDemo: true,
    demoAccumulatorMs: 0,
    lastFrameMs: 0,
    lastUiMs: 0,
    centerOffset: { x: 0, y: 0 },
    samples: [],
    trialSamples: [],
    latest: null,
    selectedMode: 4,
    trial: {
      active: false,
      durationSeconds: 30,
      startedAt: 0,
      protocol: "quiet"
    },
    feet: {
      [SIDE_LEFT]: createFootState(SIDE_LEFT),
      [SIDE_RIGHT]: createFootState(SIDE_RIGHT)
    },
    pressureRange: {
      min: Infinity,
      max: -Infinity
    },
    pressureImages: {
      [SIDE_LEFT]: null,
      [SIDE_RIGHT]: null
    },
    devices: [],
    dom: {}
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function createFootState(side) {
    return {
      side,
      connected: false,
      lastTimestamp: 0,
      lastLocalTime: 0,
      values: new Array(SENSOR_COUNT).fill(0),
      cop: null,
      load: 0,
      acc: null,
      gyro: null,
      quat: null
    };
  }

  function validatePressureValues(values) {
    const issues = [];
    if (!Array.isArray(values) || values.length < SENSOR_COUNT) {
      return { valid: false, values: new Array(SENSOR_COUNT).fill(0), issues: ["missing pressure channels"] };
    }

    const normalized = values.slice(0, SENSOR_COUNT).map((value, index) => {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) {
        issues.push(`P${index} is not finite`);
        return 0;
      }
      if (numberValue < 0) {
        issues.push(`P${index} is negative`);
        return 0;
      }
      if (numberValue > MAX_SENSOR_VALUE) {
        issues.push(`P${index} is above expected raw range`);
      }
      return clamp(numberValue, 0, MAX_SENSOR_VALUE);
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

  function computeFootCop(values, side) {
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

  function combineFootCops(leftFoot, rightFoot, centerOffset) {
    const feet = [leftFoot, rightFoot].filter((foot) => foot && foot.cop && foot.load >= MIN_LOAD);
    const totalLoad = feet.reduce((sum, foot) => sum + foot.load, 0);
    if (!feet.length || totalLoad < MIN_LOAD) {
      return null;
    }

    const raw = feet.reduce((point, foot) => {
      point.x += foot.cop.global.x * foot.load / totalLoad;
      point.y += foot.cop.global.y * foot.load / totalLoad;
      return point;
    }, { x: 0, y: 0 });

    return {
      x: raw.x - centerOffset.x,
      y: raw.y - centerOffset.y,
      rawX: raw.x,
      rawY: raw.y,
      totalLoad,
      leftLoad: leftFoot ? leftFoot.load : 0,
      rightLoad: rightFoot ? rightFoot.load : 0,
      paired: Boolean(leftFoot && rightFoot && leftFoot.load >= MIN_LOAD && rightFoot.load >= MIN_LOAD)
    };
  }

  function calculateSwayMetrics(samples) {
    const usable = samples.filter((sample) => sample && sample.cop && Number.isFinite(sample.cop.x) && Number.isFinite(sample.cop.y));
    if (usable.length < 2) {
      return {
        count: usable.length,
        durationSeconds: 0,
        pathLength: 0,
        meanVelocity: 0,
        rangeX: 0,
        rangeY: 0,
        rmsRadius: 0,
        ellipseArea: 0,
        leftLoadPercent: 0,
        steadiness: null
      };
    }

    let pathLength = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let sumX = 0;
    let sumY = 0;
    let loadTotal = 0;
    let leftLoadTotal = 0;

    for (let index = 0; index < usable.length; index += 1) {
      const sample = usable[index];
      minX = Math.min(minX, sample.cop.x);
      maxX = Math.max(maxX, sample.cop.x);
      minY = Math.min(minY, sample.cop.y);
      maxY = Math.max(maxY, sample.cop.y);
      sumX += sample.cop.x;
      sumY += sample.cop.y;
      loadTotal += sample.totalLoad || 0;
      leftLoadTotal += sample.leftLoad || 0;
      if (index > 0) {
        const previous = usable[index - 1];
        pathLength += Math.hypot(sample.cop.x - previous.cop.x, sample.cop.y - previous.cop.y);
      }
    }

    const meanX = sumX / usable.length;
    const meanY = sumY / usable.length;
    let varianceX = 0;
    let varianceY = 0;
    let covariance = 0;
    let radiusSquared = 0;

    usable.forEach((sample) => {
      const dx = sample.cop.x - meanX;
      const dy = sample.cop.y - meanY;
      varianceX += dx * dx;
      varianceY += dy * dy;
      covariance += dx * dy;
      radiusSquared += dx * dx + dy * dy;
    });

    varianceX /= usable.length;
    varianceY /= usable.length;
    covariance /= usable.length;
    const determinant = Math.max(0, varianceX * varianceY - covariance * covariance);
    const durationSeconds = Math.max(0.001, (usable[usable.length - 1].timestamp - usable[0].timestamp) / 1000);
    const pathUnits = pathLength * 100;
    const velocityUnits = pathUnits / durationSeconds;
    const rangeXUnits = (maxX - minX) * 100;
    const rangeYUnits = (maxY - minY) * 100;
    const rmsRadiusUnits = Math.sqrt(radiusSquared / usable.length) * 100;
    const ellipseAreaUnits = 5.991 * Math.PI * Math.sqrt(determinant) * 10000;
    const leftLoadPercent = loadTotal > 0 ? leftLoadTotal / loadTotal * 100 : 0;
    const loadPenalty = Math.max(0, Math.abs(leftLoadPercent - 50) - 12) * 0.8;
    const steadiness = clamp(100 - (rmsRadiusUnits * 2.6 + velocityUnits * 0.48 + loadPenalty), 0, 100);

    return {
      count: usable.length,
      durationSeconds,
      pathLength: pathUnits,
      meanVelocity: velocityUnits,
      rangeX: rangeXUnits,
      rangeY: rangeYUnits,
      rmsRadius: rmsRadiusUnits,
      ellipseArea: ellipseAreaUnits,
      leftLoadPercent,
      steadiness
    };
  }

  function generateFootPressureFromTarget(side, localTarget, targetLoad, phase) {
    const sigmaX = 0.17;
    const sigmaY = 0.27;
    const weights = SensorLayout.map((sensor, index) => {
      const dx = (sensor.x - localTarget.x) / sigmaX;
      const dy = (sensor.y - localTarget.y) / sigmaY;
      const pulse = 0.04 * Math.sin(phase + index * 1.73);
      return 0.12 + Math.exp(-0.5 * (dx * dx + dy * dy)) + pulse;
    });
    const sum = weights.reduce((total, value) => total + Math.max(0.01, value), 0);
    return weights.map((weight, index) => {
      const breathing = 1 + 0.025 * Math.sin(phase * 0.7 + index);
      return Math.max(0, Math.round(targetLoad * Math.max(0.01, weight) / sum * breathing));
    });
  }

  function generateDemoFrame(timeSeconds, protocol) {
    const protocolScale = protocol === "shift" ? 2.1 : protocol === "romberg" ? 1.35 : 1;
    const swayX = protocolScale * (0.035 * Math.sin(timeSeconds * 1.15) + 0.014 * Math.sin(timeSeconds * 3.2 + 0.8));
    const swayY = protocolScale * (0.055 * Math.sin(timeSeconds * 0.82 + 0.5) + 0.015 * Math.sin(timeSeconds * 2.6));
    const shiftCue = protocol === "shift" ? 0.12 * Math.sin(timeSeconds * 0.34) : 0;
    const globalTarget = {
      x: clamp(swayX + shiftCue, -0.42, 0.42),
      y: clamp(swayY, -0.42, 0.42)
    };

    const totalLoad = 6200 + 260 * Math.sin(timeSeconds * 0.45);
    const leftRatio = clamp(0.5 - globalTarget.x * 0.62 + 0.025 * Math.sin(timeSeconds * 0.55), 0.16, 0.84);
    const leftLoad = totalLoad * leftRatio;
    const rightLoad = totalLoad - leftLoad;
    const leftLocal = {
      x: clamp((globalTarget.x - FOOT_CENTER_X[SIDE_LEFT]) * -0.42, -0.16, 0.16),
      y: globalTarget.y
    };
    const rightLocal = {
      x: clamp((globalTarget.x - FOOT_CENTER_X[SIDE_RIGHT]) * 0.42, -0.16, 0.16),
      y: globalTarget.y
    };

    return {
      left: generateFootPressureFromTarget(SIDE_LEFT, leftLocal, leftLoad, timeSeconds),
      right: generateFootPressureFromTarget(SIDE_RIGHT, rightLocal, rightLoad, timeSeconds + 1.1)
    };
  }

  function formatMetric(value, decimals, suffix) {
    if (!Number.isFinite(value)) {
      return "--";
    }
    return `${value.toFixed(decimals)}${suffix || ""}`;
  }

  function getInitialLanguage() {
    try {
      return root.localStorage && root.localStorage.getItem("balance-sway-language") === "en" ? "en" : "ja";
    } catch (error) {
      return "ja";
    }
  }

  function persistLanguage() {
    try {
      if (root.localStorage) {
        root.localStorage.setItem("balance-sway-language", appState.language);
      }
    } catch (error) {
      // Local storage may be blocked in private or file-based contexts.
    }
  }

  function t(key, ...args) {
    const dictionary = I18N[appState.language] || I18N.ja;
    const value = Object.prototype.hasOwnProperty.call(dictionary, key) ? dictionary[key] : I18N.ja[key];
    if (typeof value === "function") {
      return value(...args);
    }
    return typeof value === "string" ? value : key;
  }

  function applyLanguage() {
    const documentRef = root.document;
    if (!documentRef) {
      return;
    }
    documentRef.documentElement.lang = appState.language;
    documentRef.querySelectorAll("[data-i18n]").forEach((element) => {
      element.innerHTML = t(element.dataset.i18n);
    });
    documentRef.querySelectorAll("[data-i18n-title]").forEach((element) => {
      element.setAttribute("title", t(element.dataset.i18nTitle));
    });
    if (appState.dom.languageToggle) {
      appState.dom.languageToggle.setAttribute("aria-label", t("languageToggleLabel"));
    }
    syncTrialButtonLabel();
    refreshToolkitButtons();
    refreshDeviceStatuses();
  }

  function initApp() {
    const documentRef = root.document;
    appState.startedAt = performance.now();
    appState.dom = {
      languageToggle: documentRef.getElementById("language-toggle"),
      dataSourceBadge: documentRef.getElementById("data-source-badge"),
      sampleRate: documentRef.getElementById("sample-rate"),
      demoToggle: documentRef.getElementById("demo-toggle"),
      toolkitPlaceholder: documentRef.getElementById("toolkit-placeholder"),
      streamingMode: documentRef.getElementById("streaming-mode"),
      protocolSelect: documentRef.getElementById("protocol-select"),
      trialDuration: documentRef.getElementById("trial-duration"),
      trialToggle: documentRef.getElementById("trial-toggle"),
      calibrateCenter: documentRef.getElementById("calibrate-center"),
      resetTrace: documentRef.getElementById("reset-trace"),
      exportCsv: documentRef.getElementById("export-csv"),
      metricScore: documentRef.getElementById("metric-score"),
      metricPath: documentRef.getElementById("metric-path"),
      metricVelocity: documentRef.getElementById("metric-velocity"),
      metricEllipse: documentRef.getElementById("metric-ellipse"),
      metricLoad: documentRef.getElementById("metric-load"),
      metricTrial: documentRef.getElementById("metric-trial"),
      copReadout: documentRef.getElementById("cop-readout"),
      loadReadout: documentRef.getElementById("load-readout"),
      pairedReadout: documentRef.getElementById("paired-readout"),
      deviceStatus: [
        documentRef.getElementById("device-0-status"),
        documentRef.getElementById("device-1-status")
      ],
      canvases: {
        cop: documentRef.getElementById("cop-canvas"),
        pressure: documentRef.getElementById("pressure-canvas"),
        stabilogram: documentRef.getElementById("stabilogram-canvas"),
        load: documentRef.getElementById("load-canvas")
      }
    };

    setupEvents();
    loadPressureImages();
    setupDevices();
    applyLanguage();
    updateSourceBadge();
    root.requestAnimationFrame(animationLoop);
  }

  function setupEvents() {
    const dom = appState.dom;
    if (dom.languageToggle) {
      dom.languageToggle.addEventListener("click", () => {
        appState.language = appState.language === "ja" ? "en" : "ja";
        persistLanguage();
        applyLanguage();
        updateMetricsUi(performance.now());
        drawAllCanvases();
      });
    }
    dom.demoToggle.addEventListener("click", () => {
      appState.runningDemo = !appState.runningDemo;
      updateSourceBadge();
    });
    dom.streamingMode.addEventListener("change", () => {
      appState.selectedMode = Number(dom.streamingMode.value);
      appState.devices.forEach((deviceState) => applyStreamingMode(deviceState));
    });
    dom.protocolSelect.addEventListener("change", () => {
      appState.trial.protocol = dom.protocolSelect.value;
    });
    dom.trialToggle.addEventListener("click", () => toggleTrial());
    dom.calibrateCenter.addEventListener("click", () => calibrateCenter());
    dom.resetTrace.addEventListener("click", () => resetTrace());
    dom.exportCsv.addEventListener("click", () => exportCsv());
    root.addEventListener("resize", () => drawAllCanvases());
  }

  function loadPressureImages() {
    Object.keys(PRESSURE_IMAGE_PATHS).forEach((side) => {
      if (typeof root.Image !== "function") {
        return;
      }
      const image = new root.Image();
      image.onload = () => drawAllCanvases();
      image.src = PRESSURE_IMAGE_PATHS[side];
      appState.pressureImages[side] = image;
    });
  }

  function setupDevices() {
    const toolkitInsoles = Array.isArray(root.insoles) ? root.insoles : (typeof insoles !== "undefined" && Array.isArray(insoles) ? insoles : null);
    const toolkitBles = toolkitInsoles || (Array.isArray(root.bles) ? root.bles : (typeof bles !== "undefined" && Array.isArray(bles) ? bles : null));
    const insoleBuilder = typeof root.buildInsoleToolkit === "function" ? root.buildInsoleToolkit : (typeof buildInsoleToolkit !== "undefined" ? buildInsoleToolkit : null);
    const coreBuilder = typeof root.buildCoreToolkit === "function" ? root.buildCoreToolkit : (typeof buildCoreToolkit !== "undefined" ? buildCoreToolkit : null);
    const toolkitBuilder = insoleBuilder || coreBuilder;
    if (!toolkitBles || typeof toolkitBuilder !== "function") {
      renderToolkitMessage(t("toolkitUnavailable"));
      setDeviceStatus(0, t("sdkMissing"));
      setDeviceStatus(1, t("sdkMissing"));
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
        updateSourceBadge();
        updateDeviceConnectionUi(deviceState);
      };
      instance.onDisconnect = () => {
        deviceState.connected = false;
        appState.feet[deviceState.side].connected = false;
        updateDeviceConnectionUi(deviceState);
      };
      instance.onClear = () => {
        deviceState.connected = false;
        appState.feet[deviceState.side].connected = false;
        updateDeviceConnectionUi(deviceState);
      };
      instance.onStartNotify = () => {
        applyStreamingMode(deviceState);
      };
      instance.onError = (error) => {
        setDeviceStatus(deviceIndex, error && error.message ? error.message : t("connectionError"));
        root.setTimeout(() => refreshToolkitButton(deviceIndex), 0);
      };
      instance.gotPress = (press) => {
        const side = resolveDeviceSide(deviceState);
        appState.feet[side].connected = true;
        updateFootPressure(side, press.values, press.timestamp || performance.now());
      };
      instance.gotConvertedAcc = (acc) => {
        appState.feet[resolveDeviceSide(deviceState)].acc = acc;
      };
      instance.gotConvertedGyro = (gyro) => {
        appState.feet[resolveDeviceSide(deviceState)].gyro = gyro;
      };
      instance.gotQuat = (quat) => {
        appState.feet[resolveDeviceSide(deviceState)].quat = quat;
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
    if (!appState.dom.toolkitPlaceholder) {
      return;
    }
    appState.dom.toolkitPlaceholder.innerHTML = `<div class="toolkit-message">${message}</div>`;
  }

  function enhanceToolkitControl(deviceIndex) {
    const documentRef = root.document;
    const control = documentRef.getElementById(`insole_toolkit${deviceIndex}`) || documentRef.getElementById(`core_toolkit${deviceIndex}`);
    const input = documentRef.getElementById(`switch_ble${deviceIndex}`);
    const label = control ? control.querySelector(".form-check-label") : null;
    if (!control || !input || !label) {
      return;
    }

    control.classList.add("toolkit-connect-control");
    label.setAttribute("for", input.id);
    label.innerHTML = '<strong class="toolkit-device-name"></strong><small class="toolkit-action-label"></small>';
    input.addEventListener("change", () => {
      refreshToolkitButton(deviceIndex);
    });
    refreshToolkitButton(deviceIndex);
  }

  function refreshToolkitButtons() {
    [0, 1].forEach((deviceIndex) => refreshToolkitButton(deviceIndex));
  }

  function refreshToolkitButton(deviceIndex) {
    const documentRef = root.document;
    if (!documentRef) {
      return;
    }
    const control = documentRef.getElementById(`insole_toolkit${deviceIndex}`) || documentRef.getElementById(`core_toolkit${deviceIndex}`);
    const input = documentRef.getElementById(`switch_ble${deviceIndex}`);
    if (!control || !input) {
      return;
    }
    const deviceName = control.querySelector(".toolkit-device-name");
    const actionLabel = control.querySelector(".toolkit-action-label");
    if (deviceName) {
      deviceName.textContent = `INSOLE 0${deviceIndex + 1}`;
    }
    if (actionLabel) {
      actionLabel.textContent = input.checked ? t("toolkitDisconnect") : t("toolkitConnect");
    }
    control.classList.toggle("is-connected", input.checked);
    input.setAttribute("aria-label", `${input.checked ? t("toolkitDisconnect") : t("toolkitConnect")} INSOLE 0${deviceIndex + 1}`);
  }

  async function connectDevice(index) {
    const deviceState = appState.devices[index];
    if (!deviceState) {
      return;
    }
    if (deviceState.connected) {
      try {
        deviceState.insole.stop();
      } catch (error) {
        setDeviceStatus(index, error.message || t("disconnectFailed"));
      }
      return;
    }

    setDeviceStatus(index, t("connecting"));
    try {
      await deviceState.insole.begin("SENSOR_VALUES");
      resolveDeviceSide(deviceState);
      await applyStreamingMode(deviceState);
      updateDeviceConnectionUi(deviceState);
    } catch (error) {
      setDeviceStatus(index, error && error.message ? error.message : t("connectionFailed"));
    }
  }

  async function applyStreamingMode(deviceState) {
    if (!deviceState || !deviceState.connected || !deviceState.insole || typeof deviceState.insole.setDataStreamingMode !== "function") {
      return;
    }
    try {
      await deviceState.insole.setDataStreamingMode(appState.selectedMode);
      setDeviceStatus(deviceState.index, t("modeStatus", deviceState.side, appState.selectedMode));
    } catch (error) {
      setDeviceStatus(deviceState.index, t("modeChangeFailed"));
    }
  }

  function resolveDeviceSide(deviceState) {
    const deviceInfo = deviceState.insole && deviceState.insole.device_information;
    if (deviceInfo && Number.isFinite(deviceInfo.mount_position)) {
      deviceState.side = (deviceInfo.mount_position & 1) === 0 ? SIDE_LEFT : SIDE_RIGHT;
    }
    return deviceState.side;
  }

  function updateDeviceConnectionUi(deviceState) {
    setDeviceStatus(deviceState.index, deviceState.connected ? t("connected", deviceState.side) : t("notConnected"));
    refreshToolkitButton(deviceState.index);
  }

  function refreshDeviceStatuses() {
    if (appState.devices.length) {
      appState.devices.forEach((deviceState) => updateDeviceConnectionUi(deviceState));
      return;
    }
    setDeviceStatus(0, t("sdkMissing"));
    setDeviceStatus(1, t("sdkMissing"));
  }

  function setDeviceStatus(index, label) {
    const target = appState.dom.deviceStatus && appState.dom.deviceStatus[index];
    if (target) {
      target.textContent = label;
    }
  }

  function updateFootPressure(side, values, timestamp) {
    const footCop = computeFootCop(values, side);
    const foot = appState.feet[side];
    foot.values = footCop.values;
    foot.load = footCop.load;
    foot.cop = footCop.valid || footCop.global ? footCop : null;
    foot.lastTimestamp = timestamp;
    foot.lastLocalTime = performance.now();
    updatePressureRange(foot.values);
    appendCombinedSample(timestamp);
  }

  function updatePressureRange(values) {
    values.forEach((value) => {
      if (!Number.isFinite(value)) {
        return;
      }
      appState.pressureRange.min = Math.min(appState.pressureRange.min, value);
      appState.pressureRange.max = Math.max(appState.pressureRange.max, value);
    });
  }

  function appendCombinedSample(timestamp) {
    const now = performance.now();
    const left = isFootFresh(appState.feet[SIDE_LEFT], now) ? appState.feet[SIDE_LEFT] : null;
    const right = isFootFresh(appState.feet[SIDE_RIGHT], now) ? appState.feet[SIDE_RIGHT] : null;
    const combined = combineFootCops(left, right, appState.centerOffset);
    if (!combined) {
      return;
    }

    const sample = {
      timestamp,
      localTime: now,
      cop: { x: combined.x, y: combined.y },
      rawCop: { x: combined.rawX, y: combined.rawY },
      leftLoad: combined.leftLoad,
      rightLoad: combined.rightLoad,
      totalLoad: combined.totalLoad,
      paired: combined.paired,
      leftValues: appState.feet[SIDE_LEFT].values.slice(),
      rightValues: appState.feet[SIDE_RIGHT].values.slice()
    };

    appState.latest = sample;
    appState.samples.push(sample);
    if (appState.samples.length > MAX_HISTORY_SAMPLES) {
      appState.samples.splice(0, appState.samples.length - MAX_HISTORY_SAMPLES);
    }
    if (appState.trial.active) {
      appState.trialSamples.push(sample);
    }
  }

  function isFootFresh(foot, now) {
    return foot && foot.cop && foot.load >= MIN_LOAD && now - foot.lastLocalTime < 1200;
  }

  function animationLoop(now) {
    if (!appState.lastFrameMs) {
      appState.lastFrameMs = now;
    }
    const deltaMs = now - appState.lastFrameMs;
    appState.lastFrameMs = now;

    if (appState.runningDemo) {
      runDemo(deltaMs, now);
    }

    if (appState.trial.active && now - appState.trial.startedAt >= appState.trial.durationSeconds * 1000) {
      stopTrial();
    }

    drawAllCanvases();
    if (now - appState.lastUiMs > 120) {
      updateMetricsUi(now);
      appState.lastUiMs = now;
    }
    root.requestAnimationFrame(animationLoop);
  }

  function runDemo(deltaMs, now) {
    appState.demoAccumulatorMs += deltaMs;
    const intervalMs = 20;
    while (appState.demoAccumulatorMs >= intervalMs) {
      appState.demoAccumulatorMs -= intervalMs;
      const timeSeconds = (now - appState.startedAt - appState.demoAccumulatorMs) / 1000;
      const frame = generateDemoFrame(timeSeconds, appState.trial.protocol);
      updateFootPressure(SIDE_LEFT, frame.left, now);
      updateFootPressure(SIDE_RIGHT, frame.right, now);
    }
  }

  function toggleTrial() {
    if (appState.trial.active) {
      stopTrial();
      return;
    }
    const duration = clamp(Number(appState.dom.trialDuration.value) || 30, 5, 120);
    appState.trial.active = true;
    appState.trial.durationSeconds = duration;
    appState.trial.startedAt = performance.now();
    appState.trial.protocol = appState.dom.protocolSelect.value;
    appState.trialSamples = [];
    appState.dom.trialToggle.classList.add("running");
    syncTrialButtonLabel();
  }

  function stopTrial() {
    appState.trial.active = false;
    appState.dom.trialToggle.classList.remove("running");
    syncTrialButtonLabel();
  }

  function syncTrialButtonLabel() {
    const label = appState.dom.trialToggle && appState.dom.trialToggle.querySelector("strong");
    if (label) {
      label.textContent = t(appState.trial.active ? "stop" : "start");
    }
  }

  function calibrateCenter() {
    if (!appState.latest || !appState.latest.rawCop) {
      return;
    }
    appState.centerOffset = {
      x: appState.latest.rawCop.x,
      y: appState.latest.rawCop.y
    };
    resetTrace();
  }

  function resetTrace() {
    appState.samples = [];
    appState.trialSamples = [];
    appState.latest = null;
    appState.pressureRange.min = Infinity;
    appState.pressureRange.max = -Infinity;
  }

  function exportCsv() {
    const rows = appState.trialSamples.length ? appState.trialSamples : appState.samples;
    const header = [
      "time_ms", "cop_x", "cop_y", "left_load", "right_load", "total_load", "paired",
      "left_p0", "left_p1", "left_p2", "left_p3", "left_p4", "left_p5",
      "right_p0", "right_p1", "right_p2", "right_p3", "right_p4", "right_p5"
    ];
    const lines = [header.join(",")];
    rows.forEach((sample) => {
      const line = [
        Math.round(sample.timestamp),
        sample.cop.x.toFixed(6),
        sample.cop.y.toFixed(6),
        Math.round(sample.leftLoad),
        Math.round(sample.rightLoad),
        Math.round(sample.totalLoad),
        sample.paired ? 1 : 0
      ].concat(sample.leftValues, sample.rightValues);
      lines.push(line.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const link = root.document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orphe-balance-sway-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function updateSourceBadge() {
    const badge = appState.dom.dataSourceBadge;
    if (!badge) {
      return;
    }
    badge.textContent = appState.runningDemo ? "DEMO" : "LIVE";
    badge.classList.toggle("demo", appState.runningDemo);
    badge.classList.toggle("live", !appState.runningDemo);
    appState.dom.demoToggle.classList.toggle("active", appState.runningDemo);
  }

  function getWindowSamples(now, windowMs) {
    const cutoff = now - windowMs;
    return appState.samples.filter((sample) => sample.localTime >= cutoff);
  }

  function updateMetricsUi(now) {
    const activeSamples = appState.trial.active || appState.trialSamples.length ? appState.trialSamples : getWindowSamples(now, DEFAULT_WINDOW_MS);
    const metrics = calculateSwayMetrics(activeSamples);
    appState.dom.metricScore.textContent = metrics.steadiness === null ? "--" : Math.round(metrics.steadiness).toString();
    appState.dom.metricPath.textContent = `${formatMetric(metrics.pathLength, 1, "")} u`;
    appState.dom.metricVelocity.textContent = `${formatMetric(metrics.meanVelocity, 2, "")} u/s`;
    appState.dom.metricEllipse.textContent = `${formatMetric(metrics.ellipseArea, 1, "")} u2`;
    appState.dom.metricLoad.textContent = metrics.leftLoadPercent ? `${metrics.leftLoadPercent.toFixed(0)}/${(100 - metrics.leftLoadPercent).toFixed(0)}` : "--";

    if (appState.trial.active) {
      const remain = Math.max(0, appState.trial.durationSeconds - (now - appState.trial.startedAt) / 1000);
      appState.dom.metricTrial.textContent = `${remain.toFixed(1)}s`;
    } else if (appState.trialSamples.length) {
      appState.dom.metricTrial.textContent = `${metrics.durationSeconds.toFixed(1)}s`;
    } else {
      appState.dom.metricTrial.textContent = t("idle");
    }

    const latest = appState.latest;
    if (latest) {
      appState.dom.copReadout.textContent = `x ${latest.cop.x.toFixed(3)} / y ${latest.cop.y.toFixed(3)}`;
      appState.dom.loadReadout.textContent = `${Math.round(latest.totalLoad)} a.u.`;
      appState.dom.pairedReadout.textContent = latest.paired ? t("paired") : t("singleFoot");
    }

    if (activeSamples.length > 3) {
      const span = (activeSamples[activeSamples.length - 1].timestamp - activeSamples[0].timestamp) / 1000;
      const hz = span > 0 ? (activeSamples.length - 1) / span : 0;
      appState.dom.sampleRate.textContent = `${hz.toFixed(1)} Hz`;
    }
  }

  function drawAllCanvases() {
    const dom = appState.dom;
    if (!dom.canvases) {
      return;
    }
    const now = performance.now();
    const samples = getWindowSamples(now, DEFAULT_WINDOW_MS);
    drawCopCanvas(dom.canvases.cop, samples, appState.latest);
    drawPressureCanvas(dom.canvases.pressure, appState.feet);
    drawStabilogramCanvas(dom.canvases.stabilogram, samples, now);
    drawLoadCanvas(dom.canvases.load, samples, now);
  }

  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(root.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
  }

  function clearCanvas(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fbfcfb";
    ctx.fillRect(0, 0, width, height);
  }

  function drawCopCanvas(canvas, samples, latest) {
    const { ctx, width, height } = prepareCanvas(canvas);
    clearCanvas(ctx, width, height);
    const pad = 38;
    const plot = { x: pad, y: 24, w: width - pad * 2, h: height - 54 };
    drawGrid(ctx, plot, 6, 5);
    drawSupportArea(ctx, plot);

    const map = (point) => ({
      x: plot.x + (point.x + 0.65) / 1.3 * plot.w,
      y: plot.y + (0.55 - point.y) / 1.1 * plot.h
    });

    if (samples.length > 1) {
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      samples.forEach((sample, index) => {
        const point = map(sample.cop);
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.strokeStyle = "rgba(39, 95, 168, 0.78)";
      ctx.stroke();
    }

    if (latest) {
      const point = map(latest.cop);
      ctx.fillStyle = "#d26a1e";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    drawAxisLabels(ctx, plot, t("axisMl"), t("axisAp"));
  }

  function drawPressureCanvas(canvas, feet) {
    const { ctx, width, height } = prepareCanvas(canvas);
    clearCanvas(ctx, width, height);
    drawPressureVolumeBars(ctx, width, height, feet);
    const footLength = height * 0.82;
    const columns = [
      { side: SIDE_LEFT, cx: width * 0.32, cy: height * 0.5 },
      { side: SIDE_RIGHT, cx: width * 0.68, cy: height * 0.5 }
    ];
    columns.forEach((column) => {
      const imageBox = drawFootPrint(ctx, column.cx, column.cy, footLength, column.side);
      const foot = feet[column.side];
      SensorLayout.forEach((sensor, index) => {
        const point = sensorImagePointToCanvas(imageBox, column.side, sensor);
        const value = foot.values[index] || 0;
        const intensity = pressureIntensity(value);
        const circleSize = pressureCircleSize(value);
        ctx.fillStyle = heatColor(intensity, 0.88);
        ctx.beginPath();
        ctx.arc(point.x, point.y, circleSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = intensity > 0.46 ? "#ffffff" : "#10201b";
        ctx.shadowColor = intensity > 0.46 ? "rgba(0, 0, 0, 0.45)" : "transparent";
        ctx.shadowBlur = intensity > 0.46 ? 3 : 0;
        ctx.font = "700 12px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(sensor.label.toLowerCase(), point.x, point.y);
        ctx.shadowBlur = 0;
      });
      if (foot.cop && foot.cop.local) {
        const point = footLocalPointToImageCanvas(imageBox, column.side, foot.cop.local);
        ctx.fillStyle = "#45e6e6";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(23, 32, 29, 0.72)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(point.x - 13, point.y);
        ctx.lineTo(point.x + 13, point.y);
        ctx.moveTo(point.x, point.y - 13);
        ctx.lineTo(point.x, point.y + 13);
        ctx.stroke();
      }
      ctx.fillStyle = "#62716b";
      ctx.font = "800 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      const footLabel = column.side === SIDE_LEFT ? t("leftFoot") : t("rightFoot");
      ctx.fillText(`${footLabel} ${Math.round(foot.load)} a.u.`, column.cx, height - 20);
    });
  }

  function drawPressureVolumeBars(ctx, width, height, feet) {
    const barCount = 20;
    const barHeight = height * 0.82 / barCount;
    const barWidth = Math.max(16, width * 0.055);
    const maxLoad = 10000;
    const leftBars = Math.round(clamp(feet[SIDE_LEFT].load, 0, maxLoad) / maxLoad * barCount);
    const rightBars = Math.round(clamp(feet[SIDE_RIGHT].load, 0, maxLoad) / maxLoad * barCount);
    drawOneVolumeBar(ctx, width * 0.035, height * 0.91, barWidth, barHeight, leftBars, barCount);
    drawOneVolumeBar(ctx, width - width * 0.035 - barWidth, height * 0.91, barWidth, barHeight, rightBars, barCount);
  }

  function drawOneVolumeBar(ctx, x, baseY, barWidth, barHeight, activeBars, totalBars) {
    for (let index = 0; index < totalBars; index += 1) {
      const y = baseY - barHeight * (index + 1);
      const t = index / Math.max(1, totalBars - 1);
      ctx.fillStyle = index < activeBars
        ? `rgb(${Math.round(t * 255)}, ${Math.round(255 - t * 185)}, 0)`
        : "rgba(215, 223, 218, 0.58)";
      ctx.fillRect(x, y, barWidth, Math.max(2, barHeight - 2));
    }
  }

  function drawFootPrint(ctx, cx, cy, length, side) {
    const image = appState.pressureImages[side];
    const footWidth = length * 0.411;
    const imageBox = {
      x: cx - footWidth / 2,
      y: cy - length / 2,
      w: footWidth,
      h: length
    };
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.save();
      ctx.shadowColor = "rgba(23, 32, 29, 0.24)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      ctx.drawImage(image, imageBox.x, imageBox.y, imageBox.w, imageBox.h);
      ctx.restore();
    } else {
      drawFoot(ctx, cx, cy, length, side);
    }
    return imageBox;
  }

  function pressureIntensity(value) {
    const minVal = Number.isFinite(appState.pressureRange.min) ? appState.pressureRange.min : 0;
    const maxVal = Number.isFinite(appState.pressureRange.max) && appState.pressureRange.max > minVal
      ? appState.pressureRange.max
      : minVal + 1400;
    return clamp((value - minVal) / Math.max(1, maxVal - minVal), 0, 1);
  }

  function pressureCircleSize(value) {
    return 14 + pressureIntensity(value) * 52;
  }

  function drawStabilogramCanvas(canvas, samples, now) {
    const { ctx, width, height } = prepareCanvas(canvas);
    clearCanvas(ctx, width, height);
    const plot = { x: 38, y: 22, w: width - 58, h: height - 46 };
    drawGrid(ctx, plot, 6, 4);
    drawZeroLine(ctx, plot);
    drawSeries(ctx, samples, now, plot, (sample) => sample.cop.y, "#d26a1e", -0.45, 0.45);
    ctx.fillStyle = "#d26a1e";
    ctx.fillRect(plot.x + 8, plot.y + 8, 10, 3);
    ctx.fillStyle = "#62716b";
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(t("legendAp"), plot.x + 24, plot.y + 12);
  }

  function drawZeroLine(ctx, plot) {
    const y0 = plot.y + plot.h * 0.5;
    ctx.strokeStyle = "rgba(98, 113, 107, 0.38)";
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(plot.x, y0);
    ctx.lineTo(plot.x + plot.w, y0);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawLoadCanvas(canvas, samples, now) {
    const { ctx, width, height } = prepareCanvas(canvas);
    clearCanvas(ctx, width, height);
    const plot = { x: 38, y: 22, w: width - 58, h: height - 46 };
    drawGrid(ctx, plot, 6, 4);
    drawSeries(ctx, samples, now, plot, (sample) => {
      const total = sample.leftLoad + sample.rightLoad;
      return total > 0 ? sample.leftLoad / total : 0.5;
    }, "#008c83", 0, 1);
    const y50 = plot.y + plot.h * 0.5;
    ctx.strokeStyle = "rgba(210, 106, 30, 0.55)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(plot.x, y50);
    ctx.lineTo(plot.x + plot.w, y50);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#62716b";
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(t("leftLoadRatioLabel"), plot.x + 8, plot.y + 15);
  }

  function drawGrid(ctx, plot, columns, rows) {
    ctx.strokeStyle = "#d7dfda";
    ctx.lineWidth = 1;
    for (let i = 0; i <= columns; i += 1) {
      const x = plot.x + plot.w * i / columns;
      ctx.beginPath();
      ctx.moveTo(x, plot.y);
      ctx.lineTo(x, plot.y + plot.h);
      ctx.stroke();
    }
    for (let i = 0; i <= rows; i += 1) {
      const y = plot.y + plot.h * i / rows;
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
      ctx.stroke();
    }
  }

  function drawSupportArea(ctx, plot) {
    const leftX = plot.x + (FOOT_CENTER_X[SIDE_LEFT] + 0.65) / 1.3 * plot.w;
    const rightX = plot.x + (FOOT_CENTER_X[SIDE_RIGHT] + 0.65) / 1.3 * plot.w;
    const toeY = plot.y + (0.55 - 0.44) / 1.1 * plot.h;
    const heelY = plot.y + (0.55 + 0.44) / 1.1 * plot.h;
    ctx.fillStyle = "rgba(0, 140, 131, 0.08)";
    ctx.strokeStyle = "rgba(0, 140, 131, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX - 44, heelY);
    ctx.lineTo(leftX - 28, toeY);
    ctx.lineTo(rightX + 28, toeY);
    ctx.lineTo(rightX + 44, heelY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function drawAxisLabels(ctx, plot, xLabel, yLabel) {
    ctx.fillStyle = "#62716b";
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(xLabel, plot.x + plot.w / 2, plot.y + plot.h + 32);
    ctx.save();
    ctx.translate(plot.x - 24, plot.y + plot.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }

  function drawSeries(ctx, samples, now, plot, accessor, color, minValue, maxValue) {
    const windowStart = now - DEFAULT_WINDOW_MS;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let hasPoint = false;
    samples.forEach((sample) => {
      const value = clamp(accessor(sample), minValue, maxValue);
      const x = plot.x + (sample.localTime - windowStart) / DEFAULT_WINDOW_MS * plot.w;
      const y = plot.y + (maxValue - value) / (maxValue - minValue) * plot.h;
      if (!hasPoint) {
        ctx.moveTo(x, y);
        hasPoint = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    if (hasPoint) {
      ctx.stroke();
    }
  }

  function drawFoot(ctx, cx, cy, length, side) {
    const width = length * 0.36;
    const direction = side === SIDE_LEFT ? -1 : 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(direction, 1);
    ctx.fillStyle = "#f2f6f4";
    ctx.strokeStyle = "#b8c6c0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -length * 0.48);
    ctx.bezierCurveTo(width * 0.44, -length * 0.44, width * 0.56, -length * 0.17, width * 0.44, length * 0.12);
    ctx.bezierCurveTo(width * 0.36, length * 0.38, width * 0.22, length * 0.5, 0, length * 0.5);
    ctx.bezierCurveTo(-width * 0.2, length * 0.5, -width * 0.38, length * 0.36, -width * 0.44, length * 0.1);
    ctx.bezierCurveTo(-width * 0.5, -length * 0.2, -width * 0.38, -length * 0.43, 0, -length * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function footPointToCanvas(cx, cy, length, side, localPoint) {
    const direction = side === SIDE_LEFT ? -1 : 1;
    return {
      x: cx + localPoint.x * direction * length * 0.82,
      y: cy - localPoint.y * length
    };
  }

  function sensorImagePointToCanvas(imageBox, side, sensor) {
    const imageX = side === SIDE_LEFT ? sensor.imageX : 1 - sensor.imageX;
    return {
      x: imageBox.x + imageX * imageBox.w,
      y: imageBox.y + sensor.imageY * imageBox.h
    };
  }

  function footLocalPointToImageCanvas(imageBox, side, localPoint) {
    const baseX = clamp(localPoint.x / FOOT_LOCAL_X_RANGE + 0.5, 0.04, 0.96);
    const imageX = side === SIDE_LEFT ? baseX : 1 - baseX;
    const imageY = clamp(0.5 - localPoint.y / FOOT_LOCAL_Y_RANGE, 0.04, 0.96);
    return {
      x: imageBox.x + imageX * imageBox.w,
      y: imageBox.y + imageY * imageBox.h
    };
  }

  function heatColor(intensity, alpha) {
    const clamped = clamp(intensity, 0, 1);
    const hue = 210 * (1 - clamped);
    const lightness = 28 + clamped * 28;
    return `hsla(${hue}, 85%, ${lightness}%, ${alpha})`;
  }

  return {
    SensorLayout,
    calculateSwayMetrics,
    clamp,
    combineFootCops,
    computeFootCop,
    generateDemoFrame,
    initApp,
    validatePressureValues
  };
});
