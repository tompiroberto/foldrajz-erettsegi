import { beforeEach, describe, expect, it } from 'vitest';
import { statusOf } from '@/lib/srs';
import { EMPTY_PROGRESS, useProgress } from './progress';

describe('markLearned (Érettségi mód)', () => {
  beforeEach(() => useProgress.setState(EMPTY_PROGRESS));

  it('egy jó válasz után az elem megtanult', () => {
    useProgress.getState().markLearned('place:x', Date.UTC(2026, 9, 14, 10));
    expect(statusOf(useProgress.getState().srs['place:x'])).toBe('mastered');
  });

  it('egy rossz válasz után már nem számít megtanultnak', () => {
    const t = Date.UTC(2026, 9, 14, 10);
    useProgress.getState().markLearned('concept:y', t);
    useProgress.getState().rate('concept:y', 0, t + 1000);
    expect(statusOf(useProgress.getState().srs['concept:y'])).not.toBe('mastered');
  });
});
