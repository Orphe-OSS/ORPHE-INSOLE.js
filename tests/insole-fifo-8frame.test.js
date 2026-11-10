// FW 20260924.1 以降の FIFO データパケット（ヘッダ 0x3A・200 byte・8 フレーム）の回帰テスト。
//
// 旧実装は「ヘッダ 0x36 かつ 104 byte」以外のデータパケットを黙って捨てていたため、
// 新しい FW では FIFO 収録が 1 件も回収できなかった（エラーも出ず 0 件のまま終わる）。
// ここでは 8 フレーム形式のデコード・CSV・リング上限・モックデバイスでの収録一式と、
// 「未対応の形式を黙って捨てない」ことを検証する。従来の 4 フレーム形式が変わらないことは
// tests/insole-fifo.test.js が検証している。

const assert = require('node:assert/strict');
const Fifo = require('../src/InsoleFifo.js');
const { waitFor } = require('./async-test-utils.js');

const UINT16_MAX = 65536;

// header: 0x36（4 フレーム・104 byte）| 0x3A（8 フレーム・200 byte）。
// frameValue(i) で物理フレーム i（0 が最新、frames-1 が最古）の press[0] を決める。
function makeDataPacket({ header = 0x3A, frames = 8, bytes = 8 + frames * 24, serial = 0, h = 0, m = 0, s = 0, ms = 0, frameValue = () => 0 } = {}) {
  const dv = new DataView(new ArrayBuffer(bytes));
  dv.setUint8(0, header);
  dv.setUint16(1, serial);
  dv.setUint8(3, h);
  dv.setUint8(4, m);
  dv.setUint8(5, s);
  dv.setUint16(6, ms);
  for (let i = 0; i < frames && 8 + (i + 1) * 24 <= bytes; i++) {
    const o = 8 + i * 24;
    dv.setInt16(o, 100 * (i + 1));          // gyro x
    dv.setInt16(o + 6, 2048);               // acc x = 1G
    dv.setUint16(o + 12, frameValue(i));    // press[0]
  }
  return dv;
}

// 新 FW はコマンド応答も 200 byte に詰めて返す（実機で 35:200 を確認）
function padded(bytes, length = 200) {
  const out = new Uint8Array(length);
  out.set(bytes);
  return new DataView(out.buffer);
}

// ── 形式の判別 ──
{
  assert.deepEqual(Fifo.packetFormat(makeDataPacket({ header: 0x36, frames: 4 })), { frames: 4, bytes: 104, ringCapacity: 1500 });
  assert.deepEqual(Fifo.packetFormat(makeDataPacket({ header: 0x3A, frames: 8 })), { frames: 8, bytes: 200, ringCapacity: 750 });
  // ヘッダと長さの両方が合うときだけ有効（範囲外参照を防ぐ）
  assert.equal(Fifo.packetFormat(makeDataPacket({ header: 0x3A, frames: 4 })), null, '0x3A なのに 104 byte');
  assert.equal(Fifo.packetFormat(makeDataPacket({ header: 0x36, frames: 8 })), null, '0x36 なのに 200 byte');
  assert.equal(Fifo.packetFormat(makeDataPacket({ header: 0x3A, frames: 8, bytes: 199 })), null, '1 byte 短い');
  assert.equal(Fifo.packetFormat(padded([0x35, 0x01, 0, 1, 0, 0, 5])), null, 'コマンド応答はデータではない');
  assert.equal(Fifo.packetFormat(new DataView(new ArrayBuffer(0))), null);
  assert.equal(Fifo.packetFormat(null), null);
  // どちらの形式でも「上限 packet 数 × 1 packet の時間」は約 30 秒
  for (const f of Object.values(Fifo.PACKET_FORMATS)) {
    assert.equal(f.bytes, 8 + f.frames * 24);
    assert.equal(f.ringCapacity * f.frames * Fifo.LEGACY_CSV_FRAME_INTERVAL_MS, 30000);
  }
}

