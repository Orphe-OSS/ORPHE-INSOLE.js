/* global buildInsoleToolkit, insoles */

'use strict';

// PR #60: gyro物理単位換算をレンジ別センサー感度に修正（理想Q15 → データシート感度）。
// 新値 = 旧値 × OLD_TO_NEW_FACTOR。回転テストでは新換算の積分角を基準に判定し、
// 旧換算値は「修正前の値がどれだけズレていたか」の参考表示として new / FACTOR で算出する。
const OLD_TO_NEW_FACTOR = 1.14688;

// データシート（LSM6DSOX系）のジャイロ感度: フルスケール1dpsあたり0.035 mdps/LSB。
// 例: ±2000dps -> 70 mdps/LSB = 0.07 dps/LSB（src/ORPHE-INSOLE.js の変換と同じ値）。
const GYRO_RANGES_DPS = [250, 500, 1000, 2000];
const ACC_RANGES_G = [2, 4, 8, 16];
const MDPS_PER_LSB_PER_DPS_RANGE = 0.035;

const STATIC_TEST_DURATION_MS = 10000;
const STATIC_TEST_BIAS_LIMIT_DPS = 3;
const MAX_ANOMALOUS_DT_MS = 100;
const MAX_EVENTS = 2000;

// ratio = gyro積分 / quat yaw変化 の判定しきい値
const RATIO_PASS_MIN = 0.93;
const RATIO_PASS_MAX = 1.07;
const RATIO_WARN_MIN = 0.85;
const RATIO_WARN_MAX = 1.15;
const OLD_SCALE_RATIO = 1 / OLD_TO_NEW_FACTOR; // ≈ 0.872
const OLD_SCALE_TOLERANCE = 0.03;
const MIN_DETECTABLE_QUAT_DELTA_DEG = 10;

const eventEntries = [];
const rotationHistory = [];

let staticTest = null; // { startedAt, samples: {x:[],y:[],z:[]} }
let rotationTest = null;
/*
rotationTest shape while active:
{
  targetAngle,
  startedAt,
  lastGyroTimestamp: number|null,
  gyroIntegralDeg: number,
  lastEulerYawRad: number|null,      // 直近の生yaw（unwrap用）
  unwrappedYawRad: number|null,      // unwrap後の累積yaw
  baselineYawRad: number|null,       // 開始時点のunwrapped yaw
  hasEuler: boolean,
}
*/

const dom = {
    deviceSummary: document.getElementById('device_summary'),
    readDeviceInfoButton: document.getElementById('read_device_info_button'),
    staticTestButton: document.getElementById('static_test_button'),
    staticTestStatus: document.getElementById('static_test_status'),
    staticTestMetrics: document.getElementById('static_test_metrics'),
    targetAngleSelect: document.getElementById('target_angle_select'),
    rotationStartButton: document.getElementById('rotation_start_button'),
    rotationStopButton: document.getElementById('rotation_stop_button'),
    rotationStatus: document.getElementById('rotation_status'),
    metricGyroIntegral: document.getElementById('metric_gyro_integral'),
    metricGyroIntegralOld: document.getElementById('metric_gyro_integral_old'),
    metricQuatDelta: document.getElementById('metric_quat_delta'),
    metricRatio: document.getElementById('metric_ratio'),
    metricVerdict: document.getElementById('metric_verdict'),
    metricElapsed: document.getElementById('metric_elapsed'),
    rotationVerdictBox: document.getElementById('rotation_verdict_box'),
    historyBody: document.getElementById('history_body'),
    liveGyroX: document.getElementById('live_gyro_x'),
    liveGyroY: document.getElementById('live_gyro_y'),
    liveGyroZ: document.getElementById('live_gyro_z'),
    eventLog: document.getElementById('event_log'),
    copyLogButton: document.getElementById('copy_log_button'),
    downloadJsonButton: document.getElementById('download_json_button'),
    clearLogButton: document.getElementById('clear_log_button'),
};

function isConnected() {
    try {
        return Boolean(insoles[0]?.isConnected?.());
    } catch {
        return false;
    }
}

