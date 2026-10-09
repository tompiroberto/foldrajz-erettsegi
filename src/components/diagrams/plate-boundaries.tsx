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

/** Curved arrow: path d plus the arrow head at (x, y) pointing at angle a (radians). */
function CArrow({ d, x, y, a, c = 'var(--ink)', w = 2 }: { d: string; x: number; y: number; a: number; c?: string; w?: number }) {
  return (
    <g>
      <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />
      <polygon points={head(x, y, a, 9)} fill={c} />
    </g>
  );
}

const SEA = '#4A90C2';
const LAND = '#C9B79C';
const MAGMA = '#E4572E';
const OCEANIC = { fill: 'var(--muted)', fillOpacity: 0.6, stroke: 'var(--ink)', strokeWidth: 1 } as const;
const CONT = { fill: LAND, stroke: 'var(--ink)', strokeWidth: 1 } as const;

function Asthenosphere({ top = 150 }: { top?: number }) {
  return (
    <g>
      <rect x={0} y={top} width={640} height={400 - top} fill={MAGMA} fillOpacity={0.22} />
      <Txt x={24} y={388} a="start" s={12} c="var(--muted)">
        asztenoszféra
      </Txt>
    </g>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <Txt x={16} y={26} a="start" s={15} w={700}>
      {children}
    </Txt>
  );
}

/* 0 – távolodó lemezszegély */
function Spreading() {
  return (
    <g>
      <Asthenosphere top={190} />
      <rect x={0} y={80} width={640} height={130} fill={SEA} fillOpacity={0.85} />
      {/* feláramló magma */}
      <path d="M270,400 C285,320 305,260 312,186 L328,186 C335,260 355,320 370,400 Z" fill={MAGMA} fillOpacity={0.85} />
      {/* lemezek: a hátságnál vékonyabbak és magasabbak */}
      <path d="M0,210 L150,200 L260,172 L300,150 L312,170 L312,186 L270,214 L150,252 L0,262 Z" {...OCEANIC} />
      <path d="M640,210 L490,200 L380,172 L340,150 L328,170 L328,186 L370,214 L490,252 L640,262 Z" {...OCEANIC} />
      {/* láva a hasadékban */}
      <path d="M312,186 L314,172 L326,172 L328,186 Z" fill={MAGMA} />
      {/* konvekció */}
      <CArrow d="M296,360 C230,330 170,320 90,330" x={86} y={331} a={Math.PI - 0.1} c={MAGMA} />
      <CArrow d="M344,360 C410,330 470,320 550,330" x={554} y={331} a={0.1} c={MAGMA} />
      <Arrow x1={160} y1={232} x2={90} y2={236} />
      <Arrow x1={480} y1={232} x2={550} y2={236} />
      <Txt x={320} y={66}>óceánközépi hátság</Txt>
      <line x1={320} y1={72} x2={320} y2={146} stroke="var(--ink)" strokeWidth={1} strokeDasharray="3 3" />
      <Txt x={420} y={124} a="start">
        hasadékvölgy (rift)
      </Txt>
      <line x1={416} y1={120} x2={326} y2={166} stroke="var(--ink)" strokeWidth={1} />
      <Txt x={110} y={282}>óceáni lemez</Txt>
      <Txt x={530} y={282}>óceáni lemez</Txt>
      <Txt x={320} y={300} w={700}>
        feláramló magma
      </Txt>
      <Txt x={320} y={316} s={12} c="var(--ink)">
        új óceáni kéreg képződik
      </Txt>
      <Txt x={620} y={100} a="end" s={12} c="var(--ink)">
        tenger
      </Txt>
    </g>
  );
}

/* közös alábukó lemez (óceáni) */
const SLAB = 'M0,206 L282,214 L300,236 L560,400 L486,400 L282,262 L0,252 Z';

function Volcano({ x, base, top, w = 46 }: { x: number; base: number; top: number; w?: number }) {
  return (
    <g>
      <path d={`M${x - w},${base} L${x - 7},${top} L${x + 7},${top} L${x + w},${base} Z`} fill={LAND} stroke="var(--ink)" strokeWidth={1} />
      <path d={`M${x - 3},${base} L${x - 3},${top + 2} L${x + 3},${top + 2} L${x + 3},${base} Z`} fill={MAGMA} />
    </g>
  );
}

