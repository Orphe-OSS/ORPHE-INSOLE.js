/* global buildInsoleToolkit, getInsoleToolkitSession, insoles, insoleToolkitMeasurementToCSV */

'use strict';

const DEVICE_IDS = [0, 1];
const WARMUP_MS = 4000;
const RESTORE_OBSERVE_MS = 4000;
const MAX_EVENTS = 5000;
const REALTIME_HEADERS = new Set([50, 55, 56]);
const PROFILE_EXPECTATIONS = {
    'realtime-full-step': {
        sensorDataMode: 'realtime',
        raw: true,
        step: true,
        sensorNotify: true,
        gait: true,
    },
    'step-analysis': {
        sensorDataMode: 'realtime',
        raw: false,
        step: true,
        sensorNotify: false,
        gait: true,
    },
};
const SCENARIOS = {
    'dual-realtime-step': {
        label: '両方 Realtime Raw + Step',
        profiles: ['realtime-full-step', 'realtime-full-step'],
    },
    'dual-step-only': {
        label: '両方 Step-only',
        profiles: ['step-analysis', 'step-analysis'],
    },
    mixed: {
        label: '左右で異なるprofile',
        profiles: ['realtime-full-step', 'step-analysis'],
    },
};

const sessions = [null, null];
const counters = DEVICE_IDS.map(() => createCounters());
const lastStateSignatures = [null, null];
const latestMeasurements = [null, null];
const eventEntries = [];
const runHistory = [];
let activeRun = null;
let runSequence = 0;
let runStartedAt = null;

const dom = {
    globalDot: document.getElementById('global_dot'),
    globalStatus: document.getElementById('global_status'),
    timer: document.getElementById('test_timer'),
    secureContext: document.getElementById('secure_context'),
    webBluetooth: document.getElementById('web_bluetooth'),
    environmentWarning: document.getElementById('environment_warning'),
    connectionBadge: document.getElementById('connection_badge'),
    duration: document.getElementById('duration_select'),
    start: document.getElementById('start_button'),
    stop: document.getElementById('stop_button'),
    stageLabel: document.getElementById('stage_label'),
    stageDetail: document.getElementById('stage_detail'),
    progress: document.getElementById('progress_bar'),
    history: document.getElementById('history_body'),
    eventLog: document.getElementById('event_log'),
    copyLog: document.getElementById('copy_log_button'),
    downloadJson: document.getElementById('download_json_button'),
    downloadCsv: document.getElementById('download_csv_button'),
    clearLog: document.getElementById('clear_log_button'),
};

function createCounters() {
    return {
        realtimePackets: 0,
        stepTransportPackets: 0,
        stepPackets: 0,
        stepInvalidPackets: 0,
        stepRows: 0,
        fifoSamples: 0,
        fifoBatches: 0,
        fifoDropped: 0,
        fifoLagMax: 0,
        drainRecovered: 0,
        firstRealtimeLogged: false,
        firstStepTransportLogged: false,
        firstStepLogged: false,
        firstStepInvalidLogged: false,
        firstFifoLogged: false,
    };
}

function copyCounters(id) {
    return { ...counters[id] };
}

function counterDelta(after, before) {
    return {
        realtimePackets: after.realtimePackets - before.realtimePackets,
        stepTransportPackets: after.stepTransportPackets - before.stepTransportPackets,
        stepPackets: after.stepPackets - before.stepPackets,
        stepInvalidPackets: after.stepInvalidPackets - before.stepInvalidPackets,
        stepRows: after.stepRows - before.stepRows,
        fifoSamples: after.fifoSamples - before.fifoSamples,
        fifoBatches: after.fifoBatches - before.fifoBatches,
        fifoDropped: after.fifoDropped - before.fifoDropped,
        drainRecovered: after.drainRecovered - before.drainRecovered,
    };
}

function deviceLabel(id) {
    return `INSOLE 0${id + 1}`;
}

function isConnected(id) {
    try {
        return Boolean(insoles[id]?.isConnected?.());
    } catch {
        return false;
    }
}

function connectedIds() {
    return DEVICE_IDS.filter(isConnected);
}

function selectedScenario() {
    const input = document.querySelector('input[name="scenario"]:checked');
    return SCENARIOS[input?.value] || SCENARIOS['dual-realtime-step'];
}

