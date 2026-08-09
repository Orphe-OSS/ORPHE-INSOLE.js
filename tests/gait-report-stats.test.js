"use strict";

// examples/gait-report/report.js（純関数モジュール）の単体テスト。
// 実行: node tests/gait-report-stats.test.js

const assert = require("node:assert");
const Stats = require("../examples/gait-report/report.js");

function makeRow(overrides = {}) {
  return {
    step_number: 1,
    gait_type: "walk",
    stride_direction: "forward",
    duration_s: 1.1,
    stance_phase_s: 0.66,
    swing_phase_s: 0.44,
    cadence_hz: 1 / 1.1,
    speed_mps: 1.2 / 1.1,
    stride_norm_m: 1.2,
    strike_angle_deg: -5,
    pronation_deg: -9,
    pronation_type: "neutral",
    foot_strike: "heelStrike",
    landing_force: 1.2,
    ...overrides
  };
}

// ---------------------------------------------------------------- finite / positive

assert.strictEqual(Stats.finite(1.5), 1.5);
assert.strictEqual(Stats.finite("2"), 2);
assert.strictEqual(Stats.finite(NaN), null);
assert.strictEqual(Stats.finite(Infinity), null);
assert.strictEqual(Stats.finite(null), null);
assert.strictEqual(Stats.finite(undefined), null);
assert.strictEqual(Stats.finite(""), null);
assert.strictEqual(Stats.positive(0.5), 0.5);
// FW の未確定 sentinel (-1) と 0 は positive では欠損扱い
assert.strictEqual(Stats.positive(-1), null);
assert.strictEqual(Stats.positive(0), null);

// ---------------------------------------------------------------- 派生値

// duration_s があればそれを使う
assert.strictEqual(Stats.gaitCycleTime(makeRow()), 1.1);
// duration_s が欠損なら stance + swing にフォールバック
assert.ok(
  Math.abs(Stats.gaitCycleTime(makeRow({ duration_s: -1 })) - 1.1) < 1e-9
);
assert.strictEqual(Stats.gaitCycleTime(makeRow({ duration_s: null, stance_phase_s: null })), null);
assert.strictEqual(Stats.gaitCycleTime(null), null);

// ケイデンス: 1 gait cycle = 2歩なので 120 / cycle
assert.ok(Math.abs(Stats.cadenceSpm(makeRow({ duration_s: 1.2 })) - 100) < 1e-9);
assert.strictEqual(Stats.cadenceSpm(makeRow({ duration_s: -1, stance_phase_s: null })), null);

// 立脚期割合
assert.ok(Math.abs(Stats.stancePercent(makeRow()) - 60) < 1e-9);
assert.strictEqual(Stats.stancePercent(makeRow({ stance_phase_s: -1 })), null);

// ---------------------------------------------------------------- numericSummary

{
  const summary = Stats.numericSummary([1, 2, 3, 4]);
  assert.strictEqual(summary.count, 4);
  assert.ok(Math.abs(summary.mean - 2.5) < 1e-9);
  // 不偏SD: sqrt(5/3)
  assert.ok(Math.abs(summary.sd - Math.sqrt(5 / 3)) < 1e-9);
}
{
  const summary = Stats.numericSummary([2, null, NaN, undefined]);
  assert.strictEqual(summary.count, 1);
  assert.strictEqual(summary.mean, 2);
  // n=1 では SD を出さない（±0 と偽らない）
  assert.strictEqual(summary.sd, null);
}
{
  const summary = Stats.numericSummary([]);
  assert.strictEqual(summary.count, 0);
  assert.strictEqual(summary.mean, null);
  assert.strictEqual(summary.sd, null);
}

// ---------------------------------------------------------------- cvPercent

{
  const rows = [1.0, 1.0, 1.0].map((duration) => makeRow({ duration_s: duration }));
  assert.strictEqual(Stats.cvPercent(rows), 0);
}
{
  const rows = [1.0, 1.2].map((duration) => makeRow({ duration_s: duration }));
  // mean 1.1, sd(不偏) = sqrt(0.02) ≒ 0.14142 → CV ≒ 12.856%
  assert.ok(Math.abs(Stats.cvPercent(rows) - (Math.sqrt(0.02) / 1.1) * 100) < 1e-9);
}
assert.strictEqual(Stats.cvPercent([makeRow()]), null);
assert.strictEqual(Stats.cvPercent([]), null);

// ---------------------------------------------------------------- symmetryPercent

// 正 = 左が大きい
assert.ok(Math.abs(Stats.symmetryPercent(1.1, 0.9) - 20) < 1e-9);
assert.ok(Math.abs(Stats.symmetryPercent(0.9, 1.1) + 20) < 1e-9);
assert.strictEqual(Stats.symmetryPercent(1.0, 1.0), 0);
assert.strictEqual(Stats.symmetryPercent(null, 1.0), null);
assert.strictEqual(Stats.symmetryPercent(1.0, NaN), null);
// 両側平均が0のときは算出しない
assert.strictEqual(Stats.symmetryPercent(1.0, -1.0), null);

// ---------------------------------------------------------------- distribution

