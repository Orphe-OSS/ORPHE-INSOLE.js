/**
 * INSOLE MUSIC SHOE — a hand-held gesture instrument for the ORPHE INSOLE.
 * Minimal, monochrome sound world: sine blips, clicks, noise bursts and
 * sub kicks, with an accumulated-light waveform visualizer.
 *
 * Interaction design (hand-held, v2):
 *   1. shake/strike downward with TOE pointing down   -> HAT
 *   2. shake/strike downward held FLAT                -> SNR
 *   3. shake/strike downward with HEEL pointing down  -> KIK
 *   4. twist around the long axis, ROLL +             -> MOD+ (modulation FX)
 *   5. twist around the long axis, ROLL −             -> MOD− (modulation FX)
 *   6. press individual FSR channels                  -> notes (gate on/off)
 *   +  spin flat like a turntable (yaw)               -> scratch on the deck
 *
 * L/R banks: the LEFT insole plays bank L (poly synth pad + one drum set),
 * the RIGHT insole plays bank R (mono synth lead + a different-timbre set).
 * Same gesture number = same sound category, different timbre per side.
 * Side comes from device_information.mount_position (fallback: id 0=L, 1=R).
 *
 * Detection notes:
 *   - Streaming mode 3 (200 Hz, gyro+acc+press). Orientation is derived from
 *     a low-passed gravity vector (time constant ~150 ms), which stays stable
 *     during strikes — Euler/quaternion is not required at this rate.
 *   - Strikes: windowed |acc| peak with re-arm hysteresis (the window max must
 *     fall back below a re-arm level before the next trigger), which prevents
 *     the ringing/oscillation of naive threshold triggers.
 *   - Twists: gyro integrated over a sliding window (accumulated degrees).
 *   - Cross-talk guards: right after a strike, note-ons and twist triggers are
 *     muted briefly (a strike also shakes FSRs and the gyro).
 *
 * TUNING STATUS: calibrated against recorded gestures (GESTURE LAB CSVs in
 * ./recordings/, L unit, 2026-07-12). Verified on data: strikes 8-9/9 hits
 * with 0 false triggers on idle/handling/fsr/yaw takes; twists separate
 * cleanly with return-swing suppression; scratch gate opens on yaw_spin only.
 * The R unit may need CAL (long axis) — record R-side takes to confirm.
 */

/* ================================================================ *
 *  Configuration — PROVISIONAL, retune with GESTURE LAB data
 * ================================================================ */

const TUNING = {
  // strikes (windowed |acc|-1 peak, in G)
  strikeWin: 10,          // frames @200 Hz = 50 ms
  strikeG: 1.9,           // trigger level
  strikeRearmG: 0.7,      // window max must fall below this to re-arm
  strikeRefractoryMs: 160,
  // orientation (low-passed gravity). Slow LP so the swing acceleration of a
  // flat shake doesn't drag the estimate toward the toe.
  // Trigger-moment dots across L+R recordings: flat -0.09..+0.49,
  // toe +0.40..+1.00, heel -1.00..-0.20 -> asymmetric thresholds:
  gravityAlpha: 0.005,    // per-sample LP (~1 s @200 Hz)
  toeDot: 0.55,           // dot above this = TOE (0 errors on flat takes)
  heelDot: -0.15,         // dot below this = HEEL
  // roll twist (integrated gyro around long axis, in degrees).
  // rollSign flips the rotation sense so the user's "roll +" fires MOD+
  // (CSV 2026-07-12: roll_plus produced negative window sums with axis -Y).
  twistWin: 24,           // frames @200 Hz = 120 ms
  twistDeg: 100,          // accumulated angle to trigger MOD
  twistRearmDeg: 25,      // |window sum| must fall below this to re-arm
  twistOppositeBlockMs: 700, // suppress the return swing (opposite direction)
  rollSign: -1,
  // a strike is ignored while a big twist is in progress (|window sum| deg)
  rollStrikeMuteDeg: 45,
  // FSR notes (raw ADC above baseline)
  // (CSV 2026-07-12: press deltas 308..997 counts, noise floor ±5 — the
  //  weakest channel peaked at 308, so 380 missed it)
  noteDelta: 200,
  noteOffRatio: 0.4,
  // turntable deck (yaw spin while flat): windowed mean |yaw| above
  // scratchOnDps AND dominant over roll rate (roll gestures leak ~280 dps of
  // yaw; genuine spins measured p95 ~380 dps).
  // Spin one way = play, the other way = reverse, wiggle = scratch.
  scratchOnDps: 150,
  scratchYawWin: 12,      // frames averaged for the gate
  scratchDominance: 2.5,  // |yawAvg| must exceed this x |rollRateAvg|
  spinRateDiv: 360,       // deg/s per 1.0x playback speed
  yawSign: 1,             // flip if clockwise plays in reverse on your unit
  // mix (linear gain multipliers, live-editable in the TUNE panel)
  mixDrums: 1.0,
  mixMod: 1.6,
  mixLead: 0.55,
  mixPad: 1.0,
  mixDeck: 1.0,
  // quantize grid for hits [s] when QUANT is on (0.125 = 16th @ 120 BPM)
  quantDiv: 0.125,
  // constant-latency scheduler: every gesture is time-stamped by the sensor
  // itself, and the sound is scheduled latencyBudgetMs after the moment the
  // gesture PHYSICALLY happened (relative to the fastest observed transport
  // path). BLE delivery jitter (0..50+ ms) is absorbed by the budget, so
  // every hit has the SAME total delay instead of a random one.
  // Lower = snappier but late packets break the constancy; higher = steadier.
  // Tune by feel in the TUNE panel; the ticker shows measured transport jitter.
  latencyBudgetMs: 70, // manual budget (used when latencyAuto = 0).
                       // measured 1-device: p95 ~86 ms; 2 devices share the
                       // radio and can reach p95 ~150 ms
  latencyAuto: 1,      // 1 = budget follows measured jitter p95 (+ margin,
                       // smoothed); 0 = use latencyBudgetMs as-is
  // cross-talk guards after a strike
  muteNotesMs: 130,
  muteTwistMs: 180,
  muteScratchMs: 220,
  // baseline tracking
  baselineAlpha: 0.003,
};

/** Pristine defaults + saved overrides from the TUNE panel (localStorage). */
const TUNING_DEFAULTS = { ...TUNING };
try {
  const saved = JSON.parse(localStorage.getItem('musicShoeTuning') || '{}');
  for (const k of Object.keys(saved)) {
    if (typeof TUNING[k] === 'number' && Number.isFinite(saved[k])) TUNING[k] = saved[k];
  }
} catch { /* ignore corrupt storage */ }

/** Note scales (A minor pentatonic): L = pad (low), R = lead (+1 octave). */
const SCALE = {
  L: [110.0, 130.81, 146.83, 164.81, 196.0, 220.0],
  R: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0],
};

/** Strike / mod tiles per lane (order = display order). */
const TILE_KINDS = [
  { kind: 'hat', name: 'HAT', jp: 'つま先下' },
  { kind: 'snr', name: 'SNR', jp: '水平' },
  { kind: 'kik', name: 'KIK', jp: '踵下' },
  { kind: 'modUp', name: 'MOD+', jp: 'ロール+' },
  { kind: 'modDown', name: 'MOD−', jp: 'ロール−' },
];

const KEYMAP = {
  L: { hits: { q: 'hat', w: 'snr', e: 'kik', a: 'modUp', s: 'modDown' }, notes: ['1', '2', '3', '4', '5', '6'] },
  R: { hits: { u: 'hat', i: 'snr', o: 'kik', j: 'modUp', k: 'modDown' }, notes: ['7', '8', '9', '0', '-', '='] },
};

/* ================================================================ *
 *  Shared state
 * ================================================================ */

const state = {
  connected: [false, false],
  sides: [null, null],        // 'L' | 'R' from mount_position
  hz: [0, 0],
  lost: 0,
  latest: [null, null],
  noteMeters: { L: [0, 0, 0, 0, 0, 0], R: [0, 0, 0, 0, 0, 0] },
  zone: ['—', '—'],           // per device: TOE | FLAT | HEEL
  rollDeg: [0, 0],
  gLP: [null, null],          // displayed gravity (from engine)
  scratchRate: 1,
  sens: 1.0,
};

function sensScaled(v) { return v / state.sens; }

/** Bank for a device: mount L/R first, id fallback, no double-booking. */
function bankOf(id) {
  const mine = state.sides[id];
  const other = state.sides[1 - id];
  if (mine === 'L' || mine === 'R') {
    if (mine === other && state.connected[1 - id] && id === 1) return mine === 'L' ? 'R' : 'L';
    return mine;
  }
  return id === 0 ? 'L' : 'R';
}

/* ================================================================ *
 *  Audio engine — electronic kit, two banks, dependency-free Web Audio
 * ================================================================ */

