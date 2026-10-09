import { motion, type Transition } from 'framer-motion';
import type { ReactNode } from 'react';
import type { DiagramProps } from './types';

const halo = { stroke: 'var(--paper-2)', strokeWidth: 4, paintOrder: 'stroke', strokeLinejoin: 'round' } as const;

function Txt({ x, y, children, a = 'middle', s = 13, c = 'var(--ink)', w = 500 }: { x: number; y: number; children: ReactNode; a?: 'start' | 'middle' | 'end'; s?: number; c?: string; w?: number }) {
  return (
    <text x={x} y={y} textAnchor={a} fontSize={s} fill={c} fontWeight={w} style={halo}>
      {children}
    </text>
  );
}

function head(x: number, y: number, ang: number, h = 10) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return `${x},${y} ${x - h * c + (h / 2) * s},${y - h * s - (h / 2) * c} ${x - h * c - (h / 2) * s},${y - h * s + (h / 2) * c}`;
}

function Arrow({ x1, y1, x2, y2, c = 'var(--ink)', w = 3, h = 11 }: { x1: number; y1: number; x2: number; y2: number; c?: string; w?: number; h?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - h * 0.8 * Math.cos(a)} y2={y2 - h * 0.8 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <polygon points={head(x2, y2, a, h)} fill={c} />
    </g>
  );
}

const LAND = '#C9B79C';
const MAGMA = '#E4572E';
const SEA = '#4A90C2';

const HOT_X = 470;
const SPACING = 125;
const SEA_Y = 130;
const FLOOR = 212;
const PLATE_BOTTOM = 252;
/** "Idő" lépésenként: hány vulkánnyi utat tett meg a lemez. */
const TIME = [0, 0, 1, 3];
const HEIGHTS = [132, 112, 96, 86];
const NAMES = ['Kauai', 'Oahu', 'Maui', 'Hawaii'];
const AGES = ['kb. 5 millió év', 'kb. 3 millió év', 'kb. 1 millió év', 'aktív'];

const cone = (h: number) => {
  const w = h * 0.62 + 12;
  return `M${-w},${FLOOR} L-7,${FLOOR - h} L7,${FLOOR - h} L${w},${FLOOR} Z`;
};

function label(k: number, s: number): [string, string] | null {
  const T = TIME[s] ?? 0;
  if (s === 0 || k > T) return null;
  const age = T - k;
  if (s === 3) return [NAMES[k] ?? '', AGES[k] ?? ''];
  return age === 0 ? ['aktív vulkán', 'a forró pont fölött'] : ['kialudt vulkán', 'elsodródott'];
}

const ARIA = [
  'Forró pont: a köpeny mélyéből helyhez kötött, forró anyagáram (köpenycsóva) emelkedik a mozgó kőzetlemez alá.',
  'A forró pont fölött a lemezen átolvadó magma vulkánt épít.',
  'A lemez továbbcsúszik, a vulkán eltávolodik a forró ponttól és kialszik, a forró pont fölött új vulkán kezd épülni.',
  'Vulkánlánc a Hawaii-szigetek példáján: a szigetek kora a forró ponttól a lemezmozgás irányában távolodva nő.',
];

