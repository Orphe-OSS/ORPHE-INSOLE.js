import { BlerpcClient } from './BlerpcClient';
import { WebBluetoothTransport } from '../ble/WebBluetoothTransport';
import { insole } from '../proto/insole';

// Physical layout of the 200 Hz window (see proto/insole.proto):
//   the firmware caches IMU + 6-ch pressure and serves 100 ms windows of
//   ~20 samples each. A live monitor walks time forward one window at a time
//   and skips ahead if it falls behind — the same loop as the Python client's
//   `insole_cli/stream.py` (`monitor`), not the lossless `extract`.
export const WINDOW_MS = 100;
export const SAMPLE_PERIOD_MS = 5; // 200 Hz

const FOOT_NAME: Record<number, 'left' | 'right' | 'unspecified'> = {
  0: 'unspecified',
  1: 'left',
  2: 'right',
};

/** One decoded 200 Hz sample, in the frame shape the viz layer consumes. */
export interface InsoleFrame {
  t: number; // epoch ms (insole clock)
  serial: number; // monotonic sample counter (for CSV / gap detection)
  press: number[] | null; // 6 channels [mV]
  acc: { x: number; y: number; z: number } | null; // [m/s^2]
  gyro: { x: number; y: number; z: number } | null; // [dps]
  // The device streams no orientation, so quat/euler are ESTIMATED on the
  // client from accel + gyro (Madgwick IMU fusion) — see updateMadgwickImu().
  quat: { w: number; x: number; y: number; z: number } | null;
  euler: { pitch: number; roll: number; yaw: number } | null;
}

const DEG2RAD = Math.PI / 180;
const MADGWICK_BETA = 0.1; // filter gain (accel trust vs. gyro drift)

/**
 * One Madgwick IMU update (no magnetometer). `q` is [w,x,y,z]; gyro in rad/s;
 * accel in any unit (it is normalized). Returns the updated, normalized quaternion.
 * Canonical Madgwick (2010) AHRS IMU-only formulation.
 */
export function updateMadgwickImu(
  q: [number, number, number, number],
  gx: number,
  gy: number,
  gz: number,
  ax: number,
  ay: number,
  az: number,
  dt: number,
  beta = MADGWICK_BETA,
): [number, number, number, number] {
  let [q0, q1, q2, q3] = q;

  // Rate of change of quaternion from the gyroscope.
  let qDot0 = 0.5 * (-q1 * gx - q2 * gy - q3 * gz);
  let qDot1 = 0.5 * (q0 * gx + q2 * gz - q3 * gy);
  let qDot2 = 0.5 * (q0 * gy - q1 * gz + q3 * gx);
  let qDot3 = 0.5 * (q0 * gz + q1 * gy - q2 * gx);

  const anorm = Math.hypot(ax, ay, az);
  if (anorm > 0) {
    ax /= anorm;
    ay /= anorm;
    az /= anorm;

    const _2q0 = 2 * q0;
    const _2q1 = 2 * q1;
    const _2q2 = 2 * q2;
    const _2q3 = 2 * q3;
    const _4q0 = 4 * q0;
    const _4q1 = 4 * q1;
    const _4q2 = 4 * q2;
    const _8q1 = 8 * q1;
    const _8q2 = 8 * q2;
    const q0q0 = q0 * q0;
    const q1q1 = q1 * q1;
    const q2q2 = q2 * q2;
    const q3q3 = q3 * q3;

    let s0 = _4q0 * q2q2 + _2q2 * ax + _4q0 * q1q1 - _2q1 * ay;
    let s1 = _4q1 * q3q3 - _2q3 * ax + 4 * q0q0 * q1 - _2q0 * ay - _4q1 + _8q1 * q1q1 + _8q1 * q2q2 + _4q1 * az;
    let s2 = 4 * q0q0 * q2 + _2q0 * ax + _4q2 * q3q3 - _2q3 * ay - _4q2 + _8q2 * q1q1 + _8q2 * q2q2 + _4q2 * az;
    let s3 = 4 * q1q1 * q3 - _2q1 * ax + 4 * q2q2 * q3 - _2q2 * ay;

    const snorm = Math.hypot(s0, s1, s2, s3);
    if (snorm > 0) {
      s0 /= snorm;
      s1 /= snorm;
      s2 /= snorm;
      s3 /= snorm;
      qDot0 -= beta * s0;
      qDot1 -= beta * s1;
      qDot2 -= beta * s2;
      qDot3 -= beta * s3;
    }
  }

  q0 += qDot0 * dt;
  q1 += qDot1 * dt;
  q2 += qDot2 * dt;
  q3 += qDot3 * dt;
  const n = Math.hypot(q0, q1, q2, q3) || 1;
  return [q0 / n, q1 / n, q2 / n, q3 / n];
}

