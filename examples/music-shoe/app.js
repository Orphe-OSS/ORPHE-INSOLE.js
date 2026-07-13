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
  mixLead: 0.45,
  mixPad: 0.85,
  mixDeck: 1.0,
  // QUANT: hits snap to 16th notes of this tempo (set it to the song's BPM)
  quantBpm: 120,
  // turntable beat sequences (spin CW/CCW) volume
  mixSeq: 0.75,
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

/* ================================================================ *
 *  i18n — JA/EN toggle (persisted)
 * ================================================================ */

let LANG = localStorage.getItem('musicShoeLang') || 'ja';

const I18N = {
  ja: {
    sub: 'ジェスチャ楽器 — 動き / 音 / 光',
    deck_jp: '水平スピン: ビートA/B + スクラッチ',
    scope_jp: '残光',
    orient_jp: '向き',
    echo_label: 'ECHO 残響',
    sens_label: 'SENS 感度',
    lanes_label: 'L / R BANKS — 振り叩き=打撃 / ロールひねり=MOD / FSR押し=ノート',
    lanes_hint: 'クリック・キーでも試奏可',
    loop_jp: 'ループ',
    tile_hat: 'つま先下', tile_snr: '水平', tile_kik: '踵下',
    tile_modUp: 'ロール+', tile_modDown: 'ロール−',
    deck_hint: 'SPIN=BEAT A / 逆=BEAT B / 往復=SCRATCH',
    plug_hint: 'PRESS "PLUG IN" TO START AUDIO',
    tune_summary: 'TUNE — パラメータ調整（即反映・自動保存。良い値になったら COPY JSON で共有）',
    about_html: `
<strong>INSOLE MUSIC SHOE</strong> は、ORPHE INSOLE（6チャネル圧力センサとIMUを内蔵したインソール型センサ）を<strong>手に持って演奏する</strong>ジェスチャ楽器です。ヘッダのトグルでINSOLEを接続し（左右自動判定・L/Rで別音色）、<span class="volt">PLUG IN</span> でオーディオを開始してください。<br><br>
<strong>演奏方法</strong><br>
・つま先を下に向けて振り下ろす / 叩きつける → <span class="volt">ハイハット</span><br>
・水平のまま振り下ろす → <span class="volt">スネア</span> ・踵を下に向けて振り下ろす → <span class="volt">キック</span>（打撃の強さ=音の強さ）<br>
・長軸まわりに素早くひねる（ロール±） → <span class="volt">モジュレーションFX</span>（ライザー / ダイブ）<br>
・6つの圧力センサを指で押す → <span class="volt">ノート</span>（L=ポリフォニックパッド / R=モノリード、押している間持続）<br>
・水平のままレコードのように回す → <span class="volt">ターンテーブル</span>（正転=再生・逆転=逆再生・細かく往復=スクラッチ）<br><br>
<strong>仕組み</strong><br>
音はすべてWeb Audioによるリアルタイム合成（サンプルファイル不使用）。BLE伝送の揺らぎ（ジッタ）はセンサ側タイムスタンプを基準にした<strong>固定レイテンシスケジューラ</strong>で吸収し、ジェスチャから発音までの遅延を常に一定に保ちます。<span class="volt">QUANT</span> をONにすると最初の一打を基準に16分グリッドへ吸着し、<span class="volt">LOOP STATION</span> で重ね録りができます。判定しきい値は <a href="./lab.html">GESTURE LAB</a> で収録した実データから較正済みで、<span class="volt">TUNE</span> パネルから全パラメータをライブ調整できます。ビジュアライザはクリックで全画面表示になります。<br><br>
<strong>動作環境</strong>: Chrome / Edge（Web Bluetooth必須）。実機がなくてもパッドのクリックとキーボードで全音色を試奏できます。`,
  },
  en: {
    sub: 'GESTURE INSTRUMENT — MOTION / SOUND / LIGHT',
    deck_jp: 'flat spin: beat A/B + scratch',
    scope_jp: 'afterglow',
    orient_jp: 'attitude',
    echo_label: 'ECHO',
    sens_label: 'SENS',
    lanes_label: 'L / R BANKS — shake/strike = drums / roll twist = MOD / FSR press = notes',
    lanes_hint: 'playable with mouse & keys',
    loop_jp: 'loop',
    tile_hat: 'toe down', tile_snr: 'flat', tile_kik: 'heel down',
    tile_modUp: 'roll +', tile_modDown: 'roll −',
    deck_hint: 'SPIN=BEAT A / CCW=BEAT B / WIGGLE=SCRATCH',
    plug_hint: 'PRESS "PLUG IN" TO START AUDIO',
    tune_summary: 'TUNE — live parameters (applied instantly, auto-saved; COPY JSON to share good values)',
    about_html: `
<strong>INSOLE MUSIC SHOE</strong> is a gesture instrument you play by <strong>holding an ORPHE INSOLE in your hands</strong> — an insole-type sensor with 6-channel pressure sensing and an IMU. Connect with the toggles in the header (left/right detected automatically, each side has its own sound bank) and press <span class="volt">PLUG IN</span> to start audio.<br><br>
<strong>How to play</strong><br>
・Shake / strike downward with the toe pointing down → <span class="volt">hi-hat</span><br>
・Shake it held flat → <span class="volt">snare</span> ・Heel pointing down → <span class="volt">kick</span> (hit harder = louder)<br>
・Twist quickly around the long axis (roll ±) → <span class="volt">modulation FX</span> (riser / dive)<br>
・Press the six pressure sensors with your fingers → <span class="volt">notes</span> (L = poly pad / R = mono lead, sustained while held)<br>
・Spin it flat like a record → <span class="volt">turntable</span> (spin = play, reverse = reverse playback, wiggle = scratch)<br><br>
<strong>Under the hood</strong><br>
Every sound is synthesized in real time with Web Audio (no samples). BLE transport jitter is absorbed by a <strong>constant-latency scheduler</strong> that schedules each sound from the sensor-side timestamp, keeping gesture-to-sound delay steady. Turn on <span class="volt">QUANT</span> to snap hits to a 16th grid anchored by your first hit, and layer phrases with the <span class="volt">LOOP STATION</span>. Detection thresholds are calibrated from real gesture recordings made with the <a href="./lab.html">GESTURE LAB</a>, and everything is live-tunable in the <span class="volt">TUNE</span> panel. Click the visualizer for fullscreen.<br><br>
<strong>Requirements</strong>: Chrome / Edge (Web Bluetooth). No hardware? Every sound is playable with mouse clicks and the keyboard.`,
  },
};

