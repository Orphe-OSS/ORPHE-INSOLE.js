const assert = require('node:assert/strict');
const {
  Orphe,
  OrpheInsole,
  parseInsoleSensorValues,
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
    near(parsed.samples[0].converted_gyro.x, (3277 / 32768) * 2000, 'mode 56 converted gyro');
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
    const calls = { quat: [], acc: [], gyro: [], press: [] };
    insole.gotQuat = value => calls.quat.push(value);
    insole.gotAcc = value => calls.acc.push(value);
    insole.gotGyro = value => calls.gyro.push(value);
    insole.gotPress = value => calls.press.push(value);
    insole.onRead(data, 'SENSOR_VALUES');

    assert.equal(calls.quat.length, 2);
    assert.equal(calls.acc.length, 2);
    assert.equal(calls.gyro.length, 2);
    assert.equal(calls.press.length, 2);
    assert.deepEqual(calls.press[0].values, [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(calls.press[1].values, [7, 8, 9, 10, 11, 12]);
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
