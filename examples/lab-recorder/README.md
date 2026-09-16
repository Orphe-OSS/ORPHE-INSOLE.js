# Lab Recorder — 同期と来歴のための収録ページ（実験的・公開未定）

> **状態**: 実験的な example です。公開（landing page / sitemap への掲載）は未定で、
> 明示的に決めるまでカードには載せません。`<meta name="robots" content="noindex">` を付けています。

歩行を計測する研究室が、被験者と試行を替えながら1日に何十試行も回す運用を想定した
**収録機**です。ロスレス収録そのものは差別化にならないので、狙いは次の2点に絞っています。

1. **同期** — 他の計測系（モーションキャプチャ、床振動計など）と後から時間軸を揃えられる
2. **来歴** — どのFW・どのSDK・どの時刻源で記録したかを、CSV / JSON から追える

`examples/fifo-guide/` は「なぜFIFOか・ロスがないことをどう確かめるか」を SDK 評価者に教えるページで、
目的が違うため別ページにしています（fifo-guide は変更していません）。

## 機能

| # | 機能 | 実装の要点 |
|---|---|---|
| 1 | **同期イベントマーカー**（中核） | 大きな MARK ボタン / Space キー。ホスト時刻（ISO 8601・ミリ秒・TZ オフセット付き）、収録開始からの経過 ms、その時点の直近 serial、任意ラベル。収録中は何度でも。停止後に各デバイスの最近傍サンプル（serial / packet / sample_index / residual）へ突き合わせ、CSV / JSON に書き出す |
| 2 | **踏み込みインパルスの自動検出** | 収録開始後 N 秒（既定 10 s、1〜120 s で変更可）の \|acc\| 最大サンプルを候補として提示。`pending / accepted / rejected` を人が選ぶ。**自動確定はしない** |
| 3 | **セッションのメタデータ** | participant_id / trial_number / condition / surface / footwear / notes（すべて任意）。localStorage に保持し次回の既定値に。trial_number は保存時に自動 +1（`T03 → T04` も対応） |
| 4 | **CSV の来歴列** | `device_id, side, firmware_version, sdk_version, sample_index, serial_number, packet_number, device_time_ms, host_time_est, host_time_est_ms, host_rx_ms, elapsed_ms, sampling_rate_hz, gyro_*_dps, acc_*_g, press_1..6_adc`（単位は列名に含める）。冒頭に `# key: value` のメタデータ行と時刻源の注記 |
| 5 | **データ辞書** | `orphe-lab-recorder_data-dictionary.md`。列名・単位・定義・取りうる値・欠損時の表現、読み込みヒント（pandas `comment='#'` / MATLAB `CommentStyle`） |
| 6 | **欠損レポート** | `expected / received / missing / missing_rate / dropped / max_lag / missing_ranges / drain_recovered / catchup_recovered / measured_rate_hz / truncated / complete`。試行 JSON に内包し、単独 JSON でも保存可 |
| 7 | **試行の連続実行** | 「保存して次へ」でサンプル CSV・マーカー CSV・試行 JSON を保存し、メタデータを引き継いで次の試行へ。セッション内の試行一覧（要約）を画面に持ち、`*_trials.csv` / セッション JSON で書き出し |
| 8 | **左右2台のアライメント表示** | 収録開始からの serial の進みの差（packets ≈ ms 換算）と端末時刻差をライブ表示 |

### やらないこと

- 歩容指標の算出・スコアリング・判定（収録と検証に徹する）
- クラウド送信・アカウント・ログイン（すべてブラウザ内）
- 未検証の導出値。特に **フットクリアランス**は FW が内部計算しても BLE パケットに載っておらず、近似実装は精度未検証なので出さない

### FIFO の制約（ページ上にも明記）

FIFO モードでは **Step Analysis を同時に使えず、クォータニオン（姿勢）も出力されません**。
ジャイロ・加速度・6ch 圧力のみです。姿勢・歩容の列が無いのは仕様です。

## 時刻の扱い（解析者向け）

| 列 | 意味 |
|---|---|
| `device_time_ms` | FW の時刻カウンタ（パケット基準の HH:MM:SS.mmm）＋ `packet_number × 1000/208` ms。日跨ぎで 0 に戻るので試行内で単調増加になるよう unwrap 済み。壁時計とは同期していない |
| `host_rx_ms` | そのサンプルを含む FIFO バッチがホストに**到着した**時刻（epoch ms）。FIFO はプル型で数百 ms 遅れるため真の時刻の上界 |
| `host_time_est` / `host_time_est_ms` | `device_time_ms + offset`。offset は「バッチ到着時刻 − バッチ内の最新端末時刻」の**最小値**（最小遅延法）。ヘッダ行 `device_N_clock_offset_ms` に記録 |
| `elapsed_ms` | `host_time_est_ms − recording_start_host_ms`。マーカーの `elapsed_ms` と同じ時間軸 |
| `device_N_clock_drift_ppm` | offset の端末時刻に対する回帰の傾き。短い試行では回収ジッタが支配的なので**参考値** |

