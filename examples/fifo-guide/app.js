/* global buildInsoleToolkit, getInsoleToolkitSession, insoleToolkitMeasurementToCSV, FifoGuideContinuity */
/**
 * FIFO Guide — 初めてFIFOを使う人向けの実機ページ。
 *
 * FIFOプロトコル（serial指定・再要求・drain）はこのファイルでは一切実装しない。
 *   - src/InsoleFifo.js        … FIFO収集ループ本体
 *   - src/InsoleToolkit.js     … 接続UI / 'fifo-recording' プロファイル /
 *                                startMeasurement()・stopMeasurement()（drain待ち込み）/
 *                                insoleToolkitMeasurementToCSV()
 * 判定ロジック（serial連続性・欠損range・timeline集約・30秒バッファ判定）は
 * ./continuity.js に純関数として切り出し、Node で単体テストしている。
 */
(function () {
    'use strict';

    const C = FifoGuideContinuity;
    const DEVICE_ID = 0;
    const MAX_LOG_ENTRIES = 400;
    const ACC_HISTORY_SIZE = 300;
    const MAX_SAMPLES = 120000;      // 600 s 相当。超えたら結果に truncated 警告を出す
    const TIMELINE_BINS = C.DEFAULT_BIN_COUNT;
    const BAR_FULL_SCALE_MS = 60000; // バッファガイドバーの右端

    const dom = {};
    const state = {
        phase: 'idle',
        session: null,
        connected: false,
        recording: false,
        plannedMs: 30000,
        startedAt: 0,
        stopTimer: null,
        tickTimer: null,
        drainStartedAt: 0,
        drainMs: null,
        drainRecovered: 0,
        maxLag: 0,
        droppedLive: 0,      // onDataLoss(info.cumulative) の最新値
        droppedTotal: null,  // onStopped(info.dropped) = この収録の回復不能ロス累計
        batchCount: 0,
        lastBatchAt: 0,
        lastBatchGapMs: null,
        lastBatchSize: 0,
        latestSample: null,
        press: null,
        accHistory: new Float32Array(ACC_HISTORY_SIZE),
        accCount: 0,
        accHead: 0,
        result: null,
        analysis: null,
        csv: '',
        renderQueued: false,
    };
    const logEntries = [];

    // ── 起動 ────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        cacheDom();
        buildPressBars();
        wireControls();
        renderCodeSnippet();
        renderEnvLine();

        buildInsoleToolkit(dom.toolkit, 'ORPHE INSOLE', DEVICE_ID, {
            // 接続時は Realtime（= realtime-full 相当）。
            // 収録開始時に 'fifo-recording' プロファイルへ切り替える。
            streamingMode: 4,
            sensorDataMode: 'realtime',
            outputs: { sensorValues: true, stepAnalysis: false },
            autoReconnect: true,
            onStateChange: handleSessionState,
            onError: handleSessionError,
            fifo: {
                startupDelayMs: 1000,
                drainTimeoutMs: 5000,
                onSamples: handleFifoSamples,
                onProgress: handleFifoProgress,
                onDataLoss: handleFifoDataLoss,
                onStopped: handleFifoStopped,
                onAnomaly: handleFifoAnomaly,
                onError: handleSessionError,
            },
        });
        state.session = getInsoleToolkitSession(DEVICE_ID);

        setPhase('idle');
        drawTimeline([]);
        drawAcc();
        log('info', 'ページを読み込みました。ORPHE INSOLE を1台接続してください。');
    });

    function cacheDom() {
        const ids = [
            'toolkit_placeholder', 'status_banner', 'status_label', 'status_text', 'step_strip',
            'duration_select', 'duration_custom', 'record_button', 'elapsed_text',
            'buffer_guide_text', 'buffer_bar_cursor', 'buffer_bar_mark',
            'result_card', 'result_verdict', 'result_summary', 'result_cautions',
            'm_duration', 'm_samples', 'm_first', 'm_last', 'm_expected', 'm_received',
            'm_missing', 'm_missing_rate', 'm_dropped', 'm_drain_recovered', 'm_drain_ms',
            'm_max_lag', 'm_csv',
            'timeline_canvas', 'timeline_caption', 'missing_ranges', 'missing_ranges_wrap',
            'csv_button', 'json_button', 'export_hint',
            'press_bars', 'press_total', 'acc_canvas', 'batch_count', 'batch_size',
            'batch_gap', 'live_lag', 'latest_sample',
            'code_snippet', 'event_log', 'env_line', 'copy_log_button', 'clear_log_button',
        ];
        for (const id of ids) dom[camel(id)] = document.getElementById(id);
        dom.toolkit = dom.toolkitPlaceholder;
    }

    function camel(id) {
        return id.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    }

    function buildPressBars() {
        for (let i = 0; i < 6; i += 1) {
            const row = document.createElement('div');
            row.className = 'press-row';
            row.innerHTML = `<span class="press-label mono">${i + 1}</span>`
                + '<span class="press-track"><span class="press-fill"></span></span>'
                + '<span class="press-value mono">-</span>';
            dom.pressBars.appendChild(row);
        }
    }

    function wireControls() {
        dom.durationSelect.addEventListener('change', () => {
            const custom = dom.durationSelect.value === 'custom';
            dom.durationCustom.disabled = !custom;
            if (custom) dom.durationCustom.focus();
            updateBufferGuide(0);
        });
        dom.durationCustom.addEventListener('input', () => updateBufferGuide(0));
        dom.recordButton.addEventListener('click', () => {
            if (state.recording) stopRecording('manual');
            else startRecording();
        });
        dom.csvButton.addEventListener('click', downloadCsv);
        dom.jsonButton.addEventListener('click', downloadJson);
        dom.copyLogButton.addEventListener('click', copyLog);
        dom.clearLogButton.addEventListener('click', () => {
            logEntries.length = 0;
            renderLog();
        });
        window.addEventListener('resize', () => {
            drawTimeline(state.analysis ? C.buildTimelineBins(state.analysis, TIMELINE_BINS) : []);
            drawAcc();
        });
        updateBufferGuide(0);
    }

    // ── 計測時間 ────────────────────────────────────────────────────────
    function selectedDurationMs() {
        if (dom.durationSelect.value === 'custom') {
            const seconds = Math.max(3, Math.min(600, Number(dom.durationCustom.value) || 30));
            return seconds * 1000;
        }
        return Number(dom.durationSelect.value) || 30000;
    }

    function updateBufferGuide(elapsedMs) {
        const planned = selectedDurationMs();
        const guide = C.bufferGuidance(planned);
        const cursorMs = state.recording ? elapsedMs : planned;
        const percent = Math.min(100, (cursorMs / BAR_FULL_SCALE_MS) * 100);
        dom.bufferBarCursor.style.left = `${percent}%`;
        dom.bufferBarCursor.classList.toggle('over', cursorMs > C.BUFFER_WINDOW_MS);
        dom.bufferBarMark.style.left = `${(C.BUFFER_WINDOW_MS / BAR_FULL_SCALE_MS) * 100}%`;

        const packets = guide.expectedPackets;
        if (guide.withinWindow) {
            dom.bufferGuideText.className = 'text-success';
            dom.bufferGuideText.textContent =
                `推奨帯: ${planned / 1000}秒 ≒ ${packets} serial（端末内バッファ約${guide.windowSeconds}秒に収まりやすい）`;
        } else {
            dom.bufferGuideText.className = 'text-warning-emphasis fw-semibold';
            dom.bufferGuideText.textContent =
                `警告帯: ${planned / 1000}秒 ≒ ${packets} serial（バッファ約${guide.windowSeconds}秒を超過。欠損しうる）`;
        }
    }

    // ── 収録 ────────────────────────────────────────────────────────────
    async function startRecording() {
        const session = state.session;
        if (!session || !state.connected) {
            log('warn', 'まず INSOLE を接続してください。');
            return;
        }
        state.plannedMs = selectedDurationMs();
        resetRunState();
        setPhase('preparing');
        log('info', `FIFO収録を準備します（予定 ${state.plannedMs / 1000} 秒）。read modeをFIFOへ切り替え、バッファを消去します。`);

        try {
            await session.startMeasurement({
                profile: 'fifo-recording',
                restoreProfile: true,
                maxSamples: MAX_SAMPLES,
                metadata: {
                    page: 'fifo-guide',
                    plannedDurationMs: state.plannedMs,
                    platform: navigator.platform,
                },
            });
        } catch (error) {
            setPhase(state.connected ? 'connected' : 'idle');
            log('error', `収録を開始できませんでした: ${describeError(error)}`);
            return;
        }

        state.recording = true;
        state.startedAt = Date.now();
        dom.recordButton.innerHTML = '<i class="bi bi-stop-circle"></i> 収録停止';
        dom.recordButton.classList.replace('btn-primary', 'btn-danger');
        setPhase('recording');
        log('success', 'FIFO収録を開始しました。データは数百msごとにまとめて届きます。');

        state.tickTimer = setInterval(onTick, 100);
        state.stopTimer = setTimeout(() => stopRecording('duration'), state.plannedMs);
    }

    function onTick() {
        const elapsed = Date.now() - state.startedAt;
        dom.elapsedText.textContent = `${(elapsed / 1000).toFixed(1)} s`;
        updateBufferGuide(elapsed);
        if (elapsed > C.BUFFER_WINDOW_MS) {
            dom.statusBanner.classList.add('status-over-buffer');
        }
    }

    async function stopRecording(reason) {
        if (!state.recording) return;
        state.recording = false;
        clearTimers();
        dom.recordButton.innerHTML = '<i class="bi bi-record-circle"></i> 収録開始';
        dom.recordButton.classList.replace('btn-danger', 'btn-primary');
        state.drainStartedAt = Date.now();
        setPhase('draining');
        log('info', reason === 'duration'
            ? '予定時間になったので停止しました。端末内に残っているデータを回収（drain）しています…'
            : '停止しました。端末内に残っているデータを回収（drain）しています…');

        let result = null;
        try {
            result = await state.session.stopMeasurement({ reason });
        } catch (error) {
            log('error', `停止処理でエラーが発生しました: ${describeError(error)}`);
            // Toolkit は失敗しても直近の計測結果を保持する
            result = state.session.lastMeasurement || null;
        }
        if (state.drainMs === null) state.drainMs = Date.now() - state.drainStartedAt;

        if (!result) {
            setPhase(state.connected ? 'connected' : 'idle');
            log('error', '収録結果を取得できませんでした。');
            return;
        }
        finalizeResult(result);
        setPhase('done');
    }

    function clearTimers() {
        if (state.stopTimer) { clearTimeout(state.stopTimer); state.stopTimer = null; }
        if (state.tickTimer) { clearInterval(state.tickTimer); state.tickTimer = null; }
    }

    function resetRunState() {
        state.drainMs = null;
        state.drainStartedAt = 0;
        state.drainRecovered = 0;
        state.maxLag = 0;
        state.droppedLive = 0;
        state.droppedTotal = null;
        state.batchCount = 0;
        state.lastBatchAt = 0;
        state.lastBatchGapMs = null;
        state.lastBatchSize = 0;
        state.latestSample = null;
        state.press = null;
        state.accCount = 0;
        state.accHead = 0;
        state.result = null;
        state.analysis = null;
        state.csv = '';
        dom.elapsedText.textContent = '0.0 s';
        dom.batchCount.textContent = '0';
        dom.batchSize.textContent = '-';
        dom.batchGap.textContent = '-';
        dom.liveLag.textContent = '-';
        dom.latestSample.textContent = '-';
        dom.csvButton.disabled = true;
        dom.jsonButton.disabled = true;
        dom.missingRangesWrap.hidden = true;
        dom.statusBanner.classList.remove('status-over-buffer');
        drawTimeline([]);
        drawAcc();
    }

    // ── FIFO コールバック ────────────────────────────────────────────────
    function handleFifoSamples(deviceId, samples) {
        if (!Array.isArray(samples) || samples.length === 0) return;
        const now = performance.now();
        state.batchCount += 1;
        state.lastBatchSize = samples.length;
        if (state.lastBatchAt > 0) state.lastBatchGapMs = now - state.lastBatchAt;
        state.lastBatchAt = now;

        const latest = samples[samples.length - 1];
        state.latestSample = latest;
        if (latest && latest.press && Array.isArray(latest.press.values)) {
            state.press = latest.press.values;
        }
        for (const sample of samples) {
            const acc = sample && sample.converted_acc;
            if (!acc) continue;
            const norm = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
            state.accHistory[state.accHead] = norm;
            state.accHead = (state.accHead + 1) % ACC_HISTORY_SIZE;
            if (state.accCount < ACC_HISTORY_SIZE) state.accCount += 1;
        }
        queueLiveRender();
    }

    function handleFifoProgress(info) {
        const lag = Number(info && info.lag) || 0;
        if (lag > state.maxLag) state.maxLag = lag;
        dom.liveLag.textContent = `${lag} / ${C.RING_BUFFER_CAPACITY}`;
        dom.liveLag.className = lag >= C.RING_BUFFER_CAPACITY * C.LAG_CAUTION_RATIO
            ? 'mono text-danger fw-bold'
            : 'mono';
        if (info && info.draining) {
            setStatus('draining', '回収中（drain）',
                `残りの再要求を回収しています… 回収済み ${info.collected} serial / 未取得 ${lag}`);
        }
    }

    function handleFifoDataLoss(info) {
        state.droppedLive = Number(info && info.cumulative) || state.droppedLive;
        log('error', `回復不能な欠損: ${info.dropped} serial（累計 ${info.cumulative}）reason=${info.reason}`);
    }

    function handleFifoStopped(info) {
        state.drainRecovered = Number(info && info.drainRecovered) || 0;
        state.droppedTotal = Number(info && info.dropped) || 0;
        if (state.drainStartedAt > 0 && state.drainMs === null) {
            state.drainMs = Date.now() - state.drainStartedAt;
        }
        log('info', `FIFO停止: collected=${info.collected} dropped=${info.dropped} drainRecovered=${state.drainRecovered}`);
    }

    function handleFifoAnomaly(info) {
        // 到着待ちの再要求は正常動作。ログには残すが警告扱いにはしない。
        log('info', `再要求: expected ${info.expected} / received ${info.received} / no-data ${info.noData}`);
    }

    /**
     * 接続状態の遷移はすべて Toolkit の onStateChange 経由で拾う。
     * insole.on* を上書きしないので、Toolkit のヘッダ表示や自動再接続と競合しない。
     */
    function handleSessionState(snapshot) {
        const wasConnected = state.connected;
        state.connected = !!snapshot.connected;
        if (snapshot.measurementPhase === 'draining' && state.drainStartedAt === 0) {
            state.drainStartedAt = Date.now();
        }
        if (state.connected && !wasConnected) {
            log('success', 'INSOLE に接続しました。計測時間を選んで「収録開始」を押してください。');
            if (state.phase === 'idle') setPhase('connected');
        }
        if (!state.connected && wasConnected) {
            if (state.recording) {
                clearTimers();
                state.recording = false;
                dom.recordButton.innerHTML = '<i class="bi bi-record-circle"></i> 収録開始';
                dom.recordButton.classList.replace('btn-danger', 'btn-primary');
                log('error', '収録中に切断されました。この収録は完了扱いになりません。');
                // 計測ウィンドウを閉じておく。閉じないと activeMeasurement が残り、
                // 再接続後に MEASUREMENT_ACTIVE で次の収録を開始できなくなる。
                Promise.resolve(state.session.stopMeasurement({ reason: 'disconnect' }))
                    .catch((error) => log('warn', `切断後の計測終了処理: ${describeError(error)}`));
            }
            log('warn', 'INSOLE が切断されました。');
            setPhase('idle');
            return;
        }
        applyButtonState();
    }

    function handleSessionError(error) {
        if (isUserCancel(error)) {
            log('info', 'デバイス選択をキャンセルしました。');
            return;
        }
        log('error', `エラー: ${describeError(error)}`);
    }

    function isUserCancel(error) {
        if (!error) return false;
        if (error.name === 'NotFoundError') return true;
        const message = error.message ? String(error.message) : String(error);
        return /cancel+ed|chooser|User cancelled/i.test(message);
    }

    function describeError(error) {
        if (!error) return 'unknown';
        const code = error.code ? ` [${error.code}]` : '';
        return `${error.message || String(error)}${code}`;
    }

    // ── 結果の確定 ───────────────────────────────────────────────────────
    function finalizeResult(result) {
        const samples = Array.isArray(result.raw && result.raw.samples) ? result.raw.samples : [];
        const analysis = C.analyzeSerials(samples.map((sample) => sample.serial_number));
        // dropped は「収録中に回復不能と判定された累計」。onStopped(info.dropped) が正。
        // result.fifo.dropped は checkpoint 区間の再集計値なので定義が異なる（画面では別々に扱う）。
        const dropped = state.droppedTotal !== null
            ? state.droppedTotal
            : Math.max(Number(result.fifo && result.fifo.dropped) || 0, 0);
        const verdict = C.evaluateRecording({
            analysis,
            missing: analysis.missing,
            dropped,
            durationMs: result.durationMs,
            maxLag: state.maxLag,
        });

        state.result = result;
        state.analysis = analysis;
        state.csv = samples.length > 0 ? insoleToolkitMeasurementToCSV(result, 'raw') : '';

        // 画面表示とSDK側の集計がずれていないかを突き合わせる（ずれたらログに残す）
        const sdkSerial = (result.raw && result.raw.serial) || null;
        if (sdkSerial && Number.isInteger(sdkSerial.missing) && sdkSerial.missing !== analysis.missing) {
            log('warn', `SDK集計 missing=${sdkSerial.missing} と再計算 missing=${analysis.missing} が一致しません（表示は再計算値）。`);
        }
        // 保存するCSVから数え直した欠損数と画面表示が一致することを確認する
        if (state.csv) {
            const fromCsv = C.analyzeSerials(C.extractSerialsFromCsv(state.csv));
            const matched = fromCsv.missing === analysis.missing && fromCsv.expected === analysis.expected;
            log(matched ? 'success' : 'error',
                `CSV照合: expected=${fromCsv.expected} received=${fromCsv.received} missing=${fromCsv.missing}`
                + `（画面表示と${matched ? '一致' : '不一致'}）`);
        }

        renderResult(result, analysis, verdict, dropped);
        log(verdict.level === 'fail' ? 'error' : verdict.level === 'caution' ? 'warn' : 'success',
            `RESULT ${verdict.label} duration=${(result.durationMs / 1000).toFixed(1)}s samples=${samples.length} `
            + `serial=${analysis.received}/${analysis.expected} missing=${analysis.missing} `
            + `dropped=${dropped} drainRecovered=${state.drainRecovered} drainMs=${state.drainMs} maxLag=${state.maxLag}`);
    }

    function renderResult(result, analysis, verdict, dropped) {
        const card = dom.resultCard;
        card.classList.remove('result-empty', 'result-pass', 'result-caution', 'result-fail');
        card.classList.add(`result-${verdict.level === 'caution' ? 'caution' : verdict.level}`);
        dom.resultVerdict.textContent = verdict.level === 'fail'
            ? 'FAIL / 欠損あり'
            : verdict.level === 'caution'
                ? 'WARN / 欠損なし（注意あり）'
                : 'PASS / 欠損なし';
        dom.resultVerdict.className = `verdict-badge verdict-${verdict.level}`;

        dom.resultSummary.textContent = verdict.level === 'fail'
            ? '欠損が発生しました。下の timeline と欠損range、CSVの中身を確認してください。'
            : verdict.level === 'caution'
                ? '欠損は検出されませんでしたが、注意事項があります（下記）。'
                : 'この収録区間では欠損は検出されませんでした（missing と dropped がどちらも 0）。';

        const samples = Array.isArray(result.raw.samples) ? result.raw.samples.length : 0;
        setText('mDuration', `${(result.durationMs / 1000).toFixed(1)} s`);
        setText('mSamples', String(samples));
        setText('mFirst', analysis.first === null ? '-' : String(analysis.first));
        setText('mLast', analysis.last === null ? '-' : String(analysis.last));
        setText('mExpected', String(analysis.expected));
        setText('mReceived', String(analysis.received));
        setText('mMissing', String(analysis.missing));
        setText('mMissingRate', `${(analysis.missingRate * 100).toFixed(3)} %`);
        setText('mDropped', String(dropped));
        setText('mDrainRecovered', String(state.drainRecovered));
        setText('mDrainMs', state.drainMs === null ? '-' : `${state.drainMs} ms`);
        setText('mMaxLag', `${state.maxLag} / ${C.RING_BUFFER_CAPACITY}`);
        setText('mCsv', samples > 0 ? '可' : '不可（sampleなし）');

        markMetric('mMissing', analysis.missing === 0 ? 'ok' : 'bad');
        markMetric('mDropped', dropped === 0 ? 'ok' : 'bad');
        markMetric('mMissingRate', analysis.missing === 0 ? 'ok' : 'bad');
        markMetric('mMaxLag', verdict.buffer.lagRatio >= C.LAG_CAUTION_RATIO ? 'warn' : 'ok');
        markMetric('mDuration', verdict.buffer.withinWindow ? 'ok' : 'warn');
        markMetric('mCsv', samples > 0 ? 'ok' : 'bad');

        // 注意事項
        const cautions = [...verdict.cautions];
        if (result.raw.truncated) {
            cautions.push(`sample数の上限 ${MAX_SAMPLES} に達したため、後半のsampleが記録されていません（CSVも同様）。`);
        }
        if (dropped !== analysis.missing) {
            cautions.push(`dropped（${dropped}）と最終CSV区間の missing（${analysis.missing}）は数え方が違うため一致しないことがあります。`
                + '合否は両方が 0 かどうかで判断してください。');
        }
        dom.resultCautions.innerHTML = cautions.length === 0 ? '' :
            `<div class="alert alert-warning small mb-0"><strong>注意:</strong><ul class="mb-0 mt-1">${cautions.map((text) => `<li>${escapeHtml(text)}</li>`).join('')
            }</ul></div>`;

        // timeline
        const bins = C.buildTimelineBins(analysis, TIMELINE_BINS);
        drawTimeline(bins);
        const perBin = analysis.expected > 0 ? Math.max(1, Math.round(analysis.expected / Math.max(1, bins.length))) : 0;
        dom.timelineCaption.textContent = analysis.expected === 0
            ? 'serialが取得できませんでした。'
            : `serial ${analysis.first} → ${analysis.last} を ${bins.length} 個のbinに集約（1bin ≒ ${perBin} serial）。`
            + `緑=received / 赤=missing。欠損の正確な番号は下の欠損rangeを参照してください。`;

        if (analysis.missingRanges.length > 0) {
            dom.missingRangesWrap.hidden = false;
            dom.missingRanges.textContent = C.formatMissingRanges(analysis.missingRanges, 30);
        } else {
            dom.missingRangesWrap.hidden = true;
            dom.missingRanges.textContent = '';
        }

        dom.csvButton.disabled = samples === 0;
        dom.jsonButton.disabled = false;
        dom.exportHint.textContent = samples === 0
            ? 'sampleが無いためCSVを保存できません。'
            : 'CSVは正式計測区間（開始〜drain完了）のsampleだけを含みます。1 serial = 4行です。';
    }

    function setText(key, value) {
        if (dom[key]) dom[key].textContent = value;
    }

    function markMetric(key, level) {
        const el = dom[key];
        if (!el) return;
        const metric = el.closest('.metric');
        if (!metric) return;
        metric.classList.remove('metric-ok', 'metric-warn', 'metric-bad');
        metric.classList.add(`metric-${level === 'bad' ? 'bad' : level === 'warn' ? 'warn' : 'ok'}`);
    }

    // ── 描画 ────────────────────────────────────────────────────────────
    function queueLiveRender() {
        if (state.renderQueued) return;
        state.renderQueued = true;
        requestAnimationFrame(() => {
            state.renderQueued = false;
            renderLive();
        });
    }

    function renderLive() {
        if (state.press) {
            const rows = dom.pressBars.querySelectorAll('.press-row');
            let total = 0;
            for (let i = 0; i < rows.length; i += 1) {
                const value = Number(state.press[i]) || 0;
                total += value;
                const percent = Math.min(100, (value / 20000) * 100);
                rows[i].querySelector('.press-fill').style.width = `${percent}%`;
                rows[i].querySelector('.press-value').textContent = String(value);
            }
            dom.pressTotal.textContent = String(total);
        }
        dom.batchCount.textContent = String(state.batchCount);
        dom.batchSize.textContent = String(state.lastBatchSize);
        dom.batchGap.textContent = state.lastBatchGapMs === null
            ? '-' : `${Math.round(state.lastBatchGapMs)} ms`;
        const sample = state.latestSample;
        dom.latestSample.textContent = sample
            ? [
                `serial_number : ${sample.serial_number}  (packet_number ${sample.packet_number})`,
                `t             : ${sample.t} ms`,
                `gyro   [dps]  : ${fmtVec(sample.converted_gyro)}`,
                `acc    [G]    : ${fmtVec(sample.converted_acc)}`,
                `press  [ADC]  : ${sample.press && sample.press.values ? sample.press.values.join(', ') : '-'}`,
                'quat          : FIFOには含まれません',
            ].join('\n')
            : '-';
        drawAcc();
    }

    function fmtVec(v) {
        if (!v) return '-';
        return `x=${v.x.toFixed(2)} y=${v.y.toFixed(2)} z=${v.z.toFixed(2)}`;
    }

    function prepareCanvas(canvas) {
        const ratio = window.devicePixelRatio || 1;
        const width = Math.max(1, canvas.clientWidth);
        const height = Math.max(1, canvas.clientHeight || Number(canvas.getAttribute('height')) || 60);
        const pixelWidth = Math.floor(width * ratio);
        const pixelHeight = Math.floor(height * ratio);
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
        }
        const ctx = canvas.getContext('2d');
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        return { ctx, width, height };
    }

    /** timeline は bin 単位で Canvas に描く（serialごとのDOM要素は作らない） */
    function drawTimeline(bins) {
        const canvas = dom.timelineCanvas;
        if (!canvas) return;
        const { ctx, width, height } = prepareCanvas(canvas);
        if (!bins || bins.length === 0) {
            ctx.fillStyle = '#e9ecef';
            ctx.fillRect(0, 0, width, height);
            return;
        }
        const binWidth = width / bins.length;
        for (let i = 0; i < bins.length; i += 1) {
            const bin = bins[i];
            const x = i * binWidth;
            const w = Math.max(1, binWidth + 0.5);
            if (bin.missing > 0) {
                // 欠損が1つでもあるbinは赤で塗り、割合を濃さで示す（見落とし防止）
                const ratio = bin.total > 0 ? bin.missing / bin.total : 1;
                ctx.fillStyle = '#198754';
                ctx.fillRect(x, 0, w, height);
                ctx.fillStyle = '#dc3545';
                ctx.fillRect(x, 0, w, Math.max(height * 0.45, height * ratio));
            } else {
                ctx.fillStyle = '#198754';
                ctx.fillRect(x, 0, w, height);
            }
        }
    }

    function drawAcc() {
        const canvas = dom.accCanvas;
        if (!canvas) return;
        const { ctx, width, height } = prepareCanvas(canvas);
        ctx.strokeStyle = '#dee2e6';
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        if (state.accCount === 0) return;
        const maxScale = 4; // G
        ctx.strokeStyle = '#0d6efd';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < state.accCount; i += 1) {
            const index = (state.accHead - state.accCount + i + ACC_HISTORY_SIZE * 2) % ACC_HISTORY_SIZE;
            const value = state.accHistory[index];
            const x = (i / Math.max(1, state.accCount - 1)) * width;
            const y = height - Math.min(1, value / maxScale) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // ── 状態表示 ─────────────────────────────────────────────────────────
    const PHASE_TEXT = {
        idle: ['待機中', 'まず ORPHE INSOLE を1台接続してください。'],
        connected: ['接続済み', '計測時間を選んで「収録開始」を押してください。'],
        preparing: ['準備中', 'FIFOモードへ切り替え、端末内バッファを消去しています（数秒）。お待ちください。'],
        recording: ['収録中', '収録しています。タブを閉じたり、PCをスリープさせないでください。'],
        draining: ['回収中（drain）', '停止しました。端末内に残ったデータを回収しています。完了までお待ちください。'],
        done: ['完了', '収録が完了しました。結果を確認して CSV を保存できます。'],
    };

    function setPhase(phase) {
        state.phase = phase;
        const [label, text] = PHASE_TEXT[phase] || PHASE_TEXT.idle;
        setStatus(phase, label, text);
        const order = ['connect', 'duration', 'record', 'drain', 'save'];
        const activeIndex = {
            idle: 0, connected: 1, preparing: 2, recording: 2, draining: 3, done: 4,
        }[phase] ?? 0;
        void order;
        const items = dom.stepStrip.querySelectorAll('li');
        items.forEach((item, index) => {
            item.classList.toggle('step-active', index === activeIndex);
            item.classList.toggle('step-done', index < activeIndex);
        });
        applyButtonState();
    }

    /** 収録開始/停止ボタンの有効・無効は phase から一元的に決める */
    function applyButtonState() {
        const phase = state.phase;
        if (phase === 'recording') {
            dom.recordButton.disabled = false;
            return;
        }
        dom.recordButton.disabled = phase === 'preparing' || phase === 'draining' || !state.connected;
    }

    function setStatus(phase, label, text) {
        dom.statusBanner.className = `status-banner status-${phase}`;
        dom.statusLabel.textContent = label;
        dom.statusText.textContent = text;
    }

    // ── ログ / エクスポート ──────────────────────────────────────────────
    function log(level, message) {
        const entry = {
            t: new Date().toISOString(),
            level,
            message,
        };
        logEntries.push(entry);
        if (logEntries.length > MAX_LOG_ENTRIES) logEntries.splice(0, logEntries.length - MAX_LOG_ENTRIES);
        renderLog();
    }

    function renderLog() {
        const lines = logEntries.map((entry) =>
            `<div class="log-line log-${entry.level}">${escapeHtml(entry.t.slice(11, 23))} ${escapeHtml(entry.message)}</div>`);
        dom.eventLog.innerHTML = lines.join('');
        dom.eventLog.scrollTop = dom.eventLog.scrollHeight;
    }

    function environmentLines() {
        return [
            `platform=${navigator.platform}`,
            `userAgent=${navigator.userAgent}`,
            `webBluetooth=${typeof navigator.bluetooth !== 'undefined' ? 'available' : 'unavailable'}`,
            `plannedDurationMs=${state.plannedMs}`,
            `deviceCount=1`,
            `profile=fifo-recording`,
        ];
    }

    function renderEnvLine() {
        dom.envLine.textContent = environmentLines().join(' / ');
    }

    async function copyLog() {
        const text = [
            '# ORPHE INSOLE fifo-guide log',
            ...environmentLines().map((line) => `# ${line}`),
            ...logEntries.map((entry) => `${entry.t} [${entry.level}] ${entry.message}`),
        ].join('\n');
        const original = dom.copyLogButton.innerHTML;
        dom.copyLogButton.disabled = true;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                fallbackCopy(text);
            }
            dom.copyLogButton.textContent = `コピーしました（${logEntries.length}行）`;
        } catch (error) {
            dom.copyLogButton.textContent = 'コピーできませんでした';
            void error;
        } finally {
            setTimeout(() => {
                dom.copyLogButton.innerHTML = original;
                dom.copyLogButton.disabled = false;
            }, 1600);
        }
    }

    function fallbackCopy(text) {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
    }

    function downloadCsv() {
        if (!state.csv) return;
        saveBlob(state.csv, 'text/csv', `orphe-insole-fifo-guide-${timestampSuffix()}.csv`);
        log('success', 'FIFO CSV を保存しました（正式計測区間のみ / 1 serial = 4行）。');
    }

    function downloadJson() {
        const analysis = state.analysis;
        const result = state.result;
        const payload = {
            page: 'fifo-guide',
            savedAt: new Date().toISOString(),
            environment: environmentLines(),
            plannedDurationMs: state.plannedMs,
            durationMs: result ? result.durationMs : null,
            profileId: result ? result.profileId : null,
            samples: result && Array.isArray(result.raw.samples) ? result.raw.samples.length : 0,
            truncated: result ? !!result.raw.truncated : false,
            serial: analysis ? {
                first: analysis.first,
                last: analysis.last,
                expected: analysis.expected,
                received: analysis.received,
                missing: analysis.missing,
                missingRate: analysis.missingRate,
                duplicates: analysis.duplicates,
                outOfOrder: analysis.outOfOrder,
                missingRanges: analysis.missingRanges.map((range) => range.label),
            } : null,
            sdkSerial: result && result.raw ? result.raw.serial : null,
            fifo: {
                droppedFinal: result && result.fifo ? result.fifo.dropped : null,
                droppedLiveCumulative: state.droppedLive,
                drainRecovered: state.drainRecovered,
                drainMs: state.drainMs,
                maxLag: state.maxLag,
                ringBufferCapacity: C.RING_BUFFER_CAPACITY,
                bufferWindowMs: C.BUFFER_WINDOW_MS,
            },
            log: logEntries,
        };
        saveBlob(JSON.stringify(payload, null, 2), 'application/json',
            `orphe-insole-fifo-guide-${timestampSuffix()}.json`);
        log('success', '結果JSON を保存しました。');
    }

    function timestampSuffix() {
        return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    }

    function saveBlob(content, type, filename) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
            if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
        }, 1000);
    }

    function renderCodeSnippet() {
        dom.codeSnippet.textContent = [
            "// 1. 接続UIを作る（Realtimeで接続しておく）",
            "buildInsoleToolkit(document.querySelector('#toolkit_placeholder'), 'ORPHE INSOLE', 0, {",
            "  streamingMode: 4, sensorDataMode: 'realtime',",
            '  fifo: { startupDelayMs: 1000, drainTimeoutMs: 5000,',
            '          onSamples, onProgress, onDataLoss, onStopped },',
            '});',
            "const session = getInsoleToolkitSession(0);",
            '',
            '// 2. FIFO収録を開始（read modeの切替・バッファ消去はSDKが行う）',
            "await session.startMeasurement({ profile: 'fifo-recording', restoreProfile: true });",
            '',
            '// 3. 停止。drain（未回収データの回収）が終わってから resolve する',
            'const result = await session.stopMeasurement();',
            'console.log(result.raw.serial);   // { first, last, expected, received, missing, missingRate }',
            'console.log(result.fifo.dropped); // 回復不能ロス（missing とは別指標）',
            '',
            '// 4. 正式計測区間だけのCSV',
            "const csv = insoleToolkitMeasurementToCSV(result, 'raw');",
        ].join('\n');
    }

    function escapeHtml(text) {
        return String(text).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        })[c]);
    }
})();
