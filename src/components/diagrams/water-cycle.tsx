import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const SEA = '#4A90C2';
const LAND = '#C9B79C';
const VEG = '#5E9C5A';
const SUN = '#F2C14E';
const ICE = '#DCEBF5';

/** Arrowhead triangle at (x, y) pointing toward angle (degrees, 0 = right, 90 = down). */
function head(x: number, y: number, deg: number, s = 9) {
  const a = (deg * Math.PI) / 180;
  const p = (r: number, da: number) => `${(x - r * Math.cos(a + da)).toFixed(1)},${(y - r * Math.sin(a + da)).toFixed(1)}`;
  return `${x},${y} ${p(s, 0.45)} ${p(s, -0.45)}`;
}

const STEPS = [
  'Párolgás: a Nap melege a tengerek és a szárazföld vizét vízgőzzé alakítja.',
  'Kicsapódás: a felemelkedő, lehűlő vízgőzből felhő képződik.',
  'Szállítás: a szél a felhőket a szárazföld fölé viszi.',
  'Csapadék: a hegyek fölött a felhőből eső vagy hó hullik.',
  'Lefolyás és beszivárgás: a víz a felszínen lefolyik, egy része a talajvízbe szivárog.',
  'A folyók és a talajvíz a vizet visszajuttatják a tengerbe.',
];

function Label({ n, x, y, text, active, anchor = 'start' }: { n: number; x: number; y: number; text: string; active: boolean; anchor?: 'start' | 'end' | 'middle' }) {
  const w = text.length * 7.6 + 30;
  const bx = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <g>
      <rect x={bx} y={y - 14} width={w} height={24} rx={12} fill={active ? 'var(--accent)' : 'var(--paper)'} stroke={active ? 'var(--accent)' : 'var(--line)'} />
      <circle cx={bx + 12} cy={y - 2} r={8.5} fill={active ? 'var(--paper)' : 'var(--paper-2)'} />
      <text x={bx + 12} y={y + 2.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={active ? 'var(--accent)' : 'var(--ink)'}>
        {n}
      </text>
      <text x={bx + 25} y={y + 3} fontSize="13.5" fontWeight={active ? 700 : 500} fill={active ? 'var(--paper)' : 'var(--ink)'}>
        {text}
      </text>
    </g>
  );
}

