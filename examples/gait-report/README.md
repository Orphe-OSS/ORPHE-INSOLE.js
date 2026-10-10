# Gait Report

ORPHE INSOLE の **Step Analysis**（`OrpheInsoleGait` / Toolkit `realtime-full-step`）から
1歩ごとの歩容パラメータを受け取り、**「記録開始」→ 1歩ごとにレポートがライブ更新 →
左右それぞれ20歩そろった時点で平均±SDのレポートとして確定**する計測セッション型のexampleです。

歩行分析ツールが出力する「レポート」の形を、ORPHE INSOLE だけで1ページで体験できます。

- **歩行の基本量**（両足）: 歩行速度 / ケイデンス / ストライド長 / 歩行周期 / 立脚期割合 — 平均±SD・n数・参考レンジ
- **時間的ばらつき**: 歩行周期の変動係数（CV%）を左右別に表示
- **左右比較**: ストライド長・立脚時間・遊脚時間・プロネーション角・着地衝撃の左右平均±SDと左右差（%）
- **接地の分類内訳**: foot strike（ヒール/ミッドフット/フォアフット）と pronation type の歩数内訳を左右別に表示
- 「印刷」でレポートカードだけをA4に印刷できます
- 「CSV保存」で記録した歩を1歩1行の CSV として保存できます（後述）
- **効果音**: 記録開始（2音）・1歩ごと（左＝低い音、右＝高い音）・レポート完成（3音）で鳴ります。
  「効果音 ON/OFF」ボタンで切り替え、設定はブラウザ（localStorage）に保存されます。`sound.js`（Web Audio、音声ファイル不要）
- **CG（Reference gait animation）**: 計測中は直近の歩に追従し、左右20歩が確定した後は
  **そのレポートと同じ平均値を再現し続けます**（以降の歩は反映せず、「記録開始」「クリア」で解除）

## このexampleがやらないこと（設計方針）

- **判定・採点をしません。** 正常範囲は年齢・身長・歩行速度・計測条件で変わるため、
  平均±SD・左右差・分布の提示にとどめ、参考レンジは「目安」として表示するだけです。
- FWが未確定値（`-1` 等）を返した歩は、該当パラメータを欠損として集計から除外します
  （`report.js` の `finite` / `positive`）。
- 歩隔・単脚支持率・両脚支持率など Step Analysis に含まれない量は扱いません。

## 計測フロー

1. タイトル横のスイッチから INSOLE を接続します（1台でも2台でも可）。
2. 「記録開始」を押して歩きます。1歩（1 gait cycle）ごとにレポートが更新されます。
3. 左右それぞれ **20歩** そろうと `COMPLETE` になり、平均±SDで確定します。
4. 「もう一度計測」でセッションをやり直せます。

- 片足1台だけ接続している場合は、その足の20歩で確定します（左右差は表示されません）。
- 2台接続時は左右そろって20歩ずつ集まるまで計測が続きます。
- 左右は `device_information.mount_position` の bit0 から判定します（デバイス番号からの推測はしません）。

### CSV 保存

「CSV保存」は、記録中・確定後を問わず **その時点で記録されている歩** を1歩1行で書き出します
（1歩でも記録されると有効になります）。ファイル名は記録開始時刻から `gait-report_YYYYMMDD-HHMMSS.csv`。

| 列 | 内容 |
|---|---|
| `side` | `left` / `right`（mount_position から判定した足） |
| `device_id` | Toolkit のデバイス番号（0 / 1）。デモ再生の行は空 |
| `fw_version` | そのデバイスの FW バージョン（`getFirmwareVersion()`: DIS 0x180A → advertisement の順）。FW 版で pitch/roll の入れ替わりや Step Analysis 非対応などの既知差があるため必ず残す。取得できない FW/環境とデモ再生の行は空 |
| `sdk_version` | row を生成した ORPHE-INSOLE.js の版（`OrpheInsole.SDK_VERSION`、package.json の version と同じ）。gyro 換算や `-1` sentinel の扱いなどデコード規則の差異を後から追うため |
| `recorded_at` | ブラウザが row を受信した時刻。**ISO 8601 の UTC（末尾 `Z`、例 `2026-09-16T10:45:37.118Z`）**。ローカル時刻は使わない |
| `source` | `live`（実機）/ `demo`（合成データ） |
| `step_number` 〜 `calorie` | [`src/InsoleGait.js`](../../src/InsoleGait.js) の CSV と同じ21列・同じ順（`OrpheInsoleGait.CSV_HEADER`） |

- 左右の行は受信時刻の昇順にマージされます（左右2台の時系列を1本で追えます）。
- 数値は SDK の CSV と同じ書式（整数はそのまま、小数は4桁）。FW の未確定値（`-1`）や欠損（空欄）は
  **そのまま**出力し、レポート側の除外規則は適用しません（生データとして扱うため）。
- フットクリアランス（遊脚中の足の最大/最小高さ）は Step Analysis の通知に含まれないため列にありません。
  `stride_z_m` は **前の接地点から次の接地点までの高低差**（階段などで変化）で、クリアランスではありません。

実機がない場合は、「デモ再生」ボタン（または `?demo=1`）で**合成歩行データのデモ**を再生でき、
約20秒でレポートが完成するところまで確認できます。

