export type InsoleStreamingMode = 1 | 3 | 4;
export type InsoleSetupName = 'DEVICE_INFORMATION' | 'DATE_TIME' | 'SENSOR_VALUES';
export type InsoleBeginType = 'SENSOR_VALUES';

export interface InsoleBluetoothRemoteGATTCharacteristic extends EventTarget {
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    startNotifications(): Promise<InsoleBluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<InsoleBluetoothRemoteGATTCharacteristic>;
}

export interface InsoleBluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<InsoleBluetoothRemoteGATTServer>;
    disconnect(): void;
}

export interface InsoleBluetoothDevice extends EventTarget {
    id?: string;
    name?: string;
    gatt: InsoleBluetoothRemoteGATTServer;
    watchAdvertisements?: () => Promise<void>;
}

export interface InsoleBluetoothAdvertisingEvent extends Event {
    device: InsoleBluetoothDevice;
    rssi?: number;
    txPower?: number;
    manufacturerData: Map<number, DataView>;
}

export interface InsoleSampleBase {
    timestamp: number;
    serial_number: number;
    packet_number: number;
}

export interface InsolePressSample extends InsoleSampleBase {
    values: number[];
}

export interface InsoleVector3 {
    x: number;
    y: number;
    z: number;
}

export interface InsoleVector3Sample extends InsoleVector3, InsoleSampleBase {}

export interface InsoleQuatSampleBase {
    w: number;
    x: number;
    y: number;
    z: number;
}

export interface InsoleQuatSample extends InsoleQuatSampleBase, InsoleSampleBase {}

export interface InsoleEuler {
    pitch: number;
    roll: number;
    yaw: number;
}

export interface InsoleDeviceInformation {
    battery: number;
    mount_position: number;
    range: {
        acc: number;
        gyro: number;
    };
    raw: DataView;
}

export interface InsoleStatus {
    name: string;
    rssi: number;
    txPower: number;
    id: string;
    battery: number;
    model_type: number;
    mounting_position: number;
    human_activity_recognition: number;
    version: string;
}

export interface ReconnectAttemptInfo {
    attempt: number;
    maxAttempts: number;
    intervalMs: number;
}

export interface ReconnectSuccessInfo {
    attempt: number;
    maxAttempts: number;
    elapsedMs: number;
    result: string;
}

export interface ReconnectFailedInfo {
    maxAttempts: number;
    elapsedMs: number;
    error: unknown;
}

export type InsoleConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type InsoleErrorCode = 'NO_DEVICE' | 'ALREADY_DISCONNECTED' | 'CONNECT_TIMEOUT' | 'INVALID_MODE';

/** onError に渡される code 付き Error（メッセージ文字列は従来互換） */
export interface InsoleError extends Error {
    code: InsoleErrorCode;
}

export interface InsoleBeginOptions {
    streamingMode?: InsoleStreamingMode;
    /**
     * GATT 接続のタイムアウト [ms]（opt-in・既定なし = 従来どおり無制限）。
     * 超過時は code 'CONNECT_TIMEOUT' の Error で reject される。
     */
    connectTimeoutMs?: number;
    /** @deprecated Use streamingMode. */
    dataStreamingMode?: InsoleStreamingMode;
    autoReconnect?: boolean;
    reconnectIntervalMs?: number;
    reconnectMaxAttempts?: number;
    forceDeviceSelection?: boolean;
}

export interface InsoleSetupOptions {
    /**
     * 省略・部分指定可。実装側で既定値
     * `{ enabled: false, max_consecutive_missing: 1 }` とマージされる。
     */
    interpolation?: {
        enabled?: boolean;
        max_consecutive_missing?: number;
    };
}

export interface ParseInsoleSensorValuesOptions {
    gyroRange?: number;
    accRange?: number;
}

export interface InsoleParsedSample extends InsoleSampleBase {
    quat?: InsoleQuatSample;
    gyro?: InsoleVector3Sample;
    acc?: InsoleVector3Sample;
    press?: InsolePressSample;
    converted_gyro?: InsoleVector3Sample;
    converted_acc?: InsoleVector3Sample;
}

export interface InsoleSensorPacket {
    header: number;
    serial_number: number;
    timestamp: number;
    samples: InsoleParsedSample[];
}

export interface InsoleGait {
    type: number;
    direction: number;
    calorie: number;
    distance: number;
    steps: number;
    standing_phase_duration: number;
    swing_phase_duration: number;
}

