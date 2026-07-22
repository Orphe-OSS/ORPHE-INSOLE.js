'use strict';

const DEFAULT_WAIT_TIMEOUT_MS = 2000;
const DEFAULT_POLL_INTERVAL_MS = 5;

/**
 * Poll a synchronous predicate without allowing a failed expectation to keep
 * the Node.js event loop alive forever.
 *
 * @param {() => boolean} predicate
 * @param {string} description
 * @param {{timeoutMs?: number, pollIntervalMs?: number}} [options]
 */
async function waitFor(predicate, description, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;

  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error(`Timed out after ${timeoutMs} ms waiting for ${description}`);
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

module.exports = { waitFor };
