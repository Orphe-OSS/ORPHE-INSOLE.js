const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { OrpheInsoleSimulator } = require('../src/InsoleSimulator.js');
const { DeviceAccumulator } = require('../examples/quaternion-validation/metrics.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'examples/quaternion-validation/index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'examples/quaternion-validation/app.js'), 'utf8');

{
  const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), match => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'HTML ids must be unique');
  const referencedIds = Array.from(app.matchAll(/\$\('([^']+)'\)/g), match => match[1]);
  referencedIds.forEach(id => assert.ok(ids.includes(id), `app.js references missing #${id}`));
  [0, 1].forEach(deviceId => {
    ['connectCard', 'connectTitle', 'connectDetail', 'connect'].forEach(prefix => {
      assert.ok(ids.includes(`${prefix}${deviceId}`), `missing dynamic #${prefix}${deviceId}`);
    });
  });
  assert.match(html, /src="\.\.\/\.\.\/src\/ORPHE-INSOLE\.js"/);
  assert.match(html, /src="\.\.\/\.\.\/src\/InsoleSimulator\.js"/);
  assert.match(html, /src="\.\/metrics\.js"/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.match(html, /id="receivePath"/);
  assert.match(html, /id="biasEnabled"/);
  assert.match(html, /id="biasGyroThreshold"/);
  assert.match(html, /id="biasAccTolerance"/);
  assert.match(html, /id="biasDwellSeconds"/);
  assert.match(html, /id="biasTimeConstantSeconds"/);
  assert.match(html, /id="resetBias"/);
  assert.match(html, /id="biasMetrics"/);
  assert.match(html, /value="raw" selected/);
  assert.match(app, /OrpheInsole\.parseSensorValues\(data, sensorRangesFor\(deviceId\)\)/);
  assert.match(app, /GYROSCOPE_RANGES/);
  assert.match(app, /pending\[deviceId\]\.acc = copyVector\(acc\)/);
  assert.match(app, /pending\[deviceId\]\.gyro = copyVector\(gyro\)/);
  assert.match(app, /copyEuler\(quaternionToEuler\(quat\)\)/);
  assert.doesNotMatch(app, /window\.Quaternion/);
  assert.doesNotMatch(app, /BLE rate=/);
  assert.match(app, /gyro_referenced_yaw_deg/);
  assert.match(app, /gyro_referenced_yaw_device_time_deg/);
  assert.match(app, /yaw_bias_corrected_deg/);
  assert.match(app, /observed_yaw_bias_corrected_deg/);
  assert.match(app, /adaptiveYawBias/);
  assert.match(app, /gyro投影補正/);
  assert.match(app, /yaw実測補正/);
  assert.match(app, /const signedGyroObservedDeg = snapshot\.gyroZDeviceTimeIntegralDeg/);
  assert.match(app, /gyro_z\(body\/device time\)/);
  assert.match(app, /connection coverage=/);
  assert.match(app, /5-minute drift windows/);
  assert.match(app, /first-window fixed calibration validation/);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function exerciseSimulatorPipeline() {
  const simulators = [new OrpheInsoleSimulator(0), new OrpheInsoleSimulator(1)];
  let accumulators = simulators.map((_, id) => new DeviceAccumulator(id, performance.now(), 4));
  const pending = [{}, {}];

  function install(simulator, id) {
    simulator.setup();
    simulator.gotQuat = quat => {
      pending[id].serial = quat.serial_number;
      pending[id].packetNumber = quat.packet_number;
      pending[id].quat = quat;
    };
    simulator.gotEuler = euler => { pending[id].euler = euler; };
    simulator.gotConvertedAcc = acc => { pending[id].acc = acc; };
    simulator.gotConvertedGyro = gyro => { pending[id].gyro = gyro; };
    simulator.gotPress = press => {
      pending[id].serial = press.serial_number;
      pending[id].packetNumber = press.packet_number;
      pending[id].press = press.values;
      accumulators[id].addFrame({
        mode: simulator.streaming_mode,
        serial: pending[id].serial,
        packetNumber: pending[id].packetNumber,
        press: pending[id].press,
        acc: pending[id].acc,
        gyro: pending[id].gyro,
        quat: pending[id].quat,
        euler: pending[id].euler,
      }, performance.now());
      pending[id] = {};
    };
  }

  simulators.forEach(install);
  await Promise.all(simulators.map(simulator => simulator.begin('SENSOR_VALUES', { streamingMode: 4, preset: 'stand' })));
  await wait(140);

  const mode4 = accumulators.map(accumulator => accumulator.snapshot(performance.now()));
  mode4.forEach(snapshot => {
    assert.ok(snapshot.samples >= 8, `mode4 device ${snapshot.deviceId} should receive samples`);
    assert.ok(snapshot.norm.count >= 8, `mode4 device ${snapshot.deviceId} should receive quaternion`);
    assert.ok(Math.abs(snapshot.norm.mean - 1) < 1e-9, `mode4 device ${snapshot.deviceId} norm`);
    assert.ok(snapshot.packetRateHz > 0, `mode4 device ${snapshot.deviceId} should report packet rate`);
    assert.ok(snapshot.gyroZ.count >= 8, `mode4 device ${snapshot.deviceId} should report gyro statistics`);
    assert.equal(snapshot.lostPackets, 0, `mode4 device ${snapshot.deviceId} simulator should not lose packets`);
  });

  await Promise.all(simulators.map(simulator => simulator.setDataStreamingMode(3)));
  accumulators = simulators.map((_, id) => new DeviceAccumulator(id, performance.now(), 3));
  pending[0] = {};
  pending[1] = {};
  await wait(140);

  const mode3 = accumulators.map(accumulator => accumulator.snapshot(performance.now()));
  mode3.forEach(snapshot => {
    assert.ok(snapshot.samples >= 16, `mode3 device ${snapshot.deviceId} should receive 200Hz samples`);
    assert.equal(snapshot.presence.quat, 0, `mode3 device ${snapshot.deviceId} quaternion must stop`);
    assert.equal(snapshot.presence.euler, 0, `mode3 device ${snapshot.deviceId} Euler must stop`);
    assert.ok(snapshot.presence.press > 0 && snapshot.presence.acc > 0 && snapshot.presence.gyro > 0);
  });

  await Promise.all(simulators.map(simulator => simulator.setDataStreamingMode(4)));
  simulators.forEach(simulator => simulator.reset());
}

exerciseSimulatorPipeline()
  .then(() => console.log('quaternion-validation-page.test.js passed'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
