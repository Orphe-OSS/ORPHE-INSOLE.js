(function (global, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.OrpheQuaternionValidationMetrics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function radToDeg(radians) {
    return Number(radians) * 180 / Math.PI;
  }

  function quatNorm(quat) {
    if (!quat) return null;
    const values = [quat.w, quat.x, quat.y, quat.z].map(finite);
    if (values.some(value => value === null)) return null;
    return Math.hypot(values[0], values[1], values[2], values[3]);
  }

  function wrappedDeltaDegrees(current, previous) {
    const delta = Number(current) - Number(previous);
    return ((delta + 180) % 360 + 360) % 360 - 180;
  }

  function serialGap(current, previous) {
    const currentNumber = Number(current);
    const previousNumber = Number(previous);
    if (!Number.isInteger(currentNumber) || !Number.isInteger(previousNumber)) return null;
    const diff = (currentNumber - previousNumber + 65536) % 65536;
    if (diff === 0) return 0;
    if (diff > 32768) return null;
    return Math.max(0, diff - 1);
  }

  function sampleIntervalSeconds(mode) {
    return Number(mode) === 4 ? 0.01 : 0.005;
  }

  function expectedSampleRate(mode) {
    return Number(mode) === 4 ? 100 : 200;
  }

  class RunningStats {
    constructor() {
      this.count = 0;
      this.mean = 0;
      this.m2 = 0;
      this.min = Infinity;
      this.max = -Infinity;
    }

    push(value) {
      const number = finite(value);
      if (number === null) return false;
      this.count += 1;
      const delta = number - this.mean;
      this.mean += delta / this.count;
      this.m2 += delta * (number - this.mean);
      this.min = Math.min(this.min, number);
      this.max = Math.max(this.max, number);
      return true;
    }

    snapshot() {
      return {
        count: this.count,
        mean: this.count ? this.mean : null,
        std: this.count ? Math.sqrt(this.m2 / this.count) : null,
        min: this.count ? this.min : null,
        max: this.count ? this.max : null
      };
    }
  }

  class LinearRegression {
    constructor() {
      this.count = 0;
      this.meanX = 0;
      this.meanY = 0;
      this.sxx = 0;
      this.sxy = 0;
    }

    push(x, y) {
      const nx = finite(x);
      const ny = finite(y);
      if (nx === null || ny === null) return false;
      this.count += 1;
      const dx = nx - this.meanX;
      this.meanX += dx / this.count;
      const dy = ny - this.meanY;
      this.meanY += dy / this.count;
      this.sxx += dx * (nx - this.meanX);
      this.sxy += dx * (ny - this.meanY);
      return true;
    }

    slope() {
      if (this.count < 2 || Math.abs(this.sxx) <= Number.EPSILON) return null;
      return this.sxy / this.sxx;
    }
  }

  class AngleTracker {
    constructor() {
      this.count = 0;
      this.previousWrapped = null;
      this.start = null;
      this.current = null;
      this.min = Infinity;
      this.max = -Infinity;
      this.regression = new LinearRegression();
    }

    push(wrappedDegrees, elapsedMs) {
      const wrapped = finite(wrappedDegrees);
      const time = finite(elapsedMs);
      if (wrapped === null || time === null) return false;
      if (this.previousWrapped === null) {
        this.start = wrapped;
        this.current = wrapped;
      } else {
        this.current += wrappedDeltaDegrees(wrapped, this.previousWrapped);
      }
      this.previousWrapped = wrapped;
      this.count += 1;
      this.min = Math.min(this.min, this.current);
      this.max = Math.max(this.max, this.current);
      this.regression.push(time, this.current);
      return true;
    }

    snapshot() {
      const slopePerMs = this.regression.slope();
      return {
        count: this.count,
        startDeg: this.count ? this.start : null,
        endDeg: this.count ? this.current : null,
        deltaDeg: this.count ? this.current - this.start : null,
        minDeg: this.count ? this.min : null,
        maxDeg: this.count ? this.max : null,
        driftDegPerMin: slopePerMs === null ? null : slopePerMs * 60000
      };
    }
  }

  class DeviceAccumulator {
    constructor(deviceId, startAtMs, mode) {
      this.deviceId = Number(deviceId);
      this.startAtMs = Number(startAtMs) || 0;
      this.mode = Number(mode) || 4;
      this.samples = 0;
      this.receivedPackets = 0;
      this.lostPackets = 0;
      this.serialResets = 0;
      this.lastSerial = null;
      this.presence = { press: 0, acc: 0, gyro: 0, quat: 0, euler: 0 };
      this.norm = new RunningStats();
      this.yaw = new AngleTracker();
      this.gyroZIntegralDeg = 0;
    }

    addFrame(frame, hostTimestampMs) {
      if (!frame) return null;
      const now = finite(hostTimestampMs);
      const elapsedMs = Math.max(0, (now === null ? this.startAtMs : now) - this.startAtMs);
      this.samples += 1;

      const serial = finite(frame.serial);
      if (serial !== null && Number.isInteger(serial)) {
        if (this.lastSerial === null) {
          this.receivedPackets += 1;
          this.lastSerial = serial;
        } else if (serial !== this.lastSerial) {
          const gap = serialGap(serial, this.lastSerial);
          if (gap === null) {
            this.serialResets += 1;
          } else {
            this.lostPackets += gap;
          }
          this.receivedPackets += 1;
          this.lastSerial = serial;
        }
      }

      for (const key of Object.keys(this.presence)) {
        if (frame[key]) this.presence[key] += 1;
      }

      const norm = quatNorm(frame.quat);
      if (norm !== null) this.norm.push(norm);

      if (frame.euler && finite(frame.euler.yaw) !== null) {
        this.yaw.push(radToDeg(frame.euler.yaw), elapsedMs);
      }

      if (frame.gyro && finite(frame.gyro.z) !== null) {
        this.gyroZIntegralDeg += Number(frame.gyro.z) * sampleIntervalSeconds(frame.mode || this.mode);
      }

      return {
        elapsedMs,
        norm,
        yawUnwrappedDeg: this.yaw.current
      };
    }

    snapshot(endAtMs) {
      const end = finite(endAtMs);
      const durationMs = Math.max(0, (end === null ? this.startAtMs : end) - this.startAtMs);
      const expectedPackets = this.receivedPackets + this.lostPackets;
      return {
        deviceId: this.deviceId,
        mode: this.mode,
        durationMs,
        samples: this.samples,
        sampleRateHz: durationMs > 0 ? this.samples * 1000 / durationMs : 0,
        expectedSampleRateHz: expectedSampleRate(this.mode),
        receivedPackets: this.receivedPackets,
        lostPackets: this.lostPackets,
        packetLossPercent: expectedPackets > 0 ? this.lostPackets * 100 / expectedPackets : 0,
        serialResets: this.serialResets,
        presence: Object.assign({}, this.presence),
        norm: this.norm.snapshot(),
        yaw: this.yaw.snapshot(),
        gyroZIntegralDeg: this.gyroZIntegralDeg
      };
    }
  }

  function evaluateQuaternion(snapshot) {
    const norm = snapshot && snapshot.norm;
    if (!norm || norm.count === 0) {
      return { status: 'fail', message: 'quaternionデータなし' };
    }
    const scaleOk = norm.mean >= 0.99 && norm.mean <= 1.01 && norm.min >= 0.98 && norm.max <= 1.02;
    if (!scaleOk) {
      return { status: 'fail', message: `norm範囲 ${norm.min.toFixed(5)}〜${norm.max.toFixed(5)}` };
    }
    if (snapshot.packetLossPercent > 5) {
      return { status: 'warn', message: `norm正常、欠損率 ${snapshot.packetLossPercent.toFixed(2)}%` };
    }
    return { status: 'pass', message: `norm平均 ${norm.mean.toFixed(6)}` };
  }

  return {
    AngleTracker,
    DeviceAccumulator,
    LinearRegression,
    RunningStats,
    evaluateQuaternion,
    expectedSampleRate,
    quatNorm,
    radToDeg,
    sampleIntervalSeconds,
    serialGap,
    wrappedDeltaDegrees
  };
});
