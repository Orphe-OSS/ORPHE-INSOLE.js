(function (global) {

const ACC_RANGE = 16;
const GYRO_RANGE = 2000;
const TICK_MS = 20;
const SENSOR_VALUES_UUID = 'SENSOR_VALUES';
const SENSOR_COUNT = 6;
const MAX_UINT16 = 65535;

const SENSOR_LAYOUT = [
    { x: -0.18, y: 0.42 },
    { x: -0.10, y: 0.18 },
    { x: 0.14, y: 0.38 },
    { x: 0.02, y: 0.10 },
    { x: 0.18, y: -0.06 },
    { x: -0.02, y: -0.42 }
];

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function deterministicNoise(seed, amp) {
    return Math.sin(seed * 12.9898 + 78.233) * amp;
}

function bump(phase, center, width) {
    let distance = Math.abs(phase - center);
    if (distance > 0.5) distance = 1 - distance;
    return Math.exp(-(distance * distance) / (2 * width * width));
}

function eulerToQuat(pitch, roll, yaw) {
    const cp = Math.cos(pitch / 2);
    const sp = Math.sin(pitch / 2);
    const cr = Math.cos(roll / 2);
    const sr = Math.sin(roll / 2);
    const cy = Math.cos(yaw / 2);
    const sy = Math.sin(yaw / 2);
    return {
        w: cy * cr * cp + sy * sr * sp,
        x: cy * cr * sp - sy * sr * cp,
        y: cy * sr * cp + sy * cr * sp,
        z: sy * cr * cp - cy * sr * sp
    };
}

function cloneVector3(value) {
    if (!value) return null;
    return {
        x: finiteNumber(value.x),
        y: finiteNumber(value.y),
        z: finiteNumber(value.z)
    };
}

function cloneQuat(value) {
    if (!value) return null;
    return {
        w: finiteNumber(value.w, 1),
        x: finiteNumber(value.x),
        y: finiteNumber(value.y),
        z: finiteNumber(value.z)
    };
}

function cloneEuler(value) {
    if (!value) return null;
    return {
        pitch: finiteNumber(value.pitch),
        roll: finiteNumber(value.roll),
        yaw: finiteNumber(value.yaw)
    };
}

function normalizeVector3(value, range) {
    if (!value) return null;
    return {
        x: value.x / range,
        y: value.y / range,
        z: value.z / range
    };
}

function withSampleMeta(value, timestamp, serialNumber, packetNumber) {
    if (!value) return null;
    return Object.assign({}, value, {
        timestamp,
        serial_number: serialNumber,
        packet_number: packetNumber
    });
}

function normalizePress(values) {
    if (!Array.isArray(values)) return null;
    const press = values.slice(0, SENSOR_COUNT).map(value => clamp(Math.round(finiteNumber(value)), 0, MAX_UINT16));
    while (press.length < SENSOR_COUNT) press.push(0);
    return press;
}

function generateFootPressureFromTarget(localTarget, targetLoad, phase) {
    const sigmaX = 0.17;
    const sigmaY = 0.27;
    const weights = SENSOR_LAYOUT.map((sensor, index) => {
        const dx = (sensor.x - localTarget.x) / sigmaX;
        const dy = (sensor.y - localTarget.y) / sigmaY;
        const pulse = 0.04 * Math.sin(phase + index * 1.73);
        return 0.12 + Math.exp(-0.5 * (dx * dx + dy * dy)) + pulse;
    });
    const sum = weights.reduce((total, value) => total + Math.max(0.01, value), 0);
    return weights.map((weight, index) => {
        const breathing = 1 + 0.025 * Math.sin(phase * 0.7 + index);
        return Math.max(0, Math.round(targetLoad * Math.max(0.01, weight) / sum * breathing));
    });
}

function generateWalkFrame(id, timeMs) {
    const cycleMs = 1200;
    const mirror = id !== 0;
    const phase = ((timeMs % cycleMs) / cycleMs + (mirror ? 0.5 : 0)) % 1;
    const sideSign = mirror ? -1 : 1;
    const stance = 0.6;
    const noise = (seed, amp) => deterministicNoise(timeMs * 0.001 + seed + id * 17, amp);
    const press = [
        7600 * bump(phase, 0.52, 0.09),
        12000 * bump(phase, 0.42, 0.12),
        5800 * bump(phase, 0.48, 0.09),
        10500 * bump(phase, 0.38, 0.12),
        6400 * bump(phase, 0.25, 0.14),
        13500 * bump(phase, 0.12, 0.11)
    ].map((value, index) => clamp(Math.round(value + noise(index, 90)), 0, MAX_UINT16));
    const impact = 1.6 * bump(phase, 0.03, 0.02);
    const acc = {
        x: sideSign * 0.25 * Math.sin(2 * Math.PI * phase) + noise(10, 0.03),
        y: 0.12 * Math.sin(2 * Math.PI * phase * 2 + 1) + noise(11, 0.03),
        z: 1.0 + impact + 0.18 * Math.sin(2 * Math.PI * phase * 2) + noise(12, 0.04)
    };
    const swing = phase > stance ? Math.sin(Math.PI * (phase - stance) / (1 - stance)) : 0;
    const gyro = {
        x: sideSign * 30 * Math.sin(2 * Math.PI * phase * 2) + noise(20, 8),
        y: 380 * swing - 90 * bump(phase, 0.55, 0.05) + noise(21, 8),
        z: sideSign * 20 * Math.sin(2 * Math.PI * phase + 2) + noise(22, 8)
    };
    const pitch = -0.45 * bump(phase, 0.62, 0.07) + 0.30 * bump(phase, 0.82, 0.1);
    const roll = sideSign * (0.08 * Math.sin(2 * Math.PI * phase) + 0.02 * Math.sin(timeMs / 900));
    const yaw = sideSign * 0.06 * Math.sin(timeMs / 1500);
    const euler = { pitch, roll, yaw };
    return { press, acc, gyro, quat: eulerToQuat(pitch, roll, yaw), euler };
}

function generateSwayFrame(id, timeMs, standStill) {
    const timeSeconds = timeMs / 1000;
    const sideSign = id === 0 ? -1 : 1;
    const swayScale = standStill ? 0.3 : 1;
    const swayX = swayScale * (0.035 * Math.sin(timeSeconds * 1.15) + 0.014 * Math.sin(timeSeconds * 3.2 + 0.8));
    const swayY = swayScale * (0.055 * Math.sin(timeSeconds * 0.82 + 0.5) + 0.015 * Math.sin(timeSeconds * 2.6));
    const localTarget = {
        x: clamp(swayX * sideSign * 0.42, -0.16, 0.16),
        y: clamp(swayY, -0.42, 0.42)
    };
    const totalLoad = (standStill ? 5200 : 6200) + (standStill ? 80 : 260) * Math.sin(timeSeconds * 0.45);
    const press = generateFootPressureFromTarget(localTarget, totalLoad / 2, timeSeconds + id * 1.1);
    const acc = {
        x: swayX * 0.4,
        y: swayY * 0.25,
        z: 1 + 0.015 * Math.sin(timeSeconds * 1.4 + id)
    };
    const gyro = {
        x: 3.5 * Math.sin(timeSeconds * 1.1 + id),
        y: 5.5 * Math.sin(timeSeconds * 0.9),
        z: 2.5 * Math.sin(timeSeconds * 1.6 + id * 0.5)
    };
    const euler = {
        pitch: swayY * 0.14,
        roll: sideSign * swayX * 0.16,
        yaw: sideSign * 0.01 * Math.sin(timeSeconds * 0.6)
    };
    return { press, acc, gyro, quat: eulerToQuat(euler.pitch, euler.roll, euler.yaw), euler };
}

function generatedFrame(id, preset, timeMs) {
    if (preset === 'stand') return generateSwayFrame(id, timeMs, true);
    if (preset === 'sway') return generateSwayFrame(id, timeMs, false);
    return generateWalkFrame(id, timeMs);
}

function normalizeStreamingMode(value) {
    const mode = value === undefined || value === null ? 4 : Number(value);
    if (mode === 1 || mode === 3 || mode === 4) return mode;
    throw new TypeError('Invalid ORPHE INSOLE simulator streaming mode');
}

function samplesPerTick(streamingMode) {
    return streamingMode === 4 ? 2 : 4;
}

function normalizeBeginArgs(type, options) {
    if (type && typeof type === 'object') {
        return Object.assign({}, type);
    }
    return Object.assign({}, options || {});
}

class OrpheInsoleSimulator {
    constructor(id = 0) {
        this.id = id;
        this.debug = false;
        this.device_information = null;
        this.acc = null;
        this.gyro = null;
        this.quat = null;
        this.euler = null;
        this.press = null;
        this.converted_acc = null;
        this.converted_gyro = null;
        this.interpolation = { enabled: false, max_consecutive_missing: 1 };
        this._timer = null;
        this._connected = false;
        this._serial = 0;
        this._sampleIndex = 0;
        this._startedAt = 0;
        this._streamingMode = 4;
        this._preset = 'walk';
        this._frames = null;
        this._frameIndex = 0;
        this._loop = true;
    }

    setup(names = ['DEVICE_INFORMATION', 'DATE_TIME', 'SENSOR_VALUES'], options = {}) {
        const defaultInterpolation = { enabled: false, max_consecutive_missing: 1 };
        const interpolation = options && typeof options.interpolation === 'object' ? options.interpolation : {};
        this.names = Array.isArray(names) ? names.slice() : [names];
        this.interpolation = Object.assign({}, defaultInterpolation, interpolation);
        return this;
    }

    async begin(type, options) {
        try {
            const beginOptions = normalizeBeginArgs(type, options);
            this.stop({ silent: true });
            this._streamingMode = normalizeStreamingMode(beginOptions.streamingMode);
            this._preset = beginOptions.preset === 'stand' || beginOptions.preset === 'sway' ? beginOptions.preset : 'walk';
            this._frames = this._normalizeFrames(beginOptions.frames);
            this._loop = beginOptions.loop !== false;
            this._frameIndex = 0;
            this._sampleIndex = 0;
            this._serial = 0;
            this._startedAt = this._now();
            this.device_information = {
                battery: 2,
                mount_position: this.id === 0 ? 0 : 1,
                range: { acc: 3, gyro: 3 }
            };
            this._connected = true;
            this.onScan(`ORPHE INSOLE Simulator ${this.id}`);
            this.onConnect('SIMULATOR');
            this.onStartNotify(SENSOR_VALUES_UUID);
            this._timer = setInterval(() => this._tick(), TICK_MS);
            this._tick();
            return 'done begin(); SENSOR VALUES';
        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    stop(options = {}) {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        const wasConnected = this._connected;
        this._connected = false;
        if (wasConnected && !options.silent) this.onDisconnect();
        return 'done stop();';
    }

    reset() {
        this.stop();
        this._serial = 0;
        this._sampleIndex = 0;
        this._frameIndex = 0;
        this.acc = null;
        this.gyro = null;
        this.quat = null;
        this.euler = null;
        this.press = null;
        this.converted_acc = null;
        this.converted_gyro = null;
        this.onReset();
    }

    isConnected() {
        return this._connected;
    }

    _normalizeFrames(frames) {
        if (!Array.isArray(frames) || frames.length === 0) return null;
        const matching = frames.filter(frame => frame && (frame.device === undefined || Number(frame.device) === Number(this.id)));
        return (matching.length > 0 ? matching : frames).slice();
    }

    _now() {
        if (global.performance && typeof global.performance.now === 'function') {
            return global.performance.now();
        }
        return Date.now();
    }

    _tick() {
        if (!this._connected) return;
        this.gotBLEFrequency(50);
        const count = samplesPerTick(this._streamingMode);
        const interval = TICK_MS / count;
        const tickTime = this._now() - this._startedAt;
        const serialNumber = this._serial;
        this._serial = (this._serial + 1) % 65536;
        for (let packetNumber = 0; packetNumber < count; packetNumber++) {
            const timestamp = Math.round(tickTime + packetNumber * interval);
            const frame = this._nextFrame(timestamp);
            if (!frame) {
                this.stop();
                return;
            }
            const frameSerial = frame.serial === undefined ? serialNumber : finiteNumber(frame.serial, serialNumber);
            const framePacketNumber = frame.packet_number === undefined ? packetNumber : finiteNumber(frame.packet_number, packetNumber);
            this._dispatchFrame(frame, timestamp, frameSerial, framePacketNumber);
            this._sampleIndex += 1;
        }
    }

    _nextFrame(timestamp) {
        if (!this._frames) {
            return generatedFrame(this.id, this._preset, timestamp);
        }
        if (this._frameIndex >= this._frames.length) {
            if (!this._loop) return null;
            this._frameIndex = 0;
        }
        const frame = this._frames[this._frameIndex];
        this._frameIndex += 1;
        return frame;
    }

    _dispatchFrame(frame, timestamp, serialNumber, packetNumber) {
        const frameTimestamp = frame.t === undefined ? timestamp : finiteNumber(frame.t, timestamp);
        const convertedAcc = cloneVector3(frame.acc);
        const convertedGyro = cloneVector3(frame.gyro);
        const normalizedAcc = normalizeVector3(convertedAcc, ACC_RANGE);
        const normalizedGyro = normalizeVector3(convertedGyro, GYRO_RANGE);
        const quat = cloneQuat(frame.quat);
        const euler = cloneEuler(frame.euler);
        const pressValues = normalizePress(frame.press);

        if (normalizedAcc) {
            this.acc = withSampleMeta(normalizedAcc, frameTimestamp, serialNumber, packetNumber);
            this.gotAcc(this.acc);
        }
        if (normalizedGyro) {
            this.gyro = withSampleMeta(normalizedGyro, frameTimestamp, serialNumber, packetNumber);
            this.gotGyro(this.gyro);
        }
        if (convertedAcc) {
            this.converted_acc = withSampleMeta(convertedAcc, frameTimestamp, serialNumber, packetNumber);
            this.gotConvertedAcc(this.converted_acc);
        }
        if (convertedGyro) {
            this.converted_gyro = withSampleMeta(convertedGyro, frameTimestamp, serialNumber, packetNumber);
            this.gotConvertedGyro(this.converted_gyro);
        }
        if (this._streamingMode !== 3 && quat) {
            this.quat = withSampleMeta(quat, frameTimestamp, serialNumber, packetNumber);
            this.gotQuat(this.quat);
            if (euler) {
                this.euler = withSampleMeta(euler, frameTimestamp, serialNumber, packetNumber);
                this.gotEuler(this.euler);
            }
        }
        if (this._streamingMode !== 1 && pressValues) {
            this.press = {
                values: pressValues,
                timestamp: frameTimestamp,
                serial_number: serialNumber,
                packet_number: packetNumber
            };
            this.gotPress(this.press);
        }
    }

    gotPress(press) { void press; }
    gotAcc(acc) { void acc; }
    gotGyro(gyro) { void gyro; }
    gotQuat(quat) { void quat; }
    gotEuler(euler) { void euler; }
    gotConvertedAcc(acc) { void acc; }
    gotConvertedGyro(gyro) { void gyro; }
    gotBLEFrequency(frequency) { void frequency; }
    lostData(serialNumber, serialNumberPrev) { void serialNumber; void serialNumberPrev; }
    onConnect(uuid) { void uuid; }
    onDisconnect() { }
    onError(error) { void error; }
    onScan(deviceName) { void deviceName; }
    onStartNotify(uuid) { void uuid; }
    onReset() { }
}

if (typeof global.OrpheInsoleSimulator === 'undefined') {
    global.OrpheInsoleSimulator = OrpheInsoleSimulator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        OrpheInsoleSimulator
    };
}

})(typeof globalThis !== 'undefined' ? globalThis : this);
