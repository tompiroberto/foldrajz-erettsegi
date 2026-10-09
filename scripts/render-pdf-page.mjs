// Renders pages of the downloaded exam PDFs to PNG (for checking answers that the
// text extraction lost: underlining, X marks, diagrams). Needs the dev server on :5173.
//   node scripts/render-pdf-page.mjs <file.pdf> <page>[,<page>…] [outDir]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [file, pagesArg, outDir = 'review/pages'] = process.argv.slice(2);
if (!file || !pagesArg) {
  console.error('usage: node scripts/render-pdf-page.mjs <file.pdf> <page>[,<page>] [outDir]');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const pages = pagesArg.split(',').map(Number);

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
await page.goto('http://localhost:5173/');
for (const n of pages) {
  const dataUrl = await page.evaluate(
    async ({ file, n }) => {
      const lib = await import('/node_modules/pdfjs-dist/build/pdf.mjs');
      lib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';
      const doc = await lib.getDocument({ url: `/exams/${file}` }).promise;
      const p = await doc.getPage(n);
      const vp = p.getViewport({ scale: 1.6 });
      const c = document.createElement('canvas');
      c.width = vp.width;
      c.height = vp.height;
      await p.render({ canvas: c, viewport: vp }).promise;
      return c.toDataURL('image/png');
    },
    { file, n },
  );
  const out = join(outDir, `${file.replace(/\.pdf$/, '')}_p${n}.png`);
  const { writeFileSync } = await import('node:fs');
  writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(out);
}
await browser.close();
