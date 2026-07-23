var insoleToolkit_version_date = `
Last modified: 2026/07/23 00:00:00
`;
// insoleToolkit_version_dateから改行を削除
insoleToolkit_version_date = insoleToolkit_version_date.replace(/\n/g, '');

/**
 * InsoleToolkit.js
 *
 * ORPHE INSOLE 用の接続GUIツールキット。CORE 用 CoreToolkit.js の slim 版で、
 * INSOLE に存在しない機能（LED、左右書き込み）を削除し、代わりに INSOLE 固有の
 * SENSOR_VALUES / STEP_ANALYSIS 出力選択、Realtime / FIFO 取得経路、
 * データストリーミングモード、取り付け位置（左右）バッジ、
 * 自動再接続ステータス表示を追加しています。
 *
 * 依存: Bootstrap 5 (CSS/JS) + bootstrap-icons + ORPHE-INSOLE.js
 * FIFO / Step Analysis は InsoleFifo.js / InsoleGait.js を追加で読み込むと有効になる。
 */

/**
 * insoles = [new OrpheInsole(0), new OrpheInsole(1)];
 * INSOLE は最大2足（左右）まで同時接続できます。
 */
var insoles = [new OrpheInsole(0), new OrpheInsole(1)];

/**
 * CORE 系コードからの移植を容易にするためのエイリアス。参照先は insoles と同じ。
 */
var bles = insoles;
var cores = insoles;

/**
 * Toolkit が管理するデバイス別セッション。
 * buildInsoleToolkit() の既存戻り値・insoles/bles/cores の公開面は変えず、
 * 追加機能を利用するアプリ向けに参照可能な配列として公開する。
 */
var insoleToolkitSessions = [null, null];

function normalizeInsoleToolkitOutputs(outputs) {
    const normalized = {
        sensorValues: !outputs || outputs.sensorValues !== false,
        stepAnalysis: !!(outputs && outputs.stepAnalysis),
    };
    if (!normalized.sensorValues && !normalized.stepAnalysis) {
        const error = new Error('InsoleToolkit: select at least one data output.');
        error.code = 'NO_DATA_OUTPUT';
        throw error;
    }
    return normalized;
}

function normalizeInsoleSensorDataMode(mode) {
    return mode === 'fifo' ? 'fifo' : 'realtime';
}

function insoleToolkitModuleOptions(options, key) {
    const value = options && options[key];
    return value && typeof value === 'object' ? value : {};
}

/**
 * 1台の OrpheInsole に対する通知と FIFO/Gait ライフサイクルを直列化する。
 * UIからの高速な切替でも sink の二重所有や FIFO drain 中の reset を起こさない。
 */
class InsoleToolkitSession {
    constructor(insole, options = {}, adapters = {}) {
        this.insole = insole;
        this.options = options;
        this.streamingMode = options.streamingMode || 4;
        this.sensorDataMode = normalizeInsoleSensorDataMode(options.sensorDataMode);
        this.outputs = normalizeInsoleToolkitOutputs(options.outputs);
        this.connected = false;
        this.transitioning = false;
        this.sensorNotifyActive = false;
        this.fifoActive = false;
        this.gaitActive = false;
        this.lastError = null;
        this._transition = Promise.resolve();
        this._reconnectHook = null;

        const FifoClass = adapters.FifoClass;
        const GaitClass = adapters.GaitClass;
        const fifoOptions = insoleToolkitModuleOptions(options, 'fifo');
        const gaitOptions = insoleToolkitModuleOptions(options, 'gait');
        this._fifoCallbacks = fifoOptions;
        this._gaitCallbacks = gaitOptions;
        this.fifo = FifoClass && !options.simulator ? new FifoClass(insole, fifoOptions) : null;
        this.gait = GaitClass && !options.simulator ? new GaitClass(insole, gaitOptions) : null;
        this._wireModuleCallbacks();
    }

    get supportsFifo() { return !!this.fifo; }
    get supportsStepAnalysis() { return !!this.gait; }

    snapshot() {
        return {
            connected: this.connected,
            transitioning: this.transitioning,
            streamingMode: this.streamingMode,
            sensorDataMode: this.sensorDataMode,
            outputs: { ...this.outputs },
            sensorNotifyActive: this.sensorNotifyActive,
            fifoActive: this.fifoActive,
            gaitActive: this.gaitActive,
            supportsFifo: this.supportsFifo,
            supportsStepAnalysis: this.supportsStepAnalysis,
            lastError: this.lastError,
        };
    }

    setFifoCallbacks(callbacks = {}) {
        this._fifoCallbacks = callbacks;
    }

    setGaitCallbacks(callbacks = {}) {
        this._gaitCallbacks = callbacks;
    }

