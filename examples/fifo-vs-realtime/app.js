/**
 * fifo-vs-realtime: 通常モード（リアルタイム/プッシュ型）と FIFO収録（ロスレス/プル型）を
 * 同条件で計測して比較するデモ。左右2台の同時計測に対応。
 *
 * - 通常モード計測: gotPress で届いたサンプルをそのまま記録（BLE取りこぼし＝欠損）
 * - FIFO計測: OrpheInsoleFifo で収録（再要求で欠損なし。回復不能分のみ dropped に計上）
 * - 到着チャート: サンプルの「実際に届いた時刻」をデバイス毎のレーンにプロット。
 *   プッシュは連続、プルはバーストになる
 * - シリアル連続性マップ: 計測範囲のシリアル番号を横に並べ、受信=緑 / 欠損=赤 で塗る
 */

/* global OrpheInsoleFifo */

const SERIAL_MOD = OrpheInsoleFifo.UINT16_MAX || 65535;
const DEVICE_IDS = [0, 1];
const DEVICE_LABEL = (id) => `INSOLE 0${id + 1}`;

// ---- 接続UI（InsoleToolkit・左右2台） -------------------------------------
for (const id of DEVICE_IDS) {
    buildInsoleToolkit(
        document.getElementById(`toolkit${id}`),
        DEVICE_LABEL(id),
        id,
        { streamingMode: 4, autoReconnect: true }
    );
}

// ---- 計測状態 -------------------------------------------------------------
let runState = 'idle';   // 'idle' | 'normal' | 'fifo' | 'stopping'
let run = null;          // 進行中の計測
const fifos = [null, null];

const el = {
    btnNormal: document.getElementById('btn_normal'),
    btnFifo: document.getElementById('btn_fifo'),
    btnCsv: document.getElementById('btn_csv'),
    duration: document.getElementById('duration_select'),
    status: document.getElementById('run_status'),
    gapBadge: document.getElementById('gap_badge'),
    lagWrap: document.getElementById('lag_wrap'),
    lagBadge: document.getElementById('lag_badge'),
    chart: document.getElementById('arrival_chart'),
};

function resultEl(mode, id) { return document.getElementById(`result_${mode}_${id}`); }
function mapEl(mode, id) { return document.getElementById(`map_${mode}_${id}`); }

function newDevRun() {
    return {
        sampleCount: 0,
        firstSerial: null,
        lastSerial: null,
        serials: new Set(),
        dropped: 0,
        maxArrivalGapMs: 0,
        lastArrivalAt: null,
    };
}

function newRun(mode, durationMs, activeIds) {
    const dev = {};
    for (const id of activeIds) dev[id] = newDevRun();
    return {
        mode,
        durationMs,
        activeIds,
        startedAt: performance.now(),
        endsAt: performance.now() + durationMs,
        dev,
    };
}

// 計測中のサンプル記録（通常/FIFO共通）
function recordSample(id, serial) {
    if (!run || !run.dev[id]) return;
    const d = run.dev[id];
    const now = performance.now();
    if (d.lastArrivalAt !== null) {
        d.maxArrivalGapMs = Math.max(d.maxArrivalGapMs, now - d.lastArrivalAt);
    }
    d.lastArrivalAt = now;
    d.sampleCount++;
    if (d.firstSerial === null) d.firstSerial = serial;
    d.lastSerial = serial;
    d.serials.add(serial);
}

function totalSamples() {
    if (!run) return 0;
    return Object.values(run.dev).reduce((sum, d) => sum + d.sampleCount, 0);
}

// ---- 到着チャート（直近12秒・デバイス毎のレーン） ---------------------------
const WINDOW_MS = 12000;
const points = []; // {t, v, mode, id}
let lastArrivalGlobal = null;

function pushPoint(id, total, mode) {
    lastArrivalGlobal = performance.now();
    points.push({ t: lastArrivalGlobal, v: total, mode, id });
}