export interface InsoleStride extends InsoleVector3 {
    foot_angle: number;
    steps: number;
}

export interface InsolePronation extends InsoleVector3 {
    landing_impact: number;
    steps: number;
}

export interface InsoleValuePayload {
    value: number;
}

export class FixedSizeArray<T = unknown> {
    constructor(size: number);
    size: number;
    array: T[];
    setSize(size: number): void;
    push(element: T): void;
    getArray(): T[];
}

export class OrpheTimestamp {
    constructor();
    start: number;
    millis(): number;
    getHz(): number;
}

export function parseInsoleSensorValues(data: DataView, options?: ParseInsoleSensorValuesOptions): InsoleSensorPacket | null;

export class OrpheInsole {
    constructor(id?: number);

    static parseSensorValues(data: DataView, options?: ParseInsoleSensorValuesOptions): InsoleSensorPacket | null;

    readonly ORPHE_INFORMATION: string;
    readonly ORPHE_DEVICE_INFORMATION: string;
    readonly ORPHE_DATE_TIME: string;
    readonly ORPHE_OTHER_SERVICE: string;
    readonly ORPHE_SENSOR_VALUES: string;
    readonly ORPHE_STEP_ANALYSIS: string;

    debug: boolean;
    id: number;
    bluetoothDevice: InsoleBluetoothDevice | null;
    dataCharacteristic: InsoleBluetoothRemoteGATTCharacteristic | null;
    dataChangedEventHandlerMap: Record<string, EventListener>;
    hashUUID: Record<string, { serviceUUID: string; characteristicUUID: string }>;
    hashUUID_lastConnected?: string;
    array_device_information: DataView;
    device_information: InsoleDeviceInformation | '';
    date_time?: { date: Date; raw: DataView; round_trip_time: number };
    notification_type?: InsoleBeginType;
    streaming_mode?: InsoleStreamingMode;
    serial_number?: number;
    half_round_trip_time: number;
    isFirstAdvertisementReceived: boolean;

    gait: InsoleGait;
    stride: InsoleStride;
    pronation: InsolePronation;
    steps_number: number;
    quat: InsoleQuatSample | InsoleQuatSampleBase;
    delta: InsoleVector3;
    euler: InsoleEuler;
    gyro: InsoleVector3Sample | InsoleVector3;
    acc: InsoleVector3Sample | InsoleVector3;
    press: InsolePressSample | { values: number[] };
    converted_gyro: InsoleVector3Sample | InsoleVector3;
    converted_acc: InsoleVector3Sample | InsoleVector3;
    interpolation: {
        enabled: boolean;
        max_consecutive_missing: number;
    };
    history_sensor_values: {
        acc: FixedSizeArray<InsoleVector3Sample | InsoleVector3>;
        gyro: FixedSizeArray<InsoleVector3Sample | InsoleVector3>;
        quat: FixedSizeArray<InsoleQuatSample | InsoleQuatSampleBase>;
        press: FixedSizeArray<InsolePressSample | { values: number[] }>;
        converted_acc: FixedSizeArray<InsoleVector3Sample | InsoleVector3>;
        converted_gyro: FixedSizeArray<InsoleVector3Sample | InsoleVector3>;
    };

