const assert = require('node:assert/strict');
const Gait = require('../src/InsoleGait.js');
const { waitFor } = require('./async-test-utils.js');

function near(actual, expected, tol, label) {
  assert.ok(actual !== null && Math.abs(actual - expected) <= tol, `${label}: ${actual} !~= ${expected}`);
}

// 20byte の歩容解析パケット(DataView)を組み立てる。setters(dv) で各フィールドを設定。
function pkt(subheader, step, setters) {
  const dv = new DataView(new ArrayBuffer(20));
  dv.setUint8(0, 51);
  dv.setUint8(1, subheader);
  dv.setUint16(2, step, false); // BE
  if (setters) setters(dv);
  return dv;
}
const f32 = (dv, o, v) => dv.setFloat32(o, v, false);

// ── float16 (half-precision, big-endian) デコード ──
{
  const h = (hex) => { const dv = new DataView(new ArrayBuffer(2)); dv.setUint16(0, hex, false); return Gait.f16be(dv, 0); };
  assert.equal(h(0x0000), 0);
  near(h(0x3c00), 1.0, 1e-6, 'f16 1.0');
  near(h(0xc000), -2.0, 1e-6, 'f16 -2.0');
  near(h(0x3800), 0.5, 1e-6, 'f16 0.5');
  near(h(0x4200), 3.0, 1e-6, 'f16 3.0');
  near(h(0x3555), 0.333, 1e-3, 'f16 ~1/3');
  near(h(0x0001), Math.pow(2, -24), 1e-30, 'f16 subnormal');   // 最小非正規化数
  assert.equal(h(0x7c00), Infinity);                           // +Inf（sanitize 前）
  assert.ok(Number.isNaN(h(0x7e00)));                          // NaN
}

// ── decodeAnalysisPacket: ガード ──
{
  assert.equal(Gait.decodeAnalysisPacket(null), null);
  assert.equal(Gait.decodeAnalysisPacket(new DataView(new ArrayBuffer(10))), null); // 長さ不足
  const notPkt = pkt(0, 1, (dv) => dv.setUint8(0, 50)); // header != 51
  assert.equal(Gait.decodeAnalysisPacket(notPkt), null);
  const unknownSub = pkt(3, 1); // 未知サブヘッダー
  assert.equal(Gait.decodeAnalysisPacket(unknownSub), null);
}

// ── overview (subheader 0) ──
{
  // byte[4]: gait_type=bit7-6, stride_direction=bit5-3。walk(1) forward(1) = 0x48
  const ov = pkt(0, 72, (dv) => {
    dv.setUint8(4, 0x48);
    dv.setUint16(6, 0x0000);  // calorie f16 = 0
    f32(dv, 8, 73.56);        // distance
    f32(dv, 12, 0.6);         // stance
    f32(dv, 16, 0.5);         // swing
  });
  const d = Gait.decodeAnalysisPacket(ov);
  assert.equal(d.type, 'overview');
  assert.equal(d.subheader, 0);
  assert.equal(d.step_number, 72);
  assert.equal(d.gait_type, 'walk');
  assert.equal(d.stride_direction, 'forward');
  near(d.distance_m, 73.56, 1e-3, 'distance');
  near(d.stance_phase_s, 0.6, 1e-6, 'stance');
  near(d.swing_phase_s, 0.5, 1e-6, 'swing');
  assert.equal(d.calorie, 0);

  // run(2) backward(2) = (2<<6)|(2<<3) = 0x90
  const ov2 = Gait.decodeAnalysisPacket(pkt(0, 1, (dv) => dv.setUint8(4, 0x90)));
  assert.equal(ov2.gait_type, 'run');
  assert.equal(ov2.stride_direction, 'backward');
}

// ── stride (subheader 1) ──
{
  const st = pkt(1, 72, (dv) => {
    f32(dv, 4, -12.0);  // foot_angle
    f32(dv, 8, 1.0);    // x
    f32(dv, 12, 0.2);   // y
    f32(dv, 16, 0.1);   // z
  });
  const d = Gait.decodeAnalysisPacket(st);
  assert.equal(d.type, 'stride');
  near(d.foot_angle, -12.0, 1e-5, 'foot_angle');
  near(d.stride_x, 1.0, 1e-6, 'x');
  near(d.stride_y, 0.2, 1e-6, 'y');
  near(d.stride_z, 0.1, 1e-6, 'z');
  near(Gait.strideNorm(d), Math.sqrt(1.0 + 0.04 + 0.01), 1e-5, 'norm');
}