const Audio = {
  ctx: null, master: null, padBus: null, scratchBus: null,
  delaySend: null, analyser: null, drive: null,
  padSynth: null, leadSynth: null, padSynthLoop: null, leadSynthLoop: null,
  scratch: null, ready: false,

  async init() {
    if (this.ready) return;
    // latencyHint 0: ask for the smallest output buffer the device allows
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 0 });
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 24; comp.ratio.value = 4;
    comp.attack.value = 0.003; comp.release.value = 0.16;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    comp.connect(this.analyser).connect(ctx.destination);
    this.master = comp;

    this.padBus = ctx.createGain();
    this.padBus.gain.value = 0.9;
    this.padBus.connect(comp);

    this.scratchBus = ctx.createGain();
    this.scratchBus.gain.value = 1.0;
    this.scratchBus.connect(comp);

    // echo (feedback delay)
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.27;
    const fb = ctx.createGain(); fb.gain.value = 0.4;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 3200;
    delay.connect(tone).connect(fb).connect(delay);
    delay.connect(comp);
    this.delaySend = ctx.createGain();
    this.delaySend.gain.value = 0.22;
    this.delaySend.connect(delay);

    this.padSynth = new PadSynth(ctx, this.padBus, this.delaySend);
    this.leadSynth = new LeadSynth(ctx, this.padBus, this.delaySend);
    this.padSynthLoop = new PadSynth(ctx, this.padBus, this.delaySend);
    this.leadSynthLoop = new LeadSynth(ctx, this.padBus, this.delaySend);

    await ctx.resume();
    this.buildScratchDeck();
    this.ready = true;
  },

  noiseBuffer(ctx, seconds) {
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  },

  /* ---------- drum & FX voices: (ctx, dest, when, vel) ---------- */

  // KIK L: deep 808 sub (with a tiny click so the attack reads instantly)
  kikL(ctx, dest, when, vel = 1) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(150, when);
    o.frequency.exponentialRampToValueAtTime(40, when + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(1.0 * vel, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
    o.connect(g).connect(dest);
    o.start(when); o.stop(when + 0.55);
    const n = ctx.createBufferSource(); n.buffer = this.noiseBuffer(ctx, 0.006);
    const nf = ctx.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 1500;
    const ng = ctx.createGain(); ng.gain.value = 0.35 * vel;
    n.connect(nf).connect(ng).connect(dest);
    n.start(when);
  },

  // KIK R: hard techno punch (soft-clipped)
  kikR(ctx, dest, when, vel = 1) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(210, when);
    o.frequency.exponentialRampToValueAtTime(52, when + 0.055);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(1.2 * vel, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(257);
    for (let i = 0; i < 257; i++) curve[i] = Math.tanh((i / 128 - 1) * 2.2);
    shaper.curve = curve;
    const out = ctx.createGain(); out.gain.value = 0.8;
    o.connect(g).connect(shaper).connect(out).connect(dest);
    o.start(when); o.stop(when + 0.26);
    const n = ctx.createBufferSource(); n.buffer = this.noiseBuffer(ctx, 0.008);
    const nf = ctx.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 2000;
    const ng = ctx.createGain(); ng.gain.value = 0.5 * vel;
    n.connect(nf).connect(ng).connect(dest);
    n.start(when);
  },

  /** Pure sine blip — the basic particle of the sound world. */
  blip(ctx, dest, when, freq, dur = 0.03, vel = 1) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.5 * vel, when + 0.002);
    g.gain.setValueAtTime(0.5 * vel, when + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(dest);
    o.start(when); o.stop(when + dur + 0.02);
  },

  // SNR L: 909-ish
  snrL(ctx, dest, when, vel = 1) {
    const body = ctx.createOscillator(); body.type = 'triangle';
    body.frequency.setValueAtTime(192, when);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.45 * vel, when);
    bg.gain.exponentialRampToValueAtTime(0.001, when + 0.08);
    body.connect(bg).connect(dest);
    body.start(when); body.stop(when + 0.1);
    const n = ctx.createBufferSource(); n.buffer = this.noiseBuffer(ctx, 0.2);
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1750; nf.Q.value = 0.7;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.8 * vel, when);
    ng.gain.exponentialRampToValueAtTime(0.001, when + 0.17);
    n.connect(nf).connect(ng).connect(dest);
    n.start(when);
  },

  // SNR R: clap
  snrR(ctx, dest, when, vel = 1) {
    for (const [dt, amp] of [[0, 0.7], [0.013, 0.55], [0.027, 0.8]]) {
      const n = ctx.createBufferSource(); n.buffer = this.noiseBuffer(ctx, 0.03);
      const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1150; nf.Q.value = 1.4;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(amp * vel, when + dt);
      ng.gain.exponentialRampToValueAtTime(0.001, when + dt + 0.03);
      n.connect(nf).connect(ng).connect(dest);
      n.start(when + dt);
    }
    const tail = ctx.createBufferSource(); tail.buffer = this.noiseBuffer(ctx, 0.25);
    const tf = ctx.createBiquadFilter(); tf.type = 'bandpass'; tf.frequency.value = 1000; tf.Q.value = 0.9;
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.4 * vel, when + 0.03);
    tg.gain.exponentialRampToValueAtTime(0.001, when + 0.25);
    tail.connect(tf).connect(tg).connect(dest);
    tail.start(when + 0.03);
  },

  // HAT L: tight analog closed hat
  hatL(ctx, dest, when, vel = 1) {
    const n = ctx.createBufferSource(); n.buffer = this.noiseBuffer(ctx, 0.06);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 8500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.55 * vel, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.04);
    n.connect(hp).connect(g).connect(dest);
    n.start(when);
  },

  // HAT R: metallic (AM of two squares)
  hatR(ctx, dest, when, vel = 1) {
    const o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.value = 3629;
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 5417;
    const am = ctx.createGain(); am.gain.value = 0;
    o2.connect(am.gain);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4 * vel, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.07);
    o1.connect(am).connect(hp).connect(g).connect(dest);
    o1.start(when); o2.start(when);
    o1.stop(when + 0.09); o2.stop(when + 0.09);
  },

  // MOD+ L: big FM riser + noise whoosh — loud, deep modulation, long sustain (~1.5 s)
  modUpL(ctx, dest, when, vel = 1) {
    const car = ctx.createOscillator(); car.type = 'sine';
    car.frequency.setValueAtTime(150, when);
    car.frequency.exponentialRampToValueAtTime(640, when + 1.2);
    const car2 = ctx.createOscillator(); car2.type = 'sine';
    car2.frequency.setValueAtTime(226, when); // rising fifth above
    car2.frequency.exponentialRampToValueAtTime(962, when + 1.2);
    const mod = ctx.createOscillator(); mod.type = 'sine';
    mod.frequency.setValueAtTime(230, when);
    mod.frequency.exponentialRampToValueAtTime(1600, when + 1.2);
    const idx = ctx.createGain();
    idx.gain.setValueAtTime(680, when);
    idx.gain.exponentialRampToValueAtTime(60, when + 1.35);
    mod.connect(idx);
    idx.connect(car.frequency); idx.connect(car2.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.7 * vel, when + 0.015);
    g.gain.setValueAtTime(0.7 * vel, when + 1.0);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.5);
    const g2 = ctx.createGain(); g2.gain.value = 0.4;
    car.connect(g); car2.connect(g2).connect(g);
    g.connect(dest);
    // rising air
    const n = ctx.createBufferSource(); n.buffer = this.noiseBuffer(ctx, 1.5);
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.Q.value = 1.2;
    nf.frequency.setValueAtTime(400, when);
    nf.frequency.exponentialRampToValueAtTime(7500, when + 1.4);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.001, when);
    ng.gain.exponentialRampToValueAtTime(0.3 * vel, when + 0.8);
    ng.gain.exponentialRampToValueAtTime(0.001, when + 1.5);
    n.connect(nf).connect(ng).connect(dest);
    n.start(when);
    car.start(when); car2.start(when); mod.start(when);
    car.stop(when + 1.55); car2.stop(when + 1.55); mod.stop(when + 1.55);
  },

  // MOD+ R: screaming resonant riser, beating saws — hotter and longer (~1.5 s)
  modUpR(ctx, dest, when, vel = 1) {
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth';
    const o2 = ctx.createOscillator(); o2.type = 'sawtooth';
    o1.frequency.setValueAtTime(98, when);
    o1.frequency.linearRampToValueAtTime(147, when + 1.4); // +fifth slide
    o2.frequency.setValueAtTime(99, when);                  // faster beating
    o2.frequency.linearRampToValueAtTime(148.6, when + 1.4);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 20;
    f.frequency.setValueAtTime(220, when);
    f.frequency.exponentialRampToValueAtTime(4600, when + 1.35);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.72 * vel, when + 0.3);
    g.gain.setValueAtTime(0.72 * vel, when + 1.1);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.5);
    o1.connect(f); o2.connect(f);
    f.connect(g).connect(dest);
    o1.start(when); o2.start(when);
    o1.stop(when + 1.55); o2.stop(when + 1.55);
  },

  // MOD− L: dive bomb — long FM fall, wobble deepens hard (~1.5 s)
  modDownL(ctx, dest, when, vel = 1) {
    const car = ctx.createOscillator(); car.type = 'sine';
    car.frequency.setValueAtTime(880, when);
    car.frequency.exponentialRampToValueAtTime(48, when + 1.35);
    const mod = ctx.createOscillator(); mod.type = 'sine';
    mod.frequency.setValueAtTime(1320, when);
    mod.frequency.exponentialRampToValueAtTime(70, when + 1.35);
    const idx = ctx.createGain();
    idx.gain.setValueAtTime(720, when);
    idx.gain.exponentialRampToValueAtTime(20, when + 1.35);
    mod.connect(idx).connect(car.frequency);
    // wobble that deepens on the way down (whammy-bar feel)
    const lfo = ctx.createOscillator(); lfo.frequency.value = 6.2;
    const lfoG = ctx.createGain();
    lfoG.gain.setValueAtTime(2, when);
    lfoG.gain.linearRampToValueAtTime(110, when + 1.3);
    lfo.connect(lfoG).connect(car.detune);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.7 * vel, when + 0.015);
    g.gain.setValueAtTime(0.7 * vel, when + 1.05);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.5);
    car.connect(g).connect(dest);
    car.start(when); mod.start(when); lfo.start(when);
    car.stop(when + 1.55); mod.stop(when + 1.55); lfo.stop(when + 1.55);
  },

  // MOD− R: long laser fall landing on a sub boom (~1.4 s)
  modDownR(ctx, dest, when, vel = 1) {
    const o = ctx.createOscillator(); o.type = 'square';
    o.frequency.setValueAtTime(2400, when);
    o.frequency.exponentialRampToValueAtTime(80, when + 0.9);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.5 * vel, when + 0.01);
    g.gain.setValueAtTime(0.5 * vel, when + 0.78);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.95);
    o.connect(lp).connect(g).connect(dest);
    o.start(when); o.stop(when + 1.0);
    // impact: sub boom at the bottom of the fall
    const boomAt = when + 0.88;
    const sub = ctx.createOscillator(); sub.type = 'sine';
    sub.frequency.setValueAtTime(72, boomAt);
    sub.frequency.exponentialRampToValueAtTime(34, boomAt + 0.35);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, boomAt);
    sg.gain.exponentialRampToValueAtTime(1.0 * vel, boomAt + 0.006);
    sg.gain.exponentialRampToValueAtTime(0.0001, boomAt + 0.5);
    sub.connect(sg).connect(dest);
    sub.start(boomAt); sub.stop(boomAt + 0.55);
  },

  /** Fire a one-shot: bank 'L'|'R', kind 'hat'|'snr'|'kik'|'modUp'|'modDown'. */
  hit(bank, kind, vel = 1, when) {
    if (!this.ready) return;
    const t = when || this.ctx.currentTime;
    const voice = this[kind + bank];
    if (!voice) return;
    const hitBus = this.ctx.createGain();
    hitBus.gain.value = kind.startsWith('mod') ? TUNING.mixMod : TUNING.mixDrums;
    hitBus.connect(this.padBus);
    const echoAmt = { modUp: 0.4, modDown: 0.4, snr: 0.15 }[kind];
    if (echoAmt) {
      const send = this.ctx.createGain(); send.gain.value = echoAmt;
      hitBus.connect(send).connect(this.delaySend);
    }
    voice.call(this, this.ctx, hitBus, t, vel);
  },

  /** Sustained notes: L bank = poly pad, R bank = mono lead. */
  noteOn(bank, idx, vel = 0.8, when, tag = 'live') {
    if (!this.ready) return;
    const t = when || this.ctx.currentTime;
    const synth = bank === 'L'
      ? (tag === 'loop' ? this.padSynthLoop : this.padSynth)
      : (tag === 'loop' ? this.leadSynthLoop : this.leadSynth);
    synth.noteOn(SCALE[bank][idx], idx, vel, t);
  },

  noteOff(bank, idx, when, tag = 'live') {
    if (!this.ready) return;
    const t = when || this.ctx.currentTime;
    const synth = bank === 'L'
      ? (tag === 'loop' ? this.padSynthLoop : this.padSynth)
      : (tag === 'loop' ? this.leadSynthLoop : this.leadSynth);
    synth.noteOff(idx, t);
  },

  /* ---------- scratch deck ---------- */

  async buildScratchDeck() {
    const sr = this.ctx.sampleRate;
    const len = 2.0;
    const off = new OfflineAudioContext(2, Math.floor(sr * len), sr);
    const bus = off.createGain(); bus.gain.value = 0.85; bus.connect(off.destination);
    const step = 0.25; // 120 BPM 8ths
    for (let i = 0; i < 8; i++) this.hatL(off, bus, i * step + 0.125, i % 2 ? 0.4 : 0.6);
    this.kikR(off, bus, 0.0, 1); this.kikR(off, bus, 0.5, 0.95);
    this.kikR(off, bus, 1.0, 1); this.kikR(off, bus, 1.5, 0.95);
    this.snrL(off, bus, 0.5, 0.8); this.snrL(off, bus, 1.5, 0.9);
    this.blip(off, bus, 0.75, 1866, 0.05, 0.5);
    this.blip(off, bus, 1.75, 2489, 0.05, 0.45);
    const buffer = await off.startRendering();

    // reversed copy for backward playback (playbackRate cannot go negative)
    const rev = this.ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = rev.getChannelData(ch);
      for (let i = 0, n = src.length; i < n; i++) dst[i] = src[n - 1 - i];
    }

    const gain = this.ctx.createGain();
    gain.gain.value = 0; // fader closed until spun
    gain.connect(this.scratchBus);
    const send = this.ctx.createGain(); send.gain.value = 0.5;
    gain.connect(send).connect(this.delaySend);

    // ONE virtual record with a shared playhead. Direction changes restart
    // a source at the same position in the fwd/rev buffer, so wiggling
    // scrubs back and forth over the same groove — a real scratch — instead
    // of hopping between two unrelated free-running loops.
    this.scratch = {
      bufF: buffer, bufR: rev, len: buffer.duration,
      gain, node: null, dir: 1, rate: 1, pos: 0, lastT: null, open: false,
    };
  },

  /**
   * Turntable deck. Spin one way -> the record plays (speed follows the
   * spin), spin the other way -> reverse playback, wiggle back and forth ->
   * position-coherent scrubbing = scratch.
   */
  setScratch(dps, gateOpen) {
    const d = this.scratch;
    if (!this.ready || !d) return;
    const t = this.ctx.currentTime;
    const signed = dps * TUNING.yawSign;
    const dir = signed >= 0 ? 1 : -1;
    const rate = Math.min(3, Math.max(0.12, Math.abs(signed) / TUNING.spinRateDiv));

    // advance the virtual playhead while audible
    if (d.open && d.lastT !== null) {
      d.pos = (d.pos + d.dir * d.rate * (t - d.lastT)) % d.len;
      if (d.pos < 0) d.pos += d.len;
    }
    d.lastT = t;
    state.scratchRate = gateOpen ? dir * rate : 0;

    if (gateOpen && (!d.open || dir !== d.dir || !d.node)) {
      // (re)start at the shared playhead in the new direction
      if (d.node) { try { d.node.stop(t + 0.01); } catch { /* already stopped */ } }
      const src = this.ctx.createBufferSource();
      src.buffer = dir > 0 ? d.bufF : d.bufR;
      src.loop = true;
      src.playbackRate.value = rate;
      src.connect(d.gain);
      src.start(t, dir > 0 ? d.pos : d.len - d.pos);
      d.node = src; d.dir = dir;
      d.gain.gain.cancelScheduledValues(t);
      d.gain.gain.setTargetAtTime(0.8 * TUNING.mixDeck, t, 0.008);
    } else if (gateOpen) {
      d.node.playbackRate.setTargetAtTime(rate, t, 0.02);
      d.gain.gain.setTargetAtTime(0.8 * TUNING.mixDeck, t, 0.02);
    } else if (d.open) {
      d.gain.gain.setTargetAtTime(0, t, 0.06);
    }
    d.rate = rate;
    d.open = gateOpen;
  },

  setEcho(amount01) {
    if (this.ready) this.delaySend.gain.setTargetAtTime(0.5 * amount01, this.ctx.currentTime, 0.05);
  },

  /* ---------- hit quantize (QUANT button) ----------
   * Useful live, not just for loops: the first hit anchors a 16th grid and
   * every following hit snaps to it, so realtime playing locks into its own
   * groove (residual jitter + human timing get absorbed). Default ON. */
  quantOn: true,
  quantT0: null,

  /**
   * Snap a hit to the 16th grid. The first hit after enabling QUANT plays
   * immediately and anchors the grid, so the groove is self-consistent
   * (this is what removes BLE timing jitter musically).
   */
  quantTime(t) {
    if (!this.quantOn) return t;
    if (this.quantT0 === null) { this.quantT0 = t; return t; }
    const div = TUNING.quantDiv;
    const n = Math.ceil((t - this.quantT0 - 1e-4) / div);
    return this.quantT0 + n * div;
  },
};

