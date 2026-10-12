/**
 * showcase「歩容解析（Gait Analysis）」パネルの回帰テスト。
 *
 * 対象の不具合:
 *  1. Stepカードが左右2枚ずつ出る — startGait()/startFifo() が await している間に
 *     描画ループの追従処理（syncAdvancedSessionState）が割り込み、gaitActiveIds に
 *     同じデバイスIDが2回入る。Toolkit は購読直後に gaitActive を立ててから notify の
 *     疎通確認（_verifyGaitLiveness、既定1500ms×リトライ）を await するため、
 *     30fps の描画ループが必ずこの窓に入る。
 *  2. 詳細テーブルの数値が読めない — 素の .table は --bs-table-color に Bootstrap 既定の
 *     #212529 を使うため、.fifo-card の背景 #10171c の上でほぼ同色になる。
 *
 * examples/showcase/app.js はブラウザ用のトップレベルスクリプト（window 依存）で
 * require できないため、ソース不変条件＋純粋関数の抽出評価で固定する。
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'examples/showcase/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'examples/showcase/style.css'), 'utf8');

// ── 1. コントラスト: 歩容カードのテーブルは table-dark 必須 ──────────────────
{
    const gaitTable = app.match(/<table class="([^"]*)"><tbody>\$\{tbody\}/);
    assert.ok(gaitTable, '歩容カードの詳細テーブルが見つからない');
    assert.ok(
        gaitTable[1].split(/\s+/).includes('table-dark'),
        `歩容カードのテーブルに table-dark が無い（現在: "${gaitTable[1]}"）。`
        + '素の .table は文字色に #212529 を使い、.fifo-card の暗い背景に埋もれて数値が読めなくなる'
    );

    // 上記の根拠（カード背景が暗いこと）が変わったら、このテストの前提も見直す。
    assert.match(css, /\.fifo-card\s*\{[^}]*background:\s*#10171c/,
        '.fifo-card の背景色が変わっている。table-dark の要否を再確認すること');
}

// ── 2. 二重登録の防止: 対象ID一覧への追加は addActiveDeviceId 経由のみ ────────
{
    for (const list of ['gaitActiveIds', 'fifoActiveIds']) {
        const barePush = new RegExp(`${list}\\.push\\(`, 'g');
        assert.equal(
            (app.match(barePush) || []).length, 0,
            `${list} への直接 push が残っている。addActiveDeviceId() 経由にすること`
            + '（await 中に追従処理が割り込むと同じIDが2回入る）'
        );
    }

    // start*() 実行中は追従処理を止める（そちらが最終状態を確定させる）
    assert.match(app, /if \(!fifoStarting\) syncFifoSessionState\(/,
        'syncAdvancedSessionState() が fifoStarting でガードされていない');
    assert.match(app, /if \(!gaitStarting\) syncGaitSessionState\(/,
        'syncAdvancedSessionState() が gaitStarting でガードされていない');

    // フラグは必ず finally で下げる（開始失敗時に追従が止まったままにならないこと）
    for (const [fn, flag] of [['startFifo', 'fifoStarting'], ['startGait', 'gaitStarting']]) {
        const body = app.match(new RegExp(`async function ${fn}\\(\\)[\\s\\S]*?\\n    \\}\\n`));
        assert.ok(body, `${fn}() が見つからない`);
        assert.match(body[0], new RegExp(`${flag} = true`), `${fn}() が ${flag} を立てていない`);
        assert.match(body[0], new RegExp(`finally \\{\\s*${flag} = false;\\s*\\}`),
            `${fn}() が ${flag} を finally で下げていない`);
    }
}

// ── 3. addActiveDeviceId の挙動（ソースから抽出して評価） ────────────────────
const helper = app.match(/function addActiveDeviceId\(list, id\) \{[\s\S]*?\n {4}\}/);
assert.ok(helper, 'addActiveDeviceId() が見つからない（改名したらこのテストも更新する）');
const addActiveDeviceId = new Function(`${helper[0]}\nreturn addActiveDeviceId;`)();
{
    assert.deepEqual(addActiveDeviceId([], 0), [0]);
    assert.deepEqual(addActiveDeviceId([0], 0), [0], '同じIDは追加しない');
    assert.deepEqual(addActiveDeviceId([0, 1], 1), [0, 1]);
    assert.deepEqual(addActiveDeviceId([0], 1), [0, 1], '別IDは追加する');
}

// ── 4. 開始中の割り込みシナリオ（描画ループ 5ms × 開始処理 40ms） ─────────────
// 「リセット → await → 登録」の間に追従処理が走っても対象IDが重複しないこと。
// 修正前の形（ガード無し＋直接 push）では重複することも同時に固定して、
// このテストが実際にデグレを捕まえられることを示す。
async function runStart({ guard, register }) {
    const sessions = [{ gaitActive: false }, { gaitActive: false }];
    const connectedIds = [0, 1];
    let activeIds = [];
    let running = false;
    let starting = false;

    // showcase の syncGaitSessionState() と同じ形
    function sync() {
        if (guard && starting) return;
        const active = connectedIds.filter((id) => sessions[id].gaitActive);
        if (active.length === 0) return;
        if (!running) activeIds = active.slice();
        else for (const id of active) register(activeIds, id);
        running = true;
    }

    // InsoleToolkit._startGait(): gait.start() 直後に gaitActive を立て、
    // その後 _verifyGaitLiveness() を await する（＝割り込みの窓）
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    async function setOutputs(id) {
        await wait(5);
        sessions[id].gaitActive = true;
        await wait(40);
    }

    const timer = setInterval(sync, 5);
    try {
        activeIds = [];
        starting = true;
        const results = await Promise.all(connectedIds.map(async (id) => {
            await setOutputs(id);
            return sessions[id].gaitActive;
        }));
        results.forEach((ok, i) => { if (ok) register(activeIds, connectedIds[i]); });
        running = true;
    } finally {
        starting = false;
        clearInterval(timer);
    }
    return activeIds;
}

const barePush = (list, id) => { list.push(id); return list; };

(async () => {
    const fixed = await runStart({ guard: true, register: addActiveDeviceId });
    assert.deepEqual(fixed, [0, 1],
        `開始中に追従処理が割り込んでも対象IDは左右1つずつ（実際: ${JSON.stringify(fixed)}）`);

    const regressed = await runStart({ guard: false, register: barePush });
    assert.ok(regressed.length > 2,
        'ガード無し＋直接 push では重複するはず（このテストがデグレを捕まえられることの確認）');

    console.log('showcase-gait-panel: OK');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
