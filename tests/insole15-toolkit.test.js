'use strict';

// InsoleToolkitSession の INSOLE 1.5 対応の回帰テスト（BLE 実機は使わない）。
//
// - FIFO を選んだままでも INSOLE 1.5 では接続を失敗させず Realtime へ退避する（診断 'insole15-fifo-unavailable'）
// - startMeasurement({ profile: 'fifo-recording' }) も Realtime として記録され、再エンコード済みパケットの
//   serial で欠損（missing）が数えられる
// - snapshot() に generation / insole15 / insole15Diagnostics が載る
// - 製品版（generation 1）の挙動は変わらない（FIFO 開始が呼ばれる）

const assert = require('node:assert/strict');

class BootstrapInsole {
  constructor(id = 0) { this.id = id; this._afterReconnectSuccess = []; }
}
global.OrpheInsole = BootstrapInsole;

const { InsoleToolkitSession } = require('../src/InsoleToolkit.js');

class FakeInsole {
  constructor(id = 0, generation = 2) {
    this.id = id;
    this.generation = generation;
    this.connected = false;
    this.streaming_mode = 4;
    this.calls = [];
    this._afterReconnectSuccess = [];
    this.sensorDataListeners = new Set();
    this.loss = { lossRate: 0.0125, samples: 7900, skippedSamples: 100 };
  }
  get isInsole15() { return this.generation === 2; }
  insole15Diagnostics() { return this.isInsole15 ? { ...this.loss } : null; }
  async begin(type, options) {
    this.calls.push(`begin:${type}:${options.streamingMode}`);
    this.connected = true;
    this.streaming_mode = options.streamingMode;
    return this.isInsole15 ? 'done begin(); SENSOR VALUES (INSOLE 1.5)' : 'connected';
  }
  reset() { this.calls.push('reset'); this.connected = false; }
  isConnected() { return this.connected; }
  async setDataStreamingMode(mode) { this.calls.push(`mode:${mode}`); this.streaming_mode = mode; }
  async startNotify(type) { this.calls.push(`notify:start:${type}`); }
  async stopNotify(type) { this.calls.push(`notify:stop:${type}`); }
  addSensorDataListener(listener) {
    this.sensorDataListeners.add(listener);
    return () => this.sensorDataListeners.delete(listener);
  }
  emitPacket(serialNumber, samples) {
    const packet = { header: 56, serial_number: serialNumber, timestamp: 1000, samples };
    for (const listener of this.sensorDataListeners) {
      listener({ deviceId: this.id, receivedAt: Date.now(), packet, data: null });
    }
  }
}

class FakeFifo {
  constructor(insole) { this.insole = insole; }
  async start() { this.insole.calls.push('fifo:start'); return true; }
  async stop() { this.insole.calls.push('fifo:stop'); return new Map(); }
  createCheckpoint() { return { captureId: 1 }; }
  summarizeSince() { return { available: false }; }
}

function sample(serial) {
  return {
    timestamp: 1000 + serial * 5, serial_number: serial, packet_number: 0,
    quat: { w: 1, x: 0, y: 0, z: 0 }, acc: { x: 0, y: 0, z: 0.0625 }, gyro: { x: 0, y: 0, z: 0 },
    converted_acc: { x: 0, y: 0, z: 1 }, converted_gyro: { x: 0, y: 0, z: 0 }, press: { values: [1, 2, 3, 4, 5, 6] },
  };
}

