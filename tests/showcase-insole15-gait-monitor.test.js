/**
 * INSOLE 1.5 クライアント（examples/showcase/lib）の歩容ポーリング
 * startGaitMonitor() / stopGaitMonitor() のライフサイクル回帰テスト。
 *
 * 事前ビルド済みバンドル insole-1.5.web.js（グローバル Insole15）を vm で読み込み、
 * get_gait_live を模擬 FW に差し替えて検証する（BLE は使わない）。
 *
 * 模擬 FW の挙動（lib/insole.proto の GetGaitLive の説明どおり）:
 *  - 最初のポーリングで暗黙のライブセッションを開始し、ポーリングが続く間は解析を続ける
 *  - 最後のポーリングから一定時間（本物は約 3 秒）でセッションを終了し、stride_seq は 0 に戻る
 *  - stride_seq はセッション内で完了ストライドごとに 1 ずつ増え、last は最新の完了ストライド
 *
 * 固定する不変条件:
 *  1. 停止直後（FW のセッションが残っている間）に再開しても、前回の最後の 1 歩が新しい記録に混ざらない
 *  2. 停止 → 再開を短時間で行っても、古いポーリングループが生き残って二重に動かない
 *     （同じ stride_seq が二重に届かない／同時に走るポーリングは常に 1 本）
 *  3. 最初の get_gait_live の応答待ち中に停止したら、ポーリングは始まらない
 *  4. 開始処理が完了する前に start を重ねて呼んでも、ポーリングループは 1 本
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const bundlePath = path.join(root, 'examples/showcase/lib/insole-1.5.web.js');

function loadInsole15() {
    const code = fs.readFileSync(bundlePath, 'utf8');
    const sandbox = {
        console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
        TextEncoder, TextDecoder, URL, crypto: globalThis.crypto,
    };
    sandbox.globalThis = sandbox;
    sandbox.self = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(`${code}\n;globalThis.__Insole15 = Insole15;`, sandbox, { filename: 'insole-1.5.web.js' });
    return sandbox.__Insole15;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// テスト用に縮めた時間（本物の FW: ライブセッションは最終ポーリングの約 3 秒後に終了）
const STRIDE_MS = 30;          // 1 歩が完了する間隔
const SESSION_IDLE_MS = 400;   // 最終ポーリングからセッション終了まで
const RPC_LATENCY_MS = 8;      // get_gait_live 1 回の往復
const POLL_MS = 10;

/** get_gait_live を返す模擬 FW。呼び出しの重なり（同時に走るポーリング数）も記録する。 */
function createFakeFirmware({ latencyMs = RPC_LATENCY_MS } = {}) {
    const fw = {
        sessionStart: null, lastPollAt: null, calls: 0, inflight: 0, maxInflight: 0, latencyMs,
        seqLog: [], // 各 get_gait_live が返した stride_seq（呼び出し順）
        seqAt(now) {
            return Math.floor((now - fw.sessionStart) / STRIDE_MS);
        },
        async getGaitLive() {
            fw.calls++;
            fw.inflight++;
            fw.maxInflight = Math.max(fw.maxInflight, fw.inflight);
            try {
                await sleep(fw.latencyMs);
                const now = Date.now();
                if (fw.sessionStart === null || now - fw.lastPollAt > SESSION_IDLE_MS) {
                    fw.sessionStart = now; // 新しいライブセッション（stride_seq は 0 から）
                }
                fw.lastPollAt = now;
                const seq = fw.seqAt(now);
                fw.seqLog.push(seq);
                return {
                    measuring: true,
                    sessionId: 0,
                    steps: seq,
                    distanceM: seq * 0.7,
                    strideSeq: seq,
                    last: seq > 0 ? { strideLength: 0.7, cadence: 1, contactTime: 0.6, gaitType: 1, footStrike: 1 } : null,
                };
            } finally {
                fw.inflight--;
            }
        },
    };
    return fw;
}

function createClient(Insole15, fw) {
    const client = new Insole15.InsoleClient();
    client.getGaitLive = () => fw.getGaitLive(); // BLE の代わりに模擬 FW へ
    return client;
}

function seqs(strides) {
    return strides.map((s) => s.strideSeq);
}

