(function attachGaitReportI18n(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.GaitReportI18n = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createGaitReportI18n(root) {
  "use strict";

  const translations = {
    ja: {
      metaTitle: "ORPHE INSOLE Gait Report",
      metaDescription: "ORPHE INSOLE の Step Analysis から左右20歩を計測し、平均±SD・左右差・ばらつきの歩行レポートを生成するexampleです。",
      backLabel: "Examples 一覧へ戻る",
      languageLabel: "言語",
      toolkitLabel: "ORPHE INSOLE 接続",
      leadCopy: "「記録開始」を押して歩くと1歩ごとにレポートが更新され、左右それぞれ20歩そろった時点で平均±SDのレポートとして確定します。",
      controlsLabel: "データソースと操作",
      sourceConnectTitle: "INSOLE を接続してください",
      sourceConnectDetail: "タイトル横のスイッチから、左右1台ずつ接続します。",
      recordStartHtml: '<i class="bi bi-record-circle"></i> 記録開始',
      recordRestartHtml: '<i class="bi bi-arrow-repeat"></i> やり直す',
      recordAgainHtml: '<i class="bi bi-arrow-repeat"></i> もう一度計測',
      demoPlayHtml: '<i class="bi bi-play-fill"></i> デモ再生',
      demoStopHtml: '<i class="bi bi-stop-fill"></i> デモ停止',
      clearHtml: '<i class="bi bi-arrow-counterclockwise"></i> クリア',
      printHtml: '<i class="bi bi-printer"></i> 印刷',
      settingsGuide: '<strong>Gait Report を使いたいときは、Toolkit UI の歯車を開き、次のように設定してください。</strong><p><span>Data Outputs: <b>Raw Sensor Data</b> と <b>Step Analysis</b> をON</span><span>Raw Data Acquisition: <b>Realtime</b></span><span>Realtime Streaming Format: <b>4: gyro + acc + press + quat (100Hz)</b></span><span class="settings-guide-default">このデモプログラムでは初期設定で上記の設定となっています</span></p>',
      progressLabel: "計測の進捗",
      progressIdle: "「記録開始」を押して歩き始めてください。",
      progressIdleReceiving: "Step Analysis を受信中です。「記録開始」を押すと集計を始めます。",
      progressRecording: "計測中 — 歩くたびにレポートが更新されます。",
      progressComplete: "レポート完成 — 左右{target}歩の平均±SDで確定しました。",
      progressSide: "{count} / {target} 歩",
      sideLeftLabel: "左足",
      sideRightLabel: "右足",
      reportKicker: "ORPHE GAIT REPORT",
      reportTitle: "歩行計測レポート",
      reportSectionTitle: "歩行計測レポート",
      reportSectionDescription: "左右20歩の計測セッションから、基本歩行量の平均±SD、左右差、時間的ばらつき、接地の分類内訳をまとめます。",
      statusIdle: "待機中",
      statusRecording: "計測中",
      statusComplete: "完成",
      reportDateLabel: "計測日時",
      reportSourceLabel: "データソース",
      reportStepsLabel: "計測歩数",
      reportStepsValue: "左 {left} 歩 / 右 {right} 歩",
      sourceValueLive: "ORPHE INSOLE（実機）",
      sourceValueDemo: "合成デモデータ",
      sourceValueNone: "—",
      overviewTitle: "歩行の基本量（両足の平均 ± SD）",
      refLabel: "参考",
      refCvLabel: "参考: {max}% 未満",
      refRangeLabel: "参考: {min}–{max} {unit}",
      noData: "—",
      meanSdPattern: "± {sd}",
      nOfSteps: "n={count}",
      cvTileLabel: "歩行周期ばらつき CV",
      cvTileValue: "左 {left} / 右 {right}",
      metric_speed_mps_label: "歩行速度",
      metric_stride_m_label: "ストライド長",
      metric_cycle_s_label: "歩行周期",
      metric_cadence_spm_label: "ケイデンス",
      metric_stance_pct_label: "立脚期割合",
      metric_stance_s_label: "立脚時間",
      metric_swing_s_label: "遊脚時間",
      metric_strike_deg_label: "接地角度",
      metric_pronation_deg_label: "プロネーション角",
      metric_landing_force_label: "着地衝撃",
      lrTitle: "左右比較",
      lrParameter: "パラメータ",
      lrLeft: "左足",
      lrRight: "右足",
      lrSymmetry: "左右差",
      symLeftLarger: "L +{value}%",
      symRightLarger: "R +{value}%",
      symEven: "±0.0%",
      symDelta: "Δ {value} {unit}",
      distTitle: "接地の分類内訳",
      distStrike: "接地タイプ",
      distPronation: "プロネーション分類",
      textHeelStrike: "ヒール",
      textMidfoot: "ミッドフット",
      textForefoot: "フォアフット",
      textNeutral: "ニュートラル",
      textOver: "オーバー",
      textSevereOver: "強いオーバー",
      textUnder: "アンダー",
      textSevereUnder: "強いアンダー",
      reportFootnote: "参考レンジは健常成人・快適歩行の一般的な目安であり、良し悪しの判定ではありません。数値は ORPHE INSOLE の Step Analysis（FW算出）に基づきます。",
      lastUpdateHtml: '<i class="bi bi-broadcast"></i> Step Analysis 最終更新',
      scopeNote: "<strong>このexampleは判定・採点をしません。</strong> 正常範囲は年齢・身長・歩行速度・計測条件で変わるため、平均±SD・左右差・分布の提示にとどめます。FWが未確定値（-1等）を返した歩は該当パラメータを欠損として集計から除外します。歩隔・単脚支持率など Step Analysis に含まれない量は扱いません。",
      chartFootnote: "レポートは1歩（1 gait cycle = 同側の接地から次の同側接地まで）単位で更新されます。ケイデンスは 120 ÷ 歩行周期 で算出した steps/min 換算です。Realtime + Step はライブ表示向けであり、無欠損記録を保証するモードではありません。",
      howTitle: "このexampleが使う Toolkit の設定プログラム",
      footerNote: "このページは研究・開発用のexampleです。医療機器ではなく、診断・治療・予防を目的としません。",
      sideStateWaiting: "待機中",
      sideStateConnected: "接続済み",
      sourceLiveTitle: "LIVE: {count}台接続",
      sourceDuplicateSide: "2台が同じ装着位置として認識されています。実機の mount position を確認してください。",
      sourceLiveBoth: "左右の Step Analysis を購読しています。「記録開始」で計測が始まります。",
      sourceLiveOne: "{side}足を受信中。もう1台も接続できます。",
      sideLeft: "左",
      sideRight: "右",
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
      demoPlayingDetail: "表示確認用です。実機の測定値ではありません。"
    },
    en: {
      metaTitle: "ORPHE INSOLE Gait Report",
      metaDescription: "An example that records 20 steps per foot from ORPHE INSOLE Step Analysis and builds a gait report with mean ± SD, left/right asymmetry, and variability.",
      backLabel: "Back to Examples",
      languageLabel: "Language",
      toolkitLabel: "Connect ORPHE INSOLE",
      leadCopy: "Press Start recording and walk: the report updates on every step and is finalized as a mean ± SD report once 20 steps are collected for each foot.",
      controlsLabel: "Data source and controls",
      sourceConnectTitle: "Connect your INSOLE devices",
      sourceConnectDetail: "Use the switches beside the title to connect one left and one right device.",
      recordStartHtml: '<i class="bi bi-record-circle"></i> Start recording',
      recordRestartHtml: '<i class="bi bi-arrow-repeat"></i> Restart',
      recordAgainHtml: '<i class="bi bi-arrow-repeat"></i> Measure again',
      demoPlayHtml: '<i class="bi bi-play-fill"></i> Play demo',
      demoStopHtml: '<i class="bi bi-stop-fill"></i> Stop demo',
      clearHtml: '<i class="bi bi-arrow-counterclockwise"></i> Clear',
      printHtml: '<i class="bi bi-printer"></i> Print',
      settingsGuide: '<strong>To use the Gait Report, open the gear icon in the Toolkit UI and use these settings.</strong><p><span>Data Outputs: turn on <b>Raw Sensor Data</b> and <b>Step Analysis</b></span><span>Raw Data Acquisition: <b>Realtime</b></span><span>Realtime Streaming Format: <b>4: gyro + acc + press + quat (100Hz)</b></span><span class="settings-guide-default">This demo program uses these settings by default.</span></p>',
      progressLabel: "Recording progress",
      progressIdle: "Press Start recording, then start walking.",
      progressIdleReceiving: "Step Analysis packets are arriving. Press Start recording to begin collecting.",
      progressRecording: "Recording — the report updates with every step.",
      progressComplete: "Report complete — finalized as mean ± SD of {target} steps per foot.",
      progressSide: "{count} / {target} steps",
      sideLeftLabel: "Left foot",
      sideRightLabel: "Right foot",
      reportKicker: "ORPHE GAIT REPORT",
      reportTitle: "Gait Measurement Report",
      reportSectionTitle: "Gait measurement report",
      reportSectionDescription: "From a session of 20 steps per foot, this report summarizes basic gait measures as mean ± SD, left/right asymmetry, temporal variability, and foot-strike classifications.",
      statusIdle: "Waiting",
      statusRecording: "Recording",
      statusComplete: "Complete",
      reportDateLabel: "Measured at",
      reportSourceLabel: "Data source",
      reportStepsLabel: "Steps",
      reportStepsValue: "L {left} / R {right} steps",
      sourceValueLive: "ORPHE INSOLE (hardware)",
      sourceValueDemo: "Synthetic demo data",
      sourceValueNone: "—",
      overviewTitle: "Basic gait measures (both feet, mean ± SD)",
      refLabel: "Reference",
      refCvLabel: "Reference: below {max}%",
      refRangeLabel: "Reference: {min}–{max} {unit}",
      noData: "—",
      meanSdPattern: "± {sd}",
      nOfSteps: "n={count}",
      cvTileLabel: "Gait cycle variability (CV)",
      cvTileValue: "L {left} / R {right}",
      metric_speed_mps_label: "Gait speed",
      metric_stride_m_label: "Stride length",
      metric_cycle_s_label: "Gait cycle",
      metric_cadence_spm_label: "Cadence",
      metric_stance_pct_label: "Stance phase",
      metric_stance_s_label: "Stance time",
      metric_swing_s_label: "Swing time",
      metric_strike_deg_label: "Strike angle",
      metric_pronation_deg_label: "Pronation angle",
      metric_landing_force_label: "Landing force",
      lrTitle: "Left / right comparison",
      lrParameter: "Parameter",
      lrLeft: "Left",
      lrRight: "Right",
      lrSymmetry: "Asymmetry",
      symLeftLarger: "L +{value}%",
      symRightLarger: "R +{value}%",
      symEven: "±0.0%",
      symDelta: "Δ {value} {unit}",
      distTitle: "Classification breakdown",
      distStrike: "Foot strike",
      distPronation: "Pronation class",
      textHeelStrike: "Heel",
      textMidfoot: "Midfoot",
      textForefoot: "Forefoot",
      textNeutral: "Neutral",
      textOver: "Over",
      textSevereOver: "Severe over",
      textUnder: "Under",
      textSevereUnder: "Severe under",
      reportFootnote: "Reference ranges are general guides for healthy adults at comfortable walking speed; they are not pass/fail judgments. Values come from ORPHE INSOLE Step Analysis (computed by the firmware).",
      lastUpdateHtml: '<i class="bi bi-broadcast"></i> Last Step Analysis update',
      scopeNote: "<strong>This example does not judge or score.</strong> Normal ranges vary with age, height, speed, and measurement conditions, so it only presents mean ± SD, asymmetry, and distributions. Steps where the firmware returns undetermined values (such as -1) are excluded from the affected parameter. Quantities not included in Step Analysis, such as step width and single-support ratio, are not handled.",
      chartFootnote: "The report updates once per step (one gait cycle: from one foot contact to the next contact of the same foot). Cadence is converted to steps/min as 120 ÷ gait cycle. Realtime + Step is intended for live visualization and does not guarantee lossless recording.",
      howTitle: "Toolkit setup used by this example",
      footerNote: "This example is for research and development. It is not a medical device and is not intended for diagnosis, treatment, or prevention.",
      sideStateWaiting: "waiting",
      sideStateConnected: "connected",
      sourceLiveTitle: "LIVE: {count} connected",
      sourceDuplicateSide: "Both devices are identified with the same mount position. Check the mount position stored on each device.",
      sourceLiveBoth: "Subscribed to Step Analysis for both feet. Press Start recording to begin.",
      sourceLiveOne: "Receiving the {side} foot. You can connect one more device.",
      sideLeft: "left",
      sideRight: "right",
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
      demoPlayingDetail: "For display testing only. These are not hardware measurements."
    }
  };

  let currentLanguage = "ja";

  function detectDefaultLanguage(timeZone, browserLanguage) {
    if (timeZone) return timeZone === "Asia/Tokyo" ? "ja" : "en";
    return String(browserLanguage || "").toLowerCase().startsWith("ja")
      ? "ja"
      : "en";
  }

  function systemDefaultLanguage() {
    let timeZone = "";
    try {
      timeZone = root.Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      // Fall back to the browser language when the timezone is unavailable.
    }
    const browserLanguage = root.navigator ? root.navigator.language : "";
    return detectDefaultLanguage(timeZone, browserLanguage);
  }

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
      root.dispatchEvent(new root.CustomEvent("gait-report:languagechange", {
        detail: { language: currentLanguage }
      }));
    }
  }

  const api = {
    detectDefaultLanguage,
    getLanguage: () => currentLanguage,
    setLanguage,
    t,
    translations
  };

  if (root.document) {
    root.document.addEventListener("DOMContentLoaded", () => {
      const requestedLanguage = new URLSearchParams(root.location.search).get("lang");
      const initialLanguage = translations[requestedLanguage]
        ? requestedLanguage
        : systemDefaultLanguage();
      setLanguage(initialLanguage);
      root.document.querySelectorAll("[data-lang-button]").forEach((button) => {
        button.addEventListener("click", () => {
          setLanguage(button.dataset.langButton, { updateUrl: true });
        });
      });
    });
  }

  return Object.freeze(api);
});
