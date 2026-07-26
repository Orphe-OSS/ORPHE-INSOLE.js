/**
 * おいしいうどんを作ろう！- ORPHE INSOLE Edition
 *
 * 足上げ（加速度・ジャイロ）→ 踏み込み（6ch圧力）の2段判定で「ふみふみ」を検出し、
 * うどんの生地をこねるゲームとして遊ぶ example。
 *
 * 接続UIは InsoleToolkit（profile: realtime-pressure = 3: gyro + acc + press / 200Hz）に任せ、
 * このファイルはゲーム描画・踏み込み判定・統計表示のみを担当する。
 *
 * 元プロジェクト: UDON_fsr_20250724（iOS計測サーバ + 4ch FSR）からの移植版。
 */
(function (root) {
  "use strict";

  const DEVICE_IDS = [0, 1];
  const CANVAS_HEIGHT = 400;

  // ============================================
  // i18n
  // ============================================

  const translations = {
    ja: {
      // --- page chrome ---
      metaTitle: "おいしいうどんを作ろう！- ORPHE INSOLE Edition",
      backLabel: "Examples 一覧へ戻る",
      languageLabel: "言語",
      pageTitleHtml: 'おいしいうどんを<span>作ろう！</span>',
      toolkitLabel: "ORPHE INSOLE 接続",
      leadCopy:
        "足上げを加速度・ジャイロで、踏み込みを6ch圧力で検出します。ふみふみするほど生地がもちもちになり、" +
        "1歩ごとの強度・左右バランス・ペースを下に表示します。",
      controlsLabel: "データソースと操作",
      sourceConnectTitle: "INSOLE を接続してください",
      sourceConnectDetail: "タイトル横のスイッチから、左右1台ずつ接続します。1台でも遊べます。",
      sourceLiveTitle: "接続中",
      sourceLiveDetailOne: "1台接続中。もう片方も接続すると左右バランスが取れます。",
      sourceLiveDetailTwo: "左右2台接続中。その場で足踏みしてください。",
      sourceReconnectTitle: "再接続中",
      sourceReconnectDetail: "電波が届く範囲に戻すと自動で復帰します。",
      sourceErrorTitle: "接続エラー",
      sourceDemoTitle: "デモ再生中",
      sourceDemoDetail: "合成データで動いています。INSOLE を接続すると自動でデモを止めます。",
      bgmOnHtml: '<i class="bi bi-volume-up-fill"></i> BGM ON',
      bgmOffHtml: '<i class="bi bi-volume-mute-fill"></i> BGM OFF',
      resetHtml: '<i class="bi bi-arrow-counterclockwise"></i> リセット',
      fullscreenLabel: "フルスクリーン切替",
      recordStartHtml: '<i class="bi bi-record-circle"></i> 生データ記録',
      recordStopHtml: '<i class="bi bi-stop-circle"></i> 記録停止',
      csvHtml: '<i class="bi bi-download"></i> CSV',
      recordCapReached: "記録上限に達したため停止しました",
      settingsGuide:
        "<strong>このゲームを遊ぶときは、Toolkit UI の歯車を開き、次のように設定してください。</strong>" +
        "<p><span>Data Outputs: <b>Raw Sensor Data</b> をON</span>" +
        "<span>Raw Data Acquisition: <b>Realtime</b></span>" +
        "<span>Realtime Streaming Format: <b>3: gyro + acc + press (200Hz)</b></span>" +
        '<span class="settings-guide-default">このデモプログラムでは初期設定で上記の設定となっています</span></p>',
      gameLabel: "ゲーム画面",
      gameFootnote:
        "接続すると START ボタンが出ます。導入アニメーションのあと、その場で足踏みしてください。" +
        "ゴールまで待てないときは画面右下の「ゴール」で結果画面へ飛べます。",
      statsTitle: "踏み込みの統計",
      statsDescription:
        "1歩ごとに「足上げの高さ × 踏み込みの強さ × タイミング」から強度を算出します。" +
        "目標は500ms前後で踏み込むことです。",
      statStepCount: "踏み回数",
      unitSteps: "歩",
      statMochi: "もちもち度",
      statLast: "最後の1歩",
      statAverage: "平均強度",
      statProgressWaiting: "START前",
      statProgressPlaying: "生地をこねています",
      statProgressDone: "もちもち度MAX",
      adviceEmpty: "踏み込みを検出すると、強度・左右バランス・ペースの評価がここに出ます。",
      scopeNote:
        "<strong>強度は無次元の指標です。</strong>" +
        "圧力は6ch ADC生値の合計を使うため、体重や装着具合で絶対値が変わります。" +
        "個人内での変化を見る用途に向き、個人間の比較や絶対評価には使えません。" +
        "しきい値が体格に合わないと感じたら <code>THRESHOLDS</code> を調整してください。",
      howTitle: "このexampleが使う Toolkit の設定プログラム",
      footerNote: "このページは研究・開発用のexampleです。医療機器ではなく、診断・治療・予防を目的としません。",
      // --- 調整UI ---
      tuningTitle: "しきい値の調整",
      tuningDescription:
        "初期値は軽めの踏み込み（実機ログで無負荷比 +15% 程度）に合わせています。" +
        "踏み込みが弱い方や強い方に合わせて、ここから変更できます。変更はこのブラウザに保存されます。",
      liveFloor: "無負荷ベースライン",
      liveDelta: "いまの増分",
      liveStepDelta: "直近1歩の増分",
      liveStepAccel: "直近1歩の足上げ",
      meterLabel: "圧力増分メーター",
      meterLegend:
        '<span><i class="swatch contact"></i>荷重が抜けた判定</span>' +
        '<span><i class="swatch step"></i>踏み込み成立</span>' +
        '<span><i class="swatch full"></i>踏み込み満点</span>',
      presetLabel: "プリセット",
      presetDefault: "標準",
      presetLight: "軽い踏み込み",
      presetFirm: "しっかり踏み込み",
      // --- advice ---
      adviceIntensityPerfect: "✅ 素晴らしい！理想的な踏み込み強度です",
      adviceIntensityGood: "👍 良好です。もう少し強く踏み込むとより効果的です",
      adviceIntensityWeak: "⚠️ 踏み込みが弱めです。足をしっかり上げてから踏み込みましょう",
      adviceIntensityTooWeak: "⚠️ 踏み込みが非常に弱いです。動作を大きくしてみましょう",
      adviceBalanceGood: "✅ 左右バランスが良好です",
      adviceBalanceBad: "⚠️ 左右のバランスが偏っています。均等に踏むよう意識しましょう",
      adviceBalanceSingle: "💭 1台のみ接続中です。左右バランスは2台つなぐと表示されます",
      advicePaceFast: "✅ テンポ良く踏めています",
      advicePaceMid: "👍 適度なペースです",
      advicePaceSlow: "💭 もう少しテンポを上げてみましょう",
      audioError: "音声ファイルを読み込めませんでした（BGMなしで続行します）",
      // --- in-canvas（既存ゲーム内文言）---
      waiting_connection: "デバイスの接続を待っています",
      connected_message: "接続されました",
      craft_main: "うどん作りは職人技!!",
      instruction_main: "なるべく早くふみふみして\n生地をもちもちにしよう！",
      loading_text: "LOADING...",
      knead_main: "ふみふみしてください",
      mochi_degree: "もちもち度",
      goal_shortcut: "ゴール",
      skill_title: "ふみふみ技",
      result_total: "総踏み回数: ",
      result_left: "左足: ",
      result_right: " / 右足: ",
      result_avg: "平均強度: ",
      result_rating: "評価: "
    },
    en: {
      metaTitle: "Let's make delicious UDON! - ORPHE INSOLE Edition",
      backLabel: "Back to examples",
      languageLabel: "Language",
      pageTitleHtml: "Let's make <span>delicious UDON!</span>",
      toolkitLabel: "ORPHE INSOLE connection",
      leadCopy:
        "Foot lift is detected from acceleration and gyro, the step itself from the 6ch pressure sensors. " +
        "Keep stepping to make the dough chewy; per-step intensity, left-right balance and pace appear below.",
      controlsLabel: "Data source and controls",
      sourceConnectTitle: "Connect an INSOLE",
      sourceConnectDetail: "Use the switches next to the title to connect one device per foot. One device is enough to play.",
      sourceLiveTitle: "Connected",
      sourceLiveDetailOne: "One device connected. Connect the other foot to see left-right balance.",
      sourceLiveDetailTwo: "Both feet connected. Step in place.",
      sourceReconnectTitle: "Reconnecting",
      sourceReconnectDetail: "Move back into range and the connection recovers automatically.",
      sourceErrorTitle: "Connection error",
      sourceDemoTitle: "Demo playback",
      sourceDemoDetail: "Running on synthetic data. Connecting an INSOLE stops the demo automatically.",
      bgmOnHtml: '<i class="bi bi-volume-up-fill"></i> BGM ON',
      bgmOffHtml: '<i class="bi bi-volume-mute-fill"></i> BGM OFF',
      resetHtml: '<i class="bi bi-arrow-counterclockwise"></i> Reset',
      fullscreenLabel: "Toggle fullscreen",
      recordStartHtml: '<i class="bi bi-record-circle"></i> Record raw',
      recordStopHtml: '<i class="bi bi-stop-circle"></i> Stop recording',
      csvHtml: '<i class="bi bi-download"></i> CSV',
      recordCapReached: "Recording stopped: buffer limit reached",
      settingsGuide:
        "<strong>To play this game, open the gear in the Toolkit UI and set it up like this.</strong>" +
        "<p><span>Data Outputs: <b>Raw Sensor Data</b> ON</span>" +
        "<span>Raw Data Acquisition: <b>Realtime</b></span>" +
        "<span>Realtime Streaming Format: <b>3: gyro + acc + press (200Hz)</b></span>" +
        '<span class="settings-guide-default">This demo already starts with the settings above</span></p>',
      gameLabel: "Game screen",
      gameFootnote:
        "A START button appears once connected. After the intro animation, step in place. " +
        'If you do not want to wait for the goal, use the "GOAL" button at the bottom right.',
      statsTitle: "Stepping statistics",
      statsDescription:
        "Each step is scored as lift height x stepping strength x timing. Aim for about 500 ms per lift.",
      statStepCount: "Steps",
      unitSteps: "steps",
      statMochi: "Chewiness",
      statLast: "Last step",
      statAverage: "Average intensity",
      statProgressWaiting: "Before START",
      statProgressPlaying: "Kneading the dough",
      statProgressDone: "Chewiness maxed",
      adviceEmpty: "Once steps are detected, intensity, balance and pace feedback appear here.",
      scopeNote:
        "<strong>Intensity is a dimensionless index.</strong> " +
        "Pressure is the sum of raw 6ch ADC values, so absolute numbers change with body weight and fit. " +
        "Use it to track change within one person, not to compare people or make absolute judgements. " +
        "Adjust <code>THRESHOLDS</code> if the defaults do not match your build.",
      howTitle: "Toolkit setup used by this example",
      footerNote:
        "This page is a research and development example. It is not a medical device and is not intended for diagnosis, treatment or prevention.",
      tuningTitle: "Threshold calibration",
      tuningDescription:
        "Defaults are tuned for light stepping (about +15% over the unloaded baseline, measured on real hardware). " +
        "Adjust them for weaker or stronger steppers. Changes are saved in this browser.",
      liveFloor: "Unloaded baseline",
      liveDelta: "Current delta",
      liveStepDelta: "Last step delta",
      liveStepAccel: "Last step lift",
      meterLabel: "Pressure delta meter",
      meterLegend:
        '<span><i class="swatch contact"></i>Unloaded threshold</span>' +
        '<span><i class="swatch step"></i>Step threshold</span>' +
        '<span><i class="swatch full"></i>Full score</span>',
      presetLabel: "Preset",
      presetDefault: "Standard",
      presetLight: "Light stepping",
      presetFirm: "Firm stepping",
      adviceIntensityPerfect: "✅ Excellent! Ideal stepping intensity",
      adviceIntensityGood: "👍 Good. Step harder for better results",
      adviceIntensityWeak: "⚠️ Weak stepping. Lift your feet higher before stepping",
      adviceIntensityTooWeak: "⚠️ Very weak stepping. Make bigger movements",
      adviceBalanceGood: "✅ Good left-right balance",
      adviceBalanceBad: "⚠️ Left-right imbalance. Try to step evenly",
      adviceBalanceSingle: "💭 Only one device connected. Connect both feet to see balance",
      advicePaceFast: "✅ Good tempo",
      advicePaceMid: "👍 Moderate pace",
      advicePaceSlow: "💭 Try to increase the tempo",
      audioError: "Could not load the audio files (continuing without BGM)",
      waiting_connection: "Waiting for device connection",
      connected_message: "Connected",
      craft_main: "Making udon is a true craft!",
      instruction_main: "Try to knead as quickly as possible\nto make the dough chewy!",
      loading_text: "LOADING...",
      knead_main: "Please knead it",
      mochi_degree: "Chewiness",
      goal_shortcut: "GOAL",
      skill_title: "Stepping Skill",
      result_total: "Total Steps: ",
      result_left: "Left: ",
      result_right: " / Right: ",
      result_avg: "Avg Intensity: ",
      result_rating: "Rating: "
    }
  };

  let currentLanguage = "ja";

  function t(key) {
    const dict = translations[currentLanguage] || translations.ja;
    return dict[key] !== undefined ? dict[key] : key;
  }

  function applyLanguage() {
    document.documentElement.lang = currentLanguage;
    document.title = t("metaTitle");

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.dataset.i18nTitle));
    });

    document.querySelectorAll("[data-lang-button]").forEach(function (btn) {
      const active = btn.dataset.langButton === currentLanguage;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    renderBgmButton();
    renderRecordButton();
    renderTuningGrid();
    updateConnectionSource();
    markStatsDirty();
  }

  function setLanguage(lang) {
    if (!translations[lang] || lang === currentLanguage) return;
    currentLanguage = lang;
    applyLanguage();
  }

  // ============================================
  // 踏み込み判定
  // ============================================

  /**
   * ORPHE INSOLE の圧力は 6ch の ADC 生値で、無負荷でも 1ch あたり約220の
   * オフセットが乗る（実機 00000161/left で合計 約1358）。したがって絶対値で
   * しきい値を置くと個体差・装着差でまるごと外れる。
   *
   * ここでは接地判定・踏み込み判定を「直近数秒の最小値（無負荷ベースライン）
   * からの増分 = delta」で行う。floor は自動追従するのでキャリブレーション不要。
   */
  const THRESHOLDS = {
    // --- 足上げ（動きの検出）---
    LIFT_ACCELERATION_THRESHOLD: 0.3, // |accY| [G]
    LIFT_Z_DEVIATION: 0.3, // |accZ - 1G|
    GYRO_SPIKE_THRESHOLD: 50.0, // |gyro| [deg/s]
    // --- 接地・踏み込み（delta = 合計 - 無負荷ベースライン）---
    CONTACT_DELTA: 100, // これ未満なら荷重が抜けている
    STEP_DELTA_MIN: 150, // これを超えたら踏み込み成立
    FLOOR_WINDOW_MS: 4000, // 無負荷ベースラインを探す窓
    // --- 時間 ---
    MIN_LIFT_DURATION: 100,
    MAX_LIFT_DURATION: 2000,
    OPTIMAL_LIFT_DURATION: 500,
    HISTORY_SIZE: 10,
    // --- 強度の配点（実機ログから決定。詳細は calculateStepIntensity）---
    INTENSITY_BASE: 0.5,
    LIFT_WEIGHT: 1.1,
    LIFT_OFFSET: 0.5, // |accY| がこの値で 0点
    LIFT_SPAN: 1.5, // +この値で 1.0点
    PRESSURE_WEIGHT: 1.0,
    PRESSURE_OFFSET: 150, // delta がこの値で 0点
    PRESSURE_SPAN: 400, // +この値で 1.0点
    TIME_WEIGHT: 0.5,
    SCORE_CAP: 1.2, // 各項の上限
    // --- 評価 ---
    REHAB_WEAK_THRESHOLD: 1.0,
    REHAB_GOOD_THRESHOLD: 1.5,
    REHAB_EXCELLENT_THRESHOLD: 2.0,
    REHAB_PERFECT_THRESHOLD: 2.5
  };

  let stepCooldown = 500;
  const lastStepTime = { left: 0, right: 0 };
  let lastActiveSide = "left";

  function createFootState() {
    return {
      isLifted: false,
      liftStartTime: 0,
      maxLiftAcceleration: 0,
      baselineZ: 1.0,
      wasLoaded: false,
      lastDelta: 0,
      // 無負荷ベースライン（合計圧力の直近最小値）を 500ms バケットで追跡する
      floorBuckets: [],
      floorCurrent: null,
      floorBucketStart: 0,
      floorTotal: null,
      pressureHistory: [],
      accelerationHistory: []
    };
  }

  /** 直近 FLOOR_WINDOW_MS の合計圧力の最小値を返す（無負荷ベースライン） */
  function updateFloor(state, now, total) {
    const BUCKET_MS = 500;
    const bucketCount = Math.max(1, Math.round(THRESHOLDS.FLOOR_WINDOW_MS / BUCKET_MS));

    if (state.floorCurrent === null || now - state.floorBucketStart >= BUCKET_MS) {
      if (state.floorCurrent !== null) {
        state.floorBuckets.push(state.floorCurrent);
        while (state.floorBuckets.length > bucketCount) state.floorBuckets.shift();
      }
      state.floorCurrent = total;
      state.floorBucketStart = now;
    } else if (total < state.floorCurrent) {
      state.floorCurrent = total;
    }

    let floor = state.floorCurrent;
    for (let i = 0; i < state.floorBuckets.length; i++) {
      if (state.floorBuckets[i] < floor) floor = state.floorBuckets[i];
    }
    state.floorTotal = floor;
    return floor;
  }

  const footLiftState = { left: createFootState(), right: createFootState() };

  function emptyStats() {
    return {
      totalSteps: 0,
      leftSteps: 0,
      rightSteps: 0,
      averageIntensity: 0,
      lastStepIntensity: 0,
      lastStepEvaluation: "",
      lastStepDelta: null,
      lastStepLiftAccel: null,
      sessionStartTime: Date.now(),
      stepIntensities: []
    };
  }

  let stepStats = emptyStats();

  // ============================================
  // ログ / CSV（しきい値調整のための計測用）
  //
  // eventLog は常に記録する（軽い）。frameLog は「生データ記録」を押している間だけ。
  // window.udonDebug から DevTools で直接触れる。
  // ============================================

  const EVENT_LOG_LIMIT = 20000;
  const FRAME_LOG_LIMIT = 240000; // 200Hz × 2台 で約10分

  const eventLog = [];
  const frameLog = [];
  let recording = false;

  function logEvent(type, payload) {
    if (eventLog.length >= EVENT_LOG_LIMIT) eventLog.shift();
    eventLog.push(Object.assign({ t: Date.now(), type: type, gamepar: gamepar }, payload || {}));
    updateCsvButton();
  }

  function logFrame(row) {
    if (!recording) return;
    if (frameLog.length >= FRAME_LOG_LIMIT) {
      stopRecording();
      const detail = document.getElementById("source-detail");
      if (detail) detail.textContent = t("recordCapReached");
      return;
    }
    frameLog.push(row);
  }

  function startRecording() {
    frameLog.length = 0;
    recording = true;
    logEvent("recording_start", {});
    renderRecordButton();
  }

  function stopRecording() {
    if (!recording) return;
    recording = false;
    logEvent("recording_stop", { frames: frameLog.length });
    renderRecordButton();
  }

  function csvEscape(value) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
  }

  function toCsv(header, rows) {
    const lines = [header.join(",")];
    rows.forEach(function (row) {
      lines.push(
        header
          .map(function (key) {
            return csvEscape(row[key]);
          })
          .join(",")
      );
    });
    return lines.join("\n") + "\n";
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 0);
  }

  function timestampSuffix() {
    return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  }

  const EVENT_HEADER = [
    "t",
    "type",
    "gamepar",
    "source",
    "side",
    "intensity",
    "evaluation",
    "liftDuration",
    "maxLiftAccel",
    "totalPressure",
    "floorPressure",
    "deltaPressure",
    "heelPressure",
    "totalstep",
    "frames"
  ];

  const FRAME_HEADER = [
    "t",
    "sensorT",
    "serial",
    "deviceId",
    "side",
    "source",
    "accX",
    "accY",
    "accZ",
    "gyroX",
    "gyroY",
    "gyroZ",
    "p1",
    "p2",
    "p3",
    "p4",
    "p5",
    "p6",
    "totalPressure",
    "floorPressure",
    "deltaPressure",
    "isLifted"
  ];

  function downloadEvents() {
    if (!eventLog.length) return;
    download("udon-events-" + timestampSuffix() + ".csv", toCsv(EVENT_HEADER, eventLog));
  }

  function downloadFrames() {
    if (!frameLog.length) return;
    download("udon-frames-" + timestampSuffix() + ".csv", toCsv(FRAME_HEADER, frameLog));
  }

  function downloadAll() {
    downloadEvents();
    if (frameLog.length) downloadFrames();
  }

  function updateCsvButton() {
    const btn = document.getElementById("csv-button");
    if (btn) btn.disabled = eventLog.length === 0 && frameLog.length === 0;
  }

  function renderRecordButton() {
    const btn = document.getElementById("record-toggle");
    if (!btn) return;
    btn.innerHTML = t(recording ? "recordStopHtml" : "recordStartHtml");
    btn.classList.toggle("recording", recording);
    if (recording && frameLog.length) {
      btn.innerHTML += " (" + frameLog.length + ")";
    }
  }

  function processStepDetection(data, side, source) {
    const now = Date.now();
    const state = footLiftState[side];
    const accel = data.acceleration;
    const gyro = data.gyroscope || [0, 0, 0];
    const pressureData = data.pressureData || [0, 0, 0, 0, 0, 0];
    const totalPressure = pressureData.reduce(function (sum, p) {
      return sum + p;
    }, 0);

    const floorTotal = updateFloor(state, now, totalPressure);
    const deltaPressure = Math.max(0, totalPressure - floorTotal);
    state.lastDelta = deltaPressure;
    lastActiveSide = side;

    logFrame({
      t: now,
      sensorT: data.sensorTimestamp !== undefined ? data.sensorTimestamp : "",
      serial: data.serialNumber !== undefined ? data.serialNumber : "",
      deviceId: data.deviceId !== undefined ? data.deviceId : "",
      side: side,
      source: source || "live",
      accX: accel[0].toFixed(4),
      accY: accel[1].toFixed(4),
      accZ: accel[2].toFixed(4),
      gyroX: gyro[0].toFixed(2),
      gyroY: gyro[1].toFixed(2),
      gyroZ: gyro[2].toFixed(2),
      p1: pressureData[0],
      p2: pressureData[1],
      p3: pressureData[2],
      p4: pressureData[3],
      p5: pressureData[4],
      p6: pressureData[5],
      totalPressure: totalPressure,
      floorPressure: floorTotal,
      deltaPressure: deltaPressure,
      isLifted: state.isLifted ? 1 : 0
    });

    state.accelerationHistory.push({
      x: accel[0],
      y: accel[1],
      z: accel[2],
      timestamp: now,
      totalPressure: totalPressure
    });
    if (state.accelerationHistory.length > THRESHOLDS.HISTORY_SIZE) {
      state.accelerationHistory.shift();
    }

    state.pressureHistory.push({
      value: totalPressure,
      pressure5: pressureData[5] || 0,
      timestamp: now
    });
    if (state.pressureHistory.length > THRESHOLDS.HISTORY_SIZE) {
      state.pressureHistory.shift();
    }

    // 足上げ判定
    const yAccelVariation = Math.abs(accel[1]);
    const zDeviation = Math.abs(accel[2] - state.baselineZ);
    const gyroMagnitude = Math.sqrt(gyro[0] * gyro[0] + gyro[1] * gyro[1] + gyro[2] * gyro[2]);

    const isMoving =
      yAccelVariation > THRESHOLDS.LIFT_ACCELERATION_THRESHOLD ||
      zDeviation > THRESHOLDS.LIFT_Z_DEVIATION ||
      gyroMagnitude > THRESHOLDS.GYRO_SPIKE_THRESHOLD;

    const isUnloaded = deltaPressure < THRESHOLDS.CONTACT_DELTA;

    // 足上げ開始: 荷重が抜けていて、かつ「動いている」or「直前まで荷重していた」
    if (!state.isLifted && isUnloaded && (isMoving || state.wasLoaded)) {
      state.isLifted = true;
      state.wasLoaded = false;
      state.liftStartTime = now;
      state.maxLiftAcceleration = yAccelVariation;
      logEvent("lift_start", {
        source: source || "live",
        side: side,
        maxLiftAccel: yAccelVariation.toFixed(4),
        totalPressure: totalPressure,
        floorPressure: floorTotal,
        deltaPressure: deltaPressure,
        heelPressure: pressureData[5] || 0
      });
      return { detected: false };
    }

    if (state.isLifted) {
      state.maxLiftAcceleration = Math.max(state.maxLiftAcceleration, yAccelVariation);

      const isStepDetected =
        deltaPressure > THRESHOLDS.STEP_DELTA_MIN && now - lastStepTime[side] > stepCooldown;

      if (isStepDetected) {
        const liftDuration = now - state.liftStartTime;
        const maxLiftAccel = state.maxLiftAcceleration;
        const stepIntensity = calculateStepIntensity(maxLiftAccel, deltaPressure, liftDuration);

        executeStepAction(side, stepIntensity, deltaPressure, maxLiftAccel);

        logEvent("step", {
          source: source || "live",
          side: side,
          intensity: stepIntensity.toFixed(3),
          evaluation: stepStats.lastStepEvaluation,
          liftDuration: liftDuration,
          maxLiftAccel: maxLiftAccel.toFixed(4),
          totalPressure: totalPressure,
          floorPressure: floorTotal,
          deltaPressure: deltaPressure,
          heelPressure: pressureData[5] || 0,
          totalstep: totalstep
        });

        state.isLifted = false;
        state.wasLoaded = true;
        state.maxLiftAcceleration = 0;
        lastStepTime[side] = now;
        return { detected: true, intensity: stepIntensity, side: side };
      }

      if (now - state.liftStartTime > THRESHOLDS.MAX_LIFT_DURATION) {
        state.isLifted = false;
        state.maxLiftAcceleration = 0;
      }
    } else if (deltaPressure > THRESHOLDS.STEP_DELTA_MIN) {
      // 足上げを挟まず荷重されている（立っているだけ）状態を記録しておく
      state.wasLoaded = true;
    }

    return { detected: false };
  }

  /**
   * 1歩の強度。足上げの高さ・踏み込みの大きさ・タイミングを 0..1.2 に正規化し、
   * 重み付きの「和」で合成する。
   *
   * 旧実装は3項の「積」で、かつ足上げ項が |accY| 0.8 で飽和していた。実機の
   * |accY| は 1歩あたり 0.5〜3.3G に達するため足上げ項が常に最大値へ張り付き、
   * 34歩の実測で PERFECT/EXCELLENT が28歩・WEAK以下が0歩と評価が機能していなかった。
   * 係数は同ログ（左足34歩）で WEAK〜PERFECT に分散するよう決めている。
   */
  function calculateStepIntensity(maxLiftAccel, deltaPressure, liftDuration) {
    const cap = THRESHOLDS.SCORE_CAP;
    const clamp01 = function (v) {
      return Math.max(0, Math.min(cap, v));
    };

    const liftScore = clamp01((maxLiftAccel - THRESHOLDS.LIFT_OFFSET) / THRESHOLDS.LIFT_SPAN);
    const pressureScore = clamp01(
      (deltaPressure - THRESHOLDS.PRESSURE_OFFSET) / THRESHOLDS.PRESSURE_SPAN
    );

    let timeScore;
    if (liftDuration < THRESHOLDS.MIN_LIFT_DURATION || liftDuration > THRESHOLDS.MAX_LIFT_DURATION) {
      timeScore = 0;
    } else {
      const deviation = Math.abs(liftDuration - THRESHOLDS.OPTIMAL_LIFT_DURATION);
      timeScore = clamp01(1 - (deviation / THRESHOLDS.OPTIMAL_LIFT_DURATION) * 0.8);
    }

    return (
      THRESHOLDS.INTENSITY_BASE +
      THRESHOLDS.LIFT_WEIGHT * liftScore +
      THRESHOLDS.PRESSURE_WEIGHT * pressureScore +
      THRESHOLDS.TIME_WEIGHT * timeScore
    );
  }

  function evaluationOf(intensity) {
    if (intensity >= THRESHOLDS.REHAB_PERFECT_THRESHOLD) return "PERFECT";
    if (intensity >= THRESHOLDS.REHAB_EXCELLENT_THRESHOLD) return "EXCELLENT";
    if (intensity >= THRESHOLDS.REHAB_GOOD_THRESHOLD) return "GOOD";
    if (intensity >= THRESHOLDS.REHAB_WEAK_THRESHOLD) return "WEAK";
    return "TOO WEAK";
  }

  function executeStepAction(side, intensity, deltaPressure, maxLiftAccel) {
    // 最後の1歩は常に表示する（START前でもしきい値の当たりを確認できるように）
    stepStats.lastStepIntensity = intensity;
    stepStats.lastStepEvaluation = evaluationOf(intensity);
    stepStats.lastStepDelta = deltaPressure;
    stepStats.lastStepLiftAccel = maxLiftAccel;

    // ゲーム中(gamepar 3)以外は集計に混ぜない。結果画面の統計を汚さないため。
    if (gamepar !== 3) {
      markStatsDirty();
      return;
    }

    totalstep++;
    UDON_UGOKU();
    if (isBGMEnabled && punisound && punisound.isLoaded && punisound.isLoaded()) {
      punisound.play();
    }

    stepStats.totalSteps++;
    if (side === "left") {
      stepStats.leftSteps++;
    } else {
      stepStats.rightSteps++;
    }
    stepStats.stepIntensities.push(intensity);

    const recent = stepStats.stepIntensities.slice(-20);
    stepStats.averageIntensity =
      recent.reduce(function (sum, i) {
        return sum + i;
      }, 0) / recent.length;

    markStatsDirty();
  }

  // ============================================
  // 統計表示（ゲーム画面の下にテキストで出す）
  // ============================================

  let statsDirty = true;

  function markStatsDirty() {
    statsDirty = true;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function countIntensities(min, max) {
    return stepStats.stepIntensities.filter(function (i) {
      return i >= min && (max === undefined || i < max);
    }).length;
  }

  function renderStats() {
    setText("step-count", String(totalstep));
    setText("stat-lr", "L " + stepStats.leftSteps + " / R " + stepStats.rightSteps);

    const mochi = Math.min(100, Math.round((totalstep / MaxStap) * 100));
    setText("mochi-level", mochi + "%");

    let progressKey = "statProgressWaiting";
    if (gamepar === 3) progressKey = "statProgressPlaying";
    else if (gamepar === 9 || gamepar === 10) progressKey = "statProgressDone";
    setText("stat-progress", t(progressKey));

    if (stepStats.totalSteps > 0) {
      setText("stat-last-intensity", stepStats.lastStepIntensity.toFixed(2));
      setText("stat-last-eval", stepStats.lastStepEvaluation);
      setText("stat-avg-intensity", stepStats.averageIntensity.toFixed(2));
      const durationSec = Math.max(1, (Date.now() - stepStats.sessionStartTime) / 1000);
      setText("stat-pace", ((stepStats.totalSteps / durationSec) * 60).toFixed(1) + " steps/min");
    } else {
      setText("stat-last-intensity", "—");
      setText("stat-last-eval", "—");
      setText("stat-avg-intensity", "—");
      setText("stat-pace", "— steps/min");
    }

    setText("rating-perfect", String(countIntensities(THRESHOLDS.REHAB_PERFECT_THRESHOLD)));
    setText(
      "rating-excellent",
      String(countIntensities(THRESHOLDS.REHAB_EXCELLENT_THRESHOLD, THRESHOLDS.REHAB_PERFECT_THRESHOLD))
    );
    setText(
      "rating-good",
      String(countIntensities(THRESHOLDS.REHAB_GOOD_THRESHOLD, THRESHOLDS.REHAB_EXCELLENT_THRESHOLD))
    );
    setText(
      "rating-weak",
      String(countIntensities(THRESHOLDS.REHAB_WEAK_THRESHOLD, THRESHOLDS.REHAB_GOOD_THRESHOLD))
    );
    setText("rating-tooweak", String(countIntensities(0, THRESHOLDS.REHAB_WEAK_THRESHOLD)));

    renderAdvice();
  }

  function renderAdvice() {
    const list = document.getElementById("advice-list");
    if (!list) return;

    if (stepStats.totalSteps === 0) {
      list.innerHTML = '<li class="advice-empty"></li>';
      list.firstChild.textContent = t("adviceEmpty");
      return;
    }

    const items = [];
    const avg = stepStats.averageIntensity;

    if (avg >= THRESHOLDS.REHAB_EXCELLENT_THRESHOLD) {
      items.push({ tone: "good", key: "adviceIntensityPerfect" });
    } else if (avg >= THRESHOLDS.REHAB_GOOD_THRESHOLD) {
      items.push({ tone: "good", key: "adviceIntensityGood" });
    } else if (avg >= THRESHOLDS.REHAB_WEAK_THRESHOLD) {
      items.push({ tone: "warn", key: "adviceIntensityWeak" });
    } else {
      items.push({ tone: "warn", key: "adviceIntensityTooWeak" });
    }

    const bothFeet = connectedCount() >= 2;
    if (!bothFeet) {
      items.push({ tone: "", key: "adviceBalanceSingle" });
    } else {
      const leftRatio = stepStats.leftSteps / stepStats.totalSteps;
      items.push(
        leftRatio >= 0.4 && leftRatio <= 0.6
          ? { tone: "good", key: "adviceBalanceGood" }
          : { tone: "warn", key: "adviceBalanceBad" }
      );
    }

    const durationSec = Math.max(1, (Date.now() - stepStats.sessionStartTime) / 1000);
    const pacePerMin = (stepStats.totalSteps / durationSec) * 60;
    if (pacePerMin > 60) {
      items.push({ tone: "good", key: "advicePaceFast" });
    } else if (pacePerMin > 40) {
      items.push({ tone: "", key: "advicePaceMid" });
    } else {
      items.push({ tone: "", key: "advicePaceSlow" });
    }

    list.textContent = "";
    items.forEach(function (item) {
      const li = document.createElement("li");
      if (item.tone) li.className = item.tone;
      li.textContent = t(item.key);
      list.appendChild(li);
    });
  }

  // ============================================
  // 接続（InsoleToolkit）
  // ============================================

  const connected = [false, false];
  const reconnecting = [false, false];
  const deviceToSide = {};
  const latestSensorValues = [
    { acceleration: null, gyroscope: null, pressure: null },
    { acceleration: null, gyroscope: null, pressure: null }
  ];

  function connectedCount() {
    return connected.filter(Boolean).length;
  }

  function resolveDeviceSide(deviceId) {
    const insole = Array.isArray(root.insoles) ? root.insoles[deviceId] : null;
    const mount = insole && insole.device_information ? insole.device_information.mount_position : null;
    let side = null;

    if (root.OrpheInsoleUtils && typeof root.OrpheInsoleUtils.sideFromMountPosition === "function") {
      const resolved = root.OrpheInsoleUtils.sideFromMountPosition(mount);
      if (resolved) side = resolved.side;
    }
    // mount_position が読めない個体では deviceId を左右のフォールバックに使う
    if (!side) side = deviceId === 0 ? "left" : "right";

    deviceToSide[deviceId] = side;
    return side;
  }

  function setSource(badgeClass, badgeText, titleKey, detailKey, detailRaw) {
    const badge = document.getElementById("source-badge");
    if (badge) {
      badge.className = "source-badge " + badgeClass;
      badge.textContent = badgeText;
    }
    setText("source-title", t(titleKey));
    setText("source-detail", detailRaw !== undefined ? detailRaw : t(detailKey));
  }

  function updateConnectionSource() {
    const count = connectedCount();
    if (count > 0) {
      setSource("live", "LIVE", "sourceLiveTitle", count >= 2 ? "sourceLiveDetailTwo" : "sourceLiveDetailOne");
    } else if (demo.running) {
      setSource("demo", "DEMO", "sourceDemoTitle", "sourceDemoDetail");
    } else if (reconnecting[0] || reconnecting[1]) {
      setSource("warning", "RETRY", "sourceReconnectTitle", "sourceReconnectDetail");
    } else {
      setSource("waiting", "WAITING", "sourceConnectTitle", "sourceConnectDetail");
    }
  }

  function setupToolkit(deviceId) {
    if (typeof root.buildInsoleToolkit !== "function") {
      setSource("error", "ERROR", "sourceErrorTitle", undefined, "InsoleToolkit.js が読み込まれていません");
      return;
    }

    root.buildInsoleToolkit(
      document.getElementById("toolkit" + deviceId),
      "INSOLE 0" + (deviceId + 1),
      deviceId,
      {
        profile: "realtime-pressure",
        autoReconnect: true,
        reconnectIntervalMs: 2000,
        onStateChange: function (snapshot) {
          connected[deviceId] = Boolean(snapshot && snapshot.connected);
          if (connected[deviceId]) {
            reconnecting[deviceId] = false;
            resolveDeviceSide(deviceId);
          }
          syncGameStateWithConnection();
          updateConnectionSource();
        },
        onError: function (error) {
          if (error && error.name === "NotFoundError") {
            updateConnectionSource();
            return;
          }
          const message = error && error.message ? error.message : String(error);
          setSource("error", "ERROR", "sourceErrorTitle", undefined, message);
        }
      }
    );

    const insole = root.insoles[deviceId];
    insole.setup();

    insole.gotConvertedAcc = function (acc) {
      latestSensorValues[this.id].acceleration = [acc.x, acc.y, acc.z];
    };
    insole.gotConvertedGyro = function (gyro) {
      latestSensorValues[this.id].gyroscope = [gyro.x, gyro.y, gyro.z];
    };
    insole.gotPress = function (press) {
      const latest = latestSensorValues[this.id];
      latest.pressure = press.values;
      const side = deviceToSide[this.id];
      if (!side || !latest.acceleration || !latest.gyroscope) return;
      processStepDetection(
        {
          acceleration: latest.acceleration,
          gyroscope: latest.gyroscope,
          pressureData: latest.pressure,
          deviceId: this.id,
          // BLE 1パケットに4サンプル入るため Date.now() は4行同値になる。
          // タイミング解析にはセンサ側のタイムスタンプ/シリアルを使うこと。
          sensorTimestamp: press.timestamp,
          serialNumber: press.serial_number
        },
        side,
        "live"
      );
    };
    insole.onConnect = function () {
      connected[this.id] = true;
      reconnecting[this.id] = false;
      resolveDeviceSide(this.id);
      syncGameStateWithConnection();
      updateConnectionSource();
    };
    insole.onDisconnect = function () {
      connected[this.id] = false;
      reconnecting[this.id] = true;
      syncGameStateWithConnection();
      updateConnectionSource();
    };
    insole.onReconnectSuccess = function () {
      reconnecting[this.id] = false;
      updateConnectionSource();
    };
  }

  function syncGameStateWithConnection() {
    const count = connectedCount();
    if (count > 0) {
      // 実機が来たらデモは即座に降りる
      if (demo.running) stopDemo();
      if (gamepar === 0) gamepar = 5;
    } else {
      if (!demo.running && gamepar !== 0) gamepar = 0;
      scheduleDemo(DEMO_RESTART_DELAY_MS);
    }
    markStatsDirty();
  }

  // ============================================
  // デモ再生（センサ未接続のあいだ合成データで動かす）
  //
  // 合成した acc / gyro / press フレームを実機と同じ processStepDetection に流すので、
  // 判定ロジックそのものがデモでも動く（＝しきい値の当たりをデモで確認できる）。
  // ============================================

  const DEMO_TICK_MS = 20; // 50Hz
  const DEMO_CONTACT_MS = 420;
  const DEMO_START_DELAY_MS = 700;
  const DEMO_RESTART_DELAY_MS = 3000;
  const DEMO_RESULT_HOLD_MS = 6000;

  // 足上げ時間と踏み込みピークを巡回させ、評価がばらけるようにする
  const DEMO_LIFT_PATTERN = [500, 380, 620, 260, 780, 460];

  // 実機（00000161/left）の無負荷ベースライン。ADC は 0 ではなく約220のオフセットが乗る。
  const DEMO_PRESSURE_FLOOR = [220, 222, 220, 253, 222, 221];

  // 実機ログの荷重配分に合わせる（踵と中足部が主に反応し、前足部はわずか）
  const DEMO_PRESSURE_SHAPE = [0.04, 0.09, 0.03, 0.11, 0.28, 0.45];

  // 踏み込みで合計にどれだけ上乗せするか（実機の delta は約180〜950）
  const DEMO_PEAK_DELTA = [250, 520, 340, 900, 200, 660];

  // 足上げ時の |accY| ピーク（実機は 0.5〜3.3G）
  const DEMO_LIFT_ACCEL = [0.9, 1.5, 2.3, 1.1, 2.9, 1.3];

  const demo = {
    running: false,
    timer: null,
    startTimer: null,
    resultShownAt: 0,
    foot: {
      left: {
        cycleStart: 0,
        index: 0,
        liftMs: DEMO_LIFT_PATTERN[0],
        peak: DEMO_PEAK_DELTA[0],
        liftAccel: DEMO_LIFT_ACCEL[0]
      },
      right: {
        cycleStart: 0,
        index: 3,
        liftMs: DEMO_LIFT_PATTERN[3],
        peak: DEMO_PEAK_DELTA[3],
        liftAccel: DEMO_LIFT_ACCEL[3]
      }
    }
  };

  function demoNoise(scale) {
    return (Math.random() - 0.5) * scale;
  }

  function demoFootFrame(side, now) {
    const foot = demo.foot[side];
    const cycleLength = foot.liftMs + DEMO_CONTACT_MS;
    let elapsed = now - foot.cycleStart;

    if (elapsed >= cycleLength) {
      foot.index = (foot.index + 1) % DEMO_LIFT_PATTERN.length;
      foot.liftMs = DEMO_LIFT_PATTERN[foot.index];
      foot.peak = DEMO_PEAK_DELTA[foot.index];
      foot.liftAccel = DEMO_LIFT_ACCEL[foot.index];
      foot.cycleStart = now;
      elapsed = 0;
    }

    const lifted = elapsed < foot.liftMs;
    // 無負荷ベースラインは実機と同じオフセットを常に乗せる
    const pressure = DEMO_PRESSURE_FLOOR.map(function (base) {
      return Math.round(base + demoNoise(3));
    });
    let acc;
    let gyro;

    if (lifted) {
      // 遊脚期: 荷重は乗せず、加速度とジャイロに動きを出す
      const phase = (elapsed / Math.max(1, foot.liftMs)) * Math.PI * 1.5;
      acc = [
        demoNoise(0.2),
        foot.liftAccel * Math.sin(phase) + demoNoise(0.08),
        1.0 + 0.28 * Math.cos(phase)
      ];
      gyro = [demoNoise(30), 80 * Math.sin(phase) + demoNoise(12), demoNoise(25)];
    } else {
      // 立脚期: 踵・中足部から荷重が乗る立ち上がりを作る
      const ramp = Math.min(1, (elapsed - foot.liftMs) / 120);
      for (let i = 0; i < pressure.length; i++) {
        pressure[i] += Math.max(0, Math.round(DEMO_PRESSURE_SHAPE[i] * foot.peak * ramp + demoNoise(8)));
      }
      acc = [demoNoise(0.06), demoNoise(0.08), 1.0 + (1 - ramp) * 0.5 + demoNoise(0.05)];
      gyro = [demoNoise(12), demoNoise(14), demoNoise(10)];
    }

    return { acceleration: acc, gyroscope: gyro, pressureData: pressure };
  }

  function demoTick() {
    const now = Date.now();

    // デモ中はゲームを自走させる（放置で最後まで進み、結果表示後にループ）
    if (gamepar === 0 || gamepar === 5) {
      resetSession();
      gamepar = 1;
    } else if (gamepar === 10) {
      if (!demo.resultShownAt) demo.resultShownAt = now;
      if (now - demo.resultShownAt > DEMO_RESULT_HOLD_MS) {
        demo.resultShownAt = 0;
        resetSession();
        gamepar = 1;
      }
    } else {
      demo.resultShownAt = 0;
    }

    ["left", "right"].forEach(function (side) {
      const frame = demoFootFrame(side, now);
      frame.deviceId = side === "left" ? 0 : 1;
      processStepDetection(frame, side, "demo");
    });
  }

  function startDemo() {
    if (demo.running || connectedCount() > 0) return;
    demo.running = true;
    demo.resultShownAt = 0;
    const now = Date.now();
    demo.foot.left.cycleStart = now;
    demo.foot.right.cycleStart = now - 550; // 左右を半周期ずらす
    footLiftState.left = createFootState();
    footLiftState.right = createFootState();
    resetSession();
    logEvent("demo_start", { source: "demo" });
    demo.timer = root.setInterval(demoTick, DEMO_TICK_MS);
    updateConnectionSource();
    markStatsDirty();
  }

  function stopDemo() {
    if (demo.startTimer) {
      root.clearTimeout(demo.startTimer);
      demo.startTimer = null;
    }
    if (!demo.running) return;
    root.clearInterval(demo.timer);
    demo.timer = null;
    demo.running = false;
    demo.resultShownAt = 0;
    logEvent("demo_stop", { source: "demo" });
    resetSession();
    gamepar = connectedCount() > 0 ? 5 : 0;
    updateConnectionSource();
    markStatsDirty();
  }

  function scheduleDemo(delayMs) {
    if (demo.running || demo.startTimer) return;
    demo.startTimer = root.setTimeout(function () {
      demo.startTimer = null;
      startDemo();
    }, delayMs);
  }

  // ============================================
  // フルスクリーン（Esc でも抜けられる）
  // ============================================

  function stageElement() {
    return document.getElementById("game-stage");
  }

  function isFullscreen() {
    return document.fullscreenElement === stageElement();
  }

  function toggleFullscreen() {
    const stage = stageElement();
    if (!stage) return;
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
    } else if (stage.requestFullscreen) {
      stage.requestFullscreen().catch(function () {
        /* ユーザーが拒否した場合は何もしない */
      });
    }
  }

  function renderFullscreenButton() {
    const btn = document.getElementById("fullscreen-toggle");
    if (!btn) return;
    const full = isFullscreen();
    btn.setAttribute("aria-pressed", full ? "true" : "false");
    const icon = btn.querySelector("i");
    if (icon) {
      icon.className = full ? "bi bi-fullscreen-exit" : "bi bi-arrows-fullscreen";
    }
  }

  // ============================================
  // ゲーム状態（p5.js）
  // ============================================

  let gamepar = 0;
  let goalButton;
  let totalstep = 0;
  let startTime;
  let actionDone = false;
  let sc = 0;

  let pipisound, punisound, soundA, soundB;
  let audioReady = false;

  let isBGMEnabled = true;

  let hairiSetTime = 5000;
  let controlPoints = [];
  const numPoints = 32;
  let center;
  let baseRadius = 50;
  let radius;
  let deformations = [];
  let maxDeformation = 30;
  let deformationSpeed = 0.03;
  let doughColor;
  let MaxStap = 30;

  // 待機中アニメーション
  let x = 0;
  let y;
  let velocity = 0;
  let gravity = 0.3;
  let lift = -3;
  let rradius = 40;
  let resting = false;
  let restTime = 0;

  // 麺アニメーション
  let noodles = [];
  let noodleCount = 10;
  let noodleWidth = 40;
  let cornerRadius = 8;

  let button;
  let udonCount = 0;

  function stageWidth() {
    const stage = document.getElementById("game-stage");
    const measured = stage ? stage.clientWidth : 0;
    return Math.max(320, Math.round(measured || 960));
  }

  // 通常時は 400px 固定。フルスクリーン時だけ画面いっぱいに広げる。
  function stageHeight() {
    if (!isFullscreen()) return CANVAS_HEIGHT;
    const stage = stageElement();
    const measured = stage ? stage.clientHeight : 0;
    return Math.max(CANVAS_HEIGHT, Math.round(measured || CANVAS_HEIGHT));
  }

  function preload() {
    const onAudioError = function () {
      audioReady = false;
      isBGMEnabled = false;
      renderBgmButton();
      const detail = document.getElementById("source-detail");
      if (detail) detail.textContent = t("audioError");
    };

    pipisound = loadSound("pipi.wav", null, onAudioError);
    punisound = loadSound("puni.wav", null, onAudioError);
    soundA = loadSound("soundA.ogg", null, onAudioError);
    soundB = loadSound(
      "soundB.ogg",
      function () {
        audioReady = true;
      },
      onAudioError
    );
  }

  function setup() {
    const cnv = createCanvas(stageWidth(), stageHeight());
    cnv.parent("p5Canvas");

    textFont("Hiragino Kaku Gothic Pro");
    textStyle(BOLD);
    textSize(32);
    textAlign(CENTER, CENTER);

    // p5 の createButton は position:absolute で置かれるため、
    // 包含ブロック（#game-stage）に parent してキャンバス上へ載せる。
    button = createButton("");
    button.parent("game-stage");
    button.mousePressed(onButtonClicked);
    styleButton(button);
    button.hide();

    startTime = millis();
    center = createVector(width / 2, height / 2);
    doughColor = color(235, 235, 235);
    y = height - 40;

    rebuildNoodles();

    if (pipisound) pipisound.setVolume(0.3);
    if (punisound) punisound.setVolume(0.1);
    if (soundA) soundA.setVolume(0.1);
    if (soundB) soundB.setVolume(0.5);
  }

  function rebuildNoodles() {
    noodles = [];
    const spacing = width / noodleCount;
    for (let i = 0; i < noodleCount; i++) {
      const nx = spacing / 2 + spacing * i;
      noodles.push(new Noodle(nx, -50, 0, random(0.5, 5.0)));
    }
  }

  function windowResized() {
    resizeCanvas(stageWidth(), stageHeight());
    center = createVector(width / 2, height / 2);
    y = height - 40;
    rebuildNoodles();
    updateButtonPosition();
  }

  function updateButtonPosition() {
    if (button) {
      button.position(width / 2 - button.width / 2, height - button.height - 40);
    }
  }

  function draw() {
    background(225, 92, 58);
    const elapsedTime = millis() - startTime;

    switch (gamepar) {
      case 0:
        textSize(32);
        fill(28, 28, 28);
        textAlign(CENTER, CENTER);
        text(t("waiting_connection"), width / 2, height / 2);
        Taiki();
        button.hide();
        if (goalButton) goalButton.hide();
        break;

      case 5:
        Settingok();
        textSize(32);
        fill(28, 28, 28);
        textAlign(CENTER, CENTER);
        text(t("connected_message"), width / 2, height * 0.35);
        button.html("START");
        button.show();
        updateButtonPosition();
        if (goalButton) goalButton.hide();
        break;

      case 2: {
        totalstep = 0;
        hairi();
        sc = 0;

        push();
        noStroke();
        fill(235, 235, 235);
        translate(width, 60);
        rotate(PI / 2.06);
        rect(-50, -50, 300, 700);
        pop();

        const compression = 10 * sin(frameCount * 0.05);
        const currentHeight = 90 - compression;
        stroke(0);
        strokeWeight(7);
        fill(235, 235, 235);
        rect(width - 200, height - 140 + compression, 200, currentHeight, 50);

        noStroke();
        textAlign(LEFT);
        textSize(30);
        fill(28, 28, 28);
        text(t("craft_main"), 50, height * 0.4);
        textSize(25);
        text("\n\n" + t("instruction_main"), 50, height * 0.6);

        textAlign(CENTER);
        textSize(15);
        fill(28, 28, 28);
        text(t("loading_text"), 70, 30);
        button.hide();
        if (goalButton) goalButton.hide();
        break;
      }

      case 1:
        gamepar = 2;
        button.hide();
        if (goalButton) goalButton.hide();
        break;

      case 3: {
        motimoti();
        button.hide();
        fill(doughColor);
        UDON();

        fill(46, 111, 183, 80);
        noStroke();
        rect(120, 21, 300, 20, 10);

        const progressWidth = map(totalstep, 0, MaxStap, 0, 300);
        fill(46, 111, 183);
        rect(120, 21, progressWidth, 20, 10);

        textAlign(CENTER, CENTER);
        textSize(15);
        fill(28, 28, 28);
        text(t("mochi_degree"), 70, 30);

        const seconds = (elapsedTime / 1000).toFixed(2);
        textSize(50);
        fill(250, 212, 188);
        text(Math.round(seconds) + "s", width - 60, 40);

        sc = seconds;

        if (totalstep === 0) {
          textSize(30);
          fill(0, 0, 0);
          text(t("knead_main"), width / 2, height / 2);
        }

        if (!goalButton) {
          goalButton = createButton(t("goal_shortcut"));
          goalButton.parent("game-stage");
          goalButton.style("background-color", "#ef4444");
          goalButton.style("color", "white");
          goalButton.style("border", "none");
          goalButton.style("padding", "10px 20px");
          goalButton.style("border-radius", "5px");
          goalButton.style("cursor", "pointer");
          goalButton.mousePressed(function () {
            gamepar = 9;
          });
        } else {
          goalButton.html(t("goal_shortcut"));
          goalButton.show();
        }
        // 右下はフルスクリーントグルが使うので、その上に重ねずに置く
        goalButton.position(width - 120, height - 110);
        break;
      }

      case 9:
        fill(doughColor);
        UDON();
        kansei();
        textSize(32);
        fill(0, 0, 0);
        textAlign(CENTER, CENTER);
        text("COMPLETE!", width / 2, height * 0.35);
        if (goalButton) goalButton.hide();
        break;

      case 10: {
        totalstep = 0;
        udonCount = 0;

        background(225, 92, 58);

        textSize(30);
        fill(0, 0, 0);
        textAlign(CENTER);
        text(t("skill_title"), width / 2, 40);

        textAlign(LEFT);
        textSize(60);
        fill(249, 212, 187);
        if (sc < 10) {
          text("GENIUS", 30, 100);
        } else if (sc < 30) {
          text("EXPERT", 30, 100);
        } else if (sc < 60) {
          text("AMATEUR", 30, 100);
        } else {
          text("REVENGE", 30, 100);
        }

        textSize(20);
        fill(0);
        text("TIME: " + sc + "s", 30, 140);

        textSize(16);
        fill(0);
        text(t("result_total") + stepStats.totalSteps, 30, 170);
        text(t("result_left") + stepStats.leftSteps + t("result_right") + stepStats.rightSteps, 30, 195);
        text(t("result_avg") + stepStats.averageIntensity.toFixed(2), 30, 220);

        if (stepStats.stepIntensities.length > 0) {
          const perfects = countIntensities(THRESHOLDS.REHAB_PERFECT_THRESHOLD);
          const excellents = countIntensities(
            THRESHOLDS.REHAB_EXCELLENT_THRESHOLD,
            THRESHOLDS.REHAB_PERFECT_THRESHOLD
          );
          const goods = countIntensities(THRESHOLDS.REHAB_GOOD_THRESHOLD, THRESHOLDS.REHAB_EXCELLENT_THRESHOLD);

          textSize(14);
          text(
            t("result_rating") + "Perfect×" + perfects + " Excellent×" + excellents + " Good×" + goods,
            30,
            250
          );
        }

        textAlign(CENTER);
        button.html("RETRY");
        button.show();
        updateButtonPosition();
        if (goalButton) goalButton.hide();
        break;
      }
    }

    updateBgmPlayback();
  }

  function updateBgmPlayback() {
    if (!audioReady) return;

    if (isBGMEnabled) {
      if (gamepar === 3) {
        if (soundA && !soundA.isPlaying()) {
          if (soundB) soundB.stop();
          soundA.play();
        }
      } else if (gamepar === 9) {
        if (soundA && soundA.isPlaying()) soundA.stop();
        if (soundB && soundB.isPlaying()) soundB.stop();
      } else if (soundB && !soundB.isPlaying()) {
        if (soundA) soundA.stop();
        soundB.play();
      }
    } else {
      if (soundA && soundA.isPlaying()) soundA.stop();
      if (soundB && soundB.isPlaying()) soundB.stop();
    }
  }

  // ============================================
  // ゲーム描画パーツ
  // ============================================

  function Taiki() {
    if (!resting) {
      x += 1;
      if (x > width) x = 0;
      velocity += gravity;
      y += velocity;
    }

    if (y > height - 50) {
      y = height - 50;
      if (!resting) {
        velocity = lift;
        resting = true;
        restTime = 15;
      }
    }

    if (resting) {
      restTime--;
      if (restTime <= 0) resting = false;
    }

    const stretch = map(abs(velocity), 0, 12, 1, 1.4);
    fill(235, 235, 235);
    noStroke();
    ellipse(x, y, rradius * stretch, rradius / stretch);
  }

  function Settingok() {
    noodles.forEach(function (noodle) {
      noodle.grow();
      noodle.display();
    });
  }

  class Noodle {
    constructor(nx, ny, nheight, growthSpeed) {
      this.x = nx;
      this.y = ny;
      this.height = nheight;
      this.growthSpeed = growthSpeed;
      this.growing = true;
    }

    grow() {
      if (this.growing) {
        this.height += this.growthSpeed;
        if (this.height >= 800) this.growing = false;
      }
    }

    display() {
      noStroke();
      fill(doughColor);
      rect(this.x - noodleWidth / 2, this.y, noodleWidth, this.height, cornerRadius);
    }
  }

  function hairi() {
    if (gamepar === 2 && !actionDone) {
      startTime = millis();
      actionDone = true;
    }

    if (millis() - startTime > hairiSetTime) {
      gamepar = 3;
      actionDone = false;
    }
  }

  function motimoti() {
    if (totalstep >= MaxStap) {
      gamepar = 9;
      markStatsDirty();
    }
  }

  function kansei() {
    if (gamepar === 9 && !actionDone) {
      startTime = millis();
      actionDone = true;
    }

    if (millis() - startTime > 3000) {
      gamepar = 10;
      actionDone = false;
      markStatsDirty();
    }
  }

  function UDON() {
    if (udonCount === 0) {
      controlPoints = [];
      deformations = [];
      for (let i = 0; i < numPoints; i++) {
        const a = (TWO_PI / numPoints) * i;
        controlPoints.push(createVector(center.x + baseRadius * cos(a), center.y + baseRadius * sin(a)));
        deformations.push(0);
        startTime = millis();
      }
      udonCount++;
    }

    noStroke();
    if (gamepar === 3) {
      radius = baseRadius + (totalstep / MaxStap) * 200;
    }

    beginShape();
    for (let i = 0; i < controlPoints.length; i++) {
      const a = (TWO_PI / numPoints) * i;
      const deform = deformations[i];
      vertex(center.x + (radius + deform) * cos(a), center.y + (radius + deform) * sin(a));
    }
    endShape(CLOSE);

    for (let i = 0; i < deformations.length; i++) {
      if (deformations[i] > 0) {
        deformations[i] -= deformationSpeed * deformations[i];
      }
    }
  }

  function UDON_UGOKU() {
    const deformIndex = floor(random(numPoints));
    deformations[deformIndex] = maxDeformation;
    for (let i = 1; i <= 4; i++) {
      const indexPlus = (deformIndex + i) % numPoints;
      const indexMinus = (deformIndex - i + numPoints) % numPoints;
      deformations[indexPlus] = (maxDeformation * (5 - i)) / 5;
      deformations[indexMinus] = (maxDeformation * (5 - i)) / 5;
    }
  }

  function styleButton(btn) {
    btn.style("background-color", "#1C1D1D");
    btn.style("color", "white");
    btn.style("padding", "10px 20px");
    btn.style("border", "none");
    btn.style("border-radius", "10px");
    btn.style("font-size", "20px");
  }

  function onButtonClicked() {
    // ブラウザの自動再生制限のため、ユーザー操作の中で AudioContext を起こす
    if (typeof userStartAudio === "function") userStartAudio();
    if (gamepar === 5 || gamepar === 10) {
      resetSession();
      gamepar = 1;
    }
  }

  function resetSession() {
    stepStats = emptyStats();
    footLiftState.left = createFootState();
    footLiftState.right = createFootState();
    lastStepTime.left = 0;
    lastStepTime.right = 0;
    totalstep = 0;
    udonCount = 0;
    startTime = typeof millis === "function" ? millis() : 0;
    markStatsDirty();
  }

  // ============================================
  // 操作
  // ============================================

  function renderBgmButton() {
    const btn = document.getElementById("bgm-toggle");
    if (!btn) return;
    btn.innerHTML = t(isBGMEnabled ? "bgmOnHtml" : "bgmOffHtml");
    btn.classList.toggle("muted", !isBGMEnabled);
  }

  function bindControls() {
    const bgmBtn = document.getElementById("bgm-toggle");
    if (bgmBtn) {
      bgmBtn.addEventListener("click", function () {
        isBGMEnabled = !isBGMEnabled;
        renderBgmButton();
      });
    }

    const resetBtn = document.getElementById("reset-button");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        resetSession();
        if (!demo.running) gamepar = connectedCount() > 0 ? 5 : 0;
      });
    }

    const recordBtn = document.getElementById("record-toggle");
    if (recordBtn) {
      recordBtn.addEventListener("click", function () {
        if (recording) stopRecording();
        else startRecording();
      });
    }

    const csvBtn = document.getElementById("csv-button");
    if (csvBtn) {
      csvBtn.addEventListener("click", downloadAll);
    }

    const fsBtn = document.getElementById("fullscreen-toggle");
    if (fsBtn) {
      fsBtn.addEventListener("click", toggleFullscreen);
    }

    document.addEventListener("fullscreenchange", function () {
      renderFullscreenButton();
      // キャンバスをフルスクリーンのサイズへ作り直す（Esc で戻したときも同じ経路）
      if (typeof root.resizeCanvas === "function") windowResized();
    });

    document.querySelectorAll("[data-lang-button]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLanguage(btn.dataset.langButton);
      });
    });
  }

  // ============================================
  // しきい値の調整UI
  //
  // THRESHOLDS / stepCooldown / MaxStap をその場で書き換える。
  // 変更は localStorage に保存し、次回の読み込みで復元する。
  // ============================================

  const TUNING_STORAGE_KEY = "udon-tuning-v1";

  const TUNING_PARAMS = [
    {
      key: "STEP_DELTA_MIN",
      min: 40,
      max: 800,
      step: 10,
      ja: {
        label: "踏み込み成立の増分",
        hint: "無負荷ベースラインからこれだけ増えたら1歩とみなす。反応しないときは下げる。"
      },
      en: {
        label: "Step threshold (delta)",
        hint: "A step counts when pressure rises this much above the unloaded baseline. Lower it if steps are missed."
      }
    },
    {
      key: "CONTACT_DELTA",
      min: 20,
      max: 400,
      step: 10,
      ja: {
        label: "荷重が抜けた判定",
        hint: "これ未満なら足が浮いているとみなす。踏み込み成立より小さくすること。"
      },
      en: {
        label: "Unloaded threshold",
        hint: "Below this the foot counts as lifted. Keep it below the step threshold."
      }
    },
    {
      key: "LIFT_ACCELERATION_THRESHOLD",
      min: 0.05,
      max: 1,
      step: 0.05,
      digits: 2,
      ja: { label: "足上げ感度（加速度）", hint: "|accY| がこれを超えたら足を動かしたとみなす [G]。" },
      en: { label: "Lift sensitivity (accel)", hint: "Motion is detected when |accY| exceeds this [G]." }
    },
    {
      key: "STEP_COOLDOWN",
      min: 200,
      max: 1500,
      step: 50,
      ja: { label: "連続検出の最小間隔", hint: "1歩を検出してから次を受け付けない時間 [ms]。二重カウント対策。" },
      en: { label: "Detection cooldown", hint: "Minimum gap between steps [ms]. Prevents double counting." }
    },
    {
      key: "PRESSURE_SPAN",
      min: 100,
      max: 2000,
      step: 50,
      ja: {
        label: "踏み込みが満点になる増分",
        hint: "この増分で踏み込みの配点が満点。強く踏める人は大きく、弱い人は小さく。"
      },
      en: {
        label: "Full-score step delta",
        hint: "Pressure score maxes out at this delta. Raise for strong steppers, lower for weak ones."
      }
    },
    {
      key: "LIFT_SPAN",
      min: 0.3,
      max: 3,
      step: 0.1,
      digits: 1,
      ja: { label: "足上げが満点になる加速度", hint: "|accY| がこの幅ぶん増えたら足上げの配点が満点 [G]。" },
      en: { label: "Full-score lift accel", hint: "Lift score maxes out this far above the offset [G]." }
    },
    {
      key: "OPTIMAL_LIFT_DURATION",
      min: 200,
      max: 1200,
      step: 50,
      ja: { label: "理想の足上げ時間", hint: "この時間の前後でタイミングの配点が満点 [ms]。" },
      en: { label: "Ideal lift duration", hint: "Timing score peaks around this duration [ms]." }
    },
    {
      key: "MAX_STEP",
      min: 5,
      max: 80,
      step: 1,
      ja: { label: "もちもち度MAXまでの歩数", hint: "ゲーム1回の長さ。短くしたいときは減らす。" },
      en: { label: "Steps to finish", hint: "Length of one game. Lower it for a shorter session." }
    }
  ];

  const TUNING_PRESETS = {
    default: {},
    light: {
      STEP_DELTA_MIN: 80,
      CONTACT_DELTA: 50,
      LIFT_ACCELERATION_THRESHOLD: 0.15,
      PRESSURE_SPAN: 200,
      LIFT_SPAN: 0.8,
      OPTIMAL_LIFT_DURATION: 700,
      MAX_STEP: 15
    },
    firm: {
      STEP_DELTA_MIN: 350,
      CONTACT_DELTA: 150,
      LIFT_ACCELERATION_THRESHOLD: 0.4,
      PRESSURE_SPAN: 900,
      LIFT_SPAN: 2,
      OPTIMAL_LIFT_DURATION: 500,
      MAX_STEP: 30
    }
  };

  function readTuning(key) {
    if (key === "STEP_COOLDOWN") return stepCooldown;
    if (key === "MAX_STEP") return MaxStap;
    return THRESHOLDS[key];
  }

  function writeTuning(key, value) {
    if (key === "STEP_COOLDOWN") stepCooldown = value;
    else if (key === "MAX_STEP") MaxStap = value;
    else THRESHOLDS[key] = value;
  }

  // 既定値のスナップショット（localStorage 復元より前に取る）
  const TUNING_DEFAULTS = {};
  TUNING_PARAMS.forEach(function (p) {
    TUNING_DEFAULTS[p.key] = readTuning(p.key);
  });

  function saveTuning() {
    const payload = {};
    TUNING_PARAMS.forEach(function (p) {
      payload[p.key] = readTuning(p.key);
    });
    try {
      root.localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* プライベートモード等で保存できない場合は無視する */
    }
  }

  function loadTuning() {
    let stored = null;
    try {
      stored = JSON.parse(root.localStorage.getItem(TUNING_STORAGE_KEY) || "null");
    } catch {
      stored = null;
    }
    if (!stored) return;
    TUNING_PARAMS.forEach(function (p) {
      const v = Number(stored[p.key]);
      if (Number.isFinite(v) && v >= p.min && v <= p.max) writeTuning(p.key, v);
    });
  }

  function applyPreset(name) {
    const preset = TUNING_PRESETS[name];
    if (!preset) return;
    TUNING_PARAMS.forEach(function (p) {
      writeTuning(p.key, preset[p.key] !== undefined ? preset[p.key] : TUNING_DEFAULTS[p.key]);
    });
    saveTuning();
    renderTuningGrid();
    markStatsDirty();
  }

  function formatTuning(param, value) {
    return param.digits ? value.toFixed(param.digits) : String(value);
  }

  function renderTuningGrid() {
    const grid = document.getElementById("tuning-grid");
    if (!grid) return;
    const lang = currentLanguage === "en" ? "en" : "ja";
    grid.textContent = "";

    TUNING_PARAMS.forEach(function (param) {
      const value = readTuning(param.key);
      const row = document.createElement("div");
      row.className = "tuning-row";
      if (value !== TUNING_DEFAULTS[param.key]) row.classList.add("changed");

      const id = "tune-" + param.key;
      const label = document.createElement("label");
      label.setAttribute("for", id);
      label.textContent = param[lang].label;

      const output = document.createElement("output");
      output.textContent = formatTuning(param, value);

      const input = document.createElement("input");
      input.type = "range";
      input.id = id;
      input.min = String(param.min);
      input.max = String(param.max);
      input.step = String(param.step);
      input.value = String(value);
      input.addEventListener("input", function () {
        const v = Number(input.value);
        writeTuning(param.key, v);
        output.textContent = formatTuning(param, v);
        row.classList.toggle("changed", v !== TUNING_DEFAULTS[param.key]);
        saveTuning();
        markStatsDirty();
      });

      const hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent = param[lang].hint;

      row.appendChild(label);
      row.appendChild(output);
      row.appendChild(input);
      row.appendChild(hint);
      grid.appendChild(row);
    });
  }

  function renderTuningLive() {
    const state = footLiftState[lastActiveSide];
    const floor = state && state.floorTotal !== null ? state.floorTotal : null;
    const delta = state ? state.lastDelta : 0;

    setText("live-floor", floor === null ? "—" : String(floor));
    setText("live-delta", floor === null ? "—" : String(Math.round(delta)));
    setText(
      "live-step-delta",
      stepStats.lastStepDelta === null ? "—" : String(Math.round(stepStats.lastStepDelta))
    );
    setText(
      "live-step-accel",
      stepStats.lastStepLiftAccel === null ? "—" : stepStats.lastStepLiftAccel.toFixed(2) + " G"
    );

    const fullScore = THRESHOLDS.PRESSURE_OFFSET + THRESHOLDS.PRESSURE_SPAN;
    const scaleMax = Math.max(300, fullScore, THRESHOLDS.STEP_DELTA_MIN * 1.5);
    const pct = function (v) {
      return Math.max(0, Math.min(100, (v / scaleMax) * 100)) + "%";
    };

    const fill = document.getElementById("delta-fill");
    if (fill) fill.style.width = pct(delta);
    const contact = document.getElementById("tick-contact");
    if (contact) contact.style.left = pct(THRESHOLDS.CONTACT_DELTA);
    const step = document.getElementById("tick-step");
    if (step) step.style.left = pct(THRESHOLDS.STEP_DELTA_MIN);
    const full = document.getElementById("tick-full");
    if (full) full.style.left = pct(fullScore);
  }

  function bindTuningControls() {
    const seg = document.getElementById("tuning-preset");
    if (!seg) return;
    seg.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-tuning-preset]");
      if (!btn) return;
      applyPreset(btn.dataset.tuningPreset);
      Array.prototype.forEach.call(seg.querySelectorAll("button"), function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
    });
  }

  // ============================================
  // 初期化
  // ============================================

  function init() {
    loadTuning();
    bindControls();
    bindTuningControls();
    applyLanguage();
    renderFullscreenButton();
    updateCsvButton();
    DEVICE_IDS.forEach(setupToolkit);

    // 実機が繋がらなければデモ再生を始める
    scheduleDemo(DEMO_START_DELAY_MS);

    // 統計は毎フレームではなく 8Hz で DOM に反映する
    setInterval(function () {
      if (recording) renderRecordButton();
      renderTuningLive();
      if (!statsDirty && gamepar !== 3) return;
      statsDirty = false;
      renderStats();
    }, 125);
  }

  // DevTools からしきい値を触ってその場で挙動を確認できるようにする。
  // 例: udonDebug.THRESHOLDS.PRESSURE_TOTAL_THRESHOLD = 2000
  //     udonDebug.downloadFrames()
  root.udonDebug = {
    THRESHOLDS: THRESHOLDS,
    events: eventLog,
    frames: frameLog,
    startRecording: startRecording,
    stopRecording: stopRecording,
    downloadEvents: downloadEvents,
    downloadFrames: downloadFrames,
    startDemo: startDemo,
    stopDemo: stopDemo,
    applyPreset: applyPreset,
    tuningDefaults: TUNING_DEFAULTS,
    tuning: function () {
      const out = {};
      TUNING_PARAMS.forEach(function (p) {
        out[p.key] = readTuning(p.key);
      });
      return out;
    },
    setTuning: function (key, value) {
      writeTuning(key, Number(value));
      saveTuning();
      renderTuningGrid();
    },
    stats: function () {
      return stepStats;
    },
    state: function () {
      return {
        gamepar: gamepar,
        totalstep: totalstep,
        connected: connected.slice(),
        deviceToSide: Object.assign({}, deviceToSide),
        demoRunning: demo.running,
        recording: recording,
        frames: frameLog.length,
        events: eventLog.length,
        footLiftState: footLiftState
      };
    }
  };

  // p5 はグローバルの preload / setup / draw / windowResized を参照するため明示的に公開する
  root.preload = preload;
  root.setup = setup;
  root.draw = draw;
  root.windowResized = windowResized;

  root.addEventListener("load", init);
})(typeof globalThis !== "undefined" ? globalThis : window);
