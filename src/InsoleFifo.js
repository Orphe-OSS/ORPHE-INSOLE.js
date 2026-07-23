/**
 * ORPHE INSOLE FIFO — ロスレス（欠損なし）センサーデータ収集（opt-in）
 *
 * リアルタイムストリーミング（begin() → gotPress 等）は BLE の取りこぼしで
 * パケットが欠落しうる。これに対し FIFO 収集は、ファームウェアのリングバッファに
 * 蓄積されたサンプルを「シリアル番号を指定して取り出す」プル型プロトコルで回収し、
 * 通信で落ちたぶんは次のポーリングで再要求することで欠損なくデータを集める。
 *
 * Python 参照実装 `insole_client/commands/read_sensor_data_by_tokoroten_loop.py`
 * と `read_sensor_data_ble_commands.py` の忠実な移植（内部的には単なる FIFO キュー
 * なので名前は fifo に統一）。
 *
 * BLE プロトコル（コマンドは DEVICE_INFORMATION に write、応答は SENSOR_VALUES notify）:
 *   [0x0D, mode]                      読み取りモード変更（0x02 = FIFO）
 *   [0x0B, 0x01]                      現在シリアル取得 → 0x35 0x01 serial(2) watermark(1) accumulated(2)
 *   [0x0B, 0x02, <30×(sMSB,sLSB,cMSB,cLSB)>]  データ範囲要求（30組までpad）
 *   [0x0B, 0x03] / 0x04 / 0x06        全消去 / モニタ開始 / モニタ停止（ACK: 0x35 0x03/04/06）
 *   no-data 応答:  0x35 0x02 start(2) count(2)
 *   データパケット: 0x36 serial(2) ts(5) + 4×24B(gyro3,acc3,press6) = 104 bytes
 *
 * コアSDK（ORPHE-INSOLE.js）とは疎結合で、純粋関数群は Node 単体でもテストできる。
 * ブラウザでは begin() で接続済みの OrpheInsole を渡して使う（examples/showcase 参照）。
 *
 * 注意: FIFO モードはジャイロ・加速度・6ch圧力のみでクォータニオンを含まない。
 */