/* 1 – óceáni–kontinentális */
function OceanContinent() {
  return (
    <g>
      <Asthenosphere />
      <path d="M0,100 L362,100 L302,240 L0,240 Z" fill={SEA} fillOpacity={0.85} />
      <path d={SLAB} {...OCEANIC} />
      <path d="M302,238 L338,150 L364,96 L640,96 L640,206 L400,206 L332,256 Z" {...CONT} />
      {/* magma: a lemez anyagából felszálló olvadék */}
      <path d="M452,330 C440,290 452,250 446,200 L446,140" fill="none" stroke={MAGMA} strokeWidth={6} strokeLinecap="round" />
      <ellipse cx={447} cy={178} rx={20} ry={11} fill={MAGMA} />
      <Volcano x={447} base={98} top={52} />
      <Volcano x={530} base={98} top={68} w={38} />
      <Arrow x1={110} y1={229} x2={200} y2={229} />
      <Arrow x1={610} y1={160} x2={540} y2={160} />
      <Txt x={120} y={200} s={13}>
        óceáni lemez
      </Txt>
      <Txt x={560} y={190}>kontinentális lemez</Txt>
      <Txt x={300} y={292} a="end" s={13}>
        mélytengeri árok
      </Txt>
      <line x1={300} y1={280} x2={296} y2={240} stroke="var(--ink)" strokeWidth={1} />
      <Txt x={490} y={40} w={700}>
        vulkáni hegység (pl. Andok)
      </Txt>
      <Txt x={400} y={360} a="start" s={13}>
        alábukás (szubdukció)
      </Txt>
      <Txt x={466} y={290} a="start" s={13} c="var(--ink)">
        magma
      </Txt>
      <Txt x={334} y={318} a="end" s={12}>
        földrengések
      </Txt>
      {[[330, 268], [370, 296], [410, 322]].map(([x, y]) => (
        <path key={x} d={`M${x! - 6},${y} L${x! + 6},${y} M${x},${y! - 6} L${x},${y! + 6}`} stroke="var(--ink)" strokeWidth={2} />
      ))}
    </g>
  );
}

/* 2 – óceáni–óceáni */
function OceanOcean() {
  return (
    <g>
      <Asthenosphere />
      <rect x={0} y={100} width={640} height={150} fill={SEA} fillOpacity={0.85} />
      <path d={SLAB} {...OCEANIC} />
      <path d="M302,238 L330,212 L640,206 L640,250 L420,256 L332,256 Z" {...OCEANIC} />
      <path d="M452,330 C440,300 452,280 440,240 L440,160" fill="none" stroke={MAGMA} strokeWidth={6} strokeLinecap="round" />
      <Volcano x={440} base={212} top={74} w={70} />
      <Volcano x={548} base={210} top={92} w={60} />
      <Arrow x1={110} y1={229} x2={200} y2={229} />
      <Arrow x1={620} y1={230} x2={560} y2={230} />
      <Txt x={120} y={200}>óceáni lemez</Txt>
      <Txt x={600} y={274}>óceáni lemez</Txt>
      <Txt x={300} y={292} a="end">
        mélytengeri árok
      </Txt>
      <line x1={300} y1={280} x2={296} y2={240} stroke="var(--ink)" strokeWidth={1} />
      <Txt x={494} y={56} w={700}>
        vulkáni szigetív (pl. Japán)
      </Txt>
      <Txt x={400} y={360} a="start">
        alábukás (szubdukció)
      </Txt>
      <Txt x={460} y={300} a="start">
        magma
      </Txt>
      <Txt x={24} y={94} a="start" s={12} c="var(--ink)">
        tengerszint
      </Txt>
    </g>
  );
}

/* 3 – kontinentális–kontinentális */
function Collision() {
  const folds = [0, 1, 2, 3].map((k) => {
    const y = 150 + k * 22;
    return `M220,${y + 10} C250,${y - 40} 280,${y + 40} 310,${y - 30} S370,${y + 30} 420,${y + 10}`;
  });
  return (
    <g>
      <Asthenosphere />
      {/* maradék óceáni lemez */}
      <path d="M300,250 L340,250 L360,400 L318,400 Z" {...OCEANIC} />
      <path d="M0,140 L210,140 L250,90 L280,52 L300,74 L320,40 L345,70 L370,56 L400,100 L430,140 L640,140 L640,230 L420,230 L380,290 L300,300 L240,230 L0,230 Z" {...CONT} />
      <clipPath id="pb-mtn">
        <path d="M210,140 L250,90 L280,52 L300,74 L320,40 L345,70 L370,56 L400,100 L430,140 L420,230 L380,290 L300,300 L240,230 Z" />
      </clipPath>
      <g clipPath="url(#pb-mtn)">
        {folds.map((d) => (
          <path key={d} d={d} fill="none" stroke="var(--ink)" strokeWidth={1.4} opacity={0.7} />
        ))}
      </g>
      <Arrow x1={60} y1={185} x2={160} y2={185} />
      <Arrow x1={580} y1={185} x2={480} y2={185} />
      <Txt x={110} y={216}>kontinentális lemez</Txt>
      <Txt x={530} y={216}>kontinentális lemez</Txt>
      <Txt x={460} y={60} a="start" w={700}>
        gyűrthegység
      </Txt>
      <Txt x={460} y={78} a="start" s={12}>
        (pl. Himalája, Alpok)
      </Txt>
      <Txt x={410} y={290} a="start" s={12}>
        vastag hegységgyökér
      </Txt>
      <Txt x={300} y={370} a="end" s={12}>
        lebukott óceáni lemez maradványa
      </Txt>
      <Txt x={110} y={128} s={12} c="var(--ink)">
        a felgyűrt üledékek
      </Txt>
      <line x1={160} y1={124} x2={250} y2={140} stroke="var(--ink)" strokeWidth={1} />
    </g>
  );
}

