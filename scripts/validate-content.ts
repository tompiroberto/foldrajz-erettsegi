// Validates generated content against src/content/README.md.
//   npx tsx scripts/validate-content.ts [concepts|cards|processes|places] [file …]
import fs from 'node:fs';
import path from 'node:path';
import { OBJECTIVES } from '../src/data/requirements.ts';
import { PROCESSES, DIAGRAMS, FLOW_ICONS } from '../src/content/catalog.ts';
import { TAG_SET } from '../src/content/tags.ts';

const kind = process.argv[2] ?? 'all';
const only = process.argv.slice(3).map((f) => path.resolve(f));
const concepts = JSON.parse(fs.readFileSync('starter-data/concepts.json', 'utf8'));
const LABELS = new Set<string>(concepts.concepts.flatMap((g: { kozep: string[]; emelt: string[] }) => [...g.kozep, ...g.emelt]));
const OBJ = new Map(OBJECTIVES.map((o) => [o.id, o]));
const PROC = new Map(PROCESSES.map((p) => [p.id, p]));
const PLACES = new Set((JSON.parse(fs.readFileSync('starter-data/topography.json', 'utf8')).items as { id: string }[]).map((i) => i.id));
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

let errors = 0;
let warnings = 0;
const err = (f: string, m: string) => (errors++, console.log(`✕ ${f}: ${m}`));
const warn = (f: string, m: string) => (warnings++, console.log(`! ${f}: ${m}`));
const files = (dir: string) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f)).filter((f) => !only.length || only.includes(path.resolve(f))) : [];
const read = (f: string) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {
    err(f, `JSON hiba: ${(e as Error).message}`);
    return null;
  }
};

if (kind === 'all' || kind === 'concepts') {
  const covered = new Set<string>();
  const ids = new Map<string, string>();
  const related: [string, string, string][] = [];
  for (const f of files('src/content/concepts')) {
    const d = read(f);
    if (!d) continue;
    for (const e of d.entries ?? []) {
      const at = `${path.basename(f)} ${e.id}`;
      if (!e.id || !/^[a-z0-9-]+$/.test(e.id)) err(at, 'érvénytelen id');
      if (ids.has(e.id)) err(at, `id már létezik (${ids.get(e.id)})`);
      ids.set(e.id, path.basename(f));
      if (!e.term || !e.definition) err(at, 'term/definition hiányzik');
      if (e.definition && words(e.definition) > 90) warn(at, 'túl hosszú definíció');
      for (const l of e.sourceLabels ?? []) {
        if (!LABELS.has(l)) err(at, `nem hivatalos címke: "${l}"`);
        covered.add(l);
      }
      if (!e.sourceLabels?.length && !e.parent) err(at, 'nincs sourceLabels (és nem al-szócikk)');
      const tags = e.tags ?? [];
      if (tags.length < 2 || tags.length > 5) warn(at, `${tags.length} hashtag`);
      for (const t of tags) if (!TAG_SET.has(t)) err(at, `ismeretlen hashtag: ${t}`);
      for (const p of e.examplePlaces ?? []) if (!PLACES.has(p)) err(at, `ismeretlen hely: ${p}`);
      for (const r of e.related ?? []) related.push([at, r, f]);
      if (e.generated !== true) err(at, 'generated: true hiányzik');
    }
  }
  if (!only.length) {
    const missing = [...LABELS].filter((l) => !covered.has(l));
    if (missing.length) err('concepts', `${missing.length} hivatalos címke nincs lefedve: ${missing.slice(0, 15).join(' | ')}${missing.length > 15 ? ' …' : ''}`);
    let bad = 0;
    for (const [, r] of related) if (!ids.has(r)) bad++;
    if (bad) warn('concepts', `${bad} related hivatkozás nem létező szócikkre mutat`);
    console.log(`fogalmak: ${ids.size} szócikk, ${covered.size}/${LABELS.size} címke lefedve`);
  }
}