    setup(names?: InsoleSetupName[], options?: InsoleSetupOptions): void;
    begin(type?: InsoleBeginType, options?: InsoleBeginOptions): Promise<string>;
    begin(options: InsoleBeginOptions): Promise<string>;
    stop(): void;
    reset(): void;
    clear(): void;
    disconnect(): void;
    setUUID(name: string, serviceUUID: string, characteristicUUID: string): void;
    selectBluetoothDevice(uuid?: InsoleSetupName): Promise<void>;
    forgetLastBluetoothDevice(): void;
    resetAnalysisLogs(): void;
    isConnected(): boolean;
    /** 接続状態（UI 表示用）。'reconnecting' は自動再接続の試行中 */
    readonly connectionState: InsoleConnectionState;
    isGotDataOverridden(): boolean;
    scan(uuid: InsoleSetupName, options?: InsoleBeginOptions): Promise<void>;
    requestDevice(uuid: InsoleSetupName): Promise<void>;
    connectGATT(uuid: InsoleSetupName): Promise<void>;
    read(uuid: InsoleSetupName, options?: InsoleBeginOptions): Promise<DataView>;
    write(uuid: InsoleSetupName, array_value: ArrayLike<number>, options?: InsoleBeginOptions): Promise<void>;
    startNotify(uuid: InsoleSetupName, options?: InsoleBeginOptions): Promise<void>;
    stopNotify(uuid: InsoleSetupName, options?: InsoleBeginOptions): Promise<void>;
    dataChanged(self: this, uuid: InsoleSetupName): (event: Event & { target: EventTarget & { value: DataView } }) => void;
    onRead(data: DataView, uuid: InsoleSetupName): void;
    setDataStreamingMode(mode?: InsoleStreamingMode, options?: InsoleBeginOptions): Promise<void>;
    syncCoreTime(n?: number, options?: InsoleBeginOptions): Promise<{
        sum_round_trip_time: number;
        average_round_trip_time: number;
        standard_time: number;
        adjusted_time: number;
        round_trip_times: number[];
    }>;
    syncCoreTime(options: InsoleBeginOptions): Promise<{
        sum_round_trip_time: number;
        average_round_trip_time: number;
        standard_time: number;
        adjusted_time: number;
        round_trip_times: number[];
    }>;
    setDateTime(set_date: Date, options?: InsoleBeginOptions): Promise<void>;
    getDateTime(options?: InsoleBeginOptions): Promise<{ date: Date; raw: DataView; round_trip_time: number }>;
    getDeviceInformation(options?: InsoleBeginOptions): Promise<InsoleDeviceInformation>;
    setDeviceInformation(obj: object): void;
    autoStartWatchingAdvertisements(): Promise<void>;
    startWatchingAdvertisements(): void;
    stopWatchingAdvertisements(): void;
    onAdvertisementReceived(event: InsoleBluetoothAdvertisingEvent): void;

    gotData: (data: DataView, uuid?: InsoleSetupName) => void;
    gotStatus: (status: InsoleStatus) => void;
    gotPress: (press: InsolePressSample) => void;
    gotQuat: (quat: InsoleQuatSample) => void;
    gotGyro: (gyro: InsoleVector3Sample) => void;
    gotAcc: (acc: InsoleVector3Sample) => void;
    gotConvertedGyro: (gyro: InsoleVector3Sample) => void;
    gotConvertedAcc: (acc: InsoleVector3Sample) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotDelta: (delta: InsoleVector3) => void;
    gotEuler: (euler: InsoleEuler) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotGait: (gait: InsoleGait) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotType: (type: InsoleValuePayload) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotDirection: (direction: InsoleValuePayload) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotCalorie: (calorie: InsoleValuePayload) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotDistance: (distance: InsoleValuePayload) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotStandingPhaseDuration: (standing_phase_duration: unknown) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotSwingPhaseDuration: (swing_phase_duration: unknown) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotStride: (stride: InsoleStride) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotFootAngle: (foot_angle: InsoleValuePayload) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotPronation: (pronation: InsolePronation) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotLandingImpact: (landing_impact: InsoleValuePayload) => void;
    /** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */
    gotStepsNumber: (steps_number: InsoleValuePayload) => void;
    lostData: (serial_number: number, serial_number_prev: number) => void;
    onScan: (deviceName: string) => void;
    onConnectGATT: (uuid: InsoleSetupName) => void;
    onConnect: (uuid: InsoleSetupName) => void;
    onWrite: (uuid: InsoleSetupName) => void;
    onStartNotify: (uuid: InsoleSetupName) => void;
    onStopNotify: (uuid: InsoleSetupName) => void;
    onDisconnect: (event?: Event) => void;
    onReconnectAttempt: (info: ReconnectAttemptInfo) => void;
    onReconnectSuccess: (info: ReconnectSuccessInfo) => void;
    onReconnectFailed: (info: ReconnectFailedInfo) => void;
    onAdvertisement: (event: InsoleBluetoothAdvertisingEvent) => void;
    gotBLEFrequency: (frequency: number) => void;
    onClear: () => void;
    onReset: () => void;
    onError: (error: unknown) => void;
}

export { OrpheInsole as Orphe };

// ── InsoleSimulator (src/InsoleSimulator.js) — 実機なし開発・デモ基盤 ──

export interface InsoleSimulatorFrame {
    device?: number;
    t?: number;
    serial?: number;
    packet_number?: number;
    press?: number[] | null;
    acc?: InsoleVector3 | null;
    gyro?: InsoleVector3 | null;
    quat?: InsoleQuatSampleBase | null;
    euler?: InsoleEuler | null;
}

