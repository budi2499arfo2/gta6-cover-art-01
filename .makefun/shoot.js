// Regenerates screenshots/ from the real app in headless Chrome, driven over the DevTools protocol.
//
//   node .makefun/shoot.js                 # all four shots
//   node .makefun/shoot.js 1               # only the shots whose name starts with "1"
//
// Why CDP rather than `chrome --screenshot`: the page has to be *ready* before the shutter. The app flips
// window.__shotReady on the animation frame after the first painted poster (samples decoded, canvas drawn), so
// this script polls that flag through Runtime.evaluate and only then asks Page.captureScreenshot for a JPEG at
// the exact viewport the shot needs. Chrome's --screenshot flag has no way to ask the page anything.
//
// Node 22 ships a WebSocket client, so this is still standard library only.

const { spawn } = require('node:child_process');
const { mkdirSync, writeFileSync, statSync } = require('node:fs');
const { join } = require('node:path');

const CHROME = '/usr/bin/google-chrome';
const PORT = 9333;
const BASE = 'http://127.0.0.1:8099/index.html';
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'screenshots');
const PROFILE = join(ROOT, '.makefun', 'chrome-profile');

/** The cap every screenshot must clear: 256 KiB, with a little headroom under the grader's own count. */
const BUDGET = 250000;

// [file, query, width, height]
const SHOTS = [
  ['1-cover.jpg', '?shot=cover&photo=pier&caption=Sunset%20Heist', 1080, 1080],
  ['2-editor.jpg', '?shot=editor&photo=boulevard', 1600, 1000],
  ['3-poster-4x5.jpg', '?shot=cover&frame=4:5&photo=boulevard-car&caption=Coastline%20Kings', 1080, 1350],
  ['4-wide-16x9.jpg', '?shot=cover&frame=16:9&photo=pier-portrait&caption=Neon%20Nights', 1600, 900],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(path) {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}${path}`);
      if (res.ok) return await res.json();
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error(`devtools ${path} never answered`);
}

/** A tiny CDP client: send a command, await its reply, and keep the session's event handlers out of the way. */
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
      else resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  });
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('devtools socket failed')), { once: true });
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  return { ready, send, close: () => ws.close(), events };
}

/** Polls the page until window.__shotReady is true, then settles one more frame so the paint is on screen. */
async function waitReady(cdp, timeoutMs = 25000) {
  const started = Date.now();
  for (;;) {
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: 'Boolean(window.__shotReady)',
      returnByValue: true,
    });
    if (result.value === true) break;
    if (Date.now() - started > timeoutMs) throw new Error('window.__shotReady never turned true');
    await sleep(120);
  }
  // The flag is set inside a rAF callback; give the compositor the frame that follows it.
  await cdp.send('Runtime.evaluate', {
    expression: 'new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))',
    awaitPromise: true,
    returnByValue: true,
  });
}

async function shoot(cdp, url, w, h, quality) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: w,
    screenHeight: h,
  });
  await cdp.send('Page.navigate', { url });
  await sleep(250);
  await waitReady(cdp);
  return quality;
}

/**
 * Captures a JPEG under the make.fun screenshot cap. The poster carries film grain and scanlines, which JPEG
 * spends a lot of bits on, so a fixed quality is not safe: an 84 is fine at 16:9 and blows the cap at 4:5. The
 * quality is stepped down from 92 until the encoded frame fits the budget, with headroom for the grader's own
 * byte count.
 */
async function captureUnder(cdp, budget) {
  for (const quality of [92, 90, 88, 86, 84, 82, 80, 78, 76, 74, 72]) {
    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality,
      captureBeyondViewport: false,
      fromSurface: true,
    });
    const buf = Buffer.from(data, 'base64');
    if (buf.length <= budget) return { buf, quality };
  }
  throw new Error('cannot fit the screenshot under the cap even at quality 72');
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const only = process.argv[2];
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-dev-shm-usage',
    '--force-color-profile=srgb',
    '--force-device-scale-factor=1',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    await getJson('/json/version');
    const targets = await getJson('/json/list');
    const page = targets.find((t) => t.type === 'page');
    if (!page) throw new Error('no page target in devtools');
    const cdp = connect(page.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

    for (const [name, query, w, h, quality] of SHOTS) {
      if (only && !name.startsWith(only)) continue;
      await shoot(cdp, BASE + query, w, h, quality);
      const { buf, quality: used } = await captureUnder(cdp, BUDGET);
      const file = join(OUT, name);
      writeFileSync(file, buf);
      console.log(`${name}: ${w}x${h} q${used} ${statSync(file).size} bytes`);
    }
    cdp.close();
  } finally {
    chrome.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('shoot failed:', err.message);
  process.exit(1);
});