/* 4 – elcsúszó lemezszegély felülnézetben */
function Transform() {
  const quakes: [number, number][] = [
    [320, 112],
    [316, 196],
    [324, 268],
    [320, 330],
  ];
  return (
    <g>
      <rect x={60} y={60} width={260} height={300} fill={LAND} fillOpacity={0.55} stroke="var(--ink)" strokeWidth={1} />
      <rect x={320} y={60} width={260} height={300} fill={LAND} fillOpacity={0.85} stroke="var(--ink)" strokeWidth={1} />
      {/* elvetett patak és út */}
      <path d="M60,150 C140,140 220,170 320,166" fill="none" stroke={SEA} strokeWidth={4} />
      <path d="M320,226 C400,222 480,240 580,232" fill="none" stroke={SEA} strokeWidth={4} />
      <line x1={60} y1={280} x2={320} y2={280} stroke="var(--ink)" strokeWidth={3} strokeDasharray="10 6" />
      <line x1={320} y1={340} x2={580} y2={340} stroke="var(--ink)" strokeWidth={3} strokeDasharray="10 6" />
      <line x1={320} y1={50} x2={320} y2={370} stroke={MAGMA} strokeWidth={3} />
      {quakes.map(([x, y]) => (
        <path
          key={y}
          d={`M${x},${y - 11} L${x + 4},${y - 4} L${x + 11},${y} L${x + 4},${y + 4} L${x},${y + 11} L${x - 4},${y + 4} L${x - 11},${y} L${x - 4},${y - 4} Z`}
          fill="#F2C14E"
          stroke="var(--ink)"
          strokeWidth={1}
        />
      ))}
      <Arrow x1={190} y1={240} x2={190} y2={110} w={4} h={14} />
      <Arrow x1={450} y1={120} x2={450} y2={250} w={4} h={14} />
      <Txt x={190} y={316}>Csendes-óceáni-lemez</Txt>
      <Txt x={450} y={100}>Észak-amerikai-lemez</Txt>
      <Txt x={590} y={150} a="start" s={12}>
        patak
      </Txt>
      <Txt x={590} y={232} a="start" s={12}>
        elvetve
      </Txt>
      <Txt x={590} y={338} a="start" s={12}>
        út
      </Txt>
      <Txt x={320} y={392} w={700}>
        törésvonal (pl. Szent András-törésvonal) – földrengések
      </Txt>
      <Txt x={624} y={26} a="end" s={12} c="var(--muted)">
        felülnézet
      </Txt>
      {/* északjel */}
      <Arrow x1={30} y1={110} x2={30} y2={70} w={2} h={9} />
      <Txt x={30} y={128} s={12}>
        É
      </Txt>
    </g>
  );
}

const TITLES = [
  'Távolodó lemezszegély',
  'Közeledő: óceáni–kontinentális',
  'Közeledő: óceáni–óceáni',
  'Közeledő: kontinentális–kontinentális',
  'Elcsúszó lemezszegély',
];
const ARIA = [
  'Távolodó lemezszegély keresztmetszetben: az óceánközépi hátság hasadékvölgyében feláramló magma új óceáni kérget hoz létre, a lemezek távolodnak.',
  'Óceáni és kontinentális lemez ütközése: az óceáni lemez mélytengeri árokban alábukik, a megolvadó anyagból vulkáni hegység épül.',
  'Két óceáni lemez ütközése: az egyik alábukik, mélytengeri árok és vulkáni szigetív keletkezik.',
  'Két kontinentális lemez ütközése: az üledékek felgyűrődnek, magas gyűrthegység keletkezik.',
  'Elcsúszó lemezszegély felülnézetben: a lemezek egymás mellett ellentétes irányba csúsznak, a törésvonal mentén földrengések vannak.',
];
const SCENES = [Spreading, OceanContinent, OceanOcean, Collision, Transform];

export default function PlateBoundaries({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(SCENES.length - 1, step));
  const t: Transition = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' };
  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={ARIA[s]}>
      {SCENES.map((Scene, i) => (
        <motion.g key={i} initial={false} animate={{ opacity: i === s ? 1 : 0, y: i === s ? 0 : 12 }} transition={t} style={{ pointerEvents: i === s ? 'auto' : 'none' }}>
          <Scene />
        </motion.g>
      ))}
      <motion.g key={`t${s}`} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={t}>
        <Title>{TITLES[s]}</Title>
      </motion.g>
    </svg>
  );
}
