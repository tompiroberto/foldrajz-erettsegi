import { useEffect, useId, useRef, useState } from 'react';
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

function halfDisk(cx: number, cy: number, r: number, dir: number): string {
  const a = rad(dir - 90);
  const b = rad(dir + 90);
  return `M${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))} A${r},${r} 0 0 1 ${f(cx + r * Math.cos(b))},${f(cy + r * Math.sin(b))} Z`;
}

const SEA = '#4A90C2';
const SUN = '#F2C14E';
const MOON = '#DCEBF5';
const WARM = '#D64545';

const STEPS = [
  { title: 'A Nap, a Föld és a Hold helyzete', moonDeg: 90, note: 'A Hold kb. 29,5 nap alatt kerüli meg a Földet.' },
  { title: 'Napfogyatkozás (újholdkor)', moonDeg: 180, note: 'A Hold a Nap és a Föld közé kerül, árnyéka a Földre esik.' },
  { title: 'Teljes és részleges napfogyatkozás', moonDeg: 180, note: 'Teljes árnyékban teljes, félárnyékban részleges a fogyatkozás.' },
  { title: 'Holdfogyatkozás (holdtöltekor)', moonDeg: 360, note: 'A Föld a Nap és a Hold közé kerül, a Hold a Föld árnyékába jut.' },
  { title: 'Miért nincs minden hónapban fogyatkozás?', moonDeg: 360, note: 'Csak ha újhold/holdtölte idején a Hold a csomópont közelében jár.' },
];

const E = { x: 420, y: 205, r: 40 };
const ORB = 112;
const MR = 12;

