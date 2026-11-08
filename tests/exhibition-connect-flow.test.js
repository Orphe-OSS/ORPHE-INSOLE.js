/**
 * exhibition の接続フロー（Raw で接続してから Step Analysis を足す）の回帰テスト。
 *
 * 対象の不具合（2026-11-08、製品版 INSOLE の実機で発生）:
 *  同じスロットで一度 Step Analysis を有効化すると Toolkit セッションの希望状態に Step が残り、
 *  次の接続（別個体のこともある）は Step 込みで確立しようとする。Step 出力の無い個体（旧 FW）では
 *  接続時の通知確認が GAIT_NO_NOTIFICATIONS で失敗し、接続自体が失敗扱いになって切断されていた。
 *
 * examples/exhibition/app.js はブラウザ用トップレベルスクリプトで require できないため、
 * ソース不変条件で固定する。
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'examples/exhibition/app.js'), 'utf8');

// 1. 接続は Raw のみで確立する（build 時の outputs）
assert.match(src, /outputs:\s*\{\s*sensorValues:\s*true,\s*stepAnalysis:\s*false\s*\}/,
    'buildInsoleToolkit の outputs が Raw のみ（stepAnalysis: false）になっていない');

// 2. Step は接続後・再接続後に足す
const onConnect = src.match(/insole\.onConnect = function \(\) \{([\s\S]*?)\};/);
const onReconnect = src.match(/insole\.onReconnectSuccess = function \(\) \{([\s\S]*?)\};/);
assert.ok(onConnect && /enableStepAnalysisWhenReady\(this\.id\)/.test(onConnect[1]), 'onConnect で enableStepAnalysisWhenReady を呼んでいない');
assert.ok(onReconnect && /enableStepAnalysisWhenReady\(this\.id\)/.test(onReconnect[1]), 'onReconnectSuccess で enableStepAnalysisWhenReady を呼んでいない');

// 3. 切断時は Raw のみへ戻し、Toolkit の onDisconnect（markDisconnected）を上書きせず連鎖させる
const onDisconnect = src.match(/const toolkitOnDisconnect = insole\.onDisconnect;\s*insole\.onDisconnect = function \(\.\.\.args\) \{([\s\S]*?)\};/);
assert.ok(onDisconnect, 'onDisconnect で Toolkit のハンドラを退避して連鎖させる実装が無い');
const body = onDisconnect[1];
assert.match(body, /toolkitOnDisconnect\.apply\(this, args\)/, 'Toolkit の onDisconnect を呼び出していない（markDisconnected が失われる）');
assert.match(body, /setOutputs\(\{\s*sensorValues:\s*true,\s*stepAnalysis:\s*false\s*\}\)/,
    '切断時に Raw のみへ戻していない（次の接続が Step 込みになり、Step の無い個体で接続が失敗する）');
assert.match(body, /stepUnavailable\[this\.id\] = null/, '切断時に stepUnavailable を初期化していない');

// 4. 上記以外で onDisconnect を素朴に代入していない（Toolkit のラッパーを壊す）
const assigns = src.match(/insole\.onDisconnect = /g) || [];
assert.equal(assigns.length, 1, `insole.onDisconnect の代入が ${assigns.length} 箇所ある（1 箇所・連鎖形式のみ）`);

console.log('exhibition-connect-flow: ok');
