// v1.1.0 で追加した接続安定化まわりのユニットテスト。
// BLE 実機を使わずに検証できる純粋ロジックのみを対象とする。
const assert = require('node:assert/strict');

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
    while (!sensorChar.releaseStartNotifications) {
      await new Promise((resolve) => setImmediate(resolve));
    }
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
