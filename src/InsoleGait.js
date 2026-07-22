/**
 * ORPHE INSOLE Gait Analysis — 歩容解析（StrideAnalyzer）のリアルタイム取得（opt-in）
 *
 * ORPHE INSOLE のファームウェア（GaitAnalysisCore / StrideAnalyzer）は、歩行中の
 * 歩容パラメーター（ストライド・立脚期/遊脚期・接地パターン・プロネーション等）を
 * リアルタイムに計算し、**Gait Analysis サービスの Step Analysis characteristic**
 * (`4EB776DC-CF99-4AF7-B2D3-AD0F791A79DD`) で公開している。デバイスに接続して
 * アクティブ状態になるとファームウェアが **50Hz で自動 notify** するため、この
 * characteristic を subscribe するだけでよい（read モード変更は不要）。
 *
 * Python 参照実装 `insole_client`（read_gait_analysis / read_gait_analysis_decoder）の
 * 忠実な移植。バイト形式は firmware(GaitAnalysisService::getBleSentStepAnalysisData) /
 * orphe_core_sdk / orphe_track_sdk の3実装と突き合わせ済み。
 *
 * コアSDK（ORPHE-INSOLE.js）とは疎結合で、純粋関数群は Node 単体でもテストできる。
 * ブラウザでは begin() で接続済みの OrpheInsole を渡して使う。
 *
 * 注意: STEP_ANALYSIS characteristic は ORPHE_OTHER_SERVICE（SENSOR_VALUES と同じ）配下で、
 * requestDevice の optionalServices に既に含まれるため、追加のサービス指定は不要。
 */
