'use strict';

// INSOLE 1.5（INS2 / bleRPC）対応のコア SDK 回帰テスト（BLE 実機は使わない）。
//
// - encodeInsole15Packet(): 1.5 フレーム → 製品版 header 56 パケットの再エンコードを parseInsoleSensorValues() で
//   往復させ、単位（m/s²→G、dps、Q14）・圧力の左右チャネル並び替え・倍率・飽和・非有限を固定する
// - begin(): INS2 を選ぶと専用経路（Insole15.InsoleClient）に分岐し、device_information / firmware_version /
//   onConnect / got* / addSensorDataListener / lostData（serial gap）/ gotBLEFrequency が製品版と同じ口で動く
// - 欠損境界で相方の無いフレームは複製せず破棄し、診断（insole15Diagnostics）に計上する
// - setDataStreamingMode は no-op、read/write/getDateTime は INSOLE15_UNSUPPORTED、syncCoreTime は 0
// - stop()/物理切断/自動再接続で 1.5 クライアントのループが止まり、再接続後は新しいクライアントで再開する
// - クライアント未ロード時は自身の URL 基準で Insole15Client(.min).js を 1 回だけ遅延ロードする

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { waitFor } = require('./async-test-utils.js');

globalThis.performance = globalThis.performance || { now: () => Date.now() };
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};

class FakeInsole15Client {
  constructor(options = {}) {
    this.options = options;
    this.calls = [];
    this._monitoring = false;
    this._gait = false;
    this.frameCb = null;
    this.windowCb = null;
    this.device = null;
    this.config = FakeInsole15Client.nextConfig || {
      deviceId: 0x02000009, deviceIdHex: '0x02000009', foot: 'right', firmwareVersion: '0.1.10+0 (test)',
    };
    this.transport = { disconnect: () => this.calls.push('transport.disconnect') };
    FakeInsole15Client.instances.push(this);
  }
  get isMonitoring() { return this._monitoring; }
  get isGaitMonitoring() { return this._gait; }
  async connect(scanned) {
    this.calls.push('connect');
    this.device = scanned.device;
    await scanned.device.gatt.connect();
  }
  async getConfigInfo() { this.calls.push('getConfigInfo'); return this.config; }
  startMonitor(onFrame, opts = {}) {
    this.calls.push('startMonitor');
    this._monitoring = true;
    this.frameCb = onFrame;
    this.windowCb = opts.onWindow;
    this.errorCb = opts.onError;
    return new Promise((resolve) => { this._resolveMonitor = resolve; });
  }
  stopMonitor() {
    this.calls.push('stopMonitor');
    this._monitoring = false;
    if (this._resolveMonitor) { this._resolveMonitor(); this._resolveMonitor = null; }
  }
  async startGaitMonitor() { this.calls.push('startGaitMonitor'); this._gait = true; }
  stopGaitMonitor() { this.calls.push('stopGaitMonitor'); this._gait = false; }
  disconnect() {
    this.calls.push('disconnect');
    this._monitoring = false;
    this._gait = false;
    if (this.device) this.device.gatt.disconnect();
  }
  emitFrames(frames, info = {}) {
    for (const f of frames) this.frameCb(f);
    if (this.windowCb) {
      this.windowCb({
        status: 'ok', startMs: frames.length ? frames[0].t : 0, rttMs: 40, samples: frames.length,
        skippedMs: 0, skippedSamples: 0, oldestMs: null, newestMs: null, ...info,
      });
    }
  }
}
FakeInsole15Client.instances = [];
FakeInsole15Client.nextConfig = null;

function fakeDevice(name = 'INS2', id = 'device-1') {
  const listeners = {};
  const device = {
    name,
    id,
    gatt: {
      connected: false,
      async connect() { device.gatt.connected = true; return {}; },
      disconnect() {
        if (!device.gatt.connected) return;
        device.gatt.connected = false;
        device.dispatch('gattserverdisconnected');
      },
    },
    addEventListener(type, fn) { (listeners[type] = listeners[type] || new Set()).add(fn); },
    removeEventListener(type, fn) { if (listeners[type]) listeners[type].delete(fn); },
    dispatch(type) { for (const fn of Array.from(listeners[type] || [])) fn({ type, target: device }); },
    listenerCount(type) { return listeners[type] ? listeners[type].size : 0; },
  };
  return device;
}