export interface InsoleSimulatorBeginOptions {
    streamingMode?: InsoleStreamingMode;
    /** 合成データのプリセット（既定 'walk'）。frames 指定時は無視される */
    preset?: 'walk' | 'stand' | 'sway';
    /** CSV等から作ったフレーム配列の再生 */
    frames?: InsoleSimulatorFrame[];
    /** frames 再生をループするか（既定 true） */
    loop?: boolean;
}

export declare class OrpheInsoleSimulator {
    constructor(id?: number);
    id: number;
    debug: boolean;
    device_information: InsoleDeviceInformation | { battery: number; mount_position: number; range: { acc: number; gyro: number } } | null;
    streaming_mode?: InsoleStreamingMode;
    setup(names?: InsoleSetupName[], options?: InsoleSetupOptions): this;
    begin(type?: InsoleBeginType, options?: InsoleSimulatorBeginOptions): Promise<string>;
    begin(options: InsoleSimulatorBeginOptions): Promise<string>;
    stop(): string;
    reset(): void;
    isConnected(): boolean;
    setDataStreamingMode(mode: InsoleStreamingMode): Promise<void>;
    getDeviceInformation(): Promise<{ battery: number; mount_position: number; range: { acc: number; gyro: number } }>;
    resetAnalysisLogs(): void;

    gotPress: (press: InsolePressSample) => void;
    gotAcc: (acc: InsoleVector3Sample) => void;
    gotGyro: (gyro: InsoleVector3Sample) => void;
    gotQuat: (quat: InsoleQuatSample) => void;
    gotEuler: (euler: InsoleEuler & InsoleSampleBase) => void;
    gotConvertedAcc: (acc: InsoleVector3Sample) => void;
    gotConvertedGyro: (gyro: InsoleVector3Sample) => void;
    gotBLEFrequency: (frequency: number) => void;
    lostData: (serial_number: number, serial_number_prev: number) => void;
    onConnect: (uuid: string) => void;
    onDisconnect: () => void;
    onError: (error: unknown) => void;
    onScan: (deviceName: string) => void;
    onStartNotify: (uuid: string) => void;
    onReset: () => void;
}

// ── InsoleFifo (src/InsoleFifo.js) — FIFO（ロスレス）センサーデータ収集 ──

export interface InsoleFifoSample {
    serial_number: number;
    packet_number: number;
    /** デバイス時刻ベースのミリ秒（当日 00:00 起点 + フレーム間 5ms オフセット） */
    t: number;
    converted_gyro: InsoleVector3;
    converted_acc: InsoleVector3;
    press: InsolePressSample;
}

export interface InsoleFifoOptions {
    /** モニタ開始後にバッファへ蓄積を待つ時間[ms]（既定 1000） */
    startupDelayMs?: number;
    /** 回復不能な欠損が発生した時点で収録を自動停止する（既定 false） */
    stopOnLoss?: boolean;
    /**
     * stop()（手動停止）後、未回収シリアルの再要求だけを続けて FW リングバッファから
     * 回収する「回収フェーズ（drain）」のタイムアウト[ms]（既定 3000、0 で無効＝従来動作）。
     * 未回収が無ければ即座に抜けるため、欠損のない正常系では stop() の遅延は実質ゼロ。
     * stopOnLoss 自動停止・切断・例外では発動しない。
     */
    drainTimeoutMs?: number;
}

export interface InsoleFifoProgress {
    collected: number;
    lastReceived: number;
    /** ポーリング前に停止した回収フェーズ中は null になりうる */
    currentSerial: number | null;
    /** 追従遅れ（未取得シリアル数）。大きいほど欠損の危険が高い */
    lag: number;
    /** 回復不能に失われた累計シリアル数 */
    dropped: number;
    /** stop() 後の回収フェーズ（drain）中の進捗なら true */
    draining?: boolean;
}

