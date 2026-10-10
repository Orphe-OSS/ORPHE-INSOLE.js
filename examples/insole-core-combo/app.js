// ORPHE INSOLE ×2 + ORPHE CORE ×1 同時接続ツール
// - INSOLE 2台: InsoleToolkit（insoles[0], insoles[1]）。通常時は Realtime(mode 3, 200Hz)、
//   計測中は FIFO（ロスレス収録、fifo-recording プロファイル）に切り替える
// - CORE 1台: CoreCompanionToolkit（orpheCore）。常時 Realtime（200Hz）
// 高頻度データは buffer に溜め、描画は rAF で間引く（CLAUDE.md Pattern 5）
//
// 時刻同期の設計:
//   両SDKとも begin() 時に syncCoreTime() でデバイス時計をPC時刻へ同期する（誤差 ≈ RTT/2）。
//   - INSOLE FIFO サンプルの t は「0時からのms」→ 当日0時のepochを足してepoch msに変換
//   - CORE は SDK が各コールバックに epoch timestamp を付与済み（同じ規約: 今日の日付+デバイス時刻）
//   → CSV の timestamp 列は全行が同一のPC時計基準 epoch ms。
//   既知の制約: 日付跨ぎ（深夜0時）でINSOLE行が約24時間ジャンプする（SENSOR_SPEC.md と同じ）。

// ── 接続UI ──────────────────────────────────────────────────────
function insoleToolkitOptions(id) {
  return {
    streamingMode: 3,          // Realtime: gyro+acc+press 200Hz（quatなし。CSV列と一致）
    autoReconnect: true,
    sensorDataMode: 'realtime',
    outputs: { sensorValues: true, stepAnalysis: false },
    fifo: {
      startupDelayMs: 800,
      // 収録中は Realtime 配信が止まるため、FIFOサンプルでライブ表示を継続する
      onSamples(deviceId, samples) {
        for (const s of samples) {
          const values = s.press.values.slice(0, 6);
          latest.press[deviceId] = values;
          pressurePanels[deviceId].push({ press: values });
        }
      },
      onDataLoss(info) {
        // 「気づかない欠損」を防ぐため回復不能ロスは必ずconsoleに残し、
        // 収録中ステータスの !loss 表示にも即時反映する
        console.warn(`INSOLE${id}: FIFO data loss (${info.reason}): +${info.dropped}, cumulative ${info.cumulative}`);
        Recorder.liveDropped[id] = info.cumulative;
      },
    },
    onError(error) {
      console.warn(`INSOLE${id}: Toolkit error`, error);
    },
  };
}

buildInsoleToolkit(document.getElementById('toolkit_insole0'), 'ORPHE INSOLE A', 0, insoleToolkitOptions(0));
buildInsoleToolkit(document.getElementById('toolkit_insole1'), 'ORPHE INSOLE B', 1, insoleToolkitOptions(1));
// CORE の notification モード切替実験用: ?core=sv で SENSOR_VALUES 単独にできる
// （既定 combined。SA通知(50Hz)の並走が SV 受信を圧迫していないかの切り分け）
const coreNotification = new URLSearchParams(location.search).get('core') === 'sv'
  ? 'SENSOR_VALUES'
  : 'STEP_ANALYSIS_AND_SENSOR_VALUES';
buildCoreCompanionToolkit(document.getElementById('toolkit_core'), 'ORPHE CORE', {
  notification: coreNotification,
  range: { acc: 16, gyro: 2000 }
});

// ── 最新値バッファ（描画は rAF 側でまとめて行う） ─────────────────
const latest = {
  press: [null, null],   // insole 0/1 の最新 press.values
  acc: null,             // CORE converted acc [G]
  gyro: null             // CORE converted gyro [deg/s]
};

// ── チャート共通（showcase/app.js 踏襲） ─────────────────────────
const CHART_HISTORY = 200;
const CHART_SERIES_COLORS = [
  'rgb(69, 230, 230)',
  'rgb(255, 96, 64)',
  'rgb(255, 255, 255)',
  'rgb(127, 127, 127)',
  'rgb(255, 205, 86)',
  'rgb(153, 102, 255)',
];

