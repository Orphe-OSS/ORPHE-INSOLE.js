# Step Analysis + RAW Data

`InsoleToolkit.js` の `realtime-full-step` profile を使い、左右の
ORPHE INSOLE から届く Step Analysis の完成行と Realtime Raw を同時表示するexampleです。
歩行速度・歩幅の直近10歩と、Realtime Raw の直近10秒をコンパクトな上下グラフで確認できます。
ヘッダーの `JA` / `EN` で、静的な説明、接続状態、表、グラフ内ラベルを切り替えられます。
URLの `?lang=en` でも英語表示を直接開けます。

## Toolkit UI の設定

Step Analysis + RAW Data を使いたいときは、Toolkit UI の歯車を開き、
次のように設定してください。

- Data Outputs: `Raw Sensor Data` と `Step Analysis` をON
- Raw Data Acquisition: `Realtime`
- Realtime Streaming Format: `4: gyro + acc + press + quat (100Hz)`

このデモプログラムでは初期設定で上記の設定となっています。

## 表示する値

- 大きな値: 最新1歩
- 小さな値: 直近10歩の平均 ± 標本標準偏差
- 折れ線グラフ: 左右それぞれの直近10歩の歩行速度と歩幅
- 生データグラフ: 左右の圧力合計・加速度・ジャイロの直近10秒
- `通知`: Step Analysis の完成行に含まれる値
- `算出`: 通知値から画面側で算出した値
- `推定`: ストライド長の半分として表示する歩幅
- `分類`: SDKの角度しきい値による分類

ケイデンスは片足の歩行周期に左右2歩が含まれるものとして
`120 / duration_s`、立脚期・遊脚期は各時間を `duration_s` で割って算出します。

現行の Step Analysis 通知だけでは歩隔、単脚支持率、両脚支持率を直接得られないため、
このexampleでは値を補いません。正常範囲の判定も行いません。

## 起動

Web Bluetooth には localhost または HTTPS が必要です。

```bash
cd ORPHE-INSOLE.js
python3 -m http.server 8080
```

Chrome / Edge で次を開きます。

```text
http://localhost:8080/examples/step-analysis/
```

実機なしの表示確認は画面の「デモ再生」、または次のURLを使います。

```text
http://localhost:8080/examples/step-analysis/?demo=1
```

## 実機テスト

1. タイトル横の `INSOLE 01` / `INSOLE 02` をONにして左右を接続します。
2. Toolkit は `Realtime Format 4 + Step Analysis` を開始します。
3. 数歩歩き、表ヘッダーの左右の steps が増えることを確認します。
4. 表の該当する足の列が1歩ごとに点灯し、Step推移グラフとその直下の Raw グラフが更新されることを確認します。
5. 装着位置が逆の場合は実機の `mount_position` を確認します。

Raw グラフだけ動いて steps が増えない場合は Toolkit の歯車で
`Step Analysis` が有効か確認してください。Raw受信開始から8秒以上
`STEP_ANALYSIS` が0件の場合、ページ上部は `CHECK` 表示になります。
歩行後も0件なら、実機ファームウェアと Step Analysis 出力を確認してください。

Realtime + Step はライブアプリ向けです。無欠損の Raw 記録には Step を併用せず、
Toolkit の FIFO Raw profile を使います。

## テスト

```bash
node examples/step-analysis/test-step-analysis.mjs
node --check examples/step-analysis/app.js
```
