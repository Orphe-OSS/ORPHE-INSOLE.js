(function (root, factory) {
  const api = factory(
    typeof module === 'object' && module.exports ? require('./model.js') : root.GaitCGModel,
    typeof module === 'object' && module.exports ? require('../report.js') : root.GaitReportStats
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GaitCGFeed = api;
})(globalThis, function (Model, Stats) {
  'use strict';
  const WINDOW = 6, STALE_MS = 8000;
  const positive = v => typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
  /** Bounded, same-source rolling window. Never writes to the report recorder. */
  class Feed {
    constructor() { this.reset(); }
    reset() { this.rows = { left: [], right: [] }; this.source = null; this.lastValid = null; this.rejected = false; this.held = null; }
    disconnect(side) { if (!this.held && this.rows[side]) this.rows[side] = []; }
    push(event, base, now) {
      // While the finalized report is held, later steps must not move the CG.
      if (this.held) return false;
      if (!event || !['left', 'right'].includes(event.side) || !['live', 'demo'].includes(event.source)) return false;
      if (this.source !== event.source) this.reset();
      this.source = event.source;
      const raw = event.row || {}, cycle = positive(raw.duration_s) ||
        (positive(raw.stance_phase_s) && positive(raw.swing_phase_s) ? raw.stance_phase_s + raw.swing_phase_s : null);
      const row = { speed_mps: positive(raw.speed_mps), stride_norm_m: positive(raw.stride_norm_m),
        duration_s: cycle, stance_phase_s: positive(raw.stance_phase_s) };
      const stance = cycle && row.stance_phase_s ? 100 * row.stance_phase_s / cycle : null;
      try {
        if (!row.speed_mps || !row.stride_norm_m) throw Error('missing');
        if (raw.gait_type && raw.gait_type !== 'walk') throw Error('unsupported gait');
        if (raw.stride_direction && raw.stride_direction !== 'forward') throw Error('unsupported direction');
        Model.validate({ ...base, speed: row.speed_mps, step: row.stride_norm_m / 2,
          stance: stance === null ? base.stance : stance, stanceBias: 0 });
      } catch { this.rejected = true; return false; }
      this.rows[event.side].push({ row, at: now });
      this.rows[event.side] = this.rows[event.side].slice(-WINDOW);
      this.lastValid = now; this.rejected = false;
      return true;
    }
    /**
     * Freeze the CG on the finalized report: the same rows and the same mean the report card shows
     * (Stats.buildReport), never stale, later steps ignored until reset(). Returns the row count held.
     */
    hold(rowsBySide, source) {
      const rows = {};
      for (const side of ['left', 'right']) rows[side] = ((rowsBySide && rowsBySide[side]) || []).filter(r => r && typeof r === 'object');
      this.held = { rows, source: ['live', 'demo'].includes(source) ? source : this.source || 'live' };
      this.rejected = false;
      return rows.left.length + rows.right.length;
    }
    aggregate(report, base, common) {
      const value = (side, key) => report.sides[side].fields[key].mean;
      const left = value('left', 'stance_pct'), right = value('right', 'stance_pct');
      const l = left ?? right ?? base.stance, r = right ?? left ?? base.stance;
      const fields = report.combined.fields;
      const observed = { speed: fields.speed_mps.mean, stride: fields.stride_m.mean,
        cadence: fields.cadence_spm.mean, leftStance: left, rightStance: right };
      try {
        const parameters = Model.validate({ ...base, speed: observed.speed, step: observed.stride / 2,
          stance: (l + r) / 2, stanceBias: (l - r) / 2 });
        return { ...common, state: common.held ? 'held' : 'tracking', parameters, observed,
          cadenceMismatch: observed.cadence !== null && Math.abs(observed.cadence - Model.metrics(parameters).cadence) > 2,
          missingStance: left === null && right === null, singleSide: left === null || right === null };
      } catch { return { ...common, state: 'unsupported', parameters: base, observed }; }
    }
    snapshot(base, now) {
      if (this.held) {
        const counts = { left: this.held.rows.left.length, right: this.held.rows.right.length };
        const common = { source: this.held.source, rejected: false, held: true, count: counts.left + counts.right, counts };
        if (!common.count) return { ...common, parameters: base, state: 'unsupported' };
        return this.aggregate(Stats.buildReport(this.held.rows), base, common);
      }
      const rows = {};
      for (const side of ['left', 'right']) {
        this.rows[side] = this.rows[side].filter(entry => now - entry.at <= STALE_MS);
        rows[side] = this.rows[side].map(entry => entry.row);
      }
      const count = rows.left.length + rows.right.length;
      const common = { source: this.source, rejected: this.rejected, held: false, count, counts: { left: rows.left.length, right: rows.right.length } };
      if (!count) return { ...common, parameters: base, state: this.source ? 'stale' : 'manual' };
      return this.aggregate(Stats.buildReport(rows), base, common);
    }
  }
  return { Feed, WINDOW, STALE_MS };
});
