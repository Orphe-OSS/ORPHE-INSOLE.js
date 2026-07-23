/* global ToolkitValidationMetrics, AttitudeViz, buildInsoleToolkit, getInsoleToolkitSession, insoles */

'use strict';

const Metrics = ToolkitValidationMetrics;
const PRESETS = Metrics.PRESET_EXPECTATIONS;
const DEVICE_IDS = [0, 1];
const CHART_WINDOW_MS = 12000;
const MAX_EVENT_ROWS = 240;
const MAX_EVENT_ENTRIES = 5000;
const RUN_PROGRESS_LOG_INTERVAL_MS = 5000;

let selectedPresetId = 'rt4';
let runState = 'idle'; // idle | switching | running | draining
let currentRun = null;
let finishingPromise = null;
let runHistory = [];
const lastResults = [null, null];
const signalPoints = [];
const timingPoints = [];
const sessions = [null, null];
const eventEntries = [];
const previewDevices = DEVICE_IDS.map((id) => createPreviewDevice(id));
const lastSessionStateSignatures = [null, null];
const pendingConnectPresetApply = [false, false];

const reconnectStats = DEVICE_IDS.map(() => createReconnectStats());

const dom = {
    globalState: document.getElementById('global_state'),
    globalStateDot: document.getElementById('global_state_dot'),
    timer: document.getElementById('test_timer'),
    secureContext: document.getElementById('secure_context_badge'),
    bluetoothWarning: document.getElementById('bluetooth_warning'),
    selectedPreset: document.getElementById('selected_preset_badge'),
    expectations: document.getElementById('expectation_chips'),
    duration: document.getElementById('duration_select'),
    start: document.getElementById('start_button'),
    stop: document.getElementById('stop_button'),
    clear: document.getElementById('clear_button'),
    runMessage: document.getElementById('run_message'),
    signalChart: document.getElementById('signal_chart'),
    timingChart: document.getElementById('timing_chart'),
    latestDataAge: document.getElementById('latest_data_age'),
    historyBody: document.getElementById('history_body'),
    eventLog: document.getElementById('event_log'),
    copyLog: document.getElementById('copy_event_log_button'),
    resetAttitude: document.getElementById('reset_attitude_button'),
    attitudeMode: document.getElementById('attitude_mode_badge'),
    resetReconnect: document.getElementById('reset_reconnect_button'),
    downloadJson: document.getElementById('download_json_button'),
    downloadFifo: document.getElementById('download_fifo_button'),
    downloadStep: document.getElementById('download_step_button'),
};

function createReconnectStats() {
    return {
        disconnects: 0,
        attempts: 0,
        successes: 0,
        failures: 0,
        disconnectedAt: null,
        successAt: null,
        elapsedMs: null,
        firstDataAfterSuccessMs: null,
        restoredAfterSuccessMs: null,
        pendingFirstData: false,
        pendingRestore: false,
    };
}

function createPreviewDevice(id) {
    return {
        id,
        rawPackets: 0,
        rawSamples: 0,
        stepPackets: 0,
        completedSteps: 0,
        startedAt: null,
        serialTracker: Metrics.createSerialTracker(),
        fieldCounts: { acc: 0, gyro: 0, press: 0, quat: 0 },
        batchGaps: [],
        deliveryAges: [],
        lastBatchArrival: null,
        lastSignalAt: null,
        latestRaw: null,
        latestStep: null,
        fifoLag: 0,
        fifoLagMax: 0,
        fifoDropped: 0,
        unexpectedRealtimePackets: 0,
    };
}

function createRunDevice(id) {
    return {
        id,
        connectedAtStart: isConnected(id),
        serialTracker: Metrics.createSerialTracker(),
        windowRawPackets: 0,
        windowRawSamples: 0,
        drainRawPackets: 0,
        drainRawSamples: 0,
        unexpectedRealtimePackets: 0,
        unexpectedRealtimeSamples: 0,
        fieldCounts: { acc: 0, gyro: 0, press: 0, quat: 0 },
        batchGaps: [],
        deliveryAges: [],
        lastBatchArrival: null,
        lastSignalAt: null,
        latestRaw: null,
        latestStep: null,
        stepPackets: 0,
        completedSteps: 0,
        fifoLag: 0,
        fifoLagMax: 0,
        fifoDropped: 0,
        fifoFinalizedDropped: 0,
        fifoCurrentDropped: 0,
        fifoDrainRecovered: 0,
        fifoDrainMs: null,
        fifoStopped: false,
        fifoStopReason: null,
        fifoDrainError: null,
        fifoAnomalies: 0,
        lastProgressLogAt: 0,
        reconnectStart: {
            disconnects: reconnectStats[id].disconnects,
            attempts: reconnectStats[id].attempts,
            successes: reconnectStats[id].successes,
            failures: reconnectStats[id].failures,
        },
    };
}

function deviceLabel(id) {
    return `INSOLE 0${id + 1}`;
}

function logEvent(id, message, level = '') {
    const occurredAt = new Date();
    const entry = {
        timestamp: occurredAt.toISOString(),
        clock: occurredAt.toLocaleTimeString('ja-JP', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
        }),
        device: id === null ? 'SYSTEM' : `INSOLE 0${id + 1}`,
        level: level || 'info',
        message: String(message),
    };
    eventEntries.push(entry);
    if (eventEntries.length > MAX_EVENT_ENTRIES) eventEntries.shift();

    const row = document.createElement('div');
    row.className = `event-row ${level}`.trim();
    const time = document.createElement('time');
    time.textContent = entry.clock;
    const device = document.createElement('span');
    device.className = 'event-device';
    device.textContent = entry.device;
    const text = document.createElement('span');
    text.textContent = entry.message;
    row.append(time, device, text);
    dom.eventLog.prepend(row);
    while (dom.eventLog.children.length > MAX_EVENT_ROWS) {
        dom.eventLog.lastElementChild.remove();
    }
}

function formatSessionState(snapshot) {
    if (!snapshot) return 'session unavailable';
    return [
        `connected=${Boolean(snapshot.connected)}`,
        `transitioning=${Boolean(snapshot.transitioning)}`,
        `stream=${snapshot.streamingMode}`,
        `acquisition=${snapshot.sensorDataMode}`,
        `raw=${Boolean(snapshot.outputs?.sensorValues)}`,
        `step=${Boolean(snapshot.outputs?.stepAnalysis)}`,
        `sensorNotify=${Boolean(snapshot.sensorNotifyActive)}`,
        `fifo=${Boolean(snapshot.fifoActive)}`,
        `gait=${Boolean(snapshot.gaitActive)}`,
    ].join(' ');
}

function noteSessionState(id, snapshot) {
    if (!snapshot || snapshot.transitioning) return;
    const signature = formatSessionState(snapshot);
    if (lastSessionStateSignatures[id] === signature) return;
    lastSessionStateSignatures[id] = signature;
    logEvent(id, `Toolkit state: ${signature}`, snapshot.connected ? 'success' : 'warn');
}

function formatEventLogText() {
    const lines = [
        'Toolkit Data Mode Validation Event Log',
        `exportedAt=${new Date().toISOString()}`,
        `page=${window.location.href}`,
        `secureContext=${window.isSecureContext}`,
        `webBluetooth=${Boolean(navigator.bluetooth)}`,
        `selectedPreset=${selectedPresetId}`,
        `runState=${runState}`,
        ...DEVICE_IDS.map((id) => `${deviceLabel(id)} ${formatSessionState(sessions[id]?.snapshot())}`),
        '',
        'timestamp\tlevel\tdevice\tmessage',
    ];
    for (const entry of eventEntries) {
        lines.push(`${entry.timestamp}\t${entry.level}\t${entry.device}\t${entry.message}`);
    }
    return lines.join('\n');
}

async function writeClipboardText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Clipboard API is unavailable');
}

async function copyEventLog() {
    const originalHtml = dom.copyLog.innerHTML;
    dom.copyLog.disabled = true;
    try {
        const text = formatEventLogText();
        await writeClipboardText(text);
        dom.copyLog.textContent = `コピー済み (${eventEntries.length}件)`;
        logEvent(null, `イベントログをクリップボードへコピー: ${eventEntries.length} entries`, 'success');
    } catch (error) {
        dom.copyLog.textContent = 'コピー失敗';
        logEvent(null, `イベントログのコピー失敗: ${error.message || error}`, 'error');
    } finally {
        setTimeout(() => {
            dom.copyLog.innerHTML = originalHtml;
            dom.copyLog.disabled = false;
        }, 1800);
    }
}

function isConnected(id) {
    try {
        return !!(insoles[id] && typeof insoles[id].isConnected === 'function' && insoles[id].isConnected());
    } catch {
        return false;
    }
}

function connectedIds() {
    return DEVICE_IDS.filter((id) => isConnected(id));
}

function formatNumber(value, digits = 1, fallback = '—') {
    return Number.isFinite(value) ? Number(value).toFixed(digits) : fallback;
}

