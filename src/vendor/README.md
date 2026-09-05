# src/vendor — 同梱サードパーティライブラリ

ORPHE-INSOLE.js が実行時に必要とする外部ライブラリを、**リポジトリ内に固定して同梱**するためのディレクトリです。
以前は SDK 読み込み時に ORPHE-CORE.js リポジトリの jsDelivr URL から `quaternion.js` / `float16.min.js` を
自動ロードしていましたが、別リポジトリのコードを実行時に取り込む構造はサプライチェーン上のリスク
（横断調査 2026-08-30 の所見 I-1）であり、v1.3.4 で廃止しました。

| ファイル | 内容 | 出典 | ライセンス |
|---|---|---|---|
| `quaternion.js` | [Quaternion.js](https://github.com/rawify/Quaternion.js) v1.4.0（2022-03-27）。`gotEuler` の四元数→オイラー角変換に使用 | `Orphe-OSS/ORPHE-CORE.js@v1.4.1` の `js/quaternion.js` をバイト単位で同一コピー（sha256 先頭 `0df75a466fc560a5`） | MIT（ファイル先頭の `@license` ヘッダを保持） |

`float16.min.js` は同梱していません。INSOLE SDK は半精度のデコードに自前の `f16be`（`src/InsoleGait.js`）を使っており、
外部の float16 ライブラリは使用していないためです。

## 配布形態ごとの読み込み方

- **`dist/orphe-insole.js` / `dist/orphe-insole.min.js`（CDN 配信）**: `scripts/build-dist.js` が
  `quaternion.js` を **同梱**します。既にグローバル `Quaternion` が定義されている場合（同一ページで ORPHE-CORE.js が
  先に読み込まれた等）は上書きしません。追加のネットワーク読み込みは発生しません。
- **`src/ORPHE-INSOLE.js` を直接読み込む場合（examples など）**: 自身の URL を基準に `vendor/quaternion.js` を
  相対パスで自動ロードします（`../../src/ORPHE-INSOLE.js` → `../../src/vendor/quaternion.js`）。
  `type="module"` やインライン評価などで自身の URL が取れない場合は何もしません（その場合 `gotEuler` は
  呼ばれませんが、他のコールバックは動作します）。

## 更新するとき

1. 上流（Quaternion.js）または ORPHE-CORE.js 側で更新されたファイルをそのまま置き換える（改変しない）
2. この README の版・出典・sha256 を更新する
3. `npm run build` で `dist/` を再生成し、`npm test`（`tests/insole-dist-bundle.test.js` が同梱と非上書きガードを検証）を通す
