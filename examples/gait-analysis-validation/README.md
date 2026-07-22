# Gait Analysis Validation

PR #50 の修正案ブランチ `codex/pr50-gait-lifecycle-fix` を、Mac + Chrome/Edge + ORPHE INSOLE 1足（左右2台）で検証する専用ページです。

## 起動

リポジトリのルートでHTTPサーバーを起動します。

```bash
python3 -m http.server 8040
```

Chromeで次を開きます。

```text
http://localhost:8040/examples/gait-analysis-validation/
```

`file://` で直接開かないでください。Web Bluetoothにはsecure contextが必要で、`localhost` は例外的に許可されます。

## 推奨手順（約10分）

1. ページ上部の8件の実装セルフテストがすべてPASSすることを確認します。FAILは電波や実機ではなく、実装側の問題です。
2. INSOLE 1、INSOLE 2を接続し、mountが `L` と `R` の1台ずつになることを確認します。
3. 「2 cycles × 3秒」を実行し、各デバイス・各cycleがPASSすることを確認します。
4. 距離を測った直線コース（推奨5〜10m）を用意します。
5. 計測時間、コース距離、開始カウントダウンを入力します。INSOLEを履いて静止します。
6. 「カウントダウンして開始」を押し、開始音の後に自然な速度で直線歩行します。終了音までMacへ戻る必要はありません。
7. 判定表を確認します。必要なら手動で数えた総歩数を入力し「入力値で再判定」を押します。
8. JSON、歩容rows CSV、raw 20-byte CSV、PR用Markdownを保存します。

## 判定の読み方

- `FAIL`: バイト解釈、独立デコーダ一致、派生式、重複行、停止動作など、実装側の厳密ゲートに不一致があります。
- `WARN`: BLE取りこぼし、左右差、広い歩行レンジ、実測距離との差など、環境・歩き方でも変わる項目です。
- `PASS`: このページで検査した条件に一致しました。臨床的妥当性を意味しません。

`cadence_hz` は片足のstride周期（`1 / (stance + swing)`）で、一般的な左右合計のsteps/minとは異なります。両足合計の目安へ直す場合は概ね `2 × cadence_hz × 60` です。

停止直前・直後にはFW由来の停止アーティファクトが出ることがあります。rawとCSVには残し、歩行レンジの集計だけ既定で各足の末尾1行を除外します。

`segment distance` は、最初と最後の解析対象rowに含まれるFW累積距離の差です。開始・終了端の歩幅を含まないため、特に歩数の少ない試行では実測コースより小さく出ることがあります。

## 60秒・再接続チェック

ページの「60秒テストを開始」を使い、INSOLEを電波範囲外へ移動してから戻します。戻った後に数歩歩き、次の3項目がすべて増えればPASSです。

- `press`（SENSOR_VALUES）
- `raw`（STEP_ANALYSIS通知）
- `rows`（overview / stride / pronationが揃った完成歩）

切断イベントが記録されない、再接続成功イベントがない、またはpressだけ再開してraw/rowsが増えない場合はFAILです。

このテストページでは1回のGATT接続待ちを8秒、再試行間隔を2秒、最大10回に制限し、2回目以降のattemptログに直前の接続エラーを表示します。切断中に`gait.stop()`が5秒以上完了しなくても、captureを確定してJSON/CSVの保存へ進みます。自動再接続のtransportが一度も成功しない場合は、この修正案の再購読処理まで到達していないため、イベントログとJSONを保存してください。

## 保存データ

- JSON: 判定、統計、raw hex、デコード済みパケット、集約行。
- rows CSV: SDKの21列 + device/side/host受信時刻。
- raw CSV: 20-byte hex、header/subheader/step、独立デコーダとの不一致フィールド。
- Markdown: PRコメントへ貼れる要約。

Bluetooth device IDとdevice nameはエクスポートしません。公開前には必ず内容を確認してください。
