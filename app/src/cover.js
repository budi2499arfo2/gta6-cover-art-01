// Neon Coast Cover Studio — the poster renderer.
//
// Everything here is hand-written Canvas 2D: no library, no image asset, no
// network call. renderCover() paints one cover onto a 2D context at whatever
// pixel size the canvas carries: every measurement is a fraction of the canvas,
// so the same call draws a 1080 x 1080 square, a 1080 x 1350 portrait and a
// 1920 x 1080 wide cover with the same composition.

export const DESIGN_WIDTH = 1080;
export const PANEL_COUNTS = [2, 3, 4, 5, 6];
export const MAX_PANELS = 6;

// The post sizes the studio exports, largest side first in the label.
export const FRAMES = [
  { id: '1:1', name: 'Square', w: 1080, h: 1080, note: '1080 x 1080 · feed' },
  { id: '4:5', name: 'Portrait', w: 1080, h: 1350, note: '1080 x 1350 · poster' },
  { id: '16:9', name: 'Wide', w: 1920, h: 1080, note: '1920 x 1080 · header' },
];

// Five grades. `band` is the title band's gradient, `sky` the backdrop's, and
// `tint` the wash laid over the photo grid so five different photos still read
// as one poster.
export const PRESETS = [
  {
    id: 'vice',
    name: 'Vice Sunset',
    hint: 'orange sky, teal water',
    swatch: ['#ff8a3d', '#ffd9a0', '#12b3b8', '#2a1230'],
    backdrop: ['#2a0f33', '#5c1a4a', '#c9412f', '#f0803a'],
    sky: ['#ffd9a0', '#ff9c4d', '#e2543f'],
    sun: '#ffe6b0',
    glow: 'rgba(255,150,70,0.55)',
    tint: ['rgba(255,120,60,0.30)', 'rgba(20,150,170,0.24)'],
    duo: ['#3a1a4e', '#a8442e', '#2a8f9e'],
    band: ['#120616', '#2a0a2c'],
    inkA: ['#fff3d6', '#ffb347'],
    inkB: ['#ffe9f3', '#ff5fa8'],
    stroke: '#150612',
    accent: '#37d6d0',
    accent2: '#ffb03a',
  },
  {
    id: 'neon',
    name: 'Neon Night',
    hint: 'hot pink, cyan, wet street',
    swatch: ['#ff2f87', '#8a3bff', '#25e5ff', '#0b0620'],
    backdrop: ['#07061a', '#141033', '#3a1050', '#6a1250'],
    sky: ['#25e5ff', '#8a3bff', '#ff2f87'],
    sun: '#ffd6f4',
    glow: 'rgba(255,60,150,0.5)',
    tint: ['rgba(255,45,130,0.30)', 'rgba(35,225,255,0.26)'],
    duo: ['#2a1560', '#7a1f6a', '#1f6f8f'],
    band: ['#05030f', '#140a26'],
    inkA: ['#eafcff', '#3fe6ff'],
    inkB: ['#fff0f7', '#ff3d8f'],
    stroke: '#080413',
    accent: '#25e5ff',
    accent2: '#ff3d8f',
  },
  {
    id: 'dusk',
    name: 'Gold Dusk',
    hint: 'amber light, dusty gold',
    swatch: ['#ffc247', '#ffe9b0', '#b5642a', '#241206'],
    backdrop: ['#1d1008', '#48230f', '#8a441d', '#c8792e'],
    sky: ['#ffe9b0', '#ffc247', '#c2702a'],
    sun: '#fff2cc',
    glow: 'rgba(255,196,80,0.5)',
    tint: ['rgba(255,190,90,0.28)', 'rgba(150,70,30,0.26)'],
    duo: ['#3a2410', '#8a5a24', '#5a4326'],
    band: ['#120b05', '#2a1508'],
    inkA: ['#fff6df', '#ffc247'],
    inkB: ['#ffe8c8', '#f08a2e'],
    stroke: '#150b04',
    accent: '#ffc247',
    accent2: '#f08a2e',
  },
  {
    id: 'midnight',
    name: 'Midnight Violet',
    hint: 'deep purple, cold blue',
    swatch: ['#7a5cff', '#c9a7ff', '#4fc2ff', '#08061a'],
    backdrop: ['#05040f', '#100a2a', '#2a1550', '#45207a'],
    sky: ['#c9a7ff', '#7a5cff', '#3a1f6a'],
    sun: '#e8dcff',
    glow: 'rgba(140,110,255,0.45)',
    tint: ['rgba(120,90,255,0.28)', 'rgba(60,200,255,0.20)'],
    duo: ['#131a4a', '#3d2a6e', '#1d4a7a'],
    band: ['#04030c', '#0f0a22'],
    inkA: ['#f2ecff', '#b79bff'],
    inkB: ['#e9f6ff', '#67c8ff'],
    stroke: '#05030f',
    accent: '#b79bff',
    accent2: '#67c8ff',
  },
  {
    id: 'heat',
    name: 'Heat Red',
    hint: 'ember red, scorched cream',
    swatch: ['#ff3b2f', '#ffb38a', '#ffd166', '#1a0505'],
    backdrop: ['#160303', '#3c0708', '#7d1410', '#b32a15'],
    sky: ['#ffd166', '#ff6a3d', '#b3261e'],
    sun: '#ffe0a8',
    glow: 'rgba(255,90,50,0.5)',
    tint: ['rgba(255,70,40,0.30)', 'rgba(255,180,90,0.20)'],
    duo: ['#4a1008', '#8f2a12', '#6a2410'],
    band: ['#0d0202', '#240707'],
    inkA: ['#fff1dc', '#ff9a5c'],
    inkB: ['#ffd9c7', '#ff3b2f'],
    stroke: '#120202',
    accent: '#ffd166',
    accent2: '#ff3b2f',
  },
];

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}

