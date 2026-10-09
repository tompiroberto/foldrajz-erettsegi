// Generated content (src/content/**), loaded lazily and cached. Formats: src/content/README.md
import { useEffect, useState } from 'react';

export interface ConceptEntry {
  id: string;
  term: string;
  aliases?: string[];
  sourceLabels?: string[];
  parent?: string | null;
  topicNo: number;
  subtopic: string;
  level: 'kozep' | 'emelt';
  definition: string;
  example?: string;
  examplePlaces?: string[];
  related?: string[];
  tags: string[];
  generated: boolean;
  reviewed: boolean;
}

export interface Card {
  objectiveId: string;
  explanation: string;
  diagram: string | null;
  concepts: string[];
  processes: string[];
  examTip: string;
  selfCheck: { q: string; a: string }[];
  trueFalse: { statement: string; true: boolean; correction?: string }[];
  generated: boolean;
}

export interface ProcessContent {
  id: string;
  title: string;
  summary: string;
  causes: string[];
  course: string[];
  consequences: string[];
  steps: { title: string; caption: string; icon?: string }[];
  examples: { text: string; places?: string[] }[];
  concepts: string[];
  essay: { prompt: string; elements: { text: string; points: number }[]; modelAnswer: string };
  generated: boolean;
}

export interface PlaceFacts {
  fekves: string;
  facts: string[];
  concepts?: string[];
  processes?: string[];
  generated: boolean;
}

const conceptFiles = import.meta.glob<{ entries: ConceptEntry[] }>('../content/concepts/*.json', { import: 'default' });
const cardFiles = import.meta.glob<{ cards: Card[] }>('../content/cards/*.json', { import: 'default' });
const processFiles = import.meta.glob<ProcessContent>('../content/processes/*.json', { import: 'default' });
const factFiles = import.meta.glob<{ facts: Record<string, PlaceFacts> }>('../content/places-facts/*.json', { import: 'default' });

export interface ConceptIndex {
  entries: ConceptEntry[];
  byId: Map<string, ConceptEntry>;
  /** Official concepts.json label → entries covering it (main entry first). */
  byLabel: Map<string, ConceptEntry[]>;
}

let conceptsP: Promise<ConceptIndex> | null = null;
export function loadConcepts(): Promise<ConceptIndex> {
  conceptsP ??= Promise.all(Object.values(conceptFiles).map((l) => l())).then((files) => {
    const entries = files.flatMap((f) => f.entries);
    const byId = new Map(entries.map((e) => [e.id, e]));
    const byLabel = new Map<string, ConceptEntry[]>();
    for (const e of entries)
      for (const l of e.sourceLabels ?? []) {
        const list = byLabel.get(l) ?? [];
        if (!e.parent) list.unshift(e);
        else list.push(e);
        byLabel.set(l, list);
      }
    return { entries, byId, byLabel };
  });
  return conceptsP;
}

let cardsP: Promise<Map<string, Card>> | null = null;
export function loadCards(): Promise<Map<string, Card>> {
  cardsP ??= Promise.all(Object.values(cardFiles).map((l) => l())).then((files) => new Map(files.flatMap((f) => f.cards).map((c) => [c.objectiveId, c])));
  return cardsP;
}

export function loadProcess(id: string): Promise<ProcessContent | null> {
  const l = Object.entries(processFiles).find(([p]) => p.endsWith(`/${id}.json`))?.[1];
  return l ? l() : Promise.resolve(null);
}
export const processContentIds = () => Object.keys(processFiles).map((p) => p.split('/').pop()!.replace('.json', ''));

let factsP: Promise<Map<string, PlaceFacts>> | null = null;
export function loadPlaceFacts(): Promise<Map<string, PlaceFacts>> {
  factsP ??= Promise.all(Object.values(factFiles).map((l) => l())).then((files) => new Map(files.flatMap((f) => Object.entries(f.facts))));
  return factsP;
}

/** Generic "load once" hook. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): T | undefined {
  const [v, setV] = useState<T>();
  useEffect(() => {
    let alive = true;
    void fn().then((x) => alive && setV(x));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return v;
}
