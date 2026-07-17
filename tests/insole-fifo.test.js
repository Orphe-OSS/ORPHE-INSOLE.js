const assert = require('node:assert/strict');
const Fifo = require('../src/InsoleFifo.js');

// ── ヘルパ: FIFO データパケット(0x36, 104 bytes)を組み立てる ──
// framesValues[i] = { gyro:[x,y,z], acc:[x,y,z], press:[6] }（i は物理フレーム 0..3）
function makeDataPacket({ serial = 1234, h = 0, m = 0, s = 0, ms = 0, frames = [] } = {}) {
  const dv = new DataView(new ArrayBuffer(104));
  dv.setUint8(0, 0x36);
  dv.setUint16(1, serial);
  dv.setUint8(3, h);
  dv.setUint8(4, m);
  dv.setUint8(5, s);
  dv.setUint16(6, ms);
  for (let i = 0; i < 4; i++) {
    const o = i * 24 + 8;
    const f = frames[i] || { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] };
    f.gyro.forEach((v, k) => dv.setInt16(o + k * 2, v));
    f.acc.forEach((v, k) => dv.setInt16(o + 6 + k * 2, v));
    f.press.forEach((v, k) => dv.setUint16(o + 12 + k * 2, v));
  }
  return dv;
}

function near(actual, expected, tol, label) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} !~= ${expected}`);
}

// ── シリアル番号ユーティリティ ──
{
  assert.equal(Fifo.serialDistance(100, 105), 5);
  assert.equal(Fifo.serialDistance(65534, 1), 3);      // wrap: 65535,0,1
  assert.equal(Fifo.serialDistance(10, 10), 0);

  assert.deepEqual(Fifo.calcExpectedSerials(65534, 4), [65534, 65535, 0, 1]);
  assert.deepEqual(
    Fifo.expandRequestsToList([[100, 3], [200, 2]]),
    [100, 101, 102, 200, 201]
  );

  assert.deepEqual(
    Fifo.buildRequestsFromSerials(new Set([10, 12, 40, 41, 42, 43])),
    [[10, 1], [12, 1], [40, 4]]
  );
  assert.deepEqual(Fifo.buildRequestsFromSerials(new Set()), []);
}

// ── データ要求パケット ──
{
  const req = Fifo.createGetSensorDataRequest([[258, 3], [200, 2]]);
  assert.equal(req.length, 2 + 30 * 4);               // 122
  assert.equal(req[0], 0x0B);
  assert.equal(req[1], 0x02);
  // 258 = 0x0102 → MSB/LSB
  assert.deepEqual(Array.from(req.slice(2, 10)), [1, 2, 0, 3, 0, 200, 0, 2]);
  // 残りは 0 埋め
  assert.ok(Array.from(req.slice(10)).every((b) => b === 0));

  // 固定 30 スロットちょうどは OK、超過は throw（規定超過パケットの黙認を防ぐ）
  const exactly30 = Array.from({ length: 30 }, (_, i) => [i, 1]);
  assert.equal(Fifo.createGetSensorDataRequest(exactly30).length, 122);
  const over30 = Array.from({ length: 31 }, (_, i) => [i, 1]);
  assert.throws(() => Fifo.createGetSensorDataRequest(over30), /too many ranges/);
}

// ── 応答パーサ ──
{
  const noData = new DataView(new ArrayBuffer(6));
  noData.setUint8(0, 0x35); noData.setUint8(1, 0x02);
  noData.setUint16(2, 500); noData.setUint16(4, 7);
  assert.deepEqual(Fifo.parseNoDataResponse(noData), [500, 7]);

  const dataPkt = makeDataPacket({ serial: 4242 });
  assert.equal(Fifo.parseNoDataResponse(dataPkt), null);
  assert.equal(Fifo.extractSerialIfSensorPacket(dataPkt), 4242);
  assert.equal(Fifo.extractSerialIfSensorPacket(noData), null);

  const cur = new DataView(new ArrayBuffer(7));
  cur.setUint8(0, 0x35); cur.setUint8(1, 0x01);
  cur.setUint16(2, 12345); cur.setUint8(4, 3); cur.setUint16(5, 60);
  assert.deepEqual(Fifo.parseCurrentSerial(cur), { serial: 12345, watermark: 3, accumulated: 60 });
  assert.equal(Fifo.parseCurrentSerial(noData), null); // 長さ不足でも 0x35 0x02 は current ではない
}

// ── 単位変換（参照 Python と一致すること） ──
{
  assert.equal(Fifo.accToG(16384 >> 8, 16384 & 0xff), 8);       // 16384/32768*16
  near(Fifo.gyroToDps(16384 >> 8, 16384 & 0xff), 1000, 1e-9, 'gyro');
  near(Fifo.pressureToN(3000, 1), 1302.648, 1e-3, 'p1(3000)');
  near(Fifo.pressureToN(3000, 6), 1444.73718, 1e-3, 'p6(3000)');
  near(Fifo.pressureToN(100, 1), 9.21537, 1e-3, 'p1(100)');
  assert.equal(Fifo.pressureToN(0, 6), 0);                      // 負にならずクランプ
}

// ── パケットデコード（ライブ可視化用） ──
{
  const dv = makeDataPacket({
    serial: 77,
    frames: [
      { gyro: [0, 0, 0], acc: [0, 0, 0], press: [1, 1, 1, 1, 1, 1] },       // i=0 → 最後(pn3)
      { gyro: [0, 0, 0], acc: [0, 0, 0], press: [2, 2, 2, 2, 2, 2] },
      { gyro: [0, 0, 0], acc: [0, 0, 0], press: [3, 3, 3, 3, 3, 3] },
      { gyro: [16384, 0, 0], acc: [16384, 0, 0], press: [10, 20, 30, 40, 50, 60] }, // i=3 → 最初(pn0)
    ],
  });
  const decoded = Fifo.decodePacket(dv);
  assert.equal(decoded.serial, 77);
  assert.equal(decoded.samples.length, 4);
  // 出力は i=3 が先頭（packet_number 0）
  assert.equal(decoded.samples[0].packet_number, 0);
  assert.deepEqual(decoded.samples[0].press.values, [10, 20, 30, 40, 50, 60]);
  near(decoded.samples[0].converted_acc.x, 8, 1e-9, 'decode acc');
  near(decoded.samples[0].converted_gyro.x, 1000, 1e-9, 'decode gyro');
  assert.deepEqual(decoded.samples[3].press.values, [1, 1, 1, 1, 1, 1]);
}

// ── CSV 行生成（参照実装形式） ──
{
  const dv = makeDataPacket({
    serial: 1234, h: 12, m: 0, s: 1, ms: 995,
    frames: [
      { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
      { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
      { gyro: [0, 0, 0], acc: [0, 0, 0], press: [0, 0, 0, 0, 0, 0] },
      { gyro: [0, 0, 0], acc: [0, 0, 0], press: [3000, 0, 0, 0, 0, 0] }, // i=3 → row[0]
    ],
  });
  const rows = Fifo.packetToCsvRows(dv);
  assert.equal(rows.length, 4);
  // タイムスタンプはフレームごとに +5ms（995 → 000 → 005 → 010、秒/分の桁上げも）
  assert.ok(rows[0].startsWith('1234, 12:00:01:995,'), rows[0]);
  assert.ok(rows[1].includes('12:00:02:000'), rows[1]);
  assert.ok(rows[3].includes('12:00:02:010'), rows[3]);
  // row[0] は press1=3000 → N=1302.648
  assert.ok(rows[0].includes('1302.6480'), rows[0]);
  // 列数（serial, timestamp + 12 の計 14）
  assert.equal(rows[0].split(', ').length, 14);
}

// ── raw ストア → CSV（timestamp 昇順、ヘッダ付き） ──
{
  const later = makeDataPacket({ serial: 200, h: 0, m: 0, s: 2, ms: 0 });
  const earlier = makeDataPacket({ serial: 100, h: 0, m: 0, s: 1, ms: 0 });
  const store = new Map();
  store.set(200, later);   // わざと逆順に挿入
  store.set(100, earlier);
  const csv = Fifo.rawStoreToCSV(store);
  const lines = csv.trimEnd().split('\n');
  assert.equal(lines[0], Fifo.CSV_HEADER);
  assert.equal(lines.length, 1 + 8);                     // header + 2 packets × 4 rows
  // 先に earlier(1s台) の行が来る
  assert.ok(lines[1].startsWith('100, '), lines[1]);
  assert.ok(lines[5].startsWith('200, '), lines[5]);
}

// ── ループ状態: calcRequestRange ──
{
  const s = new Fifo.FifoLoopState();
  // 初回: min(accumulated, max)、start = current-(size-1)
  assert.deepEqual(s.calcRequestRange(500, 50, 200), [451, 50]);
  const s2 = new Fifo.FifoLoopState();
  assert.deepEqual(s2.calcRequestRange(500, 300, 200), [301, 200]); // accumulated>max

  // 増分
  const s3 = new Fifo.FifoLoopState();
  s3.lastSerial = 100;
  assert.deepEqual(s3.calcRequestRange(150, 0, 200), [101, 50]);

  // リングバッファ超過 → skip して再計算 + 回復不能ロスを記録
  const s4 = new Fifo.FifoLoopState();
  s4.lastSerial = 0;
  const [start4, size4] = s4.calcRequestRange(1600, 0, 200); // need=1600 > 1500 → skip 100
  assert.equal(s4.lastSerial, 100);
  assert.equal(start4, 101);
  assert.equal(size4, 200); // min(1500, 200)
  assert.equal(s4.dropped, 100);
  assert.equal(s4.lossEvents[0].reason, 'ring_overflow');
  assert.equal(s4.lossEvents[0].dropped, 100);

  // 初回 start（resyncPending=false）: バックログ超過は意図的な「直近から開始」で損失計上しない
  const sInit = new Fifo.FifoLoopState();
  const [, sizeInit] = sInit.calcRequestRange(5000, 500, 200);
  assert.equal(sizeInit, 200);
  assert.equal(sInit.dropped, 0);

  // 再同期後（resyncPending=true）: 要求しきれない古いバックログを回復不能ロスとして計上
  const sRe = new Fifo.FifoLoopState();
  sRe.resyncPending = true;
  sRe.calcRequestRange(5000, 500, 200); // 500 蓄積・200要求 → 300 が回復不能
  assert.equal(sRe.dropped, 300);
  assert.ok(sRe.lossEvents.some((e) => e.reason === 'resync_backlog' && e.dropped === 300));
  assert.equal(sRe.resyncPending, false); // 消費済み
}

// ── ループ状態: updateAfterResponse ──
{
  // BLE ロスは carryOver へ、size>0 なら lastSerial 更新
  const s = new Fifo.FifoLoopState();
  const r = s.updateAfterResponse(new Set([101, 102]), new Set(), 101, 50);
  assert.equal(r, 'ok');
  assert.deepEqual(s.carryOver, [[101, 2]]);
  assert.equal(s.lastSerial, 150);

  // carryOver 溢れ → 再同期
  const s2 = new Fifo.FifoLoopState();
  const many = new Set();
  for (let i = 0; i < 101; i++) many.add(1000 + i);
  const r2 = s2.updateAfterResponse(many, new Set(), 1000, 101);
  assert.equal(r2, 'resync');
  assert.deepEqual(s2.carryOver, []);
  assert.equal(s2.lastSerial, null);
  assert.equal(s2.dropped, 101);
  assert.equal(s2.resyncPending, true); // 次ポーリングでバックログ超過を計上させる
  assert.ok(s2.lossEvents.some((e) => e.reason === 'carryover_overflow'));

  // 新規シリアルの no-data → 再同期（lastSerial リセット）
  const s3 = new Fifo.FifoLoopState();
  s3.lastSerial = 500;
  s3.updateAfterResponse(new Set(), new Set([600]), 600, 10);
  assert.equal(s3.lastSerial, null);
  assert.equal(s3.resyncPending, true);
  assert.deepEqual(s3.carryOver, []);
}

// ── NotifyQueue ──
(async () => {
  const q = new Fifo.NotifyQueue();
  q.push('a');
  q.push('b');
  assert.equal(await q.wait(50), 'a');
  assert.equal(await q.wait(50), 'b');
  assert.equal(await q.wait(10), null);          // タイムアウト
  // push 待ち中に届く
  const p = q.wait(200);
  q.push('c');
  assert.equal(await p, 'c');
  q.push('x');
  q.drain();
  assert.equal(await q.wait(10), null);          // drain 済み

  // ── stopOnLoss: 欠損検知で自動停止し teardown / onStopped する ──
  // モックデバイスで FIFO プロトコルを最小再現し、2回目のポーリングで
  // シリアルを急ジャンプさせて ring_overflow（回復不能ロス）を発生させる。
  {
    const mkdv = (arr) => new DataView(Uint8Array.from(arr).buffer);
    let poll = 0;
    const mock = {
      id: 0,
      streaming_mode: 4,
      _fifoNotifySink: null,
      isConnected: () => true,
      async write(_uuid, bytes) {
        const b = Array.from(bytes);
        const push = (d) => { if (this._fifoNotifySink) this._fifoNotifySink(d); };
        if (b[0] === 0x0D) return;                 // read mode change
        if (b[0] !== 0x0B) return;
        const sub = b[1];
        if (sub === 0x01) {                        // get current serial
          poll++;
          const serial = poll === 1 ? 100 : 2100;  // 2回目で+2000ジャンプ→ring overflow
          push(mkdv([0x35, 0x01, (serial >> 8) & 0xff, serial & 0xff, 0, 0, 100])); // accumulated=100
          return;
        }
        if (sub === 0x02) {                        // get data → 要求分を返す
          for (let i = 2; i + 3 < b.length; i += 4) {
            const start = (b[i] << 8) | b[i + 1];
            const cnt = (b[i + 2] << 8) | b[i + 3];
            for (let k = 0; k < cnt; k++) push(makeDataPacket({ serial: (start + k) % 65536 }));
          }
          return;
        }
        push(mkdv([0x35, sub]));                    // 0x03/0x04/0x06 ACK
      },
    };
    const fifo = new Fifo(mock, { startupDelayMs: 0, stopOnLoss: true });
    let lossInfo = null;
    let stoppedInfo = null;
    fifo.onDataLoss = (info) => { if (!lossInfo) lossInfo = info; };
    fifo.onStopped = (info) => { stoppedInfo = info; };

    assert.equal(await fifo.start(), true);
    await fifo._loopPromise;                        // 自動停止＋teardown 完了まで待つ

    assert.ok(lossInfo && lossInfo.reason === 'ring_overflow', 'onDataLoss(ring_overflow) が発火');
    assert.ok(stoppedInfo && stoppedInfo.reason === 'loss', 'onStopped(reason=loss) が発火');
    assert.ok(fifo.droppedCount > 0, 'droppedCount > 0');
    assert.equal(mock._fifoNotifySink, undefined, 'teardown で sink 解除');
    assert.equal(mock.streaming_mode, 4, 'teardown でリアルタイムモードへ復帰');
  }

  console.log('insole-fifo.test.js passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
