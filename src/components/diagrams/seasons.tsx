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

/** Path of the half disk that faces screen direction `dir` (degrees, y down). */
function halfDisk(cx: number, cy: number, r: number, dir: number): string {
  const a = rad(dir - 90);
  const b = rad(dir + 90);
  return `M${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))} A${r},${r} 0 0 1 ${f(cx + r * Math.cos(b))},${f(cy + r * Math.sin(b))} Z`;
}

const TILT = 23.5;
// Axis direction on screen (north pole leans right, always the same).
const AX = { x: Math.sin(rad(TILT)), y: -Math.cos(rad(TILT)) };

// Orbit (perspective ellipse) around the Sun.
const O = { cx: 182, cy: 210, rx: 136, ry: 92 };
const orbitPos = (deg: number) => ({ x: O.cx + O.rx * Math.cos(rad(deg)), y: O.cy - O.ry * Math.sin(rad(deg)) });

interface StepInfo {
  title: string;
  date: string;
  orbitDeg: number; // position on the orbit ellipse (90 = back, 180 = left, ...)
  insetTilt: number; // tilt of the axis in the side-view inset, + = north away from the Sun
  ray: string;
  season: string;
}

const STEPS: StepInfo[] = [
  { title: 'Tavaszi nap-éj egyenlőség', date: 'márc. 20–21.', orbitDeg: 90, insetTilt: 0, ray: 'Merőleges napsugár: Egyenlítő (0°)', season: 'északi félgömb: tavasz kezdete' },
  { title: 'Nyári napforduló', date: 'jún. 21–22.', orbitDeg: 180, insetTilt: -TILT, ray: 'Merőleges napsugár: Ráktérítő (é. sz. 23,5°)', season: 'északi félgömb: nyár' },
  { title: 'Őszi nap-éj egyenlőség', date: 'szept. 22–23.', orbitDeg: 270, insetTilt: 0, ray: 'Merőleges napsugár: Egyenlítő (0°)', season: 'északi félgömb: ősz kezdete' },
  { title: 'Téli napforduló', date: 'dec. 21–22.', orbitDeg: 360, insetTilt: TILT, ray: 'Merőleges napsugár: Baktérítő (d. sz. 23,5°)', season: 'északi félgömb: tél' },
];

const SEA = '#4A90C2';
const SUN = '#F2C14E';

function SmallEarth({ x, y, r, strong }: { x: number; y: number; r: number; strong?: boolean }) {
  const sunDir = (Math.atan2(O.cy - y, O.cx - x) * 180) / Math.PI;
  const L = r * 1.55;
  return (
    <g opacity={strong ? 1 : 0.45}>
      <circle cx={x} cy={y} r={r} fill={SEA} />
      <path d={halfDisk(x, y, r, sunDir + 180)} fill="#000" opacity={0.45} />
      <line
        x1={x - AX.x * L}
        y1={y - AX.y * L}
        x2={x + AX.x * L}
        y2={y + AX.y * L}
        stroke="var(--ink)"
        strokeWidth={1.5}
      />
      <line
        x1={x - AX.y * r}
        y1={y + AX.x * r}
        x2={x + AX.y * r}
        y2={y - AX.x * r}
        stroke="var(--paper)"
        strokeWidth={1}
        opacity={0.8}
      />
      <circle cx={x} cy={y} r={r} fill="none" stroke={strong ? 'var(--accent)' : 'var(--line)'} strokeWidth={strong ? 3 : 1} />
    </g>
  );
}

const PARALLELS: { lat: number; name: string }[] = [
  { lat: 66.5, name: 'É. sarkkör' },
  { lat: 23.5, name: 'Ráktérítő' },
  { lat: 0, name: 'Egyenlítő' },
  { lat: -23.5, name: 'Baktérítő' },
  { lat: -66.5, name: 'D. sarkkör' },
];

