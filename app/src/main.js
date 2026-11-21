// Wires Vice Cover Studio: photo intake, the layout and lettering controls, the live canvas and the PNG
// exports. Every change queues one repaint through requestAnimationFrame, so dragging a slider never stacks
// renders, and the poster itself is drawn entirely by renderCover (./cover.js).
//
// Two query-parameter modes exist so automated screenshots are deterministic:
//   ?shot=cover   the poster alone, canvas sized to the window (controls hidden)
//   ?shot=editor  the full bench with the controls visible
// plus ?photo=pier,boulevard (samples/<name>.jpg), &caption=, &subtitle=, &count=, &preset=, &frame=, &font=
// to pin the scene. window.__shotReady turns true after the first painted frame.

import { renderCover, PRESETS, PANEL_COUNTS, MAX_PANELS, defaultPanelCrops } from './cover.js';

/** The three deliverable frames: id, exact export pixels and the label printed on the poster. */
const FRAMES = [
  { id: '1:1', w: 1080, h: 1080 },
  { id: '4:5', w: 1080, h: 1350 },
  { id: '16:9', w: 1920, h: 1080 },
];

/** Live preview pixels per frame — a ceiling; the stage sizes the canvas to whatever actually fits. */
const PREVIEW = { '1:1': [900, 900], '4:5': [900, 1125], '16:9': [1280, 720] };

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
const isShot = shot === 'cover' || shot === 'editor';

const canvas = document.getElementById('cover');
const ctx2d = canvas.getContext('2d', { alpha: false });

/** Everything the poster needs. `panels` keeps a full MAX_PANELS of crops whatever the visible count. */
const state = {
  photos: [],
  panels: defaultPanelCrops().map((crop) => ({ imgIndex: -1, ...crop })),
  count: 4,
  selected: 0,
  caption: 'Sunset Heist',
  subtitle: 'Two crooks, one coastline',
  fontScale: 100,
  preset: 0,
  frame: '1:1',
};

let nextPhotoId = 1;
let drawQueued = false;
let firstPaint = false;

// ---------------------------------------------------------------- DOM handles

const el = (id) => document.getElementById(id);
const ui = {
  photos: el('photos'),
  drop: el('drop'),
  thumbs: el('thumbs'),
  photoCount: el('photo-count'),
  counts: el('counts'),
  frames: el('frames'),
  frameOut: el('frame-out'),
  presets: el('presets'),
  caption: el('caption'),
  subtitle: el('subtitle'),
  font: el('font'),
  fontOut: el('font-out'),
  chips: el('panel-chips'),
  panelActive: el('panel-active'),
  zoom: el('zoom'),
  zoomOut: el('zoom-out'),
  ox: el('ox'),
  oxOut: el('ox-out'),
  oy: el('oy'),
  oyOut: el('oy-out'),
  swapPrev: el('swap-prev'),
  swapNext: el('swap-next'),
  resetCrop: el('reset-crop'),
  shuffle: el('shuffle'),
  randomize: el('randomize'),
  keys: el('keys'),
  status: el('status'),
  stageMeta: el('stage-meta'),
  wrap: el('canvas-wrap'),
};

// ---------------------------------------------------------------- status

function say(message, tone = '') {
  ui.status.textContent = message;
  ui.status.className = `status${tone ? ` ${tone}` : ''}`;
}

// ---------------------------------------------------------------- images

/** Loads an image from a URL and resolves once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${url}`));
    img.src = url;
  });
}

/** Adds a loaded image to the photo library and drops it into the next panel that has no photo. */
function addPhoto(img, name, url, demo = false) {
  const photo = { id: nextPhotoId++, img, name, url, demo };
  state.photos.push(photo);
  const index = state.photos.length - 1;
  const empty = state.panels.findIndex((panel) => panel.imgIndex === -1);
  if (empty >= 0) state.panels[empty].imgIndex = index;
  else state.panels[index % state.panels.length].imgIndex = index;
  ensurePanelsFilled();
  return photo;
}

/**
 * Every visible panel must show something: a panel left without a photo borrows the next one in the library,
 * so a single photo still fills a six-panel poster (with its own crop each, which is the look we want) and
 * five photos fill six panels rather than leaving a blank plate.
 */