    connect(beginOptions = {}) {
        return this._enqueue(async () => {
            if (this.connected && this.insole.isConnected && this.insole.isConnected()) {
                await this._applyDesiredState();
                return 'already connected';
            }
            const options = Object.assign({}, this.options, beginOptions, {
                streamingMode: this.streamingMode,
            });
            delete options.outputs;
            delete options.sensorDataMode;
            delete options.fifo;
            delete options.gait;
            delete options.onStateChange;

            const result = await this.insole.begin('SENSOR_VALUES', options);
            if (!result) return result;
            this.connected = true;
            this.sensorNotifyActive = true;
            try {
                await this._applyDesiredState();
                this._installReconnectHook();
                return result;
            } catch (error) {
                await this._stopFifo();
                await this._stopGait();
                this._removeReconnectHook();
                this.insole.reset();
                this.connected = false;
                this.sensorNotifyActive = false;
                throw error;
            }
        });
    }

    disconnect() {
        return this._enqueue(async () => {
            await this._stopFifo();
            await this._stopGait();
            this._removeReconnectHook();
            if (this.insole && typeof this.insole.reset === 'function') this.insole.reset();
            this.connected = false;
            this.sensorNotifyActive = false;
            this.fifoActive = false;
            this.gaitActive = false;
        });
    }

    setOutputs(outputs) {
        try {
            const next = normalizeInsoleToolkitOutputs(outputs);
            return this._changeConfig('outputs', next);
        } catch (error) {
            return this._enqueue(() => { throw error; });
        }
    }

    setSensorDataMode(mode) {
        return this._changeConfig('sensorDataMode', normalizeInsoleSensorDataMode(mode));
    }

    setStreamingMode(mode) {
        const normalized = Number(mode);
        if (![1, 3, 4].includes(normalized)) {
            const error = new Error(`InsoleToolkit: invalid streaming mode ${mode}.`);
            error.code = 'INVALID_MODE';
            return Promise.reject(error);
        }
        return this._changeConfig('streamingMode', normalized);
    }

    reapplyAfterReconnect() {
        this.connected = true;
        this.sensorNotifyActive = true;
        // FIFO のループは切断時に終了するため、再接続後は必ず開始し直す。
        // Gait.start() は Gait 自身の reconnect hook と同じ購読 Promise を共有する。
        // ここでも await し、Step-only 時に購読完了前の SENSOR_VALUES 停止を防ぐ。
        this.fifoActive = false;
        this.gaitActive = false;
        return this._enqueue(() => this._applyDesiredState());
    }

    markDisconnected() {
        this.connected = false;
        this.sensorNotifyActive = false;
        this.fifoActive = false;
        if (this.gait && !this.gait.isRunning) this.gaitActive = false;
        this._emitState();
    }

    _changeConfig(key, value) {
        return this._enqueue(async () => {
            const previous = key === 'outputs' ? { ...this.outputs } : this[key];
            this[key] = key === 'outputs' ? { ...value } : value;
            this._syncOptions();
            try {
                if (this.connected) await this._applyDesiredState();
            } catch (error) {
                this[key] = previous;
                this._syncOptions();
                if (this.connected) {
                    try { await this._applyDesiredState(); } catch (rollbackError) {
                        this._reportError(rollbackError);
                    }
                }
                throw error;
            }
        });
    }

    _enqueue(operation) {
        const run = async () => {
            this.transitioning = true;
            this.lastError = null;
            this._emitState();
            try {
                return await operation();
            } catch (error) {
                this.lastError = error;
                this._reportError(error);
                throw error;
            } finally {
                this.transitioning = false;
                this._emitState();
            }
        };
        const next = this._transition.then(run, run);
        this._transition = next.catch(() => {});
        return next;
    }

    async _applyDesiredState() {
        if (!this.connected) return;

        // Step-only へ切り替える場合も、先に STEP_ANALYSIS を購読してから
        // SENSOR_VALUES を止める。FWがactive状態を要求するため順序を逆にしない。
        if (!this.outputs.sensorValues) {
            if (this.outputs.stepAnalysis) await this._startGait();
            else await this._stopGait();
            await this._stopFifo();
            await this._stopSensorNotify();
            return;
        }

        await this._ensureSensorNotify();
        if (this.sensorDataMode === 'fifo') {
            const gaitWasActive = this.gaitActive;
            const fifoStarted = await this._startFifo();
            if (this.outputs.stepAnalysis) {
                // FIFO read-modeへ切り替えるとFW側のSTEP_ANALYSIS配信が止まる機体がある。
                // 既存購読はGATT上activeのままなので、FIFO開始後に明示的に再購読する。
                if (fifoStarted && gaitWasActive) await this._refreshGait();
                else await this._startGait();
            } else {
                await this._stopGait();
            }
        } else {
            const fifoStopped = await this._stopFifo();
            await this.insole.setDataStreamingMode(this.streamingMode);
            if (this.outputs.stepAnalysis) {
                // FIFO teardownのread-mode復帰後も同じ理由で通知を再確立する。
                if (fifoStopped && this.gaitActive) await this._refreshGait();
                else await this._startGait();
            } else {
                await this._stopGait();
            }
        }
    }

    async _ensureSensorNotify() {
        if (this.sensorNotifyActive) return;
        await this.insole.setDataStreamingMode(this.streamingMode);
        await this.insole.startNotify('SENSOR_VALUES');
        this.sensorNotifyActive = true;
    }

