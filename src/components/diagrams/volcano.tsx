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

function Lead({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeWidth={1} />
      <circle cx={x2} cy={y2} r={2.5} fill="var(--ink)" />
    </g>
  );
}

const LAND = '#C9B79C';
const MAGMA = '#E4572E';
const SEA = '#4A90C2';
const SUN = '#F2C14E';
const ICE = '#DCEBF5';

type Pt = [number, number];
const STRATO: Pt[] = [[130, 300], [230, 180], [292, 96], [320, 112], [348, 96], [410, 180], [510, 300]];
const SHIELD: Pt[] = [[30, 300], [150, 246], [284, 210], [320, 218], [356, 210], [490, 246], [610, 300]];
const FISSURE: Pt[] = [[40, 300], [170, 286], [300, 274], [320, 278], [340, 274], [470, 286], [600, 300]];
const SHAPES: Pt[][] = [STRATO, STRATO, SHIELD, FISSURE, STRATO];

const poly = (p: Pt[]) => `M${p.map(([x, y]) => `${x},${y}`).join(' L')} Z`;
const vent = (p: Pt[]) => {
  const top = p[3]![1];
  return `M313,345 L313,${top} L327,${top} L327,345 Z`;
};

const ARIA = [
  'A vulkán felépítése: a mélyben lévő magmakamrából a kürtőn át jut a magma a kúp tetején lévő kráterbe.',
  'Rétegvulkán: meredek kúp váltakozó láva- és hamurétegekből, savanyú, sűrűn folyó magmával és robbanásos kitöréssel.',
  'Pajzsvulkán: lankás, széles kúp, a bázisos, hígan folyó bazaltláva csendesen ömlik ki.',
  'Hasadékvulkán: a láva hosszú hasadék mentén ömlik ki, és vastag lávatakarót, bazaltfennsíkot hoz létre.',
  'Vulkáni utóműködés: gejzír, fumarola, szolfatára és mofetta a kialvóban lévő vulkán körül.',
];
const TITLES = ['A vulkán részei', 'Rétegvulkán', 'Pajzsvulkán', 'Hasadékvulkán', 'Utóműködés'];

