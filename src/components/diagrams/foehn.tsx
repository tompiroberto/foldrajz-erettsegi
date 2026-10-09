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

const LAND = '#C9B79C';
const ICE = '#DCEBF5';
const WARM = '#D64545';
const COLD = '#2563EB';

const yH = (m: number) => 360 - m * 0.1;

/** Légáramlás szakaszai: [path, nyílhegy x, y, irány]. */
const SEGS: { d: string; hx: number; hy: number; a: number }[] = [
  { d: 'M62,345 L104,345 L160,258', hx: 160, hy: 258, a: Math.atan2(-87, 56) },
  { d: 'M160,258 L232,160 L294,70 Q320,34 346,70', hx: 346, hy: 70, a: Math.atan2(36, 26) },
  { d: 'M346,70 L408,160', hx: 408, hy: 160, a: Math.atan2(90, 62) },
  { d: 'M408,160 L480,260 L540,345 L628,345', hx: 628, hy: 345, a: 0 },
];
const PARCEL: [number, number][] = [
  [160, 258],
  [320, 44],
  [408, 160],
  [580, 345],
];

type Temp = { x: number; y: number; t: string; a: 'start' | 'middle' | 'end'; from: number; c: string; big?: boolean };
const TEMPS: Temp[] = [
  { x: 64, y: 334, t: '20 °C', a: 'start', from: 0, c: 'var(--ink)' },
  { x: 150, y: 256, t: '10 °C', a: 'end', from: 0, c: 'var(--ink)' },
  { x: 222, y: 158, t: '5 °C', a: 'end', from: 1, c: COLD },
  { x: 320, y: 26, t: '0 °C', a: 'middle', from: 1, c: COLD },
  { x: 420, y: 158, t: '10 °C', a: 'start', from: 3, c: 'var(--ink)' },
  { x: 492, y: 256, t: '20 °C', a: 'start', from: 3, c: WARM },
  { x: 590, y: 332, t: '30 °C', a: 'middle', from: 3, c: WARM, big: true },
];

const ARIA = [
  'Főnszél: a légáramlás eléri a hegységet és felemelkedik; 1000 méterig 100 méterenként 1 °C-ot hűl (20 °C-ról 10 °C-ra).',
  'A szél felőli oldalon 1000 m felett a pára kicsapódik, felhő és csapadék képződik, a levegő már csak 0,5 °C-ot hűl 100 méterenként, a 3000 m-es gerincen 0 °C.',
  'A gerincen átbukó levegő párája nagyrészt kihullott, ezért szárazabb.',
  'A szélárnyékos oldalon a leszálló száraz levegő 100 méterenként 1 °C-ot melegszik, így a hegy lábánál 30 °C-os meleg, száraz szél, a főn fúj.',
];

