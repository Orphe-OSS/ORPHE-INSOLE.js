/**
 * ORPHE INSOLE — Exhibition Display（展示用1画面ダッシュボード）
 *
 * 画面構成（3列×2段。スクロールなし）:
 *   左上 圧力分布(足型+CoP) / 左下 TOTAL PRESSURE + 6ch波形
 *   中上 姿勢3D            / 中下 Euler(pitch/roll/yaw)の推移
 *   右上 IMU(acc/gyro)     / 右下 Step Analysis（直近1歩 と 直近5歩平均）
 *
 * 役割:
 *  - 可視化は showcase のモジュール（viz-pressure / viz-imu / viz-3d）を再利用し、
 *    このファイルは「接続・フレーム組み立て・デモ再生・描画ループ・展示用の見せ方」を担当する
 *  - 実機が無い間は合成歩行データ（../showcase/demo-data.js）と合成の歩容結果をループ再生する
 *  - 描画は requestAnimationFrame で約25fpsにスロットリング（CLAUDE.md Pattern 5）
 */

const HISTORY = 160;           // チャートに表示するサンプル数
const RENDER_INTERVAL_MS = 40; // 描画間隔（約25fps。チャート8枚+3DなのでShowcaseより控えめ）
const LIVE_TIMEOUT_MS = 1500;  // ライブ受信がこの時間途絶えたらデモ再生に戻る
const PRESSURE_GAUGE_MAX = 10000;
const FOOT_LOCAL_X_RANGE = 0.58;
const FOOT_LOCAL_Y_RANGE = 0.9;
const FOOTMAP_ASPECT = 0.411;  // 足型画像の 幅/高さ（showcase の .insole-map と同じ）
const STEP_AVG_WINDOW = 5;     // 「直近N歩の平均」のN
const STEP_STALE_MS = 8000;    // これ以上新しい歩が来なければ淡色表示

const SERIES_COLORS = [
    'rgb(69, 230, 230)',
    'rgb(255, 96, 64)',
    'rgb(255, 255, 255)',
    'rgb(127, 127, 127)',
    'rgb(255, 205, 86)',
    'rgb(153, 102, 255)',
];

/**
 * showcase の viz モジュールはチャート見出しを i18n キーで渡してくる。
 * 展示ページは見出しをHTML側に持つので、ここではキーをそのまま返すだけでよい。
 */
function i18nText(key, params, fallback) {
    return fallback || key;
}

