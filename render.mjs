// usage: node render.mjs <outdir> <frames: "0-299" or "5,40,120" or "0-50,200"> [--scale=0.5]
// env: WORKERS=2 (parallel browser tabs), RESUME=1 (skip existing), GPU=1 (use graphics card instead of CPU WebGL)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root = path.dirname(fileURLToPath(import.meta.url));
const [outDir = 'frames', spec = '0-299', ...rest] = process.argv.slice(2);
const scale = parseFloat((rest.find((a) => a.startsWith('--scale=')) || '--scale=1').split('=')[1]);
const workers = Math.max(1, parseInt(process.env.WORKERS || '2'));
const frames = spec.split(',').flatMap((p) => { const [a, b] = p.split('-').map(Number); return b === undefined ? [a] : Array.from({ length: b - a + 1 }, (_, i) => a + i); });
fs.mkdirSync(outDir, { recursive: true });
const name = (f) => path.join(outDir, `f${String(f).padStart(4, '0')}.jpg`);
const todo = frames.filter((f) => !(process.env.RESUME && fs.existsSync(name(f))));
if (!fs.existsSync(path.join(root, 'node_modules/three/build/three.module.js'))) { console.error('three.js is missing. Run: npm install'); process.exit(1); }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/favicon')) { res.writeHead(204); return res.end(); }
  const p = path.normalize(path.join(root, decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const pagePath = fs.existsSync(path.join(root, 'web/index.html')) ? '/web/index.html' : '/index.html';
const url = `http://127.0.0.1:${server.address().port}${pagePath}?scale=${scale}`;

const args = process.env.GPU ? ['--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args });
const t0 = Date.now(); let done = 0;
async function worker(id) {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('pageerror', (e) => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });
  page.on('console', (m) => console.log(`[browser ${m.type()}]`, m.text()));
  page.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
  page.on('requestfailed', (r) => console.log('REQUEST FAILED', r.url(), r.failure()?.errorText));
  await page.goto(url);
  try { await page.waitForFunction('window.ready===true', null, { timeout: 60000 }); }
  catch (e) {
    const st = await page.evaluate(() => ({ ready: window.ready, scripts: [...document.scripts].map((x) => x.src || 'inline'), canvases: document.querySelectorAll('canvas').length })).catch((x) => String(x));
    console.error('PAGE NEVER BECAME READY. State:', JSON.stringify(st), '\nURL:', url);
    for (const f of ['web/index.html', 'web/main.js', 'web/story.js', 'web/paint.js', 'web/baker.js', 'node_modules/three/build/three.module.js']) console.error(f, fs.existsSync(path.join(root, f)) ? 'exists' : 'MISSING');
    process.exit(1);
  }
  for (let i = id; i < todo.length; i += workers) {
    const f = todo[i];
    const data = await page.evaluate((fr) => { window.renderFrame(fr); return document.querySelector('canvas').toDataURL('image/jpeg', 0.95); }, f);
    fs.writeFileSync(name(f), Buffer.from(data.split(',')[1], 'base64'));
    done++;
    if (done % 5 === 0 || done === todo.length) { const el = (Date.now() - t0) / 1000, eta = (el / done) * (todo.length - done); console.log(`${done}/${todo.length} frames  ${el.toFixed(0)}s elapsed  ~${eta.toFixed(0)}s left`); }
  }
  await page.close();
}
console.log(`Rendering ${todo.length} frame(s) at scale ${scale} with ${workers} worker(s), ${process.env.GPU ? 'GPU' : 'CPU'} WebGL -> ${outDir}/`);
await Promise.all(Array.from({ length: workers }, (_, i) => worker(i)));
await browser.close(); server.close();
console.log('Done.');
