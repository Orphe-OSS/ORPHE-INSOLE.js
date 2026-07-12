// InsoleUtils（検証・キャリブレーション・CoP・接地検出）のユニットテスト。
// 正とする実装: docs/ai/PRESSURE_RECIPES.md / examples/balance-sway/balance-sway.js
const assert = require('node:assert/strict');

const {
  SENSOR_COUNT,
  MAX_UINT16,
  SENSOR_LAYOUT,
  mirrorForSide,
  validatePress,
  StuckChannelMonitor,
  PressureCalibrator,
  computeCoP,
  ContactDetector,
  sideFromMountPosition,
} = require('../src/InsoleUtils.js');

function main() {
  // ── validatePress: 正常系 ─────────────────────────────────────
  {
    const result = validatePress([100, 200, 300, 400, 500, 600]);
    assert.equal(result.ok, true);
    assert.deepEqual(result.values, [100, 200, 300, 400, 500, 600]);
    assert.deepEqual(result.flags, []);
  }

  // ── validatePress: エッジケース ───────────────────────────────
  {
    // 全ch 0（無負荷）は正常
    const zeros = validatePress([0, 0, 0, 0, 0, 0]);
    assert.equal(zeros.ok, true);

    // 全ch 65535（uint16 飽和）
    const saturated = validatePress(new Array(6).fill(65535));
    assert.equal(saturated.ok, false);
    assert.ok(saturated.flags.includes('SATURATED_CH'));
    assert.deepEqual(saturated.channels.saturated, [0, 1, 2, 3, 4, 5]);
    assert.deepEqual(saturated.values, new Array(6).fill(65535), 'saturated values are clamped, not zeroed');

    // NaN / Infinity → 0 に置換して NOT_FINITE
    const notFinite = validatePress([100, NaN, 300, Infinity, 500, 600]);
    assert.equal(notFinite.ok, false);
    assert.ok(notFinite.flags.includes('NOT_FINITE'));
    assert.deepEqual(notFinite.values, [100, 0, 300, 0, 500, 600]);

    // 5ch 配列 → BAD_LENGTH、6要素に 0 埋め
    const short = validatePress([1, 2, 3, 4, 5]);
    assert.equal(short.ok, false);
    assert.ok(short.flags.includes('BAD_LENGTH'));
    assert.equal(short.values.length, 6);
    assert.deepEqual(short.values, [1, 2, 3, 4, 5, 0]);
    // 欠損分は NOT_FINITE を出さない（BAD_LENGTH に集約）
    assert.ok(!short.flags.includes('NOT_FINITE'));

    // 配列でない
    assert.equal(validatePress(null).ok, false);
    assert.ok(validatePress(null).flags.includes('BAD_LENGTH'));
    assert.equal(validatePress(undefined).values.length, 6);

    // 負値 → 0 クランプ + NEGATIVE
    const negative = validatePress([-5, 10, 20, 30, 40, 50]);
    assert.ok(negative.flags.includes('NEGATIVE'));
    assert.equal(negative.values[0], 0);

    // saturationValue オプション（8192 スケールのモデル向け）
    const custom = validatePress([8192, 100, 100, 100, 100, 100], { saturationValue: 8192 });
    assert.ok(custom.flags.includes('SATURATED_CH'));
    assert.deepEqual(custom.channels.saturated, [0]);

    // 元配列を破壊しない
    const original = [1, 2, 3, 4, 5, 6];
    validatePress(original);
    assert.deepEqual(original, [1, 2, 3, 4, 5, 6]);
  }

  // ── SENSOR_LAYOUT / mirrorForSide ─────────────────────────────
  {
    assert.equal(SENSOR_LAYOUT.length, SENSOR_COUNT);
    // balance-sway の createSensorPoint と同一の値になっていること（ゴールデン）
    // P0: imageX=0.7596, imageY=0.1680, X_RANGE=0.58, Y_RANGE=0.9
    assert.ok(Math.abs(SENSOR_LAYOUT[0].x - (0.7596 - 0.5) * 0.58) < 1e-12);
    assert.ok(Math.abs(SENSOR_LAYOUT[0].y - (0.5 - 0.1680) * 0.9) < 1e-12);
    assert.equal(SENSOR_LAYOUT[5].label, 'P5');

    const left = mirrorForSide(SENSOR_LAYOUT, 'left');
    assert.equal(left[0].x, -SENSOR_LAYOUT[0].x);
    assert.equal(left[0].y, SENSOR_LAYOUT[0].y, 'y is not mirrored');
    const right = mirrorForSide(SENSOR_LAYOUT, 'right');
    assert.equal(right[0].x, SENSOR_LAYOUT[0].x);
    // 元配列を変更しない
    assert.ok(left !== SENSOR_LAYOUT && left[0] !== SENSOR_LAYOUT[0]);
  }

  // ── computeCoP ────────────────────────────────────────────────
  {
    // 単一チャネルに全荷重 → CoP はそのセンサ位置に一致
    const single = new Array(6).fill(0);
    single[0] = 1000;
    const cop = computeCoP(single);
    assert.equal(cop.isValid, true);
    assert.ok(Math.abs(cop.x - SENSOR_LAYOUT[0].x) < 1e-12);
    assert.ok(Math.abs(cop.y - SENSOR_LAYOUT[0].y) < 1e-12);
    assert.equal(cop.load, 1000);

    // balance-sway computeFootCop と同一式のゴールデンテスト（手計算）
    const values = [100, 200, 300, 400, 500, 600];
    const load = 2100;
    let expectedX = 0;
    let expectedY = 0;
    values.forEach((v, i) => {
      expectedX += SENSOR_LAYOUT[i].x * (v / load);
      expectedY += SENSOR_LAYOUT[i].y * (v / load);
    });
    const golden = computeCoP(values);
    assert.ok(Math.abs(golden.x - expectedX) < 1e-12);
    assert.ok(Math.abs(golden.y - expectedY) < 1e-12);
    assert.equal(golden.load, load);

    // 無負荷 → isValid=false
    const empty = computeCoP([0, 0, 0, 0, 0, 0]);
    assert.equal(empty.isValid, false);
    assert.ok(empty.flags.includes('LOAD_BELOW_THRESHOLD'));

    // minLoad オプション
    assert.equal(computeCoP(values, SENSOR_LAYOUT, { minLoad: 5000 }).isValid, false);
    assert.equal(computeCoP(values, SENSOR_LAYOUT, { minLoad: 0 }).isValid, true);

    // NaN 入りは値をサニタイズしつつ isValid=false（flags で分かる）
    const dirty = computeCoP([NaN, 200, 300, 400, 500, 600]);
    assert.equal(dirty.isValid, false);
    assert.ok(dirty.flags.includes('NOT_FINITE'));
    assert.equal(dirty.load, 2000);

    // 左足レイアウトで x が反転
    const leftCop = computeCoP(single, mirrorForSide(SENSOR_LAYOUT, 'left'));
    assert.ok(Math.abs(leftCop.x + SENSOR_LAYOUT[0].x) < 1e-12);

    // レイアウト不足はクラッシュせず BAD_LAYOUT
    const badLayout = computeCoP(values, [{ x: 0, y: 0 }]);
    assert.equal(badLayout.isValid, false);
    assert.ok(badLayout.flags.includes('BAD_LAYOUT'));
  }

  // ── PressureCalibrator ────────────────────────────────────────
  {
    const calib = new PressureCalibrator();
    assert.equal(calib.isCalibrated(), false);
    // 未キャリブレーションでも normalize は安全（0..1）
    const raw = calib.normalize([0, 65535, 30000, 0, 0, 0]);
    assert.ok(raw.every((v) => v >= 0 && v <= 1));

    calib.setZero([[100, 100, 100, 100, 100, 100], [120, 120, 120, 120, 120, 120]]);
    calib.setFull([[1110, 2110, 4110, 1110, 1110, 1110]]);
    assert.equal(calib.isCalibrated(), true);
    assert.deepEqual(calib.zero, [110, 110, 110, 110, 110, 110]);

    // zero=110, full=[1110,2110,4110,...] → レンジ [1000,2000,4000,...]
    const normalized = calib.normalize([610, 1110, 2110, 110, 60, 99999]);
    assert.ok(Math.abs(normalized[0] - 0.5) < 1e-3, `ch0 midpoint: ${normalized[0]}`);
    assert.ok(Math.abs(normalized[1] - 0.5) < 1e-3, 'ch1 midpoint');
    assert.ok(Math.abs(normalized[2] - 0.5) < 1e-3, 'ch2 midpoint');
    assert.equal(normalized[3], 0, 'zero point → 0');
    assert.equal(normalized[4], 0, 'below zero → clamp 0');
    assert.equal(normalized[5], 1, 'above full → clamp 1');

    // toJSON / fromJSON ラウンドトリップ
    const restored = PressureCalibrator.fromJSON(calib.toJSON());
    assert.equal(restored.isCalibrated(), true);
    assert.deepEqual(restored.normalize([610, 1110, 2110, 110, 60, 99999]), normalized);
    // 壊れた JSON は未キャリブレーション扱い
    assert.equal(PressureCalibrator.fromJSON({ zero: [1, 2] }).isCalibrated(), false);
    assert.equal(PressureCalibrator.fromJSON(null).isCalibrated(), false);
  }

  // ── ContactDetector ───────────────────────────────────────────
  {
    // on <= off は設定ミスとして弾く
    assert.throws(() => new ContactDetector({ on: 100, off: 100 }), TypeError);

    const detector = new ContactDetector({ on: 800, off: 400 });
    const events = [];
    detector.footDown = (info) => events.push('down@' + info.timestamp);
    detector.footUp = (info) => events.push('up@' + info.timestamp);

    // 接地 → ヒステリシス帯（400..800）では状態維持 → 離地
    assert.equal(detector.update(100, 0), null);
    assert.equal(detector.update(900, 10).event, 'down');
    assert.equal(detector.isContact, true);
    assert.equal(detector.update(600, 20), null, 'hysteresis band keeps contact');
    assert.equal(detector.update(500, 30), null);
    const up = detector.update(300, 40);
    assert.equal(up.event, 'up');
    assert.equal(up.stanceMs, 30, 'stance = 40 - 10');
    assert.equal(detector.isContact, false);
    // 再接地で flight 時間が返る
    const down2 = detector.update(1000, 100);
    assert.equal(down2.flightMs, 60, 'flight = 100 - 40');
    assert.deepEqual(events, ['down@10', 'up@40', 'down@100']);

    // minContactMs: 短すぎる接地では離地イベントを出さない（チャタリング除去）
    const debounced = new ContactDetector({ on: 800, off: 400, minContactMs: 50 });
    debounced.update(900, 0);              // down
    assert.equal(debounced.update(100, 20), null, 'contact shorter than 50ms is held');
    assert.equal(debounced.isContact, true);
    assert.equal(debounced.update(100, 60).event, 'up', 'after 50ms the up event fires');

    // minFlightMs: 短すぎる離地では再接地イベントを出さない
    const flightDebounced = new ContactDetector({ on: 800, off: 400, minFlightMs: 50 });
    flightDebounced.update(900, 0);   // down
    flightDebounced.update(100, 100); // up
    assert.equal(flightDebounced.update(900, 120), null, 'flight shorter than 50ms is ignored');
    assert.equal(flightDebounced.update(900, 160).event, 'down');

    // reset()
    detector.reset();
    assert.equal(detector.isContact, false);
    assert.equal(detector.update(900, 0).flightMs, null, 'no previous change after reset');
  }

  // ── StuckChannelMonitor ───────────────────────────────────────
  {
    const monitor = new StuckChannelMonitor({ windowFrames: 3, minTotalLoad: 1000 });
    const loaded = [0, 500, 500, 500, 500, 500]; // ch0 が荷重下で 0
    assert.deepEqual(monitor.update(loaded), []);
    assert.deepEqual(monitor.update(loaded), []);
    assert.deepEqual(monitor.update(loaded), [0], '3 frames of stuck-at-zero under load');

    // 荷重が抜けたフレームではカウントを進めない（離地では誤検出しない）
    const monitor2 = new StuckChannelMonitor({ windowFrames: 3, minTotalLoad: 1000 });
    monitor2.update(loaded);
    monitor2.update([0, 0, 0, 0, 0, 0]); // 離地
    monitor2.update(loaded);
    assert.deepEqual(monitor2.update(loaded), [0], 'unloaded frames neither reset nor advance');

    // 値が入ればリセット
    const monitor3 = new StuckChannelMonitor({ windowFrames: 3, minTotalLoad: 1000 });
    monitor3.update(loaded);
    monitor3.update(loaded);
    monitor3.update([100, 500, 500, 500, 500, 500]); // ch0 復帰
    assert.deepEqual(monitor3.update(loaded), [], 'recovery resets the streak');
  }

  // ── sideFromMountPosition ─────────────────────────────────────
  {
    assert.deepEqual(sideFromMountPosition(0b00), { side: 'left', surface: 'plantar', isRight: false, isDorsal: false });
    assert.deepEqual(sideFromMountPosition(0b01), { side: 'right', surface: 'plantar', isRight: true, isDorsal: false });
    assert.deepEqual(sideFromMountPosition(0b10), { side: 'left', surface: 'dorsal', isRight: false, isDorsal: true });
    assert.deepEqual(sideFromMountPosition(0b11), { side: 'right', surface: 'dorsal', isRight: true, isDorsal: true });
    assert.equal(sideFromMountPosition(undefined), null);
    assert.equal(sideFromMountPosition('1'), null);
    assert.equal(sideFromMountPosition(NaN), null);
  }

  // ── 定数 ──────────────────────────────────────────────────────
  assert.equal(SENSOR_COUNT, 6);
  assert.equal(MAX_UINT16, 65535);

  console.log('insole-utils.test.js passed');
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