function formatSessionState(snapshot) {
    if (!snapshot) return 'session=unavailable';
    const gait = snapshot.gaitDiagnostics;
    return [
        `connected=${Boolean(snapshot.connected)}`,
        `transitioning=${Boolean(snapshot.transitioning)}`,
        `profile=${snapshot.profileId}`,
        `stream=${snapshot.streamingMode}`,
        `acquisition=${snapshot.sensorDataMode}`,
        `raw=${Boolean(snapshot.outputs?.sensorValues)}`,
        `step=${Boolean(snapshot.outputs?.stepAnalysis)}`,
        `sensorNotify=${Boolean(snapshot.sensorNotifyActive)}`,
        `fifo=${Boolean(snapshot.fifoActive)}`,
        `gait=${Boolean(snapshot.gaitActive)}`,
        `gaitTransport=${gait?.transportNotifications ?? 'n/a'}`,
        `gaitValid=${gait?.validPackets ?? 'n/a'}`,
        `gaitInvalid=${gait?.invalidPackets ?? 'n/a'}`,
        `measurement=${snapshot.measurementPhase}`,
    ].join(' ');
}

function logEvent(id, message, level = 'info') {
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
        level,
        device: id === null ? 'SYSTEM' : deviceLabel(id),
        message: String(message),
    };
    eventEntries.push(entry);
    if (eventEntries.length > MAX_EVENTS) eventEntries.shift();

    const row = document.createElement('div');
    row.className = `event-row ${level}`;
    for (const [className, value, tag] of [
        ['', entry.clock, 'time'],
        ['level', level.toUpperCase(), 'span'],
        ['device', entry.device, 'span'],
        ['', entry.message, 'span'],
    ]) {
        const cell = document.createElement(tag);
        cell.className = className;
        cell.textContent = value;
        row.appendChild(cell);
    }
    dom.eventLog.appendChild(row);
    while (dom.eventLog.children.length > 300) dom.eventLog.firstElementChild.remove();
    dom.eventLog.scrollTop = dom.eventLog.scrollHeight;
}

function noteSessionState(id, snapshot) {
    if (!snapshot || snapshot.transitioning) return;
    const signature = formatSessionState(snapshot);
    if (signature === lastStateSignatures[id]) return;
    lastStateSignatures[id] = signature;
    logEvent(id, `Toolkit state: ${signature}`, snapshot.connected ? 'success' : 'warn');
}