export interface InsoleFifoDataLoss {
    /**
     * 'ring_overflow'（追従遅れでFWバッファ上書き）| 'carryover_overflow'（再要求キュー溢れ）|
     * 'fw_nodata'（FWバッファから消失）| 'resync_backlog'（再同期時に要求しきれなかった分）|
     * 'stopped_pending'（再要求が成功しないまま収録停止した分）
     */
    reason: 'ring_overflow' | 'carryover_overflow' | 'fw_nodata' | 'resync_backlog' | 'stopped_pending';
    /** このイベントで失われたシリアル数 */
    dropped: number;
    /** 失われた累計シリアル数 */
    cumulative: number;
    /** イベント時点の FW 側シリアル（'stopped_pending' でポーリング前に停止した場合は null） */
    currentSerial: number | null;
}

export interface InsoleFifoAnomaly {
    startSerial: number;
    requestSize: number;
    currentSerial: number;
    received: number;
    expected: number;
    noData: number;
    bleLoss: number;
    confirmedLost: number;
    newNoData: number;
}

export declare class OrpheInsoleFifo {
    constructor(insole: OrpheInsole, options?: InsoleFifoOptions);
    readonly deviceId: number;
    readonly collectedCount: number;
    /** 回復不能に失われた累計シリアル数（0 なら欠損なし） */
    readonly droppedCount: number;
    /** 現在の追従遅れ（未取得シリアル数） */
    lag: number;
    /** 回復不能な欠損が発生した時点で収録を自動停止するか */
    stopOnLoss: boolean;
    /** 収集したパケットのデコード結果（ライブ可視化用） */
    onSamples: ((deviceId: number, samples: InsoleFifoSample[]) => void) | null;
    onProgress: ((info: InsoleFifoProgress) => void) | null;
    onAnomaly: ((info: InsoleFifoAnomaly) => void) | null;
    /** 回復不能な欠損が起きたとき呼ばれる（気づかない欠損を防ぐ） */
    onDataLoss: ((info: InsoleFifoDataLoss) => void) | null;
    /**
     * 収集終了時に呼ばれる（stopOnLoss による自動停止の検知に使う）。
     * drainRecovered は stop() 後の回収フェーズ（drain）で救えたシリアル数。
     */
    onStopped: ((info: { reason: 'manual' | 'loss'; dropped: number; collected: number; drainRecovered: number }) => void) | null;
    onError: ((error: unknown) => void) | null;
    /** FIFO 収集を開始（SENSOR_VALUES 通知は begin() 済みであること） */
    start(): Promise<boolean>;
    /** 収集を停止し、直前のリアルタイムモードへ復帰。収集した raw ストアを返す */
    stop(): Promise<Map<number, DataView>>;
    /** 収集データを参照実装互換の CSV 文字列にする（timestamp 昇順） */
    toCSV(): string;
    /** ブラウザで CSV をダウンロードする */
    download(filename?: string): void;

    static readonly CSV_HEADER: string;
    static readonly READ_MODE_FIFO: number;
    static serialDistance(startExclusive: number, endInclusive: number): number;
    static buildRequestsFromSerials(serials: Iterable<number>): Array<[number, number]>;
    static createGetSensorDataRequest(pairs: Array<[number, number]>): Uint8Array;
    static parseCurrentSerial(dv: DataView): { serial: number; watermark: number; accumulated: number } | null;
    static parseNoDataResponse(dv: DataView): [number, number] | null;
    static extractSerialIfSensorPacket(dv: DataView): number | null;
    static decodePacket(dv: DataView): { serial: number; timestamp: number; samples: InsoleFifoSample[] };
    static packetToCsvRows(dv: DataView): string[];
    static pressureToN(x: number, channel: number): number;
}

type OrpheInsoleFifoConstructor = typeof OrpheInsoleFifo;

// ── InsoleGait (src/InsoleGait.js) — 歩容解析(StrideAnalyzer)のリアルタイム取得 ──

export type GaitType = 'none' | 'walk' | 'run' | 'stance' | 'unknown';
export type StrideDirection = 'none' | 'forward' | 'backward' | 'inside' | 'outside' | 'unknown';
export type FootStrike = 'none' | 'heelStrike' | 'midfoot' | 'forefoot';
export type PronationType = 'none' | 'neutral' | 'over' | 'severeOver' | 'under' | 'severeUnder';

