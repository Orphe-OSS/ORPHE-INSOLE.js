/**
 * ORPHE INSOLE Showcase — アプリ本体
 *
 * 役割:
 *  - InsoleToolkit による接続（左右最大2台）と got* コールバックの配線
 *  - ライブ受信とデモ再生（demo-data.js）を同じ dispatchFrame() に集約
 *  - mount_position による L/R 自動判定とパネルの並び替え
 *  - CSV記録（収録した実データはデモ再生のソースとして読み込み可能）
 *  - 描画は requestAnimationFrame で約30fpsにスロットリング（CLAUDE.md Pattern 5）
 */

const HISTORY = 200;           // チャートに表示するサンプル数
const RENDER_INTERVAL_MS = 33; // 描画間隔（約30fps）
const LIVE_TIMEOUT_MS = 1500;  // ライブ受信がこの時間途絶えたらデモ再生に戻る

const SERIES_COLORS = [
    'rgb(69, 230, 230)',
    'rgb(255, 96, 64)',
    'rgb(255, 255, 255)',
    'rgb(127, 127, 127)',
    'rgb(255, 205, 86)',
    'rgb(153, 102, 255)',
];

const showcaseCharts = [];

function i18nText(key, params, fallback) {
    return window.ShowcaseI18n ? window.ShowcaseI18n.t(key, params, fallback) : (fallback || key);
}

function i18nHtml(key, params, fallback) {
    return window.ShowcaseI18n ? window.ShowcaseI18n.html(key, params, fallback) : (fallback || key);
}

/** 折れ線チャートを生成するファクトリ（examples/VISUALIZE と同じ構成） */
function makeLineChart(canvasId, titleKey, seriesLabels, yMin, yMax) {
    const datasets = seriesLabels.map((label, i) => ({
        label,
        backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
        borderColor: SERIES_COLORS[i % SERIES_COLORS.length],
        pointRadius: 0,
        borderWidth: 1.5,
        data: [],
    }));
    const scales = {};
    if (typeof yMin === 'number' && typeof yMax === 'number') {
        scales.y = { min: yMin, max: yMax };
    }
    const chart = new Chart(document.getElementById(canvasId), {
        type: 'line',
        data: { labels: [], datasets },
        options: {
            animation: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12 } },
                title: { display: true, text: i18nText(titleKey, undefined, titleKey) },
            },
            scales,
        },
    });
    chart.$titleKey = titleKey;
    showcaseCharts.push(chart);
    return chart;
}

function updateChartLanguage() {
    showcaseCharts.forEach((chart) => {
        chart.options.plugins.title.text = i18nText(chart.$titleKey, undefined, chart.$titleKey);
        chart.update('none');
    });
}

/** 受信バッファ。コールバック（100Hz〜）で push し、描画ループでまとめて流し込む */
class ChartFeed {
    constructor(chart) {
        this.chart = chart;
        this.pending = [];
        this.count = 0;
    }
    push(values) {
        this.pending.push(values);
    }
    flush() {
        if (this.pending.length === 0) return false;
        const data = this.chart.data;
        for (const values of this.pending) {
            data.labels.push(this.count++);
            values.forEach((v, i) => data.datasets[i].data.push(v));
        }
        this.pending.length = 0;
        while (data.labels.length > HISTORY) {
            data.labels.shift();
            data.datasets.forEach(ds => ds.data.shift());
        }
        return true;
    }
}

//--------------------------------------------------
// 状態（デバイス0/1）
//--------------------------------------------------
let lastLiveAt = -Infinity;                    // いずれかのデバイスの最終ライブ受信
const lastLiveAtDev = [-Infinity, -Infinity];  // デバイスごとの最終ライブ受信
let liveActive = false;
const latestEuler = [null, null];
const latestQuat = [null, null];
const sides = ['L', 'R'];                      // 表示上のL/R（mount_position で更新）

let pressurePanels = [];
let imuPanels = [];

//--------------------------------------------------
// フレーム配信: ライブ/デモ共通の入口
//--------------------------------------------------
function dispatchFrame(deviceId, frame, isLive) {
    if (deviceId !== 0 && deviceId !== 1) return;
    if (isLive) {
        lastLiveAt = performance.now();
        lastLiveAtDev[deviceId] = lastLiveAt;
    }

    pressurePanels[deviceId].push(frame);
    imuPanels[deviceId].push(frame);
    if (frame.quat) {
        latestQuat[deviceId] = frame.quat;
        AttitudeViz.setQuat(deviceId, frame.quat);
    }
    if (frame.euler) latestEuler[deviceId] = frame.euler;

    if (Recorder.recording) Recorder.add(deviceId, frame, isLive);
}

