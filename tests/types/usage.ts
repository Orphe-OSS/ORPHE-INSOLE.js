import {
    FixedSizeArray,
    Orphe,
    OrpheInsole,
    OrpheTimestamp,
    parseInsoleSensorValues,
    type InsoleDeviceInformation,
    type InsolePressSample
} from '../../';

const insole = new OrpheInsole(0);
const alias = new Orphe(1);
const globalInsole = new globalThis.OrpheInsole(0);

insole.setup(['DEVICE_INFORMATION', 'DATE_TIME', 'SENSOR_VALUES'], {
    interpolation: {
        enabled: false,
        max_consecutive_missing: 1
    }
});

// setup() options は省略・部分指定可（実装側で既定値とマージされる）
insole.setup();
insole.setup(['SENSOR_VALUES']);
insole.setup(['SENSOR_VALUES'], {});
insole.setup(['SENSOR_VALUES'], { interpolation: { enabled: true } });

void insole.begin();
void insole.begin('SENSOR_VALUES', { streamingMode: 4, autoReconnect: true });
void insole.begin({ streamingMode: 3, reconnectIntervalMs: 1000, reconnectMaxAttempts: 2 });

insole.gotPress = (press: InsolePressSample) => {
    const firstValue: number = press.values[0];
    const serial: number = press.serial_number;
    const timestamp: number = press.timestamp;
    void firstValue;
    void serial;
    void timestamp;
};

insole.gotStatus = (status) => {
    const version: string = status.version;
    const battery: number = status.battery;
    void version;
    void battery;
};

async function readDeviceInformation(device: OrpheInsole) {
    const info: InsoleDeviceInformation = await device.getDeviceInformation();
    const accRange: number = info.range.acc;
    const gyroRange: number = info.range.gyro;
    const raw: DataView = info.raw;
    void accRange;
    void gyroRange;
    void raw;

    if (device.device_information !== '') {
        const mountedAt: number = device.device_information.mount_position;
        void mountedAt;
    }
}

void readDeviceInformation(insole);
void insole.setDataStreamingMode(1);
void insole.setDataStreamingMode(3);
void insole.setDataStreamingMode(4);

const parsed = parseInsoleSensorValues(new DataView(new ArrayBuffer(104)), { accRange: 16, gyroRange: 2000 });
if (parsed && parsed.samples[0]?.press) {
    const values: number[] = parsed.samples[0].press.values;
    void values;
}

const buffer = new FixedSizeArray<number>(2);
buffer.push(1);
const entries: number[] = buffer.getArray();
void entries;

const timestamp = new OrpheTimestamp();
const hz: number = timestamp.getHz();
void hz;

globalThis.buildInsoleToolkit(document.createElement('div'), 'INSOLE 01', 0, { streamingMode: 4 });
globalThis.insoles = [insole, alias, globalInsole];
globalThis.bles = globalThis.insoles;
globalThis.cores = globalThis.insoles;

// @ts-expect-error ORPHE INSOLE currently exposes SENSOR_VALUES only.
void insole.begin('STEP_ANALYSIS');

// @ts-expect-error Streaming mode 2 is rejected by the runtime implementation.
void insole.setDataStreamingMode(2);

// @ts-expect-error gotPress requires an InsolePressSample payload.
insole.gotPress({ values: [1, 2, 3, 4, 5, 6] });

// ── InsoleUtils の型 ──
const utils = globalThis.OrpheInsoleUtils;
const validation = utils.validatePress([1, 2, 3, 4, 5, 6]);
const okFlag: boolean = validation.ok;
void okFlag;

const cop = utils.computeCoP([1, 2, 3, 4, 5, 6], utils.mirrorForSide(utils.SENSOR_LAYOUT, 'left'), { minLoad: 100 });
const copLoad: number = cop.load;
void copLoad;

const calibrator = new utils.PressureCalibrator();
calibrator.setZero([[0, 0, 0, 0, 0, 0]]);
const normalizedValues: number[] = calibrator.normalize([1, 2, 3, 4, 5, 6]);
void normalizedValues;

const contactDetector = new utils.ContactDetector({ on: 800, off: 400, minContactMs: 50 });
contactDetector.footDown = (info) => {
    const flight: number | null = info.flightMs;
    void flight;
};
const contactEvent = contactDetector.update(900, 10);
if (contactEvent && contactEvent.event === 'up') {
    const stance: number | null = contactEvent.stanceMs;
    void stance;
}

const mount = utils.sideFromMountPosition(1);
if (mount) {
    const side: 'left' | 'right' = mount.side;
    void side;
}

// @ts-expect-error mirrorForSide の side は 'left' | 'right' のみ
utils.mirrorForSide(utils.SENSOR_LAYOUT, 'center');

// @ts-expect-error ContactDetector は on/off が必須
new utils.ContactDetector({ on: 800 });

// ── OrpheInsoleSimulator の型 ──
const simulator = new globalThis.OrpheInsoleSimulator(0);
simulator.setup();
void simulator.begin({ preset: 'walk', streamingMode: 4, loop: false });
void simulator.begin('SENSOR_VALUES', { frames: [{ device: 0, t: 0, press: [1, 2, 3, 4, 5, 6], acc: { x: 0, y: 0, z: 1 } }] });
simulator.gotPress = (press: InsolePressSample) => { void press.values; };
void simulator.setDataStreamingMode(3);
globalThis.insoles = [simulator, insole]; // insoles は実機とシミュレータの混在を許す

// buildInsoleToolkit の simulator オプション
globalThis.buildInsoleToolkit(document.createElement('div'), 'SIM', 0, { simulator: true, streamingMode: 4 });

// @ts-expect-error preset は 'walk' | 'stand' | 'sway' のみ
void simulator.begin({ preset: 'run' });

// @ts-expect-error simulator の streamingMode も 1|3|4 のみ
void simulator.setDataStreamingMode(2);

// ── connectionState / connectTimeoutMs / エラーcode の型 ──
const state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = insole.connectionState;
void state;
void insole.begin('SENSOR_VALUES', { streamingMode: 4, connectTimeoutMs: 8000 });
insole.onError = (error) => {
    const maybeCode = (error as import('../../types/orphe-insole').InsoleError).code;
    void maybeCode;
};

// @ts-expect-error connectionState は読み取り専用
insole.connectionState = 'connected';
