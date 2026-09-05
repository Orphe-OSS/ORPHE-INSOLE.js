'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Model = require('../examples/gait-report/cg/model.js');
const { Feed, WINDOW, STALE_MS } = require('../examples/gait-report/cg/feed.js');
const Stats = require('../examples/gait-report/report.js');
const base = Model.DEFAULT;
const row = (extra = {}) => ({ speed_mps: 1.2, stride_norm_m: 1.3, duration_s: 1.1, stance_phase_s: .66, ...extra });
const event = (side = 'left', extra = {}) => ({ source: 'live', side, row: row(extra) });
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('✓ ' + name); }
test('empty feed preserves manual settings', () => {
  assert.deepEqual(new Feed().snapshot(base, 0).parameters, base);
  assert.equal(new Feed().snapshot(base, 0).state, 'manual');
});
test('exact stride/step conversion, bilateral stance and measured cadence', () => {
  const feed = new Feed(); feed.push(event(), base, 1); feed.push(event('right', { stance_phase_s: .715 }), base, 2);
  const s = feed.snapshot(base, 3);
  assert.equal(s.parameters.step, .65); assert.equal(s.parameters.speed, 1.2);
  assert.ok(Math.abs(s.parameters.stance - 62.5) < 1e-8);
  assert.ok(Math.abs(s.parameters.stanceBias + 2.5) < 1e-8);
  assert.equal(s.observed.cadence, 120 / 1.1);
  assert.equal(s.state, 'tracking'); assert.equal(s.singleSide, false);
});
test('buffers bounded, expire per side, stop stale, reset and reconnect', () => {
  const feed = new Feed();
  for (let i = 0; i < 10000; i++) feed.push(event(), base, i);
  assert.equal(feed.rows.left.length, WINDOW);
  feed.push(event('right'), base, 10000);
  feed.disconnect('left'); assert.equal(feed.snapshot(base, 10000).singleSide, true);
  assert.equal(feed.snapshot(base, 10001 + STALE_MS).state, 'stale');
  feed.push(event(), base, 19000); assert.equal(feed.snapshot(base, 19000).state, 'tracking');
  feed.reset(); assert.equal(feed.snapshot(base, 19000).state, 'manual');
});
test('demo→live source transition clears demo window', () => {
  const feed = new Feed(); feed.push({ ...event(), source: 'demo' }, base, 1); feed.push(event('right'), base, 2);
  assert.equal(feed.rows.left.length, 0); assert.equal(feed.snapshot(base, 3).source, 'live');
});
test('invalid rows do not change valid window or refresh freshness', () => {
  const feed = new Feed(); feed.push(event(), base, 0);
  for (const value of [NaN, Infinity, -1, 0, '', null, '1.2', 100]) assert.equal(feed.push(event('left', { speed_mps: value }), base, 5000), false);
  assert.equal(feed.push(event('left', { gait_type: 'run' }), base, 5000), false);
  assert.equal(feed.push(event('left', { stride_direction: 'backward' }), base, 5000), false);
  assert.equal(feed.lastValid, 0); assert.equal(feed.rows.left.length, 1);
  assert.equal(feed.snapshot(base, STALE_MS + 1).state, 'stale');
  assert.equal(feed.push(event('left', { stance_phase_s: 1.5 }), base, 9000), false);
});
test('missing stance uses manual or other side; cadence conflict explicit', () => {
  const feed = new Feed(); feed.push(event('left', { duration_s: -1, stance_phase_s: -1 }), base, 1);
  assert.equal(feed.snapshot(base, 2).missingStance, true);
  assert.equal(feed.snapshot(base, 2).parameters.stance, base.stance);
  feed.push(event('right', { duration_s: 1.6, stance_phase_s: .96 }), base, 3);
  assert.equal(feed.snapshot(base, 3).cadenceMismatch, true);
});
test('unsupported manual body/live stride combination fails closed', () => {
  const feed = new Feed(); feed.push(event('left', { stride_norm_m: 2.0 }), { ...base, height: 210 }, 1);
  assert.equal(feed.snapshot({ ...base, height: 140 }, 2).state, 'unsupported');
});
test('CG receives before recording and after completion without altering report rows', () => {
  const events = [];
  const ctx = vm.createContext({ GaitReportStats: Stats, GaitReportI18n: { getLanguage: () => "ja" }, URLSearchParams,
    location: { search: '?demo=0' }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    dispatchEvent: e => events.push(e) });
  vm.runInContext(fs.readFileSync('examples/gait-report/app.js', 'utf8'), ctx);
  const app = ctx.GaitReportLive; app.state.dom.lastStepTime = {}; app.state.idleReceiving = true;
  app.handleStepRow(-1, row(), { source: 'demo', side: 'left' });
  app.state.complete = true;
  app.state.rows.left = Array.from({length: 20}, () => row());
  app.state.rows.right = Array.from({length: 20}, () => row());
  app.handleStepRow(-1, row({ speed_mps: .8 }), { source: 'demo', side: 'right' });
  assert.equal(events.length, 2); assert.equal(events[1].detail.row.speed_mps, .8);
  assert.equal(app.state.rows.left.length + app.state.rows.right.length, 40);
  assert.equal(app.state.complete, true);
});
test('kinematic envelope: constant limb lengths, no foot penetration, periodic and lean', () => {
  for (const height of [140, 170, 210]) for (const step of [.2, .65, 1]) for (const stance of [50, 60, 75]) {
    let p; try { p = Model.validate({ ...base, height, step, stance, trunkLean: 30 }); } catch { continue; }
    for (let i = 0; i < 100; i++) for (const leg of Model.pose(p, i / 100).legs) {
      const distance = (a, b) => Math.hypot(...a.map((v, j) => v - b[j]));
      assert.ok(Math.abs(distance(leg.hip, leg.knee) - Model.body(p).leg) < 1e-7);
      assert.ok(Math.abs(distance(leg.ankle, leg.knee) - Model.body(p).leg) < 1e-7);
      assert.ok(Math.min(leg.heel[1], leg.toe[1]) > -1e-7);
    }
    assert.deepEqual(Model.pose(p, 0), Model.pose(p, 1));
  }
  assert.ok(Model.pose({ ...base, trunkLean: 30 }, 0).head[0] > Model.pose(base, 0).head[0] + .1);
});
console.log(`Gait CG: ${passed} tests passed`);
