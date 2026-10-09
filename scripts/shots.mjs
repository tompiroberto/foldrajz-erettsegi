// Screenshots of key pages for visual review (needs the dev server on :5173).
//   node scripts/shots.mjs [path ...]
import { chromium, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('review/shots', { recursive: true });
const paths = process.argv.slice(2);
const list = paths.length ? paths.map((p) => [p.replace(/[^a-z0-9]+/gi, '_'), p, { viewport: { width: 1440, height: 900 } }]) : [
  ['map-hu', '/topografia/terkep?regio=Magyarorsz%C3%A1g', { viewport: { width: 1440, height: 900 } }],
  ['map-world', '/topografia/terkep?regio=F%C3%B6ld', { viewport: { width: 1440, height: 900 } }],
  ['map-europe-labels', '/topografia/terkep?regio=Eur%C3%B3pa', { viewport: { width: 1440, height: 900 } }],
  ['map-mobile', '/topografia/terkep?regio=Magyarorsz%C3%A1g', { ...devices['Pixel 7'] }],
];
const b = await chromium.launch({ channel: 'msedge' });
for (const [name, path, opts] of list) {
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto('http://localhost:5173' + path);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `review/shots/${name}.png` });
  console.log(name, errors.length ? errors.slice(0, 3) : 'ok');
  await ctx.close();
}
await b.close();