function formatVector(vector, digits = 2) {
    if (!vector) return '—';
    return `${formatNumber(vector.x, digits)} / ${formatNumber(vector.y, digits)} / ${formatNumber(vector.z, digits)}`;
}

function formatQuat(quat) {
    if (!quat) return '—';
    return `${formatNumber(quat.w, 3)} / ${formatNumber(quat.x, 3)} / ${formatNumber(quat.y, 3)} / ${formatNumber(quat.z, 3)}`;
}

function setText(id, value) {
    const target = document.getElementById(id);
    if (target) target.textContent = value;
}

function setRunState(next, message) {
    runState = next;
    dom.globalStateDot.className = `state-dot ${next === 'running' ? 'running' : next === 'idle' ? 'idle' : 'switching'}`;
    dom.globalState.textContent = next === 'running'
        ? `${PRESETS[selectedPresetId].label} 計測中`
        : next === 'draining'
            ? 'FIFO drain中'
            : next === 'switching'
                ? '設定切替中'
                : connectedIds().length > 0 ? '計測待機' : '接続待ち';
    updateControls();
    if (message) dom.runMessage.textContent = message;
}

function updateControls() {
    const count = connectedIds().length;
    dom.start.disabled = count === 0 || runState !== 'idle';
    dom.stop.disabled = !(runState === 'running');
    dom.clear.disabled = runState !== 'idle';
    dom.duration.disabled = runState !== 'idle';
    document.querySelectorAll('.preset-card').forEach((button) => {
        button.disabled = runState !== 'idle';
    });
    if (runState === 'idle' && count === 0) dom.runMessage.textContent = '① INSOLEを接続してください';
    if (runState === 'idle' && count > 0 && !finishingPromise) {
        dom.runMessage.textContent = `${count}台接続中。③「計測開始」を押すと正式な集計を開始します`;
    }
}

function resetLivePreview(reason) {
    signalPoints.length = 0;
    timingPoints.length = 0;
    for (const id of DEVICE_IDS) {
        previewDevices[id] = createPreviewDevice(id);
        renderDevice(id);
        renderSerialMap(id, null, null);
    }
    if (typeof AttitudeViz !== 'undefined') AttitudeViz.clearAll();
    renderAttitude();
    if (reason) logEvent(null, `ライブプレビューをリセット: ${reason}`);
}

async function selectPreset(id) {
    if (!PRESETS[id] || runState !== 'idle') return;
    selectedPresetId = id;
    document.querySelectorAll('.preset-card').forEach((button) => {
        button.classList.toggle('active', button.dataset.preset === id);
    });
    dom.selectedPreset.textContent = PRESETS[id].label;
    renderExpectations();
    logEvent(null, `プリセット選択: ${PRESETS[id].label}`, 'success');
    resetLivePreview(`${PRESETS[id].label}へ切替`);

    const ids = connectedIds();
    if (ids.length === 0) return;
    setRunState('switching', `② ${PRESETS[id].label} を実機へ適用中…`);
    const settled = await Promise.allSettled(ids.map((deviceId) => applyPresetToDevice(deviceId, PRESETS[id])));
    let applied = 0;
    settled.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            applied += 1;
        } else {
            logEvent(ids[index], `プリセット即時適用失敗: ${result.reason?.message || result.reason}`, 'error');
        }
    });
    setRunState(
        'idle',
        applied > 0
            ? `${PRESETS[id].label} を${applied}台へ適用済み。ライブ表示を確認して③「計測開始」へ`
            : '設定を適用できませんでした。イベントログを確認してください'
    );
}

function chip(text, level = 'neutral') {
    const span = document.createElement('span');
    span.className = `metric-chip ${level}`;
    span.textContent = text;
    return span;
}

function renderExpectations() {
    const preset = PRESETS[selectedPresetId];
    dom.expectations.replaceChildren();
    dom.expectations.append(
        chip(preset.acquisition === 'fifo' ? 'FIFO acquisition' : `Realtime format ${preset.streamingMode}`, 'pass'),
        chip(preset.raw ? 'Raw ON' : 'Raw OFF', preset.raw ? 'pass' : 'warn'),
        chip(preset.step ? 'Step ON' : 'Step OFF', preset.step ? 'pass' : 'neutral')
    );
    for (const field of ['acc', 'gyro', 'press', 'quat']) {
        dom.expectations.append(chip(`${field}: ${preset.fields[field] ? 'expected' : 'not expected'}`));
    }
    if (preset.nominalSampleHz) {
        dom.expectations.append(chip(`nominal ${preset.nominalSampleHz} sample/s`));
    }
}

async function applyPresetToDevice(id, preset) {
    const session = sessions[id];
    if (!session || !isConnected(id)) throw new Error(`${deviceLabel(id)} is not connected`);
    const before = session.snapshot();
    if (sessionMatchesPreset(before, preset)) {
        logEvent(id, `${preset.label} は適用済み: ${formatSessionState(before)}`, 'success');
        return;
    }

    // Raw/Stepの同時OFFは禁止。Rawを一時的に維持し、Stepが必要なら先に購読してから
    // streaming/acquisitionを切り替え、最後に目的の出力構成へ確定する。
    await session.setOutputs(Metrics.safeOutputBridge(before.outputs, {
        sensorValues: preset.raw,
        stepAnalysis: preset.step,
    }));
    await session.setStreamingMode(preset.streamingMode);
    await session.setSensorDataMode(preset.acquisition);
    await session.setOutputs({
        sensorValues: preset.raw,
        stepAnalysis: preset.step,
    });
    const after = session.snapshot();
    if (!sessionMatchesPreset(after, preset)) {
        throw new Error(`InsoleToolkit: preset state mismatch (${formatSessionState(after)})`);
    }
    logEvent(id, `${preset.label} を適用完了: ${formatSessionState(after)}`, 'success');
}

async function startRun() {
    if (runState !== 'idle') return;
    const ids = connectedIds();
    if (ids.length === 0) return;
    const preset = PRESETS[selectedPresetId];
    logEvent(
        null,
        `計測開始要求: preset=${preset.label} duration=${Number(dom.duration.value) / 1000}s devices=${ids.map((id) => id + 1).join(',')}`,
        'success'
    );
    setRunState('switching', `${preset.label}へ切り替えています…`);
    const settled = await Promise.allSettled(ids.map((id) => applyPresetToDevice(id, preset)));
    const activeIds = ids.filter((_, index) => settled[index].status === 'fulfilled');
    settled.forEach((result, index) => {
        if (result.status === 'rejected') {
            logEvent(ids[index], `設定適用失敗: ${result.reason?.message || result.reason}`, 'error');
        }
    });
    if (activeIds.length === 0) {
        setRunState('idle', '設定を適用できませんでした。接続状態を確認してください');
        return;
    }

    await new Promise((resolve) => setTimeout(resolve, 700));
    const startedAt = performance.now();
    currentRun = {
        id: `run-${Date.now()}`,
        presetId: preset.id,
        preset,
        activeIds,
        startedAt,
        endsAt: startedAt + Number(dom.duration.value),
        requestedDurationMs: Number(dom.duration.value),
        windowEndedAt: null,
        drainStartedAt: null,
        devices: Object.fromEntries(activeIds.map((id) => [id, createRunDevice(id)])),
    };
    signalPoints.length = 0;
    timingPoints.length = 0;
    for (const id of activeIds) {
        currentRun.devices[id].lastProgressLogAt = startedAt;
        document.getElementById(`device_card_${id}`).classList.add('active');
    }
    logEvent(null, `${preset.label} / ${activeIds.length}台 / ${Number(dom.duration.value) / 1000}秒 を開始`, 'success');
    setRunState('running', `${preset.label}を計測中`);
}

async function finishRun(reason = 'manual') {
    if (!currentRun || finishingPromise) return finishingPromise;
    finishingPromise = (async () => {
        const run = currentRun;
        run.windowEndedAt = performance.now();
        dom.stop.disabled = true;

        if (run.preset.acquisition === 'fifo') {
            setRunState('draining', 'FIFOを停止し、未回収serialをdrainしています…');
            run.drainStartedAt = performance.now();
            for (const id of run.activeIds) {
                run.devices[id].fifoStopped = false;
                run.devices[id].fifoStopReason = null;
                run.devices[id].fifoDrainError = null;
            }
            const drainResults = await Promise.allSettled(run.activeIds.map(async (id) => {
                await sessions[id].setSensorDataMode('realtime');
                run.devices[id].fifoDrainMs = performance.now() - run.drainStartedAt;
            }));
            drainResults.forEach((result, index) => {
                if (result.status !== 'rejected') return;
                const id = run.activeIds[index];
                const message = result.reason?.message || String(result.reason);
                run.devices[id].fifoDrainError = message;
                logEvent(id, `FIFO stop / drain失敗: ${message}`, 'error');
            });
        } else {
            setRunState('switching', '結果を集計しています…');
        }

        const results = run.activeIds.map((id) => finalizeDeviceResult(run, id));
        for (const result of results) {
            runHistory.unshift(result);
            lastResults[result.id] = result;
            document.getElementById(`device_card_${result.id}`).classList.remove('active');
            logEvent(
                result.id,
                formatResultLog(result),
                result.evaluation.level === 'pass' ? 'success' : result.evaluation.level
            );
        }
        currentRun = null;
        renderHistory();
        renderDownloads();
        logEvent(null, `${run.preset.label} を終了 (${reason})`, 'success');
        setRunState('idle', run.preset.acquisition === 'fifo'
            ? 'FIFO停止・drain完了。Raw acquisitionはRealtimeへ戻しました'
            : '計測完了。結果を履歴へ追加しました');
        return results;
    })().finally(() => {
        finishingPromise = null;
        updateControls();
    });
    return finishingPromise;
}

