/* global OrpheInsole, OrpheInsoleSimulator, OrpheQuaternionValidationMetrics, OrpheYawWalkComparison */

(function () {
  'use strict';

  const {
    ADAPTIVE_BIAS_DEFAULTS,
    DeviceAccumulator,
    quaternionToEuler,
  } = OrpheQuaternionValidationMetrics;
  const {
    WalkComparisonTracker,
    expectedSignedDegrees,
    summarizeWalk,
  } = OrpheYawWalkComparison;

  const params = new URLSearchParams(window.location.search);
  const simulatorMode = params.get('sim') === '1';
  const DeviceClass = simulatorMode ? OrpheInsoleSimulator : OrpheInsole;
  const devices = [new DeviceClass(0), new DeviceClass(1)];
  const connected = [false, false];
  const deviceInfo = [null, null];
  const pending = [{}, {}];
  const latest = [null, null];
  const ACCELEROMETER_RANGES = [2, 4, 8, 16];
  const GYROSCOPE_RANGES = [250, 500, 1000, 2000];
  const CALIBRATION_MS = simulatorMode ? 3000 : 10000;
  const ENDING_STILL_MS = 3000;
  const GRAPH_SAMPLE_MS = 100;
  const MAX_GRAPH_POINTS = 18000;
  const DEVICE_COLORS = ['#2869b2', '#d86419'];
  const CSV_HEADER = [
    'phase', 'loops', 'direction', 'expected_yaw_deg', 'device', 'side',
    'host_timestamp_iso', 'host_elapsed_ms', 'walk_elapsed_ms', 'device_timestamp',
    'serial_number', 'packet_number', 'press0', 'press1', 'press2', 'press3', 'press4', 'press5',
    'acc_x_g', 'acc_y_g', 'acc_z_g', 'gyro_x_deg_s', 'gyro_y_deg_s', 'gyro_z_deg_s',
    'fixed_quat_w', 'fixed_quat_x', 'fixed_quat_y', 'fixed_quat_z', 'fixed_quat_norm',
    'legacy_quat_w', 'legacy_quat_x', 'legacy_quat_y', 'legacy_quat_z', 'legacy_quat_norm',
    'legacy_yaw_wrapped_deg', 'legacy_yaw_delta_deg',
    'fixed_yaw_wrapped_deg', 'fixed_yaw_delta_deg',
    'observed_bias_ready', 'observed_yaw_bias_rate_deg_s', 'observed_yaw_correction_deg',
    'corrected_yaw_delta_deg', 'packet_gap', 'host_packet_interval_ms'
  ];

  let run = null;
  let lastChartRenderAt = 0;

  const $ = id => document.getElementById(id);

  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function format(value, digits = 1, fallback = '-') {
    const number = finite(value);
    return number === null ? fallback : number.toFixed(digits);
  }

  function formatDuration(milliseconds) {
    const seconds = Math.max(0, Math.floor((finite(milliseconds) || 0) / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function fileStamp() {
    const date = new Date();
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function sideFor(deviceId) {
    const info = deviceInfo[deviceId] || devices[deviceId].device_information;
    if (!info || typeof info.mount_position === 'undefined') return '-';
    return (Number(info.mount_position) & 1) === 1 ? 'R' : 'L';
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

  function connectedIds() {
    return connected.map((isConnected, deviceId) => isConnected ? deviceId : null)
      .filter(deviceId => deviceId !== null);
  }

  function copyVector(vector) {
    return vector ? { x: Number(vector.x), y: Number(vector.y), z: Number(vector.z) } : null;
  }

  function copyQuaternion(quaternion) {
    return quaternion ? {
      w: Number(quaternion.w),
      x: Number(quaternion.x),
      y: Number(quaternion.y),
      z: Number(quaternion.z),
    } : null;
  }

  function notePending(deviceId, sample) {
    if (!sample) return;
    if (sample.timestamp !== undefined) pending[deviceId].timestamp = sample.timestamp;
    if (sample.serial_number !== undefined) pending[deviceId].serial = sample.serial_number;
    if (sample.packet_number !== undefined) pending[deviceId].packetNumber = sample.packet_number;
  }

  function eulerToQuaternion(pitch, roll, yaw) {
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
      z: sy * cr * cp - cy * sr * sp,
    };
  }

  function simulatedFrame(deviceId, frame, now) {
    if (!simulatorMode || !run || run.phase === 'complete') return frame;
    const biasRateDegPerSecond = deviceId === 0 ? -0.22 : -0.86;
    const elapsedSeconds = Math.max(0, now - run.startedAt) / 1000;
    let yawDegrees = biasRateDegPerSecond * elapsedSeconds;
    let gyroZ = biasRateDegPerSecond;
    let accX = 0;
    if (run.walkStartedAt !== null) {
      const walkElapsedMs = Math.max(0, now - run.walkStartedAt);
      const walkDurationMs = Number(run.loops) * 6000;
      const progress = Math.min(1, walkElapsedMs / walkDurationMs);
      const directionRotation = run.expectedDeg * progress;
      const gaitEnvelope = Math.sin(Math.PI * progress);
      const gaitWobble = (deviceId === 0 ? -1 : 1) * 5 * gaitEnvelope * Math.sin(walkElapsedMs / 170);
      yawDegrees += directionRotation + gaitWobble;
      gyroZ += progress < 1 ? run.expectedDeg / (walkDurationMs / 1000) : 0;
      accX = progress < 1 ? 0.16 * Math.sin(walkElapsedMs / 130) : 0;
    }
    const yaw = yawDegrees * Math.PI / 180;
    return {
      ...frame,
      acc: { x: accX, y: 0, z: 1 },
      gyro: { x: 0, y: 0, z: gyroZ },
      quat: eulerToQuaternion(0, 0, yaw),
      euler: { pitch: 0, roll: 0, yaw },
    };
  }

  function commitFrame(deviceId) {
    const sample = pending[deviceId];
    let frame = {
      device: deviceId,
      side: sideFor(deviceId),
      mode: Number(devices[deviceId].streaming_mode) || 4,
      timestamp: sample.timestamp ?? null,
      serial: sample.serial ?? null,
      packetNumber: sample.packetNumber ?? null,
      press: sample.press || null,
      acc: sample.acc || null,
      gyro: sample.gyro || null,
      quat: sample.quat || null,
      euler: sample.euler || null,
      hostEpochMs: Date.now(),
    };
    pending[deviceId] = {};
    frame = simulatedFrame(deviceId, frame, performance.now());
    recordFrame(deviceId, frame);
  }

  function recordParsedPacket(deviceId, data, uuid) {
    if (uuid !== 'SENSOR_VALUES') return;
    const parsed = OrpheInsole.parseSensorValues(data, sensorRangesFor(deviceId));
    if (!parsed) return;
    parsed.samples.forEach(sample => {
      const quaternion = copyQuaternion(sample.quat);
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
        quat: quaternion,
        euler: quaternionToEuler(quaternion),
        hostEpochMs: Date.now(),
      });
    });
  }

  function recordFrame(deviceId, frame) {
    latest[deviceId] = frame;
    if (!run || run.phase === 'complete' || !run.deviceIds.includes(deviceId)) return;
    const now = performance.now();
    const analysis = run.accumulators[deviceId].addFrame(frame, now);
    if (!analysis || !frame.quat) return;
    run.analysis[deviceId] = analysis;
    const adaptive = analysis.adaptiveYawBias;
    const correctedYawDegrees = adaptive && adaptive.observedCorrectedYaw
      ? adaptive.observedCorrectedYaw.endDeg
      : null;
    const stages = run.trackers[deviceId].push(frame.quat, correctedYawDegrees);
    run.stageState[deviceId] = stages;
    appendCsvRow(run, frame, analysis, stages, now);

    if ((run.phase === 'walking' || run.phase === 'ending') && now - run.lastGraphSampleAt[deviceId] >= GRAPH_SAMPLE_MS) {
      const walkElapsedMs = Math.max(0, now - run.walkStartedAt);
      run.graphPoints[deviceId].push({
        seconds: walkElapsedMs / 1000,
        legacy: stages.legacy.deltaDeg,
        fixed: stages.fixed.deltaDeg,
        corrected: stages.corrected.deltaDeg,
      });
      if (run.graphPoints[deviceId].length > MAX_GRAPH_POINTS) run.graphPoints[deviceId].shift();
      run.lastGraphSampleAt[deviceId] = now;
    }
  }

  function installCallbacks(device, deviceId) {
    device.setup();
    device.debug = false;
    device.gotQuat = function (quaternion) {
      notePending(deviceId, quaternion);
      pending[deviceId].quat = copyQuaternion(quaternion);
      pending[deviceId].euler = quaternionToEuler(quaternion);
    };
    device.gotEuler = function () {
      // Euler is always recalculated from quaternion so all three stages share one source.
    };
    device.gotConvertedAcc = function (acceleration) {
      notePending(deviceId, acceleration);
      pending[deviceId].acc = copyVector(acceleration);
    };
    device.gotConvertedGyro = function (gyro) {
      notePending(deviceId, gyro);
      pending[deviceId].gyro = copyVector(gyro);
    };
    device.gotPress = function (press) {
      notePending(deviceId, press);
      pending[deviceId].press = Array.isArray(press.values) ? press.values.slice(0, 6) : null;
      commitFrame(deviceId);
    };
    device.lostData = function () {
      // Packet loss is counted from serial numbers in DeviceAccumulator.
    };
    device.onConnect = function () {
      connected[deviceId] = true;
      renderConnection(deviceId);
      updateControls();
    };
    device.onDisconnect = function () {
      connected[deviceId] = false;
      renderConnection(deviceId);
      updateControls();
      if (run && run.deviceIds.includes(deviceId) && run.phase !== 'complete') {
        setRunMessage('接続が切れました', `DEVICE ${deviceId} の接続が切れました。残っているデータは測定を中止すると破棄されます。`, 'calibrating');
      }
    };
    device.onReconnectSuccess = function () {
      connected[deviceId] = true;
      renderConnection(deviceId);
      updateControls();
    };
    device.onError = function (error) {
      setRunMessage('接続エラー', error && error.message ? error.message : String(error), 'calibrating');
    };
  }

  devices.forEach(installCallbacks);

  async function connectDevice(deviceId) {
    if (connected[deviceId] || run) return;
    const button = $(`connect${deviceId}`);
    button.disabled = true;
    button.textContent = simulatorMode ? '起動中…' : '選択中…';
    try {
      if (!simulatorMode) {
        devices[deviceId].gotData = function (data, uuid) {
          recordParsedPacket(deviceId, data, uuid);
        };
      }
      await devices[deviceId].begin('SENSOR_VALUES', simulatorMode
        ? { streamingMode: 4, preset: 'stand' }
        : { streamingMode: 4, autoReconnect: true, forceDeviceSelection: true });

      if (!simulatorMode) {
        const otherId = 1 - deviceId;
        const currentBluetooth = devices[deviceId].bluetoothDevice;
        const otherBluetooth = devices[otherId].bluetoothDevice;
        if (connected[otherId] && currentBluetooth && otherBluetooth && currentBluetooth.id === otherBluetooth.id) {
          devices[deviceId].reset();
          throw new Error('同じINSOLEが2つの枠で選択されました。別のデバイスを選択してください。');
        }
      }

      deviceInfo[deviceId] = await devices[deviceId].getDeviceInformation();
      connected[deviceId] = true;
      pending[deviceId] = {};
      renderConnection(deviceId);
      updateControls();
    } catch (error) {
      connected[deviceId] = false;
      renderConnection(deviceId);
      updateControls();
      setRunMessage('接続できませんでした', error && error.message ? error.message : String(error), 'calibrating');
    }
  }

  function disconnectAll() {
    if (run && run.phase !== 'complete') return;
    devices.forEach((device, deviceId) => {
      if (connected[deviceId]) device.reset();
      connected[deviceId] = false;
      deviceInfo[deviceId] = null;
      pending[deviceId] = {};
      latest[deviceId] = null;
      renderConnection(deviceId);
    });
    updateControls();
  }

  function createRun() {
    const deviceIds = connectedIds();
    if (deviceIds.length === 0) throw new Error('INSOLEを1台以上接続してください。');
    const now = performance.now();
    const loops = Number($('walkLoops').value) || 1;
    const direction = $('walkDirection').value;
    const adaptiveBias = {
      ...ADAPTIVE_BIAS_DEFAULTS,
      enabled: true,
      gyroThresholdDegPerSecond: 4,
      accToleranceG: 0.12,
      stationaryDwellMs: 500,
      biasTimeConstantMs: 3000,
    };
    const accumulators = {};
    const trackers = {};
    const graphPoints = {};
    const lastGraphSampleAt = {};
    deviceIds.forEach(deviceId => {
      accumulators[deviceId] = new DeviceAccumulator(deviceId, now, 4, { adaptiveBias });
      trackers[deviceId] = new WalkComparisonTracker();
      graphPoints[deviceId] = [];
      lastGraphSampleAt[deviceId] = 0;
    });
    return {
      phase: 'calibrating',
      deviceIds,
      loops,
      direction,
      expectedDeg: expectedSignedDegrees(loops, direction),
      startedAt: now,
      startedAtIso: new Date().toISOString(),
      walkStartedAt: null,
      walkStartedAtIso: null,
      endingStartedAt: null,
      finishedAt: null,
      finishedAtIso: null,
      accumulators,
      trackers,
      analysis: {},
      stageState: {},
      graphPoints,
      lastGraphSampleAt,
      csvRows: [],
      result: null,
      adaptiveBias,
    };
  }

  function startCalibration() {
    if (run) return;
    try {
      run = createRun();
      $('calibrationProgress').max = CALIBRATION_MS / 1000;
      $('calibrationProgress').value = 0;
      clearResultsDisplay();
      setRunMessage(
        '静止校正中',
        simulatorMode ? 'シミュレーションでは3秒で校正します。動かさずにお待ちください。' : '開始方向を向いたまま10秒間動かないでください。',
        'calibrating'
      );
      updateControls();
    } catch (error) {
      setRunMessage('準備できませんでした', error.message || String(error), 'calibrating');
    }
  }

  function allCalibrationReady() {
    return Boolean(run && run.deviceIds.every(deviceId => {
      const analysis = run.analysis[deviceId];
      return analysis && analysis.adaptiveYawBias && analysis.adaptiveYawBias.observedYawReady;
    }));
  }

  function beginWalk() {
    if (!run || run.phase !== 'ready') return;
    const originsReady = run.deviceIds.every(deviceId => run.trackers[deviceId].markWalkOrigin());
    if (!originsReady) {
      setRunMessage('開始できません', 'yawデータがまだ揃っていません。静止したまま数秒お待ちください。', 'calibrating');
      return;
    }
    run.phase = 'walking';
    run.walkStartedAt = performance.now();
    run.walkStartedAtIso = new Date().toISOString();
    setRunMessage(
      '歩行を記録中',
      `${run.direction === 'CW' ? '時計回り' : '反時計回り'}に${run.loops}周し、同じ位置・同じ向きへ戻ってください。`,
      'walking'
    );
    updateControls();
  }

  function requestFinishWalk() {
    if (!run || run.phase !== 'walking') return;
    run.phase = 'ending';
    run.endingStartedAt = performance.now();
    setRunMessage('終了時の静止を記録中', 'その場で同じ方向を向いたまま3秒間動かないでください。', 'ending');
    updateControls();
  }

  function finishRun() {
    if (!run || run.phase === 'complete') return;
    const now = performance.now();
    run.finishedAt = now;
    run.finishedAtIso = new Date().toISOString();
    const devicesResult = run.deviceIds.map(deviceId => {
      const trackerSnapshot = run.trackers[deviceId].snapshot();
      const accumulatorSnapshot = run.accumulators[deviceId].snapshot(now);
      return {
        deviceId,
        side: sideFor(deviceId),
        comparison: summarizeWalk(trackerSnapshot, run.expectedDeg),
        tracker: trackerSnapshot,
        measurement: accumulatorSnapshot,
      };
    });
    run.result = {
      schemaVersion: 1,
      environment: simulatorMode ? 'simulator' : 'hardware',
      startedAt: run.startedAtIso,
      walkStartedAt: run.walkStartedAtIso,
      finishedAt: run.finishedAtIso,
      loops: run.loops,
      direction: run.direction,
      expectedDeg: run.expectedDeg,
      algorithms: {
        legacy: 'fixed quaternion components multiplied by 0.5, then ZYX Euler without normalization',
        fixed: 'Q14 parser output normalized before ZYX Euler conversion',
        corrected: 'stationary observed yaw drift rate subtracted over elapsed device time',
      },
      devices: devicesResult,
    };
    run.phase = 'complete';
    setRunMessage('測定完了', '結果を確認し、CSVを保存してください。', 'complete');
    renderResults();
    renderCharts(true);
    updateControls();
  }

  function cancelRun() {
    if (!run || run.phase === 'complete') return;
    run = null;
    $('calibrationProgress').value = 0;
    setRunMessage(connectedIds().length ? '測定待ち' : '接続待ち', connectedIds().length ? '条件を確認して静止校正を開始してください。' : 'INSOLEを1台以上接続してください。', 'idle');
    renderCalibrationDevices();
    renderCharts(true);
    updateControls();
  }

  function resetResult() {
    if (!run || run.phase !== 'complete') return;
    run = null;
    clearResultsDisplay();
    $('calibrationProgress').value = 0;
    setRunMessage(connectedIds().length ? '測定待ち' : '接続待ち', connectedIds().length ? '条件を確認して静止校正を開始してください。' : 'INSOLEを1台以上接続してください。', 'idle');
    renderCalibrationDevices();
    renderCharts(true);
    updateControls();
  }

  function updateWorkflow(now) {
    if (!run) return;
    if (run.phase === 'calibrating') {
      const elapsed = now - run.startedAt;
      $('calibrationProgress').value = Math.min(CALIBRATION_MS, elapsed) / 1000;
      if (elapsed >= CALIBRATION_MS && allCalibrationReady()) {
        run.phase = 'ready';
        setRunMessage('校正完了 — READY', '開始位置と方向を確認し、「歩行を開始」を押してください。', 'ready');
        updateControls();
      } else if (elapsed >= CALIBRATION_MS) {
        setRunMessage('静止校正を継続中', 'まだREADYになっていません。両足を床につけ、動かずにお待ちください。', 'calibrating');
      }
    } else if (run.phase === 'ending' && now - run.endingStartedAt >= ENDING_STILL_MS) {
      finishRun();
    }
  }

  function currentRunElapsed(now) {
    if (!run) return 0;
    if (run.phase === 'walking' || run.phase === 'ending' || run.phase === 'complete') {
      return Math.max(0, (run.finishedAt || now) - run.walkStartedAt);
    }
    return Math.max(0, now - run.startedAt);
  }

  function setRunMessage(phase, instruction, className) {
    $('runPhase').textContent = phase;
    $('runInstruction').textContent = instruction;
    $('runStatus').className = `run-status ${className}`;
  }

  function renderConnection(deviceId) {
    const card = $(`deviceCard${deviceId}`);
    const button = $(`connect${deviceId}`);
    const detail = $(`deviceDetail${deviceId}`);
    card.classList.toggle('connected', connected[deviceId]);
    if (connected[deviceId]) {
      const frame = latest[deviceId];
      const euler = frame && frame.quat ? quaternionToEuler(frame.quat) : null;
      const norm = frame && frame.quat
        ? Math.hypot(frame.quat.w, frame.quat.x, frame.quat.y, frame.quat.z)
        : null;
      button.textContent = '接続済み';
      button.disabled = true;
      detail.textContent = `${sideFor(deviceId)} / mode 4 / norm ${format(norm, 5)} / yaw ${format(euler && euler.yaw * 180 / Math.PI, 1)}°`;
      $(`deviceTitle${deviceId}`).textContent = `INSOLE ${deviceId + 1} — ${sideFor(deviceId)}`;
    } else {
      button.textContent = simulatorMode ? 'シミュレータ起動' : 'BLE接続';
      button.disabled = Boolean(run);
      detail.textContent = '未接続';
      $(`deviceTitle${deviceId}`).textContent = `INSOLE ${String(deviceId + 1).padStart(2, '0')}`;
    }
    $(`legend${deviceId}`).textContent = connected[deviceId] ? `DEVICE ${deviceId} (${sideFor(deviceId)})` : `DEVICE ${deviceId}`;
  }

  function renderCalibrationDevices() {
    const container = $('calibrationDevices');
    const ids = run ? run.deviceIds : connectedIds();
    if (ids.length === 0) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = ids.map(deviceId => {
      const adaptive = run && run.analysis[deviceId] && run.analysis[deviceId].adaptiveYawBias;
      const ready = adaptive && adaptive.observedYawReady;
      const rate = adaptive && adaptive.observedYawBiasRateDegPerSecond;
      return `<div class="calibration-device"><strong>DEVICE ${deviceId} (${sideFor(deviceId)})</strong><span class="${ready ? 'ready' : 'wait'}">${ready ? `READY / ${format(rate * 60, 2)}°/min` : 'WAIT / 静止してください'}</span></div>`;
    }).join('');
  }

  function updateControls() {
    const ids = connectedIds();
    const active = run && run.phase !== 'complete';
    [0, 1].forEach(deviceId => {
      $(`connect${deviceId}`).disabled = connected[deviceId] || Boolean(run);
    });
    $('disconnectAll').disabled = ids.length === 0 || Boolean(active);
    $('walkLoops').disabled = Boolean(run);
    $('walkDirection').disabled = Boolean(run);
    $('prepareTest').disabled = ids.length === 0 || Boolean(run);
    $('beginWalk').disabled = !run || run.phase !== 'ready';
    $('finishWalk').disabled = !run || run.phase !== 'walking';
    $('cancelTest').disabled = !active;
    const complete = Boolean(run && run.phase === 'complete');
    $('downloadCsv').disabled = !complete;
    $('downloadJson').disabled = !complete;
    $('resetResult').disabled = !complete;

    let globalText = '接続待ち';
    let globalClass = 'neutral';
    if (run) {
      globalText = run.phase === 'complete' ? '測定完了' : '測定中';
      globalClass = run.phase === 'complete' ? 'pass' : 'active';
    } else if (ids.length > 0) {
      globalText = `${ids.length}台 接続済み`;
      globalClass = 'pass';
    }
    $('globalStatus').textContent = globalText;
    $('globalStatus').className = `badge ${globalClass}`;
  }

  function renderResults() {
    if (!run || !run.result) return;
    const rows = run.result.devices.map(item => {
      const comparison = item.comparison;
      const measurement = item.measurement;
      const adaptive = measurement.adaptiveYawBias;
      const change = comparison.errorChangeDeg;
      const changeClass = change > 0 ? 'change-better' : (change < 0 ? 'change-worse' : '');
      const changeText = change === null ? '-' : (change > 0 ? `${format(change, 1)}° 改善` : (change < 0 ? `${format(Math.abs(change), 1)}° 増加` : '変化なし'));
      return `<tr>
        <td>DEVICE ${item.deviceId}</td>
        <td>${item.side}</td>
        <td class="numeric">${format(comparison.legacyDeltaDeg, 1)}° / ${format(comparison.legacyRangeDeg, 1)}°</td>
        <td class="numeric">${format(comparison.fixedDeltaDeg, 1)}° / ${format(comparison.fixedErrorDeg, 1)}°</td>
        <td class="numeric">${format(comparison.correctedDeltaDeg, 1)}° / ${format(comparison.correctedErrorDeg, 1)}°</td>
        <td class="${changeClass}">${changeText}</td>
        <td class="numeric">${format(comparison.legacyNorm, 5)} / ${format(comparison.fixedNorm, 5)}</td>
        <td class="numeric">${format(adaptive.observedYawBiasRateDegPerSecond * 60, 2)}°/min</td>
        <td class="numeric">${format(measurement.packetLossPercent, 2)}%</td>
      </tr>`;
    }).join('');
    $('resultsBody').innerHTML = rows;

    const fixedErrors = run.result.devices.map(item => item.comparison.fixedErrorDeg).filter(value => finite(value) !== null);
    const correctedErrors = run.result.devices.map(item => item.comparison.correctedErrorDeg).filter(value => finite(value) !== null);
    const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const fixedMean = mean(fixedErrors);
    const correctedMean = mean(correctedErrors);
    const difference = fixedMean === null || correctedMean === null ? null : fixedMean - correctedMean;
    let comparisonText = '誤差の比較値を計算できませんでした。';
    if (difference !== null) {
      comparisonText = difference > 0
        ? `静止ドリフト補正により、平均絶対誤差は ${format(fixedMean, 1)}° から ${format(correctedMean, 1)}° へ ${format(difference, 1)}° 小さくなりました。`
        : `今回の測定では、平均絶対誤差は補正前 ${format(fixedMean, 1)}°、補正後 ${format(correctedMean, 1)}° でした。補正効果は別条件でも確認してください。`;
    }
    $('resultSummary').className = 'result-summary';
    $('resultSummary').textContent = `目安角度 ${Math.abs(run.expectedDeg)}°。${comparisonText}`;
    updateChartMetrics();
  }

  function clearResultsDisplay() {
    $('resultsBody').innerHTML = '<tr><td colspan="9" class="empty-cell">まだ測定結果はありません</td></tr>';
    $('resultSummary').className = 'result-summary empty';
    $('resultSummary').textContent = '測定が終了すると、各デバイスの回転量と誤差を表示します。';
    ['legacyChartMetric', 'fixedChartMetricA', 'fixedChartMetricB', 'correctedChartMetric'].forEach(id => {
      $(id).textContent = '測定待ち';
    });
  }

  function updateChartMetrics() {
    if (!run) return;
    const values = run.deviceIds.map(deviceId => {
      const snapshot = run.trackers[deviceId].snapshot();
      return {
        deviceId,
        side: sideFor(deviceId),
        legacy: snapshot.legacy,
        fixed: snapshot.fixed,
        corrected: snapshot.corrected,
      };
    });
    const textFor = stage => values.map(value => `D${value.deviceId}(${value.side}) ${format(value[stage].deltaDeg, 1)}°`).join(' / ');
    $('legacyChartMetric').textContent = `${textFor('legacy')}（最大–最小: ${values.map(value => `D${value.deviceId} ${format(value.legacy.rangeDeg, 1)}°`).join(' / ')}）`;
    $('fixedChartMetricA').textContent = textFor('fixed');
    $('fixedChartMetricB').textContent = textFor('fixed');
    $('correctedChartMetric').textContent = textFor('corrected');
  }

  function chartBounds(stages) {
    let minimum = 0;
    let maximum = 0;
    if (run) {
      minimum = Math.min(minimum, run.expectedDeg);
      maximum = Math.max(maximum, run.expectedDeg);
      run.deviceIds.forEach(deviceId => {
        run.graphPoints[deviceId].forEach(point => {
          stages.forEach(stage => {
            const value = finite(point[stage]);
            if (value === null) return;
            minimum = Math.min(minimum, value);
            maximum = Math.max(maximum, value);
          });
        });
      });
    }
    const span = Math.max(40, maximum - minimum);
    const padding = span * 0.1;
    return { minimum: minimum - padding, maximum: maximum + padding };
  }

  function maxGraphSeconds() {
    let maximum = 10;
    if (!run) return maximum;
    run.deviceIds.forEach(deviceId => {
      const points = run.graphPoints[deviceId];
      if (points.length) maximum = Math.max(maximum, points[points.length - 1].seconds);
    });
    return maximum;
  }

  function drawChart(canvasId, stage, bounds, maximumSeconds) {
    const canvas = $(canvasId);
    const rectangle = canvas.getBoundingClientRect();
    const cssWidth = Math.max(320, rectangle.width || 620);
    const cssHeight = Math.max(240, rectangle.height || 300);
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, cssWidth, cssHeight);

    const margin = { left: 54, right: 18, top: 18, bottom: 38 };
    const width = cssWidth - margin.left - margin.right;
    const height = cssHeight - margin.top - margin.bottom;
    const xFor = seconds => margin.left + (seconds / maximumSeconds) * width;
    const yFor = value => margin.top + (bounds.maximum - value) * height / (bounds.maximum - bounds.minimum);

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, cssWidth, cssHeight);
    context.strokeStyle = '#e1e8ec';
    context.lineWidth = 1;
    context.font = '11px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    context.fillStyle = '#70808a';
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    for (let index = 0; index <= 5; index += 1) {
      const value = bounds.minimum + (bounds.maximum - bounds.minimum) * index / 5;
      const y = yFor(value);
      context.beginPath();
      context.moveTo(margin.left, y);
      context.lineTo(margin.left + width, y);
      context.stroke();
      context.fillText(`${Math.round(value)}°`, margin.left - 7, y);
    }
    context.textAlign = 'center';
    context.textBaseline = 'top';
    for (let index = 0; index <= 5; index += 1) {
      const seconds = maximumSeconds * index / 5;
      const x = xFor(seconds);
      context.beginPath();
      context.moveTo(x, margin.top);
      context.lineTo(x, margin.top + height);
      context.stroke();
      context.fillText(`${Math.round(seconds)}s`, x, margin.top + height + 8);
    }

    if (run) {
      context.save();
      context.strokeStyle = '#687784';
      context.lineWidth = 1.5;
      context.setLineDash([7, 5]);
      context.beginPath();
      context.moveTo(margin.left, yFor(run.expectedDeg));
      context.lineTo(margin.left + width, yFor(run.expectedDeg));
      context.stroke();
      context.restore();

      run.deviceIds.forEach(deviceId => {
        const points = run.graphPoints[deviceId].filter(point => finite(point[stage]) !== null);
        if (!points.length) return;
        context.strokeStyle = DEVICE_COLORS[deviceId];
        context.lineWidth = 2.2;
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.beginPath();
        points.forEach((point, index) => {
          const x = xFor(point.seconds);
          const y = yFor(point[stage]);
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
      });
    }
  }

  function renderCharts(force = false) {
    const now = performance.now();
    if (!force && now - lastChartRenderAt < 250) return;
    lastChartRenderAt = now;
    const scaleComparison = chartBounds(['legacy', 'fixed']);
    const driftComparison = chartBounds(['fixed', 'corrected']);
    const maximumSeconds = maxGraphSeconds();
    drawChart('legacyChart', 'legacy', scaleComparison, maximumSeconds);
    drawChart('fixedChartA', 'fixed', scaleComparison, maximumSeconds);
    drawChart('fixedChartB', 'fixed', driftComparison, maximumSeconds);
    drawChart('correctedChart', 'corrected', driftComparison, maximumSeconds);
    if (run) updateChartMetrics();
  }

  function csvValue(value) {
    if (value === null || value === undefined) return '';
    const string = String(value);
    return /[",\n\r]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
  }

  function appendCsvRow(activeRun, frame, analysis, stages, now) {
    const adaptive = analysis.adaptiveYawBias || {};
    const legacyQuaternion = stages.legacyQuaternion || {};
    const quaternion = frame.quat || {};
    const press = frame.press || [];
    const walkElapsed = activeRun.walkStartedAt === null ? null : Math.max(0, now - activeRun.walkStartedAt);
    const row = [
      activeRun.phase, activeRun.loops, activeRun.direction, activeRun.expectedDeg, frame.device, frame.side,
      new Date(frame.hostEpochMs).toISOString(), now - activeRun.startedAt, walkElapsed, frame.timestamp,
      frame.serial, frame.packetNumber, ...[0, 1, 2, 3, 4, 5].map(index => press[index]),
      frame.acc && frame.acc.x, frame.acc && frame.acc.y, frame.acc && frame.acc.z,
      frame.gyro && frame.gyro.x, frame.gyro && frame.gyro.y, frame.gyro && frame.gyro.z,
      quaternion.w, quaternion.x, quaternion.y, quaternion.z, stages.fixedNorm,
      legacyQuaternion.w, legacyQuaternion.x, legacyQuaternion.y, legacyQuaternion.z, stages.legacyNorm,
      stages.legacyYawWrappedDeg, stages.legacy.deltaDeg,
      stages.fixedYawWrappedDeg, stages.fixed.deltaDeg,
      adaptive.observedYawReady, adaptive.observedYawBiasRateDegPerSecond, adaptive.observedYawCorrectionDeg,
      stages.corrected.deltaDeg, analysis.packetGap, analysis.packetIntervalMs,
    ].map(csvValue).join(',');
    activeRun.csvRows.push(row);
  }

  function downloadBlob(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadCsv() {
    if (!run || run.phase !== 'complete') return;
    const content = `\uFEFF${CSV_HEADER.join(',')}\n${run.csvRows.join('\n')}\n`;
    downloadBlob(`orphe-yaw-walk-comparison-${fileStamp()}.csv`, content, 'text/csv;charset=utf-8');
  }

  function downloadJson() {
    if (!run || !run.result) return;
    downloadBlob(`orphe-yaw-walk-comparison-${fileStamp()}.json`, `${JSON.stringify(run.result, null, 2)}\n`, 'application/json;charset=utf-8');
  }

  function renderLoop(now) {
    updateWorkflow(now);
    $('runTimer').textContent = formatDuration(currentRunElapsed(now));
    [0, 1].forEach(deviceId => renderConnection(deviceId));
    renderCalibrationDevices();
    renderCharts();
    window.requestAnimationFrame(renderLoop);
  }

  function initialize() {
    $('environmentBadge').textContent = simulatorMode ? 'シミュレーション' : '実機モード';
    $('environmentBadge').className = `badge ${simulatorMode ? 'warn' : 'neutral'}`;
    if (simulatorMode) {
      $('browserSupport').textContent = '操作確認用シミュレーションです。結果を実機評価には使用しないでください。';
    } else if (!window.isSecureContext || !navigator.bluetooth) {
      $('browserSupport').className = 'support-message warn';
      $('browserSupport').textContent = 'Web Bluetoothを利用できません。Chrome / EdgeでHTTPSまたはlocalhostのURLを開いてください。';
    } else {
      $('browserSupport').textContent = 'Web Bluetooth利用可能。BLE接続時のデバイス選択だけは、ブラウザの画面で手動選択してください。';
    }

    $('connect0').addEventListener('click', () => connectDevice(0));
    $('connect1').addEventListener('click', () => connectDevice(1));
    $('disconnectAll').addEventListener('click', disconnectAll);
    $('prepareTest').addEventListener('click', startCalibration);
    $('beginWalk').addEventListener('click', beginWalk);
    $('finishWalk').addEventListener('click', requestFinishWalk);
    $('cancelTest').addEventListener('click', cancelRun);
    $('downloadCsv').addEventListener('click', downloadCsv);
    $('downloadJson').addEventListener('click', downloadJson);
    $('resetResult').addEventListener('click', resetResult);
    window.addEventListener('resize', () => renderCharts(true));

    [0, 1].forEach(renderConnection);
    clearResultsDisplay();
    updateControls();
    renderCalibrationDevices();
    setRunMessage('接続待ち', simulatorMode ? 'シミュレータを1台以上起動してください。' : 'INSOLEを1台以上接続してください。', 'idle');
    renderCharts(true);
    window.requestAnimationFrame(renderLoop);
  }

  initialize();
})();