function drawChart() {
    const canvas = el.chart;
    const w = canvas.clientWidth;
    const h = canvas.height;
    if (canvas.width !== w) canvas.width = w;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    const now = performance.now();
    while (points.length && points[0].t < now - WINDOW_MS) points.shift();

    const laneH = h / 2;

    // 時間グリッド（1秒毎）とレーン境界
    ctx.strokeStyle = '#f1f3f5';
    ctx.beginPath();
    for (let s = 0; s <= WINDOW_MS / 1000; s++) {
        const x = w - (s * 1000 / WINDOW_MS) * w;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
    }
    ctx.stroke();
    ctx.strokeStyle = '#dee2e6';
    ctx.beginPath();
    ctx.moveTo(0, laneH);
    ctx.lineTo(w, laneH);
    ctx.stroke();

    // レーンラベル
    ctx.fillStyle = '#adb5bd';
    ctx.font = '10px sans-serif';
    for (const id of DEVICE_IDS) {
        ctx.fillText(DEVICE_LABEL(id), 4, id * laneH + 12);
    }

    let vmax = 1000;
    for (const p of points) vmax = Math.max(vmax, p.v);

    for (const p of points) {
        const x = w - ((now - p.t) / WINDOW_MS) * w;
        const laneTop = p.id * laneH;
        const y = laneTop + laneH - 3 - (p.v / vmax) * (laneH - 16);
        ctx.fillStyle = p.mode === 'fifo' ? '#fd7e14' : '#0d6efd';
        ctx.fillRect(x - 1, y, 2, laneTop + laneH - 3 - y); // 縦線で「届いた瞬間」を強調
    }
}

// ---- シリアル連続性マップ ---------------------------------------------------
function serialSpanCount(first, last) {
    if (first === null || last === null) return 0;
    return OrpheInsoleFifo.serialDistance(first, last) + 1;
}

function drawSerialMap(canvas, result) {
    const w = canvas.clientWidth;
    const h = canvas.height;
    if (canvas.width !== w) canvas.width = w;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    if (!result || result.expectedSerials === 0) {
        ctx.fillStyle = '#f1f3f5';
        ctx.fillRect(0, 0, w, h);
        return;
    }
    const n = result.expectedSerials;
    // 1pxに複数シリアルを束ねる。束の中に欠損が1つでもあれば赤
    for (let x = 0; x < w; x++) {
        const from = Math.floor(x * n / w);
        const to = Math.max(from + 1, Math.floor((x + 1) * n / w));
        let missing = false;
        for (let i = from; i < to; i++) {
            const serial = (result.firstSerial + i) % SERIAL_MOD;
            if (!result.serials.has(serial)) { missing = true; break; }
        }
        ctx.fillStyle = missing ? '#dc3545' : '#198754';
        ctx.fillRect(x, 0, 1, h);
    }
}

// ---- 結果表示 --------------------------------------------------------------
function finalizeRun() {
    const r = run;
    run = null;
    const durationSec = (performance.now() - r.startedAt) / 1000;
    let grandTotal = 0;
    for (const id of r.activeIds) {
        const d = r.dev[id];
        const expected = serialSpanCount(d.firstSerial, d.lastSerial);
        const received = d.serials.size;
        const missing = Math.max(0, expected - received);
        const result = {
            mode: r.mode,
            id,
            durationSec,
            sampleCount: d.sampleCount,
            expectedSerials: expected,
            receivedSerials: received,
            missingSerials: missing,
            lossRate: expected > 0 ? (missing / expected * 100) : 0,
            effectiveHz: durationSec > 0 ? (d.sampleCount / durationSec) : 0,
            maxArrivalGapMs: d.maxArrivalGapMs,
            dropped: d.dropped,
            firstSerial: d.firstSerial,
            serials: d.serials,
        };
        renderResult(result);
        grandTotal += d.sampleCount;
    }
    return grandTotal;
}

