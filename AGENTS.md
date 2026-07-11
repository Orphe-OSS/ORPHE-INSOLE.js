# Codex 作業ガイド（入口）

> **📌 改善プロジェクト進行中（2026-07〜）**

作業を始める前に、必ず次の順で読むこと:

1. [`CODEX_WORKPLAN.md`](./CODEX_WORKPLAN.md) — 次に着手すべきPR・コードレベルの実装仕様・完了条件・報告フォーマット・レビュー手順（**実務の要**）。
2. [`IMPROVEMENT_PLAN.md`](./IMPROVEMENT_PLAN.md) — 全体戦略・課題分析（file:line 付き）・優先度付きバックログ（**なぜ直すかの根拠**）。

## 使えるコマンド（実態）

```bash
npm test               # 構文チェック + 単体テスト
npm run lint           # ESLint（PR#1 で整備済み）
npm run build          # dist/ 再生成（terser）。src を触ったら必須
npm run generate-docs  # JSDoc
```

## 守ること（詳細は CODEX_WORKPLAN §0・絶対的制約）

- **後方互換最優先**。公開シグネチャ（`setup/begin/stop/reset/got*/on*`、グローバル `OrpheInsole`/`Orphe`/`insoles`/`bles`/`cores`）を変更・削除しない。
- `main` へ直接 push・セルフマージ禁止。PR を作成して open のままにする。
- src を編集したら `npm run build` で `dist/` を再生成してコミット（dist 競合は手で解決せず再生成が唯一の正解）。
- 医療・リハビリ関連の文言で断定表現（「診断できる」「改善する」等）を使わない。
- 各PRの説明文に CODEX_WORKPLAN §8 の完了レポートを貼る。

> プロジェクトの API リファレンス・実装パターンは [`CLAUDE.md`](./CLAUDE.md)。