function runDeviceFor(id) {
    return currentRun && currentRun.devices[id] ? currentRun.devices[id] : null;
}

function noteReconnectData(id) {
    const reconnect = reconnectStats[id];
    if (!reconnect.pendingFirstData || reconnect.successAt === null) return;
    reconnect.firstDataAfterSuccessMs = performance.now() - reconnect.successAt;
    reconnect.pendingFirstData = false;
    renderReconnect(id);
    logEvent(id, `再接続後の最初のデータ: ${Math.round(reconnect.firstDataAfterSuccessMs)} ms`, 'success');
}

function noteBatchArrival(device, now) {
    if (device.lastBatchArrival !== null && runState === 'running') {
        const gap = now - device.lastBatchArrival;
        device.batchGaps.push(gap);
        timingPoints.push({ t: now, id: device.id, gap, lag: device.fifoLag });
    }
    device.lastBatchArrival = now;
}

function notePreviewBatchArrival(device, now) {
    if (device.startedAt === null) device.startedAt = now;
    if (device.lastBatchArrival !== null) {
        const gap = now - device.lastBatchArrival;
        device.batchGaps.push(gap);
        timingPoints.push({ t: now, id: device.id, gap, lag: device.fifoLag });
    }
    device.lastBatchArrival = now;
}

function sampleFieldList(sample) {
    return ['acc', 'gyro', 'press', 'quat']
        .filter((field) => Metrics.sampleHasField(sample, field))
        .join('+') || 'none';
}

function recordSample(device, sample, source, phase) {
    const inWindow = phase === 'running';
    const inDrain = phase === 'draining';
    const inPreview = phase === 'preview';
    if (inWindow) {
        device.windowRawSamples += 1;
        for (const field of ['acc', 'gyro', 'press', 'quat']) {
            if (Metrics.sampleHasField(sample, field)) device.fieldCounts[field] += 1;
        }
    } else if (inPreview) {
        device.rawSamples += 1;
        for (const field of ['acc', 'gyro', 'press', 'quat']) {
            if (Metrics.sampleHasField(sample, field)) device.fieldCounts[field] += 1;
        }
    } else if (inDrain) {
        device.drainRawSamples += 1;
    }

    const acc = sample.converted_acc || sample.acc || null;
    const gyro = sample.converted_gyro || sample.gyro || null;
    const press = sample.press || null;
    const quat = sample.quat || null;
    const pressureTotal = press?.values
        ? press.values.reduce((sum, value) => sum + Number(value || 0), 0)
        : null;
    const accNorm = acc ? Math.hypot(acc.x, acc.y, acc.z) : null;
    const deviceEpoch = Metrics.deviceTimestampToEpoch(sample.timestamp ?? sample.t);
    if ((inWindow || inDrain || inPreview) && deviceEpoch !== null) {
        const age = Date.now() - deviceEpoch;
        if (age >= -2000 && age <= 120000) device.deliveryAges.push(Math.max(0, age));
    }

    device.latestRaw = {
        source,
        acc,
        gyro,
        press,
        quat,
        pressureTotal,
        serial: sample.serial_number,
        timestamp: sample.timestamp ?? sample.t,
        arrivedAt: performance.now(),
    };
    if (quat && typeof AttitudeViz !== 'undefined') AttitudeViz.setQuat(device.id, quat);
    const now = performance.now();
    if ((inWindow || inPreview) && (device.lastSignalAt === null || now - device.lastSignalAt >= 8)) {
        signalPoints.push({
            t: now,
            id: device.id,
            accNorm,
            pressureTotal,
            step: false,
        });
        device.lastSignalAt = now;
    }
    if (inWindow || inDrain || inPreview) noteReconnectData(device.id);
}

function handleRealtimePacket(id, data, uuid) {
    if (uuid !== 'SENSOR_VALUES') return;
    if (![50, 55, 56].includes(data.getUint8(0))) return;
    const parsed = insoles[id].constructor.parseSensorValues
        ? insoles[id].constructor.parseSensorValues(data)
        : null;
    if (!parsed) return;

    if (!currentRun) {
        const preview = previewDevices[id];
        const state = sessions[id]?.snapshot();
        const expected = state?.connected
            && !state.transitioning
            && state.sensorDataMode === 'realtime'
            && state.outputs.sensorValues;
        if (!expected) {
            preview.unexpectedRealtimePackets += 1;
            if (preview.unexpectedRealtimePackets === 1) {
                logEvent(
                    id,
                    `選択中モードではRealtime Rawを表示対象外にしました: ${formatSessionState(state)}`,
                    'warn'
                );
            }
            return;
        }
        const now = performance.now();
        notePreviewBatchArrival(preview, now);
        preview.rawPackets += 1;
        Metrics.recordSerial(preview.serialTracker, parsed.serial_number);
        if (preview.rawPackets === 1) {
            logEvent(
                id,
                `Rawライブプレビュー受信開始: source=realtime header=${parsed.header} serial=${parsed.serial_number} samples=${parsed.samples.length} fields=${sampleFieldList(parsed.samples[0])}`,
                'success'
            );
        }
        for (const sample of parsed.samples) recordSample(preview, sample, 'realtime-preview', 'preview');
        return;
    }
    if (runState !== 'running') return;
    const device = runDeviceFor(id);
    if (!device) return;
    const now = performance.now();
    const expected = currentRun.preset.acquisition === 'realtime' && currentRun.preset.raw;
    if (!expected) {
        device.unexpectedRealtimePackets += 1;
        device.unexpectedRealtimeSamples += parsed.samples.length;
        for (const sample of parsed.samples) recordSample(device, sample, 'unexpected-realtime', 'unexpected');
        return;
    }
    noteBatchArrival(device, now);
    const firstPacket = device.windowRawPackets === 0;
    device.windowRawPackets += 1;
    const serialEvent = Metrics.recordSerial(device.serialTracker, parsed.serial_number);
    if (firstPacket) {
        logEvent(
            id,
            `Raw受信開始: source=realtime header=${parsed.header} serial=${parsed.serial_number} samples=${parsed.samples.length} fields=${sampleFieldList(parsed.samples[0])}`,
            'success'
        );
    } else if (serialEvent.kind === 'gap' && device.serialTracker.gapEvents.length === 1) {
        logEvent(id, `Realtime serial gapを検出: ${serialEvent.missing} missing（以降は進捗ログへ集約）`, 'warn');
    }
    for (const sample of parsed.samples) recordSample(device, sample, 'realtime', 'running');
}

function handleFifoSamples(id, samples) {
    if (!currentRun) {
        const preview = previewDevices[id];
        const state = sessions[id]?.snapshot();
        const expected = state?.connected
            && !state.transitioning
            && state.sensorDataMode === 'fifo'
            && state.outputs.sensorValues;
        if (!expected) return;
        notePreviewBatchArrival(preview, performance.now());
        const firstBatch = preview.rawPackets === 0;
        const serials = new Set(samples.map((sample) => sample.serial_number));
        preview.rawPackets += serials.size;
        for (const serial of serials) Metrics.recordSerial(preview.serialTracker, serial);
        if (firstBatch && samples.length > 0) {
            logEvent(
                id,
                `Rawライブプレビュー受信開始: source=fifo serial=${samples[0].serial_number} samples=${samples.length} fields=${sampleFieldList(samples[0])}`,
                'success'
            );
        }
        for (const sample of samples) recordSample(preview, sample, 'fifo-preview', 'preview');
        return;
    }
    if (currentRun.preset.acquisition !== 'fifo') return;
    if (runState !== 'running' && runState !== 'draining') return;
    const device = runDeviceFor(id);
    if (!device) return;
    const now = performance.now();
    noteBatchArrival(device, now);
    const serials = new Set();
    const firstBatch = device.windowRawPackets === 0 && device.drainRawPackets === 0;
    for (const sample of samples) {
        serials.add(sample.serial_number);
        recordSample(device, sample, 'fifo', runState);
    }
    for (const serial of serials) {
        Metrics.recordSerial(device.serialTracker, serial);
        if (runState === 'running') {
            device.windowRawPackets += 1;
        } else {
            device.drainRawPackets += 1;
        }
    }
    if (firstBatch && samples.length > 0) {
        logEvent(
            id,
            `Raw受信開始: source=fifo serial=${samples[0].serial_number} packets=${serials.size} samples=${samples.length} fields=${sampleFieldList(samples[0])}`,
            'success'
        );
    }
}