/** 折れ線チャート（親要素の高さに追従させるため maintainAspectRatio: false） */
function makeLineChart(canvasId, titleKey, seriesLabels, yMin, yMax) {
    const datasets = seriesLabels.map((label, i) => ({
        label,
        backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
        borderColor: SERIES_COLORS[i % SERIES_COLORS.length],
        pointRadius: 0,
        borderWidth: 1.4,
        data: [],
    }));
    const scales = {
        x: { ticks: { display: false }, grid: { color: '#1b262d' } },
        y: { ticks: { color: '#8ba3b0', font: { size: 9 }, maxTicksLimit: 5 }, grid: { color: '#1b262d' } },
    };
    if (typeof yMin === 'number' && typeof yMax === 'number') {
        scales.y.min = yMin;
        scales.y.max = yMax;
    }
    return new Chart(document.getElementById(canvasId), {
        type: 'line',
        data: { labels: [], datasets },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 0 },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: { boxWidth: 8, boxHeight: 8, color: '#8ba3b0', font: { size: 9 }, padding: 4 },
                },
                title: { display: false },
                tooltip: { enabled: false },
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
// 圧力の集計（TOTAL PRESSURE ゲージ用）
//--------------------------------------------------
function computeFootPressureState(values, side) {
    if (!Array.isArray(values)) return null;
    const layout = OrpheInsoleUtils.SENSOR_LAYOUT_IMAGE;
    let load = 0, x = 0, y = 0;
    values.slice(0, 6).forEach((raw, index) => {
        const value = Math.max(0, Number(raw) || 0);
        const point = layout[index];
        const imageX = side === 'R' ? 1 - point.x : point.x;
        load += value;
        x += (imageX - 0.5) * FOOT_LOCAL_X_RANGE * value;
        y += (0.5 - point.y) * FOOT_LOCAL_Y_RANGE * value;
    });
    if (load <= 0) return { side, load: 0, cop: { x: 0, y: 0 } };
    return { side, load, cop: { x: x / load, y: y / load } };
}

function createPressureGauge() {
    const dom = {
        totalValue: document.getElementById('pressure_total_value'),
        leftValue: document.getElementById('pressure_left_value'),
        rightValue: document.getElementById('pressure_right_value'),
        totalBar: document.getElementById('pressure_total_gauge'),
        leftBar: document.getElementById('pressure_left_bar'),
        rightBar: document.getElementById('pressure_right_bar'),
    };

    function setWidth(element, value, max) {
        const pct = Math.max(0, Math.min(100, value / max * 100));
        element.style.width = `${pct.toFixed(1)}%`;
    }

    function render(left, right) {
        const leftLoad = left ? left.load : 0;
        const rightLoad = right ? right.load : 0;
        dom.totalValue.textContent = String(Math.round(leftLoad + rightLoad));
        dom.leftValue.textContent = String(Math.round(leftLoad));
        dom.rightValue.textContent = String(Math.round(rightLoad));
        setWidth(dom.totalBar, leftLoad + rightLoad, PRESSURE_GAUGE_MAX * 2);
        setWidth(dom.leftBar, leftLoad, PRESSURE_GAUGE_MAX);
        setWidth(dom.rightBar, rightLoad, PRESSURE_GAUGE_MAX);
    }

    return { render };
}

/**
 * 足型マップを「枠に収まる最大サイズ」にする。
 * センサドットは要素サイズに対する % 配置なので、アスペクト比を崩さず
 * 実寸(px)を与える必要がある（CSSのflex+aspect-ratioだけでは横にはみ出す）。
 */
function fitFootmaps() {
    let pending = false;
    for (let id = 0; id < 2; id++) {
        const map = document.getElementById(`footmap${id}`);
        const box = map.parentElement;
        // 枠の実測。マップ自身は絶対配置ではないので、先に自分のサイズを外して測り直す
        const h = box.clientHeight;
        const w = box.clientWidth;
        if (h <= 0 || w <= 0) {
            pending = true;   // レイアウト確定前。次フレームで測り直す
            continue;
        }
        const height = Math.min(h, w / FOOTMAP_ASPECT);
        map.style.height = `${Math.floor(height)}px`;
        map.style.width = `${Math.floor(height * FOOTMAP_ASPECT)}px`;
    }
    if (pending) requestAnimationFrame(fitFootmaps);
}

//--------------------------------------------------
// Step Analysis（歩容解析）の集計
//--------------------------------------------------
const stepHistory = [[], []];      // デバイスごとの直近の歩（最大 STEP_AVG_WINDOW 件）
const stepTotals = [0, 0];         // 累計歩数
const stepLastAt = [0, 0];         // 最終受信時刻
const stepUnavailable = [null, null]; // Step購読に失敗したデバイスのエラーコード
let stepSource = 'none';           // 'live' | 'demo' | 'none'

function pushGaitRow(deviceId, row) {
    if (deviceId !== 0 && deviceId !== 1) return;
    const history = stepHistory[deviceId];
    history.push(row);
    while (history.length > STEP_AVG_WINDOW) history.shift();
    stepTotals[deviceId] += 1;
    stepLastAt[deviceId] = performance.now();
}

function stanceRatioPercent(row) {
    if (!row || !Number.isFinite(row.stance_phase_s) || !Number.isFinite(row.duration_s)) return null;
    if (row.duration_s <= 0) return null;
    return row.stance_phase_s / row.duration_s * 100;
}

function average(values) {
    const valid = values.filter(v => Number.isFinite(v));
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/** 直近N歩で最も多かった分類（同数なら最新のもの） */
function majority(values) {
    const valid = values.filter(Boolean);
    if (valid.length === 0) return null;
    const counts = new Map();
    valid.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
    let best = valid[valid.length - 1];
    let bestCount = 0;
    for (const [value, count] of counts) {
        if (count > bestCount) {
            best = value;
            bestCount = count;
        }
    }
    return best;
}

function createStepPanel() {
    const dom = [0, 1].map(id => ({
        panel: document.getElementById(`step_panel${id}`),
        count: document.getElementById(`step_count${id}`),
        speed: document.getElementById(`step_speed${id}`),
        speedAvg: document.getElementById(`step_speed_avg${id}`),
        stance: document.getElementById(`step_stance${id}`),
        stanceAvg: document.getElementById(`step_stance_avg${id}`),
        strike: document.getElementById(`step_strike${id}`),
        strikeAvg: document.getElementById(`step_strike_avg${id}`),
        pron: document.getElementById(`step_pron${id}`),
        pronAvg: document.getElementById(`step_pron_avg${id}`),
    }));
    const status = document.getElementById('step_status');

    const num = (v, d) => (v === null || v === undefined || !Number.isFinite(v)) ? '-' : v.toFixed(d);
    /** 立脚期の%から「立脚期：遊脚期」表記を作る */
    const ratio = (stancePercent) => (stancePercent === null || !Number.isFinite(stancePercent))
        ? '-'
        : `${Math.round(stancePercent)}:${Math.round(100 - stancePercent)}`;

    function render(now) {
        for (let id = 0; id < 2; id++) {
            const history = stepHistory[id];
            const last = history[history.length - 1];
            const cell = dom[id];
            cell.count.textContent = String(stepTotals[id]);
            cell.panel.classList.toggle('is-stale', !last || (now - stepLastAt[id]) > STEP_STALE_MS);
            if (!last) continue;

            cell.speed.textContent = num(last.speed_mps, 2);
            cell.speedAvg.textContent = `avg ${num(average(history.map(r => r.speed_mps)), 2)}`;

            // 立脚期：遊脚期の割合（合計100%）
            const stance = stanceRatioPercent(last);
            const stanceAvg = average(history.map(stanceRatioPercent));
            cell.stance.textContent = ratio(stance);
            cell.stanceAvg.textContent = `avg ${ratio(stanceAvg)}`;

            cell.strike.textContent = last.foot_strike || '-';
            cell.strikeAvg.textContent = majority(history.map(r => r.foot_strike)) || '-';

            const pronDeg = num(last.pronation_deg, 1);
            cell.pron.textContent = `${last.pronation_type || '-'} ${pronDeg}°`;
            cell.pronAvg.textContent = `avg ${num(average(history.map(r => r.pronation_deg)), 1)}°`;
        }

        const failure = stepUnavailable.find(Boolean);
        if (failure) {
            status.textContent = failure;
        } else if (stepSource === 'demo') {
            status.textContent = 'demo steps';
        } else if (stepTotals[0] + stepTotals[1] > 0) {
            status.textContent = 'live steps';
        } else {
            status.textContent = 'walk to see steps…';
        }
    }

    return { render };
}

//--------------------------------------------------
// 状態（デバイス0/1）
//--------------------------------------------------
let lastLiveAt = -Infinity;
const lastLiveAtDev = [-Infinity, -Infinity];
let liveActive = false;
const latestEuler = [null, null];
const latestQuat = [null, null];
const latestPressure = [null, null];
const sides = ['L', 'R'];

let pressurePanels = [];
let imuPanels = [];
let eulerFeeds = [];
let pressureGauge = null;
let stepPanel = null;
// FW差で pitch/roll が入れ替わる個体向け（実体は AttitudeViz の SWAP_R）。
// 展示機（FW 202605）では ON が実機と一致するため既定ON。
let swapPitchRoll = true;

//--------------------------------------------------
// 1フレーム = 1サンプル分のデータ（ライブ・デモ共通の入口）
//--------------------------------------------------
function dispatchFrame(deviceId, frame, isLive) {
    if (deviceId !== 0 && deviceId !== 1) return;
    if (isLive) {
        lastLiveAt = performance.now();
        lastLiveAtDev[deviceId] = lastLiveAt;
    }

    pressurePanels[deviceId].push(frame);
    imuPanels[deviceId].push(frame);
    if (frame.press) latestPressure[deviceId] = frame.press.slice(0, 6);
    if (frame.quat) {
        latestQuat[deviceId] = frame.quat;
        AttitudeViz.setQuat(deviceId, frame.quat);
    }
    if (frame.euler) latestEuler[deviceId] = frame.euler;
}

//--------------------------------------------------
// デモ再生（ライブ受信が無い間だけ動く）
//--------------------------------------------------
const DemoPlayer = {
    rows: [],
    idx: 0,
    clock: 0,
    lastTick: 0,
    nextStepAt: 900,
    stepParity: 0,

    setRows(rows) {
        this.rows = rows;
        this.idx = 0;
        this.clock = 0;
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
        // 合成歩行に合わせて歩容結果も交互に流す（demo-data.js の歩行周期 1200ms）
        while (this.clock >= this.nextStepAt) {
            pushGaitRow(this.stepParity, demoGaitRow());
            stepSource = 'demo';
            this.stepParity = 1 - this.stepParity;
            this.nextStepAt += 600;
        }
        if (this.idx >= this.rows.length) { // ループ再生
            this.idx = 0;
            this.clock = 0;
            this.nextStepAt = 900;
        }
    },
};

/** デモ用の歩容パラメーター（実機の値域に合わせた合成値。LIVE時は使わない） */
function demoGaitRow() {
    const jitter = (base, spread) => base + (Math.random() - 0.5) * 2 * spread;
    const stance = jitter(0.72, 0.04);
    const swing = jitter(0.46, 0.03);
    const duration = stance + swing;
    const stride = jitter(1.32, 0.06);
    return {
        gait_type: 'walk',
        stance_phase_s: stance,
        swing_phase_s: swing,
        duration_s: duration,
        stride_norm_m: stride,
        cadence_hz: 1 / duration,
        speed_mps: stride / duration,
        foot_strike: Math.random() < 0.85 ? 'heelStrike' : 'midfoot',
        strike_angle_deg: jitter(18, 3),
        pronation_deg: jitter(5.5, 2.5),
        pronation_type: Math.random() < 0.75 ? 'neutral' : 'over',
    };
}

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

    for (const prefix of ['press_panel', 'presschart_panel', 'euler_panel', 'imu_panel', 'step_panel']) {
        const panel = document.getElementById(`${prefix}${deviceId}`);
        if (!panel) continue;
        panel.style.order = (side === 'L') ? 0 : 1; // 左足を先（画面左・上）に
        const badge = panel.querySelector('.side-badge');
        if (badge) {
            badge.textContent = side;
            badge.classList.toggle('is-left', side === 'L');
            badge.classList.toggle('is-right', side === 'R');
        }
    }

    // もう一方が未接続なら、表示の重複を避けて反対側に寄せる
    const other = 1 - deviceId;
    const otherLive = (performance.now() - lastLiveAtDev[other]) < LIVE_TIMEOUT_MS;
    if (!otherLive && sides[other] === side) {
        applySide(other, side === 'L' ? 'R' : 'L');
    }
}

/**
 * Step Analysis は接続完了後に追加で有効化する。
 * 接続時に一緒に要求すると、FWがSTEP通知を出さない個体で connect 自体が失敗し、
 * 展示中にライブ表示ごと落ちてしまう。後から有効化すればセッションが
 * Realtime Raw のみへロールバックするので、他のパネルは動き続ける。
 */
function enableStepAnalysisWhenReady(deviceId, tries = 12) {
    const session = getInsoleToolkitSession(deviceId);
    if (!session || !session.supportsStepAnalysis) return;
    const snapshot = session.snapshot();
    if (!snapshot.connected || snapshot.transitioning) {
        if (tries <= 0) return;
        setTimeout(() => enableStepAnalysisWhenReady(deviceId, tries - 1), 400);
        return;
    }
    if (session.outputs && session.outputs.stepAnalysis) return;
    session.setOutputs({ sensorValues: true, stepAnalysis: true }).catch((error) => {
        stepUnavailable[deviceId] = error && error.code ? error.code : 'STEP_UNAVAILABLE';
        console.warn(`INSOLE${deviceId}: step analysis unavailable`, error);
    });
}

/** device_information は接続処理の中で取得されるため、入るまで短時間ポーリングする */
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
    pressureGauge = createPressureGauge();
    stepPanel = createStepPanel();
    pressurePanels.forEach(p => p.init());
    imuPanels.forEach(p => p.init());
    eulerFeeds = [0, 1].map(id => new ChartFeed(
        makeLineChart(`chart_euler${id}`, 'euler', ['pitch', 'roll', 'yaw'], -180, 180)));

    fitFootmaps();
    window.addEventListener('resize', fitFootmaps);
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(fitFootmaps).observe(document.getElementById('footmaps'));
    }

    if (!navigator.bluetooth) {
        document.getElementById('bt_unsupported').classList.remove('d-none');
    }

    for (let id = 0; id < 2; id++) {
        buildInsoleToolkit(
            document.getElementById(`toolkit${id}`),
            `0${id + 1}`,
            id,
            {
                streamingMode: 4,          // press + acc + gyro + quat（この画面は全部使う）
                autoReconnect: true,
                sensorDataMode: 'realtime',
                // 接続はRawだけで確立し、Step Analysisは接続後に追加する
                // （enableStepAnalysisWhenReady。最終形は realtime-full-step 相当）
                outputs: { sensorValues: true, stepAnalysis: false },
                gait: {
                    onGait(deviceId, row) {
                        stepSource = 'live';
                        pushGaitRow(deviceId, row);
                    },
                },
                onError(error) {
                    console.warn(`INSOLE${id}: toolkit error`, error);
                },
            }
        );

        const insole = insoles[id];
        insole.setup();

        insole.gotQuat = function (quat) {
            notePending(this.id, quat);
            pendings[this.id].quat = { w: quat.w, x: quat.x, y: quat.y, z: quat.z };
        };
        insole.gotEuler = function (euler) {
            pendings[this.id].euler = { pitch: euler.pitch, roll: euler.roll, yaw: euler.yaw };
            if (this.streaming_mode === 1) commitLiveFrame(this.id);
        };
        insole.gotConvertedAcc = function (acc) {
            notePending(this.id, acc);
            pendings[this.id].acc = { x: acc.x, y: acc.y, z: acc.z };
        };
        insole.gotConvertedGyro = function (gyro) {
            notePending(this.id, gyro);
            pendings[this.id].gyro = { x: gyro.x, y: gyro.y, z: gyro.z };
            if (this.streaming_mode === 1 && typeof Quaternion === 'undefined') commitLiveFrame(this.id);
        };
        insole.gotPress = function (press) {
            notePending(this.id, press);
            pendings[this.id].press = press.values.slice(0, 6);
            // モード3/4は press が各サンプルの最後に呼ばれる（SDKのコールバック順）
            commitLiveFrame(this.id);
        };
        insole.onConnect = function () {
            applyMountPositionWhenReady(this);
            enableStepAnalysisWhenReady(this.id);
        };
        insole.onReconnectSuccess = function () {
            applyMountPositionWhenReady(this);
            enableStepAnalysisWhenReady(this.id);
        };
    }

    applySide(0, 'L');
    applySide(1, 'R');

    DemoPlayer.setRows(DemoData.generate());

    // --- 姿勢まわりの操作 ---
    const swapToggle = document.getElementById('swap_pitch_roll');
    const applySwapPitchRoll = (enabled) => {
        swapPitchRoll = enabled;
        AttitudeViz.setSwapPitchRoll(enabled);
    };
    swapToggle.checked = swapPitchRoll;
    applySwapPitchRoll(swapPitchRoll);
    swapToggle.addEventListener('change', function () {
        applySwapPitchRoll(this.checked);
    });
    document.getElementById('reset_attitude').addEventListener('click', () => AttitudeViz.reset());

    // --- 全画面（展示時はこれで枠を消す） ---
    document.getElementById('fullscreen_btn').addEventListener('click', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen().catch((e) => console.warn('fullscreen', e));
        }
    });

    startRenderLoop();
};

