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

export interface InsoleBeginOptions {
    streamingMode?: InsoleStreamingMode;
    /** @deprecated Use streamingMode. */
    dataStreamingMode?: InsoleStreamingMode;
    autoReconnect?: boolean;
    reconnectIntervalMs?: number;
    reconnectMaxAttempts?: number;
    forceDeviceSelection?: boolean;
}

export interface InsoleSetupOptions {
    interpolation: {
        enabled: boolean;
        max_consecutive_missing: number;
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

export interface BuildInsoleToolkitOptions extends InsoleBeginOptions {}

type OrpheInsoleConstructor = typeof OrpheInsole;
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
    var insoles: OrpheInsole[];
    var bles: OrpheInsole[];
    var cores: OrpheInsole[];
    var FixedSizeArray: FixedSizeArrayConstructor;
    var OrpheTimestamp: OrpheTimestampConstructor;
    var parseInsoleSensorValues: ParseInsoleSensorValues;
    var buildInsoleToolkit: BuildInsoleToolkit;
}
