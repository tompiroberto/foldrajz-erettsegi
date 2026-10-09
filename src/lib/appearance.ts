import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings, type Mode } from '@/store/settings';

export function modeForPath(path: string, fallback: Mode): Mode {
  if (path.startsWith('/topografia')) return 'topo';
  if (path.startsWith('/elmelet')) return 'theory';
  return fallback;
}

/** Current colour world: from the URL inside a mode, otherwise the last mode used. */
export function useMode(): Mode {
  const { pathname } = useLocation();
  const lastMode = useSettings((s) => s.lastMode);
  return modeForPath(pathname, lastMode);
}

function usePrefersDark() {
  const [dark, setDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return dark;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const animations = useSettings((s) => s.animations);
  return reduced || !animations;
}

const THEME_COLOR: Record<Mode, { light: string; dark: string }> = {
  topo: { light: '#0E7C86', dark: '#0F1620' },
  theory: { light: '#D9572B', dark: '#0F1620' },
};
const FAVICON_TINT: Record<Mode, string> = { topo: '#0E7C86', theory: '#D9572B' };

function faviconSvg(tint: string) {
  // Compass rose over contour rings, tinted per mode.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${tint}"/><g fill="none" stroke="#F7F4EC" stroke-opacity=".45" stroke-width="2"><circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="14"/></g><path d="M32 8 37 32 32 56 27 32Z" fill="#F7F4EC"/><path d="M8 32 32 27 56 32 32 37Z" fill="#F7F4EC" fill-opacity=".7"/></svg>`;
}

/** Writes theme, mode, motion preference, theme-color and favicon tint to the document. */
export function useAppearance() {
  const mode = useMode();
  const theme = useSettings((s) => s.theme);
  const prefersDark = usePrefersDark();
  const reduced = usePrefersReducedMotion();
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.mode = mode;
    el.dataset.theme = dark ? 'dark' : 'light';
    el.dataset.motion = reduced ? 'reduced' : 'full';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[mode][dark ? 'dark' : 'light']);
    const link = document.getElementById('favicon') as HTMLLinkElement | null;
    if (link) link.href = `data:image/svg+xml,${encodeURIComponent(faviconSvg(FAVICON_TINT[mode]))}`;
  }, [mode, dark, reduced]);

  return { mode, dark, reduced };
}
