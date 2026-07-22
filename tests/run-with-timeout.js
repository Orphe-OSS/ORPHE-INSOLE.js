#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

const timeoutSeconds = Number(process.argv[2]);
const scriptArgs = process.argv.slice(3);

if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0 || scriptArgs.length === 0) {
  console.error('Usage: node tests/run-with-timeout.js <seconds> <script> [args...]');
  process.exitCode = 2;
} else {
  const timeoutMs = timeoutSeconds * 1000;
  const displayName = path.basename(scriptArgs[0]);
  const child = spawn(process.execPath, scriptArgs, { stdio: 'inherit' });
  let timedOut = false;
  let forceKillTimer = null;

  const watchdog = setTimeout(() => {
    timedOut = true;
    console.error(`[timeout] ${displayName} exceeded ${timeoutSeconds} seconds; terminating child process.`);
    child.kill('SIGTERM');
    forceKillTimer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        console.error(`[timeout] ${displayName} ignored SIGTERM; sending SIGKILL.`);
        child.kill('SIGKILL');
      }
    }, 2000);
    forceKillTimer.unref();
  }, timeoutMs);
  watchdog.unref();

  child.once('error', (error) => {
    clearTimeout(watchdog);
    if (forceKillTimer) clearTimeout(forceKillTimer);
    console.error(`Failed to start ${displayName}:`, error);
    process.exitCode = 1;
  });

  child.once('exit', (code, signal) => {
    clearTimeout(watchdog);
    if (forceKillTimer) clearTimeout(forceKillTimer);

    if (timedOut) {
      process.exitCode = 124;
    } else if (signal) {
      console.error(`${displayName} exited after signal ${signal}.`);
      process.exitCode = 1;
    } else {
      process.exitCode = code ?? 1;
    }
  });
}
