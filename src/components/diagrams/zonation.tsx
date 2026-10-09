import { useId } from 'react';
import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const LAND = '#C9B79C';
const VEG = '#5E9C5A';
const ICE = '#DCEBF5';
const SEA = '#4A90C2';

const yH = (h: number) => 370 - h * 0.08;
const MOUNTAIN = 'M90 370 L170 306 L222 246 L262 178 L296 124 L318 94 L336 82 L354 98 L378 134 L402 190 L428 262 L470 370 Z';

const BELTS = [
  { from: 0, to: 1200, name: 'lomblevelű erdő', sub: 'tölgy, bükk', fill: VEG, filter: 'none', op: 0.95 },
  { from: 1200, to: 1900, name: 'tűlevelű erdő', sub: 'lucfenyő, jegenyefenyő', fill: VEG, filter: 'brightness(0.62)', op: 1 },
  { from: 1900, to: 2700, name: 'havasi legelő', sub: 'törpecserjék, alpesi rét', fill: VEG, filter: 'brightness(1.25) saturate(0.7)', op: 0.6 },
  { from: 2700, to: 3000, name: 'sziklahavas', sub: 'csupasz szikla, hófoltok', fill: LAND, filter: 'brightness(0.8)', op: 1 },
  { from: 3000, to: 4000, name: 'örök hó és jég', sub: 'gleccserek', fill: ICE, filter: 'none', op: 1 },
];

export default function Zonation({ reduced = false }: DiagramProps) {
  const clip = `zon-${useId().replace(/:/g, '')}`;
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' as const };
  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="Függőleges övezetesség egy mérsékelt övezeti magashegységben: lomblevelű erdő, tűlevelű erdő, az erdőhatár fölött havasi legelő, sziklahavas, a hóhatár fölött örök hó és jég."
      style={{ fontFamily: 'inherit' }}
    >
      <defs>
        <clipPath id={clip}>
          <path d={MOUNTAIN} />
        </clipPath>
      </defs>
      <rect width="640" height="400" fill="var(--paper)" />
      <text x="320" y="24" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ink)">
        Mérsékelt övezeti magashegység (pl. Alpok, kb. értékek)
      </text>

      {/* altitude axis */}
      <line x1="62" x2="62" y1={yH(0)} y2={yH(4000)} stroke="var(--ink)" />
      {[0, 1000, 2000, 3000, 4000].map((h) => (
        <g key={h}>
          <line x1="57" x2="62" y1={yH(h)} y2={yH(h)} stroke="var(--ink)" />
          <text x="53" y={yH(h) + 4.5} textAnchor="end" fontSize="12.5" fill="var(--muted)">
            {h}
          </text>
        </g>
      ))}
      <text x="53" y={yH(4000) - 12} textAnchor="end" fontSize="12.5" fill="var(--muted)">
        m
      </text>

      {/* belts clipped by the mountain */}
      <motion.g clipPath={`url(#${clip})`} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={t}>
        {BELTS.map((b) => (
          <rect key={b.name} x="80" width="400" y={yH(b.to)} height={yH(b.from) - yH(b.to)} fill={b.fill} fillOpacity={b.op} style={{ filter: b.filter }} />
        ))}
        {/* tree symbols */}
        {[130, 170, 210, 250, 290, 330, 370, 410].map((x, i) => (
          <circle key={x} cx={x} cy={350 - (i % 2) * 14} r="7" fill={VEG} style={{ filter: 'brightness(0.85)' }} />
        ))}
        {[200, 228, 256, 344, 372, 400].map((x, i) => (
          <path key={x} d={`M${x} ${268 - (i % 2) * 12} l7 -18 l7 18 Z`} fill={VEG} style={{ filter: 'brightness(0.45)' }} />
        ))}
        <path d="M300 146 l12 -6 l10 8 Z M352 150 l14 -4 l6 8 Z" fill={ICE} />
      </motion.g>
      <path d={MOUNTAIN} fill="none" stroke="var(--ink)" strokeWidth="1.4" />

      {/* boundary lines */}
      {[
        { h: 1900, name: 'erdőhatár' },
        { h: 3000, name: 'hóhatár' },
      ].map((l) => (
        <g key={l.name}>
          <line x1="66" x2="470" y1={yH(l.h)} y2={yH(l.h)} stroke={l.h === 3000 ? SEA : 'var(--ink)'} strokeWidth="1.6" strokeDasharray="7 5" />
          <text x="72" y={yH(l.h) - 6} fontSize="13.5" fontWeight="700" fill={l.h === 3000 ? SEA : 'var(--ink)'}>
            {l.name} (≈ {l.h} m)
          </text>
        </g>
      ))}

      {/* belt labels */}
      {BELTS.map((b) => {
        const y = (yH(b.from) + yH(Math.min(b.to, 3600))) / 2;
        return (
          <g key={b.name}>
            <line x1="440" x2="482" y1={y} y2={y} stroke="var(--line)" />
            <text x="488" y={y - 2} fontSize="13.5" fontWeight="700" fill="var(--ink)">
              {b.name}
            </text>
            <text x="488" y={y + 14} fontSize="12.5" fill="var(--muted)">
              {b.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
