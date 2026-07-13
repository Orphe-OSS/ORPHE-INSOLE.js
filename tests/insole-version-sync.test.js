// CDN のバージョン固定表記が package.json の version と一致していることを検証する。
//
// 背景: jsDelivr の @latest 参照は「main マージ = 即・全ユーザー配信」となるため、
// README / index.html のコード例はバージョン固定（@vX.Y.Z）で案内する方針
// （IMPROVEMENT_PLAN §8-5 リリース統制）。
//
// このテストがあるため、リリース時に package.json の version を上げると
// 固定表記の更新漏れが CI で検出される。リリース手順:
//   1. package.json の version を上げる
//   2. このテストを実行 → 落ちた箇所（README.md / index.html の @vX.Y.Z）を新バージョンに更新
//   3. CHANGELOG の [Unreleased] を [X.Y.Z] に確定
//   4. マージ後に git tag vX.Y.Z + GitHub Release
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const expected = `ORPHE-INSOLE.js@v${version}/`;

// 固定表記を含めるべきファイル（コード例で CDN URL を案内しているもの）
const targets = ['README.md', 'index.html'];

for (const file of targets) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');

  // @latest への退行を検出
  assert.ok(
    !content.includes('ORPHE-INSOLE.js@latest/'),
    `${file}: CDN 参照に @latest が残っています。@v${version} に固定してください。`
  );

  // 固定表記のバージョンが package.json と一致することを検出
  const pinned = content.match(/ORPHE-INSOLE\.js@v(\d+\.\d+\.\d+)\//g) || [];
  assert.ok(pinned.length > 0, `${file}: バージョン固定の CDN 参照が見つかりません。`);
  for (const ref of pinned) {
    assert.equal(
      ref,
      expected,
      `${file}: CDN 参照 "${ref}" が package.json の version (${version}) と一致しません。`
    );
  }
}

console.log('insole-version-sync.test.js passed');