export default function Seasons({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(STEPS.length - 1, Math.round(step)));
  const info = STEPS[s] ?? STEPS[0]!;
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };

  // Orbit angle tweens forward (Dec → March continues counter-clockwise).
  const [target, setTarget] = useState(info.orbitDeg);
  useEffect(() => {
    setTarget((prev) => {
      let d = info.orbitDeg;
      while (d < prev - 180) d += 360;
      while (d > prev + 180) d -= 360;
      return d;
    });
  }, [info.orbitDeg]);
  const deg = useTween(target, reduced);
  const tilt = useTween(info.insetTilt, reduced);
  const e = orbitPos(deg);

  // Inset: side view, sunlight from the left.
  const I = { cx: 486, cy: 200, r: 66 };
  const rot = (x: number, y: number) => {
    const a = rad(tilt);
    return { x: I.cx + x * Math.cos(a) - y * Math.sin(a), y: I.cy + x * Math.sin(a) + y * Math.cos(a) };
  };
  const subLat = -tilt; // latitude hit perpendicularly
  const rays = [-56, -28, 0, 28, 56];

  const dateLabels: { deg: number; dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }[] = [
    { deg: 90, dx: -20, dy: -14, anchor: "end" },
    { deg: 180, dx: 0, dy: 44, anchor: 'middle' },
    { deg: 270, dx: 0, dy: 46, anchor: 'middle' },
    { deg: 0, dx: 0, dy: 44, anchor: 'middle' },
  ];

  const arrowAt = (d: number) => {
    const p = orbitPos(d);
    const tx = -O.rx * Math.sin(rad(d));
    const ty = -O.ry * Math.cos(rad(d));
    const len = Math.hypot(tx, ty);
    const ux = tx / len;
    const uy = ty / len;
    return `M${f(p.x + ux * 9)},${f(p.y + uy * 9)} L${f(p.x - ux * 4 - uy * 3.5)},${f(p.y - uy * 4 + ux * 3.5)} L${f(p.x - ux * 4 + uy * 3.5)},${f(p.y - uy * 4 - ux * 3.5)} Z`;
  };

  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label={`Az évszakok: ${info.title} (${info.date}). ${info.ray}; ${info.season}. A Föld tengelye mindig a Sarkcsillag felé mutat.`}
      style={{ fontFamily: 'inherit' }}
    >
      <text x={16} y={28} fontSize={17} fontWeight={700} fill="var(--ink)">
        {info.title}
        <tspan fill="var(--muted)" fontWeight={400}>{`  ·  ${info.date}`}</tspan>
      </text>

      {/* Orbit */}
      <ellipse cx={O.cx} cy={O.cy} rx={O.rx} ry={O.ry} fill="none" stroke="var(--muted)" strokeWidth={1.2} strokeDasharray="5 4" />
      {[45, 135, 225, 315].map((d) => (
        <path key={d} d={arrowAt(d)} fill="var(--muted)" />
      ))}

      {/* Sun */}
      <circle cx={O.cx} cy={O.cy} r={34} fill={SUN} opacity={0.25} />
      <circle cx={O.cx} cy={O.cy} r={26} fill={SUN} />
      <text x={O.cx} y={O.cy + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1B2430">
        Nap
      </text>

      {/* Ghost positions + date labels */}
      {STEPS.map((st, i) => {
        const p = orbitPos(st.orbitDeg);
        const dl = dateLabels[i]!;
        return (
          <g key={st.date}>
            <SmallEarth x={p.x} y={p.y} r={15} />
            <motion.text
              x={p.x + dl.dx}
              y={p.y + dl.dy}
              textAnchor={dl.anchor}
              fontSize={13}
              initial={false}
              animate={{ opacity: i === s ? 1 : 0.75 }}
              transition={t}
              fill={i === s ? 'var(--accent)' : 'var(--muted)'}
              fontWeight={i === s ? 700 : 400}
            >
              {st.date}
            </motion.text>
          </g>
        );
      })}

      {/* Moving Earth */}
      <SmallEarth x={e.x} y={e.y} r={17} strong />

      {/* Polaris hint on the back position */}
      {(() => {
        const p = orbitPos(90);
        const x1 = p.x + AX.x * 26;
        const y1 = p.y + AX.y * 26;
        const x2 = p.x + AX.x * 52;
        const y2 = p.y + AX.y * 52;
        return (
          <g>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--muted)" strokeWidth={1.2} strokeDasharray="3 3" />
            <text x={x2 + 6} y={y2 + 4} fontSize={13} fill="var(--muted)">
              ★ Sarkcsillag felé
            </text>
          </g>
        );
      })()}

      {/* Inset: side view */}
      <rect x={364} y={46} width={268} height={302} rx={10} fill="var(--paper)" stroke="var(--line)" />
      <text x={378} y={68} fontSize={13} fill="var(--muted)">
        Oldalnézet – napsugarak balról
      </text>
      {rays.map((dy) => {
        const y = I.cy + dy;
        const xEnd = I.cx - Math.sqrt(I.r * I.r - dy * dy);
        const main = dy === 0;
        return (
          <g key={dy}>
            <line x1={378} y1={y} x2={xEnd - 4} y2={y} stroke={SUN} strokeWidth={main ? 3 : 1.6} opacity={main ? 1 : 0.8} />
            <path d={`M${f(xEnd - 2)},${y} l-8,-4 v8 Z`} fill={SUN} />
          </g>
        );
      })}
      <circle cx={I.cx} cy={I.cy} r={I.r} fill={SEA} />
      <path d={halfDisk(I.cx, I.cy, I.r, 0)} fill="#000" opacity={0.45} />
      {PARALLELS.map((p) => {
        const y = -I.r * Math.sin(rad(p.lat));
        const hw = I.r * Math.cos(rad(p.lat));
        const a = rot(-hw, y);
        const b = rot(hw, y);
        const hit = Math.abs(p.lat - subLat) < 0.6;
        return (
          <g key={p.name}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={hit ? SUN : 'var(--paper)'}
              strokeWidth={hit ? 2.5 : 1}
              strokeDasharray={p.lat === 0 || hit ? undefined : '4 3'}
              opacity={hit ? 1 : 0.85}
            />
            <text x={I.cx + I.r + 8} y={b.y + 4} fontSize={13} fill={hit ? 'var(--accent)' : 'var(--ink)'} fontWeight={hit ? 700 : 400}>
              {p.name}
            </text>
          </g>
        );
      })}
      {(() => {
        const n = rot(0, -I.r * 1.28);
        const sp = rot(0, I.r * 1.28);
        const nl = rot(0, -I.r * 1.28 - 12);
        return (
          <g>
            <line x1={n.x} y1={n.y} x2={sp.x} y2={sp.y} stroke="var(--ink)" strokeWidth={1.8} />
            <text x={nl.x} y={nl.y + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">
              É
            </text>
          </g>
        );
      })()}
      <circle cx={I.cx - I.r} cy={I.cy} r={4.5} fill={SUN} stroke="var(--ink)" strokeWidth={1} />
      <text x={378} y={334} fontSize={13} fill="var(--muted)">
        {`tengelyferdeség: 23,5°`}
      </text>

      {/* Caption */}
      <text x={16} y={378} fontSize={14} fontWeight={700} fill="var(--accent)">
        {info.ray}
      </text>
      <text x={16} y={394} fontSize={13} fill="var(--muted)">
        {info.season}
      </text>
    </svg>
  );
}
