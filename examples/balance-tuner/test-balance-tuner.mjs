import assert from "node:assert/strict";
import BalanceTuner from "./balance-tuner.js";

const {
  SensorLayout,
  validatePressureValues,
  computeFootState,
  combineFootStates,
  mapSonification,
  generateDemoFrame
} = BalanceTuner;

assert.equal(SensorLayout.length, 6);
assert.deepEqual(
  SensorLayout.map((sensor) => [Number(sensor.imageX.toFixed(4)), Number(sensor.imageY.toFixed(4))]),
  [
    [0.7596, 0.168],
    [0.7513, 0.332],
    [0.4024, 0.221],
    [0.5245, 0.3483],
    [0.2884, 0.3681],
    [0.5552, 0.8206]
  ]
);

const validPressure = validatePressureValues([100, 200, 300, 400, 500, 600]);
assert.equal(validPressure.valid, true);
assert.deepEqual(validPressure.values, [100, 200, 300, 400, 500, 600]);

const invalidPressure = validatePressureValues([100, -5, Number.NaN, 9000, 0, 1]);
assert.equal(invalidPressure.valid, false);
assert.equal(invalidPressure.values[1], 0);
assert.equal(invalidPressure.values[2], 0);
assert.equal(invalidPressure.values[3], 8192);

const leftFoot = computeFootState([1100, 1200, 1000, 900, 950, 850], "left");
const rightFoot = computeFootState([1100, 1200, 1000, 900, 950, 850], "right");
assert.equal(leftFoot.valid, true);
assert.equal(rightFoot.valid, true);
assert.ok(leftFoot.load > 0);
assert.ok(rightFoot.load > 0);
assert.ok(leftFoot.global.x < 0);
assert.ok(rightFoot.global.x > 0);

const balancedCenter = combineFootStates(leftFoot, rightFoot, { x: 0, y: 0 });
assert.ok(balancedCenter);
assert.ok(Math.abs(balancedCenter.leftRatio - 0.5) < 0.001);
assert.ok(Math.abs(balancedCenter.x) < 0.05);

const biasedCenter = combineFootStates(
  computeFootState([3000, 2800, 2400, 2000, 1800, 1600], "left"),
  computeFootState([200, 180, 160, 150, 140, 130], "right"),
  { x: 0, y: 0 }
);
assert.ok(biasedCenter.leftRatio > 0.9);

const tunerCenter = mapSonification(balancedCenter, "tuner");
const tunerEdge = mapSonification({ ...balancedCenter, x: 0.4, y: 0.32 }, "tuner");
assert.equal(tunerCenter.mode, "tuner");
assert.ok(tunerEdge.tension > tunerCenter.tension);
assert.ok(tunerEdge.wobbleDepth > tunerCenter.wobbleDepth);

const harmonyCenter = mapSonification(balancedCenter, "harmony");
const harmonyEdge = mapSonification(biasedCenter, "harmony");
assert.equal(harmonyCenter.mode, "harmony");
assert.ok(harmonyEdge.balanceError > harmonyCenter.balanceError);
assert.ok(harmonyEdge.wobbleDepth > harmonyCenter.wobbleDepth);

const demoFrame = generateDemoFrame(1.25);
assert.equal(demoFrame.left.length, 6);
assert.equal(demoFrame.right.length, 6);
assert.ok(demoFrame.left.every(Number.isFinite));
assert.ok(demoFrame.right.every(Number.isFinite));

console.log("balance-tuner tests passed");
