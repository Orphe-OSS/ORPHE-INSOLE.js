# ORPHE Hula Motion Sonifier

Prototype example for collecting hula footwork with two ORPHE INSOLE devices and turning simple detected events into visual and audio feedback.

## Project brief

This example is an exploratory prototype for a future hula motion sonification app.
It is intentionally built as a browser example first so teachers and dancers can test
the interaction with real ORPHE INSOLE hardware before the design is narrowed for an
iPad-oriented implementation.

The prototype focuses on three goals:

* Record reliable two-insole datasets for hula footwork analysis.
* Show the dancer why a gesture was or was not detected in real time.
* Convert stable gesture/phase events into simple Hawaiian-inspired sound mappings.

## Current requirements

The current scope is deliberately narrow:

* Run in desktop Chrome or Edge with Web Bluetooth enabled.
* Connect two ORPHE INSOLE devices and stream `SENSOR_VALUES` in `streamingMode: 4`.
* Visualize six pressure sensors per foot, total load, left/right load, CoP, acceleration, and gyro.
* Allow per-foot sensor signal remapping because the raw `press.values` order can differ from the physical sensor layout.
* Detect only **Kāholo**, **Hela**, and **ʻAmi** in the active vocabulary.
* Show the active gesture, phase, score, threshold state, and sounding state in the UI.
* Trigger sound only on gesture/phase state transitions, not continuously while the same state is held.
* Export session JSON and gesture-capture JSON for later algorithm review.
* Let teachers or dancers add post-take labels and notes.
* Keep the sound engine in dependency-free Web Audio primitives so it can be ported later to Swift `AVAudioEngine` or AudioKit.

Out of scope for this prototype:

* Production-grade hula classification.
* Auto reconnect and multi-tab BLE bridge behavior.
* Full InsoleToolkit integration.
* The final hula music generation app.
* Native iPad BLE/audio implementation.

## Implemented prototype behavior

### Gesture vocabulary

* **Kāholo**: 8-phase walking/side-step cycle. The current detector advances on IMU initial-contact-like pulses and classifies the motion as more lateral than forward.
* **Hela**: 4-phase diagonal/front-side point gesture. The current detector advances on IMU initial-contact-like pulses and classifies the motion as having stronger forward/diagonal content.
* **ʻAmi**: grounded circular/elliptical CoP motion. The current detector requires quiet IMU, both feet loaded, CoP movement in both lateral and forward/back axes, sufficient CoP path length, and limited left/right load imbalance.

Kaʻo was removed from the active detector vocabulary because its sonic and sensor interaction overlapped too much with ʻAmi for the current prototype. It remains a research topic, not an active UI or detector path.

### Sound mapping

The prototype currently uses one fixed sound mapping:

* **Kāholo**: 8 phases advance a High-G ukulele-like C6/Fmaj7/G6 progression.
* **Hela**: 4 phases trigger a four-voice 6th steel guitar-like slide chord. This is tuned to preserve the "slide guitar sixth" feeling that is important for the Hawaiian sound.
* **ʻAmi**: CoP angle phases trigger an ocean/wind-like G swell.

The implementation does not use Tone.js. The sounds are built from oscillators, gain envelopes, filters, delay/reverb-like ambience, vibrato, and noise layers so the structure can be translated to a native audio graph later.

### Dataset recording

The gesture-capture recorder is designed for exploratory data collection:

* A dancer can perform each gesture repeatedly in a continuous take.
* The UI records pressure, CoP, acceleration, gyro, active sensor mapping, timestamps, and segment labels.
* Segment buttons mark gesture intervals; phase labels are intentionally not required.
* The exported JSON is meant for offline inspection and future detector redesign.

## Work completed so far

The current branch includes these major changes:

* Added `examples/hula-motion-sonifier/` as a two-insole hula sonification prototype.
* Built a Japanese UI for connection, pressure/CoP visualization, gesture state, thresholds, recording, and labeling.
* Reworked the insole visualization to use real ORPHE INSOLE imagery and the current six-sensor physical layout.
* Added configurable physical-to-raw pressure sensor mapping per foot.
* Added transparent detector cards showing phase, score, trigger conditions, and important sensor features.
* Added continuous gesture dataset capture with segment labels and JSON export.
* Reduced active detection from four gestures to three: Kāholo, Hela, and ʻAmi.
* Changed Kāholo/Hela timing to fire from IMU initial-contact-like pulses with lockout, instead of relying on pressure-only foot-flat timing.
* Tuned Hela sound toward a four-voice 6th steel guitar slide.
* Added no-hardware simulator coverage in `test.html` and Node tests in `tests/hula-detector.test.js`.