function handleFifoProgress(id, info) {
    const device = runDeviceFor(id);
    if (!device && !currentRun) {
        const preview = previewDevices[id];
        preview.fifoLag = Number(info.lag || 0);
        preview.fifoLagMax = Math.max(preview.fifoLagMax, preview.fifoLag);
        if (Number.isFinite(Number(info.dropped))) preview.fifoDropped = Number(info.dropped);
        return;
    }
    if (!device) return;
    device.fifoLag = Number(info.lag || 0);
    device.fifoLagMax = Math.max(device.fifoLagMax, device.fifoLag);
    if (Number.isFinite(Number(info.dropped))) {
        device.fifoCurrentDropped = Number(info.dropped);
        device.fifoDropped = device.fifoFinalizedDropped + device.fifoCurrentDropped;
    }
    if (info.draining) logEvent(id, `drain進行: lag ${device.fifoLag}`, 'warn');
}

function handleFifoDataLoss(id, info) {
    const device = runDeviceFor(id);
    if (device) {
        device.fifoCurrentDropped = Number(info.cumulative ?? info.dropped ?? 0);
        device.fifoDropped = device.fifoFinalizedDropped + device.fifoCurrentDropped;
    } else if (!currentRun) {
        previewDevices[id].fifoDropped = Number(info.cumulative ?? info.dropped ?? 0);
    }
    logEvent(id, `FIFO data loss: ${info.reason}, +${info.dropped}, cumulative ${info.cumulative}`, 'error');
}

function handleFifoStopped(id, info) {
    const device = runDeviceFor(id);
    if (device) {
        device.fifoCurrentDropped = Number(info.dropped || 0);
        device.fifoDropped = device.fifoFinalizedDropped + device.fifoCurrentDropped;
        device.fifoFinalizedDropped = device.fifoDropped;
        device.fifoCurrentDropped = 0;
        device.fifoDrainRecovered += Number(info.drainRecovered || 0);
        device.fifoStopped = true;
        device.fifoStopReason = info.reason || null;
    } else if (!currentRun) {
        previewDevices[id].fifoDropped = Number(info.dropped || 0);
    }
    logEvent(
        id,
        `FIFO停止: collected ${info.collected}, dropped ${info.dropped}, drain recovered ${info.drainRecovered || 0}`,
        info.dropped > 0 ? 'warn' : 'success'
    );
}

function handleStepRaw(id, packet) {
    if (!currentRun) {
        const preview = previewDevices[id];
        const state = sessions[id]?.snapshot();
        if (!state?.outputs.stepAnalysis || !state.gaitActive) return;
        preview.stepPackets += 1;
        if (preview.stepPackets === 1) {
            logEvent(id, `Stepライブプレビュー受信開始: type=${packet.type}`, 'success');
        }
        noteReconnectData(id);
        return;
    }
    if (runState !== 'running' || !currentRun.preset.step) return;
    const device = runDeviceFor(id);
    if (!device) return;
    const firstPacket = device.stepPackets === 0;
    device.stepPackets += 1;
    if (firstPacket) logEvent(id, `Step notify受信開始: type=${packet.type}`, 'success');
    if (packet.type === 'motion') {
        device.latestMotion = packet;
    }
    noteReconnectData(id);
}

function handleStepRow(id, row) {
    if (!currentRun) {
        const preview = previewDevices[id];
        const state = sessions[id]?.snapshot();
        if (!state?.outputs.stepAnalysis || !state.gaitActive) return;
        preview.completedSteps += 1;
        preview.latestStep = row;
        signalPoints.push({ t: performance.now(), id, accNorm: null, pressureTotal: null, step: true });
        logEvent(id, `Stepプレビュー ${row.step_number} 完成 (${row.gait_type})`, 'success');
        return;
    }
    if (runState !== 'running' || !currentRun.preset.step) return;
    const device = runDeviceFor(id);
    if (!device) return;
    device.completedSteps += 1;
    device.latestStep = row;
    signalPoints.push({ t: performance.now(), id, accNorm: null, pressureTotal: null, step: true });
    logEvent(id, `Step ${row.step_number} 完成 (${row.gait_type}, duration ${formatNumber(row.duration_s, 3)}s)`, 'success');
}

function handleFifoAnomaly(id, info) {
    const device = runDeviceFor(id);
    if (device) device.fifoAnomalies += 1;
    logEvent(id, `FIFO anomaly: expected ${info.expected}, received ${info.received}, no-data ${info.noData}`, 'warn');
}

function finalizeDeviceResult(run, id) {
    const device = run.devices[id];
    const endedAt = run.windowEndedAt || performance.now();
    const durationSec = Math.max(0.001, (endedAt - run.startedAt) / 1000);
    const serial = Metrics.summarizeSerialTracker(device.serialTracker);
    const batchGaps = Metrics.summarizeValues(device.batchGaps);
    const delivery = Metrics.summarizeValues(device.deliveryAges);
    const reconnect = reconnectStats[id];
    const result = {
        runId: run.id,
        timestamp: new Date().toISOString(),
        id,
        presetId: run.presetId,
        presetLabel: run.preset.label,
        durationSec,
        rawPackets: device.windowRawPackets,
        rawSamples: device.windowRawSamples,
        unexpectedRealtimePackets: device.unexpectedRealtimePackets,
        unexpectedRealtimeSamples: device.unexpectedRealtimeSamples,
        drainRawPackets: device.drainRawPackets,
        drainRawSamples: device.drainRawSamples,
        sampleHz: device.windowRawSamples / durationSec,
        packetHz: device.windowRawPackets / durationSec,
        p95GapMs: batchGaps.p95,
        maxGapMs: batchGaps.max,
        deliveryAgeMedianMs: delivery.median,
        deliveryAgeP95Ms: delivery.p95,
        fieldCounts: { ...device.fieldCounts },
        serial,
        serialTracker: device.serialTracker,
        fifoLagMax: device.fifoLagMax,
        fifoDropped: device.fifoDropped,
        fifoDrainRecovered: device.fifoDrainRecovered,
        fifoDrainMs: device.fifoDrainMs,
        fifoStopped: device.fifoStopped,
        fifoStopReason: device.fifoStopReason,
        fifoDrainError: device.fifoDrainError,
        fifoAnomalies: device.fifoAnomalies,
        stepPackets: device.stepPackets,
        stepPacketHz: device.stepPackets / durationSec,
        completedSteps: device.completedSteps,
        finished: true,
        latestRaw: device.latestRaw,
        latestStep: device.latestStep,
        reconnect: {
            disconnects: reconnect.disconnects - device.reconnectStart.disconnects,
            attempts: reconnect.attempts - device.reconnectStart.attempts,
            successes: reconnect.successes - device.reconnectStart.successes,
            failures: reconnect.failures - device.reconnectStart.failures,
            elapsedMs: reconnect.elapsedMs,
            firstDataAfterSuccessMs: reconnect.firstDataAfterSuccessMs,
            restoredAfterSuccessMs: reconnect.restoredAfterSuccessMs,
        },
    };
    result.evaluation = Metrics.evaluateDeviceRun(result, run.preset);
    return result;
}

function formatResultLog(result) {
    const checks = result.evaluation.checks
        .map((check) => `${check.label}=${check.level}(${check.detail})`)
        .join('; ');
    return [
        `RESULT ${result.evaluation.level.toUpperCase()}`,
        `preset=${result.presetLabel}`,
        `duration=${formatNumber(result.durationSec, 1)}s`,
        `samples=${result.rawSamples}`,
        `sampleHz=${formatNumber(result.sampleHz, 1)}`,
        `packets=${result.rawPackets}`,
        `packetHz=${formatNumber(result.packetHz, 1)}`,
        `serial=${result.serial.missing}/${result.serial.expected} missing`,
        `p95Gap=${formatNumber(result.p95GapMs, 0)}ms`,
        `age=${formatNumber(result.deliveryAgeMedianMs, 0)}ms`,
        `fifoDropped=${result.fifoDropped}`,
        `drainRecovered=${result.fifoDrainRecovered}`,
        `stepPackets=${result.stepPackets}`,
        `stepRows=${result.completedSteps}`,
        `reconnect=${result.reconnect.successes}/${result.reconnect.disconnects}`,
        `checks=[${checks}]`,
    ].join(' ');
}

