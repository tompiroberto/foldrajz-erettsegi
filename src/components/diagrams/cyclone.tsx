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

function Arrow({ x1, y1, x2, y2, c = 'var(--ink)', w = 2.5, h = 10 }: { x1: number; y1: number; x2: number; y2: number; c?: string; w?: number; h?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - h * 0.8 * Math.cos(a)} y2={y2 - h * 0.8 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <polygon points={head(x2, y2, a, h)} fill={c} />
    </g>
  );
}

const SUN = '#F2C14E';
const ICE = '#DCEBF5';
const WARM = '#D64545';
const COLD = '#2563EB';

const AX = 160;
const CXR = 480;
const CY = 146;

/** Spirál nyíl: r0→r1, θ0→θ1 (fok; növekvő θ = óramutató járása a képernyőn). */
function Spiral({ cx, r0, r1, a0, a1, c }: { cx: number; r0: number; r1: number; a0: number; a1: number; c: string }) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const f = i / 24;
    const r = r0 + (r1 - r0) * f;
    const a = ((a0 + (a1 - a0) * f) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a) * 1.15, CY + r * Math.sin(a) * 0.9]);
  }
  const end = pts[pts.length - 1]!;
  const pre = pts[pts.length - 3]!;
  const ang = Math.atan2(end[1] - pre[1], end[0] - pre[0]);
  const d = pts.slice(0, -1).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <g>
      <path d={d} fill="none" stroke={c} strokeWidth={3} strokeLinecap="round" />
      <polygon points={head(end[0], end[1], ang, 12)} fill={c} />
    </g>
  );
}

function Isobars({ cx, values }: { cx: number; values: string[] }) {
  return (
    <g>
      {[34, 68, 102].map((r, i) => (
        <g key={r}>
          <ellipse cx={cx} cy={CY} rx={r * 1.15} ry={r * 0.9} fill="none" stroke="var(--ink)" strokeWidth={1.3} strokeOpacity={0.7} />
          <Txt x={cx} y={CY - r * 0.9 + 4} s={12} c="var(--muted)">
            {values[i]}
          </Txt>
        </g>
      ))}
    </g>
  );
}