export default function Eclipse({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(STEPS.length - 1, Math.round(step)));
  const info = STEPS[s] ?? STEPS[0]!;
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };
  const clip = `ecl-${useId().replace(/:/g, '')}`;

  const deg = useTween(info.moonDeg, reduced);
  const m = { x: E.x + ORB * Math.cos(rad(deg)), y: E.y - ORB * Math.sin(rad(deg)) };
  const solar = s === 1 || s === 2;
  const lunar = s === 3;
  const side = s === 4;

  // Moon shadow (solar eclipse): umbra apex just on the Earth surface.
  const ms = { x: E.x - ORB, y: E.y };
  const umbraM = `M${ms.x},${ms.y - MR} L${E.x - E.r + 4},${E.y} L${ms.x},${ms.y + MR} Z`;
  const penM = `M${ms.x},${ms.y - MR} L${E.x + 10},${E.y - 34} L${E.x + 10},${E.y + 34} L${ms.x},${ms.y + MR} Z`;
  // Earth shadow (lunar eclipse).
  const umbraE = `M${E.x},${E.y - E.r} L${E.x + 230},${E.y} L${E.x},${E.y + E.r} Z`;
  const penE = `M${E.x},${E.y - E.r} L${E.x + 230},${E.y - 66} L${E.x + 230},${E.y + 66} L${E.x},${E.y + E.r} Z`;

  // Moon colour: reddish in the Earth's umbra.
  const inUmbra = Math.abs(((deg % 360) + 360) % 360) < 6 || Math.abs((((deg % 360) + 360) % 360) - 360) < 6;

  // Side view (step 4): tilted lunar orbit, exaggerated.
  const V = { x: 330, y: 205, r: 165, inc: rad(14), elev: rad(16) };
  const proj = (px: number, py: number, pz: number) => ({ x: V.x + px, y: V.y - py * Math.sin(V.elev) - pz * Math.cos(V.elev) });
  const orbitPts: string[] = [];
  const eclPts: string[] = [];
  for (let i = 0; i <= 72; i++) {
    const u = (i / 72) * 2 * Math.PI;
    const o = proj(V.r * Math.cos(u) * Math.cos(V.inc), V.r * Math.sin(u), V.r * Math.cos(u) * Math.sin(V.inc));
    const e = proj(V.r * Math.cos(u), V.r * Math.sin(u), 0);
    orbitPts.push(`${f(o.x)},${f(o.y)}`);
    eclPts.push(`${f(e.x)},${f(e.y)}`);
  }
  const fullM = proj(V.r * Math.cos(V.inc), 0, V.r * Math.sin(V.inc));
  const newM = proj(-V.r * Math.cos(V.inc), 0, -V.r * Math.sin(V.inc));
  const node1 = proj(0, V.r, 0);
  const node2 = proj(0, -V.r, 0);

  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label={`Fogyatkozások: ${info.title}. ${info.note}`}
      style={{ fontFamily: 'inherit' }}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx={E.x} cy={E.y} r={E.r} />
        </clipPath>
      </defs>
      <text x={16} y={28} fontSize={17} fontWeight={700} fill="var(--ink)">
        {info.title}
      </text>

      {/* Sun (always on the left) */}
      <circle cx={-70} cy={side ? V.y : E.y} r={130} fill={SUN} />
      <text x={16} y={(side ? V.y : E.y) + 5} fontSize={15} fontWeight={700} fill="#1B2430">
        Nap
      </text>

      {/* Main scene (steps 0–3) */}
      <motion.g initial={false} animate={{ opacity: side ? 0 : 1 }} transition={t} style={{ pointerEvents: 'none' }}>
        {[-70, -35, 35, 70].map((dy) => (
          <line key={dy} x1={70} y1={E.y + dy} x2={130} y2={E.y + dy} stroke={SUN} strokeWidth={1.5} opacity={0.7} />
        ))}
        <circle cx={E.x} cy={E.y} r={ORB} fill="none" stroke="var(--muted)" strokeDasharray="5 4" />

        {/* Moon's shadow cones */}
        <motion.g initial={false} animate={{ opacity: solar ? 1 : 0 }} transition={t}>
          <path d={penM} fill="#000" opacity={0.25} />
          <path d={umbraM} fill="#000" opacity={0.55} />
        </motion.g>
        {/* Earth's shadow cones */}
        <motion.g initial={false} animate={{ opacity: lunar ? 1 : 0 }} transition={t}>
          <path d={penE} fill="#000" opacity={0.22} />
          <path d={umbraE} fill="#000" opacity={0.5} />
        </motion.g>

        {/* Earth */}
        <circle cx={E.x} cy={E.y} r={E.r} fill={SEA} />
        <path d={halfDisk(E.x, E.y, E.r, 0)} fill="#000" opacity={0.4} />
        <motion.g initial={false} animate={{ opacity: solar ? 1 : 0 }} transition={t} clipPath={`url(#${clip})`}>
          <circle cx={E.x - E.r} cy={E.y} r={32} fill="#000" opacity={0.3} />
          <circle cx={E.x - E.r + 2} cy={E.y} r={6} fill="#000" opacity={0.9} />
        </motion.g>
        <text x={E.x} y={E.y + E.r + 20} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--ink)">
          Föld
        </text>

        {/* Moon */}
        <circle cx={m.x} cy={m.y} r={MR} fill={MOON} />
        <path d={halfDisk(m.x, m.y, MR, 0)} fill="#000" opacity={0.5} />
        <motion.circle cx={m.x} cy={m.y} r={MR} fill={WARM} initial={false} animate={{ opacity: lunar && inUmbra ? 0.75 : 0 }} transition={t} />
        <text x={m.x} y={m.y - MR - 8} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--ink)">
          Hold
        </text>

        {/* Labels for solar eclipse */}
        <motion.g initial={false} animate={{ opacity: solar ? 1 : 0 }} transition={t}>
          <line x1={E.x - 50} y1={E.y + 2} x2={E.x - 50} y2={E.y + 92} stroke="var(--muted)" strokeWidth={1} />
          <text x={E.x - 50} y={E.y + 108} textAnchor="middle" fontSize={13} fill="var(--ink)">
            teljes árnyék
          </text>
          <line x1={E.x - 20} y1={E.y - 26} x2={E.x - 10} y2={E.y - 88} stroke="var(--muted)" strokeWidth={1} />
          <text x={E.x - 10} y={E.y - 94} textAnchor="middle" fontSize={13} fill="var(--ink)">
            félárnyék
          </text>
        </motion.g>
        <motion.g initial={false} animate={{ opacity: s === 2 ? 1 : 0 }} transition={t}>
          {/* What observers see */}
          <text x={575} y={62} textAnchor="middle" fontSize={13} fill="var(--muted)">
            A Nap látványa:
          </text>
          <g transform="translate(575 108)">
            <circle r={27} fill={SUN} opacity={0.35} />
            <circle r={20} fill="#000" />
            <text y={46} textAnchor="middle" fontSize={13} fill="var(--accent)" fontWeight={700}>
              teljes
            </text>
            <text y={62} textAnchor="middle" fontSize={13} fill="var(--muted)">
              (teljes árnyékból)
            </text>
          </g>
          <g transform="translate(575 250)">
            <circle r={20} fill={SUN} />
            <circle cx={-12} cy={-6} r={20} fill="#000" />
            <text y={42} textAnchor="middle" fontSize={13} fill="var(--accent)" fontWeight={700}>
              részleges
            </text>
            <text y={58} textAnchor="middle" fontSize={13} fill="var(--muted)">
              (félárnyékból)
            </text>
          </g>
        </motion.g>

        {/* Labels for lunar eclipse */}
        <motion.g initial={false} animate={{ opacity: lunar ? 1 : 0 }} transition={t}>
          <text x={E.x + 60} y={E.y + 84} fontSize={13} fill="var(--ink)">
            a Föld teljes árnyéka
          </text>
          <text x={E.x + 140} y={E.y - 68} fontSize={13} fill="var(--muted)">
            félárnyék
          </text>
          <text x={m.x} y={m.y + MR + 22} textAnchor="middle" fontSize={13} fill="var(--accent)" fontWeight={700}>
            vöröses Hold
          </text>
        </motion.g>
      </motion.g>

      {/* Side view (step 4) */}
      <motion.g initial={false} animate={{ opacity: side ? 1 : 0 }} transition={t} style={{ pointerEvents: 'none' }}>
        <polygon points={eclPts.join(' ')} fill={SEA} opacity={0.12} stroke="var(--muted)" strokeDasharray="5 4" />
        <path d={`M${V.x},${V.y - 18} L${V.x + 250},${V.y} L${V.x},${V.y + 18} Z`} fill="#000" opacity={0.45} />
        <polyline points={orbitPts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <circle cx={V.x} cy={V.y} r={18} fill={SEA} />
        <path d={halfDisk(V.x, V.y, 18, 0)} fill="#000" opacity={0.4} />
        {[fullM, newM].map((p, i) => (
          <g key={i}>
            <line x1={p.x} y1={p.y} x2={p.x} y2={V.y} stroke="var(--muted)" strokeDasharray="2 2" />
            <circle cx={p.x} cy={p.y} r={9} fill={MOON} />
            <path d={halfDisk(p.x, p.y, 9, 0)} fill="#000" opacity={0.5} />
          </g>
        ))}
        <text x={630} y={124} textAnchor="end" fontSize={13} fill="var(--ink)" fontWeight={700}>
          holdtölte:
        </text>
        <text x={630} y={140} textAnchor="end" fontSize={13} fill="var(--ink)">
          a Hold az árnyék fölött
        </text>
        <text x={newM.x - 40} y={newM.y + 36} fontSize={13} fill="var(--ink)" fontWeight={700}>
          újhold:
        </text>
        <text x={newM.x - 40} y={newM.y + 52} fontSize={13} fill="var(--ink)">
          árnyéka a Föld alatt halad el
        </text>
        <text x={V.x} y={V.y - 26} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">
          Föld
        </text>
        {[node1, node2].map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={5} fill="var(--accent)" stroke="var(--paper)" strokeWidth={1.5} />
        ))}
        <text x={node1.x + 10} y={node1.y - 8} fontSize={13} fill="var(--accent)" fontWeight={700}>
          csomópont
        </text>
        <text x={node2.x + 10} y={node2.y + 20} fontSize={13} fill="var(--accent)" fontWeight={700}>
          csomópont
        </text>
        <text x={V.x + V.r + 8} y={V.y + 46} fontSize={13} fill="var(--muted)">
          Föld pályasíkja
        </text>
        <text x={470} y={70} fontSize={13} fill="var(--accent)">
          Holdpálya: ~5°-os hajlás
        </text>
        <text x={470} y={86} fontSize={13} fill="var(--muted)">
          (a rajzon felnagyítva)
        </text>
      </motion.g>

      <text x={16} y={386} fontSize={13} fill="var(--muted)">
        {info.note}
      </text>
    </svg>
  );
}