    async _stopSensorNotify() {
        if (!this.sensorNotifyActive) return;
        await this.insole.stopNotify('SENSOR_VALUES');
        this.sensorNotifyActive = false;
    }

    async _startFifo() {
        if (this.fifoActive) return false;
        if (!this.fifo) {
            const error = new Error('InsoleToolkit: FIFO requires InsoleFifo.js.');
            error.code = 'FIFO_UNAVAILABLE';
            throw error;
        }
        const started = await this.fifo.start();
        if (!started) {
            const error = new Error('InsoleToolkit: failed to start FIFO acquisition.');
            error.code = 'FIFO_START_FAILED';
            throw error;
        }
        this.fifoActive = true;
        return true;
    }

    async _stopFifo() {
        if (!this.fifo || !this.fifoActive) return false;
        await this.fifo.stop();
        this.fifoActive = false;
        return true;
    }

    async _startGait() {
        if (this.gaitActive) return;
        if (!this.gait) {
            const error = new Error('InsoleToolkit: Step Analysis requires InsoleGait.js.');
            error.code = 'GAIT_UNAVAILABLE';
            throw error;
        }
        const started = await this.gait.start();
        if (!started) {
            const error = new Error('InsoleToolkit: failed to start Step Analysis.');
            error.code = 'GAIT_START_FAILED';
            throw error;
        }
        this.gaitActive = true;
    }

    async _refreshGait() {
        if (!this.gait || !this.gaitActive) return this._startGait();
        if (typeof this.gait.refreshSubscription !== 'function') return;
        const refreshed = await this.gait.refreshSubscription();
        this.gaitActive = !!refreshed;
        if (!refreshed) {
            const error = new Error('InsoleToolkit: failed to refresh Step Analysis after FIFO mode change.');
            error.code = 'GAIT_REFRESH_FAILED';
            throw error;
        }
    }

    async _stopGait() {
        if (!this.gait || !this.gaitActive) return;
        await this.gait.stop();
        this.gaitActive = false;
    }

    _installReconnectHook() {
        const hooks = this.insole && this.insole._afterReconnectSuccess;
        if (!Array.isArray(hooks) || this._reconnectHook) return;
        // Gait.start() が先に自身の再購読hookを登録している。Toolkitはその後段で
        // 選択状態（特にStep-only時のSENSOR_VALUES停止）を再適用する。
        this._reconnectHook = () => {
            this.reapplyAfterReconnect().catch(() => {});
        };
        hooks.push(this._reconnectHook);
    }

    _removeReconnectHook() {
        const hooks = this.insole && this.insole._afterReconnectSuccess;
        if (Array.isArray(hooks) && this._reconnectHook) {
            const index = hooks.indexOf(this._reconnectHook);
            if (index >= 0) hooks.splice(index, 1);
        }
        this._reconnectHook = null;
    }

    _wireModuleCallbacks() {
        if (this.fifo) {
            this.fifo.onSamples = (...args) => this._callModuleCallback(this._fifoCallbacks, 'onSamples', args);
            this.fifo.onProgress = (...args) => this._callModuleCallback(this._fifoCallbacks, 'onProgress', args);
            this.fifo.onAnomaly = (...args) => this._callModuleCallback(this._fifoCallbacks, 'onAnomaly', args);
            this.fifo.onDataLoss = (...args) => this._callModuleCallback(this._fifoCallbacks, 'onDataLoss', args);
            this.fifo.onStopped = (info) => {
                this.fifoActive = false;
                this._emitState();
                this._callModuleCallback(this._fifoCallbacks, 'onStopped', [info]);
            };
            this.fifo.onError = (error) => {
                this._callModuleCallback(this._fifoCallbacks, 'onError', [error]);
                this._reportError(error);
            };
        }
        if (this.gait) {
            this.gait.onGait = (...args) => this._callModuleCallback(this._gaitCallbacks, 'onGait', args);
            this.gait.onMotion = (...args) => this._callModuleCallback(this._gaitCallbacks, 'onMotion', args);
            this.gait.onRaw = (...args) => this._callModuleCallback(this._gaitCallbacks, 'onRaw', args);
            this.gait.onError = (error) => {
                this._callModuleCallback(this._gaitCallbacks, 'onError', [error]);
                this._reportError(error);
            };
        }
    }

    _callModuleCallback(callbacks, name, args) {
        const callback = callbacks && callbacks[name];
        if (typeof callback !== 'function') return;
        try { callback(...args); } catch (error) { this._reportError(error); }
    }

    _syncOptions() {
        this.options.streamingMode = this.streamingMode;
        this.options.sensorDataMode = this.sensorDataMode;
        this.options.outputs = { ...this.outputs };
        if (this.insole) this.insole._insoleToolkitOptions = this.options;
    }

    _reportError(error) {
        const callback = this.options && this.options.onError;
        if (typeof callback === 'function') {
            try { callback(error, this.snapshot()); return; } catch (_) { /* fallthrough */ }
        }
        if (error) console.error('InsoleToolkitSession:', error);
    }

