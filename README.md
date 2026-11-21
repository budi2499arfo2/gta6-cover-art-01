# Neon Coast — a GTA-style cover art studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/budi2499arfo2/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/budi2499arfo2/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Drop in your own photos, type a caption, pick a grade, and the studio lays them
out as a multi-panel cover poster — the boxed panel grid, the two-tone wordmark
in the title band, the sun-blasted colour grade — then exports it as a PNG at
1080 × 1080, 1080 × 1350 or 1920 × 1080.

Everything runs in the browser from `app/`: no build step, no network request,
no upload. Your photos are read with `createImageBitmap` on your own machine and
never leave it. The renderer is hand-written Canvas 2D — no image assets and no
canvas library — with every measurement expressed as a fraction of the canvas,
so one `renderCover()` call paints the poster at any of the three frame sizes.

## What it does

- **Panels** — 2 to 6, in a layout that changes with the count and the frame's
  aspect (wide frames get a hero cell beside a stack; tall frames stack a hero
  over a pair).
- **Crop** — pick a panel and set its zoom and X/Y offset; portrait photos in a
  wide cell are biased toward the upper half automatically, and *Shuffle crops*
  re-seeds every panel.
- **Grade** — five presets (`vice`, `neon`, `dusk`, `midnight`, `heat`), each a
  duotone wash plus a sky gradient over the grid, so photos from different
  sources read as one poster.
- **Lettering** — the caption is set in Anton as a two-tone wordmark with a thick
  ink outline, auto-fitted to the band; the subtitle row carries the "VI"
  edition colophon.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

`serve.ts` is a Node 22 static server for `app/` (no dependencies). Any static
file server works — open `app/index.html` from one.

To hand the entry in the way the competition reads it:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes
`dossier.json` there with the kit's `buildDossier` from `vendor/makefun-app.ts`.

## Screenshots

`shots.json` records the fixed scenes the screenshots were taken from; each is a
query on `app/index.html`:

```
?shot=cover&photo=pier,boulevard&caption=Neon%20Nights&frame=16:9&count=6&preset=midnight
?shot=editor&photo=boulevard,pier&caption=Sunset%20Heist&frame=1:1&count=4&preset=vice
```

## Fonts

Anton, Bebas Neue and Pacifico ship under `app/fonts/` with their SIL Open Font
License files. No Rockstar artwork, logo or font is used or imitated.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
