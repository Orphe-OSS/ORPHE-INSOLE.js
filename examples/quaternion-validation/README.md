# Sensor Validation & Diagnostics

ORPHE INSOLE v1.2.1以降のクォータニオンと通信品質を、左右実機で数値確認する専用ページです。
BLEデバイスの選択だけ手動で行い、接続後は次をページ内で集計します。

- quaternion norm の平均・標準偏差・最小・最大
- yaw のunwrap、範囲、線形ドリフト、線形トレンド除去後の残差 [deg]
- gyro_z の平均、標準偏差、60秒換算バイアス、固定周期積分とhost時間積分
- 受信sample/packet/BLEレート、欠損パケット数・率、欠損イベント数、最大連続欠損、packet到着間隔
- 接続枠を左右逆にした2回の通信診断から、欠損が実物側・DEVICE枠のどちらに追従するかを比較
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
3. 60秒通信診断を実行
4. いったん切断し、L/RをDEVICE 0/1の逆の枠へ接続して通信診断を再実行
5. 自動表示されるA/B比較を確認後、静置・回転・歩行・200Hz回帰を実行
6. 最後にJSONまたはMarkdownレポートを保存

通信診断では、欠損率1%以下をPASS、1%超〜5%以下をWARN、5%超をFAILとして扱います。通信品質はyawドリフトとは別に評価し、静置yawがゼロであることは合格条件にしていません。

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
