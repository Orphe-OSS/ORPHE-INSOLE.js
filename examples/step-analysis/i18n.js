(function attachStepAnalysisI18n(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.StepAnalysisI18n = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createStepAnalysisI18n(root) {
  "use strict";

  const translations = {
    ja: {
      metaTitle: "ORPHE INSOLE Step Analysis + RAW Data",
      metaDescription: "ORPHE INSOLE Toolkit の Step Analysis と Realtime Raw を左右1歩ごとに可視化する実機対応exampleです。",
      backLabel: "Examples 一覧へ戻る",
      languageLabel: "言語",
      toolkitLabel: "ORPHE INSOLE 接続",
      leadCopy: "左右の ORPHE INSOLE から歩容解析結果を取得し、最新値と直近10歩の傾向を更新します。",
      controlsLabel: "データソースと操作",
      sourceConnectTitle: "INSOLE を接続してください",
      sourceConnectDetail: "タイトル横のスイッチから、左右1台ずつ接続します。",
      demoPlayHtml: '<i class="bi bi-play-fill"></i> デモ再生',
      demoStopHtml: '<i class="bi bi-stop-fill"></i> デモ停止',
      clearHtml: '<i class="bi bi-arrow-counterclockwise"></i> クリア',
      csvHtml: '<i class="bi bi-download"></i> Step CSV',
      settingsGuide: '<strong>Step Analysis + RAW Data を使いたいときは、Toolkit UI の歯車を開き、次のように設定してください。</strong><p><span>Data Outputs: <b>Raw Sensor Data</b> と <b>Step Analysis</b> をON</span><span>Raw Data Acquisition: <b>Realtime</b></span><span>Realtime Streaming Format: <b>4: gyro + acc + press + quat (100Hz)</b></span><span class="settings-guide-default">このデモプログラムでは初期設定で上記の設定となっています</span></p>',
      graphsLabel: "リアルタイムグラフ",
      trendTitle: "歩行速度・歩幅の推移",
      trendLegendLabel: "Step推移グラフ凡例",
      trendCanvasLabel: "左右の直近10歩の歩行速度と歩幅を示す折れ線グラフ",
      rawTitle: "生データ・直近10秒",
      rawLegendLabel: "グラフ凡例",
      rawCanvasLabel: "左右の圧力合計、加速度、ジャイロのリアルタイムグラフ",
      resultTitle: "歩容パラメータ",
      resultDescription: "大きな値が最新1歩、下段が直近10歩の平均 ± SDです。セルが光るたびに新しい歩が完成しています。",
      parametersHeader: "パラメータ",
      leftSideHtml: '<i class="bi bi-chevron-left"></i> 左足',
      rightSideHtml: '右足 <i class="bi bi-chevron-right"></i>',
      sourceHeader: "データソース",
      lastUpdateHtml: '<i class="bi bi-broadcast"></i> Step Analysis 最終更新',
      scopeNote: "<strong>現行 Step Analysis で直接得られない値:</strong> 歩隔、単脚支持率、両脚支持率。これらは推定値で埋めず「未計測」とします。正常範囲も年齢・速度・計測条件で変わるため、このexampleでは判定しません。",
      chartFootnote: "圧力は6ch ADC生値の合計です。加速度とジャイロはレンジ換算後のベクトル大きさを表示します。描画負荷を抑えるため、グラフは受信データを約30Hzに間引いて表示します。Realtime + Step はライブ表示向けであり、無欠損記録を保証するモードではありません。",
      howTitle: "このexampleが使う Toolkit の設定プログラム",
      footerNote: "このページは研究・開発用のexampleです。医療機器ではなく、診断・治療・予防を目的としません。",
      summaryLatestClass: "最新の分類",
      summaryRecentMode: "直近{count}歩: {value} {frequency}回",
      summaryRecentNumeric: "直近{count}歩 {mean} ± {sd}",
      summaryRecentEmpty: "直近10歩 —",
      sideStateWaiting: "待機中",
      sideStateConnected: "接続済み",
      sideMeta: "{count}歩 / {state}",
      sourceLiveTitle: "LIVE: {count}台接続",
      sourceDuplicateSide: "2台が同じ装着位置として認識されています。実機の mount position を確認してください。",
      sourceLiveBoth: "左右の Step Analysis を購読し、Raw Sensor Values を受信しています。",
      sourceLiveOne: "{side}足を受信中。もう1台も接続できます。",
      sideLeft: "左",
      sideRight: "右",
      sourceStepMissingTitle: "Step Analysis 通知は未受信",
      sourceStepMissingDetail: "Raw Sensor Values は受信中ですが STEP_ANALYSIS は0件です。歩行後も0件なら、実機ファームウェアと Step Analysis 出力を確認してください。",
      toolkitLoadErrorTitle: "InsoleToolkit を読み込めません",
      toolkitLoadErrorDetail: "ORPHE-INSOLE.js / InsoleToolkit.js / InsoleGait.js の読み込み順を確認してください。",
      stepErrorTitle: "Step Analysis error (INSOLE 0{device})",
      toolkitErrorTitle: "Toolkit error (INSOLE 0{device})",
      reconnectTitle: "INSOLE 0{device} を再接続中",
      reconnectWait: "Toolkit の自動再接続を待っています。",
      reconnectAttempt: "再接続 {attempt} / {maxAttempts}",
      reconnectFailedTitle: "INSOLE 0{device} の再接続に失敗",
      reconnectFailedFallback: "自動再接続に失敗しました。接続スイッチを入れ直してください。",
      demoBlockedTitle: "実機接続中のためデモは開始しません",
      demoBlockedDetail: "デモを使う場合は、先にタイトル横のスイッチから実機を切断してください。",
      demoPlayingTitle: "合成歩行データを再生中",
      demoPlayingDetail: "表示確認用です。実機の測定値ではありません。",
      trendSpeedLabel: "歩行速度",
      trendStepLengthLabel: "歩幅",
      trendOldest: "10歩前",
      trendLatest: "最新",
      trendEmpty: "Stepを受信すると、歩行速度と歩幅の推移を表示します",
      rawEmpty: "INSOLE を接続するか、デモ再生を押してください",
      textWalk: "歩行",
      textRun: "走行",
      textStance: "静止",
      textNone: "なし",
      textUnknown: "不明",
      textForward: "前方",
      textBackward: "後方",
      textInside: "内側",
      textOutside: "外側",
      textHeelStrike: "ヒール",
      textMidfoot: "ミッドフット",
      textForefoot: "フォアフット",
      textNeutral: "ニュートラル",
      textOver: "オーバー",
      textSevereOver: "強いオーバー",
      textUnder: "アンダー",
      textSevereUnder: "強いアンダー",
      sourceNotification: "通知",
      sourceCalculated: "算出",
      sourceEstimated: "推定",
      sourceClassification: "分類",
      metric_gait_type_label: "歩容タイプ",
      metric_gait_type_description: "walk / run / stance",
      metric_stride_direction_label: "進行方向",
      metric_stride_direction_description: "forward / backward / inside / outside",
      metric_speed_mps_label: "歩行速度",
      metric_speed_mps_description: "ストライド長 ÷ 歩行周期",
      metric_cadence_spm_label: "ケイデンス",
      metric_cadence_spm_description: "120 ÷ 歩行周期",
      metric_step_length_m_label: "歩幅（推定）",
      metric_step_length_m_description: "ストライド長 ÷ 2",
      metric_stance_percent_label: "立脚期",
      metric_stance_percent_description: "立脚時間 ÷ 歩行周期",
      metric_swing_percent_label: "遊脚期",
      metric_swing_percent_description: "遊脚時間 ÷ 歩行周期",
      metric_cycle_time_s_label: "歩行周期",
      metric_cycle_time_s_description: "立脚時間 + 遊脚時間",
      metric_stride_length_m_label: "ストライド長",
      metric_stride_length_m_description: "3軸ストライドベクトルの長さ",
      metric_foot_angle_deg_label: "足角度",
      metric_foot_angle_deg_description: "Step Analysis の足角度",
      metric_landing_force_label: "着地衝撃",
      metric_landing_force_description: "ファームウェアが返す landing force",
      metric_foot_strike_label: "接地タイプ",
      metric_foot_strike_description: "heel / midfoot / forefoot",
      metric_pronation_deg_label: "プロネーション",
      metric_pronation_deg_description: "プロネーション角",
      metric_pronation_type_label: "プロネーション分類",
      metric_pronation_type_description: "neutral / over / under",
      metric_distance_m_label: "累積距離",
      metric_distance_m_description: "接続後の累積移動距離"
    },
    en: {
      metaTitle: "ORPHE INSOLE Step Analysis + RAW Data",
      metaDescription: "A hardware-ready example that visualizes ORPHE INSOLE Step Analysis and realtime raw data for the left and right foot.",
      backLabel: "Back to Examples",
      languageLabel: "Language",
      toolkitLabel: "Connect ORPHE INSOLE",
      leadCopy: "Receive gait analysis results from the left and right ORPHE INSOLE, updating the latest values and the trend over the last 10 steps.",
      controlsLabel: "Data source and controls",
      sourceConnectTitle: "Connect your INSOLE devices",
      sourceConnectDetail: "Use the switches beside the title to connect one left and one right device.",
      demoPlayHtml: '<i class="bi bi-play-fill"></i> Play demo',
      demoStopHtml: '<i class="bi bi-stop-fill"></i> Stop demo',
      clearHtml: '<i class="bi bi-arrow-counterclockwise"></i> Clear',
      csvHtml: '<i class="bi bi-download"></i> Step CSV',
      settingsGuide: '<strong>To use Step Analysis + RAW Data, open the gear icon in the Toolkit UI and use these settings.</strong><p><span>Data Outputs: turn on <b>Raw Sensor Data</b> and <b>Step Analysis</b></span><span>Raw Data Acquisition: <b>Realtime</b></span><span>Realtime Streaming Format: <b>4: gyro + acc + press + quat (100Hz)</b></span><span class="settings-guide-default">This demo program uses these settings by default.</span></p>',
      graphsLabel: "Realtime charts",
      trendTitle: "Gait speed and step length",
      trendLegendLabel: "Step trend chart legend",
      trendCanvasLabel: "Line chart of gait speed and step length for the last 10 steps on the left and right",
      rawTitle: "Raw data · last 10 seconds",
      rawLegendLabel: "Chart legend",
      rawCanvasLabel: "Realtime chart of total pressure, acceleration, and gyroscope values for the left and right",
      resultTitle: "Gait parameters",
      resultDescription: "The large value is the latest step; the lower line is the mean ± SD for the last 10 steps. A pulse indicates that a new step has completed.",
      parametersHeader: "Parameters",
      leftSideHtml: '<i class="bi bi-chevron-left"></i> Left side',
      rightSideHtml: 'Right side <i class="bi bi-chevron-right"></i>',
      sourceHeader: "Data source",
      lastUpdateHtml: '<i class="bi bi-broadcast"></i> Last Step Analysis update',
      scopeNote: "<strong>Values not directly available from the current Step Analysis:</strong> step width, single-support ratio, and double-support ratio. This example leaves them unmeasured instead of estimating them. It also does not judge normal ranges, which vary with age, speed, and measurement conditions.",
      chartFootnote: "Pressure is the sum of the six raw ADC channels. Acceleration and gyroscope lines show vector magnitude after range conversion. The charts downsample incoming data to about 30 Hz to reduce rendering load. Realtime + Step is intended for live visualization and does not guarantee lossless recording.",
      howTitle: "Toolkit setup used by this example",
      footerNote: "This example is for research and development. It is not a medical device and is not intended for diagnosis, treatment, or prevention.",
      summaryLatestClass: "Latest classification",
      summaryRecentMode: "Last {count} steps: {value} × {frequency}",
      summaryRecentNumeric: "Last {count} steps {mean} ± {sd}",
      summaryRecentEmpty: "Last 10 steps —",
      sideStateWaiting: "waiting",
      sideStateConnected: "connected",
      sideMeta: "{count} steps / {state}",
      sourceLiveTitle: "LIVE: {count} connected",
      sourceDuplicateSide: "Both devices are identified with the same mount position. Check the mount position stored on each device.",
      sourceLiveBoth: "Subscribed to Step Analysis for both feet and receiving Raw Sensor Values.",
      sourceLiveOne: "Receiving the {side} foot. You can connect one more device.",
      sideLeft: "left",
      sideRight: "right",
      sourceStepMissingTitle: "No Step Analysis notification received",
      sourceStepMissingDetail: "Raw Sensor Values are arriving, but STEP_ANALYSIS remains at zero. If it is still zero after walking, check the device firmware and Step Analysis output.",
      toolkitLoadErrorTitle: "Unable to load InsoleToolkit",
      toolkitLoadErrorDetail: "Check the loading order of ORPHE-INSOLE.js, InsoleToolkit.js, and InsoleGait.js.",
      stepErrorTitle: "Step Analysis error (INSOLE 0{device})",
      toolkitErrorTitle: "Toolkit error (INSOLE 0{device})",
      reconnectTitle: "Reconnecting INSOLE 0{device}",
      reconnectWait: "Waiting for Toolkit automatic reconnection.",
      reconnectAttempt: "Reconnect attempt {attempt} / {maxAttempts}",
      reconnectFailedTitle: "Failed to reconnect INSOLE 0{device}",
      reconnectFailedFallback: "Automatic reconnection failed. Turn the connection switch off and on again.",
      demoBlockedTitle: "Demo is unavailable while hardware is connected",
      demoBlockedDetail: "Disconnect the devices with the switches beside the title before starting the demo.",
      demoPlayingTitle: "Playing synthetic gait data",
      demoPlayingDetail: "For display testing only. These are not hardware measurements.",
      trendSpeedLabel: "Gait speed",
      trendStepLengthLabel: "Step length",
      trendOldest: "10 steps ago",
      trendLatest: "Latest",
      trendEmpty: "Gait speed and step length will appear after a Step notification is received",
      rawEmpty: "Connect an INSOLE or select Play demo",
      textWalk: "Walk",
      textRun: "Run",
      textStance: "Stance",
      textNone: "None",
      textUnknown: "Unknown",
      textForward: "Forward",
      textBackward: "Backward",
      textInside: "Inside",
      textOutside: "Outside",
      textHeelStrike: "Heel",
      textMidfoot: "Midfoot",
      textForefoot: "Forefoot",
      textNeutral: "Neutral",
      textOver: "Over",
      textSevereOver: "Severe over",
      textUnder: "Under",
      textSevereUnder: "Severe under",
      sourceNotification: "Notification",
      sourceCalculated: "Calculated",
      sourceEstimated: "Estimated",
      sourceClassification: "Classification",
      metric_gait_type_label: "Gait type",
      metric_gait_type_description: "walk / run / stance",
      metric_stride_direction_label: "Direction",
      metric_stride_direction_description: "forward / backward / inside / outside",
      metric_speed_mps_label: "Gait speed",
      metric_speed_mps_description: "Stride length ÷ gait cycle",
      metric_cadence_spm_label: "Cadence",
      metric_cadence_spm_description: "120 ÷ gait cycle",
      metric_step_length_m_label: "Step length (estimated)",
      metric_step_length_m_description: "Stride length ÷ 2",
      metric_stance_percent_label: "Stance phase",
      metric_stance_percent_description: "Stance time ÷ gait cycle",
      metric_swing_percent_label: "Swing phase",
      metric_swing_percent_description: "Swing time ÷ gait cycle",
      metric_cycle_time_s_label: "Gait cycle",
      metric_cycle_time_s_description: "Stance time + swing time",
      metric_stride_length_m_label: "Stride length",
      metric_stride_length_m_description: "3D stride-vector magnitude",
      metric_foot_angle_deg_label: "Foot angle",
      metric_foot_angle_deg_description: "Foot angle from Step Analysis",
      metric_landing_force_label: "Landing force",
      metric_landing_force_description: "Landing force returned by the firmware",
      metric_foot_strike_label: "Foot strike",
      metric_foot_strike_description: "heel / midfoot / forefoot",
      metric_pronation_deg_label: "Pronation",
      metric_pronation_deg_description: "Pronation angle",
      metric_pronation_type_label: "Pronation class",
      metric_pronation_type_description: "neutral / over / under",
      metric_distance_m_label: "Cumulative distance",
      metric_distance_m_description: "Distance traveled since connection"
    }
  };

  let currentLanguage = "ja";

  function interpolate(text, params) {
    if (!params) return text;
    return String(text).replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => (
      Object.prototype.hasOwnProperty.call(params, key) ? params[key] : `{${key}}`
    ));
  }

  function t(key, params, fallback) {
    const selected = translations[currentLanguage] || translations.en;
    const raw = selected[key] || translations.en[key] || fallback || key;
    return interpolate(raw, params);
  }

  function applyStaticText() {
    if (!root.document) return;
    const selected = translations[currentLanguage] || translations.en;
    root.document.documentElement.lang = currentLanguage;
    root.document.title = selected.metaTitle;
    const description = root.document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", selected.metaDescription);

    root.document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    root.document.querySelectorAll("[data-i18n-html]").forEach((element) => {
      element.innerHTML = t(element.dataset.i18nHtml);
    });
    root.document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });
    root.document.querySelectorAll("[data-lang-button]").forEach((button) => {
      const active = button.dataset.langButton === currentLanguage;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updateUrl() {
    if (!root.location || !root.history || typeof root.history.replaceState !== "function") return;
    const url = new URL(root.location.href);
    url.searchParams.set("lang", currentLanguage);
    root.history.replaceState(null, "", url);
  }

  function setLanguage(language, options = {}) {
    currentLanguage = translations[language] ? language : "en";
    applyStaticText();
    if (options.updateUrl) updateUrl();
    if (
      options.notify !== false
      && typeof root.dispatchEvent === "function"
      && typeof root.CustomEvent === "function"
    ) {
      root.dispatchEvent(new root.CustomEvent("step-analysis:languagechange", {
        detail: { language: currentLanguage }
      }));
    }
  }

  const api = {
    getLanguage: () => currentLanguage,
    setLanguage,
    t,
    translations
  };

  if (root.document) {
    root.document.addEventListener("DOMContentLoaded", () => {
      const requestedLanguage = new URLSearchParams(root.location.search).get("lang");
      setLanguage(translations[requestedLanguage] ? requestedLanguage : currentLanguage);
      root.document.querySelectorAll("[data-lang-button]").forEach((button) => {
        button.addEventListener("click", () => {
          setLanguage(button.dataset.langButton, { updateUrl: true });
        });
      });
    });
  }

  return Object.freeze(api);
});