async function testFifoFallback() {
  const insole = new FakeInsole(0, 2);
  const diagnostics = [];
  const states = [];
  const session = new InsoleToolkitSession(insole, {
    onError() {},
    sensorDataMode: 'fifo',
    streamingMode: 3,
    gait: { onDiagnostic: (id, d) => diagnostics.push(d.type) },
    onStateChange: (s) => states.push(s),
  }, { FifoClass: FakeFifo, GaitClass: null });
  assert.equal(session.supportsFifo, true);
  assert.equal(session.sensorDataMode, 'fifo');
  assert.equal(session.snapshot().insole15, true);
  assert.equal(session.snapshot().generation, 2);

  const result = await session.connect();
  assert.match(result, /INSOLE 1\.5/);
  assert.equal(session.connected, true);
  assert.equal(session.sensorDataMode, 'realtime', 'FIFO falls back to realtime on INSOLE 1.5');
  assert.equal(session.fifoActive, false);
  assert.ok(!insole.calls.includes('fifo:start'), 'FIFO is never started');
  assert.ok(diagnostics.includes('insole15-fifo-unavailable'));
  const snap = session.snapshot();
  assert.equal(snap.sensorDataMode, 'realtime');
  assert.equal(snap.profileId, 'realtime-pressure', 'streamingMode 3 + realtime → the named pressure profile');
  assert.equal(snap.insole15Diagnostics.lossRate, 0.0125);
  assert.equal(snap.supportsFifo, true, 'library availability is unchanged');

  // 再度 FIFO を選んでも同じく退避（エラーにしない）
  await session.setSensorDataMode('fifo');
  assert.equal(session.sensorDataMode, 'realtime');
  assert.equal(session.lastError, null);

  // 計測: fifo-recording プロファイルでも Realtime として記録される
  const started = await session.startMeasurement({ profile: 'fifo-recording', restoreProfile: true });
  assert.match(started.profileId, /^realtime/, 'the fifo-recording profile is recorded as realtime');
  assert.equal(session.sensorDataMode, 'realtime');
  assert.equal(session.measurementPhase, 'recording');
  for (let packet = 0; packet < 10; packet++) {
    if (packet === 4 || packet === 5) continue; // 2 パケット（4 サンプル）欠損
    insole.emitPacket(packet, [sample(packet * 2), sample(packet * 2 + 1)]);
  }
  const measurement = await session.stopMeasurement();
  assert.equal(measurement.status, 'completed');
  assert.equal(measurement.profile.sensorDataMode, 'realtime');
  assert.equal(measurement.raw.packets, 8);
  assert.equal(measurement.raw.samples.length, 16);
  assert.deepEqual({ expected: measurement.raw.serial.expected, received: measurement.raw.serial.received, missing: measurement.raw.serial.missing },
    { expected: 10, received: 8, missing: 2 });
  assert.equal(session.measurementPhase, 'idle');
  assert.ok(!insole.calls.includes('fifo:start') && !insole.calls.includes('fifo:stop'));

  await session.disconnect();
  assert.equal(session.connected, false);
  console.log('  ok  INSOLE 1.5: FIFO falls back to realtime; measurement records re-encoded packets');
}

async function testLongRecordingSerialSummary() {
  // 1.5 の Realtime は 100 packet/s → 11 分で 66000 packet と uint16 を一周する。
  // serial を unwrap して数えるので expected/received/missing が飽和しない。
  const insole = new FakeInsole(0, 2);
  const session = new InsoleToolkitSession(insole, { onError() {} }, { FifoClass: null, GaitClass: null });
  await session.connect();
  await session.startMeasurement({ maxSamples: 10 });
  const total = 70000;
  const holes = new Set([100, 101, 65535, 0 + 65536, 69000]); // 5 packet 欠損（wrap 境界をまたぐものを含む）
  for (let packet = 0; packet < total; packet++) {
    if (holes.has(packet)) continue;
    insole.emitPacket(packet & 0xffff, [sample(packet * 2)]);
  }
  // 遅延到着（再要求）: 欠損のうち 1 つが後から届く
  insole.emitPacket(69000 & 0xffff, [sample(69000 * 2)]);
  const result = await session.stopMeasurement();
  assert.equal(result.raw.packets, total - 4);
  assert.deepEqual(
    { expected: result.raw.serial.expected, received: result.raw.serial.received, missing: result.raw.serial.missing },
    { expected: total, received: total - 4, missing: 4 },
    'serial summary survives a uint16 wrap'
  );
  assert.equal(result.raw.serial.first, 0);
  assert.equal(result.raw.serial.last, (total - 1) & 0xffff);
  assert.equal(result.raw.truncated, true, 'samples are capped by maxSamples but serials keep counting');
  await session.disconnect();
  console.log('  ok  measurement serial summary is exact past 65536 packets');
}

async function testProductUnchanged() {
  const insole = new FakeInsole(1, 1);
  const session = new InsoleToolkitSession(insole, { onError() {}, sensorDataMode: 'fifo' }, { FifoClass: FakeFifo, GaitClass: null });
  await session.connect();
  assert.equal(session.sensorDataMode, 'fifo');
  assert.equal(session.fifoActive, true);
  assert.ok(insole.calls.includes('fifo:start'));
  const snap = session.snapshot();
  assert.equal(snap.insole15, false);
  assert.equal(snap.generation, 1);
  assert.equal(snap.insole15Diagnostics, null);
  await session.disconnect();
  console.log('  ok  product insole: FIFO path unchanged');
}

async function main() {
  await testFifoFallback();
  await testLongRecordingSerialSummary();
  await testProductUnchanged();
  console.log('insole15-toolkit.test.js passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