function logRunProgress(now) {
    if (!currentRun || runState !== 'running') return;
    for (const id of currentRun.activeIds) {
        const device = currentRun.devices[id];
        if (now - device.lastProgressLogAt < RUN_PROGRESS_LOG_INTERVAL_MS) continue;
        device.lastProgressLogAt = now;
        const durationSec = Math.max(0.001, (now - currentRun.startedAt) / 1000);
        const serial = Metrics.summarizeSerialTracker(device.serialTracker);
        const p95Gap = Metrics.percentile(device.batchGaps, 0.95);
        logEvent(
            id,
            [
                'PROGRESS',
                `preset=${currentRun.preset.label}`,
                `elapsed=${formatNumber(durationSec, 1)}s`,
                `samples=${device.windowRawSamples}`,
                `sampleHz=${formatNumber(device.windowRawSamples / durationSec, 1)}`,
                `packets=${device.windowRawPackets}`,
                `packetHz=${formatNumber(device.windowRawPackets / durationSec, 1)}`,
                `serial=${serial.missing}/${serial.expected} missing`,
                `gapEvents=${device.serialTracker.gapEvents.length}`,
                `p95Gap=${formatNumber(p95Gap, 0)}ms`,
                `fifoLag=${device.fifoLag}`,
                `fifoDropped=${device.fifoDropped}`,
                `stepPackets=${device.stepPackets}`,
                `stepRows=${device.completedSteps}`,
            ].join(' '),
            serial.missing > 0 || device.fifoDropped > 0 ? 'warn' : 'success'
        );
    }
}

function liveResult(id) {
    if (!currentRun || !currentRun.devices[id]) return lastResults[id];
    const device = currentRun.devices[id];
    const durationSec = Math.max(0.001, ((currentRun.windowEndedAt || performance.now()) - currentRun.startedAt) / 1000);
    const result = {
        id,
        presetId: currentRun.presetId,
        presetLabel: currentRun.preset.label,
        durationSec,
        rawPackets: device.windowRawPackets,
        rawSamples: device.windowRawSamples,
        unexpectedRealtimePackets: device.unexpectedRealtimePackets,
        unexpectedRealtimeSamples: device.unexpectedRealtimeSamples,
        sampleHz: device.windowRawSamples / durationSec,
        packetHz: device.windowRawPackets / durationSec,
        p95GapMs: Metrics.percentile(device.batchGaps, 0.95),
        maxGapMs: device.batchGaps.length ? Math.max(...device.batchGaps) : null,
        deliveryAgeMedianMs: Metrics.percentile(device.deliveryAges, 0.5),
        fieldCounts: device.fieldCounts,
        serial: Metrics.summarizeSerialTracker(device.serialTracker),
        serialTracker: device.serialTracker,
        fifoLagMax: device.fifoLagMax,
        fifoDropped: device.fifoDropped,
        fifoDrainRecovered: device.fifoDrainRecovered,
        fifoDrainMs: device.fifoDrainMs,
        fifoStopped: device.fifoStopped,
        fifoStopReason: device.fifoStopReason,
        fifoDrainError: device.fifoDrainError,
        stepPackets: device.stepPackets,
        completedSteps: device.completedSteps,
        finished: false,
        latestRaw: device.latestRaw,
        latestStep: device.latestStep,
        reconnect: reconnectStats[id],
    };
    result.evaluation = Metrics.evaluateDeviceRun(result, currentRun.preset);
    return result;
}

function verdictLabel(level, active) {
    if (active && currentRun && performance.now() - currentRun.startedAt < 1800) return '計測開始';
    if (level === 'pass') return active ? '取得中 OK' : 'OK';
    if (level === 'warn') return '要確認';
    if (level === 'fail') return 'データ不足';
    return '未計測';
}

function actualModeLabel(snapshot) {
    if (!snapshot?.connected) return 'disconnected';
    const acquisition = snapshot.sensorDataMode === 'fifo'
        ? `FIFO${snapshot.fifoActive ? ' active' : ' starting'}`
        : `Realtime F${snapshot.streamingMode}`;
    return `${acquisition} / Raw ${snapshot.outputs.sensorValues ? 'ON' : 'OFF'} / Step ${snapshot.outputs.stepAnalysis ? 'ON' : 'OFF'}`;
}

function renderPreviewMetrics(id, preview) {
    const elapsedSec = preview.startedAt === null
        ? 0
        : Math.max(0.001, (performance.now() - preview.startedAt) / 1000);
    const serial = Metrics.summarizeSerialTracker(preview.serialTracker);
    const gaps = Metrics.summarizeValues(preview.batchGaps);
    const delivery = Metrics.summarizeValues(preview.deliveryAges);
    setText(`metric_sample_hz_${id}`, preview.rawSamples > 0 ? formatNumber(preview.rawSamples / elapsedSec, 1) : '0');
    setText(`metric_packet_hz_${id}`, preview.rawPackets > 0 ? formatNumber(preview.rawPackets / elapsedSec, 1) : '0');
    setText(`metric_missing_${id}`, String(serial.missing || 0));
    setText(`metric_gap_${id}`, gaps.p95 === null ? '—' : formatNumber(gaps.p95, 0));
    setText(`metric_age_${id}`, delivery.median === null ? '—' : formatNumber(delivery.median, 0));
    setText(`metric_steps_${id}`, String(preview.completedSteps || 0));
    setText(`metric_lag_${id}`, String(preview.fifoLagMax || 0));
    setText(`metric_dropped_${id}`, String(preview.fifoDropped || 0));
    renderSerialMap(id, preview.serialTracker, serial);
}

function renderDevice(id) {
    const result = !currentRun && isConnected(id) ? null : liveResult(id);
    const verdict = document.getElementById(`device_verdict_${id}`);
    if (!result) {
        const preview = previewDevices[id];
        const receiving = preview.rawPackets > 0 || preview.stepPackets > 0;
        verdict.className = `verdict ${receiving ? 'pass' : 'neutral'}`;
        verdict.textContent = receiving ? 'ライブ受信' : '未計測';
        const checks = document.getElementById(`checks_${id}`);
        checks.replaceChildren();
        const snapshot = sessions[id]?.snapshot();
        checks.append(chip(`実機状態: ${actualModeLabel(snapshot)}`, snapshot?.connected ? 'pass' : 'neutral'));
        if (receiving) checks.append(chip(`接続プレビュー: Raw ${preview.rawPackets} pkt / Step ${preview.stepPackets} pkt`, 'pass'));
        checks.append(chip('正式な数値集計は「計測開始」後', 'neutral'));
        renderPreviewMetrics(id, preview);
        renderLatestRaw(id, preview.latestRaw);
        renderLatestStep(id, preview.latestStep);
        return;
    }
    const active = !!(currentRun && currentRun.devices[id]);
    const level = result.evaluation?.level || 'neutral';
    verdict.className = `verdict ${active && performance.now() - currentRun.startedAt < 1800 ? 'neutral' : level}`;
    verdict.textContent = verdictLabel(level, active);
    setText(`metric_sample_hz_${id}`, result.rawSamples > 0 ? formatNumber(result.sampleHz, 1) : '0');
    setText(`metric_packet_hz_${id}`, result.rawPackets > 0 ? formatNumber(result.packetHz, 1) : '0');
    setText(`metric_missing_${id}`, String(result.serial?.missing ?? 0));
    setText(`metric_gap_${id}`, result.p95GapMs === null ? '—' : formatNumber(result.p95GapMs, 0));
    setText(`metric_age_${id}`, result.deliveryAgeMedianMs === null ? '—' : formatNumber(result.deliveryAgeMedianMs, 0));
    setText(`metric_steps_${id}`, String(result.completedSteps || 0));
    setText(`metric_lag_${id}`, String(result.fifoLagMax || 0));
    setText(`metric_dropped_${id}`, String(result.fifoDropped || 0));

    const checks = document.getElementById(`checks_${id}`);
    checks.replaceChildren();
    for (const check of result.evaluation?.checks || []) {
        const item = chip(`${check.label}: ${check.detail}`, check.level);
        item.title = check.detail;
        checks.append(item);
    }
    renderLatestRaw(id, result.latestRaw);
    renderLatestStep(id, result.latestStep);
    renderSerialMap(id, result.serialTracker, result.serial);
}

function quatToEulerDegrees(q) {
    if (!q) return null;
    const sinRoll = 2 * (q.w * q.x + q.y * q.z);
    const cosRoll = 1 - 2 * (q.x * q.x + q.y * q.y);
    const sinPitch = Math.max(-1, Math.min(1, 2 * (q.w * q.y - q.z * q.x)));
    const sinYaw = 2 * (q.w * q.z + q.x * q.y);
    const cosYaw = 1 - 2 * (q.y * q.y + q.z * q.z);
    return {
        roll: Math.atan2(sinRoll, cosRoll) * 180 / Math.PI,
        pitch: Math.asin(sinPitch) * 180 / Math.PI,
        yaw: Math.atan2(sinYaw, cosYaw) * 180 / Math.PI,
    };
}

function latestRawForDisplay(id) {
    if (currentRun?.devices[id]?.latestRaw) return currentRun.devices[id].latestRaw;
    if (previewDevices[id].latestRaw) return previewDevices[id].latestRaw;
    return lastResults[id]?.latestRaw || null;
}

