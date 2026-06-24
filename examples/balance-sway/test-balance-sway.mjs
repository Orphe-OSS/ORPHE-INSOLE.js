import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const BalanceSway = require("./balance-sway.js");

const leftFlat = [900, 900, 900, 900, 900, 900];
const rightFlat = [900, 900, 900, 900, 900, 900];

{
  const layout = BalanceSway.SensorLayout;
  assert.equal(layout.length, 6);
  assert.equal(layout[0].label, "P0");
  assert.equal(layout[1].label, "P1");
  assert.equal(layout[2].label, "P2");
  assert.equal(layout[4].label, "P4");
  assert.ok(layout[0].imageX > layout[2].imageX);
  assert.ok(layout[1].imageX > layout[4].imageX);
  assert.ok(layout[5].imageY > layout[3].imageY);
}

{
  const result = BalanceSway.validatePressureValues([1, 2, 3, 4, 5, 6]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.values, [1, 2, 3, 4, 5, 6]);
}

{
  const result = BalanceSway.validatePressureValues([1, -2, Number.NaN, 4, 9000, 6]);
  assert.equal(result.valid, false);
  assert.equal(result.values[1], 0);
  assert.equal(result.values[2], 0);
  assert.equal(result.values[4], 8192);
}

{
  const left = BalanceSway.computeFootCop(leftFlat, "left");
  const right = BalanceSway.computeFootCop(rightFlat, "right");
  const combined = BalanceSway.combineFootCops(
    { cop: left, load: left.load },
    { cop: right, load: right.load },
    { x: 0, y: 0 }
  );
  assert.ok(Math.abs(combined.x) < 0.02);
  assert.ok(Math.abs(combined.y) < 0.12);
  assert.equal(combined.paired, true);
}

{
  const metrics = BalanceSway.calculateSwayMetrics([
    { timestamp: 0, cop: { x: 0, y: 0 }, leftLoad: 50, rightLoad: 50, totalLoad: 100 },
    { timestamp: 1000, cop: { x: 0.1, y: 0 }, leftLoad: 50, rightLoad: 50, totalLoad: 100 },
    { timestamp: 2000, cop: { x: 0.1, y: 0.1 }, leftLoad: 50, rightLoad: 50, totalLoad: 100 }
  ]);
  assert.equal(metrics.count, 3);
  assert.ok(metrics.pathLength > 19.9 && metrics.pathLength < 20.1);
  assert.ok(metrics.meanVelocity > 9.9 && metrics.meanVelocity < 10.1);
  assert.equal(Math.round(metrics.leftLoadPercent), 50);
}

{
  const frame = BalanceSway.generateDemoFrame(12.34, "quiet");
  assert.equal(frame.left.length, 6);
  assert.equal(frame.right.length, 6);
  frame.left.concat(frame.right).forEach((value) => {
    assert.equal(Number.isFinite(value), true);
    assert.ok(value >= 0);
  });
}

console.log("balance-sway pure function tests passed");