function ensurePanelsFilled() {
  if (state.photos.length === 0) return;
  const n = state.photos.length;
  state.panels.forEach((panel, i) => {
    if (panel.imgIndex === -1 || panel.imgIndex >= n) panel.imgIndex = i % n;
  });
}

/** Reads the file list from the input (or a drop) and appends every image, in order. */
async function addFiles(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith('image/'));
  if (files.length === 0) {
    say('Those files are not images — use PNG, JPEG or WebP.', 'warn');
    return;
  }
  const demoPresent = state.photos.some((p) => p.demo);
  if (demoPresent) {
    // The bundled demo photos step aside the moment the user brings their own.
    for (const photo of state.photos.filter((p) => p.demo)) URL.revokeObjectURL(photo.url);
    state.photos = state.photos.filter((p) => !p.demo);
    for (const panel of state.panels) panel.imgIndex = -1;
  }
  let added = 0;
  for (const file of files) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      addPhoto(img, file.name.replace(/\.[^.]+$/, ''), url);
      added++;
    } catch {
      URL.revokeObjectURL(url);
    }
  }
  if (added === 0) {
    say('None of those images could be decoded.', 'bad');
    return;
  }
  syncPhotoUi();
  say(`Loaded ${added} photo${added === 1 ? '' : 's'}. Every panel shows one.`, 'ok');
  queueDraw();
}

/** Removes one photo and re-points the panels that used it. */
function removePhoto(id) {
  const at = state.photos.findIndex((p) => p.id === id);
  if (at < 0) return;
  URL.revokeObjectURL(state.photos[at].url);
  state.photos.splice(at, 1);
  for (const panel of state.panels) {
    if (panel.imgIndex === at) panel.imgIndex = -1;
    else if (panel.imgIndex > at) panel.imgIndex--;
  }
  if (state.photos.length > 0) {
    const keep = state.photos.length;
    for (const [i, panel] of state.panels.entries()) {
      if (panel.imgIndex === -1 || panel.imgIndex >= keep) panel.imgIndex = i % keep;
    }
  }
  syncPhotoUi();
  queueDraw();
}

// ---------------------------------------------------------------- UI builders

function buildCounts() {
  ui.counts.innerHTML = '';
  for (const n of PANEL_COUNTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(n);
    button.dataset.count = String(n);
    button.setAttribute('aria-pressed', String(n === state.count));
    button.title = `${n} panels`;
    button.addEventListener('click', () => {
      state.count = n;
      state.selected = Math.min(state.selected, n - 1);
      syncAll();
      say(`${n} panels. Click a chip to pick a panel, then adjust its crop.`);
      queueDraw();
    });
    ui.counts.append(button);
  }
}

function buildFrames() {
  ui.frames.innerHTML = '';
  for (const frame of FRAMES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = frame.id;
    button.dataset.frame = frame.id;
    button.setAttribute('aria-pressed', String(frame.id === state.frame));
    button.title = `${frame.w} × ${frame.h}`;
    button.addEventListener('click', () => {
      state.frame = frame.id;
      syncAll();
      queueDraw();
    });
    ui.frames.append(button);
  }
}

function buildPresets() {
  ui.presets.innerHTML = '';
  PRESETS.forEach((preset, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.title = `${preset.name} — ${preset.hint}`;
    button.setAttribute('aria-label', preset.name);
    button.setAttribute('aria-pressed', String(i === state.preset));
    const layer = document.createElement('span');
    layer.style.background = `linear-gradient(140deg, ${preset.swatch[0]} 0%, ${preset.swatch[1]} 52%, ${preset.swatch[2]} 100%)`;
    button.append(layer);
    button.addEventListener('click', () => {
      state.preset = i;
      syncAll();
      say(`Preset: ${preset.name}.`, 'ok');
      queueDraw();
    });
    ui.presets.append(button);
  });
}

function buildChips() {
  ui.chips.innerHTML = '';
  for (let i = 0; i < MAX_PANELS; i++) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = String(i + 1).padStart(2, '0');
    chip.dataset.panel = String(i);
    chip.addEventListener('click', () => {
      state.selected = i;
      syncPanelUi();
      syncChips();
    });
    ui.chips.append(chip);
  }
}