function renderAttitude() {
    const preset = PRESETS[selectedPresetId];
    dom.attitudeMode.className = `metric-chip ${preset.fields.quat ? 'pass' : 'warn'}`;
    dom.attitudeMode.textContent = preset.fields.quat
        ? `${preset.label}: Quaternion expected`
        : `${preset.label}: Quaternionなし`;

    for (const id of DEVICE_IDS) {
        const latest = latestRawForDisplay(id);
        const quat = latest?.quat || null;
        const status = document.getElementById(`attitude_status_${id}`);
        const quatReadout = document.getElementById(`quat_readout_${id}`);
        const eulerReadout = document.getElementById(`euler_readout_${id}`);
        if (!preset.fields.quat) {
            status.className = 'metric-chip warn';
            status.textContent = 'このモードはQuatなし';
            quatReadout.textContent = 'w — / x — / y — / z —';
            eulerReadout.textContent = 'pitch — / roll — / yaw —';
            continue;
        }
        if (!quat) {
            status.className = 'metric-chip neutral';
            status.textContent = 'Quaternion受信待ち';
            quatReadout.textContent = 'w — / x — / y — / z —';
            eulerReadout.textContent = 'pitch — / roll — / yaw —';
            continue;
        }
        const euler = quatToEulerDegrees(quat);
        status.className = 'metric-chip pass';
        status.textContent = 'Quaternion受信中';
        quatReadout.textContent = `w ${formatNumber(quat.w, 3)} / x ${formatNumber(quat.x, 3)} / y ${formatNumber(quat.y, 3)} / z ${formatNumber(quat.z, 3)}`;
        eulerReadout.textContent = `pitch ${formatNumber(euler.pitch, 1)}° / roll ${formatNumber(euler.roll, 1)}° / yaw ${formatNumber(euler.yaw, 1)}°`;
    }
}

function renderLatestRaw(id, latest) {
    const row = document.getElementById(`latest_raw_${id}`);
    row.replaceChildren();
    const heading = document.createElement('th');
    heading.textContent = String(id + 1).padStart(2, '0');
    row.appendChild(heading);
    if (!latest) {
        const empty = document.createElement('td');
        empty.colSpan = 4;
        empty.className = 'text-secondary';
        empty.textContent = '未受信';
        row.appendChild(empty);
        return;
    }
    const values = [
        formatVector(latest.acc),
        formatVector(latest.gyro, 1),
        latest.press?.values
            ? `Σ ${Math.round(latest.pressureTotal).toLocaleString()} / ${latest.press.values.map((value) => Math.round(value)).join(', ')}`
            : '—',
        formatQuat(latest.quat),
    ];
    for (const value of values) {
        const cell = document.createElement('td');
        const span = document.createElement('span');
        span.className = 'data-value';
        span.textContent = value;
        cell.appendChild(span);
        row.appendChild(cell);
    }
}

function renderLatestStep(id, latest) {
    const row = document.getElementById(`latest_step_${id}`);
    row.replaceChildren();
    const heading = document.createElement('th');
    heading.textContent = String(id + 1).padStart(2, '0');
    row.appendChild(heading);
    if (!latest) {
        const empty = document.createElement('td');
        empty.colSpan = 5;
        empty.className = 'text-secondary';
        empty.textContent = '未受信';
        row.appendChild(empty);
        return;
    }
    const values = [
        latest.step_number ?? '—',
        latest.gait_type ?? '—',
        latest.duration_s === null ? '—' : `${formatNumber(latest.duration_s, 3)} s`,
        latest.stride_norm_m === null ? '—' : `${formatNumber(latest.stride_norm_m, 3)} m`,
        latest.pronation_deg === null ? '—' : `${formatNumber(latest.pronation_deg, 1)}° / ${latest.pronation_type}`,
    ];
    for (const value of values) {
        const cell = document.createElement('td');
        cell.textContent = String(value);
        row.appendChild(cell);
    }
}

function prepareCanvas(canvas) {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight || Number(canvas.getAttribute('height')) || 200);
    const ratio = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
    }
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    return { context, width, height };
}

function renderSerialMap(id, tracker, summary) {
    const canvas = document.getElementById(`serial_map_${id}`);
    const { context, width, height } = prepareCanvas(canvas);
    context.fillStyle = '#263541';
    context.fillRect(0, 0, width, height);
    if (!tracker || !summary || summary.expected === 0) {
        setText(`serial_text_${id}`, '未計測');
        return;
    }
    const expected = summary.expected;
    for (let x = 0; x < width; x += 1) {
        const from = Math.floor((x / width) * expected);
        const to = Math.max(from + 1, Math.floor(((x + 1) / width) * expected));
        let missing = false;
        for (let offset = from; offset < Math.min(to, expected); offset += 1) {
            const serial = (tracker.first + offset) % Metrics.SERIAL_MOD;
            if (!tracker.serials.has(serial)) {
                missing = true;
                break;
            }
        }
        context.fillStyle = missing ? '#ff6675' : '#5de28d';
        context.fillRect(x, 0, 1, height);
    }
    setText(
        `serial_text_${id}`,
        `${summary.received}/${summary.expected} ・ missing ${summary.missing} ・ reorder ${summary.outOfOrder}`
    );
}

function drawLaneGrid(context, width, height, laneCount, label) {
    context.strokeStyle = 'rgba(38, 53, 65, 0.75)';
    context.lineWidth = 1;
    for (let second = 0; second <= CHART_WINDOW_MS / 1000; second += 1) {
        const x = width - (second * 1000 / CHART_WINDOW_MS) * width;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
    }
    for (let lane = 1; lane < laneCount; lane += 1) {
        const y = lane * height / laneCount;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
    }
    context.fillStyle = '#8fa2b2';
    context.font = '11px sans-serif';
    for (let lane = 0; lane < laneCount; lane += 1) {
        context.fillText(`${deviceLabel(lane)} ${label || ''}`.trim(), 8, lane * height / laneCount + 16);
    }
}

function drawSignalChart() {
    const { context, width, height } = prepareCanvas(dom.signalChart);
    const now = performance.now();
    while (signalPoints.length && signalPoints[0].t < now - CHART_WINDOW_MS) signalPoints.shift();
    drawLaneGrid(context, width, height, 2, '');
    const laneHeight = height / 2;

    for (const id of DEVICE_IDS) {
        const points = signalPoints.filter((point) => point.id === id && !point.step);
        const maxAcc = Math.max(1, ...points.map((point) => point.accNorm || 0));
        const maxPress = Math.max(1, ...points.map((point) => point.pressureTotal || 0));
        drawSignalLine(context, points, id, laneHeight, width, now, 'accNorm', maxAcc, '#3dd7f0');
        drawSignalLine(context, points, id, laneHeight, width, now, 'pressureTotal', maxPress, '#ffad42');
        for (const point of signalPoints.filter((item) => item.id === id && item.step)) {
            const x = width - ((now - point.t) / CHART_WINDOW_MS) * width;
            if (x < 0 || x > width) continue;
            context.strokeStyle = '#5de28d';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(x, id * laneHeight + 22);
            context.lineTo(x, (id + 1) * laneHeight - 5);
            context.stroke();
        }
    }
}

function drawSignalLine(context, points, id, laneHeight, width, now, key, max, color) {
    let started = false;
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.beginPath();
    for (const point of points) {
        const value = point[key];
        if (!Number.isFinite(value)) continue;
        const x = width - ((now - point.t) / CHART_WINDOW_MS) * width;
        const y = (id + 1) * laneHeight - 8 - (value / max) * (laneHeight - 34);
        if (!started) {
            context.moveTo(x, y);
            started = true;
        } else {
            context.lineTo(x, y);
        }
    }
    if (started) context.stroke();
}

function drawTimingChart() {
    const { context, width, height } = prepareCanvas(dom.timingChart);
    const now = performance.now();
    while (timingPoints.length && timingPoints[0].t < now - CHART_WINDOW_MS) timingPoints.shift();
    drawLaneGrid(context, width, height, 2, 'arrival');
    const laneHeight = height / 2;
    const maxGap = Math.max(100, Math.min(2500, ...timingPoints.map((point) => point.gap || 0)));
    const maxLag = Math.max(1, ...timingPoints.map((point) => point.lag || 0));

    for (const id of DEVICE_IDS) {
        const points = timingPoints.filter((point) => point.id === id);
        let gapStarted = false;
        let lagStarted = false;
        context.lineWidth = 1.5;
        context.strokeStyle = '#ffad42';
        context.beginPath();
        for (const point of points) {
            const x = width - ((now - point.t) / CHART_WINDOW_MS) * width;
            const y = (id + 1) * laneHeight - 8 - (Math.min(point.gap, maxGap) / maxGap) * (laneHeight - 34);
            if (!gapStarted) {
                context.moveTo(x, y);
                gapStarted = true;
            } else {
                context.lineTo(x, y);
            }
        }
        if (gapStarted) context.stroke();

        context.strokeStyle = '#ae8bff';
        context.beginPath();
        for (const point of points) {
            const x = width - ((now - point.t) / CHART_WINDOW_MS) * width;
            const y = (id + 1) * laneHeight - 8 - ((point.lag || 0) / maxLag) * (laneHeight - 34);
            if (!lagStarted) {
                context.moveTo(x, y);
                lagStarted = true;
            } else {
                context.lineTo(x, y);
            }
        }
        if (lagStarted) context.stroke();
    }
    context.fillStyle = '#8fa2b2';
    context.font = '10px sans-serif';
    context.fillText(`gap scale 0–${Math.round(maxGap)} ms`, Math.max(8, width - 145), 14);
}