function Cloud({ x, y, k = 1 }: { x: number; y: number; k?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${k})`}>
      <path d="M-30,10 a14,14 0 0 1 4,-24 a18,18 0 0 1 32,-6 a14,14 0 0 1 24,12 a11,11 0 0 1 0,18 Z" fill={ICE} stroke="var(--muted)" strokeWidth={1.5} />
    </g>
  );
}

const ARIA = [
  'Anticiklon: a leszálló levegő felmelegszik, a felszínen magas légnyomás alakul ki.',
  'Anticiklon az északi félgömbön: a levegő a középpontból az óramutató járásával megegyező irányban kiáramlik.',
  'Ciklon: a felszálló levegő lehűl, a felszínen alacsony légnyomás alakul ki.',
  'Ciklon az északi félgömbön: a levegő az óramutató járásával ellentétes irányban a középpont felé áramlik.',
  'Időjárás: az anticiklonban derült, száraz, a ciklonban felhős, csapadékos idő van.',
];

export default function Cyclone({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(4, step));
  const t: Transition = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' };
  const leftOn = s <= 1 || s === 4;
  const rightOn = s >= 2;
  const show = (on: boolean) => ({ initial: false as const, animate: { opacity: on ? 1 : 0 }, transition: t });

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={ARIA[s]}>
      <Txt x={320} y={24} s={12} c="var(--muted)">
        északi félgömb
      </Txt>
      <line x1={320} y1={34} x2={320} y2={390} stroke="var(--line)" strokeWidth={1} />

      {/* ANTICIKLON */}
      <motion.g initial={false} animate={{ opacity: leftOn ? 1 : 0.35 }} transition={t}>
        <Txt x={AX} y={24} s={15} w={700}>
          Anticiklon (M)
        </Txt>
        <ellipse cx={AX} cy={CY} rx={120} ry={95} fill={WARM} fillOpacity={0.1} />
        <Isobars cx={AX} values={['1025', '1020', '1015']} />
        <Txt x={AX} y={CY + 10} s={28} w={800} c={WARM}>
          M
        </Txt>
        <motion.g {...show(s >= 1)}>
          {[0, 90, 180, 270].map((a) => (
            <Spiral key={a} cx={AX} r0={22} r1={112} a0={a + 20} a1={a + 95} c={WARM} />
          ))}
          <Txt x={AX} y={266} s={12} w={700}>
            kiáramlás, az óramutató járásával
          </Txt>
          <Txt x={AX} y={281} s={12} w={700}>
            megegyező irányban
          </Txt>
        </motion.g>
        {/* függőleges vázlat */}
        <line x1={40} y1={370} x2={280} y2={370} stroke="var(--ink)" strokeWidth={2} />
        {[-14, 14].map((dx) => (
          <Arrow key={dx} x1={AX + dx} y1={296} x2={AX + dx} y2={346} c={WARM} />
        ))}
        <Arrow x1={AX - 10} y1={360} x2={AX - 90} y2={360} c={WARM} />
        <Arrow x1={AX + 10} y1={360} x2={AX + 90} y2={360} c={WARM} />
        <Txt x={AX + 30} y={312} a="start" s={12}>
          leszálló, melegedő,
        </Txt>
        <Txt x={AX + 30} y={327} a="start" s={12}>
          szárazodó levegő
        </Txt>
        <Txt x={AX} y={389} s={12} c="var(--muted)">
          oldalnézet
        </Txt>
      </motion.g>

      {/* CIKLON */}
      <motion.g initial={false} animate={{ opacity: rightOn ? 1 : 0.35 }} transition={t}>
        <Txt x={CXR} y={24} s={15} w={700}>
          Ciklon (A)
        </Txt>
        <ellipse cx={CXR} cy={CY} rx={120} ry={95} fill={COLD} fillOpacity={0.1} />
        <Isobars cx={CXR} values={['995', '1000', '1005']} />
        <Txt x={CXR} y={CY + 10} s={28} w={800} c={COLD}>
          A
        </Txt>
        <motion.g {...show(s >= 3)}>
          {[0, 90, 180, 270].map((a) => (
            <Spiral key={a} cx={CXR} r0={112} r1={24} a0={a + 20} a1={a - 55} c={COLD} />
          ))}
          <Txt x={CXR} y={266} s={12} w={700}>
            beáramlás, az óramutató járásával
          </Txt>
          <Txt x={CXR} y={281} s={12} w={700}>
            ellentétes irányban
          </Txt>
        </motion.g>
        <motion.g {...show(s >= 2)}>
          <line x1={360} y1={370} x2={600} y2={370} stroke="var(--ink)" strokeWidth={2} />
          <Arrow x1={CXR - 90} y1={360} x2={CXR - 12} y2={360} c={COLD} />
          <Arrow x1={CXR + 90} y1={360} x2={CXR + 12} y2={360} c={COLD} />
          {[-12, 12].map((dx) => (
            <Arrow key={dx} x1={CXR + dx} y1={350} x2={CXR + dx} y2={322} c={COLD} />
          ))}
          <Cloud x={CXR - 4} y={318} k={0.75} />
          <Txt x={CXR + 34} y={330} a="start" s={12}>
            felszálló, hűlő levegő:
          </Txt>
          <Txt x={CXR + 34} y={345} a="start" s={12}>
            felhőképződés
          </Txt>
          <Txt x={CXR} y={389} s={12} c="var(--muted)">
            oldalnézet
          </Txt>
        </motion.g>
      </motion.g>

      {/* IDŐJÁRÁS */}
      <motion.g {...show(s === 4)}>
        <g transform="translate(276,62)">
          <circle r={14} fill={SUN} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={Math.cos(a) * 18} y1={Math.sin(a) * 18} x2={Math.cos(a) * 25} y2={Math.sin(a) * 25} stroke={SUN} strokeWidth={2.5} strokeLinecap="round" />;
          })}
        </g>
        <Txt x={276} y={108} s={12} w={700}>
          derült, száraz
        </Txt>
        <Cloud x={598} y={58} k={0.8} />
        {[586, 596, 606, 616].map((x) => (
          <line key={x} x1={x} y1={70} x2={x - 5} y2={84} stroke={COLD} strokeWidth={2.5} strokeLinecap="round" />
        ))}
        <Txt x={604} y={108} s={12} w={700}>
          felhős,
        </Txt>
        <Txt x={604} y={123} s={12} w={700}>
          csapadékos
        </Txt>
      </motion.g>
    </svg>
  );
}
