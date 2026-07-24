const assert = require('node:assert/strict');

class BootstrapInsole {
  constructor(id = 0) {
    this.id = id;
    this._afterReconnectSuccess = [];
  }
}
global.OrpheInsole = BootstrapInsole;

const {
  InsoleToolkitSession,
  INSOLE_TOOLKIT_PROFILES,
  resolveInsoleToolkitProfile,
  normalizeInsoleToolkitConfiguration,
  normalizeInsoleToolkitOutputs,
  normalizeInsoleSensorDataMode,
  insoleToolkitMeasurementToCSV,
} = require('../src/InsoleToolkit.js');

class FakeInsole {
  constructor(id = 0) {
    this.id = id;
    this.connected = false;
    this.streaming_mode = 4;
    this.calls = [];
    this._afterReconnectSuccess = [];
    this.sensorDataListeners = new Set();
  }

  async begin(type, options) {
    this.calls.push(`begin:${type}:${options.streamingMode}`);
    this.connected = true;
    this.streaming_mode = options.streamingMode;
    return 'connected';
  }

  reset() {
    this.calls.push('reset');
    this.connected = false;
  }

  isConnected() {
    return this.connected;
  }

  async setDataStreamingMode(mode) {
    this.calls.push(`mode:${mode}`);
    this.streaming_mode = mode;
  }

  async startNotify(type) {
    this.calls.push(`notify:start:${type}`);
  }

  async stopNotify(type) {
    this.calls.push(`notify:stop:${type}`);
  }

  addSensorDataListener(listener) {
    this.sensorDataListeners.add(listener);
    return () => this.sensorDataListeners.delete(listener);
  }

  emitPacket(serialNumber, samples) {
    const packet = { header: 50, serial_number: serialNumber, timestamp: 1000, samples };
    for (const listener of this.sensorDataListeners) {
      listener({ deviceId: this.id, receivedAt: Date.now(), packet, data: null });
    }
  }
}

class FakeFifo {
  constructor(insole, options = {}) {
    this.insole = insole;
    this.options = options;
    this.startResult = true;
    this.onStopped = null;
    this.checkpoint = { captureId: 1, serial: 99, dropped: 0, collected: 0 };
    this.summary = {
      available: true,
      first: 100,
      last: 101,
      expected: 2,
      received: 2,
      missing: 0,
      missingRate: 0,
      dropped: 0,
      checkpoint: this.checkpoint,
    };
  }

  async start() {
    this.insole.calls.push('fifo:start');
    return this.startResult;
  }

  async stop() {
    this.insole.calls.push('fifo:stop');
    if (this.onSamples) {
      this.onSamples(this.insole.id, [{
        timestamp: 1010,
        serial_number: 101,
        packet_number: 0,
        converted_acc: { x: 0, y: 0, z: 1 },
        converted_gyro: { x: 0, y: 0, z: 0 },
        press: { values: [1, 2, 3, 4, 5, 6] },
      }]);
    }
    if (this.onStopped) this.onStopped({ reason: 'manual' });
    return new Map();
  }

  createCheckpoint() {
    return this.checkpoint;
  }

  summarizeSince(checkpoint) {
    assert.equal(checkpoint, this.checkpoint);
    return this.summary;
  }

  emitSamples(samples) {
    if (this.onSamples) this.onSamples(this.insole.id, samples);
  }
}

class FakeGait {
  constructor(insole) {
    this.insole = insole;
    this.startResult = true;
    this.isRunning = false;
  }

  async start() {
    this.insole.calls.push('gait:start');
    this.isRunning = this.startResult;
    return this.startResult;
  }

  async stop() {
    this.insole.calls.push('gait:stop');
    this.isRunning = false;
  }

  async refreshSubscription() {
    this.insole.calls.push('gait:refresh');
    return this.isRunning;
  }

  emitPacket(packet) {
    if (this.onRaw) this.onRaw(this.insole.id, packet);
  }

  emitRow(row) {
    if (this.onGait) this.onGait(this.insole.id, row);
  }
}

