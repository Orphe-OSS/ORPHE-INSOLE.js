# ORPHE INSOLE Examples

各サンプルの目的・必要機材・実機なしでの確認方法の一覧です。
迷ったら **VISUALIZE**（最小の可視化）→ **showcase**（全部入り）の順に見てください。

> **免責**: すべてのサンプルは医療機器ではなく、疾病の診断・治療・予防を目的としていません。

## マトリクス

| サンプル | 目的 | 必要機材 | 実機なし確認 | 主な実装パターン |
|---|---|---|---|---|
| [VISUALIZE](./VISUALIZE/) | 6chチャート+IMU可視化（推奨スターター） | INSOLE ×1 | ―（実機推奨） | rAF描画スロットリング |
| [fifo-guide](./fifo-guide/) | **FIFO収録の入門**（Realtimeとの違い・約30秒バッファ・欠損の見かた）＋2台同時の欠損比較 | INSOLE ×1〜2 | ―（実機が目的） | `fifo-recording` プロファイル、startMeasurement/stopMeasurement、デバイス別serial continuity、ja/en切替 |
| [fifo-vs-realtime](./fifo-vs-realtime/) | 通常(push)/FIFO(pull)の実測比較 | INSOLE ×1〜2 | ―（実機推奨） | 欠損率、シリアル連続性マップ、droppedCount照合 |
| [insole-core-combo](./insole-core-combo/) | **INSOLE ×2 + CORE ×1 の同時接続・同期CSV収録**（研究用計測ツール） | INSOLE ×2 + CORE ×1（各1台でも可） | ―（実機が目的） | `CoreCompanionToolkit`（CORE 1台の同居接続）、収録中のみ `fifo-recording` へ切替、PC時計基準の時刻同期と [REC, STOP] 窓トリム、`!loss` 欠損ライブ表示 |
| [showcase](./showcase/) | 製品紹介1ページ（LIVE/DEMO切替） | なしでも可 | **DEMOモード内蔵**（合成歩行+CSV再生） | i18n、CSV入出力、圧力ヒートマップ+CoP |
| [exhibition](./exhibition/) | **展示用一覧ページ**（16:9のディスプレイでセンサ値を一覧。圧力マップ+全体圧力ゲージ+IMU+姿勢3D/Euler+Step Analysis） | なしでも可 | **DEMOモード内蔵**（合成歩行・合成歩容をループ再生） | showcaseのvizモジュール再利用、vh基準のノースクロールレイアウト |
| [step-analysis](./step-analysis/) | 1歩ごとの歩容表 + Realtime Rawグラフ | INSOLE ×1〜2 | `?demo=1` またはデモ再生ボタン | `realtime-full-step`、左右自動割当、10歩統計 |
| [gait-report](./gait-report/) | **歩行レポート生成**（記録開始→1歩ごとにライブ更新→左右20歩で平均±SD確定） | INSOLE ×1〜2 | **デモモード内蔵**（自動再生・約20秒で完成） | `realtime-full-step`、計測セッション（進捗/確定）、左右差・CV・接地/プロネーション分布、判定なし方針、印刷用CSS、ja/en切替 |
| [sensor-dashboard](./sensor-dashboard/) | 2台同時ダッシュボード | INSOLE ×2 | ―（実機推奨） | L/R自動マッピング（mount_position） |
| [balance-sway](./balance-sway/) | 重心動揺の可視化（CoP軌跡・軌跡長・楕円面積） | INSOLE ×2 | デモ再生内蔵 | CoP計算、圧力検証、医療注意書き |
| [balance-tuner](./balance-tuner/) | 左右バランスの可聴化 | INSOLE ×2 | **デモモード内蔵**（既定でON） | Web Audio、荷重→音マッピング |
| [hula-motion-sonifier](./hula-motion-sonifier/) | フラダンス動作の検出と可聴化 | INSOLE ×2 | 一部（検出ロジックは Node テストあり） | 状態遷移発音、IMU+圧力の複合判定 |
| [music-shoe](./music-shoe/) | 手に持って演奏するジェスチャ楽器（+ [GESTURE LAB](./music-shoe/lab.html) でしきい値較正用CSV記録） | INSOLE ×1〜2 | クリック/キーボードで全音色を試奏可 | 向きゲート打撃検出、固定レイテンシスケジューラ（BLEジッタ対策）、ループ録音、加算残光ビジュアライザ |
| [udon](./udon/) | 足踏みでうどんの生地をこねるゲーム（1歩ごとの強度・左右バランス・ペース評価） | INSOLE ×1〜2 | **デモモード内蔵**（未接続の間は自動再生） | 足上げ(IMU)→踏み込み(圧力)の2段判定、自動追従ベースラインによるキャリブレーション不要な相対しきい値、しきい値ライブ調整（localStorage）、イベント/フレームCSV |
| [device-test](./device-test/) | **リリース前の実機チェックリスト** | INSOLE ×1 | ―（実機検証が目的） | 通知中read/write、モード切替、自動判定 |
| [quaternion-validation](./quaternion-validation/) | **quat修正の長時間実機検証** | INSOLE ×1〜2 | `?sim=1` | norm・yaw drift・欠損率、CSV逐次保存、数値レポート |
| [terminal](./terminal/) | 生データ（gotData）のデバッグ | INSOLE ×1 | ― | プロトコル解析 |

