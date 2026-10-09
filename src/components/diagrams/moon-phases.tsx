import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
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

/** Keeps an angle target continuous so the Moon always moves forward/shortest way. */
function useUnwrapped(deg: number): number {
  const [v, setV] = useState(deg);
  useEffect(() => {
    setV((prev) => {
      let d = deg;
      while (d < prev - 180) d += 360;
      while (d > prev + 180) d -= 360;
      return d;
    });
  }, [deg]);
  return v;
}

const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => n.toFixed(1);

function halfDisk(cx: number, cy: number, r: number, dir: number): string {
  const a = rad(dir - 90);
  const b = rad(dir + 90);
  return `M${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))} A${r},${r} 0 0 1 ${f(cx + r * Math.cos(b))},${f(cy + r * Math.sin(b))} Z`;
}

/** Lit part of the Moon as seen from the northern hemisphere; e = elongation (0 new, 180 full). */
function phasePath(cx: number, cy: number, R: number, e: number): string {
  const m = ((e % 360) + 360) % 360;
  const rx = Math.abs(Math.cos(rad(m))) * R;
  const top = `${f(cx)},${f(cy - R)}`;
  const bot = `${f(cx)},${f(cy + R)}`;
  if (m <= 180) {
    // waxing: right side lit
    const crescent = m < 90;
    return `M${top} A${R},${R} 0 0 1 ${bot} A${f(rx)},${R} 0 0 ${crescent ? 0 : 1} ${top} Z`;
  }
  const crescent = m > 270;
  return `M${top} A${R},${R} 0 0 0 ${bot} A${f(rx)},${R} 0 0 ${crescent ? 1 : 0} ${top} Z`;
}

const NAMES = ['Újhold', 'Növekvő sarló', 'Első negyed', 'Növekvő hold', 'Holdtölte (telihold)', 'Fogyó hold', 'Utolsó negyed', 'Fogyó sarló'];
const AGE = ['0. nap', '~4. nap', '~7. nap', '~11. nap', '~15. nap', '~18. nap', '~22. nap', '~26. nap'];

const SEA = '#4A90C2';
const SUN = '#F2C14E';
const MOON = '#DCEBF5';
const C = { x: 260, y: 210, r: 128 };

/** Moon position on screen for elongation e (Sun on the left, view from above the North Pole). */
const moonPos = (e: number) => {
  const a = rad(180 + e); // counter-clockwise
  return { x: C.x + C.r * Math.cos(a), y: C.y - C.r * Math.sin(a) };
};

export default function MoonPhases({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(7, Math.round(step)));
  const target = useUnwrapped(s * 45);
  const e = useTween(target, reduced);
  const m = moonPos(e);
  const lit = Math.round(((1 - Math.cos(rad(s * 45))) / 2) * 100);
  const name = NAMES[s] ?? '';

  const I = { x: 545, y: 196, r: 52 };

  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label={`Holdfázisok: ${name}. A Hold a pályáján a Nap felől számítva ${s * 45}°-ra áll; a Földről a korong ${lit}%-a látszik megvilágítva.`}
      style={{ fontFamily: 'inherit' }}
    >
      <text x={16} y={28} fontSize={17} fontWeight={700} fill="var(--ink)">
        {name}
        <tspan fill="var(--muted)" fontWeight={400}>{`  ·  ${AGE[s] ?? ''}`}</tspan>
      </text>

      {/* Sunlight from the left */}
      {[-110, -55, 0, 55, 110].map((dy) => (
        <g key={dy}>
          <line x1={14} y1={C.y + dy} x2={74} y2={C.y + dy} stroke={SUN} strokeWidth={2} />
          <path d={`M82,${C.y + dy} l-9,-4.5 v9 Z`} fill={SUN} />
        </g>
      ))}
      <text x={14} y={C.y - 128} fontSize={13} fill="var(--muted)">
        napfény
      </text>

      {/* Orbit */}
      <circle cx={C.x} cy={C.y} r={C.r} fill="none" stroke="var(--muted)" strokeDasharray="5 4" strokeWidth={1.2} />
      {[22.5, 112.5, 202.5, 292.5].map((d) => {
        const p = moonPos(d);
        const a = rad(180 + d);
        const tx = -Math.sin(a);
        const ty = -Math.cos(a);
        return (
          <path
            key={d}
            d={`M${f(p.x + tx * 9)},${f(p.y + ty * 9)} L${f(p.x - tx * 4 - ty * 3.5)},${f(p.y - ty * 4 + tx * 3.5)} L${f(p.x - tx * 4 + ty * 3.5)},${f(p.y - ty * 4 - tx * 3.5)} Z`}
            fill="var(--muted)"
          />
        );
      })}

      {/* Earth */}
      <circle cx={C.x} cy={C.y} r={26} fill={SEA} />
      <path d={halfDisk(C.x, C.y, 26, 0)} fill="#000" opacity={0.45} />
      <text x={C.x} y={C.y + 44} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">
        Föld
      </text>

      {/* Ghost Moons at the 8 positions, lit side towards the Sun */}
      {NAMES.map((n, i) => {
        const p = moonPos(i * 45);
        return (
          <g key={n} opacity={i === s ? 0 : 0.5}>
            <circle cx={p.x} cy={p.y} r={11} fill={MOON} />
            <path d={halfDisk(p.x, p.y, 11, 0)} fill="#000" opacity={0.55} />
          </g>
        );
      })}

      {/* Line of sight */}
      <line x1={C.x} y1={C.y} x2={m.x} y2={m.y} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 3" />

      {/* Current Moon */}
      <circle cx={m.x} cy={m.y} r={15} fill={MOON} />
      <path d={halfDisk(m.x, m.y, 15, 0)} fill="#000" opacity={0.55} />
      <circle cx={m.x} cy={m.y} r={18} fill="none" stroke="var(--accent)" strokeWidth={2.5} />

      <text x={C.x} y={384} textAnchor="middle" fontSize={13} fill="var(--muted)">
        felülnézet az Északi-sark felől · nem méretarányos
      </text>

      {/* Inset: view from Earth */}
      <rect x={458} y={60} width={174} height={290} rx={10} fill="var(--paper)" stroke="var(--line)" />
      <text x={545} y={84} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">
        Így látjuk a Földről
      </text>
      <text x={545} y={101} textAnchor="middle" fontSize={13} fill="var(--muted)">
        (északi félgömb)
      </text>
      <circle cx={I.x} cy={I.y} r={I.r} fill={MOON} />
      <circle cx={I.x} cy={I.y} r={I.r} fill="#000" opacity={0.72} />
      <path d={phasePath(I.x, I.y, I.r, e)} fill={MOON} />
      <circle cx={I.x} cy={I.y} r={I.r} fill="none" stroke="var(--muted)" strokeWidth={1} />
      <text x={545} y={276} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--accent)">
        {name.replace(' (telihold)', '')}
      </text>
      <text x={545} y={298} textAnchor="middle" fontSize={13} fill="var(--ink)">
        {`megvilágítva: ${lit}%`}
      </text>
      <text x={545} y={318} textAnchor="middle" fontSize={13} fill="var(--muted)">
        {s === 0 || s === 4 ? '' : s < 4 ? 'jobb oldala világos' : 'bal oldala világos'}
      </text>
    </svg>
  );
}
