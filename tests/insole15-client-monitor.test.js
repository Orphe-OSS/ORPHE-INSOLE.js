'use strict';

// INSOLE 1.5 クライアント（src/Insole15Client.js）の get_window モニタループの回帰テスト（BLE は使わない）。
// 事前ビルド済みバンドルを vm で読み込み、setTime / getWindow を模擬 FW に差し替える。
//
// 固定する不変条件:
//  1. stopMonitor() → startMonitor() を 1 往復以内に行っても、ループは常に 1 本（旧ループは起きたら抜ける）
//  2. ホストの onFrame が throw しても同じ窓を再要求・再送しない（カーソルは進み、onError に届く）
//  3. 最初の setTime が失敗したら isMonitoring は false に戻る（「配信中」と偽らない）
//  4. 最初の窓が届く前の too_old は欠損に数えない（status 'aligning'、serial は進まない）
//  5. 届いた後の too_old は skippedSamples と serial の飛びとして見える

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const bundlePath = path.join(__dirname, '..', 'src', 'Insole15Client.js');

function loadInsole15() {
  const code = fs.readFileSync(bundlePath, 'utf8');
  const sandbox = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, performance,
    TextEncoder, TextDecoder, URL, crypto: globalThis.crypto, Date, Math,
  };
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${code}\n;globalThis.__Insole15 = Insole15;`, sandbox, { filename: 'Insole15Client.js' });
  return sandbox.__Insole15;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const Insole15 = loadInsole15();
const WS = Insole15.insole.WindowStatus;

function sample() {
  return {
    imu: { accelLateral: 0, accelLongitudinal: 0, accelVertical: 9.8, gyroPitch: 0, gyroRoll: 0, gyroYaw: 0 },
    pressure: { mv: [59, 59, 59, 59, 59, 59] },
  };
}

/** 模擬 FW: 窓は常に OK（20 サンプル）。RTT を模擬し、呼び出し回数と要求窓を記録する */
function fakeFirmware(client, { rttMs = 5, respond } = {}) {
  const fw = { requests: [], setTimeCalls: 0, failSetTime: false };
  client.setTime = async ({ epochMs }) => {
    fw.setTimeCalls++;
    if (fw.failSetTime) throw new Error('set_time failed');
    return { epochMs };
  };
  client.getWindow = async ({ startMs }) => {
    fw.requests.push(startMs);
    await sleep(rttMs);
    if (respond) return respond(startMs, fw.requests.length);
    return {
      status: WS.WINDOW_STATUS_OK, startMs, oldestMs: startMs - 1000, newestMs: startMs + 200,
      imu: Array.from({ length: 20 }, sample).map((s) => s.imu),
      pressure: Array.from({ length: 20 }, sample).map((s) => s.pressure),
    };
  };
  return fw;
}

async function testSingleLoopAfterQuickRestart() {
  const client = new Insole15.InsoleClient({ requireEncryption: false, pinIdentity: false });
  const fw = fakeFirmware(client, { rttMs: 30 });
  const frames = [];
  const p1 = client.startMonitor((f) => frames.push(f));
  await sleep(50);                       // ループが getWindow で待機中
  client.stopMonitor();                  // 旧ループは await 中
  assert.equal(client.isMonitoring, false);
  const frames2 = [];
  const p2 = client.startMonitor((f) => frames2.push(f));   // 1 往復以内に再開
  assert.equal(client.isMonitoring, true);
  await sleep(400);
  client.stopMonitor();
  await Promise.all([p1, p2]);
  // 旧ループ（frames）は再開後に 1 窓も出さない。新ループだけが配信する。
  const firstFramesAfterRestart = frames.filter((f) => f.serial >= 0).length;
  assert.ok(firstFramesAfterRestart <= 20, `old loop must not keep emitting (got ${firstFramesAfterRestart})`);
  assert.ok(frames2.length >= 40, `new loop emits (got ${frames2.length})`);
  // 新ループの serial は 0 から連番（旧ループと混ざらない）
  frames2.forEach((f, i) => assert.equal(f.serial, i, `serial ${i}`));
  // 要求した窓の時刻は単調（2 本のループが交互に別の t を要求していない）
  const afterRestart = fw.requests.slice(-Math.max(1, Math.floor(frames2.length / 20)));
  for (let i = 1; i < afterRestart.length; i++) assert.ok(afterRestart[i] > afterRestart[i - 1], 'window requests advance monotonically');
  console.log('  ok  stop → start within one round trip keeps a single loop');
}

async function testThrowingHostCallback() {
  const client = new Insole15.InsoleClient({ requireEncryption: false, pinIdentity: false });
  const fw = fakeFirmware(client, { rttMs: 5 });
  const seen = [];
  const errors = [];
  let threw = 0;
  const p = client.startMonitor((f) => {
    seen.push(f.serial);
    if (f.serial === 3 && threw === 0) { threw++; throw new Error('host callback failed'); }
  }, { onError: (e) => errors.push(e) });
  await sleep(120);
  client.stopMonitor();
  await p;
  assert.equal(threw, 1);
  assert.equal(errors.length, 1, 'the throw is reported once');
  assert.match(String(errors[0]), /host callback failed/);
  const dupes = seen.filter((s, i) => seen.indexOf(s) !== i);
  assert.deepEqual(dupes, [], 'no frame is emitted twice (the same window is not re-requested)');
  const distinctWindows = new Set(fw.requests).size;
  assert.equal(distinctWindows, fw.requests.length, 'every get_window request asks for a new window');
  assert.ok(seen.length > 20, 'streaming continues after the throw');
  console.log('  ok  a throwing onFrame does not re-request the same window');
}

async function testSetTimeFailure() {
  const client = new Insole15.InsoleClient({ requireEncryption: false, pinIdentity: false });
  const fw = fakeFirmware(client);
  fw.failSetTime = true;
  await assert.rejects(client.startMonitor(() => {}), /set_time failed/);
  assert.equal(client.isMonitoring, false, 'a failed start does not leave the client "monitoring"');
  assert.equal(fw.requests.length, 0);
  // その後の開始は通常どおり動く
  fw.failSetTime = false;
  const frames = [];
  const p = client.startMonitor((f) => frames.push(f));
  await sleep(60);
  client.stopMonitor();
  await p;
  assert.ok(frames.length >= 20);
  console.log('  ok  set_time failure resets isMonitoring');
}

async function testAligningThenTooOld() {
  const client = new Insole15.InsoleClient({ requireEncryption: false, pinIdentity: false });
  let delivered = 0;
  const windows = [];
  fakeFirmware(client, {
    rttMs: 2,
    respond: (startMs, n) => {
      // 1〜2 回目: 開始直後の too_old（時計合わせ前のサンプルは無い）。3〜4 回目: OK。5 回目: 本物の too_old（1 秒分欠損）。
      if (n <= 2 || n === 5) {
        return { status: WS.WINDOW_STATUS_TOO_OLD, startMs, oldestMs: startMs + 100, newestMs: startMs + (n === 5 ? 1100 : 300), imu: [], pressure: [] };
      }
      delivered++;
      return {
        status: WS.WINDOW_STATUS_OK, startMs, oldestMs: startMs - 1000, newestMs: startMs + 200,
        imu: Array.from({ length: 20 }, sample).map((s) => s.imu),
        pressure: Array.from({ length: 20 }, sample).map((s) => s.pressure),
      };
    },
  });
  const frames = [];
  const p = client.startMonitor((f) => frames.push(f), { onWindow: (w) => windows.push(w) });
  await sleep(150);
  client.stopMonitor();
  await p;
  const statuses = windows.map((w) => w.status).slice(0, 6);
  assert.deepEqual(statuses.slice(0, 2), ['aligning', 'aligning'], `start-up too_old is reported as aligning (${statuses})`);
  assert.equal(windows[0].skippedSamples, 0);
  assert.equal(windows[4].status, 'too_old');
  assert.equal(windows[4].skippedSamples, 200, '1 s skipped after delivery = 200 samples');
  // 位置合わせでは serial は進まず、本物の too_old では 200 飛ぶ
  assert.equal(frames[0].serial, 0);
  assert.equal(frames[39].serial, 39);
  assert.equal(frames[40].serial, 240, 'serial jumps over the lost second');
  assert.ok(delivered >= 3);
  console.log('  ok  aligning is not loss; too_old after delivery skips serials');
}

function okWindow(startMs, newestMs) {
  return {
    status: WS.WINDOW_STATUS_OK, startMs, oldestMs: startMs - 1000, newestMs,
    imu: Array.from({ length: 20 }, sample).map((s) => s.imu),
    pressure: Array.from({ length: 20 }, sample).map((s) => s.pressure),
  };
}

async function testTooNewDeadlineWait() {
  // 追いついた（too_new）あとの再要求は newest_ms から窓の残り時間を計算して待つ。盲目的に 100 ms 待たない。
  // newest_ms が無い応答では従来どおり 100 ms 待つ。
  const client = new Insole15.InsoleClient({ requireEncryption: false, pinIdentity: false });
  const requestAt = [];
  let withNewest = true;
  let n = 0;
  fakeFirmware(client, {
    rttMs: 2,
    respond: (startMs) => {
      n++;
      requestAt.push(Date.now());
      if (n % 2 === 1) {
        // 奇数回目: まだ 30 ms 分が未取得（newest = start + 70）
        return { status: WS.WINDOW_STATUS_TOO_NEW, startMs, oldestMs: startMs - 500, newestMs: withNewest ? startMs + 70 : 0, imu: [], pressure: [] };
      }
      return okWindow(startMs, startMs + 105); // 窓末尾から 5 ms 先まで取得済み
    },
  });
  const windows = [];
  const p = client.startMonitor(() => {}, { onWindow: (w) => windows.push(w) });
  await sleep(300);
  withNewest = false;
  const switchAt = requestAt.length;
  await sleep(350);
  client.stopMonitor();
  await p;
  // too_new の次の要求までの間隔（応答時刻 → 次の要求）: 残り 30 ms − RTT 2 + margin 10 ≈ 38 ms
  const waits = (from, to) => {
    const out = [];
    for (let i = Math.max(1, from); i < Math.min(to, windows.length + 1, requestAt.length); i++) {
      if (windows[i - 1] && windows[i - 1].status === 'too_new') out.push(requestAt[i] - requestAt[i - 1]);
    }
    return out;
  };
  const deadlineWaits = waits(1, switchAt);
  assert.ok(deadlineWaits.length >= 2, `enough too_new round trips (${deadlineWaits.length})`);
  for (const w of deadlineWaits) assert.ok(w >= 25 && w <= 80, `too_new with newest_ms waits for the remainder, not 100 ms (got ${w} ms)`);
  const blindWaits = waits(switchAt + 1, requestAt.length);
  assert.ok(blindWaits.length >= 1, `enough too_new round trips without newest_ms (${blindWaits.length})`);
  for (const w of blindWaits) assert.ok(w >= 95, `too_new without newest_ms falls back to 100 ms (got ${w} ms)`);
  // ok 窓の lagMs = newest − 窓末尾 = 5
  const oks = windows.filter((w) => w.status === 'ok');
  assert.ok(oks.length >= 3);
  for (const w of oks) assert.equal(w.lagMs, 5);
  for (const w of windows.filter((x) => x.status === 'too_new')) assert.equal(w.lagMs, null);
  console.log('  ok  too_new waits for the window to complete (newest_ms), not a blind 100 ms');
}

async function testMaxLagJump() {
  // 追従遅れ: FW の最新が常に窓末尾より 1.2 秒先。maxLagMs 未指定なら 1 窓ずつ歩いてロスレス、
  // maxLagMs: 300 なら 'lag' で最新の窓へ飛び、飛ばした分が skippedSamples / serial の飛びに出る。
  async function run(maxLagMs) {
    const client = new Insole15.InsoleClient({ requireEncryption: false, pinIdentity: false });
    const fw = fakeFirmware(client, { rttMs: 2, respond: (startMs) => okWindow(startMs, startMs + 100 + 1200) });
    const windows = [];
    const frames = [];
    const p = client.startMonitor((f) => frames.push(f), { onWindow: (w) => windows.push(w), maxLagMs });
    await sleep(60);
    client.stopMonitor();
    await p;
    return { fw, windows, frames };
  }
  const lossless = await run(0);
  assert.ok(lossless.windows.length >= 5);
  assert.ok(lossless.windows.every((w) => w.status === 'ok'), 'without maxLagMs the loop never jumps');
  for (const w of lossless.windows) assert.equal(w.lagMs, 1200);
  for (let i = 1; i < lossless.fw.requests.length; i++) assert.equal(lossless.fw.requests[i] - lossless.fw.requests[i - 1], 100, 'walks one window at a time');
  lossless.frames.forEach((f, i) => assert.equal(f.serial, i));

  const live = await run(300);
  assert.ok(live.windows.length >= 4);
  assert.equal(live.windows[0].status, 'ok');
  assert.equal(live.windows[1].status, 'lag');
  assert.equal(live.windows[1].startMs, live.windows[0].startMs + 100, 'lag reports the first window given up');
  assert.equal(live.windows[1].skippedMs, 1100, 'jumps to the newest complete window (newest − 100)');
  assert.equal(live.windows[1].skippedSamples, 220);
  assert.equal(live.windows[1].rttMs, 0);
  assert.equal(live.fw.requests[1] - live.fw.requests[0], 1200, 'next request is the newest complete window');
  assert.equal(live.frames[19].serial, 19);
  assert.equal(live.frames[20].serial, 240, 'serial skips the samples given up');
  console.log('  ok  maxLagMs jumps to live and reports the samples given up');
}

async function main() {
  await testSingleLoopAfterQuickRestart();
  await testThrowingHostCallback();
  await testSetTimeFailure();
  await testAligningThenTooOld();
  await testTooNewDeadlineWait();
  await testMaxLagJump();
  console.log('insole15-client-monitor.test.js passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
