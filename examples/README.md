# ORPHE INSOLE Examples

各サンプルの目的・必要機材・実機なしでの確認方法の一覧です。
迷ったら **VISUALIZE**（最小の可視化）→ **showcase**（全部入り）の順に見てください。

> **免責**: すべてのサンプルは医療機器ではなく、疾病の診断・治療・予防を目的としていません。

## マトリクス

| サンプル | 目的 | 必要機材 | 実機なし確認 | 主な実装パターン |
|---|---|---|---|---|
| [VISUALIZE](./VISUALIZE/) | 6chチャート+IMU可視化（推奨スターター） | INSOLE ×1 | ―（実機推奨） | rAF描画スロットリング |
| [showcase](./showcase/) | 製品紹介1ページ（LIVE/DEMO切替） | なしでも可 | **DEMOモード内蔵**（合成歩行+CSV再生） | i18n、CSV入出力、圧力ヒートマップ+CoP |
| [sensor-dashboard](./sensor-dashboard/) | 2台同時ダッシュボード | INSOLE ×2 | ―（実機推奨） | L/R自動マッピング（mount_position） |
| [balance-sway](./balance-sway/) | 重心動揺の可視化（CoP軌跡・軌跡長・楕円面積） | INSOLE ×2 | デモ再生内蔵 | CoP計算、圧力検証、医療注意書き |
| [balance-tuner](./balance-tuner/) | 左右バランスの可聴化 | INSOLE ×2 | **デモモード内蔵**（既定でON） | Web Audio、荷重→音マッピング |
| [hula-motion-sonifier](./hula-motion-sonifier/) | フラダンス動作の検出と可聴化 | INSOLE ×2 | 一部（検出ロジックは Node テストあり） | 状態遷移発音、IMU+圧力の複合判定 |
| [device-test](./device-test/) | **リリース前の実機チェックリスト** | INSOLE ×1 | ―（実機検証が目的） | 通知中read/write、モード切替、自動判定 |
| [data-modes](./data-modes/) | **通信方式・計測モードのガイドとレコーダー** | INSOLE ×1〜2 | ―（実機推奨） | 名前付きprofile、Realtime/FIFO/Step、計測区間CSV |
| [quaternion-validation](./quaternion-validation/) | **quat修正の長時間実機検証** | INSOLE ×1〜2 | `?sim=1` | norm・yaw drift・欠損率、CSV逐次保存、数値レポート |
| [terminal](./terminal/) | 生データ（gotData）のデバッグ | INSOLE ×1 | ― | プロトコル解析 |

## 実機がない場合

1. **showcase / balance-tuner** はページ内デモモードがそのまま動きます
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