/** Poly synth pad (bank L): pure sines (root + fifth + sub), slow attack. */
class PadSynth {
  constructor(ctx, dest, echoSend) {
    this.ctx = ctx; this.dest = dest; this.echoSend = echoSend;
    this.voices = new Map();
  }
  noteOn(freq, idx, vel, t) {
    if (this.voices.has(idx)) return;
    const ctx = this.ctx;
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 1.5; o2.detune.value = 3;
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = freq / 2;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.5;
    f.frequency.setValueAtTime(900 + vel * 2400, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.24 * TUNING.mixPad * (0.5 + vel * 0.5), t + 0.05);
    o1.connect(f);
    const o2g = ctx.createGain(); o2g.gain.value = 0.3;
    o2.connect(o2g).connect(f);
    const subG = ctx.createGain(); subG.gain.value = 0.4;
    sub.connect(subG).connect(f);
    f.connect(g).connect(this.dest);
    const send = ctx.createGain(); send.gain.value = 0.25;
    g.connect(send).connect(this.echoSend);
    o1.start(t); o2.start(t); sub.start(t);
    this.voices.set(idx, { o1, o2, sub, g });
  }
  noteOff(idx, t) {
    const v = this.voices.get(idx);
    if (!v) return;
    this.voices.delete(idx);
    v.g.gain.cancelScheduledValues(t);
    v.g.gain.setTargetAtTime(0.0001, t, 0.13);
    for (const o of [v.o1, v.o2, v.sub]) o.stop(t + 0.9);
  }
}

