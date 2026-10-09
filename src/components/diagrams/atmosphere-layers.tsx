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

function head(x: number, y: number, ang: number, h = 10) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return `${x},${y} ${x - h * c + (h / 2) * s},${y - h * s - (h / 2) * c} ${x - h * c - (h / 2) * s},${y - h * s + (h / 2) * c}`;
}

const SEA = '#4A90C2';
const SUN = '#F2C14E';
const WARM = '#D64545';

const X0 = 74;
const X1 = 372;
const Y0 = 372;
const yH = (km: number) => Y0 - km * 3.12; // 110 km → ≈ 29
const xT = (t: number) => X0 + (t + 100) * 2.35; // −100 °C … +25 °C

const LAYERS = [
  { from: 0, to: 12, op: 0.38, name: 'troposzféra (0–kb. 12 km)', lines: ['időjárás, felhők; felfelé hűl'] },
  { from: 12, to: 50, op: 0.24, name: 'sztratoszféra (12–50 km)', lines: ['az ózon elnyeli az UV-sugárzást,', 'ezért felfelé melegszik'] },
  { from: 50, to: 80, op: 0.14, name: 'mezoszféra (50–80 km)', lines: ['felfelé hűl, kb. −90 °C-ig;', 'itt égnek el a meteorok'] },
  { from: 80, to: 110, op: 0.06, name: 'termoszféra (80 km felett)', lines: ['nagyon ritka levegő, felfelé', 'erősen melegszik; sarki fény'] },
];

const CURVE: [number, number][] = [
  [0, 15],
  [12, -56],
  [20, -56],
  [50, -2],
  [80, -90],
  [90, -90],
  [100, -78],
  [110, -30],
];

export default function AtmosphereLayers(_props: DiagramProps) {
  const d = CURVE.map(([h, t], i) => `${i ? 'L' : 'M'}${xT(t)},${yH(h)}`).join(' ');
  const last = CURVE[CURVE.length - 1]!;
  const prev = CURVE[CURVE.length - 2]!;
  const ang = Math.atan2(yH(last[0]) - yH(prev[0]), xT(last[1]) - xT(prev[1]));
  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="A légkör rétegei – troposzféra, sztratoszféra az ózonréteggel, mezoszféra és termoszféra – és a hőmérséklet változása a magassággal."
    >
      {LAYERS.map((l) => (
        <g key={l.name}>
          <rect x={X0} y={yH(l.to)} width={630 - X0} height={yH(l.from) - yH(l.to)} fill={SEA} fillOpacity={l.op} />
          <line x1={X0} y1={yH(l.to)} x2={630} y2={yH(l.to)} stroke="var(--line)" strokeWidth={1} strokeDasharray={l.to < 110 ? '5 4' : undefined} />
        </g>
      ))}
      {/* ózonréteg */}
      <rect x={X0} y={yH(35)} width={X1 - X0} height={yH(15) - yH(35)} fill={SUN} fillOpacity={0.28} />
      {Array.from({ length: 44 }, (_, i) => (
        <circle key={i} cx={X0 + 12 + (i % 11) * 26 + (i % 3) * 6} cy={yH(17 + Math.floor(i / 11) * 4.6 + (i % 2) * 1.8)} r={2} fill={SUN} />
      ))}
      <Txt x={312} y={yH(27)} a="middle" w={700}>
        ózonréteg
      </Txt>
      <Txt x={312} y={yH(27) + 15} a="middle" s={12}>
        (kb. 15–35 km)
      </Txt>

      {/* rétegnevek */}
      {LAYERS.map((l) => {
        const top = yH(l.to);
        const mid = (yH(l.from) + top) / 2;
        const n = l.lines.length + 1;
        const y0 = mid - ((n - 1) * 15) / 2 + 4;
        return (
          <g key={`t${l.name}`}>
            <Txt x={386} y={y0} w={700}>
              {l.name}
            </Txt>
            {l.lines.map((ln, j) => (
              <Txt key={ln} x={386} y={y0 + (j + 1) * 15} s={12} c="var(--ink)">
                {ln}
              </Txt>
            ))}
          </g>
        );
      })}
      {[
        { h: 12, t: 'tropopauza' },
        { h: 50, t: 'sztratopauza' },
        { h: 80, t: 'mezopauza' },
      ].map((p) => (
        <Txt key={p.t} x={X1 - 4} y={yH(p.h) - 4} a="end" s={12} c="var(--muted)">
          {p.t}
        </Txt>
      ))}

      {/* tengelyek */}
      <line x1={X0} y1={Y0} x2={X0} y2={yH(110)} stroke="var(--ink)" strokeWidth={1.4} />
      <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke="var(--ink)" strokeWidth={1.4} />
      {[0, 20, 40, 60, 80, 100].map((h) => (
        <g key={h}>
          <line x1={X0 - 5} y1={yH(h)} x2={X0} y2={yH(h)} stroke="var(--ink)" />
          <Txt x={X0 - 8} y={yH(h) + 4} a="end" s={12}>
            {h}
          </Txt>
        </g>
      ))}
      <Txt x={X0 - 8} y={yH(110) + 4} a="end" s={12} w={700}>
        km
      </Txt>
      {[-80, -40, 0].map((t) => (
        <g key={t}>
          <line x1={xT(t)} y1={Y0} x2={xT(t)} y2={Y0 + 5} stroke="var(--ink)" />
          <Txt x={xT(t)} y={Y0 + 18} a="middle" s={12}>
            {`${t > 0 ? '+' : t < 0 ? '−' : ''}${Math.abs(t)} °C`}
          </Txt>
        </g>
      ))}
      <line x1={xT(0)} y1={Y0} x2={xT(0)} y2={yH(110)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="2 4" />

      {/* hőmérsékleti görbe */}
      <path d={d} fill="none" stroke={WARM} strokeWidth={3.5} strokeLinejoin="round" />
      <polygon points={head(xT(last[1]), yH(last[0]), ang, 12)} fill={WARM} />
      <Txt x={xT(-30) + 10} y={yH(108)} s={12} c="var(--ink)">
        akár 1000 °C fölött
      </Txt>
      <Txt x={xT(-20)} y={yH(68)} w={700} c={WARM}>
        hőmérséklet
      </Txt>
    </svg>
  );
}