/** Quaternion [w,x,y,z] -> Euler {pitch, roll, yaw} in radians. */
export function quatToEuler(q: [number, number, number, number]): {
  pitch: number;
  roll: number;
  yaw: number;
} {
  const [w, x, y, z] = q;
  const roll = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y));
  const sinp = 2 * (w * y - z * x);
  const pitch = Math.abs(sinp) >= 1 ? (Math.sign(sinp) * Math.PI) / 2 : Math.asin(sinp);
  const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));
  return { pitch, roll, yaw };
}

export interface InsoleConfig {
  deviceId: number;
  deviceIdHex: string;
  foot: 'left' | 'right' | 'unspecified';
  firmwareVersion: string;
}

export interface InsoleClientOptions {
  mtu?: number;
  namePrefix?: string;
  requireEncryption?: boolean;
  pinIdentity?: boolean;
}

/**
 * Outcome of one get_window round trip inside the monitor loop, reported via
 * `startMonitor()`'s `onWindow` so a host can account for every window: how
 * many were delivered, how many the firmware had already evicted (`too_old`,
 * with the number of 200 Hz samples that were skipped and are unrecoverable),
 * how often the loop was caught up (`too_new`), and the BLE round-trip time.
 * For an `ok` window it is reported after that window's frames were emitted.
 */
export interface InsoleWindowInfo {
  // 'aligning' = too_old before any window was delivered (start-up: the cache
  // holds nothing stamped with the clock we just set), so nothing was lost.
  status: 'ok' | 'too_old' | 'too_new' | 'time_not_set' | 'error' | 'aligning';
  startMs: number; // requested window start (insole clock, epoch ms)
  rttMs: number; // get_window round trip (request → decoded response)
  samples: number; // frames emitted for this window (0 unless ok)
  skippedMs: number; // time jumped over because the cache no longer held it (too_old only)
  skippedSamples: number; // skippedMs / SAMPLE_PERIOD_MS — samples lost for good
  oldestMs: number | null; // firmware cache bounds as reported with the response
  newestMs: number | null;
  error?: unknown; // the RPC/BLE error (status 'error' only)
}

export interface InsoleMonitorOptions {
  onError?: (e: unknown) => void;
  onWindow?: (info: InsoleWindowInfo) => void;
}

/** Running counters of one get_gait_live poll, reported via `startGaitMonitor()`'s `onPoll`. */
export interface InsoleGaitPollInfo {
  measuring: boolean;
  sessionId: number;
  steps: number;
  distanceM: number;
  strideSeq: number;
  rttMs: number;
}

/**
 * One completed stride from the firmware gait analyzer (GaitAnalysisCore), as
 * polled from get_gait_live. Physical units, raw values (no presentation sign
 * flip): `pronation` is the analyzer's pronation Euler Y in degrees — the same
 * quantity the product insole publishes as pronation_y — and `strikeAngle` is
 * the foot angle at strike. `gaitType` / `footStrike` are the analyzer enums
 * (GaitType 0 none / 1 walk / 2 run / 3 stance; FootStrike 0 none / 1 heel /
 * 2 midfoot / 3 forefoot).
 */