// ── pronation (subheader 2) + NaN サニタイズ ──
{
  const pr = pkt(2, 72, (dv) => {
    f32(dv, 4, 0.4);     // landing_force
    f32(dv, 8, -12.0);   // pronation_x (strike angle)
    f32(dv, 12, -10.7);  // pronation_y
    f32(dv, 16, NaN);    // pronation_z → null になること
  });
  const d = Gait.decodeAnalysisPacket(pr);
  assert.equal(d.type, 'pronation');
  near(d.landing_force, 0.4, 1e-6, 'force');
  near(d.pronation_x, -12.0, 1e-5, 'pron_x');
  near(d.pronation_y, -10.7, 1e-4, 'pron_y');
  assert.equal(d.pronation_z, null, 'NaN は null に丸められる');
}

// ── motion (subheader 4) ──
{
  const mo = pkt(4, 72, (dv) => {
    dv.setUint8(4, (1 << 6) | (2 << 3) | 3); // phase1 period2 event3
    dv.setUint16(6, 0x3c00);   // quat_w = 1.0
    dv.setUint16(8, 0x0000);   // quat_x = 0
    dv.setUint16(10, 0x0000);  // quat_y = 0
    dv.setUint16(12, 0x0000);  // quat_z = 0
    dv.setUint16(14, 0x3800);  // delta_x = 0.5
  });
  const d = Gait.decodeAnalysisPacket(mo);
  assert.equal(d.type, 'motion');
  assert.equal(d.gait_cycle_phase, 1);
  assert.equal(d.gait_cycle_period, 2);
  assert.equal(d.gait_cycle_event, 3);
  near(d.quat_w, 1.0, 1e-6, 'quat_w');
  assert.equal(d.quat_x, 0);
  near(d.delta_x, 0.5, 1e-6, 'delta_x');
}

// ── 分類ヘルパ ──
{
  assert.equal(Gait.footStrikeToStr(null), 'none');
  assert.equal(Gait.footStrikeToStr(3.0), 'forefoot');   // > 2.0
  assert.equal(Gait.footStrikeToStr(0.0), 'midfoot');    // > -3.0
  assert.equal(Gait.footStrikeToStr(-12.0), 'heelStrike');

  assert.equal(Gait.pronationToStr(null), 'none');
  assert.equal(Gait.pronationToStr(-9.4), 'neutral');    // ave
  assert.equal(Gait.pronationToStr(-6.0), 'neutral');    // ave+std=-5.9 の内側
  assert.equal(Gait.pronationToStr(-3.0), 'over');       // ave+std < x <= ave+3std(1.1)
  assert.equal(Gait.pronationToStr(5.0), 'severeOver');  // > ave+3std
  assert.equal(Gait.pronationToStr(-15.0), 'under');     // ave-3std(-19.9) <= x < ave-std(-12.9)
  assert.equal(Gait.pronationToStr(-25.0), 'severeUnder');

  assert.equal(Gait.gaitTypeToStr(0), 'none');
  assert.equal(Gait.gaitTypeToStr(1), 'walk');
  assert.equal(Gait.gaitTypeToStr(9), 'unknown');
  assert.equal(Gait.strideDirectionToStr(3), 'inside');
  assert.equal(Gait.strideDirectionToStr(4), 'outside');
}

// ── buildGaitRow（派生指標） ──
{
  const parts = {
    overview: { gait_type: 'walk', stride_direction: 'forward', distance_m: 73.56, stance_phase_s: 0.6, swing_phase_s: 0.5, calorie: 0.4 },
    stride: { foot_angle: -12, stride_x: 1.0, stride_y: 0.2, stride_z: 0.1 },
    pronation: { landing_force: 0.4, pronation_x: -12.0, pronation_y: -10.7, pronation_z: 1.2 },
  };
  const row = Gait.buildGaitRow(72, parts);
  assert.equal(row.step_number, 72);
  near(row.duration_s, 1.1, 1e-6, 'duration');
  near(row.stride_norm_m, Math.sqrt(1.05), 1e-6, 'stride_norm');
  near(row.cadence_hz, 1 / 1.1, 1e-6, 'cadence');
  near(row.speed_mps, Math.sqrt(1.05) / 1.1, 1e-6, 'speed');
  assert.equal(row.foot_strike, 'heelStrike');
  assert.equal(row.pronation_type, 'neutral');
  assert.equal(row.stride_z_m, 0.1);

  // duration=0 や欠損時は cadence/speed が null
  const parts0 = { overview: { stance_phase_s: null, swing_phase_s: null }, stride: { stride_x: null, stride_y: null, stride_z: null }, pronation: {} };
  const row0 = Gait.buildGaitRow(1, parts0);
  assert.equal(row0.duration_s, null);
  assert.equal(row0.cadence_hz, null);
  assert.equal(row0.speed_mps, null);
  assert.equal(row0.stride_norm_m, null);
}

