# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Add `src/InsoleUtils.js` (opt-in) — pressure-data utilities promoted from example code: `validatePress` / `StuckChannelMonitor` / `PressureCalibrator` / `SENSOR_LAYOUT` + `mirrorForSide` / `computeCoP` / `ContactDetector` (hysteresis + debounce) / `sideFromMountPosition`. TypeScript definitions included.
- Add `examples/device-test/` — interactive on-device checklist page for verifying notify/read/write coexistence (PR#4).
- Add `OrpheInsoleSimulator` for hardware-free development and demos, with walk/stand/sway presets, frame replay, and `OrpheInsole`-compatible sensor callbacks.
- Add Node.js simulator coverage for streaming modes, stop cleanup, callback units, and frame replay.
- TypeScript type definitions (`types/orphe-insole.d.ts`) covering `OrpheInsole`, callbacks, parser output, and global script-tag usage. STEP_ANALYSIS-family callbacks are marked `@deprecated` (not called by current INSOLE firmware).

### Fixed

- Keep GATT characteristics per UUID (`_characteristics` map) so calling `getDeviceInformation()` / `setDataStreamingMode()` / `syncCoreTime()` while SENSOR_VALUES notifications are active no longer risks attaching or detaching the notify listener on the wrong characteristic. `dataCharacteristic` is kept as "last touched characteristic" for backward compatibility.
- Normalize `setup()` options so partial or empty options objects do not throw and interpolation defaults are preserved.
- Handle `serial_number` wraparound from `65535` to `0` without false `lostData()` callbacks, including after `clear()`.
