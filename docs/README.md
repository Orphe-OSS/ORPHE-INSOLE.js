# ORPHE-INSOLE.js Documentation

ORPHE INSOLE（6ch圧力センサ + IMU 内蔵インソール型IoTセンサー）の JavaScript SDK ドキュメントです。

## はじめに

- **[プロジェクト README](../README.md)** — インストール・Getting Started・シミュレータの使い方
- **[API リファレンス（JSDoc）](https://orphe-oss.github.io/ORPHE-INSOLE.js/docs/)** — `OrpheInsole` クラスの全メソッド・コールバック
- **[CLAUDE.md](../CLAUDE.md)** — AI コーディングエージェント向けの包括的な実装ガイド（人間が読んでも有用）

## リファレンス

| ドキュメント | 内容 |
|---|---|
| [SENSOR_SPEC.md](./SENSOR_SPEC.md) | パケットフォーマット（header 50/55/56）・単位系・mount_position ビット定義・チャネル配置とリマップ方針 |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 接続できない・データが来ない・再接続しない等の切り分け手順 |
| [ai/PRESSURE_RECIPES.md](./ai/PRESSURE_RECIPES.md) | 圧力データ処理の実装パターン集（キャリブレーション・接地検出・CoP・可聴化） |

## サンプル

実機がなくても `OrpheInsoleSimulator`（[README の該当節](../README.md)参照）で大半のサンプルを確認できます。

| サンプル | 用途 |
|---|---|
| [VISUALIZE](../examples/VISUALIZE/) | センサ可視化（推奨スターター） |
| [showcase](../examples/showcase/) | 製品紹介が1ページで完結するショーケース（デモ再生つき） |
| [sensor-dashboard](../examples/sensor-dashboard/) | 2台同時ダッシュボード（L/R 自動マッピング） |
| [balance-sway](../examples/balance-sway/) | 重心動揺の可視化 |
| [balance-tuner](../examples/balance-tuner/) | バランスの可聴化 |
| [hula-motion-sonifier](../examples/hula-motion-sonifier/) | 動作の可聴化（Web Audio） |
| [device-test](../examples/device-test/) | 実機チェックリスト（リリース前検証用） |
| [terminal](../examples/terminal/) | 生データデバッグ |

## 免責事項

本ライブラリおよびサンプルは医療機器ではなく、疾病の診断・治療・予防を目的としていません。
研究・教育・エンターテインメント用途を想定しています。

## 開発者向け

```bash
npm test            # 構文チェック + 単体テスト + 型テスト
npm run lint        # ESLint
npm run build       # dist/ を生成（src 編集後は必須）
npm run generate-docs  # この docs/ 配下の JSDoc を再生成
```

改善プロジェクトの計画は [IMPROVEMENT_PLAN.md](../IMPROVEMENT_PLAN.md) / [CODEX_WORKPLAN.md](../CODEX_WORKPLAN.md) を参照してください。
