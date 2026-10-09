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

const LAND = '#C9B79C';
const SUN = '#F2C14E';
const WARM = '#D64545';
const VEG = '#5E9C5A';
const ICE = '#DCEBF5';
const SEA = '#4A90C2';

const GROUND = 320;

/** Hullámos sugárzásvonal (n periódus, a vége egyenes a nyílhegynek). */
function wave(x1: number, y1: number, x2: number, y2: number, n: number, amp: number) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const pts: string[] = [];
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t < 0.9 ? amp * Math.sin(2 * Math.PI * n * t) : 0;
    const x = x1 + (x2 - x1) * t * 0.97 - uy * a;
    const y = y1 + (y2 - y1) * t * 0.97 + ux * a;
    pts.push(`${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

function Head({ ang, c, h = 12 }: { ang: number; c: string; h?: number }) {
  const co = Math.cos(ang);
  const si = Math.sin(ang);
  return <polygon points={`0,0 ${-h * co + (h / 2) * si},${-h * si - (h / 2) * co} ${-h * co - (h / 2) * si},${-h * si + (h / 2) * co}`} fill={c} />;
}

/** Statikus hullámnyíl. */
function WaveArrow({ x1, y1, x2, y2, n, amp, c, w = 3 }: { x1: number; y1: number; x2: number; y2: number; n: number; amp: number; c: string; w?: number }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <path d={wave(x1, y1, x2, y2, n, amp)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />
      <g transform={`translate(${x2},${y2})`}>
        <Head ang={ang} c={c} />
      </g>
    </g>
  );
}

/** Függőleges hosszúhullámú nyíl, amelynek a vége animálható. */
function VArrow({ x, y1, y2, c, t, w = 3.5, opacity = 1 }: { x: number; y1: number; y2: number; c: string; t: Transition; w?: number; opacity?: number }) {
  const ang = y2 < y1 ? -Math.PI / 2 : Math.PI / 2;
  return (
    <motion.g initial={false} animate={{ opacity }} transition={t}>
      <motion.path initial={false} animate={{ d: wave(x, y1, x, y2, 4, 7) }} transition={t} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />
      <motion.g initial={false} animate={{ x, y: y2 }} transition={t}>
        <Head ang={ang} c={c} h={13} />
      </motion.g>
    </motion.g>
  );
}

const ARIA = [
  'Üvegházhatás: a Napból rövidhullámú sugárzás érkezik, amelyet a levegő alig nyel el.',
  'A sugárzás egy részét a felhők és a világos felszínek visszaverik (albedó), a többit a felszín elnyeli.',
  'A felmelegedett felszín hosszúhullámú hősugárzást bocsát ki, és alulról melegíti a levegőt.',
  'Az üvegházgázok (szén-dioxid, vízgőz, metán) elnyelik a hosszúhullámú sugárzást, és egy részét visszasugározzák a felszín felé.',
  'Fokozódó üvegházhatás: több üvegházgáz több hőt sugároz vissza, ezért melegszik a légkör.',
];

export default function Greenhouse({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(4, step));
  const t: Transition = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' };
  const show = (on: boolean) => ({ initial: false as const, animate: { opacity: on ? 1 : 0 }, transition: t });

  const layerTop = s >= 4 ? 112 : 142;
  const layerBot = s >= 4 ? 218 : 190;
  const longEnd = s <= 2 ? 40 : layerBot + 2;
  const thermo = [18, 28, 46, 64, 88][s]!;

  // molekulák (CO₂ szerű hármasok)
  const mols = Array.from({ length: 22 }, (_, i) => ({
    x: 20 + ((i * 89) % 600),
    y: 0.12 + ((i * 37) % 76) / 100,
    extra: i >= 12,
  }));

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={ARIA[s]}>
      {/* légkör */}
      <rect x={0} y={60} width={640} height={GROUND - 60} fill={SEA} fillOpacity={0.12} />
      <Txt x={320} y={24} s={12} c="var(--muted)">
        világűr
      </Txt>
      <Txt x={50} y={250} a="start" s={12} c="var(--muted)">
        légkör
      </Txt>

      {/* üvegházgáz-réteg */}
      <motion.g {...show(s >= 3)}>
        <motion.rect x={0} width={640} fill="var(--muted)" initial={false} animate={{ y: layerTop, height: layerBot - layerTop, fillOpacity: s >= 4 ? 0.32 : 0.2 }} transition={t} />
        {mols.map((m, i) => (
          <motion.g key={i} initial={false} animate={{ opacity: !m.extra || s >= 4 ? 1 : 0, y: layerTop + m.y * (layerBot - layerTop) }} transition={t}>
            <circle cx={m.x - 6} cy={0} r={3} fill="var(--ink)" />
            <circle cx={m.x} cy={0} r={4} fill={WARM} />
            <circle cx={m.x + 6} cy={0} r={3} fill="var(--ink)" />
          </motion.g>
        ))}
        <motion.g initial={false} animate={{ y: (layerTop + layerBot) / 2 }} transition={t}>
          <Txt x={556} y={-2} w={700}>
            üvegházgázok
          </Txt>
          <Txt x={556} y={14} s={12}>
            CO₂, H₂O, CH₄
          </Txt>
        </motion.g>
      </motion.g>

      {/* felszín */}
      <rect x={0} y={GROUND} width={640} height={400 - GROUND} fill={LAND} />
      <motion.rect x={0} y={GROUND} width={640} height={400 - GROUND} fill={WARM} initial={false} animate={{ fillOpacity: [0, 0.12, 0.25, 0.32, 0.45][s]! }} transition={t} />
      <rect x={0} y={GROUND} width={640} height={6} fill={VEG} />
      <rect x={300} y={GROUND} width={62} height={8} fill={ICE} />

      {/* Nap */}
      <circle cx={56} cy={56} r={32} fill={SUN} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <line key={i} x1={56 + Math.cos(a) * 38} y1={56 + Math.sin(a) * 38} x2={56 + Math.cos(a) * 48} y2={56 + Math.sin(a) * 48} stroke={SUN} strokeWidth={3} strokeLinecap="round" />;
      })}

      {/* rövidhullámú beérkező sugárzás */}
      <WaveArrow x1={92} y1={92} x2={196} y2={GROUND - 2} n={11} amp={4} c={SUN} />
      <WaveArrow x1={104} y1={82} x2={262} y2={GROUND - 2} n={12} amp={4} c={SUN} />
      <WaveArrow x1={116} y1={72} x2={330} y2={GROUND - 2} n={13} amp={4} c={SUN} />
      <Txt x={200} y={92} a="start" w={700}>
        rövidhullámú napsugárzás
      </Txt>
      <motion.g {...show(s === 0)}>
        <Txt x={200} y={108} a="start" s={12}>
          a levegő alig nyeli el, átengedi
        </Txt>
      </motion.g>

      {/* visszaverődés és elnyelődés */}
      <motion.g {...show(s >= 1)}>
        <WaveArrow x1={332} y1={GROUND - 4} x2={398} y2={64} n={12} amp={4} c={SUN} w={2.5} />
        <Txt x={352} y={180} a="end">
          visszaverődés
        </Txt>
        <Txt x={352} y={196} a="end" s={12}>
          (albedó, kb. 30%)
        </Txt>
        {[196, 262].map((x) => (
          <circle key={x} cx={x} cy={GROUND + 4} r={12} fill={WARM} fillOpacity={0.55} />
        ))}
        <Txt x={230} y={GROUND + 32} w={700}>
          elnyelődés: a felszín felmelegszik
        </Txt>
      </motion.g>

      {/* hosszúhullámú kisugárzás */}
      <motion.g {...show(s >= 2)}>
        <VArrow x={420} y1={GROUND - 2} y2={longEnd} c={WARM} t={t} />
        <VArrow x={490} y1={GROUND - 2} y2={longEnd} c={WARM} t={t} />
        <VArrow x={600} y1={GROUND - 2} y2={40} c={WARM} t={t} w={s >= 4 ? 2 : 3.5} opacity={s >= 4 ? 0.55 : 1} />
        <Txt x={630} y={24} a="end" w={700}>
          hosszúhullámú hősugárzás
        </Txt>
      </motion.g>

      {/* visszasugárzás */}
      <motion.g {...show(s >= 3)}>
        <VArrow x={446} y1={layerBot + 2} y2={GROUND - 4} c={WARM} t={t} w={3} />
        <VArrow x={516} y1={layerBot + 2} y2={GROUND - 4} c={WARM} t={t} w={3} />
        <Txt x={560} y={262} w={700}>
          vissza-
        </Txt>
        <Txt x={560} y={278} w={700}>
          sugárzás
        </Txt>
      </motion.g>
      <motion.g {...show(s >= 4)}>
        <VArrow x={394} y1={layerBot + 2} y2={GROUND - 4} c={WARM} t={t} w={3} />
        <Txt x={320} y={GROUND + 60} w={700}>
          több üvegházgáz → erősebb visszasugárzás → melegebb légkör
        </Txt>
      </motion.g>

      {/* hőmérő */}
      <g>
        <rect x={20} y={206} width={14} height={100} rx={7} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.2} />
        <motion.rect x={24} width={6} rx={3} fill={WARM} initial={false} animate={{ y: 306 - thermo, height: thermo }} transition={t} />
        <circle cx={27} cy={312} r={11} fill={WARM} stroke="var(--ink)" strokeWidth={1.2} />
      </g>
    </svg>
  );
}