function setStage(stage, label, detail = '', progress = 0) {
    const stageIds = ['prepare', 'warmup', 'fifo', 'drain', 'restore'];
    const activeIndex = stageIds.indexOf(stage);
    stageIds.forEach((id, index) => {
        const element = document.getElementById(`stage_${id}`);
        element.classList.toggle('active', index === activeIndex);
        element.classList.toggle('done', activeIndex >= 0 && index < activeIndex);
    });
    dom.stageLabel.textContent = label;
    dom.stageDetail.textContent = detail;
    dom.progress.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function renderGlobalState() {
    const count = connectedIds().length;
    dom.connectionBadge.textContent = `${count} / 2 connected`;
    dom.start.disabled = count !== 2 || Boolean(activeRun);
    dom.stop.disabled = !activeRun || !['warmup', 'fifo'].includes(activeRun.stage);
    dom.globalDot.className = 'status-dot';
    if (activeRun) {
        dom.globalDot.classList.add('running');
        dom.globalStatus.textContent = `${activeRun.scenario.label} / ${activeRun.stage}`;
    } else if (count === 2) {
        dom.globalDot.classList.add('ready');
        dom.globalStatus.textContent = '2台接続済み・実行可能';
    } else {
        dom.globalDot.classList.add('idle');
        dom.globalStatus.textContent = `${2 - count}台の接続待ち`;
    }
}

function metric(label, value) {
    const element = document.createElement('div');
    element.className = 'metric';
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    const valueElement = document.createElement('strong');
    valueElement.textContent = value;
    element.append(labelElement, valueElement);
    return element;
}

function renderDevice(id) {
    const snapshot = sessions[id]?.snapshot();
    const summary = document.getElementById(`device_summary_${id}`);
    summary.textContent = formatSessionState(snapshot);

    const result = [...runHistory].find((item) => item.deviceId === id);
    const values = result ? {
        profile: result.after?.profileId || '—',
        mode: result.after?.sensorDataMode || '—',
        fifoSamples: String(result.fifoSamples),
        missing: String(result.missing),
        dropped: String(result.dropped),
        drain: result.drainMs === null ? '—' : `${Math.round(result.drainMs)} ms`,
        stepTransport: String(result.postDelta.stepTransportPackets),
        stepResume: String(result.postDelta.stepPackets),
        stepInvalid: String(result.postDelta.stepInvalidPackets),
        rawResume: String(result.postDelta.realtimePackets),
    } : {
        profile: snapshot?.profileId || '—',
        mode: snapshot?.sensorDataMode || '—',
        fifoSamples: String(counters[id].fifoSamples),
        missing: '—',
        dropped: String(counters[id].fifoDropped),
        drain: '—',
        stepTransport: String(counters[id].stepTransportPackets),
        stepResume: String(counters[id].stepPackets),
        stepInvalid: String(counters[id].stepInvalidPackets),
        rawResume: String(counters[id].realtimePackets),
    };

    const metrics = document.getElementById(`metrics_${id}`);
    metrics.replaceChildren(
        metric('PROFILE', values.profile),
        metric('MODE', values.mode),
        metric('FIFO SAMPLES', values.fifoSamples),
        metric('MISSING', values.missing),
        metric('DROPPED', values.dropped),
        metric('DRAIN', values.drain),
        metric('STEP TRANSPORT', values.stepTransport),
        metric('STEP PACKETS', values.stepResume),
        metric('STEP INVALID', values.stepInvalid),
        metric('RAW PACKETS', values.rawResume)
    );

    const verdict = document.getElementById(`verdict_${id}`);
    const checks = document.getElementById(`checks_${id}`);
    if (!result) {
        verdict.textContent = isConnected(id) ? 'CONNECTED' : 'WAITING';
        verdict.className = `verdict ${isConnected(id) ? 'pass' : 'neutral'}`;
        checks.replaceChildren();
        return;
    }

    verdict.textContent = result.verdict.toUpperCase();
    verdict.className = `verdict ${result.verdict}`;
    checks.replaceChildren(...result.checks.map((check) => {
        const row = document.createElement('div');
        row.className = `check-row ${check.level}`;
        const name = document.createElement('span');
        name.textContent = `${check.level === 'pass' ? '✓' : check.level === 'warn' ? '!' : '×'} ${check.label}`;
        const detail = document.createElement('span');
        detail.textContent = check.detail;
        row.append(name, detail);
        return row;
    }));
}

function renderHistory() {
    if (runHistory.length === 0) {
        dom.history.innerHTML = '<tr><td colspan="9" class="empty-cell">まだ実行結果はありません</td></tr>';
        return;
    }
    dom.history.replaceChildren(...runHistory.map((result) => {
        const row = document.createElement('tr');
        const values = [
            new Date(result.completedAt).toLocaleTimeString('ja-JP', { hour12: false }),
            result.scenarioLabel,
            deviceLabel(result.deviceId),
            result.verdict.toUpperCase(),
            result.after?.profileId || '—',
            result.fifoSamples,
            result.missing,
            result.dropped,
            result.drainMs === null ? '—' : `${Math.round(result.drainMs)} ms`,
        ];
        for (const value of values) {
            const cell = document.createElement('td');
            cell.textContent = String(value);
            row.appendChild(cell);
        }
        return row;
    }));
}

function renderAll() {
    renderGlobalState();
    DEVICE_IDS.forEach(renderDevice);
    renderHistory();
    dom.downloadCsv.disabled = !latestMeasurements.some((result) => result?.raw?.samples?.length);
}

async function waitStage(ms, stage, label) {
    const startedAt = performance.now();
    while (performance.now() - startedAt < ms) {
        const elapsed = performance.now() - startedAt;
        const remaining = Math.max(0, ms - elapsed);
        setStage(stage, label, `残り ${(remaining / 1000).toFixed(1)} 秒`, elapsed / ms * 100);
        if (activeRun?.cancelRequested) return false;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    setStage(stage, label, '完了', 100);
    return true;
}

function snapshotMatchesProfile(snapshot, profileId) {
    const expected = PROFILE_EXPECTATIONS[profileId];
    return Boolean(
        snapshot
        && expected
        && snapshot.profileId === profileId
        && snapshot.sensorDataMode === expected.sensorDataMode
        && snapshot.outputs?.sensorValues === expected.raw
        && snapshot.outputs?.stepAnalysis === expected.step
        && snapshot.sensorNotifyActive === expected.sensorNotify
        && snapshot.fifoActive === false
        && snapshot.gaitActive === expected.gait
    );
}

function fifoStateIsValid(snapshot) {
    return Boolean(
        snapshot
        && snapshot.profileId === 'fifo-recording'
        && snapshot.sensorDataMode === 'fifo'
        && snapshot.outputs?.sensorValues === true
        && snapshot.outputs?.stepAnalysis === false
        && snapshot.fifoActive === true
        && snapshot.gaitActive === false
    );
}

function makeCheck(label, passed, detail, levelOnFailure = 'fail') {
    return {
        label,
        level: passed ? 'pass' : levelOnFailure,
        detail,
    };
}

function evaluateDevice(run, device) {
    const id = device.id;
    const expected = PROFILE_EXPECTATIONS[device.profileId];
    const result = device.measurement;
    const fifoSamples = result?.raw?.samples?.length || 0;
    const missing = Number(result?.raw?.serial?.missing || 0);
    const dropped = Number(result?.fifo?.dropped ?? missing);
    const checks = [
        makeCheck('事前profile適用', snapshotMatchesProfile(device.before, device.profileId), formatSessionState(device.before)),
        makeCheck('事前Raw受信', !expected.raw || device.preDelta.realtimePackets > 0, `${device.preDelta.realtimePackets} packets`),
        makeCheck('事前Step transport', !expected.step || device.preDelta.stepTransportPackets > 0, `${device.preDelta.stepTransportPackets} notifications`),
        makeCheck('事前Step受信', !expected.step || device.preDelta.stepPackets > 0, `${device.preDelta.stepPackets} packets`),
        makeCheck('FIFO単独状態へ移行', fifoStateIsValid(device.during), formatSessionState(device.during)),
        makeCheck('FIFO Rawを取得', fifoSamples > 0, `${fifoSamples} samples`),
        makeCheck('FIFO中Realtime通知なし', device.fifoDelta.realtimePackets === 0, `${device.fifoDelta.realtimePackets} packets`),
        makeCheck('FIFO中Step transportなし', device.fifoDelta.stepTransportPackets === 0, `${device.fifoDelta.stepTransportPackets} notifications`),
        makeCheck('FIFO中Step通知なし', device.fifoDelta.stepPackets === 0, `${device.fifoDelta.stepPackets} packets`),
        makeCheck('stop/drain・復元処理', !device.stopError, device.stopError || 'completed'),
        makeCheck('元profileへ復元', snapshotMatchesProfile(device.after, device.profileId), formatSessionState(device.after)),
        makeCheck('Raw受信再開', !expected.raw || device.postDelta.realtimePackets > 0, `${device.postDelta.realtimePackets} packets`),
        makeCheck('Step transport再開', !expected.step || device.postDelta.stepTransportPackets > 0, `${device.postDelta.stepTransportPackets} notifications`),
        makeCheck('Step受信再開', !expected.step || device.postDelta.stepPackets > 0, `${device.postDelta.stepPackets} packets`),
        makeCheck('Step packet decode', device.postDelta.stepInvalidPackets === 0, `invalid=${device.postDelta.stepInvalidPackets}`, 'warn'),
        makeCheck('FIFO serial continuity', missing === 0, `missing=${missing}`, 'warn'),
        makeCheck('FIFO dropped', dropped === 0, `dropped=${dropped}`, 'warn'),
    ];
    const hasFailure = checks.some((check) => check.level === 'fail');
    const hasWarning = checks.some((check) => check.level === 'warn');
    return {
        runId: run.id,
        scenarioId: run.scenarioId,
        scenarioLabel: run.scenario.label,
        deviceId: id,
        profileId: device.profileId,
        startedAt: run.startedAt,
        completedAt: new Date().toISOString(),
        verdict: hasFailure ? 'fail' : hasWarning ? 'warn' : 'pass',
        before: device.before,
        during: device.during,
        after: device.after,
        preDelta: device.preDelta,
        fifoDelta: device.fifoDelta,
        postDelta: device.postDelta,
        fifoSamples,
        missing,
        dropped,
        drainRecovered: device.drainRecovered,
        drainMs: device.drainMs,
        measurementSummary: result ? {
            id: result.id,
            profileId: result.profileId,
            durationMs: result.durationMs,
            raw: {
                packets: result.raw?.packets,
                samples: result.raw?.samples?.length || 0,
                serial: result.raw?.serial,
                truncated: result.raw?.truncated,
            },
            fifo: result.fifo,
        } : null,
        checks,
    };
}

async function stopStartedMeasurements(run, reason) {
    const stopStarted = performance.now();
    const settled = await Promise.allSettled(run.devices.map(async (device) => {
        if (!device.measurementStarted) return null;
        try {
            const result = await sessions[device.id].stopMeasurement({ reason });
            device.measurement = result;
            latestMeasurements[device.id] = result;
            return result;
        } catch (error) {
            // profile復元に失敗しても、drain済みの正式計測結果はsessionに保持される。
            // CSVを失わず、エラー自体はallSettledへ伝えて判定をFAILにする。
            const recovered = error?.measurement || sessions[device.id].lastMeasurement;
            if (recovered) {
                device.measurement = recovered;
                latestMeasurements[device.id] = recovered;
                logEvent(
                    device.id,
                    `FIFO result preserved despite restore error: samples=${recovered.raw?.samples?.length || 0}`,
                    'warn'
                );
            }
            throw error;
        } finally {
            device.drainMs = performance.now() - stopStarted;
        }
    }));
    settled.forEach((result, index) => {
        const device = run.devices[index];
        if (result.status === 'rejected') {
            const code = result.reason?.code || 'UNKNOWN';
            const diagnostics = result.reason?.diagnostics;
            device.stopError = result.reason?.message || String(result.reason);
            logEvent(
                device.id,
                `FIFO stop/restore failed: code=${code} ${device.stopError} transport=${diagnostics?.transportNotifications ?? 'n/a'} valid=${diagnostics?.validPackets ?? 'n/a'} invalid=${diagnostics?.invalidPackets ?? 'n/a'} fallback=${sessions[device.id].profileId}`,
                'error'
            );
        } else if (device.measurementStarted) {
            const summary = device.measurement?.raw?.serial;
            logEvent(
                device.id,
                `FIFO stop/drain completed: samples=${device.measurement?.raw?.samples?.length || 0} missing=${summary?.missing ?? 'n/a'} drainMs=${Math.round(device.drainMs)}`,
                summary?.missing === 0 ? 'success' : 'warn'
            );
        }
    });
}

async function runValidation() {
    if (activeRun || connectedIds().length !== 2) return;
    const selectedInput = document.querySelector('input[name="scenario"]:checked');
    const scenarioId = selectedInput?.value || 'dual-realtime-step';
    const scenario = SCENARIOS[scenarioId];
    const durationMs = Number(dom.duration.value);
    const run = {
        id: `restore-${Date.now()}-${++runSequence}`,
        scenarioId,
        scenario,
        startedAt: new Date().toISOString(),
        stage: 'prepare',
        cancelRequested: false,
        devices: DEVICE_IDS.map((id) => ({
            id,
            profileId: scenario.profiles[id],
            baseline: copyCounters(id),
            before: null,
            during: null,
            after: null,
            measurementStarted: false,
            measurement: null,
            stopError: null,
            drainMs: null,
            drainRecovered: 0,
        })),
    };
    activeRun = run;
    runStartedAt = performance.now();
    renderAll();
    logEvent(null, `Validation started: scenario=${scenarioId} duration=${durationMs / 1000}s devices=1,2`, 'success');

    try {
        setStage('prepare', '事前profileを適用中', scenario.label, 10);
        const profileResults = await Promise.allSettled(run.devices.map(async (device) => {
            await sessions[device.id].applyProfile(device.profileId);
            device.before = sessions[device.id].snapshot();
            logEvent(device.id, `Precondition applied: ${formatSessionState(device.before)}`, 'success');
        }));
        if (profileResults.some((result) => result.status === 'rejected')) {
            profileResults.forEach((result, id) => {
                if (result.status === 'rejected') {
                    logEvent(id, `Precondition failed: ${result.reason?.message || result.reason}`, 'error');
                }
            });
            throw new Error('事前profileの適用に失敗しました');
        }

        run.stage = 'warmup';
        run.devices.forEach((device) => { device.warmupStart = copyCounters(device.id); });
        const warmupCompleted = await waitStage(WARMUP_MS, 'warmup', 'Raw / Stepの事前受信を確認中');
        run.devices.forEach((device) => {
            device.preDelta = counterDelta(copyCounters(device.id), device.warmupStart);
            logEvent(
                device.id,
                `Precondition data: realtime=${device.preDelta.realtimePackets} stepTransport=${device.preDelta.stepTransportPackets} step=${device.preDelta.stepPackets} invalid=${device.preDelta.stepInvalidPackets}`,
                'success'
            );
        });
        if (!warmupCompleted) throw new Error('FIFO開始前に利用者が停止しました');

        setStage('fifo', 'FIFO Rawへ切り替え中', 'Stepを停止し、端末ごとに正式計測区間を開始します', 5);
        const startResults = await Promise.allSettled(run.devices.map(async (device) => {
            await sessions[device.id].startMeasurement({
                profile: 'fifo-recording',
                metadata: {
                    source: 'showcase-fifo-restore-validation',
                    scenario: scenarioId,
                    previousProfile: device.profileId,
                },
            });
            device.measurementStarted = true;
            device.during = sessions[device.id].snapshot();
            device.fifoStart = copyCounters(device.id);
            logEvent(device.id, `FIFO measurement started: ${formatSessionState(device.during)}`, 'success');
        }));
        if (startResults.some((result) => result.status === 'rejected')) {
            startResults.forEach((result, id) => {
                if (result.status === 'rejected') {
                    logEvent(id, `FIFO start failed: ${result.reason?.message || result.reason}`, 'error');
                }
            });
            await stopStartedMeasurements(run, 'peer-start-failed');
            throw new Error('片側または両側のFIFO開始に失敗しました');
        }

        run.stage = 'fifo';
        await waitStage(durationMs, 'fifo', '2台同時FIFO Raw計測中');
        run.devices.forEach((device) => {
            device.fifoDelta = counterDelta(copyCounters(device.id), device.fifoStart);
            logEvent(
                device.id,
                `FIFO window: samples=${device.fifoDelta.fifoSamples} realtime=${device.fifoDelta.realtimePackets} stepTransport=${device.fifoDelta.stepTransportPackets} step=${device.fifoDelta.stepPackets}`,
                device.fifoDelta.fifoSamples > 0 ? 'success' : 'warn'
            );
        });

        run.stage = 'drain';
        setStage('drain', 'stop / drain実行中', '未回収serialがなくなるまで待機します', 35);
        await stopStartedMeasurements(run, run.cancelRequested ? 'manual-early-stop' : 'duration-complete');
        run.devices.forEach((device) => {
            device.after = sessions[device.id].snapshot();
            device.postStart = copyCounters(device.id);
            device.drainRecovered = counters[device.id].drainRecovered - device.baseline.drainRecovered;
            logEvent(device.id, `Restored state: ${formatSessionState(device.after)}`, 'success');
        });

        run.stage = 'restore';
        run.cancelRequested = false;
        await waitStage(RESTORE_OBSERVE_MS, 'restore', '復元後のRaw / Step再開を確認中');
        run.devices.forEach((device) => {
            device.postDelta = counterDelta(copyCounters(device.id), device.postStart);
            const evaluation = evaluateDevice(run, device);
            runHistory.unshift(evaluation);
            logEvent(
                device.id,
                `Verdict=${evaluation.verdict.toUpperCase()} restored=${evaluation.after?.profileId} fifoSamples=${evaluation.fifoSamples} missing=${evaluation.missing} dropped=${evaluation.dropped} postRaw=${evaluation.postDelta.realtimePackets} postStepTransport=${evaluation.postDelta.stepTransportPackets} postStep=${evaluation.postDelta.stepPackets} postInvalid=${evaluation.postDelta.stepInvalidPackets}`,
                evaluation.verdict === 'fail' ? 'error' : evaluation.verdict
            );
        });
        setStage('restore', '自動テスト完了', '結果とイベントログを確認してください', 100);
        logEvent(
            null,
            `Validation completed: ${runHistory.slice(0, 2).map((result) => `${deviceLabel(result.deviceId)}=${result.verdict}`).join(' ')}`,
            runHistory.slice(0, 2).some((result) => result.verdict === 'fail') ? 'error' : 'success'
        );
    } catch (error) {
        logEvent(null, `Validation aborted: ${error.message || error}`, 'error');
        setStage(run.stage, 'テストを完了できませんでした', error.message || String(error), 100);
    } finally {
        activeRun = null;
        renderAll();
    }
}

function latestRunResults() {
    const latestRunId = runHistory[0]?.runId;
    return latestRunId ? runHistory.filter((result) => result.runId === latestRunId) : [];
}

function formatEventLogText() {
    const lines = [
        'ORPHE INSOLE PR #54 FIFO Restore Validation Event Log',
        `exportedAt=${new Date().toISOString()}`,
        `page=${window.location.href}`,
        `secureContext=${window.isSecureContext}`,
        `webBluetooth=${Boolean(navigator.bluetooth)}`,
        `platform=${navigator.platform || 'unknown'}`,
        `hardwareConcurrency=${navigator.hardwareConcurrency || 'unknown'}`,
        `userAgent=${navigator.userAgent}`,
        `runState=${activeRun?.stage || 'idle'}`,
        `connectedDevices=${connectedIds().map((id) => id + 1).join(',') || 'none'}`,
        ...DEVICE_IDS.map((id) => `${deviceLabel(id)} ${formatSessionState(sessions[id]?.snapshot())}`),
        ...latestRunResults().map((result) => (
            `${deviceLabel(result.deviceId)} result=${result.verdict} expected=${result.profileId} restored=${result.after?.profileId || 'none'} fifoSamples=${result.fifoSamples} missing=${result.missing} dropped=${result.dropped} drainMs=${result.drainMs} postRaw=${result.postDelta.realtimePackets} postStepTransport=${result.postDelta.stepTransportPackets} postStep=${result.postDelta.stepPackets} postInvalid=${result.postDelta.stepInvalidPackets}`
        )),
        '',
        'timestamp\tlevel\tdevice\tmessage',
        ...eventEntries.map((entry) => `${entry.timestamp}\t${entry.level}\t${entry.device}\t${entry.message}`),
    ];
    return lines.join('\n');
}

async function copyEventLog() {
    const text = formatEventLogText();
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        }
        logEvent(null, `Event Log copied: ${eventEntries.length} entries`, 'success');
        dom.copyLog.textContent = 'コピーしました';
    } catch (error) {
        logEvent(null, `Event Log copy failed: ${error.message || error}`, 'error');
        dom.copyLog.textContent = 'コピー失敗';
    }
    setTimeout(() => { dom.copyLog.innerHTML = '<i class="bi bi-clipboard"></i> ログをコピー'; }, 1500);
}