(function (global) {

  // ── 定数 ───────────────────────────────────────────────────────────
  const UINT16_MAX = 65536;
  const READ_MODE_FIFO = 0x02;

  const OP_INFO = 0x0B;           // FIFO コマンド系（get serial / get data / delete / monitor）
  const OP_READ_MODE = 0x0D;      // 読み取りモード変更
  const SUB_GET_SERIAL = 0x01;
  const SUB_GET_DATA = 0x02;
  const SUB_DELETE_ALL = 0x03;
  const SUB_START_MONITOR = 0x04;
  const SUB_STOP_MONITOR = 0x06;

  const RESP_STATUS = 0x35;       // コマンド応答/no-data のヘッダ
  const RESP_DATA = 0x36;         // センサーデータパケットのヘッダ
  const RESP_NO_DATA_SUB = 0x02;

  const RE_REQUEST_DATA_NUM = 30;                    // 1要求に載る (start,count) 組の最大数
  const MAX_DATA_NUMBER_REQUESTED_AT_ONCE = 200;
  const ONE_SHOT_TIMEOUT_MS = 5000;                  // 200件/60per s ≒ 3.3s + 余裕
  const MAX_CARRY_OVER_SERIALS = 100;                // carryOver 上限（安全弁）
  const RING_BUFFER_CAPACITY = 1500;                 // FW リングバッファ余裕上限
  const POLLING_INTERVAL_MS = 200;
  const CURRENT_SERIAL_TIMEOUT_MS = 50;
  const ONE_SHOT_IDLE_TIMEOUT_MS = 400;              // バースト受信中に許容する無音（超えたら「このバーストは終わり」と判断）
  const DEFAULT_DRAIN_TIMEOUT_MS = 3000;             // stop() 後の回収フェーズ（drain）の既定タイムアウト（0 で無効＝従来動作）
  const NOTIFY_DATA_NUM = 4;                         // 1パケット内のフレーム数
  const NOTIFY_DATA_SIZE = 24;                       // 1フレームのバイト数
  const DATA_PACKET_BYTE_LENGTH = 104;

  const CSV_HEADER =
    'serial_number,timestamp,' +
    'gyro_x[dps],gyro_y[dps],gyro_z[dps],' +
    'acc_x[G],acc_y[G],acc_z[G],' +
    'press1[N],press2[N],press3[N],press4[N],press5[N],press6[N]';

  // ── 単位変換（read_sensor_data_unit_converter.py の移植） ────────────
  function binToInt(msb, lsb) {
    let v = (msb << 8) + lsb;
    if (v >= 0x8000) v -= 0x10000;
    return v;
  }

  function accToG(msb, lsb) { return binToInt(msb, lsb) / 32768.0 * 16.0; }
  function gyroToDps(msb, lsb) { return binToInt(msb, lsb) / 32768.0 * 2000.0; }

  // 圧力生値(ADC uint16) → N（参照実装の固定校正多項式。n は 1..6）
  function pressureToN(x, n) {
    let y;
    switch (n) {
      case 1: y = 6.31278e-11 * x ** 4 - 2.33093e-07 * x ** 3 + 3.27825e-04 * x ** 2 - 1.63373e-01 * x + 2.25012e01; break;
      case 2: y = 6.65168e-11 * x ** 4 - 2.10741e-07 * x ** 3 + 2.31937e-04 * x ** 2 - 7.10366e-02 * x + 6.97927e00; break;
      case 3: y = 1.07646e-10 * x ** 4 - 3.85112e-07 * x ** 3 + 5.02384e-04 * x ** 2 - 2.37328e-01 * x + 3.18015e01; break;
      case 4: y = 5.91156e-11 * x ** 4 - 1.81045e-07 * x ** 3 + 1.86644e-04 * x ** 2 - 4.46178e-02 * x + 3.10811e00; break;
      case 5: y = 5.32573e-11 * x ** 4 - 1.68515e-07 * x ** 3 + 1.79518e-04 * x ** 2 - 4.66859e-02 * x + 3.71484e00; break;
      case 6: y = 4.44324e-11 * x ** 4 - 1.09728e-07 * x ** 3 + 8.90389e-05 * x ** 2 + 3.82816e-03 * x - 4.46580e00; break;
      default: y = 0;
    }
    return y < 0 ? 0 : y;
  }

  // ── シリアル番号ユーティリティ ───────────────────────────────────────
  // start_exclusive の次から end_inclusive まで進んだ個数（wrap-around対応）
  function serialDistance(startExclusive, endInclusive) {
    return ((endInclusive - startExclusive) % UINT16_MAX + UINT16_MAX) % UINT16_MAX;
  }

  function calcExpectedSerials(startSerial, requestSize) {
    const out = [];
    for (let i = 0; i < requestSize; i++) out.push((startSerial + i) % UINT16_MAX);
    return out;
  }

  // (start,count) の配列を要求順の serial 配列に展開
  function expandRequestsToList(reqs) {
    const out = [];
    for (const [start, count] of reqs) {
      for (let i = 0; i < count; i++) out.push((start + i) % UINT16_MAX);
    }
    return out;
  }

  // 欠損シリアルの集合を連番の塊にまとめる 例: {10,12,40,41,42} -> [[10,1],[12,1],[40,3]]
  function buildRequestsFromSerials(serials) {
    const sorted = Array.from(serials).sort((a, b) => a - b);
    if (sorted.length === 0) return [];
    const out = [];
    let runStart = sorted[0];
    let runLen = 1;
    let prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const sn = sorted[i];
      if (sn === (prev + 1) % UINT16_MAX) {
        runLen += 1;
      } else {
        out.push([runStart, runLen]);
        runStart = sn;
        runLen = 1;
      }
      prev = sn;
    }
    out.push([runStart, runLen]);
    return out;
  }

  // データ要求パケット [0x0B,0x02, 30組...] を作成（30組に満たない分は 0 埋め）
  // FW は固定 30 スロット(2 + 30×4 = 122 bytes)前提で読むため、超過は不正パケットになる。
  function createGetSensorDataRequest(pairs) {
    if (pairs.length > RE_REQUEST_DATA_NUM) {
      throw new RangeError(`createGetSensorDataRequest: too many ranges (${pairs.length} > ${RE_REQUEST_DATA_NUM})`);
    }
    const req = [OP_INFO, SUB_GET_DATA];
    for (const [serial, count] of pairs) {
      req.push((serial >> 8) & 0xFF, serial & 0xFF, (count >> 8) & 0xFF, count & 0xFF);
    }
    for (let i = 0; i < RE_REQUEST_DATA_NUM - pairs.length; i++) req.push(0, 0, 0, 0);
    return Uint8Array.from(req);
  }

  // ── 応答パースヘルパ（DataView を受け取る） ──────────────────────────
  // no-data 応答 (0x35 0x02 start(2) count(2)) → [start, count] または null
  function parseNoDataResponse(dv) {
    if (dv.byteLength < 2 || dv.getUint8(0) !== RESP_STATUS || dv.getUint8(1) !== RESP_NO_DATA_SUB) return null;
    const start = dv.byteLength >= 4 ? dv.getUint16(2) : 0;
    const count = dv.byteLength >= 6 ? dv.getUint16(4) : 0;
    return [start, count];
  }

  // データパケットならシリアル番号、そうでなければ null
  function extractSerialIfSensorPacket(dv) {
    if (dv.byteLength < 3 || dv.getUint8(0) !== RESP_DATA) return null;
    return dv.getUint16(1);
  }

  // 現在シリアル応答 → {serial, watermark, accumulated} または null
  function parseCurrentSerial(dv) {
    if (dv.byteLength < 7 || dv.getUint8(0) !== RESP_STATUS || dv.getUint8(1) !== SUB_GET_SERIAL) return null;
    return {
      serial: dv.getUint16(2),
      watermark: dv.getUint8(4),
      accumulated: dv.getUint16(5),
    };
  }

  // ── タイムスタンプ ───────────────────────────────────────────────────
  function pad2(n) { return String(n).padStart(2, '0'); }
  function pad3(n) { return String(n).padStart(3, '0'); }

  // HH:MM:SS:mmm 形式（read_sensor_data_ble_commands.py::timestamp_to_str の移植）
  function timestampToStr(hour, minute, second, ms, offsetMs) {
    ms += offsetMs || 0;
    while (ms >= 1000) { ms -= 1000; second += 1; }
    while (second >= 60) { second -= 60; minute += 1; }
    while (minute >= 60) { minute -= 60; hour += 1; }
    while (hour >= 24) { hour -= 24; }
    return `${pad2(hour)}:${pad2(minute)}:${pad2(second)}:${pad3(ms)}`;
  }

  // パケット基準タイムスタンプ（ms）。ソート用（wrap-around に依存しない）
  function extractTimestampMs(dv) {
    const h = dv.getUint8(3);
    const m = dv.getUint8(4);
    const s = dv.getUint8(5);
    const ms = dv.getUint16(6);
    return ((h * 3600 + m * 60 + s) * 1000) + ms;
  }

  // ── パケットデコード ──────────────────────────────────────────────────
  // 1フレーム(24B: gyro3+acc3+press6)を物理値へ変換。decode/CSV で共用しバイト配置を一元化。
  // gyro[dps]×3, acc[G]×3, press[ADC uint16]×6 を返す。
  function readFrame(dv, i) {
    const o = i * NOTIFY_DATA_SIZE + 8;
    return {
      gyro: [gyroToDps(dv.getUint8(o), dv.getUint8(o + 1)), gyroToDps(dv.getUint8(o + 2), dv.getUint8(o + 3)), gyroToDps(dv.getUint8(o + 4), dv.getUint8(o + 5))],
      acc: [accToG(dv.getUint8(o + 6), dv.getUint8(o + 7)), accToG(dv.getUint8(o + 8), dv.getUint8(o + 9)), accToG(dv.getUint8(o + 10), dv.getUint8(o + 11))],
      press: [dv.getUint16(o + 12), dv.getUint16(o + 14), dv.getUint16(o + 16), dv.getUint16(o + 18), dv.getUint16(o + 20), dv.getUint16(o + 22)],
    };
  }

  // 1データパケット(0x36) → 4フレームのサンプル配列（ライブ可視化用）。
  // フレームは古い順（i=3 が基準、以降 +5ms）。出力もその順。
  function decodePacket(dv) {
    const serial = dv.getUint16(1);
    const baseMs = extractTimestampMs(dv);
    const samples = [];
    for (let i = NOTIFY_DATA_NUM - 1; i >= 0; i--) {
      const packet_number = (NOTIFY_DATA_NUM - 1) - i;
      const f = readFrame(dv, i);
      samples.push({
        serial_number: serial,
        packet_number,
        t: baseMs + packet_number * 5,
        converted_gyro: { x: f.gyro[0], y: f.gyro[1], z: f.gyro[2] },
        converted_acc: { x: f.acc[0], y: f.acc[1], z: f.acc[2] },
        press: { values: f.press, serial_number: serial, packet_number },
      });
    }
    return { serial, timestamp: baseMs, samples };
  }

  function f2(v) { return v.toFixed(2).padStart(8); }
  function f4(v) { return v.toFixed(4).padStart(8); }

  // 1データパケット → CSV 4行（参照実装 sensor_data_to_str(csv=True) と同一形式）
  function packetToCsvRows(dv) {
    const serial = dv.getUint16(1);
    const h = dv.getUint8(3), m = dv.getUint8(4), s = dv.getUint8(5), ms = dv.getUint16(6);
    const rows = [];
    for (let i = NOTIFY_DATA_NUM - 1; i >= 0; i--) {
      const offsetMs = ((NOTIFY_DATA_NUM - 1) - i) * 5;
      const f = readFrame(dv, i);
      rows.push([
        String(serial), timestampToStr(h, m, s, ms, offsetMs),
        f2(f.gyro[0]), f2(f.gyro[1]), f2(f.gyro[2]),
        f4(f.acc[0]), f4(f.acc[1]), f4(f.acc[2]),
        f4(pressureToN(f.press[0], 1)), f4(pressureToN(f.press[1], 2)), f4(pressureToN(f.press[2], 3)),
        f4(pressureToN(f.press[3], 4)), f4(pressureToN(f.press[4], 5)), f4(pressureToN(f.press[5], 6)),
      ].join(', '));
    }
    return rows;
  }

  // 収集した raw ストア（Map<serial, DataView>）を timestamp 順に並べて CSV 文字列化
  function rawStoreToCSV(rawStore) {
    const entries = Array.from(rawStore.values());
    entries.sort((a, b) => extractTimestampMs(a) - extractTimestampMs(b));
    const lines = [CSV_HEADER];
    for (const dv of entries) {
      if (dv.byteLength < 1 || dv.getUint8(0) !== RESP_DATA) continue;
      for (const row of packetToCsvRows(dv)) lines.push(row);
    }
    return lines.join('\n') + '\n';
  }

  // ── 通知キュー（asyncio.Queue 相当。promise ベース） ───────────────────
  class NotifyQueue {
    constructor() {
      this._items = [];
      this._waiters = [];
    }
    push(data) {
      const w = this._waiters.shift();
      if (w) w(data);
      else this._items.push(data);
    }
    drain() {
      this._items.length = 0;
    }
    // timeout(ms) 待って先頭を取り出す。タイムアウトで null。
    wait(timeoutMs) {
      if (this._items.length) return Promise.resolve(this._items.shift());
      return new Promise((resolve) => {
        let settled = false;
        const done = (v) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          const i = this._waiters.indexOf(done);
          if (i >= 0) this._waiters.splice(i, 1);
          resolve(v);
        };
        const timer = setTimeout(() => done(null), timeoutMs);
        this._waiters.push(done);
      });
    }
  }

  // ── ループ状態（_LoopState の移植） ──────────────────────────────────
  class FifoLoopState {
    constructor() {
      this.lastSerial = null;
      this.carryOver = [];          // [[start,count], ...]
      this.rawStore = new Map();    // serial -> DataView
      this.dropped = 0;             // 回復不能に失われた累計シリアル数
      this.lossEvents = [];         // 未通知の回復不能ロスイベント（呼び出し側が drain）
      this.resyncPending = false;   // lastSerial=null が「再同期由来」か（初回start直後と区別）
      this.firstStoredSerial = null; // 最初に格納したシリアル（収録スパンの起点）
      this.storedSpanMax = 0;        // firstStoredSerial からの最大距離（収録スパン-1）
    }

    // rawStore へ格納したシリアルの収録スパン [firstStoredSerial .. +storedSpanMax] を記録する。
    // firstStoredSerial は「最初に格納したシリアル」ではなく「スパンの起点（＝これまでで最小）」であり、
    // より手前のシリアル（初回に落ちて後の再要求で回収された先頭など）が来たら起点を巻き戻す。
    // これをしないと serialDistance(起点, 手前) が ~65536 になり storedSpanMax が爆発し、
    // finalizePendingLoss が幻の巨大欠損を計上する（収録アークは半周 < 32768 前提）。
    noteStored(serial) {
      if (this.firstStoredSerial === null) {
        this.firstStoredSerial = serial;
        this.storedSpanMax = 0;
        return;
      }
      const fwd = serialDistance(this.firstStoredSerial, serial); // 起点より前方（新しい）
      const bwd = serialDistance(serial, this.firstStoredSerial); // 起点より後方（古い）
      if (bwd < fwd) {
        // serial は起点より手前（古い）→ 起点を巻き戻し、既存スパンをその分だけ延ばす
        this.firstStoredSerial = serial;
        this.storedSpanMax += bwd;
      } else if (fwd > this.storedSpanMax) {
        this.storedSpanMax = fwd;
      }
    }

    // 収集終了時の最終計上。収録スパン内で「格納も回復不能計上もされていない」
    // シリアル（＝再要求が成功しないまま停止した carryOver 残り等）を dropped に計上する。
    // 不変条件: スパン内シリアル数 = rawStore.size + dropped（各経路の計上漏れをここで必ず埋める）
    finalizePendingLoss() {
      if (this.firstStoredSerial === null) return 0;
      const expected = this.storedSpanMax + 1;
      const pending = expected - this.rawStore.size - this.dropped;
      if (pending <= 0) return 0;
      this.dropped += pending;
      this.lossEvents.push({ reason: 'stopped_pending', dropped: pending });
      return pending;
    }

    // 新規リクエストの [startSerial, requestSize] を計算。
    calcRequestRange(currentSerial, accumulatedCount, maxNewRequest) {
      if (this.lastSerial === null) {
        const requestSize = Math.min(accumulatedCount, maxNewRequest);
        // 再同期直後は「直近 requestSize 件」だけを要求するため、それより古い
        // 未回収バックログ（accumulatedCount 超過分）は要求されず失われる。
        // これを無音欠損にしないよう回復不能ロスとして計上する。
        // 初回 start() 直後（resyncPending=false）はバッファ消去済みで意図的な
        // 「直近から開始」なので損失ではない。
        if (this.resyncPending) {
          const lost = Math.max(0, accumulatedCount - requestSize);
          if (lost > 0) {
            this.dropped += lost;
            this.lossEvents.push({ reason: 'resync_backlog', dropped: lost });
          }
          this.resyncPending = false;
        }
        const startSerial = requestSize > 0
          ? ((currentSerial - (requestSize - 1)) % UINT16_MAX + UINT16_MAX) % UINT16_MAX
          : 0;
        return [startSerial, requestSize];
      }

      let need = serialDistance(this.lastSerial, currentSerial);
      if (need > RING_BUFFER_CAPACITY) {
        // 追従が間に合わず、FW リングバッファが上書きされた分は回復不能。
        // ここで飛ばす serial は「気づかない欠損」になりやすいので必ず記録・通知する。
        const skip = need - RING_BUFFER_CAPACITY;
        this.lastSerial = (this.lastSerial + skip) % UINT16_MAX;
        this.carryOver = [];
        this.dropped += skip;
        this.lossEvents.push({ reason: 'ring_overflow', dropped: skip });
        need = serialDistance(this.lastSerial, currentSerial);
      }
      const requestSize = Math.min(need, maxNewRequest);
      const startSerial = (this.lastSerial + 1) % UINT16_MAX;
      return [startSerial, requestSize];
    }

    // レスポンス後に lastSerial と carryOver を更新。
    // 戻り値: 'resync' | 'ok'（呼び出し側でログ用）
    updateAfterResponse(bleLoss, newNoData, startSerial, requestSize) {
      if (bleLoss.size > 0) {
        this.carryOver.push(...buildRequestsFromSerials(bleLoss));
        const totalPending = this.carryOver.reduce((sum, [, c]) => sum + c, 0);
        if (totalPending > MAX_CARRY_OVER_SERIALS) {
          // carryOver が溢れた分の再要求は諦める＝回復不能ロス。
          this.dropped += totalPending;
          this.lossEvents.push({ reason: 'carryover_overflow', dropped: totalPending });
          this.carryOver = [];
          this.lastSerial = null;
          this.resyncPending = true;   // 次ポーリングでバックログ超過分を計上する
          return 'resync';
        }
      }
      if (newNoData.size > 0) {
        // 新規レンジの no-data → lastSerial を現在シリアルへ再アンカー（resync）。
        // ただし carryOver（既知の再要求キュー）は破棄しない。破棄すると走行中に散発欠損が
        // 恒久ロス化して収束せず、収録全域に単発欠損が散る（#43/#46）。FW から消えた分は
        // 次サイクルで no-data → fw_nodata として自然に carryOver から抜けるので溜まり続けない。
        this.lastSerial = null;
        this.resyncPending = true;     // 次ポーリングでバックログ超過分を計上する
      } else if (requestSize > 0) {
        this.lastSerial = (startSerial + requestSize - 1) % UINT16_MAX;
      }
      return 'ok';
    }
  }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // ── メインクラス ─────────────────────────────────────────────────────
  /**
   * FIFO（ロスレス）収集。接続済みの OrpheInsole を渡して使う。
   * @example
   *   const fifo = new OrpheInsoleFifo(insoles[0]);
   *   fifo.onSamples = (deviceId, samples) => { ... 可視化 ... };
   *   await fifo.start();
   *   // ... 収集 ...
   *   await fifo.stop();
   *   fifo.download('capture.csv');
   */
  class OrpheInsoleFifo {
    /**
     * @param {OrpheInsole} insole 接続済み（begin 済み）の OrpheInsole
     * @param {object} [options]
     * @param {number} [options.startupDelayMs=1000] モニタ開始後にバッファへ蓄積を待つ時間
     * @param {boolean} [options.stopOnLoss=false] 回復不能な欠損が発生した時点で収録を自動停止する
     */
    constructor(insole, options = {}) {
      this.insole = insole;
      this.options = options;
      this.stopOnLoss = options.stopOnLoss || false;
      this.state = new FifoLoopState();
      this._queue = new NotifyQueue();
      this._running = false;
      this._starting = false;
      this._loopPromise = null;
      this._restoreMode = null;
      this._tornDown = false;
      this._autoStopped = false;
      this._lastCurrentSerial = null; // 最後にポーリングで得た FW 側シリアル（停止時の通知用）
      this._captureId = 0;
      this._nextRealtimeWindowAt = null;
      this._realtimeWindowSequence = 0;
      this.realtimeWindowActive = false;
      this.realtimeWindowEnabled = Number(options.realtimeWindowMs || 0) > 0;
      this.lag = 0;             // 現在の追従遅れ（未取得シリアル数）。バッファ容量に近づくと欠損の危険。

      // コールバック（ユーザが上書き）
      this.onSamples = null;    // (deviceId, samples[]) 収集したパケットのデコード結果
      this.onProgress = null;   // (info) {collected, lag, dropped, currentSerial}
      this.onAnomaly = null;    // (info) 欠損・再同期などの詳細
      this.onDataLoss = null;   // (info) 回復不能な欠損が起きたとき {reason, dropped, cumulative, currentSerial}
      this.onStopped = null;    // (info) 収集終了時 {reason:'manual'|'loss', dropped, collected}（自動停止の検知に使う）
      this.onRealtimeWindow = null; // async (info) FIFO+Step互換用の一時Realtime窓
      this.onError = null;      // (error)
    }

    get deviceId() { return this.insole ? this.insole.id : 0; }
    get collectedCount() { return this.state.rawStore.size; }
    /** 回復不能に失われた累計シリアル数（0 なら欠損なし） */
    get droppedCount() { return this.state.dropped; }

    /**
     * FIFO内部の要求境界を記録する。到着時刻ではなくdevice serial範囲で
     * 後続区間の完全性を判定するため、preview後の正式計測開始時に使う。
     */
    createCheckpoint() {
      return {
        captureId: this._captureId,
        serial: this.state.lastSerial,
        dropped: this.state.dropped,
        collected: this.state.rawStore.size,
      };
    }

    /**
     * checkpoint直後から現在の要求済みserialまでをrawStoreで再集計する。
     * 遅延・再要求で到着順が前後しても、drain後の最終欠損を正しく返す。
     */
    summarizeSince(checkpoint) {
      const start = checkpoint && Number.isInteger(checkpoint.serial) ? checkpoint.serial : null;
      const end = this.state.lastSerial;
      const sameCapture = checkpoint && checkpoint.captureId === this._captureId;
      if (!sameCapture || start === null || !Number.isInteger(end)) {
        return {
          available: false,
          first: null,
          last: null,
          expected: 0,
          received: 0,
          missing: 0,
          missingRate: 0,
          dropped: Math.max(0, this.state.dropped - Number(checkpoint?.dropped || 0)),
          checkpoint,
        };
      }

      const expected = serialDistance(start, end);
      const received = this.serialsSince(checkpoint).length;
      const missing = Math.max(0, expected - received);
      return {
        available: true,
        first: expected > 0 ? (start + 1) % UINT16_MAX : null,
        last: end,
        expected,
        received,
        missing,
        missingRate: expected > 0 ? missing / expected : 0,
        // 累積droppedの差分にはcheckpoint以前のcarryOverが後から確定した分も混ざりうる。
        // 正式区間のdroppedは、このdevice serial範囲で実際に未回収の件数を採用する。
        dropped: missing,
        reportedDroppedDelta: Math.max(0, this.state.dropped - Number(checkpoint.dropped || 0)),
        checkpoint,
      };
    }

    /** checkpoint範囲に含まれる回収済みdevice serialを返す。 */
    serialsSince(checkpoint) {
      const start = checkpoint && Number.isInteger(checkpoint.serial) ? checkpoint.serial : null;
      const end = this.state.lastSerial;
      if (!checkpoint || checkpoint.captureId !== this._captureId ||
          start === null || !Number.isInteger(end)) return [];
      const expected = serialDistance(start, end);
      const serials = [];
      for (const serial of this.state.rawStore.keys()) {
        const distance = serialDistance(start, serial);
        if (distance > 0 && distance <= expected) serials.push(serial);
      }
      return serials;
    }

    /** FIFO+Step互換用Realtime窓の有効/無効を切り替える。通常FIFOはfalseのまま。 */
    setRealtimeWindowEnabled(enabled) {
      this.realtimeWindowEnabled = !!enabled && Number(this.options.realtimeWindowMs || 0) > 0;
      if (!this.realtimeWindowEnabled) this._nextRealtimeWindowAt = null;
    }

    // ── 低レベルコマンド ──────────────────────────────────────────────
    _write(bytes) {
      return this.insole.write('DEVICE_INFORMATION', bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes));
    }

    async _setReadMode(mode) {
      await this._write([OP_READ_MODE, mode]);
      await sleep(100);
    }

    // ACK 応答 (0x35 sub) を待つコマンド
    async _commandExpectAck(sub, timeoutMs = 300) {
      this._queue.drain();
      await this._write([OP_INFO, sub]);
      const dv = await this._queue.wait(timeoutMs);
      return !!(dv && dv.byteLength >= 2 && dv.getUint8(0) === RESP_STATUS && dv.getUint8(1) === sub);
    }

    async _getCurrentSerial() {
      this._queue.drain();
      await this._write([OP_INFO, SUB_GET_SERIAL]);
      const dv = await this._queue.wait(CURRENT_SERIAL_TIMEOUT_MS);
      return dv ? parseCurrentSerial(dv) : null;
    }

    // 成功するまで（最大 retries 回）繰り返す
    async _retry(fn, { retries = 10, intervalMs = 1000 } = {}) {
      for (let i = 0; i < retries; i++) {
        const ok = await fn();
        if (ok) return true;
        await sleep(intervalMs);
      }
      return false;
    }

    async _retryValue(fn, { retries = 10, intervalMs = 1 } = {}) {
      for (let i = 0; i < retries; i++) {
        const v = await fn();
        if (v !== null && v !== undefined) return v;
        await sleep(intervalMs);
      }
      return null;
    }

    // ── 収集開始 ──────────────────────────────────────────────────────
    /**
     * FIFO 収集を開始する。SENSOR_VALUES 通知は begin() で開始済みであること。
     * @returns {Promise<boolean>} 準備に成功して収集を開始できたら true
     */
    async start() {
      if (this._running || this._starting) return this._running;
      // 直前の stop()/自動停止のライフサイクル完了を待つ。待たずに再開すると
      // 旧ループと新ループが同じ NotifyQueue を奪い合い、ハンドシェイクの ACK を
      // 旧ループが横取りしてしまう（公開クラスなので交差呼び出しに備える）。
      this._starting = true;
      try {
        if (this._loopPromise) { try { await this._loopPromise; } catch (_) { /* noop */ } }
      } finally {
        this._starting = false;
      }
      if (!this.insole || !this.insole.isConnected || !this.insole.isConnected()) {
        this._reportError(new Error('OrpheInsoleFifo.start(): insole is not connected'));
        return false;
      }

      // 収集直前の状態をクリア
      this.state = new FifoLoopState();
      this._captureId += 1;
      this._restoreMode = this.insole.streaming_mode || 4;

      // notify をこのモジュールの queue へ横取り
      this.insole._fifoNotifySink = (dv) => this._queue.push(dv);

      try {
        await this._setReadMode(READ_MODE_FIFO);
        await sleep(200);
        this._queue.drain(); // モード切替直前のリアルタイムパケットを捨てる

        const prepared = await this._prepare();
        if (!prepared) {
          this._reportError(new Error('OrpheInsoleFifo.start(): failed to prepare FIFO collection'));
          await this._teardown();
          return false;
        }
      } catch (e) {
        this._reportError(e);
        await this._teardown();
        return false;
      }

      this._running = true;
      this._tornDown = false;
      this._autoStopped = false;
      this._realtimeWindowSequence = 0;
      const realtimeWindowIntervalMs = Math.max(0, Number(this.options.realtimeWindowIntervalMs || 2000));
      const configuredInitialDelay = this.options.realtimeWindowInitialDelayMs;
      const initialDelayMs = configuredInitialDelay != null
        ? Math.max(0, Number(configuredInitialDelay))
        : this.deviceId * Math.floor(realtimeWindowIntervalMs / 2);
      this._nextRealtimeWindowAt = Date.now() + initialDelayMs;
      // ループがどんな理由で終わっても（stop() / stopOnLoss 自動停止 / 例外）
      // 必ず後片付け（モード復帰・sink解除）と onStopped 通知を1回だけ行う。
      this._loopPromise = this._runLoopWrapped();
      return true;
    }

    async _runLoopWrapped() {
      let drainRecovered = 0;
      try {
        await this._runLoop();
        // 手動 stop() で終了した場合のみ、未回収（carryOver）の再要求を続ける回収フェーズ（drain）を
        // 走らせる。carryOver が空なら即抜けるので、欠損のない正常系では stop() の遅延は実質ゼロ。
        // stopOnLoss 自動停止・例外・切断時は行わない（それらは _autoStopped / 切断で弾く）。
        const drainTimeoutMs = this.options.drainTimeoutMs != null ? this.options.drainTimeoutMs : DEFAULT_DRAIN_TIMEOUT_MS;
        if (!this._autoStopped && drainTimeoutMs > 0 &&
            this.insole && this.insole.isConnected && this.insole.isConnected()) {
          drainRecovered = await this._drainLoop(Date.now() + drainTimeoutMs);
        }
      } catch (e) {
        this._reportError(e);
      } finally {
        // 停止時（drain 後）の最終計上: 再要求（carryOver）が成功しないままループを抜けた分は
        // どの経路でも計上されずに消えるため、収録スパンとの差分をここで必ず dropped に反映する。
        // （「droppedCount === 0 なら CSV は完全」の保証を停止時にも成立させる。drain のセーフティネット）
        const pending = this.state.finalizePendingLoss();
        if (pending > 0 && typeof this.onDataLoss === 'function') {
          this._safe(() => this.onDataLoss({
            reason: 'stopped_pending',
            dropped: pending,
            cumulative: this.state.dropped,
            currentSerial: this._lastCurrentSerial,
          }));
        }
        this.state.lossEvents.length = 0; // finalize 分は上で通知済み
        await this._teardownOnce();
        if (typeof this.onStopped === 'function') {
          this._safe(() => this.onStopped({
            reason: this._autoStopped ? 'loss' : 'manual',
            dropped: this.state.dropped,
            collected: this.state.rawStore.size,
            drainRecovered,
          }));
        }
      }
    }

    // ── 回収フェーズ（drain） ─────────────────────────────────────────
    // stop() 後、新規レンジ要求は打ち切り、未回収（carryOver）の再要求だけを deadline まで
    // 続けて、FW リングバッファに残っているシリアルを回収する。FW から消えた分は no-data →
    // fw_nodata として確定計上し carryOver から抜く。回収できたシリアル数を返す。
    // 通常ループと同じ分類・通知（onSamples/onDataLoss/onProgress）を使うが、onProgress には
    // draining:true を付ける。
    async _drainLoop(deadline) {
      const state = this.state;
      let recovered = 0;
      while (state.carryOver.length > 0 && Date.now() < deadline) {
        const carryOverToSend = state.carryOver.slice(0, RE_REQUEST_DATA_NUM);
        state.carryOver = state.carryOver.slice(carryOverToSend.length);
        const expectedSerials = new Set(expandRequestsToList(carryOverToSend));
        if (expectedSerials.size === 0) continue;

        this._queue.drain();
        await this._write(createGetSensorDataRequest(carryOverToSend));

        const shotTimeout = Math.min(ONE_SHOT_TIMEOUT_MS, Math.max(0, deadline - Date.now()));
        const { received, noDataSerials } =
          await this._receiveResponses(expectedSerials, shotTimeout, ONE_SHOT_IDLE_TIMEOUT_MS);

        const allMissed = [...expectedSerials].filter((sn) => !received.has(sn));
        const bleLoss = new Set(allMissed.filter((sn) => !noDataSerials.has(sn)));      // まだ届かない → 再要求へ戻す
        const confirmedLost = allMissed.filter((sn) => noDataSerials.has(sn));           // FWから消失 → 回復不能

        if (confirmedLost.length > 0) {
          state.dropped += confirmedLost.length;
          state.lossEvents.push({ reason: 'fw_nodata', dropped: confirmedLost.length });
        }
        if (bleLoss.size > 0) state.carryOver.push(...buildRequestsFromSerials(bleLoss));

        const decodedSamples = [];
        for (const [sn, dv] of received) {
          if (state.rawStore.has(sn)) continue;
          state.rawStore.set(sn, dv);
          state.noteStored(sn);
          recovered += 1;
          const decoded = decodePacket(dv);
          for (const s of decoded.samples) decodedSamples.push(s);
        }
        if (decodedSamples.length && typeof this.onSamples === 'function') {
          this._safe(() => this.onSamples(this.deviceId, decodedSamples));
        }
        if (state.lossEvents.length > 0) {
          const events = state.lossEvents.splice(0);
          if (typeof this.onDataLoss === 'function') {
            for (const ev of events) {
              this._safe(() => this.onDataLoss({ ...ev, cumulative: state.dropped, currentSerial: this._lastCurrentSerial }));
            }
          }
        }
        if (typeof this.onProgress === 'function') {
          this._safe(() => this.onProgress({
            collected: state.rawStore.size,
            lastReceived: received.size,
            currentSerial: this._lastCurrentSerial,
            lag: state.carryOver.reduce((sum, [, c]) => sum + c, 0),
            dropped: state.dropped,
            draining: true,
          }));
        }
      }
      return recovered;
    }

    async _prepare() {
      if (!(await this._retry(() => this._commandExpectAck(SUB_STOP_MONITOR)))) return false;
      if (!(await this._retry(() => this._commandExpectAck(SUB_DELETE_ALL)))) return false;
      if (!(await this._retry(() => this._commandExpectAck(SUB_START_MONITOR)))) return false;
      // バッファへ少し蓄積されるのを待つ
      const delay = this.options.startupDelayMs != null ? this.options.startupDelayMs : 1000;
      if (delay > 0) await sleep(delay);
      return true;
    }

    // ── メインループ（run_tokoroten_loop の移植） ─────────────────────
    async _runLoop() {
      const state = this.state;
      while (this._running) {
        const current = await this._retryValue(() => this._getCurrentSerial(), { retries: 10, intervalMs: 1 });
        if (!this._running) break;
        if (current === null) { await sleep(POLLING_INTERVAL_MS); continue; }

        const { serial: currentSerial, accumulated: accumulatedCount } = current;
        this._lastCurrentSerial = currentSerial;

        // 追従遅れ（まだ取得していないシリアル数）。RING_BUFFER_CAPACITY に近づくほど欠損危険。
        this.lag = state.lastSerial === null ? accumulatedCount : serialDistance(state.lastSerial, currentSerial);

        let carryOverToSend = state.carryOver.slice(0, RE_REQUEST_DATA_NUM);
        const carryOverSerialCount = carryOverToSend.reduce((sum, [, c]) => sum + c, 0);
        const maxNewRequest = Math.max(0, MAX_DATA_NUMBER_REQUESTED_AT_ONCE - carryOverSerialCount);

        const [startSerial, requestSize] = state.calcRequestRange(currentSerial, accumulatedCount, maxNewRequest);

        if (requestSize <= 0 && carryOverToSend.length === 0) {
          await this._maybeRunRealtimeWindow();
          await sleep(POLLING_INTERVAL_MS);
          continue;
        }

        // 新規レンジを送る場合は、固定 30 スロットを超えないよう carry-over を 29 組までに制限
        // （合計 31 組になると createGetSensorDataRequest が規定超過パケットになるため）。
        if (requestSize > 0 && carryOverToSend.length >= RE_REQUEST_DATA_NUM) {
          carryOverToSend = carryOverToSend.slice(0, RE_REQUEST_DATA_NUM - 1);
        }

        const requests = [];
        if (requestSize > 0) requests.push([startSerial, requestSize]);
        for (const co of carryOverToSend) requests.push(co);
        state.carryOver = state.carryOver.slice(carryOverToSend.length);

        if (requests.length === 0) { await sleep(POLLING_INTERVAL_MS); continue; }

        const expectedSerials = new Set(expandRequestsToList(requests));
        const newSerials = new Set(calcExpectedSerials(startSerial, requestSize));

        this._queue.drain();
        await this._write(createGetSensorDataRequest(requests));

        const { received, noDataSerials } = await this._receiveResponses(expectedSerials, ONE_SHOT_TIMEOUT_MS, ONE_SHOT_IDLE_TIMEOUT_MS);
        // stop() で _running が落ちても、このサイクルで受信済みの分は捨てずに格納・計上する
        // （捨てると末尾サイクルが黙って欠損する）。未受信分は carryOver に積まれ drain が回収する。

        const allMissed = [...expectedSerials].filter((sn) => !received.has(sn));
        const bleLoss = new Set(allMissed.filter((sn) => !noDataSerials.has(sn)));            // 通信ロス→再要求で回復
        const confirmedLost = allMissed.filter((sn) => noDataSerials.has(sn));                // FWバッファから消失→回復不能
        const newNoData = new Set([...noDataSerials].filter((sn) => newSerials.has(sn)));     // 新規要求への no-data → 再同期

        if (confirmedLost.length > 0) {
          state.dropped += confirmedLost.length;
          state.lossEvents.push({ reason: 'fw_nodata', dropped: confirmedLost.length });
        }

        if ((noDataSerials.size > 0 || allMissed.length > 0) && typeof this.onAnomaly === 'function') {
          this._safe(() => this.onAnomaly({
            startSerial, requestSize, currentSerial,
            received: received.size, expected: expectedSerials.size,
            noData: noDataSerials.size, bleLoss: bleLoss.size,
            confirmedLost: confirmedLost.length, newNoData: newNoData.size,
          }));
        }

        state.updateAfterResponse(bleLoss, newNoData, startSerial, requestSize);

        // 回復不能ロスの通知（気づかない欠損を防ぐ）。stopOnLoss なら収録を止める。
        if (state.lossEvents.length > 0) {
          const events = state.lossEvents.splice(0);
          if (typeof this.onDataLoss === 'function') {
            for (const ev of events) {
              this._safe(() => this.onDataLoss({ ...ev, cumulative: state.dropped, currentSerial }));
            }
          }
          if (this.stopOnLoss) { this._autoStopped = true; this._running = false; }
        }

        // raw 蓄積 + デコードして可視化コールバックへ
        const decodedSamples = [];
        for (const [sn, dv] of received) {
          state.rawStore.set(sn, dv);
          state.noteStored(sn);
          const decoded = decodePacket(dv);
          for (const s of decoded.samples) decodedSamples.push(s);
        }
        if (decodedSamples.length && typeof this.onSamples === 'function') {
          this._safe(() => this.onSamples(this.deviceId, decodedSamples));
        }
        if (typeof this.onProgress === 'function') {
          this._safe(() => this.onProgress({
            collected: state.rawStore.size,
            lastReceived: received.size,
            currentSerial,
            lag: this.lag,
            dropped: state.dropped,
          }));
        }

        await this._maybeRunRealtimeWindow();
        await sleep(POLLING_INTERVAL_MS);
      }
    }

    async _maybeRunRealtimeWindow() {
      if (!this._running || !this.realtimeWindowEnabled || this.realtimeWindowActive) return;
      const windowMs = Math.max(0, Number(this.options.realtimeWindowMs || 0));
      if (windowMs <= 0) return;
      if (this._nextRealtimeWindowAt !== null && Date.now() < this._nextRealtimeWindowAt) return;

      await this._runRealtimeWindow();
      const intervalMs = Math.max(0, Number(this.options.realtimeWindowIntervalMs || 2000));
      this._nextRealtimeWindowAt = Date.now() + intervalMs;
    }

    /**
     * FW monitorは動かしたままread modeだけを短時間Realtimeへ戻す。
     * STEP_ANALYSISを再購読する呼び出し側へopenを通知し、窓の終了後にFIFOへ復帰する。
     * 通常FIFOではrealtimeWindowEnabled=falseのため実行されない。
     */
    async _runRealtimeWindow() {
      const windowMs = Math.max(0, Number(this.options.realtimeWindowMs || 0));
      if (!this._running || windowMs <= 0 || this.realtimeWindowActive) return;

      const sequence = ++this._realtimeWindowSequence;
      let restoredToFifo = false;
      this.realtimeWindowActive = true;
      try {
        this._queue.drain();
        await this._setReadMode(this._restoreMode || this.insole.streaming_mode || 4);
        await this._emitRealtimeWindow({ phase: 'open', windowMs, sequence });
        await sleep(windowMs);
        if (this._running) {
          this._queue.drain();
          await this._setReadMode(READ_MODE_FIFO);
          this._queue.drain();
          restoredToFifo = true;
        }
      } catch (error) {
        this._reportError(error);
      } finally {
        if (this._running && !restoredToFifo) {
          try {
            this._queue.drain();
            await this._setReadMode(READ_MODE_FIFO);
            this._queue.drain();
            restoredToFifo = true;
          } catch (error) {
            this._reportError(error);
          }
        }
        this.realtimeWindowActive = false;
        await this._emitRealtimeWindow({
          phase: 'closed',
          windowMs,
          sequence,
          restoredToFifo,
        });
      }
    }

    async _emitRealtimeWindow(info) {
      if (typeof this.onRealtimeWindow !== 'function') return;
      try {
        await this.onRealtimeWindow(info);
      } catch (error) {
        this._reportError(error);
      }
    }

    // deadline まで notify を受信し、センサーデータと no-data を分類。
    // idleTimeoutMs: 受信開始後に許容する無音。1件でも真の BLE ドロップがあると
    // 全部揃うまで（＝丸ごと timeoutMs＝5秒）失速していたのを、受信が途切れたら
    // idleTimeoutMs で「このバーストは終わり」と判断して早期に抜けるよう緩和する（#46）。
    // 未受信分は carryOver で再要求されるので取りこぼしにはならない。
    async _receiveResponses(expectedSerials, timeoutMs, idleTimeoutMs) {
      const received = new Map();
      const noDataSerials = new Set();
      const totalExpected = expectedSerials.size;
      const deadline = Date.now() + timeoutMs;
      const idleMs = idleTimeoutMs != null ? idleTimeoutMs : timeoutMs;
      let gotAny = false;

      while (received.size + noDataSerials.size < totalExpected) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) break;
        // 最初の応答までは全 budget を待つ（応答開始の遅延を早期打ち切りしない）。
        // 受信し始めたら短い無音（idleMs）でバーストの終わりと判断する。
        const waitMs = gotAny ? Math.min(remaining, idleMs) : remaining;
        const dv = await this._queue.wait(waitMs);
        if (dv === null) break;
        gotAny = true;

        const noData = parseNoDataResponse(dv);
        if (noData !== null) {
          const [ndStart, ndCount] = noData;
          for (let i = 0; i < ndCount; i++) noDataSerials.add((ndStart + i) % UINT16_MAX);
          continue;
        }
        const serial = extractSerialIfSensorPacket(dv);
        if (serial !== null && expectedSerials.has(serial) && dv.byteLength === DATA_PACKET_BYTE_LENGTH) {
          received.set(serial, dv);
        }
      }
      return { received, noDataSerials };
    }

    // ── 収集停止 ──────────────────────────────────────────────────────
    /**
     * 収集を停止し、リアルタイムモードへ復帰する。
     * @returns {Promise<Map<number, DataView>>} 収集した raw ストア
     */
    async stop() {
      if (!this._loopPromise) return this.state.rawStore;
      this._running = false;
      // ループ終了時に _runLoopWrapped の finally が teardown を1回だけ行う
      try { await this._loopPromise; } catch (_) { /* noop */ }
      this._loopPromise = null;
      return this.state.rawStore;
    }

    // teardown は「ループ終了時に1回だけ」実行する（stop と自動停止の二重実行を防ぐ）
    async _teardownOnce() {
      if (this._tornDown) return;
      this._tornDown = true;
      await this._teardown();
    }

    // notify 横取りを解除し、直前のリアルタイムモードへ戻す
    async _teardown() {
      try {
        if (this.insole && this.insole.isConnected && this.insole.isConnected()) {
          await this._commandExpectAck(SUB_STOP_MONITOR).catch(() => {});
          if (this._restoreMode) {
            await this._setReadMode(this._restoreMode).catch(() => {});
            this.insole.streaming_mode = this._restoreMode;
          }
        }
      } catch (_) { /* noop */ } finally {
        this.realtimeWindowActive = false;
        this._nextRealtimeWindowAt = null;
        if (this.insole && this.insole._fifoNotifySink) delete this.insole._fifoNotifySink;
      }
    }

    // ── CSV 出力 ──────────────────────────────────────────────────────
    /** 収集データを参照実装互換の CSV 文字列にする（timestamp 昇順） */
    toCSV() {
      return rawStoreToCSV(this.state.rawStore);
    }

    /** ブラウザで CSV をダウンロードする */
    download(filename) {
      const csv = this.toCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'orphe-insole-fifo.csv';
      a.style.display = 'none';
      // アンカーを DOM に追加してから click する（DOM 外アンカーの合成 click は
      // 一部ブラウザで無視されることがある）。
      document.body.appendChild(a);
      a.click();
      // click 直後に同期で revoke すると、ブラウザが blob を読み終える前に URL が
      // 無効化され、ダウンロードが始まらないことがある（Chromium の既知の競合。
      // CSV が大きいほど発生しやすく、間欠的な「DLできない」の原因になる）。
      // 次tick以降でクリーンアップする。
      setTimeout(() => {
        URL.revokeObjectURL(url);
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 1000);
    }

    // ── 内部ユーティリティ ────────────────────────────────────────────
    _safe(fn) { try { fn(); } catch (e) { this._reportError(e); } }
    _reportError(error) {
      if (typeof this.onError === 'function') { try { this.onError(error); return; } catch (_) { /* fallthrough */ } }
      console.error('OrpheInsoleFifo:', error);
    }
  }

  // ── 純粋関数/定数をテスト用に公開 ───────────────────────────────────
  OrpheInsoleFifo.UINT16_MAX = UINT16_MAX;
  OrpheInsoleFifo.READ_MODE_FIFO = READ_MODE_FIFO;
  OrpheInsoleFifo.CSV_HEADER = CSV_HEADER;
  OrpheInsoleFifo.RING_BUFFER_CAPACITY = RING_BUFFER_CAPACITY;
  OrpheInsoleFifo.MAX_CARRY_OVER_SERIALS = MAX_CARRY_OVER_SERIALS;
  OrpheInsoleFifo.RE_REQUEST_DATA_NUM = RE_REQUEST_DATA_NUM;
  OrpheInsoleFifo.accToG = accToG;
  OrpheInsoleFifo.gyroToDps = gyroToDps;
  OrpheInsoleFifo.pressureToN = pressureToN;
  OrpheInsoleFifo.serialDistance = serialDistance;
  OrpheInsoleFifo.calcExpectedSerials = calcExpectedSerials;
  OrpheInsoleFifo.expandRequestsToList = expandRequestsToList;
  OrpheInsoleFifo.buildRequestsFromSerials = buildRequestsFromSerials;
  OrpheInsoleFifo.createGetSensorDataRequest = createGetSensorDataRequest;
  OrpheInsoleFifo.parseNoDataResponse = parseNoDataResponse;
  OrpheInsoleFifo.extractSerialIfSensorPacket = extractSerialIfSensorPacket;
  OrpheInsoleFifo.parseCurrentSerial = parseCurrentSerial;
  OrpheInsoleFifo.timestampToStr = timestampToStr;
  OrpheInsoleFifo.extractTimestampMs = extractTimestampMs;
  OrpheInsoleFifo.decodePacket = decodePacket;
  OrpheInsoleFifo.packetToCsvRows = packetToCsvRows;
  OrpheInsoleFifo.rawStoreToCSV = rawStoreToCSV;
  OrpheInsoleFifo.NotifyQueue = NotifyQueue;
  OrpheInsoleFifo.FifoLoopState = FifoLoopState;

  if (typeof global.OrpheInsoleFifo === 'undefined') {
    global.OrpheInsoleFifo = OrpheInsoleFifo;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrpheInsoleFifo;
  }

})(typeof globalThis !== 'undefined' ? globalThis : this);
