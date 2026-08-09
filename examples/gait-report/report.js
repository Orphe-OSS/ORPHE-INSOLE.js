(function attachGaitReportStats(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.GaitReportStats = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createGaitReportStats() {
  "use strict";

  // 左右それぞれ何歩そろったらレポートを確定するか。
  const TARGET_STEPS = 20;

  const SIDES = Object.freeze(["left", "right"]);

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function positive(value) {
    const number = finite(value);
    return number !== null && number > 0 ? number : null;
  }

  function gaitCycleTime(row) {
    if (!row) return null;
    const duration = positive(row.duration_s);
    if (duration !== null) return duration;
    const stance = finite(row.stance_phase_s);
    const swing = finite(row.swing_phase_s);
    const total = stance !== null && swing !== null ? stance + swing : null;
    return total !== null && total > 0 ? total : null;
  }

  function cadenceSpm(row) {
    const cycle = gaitCycleTime(row);
    // 1足の gait cycle には左右2歩が含まれるため、steps/min = 2 * 60 / cycle。
    return cycle === null ? null : 120 / cycle;
  }

  function stancePercent(row) {
    const cycle = gaitCycleTime(row);
    const stance = row ? positive(row.stance_phase_s) : null;
    return cycle === null || stance === null ? null : (stance / cycle) * 100;
  }

  // レポートで集計する1歩ごとの数値フィールド。
  const FIELDS = Object.freeze([
    { id: "speed_mps", unit: "m/s", decimals: 2, value: (row) => positive(row && row.speed_mps) },
    { id: "stride_m", unit: "m", decimals: 2, value: (row) => positive(row && row.stride_norm_m) },
    { id: "cycle_s", unit: "s", decimals: 2, value: gaitCycleTime },
    { id: "cadence_spm", unit: "steps/min", decimals: 0, value: cadenceSpm },
    { id: "stance_pct", unit: "%", decimals: 1, value: stancePercent },
    { id: "stance_s", unit: "s", decimals: 2, value: (row) => positive(row && row.stance_phase_s) },
    { id: "swing_s", unit: "s", decimals: 2, value: (row) => positive(row && row.swing_phase_s) },
    { id: "strike_deg", unit: "deg", decimals: 1, value: (row) => finite(row && row.strike_angle_deg) },
    { id: "pronation_deg", unit: "deg", decimals: 1, value: (row) => finite(row && row.pronation_deg) },
    { id: "landing_force", unit: "", decimals: 2, value: (row) => positive(row && row.landing_force) }
  ]);

  // 表示専用の参考レンジ（健常成人・快適歩行の一般的な目安）。
  // 年齢・身長・速度・計測条件で変わるため、判定には使わない。
  const REFERENCE_RANGES = Object.freeze({
    speed_mps: { min: 1.2, max: 1.6 },
    cadence_spm: { min: 100, max: 120 },
    stride_m: { min: 1.2, max: 1.5 },
    cycle_s: { min: 1.0, max: 1.2 },
    stance_pct: { min: 58, max: 65 },
    cv_pct: { max: 2.5 }
  });

  const STRIKE_KEYS = Object.freeze(["heelStrike", "midfoot", "forefoot"]);
  const PRONATION_KEYS = Object.freeze(["neutral", "over", "severeOver", "under", "severeUnder"]);

  function fieldById(fieldId) {
    return FIELDS.find((field) => field.id === fieldId) || null;
  }

  function numericSummary(values) {
    const clean = values.map(finite).filter((value) => value !== null);
    if (clean.length === 0) return { count: 0, mean: null, sd: null };
    const mean = clean.reduce((sum, value) => sum + value, 0) / clean.length;
    if (clean.length < 2) return { count: clean.length, mean, sd: null };
    const variance = clean.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (clean.length - 1);
    return { count: clean.length, mean, sd: Math.sqrt(variance) };
  }

  function fieldSummary(rows, fieldId) {
    const field = fieldById(fieldId);
    if (!field || !Array.isArray(rows)) return { count: 0, mean: null, sd: null };
    return numericSummary(rows.map((row) => field.value(row)));
  }

  // 歩行周期の変動係数 (%)。時間的ばらつきの指標で、2歩以上で算出する。
  function cvPercent(rows) {
    const summary = numericSummary((rows || []).map(gaitCycleTime));
    if (summary.count < 2 || summary.mean === null || summary.mean <= 0 || summary.sd === null) {
      return null;
    }
    return (summary.sd / summary.mean) * 100;
  }

  // 左右差 (%)。正 = 左が大きい、負 = 右が大きい。
  function symmetryPercent(leftMean, rightMean) {
    const left = finite(leftMean);
    const right = finite(rightMean);
    if (left === null || right === null) return null;
    const base = (left + right) / 2;
    if (!Number.isFinite(base) || Math.abs(base) < 1e-9) return null;
    return ((left - right) / Math.abs(base)) * 100;
  }

  function distribution(rows, key, allowedKeys) {
    const counts = {};
    for (const allowed of allowedKeys) counts[allowed] = 0;
    let total = 0;
    for (const row of rows || []) {
      const value = row ? row[key] : null;
      if (value && Object.prototype.hasOwnProperty.call(counts, value)) {
        counts[value] += 1;
        total += 1;
      }
    }
    return { counts, total };
  }

  function sideReport(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const fields = {};
    for (const field of FIELDS) {
      fields[field.id] = numericSummary(list.map((row) => field.value(row)));
    }
    return {
      count: list.length,
      fields,
      cv: cvPercent(list),
      strike: distribution(list, "foot_strike", STRIKE_KEYS),
      pronation: distribution(list, "pronation_type", PRONATION_KEYS)
    };
  }

  // 左右差(%)を出すフィールド（正の量に限る。% は符号付き量には使わない）。
  const SYMMETRY_FIELDS = Object.freeze([
    "stride_m",
    "stance_s",
    "swing_s",
    "landing_force"
  ]);

  // 角度など符号付きの量は % ではなく左右の差（Δ）で比較する。
  const DELTA_FIELDS = Object.freeze([
    "pronation_deg"
  ]);

  function buildReport(rowsBySide, targetSteps = TARGET_STEPS) {
    const source = rowsBySide || {};
    const sides = {
      left: sideReport(source.left),
      right: sideReport(source.right)
    };
    const allRows = [].concat(source.left || [], source.right || []);
    const combined = { count: allRows.length, fields: {} };
    for (const field of FIELDS) {
      combined.fields[field.id] = numericSummary(allRows.map((row) => field.value(row)));
    }

    const symmetry = {};
    for (const fieldId of SYMMETRY_FIELDS) {
      symmetry[fieldId] = symmetryPercent(
        sides.left.fields[fieldId].mean,
        sides.right.fields[fieldId].mean
      );
    }

    // 左 − 右 の差（符号付き）。どちらかが欠損なら null。
    const deltas = {};
    for (const fieldId of DELTA_FIELDS) {
      const left = finite(sides.left.fields[fieldId].mean);
      const right = finite(sides.right.fields[fieldId].mean);
      deltas[fieldId] = left === null || right === null ? null : left - right;
    }

    const activeSides = SIDES.filter((side) => sides[side].count > 0);
    const complete = activeSides.length > 0
      && activeSides.every((side) => sides[side].count >= targetSteps);

    return {
      target: targetSteps,
      sides,
      combined,
      symmetry,
      deltas,
      activeSides,
      complete
    };
  }

  function sideFromMountPosition(mountPosition, fallbackDeviceId = 0) {
    const mount = finite(mountPosition);
    if (mount === null) return fallbackDeviceId === 1 ? "right" : "left";
    return (Math.trunc(mount) & 0b1) === 1 ? "right" : "left";
  }

  function formatNumber(value, decimals = 2) {
    const number = finite(value);
    return number === null ? "—" : number.toFixed(decimals);
  }

  const api = {
    TARGET_STEPS,
    SIDES,
    FIELDS,
    SYMMETRY_FIELDS,
    DELTA_FIELDS,
    REFERENCE_RANGES,
    STRIKE_KEYS,
    PRONATION_KEYS,
    finite,
    positive,
    gaitCycleTime,
    cadenceSpm,
    stancePercent,
    fieldById,
    numericSummary,
    fieldSummary,
    cvPercent,
    symmetryPercent,
    distribution,
    buildReport,
    sideFromMountPosition,
    formatNumber
  };

  return Object.freeze(api);
});