    _emitState() {
        this._syncOptions();
        const callback = this.options && this.options.onStateChange;
        if (typeof callback === 'function') {
            try { callback(this.snapshot()); } catch (error) { this._reportError(error); }
        }
        if (typeof document !== 'undefined') {
            syncInsoleToolkitControls(this.insole ? this.insole.id : 0);
        }
    }
}

/**
 * インソール操作GUIを生成する。ユーザはこれを呼び出すだけでよい。
 * @param {Element} parent_element - InsoleToolkitを追加する親要素
 * @param {string} title - タイトル。トグルボタンの横に表示される
 * @param {number} [insole_id=0]  - 0,1のどちらかを指定する。インソールは最大2つまで
 * @param {object} [options] - Toolkit / begin オプション
 * @param {'realtime'|'fifo'} [options.sensorDataMode='realtime'] SENSOR_VALUES の取得経路
 * @param {{sensorValues?:boolean,stepAnalysis?:boolean}} [options.outputs]
 * @param {object} [options.fifo] OrpheInsoleFifo options + callbacks
 * @param {object} [options.gait] OrpheInsoleGait options + callbacks
 *   simulator: true にすると実機の代わりに OrpheInsoleSimulator を使う
 *   （要 InsoleSimulator.js の読み込み。実機なしのデモ・開発用）。
 */
