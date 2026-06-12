/**
 * ORPHE INSOLE Showcase — アプリ本体
 *
 * 役割:
 *  - InsoleToolkit による接続と got* コールバックの配線
 *  - ライブ受信とデモ再生（demo-data.js）を同じ dispatchFrame() に集約
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

/** 折れ線チャートを生成するファクトリ（examples/VISUALIZE と同じ構成） */
function makeLineChart(canvasId, title, seriesLabels, yMin, yMax) {
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
    return new Chart(document.getElementById(canvasId), {
        type: 'line',
        data: { labels: [], datasets },
        options: {
            animation: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12 } },
                title: { display: true, text: title },
            },
            scales,
        },
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
// 状態
//--------------------------------------------------
let lastLiveAt = -Infinity;
let liveActive = false;
let latestEuler = null;
let latestQuat = null;

//--------------------------------------------------
// フレーム配信: ライブ/デモ共通の入口
//--------------------------------------------------
function dispatchFrame(frame, isLive) {
    if (isLive) lastLiveAt = performance.now();

    PressureViz.push(frame);
    ImuViz.push(frame);
    if (frame.quat) {
        latestQuat = frame.quat;
        AttitudeViz.setQuat(frame.quat);
    }
    if (frame.euler) latestEuler = frame.euler;

    if (Recorder.recording) Recorder.add(frame, isLive);
}

