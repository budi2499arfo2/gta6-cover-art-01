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
    hint: 'teal sky / tangerine sun',
    swatch: ['#ff7a1f', '#22e8d8', '#ffd08a'],
    backdrop: ['#052732', '#0b5b63', '#170711'],
    gutter: '#03151b',
    ink: ['#06303a', '#03101a'],
    accentA: '#ff7a1f',
    accentB: '#22e8d8',
    accentC: '#ffc46b',
    washTop: 'rgba(0, 214, 200, 0.5)',
    washBottom: 'rgba(255, 126, 32, 0.58)',
    washDeep: 'rgba(6, 58, 66, 0.45)',
    sky: ['rgba(0, 206, 200, 0.55)', 'rgba(255, 150, 60, 0.26)', 'rgba(255, 112, 26, 0.62)'],
    sun: 'rgba(255, 238, 196, 1)',
    rayColor: 'rgba(255, 172, 88, 1)',
    titleFill: ['#ffffff', '#ffe9c8', '#ffab5e', '#ff6a1f'],
    titleOutline: '#04222a',
    titleEdge: '#0b4d55',
    bandLine: 'rgba(255, 140, 60, 0.8)',
  },
  {
    id: 'neon',
    name: 'Neon Night',
    hint: 'hot pink / electric cyan',
    swatch: ['#ff2fb0', '#22f0ff', '#8a5cff'],
    backdrop: ['#0a0526', '#2c0a4c', '#04020f'],
    gutter: '#050214',
    ink: ['#0d0730', '#04020f'],
    accentA: '#ff2fb0',
    accentB: '#22f0ff',
    accentC: '#ff8ad8',
    washTop: 'rgba(255, 47, 176, 0.55)',
    washBottom: 'rgba(34, 240, 255, 0.5)',
    washDeep: 'rgba(28, 6, 70, 0.45)',
    sky: ['rgba(120, 20, 170, 0.6)', 'rgba(255, 47, 176, 0.3)', 'rgba(34, 240, 255, 0.46)'],
    sun: 'rgba(255, 196, 244, 1)',
    rayColor: 'rgba(255, 62, 196, 1)',
    titleFill: ['#ffffff', '#ffe3f6', '#ff8ad8', '#22f0ff'],
    titleOutline: '#08031c',
    titleEdge: '#2a1268',
    bandLine: 'rgba(34, 240, 255, 0.8)',
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
    rayColor: 'rgba(255, 150, 70, 1)',
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
    rayColor: 'rgba(170, 200, 255, 1)',
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
    rayColor: 'rgba(120, 255, 200, 1)',
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

/** Where the sun sits, in design units: high and right of centre, its disc big enough to spill past the grid. */
function sunGeometry(plan) {
  const { W, HD } = plan;
  const x = W * (plan.landscape ? 0.7 : 0.68);
  const y = HD * (plan.landscape ? 0.2 : 0.25);
  return {
    x,
    y,
    r: W * (plan.landscape ? 0.115 : 0.15),
    horizon: HD * (plan.landscape ? 0.34 : 0.42),
  };
}

/**
 * The radiating ray burst behind everything: wedges of light leaving the sun, alternating strong and weak so the
 * disc reads as a printed sun rather than a blurred blob. One radial gradient per parity group keeps it to two
 * gradients however many rays there are. Drawn twice — once in the backdrop at full strength (it shows in the
 * gutters and around the grid) and once as a faint screen pass over the panels, which is what carries the burst
 * across the whole sheet.
 */
function drawRays(ctx, sun, preset, alpha, count) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = alpha;
  ctx.translate(sun.x, sun.y);
  const reach = Math.max(sun.x, sun.y) * 2.6;
  for (const parity of [0, 1]) {
    const grad = ctx.createRadialGradient(0, 0, sun.r * 0.55, 0, 0, reach);
    grad.addColorStop(0, preset.rayColor);
    grad.addColorStop(0.22, preset.rayColor);
    grad.addColorStop(0.62, 'rgba(255, 255, 255, 0.06)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    const step = (Math.PI * 2) / count;
    for (let i = parity; i < count; i += 2) {
      const a0 = i * step - Math.PI / 2;
      const a1 = a0 + step * (parity === 0 ? 0.42 : 0.26);
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, reach, a0, a1);
      ctx.closePath();
    }
    ctx.fill();
  }
  ctx.restore();
}

