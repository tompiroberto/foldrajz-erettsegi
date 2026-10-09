import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const X0 = 70;
const X1 = 600;
const YT = 76;
const YB = 330;

// Schematic employment shares (primer, szekunder, tercier, kvaterner) along the development path.
const SHARES = [
  [80, 10, 10, 0],
  [74, 13, 13, 0],
  [46, 30, 22, 2],
  [20, 46, 30, 4],
  [10, 38, 44, 8],
  [4, 22, 50, 24],
  [3, 17, 46, 34],
];
const SECTORS = [
  { name: 'primer', sub: 'mező-, erdőgazdaság, bányászat', fill: '#5E9C5A', lx: 158, li: 1 },
  { name: 'szekunder', sub: 'ipar, építőipar', fill: '#C9B79C', lx: 335, li: 3 },
  { name: 'tercier', sub: 'szolgáltatások', fill: '#4A90C2', lx: 500, li: 5 },
  { name: 'kvaterner', sub: 'kutatás, IT, irányítás', fill: '#F2C14E', lx: 568, li: 6 },
];

const xs = SHARES.map((_, i) => X0 + (i * (X1 - X0)) / (SHARES.length - 1));
const yOf = (pct: number) => YB - (pct / 100) * (YB - YT);
// cumulative boundaries
const cum = SHARES.map((row) => row.reduce<number[]>((acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v], []));
function band(k: number) {
  const top = xs.map((x, i) => `${x.toFixed(1)} ${yOf(cum[i]![k]!).toFixed(1)}`);
  const bottom = xs.map((x, i) => `${x.toFixed(1)} ${yOf(k === 0 ? 0 : cum[i]![k - 1]!).toFixed(1)}`).reverse();
  return `M${top.join(' L')} L${bottom.join(' L')} Z`;
}

const PHASES = [
  { name: 'agrártársadalom', from: X0, to: 225 },
  { name: 'ipari társadalom', from: 225, to: 420 },
  { name: 'posztindusztriális', from: 420, to: X1 },
];

export default function EconomicSectors({ reduced = false }: DiagramProps) {
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' as const };
  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="A gazdasági szektorok foglalkoztatási arányának változása (vázlat): az agrártársadalomban a primer, az ipari társadalomban a szekunder, a posztindusztriális társadalomban a tercier és a kvaterner szektor a legnagyobb."
      style={{ fontFamily: 'inherit' }}
    >
      <rect width="640" height="400" fill="var(--paper)" />
      <text x={X0} y="22" fontSize="13" fill="var(--muted)">
        a foglalkoztatottak megoszlása (vázlat)
      </text>

      {/* phases */}
      {PHASES.map((p, i) => (
        <g key={p.name}>
          {i > 0 && <line x1={p.from} x2={p.from} y1={44} y2={YB} stroke="var(--ink)" strokeDasharray="4 4" strokeOpacity="0.6" />}
          <text x={(p.from + p.to) / 2} y="58" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ink)">
            {p.name}
          </text>
        </g>
      ))}

      <motion.g initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ ...t, duration: reduced ? 0 : 1 }}>
        {SECTORS.map((s, k) => (
          <path key={s.name} d={band(k)} fill={s.fill} fillOpacity="0.6" stroke="var(--paper)" strokeWidth="1.5" />
        ))}
      </motion.g>

      {/* labels inside bands */}
      {SECTORS.map((s, k) => {
        const i = s.li;
        const lo = k === 0 ? 0 : cum[i]![k - 1]!;
        const hi = cum[i]![k]!;
        const y = (yOf(lo) + yOf(hi)) / 2;
        return (
          <g key={s.name}>
            <text x={s.lx} y={y - 1} textAnchor="middle" fontSize="14.5" fontWeight="700" fill="var(--ink)">
              {s.name}
            </text>
            <text x={s.lx} y={y + 15} textAnchor="middle" fontSize="12.5" fill="var(--ink)">
              {s.sub}
            </text>
          </g>
        );
      })}

      {/* axes */}
      <line x1={X0} x2={X0} y1={YT} y2={YB} stroke="var(--ink)" />
      <line x1={X0} x2={X1} y1={YB} y2={YB} stroke="var(--ink)" />
      <text x={X0 - 6} y={YB + 4.5} textAnchor="end" fontSize="12.5" fill="var(--muted)">
        0%
      </text>
      <text x={X0 - 6} y={YT + 4.5} textAnchor="end" fontSize="12.5" fill="var(--muted)">
        100%
      </text>
      <text x={(X0 + X1) / 2} y={YB + 24} textAnchor="middle" fontSize="13" fill="var(--muted)">
        a gazdasági fejlődés iránya →
      </text>
    </svg>
  );
}
