import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const VEG = '#5E9C5A';
const WARM = '#D64545';

const X0 = 70;
const X1 = 590;
const Y0 = 96; // top of plot
const Y1 = 326; // baseline
const SW = (X1 - X0) / 5;
const px = (st: number) => X0 + st * SW;
const pyRate = (r: number) => Y1 - (r / 50) * (Y1 - Y0);
const pyPop = (p: number) => Y1 - (p / 44) * (Y1 - Y0);

type P = [number, number];
const BIRTH: P[] = [[0, 40], [0.5, 41], [1, 40], [1.5, 40], [2, 38.5], [2.5, 31], [3, 19], [3.5, 13.5], [4, 12], [4.5, 9.5], [5, 8.5]];
const DEATH: P[] = [[0, 37], [0.25, 40.5], [0.5, 35], [0.75, 41], [1, 37], [1.5, 28], [2, 18], [2.5, 13], [3, 11], [3.5, 10], [4, 10], [4.5, 11], [5, 12.5]];
const POP: P[] = [[0, 4], [1, 5], [1.5, 8], [2, 13], [2.5, 21], [3, 30], [3.5, 35.5], [4, 38], [4.5, 38.5], [5, 37]];

/** Smooth path through points (Catmull-Rom → cubic Bézier). */
function smooth(pts: [number, number][]) {
  let d = `M${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]!.toFixed(1)} ${c1[1]!.toFixed(1)} ${c2[0]!.toFixed(1)} ${c2[1]!.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const birthPts = BIRTH.map(([s, r]) => [px(s), pyRate(r)] as [number, number]);
const deathPts = DEATH.map(([s, r]) => [px(s), pyRate(r)] as [number, number]);
const popPts = POP.map(([s, p]) => [px(s), pyPop(p)] as [number, number]);
const BIRTH_D = smooth(birthPts);
const DEATH_D = smooth(deathPts);
const POP_D = smooth(popPts);
// Area between the two rate curves (natural increase).
const GAP_D = `${BIRTH_D} L${px(5)} ${pyRate(12.5)} ${smooth([...deathPts].reverse()).replace(/^M[^C]+/, '')} Z`;

const STAGES = [['magas születés', 'és halálozás'], ['népesség-', 'robbanás'], ['lassuló', 'növekedés'], ['alacsony születés', 'és halálozás'], ['fogyás,', 'öregedés']];
const ARIA = [
  'magas a születési és a halálozási arány is, a népesség alig nő',
  'a halálozási arány gyorsan csökken, a születési magas marad: népességrobbanás',
  'a születési arány is csökkenni kezd, a növekedés lassul',
  'alacsony a születési és a halálozási arány, a népesség stagnál',
  'a születési arány a halálozási alá esik: népességfogyás és öregedés',
];

export default function Demographic({ step = 0, reduced = false }: DiagramProps) {
  const s = Math.max(0, Math.min(4, step));
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };
  const draw = reduced ? false : { pathLength: 0 };

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={`A demográfiai átmenet modellje, ${s + 1}. szakasz: ${ARIA[s]}.`} style={{ fontFamily: 'inherit' }}>
      <rect width="640" height="400" fill="var(--paper)" />

      {/* stage highlight */}
      <motion.rect initial={false} animate={{ x: px(s) }} transition={t} y={18} width={SW} height={Y1 - 18} rx="6" fill="var(--accent)" fillOpacity="0.13" stroke="var(--accent)" strokeOpacity="0.55" />

      {/* stage headers & separators */}
      {STAGES.map((name, i) => (
        <g key={i}>
          {i > 0 && <line x1={px(i)} x2={px(i)} y1={22} y2={Y1} stroke="var(--line)" strokeDasharray="4 4" />}
          <text x={px(i + 0.5)} y={38} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={i === s ? 'var(--accent)' : 'var(--ink)'}>
            {i + 1}. szakasz
          </text>
          {name.map((line, k) => (
            <text key={k} x={px(i + 0.5)} y={55 + k * 15} textAnchor="middle" fontSize="12.5" fill={i === s ? 'var(--ink)' : 'var(--muted)'} fontWeight={i === s ? 700 : 400}>
              {line}
            </text>
          ))}
        </g>
      ))}

      {/* natural increase area */}
      <path d={GAP_D} fill={VEG} fillOpacity="0.16" />
      <text x={px(2.05)} y={pyRate(26)} textAnchor="middle" fontSize="12.5" fill="var(--muted)">
        természetes
      </text>
      <text x={px(2.05)} y={pyRate(26) + 15} textAnchor="middle" fontSize="12.5" fill="var(--muted)">
        szaporodás
      </text>

      {/* curves */}
      <motion.path d={POP_D} fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeDasharray="8 5" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={t} />
      <motion.path d={BIRTH_D} fill="none" stroke={VEG} strokeWidth="3.2" initial={draw} animate={{ pathLength: 1 }} transition={t} />
      <motion.path d={DEATH_D} fill="none" stroke={WARM} strokeWidth="3.2" initial={draw} animate={{ pathLength: 1 }} transition={t} />

      {/* axes */}
      <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke="var(--ink)" />
      <line x1={X0} x2={X0} y1={Y0 - 6} y2={Y1} stroke="var(--ink)" />
      <line x1={X1} x2={X1} y1={Y0 - 6} y2={Y1} stroke="var(--ink)" strokeDasharray="3 3" />
      {[0, 10, 20, 30, 40, 50].map((r) => (
        <text key={r} x={X0 - 6} y={pyRate(r) + 4.5} textAnchor="end" fontSize="12.5" fill="var(--muted)">
          {r}
        </text>
      ))}
      <text x={X0 - 6} y={Y0 - 14} textAnchor="end" fontSize="13" fontWeight="700" fill="var(--ink)">
        ‰
      </text>
      <text transform={`translate(${X1 + 18} ${(Y0 + Y1) / 2}) rotate(90)`} textAnchor="middle" fontSize="12.5" fill="var(--muted)">
        népességszám →
      </text>
      <text x={(X0 + X1) / 2} y={Y1 + 18} textAnchor="middle" fontSize="12.5" fill="var(--muted)">
        idő →
      </text>

      {/* legend */}
      <g fontSize="13" fill="var(--ink)">
        <line x1="70" x2="96" y1="372" y2="372" stroke={VEG} strokeWidth="3.2" />
        <text x="102" y="376.5">születési arányszám</text>
        <line x1="258" x2="284" y1="372" y2="372" stroke={WARM} strokeWidth="3.2" />
        <text x="290" y="376.5">halálozási arányszám</text>
        <line x1="452" x2="478" y1="372" y2="372" stroke="var(--ink)" strokeWidth="2.6" strokeDasharray="8 5" />
        <text x="484" y="376.5">népességszám</text>
      </g>
    </svg>
  );
}
