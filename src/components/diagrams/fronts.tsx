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

function CArrow({ d, x, y, a, c, w = 3.5 }: { d: string; x: number; y: number; a: number; c: string; w?: number }) {
  return (
    <g>
      <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />
      <polygon points={head(x, y, a, 13)} fill={c} />
    </g>
  );
}

const LAND = '#C9B79C';
const ICE = '#DCEBF5';
const WARM = '#D64545';
const COLD = '#2563EB';
const GROUND = 330;

function Rain({ x0, x1, y0, y1, gap = 12, heavy = false }: { x0: number; x1: number; y0: number; y1: number; gap?: number; heavy?: boolean }) {
  const xs: number[] = [];
  for (let x = x0; x <= x1; x += gap) xs.push(x);
  return (
    <g>
      {xs.map((x, i) => (
        <line key={x} x1={x} y1={y0 + (i % 2) * 8} x2={x - (heavy ? 6 : 3)} y2={y1} stroke={COLD} strokeWidth={heavy ? 2.5 : 1.6} strokeDasharray={heavy ? undefined : '6 5'} strokeLinecap="round" />
      ))}
    </g>
  );
}

function Title({ t, sub }: { t: string; sub: string }) {
  return (
    <g>
      <Txt x={16} y={26} a="start" s={15} w={700}>
        {t}
      </Txt>
      <Txt x={16} y={44} a="start" s={12}>
        {sub}
      </Txt>
    </g>
  );
}

const WARM_FRONT = 'M140,330 C300,292 470,200 630,108';
const COLD_FRONT = 'M372,330 C384,312 366,286 336,258 C292,218 220,170 0,142';

const ARIA = [
  'Melegfront keresztmetszete: a meleg levegő lassan, enyhe lejtésű frontfelületen felsiklik a hideg levegőre.',
  'Melegfront felhőzete: pehely-, fátyol-, lepel- és réteges esőfelhők, a front előtt széles sávban tartós, csendes eső.',
  'Hidegfront keresztmetszete: a hideg levegő ék alakban a meleg levegő alá nyomul, és azt meredeken felemeli.',
  'Hidegfront időjárása: tornyos zivatarfelhő, zápor, zivatar, viharos széllökések, majd lehűlés.',
];

