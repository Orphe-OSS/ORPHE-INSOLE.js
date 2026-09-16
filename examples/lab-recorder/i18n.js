(function attachLabRecorderI18n(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LabRecorderI18n = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createLabRecorderI18n(root) {
  "use strict";

  const translations = {
    ja: {
      metaTitle: "ORPHE INSOLE Lab Recorder",
      metaDescription: "研究室向けの ORPHE INSOLE 収録ページ。FIFO ロスレス収録に、他の計測系と時間軸を揃えるための同期マーカー・踏み込みインパルス検出と、後から来歴を追えるメタデータ・FW版・時刻源の記録を加えます。",
      backLabel: "Examples 一覧へ戻る",
      languageLabel: "言語",
      toolkitLabel: "ORPHE INSOLE 接続",
      eyebrow: "TOOLKIT EXAMPLE / LAB RECORDER",
      leadCopy: "他の計測系（モーションキャプチャ・振動計など）と時間軸を揃えられ、後から来歴を追える状態で INSOLE のデータを収録するためのページです。被験者と試行を替えながら連続して収録し、試行ごとに CSV / JSON を保存します。",
      fifoConstraint: "収録は FIFO（端末内バッファのロスレス回収）で行います。FIFO では Step Analysis は同時に使えず、クォータニオン（姿勢）も出力されません。ジャイロ・加速度・6ch圧力のみです。",

      controlsLabel: "収録の状態と操作",
      sourceConnectTitle: "INSOLE を接続してください",
      sourceConnectDetail: "タイトル横のスイッチから接続します。1台でも2台（左右同時）でも収録できます。",
      sourceReadyTitle: "接続済み — メタデータを確認して収録を開始できます",
      sourceReadyDetail: "開始後、被験者に踵で強く踏み込んでもらうと同期候補が自動検出されます。",
      sourcePreparingTitle: "FIFO の準備中",
      sourcePreparingDetail: "読み取りモードを FIFO へ切り替え、端末内バッファを消去しています（数秒）。",
      sourceRecordingTitle: "収録中",
      sourceRecordingDetail: "同期イベントの瞬間に MARK（または Space）を押してください。タブを閉じない・PCをスリープさせない。",
      sourceDrainingTitle: "回収中（drain）",
      sourceDrainingDetail: "停止しました。端末内に残ったデータを回収しています。完了までお待ちください。",
      sourceReviewTitle: "収録完了 — 確認して保存",
      sourceReviewDetail: "インパルス候補を確認・却下し、「保存して次へ」で CSV / JSON を保存して次の試行に進みます。",
      sourceDisconnectedTitle: "INSOLE が切断されました",
      sourceDisconnectedDetail: "接続スイッチを入れ直してください。収録中の切断はその試行を完了扱いにしません。",
      sourceErrorTitle: "エラー",
      toolkitLoadErrorTitle: "InsoleToolkit を読み込めません",
      toolkitLoadErrorDetail: "ORPHE-INSOLE.js / InsoleFifo.js / InsoleToolkit.js の読み込み順を確認してください。",

      recordStartHtml: '<i class="bi bi-record-circle"></i> 収録開始',
      recordStopHtml: '<i class="bi bi-stop-circle"></i> 停止',
      saveNextHtml: '<i class="bi bi-save"></i> 保存して次へ',
      discardHtml: '<i class="bi bi-trash"></i> 破棄',
      elapsedLabel: "経過",
      discardConfirm: "この試行を保存せずに破棄しますか？",

      settingsGuide: "<strong>Toolkit UI の歯車で設定を変える必要はありません。</strong><p><span>収録開始時に <code>fifo-recording</code> プロファイルへ自動で切り替え、停止・回収後に Realtime へ戻します</span><span>Data Outputs: Raw Sensor Data のみ（Step Analysis は FIFO と同時に使えません）</span><span>クォータニオンは FIFO に含まれません</span></p>",

      sessionLabel: "試行メタデータとセッション",
      sessionEyebrow: "SESSION",
      sessionTitle: "試行メタデータ",
      sessionDescription: "収録前に入力します。すべて任意で、空でも収録できます。CSV のヘッダー行と JSON に埋め込まれます。",
      fieldParticipant: "participant_id",
      fieldTrial: "trial_number",
      fieldTrialHint: "保存すると自動で +1 されます",
      fieldCondition: "condition",
      fieldSurface: "surface",
      fieldFootwear: "footwear",
      fieldFootwearHint: "靴は交絡因子です。試行ごとに記録してください",
      fieldNotes: "notes",
      fieldImpulseWindow: "踏み込み検出ウィンドウ [s]",
      fieldImpulseWindowHint: "収録開始からこの秒数以内の加速度最大を同期候補にします",
      sessionPersistNote: "直前の入力値はこのブラウザに保存され、次回の既定値になります（クラウド送信はしません）。",
      trialsTitle: "このセッションの試行",
      trialsColTrial: "trial",
      trialsColCondition: "condition",
      trialsColSamples: "samples",
      trialsColLoss: "missing / dropped",
      trialsColMarkers: "markers",
      trialsColImpulse: "impulse",
      trialsEmpty: "保存した試行がここに並びます。サンプル本体は保存時にダウンロードされ、この一覧には要約だけ残ります。",
      sessionCsvHtml: '<i class="bi bi-table"></i> 試行一覧 CSV',
      sessionJsonHtml: '<i class="bi bi-filetype-json"></i> セッション JSON',
      dictionaryHtml: '<i class="bi bi-book"></i> データ辞書 (.md)',
      clearSessionHtml: '<i class="bi bi-eraser"></i> 一覧をクリア',
      clearSessionConfirm: "試行一覧（要約）をクリアしますか？ ダウンロード済みのファイルには影響しません。",

      markerLabel: "同期イベントマーカー",
      markerEyebrow: "SYNC MARKER",
      markerTitle: "同期イベントマーカー",
      markerDescription: "モーションキャプチャの録画開始や被験者の踏み込みなど、他の計測系にも見える瞬間に押します。ホスト時刻（ミリ秒・タイムゾーン付き）、収録開始からの経過、その時点の直近 serial、任意ラベルを記録し、停止後に最近傍サンプルへ突き合わせます。",
      markerButtonHtml: '<i class="bi bi-flag-fill"></i> MARK',
      markerHint: "収録中は Space キーでも打刻できます（入力欄にフォーカスがあるときは無効）。",
      markerLabelPlaceholder: "ラベル（任意）例: vicon start / stomp",
      markerColIndex: "#",
      markerColLabel: "label",
      markerColHost: "host time",
      markerColElapsed: "elapsed",
      markerColLastSerial: "直近 serial（打刻時）",
      markerColAligned: "最近傍 sample（停止後）",
      markerEmpty: "収録中に MARK を押すとここに一覧されます。",
      markerAlignedPending: "停止後に確定",
      markerAlignedNone: "—",

      impulseLabel: "踏み込みインパルスの候補",
      impulseEyebrow: "IMPULSE CANDIDATE",
      impulseTitle: "踏み込みインパルスの自動検出",
      impulseDescription: "収録開始後の検出ウィンドウ内で加速度ノルム |acc| が最大のサンプルを同期候補として提示します。自動では確定しません。必ず確認して採用または却下してください。",
      impulseEmpty: "収録が完了すると、デバイスごとに候補を表示します。",
      impulseNone: "ウィンドウ内に加速度サンプルがありませんでした。",
      impulseAccept: "採用",
      impulseReject: "却下",
      impulseReset: "未確認に戻す",
      impulseStatusPending: "未確認",
      impulseStatusAccepted: "採用",
      impulseStatusRejected: "却下",
      impulsePeak: "ピーク |acc|",
      impulseSerial: "serial / packet",
      impulseTime: "端末時刻 / 経過",
      impulseWindow: "ウィンドウ",
      impulseProminence: "中央値比",
      impulseWeak: "弱い候補: ピークが中央値の {ratio} 倍しかありません。踏み込みが無かった試行では通常の動きを拾っている可能性が高いので、却下を検討してください。",
      impulseCaution: "被験者に「開始時に踵で強く踏み込む」よう指示した試行でのみ意味を持ちます。歩行中の最大値を拾っている可能性があるため、必ず目視で確認してください。",

      chartsLabel: "IMU と圧力の生データグラフ",
      chartsEyebrow: "RAW DATA",
      chartsTitle: "IMU / FSR 生データ",
      chartsDescription: "収録中は FIFO で回収できた分を数百 ms 遅れで追記します（再要求で後から届いた分も時刻順に差し込みます）。停止後は試行全体を表示し、マーカー・インパルス候補・欠損区間を重ねます。",
      chartWindowLabel: "表示幅",
      chartWindow5: "直近 5 秒",
      chartWindow10: "直近 10 秒",
      chartWindow30: "直近 30 秒",
      chartWindowAll: "全体",
      chartResetZoomHtml: '<i class="bi bi-arrows-angle-expand"></i> ズーム解除',
      chartZoomHint: "停止後はグラフ上をドラッグで拡大、ダブルクリックで解除。カーソル位置の値は各行の下に表示します。",
      chartAcc: "ACC",
      chartGyro: "GYRO",
      chartPress: "PRESS",
      chartLegendMarker: "マーカー",
      chartLegendImpulse: "インパルス候補",
      chartLegendMissing: "欠損区間",
      chartEmptyLive: "収録を開始するとここに描かれます",
      chartEmptyWindow: "この範囲にデータがありません",
      chartReadoutEmpty: "カーソルをグラフに重ねると値を表示します",
      chartAxisLive: "x = 最初のサンプルからの端末時間 [s]",
      chartAxisReview: "x = 収録開始ボタンからの経過 [s]（host_time_est 基準）",

      liveLabel: "収録中のライブ状態",
      liveEyebrow: "LIVE",
      liveTitle: "デバイスごとの進み",
      liveDescription: "FIFO はプル型のため数百 ms 遅れてバースト到着します。ここでの値は「回収済み」の進みです。",
      liveSerial: "最新 serial",
      liveDeviceTime: "端末時刻",
      liveSamples: "samples",
      liveBatches: "batches",
      liveLag: "lag",
      liveDropped: "dropped",
      liveWaiting: "—",
      alignmentTitle: "左右アライメント",
      alignmentWaiting: "2台で収録すると、収録開始からの serial の進みの差を表示します。",
      alignmentSummary: "{a}: +{aSerials} serial / {b}: +{bSerials} serial → 差 {delta} serial（≈ {deltaMs} ms）・端末時刻差 {timeDelta} ms",
      alignmentNote: "serial は端末ごとに独立のカウンタです。差は「収録開始からの進み」の比較であり、絶対値の比較ではありません。",

      resultEyebrow: "AFTER STOP AND DRAIN",
      resultTitle: "収録結果と欠損レポート",
      resultDescription: "drain（未回収データの回収）完了後の正式計測区間について集計します。CSV に保存されるのはこの区間だけです。",
      verdictWaiting: "未計測",
      verdictComplete: "欠損なし",
      verdictIncomplete: "欠損あり",
      resultSummaryWaiting: "まだ収録していません。",
      resultSummaryComplete: "全デバイスで missing = 0 かつ dropped = 0 です。CSV は完全です。",
      resultSummaryIncomplete: "欠損があります。欠損 range と dropped を確認し、必要なら再試行してください。",
      tableHeaderMetric: "項目",
      tableHeaderMeaning: "意味",
      valueEmpty: "—",
      deviceNotUsed: "不参加",
      yes: "yes",
      no: "no",
      m_duration: "収録時間", m_duration_note: "開始〜停止ボタンのホスト時間",
      m_samples: "samples", m_samples_note: "CSV に書き出す行数（1 serial = 4 frame）",
      m_first: "first serial", m_first_note: "区間の最初の serial",
      m_last: "last serial", m_last_note: "区間の最後の serial",
      m_expected: "expected", m_expected_note: "first〜last の serial 数（wraparound 対応）",
      m_received: "received", m_received_note: "回収できた serial 数",
      m_missing: "missing", m_missing_note: "expected − received。CSV に無い serial",
      m_missing_rate: "missing rate", m_missing_rate_note: "missing / expected",
      m_ranges: "欠損 range", m_ranges_note: "連続する欠損 serial の区間",
      m_dropped: "dropped", m_dropped_note: "収録中に回復不能と判定された累計。missing とは別指標",
      m_max_lag: "max lag", m_max_lag_note: "未取得 serial 数の最大。1500 に近いほど危険",
      m_recovered: "drain / catch-up 回収", m_recovered_note: "停止後の回収フェーズで取れた serial 数",
      m_rate: "実測レート", m_rate_note: "(samples − 1) / 端末時刻スパン。公称 208 Hz",
      m_clock_offset: "clock offset", m_clock_offset_note: "host − device [ms]（最小遅延法）",
      m_clock_spread: "offset spread", m_clock_spread_note: "FIFO バッチ間の offset の最大−最小 [ms]。回収ジッタ＝host_time_est の誤差上界の目安",
      m_complete: "complete", m_complete_note: "missing = 0 かつ dropped = 0 かつ非 truncated",
      exportsLabel: "この試行の書き出し",
      csvHtml: '<i class="bi bi-download"></i> サンプル CSV',
      markersCsvHtml: '<i class="bi bi-flag"></i> マーカー CSV',
      trialJsonHtml: '<i class="bi bi-filetype-json"></i> 試行 JSON',
      lossJsonHtml: '<i class="bi bi-clipboard-data"></i> 欠損レポート JSON',
      scopeNote: "<strong>このページは収録と検証に徹します。</strong> 歩容指標・スコア・判定は算出しません。フットクリアランスなど FW が内部で計算していても BLE で公開されていない値や、精度未検証の近似値は書き出しません。FIFO ではクォータニオンと Step Analysis が使えないため、姿勢・歩容の列はありません。",
      resultFootnote: "dropped と missing は別指標です。両方が 0 のときだけ「欠損なし」と判定します。",

      howEyebrow: "HOW IT WORKS",
      howTitle: "このページが呼んでいる公開 API",
      howNote: "FIFO のプロトコル（読み取りモード切替・serial 指定の再要求・drain）は <code>src/InsoleFifo.js</code> と <code>src/InsoleToolkit.js</code> が担当し、このページは呼ぶだけです。時刻付け・突き合わせ・書き出しは <code>recorder-core.js</code>（純関数・Node でテスト）。",

      logEyebrow: "EVENT LOG",
      logTitle: "イベントログ",
      logDescription: "接続・収録・打刻・欠損・保存の経過を記録します。",
      copyLogHtml: '<i class="bi bi-clipboard"></i> ログをコピー',
      clearLogHtml: '<i class="bi bi-eraser"></i> クリア',
      copyLogDone: "コピーしました（{count} 行）",
      copyLogFailed: "コピーできませんでした",

      logPageReady: "ページ準備完了。INSOLE を接続してください。",
      logNotConnected: "INSOLE が接続されていません。",
      logPreparing: "FIFO 収録を準備中（{count} 台）…",
      logStarted: "収録開始（{count} 台）。同期イベントで MARK を押してください。",
      logStartFailedDevice: "{device}: 収録を開始できませんでした — {message}",
      logStopped: "停止。端末内の残りを回収しています…",
      logStopFailedDevice: "{device}: 停止処理でエラー — {message}",
      logNoResultDevice: "{device}: 計測結果を取得できませんでした。",
      logConnectedDevice: "{device}: 接続しました。",
      logDisconnectedDevice: "{device}: 切断されました。",
      logDisconnectedWhileRecording: "{device}: 収録中に切断されました。この試行のこのデバイスは不完全です。",
      logStopAfterDisconnect: "切断後の停止処理に失敗: {message}",
      logChooserCancelled: "デバイス選択がキャンセルされました。",
      logErrorDevice: "{device}: {message}",
      logDataLossDevice: "{device}: 回復不能な欠損 {dropped}（累計 {cumulative}, {reason}）",
      logFifoStoppedDevice: "{device}: FIFO 停止 — 回収 {collected}, dropped {dropped}, drain回収 {recovered}",
      logMarker: "MARK #{index} @ {elapsed} s{label} — 直近 serial {serials}",
      logImpulseCandidate: "{device}: インパルス候補 serial {serial} (+{elapsed} s, |acc| {peak} G)。確認してください。",
      logImpulseNone: "{device}: ウィンドウ内にインパルス候補が見つかりませんでした。",
      logImpulseDecision: "{device}: インパルス候補を「{status}」にしました。",
      logResultDevice: "{device}: {seconds} s, samples {samples}, expected {expected}, received {received}, missing {missing}, dropped {dropped}, max lag {maxLag}",
      logSaved: "試行 {trial} を保存しました（{files}）。trial_number を {next} に進めました。",
      logDiscarded: "試行を破棄しました。",
      logSessionExported: "セッションの一覧を書き出しました（{count} 試行）。",
      logDictionarySaved: "データ辞書を保存しました。",
      logFirmware: "{device}: firmware {version}",
      logFirmwareUnknown: "{device}: firmware version を取得できませんでした（CSV には空欄で記録します）。",
      logSdkVersion: "SDK version {version}",
      logSdkVersionUnknown: "SDK version を取得できませんでした（package.json が読めない環境）。",
      logDownloadHint: "複数ファイルを続けて保存します。ブラウザが「複数ファイルのダウンロード」を確認したら許可してください。",

      deviceLabel: "INSOLE {n}",
      deviceLabelWithSide: "INSOLE {n} ({side})",
      sideLeft: "L",
      sideRight: "R",
      footerNote: "このページは研究・開発用の example です。医療機器ではなく、診断・治療・予防を目的としません。収録データはブラウザ内で処理され、外部には送信されません。"
    },
    en: {
      metaTitle: "ORPHE INSOLE Lab Recorder",
      metaDescription: "Recording page for gait labs. Lossless FIFO capture plus sync markers and impulse detection for aligning with other instruments, and provenance (metadata, firmware version, time sources) written into every file.",
      backLabel: "Back to examples",
      languageLabel: "Language",
      toolkitLabel: "ORPHE INSOLE connection",
      eyebrow: "TOOLKIT EXAMPLE / LAB RECORDER",
      leadCopy: "Record ORPHE INSOLE data so that its time axis can be aligned with other instruments (motion capture, vibration sensors) and its provenance can be traced later. Run trial after trial, switching participants, and save CSV / JSON per trial.",
      fifoConstraint: "Recording uses FIFO (lossless retrieval from the device ring buffer). In FIFO mode Step Analysis cannot run at the same time and quaternions (orientation) are not output — only gyro, acceleration and the 6 pressure channels.",

      controlsLabel: "Recording state and controls",
      sourceConnectTitle: "Connect an INSOLE",
      sourceConnectDetail: "Use the switches next to the title. One device or two (left and right) can be recorded together.",
      sourceReadyTitle: "Connected — check the metadata and start",
      sourceReadyDetail: "After starting, have the participant stomp firmly with the heel; the impulse becomes a sync candidate.",
      sourcePreparingTitle: "Preparing FIFO",
      sourcePreparingDetail: "Switching the read mode to FIFO and clearing the device buffer (a few seconds).",
      sourceRecordingTitle: "Recording",
      sourceRecordingDetail: "Press MARK (or Space) at each sync event. Keep the tab open and the PC awake.",
      sourceDrainingTitle: "Draining",
      sourceDrainingDetail: "Stopped. Retrieving the data still in the device buffer. Please wait.",
      sourceReviewTitle: "Recording complete — review and save",
      sourceReviewDetail: "Accept or reject the impulse candidate, then \"Save & next\" writes CSV / JSON and advances to the next trial.",
      sourceDisconnectedTitle: "INSOLE disconnected",
      sourceDisconnectedDetail: "Toggle the connection switch again. A disconnect during recording leaves that trial incomplete.",
      sourceErrorTitle: "Error",
      toolkitLoadErrorTitle: "InsoleToolkit could not be loaded",
      toolkitLoadErrorDetail: "Check the load order of ORPHE-INSOLE.js / InsoleFifo.js / InsoleToolkit.js.",

      recordStartHtml: '<i class="bi bi-record-circle"></i> Start recording',
      recordStopHtml: '<i class="bi bi-stop-circle"></i> Stop',
      saveNextHtml: '<i class="bi bi-save"></i> Save & next',
      discardHtml: '<i class="bi bi-trash"></i> Discard',
      elapsedLabel: "Elapsed",
      discardConfirm: "Discard this trial without saving?",

      settingsGuide: "<strong>No changes are needed in the Toolkit gear menu.</strong><p><span>The page switches to the <code>fifo-recording</code> profile when recording starts and back to Realtime after the drain</span><span>Data Outputs: Raw Sensor Data only (Step Analysis cannot run alongside FIFO)</span><span>Quaternions are not part of FIFO data</span></p>",

      sessionLabel: "Trial metadata and session",
      sessionEyebrow: "SESSION",
      sessionTitle: "Trial metadata",
      sessionDescription: "Fill in before recording. All fields are optional; recording works with empty fields. Values are embedded in the CSV header lines and the JSON.",
      fieldParticipant: "participant_id",
      fieldTrial: "trial_number",
      fieldTrialHint: "Incremented automatically after each save",
      fieldCondition: "condition",
      fieldSurface: "surface",
      fieldFootwear: "footwear",
      fieldFootwearHint: "Footwear is a confounder — record it for every trial",
      fieldNotes: "notes",
      fieldImpulseWindow: "Impulse detection window [s]",
      fieldImpulseWindowHint: "The largest acceleration within this many seconds after start becomes the sync candidate",
      sessionPersistNote: "The last values are kept in this browser and used as defaults next time (nothing is sent to a server).",
      trialsTitle: "Trials in this session",
      trialsColTrial: "trial",
      trialsColCondition: "condition",
      trialsColSamples: "samples",
      trialsColLoss: "missing / dropped",
      trialsColMarkers: "markers",
      trialsColImpulse: "impulse",
      trialsEmpty: "Saved trials are listed here. Sample data is downloaded at save time; only the summary stays in this list.",
      sessionCsvHtml: '<i class="bi bi-table"></i> Trials CSV',
      sessionJsonHtml: '<i class="bi bi-filetype-json"></i> Session JSON',
      dictionaryHtml: '<i class="bi bi-book"></i> Data dictionary (.md)',
      clearSessionHtml: '<i class="bi bi-eraser"></i> Clear list',
      clearSessionConfirm: "Clear the trial list (summaries only)? Downloaded files are not affected.",

      markerLabel: "Sync event marker",
      markerEyebrow: "SYNC MARKER",
      markerTitle: "Sync event marker",
      markerDescription: "Press at moments that other instruments also see — motion-capture start, the participant's stomp. Records host time (ms, with timezone), elapsed time since start, the newest serial received at that moment and an optional label; after stop, each marker is matched to the nearest sample.",
      markerButtonHtml: '<i class="bi bi-flag-fill"></i> MARK',
      markerHint: "While recording, the Space key also places a marker (disabled while a text field has focus).",
      markerLabelPlaceholder: "Label (optional), e.g. vicon start / stomp",
      markerColIndex: "#",
      markerColLabel: "label",
      markerColHost: "host time",
      markerColElapsed: "elapsed",
      markerColLastSerial: "newest serial at press",
      markerColAligned: "nearest sample (after stop)",
      markerEmpty: "Markers pressed during recording are listed here.",
      markerAlignedPending: "resolved after stop",
      markerAlignedNone: "—",

      impulseLabel: "Impulse candidate",
      impulseEyebrow: "IMPULSE CANDIDATE",
      impulseTitle: "Automatic stomp impulse detection",
      impulseDescription: "The sample with the largest acceleration norm |acc| within the detection window after start is proposed as a sync candidate. Nothing is confirmed automatically — review it and accept or reject.",
      impulseEmpty: "Candidates per device appear here once a recording completes.",
      impulseNone: "No acceleration samples inside the window.",
      impulseAccept: "Accept",
      impulseReject: "Reject",
      impulseReset: "Back to pending",
      impulseStatusPending: "pending",
      impulseStatusAccepted: "accepted",
      impulseStatusRejected: "rejected",
      impulsePeak: "peak |acc|",
      impulseSerial: "serial / packet",
      impulseTime: "device time / elapsed",
      impulseWindow: "window",
      impulseProminence: "peak ÷ median",
      impulseWeak: "Weak candidate: the peak is only {ratio}× the median. If there was no stomp in this trial this is probably ordinary movement — consider rejecting it.",
      impulseCaution: "Meaningful only in trials where the participant was instructed to stomp firmly at the start. The peak may be an ordinary step, so always confirm visually.",

      chartsLabel: "Raw IMU and pressure charts",
      chartsEyebrow: "RAW DATA",
      chartsTitle: "Raw IMU / FSR data",
      chartsDescription: "While recording, samples retrieved by FIFO are appended a few hundred ms late (re-requested packets are inserted in time order). After stop the whole trial is shown with markers, the impulse candidate and missing ranges overlaid.",
      chartWindowLabel: "Window",
      chartWindow5: "last 5 s",
      chartWindow10: "last 10 s",
      chartWindow30: "last 30 s",
      chartWindowAll: "whole",
      chartResetZoomHtml: '<i class="bi bi-arrows-angle-expand"></i> Reset zoom',
      chartZoomHint: "After stop, drag on a chart to zoom, double-click to reset. Values under the cursor appear below each row.",
      chartAcc: "ACC",
      chartGyro: "GYRO",
      chartPress: "PRESS",
      chartLegendMarker: "marker",
      chartLegendImpulse: "impulse candidate",
      chartLegendMissing: "missing range",
      chartEmptyLive: "Charts start when recording starts",
      chartEmptyWindow: "No data in this range",
      chartReadoutEmpty: "Hover a chart to read values",
      chartAxisLive: "x = device time since the first sample [s]",
      chartAxisReview: "x = elapsed since the start button [s] (host_time_est)",

      liveLabel: "Live state while recording",
      liveEyebrow: "LIVE",
      liveTitle: "Progress per device",
      liveDescription: "FIFO is pull-based: data arrives in bursts a few hundred ms late. Values here show what has been retrieved.",
      liveSerial: "newest serial",
      liveDeviceTime: "device time",
      liveSamples: "samples",
      liveBatches: "batches",
      liveLag: "lag",
      liveDropped: "dropped",
      liveWaiting: "—",
      alignmentTitle: "Left / right alignment",
      alignmentWaiting: "With two devices, the difference in serial progress since start is shown here.",
      alignmentSummary: "{a}: +{aSerials} serials / {b}: +{bSerials} serials → Δ {delta} serials (≈ {deltaMs} ms) · device-time Δ {timeDelta} ms",
      alignmentNote: "Serial counters are independent per device. The delta compares progress since recording start, not absolute values.",

      resultEyebrow: "AFTER STOP AND DRAIN",
      resultTitle: "Result and loss report",
      resultDescription: "Statistics for the formal measurement window after the drain (retrieval of outstanding data) completed. Only this window is written to the CSV.",
      verdictWaiting: "not recorded",
      verdictComplete: "lossless",
      verdictIncomplete: "loss",
      resultSummaryWaiting: "Nothing recorded yet.",
      resultSummaryComplete: "missing = 0 and dropped = 0 on every device. The CSV is complete.",
      resultSummaryIncomplete: "Loss detected. Check the missing ranges and dropped tally, and repeat the trial if needed.",
      tableHeaderMetric: "Metric",
      tableHeaderMeaning: "Meaning",
      valueEmpty: "—",
      deviceNotUsed: "not used",
      yes: "yes",
      no: "no",
      m_duration: "duration", m_duration_note: "Host time between the start and stop buttons",
      m_samples: "samples", m_samples_note: "Rows written to the CSV (1 serial = 4 frames)",
      m_first: "first serial", m_first_note: "First serial of the window",
      m_last: "last serial", m_last_note: "Last serial of the window",
      m_expected: "expected", m_expected_note: "Serials from first to last (wraparound aware)",
      m_received: "received", m_received_note: "Serials recovered",
      m_missing: "missing", m_missing_note: "expected − received; serials absent from the CSV",
      m_missing_rate: "missing rate", m_missing_rate_note: "missing / expected",
      m_ranges: "missing ranges", m_ranges_note: "Contiguous runs of missing serials",
      m_dropped: "dropped", m_dropped_note: "Declared unrecoverable during recording; a different tally from missing",
      m_max_lag: "max lag", m_max_lag_note: "Peak number of not-yet-fetched serials; 1500 is the buffer limit",
      m_recovered: "drain / catch-up", m_recovered_note: "Serials recovered after the stop button",
      m_rate: "measured rate", m_rate_note: "(samples − 1) / device-time span; nominal 208 Hz",
      m_clock_offset: "clock offset", m_clock_offset_note: "host − device [ms], min-latency method",
      m_clock_spread: "offset spread", m_clock_spread_note: "max − min of the offset across FIFO batches [ms]; retrieval jitter, an upper bound on the host_time_est error",
      m_complete: "complete", m_complete_note: "missing = 0 and dropped = 0 and not truncated",
      exportsLabel: "Exports for this trial",
      csvHtml: '<i class="bi bi-download"></i> Samples CSV',
      markersCsvHtml: '<i class="bi bi-flag"></i> Markers CSV',
      trialJsonHtml: '<i class="bi bi-filetype-json"></i> Trial JSON',
      lossJsonHtml: '<i class="bi bi-clipboard-data"></i> Loss report JSON',
      scopeNote: "<strong>This page records and verifies; it does not analyse.</strong> No gait parameters, scores or judgements are computed. Values the firmware computes internally but does not expose over BLE (such as foot clearance), and approximations whose accuracy is unverified, are deliberately not exported. Because FIFO excludes quaternions and Step Analysis, there are no orientation or gait columns.",
      resultFootnote: "dropped and missing are different tallies. Only when both are 0 is the recording judged lossless.",

      howEyebrow: "HOW IT WORKS",
      howTitle: "Public API used by this page",
      howNote: "The FIFO protocol (read-mode switch, re-requests by serial, drain) lives in <code>src/InsoleFifo.js</code> and <code>src/InsoleToolkit.js</code>; this page only calls it. Time-stamping, matching and export are in <code>recorder-core.js</code> (pure functions, tested in Node).",

      logEyebrow: "EVENT LOG",
      logTitle: "Event log",
      logDescription: "Connection, recording, markers, loss and save events.",
      copyLogHtml: '<i class="bi bi-clipboard"></i> Copy log',
      clearLogHtml: '<i class="bi bi-eraser"></i> Clear',
      copyLogDone: "Copied ({count} lines)",
      copyLogFailed: "Copy failed",

      logPageReady: "Page ready. Connect an INSOLE.",
      logNotConnected: "No INSOLE connected.",
      logPreparing: "Preparing FIFO recording ({count} device(s))…",
      logStarted: "Recording started ({count} device(s)). Press MARK at sync events.",
      logStartFailedDevice: "{device}: could not start — {message}",
      logStopped: "Stopped. Draining the device buffer…",
      logStopFailedDevice: "{device}: error while stopping — {message}",
      logNoResultDevice: "{device}: no measurement result.",
      logConnectedDevice: "{device}: connected.",
      logDisconnectedDevice: "{device}: disconnected.",
      logDisconnectedWhileRecording: "{device}: disconnected during recording. This device's data for the trial is incomplete.",
      logStopAfterDisconnect: "Stop after disconnect failed: {message}",
      logChooserCancelled: "Device chooser cancelled.",
      logErrorDevice: "{device}: {message}",
      logDataLossDevice: "{device}: unrecoverable loss {dropped} (cumulative {cumulative}, {reason})",
      logFifoStoppedDevice: "{device}: FIFO stopped — collected {collected}, dropped {dropped}, drain recovered {recovered}",
      logMarker: "MARK #{index} @ {elapsed} s{label} — newest serial {serials}",
      logImpulseCandidate: "{device}: impulse candidate serial {serial} (+{elapsed} s, |acc| {peak} G). Please review.",
      logImpulseNone: "{device}: no impulse candidate inside the window.",
      logImpulseDecision: "{device}: impulse candidate marked \"{status}\".",
      logResultDevice: "{device}: {seconds} s, samples {samples}, expected {expected}, received {received}, missing {missing}, dropped {dropped}, max lag {maxLag}",
      logSaved: "Trial {trial} saved ({files}). trial_number advanced to {next}.",
      logDiscarded: "Trial discarded.",
      logSessionExported: "Session list exported ({count} trials).",
      logDictionarySaved: "Data dictionary saved.",
      logFirmware: "{device}: firmware {version}",
      logFirmwareUnknown: "{device}: firmware version unavailable (left empty in the CSV).",
      logSdkVersion: "SDK version {version}",
      logSdkVersionUnknown: "SDK version unavailable (package.json not readable here).",
      logDownloadHint: "Several files are saved in a row. If the browser asks to allow multiple downloads, accept.",

      deviceLabel: "INSOLE {n}",
      deviceLabelWithSide: "INSOLE {n} ({side})",
      sideLeft: "L",
      sideRight: "R",
      footerNote: "This page is a research / development example. It is not a medical device and is not intended for diagnosis, treatment or prevention. Recorded data stays in the browser and is never sent anywhere."
    }
  };

  let currentLanguage = "en";

  function detectDefaultLanguage(options = {}) {
    const language = options.language || (root.navigator && root.navigator.language) || "";
    if (/^ja\b/i.test(language)) return "ja";
    let timeZone = options.timeZone;
    if (!timeZone && typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (error) { void error; }
    }
    return timeZone === "Asia/Tokyo" ? "ja" : "en";
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
    root.document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
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
      root.dispatchEvent(new root.CustomEvent("lab-recorder:languagechange", {
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
      const initialLanguage = translations[requestedLanguage] ? requestedLanguage : detectDefaultLanguage();
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
