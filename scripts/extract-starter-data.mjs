// Builds starter-data/{topography,concepts,requirements}.json from the official
// list in starter-data/source/ADATOK_minden_megtanulando_elem.md.
// The output schema matches the JSON files handed over with the brief.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const md = readFileSync(join(root, 'starter-data/source/ADATOK_minden_megtanulando_elem.md'), 'utf8');

const SOURCE = 'Földrajz részletes érettségi vizsgakövetelmény (2024-től), Oktatási Hivatal';
const TOPICS = {
  1: 'Tájékozódás a földrajzi térben',
  2: 'Tájékozódás a kozmikus térben és az időben',
  3: 'A geoszférák földrajza',
  4: 'A geoszférák kölcsönhatásai, a földrajzi övezetesség',
  5: 'Átalakuló települések, eltérő demográfiai problémák a 21. században',
  6: 'A nemzetgazdaságtól a globális világgazdaságig',
  7: 'Magyarország – helyünk a Kárpát-medencében és Európában',
  8: 'Európa földrajza',
  9: 'Az Európán kívüli kontinensek földrajza',
  10: 'Helyi problémák, globális kihívások, a fenntartható jövő dilemmái',
};

// Same slug rule as the original ids: only Hungarian accents are folded,
// every other non-ASCII letter becomes a separator (Rhône → rh-ne).
const HU = { á: 'a', é: 'e', í: 'i', ó: 'o', ö: 'o', ő: 'o', ú: 'u', ü: 'u', ű: 'u' };
export function slug(s) {
  return s
    .toLowerCase()
    .replace(/[áéíóöőúüű]/g, (c) => HU[c])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const parts = md.split(/^## /m);
const topoPart = parts.find((p) => p.startsWith('1. rész'));
const conceptPart = parts.find((p) => p.startsWith('2. rész'));
const reqPart = parts.find((p) => p.startsWith('3. rész'));

const splitItems = (s) => s.split(';').map((x) => x.trim()).filter(Boolean);
const level = (s) => (s.endsWith('[E]') ? 'emelt' : 'kozep');
const strip = (s) => s.replace(/\s*\[E\]$/, '').trim();

// --- topography ---
const items = [];
let region = null;
let regionNo = 0;
for (const line of topoPart.split('\n')) {
  const h = line.match(/^### (.+)$/);
  if (h) { region = h[1].trim(); regionNo++; continue; }
  const m = line.match(/^- \*\*(.+?)\*\* \((\d+)\): (.+)$/);
  if (!m) continue;
  const [, category, n, list] = m;
  const names = splitItems(list);
  if (names.length !== Number(n)) throw new Error(`${region}/${category}: ${names.length} != ${n}`);
  for (const raw of names) {
    const name = strip(raw);
    items.push({
      id: `${slug(region)}--${slug(category)}--${slug(name)}`,
      name, region, regionNo, category, level: level(raw),
    });
  }
}
const ids = new Set(items.map((i) => i.id));
if (ids.size !== items.length) throw new Error('duplicate topography ids');

// --- concepts ---
const concepts = [];
let topicNo = 0;
for (const line of conceptPart.split('\n')) {
  const h = line.match(/^### (\d+)\./);
  if (h) { topicNo = Number(h[1]); continue; }
  const m = line.match(/^- \*\*(.+?)\*\*: (.+)$/);
  if (!m) continue;
  const all = splitItems(m[2]);
  concepts.push({
    topicNo,
    subtopic: m[1].trim(),
    kozep: all.filter((x) => level(x) === 'kozep').map(strip),
    emelt: all.filter((x) => level(x) === 'emelt').map(strip),
  });
}
const conceptCount = concepts.reduce((a, c) => a + c.kozep.length + c.emelt.length, 0);

// --- requirements ---
const requirements = [];
let cur = null;
topicNo = 0;
for (const line of reqPart.split('\n')) {
  const h = line.match(/^### (\d+)\./);
  if (h) { topicNo = Number(h[1]); continue; }
  const sub = line.match(/^\*\*(.+)\*\*$/);
  if (sub) {
    cur = { topicNo, subtopic: sub[1].trim(), kozep: [], emelt: [] };
    requirements.push(cur);
    continue;
  }
  const it = line.match(/^- (\[E\] )?(.+)$/);
  if (it && cur) (it[1] ? cur.emelt : cur.kozep).push(it[2].trim());
}

const write = (f, data) =>
  writeFileSync(join(root, 'starter-data', f), JSON.stringify(data, null, 1) + '\n', 'utf8');

write('topography.json', { _source: SOURCE, levels: { kozep: 'középszint', emelt: 'emelt szint (csak emelten kell)' }, count: items.length, items });
write('concepts.json', { topics: TOPICS, concepts, count: conceptCount });
write('requirements.json', { topics: TOPICS, requirements });

const reqCount = requirements.reduce((a, r) => a + r.kozep.length + r.emelt.length, 0);
console.log(`topography: ${items.length}, concepts: ${conceptCount}, requirement sentences: ${reqCount} in ${requirements.length} subtopics`);
if (items.length !== 802) throw new Error('expected 802 topography items');
if (conceptCount !== 1025) throw new Error('expected 1025 concepts');
