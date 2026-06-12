/**
 * ORPHE INSOLE Showcase — デモ用歩行データ
 *
 * 実機が無い環境でもページ全体が動くように、歩行を模した合成データを
 * 左右2台分（device 0 = 左足, device 1 = 右足・半周期ずらし）生成する。
 * 本アプリのCSV記録機能で収録した実データ（同じ列構成）を parseCSV で読み込めば、
 * そのままデモ再生のソースとして差し替えられる。
 *
 * フレーム形式（ライブ受信と共通。app.js の dispatchFrame に渡す単位）:
 *   { device, t[ms], serial, press:[6]|null, acc:{x,y,z}[G]|null,
 *     gyro:{x,y,z}[dps]|null, quat:{w,x,y,z}|null, euler:{pitch,roll,yaw}[rad]|null }
 */
const DemoData = (function () {

    const CSV_HEADER = [
        'device', 'timestamp', 'serial_number',
        'press0', 'press1', 'press2', 'press3', 'press4', 'press5',
        'acc_x', 'acc_y', 'acc_z',
        'gyro_x', 'gyro_y', 'gyro_z',
        'quat_w', 'quat_x', 'quat_y', 'quat_z',
        'euler_pitch', 'euler_roll', 'euler_yaw',
    ];

    // 歩行周期内のガウス状の山。phase, center は 0..1
    function bump(phase, center, width) {
        let d = Math.abs(phase - center);
        if (d > 0.5) d = 1 - d; // 周期境界をまたぐ
        return Math.exp(-(d * d) / (2 * width * width));
    }

    function eulerToQuat(pitch, roll, yaw) {
        const cp = Math.cos(pitch / 2), sp = Math.sin(pitch / 2);
        const cr = Math.cos(roll / 2), sr = Math.sin(roll / 2);
        const cy = Math.cos(yaw / 2), sy = Math.sin(yaw / 2);
        return {
            w: cy * cr * cp + sy * sr * sp,
            x: cy * cr * sp - sy * sr * cp,
            y: cy * sr * cp + sy * cr * sp,
            z: sy * cr * cp - cy * sr * sp,
        };
    }

    /**
     * 1サンプル分を合成する。
     * チャネル割当は hula-motion-sonifier の SENSOR_LAYOUT に合わせる:
     *   0:toe-medial 1:ball-medial 2:toe-lateral 3:ball-center 4:lateral-midfoot 5:heel
     */
    function sampleAt(t, phase, mirror) {
        const STANCE = 0.6; // 接地期の割合
        const noise = (amp) => (Math.random() - 0.5) * 2 * amp;
        const m = mirror ? -1 : 1; // 右足は左右対称に反転

        // --- 圧力: かかと→中足→母趾球→つま先 へ荷重が移動 ---
        const press = [
            1800 * bump(phase, 0.52, 0.09),  // 0 toe-medial
            2600 * bump(phase, 0.42, 0.12),  // 1 ball-medial
            1300 * bump(phase, 0.48, 0.09),  // 2 toe-lateral
            2400 * bump(phase, 0.38, 0.12),  // 3 ball-center
            1500 * bump(phase, 0.25, 0.14),  // 4 lateral-midfoot
            2800 * bump(phase, 0.12, 0.11),  // 5 heel
        ].map(v => Math.max(0, Math.round(v + noise(50))));

        // --- 加速度 [G]: 重力1G + 着地衝撃 + 周期的な揺れ ---
        const impact = 1.6 * bump(phase, 0.03, 0.02);
        const acc = {
            x: m * 0.25 * Math.sin(2 * Math.PI * phase) + noise(0.03),
            y: 0.12 * Math.sin(2 * Math.PI * phase * 2 + 1) + noise(0.03),
            z: 1.0 + impact + 0.18 * Math.sin(2 * Math.PI * phase * 2) + noise(0.04),
        };

        // --- ジャイロ [dps]: 遊脚期に大きなピッチ回転 ---
        const swing = phase > STANCE ? Math.sin(Math.PI * (phase - STANCE) / (1 - STANCE)) : 0;
        const gyro = {
            x: m * 30 * Math.sin(2 * Math.PI * phase * 2) + noise(8),
            y: 380 * swing - 90 * bump(phase, 0.55, 0.05) + noise(8),
            z: m * 20 * Math.sin(2 * Math.PI * phase + 2) + noise(8),
        };

        // --- 姿勢: 蹴り出しで底屈、遊脚中盤で背屈 ---
        const pitch = -0.45 * bump(phase, 0.62, 0.07) + 0.30 * bump(phase, 0.82, 0.1);
        const roll = m * (0.08 * Math.sin(2 * Math.PI * phase) + 0.02 * Math.sin(t / 900));
        const yaw = m * 0.06 * Math.sin(t / 1500);

        return { press, acc, gyro, quat: eulerToQuat(pitch, roll, yaw), euler: { pitch, roll, yaw } };
    }

    /**
     * 合成歩行データを生成する（左右2台分、t順）。
     * @param {number} durationMs 生成する長さ（既定30秒）
     * @param {number} hz サンプリング周波数（既定100Hz）
     * @returns {Array} フレーム配列
     */
    function generate(durationMs = 30000, hz = 100) {
        const CYCLE_MS = 1200; // 1歩行周期。右足は半周期ずらす
        const rows = [];
        const n = Math.floor(durationMs / 1000 * hz);
        for (let i = 0; i < n; i++) {
            const t = Math.round(i * 1000 / hz);
            const phaseL = (t % CYCLE_MS) / CYCLE_MS;
            const phaseR = (phaseL + 0.5) % 1;
            rows.push({ device: 0, t, serial: i, ...sampleAt(t, phaseL, false) });
            rows.push({ device: 1, t, serial: i, ...sampleAt(t, phaseR, true) });
        }
        return rows;
    }

    /**
     * 本アプリのCSV記録機能が出力した形式のCSVをフレーム配列に変換する。
     * 空欄のグループ（モードにより配信されなかった列）は null になる。
     * device 列が無い旧形式のCSVは device 0 として読み込む。
     * @param {string} text CSVテキスト
     * @returns {Array} フレーム配列（timestamp は先頭を0とした相対時刻に正規化）
     */
    function parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error('CSVにデータ行がありません');
        const header = lines[0].split(',').map(s => s.trim());
        const idx = {};
        CSV_HEADER.forEach(name => { idx[name] = header.indexOf(name); });
        if (idx.timestamp < 0) throw new Error('timestamp 列が見つかりません');

        const num = (cols, name) => {
            if (idx[name] < 0) return null;
            const s = cols[idx[name]];
            if (s === undefined || s === '') return null;
            const v = Number(s);
            return Number.isFinite(v) ? v : null;
        };

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const press = [0, 1, 2, 3, 4, 5].map(k => num(cols, `press${k}`));
            const acc = { x: num(cols, 'acc_x'), y: num(cols, 'acc_y'), z: num(cols, 'acc_z') };
            const gyro = { x: num(cols, 'gyro_x'), y: num(cols, 'gyro_y'), z: num(cols, 'gyro_z') };
            const quat = { w: num(cols, 'quat_w'), x: num(cols, 'quat_x'), y: num(cols, 'quat_y'), z: num(cols, 'quat_z') };
            const euler = { pitch: num(cols, 'euler_pitch'), roll: num(cols, 'euler_roll'), yaw: num(cols, 'euler_yaw') };
            rows.push({
                device: num(cols, 'device') ?? 0,
                t: num(cols, 'timestamp') ?? 0,
                serial: num(cols, 'serial_number') ?? i,
                press: press.every(v => v === null) ? null : press.map(v => v ?? 0),
                acc: acc.x === null ? null : acc,
                gyro: gyro.x === null ? null : gyro,
                quat: quat.w === null ? null : quat,
                euler: euler.pitch === null ? null : euler,
            });
        }
        // 先頭を 0ms に正規化し、t順に並べる（収録時刻のオフセットを除去）
        rows.sort((a, b) => a.t - b.t);
        const t0 = rows[0].t;
        rows.forEach(r => { r.t -= t0; });
        return rows;
    }

    return { CSV_HEADER, generate, parseCSV };
})();
