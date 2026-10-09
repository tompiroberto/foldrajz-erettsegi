import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const SEA = '#4A90C2';
const LAND = '#C9B79C';
const VEG = '#5E9C5A';

function head(x: number, y: number, deg: number, s = 9) {
  const a = (deg * Math.PI) / 180;
  const p = (r: number, da: number) => `${(x - r * Math.cos(a + da)).toFixed(1)},${(y - r * Math.sin(a + da)).toFixed(1)}`;
  return `${x},${y} ${p(s, 0.45)} ${p(s, -0.45)}`;
}

const SEGMENTS = [
  { x0: 30, x1: 190, title: 'felső szakasz', work: 'bevágódás' },
  { x0: 190, x1: 360, title: 'középső szakasz', work: 'oldalazás' },
  { x0: 360, x1: 520, title: 'alsó szakasz', work: 'feltöltés' },
  { x0: 520, x1: 630, title: 'torkolat', work: 'delta / tölcsér' },
];

const ARIA = [
  'A folyó felső szakasza: nagy esés, a folyó bevágódik, V alakú völgyet formál.',
  'A folyó középső szakasza: oldalazó erózió, kanyarulatok, a völgy kiszélesedik.',
  'A folyó alsó szakasza: kis esés, feltöltés, zátonyok és lefűződött holtágak.',
  'A torkolat: hordalékban gazdag folyó deltát épít, erős árapálynál tölcsértorkolat alakul ki.',
];

