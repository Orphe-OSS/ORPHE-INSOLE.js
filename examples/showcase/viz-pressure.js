/**
 * 圧力セクションの可視化: 足型ヒートマップ + CoP + 6ch折れ線チャート
 *
 * センサ座標は hula-motion-sonifier の SENSOR_LAYOUT（左足画像基準・0..1の比率）を流用。
 * 右足表示時は x を鏡像反転する。
 * チャネルの物理配置はモデルにより異なる場合があるため、配置を変えるときは
 * SENSOR_LAYOUT の並びだけを修正すればよい。
 */
const PressureViz = (function () {

    const SENSOR_LAYOUT = [
        { label: 1, x: 0.25, y: 0.17 },  // toe-medial
        { label: 2, x: 0.25, y: 0.34 },  // ball-medial
        { label: 3, x: 0.64, y: 0.22 },  // toe-lateral
        { label: 4, x: 0.54, y: 0.35 },  // ball-center
        { label: 5, x: 0.79, y: 0.37 },  // lateral-midfoot
        { label: 6, x: 0.60, y: 0.88 },  // heel
    ];

    let feed = null;
    let foot = 'L';
    let latest = null;
    let maxSeen = 1500;  // 色スケールの上限（観測値に追従して伸びる）
    let dots = [];
    let mapEl, copEl, totalEl;

    function position(i) {
        const p = SENSOR_LAYOUT[i];
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
        mapEl = document.getElementById('footmap');
        copEl = document.getElementById('cop_dot');
        totalEl = document.getElementById('press_total');

        dots = SENSOR_LAYOUT.map((sensor, i) => {
            const dot = document.createElement('span');
            dot.className = 'sensor-dot';
            dot.innerHTML = `<span>p${i}</span>`;
            mapEl.appendChild(dot);
            return dot;
        });
        layoutDots();

        feed = new ChartFeed(makeLineChart('chart_press', 'Pressure (6ch raw)',
            ['p0', 'p1', 'p2', 'p3', 'p4', 'p5']));
    }

    function setFoot(side) {
        if (side === foot) return;
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
})();