// A cell is [x, y, w, h] as fractions of the canvas. The hero (the first cell)
// is always the largest, and each count has a rhythm of its own rather than a
// uniform grid, which is what makes the poster read as a cover and not a
// contact sheet.
const LAYOUTS = {
  2: {
    portrait: [[0, 0, 1, 0.6], [0, 0.6, 1, 0.4]],
    wide: [[0, 0, 0.62, 1], [0.62, 0, 0.38, 1]],
  },
  3: {
    portrait: [[0, 0, 1, 0.52], [0, 0.52, 0.5, 0.48], [0.5, 0.52, 0.5, 0.48]],
    wide: [[0, 0, 0.56, 1], [0.56, 0, 0.44, 0.5], [0.56, 0.5, 0.44, 0.5]],
  },
  4: {
    portrait: [[0, 0, 1, 0.46], [0, 0.46, 0.5, 0.27], [0, 0.73, 0.5, 0.27], [0.5, 0.46, 0.5, 0.54]],
    wide: [[0, 0, 0.58, 1], [0.58, 0, 0.42, 0.34], [0.58, 0.34, 0.42, 0.33], [0.58, 0.67, 0.42, 0.33]],
  },
  5: {
    portrait: [[0, 0, 1, 0.42], [0, 0.42, 0.5, 0.26], [0.5, 0.42, 0.5, 0.26], [0, 0.68, 0.5, 0.32], [0.5, 0.68, 0.5, 0.32]],
    wide: [[0, 0, 0.54, 1], [0.54, 0, 0.46, 0.34], [0.54, 0.34, 0.23, 0.33], [0.77, 0.34, 0.23, 0.33], [0.54, 0.67, 0.46, 0.33]],
  },
  6: {
    portrait: [[0, 0, 1, 0.34], [0, 0.34, 0.34, 0.24], [0.34, 0.34, 0.33, 0.24], [0.67, 0.34, 0.33, 0.24],
      [0, 0.58, 0.5, 0.42], [0.5, 0.58, 0.5, 0.42]],
    wide: [[0, 0, 0.5, 0.62], [0.5, 0, 0.25, 0.31], [0.75, 0, 0.25, 0.31], [0.5, 0.31, 0.25, 0.31],
      [0.75, 0.31, 0.25, 0.31], [0, 0.62, 1, 0.38]],
  },
};