let chooserDevice = null;
// Node 21+ では globalThis.navigator が getter なので defineProperty で差し替える
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: {
    bluetooth: {
      async requestDevice() { return chooserDevice; },
      async getDevices() { return []; },
    },
  },
});
globalThis.Insole15 = { InsoleClient: FakeInsole15Client, SERVICE_UUID: '12340001-0000-1000-8000-00805f9b34fb' };

const { OrpheInsole, parseInsoleSensorValues, encodeInsole15Packet, ORPHE_INSOLE15 } = require('../src/ORPHE-INSOLE.js');

const G = 9.80665;
function frame(serial, t, overrides = {}) {
  return {
    t,
    serial,
    press: [10, 20, 30, 40, 50, 60],
    acc: { x: 0.1 * G, y: -0.2 * G, z: G },
    gyro: { x: 7, y: -70, z: 700 },
    quat: { w: 0.5, x: 0.5, y: -0.5, z: 0.5 },
    ...overrides,
  };
}
function frames(fromSerial, count, t0 = 1_700_000_000_000) {
  return Array.from({ length: count }, (_, i) => frame(fromSerial + i, t0 + 5 * (fromSerial + i)));
}

function testEncode() {
  const dv = encodeInsole15Packet([frame(100, 1_700_000_000_000), frame(101, 1_700_000_000_005)], {
    channelMap: ORPHE_INSOLE15.PRESSURE_CHANNEL_MAP.right,
  });
  assert.equal(dv.byteLength, 104);
  const p = parseInsoleSensorValues(dv, { gyroRange: 2000, accRange: 16 });
  assert.equal(p.header, 56);
  assert.equal(p.serial_number, 50, 'packet serial = floor(frame serial / 2)');
  assert.equal(p.samples.length, 2);
  for (const s of p.samples) {
    assert.ok(Math.abs(s.converted_acc.x - 0.1) < 1e-3, `acc x [G] ${s.converted_acc.x}`);
    assert.ok(Math.abs(s.converted_acc.y + 0.2) < 1e-3);
    assert.ok(Math.abs(s.converted_acc.z - 1.0) < 1e-3, 'acc z = 1 G');
    assert.ok(Math.abs(s.converted_gyro.x - 7) < 0.08, `gyro x [dps] ${s.converted_gyro.x}`);
    assert.ok(Math.abs(s.converted_gyro.z - 700) < 0.08);
    assert.ok(Math.abs(s.quat.w - 0.5) < 1e-4 && Math.abs(s.quat.y + 0.5) < 1e-4);
    // right map [2,1,3,0,4,5] × 10
    assert.deepEqual(s.press.values, [300, 200, 400, 100, 500, 600]);
  }
  assert.equal(p.samples[0].packet_number, 0);
  assert.equal(p.samples[1].packet_number, 1);
  // timestamp は先頭フレームの t（当日の時刻として往復）
  assert.equal(p.timestamp, 1_700_000_000_000 - (1_700_000_000_000 - p.timestamp), 'timestamp roundtrips (same local day)');
  const d = new Date(1_700_000_000_000);
  const back = new Date(p.timestamp);
  assert.equal(back.getHours(), d.getHours());
  assert.equal(back.getMinutes(), d.getMinutes());
  assert.equal(back.getSeconds(), d.getSeconds());
  assert.equal(back.getMilliseconds(), d.getMilliseconds());

  // 左マップ・倍率・飽和・非有限
  const big = frame(0, 0, { press: [7000, NaN, -5, 1, 2, 3], acc: { x: 500, y: 0, z: Infinity }, gyro: { x: 1e9, y: 0, z: 0 }, quat: { w: 2, x: 0, y: 0, z: 0 } });
  const dv2 = encodeInsole15Packet([big, big], { pressureScale: 10 });
  const p2 = parseInsoleSensorValues(dv2, { gyroRange: 2000, accRange: 16 });
  const s2 = p2.samples[0];
  // left map [3,4,2,5,1,0]: values[5] = mv[0] = 7000 × 10 → uint16 飽和、values[4] = mv[1] = NaN → 0、values[2] = mv[2] = -5 → 0
  assert.equal(s2.press.values[5], 65535, 'pressure saturates at uint16');
  assert.equal(s2.press.values[4], 0, 'non-finite pressure → 0');
  assert.equal(s2.press.values[2], 0, 'negative pressure clamps to 0');
  assert.ok(Math.abs(s2.converted_acc.x - 16 * 32767 / 32768) < 1e-6, 'acc saturates at +range');
  assert.equal(s2.acc.z, 0, 'non-finite acc → 0');
  assert.equal(s2.gyro.x, 32767 / 32768, 'gyro saturates at int16');
  assert.equal(s2.quat.w, 32767 / 16384, 'quat saturates at int16 (Q14)');
  const dv3 = encodeInsole15Packet([frame(1, 0), frame(2, 5)], { serial: 65535 + 3 });
  assert.equal(parseInsoleSensorValues(dv3).serial_number, 2, 'explicit serial is masked to uint16');
  assert.throws(() => encodeInsole15Packet([frame(0, 0)]), TypeError, 'needs exactly 2 frames');
  console.log('  ok  encodeInsole15Packet roundtrip / scaling / saturation');
}

