/**
 * GESTURE LAB — raw sensor recorder for the INSOLE MUSIC SHOE example.
 *
 * Records labeled takes of raw sensor data (6ch pressure ADC + converted
 * acc [G] + converted gyro [dps] + quaternion) at streaming mode 4
 * (100 Hz — the only mode with press AND quat) and exports them as CSV,
 * so gesture-detection thresholds can be designed from real data
 * instead of guesses.
 *
 * CSV columns:
 *   take, label, device, side, ms, timestamp, serial, packet,
 *   p0..p5, ax, ay, az, gx, gy, gz, qw, qx, qy, qz
 *
 * ms       — performance.now() relative to take start (receive time)
 * timestamp— sensor timestamp from the packet
 * side     — L/R from device_information.mount_position (bit0), '?' if unknown
 */

/* ================================================================ *
 *  Gesture presets (match the instrument's planned interactions)
 * ================================================================ */

const GESTURES = [
  { id: 'toe_down_shake', jp: 'つま先下・振り/叩き' },
  { id: 'flat_shake', jp: '水平・振り/叩き' },
  { id: 'heel_down_shake', jp: '踵下・振り/叩き' },
  { id: 'roll_plus', jp: 'ロール+ ひねり' },
  { id: 'roll_minus', jp: 'ロール− ひねり' },
  { id: 'yaw_spin', jp: '水平のまま左右に回す(レコード回し)' },
  { id: 'fsr_sweep', jp: 'FSRを1つずつ押す(順不同OK・各1秒押して離す)' },
  { id: 'idle_hold', jp: '静止把持(ノイズフロア)' },
  { id: 'handling_noise', jp: '持ち替え等の誤爆源' },
];

const CSV_HEADER = 'take,label,device,side,ms,timestamp,serial,packet,p0,p1,p2,p3,p4,p5,ax,ay,az,gx,gy,gz,qw,qx,qy,qz';

/* ================================================================ *
 *  State
 * ================================================================ */

const state = {
  label: null,
  connected: [false, false],
  recording: false,
  takeStart: 0,
  currentRows: [],
  takes: [],                 // { n, label, durMs, rows, devices:Set }
  takeSeq: 0,
  latest: [null, null],      // per-device last sample (for live view + dev stat)
  sides: ['?', '?'],
  hz: [0, 0],
  // live view ring buffers (seconds of history at ~200 Hz, downsampled on draw)
  live: [
    { press: [], imu: [] },  // device 0
    { press: [], imu: [] },  // device 1
  ],
};

const LIVE_LEN = 600; // ~6 s at 100 Hz (mode 4)

const $ = (id) => document.getElementById(id);

/* ================================================================ *
 *  Recording
 * ================================================================ */

/** Called from gotPress (last callback per sample) with cached acc/gyro/quat. */
function onSample(devId, press, acc, gyro, quat) {
  const l = state.live[devId];
  l.press.push(press.values.slice());
  const mag = acc ? Math.abs(Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2) - 1) : 0;
  l.imu.push([mag, gyro ? gyro.x : 0, gyro ? gyro.y : 0, gyro ? gyro.z : 0]);
  if (l.press.length > LIVE_LEN) { l.press.shift(); l.imu.shift(); }

  // record every streaming device — which hand gestured is recovered in
  // analysis from the device/side columns and per-device motion energy
  if (!state.recording) return;
  const ms = (performance.now() - state.takeStart).toFixed(1);
  state.currentRows.push([
    state.takeSeq + 1, state.label, devId, state.sides[devId], ms,
    press.timestamp, press.serial_number, press.packet_number,
    ...press.values,
    acc ? acc.x.toFixed(4) : '', acc ? acc.y.toFixed(4) : '', acc ? acc.z.toFixed(4) : '',
    gyro ? gyro.x.toFixed(2) : '', gyro ? gyro.y.toFixed(2) : '', gyro ? gyro.z.toFixed(2) : '',
    quat ? quat.w.toFixed(4) : '', quat ? quat.x.toFixed(4) : '',
    quat ? quat.y.toFixed(4) : '', quat ? quat.z.toFixed(4) : '',
  ].join(','));
}

function startRec() {
  const custom = $('custom_label').value.trim();
  const label = custom || state.label;
  if (!label) {
    $('rec_stat').textContent = 'SELECT A LABEL FIRST';
    return;
  }
  state.label = label;
  $('current_label').textContent = label;
  state.recording = true;
  state.takeStart = performance.now();
  state.currentRows = [];
  $('rec_btn').classList.add('recording');
  $('rec_btn').innerHTML = '<i class="bi bi-stop-fill"></i> STOP';
  beep(1320, 0.07);
}