/** Cells for `count` panels; `aspect` is width / height of the canvas. */
export function panelCells(count, aspect) {
  const n = Math.min(MAX_PANELS, Math.max(2, count));
  const table = LAYOUTS[n] ?? LAYOUTS[4];
  const cells = aspect >= 1.25 ? table.wide : table.portrait;
  if (n === 6 && aspect >= 1.25) return cells.slice();
  return cells.slice();
}

/** Restarting crops so every panel opens on a different part of the photo.
    `photo` alternates so neighbouring panels never show the same frame. */
export function defaultCrops(count) {
  const seeds = [
    [1.06, 0, -0.04], [1.22, -0.10, 0.10], [1.16, 0.12, 0.06],
    [1.30, 0.06, -0.12], [1.12, -0.14, -0.08], [1.24, 0.02, 0.14],
  ];
  return Array.from({ length: MAX_PANELS }, (_, i) => {
    const s = seeds[i % seeds.length];
    return { zoom: s[0], offsetX: s[1], offsetY: s[2], photo: i, auto: true };
  }).slice(0, Math.max(2, count));
}

// ---------------------------------------------------------------------------
// Small drawing helpers
// ---------------------------------------------------------------------------

const FONT_TITLE = "'Anton','Arial Narrow','Liberation Sans Narrow',Impact,sans-serif";
const FONT_SCRIPT = "'Pacifico','Brush Script MT',cursive";
const FONT_UI = "'Liberation Sans','DejaVu Sans',system-ui,sans-serif";
const FONT_MONO = "'DejaVu Sans Mono','Liberation Mono',monospace";

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** Seeded PRNG (mulberry32) so a poster is byte-identical on every repaint. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws `img` into the rect with cover fit plus the panel's own zoom/offset.
    An auto crop biases a portrait photo in a wide panel toward its upper half,
    where faces usually are, so the hero panel does not open on a chin. */
function drawCoverFit(ctx, img, x, y, w, h, crop) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const zoom = crop?.zoom ?? 1;
  const base = Math.max(w / iw, h / ih);
  const s = base * zoom;
  const dw = iw * s;
  const dh = ih * s;
  const bias = crop?.auto && ih / iw > 1.1 && w / h > 1.1 ? 0.14 : 0;
  const ox = (crop?.offsetX ?? 0) * w * 0.5;
  const oy = ((crop?.offsetY ?? 0) + bias) * h * 0.5;
  const dx = x + (w - dw) / 2 + ox;
  const dy = y + (h - dh) / 2 + oy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Backdrop: sky, sun, rays, stars, horizon haze
// ---------------------------------------------------------------------------