async function testBeginAndDispatch() {
  FakeInsole15Client.instances.length = 0;
  const device = fakeDevice('INS2', 'dev-right');
  chooserDevice = device;
  const insole = new OrpheInsole(0);
  insole.setup();
  const events = { connect: [], startNotify: [], press: [], acc: [], quat: [], gyro: [], lost: [], freq: [], packets: [], disconnect: 0 };
  insole.onConnect = (uuid) => events.connect.push(uuid);
  insole.onStartNotify = (uuid) => events.startNotify.push(uuid);
  insole.gotPress = (press) => events.press.push({ ...press, values: [...press.values] });
  insole.gotConvertedAcc = (acc) => events.acc.push({ ...acc });
  insole.gotQuat = (q) => events.quat.push({ ...q });
  insole.gotConvertedGyro = (g) => events.gyro.push({ ...g });
  insole.lostData = (cur, prev) => events.lost.push([cur, prev]);
  insole.gotBLEFrequency = (hz) => events.freq.push(hz);
  insole.onDisconnect = () => { events.disconnect++; };
  insole.addSensorDataListener((e) => events.packets.push(e));

  assert.equal(insole.generation, 1);
  assert.equal(OrpheInsole.isInsole15Device(device), true);
  assert.equal(OrpheInsole.isInsole15Device({ name: 'INS0' }), false);
  const result = await insole.begin('SENSOR_VALUES', { streamingMode: 4 });
  assert.match(result, /INSOLE 1\.5/);
  assert.equal(insole.generation, 2);
  assert.equal(insole.isInsole15, true);
  assert.equal(insole.isConnected(), true);
  assert.equal(FakeInsole15Client.instances.length, 1);
  const client = FakeInsole15Client.instances[0];
  assert.deepEqual(client.calls, ['connect', 'getConfigInfo', 'startMonitor']);
  assert.equal(client.options.requireEncryption, true);
  assert.equal(client.options.pinIdentity, true);
  assert.deepEqual(events.connect, ['SENSOR_VALUES']);
  assert.deepEqual(events.startNotify, ['SENSOR_VALUES']);
  assert.equal(insole.device_information.mount_position, 1, 'right foot → mount_position bit0 = 1');
  assert.deepEqual(insole.device_information.range, { acc: 3, gyro: 3 });
  assert.equal(insole.device_information.battery, null);
  assert.equal(insole.device_information.foot, 'right');
  assert.equal(insole.firmware_version, '0.1.10+0 (test)');
  assert.equal(await insole.getFirmwareVersion(), '0.1.10+0 (test)');
  assert.equal(insole.streaming_mode, 4);
  assert.equal(storage.size > 0, true, 'device is remembered');

  // 1 窓 = 20 フレーム → 10 パケット（2 サンプル/パケット）
  client.emitFrames(frames(0, 20));
  assert.equal(events.press.length, 20);
  assert.equal(events.packets.length, 10);
  assert.deepEqual(events.packets.map((e) => e.packet.serial_number), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(events.packets[0].packet.header, 56);
  assert.equal(events.packets[0].data.byteLength, 104, 'listeners receive the re-encoded 104-byte DataView');
  assert.deepEqual(events.press[0].values, [300, 200, 400, 100, 500, 600], 'right channel map × 10');
  assert.ok(Math.abs(events.acc[0].z - 1.0) < 1e-3);
  assert.ok(Math.abs(events.gyro[0].z - 700) < 0.08);
  assert.ok(Math.abs(events.quat[0].w - 0.5) < 1e-4);
  assert.deepEqual(insole.press.values, [300, 200, 400, 100, 500, 600]);
  assert.equal(insole.serial_number, 9);
  assert.deepEqual(events.lost, [], 'consecutive serials → no lostData');
  assert.equal(insole.lastInsole15Frame.serial, 19);

  // 欠損（serial 20..39 が無い）→ packet serial 20 (= floor(40/2)) で lostData
  client.emitFrames(frames(40, 20), { skippedSamples: 0 });
  assert.deepEqual(events.lost, [[20, 9]]);
  // 奇数フレームの窓: 19 フレーム → 9 パケット + 1 保留。続く窓の先頭 serial が連続なら保留分とペアになる
  client.emitFrames(frames(60, 19));
  assert.equal(events.packets.length, 29);
  client.emitFrames(frames(79, 21));
  assert.equal(events.packets.length, 40, 'pending frame pairs with the next window (19 + 21 = 20 packets)');
  assert.deepEqual(events.lost, [[20, 9]]);
  // 保留 1 フレームの直後に欠損 → 保留分は複製せず破棄し droppedOddFrames に計上
  client.emitFrames(frames(100, 19));
  assert.equal(events.packets.length, 49);
  client.emitFrames(frames(200, 20), { status: 'ok' });
  assert.equal(events.packets.length, 59);
  assert.deepEqual(events.lost, [[20, 9], [100, 58]], 'gap after a dropped odd frame: 116-117 → 200-201');
  const diag = insole.insole15Diagnostics();
  assert.equal(diag.droppedOddFrames, 1);
  assert.equal(diag.ok, 6);
  assert.equal(diag.samples, 20 + 20 + 19 + 21 + 19 + 20);
  assert.equal(diag.config.foot, 'right');

  // too_old → skippedSamples・gaps・lossRate
  client.windowCb({ status: 'too_old', startMs: 0, rttMs: 130, samples: 0, skippedMs: 1500, skippedSamples: 300, oldestMs: null, newestMs: null });
  const diag2 = insole.insole15Diagnostics();
  assert.equal(diag2.tooOld, 1);
  assert.equal(diag2.gaps, 1);
  assert.equal(diag2.skippedSamples, 300);
  assert.ok(diag2.lossRate > 0.7 && diag2.lossRate < 0.73, `lossRate ${diag2.lossRate}`);
  assert.equal(diag2.rttMs.max, 130);

  // 実効レート: 約 1 秒ごとに gotBLEFrequency
  assert.deepEqual(events.freq, []);
  insole._insole15Rate = { count: 0, since: performance.now() - 1000 };
  client.emitFrames(frames(220, 20));
  assert.equal(events.freq.length, 1);
  assert.ok(events.freq[0] > 15 && events.freq[0] <= 20.5, `effective rate ${events.freq[0]} (20 samples / ~1 s)`);

  // モード・非対応 API
  await insole.setDataStreamingMode(3);
  assert.equal(insole.streaming_mode, 3);
  assert.equal(client.calls.filter((c) => c === 'startMonitor').length, 1, 'no RPC for streaming mode');
  await assert.rejects(insole.read('DEVICE_INFORMATION'), (e) => e.code === 'INSOLE15_UNSUPPORTED');
  await assert.rejects(insole.write('DEVICE_INFORMATION', [1]), (e) => e.code === 'INSOLE15_UNSUPPORTED');
  await assert.rejects(insole.getDateTime(), (e) => e.code === 'INSOLE15_UNSUPPORTED');
  const sync = await insole.syncCoreTime(3);
  assert.equal(sync.average_round_trip_time, 0);
  insole.resetAnalysisLogs();
  const info = await insole.getDeviceInformation();
  assert.equal(info.mount_position, 1);
  assert.equal(client.calls.filter((c) => c === 'getConfigInfo').length, 2, 'getDeviceInformation re-reads get_config');
  assert.equal(await insole.getPressureCalibration(), null);

  // stopNotify / startNotify = モニタ停止・再開
  await insole.stopNotify('SENSOR_VALUES');
  assert.equal(client.isMonitoring, false);
  await insole.startNotify('SENSOR_VALUES');
  assert.equal(client.isMonitoring, true);
  assert.equal(client.calls.filter((c) => c === 'startMonitor').length, 2);
  await assert.rejects(insole.startNotify('STEP_ANALYSIS'), (e) => e.code === 'INSOLE15_UNSUPPORTED');

  // stop(): ループ停止 → GATT 切断 → onDisconnect 1 回。世代は次のデバイス選択まで保持
  insole.stop();
  assert.equal(insole._insole15, null);
  assert.ok(client.calls.includes('stopMonitor') && client.calls.includes('disconnect'));
  assert.equal(insole.isConnected(), false);
  assert.equal(events.disconnect, 1);
  assert.equal(insole.generation, 2);
  assert.equal(insole.bluetoothDevice, null);
  assert.equal(insole.insole15Diagnostics().monitoring, false);
  console.log('  ok  begin() routes INS2 to the INSOLE 1.5 client; dispatch / loss / diagnostics / stop');
}

async function testPhysicalDisconnectAndReconnect() {
  FakeInsole15Client.instances.length = 0;
  const device = fakeDevice('INS2', 'dev-left');
  chooserDevice = device;
  FakeInsole15Client.nextConfig = { deviceId: 1, deviceIdHex: '0x00000001', foot: 'left', firmwareVersion: '0.1.10' };
  const insole = new OrpheInsole(1);
  insole.setup();
  const seen = { disconnect: 0, attempts: 0, success: 0, failed: 0, errors: [] };
  insole.onDisconnect = () => { seen.disconnect++; };
  insole.onReconnectAttempt = () => { seen.attempts++; };
  insole.onReconnectSuccess = () => { seen.success++; };
  insole.onReconnectFailed = () => { seen.failed++; };
  insole.onError = (e) => seen.errors.push(e);
  await insole.begin('SENSOR_VALUES', { autoReconnect: true, reconnectIntervalMs: 5, reconnectMaxAttempts: 3 });
  assert.equal(insole.device_information.mount_position, 0, 'left foot → bit0 = 0');
  const first = FakeInsole15Client.instances[0];
  assert.equal(first.isMonitoring, true);

  // 物理切断: GATT は既に無いので transport のリスナー解除だけ（gatt.disconnect は呼ばない）
  device.gatt.connected = false;
  device.dispatch('gattserverdisconnected');
  assert.equal(seen.disconnect, 1);
  assert.equal(first.isMonitoring, false, 'monitor loop stopped on physical disconnect');
  assert.ok(first.calls.includes('transport.disconnect'));
  assert.ok(!first.calls.includes('disconnect'), 'no gatt disconnect after a physical disconnect');
  assert.equal(insole.connectionState, 'reconnecting');

  await waitFor(() => seen.success === 1, { timeoutMs: 2000, message: 'auto reconnect succeeds' });
  assert.equal(FakeInsole15Client.instances.length, 2, 'reconnect creates a fresh client');
  const second = FakeInsole15Client.instances[1];
  assert.equal(second.isMonitoring, true);
  assert.equal(insole._insole15, second);
  assert.equal(insole.isConnected(), true);
  assert.equal(insole.generation, 2);
  assert.deepEqual(seen.errors, []);
  assert.equal(device.listenerCount('gattserverdisconnected') <= 2, true, 'no listener pile-up');
  insole.stop();
  assert.equal(second.isMonitoring, false);
  FakeInsole15Client.nextConfig = null;
  console.log('  ok  physical disconnect stops the loop; auto reconnect restarts with a new client');
}

async function testBeginFailureCleansUp() {
  FakeInsole15Client.instances.length = 0;
  const device = fakeDevice('INS2', 'dev-bad');
  chooserDevice = device;
  const insole = new OrpheInsole(0);
  insole.setup();
  insole.onError = () => {};
  const originalGetConfig = FakeInsole15Client.prototype.getConfigInfo;
  FakeInsole15Client.prototype.getConfigInfo = async function () { throw new Error('boom'); };
  try {
    await assert.rejects(insole.begin('SENSOR_VALUES'), /boom/);
  } finally {
    FakeInsole15Client.prototype.getConfigInfo = originalGetConfig;
  }
  const client = FakeInsole15Client.instances[0];
  assert.ok(client.calls.includes('disconnect'), 'failed begin disconnects the client');
  assert.equal(insole._insole15, null);
  assert.equal(insole.isConnected(), false);
  assert.equal(insole.connectionState, 'disconnected');
  console.log('  ok  begin() failure tears the client down');
}

function createLoaderContext(currentScriptSrc) {
  const appended = [];
  const documentMock = {
    readyState: 'complete',
    currentScript: currentScriptSrc ? { src: currentScriptSrc } : null,
    scripts: [],
    head: { appendChild(el) { appended.push(el); } },
    createElement: () => ({}),
    addEventListener() { },
  };
  const ctx = vm.createContext({
    console, performance, Date, Math, JSON, Promise, Number, Object, Array, String, Error, TypeError, RegExp,
    setTimeout, clearTimeout,
    document: documentMock,
    navigator: {},
    localStorage: { getItem: () => null, setItem() { }, removeItem() { } },
    DataView, ArrayBuffer, Uint8Array,
  });
  ctx.globalThis = ctx;
  ctx.window = ctx;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'ORPHE-INSOLE.js'), 'utf8'), ctx);
  return { ctx, appended };
}