function renderResult(result) {
    const isFifo = result.mode === 'fifo';
    const target = resultEl(result.mode, result.id);
    if (result.sampleCount === 0) {
        target.innerHTML = '<p class="text-muted small mb-0">データを受信できませんでした</p>';
        drawSerialMap(mapEl(result.mode, result.id), null);
        return;
    }
    const lossBadge = result.missingSerials === 0
        ? '<span class="badge bg-success">欠損なし</span>'
        : `<span class="badge bg-danger">${result.missingSerials} シリアル欠損 (${result.lossRate.toFixed(2)}%)</span>`;
    const rows = [
        ['計測時間', `${result.durationSec.toFixed(1)} 秒`],
        ['受信サンプル数', `${result.sampleCount.toLocaleString()} <span class="text-muted">(実効 ${result.effectiveHz.toFixed(1)} Hz)</span>`],
        ['期待シリアル数', result.expectedSerials.toLocaleString()],
        ['受信シリアル数', result.receivedSerials.toLocaleString()],
        ['欠損', lossBadge],
        ['最大到着間隔', `${Math.round(result.maxArrivalGapMs)} ms <span class="text-muted">(${isFifo ? 'バーストの間隔' : '取りこぼし/揺らぎ'})</span>`],
    ];
    if (isFifo) {
        rows.push(['回復不能ロス計上', result.dropped === 0
            ? '<span class="badge bg-success">0（onDataLoss 通知なし）</span>'
            : `<span class="badge bg-danger">${result.dropped}（onDataLoss で通知済み）</span>`]);
    }
    target.innerHTML = `<table class="table table-sm small mb-0"><tbody>${rows.map(([k, v]) => `<tr><th class="text-muted fw-normal" style="width: 45%;">${k}</th><td>${v}</td></tr>`).join('')
        }</tbody></table>`;
    drawSerialMap(mapEl(result.mode, result.id), result);
}

// ---- 計測制御 --------------------------------------------------------------
function isConnected(id) {
    try {
        return typeof insoles !== 'undefined' && insoles[id] &&
            typeof insoles[id].isConnected === 'function' && insoles[id].isConnected();
    } catch (_) {
        return false;
    }
}

function connectedIds() {
    return DEVICE_IDS.filter((id) => isConnected(id));
}

function setButtons() {
    const anyConnected = connectedIds().length > 0;
    el.btnNormal.disabled = !anyConnected || runState === 'fifo' || runState === 'stopping';
    el.btnFifo.disabled = !anyConnected || runState === 'normal' || runState === 'stopping';
    el.btnNormal.innerHTML = runState === 'normal'
        ? '<i class="bi bi-stop-fill"></i> 停止'
        : '<i class="bi bi-broadcast"></i> 通常モードで計測';
    el.btnFifo.innerHTML = runState === 'fifo'
        ? '<i class="bi bi-stop-fill"></i> 停止'
        : '<i class="bi bi-database-down"></i> FIFO収録で計測';
    el.lagWrap.classList.toggle('d-none', runState !== 'fifo');
}

function startNormal() {
    const ids = connectedIds();
    if (ids.length === 0) return;
    run = newRun('normal', parseInt(el.duration.value), ids);
    runState = 'normal';
    setButtons();
}

async function startFifo() {
    const ids = connectedIds();
    if (ids.length === 0) return;
    runState = 'stopping'; // 準備中はボタンを止める
    setButtons();
    el.status.textContent = 'FIFO収録を準備中…';
    const results = await Promise.all(ids.map((id) => fifos[id].start()));
    const activeIds = ids.filter((_, i) => results[i]);
    if (activeIds.length === 0) {
        runState = 'idle';
        el.status.textContent = 'FIFO収録の開始に失敗しました（接続を確認してください）';
        setButtons();
        return;
    }
    // start() のハンドシェイク後に計測窓を開始する
    run = newRun('fifo', parseInt(el.duration.value), activeIds);
    runState = 'fifo';
    setButtons();
}

async function finishCurrentRun() {
    if (!run) return;
    if (run.mode === 'normal') {
        runState = 'idle';
        const total = finalizeRun();
        el.status.textContent = `通常モードの計測が完了（計 ${total.toLocaleString()} サンプル）`;
        setButtons();
    } else {
        runState = 'stopping';
        setButtons();
        el.status.textContent = 'FIFO収録を停止中（残りデータを回収しています）…';
        const ids = run.activeIds;
        await Promise.all(ids.map((id) => fifos[id].stop()));
        if (run) {
            for (const id of ids) run.dev[id].dropped = fifos[id].droppedCount;
        }
        runState = 'idle';
        const total = finalizeRun();
        const droppedTotal = ids.reduce((sum, id) => sum + fifos[id].droppedCount, 0);
        el.btnCsv.disabled = ids.every((id) => fifos[id].collectedCount === 0);
        el.status.textContent = `FIFO収録が完了（計 ${total.toLocaleString()} サンプル、回復不能ロス ${droppedTotal}）`;
        setButtons();
    }
}