export default function Fronts({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(3, step));
  const t: Transition = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' };
  const show = (on: boolean) => ({ initial: false as const, animate: { opacity: on ? 1 : 0 }, transition: t });
  const warm = s <= 1;

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={ARIA[s]}>
      {/* ===== MELEGFRONT ===== */}
      <motion.g {...show(warm)}>
        <path d={`M0,0 L640,0 L640,108 L630,108 C470,200 300,292 140,330 L0,330 Z`} fill={WARM} fillOpacity={0.14} />
        <path d={`${WARM_FRONT} L640,108 L640,330 Z`} fill={COLD} fillOpacity={0.2} />
        <path d={WARM_FRONT} fill="none" stroke="var(--ink)" strokeWidth={2} />
        <CArrow d="M40,300 C220,282 410,196 548,124" x={560} y={117} a={-0.5} c={WARM} />
        <Txt x={80} y={220} w={700} c={WARM}>
          meleg levegő
        </Txt>
        <Txt x={540} y={300} w={700} c={COLD}>
          hideg levegő
        </Txt>
        <motion.g {...show(s === 0)}>
          <Txt x={232} y={236} s={12}>
            lassan felsikló meleg levegő
          </Txt>
          <Txt x={470} y={232} a="start" s={12}>
            enyhe lejtésű
          </Txt>
          <Txt x={470} y={247} a="start" s={12}>
            frontfelület
          </Txt>
        </motion.g>
        <motion.g {...show(s === 1)}>
          {/* réteges esőfelhő (Ns) */}
          <rect x={150} y={258} width={196} height={36} rx={18} fill="var(--muted)" fillOpacity={0.95} />
          <Rain x0={160} x1={336} y0={296} y1={GROUND} />
          {/* lepelfelhő (As) */}
          <rect x={318} y={200} width={150} height={26} rx={13} fill={ICE} fillOpacity={0.9} />
          {/* fátyolfelhő (Cs) */}
          <rect x={448} y={156} width={120} height={14} rx={7} fill={ICE} fillOpacity={0.7} />
          {/* pehelyfelhő (Ci) */}
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M${560 + k * 18},${116 - k * 8} q14,-14 30,-10`} fill="none" stroke={ICE} strokeWidth={3} strokeLinecap="round" />
          ))}
          <Txt x={248} y={250} s={12} w={700}>
            réteges esőfelhő (Ns)
          </Txt>
          <Txt x={393} y={194} s={12}>
            lepelfelhő (As)
          </Txt>
          <Txt x={508} y={150} s={12}>
            fátyolfelhő (Cs)
          </Txt>
          <Txt x={596} y={80} s={12}>
            pehelyfelhő (Ci)
          </Txt>
          <Txt x={250} y={362} w={700}>
            tartós, csendes eső
          </Txt>
        </motion.g>
        <Title t="Melegfront" sub="a meleg levegő lassan felsiklik a hideg levegőre" />
      </motion.g>

      {/* ===== HIDEGFRONT ===== */}
      <motion.g {...show(!warm)}>
        <path d="M0,0 L640,0 L640,330 L372,330 C384,312 366,286 336,258 C292,218 220,170 0,142 Z" fill={WARM} fillOpacity={0.14} />
        <path d={`${COLD_FRONT} L0,330 Z`} fill={COLD} fillOpacity={0.22} />
        <path d={COLD_FRONT} fill="none" stroke="var(--ink)" strokeWidth={2} />
        <Arrow x1={40} y1={300} x2={300} y2={300} c={COLD} w={4} h={14} />
        <motion.g {...show(s === 2)}>
          <CArrow d="M560,318 C470,312 420,280 404,200 C398,160 400,130 404,104" x={405} y={92} a={-Math.PI / 2 + 0.05} c={WARM} />
        </motion.g>
        <Txt x={120} y={250} w={700} c={COLD}>
          hideg levegő
        </Txt>
        <Txt x={560} y={220} w={700} c={WARM}>
          meleg levegő
        </Txt>
        <Txt x={170} y={322} s={12}>
          ék alakban benyomuló hideg levegő
        </Txt>
        <motion.g {...show(s === 2)}>
          <Txt x={420} y={148} a="start" s={12}>
            a meleg levegő
          </Txt>
          <Txt x={420} y={163} a="start" s={12}>
            gyorsan felemelkedik
          </Txt>
          <Txt x={250} y={206} a="start" s={12}>
            meredek
          </Txt>
          <Txt x={250} y={221} a="start" s={12}>
            frontfelület
          </Txt>
        </motion.g>
        <motion.g {...show(s === 3)}>
          {/* zivatarfelhő (Cb) */}
          <path d="M318,84 L566,70 L520,96 L372,98 Z" fill={ICE} stroke="var(--muted)" strokeWidth={1.5} />
          {[[400, 266, 28], [444, 262, 24], [366, 262, 22], [420, 226, 32], [394, 186, 28], [438, 176, 26], [416, 136, 30], [424, 104, 22]].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={ICE} />
          ))}
          <path d="M432,292 l-10,16 l9,0 l-10,20" fill="none" stroke="#F2C14E" strokeWidth={3} strokeLinejoin="round" />
          <Rain x0={344} x1={456} y0={290} y1={GROUND} gap={10} heavy />
          <Arrow x1={474} y1={318} x2={540} y2={318} c={COLD} w={2.5} />
          <Arrow x1={480} y1={304} x2={546} y2={296} c={COLD} w={2.5} />
          <Txt x={520} y={110} a="start" s={12}>
            zivatarfelhő
          </Txt>
          <Txt x={520} y={125} a="start" s={12}>
            (gomoly, Cb)
          </Txt>
          <Txt x={400} y={360} w={700}>
            zápor, zivatar
          </Txt>
          <Txt x={530} y={360} w={700}>
            széllökések
          </Txt>
          <Txt x={110} y={380} s={12}>
            utána lehűlés, kitisztulás
          </Txt>
        </motion.g>
        <Title t="Hidegfront" sub="a hideg levegő ék alakban a meleg levegő alá nyomul" />
      </motion.g>

      {/* felszín és a front mozgása */}
      <rect x={0} y={GROUND} width={640} height={12} fill={LAND} />
      <Arrow x1={470} y1={384} x2={540} y2={384} c="var(--ink)" w={2.5} />
      <Txt x={548} y={388} a="start" s={12}>
        a front mozgása
      </Txt>
      {/* frontjel a felszínen */}
      <motion.g initial={false} animate={{ x: warm ? 140 : 372 }} transition={t}>
        {warm ? (
          <path d="M-14,330 a7,7 0 0 1 14,0 Z M0,330 a7,7 0 0 1 14,0 Z" fill={WARM} />
        ) : (
          <path d="M-14,330 L-7,316 L0,330 Z M0,330 L7,316 L14,330 Z" fill={COLD} />
        )}
      </motion.g>
    </svg>
  );
}
