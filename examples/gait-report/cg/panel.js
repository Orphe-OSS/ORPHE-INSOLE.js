(function (root) {
  'use strict';
  const Model = root.GaitCGModel, feed = new root.GaitCGFeed.Feed();
  let manual = { ...Model.DEFAULT }, automatic = true, playing = true, phase = 0;
  let current = { ...manual }, target = { ...manual }, renderer = null, visible = true;
  let lastFrame = 0, lastUI = 0, frame = 0, disposed = false, loading = false, failed = false;
  let panel, controls, status, numbers, note, canvas, auto, play, joints, view, observer;
  const abort = new AbortController(), signal = abort.signal;
  const copy = {
    ja: { title: 'CGによる歩行の参考再現', auto: '受信データを自動反映', play: '再生', pause: '一時停止', joints: '関節を表示',
      perspective: '斜め', side: '側面', front: '正面', manual: '手動設定', live: 'ORPHE INSOLEに追従', demo: '合成デモに追従',
      stale: '受信待ち · 動作停止', unsupported: '再現範囲外 · 動作停止', loading: '3Dを読み込み中…',
      error: '3Dを読み込めません。通信・WebGLを確認し、ページを再読み込みしてください。レポートの計測は継続できます。',
      detail: '直近の有効データを左右最大6周期・8秒以内で平均。速度・ストライド長÷2・立脚期割合を反映します。CGは20歩の集計確定後も更新します。',
      limits: '全身動作は参照波形による合成です。本人の姿勢・関節角・接地時刻の再現ではありません。左右の歩幅は対称、接地は半周期差と仮定します。',
      missing: '立脚期割合なし：手動値を使用。', single: '片側の立脚期割合を反対側にも仮適用。',
      rejected: '欠損値／範囲外の入力を除外。', mismatch: '計測ケーデンスと差があります。CGは速度と歩幅を優先。',
      measured: '計測', cadence: 'CGケーデンス', samples: '有効周期 L / R', help: 'ドラッグで回転・スクロールで拡大。自動反映をOFFにすると手動で比較できます。',
      height: '身長', weight: '体重', speed: '歩行速度', step: '歩幅（1歩）', stance: '平均立脚期割合', stanceBias: '立脚期の左右差（左−右の半分）',
      trunkLean: '体幹の前傾（追加角度）', width: '歩隔', clearance: '足部の持ち上げ高さ', arm: '腕振り', pelvisMotion: '骨盤運動の倍率', trunkMotion: '体幹運動の倍率',
      body: '体形・補完する動作', gait: '歩行条件', reference: '参照データ・適用範囲', range: '身長・歩幅・左右の立脚期割合の組み合わせを確認してください。' },
    en: { title: 'Reference gait animation', auto: 'Follow incoming gait data', play: 'Play', pause: 'Pause', joints: 'Show joints',
      perspective: 'Perspective', side: 'Side', front: 'Front', manual: 'Manual settings', live: 'Following ORPHE INSOLE', demo: 'Following synthetic demo',
      stale: 'Waiting for data · paused', unsupported: 'Outside model range · paused', loading: 'Loading 3D…',
      error: '3D unavailable. Check your connection and WebGL, then reload. Report recording remains available.',
      detail: 'Mean of up to 6 valid cycles per side received within 8 seconds. Applies speed, stride length / 2 and stance percentage. Updates continue after the 20-cycle report is complete.',
      limits: 'Synthesized from reference motion, not measured whole-body posture, joint angles or contact timing. Assumes symmetric step length and a half-cycle offset between feet.',
      missing: 'No stance data: using manual values.', single: 'One-sided stance is provisionally mirrored.', rejected: 'Missing/out-of-range input excluded.',
      mismatch: 'Measured cadence differs. CG prioritizes speed and step length.', measured: 'Measured', cadence: 'CG cadence', samples: 'Valid cycles L / R',
      help: 'Drag to rotate; scroll to zoom. Turn off following to compare manual settings.', height: 'Height', weight: 'Weight', speed: 'Speed', step: 'Step length',
      stance: 'Mean stance', stanceBias: 'Half left-minus-right stance difference', trunkLean: 'Additional trunk lean', width: 'Step width', clearance: 'Foot lift',
      arm: 'Arm swing', pelvisMotion: 'Pelvis motion multiplier', trunkMotion: 'Trunk motion multiplier', body: 'Body / synthesized motion', gait: 'Gait settings',
      reference: 'Reference / limitations', range: 'Check the combination of height, step length and left/right stance.' }
  };
  const t = key => copy[document.documentElement.lang === 'en' ? 'en' : 'ja'][key];
  const fields = [
    ['speed', 'm/s', .01], ['step', 'm', .01], ['stance', '%', 1], ['stanceBias', 'pt', .5],
    ['height', 'cm', 1], ['weight', 'kg', 1], ['trunkLean', '°', 1], ['width', 'm', .01],
    ['clearance', 'm', .01], ['arm', '°', 1], ['pelvisMotion', '×', .05], ['trunkMotion', '×', .05]
  ];
  const measuredKeys = ['speed', 'step', 'stance', 'stanceBias'];
  function refresh() {
    if (!panel) return;
    const snapshot = feed.snapshot(manual, performance.now());
    const follow = automatic && snapshot.state !== 'manual';
    target = follow ? (snapshot.state === 'tracking' ? snapshot.parameters : current) : manual;
    status.textContent = follow ? t(snapshot.state === 'tracking' ? snapshot.source : snapshot.state) : t('manual');
    const cadence = Model.metrics(target).cadence;
    numbers.textContent = `${t('cadence')}: ${cadence.toFixed(1)} steps/min · ${t('samples')}: ${snapshot.counts.left} / ${snapshot.counts.right}`;
    if (follow && snapshot.observed?.cadence !== null && snapshot.observed?.cadence !== undefined) numbers.textContent += ` · ${t('measured')}: ${snapshot.observed.cadence.toFixed(1)} steps/min`;
    note.textContent = follow ? [snapshot.rejected && t('rejected'), snapshot.missingStance ? t('missing') : snapshot.singleSide && t('single'), snapshot.cadenceMismatch && t('mismatch')].filter(Boolean).join(' ') : '';
    for (const [key] of fields) {
      const input = controls.querySelector(`[data-field="${key}"]`);
      input.disabled = automatic && snapshot.state !== 'manual' && measuredKeys.includes(key);
      if (document.activeElement !== input) input.value = Number(target[key].toFixed(3));
    }
    panel.dataset.running = String(playing && (!follow || snapshot.state === 'tracking'));
    panel.querySelectorAll('[data-cg-text]').forEach(el => { const text = t(el.dataset.cgText); if (el.textContent !== text) el.textContent = text; });
    play.textContent = t(playing ? 'pause' : 'play');
  }
  function onStep(event) { feed.push(event.detail, manual, performance.now()); refresh(); }
  root.addEventListener('gait-report:cg-step', onStep, { signal });
  root.addEventListener('gait-report:cg-reset', () => { feed.reset(); phase = 0; current = { ...manual }; refresh(); }, { signal });
  root.addEventListener('gait-report:cg-disconnect', event => { feed.disconnect(event.detail.side); refresh(); }, { signal });
  root.addEventListener('gait-report:languagechange', refresh, { signal });
  async function loadRenderer() {
    if (renderer || loading || disposed || failed) return;
    loading = true; canvas.textContent = t('loading');
    try {
      // Exact release pinned; loaded only when the panel enters the viewport.
      const Three = await import('https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js');
      if (disposed) return;
      canvas.textContent = '';
      renderer = root.createGaitCGRenderer(Three, canvas);
      renderer.draw({ parameters: current, phase, view: view.value, skeleton: joints.checked });
    } catch { failed = true; canvas.textContent = t('error'); }
    finally { loading = false; }
  }
  function tick(now) {
    if (disposed) return;
    const dt = Math.min(.05, (now - (lastFrame || now)) / 1000); lastFrame = now;
    if (now - lastUI > 250) { refresh(); lastUI = now; }
    if (renderer && visible && !document.hidden) {
      // Ease parameter changes over ~350 ms; phase is never reset by a gait row.
      const next = { ...target }, alpha = 1 - Math.exp(-dt / .35);
      for (const key of Object.keys(Model.LIMITS)) next[key] = current[key] + (target[key] - current[key]) * alpha;
      try { current = Model.validate(next); } catch { current = { ...target }; }
      if (panel.dataset.running === 'true') phase = Model.wrap(phase + dt / Model.metrics(current).cycle);
      renderer.draw({ parameters: current, phase, view: view.value, skeleton: joints.checked });
    }
    frame = requestAnimationFrame(tick);
  }
  function init() {
    panel = document.getElementById('gait-cg-panel'); if (!panel) return;
    panel.innerHTML = `<div class="section-heading"><div><p class="eyebrow">REFERENCE GAIT · CG</p><h2 data-cg-text="title"></h2></div></div>
      <div class="cg-toolbar"><label><input id="cg-auto" type="checkbox" checked> <span data-cg-text="auto"></span></label>
      <button id="cg-play" type="button" class="button secondary"></button><label><input id="cg-joints" type="checkbox"> <span data-cg-text="joints"></span></label>
      <select id="cg-view" aria-label="Camera / 視点"><option value="perspective" data-cg-text="perspective"></option><option value="side" data-cg-text="side"></option><option value="front" data-cg-text="front"></option></select></div>
      <p id="cg-status" class="cg-status" role="status"></p><div class="cg-layout"><div><div id="cg-canvas" class="cg-canvas" role="img" aria-label="3D gait / 3D歩行モデル"></div><p class="cg-help" data-cg-text="help"></p></div>
      <div id="cg-controls" class="cg-controls"></div></div><p id="cg-numbers"></p><p id="cg-note" class="cg-note"></p><p id="cg-input-error" role="alert"></p>
      <details><summary data-cg-text="reference"></summary><p data-cg-text="detail"></p><p data-cg-text="limits"></p><a href="./cg/NOTICE.txt" target="_blank" rel="noopener">OpenSim · source / license</a></details>`;
    canvas = panel.querySelector('#cg-canvas'); controls = panel.querySelector('#cg-controls'); status = panel.querySelector('#cg-status');
    numbers = panel.querySelector('#cg-numbers'); note = panel.querySelector('#cg-note'); auto = panel.querySelector('#cg-auto');
    play = panel.querySelector('#cg-play'); joints = panel.querySelector('#cg-joints'); view = panel.querySelector('#cg-view');
    for (const [key, unit, step] of fields) {
      const label = document.createElement('label'), name = document.createElement('span'), input = document.createElement('input');
      name.dataset.cgText = key; input.type = 'number'; input.dataset.field = key; input.min = Model.LIMITS[key][0]; input.max = Model.LIMITS[key][1]; input.step = step;
      input.addEventListener('change', () => {
        try { manual = Model.validate({ ...manual, [key]: input.valueAsNumber }); panel.querySelector('#cg-input-error').textContent = ''; }
        catch { input.value = manual[key]; panel.querySelector('#cg-input-error').textContent = t('range'); }
        refresh();
      }, { signal });
      label.append(name, input, document.createTextNode(unit)); controls.append(label);
    }
    auto.addEventListener('change', () => { automatic = auto.checked; refresh(); }, { signal });
    play.addEventListener('click', () => { playing = !playing; refresh(); }, { signal });
    refresh();
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) void loadRenderer(); }, { rootMargin: '150px' });
      observer.observe(canvas);
    } else void loadRenderer();
    frame = requestAnimationFrame(tick);
  }
  root.addEventListener('pagehide', event => {
    if (event.persisted) return; // bfcache resumes existing renderer/listeners.
    disposed = true; abort.abort(); cancelAnimationFrame(frame); observer?.disconnect(); renderer?.dispose();
  }, { signal });
  document.addEventListener('DOMContentLoaded', init, { once: true, signal });
})(globalThis);
