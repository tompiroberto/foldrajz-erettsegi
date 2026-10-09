// Past emelt szintű written exams (oktatas.hu), structured in src/content/exams/*.json.
// Format: docs/erettsegi-feladatsorok/_schema.md
// The small index (exams-index.json) is used for lists, counts and search; a full paper
// is loaded only when it is opened.
import { useEffect, useState } from 'react';
import indexJson from '../content/exams-index.json';

export type ExamPartType =
  | 'true-false'
  | 'multiple-choice'
  | 'select-many'
  | 'matching'
  | 'ordering'
  | 'short-answer'
  | 'calculation'
  | 'essay'
  | 'map'
  | 'table'
  | 'diagram';

export interface ExamItem {
  n: string;
  text: string;
  answer?: string;
}

export interface ExamPart {
  label: string;
  type: ExamPartType;
  prompt: string;
  points: number;
  items?: ExamItem[];
  options?: string[];
  solution: string;
  autoCheck?: boolean;
}

export interface ExamTask {
  no: number;
  title: string;
  instruction: string;
  context: string;
  pages: number[];
  guidePages?: number[];
  points: number;
  needsFigure: boolean;
  figureNote?: string;
  subtopics: string[];
  concepts: string[];
  places: string[];
  parts: ExamPart[];
  note?: string;
}

export interface ExamMeta {
  id: string;
  year: number;
  season: 'tavasz' | 'osz' | 'februar';
  date: string;
  label: string;
  files: { feladatlap: string; utmutato: string };
  sourceUrl: string;
  totalPoints: number;
}

export interface Exam extends ExamMeta {
  tasks: ExamTask[];
}

export interface ExamTaskSummary {
  no: number;
  title: string;
  points: number;
  needsFigure: boolean;
  subtopics: string[];
  concepts: string[];
  places: string[];
  auto: number;
  parts: number;
  text: string;
}

export interface ExamIndexEntry extends ExamMeta {
  tasks: ExamTaskSummary[];
}

/** A task with its exam context, ready for quizzes and the exam page. */
export interface ExamTaskRef extends ExamTask {
  examId: string;
  /** "Érettségi 2024. május, 5. feladat" */
  source: string;
  exam: ExamMeta;
}

export const EXAM_INDEX = indexJson as ExamIndexEntry[];

export const sourceLabel = (e: ExamMeta, no: number, part?: string) => `${e.label}, ${no}. feladat${part ? ` ${part})` : ''}`;

/** Flat list of task summaries with their source label (no full text). */
export const EXAM_TASK_SUMMARIES = EXAM_INDEX.flatMap((e) =>
  e.tasks.map((t) => ({ ...t, examId: e.id, source: sourceLabel(e, t.no), exam: e as ExamMeta })),
);

export const examMeta = (id: string) => EXAM_INDEX.find((e) => e.id === id);

const loaders = import.meta.glob<Exam>('../content/exams/*.json', { import: 'default' });
const byId = new Map<string, () => Promise<Exam>>();
for (const [path, load] of Object.entries(loaders)) {
  const m = path.match(/(\d{4})_(\w+)\.json$/);
  if (m) byId.set(`${m[1]}-${m[2]}`, load);
}

const toRefs = (e: Exam): ExamTaskRef[] => e.tasks.map((t) => ({ ...t, examId: e.id, source: sourceLabel(e, t.no), exam: e }));

const cache = new Map<string, Promise<ExamTaskRef[]>>();
export function loadExamTasks(id: string): Promise<ExamTaskRef[]> {
  let p = cache.get(id);
  if (!p) {
    const load = byId.get(id);
    p = load ? load().then(toRefs) : Promise.resolve([]);
    cache.set(id, p);
  }
  return p;
}

export function loadAllExamTasks(): Promise<ExamTaskRef[]> {
  return Promise.all(EXAM_INDEX.map((e) => loadExamTasks(e.id))).then((l) => l.flat());
}

/** Loads one paper (or all papers when id is "*"); undefined while loading. */
export function useExamTasks(id: string | '*'): ExamTaskRef[] | undefined {
  const [tasks, setTasks] = useState<ExamTaskRef[]>();
  useEffect(() => {
    let alive = true;
    setTasks(undefined);
    void (id === '*' ? loadAllExamTasks() : loadExamTasks(id)).then((t) => alive && setTasks(t));
    return () => {
      alive = false;
    };
  }, [id]);
  return tasks;
}

/** URL of an original PDF (served from /exams/, cached on first open). */
export const pdfUrl = (file: string) => `${import.meta.env.BASE_URL}exams/${file}`;
