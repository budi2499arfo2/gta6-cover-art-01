# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/budi2499arfo2/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/budi2499arfo2/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A GTA-poster-style cover art maker that runs entirely offline in a desktop browser: drop in your own
photos, pick a layout and a sunset colour grade, write a caption, and export a real PNG at 1080×1080,
1080×1350 or 1920×1080. It is static files and nothing else — no build step, no library, no CDN, no
font download, and no network request of any kind once the page is open. Your photos never leave the
tab; they are decoded from a `Blob` URL and painted straight into a canvas.

Every pixel of the artwork is hand-written canvas 2D code. There is no image asset behind the poster:
the multi-panel grid, each panel's crop and colour wash, the sun disc with its radiating ray burst and
cut bands, the horizon glow, the anamorphic streak and diagonal flare, the two-tone wordmark with its
thick ink outline, neon rim and chromatic-aberration fringe, the film grain, scanlines, vignette and
frame are all drawn by `app/src/cover.js` at render time. No Rockstar Games logo, artwork, character
or font is used or bundled — every glyph is set in a condensed face the machine already has.

## Run it

```sh
node serve.ts                      # serves app/ at http://localhost:8080
```

Hand it in the way the grader does:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` using
the vendored `vendor/makefun-app.ts` library, under the scorer's own caps (993 app entries, 48 MiB of
app files, four screenshots at 256 KiB each). It uses the Node 22 standard library only — no install,
no build, no flags.

## How it works

- `app/index.html` — the editing bench: photo dropzone, panel count, frame, colour preset, caption and
  subtitle, title size, per-panel crop, the export buttons, a randomize button and the shortcut list.
- `app/src/cover.js` — `renderCover(ctx, opts)`, the entire poster. Everything is laid out in
  "design units" on a 1080-unit-wide basis and then scaled by the context, so one geometry serves 1:1,
  4:5 and 16:9. Layered back to front: sun-and-ray backdrop, the panel grid (each cell cropping and
  grading its own photo), the global grade, the title band, then the film finish.
- `app/src/main.js` — DOM wiring, image intake, the live canvas, the keyboard map, and the real PNG
  export, which redraws the poster at full resolution before encoding rather than upscaling the preview.
- `app/style.css` — the bench around the canvas, kept dark so the poster is the brightest thing on screen.
- `serve.ts` — a 60-line static server for looking at `app/` without a build step.
- `main.ts` — the hand-in program: copies the app and the screenshots, writes `dossier.json`.
- `screenshots/` — four captures of the app running: a 1:1 cover, the editor with a photo loaded, a 4:5
  poster and a 16:9 wide frame. The first by filename is the cover.
- `.makefun/shoot.js` and `.makefun/selftest.js` — the two dev tools used to produce those captures and to
  check the editor. `shoot.js` drives headless Chrome over the DevTools protocol, waits for
  `window.__shotReady`, and steps JPEG quality down until each frame fits the 256 KiB cap; `selftest.js`
  exercises every keyboard shortcut, the randomize button and the shot modes, and fails on any console
  error or external request. Neither is part of what the app loads.

## Features

- **2 to 6 panels** on a hero-and-contact-sheet grid that re-composes itself for tall and wide frames.
- **Five colour presets**, each a complete grade: Vice Sunset (orange/teal), Neon Night (hot pink/cyan),
  Blood Orange, Chrome Dusk and Acid Wave.
- **The whole poster is drawn, not composited**: sun disc with cut bands, radiating ray burst, horizon
  glow band, anamorphic streak, diagonal sun flare, lens ghosts, per-panel edge rules and hero corner
  brackets, two-tone wordmark with an ink outline and a neon edge.
- **One crop per panel** — zoom and X/Y offset, with a shuffle that reshuffles the collage.
- **Randomize** picks a fresh preset, panel count, frame and set of crops in one press (or `R`).
- **Keyboard shortcuts** for every control, listed in the bench: `R` randomize, `1`–`6` pick a panel,
  `P` next preset, `F` next frame, `[` `]` fewer/more panels, `+` `−` title size, `E` export, `?` fold
  the list.
- **Real PNG export** at 1080×1080, 1080×1350 and 1920×1080, redrawn at full resolution.
- **Deterministic screenshot modes** — `?shot=cover` and `?shot=editor` with `photo`, `caption`,
  `subtitle`, `count`, `preset`, `frame` and `font` parameters, so captures are reproducible.
- **Fully offline**: no fetch, no XHR, no WebSocket, no external stylesheet, no webfont, no analytics.

---

<sub>Entered on [make.fun](https://make.fun/?ref=1ecnjcb9&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
