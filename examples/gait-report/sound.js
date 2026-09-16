(function attachGaitReportSound(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.GaitReportSound = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createGaitReportSound(root) {
  "use strict";

  const STORAGE_KEY = "gait-report:sound";

  // 各キューは短い正弦波の連なり。at: 開始オフセット[s], freq: Hz, dur: 長さ[s], gain: 0..1
  const CUES = Object.freeze({
    start: Object.freeze([
      { at: 0, freq: 660, dur: 0.09, gain: 0.22 },
      { at: 0.12, freq: 880, dur: 0.12, gain: 0.22 }
    ]),
    // 1歩ごとのクリック。左右で音の高さを変え、耳だけで左右が交互に来ているか分かるようにする。
    step: Object.freeze({
      left: Object.freeze([{ at: 0, freq: 520, dur: 0.045, gain: 0.12 }]),
      right: Object.freeze([{ at: 0, freq: 740, dur: 0.045, gain: 0.12 }])
    }),
    complete: Object.freeze([
      { at: 0, freq: 523.25, dur: 0.12, gain: 0.22 },
      { at: 0.14, freq: 659.25, dur: 0.12, gain: 0.22 },
      { at: 0.28, freq: 783.99, dur: 0.24, gain: 0.24 }
    ])
  });

  function cueFor(name, detail) {
    const cue = CUES[name];
    if (!cue) return null;
    if (Array.isArray(cue)) return cue;
    return cue[detail && detail.side === "right" ? "right" : "left"];
  }

  // AudioContext 互換オブジェクトに対して発音を予約する（実 AudioContext でも fake でも動く純粋な手順）。
  function schedule(context, tones, destination) {
    const t0 = context.currentTime;
    for (const tone of tones) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = tone.freq;
      const start = t0 + tone.at;
      const end = start + tone.dur;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(destination || context.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
    }
    return tones.length;
  }

  // ブラウザ（document あり）でだけ localStorage に触る。Node の実験的 localStorage は参照だけで警告が出る。
  function storage() {
    return root.document && root.localStorage ? root.localStorage : null;
  }

  function readEnabled() {
    try {
      const store = storage();
      const stored = store ? store.getItem(STORAGE_KEY) : null;
      return stored === null || stored === undefined ? true : stored !== "0";
    } catch {
      return true;
    }
  }

  let enabled = readEnabled();
  let context = null;

  function isEnabled() {
    return enabled;
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    try {
      const store = storage();
      if (store) store.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      // 保存できない環境（プライベートモード等）では現在のページ内だけ有効
    }
    return enabled;
  }

  function ensureContext() {
    if (context) return context;
    const Ctor = root.AudioContext || root.webkitAudioContext;
    if (typeof Ctor !== "function") return null;
    try {
      context = new Ctor();
    } catch {
      context = null;
    }
    return context;
  }

  // 効果音を鳴らす。無効・未対応・自動再生ブロック時は何もせず false を返す（計測を止めない）。
  function play(name, detail) {
    if (!enabled) return false;
    const tones = cueFor(name, detail);
    if (!tones) return false;
    const ctx = ensureContext();
    if (!ctx) return false;
    if (ctx.state === "suspended" && typeof ctx.resume === "function") {
      const pending = ctx.resume();
      if (pending && typeof pending.catch === "function") pending.catch(() => null);
    }
    try {
      schedule(ctx, tones);
    } catch {
      return false;
    }
    return true;
  }

  return Object.freeze({ STORAGE_KEY, CUES, cueFor, schedule, play, isEnabled, setEnabled });
});
