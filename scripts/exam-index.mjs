// Writes src/content/exams-index.json: a small summary of every past exam task
// (for search, topic counts and filters), so the full papers can load lazily.
//   node scripts/exam-index.mjs
import fs from 'node:fs';

const dir = 'src/content/exams';
const ORDER = { februar: 1, tavasz: 2, osz: 3 };
const exams = fs
  .readdirSync(dir)
  .filter((f) => /^\d{4}_.+\.json$/.test(f))
  .map((f) => JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')))
  .sort((a, b) => b.year - a.year || ORDER[b.season] - ORDER[a.season]);

const excerpt = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s);
const index = exams.map((e) => ({
  id: e.id,
  year: e.year,
  season: e.season,
  date: e.date,
  label: e.label,
  files: e.files,
  sourceUrl: e.sourceUrl,
  totalPoints: e.totalPoints ?? e.tasks.reduce((a, t) => a + t.points, 0),
  tasks: e.tasks.map((t) => ({
    no: t.no,
    title: t.title,
    points: t.points,
    needsFigure: !!t.needsFigure,
    subtopics: t.subtopics ?? [],
    concepts: t.concepts ?? [],
    places: t.places ?? [],
    auto: t.parts.filter((p) => p.autoCheck).length,
    parts: t.parts.length,
    text: excerpt([t.context, ...t.parts.map((p) => p.prompt)].filter(Boolean).join(" "), 140),
  })),
}));
fs.writeFileSync('src/content/exams-index.json', JSON.stringify(index));
console.log(`exams-index.json: ${index.length} exams, ${index.reduce((a, e) => a + e.tasks.length, 0)} tasks, ${(fs.statSync('src/content/exams-index.json').size / 1024).toFixed(0)} kB`);
