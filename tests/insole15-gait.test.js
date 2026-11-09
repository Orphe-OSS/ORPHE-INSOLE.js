'use strict';

// OrpheInsoleGait の INSOLE 1.5 経路（get_gait_live ポーリング）の回帰テスト（BLE 実機は使わない）。
//
// - insole15StrideToRow(): FW の完了ストライド → 製品版と同じ row（派生値・欠損 null・分類）
// - start(): コア SDK が INSOLE 1.5 に接続中なら client.startGaitMonitor() を使い、ポーリング応答を
//   validPackets/transportNotifications として数える（Toolkit の liveness 検証が満たせる）
// - stride → rows / onGait / onRaw、stop() → stopGaitMonitor、未対応 FW → INSOLE15_GAIT_UNSUPPORTED
// - refreshSubscription() は同じクライアントで張り直し rows を維持、物理切断 → 再接続で新クライアントに再購読
// - 同一 insole で 2 つ目の Gait は GAIT_ALREADY_ACTIVE

const assert = require('node:assert/strict');
const OrpheInsoleGait = require('../src/InsoleGait.js');

class FakeClient {
  constructor() {
    this.calls = [];
    this._gait = false;
    this.strideCb = null;
    this.pollCb = null;
    this.unsupported = false;
    this.started = 0;
  }
  get isGaitMonitoring() { return this._gait; }
  async startGaitMonitor(onStride, opts = {}) {
    this.calls.push('startGaitMonitor');
    if (this._gait) return;
    this.started++;
    if (this.unsupported) {
      const e = new Error('unsupported');
      e.code = 'INSOLE15_GAIT_UNSUPPORTED';
      throw e;
    }
    this._gait = true;
    this.strideCb = onStride;
    this.pollCb = opts.onPoll;
    this.pollMs = opts.pollMs;
    if (this.pollCb) this.pollCb({ measuring: true, sessionId: 0, steps: 0, distanceM: 0, strideSeq: 0, rttMs: 30 });
  }
  stopGaitMonitor() { this.calls.push('stopGaitMonitor'); this._gait = false; this.strideCb = null; }
  poll(info = {}) { if (this.pollCb) this.pollCb({ measuring: true, sessionId: 0, steps: 1, distanceM: 1.2, strideSeq: 1, rttMs: 25, ...info }); }
  stride(s = {}) {
    if (!this.strideCb) return;
    this.strideCb({
      strideSeq: 1, sessionId: 0, steps: 1, distanceM: 1.2, strideLength: 1.2, strideHeight: 0.12, speed: 1.1,
      pronation: -8.5, strikeAngle: -12, cadence: 0.9, landingForce: 1.4, contactTime: 0.6, gaitType: 1, footStrike: 1, ...s,
    });
  }
}

function fakeDevice() {
  const listeners = {};
  return {
    addEventListener(type, fn) { (listeners[type] = listeners[type] || new Set()).add(fn); },
    removeEventListener(type, fn) { if (listeners[type]) listeners[type].delete(fn); },
    dispatch(type) { for (const fn of Array.from(listeners[type] || [])) fn({ type }); },
  };
}

function fakeInsole(client) {
  const device = fakeDevice();
  return {
    id: 1,
    generation: 2,
    isInsole15: true,
    _insole15: client,
    bluetoothDevice: device,
    connected: true,
    isConnected() { return this.connected; },
    _afterReconnectSuccess: [],
    calls: [],
    async stopNotify(uuid) { this.calls.push(`stopNotify:${uuid}`); },
    async setDataStreamingMode(mode) { this.calls.push(`mode:${mode}`); },
  };
}

