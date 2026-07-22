'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const wrapper = path.join(__dirname, 'run-with-timeout.js');
const fixture = path.join(__dirname, 'fixtures', 'hanging-test.js');
const startedAt = Date.now();
const result = spawnSync(process.execPath, [wrapper, '0.05', fixture], {
  encoding: 'utf8',
  timeout: 3000,
});
const elapsedMs = Date.now() - startedAt;

assert.equal(result.error, undefined, result.error?.message);
assert.equal(result.status, 124, `expected timeout exit 124, got ${result.status}\n${result.stderr}`);
assert.match(result.stderr, /exceeded 0\.05 seconds/);
assert.ok(elapsedMs < 2500, `watchdog took too long: ${elapsedMs} ms`);

console.log('run-with-timeout.test.js passed');