if (kind === 'all' || kind === 'cards') {
  const seen = new Set<string>();
  for (const f of files('src/content/cards')) {
    const d = read(f);
    if (!d) continue;
    for (const c of d.cards ?? []) {
      const at = `${path.basename(f)} ${c.objectiveId}`;
      if (!OBJ.has(c.objectiveId)) err(at, 'ismeretlen objectiveId');
      if (seen.has(c.objectiveId)) err(at, 'kétszer szerepel');
      seen.add(c.objectiveId);
      const w = words(c.explanation ?? '');
      if (w < 60 || w > 240) warn(at, `magyarázat ${w} szó`);
      if (c.diagram && !DIAGRAMS[c.diagram]) err(at, `ismeretlen ábra: ${c.diagram}`);
      for (const l of c.concepts ?? []) if (!LABELS.has(l)) err(at, `nem hivatalos fogalom: "${l}"`);
      for (const p of c.processes ?? []) if (!PROC.has(p)) err(at, `ismeretlen folyamat: ${p}`);
      if (!c.examTip) err(at, 'nincs vizsgatipp');
      if (!c.selfCheck || c.selfCheck.length < 2) err(at, 'kevés önellenőrző kérdés');
      const tf = c.trueFalse ?? [];
      if (tf.length < 2 || !tf.some((x: { true: boolean }) => x.true) || !tf.some((x: { true: boolean; correction?: string }) => !x.true && x.correction)) err(at, 'trueFalse: kell egy igaz és egy javított hamis');
    }
  }
  if (!only.length) {
    const missing = [...OBJ.keys()].filter((id) => !seen.has(id));
    if (missing.length) err('cards', `${missing.length} követelményhez nincs kártya (pl. ${missing.slice(0, 5).join(', ')})`);
    console.log(`kártyák: ${seen.size}/${OBJ.size}`);
  }
}

if (kind === 'all' || kind === 'processes') {
  const seen = new Set<string>();
  for (const f of files('src/content/processes')) {
    const p = read(f);
    if (!p) continue;
    const at = path.basename(f);
    const def = PROC.get(p.id);
    if (!def) {
      err(at, `ismeretlen folyamat id: ${p.id}`);
      continue;
    }
    seen.add(p.id);
    for (const k of ['causes', 'course', 'consequences', 'steps', 'examples', 'concepts']) if (!Array.isArray(p[k]) || !p[k].length) err(at, `${k} hiányzik`);
    if (def.outline) {
      if (p.steps?.length !== def.outline.length) err(at, `${def.outline.length} lépés kell (outline), ${p.steps?.length} van`);
      def.outline.forEach((t, i) => p.steps?.[i]?.title !== t && err(at, `${i + 1}. lépés címe nem az outline szerinti: "${p.steps?.[i]?.title}"`));
    } else {
      if (!p.steps || p.steps.length < 4 || p.steps.length > 8) err(at, `4–8 lépés kell, ${p.steps?.length} van`);
      for (const s of p.steps ?? []) if (!FLOW_ICONS.includes(s.icon)) err(at, `ismeretlen ikon: ${s.icon}`);
    }
    for (const l of p.concepts ?? []) if (!LABELS.has(l)) err(at, `nem hivatalos fogalom: "${l}"`);
    for (const e of p.examples ?? []) for (const pl of e.places ?? []) if (!PLACES.has(pl)) err(at, `ismeretlen hely: ${pl}`);
    if (!p.essay?.prompt || !p.essay?.elements?.length || !p.essay?.modelAnswer) err(at, 'essay hiányos');
  }
  if (!only.length) console.log(`folyamatok: ${seen.size}/${PROC.size}${seen.size < PROC.size ? ` (hiányzik: ${[...PROC.keys()].filter((k) => !seen.has(k)).join(', ')})` : ''}`);
}

if (kind === 'all' || kind === 'places') {
  const seen = new Set<string>();
  for (const f of files('src/content/places-facts')) {
    const d = read(f);
    if (!d) continue;
    for (const [id, x] of Object.entries(d.facts ?? {}) as [string, { fekves: string; facts: string[]; concepts?: string[]; processes?: string[] }][]) {
      const at = `${path.basename(f)} ${id}`;
      if (!PLACES.has(id)) err(at, 'ismeretlen hely');
      seen.add(id);
      if (!x.fekves) err(at, 'nincs fekvés');
      if (!x.facts?.length || x.facts.length > 4) warn(at, `${x.facts?.length ?? 0} tény`);
      for (const l of x.concepts ?? []) if (!LABELS.has(l)) err(at, `nem hivatalos fogalom: "${l}"`);
      for (const p of x.processes ?? []) if (!PROC.has(p)) err(at, `ismeretlen folyamat: ${p}`);
    }
  }
  if (!only.length) console.log(`helyek: ${seen.size}/${PLACES.size}`);
}

console.log(`\n${errors} hiba, ${warnings} figyelmeztetés`);
process.exit(errors ? 1 : 0);
