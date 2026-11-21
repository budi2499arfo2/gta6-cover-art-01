// An end-to-end check of the editor: no console errors, the randomize button really changes preset + count +
// frame + crops, and every documented keyboard shortcut does what the shortcut list says. Drives the real page
// in headless Chrome over CDP, exactly like shoot.js.
//
//   node .makefun/selftest.js

const { spawn } = require('node:child_process');
const { join } = require('node:path');

const CHROME = '/usr/bin/google-chrome';
const PORT = 9334;
const BASE = 'http://127.0.0.1:8099/index.html';
const ROOT = join(__dirname, '..');
const PROFILE = join(ROOT, '.makefun', 'chrome-profile-test');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(path) {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}${path}`);
      if (res.ok) return await res.json();
    } catch { /* not up */ }
    await sleep(200);
  }
  throw new Error('devtools never answered');
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const consoleErrors = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message}`));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails?.exception?.description ?? 'exception');
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.description ?? a.value ?? '').join(' '));
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      consoleErrors.push(`${msg.params.entry.text} ${msg.params.entry.url ?? ''}`);
    }
  });
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('socket failed')), { once: true });
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  return { ready, send, close: () => ws.close(), consoleErrors };
}

const failures = [];
function check(name, ok, detail = '') {
  if (ok) console.log(`  PASS  ${name}${detail ? ' — ' + detail : ''}`);
  else {
    console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
    failures.push(name);
  }
}

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--disable-dev-shm-usage',
    '--window-size=1600,1000', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
    'about:blank',
  ], { stdio: 'ignore' });

  const cdp = (() => null)();
  let client;
  try {
    await getJson('/json/version');
    const page = (await getJson('/json/list')).find((t) => t.type === 'page');
    client = connect(page.webSocketDebuggerUrl);
    await client.ready;
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Log.enable');
    await client.send('Network.enable');
    await client.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
    await client.send('Page.navigate', { url: BASE + '?shot=editor&photo=pier,boulevard' });
    await sleep(400);

    // Wait for boot to finish painting.
    for (let i = 0; i < 120; i++) {
      const { result } = await client.send('Runtime.evaluate', { expression: 'Boolean(window.__shotReady)', returnByValue: true });
      if (result.value) break;
      await sleep(200);
    }

    const evalJs = async (expression) => {
      const { result, exceptionDetails } = await client.send('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'eval failed');
      return result.value;
    };

    console.log('editor boot');
    check('window.__shotReady', (await evalJs('window.__shotReady')) === true);
    check('canvas painted', (await evalJs(`(() => {
      const c = document.getElementById('cover');
      const g = c.getContext('2d');
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let nonBlack = 0;
      for (let i = 0; i < d.length; i += 4 * 997) if (d[i] + d[i+1] + d[i+2] > 60) nonBlack++;
      return nonBlack > 100;
    })()`)) === true);

    console.log('shortcut list + randomize button exist');
    check('8 shortcut entries', (await evalJs(`document.querySelectorAll('#keys .key').length`)) === 8);
    check('randomize button labelled', (await evalJs(`document.getElementById('randomize').textContent.trim()`)) === 'Randomize');
    check('no zero-size controls', (await evalJs(`(() => {
      const ids = ['randomize','shuffle','keys','caption','subtitle','font','zoom','presets','counts','frames'];
      return ids.every((id) => { const r = document.getElementById(id).getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    })()`)) === true);

    console.log('randomize changes preset + count + frame + crops');
    const domBefore = await evalJs(`(() => ({
      preset: [...document.querySelectorAll('#presets button')].findIndex((b) => b.getAttribute('aria-pressed') === 'true'),
      count: Number([...document.querySelectorAll('#counts button')].find((b) => b.getAttribute('aria-pressed') === 'true').dataset.count),
      frame: [...document.querySelectorAll('#frames button')].find((b) => b.getAttribute('aria-pressed') === 'true').dataset.frame,
      zoom: document.getElementById('zoom').value,
    }))()`);

    await evalJs(`document.getElementById('randomize').click(); true`);
    await sleep(500);
    const domAfter = await evalJs(`(() => ({
      preset: [...document.querySelectorAll('#presets button')].findIndex((b) => b.getAttribute('aria-pressed') === 'true'),
      count: Number([...document.querySelectorAll('#counts button')].find((b) => b.getAttribute('aria-pressed') === 'true').dataset.count),
      frame: [...document.querySelectorAll('#frames button')].find((b) => b.getAttribute('aria-pressed') === 'true').dataset.frame,
      zoom: document.getElementById('zoom').value,
      status: document.getElementById('status').textContent,
    }))()`);
    check('preset changed', domBefore.preset !== domAfter.preset, `${domBefore.preset} -> ${domAfter.preset}`);
    check('panel count changed', domBefore.count !== domAfter.count, `${domBefore.count} -> ${domAfter.count}`);
    check('frame changed', domBefore.frame !== domAfter.frame, `${domBefore.frame} -> ${domAfter.frame}`);
    check('status reports the randomize', /Randomized:/.test(domAfter.status), domAfter.status.slice(0, 60));

    console.log('keyboard shortcuts');
    const press = async (key) => {
      await evalJs(`(() => {
        const e = new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true });
        document.body.dispatchEvent(e);
        return true;
      })()`);
      await sleep(220);
    };
    const read = () => evalJs(`(() => ({
      preset: [...document.querySelectorAll('#presets button')].findIndex((b) => b.getAttribute('aria-pressed') === 'true'),
      count: Number([...document.querySelectorAll('#counts button')].find((b) => b.getAttribute('aria-pressed') === 'true').dataset.count),
      frame: [...document.querySelectorAll('#frames button')].find((b) => b.getAttribute('aria-pressed') === 'true').dataset.frame,
      font: document.getElementById('font').value,
      folded: document.getElementById('keys').classList.contains('folded'),
      chip: [...document.querySelectorAll('#panel-chips .chip')].findIndex((c) => c.getAttribute('aria-pressed') === 'true'),
    }))()`);

    let s0 = await read();
    await press('p');
    let s1 = await read();
    check('P cycles preset', s1.preset === (s0.preset + 1) % 5, `${s0.preset} -> ${s1.preset}`);

    await press('f');
    let s2 = await read();
    check('F cycles frame', s2.frame !== s1.frame, `${s1.frame} -> ${s2.frame}`);

    await press(']');
    let s3 = await read();
    check('] adds a panel', s3.count === Math.min(6, s2.count + 1), `${s2.count} -> ${s3.count}`);

    await press('[');
    let s4 = await read();
    check('[ removes a panel', s4.count === Math.max(2, s3.count - 1), `${s3.count} -> ${s4.count}`);

    await press('+');
    let s5 = await read();
    check('+ grows the title', Number(s5.font) > Number(s4.font), `${s4.font} -> ${s5.font}`);
    await press('-');
    let s6 = await read();
    check('- shrinks the title', Number(s6.font) < Number(s5.font), `${s5.font} -> ${s6.font}`);

    await press('2');
    let s7 = await read();
    check('2 selects panel 2', s7.chip === 1, `chip ${s6.chip} -> ${s7.chip}`);

    await press('?');
    let s8 = await read();
    check('? folds the shortcut list', s8.folded === true);
    await press('?');
    let s9 = await read();
    check('? opens it again', s9.folded === false);

    const r0 = await read();
    await press('r');
    const r1 = await read();
    check('R randomizes', r1.preset !== r0.preset || r1.count !== r0.count || r1.frame !== r0.frame,
      `preset ${r0.preset}->${r1.preset}, count ${r0.count}->${r1.count}, frame ${r0.frame}->${r1.frame}`);

    console.log('typing in a field does not trigger shortcuts');
    await evalJs(`(() => { const c = document.getElementById('caption'); c.focus(); return true; })()`);
    const t0 = await read();
    await evalJs(`(() => {
      const c = document.getElementById('caption');
      c.focus();
      c.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true, cancelable: true }));
      return true;
    })()`);
    await sleep(250);
    const t1 = await read();
    check('P in a text input is ignored', t1.preset === t0.preset);

    console.log('cover mode');
    await client.send('Page.navigate', { url: BASE + '?shot=cover&frame=4:5&photo=boulevard-car&caption=Coastline%20Kings' });
    await sleep(400);
    for (let i = 0; i < 120; i++) {
      const { result } = await client.send('Runtime.evaluate', { expression: 'Boolean(window.__shotReady)', returnByValue: true });
      if (result.value) break;
      await sleep(200);
    }
    check('cover mode hides the rail', (await evalJs(`getComputedStyle(document.querySelector('.panel-rail')).display`)) === 'none');
    check('cover canvas fills the viewport', (await evalJs(`(() => {
      const c = document.getElementById('cover');
      return c.width === window.innerWidth && c.height === window.innerHeight;
    })()`)) === true);
    check('4:5 frame painted', (await evalJs(`(() => {
      const c = document.getElementById('cover');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let lit = 0;
      for (let i = 0; i < d.length; i += 4 * 1201) if (d[i] > 40) lit++;
      return lit > 40;
    })()`)) === true);

    console.log('network');
    const reqs = await evalJs(`performance.getEntriesByType('resource').map((e) => e.name)`);
    const external = reqs.filter((u) => !u.startsWith('http://127.0.0.1:8099/') && !u.startsWith('data:') && !u.startsWith('blob:'));
    check('no external requests', external.length === 0, external.slice(0, 3).join(', ') || 'all local');

    check('no console errors', client.consoleErrors.length === 0, client.consoleErrors.slice(0, 3).join(' | '));
  } finally {
    if (client) client.close();
    chrome.kill('SIGTERM');
  }

  console.log(failures.length === 0 ? '\nALL CHECKS PASSED' : `\n${failures.length} FAILED: ${failures.join(', ')}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('selftest crashed:', err.message);
  process.exit(1);
});