function testStrideToRow() {
  const row = OrpheInsoleGait.insole15StrideToRow({
    strideSeq: 7, strideLength: 1.25, strideHeight: 0.1, speed: 1.3, pronation: -8.5, strikeAngle: -12,
    cadence: 2, landingForce: 1.4, contactTime: 0.3, gaitType: 1, footStrike: 1, distanceM: 8.75,
  });
  assert.equal(row.step_number, 7);
  assert.equal(row.gait_type, 'walk');
  assert.equal(row.duration_s, 0.5, 'duration = 1 / cadence');
  assert.equal(row.cadence_hz, 2);
  assert.equal(row.stance_phase_s, 0.3);
  assert.ok(Math.abs(row.swing_phase_s - 0.2) < 1e-9, 'swing = duration - stance');
  assert.equal(row.stride_norm_m, 1.25);
  assert.equal(row.stride_z_m, 0.1);
  assert.equal(row.speed_mps, 1.3);
  assert.equal(row.foot_strike, 'heelStrike');
  assert.equal(row.pronation_deg, -8.5);
  assert.equal(row.pronation_type, 'neutral');
  assert.equal(row.strike_angle_deg, -12);
  assert.equal(row.foot_angle_deg, -12);
  assert.equal(row.distance_m, 8.75);
  assert.equal(row.stride_direction, null);
  assert.equal(row.stride_x_m, null);
  assert.equal(row.calorie, null);
  // sentinel / 不正値
  const bad = OrpheInsoleGait.insole15StrideToRow({
    strideSeq: 8, strideLength: -1, strideHeight: NaN, speed: -1, pronation: -20, strikeAngle: 5,
    cadence: 0, landingForce: -1, contactTime: 0.9, gaitType: 9, footStrike: 7, distanceM: -1,
  });
  assert.equal(bad.stride_norm_m, null);
  assert.equal(bad.stride_z_m, null);
  assert.equal(bad.speed_mps, null);
  assert.equal(bad.duration_s, null, 'cadence 0 → no duration');
  assert.equal(bad.swing_phase_s, null);
  assert.equal(bad.stance_phase_s, 0.9);
  assert.equal(bad.landing_force, null);
  assert.equal(bad.distance_m, null);
  assert.equal(bad.gait_type, 'unknown');
  assert.equal(bad.foot_strike, 'unknown');
  assert.equal(bad.pronation_type, 'severeUnder', 'below average − 3σ (−19.9°) → severeUnder, same thresholds as the product');
  assert.equal(bad.pronation_deg, -20, 'negative pronation is a valid angle');
  // stance ≥ duration → swing null
  const tight = OrpheInsoleGait.insole15StrideToRow({ strideSeq: 9, cadence: 2, contactTime: 0.6 });
  assert.equal(tight.swing_phase_s, null);
  // CSV 行は製品版と同じ列数
  const cols = OrpheInsoleGait.gaitRowToCsv(row).split(',');
  assert.equal(cols.length, OrpheInsoleGait.CSV_HEADER.split(',').length);
  console.log('  ok  insole15StrideToRow');
}