function t(key) { return (I18N[LANG] && I18N[LANG][key]) ?? I18N.ja[key] ?? key; }

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  const bj = document.getElementById('lang_ja');
  const be = document.getElementById('lang_en');
  if (bj) bj.classList.toggle('on', LANG === 'ja');
  if (be) be.classList.toggle('on', LANG === 'en');
  document.documentElement.lang = LANG;
}

function setLang(lang) {
  LANG = lang;
  localStorage.setItem('musicShoeLang', LANG);
  applyLang();
}

/**
 * Note scales — Dm9(11) chord tones (D F A C E G), the jazz/hip-hop voicing:
 * pressing several FSRs at once lands on a minor-9th chord instead of a
 * pentatonic run. L = pad (low register), R = lead (+1 octave).
 */
const SCALE = {
  L: [73.42, 87.31, 110.0, 130.81, 164.81, 196.0],   // D2 F2 A2 C3 E3 G3
  R: [146.83, 174.61, 220.0, 261.63, 329.63, 392.0], // D3 F3 A3 C4 E4 G4
};

/**
 * Channel -> scale degree. Heel (ch5, physical convention) plays the lowest
 * note and the toe (ch0) the highest — pitch rises toward the toe.
 * Flip this array if your unit's channel order differs.
 */
const NOTE_DEGREE = [5, 4, 3, 2, 1, 0];

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
    this.analyser.fftSize = 4096; // fine-grained waveform for the visualizer
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
    synth.noteOn(SCALE[bank][NOTE_DEGREE[idx]], idx, vel, t);
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
    DeckSeq.update(gateOpen, dir); // BPM-locked breakbeat A/B under the scrub

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
      d.gain.gain.setTargetAtTime(0.45 * TUNING.mixDeck, t, 0.008); // vinyl texture under the beat
    } else if (gateOpen) {
      d.node.playbackRate.setTargetAtTime(rate, t, 0.02);
      d.gain.gain.setTargetAtTime(0.45 * TUNING.mixDeck, t, 0.02);
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
    const div = 60 / Math.max(40, TUNING.quantBpm) / 4; // 16th note [s]
    const n = Math.ceil((t - this.quantT0 - 1e-4) / div);
    return this.quantT0 + n * div;
  },
};

