# おいしいうどんを作ろう！— UDON (ORPHE INSOLE Edition)

**足踏みをゲームにした example** です。ORPHE INSOLE の 6ch 圧力と IMU から
「足上げ → 踏み込み」の2段判定で “ふみふみ” を検出し、うどんの生地をこねる
ゲームとして遊べます。1歩ごとに強度・左右バランス・ペースを評価して表示します。

イベント駆動の判定（Pattern 1 の接地検出）と、**キャリブレーション不要な相対しきい値**
の作り方を見るためのサンプルでもあります。

- 元プロジェクト: `UDON_fsr_20250724`（iOS 計測サーバ + 4ch FSR）の ORPHE INSOLE 移植版
- ストリーミング: `profile: "realtime-pressure"`（**mode 3** = gyro + acc + press / 200Hz）
- 台数: INSOLE ×1 でも遊べます（2台つなぐと左右バランスの評価が出ます）
- 実機なし: **デモモード内蔵**（未接続の間は合成データを自動再生）

## 使い方

Web Bluetooth は https または localhost が必須です。

```bash
cd ORPHE-INSOLE.js
npx http-server -p 8080
# → http://localhost:8080/examples/udon/
```

1. Chrome / Edge で開く（Firefox・Safari は非対応）
2. タイトル横の `INSOLE 01` / `INSOLE 02` のトグルで接続（1台でもよい）
3. 導入アニメーションのあと `START` を押し、**その場で足踏み**する
4. 30歩（`MAX_STEP`）で「もちもち度」100% になり完成画面へ。待たずに終えるときは右下の `GOAL`
5. 画面右下のアイコンでフルスクリーン（`Esc` で戻る）

Toolkit の歯車で設定する場合は Data Outputs: **Raw Sensor Data** / Raw Data Acquisition:
**Realtime** / Realtime Streaming Format: **3: gyro + acc + press (200Hz)** です。
ページ側で `profile: "realtime-pressure"` を渡しているので、既定でこの状態になります。

JA / EN 切替、BGM の ON/OFF、リセットはヘッダの各ボタンから行えます。

## 踏み込みの判定

**絶対値でしきい値を置かない**ことがこの example の要点です。ORPHE INSOLE の圧力は
6ch の ADC 生値で、無負荷でも 1ch あたり約 220 のオフセットが乗ります
（実機 `00000161`/left で合計 約1358）。絶対値でしきい値を置くと個体差・装着差で
まるごと外れるため、ここでは

```text
delta = 6ch合計 − 無負荷ベースライン（直近4秒の合計圧力の最小値）
```

で判定します。ベースライン（`floor`）は 500ms バケットで自動追従するので、
**起動時のキャリブレーションが不要**です（`updateFloor()`）。

判定は2段階です。

| 段 | 使うデータ | 条件（既定値） |
|---|---|---|
| 足上げ | `gotConvertedAcc` / `gotConvertedGyro` | 荷重が抜けている（`delta < 100`）状態で、**動きを検出**（`\|accY\| > 0.3G` または `\|accZ − 1G\| > 0.3` または `\|gyro\| > 50 deg/s`）**または直前まで荷重していた** |
| 踏み込み | `gotPress` | 足上げ状態から `delta > 150` に復帰（同じ足は 500ms のクールダウン）。足上げが 2000ms を超えると成立させずに解除 |

強度の配点では足上げ時間 100〜2000ms を有効とし、500ms を最適として評価します。

1歩の強度は無次元スコアで、`足上げの大きさ × 踏み込みの増分 × タイミング` の加重和です
（`calculateStepIntensity()`）。`TOO WEAK / WEAK / GOOD / EXCELLENT / PERFECT` の5段階に分類します。

> **強度は無次元の指標です。** 圧力は ADC 生値の合計なので体重・装着具合で絶対値が変わります。
> 個人内での変化を見る用途に向き、個人間の比較や絶対評価には使えません。

同じ足の連続検出は 500ms のクールダウンで抑制し、左右は
`device_information.mount_position` から自動判定します（`resolveDeviceSide()`）。

## しきい値の調整

ページ下部の CALIBRATION セクションで主要なしきい値をライブに変更できます。

- **プリセット**: 標準 / 軽い踏み込み / しっかり踏み込み
- **ライブ表示**: 無負荷ベースライン・いまの増分・直近1歩の増分・直近1歩の足上げ
- **増分メーター**: 荷重が抜けた判定 / 踏み込み成立 / 踏み込み満点 の位置を目視できます

変更内容は `localStorage`（`udon-tuning-v1`）に保存され、次回の読み込みで復元されます。
コードから直接いじる場合は [`app.js`](./app.js) の `THRESHOLDS` を編集してください。

## CSV（しきい値設計用）

しきい値を実機ログから決めるために、2種類のログを出力できます。

| CSV | 記録タイミング | 内容 |
|---|---|---|
| `udon-events-*.csv` | 常時（最大20,000件） | 1歩ごと・状態遷移ごとのイベント（`intensity` / `evaluation` / `liftDuration` / `deltaPressure` など） |
| `udon-frames-*.csv` | 「生データ記録」ON の間だけ（最大240,000行 ≒ 200Hz×2台で約10分） | 全フレームの acc / gyro / 6ch圧力 / `totalPressure` / `floorPressure` / `deltaPressure` / `isLifted` |

`CSV` ボタンで両方まとめて保存します。DevTools から `window.udonDebug` で
内部状態（`gamepar`・ログ・しきい値）を直接確認できます。

## デモモード

センサ未接続のあいだは合成データ（50Hz）を自動再生します。強度がばらつくよう
足上げ加速度と圧力ピークをパターン化しているので、評価の5段階がひととおり出ます。
**実機を接続すると自動でデモを停止**し、統計もリセットしてから `START` を出します。

## 音声素材について

`soundA.ogg` / `soundB.ogg`（BGM）と `pipi.wav` / `puni.wav`（効果音）を同梱しています。
いずれも外部素材で、同梱・再配布可能なライセンスであることを確認して収録しています。
音声は p5.sound の `loadSound()` で読み込み、読み込みに失敗しても
ゲーム自体は無音で動作します（`onAudioError`）。

## 免責

本サンプルは医療機器ではなく、疾病の診断・治療・予防を目的としていません。
