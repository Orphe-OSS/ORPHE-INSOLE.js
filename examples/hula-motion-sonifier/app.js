(function () {
  const {
    HulaEventDetector,
    HulaSessionRecorder,
    DEFAULT_OPTIONS,
    DEFAULT_SENSOR_MAP,
    SENSOR_LAYOUT,
    getSensorPosition,
  } = window.HulaMotion;

  const SIDE_LABEL = {
    left: "左",
    right: "右",
    both: "両足",
    "left-start": "左始まり",
    "right-start": "右始まり",
  };

  const STEP_LABELS = {
    kaholo: "Kāholo",
    hela: "Hela",
    ami: "ʻAmi",
    manual: "手動ラベル",
  };

  const STEP_CONFIG = [
    { type: "kaholo", label: "Kāholo", summary: "8フェイズの横移動", basis: "フットフラット + IMU主軸変化" },
    { type: "hela", label: "Hela", summary: "4フェイズの足出し/戻し", basis: "フットフラット + IMU 2軸変化 + 前足部タッチ" },
    { type: "ami", label: "ʻAmi", summary: "静かな円/楕円CoP", basis: "IMU静止 + CoP前後左右変化" },
  ];

  const GESTURE_AUDIO_MAP = {
    kaholo: {
      instrument: "High-G Ukulele",
      trigger: "着地カウント",
      phases: ["G", "C", "E", "A", "G", "C", "E", "A"],
      sound: "C6/Fmaj7/G6",
    },
    hela: {
      instrument: "6th Steel Guitar",
      trigger: "足出し/戻り着地",
      phases: ["C", "E", "G", "A"],
      sound: "6th slide",
    },
    ami: {
      instrument: "Ocean/Wind",
      trigger: "CoP角度変化",
      phases: ["E", "NE", "N", "NW", "W", "SW", "S", "SE"],
      sound: "G swell",
    },
  };

  const HAWAIIAN_PROGRESSION = [
    {
      name: "C6",
      ukulele: [392.00, 523.25, 659.25, 880.00],
      steel: [261.63, 329.63, 392.00, 440.00],
      pad: [130.81, 261.63, 329.63, 392.00, 493.88],
    },
    {
      name: "Fmaj7",
      ukulele: [440.00, 523.25, 659.25, 698.46],
      steel: [349.23, 440.00, 523.25, 659.25],
      pad: [174.61, 261.63, 349.23, 440.00, 523.25],
    },
    {
      name: "G6",
      ukulele: [493.88, 587.33, 659.25, 783.99],
      steel: [392.00, 493.88, 587.33, 659.25],
      pad: [196.00, 293.66, 392.00, 493.88, 587.33],
    },
    {
      name: "C6",
      ukulele: [392.00, 523.25, 659.25, 880.00],
      steel: [261.63, 329.63, 392.00, 440.00],
      pad: [130.81, 261.63, 329.63, 392.00, 493.88],
    },
  ];

  const KAHOLO_UKE_PHASE_PATTERN = [0, 1, 2, 3, 0, 1, 2, 3];

  const PIANO_PROGRESSION = [
    { name: "Cmaj9", bass: 130.81, notes: [261.63, 329.63, 392.00, 493.88, 587.33] },
    { name: "Am9", bass: 110.00, notes: [220.00, 261.63, 329.63, 392.00, 493.88] },
    { name: "Fmaj9", bass: 87.31, notes: [174.61, 220.00, 261.63, 349.23, 392.00] },
    { name: "Gsus13", bass: 98.00, notes: [196.00, 246.94, 293.66, 392.00, 440.00] },
  ];

  const HULA_CHORDS = [
    { name: "C6", root: 130.81, notes: [261.63, 329.63, 392.00, 440.00] },
    { name: "Fadd9", root: 174.61, notes: [261.63, 349.23, 392.00, 523.25] },
    { name: "G6", root: 196.00, notes: [246.94, 293.66, 392.00, 493.88] },
    { name: "Am7", root: 110.00, notes: [220.00, 261.63, 329.63, 392.00] },
  ];

  const SYNTH_COLORS = [
    { root: 146.83, notes: [293.66, 349.23, 440.00, 554.37] },
    { root: 164.81, notes: [329.63, 392.00, 493.88, 659.25] },
    { root: 196.00, notes: [392.00, 493.88, 587.33, 783.99] },
    { root: 220.00, notes: [440.00, 523.25, 659.25, 880.00] },
  ];

  const SONIFICATION_PRESETS = {
    pianoArp: {
      label: "ピアノ和音とアルペジオ",
      description: "ステップが起きるたびに柔らかいピアノ風の和音進行が前へ進みます。踊りが音楽の時間を押し出していく感覚を狙ったプリセットです。",
      rules: [
        "Kāholo: 次の和音へ進み、4歩の流れを分散和音で鳴らす",
        "Hela: 出した足側に高音の装飾アルペジオを置く",
        "ʻUwehe: 現在の和音を広げて、踵上げを開放感のある響きにする",
      ],
      play(engine, event) {
        const intensity = eventIntensity(event);
        if (event.type === "kaholo") {
          const chord = engine.nextProgression("piano", PIANO_PROGRESSION);
          engine.playPianoNote(chord.bass, { duration: 1.1, gain: 0.08 + intensity * 0.035, pan: 0, delay: 0 });
          chord.notes.slice(0, 4).forEach((frequency, index) => {
            const pan = event.side === "right-start" ? -0.28 + index * 0.18 : 0.28 - index * 0.18;
            engine.playPianoNote(frequency, {
              duration: 0.9 - index * 0.08,
              gain: 0.07 + intensity * 0.025,
              pan,
              delay: 0.045 + index * 0.105,
            });
          });
        } else if (event.type === "hela") {
          const chord = engine.currentProgression("piano", PIANO_PROGRESSION);
          const pan = sidePan(event.side, 0.44);
          [chord.notes[1], chord.notes[3], chord.notes[4]].forEach((frequency, index) => {
            engine.playPianoNote(frequency, {
              duration: 0.68,
              gain: 0.058 + intensity * 0.022,
              pan,
              delay: index * 0.072,
            });
          });
        } else if (event.type === "uwehe") {
          const chord = engine.currentProgression("piano", PIANO_PROGRESSION);
          engine.playStrum(chord.notes, {
            voice: "piano",
            duration: 1.3,
            gain: 0.085 + intensity * 0.035,
            pan: 0,
            spread: 0.028,
          });
          engine.playPianoNote(chord.notes[4] * 2, { duration: 0.85, gain: 0.04 + intensity * 0.02, pan: 0.18, delay: 0.13 });
        }
      },
    },
    hulaEnsemble: {
      label: "フラ・アンサンブル",
      description: "イプのような低い打音、ウクレレ風の弦、風を感じる息づかいを合成で重ねます。実際の楽器音源ではなく、フラらしい身体性を抽象化した音響です。",
      rules: [
        "Kāholo: 横移動に合わせてイプ風4拍と弦のストラム",
        "Hela: 出した足側に軽い弦の返しと小さな打音",
        "ʻUwehe: 両踵の上昇を息のようなシマーと明るい和音で広げる",
      ],
      play(engine, event) {
        const intensity = eventIntensity(event);
        const chord = engine.currentProgression("hula", HULA_CHORDS);
        if (event.type === "kaholo") {
          const nextChord = engine.nextProgression("hula", HULA_CHORDS);
          [0, 0.11, 0.22, 0.33].forEach((delay, index) => {
            const pan = index % 2 === 0 ? -0.18 : 0.18;
            engine.playIpu({ gain: 0.13 + intensity * 0.045, pan, delay, low: index === 0 });
          });
          engine.playStrum(nextChord.notes, {
            voice: "pluck",
            duration: 0.72,
            gain: 0.075 + intensity * 0.025,
            pan: 0,
            delay: 0.055,
            spread: 0.026,
          });
        } else if (event.type === "hela") {
          const pan = sidePan(event.side, 0.52);
          const melodic = event.side === "left" ? [chord.notes[1], chord.notes[2], chord.notes[0] * 2] : [chord.notes[2], chord.notes[3], chord.notes[1] * 2];
          melodic.forEach((frequency, index) => {
            engine.playPluck(frequency, { duration: 0.42, gain: 0.055 + intensity * 0.025, pan, delay: index * 0.07 });
          });
          engine.playIpu({ gain: 0.08 + intensity * 0.025, pan, delay: 0.015, low: false });
        } else if (event.type === "uwehe") {
          engine.playIpu({ gain: 0.15 + intensity * 0.05, pan: -0.18, delay: 0, low: true });
          engine.playIpu({ gain: 0.13 + intensity * 0.04, pan: 0.18, delay: 0.07, low: false });
          engine.playStrum(chord.notes.map((frequency) => frequency * 1.5), {
            voice: "pluck",
            duration: 1.05,
            gain: 0.06 + intensity * 0.025,
            pan: 0,
            delay: 0.05,
            spread: 0.038,
          });
          engine.playNoise({ duration: 0.52, gain: 0.04 + intensity * 0.025, pan: 0, delay: 0.04, filterFrequency: 5200, filterType: "highpass" });
        }
      },
    },
    abstractBloom: {
      label: "抽象シンセ・ブルーム",
      description: "ステップを粒子状のシンセ、上昇スイープ、広がるパッドに変換します。身体の重心移動を抽象的な光のように聴かせるプリセットです。",
      rules: [
        "Kāholo: 左右へ移動する低音パルスときらめく粒",
        "Hela: 出した足から中央へ吸い込まれるポルタメント",
        "ʻUwehe: 両足から空間が開くような長めのパッド",
      ],
      play(engine, event) {
        const intensity = eventIntensity(event);
        const color = engine.nextProgression("synth", SYNTH_COLORS);
        if (event.type === "kaholo") {
          [0, 0.08, 0.16, 0.24].forEach((delay, index) => {
            const pan = event.side === "right-start" ? -0.55 + index * 0.36 : 0.55 - index * 0.36;
            engine.playTone({ frequency: color.root * (1 + index * 0.08), duration: 0.22, type: "sawtooth", gain: 0.035 + intensity * 0.018, pan, delay, slideTo: color.root * 0.72 });
            engine.playTone({ frequency: color.notes[index % color.notes.length] * 2, duration: 0.18, type: "sine", gain: 0.025 + intensity * 0.012, pan: pan * 0.65, delay: delay + 0.025, slideTo: color.notes[index % color.notes.length] * 2.7 });
          });
        } else if (event.type === "hela") {
          const pan = sidePan(event.side, 0.72);
          engine.playTone({ frequency: color.notes[0], duration: 0.54, type: "triangle", gain: 0.075 + intensity * 0.035, pan, slideTo: color.notes[3], attack: 0.035 });
          engine.playTone({ frequency: color.notes[2] * 1.5, duration: 0.46, type: "sine", gain: 0.045 + intensity * 0.02, pan: pan * 0.25, delay: 0.045, slideTo: color.notes[1] });
        } else if (event.type === "uwehe") {
          engine.playPad(color.notes, { duration: 1.45, gain: 0.095 + intensity * 0.045, pan: 0, attack: 0.18 });
          engine.playTone({ frequency: color.notes[3] * 2, duration: 0.72, type: "sine", gain: 0.035 + intensity * 0.015, pan: -0.4, delay: 0.07, slideTo: color.notes[3] * 3 });
          engine.playTone({ frequency: color.notes[3] * 2.25, duration: 0.72, type: "sine", gain: 0.035 + intensity * 0.015, pan: 0.4, delay: 0.11, slideTo: color.notes[3] * 3.25 });
        }
      },
    },
    stepPercussion: {
      label: "ステップ打楽器",
      description: "フラメンコやタップダンスのように、足のイベントを打楽器として前面に出します。踵、爪先、手拍子風の音でリズムの快感を作ります。",
      rules: [
        "Kāholo: 4歩を左右交互の床タップとして鳴らす",
        "Hela: 出した足側の爪先タップとブラシ音",
        "ʻUwehe: 両足アクセントと手拍子風クラップで強調",
      ],
      play(engine, event) {
        const intensity = eventIntensity(event);
        if (event.type === "kaholo") {
          [0, 0.095, 0.19, 0.285].forEach((delay, index) => {
            const pan = index % 2 === 0 ? -0.42 : 0.42;
            engine.playStepHit({ kind: index % 2 === 0 ? "heel" : "toe", gain: 0.12 + intensity * 0.055, pan, delay });
          });
          engine.playNoise({ duration: 0.035, gain: 0.045 + intensity * 0.02, pan: 0, delay: 0.36, filterFrequency: 3000, filterType: "bandpass" });
        } else if (event.type === "hela") {
          const pan = sidePan(event.side, 0.62);
          engine.playStepHit({ kind: "toe", gain: 0.12 + intensity * 0.05, pan, delay: 0 });
          engine.playNoise({ duration: 0.09, gain: 0.05 + intensity * 0.025, pan, delay: 0.045, filterFrequency: 4600, filterType: "highpass" });
          engine.playStepHit({ kind: "heel", gain: 0.08 + intensity * 0.035, pan: pan * 0.75, delay: 0.12 });
        } else if (event.type === "uwehe") {
          engine.playStepHit({ kind: "heel", gain: 0.15 + intensity * 0.055, pan: -0.38, delay: 0 });
          engine.playStepHit({ kind: "heel", gain: 0.15 + intensity * 0.055, pan: 0.38, delay: 0.035 });
          [0.08, 0.16].forEach((delay) => {
            engine.playClap({ gain: 0.11 + intensity * 0.04, pan: 0, delay });
          });
        }
      },
    },
    basic: {
      label: "基準キュー",
      description: "検出イベントを短い合成音で明確に知らせます。実機テスト初期の確認用です。",
      rules: [
        "Kāholo: 低い2連パルスで左右荷重シフトを通知",
        "Hela: 出した足の左右にパンした上昇音",
        "ʻUwehe: 両足の踵上げを明るい2音で通知",
      ],
      play(engine, event) {
        const intensity = eventIntensity(event);
        if (event.type === "kaholo") {
          engine.playTone({ frequency: 150, duration: 0.13, type: "triangle", gain: 0.22 + intensity * 0.08, pan: 0, slideTo: 92 });
          engine.playTone({ frequency: 260, duration: 0.08, type: "sine", gain: 0.1 + intensity * 0.05, pan: 0.1, delay: 0.08 });
        } else if (event.type === "hela") {
          engine.playTone({
            frequency: event.side === "left" ? 430 : 520,
            duration: 0.18,
            type: "sine",
            gain: 0.12 + intensity * 0.08,
            pan: sidePan(event.side, 0.48),
            slideTo: event.side === "left" ? 650 : 780,
          });
        } else if (event.type === "uwehe") {
          engine.playTone({ frequency: 760, duration: 0.2, type: "sine", gain: 0.12 + intensity * 0.05, pan: -0.25 });
          engine.playTone({ frequency: 1140, duration: 0.24, type: "sine", gain: 0.08 + intensity * 0.05, pan: 0.25, delay: 0.03 });
        }
      },
    },
    ipu: {
      label: "イプ風パーカッション",
      description: "ハワイアンの打楽器を抽象化した、移植しやすいノイズ+低音パルスです。踊りながらタイミングを掴みやすくします。",
      rules: [
        "Kāholo: 4歩のまとまりを低音ドン+軽いシェイカーで表現",
        "Hela: 出した足の方向から乾いたクリック",
        "ʻUwehe: 両足の踵上げを左右同時の明るいシェイクで表現",
      ],
      play(engine, event) {
        const intensity = eventIntensity(event);
        if (event.type === "kaholo") {
          [0, 0.09, 0.18, 0.27].forEach((delay, index) => {
            const pan = index % 2 === 0 ? -0.22 : 0.22;
            engine.playTone({ frequency: index === 0 ? 88 : 118, duration: 0.08, type: "triangle", gain: 0.16 + intensity * 0.05, pan, delay, slideTo: 54 });
            engine.playNoise({ duration: 0.045, gain: 0.035 + intensity * 0.03, pan, delay: delay + 0.012, filterFrequency: 1600 });
          });
        } else if (event.type === "hela") {
          const pan = sidePan(event.side, 0.58);
          engine.playTone({ frequency: event.side === "left" ? 310 : 360, duration: 0.075, type: "square", gain: 0.09 + intensity * 0.05, pan });
          engine.playNoise({ duration: 0.055, gain: 0.055 + intensity * 0.035, pan, filterFrequency: 2400 });
        } else if (event.type === "uwehe") {
          engine.playTone({ frequency: 132, duration: 0.1, type: "triangle", gain: 0.16 + intensity * 0.05, pan: 0, slideTo: 72 });
          engine.playNoise({ duration: 0.08, gain: 0.075 + intensity * 0.045, pan: -0.35, delay: 0.025, filterFrequency: 3200 });
          engine.playNoise({ duration: 0.08, gain: 0.075 + intensity * 0.045, pan: 0.35, delay: 0.055, filterFrequency: 3600 });
        }
      },
    },
    melodic: {
      label: "ペンタトニック旋律",
      description: "イベントを音程の違いで聞き分けます。デモやワークショップで動きと音楽化の関係を説明しやすい設定です。",
      rules: [
        "Kāholo: 低い反復音型で横移動の周期を示す",
        "Hela: 左右で異なる上行フレーズ",
        "ʻUwehe: 踵上げを短い和音で強調",
      ],
      play(engine, event) {
        const intensity = eventIntensity(event);
        if (event.type === "kaholo") {
          const notes = event.side === "right-start" ? [196, 247, 294, 247] : [196, 165, 147, 165];
          notes.forEach((frequency, index) => {
            engine.playTone({ frequency, duration: 0.13, type: "triangle", gain: 0.08 + intensity * 0.035, pan: index % 2 ? 0.24 : -0.24, delay: index * 0.105 });
          });
        } else if (event.type === "hela") {
          const notes = event.side === "left" ? [330, 392, 494] : [392, 494, 587];
          notes.forEach((frequency, index) => {
            engine.playTone({ frequency, duration: 0.16, type: "sine", gain: 0.07 + intensity * 0.035, pan: sidePan(event.side, 0.4), delay: index * 0.075 });
          });
        } else if (event.type === "uwehe") {
          engine.playChord([523, 659, 784], { duration: 0.32, type: "sine", gain: 0.055 + intensity * 0.035, pan: 0 });
          engine.playTone({ frequency: 1047, duration: 0.19, type: "triangle", gain: 0.045 + intensity * 0.025, pan: 0, delay: 0.09 });
        }
      },
    },
    spatial: {
      label: "空間スキャン",
      description: "左右・両足の方向感を強めたパターンです。iPadアプリ化時もWeb Audioの基本ノードだけで移植できます。",
      rules: [
        "Kāholo: 左右へ移動する低いスイープ",
        "Hela: 出した足側から中央へ戻る短い音",
        "ʻUwehe: 中央から左右へ広がる上昇音",
      ],
      play(engine, event) {
        const intensity = eventIntensity(event);
        if (event.type === "kaholo") {
          const startPan = event.side === "right-start" ? 0.55 : -0.55;
          [-1, 1, -1, 1].forEach((direction, index) => {
            engine.playTone({
              frequency: 180 + index * 22,
              duration: 0.12,
              type: "sawtooth",
              gain: 0.045 + intensity * 0.02,
              pan: startPan * direction,
              delay: index * 0.08,
              slideTo: 120 + index * 18,
            });
          });
        } else if (event.type === "hela") {
          const pan = sidePan(event.side, 0.7);
          engine.playTone({ frequency: 620, duration: 0.22, type: "triangle", gain: 0.08 + intensity * 0.045, pan, slideTo: 410 });
          engine.playTone({ frequency: 310, duration: 0.18, type: "sine", gain: 0.045 + intensity * 0.025, pan: pan * 0.35, delay: 0.05 });
        } else if (event.type === "uwehe") {
          engine.playTone({ frequency: 520, duration: 0.24, type: "triangle", gain: 0.08 + intensity * 0.04, pan: -0.5, slideTo: 880 });
          engine.playTone({ frequency: 520, duration: 0.24, type: "triangle", gain: 0.08 + intensity * 0.04, pan: 0.5, delay: 0.025, slideTo: 990 });
        }
      },
    },
    practice: {
      label: "練習クリック",
      description: "教師・ダンサーが検出タイミングを確認するための、短く邪魔にならないクリック音です。",
      rules: [
        "Kāholo: 低いクリック2回でステップまとまりを通知",
        "Hela: 左右別パンのクリック",
        "ʻUwehe: 高いクリック3回で踵上げを通知",
      ],
      play(engine, event) {
        const intensity = eventIntensity(event);
        if (event.type === "kaholo") {
          engine.playTone({ frequency: 220, duration: 0.045, type: "square", gain: 0.065 + intensity * 0.035, pan: -0.18 });
          engine.playTone({ frequency: 220, duration: 0.045, type: "square", gain: 0.065 + intensity * 0.035, pan: 0.18, delay: 0.12 });
        } else if (event.type === "hela") {
          engine.playTone({ frequency: 520, duration: 0.05, type: "square", gain: 0.07 + intensity * 0.035, pan: sidePan(event.side, 0.62) });
        } else if (event.type === "uwehe") {
          [0, 0.075, 0.15].forEach((delay) => {
            engine.playTone({ frequency: 880, duration: 0.042, type: "square", gain: 0.055 + intensity * 0.025, pan: 0, delay });
          });
        }
      },
    },
  };
  SONIFICATION_PRESETS.phaseMapping = {
    label: "Hawaiian Walkscape",
    description: "Kāholoは8フェイズでHigh-G Ukulele、Helaは6th Steel Guitarのスライド、ʻAmiはOcean/WindのGスウェルを鳴らします。",
    rules: [
      "Kāholo: 着地ごとにHigh-G Ukuleleの8カウントを進行",
      "Hela: C6/Fmaj7/G6系の4声6th chordをSteel guitar風に滑らせて発音",
      "ʻAmi: IMUが静かでCoPが前後左右へ動く時にOcean/WindのGスウェル",
    ],
    play() {},
  };
  const ACTIVE_SONIFICATION_PRESET_IDS = ["phaseMapping"];

  const $ = (id) => document.getElementById(id);
  const DEBUG_PREFIX = "[HulaMotionSonifier]";
  const SETTINGS_KEY = "orphe-hula-motion-sonifier-settings-v1";
  const AUDIO_MASTER_HEADROOM = 0.62;
  const AUDIO_OUTPUT_GAIN = 0.86;
  const MAX_SIGNAL_HISTORY = 120;

  const state = {
    devices: [],
    connected: [false, false],
    deviceToSide: {},
    manualSide: {},
    latest: {
      left: { pressure: [0, 0, 0, 0, 0, 0], acc: null, gyro: null, features: null },
      right: { pressure: [0, 0, 0, 0, 0, 0], acc: null, gyro: null, features: null },
    },
    sensorMaps: {
      left: DEFAULT_SENSOR_MAP.slice(),
      right: DEFAULT_SENSOR_MAP.slice(),
    },
    eventLog: [],
    signalHistory: [],
    lastSignalDrawAt: 0,
    soundingGesture: {
      type: null,
      phase: null,
      until: 0,
    },
    visualPressureMax: 800,
    debugSession: {
      active: false,
      targetStep: "kaholo",
      startedAt: null,
      stoppedAt: null,
      marks: [],
    },
    capture: {
      sessionId: null,
      active: false,
      startedAt: null,
      takeName: null,
      currentTrial: null,
      trials: [],
      samples: [],
      marks: [],
      pressureCount: 0,
      motionCount: 0,
    },
  };

  const detector = new HulaEventDetector();
  const recorder = new HulaSessionRecorder();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function eventIntensity(event) {
    const numeric = Number(event && event.intensity);
    return Number.isFinite(numeric) ? clamp(numeric, 0.2, 1) : 0.55;
  }

  function sidePan(side, amount) {
    if (side === "left") return -amount;
    if (side === "right") return amount;
    return 0;
  }

  function soundProxyForEvent(event) {
    const proxy = { ...event };
    return proxy;
  }

  function loadSettings() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      debugError("loadSettings() failed", error);
      return {};
    }
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(getAudioSettings()));
    } catch (error) {
      debugError("saveSettings() failed", error);
    }
  }

  function getAudioSettings() {
    const preset = audio.getPreset();
    return {
      presetId: audio.presetId,
      presetLabel: preset.label,
      masterVolume: Number($("master-volume") ? $("master-volume").value : 52) / 100,
      ambienceAmount: Number($("ambience-amount") ? $("ambience-amount").value : 36) / 100,
      demoTempoBpm: Number($("demo-tempo") ? $("demo-tempo").value : 88),
    };
  }

  function debugLog(message, detail = {}) {
    console.info(`${DEBUG_PREFIX} ${message}`, {
      ...detail,
      href: window.location.href,
      isSecureContext: window.isSecureContext,
      hasBluetooth: !!navigator.bluetooth,
      hasOrphe: typeof window.Orphe !== "undefined",
    });
  }

  function isBluetoothChooserCancel(error) {
    const message = error && error.message ? error.message : String(error || "");
    return (error && error.name === "NotFoundError") || message.includes("User cancelled the requestDevice() chooser");
  }

  function debugError(message, error, detail = {}) {
    if (isBluetoothChooserCancel(error)) {
      debugLog(`${message}: Bluetooth chooser cancelled`, {
        ...detail,
        errorName: error && error.name,
        errorMessage: error && error.message ? error.message : String(error),
      });
      return;
    }
    console.error(`${DEBUG_PREFIX} ${message}`, {
      ...detail,
      errorName: error && error.name,
      errorMessage: error && error.message ? error.message : String(error),
      error,
    });
  }

  window.addEventListener("error", (event) => {
    debugError("window error", event.error || event.message, {
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    debugError("unhandled promise rejection", event.reason);
  });

  class AudioEngine {
    constructor() {
      this.context = null;
      this.master = null;
      this.limiter = null;
      this.output = null;
      this.ambienceDelay = null;
      this.ambienceFeedback = null;
      this.ambienceWet = null;
      this.enabled = false;
      this.presetId = "phaseMapping";
      this.sequenceState = {};
      this.activeSources = new Set();
      this.hawaiianChordIndex = 0;
      this.lastKaholoPhase = null;
    }

    async enable() {
      if (!this.context) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error("このブラウザではWeb Audio APIを利用できません。");
        }
        this.context = new AudioContextClass();
        this.master = this.context.createGain();
        this.master.gain.value = 0.52 * AUDIO_MASTER_HEADROOM;
        this.limiter = this.context.createDynamicsCompressor();
        this.limiter.threshold.value = -18;
        this.limiter.knee.value = 16;
        this.limiter.ratio.value = 12;
        this.limiter.attack.value = 0.003;
        this.limiter.release.value = 0.18;
        this.output = this.context.createGain();
        this.output.gain.value = AUDIO_OUTPUT_GAIN;
        this.master.connect(this.limiter);
        this.limiter.connect(this.output);
        this.output.connect(this.context.destination);
        this.ambienceDelay = this.context.createDelay(1.6);
        this.ambienceFeedback = this.context.createGain();
        this.ambienceWet = this.context.createGain();
        this.ambienceDelay.delayTime.value = 0.22;
        this.ambienceFeedback.gain.value = 0.14;
        this.ambienceWet.gain.value = 0.045;
        this.master.connect(this.ambienceDelay);
        this.ambienceDelay.connect(this.ambienceFeedback);
        this.ambienceFeedback.connect(this.ambienceDelay);
        this.ambienceDelay.connect(this.ambienceWet);
        this.ambienceWet.connect(this.limiter);
      }
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
      this.enabled = true;
    }

    setMasterVolume(value) {
      const volume = clamp(Number(value), 0, 1);
      if (this.master) {
        this.master.gain.setTargetAtTime(volume * AUDIO_MASTER_HEADROOM, this.context.currentTime, 0.025);
      }
    }

    setAmbience(value) {
      const amount = clamp(Number(value), 0, 1);
      if (!this.ambienceWet || !this.ambienceFeedback || !this.ambienceDelay) return;
      this.ambienceWet.gain.setTargetAtTime(amount * 0.13, this.context.currentTime, 0.04);
      this.ambienceFeedback.gain.setTargetAtTime(0.06 + amount * 0.26, this.context.currentTime, 0.04);
      this.ambienceDelay.delayTime.setTargetAtTime(0.14 + amount * 0.24, this.context.currentTime, 0.04);
    }

    stopAll() {
      this.activeSources.forEach((source) => {
        try {
          source.stop();
        } catch (error) {
          // Already stopped sources are cleaned up by onended.
        }
      });
      this.activeSources.clear();
    }

    trackSource(source) {
      this.activeSources.add(source);
      source.onended = () => {
        this.activeSources.delete(source);
      };
    }

    playEvent(event) {
      if (!this.enabled || !this.context) return;
      if (this.playGesturePhaseSound(event)) return;
      const preset = SONIFICATION_PRESETS[this.presetId] || SONIFICATION_PRESETS.basic;
      const proxyEvent = soundProxyForEvent(event);
      preset.play(this, proxyEvent);
      if (proxyEvent.type !== event.type) {
        this.playExtendedStepAccent(event);
      }
    }

    playGesturePhaseSound(event) {
      const intensity = eventIntensity(event);
      if (event.type === "kaholo") {
        this.playKaholoUkulele(event, intensity);
        return true;
      }
      if (event.type === "hela") {
        this.playHelaSteel(event, intensity);
        return true;
      }
      if (event.type === "ami") {
        this.playAmiOcean(event, intensity);
        return true;
      }
      return false;
    }

    playExtendedStepAccent(event) {
      const intensity = eventIntensity(event);
      if (event.type === "lele") {
        this.playPianoNote(587.33, { duration: 0.42, gain: 0.035 + intensity * 0.02, pan: sidePan(event.side, 0.22), delay: 0.2 });
      } else if (event.type === "ami") {
        this.playTone({ frequency: 330, duration: 0.9, type: "sine", gain: 0.032 + intensity * 0.018, pan: -0.25, delay: 0.05, slideTo: 440, attack: 0.12 });
        this.playTone({ frequency: 392, duration: 0.9, type: "triangle", gain: 0.032 + intensity * 0.018, pan: 0.25, delay: 0.09, slideTo: 294, attack: 0.12 });
      } else if (event.type === "leleUwehe") {
        this.playClap({ gain: 0.075 + intensity * 0.025, pan: 0, delay: 0.18 });
      }
    }

    setPreset(presetId) {
      this.presetId = SONIFICATION_PRESETS[presetId] ? presetId : "phaseMapping";
    }

    getPreset() {
      return {
        id: this.presetId,
        ...SONIFICATION_PRESETS[this.presetId],
      };
    }

    playPreview(type) {
      const side = type === "hela" || type === "kaholo" ? "left" : "both";
      this.playEvent({
        id: `preview-${type}-${Date.now()}`,
        type,
        side,
        timestamp: Date.now(),
        phase: 1,
        phaseCount: type === "kaholo" || type === "ami" ? 8 : type === "hela" ? 4 : null,
        intensity: 0.76,
        reason: "試聴",
      });
    }

    nextProgression(key, progression) {
      const current = this.sequenceState[key] || 0;
      this.sequenceState[key] = current + 1;
      return progression[current % progression.length];
    }

    currentProgression(key, progression) {
      const current = Math.max(0, (this.sequenceState[key] || 1) - 1);
      return progression[current % progression.length];
    }

    currentHawaiianChord() {
      return HAWAIIAN_PROGRESSION[this.hawaiianChordIndex % HAWAIIAN_PROGRESSION.length];
    }

    normalizePhase(event, phaseCount) {
      return clamp((Number(event.phase) || 1) - 1, 0, phaseCount - 1);
    }

    advanceHawaiianProgression(phase) {
      if (phase === 1 && this.lastKaholoPhase != null && this.lastKaholoPhase !== 1) {
        this.hawaiianChordIndex = (this.hawaiianChordIndex + 1) % HAWAIIAN_PROGRESSION.length;
      }
      this.lastKaholoPhase = phase;
    }

    playKaholoUkulele(event, intensity) {
      const phase = this.normalizePhase(event, 8) + 1;
      this.advanceHawaiianProgression(phase);
      const chord = this.currentHawaiianChord();
      const noteIndex = KAHOLO_UKE_PHASE_PATTERN[phase - 1] || 0;
      const pan = sidePan(event.side, 0.28);
      const note = chord.ukulele[noteIndex];
      const energy = clamp(intensity, 0.2, 1);
      const air = clamp(0.28 + energy * 0.5, 0, 1);

      this.playUkuleleNote(note, {
        duration: 0.46 + air * 0.34,
        gain: 0.042 + energy * 0.018,
        pan,
        air,
      });

      if (phase === 1 || phase === 5) {
        this.playUkuleleStrum(chord.ukulele, {
          duration: 0.64 + air * 0.22,
          gain: 0.024 + energy * 0.01,
          pan: pan * 0.35,
          delay: 0.018,
          spread: 0.024 + air * 0.014,
        });
      }
    }

    playHelaSteel(event, intensity) {
      const chord = this.currentHawaiianChord();
      const energy = clamp(intensity, 0.2, 1);
      const pan = sidePan(event.side, 0.36);
      const air = clamp(0.46 + energy * 0.44, 0, 1);
      const slideDepth = 0.965 - energy * 0.014;
      const slideTime = 0.13 + air * 0.18;
      const strumGap = 0.052 + air * 0.025;
      const baseDuration = 2.2 + air * 1.4;
      const voicing = chord.steel;

      voicing.forEach((frequency, index) => {
        const voicePan = clamp(pan + (index - (voicing.length - 1) / 2) * 0.052, -0.85, 0.85);
        const gain = (0.019 + energy * 0.007) * (1 - index * 0.045);
        const delay = index * strumGap;
        this.playSteelVoice({
          fromFrequency: frequency * slideDepth,
          frequency,
          duration: baseDuration + index * 0.09,
          gain,
          pan: voicePan,
          delay,
          slideTime,
          vibratoDepth: 8 + energy * 9,
          vibratoDelay: 0.18 + index * 0.015,
          attack: 0.09,
          release: 1.55 + air * 0.7,
        });
      });
    }

    playAmiOcean(event, intensity) {
      const phase = Number(event.phase) || 1;
      const pan = Math.sin((phase / 8) * Math.PI * 2) * 0.38;
      const energy = clamp(intensity, 0.2, 1);

      this.playTone({
        frequency: 392.00,
        duration: 1.45,
        type: "sine",
        gain: 0.026 + energy * 0.01,
        pan,
        slideTo: 392.00 * (1.004 + energy * 0.006),
        attack: 0.24,
      });
      this.playTone({
        frequency: 196.00,
        duration: 1.65,
        type: "triangle",
        gain: 0.014 + energy * 0.006,
        pan: pan * 0.52,
        delay: 0.03,
        slideTo: 196.00 * 0.995,
        attack: 0.32,
      });
      this.playNoise({
        duration: 1.2,
        gain: 0.014 + energy * 0.01,
        pan,
        delay: 0.02,
        filterFrequency: 760 + energy * 380,
        filterType: "bandpass",
      });
      this.playNoise({
        duration: 1.75,
        gain: 0.009 + energy * 0.007,
        pan: -pan * 0.7,
        delay: 0.06,
        filterFrequency: 180,
        filterType: "lowpass",
      });
    }

    playTone({ frequency, duration, type, gain, pan, delay = 0, slideTo, attack = 0.012 }) {
      const now = this.context.currentTime + delay;
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (slideTo) {
        oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      }

      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), now + attack);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(envelope);
      this.connectToMaster(envelope, pan);

      this.trackSource(oscillator);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.04);
    }

    playPianoNote(frequency, { duration, gain, pan, delay = 0 }) {
      this.playTone({ frequency, duration, type: "triangle", gain, pan, delay, attack: 0.004 });
      this.playTone({ frequency: frequency * 2.003, duration: duration * 0.58, type: "sine", gain: gain * 0.28, pan, delay: delay + 0.002, attack: 0.003 });
      this.playTone({ frequency: frequency * 3.01, duration: duration * 0.34, type: "sine", gain: gain * 0.12, pan, delay: delay + 0.004, attack: 0.002 });
      this.playNoise({ duration: 0.018, gain: gain * 0.18, pan, delay, filterFrequency: 5200, filterType: "highpass" });
    }

    playUkuleleNote(frequency, { duration, gain, pan, delay = 0, air = 0.4 }) {
      this.playTone({ frequency, duration, type: "triangle", gain, pan, delay, attack: 0.0025 });
      this.playTone({
        frequency: frequency * 2.002,
        duration: duration * (0.44 + air * 0.18),
        type: "sine",
        gain: gain * 0.26,
        pan,
        delay: delay + 0.003,
        attack: 0.002,
      });
      this.playTone({
        frequency: frequency * 3.004,
        duration: duration * 0.28,
        type: "triangle",
        gain: gain * 0.08,
        pan,
        delay: delay + 0.005,
        attack: 0.0015,
      });
      this.playNoise({
        duration: 0.018 + air * 0.01,
        gain: gain * 0.28,
        pan,
        delay,
        filterFrequency: 3200 + air * 1600,
        filterType: "highpass",
      });
      this.playNoise({
        duration: 0.08 + air * 0.04,
        gain: gain * 0.14,
        pan: pan * 0.5,
        delay: delay + 0.004,
        filterFrequency: 680,
        filterType: "bandpass",
      });
    }

    playUkuleleStrum(frequencies, { duration, gain, pan, delay = 0, spread = 0.026 }) {
      frequencies.forEach((frequency, index) => {
        const notePan = pan + (index - (frequencies.length - 1) / 2) * 0.045;
        this.playUkuleleNote(frequency, {
          duration: duration * (1 - index * 0.06),
          gain: gain / Math.max(1, frequencies.length * 0.42),
          pan: notePan,
          delay: delay + index * spread,
          air: 0.62,
        });
      });
    }

    playPluck(frequency, { duration, gain, pan, delay = 0 }) {
      this.playTone({ frequency, duration, type: "triangle", gain, pan, delay, attack: 0.003 });
      this.playTone({ frequency: frequency * 2.01, duration: duration * 0.46, type: "square", gain: gain * 0.16, pan, delay: delay + 0.004, attack: 0.002 });
      this.playNoise({ duration: 0.026, gain: gain * 0.22, pan, delay, filterFrequency: 3800, filterType: "highpass" });
    }

    playSteelVoice({
      fromFrequency,
      frequency,
      duration,
      gain,
      pan,
      delay = 0,
      slideTime = 0.22,
      vibratoDepth = 12,
      vibratoDelay = 0.18,
      attack = 0.09,
      release = 1.9,
    }) {
      const now = this.context.currentTime + delay;
      const oscillator = this.context.createOscillator();
      const vibrato = this.context.createOscillator();
      const vibratoGain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      const envelope = this.context.createGain();
      const target = Math.max(1, frequency);
      const start = Math.max(1, fromFrequency);
      const releaseStart = now + Math.max(attack + 0.28, duration - release);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(start, now);
      oscillator.frequency.exponentialRampToValueAtTime(target, now + slideTime);

      vibrato.type = "sine";
      vibrato.frequency.setValueAtTime(4.2, now);
      vibratoGain.gain.setValueAtTime(0, now);
      vibratoGain.gain.setValueAtTime(0, now + vibratoDelay);
      vibratoGain.gain.linearRampToValueAtTime(vibratoDepth, now + vibratoDelay + 0.28);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(oscillator.detune);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(5200, now);
      filter.Q.setValueAtTime(0.65, now);

      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.linearRampToValueAtTime(Math.max(0.0001, gain), now + attack);
      envelope.gain.linearRampToValueAtTime(Math.max(0.0001, gain * 0.62), now + attack + 0.24);
      envelope.gain.setValueAtTime(Math.max(0.0001, gain * 0.62), releaseStart);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(filter);
      filter.connect(envelope);
      this.connectToMaster(envelope, pan);
      this.trackSource(oscillator);
      this.trackSource(vibrato);
      oscillator.start(now);
      vibrato.start(now);
      oscillator.stop(now + duration + 0.08);
      vibrato.stop(now + duration + 0.08);
    }

    playChord(frequencies, { duration, type, gain, pan, delay = 0 }) {
      frequencies.forEach((frequency, index) => {
        this.playTone({
          frequency,
          duration,
          type,
          gain: gain / Math.max(1, frequencies.length * 0.72),
          pan,
          delay: delay + index * 0.006,
        });
      });
    }

    playStrum(frequencies, { voice, duration, gain, pan, delay = 0, spread = 0.03 }) {
      frequencies.forEach((frequency, index) => {
        const noteDelay = delay + index * spread;
        const notePan = pan + (index - (frequencies.length - 1) / 2) * 0.08;
        if (voice === "piano") {
          this.playPianoNote(frequency, { duration, gain, pan: notePan, delay: noteDelay });
        } else {
          this.playPluck(frequency, { duration, gain, pan: notePan, delay: noteDelay });
        }
      });
    }

    playPad(frequencies, { duration, gain, pan, delay = 0, attack = 0.18 }) {
      frequencies.forEach((frequency, index) => {
        const notePan = pan + (index - (frequencies.length - 1) / 2) * 0.18;
        this.playTone({
          frequency,
          duration,
          type: index % 2 === 0 ? "sine" : "triangle",
          gain: gain / Math.max(1, frequencies.length * 0.85),
          pan: notePan,
          delay: delay + index * 0.018,
          attack,
        });
      });
    }

    playIpu({ gain, pan, delay = 0, low = false }) {
      this.playTone({
        frequency: low ? 92 : 138,
        duration: low ? 0.16 : 0.11,
        type: "triangle",
        gain,
        pan,
        delay,
        slideTo: low ? 54 : 88,
        attack: 0.004,
      });
      this.playNoise({
        duration: low ? 0.055 : 0.04,
        gain: gain * 0.34,
        pan,
        delay: delay + 0.006,
        filterFrequency: low ? 900 : 1500,
        filterType: "bandpass",
      });
    }

    playStepHit({ kind, gain, pan, delay = 0 }) {
      const isHeel = kind === "heel";
      this.playTone({
        frequency: isHeel ? 118 : 690,
        duration: isHeel ? 0.075 : 0.045,
        type: isHeel ? "triangle" : "square",
        gain,
        pan,
        delay,
        slideTo: isHeel ? 64 : 420,
        attack: 0.002,
      });
      this.playNoise({
        duration: isHeel ? 0.045 : 0.035,
        gain: gain * (isHeel ? 0.35 : 0.55),
        pan,
        delay: delay + 0.003,
        filterFrequency: isHeel ? 1400 : 5200,
        filterType: isHeel ? "bandpass" : "highpass",
      });
    }

    playClap({ gain, pan, delay = 0 }) {
      [0, 0.012, 0.026].forEach((offset, index) => {
        this.playNoise({
          duration: 0.05,
          gain: gain * (1 - index * 0.18),
          pan,
          delay: delay + offset,
          filterFrequency: 2300 + index * 950,
          filterType: "bandpass",
        });
      });
    }

    playNoise({ duration, gain, pan, delay = 0, filterFrequency = 2200, filterType = "bandpass" }) {
      const now = this.context.currentTime + delay;
      const sampleRate = this.context.sampleRate;
      const buffer = this.context.createBuffer(1, Math.max(1, Math.floor(sampleRate * duration)), sampleRate);
      const output = buffer.getChannelData(0);
      for (let index = 0; index < output.length; index += 1) {
        output[index] = Math.random() * 2 - 1;
      }

      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const envelope = this.context.createGain();
      source.buffer = buffer;
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFrequency, now);
      filter.Q.setValueAtTime(0.9, now);
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), now + 0.006);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      source.connect(filter);
      filter.connect(envelope);
      this.connectToMaster(envelope, pan);
      this.trackSource(source);
      source.start(now);
      source.stop(now + duration + 0.02);
    }

    connectToMaster(node, pan) {
      const panner = this.context.createStereoPanner ? this.context.createStereoPanner() : null;
      if (panner) {
        panner.pan.value = pan || 0;
        node.connect(panner);
        panner.connect(this.master);
      } else {
        node.connect(this.master);
      }
    }
  }

  const audio = new AudioEngine();

  function setupDevices() {
    debugLog("setupDevices() start");
    if (typeof window.Orphe === "undefined") {
      debugLog("setupDevices() failed: Orphe is undefined");
      setGlobalStatus("ORPHE-INSOLE.jsを読み込めませんでした。scriptのパスを確認してください。", true);
      return;
    }

    state.devices = [new Orphe(0), new Orphe(1)];
    state.devices.forEach((device, index) => {
      device.setup();
      debugLog("device setup complete", { index, uuidKeys: Object.keys(device.hashUUID || {}) });
      device.onScan = (deviceName) => debugLog("onScan", { index, deviceName });
      device.onConnectGATT = (uuid) => debugLog("onConnectGATT", { index, uuid });
      device.onConnect = (uuid) => {
        debugLog("onConnect", { index, uuid });
        updateConnectionStatus(index, true);
      };
      device.onDisconnect = () => {
        debugLog("onDisconnect", { index });
        updateConnectionStatus(index, false);
        delete state.deviceToSide[index];
        setDeviceStatus(index, "未接続");
      };
      device.onError = (error) => debugError("device.onError", error, { index });
      device.onWrite = (uuid) => debugLog("onWrite", { index, uuid });
      device.onStartNotify = (uuid) => debugLog("onStartNotify", { index, uuid });
      device.gotPress = (press) => handlePressure(index, press);
      device.gotConvertedAcc = (acc) => handleMotion(index, "acc", acc);
      device.gotConvertedGyro = (gyro) => handleMotion(index, "gyro", gyro);
    });
  }

  async function connectDevice(index) {
    const device = state.devices[index];
    debugLog("connectDevice() entered", {
      index,
      hasDeviceInstance: !!device,
      connected: state.connected[index],
      bluetoothDeviceName: device && device.bluetoothDevice && device.bluetoothDevice.name,
      gattConnected: !!(device && device.bluetoothDevice && device.bluetoothDevice.gatt && device.bluetoothDevice.gatt.connected),
    });
    if (!device) {
      debugLog("connectDevice() aborted: no device instance", { index });
      return;
    }

    if (state.connected[index]) {
      debugLog("connectDevice() disconnect branch", { index });
      device.stop();
      updateConnectionStatus(index, false);
      setGlobalStatus(`デバイス${index + 1}を切断しました。`);
      return;
    }

    if (!navigator.bluetooth) {
      debugLog("connectDevice() aborted: navigator.bluetooth missing", { index });
      setGlobalStatus("Web Bluetoothを利用できません。実機テストはデスクトップ版ChromeまたはEdgeで行ってください。", true);
      return;
    }

    setDeviceStatus(index, "接続中...");
    try {
      debugLog("connectDevice() before begin()", { index, streamingMode: 4 });
      await device.begin({ streamingMode: 4 });
      debugLog("connectDevice() begin() resolved", {
        index,
        bluetoothDeviceName: device.bluetoothDevice && device.bluetoothDevice.name,
      });
      setupDeviceSide(index);
      const name = device.bluetoothDevice ? device.bluetoothDevice.name : `デバイス${index + 1}`;
      setDeviceStatus(index, `接続済み: ${name}`);
      setGlobalStatus("SENSOR_VALUESを受信中です。まずはゆっくり動き、次に1つのステップをはっきり試してください。");
    } catch (error) {
      if (isBluetoothChooserCancel(error)) {
        debugLog("connectDevice() cancelled by user", { index });
        updateConnectionStatus(index, false);
        setDeviceStatus(index, "未接続");
        setGlobalStatus(`デバイス${index + 1}のBluetooth選択をキャンセルしました。`);
        return;
      }
      debugError("connectDevice() failed", error, { index });
      updateConnectionStatus(index, false);
      setDeviceStatus(index, `接続失敗: ${error.message}`);
      setGlobalStatus(`デバイス${index + 1}の接続に失敗しました: ${error.message}`, true);
    }
  }

  function setupDeviceSide(index) {
    const info = state.devices[index].device_information || {};
    const side = state.manualSide[index] || (((info.mount_position || 0) & 1) === 0 ? "left" : "right");
    state.deviceToSide[index] = side;
    const selector = $(`side-${index}`);
    if (selector) selector.value = side;
    renderDeviceInfo(index, info, side);
  }

  function setManualSide(index, side) {
    state.manualSide[index] = side;
    if (state.connected[index]) {
      state.deviceToSide[index] = side;
      renderDeviceInfo(index, state.devices[index].device_information || {}, side);
    }
  }

  function renderDeviceInfo(index, info, side) {
    $(`device-side-${index}`).textContent = SIDE_LABEL[side] || "未割当";
    const mount = Number.isFinite(info.mount_position) ? `${info.mount_position} (${SIDE_LABEL[side] || side})` : "不明";
    $(`device-meta-${index}`).textContent = `mount_position: ${mount}`;
    const battery = $(`battery-icon-${index}`);
    if (battery) {
      const batteryValue = Number(info.battery);
      const hasBattery = Number.isFinite(batteryValue) && batteryValue >= 0;
      const value = battery.querySelector("small");
      if (value) value.textContent = hasBattery ? `${batteryValue}` : "不明";
      battery.title = hasBattery ? `バッテリー: ${batteryValue}` : "バッテリー: 不明";
      battery.classList.toggle("is-on", hasBattery);
    }
  }

  function updateConnectionStatus(index, connected) {
    state.connected[index] = connected;
    const switchInput = $(`connect-${index}`);
    const toolkit = $(`toolkit-card-${index}`);
    const toolkitUi = $(`toolkit-ui-${index}`);
    const light = $(`device-light-${index}`);
    const activity = $(`activity-icon-${index}`);
    const stream = $(`stream-icon-${index}`);
    if (switchInput) {
      switchInput.checked = connected;
      switchInput.setAttribute("aria-checked", connected ? "true" : "false");
    }
    if (toolkit) toolkit.classList.toggle("is-connected", connected);
    if (toolkitUi) toolkitUi.classList.toggle("is-visible", connected);
    if (light) {
      light.classList.toggle("is-on", connected);
      const value = light.querySelector("small");
      if (value) value.textContent = connected ? "接続済み" : "未接続";
    }
    if (activity) {
      activity.classList.toggle("is-on", connected);
      const value = activity.querySelector("small");
      if (value) value.textContent = connected ? "受信中" : "待機中";
    }
    if (stream) {
      stream.classList.toggle("is-on", connected);
      const value = stream.querySelector("small");
      if (value) value.textContent = connected ? "Mode 4" : "Mode 4";
    }
  }

  function setDeviceStatus(index, text) {
    $(`device-status-${index}`).textContent = text;
  }

  function setGlobalStatus(text, isError = false) {
    const element = $("global-status");
    element.textContent = text;
    element.classList.toggle("is-error", isError);
  }

  function handlePressure(deviceIndex, press) {
    const side = state.deviceToSide[deviceIndex];
    if (!side) return;

    const receivedAt = Date.now();
    const values = Array.from(press.values || []);
    state.latest[side].pressure = values;
    const timestamp = press.timestamp || receivedAt;
    const result = detector.updatePressure(side, values, timestamp, state.sensorMaps[side]);
    state.latest.left.features = result.frame.feet.left;
    state.latest.right.features = result.frame.feet.right;

    recorder.recordFrame(result.frame);
    recordCapturePressure(deviceIndex, side, values, result, receivedAt, press.timestamp);
    renderFrame(result);
    result.events.forEach(handleDetectedEvent);
  }

  function handleMotion(deviceIndex, kind, value) {
    const side = state.deviceToSide[deviceIndex];
    if (!side) return;
    const timestamp = Date.now();
    state.latest[side][kind] = value;
    const result = detector.updateMotion(side, kind, value, timestamp);
    recordCaptureMotion(deviceIndex, side, kind, value, timestamp);
    const prefix = `${side}-${kind}`;
    ["x", "y", "z"].forEach((axis) => {
      const element = $(`${prefix}-${axis}`);
      if (element) element.textContent = formatNumber(value[axis], 2);
    });
    if (result && result.events && result.events.length) {
      result.events.forEach(handleDetectedEvent);
    }
    if (kind === "acc" && detector.lastFrame) {
      if (result && result.events && result.events.length) {
        renderExplanations(result.explanations);
        renderGestureState(result.gestureState);
      }
      renderSignalCharts(detector.lastFrame);
    }
  }

  function renderFrame(result) {
    renderFoot("left", result.frame.feet.left);
    renderFoot("right", result.frame.feet.right);
    renderLoad(result.frame.balance);
    renderExplanations(result.explanations);
    renderGestureState(result.gestureState);
    renderSignalCharts(result.frame);
    updateDebugStatus();
    updateCaptureStatus();
  }

  function renderFoot(side, foot) {
    foot.pressure.forEach((value, index) => {
      const sensor = $(`${side}-sensor-${index}`);
      if (!sensor) return;
      const heat = Math.min(value / state.visualPressureMax, 1);
      sensor.style.setProperty("--heat", heat.toFixed(3));
      sensor.style.backgroundColor = pressureColor(heat);
      const valueElement = sensor.querySelector(".sensor-value");
      if (valueElement) valueElement.textContent = Math.round(value);
      sensor.setAttribute("aria-label", `${SIDE_LABEL[side] || side} センサー ${index + 1}: ${Math.round(value)}`);
    });
    renderRawSignals(side, foot.rawPressure);
    $(`${side}-total`).textContent = Math.round(foot.total);
    $(`${side}-forefoot`).textContent = `${Math.round(foot.forefootRatio * 100)}%`;
    $(`${side}-nonheel`).textContent = `${Math.round(foot.nonHeelRatio * 100)}%`;
    $(`${side}-heel`).textContent = `${Math.round(foot.heelRatio * 100)}%`;
    const dot = $(`${side}-cop-dot`);
    dot.style.left = `${foot.cop.x * 100}%`;
    dot.style.top = `${foot.cop.y * 100}%`;
  }

  function renderRawSignals(side, values) {
    const container = $(`raw-signals-${side}`);
    if (!container) return;
    container.innerHTML = "";
    DEFAULT_SENSOR_MAP.forEach((rawIndex) => {
      const item = document.createElement("span");
      item.textContent = `信号${rawIndex + 1}: ${Math.round(values[rawIndex] || 0)}`;
      container.appendChild(item);
    });
  }

  function renderLoad(balance) {
    const leftPercent = Math.round(balance.leftLoad * 100);
    const rightPercent = Math.round(balance.rightLoad * 100);
    $("left-load-value").textContent = `${leftPercent}%`;
    $("right-load-value").textContent = `${rightPercent}%`;
    $("left-load-bar").style.width = `${leftPercent}%`;
    $("right-load-bar").style.width = `${rightPercent}%`;
  }

  function collectDetectionSignals(frame) {
    const timestamp = Date.now();
    const leftMotion = detector.getMotionFeatures("left", timestamp);
    const rightMotion = detector.getMotionFeatures("right", timestamp);
    const combinedMotion = detector.getCombinedMotion(timestamp);
    const copFeatures = detector.getCopFeatures(timestamp);
    const leftLoad = Number(frame.balance.leftLoad) || 0;
    const rightLoad = Number(frame.balance.rightLoad) || 0;
    return {
      timestamp,
      imuMajor: combinedMotion.planarMajor,
      imuMinor: combinedMotion.planarMinor,
      imuAxisRatio: combinedMotion.leading.xyRatio,
      imuLateralShare: combinedMotion.leading.lateralShare,
      imuForwardShare: combinedMotion.leading.forwardShare,
      leftImuMajor: leftMotion.planarMajor,
      rightImuMajor: rightMotion.planarMajor,
      leftImuMinor: leftMotion.planarMinor,
      rightImuMinor: rightMotion.planarMinor,
      copXRange: copFeatures.xRange,
      copYRange: copFeatures.yRange,
      copPath: copFeatures.path,
      loadDelta: Math.abs(leftLoad - rightLoad),
    };
  }

  function renderSignalCharts(frame) {
    if (!frame) return;
    const signals = collectDetectionSignals(frame);
    state.signalHistory.push(signals);
    if (state.signalHistory.length > MAX_SIGNAL_HISTORY) {
      state.signalHistory.splice(0, state.signalHistory.length - MAX_SIGNAL_HISTORY);
    }

    setChartValue("chart-value-imu-major", signals.imuMajor, 3);
    setChartValue("chart-value-imu-minor", signals.imuAxisRatio, 2);
    setChartValue("chart-value-cop-x", signals.copXRange, 3);
    setChartValue("chart-value-cop-y", signals.copYRange, 3);
    setChartValue("chart-value-cop-path", signals.copPath, 3);
    const loadValue = $("chart-value-load-delta");
    if (loadValue) loadValue.textContent = `${Math.round(signals.loadDelta * 100)}%`;

    const now = Date.now();
    if (now - state.lastSignalDrawAt < 33) return;
    state.lastSignalDrawAt = now;

    drawSignalChart("chart-imu-major", "imuMajor", {
      color: "#37d3d2",
      max: 0.12,
      thresholds: [
        { value: detector.options.imuMoveThreshold, color: "#172026" },
        { value: detector.options.imuStillThreshold, color: "#8aa0ac" },
      ],
    });
    drawSignalChart("chart-imu-minor", "imuAxisRatio", {
      color: "#f2664b",
      max: 2,
      thresholds: [
        { value: detector.options.imuAxisRatioThreshold, color: "#172026" },
      ],
    });
    drawSignalChart("chart-cop-x", "copXRange", {
      color: "#5eb36b",
      max: 0.04,
      thresholds: [{ value: detector.options.copLateralThreshold, color: "#172026" }],
    });
    drawSignalChart("chart-cop-y", "copYRange", {
      color: "#8b6bd6",
      max: 0.04,
      thresholds: [{ value: detector.options.copForwardThreshold, color: "#172026" }],
    });
    drawSignalChart("chart-cop-path", "copPath", {
      color: "#2f6fab",
      max: 0.08,
      thresholds: [{ value: detector.options.amiCopPath, color: "#172026" }],
    });
    drawSignalChart("chart-load-delta", "loadDelta", {
      color: "#f3c84b",
      max: 1,
      thresholds: [],
    });
  }

  function setChartValue(id, value, digits) {
    const element = $(id);
    if (element) element.textContent = formatNumber(value, digits);
  }

  function drawSignalChart(canvasId, key, options) {
    const canvas = $(canvasId);
    if (!canvas || !canvas.getContext) return;
    const context = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const width = Math.max(180, Math.round((rect.width || canvas.width) * pixelRatio));
    const height = Math.max(52, Math.round((rect.height || canvas.height) * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const values = state.signalHistory.map((item) => Number(item[key]) || 0);
    const thresholdMax = (options.thresholds || []).reduce((max, item) => Math.max(max, item.value || 0), 0);
    const dataMax = values.reduce((max, value) => Math.max(max, value), 0);
    const scaleMax = Math.max(options.max || 1, thresholdMax * 1.35, dataMax * 1.2, 0.001);
    const left = 10 * pixelRatio;
    const right = width - 6 * pixelRatio;
    const top = 8 * pixelRatio;
    const bottom = height - 10 * pixelRatio;
    const plotWidth = Math.max(1, right - left);
    const plotHeight = Math.max(1, bottom - top);

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#f4f8fa";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "#dce8ee";
    context.lineWidth = 1 * pixelRatio;
    [0.25, 0.5, 0.75].forEach((ratio) => {
      const y = bottom - plotHeight * ratio;
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(right, y);
      context.stroke();
    });

    (options.thresholds || []).forEach((threshold) => {
      if (!threshold.value) return;
      const y = bottom - clamp(threshold.value / scaleMax, 0, 1) * plotHeight;
      context.setLineDash([4 * pixelRatio, 4 * pixelRatio]);
      context.strokeStyle = threshold.color || "#172026";
      context.lineWidth = 1.2 * pixelRatio;
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(right, y);
      context.stroke();
      context.setLineDash([]);
    });

    if (values.length < 2) return;
    context.strokeStyle = options.color || "#37d3d2";
    context.lineWidth = 2.2 * pixelRatio;
    context.beginPath();
    values.forEach((value, index) => {
      const x = left + (plotWidth * index) / Math.max(1, values.length - 1);
      const y = bottom - clamp(value / scaleMax, 0, 1) * plotHeight;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }

  function renderExplanations(explanations) {
    STEP_CONFIG.forEach((step) => {
      renderExplanation(step.type, explanations[step.type]);
    });
  }

  function renderGestureState(gestureState) {
    const state = gestureState || {};
    const type = state.type || "none";
    const phaseText = state.phase && state.phaseCount ? `${state.phase} / ${state.phaseCount}` : "--";
    const confidence = Number(state.confidence) || 0;
    const name = $("current-gesture-name");
    const phase = $("current-gesture-phase");
    const confidenceElement = $("current-gesture-confidence");
    const reason = $("current-gesture-reason");
    const signalGrid = $("current-gesture-signals");
    if (name) name.textContent = state.label || "なし";
    if (phase) phase.textContent = phaseText;
    if (confidenceElement) confidenceElement.textContent = `${Math.round(clamp(confidence, 0, 1) * 100)}%`;
    if (reason) reason.textContent = state.reason || "IMUとCoPの変化を待っています。";
    if (signalGrid) {
      const signals = state.signals || {};
      const rows = [
        ["IMU主軸", formatNumber(signals.imuMajor, 3)],
        ["IMU X/Y比", formatNumber(signals.imuXYRatio, 2)],
        ["横成分", Number.isFinite(signals.imuLateralShare) ? `${Math.round(signals.imuLateralShare * 100)}%` : "--"],
        ["前後成分", Number.isFinite(signals.imuForwardShare) ? `${Math.round(signals.imuForwardShare * 100)}%` : "--"],
        ["着地パルス", formatNumber(signals.impact, 3)],
        ["CoP横", formatNumber(signals.copXRange, 3)],
        ["CoP前後", formatNumber(signals.copYRange, 3)],
        ["CoP軌跡", formatNumber(signals.copPath, 3)],
        ["荷重差", Number.isFinite(signals.loadDelta) ? `${Math.round(signals.loadDelta * 100)}%` : "--"],
        ["足", signals.foot || "--"],
      ];
      signalGrid.innerHTML = rows.map(([label, value]) => `<span><small>${label}</small><strong>${value}</strong></span>`).join("");
    }
    document.querySelectorAll("[data-gesture-card]").forEach((card) => {
      card.classList.toggle("is-current", card.dataset.gestureCard === type);
    });
  }

  function renderExplanation(type, explanation) {
    if (!explanation) return;
    const score = $(`${type}-score`);
    const reason = $(`${type}-reason`);
    const card = $(`${type}-card`);
    if (score) score.style.width = `${Math.round(clamp(Number(explanation.score) || 0, 0, 1) * 100)}%`;
    if (reason) reason.textContent = explanation.reason;
    if (card) card.classList.toggle("is-ready", explanation.active);
    renderGestureDetail(type, explanation);
    if (type === "kaholo" && $("kaholo-sequence")) {
      $("kaholo-sequence").textContent = explanation.sequence.length ? explanation.sequence.map((side) => SIDE_LABEL[side] || side).join(" -> ") : "待機中";
    }
    if (type === "hela" && $("hela-candidate")) {
      $("hela-candidate").textContent = SIDE_LABEL[explanation.candidateSide] || "なし";
    }
    if (type === "lele" && $(`${type}-sequence`)) {
      $(`${type}-sequence`).textContent = explanation.sequence && explanation.sequence.length
        ? explanation.sequence.map((side) => SIDE_LABEL[side] || side).join(" -> ")
        : "待機中";
    }
  }

  function renderGestureDetail(type, explanation) {
    const card = $(`${type}-card`);
    if (!card) return;
    const audioInfo = GESTURE_AUDIO_MAP[type] || {};
    const isSounding = state.soundingGesture.type === type && Date.now() < state.soundingGesture.until;
    const phaseCount = explanation.phaseCount || (audioInfo.phases ? audioInfo.phases.length : 0);
    const activePhase = isSounding && state.soundingGesture.phase
      ? state.soundingGesture.phase
      : explanation.phase || null;

    let stateElement = card.querySelector(".gesture-state");
    if (!stateElement) {
      stateElement = document.createElement("span");
      stateElement.className = "gesture-state";
      const kicker = card.querySelector(".event-card-kicker");
      const header = card.querySelector("header");
      if (kicker) kicker.appendChild(stateElement);
      else if (header) header.appendChild(stateElement);
    }
    stateElement.textContent = isSounding ? "発音中" : explanation.state || (explanation.active ? "成立中" : "待機");
    stateElement.classList.toggle("is-sounding", isSounding);

    let summary = card.querySelector(".gesture-summary-strip");
    if (!summary) {
      summary = document.createElement("div");
      summary.className = "gesture-summary-strip";
      card.appendChild(summary);
    }
    const phaseText = activePhase && phaseCount ? `${activePhase}/${phaseCount}` : "--";
    summary.innerHTML = `
      <div><small>現在フェイズ</small><strong>${phaseText}</strong></div>
      <div><small>発音</small><strong>${audioInfo.instrument || "--"} ${audioInfo.sound || ""}</strong></div>
      <div><small>鳴る瞬間</small><strong>${audioInfo.trigger || "--"}</strong></div>
    `;

    let phaseRail = card.querySelector(".gesture-phase-rail");
    if (!phaseRail) {
      phaseRail = document.createElement("div");
      phaseRail.className = "gesture-phase-rail";
      card.appendChild(phaseRail);
    }
    renderGesturePhaseRail(phaseRail, audioInfo, activePhase, phaseCount, isSounding);
    [
      ".gesture-details",
      ".gesture-algorithm",
      ".gesture-metrics",
      ".gesture-details-title",
      ".gesture-algorithm-title",
      ".gesture-metrics-title",
    ].forEach((selector) => {
      const element = card.querySelector(selector);
      if (element) element.remove();
    });
  }

  function renderSectionTitle(card, className, text, beforeElement) {
    let title = card.querySelector(`.${className}`);
    if (!title) {
      title = document.createElement("h4");
      title.className = `gesture-section-title ${className}`;
      if (beforeElement && beforeElement.parentElement === card) {
        card.insertBefore(title, beforeElement);
      } else {
        card.appendChild(title);
      }
    }
    title.textContent = text;
  }

  function renderGesturePhaseRail(container, audioInfo, activePhase, phaseCount, isSounding) {
    const labels = audioInfo.phases || Array.from({ length: phaseCount || 0 }, (_, index) => String(index + 1));
    const count = phaseCount || labels.length || 1;
    container.style.setProperty("--phase-count", count);
    container.innerHTML = "";
    labels.slice(0, count).forEach((label, index) => {
      const phase = index + 1;
      const cell = document.createElement("div");
      cell.className = "phase-cell";
      cell.classList.toggle("is-current", activePhase === phase);
      cell.classList.toggle("is-sounding", isSounding && activePhase === phase);
      cell.innerHTML = `<span>${label}</span><small>${phase}</small>`;
      container.appendChild(cell);
    });
  }

  function createGestureMetric(metric) {
    const row = document.createElement("div");
    row.className = "gesture-metric";
    row.classList.toggle("is-pass", metric.pass === true);
    row.classList.toggle("is-fail", metric.pass === false);
    const value = Number(metric.value) || 0;
    const threshold = Number(metric.threshold) || 0;
    const ratio = Number.isFinite(metric.ratio) ? metric.ratio : threshold ? value / threshold : value;
    const width = `${Math.round(clamp(ratio, 0, 1.25) * 80)}%`;
    const thresholdLeft = threshold ? "80%" : "100%";
    const valueText = metric.display || formatNumber(value, metric.digits == null ? 3 : metric.digits);
    const statusText = metric.pass === true ? "OK" : metric.pass === false ? "未達" : "参考";
    const thresholdText = metric.thresholdLabel || (threshold ? `閾値 ${formatNumber(threshold, metric.digits == null ? 3 : metric.digits)}` : "参考値");

    const head = document.createElement("div");
    head.className = "gesture-metric-head";
    const label = document.createElement("span");
    label.textContent = metric.label || "センサー";
    const strong = document.createElement("strong");
    strong.textContent = valueText;
    const passLabel = document.createElement("span");
    passLabel.className = "gesture-pass-label";
    passLabel.textContent = statusText;
    head.append(label, strong, passLabel);

    const thresholdElement = document.createElement("div");
    thresholdElement.className = "gesture-metric-threshold";
    thresholdElement.textContent = thresholdText;

    const meter = document.createElement("div");
    meter.className = "gesture-meter";
    const fill = document.createElement("div");
    fill.className = "gesture-meter-fill";
    fill.style.width = width;
    fill.style.opacity = metric.pass === false ? "0.42" : "1";
    const marker = document.createElement("span");
    marker.className = "gesture-meter-threshold";
    marker.style.left = thresholdLeft;
    meter.append(fill, marker);

    row.append(head, thresholdElement, meter);
    return row;
  }

  function handleDetectedEvent(event) {
    state.eventLog.unshift(event);
    if (state.eventLog.length > 60) state.eventLog.pop();
    recorder.recordEvent(event);
    audio.playEvent(event);
    renderEventLog();
    flashEvent(event);
  }

  function renderEventLog() {
    const list = $("event-log");
    list.innerHTML = "";
    if (!state.eventLog.length) {
      list.innerHTML = '<div class="empty-state">まだ検出イベントはありません。</div>';
      return;
    }

    state.eventLog.forEach((event) => {
      const existingLabel = recorder.labels.find((item) => item.eventId === event.id) || {};
      const row = document.createElement("div");
      row.className = `event-row event-${event.type}`;
      row.innerHTML = `
        <div>
          <strong>${STEP_LABELS[event.type] || event.type}</strong>
          <span>${SIDE_LABEL[event.side] || event.side || "パターン"} - ${new Date(event.timestamp).toLocaleTimeString()}</span>
          <small>${event.reason}</small>
        </div>
        <label>
          教師ラベル
          <select data-event-label="${event.id}">
            ${renderLabelOptions(existingLabel.label)}
          </select>
        </label>
        <label>
          メモ
          <input data-event-note="${event.id}" placeholder="任意メモ" value="${escapeAttribute(existingLabel.note || "")}">
        </label>
      `;
      list.appendChild(row);
    });

    list.querySelectorAll("[data-event-label]").forEach((select) => {
      select.addEventListener("change", updateLabelFromRow);
    });
    list.querySelectorAll("[data-event-note]").forEach((input) => {
      input.addEventListener("input", updateLabelFromRow);
    });
  }

  function renderLabelOptions(selectedValue) {
    const options = [
      { value: "", label: "未ラベル" },
      ...STEP_CONFIG.map((step) => ({ value: step.type, label: step.label })),
      { value: "other", label: "その他" },
    ];
    return options.map((option) => {
      const selected = selectedValue === option.value ? "selected" : "";
      return `<option value="${option.value}" ${selected}>${option.label}</option>`;
    }).join("");
  }

  function updateLabelFromRow(event) {
    const eventId = event.target.dataset.eventLabel || event.target.dataset.eventNote;
    const row = event.target.closest(".event-row");
    const label = row.querySelector("[data-event-label]").value;
    const note = row.querySelector("[data-event-note]").value;
    recorder.updateEventLabel(eventId, label, note);
  }

  function flashEvent(eventOrType) {
    const event = typeof eventOrType === "string" ? { type: eventOrType } : eventOrType || {};
    const type = event.type;
    const element = $(`${type}-card`);
    const overview = document.querySelector(".gesture-overview");
    state.soundingGesture = {
      type,
      phase: event.phase || null,
      until: Date.now() + 640,
    };
    if (type && detector.explanations && detector.explanations[type]) {
      renderGestureDetail(type, detector.explanations[type]);
    }
    if (element) {
      element.classList.add("is-fired");
      window.setTimeout(() => element.classList.remove("is-fired"), 560);
    }
    if (overview) {
      overview.classList.remove("is-kaholo", "is-hela", "is-ami");
      overview.classList.add("is-sounding", `is-${type}`);
      window.setTimeout(() => {
        overview.classList.remove("is-sounding", "is-kaholo", "is-hela", "is-ami");
        if (state.soundingGesture.type === type && Date.now() >= state.soundingGesture.until) {
          state.soundingGesture = { type: null, phase: null, until: 0 };
          if (detector.explanations && detector.explanations[type]) {
            renderGestureDetail(type, detector.explanations[type]);
          }
        }
      }, 560);
    }
  }

  function startRecording() {
    recorder.start();
    state.eventLog = [];
    renderEventLog();
    $("recording-state").textContent = "記録中";
    $("recording-state").classList.add("is-on");
    setGlobalStatus("足裏圧特徴量、検出イベント、教師ラベルを記録しています。");
  }

  function stopRecording() {
    recorder.stop();
    $("recording-state").textContent = "停止中";
    $("recording-state").classList.remove("is-on");
    setGlobalStatus(`セッションを停止しました。${recorder.samples.length}サンプル、${recorder.events.length}イベントをエクスポートできます。`);
  }

  function addManualLabel() {
    const label = $("manual-label").value;
    const note = $("manual-note").value;
    const event = {
      id: `manual-${Date.now()}`,
      type: "manual",
      label,
      side: "both",
      timestamp: Date.now(),
      intensity: 0,
      reason: note || "教師/ダンサーによる手動ラベルです。",
    };
    state.eventLog.unshift(event);
    recorder.recordEvent(event, true);
    recorder.updateEventLabel(event.id, label, note);
    renderEventLog();
  }

  function downloadSession() {
    const payload = buildSessionPayload();
    downloadJsonPayload(payload, "orphe-hula-session");
  }

  function buildSessionPayload() {
    const payload = recorder.toJSON();
    payload.sensorMaps = state.sensorMaps;
    payload.sensorLayout = SENSOR_LAYOUT;
    payload.sonification = getAudioSettings();
    payload.enabledSteps = { ...detector.options.enabledSteps };
    payload.debugSession = {
      ...state.debugSession,
      currentTargetStep: $("debug-target-step") ? $("debug-target-step").value : state.debugSession.targetStep,
    };
    return payload;
  }

  function downloadJsonPayload(payload, prefix) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    anchor.href = url;
    anchor.download = `${prefix}-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function ensureCaptureSession() {
    if (state.capture.sessionId) return;
    state.capture.sessionId = `hula-capture-${Date.now()}`;
    state.capture.startedAt = Date.now();
  }

  function getCaptureTargetGesture() {
    return state.capture.currentTrial ? state.capture.currentTrial.targetGesture : "unlabeled";
  }

  function getCaptureTargetLabel(gesture = getCaptureTargetGesture()) {
    return STEP_LABELS[gesture] || (gesture === "unlabeled" ? "未ラベル" : gesture);
  }

  function nextCaptureTrialIndex(gesture) {
    return state.capture.trials.filter((trial) => trial.targetGesture === gesture).length + 1;
  }

  function startCaptureTrial() {
    if (state.capture.active) {
      updateCaptureStatus();
      setGlobalStatus("すでに連続収録中です。ジェスチャ区間ボタンでラベルを切り替えてください。");
      return;
    }
    ensureCaptureSession();
    const now = Date.now();
    const note = $("capture-note").value.trim();
    state.capture.takeName = $("capture-trial-name").value.trim() || state.capture.takeName || `連続テイク ${new Date(now).toLocaleTimeString()}`;
    state.capture.active = true;
    state.capture.currentTrial = null;
    addCaptureMark("capture-start", { note: note || "連続収録開始", targetGesture: "unlabeled" });
    $("recording-state").textContent = "収録中";
    $("recording-state").classList.add("is-on");
    setGlobalStatus(`${state.capture.takeName} の連続収録を開始しました。動きが変わるタイミングで区間ボタンを押してください。`);
    updateCaptureStatus();
  }

  function stopCaptureTrial(reason = "manual") {
    if (!state.capture.active) {
      updateCaptureStatus();
      return;
    }
    closeCurrentCaptureSegment(reason === "auto-stop" ? "auto-stop" : "capture-stop");
    addCaptureMark("capture-stop", { note: reason === "auto-stop" ? "保存前に自動停止" : "連続収録停止", targetGesture: "unlabeled" });
    state.capture.active = false;
    state.capture.currentTrial = null;
    $("recording-state").textContent = "停止中";
    $("recording-state").classList.remove("is-on");
    setGlobalStatus(`連続収録を停止しました。区間 ${state.capture.trials.length}、圧力 ${state.capture.pressureCount}、IMU ${state.capture.motionCount} を保存できます。`);
    updateCaptureStatus();
  }

  function closeCurrentCaptureSegment(reason = "segment-switch") {
    if (!state.capture.currentTrial) return;
    const now = Date.now();
    const segment = state.capture.currentTrial;
    segment.stoppedAt = now;
    segment.tStop = state.capture.startedAt ? now - state.capture.startedAt : 0;
    segment.durationMs = segment.stoppedAt - segment.startedAt;
    segment.status = reason;
    segment.sampleEndIndex = state.capture.samples.length;
    state.capture.currentTrial = null;
  }

  function startCaptureSegment(gesture) {
    if (!state.capture.active) {
      startCaptureTrial();
    }
    if (!state.capture.active) return;
    if (gesture === "unlabeled") {
      closeCurrentCaptureSegment("unlabeled");
      addCaptureMark("segment-unlabeled", { targetGesture: "unlabeled", note: "区間なし/未ラベル" });
      setGlobalStatus("未ラベル区間に切り替えました。");
      updateCaptureStatus();
      return;
    }
    if (state.capture.currentTrial && state.capture.currentTrial.targetGesture === gesture) {
      addCaptureMark("segment-confirm", { targetGesture: gesture, note: `${getCaptureTargetLabel(gesture)}区間を継続` });
      updateCaptureStatus();
      return;
    }
    closeCurrentCaptureSegment("segment-switch");
    const now = Date.now();
    const segmentIndex = nextCaptureTrialIndex(gesture);
    const note = $("capture-note").value.trim();
    const segment = {
      id: `${gesture}-segment-${segmentIndex}-${now}`,
      name: `${getCaptureTargetLabel(gesture)} 区間 ${segmentIndex}`,
      targetGesture: gesture,
      targetLabel: getCaptureTargetLabel(gesture),
      segmentIndex,
      note,
      startedAt: now,
      tStart: state.capture.startedAt ? now - state.capture.startedAt : 0,
      stoppedAt: null,
      status: "active",
      sampleStartIndex: state.capture.samples.length,
      sampleEndIndex: null,
    };
    state.capture.currentTrial = segment;
    state.capture.trials.push(segment);
    addCaptureMark("segment-start", { targetGesture: gesture, note: `${segment.name} 開始` });
    setGlobalStatus(`${segment.name} に切り替えました。`);
    updateCaptureStatus();
  }

  function addCaptureMark(kind, detail = {}) {
    ensureCaptureSession();
    const now = Date.now();
    const targetGesture = detail.targetGesture || getCaptureTargetGesture();
    const note = detail.note != null ? detail.note : $("capture-note").value.trim();
    const mark = {
      id: `capture-${kind}-${now}-${Math.round(Math.random() * 1000)}`,
      kind,
      timestamp: now,
      t: state.capture.startedAt ? now - state.capture.startedAt : 0,
      trialId: state.capture.currentTrial ? state.capture.currentTrial.id : null,
      targetGesture,
      targetLabel: getCaptureTargetLabel(targetGesture),
      note: note || "",
      snapshot: createCaptureSnapshot(now),
    };
    state.capture.marks.push(mark);
    updateCaptureStatus();
    return mark;
  }

  function markCaptureNote() {
    if (!state.capture.active) {
      setGlobalStatus("注釈をマークする前に連続収録を開始してください。", true);
      return;
    }
    addCaptureMark("note");
    setGlobalStatus(`${getCaptureTargetLabel()} の注釈マークを追加しました。`);
  }

  function createCaptureSnapshot(timestamp = Date.now()) {
    const frame = detector.lastFrame;
    return {
      timestamp,
      connected: state.connected.slice(),
      deviceToSide: { ...state.deviceToSide },
      latest: {
        left: {
          pressure: state.latest.left.pressure.slice(),
          acc: state.latest.left.acc,
          gyro: state.latest.left.gyro,
          features: summarizeFootForDebug(state.latest.left.features),
        },
        right: {
          pressure: state.latest.right.pressure.slice(),
          acc: state.latest.right.acc,
          gyro: state.latest.right.gyro,
          features: summarizeFootForDebug(state.latest.right.features),
        },
      },
      classifier: {
        currentGesture: { ...detector.currentGesture },
      },
      signals: frame ? collectDetectionSignals(frame) : null,
    };
  }

  function recordCapturePressure(deviceIndex, side, values, result, receivedAt, deviceTimestamp) {
    if (!state.capture.active) return;
    const foot = result.frame.feet[side];
    appendCaptureSample({
      kind: "pressure",
      timestamp: receivedAt,
      deviceTimestamp: deviceTimestamp || null,
      deviceIndex,
      side,
      rawPressure: values.slice(),
      pressure: foot.pressure.slice(),
      features: summarizeFootForDebug(foot),
      frame: {
        total: result.frame.total,
        balance: result.frame.balance,
        centerCop: result.frame.centerCop,
        left: summarizeFootForDebug(result.frame.feet.left),
        right: summarizeFootForDebug(result.frame.feet.right),
      },
      classifier: {
        currentGesture: { ...detector.currentGesture },
        events: result.events.map((event) => ({ ...event })),
      },
      signals: collectDetectionSignals(result.frame),
    });
    state.capture.pressureCount += 1;
    updateCaptureStatus();
  }

  function recordCaptureMotion(deviceIndex, side, kind, value, timestamp) {
    if (!state.capture.active) return;
    appendCaptureSample({
      kind,
      timestamp,
      deviceIndex,
      side,
      value: {
        x: Number(value.x) || 0,
        y: Number(value.y) || 0,
        z: Number(value.z) || 0,
      },
      latestPressure: state.latest[side].pressure.slice(),
      latestFeatures: summarizeFootForDebug(state.latest[side].features),
      classifier: {
        currentGesture: { ...detector.currentGesture },
      },
      signals: detector.lastFrame ? collectDetectionSignals(detector.lastFrame) : null,
    });
    state.capture.motionCount += 1;
    updateCaptureStatus();
  }

  function appendCaptureSample(sample) {
    const trial = state.capture.currentTrial;
    state.capture.samples.push({
      ...sample,
      t: state.capture.startedAt ? sample.timestamp - state.capture.startedAt : 0,
      trialId: trial ? trial.id : null,
      trialT: trial ? sample.timestamp - trial.startedAt : null,
      targetGesture: trial ? trial.targetGesture : "unlabeled",
      targetLabel: trial ? trial.targetLabel : "未ラベル",
      trialName: trial ? trial.name : null,
    });
  }

  function buildCaptureDataset() {
    const now = Date.now();
    return {
      format: "orphe-insole-hula-gesture-capture",
      version: 1,
      sessionId: state.capture.sessionId || `hula-capture-${now}`,
      exportedAt: now,
      startedAt: state.capture.startedAt,
      takeName: state.capture.takeName,
      deviceToSide: { ...state.deviceToSide },
      sensorMaps: {
        left: state.sensorMaps.left.slice(),
        right: state.sensorMaps.right.slice(),
      },
      sensorLayout: SENSOR_LAYOUT,
      detectorOptions: { ...detector.options },
      capturePlan: {
        gestures: ["kaholo", "hela", "ami"],
        mode: "continuous-segment-labeling",
        notes: "Gesture buttons create labeled time segments. Samples without an active segment are marked as unlabeled. No phase labels are required.",
      },
      segments: state.capture.trials,
      trials: state.capture.trials,
      marks: state.capture.marks,
      samples: state.capture.samples,
    };
  }

  function downloadCaptureDataset() {
    if (state.capture.active) {
      stopCaptureTrial("auto-stop");
    }
    downloadJsonPayload(buildCaptureDataset(), "orphe-hula-gesture-capture");
  }

  function updateCaptureStatus() {
    const capture = state.capture;
    const status = $("capture-status");
    const elapsed = capture.startedAt ? Math.round((Date.now() - capture.startedAt) / 1000) : 0;
    if ($("capture-trial-count")) $("capture-trial-count").textContent = capture.trials.length;
    if ($("capture-pressure-count")) $("capture-pressure-count").textContent = capture.pressureCount;
    if ($("capture-motion-count")) $("capture-motion-count").textContent = capture.motionCount;
    if ($("capture-mark-count")) $("capture-mark-count").textContent = capture.marks.length;
    if ($("capture-elapsed")) $("capture-elapsed").textContent = `${elapsed}s`;
    if (!status) return;
    status.classList.toggle("is-active", capture.active);
    updateCaptureGestureButtons();
    if (capture.active) {
      const label = capture.currentTrial ? capture.currentTrial.name : "未ラベル区間";
      const trialElapsed = capture.currentTrial ? Math.round((Date.now() - capture.currentTrial.startedAt) / 1000) : elapsed;
      status.textContent = `収録中: ${label} / ${trialElapsed}s / 圧力 ${capture.pressureCount} / IMU ${capture.motionCount} / マーク ${capture.marks.length}`;
    } else {
      status.textContent = `停止中: 区間 ${capture.trials.length} / 圧力 ${capture.pressureCount} / IMU ${capture.motionCount} / マーク ${capture.marks.length}`;
    }
  }

  function updateCaptureGestureButtons() {
    const current = state.capture.currentTrial ? state.capture.currentTrial.targetGesture : state.capture.active ? "unlabeled" : null;
    document.querySelectorAll("[data-capture-gesture]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.captureGesture === current);
    });
  }

  function getDebugTargetStep() {
    const select = $("debug-target-step");
    return select ? select.value : state.debugSession.targetStep || "kaholo";
  }

  function getDebugTargetLabel(step) {
    return STEP_LABELS[step] || (step === "free" ? "自由テスト" : step);
  }

  function summarizeFootForDebug(foot) {
    if (!foot) return null;
    return {
      pressure: foot.pressure,
      rawPressure: foot.rawPressure,
      total: Math.round(foot.total),
      cop: foot.cop,
      heelRatio: foot.heelRatio,
      forefootRatio: foot.forefootRatio,
      nonHeelRatio: foot.nonHeelRatio,
      sensorMap: foot.sensorMap,
    };
  }

  function createDebugSnapshot(kind) {
    return {
      kind,
      targetStep: getDebugTargetStep(),
      timestamp: Date.now(),
      connected: state.connected.slice(),
      deviceToSide: { ...state.deviceToSide },
      left: {
        pressure: state.latest.left.pressure,
        acc: state.latest.left.acc,
        gyro: state.latest.left.gyro,
        features: summarizeFootForDebug(state.latest.left.features),
      },
      right: {
        pressure: state.latest.right.pressure,
        acc: state.latest.right.acc,
        gyro: state.latest.right.gyro,
        features: summarizeFootForDebug(state.latest.right.features),
      },
      explanations: JSON.parse(JSON.stringify(detector.explanations || {})),
      thresholds: {
        contactPressure: detector.options.contactPressure,
        imuMoveThreshold: detector.options.imuMoveThreshold,
        imuStillThreshold: detector.options.imuStillThreshold,
        copLateralThreshold: detector.options.copLateralThreshold,
        copForwardThreshold: detector.options.copForwardThreshold,
      },
      sensorMaps: {
        left: state.sensorMaps.left.slice(),
        right: state.sensorMaps.right.slice(),
      },
    };
  }

  function startDebugRecording() {
    const targetStep = getDebugTargetStep();
    recorder.start();
    state.eventLog = [];
    state.debugSession = {
      active: true,
      targetStep,
      startedAt: recorder.startedAt,
      stoppedAt: null,
      marks: [],
    };
    renderEventLog();
    $("recording-state").textContent = "記録中";
    $("recording-state").classList.add("is-on");
    setGlobalStatus(`${getDebugTargetLabel(targetStep)} のデバッグ記録を開始しました。動いた瞬間に「今の動きをマーク」または「音が出ない/違う」を押してください。`);
    updateDebugStatus();
  }

  function stopDebugRecording() {
    recorder.stop();
    if (state.debugSession.active) {
      state.debugSession.active = false;
      state.debugSession.stoppedAt = Date.now();
    }
    $("recording-state").textContent = "停止中";
    $("recording-state").classList.remove("is-on");
    setGlobalStatus(`デバッグ記録を停止しました。${recorder.samples.length}サンプル、${recorder.events.length}イベント、${state.debugSession.marks.length}マークを保存できます。`);
    updateDebugStatus();
  }

  function addDebugMark(kind) {
    if (!state.debugSession.startedAt) {
      startDebugRecording();
    }
    const targetStep = getDebugTargetStep();
    const mark = createDebugSnapshot(kind);
    mark.id = `debug-${kind}-${Date.now()}`;
    mark.t = state.debugSession.startedAt ? mark.timestamp - state.debugSession.startedAt : 0;
    state.debugSession.marks.push(mark);
    recorder.recordEvent({
      id: mark.id,
      type: "manual",
      label: targetStep,
      side: "both",
      timestamp: mark.timestamp,
      intensity: kind === "miss" ? 0 : 0.5,
      reason: kind === "miss"
        ? `${getDebugTargetLabel(targetStep)}を試したが、音が出ない/期待と違う`
        : `${getDebugTargetLabel(targetStep)}を試した瞬間の手動マーク`,
      debugMarkKind: kind,
    }, true);
    renderEventLog();
    updateDebugStatus();
  }

  function updateDebugStatus() {
    const element = $("debug-status");
    if (!element) return;
    const targetStep = getDebugTargetStep();
    const explanation = detector.explanations && detector.explanations[targetStep];
    const scoreText = explanation ? `${Math.round(explanation.score * 100)}%` : "--";
    const reasonText = explanation && explanation.reason ? explanation.reason : "まだ判定理由はありません";
    const elapsed = state.debugSession.startedAt ? Math.round((Date.now() - state.debugSession.startedAt) / 1000) : 0;
    element.classList.toggle("is-active", state.debugSession.active);
    element.textContent = state.debugSession.active
      ? `記録中 ${elapsed}s / 対象: ${getDebugTargetLabel(targetStep)} / サンプル ${recorder.samples.length} / イベント ${recorder.events.length} / マーク ${state.debugSession.marks.length} / 現在スコア ${scoreText} / ${reasonText}`
      : `停止中 / 対象: ${getDebugTargetLabel(targetStep)} / サンプル ${recorder.samples.length} / イベント ${recorder.events.length} / マーク ${state.debugSession.marks.length} / 現在スコア ${scoreText} / ${reasonText}`;
  }

  function downloadDebugSession() {
    const payload = buildSessionPayload();
    payload.debugSession.exportedForDebug = true;
    downloadJsonPayload(payload, "orphe-hula-debug-session");
  }

  async function enableAudio() {
    try {
      await audio.enable();
      $("audio-state").textContent = "音声オン";
      $("audio-state").classList.add("is-on");
      setGlobalStatus("音声を有効化しました。Kāholo/Hela/ʻAmiのフェイズ音が鳴ります。");
    } catch (error) {
      setGlobalStatus(error.message, true);
    }
  }

  function renderSonificationPresets() {
    audio.setPreset("phaseMapping");
  }

  function updateAudioControls() {
    const volumeControl = $("master-volume");
    const ambienceControl = $("ambience-amount");
    const demoTempoControl = $("demo-tempo");
    const volume = Number(volumeControl ? volumeControl.value : 52) / 100;
    const ambience = Number(ambienceControl ? ambienceControl.value : 36) / 100;
    audio.setMasterVolume(volume);
    audio.setAmbience(ambience);
    if ($("master-volume-value")) $("master-volume-value").textContent = `${Math.round(volume * 100)}%`;
    if ($("ambience-amount-value")) $("ambience-amount-value").textContent = `${Math.round(ambience * 100)}%`;
    if ($("demo-tempo-value")) $("demo-tempo-value").textContent = `${demoTempoControl ? demoTempoControl.value : 88} BPM`;
    saveSettings();
  }

  function renderStepToggles() {
    const container = $("step-toggle-grid");
    if (!container) return;
    container.innerHTML = "";
    STEP_CONFIG.forEach((step) => {
      const label = document.createElement("label");
      label.className = "step-toggle";
      label.innerHTML = `
        <span>
          <strong>${step.label}</strong>
          <small>${step.summary}</small>
        </span>
        <input type="checkbox" data-step-toggle="${step.type}" ${detector.options.enabledSteps[step.type] !== false ? "checked" : ""}>
      `;
      container.appendChild(label);
    });
  }

  function updateEnabledSteps() {
    const enabledSteps = { ...DEFAULT_OPTIONS.enabledSteps };
    document.querySelectorAll("[data-step-toggle]").forEach((checkbox) => {
      enabledSteps[checkbox.dataset.stepToggle] = checkbox.checked;
    });
    detector.options.enabledSteps = enabledSteps;
    recorder.options.enabledSteps = { ...enabledSteps };
  }

  function renderManualLabelOptions() {
    const select = $("manual-label");
    select.innerHTML = renderLabelOptions("kaholo").replace('value=""', 'value="" disabled');
    select.value = "kaholo";
  }

  function updateThresholds() {
    const enabledSteps = { ...(detector.options.enabledSteps || DEFAULT_OPTIONS.enabledSteps) };
    const nextOptions = {
      ...DEFAULT_OPTIONS,
      enabledSteps,
      contactPressure: Number($("threshold-contact").value),
      imuMoveThreshold: Number($("threshold-imu-move").value) / 1000,
      copLateralThreshold: Number($("threshold-cop-lateral").value) / 1000,
      copForwardThreshold: Number($("threshold-cop-forward").value) / 1000,
    };
    Object.assign(detector.options, nextOptions);
    Object.assign(recorder.options, nextOptions);
    detector.options.enabledSteps = enabledSteps;
    recorder.options.enabledSteps = { ...enabledSteps };
    $("threshold-contact-value").textContent = nextOptions.contactPressure;
    $("threshold-imu-move-value").textContent = nextOptions.imuMoveThreshold.toFixed(3);
    $("threshold-cop-lateral-value").textContent = nextOptions.copLateralThreshold.toFixed(3);
    $("threshold-cop-forward-value").textContent = nextOptions.copForwardThreshold.toFixed(3);
    if (detector.lastFrame) {
      state.lastSignalDrawAt = 0;
      renderSignalCharts(detector.lastFrame);
    }
  }

  function renderSensorMaps() {
    ["left", "right"].forEach((side) => {
      const container = $(`sensor-map-${side}`);
      if (!container) return;
      container.innerHTML = "";
      SENSOR_LAYOUT.forEach((sensor, index) => {
        const label = document.createElement("label");
        label.className = "map-select";
        const options = DEFAULT_SENSOR_MAP.map((rawIndex) => {
          const selected = state.sensorMaps[side][index] === rawIndex ? "selected" : "";
          return `<option value="${rawIndex}" ${selected}>信号${rawIndex + 1}</option>`;
        }).join("");
        label.innerHTML = `
          <span>図の${sensor.label}</span>
          <select data-map-side="${side}" data-physical-index="${index}">
            ${options}
          </select>
        `;
        container.appendChild(label);
      });
      updateMapWarning(side);
    });
  }

  function updateSensorMap(side, physicalIndex, rawIndex) {
    state.sensorMaps[side][physicalIndex] = rawIndex;
    updateMapWarning(side);
    const result = detector.updatePressure(side, state.latest[side].pressure, Date.now(), state.sensorMaps[side]);
    state.latest.left.features = result.frame.feet.left;
    state.latest.right.features = result.frame.feet.right;
    renderFrame(result);
  }

  function updateMapWarning(side) {
    const warning = $(`sensor-map-warning-${side}`);
    if (!warning) return;
    const unique = new Set(state.sensorMaps[side]);
    if (unique.size !== SENSOR_LAYOUT.length) {
      warning.textContent = "同じ信号が複数の図番号に割り当てられています。実機確認用には一意にしてください。";
      warning.classList.add("is-error");
    } else {
      warning.textContent = "図の番号ごとに、対応する実機の信号番号を選べます。";
      warning.classList.remove("is-error");
    }
  }

  function layoutSensorDots() {
    ["left", "right"].forEach((side) => {
      SENSOR_LAYOUT.forEach((sensor, index) => {
        const dot = $(`${side}-sensor-${index}`);
        if (!dot) return;
        const position = getSensorPosition(index, side);
        dot.style.left = `${position.x * 100}%`;
        dot.style.top = `${position.y * 100}%`;
        dot.innerHTML = `<span class="sensor-label">${sensor.label}</span><span class="sensor-value">0</span>`;
      });
    });
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) return "--";
    return value.toFixed(digits);
  }

  function pressureColor(heat) {
    const nextHeat = Math.max(0, Math.min(1, heat));
    const r = Math.round(244 + (242 - 244) * nextHeat);
    const g = Math.round(248 + (102 - 248) * nextHeat);
    const b = Math.round(250 + (75 - 250) * nextHeat);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function escapeAttribute(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function bindControls() {
    const bind = (id, eventName, handler) => {
      const element = $(id);
      if (element) element.addEventListener(eventName, handler);
    };
    [0, 1].forEach((index) => {
      const connectSwitch = $(`connect-${index}`);
      debugLog("binding connect switch", { index, found: !!connectSwitch });
      if (!connectSwitch) return;
      connectSwitch.addEventListener("pointerdown", (event) => {
        debugLog("connect switch pointerdown", {
          index,
          isTrusted: event.isTrusted,
          pointerType: event.pointerType,
          button: event.button,
        });
      });
      connectSwitch.addEventListener("click", (event) => {
        debugLog("connect switch click", {
          index,
          isTrusted: event.isTrusted,
          button: event.button,
          checked: event.currentTarget.checked,
        });
        connectDevice(index);
      });
      bind(`side-${index}`, "change", (event) => setManualSide(index, event.target.value));
    });
    bind("enable-audio", "click", enableAudio);
    ["master-volume", "ambience-amount", "demo-tempo"].forEach((id) => {
      bind(id, "input", updateAudioControls);
    });
    bind("start-recording", "click", startRecording);
    bind("stop-recording", "click", stopRecording);
    bind("download-session", "click", downloadSession);
    bind("start-debug-recording", "click", startDebugRecording);
    bind("stop-debug-recording", "click", stopDebugRecording);
    bind("mark-debug-attempt", "click", () => addDebugMark("attempt"));
    bind("mark-debug-miss", "click", () => addDebugMark("miss"));
    bind("download-debug-session", "click", downloadDebugSession);
    bind("debug-target-step", "change", updateDebugStatus);
    bind("start-capture-trial", "click", startCaptureTrial);
    bind("stop-capture-trial", "click", () => stopCaptureTrial("manual"));
    bind("mark-capture-note", "click", markCaptureNote);
    bind("download-capture-dataset", "click", downloadCaptureDataset);
    document.querySelectorAll("[data-capture-gesture]").forEach((button) => {
      button.addEventListener("click", () => startCaptureSegment(button.dataset.captureGesture));
    });
    bind("add-manual-label", "click", addManualLabel);
    document.querySelectorAll("[data-step-toggle]").forEach((checkbox) => {
      checkbox.addEventListener("change", updateEnabledSteps);
    });
    document.querySelectorAll("[data-map-side]").forEach((select) => {
      select.addEventListener("change", (event) => {
        updateSensorMap(
          event.target.dataset.mapSide,
          Number(event.target.dataset.physicalIndex),
          Number(event.target.value),
        );
      });
    });
    ["threshold-contact", "threshold-imu-move", "threshold-cop-lateral", "threshold-cop-forward"].forEach((id) => {
      bind(id, "input", updateThresholds);
    });
  }

  function init() {
    debugLog("init() start");
    setupDevices();
    layoutSensorDots();
    renderSensorMaps();
    renderSonificationPresets();
    renderStepToggles();
    renderManualLabelOptions();
    bindControls();
    updateEnabledSteps();
    updateAudioControls();
    updateThresholds();
    detector.update(Date.now());
    renderFrame({
      frame: detector.lastFrame,
      explanations: detector.explanations,
      events: [],
    });
    renderEventLog();
    updateDebugStatus();
    updateCaptureStatus();
    setGlobalStatus("準備完了です。ORPHE INSOLEを2台接続し、左右を割り当ててから音を有効化してください。");
    debugLog("init() complete");
  }

  window.addEventListener("load", init);
})();
