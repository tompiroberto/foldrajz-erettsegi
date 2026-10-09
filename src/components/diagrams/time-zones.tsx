import { useEffect, useRef, useState } from 'react';
import { animate, motion } from 'framer-motion';
import type { DiagramProps } from './types';

/** Tweens a number towards `target` (0.8 s), or jumps when reduced. */
function useTween(target: number, reduced?: boolean): number {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (reduced) {
      cur.current = target;
      setV(target);
      return;
    }
    const c = animate(cur.current, target, {
      duration: 0.8,
      ease: 'easeInOut',
      onUpdate: (x) => {
        cur.current = x;
        setV(x);
      },
    });
    return () => c.stop();
  }, [target, reduced]);
  return v;
}

const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => n.toFixed(1);
const SEA = '#4A90C2';
const SUN = '#F2C14E';
const WARM = '#D64545';

// Polar view (from above the North Pole), Sun on the left.
const P = { x: 165, y: 178, r: 92 };
/** Screen point at longitude lon (east +) and radius k·r. */
const pol = (lon: number, k = 1) => ({ x: P.x - P.r * k * Math.cos(rad(lon)), y: P.y + P.r * k * Math.sin(rad(lon)) });
const sector = (a: number, b: number) => {
  const p1 = pol(a);
  const p2 = pol(b);
  // from lon a to lon b (b > a) runs counter-clockwise on screen → sweep 0
  return `M${P.x},${P.y} L${f(p1.x)},${f(p1.y)} A${P.r},${P.r} 0 0 0 ${f(p2.x)},${f(p2.y)} Z`;
};

// Strip map: −180° … +180°
const S = { x0: 20, x1: 620, y: 300, h: 34 };
const sx = (lon: number) => S.x0 + ((lon + 180) / 360) * (S.x1 - S.x0);

interface Slot {
  l1: string;
  l2: string;
  h: number; // hours (may exceed 24 for smooth tweening)
}
interface Step {
  title: string;
  slots: (Slot | null)[];
  lines: [string, string];
}

const STEPS: Step[] = [
  {
    title: '24 óra alatt 360°: 15° = 1 óra',
    slots: [
      { l1: '0° (Greenwich)', l2: '12:00', h: 12 },
      { l1: '15° K', l2: '13:00', h: 13 },
      { l1: '30° K', l2: '14:00', h: 14 },
    ],
    lines: ['360° : 24 óra = 15° óránként, 1° = 4 perc', 'Keletebbre később, nyugatabbra korábban van.'],
  },
  {
    title: 'Helyi idő: a delelés pillanata 12 óra',
    slots: [{ l1: 'Greenwich', l2: '12:00', h: 12 }, { l1: 'Budapest', l2: '13:16', h: 13 + 16 / 60 }, null],
    lines: ['19° × 4 perc = 76 perc = 1 óra 16 perc', 'Budapesten ekkor 13:16 a helyi idő.'],
  },
  {
    title: 'Zónaidő: 24 időzóna',
    slots: [
      { l1: 'New York (−5)', l2: '7:00', h: 7 },
      { l1: 'London (0)', l2: '12:00', h: 12 },
      { l1: 'Budapest (+1)', l2: '13:00', h: 13 },
    ],
    lines: ['Egy zónában a középső délkör idejét használják.', 'Budapest a 15° K-i délkör idejét használja.'],
  },
  {
    title: 'Dátumválasztó vonal (180°)',
    slots: [
      { l1: 'UTC −12', l2: 'hétfő 0:00', h: 24 },
      { l1: 'Greenwich', l2: 'hétfő 12:00', h: 12 },
      { l1: 'UTC +12', l2: 'kedd 0:00', h: 24 },
    ],
    lines: ['Nyugat felé átlépve egy napot előre lapozunk,', 'kelet felé átlépve egy napot vissza.'],
  },
];

const SLOT_X = [395, 490, 585];