export default function Volcano({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(4, step));
  const t: Transition = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' };
  const shape = SHAPES[s]!;
  const show = (on: boolean) => ({ initial: false as const, animate: { opacity: on ? 1 : 0 }, transition: t });

  // Λ-alakú rétegek a rétegvulkán belsejében
  const layers = [1, 2, 3, 4, 5, 6].map((k) => {
    const ay = 104 + k * 26;
    const dx = (300 - ay) * 0.8 + 14;
    return { d: `M${320 - dx},300 L320,${ay} L${320 + dx},300`, lava: k % 2 === 0 };
  });

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={ARIA[s]}>
      <defs>
        <clipPath id="vulkan-fissure">
          <path d={poly(FISSURE)} />
        </clipPath>
        <clipPath id="vulkan-strato">
          <path d={poly(STRATO)} />
        </clipPath>
      </defs>
      {/* kőzetburok */}
      <rect x={0} y={300} width={640} height={100} fill={LAND} fillOpacity={0.55} />
      <line x1={0} y1={300} x2={640} y2={300} stroke="var(--ink)" strokeWidth={1.2} />

      {/* magmakamra */}
      <motion.ellipse cx={320} cy={364} rx={84} ry={24} fill={MAGMA} initial={false} animate={{ fillOpacity: s === 4 ? 0.35 : 0.95 }} transition={t} stroke="var(--ink)" strokeWidth={1} />

      {/* vulkáni kúp (morfol) */}
      <motion.path initial={false} animate={{ d: poly(shape) }} transition={t} fill={LAND} stroke="var(--ink)" strokeWidth={1.5} />

      {/* rétegek a rétegvulkánban */}
      <motion.g {...show(s === 1)} clipPath="url(#vulkan-strato)">
        {layers.map((l) => (
          <path key={l.d} d={l.d} fill="none" stroke={l.lava ? MAGMA : 'var(--muted)'} strokeWidth={l.lava ? 4 : 5} strokeDasharray={l.lava ? undefined : '2 4'} opacity={0.9} />
        ))}
      </motion.g>

      {/* kürtő */}
      <motion.path initial={false} animate={{ d: vent(shape), fillOpacity: s === 4 ? 0.3 : 1 }} transition={t} fill={MAGMA} />

      {/* 0 – részek */}
      <motion.g {...show(s === 0)}>
        <path d="M296,100 C280,130 262,150 246,176" fill="none" stroke={MAGMA} strokeWidth={5} strokeLinecap="round" />
        <Txt x={420} y={80} a="start">
          kráter
        </Txt>
        <Lead x1={416} y1={76} x2={334} y2={104} />
        <Txt x={430} y={230} a="start">
          kürtő
        </Txt>
        <Lead x1={426} y1={226} x2={326} y2={240} />
        <Txt x={430} y={350} a="start">
          magmakamra
        </Txt>
        <Lead x1={426} y1={346} x2={396} y2={358} />
        <Txt x={290} y={262} a="end">
          vulkáni kúp
        </Txt>
        <Txt x={160} y={150} a="end">
          lávafolyás
        </Txt>
        <Lead x1={164} y1={146} x2={252} y2={166} />
        <Txt x={20} y={322} a="start" s={12} c="var(--ink)">
          földkéreg
        </Txt>
      </motion.g>

      {/* 1 – rétegvulkán */}
      <motion.g {...show(s === 1)}>
        <motion.g initial={false} animate={{ y: s === 1 ? 0 : 20 }} transition={t}>
          {[
            [300, 66, 22],
            [332, 52, 27],
            [360, 68, 20],
            [310, 36, 19],
            [348, 24, 20],
            [280, 50, 16],
            [376, 44, 15],
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="var(--muted)" fillOpacity={0.9} />
          ))}
          {[[250, 70], [262, 40], [400, 60], [410, 92], [240, 100]].map(([x, y]) => (
            <circle key={`b${x}`} cx={x} cy={y} r={4} fill="var(--ink)" />
          ))}
        </motion.g>
        <Txt x={404} y={30} a="start" w={700}>
          hamufelhő, vulkáni bombák
        </Txt>
        <Txt x={430} y={140} a="start" s={12}>
          savanyú, sűrűn folyó magma
        </Txt>
        <Txt x={430} y={157} a="start" s={12}>
          robbanásos kitörés
        </Txt>
        <Txt x={430} y={174} a="start" s={12} c="var(--muted)">
          pl. Vezúv, Fudzsi
        </Txt>
        <Txt x={120} y={200} a="end">
          hamuréteg
        </Txt>
        <Lead x1={124} y1={196} x2={226} y2={216} />
        <Txt x={120} y={250} a="end">
          lávaréteg
        </Txt>
        <Lead x1={124} y1={246} x2={196} y2={262} />
        <Txt x={560} y={270} a="middle" s={12}>
          meredek lejtő
        </Txt>
      </motion.g>

      {/* 2 – pajzsvulkán */}
      <motion.g {...show(s === 2)}>
        <path d="M296,212 C250,222 190,236 150,250 C110,266 80,280 56,294" fill="none" stroke={MAGMA} strokeWidth={5} strokeLinecap="round" />
        <path d="M344,212 C390,222 450,236 490,250 C530,266 560,280 584,294" fill="none" stroke={MAGMA} strokeWidth={5} strokeLinecap="round" />
        <path d="M312,212 C314,196 318,190 320,184 C322,190 326,196 328,212 Z" fill={MAGMA} />
        <Txt x={320} y={170} w={700}>
          lávaszökőkút
        </Txt>
        <Txt x={140} y={206} a="middle">
          hígan folyó bazaltláva
        </Txt>
        <Txt x={500} y={206} a="middle">
          lankás, széles kúp
        </Txt>
        <Txt x={320} y={100} s={12}>
          bázisos magma, csendes lávaömlés
        </Txt>
        <Txt x={320} y={118} s={12} c="var(--muted)">
          pl. Hawaii (Mauna Loa)
        </Txt>
      </motion.g>

      {/* 3 – hasadékvulkán */}
      <motion.g {...show(s === 3)}>
        <g clipPath="url(#vulkan-fissure)">
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M0,${296 - k * 8} L640,${296 - k * 8}`} stroke={MAGMA} strokeWidth={3} opacity={0.85} />
          ))}
        </g>
        {[-14, -6, 0, 6, 14].map((dx) => (
          <path key={dx} d={`M${320 + dx - 3},278 L${320 + dx * 1.6},${238 - Math.abs(dx)} L${320 + dx + 3},278 Z`} fill={MAGMA} />
        ))}
        <Txt x={180} y={258} a="middle">
          lávatakaró, bazaltfennsík
        </Txt>
        <Txt x={430} y={252} a="start">
          hasadék (telér)
        </Txt>
        <Lead x1={426} y1={248} x2={328} y2={300} />
        {/* felülnézeti betét */}
        <rect x={420} y={60} width={200} height={110} rx={8} fill="var(--paper)" stroke="var(--line)" />
        <ellipse cx={520} cy={118} rx={86} ry={30} fill={MAGMA} fillOpacity={0.35} />
        <line x1={446} y1={124} x2={594} y2={110} stroke="var(--ink)" strokeWidth={3} />
        {[456, 480, 504, 528, 552, 576].map((x, i) => (
          <circle key={x} cx={x} cy={123 - i * 2.4} r={4} fill={MAGMA} />
        ))}
        <Txt x={430} y={80} a="start" s={12} c="var(--muted)">
          felülnézet
        </Txt>
        <Txt x={520} y={160} s={12}>
          hosszú hasadék, pl. Izland
        </Txt>
      </motion.g>

      {/* 4 – utóműködés */}
      <motion.g {...show(s === 4)}>
        {/* fumarola a kráterben */}
        {[308, 320, 332].map((x, i) => (
          <path key={x} d={`M${x},108 c-6,-10 6,-16 0,-26 c-6,-10 6,-16 0,-26`} fill="none" stroke={ICE} strokeWidth={3} strokeLinecap="round" opacity={0.95 - i * 0.1} />
        ))}
        <Txt x={420} y={60} a="start">
          fumarola (vízgőz)
        </Txt>
        <Lead x1={416} y1={56} x2={336} y2={70} />
        {/* szolfatára */}
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={392 + k * 8} cy={152 + k * 10} r={4} fill={SUN} stroke="var(--ink)" strokeWidth={0.6} />
        ))}
        <path d="M396,150 c-6,-8 6,-12 0,-20" fill="none" stroke={SUN} strokeWidth={2.5} />
        <Txt x={430} y={136} a="start">
          szolfatára (kénes gőz)
        </Txt>
        {/* mofetta */}
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={160 + k * 9} cy={282 - k * 14} r={5 + k * 2} fill="none" stroke="var(--ink)" strokeWidth={2} strokeDasharray="3 2" />
        ))}
        <Txt x={120} y={226} a="end">
          mofetta
        </Txt>
        <Txt x={120} y={242} a="end" s={12}>
          (szén-dioxid)
        </Txt>
        {/* gejzír */}
        <path d="M580,345 C574,330 586,316 580,300" fill="none" stroke={SEA} strokeWidth={4} strokeDasharray="5 4" />
        <path d="M574,300 C572,260 574,220 580,190 C586,220 588,260 586,300 Z" fill={SEA} />
        {[[562, 206], [598, 214], [570, 186], [592, 192]].map(([x, y]) => (
          <circle key={`${x}`} cx={x} cy={y} r={3.5} fill={SEA} />
        ))}
        <Txt x={580} y={174} w={700}>
          gejzír
        </Txt>
        <Txt x={560} y={330} a="end" s={12}>
          felforrósodó talajvíz
        </Txt>
        <Txt x={320} y={392} s={12}>
          kihűlő magmakamra
        </Txt>
      </motion.g>

      <motion.g key={`t${s}`} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={t}>
        <Txt x={16} y={26} a="start" s={15} w={700}>
          {TITLES[s]}
        </Txt>
      </motion.g>
    </svg>
  );
}
