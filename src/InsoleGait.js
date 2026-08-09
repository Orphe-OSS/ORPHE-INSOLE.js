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

  // ── step損失検出のパラメータ ──
  // FWは overview/stride/pronation を各2回、その歩の直後にまとめて送る。
  // 数歩あとの step のパケットが届いた時点でまだ揃っていない歩は、再送も終わって
  // いるため回復不能とみなせる。
  const STALE_STEP_DISTANCE = 8;   // 最新stepからこれ以上古いpendingは incomplete として計上
  const GAP_COUNT_LIMIT = 64;      // これを超えるstep_number前進はgapではなく採番ジャンプ扱い
  const MISSED_STEP_MEMORY = 256;  // gap計上済みstepを覚えておく数（後着で計上を取り消すため）

  // uint16 の wraparound を考慮した前進距離（65535→0 をまたいでも正しく数える）
  function stepDistance(from, to) {
    return (to - from + 0x10000) % 0x10000;
  }

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
      this._lastSeenStep = null;  // 最新のstep_number（wraparound対応の前進判定に使う）
      this._missedSteps = new Set(); // gap計上済みのstep_number（後着で計上を取り消すため）
      this._stats = {
        completedSteps: 0,   // 3点セットが揃って emit できた歩
        incompleteSteps: 0,  // 一部のサブパケットだけ届いて回復不能になった歩（BLE欠損の疑い）
        missingParts: { overview: 0, stride: 0, pronation: 0 }, // incomplete時に欠けていた種類の内訳
        gapSteps: 0,         // 1サブパケットも届かなかった歩（FW未送信 or 全パケット欠損の疑い）
        jumps: 0,            // 採番リセット/大ジャンプ（resetAnalysisLogs・FW再起動など）の回数
      };
      this.onStepLoss = null; // (info) 回復不能と判定した歩の通知（OrpheInsoleGaitが配線）
    }

    /** 損失統計のsnapshot（診断用・読み取り専用） */
    stats() {
      return {
        ...this._stats,
        missingParts: { ...this._stats.missingParts },
        lastSeenStep: this._lastSeenStep,
        pendingSteps: this._pending.size,
      };
    }

    add(packet) {
      const step = packet.step_number;
      if (this._emitted.has(step)) return null; // 既出（2回目の送信）は無視

      // gap計上済みの歩が遅れて届いた場合は計上を取り消す（以降は通常の集約に乗る）
      if (this._missedSteps.delete(step)) {
        this._stats.gapSteps = Math.max(0, this._stats.gapSteps - 1);
      }

      const isNewStep = !this._pending.has(step);
      let parts = this._pending.get(step);
      if (!parts) { parts = {}; this._pending.set(step, parts); }
      parts[packet.type] = packet;

      if (isNewStep) this._noteStepSeen(step);

      let row = null;
      if (parts.overview && parts.stride && parts.pronation) {
        row = buildGaitRow(step, parts);
        this._pending.delete(step);
        this._markEmitted(step);
        this._stats.completedSteps++;
      }
      this._evictStalePending();
      this._evictOldPending();
      return row;
    }

    // step_number の前進から「1サブパケットも届かなかった歩（gap）」を検出する。
    // 前進が GAP_COUNT_LIMIT を超える場合は欠損ではなく採番リセット/ジャンプとして扱う
    // （resetAnalysisLogs や FW 再起動で step_number は巻き戻る）。
    _noteStepSeen(step) {
      if (this._lastSeenStep === null) { this._lastSeenStep = step; return; }
      const forward = stepDistance(this._lastSeenStep, step);
      if (forward === 0) return;
      if (forward > GAP_COUNT_LIMIT) {
        const backward = stepDistance(step, this._lastSeenStep);
        if (backward <= GAP_COUNT_LIMIT) return; // 既知stepの少し後ろへの後着。lastSeenは動かさない
        this._stats.jumps++;
        const from = this._lastSeenStep;
        this._lastSeenStep = step;
        this._notifyLoss({ reason: 'step_number_jump', from, to: step, forward });
        return;
      }
      if (forward > 1) {
        const missed = [];
        for (let i = 1; i < forward; i++) {
          const missedStep = (this._lastSeenStep + i) % 0x10000;
          if (this._pending.has(missedStep) || this._emitted.has(missedStep)) continue;
          missed.push(missedStep);
          this._missedSteps.add(missedStep);
          while (this._missedSteps.size > MISSED_STEP_MEMORY) {
            this._missedSteps.delete(this._missedSteps.values().next().value);
          }
        }
        if (missed.length > 0) {
          this._stats.gapSteps += missed.length;
          this._notifyLoss({ reason: 'gap', steps: missed, count: missed.length });
        }
      }
      this._lastSeenStep = step;
    }

    // 最新stepより STALE_STEP_DISTANCE 以上古い pending はサブパケットの再送が
    // とうに終わっているため、回復不能（incomplete）として計上して捨てる。
    _evictStalePending() {
      if (this._lastSeenStep === null) return;
      for (const [step, parts] of this._pending) {
        const behind = stepDistance(step, this._lastSeenStep);
        if (behind >= STALE_STEP_DISTANCE) {
          this._pending.delete(step);
          this._countIncomplete(step, parts);
        }
      }
    }

    _countIncomplete(step, parts) {
      this._stats.incompleteSteps++;
      const missing = [];
      for (const type of ['overview', 'stride', 'pronation']) {
        if (!parts[type]) {
          this._stats.missingParts[type]++;
          missing.push(type);
        }
      }
      this._notifyLoss({ reason: 'incomplete', step_number: step, missing });
    }

    _notifyLoss(info) {
      if (typeof this.onStepLoss !== 'function') return;
      try { this.onStepLoss(info); } catch (_) { /* コールバック例外で集約を止めない */ }
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
        const oldest = this._pending.keys().next().value;
        const parts = this._pending.get(oldest);
        this._pending.delete(oldest);
        this._countIncomplete(oldest, parts);
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
      this._attachAggregatorHooks();
      this._running = false;       // ユーザが「計測ON」を望む状態（切断中も維持）
      this._subscribed = false;    // 実際に STEP_ANALYSIS を購読中か
      this._startPromise = null;   // 進行中の start()（直列化用）
      this._stopPromise = null;    // 進行中の stop()（直列化用）
      this._refreshPromise = null; // FIFO read-mode切替後の再購読（集約済みrowは維持）
      this._subscribePromise = null; // 現在の接続世代で進行中の購読処理
      this._currentSubscribeAttempt = null; // { connectionGeneration, lifecycleGeneration, sink, promise }
      this._lifecycleGeneration = 0; // stop→start をまたぐ古い Promise を識別
      this._connectionGeneration = 0; // 物理切断ごとに更新し、古い GATT の完了を識別
      this._sinkFn = null;         // 現在の接続世代で設定した _gaitNotifySink
      this._reconnectHook = null;  // 再接続後に再購読するフック
      this._disconnectDevice = null; // STEP_ANALYSIS 購読状態を無効化する切断監視先
      this._disconnectHandler = () => this._onPhysicalDisconnect();
      this._transportNotifications = 0; // characteristicvaluechanged の到着数（decode前）
      this._validPackets = 0;           // header/length/subheader が有効な packet 数
      this._invalidPackets = 0;         // transport は来たが decode できなかった packet 数
      this._lastTransportAt = null;
      this._lastValidPacketAt = null;
      this._lastTransport = null;
      this._packetWaiters = new Set();
      this._reportedInvalidSignatures = new Set();

      // コールバック（ユーザが上書き）
      this.onGait = null;     // (deviceId, row) 1歩ごとの歩容パラメーター（overview+stride+pronation 集約後）
      this.onMotion = null;   // (deviceId, motion) motion（クォータニオン・微小変位・歩行サイクル、〜50Hz）
      this.onRaw = null;      // (deviceId, packet) デコード済みの全パケット
      this.onTransport = null; // (deviceId, info) decode前後のtransport診断
      this.onDiagnostic = null; // (deviceId, info) 購読・初回packet・timeout等の低頻度イベント
      this.onStepLoss = null; // (deviceId, info) 回復不能と判定した歩の通知（incomplete/gap/jump）
      this.onError = null;    // (error)
    }

    get deviceId() { return this.insole ? this.insole.id : 0; }
    get stepCount() { return this.rows.length; }
    get isRunning() { return this._running; }

    /**
     * STEP_ANALYSIS transport の観測状態を返す。
     * startNotifications() 成功と実データ到着を分けて診断するための読み取り専用snapshot。
     */
    diagnostics() {
      return {
        running: this._running,
        subscribed: this._subscribed,
        transportNotifications: this._transportNotifications,
        validPackets: this._validPackets,
        invalidPackets: this._invalidPackets,
        lastTransportAt: this._lastTransportAt,
        lastValidPacketAt: this._lastValidPacketAt,
        lastTransport: this._lastTransport ? { ...this._lastTransport } : null,
        connectionGeneration: this._connectionGeneration,
        lifecycleGeneration: this._lifecycleGeneration,
        // step単位の損失統計。incompleteSteps は一部サブパケットのみ到着（BLE欠損の疑い）、
        // gapSteps は1つも到着しなかった歩（FW未送信 or 全欠損）、jumps は採番リセット。
        stepLoss: this.aggregator.stats(),
      };
    }

    /**
     * 指定時点より後の有効packetを待つ。Toolkitが「購読開始＝受信成功」と誤認しないために使う。
     * @param {{afterCount?:number,timeoutMs?:number}} [options]
     * @returns {Promise<boolean>} timeout前に有効packetが到着したらtrue
     */
    waitForPacket(options = {}) {
      const afterCount = Number.isFinite(Number(options.afterCount))
        ? Number(options.afterCount)
        : this._validPackets;
      const timeoutMs = Number.isFinite(Number(options.timeoutMs))
        ? Math.max(0, Number(options.timeoutMs))
        : 1200;
      if (this._validPackets > afterCount) return Promise.resolve(true);
      if (!this._running || !this._subscribed || timeoutMs === 0) return Promise.resolve(false);
      return new Promise((resolve) => {
        const waiter = { afterCount, resolve, timer: null };
        waiter.timer = setTimeout(() => {
          if (!this._packetWaiters.delete(waiter)) return;
          this._emitDiagnostic('packet-timeout', { afterCount, timeoutMs });
          resolve(false);
        }, timeoutMs);
        this._packetWaiters.add(waiter);
        // listener登録直前にpacketが到着した競合を閉じる。
        if (this._validPackets > afterCount) this._resolvePacketWaiters(true);
      });
    }

    /**
     * 歩容解析の notify を開始する。SENSOR_VALUES は begin() 済み（アクティブ状態）であること。
     * start()/stop() は直列化され、交錯しても最終状態が確定する。
     * @returns {Promise<boolean>} 開始できたら true
     */
    async start() {
      // 直前の stop() が進行中なら完了を待つ（stop の finally が新しい sink を消す競合を防ぐ）
      if (this._stopPromise) { try { await this._stopPromise; } catch { /* noop */ } }
      if (this._startPromise) return this._startPromise;
      const pendingCleanups = this.insole && this.insole._gaitNotifyCleanupPromises;
      const pendingSubscriptions = this.insole && this.insole._gaitNotifyPendingSubscriptions;
      // reconnect hook が開始した自分自身の現 attempt には合流できる。それ以外の
      // 未完了 start は、stop 後も transport 側で生きているため完了まで restart しない。
      const hasBlockingSubscription = pendingSubscriptions && Array.from(pendingSubscriptions)
        .some((attempt) => attempt !== this._currentSubscribeAttempt);
      if ((pendingCleanups && pendingCleanups.size > 0) || hasBlockingSubscription) {
        const error = new Error('OrpheInsoleGait.start(): previous notification transition is still pending');
        error.code = 'GAIT_TRANSITION_PENDING';
        this._reportError(error);
        return false;
      }
      const promise = this._doStart();
      this._startPromise = promise;
      try { return await promise; } finally {
        if (this._startPromise === promise) this._startPromise = null;
      }
    }

    async _doStart() {
      if (!this._canStart()) return false;
      if (!this._claimOwner()) return false;
      const continuing = this._running;
      if (!continuing) {
        this.aggregator = new GaitAggregator();
        this._attachAggregatorHooks();
        this.rows = [];
        this._lifecycleGeneration++;
      }
      const lifecycleGeneration = this._lifecycleGeneration;
      const connectionGeneration = this._connectionGeneration;
      this._running = true;           // 望む状態を先に確定（実購読は _requestSubscribe で）
      this._installReconnectHook();   // 再接続後に STEP_ANALYSIS を1回だけ再購読する
      this._installDisconnectHook();  // 手動再接続でも _subscribed=false を検知できるようにする
      if (this._subscribed) return true;
      const ok = await this._requestSubscribe(lifecycleGeneration);
      // 古い接続/ライフサイクルの失敗で、新しい再接続・restart要求を巻き戻さない。
      const stillSameRequest = lifecycleGeneration === this._lifecycleGeneration &&
        connectionGeneration === this._connectionGeneration;
      if (!ok && !continuing && stillSameRequest && !this._subscribed) {
        this._running = false;
        this._removeReconnectHook();
        this._removeDisconnectHook();
        this._clearSink();
        this._releaseOwner();
      }
      return ok;
    }

    /**
     * 現在のSTEP_ANALYSIS通知をいったん停止して再購読する。
     * FIFO read-mode切替でFW側の通知が止まった場合に使い、aggregator/rowsは維持する。
     * @returns {Promise<boolean>} 再購読できたら true
     */
    async refreshSubscription() {
      if (this._refreshPromise) return this._refreshPromise;
      const promise = this._doRefreshSubscription();
      this._refreshPromise = promise;
      try { return await promise; } finally {
        if (this._refreshPromise === promise) this._refreshPromise = null;
      }
    }

    async _doRefreshSubscription() {
      if (!this._running) return false;
      if (this._stopPromise) { try { await this._stopPromise; } catch { /* noop */ } }
      if (!this._running || !this._canStart() || this.insole._gaitNotifyOwner !== this) return false;
      if (this._startPromise) { try { await this._startPromise; } catch { /* noop */ } }
      if (this._subscribePromise) { try { await this._subscribePromise; } catch { /* noop */ } }

      const lifecycleGeneration = this._lifecycleGeneration;
      const connectionGeneration = this._connectionGeneration;
      const wasSubscribed = this._subscribed;
      this._subscribed = false;
      this._subscribePromise = null;
      this._currentSubscribeAttempt = null;
      this._clearSink();

      try {
        if (wasSubscribed && this.insole.isConnected && this.insole.isConnected()) {
          await this.insole.stopNotify('STEP_ANALYSIS');
        }
      } catch (error) {
        this._reportError(error);
      }

      if (!this._running ||
        lifecycleGeneration !== this._lifecycleGeneration ||
        connectionGeneration !== this._connectionGeneration ||
        this.insole._gaitNotifyOwner !== this) return false;
      return this._requestSubscribe(lifecycleGeneration);
    }

    _canStart() {
      if (this.insole && this.insole.isConnected && this.insole.isConnected()) return true;
      this._reportError(new Error('OrpheInsoleGait.start(): insole is not connected'));
      return false;
    }

    // STEP_ANALYSIS は1 characteristic / 1 sink なので、同一 insole の active Gait は1つに限定する。
    // 壊れた「複数running」状態を許すより、開始時に明示的に失敗させる方が後方互換上も安全。
    _claimOwner() {
      if (!this.insole) return false;
      const owner = this.insole._gaitNotifyOwner;
      if (owner && owner !== this) {
        // owner の stopNotify が進行中でも奪わない。owner 自身の finally だけが解放できる。
        const error = new Error('OrpheInsoleGait.start(): another gait instance is already active for this insole');
        error.code = 'GAIT_ALREADY_ACTIVE';
        this._reportError(error);
        return false;
      }
      this.insole._gaitNotifyOwner = this;
      return true;
    }

    _releaseOwner() {
      if (this.insole && this.insole._gaitNotifyOwner === this) {
        delete this.insole._gaitNotifyOwner;
      }
    }

    /** 初回・再接続の subscribe を1本にまとめ、同じ characteristic への二重 startNotify を防ぐ。 */
    _requestSubscribe(lifecycleGeneration = this._lifecycleGeneration) {
      const connectionGeneration = this._connectionGeneration;
      const current = this._currentSubscribeAttempt;
      if (current && current.connectionGeneration === connectionGeneration &&
        current.lifecycleGeneration === lifecycleGeneration) {
        return current.promise;
      }

      const attempt = {
        gait: this,
        connectionGeneration,
        lifecycleGeneration,
        sink: (dv) => this._onPacket(dv),
        promise: null,
      };
      const pendingSubscriptions = this.insole._gaitNotifyPendingSubscriptions || new Set();
      this.insole._gaitNotifyPendingSubscriptions = pendingSubscriptions;
      pendingSubscriptions.add(attempt);
      this._currentSubscribeAttempt = attempt;
      this._sinkFn = attempt.sink;
      const promise = this._subscribe(attempt);
      attempt.promise = promise;
      this._subscribePromise = promise;
      const cleanup = () => {
        pendingSubscriptions.delete(attempt);
        if (pendingSubscriptions.size === 0 &&
          this.insole._gaitNotifyPendingSubscriptions === pendingSubscriptions) {
          delete this.insole._gaitNotifyPendingSubscriptions;
        }
        if (this._currentSubscribeAttempt === attempt) {
          this._currentSubscribeAttempt = null;
          this._subscribePromise = null;
        }
      };
      promise.then(cleanup, cleanup);
      return promise;
    }

    /** STEP_ANALYSIS を購読する（初回・再接続共通）。成功で true。 */
    async _subscribe(attempt) {
      try {
        const service = this.options.serviceUUID || this.insole.ORPHE_OTHER_SERVICE;
        const characteristic = this.options.characteristicUUID || this.insole.ORPHE_STEP_ANALYSIS || STEP_ANALYSIS_CHAR_UUID;
        // notify をこのモジュールの sink へ横取り（core SDK の onRead が STEP_ANALYSIS で呼ぶ）
        this.insole._gaitNotifySink = attempt.sink;
        this.insole.setUUID('STEP_ANALYSIS', service, characteristic);
        await this.insole.startNotify('STEP_ANALYSIS');
        const attemptIsCurrent = this._currentSubscribeAttempt === attempt;
        const stillCurrent = this._running &&
          attempt.lifecycleGeneration === this._lifecycleGeneration &&
          attempt.connectionGeneration === this._connectionGeneration &&
          this.insole._gaitNotifyOwner === this && attemptIsCurrent;
        // stop() は pending startNotify を待たずに戻る。遅れて購読が成功した場合は、
        // 停止済みの desired state に合わせてここで補償停止し、notify を残さない。
        if (!stillCurrent) {
          if (attemptIsCurrent) this._subscribed = false;
          this._clearSink(attempt.sink);
          const owner = this.insole._gaitNotifyOwner;
          const newerAttempt = this._currentSubscribeAttempt && this._currentSubscribeAttempt !== attempt &&
            this._currentSubscribeAttempt.connectionGeneration === attempt.connectionGeneration;
          // 別の接続世代や新しいowner/attemptを止めない。同じ世代に後継が無い場合だけ補償停止する。
          if (attempt.connectionGeneration === this._connectionGeneration && !newerAttempt &&
            (!owner || owner === this) && !this._subscribed && this.insole.isConnected && this.insole.isConnected()) {
            const cleanups = this.insole._gaitNotifyCleanupPromises || new Set();
            this.insole._gaitNotifyCleanupPromises = cleanups;
            const cleanupPromise = Promise.resolve().then(() => this.insole.stopNotify('STEP_ANALYSIS'));
            cleanups.add(cleanupPromise);
            try {
              await cleanupPromise;
            } finally {
              cleanups.delete(cleanupPromise);
              if (cleanups.size === 0 && this.insole._gaitNotifyCleanupPromises === cleanups) {
                delete this.insole._gaitNotifyCleanupPromises;
              }
            }
          }
          return false;
        }
        this._subscribed = true;
        this._emitDiagnostic('subscription-started');
        return true;
      } catch (e) {
        const attemptIsCurrent = this._currentSubscribeAttempt === attempt;
        if (attemptIsCurrent) this._subscribed = false;
        this._clearSink(attempt.sink);
        // ユーザが stop() した後の遅延失敗は期待されたキャンセル結果なので報告しない。
        if (this._running && attemptIsCurrent &&
          attempt.lifecycleGeneration === this._lifecycleGeneration &&
          attempt.connectionGeneration === this._connectionGeneration) this._reportError(e);
        return false;
      }
    }

    /** 歩容解析の notify を停止する。start()/stop() の交錯でも安全に停止する。 */
    async stop() {
      if (this._stopPromise) return this._stopPromise; // 進行中の stop に合流
      // desired state と callback sink は同期的に停止する。startNotify がハングしても stop() を塞がない。
      const owned = this.insole && this.insole._gaitNotifyOwner === this;
      const needsStop = this._running || this._subscribed || this._subscribePromise || owned;
      const shouldStopNotify = this._subscribed && owned;
      this._running = false;
      this._lifecycleGeneration++;
      this._subscribed = false;
      this._startPromise = null;       // 古い start の finally は identity check で新しい start を消さない
      this._refreshPromise = null;
      this._subscribePromise = null;   // 古い購読は継続するが、新しい lifecycle/接続を塞がない
      this._currentSubscribeAttempt = null;
      this._removeReconnectHook();
      this._removeDisconnectHook();
      this._clearSink();
      this._resolvePacketWaiters(false);
      if (!needsStop) return;
      const promise = this._doStop(shouldStopNotify);
      this._stopPromise = promise;
      try { return await promise; } finally {
        if (this._stopPromise === promise) this._stopPromise = null;
      }
    }

    async _doStop(shouldStopNotify) {
      try {
        if (shouldStopNotify && this.insole.isConnected && this.insole.isConnected()) {
          await this.insole.stopNotify('STEP_ANALYSIS');
        }
      } catch { /* noop */ } finally {
        this._subscribed = false;
        this._clearSink();
        if (!this._running) this._releaseOwner();
      }
    }

    // 自分が設定した sink のみ削除する（複数 Gait インスタンスが単一の _gaitNotifySink を奪い合わないため）。
    _clearSink(expectedSink = this._sinkFn) {
      if (this.insole && this.insole._gaitNotifySink === expectedSink) {
        delete this.insole._gaitNotifySink;
      }
      if (this._sinkFn === expectedSink) this._sinkFn = null;
    }

    // Core の再接続成功後に STEP_ANALYSIS を再購読するフックを登録する（既存の on* callback は壊さない）。
    _installReconnectHook() {
      if (this._reconnectHook || !this.insole) return;
      this._reconnectHook = () => {
        this._onReconnected().catch((e) => this._reportError(e));
      };
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
    async _onReconnected() {
      // 同じ成功通知が重複しても、現接続ですでに購読済みなら何もしない。
      // 実際の物理切断では _disconnectHandler が先に _subscribed=false にする。
      if (!this._running || this._subscribed) return;
      this._installDisconnectHook();
      // 古い接続世代の未完了 Promise は待たない。現在世代の購読だけを共有する。
      await this._requestSubscribe(this._lifecycleGeneration);
    }

    _onPhysicalDisconnect() {
      this._connectionGeneration++;
      if (this.insole && this.insole._gaitNotifyCleanupPromises) {
        // 旧GATTを対象にしたcleanupは新接続を塞がない。Core側のoperation tokenで古い完了も隔離される。
        this.insole._gaitNotifyCleanupPromises.clear();
        delete this.insole._gaitNotifyCleanupPromises;
      }
      if (this.insole && this.insole._gaitNotifyPendingSubscriptions) {
        this.insole._gaitNotifyPendingSubscriptions.clear();
        delete this.insole._gaitNotifyPendingSubscriptions;
      }
      this._subscribed = false;
      this._startPromise = null;
      this._subscribePromise = null;
      this._currentSubscribeAttempt = null;
      this._clearSink();
      this._resolvePacketWaiters(false);
      this._emitDiagnostic('physical-disconnect');
    }

    // Core の公開 onDisconnect を上書きせず、BluetoothDevice の切断イベントで購読状態だけ無効化する。
    // これにより自動再接続以外の begin() 後も、gait.start() を再度呼べば安全に再購読できる。
    _installDisconnectHook() {
      const device = this.insole && this.insole.bluetoothDevice;
      if (!device || !device.addEventListener || this._disconnectDevice === device) return;
      this._removeDisconnectHook();
      this._disconnectDevice = device;
      device.addEventListener('gattserverdisconnected', this._disconnectHandler);
    }

    _removeDisconnectHook() {
      if (this._disconnectDevice && this._disconnectDevice.removeEventListener) {
        try { this._disconnectDevice.removeEventListener('gattserverdisconnected', this._disconnectHandler); } catch { /* noop */ }
      }
      this._disconnectDevice = null;
    }

    _onPacket(dv) {
      const receivedAt = Date.now();
      const byteLength = Number(dv && dv.byteLength) || 0;
      const header = byteLength > 0 ? dv.getUint8(0) : null;
      const subheader = byteLength > 1 ? dv.getUint8(1) : null;
      this._transportNotifications++;
      this._lastTransportAt = receivedAt;
      let packet = null;
      try {
        packet = decodeAnalysisPacket(dv);
      } catch (error) {
        this._reportError(error);
      }
      const info = {
        receivedAt,
        byteLength,
        header,
        subheader,
        valid: !!packet,
        transportNotifications: this._transportNotifications,
        validPackets: this._validPackets + (packet ? 1 : 0),
        invalidPackets: this._invalidPackets + (packet ? 0 : 1),
      };
      this._lastTransport = info;
      if (typeof this.onTransport === 'function') {
        this._safe(() => this.onTransport(this.deviceId, { ...info }));
      }
      if (!packet) {
        this._invalidPackets++;
        const signature = `${byteLength}:${header}:${subheader}`;
        if (!this._reportedInvalidSignatures.has(signature)) {
          this._reportedInvalidSignatures.add(signature);
          this._emitDiagnostic('invalid-packet', { byteLength, header, subheader });
        }
        return;
      }
      this._validPackets++;
      this._lastValidPacketAt = receivedAt;
      if (this._validPackets === 1) {
        this._emitDiagnostic('first-valid-packet', {
          byteLength,
          header,
          subheader,
          packetType: packet.type,
        });
      }
      this._resolvePacketWaiters(true);
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
    // aggregator の損失通知を onStepLoss / onDiagnostic('step-loss') に配線する。
    // aggregator は start() でリセット時に作り直されるため、そのたびに呼ぶ。
    _attachAggregatorHooks() {
      this.aggregator.onStepLoss = (info) => {
        if (typeof this.onStepLoss === 'function') {
          this._safe(() => this.onStepLoss(this.deviceId, { ...info }));
        }
        this._emitDiagnostic('step-loss', info);
      };
    }

    _resolvePacketWaiters(packetArrived) {
      for (const waiter of Array.from(this._packetWaiters)) {
        if (packetArrived && this._validPackets <= waiter.afterCount) continue;
        this._packetWaiters.delete(waiter);
        if (waiter.timer) clearTimeout(waiter.timer);
        waiter.resolve(!!packetArrived);
      }
    }

    _emitDiagnostic(type, detail = {}) {
      if (typeof this.onDiagnostic !== 'function') return;
      const info = {
        type,
        ...detail,
        diagnostics: this.diagnostics(),
      };
      this._safe(() => this.onDiagnostic(this.deviceId, info));
    }

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
  OrpheInsoleGait.stepDistance = stepDistance;
  OrpheInsoleGait.STALE_STEP_DISTANCE = STALE_STEP_DISTANCE;
  OrpheInsoleGait.GAP_COUNT_LIMIT = GAP_COUNT_LIMIT;

  if (typeof global.OrpheInsoleGait === 'undefined') {
    global.OrpheInsoleGait = OrpheInsoleGait;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrpheInsoleGait;
  }

})(typeof globalThis !== 'undefined' ? globalThis : this);