export default function Foehn({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(3, step));
  const t: Transition = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' };
  const show = (on: boolean) => ({ initial: false as const, animate: { opacity: on ? 1 : 0 }, transition: t });
  const p = PARCEL[s]!;

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={ARIA[s]}>
      <path d={`M0,360 L100,360 L320,${yH(3000)} L540,360 L640,360 L640,400 L0,400 Z`} fill={LAND} stroke="var(--ink)" strokeWidth={1.2} />
      {/* magassági skála */}
      <line x1={50} y1={yH(0)} x2={50} y2={yH(3000)} stroke="var(--ink)" strokeWidth={1.2} />
      {[0, 1000, 2000, 3000].map((m) => (
        <g key={m}>
          <line x1={45} y1={yH(m)} x2={50} y2={yH(m)} stroke="var(--ink)" />
          <Txt x={42} y={yH(m) + 4} a="end" s={12}>
            {`${m} m`}
          </Txt>
        </g>
      ))}

      {/* felhőalap */}
      <line x1={50} y1={yH(1000)} x2={176} y2={yH(1000)} stroke="var(--muted)" strokeWidth={1.4} strokeDasharray="6 4" />
      <Txt x={56} y={yH(1000) + 18} a="start" s={12} c="var(--muted)">
        felhőalap
      </Txt>

      {/* hegység */}
      <Txt x={180} y={388} w={700}>
        szél felőli oldal
      </Txt>
      <Txt x={460} y={388} w={700}>
        szélárnyékos oldal
      </Txt>

      {/* felhő és csapadék a szél felőli oldalon */}
      <motion.g {...show(s >= 1)}>
        {[
          [190, 236, 26],
          [222, 196, 30],
          [252, 154, 30],
          [280, 112, 28],
          [304, 76, 24],
          [170, 252, 18],
          [240, 176, 24],
        ].map(([x, y, r]) => (
          <circle key={`${x}`} cx={x} cy={y} r={r} fill={ICE} fillOpacity={0.92} />
        ))}
        {[176, 194, 212, 230, 248, 266].map((x, i) => {
          const ground = 360 - ((x - 100) * 300) / 220;
          return <line key={x} x1={x} y1={(x < 210 ? 262 : 222 - (x - 210) * 1.2) + (i % 2) * 6} x2={x - 6} y2={ground - 2} stroke={COLD} strokeWidth={2} strokeDasharray="6 5" strokeLinecap="round" />;
        })}
      </motion.g>

      {/* légáramlás */}
      {SEGS.map((sg, i) => (
        <motion.g key={i} {...show(s >= i)}>
          <motion.path d={sg.d} fill="none" stroke={i < 2 ? COLD : WARM} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ pathLength: s >= i ? 1 : 0 }} transition={t} />
          <polygon points={head(sg.hx, sg.hy, sg.a, 13)} fill={i < 2 ? COLD : WARM} />
        </motion.g>
      ))}
      <motion.circle r={9} fill="var(--accent)" stroke="var(--paper-2)" strokeWidth={2} initial={false} animate={{ cx: p[0], cy: p[1] }} transition={t} />

      {/* hőmérsékletek */}
      {TEMPS.map((tp) => (
        <motion.g key={tp.t + tp.x} {...show(s >= tp.from)}>
          <Txt x={tp.x} y={tp.y} a={tp.a} s={tp.big ? 18 : 14} w={800} c={tp.c}>
            {tp.t}
          </Txt>
        </motion.g>
      ))}

      {/* hőmérsékleti gradiensek */}
      <motion.g {...show(s === 0)}>
        <Txt x={150} y={318} a="start" s={12} w={700}>
          −1 °C / 100 m
        </Txt>
        <Txt x={150} y={333} a="start" s={12}>
          (száraz levegő)
        </Txt>
        <Txt x={420} y={60} a="start" w={700}>
          a légáramlás a hegységhez ér
        </Txt>
        <Txt x={420} y={77} a="start" s={12}>
          és felemelkedésre kényszerül
        </Txt>
      </motion.g>
      <motion.g {...show(s >= 1)}>
        <Txt x={196} y={110} a="end" s={12} w={700}>
          −0,5 °C / 100 m
        </Txt>
        <Txt x={196} y={125} a="end" s={12}>
          (kicsapódás)
        </Txt>
      </motion.g>
      <motion.g {...show(s === 1)}>
        <Txt x={300} y={300} w={700} c={COLD}>
          csapadék
        </Txt>
      </motion.g>
      <motion.g {...show(s === 2)}>
        <Txt x={420} y={60} a="start" w={700}>
          a gerincen átbukó levegő
        </Txt>
        <Txt x={420} y={77} a="start" s={12}>
          már szárazabb: párája kihullott
        </Txt>
      </motion.g>
      <motion.g {...show(s === 3)}>
        <Txt x={538} y={294} a="start" s={12} w={700}>
          +1 °C / 100 m
        </Txt>
        <Txt x={538} y={309} a="start" s={12}>
          (száraz levegő)
        </Txt>
        <Txt x={630} y={60} a="end" w={700} c={WARM}>
          főn: meleg, száraz bukószél
        </Txt>
        <Txt x={630} y={77} a="end" s={12}>
          20 °C helyett 30 °C a hegy lábánál
        </Txt>
      </motion.g>
    </svg>
  );
}
