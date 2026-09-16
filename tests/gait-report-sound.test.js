"use strict";

// examples/gait-report/sound.js（効果音）と app.js の配線の単体テスト。
// 実行: node tests/gait-report-sound.test.js

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Stats = require("../examples/gait-report/report.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}

const SOURCE = fs.readFileSync("examples/gait-report/sound.js", "utf8");

// AudioContext 互換の fake。予約された発音を記録する。
function fakeAudio(state = "running") {
  const log = { oscillators: [], resumed: 0 };
  class FakeParam {
    constructor() { this.value = 0; this.events = []; }
    setValueAtTime(v, t) { this.events.push(["set", v, t]); }
    exponentialRampToValueAtTime(v, t) { this.events.push(["ramp", v, t]); }
  }
  class FakeAudioContext {
    constructor() { this.currentTime = 10; this.state = state; this.destination = { id: "destination" }; log.contexts = (log.contexts || 0) + 1; }
    resume() { log.resumed += 1; this.state = "running"; return Promise.resolve(); }
    createOscillator() {
      const osc = { type: null, frequency: new FakeParam(), connected: null, started: null, stopped: null,
        connect(node) { this.connected = node; }, start(t) { this.started = t; }, stop(t) { this.stopped = t; } };
      log.oscillators.push(osc);
      return osc;
    }
    createGain() {
      return { gain: new FakeParam(), connected: null, connect(node) { this.connected = node; } };
    }
  }
  return { FakeAudioContext, log };
}

function fakeStorage(initial = {}) {
  const store = { ...initial };
  return {
    store,
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); }
  };
}

// ブラウザ相当の環境（document あり）として読み込む。document が無い Node では localStorage に触らない。
function loadSound(globals) {
  const ctx = vm.createContext({ document: {}, ...globals });
  vm.runInContext(SOURCE, ctx);
  return ctx.GaitReportSound;
}

// ---------------------------------------------------------------- cue definitions

test("cues are short positive tones; left and right steps differ in pitch", () => {
  const Sound = require("../examples/gait-report/sound.js");
  for (const name of ["start", "complete"]) {
    const tones = Sound.cueFor(name);
    assert.ok(Array.isArray(tones) && tones.length >= 2, `${name} has at least two tones`);
    for (const tone of tones) {
      assert.ok(tone.at >= 0 && tone.freq > 0 && tone.dur > 0 && tone.gain > 0 && tone.gain <= 0.5, JSON.stringify(tone));
    }
    const total = Math.max(...tones.map((t) => t.at + t.dur));
    assert.ok(total <= 0.6, `${name} finishes within 0.6 s (${total})`);
  }
  const left = Sound.cueFor("step", { side: "left" }), right = Sound.cueFor("step", { side: "right" });
  assert.equal(left.length, 1); assert.equal(right.length, 1);
  assert.ok(right[0].freq > left[0].freq, "right foot is the higher tone");
  assert.ok(left[0].dur <= 0.06, "step click is short");
  assert.deepEqual(Sound.cueFor("step"), left, "no side → left");
  assert.equal(Sound.cueFor("unknown"), null);
});

test("schedule() reserves one oscillator per tone with increasing start times and an envelope", () => {
  const Sound = require("../examples/gait-report/sound.js");
  const { FakeAudioContext, log } = fakeAudio();
  const context = new FakeAudioContext();
  const tones = Sound.cueFor("complete");
  assert.equal(Sound.schedule(context, tones), tones.length);
  assert.equal(log.oscillators.length, tones.length);
  let previousStart = -Infinity;
  log.oscillators.forEach((osc, i) => {
    assert.equal(osc.type, "sine");
    assert.equal(osc.frequency.value, tones[i].freq);
    assert.equal(osc.started, 10 + tones[i].at);
    assert.ok(osc.started > previousStart); previousStart = osc.started;
    assert.ok(osc.stopped > osc.started + tones[i].dur);
    assert.ok(osc.connected && osc.connected.gain, "oscillator → gain");
    assert.equal(osc.connected.connected, context.destination, "gain → destination");
    const ramps = osc.connected.gain.events.filter((e) => e[0] === "ramp");
    assert.equal(ramps.length, 2);
    assert.equal(ramps[0][1], tones[i].gain);
    assert.ok(ramps[1][1] > 0, "exponential ramps never target 0");
  });
});

// ---------------------------------------------------------------- play / enabled

test("play() lazily creates one AudioContext, resumes it when suspended, and schedules the cue", () => {
  const { FakeAudioContext, log } = fakeAudio("suspended");
  const Sound = loadSound({ AudioContext: FakeAudioContext, localStorage: fakeStorage() });
  assert.equal(Sound.isEnabled(), true, "enabled by default");
  assert.equal(Sound.play("start"), true);
  assert.equal(Sound.play("step", { side: "right" }), true);
  assert.equal(log.contexts, 1, "one context for the page");
  assert.ok(log.resumed >= 1, "suspended context is resumed");
  assert.equal(log.oscillators.length, Sound.cueFor("start").length + 1);
  assert.equal(Sound.play("unknown"), false);
});

