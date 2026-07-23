# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `InsoleToolkit` data-mode controls — the settings modal now independently selects Sensor Values and Step Analysis (including both together), switches Sensor Values between Realtime and FIFO, and keeps the existing realtime format selector (1/3/4). `InsoleToolkitSession` serializes transitions, shares FIFO/Gait ownership with application UIs, drains FIFO before disconnect/reset, and reapplies the selected outputs after reconnect. FIFO and Step Analysis remain opt-in and are enabled when `InsoleFifo.js` / `InsoleGait.js` are loaded. The Showcase recording controls now use the same session instead of constructing competing module instances.
- Local-only real-device validation dashboard under `tests/manual/toolkit-mode-validation/` for comparing realtime formats 1/3/4, FIFO continuity/loss/drain, Step-only, FIFO + Step, left/right devices, and reconnect restoration. It shows per-device signals, delivery timing, serial continuity, latest decoded records, pass/warn checks, and downloadable JSON/CSV evidence without adding a development-only page to the public examples gallery.
- `src/InsoleGait.js` (`OrpheInsoleGait`, opt-in) — real-time gait analysis. The INSOLE firmware (GaitAnalysisCore / StrideAnalyzer) computes per-stride gait parameters and publishes them on the Gait Analysis service's Step Analysis characteristic (`4EB776DC-…`, the core SDK's `ORPHE_STEP_ANALYSIS`), auto-notifying at 50 Hz once active — so it only needs subscribing (no read-mode change; the characteristic is under `ORPHE_OTHER_SERVICE`, already in `optionalServices`). A port of the `insole_client` `read_gait_analysis` reference: decodes the 20-byte packets (sub-headers 0=overview / 1=stride / 2=pronation / 4=motion, big-endian incl. float16), aggregates the overview/stride/pronation triplet per `step_number` (each sent twice for reliability) into one gait row with derived metrics (stride length, cadence, speed) and foot-strike / pronation classification, and exposes `onGait` / `onMotion` / `onRaw` callbacks plus reference-compatible CSV export. FW `-1` sentinels on non-negative fields are treated as missing; cadence/speed are computed only from a finite positive duration; and the step aggregator evicts in insertion order so uint16 `step_number` wraparound is handled. The lifecycle keeps one active Gait owner per insole, shares initial/reconnect subscription work to prevent duplicate listeners, lets `stop()` finish while `startNotify()` is pending, and compensates a late subscription with `stopNotify()`. Core auto-reconnect re-establishes STEP_ANALYSIS without clobbering user callbacks; after a manual reconnect, calling `gait.start()` explicitly re-subscribes without clearing collected rows. The core SDK routes STEP_ANALYSIS notifications to it via a `_gaitNotifySink` hook (mirrors `_fifoNotifySink`). TypeScript definitions and a Node unit test (`tests/insole-gait.test.js`) included. Added to the `showcase` example as a "Gait Analysis" panel.
- `OrpheInsoleFifo`: recovery phase (**drain**) on `stop()` — after a manual stop, new-range requests are cut off and only outstanding re-requests (`carryOver`) continue until the FW ring buffer is drained or `options.drainTimeoutMs` elapses (default `3000`, `0` disables = legacy behavior). Recovers the tail losses that otherwise remain even in a normal 1 m / two-device environment (#46). Returns immediately when nothing is outstanding, so `stop()` latency is effectively unchanged when there is no loss. Reports recovered count via `onStopped(info).drainRecovered` and marks in-drain progress with `onProgress(info).draining === true`. Only runs on manual `stop()`; skipped on `stopOnLoss` auto-stop, disconnect, or exception. The `showcase` and `fifo-vs-realtime` examples surface the recovered count and a "recovering after stop" status.

### Fixed

- Bound asynchronous polling in the gait and connection-stability tests so a failed mock expectation reports a timeout instead of spinning indefinitely with `setImmediate()`. The gait test gate now also runs in a child process with a 60-second hard timeout (exit 124), preventing a stuck regression from accumulating CPU-consuming orphan processes.
- `OrpheInsoleFifo.download()`: fix intermittent failures to save the CSV. The object URL was revoked synchronously right after `a.click()`, so the browser could invalidate it before finishing reading the blob and silently drop the download — more likely for larger CSVs (e.g. a lossy capture that drain recovers a lot of data for). The anchor is now appended to the DOM before clicking and the URL is revoked on a later tick.
- `OrpheInsoleFifo`: fix a latent span-tracking bug in `FifoLoopState.noteStored()` (introduced with #44's invariant check) where recovering a serial **earlier** than the first-stored one (e.g. the recording's first serial dropped on the initial request and re-fetched later — common on a lossy link) made `serialDistance()` wrap to ~65535, exploding the recording span and causing `finalizePendingLoss()` to report a phantom loss of ~65,336 serials. The span origin now rolls back (wrap-aware min/max) so early-serial recovery no longer inflates `droppedCount`.
- `OrpheInsoleFifo`: re-requests no longer converge-fail mid-recording. Two fixes: (1) `_receiveResponses` now returns after a short quiet period (`ONE_SHOT_IDLE_TIMEOUT_MS`) once a burst has started, instead of blocking the full 5 s `ONE_SHOT_TIMEOUT_MS` on every cycle that has a single dropped packet (which inflated lag and starved re-requests); (2) a `newNoData` resync no longer wipes the `carryOver` queue, so scattered single-serial drops keep being re-requested instead of being silently abandoned and scattered across the whole recording (#43/#46). The final polling cycle's received packets are no longer discarded on `stop()`.

## [1.2.1] - 2026-07-15

### Added

- Landing page: card-style example gallery with screenshots for all 8 examples + API docs, deep-dive doc links, and explicit browser-support notes. SEO: canonical/hreflang/OG image/Twitter cards/JSON-LD plus robots.txt and sitemap.xml.
- Pin CDN snippets in README / landing page to a release tag and add `tests/insole-version-sync.test.js` so version bumps without updating the pinned references fail CI (release steps documented in CLAUDE.md).
- Add `examples/quaternion-validation/` for guided two-device hardware validation with constant-memory norm/yaw/loss statistics, streamed raw CSV logging, rotation/walk/mode-3 workflows, and JSON/Markdown reports.

### Fixed

- Decode quaternion components in SENSOR_VALUES headers 50 and 56 as signed Q14 (`1.0 = 16384`) instead of Q15. Older decoding produced quaternion norms near 0.5 and compressed Euler yaw to roughly ±20°.
- Normalize every quaternion immediately before Euler conversion so quantization or a future transport-scale change cannot compress the reported Euler angles.

### Documentation

- Document recovery of CSV files recorded with v1.2.0 or earlier: normalize each quaternion row (equivalent to multiplying all four components by 2 when the norm is 0.5), then recalculate Euler columns.

## [1.2.0] - 2026-07-13

### Added

- Add `connectionState` getter (`'disconnected' | 'connecting' | 'connected' | 'reconnecting'`) for connection status UI.
- Add opt-in `begin({ connectTimeoutMs })` — no default; when set, a hanging GATT connect rejects with an Error whose `code` is `'CONNECT_TIMEOUT'`.
- Internal errors now carry a `code` property (`'NO_DEVICE'`, `'ALREADY_DISCONNECTED'`, `'CONNECT_TIMEOUT'`, `'INVALID_MODE'`) while keeping the same message strings.
- Add `OrpheInsoleUtils.SENSOR_LAYOUT_IMAGE` (canonical on-image sensor marker coordinates) and migrate balance-tuner / balance-sway / showcase(viz-pressure) to consume it instead of per-example copies. Add `examples/README.md` matrix (purpose x hardware x hardware-free verification).

### Changed

- **Behavior change (v1.2.0)**: default `on*` progress callbacks (`onConnect`, `onDisconnect`, `onStartNotify`, ...) log to the console only when `insole.debug === true`. Errors are still always printed (`onError` now uses `console.error`). Set `insole.debug = true` or override the callbacks to restore the previous verbosity.
- Add `buildInsoleToolkit(..., {simulator: true})` — swaps the slot to `OrpheInsoleSimulator` so the toolkit UI and callbacks work without hardware (requires InsoleSimulator.js). Simulator gained toolkit-compat methods: `setDataStreamingMode` (live switching), `getDeviceInformation`, `streaming_mode`, `resetAnalysisLogs`. TypeScript definitions for `OrpheInsoleSimulator` added.
- Add docs landing (docs/README.md), docs/SENSOR_SPEC.md (packet formats 50/55/56, units, mount_position bits, channel remap policy), and docs/TROUBLESHOOTING.md. Unified non-medical-device disclaimers in balance-sway / showcase. Synced CLAUDE.md example tables.
- Add `src/InsoleUtils.js` (opt-in) — pressure-data utilities promoted from example code: `validatePress` / `StuckChannelMonitor` / `PressureCalibrator` / `SENSOR_LAYOUT` + `mirrorForSide` / `computeCoP` / `ContactDetector` (hysteresis + debounce) / `sideFromMountPosition`. TypeScript definitions included.
- Add `examples/device-test/` — interactive on-device checklist page for verifying notify/read/write coexistence (PR#4).
- Add `OrpheInsoleSimulator` for hardware-free development and demos, with walk/stand/sway presets, frame replay, and `OrpheInsole`-compatible sensor callbacks.
- Add Node.js simulator coverage for streaming modes, stop cleanup, callback units, and frame replay.
- TypeScript type definitions (`types/orphe-insole.d.ts`) covering `OrpheInsole`, callbacks, parser output, and global script-tag usage. STEP_ANALYSIS-family callbacks are marked `@deprecated` (not called by current INSOLE firmware).

### Fixed

- Drop cached GATT characteristics when the link is down so auto-reconnect after a physical disconnect (out of range) no longer fails forever on stale characteristics from the previous connection (regression introduced by the per-UUID characteristic cache).
- Keep GATT characteristics per UUID (`_characteristics` map) so calling `getDeviceInformation()` / `setDataStreamingMode()` / `syncCoreTime()` while SENSOR_VALUES notifications are active no longer risks attaching or detaching the notify listener on the wrong characteristic. `dataCharacteristic` is kept as "last touched characteristic" for backward compatibility.
- Normalize `setup()` options so partial or empty options objects do not throw and interpolation defaults are preserved.
- Handle `serial_number` wraparound from `65535` to `0` without false `lostData()` callbacks, including after `clear()`.
