/* global OrpheInsole, OrpheInsoleSimulator, OrpheQuaternionValidationMetrics */

(function () {
  'use strict';

  const {
    DeviceAccumulator,
    evaluateQuaternion,
    quatNorm,
    radToDeg,
  } = OrpheQuaternionValidationMetrics;

  const params = new URLSearchParams(window.location.search);
  const simulatorMode = params.get('sim') === '1';
  const DeviceClass = simulatorMode ? OrpheInsoleSimulator : OrpheInsole;
  const devices = [new DeviceClass(0), new DeviceClass(1)];
  const connected = [false, false];
  const deviceInfo = [null, null];
  const pending = [{}, {}];
  const live = [createLiveState(0), createLiveState(1)];
  const results = [];
  let activeRun = null;
  let autoSmokeScheduled = false;
  let exclusiveBusy = false;

  const $ = id => document.getElementById(id);

  function createLiveState(deviceId, mode = 4) {
    return {
      accumulator: new DeviceAccumulator(deviceId, performance.now(), mode),
      latestFrame: null,
      latestAnalysis: null,
      frequency: 0,
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
    return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : fallback;
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

    const now = performance.now();
    live[deviceId].latestFrame = frame;
    live[deviceId].latestAnalysis = live[deviceId].accumulator.addFrame(frame, now);
    live[deviceId].lastFrameAt = now;

    if (activeRun && activeRun.accumulators[deviceId]) {
      const analysis = activeRun.accumulators[deviceId].addFrame(frame, now);
      if (activeRun.logger) activeRun.logger.append(activeRun, frame, analysis);
    }
  }

  function installCallbacks(device, deviceId) {
    device.setup();
    device.debug = false;

    device.gotQuat = function (quat) {
      notePending(deviceId, quat);
      pending[deviceId].quat = copyQuat(quat);
    };
    device.gotEuler = function (euler) {
      notePending(deviceId, euler);
      pending[deviceId].euler = copyEuler(euler);
      if (Number(device.streaming_mode) === 1) commitFrame(deviceId);
    };
    device.gotConvertedAcc = function (acc) {
      notePending(deviceId, acc);
      pending[deviceId].acc = copyVector(acc);
    };
    device.gotConvertedGyro = function (gyro) {
      notePending(deviceId, gyro);
      pending[deviceId].gyro = copyVector(gyro);
      if (Number(device.streaming_mode) === 1 && typeof window.Quaternion === 'undefined') commitFrame(deviceId);
    };
    device.gotPress = function (press) {
      notePending(deviceId, press);
      pending[deviceId].press = Array.isArray(press.values) ? press.values.slice(0, 6) : null;
      commitFrame(deviceId);
    };
    device.gotBLEFrequency = function (frequency) {
      live[deviceId].frequency = Number(frequency) || 0;
    };
    device.lostData = function () {
      // 欠損はframeのserial_numberから集計する。Consoleへ大量出力しない。
    };
    device.onConnect = function () {
      connected[deviceId] = true;
      updateConnectionCard(deviceId);
    };
    device.onDisconnect = function () {
      connected[deviceId] = false;
      updateConnectionCard(deviceId);
      updateControls();
      log(`DEVICE ${deviceId} が切断されました`, 'warn');
    };
    device.onReconnectSuccess = function () {
      connected[deviceId] = true;
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
      pending[deviceId] = {};
      resetLiveState(deviceId, 4);
      log(`DEVICE ${deviceId} 接続完了: side=${sideFor(deviceId)} / mode 4`, 'pass');
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
      pending[deviceId] = {};
      resetLiveState(deviceId, 4);
      updateConnectionCard(deviceId);
    });
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
      detail.textContent = `${sideFor(deviceId)} / mode ${devices[deviceId].streaming_mode || 4}${battery !== undefined ? ` / battery ${battery}` : ''}`;
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
        'euler_pitch', 'euler_roll', 'euler_yaw', 'yaw_unwrapped_deg'
      ].join(',') + '\n';
      await this.writable.write(header);
      this.flushTimer = setInterval(() => this.flush(), 1000);
    }

    append(run, frame, analysis) {
      if (this.closed || this.error) return;
      const value = item => Number.isFinite(Number(item)) ? String(Number(item)) : '';
      const press = frame.press || [];
      const row = [
        run.type, frame.device, frame.side, frame.mode, frame.hostEpochMs, frame.timestamp, frame.serial, frame.packetNumber,
        ...[0, 1, 2, 3, 4, 5].map(index => value(press[index])),
        value(frame.acc && frame.acc.x), value(frame.acc && frame.acc.y), value(frame.acc && frame.acc.z),
        value(frame.gyro && frame.gyro.x), value(frame.gyro && frame.gyro.y), value(frame.gyro && frame.gyro.z),
        value(frame.quat && frame.quat.w), value(frame.quat && frame.quat.x), value(frame.quat && frame.quat.y), value(frame.quat && frame.quat.z),
        value(analysis && analysis.norm),
        value(frame.euler && frame.euler.pitch), value(frame.euler && frame.euler.roll), value(frame.euler && frame.euler.yaw),
        value(analysis && analysis.yawUnwrappedDeg)
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
    if (type === 'smoke' || type === 'static') {
      const evaluations = snapshots.map(snapshot => {
        const quat = evaluateQuaternion(snapshot);
        const expected = snapshot.expectedSampleRateHz;
        let rateStatus = 'pass';
        if (snapshot.sampleRateHz < expected * 0.5) rateStatus = 'fail';
        else if (snapshot.sampleRateHz < expected * 0.8) rateStatus = 'warn';
        const eulerStatus = snapshot.presence.euler > 0 ? 'pass' : 'fail';
        return { snapshot, status: worstStatus([quat.status, rateStatus, eulerStatus]), quat, eulerStatus };
      });
      return { status: worstStatus(evaluations.map(item => item.status)), evaluations };
    }

    if (type === 'rotation') {
      const target = Number(metadata.targetDeg);
      const evaluations = snapshots.map(snapshot => {
        const observed = Math.abs(snapshot.yaw.deltaDeg || 0);
        const errorDeg = observed - target;
        const tolerance = Math.max(5, target * 0.1);
        return {
          snapshot,
          observedDeg: observed,
          signedObservedDeg: snapshot.yaw.deltaDeg,
          errorDeg,
          errorPercent: target ? Math.abs(errorDeg) * 100 / target : null,
          status: snapshot.presence.euler === 0 ? 'fail' : (Math.abs(errorDeg) <= tolerance ? 'pass' : 'warn'),
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
        gyroErrorDeg: Math.abs(snapshot.gyroZIntegralDeg || 0) - expected,
        status: 'info',
      }));
      return { status: 'info', evaluations };
    }

    if (type === 'mode3') {
      const evaluations = snapshots.map(snapshot => {
        const hasSensors = snapshot.presence.press > 0 && snapshot.presence.acc > 0 && snapshot.presence.gyro > 0;
        const quatStopped = snapshot.presence.quat === 0 && snapshot.presence.euler === 0;
        const rateOk = snapshot.sampleRateHz >= 100;
        return {
          snapshot,
          status: hasSensors && quatStopped && rateOk ? 'pass' : 'fail',
          hasSensors,
          quatStopped,
          rateOk,
        };
      });
      return { status: worstStatus(evaluations.map(item => item.status)), evaluations };
    }

    return { status: 'info', evaluations: snapshots.map(snapshot => ({ snapshot, status: 'info' })) };
  }

  function describeResult(result) {
    return result.evaluation.evaluations.map(item => {
      const snapshot = item.snapshot;
      const prefix = `D${snapshot.deviceId}(${snapshot.side})`;
      if (result.type === 'rotation') {
        return `${prefix}: yaw ${format(item.signedObservedDeg, 1)}° / |誤差| ${format(Math.abs(item.errorDeg), 1)}°`;
      }
      if (result.type === 'walk') {
        return `${prefix}: quat ${format(snapshot.yaw.deltaDeg, 1)}° / gyro ${format(snapshot.gyroZIntegralDeg, 1)}° / 実角 ${format(item.expectedDeg, 0)}°`;
      }
      if (result.type === 'mode3') {
        return `${prefix}: ${format(snapshot.sampleRateHz, 1)}Hz / press ${snapshot.presence.press} / quat ${snapshot.presence.quat} / loss ${format(snapshot.packetLossPercent, 2)}%`;
      }
      return `${prefix}: norm ${format(snapshot.norm.mean, 6)} ± ${format(snapshot.norm.std, 6)} / drift ${format(snapshot.yaw.driftDegPerMin, 2)}°/min / loss ${format(snapshot.packetLossPercent, 2)}%`;
    }).join(' ｜ ');
  }

  async function finishActiveRun(reason = 'manual') {
    if (!activeRun) return null;
    const run = activeRun;
    activeRun = null;
    if (run.timeout) clearTimeout(run.timeout);
    const endAt = performance.now();
    const snapshots = run.deviceIds.map(deviceId => {
      const snapshot = run.accumulators[deviceId].snapshot(endAt);
      snapshot.side = sideFor(deviceId);
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
    const result = {
      type: run.type,
      label: run.label,
      status: evaluation.status,
      reason,
      startedAt: run.startedAtIso,
      endedAt: new Date().toISOString(),
      durationMs: endAt - run.startedAt,
      metadata: run.metadata,
      devices: snapshots,
      evaluation,
    };
    results.push(result);
    log(`${run.label} 終了: ${evaluation.status.toUpperCase()} — ${describeResult(result)}`, evaluation.status);
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
      $(`liveRate${deviceId}`).textContent = connected[deviceId] ? `${format(snapshot.sampleRateHz, 1)} Hz` : '-';
      $(`liveNorm${deviceId}`).textContent = currentNorm === null ? '-' : `${format(currentNorm, 6)} / μ ${format(snapshot.norm.mean, 6)}`;
      $(`liveYaw${deviceId}`).textContent = currentYaw === null ? '-' : `${format(currentYaw, 1)}° / unwrap ${format(snapshot.yaw.endDeg, 1)}°`;
      $(`liveDrift${deviceId}`).textContent = snapshot.yaw.driftDegPerMin === null ? '-' : `${format(snapshot.yaw.driftDegPerMin, 2)}°/min`;
      $(`liveLoss${deviceId}`).textContent = connected[deviceId] ? `${snapshot.lostPackets} (${format(snapshot.packetLossPercent, 2)}%)` : '-';
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

  function buildReportPayload() {
    return {
      title: 'ORPHE INSOLE Quaternion Validation Report',
      generatedAt: new Date().toISOString(),
      sdkVersion: '1.2.1',
      environment: simulatorMode ? 'simulator' : 'hardware',
      userAgent: navigator.userAgent,
      devices: deviceInfo.map((info, deviceId) => ({ deviceId, side: sideFor(deviceId), information: info })),
      results,
    };
  }

  function buildMarkdownReport() {
    const payload = buildReportPayload();
    const lines = [
      '# ORPHE INSOLE Quaternion Validation Report',
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
    lines.push('', '## デバイス別詳細', '');
    results.forEach(result => {
      lines.push(`### ${result.label}`);
      result.devices.forEach(snapshot => {
        lines.push(
          `- DEVICE ${snapshot.deviceId} (${snapshot.side}): samples=${snapshot.samples}, rate=${format(snapshot.sampleRateHz, 2)}Hz, lost=${snapshot.lostPackets} (${format(snapshot.packetLossPercent, 3)}%), norm mean=${format(snapshot.norm.mean, 8)}, std=${format(snapshot.norm.std, 8)}, min=${format(snapshot.norm.min, 8)}, max=${format(snapshot.norm.max, 8)}, yaw drift=${format(snapshot.yaw.driftDegPerMin, 3)}deg/min, yaw delta=${format(snapshot.yaw.deltaDeg, 3)}deg, gyro_z integral=${format(snapshot.gyroZIntegralDeg, 3)}deg`
        );
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
