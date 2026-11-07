// Bundle the INSOLE 1.5 client to a single browser file the SDK loads with a
// plain <script> (or lazily from src/ORPHE-INSOLE.js when an INSOLE 1.5 is
// selected in the device chooser):
//   ../Insole15Client.js  — IIFE, global `Insole15`
//
// The output is committed next to the other SDK sources (like dist/) so pages
// need no build step at runtime. scripts/build-dist.js copies it into dist/.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'Insole15',
  target: ['es2020'],
  outfile: '../Insole15Client.js',
  logLevel: 'info',
});

console.log('Built ../Insole15Client.js (global Insole15)');
