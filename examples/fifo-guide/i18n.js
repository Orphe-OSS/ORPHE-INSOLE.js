(function attachFifoGuideI18n(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.FifoGuideI18n = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createFifoGuideI18n(root) {
  "use strict";

  const translations = {
    ja: {
      metaTitle: "ORPHE INSOLE FIFO Recording + Loss Check",
      metaDescription: "ORPHE INSOLE の FIFO バッファ収録を初めて使う人向けのexample。Realtimeとの違い、約30秒のバッファ、serial連続性と欠損の見かたを1台または2台同時で実機確認できます。",
      backLabel: "Examples 一覧へ戻る",
      languageLabel: "言語",
      toolkitLabel: "ORPHE INSOLE 接続",
      eyebrow: "TOOLKIT EXAMPLE / FIFO RECORDING",
      leadCopy: "INSOLE を1台または2台（左右同時）接続し、FIFO（端末内バッファ）で収録して、serialの連続性から欠損があったかどうかをデバイスごとに確認しCSVを保存します。",

      controlsLabel: "データソースと操作",
      sourceConnectTitle: "INSOLE を接続してください",
      sourceConnectDetail: "タイトル横のスイッチから接続します。1台でも2台（左右同時）でも計測できます。",
      sourceReadyTitle: "接続済み — 計測時間を選んで開始できます",
      sourceReadyDetail: "10秒 → 30秒 → 60秒の順に試すと、バッファ限界の効果が分かります。",
      sourcePreparingTitle: "FIFOの準備中",
      sourcePreparingDetail: "読み取りモードをFIFOへ切り替え、端末内バッファを消去しています（数秒）。",
      sourceRecordingTitle: "収録中",
      sourceRecordingDetail: "タブを閉じない・PCをスリープさせない・INSOLEから離れすぎない（1〜2m以内）。",
      sourceDrainingTitle: "回収中（drain）",
      sourceDrainingDetail: "停止しました。端末内に残ったデータを回収しています。完了までお待ちください。",
      sourceDrainingProgress: "回収済み {collected} serial / 未取得 {lag}",
      sourceDoneTitle: "収録完了",
      sourceDoneDetail: "結果を確認して CSV / JSON を保存できます。",
      sourceDisconnectedTitle: "INSOLE が切断されました",
      sourceDisconnectedDetail: "接続スイッチを入れ直してください。収録中の切断は完了扱いになりません。",
      sourceErrorTitle: "エラー",
      toolkitLoadErrorTitle: "InsoleToolkit を読み込めません",
      toolkitLoadErrorDetail: "ORPHE-INSOLE.js / InsoleFifo.js / InsoleToolkit.js の読み込み順を確認してください。",

      durationLabel: "計測時間",
      durationCustomLabel: "秒",
      duration10: "10秒（まずこれ）",
      duration30: "30秒（推奨の上限）",
      duration60: "60秒（バッファ超過・限界の確認）",
      durationCustom: "任意（秒を入力）",
      recordStartHtml: '<i class="bi bi-record-circle"></i> 収録開始',
      recordStopHtml: '<i class="bi bi-stop-fill"></i> 収録停止',
      csvHtml: '<i class="bi bi-download"></i> FIFO CSV',
      jsonHtml: '<i class="bi bi-filetype-json"></i> 結果JSON',

      settingsGuide: '<strong>FIFO収録を使いたいときは、Toolkit UI の歯車を開き、次のように設定してください。</strong><p><span>Data Outputs: <b>Raw Sensor Data</b> をON / <b>Step Analysis</b> はOFF</span><span>Raw Data Acquisition: <b>FIFO</b></span><span>Realtime Streaming Format: FIFOでは使いません（quatは含まれません）</span><span class="settings-guide-default">このデモプログラムでは収録開始時に <code>fifo-recording</code> プロファイルへ自動で切り替え、停止後に Realtime へ戻します</span></p>',

      bufferLabel: "計測時間とバッファの関係",
      bufferKicker: "DEVICE BUFFER ≈ 30 s",
      bufferTitle: "経過時間",
      bufferScaleZero: "0s",
      bufferScaleWindow: "30s（推奨の上限）",
      bufferScaleMax: "60s+",
      bufferWithinWindow: "推奨帯: {seconds}秒 ≒ {packets} serial（端末内バッファ約{window}秒に収まりやすい）",
      bufferOverWindow: "警告帯: {seconds}秒 ≒ {packets} serial（バッファ約{window}秒を超過。回収が追いつかないと欠損しうる）",
      bufferNote: "この帯は「収まりやすさ」の目安です。30秒以内でも回収が滞れば欠損し、30秒を超えても追いつけていれば欠損しません。",

      graphsLabel: "収録の可視化",
      continuityKicker: "SERIAL CONTINUITY",
      continuityLegendLabel: "連続性グラフ凡例",
      legendReceived: "received",
      legendMissing: "missing",
      continuityCanvasLabel: "回収したserialを緑、欠損したserialを赤で示す横方向のタイムライン",
      continuityEmpty: "収録するとここに serial の連続性を表示します",
      continuityCaption: "serial {first} → {last} を {bins} 個のbinに集約（1bin ≒ {perBin} serial）。欠損の正確な番号は下の欠損rangeを参照してください。",
      missingRangesLabel: "欠損range",
      missingRangesMore: "… ほか {count} 区間",
      missingRangesNone: "なし",

      liveKicker: "FIFO BATCH",
      liveTitle: "届いているデータ・直近",
      liveLegendLabel: "生データグラフ凡例",
      liveCanvasLabel: "FIFOで回収した圧力合計の推移（デバイスごとに色分け）",
      liveEmpty: "収録を開始すると、数百msごとにまとめて（バッチで）データが届きます",
      liveBatches: "バッチ",
      liveBatchSize: "直近バッチ",
      liveBatchGap: "バッチ間隔",
      liveLag: "現在のlag",
      latestSampleTitle: "最新sample",
      latestSampleEmpty: "—",
      latestSampleQuatNote: "quat: FIFOには含まれません",

      deviceLabel: "INSOLE 0{n}",
      deviceLabelWithSide: "INSOLE 0{n} ({side})",
      sideLeft: "L",
      sideRight: "R",
      sideUnknown: "—",
      deviceNotUsed: "未使用",
      dualHint: "2台つなぐと同時収録します。片側だけ欠損が出ることがあるため、1台での結果と見比べてください。",
      sourceReadyDualTitle: "接続済み（{count}台）— 計測時間を選んで開始できます",
      sourceReadyDualDetail: "2台同時はホスト側の負荷が上がり欠損しやすくなります。まず1台で基準を取ってから比べてください。",
      cautionDualLoad: "2台同時収録での結果です。片側だけに欠損が出た場合、まず同じ条件の1台収録と比べてください（ホストのBluetooth負荷で欠損することがあります）。",
      cautionSameSide: "2台が同じ装着位置（{side}）として認識されています。実機の mount position を確認してください。",
      resultEyebrow: "AFTER STOP AND DRAIN",
      resultTitle: "収録結果と欠損",
      resultDescription: "drain（未回収データの回収）が完了した時点の正式計測区間について集計します。CSVに保存されるのはこの区間だけです。",
      verdictWaiting: "未計測",
      verdictPass: "PASS / 欠損なし",
      verdictWarn: "WARN / 欠損なし（注意あり）",
      verdictFail: "FAIL / 欠損あり",
      resultSummaryWaiting: "まだ収録していません。上の操作パネルから収録を開始してください。",
      resultSummaryPass: "この収録区間では欠損は検出されませんでした（missing と dropped がどちらも 0）。",
      resultSummaryWarn: "欠損は検出されませんでしたが、注意事項があります（下記）。",
      resultSummaryFail: "欠損が発生しました。timeline と欠損range、保存したCSVの中身を確認してください。",

      tableHeaderMetric: "項目",
      tableHeaderMeaning: "意味",
      m_duration: "計測時間",
      m_duration_note: "startMeasurement から stopMeasurement まで",
      m_samples: "FIFO samples",
      m_samples_note: "CSVの行数。1 serial = 4行",
      m_first: "最初のserial",
      m_first_note: "収録区間の先頭 device serial",
      m_last: "最後のserial",
      m_last_note: "収録区間の末尾 device serial",
      m_expected: "expected serial数",
      m_expected_note: "先頭〜末尾の間に本来あるべき serial 数",
      m_received: "received serial数",
      m_received_note: "実際に回収できた serial 数（重複は1つ）",
      m_missing: "missing serial数",
      m_missing_note: "expected − received。CSVに存在しない serial",
      m_missing_rate: "missing rate",
      m_missing_rate_note: "missing ÷ expected",
      m_span: "収録スパン",
      m_span_note: "CSVが実際に覆う時間 = 収録serial数 × 20 ms。停止時点で未要求だった分は含まれない",
      m_dropped: "dropped",
      m_dropped_note: "収録中に回復不能と判定された累計。missing とは別指標",
      m_drain_recovered: "drain recovered",
      m_drain_note: "停止後の回収で埋まった serial 数",
      m_drain_ms: "drain時間",
      m_drain_ms_note: "停止から回収完了・Realtime復帰までの時間。drainTimeoutMs(5000ms)＋モード復帰分",
      m_max_lag: "最大lag",
      m_max_lag_note: "未取得 serial の最大値 / 上限 1500。上限に近づくと危険",
      m_csv: "CSV保存",
      m_csv_note: "正式計測区間のみを保存できるか。2台のときは device_id 列で1ファイルにまとめる",
      valueEmpty: "—",
      csvAvailable: "可",
      csvUnavailable: "不可（sampleなし）",

      lastUpdateHtml: '<i class="bi bi-broadcast"></i> 最終更新',
      scopeNote: '<strong>「30秒以内なら絶対に無欠損」ではありません。</strong> 端末内バッファは約30秒分ですが、回収が生成に追いつかなければ30秒以内でも古いデータが上書きされ、回復不能な欠損になります。逆に30秒を超えても追いつけていれば欠損しません。<br><strong><code>dropped</code> と <code>missing</code> は別指標です。</strong> <code>dropped</code> は収録中に回復不能と判定された累計イベント数、<code>missing</code> は最終CSV区間で足りなかった serial 数で、数え方が違うため一致しないことがあります。<strong>両方が 0 のときだけ「欠損なし」</strong>と判断してください。',
      resultFootnote: "CSVは正式計測区間（開始〜drain完了）のsampleだけを含みます。1 serial packet は4フレーム（5ms間隔）なのでCSVでは1 serial = 4行になります。欠損を数えるときは行数ではなく serial 番号の連続性を見てください。timelineは数千serialでもDOM要素を作らず、Canvasに固定数のbinへ集約して描画します。",
      cautionsTitle: "注意",
      cautionTruncated: "sample数の上限 {max} に達したため、後半のsampleが記録されていません（CSVも同様）。",
      cautionShortSpan: "CSVが覆うのは約{spanSeconds}秒です（予定 {plannedSeconds}秒 の {percent}%）。不足する約{shortfallSerials} serialは、主に停止時点で端末内に残っていた未要求分（停止時のlag）です。drainは「要求済みで届いていない分」の回収なので、未要求の新規サンプルは取りに行きません。欠損（missing）ではなく末尾が短いだけです。",
      cautionOverBuffer: "計測 {seconds} 秒は端末内バッファの目安 {window} 秒を超えています。回収が追いつかないと古いデータが上書きされます。",
      cautionLagHigh: "追従遅れの最大値 {maxLag} が上限 {capacity} の {percent}% に達しました。この先は欠損の危険域です。",
      cautionLagOverCapacity: "追従遅れの最大値 {maxLag} が上限 {capacity} を超えました。FWバッファが上書きされ、回復不能な欠損が発生しています。",
      cautionDroppedExceedsSpan: "dropped（{dropped}）が収録スパンの serial 数（{expected}）を超えています。再同期のたびに未回収バックログを再計上するため、dropped は「イベントの累計」で件数が膨らみます。実際にCSVから抜けた数は missing を見てください。",
      cautionUnknown: "詳細不明の注意が発生しました。",
      cautionDroppedMismatch: "dropped（{dropped}）と最終CSV区間の missing（{missing}）は数え方が違うため一致しないことがあります。合否は両方が 0 かどうかで判断してください。",

      explainEyebrow: "WHY FIFO",
      explainTitle: "RealtimeとFIFOの違い",
      realtimeCardTitle: "Realtime（垂れ流し / push）",
      realtimeCardBody: "<li>INSOLEが計測したデータをそのまま次々に送ります</li><li>遅延がとても小さく、可視化やインタラクションに向きます</li><li>クォータニオン（姿勢）も取得できます</li><li><b>電波で取りこぼしたデータは戻ってきません</b></li>",
      fifoCardTitle: "FIFO（いったん貯める / pull）",
      fifoCardBody: "<li>計測データをINSOLE本体にいったん保存します</li><li>PC側が「serial番号 ○番から○個ください」と指定して取り出します</li><li>通信が一時的に遅れても<b>届かなかったserialを再要求</b>して埋められます</li><li>停止後も残りを<b>drain（回収）</b>してから記録完了になります</li><li>まとめて届くので画面はカクカク更新されます</li><li><b>quaternionは含まれません。</b>現行FWでは<b>Step Analysisと同時に取得できません</b>（順番に使います）</li>",
      bufferCardTitle: "端末内バッファ 約30秒の根拠",
      bufferCardIntro: "推測値ではなく、SDK実装の定数からの換算です。",
      bufferCardOutro: "30秒以内の短時間計測は計測区間の全体をバッファに保持しやすく、安定した記録に向いています。長時間計測では必ず欠損表示とCSVの中身を確認してください。",

      howEyebrow: "HOW IT WORKS",
      howTitle: "このexampleが使う Toolkit の設定プログラム",
      howNote: "FIFOのプロトコル（serial指定・再要求・drain）は <code>src/InsoleFifo.js</code> と <code>src/InsoleToolkit.js</code> が担当します。アプリ側で実装する必要はありません。",

      logEyebrow: "EVENT LOG",
      logTitle: "イベントログ",
      logDescription: "収録の経過・欠損・CSV照合の結果を記録します。環境情報つきでコピーできます。",
      copyLogHtml: '<i class="bi bi-clipboard"></i> ログをコピー',
      copyLogDone: "コピーしました（{count}行）",
      copyLogFailed: "コピーできませんでした",
      clearLogHtml: '<i class="bi bi-eraser"></i> クリア',

      footerNote: "このページは研究・開発用のexampleです。医療機器ではなく、診断・治療・予防を目的としません。Web Bluetooth 対応ブラウザ（Chrome / Edge）で https または localhost から開いてください。",

      logPageReady: "ページを読み込みました。ORPHE INSOLE を1台または2台接続してください。",
      logConnectedDevice: "{device} に接続しました。計測時間を選んで「収録開始」を押してください。",
      logDisconnectedDevice: "{device} が切断されました。",
      logDisconnectedWhileRecording: "{device} が収録中に切断されました。このデバイスの収録は完了扱いになりません。",
      logChooserCancelled: "デバイス選択をキャンセルしました。",
      logNotConnected: "まず INSOLE を1台以上接続してください。",
      logPreparing: "FIFO収録を準備します（予定 {seconds} 秒 / {count}台）。読み取りモードをFIFOへ切り替え、バッファを消去します。",
      logPreparingDual: "FIFO収録を準備します（予定 {seconds} 秒 / {count}台同時）。2台同時はホスト負荷が上がるため欠損しやすくなります。",
      logStarted: "FIFO収録を開始しました（{count}台）。データは数百msごとにまとめて届きます。",
      logStoppedByDuration: "予定時間になったので停止しました。端末内に残っているデータを回収（drain）しています…",
      logStoppedManually: "停止しました。端末内に残っているデータを回収（drain）しています…",
      logStartFailedDevice: "{device} の収録を開始できませんでした: {message}",
      logStopFailedDevice: "{device} の停止処理でエラーが発生しました: {message}",
      logNoResultDevice: "{device} の収録結果を取得できませんでした。",
      logFifoStoppedDevice: "{device} FIFO停止: collected={collected} dropped={dropped} drainRecovered={recovered}",
      logDataLossDevice: "{device} 回復不能な欠損: {dropped} serial（累計 {cumulative}）reason={reason}",
      logReRequestDevice: "{device} 再要求: expected {expected} / received {received} / no-data {noData}",
      logCsvMatched: "一致",
      logCsvMismatched: "不一致",
      logSdkMismatch: "SDK集計 missing={sdk} と再計算 missing={recomputed} が一致しません（表示は再計算値）。",
      logCsvCrossCheckDevice: "{device} CSV照合: expected={expected} received={received} missing={missing}（画面表示と{verdict}）",
      logResultOverall: "RESULT(全体) {label} devices={count} planned={seconds}s",
      logResultDevice: "{device} RESULT {label} duration={seconds}s samples={samples} serial={received}/{expected} missing={missing} dropped={dropped} drainRecovered={recovered} drainMs={drainMs} maxLag={maxLag}",
      logCsvSaved: "FIFO CSV を保存しました（正式計測区間のみ / 1 serial = 4行）。",
      logJsonSaved: "結果JSON を保存しました。",
      logErrorDevice: "{device} エラー: {message}",
      logStopAfterDisconnect: "切断後の計測終了処理: {message}"
    },
    en: {
      metaTitle: "ORPHE INSOLE FIFO Recording + Loss Check",
      metaDescription: "A beginner-oriented example for ORPHE INSOLE FIFO buffered recording with one or two devices: how it differs from Realtime, the ~30 s device buffer, and how to read serial continuity and loss on real hardware.",
      backLabel: "Back to Examples",
      languageLabel: "Language",
      toolkitLabel: "Connect ORPHE INSOLE",
      eyebrow: "TOOLKIT EXAMPLE / FIFO RECORDING",
      leadCopy: "Connect one or two ORPHE INSOLE devices, record through the FIFO device buffer, then check serial continuity per device before exporting CSV.",

      controlsLabel: "Data source and controls",
      sourceConnectTitle: "Connect your INSOLE",
      sourceConnectDetail: "Use the switches beside the title. You can record with one device or with two at once.",
      sourceReadyTitle: "Connected — pick a duration and start",
      sourceReadyDetail: "Try 10 s, then 30 s, then 60 s to see what the buffer limit does.",
      sourcePreparingTitle: "Preparing FIFO",
      sourcePreparingDetail: "Switching the read mode to FIFO and clearing the device buffer (a few seconds).",
      sourceRecordingTitle: "Recording",
      sourceRecordingDetail: "Keep this tab open, keep the machine awake, and stay within 1–2 m of the insole.",
      sourceDrainingTitle: "Draining",
      sourceDrainingDetail: "Recording stopped. Recovering the samples still held on the device. Please wait.",
      sourceDrainingProgress: "{collected} serials recovered / {lag} outstanding",
      sourceDoneTitle: "Recording complete",
      sourceDoneDetail: "Review the result, then export CSV or JSON.",
      sourceDisconnectedTitle: "INSOLE disconnected",
      sourceDisconnectedDetail: "Toggle the connection switch again. A recording interrupted by a disconnect is not treated as complete.",
      sourceErrorTitle: "Error",
      toolkitLoadErrorTitle: "Unable to load InsoleToolkit",
      toolkitLoadErrorDetail: "Check the loading order of ORPHE-INSOLE.js, InsoleFifo.js, and InsoleToolkit.js.",

      durationLabel: "Duration",
      durationCustomLabel: "sec",
      duration10: "10 s (start here)",
      duration30: "30 s (recommended maximum)",
      duration60: "60 s (over buffer — see the limit)",
      durationCustom: "Custom (enter seconds)",
      recordStartHtml: '<i class="bi bi-record-circle"></i> Start recording',
      recordStopHtml: '<i class="bi bi-stop-fill"></i> Stop recording',
      csvHtml: '<i class="bi bi-download"></i> FIFO CSV',
      jsonHtml: '<i class="bi bi-filetype-json"></i> Result JSON',

      settingsGuide: '<strong>To use FIFO recording, open the gear icon in the Toolkit UI and use these settings.</strong><p><span>Data Outputs: turn on <b>Raw Sensor Data</b>, keep <b>Step Analysis</b> off</span><span>Raw Data Acquisition: <b>FIFO</b></span><span>Realtime Streaming Format: unused by FIFO (no quaternion)</span><span class="settings-guide-default">This demo program switches to the <code>fifo-recording</code> profile when recording starts and restores Realtime after it stops.</span></p>',

      bufferLabel: "Duration versus device buffer",
      bufferKicker: "DEVICE BUFFER ≈ 30 s",
      bufferTitle: "Elapsed",
      bufferScaleZero: "0s",
      bufferScaleWindow: "30s (recommended max)",
      bufferScaleMax: "60s+",
      bufferWithinWindow: "Recommended: {seconds} s ≈ {packets} serials (fits the ~{window} s device buffer)",
      bufferOverWindow: "Caution: {seconds} s ≈ {packets} serials (beyond the ~{window} s buffer — loss is possible if polling falls behind)",
      bufferNote: "This band indicates how easily a run fits the buffer. A run under 30 s can still lose data if recovery stalls, and a run over 30 s stays lossless while recovery keeps up.",

      graphsLabel: "Recording visualization",
      continuityKicker: "SERIAL CONTINUITY",
      continuityLegendLabel: "Continuity chart legend",
      legendReceived: "received",
      legendMissing: "missing",
      continuityCanvasLabel: "Horizontal timeline showing recovered serials in green and missing serials in red",
      continuityEmpty: "Serial continuity appears here after a recording",
      continuityCaption: "Serials {first} → {last} aggregated into {bins} bins (about {perBin} serials per bin). Exact numbers are listed as missing ranges below.",
      missingRangesLabel: "Missing ranges",
      missingRangesMore: "… and {count} more ranges",
      missingRangesNone: "none",

      liveKicker: "FIFO BATCH",
      liveTitle: "Incoming data · recent",
      liveLegendLabel: "Raw data chart legend",
      liveCanvasLabel: "Pressure total recovered through FIFO, one colour per device",
      liveEmpty: "Once recording starts, data arrives in bursts every few hundred milliseconds",
      liveBatches: "Batches",
      liveBatchSize: "Last batch",
      liveBatchGap: "Batch interval",
      liveLag: "Current lag",
      latestSampleTitle: "Latest sample",
      latestSampleEmpty: "—",
      latestSampleQuatNote: "quat: not included in FIFO",

      deviceLabel: "INSOLE 0{n}",
      deviceLabelWithSide: "INSOLE 0{n} ({side})",
      sideLeft: "L",
      sideRight: "R",
      sideUnknown: "—",
      deviceNotUsed: "not used",
      dualHint: "Connect two devices to record both at once. Loss can appear on only one side, so compare against a single-device run.",
      sourceReadyDualTitle: "Connected ({count} devices) — pick a duration and start",
      sourceReadyDualDetail: "Two devices increase host load and make loss more likely. Take a single-device baseline first, then compare.",
      cautionDualLoad: "This run used two devices at once. If loss appeared on only one side, first compare it with a single-device run under the same conditions (host Bluetooth load can cause loss).",
      cautionSameSide: "Both devices report the same mount position ({side}). Check the mount position stored on each device.",
      resultEyebrow: "AFTER STOP AND DRAIN",
      resultTitle: "Recording result and loss",
      resultDescription: "Metrics cover the formal measurement window as of drain completion. Only that window is written to CSV.",
      verdictWaiting: "No recording yet",
      verdictPass: "PASS / no loss",
      verdictWarn: "WARN / no loss (with cautions)",
      verdictFail: "FAIL / loss detected",
      resultSummaryWaiting: "No recording yet. Start one from the control panel above.",
      resultSummaryPass: "No loss was detected in this window (both missing and dropped are 0).",
      resultSummaryWarn: "No loss was detected, but there are cautions (below).",
      resultSummaryFail: "Loss occurred. Check the timeline, the missing ranges, and the exported CSV.",

      tableHeaderMetric: "Metric",
      tableHeaderMeaning: "Meaning",
      m_duration: "Duration",
      m_duration_note: "From startMeasurement to stopMeasurement",
      m_samples: "FIFO samples",
      m_samples_note: "CSV rows. One serial is four rows",
      m_first: "First serial",
      m_first_note: "First device serial in the window",
      m_last: "Last serial",
      m_last_note: "Last device serial in the window",
      m_expected: "Expected serials",
      m_expected_note: "Serials that should exist between first and last",
      m_received: "Received serials",
      m_received_note: "Serials actually recovered (duplicates counted once)",
      m_missing: "Missing serials",
      m_missing_note: "expected − received. Serials absent from the CSV",
      m_missing_rate: "Missing rate",
      m_missing_rate_note: "missing ÷ expected",
      m_span: "Recorded span",
      m_span_note: "Time actually covered by the CSV = recorded serials × 20 ms. Serials not yet requested at stop are excluded",
      m_dropped: "Dropped",
      m_dropped_note: "Cumulative unrecoverable-loss events during the run. A different metric from missing",
      m_drain_recovered: "Drain recovered",
      m_drain_note: "Serials filled in by post-stop recovery",
      m_drain_ms: "Drain time",
      m_drain_ms_note: "Time from stop through drain completion and the Realtime restore. Covers drainTimeoutMs (5000 ms) plus the mode switch",
      m_max_lag: "Max lag",
      m_max_lag_note: "Peak outstanding serials / limit 1500. Risky as it approaches the limit",
      m_csv: "CSV export",
      m_csv_note: "Whether the formal window can be exported. Two devices are combined into one file with a device_id column",
      valueEmpty: "—",
      csvAvailable: "available",
      csvUnavailable: "unavailable (no samples)",

      lastUpdateHtml: '<i class="bi bi-broadcast"></i> Last update',
      scopeNote: '<strong>“Under 30 s” is not a guarantee of zero loss.</strong> The device buffer holds about 30 seconds, but if recovery cannot keep up with acquisition, older data is overwritten and lost even within 30 seconds. Conversely, a run longer than 30 seconds stays lossless while recovery keeps up.<br><strong><code>dropped</code> and <code>missing</code> are different metrics.</strong> <code>dropped</code> counts unrecoverable-loss events during the run; <code>missing</code> counts serials absent from the final CSV window. They are counted differently and need not agree. <strong>Treat a run as lossless only when both are 0.</strong>',
      resultFootnote: "The CSV contains only samples from the formal window (start through drain completion). One FIFO serial packet holds four frames at 5 ms, so one serial is four CSV rows. Count loss from serial continuity, not from row counts. The timeline creates no per-serial DOM nodes: it aggregates into a fixed number of Canvas bins.",
      cautionsTitle: "Cautions",
      cautionTruncated: "The sample limit of {max} was reached, so later samples are not recorded (nor exported).",
      cautionShortSpan: "The CSV covers about {spanSeconds} s ({percent}% of the planned {plannedSeconds} s). The roughly {shortfallSerials} missing serials are mostly the backlog still unrequested when recording stopped (the lag at stop). Drain recovers requested-but-undelivered serials, not newly generated ones, so this is a shorter tail rather than loss (missing).",
      cautionOverBuffer: "The {seconds} s run exceeds the ~{window} s device buffer. Older data is overwritten when recovery cannot keep up.",
      cautionLagHigh: "Peak lag {maxLag} reached {percent}% of the {capacity} limit. Beyond this point loss becomes likely.",
      cautionLagOverCapacity: "Peak lag {maxLag} exceeded the {capacity} limit, so the firmware buffer was overwritten and data was lost unrecoverably.",
      cautionDroppedExceedsSpan: "dropped ({dropped}) exceeds the number of serials in the recorded span ({expected}). Each resync re-counts the outstanding backlog, so dropped inflates as an event tally. Use missing for the number of serials actually absent from the CSV.",
      cautionUnknown: "An unspecified caution was raised.",
      cautionDroppedMismatch: "dropped ({dropped}) and the final window's missing ({missing}) are counted differently and need not agree. Judge the run by whether both are 0.",

      explainEyebrow: "WHY FIFO",
      explainTitle: "Realtime versus FIFO",
      realtimeCardTitle: "Realtime (push)",
      realtimeCardBody: "<li>The insole streams each sample as it is measured</li><li>Very low latency; good for visualization and interaction</li><li>Quaternion (orientation) is available</li><li><b>Packets lost over the air are gone for good</b></li>",
      fifoCardTitle: "FIFO (buffer first, pull)",
      fifoCardBody: "<li>Samples are stored inside the insole first</li><li>The host asks for “N samples starting at serial X”</li><li>If the link stalls, <b>missing serials are requested again</b></li><li>After stop, the remainder is <b>drained</b> before the recording completes</li><li>Data arrives in bursts, so the display updates in steps</li><li><b>No quaternion.</b> On the current firmware it <b>cannot run together with Step Analysis</b> (use them sequentially)</li>",
      bufferCardTitle: "Where the ~30 s buffer comes from",
      bufferCardIntro: "Not a guess — it is derived from constants in the SDK implementation.",
      bufferCardOutro: "A run under 30 s keeps the whole window inside the device buffer, which suits stable recording. For longer runs, always check the loss metrics and the exported CSV.",

      howEyebrow: "HOW IT WORKS",
      howTitle: "Toolkit setup used by this example",
      howNote: "The FIFO protocol (serial-addressed requests, re-requests, drain) lives in <code>src/InsoleFifo.js</code> and <code>src/InsoleToolkit.js</code>. Application code does not implement it.",

      logEyebrow: "EVENT LOG",
      logTitle: "Event log",
      logDescription: "Records recording progress, loss events, and the CSV cross-check. Copy includes environment details.",
      copyLogHtml: '<i class="bi bi-clipboard"></i> Copy log',
      copyLogDone: "Copied ({count} lines)",
      copyLogFailed: "Copy failed",
      clearLogHtml: '<i class="bi bi-eraser"></i> Clear',

      footerNote: "This example is for research and development. It is not a medical device and is not intended for diagnosis, treatment, or prevention. Open it from https or localhost in a Web Bluetooth browser (Chrome / Edge).",

      logPageReady: "Page loaded. Connect one or two ORPHE INSOLE devices.",
      logConnectedDevice: "{device} connected. Pick a duration and press Start recording.",
      logDisconnectedDevice: "{device} disconnected.",
      logDisconnectedWhileRecording: "{device} disconnected while recording. That run is not treated as complete.",
      logChooserCancelled: "Device selection cancelled.",
      logNotConnected: "Connect at least one INSOLE first.",
      logPreparing: "Preparing FIFO recording ({seconds} s planned, {count} device(s)). Switching the read mode to FIFO and clearing the buffer.",
      logPreparingDual: "Preparing FIFO recording ({seconds} s planned, {count} devices at once). Two devices raise host load and make loss more likely.",
      logStarted: "FIFO recording started ({count} device(s)). Data arrives in bursts every few hundred milliseconds.",
      logStoppedByDuration: "Reached the planned duration and stopped. Draining the samples still on the device…",
      logStoppedManually: "Stopped. Draining the samples still on the device…",
      logStartFailedDevice: "Could not start the recording on {device}: {message}",
      logStopFailedDevice: "The stop sequence on {device} reported an error: {message}",
      logNoResultDevice: "Could not obtain a recording result for {device}.",
      logFifoStoppedDevice: "{device} FIFO stopped: collected={collected} dropped={dropped} drainRecovered={recovered}",
      logDataLossDevice: "{device} unrecoverable loss: {dropped} serials (cumulative {cumulative}) reason={reason}",
      logReRequestDevice: "{device} re-request: expected {expected} / received {received} / no-data {noData}",
      logCsvMatched: "matches",
      logCsvMismatched: "does not match",
      logSdkMismatch: "SDK missing={sdk} differs from recomputed missing={recomputed} (the recomputed value is displayed).",
      logCsvCrossCheckDevice: "{device} CSV cross-check: expected={expected} received={received} missing={missing} ({verdict} the on-screen value)",
      logResultOverall: "RESULT(overall) {label} devices={count} planned={seconds}s",
      logResultDevice: "{device} RESULT {label} duration={seconds}s samples={samples} serial={received}/{expected} missing={missing} dropped={dropped} drainRecovered={recovered} drainMs={drainMs} maxLag={maxLag}",
      logCsvSaved: "Saved the FIFO CSV (formal window only; one serial is four rows).",
      logJsonSaved: "Saved the result JSON.",
      logErrorDevice: "{device} error: {message}",
      logStopAfterDisconnect: "Closing the measurement after disconnect: {message}"
    }
  };

  let currentLanguage = "ja";

  function detectDefaultLanguage(timeZone, browserLanguage) {
    if (timeZone) return timeZone === "Asia/Tokyo" ? "ja" : "en";
    return String(browserLanguage || "").toLowerCase().startsWith("ja") ? "ja" : "en";
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
      root.dispatchEvent(new root.CustomEvent("fifo-guide:languagechange", {
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