function downloadBlob(content, filename, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
        anchor.remove();
        URL.revokeObjectURL(url);
    }, 0);
}

function exportJson() {
    const payload = {
        schema: 'orphe-insole-showcase-fifo-restore-v1',
        exportedAt: new Date().toISOString(),
        page: window.location.href,
        environment: {
            secureContext: window.isSecureContext,
            webBluetooth: Boolean(navigator.bluetooth),
            platform: navigator.platform || 'unknown',
            hardwareConcurrency: navigator.hardwareConcurrency || null,
            userAgent: navigator.userAgent,
        },
        sessions: DEVICE_IDS.map((id) => sessions[id]?.snapshot()),
        counters,
        runs: runHistory,
        events: eventEntries,
    };
    downloadBlob(
        JSON.stringify(payload, null, 2),
        `orphe-pr54-fifo-restore-${Date.now()}.json`,
        'application/json'
    );
    logEvent(null, `Validation JSON downloaded: ${runHistory.length} device results`, 'success');
}

function exportLatestCsv() {
    let downloads = 0;
    DEVICE_IDS.forEach((id) => {
        const result = latestMeasurements[id];
        if (!result?.raw?.samples?.length) return;
        const csv = insoleToolkitMeasurementToCSV(result, 'raw');
        downloadBlob(csv, `orphe-pr54-fifo-device-${id + 1}-${Date.now()}.csv`, 'text/csv;charset=utf-8');
        downloads += 1;
    });
    logEvent(null, `FIFO CSV downloaded: ${downloads} file(s)`, downloads > 0 ? 'success' : 'warn');
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
                    const state = counters[deviceId];
                    state.fifoSamples += samples.length;
                    state.fifoBatches += 1;
                    if (!state.firstFifoLogged) {
                        state.firstFifoLogged = true;
                        logEvent(deviceId, `First FIFO batch received: ${samples.length} samples`, 'success');
                    }
                },
                onProgress(info) {
                    counters[id].fifoLagMax = Math.max(counters[id].fifoLagMax, Number(info?.lag || 0));
                },
                onDataLoss(info) {
                    counters[id].fifoDropped = Math.max(counters[id].fifoDropped, Number(info?.cumulative || 0));
                    logEvent(id, `FIFO data loss: reason=${info?.reason} dropped=${info?.dropped} cumulative=${info?.cumulative}`, 'warn');
                },
                onStopped(info) {
                    counters[id].drainRecovered += Number(info?.drainRecovered || 0);
                    counters[id].fifoDropped = Math.max(counters[id].fifoDropped, Number(info?.dropped || 0));
                    logEvent(id, `FIFO module stopped: reason=${info?.reason} dropped=${info?.dropped} collected=${info?.collected} drainRecovered=${info?.drainRecovered || 0}`, info?.dropped > 0 ? 'warn' : 'success');
                },
                onError(error) {
                    logEvent(id, `FIFO error: ${error?.message || error}`, 'error');
                },
            },
            gait: {
                verifyNotifications: true,
                verifyTimeoutMs: 1500,
                verifyRetries: 2,
                onTransport(deviceId, info) {
                    const state = counters[deviceId];
                    state.stepTransportPackets += 1;
                    if (!info?.valid) state.stepInvalidPackets += 1;
                    if (!state.firstStepTransportLogged) {
                        state.firstStepTransportLogged = true;
                        logEvent(
                            deviceId,
                            `First Step transport notification: length=${info?.byteLength ?? 'unknown'} header=${info?.header ?? 'unknown'} subheader=${info?.subheader ?? 'unknown'} valid=${Boolean(info?.valid)}`,
                            info?.valid ? 'success' : 'warn'
                        );
                    }
                    if (!info?.valid && !state.firstStepInvalidLogged) {
                        state.firstStepInvalidLogged = true;
                        logEvent(
                            deviceId,
                            `Invalid Step transport packet: length=${info?.byteLength ?? 'unknown'} header=${info?.header ?? 'unknown'} subheader=${info?.subheader ?? 'unknown'}`,
                            'error'
                        );
                    }
                },
                onDiagnostic(deviceId, info) {
                    const details = info?.diagnostics || {};
                    const level = ['liveness-timeout', 'packet-timeout', 'invalid-packet'].includes(info?.type)
                        ? 'warn'
                        : info?.type === 'liveness-retry' ? 'info' : 'success';
                    logEvent(
                        deviceId,
                        `Step diagnostic: type=${info?.type || 'unknown'} transport=${details.transportNotifications ?? 'n/a'} valid=${details.validPackets ?? 'n/a'} invalid=${details.invalidPackets ?? 'n/a'} subscribed=${details.subscribed ?? 'n/a'}`,
                        level
                    );
                },
                onRaw(deviceId, packet) {
                    counters[deviceId].stepPackets += 1;
                    if (!counters[deviceId].firstStepLogged) {
                        counters[deviceId].firstStepLogged = true;
                        logEvent(deviceId, `First Step packet received: type=${packet?.type || 'unknown'}`, 'success');
                    }
                },
                onGait(deviceId, row) {
                    counters[deviceId].stepRows += 1;
                    logEvent(deviceId, `Completed Step row: step=${row?.step_number ?? 'unknown'}`, 'success');
                },
                onError(error) {
                    logEvent(id, `Step Analysis error: ${error?.message || error}`, 'error');
                },
            },
            onStateChange(snapshot) {
                noteSessionState(id, snapshot);
                renderAll();
            },
            onError(error) {
                const cancelled = error?.name === 'NotFoundError';
                logEvent(
                    id,
                    cancelled ? 'Bluetooth chooser cancelled' : `Toolkit error: ${error?.message || error}`,
                    cancelled ? 'warn' : 'error'
                );
            },
        }
    );
    sessions[id] = getInsoleToolkitSession(id);
    insoles[id].setup();
    insoles[id].gotData = function (data, uuid) {
        if (uuid !== 'SENSOR_VALUES' || !data || data.byteLength < 1) return;
        const header = data.getUint8(0);
        if (!REALTIME_HEADERS.has(header)) return;
        counters[this.id].realtimePackets += 1;
        if (!counters[this.id].firstRealtimeLogged) {
            counters[this.id].firstRealtimeLogged = true;
            logEvent(this.id, `First Realtime packet received: header=${header}`, 'success');
        }
    };
    insoles[id].onScan = function (name) {
        logEvent(this.id, `Bluetooth device selected: ${name || 'unknown'}`, 'success');
    };
    insoles[id].onConnect = function (uuid) {
        logEvent(this.id, `GATT connected: ${uuid}`, 'success');
    };
    insoles[id].onStartNotify = function (uuid) {
        logEvent(this.id, `Notification started: ${uuid}`, 'success');
    };
    insoles[id].onStopNotify = function (uuid) {
        logEvent(this.id, `Notification stopped: ${uuid}`, 'warn');
    };
    insoles[id].onDisconnect = function () {
        logEvent(this.id, 'Physical disconnect detected', 'warn');
        renderAll();
    };
    insoles[id].onReconnectAttempt = function (info) {
        logEvent(this.id, `Reconnect attempt ${info?.attempt}/${info?.maxAttempts}`, 'warn');
    };
    insoles[id].onReconnectSuccess = function (info) {
        logEvent(this.id, `Reconnect succeeded: ${info?.elapsedMs} ms`, 'success');
    };
    insoles[id].onReconnectFailed = function (info) {
        logEvent(this.id, `Reconnect failed: attempts=${info?.attempts}`, 'error');
    };
}