## FIFO（ロスレス収録）を使いたいとき

1. まず [fifo-guide](./fifo-guide/) で仕組みと限界（**端末内バッファ約30秒**）を確認しながら1台で試す
2. 同じページで2台同時収録もでき、デバイスごとの欠損を1台の基準と比較できる
   （2台同時はホストのBluetooth負荷が上がり片側だけ欠損することがある）
3. Realtime との実測比較は [fifo-vs-realtime](./fifo-vs-realtime/)
3. `dropped`（収録中の回復不能ロス累計）と最終CSVの `missing`（区間内の欠損serial数）は
   定義が違うため一致しないことがあります。**両方が 0 のときだけ「欠損なし」**と判断してください。

## 新しい example を作るとき（共通テンプレート）

[`step-analysis`](./step-analysis/) と [`fifo-guide`](./fifo-guide/) が現在の雛形です。
新規ページはこの構成・デザイン・セクション順に揃えてください。

1. `header.app-header` — 戻りリンク（`../../index.html#examples`）/ `JA`・`EN` 切替 /
   eyebrow（`TOOLKIT EXAMPLE / <MODE>`）/ h1 / **ヘッダ内に Toolkit スロット** / `lead-copy`
2. `.control-strip` — 状態バッジ（`WAITING` / `LIVE` 等）+ 現在の状態文 + 操作ボタン（`.button`）
3. `.settings-guide` — Toolkit 歯車で必要な設定と「このデモでは初期設定済み」の明記
4. `.graphs-section` — `.chart-card`（dark 背景 + Canvas）で可視化
5. `.result-section` — `.section-heading` + `.table-frame` + `.notify-strip` +
   **`.scope-note`（取得できない値・保証しないことの明示）** + `.chart-footnote`
6. `.how-section` — `.code-card` にこのページが実行している公開APIのコード
7. `<footer>` — 医療機器ではない旨の免責

- 文言は `i18n.js`（`data-i18n` / `data-i18n-html` / `data-i18n-aria-label`）で ja / en 両方用意し、
  `?lang=ja` / `?lang=en` と端末タイムゾーンによる既定を実装する
- 判定・数値ロジックは `metrics.js` / `continuity.js` のような純関数モジュールに分け、Node でテストする
- `buildInsoleToolkit()` の後に **`insoles[id].setup()` を必ず呼ぶ**（Toolkit は呼びません）
- サムネイルは `assets/images/thumbs/<name>.svg`（説明図SVG）。landing page のカードと `sitemap.xml` も更新する

## 実機がない場合

1. **showcase / exhibition / step-analysis / gait-report / balance-tuner / udon** はページ内デモモードがそのまま動きます
2. 任意のサンプルを `OrpheInsoleSimulator` で動かす場合は
   `buildInsoleToolkit(..., { simulator: true })` を使うか、README の「実機がない場合（シミュレータ）」を参照

## ローカルでの起動

Web Bluetooth は https または localhost 必須です:

```bash
cd ORPHE-INSOLE.js
npx http-server -p 8080
# → http://localhost:8080/examples/VISUALIZE/ など
```

## 共通実装（コピペせずこれを使う）

- 圧力の検証・キャリブレーション・CoP・接地検出: [`src/InsoleUtils.js`](../src/InsoleUtils.js)（`OrpheInsoleUtils`）
- チャネル→物理位置の対応表: `OrpheInsoleUtils.SENSOR_LAYOUT_IMAGE`（画像座標）/ `SENSOR_LAYOUT`（足ローカル座標）
- 実機なしのデータ源: [`src/InsoleSimulator.js`](../src/InsoleSimulator.js)（`OrpheInsoleSimulator`）
- 実装パターン集: [`docs/ai/PRESSURE_RECIPES.md`](../docs/ai/PRESSURE_RECIPES.md)

> 注: hula-motion-sonifier の `SENSOR_LAYOUT` は検出チューニングと一体の独自座標系のため、
> 共通定義には移行していません（挙動変更を伴うため。詳細は PR#8 の記録参照）。
