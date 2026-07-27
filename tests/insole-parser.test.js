const assert = require('node:assert/strict');
const {
  Orphe,
  OrpheInsole,
  parseInsoleSensorValues,
  ORPHE_INSOLE_STREAMING_MODES,
} = require('../src/ORPHE-INSOLE.js');

function createPacket(header, serial = 0x0102) {
  const data = new DataView(new ArrayBuffer(104));
  data.setUint8(0, header);
  data.setUint16(1, serial);
  data.setUint8(3, 1);
  data.setUint8(4, 2);
  data.setUint8(5, 3);
  data.setUint16(6, 450);
  return data;
}

function setQuat(data, offset, values) {
  values.forEach((value, index) => data.setInt16(offset + index * 2, value));
}

function setVec3(data, offset, values) {
  values.forEach((value, index) => data.setInt16(offset + index * 2, value));
}

function setPress(data, offset, values) {
  values.forEach((value, index) => data.setUint16(offset + index * 2, value));
}

function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, got ${actual}`);
}

function quatNorm(quat) {
  return Math.hypot(quat.w, quat.x, quat.y, quat.z);
}

async function main() {
  assert.equal(OrpheInsole, Orphe);
  assert.equal(typeof Orphe.parseSensorValues, 'function');
  assert.equal(OrpheInsole.getStreamingModeInfo(4), ORPHE_INSOLE_STREAMING_MODES[4]);
  assert.equal(OrpheInsole.getStreamingModeInfo(2), null);
  assert.equal(OrpheInsole.STREAMING_MODES[3].fields.press, true);

  {
    const data = createPacket(56);
    setQuat(data, 8 + 32, [11585, 0, 0, 11585]);
    setVec3(data, 16 + 32, [3277, -3277, 8192]);
    setVec3(data, 22 + 32, [16384, -8192, 4096]);
    setPress(data, 28 + 32, [101, 102, 103, 104, 105, 106]);
    setQuat(data, 8, [16384, 8192, 4096, 2048]);
    setVec3(data, 16, [1000, 2000, 3000]);
    setVec3(data, 22, [4000, 5000, 6000]);
    setPress(data, 28, [201, 202, 203, 204, 205, 206]);

    const parsed = parseInsoleSensorValues(data);
    assert.equal(parsed.header, 56);
    assert.equal(parsed.serial_number, 0x0102);
    assert.equal(parsed.samples.length, 2);
    assert.equal(parsed.samples[0].packet_number, 0);
    assert.equal(parsed.samples[1].packet_number, 1);
    assert.deepEqual(parsed.samples[0].press.values, [101, 102, 103, 104, 105, 106]);
    assert.deepEqual(parsed.samples[1].press.values, [201, 202, 203, 204, 205, 206]);
    assert.ok(Math.abs(quatNorm(parsed.samples[0].quat) - 1) < 1e-4, 'mode 56 Q14 quat norm');
    near(parsed.samples[0].quat.w, 11585 / 16384, 'mode 56 Q14 quat w');
    near(parsed.samples[0].acc.x, 16384 / 32768, 'mode 56 acc');
    near(parsed.samples[0].converted_acc.x, (16384 / 32768) * 16, 'mode 56 converted acc');
    near(parsed.samples[0].gyro.x, 3277 / 32768, 'mode 56 gyro');
    // 物理値は raw int16 × センサー感度（±2000 dps → 0.07 dps/LSB）。
    // 正規化値 × range（= 0.061035 dps/LSB）ではない。
    near(parsed.samples[0].converted_gyro.x, 3277 * 0.07, 'mode 56 converted gyro');
    near(parsed.samples[0].converted_gyro.y, -3277 * 0.07, 'mode 56 converted gyro negative');
    near(parsed.samples[0].converted_gyro.z, 8192 * 0.07, 'mode 56 converted gyro z');
  }

  {
    // レンジを明示指定した場合はそのレンジの感度が使われる（±500 dps → 0.0175 dps/LSB）
    const data = createPacket(56);
    setVec3(data, 16 + 32, [1000, -1000, 2000]);
    const parsed = parseInsoleSensorValues(data, { gyroRange: 500 });
    near(parsed.samples[0].converted_gyro.x, 1000 * 0.0175, '500 dps converted gyro');
    near(parsed.samples[0].converted_gyro.y, -1000 * 0.0175, '500 dps converted gyro negative');
    near(parsed.samples[0].gyro.x, 1000 / 32768, '500 dps normalized gyro is unchanged');
  }

  {
    const data = createPacket(55, 0x0010);
    const offset = 24;
    setVec3(data, 8 + offset * 3, [100, 200, 300]);
    setVec3(data, 14 + offset * 3, [400, 500, 600]);
    setPress(data, 20 + offset * 3, [1, 2, 3, 4, 5, 6]);

    const parsed = parseInsoleSensorValues(data);
    assert.equal(parsed.header, 55);
    assert.equal(parsed.samples.length, 4);
    assert.equal(parsed.samples[0].packet_number, 0);
    assert.equal(parsed.samples[0].quat, undefined);
    assert.deepEqual(parsed.samples[0].press.values, [1, 2, 3, 4, 5, 6]);
  }

  {
    // header 54 (0x36) は FIFO データパケット。byte 配置は header 55 と同一。
    const data = createPacket(54, 0x0010);
    const offset = 24;
    setVec3(data, 8 + offset * 3, [100, 200, 300]);
    setVec3(data, 14 + offset * 3, [400, 500, 600]);
    setPress(data, 20 + offset * 3, [7, 8, 9, 10, 11, 12]);

    const parsed = parseInsoleSensorValues(data);
    assert.equal(parsed.header, 54);
    assert.equal(parsed.samples.length, 4);
    assert.equal(parsed.samples[0].quat, undefined);
    assert.deepEqual(parsed.samples[0].press.values, [7, 8, 9, 10, 11, 12]);
    assert.ok(parsed.samples[0].gyro && parsed.samples[0].acc);
  }

  {
    const data = createPacket(50);
    data.setUint8(70, 5);
    data.setUint8(49, 7);
    data.setUint8(28, 11);
    setQuat(data, 8 + 21 * 3, [16384, 0, 0, 0]);
    setVec3(data, 16 + 21 * 3, [100, 200, 300]);
    setVec3(data, 22 + 21 * 3, [400, 500, 600]);

    const parsed = parseInsoleSensorValues(data);
    assert.equal(parsed.header, 50);
    assert.equal(parsed.samples.length, 4);
    assert.equal(parsed.samples[0].packet_number, 0);
    assert.equal(parsed.samples[1].timestamp - parsed.samples[0].timestamp, 5);
    assert.equal(parsed.samples[2].timestamp - parsed.samples[1].timestamp, 7);
    assert.equal(parsed.samples[3].timestamp - parsed.samples[2].timestamp, 11);
    assert.equal(parsed.samples[0].press, undefined);
    assert.ok(Math.abs(quatNorm(parsed.samples[0].quat) - 1) < 1e-4, 'mode 50 Q14 quat norm');
    near(parsed.samples[0].quat.w, 1, 'mode 50 Q14 quat w');
  }

  {
    const parsed = parseInsoleSensorValues(new DataView(new ArrayBuffer(8)));
    assert.equal(parsed, null);
  }

  {
    const insole = new Orphe(0);
    let streamingMode = null;
    insole.getDeviceInformation = async () => ({});
    insole.setDataStreamingMode = async (mode) => { streamingMode = mode; };
    insole.syncCoreTime = async () => ({});
    insole.startNotify = async () => {};

    const result = await insole.begin({ streamingMode: 3 });
    assert.equal(streamingMode, 3);
    assert.equal(result, 'done begin(); SENSOR VALUES');
  }

  {
    const data = createPacket(56, 1);
    setQuat(data, 8 + 32, [16384, 0, 0, 0]);
    setVec3(data, 16 + 32, [100, 200, 300]);
    setVec3(data, 22 + 32, [400, 500, 600]);
    setPress(data, 28 + 32, [1, 2, 3, 4, 5, 6]);
    setQuat(data, 8, [16384, 0, 0, 0]);
    setVec3(data, 16, [700, 800, 900]);
    setVec3(data, 22, [1000, 1100, 1200]);
    setPress(data, 28, [7, 8, 9, 10, 11, 12]);

    const insole = new Orphe(0);
    const calls = { quat: [], acc: [], gyro: [], press: [], convertedAcc: [], convertedGyro: [] };
    // DEVICE_INFORMATION の range は index（acc: 0 → ±2G / gyro: 1 → ±500dps）
    insole.device_information = { range: { acc: 0, gyro: 1 } };
    insole.gotQuat = value => calls.quat.push(value);
    insole.gotAcc = value => calls.acc.push(value);
    insole.gotGyro = value => calls.gyro.push(value);
    insole.gotPress = value => calls.press.push(value);
    insole.gotConvertedAcc = value => calls.convertedAcc.push(value);
    insole.gotConvertedGyro = value => calls.convertedGyro.push(value);
    insole.onRead(data, 'SENSOR_VALUES');

    assert.equal(calls.quat.length, 2);
    assert.equal(calls.acc.length, 2);
    assert.equal(calls.gyro.length, 2);
    assert.equal(calls.press.length, 2);
    assert.equal(calls.convertedAcc.length, 2);
    assert.equal(calls.convertedGyro.length, 2);
    assert.deepEqual(calls.press[0].values, [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(calls.press[1].values, [7, 8, 9, 10, 11, 12]);
    near(calls.acc[0].x, 400 / 32768, 'normalized acc is range independent');
    near(calls.convertedAcc[0].x, (400 / 32768) * 2, 'device acc range setting');
    near(calls.gyro[0].x, 100 / 32768, 'normalized gyro is range independent');
    near(calls.convertedGyro[0].x, 100 * 0.0175, 'device gyro range setting');
  }

  {
    // device_information 未取得（初期値は空文字）でも既定レンジで換算できること
    const data = createPacket(56, 3);
    setVec3(data, 16 + 32, [100, 0, 0]);
    setVec3(data, 22 + 32, [400, 0, 0]);

    const insole = new Orphe(0);
    const convertedGyro = [];
    const convertedAcc = [];
    insole.gotConvertedGyro = value => convertedGyro.push(value);
    insole.gotConvertedAcc = value => convertedAcc.push(value);
    insole.onRead(data, 'SENSOR_VALUES');
    assert.equal(insole.device_information, '', 'device_information is unset before read');
    near(convertedGyro[0].x, 100 * 0.07, 'default gyro range fallback');
    near(convertedAcc[0].x, (400 / 32768) * 16, 'default acc range fallback');
  }

  {
    // 不正なレンジ設定（範囲外・非整数・非数値）は既定へフォールバックする
    const data = createPacket(56, 5);
    setVec3(data, 16 + 32, [100, 0, 0]);

    for (const range of [{ acc: 9, gyro: 9 }, { acc: 1.5, gyro: 1.5 }, { acc: '1', gyro: '1' }, { acc: -1, gyro: -1 }]) {
      const insole = new Orphe(0);
      insole.device_information = { range };
      const convertedGyro = [];
      insole.gotConvertedGyro = value => convertedGyro.push(value);
      insole.onRead(data, 'SENSOR_VALUES');
      near(convertedGyro[0].x, 100 * 0.07, `invalid range fallback ${JSON.stringify(range)}`);
    }
  }

  {
    // addSensorDataListener 経由の packet もデバイスのレンジ設定を反映する
    const data = createPacket(56, 4);
    setVec3(data, 16 + 32, [100, 0, 0]);

    const insole = new Orphe(0);
    insole.device_information = { range: { acc: 0, gyro: 1 } };
    const events = [];
    insole.addSensorDataListener(event => events.push(event));
    insole.onRead(data, 'SENSOR_VALUES');
    assert.equal(events.length, 1);
    near(events[0].packet.samples[0].converted_gyro.x, 100 * 0.0175, 'listener packet uses device range');
  }

  {
    const data = createPacket(56, 44);
    const insole = new Orphe(1);
    const events = [];
    const gotData = [];
    const first = (event) => events.push(event);
    const unsubscribe = insole.addSensorDataListener(first);
    insole.gotData = (raw, uuid) => gotData.push({ raw, uuid });
    insole.onRead(data, 'SENSOR_VALUES');

    assert.equal(events.length, 1);
    assert.equal(events[0].deviceId, 1);
    assert.equal(events[0].packet.serial_number, 44);
    assert.equal(events[0].packet.samples.length, 2);
    assert.equal(gotData.length, 1, 'observer coexists with gotData override');
    assert.equal(unsubscribe(), true);
    insole.onRead(createPacket(56, 45), 'SENSOR_VALUES');
    assert.equal(events.length, 1, 'unsubscribe removes observer');
    assert.throws(
      () => insole.addSensorDataListener(null),
      /expects a function/
    );
  }

  {
    const data = createPacket(54, 100);
    const insole = new Orphe(0);
    const events = [];
    const sink = [];
    insole.addSensorDataListener((event) => events.push(event));
    insole._fifoNotifySink = (raw) => sink.push(raw);
    insole.onRead(data, 'SENSOR_VALUES');
    assert.equal(sink.length, 1);
    assert.equal(events.length, 0, 'FIFO protocol responses are not emitted as realtime data');
  }

  {
    const data = createPacket(56, 2);
    setQuat(data, 8 + 32, [8192, 0, 0, 8192]);
    setQuat(data, 8, [8192, 0, 0, 8192]);

    const eulerInputNorms = [];
    const previousQuaternion = global.Quaternion;
    global.Quaternion = class TestQuaternion {
      constructor(w, x, y, z) {
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
        eulerInputNorms.push(Math.hypot(this.w, this.x, this.y, this.z));
      }

      toEuler() {
        return { pitch: 0, roll: 0, yaw: 0 };
      }
    };

    try {
      const insole = new Orphe(0);
      const eulerCalls = [];
      insole.gotEuler = value => eulerCalls.push(value);
      insole.onRead(data, 'SENSOR_VALUES');

      assert.equal(eulerCalls.length, 2);
      assert.equal(eulerInputNorms.length, 2);
      for (const norm of eulerInputNorms) {
        assert.ok(Math.abs(norm - 1) < 1e-12, `Euler input quaternion must be normalized, got ${norm}`);
      }
    } finally {
      if (previousQuaternion === undefined) delete global.Quaternion;
      else global.Quaternion = previousQuaternion;
    }
  }

  {
    const first = createPacket(55, 10);
    const second = createPacket(55, 12);
    const insole = new Orphe(0);
    const lost = [];
    insole.lostData = (current, previous) => lost.push({ current, previous });
    insole.onRead(first, 'SENSOR_VALUES');
    insole.onRead(second, 'SENSOR_VALUES');
    assert.deepEqual(lost, [{ current: 12, previous: 10 }]);
  }

  {
    const insole = new Orphe(0);
    let written = null;
    insole.write = async (uuid, data) => {
      written = { uuid, data: Array.from(data) };
    };
    await insole.setDataStreamingMode('4');
    assert.deepEqual(written, { uuid: 'DEVICE_INFORMATION', data: [0x0D, 4] });
    await assert.rejects(() => insole.setDataStreamingMode(2), /Invalid ORPHE INSOLE data streaming mode/);
  }

  {
    const insole = new Orphe(0);
    assert.doesNotThrow(() => insole.setup(['SENSOR_VALUES']));
    assert.equal(insole.interpolation.enabled, false);
    assert.equal(insole.interpolation.max_consecutive_missing, 1);
    assert.equal(insole.history_sensor_values.press.size, 1);

    assert.doesNotThrow(() => insole.setup(['SENSOR_VALUES'], {}));
    assert.equal(insole.interpolation.enabled, false);
    assert.equal(insole.interpolation.max_consecutive_missing, 1);

    assert.doesNotThrow(() => insole.setup(['SENSOR_VALUES'], { interpolation: { enabled: true } }));
    assert.equal(insole.interpolation.enabled, true);
    assert.equal(insole.interpolation.max_consecutive_missing, 1);
  }

  {
    const insole = new Orphe(0);
    const lost = [];
    insole.lostData = (current, previous) => lost.push({ current, previous });
    for (const serial of [65534, 65535, 0, 1]) {
      insole.onRead(createPacket(56, serial), 'SENSOR_VALUES');
    }
    assert.deepEqual(lost, []);
  }

  {
    const insole = new Orphe(0);
    const lost = [];
    insole.onClear = () => {};
    insole.lostData = (current, previous) => lost.push({ current, previous });
    for (const serial of [65534, 65535, 1]) {
      insole.onRead(createPacket(56, serial), 'SENSOR_VALUES');
    }
    assert.deepEqual(lost, [{ current: 1, previous: 65535 }]);

    insole.clear();
    insole.onRead(createPacket(56, 200), 'SENSOR_VALUES');
    assert.deepEqual(lost, [{ current: 1, previous: 65535 }]);
  }

  {
    const insole = new Orphe(0);
    const lost = [];
    insole.gotData = () => {};
    insole.lostData = (current, previous) => lost.push({ current, previous });
    for (const serial of [65534, 65535, 0, 1]) {
      insole.onRead(createPacket(56, serial), 'SENSOR_VALUES');
    }
    assert.deepEqual(lost, []);

    insole.onRead(createPacket(56, 3), 'SENSOR_VALUES');
    assert.deepEqual(lost, [{ current: 3, previous: 1 }]);
  }
}

main().then(() => {
  console.log('insole-parser.test.js passed');
}).catch(error => {
  console.error(error);
  process.exit(1);
});