/** Mono synth lead (bank R): pure sine + octave, portamento, last-note priority. */
class LeadSynth {
  constructor(ctx, dest, echoSend) {
    this.ctx = ctx; this.dest = dest; this.echoSend = echoSend;
    this.stack = [];   // held notes: {idx, freq, vel}
    this.node = null;  // persistent voice
  }
  ensureVoice(t) {
    if (this.node) return;
    const ctx = this.ctx;
    const o1 = ctx.createOscillator(); o1.type = 'sine';
    const o2 = ctx.createOscillator(); o2.type = 'sine'; // octave above
    const o2g = ctx.createGain(); o2g.gain.value = 0.25;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.6;
    const lfoG = ctx.createGain(); lfoG.gain.value = 3; // subtle vibrato via detune
    lfo.connect(lfoG);
    lfoG.connect(o1.detune); lfoG.connect(o2.detune);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.7; f.frequency.value = 6000;
    const g = ctx.createGain(); g.gain.value = 0;
    o1.connect(f); o2.connect(o2g).connect(f);
    f.connect(g).connect(this.dest);
    const send = ctx.createGain(); send.gain.value = 0.35;
    g.connect(send).connect(this.echoSend);
    o1.start(t); o2.start(t); lfo.start(t);
    this.node = { o1, o2, f, g };
  }
  noteOn(freq, idx, vel, t) {
    this.ensureVoice(t);
    this.stack = this.stack.filter((n) => n.idx !== idx);
    this.stack.push({ idx, freq, vel });
    const first = this.node.g.gain.value < 0.01 && this.stack.length === 1;
    const porta = first ? 0.001 : 0.018; // ~portamento tau
    this.node.o1.frequency.setTargetAtTime(freq, t, porta);
    this.node.o2.frequency.setTargetAtTime(freq * 2, t, porta);
    this.node.f.frequency.setTargetAtTime(2500 + vel * 5000, t, 0.02);
    this.node.g.gain.cancelScheduledValues(t);
    this.node.g.gain.setTargetAtTime(0.34 * TUNING.mixLead * (0.5 + vel * 0.5), t, first ? 0.004 : 0.02);
  }
  noteOff(idx, t) {
    this.stack = this.stack.filter((n) => n.idx !== idx);
    if (!this.node) return;
    if (this.stack.length) {
      const top = this.stack[this.stack.length - 1];
      this.node.o1.frequency.setTargetAtTime(top.freq, t, 0.018);
      this.node.o2.frequency.setTargetAtTime(top.freq * 2, t, 0.018);
    } else {
      this.node.g.gain.setTargetAtTime(0.0001, t, 0.09);
    }
  }
}

/* ================================================================ *
 *  Constant-latency scheduler (jitter buffer)
 *
 *  Sensor samples carry device-clock timestamps (synced by the SDK at
 *  connect). We track the minimum observed (arrival - deviceTs) over a
 *  sliding window = the fastest transport path. An event that physically
 *  happened at deviceTs is then scheduled at:
 *      fastestPath + deviceTs + latencyBudgetMs
 *  so the gesture-to-sound delay is CONSTANT: transport jitter only decides
 *  how much of the budget is left, not when the sound plays. Packets later
 *  than the budget (rare stalls) play immediately as a fallback.
 * ================================================================ */

const SAMPLE_MS = 5; // mode 3: 4 samples per packet share a timestamp, 5 ms apart

const LatencySync = {
  // per device: each insole's clock is synced to the PC independently at
  // connect, so the fastest-path offset must be tracked per device
  devs: [
    { window: [], offsetMin: null },
    { window: [], offsetMin: null },
  ],
  jitP95: 0, // diagnostic: p95 of (delay - fastest) [ms], worst device
  autoBudget: 70, // smoothed adaptive budget [ms]
  _n: 0,

  /** Effective budget: adaptive (follows jitter) or the manual TUNING value. */
  budget() {
    return TUNING.latencyAuto >= 0.5 ? this.autoBudget : TUNING.latencyBudgetMs;
  },

  /** Feed with every sample's device timestamp. */
  add(devId, devTs) {
    const d = this.devs[devId];
    const now = performance.now();
    d.window.push({ t: now, d: now - devTs });
    while (d.window.length && now - d.window[0].t > 3000) d.window.shift();
    let m = Infinity;
    for (const e of d.window) if (e.d < m) m = e.d;
    d.offsetMin = m;
    if (++this._n % 100 === 0) {
      let worst = 0;
      for (const dev of this.devs) {
        if (dev.offsetMin === null || !dev.window.length) continue;
        const ds = dev.window.map((e) => e.d - dev.offsetMin).sort((a, b) => a - b);
        worst = Math.max(worst, ds[Math.floor(ds.length * 0.95)]);
      }
      this.jitP95 = worst;
      // adaptive budget: p95 + small margin, clamped, smoothed so the
      // latency drifts slowly instead of jumping (musically transparent)
      const target = Math.min(220, Math.max(40, worst * 1.1 + 10));
      this.autoBudget += (target - this.autoBudget) * 0.1;
    }
  },

  /** AudioContext time at which an event from deviceTs should sound. */
  ctxTimeFor(devId, devTs) {
    const d = this.devs[devId];
    if (!d || d.offsetMin === null || !Audio.ready) return 0;
    const playPerf = devTs + d.offsetMin + this.budget();
    const dt = (playPerf - performance.now()) / 1000;
    return Audio.ctx.currentTime + Math.max(0.002, dt); // late -> play now
  },
};

/* ================================================================ *
 *  Loop station — records hits and note on/off events
 * ================================================================ */

const Loop = {
  mode: 'EMPTY',      // EMPTY | REC | PLAY | OVERDUB | STOP
  events: [],          // { offset, type:'hit'|'on'|'off', bank, kind?, idx?, vel? }
  length: 0,
  startCtxTime: 0,
  timer: null,
  pointer: 0,

  now() { return Audio.ctx ? Audio.ctx.currentTime : 0; },

  rec() {
    if (!Audio.ready) return;
    if (this.mode === 'EMPTY' || this.mode === 'STOP') {
      this.events = []; this.length = 0;
      this.startCtxTime = this.now();
      this.mode = 'REC';
    } else if (this.mode === 'REC') {
      this.length = Math.max(0.5, this.now() - this.startCtxTime);
      this.closeDanglingNotes();
      this.startCtxTime = this.now();
      this.startScheduler();
      this.mode = 'PLAY';
    } else if (this.mode === 'PLAY') {
      this.mode = 'OVERDUB';
    } else if (this.mode === 'OVERDUB') {
      this.mode = 'PLAY';
    }
    updateLoopUI();
  },

  playStop() {
    if (this.mode === 'PLAY' || this.mode === 'OVERDUB') {
      this.stopScheduler(); this.mode = 'STOP';
    } else if (this.mode === 'STOP' && this.length > 0) {
      this.startCtxTime = this.now();
      this.startScheduler(); this.mode = 'PLAY';
    }
    updateLoopUI();
  },

  clear() {
    this.stopScheduler();
    this.mode = 'EMPTY'; this.events = []; this.length = 0;
    updateLoopUI();
  },

  capture(ev, at) {
    const t = at || this.now();
    if (this.mode === 'REC') {
      this.events.push({ ...ev, offset: t - this.startCtxTime });
    } else if (this.mode === 'OVERDUB' && this.length > 0) {
      this.events.push({ ...ev, offset: ((t - this.startCtxTime) % this.length + this.length) % this.length });
      this.events.sort((a, b) => a.offset - b.offset);
      this.pointer = this.findPointer();
    }
  },

  /** Ensure every captured note-on has a matching off inside the loop. */
  closeDanglingNotes() {
    const open = new Map();
    for (const e of this.events) {
      if (e.type === 'on') open.set(`${e.bank}:${e.idx}`, e);
      else if (e.type === 'off') open.delete(`${e.bank}:${e.idx}`);
    }
    for (const e of open.values()) {
      this.events.push({ type: 'off', bank: e.bank, idx: e.idx, offset: Math.max(0, this.length - 0.01) });
    }
  },

  findPointer() {
    const pos = (this.now() - this.startCtxTime) % this.length;
    const i = this.events.findIndex((e) => e.offset >= pos);
    return i < 0 ? 0 : i;
  },

  playEvent(e, at) {
    if (e.type === 'hit') {
      Audio.hit(e.bank, e.kind, e.vel, at);
      flashTile(e.bank, e.kind);
    } else if (e.type === 'on') {
      Audio.noteOn(e.bank, e.idx, e.vel, at, 'loop');
    } else if (e.type === 'off') {
      Audio.noteOff(e.bank, e.idx, at, 'loop');
    }
  },

  startScheduler() {
    this.stopScheduler();
    this.events.sort((a, b) => a.offset - b.offset);
    this.pointer = 0;
    const LOOKAHEAD = 0.12;
    this.timer = setInterval(() => {
      if (!this.length || !this.events.length) return;
      const horizon = this.now() + LOOKAHEAD;
      let guard = 0;
      while (guard++ < 512) {
        const cycles = Math.floor((this.now() - this.startCtxTime) / this.length);
        const e = this.events[this.pointer];
        let at = this.startCtxTime + cycles * this.length + e.offset;
        if (at < this.now() - 0.02) at += this.length;
        if (at >= horizon) break;
        this.playEvent(e, at);
        this.pointer = (this.pointer + 1) % this.events.length;
      }
    }, 30);
  },

  stopScheduler() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    // silence loop-owned sustained notes
    if (Audio.ready) {
      const t = Audio.ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        Audio.noteOff('L', i, t, 'loop');
        Audio.noteOff('R', i, t, 'loop');
      }
    }
  },

  progress() {
    if (this.mode === 'REC') return ((this.now() - this.startCtxTime) % 4) / 4;
    if (!this.length) return 0;
    return ((this.now() - this.startCtxTime) % this.length) / this.length;
  },
};

