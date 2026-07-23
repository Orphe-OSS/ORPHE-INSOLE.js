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
  normalizeInsoleToolkitOutputs,
  normalizeInsoleSensorDataMode,
} = require('../src/InsoleToolkit.js');

class FakeInsole {
  constructor(id = 0) {
    this.id = id;
    this.connected = false;
    this.streaming_mode = 4;
    this.calls = [];
    this._afterReconnectSuccess = [];
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
}

class FakeFifo {
  constructor(insole) {
    this.insole = insole;
    this.startResult = true;
    this.onStopped = null;
  }

  async start() {
    this.insole.calls.push('fifo:start');
    return this.startResult;
  }

  async stop() {
    this.insole.calls.push('fifo:stop');
    if (this.onStopped) this.onStopped({ reason: 'manual' });
    return new Map();
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

  {
    const { insole, session } = createSession();
    await session.connect();
    assert.equal(session.connected, true);
    assert.equal(session.sensorNotifyActive, true);
    assert.equal(session.fifoActive, false);
    assert.equal(session.gaitActive, false);
    assert.deepEqual(insole.calls, [
      'begin:SENSOR_VALUES:4',
      'mode:4',
    ]);
  }

  {
    const { insole, session } = createSession();
    await session.connect();
    insole.calls.length = 0;
    await session.setOutputs({ sensorValues: true, stepAnalysis: true });
    assert.equal(session.gaitActive, true);
    assert.deepEqual(insole.calls, ['mode:4', 'gait:start']);

    insole.calls.length = 0;
    await session.setOutputs({ sensorValues: false, stepAnalysis: true });
    assert.equal(session.sensorNotifyActive, false);
    assert.deepEqual(insole.calls, ['notify:stop:SENSOR_VALUES']);

    insole.calls.length = 0;
    await session.setSensorDataMode('fifo');
    await session.setOutputs({ sensorValues: true, stepAnalysis: true });
    assert.equal(session.fifoActive, true);
    assert.deepEqual(insole.calls, [
      'mode:4',
      'notify:start:SENSOR_VALUES',
      'fifo:start',
      'gait:refresh',
    ]);

    insole.calls.length = 0;
    await session.setSensorDataMode('realtime');
    assert.equal(session.fifoActive, false);
    assert.deepEqual(insole.calls, ['fifo:stop', 'mode:4', 'gait:refresh']);
  }

  {
    const { insole, session } = createSession();
    await session.connect();
    await session.setOutputs({ sensorValues: true, stepAnalysis: true });
    insole.calls.length = 0;

    await session.setSensorDataMode('fifo');
    assert.equal(session.fifoActive, true);
    assert.equal(session.gaitActive, true);
    assert.deepEqual(insole.calls, ['fifo:start', 'gait:refresh']);

    insole.calls.length = 0;
    await session.setSensorDataMode('realtime');
    assert.deepEqual(insole.calls, ['fifo:stop', 'mode:4', 'gait:refresh']);
  }

  {
    const { insole, session } = createSession({
      sensorDataMode: 'fifo',
      outputs: { sensorValues: true, stepAnalysis: true },
    });
    await session.connect();
    assert.deepEqual(insole.calls, ['begin:SENSOR_VALUES:4', 'fifo:start', 'gait:start']);
    insole.calls.length = 0;
    await session.disconnect();
    assert.deepEqual(insole.calls, ['fifo:stop', 'gait:stop', 'reset']);
    assert.equal(session.connected, false);
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

  console.log('insole-toolkit-session tests: ok');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
