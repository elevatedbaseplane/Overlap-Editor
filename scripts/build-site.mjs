import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const copies = [
  ['src/index.html', 'dist/index.html'],
  ['src/app-clean.mjs', 'dist/app-clean.mjs'],
  ['src/style.css', 'dist/style.css'],
  ['src/assets/scale-figure-reach.png', 'dist/assets/scale-figure-reach.png'],
  ['src/assets/scale-figure-side.png', 'dist/assets/scale-figure-side.png'],
  ['vendor/polygon-clipping.umd.min.js', 'dist/vendor/polygon-clipping.umd.min.js'],
  ['archive/unused-drafts/app.mjs', 'dist/app.mjs'],
  ['archive/unused-drafts/batch7.mjs', 'dist/batch7.mjs'],
  ['archive/unused-drafts/evaluation.mjs', 'dist/evaluation.mjs']
];

for (const [from, to] of copies) {
  const destination = resolve(root, to);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(resolve(root, from), destination);
}