/* ================================================================ *
 *  Gesture engine — one per device
 * ================================================================ */

class GestureEngine {
  constructor(id) {
    this.id = id;
    // orientation
    this.g = null;                  // low-passed gravity [G]
    // long axis (+ = toe direction); CAL overwrites.
    // Default from gesture CSV 2026-07-12 (L unit): toe-down gravity was
    // (-0.29, -0.76, +0.58) => long axis ~ -Y. R unit may differ — use CAL.
    this.axis = { x: 0, y: -1, z: 0 };
    // strike
    this.accWin = [];
    this.armed = true;
    this.lastStrikeMs = 0;
    // twist
    this.rollWin = [];
    this.rollSum = 0;
    this.twistArmed = true;
    this.oppBlockUpUntil = 0;   // MOD+ blocked until (return-swing suppression)
    this.oppBlockDownUntil = 0; // MOD− blocked until
    // scratch
    this.yawWin = [];
    // notes
    this.base = new Array(6).fill(null);
    this.noteOn = new Array(6).fill(false);
    // cross-talk mutes
    this.muteNotesUntil = 0;
    this.muteTwistUntil = 0;
    this.muteScratchUntil = 0;
    this.muteStrikeUntil = 0;
  }

  /** Calibrate the long axis: hold TOE straight down and call this. */
  calibrateToeDown() {
    if (!this.g) return false;
    const m = Math.hypot(this.g.x, this.g.y, this.g.z);
    if (m < 0.5) return false;
    // gravity currently points along +long-axis (toe down) in sensor frame
    this.axis = { x: this.g.x / m, y: this.g.y / m, z: this.g.z / m };
    return true;
  }

  zeroSet(values) {
    if (values) for (let i = 0; i < 6; i++) this.base[i] = values[i];
  }

  zone() {
    if (!this.g) return '—';
    const m = Math.hypot(this.g.x, this.g.y, this.g.z) || 1;
    const d = (this.g.x * this.axis.x + this.g.y * this.axis.y + this.g.z * this.axis.z) / m;
    if (d > TUNING.toeDot) return 'TOE';
    if (d < TUNING.heelDot) return 'HEEL';
    return 'FLAT';
  }

  onAcc(acc) {
    const nowMs = performance.now();
    // gravity LP (stays put during brief strikes)
    if (!this.g) this.g = { x: acc.x, y: acc.y, z: acc.z };
    const a = TUNING.gravityAlpha;
    this.g.x += (acc.x - this.g.x) * a;
    this.g.y += (acc.y - this.g.y) * a;
    this.g.z += (acc.z - this.g.z) * a;
    state.zone[this.id] = this.zone();
    state.gLP[this.id] = this.g;

    // windowed strike detection with re-arm hysteresis
    const impact = Math.abs(Math.hypot(acc.x, acc.y, acc.z) - 1);
    this.accWin.push(impact);
    if (this.accWin.length > TUNING.strikeWin) this.accWin.shift();
    const winMax = Math.max(...this.accWin);

    if (this.armed
      && winMax > sensScaled(TUNING.strikeG)
      && nowMs - this.lastStrikeMs > TUNING.strikeRefractoryMs
      && nowMs > this.muteStrikeUntil
      && Math.abs(this.rollSum) < TUNING.rollStrikeMuteDeg) {
      this.armed = false;
      this.lastStrikeMs = nowMs;
      this.muteNotesUntil = nowMs + TUNING.muteNotesMs;
      this.muteTwistUntil = nowMs + TUNING.muteTwistMs;
      this.muteScratchUntil = nowMs + TUNING.muteScratchMs;
      const kind = { TOE: 'hat', FLAT: 'snr', HEEL: 'kik' }[state.zone[this.id]] || 'snr';
      const vel = Math.min(1, Math.max(0.35, winMax / 5));
      const devTs = acc.timestamp + acc.packet_number * SAMPLE_MS;
      triggerHit(bankOf(this.id), kind, vel, 'sensor', { devId: this.id, devTs });
    } else if (!this.armed && winMax < sensScaled(TUNING.strikeRearmG)) {
      this.armed = true;
    }
  }

  onGyro(gyro) {
    const nowMs = performance.now();
    const dt = 1 / 200; // mode 3 sample interval [s]

    // roll = rotation around the calibrated long axis (sign per TUNING.rollSign)
    const rollRate = TUNING.rollSign
      * (gyro.x * this.axis.x + gyro.y * this.axis.y + gyro.z * this.axis.z);
    const incr = rollRate * dt;
    this.rollWin.push(incr);
    this.rollSum += incr;
    if (this.rollWin.length > TUNING.twistWin) this.rollSum -= this.rollWin.shift();
    state.rollDeg[this.id] = this.rollSum;

    // twist: re-arm hysteresis + opposite-direction block so the return
    // swing of a quick twist doesn't fire the opposite MOD
    const devTs = gyro.timestamp + gyro.packet_number * SAMPLE_MS;
    if (this.twistArmed && nowMs > this.muteTwistUntil) {
      if (this.rollSum > TUNING.twistDeg && nowMs > this.oppBlockUpUntil) {
        this.fireTwist('modUp', nowMs, devTs);
        this.oppBlockDownUntil = nowMs + TUNING.twistOppositeBlockMs;
      } else if (this.rollSum < -TUNING.twistDeg && nowMs > this.oppBlockDownUntil) {
        this.fireTwist('modDown', nowMs, devTs);
        this.oppBlockUpUntil = nowMs + TUNING.twistOppositeBlockMs;
      }
    } else if (!this.twistArmed && Math.abs(this.rollSum) < TUNING.twistRearmDeg) {
      this.twistArmed = true;
    }

    // scratch: yaw spin while FLAT (turntable move). Windowed mean plus a
    // dominance test over the roll rate so twist gestures don't open it.
    this.yawWin.push(gyro.z);
    if (this.yawWin.length > TUNING.scratchYawWin) this.yawWin.shift();
    const yawAvg = this.yawWin.reduce((a, b) => a + b, 0) / this.yawWin.length;
    const rollRateAvg = this.rollSum / (TUNING.twistWin * dt); // window mean [dps]
    const gate = state.zone[this.id] === 'FLAT'
      && nowMs > this.muteScratchUntil
      && Math.abs(yawAvg) > sensScaled(TUNING.scratchOnDps)
      && Math.abs(yawAvg) > TUNING.scratchDominance * Math.abs(rollRateAvg);
    Audio.setScratch(yawAvg, gate);
  }

  fireTwist(kind, nowMs, devTs) {
    this.twistArmed = false;
    this.muteScratchUntil = nowMs + 400;
    this.muteStrikeUntil = nowMs + 250;
    triggerHit(bankOf(this.id), kind, 0.9, 'sensor', { devId: this.id, devTs });
  }

  onPress(press) {
    const nowMs = performance.now();
    const bank = bankOf(this.id);
    const delta = sensScaled(TUNING.noteDelta);
    const devTs = press.timestamp + press.packet_number * SAMPLE_MS;
    LatencySync.add(this.id, devTs);
    for (let i = 0; i < 6; i++) {
      const v = press.values[i];
      if (this.base[i] === null) this.base[i] = v;
      const n = Math.max(0, v - this.base[i]);
      if (n < delta * 0.3) this.base[i] += (v - this.base[i]) * TUNING.baselineAlpha;
      state.noteMeters[bank][i] = Math.min(1.4, n / delta);

      if (!this.noteOn[i] && n > delta && nowMs > this.muteNotesUntil) {
        this.noteOn[i] = true;
        const vel = Math.min(1, Math.max(0.3, n / (delta * 2.2)));
        triggerNoteOn(bank, i, vel, 'sensor', { devId: this.id, devTs });
      } else if (this.noteOn[i] && n < delta * TUNING.noteOffRatio) {
        this.noteOn[i] = false;
        triggerNoteOff(bank, i, 'sensor', { devId: this.id, devTs });
      }
    }
  }
}

const engines = [new GestureEngine(0), new GestureEngine(1)];

/* ================================================================ *
 *  Trigger entry points (sensors / UI / keyboard / loop)
 * ================================================================ */

