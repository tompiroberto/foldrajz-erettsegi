// Writes the per-batch work lists the content generators use (review/content-lists/).
import fs from 'node:fs';
import { SUBTOPICS, TOPICS } from '../src/data/requirements.ts';
import { PROCESSES, DIAGRAMS, FLOW_ICONS } from '../src/content/catalog.ts';
import { TAGS } from '../src/content/tags.ts';

const concepts = JSON.parse(fs.readFileSync('starter-data/concepts.json', 'utf8'));
for (const t of Object.keys(TOPICS).map(Number)) {
  const groups = concepts.concepts.filter((g: { topicNo: number }) => g.topicNo === t);
  if (groups.length) fs.writeFileSync(`review/content-lists/concepts-${t}.json`, JSON.stringify(groups, null, 1));
  const subs = SUBTOPICS.filter((s) => s.topicNo === t).map((s) => ({ id: s.id, title: s.title, parents: s.parents, objectives: s.objectives.map((o) => ({ id: o.id, level: o.level, text: o.text })) }));
  fs.writeFileSync(`review/content-lists/objectives-${t}.json`, JSON.stringify(subs, null, 1));
}
fs.writeFileSync('review/content-lists/catalog.json', JSON.stringify({ processes: PROCESSES, diagrams: DIAGRAMS, flowIcons: FLOW_ICONS, tags: TAGS.map((t) => t.tag) }, null, 1));
console.log('ok');
