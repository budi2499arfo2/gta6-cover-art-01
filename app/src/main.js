// Wires the studio: photos in, panels, crops, grade, caption, export.
//
// The canvas is only a preview: every export paints a fresh poster on a
// throwaway canvas at the exact post size and hands the PNG to the browser, so
// a preview that was being scaled for the window never touches the file.

import {
  FRAMES, MAX_PANELS, PANEL_COUNTS, PRESETS, defaultCrops,
  measureBand, presetById, renderCover,
} from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);

const canvas = $('cover');
const ctx = canvas.getContext('2d');
const status = $('status');
const captionEl = $('caption');
const subtitleEl = $('subtitle');
const fontEl = $('font-scale');
const zoomEl = $('zoom');
const offXEl = $('offx');
const offYE = $('offy');

const state = {
  photos: [],
  panels: defaultCrops(4),
  count: 4,
  selected: 0,
  caption: 'Sunset Heist',
  subtitle: 'a neon coast story',
  fontScale: 1,
  preset: 'vice',
  frame: '1:1',
};

let needsPaint = false;
let paintToken = 0;

function frameById(id) {
  return FRAMES.find((f) => f.id === id) ?? FRAMES[0];
}

/** Queues exactly one repaint for this frame. */
function invalidate() {
  if (needsPaint) return;
  needsPaint = true;
  requestAnimationFrame(() => {
    needsPaint = false;
    paint();
  });
}

function paint() {
  const f = frameById(state.frame);
  if (canvas.width !== f.w || canvas.height !== f.h) {
    canvas.width = f.w;
    canvas.height = f.h;
  }
  renderCover(ctx, {
    photos: state.photos,
    panels: state.panels,
    count: state.count,
    caption: state.caption,
    subtitle: state.subtitle,
    fontScale: state.fontScale,
    preset: presetById(state.preset),
    frameId: state.frame,
    seed: 1337,
  });
  paintToken += 1;
  window.__paintToken = paintToken;
  writeDiag();
}

/** Publishes the last paint's key measurements for tooling and screenshots. */
function writeDiag() {
  const f = frameById(state.frame);
  const band = measureBand(ctx, {
    caption: state.caption,
    fontScale: state.fontScale,
  });
  document.body.dataset.diag = JSON.stringify({
    w: canvas.width,
    h: canvas.height,
    frame: f.id,
    photos: state.photos.length,
    count: state.count,
    paint: paintToken,
    band,
  });
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Panel crops
// ---------------------------------------------------------------------------

/** Makes sure every visible panel has a crop, and that no panel is bare. */
function ensurePanelsFilled() {
  while (state.panels.length < MAX_PANELS) {
    const seed = defaultCrops(MAX_PANELS)[state.panels.length];
    state.panels.push(seed);
  }
  if (state.selected >= state.count) state.selected = state.count - 1;
  if (state.selected < 0) state.selected = 0;
}

function currentCrop() {
  if (!state.panels[state.selected]) {
    state.panels[state.selected] = { zoom: 1, offsetX: 0, offsetY: 0 };
  }
  return state.panels[state.selected];
}

function syncCropControls() {
  const crop = currentCrop();
  zoomEl.value = String(Math.round(crop.zoom * 100));
  offXEl.value = String(Math.round(crop.offsetX * 100));
  offYE.value = String(Math.round(crop.offsetY * 100));
  $('zoom-val').textContent = `${Math.round(crop.zoom * 100)}%`;
  $('offx-val').textContent = `${Math.round(crop.offsetX * 100)}`;
  $('offy-val').textContent = `${Math.round(crop.offsetY * 100)}`;
}

function syncChips() {
  const rail = $('chips');
  rail.querySelectorAll('.chip').forEach((chip) => {
    const i = Number(chip.dataset.index);
    chip.classList.toggle('is-active', i === state.selected);
    chip.classList.toggle('is-hidden', i >= state.count);
    chip.textContent = `${String(i + 1).padStart(2, '0')}`;
  });
}

// ---------------------------------------------------------------------------
// Photos in
// ---------------------------------------------------------------------------

async function addPhotos(files) {
  const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  status.textContent = 'Reading photos…';
  const loaded = [];
  for (const file of list) {
    try {
      loaded.push(await loadImage(URL.createObjectURL(file)));
    } catch {
      status.textContent = `Could not read ${file.name}`;
    }
  }
  if (!loaded.length) return;
  state.photos = state.photos.concat(loaded).slice(0, 12);
  ensurePanelsFilled();
  renderThumbs();
  status.textContent = `${state.photos.length} photo${state.photos.length > 1 ? 's' : ''} loaded.`;
  invalidate();
}

function renderThumbs() {
  const rail = $('thumbs');
  rail.innerHTML = '';
  state.photos.forEach((img, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = `Photo ${i + 1}`;
    const c = document.createElement('canvas');
    const size = 84;
    c.width = size;
    c.height = size;
    const g = c.getContext('2d');
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const s = Math.max(size / iw, size / ih);
    g.drawImage(img, (size - iw * s) / 2, (size - ih * s) / 2, iw * s, ih * s);
    b.appendChild(c);
    b.addEventListener('click', () => {
      // Point the selected panel at this photo.
      const crop = currentCrop();
      const order = state.panels.map((p) => p.photo ?? 0);
      // Photos are assigned round-robin; this overrides one panel's slot.
      order[state.selected] = i;
      state.panels = state.panels.map((p, k) => ({ ...p, photo: order[k] }));
      status.textContent = `Panel ${state.selected + 1} uses photo ${i + 1}.`;
      invalidate();
    });
    rail.appendChild(b);
  });
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function setCount(n) {
  state.count = Math.min(MAX_PANELS, Math.max(2, n));
  ensurePanelsFilled();
  $('count').querySelectorAll('.seg-btn').forEach((b) => {
    b.classList.toggle('is-active', Number(b.dataset.count) === state.count);
  });
  syncChips();
  syncCropControls();
  invalidate();
}

function setFrame(id) {
  state.frame = id;
  $('frame').querySelectorAll('.seg-btn').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.frame === id);
  });
  document.documentElement.dataset.frame = id;
  invalidate();
}

