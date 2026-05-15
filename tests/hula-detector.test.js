const assert = require("node:assert/strict");
const {
  HulaEventDetector,
  HulaSessionRecorder,
  computeFootFeatures,
} = require("../examples/hula-motion-sonifier/hula-detector.js");

const pressure = {
  grounded: [34, 34, 34, 34, 54, 120],
  light: [8, 8, 8, 8, 5, 5],
  leftHeavy: [70, 70, 60, 60, 70, 100],
  rightHeavy: [70, 70, 60, 60, 70, 100],
  forefootPoint: [24, 24, 24, 24, 4, 0],
  support: [74, 74, 66, 66, 70, 120],
  heelsUp: [80, 80, 72, 72, 70, 5],
  swayLeft: [78, 72, 58, 58, 72, 88],
  swayRight: [52, 50, 46, 46, 58, 70],
  leleStep: [84, 92, 82, 94, 42, 24],
  leleSupport: [38, 38, 34, 34, 24, 32],
  amiMedial: [112, 104, 40, 44, 44, 48],
  amiLateral: [42, 46, 112, 88, 96, 44],
  amiFront: [112, 96, 108, 88, 42, 32],
  amiBack: [42, 48, 42, 48, 78, 156],
};

function createHarness(options) {
  const detector = new HulaEventDetector(options);
  let now = Date.now();
  return {
    step(left, right, dt = 260) {
      now += dt;
      const a = detector.updatePressure("left", left, now);
      const b = detector.updatePressure("right", right, now);
      return [...a.events, ...b.events];
    },
    motion(side, acc, dt = 40) {
      now += dt;
      return detector.updateMotion(side, "acc", acc, now).events;
    },
    detector,
  };
}

{
  const features = computeFootFeatures([1, 2, 3, 4, 5, 6], "right");
  assert.equal(features.total, 21);
  assert.equal(features.forefoot, 10);
  assert.equal(features.midfoot, 5);
  assert.equal(features.nonHeel, 15);
  assert.equal(features.heel, 6);
  assert.ok(features.cop.x > 0 && features.cop.x < 1);
  assert.ok(features.cop.y > 0 && features.cop.y < 1);
}

{
  const features = computeFootFeatures([10, 20, 30, 40, 50, 60], "right", [5, 4, 3, 2, 1, 0]);
  assert.deepEqual(features.pressure, [60, 50, 40, 30, 20, 10]);
  assert.deepEqual(features.sensorMap, [5, 4, 3, 2, 1, 0]);
}

{
  const harness = createHarness();
  harness.motion("left", { x: 0, y: 0, z: 1 });
  const events = harness.motion("left", { x: 0.12, y: 0.01, z: 1 }, 80);
  const kaholo = events.find((event) => event.type === "kaholo");
  assert.ok(kaholo, "Kāholo should fire on an initial lateral-biased IMU landing pulse");
  assert.equal(kaholo.phase, 1);
}

{
  const harness = createHarness();
  harness.motion("left", { x: 0, y: 0, z: 1 });
  const events = harness.motion("left", { x: 0.04, y: 0.11, z: 1 }, 80);
  const hela = events.find((event) => event.type === "hela");
  assert.ok(hela, "Hela should fire on an initial forward-biased IMU landing pulse");
  assert.equal(hela.side, "left");
  assert.equal(hela.phase, 1);
}

{
  const harness = createHarness();
  harness.motion("left", { x: 0, y: 0, z: 1 });
  const first = harness.motion("left", { x: 0.04, y: 0.11, z: 1 }, 80);
  harness.motion("left", { x: 0.04, y: 0.11, z: 1 }, 40);
  harness.motion("left", { x: 0.12, y: 0.35, z: 1 }, 120);
  harness.motion("left", { x: 0.12, y: 0.35, z: 1 }, 40);
  const held = harness.motion("left", { x: 0.16, y: 0.47, z: 1 }, 80);
  harness.motion("left", { x: 0.16, y: 0.47, z: 1 }, 800);
  const second = harness.motion("left", { x: 0.2, y: 0.58, z: 1 }, 80);
  harness.motion("left", { x: 0.2, y: 0.58, z: 1 }, 40);
  assert.equal(first.filter((event) => event.type === "hela").length, 1);
  assert.equal(held.filter((event) => event.type === "hela").length, 0, "Hela should not repeat inside the landing lockout");
  assert.equal(second.filter((event) => event.type === "hela").length, 1, "Hela should fire again after the landing lockout");
}

{
  const harness = createHarness({
    copLateralThreshold: 0.008,
    copForwardThreshold: 0.02,
  });
  const events = [];
  events.push(...harness.step(pressure.swayLeft, pressure.swayRight));
  events.push(...harness.step(pressure.swayRight, pressure.swayLeft));
  events.push(...harness.step(pressure.swayLeft, pressure.swayRight));
  events.push(...harness.step(pressure.swayRight, pressure.swayLeft));
  assert.equal(events.length, 0, "Lateral-only grounded sway should not fire a gesture event");
}

{
  const harness = createHarness({
    copLateralThreshold: 0.008,
    copForwardThreshold: 0.02,
    amiCopPath: 0.03,
    amiMaxLoadDelta: 0.4,
  });
  const events = [];
  events.push(...harness.step(pressure.amiMedial, pressure.amiLateral, 220));
  events.push(...harness.step(pressure.amiFront, pressure.amiFront, 220));
  events.push(...harness.step(pressure.amiLateral, pressure.amiMedial, 220));
  events.push(...harness.step(pressure.amiBack, pressure.amiBack, 220));
  events.push(...harness.step(pressure.amiMedial, pressure.amiLateral, 220));
  events.push(...harness.step(pressure.amiFront, pressure.amiFront, 220));
  const ami = events.find((event) => event.type === "ami");
  assert.ok(ami, "ʻAmi should fire for grounded circular CoP movement");
}

{
  const harness = createHarness();
  harness.motion("left", { x: 0, y: 0, z: 1 });
  harness.motion("left", { x: 0.01, y: 0.01, z: 1 });
  harness.step(pressure.grounded, pressure.grounded);
  assert.equal(harness.detector.currentGesture.type, "none");
}

{
  const recorder = new HulaSessionRecorder();
  recorder.start(1000);
  recorder.recordFrame({
    timestamp: 1100,
    feet: {
      left: computeFootFeatures(pressure.grounded, "left"),
      right: computeFootFeatures(pressure.grounded, "right"),
    },
    balance: { leftLoad: 0.5, rightLoad: 0.5 },
  });
  recorder.recordEvent({
    id: "hela-1",
    type: "hela",
    label: "Hela",
    side: "left",
    timestamp: 1200,
    reason: "test",
  });
  recorder.updateEventLabel("hela-1", "hela", "teacher confirmed");
  const json = recorder.toJSON();
  assert.equal(json.samples.length, 1);
  assert.equal(json.events.length, 1);
  assert.deepEqual(json.labels[0], {
    eventId: "hela-1",
    label: "hela",
    note: "teacher confirmed",
  });
}

console.log("hula-detector.test.js passed");
