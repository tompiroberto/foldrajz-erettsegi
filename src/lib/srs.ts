// SM-2 style spaced-repetition scheduler.
// Grades: 0 = Nem tudtam, 1 = Nehéz, 2 = Jó, 3 = Könnyű.

export type Grade = 0 | 1 | 2 | 3;
export type ItemStatus = 'new' | 'learning' | 'mastered';

export interface SrsState {
  ease: number;
  /** Days until the next review (0 = again today). */
  interval: number;
  reps: number;
  lapses: number;
  /** Epoch ms of the next review. */
  due: number;
  last: number;
  lastGrade: Grade;
  seen: number;
  correct: number;
  wrong: number;
}

export const DAY = 86_400_000;
export const MIN_EASE = 1.3;
/** Reviews this far apart (after a pass) count as "mastered". */
export const MASTERED_DAYS = 14;
/** A lapse comes back after 10 minutes. */
export const RELEARN_MS = 10 * 60_000;

export function newState(now: number): SrsState {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now, last: 0, lastGrade: 0, seen: 0, correct: 0, wrong: 0 };
}

const round2 = (x: number) => Math.round(x * 100) / 100;

export function review(prev: SrsState | undefined, grade: Grade, now: number): SrsState {
  const s = prev ? { ...prev } : newState(now);
  s.seen += 1;
  s.last = now;
  s.lastGrade = grade;

  if (grade === 0) {
    s.wrong += 1;
    s.lapses += prev && prev.reps > 0 ? 1 : 0;
    s.reps = 0;
    s.interval = 0;
    s.ease = Math.max(MIN_EASE, round2(s.ease - 0.2));
    s.due = now + RELEARN_MS;
    return s;
  }

  s.correct += 1;
  let interval: number;
  if (grade === 1) {
    interval = s.reps === 0 ? 1 : Math.max(s.interval + 1, Math.round(s.interval * 1.2));
    s.ease = Math.max(MIN_EASE, round2(s.ease - 0.15));
  } else if (grade === 2) {
    interval = s.reps === 0 ? 1 : s.reps === 1 ? 3 : Math.round(s.interval * s.ease);
  } else {
    interval = s.reps === 0 ? 4 : Math.round(Math.max(s.interval, 1) * s.ease * 1.3);
    s.ease = round2(s.ease + 0.15);
  }
  s.reps += 1;
  s.interval = Math.max(1, interval);
  s.due = startOfDay(now) + s.interval * DAY;
  return s;
}

export function statusOf(s: SrsState | undefined): ItemStatus {
  if (!s || s.seen === 0) return 'new';
  if (s.interval >= MASTERED_DAYS && s.lastGrade >= 2) return 'mastered';
  return 'learning';
}

export function isDue(s: SrsState | undefined, now: number): boolean {
  return !!s && s.seen > 0 && s.due <= now;
}

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Map a quiz outcome to a grade. Accepted-with-warning answers count as "hard". */
export function gradeFromAnswer(correct: boolean, warning = false, fast = false): Grade {
  if (!correct) return 0;
  if (warning) return 1;
  return fast ? 3 : 2;
}