function createSession(options = {}) {
  const insole = new FakeInsole();
  const session = new InsoleToolkitSession(insole, { onError() {}, ...options }, {
    FifoClass: FakeFifo,
    GaitClass: FakeGait,
  });
  return { insole, session };
}

async function main() {
  assert.equal(Object.isFrozen(INSOLE_TOOLKIT_PROFILES), true);
  assert.equal(Object.isFrozen(INSOLE_TOOLKIT_PROFILES['fifo-recording']), true);
  assert.equal(resolveInsoleToolkitProfile('realtime-full').streamingMode, 4);
  assert.throws(
    () => resolveInsoleToolkitProfile('does-not-exist'),
    (error) => error.code === 'PROFILE_NOT_FOUND'
  );
  assert.deepEqual(
    normalizeInsoleToolkitConfiguration(
      { outputs: { stepAnalysis: true } },
      {
        streamingMode: 4,
        sensorDataMode: 'realtime',
        outputs: { sensorValues: true, stepAnalysis: false },
      }
    ),
    {
      streamingMode: 4,
      sensorDataMode: 'realtime',
      outputs: { sensorValues: true, stepAnalysis: true },
    }
  );
  assert.deepEqual(normalizeInsoleToolkitOutputs(), {
    sensorValues: true,
    stepAnalysis: false,
  });
  assert.equal(normalizeInsoleSensorDataMode('fifo'), 'fifo');
  assert.equal(normalizeInsoleSensorDataMode('unknown'), 'realtime');
  assert.throws(
    () => normalizeInsoleToolkitOutputs({ sensorValues: false, stepAnalysis: false }),
    (error) => error.code === 'NO_DATA_OUTPUT'
  );
  assert.throws(
    () => normalizeInsoleToolkitConfiguration({
      streamingMode: 4,
      sensorDataMode: 'fifo',
      outputs: { sensorValues: false, stepAnalysis: true },
    }),
    (error) => error.code === 'FIFO_REQUIRES_SENSOR_VALUES'
  );
  assert.throws(
    () => normalizeInsoleToolkitConfiguration({ sensorDataMode: 'batch' }),
    (error) => error.code === 'INVALID_SENSOR_DATA_MODE'
  );

  {
    const { insole, session } = createSession();
    await session.connect();
    assert.equal(session.connected, true);
    assert.equal(session.sensorNotifyActive, true);
    assert.equal(session.fifoActive, false);
    assert.equal(session.gaitActive, false);
    assert.equal(session.profileId, 'realtime-full');
    assert.deepEqual(insole.calls, ['begin:SENSOR_VALUES:4']);
  }

  {
    const { insole, session } = createSession();
    await session.connect();
    insole.calls.length = 0;
    await session.setOutputs({ sensorValues: true, stepAnalysis: true });
    assert.equal(session.gaitActive, true);
    assert.deepEqual(insole.calls, ['gait:start']);

    insole.calls.length = 0;
    await session.setOutputs({ sensorValues: false, stepAnalysis: true });
    assert.equal(session.sensorNotifyActive, false);
    assert.deepEqual(insole.calls, ['notify:stop:SENSOR_VALUES']);

    insole.calls.length = 0;
    await assert.rejects(
      () => session.setSensorDataMode('fifo'),
      (error) => error.code === 'FIFO_REQUIRES_SENSOR_VALUES'
    );
    assert.deepEqual(session.outputs, { sensorValues: false, stepAnalysis: true });
    assert.equal(session.fifoActive, false);
    assert.deepEqual(insole.calls, []);

    await session.applyProfile('fifo-recording');
    assert.equal(session.fifoActive, true);
    assert.deepEqual(insole.calls, [
      'gait:stop',
      'mode:4',
      'notify:start:SENSOR_VALUES',
      'fifo:start',
    ]);

    insole.calls.length = 0;
    await session.setSensorDataMode('realtime');
    assert.equal(session.fifoActive, false);
    assert.deepEqual(insole.calls, ['fifo:stop']);
  }

  {
    const { insole, session } = createSession();
    await session.connect();
    await session.setOutputs({ sensorValues: true, stepAnalysis: true });
    insole.calls.length = 0;

    await assert.rejects(
      () => session.setSensorDataMode('fifo'),
      (error) => error.code === 'FIFO_STEP_INCOMPATIBLE'
    );
    assert.equal(session.sensorDataMode, 'realtime');
    assert.equal(session.fifoActive, false);
    assert.equal(session.gaitActive, true);
    assert.deepEqual(insole.calls, []);
  }

  {
    assert.throws(
      () => createSession({
        sensorDataMode: 'fifo',
        outputs: { sensorValues: true, stepAnalysis: true },
      }),
      (error) => error.code === 'FIFO_STEP_INCOMPATIBLE'
    );
  }

  {
    const { insole, session } = createSession();
    await session.connect();
    await assert.rejects(
      () => session.setOutputs({ sensorValues: false, stepAnalysis: false }),
      (error) => error.code === 'NO_DATA_OUTPUT'
    );
    assert.deepEqual(session.outputs, { sensorValues: true, stepAnalysis: false });

    await assert.rejects(
      () => session.setStreamingMode(2),
      (error) => error.code === 'INVALID_MODE'
    );
    assert.equal(session.streamingMode, 4);
    assert.equal(insole.streaming_mode, 4);
  }

  {
    const { insole, session } = createSession();
    await session.connect();
    session.fifo.startResult = false;
    await assert.rejects(
      () => session.setSensorDataMode('fifo'),
      (error) => error.code === 'FIFO_START_FAILED'
    );
    assert.equal(session.sensorDataMode, 'realtime');
    assert.equal(session.fifoActive, false);
    assert.equal(insole.streaming_mode, 4);
  }

  {
    const { insole, session } = createSession({
      outputs: { sensorValues: false, stepAnalysis: true },
    });
    await session.connect();
    assert.equal(session.sensorNotifyActive, false);
    insole.calls.length = 0;
    session.reapplyAfterReconnect();
    await session._transition;
    assert.deepEqual(insole.calls, ['gait:start', 'notify:stop:SENSOR_VALUES']);
  }

  {
    const { session } = createSession();
    await session.connect();
    await Promise.all([
      session.setSensorDataMode('fifo'),
      session.setSensorDataMode('realtime'),
      session.setOutputs({ sensorValues: true, stepAnalysis: true }),
    ]);
    assert.equal(session.sensorDataMode, 'realtime');
    assert.equal(session.fifoActive, false);
    assert.equal(session.gaitActive, true);
  }

  {
    const { insole, session } = createSession();
    await session.connect();
    await session.startMeasurement({
      profile: 'realtime-full-step',
      metadata: { participant: 'P001' },
      maxSamples: 1,
      maxStepRows: 1,
    });
    assert.equal(session.measurementPhase, 'recording');
    assert.equal(insole.sensorDataListeners.size, 1);
    insole.emitPacket(10, [{
      timestamp: 1000,
      serial_number: 10,
      packet_number: 0,
      acc: { x: 0, y: 0, z: 1 },
      press: { values: [1, 2, 3, 4, 5, 6] },
    }, {
      timestamp: 1010,
      serial_number: 10,
      packet_number: 1,
      acc: { x: 0, y: 0, z: 1 },
      press: { values: [6, 5, 4, 3, 2, 1] },
    }]);
    session.gait.emitPacket({ type: 'overview', step_number: 1 });
    session.gait.emitRow({ step_number: 1, gait_type: 'walk' });
    session.gait.emitRow({ step_number: 2, gait_type: 'walk' });

    await assert.rejects(
      () => session.applyProfile('step-analysis'),
      (error) => error.code === 'MEASUREMENT_ACTIVE'
    );

    const result = await session.stopMeasurement({ reason: 'test' });
    assert.equal(result.status, 'completed');
    assert.equal(result.reason, 'test');
    assert.equal(result.raw.packets, 1);
    assert.equal(result.raw.samples.length, 1);
    assert.equal(result.raw.truncated, true);
    assert.equal(result.raw.serial.missing, 0);
    assert.equal(result.step.packets, 1);
    assert.equal(result.step.rows.length, 1);
    assert.equal(result.step.truncated, true);
    assert.equal(result.metadata.participant, 'P001');
    assert.equal(session.measurementPhase, 'idle');
    assert.equal(insole.sensorDataListeners.size, 0);
    assert.equal(session.snapshot().lastMeasurement.raw.samples, 1);
    assert.equal(Array.isArray(session.snapshot().lastMeasurement.raw.samples), false);
    assert.match(insoleToolkitMeasurementToCSV(result), /serial_number/);
    assert.match(insoleToolkitMeasurementToCSV(result, 'step'), /step_number/);
    assert.equal(await session.stopMeasurement(), result);
  }

  {
    const { session } = createSession();
    await session.connect();
    await session.startMeasurement({ profile: 'fifo-recording' });
    session.fifo.emitSamples([{
      timestamp: 1000,
      serial_number: 100,
      packet_number: 0,
      converted_acc: { x: 0, y: 0, z: 1 },
      converted_gyro: { x: 0, y: 0, z: 0 },
      press: { values: [1, 2, 3, 4, 5, 6] },
    }]);
    const result = await session.stopMeasurement();
    assert.equal(result.raw.samples.length, 2, 'drain samples are included');
    assert.equal(result.raw.serial.first, 100);
    assert.equal(result.raw.serial.last, 101);
    assert.equal(result.raw.serial.missing, 0);
    assert.equal(session.profileId, 'realtime-full');
    assert.equal(session.fifoActive, false);
    assert.equal(session.measurementPhase, 'idle');
  }

  for (const previousProfile of ['realtime-full-step', 'step-analysis']) {
    const { session } = createSession();
    await session.connect();
    await session.applyProfile(previousProfile);
    await session.startMeasurement({
      profile: 'fifo-recording',
      metadata: { source: 'showcase-fifo-card' },
    });
    assert.equal(session.profileId, 'fifo-recording');
    assert.equal(session.fifoActive, true);
    assert.equal(session.gaitActive, false);

    await session.stopMeasurement({ reason: 'test' });
    assert.equal(session.profileId, previousProfile);
    assert.equal(session.fifoActive, false);
    assert.equal(session.gaitActive, true);
    assert.deepEqual(
      session.outputs,
      previousProfile === 'step-analysis'
        ? { sensorValues: false, stepAnalysis: true }
        : { sensorValues: true, stepAnalysis: true }
    );
  }

  {
    const { insole, session } = createSession();
    await session.connect();
    await session.startMeasurement({ profile: 'realtime-full' });
    for (const serial of [65534, 65535, 1, 0]) {
      insole.emitPacket(serial, [{
        timestamp: 1000,
        serial_number: serial,
        packet_number: 0,
        acc: { x: 0, y: 0, z: 1 },
      }]);
    }
    const result = await session.stopMeasurement();
    assert.deepEqual(result.raw.serial, {
      first: 65534,
      last: 1,
      expected: 4,
      received: 4,
      missing: 0,
      missingRate: 0,
    });
  }

  {
    const { insole, session } = createSession();
    await session.connect();
    await session.startMeasurement({ profile: 'fifo-recording' });
    insole.calls.length = 0;
    await session.disconnect();
    assert.deepEqual(insole.calls, ['fifo:stop', 'reset']);
    assert.equal(session.activeMeasurement, null);
    assert.equal(session.measurementPhase, 'idle');
    assert.equal(session.lastMeasurement.status, 'completed');
  }

  {
    const insole = new FakeInsole();
    const session = new InsoleToolkitSession(insole, { onError() {} }, {
      FifoClass: null,
      GaitClass: null,
    });
    await assert.rejects(
      () => session.applyProfile('fifo-recording'),
      (error) => error.code === 'FIFO_UNAVAILABLE'
    );
    await assert.rejects(
      () => session.applyProfile('step-analysis'),
      (error) => error.code === 'GAIT_UNAVAILABLE'
    );
  }

  assert.throws(
    () => insoleToolkitMeasurementToCSV(null),
    (error) => error.code === 'INVALID_MEASUREMENT'
  );
  assert.throws(
    () => insoleToolkitMeasurementToCSV({ raw: { samples: [] } }, 'binary'),
    (error) => error.code === 'INVALID_CSV_KIND'
  );

  console.log('insole-toolkit-session tests: ok');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