export interface InsoleGaitStride {
  strideSeq: number; // completed-stride counter within the firmware session (1 = first)
  sessionId: number; // 0 = implicit live session
  steps: number; // completed strides so far this session
  distanceM: number; // sum of stride lengths [m]
  strideLength: number; // [m]
  strideHeight: number; // max vertical height [m]
  speed: number; // [m/s]
  pronation: number; // [deg] raw sign
  strikeAngle: number; // [deg]
  cadence: number; // [steps/s]
  landingForce: number; // [kgf / body weight]
  contactTime: number; // stance phase [s]
  gaitType: number; // GaitType enum value
  footStrike: number; // FootStrike enum value
}

/** Thrown by startGaitMonitor() when the firmware does not run the analyzer for get_gait_live alone. */
export class GaitLiveUnsupportedError extends Error {
  readonly code = 'INSOLE15_GAIT_UNSUPPORTED';
  constructor() {
    super('This firmware does not support live gait analysis (get_gait_live reports measuring = false)');
    this.name = 'GaitLiveUnsupportedError';
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * High-level client for ORPHE INSOLE 1.5. Wraps the generic bleRPC
 * browser client (`BlerpcClient`) with insole-specific helpers: friendly config
 * decoding and a live IMU + pressure monitor that turns `get_window` polling
 * into a stream of frames.
 */
export class InsoleClient extends BlerpcClient {
  private _monitoring = false;
  // Incremented by startMonitor()/stopMonitor()/disconnect(); see startMonitor.
  private _monitorGeneration = 0;
  // Orientation estimate (Madgwick IMU fusion), [w,x,y,z]. Reset per monitor run.
  private _q: [number, number, number, number] = [1, 0, 0, 0];
  private _gaitMonitoring = false;
  // True from startGaitMonitor() entry until its first poll settles, so a second
  // start in that window does not open a second polling loop.
  private _gaitStarting = false;
  // Incremented by every start/stop/disconnect. A polling loop keeps running
  // only while the generation it was started with is current, so a loop that
  // is mid-sleep or mid-RPC when stop() → start() happens exits instead of
  // running alongside the new one.
  private _gaitGeneration = 0;
  // bleRPC request/response is not re-entrant (one shared notify assembler per
  // link), so every RPC — the 100 ms window loop, gait polling, config reads —
  // is queued on one promise chain. A failed call never blocks the next one.
  private _rpcChain: Promise<unknown> = Promise.resolve();

  protected override call(cmdName: string, requestData: Uint8Array): Promise<Uint8Array> {
    const run = () => super.call(cmdName, requestData);
    const p = this._rpcChain.then(run, run);
    this._rpcChain = p.catch(() => undefined);
    return p;
  }

  constructor(options: InsoleClientOptions = {}) {
    super(
      new WebBluetoothTransport({ mtu: options.mtu, namePrefix: options.namePrefix }),
      options.requireEncryption ?? true,
      options.pinIdentity ?? true,
    );
  }

  /** Read the persisted device configuration into a friendly shape. */
  async getConfigInfo(): Promise<InsoleConfig> {
    const g = await this.getConfig();
    const deviceId = Number(g.deviceId) >>> 0;
    return {
      deviceId,
      deviceIdHex: '0x' + deviceId.toString(16).toUpperCase().padStart(8, '0'),
      foot: FOOT_NAME[g.foot as number] ?? 'unspecified',
      firmwareVersion: g.firmwareVersion ?? '',
    };
  }

  /** True while a monitor loop is running. */
  get isMonitoring(): boolean {
    return this._monitoring;
  }

  /**
   * Turn one decoded OK window into per-sample frames, advancing the Madgwick
   * orientation filter one step per sample so each frame carries an estimated
   * quaternion + Euler (the device itself streams no orientation).
   */
  private framesFromWindow(
    resp: insole.GetWindowResponse,
    startMs: number,
    serialBase: number,
  ): InsoleFrame[] {
    const imu = resp.imu ?? [];
    const pressure = resp.pressure ?? [];
    const n = Math.min(imu.length, pressure.length);
    const dt = SAMPLE_PERIOD_MS / 1000;
    const frames: InsoleFrame[] = [];
    for (let i = 0; i < n; i++) {
      const im = imu[i];
      const mv = Array.from(pressure[i].mv ?? []);
      // Wire fields are named by physical axis (sensor X->pitch/lateral,
      // Y->roll/longitudinal, Z->yaw/vertical); the frame keeps raw x/y/z axes.
      const ax = im.accelLateral ?? 0; // sensor X
      const ay = im.accelLongitudinal ?? 0; // sensor Y
      const az = im.accelVertical ?? 0; // sensor Z
      const gx = im.gyroPitch ?? 0; // about sensor X
      const gy = im.gyroRoll ?? 0; // about sensor Y
      const gz = im.gyroYaw ?? 0; // about sensor Z
      this._q = updateMadgwickImu(
        this._q,
        gx * DEG2RAD,
        gy * DEG2RAD,
        gz * DEG2RAD,
        ax,
        ay,
        az,
        dt,
      );
      const [w, qx, qy, qz] = this._q;
      frames.push({
        t: startMs + i * SAMPLE_PERIOD_MS,
        serial: serialBase + i,
        press: mv.length ? mv.slice(0, 6) : null,
        acc: { x: ax, y: ay, z: az },
        gyro: { x: gx, y: gy, z: gz },
        quat: { w, x: qx, y: qy, z: qz },
        euler: quatToEuler(this._q),
      });
    }
    return frames;
  }

  /**
   * Live monitor: set the clock, then repeatedly fetch the newest 100 ms window
   * and emit its samples via `onFrame`. Runs until `stopMonitor()`. This mirrors
   * `insole_cli/stream.py`'s `monitor` — it skips ahead when it falls behind, so
   * it is a live readout, not a lossless capture.
   */
  async startMonitor(
    onFrame: (frame: InsoleFrame) => void,
    opts: InsoleMonitorOptions = {},
  ): Promise<void> {
    if (this._monitoring) return;
    this._monitoring = true;
    // A loop keeps running only while the generation it started with is
    // current: stopMonitor() → startMonitor() within one round trip would
    // otherwise leave the old loop (suspended in getWindow/sleep) alive next to
    // the new one, both emitting frames with their own serials.
    const generation = ++this._monitorGeneration;
    const alive = () => this._monitoring && generation === this._monitorGeneration;
    this._q = [1, 0, 0, 0]; // reset orientation estimate

    const WS = insole.WindowStatus;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    let base = Date.now();
    try {
      await this.setTime({ epochMs: base });
    } catch (e) {
      if (generation === this._monitorGeneration) this._monitoring = false;
      throw e;
    }
    if (!alive()) return;
    let t = base;
    // `serial` counts delivered samples plus the ones the loop had to skip
    // (too_old / clock re-sync), so a gap in the frame serials is a gap in the
    // data and a host can detect loss with `serial !== previous + 1` just like
    // the product insole's packet serials. Within a run of consecutive OK
    // windows it is purely a sample count: the firmware bins the 200 Hz stream
    // into 100 ms windows by its own clock, so a window may carry 19 or 21
    // samples with no loss at all, and a time-based slot count would report
    // phantom gaps there.
    let serial = 0;
    // Until the first window has been delivered, a too_old answer is only the
    // loop aligning itself with the cache (the samples before set_time took
    // effect were never stamped with this clock), not data that was lost.
    let delivered = false;

    while (alive()) {
      const started = now();
      const requestedT = t;
      try {
        const resp = await this.getWindow({ startMs: t });
        const rttMs = now() - started;
        const status = resp.status as number;
        const oldestMs = Number.isFinite(Number(resp.oldestMs)) && Number(resp.oldestMs) > 0 ? Number(resp.oldestMs) : null;
        const newestMs = Number.isFinite(Number(resp.newestMs)) && Number(resp.newestMs) > 0 ? Number(resp.newestMs) : null;
        if (!alive()) break; // stopMonitor()/restart during the round trip: do not emit
        if (status === WS.WINDOW_STATUS_OK) {
          const frames = this.framesFromWindow(resp, t, serial);
          // Advance the cursor before emitting: a throwing host callback must
          // not make the loop re-request (and re-emit) the same window forever.
          serial += frames.length;
          delivered = delivered || frames.length > 0;
          t += WINDOW_MS;
          try {
            for (const f of frames) onFrame(f);
          } catch (e) {
            opts.onError?.(e);
          }
          opts.onWindow?.({ status: 'ok', startMs: requestedT, rttMs, samples: frames.length, skippedMs: 0, skippedSamples: 0, oldestMs, newestMs });
        } else if (status === WS.WINDOW_STATUS_TOO_NEW) {
          opts.onWindow?.({ status: 'too_new', startMs: requestedT, rttMs, samples: 0, skippedMs: 0, skippedSamples: 0, oldestMs, newestMs });
          await sleep(WINDOW_MS); // caught up to live — wait for capture
        } else if (status === WS.WINDOW_STATUS_TOO_OLD) {
          const newest = newestMs ?? t + WINDOW_MS;
          const next = Math.max(t + WINDOW_MS, newest - WINDOW_MS); // fell behind — skip ahead
          const skippedMs = delivered ? next - t : 0;
          const skippedSamples = Math.round(skippedMs / SAMPLE_PERIOD_MS);
          serial += skippedSamples; // evicted windows: unrecoverable, leave the hole in the serials
          t = next;
          opts.onWindow?.({ status: delivered ? 'too_old' : 'aligning', startMs: requestedT, rttMs, samples: 0, skippedMs, skippedSamples, oldestMs, newestMs });
        } else {
          // TIME_NOT_SET (or unspecified) — re-sync the clock. Both clocks are
          // host epoch ms (set_time), so the samples between the window we were
          // about to read and the new base are lost: skip their serials too
          // (unless nothing had been delivered yet — then it is start-up alignment).
          base = Date.now();
          await this.setTime({ epochMs: base });
          if (!alive()) break;
          const skippedMs = delivered ? Math.max(0, base - t) : 0;
          const skippedSamples = Math.round(skippedMs / SAMPLE_PERIOD_MS);
          serial += skippedSamples;
          t = base;
          opts.onWindow?.({ status: 'time_not_set', startMs: requestedT, rttMs, samples: 0, skippedMs, skippedSamples, oldestMs, newestMs });
        }
      } catch (e) {
        if (!alive()) break;
        opts.onError?.(e);
        opts.onWindow?.({ status: 'error', startMs: requestedT, rttMs: now() - started, samples: 0, skippedMs: 0, skippedSamples: 0, oldestMs: null, newestMs: null, error: e });
        await sleep(20); // transient BLE/RPC error — keep going
      }
    }
  }

  /** Stop the monitor loop started by startMonitor(). */
  stopMonitor(): void {
    this._monitoring = false;
    this._monitorGeneration++; // a loop mid-await exits instead of running next to the next one
  }

  /** True while the gait monitor (get_gait_live polling) is running. */
  get isGaitMonitoring(): boolean {
    return this._gaitMonitoring;
  }

  /**
   * Gait monitor: poll get_gait_live every `pollMs` (default 250 ms) and emit
   * each newly completed stride via `onStride`. No measurement session is
   * opened and nothing is recorded on the device: the firmware starts an
   * implicit live session on the first poll, keeps it alive while polled and
   * ends it ~3 s after the last one (its stride counter then restarts from 0,
   * which the loop handles). Can run alongside startMonitor(); all RPCs are
   * serialized. Only the latest completed stride is reported per poll, so
   * strides that complete faster than the poll interval are counted (`steps`)
   * but their metrics are not delivered. The first poll only sets the
   * baseline: a stride that had already completed when monitoring started (for
   * example the last stride of a run stopped < ~3 s earlier, whose live session
   * the firmware still holds) is not reported. Starting again while a start is
   * in flight is a no-op, and stopGaitMonitor() during the first poll means
   * polling never starts.
   * @throws GaitLiveUnsupportedError when the first poll reports
   *   measuring = false — firmware that only runs the analyzer inside a
   *   host-started measurement session (nothing was started on the device).
   */
  async startGaitMonitor(
    onStride: (stride: InsoleGaitStride) => void,
    opts: { pollMs?: number; onError?: (e: unknown) => void; onPoll?: (info: InsoleGaitPollInfo) => void } = {},
  ): Promise<void> {
    if (this._gaitMonitoring || this._gaitStarting) return;
    this._gaitStarting = true;
    const generation = ++this._gaitGeneration;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const pollInfo = (live: insole.GetGaitLiveResponse, rttMs: number): InsoleGaitPollInfo => ({
      measuring: !!live.measuring,
      sessionId: live.sessionId ?? 0,
      steps: live.steps ?? 0,
      distanceM: live.distanceM ?? 0,
      strideSeq: live.strideSeq ?? 0,
      rttMs,
    });
    let first: insole.GetGaitLiveResponse;
    const firstStarted = now();
    try {
      first = await this.getGaitLive();
    } finally {
      // Only this generation may clear the flag: stopGaitMonitor() during the
      // first poll already cleared it for the next start.
      if (generation === this._gaitGeneration) this._gaitStarting = false;
    }
    // stopGaitMonitor() / disconnect() ran while the first
    // poll was in flight: do not start polling.
    if (generation !== this._gaitGeneration) return;
    opts.onPoll?.(pollInfo(first, now() - firstStarted));
    if (!first.measuring) throw new GaitLiveUnsupportedError();
    this._gaitMonitoring = true;
    const pollMs = opts.pollMs ?? 250;
    const alive = () => this._gaitMonitoring && generation === this._gaitGeneration;
    // Baseline, not a new stride: if the previous run stopped < ~3 s ago the
    // firmware's live session is still open and `first.last` is the stride
    // that run already reported. Only strides completed after this poll count.
    let lastSeq = first.strideSeq ?? 0;
    const emit = (live: insole.GetGaitLiveResponse) => {
      const seq = live.strideSeq ?? 0;
      if (seq < lastSeq) lastSeq = 0; // the firmware restarted the live session (idle gap)
      const last = live.last;
      if (seq > lastSeq && last) {
        lastSeq = seq;
        onStride({
          strideSeq: seq,
          sessionId: live.sessionId ?? 0,
          steps: live.steps ?? 0,
          distanceM: live.distanceM ?? 0,
          strideLength: last.strideLength ?? 0,
          strideHeight: last.strideHeight ?? 0,
          speed: last.speed ?? 0,
          pronation: last.pronation ?? 0,
          strikeAngle: last.strikeAngle ?? 0,
          cadence: last.cadence ?? 0,
          landingForce: last.landingForce ?? 0,
          contactTime: last.contactTime ?? 0,
          gaitType: last.gaitType ?? 0,
          footStrike: last.footStrike ?? 0,
        });
      }
    };
    void (async () => {
      while (alive()) {
        await sleep(pollMs);
        if (!alive()) break;
        try {
          const pollStarted = now();
          const live = await this.getGaitLive();
          if (!alive()) break; // stopped (or restarted) while this poll was in flight
          opts.onPoll?.(pollInfo(live, now() - pollStarted));
          emit(live);
        } catch (e) {
          if (alive()) opts.onError?.(e); // transient BLE/RPC error — keep polling
        }
      }
    })();
  }

  /**
   * Stop polling. Nothing is sent to the device: the firmware ends the live
   * session on its own ~3 s after the last poll.
   */
  stopGaitMonitor(): void {
    this._gaitMonitoring = false;
    this._gaitStarting = false; // a start whose first poll is still in flight is abandoned; the next start may proceed
    this._gaitGeneration++;
  }

  disconnect(): void {
    this._monitoring = false;
    this._monitorGeneration++;
    this._gaitMonitoring = false;
    this._gaitStarting = false;
    this._gaitGeneration++;
    super.disconnect();
  }
}
