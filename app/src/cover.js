// VICE COVER STUDIO — the poster renderer.
//
// One function, renderCover(ctx, opts), paints a whole GTA-poster cover into any 2D context at any size.
// Everything is laid out in "design units" on a 1080-unit-wide basis and then scaled by the context at the
// end, so a 1080x1080 preview, a 1080x1350 print and a 1920x1080 frame all share one geometry: the taller
// (or shorter) the canvas, the more (or less) vertical room the panel grid gets, and the type re-fits itself.
//
// The look is built in layers, back to front: a Venetian-sunset backdrop, the panel grid (each panel a photo
// cropped and graded on its own), a global colour grade (sunset gradient, flare, bloom), the title band with
// its lettering, then the film finish (vignette, grain, scanlines, frame). No libraries, no network, no fonts
// beyond what the machine already has.

/** The width every coordinate in this file is written against. */
export const DESIGN_WIDTH = 1080;

/** The panel counts the maker offers. */
export const PANEL_COUNTS = [2, 3, 4, 5, 6];

/** The most panels a poster can hold (panel state is kept for all of them). */
export const MAX_PANELS = 6;

/**
 * The colour presets. Each is a complete grade: backdrop, panel wash, title fill, flare and ink. `sky` is the
 * full-canvas sunset gradient (top, middle, bottom), laid over the panels in 'overlay' and 'screen' passes.
 */
export const PRESETS = [
  {
    id: 'vice',
    name: 'Vice Sunset',
    hint: 'magenta / cyan / tangerine',
    swatch: ['#ff2d95', '#22e0ff', '#ff9a3d'],
    backdrop: ['#2a0640', '#5c1064', '#1b0323'],
    gutter: '#0b0216',
    ink: ['#220a33', '#0b0316'],
    accentA: '#ff2d95',
    accentB: '#3de4ff',
    accentC: '#ffb35c',
    washTop: 'rgba(255, 45, 149, 0.55)',
    washBottom: 'rgba(255, 140, 54, 0.55)',
    washDeep: 'rgba(58, 8, 96, 0.45)',
    sky: ['rgba(64, 8, 104, 0.62)', 'rgba(255, 45, 149, 0.30)', 'rgba(255, 150, 70, 0.52)'],
    sun: 'rgba(255, 214, 160, 1)',
    titleFill: ['#ffffff', '#ffe6f6', '#ff9ed8', '#ffb264'],
    titleOutline: '#12021d',
    titleEdge: '#4d0a44',
    bandLine: 'rgba(255, 45, 149, 0.75)',
  },
  {
    id: 'neon',
    name: 'Miami Neon',
    hint: 'electric pink / ultramarine',
    swatch: ['#ff2eea', '#2b4bff', '#21f3ff'],
    backdrop: ['#070726', '#2a0b55', '#05040f'],
    gutter: '#040310',
    ink: ['#0b0a2c', '#03030e'],
    accentA: '#ff2eea',
    accentB: '#35d8ff',
    accentC: '#8f7bff',
    washTop: 'rgba(60, 60, 255, 0.55)',
    washBottom: 'rgba(255, 46, 234, 0.55)',
    washDeep: 'rgba(12, 6, 62, 0.45)',
    sky: ['rgba(24, 10, 110, 0.66)', 'rgba(255, 46, 234, 0.26)', 'rgba(60, 120, 255, 0.5)'],
    sun: 'rgba(190, 230, 255, 1)',
    titleFill: ['#ffffff', '#e9e4ff', '#b9a6ff', '#4fe6ff'],
    titleOutline: '#08031c',
    titleEdge: '#1c1160',
    bandLine: 'rgba(90, 180, 255, 0.8)',
  },
  {
    id: 'heat',
    name: 'Blood Orange',
    hint: 'scarlet / gold / smoke',
    swatch: ['#ff3b30', '#ffa000', '#ff7a59'],
    backdrop: ['#2a0703', '#611204', '#140301'],
    gutter: '#0d0201',
    ink: ['#2b0a06', '#0c0201'],
    accentA: '#ff4a2e',
    accentB: '#ffb01f',
    accentC: '#ff8f6b',
    washTop: 'rgba(255, 74, 46, 0.55)',
    washBottom: 'rgba(255, 176, 31, 0.5)',
    washDeep: 'rgba(74, 8, 4, 0.45)',
    sky: ['rgba(96, 10, 4, 0.62)', 'rgba(255, 74, 46, 0.30)', 'rgba(255, 170, 60, 0.55)'],
    sun: 'rgba(255, 226, 160, 1)',
    titleFill: ['#fffdf6', '#ffe9c9', '#ffb265', '#ff6a3d'],
    titleOutline: '#1a0400',
    titleEdge: '#5c1203',
    bandLine: 'rgba(255, 120, 60, 0.8)',
  },
  {
    id: 'chrome',
    name: 'Chrome Dusk',
    hint: 'ice blue / mauve / silver',
    swatch: ['#9fb7ff', '#d9e6ff', '#ff7ad9'],
    backdrop: ['#0a1220', '#20243e', '#06080f'],
    gutter: '#04060b',
    ink: ['#101828', '#05070d'],
    accentA: '#ff7ad9',
    accentB: '#a9c6ff',
    accentC: '#eaf1ff',
    washTop: 'rgba(120, 160, 255, 0.5)',
    washBottom: 'rgba(255, 122, 217, 0.42)',
    washDeep: 'rgba(10, 22, 44, 0.5)',
    sky: ['rgba(26, 44, 86, 0.66)', 'rgba(190, 140, 220, 0.22)', 'rgba(255, 150, 200, 0.34)'],
    sun: 'rgba(236, 246, 255, 1)',
    titleFill: ['#ffffff', '#eef3ff', '#c3d3ff', '#ffb3e4'],
    titleOutline: '#050810',
    titleEdge: '#232c4d',
    bandLine: 'rgba(170, 200, 255, 0.8)',
  },
  {
    id: 'acid',
    name: 'Acid Wave',
    hint: 'lime / teal / hot pink',
    swatch: ['#b6ff3d', '#00f5c4', '#ff2d95'],
    backdrop: ['#04180f', '#0d3a2a', '#020a06'],
    gutter: '#020805',
    ink: ['#06231a', '#020906'],
    accentA: '#b6ff3d',
    accentB: '#00f5c4',
    accentC: '#ff2d95',
    washTop: 'rgba(0, 245, 196, 0.45)',
    washBottom: 'rgba(182, 255, 61, 0.4)',
    washDeep: 'rgba(4, 44, 30, 0.45)',
    sky: ['rgba(4, 52, 36, 0.66)', 'rgba(0, 245, 196, 0.22)', 'rgba(182, 255, 61, 0.42)'],
    sun: 'rgba(226, 255, 190, 1)',
    titleFill: ['#ffffff', '#eaffd6', '#b6ff3d', '#39f5d0'],
    titleOutline: '#02110a',
    titleEdge: '#0c3c2a',
    bandLine: 'rgba(120, 255, 200, 0.8)',
  },
];

