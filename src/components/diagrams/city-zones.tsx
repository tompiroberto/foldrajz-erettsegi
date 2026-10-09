import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const LAND = '#C9B79C';
const VEG = '#5E9C5A';
const WARM = '#D64545';
const COLD = '#2563EB';
const SUN = '#F2C14E';

const CX = 190;
const CY = 200;

// Outer → inner so inner circles are drawn on top.
const ZONES = [
  { r: 186, name: 'agglomeráció', sub: 'elővárosok, ingázó települések', fill: VEG, op: 0.28, dash: '6 5' },
  { r: 146, name: 'külső lakóhelyöv', sub: 'lakótelepek, kertvárosok', fill: SUN, op: 0.4 },
  { r: 110, name: 'külső munkahelyöv', sub: 'ipar, raktárak, pályaudvarok', fill: COLD, op: 0.32 },
  { r: 72, name: 'belső lakóhelyöv', sub: 'sűrű beépítés, bérházak', fill: LAND, op: 0.85 },
  { r: 36, name: 'city (belváros)', sub: 'üzleti negyed, hivatalok, bankok', fill: WARM, op: 0.75 },
];

export default function CityZones({ reduced = false }: DiagramProps) {
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' as const };
  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="A város koncentrikus övezetei kívülről befelé: agglomeráció, külső lakóhelyöv, külső munkahelyöv, belső lakóhelyöv és a középen lévő city."
      style={{ fontFamily: 'inherit' }}
    >
      <rect width="640" height="400" fill="var(--paper)" />
      {ZONES.map((z, i) => (
        <motion.circle
          key={z.name}
          cx={CX}
          cy={CY}
          r={z.r}
          fill={z.fill}
          fillOpacity={z.op}
          stroke="var(--ink)"
          strokeWidth="1.2"
          strokeDasharray={z.dash}
          initial={reduced ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...t, delay: reduced ? 0 : (ZONES.length - i) * 0.06 }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        />
      ))}
      {/* radial roads */}
      <g stroke="var(--muted)" strokeWidth="1.5" opacity="0.7">
        {[30, 110, 200, 290].map((a) => {
          const r = (a * Math.PI) / 180;
          return <line key={a} x1={CX + 36 * Math.cos(r)} y1={CY + 36 * Math.sin(r)} x2={CX + 196 * Math.cos(r)} y2={CY + 196 * Math.sin(r)} />;
        })}
      </g>

      {/* labels with leaders, inner first at the top */}
      {[...ZONES].reverse().map((z, i) => {
        const prevR = [0, 36, 72, 110, 146][i]!;
        const rMid = (z.r + prevR) / 2;
        const ang = (-50 + i * 22) * (Math.PI / 180);
        const px = CX + rMid * Math.cos(ang);
        const py = CY + rMid * Math.sin(ang);
        const ly = 60 + i * 66;
        return (
          <g key={z.name}>
            <polyline points={`${px},${py} ${404},${ly - 5} ${414},${ly - 5}`} fill="none" stroke="var(--ink)" strokeWidth="1" />
            <circle cx={px} cy={py} r="3" fill="var(--ink)" />
            <text x="420" y={ly} fontSize="14.5" fontWeight="700" fill="var(--ink)">
              {i + 1}. {z.name}
            </text>
            <text x="420" y={ly + 17} fontSize="12.5" fill="var(--muted)">
              {z.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
