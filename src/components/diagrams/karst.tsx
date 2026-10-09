import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const SEA = '#4A90C2';
const LAND = '#C9B79C';
const VEG = '#5E9C5A';

function head(x: number, y: number, deg: number, s = 9) {
  const a = (deg * Math.PI) / 180;
  const p = (r: number, da: number) => `${(x - r * Math.cos(a + da)).toFixed(1)},${(y - r * Math.sin(a + da)).toFixed(1)}`;
  return `${x},${y} ${p(s, 0.45)} ${p(s, -0.45)}`;
}

// Surface profile: same points in both states so the path can morph.
const XS = [0, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 170, 192, 215, 238, 260, 320, 338, 350, 362, 380, 520];
const FORMED = [100, 100, 116, 100, 118, 100, 118, 100, 118, 100, 100, 100, 126, 136, 126, 100, 100, 122, 140, 122, 100, 100];
const surface = (ys: number[]) => `M${XS.map((x, i) => `${x} ${ys[i]}`).join(' L')} L520 300 L640 300 L640 400 L0 400 Z`;
const FLAT_D = surface(XS.map(() => 100));
const FORMED_D = surface(FORMED);

const CHEM = [
  { eq: 'H₂O + CO₂ → H₂CO₃', a: 'A csapadékvíz a levegőből és a talajból', b: 'szén-dioxidot old: szénsavas víz lesz.' },
  { eq: 'CaCO₃ + H₂O + CO₂ → Ca(HCO₃)₂', a: 'A szénsavas víz oldja a mészkövet', b: '(oldódó kalcium-hidrogén-karbonát).' },
  { eq: 'CaCO₃ + H₂O + CO₂ → Ca(HCO₃)₂', a: 'A repedések mentén a víz üregeket old:', b: 'barlang, barlangi patak alakul ki.' },
  { eq: 'Ca(HCO₃)₂ → CaCO₃ + H₂O + CO₂↑', a: 'A barlangban a CO₂ távozik, a mész', b: 'kiválik: cseppkövek nőnek.' },
];

const ARIA = [
  'A csapadékvíz szén-dioxidot old, szénsavas víz keletkezik.',
  'A szénsavas víz oldja a mészkövet: karr, töbör és víznyelő alakul ki.',
  'A mészkőben barlang és barlangi patak alakul ki, a víz karsztforrásban lép a felszínre.',
  'A barlangban a szén-dioxid távozik, a mész kiválik: sztalaktit és sztalagmit nő.',
];

