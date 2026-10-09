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
const LAND = '#C9B79C';
const SUN = '#F2C14E';
const MOON = '#DCEBF5';

const E = { x: 330, y: 230, r: 64 };

interface Step {
  title: string;
  note: string;
  moonDeg: number; // direction of the Moon (math angle, 0 = right, 90 = up)
  far: number; // 0…1 size of the far-side bulge
  sun: number; // 0…1 solar tide
}
const STEPS: Step[] = [
  { title: 'A Hold vonzása dagályhullámot emel', note: 'A Hold felé eső oldalon a vonzás a legerősebb: dagály.', moonDeg: 0, far: 0, sun: 0 },
  { title: 'A Föld túloldalán is dagály van', note: 'A túloldalon a vonzás a leggyengébb, a víz „lemarad”: ott is dagály.', moonDeg: 0, far: 1, sun: 0 },
  { title: 'Szökőár: a Nap és a Hold egy irányba húz', note: 'Újholdkor és holdtöltekor a két dagályhullám összeadódik.', moonDeg: 0, far: 1, sun: 1 },
  { title: 'Vakár: a Nap és a Hold derékszögben áll', note: 'Első és utolsó negyedkor a hatások gyengítik egymást.', moonDeg: 90, far: 1, sun: 1 },
];

const AM = 26; // lunar tide (exaggerated)
const AS = 12; // solar tide ≈ 0.46 × lunar

export default function Tides({ step = 0, reduced }: DiagramProps) {
  const s = Math.max(0, Math.min(STEPS.length - 1, Math.round(step)));
  const info = STEPS[s] ?? STEPS[0]!;
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };
  const md = useTween(info.moonDeg, reduced);
  const far = useTween(info.far, reduced);
  const sun = useTween(info.sun, reduced);

  // Water envelope: r(θ) = R + lunar + solar (Sun on the left, 180°).
  const pts: string[] = [];
  for (let i = 0; i < 180; i++) {
    const th = (i / 180) * 360;
    const cm = Math.cos(rad(th - md));
    const lunar = cm >= 0 ? AM * cm * cm : AM * far * cm * cm;
    const cs = Math.cos(rad(th - 180));
    const solar = AS * sun * cs * cs;
    const rr = E.r + 8 + lunar + solar;
    pts.push(`${f(E.x + rr * Math.cos(rad(th)))},${f(E.y - rr * Math.sin(rad(th)))}`);
  }

  const dist = 230 - (md / 90) * 62; // Moon nearer on screen when on top
  const m = { x: E.x + dist * Math.cos(rad(md)), y: E.y - dist * Math.sin(rad(md)) };
  const ux = Math.cos(rad(md));
  const uy = -Math.sin(rad(md));
  const spring = s === 2;
  const neap = s === 3;

  const lab = (deg: number, k: number) => ({ x: E.x + k * Math.cos(rad(deg)), y: E.y - k * Math.sin(rad(deg)) });
  const hiNear = lab(md + (md < 45 ? -24 : 26), E.r + 8 + AM + 8);
  const hiFar = lab(md + 156, E.r + 8 + AM + 8);
  const lo1 = lab(md + 90, E.r + 8 + AS * sun + 18);
  const lo2 = lab(md - 90, E.r + 8 + AS * sun + 18);

  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label={`Tengerjárás: ${info.title}. ${info.note}`}
      style={{ fontFamily: 'inherit' }}
    >
      <text x={16} y={28} fontSize={17} fontWeight={700} fill="var(--ink)">
        {info.title}
      </text>

      {/* Sun */}
      <motion.g initial={false} animate={{ opacity: info.sun ? 1 : 0.15 }} transition={t}>
        <circle cx={-44} cy={E.y} r={100} fill={SUN} />
        <text x={12} y={E.y + 5} fontSize={15} fontWeight={700} fill="#1B2430">
          Nap
        </text>
        <motion.g initial={false} animate={{ opacity: info.sun ? 1 : 0 }} transition={t}>
          <line x1={84} y1={E.y} x2={E.x - E.r - 84} y2={E.y} stroke={SUN} strokeWidth={2.5} strokeDasharray="6 4" />
          <path d={`M70,${E.y} l12,-6 v12 Z`} fill={SUN} />
          <text x={80} y={E.y - 10} fontSize={13} fill="var(--muted)">
            a Nap vonzása
          </text>
        </motion.g>
      </motion.g>

      {/* Water + Earth */}
      <polygon points={pts.join(' ')} fill={SEA} opacity={0.85} />
      <circle cx={E.x} cy={E.y} r={E.r} fill={LAND} />
      <circle cx={E.x} cy={E.y} r={E.r} fill="none" stroke="#8C7A5E" strokeWidth={1} />
      <text x={E.x} y={E.y + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="#1B2430">
        Föld
      </text>

      {/* Moon + pull arrow */}
      <circle cx={m.x} cy={m.y} r={17} fill={MOON} />
      <text x={m.x + (neap ? 26 : 0)} y={m.y + (neap ? 5 : 36)} textAnchor={neap ? 'start' : 'middle'} fontSize={14} fontWeight={700} fill="var(--ink)">
        Hold
      </text>
      {(() => {
        const p0 = { x: E.x + ux * (E.r + AM + 16), y: E.y + uy * (E.r + AM + 16) };
        const tip = { x: m.x - ux * 22, y: m.y - uy * 22 };
        const base = { x: tip.x - ux * 12, y: tip.y - uy * 12 };
        const mid = { x: (p0.x + tip.x) / 2, y: (p0.y + tip.y) / 2 };
        const vertical = Math.abs(uy) > 0.7;
        return (
          <g>
            <line x1={p0.x} y1={p0.y} x2={base.x} y2={base.y} stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="6 4" />
            <path
              d={`M${f(tip.x)},${f(tip.y)} L${f(base.x - uy * 6)},${f(base.y + ux * 6)} L${f(base.x + uy * 6)},${f(base.y - ux * 6)} Z`}
              fill="var(--accent)"
            />
            <text x={vertical ? mid.x + 12 : mid.x} y={vertical ? mid.y + 4 : mid.y - 10} textAnchor={vertical ? 'start' : 'middle'} fontSize={13} fill="var(--muted)">
              a Hold vonzása
            </text>
          </g>
        );
      })()}

      {/* Labels */}
      <text x={hiNear.x} y={hiNear.y + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">
        dagály
      </text>
      <text x={hiFar.x} y={hiFar.y + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)" opacity={far}>
        dagály
      </text>
      <text x={lo1.x} y={lo1.y + 4} textAnchor="middle" fontSize={13} fill="var(--muted)">
        apály
      </text>
      <text x={lo2.x} y={lo2.y + 4} textAnchor="middle" fontSize={13} fill="var(--muted)">
        apály
      </text>

      {/* Badge */}
      <motion.g initial={false} animate={{ opacity: spring || neap ? 1 : 0 }} transition={t}>
        <rect x={460} y={318} width={170} height={52} rx={8} fill="var(--paper)" stroke="var(--line)" />
        <text x={545} y={340} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--accent)">
          {neap ? 'Vakár' : 'Szökőár'}
        </text>
        <text x={545} y={359} textAnchor="middle" fontSize={13} fill="var(--muted)">
          {neap ? 'kis tengerszint-különbség' : 'nagy tengerszint-különbség'}
        </text>
      </motion.g>

      <text x={16} y={390} fontSize={13} fill="var(--muted)">
        {info.note}
      </text>
    </svg>
  );
}
