import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const assetFiles = {
  '/index.html': 'dist/index.html',
  '/style.css': 'dist/style.css',
  '/app-clean.mjs': 'dist/app-clean.mjs',
  '/app.mjs': 'dist/app.mjs',
  '/batch7.mjs': 'dist/batch7.mjs',
  '/evaluation.mjs': 'dist/evaluation.mjs',
  '/vendor/polygon-clipping.umd.min.js': 'dist/vendor/polygon-clipping.umd.min.js'
};
const assets = {};
for (const [route, file] of Object.entries(assetFiles)) {
  const raw = await readFile(resolve(root, file));
  // Git stores these text assets with LF. Embed that form so the worker bytes
  // stay identical when the working tree has CRLF.
  const lf = Buffer.from(raw.toString('latin1').replaceAll('\r\n', '\n'), 'latin1');
  assets[route] = lf.toString('base64');
}
const logic = await readFile(resolve(root, 'worker/shared-library.js'));
// Keep the CRLF after the asset map so dist/server/index.js stays byte-identical.
const worker = Buffer.concat([
  Buffer.from(`const assets=${JSON.stringify(assets)};\r\n`),
  logic
]);
await mkdir(resolve(root, 'dist/server'), { recursive: true });
await writeFile(resolve(root, 'dist/server/index.js'), worker);