export interface InsoleGaitOverview {
    type: 'overview';
    subheader: 0;
    step_number: number;
    gait_type: GaitType;
    stride_direction: StrideDirection;
    calorie: number | null;
    distance_m: number | null;
    stance_phase_s: number | null;
    swing_phase_s: number | null;
}
export interface InsoleGaitStride {
    type: 'stride';
    subheader: 1;
    step_number: number;
    foot_angle: number | null;
    stride_x: number | null;
    stride_y: number | null;
    stride_z: number | null;
}
export interface InsoleGaitPronation {
    type: 'pronation';
    subheader: 2;
    step_number: number;
    landing_force: number | null;
    pronation_x: number | null;
    pronation_y: number | null;
    pronation_z: number | null;
}
export interface InsoleGaitMotion {
    type: 'motion';
    subheader: 4;
    step_number: number;
    gait_cycle_phase: number;
    gait_cycle_period: number;
    gait_cycle_event: number;
    quat_w: number | null;
    quat_x: number | null;
    quat_y: number | null;
    quat_z: number | null;
    delta_x: number | null;
    delta_y: number | null;
    delta_z: number | null;
}
export type InsoleGaitPacket = InsoleGaitOverview | InsoleGaitStride | InsoleGaitPronation | InsoleGaitMotion;

/** 1歩ぶんに集約した歩容パラメーター（overview + stride + pronation + 派生指標） */
export interface InsoleGaitRow {
    step_number: number;
    gait_type: GaitType;
    stride_direction: StrideDirection;
    distance_m: number | null;
    stance_phase_s: number | null;
    swing_phase_s: number | null;
    duration_s: number | null;
    cadence_hz: number | null;
    speed_mps: number | null;
    foot_angle_deg: number | null;
    stride_x_m: number | null;
    stride_y_m: number | null;
    stride_z_m: number | null;
    stride_norm_m: number | null;
    landing_force: number | null;
    strike_angle_deg: number | null;
    foot_strike: FootStrike;
    pronation_deg: number | null;
    pronation_type: PronationType;
    pronation_z_deg: number | null;
    calorie: number | null;
}

export interface InsoleGaitOptions {
    /** STEP_ANALYSIS の service UUID（既定は insole.ORPHE_OTHER_SERVICE） */
    serviceUUID?: string;
    /** STEP_ANALYSIS の characteristic UUID（既定は insole.ORPHE_STEP_ANALYSIS） */
    characteristicUUID?: string;
}

export declare class OrpheInsoleGait {
    constructor(insole: OrpheInsole, options?: InsoleGaitOptions);
    readonly deviceId: number;
    readonly stepCount: number;
    readonly isRunning: boolean;
    rows: InsoleGaitRow[];
    /** 1歩ごとの歩容パラメーター（overview+stride+pronation 集約後） */
    onGait: ((deviceId: number, row: InsoleGaitRow) => void) | null;
    /** motion（クォータニオン・微小変位・歩行サイクル、〜50Hz） */
    onMotion: ((deviceId: number, motion: InsoleGaitMotion) => void) | null;
    /** デコード済みの全パケット */
    onRaw: ((deviceId: number, packet: InsoleGaitPacket) => void) | null;
    onError: ((error: unknown) => void) | null;
    /** 歩容解析の notify を開始（SENSOR_VALUES は begin() 済みであること） */
    start(): Promise<boolean>;
    /** 歩容解析の notify を停止 */
    stop(): Promise<void>;
    /** 集めた歩容パラメーターを CSV 文字列にする */
    toCSV(): string;
    /** ブラウザで CSV をダウンロードする */
    download(filename?: string): void;

    static readonly STEP_ANALYSIS_CHAR_UUID: string;
    static readonly CSV_HEADER: string;
    static decodeAnalysisPacket(dv: DataView): InsoleGaitPacket | null;
    static buildGaitRow(stepNumber: number, parts: { overview: unknown; stride: unknown; pronation: unknown }): InsoleGaitRow;
    static strideNorm(stride: { stride_x: number | null; stride_y: number | null; stride_z: number | null }): number | null;
    static footStrikeToStr(strikeAngle: number | null): FootStrike;
    static pronationToStr(pronationY: number | null): PronationType;
    static gaitTypeToStr(value: number): GaitType;
    static strideDirectionToStr(value: number): StrideDirection;
    static f16be(dv: DataView, offset: number): number;
    static gaitRowToCsv(row: InsoleGaitRow): string;
}

type OrpheInsoleGaitConstructor = typeof OrpheInsoleGait;

export type InsoleSensorDataMode = 'realtime' | 'fifo';

export interface InsoleToolkitOutputs {
    sensorValues?: boolean;
    stepAnalysis?: boolean;
}