function logEvent(level, message) {
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
        message: String(message),
    };
    eventEntries.push(entry);
    if (eventEntries.length > MAX_EVENTS) eventEntries.shift();

    const row = document.createElement('div');
    row.className = `event-row ${level}`;
    for (const [className, value, tag] of [
        ['', entry.clock, 'time'],
        ['level', level.toUpperCase(), 'span'],
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

function gyroRangeFromIndex(index) {
    return (Number.isInteger(index) && index >= 0 && index < GYRO_RANGES_DPS.length)
        ? GYRO_RANGES_DPS[index]
        : 2000;
}

function accRangeFromIndex(index) {
    return (Number.isInteger(index) && index >= 0 && index < ACC_RANGES_G.length)
        ? ACC_RANGES_G[index]
        : 16;
}

function updateDeviceSummary() {
    if (!isConnected()) {
        dom.deviceSummary.textContent = '未接続';
        return;
    }
    const info = insoles[0].device_information;
    if (!info || !info.range) {
        dom.deviceSummary.textContent = '接続済み（レンジ設定は未取得。「レンジ設定を再取得」を押してください）';
        return;
    }
    const gyroRangeDps = gyroRangeFromIndex(info.range.gyro);
    const accRangeG = accRangeFromIndex(info.range.acc);
    const sensitivityMdpsPerLsb = gyroRangeDps * MDPS_PER_LSB_PER_DPS_RANGE;
    dom.deviceSummary.textContent = [
        `gyroRangeIndex=${info.range.gyro} -> ±${gyroRangeDps} dps`,
        `accRangeIndex=${info.range.acc} -> ±${accRangeG} G`,
        `gyro感度(新換算)=${sensitivityMdpsPerLsb.toFixed(3)} mdps/LSB`,
        `battery=${info.battery}`,
    ].join('\n');
}

async function fetchDeviceInfo() {
    if (!isConnected()) return;
    try {
        await insoles[0].getDeviceInformation();
        updateDeviceSummary();
        logEvent('success', `Device information fetched: ${JSON.stringify(insoles[0].device_information?.range)}`);
    } catch (error) {
        logEvent('error', `getDeviceInformation failed: ${error?.message || error}`);
    }
}

function setControlsEnabled(connected) {
    dom.readDeviceInfoButton.disabled = !connected;
    dom.staticTestButton.disabled = !connected || Boolean(staticTest);
    dom.rotationStartButton.disabled = !connected || Boolean(rotationTest);
    dom.rotationStopButton.disabled = !rotationTest;
}

// === 静置テスト ===

function createAxisAccumulator() {
    return { n: 0, sum: 0, sumSq: 0 };
}

function pushAxisSample(accumulator, value) {
    accumulator.n += 1;
    accumulator.sum += value;
    accumulator.sumSq += value * value;
}

function axisMean(accumulator) {
    return accumulator.n > 0 ? accumulator.sum / accumulator.n : 0;
}

function axisStd(accumulator) {
    if (accumulator.n === 0) return 0;
    const mean = axisMean(accumulator);
    const variance = Math.max(0, accumulator.sumSq / accumulator.n - mean * mean);
    return Math.sqrt(variance);
}

function metricElement(label, value) {
    const element = document.createElement('div');
    element.className = 'metric';
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    const valueElement = document.createElement('strong');
    valueElement.textContent = value;
    element.append(labelElement, valueElement);
    return element;
}

function renderStaticTestMetrics(result) {
    if (!result) {
        dom.staticTestMetrics.replaceChildren();
        return;
    }
    dom.staticTestMetrics.replaceChildren(
        metricElement('X mean / std [dps]', `${result.x.mean.toFixed(3)} / ${result.x.std.toFixed(3)}`),
        metricElement('Y mean / std [dps]', `${result.y.mean.toFixed(3)} / ${result.y.std.toFixed(3)}`),
        metricElement('Z mean / std [dps]', `${result.z.mean.toFixed(3)} / ${result.z.std.toFixed(3)}`)
    );
}

function startStaticTest() {
    if (staticTest || !isConnected()) return;
    staticTest = {
        startedAt: performance.now(),
        x: createAxisAccumulator(),
        y: createAxisAccumulator(),
        z: createAxisAccumulator(),
    };
    setControlsEnabled(isConnected());
    dom.staticTestStatus.textContent = '計測中（10秒）...';
    dom.staticTestStatus.className = 'badge-neutral';
    logEvent('info', '静置テスト開始（10秒）');

    setTimeout(finishStaticTest, STATIC_TEST_DURATION_MS);
}

function finishStaticTest() {
    if (!staticTest) return;
    const result = {
        x: { mean: axisMean(staticTest.x), std: axisStd(staticTest.x) },
        y: { mean: axisMean(staticTest.y), std: axisStd(staticTest.y) },
        z: { mean: axisMean(staticTest.z), std: axisStd(staticTest.z) },
        samples: staticTest.x.n,
    };
    staticTest = null;
    renderStaticTestMetrics(result);

    const pass = [result.x, result.y, result.z].every((axis) => Math.abs(axis.mean) < STATIC_TEST_BIAS_LIMIT_DPS);
    dom.staticTestStatus.textContent = pass ? 'PASS（バイアス < 3 dps）' : 'FAIL（バイアス >= 3 dps の軸あり）';
    dom.staticTestStatus.className = `badge-neutral ${pass ? 'verdict pass' : 'verdict fail'}`;
    logEvent(
        pass ? 'success' : 'error',
        `静置テスト完了: samples=${result.samples} `
        + `x(mean=${result.x.mean.toFixed(3)},std=${result.x.std.toFixed(3)}) `
        + `y(mean=${result.y.mean.toFixed(3)},std=${result.y.std.toFixed(3)}) `
        + `z(mean=${result.z.mean.toFixed(3)},std=${result.z.std.toFixed(3)}) verdict=${pass ? 'PASS' : 'FAIL'}`
    );
    setControlsEnabled(isConnected());
}

// === 回転テスト ===

function unwrapAngleRad(previousUnwrapped, previousRaw, newRaw) {
    let delta = newRaw - previousRaw;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    return previousUnwrapped + delta;
}

function verdictFromRatio(ratio) {
    if (!Number.isFinite(ratio)) return 'fail';
    const magnitude = Math.abs(ratio);
    if (magnitude >= RATIO_PASS_MIN && magnitude <= RATIO_PASS_MAX) return 'pass';
    if (
        (magnitude >= RATIO_WARN_MIN && magnitude < RATIO_PASS_MIN)
        || (magnitude > RATIO_PASS_MAX && magnitude <= RATIO_WARN_MAX)
    ) {
        return 'warn';
    }
    return 'fail';
}

function startRotationTest() {
    if (rotationTest || !isConnected()) return;
    const targetAngle = Number(dom.targetAngleSelect.value);
    rotationTest = {
        targetAngle,
        startedAt: performance.now(),
        lastGyroTimestamp: null,
        gyroIntegralDeg: 0,
        lastEulerYawRad: null,
        unwrappedYawRad: null,
        baselineYawRad: null,
        hasEuler: false,
    };
    setControlsEnabled(isConnected());
    dom.rotationStatus.textContent = `計測中（目標 ${targetAngle}°）`;
    dom.rotationVerdictBox.style.display = 'none';
    logEvent('info', `回転テスト開始: targetAngle=${targetAngle}`);
    renderRotationLiveMetrics();
}

function renderRotationLiveMetrics() {
    if (!rotationTest) return;
    const gyroIntegralDeg = rotationTest.gyroIntegralDeg;
    const gyroIntegralOldDeg = gyroIntegralDeg / OLD_TO_NEW_FACTOR;
    const quatDeltaDeg = rotationTest.baselineYawRad !== null && rotationTest.unwrappedYawRad !== null
        ? (rotationTest.unwrappedYawRad - rotationTest.baselineYawRad) * (180 / Math.PI)
        : null;
    const ratio = quatDeltaDeg !== null && Math.abs(quatDeltaDeg) > 1e-6
        ? gyroIntegralDeg / quatDeltaDeg
        : null;

    dom.metricGyroIntegral.textContent = `${gyroIntegralDeg.toFixed(2)} °`;
    dom.metricGyroIntegralOld.textContent = `${gyroIntegralOldDeg.toFixed(2)} °`;
    dom.metricQuatDelta.textContent = quatDeltaDeg !== null ? `${quatDeltaDeg.toFixed(2)} °` : '— °';
    dom.metricRatio.textContent = ratio !== null ? ratio.toFixed(3) : '—';
    dom.metricElapsed.textContent = `${((performance.now() - rotationTest.startedAt) / 1000).toFixed(1)} s`;

    if (ratio !== null) {
        const verdict = verdictFromRatio(ratio);
        dom.metricVerdict.textContent = verdict.toUpperCase();
        dom.metricVerdict.className = '';
        dom.metricVerdict.style.color = verdict === 'pass' ? 'var(--green)' : verdict === 'warn' ? 'var(--yellow)' : 'var(--red)';
    } else {
        dom.metricVerdict.textContent = '—';
        dom.metricVerdict.style.color = '';
    }
}

function finishRotationTest() {
    if (!rotationTest) return;
    const gyroIntegralDeg = rotationTest.gyroIntegralDeg;
    const gyroIntegralOldDeg = gyroIntegralDeg / OLD_TO_NEW_FACTOR;
    const quatDeltaDeg = rotationTest.baselineYawRad !== null && rotationTest.unwrappedYawRad !== null
        ? (rotationTest.unwrappedYawRad - rotationTest.baselineYawRad) * (180 / Math.PI)
        : null;
    const ratio = quatDeltaDeg !== null && Math.abs(quatDeltaDeg) > 1e-6
        ? gyroIntegralDeg / quatDeltaDeg
        : null;
    const verdict = verdictFromRatio(ratio);
    const rotationNotDetected = quatDeltaDeg !== null && Math.abs(quatDeltaDeg) < MIN_DETECTABLE_QUAT_DELTA_DEG;
    const looksLikeOldScale = ratio !== null && Math.abs(Math.abs(ratio) - OLD_SCALE_RATIO) <= OLD_SCALE_TOLERANCE;

    const result = {
        completedAt: new Date().toISOString(),
        targetAngle: rotationTest.targetAngle,
        gyroIntegralDeg,
        gyroIntegralOldDeg,
        quatDeltaDeg,
        ratio,
        verdict,
        rotationNotDetected,
        looksLikeOldScale,
    };
    rotationHistory.unshift(result);
    rotationTest = null;

    renderRotationHistory();

    const messages = [];
    messages.push(`回転テスト完了: targetAngle=${result.targetAngle} gyro積分(新)=${gyroIntegralDeg.toFixed(2)}° gyro積分(旧参考)=${gyroIntegralOldDeg.toFixed(2)}° quat変化=${quatDeltaDeg !== null ? quatDeltaDeg.toFixed(2) : 'n/a'}° ratio=${ratio !== null ? ratio.toFixed(3) : 'n/a'} verdict=${verdict.toUpperCase()}`);
    if (rotationNotDetected) messages.push('quaternion yawの変化が±10°未満のため、回転が検出できていない可能性があります。');
    if (looksLikeOldScale) messages.push(`ratioが旧換算の比率(約${OLD_SCALE_RATIO.toFixed(3)})に近く、旧換算のままの可能性があります。`);

    logEvent(verdict === 'pass' ? 'success' : verdict === 'warn' ? 'warn' : 'error', messages.join(' '));

    dom.rotationStatus.textContent = '待機中';
    const boxLines = [];
    if (rotationNotDetected) boxLines.push('回転が検出できていない可能性があります（quat yaw変化 < 10°）。');
    if (looksLikeOldScale) boxLines.push('旧換算のままの可能性があります（ratioが旧/新比率に近い）。');
    if (boxLines.length > 0) {
        dom.rotationVerdictBox.textContent = boxLines.join(' ');
        dom.rotationVerdictBox.style.display = 'block';
    } else {
        dom.rotationVerdictBox.style.display = 'none';
    }

    setControlsEnabled(isConnected());
}

function renderRotationHistory() {
    if (rotationHistory.length === 0) {
        dom.historyBody.innerHTML = '<tr><td colspan="7" class="empty-cell">まだ結果はありません</td></tr>';
        return;
    }
    dom.historyBody.replaceChildren(...rotationHistory.map((result) => {
        const row = document.createElement('tr');
        const values = [
            new Date(result.completedAt).toLocaleTimeString('ja-JP', { hour12: false }),
            `${result.targetAngle}°`,
            `${result.gyroIntegralDeg.toFixed(2)}°`,
            `${result.gyroIntegralOldDeg.toFixed(2)}°`,
            result.quatDeltaDeg !== null ? `${result.quatDeltaDeg.toFixed(2)}°` : '—',
            result.ratio !== null ? result.ratio.toFixed(3) : '—',
            result.verdict.toUpperCase(),
        ];
        for (const value of values) {
            const cell = document.createElement('td');
            cell.textContent = String(value);
            row.appendChild(cell);
        }
        return row;
    }));
}

// === Toolkit / device callbacks ===

function installDevice() {
    buildInsoleToolkit(
        document.getElementById('toolkit0'),
        'INSOLE',
        0,
        {
            streamingMode: 4,
            autoReconnect: true,
            onStateChange() {
                setControlsEnabled(isConnected());
                updateDeviceSummary();
            },
            onError(error) {
                const cancelled = error?.name === 'NotFoundError';
                logEvent(cancelled ? 'warn' : 'error', cancelled ? 'Bluetooth chooser cancelled' : `Toolkit error: ${error?.message || error}`);
            },
        }
    );
    insoles[0].setup();

    insoles[0].onConnect = function (uuid) {
        logEvent('success', `GATT connected: ${uuid}`);
        setControlsEnabled(true);
        fetchDeviceInfo();
    };
    insoles[0].onDisconnect = function () {
        logEvent('warn', 'Physical disconnect detected');
        setControlsEnabled(false);
    };
    insoles[0].onReconnectSuccess = function (info) {
        logEvent('success', `Reconnect succeeded: ${info?.elapsedMs} ms`);
        fetchDeviceInfo();
    };
    insoles[0].onReconnectFailed = function (info) {
        logEvent('error', `Reconnect failed: attempts=${info?.attempts}`);
    };

    insoles[0].gotConvertedGyro = function (gyro) {
        dom.liveGyroX.textContent = `${gyro.x.toFixed(3)} dps`;
        dom.liveGyroY.textContent = `${gyro.y.toFixed(3)} dps`;
        dom.liveGyroZ.textContent = `${gyro.z.toFixed(3)} dps`;

        if (staticTest) {
            pushAxisSample(staticTest.x, gyro.x);
            pushAxisSample(staticTest.y, gyro.y);
            pushAxisSample(staticTest.z, gyro.z);
        }

        if (rotationTest) {
            if (rotationTest.lastGyroTimestamp !== null) {
                const dtMs = gyro.timestamp - rotationTest.lastGyroTimestamp;
                if (dtMs > 0 && dtMs <= MAX_ANOMALOUS_DT_MS) {
                    rotationTest.gyroIntegralDeg += gyro.z * (dtMs / 1000);
                }
            }
            rotationTest.lastGyroTimestamp = gyro.timestamp;
            renderRotationLiveMetrics();
        }
    };

    insoles[0].gotEuler = function (euler) {
        if (!rotationTest) return;
        if (rotationTest.lastEulerYawRad === null) {
            rotationTest.lastEulerYawRad = euler.yaw;
            rotationTest.unwrappedYawRad = euler.yaw;
            rotationTest.baselineYawRad = euler.yaw;
            rotationTest.hasEuler = true;
            return;
        }
        rotationTest.unwrappedYawRad = unwrapAngleRad(rotationTest.unwrappedYawRad, rotationTest.lastEulerYawRad, euler.yaw);
        rotationTest.lastEulerYawRad = euler.yaw;
    };
}

// === ログ操作 ===

function formatEventLogText() {
    const lines = [
        'ORPHE INSOLE PR #60 Gyro Scale Validation Event Log',
        `exportedAt=${new Date().toISOString()}`,
        `page=${window.location.href}`,
        `secureContext=${window.isSecureContext}`,
        `webBluetooth=${Boolean(navigator.bluetooth)}`,
        `platform=${navigator.platform || 'unknown'}`,
        `userAgent=${navigator.userAgent}`,
        `connected=${isConnected()}`,
        `deviceRange=${JSON.stringify(insoles[0]?.device_information?.range || null)}`,
        '',
        'completedAt\ttargetAngle\tgyroIntegralDeg\tgyroIntegralOldDeg\tquatDeltaDeg\tratio\tverdict',
        ...rotationHistory.map((result) => [
            result.completedAt,
            result.targetAngle,
            result.gyroIntegralDeg.toFixed(3),
            result.gyroIntegralOldDeg.toFixed(3),
            result.quatDeltaDeg !== null ? result.quatDeltaDeg.toFixed(3) : 'n/a',
            result.ratio !== null ? result.ratio.toFixed(4) : 'n/a',
            result.verdict,
        ].join('\t')),
        '',
        'timestamp\tlevel\tmessage',
        ...eventEntries.map((entry) => `${entry.timestamp}\t${entry.level}\t${entry.message}`),
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
        logEvent('success', `Event Log copied: ${eventEntries.length} entries`);
        dom.copyLogButton.textContent = 'コピーしました';
    } catch (error) {
        logEvent('error', `Event Log copy failed: ${error?.message || error}`);
        dom.copyLogButton.textContent = 'コピー失敗';
    }
    setTimeout(() => { dom.copyLogButton.innerHTML = '<i class="bi bi-clipboard"></i> ログをコピー'; }, 1500);
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
        schema: 'orphe-insole-gyro-scale-validation-v1',
        exportedAt: new Date().toISOString(),
        page: window.location.href,
        environment: {
            secureContext: window.isSecureContext,
            webBluetooth: Boolean(navigator.bluetooth),
            platform: navigator.platform || 'unknown',
            userAgent: navigator.userAgent,
        },
        deviceRange: insoles[0]?.device_information?.range || null,
        rotationHistory,
        events: eventEntries,
    };
    downloadBlob(
        JSON.stringify(payload, null, 2),
        `orphe-pr60-gyro-scale-${Date.now()}.json`,
        'application/json'
    );
    logEvent('success', `Result history JSON downloaded: ${rotationHistory.length} entries`);
}

function initialize() {
    const secure = window.isSecureContext;
    const bluetooth = Boolean(navigator.bluetooth);

    installDevice();
    setControlsEnabled(false);

    dom.readDeviceInfoButton.addEventListener('click', fetchDeviceInfo);
    dom.staticTestButton.addEventListener('click', startStaticTest);
    dom.rotationStartButton.addEventListener('click', startRotationTest);
    dom.rotationStopButton.addEventListener('click', finishRotationTest);
    dom.copyLogButton.addEventListener('click', copyEventLog);
    dom.downloadJsonButton.addEventListener('click', exportJson);
    dom.clearLogButton.addEventListener('click', () => {
        eventEntries.length = 0;
        dom.eventLog.replaceChildren();
        logEvent('info', 'Event Log cleared');
    });

    logEvent('success', 'PR #60 gyro scale validation initialized');
    logEvent(
        secure && bluetooth ? 'success' : 'error',
        `Environment: secureContext=${secure} webBluetooth=${bluetooth} userAgent=${navigator.userAgent}`
    );
    logEvent('info', '操作手順: ①接続 → ②静置テスト(10秒) → ③目標角度を選び回転テスト開始 → ④机上で水平に回転させ停止 → ⑤ログをコピー');
}

initialize();
