// Downloads every advanced-level (emelt szintű) Hungarian-language geography written
// exam paper and its marking guide from oktatas.hu, newest first, and writes
// docs/erettsegi-feladatsorok/INDEX.md. Re-running skips files already present.
//
//   node scripts/fetch-exams.mjs
import { mkdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/erettsegi-feladatsorok');
mkdirSync(outDir, { recursive: true });

const BASE = 'https://www.oktatas.hu';
const INDEX_URL = `${BASE}/kozneveles/erettsegi/feladatsorok`;
const UA = { 'User-Agent': 'Mozilla/5.0 (foldrajz-erettsegi study app; personal use)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: UA, redirect: 'follow' });
      if (res.ok) return res;
      if (res.status === 404) return null;
    } catch {
      /* retry */
    }
    await sleep(1500 * (i + 1));
  }
  return null;
}
const text = async (url) => (await get(url))?.text() ?? '';
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));

// "emelt_szint_2024tavasz", "emeltszint_2011osz", "emelt_szint_2008majus", "emelt_szint_2006februar"
function parsePeriod(slug) {
  const m = slug.match(/(\d{4})(tavasz|osz|majus|oktober|februar)$/);
  if (!m) return null;
  const year = Number(m[1]);
  const season = { tavasz: 'tavasz', majus: 'tavasz', osz: 'osz', oktober: 'osz', februar: 'februar' }[m[2]];
  return { year, season };
}
const SEASON_ORDER = { tavasz: 2, februar: 1, osz: 3 };
const SEASON_LABEL = { tavasz: 'tavasz (május–június)', osz: 'ősz (október–november)', februar: 'február (rendkívüli)' };

// Hungarian-language paper only: e_fldr_… (2020s) or e_foldr_… (older). Excludes
// e_fldrma/e_fldrang/e_fldrnem (foreign-language versions).
const GEO = /\/e_f(?:o|ö)?ldr_[^/"]*\.(pdf|zip)$/i;

const index = await text(INDEX_URL);
const periods = [...new Set(hrefs(index).filter((h) => /\/feladatsorok\/emelt_?szint_\d{4}/.test(h)))]
  .map((h) => ({ path: h.replace(/\/$/, ''), ...parsePeriod(h.replace(/\/$/, '')) }))
  .filter((p) => p.year)
  .sort((a, b) => b.year - a.year || SEASON_ORDER[b.season] - SEASON_ORDER[a.season]);

console.log(`${periods.length} emelt szintű időszak`);
const rows = [];

for (const p of periods) {
  const pageUrl = BASE + p.path;
  const html = await text(pageUrl);
  const pages = [pageUrl, ...new Set(hrefs(html).filter((h) => h.startsWith(p.path + '/')).map((h) => BASE + h))];
  const found = new Map(); // url -> source page
  for (const pg of pages) {
    const h = pg === pageUrl ? html : await text(pg);
    for (const link of hrefs(h)) {
      if (GEO.test(link)) found.set(link.startsWith('http') ? link : BASE + link, pg);
    }
    if (pg !== pageUrl) await sleep(300);
    if (found.size >= 2 && [...found.keys()].some((u) => /_ut\./.test(u))) break;
  }
  const links = [...found.keys()];
  const fl = links.filter((u) => /_fl\d*\.pdf$/i.test(u));
  const ut = links.filter((u) => /_ut\d*\.pdf$/i.test(u));
  const extra = links.filter((u) => !fl.includes(u) && !ut.includes(u));
  const base = `foldrajz_emelt_${p.year}_${p.season}`;
  const row = { ...p, pageUrl, dayPage: found.get(fl[0] ?? ut[0]) ?? pageUrl, fl, ut, extra, files: {} };

  const save = async (url, name) => {
    const dest = join(outDir, name);
    if (existsSync(dest) && statSync(dest).size > 1000) return name;
    const res = await get(url);
    if (!res) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.subarray(0, 4).toString() !== '%PDF' && !name.endsWith('.zip')) return null;
    writeFileSync(dest, buf);
    await sleep(300);
    return name;
  };
  // Some sessions split the paper into several PDFs; number them if so.
  for (const [i, u] of fl.entries()) row.files[u] = await save(u, `${base}_feladatlap${fl.length > 1 ? `_${i + 1}` : ''}.pdf`);
  for (const [i, u] of ut.entries()) row.files[u] = await save(u, `${base}_utmutato${ut.length > 1 ? `_${i + 1}` : ''}.pdf`);
  for (const u of extra) row.files[u] = await save(u, `${base}_forras_${u.split('/').pop()}`);
  rows.push(row);
  console.log(`${p.year} ${p.season}: fl=${fl.length} ut=${ut.length} extra=${extra.length}`);
}

const ok = (arr, r) => arr.length > 0 && arr.every((u) => r.files[u]);
const md = [
  '# Emelt szintű földrajz írásbeli feladatsorok',
  '',
  `Forrás: [oktatas.hu – Érettségi feladatsorok](${INDEX_URL}) (Oktatási Hivatal). Letöltve: ${new Date().toISOString().slice(0, 10)}.`,
  'Csak a magyar nyelvű feladatsorok (az idegen nyelvű változatok nincsenek letöltve).',
  '',
  '| Év | Időszak | Feladatlap | Útmutató | Mindkettő megvan | Eredeti oldal |',
  '|---|---|---|---|---|---|',
  ...rows.map((r) => {
    const f = r.fl.map((u) => `[${r.files[u] ?? 'hiányzik'}](${u})`).join('<br>') || '—';
    const g = r.ut.map((u) => `[${r.files[u] ?? 'hiányzik'}](${u})`).join('<br>') || '—';
    const both = ok(r.fl, r) && ok(r.ut, r) ? '✅ igen' : '❌ nem';
    return `| ${r.year} | ${SEASON_LABEL[r.season]} | ${f} | ${g} | ${both} | [link](${r.dayPage}) |`;
  }),
  '',
  `Összesen ${rows.length} időszak, ebből mindkét fájl megvan: ${rows.filter((r) => ok(r.fl, r) && ok(r.ut, r)).length}.`,
  '',
];
writeFileSync(join(outDir, 'INDEX.md'), md.join('\n'), 'utf8');
writeFileSync(join(outDir, 'index.json'), JSON.stringify(rows, null, 1), 'utf8');
console.log('INDEX.md kész');