//--------------------------------------------------
// CSV記録
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
    add(frame, isLive) {
        if (isLive) this.liveSeen = true;
        this.rows.push(frame);
    },
    toCSV() {
        const fmt = (v, d) => (v === null || v === undefined) ? '' : v.toFixed(d);
        const lines = [DemoData.CSV_HEADER.join(',')];
        for (const f of this.rows) {
            const press = f.press || [];
            lines.push([
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
            dispatchFrame(this.rows[this.idx], false);
            this.idx++;
        }
        if (this.idx >= this.rows.length) { // ループ再生
            this.idx = 0;
            this.clock = 0;
        }
    },
};

//--------------------------------------------------
// ライブ受信: コールバック数回分を1フレームに組み立てる
//--------------------------------------------------
let pending = {};

function notePending(data) {
    if (data && typeof data.timestamp !== 'undefined') pending.t = data.timestamp;
    if (data && typeof data.serial_number !== 'undefined') pending.serial = data.serial_number;
}

function commitLiveFrame() {
    dispatchFrame({
        t: pending.t ?? performance.now(),
        serial: pending.serial,
        press: pending.press ?? null,
        acc: pending.acc ?? null,
        gyro: pending.gyro ?? null,
        quat: pending.quat ?? null,
        euler: pending.euler ?? null,
    }, true);
    pending = {};
}

//--------------------------------------------------
// L/R 表示切替（device_information.mount_position bit0: 0=LEFT, 1=RIGHT）
// device_information は接続処理の中で取得されるため短時間ポーリングする
//--------------------------------------------------
function applyMountPositionWhenReady(insole, tries = 20) {
    const info = insole.device_information;
    if (info && typeof info.mount_position !== 'undefined') {
        const side = (info.mount_position & 0b1) === 1 ? 'R' : 'L';
        PressureViz.setFoot(side);
        AttitudeViz.setFoot(side);
        return;
    }
    if (tries <= 0) return;
    setTimeout(() => applyMountPositionWhenReady(insole, tries - 1), 250);
}

//--------------------------------------------------
// 初期化
//--------------------------------------------------
window.onload = function () {
    PressureViz.init();
    ImuViz.init();

    if (!navigator.bluetooth) {
        document.getElementById('bt_unsupported').classList.remove('d-none');
    }

    buildInsoleToolkit(
        document.getElementById('toolkit0'),
        'CONNECT',
        0,
        { streamingMode: 4, autoReconnect: true }
    );

    const insole = insoles[0];
    insole.setup();

    insole.gotQuat = function (quat) {
        notePending(quat);
        pending.quat = { w: quat.w, x: quat.x, y: quat.y, z: quat.z };
    };
    insole.gotEuler = function (euler) {
        pending.euler = { pitch: euler.pitch, roll: euler.roll, yaw: euler.yaw };
        // モード1は press が無く euler が各サンプルの最後に呼ばれる
        if (this.streaming_mode === 1) commitLiveFrame();
    };
    insole.gotConvertedAcc = function (acc) {
        notePending(acc);
        pending.acc = { x: acc.x, y: acc.y, z: acc.z };
    };
    insole.gotConvertedGyro = function (gyro) {
        notePending(gyro);
        pending.gyro = { x: gyro.x, y: gyro.y, z: gyro.z };
        // quaternion.js が読み込めず gotEuler が呼ばれない環境でのモード1フォールバック
        if (this.streaming_mode === 1 && typeof Quaternion === 'undefined') commitLiveFrame();
    };
    insole.gotPress = function (press) {
        notePending(press);
        pending.press = press.values.slice(0, 6);
        // モード3/4は press が各サンプルの最後に呼ばれる（SDKのコールバック順）
        commitLiveFrame();
    };
    insole.lostData = function (serial, prev) {
        console.warn(`INSOLE: lost packets ${prev} -> ${serial}`);
    };
    insole.onConnect = function () {
        applyMountPositionWhenReady(this);
    };
    insole.onReconnectSuccess = function () {
        applyMountPositionWhenReady(this);
    };

    // --- デモ再生（初期は合成歩行データ。収録CSVで差し替え可能） ---
    DemoPlayer.setRows(DemoData.generate());

    // --- 記録UI ---
    const recordToggle = document.getElementById('record_toggle');
    const recordDownload = document.getElementById('record_download');
    const recordStatus = document.getElementById('record_status');
    recordToggle.addEventListener('click', function () {
        if (Recorder.recording) {
            Recorder.stop();
            this.innerHTML = '<i class="bi bi-record-fill"></i> 記録開始';
            this.classList.replace('btn-outline-danger', 'btn-danger');
            recordDownload.disabled = Recorder.rows.length === 0;
        } else {
            Recorder.start();
            this.innerHTML = '<i class="bi bi-stop-fill"></i> 記録停止';
            this.classList.replace('btn-danger', 'btn-outline-danger');
            recordDownload.disabled = true;
        }
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
            csvStatus.textContent =
                `${file.name}: ${rows.length}行 / ${(DemoPlayer.durationMs() / 1000).toFixed(1)}秒 を読み込みました（未接続時にループ再生します）`;
            csvStatus.classList.remove('text-danger');
        } catch (e) {
            csvStatus.textContent = `読み込み失敗: ${e.message}`;
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
                this.textContent = 'copied!';
                setTimeout(() => { this.textContent = 'copy'; }, 1200);
            } catch (e) { /* clipboard 不許可時は何もしない */ }
        });
    });

    // --- 描画ループ ---
    const liveBadge = document.getElementById('live_badge');
    const noticePress = document.getElementById('notice_press');
    const noticeQuat = document.getElementById('notice_quat');
    const gauges = {
        pitch: [document.getElementById('gauge_pitch'), document.getElementById('val_pitch')],
        roll: [document.getElementById('gauge_roll'), document.getElementById('val_roll')],
        yaw: [document.getElementById('gauge_yaw'), document.getElementById('val_yaw')],
    };
    const quatReadout = document.getElementById('quat_readout');

    function setGauge(key, rad) {
        const deg = rad * 180 / Math.PI;
        const pct = Math.max(-50, Math.min(50, deg / 90 * 50));
        const [bar, val] = gauges[key];
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

            PressureViz.render();
            ImuViz.render();

            if (latestEuler) {
                setGauge('pitch', latestEuler.pitch);
                setGauge('roll', latestEuler.roll);
                setGauge('yaw', latestEuler.yaw);
            }
            if (latestQuat) {
                quatReadout.textContent =
                    `w ${latestQuat.w.toFixed(3)} / x ${latestQuat.x.toFixed(3)} / y ${latestQuat.y.toFixed(3)} / z ${latestQuat.z.toFixed(3)}`;
            }

            // LIVE/DEMO バッジ
            liveBadge.textContent = liveActive ? 'LIVE' : 'DEMO';
            liveBadge.classList.toggle('bg-success', liveActive);
            liveBadge.classList.toggle('bg-secondary', !liveActive);

            // ストリーミングモードによる配信有無の注記
            const mode = liveActive ? insole.streaming_mode : 0;
            noticePress.classList.toggle('d-none', mode !== 1);
            noticeQuat.classList.toggle('d-none', mode !== 3);

            // 記録ステータス
            if (Recorder.recording) {
                const sec = (performance.now() - Recorder.startedAt) / 1000;
                recordStatus.textContent =
                    `記録中 (${liveActive ? 'LIVE' : 'DEMO'}): ${Recorder.rows.length}行 / ${sec.toFixed(1)}秒`;
            } else if (Recorder.rows.length > 0) {
                recordStatus.textContent = `記録済み: ${Recorder.rows.length}行 — CSV保存できます`;
            }
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
};