/**
 * The sun disc: a hot core, a hard limb, faint concentric rings and a long corona, sliced through the lower half
 * by the old poster's horizontal cut bands. The bands are real holes — the disc is filled under an even-odd clip
 * of the circle minus the stripes — so whatever is behind the sun (backdrop in the first pass, the photo collage
 * in the second) shows back through them without any destructive compositing.
 *
 * `solid` decides the blend: the backdrop pass screens the disc into the sky, where there is nothing to hide; the
 * overprint pass paints it with real opacity, because a screen over an already-bright photograph washes out to
 * nothing. The overprint is also gated behind a slightly smaller disc so the collage's own edges stay visible.
 */
function drawSunDisc(ctx, sun, preset, { alpha = 0.82, corona = 2.6, bands = true, rings = true, solid = false, body = true } = {}) {
  const R = sun.r * corona;
  const rim = sun.r * (solid ? 0.92 : 0.985);
  const stripes = [];
  if (bands) {
    for (let i = 0; i < 9; i++) {
      const y = sun.y + sun.r * (0.02 + i * 0.115);
      stripes.push([y, sun.r * (0.024 + i * 0.017)]);
    }
  }
  const clipDiscAndBands = (radius) => {
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, radius, 0, Math.PI * 2);
    for (const [y, h] of stripes) ctx.rect(sun.x - sun.r * 1.05, y, sun.r * 2.1, h);
    ctx.clip('evenodd');
  };

  ctx.save();
  ctx.globalCompositeOperation = solid ? 'source-over' : 'screen';

  // The disc body, under the clip that punches the bands out. Solid: a saturated fill that keeps the photo
  // texture in its top stops and lands on the preset's own sun colour at the limb.
  ctx.save();
  if (body) {
    clipDiscAndBands(rim);
    if (solid) {
      const fill = ctx.createRadialGradient(sun.x, sun.y - sun.r * 0.35, sun.r * 0.05, sun.x, sun.y, rim);
      fill.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      fill.addColorStop(0.42, preset.rayColor);
      fill.addColorStop(0.86, preset.accentC);
      fill.addColorStop(1, preset.accentA);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fill;
    } else {
      const fill = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, R);
      fill.addColorStop(0, '#ffffff');
      fill.addColorStop(Math.max(0.001, (rim / R) * 0.72), '#ffffff');
      fill.addColorStop(rim / R, preset.sun);
      fill.addColorStop(Math.min(0.995, rim / R + 0.008), 'rgba(255, 255, 255, 0.4)');
      fill.addColorStop(Math.min(0.999, rim / R + 0.2), 'rgba(255, 255, 255, 0.07)');
      fill.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fill;
    }
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, R, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // The hard limb: one drawn circle, so the disc always has a crisp edge whatever is behind it.
  ctx.save();
  ctx.globalCompositeOperation = solid ? 'source-over' : 'screen';
  ctx.globalAlpha = solid ? Math.min(1, alpha + 0.25) : alpha * 0.6;
  ctx.strokeStyle = solid ? preset.sun : 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = Math.max(2, sun.r * (solid ? 0.035 : 0.016));
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, rim, 0, Math.PI * 2);
  ctx.stroke();

  // A dark keyline just outside the limb separates the disc from a busy photograph.
  if (solid) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = preset.titleOutline;
    ctx.lineWidth = Math.max(2, sun.r * 0.055);
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, rim + sun.r * 0.03, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  if (rings) {
    ctx.save();
    clipDiscAndBands(rim * (solid ? 1.02 : 1));
    ctx.globalCompositeOperation = solid ? 'source-over' : 'screen';
    ctx.strokeStyle = solid ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = Math.max(1, sun.r * 0.015);
    ctx.globalAlpha = solid ? alpha * 0.8 : alpha * 0.7;
    for (const k of [0.42, 0.62, 0.8]) {
      ctx.beginPath();
      ctx.arc(sun.x, sun.y, rim * k, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * The disc's cut bands as *printed* stripes: dark rules laid across the disc's lower half, clipped to its circle.
 * The backdrop pass punches real holes (the sky shows through); this pass paints them, which is what reads on top
 * of a busy photograph. Both are the same rhythm so the two passes agree where they overlap in the gutters.
 */
function drawSunBands(ctx, sun, preset, alpha = 0.5) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, sun.r * 0.92, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = preset.titleOutline;
  for (let i = 0; i < 9; i++) {
    const y = sun.y + sun.r * (0.02 + i * 0.115);
    ctx.fillRect(sun.x - sun.r, y, sun.r * 2, sun.r * (0.024 + i * 0.017));
  }
  ctx.restore();
}

/** The sunset backdrop that shows through the gutters and around the panels. */
function drawBackdrop(ctx, plan, preset) {
  const { W, HD } = plan;
  const sun = sunGeometry(plan);

  const sky = ctx.createLinearGradient(0, 0, W * 0.25, HD);
  sky.addColorStop(0, preset.backdrop[0]);
  sky.addColorStop(0.52, preset.backdrop[1]);
  sky.addColorStop(1, preset.backdrop[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HD);

  // The ray burst first, so the disc burns over the roots of the rays.
  drawRays(ctx, sun, preset, 0.5, 44);

  // The horizon glow band: a broad warm slab of light along the waterline, brightest on the sun's own meridian.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const bandTop = sun.horizon - HD * 0.19;
  const bandBottom = sun.horizon + HD * 0.3;
  const hz = ctx.createLinearGradient(0, bandTop, 0, bandBottom);
  hz.addColorStop(0, 'rgba(0, 0, 0, 0)');
  hz.addColorStop(0.36, 'rgba(255, 255, 255, 0.06)');
  hz.addColorStop(0.46, preset.accentC);
  hz.addColorStop(0.5, 'rgba(255, 255, 255, 0.72)');
  hz.addColorStop(0.56, preset.accentA);
  hz.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = hz;
  ctx.fillRect(0, bandTop, W, bandBottom - bandTop);

  // The open water under the band: a couple of long shimmer rules, thinning as they fall away.
  const sea = ctx.createLinearGradient(0, sun.horizon, 0, HD);
  sea.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
  sea.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
  sea.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = sea;
  ctx.fillRect(0, sun.horizon, W, HD - sun.horizon);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 9; i++) {
    const y = sun.horizon + HD * (0.012 + i * 0.026);
    const w = W * (0.5 - i * 0.04);
    ctx.fillRect(sun.x - w / 2, y, w, Math.max(1, HD * 0.0022));
  }
  ctx.restore();

  drawSunDisc(ctx, sun, preset, { alpha: 0.9, corona: 2.6, bands: true });

  // Two soft light sources behind the collage, so the gutters glow instead of reading flat black.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const glow = ctx.createRadialGradient(W * 0.78, HD * 0.16, 0, W * 0.78, HD * 0.16, W * 0.5);
  glow.addColorStop(0, preset.accentC);
  glow.addColorStop(0.35, preset.accentA);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, HD);
  const cool = ctx.createRadialGradient(W * 0.14, HD * 0.62, 0, W * 0.14, HD * 0.62, W * 0.55);
  cool.addColorStop(0, preset.accentB);
  cool.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.22;
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

/** The black keyline, the thin light bevel and the inset rule that make each panel read as a pasted print. */
function strokePanel(ctx, cell, preset, hero) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(4, 1, 10, 0.9)';
  ctx.strokeRect(cell.x - 1.5, cell.y - 1.5, cell.w + 3, cell.h + 3);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.strokeRect(cell.x + 0.6, cell.y + 0.6, cell.w - 1.2, cell.h - 1.2);

  // A bright inner rule, inset a little further: on the hero it goes white-hot, on the companions it stays a
  // hairline of the preset's own light, so the hero is the print the eye lands on first.
  const inset = hero ? 7 : 5;
  ctx.lineWidth = hero ? 1.6 : 1;
  ctx.strokeStyle = hero ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.3)';
  ctx.strokeRect(cell.x + inset, cell.y + inset, cell.w - inset * 2, cell.h - inset * 2);

  if (hero) {
    // Corner brackets on the hero: four L-marks inside the frame, the contact-sheet crop mark.
    const tick = Math.min(cell.w, cell.h) * 0.1;
    const off = inset + 3;
    const edges = [
      [cell.x + off, cell.y + off, 1, 1],
      [cell.x + cell.w - off, cell.y + off, -1, 1],
      [cell.x + off, cell.y + cell.h - off, 1, -1],
      [cell.x + cell.w - off, cell.y + cell.h - off, -1, -1],
    ];
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'square';
    ctx.strokeStyle = preset.accentC;
    ctx.globalAlpha = 0.95;
    for (const [cx, cy, sx, sy] of edges) {
      ctx.beginPath();
      ctx.moveTo(cx + sx * tick, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + sy * tick);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.9;
    for (const [cx, cy, sx, sy] of edges) {
      ctx.beginPath();
      ctx.moveTo(cx + sx * tick, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + sy * tick);
      ctx.stroke();
    }
  }
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
  const sun = sunGeometry(plan);
  ctx.save();

  // Sunset wash across the whole sheet, 'overlay' then 'screen' — the Vice City signature.
  const sunset = ctx.createLinearGradient(0, 0, W * 0.12, HD);
  sunset.addColorStop(0, preset.sky[0]);
  sunset.addColorStop(0.48, preset.sky[1]);
  sunset.addColorStop(1, preset.sky[2]);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.46;
  ctx.fillStyle = sunset;
  ctx.fillRect(0, 0, W, HD);

  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = sunset;
  ctx.fillRect(0, 0, W, HD);

  // The ray burst again, faint, over the panels: this is what makes the collage sit inside one light instead of
  // in front of it. Same geometry as the backdrop, so the rays line up through the gutters.
  drawRays(ctx, sun, preset, 0.16, 44);

  // The disc again, over the collage: a flat printed orange disc with the cut bands drawn as dark stripes across
  // it, which is the old poster's treatment — a graphic sun, not a photographic flare.
  drawSunDisc(ctx, sun, preset, { alpha: 0.66, corona: 1.42, bands: false, rings: true, solid: true });
  drawSunBands(ctx, sun, preset, 0.5);

  // The sun's own bloom, centred on the disc. Kept modest: the disc is a printed shape, and a big radial glow
  // over the collage just lifts every photo's blacks and flattens the whole sheet.
  const glowR = W * 0.42;
  const sunGlow = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, glowR);
  sunGlow.addColorStop(0, preset.sun);
  sunGlow.addColorStop(0.08, 'rgba(255, 232, 200, 0.55)');
  sunGlow.addColorStop(0.3, 'rgba(255, 168, 120, 0.14)');
  sunGlow.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, W, HD);

  // The anamorphic streak through the sun: a wide horizontal bar, scaled to nothing vertically.
  ctx.save();
  ctx.translate(sun.x, sun.y);
  ctx.scale(1, 0.062);
  const streak = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.72);
  streak.addColorStop(0, 'rgba(255, 250, 235, 0.9)');
  streak.addColorStop(0.35, 'rgba(255, 200, 170, 0.26)');
  streak.addColorStop(1, 'rgba(255, 120, 160, 0)');
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = streak;
  ctx.fillRect(-W * 0.72, -W * 0.72, W * 1.44, W * 1.44);
  ctx.restore();

  // The diagonal sun flare: a long soft shaft from the sun's upper right, cut across the whole sheet. Built as a
  // band gradient perpendicular to its own direction so the light falls off on both sides of the axis.
  ctx.save();
  const angle = -Math.PI * 0.29;
  const axisX = Math.cos(angle);
  const axisY = Math.sin(angle);
  ctx.translate(sun.x, sun.y);
  ctx.rotate(angle);
  const len = Math.max(W, HD) * 1.9;
  const flare = ctx.createLinearGradient(0, -W * 0.34, 0, W * 0.34);
  flare.addColorStop(0, 'rgba(255, 255, 255, 0)');
  flare.addColorStop(0.38, 'rgba(255, 226, 210, 0.1)');
  flare.addColorStop(0.5, 'rgba(255, 255, 255, 0.62)');
  flare.addColorStop(0.62, 'rgba(255, 210, 200, 0.1)');
  flare.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = flare;
  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.lineTo(0, -W * 0.34);
  ctx.lineTo(len, 0);
  ctx.lineTo(0, W * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Two flare ghosts on the axis through the sun, on the far side of the frame: the classic lens reflection.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const [k, r, a] of [[0.55, 0.05, 0.14], [1.15, 0.032, 0.1], [1.7, 0.075, 0.08]]) {
    const gx = sun.x - axisX * W * k;
    const gy = sun.y - axisY * W * k;
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, W * r);
    g.addColorStop(0, preset.accentB);
    g.addColorStop(0.62, preset.accentB);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = a;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx, gy, W * r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Cool bloom rising from the bottom-left, balancing the warm sun.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const bloom = ctx.createRadialGradient(W * 0.08, HD, 0, W * 0.08, HD, W * 0.6);
  bloom.addColorStop(0, preset.accentB);
  bloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, HD);
  ctx.restore();

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

  // Negative tracking is the GTA register, but the heavy ink outline eats the gap: at -0.012 the glyph edges
  // in a long word touch, so the mark reads as one blob. A hair of positive tracking holds the letters apart.
  const trackingRatio = 0.004;
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

  // Centre the block in the room it was given. The caption is usually width-bound, not height-bound, so without
  // this the mark sits at the top of the band and leaves a hole underneath it.
  const finalBlock = size * (capRatio + lineGap * (lines.length - 1));
  const blockTop = titleTop + Math.max(0, (titleRoom - finalBlock) / 2);

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
    blockH: finalBlock,
    lineGap,
    // Baselines are absolute canvas units: the band's own top plus the offset planned inside it.
    firstBaseline: bandY + blockTop + size * capRatio,
    markX: W - pad - markW,
    metaBaseline: bandY + metaBaseline,
  };
}

