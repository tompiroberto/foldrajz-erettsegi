// Lazily imported search index over every searchable thing in both modes.
import Fuse from 'fuse.js';
import topo from '../../starter-data/topography.json';
import concepts from '../../starter-data/concepts.json';
import type { ConceptsFile, TopographyFile } from './types';
import { OBJECTIVES, SUBTOPICS } from './requirements';
import { aliasesOf, searchKey } from '@/lib/normalize';
import { EXAM_TASK_SUMMARIES } from './exams';

export type SearchKind = 'place' | 'concept' | 'objective' | 'exam';

export interface SearchDoc {
  kind: SearchKind;
  mode: 'topo' | 'theory' | 'exam';
  title: string;
  subtitle: string;
  to: string;
  key: string;
}

const docs: SearchDoc[] = [];

for (const i of (topo as TopographyFile).items) {
  docs.push({
    kind: 'place',
    mode: 'topo',
    title: i.name,
    subtitle: `${i.region} · ${i.category}${i.level === 'emelt' ? ' · EMELT' : ''}`,
    to: `/topografia/terkep?hely=${encodeURIComponent(i.id)}`,
    key: aliasesOf(i.name).map(searchKey).join(' | '),
  });
}

for (const g of (concepts as ConceptsFile).concepts) {
  for (const [level, list] of [['kozep', g.kozep], ['emelt', g.emelt]] as const) {
    for (const label of list) {
      docs.push({
        kind: 'concept',
        mode: 'theory',
        title: label,
        subtitle: `Fogalom · ${g.subtopic}${level === 'emelt' ? ' · EMELT' : ''}`,
        to: `/elmelet/fogalomtar?q=${encodeURIComponent(label)}`,
        key: searchKey(label),
      });
    }
  }
}

const subById = new Map(SUBTOPICS.map((s) => [s.id, s]));
for (const o of OBJECTIVES) {
  docs.push({
    kind: 'objective',
    mode: 'theory',
    title: o.text,
    subtitle: `Követelmény · ${subById.get(o.subtopicId)?.title ?? ''}`,
    to: `/elmelet/tananyag/${o.subtopicId}#${o.id}`,
    key: searchKey(o.text),
  });
}

for (const t of EXAM_TASK_SUMMARIES) {
  docs.push({
    kind: 'exam',
    mode: 'exam',
    title: `${t.source} – ${t.title}`,
    subtitle: 'Érettségi feladat',
    to: `/vizsga/feladatsor/${t.examId}#f${t.no}`,
    key: searchKey(`${t.title} ${t.text}`),
  });
}

const fuse = new Fuse(docs, {
  keys: [
    { name: 'key', weight: 0.8 },
    { name: 'title', weight: 0.2 },
  ],
  threshold: 0.32,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

export function search(query: string, limit = 30): SearchDoc[] {
  const q = searchKey(query);
  if (q.length < 2) return [];
  return fuse.search(q, { limit }).map((r) => r.item);
}

export const SEARCH_DOC_COUNT = docs.length;