function renderConnectionState(id) {
    const insole = insoles[id];
    const state = insole?.connectionState || (isConnected(id) ? 'connected' : 'disconnected');
    const stateElement = document.getElementById(`connection_state_${id}`);
    stateElement.textContent = state;
    stateElement.className = `metric-chip ${state === 'connected' ? 'pass' : state === 'reconnecting' ? 'warn' : 'neutral'}`;
    const name = insole?.bluetoothDevice?.name || '未選択';
    setText(`connection_name_${id}`, name);
    const mountPosition = insole?.device_information?.mount_position;
    if (typeof AttitudeViz !== 'undefined' && Number.isFinite(Number(mountPosition))) {
        AttitudeViz.setFoot(id, (Number(mountPosition) & 0b1) === 1 ? 'R' : 'L');
    }
}

function renderReconnect(id) {
    const state = reconnectStats[id];
    const card = document.getElementById(`reconnect_${id}`);
    const badge = card.querySelector('.metric-chip');
    let badgeLevel = 'neutral';
    let badgeText = '未観測';
    if (state.failures > 0) {
        badgeLevel = 'fail';
        badgeText = '再接続失敗';
    } else if (state.successes > 0 && state.firstDataAfterSuccessMs !== null) {
        badgeLevel = 'pass';
        badgeText = '再接続・データ復帰';
    } else if (state.attempts > 0) {
        badgeLevel = 'warn';
        badgeText = '再接続中';
    } else if (state.disconnects > 0) {
        badgeLevel = 'warn';
        badgeText = '切断検出';
    }
    badge.className = `metric-chip ${badgeLevel}`;
    badge.textContent = badgeText;
    const values = [
        state.disconnects,
        state.attempts,
        state.successes,
        state.elapsedMs === null ? '—' : `${Math.round(state.elapsedMs)} ms`,
        state.firstDataAfterSuccessMs === null ? '—' : `${Math.round(state.firstDataAfterSuccessMs)} ms`,
    ];
    card.querySelectorAll('dd').forEach((element, index) => {
        element.textContent = String(values[index]);
    });
}

function sessionMatchesPreset(state, preset) {
    if (!state?.connected || state.transitioning) return false;
    if (state.streamingMode !== preset.streamingMode) return false;
    if (state.sensorDataMode !== preset.acquisition) return false;
    if (state.outputs.sensorValues !== preset.raw || state.outputs.stepAnalysis !== preset.step) return false;
    if (preset.raw && preset.acquisition === 'fifo' && !state.fifoActive) return false;
    if (preset.raw && preset.acquisition === 'realtime' && !state.sensorNotifyActive) return false;
    if (preset.acquisition === 'realtime' && state.fifoActive) return false;
    if (!preset.raw && state.sensorNotifyActive) return false;
    if (preset.step && !state.gaitActive) return false;
    if (!preset.step && state.gaitActive) return false;
    return true;
}

function desiredStateRestored(id) {
    if (!currentRun || !currentRun.activeIds.includes(id)) return false;
    return sessionMatchesPreset(sessions[id]?.snapshot(), currentRun.preset);
}

function ensureSelectedPresetAfterConnect(id, snapshot) {
    if (
        runState !== 'idle'
        || pendingConnectPresetApply[id]
        || !snapshot?.connected
        || snapshot.transitioning
        || sessionMatchesPreset(snapshot, PRESETS[selectedPresetId])
    ) return;

    pendingConnectPresetApply[id] = true;
    setTimeout(async () => {
        try {
            logEvent(id, `接続後に選択プリセットを自動適用: ${PRESETS[selectedPresetId].label}`, 'success');
            await applyPresetToDevice(id, PRESETS[selectedPresetId]);
            resetLivePreview(`${deviceLabel(id)} 接続後の設定適用`);
        } catch (error) {
            logEvent(id, `接続後プリセット適用失敗: ${error.message || error}`, 'error');
        } finally {
            pendingConnectPresetApply[id] = false;
            updateControls();
        }
    }, 0);
}

function updateReconnectRestore() {
    for (const id of DEVICE_IDS) {
        const reconnect = reconnectStats[id];
        if (!reconnect.pendingRestore || reconnect.successAt === null) continue;
        if (desiredStateRestored(id)) {
            reconnect.restoredAfterSuccessMs = performance.now() - reconnect.successAt;
            reconnect.pendingRestore = false;
            renderReconnect(id);
            logEvent(id, `Toolkit選択状態を復元: ${Math.round(reconnect.restoredAfterSuccessMs)} ms`, 'success');
        }
    }
}

function renderHistory() {
    dom.historyBody.replaceChildren();
    if (runHistory.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 12;
        cell.className = 'empty-row';
        cell.textContent = '計測完了後に設定別の結果が並びます';
        row.appendChild(cell);
        dom.historyBody.appendChild(row);
        return;
    }
    for (const result of runHistory) {
        const row = document.createElement('tr');
        const serial = `${result.serial.missing}/${result.serial.expected}`;
        const fifo = result.presetId.includes('fifo')
            ? `drop ${result.fifoDropped} / drain ${result.fifoDrainRecovered}`
            : '—';
        const step = PRESETS[result.presetId].step
            ? `${result.stepPackets} pkt / ${result.completedSteps} rows`
            : '—';
        const reconnect = result.reconnect.successes > 0
            ? `${result.reconnect.successes} success / ${formatNumber(result.reconnect.firstDataAfterSuccessMs, 0)} ms`
            : result.reconnect.disconnects > 0 ? `${result.reconnect.disconnects} disconnect` : '—';
        const values = [
            new Date(result.timestamp).toLocaleTimeString('ja-JP', { hour12: false }),
            result.presetLabel,
            `0${result.id + 1}`,
            verdictLabel(result.evaluation.level, false),
            formatNumber(result.sampleHz, 1),
            formatNumber(result.packetHz, 1),
            result.p95GapMs === null ? '—' : `${formatNumber(result.p95GapMs, 0)} ms`,
            result.deliveryAgeMedianMs === null ? '—' : `${formatNumber(result.deliveryAgeMedianMs, 0)} ms`,
            serial,
            fifo,
            step,
            reconnect,
        ];
        values.forEach((value, index) => {
            const cell = document.createElement(index === 2 ? 'th' : 'td');
            if (index === 3) cell.appendChild(chip(String(value), result.evaluation.level));
            else cell.textContent = String(value);
            row.appendChild(cell);
        });
        dom.historyBody.appendChild(row);
    }
}

function renderDownloads() {
    dom.downloadJson.disabled = runHistory.length === 0;
    dom.downloadFifo.disabled = !sessions.some((session) => session?.fifo?.collectedCount > 0);
    dom.downloadStep.disabled = !sessions.some((session) => session?.gait?.stepCount > 0);
}

function serializableResult(result) {
    const copy = { ...result };
    delete copy.serialTracker;
    if (copy.latestRaw) {
        copy.latestRaw = { ...copy.latestRaw };
        delete copy.latestRaw.arrivedAt;
    }
    return copy;
}

function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        anchor.remove();
    }, 1000);
}

