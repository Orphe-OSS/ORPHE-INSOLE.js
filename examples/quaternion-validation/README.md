# Sensor Validation & Diagnostics

ORPHE INSOLE v1.2.1以降のクォータニオンと通信品質を、左右実機で数値確認する専用ページです。
BLEデバイスの選択だけ手動で行い、接続後は次をページ内で集計します。

- quaternion norm の平均・標準偏差・最小・最大
- quaternionをページ内で正規化してZYX Eulerへ変換（外部のQuaternionグローバルに依存しない）
- yaw のunwrap、範囲、線形ドリフト、線形トレンド除去後の残差 [deg]
- gyro_z の平均、標準偏差、60秒換算バイアス、固定周期・host時間・デバイス時間での積分、各時計の積分をyawから差し引いた残留ドリフト
- 60秒以上の静置結果について、yawドリフトがgyro_z平均で説明可能か、yaw/gyro比、5分窓で時間変動しているか、または説明不足かを分類
- 初回5分のyawドリフトまたはgyro_z平均を固定補正値にした場合、その後の5分窓に残る最大ドリフトを比較（診断のみ。SDKのyawには適用しない）
- 受信sample/packetレート、欠損パケット数・率、欠損イベント数、最大連続欠損、packet到着間隔、2台の同期gap率（±25ms）
- 単体ベースラインと接続条件を変えた3回の通信診断から、欠損が実物側・DEVICE枠・接続順のどれに追従するかを比較
- 既知角度回転に対するquaternion yawとデバイス時計gyro積分の誤差（gyro物理スケールをその場で確認）
- 周回歩行のquat yaw、生gyro_z積分、実周回角度の比較
- mode 3（200Hz）のacc/gyro/press受信とquat停止、mode 4への自動復帰
- JSON / Markdown数値レポート

統計は逐次計算するため、測定時間にかかわらずほぼ定数メモリです。
静置ドリフトの5分窓は最大24時間分に制限し、各窓は集計値だけを保持します。
「生データをCSVへ逐次保存」を選んだ場合は、File System Access APIを使って約1秒ごとに選択ファイルへ追記し、全行をブラウザメモリへ保持しません。
途中で一方が切断した場合は、実行時間に対する最終受信時刻のcompletion、切断イベントから積算したconnection coverage、実際に受信していた区間のsample/packet rateを別々に保存します。両方が切断したまま10秒経過すると部分測定として自動終了します。

## 起動

```bash
cd ORPHE-INSOLE.js
python3 -m http.server 8000
```

Chromeで次を開きます。

```text
http://localhost:8000/examples/quaternion-validation/
```

1. 受信処理は既定の`軽量raw packet`を選ぶ（SDK標準callback経路との比較時だけ切り替える）
2. 任意で、片方だけを接続した60秒通信診断を左右それぞれ実行
3. A: `DEVICE 0=L`を先、`DEVICE 1=R`を後に接続して60秒通信診断
4. 全切断後、B: `DEVICE 0=R`を先、`DEVICE 1=L`を後に接続して60秒通信診断
5. 全切断後、C: Bと同じ割当で`DEVICE 1=L`を先、`DEVICE 0=R`を後に接続して60秒通信診断
6. 自動比較を確認後、静置・回転・歩行・200Hz回帰を実行
7. 最後にJSONまたはMarkdownレポートを保存

通信診断では、欠損率1%以下をPASS、1%超〜5%以下をWARN、5%超をFAILとして扱います。mode 3は200Hzの80%未満をFAIL、80%以上90%未満をWARNとし、通信欠損も合わせて判定します。静置テストの合否からはsample rateと欠損率を除外して数値だけを併記し、quaternion/Euler/測定時間とyawドリフト診断を通信品質から分離します。静置yawがゼロであることは合格条件にしていません。

`軽量raw packet`は、SDKの`gotData`経路で1通知を1回だけparseし、複数の表示用callbackとhistory更新を省きます。SDKの`gotBLEFrequency`は直近通知間隔から得る瞬間値であり、平均受信レートではないため、診断結果には使用しません。
加速度・ジャイロの物理単位換算には、接続時に取得したデバイスのrangeコードを使い、実際の物理レンジを接続ログへ残します。

周回歩行は、安全な屋内で開始位置と開始方向を決め、長方形などの閉じた経路を普通の速さで1周し、同じ位置・同じ向きへ戻って終了します。階段や混雑した場所は避け、通信欠損が高い間の歩行結果は参考値として扱ってください。

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
