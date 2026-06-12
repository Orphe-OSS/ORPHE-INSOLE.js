# ORPHE INSOLE — Showcase

ORPHE INSOLE の**製品紹介・データ理解・SDKの使い方が1ページで完結する**ショーケースアプリです。

- 製品スペックとセンサ構成、ORPHE CORE との違い
- 圧力6ch（足型ヒートマップ + 圧力中心 CoP + チャート）
- IMU（加速度[G]・ジャイロ[deg/s]チャート）
- クォータニオン → 3D靴モデルの姿勢表示（ORPHE-CORE.js examples/VIEW から移植）
- 各データを取得する最小コードスニペット
- データのCSV記録と、記録したCSVのデモ再生

実機が無くても**合成歩行データのデモ再生**で全ビジュアルが動きます。INSOLE を接続するとヘッダのバッジが
DEMO → LIVE に切り替わり、すべての図がライブデータで動きます。

## 起動方法

3DモデルのSTLを fetch で読み込むため、`file://` ではなく HTTP サーバ経由で開いてください。

```bash
# リポジトリルートで
npx serve .
# → http://localhost:3000/examples/showcase/ を Chrome で開く
```

接続はページ上部のトグルスイッチから。ストリーミングモード（1/3/4）はトグル横の
<i>ギアアイコン</i>から切り替えられます（モードにより配信されないデータのセクションには注記が表示されます）。

## デモ用歩行データの差し替え

初期状態のデモは `demo-data.js` の合成データです。実機データに差し替えるには:

1. INSOLE を接続し、「データ記録」セクションで記録開始 → 歩行 → 記録停止 → CSV保存
2. 「CSVを読み込んでデモ再生」で動作確認
3. 恒久的に差し替える場合は、保存したCSVの内容で `DemoData.generate()` の代わりに
   `DemoData.parseCSV()` を使うよう `app.js` を変更（またはCSVを同梱して fetch）

## 対応ブラウザ

- 接続 + 閲覧: Chrome / Edge / Opera（Web Bluetooth API が必要）
- 閲覧のみ（デモ再生）: 上記に加えて Firefox / Safari でも可

## ファイル構成

| ファイル | 役割 |
|---|---|
| `index.html` | セクション構造・説明文・スニペット |
| `app.js` | 接続配線・LIVE/DEMO切替・CSV記録・描画ループ |
| `viz-pressure.js` | 足型ヒートマップ + CoP + 6chチャート |
| `viz-imu.js` | 加速度・ジャイロチャート |
| `viz-3d.js` | p5.js + STL の姿勢3D表示（VIEW移植） |
| `demo-data.js` | 合成歩行データ生成 + CSVパーサ |
| `assets/models/*.stl` | 靴3Dモデル（ORPHE-CORE.js から流用） |
| `assets/*.png` | 足型画像（hula-motion-sonifier から流用） |
| `SPEC.md` | 企画書 / 仕様書 |
