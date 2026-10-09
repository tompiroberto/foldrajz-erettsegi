import { useEffect, useRef, useState } from 'react';
import { animate, motion } from 'framer-motion';
import type { DiagramProps } from './types';

/** Tweens a number towards `target` (0.8 s), or jumps when reduced. */
function useTween(target: number, reduced?: boolean): number {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (reduced) {
      cur.current = target;
      setV(target);
      return;
    }
    const c = animate(cur.current, target, {
      duration: 0.8,
      ease: 'easeInOut',
      onUpdate: (x) => {
        cur.current = x;
        setV(x);
      },
    });
    return () => c.stop();
  }, [target, reduced]);
  return v;
}

const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => n.toFixed(1);

/** Path of the half disk that faces screen direction `dir` (degrees, y down). */
function halfDisk(cx: number, cy: number, r: number, dir: number): string {
  const a = rad(dir - 90);
  const b = rad(dir + 90);
  return `M${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))} A${r},${r} 0 0 1 ${f(cx + r * Math.cos(b))},${f(cy + r * Math.sin(b))} Z`;
}

/** Day length in hours at latitude phi for solar declination delta. */
function dayLength(phi: number, delta: number): number {
  const x = -Math.tan(rad(phi)) * Math.tan(rad(delta));
  if (x <= -1) return 24;
  if (x >= 1) return 0;
  return (2 * ((Math.acos(x) * 180) / Math.PI)) / 15;
}
const fmtH = (h: number) => {
  const r = Math.round(h * 2) / 2;
  return `${String(r).replace('.', ',')} óra`;
};

const SEA = '#4A90C2';
const SUN = '#F2C14E';
const E = { cx: 240, cy: 215, r: 122 };

const PARALLELS: { lat: number; name: string }[] = [
  { lat: 66.5, name: 'É. sarkkör (66,5°)' },
  { lat: 23.5, name: 'Ráktérítő (23,5°)' },
  { lat: 0, name: 'Egyenlítő (0°)' },
  { lat: -23.5, name: 'Baktérítő (−23,5°)' },
  { lat: -66.5, name: 'D. sarkkör (−66,5°)' },
];

const STEPS = [
  { title: 'Nap-éj egyenlőség: mindenhol 12 óra', delta: 0, note: 'Az árnyékhatár átmegy a sarkokon.' },
  { title: 'Északi nyár (június 21–22.)', delta: 23.5, note: 'Északon hosszabbak a nappalok.' },
  { title: 'Sarkkörök: sarki nappal és sarki éjszaka', delta: 23.5, note: 'A sarkkörön túl 24 órás nappal / éjszaka.' },
  { title: 'Északi tél (december 21–22.)', delta: -23.5, note: 'Délen hosszabbak a nappalok.' },
];

