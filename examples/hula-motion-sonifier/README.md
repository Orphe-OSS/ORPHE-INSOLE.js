# ORPHE Hula Motion Sonifier

Prototype example for collecting hula footwork with two ORPHE INSOLE devices and turning simple detected events into visual and audio feedback.

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
