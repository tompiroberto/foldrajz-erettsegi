// Validates src/content/exams/*.json against docs/erettsegi-feladatsorok/_schema.md.
//   node scripts/validate-exams.mjs [file …]
import fs from 'node:fs';
import path from 'node:path';

const dir = 'src/content/exams';
const ref = fs.readFileSync('docs/erettsegi-feladatsorok/_hivatkozasok.md', 'utf8');
const subtopicIds = new Set([...ref.matchAll(/^- ([a-z0-9-]+) — /gm)].map((m) => m[1]));
const concepts = JSON.parse(fs.readFileSync('starter-data/concepts.json', 'utf8'));
const conceptLabels = new Set(concepts.concepts.flatMap((g) => [...g.kozep, ...g.emelt]));
const placeIds = new Set(JSON.parse(fs.readFileSync('starter-data/topography.json', 'utf8')).items.map((i) => i.id));
const TYPES = new Set(['true-false', 'multiple-choice', 'select-many', 'matching', 'ordering', 'short-answer', 'calculation', 'essay', 'map', 'table', 'diagram']);

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(dir).filter((f) => /^\d{4}_.+\.json$/.test(f)).map((f) => path.join(dir, f));

let errors = 0;
let warnings = 0;
for (const f of files) {
  const err = (m) => { errors++; console.log(`✕ ${path.basename(f)}: ${m}`); };
  const warn = (m) => { warnings++; console.log(`! ${path.basename(f)}: ${m}`); };
  let e;
  try { e = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (x) { err(`JSON hiba: ${x.message}`); continue; }
  for (const k of ['id', 'year', 'season', 'date', 'label', 'files', 'sourceUrl', 'tasks']) if (e[k] == null) err(`hiányzik: ${k}`);
  if (!Array.isArray(e.tasks) || !e.tasks.length) { err('nincs feladat'); continue; }
  let sum = 0;
  for (const t of e.tasks) {
    const at = `${t.no}. feladat`;
    if (!t.title || !t.parts?.length) err(`${at}: cím vagy részek hiányoznak`);
    if (!Array.isArray(t.pages) || !t.pages.length) err(`${at}: pages hiányzik`);
    for (const s of t.subtopics ?? []) if (!subtopicIds.has(s)) err(`${at}: ismeretlen alcím: ${s}`);
    if (!t.subtopics?.length) warn(`${at}: nincs alcím-hozzárendelés`);
    for (const c of t.concepts ?? []) if (!conceptLabels.has(c)) err(`${at}: nem hivatalos fogalom: "${c}"`);
    for (const p of t.places ?? []) if (!placeIds.has(p)) err(`${at}: ismeretlen helynév-id: ${p}`);
    let ps = 0;
    for (const p of t.parts ?? []) {
      if (!TYPES.has(p.type)) err(`${at} ${p.label}): ismeretlen típus ${p.type}`);
      if (!p.prompt) err(`${at} ${p.label}): üres prompt`);
      if (!p.solution) err(`${at} ${p.label}): nincs megoldás`);
      if (p.autoCheck && !(p.items?.length && p.items.every((i) => i.answer))) err(`${at} ${p.label}): autoCheck, de hiányzó items/answer`);
      ps += Number(p.points) || 0;
    }
    if (ps !== t.points && !t.note) warn(`${at}: részpontok összege ${ps} ≠ ${t.points}`);
    sum += Number(t.points) || 0;
  }
  if (e.totalPoints && sum !== e.totalPoints) warn(`feladatpontok összege ${sum} ≠ ${e.totalPoints}`);
  console.log(`✓ ${path.basename(f)}: ${e.tasks.length} feladat, ${sum} pont`);
}
console.log(`\n${files.length} fájl, ${errors} hiba, ${warnings} figyelmeztetés`);
process.exit(errors ? 1 : 0);
