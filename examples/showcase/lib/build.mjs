// Bundle the INSOLE 1.5 client to a single browser file the showcase
// loads with a plain <script>:
//   insole-1.5.web.js  — IIFE, global `Insole15`
//
// The output is committed alongside the example (like the SDK's dist/) so the
// showcase itself needs no build step at runtime.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'Insole15',
  target: ['es2020'],
  outfile: 'insole-1.5.web.js',
  logLevel: 'info',
});

console.log('Built insole-1.5.web.js (global Insole15)');