/** Chart.js 折れ線チャート生成（showcase/app.js の makeLineChart を簡略化。yMin/yMax 省略時は自動スケール） */
function makeLineChart(canvasId, title, seriesLabels, yMin, yMax) {
  const datasets = seriesLabels.map((label, i) => ({
    label,
    backgroundColor: CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length],
    borderColor: CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length],
    pointRadius: 0,
    borderWidth: 1.5,
    data: [],
  }));
  const yScale = { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.08)' } };
  if (typeof yMin === 'number' && typeof yMax === 'number') {
    yScale.min = yMin;
    yScale.max = yMax;
  }
  return new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: { labels: [], datasets },
    options: {
      animation: false,
      maintainAspectRatio: false,  // 高さは親コンテナ（index.html の固定高 div）で決める
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, color: '#ddd' } },
        title: { display: true, text: title, color: '#ddd' },
      },
      scales: {
        y: yScale,
        x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      },
    },
  });
}

/** 受信バッファ。CORE コールバック（〜200Hz）から push、描画ループで flush */
class ChartFeed {
  constructor(chart) {
    this.chart = chart;
    this.pending = [];
    this.count = 0;
  }
  push(values) { this.pending.push(values); }
  flush() {
    if (this.pending.length === 0) return false;
    const data = this.chart.data;
    for (const values of this.pending) {
      data.labels.push(this.count++);
      values.forEach((v, i) => data.datasets[i].data.push(v));
    }
    this.pending.length = 0;
    while (data.labels.length > CHART_HISTORY) {
      data.labels.shift();
      data.datasets.forEach(ds => ds.data.shift());
    }
    return true;
  }
}

let accFeed = null;
let gyroFeed = null;

/** 足型ヒートマップ + CoP + 6ch チャート（viz-pressure.js / showcase 踏襲） */
let pressurePanels = [];

// ── CSV記録 ─────────────────────────────────────────────────────
// INSOLE: FIFO（ロスレス収録、Toolkit の fifo-recording プロファイル経由）
//   → stopMeasurement() の result.raw.samples（正式計測区間のみ・欠損は再要求済み）
// CORE:   Realtime（gotConvertedGyro が各サンプル最後のコールバック → そこで1行確定）
// 全行を timestamp（epoch ms、両デバイスともPC時計に同期済み）でマージソートして1ファイルへ。
const CSV_HEADER = [
  'device', 'side', 'timestamp', 'serial_number', 'packet_number',
  'press1', 'press2', 'press3', 'press4', 'press5', 'press6',
  'acc_x', 'acc_y', 'acc_z',
  'gyro_x', 'gyro_y', 'gyro_z',
];

/** 計測時間の上限 [ms]（経過で自動停止。INSOLE FIFO の端末内バッファ ≒30秒 と整合） */
const RECORD_LIMIT_MS = 30000;

/** 「0時からのms」(FIFO の t) を epoch ms に変換。既に epoch っぽい値ならそのまま返す */
function timeOfDayToEpochMs(v) {
  if (v == null || !isFinite(v)) return null;
  if (v > 86400000) return v;  // 既にepoch ms（Realtime収録行など）
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  return midnight.getTime() + v;
}

