(function attachStepAnalysisMetrics(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.StepAnalysisMetrics = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createStepAnalysisMetrics() {
  "use strict";

  const ROLLING_WINDOW_STEPS = 10;

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

  function clinicalCadenceSpm(row) {
    const cycle = gaitCycleTime(row);
    // 1足の gait cycle には左右2歩が含まれるため、steps/min = 2 * 60 / cycle。
    return cycle === null ? null : 120 / cycle;
  }

  function phasePercent(row, field) {
    const cycle = gaitCycleTime(row);
    const phase = row ? finite(row[field]) : null;
    return cycle === null || phase === null ? null : (phase / cycle) * 100;
  }

  function estimatedStepLengthM(row) {
    const stride = row ? finite(row.stride_norm_m) : null;
    return stride === null ? null : stride / 2;
  }

  const METRICS = Object.freeze([
    {
      id: "gait_type",
      label: "歩容タイプ",
      unit: "",
      type: "text",
      source: "通知",
      description: "walk / run / stance",
      value: (row) => row && row.gait_type
    },
    {
      id: "stride_direction",
      label: "進行方向",
      unit: "",
      type: "text",
      source: "通知",
      description: "forward / backward / inside / outside",
      value: (row) => row && row.stride_direction
    },
    {
      id: "speed_mps",
      label: "歩行速度",
      unit: "m/s",
      decimals: 2,
      source: "算出",
      description: "ストライド長 ÷ 歩行周期",
      value: (row) => row && row.speed_mps
    },
    {
      id: "cadence_spm",
      label: "ケイデンス",
      unit: "steps/min",
      decimals: 1,
      source: "算出",
      description: "120 ÷ 歩行周期",
      value: clinicalCadenceSpm
    },
    {
      id: "step_length_m",
      label: "歩幅（推定）",
      unit: "m",
      decimals: 2,
      source: "推定",
      description: "ストライド長 ÷ 2",
      value: estimatedStepLengthM
    },
    {
      id: "stance_percent",
      label: "立脚期",
      unit: "%",
      decimals: 1,
      source: "算出",
      description: "立脚時間 ÷ 歩行周期",
      value: (row) => phasePercent(row, "stance_phase_s")
    },
    {
      id: "swing_percent",
      label: "遊脚期",
      unit: "%",
      decimals: 1,
      source: "算出",
      description: "遊脚時間 ÷ 歩行周期",
      value: (row) => phasePercent(row, "swing_phase_s")
    },
    {
      id: "cycle_time_s",
      label: "歩行周期",
      unit: "s",
      decimals: 2,
      source: "算出",
      description: "立脚時間 + 遊脚時間",
      value: gaitCycleTime
    },
    {
      id: "stride_length_m",
      label: "ストライド長",
      unit: "m",
      decimals: 2,
      source: "通知",
      description: "3軸ストライドベクトルの長さ",
      value: (row) => row && row.stride_norm_m
    },
    {
      id: "foot_angle_deg",
      label: "足角度",
      unit: "deg",
      decimals: 1,
      source: "通知",
      description: "Step Analysis の足角度",
      value: (row) => row && row.foot_angle_deg
    },
    {
      id: "landing_force",
      label: "着地衝撃",
      unit: "",
      decimals: 2,
      source: "通知",
      description: "ファームウェアが返す landing force",
      value: (row) => row && row.landing_force
    },
    {
      id: "foot_strike",
      label: "接地タイプ",
      unit: "",
      type: "text",
      source: "分類",
      description: "heel / midfoot / forefoot",
      value: (row) => row && row.foot_strike
    },
    {
      id: "pronation_deg",
      label: "プロネーション",
      unit: "deg",
      decimals: 1,
      source: "通知",
      description: "プロネーション角",
      value: (row) => row && row.pronation_deg
    },
    {
      id: "pronation_type",
      label: "プロネーション分類",
      unit: "",
      type: "text",
      source: "分類",
      description: "neutral / over / under",
      value: (row) => row && row.pronation_type
    },
    {
      id: "distance_m",
      label: "累積距離",
      unit: "m",
      decimals: 2,
      source: "通知",
      description: "接続後の累積移動距離",
      value: (row) => row && row.distance_m
    }
  ]);

  function metricById(metricId) {
    return METRICS.find((metric) => metric.id === metricId) || null;
  }

  function metricValue(row, metric) {
    if (!row || !metric || typeof metric.value !== "function") return null;
    const value = metric.value(row);
    if (metric.type === "text") {
      return value === null || value === undefined || value === "" ? null : String(value);
    }
    return finite(value);
  }

  function numericSummary(values) {
    const clean = values.map(finite).filter((value) => value !== null);
    if (clean.length === 0) {
      return { count: 0, mean: null, sd: null, min: null, max: null };
    }
    const mean = clean.reduce((sum, value) => sum + value, 0) / clean.length;
    const variance = clean.length > 1
      ? clean.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (clean.length - 1)
      : 0;
    return {
      count: clean.length,
      mean,
      sd: Math.sqrt(variance),
      min: Math.min(...clean),
      max: Math.max(...clean)
    };
  }

  function summarizeRows(rows, metric, windowSize = ROLLING_WINDOW_STEPS) {
    if (!metric || metric.type === "text") return null;
    const recent = Array.isArray(rows) ? rows.slice(-Math.max(1, windowSize)) : [];
    return numericSummary(recent.map((row) => metricValue(row, metric)));
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
    METRICS,
    ROLLING_WINDOW_STEPS,
    finite,
    gaitCycleTime,
    clinicalCadenceSpm,
    phasePercent,
    estimatedStepLengthM,
    metricById,
    metricValue,
    numericSummary,
    summarizeRows,
    sideFromMountPosition,
    formatNumber
  };

  return Object.freeze(api);
});
