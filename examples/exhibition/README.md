# Exhibition Display — 展示用1画面ダッシュボード

ORPHE INSOLE のデモを **16:9 の1画面（スクロールなし）** で見せるための展示用ページです。
3列×2段で、画像を見せる左・中央を広く、テキスト主体の右を狭く配置しています。

|  | 上段 | 下段 |
|---|---|---|
| **左** | **PRESSURE**: 足型インソール上の 6ch 圧力（値が大きいほど赤）＋ 推定中心（CoP）＋ 各足のTOTAL | **TOTAL PRESSURE** ゲージ（合計 + 左右）と **6ch波形**（L/R） |
| **中央** | **ATTITUDE**: クォータニオンを適用した 3D シューズモデル（左右2台分） | **EULER**: pitch / roll / yaw の推移グラフ（L/R）と現在値 |
| **右** | **IMU**: 加速度 [G] / ジャイロ [deg/s]（左右それぞれ） | **STEP ANALYSIS**: 直近1歩と直近5歩平均 |

Step Analysis の項目は日英併記です。

| 表示 | 内容 |
|---|---|
| SPEED / 歩行速度 | `speed_mps`（m/s） |
| STANCE / 立脚期：遊脚期 | `stance_phase_s / duration_s` から求めた比（合計100%） |
| LANDING ZONE / 接地パターン | `foot_strike`（heelStrike / midfoot / forefoot）。平均列は直近5歩の最頻値 |
| PRONATION / プロネーション | `pronation_type` と `pronation_deg` |

実機が無い間は合成歩行データと合成の歩容結果をループ再生し、実機（左右最大2台）を接続すると
自動的に `LIVE` に切り替わります。**展示中に電源やBLEが切れても自動再接続**し、切れている間は
デモ再生に戻るので画面が止まりません。

## 使い方

Web Bluetooth は https または localhost が必須です。

```bash
cd ORPHE-INSOLE.js
npx http-server -p 8080
# → http://localhost:8080/examples/exhibition/
```

1. Chrome / Edge で開く（Firefox・Safari は非対応）
2. 右上の `01` / `02` のトグルで INSOLE を接続（1台でも動きます）
3. 右上の全画面ボタン（⛶）でブラウザのUIを隠す
4. 展示の直前に、インソールを水平に置いて姿勢の `↺`（リセット）を押すと基準が揃います

L/R は `device_information.mount_position` から自動判定し、左足のパネルが常に
画面の左（IMU・Stepは上）に来るよう並び替えます。

### Step Analysis は接続後に有効化する

接続時に Realtime Raw と Step Analysis を同時要求すると、STEP通知を出さないFW個体では
`connect()` 自体が失敗し、展示中にライブ表示ごと落ちてしまいます。このページは
**Rawだけで接続を確立してから Step Analysis を追加**します（`enableStepAnalysisWhenReady`）。
失敗してもセッションが Realtime Raw のみへロールバックするため他のパネルは動き続け、
Step パネルの右上にエラーコード（`GAIT_NO_NOTIFICATIONS` など）が出ます。

### pitch / roll 入れ替え（SWAP P/R）

FW・IMU実装によって pitch と roll の割り当てが入れ替わる個体があります（つま先を上げると
CGが横倒しに動く）。ヘッダの `SWAP P/R` で切り替えられます。**FW 202605 の実機では ON が
正しい**ことを確認済みのため、このページの既定は **ON** です（showcase の既定は OFF）。
変換の実体は [`../showcase/viz-3d.js`](../showcase/viz-3d.js) の `SWAP_R`（センサ座標系を
Z軸回り -90° 回す相似変換）で、**3DモデルとEulerの数値・グラフの両方**に同じ変換が掛かります。

## 実装メモ

- 可視化は showcase のモジュールをそのまま再利用しています
  （[`viz-pressure.js`](../showcase/viz-pressure.js) / [`viz-imu.js`](../showcase/viz-imu.js) /
  [`viz-3d.js`](../showcase/viz-3d.js) / [`demo-data.js`](../showcase/demo-data.js)）。
  このページの [`app.js`](./app.js) は接続・フレーム組み立て・デモ再生・描画ループと、
  Euler/Step の展示用表示だけを持ちます。
- STLモデルの場所は `window.ORPHE_SHOE_MODEL_BASE`、3Dの寄りは `window.ORPHE_ATTITUDE_ZOOM`
  で上書きしています（どちらも未指定なら showcase 既定）。靴が見切れる場合はズーム値で調整します。
- 足型マップの実寸は JS（`fitFootmaps`）が枠を実測して決めます。CSSの `flex` + `aspect-ratio`
  だけでは横にはみ出し、逆にスロット幅を内容依存にすると「幅↔マップ寸法」が循環して潰れるため、
  スロットは `flex: 1 1 0` で等分し、その枠に収まる最大サイズを px で与えています。
  センサドットは要素サイズに対する % 配置なので、比率を崩さないことが必須です。
- レイアウトは高さ基準（`vh` + CSS Grid の `fr`）で、フォント・ドット・ゲージも画面高に追従します。
  チャートは `maintainAspectRatio: false` + 絶対配置キャンバスで親の高さに収めています。
- 描画は約25fps にスロットリング（チャート8枚＋3Dのため showcase より控えめ）。
  高頻度コールバックはバッファに溜め、描画ループでまとめて反映します（CLAUDE.md Pattern 5）。
- ストリーミングモードは **4**（press + acc + gyro + quat / 100Hz）。この画面は全データを使います。

## 免責

本サンプルは医療機器ではなく、疾病の診断・治療・予防を目的としていません。