// ── GaitAggregator: 3種そろって1歩、重複は無視 ──
{
  const agg = new Gait.GaitAggregator();
  const ov = Gait.decodeAnalysisPacket(pkt(0, 72, (dv) => { dv.setUint8(4, 0x48); f32(dv, 8, 73.56); f32(dv, 12, 0.6); f32(dv, 16, 0.5); }));
  const st = Gait.decodeAnalysisPacket(pkt(1, 72, (dv) => { f32(dv, 4, -12); f32(dv, 8, 1.0); f32(dv, 12, 0.2); f32(dv, 16, 0.1); }));
  const pr = Gait.decodeAnalysisPacket(pkt(2, 72, (dv) => { f32(dv, 4, 0.4); f32(dv, 8, -12); f32(dv, 12, -10.7); f32(dv, 16, 1.2); }));

  assert.equal(agg.add(ov), null, 'overview だけでは未完成');
  assert.equal(agg.add(st), null, 'stride 追加でも未完成');
  const row = agg.add(pr);
  assert.ok(row && row.step_number === 72, 'pronation で1歩完成');
  near(row.stride_norm_m, Math.sqrt(1.05), 1e-5, 'agg norm');
  assert.equal(row.gait_type, 'walk');

  // 取りこぼし対策の2回目送信（既出 step）は無視される
  assert.equal(agg.add(ov), null, '既出 step の再送は無視');
  assert.equal(agg.add(pr), null);

  // 別の step は独立して集約できる
  const ov2 = Gait.decodeAnalysisPacket(pkt(0, 73, (dv) => { dv.setUint8(4, 0x48); f32(dv, 12, 0.5); f32(dv, 16, 0.5); }));
  const st2 = Gait.decodeAnalysisPacket(pkt(1, 73, (dv) => { f32(dv, 8, 1.0); f32(dv, 12, 0); f32(dv, 16, 0); }));
  const pr2 = Gait.decodeAnalysisPacket(pkt(2, 73, (dv) => { f32(dv, 8, -2); f32(dv, 12, -9.0); }));
  assert.equal(agg.add(pr2), null);
  assert.equal(agg.add(ov2), null);
  const row2 = agg.add(st2);
  assert.ok(row2 && row2.step_number === 73, 'step 73 も完成');
  near(row2.duration_s, 1.0, 1e-6, 'step73 duration');
}

// ── CSV 出力 ──
{
  const row = Gait.buildGaitRow(72, {
    overview: { gait_type: 'walk', stride_direction: 'forward', distance_m: 73.56, stance_phase_s: 0.6, swing_phase_s: 0.5, calorie: 0.4 },
    stride: { foot_angle: -12, stride_x: 1.0, stride_y: 0.2, stride_z: 0.1 },
    pronation: { landing_force: 0.4, pronation_x: -12.0, pronation_y: -10.7, pronation_z: 1.2 },
  });
  const line = Gait.gaitRowToCsv(row);
  const cols = line.split(',');
  assert.equal(cols.length, 21, 'CSV は 21 列');
  assert.equal(cols[0], '72');
  assert.equal(cols[1], 'walk');
  assert.equal(cols[16], 'heelStrike');
  assert.equal(cols[18], 'neutral');
  assert.equal(Gait.CSV_HEADER.split(',').length, 21, 'ヘッダーも 21 列');
}

// ── P1-1: FW の -1 sentinel を欠損として扱う ──
{
  // 非負フィールド（stance/swing/distance/calorie/landing_force）の -1 は null になる
  const ov = Gait.decodeAnalysisPacket(pkt(0, 200, (dv) => {
    dv.setUint8(4, 0x48);
    dv.setUint16(6, 0xbc00);  // calorie f16 = -1.0 → null
    f32(dv, 8, -1);           // distance -1 → null
    f32(dv, 12, 0.8);         // stance 0.8（有効）
    f32(dv, 16, -1);          // swing -1 → null（片側 -1）
  }));
  assert.equal(ov.calorie, null, '-1 calorie → null');
  assert.equal(ov.distance_m, null, '-1 distance → null');
  near(ov.stance_phase_s, 0.8, 1e-6, '有効な stance は残る');
  assert.equal(ov.swing_phase_s, null, '-1 swing → null');

  const pr = Gait.decodeAnalysisPacket(pkt(2, 200, (dv) => { f32(dv, 4, -1); f32(dv, 8, -12); f32(dv, 12, -9); f32(dv, 16, 1); }));
  assert.equal(pr.landing_force, null, '-1 landing_force → null');
  assert.equal(pr.pronation_x, -12, '角度の負値は正当なので残る');

  // 派生値: 片側 -1（swing=null）→ duration/cadence/speed 全て null
  const rowOne = Gait.buildGaitRow(200, {
    overview: { gait_type: 'walk', stride_direction: 'forward', distance_m: null, stance_phase_s: 0.8, swing_phase_s: null },
    stride: { stride_x: 1, stride_y: 0, stride_z: 0 }, pronation: {},
  });
  assert.equal(rowOne.duration_s, null, '片側-1: duration null');
  assert.equal(rowOne.cadence_hz, null, '片側-1: cadence null');
  assert.equal(rowOne.speed_mps, null, '片側-1: speed null');

  // 両側 -1（両方 null）
  const rowBoth = Gait.buildGaitRow(201, { overview: { stance_phase_s: null, swing_phase_s: null }, stride: { stride_x: 1, stride_y: 0, stride_z: 0 }, pronation: {} });
  assert.equal(rowBoth.duration_s, null, '両側-1: duration null');
  assert.equal(rowBoth.cadence_hz, null);
  assert.equal(rowBoth.speed_mps, null);

  // 0以下の duration（stance=0, swing=0）→ duration null 扱い、cadence/speed null
  const rowZero = Gait.buildGaitRow(202, { overview: { stance_phase_s: 0, swing_phase_s: 0 }, stride: { stride_x: 1, stride_y: 0, stride_z: 0 }, pronation: {} });
  assert.equal(rowZero.duration_s, null, 'duration<=0 → null');
  assert.equal(rowZero.cadence_hz, null);
  assert.equal(rowZero.speed_mps, null);

  // 正常（duration>0）は計算される（回帰）
  const rowOk = Gait.buildGaitRow(203, { overview: { stance_phase_s: 0.7, swing_phase_s: 0.3 }, stride: { stride_x: 1, stride_y: 0, stride_z: 0 }, pronation: {} });
  assert.equal(rowOk.duration_s, 1.0);
  near(rowOk.cadence_hz, 1.0, 1e-9, 'cadence ok');
  near(rowOk.speed_mps, 1.0, 1e-9, 'speed ok');
}