/** A font stack of narrow, heavy faces that ship with desktop Linux, macOS and Windows; no download. */
const TITLE_FONT = "'Liberation Sans Narrow', 'Arial Narrow', 'Nimbus Sans Narrow', 'Helvetica Neue Condensed', 'Roboto Condensed', Impact, sans-serif";
/** Small caps and labels. */
const LABEL_FONT = "'Liberation Sans', 'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif";
/** The technical line under the title. */
const MONO_FONT = "'DejaVu Sans Mono', 'Liberation Mono', 'Courier New', monospace";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** A tiny seeded PRNG so the grain is identical on every render. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let noiseTile = null;
/** A 192-square film-grain tile: grey noise that an 'overlay' pass turns into texture without shifting colour. */
function noisePattern(ctx) {
  if (noiseTile === null) {
    const size = 192;
    const tile = document.createElement('canvas');
    tile.width = size;
    tile.height = size;
    const tctx = tile.getContext('2d');
    const data = tctx.createImageData(size, size);
    const rnd = mulberry32(0x5eed1e);
    for (let i = 0; i < size * size; i++) {
      const v = 128 + (rnd() * 2 - 1) * 96;
      data.data[i * 4] = v;
      data.data[i * 4 + 1] = v;
      data.data[i * 4 + 2] = v;
      data.data[i * 4 + 3] = 255;
    }
    tctx.putImageData(data, 0, 0);
    noiseTile = tile;
  }
  return ctx.createPattern(noiseTile, 'repeat');
}

let scanTile = null;
/** A 3-unit scanline tile: one dark row, two clear ones. */
function scanPattern(ctx) {
  if (scanTile === null) {
    const tile = document.createElement('canvas');
    tile.width = 3;
    tile.height = 3;
    const tctx = tile.getContext('2d');
    tctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    tctx.fillRect(0, 0, 3, 1);
    scanTile = tile;
  }
  return ctx.createPattern(scanTile, 'repeat');
}

/** The starting crop for each panel slot: varied zooms and offsets so a fresh poster already reads as a collage. */
export function defaultPanelCrops() {
  return [
    { zoom: 1.16, ox: 0.05, oy: -0.12 },
    { zoom: 1.02, ox: -0.08, oy: 0.06 },
    { zoom: 1.34, ox: 0.12, oy: 0.16 },
    { zoom: 1.08, ox: -0.16, oy: -0.05 },
    { zoom: 1.26, ox: 0.2, oy: 0.1 },
    { zoom: 0.98, ox: 0, oy: 0 },
  ];
}

/**
 * The cells a poster of `count` panels is cut into, as fractions of the grid rectangle.
 * The rhythm is the one the old GTA covers use: one hero print with the rest of the contact sheet packed
 * around it, so the montage has a focal point instead of reading as equal tiles.
 */
