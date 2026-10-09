import { describe, expect, it } from 'vitest';
import { DAY, MIN_EASE, RELEARN_MS, gradeFromAnswer, isDue, review, startOfDay, statusOf } from './srs';

const T0 = new Date(2026, 0, 10, 15, 0).getTime();
const day0 = startOfDay(T0);

describe('review (SM-2 style)', () => {
  it('first "Jó" schedules for tomorrow', () => {
    const s = review(undefined, 2, T0);
    expect(s.interval).toBe(1);
    expect(s.due).toBe(day0 + DAY);
    expect(s.reps).toBe(1);
    expect(statusOf(s)).toBe('learning');
  });
  it('second "Jó" gives 3 days, third multiplies by ease', () => {
    let s = review(undefined, 2, T0);
    s = review(s, 2, T0 + DAY);
    expect(s.interval).toBe(3);
    s = review(s, 2, T0 + 4 * DAY);
    expect(s.interval).toBe(Math.round(3 * 2.5));
  });
  it('"Könnyű" jumps further and raises ease', () => {
    const s = review(undefined, 3, T0);
    expect(s.interval).toBe(4);
    expect(s.ease).toBeCloseTo(2.65);
  });
  it('"Nehéz" lowers ease but still advances', () => {
    let s = review(undefined, 2, T0);
    s = review(s, 2, T0 + DAY);
    s = review(s, 1, T0 + 4 * DAY);
    expect(s.interval).toBeGreaterThan(3);
    expect(s.ease).toBeCloseTo(2.35);
  });
  it('"Nem tudtam" resets and brings the item back in 10 minutes', () => {
    let s = review(undefined, 2, T0);
    s = review(s, 2, T0 + DAY);
    s = review(s, 0, T0 + 4 * DAY);
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.due).toBe(T0 + 4 * DAY + RELEARN_MS);
    expect(s.ease).toBeCloseTo(2.3);
    expect(s.wrong).toBe(1);
  });
  it('ease never falls below the minimum', () => {
    let s = review(undefined, 0, T0);
    for (let i = 0; i < 20; i++) s = review(s, 0, T0 + i);
    expect(s.ease).toBe(MIN_EASE);
  });
  it('reaches "mastered" after a long enough interval', () => {
    let s = review(undefined, 3, T0);
    let t = T0;
    while (statusOf(s) !== 'mastered') {
      t = s.due;
      s = review(s, 2, t);
    }
    expect(s.interval).toBeGreaterThanOrEqual(14);
  });
  it('isDue respects the due time', () => {
    const s = review(undefined, 2, T0);
    expect(isDue(s, T0)).toBe(false);
    expect(isDue(s, day0 + DAY)).toBe(true);
    expect(isDue(undefined, T0)).toBe(false);
  });
});

describe('gradeFromAnswer', () => {
  it('maps outcomes to grades; a spelling warning is "hard"', () => {
    expect(gradeFromAnswer(false)).toBe(0);
    expect(gradeFromAnswer(true, true)).toBe(1);
    expect(gradeFromAnswer(true)).toBe(2);
    expect(gradeFromAnswer(true, false, true)).toBe(3);
  });
});
