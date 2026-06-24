/**
 * 圧力セクションの可視化: 足型ヒートマップ + CoP + 6ch折れ線チャート（デバイスごとに1パネル）
 *
 * センサ座標はインソール画像内の白い十字マーカー（左足画像基準・0..1の比率）に合わせる。
 * 右足表示時は x を鏡像反転する。
 * チャネルの物理配置はモデルにより異なる場合があるため、配置を変えるときは
 * SENSOR_LAYOUT の並びだけを修正すればよい。
 */
const PRESSURE_SENSOR_LAYOUT = [
    { x: 0.7596, y: 0.1680 },  // p0
    { x: 0.7513, y: 0.3320 },  // p1
    { x: 0.4024, y: 0.2210 },  // p2
    { x: 0.5245, y: 0.3483 },  // p3
    { x: 0.2884, y: 0.3681 },  // p4
    { x: 0.5552, y: 0.8206 },  // p5
];

function createPressurePanel(deviceId, defaultFoot) {
    let foot = defaultFoot;
    let latest = null;
    let maxSeen = 1500;  // 色スケールの上限（観測値に追従して伸びる）
    let dots = [];
    let feed = null;
    let mapEl, copEl, totalEl;

    function position(i) {
        const p = PRESSURE_SENSOR_LAYOUT[i];
        return { x: foot === 'R' ? 1 - p.x : p.x, y: p.y };
    }

    function layoutDots() {
        dots.forEach((dot, i) => {
            const p = position(i);
            dot.style.left = `${p.x * 100}%`;
            dot.style.top = `${p.y * 100}%`;
        });
    }

    function init() {
        mapEl = document.getElementById(`footmap${deviceId}`);
        copEl = document.getElementById(`cop_dot${deviceId}`);
        totalEl = document.getElementById(`press_total${deviceId}`);

        dots = PRESSURE_SENSOR_LAYOUT.map((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'sensor-dot';
            dot.innerHTML = `<span>p${i}</span>`;
            mapEl.appendChild(dot);
            return dot;
        });
        setFoot(foot, true);

        feed = new ChartFeed(makeLineChart(`chart_press${deviceId}`, 'chartPressureTitle',
            ['p0', 'p1', 'p2', 'p3', 'p4', 'p5']));
    }

    function setFoot(side, force) {
        if (!force && side === foot) return;
        foot = side;
        mapEl.classList.toggle('is-left', side === 'L');
        mapEl.classList.toggle('is-right', side === 'R');
        layoutDots();
    }

    function push(frame) {
        if (!frame.press) return;
        latest = frame.press;
        feed.push(frame.press);
    }

    function render() {
        if (feed.flush()) feed.chart.update();
        if (!latest) return;

        let total = 0, cx = 0, cy = 0;
        latest.forEach((v, i) => {
            maxSeen = Math.max(maxSeen, v);
            const r = Math.min(1, v / maxSeen);
            // 低荷重=暗い青 → 高荷重=赤
            dots[i].style.backgroundColor = `hsl(${210 * (1 - r)}, 85%, ${18 + 38 * r}%)`;
            const p = position(i);
            total += v;
            cx += p.x * v;
            cy += p.y * v;
        });
        totalEl.textContent = `${total}`;

        // CoP は一定以上の荷重があるときだけ表示
        if (total > maxSeen * 0.2) {
            copEl.style.display = 'block';
            copEl.style.left = `${(cx / total) * 100}%`;
            copEl.style.top = `${(cy / total) * 100}%`;
        } else {
            copEl.style.display = 'none';
        }
    }

    return { init, setFoot, push, render };
}
