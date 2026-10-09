import { useEffect, useRef } from 'react';

/**
 * Drives a full-size canvas: resizes with the window (devicePixelRatio aware), calls
 * `draw` at most `fps` times per second, pauses when the tab is hidden and draws a
 * single still frame when `animate` is false (reduced motion / map pages).
 */
export function useCanvasLoop(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void,
  { fps = 24, animate = true, redrawOnScroll = false }: { fps?: number; animate?: boolean; redrawOnScroll?: boolean } = {},
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current(ctx, w, h, (performance.now() - start) / 1000);
    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 1000 / fps) return;
      last = now;
      drawRef.current(ctx, w, h, (now - start) / 1000);
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && animate) raf = requestAnimationFrame(frame);
    };

    // Still frames still follow the scroll position (parallax without animation).
    const onScroll = () => !animate && drawRef.current(ctx, w, h, (performance.now() - start) / 1000);
    resize();
    window.addEventListener('resize', resize);
    if (redrawOnScroll) window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    if (animate) raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [fps, animate, redrawOnScroll]);

  return ref;
}

/** Reads a CSS custom property from <html> (theme-aware colours for canvas). */
export const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