function Clock({ x, y, h, show, slot, t }: { x: number; y: number; h: number; show: boolean; slot: Slot | null; t: object }) {
  const hourA = rad((h % 12) * 30 - 90);
  const minA = rad((h * 60) * 6 - 90);
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={t}>
      <circle cx={x} cy={y} r={34} fill="var(--paper)" stroke="var(--ink)" strokeWidth={2} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = rad(i * 30);
        return (
          <line
            key={i}
            x1={x + 28 * Math.sin(a)}
            y1={y - 28 * Math.cos(a)}
            x2={x + 32 * Math.sin(a)}
            y2={y - 32 * Math.cos(a)}
            stroke="var(--muted)"
            strokeWidth={i % 3 === 0 ? 2 : 1}
          />
        );
      })}
      <line x1={x} y1={y} x2={x + 17 * Math.cos(hourA)} y2={y + 17 * Math.sin(hourA)} stroke="var(--ink)" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={x} y1={y} x2={x + 26 * Math.cos(minA)} y2={y + 26 * Math.sin(minA)} stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" />
      <circle cx={x} cy={y} r={2.5} fill="var(--ink)" />
      <text x={x} y={y + 54} textAnchor="middle" fontSize={13} fill="var(--muted)">
        {slot?.l1 ?? ''}
      </text>
      <text x={x} y={y + 71} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--ink)">
        {slot?.l2 ?? ''}
      </text>
    </motion.g>
  );
}