//--------------------------------------------------
// 描画ループ
//--------------------------------------------------
function startRenderLoop() {
    const liveBadge = document.getElementById('live_badge');
    const eulerValues = [0, 1].map(id => ({
        pitch: document.getElementById(`val_pitch${id}`),
        roll: document.getElementById(`val_roll${id}`),
        yaw: document.getElementById(`val_yaw${id}`),
    }));

    /**
     * 表示用オイラー角。入れ替えONのときはCGと同じ変換後クォータニオンから計算するので、
     * 3Dモデルの動きと数値・グラフが食い違わない。
     */
    function displayEuler(id) {
        const euler = latestEuler[id];
        if (!swapPitchRoll) return euler;
        const q = latestQuat[id];
        if (q && typeof Quaternion !== 'undefined') {
            const s = AttitudeViz.oriented(q);
            return new Quaternion(s.w, s.x, s.y, s.z).toEuler();
        }
        if (!euler) return null;
        return { pitch: euler.roll, roll: euler.pitch, yaw: euler.yaw };
    }

    const toDeg = (rad) => rad * 180 / Math.PI;
    const fmtDeg = (rad) => {
        const value = toDeg(rad);
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}°`;
    };

    let lastRender = 0;
    function loop(now) {
        liveActive = (performance.now() - lastLiveAt) < LIVE_TIMEOUT_MS;
        DemoPlayer.tick(now);

        if (now - lastRender >= RENDER_INTERVAL_MS) {
            lastRender = now;

            let left = null, right = null;
            for (let id = 0; id < 2; id++) {
                pressurePanels[id].render();
                imuPanels[id].render();

                const euler = displayEuler(id);
                if (euler) {
                    eulerValues[id].pitch.textContent = fmtDeg(euler.pitch);
                    eulerValues[id].roll.textContent = fmtDeg(euler.roll);
                    eulerValues[id].yaw.textContent = fmtDeg(euler.yaw);
                    eulerFeeds[id].push([toDeg(euler.pitch), toDeg(euler.roll), toDeg(euler.yaw)]);
                }
                if (eulerFeeds[id].flush()) eulerFeeds[id].chart.update();

                const foot = computeFootPressureState(latestPressure[id], sides[id]);
                if (foot && sides[id] === 'L') left = foot;
                if (foot && sides[id] === 'R') right = foot;
            }
            pressureGauge.render(left, right);

            // 歩容は1歩ごと（低頻度）だが、経過による淡色化もあるので毎描画で反映する
            stepPanel.render(performance.now());

            liveBadge.textContent = liveActive ? 'LIVE' : 'DEMO';
            liveBadge.classList.toggle('is-live', liveActive);
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}
