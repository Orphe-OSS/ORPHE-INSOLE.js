'use strict';

// Intentionally recreates the original high-wakeup failure mode so
// run-with-timeout.test.js can verify that the outer watchdog terminates it.
function pollForever() {
  setImmediate(pollForever);
}
pollForever();