function triggerHit(bank, kind, vel, source, stamp) {
  if (!Audio.ready) return;
  // sensor events: constant-latency schedule from the device timestamp;
  // UI/keyboard events: immediate
  let at = stamp ? (LatencySync.ctxTimeFor(stamp.devId, stamp.devTs) || Audio.ctx.currentTime)
    : Audio.ctx.currentTime;
  at = Audio.quantTime(at);
  Audio.hit(bank, kind, vel, at);
  if (source !== 'loop') Loop.capture({ type: 'hit', bank, kind, vel }, at);
  // sync the visuals to the scheduled sound
  const delayMs = Math.max(0, (at - Audio.ctx.currentTime) * 1000);
  setTimeout(() => { flashTile(bank, kind); Paint.hit(bank, kind, vel); }, delayMs);
}

function triggerNoteOn(bank, idx, vel, source, stamp) {
  if (!Audio.ready) return;
  const at = stamp ? (LatencySync.ctxTimeFor(stamp.devId, stamp.devTs) || undefined) : undefined;
  Audio.noteOn(bank, idx, vel, at);
  if (source !== 'loop') Loop.capture({ type: 'on', bank, idx, vel }, at);
  setNoteCell(bank, idx, true);
  Paint.noteOn(bank, idx, vel);
}

function triggerNoteOff(bank, idx, source, stamp) {
  if (!Audio.ready) return;
  const at = stamp ? (LatencySync.ctxTimeFor(stamp.devId, stamp.devTs) || undefined) : undefined;
  Audio.noteOff(bank, idx, at);
  if (source !== 'loop') Loop.capture({ type: 'off', bank, idx }, at);
  setNoteCell(bank, idx, false);
  Paint.noteOff(bank, idx);
}

/* ================================================================ *
 *  UI
 * ================================================================ */

const $ = (id) => document.getElementById(id);
const tiles = { L: {}, R: {} };
const noteCells = { L: [], R: [] };

function buildLanes() {
  const wrap = $('lanes');
  for (const bank of ['L', 'R']) {
    const lane = document.createElement('div');
    lane.className = 'lane';
    const head = document.createElement('div');
    head.className = 'lane-head';
    head.innerHTML = `
      <span class="bank">${bank}</span>
      <span class="desc">${bank === 'L' ? 'PAD BANK<br>SUB / NOISE / CLICK' : 'LEAD BANK<br>PUNCH / BURST / BLIP'}</span>
      <span class="desc" id="lane_dev_${bank}">device: —</span>`;
    lane.appendChild(head);

    for (const tk of TILE_KINDS) {
      const el = document.createElement('div');
      el.className = 'tile' + (tk.kind.startsWith('mod') ? ' gesture' : '');
      const key = Object.entries(KEYMAP[bank].hits).find(([, v]) => v === tk.kind)[0];
      el.innerHTML = `<div class="name">${tk.name}</div><div class="jp">${tk.jp}</div><span class="key">[${key.toUpperCase()}]</span>`;
      el.addEventListener('pointerdown', async () => {
        await Audio.init(); armAudioButton();
        triggerHit(bank, tk.kind, 0.9, 'ui');
      });
      lane.appendChild(el);
      tiles[bank][tk.kind] = el;
    }

    const cells = document.createElement('div');
    cells.className = 'note-cells';
    for (let i = 0; i < 6; i++) {
      const c = document.createElement('div');
      c.className = 'note-cell';
      c.innerHTML = `
        <div class="meter"></div><div class="th-line"></div>
        <div class="name">N${i + 1}</div>
        <span class="key">[${KEYMAP[bank].notes[i]}]</span><span class="ch">CH${i}</span>`;
      c.addEventListener('pointerdown', async () => {
        await Audio.init(); armAudioButton();
        triggerNoteOn(bank, i, 0.85, 'ui');
      });
      const release = () => { if (Audio.ready) triggerNoteOff(bank, i, 'ui'); };
      c.addEventListener('pointerup', release);
      c.addEventListener('pointerleave', release);
      cells.appendChild(c);
      noteCells[bank].push(c);
    }
    lane.appendChild(cells);
    wrap.appendChild(lane);
  }
}

function flashTile(bank, kind) {
  const el = tiles[bank] && tiles[bank][kind];
  if (!el) return;
  el.classList.add('hit');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('hit'), 120);
}

function setNoteCell(bank, idx, on) {
  const el = noteCells[bank][idx];
  if (el) el.classList.toggle('sounding', on);
}

function updateLoopUI() {
  const rec = $('loop_rec'), play = $('loop_play'), stat = $('loop_stat');
  rec.classList.toggle('rec-armed', Loop.mode === 'REC' || Loop.mode === 'OVERDUB');
  play.classList.toggle('active-volt', Loop.mode === 'PLAY' || Loop.mode === 'OVERDUB');
  play.innerHTML = (Loop.mode === 'PLAY' || Loop.mode === 'OVERDUB')
    ? '<i class="bi bi-stop-fill"></i> STOP' : '<i class="bi bi-play-fill"></i> PLAY';
  stat.textContent = `${Loop.mode}${Loop.length ? ` ${Loop.length.toFixed(2)}s` : ''} / ${Loop.events.length} EV`;
  const marks = $('loop_marks');
  marks.innerHTML = '';
  if (Loop.length > 0) {
    for (const e of Loop.events) {
      if (e.type === 'off') continue;
      const m = document.createElement('div');
      m.className = 'mark';
      m.style.left = `${(e.offset / Loop.length) * 100}%`;
      marks.appendChild(m);
    }
  }
}

function armAudioButton() {
  const b = $('audio_start');
  if (Audio.ready && !b.classList.contains('armed')) {
    b.classList.add('armed');
    b.innerHTML = '<i class="bi bi-soundwave"></i> LIVE';
  }
}

/* ---------- TUNE panel: edit TUNING live, persist, copy as JSON ---------- */

function saveTuning() {
  const diff = {};
  for (const k of Object.keys(TUNING)) {
    if (typeof TUNING[k] === 'number' && TUNING[k] !== TUNING_DEFAULTS[k]) diff[k] = TUNING[k];
  }
  localStorage.setItem('musicShoeTuning', JSON.stringify(diff));
}

function buildTunePanel() {
  const wrap = document.querySelector('.ms-wrap');
  const det = document.createElement('details');
  det.className = 'panel';
  det.style.marginTop = '10px';
  det.innerHTML = `
    <summary class="panel-label" style="cursor:pointer;margin-bottom:0">
      TUNE — パラメータ調整（即反映・自動保存。良い値になったら COPY JSON で共有）</summary>
    <div id="tune_grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
      gap:6px 16px;font-family:var(--mono);font-size:10.5px;margin-top:10px;"></div>
    <div style="margin-top:10px;display:flex;gap:8px;align-items:center;">
      <button class="btn-ms" id="tune_copy"><i class="bi bi-clipboard"></i> COPY JSON</button>
      <button class="btn-ms" id="tune_reset">RESET DEFAULTS</button>
      <span class="loop-stat" id="tune_stat"></span>
    </div>`;
  wrap.insertBefore(det, wrap.querySelector('.credit'));

  const grid = det.querySelector('#tune_grid');
  for (const k of Object.keys(TUNING)) {
    if (typeof TUNING[k] !== 'number') continue;
    const row = document.createElement('label');
    row.style.cssText = 'display:flex;justify-content:space-between;gap:6px;align-items:center;color:var(--ink-dim);';
    const name = document.createElement('span');
    name.textContent = k;
    if (TUNING[k] !== TUNING_DEFAULTS[k]) name.style.color = 'var(--volt)';
    const inp = document.createElement('input');
    inp.type = 'number'; inp.step = 'any'; inp.value = TUNING[k];
    inp.style.cssText = 'width:84px;background:#101214;color:var(--ink);border:1px solid var(--panel-edge);border-radius:2px;font-size:10.5px;padding:2px 5px;';
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value);
      if (Number.isFinite(v)) {
        TUNING[k] = v;
        name.style.color = v !== TUNING_DEFAULTS[k] ? 'var(--volt)' : 'var(--ink-dim)';
        saveTuning();
      }
    });
    row.appendChild(name); row.appendChild(inp);
    grid.appendChild(row);
  }

  det.querySelector('#tune_copy').addEventListener('click', async () => {
    const diff = {};
    for (const k of Object.keys(TUNING)) {
      if (typeof TUNING[k] === 'number' && TUNING[k] !== TUNING_DEFAULTS[k]) diff[k] = TUNING[k];
    }
    const json = JSON.stringify(diff, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      $('tune_stat').textContent = 'copied — そのままチャットに貼ってOK';
    } catch {
      window.prompt('copy:', json);
    }
    setTimeout(() => { $('tune_stat').textContent = ''; }, 2500);
  });
  det.querySelector('#tune_reset').addEventListener('click', () => {
    localStorage.removeItem('musicShoeTuning');
    location.reload();
  });
}

function updateLaneDevices() {
  for (const bank of ['L', 'R']) {
    let text = 'device: —';
    for (let i = 0; i < 2; i++) {
      if (state.connected[i] && bankOf(i) === bank) {
        text = `device: D${i}${state.sides[i] ? ` (${state.sides[i]})` : ''}`;
      }
    }
    const el = $(`lane_dev_${bank}`);
    if (el) el.innerHTML = text;
  }
}

/* ---------- canvas rendering ---------- */

const scopeCanvas = $('scope_canvas');
const deckCanvas = $('deck_canvas');
let discAngle = 0;
let lastFrame = performance.now();
let tickerLast = 0;

