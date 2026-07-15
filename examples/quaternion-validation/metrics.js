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

  function expectedPacketRate() {
    return 50;
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
      this.previousGyroZ = null;
      this.previousGyroAtMs = null;
    }

    addFrame(frame, hostTimestampMs) {
      if (!frame) return null;
      const now = finite(hostTimestampMs);
      const elapsedMs = Math.max(0, (now === null ? this.startAtMs : now) - this.startAtMs);
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

      if (frame.euler && finite(frame.euler.yaw) !== null) {
        this.yaw.push(radToDeg(frame.euler.yaw), elapsedMs);
      }

      if (frame.gyro && finite(frame.gyro.z) !== null) {
        const gyroZ = Number(frame.gyro.z);
        this.gyroZ.push(gyroZ);
        this.gyroZIntegralDeg += gyroZ * sampleIntervalSeconds(frame.mode || this.mode);
        if (now !== null && this.previousGyroAtMs !== null && this.previousGyroZ !== null) {
          const elapsedSeconds = Math.max(0, Math.min(1000, now - this.previousGyroAtMs)) / 1000;
          this.gyroZHostTimeIntegralDeg += this.previousGyroZ * elapsedSeconds;
        }
        this.previousGyroZ = gyroZ;
        this.previousGyroAtMs = now;
      }

      return {
        elapsedMs,
        norm,
        yawUnwrappedDeg: this.yaw.current,
        packetGap,
        packetIntervalMs,
        gyroZIntegralDeg: this.gyroZIntegralDeg,
        gyroZHostTimeIntegralDeg: this.gyroZHostTimeIntegralDeg
      };
    }

    snapshot(endAtMs) {
      const end = finite(endAtMs);
      const durationMs = Math.max(0, (end === null ? this.startAtMs : end) - this.startAtMs);
      const expectedPackets = this.receivedPackets + this.lostPackets;
      const yaw = this.yaw.snapshot();
      const gyroZ = this.gyroZ.snapshot();
      return {
        deviceId: this.deviceId,
        mode: this.mode,
        durationMs,
        samples: this.samples,
        sampleRateHz: durationMs > 0 ? this.samples * 1000 / durationMs : 0,
        expectedSampleRateHz: expectedSampleRate(this.mode),
        receivedPackets: this.receivedPackets,
        packetRateHz: durationMs > 0 ? this.receivedPackets * 1000 / durationMs : 0,
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
        gyroZ,
        gyroZBiasDegPerMin: gyroZ.mean === null ? null : gyroZ.mean * 60,
        yawMinusGyroDegPerMin: yaw.driftDegPerMin === null || gyroZ.mean === null ? null : yaw.driftDegPerMin - gyroZ.mean * 60,
        gyroZIntegralDeg: this.gyroZIntegralDeg,
        gyroZHostTimeIntegralDeg: this.gyroZHostTimeIntegralDeg
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

  function compareCommunicationRuns(first, second) {
    if (!first || !second) {
      return { kind: 'awaiting', status: 'info', message: '通信診断を1回実行後、接続枠を左右逆にしてもう1回実行してください。' };
    }
    const firstDevices = first.devices || [];
    const secondDevices = second.devices || [];
    if (firstDevices.length < 2 || secondDevices.length < 2) {
      return { kind: 'insufficient', status: 'warn', message: '左右2台の結果が必要です。' };
    }

    const firstBySlot = new Map(firstDevices.map(item => [item.deviceId, item]));
    const secondBySlot = new Map(secondDevices.map(item => [item.deviceId, item]));
    const slots = Array.from(firstBySlot.keys()).filter(slot => secondBySlot.has(slot));
    const reversed = slots.length === 2 && slots.every(slot => firstBySlot.get(slot).side !== secondBySlot.get(slot).side);
    if (!reversed) {
      return { kind: 'awaiting-swap', status: 'info', message: '比較待ち: いったん切断し、L/RをDEVICE 0/1の逆の枠へ接続して再実行してください。' };
    }

    const highest = devices => devices.reduce((worst, item) => (
      !worst || item.packetLossPercent > worst.packetLossPercent ? item : worst
    ), null);
    const firstWorst = highest(firstDevices);
    const secondWorst = highest(secondDevices);
    const firstHigh = firstWorst.packetLossPercent > 5;
    const secondHigh = secondWorst.packetLossPercent > 5;

    if (firstDevices.every(item => item.packetLossPercent <= 1) && secondDevices.every(item => item.packetLossPercent <= 1)) {
      return { kind: 'not-reproduced', status: 'pass', message: '両テストとも欠損率1%以下で、高欠損は再現しませんでした。' };
    }
    if (firstHigh && secondHigh && firstWorst.side === secondWorst.side) {
      return { kind: 'follows-physical-side', status: 'warn', message: `高欠損が実物の${firstWorst.side}側に追従しました。デバイス固有・電波条件を優先して調査してください。` };
    }
    if (firstHigh && secondHigh && firstWorst.deviceId === secondWorst.deviceId) {
      return { kind: 'follows-slot', status: 'warn', message: `高欠損がDEVICE ${firstWorst.deviceId}枠に追従しました。接続順・ブラウザ受信処理を優先して調査してください。` };
    }
    return { kind: 'intermittent', status: 'warn', message: '欠損傾向が2回で一貫しません。距離・干渉・端末負荷を固定して再試行してください。' };
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
    compareCommunicationRuns,
    evaluateCommunication,
    evaluateQuaternion,
    expectedPacketRate,
    expectedSampleRate,
    quatNorm,
    radToDeg,
    sampleIntervalSeconds,
    serialGap,
    wrappedDeltaDegrees
  };
});