function syncChips() {
  [...ui.chips.children].forEach((chip, i) => {
    const active = i === state.selected;
    chip.setAttribute('aria-pressed', String(active));
    chip.disabled = i >= state.count;
  });
  ui.panelActive.textContent = String(state.selected + 1).padStart(2, '0');
  ui.swapPrev.disabled = state.selected === 0;
  ui.swapNext.disabled = state.selected >= state.count - 1;
  ui.swapPrev.style.opacity = state.selected === 0 ? '0.4' : '';
  ui.swapNext.style.opacity = state.selected >= state.count - 1 ? '0.4' : '';
}

function syncPhotoUi() {
  ui.photoCount.textContent = String(state.photos.length);
  ui.thumbs.innerHTML = '';
  const inUse = new Set(state.panels.slice(0, state.count).map((p) => p.imgIndex));
  for (const photo of state.photos) {
    const wrap = document.createElement('div');
    wrap.className = 'thumb';
    wrap.title = `${photo.name} — click to place in panel ${String(state.selected + 1).padStart(2, '0')}`;
    if (inUse.has(state.photos.indexOf(photo))) wrap.classList.add('in-use');
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.name;
    img.loading = 'lazy';
    wrap.append(img);
    const kill = document.createElement('button');
    kill.type = 'button';
    kill.className = 'thumb-x';
    kill.textContent = '×';
    kill.title = `Remove ${photo.name}`;
    kill.setAttribute('aria-label', `Remove ${photo.name}`);
    kill.addEventListener('click', (event) => {
      event.stopPropagation();
      removePhoto(photo.id);
    });
    wrap.append(kill);
    wrap.addEventListener('click', () => {
      const index = state.photos.indexOf(photo);
      state.panels[state.selected].imgIndex = index;
      state.selected = (state.selected + 1) % state.count;
      syncPanelUi();
      syncChips();
      syncPhotoUi();
      queueDraw();
    });
    ui.thumbs.append(wrap);
  }
}

function syncPanelUi() {
  const panel = state.panels[state.selected];
  ui.zoom.value = String(Math.round(panel.zoom * 100));
  ui.zoomOut.textContent = `${Math.round(panel.zoom * 100)}%`;
  ui.ox.value = String(Math.round(panel.ox * 100));
  ui.oxOut.textContent = panel.ox > 0 ? `+${Math.round(panel.ox * 100)}` : String(Math.round(panel.ox * 100));
  ui.oy.value = String(Math.round(panel.oy * 100));
  ui.oyOut.textContent = panel.oy > 0 ? `+${Math.round(panel.oy * 100)}` : String(Math.round(panel.oy * 100));
}

function syncAll() {
  [...ui.counts.children].forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.count) === state.count)));
  [...ui.frames.children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.frame === state.frame)));
  [...ui.presets.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === state.preset)));
  ui.frameOut.textContent = state.frame;
  ui.fontOut.textContent = `${state.fontScale}%`;
  syncChips();
  syncPanelUi();
  syncPhotoUi();
}

// ---------------------------------------------------------------- painting

/** The option bag renderCover wants, built from the current state and the pixel size being drawn. */
function posterOptions(ratioLabel) {
  return {
    count: state.count,
    panels: state.panels.map((panel) => ({
      img: panel.imgIndex >= 0 ? state.photos[panel.imgIndex]?.img ?? null : null,
      zoom: panel.zoom,
      ox: panel.ox,
      oy: panel.oy,
    })),
    caption: state.caption,
    subtitle: state.subtitle,
    fontScale: state.fontScale,
    preset: PRESETS[state.preset],
    ratioLabel,
  };
}

function queueDraw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    draw();
  });
}

let paintedOnce = false;
function draw() {
  const [pw, ph] = isShot && shot === 'cover'
    ? [window.innerWidth, window.innerHeight]
    : PREVIEW[state.frame];
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  renderCover(ctx2d, posterOptions(state.frame));
  canvas.setAttribute('aria-label', `Cover preview: ${state.caption || 'untitled'}, ${state.count} panels`);
  ui.stageMeta.textContent = `${pw} × ${ph} · ${state.frame}`;
  fitStage();
  if (!paintedOnce) paintedOnce = true;
  requestAnimationFrame(() => {
    if (!firstPaint) {
      firstPaint = true;
      window.__shotReady = true;
    }
  });
}

