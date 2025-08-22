var orphe_js_version_date = `
Last modified: 2025/08/22 14:23:38
`;
/**
ORPHE-INSOLE.js is javascript library for ORPHE INSOLE Module, inspired by BlueJelly.js
Class形式で記述を変更したバージョン
@module Orphe
@author Tetsuaki BABA
@version 0.9.0

@see https://github.com/Orphe-OSS/ORPHE-INSOLE.js
*/

// 外部スクリプトを読み込む関数
function loadScript(src) {
  const script = document.createElement('script');
  script.src = src;
  script.type = 'text/javascript';
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

// 外部スクリプトの読み込み
loadScript('https://cdn.jsdelivr.net/gh/Orphe-OSS/ORPHE-CORE.js@main/js/float16.min.js');
loadScript('https://cdn.jsdelivr.net/gh/Orphe-OSS/ORPHE-CORE.js@main/js/quaternion.js');


/**
 * 自動的に決められた配列サイズでunshiftしてくれるクラス
 * sensor valuesのデータを保持するクラスです。sensor valuesのデータは、加速度、ジャイロ、クォータニオンの3つのデータを保持します。interpotion処理を行うために、過去のデータを保持する用途に使用します。
 */
class FixedSizeArray {
  constructor(size) {
    this.size = size;
    this.array = [];
  }
  setSize(size) {
    this.size = size;
  }
  push(element) {
    if (this.array.length >= this.size) {
      this.array.shift(); // 先頭の要素を削除
    }
    this.array.push(element); // 新しい要素を追加
  }

  getArray() {
    return this.array;
  }
}




/**
 * Orpheクラス内部で利用されるタイムスタンプクラスです。BLE通信のデータ取得タイミングにおける実測周波数を取得するために利用されます。Orpheクラス内部で本当は宣言したかったのですが、jsdoc がクラス内部クラス定義に対応していないため、外部に出しています。無念。  
 * @class
 */
class OrpheTimestamp {
  /**
   * タイムスタンプクラスのコンストラクタです。
   */
  constructor() {
    this.start = 0;
  }

  /**
   * 前回呼び出した時刻からの経過時間をミリ秒で返します。
   * @returns {number} 前回呼び出した時刻からの経過時間をミリ秒で返します。
   */
  millis() {
    const blenow = performance.now();
    let diff = (blenow - this.start);
    this.start = blenow;
    return diff;
  }
  /**
   * 前回呼び出した時刻からの経過時間を周波数として返します。
   * @returns {float} 周波数[Hz]
   */
  getHz() {
    let t = this.millis();
    if (t <= 15) return -1;
    else return 1000 / t;
  }
}

/**
 * ORPHE CORE Module Javascript class
* @class
* @type {Object} 
* @property {string} ORPHE_INFORMATION "01a9d6b5-ff6e-444a-b266-0be75e85c064" SERVICE_UUID
* @property {string} ORPHE_DEVICE_INFORMATION "24354f22-1c46-430e-a4ab-a1eeabbcdfc0" CHARACTERISTIC_UUID
* 
* @property {string} ORPHE_OTHER_SERVICE "db1b7aca-cda5-4453-a49b-33a53d3f0833" SERVICE_UUID
* @property {string} ORPHE_SENSOR_VALUES "f3f9c7ce-46ee-4205-89ac-abe64e626c0f" CHARACTERISTIC_UUID
* @property {string} ORPHE_STEP_ANALYSIS "4eb776dc-cf99-4af7-b2d3-ad0f791a79dd" CHARACTERISTIC_UUID
*/
class Orphe {
  /**
   * 初期化関数 
   * @param {number}[id=0] id コアの番号（0 or 1）を指定します。
   */
  constructor(id = 0) {

    this.defaultGotData = this.gotData;
    this.timestamp = new OrpheTimestamp();

    Object.defineProperty(this, 'ORPHE_INFORMATION', { value: "01a9d6b5-ff6e-444a-b266-0be75e85c064", writable: true });
    Object.defineProperty(this, 'ORPHE_DEVICE_INFORMATION', { value: "24354f22-1c46-430e-a4ab-a1eeabbcdfc0", writable: true });
    Object.defineProperty(this, 'ORPHE_DATE_TIME', { value: "f53eeeb1-b2e8-492a-9673-10e0f1c29026", writable: true });
    Object.defineProperty(this, 'ORPHE_OTHER_SERVICE', { value: "db1b7aca-cda5-4453-a49b-33a53d3f0833", writable: false });
    Object.defineProperty(this, 'ORPHE_SENSOR_VALUES', { value: "f3f9c7ce-46ee-4205-89ac-abe64e626c0f", writable: false });
    Object.defineProperty(this, 'ORPHE_STEP_ANALYSIS', { value: "4eb776dc-cf99-4af7-b2d3-ad0f791a79dd", writable: false });


    // Initialize member variables
    this.bluetoothDevice = null;
    this.dataCharacteristic = null;// 通知を行うcharacteristicを保持する
    this.dataChangedEventHandlerMap = {}; // イベントハンドラを保持するマップ
    this.hashUUID = {}; // UUIDを保持するハッシュ
    this.hashUUID_lastConnected; // 最後に接続したUUIDを保持する
    this.id = id;
    this.array_device_information = new DataView(new ArrayBuffer(20));// device information用の配列

    /**
   * デバイスインフォメーションを取得して保存しておく連想配列です。begin()を呼び出すとデバイスから値を取得して初期化されます。
   * @property {Object} device_information - デバイス情報
   * @property {number} device_information.battery - バッテリー残量（少ない:0、普通:1、多い:2）
   * @property {number} device_information.lr - コアモジュール取り付け位置（左右情報）
  bit0 : 左右
  bit1 : 0(足底) / 1(足背)
  足底 : 左、右：0=(0000 0000b), 1=(0000 0001b)、
  足背 : 左、右：2(=0000 0010b), 3(=0000 0011b)
   * @property {number} device_information.rec_mode - 記録モード。記録してない, 記録中, 一時停止中：0, 1, 2
   * @property {number} device_information.rec_auto_run - 自動RUN記録　Off, On：0, 1
   * @property {number} device_information.led_brightness - LEDの明るさ（0-255）
   * @property {Object} device_information.range - 加速度とジャイロセンサの感度設定
   * @property {number} device_information.range.acc - 加速度レンジ（ 2, 4, 8, 16(g)：0, 1, 2, 3）
   * @property {number} device_information.range.gyro - ジャイロレンジ（250, 500, 1000, 2000(°/s)：0, 1, 2, 3）
  */
    this.device_information = '';

    /**
     * 歩容解析のデータを保存しておく連想配列です。
     * @property {Object} gait - 歩容解析のデータ
     * @property {number} gait.type - 歩容のタイプ（0: 通常歩行, 1: 走行, 2: ランニング）
     * @property {number} gait.direction - 歩容の向き（0: 前進, 1: 後退, 2: 左, 3: 右）
     * @property {number} gait.calorie - 消費カロリー
     * @property {number} gait.distance - 移動距離
     * @property {number} gait.steps - 歩数
     * @property {number} gait.standing_phase_duration - 立ち上がり時間
     * @property {number} gait.swing_phase_duration - 振り出し時間
     */
    this.gait = {
      type: 0,
      direction: 0,
      calorie: 0,
      distance: 0,
      steps: 0,
      standing_phase_duration: 0,
      swing_phase_duration: 0
    }
    /**
     * ストライドのデータを保存しておく連想配列です。
     * @property {Object} stride - ストライドのデータ
     * @property {number} stride.foot_angle - 足首の角度
     * @property {number} stride.x - X軸方向のストライド
     * @property {number} stride.y - Y軸方向のストライド
     * @property {number} stride.z - Z軸方向のストライド
     * @property {number} stride.steps - 歩数
     * 
     */
    this.stride = {
      foot_angle: 0,
      x: 0,
      y: 0,
      z: 0,
      steps: 0,
    }
    /**
   * プロネーションのデータを保存しておく連想配列です。
   * @property {Object} pronation - プロネーションのデータ
   * @property {number} pronation.landing_impact - 着地衝撃
   * @property {number} pronation.x - X軸方向のプロネーション
   * @property {number} pronation.y - Y軸方向のプロネーション
   * @property {number} pronation.z - Z軸方向のプロネーション
   * @property {number} pronation.steps - 歩数
   */
    this.pronation = {
      landing_impact: 0,
      x: 0,
      y: 0,
      z: 0,
      steps: 0,
    }
    /**
     * 歩数カウントを保存する変数
     */
    this.steps_number = 0;

    /**
     * クォータニオンを保存する連想配列です。
     * @property {Object} quat - クォータニオン
     * @property {number} quat.w - w
     * @property {number} quat.x - x
     * @property {number} quat.y - y
     * @property {number} quat.z - z
     * 
     */
    this.quat = {
      w: 0.0, x: 0.0, y: 0.0, z: 0.0
    }

    /**
     * 加速度値から2回積分で基準フレーム間の移動距離を求めた変数です
     * @property {Object} delta - 距離
     * @property {number} delta.x - X軸方向の距離
     * @property {number} delta.y - Y軸方向の距離
     * @property {number} delta.z - Z軸方向の距離
     *    */
    this.delta = {
      x: 0.0, y: 0.0, z: 0.0
    }

    /**
     * オイラー角を保存する連想配列です。this.quatから計算されています。
     * @property {Object} euler - オイラー角
     * @property {number} euler.pitch - ピッチ
     * @property {number} euler.roll - ロール
     * @property {number} euler.yaw - ヨー
     */
    this.euler = {
      pitch: 0.0,
      roll: 0.0,
      yaw: 0.0
    }

    /**
     * ジャイロセンサの値を保存する連想配列です。
     * @property {Object} gyro - ジャイロセンサの値
     * @property {number} gyro.x - X軸方向のジャイロセンサの値
     * @property {number} gyro.y - Y軸方向のジャイロセンサの値
     * @property {number} gyro.z - Z軸方向のジャイロセンサの値
     */
    this.gyro = {
      x: 0.0, y: 0.0, z: 0.0
    }

    /**
     * 加速度センサの値を保存する連想配列です。
     * @property {Object} acc - 加速度センサの値
     * @property {number} acc.x - X軸方向の加速度センサの値
     * @property {number} acc.y - Y軸方向の加速度センサの値
     * @property {number} acc.z - Z軸方向の加速度センサの値
     */
    this.acc = {
      x: 0.0, y: 0.0, z: 0.0
    }

    /**
     * ジャイロレンジに合わせて変換したジャイロセンサの値を保存する連想配列です。
     * @property {Object} converted_gyro - ジャイロセンサの値
     * @property {number} converted_gyro.x - X軸方向のジャイロセンサの値
     * @property {number} converted_gyro.y - Y軸方向のジャイロセンサの値
     * @property {number} converted_gyro.z - Z軸方向のジャイロセンサの値
     */
    this.converted_gyro = {
      x: 0.0, y: 0.0, z: 0.0
    }

    /**
     * 加速度レンジに合わせて変換した加速度センサの値を保存する連想配列です。
     * @property {Object} converted_acc - 加速度センサの値
     * @property {number} converted_acc.x - X軸方向の加速度センサの値
     * @property {number} converted_acc.y - Y軸方向の加速度センサの値
     * @property {number} converted_acc.z - Z軸方向の加速度センサの値
     */
    this.converted_acc = {
      x: 0.0, y: 0.0, z: 0.0
    }

    /**
     * データ欠損時に線形補完をするかどうかのオプション設定（beginのオプションで設定可能）。この設定は200Hz sensor_valuesのacc, gyro, quatのみに適用されます。
     * 
     * @property {Object} interpolation - 線形補間の設定
     * @property {boolean} interpolation.enabled - 線形補間の有効化/無効化　true: 有効, false: 無効
     * @property {number} interpolation.max_consecutive_missing - 線形補間する最大の連続欠損数
     */
    this.interpolation = {
      enabled: false,
      max_consecutive_missing: 1
    }

    this.history_sensor_values = {
      acc: new FixedSizeArray(4),
      gyro: new FixedSizeArray(4),
      quat: new FixedSizeArray(4),
      press: new FixedSizeArray(4), // 圧力センサの値を保持する配列
      converted_acc: new FixedSizeArray(4),
      converted_gyro: new FixedSizeArray(4)
    }

    this.half_round_trip_time = 0;
    // メンバ変数の初期化ここまで
    //////////////////////////

  }

  /**
  * gotData()がユーザ側でオーバーライドされているかどうかを返す関数です。これを見て，デバッグモード（ORPHE TERMINAL）を有効にするかどうかを判断します。オーバーライドするとgotData()以外の関数はコールバックされません．
  * 
 */
  isGotDataOverridden() {
    return this.gotData !== this.defaultGotData;
  }
  /**
   * UUIDを設定する関数です。UUIDはsetup()で利用するキャラクタリスティック（DEVICE_INFORMATION, SENSOR_VALUES, STEP_ANALYSIS）の指定に利用されます。
   * @param {string} name 
   * @param {string} serviceUUID 
   * @param {string} characteristicUUID 
   * 
   */
  setUUID(name, serviceUUID, characteristicUUID) {
    this.hashUUID[name] = { 'serviceUUID': serviceUUID, 'characteristicUUID': characteristicUUID };
  }
  /**
   * 最初に必要な初期化処理メソッドです。利用するキャラクタリスティック（DEVICE_INFORMATION, SENSOR_VALUES）の指定の他、オプションを指定することができます。通常利用では引数を省略して 今後の機能拡張を見据えたメソッドなので、基本的にはsetup()で呼び出せば良いです。
   * @param {string[]} [string[]=["DEVICE_INFORMATION","DATE_TIME", "SENSOR_VALUES"]] DEVICE_INFORMATION, DATE_TIME, SENSOR_VALUES,
   * @param {object} [options = {interpolation}] - interpolationは未実装
   *
   */
  setup(names = ['DEVICE_INFORMATION', 'DATE_TIME', 'SENSOR_VALUES'],
    options = {
      interpolation: {
        enabled: false, // 線形補間の有効化/無効化
        max_consecutive_missing: 1 // 線形補間する最大の連続欠損数
      }
    }
  ) {

    this.interpolation = options.interpolation;
    this.history_sensor_values.acc.setSize(this.interpolation.max_consecutive_missing);
    this.history_sensor_values.gyro.setSize(this.interpolation.max_consecutive_missing);
    this.history_sensor_values.quat.setSize(this.interpolation.max_consecutive_missing);
    this.history_sensor_values.converted_acc.setSize(this.interpolation.max_consecutive_missing);
    this.history_sensor_values.converted_gyro.setSize(this.interpolation.max_consecutive_missing);

    for (const name of names) {
      if (name == 'DEVICE_INFORMATION') {
        this.setUUID(name, this.ORPHE_INFORMATION, this.ORPHE_DEVICE_INFORMATION);
      }
      else if (name == 'DATE_TIME') {
        this.setUUID(name, this.ORPHE_INFORMATION, this.ORPHE_DATE_TIME);
      }
      else if (name == 'SENSOR_VALUES') {
        this.setUUID(name, this.ORPHE_OTHER_SERVICE, this.ORPHE_SENSOR_VALUES);
      }
    }
  }

  /**
   *  begin BLE connection 
   * SENSOR_VALUESまたはSTEP_ANALYSISのセンサー値の取得を開始します。
   * @param {string} [notification_type="SENSOR_VALUES"] SENSOR_VALUES
   * @async
   * @return {Promise<string>} 
   * 
   */
  async begin(str_type = 'SENSOR_VALUES') {

    this.notification_type = str_type;

    // データストリーミングモードは 100Hzのジャイロ、加速度、圧力、クオータニオンに設定
    /*
    0x01 : リアルタイム(クォータニオン、ジャイロ、加速度)
    0x02 : ところてん
    0x03 : リアルタイム(ジャイロ、加速度、圧力 200Hz相当)※インソールのみ対応
    0x04 : リアルタイム(ジャイロ、加速度、圧力、クォータニオン 100Hz相当)※インソールのみ対応
    */
    await this.setDataStreamingMode(4);

    // DateTimeキャラクタリスティックを利用して時刻を同期する．現在のPC時間とデータ取得にかかる統計値からその分コアの時計を進めておく．
    await this.syncCoreTime();

    return this.startNotify('SENSOR_VALUES')
      .then(() => {
        return "done begin(); SENSOR VALUES";
      })
      .catch(error => {
        this.onError(error);
      });
  }

  /**
   * stop and disconnect GATT connection
   */
  stop() {
    this.reset();
  }


  /**
   * Reset Analysis logs in the core module.
   */
  resetAnalysisLogs() {
    const data = new Uint8Array([0x04]);
    this.write('DEVICE_INFORMATION', data);
  }
  scan(uuid, options = {}) {
    return (this.bluetoothDevice ? Promise.resolve() : this.requestDevice(uuid))
      .catch(error => {
        this.onError(error);
      });
  }
  /**
   * Execute requestDevice()
   * @param {string} uuid 
   * 
   */
  requestDevice(uuid) {
    let options = {
      /*
      ORPHE insole module name: INS0
      */
      filters: [
        {
          services: ['01a9d6b5-ff6e-444a-b266-0be75e85c064', 'db1b7aca-cda5-4453-a49b-33a53d3f0833']
        },
        { namePrefix: ['INS'] }
      ],
      //acceptAllDevices: true,
      optionalServices: [this.hashUUID[uuid].serviceUUID],

      // アドバタイズメントデータへのアクセスを許可
      optionalManufacturerData: [
        // ORPHEのCompany ID（実際の値に要調整）
        // 一般的なCompany IDの範囲で試行
        0x0000 // ORPHE固有のCompany IDがあれば追加
      ]
    }

    return navigator.bluetooth.requestDevice(options)
      .then(device => {
        this.bluetoothDevice = device;
        this.bluetoothDevice.addEventListener('gattserverdisconnected', this.onDisconnect);

        // アドバタイズメント監視を開始してからonScanを実行
        // this.startWatchingAdvertisements();
        this.autoStartWatchingAdvertisements()
        Promise.resolve().then(() => {
          this.onScan(this.bluetoothDevice.name);
        });
        // this.onScan(this.bluetoothDevice.name);
      })
      .catch(error => {
        console.warn('Failed requestDevice:', error);

      });
  }

  /**
   * アドバタイズメント監視を自動開始（機能が利用可能な場合のみ）
   */
  autoStartWatchingAdvertisements() {
    // 機能が利用可能かチェック
    if (!this.bluetoothDevice) {
      return;
    }

    // watchAdvertisementsがサポートされているかチェック
    if (!navigator.bluetooth || !BluetoothDevice.prototype.watchAdvertisements) {
      console.log('Advertisement monitoring not available - Chrome experimental features may be disabled');
      return;
    }

    if (!this.bluetoothDevice.watchAdvertisements) {
      console.warn('watchAdvertisements is not supported on this device/browser');
      return;
    }

    // アドバタイズメント監視を自動開始
    this.startWatchingAdvertisements();
  }

  /**
   * アドバタイズメントデータの監視を開始
   */
  startWatchingAdvertisements() {
    if (!this.bluetoothDevice) {
      console.error('Bluetooth device not available');
      return;
    }

    // watchAdvertisementsがサポートされているかチェック
    if (!this.bluetoothDevice.watchAdvertisements) {
      console.warn('watchAdvertisements is not supported on this device/browser');
      return;
    }

    // アドバタイズメントイベントリスナーを追加
    this.bluetoothDevice.addEventListener('advertisementreceived', (event) => {
      this.onAdvertisementReceived(event);
    });

    // アドバタイズメント監視を開始
    this.bluetoothDevice.watchAdvertisements()
      .then(() => {
        console.log('Started watching advertisements for', this.bluetoothDevice.name);
      })
      .catch(error => {
        console.error('Error starting advertisement watch:', error);
      });
  }

  /**
   * アドバタイズメントデータ受信時のコールバック
   * @param {BluetoothAdvertisingEvent} event 
   */
  onAdvertisementReceived(event) {
    console.log('=== Advertisement Received ===');
    console.log('Device Name:', event.device.name);
    console.log('RSSI:', event.rssi, 'dBm');
    console.log('TX Power:', event.txPower);
    console.log('==============================');
    console.log(event);

    const dv = event.manufacturerData.get(0x0000);

    // カスタムコールバックがあれば呼び出し
    if (this.gotStatus) {
      const status = {
        name: event.device.name,
        rssi: event.rssi,
        txPower: event.txPower,
        id: event.device.id,
        battery: dv.getUint8(14),
        model_type: dv.getUint8(5),
        mounting_position: dv.getUint8(6),
        human_activity_recognition: dv.getUint8(7),
        version: `${dv.getUint8(15)}.${dv.getUint8(16)}.${dv.getUint8(17)}`
      }
      this.gotStatus(status);
    }
  }




  /**
   * アドバタイズメント監視を停止
   */
  stopWatchingAdvertisements() {
    if (this.bluetoothDevice) {
      this.bluetoothDevice.removeEventListener('advertisementreceived', this.onAdvertisementReceived);
      console.log('Stopped watching advertisements');
    }
  }

  /**
   * GATT通信を始めるための関数。read, write, startNotify, stopNotifyが呼び出されるとscanと一緒に呼び出されます。
   * @param {string} uuid 
   *
   */
  connectGATT(uuid) {
    if (!this.bluetoothDevice) {
      var error = "No Bluetooth Device";
      this.onError(error);
      return;
    }
    if (this.bluetoothDevice.gatt.connected && this.dataCharacteristic) {
      if (this.hashUUID_lastConnected == uuid)
        return Promise.resolve();
    }
    this.hashUUID_lastConnected = uuid;

    return this.bluetoothDevice.gatt.connect()
      .then(server => {
        return server.getPrimaryService(this.hashUUID[uuid].serviceUUID);
      })
      .then(service => {
        return service.getCharacteristic(this.hashUUID[uuid].characteristicUUID);
      })
      .then(characteristic => {
        this.dataCharacteristic = characteristic;
        this.onConnectGATT(uuid);
        this.onConnect(uuid);

        // アドバタイズメント監視を自動開始（機能が利用可能な場合のみ）
        this.autoStartWatchingAdvertisements();
      })
      .catch(error => {
        this.onError(error);
      });
  }
  /**
   * サーバからのデータを受信したときに呼び出される関数です。この関数は、characteristicvaluechangedイベントが発生したときに呼び出されます。
   * @param {function} self 
   * @param {string} uuid 
   * 
   */
  dataChanged(self, uuid) {
    return function (event) {
      self.onRead(event.target.value, uuid);
    }
  }
  /**
   * サーバからデータを読み込む。notificationからはonReadで呼び出されるので、この関数を利用するのは DEVICE_INFORMATION characteristicのみです。
   * @param {string} uuid DEVICE_INFORMATION
   * 
   */
  read(uuid) {
    return (this.scan(uuid))
      .then(() => {
        return this.connectGATT(uuid);
      })
      .then(() => {
        return this.dataCharacteristic.readValue();
      })
      .catch(error => {
        this.onError(error);
      });
  }
  /**
   * write data to the BLE device。実際にwriteを利用するのは DEVICE_INFORMATION characteristicのみです。
   * @param {string} uuid DEVICE_INFORMATION, SENSOR_VALUES, STEP_ANALYSIS
   * @param {dataView} array_value write bytes
   * 
   */
  write(uuid, array_value) {
    return (this.scan(uuid))
      .then(() => {
        return this.connectGATT(uuid);
      })
      .then(() => {
        const data = Uint8Array.from(array_value);
        return this.dataCharacteristic.writeValue(data);
      })
      .then(() => {
        this.onWrite(uuid);
      })
      .catch(error => {
        this.onError(error);
      });
  }
  /**
   * Start Notification
   * @param {string} uuid 
   * 
   */
  startNotify(uuid) {
    return this.scan(uuid)
      .then(() => this.connectGATT(uuid))
      .then(() => this.dataCharacteristic.startNotifications())
      .then(() => {
        this.dataChangedEventHandlerMap[uuid] = this.dataChanged(this, uuid);
        this.dataCharacteristic.addEventListener('characteristicvaluechanged', this.dataChangedEventHandlerMap[uuid]);
        this.onStartNotify(uuid);
      })
      .catch(error => {
        console.error('startNotify: Error : ' + error);
        this.onError(error);
      });
  }
  /**
   * Stop Notification
   * @param {string} uuid 
   * 
   */
  stopNotify(uuid) {
    return this.scan(uuid) // BLEデバイスのスキャンを開始します。
      .then(() => {
        return this.connectGATT(uuid); // GATTサーバーに接続します。
      })
      .then(() => {
        // stopNotificationsメソッドを呼び出してNotificationを停止します。
        // このメソッドはPromiseを返すため、その完了を待つ必要があります。
        return this.dataCharacteristic.stopNotifications();
      })
      .then(() => {
        // Notificationを停止した後のコールバック関数を呼び出します。
        // this.dataCharacteristic.removeEventListener('characteristicvaluechanged', this.dataChanged(this, uuid));
        // イベントハンドラを解除
        if (this.dataChangedEventHandlerMap[uuid]) {
          this.dataCharacteristic.removeEventListener(
            'characteristicvaluechanged',
            this.dataChangedEventHandlerMap[uuid]
          );
          // 登録されたハンドラをマップから削除
          delete this.dataChangedEventHandlerMap[uuid];
        }
        this.onStopNotify(uuid);
      })
      .catch(error => {
        this.onError(error);
      });

  }
  isConnected() {
    if (!this.bluetoothDevice) {
      return false;
    }
    return this.bluetoothDevice.gatt.connected;
  }

  /**
   * BLEデバイスとの接続を切断します。デバイス接続をマニュアルで切断する場合には reset() を利用してください。切断だけでなくクラス内のメンバ変数もクリア初期化する必要があり、reset()を利用するとそれらの処理が行われます。
   * 
   */
  disconnect() {
    if (!this.bluetoothDevice) {
      var error = "No Bluetooth Device";
      this.onError(error);
      return;
    }

    // アドバタイズメント監視を停止
    this.stopWatchingAdvertisements();

    if (this.bluetoothDevice.gatt.connected) {
      this.bluetoothDevice.gatt.disconnect();
    } else {
      var error = "Bluetooth Device is already disconnected";
      this.onError(error);
      return;
    }
  }
  /**
   * this.device_informationの連想配列形式でデータを渡すことで、コアモジュールのデバイス設定ができます。
   * @param {object} obj 
   */
  setDeviceInformation(obj) {
    const senddata = new Uint8Array([0x01, obj.lr, obj.led_brightness, 0, obj.rec_auto_run, obj.time01, obj.time02, obj.range.acc, obj.range.gyro]);
    this.write('DEVICE_INFORMATION', senddata);
  }

  /**
   * Sets the data streaming mode for the device.
   *
   * @param {number} mode - The streaming mode to set. Should be a valid mode value recognized by the device.
   * @returns {Promise<void>}
   */
  async setDataStreamingMode(mode = 4) {
    const data = new Uint8Array([0x0D, mode]);
    await this.write('DEVICE_INFORMATION', data);
  }


  /**
   * COREモジュールの時刻を PCの時刻 + random_trip_time/2 で同期します。
   * 
   * @param {number}[n=3] n - 平均値算出のためのサンプル数
   * @return {object} {sum_round_trip_time, average_round_trip_time, standard_time, adjusted_time, round_trip_times}
   */
  async syncCoreTime(n = 3) {
    let average_round_trip_time = 0;
    let sum_round_trip_time = 0;
    let core_time;
    let round_trip_times = [];
    for (let i = 0; i < n; i++) {
      core_time = await this.getDateTime();
      sum_round_trip_time += core_time.round_trip_time;
      round_trip_times.push(core_time.round_trip_time);
    }
    average_round_trip_time = sum_round_trip_time / n;
    const now = new Date();
    const standard_time = now.getTime();
    const adjusted_time = parseInt(standard_time + Math.round(average_round_trip_time / 2));
    core_time.date.setTime(adjusted_time);

    await this.setDateTime(core_time.date);
    this.half_round_trip_time = Math.round(average_round_trip_time / 2);
    return { sum_round_trip_time, average_round_trip_time, standard_time, adjusted_time, round_trip_times };

  }
  /**
   * [YY, MM, DD, hh, mm, ss, (sub)ss]の配列を渡すことで、コアモジュールの日時設定ができます。
   */
  async setDateTime(set_date) {
    const array = new Uint8Array(7);
    array[0] = set_date.getFullYear() - 2000;
    array[1] = set_date.getMonth() + 1;
    array[2] = set_date.getDate();
    array[3] = set_date.getHours();
    array[4] = set_date.getMinutes();
    array[5] = set_date.getSeconds();
    array[6] = parseInt(set_date.getMilliseconds() / 10);
    const senddata = new Uint8Array([array[0], array[1], array[2], array[3], array[4], array[5], array[6]]);
    await this.write('DATE_TIME', senddata);
  }

  /**
   * 接続情報をクリアします。
   */
  clear() {
    this.bluetoothDevice = null;
    this.dataCharacteristic = null;
    this.onClear();
  }
  /**
   * reset(disconnect & clear)
   */
  reset() {
    this.disconnect(); //disconnect() is not Promise Object
    this.clear();
    this.onReset();
  }





  // Readコールバック
  /**
   * Incoming byte callback function. コアモジュールから送信されるデータを受信するコールバック関数です。それぞれのUUIDに対応するデータを正しく整形して対応するコールバック関数に渡します。ユーザはコールバック関数を手元のコードでオーバーライドして利用します。gotData()がユーザによってオーバーライドされている場合は、gotData以外のnotifyに伴うコールバック関数はすべて呼び出されないことに注意してください。
   * @param {dataView} data incoming bytes
   * @param {string} uuid 
   */
  onRead(data, uuid) {
    let ret = this.timestamp.getHz();
    if (ret > 0) this.gotBLEFrequency(ret);

    // 生データモニタリングの場合はそのままデータをgotDataで渡して、returnする（データ欠損以外の他の処理は行わない）
    if (this.isGotDataOverridden() == true) {
      this.gotData(data, uuid);
      // データ欠損チェック
      if (uuid == 'SENSOR_VALUES') {
        // 50,55,56がリアルタームデータ取得時の先頭ヘッダ 
        if (data.getUint8(0) == 50 || data.getUint8(0) == 55 || data.getUint8(0) == 56) {
          if (this.serial_number) {
            const serial_number_prev = this.serial_number;
            this.serial_number = data.getUint16(1);

            // データ欠損が生じた場合
            if (this.serial_number - serial_number_prev != 1) {

              // 線形補完を有効にしている場合
              if (this.interpolation.enabled == true) {

              }
              // ユーザ用コールバック関数の呼び出し
              this.lostData(this.serial_number, serial_number_prev);

            }

          }
          else {
            this.serial_number = data.getUint16(1);
          }
        }
      }
      return;
    }

    // デバイス情報Readの場合    
    if (uuid == 'DEVICE_INFORMATION') {
    }
    else if (uuid == 'SENSOR_VALUES') {
      let t_start = 0;
      let timestamp;
      // 一旦固定値
      let gyroRange = 2000;
      let accRange = 16;

      // データ欠損チェック
      if (this.serial_number) {
        const serial_number_prev = this.serial_number;
        this.serial_number = data.getUint16(1);
        if (this.serial_number - serial_number_prev != 1) {
          this.lostData(this.serial_number, serial_number_prev);
        }
      }
      else {
        this.serial_number = data.getUint16(1);
      }

      // エラー処理
      if (data.byteLength != 104) {
        console.warn("SENSOR VALUES: Data length is not 104");
        return
      }


      // COREから送られてきたタイムスタンプをUNIXタイムスタンプに変換
      function toTimestamp(hours, minutes, seconds, milliseconds) {
        // 現在の日付を取得
        const now = new Date();

        // Dateオブジェクトに時間を設定
        now.setHours(hours);
        now.setMinutes(minutes);
        now.setSeconds(seconds);
        now.setMilliseconds(milliseconds);

        // タイムスタンプ（ミリ秒）を返す
        return now.getTime();
      }
      timestamp = toTimestamp(
        data.getUint8(3),
        data.getUint8(4),
        data.getUint8(5),
        data.getUint16(6)
      )

      gyroRange = 2000;
      accRange = 16;
      t_start = timestamp;

      if (data.getUint8(0) == 50) {
        // それぞれの値は29毎で、4つ分ある。データの順番は古いデータから順番にpushされている。なので、最新が4番目、最古が1番目となる。
        for (let i = 3; i >= 0; i--) {

          // 2番目以降のtimestampは最初のタイムスタンプとの差分になっているため
          // t_startに数値を足す処理を行って、各パケットのtimestampを算出する
          if (i == 3) {
            timestamp = t_start;
          }
          else {
            timestamp = timestamp + data.getUint8(28 + 21 * i);
          }
          this.quat = {
            w: data.getInt16(8 + 21 * i) / 32768,
            x: data.getInt16(10 + 21 * i) / 32768,
            y: data.getInt16(12 + 21 * i) / 32768,
            z: data.getInt16(14 + 21 * i) / 32768,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 3 - i
          }
          this.history_sensor_values.quat.push(this.quat);

          this.gyro = {
            x: data.getInt16(16 + 21 * i) / 32768,
            y: data.getInt16(18 + 21 * i) / 32768,
            z: data.getInt16(20 + 21 * i) / 32768,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 3 - i
          }
          this.history_sensor_values.gyro.push(this.gyro);

          this.acc = {
            x: data.getInt16(22 + 21 * i) / 32768,
            y: data.getInt16(24 + 21 * i) / 32768,
            z: data.getInt16(26 + 21 * i) / 32768,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 3 - i
          }
          this.history_sensor_values.acc.push(this.acc);

          // ジャイロと加速度補正をかけたものを別途作成
          this.converted_gyro = {
            x: this.gyro.x * gyroRange,
            y: this.gyro.y * gyroRange,
            z: this.gyro.z * gyroRange,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 3 - i
          };
          this.history_sensor_values.converted_gyro.push(this.converted_gyro);

          this.converted_acc = {
            x: this.acc.x * accRange,
            y: this.acc.y * accRange,
            z: this.acc.z * accRange,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 3 - i
          };
          this.history_sensor_values.converted_acc.push(this.converted_acc);

          this.gotAcc(this.acc);
          this.gotQuat(this.quat);
          this.gotGyro(this.gyro);
          this.gotConvertedAcc(this.converted_acc);
          this.gotConvertedGyro(this.converted_gyro);
          let q = new Quaternion(this.quat.w, this.quat.x, this.quat.y, this.quat.z);
          this.euler = q.toEuler();
          this.gotEuler(this.euler);
        }

      }
      // 200Hz：ジャイロ、加速度、圧力
      else if (data.getUint8(0) == 55) {
        // それぞれの値は34毎で、4つ分ある。データの順番は順番にpushされている。なので、最新が1番目、最古が4番目となる。
        let offset = 24;
        for (let i = 3; i >= 0; i--) {

          timestamp = t_start;

          this.gyro = {
            x: data.getInt16(8 + offset * i) / 32768,
            y: data.getInt16(10 + offset * i) / 32768,
            z: data.getInt16(12 + offset * i) / 32768,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 3 - i
          }
          this.history_sensor_values.gyro.push(this.gyro);

          this.acc = {
            x: data.getInt16(14 + offset * i) / 32768,
            y: data.getInt16(16 + offset * i) / 32768,
            z: data.getInt16(18 + offset * i) / 32768,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 3 - i
          }
          this.history_sensor_values.acc.push(this.acc);

          this.press = {
            values: [
              data.getUint16(20 + offset * i),
              data.getUint16(22 + offset * i),
              data.getUint16(24 + offset * i),
              data.getUint16(26 + offset * i),
              data.getUint16(28 + offset * i),
              data.getUint16(30 + offset * i)
            ],
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 3 - i
          }
          this.history_sensor_values.press.push(this.press);

          // ジャイロと加速度補正をかけたものを別途作成
          this.converted_gyro = {
            x: this.gyro.x * gyroRange,
            y: this.gyro.y * gyroRange,
            z: this.gyro.z * gyroRange,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 3 - i
          };
          this.history_sensor_values.converted_gyro.push(this.converted_gyro);

          this.converted_acc = {
            x: this.acc.x * accRange,
            y: this.acc.y * accRange,
            z: this.acc.z * accRange,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 3 - i
          };
          this.history_sensor_values.converted_acc.push(this.converted_acc);

          this.gotAcc(this.acc);
          this.gotGyro(this.gyro);
          this.gotConvertedAcc(this.converted_acc);
          this.gotConvertedGyro(this.converted_gyro);
          this.gotPress(this.press);
        }
      }
      // 100Hz：ジャイロ、加速度、圧力、クオータニオン
      else if (data.getUint8(0) == 56) {
        // それぞれの値は34毎で、2つ分ある。データの順番は順番にpushされている。なので、最新が1番目、最古が2番目となる。関数呼び出しは古いデータから順番に行いたいので逆順のループを利用する。
        let offset = 32;
        for (let i = 1; i >= 0; i--) {
          timestamp = t_start;

          this.quat = {
            w: data.getInt16(8 + offset * i) / 32768,
            x: data.getInt16(10 + offset * i) / 32768,
            y: data.getInt16(12 + offset * i) / 32768,
            z: data.getInt16(14 + offset * i) / 32768,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 1 - i
          }
          this.history_sensor_values.quat.push(this.quat);


          this.gyro = {
            x: data.getInt16(16 + offset * i) / 32768,
            y: data.getInt16(18 + offset * i) / 32768,
            z: data.getInt16(20 + offset * i) / 32768,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 1 - i
          }
          this.history_sensor_values.gyro.push(this.gyro);

          this.acc = {
            x: data.getInt16(22 + offset * i) / 32768,
            y: data.getInt16(24 + offset * i) / 32768,
            z: data.getInt16(26 + offset * i) / 32768,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 1 - i
          }
          this.history_sensor_values.acc.push(this.acc);

          this.press = {
            values: [
              data.getUint16(28 + offset * i),
              data.getUint16(30 + offset * i),
              data.getUint16(32 + offset * i),
              data.getUint16(34 + offset * i),
              data.getUint16(36 + offset * i),
              data.getUint16(38 + offset * i)
            ],
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 1 - i
          }
          this.history_sensor_values.press.push(this.press);



          // ジャイロと加速度補正をかけたものを別途作成
          this.converted_gyro = {
            x: this.gyro.x * gyroRange,
            y: this.gyro.y * gyroRange,
            z: this.gyro.z * gyroRange,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 1 - i
          };
          this.history_sensor_values.converted_gyro.push(this.converted_gyro);

          this.converted_acc = {
            x: this.acc.x * accRange,
            y: this.acc.y * accRange,
            z: this.acc.z * accRange,
            timestamp: timestamp,
            serial_number: this.serial_number,
            packet_number: 1 - i
          };
          this.history_sensor_values.converted_acc.push(this.converted_acc);

          this.gotQuat(this.quat);
          let q = new Quaternion(this.quat.w, this.quat.x, this.quat.y, this.quat.z);
          this.euler = q.toEuler();
          this.gotEuler(this.euler);
          this.gotAcc(this.acc);
          this.gotGyro(this.gyro);
          this.gotConvertedAcc(this.converted_acc);
          this.gotConvertedGyro(this.converted_gyro);
          this.gotPress(this.press);
        }
      }

    }
  }

  /**
   * Date Timeを取得する
   * 0	year	0-255	西暦から2000を引いた数
   * 1	month		
   * 2	day		
   * 3	hour		
   * 4	minute		
   * 5	second		
   * 6	subsecond
   * 
   * @returns {Promise<object>} date_timeを連想配列形式{timestamp, data,round_trip_time}で返す。dataにはCOREから直接送信されてきたdataviewが格納されている。round_trip_timeはデータを取得にかかった時間[ms]。
   */
  async getDateTime() {
    return new Promise((resolve, reject) => {
      const startTime = performance.now(); // 関数開始時の時間を取得
      this.read('DATE_TIME').then((data) => {
        const endTime = performance.now(); // データの取得が完了したので，時間を記録
        const date = new Date(
          data.getUint8(0) + 2000,
          data.getUint8(1),
          data.getUint8(2),
          data.getUint8(3),
          data.getUint8(4),
          data.getUint8(5),
          data.getUint8(6) * 10 // 10ms単位で送られてくる
        );
        const elapsedTime = endTime - startTime; // 経過時間を計算
        this.date_time = {
          date: date,
          data: data,
          round_trip_time: Math.floor(elapsedTime)
        };
        resolve(this.date_time);
      }).catch(error => {  // ダイアログのキャンセルはそのまま閉じる
        console.log('Error: ' + error);
        this.onError(error);
        reject(error);
      });
    });
  }

  /**
   * 呼び出すと現在のデバイス設定を取得します。連想配列形式でリターンされます。asyncに対応させているので、awaitを利用して呼び出すことをおすすめします。
   * @returns {Promise<object>} device_informationを連想配列形式で返す
   */
  async getDeviceInformation() {
    return new Promise((resolve, reject) => {
      this.read('DEVICE_INFORMATION').then((data) => {
        this.array_device_information.setUint8(0, 1);
        this.array_device_information.setUint8(1, data.getUint8(1));
        this.array_device_information.setUint8(2, data.getUint8(4));
        this.array_device_information.setUint8(3, data.getUint8(5));
        this.array_device_information.setUint8(4, data.getUint8(3));
        this.array_device_information.setUint8(5, data.getUint8(6));
        this.array_device_information.setUint8(6, data.getUint8(7));
        this.array_device_information.setUint8(7, data.getUint8(8));
        this.array_device_information.setUint8(8, data.getUint8(9));
        for (let i = 9; i <= 19; i++) {
          this.array_device_information.setUint8(i, 0);
        }
        this.device_information = {
          battery: data.getUint8(0),
          lr: data.getUint8(1),
          rec_mode: data.getUint8(2),
          rec_auto_run: data.getUint8(3),
          led_brightness: data.getUint8(4),
          range: {
            acc: data.getUint8(8),
            gyro: data.getUint8(9)
          },
          data: data
        }
        resolve(this.device_information);
      }).catch(error => {  // ダイアログのキャンセルはそのまま閉じる
        console.log('Error: ' + error);
        this.onError(error);
        reject(error);
      });
    });
  }


  //--------------------------------------------------
  //一般開発ユーザからアクセス可能な関数のプロトタイプ定義
  /**
   * ORPHE TERMINAL用に作成した関数。onReadで受け取ったデータをそのまま渡す。このメソッドがユーザ側でオーバーライドされると、その他のnotifyに伴うコールバック関数（gotAcc等）はすべて呼び出されなくなるので注意してください。dataview形式なので、取り扱い方法については ORPHE TERMINALのソースを参照するとよい。
   * @param {dataview} data onReadで取得したすべてのデータ
   */
  gotData(data) { }


  /**
   * Handles the received status.
   * @param {Object} status - The status object containing device advertisement information.
   * @param {string} status.name - デバイス名
   * @param {number} status.rssi - 受信信号強度 (dBm)
   * @param {number} status.txPower - 送信出力 (dBm)
   * @param {string} status.id - デバイスID
   * @param {number} status.battery - バッテリー残量
   * @param {number} status.model_type - モデルタイプ
   * @param {number} status.mounting_position - 取り付け位置
   * @param {number} status.human_activity_recognition - 人間活動認識
   * @param {string} status.version - ファームウェアバージョン (例: "1.2.3")
   */
  gotStatus(status) {
  }
  /**
   * コアモジュールの圧力情報を取得する
   * @param {Object} press {values[],timestamp,packet_number} 圧力の取得
   */
  gotPress(press) { }

  /**
   * コアモジュールのクオータニオン情報を取得する
   * @param {Object} quat {w,x,y,z} クオータニオンの取得
   */
  gotQuat(quat) { }
  /**
   * ジャイロ（x,y,zの角速度）を取得する
   * @param {Object} gyro {x,y,z} ジャイロの取得
   */
  gotGyro(gyro) { }
  /**
   * 加速度を取得する。加速度レンジに応じて変換された値がほしい場合は、gotConvertedAccを利用すること
   * 対応CharacteristicはSENSOR_VALUES
   * @param {Object} acc {x,y,z} 加速度の取得
   */
  gotAcc(acc) { }
  /**
   * ジャイロレンジに応じて変換された値を取得する。
   * @param {Object} gyro {x,y,z} ジャイロレンジに応じて変換したジャイロの取得
   */
  gotConvertedGyro(gyro) { }
  /**
   * コアモジュールで設定されている加速度レンジに応じて変換された値を取得する。
   * @param {Object} acc {x,y,z} 加速度レンジに応じて変換した加速度の取得
   */
  gotConvertedAcc(acc) { }
  /**
   * 加速度値を2回積分して各x,y,zの単位時間の移動距離を取得する。
   * @param {Object} delta {x,y,z} x,y,zの前回フレームからの移動距離
   */
  gotDelta(delta) { }
  /**
   * コアモジュールのオイラー角を取得する。オイラー角の取得は破綻する可能性があるため、姿勢を取る場合はクオータニオンを利用すること
   * @param {Object} euler {pitch, roll, yaw} オイラー角
   */
  gotEuler(euler) { }
  /**
   * 歩容解析の取得
   * @param {Object} gait {type, direction, calorie, distance} 歩行解析の取得
   */
  gotGait(gait) { }
  /**
   * 現在の歩容タイプを取得する
   * @param {Object} type {value} 0:none, 1:walk, 2:run, 3:stand 
   */
  gotType(type) { }
  /**
   * ランニングの方向を取得する
   * @param {Object} direction {value} 0:none, 1:foward, 2:backward, 3:inside, 4:outside
   */
  gotDirection(direction) { }
  /**
   * 総消費カロリーを取得する
   * @param {Object} calorie {value}
   */
  gotCalorie(calorie) { }

  /**
   * 総移動距離を取得する
   * @param {Object} distance {value} 
   */
  gotDistance(distance) { }

  /**
   * 立脚期継続時間[s]を取得する
   * @param {*} standing_phase_duration 
   */
  gotStandingPhaseDuration(standing_phase_duration) { }

  /**
   * 遊脚期継続時間[s]を取得する
   * @param {*} swing_phase_duration 
   */
  gotSwingPhaseDuration(swing_phase_duration) { }
  /**
   * ストライド[m]の取得
   * @param {Object} stride {x,y,z}
   */
  gotStride(stride) { }
  /**
   * 着地角度[degree]の取得
   * @param {Object} foot_angle {value}
   */
  gotFootAngle(foot_angle) { }

  /**
   * プロネーション[degree]の取得
   * @param {Object} pronation {x,y,z}
   */
  gotPronation(pronation) { }
  /**
   * 着地衝撃力[kgf/weight]の取得
   * @param {Object} landing_impact {value}
   */
  gotLandingImpact(landing_impact) { }
  /**
   * 現在までの歩数を取得する
   * @param {Object} steps_number {value}
   */
  gotStepsNumber(steps_number) { }

  /**
   * 以前来たデータとのシリアルナンバーの差が1でない場合に呼び出される。SENSOR_VALUESのcharacteristicを利用し、かつ、200Hzのデータ取得のモデル（CR-3）のみで利用可能。50Hzの加速度センサーのデータ取得モデル（CR-2）では利用できない。
   * @param {number} serial_number - 現在のシリアルナンバー
   * @param {number} serial_number_prev - 一つ前に受診したデータのシリアルナンバー
   */
  lostData(serial_number, serial_number_prev) { }

  onScan(deviceName) { console.log("onScan"); }
  onConnectGATT(uuid) { console.log("onConnectGATT"); }
  onConnect(uuid) { console.log("onConnect"); }
  onWrite(uuid) { console.log("onWrite"); }
  onStartNotify(uuid) { console.log("onStartNotify", uuid); }
  onStopNotify(uuid) { console.log("onStopNotify", uuid); }
  onDisconnect() { console.log("onDisconnect"); }

  /**
   * アドバタイズメントデータを受信した時に呼び出される
   * @param {BluetoothAdvertisingEvent} event - アドバタイズメントイベント
   */
  onAdvertisement(event) { console.log("onAdvertisement", event); }

  /**
   * notification frequencyの実測値を取得する
   * @param {float} frequency 
   */
  gotBLEFrequency(frequency) { }
  onClear() { console.log("onClear"); }
  onReset() { console.log("onReset"); }
  onError(error) { console.log("onError: ", error); }

  //一般開発ユーザからアクセス可能な関数の定義ここまで
  //--------------------------------------------------
}