// ── デコード: 8 サンプル・古い順・時刻は 1 フレームずつ進む ──
{
  const dv = makeDataPacket({ serial: 65535, h: 1, m: 2, s: 3, ms: 400, frameValue: (i) => 1000 + i });
  const { serial, timestamp, samples } = Fifo.decodePacket(dv);
  assert.equal(serial, 65535);
  assert.equal(timestamp, ((1 * 60 + 2) * 60 + 3) * 1000 + 400);
  assert.equal(samples.length, 8);
  assert.deepEqual(samples.map((x) => x.packet_number), [0, 1, 2, 3, 4, 5, 6, 7]);
  // 物理フレーム 7 が最古（packet_number 0）、0 が最新（packet_number 7）
  assert.deepEqual(samples.map((x) => x.press.values[0]), [1007, 1006, 1005, 1004, 1003, 1002, 1001, 1000]);
  samples.forEach((x, k) => {
    assert.ok(Math.abs(x.t - (timestamp + k * Fifo.FRAME_INTERVAL_MS)) < 1e-9, `t[${k}]`);
    assert.equal(x.serial_number, 65535);
    assert.equal(x.press.packet_number, k);
    assert.ok(Math.abs(x.converted_acc.x - 1) < 1e-9);
  });
  // gyro: raw 800（物理フレーム 7）× 0.07 dps/LSB
  assert.ok(Math.abs(samples[0].converted_gyro.x - 800 * Fifo.GYRO_DPS_PER_LSB) < 1e-9);

  // 4 フレーム形式は従来どおり 4 サンプル
  assert.equal(Fifo.decodePacket(makeDataPacket({ header: 0x36, frames: 4 })).samples.length, 4);
}

// ── CSV: 1 serial = 8 行、形式が混ざっていても timestamp 昇順 ──
{
  const rows = Fifo.packetToCsvRows(makeDataPacket({ serial: 7, s: 1, ms: 0 }));
  assert.equal(rows.length, 8);
  rows.forEach((row) => assert.ok(row.startsWith('7, '), row));
  const cols = rows.map((row) => row.split(', '));
  assert.ok(cols.every((c) => c.length === 14), '列数は 4 フレーム形式と同じ 14');
  assert.equal(new Set(cols.map((c) => c[1])).size, 8, '8 行の timestamp はすべて異なる（5 ms 刻み）');

  const store = new Map();
  store.set(11, makeDataPacket({ serial: 11, s: 2 }));
  store.set(10, makeDataPacket({ serial: 10, s: 1 }));
  store.set(99, makeDataPacket({ header: 0x3A, frames: 8, bytes: 150, serial: 99, s: 0 }));  // 長さ不正 → 出力しない
  const lines = Fifo.rawStoreToCSV(store).trim().split('\n');
  assert.equal(lines[0], Fifo.CSV_HEADER);
  assert.equal(lines.length, 1 + 16);
  assert.ok(lines.slice(1, 9).every((l) => l.startsWith('10, ')));
  assert.ok(lines.slice(9).every((l) => l.startsWith('11, ')));
}

// ── リング上限: 8 フレーム形式は 750 packet を超えた分を回復不能として計上する ──
{
  const s = new Fifo.FifoLoopState();
  assert.equal(s.ringCapacity, 1500, '形式が確定するまでは従来値');
  assert.equal(s.framesPerPacket, null);
  s.ringCapacity = 750;
  s.lastSerial = 0;
  const [start, size] = s.calcRequestRange(800, 0, 200);   // need=800 > 750 → 50 を飛ばす
  assert.equal(s.dropped, 50);
  assert.equal(s.lossEvents[0].reason, 'ring_overflow');
  assert.equal(start, 51);
  assert.equal(size, 200);

  // 上限ちょうどは欠損にしない
  const ok = new Fifo.FifoLoopState();
  ok.ringCapacity = 750;
  ok.lastSerial = 65000;
  ok.calcRequestRange((65000 + 750) % UINT16_MAX, 0, 200);   // wrap をまたいで need=750
  assert.equal(ok.dropped, 0);
}

// ── モックデバイス（8 フレーム FW の最小再現） ──
function make8FrameMock(options = {}) {
  let current = options.startSerial != null ? options.startSerial : 65520;   // 収録中に 65535 → 0 をまたぐ
  const advance = options.advance != null ? options.advance : 13;            // 1 ポーリングで進む serial 数
  const dropOnce = new Set(options.dropOnce || []);                          // 最初の 1 回だけ BLE で落とす serial
  const dataPacket = options.dataPacket || ((sn) => makeDataPacket({ serial: sn, frameValue: (i) => sn + i }));
  const mock = {
    id: 0,
    streaming_mode: 3,
    _fifoNotifySink: null,
    served: [],
    isConnected: () => true,
    async write(_uuid, bytes) {
      const b = Array.from(bytes);
      const push = (d) => { if (mock._fifoNotifySink) mock._fifoNotifySink(d); };
      if (b[0] !== 0x0B) return;
      if (b[1] === 0x01) {
        current = (current + advance) % UINT16_MAX;
        push(padded([0x35, 0x01, (current >> 8) & 0xff, current & 0xff, 0, 0, advance]));
        return;
      }
      if (b[1] === 0x02) {
        for (let i = 2; i + 3 < b.length; i += 4) {
          const start = (b[i] << 8) | b[i + 1];
          const cnt = (b[i + 2] << 8) | b[i + 3];
          for (let k = 0; k < cnt; k++) {
            const sn = (start + k) % UINT16_MAX;
            if (dropOnce.delete(sn)) continue;
            mock.served.push(sn);
            push(dataPacket(sn));
          }
        }
        return;
      }
      push(padded([0x35, b[1]]));
    },
  };
  return mock;
}