export default function River({ step = 0, reduced = false }: DiagramProps) {
  const s = Math.max(0, Math.min(3, step));
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };
  const show = (i: number) => ({ opacity: s === i ? 1 : 0 });
  const seg = SEGMENTS[s]!;

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={`A folyó szakaszjellegei, ${s + 1}. lépés – ${ARIA[s]}`} style={{ fontFamily: 'inherit' }}>
      <rect width="640" height="400" fill="var(--paper)" />

      {/* ---------- long profile ---------- */}
      <motion.rect initial={false} animate={{ x: seg.x0, width: seg.x1 - seg.x0 }} transition={t} y={14} height={180} rx={8} fill="var(--accent)" fillOpacity={0.14} stroke="var(--accent)" strokeOpacity={0.6} />
      <path d="M30 80 C120 155 300 172 560 176 L560 194 L30 194 Z" fill={LAND} fillOpacity={0.9} />
      <rect x="560" y="176" width="70" height="18" fill={SEA} />
      <path d="M30 80 C120 155 300 172 560 176" fill="none" stroke={SEA} strokeWidth="4" strokeLinecap="round" />
      <text x="40" y="74" fontSize="13" fill="var(--muted)">
        forrás
      </text>
      <text x="595" y="170" textAnchor="middle" fontSize="13" fill="var(--muted)">
        tenger
      </text>
      <text x="24" y="190" fontSize="12.5" fill="var(--muted)" textAnchor="start" transform="rotate(-90 24 190)">
        tszf. magasság
      </text>
      {SEGMENTS.map((g, i) => (
        <g key={i}>
          {i > 0 && <line x1={g.x0} x2={g.x0} y1={20} y2={194} stroke="var(--line)" strokeDasharray="4 4" />}
          <text x={(g.x0 + g.x1) / 2} y={34} textAnchor="middle" fontSize="13.5" fontWeight={i === s ? 700 : 500} fill={i === s ? 'var(--accent)' : 'var(--ink)'}>
            {g.title}
          </text>
          <text x={(g.x0 + g.x1) / 2} y={52} textAnchor="middle" fontSize="13" fill="var(--muted)">
            {g.work}
          </text>
        </g>
      ))}
      <text x="250" y="122" fontSize="13" fill="var(--muted)">
        hossz-szelvény (esésgörbe)
      </text>

      <line x1="0" x2="640" y1="208" y2="208" stroke="var(--line)" />

      {/* ---------- 0: V-valley cross-section ---------- */}
      <motion.g initial={false} animate={show(0)} transition={t}>
        <text x="20" y="232" fontSize="13" fontWeight="700" fill="var(--ink)">
          keresztmetszet
        </text>
        <path d="M150 222 L300 372 L340 372 L490 222 L490 392 L150 392 Z" fill={LAND} />
        <path d="M300 372 L340 372 L334 364 L306 364 Z" fill={SEA} />
        <circle cx="314" cy="384" r="5" fill="var(--muted)" />
        <circle cx="328" cy="386" r="4" fill="var(--muted)" />
        <line x1="320" x2="320" y1="270" y2="350" stroke="var(--accent)" strokeWidth="3" />
        <polygon points={head(320, 358, 90, 12)} fill="var(--accent)" />
        <text x="320" y="240" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--accent)">
          bevágódás
        </text>
        <text x="320" y="258" textAnchor="middle" fontSize="13" fill="var(--muted)">
          (mélyítő erózió)
        </text>
        <text x="200" y="262" textAnchor="end" fontSize="14" fontWeight="700" fill="var(--ink)">
          V alakú völgy
        </text>
        <text x="505" y="250" fontSize="13" fill="var(--ink)">
          nagy esés,
        </text>
        <text x="505" y="268" fontSize="13" fill="var(--ink)">
          gyors sodrás,
        </text>
        <text x="505" y="286" fontSize="13" fill="var(--ink)">
          durva hordalék
        </text>
        <text x="505" y="304" fontSize="13" fill="var(--ink)">
          (görgeteg)
        </text>
      </motion.g>

      {/* ---------- 1: meanders (plan view) ---------- */}
      <motion.g initial={false} animate={show(1)} transition={t}>
        <text x="20" y="232" fontSize="13" fontWeight="700" fill="var(--ink)">
          felülnézet
        </text>
        <rect x="20" y="242" width="600" height="148" rx="6" fill={VEG} fillOpacity={0.25} />
        <path d="M20 316 C90 316 100 262 170 262 S250 370 320 370 S400 262 470 262 S550 316 620 316" fill="none" stroke={SEA} strokeWidth="12" strokeLinecap="round" />
        {/* point bars (inner bank) */}
        <path d="M150 276 Q170 268 190 276 Q170 284 150 276 Z" fill={LAND} stroke="var(--ink)" strokeWidth="0.8" />
        <path d="M300 356 Q320 364 340 356 Q320 348 300 356 Z" fill={LAND} stroke="var(--ink)" strokeWidth="0.8" />
        {/* erosion on outer bank */}
        <path d="M150 250 Q170 244 190 250" fill="none" stroke="#D64545" strokeWidth="3.5" />
        <polygon points={head(170, 240, -90, 10)} fill="#D64545" />
        <path d="M300 382 Q320 388 340 382" fill="none" stroke="#D64545" strokeWidth="3.5" />
        <polygon points={head(320, 394, 90, 10)} fill="#D64545" />
        <text x="200" y="250" fontSize="13" fontWeight="700" fill="#D64545">
          külső ív: kimosás (alámosott part)
        </text>
        <text x="352" y="356" fontSize="13" fontWeight="700" fill="var(--ink)">
          belső ív: lerakás (övzátony)
        </text>
        <text x="530" y="364" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--accent)">
          oldalazás →
        </text>
        <text x="530" y="382" textAnchor="middle" fontSize="13" fill="var(--ink)">
          kanyarulatok, szélesedő völgy
        </text>
      </motion.g>

      {/* ---------- 2: lower course ---------- */}
      <motion.g initial={false} animate={show(2)} transition={t}>
        <text x="20" y="232" fontSize="13" fontWeight="700" fill="var(--ink)">
          felülnézet
        </text>
        <rect x="20" y="242" width="600" height="148" rx="6" fill={VEG} fillOpacity={0.25} />
        <text x="600" y="262" textAnchor="end" fontSize="13" fill="var(--muted)">
          ártér (széles, sík völgytalp)
        </text>
        <path d="M20 330 C100 330 130 290 200 296 C260 302 260 350 330 350 C390 350 420 300 480 300 C540 300 560 330 620 330" fill="none" stroke={SEA} strokeWidth="16" strokeLinecap="round" />
        {/* oxbow lake */}
        <path d="M240 284 C245 236 325 236 330 284" fill="none" stroke={SEA} strokeWidth="10" strokeLinecap="round" opacity="0.85" />
        <text x="285" y="246" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--ink)">
          holtág (lefűződött kanyarulat)
        </text>
        {/* sandbars */}
        {[
          [120, 318],
          [400, 330],
          [520, 307],
        ].map(([x, y]) => (
          <ellipse key={x} cx={x} cy={y} rx="16" ry="4" fill={LAND} stroke="var(--ink)" strokeWidth="0.8" />
        ))}
        <line x1="400" x2="420" y1="335" y2="362" stroke="var(--ink)" />
        <text x="424" y="372" fontSize="13.5" fontWeight="700" fill="var(--ink)">
          zátonyok
        </text>
        <text x="40" y="372" fontSize="14" fontWeight="700" fill="var(--accent)">
          feltöltés:
        </text>
        <text x="40" y="388" fontSize="13" fill="var(--ink)">
          kis esés, lassú víz, finom hordalék
        </text>
      </motion.g>

      {/* ---------- 3: mouth types ---------- */}
      <motion.g initial={false} animate={show(3)} transition={t}>
        {/* delta */}
        <rect x="20" y="222" width="290" height="170" rx="6" fill={SEA} fillOpacity={0.85} />
        <path d="M20 222 H310 V262 L250 272 L230 300 L200 330 L165 342 L130 330 L95 304 L70 276 L20 262 Z" fill={LAND} />
        <path d="M165 222 L165 262 M165 262 L120 320 M165 262 L165 336 M165 262 L210 318 M165 262 L95 290 M165 262 L240 285" fill="none" stroke={SEA} strokeWidth="4" strokeLinecap="round" />
        <text x="165" y="370" textAnchor="middle" fontSize="14" fontWeight="700" fill="#DCEBF5">
          delta (pl. Duna, Nílus)
        </text>
        <text x="165" y="386" textAnchor="middle" fontSize="13" fill="#DCEBF5">
          sok hordalék, gyenge árapály
        </text>
        {/* estuary */}
        <rect x="330" y="222" width="290" height="170" rx="6" fill={SEA} fillOpacity={0.85} />
        <path d="M330 222 H620 V300 L520 300 L475 232 L465 232 L420 300 L330 300 Z" fill={LAND} />
        <path d="M470 222 L470 232" stroke={SEA} strokeWidth="10" />
        <path d="M478 250 l0 30 M462 250 l0 30" stroke="#DCEBF5" strokeWidth="2" strokeDasharray="4 4" />
        <polygon points={head(478, 248, -90, 8)} fill="#DCEBF5" />
        <polygon points={head(462, 282, 90, 8)} fill="#DCEBF5" />
        <text x="475" y="342" textAnchor="middle" fontSize="14" fontWeight="700" fill="#DCEBF5">
          tölcsértorkolat (pl. Temze, Elba)
        </text>
        <text x="475" y="360" textAnchor="middle" fontSize="13" fill="#DCEBF5">
          az árapály kimossa a hordalékot
        </text>
      </motion.g>
    </svg>
  );
}
