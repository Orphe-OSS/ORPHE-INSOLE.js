# ORPHE INSOLE Balance Sway Example

This example prototypes a stabilometry-like balance view for ORPHE INSOLE. It estimates an insole-relative center of pressure (CoP) from each foot's six pressure channels, combines left and right feet into a global CoP trace, and shows sway-style metrics before real-device calibration.

## Reference UI/UX Findings

- Tekscan SAM frames balance analysis around weight bearing, symmetry, center of force, sway direction/amount, pressure distribution, elliptical sway pattern, CoF distance, variability, and fore/rear or left/right weight-bearing percentages: https://www.tekscan.com/products-solutions/software/sway-analysis-module-sam
- Tekscan MobileMat combines static/dynamic foot pressure, postural stability, balance, and sway analysis, with portable pressure mat workflows and scan rates up to 100/185 Hz depending on model: https://www.tekscan.com/products-solutions/systems/mobilemat
- Sensing Future's balance protocols show the common clinical information architecture: mCTSIB, Romberg, Body Sway, Limits of Stability, Fall Risk, Rhythmic Weight Shift, single-leg stance, BESS, plus PDF/report outputs with CoP traces and condition summaries: https://sensingfuture.com/en/blog/12-protocols-for-balance-assessment-with-force-pressure-plate/
- Biodex-style balance systems emphasize immediate visual feedback, training/test modes for weight bearing, weight shift, postural stability, motor control, target levels, and saved/printed session data: https://www.physiomed-group.com/produkte/biodex-balance-system
- Sensor Medica freeStep highlights pressure maps, high acquisition frequency, body-center oscillation analysis, spatiotemporal parameters, automatic reports, and video synchronization: https://sensormedica.us/freestep/

## ORPHE INSOLE Constraints Used

- ORPHE INSOLE Evaluation Kit specs list 3-axis acceleration, 3-axis gyroscope, and six pressure sensors per foot.
- Listed measurement ranges are +/-16G, +/-2000 dps, and 0-148 N pressure.
- Listed sampling rates are 100 Hz / 200 Hz, with rate depending on application.
- Connectivity is BLE, and this repository exposes that stream through Web Bluetooth callbacks.
- In the current `src/ORPHE-INSOLE.js`, `begin()` defaults to streaming mode 4: gyro, acceleration, pressure, and quaternion at 100 Hz. Mode 3 provides gyro, acceleration, and pressure at 200 Hz.

Source: https://shop.orphe.io/en/products/orphe-insole-%CE%B2-evaluation-kit and this repository's `README.md` / `src/ORPHE-INSOLE.js`.

## Implementation Notes

- CoP is calculated as a weighted average over the approximate `SensorLayout` positions in `balance-sway.js`.
- The global CoP is a load-weighted combination of the current left and right foot CoP values.
- Connection uses the repository `src/CoreToolkit.js` switch UI, the same pattern as the existing FSR / hula-style examples. Unsupported CORE-only LED/settings controls are hidden in this example.
- The `Six Sensors / Foot` panel now uses the `examples/showcase/` pressure-map graphics: ORPHE INSOLE left/right PNGs, the showcase six-point pressure layout, dynamic blue-to-red pressure scaling, a cyan CoP marker, and left/right volume bars.
- Metrics are intentionally labelled as normalized units (`u`) until real hardware calibration maps sensor layout and pressure values into physical dimensions.
- The demo stream is deterministic enough for repeatable UI testing and keeps the page useful without a connected insole.
- CSV export writes the active trial samples when a trial exists, otherwise the current rolling window.

## Real-device Test Flow

1. Serve the repository from localhost or HTTPS.
2. Open `examples/balance-sway/` in Chrome or Edge.
3. Confirm the page starts in `DEMO`.
4. Turn on the `INSOLE 01` toolkit switch and connect one ORPHE INSOLE.
5. Turn on `INSOLE 02` for the second ORPHE INSOLE if available.
6. Stand still, click `Center`, then click `Start`.
7. Confirm the CoP trace, pressure map, stabilogram, L/R load, and CSV output.

Web Bluetooth requires a secure context. `http://localhost` is valid for local testing.
