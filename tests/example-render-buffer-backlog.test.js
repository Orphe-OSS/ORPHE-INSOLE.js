/**
 * 描画用バッファの滞留に対する回帰テスト。
 *
 * 対象の不具合（2026-11-08、展示ページ examples/exhibition で実機接続中に発生）:
 *  描画ループ（requestAnimationFrame）はタブ非表示・ウィンドウの完全遮蔽で止まるが、
 *  BLE の受信コールバックは 200Hz で動き続ける。受信バッファ（ChartFeed.pending）に
 *  上限が無かったため、約 80 分で 1 本あたり数十万件が溜まり（RSS 750MB）、復帰時の
 *  flush() が「全件 push → 表示件数まで 1 件ずつ shift」で O(n²) となってレンダラが
 *  数十分間 CPU 99% で固まった（Node でも 2 万件 171ms → 4 万件 710ms と 4 倍ずつ増える）。
 *
 * 固定する性質:
 *  1. pending は表示件数（HISTORY）の 2 倍を超えて溜まらない
 *  2. flush() は shift() を一切呼ばず、滞留量によらず表示件数ぶんだけ流し込む
 *  3. 流し込まれるのは最新の HISTORY 件で、通し番号（count）は捨てた分も進む
 *  4. 時間窓で trim する example（data-modes / fifo-vs-realtime）は push 時に窓外を捨てる
 *
 * example のスクリプトはブラウザ用トップレベルスクリプト（window 依存）で require
 * できないため、ソースから対象の class / function を切り出して vm で評価する。
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

// ── 1〜3. ChartFeed（exhibition / showcase / VISUALIZE / insole-core-combo の同型コピー） ──
const CHART_FEED_FILES = [
    'examples/exhibition/app.js',
    'examples/showcase/app.js',
    'examples/VISUALIZE/sketch.js',
    'examples/insole-core-combo/app.js',
];

function loadChartFeed(rel) {
    const src = read(rel);
    const cls = src.match(/class ChartFeed \{[\s\S]*?\n\}/);
    assert.ok(cls, `${rel}: class ChartFeed が見つからない`);
    assert.ok(!/\.shift\(\)/.test(cls[0]), `${rel}: ChartFeed に shift() が残っている（復帰時に O(n²) で固まる）`);
    const constant = src.match(/^const (HISTORY|CHART_HISTORY) = (\d+)/m);
    assert.ok(constant, `${rel}: HISTORY 定数が見つからない`);
    const history = Number(constant[2]);
    const ChartFeed = vm.runInNewContext(`const ${constant[1]} = ${history}; ${cls[0]}; ChartFeed`, {});
    return { ChartFeed, history };
}

function makeChart(datasetCount) {
    const shifts = { count: 0 };
    class CountingArray extends Array {
        shift() { shifts.count++; return super.shift(); }
    }
    const chart = {
        data: {
            labels: new CountingArray(),
            datasets: Array.from({ length: datasetCount }, () => ({ data: new CountingArray() })),
        },
    };
    return { chart, shifts };
}

for (const rel of CHART_FEED_FILES) {
    const { ChartFeed, history } = loadChartFeed(rel);
    const { chart, shifts } = makeChart(3);
    const feed = new ChartFeed(chart);
    const BACKLOG = 50000; // 200Hz × 約 4 分（タブが隠れていた間の滞留を模す）

    const started = process.hrtime.bigint();
    for (let i = 0; i < BACKLOG; i++) feed.push([i, i * 2, i * 3]);
    assert.ok(feed.pending.length <= history * 2,
        `${rel}: pending が上限を超えて溜まる（${feed.pending.length} > ${history * 2}）`);

    assert.equal(feed.flush(), true, `${rel}: flush() が true を返さない`);
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;

    assert.equal(shifts.count, 0, `${rel}: flush() が shift() を ${shifts.count} 回呼んだ`);
    assert.equal(chart.data.labels.length, history, `${rel}: labels が表示件数と一致しない`);
    for (const ds of chart.data.datasets) assert.equal(ds.data.length, history, `${rel}: dataset 長が表示件数と一致しない`);
    // 最新の HISTORY 件が、順序を保って入っている
    const first = BACKLOG - history;
    assert.equal(chart.data.datasets[0].data[0], first, `${rel}: 最古の表示値が最新 ${history} 件の先頭ではない`);
    assert.equal(chart.data.datasets[0].data[history - 1], BACKLOG - 1, `${rel}: 最新値が末尾にない`);
    assert.equal(chart.data.datasets[2].data[history - 1], (BACKLOG - 1) * 3, `${rel}: 系列ごとの値がずれている`);
    // 通し番号は捨てた分も進む（ラベルは常に最新サンプルの番号）
    assert.equal(chart.data.labels[history - 1], BACKLOG - 1, `${rel}: ラベルの通し番号が捨てた分を飛ばしていない`);
    assert.equal(feed.pending.length, 0, `${rel}: flush 後に pending が残る`);
    assert.equal(feed.flush(), false, `${rel}: 空の flush() が false を返さない`);
    assert.ok(elapsedMs < 2000, `${rel}: ${BACKLOG} 件の滞留処理に ${elapsedMs.toFixed(0)} ms（2 秒超）`);

    // 通常運転: 少量 push → 古い分だけ落ちる
    feed.push([-1, -2, -3]);
    feed.push([-4, -5, -6]);
    assert.equal(feed.flush(), true);
    assert.equal(chart.data.labels.length, history);
    assert.equal(chart.data.datasets[0].data[history - 1], -4);
    assert.equal(chart.data.datasets[0].data[history - 2], -1);
    assert.equal(chart.data.datasets[0].data[0], first + 2, `${rel}: 通常 push で最古 2 件が落ちていない`);
    assert.equal(shifts.count, 0, `${rel}: 通常運転で shift() が呼ばれた`);
}

// ── 4a. data-modes: pushTimedPoint が時間窓で trim し、生の push が残っていない ──────────
{
    const rel = 'examples/data-modes/app.js';
    const src = read(rel);
    const fn = src.match(/function pushTimedPoint\(points, point, windowMs\) \{[\s\S]*?\n\}/);
    assert.ok(fn, `${rel}: pushTimedPoint が見つからない`);
    const bare = src.match(/\b(signalPoints|timingPoints)\.push\(/g) || [];
    assert.deepEqual(bare, [], `${rel}: ${bare.join(', ')} が pushTimedPoint を経由していない（描画停止中に無限に溜まる）`);
    const pushTimedPoint = vm.runInNewContext(`${fn[0]}; pushTimedPoint`, {});
    const points = [];
    const WINDOW = 12000;
    for (let i = 0; i < 100000; i++) pushTimedPoint(points, { t: i * 5 }, WINDOW); // 200Hz × 500 s
    assert.ok(points.length <= WINDOW / 5 + 1, `${rel}: 時間窓を超えて点が残る（${points.length}）`);
    assert.equal(points[points.length - 1].t, 99999 * 5);
    assert.ok(points[0].t >= 99999 * 5 - WINDOW, `${rel}: 窓外の古い点が残る（t=${points[0].t}）`);
}

// ── 4b. fifo-vs-realtime: pushPoint が窓外を捨てる ───────────────────────────────────
{
    const rel = 'examples/fifo-vs-realtime/app.js';
    const src = read(rel);
    const fn = src.match(/function pushPoint\(id, total, mode\) \{[\s\S]*?\n\}/);
    assert.ok(fn, `${rel}: pushPoint が見つからない`);
    const ctx = { nowMs: 0 };
    ctx.performance = { now: () => ctx.nowMs };
    const api = vm.runInNewContext(
        `const WINDOW_MS = 12000; const points = []; let lastArrivalGlobal = null; ${fn[0]}; ({ points, pushPoint })`, ctx);
    for (let i = 0; i < 100000; i++) { ctx.nowMs = i * 5; api.pushPoint(i % 2, i, 'realtime'); }
    assert.ok(api.points.length <= 12000 / 5 + 1, `${rel}: 時間窓を超えて点が残る（${api.points.length}）`);
    assert.equal(api.points[api.points.length - 1].t, 99999 * 5);
    assert.ok(api.points[0].t >= 99999 * 5 - 12000, `${rel}: 窓外の古い点が残る（t=${api.points[0].t}）`);
}

// ── 5. calibrated-pressure: pending に上限がある ───────────────────────────────────
{
    const rel = 'examples/calibrated-pressure/sketch.js';
    const src = read(rel);
    assert.match(src, /pending\[this\.id\]\.length > HISTORY \* 2\) pending\[this\.id\]\.splice\(0, pending\[this\.id\]\.length - HISTORY\)/,
        `${rel}: 受信バッファ pending に上限が無い（描画停止中に無限に溜まる）`);
}

console.log('example-render-buffer-backlog: ok');