function drawBackdrop(ctx, W, H, p, seed) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, p.backdrop[0]);
  sky.addColorStop(0.42, p.backdrop[1]);
  sky.addColorStop(0.78, p.backdrop[2]);
  sky.addColorStop(1, p.backdrop[3]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const cx = W * 0.5;
  const cy = H * 0.46;
  const r = Math.min(W, H) * 0.21;

  // Rays: wedges alternating on/off around the sun, drawn before the disc.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'screen';
  const rays = 26;
  for (let i = 0; i < rays; i += 1) {
    if (i % 2 === 1) continue;
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2) / rays * 0.52;
    const len = Math.max(W, H) * (0.9 + ((i * 37) % 11) / 22);
    const g = ctx.createLinearGradient(0, 0, Math.cos(a0) * len, Math.sin(a0) * len);
    g.addColorStop(0, p.glow);
    g.addColorStop(0.45, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a0) * len, Math.sin(a0) * len);
    ctx.lineTo(Math.cos(a1) * len, Math.sin(a1) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Bloom, then the disc.
  const bloom = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 3.1);
  bloom.addColorStop(0, p.glow);
  bloom.addColorStop(0.35, 'rgba(255,255,255,0.10)');
  bloom.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  const disc = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  disc.addColorStop(0, '#ffffff');
  disc.addColorStop(0.35, p.sun);
  disc.addColorStop(1, p.sky[2]);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Retro sun slits across the lower half of the disc.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 7; i += 1) {
    const y = cy + r * 0.05 + i * r * 0.14;
    const hh = r * (0.012 + i * 0.012);
    ctx.fillRect(cx - r, y, r * 2, hh);
  }
  ctx.restore();

  // Stars: only above the sun, seeded so they never dance between repaints.
  const rand = rng(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 90; i += 1) {
    const x = rand() * W;
    const y = rand() * H * 0.5;
    const rr = 0.4 + rand() * 1.4;
    ctx.globalAlpha = 0.10 + rand() * 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Horizon haze where the sun meets the grid.
  const haze = ctx.createLinearGradient(0, H * 0.5, 0, H * 0.92);
  haze.addColorStop(0, 'rgba(255,255,255,0)');
  haze.addColorStop(0.55, p.glow);
  haze.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// The photo grid
// ---------------------------------------------------------------------------

function drawPanels(ctx, W, H, opts, p) {
  const { photos, panels, count, aspect, gridTop, gridBottom } = opts;
  const cells = panelCells(count, aspect);
  const gy = gridTop * H;
  const gh = (gridBottom - gridTop) * H;
  const gutter = Math.max(2, Math.min(W, H) * 0.0075);
  const drawn = [];

  for (let i = 0; i < cells.length; i += 1) {
    const [fx, fy, fw, fh] = cells[i];
    const x = fx * W + gutter / 2;
    const y = gy + fy * gh + gutter / 2;
    const w = fw * W - gutter;
    const h = fh * gh - gutter;
    drawn.push({ x, y, w, h, hero: i === 0 });
  }

  // A dark key under the whole grid, so bright photos do not blow out.
  ctx.save();
  ctx.fillStyle = 'rgba(8,4,12,0.55)';
  ctx.fillRect(0, gy, W, gh);

  drawn.forEach((cell, i) => {
    const { x, y, w, h } = cell;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const img = photos.length ? photos[(panels[i]?.photo ?? i) % photos.length] : null;
    if (img) {
      const crop = panels[i] ?? { zoom: 1, offsetX: 0, offsetY: 0 };
      drawCoverFit(ctx, img, x, y, w, h, crop);
    } else {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, p.backdrop[1]);
      g.addColorStop(1, p.backdrop[3]);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }

    // Grade each panel: a cool wash in multiply, then a warm one screened back.
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = p.tint[1];
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'screen';
    const warm = ctx.createLinearGradient(x, y + h, x, y);
    warm.addColorStop(0, p.tint[0]);
    warm.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(x, y, w, h);

    // Duotone: one hue family per preset, so a photo taken on a phone sits
    // beside a beach shot without fighting it. `color` keeps every luminance.
    ctx.globalCompositeOperation = 'color';
    const duo = ctx.createLinearGradient(x, y, x + w, y + h);
    duo.addColorStop(0, p.duo[0]);
    duo.addColorStop(0.55, p.duo[1]);
    duo.addColorStop(1, p.duo[2]);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = duo;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;

    // Slight desaturation keeps five photos in one family.
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'rgba(80,80,80,0.30)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';

    // Inner shadow at the panel edges.
    const edge = ctx.createLinearGradient(x, y + h, x, y + h * 0.55);
    edge.addColorStop(0, 'rgba(0,0,0,0.45)');
    edge.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = edge;
    ctx.fillRect(x, y, w, h);

    // Thin bright rule inset in every panel; a heavier one on the hero.
    ctx.strokeStyle = 'rgba(255,255,255,0.42)';
    ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.004);
    const in2 = Math.min(w, h) * 0.028;
    ctx.strokeRect(x + in2, y + in2, w - in2 * 2, h - in2 * 2);

    // Ink: a heavy dark outline just inside the cell edge, the poster's own
    // drawing line, so a photo panel reads as printed rather than pasted.
    const inkW = Math.max(2, Math.min(w, h) * 0.016);
    ctx.strokeStyle = 'rgba(10,4,12,0.85)';
    ctx.lineWidth = inkW;
    ctx.strokeRect(x + inkW / 2, y + inkW / 2, w - inkW, h - inkW);

    // Halftone dots over the hero's lower third: a printed-poster tell that
    // costs nothing and hides a soft photo edge.
    if (cell.hero) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.18;
      const step = Math.max(5, Math.min(w, h) * 0.017);
      ctx.fillStyle = '#1a0a14';
      for (let dy = y + h * 0.55; dy < y + h; dy += step) {
        for (let dx = x + step / 2; dx < x + w; dx += step) {
          const t = (dy - (y + h * 0.55)) / (h * 0.45);
          ctx.beginPath();
          ctx.arc(dx, dy, step * 0.22 * (0.4 + t), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (cell.hero) {
      // Corner brackets on the hero only.
      const len = Math.min(w, h) * 0.12;
      const t = Math.max(2, Math.min(w, h) * 0.011);
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = t;
      ctx.lineCap = 'square';
      const b = in2 * 0.62;
      const corners = [[x + b, y + b, 1, 1], [x + w - b, y + b, -1, 1],
        [x + b, y + h - b, 1, -1], [x + w - b, y + h - b, -1, -1]];
      corners.forEach(([cxp, cyp, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(cxp + sx * len, cyp);
        ctx.lineTo(cxp, cyp);
        ctx.lineTo(cxp, cyp + sy * len);
        ctx.stroke();
      });
    }
    ctx.restore();

    // Index numeral in the panel's foot corner, monospace, small.
    ctx.save();
    const fs = clamp(Math.min(w, h) * 0.062, 9, 26);
    ctx.font = `${fs}px ${FONT_MONO}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillText(String(i + 1).padStart(2, '0'), x + w - fs * 0.9, y + h - fs * 0.7);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(String(i + 1).padStart(2, '0'), x + w - fs * 1.0, y + h - fs * 0.8);
    ctx.restore();
  });
  ctx.restore();
  return drawn;
}

// ---------------------------------------------------------------------------
// Global grade over the grid: sky tint, anamorphic streak, diagonal flare
// ---------------------------------------------------------------------------

function drawGrade(ctx, W, H, opts, p, sunPos) {
  const { gridTop, gridBottom } = opts;
  const gy = gridTop * H;
  const gh = (gridBottom - gridTop) * H;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, gy, W, gh);
  ctx.clip();

  ctx.globalCompositeOperation = 'overlay';
  const sky = ctx.createLinearGradient(0, gy, 0, gy + gh);
  sky.addColorStop(0, p.sky[0]);
  sky.addColorStop(0.55, p.sky[1]);
  sky.addColorStop(1, p.sky[2]);
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = sky;
  ctx.fillRect(0, gy, W, gh);

  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.16;
  const up = ctx.createLinearGradient(0, gy + gh, 0, gy);
  up.addColorStop(0, p.sky[2]);
  up.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = up;
  ctx.fillRect(0, gy, W, gh);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Anamorphic streak through the sun, laid across the whole width.
  const sy = sunPos.y;
  const streak = ctx.createLinearGradient(0, sy - H * 0.02, 0, sy + H * 0.02);
  streak.addColorStop(0, 'rgba(255,255,255,0)');
  streak.addColorStop(0.42, p.glow);
  streak.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  streak.addColorStop(0.58, p.glow);
  streak.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = streak;
  ctx.fillRect(0, sy - H * 0.02, W, H * 0.04);
  ctx.restore();

  // Diagonal flare: two soft beams crossing the poster.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.translate(sunPos.x, sy);
  ctx.rotate(-0.33);
  const beam = ctx.createLinearGradient(-W, 0, W, 0);
  beam.addColorStop(0, 'rgba(255,255,255,0)');
  beam.addColorStop(0.5, p.glow);
  beam.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = beam;
  ctx.globalAlpha = 0.30;
  ctx.fillRect(-W, -H * 0.055, W * 2, H * 0.11);
  ctx.globalAlpha = 0.16;
  ctx.fillRect(-W, -H * 0.21, W * 2, H * 0.05);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// The title band: subtitle, two-tone wordmark, VI colophon, tech line
// ---------------------------------------------------------------------------

function setTracking(ctx, px) {
  // Chrome supports letterSpacing on the 2D context; elsewhere it is ignored.
  try {
    ctx.letterSpacing = `${px.toFixed(2)}px`;
  } catch {
    /* older engines: no tracking, the fit loop still keeps it inside */
  }
}

function measureTracked(ctx, text, px) {
  setTracking(ctx, px);
  const w = ctx.measureText(text).width;
  return w;
}

/** Splits a caption into the leading word (warm ink) and the rest (cool ink). */
function splitCaption(caption) {
  const clean = String(caption ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return ['', ''];
  const parts = clean.split(' ');
  if (parts.length === 1) return [parts[0], ''];
  return [parts[0], parts.slice(1).join(' ')];
}

function fitTitle(ctx, head, tail, maxWidth, startSize, minSize) {
  let size = startSize;
  for (;;) {
    const track = size * 0.055;
    const space = tail ? size * 0.30 : 0;
    ctx.font = `${size}px ${FONT_TITLE}`;
    const w = measureTracked(ctx, head, track) + space
      + (tail ? measureTracked(ctx, tail, track) : 0);
    if (w <= maxWidth || size <= minSize) break;
    size -= Math.max(1, size * 0.045);
  }
  return size;
}

function strokeWord(ctx, text, x, y, size, track, p, outlineW) {
  ctx.font = `${size}px ${FONT_TITLE}`;
  setTracking(ctx, track);
  // Chromatic fringe: a red copy left and a cyan copy right, screened in.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = outlineW * 1.15;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,40,90,0.55)';
  ctx.strokeText(text, x - size * 0.02, y);
  ctx.strokeStyle = 'rgba(40,230,255,0.5)';
  ctx.strokeText(text, x + size * 0.02, y);
  ctx.restore();

  // Thick ink outline, then a thinner rim in the accent.
  ctx.lineJoin = 'round';
  ctx.lineWidth = outlineW;
  ctx.strokeStyle = p.stroke;
  ctx.strokeText(text, x, y);
  ctx.lineWidth = Math.max(1, outlineW * 0.26);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.strokeText(text, x, y);

  // The drop shadow is set by the caller's fill pass.
  ctx.lineJoin = 'round';
}

function fillWord(ctx, text, x, y, size, track, inkA, inkB) {
  ctx.font = `${size}px ${FONT_TITLE}`;
  setTracking(ctx, track);
  const g = ctx.createLinearGradient(0, y - size * 0.80, 0, y + size * 0.06);
  g.addColorStop(0, inkA[0]);
  g.addColorStop(0.62, inkA[1] ?? inkA[0]);
  g.addColorStop(1, inkB?.[1] ?? inkB?.[0] ?? inkA[1] ?? inkA[0]);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = size * 0.10;
  ctx.shadowOffsetY = size * 0.03;
  ctx.fillStyle = g;
  ctx.fillText(text, x, y);
  ctx.restore();
  return ctx.measureText(text).width;
}

function drawTitleBand(ctx, W, H, opts, p) {
  const { caption, subtitle, fontScale, bandTop, frameId } = opts;
  const bt = bandTop * H;
  const bh = H - bt;

  // Band backdrop: near-black with a faint vertical fall and a top hairline.
  const band = ctx.createLinearGradient(0, bt, 0, H);
  band.addColorStop(0, p.band[0]);
  band.addColorStop(1, p.band[1]);
  ctx.fillStyle = band;
  ctx.fillRect(0, bt, W, bh);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const topGlow = ctx.createLinearGradient(0, bt, 0, bt + bh * 0.35);
  topGlow.addColorStop(0, p.glow);
  topGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, bt, W, bh * 0.4);
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(0, bt, W, Math.max(1, H * 0.0016));
  ctx.fillStyle = p.accent;
  ctx.fillRect(W * 0.06, bt - H * 0.004, W * 0.14, Math.max(2, H * 0.0035));

  // Subtitle row: diamond, hairline, small tracked caps.
  const padX = W * 0.065;
  const subY = bt + bh * 0.20;
  const diamond = Math.max(3, W * 0.006);
  ctx.save();
  ctx.translate(padX + diamond, subY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = p.accent;
  ctx.fillRect(-diamond, -diamond, diamond * 2, diamond * 2);
  ctx.restore();

  const subSize = clamp(Math.min(W, H) * 0.0225, 9, 26);
  const subText = String(subtitle ?? '').toUpperCase();
  if (subText) {
    ctx.font = `${subSize}px ${FONT_MONO}`;
    setTracking(ctx, subSize * 0.22);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText(subText, padX + diamond * 3.2, subY + subSize * 0.06);
    const tw = measureTracked(ctx, subText, subSize * 0.22);
    const ruleStart = padX + diamond * 3.2 + tw + subSize * 1.2;
    const ruleEnd = W * 0.74;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(ruleStart, subY, Math.max(10, ruleEnd - ruleStart), Math.max(1, H * 0.0012));
  }

  // Wordmark: full band width, so the title is as large as the poster allows.
  // It is fitted to the band minus the foot line's room, and the tech line is
  // drawn under it, so a two-word caption never collides with the footer.
  const [head, tail] = splitCaption(caption);
  const baseSize = Math.min(H * 0.205, (H - bt) * 0.56);
  const maxW = W - padX * 2;
  const size = head ? fitTitle(ctx, head, tail, maxW, baseSize * fontScale, H * 0.045) : 0;
  const baseline = bt + bh * 0.74;
  if (head) {
    const track = size * 0.055;
    const outlineW = size * 0.085;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    strokeWord(ctx, head, padX, baseline, size, track, p, outlineW);
    const wHead = fillWord(ctx, head, padX, baseline, size, track, p.inkA, p.inkA);
    if (tail) {
      const gap = size * 0.30;
      strokeWord(ctx, tail, padX + wHead + gap, baseline, size, track, p, outlineW);
      fillWord(ctx, tail, padX + wHead + gap, baseline, size, track, p.inkB, p.inkB);
    }
  } else {
    ctx.font = `${size || H * 0.1}px ${FONT_TITLE}`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'left';
    ctx.fillText('UNTITLED', padX, baseline);
  }
  return { bt, bh, padX, baseline, size, subY };
}

/** The "VI" colophon, set at the right end of the subtitle row: the edition
    mark, with the year under it, clear of the wordmark below. */
function drawColophon(ctx, W, H, opts, p, band) {
  const size = Math.min(W, H) * 0.062;
  if (size < 12) return;
  const padX = W * 0.065;
  const rightX = W - padX;
  const baseY = band.subY + size * 0.36;

  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${size}px ${FONT_TITLE}`;
  setTracking(ctx, size * 0.10);
  const numeralW = ctx.measureText('VI').width;
  const x = rightX - numeralW;

  ctx.lineWidth = Math.max(2, size * 0.075);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(12,4,14,0.75)';
  ctx.strokeText('VI', x, baseY);
  const g = ctx.createLinearGradient(0, baseY - size, 0, baseY);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, p.accent);
  ctx.fillStyle = g;
  ctx.fillText('VI', x, baseY);

  const small = size * 0.36;
  ctx.font = `${small}px ${FONT_MONO}`;
  setTracking(ctx, small * 0.20);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('2026', rightX, baseY + small * 1.75);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x - size * 1.5, baseY - small * 0.1, size * 1.5, Math.max(1, H * 0.0012));
  ctx.restore();
}

/** The foot line: panel count, grade name and frame, in monospace caps. */
function drawTechLine(ctx, W, H, opts, p, band) {
  const { count, preset, frameId } = opts;
  const fs = clamp(Math.min(W, H) * 0.0175, 8, 20);
  const text = `${String(count).padStart(2, '0')} PANELS  ·  ${preset.name.toUpperCase()}  ·  ${frameId}`;
  ctx.save();
  ctx.font = `${fs}px ${FONT_MONO}`;
  setTracking(ctx, fs * 0.30);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.fillText(text, W * 0.065, H - H * 0.035);
  ctx.restore();

  // A short accent tick at each end of the foot.
  ctx.fillStyle = p.accent;
  ctx.fillRect(W * 0.065, H - H * 0.052, W * 0.018, Math.max(1, H * 0.0022));
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(W * 0.5, H - H * 0.052, W * 0.435, Math.max(1, H * 0.0012));
}

let grainTile = null;

/** A 160 px noise tile, made once and tiled at low alpha over the poster. */
function getGrainTile() {
  if (grainTile) return grainTile;
  const size = 160;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const data = g.createImageData(size, size);
  const rand = rng(0x5eed1a);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 118 + Math.floor(rand() * 76);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  grainTile = c;
  return c;
}

function drawFinish(ctx, W, H, p) {
  // Vignette.
  const vig = ctx.createRadialGradient(W * 0.5, H * 0.45, Math.min(W, H) * 0.25,
    W * 0.5, H * 0.45, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.72, 'rgba(0,0,0,0.16)');
  vig.addColorStop(1, 'rgba(0,0,0,0.52)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Grain, tiled.
  const tile = getGrainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  if (pattern) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.11;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Faint scanlines.
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.fillStyle = '#000000';
  const step = Math.max(3, Math.round(H / 380));
  for (let y = 0; y < H; y += step) ctx.fillRect(0, y, W, 1);
  ctx.restore();

  // Thin outer frame.
  const inset = Math.max(3, Math.min(W, H) * 0.008);
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = Math.max(1, Math.min(W, H) * 0.0022);
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
}

// ---------------------------------------------------------------------------
// The whole poster
// ---------------------------------------------------------------------------

/** Vertical split: the photo grid above, the title band below. */
function bandSplit(aspect) {
  if (aspect >= 1.45) return { gridTop: 0.035, gridBottom: 0.70, bandTop: 0.705 };
  if (aspect >= 1.15) return { gridTop: 0.035, gridBottom: 0.665, bandTop: 0.672 };
  if (aspect <= 0.85) return { gridTop: 0.035, gridBottom: 0.645, bandTop: 0.652 };
  return { gridTop: 0.035, gridBottom: 0.660, bandTop: 0.668 };
}

/**
 * Paints one cover. `opts`:
 *   photos    an array of loaded images (HTMLImageElement / ImageBitmap), may be empty
 *   panels    one {zoom, offsetX, offsetY} per panel
 *   count     panel count (2..6)
 *   caption   the title line
 *   subtitle  the small tracked line above the title
 *   fontScale 0.6 .. 1.5 multiplier on the title size
 *   preset    one of PRESETS
 *   frameId   '1:1' | '4:5' | '16:9', used for the colophon's labels
 *   seed      number; keeps the star field stable across repaints
 */
export function renderCover(ctx, opts) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const preset = opts.preset ?? PRESETS[0];
  const aspect = W / H;
  const split = bandSplit(aspect);
  const count = Math.min(MAX_PANELS, Math.max(2, opts.count ?? 4));
  const seed = opts.seed ?? 1337;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  drawBackdrop(ctx, W, H, preset, seed);

  const full = {
    ...opts,
    ...split,
    count,
    aspect,
    frameId: opts.frameId ?? '1:1',
    preset,
  };
  drawPanels(ctx, W, H, full, preset);
  drawGrade(ctx, W, H, full, preset, { x: W * 0.5, y: H * 0.46 });

  const band = drawTitleBand(ctx, W, H, full, preset);
  drawColophon(ctx, W, H, full, preset, band);
  drawTechLine(ctx, W, H, full, preset, band);
  drawFinish(ctx, W, H, preset);
  ctx.restore();
  return { band, split };
}

/** Measures the band's pieces without painting, so a caller can check they
    do not overlap (the screenshots tooling uses this). */
export function measureBand(ctx, opts) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const aspect = W / H;
  const split = bandSplit(aspect);
  const bt = split.bandTop * H;
  const size = Math.min(H * 0.205, (H - bt) * 0.56);
  const [head, tail] = splitCaption(opts.caption);
  const padX = W * 0.065;
  const fitted = head
    ? fitTitle(ctx, head, tail, W - padX * 2, size * (opts.fontScale ?? 1), H * 0.045)
    : 0;
  ctx.font = `${fitted}px ${FONT_TITLE}`;
  const track = fitted * 0.055;
  const wHead = measureTracked(ctx, head, track);
  const wTail = tail ? measureTracked(ctx, tail, track) + fitted * 0.30 : 0;
  return {
    aspect,
    split,
    titleSize: fitted,
    titleLeft: padX,
    titleRight: padX + wHead + wTail,
    bandRight: W - padX,
    baseline: bt + (H - bt) * 0.74,
    bandTop: bt,
    fits: padX + wHead + wTail <= W - padX + 0.5,
  };
}
