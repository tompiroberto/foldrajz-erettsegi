import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

const LEVELS = [
  { name: 'kedvezményes kereskedelmi övezet', desc: 'egyes termékek vámjainak csökkentése', ex: '' },
  { name: 'szabadkereskedelmi övezet', desc: 'a tagok között nincs vám, külső vámot mindenki maga szab', ex: 'pl. EFTA' },
  { name: 'vámunió', desc: '+ közös külső vámok', ex: 'pl. EGK, 1968' },
  { name: 'közös piac', desc: '+ áruk, szolgáltatások, tőke és munkaerő szabad áramlása', ex: 'pl. EU, 1993' },
  { name: 'gazdasági unió', desc: '+ összehangolt gazdaságpolitika', ex: '' },
  { name: 'monetáris unió', desc: '+ közös pénz, közös központi bank', ex: 'pl. eurózóna' },
  { name: 'politikai unió', desc: '+ közös kül-, biztonság- és jogpolitika', ex: '' },
];

const ROW = 46;
const BOTTOM = 388;

export default function Integration({ reduced = false }: DiagramProps) {
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' as const };
  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="Az integráció szintjei lépcsőként alulról felfelé: kedvezményes kereskedelmi övezet, szabadkereskedelmi övezet, vámunió, közös piac, gazdasági unió, monetáris unió, politikai unió."
      style={{ fontFamily: 'inherit' }}
    >
      <rect width="640" height="400" fill="var(--paper)" />

      {/* direction arrow */}
      <line x1="18" x2="18" y1={BOTTOM - 6} y2="30" stroke="var(--accent)" strokeWidth="2.5" />
      <path d="M10 40 L18 24 L26 40 Z" fill="var(--accent)" />
      <text transform={`translate(34 ${BOTTOM - 8}) rotate(-90)`} fontSize="12.5" fill="var(--muted)">
        egyre szorosabb együttműködés, csökkenő önállóság
      </text>

      {LEVELS.map((l, i) => {
        const y = BOTTOM - (i + 1) * ROW;
        const x = 48 + i * 16;
        return (
          <motion.g
            key={l.name}
            initial={reduced ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...t, delay: reduced ? 0 : i * 0.08 }}
          >
            <rect x={x} y={y + 2} width={632 - x} height={ROW - 4} rx="7" fill="var(--accent)" fillOpacity={0.08 + i * 0.045} stroke="var(--accent)" strokeOpacity="0.5" />
            <circle cx={x + 18} cy={y + ROW / 2} r="11" fill="var(--accent)" />
            <text x={x + 18} y={y + ROW / 2 + 4.5} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--paper)">
              {i + 1}
            </text>
            <text x={x + 38} y={y + 20} fontSize="14" fontWeight="700" fill="var(--ink)">
              {l.name}
            </text>
            <text x={x + 38} y={y + 37} fontSize="12.5" fill="var(--muted)">
              {l.desc}
            </text>
            {l.ex && (
              <text x="622" y={y + 20} textAnchor="end" fontSize="12.5" fontStyle="italic" fill="var(--ink)">
                {l.ex}
              </text>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}
