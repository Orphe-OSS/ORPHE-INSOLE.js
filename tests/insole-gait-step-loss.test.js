'use strict';

// GaitAggregator の step 損失検出（incomplete / gap / jump）のテスト。
// 実行: node tests/insole-gait-step-loss.test.js

const assert = require('node:assert/strict');
const Gait = require('../src/InsoleGait.js');

const { GaitAggregator, stepDistance, STALE_STEP_DISTANCE, GAP_COUNT_LIMIT } = Gait;

assert.equal(typeof GaitAggregator, 'function');
assert.equal(typeof stepDistance, 'function');
assert.ok(STALE_STEP_DISTANCE > 1);
assert.ok(GAP_COUNT_LIMIT > STALE_STEP_DISTANCE);

const packet = (type, step) => ({ type, step_number: step });

function feedComplete(aggregator, step) {
  aggregator.add(packet('overview', step));
  aggregator.add(packet('stride', step));
  return aggregator.add(packet('pronation', step));
}

function makeAggregator() {
  const events = [];
  const aggregator = new GaitAggregator();
  aggregator.onStepLoss = (info) => events.push(info);
  return { aggregator, events };
}

// ── stepDistance（wraparound対応の前進距離） ──
assert.equal(stepDistance(5, 7), 2);
assert.equal(stepDistance(65534, 1), 3);   // 65535, 0 をまたぐ
assert.equal(stepDistance(1, 65534), 65533);
assert.equal(stepDistance(10, 10), 0);

// ── 正常系: 連続した完全な歩は損失ゼロ ──
{
  const { aggregator, events } = makeAggregator();
  for (let step = 1; step <= 5; step++) {
    assert.ok(feedComplete(aggregator, step), `step ${step} が emit されること`);
  }
  const stats = aggregator.stats();
  assert.equal(stats.completedSteps, 5);
  assert.equal(stats.incompleteSteps, 0);
  assert.equal(stats.gapSteps, 0);
  assert.equal(stats.jumps, 0);
  assert.equal(stats.lastSeenStep, 5);
  assert.equal(stats.pendingSteps, 0);
  assert.equal(events.length, 0);

  // 2回目の送信（重複）は無視され、カウンタも動かない
  assert.equal(aggregator.add(packet('overview', 3)), null);
  assert.equal(aggregator.stats().completedSteps, 5);
}

// ── incomplete: 一部サブパケットのみ届いた歩は STALE_STEP_DISTANCE で回収不能として計上 ──
{
  const { aggregator, events } = makeAggregator();
  feedComplete(aggregator, 9);
  aggregator.add(packet('overview', 10));
  aggregator.add(packet('stride', 10)); // pronation が届かない
  for (let step = 11; step < 11 + STALE_STEP_DISTANCE; step++) {
    feedComplete(aggregator, step);
  }
  const stats = aggregator.stats();
  assert.equal(stats.incompleteSteps, 1);
  assert.equal(stats.missingParts.pronation, 1);
  assert.equal(stats.missingParts.overview, 0);
  assert.equal(stats.missingParts.stride, 0);
  const incomplete = events.filter((info) => info.reason === 'incomplete');
  assert.equal(incomplete.length, 1);
  assert.equal(incomplete[0].step_number, 10);
  assert.deepEqual(incomplete[0].missing, ['pronation']);
}

// ── gap: 1サブパケットも届かなかった歩を計上し、後着で取り消す ──
{
  const { aggregator, events } = makeAggregator();
  feedComplete(aggregator, 20);
  feedComplete(aggregator, 21);
  feedComplete(aggregator, 24); // 22, 23 が丸ごと欠けた
  {
    const stats = aggregator.stats();
    assert.equal(stats.gapSteps, 2);
    const gaps = events.filter((info) => info.reason === 'gap');
    assert.equal(gaps.length, 1);
    assert.deepEqual(gaps[0].steps, [22, 23]);
    assert.equal(gaps[0].count, 2);
  }
  // 22 が遅れて完全に届いたら gap 計上を取り消して通常の集約に乗せる
  const row = feedComplete(aggregator, 22);
  assert.ok(row, '後着した歩も emit されること');
  const stats = aggregator.stats();
  assert.equal(stats.gapSteps, 1);
  assert.equal(stats.completedSteps, 4);
}