// 1歩ぶんの overview/stride/pronation を集約器に流し込むヘルパ（完成すれば row を返す）
function completeStep(agg, step) {
  agg.add(Gait.decodeAnalysisPacket(pkt(0, step, (dv) => { dv.setUint8(4, 0x48); f32(dv, 12, 0.5); f32(dv, 16, 0.5); })));
  agg.add(Gait.decodeAnalysisPacket(pkt(1, step, (dv) => { f32(dv, 8, 1); f32(dv, 12, 0); f32(dv, 16, 0); })));
  return agg.add(Gait.decodeAnalysisPacket(pkt(2, step, (dv) => { f32(dv, 8, -2); f32(dv, 12, -9); })));
}

// ── P2-4: uint16 step の wraparound で古い step を挿入順(FIFO)に evict する ──
{
  const agg = new Gait.GaitAggregator();
  const CAP = 64 * 4;                 // _emitted 上限（MAX_PENDING_STEPS*4）
  const total = CAP + 5;
  const first = (65535 - 100 + 65536) % 65536; // 65435 から wraparound をまたいで連番
  for (let i = 0; i < total; i++) {
    const s = (first + i) % 65536;
    assert.ok(completeStep(agg, s), `emit ${s}`);
  }
  // 挿入順の最古（first=65435）は evict 済み → 再送で再 emit される
  assert.ok(completeStep(agg, first), 'FIFO最古(65435)は evict され再送で再emit');
  // wraparound 後の step 0 は「最近 emit」で保持されており、再送は dedup で無視される
  // （旧実装は数値昇順 evict で step 0 を最古と誤認して evict → 再emit してしまっていた）
  assert.equal(completeStep(agg, 0), null, 'wrapard後の step0 は最古誤認されず dedup 維持');
}

// ── ライフサイクル系（非同期）: モック insole で start/stop 直列化・所有権・再接続を検証 ──
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function nextTurn() {
  return new Promise((resolve) => setImmediate(resolve));
}

function makeMockInsole() {
  const disconnectListeners = new Set();
  const bluetoothDevice = {
    gatt: { connected: true },
    addEventListener(type, listener) {
      if (type === 'gattserverdisconnected') disconnectListeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'gattserverdisconnected') disconnectListeners.delete(listener);
    },
  };
  const mock = {
    id: 0,
    ORPHE_OTHER_SERVICE: 'svc',
    ORPHE_STEP_ANALYSIS: 'char',
    bluetoothDevice,
    _gaitNotifySink: undefined,
    _afterReconnectSuccess: [],
    _characteristics: {},
    _connected: true,
    notifying: false,
    calls: { startNotify: 0, stopNotify: 0, setUUID: 0 },
    isConnected() { return this._connected && this.bluetoothDevice.gatt.connected; },
    setUUID() { this.calls.setUUID++; },
    async startNotify(uuid) {
      this.calls.startNotify++;
      this._characteristics[uuid] = {};
      this.notifying = true;
    },
    async stopNotify() {
      this.calls.stopNotify++;
      this.notifying = false;
    },
    emitDisconnect() {
      this._connected = false;
      this.bluetoothDevice.gatt.connected = false;
      this.notifying = false;
      this._characteristics = {};
      for (const listener of Array.from(disconnectListeners)) listener({ target: this.bluetoothDevice });
    },
    emitReconnect() {
      this._connected = true;
      this.bluetoothDevice.gatt.connected = true;
      // Core の手動 begin() では SENSOR_VALUES が先に復旧し、STEP_ANALYSIS はまだ無い。
      this._characteristics.SENSOR_VALUES = {};
    },
  };
  return mock;
}