function stamp() {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function clearDisplay() {
    if (runState !== 'idle') return;
    runHistory = [];
    lastResults[0] = null;
    lastResults[1] = null;
    signalPoints.length = 0;
    timingPoints.length = 0;
    for (const id of DEVICE_IDS) {
        previewDevices[id] = createPreviewDevice(id);
        renderDevice(id);
        renderSerialMap(id, null, null);
        renderLatestRaw(id, null);
        renderLatestStep(id, null);
        document.getElementById(`checks_${id}`).replaceChildren();
        for (const metric of ['sample_hz', 'packet_hz', 'missing', 'gap', 'age', 'steps', 'lag', 'dropped']) {
            setText(`metric_${metric}_${id}`, '—');
        }
    }
    renderHistory();
    renderDownloads();
    if (typeof AttitudeViz !== 'undefined') AttitudeViz.clearAll();
    renderAttitude();
    logEvent(null, '計測表示と履歴をクリア');
}

function resetReconnectLogs() {
    for (const id of DEVICE_IDS) {
        reconnectStats[id] = createReconnectStats();
        renderReconnect(id);
    }
    logEvent(null, '再接続ログをリセット');
}

function installDevice(id) {
    buildInsoleToolkit(
        document.getElementById(`toolkit${id}`),
        deviceLabel(id),
        id,
        {
            streamingMode: 4,
            autoReconnect: true,
            reconnectIntervalMs: 2000,
            sensorDataMode: 'realtime',
            outputs: { sensorValues: true, stepAnalysis: false },
            fifo: {
                startupDelayMs: 800,
                drainTimeoutMs: 5000,
                onSamples(deviceId, samples) {
                    handleFifoSamples(deviceId, samples);
                },
                onProgress(info) {
                    handleFifoProgress(id, info);
                },
                onAnomaly(info) {
                    handleFifoAnomaly(id, info);
                },
                onDataLoss(info) {
                    handleFifoDataLoss(id, info);
                },
                onStopped(info) {
                    handleFifoStopped(id, info);
                },
                onError(error) {
                    logEvent(id, `FIFO error: ${error.message || error}`, 'error');
                },
            },
            gait: {
                onRaw(deviceId, packet) {
                    handleStepRaw(deviceId, packet);
                },
                onGait(deviceId, row) {
                    handleStepRow(deviceId, row);
                },
                onError(error) {
                    logEvent(id, `Step Analysis error: ${error.message || error}`, 'error');
                },
            },
            onStateChange(snapshot) {
                renderConnectionState(id);
                noteSessionState(id, snapshot);
                ensureSelectedPresetAfterConnect(id, snapshot);
            },
            onError(error) {
                const cancelled = error?.name === 'NotFoundError';
                logEvent(
                    id,
                    cancelled
                        ? 'Toolkit: Bluetooth chooserをキャンセル'
                        : `Toolkit error: ${error.message || error}`,
                    cancelled ? 'warn' : 'error'
                );
            },
        }
    );
    sessions[id] = getInsoleToolkitSession(id);
    insoles[id].setup();
    insoles[id].gotData = function (data, uuid) {
        handleRealtimePacket(this.id, data, uuid);
    };
    insoles[id].onScan = function (deviceName) {
        logEvent(this.id, `Bluetooth device選択: ${deviceName || 'name unavailable'}`, 'success');
    };
    insoles[id].onConnect = function (uuid) {
        logEvent(this.id, `GATT接続: ${uuid}`, 'success');
    };
    insoles[id].onStartNotify = function (uuid) {
        logEvent(this.id, `Notify開始: ${uuid}`, 'success');
    };
    insoles[id].onStopNotify = function (uuid) {
        logEvent(this.id, `Notify停止: ${uuid}`, 'warn');
    };
    insoles[id].onError = function (error) {
        const cancelled = error?.name === 'NotFoundError';
        logEvent(
            this.id,
            cancelled
                ? 'Core: Bluetooth chooserをキャンセル（接続済みデバイスには影響なし）'
                : `Core error: ${error?.message || error}`,
            cancelled ? 'warn' : 'error'
        );
    };
    insoles[id].onDisconnect = function () {
        const reconnect = reconnectStats[this.id];
        reconnect.disconnects += 1;
        reconnect.disconnectedAt = performance.now();
        reconnect.pendingFirstData = false;
        reconnect.pendingRestore = false;
        logEvent(this.id, '物理切断を検出', 'warn');
        renderReconnect(this.id);
    };
    insoles[id].onReconnectAttempt = function (info) {
        const reconnect = reconnectStats[this.id];
        reconnect.attempts += 1;
        logEvent(this.id, `再接続試行 ${info.attempt}/${info.maxAttempts}`, 'warn');
        renderReconnect(this.id);
    };
    insoles[id].onReconnectSuccess = function (info) {
        const reconnect = reconnectStats[this.id];
        reconnect.successes += 1;
        reconnect.successAt = performance.now();
        reconnect.elapsedMs = info.elapsedMs;
        reconnect.firstDataAfterSuccessMs = null;
        reconnect.restoredAfterSuccessMs = null;
        reconnect.pendingFirstData = true;
        reconnect.pendingRestore = true;
        logEvent(this.id, `再接続成功 (${info.elapsedMs} ms)`, 'success');
        renderReconnect(this.id);
    };
    insoles[id].onReconnectFailed = function (info) {
        const reconnect = reconnectStats[this.id];
        reconnect.failures += 1;
        reconnect.elapsedMs = info.elapsedMs;
        reconnect.pendingFirstData = false;
        reconnect.pendingRestore = false;
        logEvent(this.id, `再接続失敗 (${info.elapsedMs} ms)`, 'error');
        renderReconnect(this.id);
    };
}

document.querySelectorAll('.preset-card').forEach((button) => {
    button.addEventListener('click', () => {
        selectPreset(button.dataset.preset).catch((error) => {
            logEvent(null, `プリセット切替失敗: ${error.message || error}`, 'error');
            setRunState('idle', 'プリセット切替に失敗しました。イベントログを確認してください');
        });
    });
});
dom.start.addEventListener('click', startRun);
dom.stop.addEventListener('click', () => finishRun('manual'));
dom.clear.addEventListener('click', clearDisplay);
dom.resetReconnect.addEventListener('click', resetReconnectLogs);
dom.copyLog.addEventListener('click', copyEventLog);
dom.resetAttitude.addEventListener('click', () => {
    if (typeof AttitudeViz !== 'undefined') AttitudeViz.reset();
    logEvent(null, '3D姿勢の基準を現在向きへリセット', 'success');
});
dom.downloadJson.addEventListener('click', () => {
    const payload = {
        exportedAt: new Date().toISOString(),
        page: 'toolkit-mode-validation',
        results: runHistory.map(serializableResult),
        events: eventEntries.slice(),
    };
    downloadBlob(JSON.stringify(payload, null, 2), `toolkit-mode-validation-${stamp()}.json`, 'application/json');
});
dom.downloadFifo.addEventListener('click', () => {
    for (const id of DEVICE_IDS) {
        if (sessions[id]?.fifo?.collectedCount > 0) {
            sessions[id].fifo.download(`toolkit-fifo-insole0${id + 1}-${stamp()}.csv`);
        }
    }
});
dom.downloadStep.addEventListener('click', () => {
    for (const id of DEVICE_IDS) {
        if (sessions[id]?.gait?.stepCount > 0) {
            sessions[id].gait.download(`toolkit-step-insole0${id + 1}-${stamp()}.csv`);
        }
    }
});

if (!window.isSecureContext || !navigator.bluetooth) {
    dom.bluetoothWarning.classList.remove('d-none');
    dom.secureContext.className = 'metric-chip fail';
    dom.secureContext.textContent = 'Web Bluetooth unavailable';
} else {
    dom.secureContext.className = 'metric-chip pass';
    dom.secureContext.textContent = 'Secure context / Web Bluetooth OK';
}

for (const id of DEVICE_IDS) installDevice(id);
renderExpectations();
renderAttitude();
renderHistory();
renderDownloads();
updateControls();
logEvent(null, '検証ダッシュボードを初期化', 'success');
logEvent(
    null,
    `Environment: secureContext=${window.isSecureContext} webBluetooth=${Boolean(navigator.bluetooth)} preset=${PRESETS[selectedPresetId].label}`,
    window.isSecureContext && navigator.bluetooth ? 'success' : 'error'
);
logEvent(null, '操作手順: ①接続 → ②プリセット選択 → ③計測開始。接続直後はライブプレビューのみ表示', 'success');

let lastUiRender = 0;
function animationLoop(now) {
    drawSignalChart();
    drawTimingChart();
    updateReconnectRestore();
    logRunProgress(now);

    if (currentRun && runState === 'running') {
        const elapsed = now - currentRun.startedAt;
        const remaining = Math.max(0, currentRun.endsAt - now);
        dom.timer.textContent = `${String(Math.floor(elapsed / 60000)).padStart(2, '0')}:${String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0')}.${Math.floor((elapsed % 1000) / 100)}`;
        dom.runMessage.textContent = `${currentRun.preset.label} / ${currentRun.activeIds.length}台 / 残り ${(remaining / 1000).toFixed(1)}秒`;
        if (remaining <= 0 && !finishingPromise) finishRun('timer');
    } else if (!currentRun) {
        dom.timer.textContent = '00:00.0';
    }

    if (now - lastUiRender > 250) {
        lastUiRender = now;
        for (const id of DEVICE_IDS) {
            renderConnectionState(id);
            renderDevice(id);
            renderReconnect(id);
        }
        renderAttitude();
        const newest = DEVICE_IDS
            .flatMap((id) => [
                liveResult(id)?.latestRaw?.arrivedAt,
                previewDevices[id]?.latestRaw?.arrivedAt,
            ])
            .filter(Number.isFinite)
            .sort((a, b) => b - a)[0];
        if (Number.isFinite(newest)) {
            const age = Math.max(0, performance.now() - newest);
            dom.latestDataAge.textContent = `last raw ${Math.round(age)} ms ago`;
            dom.latestDataAge.className = `metric-chip ${age < 300 ? 'pass' : age < 1500 ? 'warn' : 'fail'}`;
        } else {
            dom.latestDataAge.textContent = 'data age —';
            dom.latestDataAge.className = 'metric-chip neutral';
        }
        updateControls();
    }
    requestAnimationFrame(animationLoop);
}
requestAnimationFrame(animationLoop);
