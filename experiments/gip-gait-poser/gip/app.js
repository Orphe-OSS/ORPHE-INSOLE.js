/**
 * GIP for ORPHE INSOLE — application wiring (browser only).
 *
 * Simulation mode: OrpheGipSynthetic.Walker generates ground-truth walking + synthetic
 * foot IMU; the Gait Module estimates it back; we render estimate vs ground truth with
 * live error numbers. Real-device mode: two ORPHE INSOLE units (L=id0, R=id1) via
 * InsoleToolkit feed the same pipeline. Set {simulator:true} on the toolkit to run the
 * real-device UI with no hardware.
 */
(function () {
  'use strict';

  const BM = window.OrpheGipBodyModel;
  const Pose = window.OrpheGipPose;
  const Gait = window.OrpheGipGaitModule;
  const Syn = window.OrpheGipSynthetic;
  const Viz = window.OrpheGipViz;

  const $ = (id) => document.getElementById(id);
  const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const fmt = (v, d) => (Number.isFinite(v) ? v.toFixed(d) : '—');
  const avg = (a, b) => {
    const xs = [a, b].filter((v) => Number.isFinite(v));
    return xs.length ? xs.reduce((p, c) => p + c, 0) / xs.length : NaN;
  };

  // ---- state --------------------------------------------------------------
  let skeleton = null;
  let mode = 'sim';
  let running = false;
  let trackerL = null, trackerR = null;
  let skeletonView = null, trajPlot = null, phaseTimeline = null;
  let walker = null;
  let rafId = null;
  let lastTs = 0;
  let lastFrame = null;
  let gateYaw = 0;
  let lastTrajL = null, lastTrajR = null;
  let toolkitsBuilt = false;

  // ---- setup --------------------------------------------------------------
  function readSkeleton() {
    skeleton = BM.estimateSkeleton({
      heightCm: +$('attr-height').value,
      weightKg: +$('attr-weight').value,
      age: +$('attr-age').value,
      gender: $('attr-gender').value
    });
    set('m-preferred', fmt(skeleton.preferredStride, 2) + ' m');
    return skeleton;
  }

  function resetTrackers() {
    const opts = { fallbackStride: skeleton.preferredStride };
    trackerL = new Gait.FootTracker(opts);
    trackerR = new Gait.FootTracker(opts);
    gateYaw = 0; lastTrajL = null; lastTrajR = null; lastFrame = null;
    if (phaseTimeline) phaseTimeline.clear();
  }

  function feed(side, s) {
    const tr = side === 'L' ? trackerL : trackerR;
    const res = tr.push(s);
    if (res && res.trajectory) {
      if (side === 'L') lastTrajL = res.trajectory; else lastTrajR = res.trajectory;
    }
    gateYaw = 0.98 * gateYaw + 0.02 * Math.abs(s.gyro.z);
  }

  function estimatePose() {
    const strideAvg = avg(trackerL.strideLength, trackerR.strideLength);
    const strideScale = clamp(strideAvg / skeleton.preferredStride, 0.5, 1.5);
    return Pose.reconstruct(skeleton, { phaseL: trackerL.phase, phaseR: trackerR.phase, strideScale: strideScale });
  }

  function meanJointError(a, b) {
    let s = 0, n = 0;
    for (const k in a.joints) {
      if (!b.joints[k]) continue;
      const p = a.joints[k], q = b.joints[k];
      s += Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z); n++;
    }
    return n ? s / n : NaN;
  }

  function setPhaseBadge(id, phaseIdx) {
    const el = $(id);
    if (!el) return;
    el.textContent = Viz.PHASE_LABELS[phaseIdx] || Viz.PHASE_LABELS[0];
    el.style.background = Viz.PHASE_COLORS[phaseIdx] || Viz.PHASE_COLORS[0];
    el.style.color = phaseIdx === 0 ? '#cdd6df' : '#0b0f13';
  }

  function updateMetrics(frame) {
    const sL = trackerL.strideLength, sR = trackerR.strideLength;
    set('m-cadence', fmt(avg(trackerL.cadence, trackerR.cadence), 0) + ' spm');
    set('m-stride', fmt(avg(sL, sR), 2) + ' m');
    set('m-speed', fmt(avg(trackerL.speed, trackerR.speed), 2) + ' m/s');
    const symmetry = (sL + sR) > 0 ? 1 - Math.abs(sL - sR) / (sL + sR) : NaN;
    set('m-symmetry', Number.isFinite(symmetry) ? (symmetry * 100).toFixed(0) + ' %' : '—');
    setPhaseBadge('m-phaseL', trackerL.discretePhase);
    setPhaseBadge('m-phaseR', trackerR.discretePhase);

    const turning = gateYaw > 60;
    const gateEl = $('m-gate');
    if (gateEl) {
      gateEl.textContent = turning ? '⚠ 旋回中 — GIPは直進歩行のみ対象' : '✓ 直進歩行';
      gateEl.className = 'badge ' + (turning ? 'bg-warning text-dark' : 'bg-success');
    }

    const simRow = $('sim-metrics');
    if (frame && simRow) {
      simRow.style.display = '';
      const est = estimatePose();
      const err = meanJointError(est, frame.gtPose) * 100; // cm
      set('m-error', fmt(err, 1) + ' cm');
      set('m-stride-gt', fmt(frame.strideLength, 2) + ' m');
      const strideErr = Math.abs(avg(sL, sR) - frame.strideLength) * 100;
      set('m-stride-err', fmt(strideErr, 1) + ' cm');
    } else if (simRow) {
      simRow.style.display = 'none';
    }
  }

  function render() {
    const gt = (mode === 'sim' && lastFrame) ? lastFrame.gtPose : null;
    if (skeletonView) skeletonView.setPoses(estimatePose(), gt);
    if (trajPlot) trajPlot.update(lastTrajL, lastTrajR);
    updateMetrics(mode === 'sim' ? lastFrame : null);
  }

  // ---- simulation loop ----------------------------------------------------
  function startSim() {
    readSkeleton();
    resetTrackers();
    walker = new Syn.Walker(skeleton, {
      cadence: +$('sim-cadence').value,
      strideScale: +$('sim-stride').value,
      noise: +$('sim-noise').value,
      fs: 100,
      seed: 20260718
    });
    lastTs = 0;
    running = true;
    rafId = requestAnimationFrame(simTick);
  }

  function simTick(ts) {
    if (!running || mode !== 'sim') return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.1, (ts - lastTs) / 1000);
    lastTs = ts;
    const nFrames = Math.max(1, Math.round(dt * walker.fs));
    for (let i = 0; i < nFrames; i++) {
      const f = walker.step();
      feed('L', f.left); feed('R', f.right);
      lastFrame = f;
    }
    if (phaseTimeline) phaseTimeline.push(trackerL.discretePhase, trackerR.discretePhase);
    render();
    rafId = requestAnimationFrame(simTick);
  }

  // ---- real-device loop ---------------------------------------------------
  function buildToolkits() {
    if (toolkitsBuilt) return;
    const useSim = $('real-simulator').checked;
    const smode = +$('real-mode').value;
    window.buildInsoleToolkit($('toolkit-left'), 'LEFT foot (id 0)', 0, { streamingMode: smode, autoReconnect: true, simulator: useSim });
    window.buildInsoleToolkit($('toolkit-right'), 'RIGHT foot (id 1)', 1, { streamingMode: smode, autoReconnect: true, simulator: useSim });
    toolkitsBuilt = true;

    [0, 1].forEach((id) => {
      const dev = window.insoles[id];
      dev.setup();
      const side = id === 0 ? 'L' : 'R';
      const pending = { acc: null, gyro: null, quat: null, t: 0 };
      dev.gotConvertedAcc = function (a) { pending.acc = { x: a.x, y: a.y, z: a.z }; pending.t = a.timestamp; };
      dev.gotConvertedGyro = function (g) { pending.gyro = { x: g.x, y: g.y, z: g.z }; };
      dev.gotQuat = function (q) { pending.quat = { w: q.w, x: q.x, y: q.y, z: q.z }; };
      dev.gotPress = function (pr) {
        if (pending.acc && pending.gyro) {
          feed(side, { t: pr.timestamp || pending.t, acc: pending.acc, gyro: pending.gyro, quat: pending.quat, press: pr.values.slice() });
        }
      };
    });
  }

  function startReal() {
    readSkeleton();
    resetTrackers();
    buildToolkits();
    running = true;
    if ($('real-simulator').checked) {
      // simulator slots stream immediately once begin() is called
      window.insoles[0].begin('SENSOR_VALUES', { streamingMode: +$('real-mode').value });
      window.insoles[1].begin('SENSOR_VALUES', { streamingMode: +$('real-mode').value });
    }
    rafId = requestAnimationFrame(realTick);
  }

  function realTick() {
    if (!running || mode !== 'real') return;
    if (phaseTimeline) phaseTimeline.push(trackerL.discretePhase, trackerR.discretePhase);
    render();
    rafId = requestAnimationFrame(realTick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (mode === 'real' && toolkitsBuilt && window.insoles) {
      try { window.insoles[0].stop(); window.insoles[1].stop(); } catch { /* not connected */ }
    }
  }

  // ---- UI ----------------------------------------------------------------
  function setMode(next) {
    stop();
    mode = next;
    $('sim-panel').style.display = next === 'sim' ? '' : 'none';
    $('real-panel').style.display = next === 'real' ? '' : 'none';
    $('btn-mode-sim').classList.toggle('active', next === 'sim');
    $('btn-mode-real').classList.toggle('active', next === 'real');
  }

  function bindRange(id, valId, suffix) {
    const el = $(id);
    const upd = () => set(valId, el.value + (suffix || ''));
    el.addEventListener('input', () => {
      upd();
      if (running && mode === 'sim' && walker) {
        walker.cadence = +$('sim-cadence').value;
        walker.periodMs = 120000 / walker.cadence;
        walker.strideScale = +$('sim-stride').value;
        walker.strideLength = skeleton.preferredStride * walker.strideScale;
        walker.speed = walker.strideLength / (walker.periodMs / 1000);
        walker.noise = +$('sim-noise').value;
      }
    });
    upd();
  }

  function init() {
    readSkeleton();
    resetTrackers();
    skeletonView = Viz.createSkeletonView($('skeleton'));
    trajPlot = Viz.createTrajectoryPlot($('plot-traj'));
    phaseTimeline = Viz.createPhaseTimeline($('plot-phase'));

    // phase legend
    const legend = $('phase-legend');
    if (legend) {
      Viz.PHASE_LABELS.forEach((label, i) => {
        const chip = document.createElement('span');
        chip.className = 'me-2';
        chip.innerHTML = `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${Viz.PHASE_COLORS[i]}"></span> ${label}`;
        legend.appendChild(chip);
      });
    }

    ['attr-height', 'attr-weight', 'attr-age', 'attr-gender'].forEach((id) => {
      $(id).addEventListener('change', () => { readSkeleton(); if (!running) render(); });
    });
    bindRange('sim-cadence', 'sim-cadence-val', ' spm');
    bindRange('sim-stride', 'sim-stride-val', '×');
    bindRange('sim-noise', 'sim-noise-val', '');

    $('btn-mode-sim').addEventListener('click', () => setMode('sim'));
    $('btn-mode-real').addEventListener('click', () => setMode('real'));
    $('btn-start').addEventListener('click', () => { if (mode === 'sim') startSim(); else startReal(); });
    $('btn-stop').addEventListener('click', stop);

    setMode('sim');
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
