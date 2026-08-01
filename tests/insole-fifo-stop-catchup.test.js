// stop() 時の catch-up（未要求バックログの回収）の回帰テスト。
//
// 追従が遅れていると、stop() 時点で「FW には溜まっているのに一度も要求していない」
// シリアル（forward backlog）が残る。旧実装の回収フェーズ（drain）は carryOver の
// 再要求しか行わないため、この末尾はまるごと切り捨てられ、しかも missing にも
// droppedCount にも現れなかった（＝ロスレスを謳いながら黙って短くなる）。
// ここでは frozen target までの回収と、回収しきれない分の stopped_pending 計上、
// および既存挙動（drainTimeoutMs=0 / stopOnLoss / 切断）の不変性を検証する。

const assert = require('node:assert/strict');
const Fifo = require('../src/InsoleFifo.js');

const UINT16_MAX = 65536;

// ── ヘルパ: FIFO データパケット(0x36, 104 bytes) ──
function makeDataPacket(serial) {
  const dv = new DataView(new ArrayBuffer(104));
  dv.setUint8(0, 0x36);
  dv.setUint16(1, serial);
  return dv;
}

function makeCurrentSerialResponse(serial, accumulated) {
  const dv = new DataView(new ArrayBuffer(7));
  dv.setUint8(0, 0x35);
  dv.setUint8(1, 0x01);
  dv.setUint16(2, serial);
  dv.setUint8(4, 0);
  dv.setUint16(5, accumulated);
  return dv;
}

function makeNoDataResponse(start, count) {
  const dv = new DataView(new ArrayBuffer(6));
  dv.setUint8(0, 0x35);
  dv.setUint8(1, 0x02);
  dv.setUint16(2, start);
  dv.setUint16(4, count);
  return dv;
}

function makeAck(sub) {
  const dv = new DataView(new ArrayBuffer(2));
  dv.setUint8(0, 0x35);
  dv.setUint8(1, sub);
  return dv;
}

// ── モックデバイス（FIFO プロトコルの最小再現） ──
// serialSequence: 0x0B 0x01（現在シリアル）への応答。要素が残っている間は順に消費し、
//   最後の1つを以降ずっと返す（stop 後も FW が進み続ける状況を再現できる）。
// servePacket(sn) が true ならデータパケット、serveNoData(sn) が true なら no-data、
//   どちらも false なら無応答（BLE 取りこぼし／転送停止の再現）。
function makeMock(options = {}) {
  const serialSequence = options.serialSequence ? options.serialSequence.slice() : [0];
  const servePacket = options.servePacket || (() => true);
  const serveNoData = options.serveNoData || (() => false);
  const accumulated = options.accumulated != null ? options.accumulated : 100;

  const mock = {
    id: 0,
    streaming_mode: 4,
    _fifoNotifySink: null,
    writes: [],
    requestedSerials: [],
    isConnected: () => options.connected !== false,
    async write(_uuid, bytes) {
      const b = Array.from(bytes);
      mock.writes.push(b);
      const push = (d) => { if (mock._fifoNotifySink) mock._fifoNotifySink(d); };
      if (b[0] !== 0x0B) return;                 // 0x0D（read mode 変更）等は無応答
      if (b[1] === 0x01) {
        const serial = serialSequence.length > 1 ? serialSequence.shift() : serialSequence[0];
        push(makeCurrentSerialResponse(serial, accumulated));
        return;
      }
      if (b[1] === 0x02) {
        for (let i = 2; i + 3 < b.length; i += 4) {
          const start = (b[i] << 8) | b[i + 1];
          const cnt = (b[i + 2] << 8) | b[i + 3];
          for (let k = 0; k < cnt; k++) {
            const sn = (start + k) % UINT16_MAX;
            mock.requestedSerials.push(sn);
            if (serveNoData(sn)) push(makeNoDataResponse(sn, 1));
            else if (servePacket(sn)) push(makeDataPacket(sn));
          }
          if (cnt > 0 && options.onDataRequest) options.onDataRequest(start, cnt);
        }
        return;
      }
      push(makeAck(b[1]));                        // 0x03 / 0x04 / 0x06
    },
  };
  return mock;
}

