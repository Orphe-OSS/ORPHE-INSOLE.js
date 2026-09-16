"use strict";

// examples/gait-report の CSV 保存（report.js の純関数 + app.js のボタン配線）の単体テスト。
// 実行: node tests/gait-report-csv.test.js

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Stats = require("../examples/gait-report/report.js");
const Gait = require("../src/InsoleGait.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}

// ---------------------------------------------------------------- 列定義

test("row columns match OrpheInsoleGait.CSV_HEADER (reference-implementation compatible order)", () => {
  assert.deepEqual([...Stats.ROW_CSV_FIELDS], Gait.CSV_HEADER.split(","));
  assert.equal(Stats.CSV_HEADER, `${Stats.META_CSV_FIELDS.join(",")},${Gait.CSV_HEADER}`);
});

test("every row column is produced by OrpheInsoleGait.buildGaitRow", () => {
  const row = Gait.buildGaitRow(7, {
    overview: { gait_type: "walk", stride_direction: "forward", calorie: 0.1, distance_m: 8.4, stance_phase_s: 0.66, swing_phase_s: 0.44 },
    stride: { foot_angle: 8.5, stride_x: 1.2, stride_y: 0.05, stride_z: 0.01 },
    pronation: { landing_force: 1.2, pronation_x: -5, pronation_y: -9, pronation_z: 1 }
  });
  for (const field of Stats.ROW_CSV_FIELDS) {
    assert.ok(Object.prototype.hasOwnProperty.call(row, field), `${field} exists on a gait row`);
  }
});

// ---------------------------------------------------------------- buildRowsCsv

function recorded(side, deviceId, receivedAt, overrides = {}) {
  return {
    step_number: 1,
    gait_type: "walk",
    stride_direction: "forward",
    distance_m: 1.25,
    stance_phase_s: 0.66,
    swing_phase_s: 0.44,
    duration_s: 1.1,
    cadence_hz: 1 / 1.1,
    speed_mps: 1.2 / 1.1,
    foot_angle_deg: 8.5,
    stride_x_m: 1.18,
    stride_y_m: -0.05,
    stride_z_m: 0.01,
    stride_norm_m: 1.2,
    landing_force: 1.2,
    strike_angle_deg: -5,
    foot_strike: "heelStrike",
    pronation_deg: -9,
    pronation_type: "neutral",
    pronation_z_deg: 1,
    calorie: 0.0015,
    _side: side,
    _device_id: deviceId,
    _received_at: receivedAt,
    ...overrides
  };
}

test("buildRowsCsv writes header + one line per recorded step, ordered by received time", () => {
  const t0 = Date.UTC(2026, 8, 16, 0, 0, 0);
  const csv = Stats.buildRowsCsv({
    left: [recorded("left", 0, t0 + 2000, { step_number: 2 }), recorded("left", 0, t0 + 4000, { step_number: 3 })],
    right: [recorded("right", 1, t0 + 1000, { step_number: 1 })]
  }, { source: "live" });
  const lines = csv.trimEnd().split("\n");
  assert.equal(lines.length, 4);
  assert.equal(lines[0], Stats.CSV_HEADER);
  assert.ok(csv.endsWith("\n"));
  const cells = lines.slice(1).map((line) => line.split(","));
  assert.deepEqual(cells.map((c) => c[0]), ["right", "left", "left"]);
  assert.deepEqual(cells.map((c) => c[1]), ["1", "0", "0"]);
  assert.deepEqual(cells.map((c) => c[2]), [
    "2026-09-16T00:00:01.000Z", "2026-09-16T00:00:02.000Z", "2026-09-16T00:00:04.000Z"
  ]);
  assert.deepEqual(cells.map((c) => c[3]), ["live", "live", "live"]);
  const stepIdx = Stats.META_CSV_FIELDS.length + Stats.ROW_CSV_FIELDS.indexOf("step_number");
  assert.deepEqual(cells.map((c) => c[stepIdx]), ["1", "2", "3"]);
  for (const c of cells) assert.equal(c.length, Stats.META_CSV_FIELDS.length + Stats.ROW_CSV_FIELDS.length);
});

test("buildRowsCsv formats like the SDK CSV: integers plain, floats 4 decimals, null/NaN empty", () => {
  const csv = Stats.buildRowsCsv({
    left: [recorded("left", 0, Date.UTC(2026, 0, 1), {
      step_number: 12, stride_norm_m: 1.23456789, landing_force: null, calorie: NaN, distance_m: -1
    })],
    right: []
  }, { source: "demo" });
  const cells = csv.trimEnd().split("\n")[1].split(",");
  const col = (name) => cells[Stats.META_CSV_FIELDS.length + Stats.ROW_CSV_FIELDS.indexOf(name)];
  assert.equal(col("step_number"), "12");
  assert.equal(col("stride_norm_m"), "1.2346");
  assert.equal(col("landing_force"), "");
  assert.equal(col("calorie"), "");
  // FW sentinel (-1) is written as-is: the CSV is raw data, exclusion happens in the report.
  assert.equal(col("distance_m"), "-1");
  assert.equal(col("foot_strike"), "heelStrike");
});

test("buildRowsCsv leaves device_id empty for demo rows (-1) and handles missing metadata", () => {
  const csv = Stats.buildRowsCsv({
    left: [recorded("left", -1, null)],
    right: [recorded("right", undefined, undefined)]
  });
  const cells = csv.trimEnd().split("\n").slice(1).map((line) => line.split(","));
  assert.deepEqual(cells.map((c) => c.slice(0, 4)), [["left", "", "", ""], ["right", "", "", ""]]);
});

test("buildRowsCsv quotes text cells containing commas or quotes", () => {
  const csv = Stats.buildRowsCsv({ left: [recorded("left", 0, 1, { gait_type: 'odd,"type"' })], right: [] });
  assert.ok(csv.includes('"odd,""type"""'));
});

test("buildRowsCsv with no rows returns just the header", () => {
  assert.equal(Stats.buildRowsCsv({ left: [], right: [] }), `${Stats.CSV_HEADER}\n`);
  assert.equal(Stats.buildRowsCsv(null), `${Stats.CSV_HEADER}\n`);
});

// ---------------------------------------------------------------- csvFilename

test("csvFilename uses the local start time and falls back for invalid input", () => {
  assert.equal(Stats.csvFilename(new Date(2026, 8, 16, 9, 5, 7)), "gait-report_20260916-090507.csv");
  assert.equal(Stats.csvFilename(new Date(2026, 8, 16, 9, 5, 7).getTime()), "gait-report_20260916-090507.csv");
  assert.equal(Stats.csvFilename("not a date"), "gait-report.csv");
  assert.match(Stats.csvFilename(undefined), /^gait-report_\d{8}-\d{6}\.csv$/);
});

// ---------------------------------------------------------------- app.js ボタン配線

test("app.js enables the CSV button only when steps are recorded and downloads the recorded rows", () => {
  const nodes = new Map();
  const clicks = [];
  const anchors = [];
  let init;
  const node = (id) => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id, style: {}, dataset: {}, disabled: false,
        classList: { add() {}, remove() {}, toggle() {} },
        listeners: {},
        addEventListener(name, fn) { this.listeners[name] = fn; }
      });
    }
    return nodes.get(id);
  };
  let blobText = null;
  const ctx = vm.createContext({
    GaitReportStats: Stats,
    GaitReportI18n: { getLanguage: () => "ja", t: (key) => key },
    URLSearchParams,
    location: { search: "" },
    Date,
    document: {
      getElementById: node,
      querySelector: node,
      addEventListener: (name, fn) => { if (name === "DOMContentLoaded") init = fn; },
      createElement: () => {
        const anchor = { style: {}, parentNode: null, click() { clicks.push(this.download); } };
        anchors.push(anchor);
        return anchor;
      },
      body: { appendChild(el) { el.parentNode = this; }, removeChild() {} }
    },
    Blob: class { constructor(parts) { blobText = parts.join(""); } },
    URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
    addEventListener() {}, setInterval: () => 1, clearInterval() {}, setTimeout: () => 1,
    buildInsoleToolkit() {}, getInsoleToolkitSession: () => ({}), insoles: [{ setup() {} }, { setup() {} }],
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    dispatchEvent() {}
  });
  vm.runInContext(fs.readFileSync("examples/gait-report/app.js", "utf8"), ctx);
  init();
  const app = ctx.GaitReportLive;
  const csvButton = node("csv-button");

  assert.equal(csvButton.disabled, true, "disabled before any step is recorded");
  assert.equal(typeof csvButton.listeners.click, "function", "click handler is wired");

  // Nothing recorded yet: clicking must be a no-op.
  csvButton.listeners.click();
  assert.equal(clicks.length, 0);

  // startDemo() starts recording with sessionSource = "demo" (the CSV `source` column follows the session).
  app.startDemo();
  assert.equal(csvButton.disabled, true, "still disabled with zero recorded steps");
  app.handleStepRow(-1, app.demoRow("left", 1), { source: "demo", side: "left" });
  assert.equal(csvButton.disabled, false, "enabled once a step is recorded (before completion)");

  csvButton.listeners.click();
  assert.equal(clicks.length, 1);
  assert.match(clicks[0], /^gait-report_\d{8}-\d{6}\.csv$/);
  assert.equal(anchors[0].parentNode, ctx.document.body, "anchor is attached before click");
  const lines = blobText.trimEnd().split("\n");
  assert.equal(lines[0], Stats.CSV_HEADER);
  assert.equal(lines.length, 2);
  assert.ok(lines[1].startsWith("left,,"), "demo rows have no device id");
  assert.equal(lines[1].split(",")[3], "demo");

  app.clearData();
  assert.equal(csvButton.disabled, true, "disabled again after clear");
});

console.log(`gait-report-csv: ${passed} tests passed`);
