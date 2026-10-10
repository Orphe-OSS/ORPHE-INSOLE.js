// 校正通知の取得と換算を、BLE実機なしで検証する。
const assert = require('node:assert/strict');
const { OrpheInsole } = require('../src/ORPHE-INSOLE.js');
const { waitFor } = require('./async-test-utils');

function notification(index, func = 1, coeffs = [0, 0, 0, 2, index + 1], length = 43) {
  // byteOffsetが0でないDataViewも実際のBLE応答と同じように処理する。
  const data = new DataView(new ArrayBuffer(length + 7), 7, length);
  data.setUint8(0, 0x39);
  if (length >= 43) {
    data.setUint8(1, index);
    data.setUint8(2, func);
    coeffs.forEach((value, i) => data.setFloat64(3 + i * 8, value, false));
  }
  return data;
}

function mock(write) {
  const insole = new OrpheInsole();
  const handlers = new Set();
  const sent = [];
  const sensor = {
    addEventListener(_, handler) { handlers.add(handler); },
    removeEventListener(_, handler) { handlers.delete(handler); },
  };
  const emit = data => {
    insole.onRead(data, 'SENSOR_VALUES');
    for (const handler of [...handlers]) handler({ target: { value: data } });
  };
  const info = { async writeValue(bytes) {
    sent.push([...bytes]);
    if (write) await write(bytes[2], emit, insole);
    else emit(notification(bytes[2]));
  } };
  insole.bluetoothDevice = { gatt: { connected: true } };
  insole._characteristics.DEVICE_INFORMATION = info;
  insole._notifyCharacteristics.SENSOR_VALUES = sensor;
  const errors = [];
  insole.onError = error => errors.push(error);
  return { insole, emit, handlers, sent, errors };
}

function packet(header, values) {
  const data = new DataView(new ArrayBuffer(104));
  data.setUint8(0, header);
  data.setUint16(1, 42);
  for (let sample = 0; sample < (header === 55 ? 4 : 2); sample++) {
    const offset = header === 55 ? 20 + 24 * sample : 28 + 32 * sample;
    values.forEach((value, i) => data.setUint16(offset + 2 * i, value));
  }
  return data;
}

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
}