export function panelCells(count, aspect) {
  const tall = aspect < 0.94;
  if (count <= 2) {
    return tall
      ? [[0, 0, 1, 0.52], [0, 0.52, 1, 0.48]]
      : [[0, 0, 0.52, 1], [0.52, 0, 0.48, 1]];
  }
  if (count === 3) {
    // Hero left, two stacked right.
    return tall
      ? [[0, 0, 1, 0.46], [0, 0.46, 0.5, 0.54], [0.5, 0.46, 0.5, 0.54]]
      : [[0, 0, 0.62, 1], [0.62, 0, 0.38, 0.5], [0.62, 0.5, 0.38, 0.5]];
  }
  if (count === 4) {
    // Hero left, three stacked right: the classic case-and-poster shape. On a tall frame the hero leads and
    // the other three sit in a row across the foot.
    return tall
      ? [[0, 0, 1, 0.42], [0, 0.42, 1 / 3, 0.58], [1 / 3, 0.42, 1 / 3, 0.58], [2 / 3, 0.42, 1 / 3, 0.58]]
      : [[0, 0, 0.58, 1], [0.58, 0, 0.42, 1 / 3], [0.58, 1 / 3, 0.42, 1 / 3], [0.58, 2 / 3, 0.42, 1 / 3]];
  }
  if (count === 5) {
    // Hero left with two companions stacked beside it, then a full-width pair across the foot.
    return tall
      ? [[0, 0, 0.62, 0.52], [0.62, 0, 0.38, 0.26], [0.62, 0.26, 0.38, 0.26], [0, 0.52, 0.5, 0.48], [0.5, 0.52, 0.5, 0.48]]
      : [[0, 0, 0.5, 1], [0.5, 0, 0.25, 1], [0.75, 0, 0.25, 1 / 3], [0.75, 1 / 3, 0.25, 1 / 3], [0.75, 2 / 3, 0.25, 1 / 3]];
  }
  if (tall) {
    // Six on a tall frame: a hero block, two companions beside it, three across the foot.
    return [
      [0, 0, 0.5, 0.54],
      [0.5, 0, 0.25, 0.27],
      [0.75, 0, 0.25, 0.27],
      [0.5, 0.27, 0.5, 0.27],
      [0, 0.54, 0.5, 0.46],
      [0.5, 0.54, 0.5, 0.46],
    ];
  }
  return [
    [0, 0, 0.5, 0.5],
    [0.5, 0, 0.25, 0.5],
    [0.75, 0, 0.25, 0.5],
    [0, 0.5, 0.25, 0.5],
    [0.25, 0.5, 0.25, 0.5],
    [0.5, 0.5, 0.5, 0.5],
  ];
}

// ---------------------------------------------------------------- type

/** Width of a string drawn with manual tracking (letter-spacing), which is what the display type uses. */
function trackedWidth(ctx, text, tracking) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + tracking;
  return Math.max(0, w - (text.length > 0 ? tracking : 0));
}

/** Draws a string one glyph at a time so tracking is exact, in fill or stroke mode. */
function drawTracked(ctx, text, x, y, tracking, mode) {
  let cx = x;
  for (const ch of text) {
    if (mode === 'stroke') ctx.strokeText(ch, cx, y);
    else ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
}

/** The largest size at or below `start` that keeps `text` inside `maxW`, floored at `min`. */
function fitSize(ctx, text, start, min, maxW, trackingRatio) {
  let size = Math.max(min, start);
  for (let guard = 0; guard < 90; guard++) {
    ctx.font = `700 ${size}px ${TITLE_FONT}`;
    if (trackedWidth(ctx, text, size * trackingRatio) <= maxW) return size;
    if (size <= min) return min;
    size = Math.max(min, size * 0.975);
  }
  return size;
}

/** Splits a caption into two lines near its middle so a long title can stay big; null when one word. */
function splitCaption(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  let best = null;
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const score = Math.abs(a.length - b.length) + Math.max(0, b.length - a.length) * 0.35;
    if (score < bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }
  return best;
}

/** Small caps label with tracking, used for the subtitle, the meta line and the strip. */
function labelWidth(ctx, text, tracking) {
  return trackedWidth(ctx, text, tracking);
}

// ---------------------------------------------------------------- layout

/**
 * Works out every rectangle the poster needs, in design units, from the canvas aspect alone.
 * The title band takes a fixed share of the height so it stays legible at 16:9 as well as 4:5, and the panel
 * grid gets whatever is left between the top strip and the band.
 */
export function planLayout(ctx, opts, width, height) {
  const HD = (height / width) * DESIGN_WIDTH;
  const aspect = width / height;
  const landscape = aspect > 1.25;
  const pad = clamp(Math.round(DESIGN_WIDTH * 0.028), 22, 34);
  const topStrip = landscape ? 38 : 46;
  const bandH = Math.round(clamp(HD * (landscape ? 0.4 : HD > 1150 ? 0.3 : 0.315), 150, 470));
  const bandY = HD - bandH;
  const gridGap = 18;
  const grid = {
    x: pad,
    y: topStrip + 10,
    w: DESIGN_WIDTH - pad * 2,
    h: Math.max(80, bandY - gridGap - (topStrip + 10)),
  };
  const count = clamp(Math.round(opts.count ?? 4), 2, MAX_PANELS);
  const fractions = panelCells(count, aspect);
  const gutter = landscape ? 7 : 8;
  const cells = fractions.map(([fx, fy, fw, fh]) => ({
    x: grid.x + fx * grid.w + (fx > 0 ? gutter / 2 : 0),
    y: grid.y + fy * grid.h + (fy > 0 ? gutter / 2 : 0),
    w: fw * grid.w - (fx > 0 ? gutter / 2 : 0) - (fx + fw < 1 ? gutter / 2 : 0),
    h: fh * grid.h - (fy > 0 ? gutter / 2 : 0) - (fy + fh < 1 ? gutter / 2 : 0),
  }));
  // Sort the cells into reading order — down the rows, left to right — so a panel's index is also its
  // place on the sheet. The fractions above are written in composition order (hero first), which is what
  // gives the layout its focal point but is not what a reader's eye follows; numbering the frames by
  // composition order leaves the little corner numbers jumping around. Reordering here keeps the drawing
  // order, the photo assignment and the labels in one sequence.
  const order = cells.map((_, i) => i).sort((a, b) => {
    const A = cells[a];
    const B = cells[b];
    const band = Math.min(A.h, B.h) * 0.45;
    if (Math.abs(A.y - B.y) > band) return A.y - B.y;
    return A.x - B.x;
  });
  const sorted = order.map((i) => cells[i]);
  sorted.forEach((cell, i) => { cell.index = i; });
  return { W: DESIGN_WIDTH, HD, aspect, landscape, pad, topStrip, bandY, bandH, grid, cells: sorted, gutter, count };
}

// ---------------------------------------------------------------- backdrop

/** The sunset backdrop that shows through the gutters and around the panels. */
function drawBackdrop(ctx, plan, preset) {
  const { W, HD } = plan;
  const sky = ctx.createLinearGradient(0, 0, W * 0.25, HD);
  sky.addColorStop(0, preset.backdrop[0]);
  sky.addColorStop(0.52, preset.backdrop[1]);
  sky.addColorStop(1, preset.backdrop[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HD);

  // Two soft light sources behind the collage, so the gutters glow instead of reading flat black.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const glow = ctx.createRadialGradient(W * 0.78, HD * 0.16, 0, W * 0.78, HD * 0.16, W * 0.5);
  glow.addColorStop(0, preset.accentC);
  glow.addColorStop(0.35, preset.accentA);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, HD);
  const cool = ctx.createRadialGradient(W * 0.14, HD * 0.62, 0, W * 0.14, HD * 0.62, W * 0.55);
  cool.addColorStop(0, preset.accentB);
  cool.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, W, HD);
  ctx.restore();

  // Fine diagonal ribs: a printed-poster texture rather than a flat fill.
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -HD; x < W + HD; x += 26) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x + HD, HD);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- panels