{
  const rows = [
    makeRow({ foot_strike: "heelStrike" }),
    makeRow({ foot_strike: "heelStrike" }),
    makeRow({ foot_strike: "midfoot" }),
    makeRow({ foot_strike: "none" }),      // 未確定は数えない
    makeRow({ foot_strike: null }),
    makeRow({ foot_strike: "unexpected" }) // 未知の値も数えない
  ];
  const dist = Stats.distribution(rows, "foot_strike", Stats.STRIKE_KEYS);
  assert.strictEqual(dist.counts.heelStrike, 2);
  assert.strictEqual(dist.counts.midfoot, 1);
  assert.strictEqual(dist.counts.forefoot, 0);
  assert.strictEqual(dist.total, 3);
}

// ---------------------------------------------------------------- buildReport

function makeRows(count, overrides = {}) {
  return Array.from({ length: count }, (_, index) => makeRow({ step_number: index + 1, ...overrides }));
}

{
  // 左右20歩そろえば complete
  const report = Stats.buildReport({ left: makeRows(20), right: makeRows(20) });
  assert.strictEqual(report.complete, true);
  assert.strictEqual(report.target, Stats.TARGET_STEPS);
  assert.deepStrictEqual(report.activeSides, ["left", "right"]);
  assert.strictEqual(report.combined.count, 40);
  assert.strictEqual(report.sides.left.fields.speed_mps.count, 20);
}
{
  // 片側が19歩なら未完成
  const report = Stats.buildReport({ left: makeRows(20), right: makeRows(19) });
  assert.strictEqual(report.complete, false);
}
{
  // 片足だけの計測は、その足の20歩で完成
  const report = Stats.buildReport({ left: makeRows(20), right: [] });
  assert.strictEqual(report.complete, true);
  assert.deepStrictEqual(report.activeSides, ["left"]);
  // 右足が無いので左右差は算出しない
  assert.strictEqual(report.symmetry.stride_m, null);
}
{
  // 0歩では complete にならない
  const report = Stats.buildReport({ left: [], right: [] });
  assert.strictEqual(report.complete, false);
  assert.strictEqual(report.combined.count, 0);
}
{
  // 左右差の符号: 左のストライドが大きい → 正
  const report = Stats.buildReport({
    left: makeRows(20, { stride_norm_m: 1.3 }),
    right: makeRows(20, { stride_norm_m: 1.1 })
  });
  assert.ok(report.symmetry.stride_m > 0);
  assert.ok(Math.abs(report.symmetry.stride_m - ((1.3 - 1.1) / 1.2) * 100) < 1e-9);
}
{
  // 符号付き量（プロネーション角）は % ではなく Δ（左−右）で比較する
  const report = Stats.buildReport({
    left: makeRows(20, { pronation_deg: -8.4 }),
    right: makeRows(20, { pronation_deg: -10.0 })
  });
  assert.strictEqual(report.symmetry.pronation_deg, undefined);
  assert.ok(Math.abs(report.deltas.pronation_deg - 1.6) < 1e-9);
  // 片側欠損なら null
  const single = Stats.buildReport({ left: makeRows(20), right: [] });
  assert.strictEqual(single.deltas.pronation_deg, null);
}
{
  // FW 未確定値 (-1) は該当フィールドだけ欠損として除外される
  const rows = makeRows(5).concat(makeRows(5, { landing_force: -1 }));
  const report = Stats.buildReport({ left: rows, right: [] });
  assert.strictEqual(report.sides.left.count, 10);
  assert.strictEqual(report.sides.left.fields.landing_force.count, 5);
  assert.strictEqual(report.sides.left.fields.speed_mps.count, 10);
}
{
  // targetSteps の上書き
  const report = Stats.buildReport({ left: makeRows(5), right: makeRows(5) }, 5);
  assert.strictEqual(report.complete, true);
}

// ---------------------------------------------------------------- そのほかの公開API

{
  const ids = Stats.FIELDS.map((field) => field.id);
  assert.strictEqual(new Set(ids).size, ids.length, "FIELDS の id は一意であること");
  for (const fieldId of Stats.SYMMETRY_FIELDS) {
    assert.ok(Stats.fieldById(fieldId), `SYMMETRY_FIELDS の ${fieldId} が FIELDS に存在すること`);
  }
}

assert.strictEqual(Stats.sideFromMountPosition(0), "left");
assert.strictEqual(Stats.sideFromMountPosition(1), "right");
assert.strictEqual(Stats.sideFromMountPosition(2), "left");   // bit1 は足底/足背
assert.strictEqual(Stats.sideFromMountPosition(3), "right");
assert.strictEqual(Stats.sideFromMountPosition(null, 0), "left");
assert.strictEqual(Stats.sideFromMountPosition(null, 1), "right");

for (const [fieldId, range] of Object.entries(Stats.REFERENCE_RANGES)) {
  if (range.min !== undefined && range.max !== undefined) {
    assert.ok(range.min < range.max, `参考レンジ ${fieldId} は min < max であること`);
  }
}

assert.strictEqual(Stats.formatNumber(1.234, 1), "1.2");
assert.strictEqual(Stats.formatNumber(null, 1), "—");

console.log("gait-report-stats: all tests passed");