test("setEnabled(false) silences play(), persists to localStorage and is honoured on the next load", () => {
  const storage = fakeStorage();
  const { FakeAudioContext, log } = fakeAudio();
  const Sound = loadSound({ AudioContext: FakeAudioContext, localStorage: storage });
  assert.equal(Sound.setEnabled(false), false);
  assert.equal(storage.store[Sound.STORAGE_KEY], "0");
  assert.equal(Sound.play("complete"), false);
  assert.equal(log.oscillators.length, 0);
  const reloaded = loadSound({ AudioContext: FakeAudioContext, localStorage: storage });
  assert.equal(reloaded.isEnabled(), false);
  assert.equal(reloaded.setEnabled(true), true);
  assert.equal(storage.store[Sound.STORAGE_KEY], "1");
  assert.equal(reloaded.play("complete"), true);
});

test("without AudioContext or with a broken localStorage, play() is a silent no-op", () => {
  const Sound = loadSound({ localStorage: { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } } });
  assert.equal(Sound.isEnabled(), true);
  assert.equal(Sound.play("start"), false);
  assert.equal(Sound.setEnabled(false), false, "state changes even when it cannot be persisted");
  const Failing = loadSound({ AudioContext: class { constructor() { throw new Error("denied"); } } });
  assert.equal(Failing.play("start"), false);
  // Node (no document): required directly, it must not touch globalThis.localStorage.
  const Direct = require("../examples/gait-report/sound.js");
  assert.equal(Direct.isEnabled(), true);
  assert.equal(Direct.setEnabled(false), false);
  assert.equal(Direct.setEnabled(true), true);
});

// ---------------------------------------------------------------- app.js wiring

function appHarness(withSound) {
  const nodes = new Map();
  const cues = [];
  let init;
  const node = (id) => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id, style: {}, dataset: {}, hidden: false, attributes: {}, classes: new Set(),
        classList: { add() {}, remove() {}, toggle(cls, on) { if (on) nodes.get(id).classes.add(cls); else nodes.get(id).classes.delete(cls); } },
        listeners: {},
        addEventListener(name, fn) { this.listeners[name] = fn; },
        setAttribute(name, value) { this.attributes[name] = value; }
      });
    }
    return nodes.get(id);
  };
  let enabled = true;
  const sound = withSound ? {
    play: (name, detail) => { cues.push([name, detail && detail.side]); return enabled; },
    isEnabled: () => enabled,
    setEnabled: (value) => { enabled = Boolean(value); return enabled; }
  } : undefined;
  const ctx = vm.createContext({
    GaitReportStats: Stats,
    GaitReportI18n: { getLanguage: () => "ja", t: (key) => key },
    ...(sound ? { GaitReportSound: sound } : {}),
    URLSearchParams, location: { search: "" }, Date,
    document: { getElementById: node, querySelector: node, addEventListener: (name, fn) => { if (name === "DOMContentLoaded") init = fn; } },
    addEventListener() {}, setInterval: () => 1, clearInterval() {},
    buildInsoleToolkit() {}, getInsoleToolkitSession: () => ({}), insoles: [{ setup() {} }, { setup() {} }],
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    dispatchEvent() {}
  });
  vm.runInContext(fs.readFileSync("examples/gait-report/app.js", "utf8"), ctx);
  init();
  return { app: ctx.GaitReportLive, cues, node, sound };
}

test("app.js plays start on Record, one step cue per recorded step with its side, and complete at 20/20", () => {
  const { app, cues } = appHarness(true);
  app.startDemo();
  assert.deepEqual(cues, [["start", undefined]]);
  for (let i = 0; i < 20; i++) for (const side of ["left", "right"]) app.handleStepRow(-1, app.demoRow(side, i + 1), { source: "demo", side });
  const steps = cues.filter((c) => c[0] === "step");
  assert.equal(steps.length, 40);
  assert.equal(steps.filter((c) => c[1] === "left").length, 20);
  assert.equal(steps.filter((c) => c[1] === "right").length, 20);
  assert.deepEqual(cues.at(-1), ["complete", undefined]);
  assert.equal(cues.filter((c) => c[0] === "complete").length, 1);
  // Steps after completion (not recorded) and steps before Record are silent.
  app.handleStepRow(-1, app.demoRow("left", 99), { source: "demo", side: "left" });
  assert.equal(cues.filter((c) => c[0] === "step").length, 40);
  app.clearData();
  app.handleStepRow(-1, app.demoRow("left", 1), { source: "demo", side: "left" });
  assert.equal(cues.filter((c) => c[0] === "step").length, 40);
});

test("the sound toggle button reflects and flips the enabled state; without sound.js it is hidden", () => {
  const { app, cues, node, sound } = appHarness(true);
  const button = node("sound-toggle");
  assert.equal(button.innerHTML, "soundOnHtml");
  assert.equal(button.attributes["aria-pressed"], "true");
  assert.ok(button.classes.has("active"));
  button.listeners.click();
  assert.equal(sound.isEnabled(), false);
  assert.equal(button.innerHTML, "soundOffHtml");
  assert.equal(button.attributes["aria-pressed"], "false");
  assert.ok(!button.classes.has("active"));
  const before = cues.length;
  app.toggleSound();
  assert.equal(sound.isEnabled(), true);
  assert.deepEqual(cues.at(-1), ["start", undefined], "turning sound on plays a confirmation cue");
  assert.equal(cues.length, before + 1);

  const silent = appHarness(false);
  assert.equal(silent.node("sound-toggle").hidden, true);
  silent.app.startDemo();
  assert.equal(silent.cues.length, 0);
});

console.log(`gait-report-sound: ${passed} tests passed`);
