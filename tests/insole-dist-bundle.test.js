'use strict';

// dist 同梱（scripts/build-dist.js）と src/ORPHE-INSOLE.js の同梱ライブラリ読み込みの回帰テスト。
//
// - dist/orphe-insole.js が buildDist() の出力と一致する（生成物のコミット漏れを検出）
// - SDK（src / dist）が ORPHE-CORE.js リポジトリの CDN からコードをロードしない（横断調査 2026-08-30 の所見 I-1）
// - dist を評価すると Quaternion と OrpheInsole がグローバルに定義され、ネットワーク読み込み（script 挿入）は起きない
// - 既にグローバル Quaternion がある場合（同一ページの ORPHE-CORE.js 等）は上書きしない
// - Node の require() で dist を読み込んでも module.exports は SDK のオブジェクトのまま（Quaternion で上書きされない）
// - src を直接読み込んだ場合は自身の URL を基準に vendor/quaternion.js を相対ロードし、URL が取れなければ何もしない
// - 同梱した quaternion.js は ORPHE-CORE.js 由来のファイルとバイト単位で同一（README に記した sha256 と一致）

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildDist, OUTPUT_FILE, SOURCE_FILE } = require('../scripts/build-dist.js');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const CORE_CDN = /cdn\.jsdelivr\.net\/gh\/Orphe-OSS\/ORPHE-CORE\.js/;
const VENDOR_SHA256_PREFIX = '0df75a466fc560a5'; // src/vendor/README.md に記載

function createContext({ currentScript = null } = {}) {
  const appended = [];
  const documentMock = {
    readyState: 'complete',
    currentScript,
    scripts: [],
    head: { appendChild(el) { appended.push(el); } },
    createElement: () => ({}),
    addEventListener() { },
  };
  const ctx = vm.createContext({
    console, performance, Date, Math, JSON, Promise, Number, Object, Array, String, Error, TypeError,
    setTimeout, clearTimeout,
    document: documentMock,
    navigator: {},
    localStorage: { getItem: () => null, setItem() { }, removeItem() { } },
    DataView, ArrayBuffer, Uint8Array,
  });
  ctx.globalThis = ctx;
  ctx.window = ctx;
  return { ctx, appended };
}

function main() {
  const dist = read(OUTPUT_FILE);
  const src = read(SOURCE_FILE);

  // 1. 生成物がコミット済みファイルと一致する
  assert.equal(dist, buildDist(), `${OUTPUT_FILE} is out of date — run \`npm run build\` and commit`);

  // 2. SDK は他リポジトリの CDN からコードをロードしない
  assert.ok(!CORE_CDN.test(src), `${SOURCE_FILE} must not reference the ORPHE-CORE.js CDN`);
  assert.ok(!CORE_CDN.test(dist), `${OUTPUT_FILE} must not reference the ORPHE-CORE.js CDN`);
  // float16 はコメント（経緯の説明）には登場するが、コード側に URL や読み込みが残っていてはいけない
  const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');
  assert.ok(!/float16/i.test(stripComments(src)), 'src must not load or reference float16 outside comments');
  assert.ok(!/float16/i.test(stripComments(dist)), 'dist must not load or reference float16 outside comments');

  // 3. 同梱ファイルの同一性（ORPHE-CORE.js@v1.4.1 js/quaternion.js）
  const vendorSha = crypto.createHash('sha256').update(read('src/vendor/quaternion.js')).digest('hex');
  assert.ok(vendorSha.startsWith(VENDOR_SHA256_PREFIX), `src/vendor/quaternion.js sha256 ${vendorSha.slice(0, 16)} != ${VENDOR_SHA256_PREFIX} (update README if intentional)`);
  assert.match(read('src/vendor/quaternion.js'), /@license Quaternion\.js v1\.4\.0/, 'vendored file keeps its license header');
  assert.match(dist, /@license Quaternion\.js v1\.4\.0/, 'dist keeps the Quaternion.js license header');

  // 4. dist を評価: Quaternion と OrpheInsole が定義され、script 挿入（ネットワーク読み込み）は起きない
  {
    const { ctx, appended } = createContext();
    vm.runInContext(dist, ctx, { filename: OUTPUT_FILE });
    assert.equal(typeof ctx.Quaternion, 'function', 'dist defines global Quaternion');
    assert.equal(typeof ctx.OrpheInsole, 'function', 'dist defines global OrpheInsole');
    assert.equal(appended.length, 0, 'dist must not inject any <script>');
    const euler = vm.runInContext('new Quaternion(Math.SQRT1_2, 0, 0, Math.SQRT1_2).toEuler()', ctx);
    assert.ok(Math.abs(euler.yaw - Math.PI / 2) < 1e-9, `toEuler yaw for 90° ≈ π/2 (got ${euler.yaw})`);
  }

  // 5. 既存の Quaternion を上書きしない（ORPHE-CORE.js が先に読み込まれたページ）
  {
    const { ctx, appended } = createContext();
    vm.runInContext('function Quaternion() {} Quaternion.marker = "preexisting";', ctx);
    const before = ctx.Quaternion;
    vm.runInContext(dist, ctx, { filename: OUTPUT_FILE });
    assert.equal(ctx.Quaternion, before, 'dist must not overwrite an existing global Quaternion');
    assert.equal(ctx.Quaternion.marker, 'preexisting');
    assert.equal(typeof ctx.OrpheInsole, 'function');
    assert.equal(appended.length, 0);
  }

  // 6. Node の require() で dist を読み込んでも module.exports は SDK のもの
  {
    const mod = require(path.join(ROOT, OUTPUT_FILE));
    assert.equal(typeof mod.OrpheInsole, 'function', 'require(dist) exposes OrpheInsole');
    assert.equal(typeof mod.parseInsoleSensorValues, 'function', 'require(dist) exposes parseInsoleSensorValues');
    assert.ok(!(typeof mod === 'function' && mod.name === 'Quaternion'), 'module.exports must not be replaced by Quaternion');
  }

  // 7. src 直読み: 自身の URL を基準に vendor/quaternion.js を相対ロードする
  {
    const { ctx, appended } = createContext({ currentScript: { src: 'https://example.com/lib/src/ORPHE-INSOLE.js?v=1#x' } });
    vm.runInContext(src, ctx, { filename: SOURCE_FILE });
    assert.equal(appended.length, 1, 'src loads exactly one script');
    assert.equal(appended[0].src, 'https://example.com/lib/src/vendor/quaternion.js');
  }
  // 7b. 自身の URL が取れない（module / inline）場合は何もしない
  {
    const { ctx, appended } = createContext({ currentScript: null });
    vm.runInContext(src, ctx, { filename: SOURCE_FILE });
    assert.equal(appended.length, 0, 'src without currentScript must not inject scripts');
  }
  // 7c. Quaternion が既にあれば src もロードしない
  {
    const { ctx, appended } = createContext({ currentScript: { src: 'https://example.com/lib/src/ORPHE-INSOLE.js' } });
    vm.runInContext('function Quaternion() {}', ctx);
    vm.runInContext(src, ctx, { filename: SOURCE_FILE });
    assert.equal(appended.length, 0, 'src must not load vendor when Quaternion already exists');
  }

  // 8. vendor ファイルが src 直読みの相対パスに実在する
  assert.ok(fs.existsSync(path.join(ROOT, 'src', 'vendor', 'quaternion.js')), 'src/vendor/quaternion.js exists');

  console.log('insole-dist-bundle: OK');
}

main();
