import { useMemo } from 'react';
import { useProgress } from './progress';
import { isDue, statusOf } from '@/lib/srs';
import { TOTAL_CONCEPT_LABELS, TOTAL_PLACES } from '@/data/counts';

export function useDueCount(): number {
  const srs = useProgress((s) => s.srs);
  return useMemo(() => {
    const now = Date.now();
    return Object.values(srs).filter((s) => isDue(s, now)).length;
  }, [srs]);
}

/** Share of mastered items within a namespace, e.g. `place:` against 802 places. */
export function useMasteredShare(prefix: string, total: number): number {
  const srs = useProgress((s) => s.srs);
  return useMemo(() => {
    let n = 0;
    for (const [id, st] of Object.entries(srs)) if (id.startsWith(prefix) && statusOf(st) === 'mastered') n++;
    return total ? n / total : 0;
  }, [srs, prefix, total]);
}

export function useOverallProgress(): number {
  const p = useMasteredShare('place:', TOTAL_PLACES);
  const c = useMasteredShare('concept:', TOTAL_CONCEPT_LABELS);
  return (p * TOTAL_PLACES + c * TOTAL_CONCEPT_LABELS) / (TOTAL_PLACES + TOTAL_CONCEPT_LABELS);
}