(function (global) {

  // ── 定数 ───────────────────────────────────────────────────────────
  const STEP_ANALYSIS_CHAR_UUID = '4eb776dc-cf99-4af7-b2d3-ad0f791a79dd';

  const ANALYSIS_PACKET_HEADER = 51;   // 各パケット先頭 byte[0]。firmware は常に 51。
  const ANALYSIS_PACKET_LENGTH = 20;   // 1 notify = 20 byte

  // サブヘッダー byte[1]。1ストライドごとに overview/stride/pronation が（取りこぼし対策で
  // 2回ずつ）送られ、motion はストライドの合間にも継続送信される。
  const SUBHEADER_OVERVIEW = 0;    // 歩容概要（歩数/距離/立脚期・遊脚期など）
  const SUBHEADER_STRIDE = 1;      // ストライド（足角度/ストライドベクトル）
  const SUBHEADER_PRONATION = 2;   // プロネーション・着地衝撃
  const SUBHEADER_MOTION = 4;      // クォータニオン・微小変位・歩行サイクル

  // byte[4] に詰め込まれた歩容タイプ(bit7-6)とストライド方向(bit5-3)。firmware / orphe_core_sdk と揃える。
  const GAIT_TYPES = ['none', 'walk', 'run', 'stance'];
  const STRIDE_DIRECTIONS = ['none', 'forward', 'backward', 'inside', 'outside'];

  // foot strike / pronation の分類しきい値（orphe_core_sdk と揃える）。
  const FOOT_STRIKE_MID_THRESHOLD = -3.0;
  const FOOT_STRIKE_FORE_THRESHOLD = 2.0;
  const PRONATION_AVERAGE = -9.4;
  const PRONATION_STD = 3.5;

  const MAX_PENDING_STEPS = 64;    // 揃わないまま溜まる歩の上限（メモリ保護）

  const CSV_HEADER =
    'step_number,gait_type,stride_direction,distance_m,' +
    'stance_phase_s,swing_phase_s,duration_s,cadence_hz,speed_mps,' +
    'foot_angle_deg,stride_x_m,stride_y_m,stride_z_m,stride_norm_m,' +
    'landing_force,strike_angle_deg,foot_strike,' +
    'pronation_deg,pronation_type,pronation_z_deg,calorie';

  // ── バイナリ読み出し（すべてビッグエンディアン） ──────────────────────
  function u16be(dv, o) { return dv.getUint16(o, false); }
  function f32be(dv, o) { return dv.getFloat32(o, false); }

  // IEEE 754 half-precision（Python struct '>e' 相当）。DataView.getFloat16 が無い環境でも動く。
  function f16be(dv, o) {
    const h = dv.getUint16(o, false);
    const sign = (h & 0x8000) ? -1 : 1;
    const exp = (h >> 10) & 0x1f;
    const frac = h & 0x03ff;
    if (exp === 0) return sign * frac * Math.pow(2, -24);          // 非正規化数
    if (exp === 0x1f) return frac ? NaN : sign * Infinity;         // Inf / NaN
    return sign * (1 + frac / 1024) * Math.pow(2, exp - 15);
  }

  // NaN / Inf は「値が未確定」を意味するため null に丸める。
  function sanitize(v) {
    if (v === null || v === undefined || Number.isNaN(v) || !Number.isFinite(v)) return null;
    return v;
  }

  // 本来「非負」の量（時間・距離・カロリー・着地衝撃）向けのサニタイズ。
  // FW は未確定値に -1 sentinel を入れることがあり、これは有限値なので sanitize を素通りしてしまう。
  // -1（および負値）を欠損として null に丸め、これを用いる派生値（duration/cadence/speed）が
  // 負や無意味な値にならないようにする（角度・ベクトルなど負値が正当なフィールドには使わない）。
  function sanitizeNonNeg(v) {
    const s = sanitize(v);
    return (s === null || s < 0) ? null : s;
  }

  // ── 分類ヘルパ ───────────────────────────────────────────────────────
  function gaitTypeToStr(v) { return (v >= 0 && v < GAIT_TYPES.length) ? GAIT_TYPES[v] : 'unknown'; }
  function strideDirectionToStr(v) { return (v >= 0 && v < STRIDE_DIRECTIONS.length) ? STRIDE_DIRECTIONS[v] : 'unknown'; }

  // 着地時の足角度(pronationX)から接地パターンを判定
  function footStrikeToStr(strikeAngle) {
    if (strikeAngle === null || strikeAngle === undefined) return 'none';
    if (strikeAngle > FOOT_STRIKE_FORE_THRESHOLD) return 'forefoot';
    if (strikeAngle > FOOT_STRIKE_MID_THRESHOLD) return 'midfoot';
    return 'heelStrike';
  }

  // プロネーション角(pronationY)から種別を判定
  function pronationToStr(pronationY) {
    if (pronationY === null || pronationY === undefined) return 'none';
    const ave = PRONATION_AVERAGE, std = PRONATION_STD;
    if (pronationY >= ave - std && pronationY <= ave + std) return 'neutral';
    if (pronationY > ave + std && pronationY <= ave + std * 3) return 'over';
    if (pronationY > ave + std * 3) return 'severeOver';
    if (pronationY >= ave - std * 3 && pronationY < ave - std) return 'under';
    if (pronationY < ave - std * 3) return 'severeUnder';
    return 'none';
  }

  // ── サブヘッダー別デコード ───────────────────────────────────────────
  function decodeOverview(dv) {
    const b = dv.getUint8(4);
    return {
      gait_type: gaitTypeToStr((b >> 6) & 0b11),
      stride_direction: strideDirectionToStr((b >> 3) & 0b111),
      calorie: sanitizeNonNeg(f16be(dv, 6)),          // 消費カロリー(累計、非負)
      distance_m: sanitizeNonNeg(f32be(dv, 8)),       // 総移動距離(累計、非負)
      stance_phase_s: sanitizeNonNeg(f32be(dv, 12)),  // 立脚期継続時間(非負、-1=未確定)
      swing_phase_s: sanitizeNonNeg(f32be(dv, 16)),   // 遊脚期継続時間(非負、-1=未確定)
    };
  }

  function decodeStride(dv) {
    return {
      foot_angle: sanitize(f32be(dv, 4)),   // 足角度
      stride_x: sanitize(f32be(dv, 8)),     // ストライドベクトル X
      stride_y: sanitize(f32be(dv, 12)),    // ストライドベクトル Y
      stride_z: sanitize(f32be(dv, 16)),    // ストライドベクトル Z（接地高さ）
    };
  }

  function decodePronation(dv) {
    return {
      landing_force: sanitizeNonNeg(f32be(dv, 4)),  // 着地衝撃(非負、-1=未確定)
      pronation_x: sanitize(f32be(dv, 8)),    // 着地時の足角度（strike angle）
      pronation_y: sanitize(f32be(dv, 12)),   // プロネーション角
      pronation_z: sanitize(f32be(dv, 16)),   // 回旋角
    };
  }

  function decodeMotion(dv) {
    const b = dv.getUint8(4);
    return {
      gait_cycle_phase: (b >> 6) & 0b11,
      gait_cycle_period: (b >> 3) & 0b111,
      gait_cycle_event: b & 0b111,
      quat_w: sanitize(f16be(dv, 6)),
      quat_x: sanitize(f16be(dv, 8)),
      quat_y: sanitize(f16be(dv, 10)),
      quat_z: sanitize(f16be(dv, 12)),
      delta_x: sanitize(f16be(dv, 14)),  // 微小変位 X
      delta_y: sanitize(f16be(dv, 16)),  // 微小変位 Y
      delta_z: sanitize(f16be(dv, 18)),  // 微小変位 Z
    };
  }

  const SUBHEADER_DECODERS = {
    [SUBHEADER_OVERVIEW]: ['overview', decodeOverview],
    [SUBHEADER_STRIDE]: ['stride', decodeStride],
    [SUBHEADER_PRONATION]: ['pronation', decodePronation],
    [SUBHEADER_MOTION]: ['motion', decodeMotion],
  };

  // 歩容解析の BLE notify パケット(20byte, DataView)を1件デコードする。
  // 戻り値は { type, subheader, step_number, ...種別ごとのフィールド }。
  // 解析パケットでない場合（ヘッダー不一致・長さ不足・未知サブヘッダー）は null。
  function decodeAnalysisPacket(dv) {
    if (!dv || dv.byteLength < ANALYSIS_PACKET_LENGTH) return null;
    if (dv.getUint8(0) !== ANALYSIS_PACKET_HEADER) return null;
    const subheader = dv.getUint8(1);
    const decoder = SUBHEADER_DECODERS[subheader];
    if (!decoder) return null;
    const [typeName, decodeFn] = decoder;
    return Object.assign({
      type: typeName,
      subheader,
      step_number: u16be(dv, 2),
    }, decodeFn(dv));
  }

  // ── 派生指標 ─────────────────────────────────────────────────────────
  // ストライドベクトルのノルム（1歩の移動量）
  function strideNorm(stride) {
    const x = stride.stride_x, y = stride.stride_y, z = stride.stride_z;
    if (x === null || y === null || z === null) return null;
    return Math.sqrt(x * x + y * y + z * z);
  }

  // overview / stride / pronation を1歩ぶんにまとめ、派生指標（時間・ケイデンス・速度）も算出する。
  function buildGaitRow(stepNumber, parts) {
    const overview = parts.overview, stride = parts.stride, pronation = parts.pronation;
    const stance = overview.stance_phase_s;   // sanitizeNonNeg 済み（-1/負値は null）
    const swing = overview.swing_phase_s;
    // stance/swing が欠損（-1 等で null）なら duration も欠損。0以下は無効歩として null。
    let duration = (stance !== null && swing !== null) ? stance + swing : null;
    if (duration !== null && duration <= 0) duration = null;
    const norm = strideNorm(stride);
    // cadence/speed は「有限かつ正の duration」のときだけ計算する。
    const durationValid = duration !== null && duration > 0;
    const cadence = durationValid ? 1.0 / duration : null;
    const speed = (durationValid && norm !== null) ? norm / duration : null;
    return {
      step_number: stepNumber,
      gait_type: overview.gait_type,
      stride_direction: overview.stride_direction,
      distance_m: overview.distance_m,
      stance_phase_s: stance,
      swing_phase_s: swing,
      duration_s: duration,
      cadence_hz: cadence,
      speed_mps: speed,
      foot_angle_deg: stride.foot_angle,
      stride_x_m: stride.stride_x,
      stride_y_m: stride.stride_y,
      stride_z_m: stride.stride_z,
      stride_norm_m: norm,
      landing_force: pronation.landing_force,
      strike_angle_deg: pronation.pronation_x,
      foot_strike: footStrikeToStr(pronation.pronation_x),
      pronation_deg: pronation.pronation_y,
      pronation_type: pronationToStr(pronation.pronation_y),
      pronation_z_deg: pronation.pronation_z,
      calorie: overview.calorie,
    };
  }

  function csvCell(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(4);
    return String(v);
  }

  function gaitRowToCsv(row) {
    return [
      row.step_number, row.gait_type, row.stride_direction, row.distance_m,
      row.stance_phase_s, row.swing_phase_s, row.duration_s, row.cadence_hz, row.speed_mps,
      row.foot_angle_deg, row.stride_x_m, row.stride_y_m, row.stride_z_m, row.stride_norm_m,
      row.landing_force, row.strike_angle_deg, row.foot_strike,
      row.pronation_deg, row.pronation_type, row.pronation_z_deg, row.calorie,
    ].map(csvCell).join(',');
  }

  // ── step 集約 ────────────────────────────────────────────────────────
  // 各サブパケットを step_number 単位に集約し、overview/stride/pronation が揃った歩を返す。
  // サブパケットは取りこぼし対策で複数回送られるため、同じ歩は一度だけ出力する。
  class GaitAggregator {
    constructor() {
      this._pending = new Map();  // step_number -> { overview, stride, pronation }
      this._emitted = new Set();
    }

    add(packet) {
      const step = packet.step_number;
      if (this._emitted.has(step)) return null; // 既出（2回目の送信）は無視

      let parts = this._pending.get(step);
      if (!parts) { parts = {}; this._pending.set(step, parts); }
      parts[packet.type] = packet;

      if (parts.overview && parts.stride && parts.pronation) {
        const row = buildGaitRow(step, parts);
        this._pending.delete(step);
        this._markEmitted(step);
        return row;
      }
      this._evictOldPending();
      return null;
    }

    // 古いものから捨てる。step_number は uint16 で 65535→0 に wraparound するため、
    // 数値の大小ではなく「挿入順（＝到着順）」で最古を判定する。Map / Set は挿入順を保持し、
    // .keys()/.values() の先頭が最古なので、それを FIFO で捨てる（step 0 を最古と誤認しない）。
    _markEmitted(step) {
      this._emitted.add(step);
      const cap = MAX_PENDING_STEPS * 4;
      while (this._emitted.size > cap) {
        this._emitted.delete(this._emitted.values().next().value);
      }
    }

    _evictOldPending() {
      while (this._pending.size > MAX_PENDING_STEPS) {
        this._pending.delete(this._pending.keys().next().value);
      }
    }
  }

  // ── メインクラス ─────────────────────────────────────────────────────
  /**
   * 歩容解析（Gait Analysis）のリアルタイム取得。接続済みの OrpheInsole を渡して使う。
   * @example
   *   const gait = new OrpheInsoleGait(insole);
   *   gait.onGait = (deviceId, row) => console.log(row.stride_norm_m, row.foot_strike);
   *   await gait.start();
   *   // ... 歩行 ...
   *   await gait.stop();
   */
  class OrpheInsoleGait {
    /**
     * @param {OrpheInsole} insole 接続済み（begin 済み）の OrpheInsole
     * @param {object} [options]
     * @param {string} [options.serviceUUID] STEP_ANALYSIS の service（既定は insole.ORPHE_OTHER_SERVICE）
     * @param {string} [options.characteristicUUID] STEP_ANALYSIS の characteristic（既定は insole.ORPHE_STEP_ANALYSIS）
     */
    constructor(insole, options = {}) {
      this.insole = insole;
      this.options = options;
      this.aggregator = new GaitAggregator();
      this.rows = [];              // 完成した歩容パラメーター（CSV 出力用）
      this._running = false;       // ユーザが「計測ON」を望む状態（切断中も維持）
      this._subscribed = false;    // 実際に STEP_ANALYSIS を購読中か
      this._startPromise = null;   // 進行中の start()（直列化用）
      this._stopPromise = null;    // 進行中の stop()（直列化用）
      this._sinkFn = null;         // 自分が設定した _gaitNotifySink（所有権判定用）
      this._reconnectHook = null;  // 再接続後に再購読するフック

      // コールバック（ユーザが上書き）
      this.onGait = null;     // (deviceId, row) 1歩ごとの歩容パラメーター（overview+stride+pronation 集約後）
      this.onMotion = null;   // (deviceId, motion) motion（クォータニオン・微小変位・歩行サイクル、〜50Hz）
      this.onRaw = null;      // (deviceId, packet) デコード済みの全パケット
      this.onError = null;    // (error)
    }

    get deviceId() { return this.insole ? this.insole.id : 0; }
    get stepCount() { return this.rows.length; }
    get isRunning() { return this._running; }

    /**
     * 歩容解析の notify を開始する。SENSOR_VALUES は begin() 済み（アクティブ状態）であること。
     * start()/stop() は直列化され、交錯しても最終状態が確定する。
     * @returns {Promise<boolean>} 開始できたら true
     */
    async start() {
      // 直前の stop() が進行中なら完了を待つ（stop の finally が新しい sink を消す競合を防ぐ）
      if (this._stopPromise) { try { await this._stopPromise; } catch (_) { /* noop */ } }
      if (this._startPromise) return this._startPromise; // 進行中の start に合流
      if (this._running) return true;
      this._startPromise = this._doStart();
      try { return await this._startPromise; } finally { this._startPromise = null; }
    }

    async _doStart() {
      if (!this.insole || !this.insole.isConnected || !this.insole.isConnected()) {
        this._reportError(new Error('OrpheInsoleGait.start(): insole is not connected'));
        return false;
      }
      this.aggregator = new GaitAggregator();
      this.rows = [];
      this._running = true;           // 望む状態を先に確定（実購読は _subscribe で）
      this._installReconnectHook();   // 再接続後に STEP_ANALYSIS を1回だけ再購読する
      const ok = await this._subscribe();
      if (!ok) {
        this._running = false;
        this._removeReconnectHook();
      }
      return ok;
    }

    /** STEP_ANALYSIS を購読する（初回・再接続共通）。成功で true。 */
    async _subscribe() {
      const service = this.options.serviceUUID || this.insole.ORPHE_OTHER_SERVICE;
      const characteristic = this.options.characteristicUUID || this.insole.ORPHE_STEP_ANALYSIS || STEP_ANALYSIS_CHAR_UUID;
      // notify をこのモジュールの sink へ横取り（core SDK の onRead が STEP_ANALYSIS で呼ぶ）
      this._sinkFn = (dv) => this._onPacket(dv);
      this.insole._gaitNotifySink = this._sinkFn;
      this.insole.setUUID('STEP_ANALYSIS', service, characteristic);
      try {
        await this.insole.startNotify('STEP_ANALYSIS');
        this._subscribed = true;
        return true;
      } catch (e) {
        this._subscribed = false;
        this._clearSink();
        this._reportError(e);
        return false;
      }
    }

    /** 歩容解析の notify を停止する。start()/stop() の交錯でも安全に停止する。 */
    async stop() {
      // 進行中の start() を待ってから停止する（pending start を確実に止める）
      if (this._startPromise) { try { await this._startPromise; } catch (_) { /* noop */ } }
      if (this._stopPromise) return this._stopPromise; // 進行中の stop に合流
      if (!this._running) return;
      this._stopPromise = this._doStop();
      try { return await this._stopPromise; } finally { this._stopPromise = null; }
    }

    async _doStop() {
      this._running = false;
      this._removeReconnectHook();
      try {
        if (this._subscribed && this.insole && this.insole.isConnected && this.insole.isConnected()) {
          await this.insole.stopNotify('STEP_ANALYSIS');
        }
      } catch (_) { /* noop */ } finally {
        this._subscribed = false;
        this._clearSink();
      }
    }

    // 自分が設定した sink のみ削除する（複数 Gait インスタンスが単一の _gaitNotifySink を奪い合わないため）。
    _clearSink() {
      if (this.insole && this.insole._gaitNotifySink === this._sinkFn) {
        delete this.insole._gaitNotifySink;
      }
      this._sinkFn = null;
    }

    // Core の再接続成功後に STEP_ANALYSIS を再購読するフックを登録する（既存の on* callback は壊さない）。
    _installReconnectHook() {
      if (this._reconnectHook || !this.insole) return;
      this._reconnectHook = () => this._onReconnected();
      const list = this.insole._afterReconnectSuccess;
      if (Array.isArray(list)) list.push(this._reconnectHook);
    }

    _removeReconnectHook() {
      const list = this.insole && this.insole._afterReconnectSuccess;
      if (Array.isArray(list) && this._reconnectHook) {
        const i = list.indexOf(this._reconnectHook);
        if (i >= 0) list.splice(i, 1);
      }
      this._reconnectHook = null;
    }

    // Core が SENSOR_VALUES を再確立した直後に呼ばれる。旧購読は GATT 切断で無効なので、
    // 望む状態（_running）なら STEP_ANALYSIS を1回だけ再購読する（集約状態は維持＝重複 step は dedup で無視）。
    _onReconnected() {
      if (!this._running) return;
      this._subscribed = false;
      this._subscribe().catch((e) => this._reportError(e));
    }

    _onPacket(dv) {
      const packet = decodeAnalysisPacket(dv);
      if (!packet) return;
      if (typeof this.onRaw === 'function') this._safe(() => this.onRaw(this.deviceId, packet));
      if (packet.type === 'motion') {
        if (typeof this.onMotion === 'function') this._safe(() => this.onMotion(this.deviceId, packet));
        return;
      }
      const row = this.aggregator.add(packet);
      if (row) {
        this.rows.push(row);
        if (typeof this.onGait === 'function') this._safe(() => this.onGait(this.deviceId, row));
      }
    }

    // ── CSV 出力 ──────────────────────────────────────────────────────
    /** 集めた歩容パラメーターを参照実装互換の CSV 文字列にする */
    toCSV() {
      const lines = [CSV_HEADER];
      for (const row of this.rows) lines.push(gaitRowToCsv(row));
      return lines.join('\n') + '\n';
    }

    /** ブラウザで CSV をダウンロードする */
    download(filename) {
      const csv = this.toCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'orphe-insole-gait.csv';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 1000);
    }

    // ── 内部ユーティリティ ────────────────────────────────────────────
    _safe(fn) { try { fn(); } catch (e) { this._reportError(e); } }
    _reportError(error) {
      if (typeof this.onError === 'function') { try { this.onError(error); return; } catch (_) { /* fallthrough */ } }
      console.error('OrpheInsoleGait:', error);
    }
  }

  // ── 純粋関数/定数をテスト用に公開 ───────────────────────────────────
  OrpheInsoleGait.STEP_ANALYSIS_CHAR_UUID = STEP_ANALYSIS_CHAR_UUID;
  OrpheInsoleGait.ANALYSIS_PACKET_HEADER = ANALYSIS_PACKET_HEADER;
  OrpheInsoleGait.CSV_HEADER = CSV_HEADER;
  OrpheInsoleGait.GAIT_TYPES = GAIT_TYPES;
  OrpheInsoleGait.STRIDE_DIRECTIONS = STRIDE_DIRECTIONS;
  OrpheInsoleGait.f16be = f16be;
  OrpheInsoleGait.gaitTypeToStr = gaitTypeToStr;
  OrpheInsoleGait.strideDirectionToStr = strideDirectionToStr;
  OrpheInsoleGait.footStrikeToStr = footStrikeToStr;
  OrpheInsoleGait.pronationToStr = pronationToStr;
  OrpheInsoleGait.decodeAnalysisPacket = decodeAnalysisPacket;
  OrpheInsoleGait.strideNorm = strideNorm;
  OrpheInsoleGait.buildGaitRow = buildGaitRow;
  OrpheInsoleGait.gaitRowToCsv = gaitRowToCsv;
  OrpheInsoleGait.GaitAggregator = GaitAggregator;

  if (typeof global.OrpheInsoleGait === 'undefined') {
    global.OrpheInsoleGait = OrpheInsoleGait;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrpheInsoleGait;
  }

})(typeof globalThis !== 'undefined' ? globalThis : this);
