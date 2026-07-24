# ORPHE INSOLE Data Mode Inspector

An unlisted engineering harness for inspecting ORPHE INSOLE BLE acquisition paths,
Toolkit profile transitions, measurement boundaries, and export payloads with one
or two physical devices. The page itself uses `InsoleToolkitSession` profiles and
the public measurement API shown in its code snippets.

This tool is intentionally omitted from the public examples index while its
terminology and protocol documentation are being stabilized.

## Run locally

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open the following URL in desktop Chrome:

```text
http://localhost:8765/examples/data-modes/
```

Use `localhost`, not another machine's LAN address. Web Bluetooth requires a
secure context, and browsers treat `http://localhost` as a potentially trustworthy
origin.

## Acquisition paths

| Toolkit profile | GATT delivery path | Payload | Nominal sample rate | Continuity contract |
|---|---|---|---:|---|
| `realtime-orientation` | `SENSOR_VALUES` Notification | acc / gyro / quat | 200 sample/s | No retransmission |
| `realtime-pressure` | `SENSOR_VALUES` Notification | acc / gyro / press | 200 sample/s | No retransmission |
| `realtime-full` | `SENSOR_VALUES` Notification | acc / gyro / press / quat | 100 sample/s | No retransmission |
| `realtime-full-step` | Two concurrent Notification streams | Realtime Full + STEP_ANALYSIS | 100 sample/s Raw | Raw continuity is not guaranteed |
| `step-analysis` | `STEP_ANALYSIS` Notification | motion / overview / stride / pronation | Firmware event rate | SENSOR_VALUES disabled |
| `fifo-recording` | FIFO Request–Response polling | acc / gyro / press | 200 sample/s | Validate after stop and drain |

### SENSOR_VALUES Notification

Realtime acquisition is a peripheral-to-Host BLE Notification stream. The device
emits approximately 50 packets/s. `streamingMode` selects the packet header,
samples per packet, and field schema:

- `streamingMode=1`: header `50`, acc + gyro + quat, 200 sample/s, no press
- `streamingMode=3`: header `55`, acc + gyro + press, 200 sample/s, no quat
- `streamingMode=4`: header `56`, acc + gyro + press + quat, 100 sample/s

The Host can detect a gap in `serial_number`, but a missed Notification cannot be
requested again. Use this path for low-latency visualization and interaction, not
for a lossless recording requirement.

### FIFO Request–Response

FIFO acquisition stores Raw samples in the device-side ring buffer. The Toolkit
polls batches, tracks serial progress, and drains unread data during
`stopMeasurement()`. Delivery is bursty and can be delayed relative to device
acquisition.

Do not evaluate FIFO continuity from arrival gaps during the run. Use the final
device checkpoint after drain and verify both `serial.missing === 0` and
`fifoDropped === 0`. FIFO is exclusive with STEP_ANALYSIS on the current firmware.

### STEP_ANALYSIS Notification

STEP_ANALYSIS is a separate firmware-derived Notification stream. Motion packets
are continuous; overview, stride, and pronation packets are joined by step number
to create a completed row. It can run concurrently with Realtime SENSOR_VALUES,
but both streams share BLE bandwidth. It cannot run concurrently with FIFO.

## Application integration

Apply one named profile instead of sequencing low-level stream and characteristic
operations in application code.

```js
buildInsoleToolkit(document.querySelector('#toolkit'), 'INSOLE 01', 0);
const session = getInsoleToolkitSession(0);

// After the user selects a device through the Bluetooth chooser:
await session.applyProfile('realtime-full-step');
await session.startMeasurement({
  metadata: { participant: 'P001', condition: 'walk' }
});

const result = await session.stopMeasurement();
const rawCsv = insoleToolkitMeasurementToCSV(result, 'raw');
const stepCsv = insoleToolkitMeasurementToCSV(result, 'step');
```

FIFO uses the same measurement API:

```js
await session.startMeasurement({
  profile: 'fifo-recording',
  metadata: { participant: 'P001' }
});

// Resolves only after FIFO stop and drain complete.
const result = await session.stopMeasurement();
console.log(result.raw.serial.missing);
```

`applyProfile()` and `configure()` reject changes with `MEASUREMENT_ACTIVE` while
a formal measurement window is open. This keeps the packet schema and output set
stable for the complete run. For a custom contract, call
`configure({ streamingMode, sensorDataMode, outputs })` once.

## Instrumentation

The page exposes:

- effective sample and packet rates
- inter-arrival interval, delivery age, and serial continuity
- FIFO lag, dropped serials, final checkpoint, and drain recovery
- Quaternion values and 3D orientation
- STEP_ANALYSIS packet-type counts and completed rows
- disconnect, reconnect, first-data, and profile-restoration latency
- Result JSON, Raw CSV, and Step CSV for the formal measurement window

Data received before `startMeasurement()` is live preview only. Formal metrics and
exports contain the interval bounded by `startMeasurement()` and
`stopMeasurement()`.

## Dual-device FIFO Host comparison

Run single-device baselines as `fifo-single-baseline`, then run both devices as
`fifo-dual-host-stress`. Keep the physical devices, battery state, distance,
duration, Chrome version, and Host configuration constant.

A gap observed only under dual-device load is not sufficient evidence of a
Toolkit defect. Transport integrity and the biomechanical validity of
firmware-derived STEP_ANALYSIS fields are separate validation targets.
