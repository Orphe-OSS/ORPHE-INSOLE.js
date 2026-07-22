/* global OrpheInsole, OrpheInsoleGait, OrpheGaitValidationMetrics */

(function () {
  'use strict';

  const Metrics = OrpheGaitValidationMetrics;
  const MAX_RAW_PACKETS = 100000;
  const LATE_GRACE_MS = 100;
  const LATE_MONITOR_MS = 300;
  const STOP_TIMEOUT_MS = 5000;
  const states = [];
  let lastCaptures = [];
  let lastReport = null;
  let walkTimer = null;
  let walkRunning = false;
  let currentCaptureKind = null;
  let operationBusy = false;

  function byId(id) { return document.getElementById(id); }
  function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
  function withTimeout(promise, timeoutMs, label) {
    let timer = null;
    return Promise.race([
      Promise.resolve(promise).finally(() => clearTimeout(timer)),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  }
  function nowMs() { return performance.now(); }
  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function fmt(value, digits = 2) { return finite(value) ? value.toFixed(digits) : '-'; }
  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function statusIcon(status) {
    return status === 'pass' ? 'PASS' : (status === 'warn' ? 'WARN' : 'FAIL');
  }

  function log(message, level = 'info') {
    const line = document.createElement('div');
    line.className = `log-line ${level}`;
    line.textContent = `${new Date().toLocaleTimeString()}  ${message}`;
    byId('event-log').appendChild(line);
    byId('event-log').scrollTop = byId('event-log').scrollHeight;
  }

  function sanitizedDeviceInfo(info) {
    if (!info || typeof info !== 'object') return null;
    return {
      battery: finite(Number(info.battery)) ? Number(info.battery) : null,
      mount_position: finite(Number(info.mount_position)) ? Number(info.mount_position) : null,
      range: info.range && typeof info.range === 'object'
        ? { acc: Number(info.range.acc), gyro: Number(info.range.gyro) }
        : null,
    };
  }

  function sideFromInfo(info) {
    if (!info || !finite(Number(info.mount_position))) return '?';
    return (Number(info.mount_position) & 1) === 1 ? 'R' : 'L';
  }

  function deviceConnected(state) {
    return !!(state.insole && state.insole.isConnected && state.insole.isConnected());
  }

  function packetHex(dv) {
    const bytes = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength).slice();
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  }

  function createCapture(state, kind) {
    return {
      kind,
      deviceId: state.id,
      side: state.side,
      info: sanitizedDeviceInfo(state.insole.device_information),
      startedAt: nowMs(),
      wallStartedAt: new Date().toISOString(),
      stoppedAt: null,
      wallStoppedAt: null,
      rawPackets: [],
      decodedPackets: [],
      rows: [],
      pressEvents: [],
      sensorStartCount: state.pressCount,
      sensorRateHz: null,
      postStopPackets: 0,
      rawTruncated: false,
      errors: [],
      smokeCycles: state.smokeCycles.slice(),
      disconnectEvents: [],
      reconnectAttempts: [],
      reconnectEvents: [],
    };
  }

  function recordRaw(state, dv) {
    const capture = state.capture;
    if (!capture) return null;
    if (capture.rawPackets.length >= MAX_RAW_PACKETS) {
      capture.rawTruncated = true;
      return null;
    }
    const bytes = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength).slice();
    const independent = Metrics.decodeRawPacket(bytes);
    const raw = {
      at: nowMs(),
      hostTime: new Date().toISOString(),
      length: dv.byteLength,
      header: dv.byteLength > 0 ? dv.getUint8(0) : null,
      subheader: dv.byteLength > 1 ? dv.getUint8(1) : null,
      stepNumber: dv.byteLength > 3 ? dv.getUint16(2, false) : null,
      hex: packetHex(dv),
      independent,
      mismatchFields: null,
    };
    capture.rawPackets.push(raw);
    return raw;
  }

  function createDeviceState(id) {
    const insole = new OrpheInsole(id);
    insole.setup();
    insole.debug = false;
    const gait = new OrpheInsoleGait(insole);
    const state = {
      id,
      insole,
      gait,
      side: '?',
      pressCount: 0,
      lastPressRate: 0,
      lastPressSnapshot: 0,
      capture: null,
      recentCapture: null,
      currentRaw: null,
      lateMonitorStart: 0,
      lateMonitorEnd: 0,
      smokeCycles: [],
      reconnectCount: 0,
      lastRow: null,
    };

    const sdkOnRead = insole.onRead.bind(insole);
    insole.onRead = function (dv, uuid) {
      if (uuid === 'STEP_ANALYSIS') {
        const currentTime = nowMs();
        if (state.capture) {
          state.currentRaw = recordRaw(state, dv);
        } else if (state.recentCapture && currentTime >= state.lateMonitorStart && currentTime <= state.lateMonitorEnd) {
          state.recentCapture.postStopPackets += 1;
        }
      }
      try {
        return sdkOnRead(dv, uuid);
      } finally {
        state.currentRaw = null;
      }
    };

    insole.gotPress = function () {
      state.pressCount += 1;
      if (state.capture) state.capture.pressEvents.push(nowMs());
    };
    insole.onError = function (error) {
      const message = error && error.message ? error.message : String(error);
      if (state.capture) state.capture.errors.push(message);
      log(`INSOLE ${id + 1}: ${message}`, 'error');
    };
    insole.onDisconnect = function () {
      if (state.capture) state.capture.disconnectEvents.push({ at: nowMs(), wallTime: new Date().toISOString() });
      log(`INSOLE ${id + 1}: disconnected`, 'warn');
      renderDevice(state);
    };
    insole.onReconnectAttempt = function (info) {
      const previousError = state.insole._lastAutoReconnectError;
      const previousMessage = previousError
        ? `${previousError.code ? `${previousError.code}: ` : ''}${previousError.message || previousError}`
        : null;
      if (state.capture) {
        state.capture.reconnectAttempts.push({
          at: nowMs(),
          wallTime: new Date().toISOString(),
          attempt: info.attempt,
          previousError: previousMessage,
        });
      }
      log(`INSOLE ${id + 1}: reconnect attempt ${info.attempt}/${info.maxAttempts}`
        + (previousMessage ? ` (previous: ${previousMessage})` : ''), 'warn');
    };
    insole.onReconnectSuccess = function (info) {
      state.reconnectCount += 1;
      if (state.capture) {
        state.capture.reconnectEvents.push({
          at: nowMs(),
          rawCountAtReconnect: state.capture.rawPackets.length,
          attempt: info.attempt,
        });
      }
      log(`INSOLE ${id + 1}: reconnected (attempt ${info.attempt})`, 'info');
      renderDevice(state);
    };
    insole.onReconnectFailed = function (info) {
      const error = info.error;
      const message = error ? `${error.code ? `${error.code}: ` : ''}${error.message || error}` : 'unknown error';
      log(`INSOLE ${id + 1}: reconnect failed (${info.maxAttempts} attempts) — ${message}`, 'error');
    };

    gait.onRaw = function (_deviceId, packet) {
      if (!state.capture) return;
      const copy = { ...packet };
      state.capture.decodedPackets.push({ at: nowMs(), packet: copy });
      if (state.currentRaw) {
        state.currentRaw.mismatchFields = Metrics.compareDecoded(state.currentRaw.independent, copy);
      }
    };
    gait.onGait = function (_deviceId, row) {
      if (!state.capture) return;
      const copy = { ...row, hostReceivedAt: nowMs(), hostReceivedTime: new Date().toISOString() };
      state.capture.rows.push(copy);
      state.lastRow = copy;
      renderDevice(state);
    };
    gait.onError = function (error) {
      const message = error && error.message ? error.message : String(error);
      if (state.capture) state.capture.errors.push(message);
      log(`Gait ${id + 1}: ${message}`, 'error');
    };

    return state;
  }

  function renderDevice(state) {
    const connected = deviceConnected(state);
    const capture = state.capture;
    // 計測停止後も直近captureの受信数・レートをカードに残す。
    // 判定表にはrecentCaptureが残る一方、ここだけ0/-へ戻るとデータ消失に見えるため。
    const displayCapture = capture || state.recentCapture;
    const rawCount = displayCapture ? displayCapture.rawPackets.length : 0;
    const rawRate = displayCapture && rawCount > 1 ? captureRate(displayCapture) : null;
    const row = state.lastRow;
    const info = sanitizedDeviceInfo(state.insole.device_information);
    byId(`device-state-${state.id}`).textContent = connected ? 'connected' : state.insole.connectionState;
    byId(`device-state-${state.id}`).className = `pill ${connected ? 'pass' : 'neutral'}`;
    byId(`device-side-${state.id}`).textContent = state.side;
    byId(`device-battery-${state.id}`).textContent = info && info.battery !== null ? String(info.battery) : '-';
    byId(`device-press-${state.id}`).textContent = `${state.lastPressRate.toFixed(0)} Hz`;
    byId(`device-gait-rate-${state.id}`).textContent = rawRate === null ? '-' : `${rawRate.toFixed(1)} Hz`;
    byId(`device-raw-${state.id}`).textContent = String(rawCount);
    byId(`device-rows-${state.id}`).textContent = displayCapture ? String(displayCapture.rows.length) : '0';
    byId(`device-step-${state.id}`).textContent = row ? String(row.step_number) : '-';
    byId(`device-stride-${state.id}`).textContent = row ? `${fmt(row.stride_norm_m)} m` : '-';
    byId(`device-cadence-${state.id}`).textContent = row ? `${fmt(row.cadence_hz)} Hz` : '-';
    byId(`device-speed-${state.id}`).textContent = row ? `${fmt(row.speed_mps)} m/s` : '-';
    byId(`device-class-${state.id}`).textContent = row ? `${row.foot_strike} / ${row.pronation_type}` : '-';
    byId(`connect-${state.id}`).disabled = operationBusy || walkRunning || connected;
    byId(`disconnect-${state.id}`).disabled = operationBusy || walkRunning || !connected;
  }

  function renderAllDevices() {
    states.forEach(renderDevice);
    const connectedCount = states.filter(deviceConnected).length;
    byId('smoke-run').disabled = operationBusy || walkRunning || connectedCount === 0;
    byId('walk-start').disabled = operationBusy || connectedCount === 0 || walkRunning;
    byId('reconnect-start').disabled = operationBusy || connectedCount === 0 || walkRunning;
    byId('walk-stop').disabled = !walkRunning;
  }

  async function connectDevice(state) {
    if (operationBusy) return;
    operationBusy = true;
    renderAllDevices();
    try {
      log(`INSOLE ${state.id + 1}: chooserを開きます`);
      await state.insole.begin('SENSOR_VALUES', {
        streamingMode: 4,
        autoReconnect: true,
        forceDeviceSelection: true,
        connectTimeoutMs: 8000,
        reconnectIntervalMs: 2000,
        reconnectMaxAttempts: 10,
      });
      state.side = sideFromInfo(state.insole.device_information);
      log(`INSOLE ${state.id + 1}: connected, mount=${state.side}`);
    } catch (error) {
      log(`INSOLE ${state.id + 1}: connect failed — ${error.message || error}`, 'error');
    } finally {
      operationBusy = false;
      renderAllDevices();
    }
  }

  async function disconnectDevice(state) {
    if (operationBusy) return;
    operationBusy = true;
    renderAllDevices();
    try {
      await state.gait.stop();
      state.insole.reset();
      state.side = '?';
      state.lastRow = null;
      log(`INSOLE ${state.id + 1}: reset`);
    } finally {
      operationBusy = false;
      renderAllDevices();
    }
  }

  async function beginCapture(kind) {
    const active = states.filter(deviceConnected);
    if (active.length === 0) throw new Error('接続済みのINSOLEがありません');
    for (const state of active) {
      state.capture = createCapture(state, kind);
      state.recentCapture = null;
      state.currentRaw = null;
      state.lastRow = null;
    }
    const results = await Promise.all(active.map((state) => state.gait.start()));
    const started = [];
    results.forEach((ok, index) => {
      const state = active[index];
      if (ok) {
        started.push(state);
      } else {
        state.capture.errors.push('gait.start() returned false');
        state.capture = null;
      }
    });
    if (started.length === 0) throw new Error('STEP_ANALYSIS notifyを開始できませんでした');
    log(`${kind}: ${started.length} device(s) started`);
    return started;
  }

  async function endCapture(activeStates) {
    const stopStartedAt = nowMs();
    await Promise.all(activeStates.map(async (state) => {
      try {
        await withTimeout(state.gait.stop(), STOP_TIMEOUT_MS, `INSOLE ${state.id + 1} gait.stop()`);
      } catch (error) {
        const message = error && error.message ? error.message : String(error);
        if (state.capture) state.capture.errors.push(message);
        state.gait._running = false;
        if (state.insole && state.insole._gaitNotifySink) delete state.insole._gaitNotifySink;
        log(`${message}; capture finalization continues`, 'error');
      }
    }));
    const captures = [];
    for (const state of activeStates) {
      const capture = state.capture;
      if (!capture) continue;
      capture.stoppedAt = stopStartedAt;
      capture.wallStoppedAt = new Date().toISOString();
      const seconds = Math.max(0.001, (capture.stoppedAt - capture.startedAt) / 1000);
      capture.sensorRateHz = (state.pressCount - capture.sensorStartCount) / seconds;
      state.capture = null;
      state.recentCapture = capture;
      state.lateMonitorStart = nowMs() + LATE_GRACE_MS;
      state.lateMonitorEnd = state.lateMonitorStart + LATE_MONITOR_MS;
      captures.push(capture);
    }
    await wait(LATE_GRACE_MS + LATE_MONITOR_MS + 50);
    log(`capture stopped (${captures.length} device(s))`);
    renderAllDevices();
    return captures;
  }

  function captureRate(capture) {
    if (!capture || capture.rawPackets.length < 2) return 0;
    const first = capture.rawPackets[0].at;
    const last = capture.rawPackets[capture.rawPackets.length - 1].at;
    return last > first ? (capture.rawPackets.length - 1) / ((last - first) / 1000) : 0;
  }

  async function runSmokeTest() {
    if (operationBusy) return;
    operationBusy = true;
    states.forEach((state) => { state.smokeCycles = []; });
    byId('smoke-status').textContent = '実行中…';
    renderAllDevices();
    try {
      for (let cycle = 1; cycle <= 2; cycle += 1) {
        byId('smoke-status').textContent = `cycle ${cycle}/2: 3秒受信中…`;
        const active = await beginCapture(`smoke-${cycle}`);
        await wait(3000);
        const captures = await endCapture(active);
        for (const capture of captures) {
          const state = states[capture.deviceId];
          state.smokeCycles.push({
            cycle,
            rawCount: capture.rawPackets.length,
            rateHz: captureRate(capture),
            sensorRateHz: capture.sensorRateHz,
            postStopPackets: capture.postStopPackets,
          });
        }
        await wait(400);
      }
      renderSmokeResults();
      byId('smoke-status').textContent = '完了';
    } catch (error) {
      byId('smoke-status').textContent = `FAIL: ${error.message || error}`;
      log(`smoke failed — ${error.message || error}`, 'error');
    } finally {
      operationBusy = false;
      renderAllDevices();
    }
  }

  function renderSmokeResults() {
    const rows = [];
    for (const state of states) {
      for (const cycle of state.smokeCycles) {
        const ok = cycle.rawCount > 0 && cycle.rateHz >= 20 && cycle.rateHz <= 90
          && cycle.sensorRateHz >= 50 && cycle.postStopPackets === 0;
        rows.push(`<tr><td>INSOLE ${state.id + 1} (${escapeHtml(state.side)})</td><td>${cycle.cycle}</td>`
          + `<td><span class="result ${ok ? 'pass' : 'fail'}">${ok ? 'PASS' : 'FAIL'}</span></td>`
          + `<td>${cycle.rawCount} raw / ${cycle.rateHz.toFixed(1)} Hz / press ${cycle.sensorRateHz.toFixed(1)} Hz / post-stop ${cycle.postStopPackets}</td></tr>`);
      }
    }
    byId('smoke-results').innerHTML = rows.join('') || '<tr><td colspan="4">未実行</td></tr>';
  }

  function makeOverview(step) {
    return {
      type: 'overview', step_number: step, gait_type: 'walk', stride_direction: 'forward',
      calorie: 0, distance_m: step, stance_phase_s: 0.7, swing_phase_s: 0.5,
    };
  }
  function makeStride(step) {
    return { type: 'stride', step_number: step, foot_angle: -10, stride_x: 1, stride_y: 0, stride_z: 0 };
  }
  function makePronation(step) {
    return { type: 'pronation', step_number: step, landing_force: 0.4, pronation_x: -10, pronation_y: -9.4, pronation_z: 0 };
  }

  async function implementationSelfTests() {
    const tests = [];
    function add(name, ok, observed, expected) { tests.push({ name, ok, observed, expected }); }
    function deferred() {
      let resolve;
      const promise = new Promise((done) => { resolve = done; });
      return { promise, resolve };
    }

    try {
      const dv = new DataView(new ArrayBuffer(20));
      dv.setUint8(0, 51);
      dv.setUint8(1, 1);
      dv.setUint16(2, 42, false);
      dv.setFloat32(4, -12.5, false);
      dv.setFloat32(8, 1.1, false);
      dv.setFloat32(12, 0.2, false);
      dv.setFloat32(16, 0.05, false);
      const independent = Metrics.decodeRawPacket(dv);
      const sdk = OrpheInsoleGait.decodeAnalysisPacket(dv);
      const mismatches = Metrics.compareDecoded(independent, sdk);
      add('Independent decoder fixture', mismatches.length === 0, mismatches.length ? mismatches.join(', ') : 'all fields match', '0 mismatches');
    } catch (error) {
      add('Independent decoder fixture', false, String(error), '0 mismatches');
    }

    try {
      const invalid = OrpheInsoleGait.buildGaitRow(1, {
        overview: { gait_type: 'walk', stride_direction: 'forward', distance_m: 0, stance_phase_s: -1, swing_phase_s: 0.5, calorie: 0 },
        stride: { foot_angle: 0, stride_x: 1, stride_y: 0, stride_z: 0 },
        pronation: { landing_force: 0, pronation_x: 0, pronation_y: 0, pronation_z: 0 },
      });
      const ok = invalid.duration_s === null && invalid.cadence_hz === null && invalid.speed_mps === null;
      add('FW -1 sentinel handling', ok,
        `duration=${invalid.duration_s}, cadence=${invalid.cadence_hz}, speed=${invalid.speed_mps}`,
        'all derived values null');
    } catch (error) {
      add('FW -1 sentinel handling', false, String(error), 'all derived values null');
    }

    try {
      const aggregator = new OrpheInsoleGait.GaitAggregator();
      for (let step = 65280; step <= 65535; step += 1) {
        aggregator.add(makeOverview(step));
        aggregator.add(makeStride(step));
        aggregator.add(makePronation(step));
      }
      const first = [makeOverview(0), makeStride(0), makePronation(0)].map((packet) => aggregator.add(packet)).filter(Boolean);
      const resend = [makeOverview(0), makeStride(0), makePronation(0)].map((packet) => aggregator.add(packet)).filter(Boolean);
      add('uint16 step wrap dedup', first.length === 1 && resend.length === 0,
        `first emits=${first.length}, resend emits=${resend.length}`,
        '1 then 0');
    } catch (error) {
      add('uint16 step wrap dedup', false, String(error), '1 then 0');
    }

    try {
      let resolveStart;
      let stopCalls = 0;
      const mock = {
        id: 0,
        ORPHE_OTHER_SERVICE: 'service',
        ORPHE_STEP_ANALYSIS: 'characteristic',
        isConnected: () => true,
        setUUID: () => {},
        startNotify: () => new Promise((resolve) => { resolveStart = resolve; }),
        stopNotify: async () => { stopCalls += 1; },
      };
      const gait = new OrpheInsoleGait(mock);
      const startPromise = gait.start();
      await Promise.resolve();
      const stopPromise = gait.stop();
      resolveStart();
      await Promise.all([startPromise, stopPromise]);
      const ok = !gait.isRunning && !mock._gaitNotifySink && stopCalls === 1;
      add('start/stop race serialization', ok,
        `running=${gait.isRunning}, sink=${!!mock._gaitNotifySink}, stopCalls=${stopCalls}`,
        'running=false, sink=false, stopCalls=1');
    } catch (error) {
      add('start/stop race serialization', false, String(error), 'cleanly stopped');
    }

    try {
      let startCalls = 0;
      const disconnectListeners = new Set();
      const bluetoothDevice = {
        gatt: { connected: true },
        addEventListener(type, listener) {
          if (type === 'gattserverdisconnected') disconnectListeners.add(listener);
        },
        removeEventListener(type, listener) {
          if (type === 'gattserverdisconnected') disconnectListeners.delete(listener);
        },
      };
      const mock = {
        id: 0,
        ORPHE_OTHER_SERVICE: 'service',
        ORPHE_STEP_ANALYSIS: 'characteristic',
        bluetoothDevice,
        _afterReconnectSuccess: [],
        isConnected: () => bluetoothDevice.gatt.connected,
        setUUID: () => {},
        startNotify: async () => { startCalls += 1; },
        stopNotify: async () => {},
      };
      const gait = new OrpheInsoleGait(mock);
      await gait.start();
      gait.rows.push({ step_number: 10 });
      bluetoothDevice.gatt.connected = false;
      disconnectListeners.forEach((listener) => listener({ target: bluetoothDevice }));
      bluetoothDevice.gatt.connected = true;
      await gait.start();
      add('explicit restart after reconnect', startCalls === 2 && gait.rows.length === 1,
        `startNotify calls=${startCalls}, rows=${gait.rows.length}`, '2 calls, collected rows preserved');
      await gait.stop();
    } catch (error) {
      add('explicit restart after reconnect', false, String(error), '2 startNotify calls');
    }

    try {
      const firstStartGate = deferred();
      let startCalls = 0;
      let stopCalls = 0;
      let transitionCode = null;
      const mock = {
        id: 0,
        ORPHE_OTHER_SERVICE: 'service',
        ORPHE_STEP_ANALYSIS: 'characteristic',
        isConnected: () => true,
        setUUID: () => {},
        startNotify: async () => {
          startCalls += 1;
          if (startCalls === 1) await firstStartGate.promise;
        },
        stopNotify: async () => { stopCalls += 1; },
      };
      const gait = new OrpheInsoleGait(mock);
      gait.onError = (error) => { transitionCode = error.code || null; };
      const oldStart = gait.start();
      await Promise.resolve();
      await gait.stop();
      const earlyRestart = await gait.start();
      firstStartGate.resolve();
      await oldStart;
      const retry = await gait.start();
      const ok = earlyRestart === false && transitionCode === 'GAIT_TRANSITION_PENDING'
        && retry === true && startCalls === 2 && stopCalls === 1;
      add('pending start blocks unsafe restart', ok,
        `early=${earlyRestart}, code=${transitionCode}, retry=${retry}, starts=${startCalls}, stops=${stopCalls}`,
        'early=false/GAIT_TRANSITION_PENDING, retry=true, starts=2');
      await gait.stop();
    } catch (error) {
      add('pending start blocks unsafe restart', false, String(error), 'safe retry after pending transition');
    }

    try {
      const stopGate = deferred();
      const characteristic = {
        notifying: false,
        startCalls: 0,
        stopCalls: 0,
        listeners: [],
        async startNotifications() {
          this.startCalls += 1;
          this.notifying = true;
          return this;
        },
        async stopNotifications() {
          this.stopCalls += 1;
          await stopGate.promise;
          this.notifying = false;
          return this;
        },
        addEventListener(_type, handler) { this.listeners.push(handler); },
        removeEventListener(_type, handler) {
          const index = this.listeners.indexOf(handler);
          if (index >= 0) this.listeners.splice(index, 1);
        },
      };
      const target = new OrpheInsole(0);
      target.scan = async () => {};
      target.connectGATT = async () => {};
      target._characteristicFor = () => characteristic;
      target.onError = () => {};
      await target.startNotify('STEP_ANALYSIS');
      const stopping = target.stopNotify('STEP_ANALYSIS');
      while (characteristic.stopCalls === 0) await wait(0);
      const restarting = target.startNotify('STEP_ANALYSIS');
      await Promise.resolve();
      const queued = characteristic.startCalls === 1;
      stopGate.resolve();
      await Promise.all([stopping, restarting]);
      const ok = queued && characteristic.notifying && characteristic.startCalls === 2
        && characteristic.listeners.length === 1;
      add('Core notify final-state serialization', ok,
        `queued=${queued}, notifying=${characteristic.notifying}, starts=${characteristic.startCalls}, listeners=${characteristic.listeners.length}`,
        'restart waits for stop; final ON with 1 listener');
    } catch (error) {
      add('Core notify final-state serialization', false, String(error), 'final ON with one listener');
    }

    try {
      const connectGate = deferred();
      const connectEntered = deferred();
      function notifyCharacteristic() {
        return {
          notifying: false,
          stopCalls: 0,
          listeners: [],
          async startNotifications() { this.notifying = true; return this; },
          async stopNotifications() { this.stopCalls += 1; this.notifying = false; return this; },
          addEventListener(_type, handler) { this.listeners.push(handler); },
          removeEventListener(_type, handler) {
            const index = this.listeners.indexOf(handler);
            if (index >= 0) this.listeners.splice(index, 1);
          },
        };
      }
      const oldCharacteristic = notifyCharacteristic();
      const currentCharacteristic = notifyCharacteristic();
      let selected = oldCharacteristic;
      let connectCalls = 0;
      const target = new OrpheInsole(0);
      target.scan = async () => {};
      target.connectGATT = async () => {
        connectCalls += 1;
        if (connectCalls === 1) {
          connectEntered.resolve();
          await connectGate.promise;
        }
      };
      target._characteristicFor = () => selected;
      target.onError = () => {};
      const staleStop = target.stopNotify('STEP_ANALYSIS');
      await connectEntered.promise;
      target._invalidateNotifyOperations();
      selected = currentCharacteristic;
      await target.startNotify('STEP_ANALYSIS');
      connectGate.resolve();
      await staleStop;
      const ok = currentCharacteristic.notifying && currentCharacteristic.stopCalls === 0
        && currentCharacteristic.listeners.length === 1;
      add('stale GATT operation isolation', ok,
        `current ON=${currentCharacteristic.notifying}, current stopCalls=${currentCharacteristic.stopCalls}, listeners=${currentCharacteristic.listeners.length}`,
        'old stop never touches current GATT');
    } catch (error) {
      add('stale GATT operation isolation', false, String(error), 'current GATT remains notifying');
    }

    renderSelfTests(tests);
    return tests;
  }

  function renderSelfTests(tests) {
    byId('self-test-results').innerHTML = tests.map((test) => `<tr>`
      + `<td>${escapeHtml(test.name)}</td>`
      + `<td><span class="result ${test.ok ? 'pass' : 'fail'}">${test.ok ? 'PASS' : 'FAIL'}</span></td>`
      + `<td>${escapeHtml(test.observed)}</td><td>${escapeHtml(test.expected)}</td></tr>`).join('');
    const failed = tests.filter((test) => !test.ok).length;
    byId('self-test-summary').textContent = failed === 0
      ? 'Implementation self-tests: PASS'
      : `Implementation self-tests: ${failed} FAIL — device testingより先にPR修正が必要です`;
    byId('self-test-summary').className = `banner ${failed === 0 ? 'pass' : 'fail'}`;
  }

  function numericSetting(id, fallback, min, max) {
    const value = Number(byId(id).value);
    return finite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  }

  function reportOptions() {
    const manual = Number(byId('manual-steps').value);
    return {
      excludeLastRows: numericSetting('exclude-last', 1, 0, 5),
      targetDistanceM: numericSetting('course-distance', 10, 0, 1000),
      manualTotalSteps: finite(manual) && manual > 0 ? manual : null,
    };
  }

  async function beep(frequency, durationMs) {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      const context = new Context();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.08;
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + durationMs / 1000);
      oscillator.addEventListener('ended', () => context.close());
    } catch { /* sound is optional */ }
  }

  async function countdown(seconds) {
    for (let remaining = seconds; remaining > 0; remaining -= 1) {
      byId('walk-status').textContent = `${remaining}秒後に開始します…`;
      await beep(440, 80);
      await wait(1000);
    }
  }

  async function startWalk(kind = 'straight-walk', forcedDurationSeconds = null) {
    if (operationBusy || walkRunning) return;
    operationBusy = true;
    renderAllDevices();
    try {
      const delaySeconds = numericSetting('countdown-seconds', 5, 0, 30);
      const durationSeconds = forcedDurationSeconds === null
        ? numericSetting('capture-seconds', 60, 5, 300)
        : forcedDurationSeconds;
      await countdown(delaySeconds);
      const active = await beginCapture(kind);
      walkRunning = true;
      currentCaptureKind = kind;
      operationBusy = false;
      renderAllDevices();
      const instruction = kind === 'reconnect'
        ? '電波範囲外へ離れ、切断後に戻って数歩歩いてください'
        : '自然な直線歩行をしてください';
      byId('walk-status').textContent = `計測中（${durationSeconds}秒）— ${instruction}`;
      if (kind === 'reconnect') byId('reconnect-status').textContent = '計測中 — 切断後に戻って数歩歩いてください';
      await beep(880, 250);
      const started = nowMs();
      walkTimer = setInterval(() => {
        const remaining = Math.max(0, durationSeconds - (nowMs() - started) / 1000);
        byId('walk-status').textContent = `計測中: 残り ${remaining.toFixed(1)} 秒`;
      }, 100);
      setTimeout(() => {
        if (walkRunning) finishWalk(active);
      }, durationSeconds * 1000);
    } catch (error) {
      operationBusy = false;
      walkRunning = false;
      currentCaptureKind = null;
      byId('walk-status').textContent = `FAIL: ${error.message || error}`;
      if (kind === 'reconnect') byId('reconnect-status').textContent = `FAIL: ${error.message || error}`;
      log(`walk start failed — ${error.message || error}`, 'error');
      renderAllDevices();
    }
  }

  async function finishWalk(activeOverride) {
    if (!walkRunning || operationBusy) return;
    operationBusy = true;
    walkRunning = false;
    if (walkTimer) clearInterval(walkTimer);
    walkTimer = null;
    renderAllDevices();
    byId('walk-status').textContent = '停止・300ms後コールバック確認中…';
    await beep(220, 350);
    try {
      const finishedKind = currentCaptureKind;
      const active = activeOverride || states.filter((state) => state.capture);
      lastCaptures = await endCapture(active);
      for (const capture of lastCaptures) capture.smokeCycles = states[capture.deviceId].smokeCycles.slice();
      analyzeLastCapture();
      if (finishedKind === 'reconnect') renderReconnectResults(lastCaptures);
      byId('walk-status').textContent = `完了: ${lastCaptures.reduce((sum, capture) => sum + capture.rows.length, 0)} rows`;
    } catch (error) {
      byId('walk-status').textContent = `停止エラー: ${error.message || error}`;
      log(`walk stop failed — ${error.message || error}`, 'error');
    } finally {
      currentCaptureKind = null;
      operationBusy = false;
      renderAllDevices();
    }
  }

  function renderReconnectResults(captures) {
    const reconnectCaptures = (captures || []).filter((capture) => capture.kind === 'reconnect');
    if (reconnectCaptures.length === 0) {
      byId('reconnect-results').innerHTML = '<tr><td colspan="4">未実行</td></tr>';
      byId('reconnect-status').textContent = '未実行';
      return;
    }
    const summaries = reconnectCaptures.map(Metrics.evaluateReconnectCapture);
    byId('reconnect-results').innerHTML = summaries.map((summary) => {
      const pressAfter = summary.cycles.reduce((sum, cycle) => sum + cycle.pressAfter, 0);
      const rawAfter = summary.cycles.reduce((sum, cycle) => sum + cycle.rawAfter, 0);
      const rowsAfter = summary.cycles.reduce((sum, cycle) => sum + cycle.rowsAfter, 0);
      const attempts = summary.cycles.reduce((sum, cycle) => sum + cycle.attemptCount, 0);
      const latency = summary.cycles.length && summary.cycles[0].latencyMs !== null
        ? `${(summary.cycles[0].latencyMs / 1000).toFixed(1)}s`
        : '-';
      return `<tr><td>INSOLE ${summary.deviceId + 1} (${escapeHtml(summary.side)})</td>`
        + `<td>${summary.disconnectCount} / ${summary.reconnectCount}（attempt ${attempts}, ${latency}）</td>`
        + `<td>press ${pressAfter} / raw ${rawAfter} / rows ${rowsAfter}</td>`
        + `<td><span class="result ${summary.status}">${statusIcon(summary.status)}</span></td></tr>`;
    }).join('');
    const passed = summaries.filter((summary) => summary.status === 'pass').length;
    byId('reconnect-status').textContent = passed === summaries.length
      ? `PASS — ${passed}/${summaries.length}台でSENSOR_VALUESとSTEP_ANALYSISが復旧`
      : `FAIL — ${passed}/${summaries.length}台のみ復旧。ログとJSONを保存してください`;
  }

  function analyzeLastCapture() {
    if (lastCaptures.length === 0) return;
    lastReport = Metrics.evaluateCaptures(lastCaptures, reportOptions());
    renderReport(lastReport);
    byId('export-json').disabled = false;
    byId('export-rows').disabled = false;
    byId('export-raw').disabled = false;
    byId('copy-markdown').disabled = false;
  }

  function renderChecks(checks, scope) {
    return checks.map((check) => `<tr class="check-${check.status}"><td>${escapeHtml(scope)}</td>`
      + `<td>${escapeHtml(check.label)}</td><td><span class="result ${check.status}">${statusIcon(check.status)}</span></td>`
      + `<td>${escapeHtml(check.observed)}</td><td>${escapeHtml(check.expected)}</td></tr>`).join('');
  }

  function renderReport(report) {
    const summary = `${report.status.toUpperCase()} — PASS ${report.counts.pass} / WARN ${report.counts.warn} / FAIL ${report.counts.fail}`;
    byId('report-summary').textContent = summary;
    byId('report-summary').className = `banner ${report.status}`;
    let rows = '';
    for (const device of report.devices) {
      rows += renderChecks(device.checks, `INSOLE ${device.summary.deviceId + 1} (${device.summary.side})`);
    }
    rows += renderChecks(report.pairChecks, 'PAIR');
    byId('report-checks').innerHTML = rows;

    byId('report-device-summaries').innerHTML = report.devices.map(({ summary: item }) => `<article class="summary-card">`
      + `<h3>INSOLE ${item.deviceId + 1} (${escapeHtml(item.side)})</h3>`
      + `<dl><div><dt>raw / decoded</dt><dd>${item.rawCount} / ${item.decodedCount}</dd></div>`
      + `<div><dt>notify rate</dt><dd>${fmt(item.packetRateHz, 1)} Hz</dd></div>`
      + `<div><dt>rows / analyzed</dt><dd>${item.rowCount} / ${item.analyzedRowCount}</dd></div>`
      + `<div><dt>step gaps</dt><dd>${item.continuity.missedSteps}</dd></div>`
      + `<div><dt>median stride</dt><dd>${fmt(item.stats.stride.median, 3)} m</dd></div>`
      + `<div><dt>median cadence</dt><dd>${fmt(item.stats.cadence.median, 3)} Hz</dd></div>`
      + `<div><dt>median speed</dt><dd>${fmt(item.stats.speed.median, 3)} m/s</dd></div>`
      + `<div><dt>segment distance</dt><dd>${fmt(item.segmentDistanceM, 2)} m</dd></div></dl></article>`).join('');
  }

  function csvCell(value) {
    if (value === null || value === undefined) return '';
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 1000);
  }

  function timestampSlug() {
    return new Date().toISOString().replaceAll(':', '').replaceAll('-', '').replace(/\.\d+Z$/, 'Z');
  }

  function exportRowsCsv() {
    const fields = [
      'device_id', 'side', 'host_received_time', 'step_number', 'gait_type', 'stride_direction', 'distance_m',
      'stance_phase_s', 'swing_phase_s', 'duration_s', 'cadence_hz', 'speed_mps', 'foot_angle_deg',
      'stride_x_m', 'stride_y_m', 'stride_z_m', 'stride_norm_m', 'landing_force', 'strike_angle_deg',
      'foot_strike', 'pronation_deg', 'pronation_type', 'pronation_z_deg', 'calorie',
    ];
    const lines = [fields.join(',')];
    for (const capture of lastCaptures) {
      for (const row of capture.rows) {
        const record = { device_id: capture.deviceId, side: capture.side, host_received_time: row.hostReceivedTime, ...row };
        lines.push(fields.map((field) => csvCell(record[field])).join(','));
      }
    }
    downloadText(`gait-validation-rows-${timestampSlug()}.csv`, `${lines.join('\n')}\n`, 'text/csv');
  }

  function exportRawCsv() {
    const fields = ['device_id', 'side', 'host_time', 'length', 'header', 'subheader', 'step_number', 'hex', 'decoder_mismatches'];
    const lines = [fields.join(',')];
    for (const capture of lastCaptures) {
      for (const raw of capture.rawPackets) {
        const values = [capture.deviceId, capture.side, raw.hostTime, raw.length, raw.header, raw.subheader,
          raw.stepNumber, raw.hex, (raw.mismatchFields || []).join('|')];
        lines.push(values.map(csvCell).join(','));
      }
    }
    downloadText(`gait-validation-raw-${timestampSlug()}.csv`, `${lines.join('\n')}\n`, 'text/csv');
  }

  function reportMeta() {
    return {
      page: 'examples/gait-analysis-validation',
      target: 'ORPHE-INSOLE.js PR #50 / codex/pr50-gait-lifecycle-fix',
      generatedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      secureContext: window.isSecureContext,
      note: 'Bluetooth device IDs and names are intentionally omitted from exports.',
    };
  }

  function exportJson() {
    const payload = { meta: reportMeta(), report: lastReport, captures: lastCaptures };
    downloadText(`gait-validation-report-${timestampSlug()}.json`, JSON.stringify(payload, null, 2), 'application/json');
  }

  function markdownReport() {
    const lines = [
      '# ORPHE INSOLE PR #50 gait validation',
      '',
      `- Date: ${new Date().toISOString()}`,
      `- Result: **${lastReport.status.toUpperCase()}**`,
      `- Checks: PASS ${lastReport.counts.pass} / WARN ${lastReport.counts.warn} / FAIL ${lastReport.counts.fail}`,
      `- Terminal rows excluded from plausibility: ${lastReport.options.excludeLastRows}`,
      '',
      '## Device summaries',
      '',
    ];
    for (const { summary } of lastReport.devices) {
      lines.push(`- INSOLE ${summary.deviceId + 1} (${summary.side}): raw ${summary.rawCount}, rows ${summary.rowCount}, `
        + `notify ${fmt(summary.packetRateHz, 1)} Hz, missed ${summary.continuity.missedSteps}, `
        + `stride median ${fmt(summary.stats.stride.median, 3)} m, speed median ${fmt(summary.stats.speed.median, 3)} m/s`);
    }
    const reconnectSummaries = lastCaptures
      .filter((capture) => capture.kind === 'reconnect')
      .map(Metrics.evaluateReconnectCapture);
    if (reconnectSummaries.length > 0) {
      lines.push('', '## Reconnect recovery', '');
      for (const summary of reconnectSummaries) {
        const pressAfter = summary.cycles.reduce((sum, cycle) => sum + cycle.pressAfter, 0);
        const rawAfter = summary.cycles.reduce((sum, cycle) => sum + cycle.rawAfter, 0);
        const rowsAfter = summary.cycles.reduce((sum, cycle) => sum + cycle.rowsAfter, 0);
        lines.push(`- INSOLE ${summary.deviceId + 1} (${summary.side}): **${summary.status.toUpperCase()}**, `
          + `disconnect ${summary.disconnectCount}, reconnect ${summary.reconnectCount}, `
          + `post-reconnect press ${pressAfter}, raw ${rawAfter}, rows ${rowsAfter}`);
      }
    }
    lines.push('', '## Checks', '', '| Scope | Check | Result | Observed | Expected |', '|---|---|---|---|---|');
    for (const device of lastReport.devices) {
      for (const check of device.checks) {
        lines.push(`| INSOLE ${device.summary.deviceId + 1} (${device.summary.side}) | ${check.label} | ${statusIcon(check.status)} | ${check.observed} | ${check.expected} |`);
      }
    }
    for (const check of lastReport.pairChecks) {
      lines.push(`| PAIR | ${check.label} | ${statusIcon(check.status)} | ${check.observed} | ${check.expected} |`);
    }
    lines.push('', '> Engineering sanity checks only. This page does not establish clinical validity or diagnostic performance.');
    return `${lines.join('\n')}\n`;
  }

  async function copyMarkdown() {
    const text = markdownReport();
    try {
      await navigator.clipboard.writeText(text);
      log('Markdown report copied');
    } catch {
      downloadText(`gait-validation-report-${timestampSlug()}.md`, text, 'text/markdown');
      log('Clipboard unavailable; Markdown downloaded', 'warn');
    }
  }

  function initialize() {
    if (!window.isSecureContext || !navigator.bluetooth) {
      byId('environment-warning').hidden = false;
      byId('environment-warning').textContent = !window.isSecureContext
        ? 'Web Bluetoothにはsecure contextが必要です。localhostのHTTPサーバーから開いてください。'
        : 'このブラウザはWeb Bluetoothに対応していません。Mac版ChromeまたはEdgeを使用してください。';
    }

    for (let id = 0; id < 2; id += 1) states.push(createDeviceState(id));
    states.forEach((state) => {
      byId(`connect-${state.id}`).addEventListener('click', () => connectDevice(state));
      byId(`disconnect-${state.id}`).addEventListener('click', () => disconnectDevice(state));
    });
    byId('self-test-run').addEventListener('click', implementationSelfTests);
    byId('smoke-run').addEventListener('click', runSmokeTest);
    byId('walk-start').addEventListener('click', () => startWalk('straight-walk'));
    byId('reconnect-start').addEventListener('click', () => startWalk('reconnect', 60));
    byId('walk-stop').addEventListener('click', () => finishWalk());
    byId('reanalyze').addEventListener('click', analyzeLastCapture);
    byId('export-json').addEventListener('click', exportJson);
    byId('export-rows').addEventListener('click', exportRowsCsv);
    byId('export-raw').addEventListener('click', exportRawCsv);
    byId('copy-markdown').addEventListener('click', copyMarkdown);

    setInterval(() => {
      states.forEach((state) => {
        state.lastPressRate = state.pressCount - state.lastPressSnapshot;
        state.lastPressSnapshot = state.pressCount;
      });
      renderAllDevices();
    }, 1000);

    renderSmokeResults();
    renderReconnectResults([]);
    renderAllDevices();
    implementationSelfTests();
    log('Validation page ready');
  }

  window.addEventListener('load', initialize);
})();
