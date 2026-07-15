(function (global, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.OrpheQuaternionValidationMetrics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DRIFT_WINDOW_MS = 5 * 60 * 1000;
  const MAX_DRIFT_WINDOWS = 288;
  const ADAPTIVE_BIAS_DEFAULTS = Object.freeze({
    enabled: true,
    gyroThresholdDegPerSecond: 4,
    accToleranceG: 0.12,
    stationaryDwellMs: 500,
    biasTimeConstantMs: 3000,
    maxIntegrationGapMs: 1000,
  });

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

  function quaternionToEuler(quat) {
    const norm = quatNorm(quat);
    if (norm === null || norm <= Number.EPSILON) return null;
    const w = Number(quat.w) / norm;
    const x = Number(quat.x) / norm;
    const y = Number(quat.y) / norm;
    const z = Number(quat.z) / norm;
    const sinPitch = Math.max(-1, Math.min(1, 2 * (w * y - z * x)));
    return {
      pitch: Math.asin(sinPitch),
      roll: Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
      yaw: Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)),
    };
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

  function expectedPacketRate() {
    return 50;
  }

  function adaptiveBiasOptions(options = {}) {
    const numberOrDefault = (value, fallback, minimum) => {
      const number = finite(value);
      return number === null ? fallback : Math.max(minimum, number);
    };
    return {
      enabled: options.enabled !== false,
      gyroThresholdDegPerSecond: numberOrDefault(options.gyroThresholdDegPerSecond, ADAPTIVE_BIAS_DEFAULTS.gyroThresholdDegPerSecond, 0.1),
      accToleranceG: numberOrDefault(options.accToleranceG, ADAPTIVE_BIAS_DEFAULTS.accToleranceG, 0.01),
      stationaryDwellMs: numberOrDefault(options.stationaryDwellMs, ADAPTIVE_BIAS_DEFAULTS.stationaryDwellMs, 0),
      biasTimeConstantMs: numberOrDefault(options.biasTimeConstantMs, ADAPTIVE_BIAS_DEFAULTS.biasTimeConstantMs, 1),
      maxIntegrationGapMs: numberOrDefault(options.maxIntegrationGapMs, ADAPTIVE_BIAS_DEFAULTS.maxIntegrationGapMs, 1),
    };
  }

  function yawRateFromGyroBias(bias, euler) {
    if (!bias || !euler) return null;
    const biasY = finite(bias.y);
    const biasZ = finite(bias.z);
    const roll = finite(euler.roll);
    const pitch = finite(euler.pitch);
    if (biasY === null || biasZ === null || roll === null || pitch === null) return null;
    const cosPitch = Math.cos(pitch);
    if (Math.abs(cosPitch) < 0.2) return null;
    return (Math.sin(roll) * biasY + Math.cos(roll) * biasZ) / cosPitch;
  }

  function connectionCoverage(interruptions, deviceId, durationMs) {
    const duration = Math.max(0, finite(durationMs) || 0);
    const id = Number(deviceId);
    const events = (Array.isArray(interruptions) ? interruptions : [])
      .filter(event => Number(event?.deviceId) === id && (event?.type === 'disconnect' || event?.type === 'reconnect'))
      .map(event => ({ type: event.type, elapsedMs: Math.max(0, Math.min(duration, finite(event.elapsedMs) || 0)) }))
      .sort((a, b) => a.elapsedMs - b.elapsedMs);
    let connected = true;
    let connectedDurationMs = 0;
    let previousElapsedMs = 0;
    let disconnects = 0;
    let reconnects = 0;
    for (const event of events) {
      if (connected) connectedDurationMs += Math.max(0, event.elapsedMs - previousElapsedMs);
      if (event.type === 'disconnect') {
        connected = false;
        disconnects += 1;
      } else {
        connected = true;
        reconnects += 1;
      }
      previousElapsedMs = event.elapsedMs;
    }
    if (connected) connectedDurationMs += Math.max(0, duration - previousElapsedMs);
    return {
      durationMs: duration,
      connectedDurationMs,
      disconnectedDurationMs: Math.max(0, duration - connectedDurationMs),
      connectionCoveragePercent: duration > 0 ? connectedDurationMs * 100 / duration : 0,
      disconnects,
      reconnects,
      connectedAtEnd: connected,
    };
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
      this.syy = 0;
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
      this.syy += dy * (ny - this.meanY);
      return true;
    }

    slope() {
      if (this.count < 2 || Math.abs(this.sxx) <= Number.EPSILON) return null;
      return this.sxy / this.sxx;
    }

    residualStd() {
      if (this.count < 2 || Math.abs(this.sxx) <= Number.EPSILON) return null;
      const residualSumSquares = Math.max(0, this.syy - (this.sxy * this.sxy / this.sxx));
      return Math.sqrt(residualSumSquares / this.count);
    }

    rSquared() {
      if (this.count < 2 || this.syy <= Number.EPSILON || Math.abs(this.sxx) <= Number.EPSILON) return null;
      return Math.max(0, Math.min(1, (this.sxy * this.sxy) / (this.sxx * this.syy)));
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
        rangeDeg: this.count ? this.max - this.min : null,
        driftDegPerMin: slopePerMs === null ? null : slopePerMs * 60000,
        residualStdDeg: this.regression.residualStd(),
        rSquared: this.regression.rSquared()
      };
    }
  }

  class AdaptiveYawBiasTracker {
    constructor(options = {}) {
      this.options = adaptiveBiasOptions(options);
      this.firstAtMs = null;
      this.lastAtMs = null;
      this.previousEuler = null;
      this.clockResets = 0;
      this.eligibleSamples = 0;
      this.stationarySamples = 0;
      this.stationary = false;
      this.stationarySinceMs = null;
      this.stationarySegmentSum = { x: 0, y: 0, z: 0 };
      this.stationarySegmentSamples = 0;
      this.stationarySegmentYawStartDeg = null;
      this.bias = { x: 0, y: 0, z: 0 };
      this.biasReady = false;
      this.biasUpdates = 0;
      this.readyAtMs = null;
      this.correctionIntegralDeg = 0;
      this.observedYawBiasRateDegPerSecond = null;
      this.observedYawReady = false;
      this.observedYawUpdates = 0;
      this.observedYawReadyAtMs = null;
      this.observedYawCorrectionIntegralDeg = 0;
      this.rawYaw = new AngleTracker();
      this.correctedCount = 0;
      this.correctedStartDeg = null;
      this.correctedCurrentDeg = null;
      this.correctedMinDeg = Infinity;
      this.correctedMaxDeg = -Infinity;
      this.correctedRegression = new LinearRegression();
      this.observedCorrectedCount = 0;
      this.observedCorrectedStartDeg = null;
      this.observedCorrectedCurrentDeg = null;
      this.observedCorrectedMinDeg = Infinity;
      this.observedCorrectedMaxDeg = -Infinity;
      this.observedCorrectedRegression = new LinearRegression();
      this.lastBiasYawRateDegPerSecond = null;
    }

    _timeFor(frame, hostTimestampMs) {
      const deviceAtMs = finite(frame && frame.timestamp);
      return deviceAtMs === null ? finite(hostTimestampMs) : deviceAtMs;
    }

    _motion(frame) {
      if (!frame || !frame.gyro || !frame.acc) return null;
      const gyro = {
        x: finite(frame.gyro.x),
        y: finite(frame.gyro.y),
        z: finite(frame.gyro.z),
      };
      const acc = {
        x: finite(frame.acc.x),
        y: finite(frame.acc.y),
        z: finite(frame.acc.z),
      };
      if (Object.values(gyro).some(value => value === null) || Object.values(acc).some(value => value === null)) return null;
      const gyroMagnitude = Math.hypot(gyro.x, gyro.y, gyro.z);
      const accMagnitude = Math.hypot(acc.x, acc.y, acc.z);
      return {
        gyro,
        gyroMagnitude,
        accMagnitude,
        stationary: gyroMagnitude <= this.options.gyroThresholdDegPerSecond
          && Math.abs(accMagnitude - 1) <= this.options.accToleranceG,
      };
    }

    _clearStationarySegment() {
      this.stationarySinceMs = null;
      this.stationarySegmentSum = { x: 0, y: 0, z: 0 };
      this.stationarySegmentSamples = 0;
      this.stationarySegmentYawStartDeg = null;
    }

    _updateBias(motion, atMs, frame, rawYawDeg) {
      this.eligibleSamples += 1;
      this.stationary = motion.stationary;
      if (!motion.stationary || !this.options.enabled) {
        this._clearStationarySegment();
        return;
      }

      this.stationarySamples += 1;
      if (this.stationarySinceMs === null) {
        this.stationarySinceMs = atMs;
        this.stationarySegmentYawStartDeg = rawYawDeg;
      }
      this.stationarySegmentSum.x += motion.gyro.x;
      this.stationarySegmentSum.y += motion.gyro.y;
      this.stationarySegmentSum.z += motion.gyro.z;
      this.stationarySegmentSamples += 1;
      const dwellMs = Math.max(0, atMs - this.stationarySinceMs);
      if (dwellMs < this.options.stationaryDwellMs) return;

      const observedYawBiasRate = dwellMs > 0
        && finite(rawYawDeg) !== null
        && finite(this.stationarySegmentYawStartDeg) !== null
        ? (rawYawDeg - this.stationarySegmentYawStartDeg) * 1000 / dwellMs
        : null;

      if (!this.observedYawReady && observedYawBiasRate !== null) {
        this.observedYawBiasRateDegPerSecond = observedYawBiasRate;
        this.observedYawReady = true;
        this.observedYawUpdates = 1;
        this.observedYawReadyAtMs = atMs;
        this.observedYawCorrectionIntegralDeg += observedYawBiasRate * dwellMs / 1000;
      }

      if (!this.biasReady) {
        this.bias = {
          x: this.stationarySegmentSum.x / this.stationarySegmentSamples,
          y: this.stationarySegmentSum.y / this.stationarySegmentSamples,
          z: this.stationarySegmentSum.z / this.stationarySegmentSamples,
        };
        this.biasReady = true;
        this.biasUpdates = 1;
        this.readyAtMs = atMs;
        const initialYawBias = yawRateFromGyroBias(this.bias, frame.euler);
        if (initialYawBias !== null) this.correctionIntegralDeg += initialYawBias * dwellMs / 1000;
        return;
      }

      const nominalMs = sampleIntervalSeconds(frame.mode || 4) * 1000;
      const alpha = 1 - Math.exp(-nominalMs / this.options.biasTimeConstantMs);
      this.bias.x += alpha * (motion.gyro.x - this.bias.x);
      this.bias.y += alpha * (motion.gyro.y - this.bias.y);
      this.bias.z += alpha * (motion.gyro.z - this.bias.z);
      this.biasUpdates += 1;
      if (this.observedYawReady && observedYawBiasRate !== null) {
        this.observedYawBiasRateDegPerSecond += alpha * (observedYawBiasRate - this.observedYawBiasRateDegPerSecond);
        this.observedYawUpdates += 1;
      }
    }

    addFrame(frame, hostTimestampMs) {
      if (!frame) return null;
      const atMs = this._timeFor(frame, hostTimestampMs);
      if (atMs === null) return null;
      if (this.firstAtMs === null) this.firstAtMs = atMs;
      let elapsedStepMs = 0;
      if (this.lastAtMs !== null) {
        if (atMs < this.lastAtMs) {
          this.clockResets += 1;
        } else {
          elapsedStepMs = Math.min(this.options.maxIntegrationGapMs, atMs - this.lastAtMs);
        }
      }

      if (this.options.enabled && this.biasReady && elapsedStepMs > 0) {
        const yawBiasRate = yawRateFromGyroBias(this.bias, this.previousEuler || frame.euler);
        if (yawBiasRate !== null) this.correctionIntegralDeg += yawBiasRate * elapsedStepMs / 1000;
      }
      if (this.options.enabled && this.observedYawReady && elapsedStepMs > 0) {
        this.observedYawCorrectionIntegralDeg += this.observedYawBiasRateDegPerSecond * elapsedStepMs / 1000;
      }

      const elapsedMs = Math.max(0, atMs - this.firstAtMs);
      let rawYawDeg = null;
      if (frame.euler && finite(frame.euler.yaw) !== null) {
        this.rawYaw.push(radToDeg(frame.euler.yaw), elapsedMs);
        rawYawDeg = this.rawYaw.current;
      }

      const motion = this._motion(frame);
      if (motion) this._updateBias(motion, atMs, frame, rawYawDeg);
      else {
        this.stationary = false;
        this._clearStationarySegment();
      }

      if (rawYawDeg !== null) {
        const corrected = this.rawYaw.current - this.correctionIntegralDeg;
        if (this.correctedStartDeg === null) this.correctedStartDeg = corrected;
        this.correctedCurrentDeg = corrected;
        this.correctedCount += 1;
        this.correctedMinDeg = Math.min(this.correctedMinDeg, corrected);
        this.correctedMaxDeg = Math.max(this.correctedMaxDeg, corrected);
        this.correctedRegression.push(elapsedMs, corrected);

        const observedCorrected = this.rawYaw.current - this.observedYawCorrectionIntegralDeg;
        if (this.observedCorrectedStartDeg === null) this.observedCorrectedStartDeg = observedCorrected;
        this.observedCorrectedCurrentDeg = observedCorrected;
        this.observedCorrectedCount += 1;
        this.observedCorrectedMinDeg = Math.min(this.observedCorrectedMinDeg, observedCorrected);
        this.observedCorrectedMaxDeg = Math.max(this.observedCorrectedMaxDeg, observedCorrected);
        this.observedCorrectedRegression.push(elapsedMs, observedCorrected);
      }

      this.lastBiasYawRateDegPerSecond = this.biasReady ? yawRateFromGyroBias(this.bias, frame.euler) : null;
      this.lastAtMs = atMs;
      this.previousEuler = frame.euler || this.previousEuler;
      return this.snapshot();
    }

    snapshot() {
      const correctedSlope = this.correctedRegression.slope();
      const observedCorrectedSlope = this.observedCorrectedRegression.slope();
      const stationaryElapsedMs = this.stationary && this.stationarySinceMs !== null && this.lastAtMs !== null
        ? Math.max(0, this.lastAtMs - this.stationarySinceMs)
        : 0;
      return {
        enabled: this.options.enabled,
        state: !this.options.enabled ? 'disabled' : (this.biasReady ? (this.stationary ? 'updating' : 'holding') : (this.stationary ? 'learning' : 'waiting')),
        ready: this.biasReady,
        readyAtMs: this.readyAtMs,
        bias: this.biasReady ? { ...this.bias } : null,
        biasUpdates: this.biasUpdates,
        biasYawRateDegPerSecond: this.lastBiasYawRateDegPerSecond,
        correctionDeg: this.correctionIntegralDeg,
        observedYawReady: this.observedYawReady,
        observedYawReadyAtMs: this.observedYawReadyAtMs,
        observedYawUpdates: this.observedYawUpdates,
        observedYawBiasRateDegPerSecond: this.observedYawBiasRateDegPerSecond,
        observedYawCorrectionDeg: this.observedYawCorrectionIntegralDeg,
        stationary: this.stationary,
        stationaryElapsedMs,
        stationarySamples: this.stationarySamples,
        eligibleSamples: this.eligibleSamples,
        stationaryPercent: this.eligibleSamples ? this.stationarySamples * 100 / this.eligibleSamples : 0,
        clockResets: this.clockResets,
        options: { ...this.options },
        correctedYaw: {
          count: this.correctedCount,
          startDeg: this.correctedStartDeg,
          endDeg: this.correctedCurrentDeg,
          deltaDeg: this.correctedCount ? this.correctedCurrentDeg - this.correctedStartDeg : null,
          minDeg: this.correctedCount ? this.correctedMinDeg : null,
          maxDeg: this.correctedCount ? this.correctedMaxDeg : null,
          rangeDeg: this.correctedCount ? this.correctedMaxDeg - this.correctedMinDeg : null,
          driftDegPerMin: correctedSlope === null ? null : correctedSlope * 60000,
          residualStdDeg: this.correctedRegression.residualStd(),
          rSquared: this.correctedRegression.rSquared(),
        },
        observedCorrectedYaw: {
          count: this.observedCorrectedCount,
          startDeg: this.observedCorrectedStartDeg,
          endDeg: this.observedCorrectedCurrentDeg,
          deltaDeg: this.observedCorrectedCount ? this.observedCorrectedCurrentDeg - this.observedCorrectedStartDeg : null,
          minDeg: this.observedCorrectedCount ? this.observedCorrectedMinDeg : null,
          maxDeg: this.observedCorrectedCount ? this.observedCorrectedMaxDeg : null,
          rangeDeg: this.observedCorrectedCount ? this.observedCorrectedMaxDeg - this.observedCorrectedMinDeg : null,
          driftDegPerMin: observedCorrectedSlope === null ? null : observedCorrectedSlope * 60000,
          residualStdDeg: this.observedCorrectedRegression.residualStd(),
          rSquared: this.observedCorrectedRegression.rSquared(),
        },
      };
    }
  }

  class DriftWindowAccumulator {
    constructor(index) {
      this.index = index;
      this.firstElapsedMs = null;
      this.lastElapsedMs = null;
      this.yawRegression = new LinearRegression();
      this.gyroZ = new RunningStats();
      this.gyroReferencedYawRegression = new LinearRegression();
    }

    push(elapsedMs, yawUnwrappedDeg, gyroZDegPerSecond, gyroReferencedYawDeg) {
      const elapsed = finite(elapsedMs);
      if (elapsed === null) return;
      if (this.firstElapsedMs === null) this.firstElapsedMs = elapsed;
      this.lastElapsedMs = elapsed;
      const relativeMs = elapsed - this.firstElapsedMs;
      this.yawRegression.push(relativeMs, yawUnwrappedDeg);
      this.gyroZ.push(gyroZDegPerSecond);
      this.gyroReferencedYawRegression.push(relativeMs, gyroReferencedYawDeg);
    }

    snapshot() {
      const yawSlope = this.yawRegression.slope();
      const gyroZ = this.gyroZ.snapshot();
      const referencedSlope = this.gyroReferencedYawRegression.slope();
      return {
        index: this.index,
        startMinute: this.index * DRIFT_WINDOW_MS / 60000,
        durationMs: this.firstElapsedMs === null || this.lastElapsedMs === null ? 0 : this.lastElapsedMs - this.firstElapsedMs,
        samples: this.yawRegression.count,
        yawDriftDegPerMin: yawSlope === null ? null : yawSlope * 60000,
        yawResidualStdDeg: this.yawRegression.residualStd(),
        yawRSquared: this.yawRegression.rSquared(),
        gyroZMeanDegPerSecond: gyroZ.mean,
        gyroZBiasDegPerMin: gyroZ.mean === null ? null : gyroZ.mean * 60,
        gyroReferencedYawDriftDegPerMin: referencedSlope === null ? null : referencedSlope * 60000,
        gyroReferencedYawResidualStdDeg: this.gyroReferencedYawRegression.residualStd()
      };
    }
  }

  class DeviceAccumulator {
    constructor(deviceId, startAtMs, mode, options = {}) {
      this.deviceId = Number(deviceId);
      this.startAtMs = Number(startAtMs) || 0;
      this.mode = Number(mode) || 4;
      this.samples = 0;
      this.firstFrameAtMs = null;
      this.lastFrameAtMs = null;
      this.firstDeviceAtMs = null;
      this.lastDeviceAtMs = null;
      this.deviceClockResets = 0;
      this.receivedPackets = 0;
      this.lostPackets = 0;
      this.serialResets = 0;
      this.lastSerial = null;
      this.lastPacketAtMs = null;
      this.gapEvents = 0;
      this.maxGap = 0;
      this.gapHistogram = { one: 0, twoToThree: 0, fourToSeven: 0, eightPlus: 0 };
      this.packetIntervalMs = new RunningStats();
      this.presence = { press: 0, acc: 0, gyro: 0, quat: 0, euler: 0 };
      this.norm = new RunningStats();
      this.yaw = new AngleTracker();
      this.gyroZ = new RunningStats();
      this.gyroZIntegralDeg = 0;
      this.gyroZHostTimeIntegralDeg = 0;
      this.gyroZDeviceTimeIntegralDeg = 0;
      this.previousGyroZ = null;
      this.previousGyroAtMs = null;
      this.previousGyroDeviceAtMs = null;
      this.yawDeviceTimeRegression = new LinearRegression();
      this.gyroReferencedYawStartDeg = null;
      this.gyroReferencedYaw = new RunningStats();
      this.gyroReferencedYawRegression = new LinearRegression();
      this.gyroReferencedYawDeviceStartDeg = null;
      this.gyroReferencedYawDevice = new RunningStats();
      this.gyroReferencedYawDeviceRegression = new LinearRegression();
      this.driftWindows = [];
      this.driftWindowsTruncated = false;
      this.adaptiveYawBias = new AdaptiveYawBiasTracker(options.adaptiveBias || {});
    }

    addFrame(frame, hostTimestampMs) {
      if (!frame) return null;
      const now = finite(hostTimestampMs);
      const elapsedMs = Math.max(0, (now === null ? this.startAtMs : now) - this.startAtMs);
      const frameDeviceAtMs = finite(frame.timestamp);
      let deviceElapsedMs = null;
      if (now !== null) {
        if (this.firstFrameAtMs === null) this.firstFrameAtMs = now;
        this.lastFrameAtMs = now;
      }
      if (frameDeviceAtMs !== null) {
        if (this.lastDeviceAtMs !== null && frameDeviceAtMs < this.lastDeviceAtMs) {
          this.deviceClockResets += 1;
        } else {
          if (this.firstDeviceAtMs === null) this.firstDeviceAtMs = frameDeviceAtMs;
          this.lastDeviceAtMs = frameDeviceAtMs;
          deviceElapsedMs = frameDeviceAtMs - this.firstDeviceAtMs;
        }
      }
      this.samples += 1;
      let packetGap = null;
      let packetIntervalMs = null;

      const serial = finite(frame.serial);
      if (serial !== null && Number.isInteger(serial)) {
        if (this.lastSerial === null) {
          this.receivedPackets += 1;
          this.lastSerial = serial;
          this.lastPacketAtMs = now;
        } else if (serial !== this.lastSerial) {
          const gap = serialGap(serial, this.lastSerial);
          if (gap === null) {
            this.serialResets += 1;
          } else {
            packetGap = gap;
            this.lostPackets += gap;
            if (gap > 0) {
              this.gapEvents += 1;
              this.maxGap = Math.max(this.maxGap, gap);
              if (gap === 1) this.gapHistogram.one += 1;
              else if (gap <= 3) this.gapHistogram.twoToThree += 1;
              else if (gap <= 7) this.gapHistogram.fourToSeven += 1;
              else this.gapHistogram.eightPlus += 1;
            }
          }
          if (now !== null && this.lastPacketAtMs !== null) {
            packetIntervalMs = Math.max(0, now - this.lastPacketAtMs);
            this.packetIntervalMs.push(packetIntervalMs);
          }
          this.receivedPackets += 1;
          this.lastSerial = serial;
          this.lastPacketAtMs = now;
        }
      }

      for (const key of Object.keys(this.presence)) {
        if (frame[key]) this.presence[key] += 1;
      }

      const norm = quatNorm(frame.quat);
      if (norm !== null) this.norm.push(norm);

      const adaptiveYawBias = this.adaptiveYawBias.addFrame(frame, now);

      if (frame.euler && finite(frame.euler.yaw) !== null) {
        this.yaw.push(radToDeg(frame.euler.yaw), elapsedMs);
        if (deviceElapsedMs !== null) this.yawDeviceTimeRegression.push(deviceElapsedMs, this.yaw.current);
      }

      let gyroZ = null;
      if (frame.gyro && finite(frame.gyro.z) !== null) {
        gyroZ = Number(frame.gyro.z);
        this.gyroZ.push(gyroZ);
        this.gyroZIntegralDeg += gyroZ * sampleIntervalSeconds(frame.mode || this.mode);
        if (now !== null && this.previousGyroAtMs !== null && this.previousGyroZ !== null) {
          const elapsedSeconds = Math.max(0, Math.min(1000, now - this.previousGyroAtMs)) / 1000;
          this.gyroZHostTimeIntegralDeg += this.previousGyroZ * elapsedSeconds;
        }
        if (deviceElapsedMs !== null && this.previousGyroDeviceAtMs !== null && this.previousGyroZ !== null) {
          const elapsedSeconds = Math.max(0, Math.min(1000, frameDeviceAtMs - this.previousGyroDeviceAtMs)) / 1000;
          this.gyroZDeviceTimeIntegralDeg += this.previousGyroZ * elapsedSeconds;
        }
        this.previousGyroZ = gyroZ;
        this.previousGyroAtMs = now;
        if (deviceElapsedMs !== null) this.previousGyroDeviceAtMs = frameDeviceAtMs;
      }

      let gyroReferencedYawDeg = null;
      if (this.yaw.current !== null && this.gyroZ.count > 0) {
        const referenced = this.yaw.current - this.gyroZHostTimeIntegralDeg;
        if (this.gyroReferencedYawStartDeg === null) this.gyroReferencedYawStartDeg = referenced;
        gyroReferencedYawDeg = referenced - this.gyroReferencedYawStartDeg;
        this.gyroReferencedYaw.push(gyroReferencedYawDeg);
        this.gyroReferencedYawRegression.push(elapsedMs, gyroReferencedYawDeg);
      }

      let gyroReferencedYawDeviceDeg = null;
      if (this.yaw.current !== null && this.gyroZ.count > 0 && deviceElapsedMs !== null) {
        const referenced = this.yaw.current - this.gyroZDeviceTimeIntegralDeg;
        if (this.gyroReferencedYawDeviceStartDeg === null) this.gyroReferencedYawDeviceStartDeg = referenced;
        gyroReferencedYawDeviceDeg = referenced - this.gyroReferencedYawDeviceStartDeg;
        this.gyroReferencedYawDevice.push(gyroReferencedYawDeviceDeg);
        this.gyroReferencedYawDeviceRegression.push(deviceElapsedMs, gyroReferencedYawDeviceDeg);
      }

      const windowIndex = Math.floor(elapsedMs / DRIFT_WINDOW_MS);
      if (windowIndex < MAX_DRIFT_WINDOWS) {
        if (!this.driftWindows[windowIndex]) this.driftWindows[windowIndex] = new DriftWindowAccumulator(windowIndex);
        this.driftWindows[windowIndex].push(elapsedMs, this.yaw.current, gyroZ, gyroReferencedYawDeg);
      } else {
        this.driftWindowsTruncated = true;
      }

      return {
        elapsedMs,
        norm,
        yawUnwrappedDeg: this.yaw.current,
        packetGap,
        packetIntervalMs,
        gyroReferencedYawDeg,
        gyroReferencedYawDeviceDeg,
        gyroZIntegralDeg: this.gyroZIntegralDeg,
        gyroZHostTimeIntegralDeg: this.gyroZHostTimeIntegralDeg,
        gyroZDeviceTimeIntegralDeg: this.gyroZDeviceTimeIntegralDeg,
        adaptiveYawBias,
      };
    }

    snapshot(endAtMs) {
      const end = finite(endAtMs);
      const durationMs = Math.max(0, (end === null ? this.startAtMs : end) - this.startAtMs);
      const observedDurationMs = this.firstFrameAtMs !== null && this.lastFrameAtMs !== null
        ? Math.max(0, this.lastFrameAtMs - this.firstFrameAtMs)
        : 0;
      const deviceClockDurationMs = this.firstDeviceAtMs !== null && this.lastDeviceAtMs !== null
        ? Math.max(0, this.lastDeviceAtMs - this.firstDeviceAtMs)
        : 0;
      const lastSampleElapsedMs = this.lastFrameAtMs === null ? 0 : Math.max(0, this.lastFrameAtMs - this.startAtMs);
      const expectedPackets = this.receivedPackets + this.lostPackets;
      const yaw = this.yaw.snapshot();
      const gyroZ = this.gyroZ.snapshot();
      const gyroReferencedYaw = this.gyroReferencedYaw.snapshot();
      const gyroReferencedSlope = this.gyroReferencedYawRegression.slope();
      const yawDeviceTimeSlope = this.yawDeviceTimeRegression.slope();
      const gyroReferencedDevice = this.gyroReferencedYawDevice.snapshot();
      const gyroReferencedDeviceSlope = this.gyroReferencedYawDeviceRegression.slope();
      return {
        deviceId: this.deviceId,
        mode: this.mode,
        durationMs,
        observedDurationMs,
        deviceClockDurationMs,
        hostToDeviceDurationRatio: deviceClockDurationMs > 0 ? observedDurationMs / deviceClockDurationMs : null,
        deviceClockResets: this.deviceClockResets,
        lastSampleElapsedMs,
        completionPercent: durationMs > 0 ? Math.min(100, lastSampleElapsedMs * 100 / durationMs) : 0,
        coveragePercent: durationMs > 0 ? Math.min(100, lastSampleElapsedMs * 100 / durationMs) : 0,
        samples: this.samples,
        sampleRateHz: durationMs > 0 ? this.samples * 1000 / durationMs : 0,
        observedSampleRateHz: observedDurationMs > 0 ? Math.max(0, this.samples - 1) * 1000 / observedDurationMs : 0,
        expectedSampleRateHz: expectedSampleRate(this.mode),
        receivedPackets: this.receivedPackets,
        packetRateHz: durationMs > 0 ? this.receivedPackets * 1000 / durationMs : 0,
        observedPacketRateHz: observedDurationMs > 0 ? Math.max(0, this.receivedPackets - 1) * 1000 / observedDurationMs : 0,
        expectedPacketRateHz: expectedPacketRate(this.mode),
        lostPackets: this.lostPackets,
        packetLossPercent: expectedPackets > 0 ? this.lostPackets * 100 / expectedPackets : 0,
        serialResets: this.serialResets,
        gapEvents: this.gapEvents,
        maxGap: this.maxGap,
        gapHistogram: Object.assign({}, this.gapHistogram),
        packetIntervalMs: this.packetIntervalMs.snapshot(),
        presence: Object.assign({}, this.presence),
        norm: this.norm.snapshot(),
        yaw,
        yawDeviceClock: {
          count: this.yawDeviceTimeRegression.count,
          driftDegPerMin: yawDeviceTimeSlope === null ? null : yawDeviceTimeSlope * 60000,
          residualStdDeg: this.yawDeviceTimeRegression.residualStd(),
          rSquared: this.yawDeviceTimeRegression.rSquared()
        },
        gyroZ,
        gyroZBiasDegPerMin: gyroZ.mean === null ? null : gyroZ.mean * 60,
        yawMinusGyroDegPerMin: yaw.driftDegPerMin === null || gyroZ.mean === null ? null : yaw.driftDegPerMin - gyroZ.mean * 60,
        gyroReferencedYaw: {
          ...gyroReferencedYaw,
          rangeDeg: gyroReferencedYaw.count ? gyroReferencedYaw.max - gyroReferencedYaw.min : null,
          driftDegPerMin: gyroReferencedSlope === null ? null : gyroReferencedSlope * 60000,
          residualStdDeg: this.gyroReferencedYawRegression.residualStd(),
          rSquared: this.gyroReferencedYawRegression.rSquared()
        },
        gyroReferencedYawDeviceClock: {
          ...gyroReferencedDevice,
          rangeDeg: gyroReferencedDevice.count ? gyroReferencedDevice.max - gyroReferencedDevice.min : null,
          driftDegPerMin: gyroReferencedDeviceSlope === null ? null : gyroReferencedDeviceSlope * 60000,
          residualStdDeg: this.gyroReferencedYawDeviceRegression.residualStd(),
          rSquared: this.gyroReferencedYawDeviceRegression.rSquared()
        },
        driftWindows5Min: this.driftWindows.filter(Boolean).map(window => window.snapshot()),
        driftWindowsTruncated: this.driftWindowsTruncated,
        gyroZIntegralDeg: this.gyroZIntegralDeg,
        gyroZHostTimeIntegralDeg: this.gyroZHostTimeIntegralDeg,
        gyroZDeviceTimeIntegralDeg: this.gyroZDeviceTimeIntegralDeg,
        adaptiveYawBias: this.adaptiveYawBias.snapshot(),
      };
    }
  }

  class GapCoincidenceTracker {
    constructor(deviceIds, toleranceMs = 25) {
      this.deviceIds = deviceIds.map(Number);
      this.toleranceMs = Math.max(0, Number(toleranceMs) || 0);
      this.queues = new Map(this.deviceIds.map(deviceId => [deviceId, []]));
      this.total = new Map(this.deviceIds.map(deviceId => [deviceId, 0]));
      this.matched = new Map(this.deviceIds.map(deviceId => [deviceId, 0]));
      this.matchedPairs = 0;
    }

    add(deviceId, atMs) {
      const id = Number(deviceId);
      const at = finite(atMs);
      if (at === null || !this.queues.has(id)) return false;
      for (const [key, queue] of this.queues.entries()) {
        this.queues.set(key, queue.filter(event => at - event.at <= this.toleranceMs));
      }

      this.total.set(id, this.total.get(id) + 1);
      const event = { at, matched: false };
      for (const otherId of this.deviceIds) {
        if (otherId === id) continue;
        const candidate = this.queues.get(otherId).find(item => !item.matched && Math.abs(item.at - at) <= this.toleranceMs);
        if (!candidate) continue;
        candidate.matched = true;
        event.matched = true;
        this.matched.set(id, this.matched.get(id) + 1);
        this.matched.set(otherId, this.matched.get(otherId) + 1);
        this.matchedPairs += 1;
        break;
      }
      this.queues.get(id).push(event);
      return event.matched;
    }

    snapshot() {
      return {
        toleranceMs: this.toleranceMs,
        matchedPairs: this.matchedPairs,
        devices: this.deviceIds.map(deviceId => {
          const totalEvents = this.total.get(deviceId);
          const matchedEvents = this.matched.get(deviceId);
          return {
            deviceId,
            totalEvents,
            matchedEvents,
            matchedPercent: totalEvents ? matchedEvents * 100 / totalEvents : 0
          };
        })
      };
    }
  }

  function evaluateCommunication(snapshot) {
    if (!snapshot || snapshot.receivedPackets < 2) {
      return { status: 'fail', message: '受信パケット不足' };
    }
    let lossStatus = 'pass';
    if (snapshot.packetLossPercent > 5) lossStatus = 'fail';
    else if (snapshot.packetLossPercent > 1) lossStatus = 'warn';

    let rateStatus = 'pass';
    if (snapshot.packetRateHz < snapshot.expectedPacketRateHz * 0.8) rateStatus = 'fail';
    else if (snapshot.packetRateHz < snapshot.expectedPacketRateHz * 0.9) rateStatus = 'warn';

    const statusOrder = { pass: 0, warn: 1, fail: 2 };
    const status = statusOrder[lossStatus] >= statusOrder[rateStatus] ? lossStatus : rateStatus;
    return {
      status,
      lossStatus,
      rateStatus,
      message: `packet ${snapshot.packetRateHz.toFixed(1)}Hz / loss ${snapshot.packetLossPercent.toFixed(2)}% / max gap ${snapshot.maxGap}`
    };
  }

  function evaluateYawDrift(snapshot) {
    const yawDriftDegPerMin = finite(snapshot?.yaw?.driftDegPerMin);
    const gyroBiasDegPerMin = finite(snapshot?.gyroZBiasDegPerMin);
    const observedDurationMs = finite(snapshot?.observedDurationMs) ?? finite(snapshot?.durationMs) ?? 0;
    if (yawDriftDegPerMin === null || gyroBiasDegPerMin === null || observedDurationMs < 60000) {
      return {
        kind: 'insufficient',
        status: 'warn',
        message: 'yaw/gyroの評価には60秒以上の静置データが必要です'
      };
    }

    const integratedResidual = finite(snapshot?.gyroReferencedYaw?.driftDegPerMin);
    const differenceDegPerMin = integratedResidual ?? (yawDriftDegPerMin - gyroBiasDegPerMin);
    const yawToGyroScaleRatio = Math.abs(gyroBiasDegPerMin) >= 1
      ? yawDriftDegPerMin / gyroBiasDegPerMin
      : null;
    const toleranceDegPerMin = Math.max(5, Math.abs(yawDriftDegPerMin) * 0.15);
    const sameDirection = Math.abs(yawDriftDegPerMin) < 1 || Math.abs(gyroBiasDegPerMin) < 1 || Math.sign(yawDriftDegPerMin) === Math.sign(gyroBiasDegPerMin);
    const residualStdDeg = finite(snapshot?.yaw?.residualStdDeg);
    const rSquared = finite(snapshot?.yaw?.rSquared);
    const residualToMinuteDrift = residualStdDeg === null
      ? null
      : residualStdDeg / Math.max(1, Math.abs(yawDriftDegPerMin));
    const averageExplained = sameDirection && Math.abs(differenceDegPerMin) <= toleranceDegPerMin;
    const windows = Array.isArray(snapshot?.driftWindows5Min)
      ? snapshot.driftWindows5Min.filter(window => finite(window?.durationMs) >= 60000)
      : [];
    const windowRange = key => {
      const values = windows.map(window => finite(window?.[key])).filter(value => value !== null);
      return values.length < 2 ? null : Math.max(...values) - Math.min(...values);
    };
    const windowYawDriftRangeDegPerMin = windowRange('yawDriftDegPerMin');
    const windowGyroBiasRangeDegPerMin = windowRange('gyroZBiasDegPerMin');
    const windowResidualRangeDegPerMin = windowRange('gyroReferencedYawDriftDegPerMin');
    const fixedCalibration = (() => {
      if (windows.length < 2) return null;
      const firstYawDrift = finite(windows[0].yawDriftDegPerMin);
      const firstGyroBias = finite(windows[0].gyroZBiasDegPerMin);
      if (firstYawDrift === null || firstGyroBias === null) return null;
      const yawCalibrationResiduals = windows.slice(1)
        .map(window => finite(window.yawDriftDegPerMin))
        .filter(value => value !== null)
        .map(value => value - firstYawDrift);
      const gyroCalibrationResiduals = windows.slice(1)
        .map(window => finite(window.yawDriftDegPerMin))
        .filter(value => value !== null)
        .map(value => value - firstGyroBias);
      const summarize = values => values.length ? {
        count: values.length,
        meanDegPerMin: values.reduce((sum, value) => sum + value, 0) / values.length,
        maxAbsDegPerMin: Math.max(...values.map(Math.abs)),
      } : null;
      const postYawCalibrationResidual = summarize(yawCalibrationResiduals);
      const postGyroCalibrationResidual = summarize(gyroCalibrationResiduals);
      if (!postYawCalibrationResidual || !postGyroCalibrationResidual) return null;
      return {
        calibrationWindowStartMinute: windows[0].startMinute,
        yawCalibrationDegPerMin: firstYawDrift,
        gyroCalibrationDegPerMin: firstGyroBias,
        postYawCalibrationResidual,
        postGyroCalibrationResidual,
      };
    })();
    const windowStable = windowYawDriftRangeDegPerMin === null || (
      windowYawDriftRangeDegPerMin <= Math.max(5, Math.abs(yawDriftDegPerMin) * 0.15)
      && (windowResidualRangeDegPerMin === null || windowResidualRangeDegPerMin <= Math.max(2, Math.abs(yawDriftDegPerMin) * 0.05))
    );
    const linearEnough = (rSquared === null || rSquared >= 0.995)
      && (residualToMinuteDrift === null || residualToMinuteDrift <= 0.25)
      && windowStable;

    let kind = 'mixed-or-unexplained';
    let message = `gyro平均との差 ${differenceDegPerMin.toFixed(2)}°/min`;
    if (averageExplained && linearEnough) {
      kind = 'gyro-bias-dominant';
      message = `平均ドリフトはgyroバイアスで説明可能（残差 ${differenceDegPerMin.toFixed(2)}°/min）`;
    } else if (averageExplained) {
      kind = 'gyro-bias-time-varying';
      message = `平均値はgyroバイアスと整合するが時間変動あり（残差 ${differenceDegPerMin.toFixed(2)}°/min）`;
    } else if (!sameDirection) {
      kind = 'direction-mismatch';
      message = `yawとgyroバイアスの方向が不一致（差 ${differenceDegPerMin.toFixed(2)}°/min）`;
    }

    return {
      kind,
      status: 'info',
      yawDriftDegPerMin,
      gyroBiasDegPerMin,
      yawToGyroScaleRatio,
      differenceDegPerMin,
      toleranceDegPerMin,
      sameDirection,
      averageExplained,
      linearEnough,
      residualToMinuteDrift,
      rSquared,
      windowCount: windows.length,
      windowStable,
      windowYawDriftRangeDegPerMin,
      windowGyroBiasRangeDegPerMin,
      windowResidualRangeDegPerMin,
      fixedCalibration,
      differenceSource: integratedResidual === null ? 'mean-gyro' : 'host-time-integrated-gyro',
      message
    };
  }

  function evaluateStatic(snapshot) {
    const quat = evaluateQuaternion(snapshot, { ignoreCommunication: true });
    const drift = evaluateYawDrift(snapshot);
    const expected = finite(snapshot?.expectedSampleRateHz) || expectedSampleRate(snapshot?.mode);
    const effectiveSampleRateHz = finite(snapshot?.observedSampleRateHz) || finite(snapshot?.sampleRateHz) || 0;
    let rateStatus = 'pass';
    if (effectiveSampleRateHz < expected * 0.5) rateStatus = 'fail';
    else if (effectiveSampleRateHz < expected * 0.8) rateStatus = 'warn';
    const eulerStatus = finite(snapshot?.presence?.euler) > 0 ? 'pass' : 'fail';
    const driftStatus = drift.status === 'warn' ? 'warn' : 'pass';
    const order = { pass: 0, info: 1, warn: 2, fail: 3 };
    const status = [quat.status, eulerStatus, driftStatus]
      .reduce((worst, candidate) => order[candidate] > order[worst] ? candidate : worst, 'pass');
    return {
      snapshot,
      status,
      quat,
      drift,
      eulerStatus,
      rateStatus,
      communicationExcluded: true,
    };
  }

  function evaluateStreamingMode(snapshot) {
    if (!snapshot) return { status: 'fail', message: '測定結果なし' };
    const hasSensors = snapshot.presence.press > 0 && snapshot.presence.acc > 0 && snapshot.presence.gyro > 0;
    const quatStopped = snapshot.presence.quat === 0 && snapshot.presence.euler === 0;
    const expected = snapshot.expectedSampleRateHz || expectedSampleRate(snapshot.mode);
    let sampleRateStatus = 'pass';
    if (snapshot.sampleRateHz < expected * 0.8) sampleRateStatus = 'fail';
    else if (snapshot.sampleRateHz < expected * 0.9) sampleRateStatus = 'warn';

    const communication = evaluateCommunication(snapshot);
    const statusOrder = { pass: 0, warn: 1, fail: 2 };
    const statuses = [
      hasSensors ? 'pass' : 'fail',
      quatStopped ? 'pass' : 'fail',
      sampleRateStatus,
      communication.status
    ];
    const status = statuses.reduce((worst, current) => (
      statusOrder[current] > statusOrder[worst] ? current : worst
    ), 'pass');
    return {
      status,
      hasSensors,
      quatStopped,
      sampleRateStatus,
      communication,
      message: `sample ${snapshot.sampleRateHz.toFixed(1)}Hz / loss ${snapshot.packetLossPercent.toFixed(2)}%`
    };
  }

  function compareCommunicationRuns(firstOrRuns, second) {
    const input = Array.isArray(firstOrRuns) ? firstOrRuns : [firstOrRuns, second];
    const runs = input.filter(run => run && Array.isArray(run.devices) && run.devices.length >= 2);
    if (runs.length < 2) {
      return { kind: 'awaiting', status: 'info', message: '単体ベースラインの後、案内どおり接続条件を変えた2台同時測定を3回行ってください。' };
    }

    const signatures = new Set(runs.map(run => run.devices
      .map(item => `${item.deviceId}:${item.side}:${item.connectionRank ?? '-'}`)
      .sort()
      .join('|')));
    if (signatures.size < 2) {
      return { kind: 'awaiting-change', status: 'info', message: '比較待ち: 接続枠・実物・接続順が前回と同じです。次の手順へ進んでください。' };
    }

    const highest = devices => devices.reduce((worst, item) => (
      !worst || item.packetLossPercent > worst.packetLossPercent ? item : worst
    ), null);
    const worst = runs.map(run => highest(run.devices));

    if (runs.every(run => run.devices.every(item => item.packetLossPercent <= 1))) {
      return { kind: 'not-reproduced', status: 'pass', message: '全テストで欠損率1%以下となり、高欠損は再現しませんでした。' };
    }
    if (worst.some(item => item.packetLossPercent <= 5)) {
      return { kind: 'intermittent', status: 'warn', message: '高欠損の有無が測定ごとに変わりました。距離・干渉・端末負荷を固定して再試行してください。' };
    }

    const common = [];
    if (worst.every(item => item.side === worst[0].side)) common.push('physical');
    if (worst.every(item => item.deviceId === worst[0].deviceId)) common.push('slot');
    const connectionRankKnown = worst.every(item => Number.isInteger(item.connectionRank));
    if (connectionRankKnown && worst.every(item => item.connectionRank === worst[0].connectionRank)) common.push('order');

    if (common.length > 1) {
      const labels = common.map(kind => ({ physical: '実物側', slot: 'DEVICE枠', order: '接続順' })[kind]);
      return {
        kind: 'confounded',
        status: 'warn',
        message: `高欠損は${labels.join('と')}の両方に一致しており、まだ分離できません。3回手順を最後まで実行してください。`
      };
    }
    if (common[0] === 'physical') {
      return { kind: 'follows-physical-side', status: 'warn', message: `高欠損が実物の${worst[0].side}側だけに追従しました。デバイス固有・電波条件を優先して調査してください。` };
    }
    if (common[0] === 'slot') {
      if (!connectionRankKnown) {
        return { kind: 'slot-or-order-unknown', status: 'warn', message: `高欠損はDEVICE ${worst[0].deviceId}枠と一致しましたが、接続順が未記録のため分離できません。新しい3回手順で再測定してください。` };
      }
      return { kind: 'follows-slot', status: 'warn', message: `高欠損がDEVICE ${worst[0].deviceId}枠だけに追従しました。ページの枠別受信処理を優先して調査してください。` };
    }
    if (common[0] === 'order') {
      return { kind: 'follows-connection-order', status: 'warn', message: `高欠損が${worst[0].connectionRank}番目の接続だけに追従しました。ブラウザ・OSの複数BLE接続処理を優先して調査してください。` };
    }
    return { kind: 'intermittent', status: 'warn', message: '高欠損が実物側・DEVICE枠・接続順のいずれにも一貫して追従しません。干渉・端末負荷を固定して再試行してください。' };
  }

  function evaluateQuaternion(snapshot, options = {}) {
    const norm = snapshot && snapshot.norm;
    if (!norm || norm.count === 0) {
      return { status: 'fail', message: 'quaternionデータなし' };
    }
    const scaleOk = norm.mean >= 0.99 && norm.mean <= 1.01 && norm.min >= 0.98 && norm.max <= 1.02;
    if (!scaleOk) {
      return { status: 'fail', message: `norm範囲 ${norm.min.toFixed(5)}〜${norm.max.toFixed(5)}` };
    }
    if (!options.ignoreCommunication && snapshot.packetLossPercent > 5) {
      return { status: 'warn', message: `norm正常、欠損率 ${snapshot.packetLossPercent.toFixed(2)}%` };
    }
    return { status: 'pass', message: `norm平均 ${norm.mean.toFixed(6)}` };
  }

  return {
    ADAPTIVE_BIAS_DEFAULTS,
    AdaptiveYawBiasTracker,
    AngleTracker,
    DeviceAccumulator,
    DriftWindowAccumulator,
    GapCoincidenceTracker,
    LinearRegression,
    RunningStats,
    compareCommunicationRuns,
    connectionCoverage,
    evaluateCommunication,
    evaluateQuaternion,
    evaluateStatic,
    evaluateStreamingMode,
    evaluateYawDrift,
    expectedPacketRate,
    expectedSampleRate,
    quatNorm,
    quaternionToEuler,
    radToDeg,
    sampleIntervalSeconds,
    serialGap,
    wrappedDeltaDegrees,
    yawRateFromGyroBias,
  };
});