function setPreset(id) {
  state.preset = id;
  $('presets').querySelectorAll('.swatch').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.preset === id);
  });
  invalidate();
}

/** Builds the preset swatches and the panel chips once, at boot. */
function buildChrome() {
  const presets = $('presets');
  presets.innerHTML = '';
  PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.dataset.preset = p.id;
    b.title = `${p.name} — ${p.hint}`;
    const i = document.createElement('i');
    i.style.background = `linear-gradient(150deg, ${p.swatch[0]} 0%, ${p.swatch[1]} 34%, ${p.swatch[2]} 62%, ${p.swatch[3]} 100%)`;
    const label = document.createElement('b');
    label.textContent = p.name.split(' ')[0];
    b.append(i, label);
    b.addEventListener('click', () => setPreset(p.id));
    presets.appendChild(b);
  });

  const chips = $('chips');
  chips.innerHTML = '';
  for (let i = 0; i < MAX_PANELS; i += 1) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.index = String(i);
    chip.textContent = String(i + 1).padStart(2, '0');
    chip.addEventListener('click', () => {
      state.selected = i;
      syncChips();
      syncCropControls();
    });
    chips.appendChild(chip);
  }
}

function wire() {
  $('photo').addEventListener('change', (e) => addPhotos(e.target.files));

  const drop = $('dropzone');
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add('is-over');
  }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove('is-over');
  }));
  drop.addEventListener('drop', (e) => {
    if (e.dataTransfer?.files?.length) addPhotos(e.dataTransfer.files);
  });

  $('browse').addEventListener('click', () => $('photo').click());

  $('count').querySelectorAll('.seg-btn').forEach((b) => {
    b.addEventListener('click', () => setCount(Number(b.dataset.count)));
  });
  $('frame').querySelectorAll('.seg-btn').forEach((b) => {
    b.addEventListener('click', () => setFrame(b.dataset.frame));
  });
  // Swatches and chips are built (and wired) by buildChrome().

  captionEl.addEventListener('input', () => {
    state.caption = captionEl.value;
    invalidate();
  });
  subtitleEl.addEventListener('input', () => {
    state.subtitle = subtitleEl.value;
    invalidate();
  });
  fontEl.addEventListener('input', () => {
    state.fontScale = Number(fontEl.value) / 100;
    $('font-val').textContent = `${fontEl.value}%`;
    invalidate();
  });

  zoomEl.addEventListener('input', () => {
    currentCrop().zoom = Number(zoomEl.value) / 100;
    $('zoom-val').textContent = `${zoomEl.value}%`;
    invalidate();
  });
  offXEl.addEventListener('input', () => {
    currentCrop().offsetX = Number(offXEl.value) / 100;
    $('offx-val').textContent = offXEl.value;
    invalidate();
  });
  offYE.addEventListener('input', () => {
    currentCrop().offsetY = Number(offYE.value) / 100;
    $('offy-val').textContent = offYE.value;
    invalidate();
  });

  $('swap').addEventListener('click', () => {
    const a = state.selected;
    const b = (a + 1) % state.count;
    const tmp = state.panels[a];
    state.panels[a] = state.panels[b];
    state.panels[b] = tmp;
    status.textContent = `Swapped panels ${a + 1} and ${b + 1}.`;
    invalidate();
  });

  $('shuffle').addEventListener('click', () => {
    const fresh = defaultCrops(state.count);
    state.panels = state.panels.map((p, i) => ({ ...p, ...fresh[i % fresh.length] }));
    syncCropControls();
    invalidate();
  });

  $('randomize').addEventListener('click', () => {
    const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    setPreset(p.id);
    const n = PANEL_COUNTS[Math.floor(Math.random() * PANEL_COUNTS.length)];
    setCount(n);
    const fresh = defaultCrops(n);
    state.panels = state.panels.map((old, i) => ({ ...fresh[i % fresh.length], photo: old.photo ?? i }));
    syncCropControls();
    invalidate();
  });

  $('crop-reset').addEventListener('click', () => {
    state.panels[state.selected] = { ...defaultCrops(MAX_PANELS)[state.selected] };
    syncCropControls();
    invalidate();
  });

  $('export').querySelectorAll('.export-btn').forEach((b) => {
    b.addEventListener('click', () => exportPng(frameById(b.dataset.frame)));
  });

  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
    if (e.key === '[') {
      state.selected = (state.selected + state.count - 1) % state.count;
      syncChips();
      syncCropControls();
    } else if (e.key === ']') {
      state.selected = (state.selected + 1) % state.count;
      syncChips();
      syncCropControls();
    } else if (e.key.toLowerCase() === 's') {
      e.preventDefault();
      exportPng(frameById(state.frame));
    }
  });

  window.addEventListener('resize', fitCanvas);
}

