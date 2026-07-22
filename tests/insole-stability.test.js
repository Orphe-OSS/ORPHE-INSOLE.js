// v1.1.0 で追加した接続安定化まわりのユニットテスト。
// BLE 実機を使わずに検証できる純粋ロジックのみを対象とする。
const assert = require('node:assert/strict');
const { waitFor } = require('./async-test-utils.js');

// ブラウザ専用グローバルの最小モック（require 時の参照エラー回避）
globalThis.performance = globalThis.performance || { now: () => Date.now() };

const {
  Orphe,
  OrpheInsole,
  parseInsoleSensorValues,
} = require('../src/ORPHE-INSOLE.js');

async function main() {
  // ── クラス名・エイリアス ─────────────────────────────────────
  assert.equal(OrpheInsole, Orphe, 'Orphe must alias OrpheInsole');
  assert.equal(OrpheInsole.name, 'OrpheInsole', 'primary class name should be OrpheInsole');
  assert.equal(typeof OrpheInsole.parseSensorValues, 'function');

  const insole = new OrpheInsole(0);

  // ── デバイス記憶のストレージキーが CORE と衝突しない ───────────
  assert.equal(insole._lastBluetoothDeviceStorageKey, 'orphe_insole_last_bluetooth_device_0');
  assert.equal(new OrpheInsole(1)._lastBluetoothDeviceStorageKey, 'orphe_insole_last_bluetooth_device_1');

  // ── 別スロットで同じBluetooth Deviceを共有しない ──────────────
  {
    const left = new OrpheInsole(0);
    const right = new OrpheInsole(1);
    const device = { id: 'same-device', name: 'INS-L' };
    left.bluetoothDevice = device;
    assert.equal(right._findBluetoothDeviceInUse({ id: 'same-device', name: 'INS-L' }), left);
    assert.equal(left._findBluetoothDeviceInUse(device), null, 'same instance id is allowed to reuse its own device');
    left.bluetoothDevice = null;
  }

  // ── _findBluetoothDevice のマッチングロジック ─────────────────
  const devices = [
    { id: 'aaa', name: 'INS-L' },
    { id: 'bbb', name: 'INS-R' },
    { id: 'ccc', name: 'INS-R' },
  ];
  // id 一致が最優先
  assert.equal(insole._findBluetoothDevice(devices, { bluetoothId: 'bbb' }), devices[1]);
  // id 不一致でも名前が一意なら名前で一致
  assert.equal(insole._findBluetoothDevice(devices, { bluetoothId: 'zzz', bluetoothName: 'INS-L' }), devices[0]);
  // 名前が重複する場合は誤接続防止のため null
  assert.equal(insole._findBluetoothDevice(devices, { bluetoothName: 'INS-R' }), null);
  assert.equal(insole._findBluetoothDevice(devices, null), null);
  assert.equal(insole._findBluetoothDevice('not-an-array', { bluetoothId: 'aaa' }), null);

  // ── 自動再接続の設定値正規化 ──────────────────────────────────
  insole._autoReconnectOptions = {};
  assert.equal(insole._autoReconnectIntervalMs(), 3000, 'default interval');
  assert.equal(insole._autoReconnectMaxAttempts(), 120, 'default attempts');
  insole._autoReconnectOptions = { reconnectIntervalMs: 500, reconnectMaxAttempts: 5 };
  assert.equal(insole._autoReconnectIntervalMs(), 500);
  assert.equal(insole._autoReconnectMaxAttempts(), 5);
  insole._autoReconnectOptions = { reconnectIntervalMs: -1, reconnectMaxAttempts: 0 };
  assert.equal(insole._autoReconnectIntervalMs(), 3000, 'negative interval falls back');
  assert.equal(insole._autoReconnectMaxAttempts(), 120, 'zero attempts falls back');

  insole._enableAutoReconnect('SENSOR_VALUES', { streamingMode: 3 });
  assert.equal(insole._autoReconnectEnabled, true);
  assert.equal(insole._autoReconnectOptions.autoReconnect, true);
  assert.equal(insole._autoReconnectOptions.streamingMode, 3);
  insole._enableAutoReconnect('SENSOR_VALUES', { streamingMode: 3, forceDeviceSelection: true });
  assert.equal(insole._autoReconnectOptions.forceDeviceSelection, undefined, 'manual chooser option must not leak into auto reconnect');
  insole._disableAutoReconnect();
  assert.equal(insole._autoReconnectEnabled, false);

  // ── 自動再接続の内部復旧をユーザ callback の例外から隔離する ──
  {
    const target = new OrpheInsole(0);
    const order = [];
    const errors = [];
    let failedCalls = 0;
    target._autoReconnectEnabled = true;
    target._autoReconnectOptions = { reconnectMaxAttempts: 1, reconnectIntervalMs: 1 };
    target._restoreAutoReconnectDevice = async () => true;
    target.begin = async () => 'reconnected';
    target._afterReconnectSuccess.push(() => { order.push('internal-hook'); });
    target.onReconnectAttempt = () => {
      order.push('attempt');
      throw new Error('attempt callback failed');
    };
    target.onReconnectSuccess = () => {
      order.push('public-success');
      throw new Error('success callback failed');
    };
    target.onReconnectFailed = () => { failedCalls++; };
    target.onError = (error) => { errors.push(error.message); };

    await target._startAutoReconnect();
    assert.deepEqual(order, ['attempt', 'internal-hook', 'public-success'],
      '内部再購読を公開 success callback より先に起動');
    assert.equal(target._autoReconnectInProgress, false);
    assert.equal(failedCalls, 0, 'callback throw で接続成功を失敗扱いにしない');
    assert.deepEqual(errors, ['attempt callback failed', 'success callback failed']);
  }

  {
    const target = new OrpheInsole(0);
    const errors = [];
    target._autoReconnectEnabled = true;
    target._autoReconnectOptions = { reconnectMaxAttempts: 1, reconnectIntervalMs: 1 };
    target._restoreAutoReconnectDevice = async () => true;
    target.begin = async () => { throw new Error('transport failed'); };
    target.onReconnectAttempt = () => { };
    target.onReconnectFailed = () => { throw new Error('failed callback failed'); };
    target.onError = (error) => { errors.push(error.message); };

    await target._startAutoReconnect();
    assert.equal(target._autoReconnectInProgress, false);
    assert.deepEqual(errors, ['failed callback failed', 'transport failed'],
      'failed callback の例外も transport 結果から隔離');
  }

  {
    const target = new OrpheInsole(0);
    const logged = [];
    const originalError = console.error;
    console.error = (...args) => { logged.push(args); };
    try {
      target.onError = async () => { throw new Error('async onError failed'); };
      target._safeReportError(new Error('source error'), 'test');
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(logged.length, 1, 'async onError rejection is consumed');
      assert.match(String(logged[0][1]), /async onError failed/);
    } finally {
      console.error = originalError;
    }
  }

  {
    // 遅れてrejectした公開callbackを、再接続transportの失敗原因へ混入させない
    const target = new OrpheInsole(0);
    let resolveAttemptCallback;
    let resolveBegin;
    let failedError = null;
    const errors = [];
    target._autoReconnectEnabled = true;
    target._autoReconnectOptions = { reconnectMaxAttempts: 1, reconnectIntervalMs: 1 };
    target._restoreAutoReconnectDevice = async () => true;
    target.onReconnectAttempt = async () => {
      await new Promise((resolve) => { resolveAttemptCallback = resolve; });
      throw new Error('late callback failure');
    };
    target.begin = async () => new Promise((resolve) => { resolveBegin = resolve; });
    target.onReconnectFailed = (info) => { failedError = info.error; };
    target.onError = (error) => { errors.push(error.message); };

    const reconnecting = target._startAutoReconnect();
    await waitFor(() => resolveAttemptCallback && resolveBegin,
      'auto-reconnect callback and begin gates');
    resolveAttemptCallback();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(target._lastAutoReconnectError, null, 'callback error is not stored as transport error');
    resolveBegin(false);
    await reconnecting;
    assert.equal(failedError.message, 'Auto reconnect attempt failed.');
    assert.deepEqual(errors, ['late callback failure', 'Auto reconnect attempt failed.']);
  }

  // ── _reportError は自動再接続中に onError を抑制する ───────────
  let errorCount = 0;
  insole.onError = () => { errorCount++; };
  insole._reportError(new Error('a'));
  assert.equal(errorCount, 1);
  insole._suppressAutoReconnectErrors = true;
  insole._reportError(new Error('b'));
  assert.equal(errorCount, 1, 'suppressed during reconnect');
  assert.equal(insole._lastAutoReconnectError.message, 'b');
  insole._suppressAutoReconnectErrors = false;

  // ── setDataStreamingMode のバリデーション（write をモック） ────
  {
    const written = [];
    const target = new OrpheInsole(0);
    target.write = async (uuid, data) => { written.push({ uuid, data: Array.from(data) }); };
    await target.setDataStreamingMode(3);
    assert.deepEqual(written[0], { uuid: 'DEVICE_INFORMATION', data: [0x0D, 3] });
    assert.equal(target.streaming_mode, 3);
    await assert.rejects(() => target.setDataStreamingMode(2), /Invalid ORPHE INSOLE data streaming mode/);
    await assert.rejects(() => target.setDataStreamingMode('x'), /Invalid ORPHE INSOLE data streaming mode/);
  }

  // ── forceDeviceSelection が最初の scan まで伝搬する ────────────
  {
    const target = new OrpheInsole(0);
    let scanOptions = null;
    target.scan = async (_uuid, options = {}) => { scanOptions = options; };
    target.connectGATT = async () => {};
    target.dataCharacteristic = {
      readValue: async () => {
        const data = new DataView(new ArrayBuffer(10));
        data.setUint8(0, 1);
        data.setUint8(1, 0);
        data.setUint8(8, 3);
        data.setUint8(9, 3);
        return data;
      }
    };
    await target.getDeviceInformation({ forceDeviceSelection: true });
    assert.equal(scanOptions.forceDeviceSelection, true);
  }

  // ── begin() の接続オプションが初期化手順全体に渡る ────────────
  {
    const target = new OrpheInsole(0);
    const calls = [];
    target.getDeviceInformation = async (options) => { calls.push(['getDeviceInformation', options.forceDeviceSelection]); };
    target.setDataStreamingMode = async (mode, options) => { calls.push(['setDataStreamingMode', mode, options.forceDeviceSelection]); };
    target.syncCoreTime = async (n, options) => { calls.push(['syncCoreTime', n, options.forceDeviceSelection]); };
    target.startNotify = async (uuid, options) => { calls.push(['startNotify', uuid, options.forceDeviceSelection]); };
    const result = await target.begin('SENSOR_VALUES', {
      streamingMode: 3,
      forceDeviceSelection: true,
      autoReconnect: true,
    });
    assert.equal(result, 'done begin(); SENSOR VALUES');
    assert.deepEqual(calls, [
      ['getDeviceInformation', true],
      ['setDataStreamingMode', 3, true],
      ['syncCoreTime', 3, true],
      ['startNotify', 'SENSOR_VALUES', true],
    ]);
    assert.equal(target._autoReconnectOptions.forceDeviceSelection, undefined);
  }

  // ── characteristic の UUID 別管理（notify 中の read/write 競合） ──
  // モックGATT: UUID ごとに別の characteristic スパイを返す
  function createMockGATT() {
    const characteristics = {}; // characteristicUUID -> spy
    const stats = { connectCalls: 0, characteristicRequests: {} };
    function charFor(charUUID) {
      if (!characteristics[charUUID]) {
        const spy = {
          uuid: charUUID,
          listeners: [],
          startNotifyCalls: 0,
          stopNotifyCalls: 0,
          readCalls: 0,
          writeCalls: 0,
          // startNotifications の解決を外部から制御できるようにする
          _holdStartNotifications: false,
          releaseStartNotifications: null,
          holdNextStartNotifications() {
            this._holdStartNotifications = true;
          },
          startNotifications() {
            this.startNotifyCalls++;
            if (this._holdStartNotifications) {
              this._holdStartNotifications = false;
              return new Promise((resolve) => {
                this.releaseStartNotifications = () => resolve(this);
              });
            }
            return Promise.resolve(this);
          },
          stopNotifications() {
            this.stopNotifyCalls++;
            return Promise.resolve(this);
          },
          readValue() {
            this.readCalls++;
            const data = new DataView(new ArrayBuffer(20));
            data.setUint8(0, 1); // battery
            data.setUint8(1, 0); // mount_position
            data.setUint8(8, 3);
            data.setUint8(9, 3);
            return Promise.resolve(data);
          },
          writeValue() {
            this.writeCalls++;
            return Promise.resolve();
          },
          addEventListener(_type, handler) { this.listeners.push(handler); },
          removeEventListener(_type, handler) {
            const i = this.listeners.indexOf(handler);
            if (i >= 0) this.listeners.splice(i, 1);
          },
        };
        characteristics[charUUID] = spy;
      }
      return characteristics[charUUID];
    }
    const gatt = {
      connected: true,
      connect() {
        stats.connectCalls++;
        gatt.connected = true;
        return Promise.resolve({
          getPrimaryService() {
            return Promise.resolve({
              getCharacteristic(charUUID) {
                stats.characteristicRequests[charUUID] = (stats.characteristicRequests[charUUID] || 0) + 1;
                return Promise.resolve(charFor(charUUID));
              },
            });
          },
        });
      },
      disconnect() { gatt.connected = false; },
    };
    return { gatt, charFor, stats };
  }

  function makeGATTTestTarget() {
    const target = new OrpheInsole(0);
    target.setup(['DEVICE_INFORMATION', 'DATE_TIME', 'SENSOR_VALUES']);
    const env = createMockGATT();
    target.bluetoothDevice = { gatt: env.gatt, name: 'MOCK-INSOLE' };
    target.scan = async () => {}; // requestDevice をスキップ
    const sensorChar = env.charFor(target.ORPHE_SENSOR_VALUES);
    const deviceInfoChar = env.charFor(target.ORPHE_DEVICE_INFORMATION);
    return { target, env, sensorChar, deviceInfoChar };
  }

  // シナリオA（競合の核心）: SENSOR_VALUES の startNotifications() 待機中に
  // DEVICE_INFORMATION の read が完了しても、通知リスナーは SENSOR_VALUES 側に付くこと。
  // （単一 dataCharacteristic スロットの現行実装では、await 中にスロットが
  //   DEVICE_INFORMATION へ差し替わり、リスナーが誤対象に付いてデータが届かなくなる）
  {
    const { target, sensorChar, deviceInfoChar } = makeGATTTestTarget();
    sensorChar.holdNextStartNotifications();
    const notifyPromise = target.startNotify('SENSOR_VALUES');
    // startNotifications() の待機点までチェーンを進める
    await waitFor(() => sensorChar.releaseStartNotifications,
      'SENSOR_VALUES startNotifications gate');
    await target.read('DEVICE_INFORMATION'); // 通知確立中に割り込む read
    sensorChar.releaseStartNotifications();
    await notifyPromise;
    assert.equal(sensorChar.listeners.length, 1,
      'notify listener must be attached to the SENSOR_VALUES characteristic');
    assert.equal(deviceInfoChar.listeners.length, 0,
      'DEVICE_INFORMATION characteristic must not receive the notify listener');
    assert.equal(deviceInfoChar.readCalls, 1);
  }

  // シナリオB: startNotify → read → stopNotify の直列実行で、
  // stop 系が SENSOR_VALUES 側にのみ作用し、キャッシュにより characteristic の
  // 再取得が発生しないこと（現行実装は uuid が交互になるたび再取得する）。
  {
    const { target, env, sensorChar, deviceInfoChar } = makeGATTTestTarget();
    await target.startNotify('SENSOR_VALUES');
    assert.equal(sensorChar.listeners.length, 1);
    await target.read('DEVICE_INFORMATION');
    await target.write('DEVICE_INFORMATION', [0x0D, 4]);
    assert.equal(sensorChar.listeners.length, 1, 'listener count unchanged by read/write during notify');
    await target.stopNotify('SENSOR_VALUES');
    assert.equal(sensorChar.stopNotifyCalls, 1, 'stopNotifications must hit SENSOR_VALUES');
    assert.equal(deviceInfoChar.stopNotifyCalls, 0, 'stopNotifications must not hit DEVICE_INFORMATION');
    assert.equal(sensorChar.listeners.length, 0, 'listener removed from SENSOR_VALUES');
    assert.equal(env.stats.characteristicRequests[target.ORPHE_SENSOR_VALUES], 1,
      'SENSOR_VALUES characteristic must be fetched once and cached');
    assert.equal(env.stats.characteristicRequests[target.ORPHE_DEVICE_INFORMATION], 1,
      'DEVICE_INFORMATION characteristic must be fetched once and cached');
  }

  // シナリオB2: 古いGATTの非同期notify完了が、新しいGATTのhandlerを上書き/削除しない
  {
    function notifyChar(name, holdStart = false, holdStop = false) {
      let releaseStart = null;
      let releaseStop = null;
      const listeners = [];
      const char = {
        name,
        listeners,
        startNotifications() {
          if (!holdStart) return Promise.resolve(this);
          holdStart = false;
          return new Promise((resolve) => { releaseStart = () => resolve(this); });
        },
        stopNotifications() {
          if (!holdStop) return Promise.resolve(this);
          holdStop = false;
          return new Promise((resolve) => { releaseStop = () => resolve(this); });
        },
        addEventListener(_type, handler) { listeners.push(handler); },
        removeEventListener(_type, handler) {
          const i = listeners.indexOf(handler);
          if (i >= 0) listeners.splice(i, 1);
        },
        get releaseStart() { return releaseStart; },
        get releaseStop() { return releaseStop; },
      };
      return char;
    }

    const target = new OrpheInsole(0);
    const oldChar = notifyChar('old', true, false);
    const currentChar = notifyChar('current', false, true);
    const newestChar = notifyChar('newest', false, false);
    let selected = oldChar;
    target.scan = async () => { };
    target.connectGATT = async () => { };
    target._characteristicFor = () => selected;
    target.onError = () => { };

    const oldStart = target.startNotify('STEP_ANALYSIS');
    await waitFor(() => oldChar.releaseStart, 'old GATT startNotifications gate');
    target._invalidateNotifyOperations(); // 物理切断相当
    selected = currentChar;
    await target.startNotify('STEP_ANALYSIS');
    assert.equal(currentChar.listeners.length, 1);

    oldChar.releaseStart();
    await oldStart;
    assert.equal(oldChar.listeners.length, 0, '古いstart完了はlistenerを追加しない');
    assert.equal(currentChar.listeners.length, 1, '現listenerを維持');

    const oldStop = target.stopNotify('STEP_ANALYSIS');
    await waitFor(() => currentChar.releaseStop, 'current GATT stopNotifications gate');
    target._invalidateNotifyOperations(); // さらに再接続
    selected = newestChar;
    await target.startNotify('STEP_ANALYSIS');
    assert.equal(newestChar.listeners.length, 1);

    currentChar.releaseStop();
    await oldStop;
    assert.equal(newestChar.listeners.length, 1, '古いstop完了は新listenerを削除しない');
    assert.equal(target._notifyCharacteristics.STEP_ANALYSIS, newestChar);
  }

  // シナリオB3: 同一characteristicのstart/stopは呼出順に直列化し、
  // 後から呼んだ操作が物理notificationの最終状態になること。
  {
    function deferred() {
      let resolve;
      const promise = new Promise((done) => { resolve = done; });
      return { promise, resolve };
    }

    function queuedNotifyChar(name) {
      const char = {
        name,
        notifying: false,
        startCalls: 0,
        stopCalls: 0,
        listeners: [],
        startGate: null,
        stopGate: null,
        async startNotifications() {
          this.startCalls++;
          const gate = this.startGate;
          this.startGate = null;
          if (gate) await gate.promise;
          this.notifying = true;
          return this;
        },
        async stopNotifications() {
          this.stopCalls++;
          const gate = this.stopGate;
          this.stopGate = null;
          if (gate) await gate.promise;
          this.notifying = false;
          return this;
        },
        addEventListener(_type, handler) { this.listeners.push(handler); },
        removeEventListener(_type, handler) {
          const index = this.listeners.indexOf(handler);
          if (index >= 0) this.listeners.splice(index, 1);
        },
      };
      return char;
    }

    function notifyTarget(characteristicFor) {
      const target = new OrpheInsole(0);
      target.scan = async () => { };
      target.connectGATT = async () => { };
      target._characteristicFor = characteristicFor;
      target.onError = () => { };
      return target;
    }

    // issued stop -> start: stopが未完了の間はstartNotificationsへ進まず、最終ON。
    {
      const characteristic = queuedNotifyChar('stop-then-start');
      const target = notifyTarget(() => characteristic);
      await target.startNotify('STEP_ANALYSIS');
      assert.equal(characteristic.notifying, true);
      assert.equal(characteristic.listeners.length, 1);

      const stopGate = deferred();
      characteristic.stopGate = stopGate;
      const stopping = target.stopNotify('STEP_ANALYSIS');
      await waitFor(() => characteristic.stopCalls > 0, 'issued stopNotifications call');

      const starting = target.startNotify('STEP_ANALYSIS');
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(characteristic.startCalls, 1,
        'new startNotifications waits for the issued stopNotifications');

      stopGate.resolve();
      await Promise.all([stopping, starting]);
      assert.equal(characteristic.notifying, true, 'issued stop -> start ends with notifications ON');
      assert.equal(characteristic.listeners.length, 1, 'final ON state has exactly one listener');
      assert.equal(target._notifyCharacteristics.STEP_ANALYSIS, characteristic);
    }

    // issued start -> stop: startが未完了の間はstopNotificationsへ進まず、最終OFF。
    {
      const characteristic = queuedNotifyChar('start-then-stop');
      const target = notifyTarget(() => characteristic);
      const startGate = deferred();
      characteristic.startGate = startGate;
      const starting = target.startNotify('STEP_ANALYSIS');
      await waitFor(() => characteristic.startCalls > 0, 'issued startNotifications call');

      const stopping = target.stopNotify('STEP_ANALYSIS');
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(characteristic.stopCalls, 0,
        'new stopNotifications waits for the issued startNotifications');

      startGate.resolve();
      await Promise.all([starting, stopping]);
      assert.equal(characteristic.notifying, false, 'issued start -> stop ends with notifications OFF');
      assert.equal(characteristic.listeners.length, 0, 'final OFF state has no listener');
      assert.equal(target.dataChangedEventHandlerMap.STEP_ANALYSIS, undefined);
      assert.equal(target._notifyCharacteristics.STEP_ANALYSIS, undefined);
    }

    // old stopがconnectGATT待ちの間に再接続しても、新characteristicをstopしない。
    {
      const oldCharacteristic = queuedNotifyChar('old-connect-generation');
      const newCharacteristic = queuedNotifyChar('new-connect-generation');
      let selected = oldCharacteristic;
      const target = notifyTarget(() => selected);
      await target.startNotify('STEP_ANALYSIS');

      const connectGate = deferred();
      const oldStopEnteredConnect = deferred();
      let connectCalls = 0;
      target.connectGATT = async () => {
        connectCalls++;
        if (connectCalls === 1) {
          oldStopEnteredConnect.resolve();
          await connectGate.promise;
        }
      };

      const oldStop = target.stopNotify('STEP_ANALYSIS');
      await oldStopEnteredConnect.promise;
      target._invalidateNotifyOperations();
      selected = newCharacteristic;
      await target.startNotify('STEP_ANALYSIS');
      assert.equal(newCharacteristic.notifying, true);
      assert.equal(newCharacteristic.listeners.length, 1);

      connectGate.resolve();
      await oldStop;
      assert.equal(oldCharacteristic.stopCalls, 0,
        'stale stop waiting in connect never reaches its old characteristic');
      assert.equal(newCharacteristic.stopCalls, 0,
        'stale stop waiting in connect never captures the new characteristic');
      assert.equal(newCharacteristic.notifying, true, 'new connection remains notifying');
      assert.equal(newCharacteristic.listeners.length, 1, 'new connection listener remains installed');
      assert.equal(target._notifyCharacteristics.STEP_ANALYSIS, newCharacteristic);
    }
  }

  // シナリオC: clear() / selectBluetoothDevice() で characteristic キャッシュが破棄されること
  {
    const { target } = makeGATTTestTarget();
    await target.startNotify('SENSOR_VALUES');
    assert.ok(target._characteristics && Object.keys(target._characteristics).length > 0,
      'characteristics cache should be populated after startNotify');
    target.clear();
    assert.deepEqual(target._characteristics, {}, 'clear() must reset the characteristics cache');
  }
  {
    const { target } = makeGATTTestTarget();
    await target.startNotify('SENSOR_VALUES');
    target.requestDevice = async () => {}; // navigator.bluetooth 呼び出しをスキップ
    await target.selectBluetoothDevice();
    assert.deepEqual(target._characteristics, {}, 'selectBluetoothDevice() must reset the characteristics cache');
  }

  // ── エラーcode / connectionState / connectTimeoutMs / ログ抑制（PR#10） ──
  {
    // NO_DEVICE: connectGATT はデバイスなしで code 付き Error で reject
    const target = new OrpheInsole(0);
    target.onError = () => { };
    await assert.rejects(() => target.connectGATT('DEVICE_INFORMATION'), (error) => {
      assert.equal(error.code, 'NO_DEVICE');
      assert.equal(error.message, 'No Bluetooth Device', 'message string is backward compatible');
      return true;
    });

    // ALREADY_DISCONNECTED: disconnect() は onError に code 付き Error を渡す
    const reported = [];
    target.onError = (error) => reported.push(error);
    target.bluetoothDevice = { gatt: { connected: false }, name: 'X' };
    target.stopWatchingAdvertisements = () => { };
    target.disconnect();
    assert.equal(reported[0].code, 'ALREADY_DISCONNECTED');
    assert.equal(reported[0].message, 'Bluetooth Device is already disconnected');

    // INVALID_MODE
    const modeTarget = new OrpheInsole(0);
    modeTarget.onError = () => { };
    await assert.rejects(() => modeTarget.setDataStreamingMode(2), (error) => {
      assert.equal(error.code, 'INVALID_MODE');
      return true;
    });
  }

  {
    // connectionState の遷移
    const target = new OrpheInsole(0);
    assert.equal(target.connectionState, 'disconnected');
    target.bluetoothDevice = { gatt: { connected: true } };
    assert.equal(target.connectionState, 'connected');
    target.bluetoothDevice = { gatt: { connected: false } };
    target._autoReconnectInProgress = true;
    assert.equal(target.connectionState, 'reconnecting');
    target._autoReconnectInProgress = false;
    assert.equal(target.connectionState, 'disconnected');

    // begin() 実行中は 'connecting'、成功後は finally でフラグ解除
    const beginTarget = new OrpheInsole(0);
    const statesDuringBegin = [];
    beginTarget.getDeviceInformation = async () => { statesDuringBegin.push(beginTarget.connectionState); };
    beginTarget.setDataStreamingMode = async () => { };
    beginTarget.syncCoreTime = async () => { };
    beginTarget.startNotify = async () => { };
    await beginTarget.begin('SENSOR_VALUES', {});
    assert.deepEqual(statesDuringBegin, ['connecting']);
    assert.equal(beginTarget._connecting, false, 'flag cleared after begin');

    // begin() 失敗時も finally でフラグ解除
    const failTarget = new OrpheInsole(0);
    failTarget.onError = () => { };
    failTarget.getDeviceInformation = async () => { throw new Error('boom'); };
    await assert.rejects(() => failTarget.begin('SENSOR_VALUES', {}));
    assert.equal(failTarget._connecting, false, 'flag cleared after failed begin');
  }

  {
    // connectTimeoutMs: gatt.connect() が解決しない場合 CONNECT_TIMEOUT で reject
    const target = new OrpheInsole(0);
    target.setup(['DEVICE_INFORMATION', 'DATE_TIME', 'SENSOR_VALUES']);
    target.onError = () => { };
    target.scan = async () => { };
    let disconnectCalled = false;
    target.bluetoothDevice = {
      gatt: {
        connected: false,
        connect: () => new Promise(() => { }), // 永遠に解決しない
        disconnect: () => { disconnectCalled = true; },
      },
    };
    const startedAt = Date.now();
    await assert.rejects(() => target.read('DEVICE_INFORMATION', { connectTimeoutMs: 80 }), (error) => {
      assert.equal(error.code, 'CONNECT_TIMEOUT');
      return true;
    });
    assert.ok(Date.now() - startedAt < 2000, 'rejects promptly');
    assert.ok(disconnectCalled, 'gatt.disconnect() is attempted on timeout');

    // connectTimeoutMs 未指定なら従来どおりタイムアウトしない（100ms 待って未解決のまま）
    const noTimeoutTarget = new OrpheInsole(0);
    noTimeoutTarget.setup(['DEVICE_INFORMATION', 'DATE_TIME', 'SENSOR_VALUES']);
    noTimeoutTarget.onError = () => { };
    noTimeoutTarget.scan = async () => { };
    noTimeoutTarget.bluetoothDevice = { gatt: { connected: false, connect: () => new Promise(() => { }) } };
    let settled = false;
    noTimeoutTarget.read('DEVICE_INFORMATION').then(() => { settled = true; }, () => { settled = true; });
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(settled, false, 'no implicit default timeout');
  }

  {
    // 既定コールバックのログは debug 時のみ / onError は常時 console.error
    const target = new OrpheInsole(0);
    const logs = [];
    const errors = [];
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => logs.push(args);
    console.error = (...args) => errors.push(args);
    try {
      target.debug = false;
      target.onScan('x');
      target.onConnect('SENSOR_VALUES');
      target.onDisconnect();
      assert.equal(logs.length, 0, 'default callbacks are silent without debug');
      target.debug = true;
      target.onScan('x');
      assert.equal(logs.length, 1, 'debug=true restores progress logs');
      target.debug = false;
      target.onError(new Error('always visible'));
      assert.equal(errors.length, 1, 'onError logs regardless of debug');
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }
  }

  // ── 物理切断→再接続後に stale characteristic を使わないこと ──────
  // （実機で確認された再接続リグレッションの回帰テスト。
  //   電波範囲外→gattserverdisconnected→自動再接続の begin() リトライで、
  //   旧接続の characteristic がキャッシュから返され続けると再接続が永遠に失敗する）
  {
    // 世代付きモックGATT: 切断後に古い世代の characteristic 操作は throw する
    let generation = 1;
    const fetchCounts = {};
    function makeGenerationalChar(charUUID) {
      const bornGeneration = generation;
      return {
        uuid: charUUID,
        bornGeneration,
        listeners: [],
        _assertAlive() {
          if (bornGeneration !== generation) {
            throw new Error('GATT operation failed: characteristic from a previous connection');
          }
        },
        startNotifications() { this._assertAlive(); return Promise.resolve(this); },
        stopNotifications() { this._assertAlive(); return Promise.resolve(this); },
        readValue() {
          this._assertAlive();
          const data = new DataView(new ArrayBuffer(20));
          data.setUint8(0, 1);
          data.setUint8(8, 3);
          data.setUint8(9, 3);
          return Promise.resolve(data);
        },
        writeValue() { this._assertAlive(); return Promise.resolve(); },
        addEventListener(_type, handler) { this.listeners.push(handler); },
        removeEventListener(_type, handler) {
          const i = this.listeners.indexOf(handler);
          if (i >= 0) this.listeners.splice(i, 1);
        },
      };
    }
    const gatt = {
      connected: true,
      connect() {
        gatt.connected = true;
        return Promise.resolve({
          getPrimaryService() {
            return Promise.resolve({
              getCharacteristic(charUUID) {
                fetchCounts[charUUID] = (fetchCounts[charUUID] || 0) + 1;
                return Promise.resolve(makeGenerationalChar(charUUID));
              },
            });
          },
        });
      },
      disconnect() { gatt.connected = false; },
    };

    const target = new OrpheInsole(0);
    target.setup(['DEVICE_INFORMATION', 'DATE_TIME', 'SENSOR_VALUES']);
    target.onError = () => { };
    target.scan = async () => { };
    target.bluetoothDevice = { gatt, name: 'MOCK' };

    // 1st connection: 通知 + DEVICE_INFORMATION/DATE_TIME を触ってキャッシュを埋める
    await target.startNotify('SENSOR_VALUES');
    await target.read('DEVICE_INFORMATION');
    await target.read('DATE_TIME');

    // 物理切断（電波範囲外相当）: gatt が落ち、旧 characteristic は無効になる
    gatt.connected = false;
    generation = 2;

    // 再接続後の begin() 相当のシーケンスが stale を掴まず全て成功すること
    // （現行実装では最初の read で gatt.connect() 後、以降の uuid が
    //   旧世代キャッシュにヒットして throw する = レッド）
    const info = await target.read('DEVICE_INFORMATION');
    assert.ok(info, 'read after physical reconnect succeeds');
    await target.write('DEVICE_INFORMATION', [0x0D, 4]);
    await target.read('DATE_TIME');
    await target.startNotify('SENSOR_VALUES');
    assert.equal(fetchCounts[target.ORPHE_DATE_TIME], 2,
      'DATE_TIME characteristic is re-fetched after physical disconnect');
    assert.equal(fetchCounts[target.ORPHE_SENSOR_VALUES], 2,
      'SENSOR_VALUES characteristic is re-fetched after physical disconnect');
  }

  // ── 既存パーサが壊れていないこと（スモーク） ───────────────────
  {
    const data = new DataView(new ArrayBuffer(104));
    data.setUint8(0, 56);
    data.setUint16(1, 7);
    const parsed = parseInsoleSensorValues(data);
    assert.equal(parsed.header, 56);
    assert.equal(parsed.samples.length, 2);
  }

  console.log('insole-stability.test.js passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
