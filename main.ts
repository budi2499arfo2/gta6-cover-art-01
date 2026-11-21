// The program that hands the app in (Node 22, standard library only).
//
// It copies app/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there with the vendored buildDossier, which
// is the summary the scorer reads and the judge's view is made from. It also
// writes a small manifest of what it copied, so a run is easy to check by hand.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps: text_max_bytes shapes the dossier's text; the rest
// refuse an entry the scorer would refuse.
const LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

/** Every regular file under `dir`, as paths relative to it, sorted. */
function walk(dir) {
  const found = [];
  const visit = (current) => {
    for (const name of readdirSync(current).sort()) {
      const full = join(current, name);
      const info = statSync(full);
      if (info.isDirectory()) visit(full);
      else if (info.isFile()) found.push({ path: relative(dir, full), bytes: info.size });
    }
  };
  visit(dir);
  return found;
}

const appFiles = walk(join(out, 'app'));
const shots = existsSync(join(out, 'screenshots'))
  ? walk(join(out, 'screenshots')).map((f) => f.path)
  : [];

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, LIMITS),
);

// Nothing else is written into `out`: the platform's 1,000-entry cap is shared
// by app/, screenshots/ and dossier.json, so the manifest goes to stdout only.
const largest = appFiles.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 3);
console.log(`handed in ${appFiles.length} app files (${appFiles.reduce((s, f) => s + f.bytes, 0)} bytes) and ${shots.length} screenshots`);
console.log(`largest: ${largest.map((f) => `${f.path} ${f.bytes}B`).join(', ')}`);