/** Sizes the canvas element to fill the stage without ever upscaling past its own pixel budget. */
function fitStage() {
  if (isShot && shot === 'cover') return;
  const wrap = ui.wrap;
  if (!wrap) return;
  const frame = FRAMES.find((f) => f.id === state.frame) ?? FRAMES[0];
  const [bw, bh] = PREVIEW[state.frame];
  const availW = wrap.clientWidth - 40;
  const availH = wrap.clientHeight - 40;
  const ratio = frame.w / frame.h;
  let w = Math.min(availW, availH * ratio, bw);
  let h = w / ratio;
  if (h > bh) {
    h = bh;
    w = h * ratio;
  }
  canvas.style.width = `${Math.max(120, Math.round(w))}px`;
  canvas.style.height = `${Math.max(120, Math.round(h))}px`;
}

// ---------------------------------------------------------------- export

/** Renders the poster at an exact size in a throwaway canvas and saves it as a PNG. */
function exportPng(frameId) {
  const frame = FRAMES.find((f) => f.id === frameId) ?? FRAMES[0];
  const out = document.createElement('canvas');
  out.width = frame.w;
  out.height = frame.h;
  const octx = out.getContext('2d', { alpha: false });
  renderCover(octx, posterOptions(frame.id));
  const name = `vice-cover-${state.caption.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled'}-${frame.w}x${frame.h}.png`;
  out.toBlob((blob) => {
    if (!blob) {
      say('The browser refused to encode the PNG.', 'bad');
      return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    const kb = (blob.size / 1024).toFixed(0);
    say(`Saved ${name} — ${frame.w} × ${frame.h}, ${kb} KB PNG.`, 'ok');
  }, 'image/png');
}

// ---------------------------------------------------------------- events

function wire() {
  ui.photos.addEventListener('change', (event) => {
    addFiles(event.target.files);
    event.target.value = '';
  });

  // Drag and drop onto the drop zone, and anywhere else on the page.
  const stop = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  for (const type of ['dragenter', 'dragover']) {
    ui.drop.addEventListener(type, (event) => {
      stop(event);
      ui.drop.classList.add('dragging');
    });
  }
  for (const type of ['dragleave', 'drop']) {
    ui.drop.addEventListener(type, (event) => {
      stop(event);
      ui.drop.classList.remove('dragging');
    });
  }
  ui.drop.addEventListener('drop', (event) => {
    if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files);
  });
  window.addEventListener('dragover', stop);
  window.addEventListener('drop', (event) => {
    stop(event);
    if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files);
  });

  ui.caption.addEventListener('input', () => {
    state.caption = ui.caption.value;
    queueDraw();
  });
  ui.subtitle.addEventListener('input', () => {
    state.subtitle = ui.subtitle.value;
    queueDraw();
  });
  ui.font.addEventListener('input', () => {
    state.fontScale = Number(ui.font.value);
    ui.fontOut.textContent = `${state.fontScale}%`;
    queueDraw();
  });

  const crop = (key, scale, format) => () => {
    const panel = state.panels[state.selected];
    panel[key] = Number(ui[key].value) / scale;
    ui[`${key}Out`].textContent = format(panel[key]);
    queueDraw();
  };
  ui.zoom.addEventListener('input', crop('zoom', 100, (v) => `${Math.round(v * 100)}%`));
  const signed = (v) => (v > 0 ? `+${Math.round(v * 100)}` : String(Math.round(v * 100)));
  ui.ox.addEventListener('input', crop('ox', 100, signed));
  ui.oy.addEventListener('input', crop('oy', 100, signed));

  ui.swapPrev.addEventListener('click', () => {
    if (state.selected === 0) return;
    const a = state.selected - 1;
    const b = state.selected;
    [state.panels[a], state.panels[b]] = [state.panels[b], state.panels[a]];
    state.selected = a;
    syncPanelUi();
    syncChips();
    syncPhotoUi();
    say(`Swapped panels ${String(a + 1).padStart(2, '0')} and ${String(b + 1).padStart(2, '0')}.`, 'ok');
    queueDraw();
  });

  ui.swapNext.addEventListener('click', () => {
    if (state.selected >= state.count - 1) return;
    const a = state.selected;
    const b = state.selected + 1;
    [state.panels[a], state.panels[b]] = [state.panels[b], state.panels[a]];
    state.selected = b;
    syncPanelUi();
    syncChips();
    syncPhotoUi();
    say(`Swapped panels ${String(a + 1).padStart(2, '0')} and ${String(b + 1).padStart(2, '0')}.`, 'ok');
    queueDraw();
  });

  ui.resetCrop.addEventListener('click', () => {
    const panel = state.panels[state.selected];
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    syncPanelUi();
    queueDraw();
  });

  ui.shuffle.addEventListener('click', () => {
    shuffleCrops();
    say('Fresh crops on every panel.', 'ok');
    queueDraw();
  });

  /**
   * The one-button surprise: a new preset, a new panel count, a new frame and a fresh set of crops, drawn as one
   * change so the poster that comes out is a coherent new shot rather than a permutation of the old one.
   */
  function randomizeAll() {
    const pick = (n, not) => {
      if (n <= 1) return 0;
      let v = Math.floor(Math.random() * n);
      if (v === not) v = (v + 1 + Math.floor(Math.random() * (n - 1))) % n;
      return v;
    };
    state.preset = pick(PRESETS.length, state.preset);
    state.count = PANEL_COUNTS[pick(PANEL_COUNTS.length, PANEL_COUNTS.indexOf(state.count))];
    state.frame = FRAMES[pick(FRAMES.length, FRAMES.findIndex((f) => f.id === state.frame))].id;
    state.selected = Math.min(state.selected, state.count - 1);
    shuffleCrops(true);
    syncAll();
    fitStage();
    queueDraw();
    const preset = PRESETS[state.preset];
    say(`Randomized: ${preset.name}, ${state.count} panels, ${state.frame} — ${preset.hint}.`, 'ok');
  }

  /** New crops on every panel: the default rhythm nudged, so the collage stays composed but never repeats. */
  function shuffleCrops(strong = false) {
    const base = defaultPanelCrops();
    const swing = strong ? 0.6 : 0.4;
    const zoomSwing = strong ? 0.5 : 0.34;
    state.panels.forEach((panel, i) => {
      const seed = base[(i + 2) % base.length];
      panel.zoom = Math.min(2.2, Math.max(0.98, seed.zoom + (Math.random() - 0.5) * zoomSwing));
      panel.ox = Math.max(-0.8, Math.min(0.8, seed.ox + (Math.random() - 0.5) * swing));
      panel.oy = Math.max(-0.8, Math.min(0.8, seed.oy + (Math.random() - 0.5) * swing));
    });
    syncPanelUi();
  }

  function cyclePreset(step = 1) {
    state.preset = (state.preset + step + PRESETS.length) % PRESETS.length;
    syncAll();
    say(`Preset: ${PRESETS[state.preset].name}.`, 'ok');
    queueDraw();
  }

  function cycleFrame(step = 1) {
    const at = FRAMES.findIndex((f) => f.id === state.frame);
    state.frame = FRAMES[(at + step + FRAMES.length) % FRAMES.length].id;
    syncAll();
    fitStage();
    queueDraw();
    say(`Frame: ${state.frame}.`, 'ok');
  }

  function cycleCount(step) {
    const at = PANEL_COUNTS.indexOf(state.count);
    const next = PANEL_COUNTS[Math.max(0, Math.min(PANEL_COUNTS.length - 1, at + step))];
    if (next === state.count) return;
    state.count = next;
    state.selected = Math.min(state.selected, state.count - 1);
    syncAll();
    queueDraw();
    say(`${next} panels.`, 'ok');
  }

  function nudgeFont(step) {
    state.fontScale = Math.max(55, Math.min(150, state.fontScale + step));
    ui.font.value = String(state.fontScale);
    ui.fontOut.textContent = `${state.fontScale}%`;
    queueDraw();
    say(`Title size: ${state.fontScale}%.`, '');
  }

  function toggleKeys() {
    const folded = ui.keys.classList.toggle('folded');
    say(folded ? 'Shortcut bar hidden — press ? to bring it back.' : 'Shortcut bar shown.', '');
  }

  ui.randomize.addEventListener('click', () => {
    ui.randomize.classList.remove('spin');
    // Restart the tumble on the die: drop the class, force a reflow, put it back.
    void ui.randomize.offsetWidth;
    ui.randomize.classList.add('spin');
    randomizeAll();
    setTimeout(() => ui.randomize.classList.remove('spin'), 480);
  });

  // The keyboard map, shown in the panel rail so nothing here is a hidden feature. Alt/⌘/Ctrl and typing in a
  // field are both left alone: the shortcuts only fire on a bare key press.
  window.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target instanceof HTMLElement) {
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
    }
    if (event.key === '?') {
      event.preventDefault();
      toggleKeys();
      return;
    }
    if (event.key >= '1' && event.key <= '6') {
      const n = Number(event.key);
      if (n <= state.count) {
        state.selected = n - 1;
        syncPanelUi();
        syncChips();
      }
      return;
    }
    switch (event.key.toLowerCase()) {
      case 'r':
        event.preventDefault();
        ui.randomize.click();
        break;
      case 'p':
        event.preventDefault();
        cyclePreset(1);
        break;
      case 'f':
        event.preventDefault();
        cycleFrame(1);
        break;
      case 'e':
        event.preventDefault();
        exportPng(state.frame);
        break;
      case '[':
        event.preventDefault();
        cycleCount(-1);
        break;
      case ']':
        event.preventDefault();
        cycleCount(1);
        break;
      case '+':
      case '=':
        event.preventDefault();
        nudgeFont(6);
        break;
      case '-':
      case '_':
        event.preventDefault();
        nudgeFont(-6);
        break;
      default:
        break;
    }
  });

  document.querySelectorAll('[data-export]').forEach((button) => {
    button.addEventListener('click', () => {
      const [w, h] = button.dataset.export.split('x').map(Number);
      const frame = FRAMES.find((f) => f.w === w && f.h === h) ?? FRAMES[0];
      say(`Rendering ${frame.w} × ${frame.h} …`);
      setTimeout(() => exportPng(frame.id), 16);
    });
  });
}