(async () => {
  // ── 8 フレーム FW での収録一式: 回収できる・取りこぼしは再要求で回復・欠損 0 ──
  {
    const mock = make8FrameMock({ dropOnce: [65530, 2] });
    const fifo = new Fifo(mock, { startupDelayMs: 0 });
    const got = [];
    const errors = [];
    let lastProgress = null;
    let stopped = null;
    fifo.onSamples = (_id, samples) => got.push(...samples);
    fifo.onProgress = (info) => { lastProgress = info; };
    fifo.onError = (e) => errors.push(e);
    fifo.onStopped = (info) => { stopped = info; };

    assert.equal(await fifo.start(), true);
    await waitFor(() => fifo.collectedCount >= 40, '8 フレーム形式のパケットが 40 serial 以上回収される');
    await fifo.stop();

    assert.deepEqual(errors, [], '未対応パケットの警告は出ない');
    assert.equal(fifo.framesPerPacket, 8);
    assert.equal(fifo.ringCapacity, 750);
    assert.equal(lastProgress.framesPerPacket, 8);
    assert.equal(lastProgress.ringCapacity, 750);
    assert.equal(fifo.droppedCount, 0, '回復不能ロスなし');
    assert.ok(stopped && stopped.dropped === 0);

    // 回収した serial は連続（wrap をまたぐ）で、落とした 2 つも再要求で埋まっている
    const collected = fifo.collectedCount;
    assert.equal(fifo.state.storedSpanMax + 1, collected, 'スパン内 serial 数 = 回収数（穴なし）');
    assert.ok(fifo.state.rawStore.has(65530) && fifo.state.rawStore.has(2), '取りこぼしは再要求で回復');
    assert.ok(fifo.state.rawStore.has(65535) && fifo.state.rawStore.has(0), '65535 → 0 をまたいで回収');

    // 1 serial = 8 サンプル。重複して渡さない
    assert.equal(got.length, collected * 8);
    const keys = new Set(got.map((x) => `${x.serial_number}:${x.packet_number}`));
    assert.equal(keys.size, got.length, 'onSamples に同じサンプルを二重に渡さない');
    const one = got.filter((x) => x.serial_number === 0).sort((a, b) => a.packet_number - b.packet_number);
    assert.deepEqual(one.map((x) => x.press.values[0]), [7, 6, 5, 4, 3, 2, 1, 0]);

    // CSV も 1 serial = 8 行
    const lines = fifo.toCSV().trim().split('\n');
    assert.equal(lines.length, 1 + collected * 8);

    // 通知の内訳（0 件のときの診断用）
    assert.ok(fifo.notifyStats['3a:200'] >= collected);
    assert.ok(fifo.notifyStats['35:200'] > 0);
    assert.notEqual(typeof mock._fifoNotifySink, 'function', '停止後は sink を外す');
  }

  // ── 未対応の形式（データヘッダなのに長さが違う）を黙って捨てない ──
  {
    const mock = make8FrameMock({ startSerial: 100, dataPacket: (sn) => makeDataPacket({ serial: sn, frames: 8, bytes: 296 }) });
    const fifo = new Fifo(mock, { startupDelayMs: 0, drainTimeoutMs: 0 });
    const errors = [];
    fifo.onError = (e) => errors.push(e);
    assert.equal(await fifo.start(), true);
    await waitFor(() => errors.length > 0, '未対応パケットの警告');
    await waitFor(() => mock.served.length >= 30, '未対応パケットが届き続ける');
    await fifo.stop();
    assert.equal(errors.length, 1, '警告は収録ごとに 1 回だけ');
    assert.match(errors[0].message, /0x3a/);
    assert.match(errors[0].message, /296/);
    assert.equal(fifo.collectedCount, 0, '長さが合わないパケットは保存しない');
    assert.equal(fifo.framesPerPacket, null);
    assert.ok(fifo.notifyStats['3a:296'] > 0, '何が届いていたかは notifyStats で分かる');
  }

  console.log('insole-fifo-8frame.test.js passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
