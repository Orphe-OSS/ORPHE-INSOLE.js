var coreCompanionToolkit_version_date = `
Last modified: 2026/07/26 00:00:00
`;
coreCompanionToolkit_version_date = coreCompanionToolkit_version_date.replace(/\n/g, '');

/**
 * CoreCompanionToolkit.js
 *
 * ORPHE INSOLE のページに ORPHE CORE を1台だけ「同居接続」するための
 * 接続GUIツールキット。
 *
 * CORE 用の CoreToolkit.js は InsoleToolkit.js とグローバル変数
 * （bles/cores）と DOM ID（switch_ble0 等）が衝突するため同一ページに
 * 読み込めません。本ファイルは core_ 名前空間の DOM ID と独立した
 * グローバル `orpheCore` を使うことで、InsoleToolkit の 2 足接続と
 * 共存できるようにしたものです。
 *
 * 依存:
 *   - ORPHE-CORE.js（必須。ORPHE-INSOLE.js とは別 SDK）
 *     <script src="https://cdn.jsdelivr.net/gh/Orphe-OSS/ORPHE-CORE.js@main/js/ORPHE-CORE.js"></script>
 *     を ORPHE-INSOLE.js より前に読み込むこと（後でも動作するが前を推奨）
 *   - Bootstrap 5 (CSS/JS) + bootstrap-icons
 *   - InsoleToolkit.js は必須ではない（単独でも使える）
 */

/**
 * buildCoreCompanionToolkit() が生成する ORPHE CORE インスタンス（1台のみ）。
 * insoles[0]/insoles[1]（OrpheInsole）とは独立しています。
 * @type {Orphe|null}
 */
var orpheCore = null;

/**
 * ORPHE CORE が同一ページに読み込まれているか判定する。
 * ORPHE-INSOLE.js 単独読み込み時は後方互換のため `Orphe` が
 * OrpheInsole のエイリアスになるので、単なる typeof では判定できない。
 * @returns {boolean}
 */
