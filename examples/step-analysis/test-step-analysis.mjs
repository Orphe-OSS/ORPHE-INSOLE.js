import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const metrics = require("./metrics.js");
const i18n = require("./i18n.js");

const reportLikeRow = {
  duration_s: 1.12,
  stance_phase_s: 0.678608,
  swing_phase_s: 0.441392,
  stride_norm_m: 0.99,
  speed_mps: 0.8839
};

assert.equal(metrics.gaitCycleTime(reportLikeRow), 1.12);
assert.ok(Math.abs(metrics.clinicalCadenceSpm(reportLikeRow) - 107.142857) < 1e-6);
assert.ok(Math.abs(metrics.phasePercent(reportLikeRow, "stance_phase_s") - 60.59) < 1e-6);
assert.equal(metrics.estimatedStepLengthM(reportLikeRow), 0.495);

const speedMetric = metrics.metricById("speed_mps");
const summary = metrics.summarizeRows([
  { speed_mps: 0.8 },
  { speed_mps: 1.0 },
  { speed_mps: 1.2 }
], speedMetric);
assert.equal(summary.count, 3);
assert.equal(summary.mean, 1);
assert.ok(Math.abs(summary.sd - 0.2) < 1e-12);

assert.equal(metrics.sideFromMountPosition(0, 1), "left");
assert.equal(metrics.sideFromMountPosition(1, 0), "right");
assert.equal(metrics.sideFromMountPosition(undefined, 1), "right");
assert.equal(metrics.gaitCycleTime({ duration_s: -1 }), null);
assert.equal(metrics.clinicalCadenceSpm({ duration_s: 0 }), null);
assert.equal(metrics.estimatedStepLengthM({ stride_norm_m: null }), null);

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const staticKeys = Array.from(html.matchAll(/data-i18n(?:-html|-aria-label)?="([^"]+)"/g))
  .map((match) => match[1]);
const dynamicKeys = [
  "summaryLatestClass", "summaryRecentMode", "summaryRecentNumeric", "summaryRecentEmpty",
  "sideStateWaiting", "sideStateConnected", "sideMeta", "sourceLiveTitle",
  "sourceDuplicateSide", "sourceLiveBoth", "sourceLiveOne", "sideLeft", "sideRight",
  "sourceStepMissingTitle", "sourceStepMissingDetail", "toolkitLoadErrorTitle",
  "toolkitLoadErrorDetail", "stepErrorTitle", "toolkitErrorTitle", "reconnectTitle",
  "reconnectWait", "reconnectAttempt", "reconnectFailedTitle", "reconnectFailedFallback",
  "demoBlockedTitle", "demoBlockedDetail", "demoPlayingTitle", "demoPlayingDetail",
  "trendSpeedLabel", "trendStepLengthLabel", "trendOldest", "trendLatest", "trendEmpty",
  "rawEmpty", "sourceNotification", "sourceCalculated", "sourceEstimated",
  "sourceClassification"
];
const textKeys = [
  "textWalk", "textRun", "textStance", "textNone", "textUnknown", "textForward",
  "textBackward", "textInside", "textOutside", "textHeelStrike", "textMidfoot",
  "textForefoot", "textNeutral", "textOver", "textSevereOver", "textUnder",
  "textSevereUnder"
];
const metricKeys = metrics.METRICS.flatMap((metric) => [
  `metric_${metric.id}_label`,
  `metric_${metric.id}_description`
]);

for (const language of ["ja", "en"]) {
  const strings = i18n.translations[language];
  for (const key of [...staticKeys, ...dynamicKeys, ...textKeys, ...metricKeys]) {
    assert.ok(strings[key], `${language} translation is missing: ${key}`);
  }
}

i18n.setLanguage("en", { notify: false });
assert.equal(i18n.t("textWalk"), "Walk");
assert.equal(
  i18n.t("sideMeta", { count: 3, state: "connected" }),
  "3 steps / connected"
);
i18n.setLanguage("ja", { notify: false });
assert.equal(i18n.t("textWalk"), "歩行");

console.log("step-analysis metrics and i18n tests passed");