/* ---------- LIGHT SCOPE — accumulated waveform light ----------
 * Minimal monochrome visualizer: the live waveform is drawn every frame as
 * a faint white thread of light with ADDITIVE blending onto a black canvas
 * that fades slowly — like a long-exposure photograph. Overlapping sound
 * stacks brightness (sound pressure = luminance, residue accumulates).
 * Hits strobe hard (full-field flash + flickering high-gain trace);
 * scratch and roll twists warp the thread into undulating wisps.
 * Everything is black & white — variation comes from the wave shape and
 * the way it is drawn, never from color.
 */
const Paint = {
  inited: false,
  flashEnv: 0,      // onset strobe envelope
  jump: 0,          // baseline kick on hits
  drift: Math.random() * 100,
  warpPhase: 0,
  warps: [],        // roll-twist wisps: {age, dur, dir, x0, seed}
  heldNotes: new Map(), // `${bank}:${idx}` -> idx (extra faint bands)
  specks: [],       // white dust: {x, y, n, spread, a}
  frame: 0,

  hit(bank, kind, vel) {
    this.flashEnv = Math.min(1.6, Math.max(this.flashEnv, 0.55 + vel * 0.7));
    this.jump = (Math.random() - 0.5) * 0.6; // fraction of height
    this.specks.push({ x: Math.random(), y: 0.5 + this.jump * 0.5, n: 20 + (vel * 40) | 0, spread: 0.35, a: 0.25 + vel * 0.3 });
    if (kind === 'modUp' || kind === 'modDown') {
      this.warps.push({
        age: 0, dur: 1.0, dir: kind === 'modUp' ? -1 : 1,
        x0: 0.15 + Math.random() * 0.7, seed: Math.random() * 10,
      });
    }
  },

  noteOn(bank, idx) { this.heldNotes.set(`${bank}:${idx}`, idx); },
  noteOff(bank, idx) { this.heldNotes.delete(`${bank}:${idx}`); },

  /** One waveform pass: y(x) = base + wave*amp + warp ripple. */
  tracePass(ctx2d, data, w, h, baseY, amp, warpAmp, alpha, lw) {
    if (alpha <= 0.003) return;
    ctx2d.strokeStyle = `rgba(255,255,255,${Math.min(1, alpha)})`;
    ctx2d.lineWidth = lw;
    ctx2d.beginPath();
    const step = Math.ceil(data.length / (w / 2));
    for (let x = 0, i = 0; x <= w; x += 2, i += step) {
      const v = (data[Math.min(i, data.length - 1)] - 128) / 128;
      let y = baseY + v * amp;
      if (warpAmp > 0) y += Math.sin(x * 0.02 + this.warpPhase) * warpAmp;
      if (x === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
    }
    ctx2d.stroke();
  },

  draw(ctx2d, w, h, dt) {
    this.frame++;
    if (!this.inited) {
      ctx2d.globalCompositeOperation = 'source-over';
      ctx2d.fillStyle = '#000';
      ctx2d.fillRect(0, 0, w, h);
      this.inited = true;
    }
    // slow decay — the residue of past sound keeps glowing
    ctx2d.globalCompositeOperation = 'source-over';
    ctx2d.fillStyle = 'rgba(0,0,0,0.028)';
    ctx2d.fillRect(0, 0, w, h);

    if (!Audio.ready) {
      ctx2d.fillStyle = 'rgba(255,255,255,0.35)';
      ctx2d.font = '12px monospace';
      ctx2d.fillText('PRESS "PLUG IN" TO START AUDIO', 16, h / 2);
      return;
    }

    const data = new Uint8Array(Audio.analyser.fftSize);
    Audio.analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 8) { const v = (data[i] - 128) / 128; sum += v * v; }
    const level = Math.min(1, Math.sqrt(sum / (data.length / 8)) * 3);

    // light accumulates additively: overlap = brighter
    ctx2d.globalCompositeOperation = 'lighter';
    ctx2d.lineCap = 'round';

    // strobe: hard flicker while the flash envelope is hot
    const strobe = this.flashEnv > 0.25 && this.frame % 2 === 0 ? 0.3 : 1;
    const flash = this.flashEnv * strobe;

    // wandering baseline (accumulation spreads into a band of filaments).
    // Faster wander + per-frame jitter keep successive traces from landing
    // on top of each other — that separation is what reads as "threads".
    this.drift += dt * (0.9 + level * 2.2);
    this.jump *= 0.9;
    const baseY = h * (0.5
      + Math.sin(this.drift) * 0.10
      + Math.sin(this.drift * 3.1 + 1.7) * 0.045
      + this.jump * 0.35)
      + (Math.random() - 0.5) * (2 + level * 7);
    const amp = h * 0.30 * (0.3 + level * 1.5 + flash * 0.9);

    // scratch / continuous spin -> the thread itself undulates
    const scr = state.scratchRate;
    const warpAmp = scr !== 0 ? h * 0.10 * Math.min(2.2, 0.6 + Math.abs(scr)) : 0;
    this.warpPhase += scr * dt * 22 + dt * 1.2;

    const audible = level > 0.015 || flash > 0.05;
    if (audible) {
      // one narrow halo, then a fan of crisp thin filaments
      this.tracePass(ctx2d, data, w, h, baseY, amp, warpAmp,
        0.02 + level * 0.05 + flash * 0.08, 3.2);
      const fan = 3;
      for (let k = 0; k < fan; k++) {
        const off = (k - (fan - 1) / 2) * (2.5 + level * 9);
        const ampK = amp * (0.9 + k * 0.09);
        const aK = (0.10 + level * 0.24 + flash * 0.45) * (k === 1 ? 1 : 0.55);
        this.tracePass(ctx2d, data, w, h, baseY + off, ampK, warpAmp, aK, 0.7);
      }

      // held notes: extra faint filaments stacked above/below (layered light)
      for (const idx of this.heldNotes.values()) {
        const ny = h * (0.22 + (idx % 6) * 0.11) + (Math.random() - 0.5) * 3;
        this.tracePass(ctx2d, data, w, h, ny, amp * 0.45, warpAmp * 0.6,
          0.05 + level * 0.14, 0.7);
      }
    }

    // roll-twist wisps: undulating vertical curls (rise for MOD+, fall for MOD−)
    for (let i = this.warps.length - 1; i >= 0; i--) {
      const wp = this.warps[i];
      wp.age += dt;
      const t = wp.age / wp.dur;
      if (t >= 1) { this.warps.splice(i, 1); continue; }
      const a = (1 - t) * 0.4;
      for (const pass of [{ lw: 5, k: 0.25 }, { lw: 1.1, k: 1 }]) {
        ctx2d.strokeStyle = `rgba(255,255,255,${a * pass.k})`;
        ctx2d.lineWidth = pass.lw;
        // an undulating wisp sweeping from one edge toward the other
        ctx2d.beginPath();
        for (let s = 0; s <= 1.001; s += 0.04) {
          const py = wp.dir < 0 ? h - s * h * t : s * h * t;
          const px = w * wp.x0 + Math.sin(s * 9 + wp.seed + wp.age * 5) * (14 + s * 90) * (0.4 + t);
          if (s === 0) ctx2d.moveTo(px, py); else ctx2d.lineTo(px, py);
        }
        ctx2d.stroke();
      }
    }

    // full-field strobe flash on onsets (kept low so it never fogs the threads)
    if (flash > 0.05) {
      ctx2d.fillStyle = `rgba(255,255,255,${Math.min(0.18, flash * flash * 0.07)})`;
      ctx2d.fillRect(0, 0, w, h);
    }
    this.flashEnv *= 0.76;

    // white dust
    for (const sp of this.specks.splice(0)) {
      ctx2d.fillStyle = `rgba(255,255,255,${sp.a})`;
      for (let i = 0; i < sp.n; i++) {
        const dx = (Math.random() - 0.5) * sp.spread * w;
        const dy = (Math.random() - 0.5) * sp.spread * h * 1.6;
        ctx2d.fillRect(sp.x * w + dx, sp.y * h + dy, Math.random() < 0.15 ? 2 : 1, 1);
      }
    }
    // ambient dust while sound plays
    if (level > 0.12 && Math.random() < level * 0.5) {
      ctx2d.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < 6; i++) {
        ctx2d.fillRect(Math.random() * w, baseY + (Math.random() - 0.5) * amp * 2.4, 1, 1);
      }
    }

    ctx2d.globalCompositeOperation = 'source-over';
  },
};