### `?verify=0` — FW疎通デバッグモード

Step Analysis の通知が来ないデバイス（例: `GAIT_NO_NOTIFICATIONS` で接続がロールバックされる）を
切り分けるための診断モードです。Toolkit の liveness 検証を外して接続を維持するので、
`insoleToolkitSessions[0].snapshot().gaitDiagnostics` の `transportNotifications` を見れば
「FWが一切 publish していない（0のまま）」か「遅れて届く」かを確認できます。
通常利用では付けないでください（通知が来ない状態でも接続が維持されてしまいます）。
FWバージョンの確認方法と既知の未対応FWは [docs/TROUBLESHOOTING.md](../../docs/TROUBLESHOOTING.md) の 3b を参照。

## Toolkit UI の設定

- Data Outputs: `Raw Sensor Data` と `Step Analysis` をON
- Raw Data Acquisition: `Realtime`
- Realtime Streaming Format: `4: gyro + acc + press + quat (100Hz)`

このデモプログラムでは初期設定で上記の設定となっています。

## このexampleが使う公開API

```js
buildInsoleToolkit(toolkit, "INSOLE 01", 0, {
  profile: "realtime-full-step",
  gait: {
    onGait(deviceId, row) {
      // 記録中だけ集計し、左右20歩そろったら平均±SDで確定
      recorder.addStep(deviceId, row);
    }
  }
});
insoles[0].setup();   // 必須（buildInsoleToolkit は setup() を呼びません）
```

| 参照先 | 役割 |
|---|---|
| [`src/InsoleGait.js`](../../src/InsoleGait.js) | Step Analysis characteristic の購読と1歩ごとの row 集約 |
| [`src/InsoleToolkit.js`](../../src/InsoleToolkit.js) | 接続UI、`realtime-full-step` プロファイル、通知livenessの検証 |
| [`./report.js`](./report.js) | 集計ロジック（平均±SD・CV・左右差・分布・確定判定）と CSV 生成（`buildRowsCsv`）。純関数のみで Node からテスト可能 |
| [`./i18n.js`](./i18n.js) | ja / en の表示文言（step-analysis と同じ仕組み） |

集計の仕様:

- 1歩 = 1 gait cycle（同側の接地から次の同側接地まで）。ケイデンスは `120 ÷ 歩行周期` の steps/min 換算。
- SD は不偏標準偏差（n−1）。n=1 のときは `—` を表示します。
- 左右差(%) = `(左平均 − 右平均) ÷ 両側平均 × 100`（正 = 左が大きい）。
- CV(%) = 歩行周期の `SD ÷ 平均 × 100`。左右別に算出します。

### 参考レンジの根拠

`report.js` の `REFERENCE_RANGES`（歩行速度 1.2–1.6 m/s、ケイデンス 100–120 steps/min、ストライド長 1.2–1.5 m、
歩行周期 1.0–1.2 s、立脚期割合 58–65 %、周期 CV 2.5 % 未満）は、**健常成人が平地を快適速度で
連続歩行したとき**の代表値を丸めた目安です。

- Perry J, Burnfield JM. *Gait Analysis: Normal and Pathological Function*, 2nd ed. (2010) — 自由歩行の代表値:
  速度 約1.37 m/s（82 m/min）、ケイデンス 113 steps/min、ストライド長 1.41 m、歩行周期 1.06 s、立脚期 約62 %
- Bohannon RW. Comfortable and maximum walking speed of adults aged 20–79 years. *Age Ageing* 1997;26:15–19 —
  快適歩行速度の年代別平均は 1.27–1.46 m/s

注意点:

- 年齢・身長・靴・床面で変わるため、レンジ外＝異常ではありません（ページ上でも判定には使いません）。
- このレポートは **記録した20歩をすべて**集計します。室内の短い距離で歩き出し・折り返し・停止が含まれると、
  平均速度・ストライド長は連続歩行より低く、周期の CV は高く出ます。参考レンジと比べるときは、
  10 m 以上の直線を一定の速さで歩いた区間で記録してください。
- 数値は FW（Step Analysis）が算出したものです。SDK 側でスケールは変えていません。

## 起動

Web Bluetooth には localhost または HTTPS が必要です。

```bash
cd ORPHE-INSOLE.js
python3 -m http.server 8080
```

Chrome / Edge で `http://localhost:8080/examples/gait-report/` を開きます。
Firefox / Safari は Web Bluetooth 非対応です。

ヘッダーの `JA` / `EN`、または `?lang=ja` / `?lang=en` で言語を切り替えられます。

## テスト

```bash
node tests/gait-report-stats.test.js
node tests/gait-report-csv.test.js
node --check examples/gait-report/app.js
```

## 実機テスト

1. INSOLE を1台接続し、「記録開始」→ 20歩以上歩く → `COMPLETE` になることを確認します。
2. レポートの歩数が `20 歩` で止まり、以降の歩で値が変わらないことを確認します。
3. 「もう一度計測」で進捗が 0/20 に戻り、再度計測できることを確認します。
4. 2台接続し、左右それぞれ 20/20 になるまで計測が続くことを確認します。
5. 切断 → 自動再接続後も Step Analysis が再開し、計測が続行できることを確認します。

> このページは研究・開発用のexampleです。医療機器ではなく、診断・治療・予防を目的としません。