/**
 * Splits a caption line into its first word and the rest, so the wordmark can be set in two fills — the GTA
 * register's two-tone logotype. Returns null when there is only one word to split.
 */
function splitFirstWord(text) {
  const m = /^(\S+)(\s+)(\S.*)$/.exec(text.trim());
  if (!m) return null;
  return { head: m[1], tail: m[3] };
}

/**
 * Draws the caption in the GTA register: a soft cast shadow, two heavy strokes, a gradient fill, a lit edge.
 * When the caption has two words or more it is set as a two-tone wordmark — the first word in one fill, the
 * rest in another, each with the heavy ink outline, so the logotype reads as a designed mark and not a line of
 * type. A chromatic-aberration fringe (magenta left, cyan right) is laid on the glyph edges under the ink.
 */
function drawTitle(ctx, type, x, y, preset) {
  const { lines, size, tracking } = type;
  ctx.save();
  ctx.font = `700 ${size}px ${TITLE_FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const drawAll = (mode, dx, dy, style) => {
    if (style) ctx.fillStyle = style;
    lines.forEach((line, i) => {
      drawTracked(ctx, line, x + dx, y + dy + i * size * type.lineGap, tracking, mode);
    });
  };

  // Runs of the block, each with its own fill: when there is a single line the first word takes the warm half of
  // the preset and the rest the cool half. Each run is [text, x, baseline offset, fill stops]. Both runs start
  // white at the cap line for the chrome look, then diverge hard into accentC/accentA and accentB — two colours
  // at a glance, not one colour with a tint.
  const runs = [];
  const fillA = ['#ffffff', preset.accentC, preset.accentA];
  const fillB = ['#ffffff', preset.accentB, preset.accentB];
  lines.forEach((line, i) => {
    const offset = i * size * type.lineGap;
    const split = lines.length === 1 ? splitFirstWord(line) : null;
    if (split) {
      const headW = trackedWidth(ctx, split.head, tracking);
      const spaceW = ctx.measureText(' ').width;
      runs.push({ text: split.head, x, offset, fill: fillA });
      runs.push({ text: split.tail, x: x + headW + spaceW, offset, fill: fillB });
    } else {
      runs.push({ text: line, x, offset, fill: i === 0 ? fillA : fillB });
    }
  });

  // 2. chromatic-aberration fringing. The coloured rims go on *wider* than the ink and offset sideways, so the
  // ink stroke drawn over them leaves a sliver of saturated magenta on one side of every letterform and cyan on
  // the other. Drawing them as fills under the ink would be invisible (the ink is 0.2em wide, the offsets are a
  // few pixels), and screening over a white-topped fill is a no-op, so this is the only way the fringe actually
  // reads at print size.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ff2fd0';
  ctx.lineWidth = size * 0.265;
  drawAll('stroke', -size * 0.032, size * 0.006);
  ctx.strokeStyle = '#1fe6ff';
  ctx.lineWidth = size * 0.265;
  drawAll('stroke', size * 0.032, -size * 0.006);

  // 3. the cast shadow, blurred off the glyph edges so the type sits on the plate.
  ctx.save();
  ctx.globalAlpha = 0.62;
  ctx.fillStyle = '#05010c';
  ctx.filter = `blur(${Math.max(2, size * 0.09)}px)`;
  drawAll('fill', size * 0.04, size * 0.07);
  ctx.restore();

  // 4. the wide ink outline — thick, and twice over, so it closes the middle of the fringe but leaves its edges.
  ctx.strokeStyle = preset.titleOutline;
  ctx.lineWidth = size * 0.2;
  drawAll('stroke', 0, 0);
  ctx.lineWidth = size * 0.115;
  drawAll('stroke', 0, 0);

  // 5. a tight neon rim inside the ink, in the preset's own colour, bouncing light back off the flat edge.
  ctx.strokeStyle = preset.titleEdge;
  ctx.lineWidth = size * 0.062;
  drawAll('stroke', 0, 0);

  // 6. the fills, one gradient per run: white at the cap line down to the run's own warm or cool foot.
  const blockTop = y - size * type.capRatio;
  for (const run of runs) {
    const runTop = y + run.offset - size * type.capRatio;
    const runBottom = y + run.offset + size * 0.16;
    const grad = ctx.createLinearGradient(0, runTop, 0, runBottom);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, run.fill[0]);
    grad.addColorStop(0.62, run.fill[1]);
    grad.addColorStop(1, run.fill[2] ?? run.fill[1]);
    ctx.fillStyle = grad;
    drawTracked(ctx, run.text, run.x, y + run.offset, tracking, 'fill');
  }

  // 7. a neon edge — a screen pass along the rim, then a highlight along the upper edge and a warm bounce below.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = preset.accentB;
  ctx.lineWidth = Math.max(1.4, size * 0.02);
  drawAll('stroke', -size * 0.008, -size * 0.014);
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, size * 0.012);
  drawAll('stroke', -size * 0.005, -size * 0.016);
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = preset.accentC;
  ctx.lineWidth = Math.max(1, size * 0.02);
  drawAll('stroke', size * 0.005, size * 0.016);
  ctx.restore();

  // 7. specular break across the middle of the mark: a thin white slash, a printed highlight on the chrome.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = '#ffffff';
  const slashY = blockTop + size * type.capRatio * 0.62;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.2, slashY + size * 0.1);
  ctx.lineTo(x + type.widest + size * 0.3, slashY - size * 0.1);
  ctx.lineTo(x + type.widest + size * 0.3, slashY - size * 0.03);
  ctx.lineTo(x - size * 0.2, slashY + size * 0.17);
  ctx.closePath();
  ctx.fill();
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
  // The hero is the biggest cell: that is the print the composition is built around, and the one that gets the
  // corner brackets and the white-hot inner rule.
  let hero = 0;
  plan.cells.forEach((cell, i) => {
    const area = plan.cells[hero].w * plan.cells[hero].h;
    if (cell.w * cell.h > area) hero = i;
  });
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
    strokePanel(ctx, cell, preset, i === hero);
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
