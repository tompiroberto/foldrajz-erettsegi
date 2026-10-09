// Screenshots one diagram at every step: node scripts/shot-diagram.mjs <key> [steps]
// Needs the dev server on :5173. Images: review/shots/diagram-<key>-<step>.png
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const [key, stepsArg = '1'] = process.argv.slice(2);
mkdirSync('review/shots', { recursive: true });
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 760, height: 900 } });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
for (let s = 0; s < Number(stepsArg); s++) {
  for (const theme of ['light', 'dark']) {
    await p.emulateMedia({ colorScheme: theme });
    await p.goto(`http://localhost:5173/elmelet/abrak?d=${key}&step=${s}`);
    await p.waitForTimeout(1200);
    const el = p.locator(`[data-diagram="${key}"]`);
    await el.screenshot({ path: `review/shots/diagram-${key}-${s}-${theme}.png` });
  }
}
console.log(errors.length ? `errors: ${errors.join(' | ')}` : 'ok');
await b.close();
