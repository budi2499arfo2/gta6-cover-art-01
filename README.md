# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/budi2499arfo2/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/budi2499arfo2/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A GTA-poster-style cover art maker that runs entirely offline in a desktop browser. Drop in
your own photos, pick a layout and a Vice City colour grade, write a caption, and export a
real PNG at 1080×1080, 1080×1350 or 1920×1080. Photos never leave the machine: the app is
static files with no library, no CDN and no network request of any kind.

Art, lettering and grading are hand-written canvas 2D code — the multi-panel grid, per-panel
crop and colour wash, sunset/neon grade, film grain, vignette and the bold title band. No
Rockstar Games logo, artwork, character or font is used or bundled; every glyph is drawn with
the machine's own fonts, so the app is self-contained and ships no third-party font file.

## Run it

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

Or hand it in the way the grader does:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json`
with the vendored `vendor/makefun-app.ts` library (copied unchanged from the kit).

## How it works

- `app/index.html` — the editing bench: photo dropzone, panel count, frame, colour preset,
  caption/subtitle, title size, per-panel zoom and offset, shuffle and the three exports.
- `app/src/cover.js` — `renderCover(ctx, opts)`, the whole poster. Everything is laid out on a
  1080-unit design basis and scaled, so one geometry serves 1:1, 4:5 and 16:9. Panels get a
  hero-and-contact-sheet rhythm, each cell crops its photo on its own, then the grade, flare,
  lettering and film finish are layered on top.
- `app/src/main.js` — DOM wiring, image intake, the live canvas, and real PNG export (the
  poster is redrawn at full resolution before encoding, never upscaled).
- `screenshots/` — four captures of the app running: a 1:1 cover, the editor with a photo
  loaded, a 4:5 poster and a 16:9 wide frame.

## Features

- 2 to 6 panels, five colour presets, three export frames.
- Multi-file photo intake by drag-and-drop or browse, one crop per panel.
- Caption and subtitle with auto-fit lettering that never collides with the band's own lines.
- Exports exact-size PNGs, redrawn at full resolution.

---

<sub>Entered on [make.fun](https://make.fun/?ref=1ecnjcb9&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
