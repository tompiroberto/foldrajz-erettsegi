import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const MALE = '#2563EB';
const FEMALE = '#D64545';

// Relative share of each 10-year age group (0–9 … 90+), schematic.
const SHAPES = [
  { title: 'fiatalodó', shape: 'piramis (háromszög)', note: 'sok születés, rövid élettartam', cx: 125, data: [1, 0.86, 0.73, 0.61, 0.5, 0.39, 0.28, 0.17, 0.08, 0.02] },
  { title: 'stagnáló', shape: 'harang', note: 'születés ≈ halálozás', cx: 330, data: [0.62, 0.63, 0.64, 0.64, 0.63, 0.6, 0.54, 0.44, 0.28, 0.1] },
  { title: 'öregedő', shape: 'urna', note: 'kevés születés, sok idős', cx: 535, data: [0.42, 0.47, 0.53, 0.62, 0.72, 0.78, 0.74, 0.62, 0.42, 0.16] },
];
const BASE = 316;
const BAND = 25;
const HALF = 82;

export default function AgePyramid({ reduced = false }: DiagramProps) {
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' as const };
  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="Három korfa egymás mellett: a fiatalodó társadalom piramis alakú, a stagnáló harang alakú, az öregedő urna alakú; balra a férfiak, jobbra a nők."
      style={{ fontFamily: 'inherit' }}
    >
      <rect width="640" height="400" fill="var(--paper)" />

      {/* age axis */}
      {[0, 2, 4, 6, 8].map((i) => (
        <g key={i}>
          <line x1="34" x2="612" y1={BASE - i * BAND} y2={BASE - i * BAND} stroke="var(--line)" strokeDasharray="2 5" />
          <text x="30" y={BASE - i * BAND - 4} textAnchor="end" fontSize="12.5" fill="var(--muted)">
            {i * 10}
          </text>
        </g>
      ))}
      <text x="30" y={BASE - 10 * BAND - 4} textAnchor="end" fontSize="12.5" fill="var(--muted)">
        év
      </text>

      {SHAPES.map((p, k) => (
        <g key={p.title}>
          <text x={p.cx - 6} y="34" textAnchor="end" fontSize="13" fontWeight="700" fill={MALE}>
            férfiak
          </text>
          <text x={p.cx + 6} y="34" fontSize="13" fontWeight="700" fill={FEMALE}>
            nők
          </text>
          {p.data.map((v, i) => {
            const w = v * HALF;
            const y = BASE - (i + 1) * BAND + 1.5;
            return (
              <g key={i}>
                <motion.rect
                  y={y}
                  height={BAND - 3}
                  fill={MALE}
                  fillOpacity="0.75"
                  initial={reduced ? false : { x: p.cx - 1, width: 0 }}
                  animate={{ x: p.cx - 1 - w, width: w }}
                  transition={{ ...t, delay: reduced ? 0 : k * 0.08 + i * 0.02 }}
                />
                <motion.rect
                  x={p.cx + 1}
                  y={y}
                  height={BAND - 3}
                  fill={FEMALE}
                  fillOpacity="0.75"
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: w * (i >= 6 ? 1 + (i - 5) * 0.06 : 1) }}
                  transition={{ ...t, delay: reduced ? 0 : k * 0.08 + i * 0.02 }}
                />
              </g>
            );
          })}
          <line x1={p.cx} x2={p.cx} y1={BASE} y2={BASE - 10 * BAND - 4} stroke="var(--ink)" strokeWidth="1" />
          <line x1={p.cx - HALF - 6} x2={p.cx + HALF + 6} y1={BASE} y2={BASE} stroke="var(--ink)" strokeWidth="1" />
          <text x={p.cx} y={BASE + 22} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)">
            {p.title}
          </text>
          <text x={p.cx} y={BASE + 40} textAnchor="middle" fontSize="13" fill="var(--ink)">
            {p.shape}
          </text>
          <text x={p.cx} y={BASE + 57} textAnchor="middle" fontSize="12.5" fill="var(--muted)">
            {p.note}
          </text>
        </g>
      ))}
    </svg>
  );
}
