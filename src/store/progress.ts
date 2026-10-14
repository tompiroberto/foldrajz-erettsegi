import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DAY, MASTERED_DAYS, review, startOfDay, type Grade, type SrsState } from '@/lib/srs';

/**
 * Item ids are namespaced: `place:<topography id>`, `concept:<slug>`, `process:<id>`,
 * `calc:<generator id>`, `card:<requirement card id>`, `exam:<task id>`.
 */
export type ItemKind = 'place' | 'concept' | 'process' | 'calc' | 'card' | 'exam';
export const itemId = (kind: ItemKind, id: string) => `${kind}:${id}`;

export interface ErrorNote {
  id: string;
  contentId: string;
  text: string;
  createdAt: string;
}

export interface ProgressData {
  srs: Record<string, SrsState>;
  /** Generated content the student has checked against the textbook. */
  reviewed: Record<string, true>;
  notes: ErrorNote[];
  /** Learning-card self rating: Megértettem / Még gyakorolnom kell. */
  understood: Record<string, 'ok' | 'practice'>;
  /** Answers per local day (YYYY-MM-DD) for the streak and the dashboard. */
  activity: Record<string, number>;
  lastVisited: { path: string; label: string } | null;
}

interface ProgressStore extends ProgressData {
  rate: (id: string, grade: Grade, now?: number) => void;
  /** Érettségi mode: a correct answer counts the item as learned (mastered) straight away. */
  markLearned: (id: string, now?: number) => void;
  setReviewed: (contentId: string, value: boolean) => void;
  addNote: (contentId: string, text: string) => void;
  removeNote: (id: string) => void;
  setUnderstood: (cardId: string, value: 'ok' | 'practice' | null) => void;
  visit: (path: string, label: string) => void;
  importData: (data: ProgressData) => void;
  resetAll: () => void;
}

export const EMPTY_PROGRESS: ProgressData = {
  srs: {},
  reviewed: {},
  notes: [],
  understood: {},
  activity: {},
  lastVisited: null,
};

export const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useProgress = create<ProgressStore>()(
  persist(
    (set) => ({
      ...EMPTY_PROGRESS,
      rate: (id, grade, now = Date.now()) =>
        set((s) => {
          const k = dayKey(now);
          return {
            srs: { ...s.srs, [id]: review(s.srs[id], grade, now) },
            activity: { ...s.activity, [k]: (s.activity[k] ?? 0) + 1 },
          };
        }),
      markLearned: (id, now = Date.now()) =>
        set((s) => {
          const k = dayKey(now);
          const r = review(s.srs[id], 3, now);
          const interval = Math.max(r.interval, MASTERED_DAYS);
          return {
            srs: { ...s.srs, [id]: { ...r, interval, due: startOfDay(now) + interval * DAY } },
            activity: { ...s.activity, [k]: (s.activity[k] ?? 0) + 1 },
          };
        }),
      setReviewed: (contentId, value) =>
        set((s) => {
          const reviewed = { ...s.reviewed };
          if (value) reviewed[contentId] = true;
          else delete reviewed[contentId];
          return { reviewed };
        }),
      addNote: (contentId, text) =>
        set((s) => ({
          notes: [...s.notes, { id: crypto.randomUUID(), contentId, text, createdAt: new Date().toISOString() }],
        })),
      removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      setUnderstood: (cardId, value) =>
        set((s) => {
          const understood = { ...s.understood };
          if (value) understood[cardId] = value;
          else delete understood[cardId];
          return { understood };
        }),
      visit: (path, label) => set({ lastVisited: { path, label } }),
      importData: (data) => set({ ...EMPTY_PROGRESS, ...data }),
      resetAll: () => set(EMPTY_PROGRESS),
    }),
    { name: 'fe-progress', version: 1 },
  ),
);

/** Consecutive days with at least one answer, counting today or yesterday as the end. */
export function streak(activity: Record<string, number>, now = Date.now()): number {
  let t = startOfDay(now);
  if (!activity[dayKey(t)]) t -= 86_400_000;
  let n = 0;
  while (activity[dayKey(t)]) {
    n++;
    t -= 86_400_000;
  }
  return n;
}

// ---------- Export / import ----------

export const EXPORT_FORMAT = 'foldrajz-erettsegi-progress';

export function exportProgress(data: ProgressData, settings: unknown) {
  return {
    format: EXPORT_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: data,
    settings,
  };
}

export function parseImport(json: unknown): { progress: ProgressData; settings: Record<string, unknown> | null } {
  if (!json || typeof json !== 'object') throw new Error('Nem érvényes JSON fájl.');
  const o = json as Record<string, unknown>;
  if (o.format !== EXPORT_FORMAT) throw new Error('Ez nem ennek az appnak a haladásmentése.');
  const p = o.progress as Partial<ProgressData> | undefined;
  if (!p || typeof p.srs !== 'object') throw new Error('Hiányzik a haladás a fájlból.');
  return {
    progress: { ...EMPTY_PROGRESS, ...p } as ProgressData,
    settings: (o.settings as Record<string, unknown>) ?? null,
  };
}