左右2台の端末時計はそれぞれ独立に写像されるため、`host_time_est` 同士を比べれば左右のずれ、
`host_rx_ms − host_time_est_ms` を見れば写像の妥当性を後から検証できます。
真の同期が必要な場面では、**マーカー**（他の計測系にも見える瞬間）と**踏み込みインパルス**
（ジオフォンとインソール双方に鋭いピークが立つ）を使ってください。

## ファイル

```
examples/lab-recorder/
├── index.html         # 2カラム作業画面（左: メタデータ・試行一覧 / 右: 収録・MARK・ライブ・候補・結果）
├── style.css
├── i18n.js            # LabRecorderI18n（ja / en、?lang= と端末言語・TZ による既定）
├── recorder-core.js   # LabRecorderCore（純関数。時刻付け・突き合わせ・連続性・CSV/JSON/辞書生成）
├── app.js             # Toolkit セッション（startMeasurement / stopMeasurement）を呼ぶ UI
└── README.md
tests/lab-recorder-core.test.js   # Node 単体テスト（npm test に含まれる）
```

FIFO のプロトコル（読み取りモード切替・serial 指定の再要求・drain）は
`src/InsoleFifo.js` / `src/InsoleToolkit.js` にあり、このページは呼ぶだけです。

## 使い方

1. ローカルで配信して Chrome / Edge で開く（Web Bluetooth は https または localhost 必須）
   ```bash
   npx http-server -p 8080
   # → http://localhost:8080/examples/lab-recorder/?lang=en
   ```
2. タイトル横のスイッチで INSOLE を1台または2台接続（Toolkit 歯車の設定変更は不要）
3. 左パネルでメタデータを入力（空でも可）→「収録開始」
4. 被験者に開始直後、踵で強く踏み込んでもらう。Vicon 録画開始などの瞬間に **MARK / Space**
5. 「停止」→ drain 完了後、インパルス候補を**採用 / 却下**、欠損レポートを確認
6. 「保存して次へ」で `*_samples.csv` / `*_markers.csv` / `*_trial.json` を保存し、次の試行へ
   （ブラウザが「複数ファイルのダウンロード」の許可を求めたら許可する）
7. セッションの最後に「試行一覧 CSV」「データ辞書 (.md)」を保存して解析者へ渡す

保存済み試行のサンプル本体はブラウザ内に残しません（一覧には要約だけ）。
再ダウンロードが必要なら、保存前に各ボタンで個別に落としてください。

## 出力ファイル

| ファイル | 内容 |
|---|---|
| `orphe-lab_<participant>_T<trial>_<condition>_<YYYYMMDD-HHMMSS>_samples.csv` | 1 フレーム 1 行。`#` メタデータ行 → 列ヘッダ → データ（device_id → sample_index 順） |
| `..._markers.csv` | 1 マーカー 1 行。`device_N_last_received_serial` / `device_N_aligned_serial` / `..._aligned_sample_index` / `..._aligned_device_time_ms` / `..._alignment_residual_ms` |
| `..._trial.json` | メタデータ・時刻源・環境・デバイス来歴（FW / clock 写像 / インパルス候補と判断）・マーカー・欠損レポート |
| `..._loss-report.json` | 欠損レポートのみ（Methods にそのまま書ける機械可読形） |
| `orphe-lab-session_<participant>_<time>_trials.csv` / `.json` | セッション内の試行一覧（要約） |
| `orphe-lab-recorder_data-dictionary.md` | データ辞書 |

## テスト

```bash
npm test          # tests/lab-recorder-core.test.js を含む
npm run lint
```

テストは、SDK 定数（IMU ODR 208 Hz）との整合、日跨ぎ unwrap、uint16 wraparound、
最小遅延クロック写像、窓内インパルス検出、最近傍突き合わせ、CSV の列数・単位・欠損表現、
`expected = received + missing` の不変条件、データ辞書が全列を説明していること、
ja / en のキー一致、index.html / app.js が参照する i18n キーの存在、
そして app.js が FIFO を SDK 経由で使い歩容指標を扱わないことを検証します。

---

## English summary

Lab Recorder is an **experimental, not-yet-published** example for gait labs that run dozens of trials a day.
It reuses the SDK's FIFO session API (`startMeasurement({ profile: "fifo-recording" })` / `stopMeasurement()`) and adds
what lossless capture alone does not give a lab: **sync event markers** (MARK / Space; host time with ms and timezone,
elapsed ms, newest serial, label, matched to the nearest sample after stop), **stomp impulse detection** (candidate only,
operator accepts or rejects), **trial metadata**, **provenance columns** (`firmware_version`, `sdk_version`, `device_time_ms`,
`host_time_est` via a min-latency clock mapping, `host_rx_ms`, units in column names), a **data dictionary**, a machine-readable
**loss report**, a **save-and-next** trial flow with a session list, and a live **left/right alignment** readout.
It computes no gait metrics and exports no unverified derived values (foot clearance in particular).
FIFO mode excludes Step Analysis and quaternions; the page says so.