function buildInsoleToolkit(parent_element, title, insole_id = 0, options = {}) {
    if (typeof options.streamingMode === 'undefined') options.streamingMode = 4;
    if (typeof options.autoReconnect === 'undefined') options.autoReconnect = true;
    if (typeof options.sensorDataMode === 'undefined') options.sensorDataMode = 'realtime';
    if (typeof options.outputs === 'undefined') {
        options.outputs = { sensorValues: true, stepAnalysis: false };
    }

    // simulator オプション: このスロットをシミュレータ実装に差し替える。
    // insoles/bles/cores は同一配列を指すため、要素の差し替えで全エイリアスに反映される。
    if (options.simulator === true) {
        if (typeof OrpheInsoleSimulator === 'undefined') {
            throw new Error('buildInsoleToolkit: {simulator: true} には InsoleSimulator.js の読み込みが必要です。<script src=".../src/InsoleSimulator.js"></script> を ORPHE-INSOLE.js の後に追加してください。');
        }
        if (!(insoles[insole_id] instanceof OrpheInsoleSimulator)) {
            insoles[insole_id] = new OrpheInsoleSimulator(insole_id);
            insoles[insole_id].setup();
        }
    }
    insoles[insole_id]._insoleToolkitOptions = options;
    const session = new InsoleToolkitSession(insoles[insole_id], options, {
        FifoClass: typeof OrpheInsoleFifo !== 'undefined' ? OrpheInsoleFifo : null,
        GaitClass: typeof OrpheInsoleGait !== 'undefined' ? OrpheInsoleGait : null,
    });
    insoleToolkitSessions[insole_id] = session;
    insoles[insole_id]._insoleToolkitSession = session;

    let div_form_check = ITbuildElement('div', '', 'form-check form-switch d-flex', '', parent_element);
    div_form_check.id = `insole_toolkit${insole_id}`;

    // toggle and title
    let input = ITbuildElement('input', '', 'form-check-input position-relative', '', div_form_check);
    input.setAttribute('type', 'checkbox');
    input.setAttribute('role', 'switch');
    input.setAttribute('id', `switch_ble${insole_id}`);
    input.setAttribute('value', `${insole_id}`);
    input.setAttribute('title', `insoleToolkit_version_date: ${insoleToolkit_version_date}\norphe_js_version_date: ${orphe_js_version_date}`);
    input.addEventListener('change', function () {
        toggleInsoleModule(this, options);
    })
    ITbuildElement('label', title, 'form-check-label ms-1', '', div_form_check);

    let span_group = ITbuildElement('span', '', '', '', div_form_check);
    span_group.id = `ui${insole_id}`;
    span_group.style.visibility = 'hidden';

    // 実測周波数
    let span_activity = ITbuildElement('span',
        `<i class="bi bi-activity position-relative">
        <span class="position-absolute top-0 start-50 translate-middle badge text-muted" style="font-size:0.2em;"
          id="freq${insole_id}">
        </span>
      </i>`,
        'text-muted ms-1', '', span_group);
    span_activity.id = `icon_bluetooth${insole_id}`;

    // 左右バッジ（device_information.mount_position bit0 から自動表示）
    let span_lr = ITbuildElement('span', `<span class="badge bg-secondary" id="lr_badge${insole_id}">-</span>`, 'ms-1', '', span_group);
    span_lr.id = `icon_lr${insole_id}`;
    span_lr.setAttribute('title', 'mount position (L/R)');

    // バッテリー
    let span_battery = ITbuildElement('span', `<i class="bi bi-battery"></i>`, 'text-muted ms-1', '', span_group);
    span_battery.id = `icon_battery${insole_id}`;
    span_battery.setAttribute('insole_id', `${insole_id}`);
    span_battery.addEventListener('click', function () {
        updateInsoleBatteryInfo(span_battery);
    })

    // 自動再接続ステータス（再接続試行中のみ表示）
    let span_reconnect = ITbuildElement('span',
        `<i class="bi bi-arrow-repeat"></i><span class="small" id="reconnect_text${insole_id}"></span>`,
        'text-warning ms-1', '', span_group);
    span_reconnect.id = `icon_reconnect${insole_id}`;
    span_reconnect.style.display = 'none';
    span_reconnect.setAttribute('title', 'auto reconnecting...');

    // 設定モーダル
    let span_settings = ITbuildElement('span', `<i class="bi bi-gear"></i>`, 'text-muted ms-1', '', span_group);
    span_settings.id = `icon_settings${insole_id}`;
    span_settings.setAttribute('value', `${insole_id}`);
    span_settings.setAttribute('title', `settings for streaming mode.`);
    span_settings.setAttribute('data-bs-toggle', 'modal');
    span_settings.setAttribute('data-bs-target', `#settings_modal${insole_id}`);
    span_settings.addEventListener('click', function () {
        updateInsoleModalParameters(parseInt(insole_id));
    })

    // 設定モーダルは body 直下に置く。
    // toolkit を position:sticky / transform / filter 等で stacking context を作る
    // 要素（例: showcase の position:sticky ヘッダ）の内側に置くと、Bootstrap が
    // body に挿す backdrop(z-index 1050) がモーダル本体(親の stacking context に
    // 閉じ込められ実質 1030 相当)より前面に来て、モーダルがクリックできず固まって
    // 見える。body 直下なら backdrop と同じ土俵に並ぶのでこの問題を回避できる。
    const existingModal = document.getElementById(`settings_modal${insole_id}`);
    if (existingModal) existingModal.remove(); // 再ビルド時の重複を防ぐ
    let div_modal = ITbuildElement('div', '', 'modal fade', '', document.body);
    div_modal.id = `settings_modal${insole_id}`;
    div_modal.setAttribute('tabindex', '-1');
    div_modal.setAttribute('aria-hidden', 'true');
    let div_modal_dialog = ITbuildElement('div', '', 'modal-dialog text-dark', '', div_modal);
    let div_modal_content = ITbuildElement('div', '', 'modal-content', '', div_modal_dialog);
    ITbuildElement('div', `<h5 class="modal-title"><i class="bi bi-gear"></i> INSOLE0${insole_id} Settings</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`, 'modal-header', '', div_modal_content);

    ITbuildElement('div', `<fieldset class="border rounded p-2 mt-2">
    <legend class="float-none w-auto px-1 mb-1 small">Data Outputs</legend>
    <div class="form-check form-check-inline mb-0">
      <input class="form-check-input" type="checkbox" id="output_sensor_values${insole_id}">
      <label class="form-check-label small" for="output_sensor_values${insole_id}">Raw Sensor Data</label>
    </div>
    <div class="form-check form-check-inline mb-0">
      <input class="form-check-input" type="checkbox" id="output_step_analysis${insole_id}">
      <label class="form-check-label small" for="output_step_analysis${insole_id}">Step Analysis</label>
    </div>
  </fieldset>
  <div class="form-floating mt-2">
    <select class="form-select text-black" id="select_sensor_data_mode${insole_id}">
      <option value="realtime">Realtime</option>
      <option value="fifo">FIFO (gyro + acc + press, no quat)</option>
    </select>
    <label for="select_sensor_data_mode${insole_id}" class="small">Raw Data Acquisition</label>
  </div>
  <div class="form-floating mt-2">
    <select class="form-select text-black" id="select_streaming_mode${insole_id}"
      onchange="changeInsoleStreamingMode(${insole_id}, this);">
      <option value="1">1: quat + gyro + acc (200Hz)</option>
      <option value="3">3: gyro + acc + press (200Hz)</option>
      <option value="4" selected>4: gyro + acc + press + quat (100Hz)</option>
    </select>
    <label for="select_streaming_mode${insole_id}" class="small">Realtime Streaming Format</label>
  </div>
  <div id="toolkit_mode_status${insole_id}" class="small text-muted mt-2" role="status"></div>
  <div id="toolkit_mode_note${insole_id}" class="small text-muted mt-1">
    FIFO applies only to Raw Sensor Data. Step Analysis uses its dedicated realtime characteristic.
  </div>
  <div class="row mt-3 small text-muted">
    <div class="col-6">Accelerometer Range: <span id="info_acc_range${insole_id}">-</span> g</div>
    <div class="col-6">Gyroscope Range: <span id="info_gyro_range${insole_id}">-</span> °/s</div>
  </div>
  <div class="row mt-1 small text-muted">
    <div class="col-12">Mount Position: <span id="info_mount_position${insole_id}">-</span></div>
  </div>
  <div class="d-grid gap-2 col-10 mx-auto mt-4">
    <button class="btn btn-warning text-white" type="button" onclick="resetInsoleModule(${insole_id});">Reset
      Analysis Logs</button>
  </div>`, 'modal-body', '', div_modal_content);

    // 設定モーダルのストリーミングモード初期値を options に合わせる
    let select_mode = div_modal_content.querySelector(`#select_streaming_mode${insole_id}`);
    for (const opt of select_mode.options) {
        opt.selected = (parseInt(opt.value) === options.streamingMode);
    }
    const select_sensor_data_mode = div_modal_content.querySelector(`#select_sensor_data_mode${insole_id}`);
    select_sensor_data_mode.value = session.sensorDataMode;
    const output_sensor_values = div_modal_content.querySelector(`#output_sensor_values${insole_id}`);
    const output_step_analysis = div_modal_content.querySelector(`#output_step_analysis${insole_id}`);
    output_sensor_values.checked = session.outputs.sensorValues;
    output_step_analysis.checked = session.outputs.stepAnalysis;
    output_sensor_values.addEventListener('change', () => changeInsoleDataOutputs(insole_id));
    output_step_analysis.addEventListener('change', () => changeInsoleDataOutputs(insole_id));
    select_sensor_data_mode.addEventListener('change', function () {
        changeInsoleSensorDataMode(insole_id, this);
    });
    syncInsoleToolkitControls(insole_id);
}

