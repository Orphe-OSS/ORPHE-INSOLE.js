// gyro 物理単位換算のクロスモジュール整合テスト
//
// gyro[dps] への換算式は core（src/ORPHE-INSOLE.js の parseInsoleSensorValues）と
// FIFO（src/InsoleFifo.js の gyroToDps）に別々に実装されている。同じ式が複製された結果
// 片方だけ直る／片方だけ退行する事故を防ぐため、ここで両者を突き合わせて固定する。
//
// 仕様: gyro の raw は LSM6DSOX の int16。物理値はレンジ別の代表感度
//   ±250 dps → 8.75 mdps/LSB / ±500 → 17.5 / ±1000 → 35 / ±2000 → 70
// を掛けて得る。正規化コールバック（gotGyro = raw/32768）は後方互換のため不変。
// FIFO は ±2000 dps 固定なので 0.07 dps/LSB。

const assert = require('node:assert/strict');
const { parseInsoleSensorValues } = require('../src/ORPHE-INSOLE.js');
const Fifo = require('../src/InsoleFifo.js');

const GYRO_MDPS_PER_LSB_BY_RANGE = [
  [250, 0.00875],
  [500, 0.0175],
  [1000, 0.035],
  [2000, 0.07],
];

function near(actual, expected, label, tol = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${label}: expected ${expected}, got ${actual}`
  );
}

// FIFO データパケット(0x36, 104 bytes)。byte 配置は realtime header 55 と同一なので、
// 同じ DataView を core パーサと FIFO デコーダの両方に通せる。
function makeSharedPacket(frames, serial = 777) {
  const dv = new DataView(new ArrayBuffer(104));
  dv.setUint8(0, 0x36);
  dv.setUint16(1, serial);
  dv.setUint8(3, 12);
  dv.setUint8(4, 34);
  dv.setUint8(5, 56);
  dv.setUint16(6, 789);
  for (let i = 0; i < 4; i++) {
    const o = i * 24 + 8;
    const f = frames[i];
    f.gyro.forEach((v, k) => dv.setInt16(o + k * 2, v));
    f.acc.forEach((v, k) => dv.setInt16(o + 6 + k * 2, v));
    f.press.forEach((v, k) => dv.setUint16(o + 12 + k * 2, v));
  }
  return dv;
}

// ── レンジ別感度（core） ──────────────────────────────────────────────
{
  const raws = [1, -1, 100, -32768, 32767];
  for (const [range, dpsPerLsb] of GYRO_MDPS_PER_LSB_BY_RANGE) {
    for (const raw of raws) {
      const dv = makeSharedPacket([
        { gyro: [raw, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
        { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
        { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
        { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
      ]);
      const parsed = parseInsoleSensorValues(dv, { gyroRange: range });
      const sample = parsed.samples[3]; // 物理フレーム 0 は packet_number 3
      near(sample.converted_gyro.x, raw * dpsPerLsb, `core ${range}dps raw=${raw}`);
      near(sample.gyro.x, raw / 32768, `core ${range}dps normalized raw=${raw}`);
    }
  }
}

// ── core と FIFO が同じ係数を使うこと（同一バイト列で突き合わせ） ─────────
{
  const frames = [
    { gyro: [16384, -16384, 1], acc: [16384, -8192, 4096], press: [1, 2, 3, 4, 5, 6] },
    { gyro: [-32768, 32767, 0], acc: [0, 0, 0], press: [7, 8, 9, 10, 11, 12] },
    { gyro: [123, -456, 789], acc: [1, -2, 3], press: [13, 14, 15, 16, 17, 18] },
    { gyro: [0, 0, 0], acc: [0, 0, 0], press: [19, 20, 21, 22, 23, 24] },
  ];
  const dv = makeSharedPacket(frames);

  // FIFO は ±2000 dps 固定なので、core も既定（2000）で比較する。
  const parsed = parseInsoleSensorValues(dv);
  const decoded = Fifo.decodePacket(dv);

  assert.equal(parsed.samples.length, decoded.samples.length);
  for (let i = 0; i < parsed.samples.length; i++) {
    const core = parsed.samples[i];
    const fifo = decoded.samples[i];
    assert.equal(core.packet_number, fifo.packet_number, `packet_number[${i}]`);
    assert.deepEqual(core.press.values, fifo.press.values, `press[${i}]`);
    for (const axis of ['x', 'y', 'z']) {
      near(
        core.converted_gyro[axis],
        fifo.converted_gyro[axis],
        `core/fifo gyro ${axis}[${i}] must use the same scale`
      );
      near(
        core.converted_acc[axis],
        fifo.converted_acc[axis],
        `core/fifo acc ${axis}[${i}] must use the same scale`
      );
    }
  }
}

// ── 感度の絶対値を固定（理想Q15への退行を検出） ────────────────────────
{
  const raw = 10000;
  const dv = makeSharedPacket([
    { gyro: [raw, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
    { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
    { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
    { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
  ]);
  const core = parseInsoleSensorValues(dv).samples[3].converted_gyro.x;
  const fifo = Fifo.gyroToDps((raw >> 8) & 0xff, raw & 0xff);
  near(core, raw * 0.07, 'core ±2000dps sensitivity');
  near(fifo, raw * 0.07, 'fifo ±2000dps sensitivity');

  // 旧実装（理想 Q15: raw/32768*2000）との比は 1.14688。退行したら気づけるようにする。
  const idealQ15 = (raw / 32768) * 2000;
  near(core / idealQ15, 1.14688, 'ratio to the previous ideal-Q15 conversion', 1e-9);
}

// ── acc は変更しない（データシート感度 0.488 mg/LSB と一致するため） ─────
{
  const dv = makeSharedPacket([
    { gyro: [0, 0, 0], acc: [16384, 0, 0], press: [0, 0, 0, 0, 0, 0] },
    { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
    { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
    { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
  ]);
  near(parseInsoleSensorValues(dv).samples[3].converted_acc.x, 8, 'acc conversion unchanged');
  near(Fifo.accToG(16384 >> 8, 16384 & 0xff), 8, 'fifo acc conversion unchanged');
}

console.log('insole-gyro-scale.test.js passed');
