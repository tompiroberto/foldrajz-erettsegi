import { useMemo } from 'react';
import { contours } from 'd3-contour';
import { createNoise3D } from 'simplex-noise';
import { cssVar, useCanvasLoop } from './useCanvasLoop';

/** Deterministic PRNG so the terrain looks the same on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CELL = 14; // px per noise sample
const LEVELS = 16;

/**
 * Topography background: a slowly "breathing" contour-line terrain (szintvonalak)
 * from 3D simplex noise, every 5th line an index contour, with a faint graticule and
 * a few spot heights – a living blank atlas page.
 */
export function ContourField({ animate }: { animate: boolean }) {
  const noise = useMemo(() => createNoise3D(mulberry32(1848)), []);
  const spots = useMemo(() => {
    const r = mulberry32(48);
    return Array.from({ length: 7 }, () => ({ x: r(), y: r(), h: Math.round(200 + r() * 1800) }));
  }, []);

  const ref = useCanvasLoop(
    (ctx, w, h, t) => {
      const cols = Math.ceil(w / CELL) + 2;
      const rows = Math.ceil(h / CELL) + 2;
      const z = t * 0.012;
      const values = new Float64Array(cols * rows);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = i * 0.045;
          const y = j * 0.045;
          // Two octaves: broad hills + small relief.
          values[j * cols + i] = noise(x, y, z) * 0.75 + noise(x * 2.3, y * 2.3, z * 1.6) * 0.25;
        }
      }
      const thresholds = Array.from({ length: LEVELS }, (_, k) => -0.9 + (k * 1.8) / (LEVELS - 1));
      const polys = contours().size([cols, rows]).thresholds(thresholds)(Array.from(values));

      ctx.clearRect(0, 0, w, h);
      const line = cssVar('--contour', '#6FA585');
      const motif = cssVar('--bg-motif', '#2E7D4F');

      // Graticule: gently curved like a conic projection.
      ctx.strokeStyle = motif;
      ctx.globalAlpha = 0.09;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      for (let gx = -1; gx <= 7; gx++) {
        ctx.beginPath();
        for (let yy = 0; yy <= h; yy += 20) {
          const x = (gx * w) / 6 + Math.sin((yy / h) * Math.PI) * 18 * (gx - 3) * 0.3;
          if (yy === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      for (let gy = 0; gy <= 5; gy++) {
        ctx.beginPath();
        for (let xx = 0; xx <= w; xx += 20) {
          const y = (gy * h) / 5 + Math.cos(((xx - w / 2) / w) * Math.PI) * -24;
          if (xx === 0) ctx.moveTo(xx, y);
          else ctx.lineTo(xx, y);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Contour lines.
      ctx.strokeStyle = line;
      ctx.lineJoin = 'round';
      polys.forEach((p, k) => {
        const index = k % 5 === 0;
        ctx.globalAlpha = index ? 0.62 : 0.34;
        ctx.lineWidth = index ? 1.6 : 0.9;
        ctx.beginPath();
        for (const poly of p.coordinates) {
          for (const ring of poly) {
            ring.forEach(([x, y], n) => {
              const px = (x! - 1) * CELL;
              const py = (y! - 1) * CELL;
              if (n === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
          }
        }
        ctx.stroke();
      });

      // Spot heights (▲ 1234).
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = motif;
      ctx.font = '600 11px "IBM Plex Sans Condensed", sans-serif';
      for (const s of spots) {
        const x = s.x * w;
        const y = s.y * h;
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x + 4.5, y + 3);
        ctx.lineTo(x - 4.5, y + 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillText(String(s.h), x + 7, y + 4);
      }
      ctx.globalAlpha = 1;
    },
    { fps: 15, animate },
  );

  return <canvas ref={ref} className="bg-canvas" aria-hidden />;
}
