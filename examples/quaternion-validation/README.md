# Quaternion Validation Console

ORPHE INSOLE v1.2.1 のクォータニオン・スケール修正を、左右実機で数値確認する専用ページです。
BLEデバイスの選択だけ手動で行い、接続後は次をページ内で集計します。

- quaternion norm の平均・標準偏差・最小・最大
- yaw のunwrap、範囲、線形ドリフト [deg/min]
- 受信サンプルレート、受信パケット数、欠損パケット数・欠損率
- 既知角度回転の実角度との差
- 周回歩行のquat yaw、生gyro_z積分、実周回角度の比較
- mode 3（200Hz）のacc/gyro/press受信とquat停止、mode 4への自動復帰
- JSON / Markdown数値レポート

統計は逐次計算するため、測定時間にかかわらずほぼ定数メモリです。
「生データをCSVへ逐次保存」を選んだ場合は、File System Access APIを使って約1秒ごとに選択ファイルへ追記し、全行をブラウザメモリへ保持しません。

## 起動

```bash
cd ORPHE-INSOLE.js
python3 -m http.server 8000
```

Chromeで次を開きます。

```text
http://localhost:8000/examples/quaternion-validation/
```

1. `DEVICE 0` と `DEVICE 1` から別々のINSOLEを選択
2. 両方がLIVEになると10秒スモークチェックが自動開始
3. 静置・回転・歩行・200Hz回帰を必要な順に実行
4. 最後にJSONまたはMarkdownレポートを保存

長時間静置ではMacのスリープを防止してください。

```bash
caffeinate -dimsu
```

## UI確認用シミュレータ

BLEなしでページの操作とレポート出力を確認できます。

```text
http://localhost:8000/examples/quaternion-validation/?sim=1
```

シミュレータ結果は実機検証値として使用しないでください。