export default function TimeZones({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(STEPS.length - 1, Math.round(step)));
  const info = STEPS[s] ?? STEPS[0]!;
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };
  const h0 = useTween(info.slots[0]?.h ?? 12, reduced);
  const h1 = useTween(info.slots[1]?.h ?? 12, reduced);
  const h2 = useTween(info.slots[2]?.h ?? 12, reduced);
  const hs = [h0, h1, h2];

  const zones = Array.from({ length: 25 }, (_, i) => i - 12);
  const BUD = 19;

  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label={`Helyi idő és zónaidő: ${info.title}. ${info.lines[0]} ${info.lines[1]}`}
      style={{ fontFamily: 'inherit' }}
    >
      <text x={16} y={28} fontSize={17} fontWeight={700} fill="var(--ink)">
        {info.title}
      </text>

      <text x={16} y={48} fontSize={13} fill="var(--muted)">
        felülnézet az Északi-sark felől
      </text>
      {/* Sun rays from the left */}
      {[-62, -28, 28, 62].map((dy) => (
        <g key={dy}>
          <line x1={6} y1={P.y + dy} x2={44} y2={P.y + dy} stroke={SUN} strokeWidth={2} />
          <path d={`M52,${P.y + dy} l-9,-4 v8 Z`} fill={SUN} />
        </g>
      ))}

      {/* Polar view */}
      <circle cx={P.x} cy={P.y} r={P.r} fill={SEA} />
      <motion.g initial={false} animate={{ opacity: s === 2 ? 1 : 0 }} transition={t}>
        {zones.map((k) =>
          k % 2 === 0 ? null : <path key={k} d={sector(15 * k - 7.5, 15 * k + 7.5)} fill="var(--paper)" opacity={0.35} />,
        )}
        <path d={sector(7.5, 22.5)} fill={SUN} opacity={0.75} />
      </motion.g>
      <motion.path d={sector(0, 15)} fill={SUN} opacity={0.75} initial={false} animate={{ opacity: s === 0 ? 0.75 : 0 }} transition={t} />
      <path d={`M${P.x},${P.y - P.r} A${P.r},${P.r} 0 0 1 ${P.x},${P.y + P.r} Z`} fill="#000" opacity={0.4} />
      {Array.from({ length: 24 }, (_, i) => {
        const p = pol(i * 15);
        return <line key={i} x1={P.x} y1={P.y} x2={p.x} y2={p.y} stroke="var(--paper)" strokeWidth={0.8} opacity={0.6} />;
      })}
      {/* Greenwich */}
      <line x1={P.x} y1={P.y} x2={pol(0).x} y2={pol(0).y} stroke="var(--ink)" strokeWidth={2.5} />
      {/* Budapest */}
      <motion.g initial={false} animate={{ opacity: s === 1 || s === 2 ? 1 : 0 }} transition={t}>
        <line x1={P.x} y1={P.y} x2={pol(BUD).x} y2={pol(BUD).y} stroke="var(--accent)" strokeWidth={2.5} />
        <circle cx={pol(BUD, 0.55).x} cy={pol(BUD, 0.55).y} r={4} fill="var(--accent)" stroke="var(--paper)" />
      </motion.g>
      {/* Date line */}
      <motion.line
        x1={P.x}
        y1={P.y}
        x2={pol(180).x}
        y2={pol(180).y}
        stroke={WARM}
        strokeWidth={4}
        initial={false}
        animate={{ opacity: s === 3 ? 1 : 0.35 }}
        transition={t}
      />
      <circle cx={P.x} cy={P.y} r={3} fill="var(--ink)" />
      <circle cx={P.x} cy={P.y} r={P.r} fill="none" stroke="var(--ink)" strokeWidth={1.2} />

      {/* Hour labels (local solar time) */}
      {[
        { lon: 0, txt: '12 h', anchor: 'end' as const, dx: -8, dy: 0 },
        { lon: 90, txt: '18 h', anchor: 'middle' as const, dx: 0, dy: 16 },
        { lon: 180, txt: '24 h', anchor: 'start' as const, dx: 8, dy: 0 },
        { lon: -90, txt: '6 h', anchor: 'middle' as const, dx: 0, dy: -8 },
      ].map((l) => {
        const p = pol(l.lon);
        return (
          <text key={l.lon} x={p.x + l.dx} y={p.y + l.dy + 4} textAnchor={l.anchor} fontSize={13} fontWeight={700} fill="var(--ink)">
            {l.txt}
          </text>
        );
      })}
      <text x={pol(0, 0.62).x} y={pol(0, 0.62).y - 6} textAnchor="middle" fontSize={13} fill="#FFFFFF" fontWeight={700}>
        0°
      </text>
      <text x={pol(180, 0.62).x} y={pol(180, 0.62).y - 6} textAnchor="middle" fontSize={13} fill="#FFFFFF" fontWeight={700}>
        180°
      </text>
      <text x={pol(90, 0.7).x + 4} y={pol(90, 0.7).y} fontSize={13} fill="#FFFFFF">
        90° K
      </text>
      <text x={pol(-90, 0.7).x + 4} y={pol(-90, 0.7).y + 8} fontSize={13} fill="#FFFFFF">
        90° Ny
      </text>
      <motion.text
        x={pol(7.5, 0.72).x}
        y={pol(7.5, 0.72).y + 4}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill="#1B2430"
        initial={false}
        animate={{ opacity: s === 0 ? 1 : 0 }}
        transition={t}
      >
        15°
      </motion.text>

      {/* Rotation arrow (counter-clockwise seen from the north) */}
      {(() => {
        const R = P.r + 20;
        const a1 = rad(-115);
        const a2 = rad(-65);
        const p1 = { x: P.x + R * Math.cos(a1), y: P.y + R * Math.sin(a1) };
        const p2 = { x: P.x + R * Math.cos(a2), y: P.y + R * Math.sin(a2) };
        // from p2 (upper right) to p1 (upper left) = counter-clockwise on screen
        return (
          <g>
            <path d={`M${f(p2.x)},${f(p2.y)} A${R},${R} 0 0 0 ${f(p1.x)},${f(p1.y)}`} fill="none" stroke="var(--accent)" strokeWidth={2} />
            <path d={`M${f(p1.x - 2)},${f(p1.y + 5)} l-6,-10 l11,1 Z`} fill="var(--accent)" />
            <text x={P.x + 60} y={P.y - P.r - 26} fontSize={13} fill="var(--accent)">
              nyugatról kelet felé
            </text>
          </g>
        );
      })()}

      {/* Clocks */}
      {SLOT_X.map((x, i) => (
        <Clock key={i} x={x} y={100} h={hs[i] ?? 12} show={!!info.slots[i]} slot={info.slots[i] ?? null} t={t} />
      ))}
      <text x={340} y={214} fontSize={13} fill="var(--ink)">
        {info.lines[0]}
      </text>
      <text x={340} y={232} fontSize={13} fill="var(--muted)">
        {info.lines[1]}
      </text>

      {/* Strip: 24 zones */}
      {zones.map((k) => {
        const a = Math.max(-180, 15 * k - 7.5);
        const b = Math.min(180, 15 * k + 7.5);
        const bud = k === 1 && s === 2;
        return (
          <g key={k}>
            <rect
              x={sx(a)}
              y={S.y}
              width={sx(b) - sx(a)}
              height={S.h}
              fill={bud ? SUN : k % 2 === 0 ? 'var(--paper)' : 'var(--line)'}
              stroke="var(--muted)"
              strokeWidth={0.5}
            />
            {Math.abs(k) < 12 && (k % 2 === 0 || Math.abs(k) === 1) && (
              <text x={sx(15 * k)} y={S.y + S.h + 16} textAnchor="middle" fontSize={13} fill={k === 0 ? 'var(--ink)' : 'var(--muted)'}>
                {k === 0 ? '0' : k > 0 ? `+${k}` : `−${-k}`}
              </text>
            )}
          </g>
        );
      })}
      <text x={S.x0} y={S.y - 8} fontSize={13} fill="var(--muted)">
        180° Ny
      </text>
      <text x={S.x1} y={S.y - 8} textAnchor="end" fontSize={13} fill="var(--muted)">
        180° K
      </text>
      <line x1={sx(0)} y1={S.y - 4} x2={sx(0)} y2={S.y + S.h} stroke="var(--ink)" strokeWidth={2.5} />
      <text x={sx(0)} y={S.y - 8} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">
        Greenwich 0°
      </text>
      <motion.g initial={false} animate={{ opacity: s === 1 || s === 2 ? 1 : 0 }} transition={t}>
        <line x1={sx(BUD)} y1={S.y} x2={sx(BUD)} y2={S.y + S.h} stroke="var(--accent)" strokeWidth={2} />
        <circle cx={sx(BUD)} cy={S.y + S.h / 2} r={4} fill="var(--accent)" stroke="var(--paper)" />
        <text x={sx(BUD) + 8} y={S.y + S.h / 2 + 4} fontSize={13} fontWeight={700} fill="var(--ink)">
          Budapest
        </text>
      </motion.g>
      <motion.g initial={false} animate={{ opacity: s === 3 ? 1 : 0 }} transition={t}>
        <line x1={S.x0} y1={S.y - 2} x2={S.x0} y2={S.y + S.h + 2} stroke={WARM} strokeWidth={5} />
        <line x1={S.x1} y1={S.y - 2} x2={S.x1} y2={S.y + S.h + 2} stroke={WARM} strokeWidth={5} />
        <text x={S.x0 + 10} y={S.y + S.h / 2 + 5} fontSize={13} fontWeight={700} fill={WARM}>
          hétfő
        </text>
        <text x={S.x1 - 10} y={S.y + S.h / 2 + 5} textAnchor="end" fontSize={13} fontWeight={700} fill={WARM}>
          kedd
        </text>
      </motion.g>
      <text x={S.x0} y={392} fontSize={13} fill="var(--muted)">
        {s === 3 ? 'A 180°-os délkör mindkét széle ugyanaz a dátumválasztó vonal.' : 'Időzónák (eltérés a greenwichi időtől, órában)'}
      </text>
    </svg>
  );
}