/** Draws one photo into a cell, cover-fitted, then zoomed and offset by the panel's crop. */
function drawPhoto(ctx, img, cell, crop) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = clamp(crop.zoom ?? 1, 0.95, 2.4);
  const scale = Math.max(cell.w / iw, cell.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const slackX = Math.max(0, dw - cell.w) / 2;
  const slackY = Math.max(0, dh - cell.h) / 2;
  const dx = cell.x + (cell.w - dw) / 2 + clamp(crop.ox ?? 0, -1, 1) * slackX;
  const dy = cell.y + (cell.h - dh) / 2 + clamp(crop.oy ?? 0, -1, 1) * slackY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** An empty panel: a dark gradient plate with a hatch and a small prompt, so the poster still composes. */
function drawEmptyPanel(ctx, cell) {
  const g = ctx.createLinearGradient(cell.x, cell.y, cell.x + cell.w, cell.y + cell.h);
  g.addColorStop(0, '#1c1030');
  g.addColorStop(1, '#0b0614');
  ctx.fillStyle = g;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(cell.x, cell.y, cell.w, cell.h);
  ctx.clip();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = cell.x - cell.h; x < cell.x + cell.w + cell.h; x += 24) {
    ctx.moveTo(x, cell.y + cell.h);
    ctx.lineTo(x + cell.h, cell.y);
  }
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = `600 ${Math.max(12, cell.h * 0.055)}px ${LABEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD A PHOTO', cell.x + cell.w / 2, cell.y + cell.h / 2);
  ctx.restore();
}

/** The per-panel grade: a two-tone wash, a top/bottom falloff and an inner vignette, clipped to the cell. */
function gradePanel(ctx, cell, preset, seed) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(cell.x, cell.y, cell.w, cell.h);
  ctx.clip();

  // Cool the shadows toward the preset's deep tone and warm the highlights, so every photo sits in one film.
  // Panels differ only by the direction of that wash, never by its strength: six stills off one roll, not
  // six copies of one still, and no single frame jumping out of the sheet.
  const warmFirst = seed % 2 === 0;
  const wash = ctx.createLinearGradient(cell.x, cell.y, cell.x + cell.w * 0.35, cell.y + cell.h);
  wash.addColorStop(0, warmFirst ? preset.washTop : preset.washBottom);
  wash.addColorStop(0.55, preset.washDeep);
  wash.addColorStop(1, warmFirst ? preset.washBottom : preset.washTop);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = wash;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);

  // A touch of desaturation keeps six different photos reading as one printed sheet.
  ctx.globalCompositeOperation = 'saturation';
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#7c7c8a';
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);

  // Screen back a little light in the top corner: the sun is always just off frame.
  ctx.globalCompositeOperation = 'screen';
  const lift = ctx.createRadialGradient(
    cell.x + cell.w * (0.8 - (seed % 3) * 0.16),
    cell.y + cell.h * 0.1,
    0,
    cell.x + cell.w * 0.72,
    cell.y + cell.h * 0.08,
    cell.w * 0.8,
  );
  lift.addColorStop(0, preset.accentC);
  lift.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = lift;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);

  // Print falloff: darker at the foot of every panel, like the old screen-printed covers.
  ctx.globalCompositeOperation = 'source-over';
  const foot = ctx.createLinearGradient(0, cell.y, 0, cell.y + cell.h);
  foot.addColorStop(0, 'rgba(10, 2, 20, 0.2)');
  foot.addColorStop(0.32, 'rgba(10, 2, 20, 0)');
  foot.addColorStop(0.72, 'rgba(10, 2, 20, 0.04)');
  foot.addColorStop(1, 'rgba(6, 1, 14, 0.44)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = foot;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);

  const inner = ctx.createRadialGradient(
    cell.x + cell.w / 2,
    cell.y + cell.h * 0.46,
    Math.min(cell.w, cell.h) * 0.3,
    cell.x + cell.w / 2,
    cell.y + cell.h * 0.5,
    Math.max(cell.w, cell.h) * 0.8,
  );
  inner.addColorStop(0, 'rgba(0, 0, 0, 0)');
  inner.addColorStop(1, 'rgba(0, 0, 0, 0.34)');
  ctx.fillStyle = inner;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.restore();
}

/** The black keyline and the thin light bevel that make each panel read as a pasted print. */
function strokePanel(ctx, cell, preset) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(4, 1, 10, 0.9)';
  ctx.strokeRect(cell.x - 1.5, cell.y - 1.5, cell.w + 3, cell.h + 3);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.strokeRect(cell.x + 0.6, cell.y + 0.6, cell.w - 1.2, cell.h - 1.2);
  ctx.restore();
}

/** The tiny frame number in a panel's corner, plus its bracket — a contact-sheet detail. */
function markPanel(ctx, cell, index, preset) {
  const size = clamp(cell.h * 0.05, 11, 26);
  const x = cell.x + size * 0.9;
  const y = cell.y + cell.h - size * 0.8;
  ctx.save();
  ctx.font = `700 ${size}px ${MONO_FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
  ctx.fillText(String(index + 1).padStart(2, '0'), x, y);
  const w = ctx.measureText(String(index + 1).padStart(2, '0')).width;
  ctx.strokeStyle = preset.accentA;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w + 7, y - size * 0.32);
  ctx.lineTo(x + w + 7 + size * 0.9, y - size * 0.32);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- grade

/** The full-canvas grade: sunset gradient, sun flare, streak and a cool bloom along the top edge. */
function drawGrade(ctx, plan, preset) {
  const { W, HD } = plan;
  ctx.save();

  // Sunset wash across the whole sheet, 'overlay' then 'screen' — the Vice City signature.
  const sunset = ctx.createLinearGradient(0, 0, W * 0.12, HD);
  sunset.addColorStop(0, preset.sky[0]);
  sunset.addColorStop(0.48, preset.sky[1]);
  sunset.addColorStop(1, preset.sky[2]);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = sunset;
  ctx.fillRect(0, 0, W, HD);

  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = sunset;
  ctx.fillRect(0, 0, W, HD);

  // The sun, high right, with a wide anamorphic streak through it.
  const sunX = W * 0.8;
  const sunY = HD * 0.1;
  const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, W * 0.46);
  sun.addColorStop(0, preset.sun);
  sun.addColorStop(0.12, 'rgba(255, 220, 180, 0.85)');
  sun.addColorStop(0.4, 'rgba(255, 160, 120, 0.28)');
  sun.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, HD);

  ctx.save();
  ctx.translate(sunX, sunY);
  ctx.scale(1, 0.075);
  const streak = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.7);
  streak.addColorStop(0, 'rgba(255, 250, 235, 0.9)');
  streak.addColorStop(0.35, 'rgba(255, 200, 170, 0.28)');
  streak.addColorStop(1, 'rgba(255, 120, 160, 0)');
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = streak;
  ctx.fillRect(-W * 0.7, -W * 0.7, W * 1.4, W * 1.4);
  ctx.restore();

  // Cool bloom rising from the bottom-left, balancing the warm sun.
  const bloom = ctx.createRadialGradient(W * 0.08, HD, 0, W * 0.08, HD, W * 0.6);
  bloom.addColorStop(0, preset.accentB);
  bloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, HD);
  ctx.restore();
}