const Recorder = {
  rows: [],          // 確定済みの統合行（stop完了後に埋まる）
  coreRows: [],      // 収録中に貯めるCORE行
  fifoActiveIds: [], // FIFO計測中のINSOLE id
  recording: false,
  draining: false,   // stop後のFIFO回収（drain）中
  startedAt: 0,
  droppedTotal: 0,        // FIFOの回復不能欠損（全デバイス合計、stop時確定）
  liveDropped: [0, 0],    // 収録中のライブ欠損カウント（onDataLossで更新）
  windowStartMs: 0,       // 計測窓（epoch ms）。全デバイスの行をこの窓でトリムして揃える
  windowStopMs: 0,

  addCoreRow(row) {
    if (this.recording) this.coreRows.push(row);
  },
  /** FIFO収集済みパケット数の合計（収録中のステータス表示用） */
  fifoCollectedTotal() {
    return this.fifoActiveIds.reduce((n, id) => {
      const session = getInsoleToolkitSession(id);
      return n + (session && session.fifo ? session.fifo.collectedCount : 0);
    }, 0);
  },
  toCSV() {
    const fmt = (v, d) => (v === null || v === undefined) ? '' : v.toFixed(d);
    const lines = [CSV_HEADER.join(',')];
    for (const f of this.rows) {
      const press = f.press || [];
      lines.push([
        f.device, f.side ?? '',
        Math.round(f.t), f.serial ?? '', f.packet ?? '',
        ...[0, 1, 2, 3, 4, 5].map(i => (f.press ? Math.round(press[i]) : '')),
        fmt(f.acc?.x, 4), fmt(f.acc?.y, 4), fmt(f.acc?.z, 4),
        fmt(f.gyro?.x, 2), fmt(f.gyro?.y, 2), fmt(f.gyro?.z, 2),
      ].join(','));
    }
    return lines.join('\n');
  },
  download() {
    const blob = new Blob([this.toCSV()], { type: 'text/csv' });
    const a = document.createElement('a');
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    a.href = URL.createObjectURL(blob);
    a.download = `orphe-insole-core-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  },
};

/** 接続中のINSOLE id 一覧（showcase 踏襲） */
function connectedInsoleIds() {
  const ids = [];
  for (let id = 0; id < 2; id++) {
    const session = getInsoleToolkitSession(id);
    if (session && insoles[id] && insoles[id].isConnected && insoles[id].isConnected()) ids.push(id);
  }
  return ids;
}

window.onload = function () {
  // INSOLE 圧力パネル（デモは device0=左足 / device1=右足 で初期化、mount_position で更新）
  pressurePanels = [createPressurePanel(0, 'L'), createPressurePanel(1, 'R')];
  pressurePanels.forEach(p => p.init());

  // INSOLE 2台（Realtime時のライブ表示。FIFO収録中は toolkit options の fifo.onSamples が代替）
  for (let i = 0; i < 2; i++) {
    insoles[i].setup();
    insoles[i].gotPress = function (press) {
      const values = press.values.slice(0, 6);
      latest.press[this.id] = values;
      pressurePanels[this.id].push({ press: values });
    };
    insoles[i].onDisconnect = function () {
      latest.press[this.id] = null;
    };
  }

  // CORE IMU チャート初期化
  // y軸はセンサレンジに合わせる（acc ±16G / gyro ±2000dps、begin() の range 設定と同値）
  accFeed = new ChartFeed(makeLineChart('chart_core_acc', 'ORPHE CORE acc [G]', ['x', 'y', 'z'], -16, 16));
  gyroFeed = new ChartFeed(makeLineChart('chart_core_gyro', 'ORPHE CORE gyro [deg/s]', ['x', 'y', 'z'], -2000, 2000));

  // CORE 1台
  const coreMountEl = document.getElementById('core_mount');
  orpheCore.gotConvertedAcc = function (acc) {
    latest.acc = acc;
    accFeed.push([acc.x, acc.y, acc.z]);
  };
  orpheCore.gotConvertedGyro = function (gyro) {
    latest.gyro = gyro;
    gyroFeed.push([gyro.x, gyro.y, gyro.z]);
    // CORE は gotConvertedGyro が各サンプル最後のコールバック → ここで1行確定。
    // timestamp / serial_number / packet_number は SDK がコールバック引数に付与済み
    // （SDK側がオブジェクトを使い回すため値コピーで保存する）
    Recorder.addCoreRow({
      device: 'core',
      side: coreMountEl ? coreMountEl.value : 'waist',  // 装着位置（waist/chest/head）
      t: gyro.timestamp ?? Date.now(),
      serial: gyro.serial_number ?? this.serial_number,
      packet: gyro.packet_number,
      press: null,
      acc: latest.acc ? { x: latest.acc.x, y: latest.acc.y, z: latest.acc.z } : null,
      gyro: { x: gyro.x, y: gyro.y, z: gyro.z },
    });
  };
  orpheCore.onDisconnect = function () {
    latest.acc = latest.gyro = null;
  };

  // ── notify計測（実機デバッグ用） ─────────────────────────────
  // characteristicごとの受信数と SENSOR_VALUES のヘッダバイト分布を数える。
  // 「eulerは来るのにaccが来ない」のような症状の切り分けに使う:
  //   - SV:0                → SENSOR_VALUES notifyが届いていない
  //   - SVは増えるがacc "-"  → 未知ヘッダ（40/50以外）でパーサが捨てている
  const origOnRead = orpheCore.onRead.bind(orpheCore);
  orpheCore.onRead = function (data, uuid) {
    notifyDebug[uuid] = (notifyDebug[uuid] || 0) + 1;
    if (uuid === 'SENSOR_VALUES' && data && data.getUint8) {
      const h = data.getUint8(0);
      notifyDebug.headers[h] = (notifyDebug.headers[h] || 0) + 1;
      if (data.byteLength !== undefined) notifyDebug.lastSVLength = data.byteLength;
      // 最初の3パケットは生hexをconsoleに残す（未知フォーマット解析用）
      if (notifyDebug.rawDumps < 3) {
        notifyDebug.rawDumps++;
        const bytes = [];
        for (let i = 0; i < data.byteLength; i++) {
          bytes.push(data.getUint8(i).toString(16).padStart(2, '0'));
        }
        console.log(`SV raw[${notifyDebug.rawDumps}] len=${data.byteLength}:`, bytes.join(' '));
      }
    }
    return origOnRead(data, uuid);
  };

  // notify購読の成否もconsoleへ（SENSOR_VALUESのstartNotifyが通ったかの確認用）
  const origOnStartNotify = orpheCore.onStartNotify ? orpheCore.onStartNotify.bind(orpheCore) : null;
  orpheCore.onStartNotify = function (uuid) {
    console.log('onStartNotify:', uuid);
    if (origOnStartNotify) return origOnStartNotify(uuid);
  };

  // ── CSV記録UI（REC/STOP トグル + ダウンロード。計測は30秒で自動停止） ──
  const recordToggle = document.getElementById('record_toggle');
  const recordDownload = document.getElementById('record_download');
  let recordAutoStopTimer = null;
  let recordBusy = false;  // start/stop の多重実行防止

  async function startRecording() {
    if (recordBusy || Recorder.recording) return;
    recordBusy = true;
    recordToggle.disabled = true;
    Recorder.rows = [];
    Recorder.coreRows = [];
    Recorder.fifoActiveIds = [];
    Recorder.droppedTotal = 0;
    Recorder.liveDropped = [0, 0];

    // INSOLE: 正式計測APIで FIFO へ原子的に切替（stop後に直前のRealtime設定を復元）
    const ids = connectedInsoleIds();
    const results = await Promise.all(ids.map(async (id) => {
      const session = getInsoleToolkitSession(id);
      if (!session || !session.fifo) return false;
      try {
        await session.startMeasurement({
          profile: 'fifo-recording',
          metadata: { source: 'insole-core-combo' },
        });
        return session.fifoActive;
      } catch (error) {
        console.warn(`INSOLE${id}: failed to start FIFO measurement`, error);
        return false;
      }
    }));
    results.forEach((ok, i) => { if (ok) Recorder.fifoActiveIds.push(ids[i]); });

    Recorder.recording = true;  // ここからCORE行の収集開始
    Recorder.startedAt = performance.now();
    Recorder.windowStartMs = Date.now();
    Recorder.svAtStart = notifyDebug.SENSOR_VALUES || 0;  // 収録窓内のSV受信数計測用
    recordToggle.innerHTML = '<i class="bi bi-stop-fill"></i> STOP';
    recordToggle.classList.replace('btn-outline-danger', 'btn-danger');
    recordToggle.disabled = false;
    recordDownload.disabled = true;
    recordAutoStopTimer = setTimeout(stopRecording, RECORD_LIMIT_MS);
    recordBusy = false;
  }

  async function stopRecording() {
    if (recordBusy || !Recorder.recording) return;
    recordBusy = true;
    recordToggle.disabled = true;
    if (recordAutoStopTimer) {
      clearTimeout(recordAutoStopTimer);
      recordAutoStopTimer = null;
    }
    Recorder.recording = false;  // CORE行の収集停止
    Recorder.windowStopMs = Date.now();
    {
      // CORE受信の切り分け: 収録窓内に SV notify が何回来て、行が何行できたか。
      // packets*4 ≒ rows なら「受かった分は全部記録できている」＝損失は電波/ホスト側。
      // packets*4 ≫ rows なら記録経路（パーサ/コールバック）で落ちている。
      const svPk = (notifyDebug.SENSOR_VALUES || 0) - (Recorder.svAtStart || 0);
      const durSec = (Recorder.windowStopMs - Recorder.windowStartMs) / 1000;
      console.log(`CORE SV during recording: ${svPk} packets in ${durSec.toFixed(1)}s ` +
        `(${(svPk / durSec).toFixed(1)} pk/s = ${(svPk * 4 / durSec).toFixed(0)} Hz) ` +
        `→ core rows: ${Recorder.coreRows.length}`);
    }
    Recorder.draining = true;    // FIFO回収（drain）中表示

    // INSOLE: 計測停止（drain完了までawait）→ 正式計測区間のサンプルを統合行へ。
    // 全デバイス並列で停止する: 逐次stopだと先のデバイスのdrain待ちの間に
    // 後のデバイスの停止目標シリアル（frozen target）が先送りされ、
    // 収録末尾がデバイス間で数秒ズレる（実測: 片側drain 4.5s → もう片側が4.5s長い）。
    await Promise.all(Recorder.fifoActiveIds.map(async (id) => {
      const session = getInsoleToolkitSession(id);
      if (!session) return;
      try {
        const result = await session.stopMeasurement({ reason: 'combo-record' });
        const side = insoleSide(id) ?? '';
        // 再要求で同一serialが二重に含まれることがあるため (serial, packet) で重複除去
        const seen = new Set();
        for (const s of (result.raw?.samples ?? [])) {
          const key = `${s.serial_number}:${s.packet_number}`;
          if (seen.has(key)) continue;
          seen.add(key);
          Recorder.rows.push({
            device: `insole${id}`,
            side,
            t: timeOfDayToEpochMs(s.timestamp ?? s.t),
            serial: s.serial_number,
            packet: s.packet_number,
            press: s.press?.values ? s.press.values.slice(0, 6) : null,
            acc: s.converted_acc ? { x: s.converted_acc.x, y: s.converted_acc.y, z: s.converted_acc.z } : null,
            gyro: s.converted_gyro ? { x: s.converted_gyro.x, y: s.converted_gyro.y, z: s.converted_gyro.z } : null,
          });
        }
        Recorder.droppedTotal += session.fifo ? session.fifo.droppedCount : 0;
      } catch (error) {
        console.warn(`INSOLE${id}: failed to stop FIFO measurement`, error);
      }
    }));

    // 全行を計測窓 [REC時刻, STOP時刻] でトリムして3台の窓を揃える
    // （停止コマンドの遅延で末尾が数秒長く録れるデバイスがあるため。
    //   デバイス時計はPC時刻に同期済み・誤差≒RTT/2なので窓比較が成立する）
    Recorder.rows = Recorder.rows.filter(
      r => r.t != null && r.t >= Recorder.windowStartMs && r.t <= Recorder.windowStopMs
    );

    // CORE行をマージし、全行を timestamp 昇順に
    Recorder.rows.push(...Recorder.coreRows);
    Recorder.coreRows = [];
    Recorder.rows.sort((a, b) => (a.t ?? 0) - (b.t ?? 0));

    Recorder.draining = false;
    recordToggle.innerHTML = '<i class="bi bi-record-fill"></i> REC';
    recordToggle.classList.replace('btn-danger', 'btn-outline-danger');
    recordToggle.disabled = false;
    recordDownload.disabled = Recorder.rows.length === 0;
    if (Recorder.droppedTotal > 0) {
      console.warn(`FIFO recording finished with unrecoverable loss: ${Recorder.droppedTotal}`);
    }
    recordBusy = false;
  }

  recordToggle.addEventListener('click', () => {
    if (Recorder.recording) stopRecording(); else startRecording();
  });
  recordDownload.addEventListener('click', () => Recorder.download());

  // notify(debug) バッジ: URL に ?debug を付けたときだけ表示
  // （SV:0 や未知ヘッダ等、実機トラブルの切り分け用。カウント自体は常時継続）
  if (new URLSearchParams(location.search).has('debug')) {
    document.getElementById('core_notify_debug_badge').classList.remove('d-none');
  }
};

const notifyDebug = { headers: {}, lastSVLength: null, rawDumps: 0 };

// ── 描画（30fps 目安に間引き） ───────────────────────────────────
let lastRender = 0;

function render(now) {
  requestAnimationFrame(render);
  if (now - lastRender < 33) return;
  lastRender = now;

  // INSOLE 圧力（足型ヒートマップ + CoP + 6ch チャート）。window.onload 前は未初期化
  for (let i = 0; i < pressurePanels.length; i++) {
    pressurePanels[i].render();
    if (latest.press[i]) updateSideBadge(i);
  }

  // CORE IMU チャート flush + readout
  if (accFeed && accFeed.flush()) accFeed.chart.update('none');
  if (gyroFeed && gyroFeed.flush()) gyroFeed.chart.update('none');
  const accReadout = document.getElementById('core_acc_readout');
  if (accReadout) {
    accReadout.textContent = latest.acc
      ? `x ${fmtSigned(latest.acc.x, 2)}  y ${fmtSigned(latest.acc.y, 2)}  z ${fmtSigned(latest.acc.z, 2)} G`
      : '-';
  }
  const gyroReadout = document.getElementById('core_gyro_readout');
  if (gyroReadout) {
    gyroReadout.textContent = latest.gyro
      ? `x ${fmtSigned(latest.gyro.x, 1)}  y ${fmtSigned(latest.gyro.y, 1)}  z ${fmtSigned(latest.gyro.z, 1)} deg/s`
      : '-';
  }

  // CSV記録ステータス
  //   記録中: 経過秒 / 上限秒 · CORE行数 + FIFO収集パケット数（±欠損）
  //   drain中: 回収中表示 / 停止後: 統合行数
  const recordStatus = document.getElementById('record_status');
  if (recordStatus) {
    if (Recorder.recording) {
      const sec = Math.floor((performance.now() - Recorder.startedAt) / 1000);
      const fifoPk = Recorder.fifoCollectedTotal();
      const liveLoss = Recorder.liveDropped[0] + Recorder.liveDropped[1];
      const dropped = liveLoss > 0 ? ` !loss:${liveLoss}` : '';
      recordStatus.textContent =
        `● ${sec}s / ${RECORD_LIMIT_MS / 1000}s · core:${Recorder.coreRows.length} fifo:${fifoPk}pk${dropped}`;
    } else if (Recorder.draining) {
      recordStatus.textContent = 'draining… (FIFO回収中)';
    } else {
      recordStatus.textContent = Recorder.rows.length > 0 ? `${Recorder.rows.length} rows` : '';
    }
  }

  const debugEl = document.getElementById('core_notify_debug');
  if (debugEl) {
    const headers = Object.entries(notifyDebug.headers)
      .map(([h, n]) => `${h}:${n}`).join(' ') || 'none';
    debugEl.textContent =
      `SA:${notifyDebug.STEP_ANALYSIS || 0} SV:${notifyDebug.SENSOR_VALUES || 0} ` +
      `hdr[${headers}] len:${notifyDebug.lastSVLength ?? '-'}`;
  }
}
requestAnimationFrame(render);

// ── 補助 ────────────────────────────────────────────────────────
function fmtSigned(v, digits) {
  return (v >= 0 ? '+' : '') + v.toFixed(digits);
}

/**
 * insoles[i] の装着左右（'L'|'R'|null）を device_information から取得
 * @param {number} i
 */
function insoleSide(i) {
  const info = insoles[i].device_information;
  if (!info || typeof info.mount_position === 'undefined') return null;
  return (info.mount_position & 0b1) === 1 ? 'R' : 'L';
}

function updateSideBadge(i) {
  const side = insoleSide(i);
  if (!side) return;
  pressurePanels[i].setFoot(side);   // 足型画像の左右を切替（同一 side なら no-op）
  const panel = document.getElementById(`press_panel${i}`);
  if (panel) panel.style.order = (side === 'L') ? 0 : 1;  // 左足を画面左に（showcase 踏襲）
  const badge = document.getElementById(`side_badge${i}`);
  if (!badge) return;
  badge.textContent = side;
  badge.classList.remove('bg-secondary');
  badge.classList.add(side === 'R' ? 'bg-primary' : 'bg-success');
}
