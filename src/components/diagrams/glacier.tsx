import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const SEA = '#4A90C2';
const LAND = '#C9B79C';
const ICE = '#DCEBF5';

const GLACIER =
  'M30 72 C30 30 150 24 166 60 L198 132 L232 60 C250 24 372 26 372 66 C372 104 300 124 252 166 L246 290 C246 328 154 328 154 290 L148 166 C100 132 30 112 30 72 Z';

function Leader({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeWidth="1" />
      <circle cx={x2} cy={y2} r="2.5" fill="var(--ink)" />
    </g>
  );
}

export default function Glacier({ reduced = false }: DiagramProps) {
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' as const };
  const moraine = { fill: 'none', stroke: LAND, strokeOpacity: 1, strokeWidth: 6, strokeLinecap: 'round' as const, strokeDasharray: '1.5 5' };
  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="Völgygleccser felülnézetben (firnmező, gleccsernyelv, oldal-, közép- és végmoréna, gleccserpatak) és a jég által formált U alakú völgy keresztmetszete."
      style={{ fontFamily: 'inherit' }}
    >
      <rect width="640" height="400" fill="var(--paper)" />

      {/* ---------- plan view ---------- */}
      <text x="12" y="20" fontSize="13" fontWeight="700" fill="var(--muted)">
        felülnézet
      </text>
      <rect x="8" y="28" width="404" height="364" rx="8" fill={LAND} fillOpacity="0.45" />
      <motion.g initial={reduced ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={t}>
        <path d={GLACIER} fill={SEA} fillOpacity="0.55" stroke={SEA} strokeWidth="1.5" />
        {/* firn areas (above snow line) */}
        <path d="M30 72 C30 30 150 24 166 60 L178 88 L40 100 C32 92 30 82 30 72 Z" fill={ICE} />
        <path d="M232 60 C250 24 372 26 372 66 C372 80 366 92 356 100 L220 88 Z" fill={ICE} />
        {/* crevasses */}
        <g stroke={ICE} strokeWidth="1.2" strokeOpacity="0.8">
          <path d="M170 200 q15 6 26 0 M204 220 q14 6 28 0 M168 250 q14 6 26 0 M206 270 q14 6 26 0" fill="none" />
        </g>
        {/* lateral moraines */}
        <path d="M40 96 C80 128 140 150 152 170 L158 292" {...moraine} />
        <path d="M362 92 C320 120 268 150 248 170 L242 292" {...moraine} />
        {/* medial moraine */}
        <path d="M198 134 L200 312" {...moraine} />
        {/* terminal moraine */}
        <path d="M134 296 C134 368 266 368 266 296" {...moraine} strokeWidth={7} />
        {/* meltwater stream */}
        <path d="M200 324 C204 345 196 360 210 392" fill="none" stroke={SEA} strokeWidth="4" strokeLinecap="round" />
      </motion.g>
      {/* snow line */}
      <line x1="8" x2="412" y1="104" y2="104" stroke={SEA} strokeWidth="1.6" strokeDasharray="8 5" />
      <text x="406" y="122" textAnchor="end" fontSize="13" fontWeight="700" fill="var(--ink)">
        hóhatár
      </text>

      {/* labels (plan) */}
      <text x="100" y="58" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#2563EB">
        firnmező
      </text>
      <text x="302" y="58" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#2563EB">
        firnmező
      </text>
      <text x="100" y="74" textAnchor="middle" fontSize="12.5" fill="#2563EB">
        (gyűjtőterület)
      </text>
      <text x="302" y="74" textAnchor="middle" fontSize="12.5" fill="#2563EB">
        (gyűjtőterület)
      </text>
      <Leader x1={300} y1={200} x2={246} y2={232} />
      <text x="304" y="198" fontSize="13.5" fontWeight="700" fill="var(--ink)">
        gleccsernyelv
      </text>
      <Leader x1={300} y1={250} x2={244} y2={262} />
      <text x="304" y="254" fontSize="13.5" fontWeight="700" fill="var(--ink)">
        oldalmoréna
      </text>
      <Leader x1={92} y1={180} x2={198} y2={190} />
      <text x="88" y="184" textAnchor="end" fontSize="13.5" fontWeight="700" fill="var(--ink)">
        középmoréna
      </text>
      <Leader x1={300} y1={330} x2={262} y2={320} />
      <text x="304" y="334" fontSize="13.5" fontWeight="700" fill="var(--ink)">
        végmoréna
      </text>
      <Leader x1={100} y1={372} x2={204} y2={374} />
      <text x="96" y="376" textAnchor="end" fontSize="13.5" fontWeight="700" fill="var(--ink)">
        gleccserpatak
      </text>
      <path d="M118 210 l0 40" stroke="var(--muted)" strokeWidth="2" />
      <path d="M112 242 l6 10 l6 -10" fill="none" stroke="var(--muted)" strokeWidth="2" />
      <text x="110" y="232" textAnchor="end" fontSize="12.5" fill="var(--muted)">
        mozgás
      </text>

      {/* ---------- U-valley cross-section ---------- */}
      <text x="430" y="20" fontSize="13" fontWeight="700" fill="var(--muted)">
        keresztmetszet
      </text>
      <path d="M428 70 L448 40 L468 92 L478 92 C486 250 500 300 530 300 C560 300 574 250 582 92 L594 92 L612 46 L632 80 L632 392 L428 392 Z" fill={LAND} fillOpacity="0.55" stroke="var(--ink)" strokeWidth="1.2" />
      {/* former ice fill */}
      <path d="M482 150 C488 250 502 296 530 296 C558 296 572 250 578 150 Z" fill={ICE} fillOpacity="0.9" stroke={SEA} strokeDasharray="5 4" />
      <path d="M482 150 l-6 -6 l-5 7 Z M578 150 l6 -6 l5 7 Z" fill="var(--ink)" fillOpacity="0.6" />
      <text x="530" y="200" textAnchor="middle" fontSize="13" fill="#2563EB" fontWeight="700">
        jég
      </text>
      <text x="530" y="330" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)">
        U alakú völgy
      </text>
      <text x="530" y="348" textAnchor="middle" fontSize="13" fill="var(--ink)">
        (teknővölgy)
      </text>
      <text x="530" y="372" textAnchor="middle" fontSize="12.5" fill="var(--ink)">
        meredek fal, széles talp
      </text>
      <text x="530" y="142" textAnchor="middle" fontSize="12.5" fill="var(--muted)">
        oldalmoréna
      </text>
    </svg>
  );
}