// ---------------------------------------------------------------- lettering

/**
 * Fits the caption into the band. The block is measured from the top of the band down, so the subtitle, the
 * caption and the technical line can never collide whatever size the caption ends up at: the caption simply
 * takes whatever room is left between them.
 */
function planType(ctx, plan, opts, preset) {
  const { W, bandH, bandY } = plan;
  const pad = plan.pad + 2;
  const markW = Math.min(bandH * 0.5, W * 0.155);
  const markGap = W * 0.028;
  const maxW = W - pad * 2 - markW - markGap;
  const raw = (opts.caption ?? '').trim().toUpperCase() || 'UNTITLED';
  const fontScale = clamp((opts.fontScale ?? 100) / 100, 0.4, 2);
  const subtitleRaw = (opts.subtitle ?? '').trim().toUpperCase();

  const metaSize = clamp(bandH * 0.046, 9, 24);
  const subtitleSize = clamp(bandH * 0.068, 10, 34);
  const padTop = bandH * 0.115;
  const capRatio = 0.72; // caps of the narrow grotesque sit at ~0.72 em above the baseline
  const gapSub = subtitleSize * 0.62;
  const metaBaseline = bandH - metaSize * 1.2 - bandH * 0.085;
  const titleTop = padTop + (subtitleRaw ? subtitleSize + gapSub : 0);
  const titleRoom = Math.max(bandH * 0.2, metaBaseline - metaSize * 1.6 - titleTop);

  const trackingRatio = -0.012;
  const min = Math.max(bandH * 0.12, 16);
  const base = Math.min(bandH * 0.5 * fontScale, titleRoom * 0.94);

  let lines = [raw];
  let size = fitSize(ctx, raw, base, min, maxW, trackingRatio);
  ctx.font = `700 ${size}px ${TITLE_FONT}`;
  if (trackedWidth(ctx, raw, size * trackingRatio) > maxW * 1.001) {
    const split = splitCaption(raw);
    if (split !== null) {
      lines = split;
      size = Math.min(
        fitSize(ctx, split[0], base, min, maxW, trackingRatio),
        fitSize(ctx, split[1], base, min, maxW, trackingRatio),
      );
    }
  }

  // Two lines have to share the vertical room; shrink until they fit inside titleRoom.
  const lineGap = 0.95;
  const blockH = size * (capRatio + lineGap * (lines.length - 1));
  if (blockH > titleRoom) size = Math.max(min * 0.7, (size * titleRoom) / blockH);
  ctx.font = `700 ${size}px ${TITLE_FONT}`;
  const widest = Math.max(...lines.map((line) => trackedWidth(ctx, line, size * trackingRatio)));

  return {
    pad,
    markW,
    markGap,
    maxW,
    raw,
    lines,
    size,
    capRatio,
    tracking: size * trackingRatio,
    widest,
    subtitle: subtitleRaw,
    subtitleSize,
    metaSize,
    padTop,
    titleTop,
    titleRoom,
    blockH: size * (capRatio + lineGap * (lines.length - 1)),
    lineGap,
    // Baselines are absolute canvas units: the band's own top plus the offset planned inside it.
    firstBaseline: bandY + titleTop + size * capRatio,
    markX: W - pad - markW,
    metaBaseline: bandY + metaBaseline,
  };
}