/** Poly synth pad (bank L): detuned saws + sub, slow attack, LPF per voice. */
class PadSynth {
  constructor(ctx, dest, echoSend) {
    this.ctx = ctx; this.dest = dest; this.echoSend = echoSend;
    this.voices = new Map();
  }
  noteOn(freq, idx, vel, t) {
    if (this.voices.has(idx)) return;
    const ctx = this.ctx;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = freq; o1.detune.value = -7;
    const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = freq; o2.detune.value = 7;
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = freq / 2;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(350 + vel * 1200, t); // darker, dusty
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.24 * TUNING.mixPad * (0.5 + vel * 0.5), t + 0.05);
    o1.connect(f); o2.connect(f);
    const subG = ctx.createGain(); subG.gain.value = 0.35;
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

/** Mono synth lead (bank R): saw+square, portamento, vibrato, last-note priority. */
class LeadSynth {
  constructor(ctx, dest, echoSend) {
    this.ctx = ctx; this.dest = dest; this.echoSend = echoSend;
    this.stack = [];   // held notes: {idx, freq, vel}
    this.node = null;  // persistent voice
  }
  ensureVoice(t) {
    if (this.node) return;
    const ctx = this.ctx;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth';
    const o2 = ctx.createOscillator(); o2.type = 'square';
    const o2g = ctx.createGain(); o2g.gain.value = 0.4;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.6;
    const lfoG = ctx.createGain(); lfoG.gain.value = 4; // cents-ish via detune
    lfo.connect(lfoG);
    lfoG.connect(o1.detune); lfoG.connect(o2.detune);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 3; f.frequency.value = 900; // smoky
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
    this.node.o2.frequency.setTargetAtTime(freq, t, porta);
    this.node.f.frequency.setTargetAtTime(500 + vel * 1600, t, 0.02); // dusty lead
    this.node.g.gain.cancelScheduledValues(t);
    this.node.g.gain.setTargetAtTime(0.34 * TUNING.mixLead * (0.5 + vel * 0.5), t, first ? 0.004 : 0.02);
  }
  noteOff(idx, t) {
    this.stack = this.stack.filter((n) => n.idx !== idx);
    if (!this.node) return;
    if (this.stack.length) {
      const top = this.stack[this.stack.length - 1];
      this.node.o1.frequency.setTargetAtTime(top.freq, t, 0.018);
      this.node.o2.frequency.setTargetAtTime(top.freq, t, 0.018);
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
 *  Deck beat sequencer — spinning the insole flat runs a breakbeat
 *
 *  CW spin  -> pattern A (boom bap),  CCW spin -> pattern B (amen-ish).
 *  Steps are 16th notes of TUNING.quantBpm and share the QUANT grid, so
 *  quantized live hits land exactly in the pocket of the running beat.
 *  The scrubbed record loop keeps playing underneath as vinyl texture.
 *  Fast wiggling (scratching) doesn't flip the pattern — the direction has
 *  to be sustained for ~300 ms, so the beat stays stable under scratches.
 * ================================================================ */

const DECK_PATTERNS = {
  // 16 steps, {s: step, b: bank, k: kind, v: velocity}
  A: [ // boom bap (hard kick / 909 snare / closed hats)
    { s: 0, b: 'R', k: 'kik', v: 1.0 }, { s: 7, b: 'R', k: 'kik', v: 0.75 }, { s: 10, b: 'R', k: 'kik', v: 0.9 },
    { s: 4, b: 'L', k: 'snr', v: 0.9 }, { s: 12, b: 'L', k: 'snr', v: 0.95 },
    { s: 0, b: 'L', k: 'hat', v: 0.5 }, { s: 2, b: 'L', k: 'hat', v: 0.3 },
    { s: 4, b: 'L', k: 'hat', v: 0.45 }, { s: 6, b: 'L', k: 'hat', v: 0.3 },
    { s: 8, b: 'L', k: 'hat', v: 0.5 }, { s: 10, b: 'L', k: 'hat', v: 0.3 },
    { s: 12, b: 'L', k: 'hat', v: 0.45 }, { s: 14, b: 'R', k: 'hat', v: 0.45 },
  ],
  B: [ // amen-ish (808 kick / clap / metallic hats, more syncopation)
    { s: 0, b: 'L', k: 'kik', v: 1.0 }, { s: 2, b: 'L', k: 'kik', v: 0.55 },
    { s: 8, b: 'L', k: 'kik', v: 0.9 }, { s: 9, b: 'L', k: 'kik', v: 0.55 },
    { s: 4, b: 'R', k: 'snr', v: 0.9 }, { s: 12, b: 'R', k: 'snr', v: 0.9 }, { s: 15, b: 'R', k: 'snr', v: 0.35 },
    { s: 0, b: 'R', k: 'hat', v: 0.45 }, { s: 2, b: 'R', k: 'hat', v: 0.3 },
    { s: 4, b: 'R', k: 'hat', v: 0.4 }, { s: 6, b: 'R', k: 'hat', v: 0.3 },
    { s: 7, b: 'L', k: 'hat', v: 0.35 }, { s: 8, b: 'R', k: 'hat', v: 0.45 },
    { s: 10, b: 'R', k: 'hat', v: 0.3 }, { s: 12, b: 'R', k: 'hat', v: 0.4 }, { s: 14, b: 'L', k: 'hat', v: 0.35 },
  ],
};

const DeckSeq = {
  running: false,
  timer: null,
  step: 0,
  nextAt: 0,
  dir: 1,            // +1 = pattern A, −1 = pattern B (sustained direction)
  pendingDir: 1,
  dirSinceMs: 0,
  lastOpenMs: 0,

  stepDur() { return 60 / Math.max(40, TUNING.quantBpm) / 4; },

  /** Called at sensor rate from Audio.setScratch. */
  update(gateOpen, dirSign) {
    const nowMs = performance.now();
    if (gateOpen) {
      this.lastOpenMs = nowMs;
      if (!this.running) { this.dir = dirSign; this.start(); }
      // direction must be sustained to flip the pattern (scratch-proof)
      if (dirSign !== this.dir) {
        if (this.pendingDir !== dirSign) { this.pendingDir = dirSign; this.dirSinceMs = nowMs; }
        else if (nowMs - this.dirSinceMs > 300) this.dir = dirSign;
      } else {
        this.pendingDir = dirSign;
      }
    }
  },

  start() {
    if (this.running || !Audio.ready) return;
    this.running = true;
    const now = Audio.ctx.currentTime;
    const div = this.stepDur();
    // share the QUANT grid: anchor to it, or become the anchor
    if (Audio.quantT0 === null) Audio.quantT0 = now;
    const n = Math.ceil((now - Audio.quantT0) / div);
    this.nextAt = Audio.quantT0 + n * div;
    this.step = ((n % 16) + 16) % 16;
    this.timer = setInterval(() => this.tick(), 25);
  },

  tick() {
    if (!Audio.ready) return;
    const now = Audio.ctx.currentTime;
    // stop when the spin has been closed for a moment (scratch flicker safe)
    if (performance.now() - this.lastOpenMs > 450) { this.stop(); return; }
    const div = this.stepDur();
    let guard = 0;
    while (this.nextAt < now + 0.12 && guard++ < 32) {
      const pattern = DECK_PATTERNS[this.dir > 0 ? 'A' : 'B'];
      for (const ev of pattern) {
        if (ev.s === this.step) Audio.hit(ev.b, ev.k, ev.v * TUNING.mixSeq, this.nextAt);
      }
      this.step = (this.step + 1) % 16;
      this.nextAt += div;
    }
  },

  stop() {
    this.running = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
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
      el.innerHTML = `<div class="name">${tk.name}</div><div class="jp" data-i18n="tile_${tk.kind}">${t(`tile_${tk.kind}`)}</div><span class="key">[${key.toUpperCase()}]</span>`;
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
      <span data-i18n="tune_summary">${t('tune_summary')}</span></summary>
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

/* ---------- LIGHT SCOPE — waveform + video feedback ----------
 * Black base, monochrome white. The live waveform is drawn as fine crisp
 * lines, and every frame the whole picture is fed back onto itself —
 * rotated, zoomed and slightly sheared around a wandering center — while
 * dimming. Each sound therefore leaves spiraling, expanding echoes of its
 * own waveform shape, and different sounds paint with different geometry so
 * the field grows into a dense interweave of waves, dots and polygons:
 *   KIK  -> broad near-horizontal waveform slab + outward zoom kick
 *          (occasionally flips the global spin direction)
 *   SNR  -> polygon shards (thin white outlines) + rotation impulse
 *   HAT  -> void-like dot swarms (feedback smears them into star trails)
 *   MOD± -> waveform RING + the whole field breathes out / in with spiral
 *   notes-> rotating waveform rings per held note (radius by note index)
 *   scratch -> the field spins with the record (direction & speed follow)
 *   hits -> strobing flash. Rotation has inertia (impulses glide out).
 */
const Paint = {
  fb: null, fbctx: null, inited: false,
  flashEnv: 0,
  zoomPulse: 0,    // + outward / − inward, decays
  rotVel: 0.005,   // angular velocity with inertia (impulses glide out)
  spiral: 0,       // extra spin from MODs, decays slowly
  rotDir: 1,       // global spin direction (KIK can flip it)
  frame: 0,
  held: new Map(), // `${bank}:${idx}` -> {idx, phase}
  stamps: [],      // hit stamps to draw this frame: {kind, vel}

  hit(bank, kind, vel) {
    this.flashEnv = Math.min(1.7, Math.max(this.flashEnv, 0.5 + vel * 0.7));
    if (kind === 'modUp') { this.zoomPulse = 1; this.spiral += 0.8; }
    else if (kind === 'modDown') { this.zoomPulse = -1; this.spiral -= 0.8; }
    else if (kind === 'kik') {
      this.zoomPulse = Math.max(this.zoomPulse, 0.5 * vel);
      if (Math.random() < 0.3) this.rotDir *= -1; // spin direction flip
    } else {
      // angular impulse — inertia lets it glide out over ~a second
      this.rotVel += (Math.random() < 0.5 ? -1 : 1) * (0.01 + vel * 0.03);
    }
    this.stamps.push({ kind, vel });
  },

  noteOn(bank, idx) { this.held.set(`${bank}:${idx}`, { idx, phase: Math.random() * 6.28 }); },
  noteOff(bank, idx) { this.held.delete(`${bank}:${idx}`); },

  /** Fine waveform along an arbitrary segment (position + angle). */
  waveLine(ctx2d, data, x0, y0, angle, len, amp, alpha, lw) {
    ctx2d.save();
    ctx2d.translate(x0, y0);
    ctx2d.rotate(angle);
    ctx2d.strokeStyle = `rgba(255,255,255,${Math.min(1, alpha)})`;
    ctx2d.lineWidth = lw;
    ctx2d.beginPath();
    const N = Math.max(80, len | 0); // ~1px resolution
    for (let i = 0; i <= N; i++) {
      const v = (data[((i / N) * (data.length - 1)) | 0] - 128) / 128;
      const x = -len / 2 + (i / N) * len;
      if (i === 0) ctx2d.moveTo(x, v * amp); else ctx2d.lineTo(x, v * amp);
    }
    ctx2d.stroke();
    ctx2d.restore();
  },

  /** Void-like dot swarm (feedback smears these into star trails). */
  dotSwarm(ctx2d, cx, cy, n, spread, alpha) {
    ctx2d.fillStyle = `rgba(255,255,255,${Math.min(1, alpha)})`;
    for (let i = 0; i < n; i++) {
      // gaussian-ish cluster
      const a = Math.random() * Math.PI * 2;
      const d = (Math.random() + Math.random() + Math.random()) / 3 * spread;
      const r = Math.random() < 0.85 ? 1 : 2;
      ctx2d.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, r, r);
    }
  },

  /** Irregular polygon shard (thin outline). */
  polyShard(ctx2d, cx, cy, r, alpha, lw) {
    const verts = 3 + ((Math.random() * 4) | 0);
    const rot0 = Math.random() * Math.PI * 2;
    ctx2d.strokeStyle = `rgba(255,255,255,${Math.min(1, alpha)})`;
    ctx2d.lineWidth = lw;
    ctx2d.beginPath();
    for (let i = 0; i <= verts; i++) {
      const a = rot0 + (i % verts) / verts * Math.PI * 2;
      const rr = r * (0.55 + Math.random() * 0.7);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
    }
    ctx2d.closePath();
    ctx2d.stroke();
  },

  /** Waveform wrapped around a circle (oscilloscope ring). */
  waveRing(ctx2d, data, cx, cy, r0, ampR, phase, alpha, lw) {
    ctx2d.strokeStyle = `rgba(255,255,255,${Math.min(1, alpha)})`;
    ctx2d.lineWidth = lw;
    ctx2d.beginPath();
    const N = 180;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2 + phase;
      const v = (data[((i / N) * (data.length - 1)) | 0] - 128) / 128;
      const r = r0 + v * ampR;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
    }
    ctx2d.stroke();
  },

  draw(ctx2d, w, h) {
    this.frame++;
    if (!this.inited || !this.fb || this.fb.width !== w || this.fb.height !== h) {
      ctx2d.globalCompositeOperation = 'source-over';
      ctx2d.fillStyle = '#000';
      ctx2d.fillRect(0, 0, w, h);
      this.fb = document.createElement('canvas');
      this.fb.width = w; this.fb.height = h;
      this.fbctx = this.fb.getContext('2d');
      this.inited = true;
    }

    // audio features
    let level = 0, data = null;
    if (Audio.ready) {
      data = new Uint8Array(Audio.analyser.fftSize);
      Audio.analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 8) { const v = (data[i] - 128) / 128; sum += v * v; }
      level = Math.min(1, Math.sqrt(sum / (data.length / 8)) * 3);
    }

    // ---- feedback: snapshot -> repaint transformed + dimmed ----
    this.fbctx.clearRect(0, 0, w, h);
    this.fbctx.drawImage(ctx2d.canvas, 0, 0);

    this.zoomPulse *= 0.93;
    this.spiral *= 0.97;
    const scr = state.scratchRate; // signed: field spins with the record
    // rotation with inertia: velocity eases toward a slow cruise, impulses
    // (hits / scratch / spiral) decay gradually instead of snapping back
    const cruise = (0.004 + level * 0.006) * this.rotDir
      + scr * 0.03 + this.spiral * 0.014;
    this.rotVel += (cruise - this.rotVel) * 0.025;
    const rot = this.rotVel;
    const zoom = 1.012 + level * 0.012 + this.zoomPulse * 0.05;
    // slight anisotropy + wandering center = pseudo-3D depth
    const wob = Math.sin(this.frame * 0.021);
    const zx = zoom * (1 + wob * 0.007);
    const zy = zoom * (1 - wob * 0.007);
    const cx = w / 2 + Math.sin(this.frame * 0.0073) * w * 0.06;
    const cy = h / 2 + Math.cos(this.frame * 0.0091) * h * 0.09;

    ctx2d.globalCompositeOperation = 'source-over';
    ctx2d.fillStyle = '#000';
    ctx2d.fillRect(0, 0, w, h);
    ctx2d.save();
    ctx2d.translate(cx, cy);
    ctx2d.rotate(rot);
    ctx2d.scale(zx, zy);
    ctx2d.translate(-cx, -cy);
    ctx2d.globalAlpha = 0.955; // persistence (echoes linger for seconds)
    ctx2d.drawImage(this.fb, 0, 0);
    ctx2d.restore();
    ctx2d.globalAlpha = 1;

    if (!Audio.ready) {
      ctx2d.fillStyle = 'rgba(255,255,255,0.35)';
      ctx2d.font = '12px monospace';
      ctx2d.fillText(t('plug_hint'), 16, h / 2);
      return;
    }

    // ---- fresh light on top (additive) ----
    const strobe = this.flashEnv > 0.25 && this.frame % 2 === 0 ? 0.25 : 1;
    const flash = this.flashEnv * strobe;
    const amp = h * 0.28 * (0.3 + level * 1.3 + flash * 0.7);

    ctx2d.globalCompositeOperation = 'lighter';
    ctx2d.lineCap = 'round';

    if (level > 0.012 || flash > 0.05) {
      // main fine trace across the center: halo + crisp core
      this.waveLine(ctx2d, data, w / 2, h / 2, 0, w, amp, 0.05 + level * 0.08 + flash * 0.12, 4);
      this.waveLine(ctx2d, data, w / 2, h / 2, 0, w, amp, 0.3 + level * 0.35 + flash * 0.5, 0.9);
    }

    // per-hit stamps: each sound throws its waveform somewhere else
    for (const s of this.stamps.splice(0)) {
      const v = s.vel;
      if (s.kind === 'kik') {
        this.waveLine(ctx2d, data, w * (0.35 + Math.random() * 0.3), h * (0.3 + Math.random() * 0.4),
          (Math.random() - 0.5) * 0.3, w * 0.85, h * (0.2 + v * 0.25), 0.4 + v * 0.35, 2.6);
      } else if (s.kind === 'snr') {
        // polygon shards
        const n = 1 + ((Math.random() * 2) | 0);
        for (let k = 0; k < n; k++) {
          this.polyShard(ctx2d, w * Math.random(), h * Math.random(),
            h * (0.05 + v * 0.1), 0.4 + v * 0.3, 1.1);
        }
      } else if (s.kind === 'hat') {
        // void: a cluster of tiny dots
        this.dotSwarm(ctx2d, w * Math.random(), h * Math.random(),
          10 + (v * 26) | 0, h * (0.1 + v * 0.15), 0.45 + v * 0.3);
      } else { // modUp / modDown: big waveform ring
        this.waveRing(ctx2d, data, w / 2, h / 2, h * 0.3, h * 0.12,
          Math.random() * 6.28, 0.45 + v * 0.25, 1.4);
      }
    }

    // held notes: rotating rings, radius by note index
    for (const n of this.held.values()) {
      n.phase += 0.02 + n.idx * 0.004;
      this.waveRing(ctx2d, data, w / 2, h / 2, h * (0.1 + n.idx * 0.055), h * 0.05,
        n.phase, 0.1 + level * 0.25, 0.8);
    }

    // full-field strobe on onsets
    if (flash > 0.05) {
      ctx2d.fillStyle = `rgba(255,255,255,${Math.min(0.22, flash * flash * 0.09)})`;
      ctx2d.fillRect(0, 0, w, h);
    }
    ctx2d.globalCompositeOperation = 'source-over';
    this.flashEnv *= 0.78;
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
    ? `BEAT ${DeckSeq.dir > 0 ? 'A' : 'B'} @${Math.round(TUNING.quantBpm)} / ${state.scratchRate >= 0 ? 'FWD' : 'REV'} ${Math.abs(state.scratchRate).toFixed(2)}x`
    : t('deck_hint'), cx, cy + r + 14);
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

  Paint.draw(scopeCanvas.getContext('2d'), scopeCanvas.width, scopeCanvas.height, dt);
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
  applyLang();
  updateLoopUI();
  updateLaneDevices();
  $('lang_ja').addEventListener('click', () => setLang('ja'));
  $('lang_en').addEventListener('click', () => setLang('en'));

  // visualizer fullscreen toggle (click to enter, click again to exit)
  scopeCanvas.title = 'click: fullscreen';
  scopeCanvas.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else scopeCanvas.requestFullscreen().catch(() => { /* unsupported */ });
  });
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement === scopeCanvas) {
      scopeCanvas.width = window.innerWidth;
      scopeCanvas.height = window.innerHeight;
    } else {
      scopeCanvas.width = 900;
      scopeCanvas.height = 300;
    }
    Paint.inited = false; // re-init buffers at the new size
  });

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
  $('bpm_input').value = TUNING.quantBpm;
  $('bpm_input').addEventListener('input', function () {
    const v = parseFloat(this.value);
    if (Number.isFinite(v) && v >= 40 && v <= 300) {
      TUNING.quantBpm = v;
      Audio.quantT0 = null; // re-anchor the grid at the new tempo
      saveTuning();
    }
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