export default function WaterCycle({ step = 0, reduced = false }: DiagramProps) {
  const s = Math.max(0, Math.min(5, step));
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };
  const op = (i: number | number[]) => ((Array.isArray(i) ? i.includes(s) : i === s) ? 1 : 0.22);
  const cloud = s === 0 ? { x: 175, y: 130, scale: 0.6, opacity: 0.35 } : s === 1 ? { x: 175, y: 118, scale: 1, opacity: 1 } : { x: 500, y: 62, scale: 1.05, opacity: 1 };
  const pulse = reduced ? {} : { strokeDashoffset: [0, -24] };
  const pulseT = reduced ? { duration: 0 } : { duration: 1.2, repeat: Infinity, ease: 'linear' as const };

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={`A víz körforgása, ${s + 1}. lépés – ${STEPS[s]}`} style={{ fontFamily: 'inherit' }}>
      <rect width="640" height="400" fill="var(--paper)" />

      {/* sun */}
      <g opacity={s === 0 ? 1 : 0.55}>
        <circle cx="52" cy="52" r="24" fill={SUN} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={52 + 30 * Math.cos(a)} y1={52 + 30 * Math.sin(a)} x2={52 + 40 * Math.cos(a)} y2={52 + 40 * Math.sin(a)} stroke={SUN} strokeWidth="3" strokeLinecap="round" />;
        })}
      </g>

      {/* rain (behind land) */}
      <motion.g animate={{ opacity: s === 3 ? 1 : s > 3 ? 0.25 : 0 }} transition={t}>
        {Array.from({ length: 9 }, (_, i) => (
          <motion.line
            key={i}
            x1={458 + i * 11}
            x2={452 + i * 11}
            y1={88}
            y2={180}
            stroke={SEA}
            strokeWidth="2.2"
            strokeDasharray="8 8"
            animate={s === 3 ? pulse : {}}
            transition={pulseT}
          />
        ))}
      </motion.g>

      {/* sea */}
      <path d="M0 292 H262 L250 400 H0 Z" fill={SEA} fillOpacity="0.85" />
      <path d="M0 292 q12 -6 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" fill="none" stroke={ICE} strokeWidth="2" opacity="0.8" />
      <text x="96" y="352" textAnchor="middle" fontSize="15" fontWeight="700" fill={ICE}>
        tenger, óceán
      </text>

      {/* land with mountains */}
      <path d="M250 400 L262 292 L330 282 L400 245 L440 190 L472 128 L500 165 L530 112 L572 172 L606 150 L640 190 V400 Z" fill={LAND} />
      <path d="M465 140 L472 128 L480 140 Z M523 124 L530 112 L539 126 Z" fill={ICE} />
      {/* groundwater layer */}
      <path d="M262 342 L640 330 V400 H250 Z" fill={SEA} fillOpacity="0.28" />
      <text x="560" y="378" textAnchor="middle" fontSize="13" fill="var(--ink)">
        talajvíz
      </text>
      {/* trees */}
      {[318, 340, 362].map((x, i) => (
        <g key={x}>
          <rect x={x - 1.5} y={282 - i * 6} width="3" height="10" fill="var(--ink)" opacity="0.6" />
          <circle cx={x} cy={276 - i * 6} r="8" fill={VEG} />
        </g>
      ))}

      {/* 1 evaporation */}
      <motion.g animate={{ opacity: op(0) }} transition={t}>
        {[120, 170, 220, 345].map((x) => (
          <g key={x}>
            <motion.path
              d={`M${x} ${x > 300 ? 255 : 282} q-7 -12 0 -24 t0 -24 t0 -22`}
              fill="none"
              stroke="#D64545"
              strokeWidth="2.4"
              strokeDasharray="6 6"
              animate={s === 0 ? pulse : {}}
              transition={pulseT}
            />
            <polygon points={head(x, x > 300 ? 185 : 212, -90)} fill="#D64545" />
          </g>
        ))}
      </motion.g>

      {/* 3 transport */}
      <motion.g animate={{ opacity: op(2) }} transition={t}>
        <path d="M265 112 Q350 70 420 70" fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeDasharray="10 6" />
        <polygon points={head(430, 70, 0, 12)} fill="var(--ink)" />
        <text x="300" y="58" fontSize="13" fill="var(--muted)">
          szél
        </text>
      </motion.g>

      {/* cloud (moves) */}
      <motion.g initial={false} animate={cloud} transition={t}>
        <g fill="var(--paper-2)" stroke="var(--muted)" strokeWidth="1.5">
          <ellipse cx="0" cy="0" rx="52" ry="20" />
          <circle cx="-20" cy="-12" r="18" />
          <circle cx="12" cy="-18" r="22" />
          <circle cx="36" cy="-6" r="15" />
        </g>
        <ellipse cx="0" cy="0" rx="50" ry="18" fill="var(--paper-2)" />
      </motion.g>

      {/* 5 runoff + infiltration */}
      <motion.g animate={{ opacity: op([4, 5]) }} transition={t}>
        <path d="M498 172 Q470 210 440 222 T380 262 T300 288 L262 294" fill="none" stroke={SEA} strokeWidth="4" strokeLinecap="round" />
      </motion.g>
      <motion.g animate={{ opacity: op(4) }} transition={t}>
        <path d="M498 172 Q470 210 440 222 T380 262 T300 288" fill="none" stroke="var(--paper)" strokeWidth="1.6" strokeDasharray="5 9" opacity="0.9" />
        {[410, 545, 595].map((x, i) => (
          <g key={x}>
            <line x1={x} x2={x} y1={[280, 200, 215][i] ?? 250} y2={322} stroke={SEA} strokeWidth="2.2" strokeDasharray="4 4" />
            <polygon points={head(x, 330, 90)} fill={SEA} />
          </g>
        ))}
      </motion.g>

      {/* 6 return */}
      <motion.g animate={{ opacity: op(5) }} transition={t}>
        <polygon points={head(250, 296, 172, 14)} fill={SEA} stroke="var(--paper)" strokeWidth="1" />
        <path d="M600 352 L300 360" fill="none" stroke={SEA} strokeWidth="3" strokeDasharray="8 6" />
        <polygon points={head(288, 361, 180, 12)} fill={SEA} />
      </motion.g>

      {/* labels */}
      <Label n={1} x={30} y={248} text="párolgás" active={s === 0} />
      <Label n={2} x={110} y={176} text="kicsapódás, felhő" active={s === 1} />
      <Label n={3} x={280} y={30} text="szállítás" active={s === 2} />
      <Label n={4} x={444} y={150} text="csapadék" active={s === 3} anchor="end" />
      <Label n={5} x={425} y={250} text="lefolyás" active={s === 4} anchor="start" />
      <Label n={5} x={630} y={300} text="beszivárgás" active={s === 4} anchor="end" />
      <Label n={6} x={420} y={392} text="vissza a tengerbe" active={s === 5} anchor="middle" />
    </svg>
  );
}