export interface InsoleToolkitFifoOptions extends InsoleFifoOptions {
    onSamples?: (deviceId: number, samples: InsoleFifoSample[]) => void;
    onProgress?: (info: InsoleFifoProgress) => void;
    onAnomaly?: (info: InsoleFifoAnomaly) => void;
    onDataLoss?: (info: InsoleFifoDataLoss) => void;
    onStopped?: (info: { reason: 'manual' | 'loss'; dropped: number; collected: number; drainRecovered: number }) => void;
    onError?: (error: unknown) => void;
}

export interface InsoleToolkitGaitOptions extends InsoleGaitOptions {
    onGait?: (deviceId: number, row: InsoleGaitRow) => void;
    onMotion?: (deviceId: number, motion: InsoleGaitMotion) => void;
    onRaw?: (deviceId: number, packet: InsoleGaitPacket) => void;
    onError?: (error: unknown) => void;
}

export interface InsoleToolkitSessionState {
    connected: boolean;
    transitioning: boolean;
    streamingMode: InsoleStreamingMode;
    sensorDataMode: InsoleSensorDataMode;
    outputs: Required<InsoleToolkitOutputs>;
    sensorNotifyActive: boolean;
    fifoActive: boolean;
    gaitActive: boolean;
    supportsFifo: boolean;
    supportsStepAnalysis: boolean;
    lastError: unknown | null;
}

export interface BuildInsoleToolkitOptions extends InsoleBeginOptions {
    /** true にすると実機の代わりに OrpheInsoleSimulator を使う（要 InsoleSimulator.js） */
    simulator?: boolean;
    /** SENSOR_VALUES の取得経路。FIFO は InsoleFifo.js の読み込みが必要 */
    sensorDataMode?: InsoleSensorDataMode;
    /** Sensor Values / Step Analysis の出力選択（最低1つ必要） */
    outputs?: InsoleToolkitOutputs;
    /** FIFO の収集設定とコールバック */
    fifo?: InsoleToolkitFifoOptions;
    /** Step Analysis の購読設定とコールバック */
    gait?: InsoleToolkitGaitOptions;
    /** Toolkit の状態遷移後に呼ばれる */
    onStateChange?: (state: InsoleToolkitSessionState) => void;
    /** Toolkit または統合モジュールのエラー */
    onError?: (error: unknown, state: InsoleToolkitSessionState) => void;
}

export declare class InsoleToolkitSession {
    constructor(
        insole: OrpheInsole | OrpheInsoleSimulator,
        options?: BuildInsoleToolkitOptions,
        adapters?: {
            FifoClass?: OrpheInsoleFifoConstructor | null;
            GaitClass?: OrpheInsoleGaitConstructor | null;
        }
    );
    readonly insole: OrpheInsole | OrpheInsoleSimulator;
    streamingMode: InsoleStreamingMode;
    sensorDataMode: InsoleSensorDataMode;
    outputs: Required<InsoleToolkitOutputs>;
    connected: boolean;
    transitioning: boolean;
    sensorNotifyActive: boolean;
    fifoActive: boolean;
    gaitActive: boolean;
    lastError: unknown | null;
    readonly supportsFifo: boolean;
    readonly supportsStepAnalysis: boolean;
    readonly fifo: OrpheInsoleFifo | null;
    readonly gait: OrpheInsoleGait | null;
    snapshot(): InsoleToolkitSessionState;
    setFifoCallbacks(callbacks?: InsoleToolkitFifoOptions): void;
    setGaitCallbacks(callbacks?: InsoleToolkitGaitOptions): void;
    connect(options?: InsoleBeginOptions): Promise<string | void>;
    disconnect(): Promise<void>;
    setOutputs(outputs: InsoleToolkitOutputs): Promise<void>;
    setSensorDataMode(mode: InsoleSensorDataMode): Promise<void>;
    setStreamingMode(mode: InsoleStreamingMode): Promise<void>;
    reapplyAfterReconnect(): Promise<void>;
    markDisconnected(): void;
}

type OrpheInsoleConstructor = typeof OrpheInsole;
type OrpheInsoleSimulatorConstructor = typeof OrpheInsoleSimulator;
type FixedSizeArrayConstructor = typeof FixedSizeArray;
type OrpheTimestampConstructor = typeof OrpheTimestamp;
type ParseInsoleSensorValues = typeof parseInsoleSensorValues;
type BuildInsoleToolkit = (
    parent_element: Element,
    title: string,
    insole_id?: number,
    options?: BuildInsoleToolkitOptions
) => void;