async function testLazyLoad() {
  // src から: 同じディレクトリの Insole15Client.js を 1 回だけ挿入し、onload で resolve
  {
    const { ctx, appended } = createLoaderContext('https://example.com/lib/src/ORPHE-INSOLE.js?v=1');
    assert.equal(ctx.OrpheInsole.insole15ClientAvailable(), false);
    const p1 = ctx.OrpheInsole.loadInsole15Client();
    const p2 = ctx.OrpheInsole.loadInsole15Client();
    assert.equal(p1, p2, 'concurrent loads share one promise');
    const scripts = appended.filter((s) => s.src && s.src.endsWith('/Insole15Client.js'));
    assert.equal(scripts.length, 1, 'exactly one Insole15Client.js script');
    assert.equal(scripts[0].src, 'https://example.com/lib/src/Insole15Client.js');
    ctx.Insole15 = { InsoleClient: function InsoleClient() { } };
    scripts[0].onload();
    assert.equal(await p1, ctx.Insole15);
    assert.equal(ctx.OrpheInsole.insole15ClientAvailable(), true);
    assert.equal(await ctx.OrpheInsole.loadInsole15Client(), ctx.Insole15, 'already loaded → no new script');
    assert.equal(appended.filter((s) => s.src && s.src.endsWith('/Insole15Client.js')).length, 1);
  }
  // dist の .min.js から: Insole15Client.min.js を選ぶ。onerror は INSOLE15_CLIENT_UNAVAILABLE
  {
    const { ctx, appended } = createLoaderContext('https://cdn.example/npm/orphe-insole@1.3.4/dist/orphe-insole.min.js');
    const p = ctx.OrpheInsole.loadInsole15Client();
    const script = appended.find((s) => s.src && /Insole15Client/.test(s.src));
    assert.equal(script.src, 'https://cdn.example/npm/orphe-insole@1.3.4/dist/Insole15Client.min.js');
    script.onerror();
    await assert.rejects(p, (e) => e.code === 'INSOLE15_CLIENT_UNAVAILABLE');
  }
  // URL が取れない場合は reject（事前 <script> が必要）
  {
    const { ctx, appended } = createLoaderContext(null);
    await assert.rejects(ctx.OrpheInsole.loadInsole15Client(), (e) => e.code === 'INSOLE15_CLIENT_UNAVAILABLE');
    assert.equal(appended.filter((s) => s.src && /Insole15Client/.test(s.src)).length, 0);
  }
  console.log('  ok  Insole15Client lazy load (src / dist.min / no base)');
}

async function main() {
  testEncode();
  await testBeginAndDispatch();
  await testPhysicalDisconnectAndReconnect();
  await testBeginFailureCleansUp();
  await testLazyLoad();
  console.log('insole15-core.test.js passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