function drawDisc(ctx2d, w, h, dt) {
  ctx2d.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.44;
  const open = Audio.scratch && Audio.scratch.open;
  const rate = open ? state.scratchRate : (Audio.ready ? 1 : 0); // signed
  discAngle += rate * dt * Math.PI * 2 * 0.55;

  ctx2d.save();
  ctx2d.translate(cx, cy);
  ctx2d.rotate(discAngle);
  ctx2d.fillStyle = '#0e1013';
  ctx2d.beginPath(); ctx2d.arc(0, 0, r, 0, Math.PI * 2); ctx2d.fill();
  ctx2d.strokeStyle = open ? '#cdff00' : 'rgba(205,255,0,0.4)';
  ctx2d.lineWidth = 2;
  ctx2d.beginPath(); ctx2d.arc(0, 0, r, 0, Math.PI * 2); ctx2d.stroke();
  ctx2d.strokeStyle = 'rgba(205,255,0,0.14)';
  ctx2d.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    ctx2d.beginPath(); ctx2d.arc(0, 0, r * (0.35 + i * 0.13), 0, Math.PI * 2); ctx2d.stroke();
  }
  ctx2d.strokeStyle = '#cdff00';
  ctx2d.lineWidth = 3;
  ctx2d.beginPath(); ctx2d.moveTo(0, -r * 0.35); ctx2d.lineTo(0, -r); ctx2d.stroke();
  ctx2d.fillStyle = '#000';
  ctx2d.beginPath(); ctx2d.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx2d.fill();
  ctx2d.strokeStyle = 'rgba(205,255,0,0.6)';
  ctx2d.lineWidth = 1;
  ctx2d.beginPath(); ctx2d.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx2d.stroke();
  ctx2d.restore();

  ctx2d.fillStyle = 'rgba(205,255,0,0.85)';
  ctx2d.font = '10px monospace';
  ctx2d.textAlign = 'center';
  ctx2d.fillText('SINE / NOISE', cx, cy + 3);
  ctx2d.font = '9px monospace';
  ctx2d.fillStyle = 'rgba(232,232,230,0.5)';
  ctx2d.fillText(open
    ? `${state.scratchRate >= 0 ? 'PLAY' : 'REV'} ${Math.abs(state.scratchRate).toFixed(2)}x`
    : 'SPIN=PLAY / 逆=REV / 往復=SCRATCH', cx, cy + r + 14);
  ctx2d.textAlign = 'start';
}

function render(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  // note meters
  for (const bank of ['L', 'R']) {
    noteCells[bank].forEach((el, i) => {
      el.firstElementChild.style.transform = `scaleY(${Math.min(1, state.noteMeters[bank][i] / 1.4)})`;
    });
  }

  Paint.draw(scopeCanvas.getContext('2d'), scopeCanvas.width, scopeCanvas.height);
  drawDisc(deckCanvas.getContext('2d'), deckCanvas.width, deckCanvas.height, dt);

  // orientation: show the device that is actively held (prefer connected 0)
  const devShown = state.connected[0] ? 0 : (state.connected[1] ? 1 : -1);
  if (devShown >= 0) {
    $('zone_ind').textContent = state.zone[devShown];
    const g = state.gLP[devShown];
    $('grav_val').textContent = g
      ? `g ${g.x.toFixed(2)} ${g.y.toFixed(2)} ${g.z.toFixed(2)}` : 'g — — —';
  } else {
    $('zone_ind').textContent = '—';
    $('grav_val').textContent = 'g — — —';
  }

  // roll twist meter (centered: scaleX by |roll|/threshold)
  const roll = devShown >= 0 ? state.rollDeg[devShown] : 0;
  $('twist_bar').style.transform = `scaleX(${Math.min(1, Math.abs(roll) / TUNING.twistDeg)})`;
  $('twist_val').textContent = `${roll >= 0 ? '+' : ''}${Math.round(roll)}° / ±${TUNING.twistDeg}°`;

  $('loop_head').style.left = `${Loop.progress() * 100}%`;

  if (now - tickerLast > 100) {
    tickerLast = now;
    for (let i = 0; i < 2; i++) {
      const l = state.latest[i];
      const el = $(`ticker${i}`);
      if (!state.connected[i] || !l) { el.textContent = `D${i} —`; continue; }
      const p = l.press ? l.press.values.map((v) => String(v).padStart(4, ' ')).join(' ') : '';
      el.textContent =
        `D${i} ${bankOf(i)} ${state.zone[i]} roll ${String(Math.round(state.rollDeg[i])).padStart(4, ' ')}° P[${p}]`;
    }
    $('ticker_stat').innerHTML =
      `<span class="volt">${Math.round(Math.max(state.hz[0], state.hz[1]))}</span> Hz / LOST ${state.lost}`
      + ` / JIT p95 <span class="volt">${Math.round(LatencySync.jitP95)}</span>ms`
      + ` / BUDGET ${Math.round(LatencySync.budget())}ms${TUNING.latencyAuto >= 0.5 ? ' (AUTO)' : ''}`
      + `${Audio.quantOn ? ' / QUANT' : ''}`;
  }

  requestAnimationFrame(render);
}

/* ================================================================ *
 *  Wiring
 * ================================================================ */

buildInsoleToolkit($('toolkit_placeholder0'), 'INSOLE 0', 0, { streamingMode: 3, autoReconnect: true });
buildInsoleToolkit($('toolkit_placeholder1'), 'INSOLE 1', 1, { streamingMode: 3, autoReconnect: true });

window.addEventListener('load', function () {
  buildLanes();
  buildTunePanel();
  updateLoopUI();
  updateLaneDevices();

  for (let i = 0; i < 2; i++) {
    insoles[i].setup();

    insoles[i].onConnect = function () {
      // IMPORTANT: no GATT calls here — onConnect fires while begin() is
      // still running its own GATT sequence, and concurrent operations fail
      // with "GATT operation already in progress" (breaking the connection).
      // begin() populates device_information itself, so we just poll it.
      const self = this;
      state.connected[this.id] = true;
      Audio.init().then(armAudioButton); // no GATT, safe
      updateLaneDevices();
      let tries = 0;
      const poll = setInterval(() => {
        const info = self.device_information;
        if (info && typeof info.mount_position !== 'undefined') {
          state.sides[self.id] = (info.mount_position & 1) ? 'R' : 'L';
          clearInterval(poll);
          updateLaneDevices();
        } else if (++tries > 20) {
          clearInterval(poll);
        }
      }, 500);
    };
    insoles[i].onDisconnect = function () {
      state.connected[this.id] = false;
      updateLaneDevices();
    };

    insoles[i].gotConvertedAcc = function (acc) {
      state.latest[this.id] = state.latest[this.id] || {};
      state.latest[this.id].acc = acc;
      engines[this.id].onAcc(acc);
    };
    insoles[i].gotConvertedGyro = function (gyro) {
      state.latest[this.id] = state.latest[this.id] || {};
      state.latest[this.id].gyro = gyro;
      engines[this.id].onGyro(gyro);
    };
    insoles[i].gotPress = function (press) {
      state.latest[this.id] = state.latest[this.id] || {};
      state.latest[this.id].press = press;
      engines[this.id].onPress(press);
    };
    insoles[i].gotBLEFrequency = function (freq) { state.hz[this.id] = freq; };
    insoles[i].lostData = function () { state.lost++; };
  }

  // controls
  $('audio_start').addEventListener('click', async () => { await Audio.init(); armAudioButton(); });
  $('loop_rec').addEventListener('click', async () => { await Audio.init(); armAudioButton(); Loop.rec(); });
  $('loop_play').addEventListener('click', () => Loop.playStop());
  $('loop_clear').addEventListener('click', () => Loop.clear());
  $('quant_btn').classList.toggle('active-volt', Audio.quantOn); // default ON
  $('quant_btn').addEventListener('click', function () {
    Audio.quantOn = !Audio.quantOn;
    Audio.quantT0 = null; // next hit re-anchors the grid
    this.classList.toggle('active-volt', Audio.quantOn);
  });
  $('echo_slider').addEventListener('input', function () { Audio.setEcho(this.value / 100); });
  $('sens_slider').addEventListener('input', function () { state.sens = this.value / 100; });
  $('zero_set').addEventListener('click', () => {
    for (let i = 0; i < 2; i++) {
      const l = state.latest[i];
      if (l && l.press) engines[i].zeroSet(l.press.values);
    }
  });
  $('cal_toe').addEventListener('click', function () {
    let ok = false;
    for (let i = 0; i < 2; i++) {
      if (state.connected[i]) ok = engines[i].calibrateToeDown() || ok;
    }
    this.innerHTML = ok ? '<i class="bi bi-check-lg"></i> CAL OK' : '<i class="bi bi-compass"></i> CAL';
    if (ok) setTimeout(() => { $('cal_toe').innerHTML = '<i class="bi bi-compass"></i> CAL'; }, 1500);
  });

  // keyboard fallback (notes are held: keydown=on, keyup=off)
  const heldKeys = new Set();
  window.addEventListener('keydown', async (ev) => {
    if (ev.repeat || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const key = ev.key.toLowerCase();
    if (ev.code === 'Space') {
      ev.preventDefault();
      await Audio.init(); armAudioButton(); Loop.rec();
      return;
    }
    for (const bank of ['L', 'R']) {
      const hitKind = KEYMAP[bank].hits[key];
      if (hitKind) {
        await Audio.init(); armAudioButton();
        triggerHit(bank, hitKind, 0.9, 'ui');
        return;
      }
      const noteIdx = KEYMAP[bank].notes.indexOf(ev.key);
      if (noteIdx >= 0 && !heldKeys.has(ev.key)) {
        heldKeys.add(ev.key);
        await Audio.init(); armAudioButton();
        triggerNoteOn(bank, noteIdx, 0.85, 'ui');
        return;
      }
    }
    if (key === 'p') Loop.playStop();
    else if (key === 'c') Loop.clear();
  });
  window.addEventListener('keyup', (ev) => {
    if (!heldKeys.has(ev.key)) return;
    heldKeys.delete(ev.key);
    for (const bank of ['L', 'R']) {
      const noteIdx = KEYMAP[bank].notes.indexOf(ev.key);
      if (noteIdx >= 0 && Audio.ready) triggerNoteOff(bank, noteIdx, 'ui');
    }
  });

  requestAnimationFrame(render);
});