/**
 * CoreToolkit 互換ラッパー。
 * CORE 用コードからの移植を容易にするために残してあります。
 * notification 引数は従来どおり SENSOR_VALUES 固定として扱います。
 * 新しい出力選択は options.outputs または設定モーダルから行います。
 * @deprecated buildInsoleToolkit を利用してください
 */
function buildCoreToolkit(parent_element, title, core_id = 0, notification = 'SENSOR_VALUES', options = {}) {
    if (notification && notification !== 'SENSOR_VALUES') {
        console.warn(`InsoleToolkit: notification '${notification}' is ignored. ORPHE INSOLE begin() uses SENSOR_VALUES.`);
    }
    return buildInsoleToolkit(parent_element, title, core_id, options);
}

/**
 * BLE接続のトグルボタンが切り替わったときに呼び出される関数
 * @param {Element} dom
 * @param {object} options
 *
 */
async function toggleInsoleModule(dom, options = {}) {
    let checked = dom.checked;
    let number = parseInt(dom.value);
    let insole = insoles[number];
    let session = getInsoleToolkitSession(number);
    if (!session) return;
    dom.disabled = true;
    if (checked == true) {
        let ret;
        try {
            const beginOptions = Object.assign({}, options, { forceDeviceSelection: true });
            ret = await session.connect(beginOptions);
        } catch (error) {
            if (!isInsoleToolkitUserCancel(error)) {
                console.error('toggleInsoleModule connect failed:', error);
            }
            ret = null;
        }
        if (!ret) {
            document.querySelector(`#switch_ble${number}`).checked = false;
            dom.disabled = false;
            syncInsoleToolkitControls(number);
            return;
        }

        document.querySelector(`#ui${number}`).style.visibility = 'visible';
        updateInsoleLRBadge(number);

        // ユーザコールバックを保ったまま Toolkit 表示を更新する。
        installInsoleToolkitCallbacks(insole, session);
    }
    else {
        try {
            await session.disconnect();
        } catch (error) {
            console.error('toggleInsoleModule disconnect failed:', error);
        } finally {
            document.querySelector(`#ui${number}`).style.visibility = 'hidden';
        }
    }
    dom.disabled = false;
    syncInsoleToolkitControls(number);
}

function installInsoleToolkitCallbacks(insole, session) {
    insole._insoleToolkitSession = session;
    if (insole._insoleToolkitCallbacksInstalled) return;
    insole._insoleToolkitCallbacksInstalled = true;

    const userGotBLEFrequency = insole.gotBLEFrequency;
    insole.gotBLEFrequency = function (freq) {
        const el = document.querySelector(`#freq${this.id}`);
        if (el) el.innerHTML = `${Math.floor(freq)} Hz`;
        if (typeof userGotBLEFrequency === 'function') userGotBLEFrequency.call(this, freq);
    };

    const userOnDisconnect = insole.onDisconnect;
    insole.onDisconnect = function (...args) {
        const currentSession = this._insoleToolkitSession;
        if (currentSession) currentSession.markDisconnected();
        if (typeof userOnDisconnect === 'function') userOnDisconnect.apply(this, args);
    };

    const userOnReconnectAttempt = insole.onReconnectAttempt;
    insole.onReconnectAttempt = function (info) {
        const icon = document.querySelector(`#icon_reconnect${this.id}`);
        const text = document.querySelector(`#reconnect_text${this.id}`);
        if (icon) icon.style.display = '';
        if (text) text.innerText = `${info.attempt}/${info.maxAttempts}`;
        if (typeof userOnReconnectAttempt === 'function') userOnReconnectAttempt.call(this, info);
    };
    const userOnReconnectSuccess = insole.onReconnectSuccess;
    insole.onReconnectSuccess = function (info) {
        const icon = document.querySelector(`#icon_reconnect${this.id}`);
        if (icon) icon.style.display = 'none';
        updateInsoleLRBadge(this.id);
        if (typeof userOnReconnectSuccess === 'function') userOnReconnectSuccess.call(this, info);
    };
    const userOnReconnectFailed = insole.onReconnectFailed;
    insole.onReconnectFailed = function (info) {
        const icon = document.querySelector(`#icon_reconnect${this.id}`);
        if (icon) icon.style.display = 'none';
        const currentSession = this._insoleToolkitSession;
        if (currentSession) currentSession.markDisconnected();
        setInsoleHeaderStatusOffline(this.id);
        const ui = document.querySelector(`#ui${this.id}`);
        if (ui) ui.style.visibility = 'hidden';
        if (typeof userOnReconnectFailed === 'function') userOnReconnectFailed.call(this, info);
    };
}

