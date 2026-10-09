// Writes review/exam-status.md: per exam paper, the tasks that need a human check
// (notes from the structuring step, answers not auto-checkable, figure-dependent tasks).
//   node scripts/exam-report.mjs
import fs from 'node:fs';

const dir = 'src/content/exams';
const index = JSON.parse(fs.readFileSync('docs/erettsegi-feladatsorok/index.json', 'utf8'));
const files = new Map(fs.readdirSync(dir).filter((f) => /^\d{4}_.+\.json$/.test(f)).map((f) => [f.replace('.json', ''), f]));

const lines = [
  '# Érettségi feladatsorok – feldolgozási állapot',
  '',
  'A feladatok szövege és megoldása az eredeti PDF-ekből származik; a strukturálás (részekre bontás, típus, hozzárendelés) gépi.',
  'Az alábbi „Ellenőrizendő” pontoknál a megoldás a szövegkivonatból nem volt egyértelműen kiolvasható – nézd meg az eredeti útmutatóban.',
  '',
  '| Időszak | Állapot | Feladat | Pont | Ábrás feladat | Gépi ellenőrzés | Ellenőrizendő |',
  '|---|---|---|---|---|---|---|',
];
const details = [];
let done = 0;
for (const r of index) {
  const key = `${r.year}_${r.season}`;
  const f = files.get(key);
  if (!f) {
    lines.push(`| ${r.year} ${r.season} | ⏳ feldolgozásra vár | – | – | – | – | – |`);
    continue;
  }
  done++;
  const e = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'));
  const parts = e.tasks.flatMap((t) => t.parts);
  const notes = e.tasks.filter((t) => t.note);
  lines.push(
    `| ${e.label} | ✅ kész | ${e.tasks.length} | ${e.tasks.reduce((a, t) => a + t.points, 0)} | ${e.tasks.filter((t) => t.needsFigure).length} | ${parts.filter((p) => p.autoCheck).length}/${parts.length} rész | ${notes.length} |`,
  );
  if (notes.length) {
    details.push(`\n## ${e.label}\n`);
    for (const t of notes) details.push(`- **${t.no}. feladat (${t.title})**: ${t.note}`);
  }
}
lines.push('', `Feldolgozva: ${done} / ${index.length} időszak.`, '', '# Ellenőrizendő részletek', ...details, '');
fs.mkdirSync('review', { recursive: true });
fs.writeFileSync('review/exam-status.md', lines.join('\n'));
console.log(`review/exam-status.md: ${done}/${index.length} kész`);