export default function Hotspot({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(3, step));
  const T = TIME[s] ?? 0;
  const t: Transition = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' };
  const ticks = Array.from({ length: 50 }, (_, i) => -800 + i * 40);

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={ARIA[s]}>
      <defs>
        <clipPath id="hotspot-plate">
          <rect x={0} y={FLOOR} width={640} height={PLATE_BOTTOM - FLOOR} />
        </clipPath>
      </defs>
      {/* asztenoszféra */}
      <rect x={0} y={PLATE_BOTTOM} width={640} height={400 - PLATE_BOTTOM} fill={MAGMA} fillOpacity={0.2} />
      {/* köpenycsóva */}
      <path
        d={`M${HOT_X - 22},400 C${HOT_X - 18},340 ${HOT_X - 14},310 ${HOT_X - 16},288 C${HOT_X - 60},284 ${HOT_X - 80},266 ${HOT_X - 66},${PLATE_BOTTOM} L${HOT_X + 66},${PLATE_BOTTOM} C${HOT_X + 80},266 ${HOT_X + 60},284 ${HOT_X + 16},288 C${HOT_X + 14},310 ${HOT_X + 18},340 ${HOT_X + 22},400 Z`}
        fill={MAGMA}
        fillOpacity={0.85}
      />
      {[0, 1].map((i) => (
        <Arrow key={i} x1={HOT_X - 6 + i * 12} y1={392} x2={HOT_X - 6 + i * 12} y2={330} c="var(--paper-2)" w={2} h={8} />
      ))}

      {/* tenger */}
      <rect x={0} y={SEA_Y} width={640} height={FLOOR - SEA_Y} fill={SEA} fillOpacity={0.85} />
      <Txt x={624} y={SEA_Y - 6} a="end" s={12}>
        tengerszint
      </Txt>

      {/* óceáni lemez, mozgó jelölésekkel */}
      <rect x={0} y={FLOOR} width={640} height={PLATE_BOTTOM - FLOOR} fill="var(--muted)" fillOpacity={0.6} />
      <g clipPath="url(#hotspot-plate)">
        <motion.g initial={false} animate={{ x: -T * SPACING }} transition={t}>
          {ticks.map((x) => (
            <line key={x} x1={x} y1={FLOOR + 4} x2={x + 14} y2={PLATE_BOTTOM - 4} stroke="var(--ink)" strokeOpacity={0.25} strokeWidth={2} />
          ))}
        </motion.g>
      </g>
      <line x1={0} y1={PLATE_BOTTOM} x2={640} y2={PLATE_BOTTOM} stroke="var(--ink)" strokeWidth={1} />
      <line x1={0} y1={FLOOR} x2={640} y2={FLOOR} stroke="var(--ink)" strokeWidth={1} />

      {/* magma feláramlása a lemezen át (csak a forró pont fölött) */}
      <motion.path
        d={`M${HOT_X},${PLATE_BOTTOM + 6} C${HOT_X - 6},${PLATE_BOTTOM - 20} ${HOT_X + 6},${FLOOR - 40} ${HOT_X},${FLOOR - HEIGHTS[0]! + 4}`}
        fill="none"
        stroke={MAGMA}
        strokeWidth={6}
        strokeLinecap="round"
        initial={false}
        animate={{ opacity: s >= 1 ? 1 : 0 }}
        transition={t}
      />

      {/* vulkánok */}
      {[0, 1, 2, 3].map((k) => {
        const visible = s >= 1 && k <= T;
        const age = Math.max(0, T - k);
        const lab = label(k, s);
        const active = visible && age === 0;
        return (
          <motion.g key={k} initial={false} animate={{ x: HOT_X - age * SPACING, opacity: visible ? 1 : 0 }} transition={t}>
            <motion.path initial={false} animate={{ d: cone(visible ? HEIGHTS[age]! : 40) }} transition={t} fill={LAND} stroke="var(--ink)" strokeWidth={1.2} />
            <motion.path
              initial={false}
              animate={{ opacity: active ? 1 : 0 }}
              transition={t}
              d={`M-4,${FLOOR} L-4,${FLOOR - HEIGHTS[0]! + 4} L4,${FLOOR - HEIGHTS[0]! + 4} L4,${FLOOR} Z`}
              fill={MAGMA}
            />
            {lab && (
              <motion.g key={`${s}-${k}`} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={t}>
                <Txt x={0} y={FLOOR - HEIGHTS[age]! - 26} w={700}>
                  {lab[0]}
                </Txt>
                <Txt x={0} y={FLOOR - HEIGHTS[age]! - 10} s={12}>
                  {lab[1]}
                </Txt>
              </motion.g>
            )}
          </motion.g>
        );
      })}

      {/* lemezmozgás iránya */}
      <Arrow x1={250} y1={232} x2={130} y2={232} c="var(--ink)" w={3.5} h={13} />
      <Txt x={190} y={274}>
        a lemez mozgásának iránya
      </Txt>
      <Txt x={HOT_X - 64} y={328} a="end" w={700}>
        forró pont
      </Txt>
      <Txt x={HOT_X - 64} y={345} a="end" s={12}>
        helyben maradó,
      </Txt>
      <Txt x={HOT_X - 64} y={361} a="end" s={12}>
        feláramló köpenyanyag
      </Txt>
      <Txt x={24} y={388} a="start" s={12} c="var(--muted)">
        földköpeny (asztenoszféra)
      </Txt>
      <Txt x={590} y={238} s={12}>
        óceáni lemez
      </Txt>

      <motion.g initial={false} animate={{ opacity: s === 3 ? 1 : 0 }} transition={t}>
        <Arrow x1={420} y1={52} x2={110} y2={52} c="var(--accent)" w={3} />
        <Txt x={265} y={44} w={700} c="var(--ink)">
          egyre idősebb, lepusztuló szigetek
        </Txt>
      </motion.g>

      <Txt x={16} y={26} a="start" s={15} w={700}>
        Forró pont
      </Txt>
    </svg>
  );
}
