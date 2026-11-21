// main.ts — the make.fun hand-in program for this entry (Node 22, standard library only, no build step).
//
// The app in app/ is plain static files a desktop browser loads offline: app/index.html plus its ES modules,
// its styles and its sample photos, with no library, no CDN and no network request of any kind. This program
// does the mechanical part the bounty asks for:
//
//   1. create the output directory (MAKEFUN_OUTPUT_DIR, or /output as the grader sets it);
//   2. copy app/ beside it, byte for byte;
//   3. copy screenshots/ beside it (the first by name is the cover image);
//   4. write dossier.json with the vendored make.fun library's buildDossier, under the scorer's own caps.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and serve the app for a look with:
//   node serve.ts        # http://localhost:8080

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

/** This file's directory: app/, screenshots/ and vendor/ are all resolved from here, never the cwd. */
const here = fileURLToPath(new URL('.', import.meta.url));
/** Where the entry is handed in. The grader mounts /output; MAKEFUN_OUTPUT_DIR stands in elsewhere. */
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json). Only text_max_bytes shapes the dossier's bytes; the rest
// refuse here exactly what the scorer would refuse: more than 4 screenshots, one over 256 KiB, more than
// 993 entries under app/, more than 48 MiB of app files, or an app path longer than 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`handed in: ${out}`);