// ---------------------------------------------------------------- shot mode

/** Loads app/samples/<name>.jpg for each comma-separated `photo` value. */
async function loadSamples(names) {
  for (const name of names) {
    const clean = name.trim().replace(/[^a-z0-9_-]/gi, '');
    if (clean === '') continue;
    try {
      const img = await loadImage(`samples/${clean}.jpg`);
      addPhoto(img, clean, `samples/${clean}.jpg`, false);
    } catch {
      // A missing sample just leaves that panel to the next one.
    }
  }
}

function applyQuery() {
  const caption = query.get('caption');
  if (caption !== null && caption !== '') {
    state.caption = caption;
    ui.caption.value = caption;
  }
  const subtitle = query.get('subtitle');
  if (subtitle !== null) {
    state.subtitle = subtitle;
    ui.subtitle.value = subtitle;
  }
  const count = Number(query.get('count'));
  if (PANEL_COUNTS.includes(count)) state.count = count;
  const presetId = query.get('preset');
  const presetIndex = PRESETS.findIndex((p) => p.id === presetId || p.name.toLowerCase() === String(presetId).toLowerCase());
  if (presetIndex >= 0) state.preset = presetIndex;
  const frame = query.get('frame');
  if (FRAMES.some((f) => f.id === frame)) state.frame = frame;
  const font = Number(query.get('font'));
  if (Number.isFinite(font) && font >= 55 && font <= 150) state.fontScale = Math.round(font);
  ui.caption.value = state.caption;
  ui.subtitle.value = state.subtitle;
  ui.font.value = String(state.fontScale);
  syncAll();
}

// ---------------------------------------------------------------- boot

async function boot() {
  buildCounts();
  buildFrames();
  buildPresets();
  buildChips();
  wire();
  applyQuery();

  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');

  const names = (query.get('photo') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (names.length > 0) {
    await loadSamples(names);
  } else {
    // No photo named (a cold open, or ?shot=cover on its own): the bundled frames fill the grid, so the
    // poster is never an empty promise and an automated screenshot never catches six blank plates. They come
    // from two shoots, so a four-panel grid already reads as a collage rather than one photo repeated.
    await loadSamples(['boulevard', 'pier-portrait', 'boulevard-car', 'pier-tall']);
    if (state.photos.length > 0 && !isShot) say('Demo photos loaded — drop your own to replace them.', '');
  }

  syncAll();
  draw();

  if (isShot && shot === 'cover') {
    window.addEventListener('resize', () => queueDraw());
  } else {
    window.addEventListener('resize', fitStage);
  }
}

boot().catch((err) => {
  say(`Startup failed: ${err.message}`, 'bad');
  window.__shotReady = true;
});