/** Draws the caption in the GTA register: a soft cast shadow, two heavy strokes, a gradient fill, a lit edge. */
function drawTitle(ctx, type, x, y, preset) {
  const { lines, size, tracking } = type;
  ctx.save();
  ctx.font = `700 ${size}px ${TITLE_FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const drawAll = (mode, dx, dy) => {
    lines.forEach((line, i) => {
      drawTracked(ctx, line, x + dx, y + dy + i * size * type.lineGap, tracking, mode);
    });
  };

  // 1. cast shadow, blurred off the glyph edges so the type sits on the plate
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#05010c';
  ctx.filter = `blur(${Math.max(2, size * 0.085)}px)`;
  drawAll('fill', size * 0.035, size * 0.06);
  ctx.restore();

  // 2. the wide ink outline
  ctx.strokeStyle = preset.titleOutline;
  ctx.lineWidth = size * 0.175;
  drawAll('stroke', 0, 0);

  // 3. a tighter rim in the preset's own colour
  ctx.strokeStyle = preset.titleEdge;
  ctx.lineWidth = size * 0.072;
  drawAll('stroke', 0, 0);

  // 4. the metal fill: white at the top through pink to gold at the foot
  const top = y - size * type.capRatio;
  const bottom = y + size * 0.2 + (lines.length - 1) * size * type.lineGap;
  const fill = ctx.createLinearGradient(0, top, 0, Math.max(bottom, top + size));
  const stops = preset.titleFill;
  fill.addColorStop(0, stops[0]);
  fill.addColorStop(0.36, stops[1]);
  fill.addColorStop(0.74, stops[2]);
  fill.addColorStop(1, stops[3]);
  ctx.fillStyle = fill;
  drawAll('fill', 0, 0);

  // 5. a highlight along the upper edge, and a warm bounce along the lower one
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, size * 0.011);
  drawAll('stroke', -size * 0.005, -size * 0.012);
  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = preset.accentC;
  ctx.lineWidth = Math.max(1, size * 0.018);
  drawAll('stroke', size * 0.004, size * 0.014);
  ctx.restore();

  ctx.restore();
}

/** The 'VI' lockup at the right of the band: a numeral sharing the caption baseline, then a rule and the year. */
function drawMark(ctx, type, plan, preset) {
  const { bandH } = plan;
  // The numeral is a colophon, not a second headline: kept clearly smaller than the caption so the eye
  // lands on the title first and reads 'VI' as a stamp on the artwork.
  const size = Math.min(type.size * 0.62, type.markW * 0.86);
  const x = type.markX;
  const baseline = type.firstBaseline;
  const tracking = -size * 0.02;
  ctx.save();
  ctx.font = `700 ${size}px ${TITLE_FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  const w = trackedWidth(ctx, 'VI', tracking);
  const mx = x + (type.markW - w) / 2;

  ctx.strokeStyle = preset.titleOutline;
  ctx.lineWidth = size * 0.175;
  drawTracked(ctx, 'VI', mx, baseline, tracking, 'stroke');
  ctx.strokeStyle = preset.titleEdge;
  ctx.lineWidth = size * 0.072;
  drawTracked(ctx, 'VI', mx, baseline, tracking, 'stroke');
  const fill = ctx.createLinearGradient(0, baseline - size * 0.74, 0, baseline);
  fill.addColorStop(0, preset.titleFill[0]);
  fill.addColorStop(0.45, preset.titleFill[2]);
  fill.addColorStop(1, preset.titleFill[3]);
  ctx.fillStyle = fill;
  drawTracked(ctx, 'VI', mx, baseline, tracking, 'fill');

  // rule + year, aligned to the numeral's own width
  const ruleY = baseline + size * 0.2;
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = preset.accentA;
  ctx.fillRect(x, ruleY, type.markW, Math.max(1.5, bandH * 0.005));
  ctx.globalAlpha = 0.6;
  ctx.font = `600 ${Math.max(9, type.metaSize * 0.92)}px ${MONO_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('EST. 1986', x + type.markW / 2, ruleY + type.metaSize * 1.75);
  ctx.restore();
}

/** The bottom band: ink plate, accent rule, subtitle, caption, meta line. */
function drawBand(ctx, plan, type, preset, opts) {
  const { W, HD, bandY, bandH } = plan;
  const pad = type.pad;

  // A scrim above the band so the panels slide into the type instead of being cut by it.
  const scrim = ctx.createLinearGradient(0, bandY - bandH * 0.34, 0, bandY + bandH * 0.1);
  scrim.addColorStop(0, 'rgba(8, 2, 16, 0)');
  scrim.addColorStop(1, 'rgba(8, 2, 16, 0.62)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - bandH * 0.36, W, bandH * 0.48);

  // The plate itself.
  const plate = ctx.createLinearGradient(0, bandY, W * 0.35, HD);
  plate.addColorStop(0, preset.ink[0]);
  plate.addColorStop(0.62, preset.ink[1]);
  plate.addColorStop(1, '#050109');
  ctx.fillStyle = plate;
  ctx.fillRect(0, bandY, W, HD - bandY);

  // The accent rule along the top edge, brightest in the middle.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const rule = ctx.createLinearGradient(pad, 0, W - pad, 0);
  rule.addColorStop(0, preset.accentA);
  rule.addColorStop(0.45, preset.accentC);
  rule.addColorStop(1, preset.accentB);
  ctx.fillStyle = rule;
  ctx.fillRect(pad, bandY - 3, W - pad * 2, 3);
  ctx.globalAlpha = 0.3;
  ctx.fillRect(pad, bandY - 10, W - pad * 2, 1);
  ctx.restore();

  // Subtitle row: a diamond, the words, then a hairline running toward the numeral.
  if (type.subtitle !== '') {
    const subBaseline = plan.bandY + type.padTop + type.subtitleSize * 0.74;
    const track = type.subtitleSize * 0.3;
    ctx.save();
    ctx.font = `600 ${type.subtitleSize}px ${LABEL_FONT}`;
    ctx.textBaseline = 'alphabetic';
    let size = type.subtitleSize;
    for (let guard = 0; guard < 40 && trackedWidth(ctx, type.subtitle, size * 0.3) > type.maxW * 0.72; guard++) {
      size *= 0.96;
      ctx.font = `600 ${size}px ${LABEL_FONT}`;
    }
    const subW = trackedWidth(ctx, type.subtitle, size * 0.3);
    const diamond = size * 0.38;
    ctx.save();
    ctx.translate(pad + diamond * 0.5, subBaseline - size * 0.3);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = preset.accentA;
    ctx.fillRect(-diamond / 2, -diamond / 2, diamond, diamond);
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const textX = pad + diamond + size * 0.62;
    drawTracked(ctx, type.subtitle, textX, subBaseline, size * 0.3, 'fill');
    const lineFrom = textX + subW + size * 0.85;
    const lineTo = type.markX - type.markGap * 0.4;
    if (lineTo > lineFrom + 12) {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(lineFrom, subBaseline - size * 0.3, lineTo - lineFrom, 1.2);
    }
    ctx.restore();
  }

  // Caption.
  drawTitle(ctx, type, pad, type.firstBaseline, preset);

  // Technical line at the foot of the band.
  const metaY = type.metaBaseline;
  const count = String(plan.count).padStart(2, '0');
  const meta = `${count} PANELS   ·   ${preset.name.toUpperCase()}   ·   ${opts.ratioLabel ?? '1:1'}`;
  ctx.save();
  ctx.font = `600 ${type.metaSize}px ${MONO_FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.46)';
  drawTracked(ctx, meta, pad, metaY, type.metaSize * 0.2, 'fill');
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillText('VICE COVER STUDIO', W - pad, metaY);
  ctx.restore();

  // The numeral lockup.
  drawMark(ctx, type, plan, preset);
}

/** The billing strip above the panels. */
function drawTopStrip(ctx, plan, preset) {
  const { W, pad, topStrip } = plan;
  ctx.save();
  const scrim = ctx.createLinearGradient(0, 0, 0, topStrip);
  scrim.addColorStop(0, 'rgba(6, 1, 14, 0.6)');
  scrim.addColorStop(1, 'rgba(6, 1, 14, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, topStrip + 16);

  const size = clamp(topStrip * 0.3, 9, 17);
  ctx.font = `600 ${size}px ${LABEL_FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.66)';
  drawTracked(ctx, 'A VICE COVER STUDIO PICTURE', pad, topStrip * 0.52, size * 0.24, 'fill');
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.44)';
  ctx.fillText('SUNSET / 1986 / 35MM', W - pad, topStrip * 0.52);
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = preset.accentA;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, topStrip - 1);
  ctx.lineTo(W - pad, topStrip - 1);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- finish

/** Vignette, grain, scanlines and the outer frame: the film finish over everything, type included. */
function drawFinish(ctx, plan, preset) {
  const { W, HD } = plan;

  const vignette = ctx.createRadialGradient(W * 0.5, HD * 0.44, Math.min(W, HD) * 0.2, W * 0.5, HD * 0.5, Math.max(W, HD) * 0.8);
  vignette.addColorStop(0, 'rgba(6, 1, 14, 0)');
  vignette.addColorStop(0.58, 'rgba(6, 1, 14, 0.16)');
  vignette.addColorStop(1, 'rgba(3, 0, 8, 0.88)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, HD);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = noisePattern(ctx);
  ctx.fillRect(0, 0, W, HD);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = scanPattern(ctx);
  ctx.fillRect(0, 0, W, HD);
  ctx.restore();

  // Warm leak at the top edge and a cool one at the foot, then the frame.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const leak = ctx.createLinearGradient(0, 0, 0, HD * 0.16);
  leak.addColorStop(0, preset.accentC);
  leak.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = leak;
  ctx.fillRect(0, 0, W, HD * 0.18);
  const cool = ctx.createLinearGradient(0, HD, 0, HD - HD * 0.12);
  cool.addColorStop(0, preset.accentB);
  cool.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = cool;
  ctx.fillRect(0, HD - HD * 0.14, W, HD * 0.14);
  ctx.restore();

  const inset = 9;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(inset, inset, W - inset * 2, HD - inset * 2);
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = preset.accentA;
  ctx.lineWidth = 2;
  const tick = 26;
  const corners = [
    [inset, inset, 1, 1],
    [W - inset, inset, -1, 1],
    [inset, HD - inset, 1, -1],
    [W - inset, HD - inset, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * tick, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * tick);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- entry point

/**
 * Paints the whole poster into `ctx`. The context's canvas decides the pixel size; `opts` carries the copy and
 * the panel states:
 *   count      2..6 panels
 *   panels     [{ img, zoom, ox, oy }] one per cell (img may be null)
 *   caption    the display line, drawn in the heavy condensed face
 *   subtitle   the small tracked line above it
 *   fontScale  60..150, the title's size budget
 *   preset     one of PRESETS
 *   ratioLabel '1:1', '4:5' or '16:9', printed in the technical line
 */
export function renderCover(ctx, opts) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;
  if (!(width > 0 && height > 0)) return;
  const preset = opts.preset ?? PRESETS[0];
  const scale = width / DESIGN_WIDTH;

  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const plan = planLayout(ctx, opts, width, height);
  drawBackdrop(ctx, plan, preset);

  // Gutters first: the whole grid sits on a black plate so the gaps stay black whatever the backdrop does.
  ctx.fillStyle = preset.gutter;
  ctx.fillRect(plan.grid.x - plan.gutter, plan.grid.y - plan.gutter, plan.grid.w + plan.gutter * 2, plan.grid.h + plan.gutter * 2);

  const panels = opts.panels ?? [];
  plan.cells.forEach((cell, i) => {
    const state = panels[i] ?? {};
    ctx.save();
    ctx.beginPath();
    ctx.rect(cell.x, cell.y, cell.w, cell.h);
    ctx.clip();
    if (state.img) {
      drawPhoto(ctx, state.img, cell, state);
      gradePanel(ctx, cell, preset, i);
    } else {
      drawEmptyPanel(ctx, cell);
    }
    ctx.restore();
    strokePanel(ctx, cell, preset);
    markPanel(ctx, cell, i, preset);
  });

  drawGrade(ctx, plan, preset);
  drawTopStrip(ctx, plan, preset);

  const type = planType(ctx, plan, opts, preset);
  drawBand(ctx, plan, type, preset, opts);

  drawFinish(ctx, plan, preset);
  ctx.restore();
}

/** A one-stop helper for exports and the live preview: sizes a canvas, renders, returns it. */
export function renderToCanvas(width, height, opts) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  renderCover(canvas.getContext('2d'), opts);
  return canvas;
}
