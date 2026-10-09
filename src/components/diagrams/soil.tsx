import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const LAND = '#C9B79C';
const VEG = '#5E9C5A';
const SEA = '#4A90C2';
const SUN = '#F2C14E';
const WARM = '#D64545';

const TOP = 84;
const BOT = 380;
const X0 = 150;
const X1 = 350;

// [O, A, B] bottom boundaries per step (C fills the rest).
const BOUNDS: [number, number, number][] = [
  [TOP, TOP, TOP],
  [TOP + 16, TOP + 16, TOP + 16],
  [TOP + 14, 178, 178],
  [TOP + 12, 166, 258],
  [TOP + 14, 180, 284],
];

const ARIA = [
  'Az anyakőzet (C-szint) aprózódik és mállik.',
  'Élőlények telepednek meg, a felszínen szerves anyag (avar) gyűlik.',
  'A szerves anyag lebomlásából humusz képződik: kialakul a sötét A-szint.',
  'A beszivárgó víz kilúgozza az A-szintet, az anyagok a B-szintben halmozódnak fel.',
  'Érett talajszelvény: avar, A-, B- és C-szint.',
];

export default function Soil({ step = 0, reduced = false }: DiagramProps) {
  const s = Math.max(0, Math.min(4, step));
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };
  const [o, a, b] = BOUNDS[s]!;
  const band = (y0: number, y1: number) => ({ y: y0, height: Math.max(0, y1 - y0) });
  const on = (cond: boolean, dim = 0) => ({ opacity: cond ? 1 : dim });
  const hl = (i: number) => (s === i ? 'var(--accent)' : 'var(--ink)');
  const labelY = { O: (TOP + o) / 2, A: (o + a) / 2, B: (a + b) / 2, C: (b + BOT) / 2 };

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={`Talajképződés, ${s + 1}. lépés – ${ARIA[s]}`} style={{ fontFamily: 'inherit' }}>
      <rect width="640" height="400" fill="var(--paper)" />

      {/* weather (step 0) */}
      <motion.g initial={false} animate={on(s === 0)} transition={t}>
        <circle cx="70" cy="40" r="18" fill={SUN} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const ang = (i * Math.PI) / 3;
          return <line key={i} x1={70 + 23 * Math.cos(ang)} y1={40 + 23 * Math.sin(ang)} x2={70 + 30 * Math.cos(ang)} y2={40 + 30 * Math.sin(ang)} stroke={SUN} strokeWidth="2.5" />;
        })}
        {[200, 230, 260, 290].map((x) => (
          <line key={x} x1={x} x2={x - 5} y1={30} y2={60} stroke={SEA} strokeWidth="2.2" strokeDasharray="6 5" />
        ))}
        <text x="310" y="40" fontSize="13" fill="var(--muted)">
          hőingás, víz, fagy
        </text>
      </motion.g>

      {/* C – parent material */}
      <rect x={X0} y={TOP} width={X1 - X0} height={BOT - TOP} fill={LAND} />
      <rect x={X0} y={330} width={X1 - X0} height={BOT - 330} fill={LAND} style={{ filter: 'brightness(0.82)' }} />
      <g fill={LAND} stroke="var(--muted)" strokeWidth="1" style={{ filter: 'brightness(0.9)' }}>
        {[
          [170, 120], [222, 110], [290, 128], [330, 104], [190, 170], [260, 160], [318, 190], [176, 236], [240, 214], [300, 250],
          [200, 290], [270, 300], [330, 296], [160, 314],
        ].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} l${10 + (i % 3) * 4} -4 l6 ${8 + (i % 2) * 4} l-${12 + (i % 3) * 3} 6 Z`} />
        ))}
      </g>
      <g stroke="var(--muted)" strokeWidth="1.2" fill="none">
        <path d="M190 340 l12 20 l-4 18 M260 334 l-8 24 l10 20 M320 344 l6 16" />
      </g>

      {/* B – accumulation */}
      <motion.rect x={X0} width={X1 - X0} initial={false} animate={band(a, b)} transition={t} fill={LAND} style={{ filter: 'brightness(0.72)' }} />
      <motion.rect x={X0} width={X1 - X0} initial={false} animate={band(a, b)} transition={t} fill={WARM} fillOpacity={0.22} />
      {/* A – humus */}
      <motion.rect x={X0} width={X1 - X0} initial={false} animate={band(o, a)} transition={t} fill={LAND} style={{ filter: 'brightness(0.4)' }} />
      {/* O – litter */}
      <motion.rect x={X0} width={X1 - X0} initial={false} animate={band(TOP, o)} transition={t} fill={VEG} style={{ filter: 'brightness(0.7)' }} />
      <rect x={X0} y={TOP} width={X1 - X0} height={BOT - TOP} fill="none" stroke="var(--ink)" strokeWidth="1.2" />

      {/* leaching arrows (step 3+) */}
      <motion.g initial={false} animate={on(s >= 3, 0)} transition={t}>
        {[190, 250, 310].map((x) => (
          <g key={x}>
            <line x1={x} x2={x} y1={120} y2={206} stroke="#DCEBF5" strokeWidth="2.4" strokeDasharray="5 4" />
            <path d={`M${x - 6} ${202} l6 10 l6 -10`} fill="none" stroke="#DCEBF5" strokeWidth="2.4" />
          </g>
        ))}
      </motion.g>

      {/* plants */}
      <motion.g initial={false} animate={on(s >= 1)} transition={t}>
        {[170, 200, 236, 300, 330].map((x, i) => (
          <path key={x} d={`M${x} ${TOP} q-4 -12 -8 -16 M${x} ${TOP} q2 -14 8 -18`} stroke={VEG} strokeWidth="2.5" fill="none" opacity={i % 2 ? 0.9 : 1} />
        ))}
      </motion.g>
      <motion.g initial={false} animate={on(s >= 4)} transition={t}>
        <rect x="263" y="14" width="8" height={TOP - 14} fill={LAND} style={{ filter: 'brightness(0.6)' }} />
        <circle cx="267" cy="22" r="22" fill={VEG} />
        <circle cx="250" cy="36" r="15" fill={VEG} />
        <circle cx="285" cy="36" r="15" fill={VEG} />
        <path d="M267 84 q-10 30 -30 52 M267 84 q4 40 22 70 M267 84 q-2 50 -10 110" stroke="var(--muted)" strokeWidth="1.6" fill="none" />
      </motion.g>

      {/* weathering arrows on C (step 0) */}
      <motion.g initial={false} animate={on(s === 0)} transition={t}>
        <path d="M120 120 h18 M131 114 l7 6 l-7 6" stroke="var(--accent)" strokeWidth="2.4" fill="none" />
      </motion.g>

      {/* horizon letters (left) */}
      <g fontSize="15" fontWeight="700" textAnchor="end">
        <motion.g initial={false} animate={{ y: labelY.O, opacity: o > TOP ? 1 : 0 }} transition={t}>
          <text x={X0 - 10} y={5} fill={hl(1)}>
            O
          </text>
        </motion.g>
        <motion.g initial={false} animate={{ y: labelY.A, opacity: a > o ? 1 : 0 }} transition={t}>
          <text x={X0 - 10} y={5} fill={hl(2)}>
            A
          </text>
        </motion.g>
        <motion.g initial={false} animate={{ y: labelY.B, opacity: b > a ? 1 : 0 }} transition={t}>
          <text x={X0 - 10} y={5} fill={hl(3)}>
            B
          </text>
        </motion.g>
        <motion.g initial={false} animate={{ y: labelY.C }} transition={t}>
          <text x={X0 - 10} y={5} fill={hl(0)}>
            C
          </text>
        </motion.g>
      </g>

      {/* descriptions (right) */}
      <g fontSize="13">
        <motion.g initial={false} animate={{ y: s === 0 ? 0 : labelY.O - TOP - 4, opacity: o > TOP ? 1 : 0 }} transition={t}>
          <text x={X1 + 16} y={TOP + 6} fontWeight="700" fill={hl(1)}>
            avar, szerves anyag
          </text>
        </motion.g>
        <motion.g initial={false} animate={{ y: labelY.A, opacity: a > o ? 1 : 0 }} transition={t}>
          <text x={X1 + 16} y={-4} fontWeight="700" fill={hl(2)}>
            A-szint: humuszos szint
          </text>
          <text x={X1 + 16} y={14} fill="var(--muted)">
            {s >= 3 ? 'kilúgozási szint (sötét, laza)' : 'elbomlott szerves anyag: humusz'}
          </text>
        </motion.g>
        <motion.g initial={false} animate={{ y: labelY.B, opacity: b > a ? 1 : 0 }} transition={t}>
          <text x={X1 + 16} y={-4} fontWeight="700" fill={hl(3)}>
            B-szint: felhalmozódási szint
          </text>
          <text x={X1 + 16} y={14} fill="var(--muted)">
            bemosódott agyag, vas-, mészvegyületek
          </text>
        </motion.g>
        <motion.g initial={false} animate={{ y: labelY.C }} transition={t}>
          <text x={X1 + 16} y={-4} fontWeight="700" fill={hl(0)}>
            C-szint: anyakőzet
          </text>
          <text x={X1 + 16} y={14} fill="var(--muted)">
            {s === 0 ? 'aprózódás és mállás' : 'málló, aprózódott kőzet'}
          </text>
        </motion.g>
        <motion.g initial={false} animate={on(s >= 3)} transition={t}>
          <text x={X0 - 10} y={TOP - 14} fill="var(--muted)" textAnchor="end">
            beszivárgó víz ↓
          </text>
        </motion.g>
      </g>
      <motion.text initial={false} animate={on(s === 4)} transition={t} x={X1 + 16} y={TOP - 30} fontSize="14" fontWeight="700" fill="var(--accent)">
        érett talajszelvény
      </motion.text>
    </svg>
  );
}