function isInsoleToolkitUserCancel(error) {
    const message = error && error.message ? error.message : String(error || '');
    return Boolean(error && error.name === 'NotFoundError') || /cancelled|canceled|chooser/i.test(message);
}

/**
 * device_information.mount_position から左右バッジを更新する
 * bit0: 0=LEFT, 1=RIGHT
 * @param {number} no - insole_id(0,1)
 */
function updateInsoleLRBadge(no) {
    const badge = document.querySelector(`#lr_badge${no}`);
    if (!badge) return;
    const info = insoles[no].device_information;
    if (!info || typeof info.mount_position === 'undefined') {
        badge.innerText = '-';
        return;
    }
    const isRight = (info.mount_position & 0b1) === 1;
    badge.innerText = isRight ? 'R' : 'L';
    badge.classList.remove('bg-secondary');
    badge.classList.add(isRight ? 'bg-primary' : 'bg-success');
}

/**
 * buildInsoleToolkit() が生成したデバイス別セッションを返す。
 * FIFO / Step Analysis の記録UIもこのセッション経由で操作すると、
 * Toolkit 設定モーダルと通知の所有状態を共有できる。
 * @param {number} no - insole_id(0,1)
 * @returns {InsoleToolkitSession|null}
 */
function getInsoleToolkitSession(no) {
    return insoleToolkitSessions[no] || null;
}

async function changeInsoleDataOutputs(no) {
    const session = getInsoleToolkitSession(no);
    if (!session) return;
    const sensorValues = document.querySelector(`#output_sensor_values${no}`);
    const stepAnalysis = document.querySelector(`#output_step_analysis${no}`);
    try {
        await session.setOutputs({
            sensorValues: !!(sensorValues && sensorValues.checked),
            stepAnalysis: !!(stepAnalysis && stepAnalysis.checked),
        });
    } catch (error) {
        if (error && error.code !== 'NO_DATA_OUTPUT') {
            console.error('changeInsoleDataOutputs failed:', error);
        }
    } finally {
        syncInsoleToolkitControls(no);
    }
}

async function changeInsoleSensorDataMode(no, dom) {
    const session = getInsoleToolkitSession(no);
    if (!session) return;
    try {
        await session.setSensorDataMode(dom.value);
    } catch (error) {
        console.error('changeInsoleSensorDataMode failed:', error);
    } finally {
        syncInsoleToolkitControls(no);
    }
}

/**
 * InsoleToolkitからデータストリーミングモードが変更された場合に呼び出される関数
 * @param {number} no (0,1)
 * @param {Element} dom セレクタ
 */
async function changeInsoleStreamingMode(no, dom) {
    const mode = parseInt(dom.value);
    const session = getInsoleToolkitSession(no);
    if (!session) return;
    try {
        await session.setStreamingMode(mode);
    } catch (error) {
        console.error('changeInsoleStreamingMode failed:', error);
    } finally {
        syncInsoleToolkitControls(no);
    }
}

