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

const LAND = '#C9B79C';
const MAGMA = '#E4572E';
const SUN = '#F2C14E';

const CX = 320;
const CY = 205;
const HW = 84;
const HH = 25;

type Node = { x: number; y: number; name: string; swatch: (x: number, y: number) => ReactNode };
const NODES: Node[] = [
  {
    x: 320,
    y: 58,
    name: 'magma',
    swatch: (x, y) => (
      <g>
        <rect x={x} y={y} width={34} height={34} rx={6} fill={MAGMA} />
        <circle cx={x + 10} cy={y + 12} r={4} fill={SUN} />
        <circle cx={x + 23} cy={y + 22} r={5} fill={SUN} fillOpacity={0.8} />
      </g>
    ),
  },
  {
    x: 528,
    y: 160,
    name: 'magmás kőzet',
    swatch: (x, y) => (
      <g>
        <rect x={x} y={y} width={34} height={34} rx={6} fill={LAND} />
        {[[7, 8], [20, 6], [27, 18], [12, 22], [22, 28], [6, 29]].map(([dx, dy], i) => (
          <rect key={i} x={x + dx!} y={y + dy!} width={5} height={4} fill={i % 2 ? '#2563EB' : MAGMA} transform={`rotate(${i * 30} ${x + dx!} ${y + dy!})`} />
        ))}
      </g>
    ),
  },
  {
    x: 462,
    y: 330,
    name: 'üledék',
    swatch: (x, y) => (
      <g>
        <rect x={x} y={y} width={34} height={34} rx={6} fill={SUN} fillOpacity={0.5} />
        {Array.from({ length: 14 }, (_, i) => (
          <circle key={i} cx={x + 4 + ((i * 7) % 28)} cy={y + 6 + Math.floor(i / 4) * 8} r={2.2} fill={LAND} />
        ))}
      </g>
    ),
  },
  {
    x: 178,
    y: 330,
    name: 'üledékes kőzet',
    swatch: (x, y) => (
      <g>
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={x} y={y + k * 8.5} width={34} height={8.5} fill={k % 2 ? SUN : LAND} fillOpacity={k % 2 ? 0.7 : 1} />
        ))}
      </g>
    ),
  },
  {
    x: 112,
    y: 160,
    name: 'átalakult kőzet',
    swatch: (x, y) => (
      <g>
        <rect x={x} y={y} width={34} height={34} rx={6} fill={LAND} />
        {[0, 1, 2, 3].map((k) => (
          <path key={k} d={`M${x + 2},${y + 6 + k * 8} q8,-6 15,0 t15,0`} fill="none" stroke="#2563EB" strokeWidth={1.6} />
        ))}
      </g>
    ),
  },
];

const PROCESS = [
  { lines: ['kihűlés,', 'kristályosodás'], x: 432, y: 122, a: 'end' as const },
  { lines: ['mállás, lepusztulás,', 'szállítás'], x: 520, y: 248, a: 'end' as const },
  { lines: ['lerakódás,', 'kőzetté válás'], x: 320, y: 322, a: 'middle' as const },
  { lines: ['átalakulás', '(nagy nyomás és hő)'], x: 124, y: 248, a: 'start' as const },
  { lines: ['beolvadás'], x: 206, y: 122, a: 'start' as const },
];

function edge(n: Node, toward: [number, number]): [number, number] {
  const dx = toward[0] - n.x;
  const dy = toward[1] - n.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const k = Math.min(HW / Math.abs(ux || 1e-6), HH / Math.abs(uy || 1e-6)) + 6;
  return [n.x + ux * k, n.y + uy * k];
}

function arrowGeom(i: number) {
  const a = NODES[i]!;
  const b = NODES[(i + 1) % NODES.length]!;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const ox = mx - CX;
  const oy = my - CY;
  const ol = Math.hypot(ox, oy) || 1;
  const c: [number, number] = [mx + (ox / ol) * 46, my + (oy / ol) * 46];
  const p0 = edge(a, c);
  const p1 = edge(b, c);
  const ang = Math.atan2(p1[1] - c[1], p1[0] - c[0]);
  // végpont kicsit visszahúzva, hogy a nyílhegy ne lógjon a dobozba
  const e: [number, number] = [p1[0] - Math.cos(ang) * 8, p1[1] - Math.sin(ang) * 8];
  return { d: `M${p0[0]},${p0[1]} Q${c[0]},${c[1]} ${e[0]},${e[1]}`, tip: p1, ang };
}

const ARIA = [
  'A kőzetanyag-körforgás: a magma kihűlésével és kristályosodásával magmás kőzet keletkezik.',
  'A kőzetanyag-körforgás: a felszínre került kőzet mállik, lepusztul, anyagát a víz, a szél vagy a jég elszállítja.',
  'A kőzetanyag-körforgás: a lerakódott üledék betemetődik, tömörödik, összecementálódik, üledékes kőzet lesz belőle.',
  'A kőzetanyag-körforgás: nagy nyomáson és magas hőmérsékleten a kőzetek átalakult kőzetté alakulnak.',
  'A kőzetanyag-körforgás: a mélybe kerülő kőzet beolvad, és újra magma lesz.',
];

export default function RockCycle({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(4, step));
  const t: Transition = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' };
  const nxt = (s + 1) % NODES.length;
  return (
    <svg viewBox="0 0 640 400" width="100%" role="img" aria-label={ARIA[s]}>
      <Txt x={CX} y={CY - 4} s={15} w={700} c="var(--muted)">
        kőzetanyag-
      </Txt>
      <Txt x={CX} y={CY + 14} s={15} w={700} c="var(--muted)">
        körforgás
      </Txt>

      {NODES.map((_, i) => {
        const g = arrowGeom(i);
        const on = i === s;
        const p = PROCESS[i]!;
        return (
          <g key={i}>
            <path d={g.d} fill="none" stroke="var(--muted)" strokeWidth={2} opacity={on ? 0 : 0.8} />
            <polygon points={head(g.tip[0], g.tip[1], g.ang, 10)} fill={on ? 'var(--accent)' : 'var(--muted)'} />
            {on && (
              <motion.path
                key={`a${s}`}
                d={g.d}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={5}
                strokeLinecap="round"
                initial={reduced ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={t}
              />
            )}
            <motion.g initial={false} animate={{ opacity: on ? 1 : 0.75 }} transition={t}>
              {p.lines.map((l, j) => (
                <Txt key={l} x={p.x} y={p.y + j * 16} a={p.a} s={13} w={on ? 700 : 500} c={on ? 'var(--ink)' : 'var(--muted)'}>
                  {l}
                </Txt>
              ))}
            </motion.g>
          </g>
        );
      })}

      {NODES.map((n, i) => {
        const hi = i === s || i === nxt;
        return (
          <g key={n.name}>
            <motion.rect
              x={n.x - HW}
              y={n.y - HH}
              width={HW * 2}
              height={HH * 2}
              rx={12}
              fill="var(--paper)"
              initial={false}
              animate={{ strokeWidth: hi ? 3 : 1.2 }}
              stroke={hi ? 'var(--accent)' : 'var(--line)'}
              transition={t}
            />
            {n.swatch(n.x - HW + 8, n.y - 17)}
            <Txt x={n.x - HW + 50} y={n.y + 5} a="start" s={14} w={700}>
              {n.name}
            </Txt>
          </g>
        );
      })}
    </svg>
  );
}