async function testLifecycle() {
  const client = new FakeClient();
  const insole = fakeInsole(client);
  const gait = new OrpheInsoleGait(insole, { pollMs: 200 });
  const got = { rows: [], raw: [], diag: [], transport: [], errors: [] };
  gait.onGait = (id, row) => got.rows.push([id, row]);
  gait.onRaw = (id, p) => got.raw.push(p);
  gait.onDiagnostic = (id, d) => got.diag.push(d.type);
  gait.onTransport = (id, t) => got.transport.push(t);
  gait.onError = (e) => got.errors.push(e);

  assert.equal(await gait.start(), true);
  assert.equal(client.pollMs, 200);
  assert.equal(client.isGaitMonitoring, true);
  assert.equal(gait.isRunning, true);
  const d1 = gait.diagnostics();
  assert.equal(d1.subscribed, true);
  assert.equal(d1.validPackets, 1, 'first poll counts as a valid packet');
  assert.equal(d1.transportNotifications, 1);
  assert.equal(d1.insole15.polling, true);
  assert.equal(d1.insole15.polls, 1);
  assert.equal(got.transport[0].subheader, 'insole15-poll');
  assert.ok(got.diag.includes('subscribed') && got.diag.includes('first-valid-packet'));
  assert.equal(insole._gaitNotifyOwner, gait, 'owner claimed');

  // waitForPacket は次のポーリング応答で解決
  const wait = gait.waitForPacket({ afterCount: d1.validPackets, timeoutMs: 1000 });
  client.poll();
  assert.equal(await wait, true);
  assert.equal(gait.diagnostics().validPackets, 2);

  client.stride({ strideSeq: 1 });
  client.stride({ strideSeq: 2, footStrike: 3, pronation: 2 });
  assert.equal(gait.stepCount, 2);
  assert.equal(got.rows.length, 2);
  assert.equal(got.rows[0][0], 1, 'deviceId');
  assert.equal(got.rows[1][1].foot_strike, 'forefoot');
  assert.equal(got.rows[1][1].pronation_type, 'severeOver', '+2° is above average + 3σ (1.1°)');
  assert.equal(got.raw[0].type, 'insole15-stride');
  assert.match(gait.toCSV(), /^step_number/);

  // 二重 start は no-op（true）、別インスタンスは GAIT_ALREADY_ACTIVE
  assert.equal(await gait.start(), true);
  assert.equal(client.started, 1);
  const other = new OrpheInsoleGait(insole);
  const otherErrors = [];
  other.onError = (e) => otherErrors.push(e);
  assert.equal(await other.start(), false);
  assert.equal(otherErrors[0].code, 'GAIT_ALREADY_ACTIVE');

  // refresh: 同じクライアントで stop → start、rows は維持
  assert.equal(await gait.refreshSubscription(), true);
  assert.equal(client.started, 2);
  assert.equal(gait.stepCount, 2);
  assert.deepEqual(client.calls.slice(-2), ['stopGaitMonitor', 'startGaitMonitor']);

  // 物理切断 → 再接続（新クライアント）で再購読。rows は維持（continuing）
  const client2 = new FakeClient();
  insole.bluetoothDevice.dispatch('gattserverdisconnected');
  assert.equal(gait.diagnostics().subscribed, false);
  assert.equal(gait.isRunning, true, 'desired state survives a disconnect');
  insole._insole15 = client2;
  for (const hook of insole._afterReconnectSuccess.slice()) await hook();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(client2.isGaitMonitoring, true);
  assert.equal(gait.diagnostics().subscribed, true);
  assert.equal(gait.stepCount, 2);
  client2.stride({ strideSeq: 1 });
  assert.equal(gait.stepCount, 3);

  // stop → stopGaitMonitor、owner 解放、hooks 解除
  await gait.stop();
  assert.equal(client2.isGaitMonitoring, false);
  assert.equal(gait.isRunning, false);
  assert.equal(insole._gaitNotifyOwner, undefined);
  assert.equal(insole._afterReconnectSuccess.length, 0);
  client2.stride({ strideSeq: 5 });
  assert.equal(gait.stepCount, 3, 'no rows after stop');
  assert.deepEqual(got.errors, []);

  // 再 start は rows をリセット
  assert.equal(await gait.start(), true);
  assert.equal(gait.stepCount, 0);
  await gait.stop();
  console.log('  ok  INSOLE 1.5 polling lifecycle (start/poll/stride/refresh/reconnect/stop)');
}

async function testUnsupportedAndNotConnected() {
  const client = new FakeClient();
  client.unsupported = true;
  const insole = fakeInsole(client);
  const gait = new OrpheInsoleGait(insole);
  const errors = [];
  const diag = [];
  gait.onError = (e) => errors.push(e);
  gait.onDiagnostic = (id, d) => diag.push(d.type);
  assert.equal(await gait.start(), false);
  assert.equal(errors[0].code, 'INSOLE15_GAIT_UNSUPPORTED');
  assert.ok(diag.includes('fw-gait-live-unsupported'));
  assert.equal(gait.isRunning, false);
  assert.equal(insole._gaitNotifyOwner, undefined, 'owner released on failure');

  const insole2 = fakeInsole(null);
  const gait2 = new OrpheInsoleGait(insole2);
  const errors2 = [];
  gait2.onError = (e) => errors2.push(e);
  assert.equal(await gait2.start(), false);
  assert.equal(errors2[0].code, 'GAIT_NOT_CONNECTED');

  const insole3 = fakeInsole(new FakeClient());
  insole3.connected = false;
  const gait3 = new OrpheInsoleGait(insole3);
  gait3.onError = () => {};
  assert.equal(await gait3.start(), false);
  console.log('  ok  unsupported firmware / not connected');
}

async function main() {
  testStrideToRow();
  await testLifecycle();
  await testUnsupportedAndNotConnected();
  console.log('insole15-gait.test.js passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