function isOrpheCoreSdkLoaded() {
    try {
        if (typeof Orphe !== 'function') return false;
        if (typeof OrpheInsole === 'function' && Orphe === OrpheInsole) return false;
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * ORPHE CORE 1台分の接続GUIを生成する。
 * @param {Element} parent_element - UIを追加する親要素
 * @param {string} title - タイトル。トグルボタンの横に表示される
 * @param {object} [options]
 *   - notification: 'STEP_ANALYSIS' | 'SENSOR_VALUES' | 'STEP_ANALYSIS_AND_SENSOR_VALUES'
 *     （デフォルト 'STEP_ANALYSIS_AND_SENSOR_VALUES'）
 *   - range: { acc: 2|4|8|16, gyro: 250|500|1000|2000 }（デフォルト {acc:16, gyro:2000}）
 *   - autoReconnect: boolean（デフォルト false。ORPHE-CORE.js 側の実装に委譲）
 *   - connectTimeoutMs: number（デフォルト 20000。CORE SDK の begin() は
 *     notify 開始失敗時に settle しない既知の問題があるため、タイムアウトで
 *     接続失敗として扱いトグルを戻す）
 *   - chooserNamePrefix: string（デフォルト 'CR-'。デバイス選択ダイアログの
 *     namePrefix フィルタ。CORE SDK 標準の services フィルタは、実機 CORE の
 *     アドバタイズにサービスUUIDが含まれないため chooser に何も表示されない。
 *     namePrefix と services の OR フィルタに差し替えて回避する）
 * @returns {Orphe} 生成した ORPHE CORE インスタンス（グローバル orpheCore と同一）
 */
function buildCoreCompanionToolkit(parent_element, title, options = {}) {
    if (!isOrpheCoreSdkLoaded()) {
        throw new Error(
            'buildCoreCompanionToolkit: ORPHE-CORE.js の読み込みが必要です。' +
            '<script src="https://cdn.jsdelivr.net/gh/Orphe-OSS/ORPHE-CORE.js@main/js/ORPHE-CORE.js"></script> ' +
            'を ORPHE-INSOLE.js より前に追加してください。' +
            '（ORPHE-INSOLE.js 単独では Orphe は INSOLE のエイリアスであり CORE には接続できません）'
        );
    }
    if (typeof options.notification === 'undefined') options.notification = 'STEP_ANALYSIS_AND_SENSOR_VALUES';
    if (typeof options.range === 'undefined') options.range = { acc: 16, gyro: 2000 };
    if (typeof options.autoReconnect === 'undefined') options.autoReconnect = false;
    if (typeof options.connectTimeoutMs === 'undefined') options.connectTimeoutMs = 20000;
    if (typeof options.chooserNamePrefix === 'undefined') options.chooserNamePrefix = 'CR-';

    if (!orpheCore) {
        orpheCore = new Orphe(0);
        orpheCore.setup();
    }
    orpheCore._coreCompanionOptions = options;
    patchCoreCompanionRequestDevice(orpheCore, options.chooserNamePrefix);
    patchCoreCompanionOnRead(orpheCore);

    let div_form_check = CCTbuildElement('div', '', 'form-check form-switch d-flex', '', parent_element);
    div_form_check.id = 'core_toolkit0';

    // toggle and title
    let input = CCTbuildElement('input', '', 'form-check-input position-relative', '', div_form_check);
    input.setAttribute('type', 'checkbox');
    input.setAttribute('role', 'switch');
    input.setAttribute('id', 'switch_core0');
    input.setAttribute('title', `coreCompanionToolkit_version_date: ${coreCompanionToolkit_version_date}`);
    input.addEventListener('change', function () {
        toggleCoreCompanion(this);
    });
    CCTbuildElement('label', title, 'form-check-label ms-1', '', div_form_check);

    let span_group = CCTbuildElement('span', '', '', '', div_form_check);
    span_group.id = 'ui_core0';
    span_group.style.visibility = 'hidden';

    // 実測周波数
    let span_activity = CCTbuildElement('span',
        `<i class="bi bi-activity position-relative">
        <span class="position-absolute top-0 start-50 translate-middle badge text-muted" style="font-size:0.2em;"
          id="freq_core0">
        </span>
      </i>`,
        'text-muted ms-1', '', span_group);
    span_activity.id = 'icon_bluetooth_core0';

    // バッテリー
    let span_battery = CCTbuildElement('span', `<i class="bi bi-battery"></i>`, 'text-muted ms-1', '', span_group);
    span_battery.id = 'icon_battery_core0';
    span_battery.addEventListener('click', function () {
        updateCoreCompanionBatteryInfo();
    });

    // LEDトグル
    let span_led = CCTbuildElement('span', `<i class="bi bi-lightbulb"></i>`, 'text-muted ms-1', '', span_group);
    span_led.id = 'icon_led_core0';
    span_led.setAttribute('title', 'toggle LED');
    span_led.addEventListener('click', function () {
        toggleCoreCompanionLED();
    });

    // 設定モーダル
    let span_settings = CCTbuildElement('span', `<i class="bi bi-gear"></i>`, 'text-muted ms-1', '', span_group);
    span_settings.id = 'icon_settings_core0';
    span_settings.setAttribute('title', 'settings for ORPHE CORE');
    span_settings.setAttribute('data-bs-toggle', 'modal');
    span_settings.setAttribute('data-bs-target', '#settings_modal_core0');
    span_settings.addEventListener('click', function () {
        updateCoreCompanionModalParameters();
    });

    let div_modal = CCTbuildElement('div', '', 'modal fade', '', span_group);
    div_modal.id = 'settings_modal_core0';
    div_modal.setAttribute('tabindex', '-1');
    div_modal.setAttribute('aria-hidden', 'true');
    let div_modal_dialog = CCTbuildElement('div', '', 'modal-dialog text-dark', '', div_modal);
    let div_modal_content = CCTbuildElement('div', '', 'modal-content', '', div_modal_dialog);
    CCTbuildElement('div', `<h5 class="modal-title"><i class="bi bi-gear"></i> ORPHE CORE Settings</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`, 'modal-header', '', div_modal_content);

    CCTbuildElement('div', `<div class="form-floating mt-2">
    <select class="form-select text-black" id="select_core_notification0"
      onchange="changeCoreCompanionNotification(this);">
      <option value="STEP_ANALYSIS">STEP_ANALYSIS (gait/stride, ~30Hz)</option>
      <option value="SENSOR_VALUES">SENSOR_VALUES (acc/gyro/quat, 50-200Hz)</option>
      <option value="STEP_ANALYSIS_AND_SENSOR_VALUES">STEP_ANALYSIS + SENSOR_VALUES</option>
    </select>
    <label for="select_core_notification0" class="small">Notification Type (次回接続時に反映)</label>
  </div>
  <div class="row mt-3 small text-muted">
    <div class="col-6">Accelerometer Range: <span id="info_core_acc_range0">-</span> g</div>
    <div class="col-6">Gyroscope Range: <span id="info_core_gyro_range0">-</span> °/s</div>
  </div>
  <div class="d-grid gap-2 col-10 mx-auto mt-4">
    <button class="btn btn-secondary" type="button" onclick="resetCoreCompanionAttitude();">Reset Attitude</button>
    <button class="btn btn-warning text-white" type="button" onclick="resetCoreCompanionAnalysisLogs();">Reset
      Analysis Logs</button>
  </div>`, 'modal-body', '', div_modal_content);

    // 設定モーダルの notification 初期値を options に合わせる
    let select_notify = div_modal_content.querySelector
        ? div_modal_content.querySelector('#select_core_notification0') : null;
    if (select_notify && select_notify.options) {
        for (const opt of select_notify.options) {
            opt.selected = (opt.value === options.notification);
        }
    }

    return orpheCore;
}

/**
 * CORE インスタンスの requestDevice() を、namePrefix と services の
 * OR フィルタ版に差し替える。
 *
 * CORE SDK 標準の requestDevice() は filters: [{services: [ORPHE_INFORMATION]}]
 * だが、実機 CORE（CR- 系）のアドバタイズパケットにはサービスUUIDが含まれて
 * おらず、chooser に CORE が一切表示されない（2026-07 実機確認）。
 * namePrefix フィルタを併用（OR）することで、名前でもサービスUUIDでも
 * マッチするようにする。
 *
 * 注意: 後半の device 受理処理は ORPHE-CORE.js の requestDevice() 実装の複製。
 * SDK 側の実装が変わった場合は追随が必要（本質的には SDK 側で filters を
 * 指定可能にする upstream 修正が望ましい）。
 *
 * @param {Orphe} core - 対象の ORPHE CORE インスタンス
 * @param {string} namePrefix - chooser の namePrefix フィルタ（例 'CR-'）
 */
function patchCoreCompanionRequestDevice(core, namePrefix) {
    core.requestDevice = function (uuid, connectionOptions = {}) {
        const requestOptions = {
            filters: [
                { namePrefix: namePrefix },
                { services: [this.ORPHE_INFORMATION] }
            ],
            acceptAllDevices: false,
            optionalServices: [
                this.ORPHE_INFORMATION,
                this.ORPHE_OTHER_SERVICE
            ]
        };
        return navigator.bluetooth.requestDevice(requestOptions)
            .then(device => {
                if (this._isBluetoothDeviceDisallowed(device, connectionOptions)) {
                    const error = new Error('This ORPHE CORE is already assigned to another slot.');
                    error.name = 'DuplicateBluetoothDeviceError';
                    throw error;
                }
                this.bluetoothDevice = device;
                this._usingRememberedBluetoothDevice = false;
                this._rememberedBluetoothDeviceUnavailable = false;
                this.bluetoothDevice.addEventListener('gattserverdisconnected', this.onDisconnect);
                this.onScan(this.bluetoothDevice.name);
            });
    };
}

/**
 * CORE 3.0 の 200Hz SENSOR_VALUES パケット（header 50・104バイト）を
 * ORPHE-CORE.js の既存パーサで処理できるようにする onRead シム。
 *
 * ORPHE-CORE.js の header 50 パーサは byteLength != 92 のパケットを
 * すべて破棄するが、CORE 3.0 は INSOLE と同じ新世代フレーム
 * （104バイト・末尾12バイトは予約領域）で送信してくる（2026-07 実機確認）。
 * データレイアウト（quat: 8+21i / gyro: 16+21i / acc: 22+21i / Δt: 28+21i）は
 * 92バイト版と同一のため、先頭92バイトの DataView に切り直して
 * 既存パーサへ渡せば、履歴バッファ・周波数計測・ブリッジ通知を含む
 * 既存経路がそのまま機能する。
 *
 * @param {Orphe} core - 対象の ORPHE CORE インスタンス
 */
function patchCoreCompanionOnRead(core) {
    if (core._coreCompanionOnReadPatched) return;
    core._coreCompanionOnReadPatched = true;
    const origOnRead = core.onRead.bind(core);
    core.onRead = function (data, uuid) {
        if (uuid === 'SENSOR_VALUES' && data && typeof data.getUint8 === 'function' &&
            data.byteLength === 104 && data.getUint8(0) === 50) {
            data = new DataView(data.buffer, data.byteOffset || 0, 92);
        }
        return origOnRead(data, uuid);
    };
}

/**
 * BLE接続のトグルボタンが切り替わったときに呼び出される関数
 * @param {Element} dom
 */
async function toggleCoreCompanion(dom) {
    if (!orpheCore) return;
    const options = orpheCore._coreCompanionOptions || {};
    if (dom.checked == true) {
        let ret = null;
        try {
            const beginPromise = orpheCore.begin(options.notification, {
                range: options.range,
                autoReconnect: options.autoReconnect,
                forceDeviceSelection: true
            });
            // CORE SDK の begin() は SENSOR_VALUES 系の notify 開始失敗時に
            // Promise が settle しない既知の問題があるため、タイムアウトを併用する
            ret = await coreCompanionPromiseWithTimeout(beginPromise, options.connectTimeoutMs);
        } catch (error) {
            if (!isCoreCompanionUserCancel(error)) {
                console.error('toggleCoreCompanion connect failed:', error);
            }
            ret = null;
        }
        if (!ret) {
            const sw = document.querySelector('#switch_core0');
            if (sw) sw.checked = false;
            return;
        }

        const ui = document.querySelector('#ui_core0');
        if (ui) ui.style.visibility = 'visible';

        // ツールキットUI用コールバック。ユーザ側の上書きと共存できるよう、
        // 既存のユーザコールバックがあればチェーンして呼び出す。
        const userGotBLEFrequency = orpheCore.gotBLEFrequency;
        orpheCore.gotBLEFrequency = function (freq) {
            const el = document.querySelector('#freq_core0');
            if (el) el.innerHTML = `${Math.floor(freq)} Hz`;
            if (typeof userGotBLEFrequency === 'function') userGotBLEFrequency.call(this, freq);
        };

        const userOnDisconnect = orpheCore.onDisconnect;
        orpheCore.onDisconnect = function () {
            setCoreCompanionStatusOffline();
            if (typeof userOnDisconnect === 'function') userOnDisconnect.call(this);
        };
    }
    else {
        orpheCore.reset();
        const ui = document.querySelector('#ui_core0');
        if (ui) ui.style.visibility = 'hidden';
    }
}

/**
 * begin() 用のタイムアウトガード。timeoutMs 経過で null 解決する。
 * @param {Promise} promise
 * @param {number} timeoutMs
 * @returns {Promise}
 */
function coreCompanionPromiseWithTimeout(promise, timeoutMs) {
    if (!timeoutMs || timeoutMs <= 0) return promise;
    let timer;
    const timeout = new Promise((resolve) => {
        timer = setTimeout(() => {
            console.warn(`CoreCompanionToolkit: begin() が ${timeoutMs}ms 以内に完了しませんでした。接続失敗として扱います。`);
            resolve(null);
        }, timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function isCoreCompanionUserCancel(error) {
    const message = error && error.message ? error.message : String(error || '');
    return Boolean(error && error.name === 'NotFoundError') || /cancelled|canceled|chooser|User cancel/i.test(message);
}

/**
 * 設定モーダルから notification type が変更された場合に呼び出される関数。
 * 接続中の通知は切り替えず、次回接続時に反映する。
 * @param {Element} dom セレクタ
 */
function changeCoreCompanionNotification(dom) {
    if (!orpheCore || !orpheCore._coreCompanionOptions) return;
    orpheCore._coreCompanionOptions.notification = dom.value;
}

/**
 * 設定モーダルのパラメータを更新する関数
 */
async function updateCoreCompanionModalParameters() {
    if (!orpheCore) return;
    try {
        var obj = await orpheCore.getDeviceInformation();
        const ACC_RANGE = { 0: 2, 1: 4, 2: 8, 3: 16 };
        const GYRO_RANGE = { 0: 250, 1: 500, 2: 1000, 3: 2000 };
        const acc_el = document.querySelector('#info_core_acc_range0');
        const gyro_el = document.querySelector('#info_core_gyro_range0');
        if (acc_el) acc_el.innerText = ACC_RANGE[obj.range.acc] ?? obj.range.acc;
        if (gyro_el) gyro_el.innerText = GYRO_RANGE[obj.range.gyro] ?? obj.range.gyro;
    } catch (error) {
        console.error('updateCoreCompanionModalParameters failed:', error);
    }
}

/**
 * バッテリー情報を更新する関数。device_informationの3段階に応じてアイコンを変更する
 */
async function updateCoreCompanionBatteryInfo() {
    if (!orpheCore) return;
    try {
        var obj = await orpheCore.getDeviceInformation();
        let str_battery_status;
        if (obj.battery == 0) str_battery_status = 'empty';
        else if (obj.battery == 1) str_battery_status = 'normal';
        else if (obj.battery == 2) str_battery_status = 'full';
        const el = document.querySelector('#icon_battery_core0');
        if (!el) return;
        el.setAttribute('title', `${str_battery_status}`);
        if (obj.battery == 0) {
            el.innerHTML = '<i class="bi bi-battery"></i>';
            el.classList.add('text-warning');
        }
        else if (obj.battery == 1) {
            el.innerHTML = '<i class="bi bi-battery-half"></i>';
        }
        else if (obj.battery == 2) {
            el.innerHTML = '<i class="bi bi-battery-full"></i>';
        }
    } catch (error) {
        console.error('updateCoreCompanionBatteryInfo failed:', error);
    }
}

/**
 * LEDのオン・オフを切り替える関数（pattern 0 固定）
 */
function toggleCoreCompanionLED() {
    if (!orpheCore) return;
    orpheCore._coreCompanionLedOn = !orpheCore._coreCompanionLedOn;
    orpheCore.setLED(orpheCore._coreCompanionLedOn ? 1 : 0, 0);
    const el = document.querySelector('#icon_led_core0');
    if (el) {
        el.innerHTML = orpheCore._coreCompanionLedOn
            ? '<i class="bi bi-lightbulb-fill"></i>' : '<i class="bi bi-lightbulb"></i>';
    }
}

/**
 * 姿勢（quaternion）の基準をリセットする関数
 */
function resetCoreCompanionAttitude() {
    if (!orpheCore) return;
    orpheCore.resetMotionSensorAttitude();
}

/**
 * CORE の解析ログをリセットする関数
 */
function resetCoreCompanionAnalysisLogs() {
    if (!orpheCore) return;
    orpheCore.resetAnalysisLogs();
}

/**
 * トグルボタンをオフに変更し、UIを非表示にする
 */
function setCoreCompanionStatusOffline() {
    const sw = document.querySelector('#switch_core0');
    if (sw) sw.checked = false;
    const ui = document.querySelector('#ui_core0');
    if (ui) ui.style.visibility = 'hidden';
}

/**
 * CoreCompanionToolkit.js内でUIを生成するのに利用するbuildElementのラッパー関数
 * @param {string} name_tag - タグ名
 * @param {string} innerHTML - タグ内のテキスト
 * @param {string} str_class - タグ内に適応するクラス
 * @param {string} str_style - タグ内に適応するスタイル
 * @param {Element} element_appended - 親要素
 */
function CCTbuildElement(name_tag, innerHTML, str_class, str_style, element_appended) {
    let element = document.createElement(name_tag);
    element.innerHTML = innerHTML;
    element.classList = str_class;
    if (str_style != '') {
        element.setAttribute('style', str_style);
    }
    element_appended.appendChild(element);
    return element;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        buildCoreCompanionToolkit,
        toggleCoreCompanion,
        isOrpheCoreSdkLoaded,
        coreCompanionPromiseWithTimeout,
        patchCoreCompanionRequestDevice,
        patchCoreCompanionOnRead
    };
}