export default function DayLength({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(STEPS.length - 1, Math.round(step)));
  const info = STEPS[s] ?? STEPS[0]!;
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };
  const d = useTween(info.delta, reduced);
  const { cx, cy, r } = E;

  // Terminator: line through the centre, perpendicular to the rays.
  // Night half faces screen direction `d` (rays come from the upper left in June).
  const top = { x: Math.cos(rad(d - 90)), y: Math.sin(rad(d - 90)) };
  const termX = (y: number) => cx + ((y - cy) / top.y) * top.x;

  // Sun rays: direction pointing to the centre from the subsolar point.
  const ray = { x: Math.cos(rad(d)), y: Math.sin(rad(d)) };
  const rayLines = [-84, -42, 0, 42, 84].map((off) => {
    // a ray passing at perpendicular offset `off` from the centre
    const px = -ray.y;
    const py = ray.x;
    const ox = cx + px * off;
    const oy = cy + py * off;
    const bb = ox - cx;
    const cc = oy - cy;
    const proj = bb * ray.x + cc * ray.y;
    const disc = proj * proj - (bb * bb + cc * cc - r * r);
    const hit = -proj - Math.sqrt(Math.max(0, disc));
    const end = { x: ox + ray.x * hit, y: oy + ray.y * hit };
    const len = 80;
    return { x1: end.x - ray.x * len, y1: end.y - ray.y * len, x2: end.x, y2: end.y, main: off === 0 };
  });

  const polar = s === 2;
  const nightCapN = info.delta < 0;
  const capY = cy - r * Math.sin(rad(66.5));
  const capHalf = r * Math.cos(rad(66.5));
  const capN = `M${f(cx - capHalf)},${f(capY)} A${r},${r} 0 0 1 ${f(cx + capHalf)},${f(capY)} Z`;
  const capS = `M${f(cx - capHalf)},${f(2 * cy - capY)} A${r},${r} 0 0 0 ${f(cx + capHalf)},${f(2 * cy - capY)} Z`;

  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label={`A nappalok hossza: ${info.title}. ${info.note}`}
      style={{ fontFamily: 'inherit' }}
    >
      <text x={16} y={28} fontSize={17} fontWeight={700} fill="var(--ink)">
        {info.title}
      </text>

      {rayLines.map((l, i) => (
        <g key={i}>
          <line x1={l.x1} y1={l.y1} x2={l.x2 - ray.x * 6} y2={l.y2 - ray.y * 6} stroke={SUN} strokeWidth={l.main ? 3 : 1.6} />
          <path
            d={`M${f(l.x2)},${f(l.y2)} L${f(l.x2 - ray.x * 9 - ray.y * 4)},${f(l.y2 - ray.y * 9 + ray.x * 4)} L${f(l.x2 - ray.x * 9 + ray.y * 4)},${f(l.y2 - ray.y * 9 - ray.x * 4)} Z`}
            fill={SUN}
          />
        </g>
      ))}
      <line x1={18} y1={380} x2={44} y2={380} stroke={SUN} strokeWidth={2.5} />
      <text x={50} y={384} fontSize={13} fill="var(--muted)">
        napsugarak
      </text>
      <line x1={140} y1={380} x2={166} y2={380} stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 4" />
      <text x={172} y={384} fontSize={13} fill="var(--muted)">
        árnyékhatár
      </text>

      <circle cx={cx} cy={cy} r={r} fill={SEA} />
      <path d={halfDisk(cx, cy, r, d)} fill="#000" opacity={0.5} />

      {/* Polar caps for step 2 */}
      <motion.g initial={false} animate={{ opacity: polar ? 1 : 0 }} transition={t}>
        <path d={capN} fill={nightCapN ? '#000' : SUN} opacity={0.45} />
        <path d={capS} fill={nightCapN ? SUN : '#000'} opacity={0.45} />
      </motion.g>

      {/* Parallels with day (yellow) and night (dark) segments */}
      {PARALLELS.map((p) => {
        const y = cy - r * Math.sin(rad(p.lat));
        const hw = r * Math.cos(rad(p.lat));
        const xl = cx - hw;
        const xr = cx + hw;
        const xt = Math.max(xl, Math.min(xr, termX(y)));
        return (
          <g key={p.name}>
            <line x1={xl} y1={y} x2={xt} y2={y} stroke={SUN} strokeWidth={3} />
            <line x1={xt} y1={y} x2={xr} y2={y} stroke="#0B1626" strokeWidth={3} />
          </g>
        );
      })}

      {/* Terminator */}
      <line
        x1={cx - top.x * (r + 14)}
        y1={cy - top.y * (r + 14)}
        x2={cx + top.x * (r + 14)}
        y2={cy + top.y * (r + 14)}
        stroke="var(--accent)"
        strokeWidth={2}
        strokeDasharray="6 4"
      />

      {/* Axis */}
      <line x1={cx} y1={cy - r - 12} x2={cx} y2={cy + r + 12} stroke="var(--ink)" strokeWidth={1.6} />
      <text x={cx + 7} y={cy - r - 2} fontSize={13} fontWeight={700} fill="var(--ink)">
        É
      </text>
      <text x={cx + 7} y={cy + r + 14} fontSize={13} fontWeight={700} fill="var(--ink)">
        D
      </text>

      <text x={cx - 70} y={cy + 30} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1B2430">
        nappal
      </text>
      <text x={cx + 70} y={cy + 30} textAnchor="middle" fontSize={14} fontWeight={700} fill="#E9EEF5">
        éjszaka
      </text>

      <motion.g initial={false} animate={{ opacity: polar ? 1 : 0 }} transition={t}>
        <text x={cx - 12} y={cy - r - 2} textAnchor="end" fontSize={13} fontWeight={700} fill="var(--accent)">
          {nightCapN ? 'sarki éjszaka' : 'sarki nappal'}
        </text>
        <text x={cx - 12} y={cy + r + 14} textAnchor="end" fontSize={13} fontWeight={700} fill="var(--accent)">
          {nightCapN ? 'sarki nappal' : 'sarki éjszaka'}
        </text>
      </motion.g>

      {/* Table: day length per parallel */}
      <text x={392} y={70} fontSize={13} fill="var(--muted)">
        szélességi kör
      </text>
      <text x={630} y={70} textAnchor="end" fontSize={13} fill="var(--muted)">
        nappal hossza
      </text>
      {PARALLELS.map((p) => {
        const y = cy - r * Math.sin(rad(p.lat));
        const h = dayLength(p.lat, info.delta);
        return (
          <g key={p.name}>
            <line x1={cx + r * Math.cos(rad(p.lat)) + 4} y1={y} x2={386} y2={y} stroke="var(--line)" strokeDasharray="2 3" />
            <text x={392} y={y + 4} fontSize={13} fill="var(--ink)">
              {p.name}
            </text>
            <text x={630} y={y + 4} textAnchor="end" fontSize={13} fontWeight={700} fill={h > 12.1 ? 'var(--accent)' : 'var(--ink)'}>
              {fmtH(h)}
            </text>
          </g>
        );
      })}
      <text x={392} y={384} fontSize={13} fill="var(--muted)">
        {info.note}
      </text>
    </svg>
  );
}
