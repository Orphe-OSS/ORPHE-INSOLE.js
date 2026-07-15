/* global OrpheInsole, OrpheInsoleSimulator, OrpheQuaternionValidationMetrics */

(function () {
  'use strict';

  const {
    DeviceAccumulator,
    GapCoincidenceTracker,
    compareCommunicationRuns,
    connectionCoverage,
    evaluateCommunication,
    evaluateQuaternion,
    evaluateStatic,
    evaluateStreamingMode,
    quatNorm,
    quaternionToEuler,
    radToDeg,
  } = OrpheQuaternionValidationMetrics;

  const params = new URLSearchParams(window.location.search);
  const simulatorMode = params.get('sim') === '1';
  const DeviceClass = simulatorMode ? OrpheInsoleSimulator : OrpheInsole;
  const devices = [new DeviceClass(0), new DeviceClass(1)];
  const ACCELEROMETER_RANGES = [2, 4, 8, 16];
  const GYROSCOPE_RANGES = [250, 500, 1000, 2000];
  const connected = [false, false];
  const deviceInfo = [null, null];
  const pending = [{}, {}];
  const live = [createLiveState(0), createLiveState(1)];
  const results = [];
  const connectionRank = [null, null];
  let connectionSequence = 0;
  let activeRun = null;
  let autoSmokeScheduled = false;
  let exclusiveBusy = false;

  const $ = id => document.getElementById(id);

  function createLiveState(deviceId, mode = 4) {
    return {
      accumulator: new DeviceAccumulator(deviceId, performance.now(), mode),
      latestFrame: null,
      latestAnalysis: null,
      lastFrameAt: 0,
    };
  }

  function resetLiveState(deviceId, mode) {
    live[deviceId] = createLiveState(deviceId, mode);
  }

  function sideFor(deviceId) {
    const info = deviceInfo[deviceId] || devices[deviceId].device_information;
    if (!info || typeof info.mount_position === 'undefined') return '-';
    return (Number(info.mount_position) & 1) === 1 ? 'R' : 'L';
  }

  function statusRank(status) {
    return { pass: 0, info: 1, warn: 2, fail: 3 }[status] ?? 1;
  }

  function worstStatus(statuses) {
    return statuses.reduce((worst, status) => statusRank(status) > statusRank(worst) ? status : worst, 'pass');
  }

  function format(value, digits = 2, fallback = '-') {
    return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : fallback;
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(Number(milliseconds) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function fileStamp() {
    const date = new Date();
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function log(message, level = 'info') {
    const row = document.createElement('div');
    row.className = `log-line ${level}`;
    row.textContent = `${new Date().toLocaleTimeString()}  ${message}`;
    $('eventLog').appendChild(row);
    $('eventLog').scrollTop = $('eventLog').scrollHeight;
  }

  function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  function connectedIds() {
    return connected.map((value, index) => value ? index : null).filter(value => value !== null);
  }

  function notePending(deviceId, sample) {
    if (!sample) return;
    if (sample.timestamp !== undefined) pending[deviceId].timestamp = sample.timestamp;
    if (sample.serial_number !== undefined) pending[deviceId].serial = sample.serial_number;
    if (sample.packet_number !== undefined) pending[deviceId].packetNumber = sample.packet_number;
  }

  function copyVector(sample) {
    return sample ? { x: Number(sample.x), y: Number(sample.y), z: Number(sample.z) } : null;
  }

  function copyQuat(sample) {
    return sample ? { w: Number(sample.w), x: Number(sample.x), y: Number(sample.y), z: Number(sample.z) } : null;
  }

  function copyEuler(sample) {
    return sample ? { pitch: Number(sample.pitch), roll: Number(sample.roll), yaw: Number(sample.yaw) } : null;
  }

  function selectedReceivePath() {
    return simulatorMode ? 'callbacks' : $('receivePath').value;
  }

  function eulerFromQuaternion(quat) {
    return copyEuler(quaternionToEuler(quat));
  }

  function sensorRangesFor(deviceId) {
    const info = deviceInfo[deviceId] || devices[deviceId].device_information;
    const accCode = Number(info && info.range && info.range.acc);
    const gyroCode = Number(info && info.range && info.range.gyro);
    return {
      accRange: ACCELEROMETER_RANGES[accCode] || 16,
      gyroRange: GYROSCOPE_RANGES[gyroCode] || 2000,
    };
  }

  function recordFrame(deviceId, frame) {
    const now = performance.now();
    live[deviceId].latestFrame = frame;
    live[deviceId].latestAnalysis = live[deviceId].accumulator.addFrame(frame, now);
    live[deviceId].lastFrameAt = now;

    if (activeRun && activeRun.accumulators[deviceId]) {
      const analysis = activeRun.accumulators[deviceId].addFrame(frame, now);
      if (activeRun.gapCoincidence && analysis && analysis.packetGap > 0) {
        activeRun.gapCoincidence.add(deviceId, now);
      }
      if (activeRun.logger) activeRun.logger.append(activeRun, frame, analysis);
    }
  }

  function commitFrame(deviceId) {
    const current = pending[deviceId];
    const frame = {
      device: deviceId,
      side: sideFor(deviceId),
      mode: Number(devices[deviceId].streaming_mode) || 4,
      timestamp: current.timestamp ?? null,
      serial: current.serial ?? null,
      packetNumber: current.packetNumber ?? null,
      press: current.press || null,
      acc: current.acc || null,
      gyro: current.gyro || null,
      quat: current.quat || null,
      euler: current.euler || null,
      hostEpochMs: Date.now(),
    };
    pending[deviceId] = {};
    recordFrame(deviceId, frame);
  }

  function recordParsedPacket(deviceId, data, uuid) {
    if (uuid !== 'SENSOR_VALUES') return;
    const parsed = OrpheInsole.parseSensorValues(data, sensorRangesFor(deviceId));
    if (!parsed) return;
    parsed.samples.forEach(sample => {
      recordFrame(deviceId, {
        device: deviceId,
        side: sideFor(deviceId),
        mode: Number(devices[deviceId].streaming_mode) || 4,
        timestamp: sample.timestamp ?? null,
        serial: sample.serial_number ?? parsed.serial_number ?? null,
        packetNumber: sample.packet_number ?? null,
        press: sample.press && Array.isArray(sample.press.values) ? sample.press.values.slice(0, 6) : null,
        acc: copyVector(sample.converted_acc),
        gyro: copyVector(sample.converted_gyro),
        quat: copyQuat(sample.quat),
        euler: eulerFromQuaternion(sample.quat),
        hostEpochMs: Date.now(),
      });
    });
  }

  function configureReceivePath(device, deviceId) {
    if (selectedReceivePath() === 'raw') {
      device.gotData = function (data, uuid) {
        recordParsedPacket(deviceId, data, uuid);
      };
    } else {
      device.gotData = device.defaultGotData;
    }
  }

  function installCallbacks(device, deviceId) {
    device.setup();
    device.debug = false;

    device.gotQuat = function (quat) {
      notePending(deviceId, quat);
      pending[deviceId].quat = copyQuat(quat);
      pending[deviceId].euler = eulerFromQuaternion(quat);
    };
    device.gotEuler = function (euler) {
      notePending(deviceId, euler);
      pending[deviceId].euler = copyEuler(euler);
      if (Number(device.streaming_mode) === 1 && simulatorMode) commitFrame(deviceId);
    };
    device.gotConvertedAcc = function (acc) {
      notePending(deviceId, acc);
      pending[deviceId].acc = copyVector(acc);
    };
    device.gotConvertedGyro = function (gyro) {
      notePending(deviceId, gyro);
      pending[deviceId].gyro = copyVector(gyro);
      if (Number(device.streaming_mode) === 1 && !simulatorMode) commitFrame(deviceId);
    };
    device.gotPress = function (press) {
      notePending(deviceId, press);
      pending[deviceId].press = Array.isArray(press.values) ? press.values.slice(0, 6) : null;
      commitFrame(deviceId);
    };
    device.lostData = function () {
      // 欠損はframeのserial_numberから集計する。Consoleへ大量出力しない。
    };
    device.onConnect = function () {
      connected[deviceId] = true;
      if (activeRun && activeRun.disconnectFinishTimer) {
        clearTimeout(activeRun.disconnectFinishTimer);
        activeRun.disconnectFinishTimer = null;
      }
      updateConnectionCard(deviceId);
    };
    device.onDisconnect = function () {
      connected[deviceId] = false;
      if (activeRun && activeRun.deviceIds.includes(deviceId)) {
        activeRun.interruptions.push({
          type: 'disconnect',
          deviceId,
          side: sideFor(deviceId),
          at: new Date().toISOString(),
          elapsedMs: performance.now() - activeRun.startedAt,
        });
        if (activeRun.deviceIds.every(id => !connected[id]) && !activeRun.disconnectFinishTimer) {
          activeRun.disconnectFinishTimer = setTimeout(() => {
            if (activeRun) activeRun.disconnectFinishTimer = null;
            if (activeRun && activeRun.deviceIds.every(id => !connected[id])) void finishActiveRun('all-devices-disconnected');
          }, 10000);
        }
      }
      updateConnectionCard(deviceId);
      updateControls();
      log(`DEVICE ${deviceId} が切断されました`, 'warn');
    };
    device.onReconnectSuccess = function () {
      connected[deviceId] = true;
      if (activeRun && activeRun.deviceIds.includes(deviceId)) {
        activeRun.interruptions.push({
          type: 'reconnect',
          deviceId,
          side: sideFor(deviceId),
          at: new Date().toISOString(),
          elapsedMs: performance.now() - activeRun.startedAt,
        });
        if (activeRun.disconnectFinishTimer) {
          clearTimeout(activeRun.disconnectFinishTimer);
          activeRun.disconnectFinishTimer = null;
        }
      }
      if (!Number.isInteger(connectionRank[deviceId])) {
        connectionSequence += 1;
        connectionRank[deviceId] = connectionSequence;
      }
      updateConnectionCard(deviceId);
      updateControls();
      log(`DEVICE ${deviceId} が自動再接続しました`, 'pass');
    };
    device.onError = function (error) {
      log(`DEVICE ${deviceId} error: ${error && error.message ? error.message : error}`, 'fail');
    };
  }

  devices.forEach(installCallbacks);

  async function connectDevice(deviceId) {
    if (activeRun || exclusiveBusy || connected[deviceId]) return;
    const button = $(`connect${deviceId}`);
    button.disabled = true;
    button.textContent = simulatorMode ? '起動中…' : '選択中…';
    try {
      configureReceivePath(devices[deviceId], deviceId);
      const options = simulatorMode
        ? { streamingMode: 4, preset: 'stand' }
        : { streamingMode: 4, autoReconnect: true, forceDeviceSelection: true };
      await devices[deviceId].begin('SENSOR_VALUES', options);

      if (!simulatorMode) {
        const other = 1 - deviceId;
        const currentBluetooth = devices[deviceId].bluetoothDevice;
        const otherBluetooth = devices[other].bluetoothDevice;
        if (connected[other] && currentBluetooth && otherBluetooth && currentBluetooth.id === otherBluetooth.id) {
          devices[deviceId].reset();
          throw new Error('同じINSOLEが2枠で選択されました。別のデバイスを選択してください。');
        }
      }

      deviceInfo[deviceId] = await devices[deviceId].getDeviceInformation();
      connected[deviceId] = true;
      if (!Number.isInteger(connectionRank[deviceId])) {
        connectionSequence += 1;
        connectionRank[deviceId] = connectionSequence;
      }
      pending[deviceId] = {};
      resetLiveState(deviceId, 4);
      const ranges = sensorRangesFor(deviceId);
      log(`DEVICE ${deviceId} 接続完了: side=${sideFor(deviceId)} / 接続順=${connectionRank[deviceId]} / mode 4 / ${selectedReceivePath()} / acc ±${ranges.accRange}g / gyro ±${ranges.gyroRange}°/s`, 'pass');
      updateConnectionCard(deviceId);
      updateControls();
      scheduleAutoSmoke();
    } catch (error) {
      connected[deviceId] = false;
      log(`DEVICE ${deviceId} 接続失敗: ${error && error.message ? error.message : error}`, 'fail');
      updateConnectionCard(deviceId);
      updateControls();
    }
  }

  function disconnectAll() {
    if (activeRun || exclusiveBusy) return;
    devices.forEach((device, deviceId) => {
      if (connected[deviceId]) device.reset();
      connected[deviceId] = false;
      deviceInfo[deviceId] = null;
      connectionRank[deviceId] = null;
      pending[deviceId] = {};
      resetLiveState(deviceId, 4);
      updateConnectionCard(deviceId);
    });
    connectionSequence = 0;
    autoSmokeScheduled = false;
    updateControls();
    log('全デバイスを切断しました');
  }

  function updateConnectionCard(deviceId) {
    const card = $(`connectCard${deviceId}`);
    const button = $(`connect${deviceId}`);
    const detail = $(`connectDetail${deviceId}`);
    card.classList.toggle('connected', connected[deviceId]);
    if (connected[deviceId]) {
      button.textContent = '接続済み';
      button.disabled = true;
      const battery = deviceInfo[deviceId] && deviceInfo[deviceId].battery;
      detail.textContent = `${sideFor(deviceId)} / 接続順 ${connectionRank[deviceId] || '-'} / mode ${devices[deviceId].streaming_mode || 4}${battery !== undefined ? ` / battery ${battery}` : ''}`;
    } else {
      button.textContent = simulatorMode ? 'シミュレータ起動' : 'BLE接続';
      button.disabled = Boolean(activeRun) || exclusiveBusy;
      detail.textContent = '未接続';
    }
  }

  class CsvStreamLogger {
    constructor(writable) {
      this.writable = writable;
      this.buffer = [];
      this.queue = Promise.resolve();
      this.error = null;
      this.closed = false;
      this.flushTimer = null;
    }

    async start() {
      const header = [
        'test', 'device', 'side', 'mode', 'host_timestamp_ms', 'device_timestamp', 'serial_number', 'packet_number',
        'press0', 'press1', 'press2', 'press3', 'press4', 'press5',
        'acc_x', 'acc_y', 'acc_z', 'gyro_x', 'gyro_y', 'gyro_z',
        'quat_w', 'quat_x', 'quat_y', 'quat_z', 'quat_norm',
        'euler_pitch', 'euler_roll', 'euler_yaw', 'yaw_unwrapped_deg',
        'packet_gap', 'host_packet_interval_ms', 'gyro_integral_nominal_deg', 'gyro_integral_host_time_deg', 'gyro_referenced_yaw_deg',
        'gyro_integral_device_time_deg', 'gyro_referenced_yaw_device_time_deg'
      ].join(',') + '\n';
      await this.writable.write(header);
      this.flushTimer = setInterval(() => this.flush(), 1000);
    }

    append(run, frame, analysis) {
      if (this.closed || this.error) return;
      const value = item => item !== null && item !== undefined && item !== '' && Number.isFinite(Number(item)) ? String(Number(item)) : '';
      const press = frame.press || [];
      const row = [
        run.type, frame.device, frame.side, frame.mode, frame.hostEpochMs, frame.timestamp, frame.serial, frame.packetNumber,
        ...[0, 1, 2, 3, 4, 5].map(index => value(press[index])),
        value(frame.acc && frame.acc.x), value(frame.acc && frame.acc.y), value(frame.acc && frame.acc.z),
        value(frame.gyro && frame.gyro.x), value(frame.gyro && frame.gyro.y), value(frame.gyro && frame.gyro.z),
        value(frame.quat && frame.quat.w), value(frame.quat && frame.quat.x), value(frame.quat && frame.quat.y), value(frame.quat && frame.quat.z),
        value(analysis && analysis.norm),
        value(frame.euler && frame.euler.pitch), value(frame.euler && frame.euler.roll), value(frame.euler && frame.euler.yaw),
        value(analysis && analysis.yawUnwrappedDeg),
        value(analysis && analysis.packetGap), value(analysis && analysis.packetIntervalMs),
        value(analysis && analysis.gyroZIntegralDeg), value(analysis && analysis.gyroZHostTimeIntegralDeg),
        value(analysis && analysis.gyroReferencedYawDeg), value(analysis && analysis.gyroZDeviceTimeIntegralDeg),
        value(analysis && analysis.gyroReferencedYawDeviceDeg)
      ].join(',') + '\n';
      this.buffer.push(row);
      if (this.buffer.length >= 500) this.flush();
    }

    flush() {
      if (this.buffer.length === 0 || this.closed || this.error) return this.queue;
      const chunk = this.buffer.join('');
      this.buffer.length = 0;
      this.queue = this.queue
        .then(() => this.writable.write(chunk))
        .catch(error => {
          this.error = error;
          log(`CSV書き込みエラー: ${error.message || error}`, 'fail');
        });
      return this.queue;
    }

    async close() {
      if (this.closed) return;
      if (this.flushTimer) clearInterval(this.flushTimer);
      await this.flush();
      await this.queue;
      this.closed = true;
      await this.writable.close();
    }
  }

  async function chooseCsvLogger(checkboxId, testType) {
    if (!$(checkboxId).checked) return null;
    if (typeof window.showSaveFilePicker !== 'function') {
      throw new Error('このChromeでは生CSVの逐次保存APIが利用できません。チェックを外して統計のみ記録してください。');
    }
    const handle = await window.showSaveFilePicker({
      suggestedName: `orphe-${testType}-${fileStamp()}.csv`,
      types: [{ description: 'CSV log', accept: { 'text/csv': ['.csv'] } }],
    });
    const logger = new CsvStreamLogger(await handle.createWritable());
    await logger.start();
    return logger;
  }

  function beginRun(options) {
    if (activeRun) throw new Error('別のテストを実行中です');
    const ids = options.deviceIds.filter(id => connected[id]);
    if (ids.length === 0) throw new Error('接続済みデバイスがありません');
    const startAt = performance.now();
    const accumulators = {};
    ids.forEach(id => {
      accumulators[id] = new DeviceAccumulator(id, startAt, Number(devices[id].streaming_mode) || options.mode || 4);
    });
    activeRun = {
      type: options.type,
      label: options.label,
      deviceIds: ids,
      startedAt: startAt,
      startedAtIso: new Date().toISOString(),
      durationMs: options.durationMs || null,
      instruction: options.instruction || '',
      metadata: options.metadata || {},
      accumulators,
      gapCoincidence: options.type === 'communication' && ids.length >= 2 ? new GapCoincidenceTracker(ids, 25) : null,
      interruptions: [],
      disconnectFinishTimer: null,
      logger: options.logger || null,
      timeout: null,
    };
    if (options.durationMs && options.autoFinish !== false) {
      activeRun.timeout = setTimeout(() => { void finishActiveRun('completed'); }, options.durationMs);
    }
    renderActiveRun();
    updateControls();
    log(`${options.label} を開始しました`);
    return activeRun;
  }

  function evaluateSnapshots(type, snapshots, metadata) {
    if (type === 'communication') {
      const evaluations = snapshots.map(snapshot => {
        const communication = evaluateCommunication(snapshot);
        return { snapshot, status: communication.status, communication };
      });
      return { status: worstStatus(evaluations.map(item => item.status)), evaluations };
    }

    if (type === 'smoke' || type === 'static') {
      const evaluations = snapshots.map(snapshot => {
        if (type === 'static') return evaluateStatic(snapshot);
        const quat = evaluateQuaternion(snapshot);
        const drift = null;
        const expected = snapshot.expectedSampleRateHz;
        const effectiveSampleRateHz = snapshot.observedSampleRateHz || snapshot.sampleRateHz;
        let rateStatus = 'pass';
        if (effectiveSampleRateHz < expected * 0.5) rateStatus = 'fail';
        else if (effectiveSampleRateHz < expected * 0.8) rateStatus = 'warn';
        const eulerStatus = snapshot.presence.euler > 0 ? 'pass' : 'fail';
        return {
          snapshot,
          status: worstStatus([quat.status, rateStatus, eulerStatus]),
          quat,
          drift,
          eulerStatus,
          rateStatus,
          communicationExcluded: false,
        };
      });
      return { status: worstStatus(evaluations.map(item => item.status)), evaluations };
    }

    if (type === 'rotation') {
      const target = Number(metadata.targetDeg);
      const evaluations = snapshots.map(snapshot => {
        const observed = Math.abs(snapshot.yaw.deltaDeg || 0);
        const errorDeg = observed - target;
        const signedGyroObservedDeg = snapshot.gyroZDeviceTimeIntegralDeg;
        const gyroObservedDeg = Math.abs(signedGyroObservedDeg || 0);
        const gyroErrorDeg = gyroObservedDeg - target;
        const tolerance = Math.max(5, target * 0.1);
        const sensorsPresent = snapshot.presence.euler > 0 && snapshot.presence.gyro > 0;
        return {
          snapshot,
          observedDeg: observed,
          signedObservedDeg: snapshot.yaw.deltaDeg,
          errorDeg,
          errorPercent: target ? Math.abs(errorDeg) * 100 / target : null,
          gyroObservedDeg,
          signedGyroObservedDeg,
          gyroErrorDeg,
          gyroErrorPercent: target ? Math.abs(gyroErrorDeg) * 100 / target : null,
          status: !sensorsPresent ? 'fail' : (Math.abs(errorDeg) <= tolerance && Math.abs(gyroErrorDeg) <= tolerance ? 'pass' : 'warn'),
        };
      });
      return { status: worstStatus(evaluations.map(item => item.status)), evaluations };
    }

    if (type === 'walk') {
      const expected = Number(metadata.loops) * 360;
      const evaluations = snapshots.map(snapshot => ({
        snapshot,
        expectedDeg: expected,
        quatErrorDeg: Math.abs(snapshot.yaw.deltaDeg || 0) - expected,
        gyroErrorDeg: Math.abs(snapshot.gyroZDeviceTimeIntegralDeg || 0) - expected,
        status: 'info',
      }));
      return { status: 'info', evaluations };
    }

    if (type === 'mode3') {
      const evaluations = snapshots.map(snapshot => {
        const streaming = evaluateStreamingMode(snapshot);
        return { snapshot, ...streaming };
      });
      return { status: worstStatus(evaluations.map(item => item.status)), evaluations };
    }

    return { status: 'info', evaluations: snapshots.map(snapshot => ({ snapshot, status: 'info' })) };
  }

  function describeResult(result) {
    const deviceDescriptions = result.evaluation.evaluations.map(item => {
      const snapshot = item.snapshot;
      const prefix = `D${snapshot.deviceId}(${snapshot.side})`;
      if (result.type === 'rotation') {
        return `${prefix}: yaw ${format(item.signedObservedDeg, 1)}° / |誤差| ${format(Math.abs(item.errorDeg), 1)}° / gyro(device time) ${format(item.signedGyroObservedDeg, 1)}° / |誤差| ${format(Math.abs(item.gyroErrorDeg), 1)}°`;
      }
      if (result.type === 'walk') {
        return `${prefix}: quat ${format(snapshot.yaw.deltaDeg, 1)}° / gyro(device time) ${format(snapshot.gyroZDeviceTimeIntegralDeg, 1)}° / 実角 ${format(item.expectedDeg, 0)}°`;
      }
      if (result.type === 'mode3') {
        return `${prefix}: sample ${format(snapshot.sampleRateHz, 1)}Hz (${item.sampleRateStatus.toUpperCase()}) / press ${snapshot.presence.press} / quat ${snapshot.presence.quat} / loss ${format(snapshot.packetLossPercent, 2)}%`;
      }
      if (result.type === 'communication') {
        return `${prefix}[${snapshot.connectionRank || '-'}番目]: sample ${format(snapshot.sampleRateHz, 1)}Hz / packet ${format(snapshot.packetRateHz, 1)}Hz / lost ${snapshot.lostPackets} (${format(snapshot.packetLossPercent, 2)}%) / gap events ${snapshot.gapEvents}, max ${snapshot.maxGap}, interval max ${format(snapshot.packetIntervalMs.max, 1)}ms`;
      }
      const driftDiagnosis = result.type === 'static' && item.drift ? ` / ${item.drift.message} / yaw÷gyro ${format(item.drift.yawToGyroScaleRatio, 4)}` : '';
      const driftWindowVariation = result.type === 'static' && item.drift && item.drift.windowCount >= 2
        ? ` / 5分窓幅 yaw ${format(item.drift.windowYawDriftRangeDegPerMin, 2)}・gyro ${format(item.drift.windowGyroBiasRangeDegPerMin, 2)}・差引後 ${format(item.drift.windowResidualRangeDegPerMin, 2)}°/min`
        : '';
      const calibrationValidation = result.type === 'static' && item.drift && item.drift.fixedCalibration
        ? ` / 初回5分固定後の最大残差 yaw補正 ${format(item.drift.fixedCalibration.postYawCalibrationResidual.maxAbsDegPerMin, 2)}・gyro補正 ${format(item.drift.fixedCalibration.postGyroCalibrationResidual.maxAbsDegPerMin, 2)}°/min`
        : '';
      return `${prefix}: norm ${format(snapshot.norm.mean, 6)} ± ${format(snapshot.norm.std, 6)} / sample ${format(snapshot.observedSampleRateHz || snapshot.sampleRateHz, 1)}Hz / completion ${format(snapshot.completionPercent, 1)}% / connected ${format(snapshot.connectionCoveragePercent, 1)}% / drift ${format(snapshot.yaw.driftDegPerMin, 2)}°/min / gyro換算 ${format(snapshot.gyroZBiasDegPerMin, 2)}°/min / residual ${format(snapshot.yaw.residualStdDeg, 3)}°${driftDiagnosis}${driftWindowVariation}${calibrationValidation} / lost ${snapshot.lostPackets} (${format(snapshot.packetLossPercent, 2)}%)`;
    }).join(' ｜ ');
    if (result.type === 'communication' && result.gapCoincidence) {
      const overlap = result.gapCoincidence.devices
        .map(item => `D${item.deviceId} ${format(item.matchedPercent, 1)}%`)
        .join(' / ');
      return `${deviceDescriptions} ｜ 同期gap(±${result.gapCoincidence.toleranceMs}ms): ${overlap}`;
    }
    return deviceDescriptions;
  }

  async function finishActiveRun(reason = 'manual') {
    if (!activeRun) return null;
    const run = activeRun;
    activeRun = null;
    if (run.timeout) clearTimeout(run.timeout);
    if (run.disconnectFinishTimer) clearTimeout(run.disconnectFinishTimer);
    const endAt = performance.now();
    const snapshots = run.deviceIds.map(deviceId => {
      const snapshot = run.accumulators[deviceId].snapshot(endAt);
      snapshot.side = sideFor(deviceId);
      snapshot.connectionRank = connectionRank[deviceId];
      snapshot.receivePath = run.metadata.receivePath || selectedReceivePath();
      Object.assign(snapshot, sensorRangesFor(deviceId));
      Object.assign(snapshot, connectionCoverage(run.interruptions, deviceId, endAt - run.startedAt));
      return snapshot;
    });

    if (run.logger) {
      try {
        await run.logger.close();
        log('生CSVログを閉じました', 'pass');
      } catch (error) {
        log(`CSV終了処理エラー: ${error.message || error}`, 'fail');
      }
    }

    const evaluation = evaluateSnapshots(run.type, snapshots, run.metadata);
    const resultStatus = run.interruptions.length ? worstStatus([evaluation.status, 'warn']) : evaluation.status;
    const result = {
      type: run.type,
      label: run.label,
      status: resultStatus,
      reason,
      startedAt: run.startedAtIso,
      endedAt: new Date().toISOString(),
      durationMs: endAt - run.startedAt,
      metadata: run.metadata,
      gapCoincidence: run.gapCoincidence ? run.gapCoincidence.snapshot() : null,
      interruptions: run.interruptions.slice(),
      devices: snapshots,
      evaluation,
    };
    results.push(result);
    log(`${run.label} 終了: ${resultStatus.toUpperCase()} — ${describeResult(result)}`, resultStatus);
    if (run.type === 'communication') renderCommunicationComparison();
    renderResults();
    renderActiveRun();
    updateControls();
    return result;
  }

  async function startSmoke(auto = false) {
    if (activeRun) return;
    const ids = connectedIds();
    if (ids.length === 0) return;
    beginRun({
      type: 'smoke',
      label: auto ? '自動10秒スモークチェック' : '10秒スモークチェック',
      deviceIds: ids,
      durationMs: 10000,
      instruction: 'そのまま動かさず、norm・受信レート・欠損率を自動確認しています。',
      metadata: { automatic: auto },
    });
  }

  function scheduleAutoSmoke() {
    if (autoSmokeScheduled || !connected.every(Boolean)) return;
    autoSmokeScheduled = true;
    setTimeout(() => {
      if (!activeRun && connected.every(Boolean)) void startSmoke(true);
    }, 1500);
  }

  async function startCommunication() {
    const ids = connectedIds();
    if (ids.length === 0) {
      log('通信診断は1台以上を接続して実行してください', 'fail');
      return;
    }
    try {
      const seconds = Math.max(10, Number($('communicationSeconds').value) || 60);
      const logger = await chooseCsvLogger('communicationRaw', 'communication');
      beginRun({
        type: 'communication',
        label: `通信診断 ${seconds}秒${ids.length === 1 ? '（単体）' : ''}`,
        deviceIds: ids,
        durationMs: seconds * 1000,
        instruction: 'デバイスとPCを動かさず、受信packet Hz・serial gap・最大連続欠損・到着間隔を測定しています。',
        metadata: {
          requestedSeconds: seconds,
          receivePath: selectedReceivePath(),
          connectionMap: ids.map(deviceId => ({ deviceId, side: sideFor(deviceId), connectionRank: connectionRank[deviceId] })),
        },
        logger,
      });
    } catch (error) {
      if (error && error.name === 'AbortError') log('CSV保存先の選択をキャンセルしました', 'warn');
      else log(`通信診断を開始できません: ${error.message || error}`, 'fail');
    }
  }

  async function startStatic() {
    try {
      const minutes = Math.max(0.1, Number($('staticMinutes').value) || 5);
      const logger = await chooseCsvLogger('staticRaw', 'static');
      beginRun({
        type: 'static',
        label: `静置テスト ${minutes}分`,
        deviceIds: connectedIds(),
        durationMs: minutes * 60000,
        instruction: '左右を机上で動かさないでください。終了時にnorm統計とyawドリフトを自動保存します。',
        metadata: { requestedMinutes: minutes },
        logger,
      });
    } catch (error) {
      if (error && error.name === 'AbortError') log('CSV保存先の選択をキャンセルしました', 'warn');
      else log(`静置テストを開始できません: ${error.message || error}`, 'fail');
    }
  }

  function selectedRotationIds() {
    const value = $('rotationDevice').value;
    if (value === 'both') return connectedIds();
    const id = Number(value);
    return connected[id] ? [id] : [];
  }

  async function startRotation() {
    try {
      const target = Number($('rotationTarget').value);
      const direction = $('rotationDirection').value;
      const logger = await chooseCsvLogger('rotationRaw', `rotation-${target}-${direction.toLowerCase()}`);
      beginRun({
        type: 'rotation',
        label: `回転 ${target}° ${direction}`,
        deviceIds: selectedRotationIds(),
        instruction: `水平を保ち、${direction === 'CW' ? '時計回り' : '反時計回り'}に${target}°回してください。到達後「目標角度に到達」を押します。`,
        metadata: { targetDeg: target, direction },
        logger,
      });
    } catch (error) {
      if (error && error.name === 'AbortError') log('CSV保存先の選択をキャンセルしました', 'warn');
      else log(`回転テストを開始できません: ${error.message || error}`, 'fail');
    }
  }

  async function startWalk() {
    try {
      const loops = Math.max(1, Math.round(Number($('walkLoops').value) || 1));
      const direction = $('walkDirection').value;
      const logger = await chooseCsvLogger('walkRaw', `walk-${loops}loop-${direction.toLowerCase()}`);
      beginRun({
        type: 'walk',
        label: `周回歩行 ${loops}周 ${direction}`,
        deviceIds: connectedIds(),
        instruction: `${direction === 'CW' ? '時計回り' : '反時計回り'}に${loops}周し、開始位置・開始方向へ戻ったら「開始位置で終了」を押してください。`,
        metadata: { loops, direction, expectedDeg: loops * 360 },
        logger,
      });
    } catch (error) {
      if (error && error.name === 'AbortError') log('CSV保存先の選択をキャンセルしました', 'warn');
      else log(`歩行テストを開始できません: ${error.message || error}`, 'fail');
    }
  }

  async function runMode3Regression() {
    if (activeRun || exclusiveBusy) return;
    const ids = connectedIds();
    if (ids.length === 0) return;
    const seconds = Math.max(5, Number($('mode3Seconds').value) || 15);
    exclusiveBusy = true;
    updateControls();
    try {
      log('mode 3へ切り替えています…');
      await Promise.all(ids.map(id => devices[id].setDataStreamingMode(3)));
      ids.forEach(id => {
        pending[id] = {};
        resetLiveState(id, 3);
      });
      await wait(700);
      beginRun({
        type: 'mode3',
        label: `200Hz回帰 ${seconds}秒`,
        deviceIds: ids,
        durationMs: seconds * 1000,
        autoFinish: false,
        mode: 3,
        instruction: 'mode 3でacc・gyro・pressの受信とquat停止を自動確認しています。終了後はmode 4へ戻します。',
        metadata: { requestedSeconds: seconds },
      });
      await wait(seconds * 1000);
      if (activeRun && activeRun.type === 'mode3') await finishActiveRun('completed');
    } catch (error) {
      log(`mode 3回帰エラー: ${error.message || error}`, 'fail');
      if (activeRun && activeRun.type === 'mode3') await finishActiveRun('error');
    } finally {
      try {
        await Promise.all(ids.filter(id => connected[id]).map(id => devices[id].setDataStreamingMode(4)));
        ids.forEach(id => {
          pending[id] = {};
          resetLiveState(id, 4);
        });
        log('mode 4へ復帰しました', 'pass');
      } catch (error) {
        log(`mode 4復帰エラー: ${error.message || error}`, 'fail');
      }
      exclusiveBusy = false;
      updateControls();
    }
  }

  function updateControls() {
    const ids = connectedIds();
    const any = ids.length > 0;
    const running = Boolean(activeRun);
    const busy = running || exclusiveBusy;
    $('disconnectAll').disabled = !any || busy;
    $('runSmoke').disabled = !any || busy;
    $('startCommunication').disabled = !any || busy;
    $('startStatic').disabled = !any || busy;
    $('startRotation').disabled = !any || busy;
    $('startWalk').disabled = !any || busy;
    $('runMode3').disabled = !any || busy;
    $('finishRotation').disabled = !activeRun || activeRun.type !== 'rotation';
    $('finishWalk').disabled = !activeRun || activeRun.type !== 'walk';
    $('stopActive').disabled = !running || (activeRun && activeRun.type === 'mode3');
    $('downloadJson').disabled = results.length === 0;
    $('downloadMarkdown').disabled = results.length === 0;
    $('clearResults').disabled = results.length === 0 || running;
    $('receivePath').disabled = any || busy || simulatorMode;
    [0, 1].forEach(updateConnectionCard);

    $('globalStatus').textContent = busy ? 'テスト実行中' : (ids.length === 2 ? '左右接続済み' : (ids.length === 1 ? '1台接続済み' : '接続待ち'));
    $('globalStatus').className = `badge ${busy || ids.length === 2 ? 'pass' : 'neutral'}`;
  }

  function initLiveRows() {
    const tbody = $('liveMetrics');
    tbody.innerHTML = '';
    [0, 1].forEach(deviceId => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>DEVICE ${deviceId}</strong><small>INSOLE 0${deviceId + 1}</small></td>
        <td id="liveStatus${deviceId}">未接続</td>
        <td id="liveSide${deviceId}">-</td>
        <td id="liveMode${deviceId}">-</td>
        <td id="liveRate${deviceId}">-</td>
        <td id="liveNorm${deviceId}">-</td>
        <td id="liveYaw${deviceId}">-</td>
        <td id="liveDrift${deviceId}">-</td>
        <td id="liveGyro${deviceId}">-</td>
        <td id="liveGap${deviceId}">-</td>
        <td id="liveLoss${deviceId}">-</td>`;
      tbody.appendChild(row);
    });
  }

  function renderLive() {
    const now = performance.now();
    [0, 1].forEach(deviceId => {
      const isLive = connected[deviceId] && now - live[deviceId].lastFrameAt < 1500;
      const snapshot = live[deviceId].accumulator.snapshot(now);
      const latest = live[deviceId].latestFrame;
      const currentNorm = latest ? quatNorm(latest.quat) : null;
      const currentYaw = latest && latest.euler ? radToDeg(latest.euler.yaw) : null;
      $(`liveStatus${deviceId}`).textContent = connected[deviceId] ? (isLive ? 'LIVE' : '待機') : '未接続';
      $(`liveSide${deviceId}`).textContent = sideFor(deviceId);
      $(`liveMode${deviceId}`).textContent = connected[deviceId] ? String(devices[deviceId].streaming_mode || '-') : '-';
      $(`liveRate${deviceId}`).textContent = connected[deviceId] ? `sample ${format(snapshot.sampleRateHz, 1)} / packet ${format(snapshot.packetRateHz, 1)} Hz` : '-';
      $(`liveNorm${deviceId}`).textContent = currentNorm === null ? '-' : `${format(currentNorm, 6)} / μ ${format(snapshot.norm.mean, 6)}`;
      $(`liveYaw${deviceId}`).textContent = currentYaw === null ? '-' : `${format(currentYaw, 1)}° / unwrap ${format(snapshot.yaw.endDeg, 1)}°`;
      $(`liveDrift${deviceId}`).textContent = snapshot.yaw.driftDegPerMin === null ? '-' : `${format(snapshot.yaw.driftDegPerMin, 2)}°/min / residual ${format(snapshot.yaw.residualStdDeg, 3)}°`;
      $(`liveGyro${deviceId}`).textContent = snapshot.gyroZ.mean === null ? '-' : `μ ${format(snapshot.gyroZ.mean, 4)}°/s / ×60 ${format(snapshot.gyroZBiasDegPerMin, 2)}°/min`;
      $(`liveGap${deviceId}`).textContent = connected[deviceId] ? `events ${snapshot.gapEvents} / max ${snapshot.maxGap} / interval max ${format(snapshot.packetIntervalMs.max, 1)}ms` : '-';
      $(`liveLoss${deviceId}`).textContent = connected[deviceId] ? `${snapshot.lostPackets}/${snapshot.receivedPackets + snapshot.lostPackets} (${format(snapshot.packetLossPercent, 2)}%)` : '-';
    });
  }

  function renderActiveRun() {
    if (!activeRun) {
      $('activeTitle').textContent = 'テスト待機中';
      $('activeInstruction').textContent = connectedIds().length ? '実行するテストを選んでください。ライブ診断は常時継続しています。' : '左右を接続してください。';
      $('activeProgress').value = 0;
      $('activeProgress').max = 1;
      $('activeElapsed').textContent = '00:00';
      return;
    }
    const elapsed = performance.now() - activeRun.startedAt;
    $('activeTitle').textContent = activeRun.label;
    $('activeInstruction').textContent = activeRun.instruction;
    $('activeProgress').max = activeRun.durationMs || 1;
    $('activeProgress').value = activeRun.durationMs ? Math.min(elapsed, activeRun.durationMs) : 1;
    $('activeElapsed').textContent = activeRun.durationMs
      ? `${formatDuration(elapsed)} / ${formatDuration(activeRun.durationMs)}`
      : formatDuration(elapsed);
  }

  function renderResults() {
    const body = $('resultsBody');
    body.innerHTML = '';
    if (results.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.className = 'empty';
      cell.textContent = 'まだ結果はありません';
      row.appendChild(cell);
      body.appendChild(row);
    } else {
      results.slice().reverse().forEach(result => {
        const row = document.createElement('tr');
        const values = [
          new Date(result.startedAt).toLocaleString(),
          result.label,
          result.status.toUpperCase(),
          describeResult(result),
        ];
        values.forEach((value, index) => {
          const cell = document.createElement('td');
          cell.textContent = value;
          if (index === 2) cell.className = result.status;
          row.appendChild(cell);
        });
        body.appendChild(row);
      });
    }
    updateControls();
  }

  function currentCommunicationComparison() {
    const communicationResults = results.filter(result => result.type === 'communication');
    const latest = communicationResults.at(-1) || null;
    const dualResults = communicationResults.filter(result => result.devices.length >= 2);
    const latestPath = dualResults.at(-1)?.metadata?.receivePath || selectedReceivePath();
    const comparable = dualResults.filter(result => (result.metadata?.receivePath || 'callbacks') === latestPath).slice(-3);
    const comparison = compareCommunicationRuns(comparable);
    if (latest && latest.devices.length === 1) {
      return {
        ...comparison,
        message: `単体ベースラインを記録しました（${describeResult(latest)}）。 ${comparison.message}`
      };
    }
    return comparison;
  }

  function renderCommunicationComparison() {
    const comparison = currentCommunicationComparison();
    const element = $('communicationComparison');
    element.textContent = comparison.message;
    element.className = `comparison ${comparison.status}`;
  }

  function buildReportPayload() {
    return {
      title: 'ORPHE INSOLE Sensor Validation Report',
      generatedAt: new Date().toISOString(),
      sdkVersion: '1.2.1',
      environment: simulatorMode ? 'simulator' : 'hardware',
      userAgent: navigator.userAgent,
      receivePath: selectedReceivePath(),
      devices: deviceInfo.map((info, deviceId) => ({ deviceId, side: sideFor(deviceId), information: info })),
      communicationComparison: currentCommunicationComparison(),
      results,
    };
  }

  function buildMarkdownReport() {
    const payload = buildReportPayload();
    const lines = [
      '# ORPHE INSOLE Sensor Validation Report',
      '',
      `- 実施日時: ${new Date(payload.generatedAt).toLocaleString()}`,
      `- SDK: v${payload.sdkVersion}`,
      `- 環境: ${payload.environment}`,
      '',
      '| 結果 | テスト | 時間 | 観測値 |',
      '|---|---|---:|---|',
    ];
    results.forEach(result => {
      lines.push(`| ${result.status.toUpperCase()} | ${result.label} | ${formatDuration(result.durationMs)} | ${describeResult(result).replaceAll('|', '/')} |`);
    });
    lines.push('', '## 通信条件比較', '', payload.communicationComparison.message, '');
    lines.push('', '## デバイス別詳細', '');
    results.forEach(result => {
      lines.push(`### ${result.label}`);
      if (result.gapCoincidence) {
        const overlap = result.gapCoincidence.devices
          .map(item => `D${item.deviceId}=${format(item.matchedPercent, 2)}% (${item.matchedEvents}/${item.totalEvents})`)
          .join(', ');
        lines.push(`- Synchronized gap events within ±${result.gapCoincidence.toleranceMs}ms: ${overlap}; matched pairs=${result.gapCoincidence.matchedPairs}`);
      }
      if (result.interruptions && result.interruptions.length) {
        lines.push(`- Connection interruptions: ${JSON.stringify(result.interruptions)}`);
      }
      result.devices.forEach(snapshot => {
        lines.push(
          `- DEVICE ${snapshot.deviceId} (${snapshot.side}, connection order=${snapshot.connectionRank || '-'}, receive path=${snapshot.receivePath || '-'}, ranges=±${snapshot.accRange}g/±${snapshot.gyroRange}deg/s): samples=${snapshot.samples}, sample rate run/observed=${format(snapshot.sampleRateHz, 2)}/${format(snapshot.observedSampleRateHz, 2)}Hz, completion=${format(snapshot.completionPercent, 2)}%, connection coverage=${format(snapshot.connectionCoveragePercent, 2)}% (${format(snapshot.connectedDurationMs / 1000, 1)}s connected), packets=${snapshot.receivedPackets}, packet rate run/observed=${format(snapshot.packetRateHz, 2)}/${format(snapshot.observedPacketRateHz, 2)}Hz, lost=${snapshot.lostPackets} (${format(snapshot.packetLossPercent, 3)}%), gap events=${snapshot.gapEvents}, max gap=${snapshot.maxGap}, interval mean/max=${format(snapshot.packetIntervalMs.mean, 3)}/${format(snapshot.packetIntervalMs.max, 3)}ms, gap histogram=${JSON.stringify(snapshot.gapHistogram)}, norm mean/std/min/max=${format(snapshot.norm.mean, 8)}/${format(snapshot.norm.std, 8)}/${format(snapshot.norm.min, 8)}/${format(snapshot.norm.max, 8)}, yaw drift host/device=${format(snapshot.yaw.driftDegPerMin, 3)}/${format(snapshot.yawDeviceClock && snapshot.yawDeviceClock.driftDegPerMin, 3)}deg/min, yaw residual=${format(snapshot.yaw.residualStdDeg, 4)}deg, yaw range=${format(snapshot.yaw.rangeDeg, 3)}deg, gyro_z mean=${format(snapshot.gyroZ.mean, 5)}deg/s, gyro bias equivalent=${format(snapshot.gyroZBiasDegPerMin, 3)}deg/min, yaw-minus-gyro=${format(snapshot.yawMinusGyroDegPerMin, 3)}deg/min, gyro-referenced yaw drift host/device=${format(snapshot.gyroReferencedYaw && snapshot.gyroReferencedYaw.driftDegPerMin, 3)}/${format(snapshot.gyroReferencedYawDeviceClock && snapshot.gyroReferencedYawDeviceClock.driftDegPerMin, 3)}deg/min, clock duration ratio=${format(snapshot.hostToDeviceDurationRatio, 6)}, gyro integral nominal/host/device=${format(snapshot.gyroZIntegralDeg, 3)}/${format(snapshot.gyroZHostTimeIntegralDeg, 3)}/${format(snapshot.gyroZDeviceTimeIntegralDeg, 3)}deg`
        );
        if (snapshot.driftWindows5Min && snapshot.driftWindows5Min.length) {
          const windows = snapshot.driftWindows5Min
            .filter(window => window.durationMs >= 60000)
            .map(window => `${window.startMinute}min:yaw=${format(window.yawDriftDegPerMin, 3)},gyro=${format(window.gyroZBiasDegPerMin, 3)},gyro-referenced=${format(window.gyroReferencedYawDriftDegPerMin, 3)}deg/min`)
            .join('; ');
          if (windows) lines.push(`- DEVICE ${snapshot.deviceId} 5-minute drift windows: ${windows}`);
        }
        const driftEvaluation = result.evaluation.evaluations.find(item => item.snapshot === snapshot)?.drift;
        if (driftEvaluation && driftEvaluation.fixedCalibration) {
          lines.push(`- DEVICE ${snapshot.deviceId} first-window fixed calibration validation: ${JSON.stringify(driftEvaluation.fixedCalibration)}`);
        }
      });
      lines.push('');
    });
    lines.push('> yawドリフトは6軸IMUの原理上残るため、ゼロであることを合格条件にしていません。');
    return lines.join('\n');
  }

  function downloadBlob(content, type, filename) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function wireEvents() {
    $('connect0').addEventListener('click', () => { void connectDevice(0); });
    $('connect1').addEventListener('click', () => { void connectDevice(1); });
    $('disconnectAll').addEventListener('click', disconnectAll);
    $('runSmoke').addEventListener('click', () => { void startSmoke(false); });
    $('startCommunication').addEventListener('click', () => { void startCommunication(); });
    $('startStatic').addEventListener('click', () => { void startStatic(); });
    $('startRotation').addEventListener('click', () => { void startRotation(); });
    $('finishRotation').addEventListener('click', () => { void finishActiveRun('target-reached'); });
    $('startWalk').addEventListener('click', () => { void startWalk(); });
    $('finishWalk').addEventListener('click', () => { void finishActiveRun('returned-to-start'); });
    $('runMode3').addEventListener('click', () => { void runMode3Regression(); });
    $('stopActive').addEventListener('click', () => { void finishActiveRun('stopped'); });
    $('downloadJson').addEventListener('click', () => {
      downloadBlob(JSON.stringify(buildReportPayload(), null, 2), 'application/json', `orphe-quaternion-report-${fileStamp()}.json`);
    });
    $('downloadMarkdown').addEventListener('click', () => {
      downloadBlob(buildMarkdownReport(), 'text/markdown', `orphe-quaternion-report-${fileStamp()}.md`);
    });
    $('clearResults').addEventListener('click', () => {
      results.length = 0;
      renderResults();
      renderCommunicationComparison();
      log('結果をクリアしました');
    });
    $('clearLog').addEventListener('click', () => { $('eventLog').innerHTML = ''; });
  }

  function initialize() {
    $('environmentBadge').textContent = simulatorMode ? 'シミュレータモード' : '実機モード';
    $('environmentBadge').className = `badge ${simulatorMode ? 'warn' : 'neutral'}`;
    $('fileSupport').textContent = typeof window.showSaveFilePicker === 'function'
      ? '生CSVはメモリへ溜めず、選択したファイルへ約1秒ごとに追記します。保存先の選択は各テスト開始時に一度だけ表示されます。'
      : 'このブラウザは生CSVの逐次保存に未対応です。統計とJSON/Markdownレポートは利用できます。';
    initLiveRows();
    wireEvents();
    [0, 1].forEach(updateConnectionCard);
    updateControls();
    renderActiveRun();
    renderResults();
    renderCommunicationComparison();
    setInterval(() => {
      renderLive();
      renderActiveRun();
    }, 500);
    log(simulatorMode ? 'シミュレータ検証モードで起動しました' : '実機検証ページを起動しました');
    if (simulatorMode) {
      setTimeout(() => {
        void connectDevice(0);
        void connectDevice(1);
      }, 200);
    }
  }

  initialize();
})();
