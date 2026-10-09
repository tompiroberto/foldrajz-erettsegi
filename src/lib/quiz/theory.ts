// Theory quiz question builder (brief §6.6), from the dictionary, the learning cards,
// the processes and the calculation generators.
import type { Card, ConceptEntry, ProcessContent } from '@/data/content';
import type { Objective } from '@/data/types';
import { PROCESSES } from '@/content/catalog';
import { GENERATORS } from '@/lib/calc/generators';

export type TheoryQType = 'fog-def' | 'def-fog' | 'igaz-hamis' | 'kakukk' | 'parositas' | 'sorrend' | 'abra' | 'szamolas' | 'magyarazd';

export const THEORY_QTYPE_LABEL: Record<TheoryQType, string> = {
  'fog-def': 'Fogalom → definíció (4 közül)',
  'def-fog': 'Definíció → fogalom (beírós)',
  'igaz-hamis': 'Igaz vagy hamis? (Mi a hiba?)',
  kakukk: 'Kakukktojás',
  parositas: 'Párosítás',
  sorrend: 'Folyamat sorbarendezése',
  abra: 'Ábraelemzés: melyik lépést látod?',
  szamolas: 'Számolós feladat',
  magyarazd: '„Magyarázd el!”',
};

export type TheoryQuestion =
  | { kind: 'fog-def'; entry: ConceptEntry; options: string[]; answer: string; key: string; topicNo: number; tags: string[] }
  | { kind: 'def-fog'; entry: ConceptEntry; key: string; topicNo: number; tags: string[] }
  | { kind: 'igaz-hamis'; statement: string; truth: boolean; correction?: string; objective: Objective; key: string; topicNo: number; tags: string[] }
  | { kind: 'kakukk'; options: ConceptEntry[]; odd: string; reason: string; key: string; topicNo: number; tags: string[] }
  | { kind: 'parositas'; pairs: { term: string; def: string; id: string }[]; key: string; topicNo: number; tags: string[] }
  | { kind: 'sorrend'; process: ProcessContent; key: string; topicNo: number; tags: string[] }
  | { kind: 'abra'; process: ProcessContent; diagram: string; step: number; options: string[]; key: string; topicNo: number; tags: string[] }
  | { kind: 'szamolas'; generator: string; seed: number; key: string; topicNo: number; tags: string[] }
  | { kind: 'magyarazd'; process: ProcessContent; key: string; topicNo: number; tags: string[] };