(async () => {
  // P1-2: startNotify が未完了でも stop() は待たずに完了し、遅延成功時は補償停止する
  {
    const mock = makeMockInsole();
    const startGate = deferred();
    mock.startNotify = async function (uuid) {
      this.calls.startNotify++;
      await startGate.promise;
      this._characteristics[uuid] = {};
      this.notifying = true;
    };
    const gait = new Gait(mock);
    const startPromise = gait.start();
    const stopPromise = gait.stop();
    const outcome = await Promise.race([
      stopPromise.then(() => 'stopped'),
      nextTurn().then(() => 'still-pending'),
    ]);
    assert.equal(outcome, 'stopped', 'stop は未完了の BLE startNotify に依存しない');
    assert.equal(gait.isRunning, false, 'start中stop後: running=false');
    assert.equal(mock._gaitNotifySink, undefined, 'start中stop後: sink なし');
    assert.equal(mock._afterReconnectSuccess.length, 0, 'start中stop後: 再接続フックなし');

    startGate.resolve();
    assert.equal(await startPromise, false, '停止後に遅れて完了した start は開始成功にしない');
    await nextTurn();
    assert.equal(mock.notifying, false, '遅延購読は補償停止済み');
    assert.equal(mock.calls.stopNotify, 1, '遅延購読に stopNotify を1回適用');
  }

  // P1-2: 同一 insole の複数 active Gait は拒否し、共有 notify を壊さない
  {
    const mock = makeMockInsole();
    const g1 = new Gait(mock);
    const g2 = new Gait(mock);
    let ownerError = null;
    g2.onError = (error) => { ownerError = error; };
    assert.equal(await g1.start(), true);
    const g1sink = mock._gaitNotifySink;
    assert.equal(await g2.start(), false, '2つ目の active Gait は拒否');
    assert.ok(ownerError instanceof Error, '競合理由を onError へ通知');
    assert.equal(ownerError.code, 'GAIT_ALREADY_ACTIVE');
    assert.equal(mock.calls.startNotify, 1, '2つ目は startNotify しない');
    assert.equal(mock._gaitNotifySink, g1sink, 'g1 の sink を維持');
    assert.equal(g1.isRunning, true);
    assert.equal(g2.isRunning, false);

    await g1.stop();
    assert.equal(mock.notifying, false, '所有者の stop で notify 停止');
    assert.equal(await g2.start(), true, '所有者の停止後は別インスタンスを開始可能');
    assert.equal(mock.calls.startNotify, 2);
    await g2.stop();
    assert.equal(mock._gaitNotifySink, undefined, 'g2.stop() で sink 削除');
  }

  // stopNotify 待機中は owner を保持し、古いstopが新しいGaitのnotifyを止める競合を防ぐ
  {
    const mock = makeMockInsole();
    const stopGate = deferred();
    mock.stopNotify = async function () {
      this.calls.stopNotify++;
      await stopGate.promise;
      this.notifying = false;
    };
    const g1 = new Gait(mock);
    const g2 = new Gait(mock);
    let ownerError = null;
    g2.onError = (error) => { ownerError = error; };
    assert.equal(await g1.start(), true);
    const stopping = g1.stop();
    await nextTurn();
    assert.equal(await g2.start(), false, 'stopNotify完了前はownerを譲らない');
    assert.equal(ownerError.code, 'GAIT_ALREADY_ACTIVE');
    assert.equal(mock.calls.startNotify, 1);

    stopGate.resolve();
    await stopping;
    assert.equal(await g2.start(), true, 'stopNotify完了後は次のownerを開始可能');
    assert.equal(mock.calls.startNotify, 2);
    await g2.stop();
  }

  // 遅延startの補償stop中は明示的にtransition pendingを返し、完了後のretryを許す
  {
    const mock = makeMockInsole();
    const startGate = deferred();
    const cleanupGate = deferred();
    mock.startNotify = async function (uuid) {
      this.calls.startNotify++;
      if (this.calls.startNotify === 1) await startGate.promise;
      this._characteristics[uuid] = {};
      this.notifying = true;
    };
    mock.stopNotify = async function () {
      this.calls.stopNotify++;
      await cleanupGate.promise;
      this.notifying = false;
    };
    const gait = new Gait(mock);
    let transitionError = null;
    gait.onError = (error) => { transitionError = error; };
    const oldStart = gait.start();
    await gait.stop();
    startGate.resolve();
    await waitFor(() => mock.calls.stopNotify > 0, 'late start compensation to call stopNotify');

    assert.equal(await gait.start(), false, '補償stop中のrestartは曖昧な成功にしない');
    assert.equal(transitionError.code, 'GAIT_TRANSITION_PENDING');
    cleanupGate.resolve();
    assert.equal(await oldStart, false);
    assert.equal(await gait.start(), true, '補償stop完了後のretryは成功');
    assert.equal(mock.calls.startNotify, 2);
    await gait.stop();
  }

  // stop後も旧startが未完了なら、同一characteristicへ次のstartを重ねない
  {
    const mock = makeMockInsole();
    const startGate = deferred();
    const cleanupGate = deferred();
    mock.startNotify = async function (uuid) {
      this.calls.startNotify++;
      if (this.calls.startNotify === 1) await startGate.promise;
      this._characteristics[uuid] = {};
      this.notifying = true;
    };
    mock.stopNotify = async function () {
      this.calls.stopNotify++;
      if (this.calls.stopNotify === 1) await cleanupGate.promise;
      this.notifying = false;
    };

    const g1 = new Gait(mock);
    const oldStart = g1.start();
    await g1.stop();
    const g2 = new Gait(mock);
    let transitionError = null;
    g2.onError = (error) => { transitionError = error; };
    assert.equal(await g2.start(), false, '旧startがpendingな間は次のownerを開始しない');
    assert.equal(transitionError.code, 'GAIT_TRANSITION_PENDING');
    assert.equal(mock.calls.startNotify, 1, '同一characteristicへstartNotifyを重ねない');

    startGate.resolve();
    await waitFor(() => mock.calls.stopNotify >= 1, 'first owner cleanup to call stopNotify');
    transitionError = null;
    assert.equal(await g2.start(), false, '補償stop完了までは次のownerを開始しない');
    assert.equal(transitionError.code, 'GAIT_TRANSITION_PENDING');

    cleanupGate.resolve();
    assert.equal(await oldStart, false);
    assert.equal(await g2.start(), true, '旧startと補償stop完了後は次のownerを開始できる');
    assert.equal(mock.calls.startNotify, 2);
    assert.equal(mock.notifying, true);
    await g2.stop();
  }

  // 切断でpending Setを新世代へ切り替えた後、旧Promiseのcleanupが新Setを削除しない
  {
    const mock = makeMockInsole();
    const startGates = [deferred(), deferred()];
    mock.startNotify = async function (uuid) {
      const index = this.calls.startNotify++;
      if (index < startGates.length) await startGates[index].promise;
      this._characteristics[uuid] = {};
      this.notifying = true;
    };

    const gait = new Gait(mock);
    const oldStart = gait.start();
    const oldPendingSet = mock._gaitNotifyPendingSubscriptions;
    assert.equal(oldPendingSet.size, 1);

    mock.emitDisconnect();
    mock.emitReconnect();
    for (const hook of mock._afterReconnectSuccess.slice()) hook();
    await nextTurn();

    const currentPendingSet = mock._gaitNotifyPendingSubscriptions;
    assert.ok(currentPendingSet instanceof Set);
    assert.notEqual(currentPendingSet, oldPendingSet, '再接続後は新しいpending Setを使う');
    assert.equal(currentPendingSet.size, 1);
    assert.equal(mock.calls.startNotify, 2, '旧pendingを待たず現世代の購読を開始');

    startGates[0].resolve();
    assert.equal(await oldStart, false);
    await nextTurn();
    assert.equal(mock._gaitNotifyPendingSubscriptions, currentPendingSet,
      '旧Promiseのcleanupは現世代のpending Setを削除しない');
    assert.equal(currentPendingSet.size, 1);

    const competing = new Gait(mock);
    let transitionError = null;
    competing.onError = (error) => { transitionError = error; };
    assert.equal(await competing.start(), false, '現世代の購読中は他ownerを開始しない');
    assert.equal(transitionError.code, 'GAIT_TRANSITION_PENDING');

    startGates[1].resolve();
    await nextTurn();
    await nextTurn();
    assert.equal(mock._gaitNotifyPendingSubscriptions, undefined, '現世代の完了後にSetを解放');
    assert.equal(gait._subscribed, true);
    await gait.stop();
  }

  // 切断で破棄した旧cleanup Setのfinallyが、新世代のcleanup Setを削除しない
  {
    const mock = makeMockInsole();
    const startGates = [deferred(), deferred()];
    const cleanupGates = [deferred(), deferred()];
    mock.startNotify = async function (uuid) {
      const index = this.calls.startNotify++;
      if (index < startGates.length) await startGates[index].promise;
      this._characteristics[uuid] = {};
      this.notifying = true;
    };
    mock.stopNotify = async function () {
      const index = this.calls.stopNotify++;
      if (index < cleanupGates.length) await cleanupGates[index].promise;
      this.notifying = false;
    };

    const g1 = new Gait(mock);
    const oldStart = g1.start();
    await g1.stop();
    startGates[0].resolve();
    await waitFor(() => mock.calls.stopNotify >= 1, 'old generation cleanup to call stopNotify');
    const oldCleanupSet = mock._gaitNotifyCleanupPromises;
    assert.equal(oldCleanupSet.size, 1);

    // Core._invalidateNotifyOperations() が切断時に旧世代のbarrierを破棄する動作を再現。
    oldCleanupSet.clear();
    delete mock._gaitNotifyCleanupPromises;
    const oldPendingSet = mock._gaitNotifyPendingSubscriptions;
    oldPendingSet.clear();
    delete mock._gaitNotifyPendingSubscriptions;

    const g2 = new Gait(mock);
    const currentStart = g2.start();
    await g2.stop();
    startGates[1].resolve();
    await waitFor(() => mock.calls.stopNotify >= 2, 'current generation cleanup to call stopNotify');
    const currentCleanupSet = mock._gaitNotifyCleanupPromises;
    assert.ok(currentCleanupSet instanceof Set);
    assert.notEqual(currentCleanupSet, oldCleanupSet);
    assert.equal(currentCleanupSet.size, 1);

    cleanupGates[0].resolve();
    assert.equal(await oldStart, false);
    await nextTurn();
    assert.equal(mock._gaitNotifyCleanupPromises, currentCleanupSet,
      '旧cleanupのfinallyは現世代のcleanup Setを削除しない');
    assert.equal(currentCleanupSet.size, 1);

    const g3 = new Gait(mock);
    let transitionError = null;
    g3.onError = (error) => { transitionError = error; };
    assert.equal(await g3.start(), false, '現世代のcleanup中は次ownerを開始しない');
    assert.equal(transitionError.code, 'GAIT_TRANSITION_PENDING');

    cleanupGates[1].resolve();
    assert.equal(await currentStart, false);
    assert.equal(await g3.start(), true, '現世代のcleanup完了後は次ownerを開始できる');
    await g3.stop();
  }

  // 購読準備中の同期例外でも start は false に収束し、owner/sink/hook を残さない
  {
    const mock = makeMockInsole();
    mock.setUUID = () => { throw new Error('setUUID failed'); };
    const gait = new Gait(mock);
    let reported = null;
    gait.onError = (error) => { reported = error; };
    assert.equal(await gait.start(), false);
    assert.match(reported.message, /setUUID failed/);
    assert.equal(gait.isRunning, false);
    assert.equal(mock._gaitNotifyOwner, undefined);
    assert.equal(mock._gaitNotifySink, undefined);
    assert.equal(mock._afterReconnectSuccess.length, 0);
  }

  // P1-3: 通常の重複startは冪等、物理切断→手動begin後の明示startは再購読する
  {
    const mock = makeMockInsole();
    const gait = new Gait(mock);
    assert.equal(await gait.start(), true);
    assert.equal(await gait.start(), true);
    assert.equal(mock.calls.startNotify, 1, '同じ接続中の重複 start は再購読しない');
    gait.rows.push({ step_number: 99 });

    mock.emitDisconnect();
    mock.emitReconnect();
    assert.equal(await gait.start(), true, '手動再接続後の明示 start は成功');
    assert.equal(mock.calls.startNotify, 2, '手動再接続後に STEP_ANALYSIS を再購読');
    assert.equal(mock.notifying, true);
    assert.equal(gait.rows.length, 1, '再接続では収集中の rows を維持');
    await gait.stop();
  }

  // P1-3: 自動再接続の再購読中にstopしても、遅延完了したnotifyを残さない
  {
    const mock = makeMockInsole();
    const reconnectGate = deferred();
    mock.startNotify = async function (uuid) {
      this.calls.startNotify++;
      if (this.calls.startNotify === 1) {
        this._characteristics[uuid] = {};
        this.notifying = true;
        return;
      }
      await reconnectGate.promise;
      this._characteristics[uuid] = {};
      this.notifying = true;
    };
    const gait = new Gait(mock);
    assert.equal(await gait.start(), true);
    mock.emitDisconnect();
    mock.emitReconnect();
    for (const hook of mock._afterReconnectSuccess.slice()) hook();
    await nextTurn();
    assert.equal(mock.calls.startNotify, 2, '再接続の startNotify が開始済み');

    const stopPromise = gait.stop();
    const outcome = await Promise.race([
      stopPromise.then(() => 'stopped'),
      nextTurn().then(() => 'still-pending'),
    ]);
    assert.equal(outcome, 'stopped', '再購読中でも stop は完了');
    assert.equal(gait.isRunning, false);
    assert.equal(mock._gaitNotifySink, undefined);

    reconnectGate.resolve();
    await nextTurn();
    await nextTurn();
    assert.equal(mock.notifying, false, '遅延した再購読を補償停止');
    assert.equal(mock.calls.stopNotify, 1);
  }

  // 1回目の再接続購読が未完了でも、さらに切断→再接続した現GATTの購読を開始する
  {
    const mock = makeMockInsole();
    const staleReconnectGate = deferred();
    let session = 0;
    let notifyToken = 0;
    mock.activeSession = null;
    mock.startNotify = async function (uuid) {
      const token = ++notifyToken;
      const capturedSession = session;
      this.calls.startNotify++;
      if (this.calls.startNotify === 2) await staleReconnectGate.promise;
      // Coreのnotify operation tokenと同じく、古い完了は現listenerを上書きしない。
      if (token === notifyToken) {
        this._characteristics[uuid] = { session: capturedSession };
        this.activeSession = capturedSession;
        this.notifying = true;
      }
    };
    mock.stopNotify = async function () {
      ++notifyToken;
      this.calls.stopNotify++;
      this.notifying = false;
    };
    const gait = new Gait(mock);
    assert.equal(await gait.start(), true);

    mock.emitDisconnect();
    session = 1;
    mock.emitReconnect();
    for (const hook of mock._afterReconnectSuccess.slice()) hook();
    await nextTurn();
    assert.equal(mock.calls.startNotify, 2, '再接続1の購読はpending');

    mock.emitDisconnect();
    session = 2;
    mock.emitReconnect();
    for (const hook of mock._afterReconnectSuccess.slice()) hook();
    await nextTurn();
    await nextTurn();
    assert.equal(mock.calls.startNotify, 3, '古いpendingを待たず再接続2を購読');
    assert.equal(mock.activeSession, 2);
    assert.equal(gait._subscribed, true);

    staleReconnectGate.resolve();
    await nextTurn();
    await nextTurn();
    assert.equal(mock.activeSession, 2, '古い再接続1の完了を現GATTとして受理しない');
    assert.equal(gait._subscribed, true);
    await gait.stop();
  }

  // P1-3: GATT 再接続後に STEP_ANALYSIS を1回だけ再購読し、同一 step の二重出力が無い
  {
    const mock = makeMockInsole();
    const gait = new Gait(mock);
    const emitted = [];
    gait.onGait = (id, row) => emitted.push(row.step_number);

    assert.equal(await gait.start(), true);
    assert.equal(mock.calls.startNotify, 1, '初回 startNotify=1');
    assert.equal(mock._afterReconnectSuccess.length, 1, '再接続フックが1つ登録');

    // 切断前に step 300 を完成（sink 経由）
    const sink = mock._gaitNotifySink;
    completeStepViaSink(sink);
    assert.deepEqual(emitted, [300], '切断前に step300 emit');

    // 切断→再接続（Core が _afterReconnectSuccess を発火）
    mock.emitDisconnect();
    mock.emitReconnect();
    for (const hook of mock._afterReconnectSuccess.slice()) hook();
    await new Promise((r) => setTimeout(r, 0)); // _subscribe の await を消化

    assert.equal(mock.calls.startNotify, 2, '再接続後に STEP_ANALYSIS を正確に1回だけ再購読');
    assert.ok(mock._gaitNotifySink, '再購読後も sink 有効');

    // 同じ reconnect success が重複しても、購読済みなら listener を増やさない
    for (const hook of mock._afterReconnectSuccess.slice()) hook();
    await nextTurn();
    assert.equal(mock.calls.startNotify, 2, 'settle後の重複再接続フックは冪等');

    // 再購読後、切断前と同じ step 300 を再送しても二重出力しない（集約状態は維持）
    completeStepViaSink(mock._gaitNotifySink);
    assert.deepEqual(emitted, [300], '再接続後の同一 step 再送は dedup（二重出力なし）');

    await gait.stop();
    assert.equal(mock._afterReconnectSuccess.length, 0, 'stop で再接続フック解除');
    assert.equal(mock._gaitNotifySink, undefined, 'stop で sink 削除');
    assert.equal(gait.isRunning, false);
  }

  console.log('insole-gait.test.js passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// step 300 の overview/stride/pronation 3種を sink(DataView) 経由で流し込む
function completeStepViaSink(sink) {
  sink(pkt(0, 300, (dv) => { dv.setUint8(4, 0x48); f32(dv, 12, 0.6); f32(dv, 16, 0.5); }));
  sink(pkt(1, 300, (dv) => { f32(dv, 8, 1); f32(dv, 12, 0.2); f32(dv, 16, 0.1); }));
  sink(pkt(2, 300, (dv) => { f32(dv, 8, -12); f32(dv, 12, -9); }));
}
