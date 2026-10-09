// Writes docs/erettsegi-feladatsorok/_hivatkozasok.md: the subtopic ids, official concept
// labels and topography ids that exam tasks are mapped to.
import fs from 'node:fs';
import { SUBTOPICS } from '../src/data/requirements.ts';

const c = JSON.parse(fs.readFileSync('starter-data/concepts.json', 'utf8'));
const t = JSON.parse(fs.readFileSync('starter-data/topography.json', 'utf8'));
let md = '# Hivatkozási lista a feladatok hozzárendeléséhez\n\n## Alcímek (subtopicId → cím)\n\n';
for (const s of SUBTOPICS)
  md += `- ${s.id} — [${s.topicNo}] ${s.parents.length ? s.parents.join(' > ') + ' > ' : ''}${s.title}\n`;
md += '\n## Hivatalos fogalmak (pontosan így kell hivatkozni rájuk; ezek a concepts.json címkéi)\n\n';
for (const g of c.concepts) md += `- **${g.subtopic}**: ${[...g.kozep, ...g.emelt].join(' | ')}\n`;
md += '\n## Topográfiai nevek (id = név)\n\n';
for (const i of t.items) md += `${i.id} = ${i.name}\n`;
fs.writeFileSync('docs/erettsegi-feladatsorok/_hivatkozasok.md', md);
console.log(SUBTOPICS.length, 'subtopics');
for (const s of SUBTOPICS.filter((s) => /^(6\.1|10\.5)|Olasz|^3\.1\.2/.test(s.title)))
  console.log(s.title, '<-', s.parents.join(' > '), '|', s.objectives.filter((o) => /alkalmas|nehézség/.test(o.text)).map((o) => o.text).join(' || '));
