import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const LAND = '#C9B79C';
const VEG = '#5E9C5A';
const WARM = '#D64545';
const COLD = '#2563EB';

const CX = 205;
const CY = 205;

type Trend = 1 | 0 | -1;
const STAGES: { name: string; desc: [string, string]; core: number; ring: number; arrows: [number, number]; trend: [Trend, Trend, Trend] }[] = [
  { name: 'urbanizáció', desc: ['a vidéki népesség', 'a városokba áramlik'], core: 60, ring: 84, arrows: [186, 70], trend: [1, 1, -1] },
  { name: 'szuburbanizáció', desc: ['kiköltözés a városmagból', 'az elővárosokba'], core: 52, ring: 124, arrows: [58, 112], trend: [-1, 1, 0] },
  { name: 'dezurbanizáció', desc: ['a nagyváros egésze fogy,', 'a vidék, kisvárosok nőnek'], core: 46, ring: 118, arrows: [120, 184], trend: [-1, -1, 1] },
  { name: 'reurbanizáció', desc: ['visszaáramlás a megújuló', 'belvárosokba'], core: 56, ring: 116, arrows: [160, 66], trend: [1, -1, 0] },
];
const ANGLES = [20, 65, 110, 155, 200, 245, 290, 335];

function head(x: number, y: number, deg: number, s = 10) {
  const a = (deg * Math.PI) / 180;
  const p = (r: number, da: number) => `${(x - r * Math.cos(a + da)).toFixed(1)},${(y - r * Math.sin(a + da)).toFixed(1)}`;
  return `${x},${y} ${p(s, 0.45)} ${p(s, -0.45)}`;
}

function TrendMark({ v }: { v: Trend }) {
  if (v === 0) return <text fontSize="16" fontWeight="700" fill="var(--muted)">≈</text>;
  return (
    <text fontSize="16" fontWeight="700" fill={v > 0 ? VEG : WARM}>
      {v > 0 ? '▲ nő' : '▼ fogy'}
    </text>
  );
}

export default function Urbanization({ step = 0, reduced = false }: DiagramProps) {
  const s = Math.max(0, Math.min(3, step));
  const st = STAGES[s]!;
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };
  const houses = ANGLES.map((a) => {
    const r = ((a + 22.5) * Math.PI) / 180;
    return [CX + 172 * Math.cos(r), CY + 172 * Math.sin(r)] as const;
  });

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={`A városfejlődés szakaszai, ${s + 1}. szakasz – ${st.name}: ${st.desc.join(' ')}.`} style={{ fontFamily: 'inherit' }}>
      <rect width="640" height="400" fill="var(--paper)" />

      {/* rural surroundings */}
      <circle cx={CX} cy={CY} r="195" fill={VEG} fillOpacity="0.14" />
      {houses.map(([x, y], i) => (
        <motion.g key={i} initial={false} animate={{ scale: s === 2 ? 1.35 : 1 }} transition={t} style={{ transformOrigin: `${x}px ${y}px` }}>
          <path d={`M${x - 8} ${y + 7} V${y - 1} L${x} ${y - 9} L${x + 8} ${y - 1} V${y + 7} Z`} fill={LAND} stroke="var(--ink)" strokeWidth="1" />
        </motion.g>
      ))}
      <text x="22" y="30" fontSize="13.5" fontWeight="700" fill="var(--ink)">
        vidék (falvak, kisvárosok)
      </text>

      {/* suburbs ring */}
      <motion.circle cx={CX} cy={CY} initial={false} animate={{ r: st.ring }} transition={t} fill={LAND} fillOpacity="0.45" stroke="var(--ink)" strokeDasharray="5 4" />
      {/* core */}
      <motion.circle cx={CX} cy={CY} initial={false} animate={{ r: st.core }} transition={t} fill={LAND} stroke="var(--ink)" strokeWidth="1.5" />
      <text x={CX} y={CY + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ink)" style={{ paintOrder: 'stroke' }} stroke="var(--paper)" strokeWidth="3">
        városmag
      </text>
      <motion.text x={CX} initial={false} animate={{ y: CY - (st.core + st.ring) / 2 + 5 }} transition={t} textAnchor="middle" fontSize="13" fill="var(--ink)" style={{ paintOrder: 'stroke' }} stroke="var(--paper)" strokeWidth="3">
        elővárosok
      </motion.text>

      {/* migration arrows */}
      {STAGES.map((g, k) => (
        <motion.g key={g.name} initial={false} animate={{ opacity: k === s ? 1 : 0 }} transition={t}>
          {ANGLES.filter((_, i) => i !== 6).map((a) => {
            const r = (a * Math.PI) / 180;
            const [r1, r2] = g.arrows;
            const x1 = CX + r1 * Math.cos(r);
            const y1 = CY + r1 * Math.sin(r);
            const x2 = CX + r2 * Math.cos(r);
            const y2 = CY + r2 * Math.sin(r);
            const deg = r2 > r1 ? a : a + 180;
            return (
              <g key={a}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLD} strokeWidth="3.2" strokeLinecap="round" />
                <polygon points={head(x2, y2, deg, 12)} fill={COLD} />
              </g>
            );
          })}
        </motion.g>
      ))}

      {/* right panel */}
      <g>
        <text x="430" y="62" fontSize="13" fill="var(--muted)">
          {s + 1}. szakasz
        </text>
        <text x="430" y="86" fontSize="19" fontWeight="700" fill="var(--accent)">
          {st.name}
        </text>
        <text x="430" y="110" fontSize="13" fill="var(--ink)">
          {st.desc[0]}
        </text>
        <text x="430" y="127" fontSize="13" fill="var(--ink)">
          {st.desc[1]}
        </text>
        <line x1="430" x2="630" y1="150" y2="150" stroke="var(--line)" />
        <text x="430" y="172" fontSize="13" fontWeight="700" fill="var(--muted)">
          népességszám változása
        </text>
        {['városmag', 'elővárosok', 'vidék'].map((label, i) => (
          <g key={label} transform={`translate(430 ${204 + i * 34})`}>
            <text y="0" fontSize="14" fill="var(--ink)">
              {label}
            </text>
            <g transform="translate(110 0)">
              <TrendMark v={st.trend[i]!} />
            </g>
          </g>
        ))}
        <g transform="translate(430 330)">
          <line x1="0" x2="26" y1="0" y2="0" stroke={COLD} strokeWidth="3.2" />
          <polygon points={head(34, 0, 0, 12)} fill={COLD} />
          <text x="44" y="4.5" fontSize="13" fill="var(--ink)">
            népességáramlás
          </text>
        </g>
      </g>
    </svg>
  );
}