// ── wraparound: 65535→0 をまたぐ gap と stale eviction ──
{
  const { aggregator, events } = makeAggregator();
  feedComplete(aggregator, 65534);
  feedComplete(aggregator, 1); // 65535, 0 が gap
  assert.equal(aggregator.stats().gapSteps, 2);
  assert.deepEqual(events.filter((i) => i.reason === 'gap')[0].steps, [65535, 0]);
}
{
  const { aggregator, events } = makeAggregator();
  aggregator.add(packet('overview', 65533)); // incomplete のまま wraparound をまたぐ
  let step = 65534;
  for (let i = 0; i < STALE_STEP_DISTANCE + 1; i++) {
    feedComplete(aggregator, step);
    step = (step + 1) % 0x10000;
  }
  const stats = aggregator.stats();
  assert.equal(stats.incompleteSteps, 1, 'wraparound をまたいでも stale 判定できること');
  assert.equal(events.filter((i) => i.reason === 'incomplete')[0].step_number, 65533);
}

// ── jump: GAP_COUNT_LIMIT を超える前進は欠損ではなく採番ジャンプ扱い ──
{
  const { aggregator, events } = makeAggregator();
  feedComplete(aggregator, 100);
  feedComplete(aggregator, 100 + GAP_COUNT_LIMIT + 50);
  const stats = aggregator.stats();
  assert.equal(stats.jumps, 1);
  assert.equal(stats.gapSteps, 0, 'ジャンプは gap として数えない');
  const jumps = events.filter((info) => info.reason === 'step_number_jump');
  assert.equal(jumps.length, 1);
  assert.equal(jumps[0].from, 100);
  assert.equal(jumps[0].to, 100 + GAP_COUNT_LIMIT + 50);
}

// ── 採番リセット（resetAnalysisLogs / FW再起動）も jump として扱う ──
{
  const { aggregator } = makeAggregator();
  feedComplete(aggregator, 93);
  feedComplete(aggregator, 0); // 前進距離 65443 → リセット
  const stats = aggregator.stats();
  assert.equal(stats.jumps, 1);
  assert.equal(stats.gapSteps, 0);
  assert.equal(stats.lastSeenStep, 0);
}

// ── 既知stepの少し後ろへの後着は jump にも gap にもしない ──
{
  const { aggregator } = makeAggregator();
  feedComplete(aggregator, 100);
  feedComplete(aggregator, 101);
  // 98 の遅延到着（新規だが lastSeen より少し古い）
  feedComplete(aggregator, 98);
  const stats = aggregator.stats();
  assert.equal(stats.jumps, 0);
  assert.equal(stats.lastSeenStep, 101, '後着で lastSeen を巻き戻さない');
  assert.equal(stats.completedSteps, 3);
}

// ── OrpheInsoleGait への配線: onStepLoss / onDiagnostic('step-loss') / diagnostics().stepLoss ──
{
  const gait = new Gait({ id: 3 });
  const lossEvents = [];
  const diagnosticEvents = [];
  gait.onStepLoss = (deviceId, info) => lossEvents.push({ deviceId, info });
  gait.onDiagnostic = (deviceId, info) => diagnosticEvents.push(info);

  feedComplete(gait.aggregator, 5);
  feedComplete(gait.aggregator, 8); // 6, 7 が gap

  assert.equal(lossEvents.length, 1);
  assert.equal(lossEvents[0].deviceId, 3);
  assert.equal(lossEvents[0].info.reason, 'gap');
  assert.deepEqual(lossEvents[0].info.steps, [6, 7]);

  const stepLossDiagnostics = diagnosticEvents.filter((info) => info.type === 'step-loss');
  assert.equal(stepLossDiagnostics.length, 1);
  assert.equal(stepLossDiagnostics[0].reason, 'gap');

  const diagnostics = gait.diagnostics();
  assert.equal(diagnostics.stepLoss.gapSteps, 2);
  assert.equal(diagnostics.stepLoss.completedSteps, 2);
  assert.equal(diagnostics.stepLoss.lastSeenStep, 8);
}

console.log('insole-gait-step-loss.test.js passed');
