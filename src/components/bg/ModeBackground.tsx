import { useLocation } from 'react-router-dom';
import { useMode, usePrefersReducedMotion } from '@/lib/appearance';
import { ContourField } from './ContourField';
import { StrataBackground } from './StrataBackground';

/** The living background of the current mode, behind all content. */
export function ModeBackground() {
  const mode = useMode();
  const reduced = usePrefersReducedMotion();
  const { pathname } = useLocation();
  // On the map pages the contour field calms down to a still image.
  const calm = pathname.startsWith('/topografia/terkep') || pathname.startsWith('/topografia/kviz');
  return (
    <div className={`mode-bg mode-bg-${mode}`} aria-hidden>
      {mode === 'topo' ? <ContourField animate={!reduced && !calm} /> : <StrataBackground animate={!reduced} />}
    </div>
  );
}
