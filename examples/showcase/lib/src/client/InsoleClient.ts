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
    opts: { onError?: (e: unknown) => void } = {},
  ): Promise<void> {
    if (this._monitoring) return;
    this._monitoring = true;
    this._q = [1, 0, 0, 0]; // reset orientation estimate

    const WS = insole.WindowStatus;
    let base = Date.now();
    await this.setTime({ epochMs: base });
    let t = base;
    let serial = 0;

    while (this._monitoring) {
      try {
        const resp = await this.getWindow({ startMs: t });
        const status = resp.status as number;
        if (status === WS.WINDOW_STATUS_OK) {
          const frames = this.framesFromWindow(resp, t, serial);
          for (const f of frames) onFrame(f);
          serial += frames.length;
          t += WINDOW_MS;
        } else if (status === WS.WINDOW_STATUS_TOO_NEW) {
          await sleep(WINDOW_MS); // caught up to live — wait for capture
        } else if (status === WS.WINDOW_STATUS_TOO_OLD) {
          const newest = Number(resp.newestMs) || t + WINDOW_MS;
          t = Math.max(t + WINDOW_MS, newest - WINDOW_MS); // fell behind — skip ahead
        } else {
          // TIME_NOT_SET (or unspecified) — re-sync the clock.
          base = Date.now();
          await this.setTime({ epochMs: base });
          t = base;
        }
      } catch (e) {
        opts.onError?.(e);
        await sleep(20); // transient BLE/RPC error — keep going
      }
    }
  }

  /** Stop the monitor loop started by startMonitor(). */
  stopMonitor(): void {
    this._monitoring = false;
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
    opts: { pollMs?: number; onError?: (e: unknown) => void } = {},
  ): Promise<void> {
    if (this._gaitMonitoring || this._gaitStarting) return;
    this._gaitStarting = true;
    const generation = ++this._gaitGeneration;
    let first: insole.GetGaitLiveResponse;
    try {
      first = await this.getGaitLive();
    } finally {
      this._gaitStarting = false;
    }
    // stopGaitMonitor() / disconnect() ran while the first
    // poll was in flight: do not start polling.
    if (generation !== this._gaitGeneration) return;
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
          const live = await this.getGaitLive();
          if (!alive()) break; // stopped (or restarted) while this poll was in flight
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
    this._gaitGeneration++;
  }

  disconnect(): void {
    this._monitoring = false;
    this._gaitMonitoring = false;
    this._gaitGeneration++;
    super.disconnect();
  }
}
