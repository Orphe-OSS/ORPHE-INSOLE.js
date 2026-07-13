/**
 * ORPHE INSOLE Utils — 圧力センサデータ処理の共通ユーティリティ（opt-in）
 *
 * `press.values`（6ch ADC 生値）の検証・キャリブレーション・CoP計算・接地検出を提供する。
 * examples 各所にコピペ実装されていた処理の SDK 昇格版で、
 * docs/ai/PRESSURE_RECIPES.md と examples/balance-sway の実装を正とする。
 *
 * コアSDK（ORPHE-INSOLE.js）から独立しており、単体で Node でも動作する。
 *
 * 注意: ADC 生値は物理量（体重・N）ではない。個体差・装着差があるため、
 * 物理量的な扱いが必要な場合は PressureCalibrator で 2点キャリブレーションを行うこと。
 */
(function (global) {

const SENSOR_COUNT = 6;
const MAX_UINT16 = 65535;

/**
 * 6ch 圧力センサのインソール画像上マーカー座標（0..1 の画像比率・実機採寸値の正）。
 * balance-sway / balance-tuner / showcase(viz-pressure) が共有するチャネル→位置の対応表。
 * チャネルの物理配置はモデルによって異なる場合があるため、
 * 配置が異なるモデルでは同形式の配列でリマップ層を挟むこと。
 */
const SENSOR_LAYOUT_IMAGE = [
  { x: 0.7596, y: 0.1680, label: 'P0' },
  { x: 0.7513, y: 0.3320, label: 'P1' },
  { x: 0.4024, y: 0.2210, label: 'P2' },
  { x: 0.5245, y: 0.3483, label: 'P3' },
  { x: 0.2884, y: 0.3681, label: 'P4' },
  { x: 0.5552, y: 0.8206, label: 'P5' }
];

// 画像比率 → 足ローカル座標の変換係数（balance-sway / balance-tuner と同一値）
const FOOT_LOCAL_X_RANGE = 0.58;
const FOOT_LOCAL_Y_RANGE = 0.9;

/**
 * 6ch 圧力センサの足ローカル座標系レイアウト（SENSOR_LAYOUT_IMAGE から導出）。
 * x: 内外方向 / y: 前後方向（+がつま先側）。単位は足長を約1とする無次元。
 * 左右反転が必要な場合は mirrorForSide() を使う。
 */
const SENSOR_LAYOUT = SENSOR_LAYOUT_IMAGE.map(function (sensor) {
  return {
    x: (sensor.x - 0.5) * FOOT_LOCAL_X_RANGE,
    y: (0.5 - sensor.y) * FOOT_LOCAL_Y_RANGE,
    label: sensor.label
  };
});

/**
 * レイアウトを左右反転した新しい配列を返す。
 * SENSOR_LAYOUT は右足基準なので、左足には mirrorForSide(SENSOR_LAYOUT, 'left') を使う。
 * @param {Array<{x:number,y:number,label?:string}>} layout
 * @param {'left'|'right'} side
 * @returns {Array<{x:number,y:number,label?:string}>} 新しい配列（元は変更しない）
 */
function mirrorForSide(layout, side) {
  const mirror = side === 'left';
  return layout.map(function (sensor) {
    return Object.assign({}, sensor, { x: mirror ? -sensor.x : sensor.x });
  });
}

/**
 * 圧力生値の単一フレーム検証。
 * flags:
 *   BAD_LENGTH   配列でない・6ch 未満（値は 0 埋めで補完される）
 *   NOT_FINITE   NaN / Infinity / 数値化不能（0 に置換される）
 *   NEGATIVE     負値（0 にクランプされる）
 *   SATURATED_CH 飽和値（既定 65535 = uint16 上限）に張り付いたチャネルあり
 * 「0 張り付き（断線疑い）」は時間履歴が必要なため StuckChannelMonitor を使うこと。
 * @param {number[]} values press.values
 * @param {{saturationValue?: number}} [options]
 * @returns {{ok: boolean, values: number[], flags: string[], channels: {saturated: number[]}}}
 *          values はクランプ・補完済みの安全な 6 要素配列（元配列は変更しない）
 */
function validatePress(values, options) {
  const saturationValue = (options && options.saturationValue) || MAX_UINT16;
  const flags = [];
  const saturated = [];

  if (!Array.isArray(values) || values.length < SENSOR_COUNT) {
    flags.push('BAD_LENGTH');
  }
  const source = Array.isArray(values) ? values : [];
  const sanitized = [];
  for (let i = 0; i < SENSOR_COUNT; i++) {
    const numberValue = Number(source[i]);
    if (!Number.isFinite(numberValue)) {
      if (i < source.length) flags.push('NOT_FINITE');
      sanitized.push(0);
      continue;
    }
    if (numberValue < 0) {
      flags.push('NEGATIVE');
      sanitized.push(0);
      continue;
    }
    if (numberValue >= saturationValue) {
      saturated.push(i);
      sanitized.push(saturationValue);
      continue;
    }
    sanitized.push(numberValue);
  }
  if (saturated.length > 0) flags.push('SATURATED_CH');

  return {
    ok: flags.length === 0,
    values: sanitized,
    flags: Array.from(new Set(flags)),
    channels: { saturated: saturated }
  };
}

/**
 * 「0 張り付き」チャネル（断線・接触不良疑い）の監視。
 * 足全体に荷重が乗っているのに特定チャネルだけ 0 が続く状態を検出する。
 * 単一フレームでは踵上げ等と区別できないため、時間窓で判定する。
 *
 * const monitor = new StuckChannelMonitor({ windowFrames: 200, minTotalLoad: 1000 });
 * insole.gotPress = (press) => {
 *   const stuck = monitor.update(press.values);
 *   if (stuck.length) console.warn('stuck channels:', stuck);
 * };
 */
class StuckChannelMonitor {
  /**
   * @param {{windowFrames?: number, minTotalLoad?: number}} [options]
   *   windowFrames: 連続何フレーム 0 が続いたら張り付きとみなすか（既定 200 ≒ mode4 で 2 秒）
   *   minTotalLoad: 「荷重が乗っている」とみなす合計生値のしきい値（既定 1000）
   */
  constructor(options) {
    const opts = options || {};
    this.windowFrames = opts.windowFrames > 0 ? opts.windowFrames : 200;
    this.minTotalLoad = opts.minTotalLoad >= 0 ? opts.minTotalLoad : 1000;
    this.reset();
  }

  reset() {
    this._zeroStreak = new Array(SENSOR_COUNT).fill(0);
  }

  /**
   * @param {number[]} values press.values（生値）
   * @returns {number[]} 張り付きと判定されたチャネル番号の配列（なければ空配列）
   */
  update(values) {
    const validated = validatePress(values);
    const total = validated.values.reduce(function (sum, value) { return sum + value; }, 0);
    const stuck = [];
    for (let i = 0; i < SENSOR_COUNT; i++) {
      // 荷重が乗っているフレームでのみ 0 連続をカウント（離地中はリセットしない・進めない）
      if (total >= this.minTotalLoad) {
        this._zeroStreak[i] = validated.values[i] === 0 ? this._zeroStreak[i] + 1 : 0;
      }
      if (this._zeroStreak[i] >= this.windowFrames) stuck.push(i);
    }
    return stuck;
  }
}

/**
 * 2点キャリブレーション（無負荷時・全体重時）による 0..1 正規化。
 * PRESSURE_RECIPES.md レシピ0 の SDK 版。
 *
 * const calib = new PressureCalibrator();
 * calib.setZero(zeroSamples);  // 無負荷で 1〜2 秒分の press.values を集めて渡す
 * calib.setFull(fullSamples);  // 全体重で同様
 * const normalized = calib.normalize(press.values); // 各ch 0..1
 */
class PressureCalibrator {
  constructor() {
    this.zero = new Array(SENSOR_COUNT).fill(0);
    this.full = new Array(SENSOR_COUNT).fill(MAX_UINT16);
    this._zeroSet = false;
    this._fullSet = false;
  }

  /** @returns {boolean} setZero と setFull の両方が済んでいるか */
  isCalibrated() {
    return this._zeroSet && this._fullSet;
  }

  /** @param {number[][]} samples 無負荷時の press.values の配列 */
  setZero(samples) {
    this.zero = averageChannels(samples);
    this._zeroSet = true;
  }

  /** @param {number[][]} samples 全体重時の press.values の配列 */
  setFull(samples) {
    this.full = averageChannels(samples);
    this._fullSet = true;
  }

  /**
   * @param {number[]} values press.values（生値）
   * @returns {number[]} 各チャネル 0..1 にクランプされた 6 要素配列
   */
  normalize(values) {
    const validated = validatePress(values);
    return validated.values.map((value, i) => {
      const range = this.full[i] - this.zero[i];
      const normalized = (value - this.zero[i]) / (range + 1e-6);
      return Math.max(0, Math.min(1, normalized));
    });
  }

  /** 保存用（localStorage 等）。 */
  toJSON() {
    return { zero: this.zero.slice(), full: this.full.slice() };
  }

  /** @param {{zero:number[], full:number[]}} json toJSON() の出力 */
  static fromJSON(json) {
    const calibrator = new PressureCalibrator();
    if (json && Array.isArray(json.zero) && Array.isArray(json.full) &&
      json.zero.length >= SENSOR_COUNT && json.full.length >= SENSOR_COUNT) {
      calibrator.zero = json.zero.slice(0, SENSOR_COUNT).map(function (value) {
        return Number.isFinite(Number(value)) ? Number(value) : 0;
      });
      calibrator.full = json.full.slice(0, SENSOR_COUNT).map(function (value) {
        return Number.isFinite(Number(value)) ? Number(value) : MAX_UINT16;
      });
      calibrator._zeroSet = true;
      calibrator._fullSet = true;
    }
    return calibrator;
  }
}

function averageChannels(samples) {
  const sum = new Array(SENSOR_COUNT).fill(0);
  if (!Array.isArray(samples) || samples.length === 0) return sum;
  let count = 0;
  for (const sample of samples) {
    const validated = validatePress(sample);
    validated.values.forEach(function (value, i) { sum[i] += value; });
    count++;
  }
  return sum.map(function (value) { return value / count; });
}

/**
 * 圧力中心（CoP）の計算。balance-sway の computeFootCop を正とする。
 * @param {number[]} values press.values（生値または正規化値）
 * @param {Array<{x:number,y:number}>} [layout] センサ座標（既定 SENSOR_LAYOUT = 右足基準。
 *        左足は mirrorForSide(SENSOR_LAYOUT, 'left') を渡す）
 * @param {{minLoad?: number}} [options] minLoad: これ未満の合計荷重では isValid=false（既定 1）
 * @returns {{x:number, y:number, load:number, isValid:boolean, flags:string[]}}
 *          isValid=false のとき x,y は 0（使用しないこと）
 */
function computeCoP(values, layout, options) {
  const sensors = layout || SENSOR_LAYOUT;
  const minLoad = options && typeof options.minLoad === 'number' && options.minLoad >= 0
    ? options.minLoad
    : 1;
  const validated = validatePress(values);
  if (sensors.length < SENSOR_COUNT) {
    return { x: 0, y: 0, load: 0, isValid: false, flags: validated.flags.concat('BAD_LAYOUT') };
  }
  const load = validated.values.reduce(function (sum, value) { return sum + value; }, 0);

  if (load < minLoad) {
    return { x: 0, y: 0, load: load, isValid: false, flags: validated.flags.concat('LOAD_BELOW_THRESHOLD') };
  }

  let copX = 0;
  let copY = 0;
  validated.values.forEach(function (value, i) {
    const weight = value / load;
    copX += sensors[i].x * weight;
    copY += sensors[i].y * weight;
  });
  return { x: copX, y: copY, load: load, isValid: validated.ok, flags: validated.flags };
}

/**
 * 接地/離地イベント検出（ヒステリシス + 最小継続時間）。
 * PRESSURE_RECIPES.md レシピ2 の SDK 版に、チャタリング除去用の最小継続時間を追加したもの。
 *
 * const detector = new ContactDetector({ on: 800, off: 400, minContactMs: 50 });
 * detector.footDown = (info) => console.log('down', info.flightMs);
 * detector.footUp = (info) => console.log('up', info.stanceMs);
 * insole.gotPress = (press) => {
 *   const total = press.values.reduce((a, b) => a + b, 0);
 *   detector.update(total, press.timestamp);
 * };
 */
class ContactDetector {
  /**
   * @param {{on: number, off: number, minContactMs?: number, minFlightMs?: number}} options
   *   on:  接地判定しきい値（要キャリブレーション）
   *   off: 離地判定しきい値（on より小さくすること）
   *   minContactMs: 接地とみなす最小継続時間。これ未満で off を割っても離地イベントを出さない（既定 0）
   *   minFlightMs:  離地とみなす最小継続時間（既定 0）
   */
  constructor(options) {
    const opts = options || {};
    if (!(opts.on > opts.off)) {
      throw new TypeError('ContactDetector: options.on must be greater than options.off');
    }
    this.on = opts.on;
    this.off = opts.off;
    this.minContactMs = opts.minContactMs > 0 ? opts.minContactMs : 0;
    this.minFlightMs = opts.minFlightMs > 0 ? opts.minFlightMs : 0;
    /** @type {(info:{timestamp:number, flightMs:number|null}) => void} 接地時コールバック（上書きして使う） */
    this.footDown = function () { };
    /** @type {(info:{timestamp:number, stanceMs:number|null}) => void} 離地時コールバック（上書きして使う） */
    this.footUp = function () { };
    this.reset();
  }

  reset() {
    this.isContact = false;
    this._lastChange = null;
  }

  /**
   * @param {number} total 合計荷重（生値または正規化値。on/off と同じ単位で）
   * @param {number} timestampMs タイムスタンプ [ms]（press.timestamp）
   * @returns {{event:'down', timestamp:number, flightMs:number|null} |
   *           {event:'up', timestamp:number, stanceMs:number|null} | null}
   */
  update(total, timestampMs) {
    const elapsed = this._lastChange === null ? null : timestampMs - this._lastChange;

    if (!this.isContact && total > this.on) {
      if (elapsed !== null && elapsed < this.minFlightMs) return null; // 直前の離地が短すぎる → チャタリング
      this.isContact = true;
      this._lastChange = timestampMs;
      const info = { event: 'down', timestamp: timestampMs, flightMs: elapsed };
      this.footDown(info);
      return info;
    }
    if (this.isContact && total < this.off) {
      if (elapsed !== null && elapsed < this.minContactMs) return null; // 接地が短すぎる → チャタリング
      this.isContact = false;
      this._lastChange = timestampMs;
      const info = { event: 'up', timestamp: timestampMs, stanceMs: elapsed };
      this.footUp(info);
      return info;
    }
    return null;
  }
}

/**
 * device_information.mount_position から装着情報を解釈する。
 * bit0: 0=LEFT, 1=RIGHT / bit1: 0=足底(plantar), 1=足背(dorsal)
 * @param {number} mountPosition device_information.mount_position
 * @returns {{side:'left'|'right', surface:'plantar'|'dorsal', isRight:boolean, isDorsal:boolean}|null}
 *          数値でない場合は null（未接続・未取得）
 */
function sideFromMountPosition(mountPosition) {
  if (typeof mountPosition !== 'number' || !Number.isFinite(mountPosition)) return null;
  const isRight = (mountPosition & 0b01) === 0b01;
  const isDorsal = (mountPosition & 0b10) === 0b10;
  return {
    side: isRight ? 'right' : 'left',
    surface: isDorsal ? 'dorsal' : 'plantar',
    isRight: isRight,
    isDorsal: isDorsal
  };
}

const InsoleUtils = {
  SENSOR_COUNT: SENSOR_COUNT,
  MAX_UINT16: MAX_UINT16,
  SENSOR_LAYOUT_IMAGE: SENSOR_LAYOUT_IMAGE,
  SENSOR_LAYOUT: SENSOR_LAYOUT,
  mirrorForSide: mirrorForSide,
  validatePress: validatePress,
  StuckChannelMonitor: StuckChannelMonitor,
  PressureCalibrator: PressureCalibrator,
  computeCoP: computeCoP,
  ContactDetector: ContactDetector,
  sideFromMountPosition: sideFromMountPosition
};

if (typeof global.OrpheInsoleUtils === 'undefined') {
  global.OrpheInsoleUtils = InsoleUtils;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = InsoleUtils;
}

})(typeof globalThis !== 'undefined' ? globalThis : this);