/** Keeps the preview inside the stage without ever upscaling past 1:1.
    In a shot scene the stylesheet owns the size, so inline sizes are cleared. */
function fitCanvas() {
  if (document.body.classList.contains('shot-cover')
    || document.body.classList.contains('shot-export')) {
    canvas.style.width = '';
    canvas.style.height = '';
    return;
  }
  const f = frameById(state.frame);
  const stage = canvas.parentElement;
  if (!stage) return;
  const availW = stage.clientWidth - 2;
  const availH = Math.max(320, window.innerHeight - 190);
  const scale = Math.min(availW / f.w, availH / f.h, 1);
  canvas.style.width = `${Math.round(f.w * scale)}px`;
  canvas.style.height = `${Math.round(f.h * scale)}px`;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Paints the poster at `frame`'s exact size and downloads it as a PNG. */
function exportPng(frame) {
  const off = document.createElement('canvas');
  off.width = frame.w;
  off.height = frame.h;
  const g = off.getContext('2d');
  renderCover(g, {
    photos: state.photos,
    panels: state.panels,
    count: state.count,
    caption: state.caption,
    subtitle: state.subtitle,
    fontScale: state.fontScale,
    preset: presetById(state.preset),
    frameId: frame.id,
    seed: 1337,
  });
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed.';
      return;
    }
    const name = `neon-coast-${frame.w}x${frame.h}.png`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    status.textContent = `Saved ${name} · ${Math.round(blob.size / 1024)} KB`;
    $('last-export').textContent = `${frame.w} × ${frame.h}`;
  }, 'image/png');
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

/** Keeps a ?shot= scene and the real editor on the same code path. */
export function applyState(patch) {
  if (patch.caption !== undefined) {
    state.caption = patch.caption;
    captionEl.value = patch.caption;
  }
  if (patch.subtitle !== undefined) {
    state.subtitle = patch.subtitle;
    subtitleEl.value = patch.subtitle;
  }
  if (patch.count !== undefined) setCount(patch.count);
  if (patch.preset !== undefined) setPreset(patch.preset);
  if (patch.frame !== undefined) setFrame(patch.frame);
  if (patch.fontScale !== undefined) {
    state.fontScale = patch.fontScale;
    fontEl.value = String(Math.round(patch.fontScale * 100));
    $('font-val').textContent = `${fontEl.value}%`;
  }
  if (patch.photos !== undefined) {
    state.photos = patch.photos;
    renderThumbs();
  }
  if (patch.selected !== undefined) {
    state.selected = patch.selected;
    syncChips();
    syncCropControls();
  }
  ensurePanelsFilled();
  invalidate();
}

/** Waits for the vendored display faces before the first paint, so a shot
    never catches the canvas mid-font-swap. */
async function loadFonts() {
  const faces = ['400 100px Anton', '400 100px Pacifico'];
  try {
    await Promise.all(faces.map((f) => document.fonts.load(f, 'ABC')));
    await document.fonts.ready;
  } catch {
    /* no font loading API: the stack's fallbacks draw instead */
  }
}

async function boot() {
  buildChrome();
  wire();
  await loadFonts();
  setCount(state.count);
  setFrame(state.frame);
  setPreset(state.preset);
  syncChips();
  syncCropControls();
  fitCanvas();

  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (shot) {
    await runShot(shot, q, { loadImage, applyState, loadSamples });
  } else {
    await loadSamples(['boulevard', 'pier']);
  }
  paint();
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

/** Loads app/samples/<name>.jpg for each name that exists. */
async function loadSamples(names) {
  const out = [];
  for (const name of names) {
    try {
      out.push(await loadImage(`samples/${name}.jpg`));
    } catch {
      /* a missing sample is simply skipped */
    }
  }
  if (out.length) {
    state.photos = out;
    renderThumbs();
    if (status) status.textContent = `${out.length} sample photos loaded — drop your own to replace them.`;
    invalidate();
  }
  return out;
}

boot();
