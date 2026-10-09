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

function Arrow({ x1, y1, x2, y2, c = 'var(--ink)', w = 2.5, h = 10, dash }: { x1: number; y1: number; x2: number; y2: number; c?: string; w?: number; h?: number; dash?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - h * 0.8 * Math.cos(a)} y2={y2 - h * 0.8 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
      <polygon points={head(x2, y2, a, h)} fill={c} />
    </g>
  );
}

const SEA = '#4A90C2';
const WARM = '#D64545';
const COLD = '#2563EB';

const CX = 232;
const CY = 200;
const R = 124;
const RI = 138;
const RO = 180;

const P = (r: number, lat: number): [number, number] => {
  const a = (lat * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};
const latY = (lat: number) => CY - R * Math.sin((lat * Math.PI) / 180);
const halfW = (y: number) => Math.sqrt(Math.max(0, R * R - (y - CY) * (y - CY)));

/** Egy cirkulációs cella a gömb peremén: felszínen a süllyedés felől a felszállás felé. */
function Cell({ sink, rise, c }: { sink: number; rise: number; c: string }) {
  const m = 2.5;
  const dir = rise > sink ? 1 : -1;
  const a = sink + dir * m;
  const b = rise - dir * m;
  const r1 = RI + 6;
  const r2 = RO - 6;
  const [x1, y1] = P(r1, a);
  const [x2, y2] = P(r1, b);
  const [x3, y3] = P(r2, b);
  const [x4, y4] = P(r2, a);
  // növekvő szélesség = az óramutatóval ellentétes ív (sweep 0)
  const sweepIn = dir > 0 ? 0 : 1;
  const sweepOut = 1 - sweepIn;
  const d = `M${x1},${y1} A${r1},${r1} 0 0 ${sweepIn} ${x2},${y2} L${x3},${y3} A${r2},${r2} 0 0 ${sweepOut} ${x4},${y4} Z`;
  const mid = (a + b) / 2;
  const tangent = (lat: number, sign: number) => {
    const rad = (lat * Math.PI) / 180;
    return Math.atan2(-Math.cos(rad) * sign, -Math.sin(rad) * sign);
  };
  const [hx1, hy1] = P(r1, mid);
  const [hx2, hy2] = P(r2, mid);
  const [rx, ry] = P((r1 + r2) / 2, b);
  const [sx, sy] = P((r1 + r2) / 2, a);
  const radial = (lat: number, out: boolean) => {
    const rad = (lat * Math.PI) / 180;
    return Math.atan2(-Math.sin(rad) * (out ? 1 : -1), Math.cos(rad) * (out ? 1 : -1));
  };
  return (
    <g>
      <path d={d} fill="none" stroke={c} strokeWidth={2.5} />
      <polygon points={head(hx1, hy1, tangent(mid, dir), 10)} fill={c} />
      <polygon points={head(hx2, hy2, tangent(mid, -dir), 10)} fill={c} />
      <polygon points={head(rx, ry, radial(b, true), 9)} fill={c} />
      <polygon points={head(sx, sy, radial(a, false), 9)} fill={c} />
    </g>
  );
}

function Belt({ lat, text, letter }: { lat: number; text?: string; letter: 'A' | 'M' }) {
  const [x, y] = P(RO + 12, lat);
  const col = letter === 'A' ? WARM : COLD;
  return (
    <g>
      <Txt x={x} y={y + 5} a="start" s={15} w={800} c={col}>
        {letter}
      </Txt>
      {text && (
        <Txt x={x + 16} y={y + 5} a="start" s={13} w={600}>
          {text}
        </Txt>
      )}
    </g>
  );
}

/** Felszíni szélnyilak egy szélességi sávban. dx, dy: a nyíl iránya (képernyőn). */
function Winds({ y, xs, dx, dy, c }: { y: number; xs: number[]; dx: number; dy: number; c: string }) {
  return (
    <g>
      {xs.map((x) => (
        <Arrow key={x} x1={x - dx} y1={y - dy} x2={x + dx} y2={y + dy} c={c} w={3} h={11} />
      ))}
    </g>
  );
}

const ARIA = [
  'Az Egyenlítő mentén a felmelegedett levegő felszáll, ott alacsony nyomású öv alakul ki.',
  'A felszállt levegő a térítők felé áramlik, és a térítők környékén leszáll: térítői magas nyomású öv.',
  'A felszínen a térítői magas nyomásból a passzátszelek fújnak az Egyenlítő felé.',
  'A mérsékelt övezetben a nyugatias szelek fújnak a térítői magas nyomású övből a 60. szélességi kör körüli alacsony nyomású öv felé.',
  'A sarkokon a hideg, leszálló levegő magas nyomást hoz létre, innen fújnak a sarki keleti szelek.',
  'Az eltérítő erő (Coriolis-erő) az északi félgömbön jobbra, a délin balra téríti el a szeleket, ezért ÉK-i és DK-i a passzát, nyugatias a mérsékelt övi szél.',
];

export default function Circulation({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(5, step));
  const t: Transition = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' };
  const show = (on: boolean) => ({ initial: false as const, animate: { opacity: on ? 1 : 0 }, transition: t });

  const yTrN = (latY(0) + latY(30)) / 2;
  const yWeN = (latY(30) + latY(60)) / 2;
  const yPoN = (latY(60) + latY(90)) / 2 + 3;
  const yTrS = (latY(0) + latY(-30)) / 2;
  const yWeS = (latY(-30) + latY(-60)) / 2;
  const yPoS = (latY(-60) + latY(-90)) / 2 - 3;

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={ARIA[s]}>
      {/* földgömb */}
      <circle cx={CX} cy={CY} r={R} fill={SEA} fillOpacity={0.45} stroke="var(--ink)" strokeWidth={1.5} />
      <motion.rect x={CX - R} y={CY - 14} width={2 * R} height={28} fill={WARM} initial={false} animate={{ fillOpacity: s === 0 ? 0.35 : 0.15 }} transition={t} clipPath="url(#circ-globe)" />
      <defs>
        <clipPath id="circ-globe">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>
      {[-60, -30, 0, 30, 60].map((lat) => {
        const y = latY(lat);
        const hw = halfW(y);
        return (
          <g key={lat}>
            <line x1={CX - hw} y1={y} x2={CX + hw} y2={y} stroke="var(--ink)" strokeWidth={lat === 0 ? 1.6 : 1} strokeOpacity={0.6} strokeDasharray={lat === 0 ? undefined : '4 4'} />
            <Txt x={CX + hw - 4} y={y - 4} a="end" s={12} c="var(--ink)">
              {lat === 0 ? '0°' : `${Math.abs(lat)}° ${lat > 0 ? 'É' : 'D'}`}
            </Txt>
          </g>
        );
      })}

      {/* 0 – egyenlítői felszálló ág */}
      <motion.g {...show(s >= 0)}>
        <Belt lat={0} letter="A" text="egyenlítői alacsony nyomás" />
        {s === 0 && (
          <g>
            {[-1, 1].map((k) => {
              const [x1, y1] = P(RI, k * 4);
              const [x2, y2] = P(RO, k * 4);
              return <Arrow key={k} x1={x1} y1={y1} x2={x2} y2={y2} c={WARM} />;
            })}
            <Txt x={CX + 160} y={CY + 40} a="start" s={12}>
              felszálló meleg levegő
            </Txt>
          </g>
        )}
      </motion.g>

      {/* 1 – Hadley-cellák és térítői magas nyomás */}
      <motion.g {...show(s >= 1)}>
        <Cell sink={30} rise={0} c={WARM} />
        <Cell sink={-30} rise={0} c={WARM} />
        <Belt lat={30} letter="M" text="térítői magas nyomás" />
        <Belt lat={-30} letter="M" />
      </motion.g>

      {/* 2 – passzát */}
      <motion.g {...show(s >= 2)}>
        <Winds y={yTrN} xs={[160, 232, 304]} dx={-18} dy={9} c={WARM} />
        <Winds y={yTrS} xs={[160, 232, 304]} dx={-18} dy={-9} c={WARM} />
        <Txt x={CX - halfW(yTrN) - 6} y={yTrN + 4} a="end" w={700}>
          ÉK-i passzát
        </Txt>
        <Txt x={CX - halfW(yTrS) - 6} y={yTrS + 4} a="end" w={700}>
          DK-i passzát
        </Txt>
      </motion.g>

      {/* 3 – Ferrel-cellák és nyugatias szelek */}
      <motion.g {...show(s >= 3)}>
        <Cell sink={30} rise={60} c="var(--accent)" />
        <Cell sink={-30} rise={-60} c="var(--accent)" />
        <Belt lat={60} letter="A" text="mérsékelt övi alacsony nyomás" />
        <Belt lat={-60} letter="A" />
        <Winds y={yWeN} xs={[180, 262]} dx={18} dy={-8} c="var(--accent)" />
        <Winds y={yWeS} xs={[180, 262]} dx={18} dy={8} c="var(--accent)" />
        <Txt x={CX - halfW(yWeN) - 6} y={yWeN + 4} a="end" w={700}>
          nyugatias
        </Txt>
        <Txt x={CX - halfW(yWeS) - 6} y={yWeS + 4} a="end" w={700}>
          nyugatias
        </Txt>
      </motion.g>

      {/* 4 – sarki cellák */}
      <motion.g {...show(s >= 4)}>
        <Cell sink={90} rise={60} c={COLD} />
        <Cell sink={-90} rise={-60} c={COLD} />
        <Txt x={CX + 12} y={14} a="start" s={15} w={800} c={COLD}>
          M
        </Txt>
        <Txt x={CX + 28} y={14} a="start" w={600}>
          sarki magas nyomás
        </Txt>
        <Txt x={CX + 12} y={396} a="start" s={15} w={800} c={COLD}>
          M
        </Txt>
        <Winds y={yPoN} xs={[CX]} dx={-14} dy={4} c={COLD} />
        <Winds y={yPoS} xs={[CX]} dx={-14} dy={-4} c={COLD} />
        <Txt x={CX - halfW(yPoN) - 6} y={yPoN + 4} a="end" w={700}>
          sarki szél
        </Txt>
        <Txt x={CX - halfW(yPoS) - 6} y={yPoS + 4} a="end" w={700}>
          sarki szél
        </Txt>
      </motion.g>

      {/* 5 – eltérítő erő */}
      <motion.g {...show(s === 5)}>
        <Arrow x1={330} y1={latY(28)} x2={330} y2={latY(4)} c="var(--ink)" w={2} dash="5 4" />
        <rect x={430} y={226} width={200} height={110} rx={10} fill="var(--paper)" stroke="var(--line)" />
        <Txt x={442} y={248} a="start" w={700}>
          Eltérítő erő
        </Txt>
        <Txt x={442} y={266} a="start" s={12}>
          É-i félgömbön jobbra,
        </Txt>
        <Txt x={442} y={282} a="start" s={12}>
          D-i félgömbön balra
        </Txt>
        <Txt x={442} y={298} a="start" s={12}>
          térül el a szél.
        </Txt>
        <line x1={444} y1={318} x2={472} y2={318} stroke="var(--ink)" strokeWidth={2} strokeDasharray="5 4" />
        <Txt x={478} y={322} a="start" s={12}>
          eltérítés nélkül
        </Txt>
      </motion.g>
    </svg>
  );
}
