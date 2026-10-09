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

function Arrow({ x1, y1, x2, y2, c = 'var(--ink)', w = 3, h = 12, dash }: { x1: number; y1: number; x2: number; y2: number; c?: string; w?: number; h?: number; dash?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - h * 0.8 * Math.cos(a)} y2={y2 - h * 0.8 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
      <polygon points={head(x2, y2, a, h)} fill={c} />
    </g>
  );
}

const SEA = '#4A90C2';
const LAND = '#C9B79C';
const SUN = '#F2C14E';
const ICE = '#DCEBF5';
const WARM = '#D64545';
const COLD = '#2563EB';
const VEG = '#5E9C5A';

const SURF = 300;
const COAST = 290;

function Cloud({ x, y, k = 1 }: { x: number; y: number; k?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${k})`}>
      <path d="M-30,10 a14,14 0 0 1 4,-24 a18,18 0 0 1 32,-6 a14,14 0 0 1 24,12 a11,11 0 0 1 0,18 Z" fill={ICE} stroke="var(--muted)" strokeWidth={1.5} />
    </g>
  );
}

const ARIA = [
  'Nyáron a szárazföld jobban felmelegszik, mint a tenger, fölötte a levegő felszáll, alacsony nyomás alakul ki.',
  'Nyári monszun: a tenger felől nedves szél fúj a szárazföld felé, a hegyek előterében bőséges eső hull – esős évszak.',
  'Télen a szárazföld gyorsabban lehűl, mint a tenger, fölötte magas nyomás alakul ki.',
  'Téli monszun: a hideg szárazföld felől száraz szél fúj a tenger felé – száraz évszak.',
];

export default function Monsoon({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(3, step));
  const t: Transition = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' };
  const show = (on: boolean) => ({ initial: false as const, animate: { opacity: on ? 1 : 0 }, transition: t });
  const summer = s <= 1;

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={ARIA[s]}>
      {/* levegő a szárazföld fölött */}
      <motion.rect x={COAST} y={0} width={640 - COAST} height={SURF} initial={false} animate={{ fill: summer ? WARM : COLD }} style={{ fillOpacity: 0.14 }} transition={t} />
      <motion.rect x={0} y={0} width={COAST} height={SURF} initial={false} animate={{ fill: summer ? COLD : WARM }} style={{ fillOpacity: 0.08 }} transition={t} />

      {/* Nap */}
      <motion.g initial={false} animate={{ x: summer ? 330 : 90, y: summer ? 46 : 92, scale: summer ? 1 : 0.8 }} transition={t}>
        <circle r={22} fill={SUN} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={Math.cos(a) * 27} y1={Math.sin(a) * 27} x2={Math.cos(a) * 35} y2={Math.sin(a) * 35} stroke={SUN} strokeWidth={3} strokeLinecap="round" />;
        })}
      </motion.g>

      {/* tenger és szárazföld */}
      <rect x={0} y={SURF} width={COAST + 10} height={100} fill={SEA} />
      <path d={`M${COAST},${SURF} L640,${SURF} L640,400 L${COAST + 10},400 Z`} fill={LAND} />
      <path d={`M470,${SURF} L540,190 L572,160 L600,178 L640,196 L640,${SURF} Z`} fill={LAND} stroke="var(--ink)" strokeWidth={1.2} />
      <motion.rect x={COAST} y={SURF - 5} width={180} height={6} initial={false} animate={{ fill: summer ? VEG : LAND }} transition={t} />
      <Txt x={590} y={150} s={12} w={700}>
        hegység
      </Txt>
      <Txt x={150} y={SURF + 40}>
        tenger
      </Txt>
      <Txt x={420} y={SURF + 40}>
        szárazföld
      </Txt>

      {/* nyomásközpontok */}
      <motion.g key={summer ? 'ny' : 'te'} initial={reduced ? false : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={t}>
        <Txt x={400} y={SURF - 22} s={30} w={800} c={summer ? WARM : COLD}>
          {summer ? 'A' : 'M'}
        </Txt>
        <Txt x={150} y={SURF - 22} s={30} w={800} c={summer ? COLD : WARM}>
          {summer ? 'M' : 'A'}
        </Txt>
      </motion.g>

      {/* függőleges mozgás a szárazföld fölött */}
      <motion.g {...show(s === 0 || s === 1)}>
        {[360, 440].map((x) => (
          <Arrow key={x} x1={x} y1={250} x2={x} y2={180} c={WARM} />
        ))}
      </motion.g>
      <motion.g {...show(s === 2 || s === 3)}>
        {[360, 440].map((x) => (
          <Arrow key={x} x1={x} y1={160} x2={x} y2={224} c={COLD} />
        ))}
      </motion.g>

      {/* hőmérséklet-leírás */}
      <motion.g {...show(s === 0)}>
        <Txt x={400} y={166} w={700}>
          erősen felmelegedő szárazföld
        </Txt>
        <Txt x={400} y={150} s={12}>
          felszálló levegő
        </Txt>
        <Txt x={150} y={200} s={12}>
          lassabban melegedő, hűvösebb tenger
        </Txt>
      </motion.g>
      <motion.g {...show(s === 2)}>
        <Txt x={400} y={130} w={700}>
          erősen lehűlő szárazföld
        </Txt>
        <Txt x={400} y={148} s={12}>
          leszálló hideg levegő
        </Txt>
        <Txt x={150} y={200} s={12}>
          lassabban hűlő, melegebb tenger
        </Txt>
      </motion.g>

      {/* nyári monszun */}
      <motion.g {...show(s === 1)}>
        <Arrow x1={40} y1={244} x2={340} y2={244} c={SEA} w={5} h={16} />
        <Arrow x1={440} y1={96} x2={140} y2={96} c="var(--muted)" w={2.5} dash="8 6" />
        <Txt x={180} y={228} w={700}>
          nedves tengeri levegő
        </Txt>
        <Txt x={290} y={86} s={12} c="var(--muted)">
          visszaáramlás a magasban
        </Txt>
        <Cloud x={500} y={140} k={1.1} />
        <Cloud x={455} y={160} k={0.9} />
        {[470, 482, 494, 506, 518, 530].map((x, i) => (
          <line key={x} x1={x} y1={164 + (i % 2) * 6} x2={x - 6} y2={Math.min(298, 300 - 1.57 * (x - 476))} stroke={COLD} strokeWidth={2} strokeDasharray="7 5" strokeLinecap="round" />
        ))}
        <Txt x={420} y={126} a="end" w={700}>
          bőséges eső
        </Txt>
        <Txt x={420} y={142} a="end" s={12}>
          esős évszak
        </Txt>
      </motion.g>

      {/* téli monszun */}
      <motion.g {...show(s === 3)}>
        <Arrow x1={460} y1={244} x2={110} y2={244} c="var(--ink)" w={5} h={16} />
        <Arrow x1={160} y1={96} x2={440} y2={96} c="var(--muted)" w={2.5} dash="8 6" />
        <Txt x={300} y={228} w={700}>
          száraz, hideg szárazföldi szél
        </Txt>
        <Txt x={300} y={86} s={12} c="var(--muted)">
          visszaáramlás a magasban
        </Txt>
        <Txt x={420} y={160} w={700}>
          száraz évszak
        </Txt>
      </motion.g>

      <motion.g key={`t${summer}`} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={t}>
        <Txt x={16} y={26} a="start" s={15} w={700}>
          {summer ? 'Nyár (nyári monszun)' : 'Tél (téli monszun)'}
        </Txt>
        <Txt x={16} y={44} a="start" s={12} c="var(--muted)">
          pl. Dél-Ázsia, India
        </Txt>
      </motion.g>
    </svg>
  );
}