// 既に serials を回収済みで、lastSerial まで要求済みの状態の FIFO を作る
function makeFifoWithHistory(mock, options, { stored, lastSerial }) {
  const fifo = new Fifo(mock, options);
  mock._fifoNotifySink = (dv) => fifo._queue.push(dv);
  for (const sn of stored) {
    fifo.state.rawStore.set(sn, makeDataPacket(sn));
    fifo.state.noteStored(sn);
  }
  fifo.state.lastSerial = lastSerial;
  fifo._lastCurrentSerial = lastSerial;
  fifo._running = false;   // _runLoop は即終了 → 回収フェーズ → 最終計上だけが走る
  return fifo;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function range(from, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push((from + i) % UINT16_MAX);
  return out;
}

// スパン内シリアル数 = 回収数 + dropped（#44 の不変条件）が
// [先頭 .. frozen target] の全区間で成立していること
function assertInvariant(fifo, label) {
  const expected = fifo.state.storedSpanMax + 1;
  assert.equal(expected, fifo.state.rawStore.size + fifo.droppedCount,
    `${label}: span(${expected}) = collected(${fifo.state.rawStore.size}) + dropped(${fifo.droppedCount})`);
}

(async () => {
  // ── (a) 未要求バックログが全部回収できる → 完全なスパン・欠損なし ──
  {
    // stop 時点の FW 最新シリアルは 260。以降 FW は 400 まで進むが、frozen target は
    // 260 に固定され、停止後に生成されたシリアルは追いかけない。
    const mock = makeMock({ serialSequence: [260, 400] });
    const fifo = makeFifoWithHistory(mock, { startupDelayMs: 0, drainTimeoutMs: 1000 },
      { stored: range(100, 100), lastSerial: 199 });
    const checkpoint = fifo.createCheckpoint();

    let stoppedInfo = null;
    let lossFired = 0;
    let drainingProgress = 0;
    let catchupProgress = 0;
    let samples = 0;
    fifo.onStopped = (info) => { stoppedInfo = info; };
    fifo.onDataLoss = () => { lossFired += 1; };
    fifo.onSamples = (_id, s) => { samples += s.length; };
    fifo.onProgress = (info) => {
      if (info.draining) drainingProgress += 1;
      if (info.catchup) catchupProgress += 1;
    };

    await fifo._runLoopWrapped();

    assert.equal(stoppedInfo.catchupRecovered, 61, 'catch-up が 200..260 の 61 シリアルを回収');
    assert.equal(stoppedInfo.drainRecovered, 0, 'carryOver は無いので drain は 0');
    assert.equal(stoppedInfo.dropped, 0, '欠損なしで確定');
    assert.equal(fifo.droppedCount, 0);
    assert.equal(lossFired, 0, 'onDataLoss は発火しない');
    assert.equal(fifo.collectedCount, 161, '100..260 を全部持っている');
    for (const sn of range(200, 61)) assert.ok(fifo.state.rawStore.has(sn), `rawStore に ${sn}`);
    assert.ok(!fifo.state.rawStore.has(261), 'frozen target より後（停止後の生成分）は取りに行かない');
    assert.equal(fifo.state.lastSerial, 260, '要求済み境界が frozen target まで前進');
    assert.equal(samples, 61 * 4, '回収パケットは onSamples でライブ反映される（1パケット4フレーム）');
    assert.ok(drainingProgress > 0 && catchupProgress > 0, 'onProgress は draining:true で継続する');
    assertInvariant(fifo, '(a)');

    // 収録スパンが frozen target まで延び、正式計測区間の欠損も 0 になる
    assert.equal(fifo.state.storedSpanMax, 160, 'スパンは 100..260');
    const summary = fifo.summarizeSince(checkpoint);
    assert.equal(summary.available, true);
    assert.equal(summary.last, 260, 'summarizeSince の終端が frozen target まで伸びる');
    assert.deepEqual([summary.expected, summary.received, summary.missing], [61, 61, 0]);
  }

  // ── (b) catch-up 中に転送が止まる → 未回収の末尾を stopped_pending で計上 ──
  {
    // 230 以降は無応答（データも no-data も返らない）
    const mock = makeMock({ serialSequence: [260], servePacket: (sn) => sn < 230 });
    const fifo = makeFifoWithHistory(mock, { startupDelayMs: 0, drainTimeoutMs: 200 },
      { stored: range(100, 100), lastSerial: 199 });
    const checkpoint = fifo.createCheckpoint();

    let stoppedInfo = null;
    const losses = [];
    fifo.onStopped = (info) => { stoppedInfo = info; };
    fifo.onDataLoss = (info) => { losses.push(info); };

    await fifo._runLoopWrapped();

    assert.equal(stoppedInfo.catchupRecovered, 30, '200..229 は回収できる');
    assert.equal(fifo.collectedCount, 130);
    // 230..260 の 31 シリアルは回復不能 → 黙って切り捨てず必ず計上する
    assert.equal(fifo.droppedCount, 31, '未回収の末尾 31 が droppedCount に出る');
    assert.equal(stoppedInfo.dropped, 31, 'onStopped.dropped に反映');
    const pending = losses.filter((l) => l.reason === 'stopped_pending');
    assert.equal(pending.length, 1, 'onDataLoss(stopped_pending) が発火');
    assert.equal(pending[0].dropped, 31);
    assert.equal(pending[0].cumulative, 31);
    assertInvariant(fifo, '(b)');

    // missing 側でも末尾が見える（旧実装は lastSerial までしか見えず missing=0 だった）
    const summary = fifo.summarizeSince(checkpoint);
    assert.equal(summary.last, 260);
    assert.deepEqual([summary.expected, summary.received, summary.missing], [61, 30, 31]);
  }

  // ── (b2) FW から消えた末尾は fw_nodata として即時計上（stopped_pending と二重計上しない） ──
  {
    const mock = makeMock({ serialSequence: [260], serveNoData: (sn) => sn >= 230 });
    const fifo = makeFifoWithHistory(mock, { startupDelayMs: 0, drainTimeoutMs: 200 },
      { stored: range(100, 100), lastSerial: 199 });
    const reasons = [];
    fifo.onDataLoss = (info) => { reasons.push(info.reason); };
    await fifo._runLoopWrapped();

    assert.equal(fifo.collectedCount, 130);
    assert.equal(fifo.droppedCount, 31, '31 シリアルぶんだけ（二重計上なし）');
    assert.ok(reasons.includes('fw_nodata'), 'fw_nodata として通知');
    assert.ok(!reasons.includes('stopped_pending'), '既計上分は stopped_pending にならない');
    assertInvariant(fifo, '(b2)');
  }

  // ── (c) catch-up スパンが uint16 wraparound をまたぐ ──
  {
    // 65500..65535 まで回収済み、frozen target は wrap 後の 40
    const mock = makeMock({ serialSequence: [40] });
    const fifo = makeFifoWithHistory(mock, { startupDelayMs: 0, drainTimeoutMs: 1000 },
      { stored: range(65500, 36), lastSerial: 65535 });

    let stoppedInfo = null;
    fifo.onStopped = (info) => { stoppedInfo = info; };
    await fifo._runLoopWrapped();

    assert.equal(stoppedInfo.catchupRecovered, 41, 'wrap をまたいで 0..40 を回収');
    assert.equal(fifo.collectedCount, 77, '65500..65535 + 0..40');
    for (const sn of [65535, 0, 1, 40]) assert.ok(fifo.state.rawStore.has(sn), `rawStore に ${sn}`);
    assert.equal(fifo.state.lastSerial, 40);
    assert.equal(fifo.state.firstStoredSerial, 65500, 'スパン起点は wrap 前のまま');
    assert.equal(fifo.state.storedSpanMax, 76, 'スパンは modular 距離で 77 シリアル');
    assert.equal(fifo.droppedCount, 0, '幻の巨大欠損を計上しない');
    assertInvariant(fifo, '(c)');
  }

  // ── (c2) 目標が要求済み境界より後方（異常値）なら catch-up しない ──
  {
    // frozen target 100 は lastSerial 199 より後方 → modular 距離では ~65437（半周超）
    const mock = makeMock({ serialSequence: [100] });
    const fifo = makeFifoWithHistory(mock, { startupDelayMs: 0, drainTimeoutMs: 200 },
      { stored: range(100, 100), lastSerial: 199 });
    let stoppedInfo = null;
    fifo.onStopped = (info) => { stoppedInfo = info; };
    await fifo._runLoopWrapped();

    assert.equal(stoppedInfo.catchupRecovered, 0);
    assert.equal(fifo.collectedCount, 100, '余計なシリアルを取りに行かない');
    assert.equal(fifo.state.storedSpanMax, 99, 'スパンを異常値まで延ばさない');
    assert.equal(fifo.droppedCount, 0);
  }

  // ── (d) drainTimeoutMs=0 は従来動作（回収フェーズごと無効。末尾は取得も計上もしない） ──
  {
    const mock = makeMock({ serialSequence: [260] });
    const fifo = makeFifoWithHistory(mock, { startupDelayMs: 0, drainTimeoutMs: 0 },
      { stored: range(100, 100), lastSerial: 199 });
    const checkpoint = fifo.createCheckpoint();
    let stoppedInfo = null;
    let lossFired = 0;
    fifo.onStopped = (info) => { stoppedInfo = info; };
    fifo.onDataLoss = () => { lossFired += 1; };

    await fifo._runLoopWrapped();

    assert.equal(stoppedInfo.catchupRecovered, 0, 'catch-up も無効');
    assert.equal(stoppedInfo.drainRecovered, 0);
    assert.equal(fifo.collectedCount, 100, '末尾は取得しない');
    assert.ok(!mock.writes.some((b) => b[0] === 0x0B && b[1] === 0x02), 'データ要求を出さない');
    assert.ok(!mock.writes.some((b) => b[0] === 0x0B && b[1] === 0x01), '現在シリアルも問い合わせない');
    // 既存セマンティクスの維持: スパンは要求済み境界までなので末尾は dropped にならない
    assert.equal(fifo.state.lastSerial, 199, '要求済み境界は動かない');
    assert.equal(fifo.state.storedSpanMax, 99);
    assert.equal(fifo.droppedCount, 0);
    assert.equal(lossFired, 0);
    assert.equal(fifo.summarizeSince(checkpoint).expected, 0, 'checkpoint 区間も広がらない');
  }

  // ── (e) 停止時に追従済み（バックログ無し）→ 速く返り catchupRecovered=0 ──
  {
    const mock = makeMock({ serialSequence: [199] });
    const fifo = makeFifoWithHistory(mock, { startupDelayMs: 0, drainTimeoutMs: 3000 },
      { stored: range(100, 100), lastSerial: 199 });
    let stoppedInfo = null;
    fifo.onStopped = (info) => { stoppedInfo = info; };

    const started = Date.now();
    await fifo._runLoopWrapped();
    const elapsed = Date.now() - started;

    assert.equal(stoppedInfo.catchupRecovered, 0);
    assert.equal(stoppedInfo.drainRecovered, 0);
    assert.equal(fifo.collectedCount, 100);
    assert.equal(fifo.droppedCount, 0);
    assert.ok(!mock.writes.some((b) => b[0] === 0x0B && b[1] === 0x02), 'データ要求は出ない');
    assert.ok(elapsed < 1000, `未回収が無ければ即座に抜ける（${elapsed}ms、drainTimeoutMs=3000 を待たない）`);
    assert.equal(mock._fifoNotifySink, undefined, 'teardown で sink 解除');
    assert.equal(mock.streaming_mode, 4, 'teardown でリアルタイムモードへ復帰');
  }

  // ── (f) stopOnLoss 自動停止・切断では回収フェーズを走らせない（従来どおり） ──
  {
    const mock = makeMock({ serialSequence: [260] });
    const fifo = makeFifoWithHistory(mock, { startupDelayMs: 0, drainTimeoutMs: 1000 },
      { stored: range(100, 100), lastSerial: 199 });
    fifo._autoStopped = true;                    // stopOnLoss による自動停止を再現
    let stoppedInfo = null;
    fifo.onStopped = (info) => { stoppedInfo = info; };
    await fifo._runLoopWrapped();

    assert.equal(stoppedInfo.reason, 'loss');
    assert.equal(stoppedInfo.catchupRecovered, 0, '自動停止では catch-up しない');
    assert.equal(stoppedInfo.drainRecovered, 0);
    assert.equal(fifo.collectedCount, 100);
    assert.ok(!mock.writes.some((b) => b[0] === 0x0B && b[1] === 0x02), 'データ要求を出さない');
    assert.ok(!mock.writes.some((b) => b[0] === 0x0B && b[1] === 0x01), '現在シリアルも問い合わせない');
  }
  {
    const mock = makeMock({ serialSequence: [260], connected: false });
    const fifo = makeFifoWithHistory(mock, { startupDelayMs: 0, drainTimeoutMs: 1000 },
      { stored: range(100, 100), lastSerial: 199 });
    let stoppedInfo = null;
    fifo.onStopped = (info) => { stoppedInfo = info; };
    await fifo._runLoopWrapped();

    assert.equal(stoppedInfo.catchupRecovered, 0, '切断時は catch-up しない');
    assert.equal(stoppedInfo.drainRecovered, 0);
    assert.equal(fifo.collectedCount, 100);
    assert.equal(mock.writes.length, 0, '切断中はコマンドを書かない');
  }

  // ── 再同期中（lastSerial=null）は要求済み境界が不明なので catch-up しない ──
  {
    const mock = makeMock({ serialSequence: [260] });
    const fifo = makeFifoWithHistory(mock, { startupDelayMs: 0, drainTimeoutMs: 200 },
      { stored: range(100, 100), lastSerial: 199 });
    fifo.state.lastSerial = null;                // no-data 由来の resync 直後を再現
    fifo.state.resyncPending = true;
    let stoppedInfo = null;
    fifo.onStopped = (info) => { stoppedInfo = info; };
    await fifo._runLoopWrapped();

    assert.equal(stoppedInfo.catchupRecovered, 0);
    assert.equal(fifo.collectedCount, 100);
    assert.equal(fifo.state.lastSerial, null, '推測で境界を書き換えない');
    assert.equal(fifo.droppedCount, 0);
  }

  // ── catch-up の大きなバックログは複数リクエストへ分割される（1要求 200 シリアル上限） ──
  {
    const mock = makeMock({ serialSequence: [199 + 450] });
    const fifo = makeFifoWithHistory(mock, { startupDelayMs: 0, drainTimeoutMs: 1000 },
      { stored: range(100, 100), lastSerial: 199 });
    let stoppedInfo = null;
    fifo.onStopped = (info) => { stoppedInfo = info; };
    await fifo._runLoopWrapped();

    assert.equal(stoppedInfo.catchupRecovered, 450);
    const dataRequests = mock.writes.filter((b) => b[0] === 0x0B && b[1] === 0x02);
    assert.equal(dataRequests.length, 3, '450 シリアルは 200/200/50 の 3 要求');
    // 各要求は固定 30 スロット（122 バイト）を守る
    for (const req of dataRequests) assert.equal(req.length, 122);
    assert.equal(fifo.droppedCount, 0);
    assertInvariant(fifo, 'large backlog');
  }

  // ── (g) start() → stop() の実経路: 追従遅れのまま停止しても末尾が切り捨てられない ──
  {
    // FW は 1000 → 1100 → 1200 と進み、ポーリングは 1回 200 シリアルしか要求できないので
    // 停止時点で未要求バックログ（1101..1200）が残る。現場で観測された切り捨ての再現。
    let secondCycleDone = false;
    const mock = makeMock({
      serialSequence: [1000, 1100, 1200],
      accumulated: 1000,
      onDataRequest: (start) => { if (start === 1001) secondCycleDone = true; },
    });
    const fifo = new Fifo(mock, { startupDelayMs: 0, drainTimeoutMs: 1000 });
    let stoppedInfo = null;
    fifo.onStopped = (info) => { stoppedInfo = info; };

    assert.equal(await fifo.start(), true, 'start() 成功');
    // 2サイクル分ポーリングさせてから手動 stop()（この時点で 1101..1200 は未要求）
    while (!secondCycleDone) await sleep(10);
    const rawStore = await fifo.stop();

    assert.equal(fifo.state.lastSerial, 1200, '要求済み境界が frozen target まで前進');
    assert.equal(stoppedInfo.reason, 'manual');
    assert.equal(stoppedInfo.catchupRecovered, 100, '未要求だった 1101..1200 を回収');
    assert.equal(rawStore.size, 400, '801..1200 の 400 シリアルすべて');
    for (const sn of [801, 1000, 1001, 1100, 1101, 1200]) assert.ok(rawStore.has(sn), `rawStore に ${sn}`);
    assert.ok(!rawStore.has(1201), '停止後に生成された分は追いかけない');
    assert.equal(fifo.droppedCount, 0, 'droppedCount 0（ロスレス）');
    assertInvariant(fifo, '(g)');
    // droppedCount===0 なら CSV はスパン全域で完全（1シリアル 4 行）
    assert.equal(fifo.toCSV().trimEnd().split('\n').length, 1 + 400 * 4);
    assert.equal(mock._fifoNotifySink, undefined, 'teardown で sink 解除');
    assert.equal(mock.streaming_mode, 4, 'teardown でリアルタイムモードへ復帰');
  }

  // ── DrainBudget: idle ベースで延長し、絶対上限は超えない ──
  {
    const now = Date.now();
    const b = new Fifo.DrainBudget(1000, now);
    assert.equal(b.hardDeadline, now + 1000 * Fifo.CATCHUP_MAX_BUDGET_FACTOR);
    b.deadline = now - 1;                        // 予算切れ
    assert.equal(b.expired, true);
    b.noteProgress();                            // データが届いたら延長される
    assert.equal(b.expired, false);
    b.hardDeadline = Date.now() - 1;             // 絶対上限を過ぎたら延長しても終わる
    b.noteProgress();
    assert.equal(b.expired, true);

    // 絶対期限（数値）を渡した場合は延長なし＝従来動作
    const d = Fifo.DrainBudget.fromDeadline(now + 50, now);
    assert.equal(d.hardDeadline, now + 50);
    d.noteProgress();
    assert.ok(d.remainingMs() <= 50);
  }

  // ── FifoLoopState.noteSpanTarget: modular 距離で終端だけを延ばす ──
  {
    const s = new Fifo.FifoLoopState();
    s.noteSpanTarget(500);                       // 未格納なら何もしない
    assert.equal(s.storedSpanMax, 0);
    assert.equal(s.firstStoredSerial, null);

    s.rawStore.set(100, null); s.noteStored(100);
    s.noteSpanTarget(160);
    assert.equal(s.storedSpanMax, 60, '終端が 160 まで延びる');
    s.noteSpanTarget(120);
    assert.equal(s.storedSpanMax, 60, '手前の目標では縮まない');
    s.noteSpanTarget(90);                        // 起点より手前（半周超）は異常値として無視
    assert.equal(s.storedSpanMax, 60);
    assert.equal(s.firstStoredSerial, 100);
    // 未回収の末尾は finalizePendingLoss で必ず計上される
    assert.equal(s.finalizePendingLoss(), 60);
    assert.equal(s.dropped, 60);

    const w = new Fifo.FifoLoopState();
    w.rawStore.set(65530, null); w.noteStored(65530);
    w.noteSpanTarget(10);                        // wrap をまたぐ目標
    assert.equal(w.storedSpanMax, 16, '65530..10 = 17 シリアル');
  }

  console.log('insole-fifo-stop-catchup.test.js passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