async function main() {
  const plain = new OrpheInsole();
  assert.equal(plain.pressure_calibration, null);
  assert.equal(await plain.getPressureCalibration(), null);

  {
    const { insole, handlers, sent, errors } = mock();
    const promise = insole.getPressureCalibration();
    assert.equal(promise, insole.getPressureCalibration(), '同時呼出しは同じPromise');
    const rows = await promise;
    assert.equal(rows, insole.pressure_calibration);
    assert.deepEqual(rows.map(row => row.sensor_index), [0, 1, 2, 3, 4, 5]);
    assert.deepEqual(rows[5].coeffs, [0, 0, 0, 2, 6]);
    assert.deepEqual(sent, Array.from({ length: 6 }, (_, i) => [0x10, 0, i]));
    assert.equal(handlers.size, 0);
    assert.deepEqual(errors, []);
    assert.equal(insole._serialInitialized, false);
    await insole.getPressureCalibration();
    assert.equal(sent.length, 12, '手動再取得は新しい要求を送る');
  }

  // 正常な圧力通知と校正通知を混在させ、サンプル情報と生値の互換性を確認。
  for (const header of [55, 56]) {
    const { insole } = mock();
    await insole.getPressureCalibration();
    let raw, converted;
    insole.gotPress = value => { raw = value; };
    insole.gotConvertedPress = value => { converted = value; };
    insole.onRead(packet(header, [10, 20, 30, 40, 50, 60]), 'SENSOR_VALUES');
    assert.deepEqual(raw.values, [10, 20, 30, 40, 50, 60]);
    assert.deepEqual(converted.values, [21, 42, 63, 84, 105, 126]);
    assert.equal(converted.timestamp, raw.timestamp);
    assert.equal(converted.serial_number, raw.serial_number);
    assert.equal(converted.packet_number, raw.packet_number);
    assert.equal(insole.converted_press, converted);
  }

  {
    const { insole } = mock((index, emit) => emit(notification(index, 0, [2, 0.01, 3, 0, 0])));
    await insole.getPressureCalibration();
    insole.onRead(packet(56, [100, 100, 100, 100, 100, 100]), 'SENSOR_VALUES');
    close(insole.converted_press.values[0], 2 * Math.E + 3);
  }

  // Pythonの既定式から算出した独立した期待値（x=1000）。
  const expectedDefault = [16.988, 23.65547, 19.3915, 23.20491, 21.28924, 23.10566];
  plain.onRead(packet(56, [1000, 1000, 1000, 1000, 1000, 1000]), 'SENSOR_VALUES');
  plain.converted_press.values.forEach((value, i) => close(value, expectedDefault[i]));

  for (const invalid of [
    notification(0, 1, [0, 0, 0, 0, 0], 42),
    notification(6), notification(0, 2), notification(0, 1, [NaN, 0, 0, 0, 0]),
    notification(0, 1, [Infinity, 0, 0, 0, 0]),
  ]) {
    const { insole, errors, handlers } = mock((_, emit) => emit(invalid));
    assert.equal(await insole.getPressureCalibration({ timeoutMs: 30 }), null);
    assert.equal(insole.pressure_calibration, null);
    assert.deepEqual(errors, []);
    assert.equal(handlers.size, 0);
  }

  for (const write of [
    () => {}, // 未対応・応答なし
    () => { throw new Error('write failed'); },
    () => new Promise(() => {}), // 書き込みが完了しなくても全体期限で終了
    (index, emit) => { if (index < 3) emit(notification(index)); }, // 部分取得
  ]) {
    const { insole, errors, handlers, emit } = mock(write);
    assert.equal(await insole.getPressureCalibration({ timeoutMs: 20 }), null);
    emit(notification(5));
    assert.equal(insole.pressure_calibration, null);
    assert.equal(handlers.size, 0);
    assert.deepEqual(errors, []);
  }

  {
    const { insole } = mock((index, emit) => {
      emit(notification(5)); // 順序外
      if (index) emit(notification(index - 1)); // 完了済みchの重複
      emit(notification(index));
    });
    assert.equal((await insole.getPressureCalibration()).length, 6);
  }

  {
    const { insole, errors } = mock();
    let count = 0;
    insole.gotData = () => { count++; };
    insole.gotBLEFrequency = () => { throw new Error('校正通知をHzに数えない'); };
    assert.equal((await insole.getPressureCalibration()).length, 6);
    assert.equal(count, 6, 'gotDataを上書きしても取得は成立');
    assert.deepEqual(errors, []);
  }

  {
    const a = mock();
    const b = mock((index, emit) => emit(notification(index, 1, [0, 0, 0, 3, 0])));
    await Promise.all([a.insole.getPressureCalibration(), b.insole.getPressureCalibration()]);
    assert.equal(a.insole.pressure_calibration[0].coeffs[3], 2);
    assert.equal(b.insole.pressure_calibration[0].coeffs[3], 3);
    a.insole.clear();
    assert.equal(a.insole.pressure_calibration, null);
    assert.notEqual(b.insole.pressure_calibration, null);
  }

  {
    const { insole, emit, handlers, sent } = mock(() => {});
    const pending = insole.getPressureCalibration();
    await waitFor(() => sent.length === 1, '取得要求');
    const oldHandler = [...handlers][0];
    insole._onDisconnectHandler({});
    assert.equal(await pending, null);
    assert.equal(handlers.size, 0);
    emit(notification(0));
    oldHandler({ target: { value: notification(0) } });
    assert.equal(insole.pressure_calibration, null);
  }

  // 実際のstartNotify経路で、beginが6ch取得を待ち、通常リスナーを維持する。
  {
    let finishLast;
    const { insole, handlers, sent, errors } = mock((index, emit) => {
      emit(packet(56, [1000, 1000, 1000, 1000, 1000, 1000]));
      if (index === 5) finishLast = () => emit(notification(index));
      else emit(notification(index));
    });
    const sensor = insole._notifyCharacteristics.SENSOR_VALUES;
    sensor.startNotifications = async () => sensor;
    insole._characteristics.SENSOR_VALUES = sensor;
    insole.scan = async () => {};
    insole.getDeviceInformation = async () => {};
    insole.setDataStreamingMode = async () => {};
    insole.syncCoreTime = async () => {};
    insole._rememberBluetoothDevice = () => {};
    insole._attachAutoReconnectDisconnectHandler = () => {};
    let finished = false;
    const begin = insole.begin().then(() => { finished = true; });
    await waitFor(() => sent.length === 6, '6ch要求');
    assert.equal(finished, false);
    assert.equal(insole.pressure_calibration, null, '部分取得を公開しない');
    insole.converted_press.values.forEach((value, i) => close(value, expectedDefault[i]));
    finishLast();
    await begin;
    assert.equal(insole.pressure_calibration.length, 6);
    assert.equal(handlers.size, 1, '校正取得リスナーのみを解除');
    assert.deepEqual(errors, []);
    const old = insole.pressure_calibration;
    // 再接続時の新しい取得もbegin完了までに保持する。
    insole._onDisconnectHandler({});
    const next = insole.begin();
    await waitFor(() => sent.length === 12, '再接続で再取得');
    finishLast();
    await next;
    assert.notEqual(insole.pressure_calibration, old);
    assert.equal(handlers.size, 1);
  }

  // beginは校正通信の失敗でも成功する。
  {
    const { insole, errors } = mock(() => { throw new Error('unsupported'); });
    insole.getDeviceInformation = async () => {};
    insole.setDataStreamingMode = async () => {};
    insole.syncCoreTime = async () => {};
    insole.startNotify = async () => {};
    insole._rememberBluetoothDevice = () => {};
    insole._attachAutoReconnectDisconnectHandler = () => {};
    assert.equal(await insole.begin(), 'done begin(); SENSOR VALUES');
    assert.equal(insole.pressure_calibration, null);
    assert.deepEqual(errors, []);
  }

  {
    const { insole } = mock();
    const calls = [];
    insole.getDeviceInformation = async () => { calls.push('info'); };
    insole.setDataStreamingMode = async mode => { calls.push(mode); };
    insole.syncCoreTime = async () => {};
    insole.startNotify = async () => { calls.push('notify'); };
    insole._rememberBluetoothDevice = () => {};
    insole._attachAutoReconnectDisconnectHandler = () => {};
    for (const mode of [1, 3, 4]) {
      assert.equal(await insole.begin({ streamingMode: mode }), 'done begin(); SENSOR VALUES');
      assert.equal(insole.pressure_calibration.length, 6);
      assert.deepEqual(calls.splice(0), ['info', mode, 'notify']);
    }
  }

  {
    const { insole } = mock((index, emit) => emit(notification(index, 0, [1, 100, 0, 0, 0])));
    await insole.getPressureCalibration();
    insole.onRead(packet(56, [1000, 1000, 1000, 1000, 1000, 1000]), 'SENSOR_VALUES');
    insole.converted_press.values.forEach((value, i) => close(value, expectedDefault[i]));
    insole.pressure_calibration = Array.from({ length: 6 }, (_, sensor_index) => ({ sensor_index, func: 1, coeffs: [0, 0, 0, 0, -1] }));
    insole.onRead(packet(56, [0, 0, 0, 0, 0, 0]), 'SENSOR_VALUES');
    assert.deepEqual(insole.converted_press.values, [0, 0, 0, 0, 0, 0]);
  }
  console.log('insole-pressure-calibration: all tests passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