export interface TheoryPool {
  entries: ConceptEntry[];
  cards: { objective: Objective; card: Card }[];
  processes: ProcessContent[];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
const pickN = <T,>(arr: T[], n: number, rng: () => number) => shuffle(arr, rng).slice(0, n);

/** Short definition for options: first sentence, term itself masked. */
export function shortDef(e: ConceptEntry): string {
  const first = e.definition.split(/(?<=[.!?])\s/)[0] ?? e.definition;
  const re = new RegExp(e.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return first.replace(re, '…');
}

const procTopic = (id: string) => PROCESSES.find((p) => p.id === id)?.topicNo ?? 3;

export function buildTheoryQuiz(pool: TheoryPool, types: TheoryQType[], count: number, rng: () => number): TheoryQuestion[] {
  const usable = pool.entries.filter((e) => e.definition && e.term.length < 60);
  const out: TheoryQuestion[] = [];
  const order = shuffle(types, rng);
  let guard = 0;
  while (out.length < count && guard++ < count * 6) {
    const t = order[out.length % order.length]!;
    const q = make(t);
    if (q && !out.some((x) => x.key === q.key)) out.push(q);
  }
  return out;

  function make(t: TheoryQType): TheoryQuestion | null {
    switch (t) {
      case 'fog-def': {
        const e = pickN(usable, 1, rng)[0];
        if (!e) return null;
        const same = usable.filter((x) => x.id !== e.id && x.topicNo === e.topicNo && x.parent !== e.id && e.parent !== x.id);
        const wrong = pickN(same.length >= 3 ? same : usable.filter((x) => x.id !== e.id), 3, rng).map(shortDef);
        const answer = shortDef(e);
        return { kind: 'fog-def', entry: e, options: shuffle([answer, ...wrong], rng), answer, key: `concept:${e.id}`, topicNo: e.topicNo, tags: e.tags };
      }
      case 'def-fog': {
        const e = pickN(usable.filter((x) => x.term.split(' ').length <= 4), 1, rng)[0];
        return e ? { kind: 'def-fog', entry: e, key: `concept:${e.id}`, topicNo: e.topicNo, tags: e.tags } : null;
      }
      case 'igaz-hamis': {
        const c = pickN(pool.cards, 1, rng)[0];
        const tf = c && pickN(c.card.trueFalse, 1, rng)[0];
        if (!c || !tf) return null;
        return { kind: 'igaz-hamis', statement: tf.statement, truth: tf.true, correction: tf.correction, objective: c.objective, key: `card:${c.objective.id}:${tf.statement.slice(0, 20)}`, topicNo: c.objective.topicNo, tags: [] };
      }
      case 'kakukk': {
        // Three from one subtopic, one from a different topic.
        const bySub = new Map<string, ConceptEntry[]>();
        for (const e of usable.filter((x) => !x.parent)) bySub.set(e.subtopic, [...(bySub.get(e.subtopic) ?? []), e]);
        const groups = [...bySub.values()].filter((g) => g.length >= 3);
        const g = pickN(groups, 1, rng)[0];
        if (!g) return null;
        const three = pickN(g, 3, rng);
        const odd = pickN(usable.filter((x) => !x.parent && x.topicNo !== three[0]!.topicNo), 1, rng)[0];
        if (!odd) return null;
        const sub = three[0]!.subtopic.replace(/^\d+(\.\d+)*\.?\s*/, '');
        return {
          kind: 'kakukk',
          options: shuffle([...three, odd], rng),
          odd: odd.id,
          reason: `A többi a(z) „${sub}” alcímhez tartozik, „${odd.term}” viszont a(z) ${odd.topicNo}. témakörhöz.`,
          key: `kakukk:${three.map((x) => x.id).join('+')}`,
          topicNo: three[0]!.topicNo,
          tags: three[0]!.tags,
        };
      }
      case 'parositas': {
        const e0 = pickN(usable.filter((x) => !x.parent), 1, rng)[0];
        if (!e0) return null;
        const same = usable.filter((x) => !x.parent && x.topicNo === e0.topicNo && x.id !== e0.id);
        const four = [e0, ...pickN(same, 3, rng)];
        if (four.length < 4) return null;
        return {
          kind: 'parositas',
          pairs: four.map((e) => ({ term: e.term, def: shortDef(e), id: e.id })),
          key: `par:${four.map((x) => x.id).join('+')}`,
          topicNo: e0.topicNo,
          tags: e0.tags,
        };
      }
      case 'sorrend': {
        const p = pickN(pool.processes, 1, rng)[0];
        return p ? { kind: 'sorrend', process: p, key: `process:${p.id}`, topicNo: procTopic(p.id), tags: [] } : null;
      }
      case 'abra': {
        const withDiagram = pool.processes.filter((p) => {
          const d = PROCESSES.find((x) => x.id === p.id)?.diagram;
          return d && d !== 'flow';
        });
        const p = pickN(withDiagram, 1, rng)[0];
        if (!p) return null;
        const diagram = PROCESSES.find((x) => x.id === p.id)!.diagram;
        const step = Math.floor(rng() * p.steps.length);
        const titles = p.steps.map((s) => s.title);
        const options = shuffle([titles[step]!, ...pickN(titles.filter((_, i) => i !== step), 3, rng)], rng);
        return { kind: 'abra', process: p, diagram, step, options, key: `abra:${p.id}:${step}`, topicNo: procTopic(p.id), tags: [] };
      }
      case 'szamolas': {
        const g = pickN(GENERATORS, 1, rng)[0]!;
        return { kind: 'szamolas', generator: g.id, seed: Math.floor(rng() * 1e6), key: `calc:${g.id}`, topicNo: Number(g.topic.split('.')[0]), tags: ['számolás'] };
      }
      case 'magyarazd': {
        const p = pickN(pool.processes, 1, rng)[0];
        return p ? { kind: 'magyarazd', process: p, key: `essay:${p.id}`, topicNo: procTopic(p.id), tags: [] } : null;
      }
    }
  }
}