async function main() {
    const Insole15 = loadInsole15();
    assert.equal(typeof Insole15.InsoleClient, 'function', 'バンドルに InsoleClient が無い');

    const failures = [];
    async function runCase(name, fn) {
        try {
            await fn();
            console.log(`  ok  ${name}`);
        } catch (err) {
            failures.push(name);
            console.log(`  NG  ${name}\n      ${err.message.split('\n')[0]}`);
        }
    }

    await runCase('1. 停止直後の再開で前回の最後の 1 歩が混ざらない', async () => {
        const fw = createFakeFirmware();
        const client = createClient(Insole15, fw);
        const run1 = [];
        await client.startGaitMonitor((s) => run1.push(s), { pollMs: POLL_MS });
        await sleep(STRIDE_MS * 4);
        client.stopGaitMonitor();
        await sleep(POLL_MS * 3); // 古いループが確実に止まるまで待つ（セッションは FW 側に残る）
        assert.ok(run1.length > 0, '前提: 1 回目の計測でストライドが届いていない');

        const run2 = [];
        const firstPollIndex = fw.seqLog.length;
        await client.startGaitMonitor((s) => run2.push(s), { pollMs: POLL_MS });
        // 再開時の最初の応答の last は、再開前（または再開処理中）に完了していたストライド
        const lastSeqOfRun1 = fw.seqLog[firstPollIndex];
        assert.ok(lastSeqOfRun1 > 0, '前提: 再開時に FW のライブセッションが残っていない');
        await sleep(STRIDE_MS * 3);
        client.stopGaitMonitor();
        await sleep(POLL_MS * 3);

        assert.ok(run2.length > 0, '前提: 2 回目の計測でストライドが届いていない');
        const stale = run2.filter((s) => s.strideSeq <= lastSeqOfRun1);
        assert.deepEqual(seqs(stale), [],
            `再開後の記録に、再開前に完了していたストライドが混ざっている（stride_seq <= ${lastSeqOfRun1}）`);
        client.disconnect();
    });

    // 古いループは sleep(pollMs) か get_gait_live の応答待ちの途中にいる。その間に再開されて
    // フラグが true に戻ると、古いループもそのまま回り続けて 2 本になる。
    await runCase('2. 停止 → すぐ再開で古いポーリングループが生き残らない', async () => {
        const fw = createFakeFirmware();
        const client = createClient(Insole15, fw);
        const run1 = [];
        await client.startGaitMonitor((s) => run1.push(s), { pollMs: 40 });
        await sleep(STRIDE_MS * 2 + 5);
        client.stopGaitMonitor();
        const run2 = [];
        await client.startGaitMonitor((s) => run2.push(s), { pollMs: 40 }); // 古いループは sleep(40) の途中
        const run1Count = run1.length;
        await sleep(STRIDE_MS * 8);
        const run1Leak = run1.length - run1Count; // 停止した 1 回目のコールバックが再開後に呼ばれた回数
        client.stopGaitMonitor();
        await sleep(60);

        assert.equal(run1Leak, 0, `停止した 1 回目のコールバックが再開後も ${run1Leak} 回呼ばれた（古いループが生きている）`);
        const dup = seqs(run2).filter((v, i, a) => a.indexOf(v) !== i);
        assert.deepEqual(dup, [], `再開後に同じ stride_seq が二重に届いた（ポーリングループが 2 本動いている）: ${dup}`);
        client.disconnect();
    });

    await runCase('3. 最初の応答待ち中に停止したらポーリングは始まらない', async () => {
        const fw = createFakeFirmware({ latencyMs: 40 });
        const client = createClient(Insole15, fw);
        const got = [];
        const starting = client.startGaitMonitor((s) => got.push(s), { pollMs: POLL_MS });
        await sleep(5);
        client.stopGaitMonitor(); // 最初の get_gait_live はまだ返っていない
        await starting.catch(() => {});
        const callsAfterStop = fw.calls;
        await sleep(POLL_MS * 6);
        assert.equal(client.isGaitMonitoring, false, '最初の応答待ち中に停止したのに isGaitMonitoring が true');
        assert.equal(fw.calls, callsAfterStop, '最初の応答待ち中に停止したのにポーリングが始まった');
        client.disconnect();
    });

    await runCase('4. 開始完了前に start を重ねて呼んでもループは 1 本', async () => {
        const fw = createFakeFirmware({ latencyMs: 20 });
        const client = createClient(Insole15, fw);
        const a = [];
        const b = [];
        await Promise.all([
            client.startGaitMonitor((s) => a.push(s), { pollMs: POLL_MS }),
            client.startGaitMonitor((s) => b.push(s), { pollMs: POLL_MS }),
        ]);
        await sleep(STRIDE_MS * 5);
        client.stopGaitMonitor();
        await sleep(40);
        assert.equal(fw.maxInflight, 1, `start の二重呼び出しで get_gait_live が同時に ${fw.maxInflight} 本走った`);
        assert.ok(a.length === 0 || b.length === 0, 'start の二重呼び出しで 2 つのループが両方ストライドを配信した');
        client.disconnect();
    });

    if (failures.length) {
        throw new Error(`showcase-insole15-gait-monitor: ${failures.length} 件失敗`);
    }
    console.log('showcase-insole15-gait-monitor: OK');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
