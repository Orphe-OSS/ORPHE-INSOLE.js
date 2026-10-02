'use strict';

// 実機の校正通知を記録し、通常のSDK通知処理にも同じDataViewを渡す。
(() => {
  const records = [];
  const slots = [];
  // テストADCは専用インスタンスへ渡し、実機の通知やシリアル番号に混ぜない。
  const probe = new OrpheInsole(99);
  probe.setup();
  let probeSerial = 0;
  const environment = document.getElementById('environment');
  const supported = !!navigator.bluetooth && window.isSecureContext;
  environment.textContent = supported
    ? 'Web Bluetooth利用可能。端末選択画面でINSから始まる機器を選択してください。'
    : 'Web Bluetoothが利用できません。Chrome / EdgeでlocalhostまたはHTTPSから開いてください。';

  function identity(insole) {
    return { name: insole.bluetoothDevice?.name ?? null, id: insole.bluetoothDevice?.id ?? null };
  }

  function copy(value) {
    return value == null ? null : JSON.parse(JSON.stringify(value));
  }

  function validCalibration(rows) {
    return Array.isArray(rows) && rows.length === 6 && rows.every((row, index) =>
      row.sensor_index === index && (row.func === 0 || row.func === 1) &&
      Array.isArray(row.coeffs) && row.coeffs.length === 5 && row.coeffs.every(Number.isFinite));
  }

  function record(slot, type, detail) {
    const entry = { at: new Date().toISOString(), slot: slot.id, device: identity(slot.insole), type, ...detail };
    records.push(entry);
    // 長時間開いた場合も圧力サンプルを全保存しない。試行は別途保持する。
    if (records.length > 1000) records.shift();
    slot.log.textContent = records.filter(item => item.slot === slot.id).slice(-30)
      .map(item => JSON.stringify(item)).join('\n');
  }

  function updateControls(slot) {
    const connected = slot.insole.isConnected();
    slot.connect.disabled = !supported || slot.busy || connected;
    slot.retry.disabled = !connected || slot.busy;
    slot.disconnect.disabled = !connected || slot.busy;
    for (const button of slot.manualButtons) button.disabled = !!slot.busy;
  }

  function render(slot) {
    slot.info.textContent = JSON.stringify({ ...identity(slot.insole),
      connected: slot.insole.isConnected(), firmware: slot.insole.firmware_version,
      pressureSamples: slot.samples, calibrationNotifications: slot.responses,
      lastSerial: slot.raw?.serial_number ?? null });
    const calibration = slot.insole.pressure_calibration;
    if (!calibration) slot.calibrationSource = 'default';
    slot.source.textContent = slot.calibrationSource === 'manual'
      ? '校正値の出所: 手動設定（実機からの取得成功ではありません）'
      : slot.calibrationSource === 'device' ? '校正値の出所: 実機の校正応答' : '校正値の出所: 既定係数（校正値null）';
    for (let i = 0; i < 6; i++) {
      const cells = slot.rows[i].cells;
      cells[1].textContent = calibration?.[i]?.func === 0 ? '指数' : calibration?.[i]?.func === 1 ? '4次多項式' : '—';
      for (let j = 0; j < 5; j++) cells[2 + j].textContent = calibration?.[i]?.coeffs[j]?.toPrecision(12) ?? '—';
      cells[7].textContent = slot.raw?.values[i] ?? '—';
      cells[8].textContent = slot.converted?.values[i]?.toFixed(4) ?? '—';
    }
    updateControls(slot);
  }

  for (let id = 0; id < 2; id++) {
    const section = document.createElement('section');
    section.innerHTML = `<h2>端末 ${id + 1}</h2>
      <button data-action="connect">接続（自動取得）</button>
      <button data-action="retry" disabled>校正値を再取得</button>
      <button data-action="disconnect" disabled>切断</button>
      <p class="status">未接続</p><p class="info muted"></p>
      <p class="source"></p>
      <div class="scroll"><table><thead><tr><th>ch</th><th>式</th><th>係数0</th><th>係数1</th><th>係数2</th><th>係数3</th><th>係数4</th><th>ADC生値</th><th>荷重[N]</th></tr></thead><tbody></tbody></table></div>
      <details open><summary>校正値を手動設定して換算を確認</summary>
        <p class="muted">JavaScriptオブジェクトへの設定です。端末への書き込みは行いません。接続・再取得・切断で値はリセットされます。テスト係数は計算確認用です。</p>
        <button data-action="test-coefficients">テスト係数をセット</button>
        <label>6ch校正値JSON<textarea data-field="calibration" aria-label="端末${id + 1}の校正値JSON"></textarea></label>
        <button data-action="apply-calibration">JSONをセット</button>
        <button data-action="clear-calibration">手動設定解除（既定係数）</button>
        <p><label>テストADC（6ch） <input data-field="adc" value="100,100,100,100,100,100" aria-label="端末${id + 1}のテストADC"></label>
          <button data-action="check-conversion">SDKで換算確認</button></p>
        <p class="conversion muted">テスト係数: ch0〜5に0.01〜0.06の傾きを設定。各ADC=100で荷重=1,2,3,4,5,6になります。</p>
      </details>
      <details><summary>通信・取得ログ</summary><pre></pre></details>`;
    document.getElementById('devices').append(section);
    const insole = new OrpheInsole(id);
    insole.setup();
    const slot = { id, insole, busy: false, samples: 0, responses: 0, raw: null, converted: null,
      attempts: [], current: null, connect: section.querySelector('[data-action="connect"]'),
      retry: section.querySelector('[data-action="retry"]'), disconnect: section.querySelector('[data-action="disconnect"]'),
      status: section.querySelector('.status'), info: section.querySelector('.info'),
      log: section.querySelector('pre'), rows: [], calibrationSource: 'default', conversionChecks: [],
      source: section.querySelector('.source'), coefficients: section.querySelector('[data-field="calibration"]'),
      adc: section.querySelector('[data-field="adc"]'), conversion: section.querySelector('.conversion'),
      manualButtons: Array.from(section.querySelectorAll('details button')) };
    slots.push(slot);
    const tbody = section.querySelector('tbody');
    for (let i = 0; i < 6; i++) {
      const row = tbody.insertRow();
      for (let j = 0; j < 9; j++) row.insertCell().textContent = j === 0 ? String(i) : '—';
      slot.rows.push(row);
    }

    const originalRead = insole.onRead.bind(insole);
    insole.onRead = (data, uuid) => {
      if (uuid === 'SENSOR_VALUES' && data.byteLength && data.getUint8(0) === 0x39) {
        slot.responses++;
        const response = { at: new Date().toISOString(), length: data.byteLength,
          sensor_index: data.byteLength > 1 ? data.getUint8(1) : null,
          func: data.byteLength > 2 ? data.getUint8(2) : null,
          coeffs: data.byteLength >= 43 ? Array.from({ length: 5 }, (_, i) => data.getFloat64(3 + i * 8, false)) : null,
          hex: Array.from(new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
            byte => byte.toString(16).padStart(2, '0')).join(' ') };
        slot.current?.notifications.push(response);
        record(slot, 'calibration-notification', response);
      }
      return originalRead(data, uuid);
    };

    const originalGet = insole.getPressureCalibration.bind(insole);
    insole.getPressureCalibration = async options => {
      const start = performance.now();
      const attempt = { startedAt: new Date().toISOString(), method: slot.busy === 'connect' ? 'automatic' : 'manual',
        timeoutMs: options?.timeoutMs ?? 2000, device: identity(insole), notifications: [] };
      slot.current = attempt;
      slot.calibrationSource = 'default';
      slot.status.textContent = '校正値取得中…';
      const result = await originalGet(options);
      attempt.elapsedMs = Math.round(performance.now() - start);
      attempt.calibration = copy(result);
      attempt.valid = validCalibration(result);
      attempt.retained = result !== null && result === insole.pressure_calibration;
      slot.calibrationSource = attempt.valid && attempt.retained ? 'device' : 'default';
      attempt.pressureSamplesAtEnd = slot.samples;
      slot.attempts.push(attempt);
      slot.current = null;
      const message = attempt.valid && attempt.retained ? '6ch取得成功・オブジェクトに保持'
        : attempt.notifications.length ? `取得未完了（校正通知 ${attempt.notifications.length} 件）・既定係数を使用`
          : '校正応答なし・校正値null・既定係数を使用';
      slot.status.textContent = `${message} / ${attempt.elapsedMs} ms`;
      slot.status.className = `status ${attempt.valid && attempt.retained ? 'pass' : 'warn'}`;
      record(slot, 'calibration-result', { method: attempt.method, elapsedMs: attempt.elapsedMs,
        valid: attempt.valid, retained: attempt.retained, calibration: attempt.calibration });
      render(slot);
      return result;
    };

    insole.gotPress = value => { slot.samples++; slot.raw = value; };
    insole.gotConvertedPress = value => { slot.converted = value; };
    insole.onError = error => record(slot, 'sdk-error', { name: error?.name, code: error?.code, message: String(error?.message ?? error) });
    insole.onDisconnect = () => {
      slot.raw = null;
      slot.converted = null;
      slot.calibrationSource = 'default';
      slot.status.textContent = '切断済み・校正値null';
      slot.status.className = 'status';
      record(slot, 'disconnect', {});
      render(slot);
    };

    const run = async (kind, operation) => {
      if (slot.busy) return;
      slot.busy = kind;
      updateControls(slot);
      try { await operation(); }
      catch (error) {
        slot.status.textContent = `操作失敗: ${error.message ?? error}`;
        slot.status.className = 'status warn';
        record(slot, 'operation-error', { operation: kind, message: String(error.message ?? error) });
      } finally { slot.busy = false; render(slot); }
    };

    slot.connect.addEventListener('click', () => run('connect', async () => {
      slot.samples = 0;
      slot.raw = null;
      slot.converted = null;
      slot.status.textContent = '端末選択・接続中…';
      record(slot, 'connect-start', {});
      await insole.begin({ streamingMode: 3, autoReconnect: false, connectTimeoutMs: 15000 });
      record(slot, 'begin-complete', { connected: insole.isConnected(), calibration: copy(insole.pressure_calibration) });
    }));
    slot.retry.addEventListener('click', () => run('manual', async () => {
      const timeoutMs = Number(document.getElementById('timeout').value);
      if (!Number.isFinite(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000) throw new Error('期限は100〜30000msで指定してください');
      await insole.getPressureCalibration({ timeoutMs });
    }));
    slot.disconnect.addEventListener('click', () => run('disconnect', () => insole.stop()));

    const verifyConversion = () => {
      const values = slot.adc.value.split(',').map(value => value.trim());
      if (values.length !== 6 || values.some(value => !/^\d+$/.test(value) || Number(value) > 65535)) {
        throw new Error('テストADCは0〜65535の整数を6個、カンマ区切りで指定してください');
      }
      const input = values.map(Number);
      probe.pressure_calibration = copy(insole.pressure_calibration);
      // mode3のパケットをSDKの実際の通知デコード経路へ渡す。
      const data = new DataView(new ArrayBuffer(104));
      data.setUint8(0, 55);
      data.setUint16(1, probeSerial++ % 65536);
      for (let sample = 0; sample < 4; sample++) {
        input.forEach((value, i) => data.setUint16(20 + 24 * sample + 2 * i, value));
      }
      probe.onRead(data, 'SENSOR_VALUES');
      const result = { at: new Date().toISOString(), source: slot.calibrationSource,
        input, calibration: copy(probe.pressure_calibration), output: probe.converted_press.values.slice() };
      slot.conversionChecks.push(result);
      slot.conversion.textContent = `テストADC: ${input.join(', ')} → SDK換算[N]: ${result.output.map(value => value.toFixed(6)).join(', ')}（実機サンプルとは別に計算）`;
      record(slot, 'synthetic-conversion-check', result);
    };

    const applyCalibration = rows => {
      if (!validCalibration(rows)) throw new Error('ch0〜5の6行、func=0/1、有限な5係数が必要です');
      insole.pressure_calibration = copy(rows);
      slot.calibrationSource = 'manual';
      // 古い係数で換算した表示を消し、次の実機通知で更新する。
      slot.converted = null;
      slot.status.textContent = '6chを手動設定済み（実機からは未取得）';
      slot.status.className = 'status warn';
      record(slot, 'manual-calibration-set', { calibration: copy(rows) });
    };

    section.querySelector('[data-action="test-coefficients"]').addEventListener('click', () => run('set', () => {
      const rows = Array.from({ length: 6 }, (_, sensor_index) => ({ sensor_index, func: 1,
        coeffs: [0, 0, 0, (sensor_index + 1) / 100, 0] }));
      slot.coefficients.value = JSON.stringify(rows, null, 2);
      applyCalibration(rows);
      verifyConversion();
    }));
    section.querySelector('[data-action="apply-calibration"]').addEventListener('click', () => run('set', () => {
      applyCalibration(JSON.parse(slot.coefficients.value));
      verifyConversion();
    }));
    section.querySelector('[data-action="clear-calibration"]').addEventListener('click', () => run('clear', () => {
      insole.pressure_calibration = null;
      slot.calibrationSource = 'default';
      slot.converted = null;
      slot.status.textContent = '手動設定解除・既定係数を使用';
      record(slot, 'manual-calibration-cleared', {});
      verifyConversion();
    }));
    section.querySelector('[data-action="check-conversion"]').addEventListener('click', () => run('check', verifyConversion));
    render(slot);
  }

  function snapshot() {
    return { capturedAt: new Date().toISOString(), userAgent: navigator.userAgent, url: location.href,
      secureContext: window.isSecureContext, bluetoothAvailable: !!navigator.bluetooth,
      devices: slots.map(slot => ({ slot: slot.id, ...identity(slot.insole), connected: slot.insole.isConnected(),
        firmware: slot.insole.firmware_version, calibration: copy(slot.insole.pressure_calibration),
        calibrationSource: slot.calibrationSource, conversionChecks: copy(slot.conversionChecks),
        pressureSamples: slot.samples, raw: copy(slot.raw), converted: copy(slot.converted), attempts: copy(slot.attempts) })),
      events: copy(records) };
  }
  // 手動保存とブラウザ自動操作で同じ形式の証拠を取得する。
  window.pressureCalibrationTest = { snapshot };
  document.getElementById('save').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `pressure-calibration-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  setInterval(() => slots.forEach(render), 250);
})();