function syncInsoleToolkitControls(no) {
    const session = getInsoleToolkitSession(no);
    if (!session || typeof document === 'undefined') return;
    const state = session.snapshot();
    const sensorValues = document.querySelector(`#output_sensor_values${no}`);
    const stepAnalysis = document.querySelector(`#output_step_analysis${no}`);
    const sensorDataMode = document.querySelector(`#select_sensor_data_mode${no}`);
    const streamingMode = document.querySelector(`#select_streaming_mode${no}`);
    const status = document.querySelector(`#toolkit_mode_status${no}`);
    const note = document.querySelector(`#toolkit_mode_note${no}`);

    if (sensorValues) {
        if (!state.transitioning) sensorValues.checked = state.outputs.sensorValues;
        sensorValues.disabled = false;
    }
    if (stepAnalysis) {
        if (!state.transitioning) stepAnalysis.checked = state.outputs.stepAnalysis;
        stepAnalysis.disabled = !state.supportsStepAnalysis;
        stepAnalysis.title = state.supportsStepAnalysis ? '' : 'Load InsoleGait.js to enable Step Analysis.';
    }
    if (sensorDataMode) {
        if (!state.transitioning) sensorDataMode.value = state.sensorDataMode;
        sensorDataMode.disabled = state.transitioning || !state.outputs.sensorValues;
        const fifoOption = Array.from(sensorDataMode.options).find((option) => option.value === 'fifo');
        if (fifoOption) fifoOption.disabled = !state.supportsFifo;
    }
    if (streamingMode) {
        if (!state.transitioning) streamingMode.value = String(state.streamingMode);
        streamingMode.disabled = state.transitioning || !state.outputs.sensorValues || state.sensorDataMode === 'fifo';
    }

    if (status) {
        status.classList.toggle('text-danger', !!state.lastError);
        status.classList.toggle('text-muted', !state.lastError);
        if (state.transitioning) {
            status.innerText = 'Switching data mode…';
        } else if (state.lastError) {
            status.innerText = state.lastError.message || String(state.lastError);
        } else if (!state.connected) {
            status.innerText = 'Changes apply on the next connection.';
        } else if (!state.outputs.sensorValues) {
            status.innerText = 'Active: Step Analysis only';
        } else if (state.sensorDataMode === 'fifo' && !state.fifoActive) {
            status.innerText = 'FIFO stopped. Select Realtime, then FIFO, to restart.';
        } else {
            const raw = state.sensorDataMode === 'fifo' ? 'FIFO Raw Data' : 'Realtime Raw Data';
            status.innerText = `Active: ${raw}${state.outputs.stepAnalysis ? ' + Step Analysis' : ''}`;
        }
    }
    if (note) {
        const unavailable = [];
        if (!state.supportsFifo) unavailable.push('Load InsoleFifo.js for FIFO.');
        if (!state.supportsStepAnalysis) unavailable.push('Load InsoleGait.js for Step Analysis.');
        note.innerText = unavailable.length
            ? unavailable.join(' ')
            : 'FIFO applies only to Raw Sensor Data. Step Analysis uses its dedicated realtime characteristic.';
    }
}

/**
 * 設定モーダルのパラメータを更新する関数
 * @param {number} no (0,1)
 */
async function updateInsoleModalParameters(no) {
    var obj = await insoles[no].getDeviceInformation();

    // ACC/GYRO Range（読み取り専用表示。INSOLE は setDeviceInformation 未対応）
    const ACC_RANGE = { 0: 2, 1: 4, 2: 8, 3: 16 };
    const GYRO_RANGE = { 0: 250, 1: 500, 2: 1000, 3: 2000 };
    const acc_el = document.querySelector(`#info_acc_range${no}`);
    const gyro_el = document.querySelector(`#info_gyro_range${no}`);
    const mount_el = document.querySelector(`#info_mount_position${no}`);
    if (acc_el) acc_el.innerText = ACC_RANGE[obj.range.acc] ?? obj.range.acc;
    if (gyro_el) gyro_el.innerText = GYRO_RANGE[obj.range.gyro] ?? obj.range.gyro;
    if (mount_el) {
        const isRight = (obj.mount_position & 0b1) === 1;
        const isInstep = (obj.mount_position & 0b10) === 0b10;
        mount_el.innerText = `${isRight ? 'RIGHT' : 'LEFT'} / ${isInstep ? 'instep(足背)' : 'plantar(足底)'}`;
    }

    syncInsoleToolkitControls(no);
    updateInsoleLRBadge(no);
}

/**
 * インソールの解析ログをリセットする関数
 * @param {number} id - インソールのID(0,1)
 */
function resetInsoleModule(id) {
    insoles[id].resetAnalysisLogs();
}

/**
 * バッテリー情報を更新する関数。device_informationの3段階に応じてアイコンを変更する
 * @param {Element} dom セレクタ
 */
async function updateInsoleBatteryInfo(dom) {
    let number = parseInt(dom.getAttribute('insole_id'));
    var obj = await insoles[number].getDeviceInformation();
    let str_battery_status;
    if (obj.battery == 0) str_battery_status = 'empty';
    else if (obj.battery == 1) str_battery_status = 'normal';
    else if (obj.battery == 2) str_battery_status = 'full';
    const el = document.querySelector(`#icon_battery${number}`);
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
}

/**
 * InsoleToolkitのトグルボタンをオフに変更する
 * @param {number} id - (0,1)
 */
function setInsoleHeaderStatusOffline(id) {
    const el = document.querySelector(`#switch_ble${id}`);
    if (el) el.checked = false;
}

/**
 * InsoleToolkit.js内でUIを生成するのに利用するbuildElementのラッパー関数
 * @param {string} name_tag - タグ名
 * @param {string} innerHTML - タグ内のテキスト
 * @param {string} str_class - タグ内に適応するクラス
 * @param {string} str_style - タグ内に適応するスタイル
 * @param {Element} element_appended - 親要素
 *
 */
function ITbuildElement(name_tag, innerHTML, str_class, str_style, element_appended) {
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
        InsoleToolkitSession,
        normalizeInsoleToolkitOutputs,
        normalizeInsoleSensorDataMode,
    };
}