function initialize() {
    const secure = window.isSecureContext;
    const bluetooth = Boolean(navigator.bluetooth);
    dom.secureContext.textContent = secure ? 'OK' : 'NG';
    dom.webBluetooth.textContent = bluetooth ? 'OK' : 'NG';
    if (!secure || !bluetooth) {
        dom.environmentWarning.classList.remove('hidden');
        dom.environmentWarning.textContent = 'Web Bluetoothを利用できません。ChromeでこのMac自身のlocalhost URLを開いてください。';
    }

    DEVICE_IDS.forEach(installDevice);
    document.querySelectorAll('input[name="scenario"]').forEach((input) => {
        input.addEventListener('change', () => {
            document.querySelectorAll('.scenario-card').forEach((card) => {
                card.classList.toggle('selected', card.querySelector('input').checked);
            });
            logEvent(null, `Scenario selected: ${selectedScenario().label}`);
        });
    });
    dom.start.addEventListener('click', runValidation);
    dom.stop.addEventListener('click', () => {
        if (!activeRun) return;
        activeRun.cancelRequested = true;
        logEvent(null, `Early stop requested during ${activeRun.stage}`, 'warn');
    });
    dom.copyLog.addEventListener('click', copyEventLog);
    dom.downloadJson.addEventListener('click', exportJson);
    dom.downloadCsv.addEventListener('click', exportLatestCsv);
    dom.clearLog.addEventListener('click', () => {
        eventEntries.length = 0;
        dom.eventLog.replaceChildren();
        logEvent(null, 'Event Log cleared');
    });

    logEvent(null, 'PR #54 FIFO restore validation initialized', 'success');
    logEvent(null, `Environment: secureContext=${secure} webBluetooth=${bluetooth} userAgent=${navigator.userAgent}`, secure && bluetooth ? 'success' : 'error');
    logEvent(null, '操作手順: ①2台接続 → ②シナリオ選択 → ③自動テスト開始 → ④ログをコピー', 'success');
    setInterval(() => {
        if (runStartedAt !== null && activeRun) {
            const elapsed = performance.now() - runStartedAt;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const tenths = Math.floor((elapsed % 1000) / 100);
            dom.timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
        }
        renderAll();
    }, 250);
    renderAll();
}

initialize();
