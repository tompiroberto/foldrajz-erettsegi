import type { ReactNode } from 'react';
import type { DiagramProps } from './types';

const halo = { stroke: 'var(--paper-2)', strokeWidth: 4, paintOrder: 'stroke', strokeLinejoin: 'round' } as const;

function Txt({ x, y, children, a = 'start', s = 13, c = 'var(--ink)', w = 500 }: { x: number; y: number; children: ReactNode; a?: 'start' | 'middle' | 'end'; s?: number; c?: string; w?: number }) {
  return (
    <text x={x} y={y} textAnchor={a} fontSize={s} fill={c} fontWeight={w} style={halo}>
      {children}
    </text>
  );
}

const CX = 60;
const CY = 352;
const R = 320; // Föld sugara a rajzon (6370 km)

const pt = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};

/** Annulus sector between radii r0 < r1 and angles a0 < a1 (degrees, counter-clockwise from +x). */
function sector(r0: number, r1: number, a0: number, a1: number) {
  const [x1, y1] = pt(r1, a0);
  const [x2, y2] = pt(r1, a1);
  const [x3, y3] = pt(r0, a1);
  const [x4, y4] = pt(r0, a0);
  if (r0 <= 0) return `M${CX},${CY} L${x1},${y1} A${r1},${r1} 0 0 0 ${x2},${y2} Z`;
  return `M${x1},${y1} A${r1},${r1} 0 0 0 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 0 1 ${x4},${y4} Z`;
}

const rKm = (km: number) => (R * (6370 - km)) / 6370;
const R_OUTER_CORE = rKm(2900); // ≈ 174
const R_INNER_CORE = rKm(5100); // ≈ 64

// Nem méretarányos vékony rétegek (nagyítva):
const CRUST_OCEAN = R - 7;
const CRUST_CONT = R - 18;
const ASTH_OUT = R - 30;
const ASTH_IN = R - 46;

function Leader({ from, to }: { from: [number, number]; to: [number, number] }) {
  return (
    <g>
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="var(--ink)" strokeWidth={1} />
      <circle cx={from[0]} cy={from[1]} r={2.6} fill="var(--ink)" />
    </g>
  );
}

const LX = 420;

export default function EarthLayers(_props: DiagramProps) {
  const labels: { y: number; at: [number, number]; title: string; sub: string }[] = [
    { y: 34, at: pt(R - 9, 72), title: 'kontinentális kéreg', sub: 'vastag (30–70 km), gránitos' },
    { y: 88, at: pt(R - 3, 36), title: 'óceáni kéreg', sub: 'vékony (5–10 km), bazaltos' },
    { y: 142, at: pt((ASTH_IN + ASTH_OUT) / 2, 26), title: 'asztenoszféra', sub: 'képlékeny, kb. 100–250 km' },
    { y: 196, at: pt(235, 20), title: 'földköpeny', sub: 'szilárd kőzet, kb. 2900 km-ig' },
    { y: 256, at: pt(122, 22), title: 'külső mag', sub: 'folyékony vas-nikkel, 5100 km-ig' },
    { y: 316, at: pt(34, 30), title: 'belső mag', sub: 'szilárd vas-nikkel, 6370 km-ig' },
  ];
  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="A Föld gömbhéjas szerkezete negyedkörös metszetben: földkéreg, asztenoszféra, földköpeny, folyékony külső mag és szilárd belső mag a mélységekkel."
    >
      {/* köpeny */}
      <path d={sector(R_OUTER_CORE, R, 0, 90)} fill="#E4572E" fillOpacity={0.4} stroke="var(--ink)" strokeWidth={1} />
      {/* asztenoszféra */}
      <path d={sector(ASTH_IN, ASTH_OUT, 0, 90)} fill="#E4572E" fillOpacity={0.55} />
      {/* külső mag */}
      <path d={sector(R_INNER_CORE, R_OUTER_CORE, 0, 90)} fill="#E4572E" fillOpacity={0.85} stroke="var(--ink)" strokeWidth={1} />
      {/* belső mag */}
      <path d={sector(0, R_INNER_CORE, 0, 90)} fill="#F2C14E" stroke="var(--ink)" strokeWidth={1} />
      {/* óceáni kéreg + óceán */}
      <path d={sector(CRUST_OCEAN, R, 0, 52)} fill="var(--muted)" fillOpacity={0.75} />
      <path d={sector(R, R + 6, 0, 52)} fill="#4A90C2" />
      {/* kontinentális kéreg */}
      <path d={sector(CRUST_CONT, R + 4, 52, 90)} fill="#C9B79C" stroke="var(--ink)" strokeWidth={0.8} />
      {/* határok */}
      <path d={sector(0, R, 0, 90)} fill="none" stroke="var(--ink)" strokeWidth={1.4} />

      {/* mélységskála a vízszintes sugár mentén */}
      {[
        { r: R, t: "0 km", low: false },
        { r: R_OUTER_CORE, t: "kb. 2900 km", low: false },
        { r: R_INNER_CORE, t: "kb. 5100 km", low: true },
        { r: 0, t: "6370 km", low: false },
      ].map(({ r, t, low }) => (
        <g key={t}>
          <line x1={CX + r} y1={CY} x2={CX + r} y2={CY + (low ? 24 : 8)} stroke="var(--ink)" strokeWidth={1.4} />
          <Txt x={CX + r} y={CY + (low ? 39 : 23)} a="middle" s={12} c="var(--muted)">
            {t}
          </Txt>
        </g>
      ))}
      <Txt x={CX + 4} y={CY - 6} s={12} c="var(--ink)" w={700}>
        a Föld középpontja
      </Txt>

      {labels.map((l) => (
        <g key={l.title}>
          <Leader from={l.at} to={[LX - 6, l.y - 4]} />
          <Txt x={LX} y={l.y} w={700}>
            {l.title}
          </Txt>
          <Txt x={LX} y={l.y + 16} s={12} c="var(--muted)">
            {l.sub}
          </Txt>
        </g>
      ))}
      <Txt x={630} y={392} a="end" s={12} c="var(--muted)">
        A kéreg és az asztenoszféra vastagsága nagyítva.
      </Txt>
    </svg>
  );
}
