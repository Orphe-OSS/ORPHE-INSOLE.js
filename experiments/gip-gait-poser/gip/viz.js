/**
 * GIP visualisation helpers (browser only).
 *  - createSkeletonView : p5.js (WEBGL) full-body walking avatar (estimate + GT ghost)
 *  - createTrajectoryPlot: top-view (x-y) and side-view (x-z) foot paths (paper figs 5-6)
 *  - createPhaseTimeline : scrolling 4-phase strip for both feet
 * Requires p5.js to be loaded globally.
 */
(function (global) {
  'use strict';

  // 4-phase colours (swing / heel-strike / foot-flat / heel-off)
  const PHASE_COLORS = ['#2b3440', '#ffd166', '#06d6a0', '#ef476f'];
  const PHASE_LABELS = ['遊脚(swing)', '踵接地(HS)', '接地(flat)', '踵離地(HO)'];

  function createSkeletonView(container) {
    let estPose = null, gtPose = null;
    const S = 175; // px per metre
    const p5ctor = global.p5;
    if (!p5ctor) throw new Error('createSkeletonView: p5.js が読み込まれていません');

    function toVec(p, j) { return p.createVector(-j.y * S, -j.z * S, j.x * S); }

    function drawFloor(p) {
      p.push();
      p.stroke(60, 72, 85); p.strokeWeight(1);
      const span = 3, step = 0.25;
      for (let g = -span; g <= span; g += step) {
        p.line(-span * S, 0, g * S, span * S, 0, g * S);
        p.line(g * S, 0, -span * S, g * S, 0, span * S);
      }
      p.pop();
    }

    function drawSkeleton(p, pose, col, alpha, weight) {
      const j = pose.joints;
      p.push();
      p.stroke(col[0], col[1], col[2], alpha);
      p.strokeWeight(weight);
      for (const b of pose.bones) {
        const a = toVec(p, j[b[0]]), c = toVec(p, j[b[1]]);
        p.line(a.x, a.y, a.z, c.x, c.y, c.z);
      }
      p.noStroke();
      p.fill(col[0], col[1], col[2], alpha);
      for (const key in j) {
        const v = toVec(p, j[key]);
        p.push(); p.translate(v.x, v.y, v.z); p.sphere(weight * 0.9); p.pop();
      }
      p.pop();
    }

    const sketch = (p) => {
      p.setup = () => {
        const w = container.clientWidth || 480;
        const h = Math.max(320, Math.round(w * 0.66));
        const c = p.createCanvas(w, h, p.WEBGL);
        c.parent(container);
        p.camera(2.2 * S, -1.0 * S, 3.4 * S, 0, -0.8 * S, 0, 0, 1, 0);
      };
      p.draw = () => {
        p.background(15, 20, 26);
        p.orbitControl(2, 1.5, 0.05);
        p.push();
        p.translate(0, 0, 0);
        drawFloor(p);
        if (gtPose) drawSkeleton(p, gtPose, [150, 165, 180], 110, 3);   // ground-truth ghost
        if (estPose) drawSkeleton(p, estPose, [80, 200, 255], 255, 5);  // estimate
        p.pop();
      };
      p.windowResized = () => {
        const w = container.clientWidth || 480;
        p.resizeCanvas(w, Math.max(320, Math.round(w * 0.66)));
      };
    };

    const inst = new p5ctor(sketch, container);
    return {
      setPoses(estimate, groundTruth) { estPose = estimate; gtPose = groundTruth || null; },
      remove() { inst.remove(); }
    };
  }

  // ---- 2D foot-trajectory plot (top + side view) --------------------------
  function createTrajectoryPlot(canvas) {
    const ctx = canvas.getContext('2d');
    function fit(paths) {
      let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
      for (const pth of paths) {
        for (const pt of pth) {
          if (pt.a < minx) minx = pt.a; if (pt.a > maxx) maxx = pt.a;
          if (pt.b < miny) miny = pt.b; if (pt.b > maxy) maxy = pt.b;
        }
      }
      if (!Number.isFinite(minx)) return null;
      return { minx, maxx, miny, maxy };
    }
    function drawView(x0, y0, w, h, title, pathsL, pathsR) {
      ctx.strokeStyle = '#2b3440'; ctx.lineWidth = 1;
      ctx.strokeRect(x0, y0, w, h);
      ctx.fillStyle = '#8a97a6'; ctx.font = '11px system-ui'; ctx.fillText(title, x0 + 6, y0 + 14);
      const box = fit([pathsL, pathsR]);
      if (!box) return;
      const pad = 18;
      const sx = (w - 2 * pad) / Math.max(0.2, box.maxx - box.minx);
      const sy = (h - 2 * pad) / Math.max(0.2, box.maxy - box.miny);
      const sc = Math.min(sx, sy);
      const map = (pt) => ({
        x: x0 + pad + (pt.a - box.minx) * sc,
        y: y0 + h - pad - (pt.b - box.miny) * sc
      });
      const draw = (pth, color) => {
        if (!pth.length) return;
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
        pth.forEach((pt, i) => { const m = map(pt); i ? ctx.lineTo(m.x, m.y) : ctx.moveTo(m.x, m.y); });
        ctx.stroke();
      };
      draw(pathsL, '#ffd166');
      draw(pathsR, '#06d6a0');
    }
    return {
      update(trajL, trajR) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const w = canvas.width, h = canvas.height;
        const topL = trajL ? trajL.x.map((v, i) => ({ a: v, b: trajL.y[i] })) : [];
        const topR = trajR ? trajR.x.map((v, i) => ({ a: v, b: trajR.y[i] })) : [];
        const sideL = trajL ? trajL.x.map((v, i) => ({ a: v, b: trajL.z[i] })) : [];
        const sideR = trajR ? trajR.x.map((v, i) => ({ a: v, b: trajR.z[i] })) : [];
        drawView(0, 0, w, h / 2 - 4, '上面 top (前後 × 左右)', topL, topR);
        drawView(0, h / 2 + 4, w, h / 2 - 4, '側面 side (前後 × 上下)', sideL, sideR);
      }
    };
  }

  // ---- scrolling gait-phase timeline --------------------------------------
  function createPhaseTimeline(canvas) {
    const ctx = canvas.getContext('2d');
    let col = 0;
    function clear() { ctx.fillStyle = '#12181e'; ctx.fillRect(0, 0, canvas.width, canvas.height); col = 0; }
    clear();
    return {
      push(phaseL, phaseR) {
        const w = canvas.width, h = canvas.height;
        if (col >= w) {
          const img = ctx.getImageData(1, 0, w - 1, h);
          ctx.putImageData(img, 0, 0);
          col = w - 1;
        }
        ctx.fillStyle = '#12181e'; ctx.fillRect(col, 0, 1, h);
        ctx.fillStyle = PHASE_COLORS[phaseL] || PHASE_COLORS[0]; ctx.fillRect(col, 0, 1, h / 2 - 1);
        ctx.fillStyle = PHASE_COLORS[phaseR] || PHASE_COLORS[0]; ctx.fillRect(col, h / 2 + 1, 1, h / 2 - 1);
        col++;
      },
      clear
    };
  }

  const Viz = {
    PHASE_COLORS: PHASE_COLORS,
    PHASE_LABELS: PHASE_LABELS,
    createSkeletonView: createSkeletonView,
    createTrajectoryPlot: createTrajectoryPlot,
    createPhaseTimeline: createPhaseTimeline
  };

  if (typeof global.OrpheGipViz === 'undefined') global.OrpheGipViz = Viz;
})(typeof globalThis !== 'undefined' ? globalThis : this);