export default function Karst({ step = 0, reduced = false }: DiagramProps) {
  const s = Math.max(0, Math.min(3, step));
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };
  const vis = (from: number) => ({ opacity: s >= from ? 1 : 0 });
  const c = CHEM[s]!;
  const hl = (i: number) => (s === i ? 'var(--accent)' : 'var(--ink)');

  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={`Karsztosodás keresztmetszetben, ${s + 1}. lépés – ${ARIA[s]}`} style={{ fontFamily: 'inherit' }}>
      <rect width="640" height="400" fill="var(--paper)" />

      {/* rain cloud */}
      <motion.g initial={false} animate={{ opacity: s === 0 ? 1 : 0.25 }} transition={t}>
        <g fill="var(--paper-2)" stroke="var(--muted)" strokeWidth="1.4">
          <ellipse cx="90" cy="32" rx="46" ry="15" />
          <circle cx="72" cy="24" r="14" />
          <circle cx="100" cy="18" r="17" />
        </g>
        <ellipse cx="90" cy="32" rx="44" ry="13" fill="var(--paper-2)" />
        {[60, 78, 96, 114].map((x) => (
          <line key={x} x1={x} x2={x - 6} y1={52} y2={84} stroke={SEA} strokeWidth="2.2" strokeDasharray="6 5" />
        ))}
        <text x="150" y="58" fontSize="13" fontWeight="700" fill={SEA}>
          H₂O
        </text>
        <text x="150" y="76" fontSize="13" fontWeight="700" fill="var(--muted)">
          + CO₂
        </text>
      </motion.g>

      {/* rock: limestone body */}
      <motion.path initial={false} animate={{ d: s >= 1 ? FORMED_D : FLAT_D }} transition={t} fill={LAND} fillOpacity={0.62} stroke="var(--ink)" strokeWidth="1.2" />
      {/* bedding planes and joints */}
      <g stroke="var(--ink)" strokeOpacity="0.25" strokeWidth="1">
        {[160].map((y) => (
          <line key={y} x1="0" x2="520" y1={y} y2={y} />
        ))}
        {[60, 140, 280, 420, 490].map((x) => (
          <line key={x} x1={x} x2={x + 8} y1="104" y2="300" strokeDasharray="10 8" />
        ))}
      </g>
      {/* impermeable layer */}
      <rect x="0" y="300" width="640" height="100" fill="var(--muted)" fillOpacity="0.35" />
      <line x1="0" x2="640" y1="300" y2="300" stroke="var(--ink)" strokeWidth="1.2" />
      <text x="16" y="324" fontSize="13" fill="var(--ink)">
        vízzáró kőzet
      </text>
      <text x="16" y="184" fontSize="14" fontWeight="700" fill="var(--ink)">
        mészkő
      </text>

      {/* soil + vegetation strip (CO2 source) */}
      <motion.g initial={false} animate={{ opacity: s === 0 ? 1 : 0.5 }} transition={t}>
        <rect x="400" y="96" width="120" height="8" fill={VEG} fillOpacity="0.7" />
        <text x="460" y="88" textAnchor="middle" fontSize="13" fill="var(--muted)">
          talaj: CO₂
        </text>
      </motion.g>

      {/* step 1: surface forms */}
      <motion.g initial={false} animate={vis(1)} transition={t}>
        {/* surface stream to the swallow hole */}
        <path d="M400 99 L366 104" stroke={SEA} strokeWidth="4" strokeLinecap="round" />
        <polygon points={head(360, 108, 160, 10)} fill={SEA} />
        {/* shaft down to the cave */}
        <path d="M350 140 L346 160 L354 180 L350 200" fill="none" stroke="var(--paper)" strokeWidth="7" strokeLinecap="round" />
        <path d="M350 140 L346 160 L354 180 L350 200" fill="none" stroke={SEA} strokeWidth="2" strokeDasharray="4 4" />
        <text x="75" y="88" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={hl(1)}>
          karr
        </text>
        <text x="215" y="88" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={hl(1)}>
          töbör
        </text>
        <text x="320" y="88" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={hl(1)}>
          víznyelő
        </text>
      </motion.g>

      {/* step 2: cave, stream, spring */}
      <motion.g initial={false} animate={vis(2)} transition={t}>
        <path d="M140 248 C146 205 230 194 300 198 C380 194 462 206 470 244 C474 280 400 290 300 288 C220 290 136 284 140 248 Z" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.4" />
        <path d="M462 272 C482 280 500 292 520 296" fill="none" stroke="var(--paper)" strokeWidth="11" />
        <path d="M180 280 C260 286 360 286 462 272 C482 280 500 292 520 296" fill="none" stroke={SEA} strokeWidth="5" strokeLinecap="round" />
        <path d="M520 296 Q560 300 640 298" fill="none" stroke={SEA} strokeWidth="6" />
        <polygon points={head(632, 298, 0, 11)} fill={SEA} />
        <text x="160" y="232" fontSize="14" fontWeight="700" fill={hl(2)}>
          barlang
        </text>
        <text x="160" y="252" fontSize="13" fill={hl(2)}>
          barlangi patak
        </text>
        <text x="580" y="262" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={hl(2)}>
          karsztforrás
        </text>
        <line x1="560" x2="528" y1="268" y2="292" stroke="var(--ink)" strokeWidth="1" />
      </motion.g>

      {/* step 3: speleothems */}
      <motion.g initial={false} animate={vis(3)} transition={t} fill={LAND} stroke="var(--ink)" strokeWidth="1">
        <path d="M322 198 L330 232 L338 198 Z" />
        <path d="M398 198 L404 222 L410 198 Z" />
        <path d="M436 205 L441 226 L446 206 Z" />
        <path d="M418 284 L425 254 L432 284 Z" />
        <path d="M322 286 L330 262 L338 286 Z" />
        <path d="M372 197 C376 220 368 250 374 287 L388 287 C394 250 384 220 388 197 Z" />
        <text x="314" y="218" textAnchor="end" fontSize="13" fontWeight="700" fill={hl(3)} stroke="none">
          sztalaktit
        </text>
        <text x="316" y="268" textAnchor="end" fontSize="13" fontWeight="700" fill={hl(3)} stroke="none">
          sztalagmit
        </text>
      </motion.g>

      {/* chemistry box */}
      <g>
        <rect x="248" y="8" width="384" height="66" rx="8" fill="var(--paper-2)" stroke="var(--accent)" />
        <text x="440" y="30" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--accent)">
          {c.eq}
        </text>
        <text x="440" y="49" textAnchor="middle" fontSize="13" fill="var(--ink)">
          {c.a}
        </text>
        <text x="440" y="66" textAnchor="middle" fontSize="13" fill="var(--ink)">
          {c.b}
        </text>
      </g>
    </svg>
  );
}
