// FIFO の単位換算・フレーム間隔に関する回帰テスト。
//
// (1) gyro[dps] は LSM6DSOX のデータシート代表感度（±2000 dps 固定で 0.07 dps/LSB）で
//     換算されること（クロスモジュール整合の詳細は insole-gyro-scale.test.js 側で検証済み。
//     ここでは FIFO 単体の変換関数を直接、既知の raw int16 で固定する）。
// (2) decodePacket() が返すサンプルのフレーム間隔は、実機の実測 ODR（約208Hz）に基づく
//     FRAME_INTERVAL_MS を使うこと（従来の 200Hz 仮定＝5ms/frame ではない）。
// (3) packetToCsvRows() の timestamp 文字列は、Python 参照実装とのバイト互換のため
//     意図的に旧来の 5ms/frame のまま据え置かれること（変わらないことを固定する）。

const assert = require('node:assert/strict');
const Fifo = require('../src/InsoleFifo.js');

function near(actual, expected, label, tol = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: expected ${expected}, got ${actual}`);
}

// ── (1) gyro 変換定数: 既知の raw int16 → データシート感度の物理値 ──────────
{
  // 仕様: raw * GYRO_DPS_PER_LSB（= 0.07 dps/LSB, ±2000dps固定）。
  assert.equal(Fifo.GYRO_DPS_PER_LSB, 0.07);

  const raw = 10000; // 正の既知値
  near(Fifo.gyroToDps((raw >> 8) & 0xff, raw & 0xff), raw * 0.07, 'gyroToDps(+10000) uses datasheet sensitivity');

  const rawNeg = -12345; // 負の既知値（signed Q15 の復元も確認）
  const u = rawNeg & 0xffff;
  near(Fifo.gyroToDps((u >> 8) & 0xff, u & 0xff), rawNeg * 0.07, 'gyroToDps(-12345) uses datasheet sensitivity');

  // 退行検出: 旧実装（理想Q15 raw/32768*2000 = 61.035 mdps/LSB）とは比 1.14688 で異なる。
  const idealQ15 = (raw / 32768) * 2000;
  near((raw * Fifo.GYRO_DPS_PER_LSB) / idealQ15, 1.14688, 'ratio to the old ideal-Q15 conversion', 1e-9);
}

// ── ヘルパ: FIFO データパケット(0x36, 104 bytes) ──
function makeDataPacket({ serial = 1, h = 0, m = 0, s = 0, ms = 0 } = {}) {
  const dv = new DataView(new ArrayBuffer(104));
  dv.setUint8(0, 0x36);
  dv.setUint16(1, serial);
  dv.setUint8(3, h);
  dv.setUint8(4, m);
  dv.setUint8(5, s);
  dv.setUint16(6, ms);
  return dv;
}

// ── (2) decodePacket(): フレーム間隔は実測 ODR 由来の FRAME_INTERVAL_MS ────────
{
  assert.equal(Fifo.IMU_ODR_HZ, 208, 'assumed IMU ODR is documented as a named constant');
  near(Fifo.FRAME_INTERVAL_MS, 1000 / 208, 'FRAME_INTERVAL_MS derives from IMU_ODR_HZ');
  // 従来仮定の 5ms/frame ではないことを明示的に固定する。
  assert.notEqual(Fifo.FRAME_INTERVAL_MS, 5);

  const dv = makeDataPacket({ serial: 42, h: 1, m: 2, s: 3, ms: 100 });
  const decoded = Fifo.decodePacket(dv);
  assert.equal(decoded.samples.length, 4);

  for (let pn = 0; pn < 4; pn++) {
    near(decoded.samples[pn].t, decoded.timestamp + pn * Fifo.FRAME_INTERVAL_MS,
      `sample[${pn}].t uses FRAME_INTERVAL_MS spacing`);
  }
  // 連続サンプル間の dt は一定かつ FRAME_INTERVAL_MS（≈4.8077ms、旧仮定の5msではない）。
  for (let pn = 1; pn < 4; pn++) {
    const dt = decoded.samples[pn].t - decoded.samples[pn - 1].t;
    near(dt, Fifo.FRAME_INTERVAL_MS, `dt between consecutive samples (pn=${pn - 1}->${pn})`);
    assert.notEqual(dt, 5, `dt between consecutive samples (pn=${pn - 1}->${pn}) must not be the old 5ms assumption`);
  }
}

// ── (3) packetToCsvRows(): 参照実装とのバイト互換のため意図的に旧来値(5ms)を据え置く ──
{
  assert.equal(Fifo.LEGACY_CSV_FRAME_INTERVAL_MS, 5);

  const dv = makeDataPacket({ serial: 1234, h: 12, m: 0, s: 1, ms: 995 });
  const rows = Fifo.packetToCsvRows(dv);
  assert.equal(rows.length, 4);
  // タイムスタンプ文字列はフレームごとに +5ms（995 → 000 → 005 → 010、秒の桁上げも）。
  assert.ok(rows[0].includes('12:00:01:995'), rows[0]);
  assert.ok(rows[1].includes('12:00:02:000'), rows[1]);
  assert.ok(rows[2].includes('12:00:02:005'), rows[2]);
  assert.ok(rows[3].includes('12:00:02:010'), rows[3]);
}

console.log('insole-fifo-timing.test.js passed');