function stopRec() {
  state.recording = false;
  const durMs = performance.now() - state.takeStart;
  $('rec_btn').classList.remove('recording');
  $('rec_btn').innerHTML = '<i class="bi bi-record-circle"></i> REC START';
  beep(660, 0.1);
  if (!state.currentRows.length) {
    $('rec_stat').textContent = 'NO DATA (device connected?)';
    return;
  }
  state.takeSeq++;
  const devices = new Set(state.currentRows.map((r) => r.split(',')[2]));
  state.takes.push({
    n: state.takeSeq,
    label: state.label,
    durMs,
    rows: state.currentRows,
    devices: [...devices].map((d) => `D${d}(${state.sides[+d]})`).join(' '),
  });
  state.currentRows = [];
  renderTakes();
}

/** Small UI beep so takes can be timed without looking at the screen. */
let beepCtx = null;
function beep(freq, dur) {
  try {
    beepCtx = beepCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (beepCtx.state === 'suspended') beepCtx.resume();
    const o = beepCtx.createOscillator();
    const g = beepCtx.createGain();
    const t = beepCtx.currentTime;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(beepCtx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch { /* audio unavailable — ignore */ }
}

/* ================================================================ *
 *  CSV export
 * ================================================================ */

function timestampName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function downloadCSV(filename, rows) {
  const blob = new Blob([CSV_HEADER + '\n' + rows.join('\n') + '\n'], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function exportTake(take) {
  downloadCSV(`take${String(take.n).padStart(2, '0')}_${take.label}_${timestampName()}.csv`, take.rows);
}

function exportAll() {
  if (!state.takes.length) return;
  const all = state.takes.flatMap((t) => t.rows);
  downloadCSV(`gestures_all_${timestampName()}.csv`, all);
}

/* ================================================================ *
 *  UI
 * ================================================================ */

function buildChips() {
  const box = $('chips');
  GESTURES.forEach((g) => {
    const el = document.createElement('span');
    el.className = 'chip';
    el.innerHTML = `${g.id}<span class="jp">${g.jp}</span>`;
    el.addEventListener('click', () => {
      state.label = g.id;
      $('custom_label').value = '';
      $('current_label').textContent = g.id;
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
      el.classList.add('on');
    });
    box.appendChild(el);
  });
}

function renderTakes() {
  const tbody = $('take_rows');
  tbody.innerHTML = '';
  state.takes.forEach((t, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.n}</td><td>${t.label}</td>
      <td>${(t.durMs / 1000).toFixed(1)}s</td>
      <td>${t.rows.length}</td><td>${t.devices}</td>
      <td class="text-end">
        <button class="btn-xs" data-act="dl" data-i="${i}"><i class="bi bi-download"></i> CSV</button>
        <button class="btn-xs" data-act="del" data-i="${i}">✕</button>
      </td>`;
    tbody.appendChild(tr);
  });
  const rows = state.takes.reduce((a, t) => a + t.rows.length, 0);
  $('take_count').textContent = `${state.takes.length} TAKES / ${rows} ROWS`;
  $('rec_stat').textContent = state.takes.length
    ? `LAST: take${state.takes[state.takes.length - 1].n} ${state.takes[state.takes.length - 1].label}` : 'IDLE';
}

$('take_rows').addEventListener('click', (ev) => {
  const btn = ev.target.closest('button');
  if (!btn) return;
  const i = +btn.dataset.i;
  if (btn.dataset.act === 'dl') exportTake(state.takes[i]);
  else if (btn.dataset.act === 'del') { state.takes.splice(i, 1); renderTakes(); }
});

/* ---------- live monitor ---------- */

const PRESS_COLORS = ['#cdff00', '#8fd400', '#e8e8e6', '#9a9d9f', '#5fb0ff', '#ff7ab0'];
const IMU_COLORS = ['#cdff00', '#ff7a7a', '#7ad0ff', '#ffd07a'];

function drawSeries(ctx2d, w, h, series, colors, scaleFn, alpha) {
  series.forEach((buf, si) => {
    if (buf.length < 2) return;
    ctx2d.strokeStyle = colors[si % colors.length];
    ctx2d.globalAlpha = alpha;
    ctx2d.lineWidth = 1.2;
    ctx2d.beginPath();
    const n = buf.length;
    for (let i = 0; i < n; i++) {
      const x = (i / (LIVE_LEN - 1)) * w + (LIVE_LEN - n) / (LIVE_LEN - 1) * w * 0;
      const y = scaleFn(buf[i], h);
      if (i === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
    }
    ctx2d.stroke();
  });
  ctx2d.globalAlpha = 1;
}

function render() {
  // press canvas: 6 channels per device
  const pc = $('cv_press').getContext('2d');
  const pw = $('cv_press').width, ph = $('cv_press').height;
  pc.clearRect(0, 0, pw, ph);
  pc.strokeStyle = 'rgba(205,255,0,0.08)';
  pc.strokeRect(0.5, 0.5, pw - 1, ph - 1);
  for (let d = 0; d < 2; d++) {
    const chans = [0, 1, 2, 3, 4, 5].map((c) => state.live[d].press.map((v) => v[c]));
    // autoscale on recent max (per canvas)
    const maxV = Math.max(500, ...chans.flat());
    drawSeries(pc, pw, ph, chans, PRESS_COLORS, (v, h) => h - (v / maxV) * (h - 4) - 2, d === 0 ? 0.95 : 0.35);
  }

  // imu canvas: |acc|-1 and gyro xyz/1000
  const ic = $('cv_imu').getContext('2d');
  const iw = $('cv_imu').width, ih = $('cv_imu').height;
  ic.clearRect(0, 0, iw, ih);
  ic.strokeStyle = 'rgba(205,255,0,0.08)';
  ic.strokeRect(0.5, 0.5, iw - 1, ih - 1);
  ic.strokeStyle = 'rgba(232,232,230,0.15)';
  ic.beginPath(); ic.moveTo(0, ih / 2); ic.lineTo(iw, ih / 2); ic.stroke();
  for (let d = 0; d < 2; d++) {
    const buf = state.live[d].imu;
    const series = [
      buf.map((v) => v[0]),          // |acc|-1 in G
      buf.map((v) => v[1] / 1000),   // gyro dps scaled
      buf.map((v) => v[2] / 1000),
      buf.map((v) => v[3] / 1000),
    ];
    drawSeries(ic, iw, ih, series, IMU_COLORS, (v, h) => h / 2 - v * (h / 2 - 4) / 4, d === 0 ? 0.95 : 0.35);
  }

  // stats
  if (state.recording) {
    const s = ((performance.now() - state.takeStart) / 1000).toFixed(1);
    $('rec_stat').innerHTML = `<span class="volt">● REC ${s}s / ${state.currentRows.length} rows</span>`;
  }
  $('dev_stat').textContent = `D0 ${state.latest[0] ? state.sides[0] : '—'} / D1 ${state.latest[1] ? state.sides[1] : '—'}`;
  const targets = [0, 1]
    .filter((d) => state.connected[d])
    .map((d) => `INSOLE ${d}${state.sides[d] === 'L' || state.sides[d] === 'R' ? ` (${state.sides[d]})` : ''}`);
  $('target_stat').textContent = targets.length ? targets.join(' + ') : '未接続';
  $('hz_stat').textContent = `${Math.round(state.hz[0] || state.hz[1])} Hz`;

  requestAnimationFrame(render);
}

/* ================================================================ *
 *  Wiring
 * ================================================================ */

buildInsoleToolkit($('toolkit_placeholder0'), 'INSOLE 0', 0, { streamingMode: 4, autoReconnect: true });
buildInsoleToolkit($('toolkit_placeholder1'), 'INSOLE 1', 1, { streamingMode: 4, autoReconnect: true });

window.addEventListener('load', function () {
  buildChips();
  renderTakes();

  for (let i = 0; i < 2; i++) {
    insoles[i].setup();

    insoles[i].onDisconnect = function () {
      state.connected[this.id] = false;
    };
    insoles[i].onConnect = function () {
      state.connected[this.id] = true;
      // IMPORTANT: no GATT calls here — onConnect fires while begin() is
      // still running its own GATT sequence (getDeviceInformation ->
      // setDataStreamingMode -> syncCoreTime -> startNotify) and concurrent
      // operations fail with "GATT operation already in progress".
      // begin() populates device_information itself, so we just poll it.
      const self = this;
      let tries = 0;
      const poll = setInterval(() => {
        const info = self.device_information;
        if (info && typeof info.mount_position !== 'undefined') {
          // mount_position bit0: 0=LEFT, 1=RIGHT
          state.sides[self.id] = (info.mount_position & 1) ? 'R' : 'L';
          clearInterval(poll);
        } else if (++tries > 20) {
          clearInterval(poll); // keep '?'
        }
      }, 500);
    };

    // SDK callback order per sample (mode 4 / header 56): quat -> acc/gyro
    // (+converted) -> press last, so caching values here and writing the row
    // in gotPress keeps all columns aligned to the same sample.
    insoles[i].gotQuat = function (quat) {
      state.latest[this.id] = state.latest[this.id] || {};
      state.latest[this.id].quat = quat;
    };
    insoles[i].gotConvertedAcc = function (acc) {
      state.latest[this.id] = state.latest[this.id] || {};
      state.latest[this.id].acc = acc;
    };
    insoles[i].gotConvertedGyro = function (gyro) {
      state.latest[this.id] = state.latest[this.id] || {};
      state.latest[this.id].gyro = gyro;
    };
    insoles[i].gotPress = function (press) {
      const l = state.latest[this.id] = state.latest[this.id] || {};
      l.press = press;
      onSample(this.id, press, l.acc, l.gyro, l.quat);
    };
    insoles[i].gotBLEFrequency = function (freq) { state.hz[this.id] = freq; };
  }

  $('rec_btn').addEventListener('click', () => (state.recording ? stopRec() : startRec()));
  $('export_all').addEventListener('click', exportAll);
  $('clear_all').addEventListener('click', () => { state.takes = []; state.takeSeq = 0; renderTakes(); });

  window.addEventListener('keydown', (ev) => {
    if (ev.code === 'Space' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      ev.preventDefault();
      state.recording ? stopRec() : startRec();
    }
  });

  requestAnimationFrame(render);
});