declare global {
    var OrpheInsole: OrpheInsoleConstructor;
    var Orphe: OrpheInsoleConstructor;
    var OrpheInsoleSimulator: OrpheInsoleSimulatorConstructor;
    var OrpheInsoleFifo: OrpheInsoleFifoConstructor;
    var OrpheInsoleGait: OrpheInsoleGaitConstructor;
    var insoles: Array<OrpheInsole | OrpheInsoleSimulator>;
    var bles: Array<OrpheInsole | OrpheInsoleSimulator>;
    var cores: Array<OrpheInsole | OrpheInsoleSimulator>;
    var insoleToolkitSessions: Array<InsoleToolkitSession | null>;
    var FixedSizeArray: FixedSizeArrayConstructor;
    var OrpheTimestamp: OrpheTimestampConstructor;
    var parseInsoleSensorValues: ParseInsoleSensorValues;
    var buildInsoleToolkit: BuildInsoleToolkit;
    var getInsoleToolkitSession: (insole_id: number) => InsoleToolkitSession | null;
}

// ── InsoleUtils (src/InsoleUtils.js) — 圧力データ処理ユーティリティ ──

export interface InsolePressValidation {
    ok: boolean;
    /** クランプ・補完済みの安全な6要素配列 */
    values: number[];
    flags: Array<'BAD_LENGTH' | 'NOT_FINITE' | 'NEGATIVE' | 'SATURATED_CH'>;
    channels: { saturated: number[] };
}

export interface InsoleSensorPoint {
    x: number;
    y: number;
    label?: string;
}

export interface InsoleCoP {
    x: number;
    y: number;
    load: number;
    isValid: boolean;
    flags: string[];
}

export interface InsoleContactDownEvent {
    event: 'down';
    timestamp: number;
    flightMs: number | null;
}

export interface InsoleContactUpEvent {
    event: 'up';
    timestamp: number;
    stanceMs: number | null;
}

export interface InsoleMountInfo {
    side: 'left' | 'right';
    surface: 'plantar' | 'dorsal';
    isRight: boolean;
    isDorsal: boolean;
}

export declare class InsolePressureCalibrator {
    zero: number[];
    full: number[];
    isCalibrated(): boolean;
    setZero(samples: number[][]): void;
    setFull(samples: number[][]): void;
    normalize(values: number[]): number[];
    toJSON(): { zero: number[]; full: number[] };
    static fromJSON(json: { zero: number[]; full: number[] } | null): InsolePressureCalibrator;
}

export declare class InsoleContactDetector {
    constructor(options: { on: number; off: number; minContactMs?: number; minFlightMs?: number });
    on: number;
    off: number;
    isContact: boolean;
    footDown: (info: InsoleContactDownEvent) => void;
    footUp: (info: InsoleContactUpEvent) => void;
    update(total: number, timestampMs: number): InsoleContactDownEvent | InsoleContactUpEvent | null;
    reset(): void;
}

export declare class InsoleStuckChannelMonitor {
    constructor(options?: { windowFrames?: number; minTotalLoad?: number });
    update(values: number[]): number[];
    reset(): void;
}

export interface InsoleUtilsModule {
    SENSOR_COUNT: 6;
    MAX_UINT16: 65535;
    /** インソール画像上のマーカー座標（0..1 画像比率・チャネル→位置対応の正） */
    SENSOR_LAYOUT_IMAGE: InsoleSensorPoint[];
    SENSOR_LAYOUT: InsoleSensorPoint[];
    mirrorForSide(layout: InsoleSensorPoint[], side: 'left' | 'right'): InsoleSensorPoint[];
    validatePress(values: number[] | null | undefined, options?: { saturationValue?: number }): InsolePressValidation;
    StuckChannelMonitor: typeof InsoleStuckChannelMonitor;
    PressureCalibrator: typeof InsolePressureCalibrator;
    computeCoP(values: number[], layout?: InsoleSensorPoint[], options?: { minLoad?: number }): InsoleCoP;
    ContactDetector: typeof InsoleContactDetector;
    sideFromMountPosition(mountPosition: number | undefined): InsoleMountInfo | null;
}

declare global {
    // script タグで src/InsoleUtils.js を読み込んだ場合のグローバル
    var OrpheInsoleUtils: InsoleUtilsModule;
}
