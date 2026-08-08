'use strict';

// InsoleToolkitSession の FWバージョン解決と Step Analysis 警告のテスト。
// - GAIT_NO_NOTIFICATIONS のエラー文言に FW バージョンのヒントが入ること
// - 既知の Step Analysis 未確認FW（1.0.1）で fw-step-analysis-unconfirmed 診断が出ること
// 実行: node tests/insole-toolkit-fw-warning.test.js

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
  INSOLE_TOOLKIT_STEP_UNSUPPORTED_FW,
} = require('../src/InsoleToolkit.js');

class FakeInsole {
  constructor(id = 0, firmwareVersion = null) {
    this.id = id;
    this.connected = false;
    this.streaming_mode = 4;
    this.calls = [];
    this._afterReconnectSuccess = [];
    this.sensorDataListeners = new Set();
    this._firmwareVersion = firmwareVersion;
  }

  async begin(type, options) {
    this.connected = true;
    this.streaming_mode = options.streamingMode;
    return 'connected';
  }

  reset() { this.connected = false; }
  isConnected() { return this.connected; }
  async setDataStreamingMode(mode) { this.streaming_mode = mode; }
  async startNotify() { }
  async stopNotify() { }
  addSensorDataListener(listener) {
    this.sensorDataListeners.add(listener);
    return () => this.sensorDataListeners.delete(listener);
  }

  async getFirmwareVersion() {
    return this._firmwareVersion;
  }
}

class FakeGait {
  constructor(insole) {
    this.insole = insole;
    this.isRunning = false;
  }
  async start() { this.isRunning = true; return true; }
  async stop() { this.isRunning = false; }
  async refreshSubscription() { return this.isRunning; }
}

function createSession({ firmwareVersion } = {}) {
  const insole = new FakeInsole(0, firmwareVersion);
  const diagnostics = [];
  const session = new InsoleToolkitSession(insole, {
    onError() { },
    gait: {
      verifyTimeoutMs: 50,
      verifyRetries: 1,
      onDiagnostic(deviceId, info) { diagnostics.push(info); },
    },
  }, {
    GaitClass: FakeGait,
  });
  return { insole, session, diagnostics };
}

async function main() {
  assert.equal(Object.isFrozen(INSOLE_TOOLKIT_STEP_UNSUPPORTED_FW), true);
  assert.ok(INSOLE_TOOLKIT_STEP_UNSUPPORTED_FW.includes('1.0.1'));

  // --- 既知の未確認FW: 警告診断 + エラー文言に FW バージョン ---
  {
    const { session, diagnostics } = createSession({ firmwareVersion: '1.0.1' });
    await session.connect();
    session.gait.diagnostics = () => ({
      transportNotifications: 0,
      validPackets: 0,
      invalidPackets: 0,
    });
    session.gait.waitForPacket = async () => false;

    let caught = null;
    try {
      await session.applyProfile('realtime-full-step');
    } catch (error) {
      caught = error;
    }
    assert.ok(caught, 'applyProfile は失敗すること');
    assert.equal(caught.code, 'GAIT_NO_NOTIFICATIONS');
    assert.equal(caught.firmwareVersion, '1.0.1');
    assert.match(caught.message, /may not support Step Analysis output \(FW 1\.0\.1\)/);

    const warned = diagnostics.filter((info) => info.type === 'fw-step-analysis-unconfirmed');
    assert.equal(warned.length, 1, '未確認FW警告は1回だけ出ること');
    assert.equal(warned[0].firmwareVersion, '1.0.1');
  }

  // --- FWバージョン不明: 文言は unknown、診断警告は出ない ---
  {
    const { session, diagnostics } = createSession({ firmwareVersion: null });
    await session.connect();
    session.gait.diagnostics = () => ({
      transportNotifications: 0,
      validPackets: 0,
      invalidPackets: 0,
    });
    session.gait.waitForPacket = async () => false;

    await assert.rejects(
      () => session.applyProfile('realtime-full-step'),
      (error) => error.code === 'GAIT_NO_NOTIFICATIONS'
        && error.firmwareVersion === null
        && /firmware version unknown/.test(error.message)
    );
    assert.equal(diagnostics.filter((info) => info.type === 'fw-step-analysis-unconfirmed').length, 0);
  }

  // --- 対応FW（リスト外）: 警告診断は出ない。transport ありなら文言は従来どおり ---
  {
    const { session, diagnostics } = createSession({ firmwareVersion: '3.0.0' });
    await session.connect();
    let transport = 0;
    session.gait.diagnostics = () => ({
      // 呼ばれるたびに増える = 購読後に transport 通知が届いている状況
      transportNotifications: (transport += 5),
      validPackets: 0,
      invalidPackets: 1,
    });
    session.gait.waitForPacket = async () => false;

    await assert.rejects(
      () => session.applyProfile('realtime-full-step'),
      (error) => error.code === 'GAIT_INVALID_PACKETS'
        && !/may not support/.test(error.message)
    );
    assert.equal(diagnostics.filter((info) => info.type === 'fw-step-analysis-unconfirmed').length, 0);
  }

  console.log('insole-toolkit-fw-warning tests: ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