el.btnNormal.addEventListener('click', () => {
    if (runState === 'normal') { finishCurrentRun(); return; }
    startNormal();
});
el.btnFifo.addEventListener('click', () => {
    if (runState === 'fifo') { finishCurrentRun(); return; }
    startFifo();
});
el.btnCsv.addEventListener('click', () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    for (const id of DEVICE_IDS) {
        if (fifos[id] && fifos[id].collectedCount > 0) {
            fifos[id].download(`fifo-vs-realtime-insole0${id + 1}-${stamp}.csv`);
        }
    }
});

// ---- データ配線 ------------------------------------------------------------
window.onload = function () {
    if (!navigator.bluetooth) {
        document.getElementById('bt_unsupported').classList.remove('d-none');
    }

    for (const id of DEVICE_IDS) {
        insoles[id].setup();

        // 通常モード: 届いたサンプルをそのまま記録・描画（this.id でデバイス判別）
        insoles[id].gotPress = function (press) {
            const total = press.values.reduce((a, b) => a + b, 0);
            pushPoint(this.id, total, 'normal');
            if (run && run.mode === 'normal' && runState === 'normal') {
                recordSample(this.id, press.serial_number);
            }
        };

        // FIFO: 収録データをライブ反映（回収なのでバースト到着になる）
        const fifo = new OrpheInsoleFifo(insoles[id], { startupDelayMs: 800 });
        fifo.onSamples = function (deviceId, samples) {
            for (const s of samples) {
                const total = s.press.values.reduce((a, b) => a + b, 0);
                pushPoint(deviceId, total, 'fifo');
                if (run && run.mode === 'fifo') recordSample(deviceId, s.serial_number);
            }
        };
        fifo.onProgress = function (info) {
            if (this.deviceId === (run && run.activeIds[0])) {
                el.lagBadge.textContent = String(info.lag);
            }
        };
        fifo.onDataLoss = function (info) {
            console.warn(`${DEVICE_LABEL(this.deviceId)}: FIFO data loss (${info.reason}): +${info.dropped}, cumulative ${info.cumulative}`);
            if (run && run.mode === 'fifo' && run.dev[this.deviceId]) {
                run.dev[this.deviceId].dropped = info.cumulative;
            }
        };
        fifo.onError = function (error) {
            console.warn(`${DEVICE_LABEL(this.deviceId)}: FIFO error`, error);
        };
        fifos[id] = fifo;
    }
};

// ---- 描画・状態ループ --------------------------------------------------------
let lastConnectedCount = -1;
(function loop() {
    drawChart();

    // 到着ギャップ表示
    if (lastArrivalGlobal !== null) {
        const gap = Math.round(performance.now() - lastArrivalGlobal);
        el.gapBadge.textContent = `${gap} ms`;
        el.gapBadge.className = 'badge ' + (gap > 300 ? 'bg-warning text-dark' : 'bg-secondary');
    }

    // 接続状態でボタンを更新
    const n = connectedIds().length;
    if (n !== lastConnectedCount) {
        lastConnectedCount = n;
        setButtons();
        if (n > 0 && runState === 'idle') el.status.textContent = `${n} 台接続中。計測を開始できます（左右2台の接続を推奨）`;
        else if (n === 0 && runState === 'idle') el.status.textContent = 'INSOLE を接続してください（左右2台の接続を推奨）';
    }

    // 残り時間表示と自動停止
    if (run && (runState === 'normal' || runState === 'fifo')) {
        const remain = run.endsAt - performance.now();
        if (remain <= 0) {
            finishCurrentRun();
        } else {
            const label = run.mode === 'normal' ? '通常モード' : 'FIFO収録';
            el.status.textContent = `${label}で計測中（${run.activeIds.length}台）… 残り ${Math.ceil(remain / 1000)} 秒（サンプル計 ${totalSamples().toLocaleString()}）`;
        }
    }

    requestAnimationFrame(loop);
})();
