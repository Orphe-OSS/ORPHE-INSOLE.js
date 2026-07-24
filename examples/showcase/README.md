# ORPHE INSOLE — Showcase

ORPHE INSOLE の**製品紹介・データ理解・SDKの使い方が1ページで完結する**ショーケースアプリです。

- 製品スペックとセンサ構成、購入・お問い合わせ導線（ORPHE STORE / 製品ページ）
- 圧力6ch × 左右（足型ヒートマップ + 圧力中心 CoP + チャート）
- IMU × 左右（加速度[G]・ジャイロ[deg/s]チャート）
- クォータニオン → 左右の3D靴モデルの姿勢表示（ORPHE-CORE.js examples/VIEW から移植）
- 各データを取得する最小コードスニペット
- データのCSV記録と、記録したCSVのデモ再生
- **ロスレス収録（FIFO）**: FWバッファから欠損なくデータを回収し、参照実装互換CSVで保存（`OrpheInsoleFifo`）

**左右最大2台**の同時接続に対応しています（1台でも動作します）。mount_position による L/R 自動判定で、
画面内のパネルと3Dモデルが実際の足に合わせて並び替わります。

実機が無くても**合成歩行データ（左右2足分）のデモ再生**で全ビジュアルが動きます。INSOLE を接続するとヘッダのバッジが
DEMO → LIVE に切り替わり、すべての図がライブデータで動きます。

## 起動方法

3DモデルのSTLを fetch で読み込むため、`file://` ではなく HTTP サーバ経由で開いてください。

```bash
# リポジトリルートで
npx serve .
# → http://localhost:3000/examples/showcase/ を Chrome で開く
```

接続はページ上部のトグルスイッチから。トグル横の<i>ギアアイコン</i>では、
Realtime Sensor Values / Step Analysis（同時取得可）、Sensor Values の Realtime / FIFO、
Realtime Streaming Format（1/3/4）を切り替えられます。現行FWではFIFO RawとStep Analysisは
同時取得できないため、FIFOはRaw単独で使用します。Step AnalysisはRealtime Rawとの同時取得、
またはStep-onlyで使用できます（モードにより配信されないデータのセクションには注記が表示されます）。

「データ記録（CSV）」セクションの**ロスレス収録（FIFO）**は、通常のストリーミングと異なり
FWバッファから欠損なくデータを回収します（`read_sensor_data_by_tokoroten_loop` 相当）。収録開始で
リアルタイム配信が一時停止し、回収したデータで各可視化がライブ更新されます。CSVは参照実装互換
（`serial_number, timestamp, gyro[dps], acc[G], press1..6[N]`）。FIFOモードにクォータニオンは含まれません。
この記録カードとギア内の設定は同じ Toolkit セッションを操作するため、どちらから切り替えても競合しません。
記録カードからFIFOを開始するとStep Analysisを一時停止し、停止時のdrain後に直前のRealtime/Step設定を復元します。

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
| `app.js` | 接続配線・LIVE/DEMO切替・CSV記録・ロスレス収録(FIFO)・描画ループ |
| `viz-pressure.js` | 足型ヒートマップ + CoP + 6chチャート |
| `viz-imu.js` | 加速度・ジャイロチャート |
| `viz-3d.js` | p5.js + STL の姿勢3D表示（VIEW移植） |
| `demo-data.js` | 合成歩行データ生成（左右2足分） + CSVパーサ |
| `assets/models/*.stl` | 靴3Dモデル（ORPHE-CORE.js から流用） |
| `assets/*.png` | 足型画像（hula-motion-sonifier から流用） |
| `assets/thumbs/*.svg` | 「次のステップ」用サムネイル |
| `SPEC.md` | 企画書 / 仕様書 |