## External review focus

Please review this as a prototype, not a finished classifier:

* Whether the visible UI explains the detector well enough for dancer/teacher testing.
* Whether the exported JSON contains enough raw and derived signals for offline analysis.
* Whether the simple IMU/CoP heuristics are a reasonable baseline before introducing learned models.
* Whether the Web Audio graph is structured clearly enough for eventual Swift audio migration.
* Whether the example introduces any risk to the core ORPHE INSOLE library API.

## Hardware test

Open the example from a local HTTP server in Chrome or Edge:

```bash
python3 -m http.server 8770 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8770/examples/hula-motion-sonifier/
```

Use this checklist before judging the detector:

* Connect two ORPHE INSOLE devices.
* Confirm left/right assignment. Manual side selection overrides `mount_position`.
* Press each physical sensor area and adjust the signal mapping if `press.values` order does not match the displayed diagram.
* Click **Enable audio** after the page loads.
* Adjust volume and ambience for the room or headphones.
* Click **Start JSON recording** before dancing.
* Try one clear pattern at a time: Kāholo, Hela, then ʻAmi.
* After the take, label detected events and add teacher/dancer notes.
* Download the JSON session.

## Simulator test

For logic testing without hardware:

```text
http://127.0.0.1:8770/examples/hula-motion-sonifier/test.html
```

The simulator injects synthetic pressure frames into the same pure detector used by the hardware page.

## Initial detection rules

These rules are intentionally simple and visible in the UI:

* **Kāholo**: fires after 4 alternating left/right load shifts inside the time window.
* **Hela**: fires when one foot is a light forefoot point on physical sensors 1-4 while the opposite foot carries support load.
* **ʻAmi**: candidate detector for grounded circular/elliptical CoP movement.

The thresholds are adjustable in the page so dancer-specific tuning can happen during real-device tests.
The current prototype vocabulary can be turned on/off in the hardware page before a take.

## Hula step research mapping

The expanded detector vocabulary is based on a practical mapping from documented hula step descriptions to signals ORPHE INSOLE can observe:

* Huapala lists Hela as a foot placed about 45 degrees front/side with weight on the opposite hip, Kāholo as a four-count side step, Lele as walking forward with heel lift, Lele ʻUwehe as a combined step/point/ʻuwehe sequence, and ʻUwehe as quick heel raising after a weight shift.
* Huapala also describes ʻAmi as hip rotation and Kao as side-to-side sway. Because the insole cannot directly see the hips, this prototype keeps ʻAmi as a CoP rotation candidate and leaves Kao out of the active detector vocabulary.
* KPoHana similarly describes Kāholo, Hela, ʻUwehe, Lele ʻUwehe, and ʻAmi in terms of side steps, foot extension, heel lift, and hip rotation.
* Hawaiian Hula Tutorial Part 1 lists Hela, Kāholo, Lele, ʻAmi, Uwehe, Lele Hela Uwehe, Kalākaua, and Kāwelu as foundational tutorial material; Kalākaua/Kāwelu remain research candidates for a later pass because they need more reliable heel/toe and forward/back distinction in real data.

Research references:

* https://www.huapala.org/Hula_Steps.html
* https://www.kpohana.com/basichulasteps.html
* https://hawaiianhulatutorial.com/hawaiian-hula-tutorial-part-1/

## Sonification mapping

The hardware page uses one Web Audio only mapping so the same logic can be moved later to an iPad-oriented app:

* **Kāholo**: 8 phases advance a High-G ukulele-like C6/Fmaj7/G6 progression.
* **Hela**: 4 phases trigger a four-voice 6th steel guitar-like slide chord.
* **ʻAmi**: CoP angle phases trigger an ocean/wind G swell.

The page remembers volume and ambience in `localStorage`. Session JSON records those audio settings with the sensor maps and event labels.

## Sensor layout and mapping

The pressure map uses the current physical six-sensor layout:

* `1` and `3`: toe / upper forefoot.
* `2` and `4`: ball / lower forefoot.
* `5`: lateral midfoot.
* `6`: heel.

The detector first maps raw `press.values` into those physical positions. The page exposes per-foot mapping controls so hardware signal order can be swapped without changing the detector code. Session JSON includes both the active `sensorMaps` and the physical `sensorLayout`.

## Files

* `index.html`: hardware prototype UI.
* `app.js`: ORPHE connection, UI rendering, Web Audio, session export.
* `hula-detector.js`: pure detector and JSON session recorder, usable from browser or Node.
* `test.html`: no-hardware detector simulator.