//--------------------------------------------------
// CSV記録（接続中の全デバイスを1ファイルに記録。device 列で区別）
//--------------------------------------------------
const Recorder = {
    rows: [],
    recording: false,
    startedAt: 0,
    liveSeen: false,

    start() {
        this.rows = [];
        this.recording = true;
        this.liveSeen = false;
        this.startedAt = performance.now();
    },
    stop() {
        this.recording = false;
    },
    add(deviceId, frame, isLive) {
        if (isLive) this.liveSeen = true;
        this.rows.push({ device: deviceId, ...frame });
    },
    toCSV() {
        const fmt = (v, d) => (v === null || v === undefined) ? '' : v.toFixed(d);
        const lines = [DemoData.CSV_HEADER.join(',')];
        for (const f of this.rows) {
            const press = f.press || [];
            lines.push([
                f.device ?? 0,
                Math.round(f.t ?? 0), f.serial ?? '',
                ...[0, 1, 2, 3, 4, 5].map(i => (f.press ? Math.round(press[i]) : '')),
                fmt(f.acc?.x, 4), fmt(f.acc?.y, 4), fmt(f.acc?.z, 4),
                fmt(f.gyro?.x, 2), fmt(f.gyro?.y, 2), fmt(f.gyro?.z, 2),
                fmt(f.quat?.w, 5), fmt(f.quat?.x, 5), fmt(f.quat?.y, 5), fmt(f.quat?.z, 5),
                fmt(f.euler?.pitch, 5), fmt(f.euler?.roll, 5), fmt(f.euler?.yaw, 5),
            ].join(','));
        }
        return lines.join('\n');
    },
    download() {
        const blob = new Blob([this.toCSV()], { type: 'text/csv' });
        const a = document.createElement('a');
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        a.href = URL.createObjectURL(blob);
        a.download = `orphe-insole-${stamp}${this.liveSeen ? '' : '-demo'}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    },
};

//--------------------------------------------------
// デモ再生プレイヤー（ライブ受信が無い間だけ動く）
//--------------------------------------------------
const DemoPlayer = {
    rows: [],
    idx: 0,
    clock: 0,
    lastTick: 0,

    setRows(rows) {
        this.rows = rows;
        this.idx = 0;
        this.clock = 0;
    },
    durationMs() {
        return this.rows.length ? this.rows[this.rows.length - 1].t : 0;
    },
    tick(now) {
        const dt = Math.min(100, now - this.lastTick);
        this.lastTick = now;
        if (liveActive || this.rows.length === 0) return;

        this.clock += dt;
        while (this.idx < this.rows.length && this.rows[this.idx].t <= this.clock) {
            const row = this.rows[this.idx];
            dispatchFrame(row.device ?? 0, row, false);
            this.idx++;
        }
        if (this.idx >= this.rows.length) { // ループ再生
            this.idx = 0;
            this.clock = 0;
        }
    },
};

//--------------------------------------------------
// ライブ受信: コールバック数回分を1フレームに組み立てる（デバイスごと）
//--------------------------------------------------
const pendings = [{}, {}];

function notePending(deviceId, data) {
    const pending = pendings[deviceId];
    if (data && typeof data.timestamp !== 'undefined') pending.t = data.timestamp;
    if (data && typeof data.serial_number !== 'undefined') pending.serial = data.serial_number;
}

function commitLiveFrame(deviceId) {
    const pending = pendings[deviceId];
    dispatchFrame(deviceId, {
        t: pending.t ?? performance.now(),
        serial: pending.serial,
        press: pending.press ?? null,
        acc: pending.acc ?? null,
        gyro: pending.gyro ?? null,
        quat: pending.quat ?? null,
        euler: pending.euler ?? null,
    }, true);
    pendings[deviceId] = {};
}

//--------------------------------------------------
// L/R 表示（device_information.mount_position bit0: 0=LEFT, 1=RIGHT）
//--------------------------------------------------
function applySide(deviceId, side) {
    sides[deviceId] = side;
    pressurePanels[deviceId].setFoot(side);
    AttitudeViz.setFoot(deviceId, side);

    for (const prefix of ['press_panel', 'imu_panel', 'euler_panel']) {
        const panel = document.getElementById(`${prefix}${deviceId}`);
        if (!panel) continue;
        panel.style.order = (side === 'L') ? 0 : 1; // 左足を画面左に
        const badge = panel.querySelector('.side-badge');
        if (badge) {
            badge.innerText = side;
            badge.classList.remove('bg-secondary', 'bg-success', 'bg-primary');
            badge.classList.add(side === 'L' ? 'bg-success' : 'bg-primary');
        }
    }

    // もう一方のデバイスが未接続なら、表示の重複を避けて反対側に寄せる
    const other = 1 - deviceId;
    const otherLive = (performance.now() - lastLiveAtDev[other]) < LIVE_TIMEOUT_MS;
    if (!otherLive && sides[other] === side) {
        applySide(other, side === 'L' ? 'R' : 'L');
    }
}

/**
 * device_information は接続処理の中で取得されるため、
 * mount_position が入るまで短時間ポーリングしてから反映する。
 */
function applyMountPositionWhenReady(insole, tries = 20) {
    const info = insole.device_information;
    if (info && typeof info.mount_position !== 'undefined') {
        applySide(insole.id, (info.mount_position & 0b1) === 1 ? 'R' : 'L');
        return;
    }
    if (tries <= 0) return;
    setTimeout(() => applyMountPositionWhenReady(insole, tries - 1), 250);
}

//--------------------------------------------------
// 初期化
//--------------------------------------------------
window.onload = function () {
    pressurePanels = [createPressurePanel(0, 'L'), createPressurePanel(1, 'R')];
    imuPanels = [createImuPanel(0), createImuPanel(1)];
    pressurePanels.forEach(p => p.init());
    imuPanels.forEach(p => p.init());

    if (!navigator.bluetooth) {
        document.getElementById('bt_unsupported').classList.remove('d-none');
    }

    for (let id = 0; id < 2; id++) {
        buildInsoleToolkit(
            document.getElementById(`toolkit${id}`),
            `INSOLE 0${id + 1}`,
            id,
            { streamingMode: 4, autoReconnect: true }
        );

        const insole = insoles[id];
        insole.setup();

        insole.gotQuat = function (quat) {
            notePending(this.id, quat);
            pendings[this.id].quat = { w: quat.w, x: quat.x, y: quat.y, z: quat.z };
        };
        insole.gotEuler = function (euler) {
            pendings[this.id].euler = { pitch: euler.pitch, roll: euler.roll, yaw: euler.yaw };
            // モード1は press が無く euler が各サンプルの最後に呼ばれる
            if (this.streaming_mode === 1) commitLiveFrame(this.id);
        };
        insole.gotConvertedAcc = function (acc) {
            notePending(this.id, acc);
            pendings[this.id].acc = { x: acc.x, y: acc.y, z: acc.z };
        };
        insole.gotConvertedGyro = function (gyro) {
            notePending(this.id, gyro);
            pendings[this.id].gyro = { x: gyro.x, y: gyro.y, z: gyro.z };
            // quaternion.js が読み込めず gotEuler が呼ばれない環境でのモード1フォールバック
            if (this.streaming_mode === 1 && typeof Quaternion === 'undefined') commitLiveFrame(this.id);
        };
        insole.gotPress = function (press) {
            notePending(this.id, press);
            pendings[this.id].press = press.values.slice(0, 6);
            // モード3/4は press が各サンプルの最後に呼ばれる（SDKのコールバック順）
            commitLiveFrame(this.id);
        };
        insole.lostData = function (serial, prev) {
            console.warn(`INSOLE${this.id}: lost packets ${prev} -> ${serial}`);
        };
        insole.onConnect = function () {
            applyMountPositionWhenReady(this);
        };
        insole.onReconnectSuccess = function () {
            applyMountPositionWhenReady(this);
        };
    }

    // 初期のL/Rバッジ・並び（デモは device0=左足 / device1=右足）
    applySide(0, 'L');
    applySide(1, 'R');

    // --- デモ再生（初期は合成歩行データ。収録CSVで差し替え可能） ---
    DemoPlayer.setRows(DemoData.generate());

    // --- 記録UI ---
    const recordToggle = document.getElementById('record_toggle');
    const recordDownload = document.getElementById('record_download');
    const recordStatus = document.getElementById('record_status');
    function updateRecordToggleLabel() {
        recordToggle.innerHTML = i18nHtml(
            Recorder.recording ? 'recordStopHtml' : 'recordStartHtml',
            undefined,
            Recorder.recording ? '<i class="bi bi-stop-fill"></i> 記録停止' : '<i class="bi bi-record-fill"></i> 記録開始'
        );
    }
    function updateRecordStatus() {
        if (Recorder.recording) {
            const sec = (performance.now() - Recorder.startedAt) / 1000;
            recordStatus.textContent = i18nText('recordStatusRecording', {
                mode: liveActive ? 'LIVE' : 'DEMO',
                rows: Recorder.rows.length,
                seconds: sec.toFixed(1),
            });
        } else if (Recorder.rows.length > 0) {
            recordStatus.textContent = i18nText('recordStatusReady', { rows: Recorder.rows.length });
        } else {
            recordStatus.textContent = i18nText('recordStatusIdle');
        }
    }
    recordToggle.addEventListener('click', function () {
        if (Recorder.recording) {
            Recorder.stop();
            this.classList.replace('btn-outline-danger', 'btn-danger');
            recordDownload.disabled = Recorder.rows.length === 0;
        } else {
            Recorder.start();
            this.classList.replace('btn-danger', 'btn-outline-danger');
            recordDownload.disabled = true;
        }
        updateRecordToggleLabel();
        updateRecordStatus();
    });
    recordDownload.addEventListener('click', () => Recorder.download());

    // --- 収録CSVのデモ再生 ---
    const csvInput = document.getElementById('csv_input');
    const csvStatus = document.getElementById('csv_load_status');
    csvInput.addEventListener('change', async function () {
        const file = this.files && this.files[0];
        if (!file) return;
        try {
            const rows = DemoData.parseCSV(await file.text());
            DemoPlayer.setRows(rows);
            csvStatus.textContent = i18nText('csvLoaded', {
                file: file.name,
                rows: rows.length,
                seconds: (DemoPlayer.durationMs() / 1000).toFixed(1),
            });
            csvStatus.classList.remove('text-danger');
        } catch (e) {
            csvStatus.textContent = i18nText('csvLoadFailed', { message: e.message });
            csvStatus.classList.add('text-danger');
        }
    });

    // --- 姿勢リセット ---
    document.getElementById('reset_attitude').addEventListener('click', () => AttitudeViz.reset());

    // --- スニペットのコピー ---
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const code = this.parentElement.querySelector('pre code');
            try {
                await navigator.clipboard.writeText(code.innerText);
                this.textContent = i18nText('copyCopied');
                setTimeout(() => { this.textContent = i18nText('copyButton'); }, 1200);
            } catch (e) { /* clipboard 不許可時は何もしない */ }
        });
    });

    window.addEventListener('showcase:languagechange', () => {
        updateChartLanguage();
        updateRecordToggleLabel();
        updateRecordStatus();
        document.querySelectorAll('.copy-btn').forEach((btn) => {
            btn.textContent = i18nText('copyButton');
        });
    });

    // --- 描画ループ ---
    const liveBadge = document.getElementById('live_badge');
    const noticePress = document.getElementById('notice_press');
    const noticeQuat = document.getElementById('notice_quat');
    const gauges = [0, 1].map(id => ({
        pitch: [document.getElementById(`gauge_pitch${id}`), document.getElementById(`val_pitch${id}`)],
        roll: [document.getElementById(`gauge_roll${id}`), document.getElementById(`val_roll${id}`)],
        yaw: [document.getElementById(`gauge_yaw${id}`), document.getElementById(`val_yaw${id}`)],
    }));
    const quatReadouts = [0, 1].map(id => document.getElementById(`quat_readout${id}`));

    function setGauge(deviceId, key, rad) {
        const deg = rad * 180 / Math.PI;
        const pct = Math.max(-50, Math.min(50, deg / 90 * 50));
        const [bar, val] = gauges[deviceId][key];
        if (pct >= 0) {
            bar.style.left = '50%';
            bar.style.width = `${pct}%`;
        } else {
            bar.style.left = `${50 + pct}%`;
            bar.style.width = `${-pct}%`;
        }
        val.textContent = `${deg >= 0 ? '+' : ''}${deg.toFixed(1)}°`;
    }

    let lastRender = 0;
    function loop(now) {
        liveActive = (performance.now() - lastLiveAt) < LIVE_TIMEOUT_MS;
        DemoPlayer.tick(now);

        if (now - lastRender >= RENDER_INTERVAL_MS) {
            lastRender = now;

            for (let id = 0; id < 2; id++) {
                pressurePanels[id].render();
                imuPanels[id].render();
                if (latestEuler[id]) {
                    setGauge(id, 'pitch', latestEuler[id].pitch);
                    setGauge(id, 'roll', latestEuler[id].roll);
                    setGauge(id, 'yaw', latestEuler[id].yaw);
                }
                if (latestQuat[id]) {
                    const q = latestQuat[id];
                    quatReadouts[id].textContent =
                        `w ${q.w.toFixed(3)} / x ${q.x.toFixed(3)} / y ${q.y.toFixed(3)} / z ${q.z.toFixed(3)}`;
                }
            }

            // LIVE/DEMO バッジ
            liveBadge.textContent = liveActive ? 'LIVE' : 'DEMO';
            liveBadge.classList.toggle('bg-success', liveActive);
            liveBadge.classList.toggle('bg-secondary', !liveActive);

            // ストリーミングモードによる配信有無の注記（ライブ中のデバイスのみ対象）
            let anyMode1 = false, anyMode3 = false;
            for (let id = 0; id < 2; id++) {
                const devLive = (performance.now() - lastLiveAtDev[id]) < LIVE_TIMEOUT_MS;
                if (!devLive) continue;
                if (insoles[id].streaming_mode === 1) anyMode1 = true;
                if (insoles[id].streaming_mode === 3) anyMode3 = true;
            }
            noticePress.classList.toggle('d-none', !anyMode1);
            noticeQuat.classList.toggle('d-none', !anyMode3);

            // 記録ステータス
            updateRecordStatus();
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
};
