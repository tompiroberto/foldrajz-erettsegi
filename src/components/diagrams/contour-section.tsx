import type { DiagramProps } from './types';

const LAND = '#C9B79C';
const VEG = '#5E9C5A';
const f = (n: number) => n.toFixed(1);

// Map: contour lines as ellipses whose centres lie on the A–B line (y = LY).
const LY = 132;
const CONTOURS = [
  { h: 100, cx: 327.5, rx: 252.5, ry: 72 },
  { h: 200, cx: 308.5, rx: 216.5, ry: 58 },
  { h: 300, cx: 205, rx: 95, ry: 44 },
  { h: 300, cx: 407.5, rx: 62.5, ry: 30 },
  { h: 400, cx: 189, rx: 61, ry: 26 },
];
const A = 50;
const B = 592;

// Profile points along A–B: where the line crosses each contour, plus summits and the saddle.
const PROFILE: [number, number][] = [
  [A, 80],
  [75, 100],
  [92, 200],
  [110, 300],
  [128, 400],
  [175, 462],
  [250, 400],
  [300, 300],
  [322, 262],
  [345, 300],
  [405, 338],
  [470, 300],
  [525, 200],
  [580, 100],
  [B, 90],
];

// Section scale
const S0 = 372; // y of 0 m
const K = 0.22; // px per metre
const sy = (h: number) => S0 - h * K;

/** Smooth path through points (Catmull–Rom → cubic Bézier). */
function smooth(pts: [number, number][]): string {
  let d = `M${f(pts[0]![0])},${f(pts[0]![1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0]!)},${f(c1[1]!)} ${f(c2[0]!)},${f(c2[1]!)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

const halo = { stroke: 'var(--paper-2)', strokeWidth: 4, paintOrder: 'stroke' as const, strokeLinejoin: 'round' as const };

export default function ContourSection(_props: DiagramProps) {
  const sectionPts = PROFILE.map(([x, h]) => [x, sy(h)] as [number, number]);
  const line = smooth(sectionPts);
  const area = `${line} L${B},${S0} L${A},${S0} Z`;
  const crossings = PROFILE.filter(([, h]) => h % 100 === 0);

  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="Szintvonalas térkép 100 méteres szintközzel, két csúccsal (462 m és 338 m), közöttük nyereggel, és alatta az A–B vonal menti keresztmetszet: a sűrű szintvonalak meredek, a ritkák lankás lejtőt jelentenek."
      style={{ fontFamily: 'inherit' }}
    >
      <text x={16} y={26} fontSize={17} fontWeight={700} fill="var(--ink)">
        Szintvonalas térkép
        <tspan fill="var(--muted)" fontWeight={400}>
          {'  ·  szintköz: 100 m'}
        </tspan>
      </text>

      {/* Map */}
      <rect x={40} y={40} width={560} height={182} fill={VEG} fillOpacity={0.18} stroke="var(--line)" />
      {CONTOURS.map((c, i) => (
        <ellipse key={i} cx={c.cx} cy={LY} rx={c.rx} ry={c.ry} fill={LAND} fillOpacity={0.32} stroke="var(--ink)" strokeOpacity={0.75} strokeWidth={1.3} />
      ))}
      {CONTOURS.map((c, i) => (
        <text key={i} x={c.cx + (i === 1 ? 70 : 0)} y={LY - c.ry * (i === 1 ? 0.89 : 1) + 4} textAnchor="middle" fontSize={13} fill="var(--ink)" {...halo}>
          {c.h}
        </text>
      ))}
      {/* Summits */}
      {[
        { x: 175, h: 462 },
        { x: 405, h: 338 },
      ].map((p) => (
        <g key={p.x}>
          <path d={`M${p.x},${LY - 13} l6,10 h-12 Z`} fill="var(--ink)" />
          <text x={p.x + 9} y={LY - 4} fontSize={13} fontWeight={700} fill="var(--ink)" {...halo}>
            {p.h}
          </text>
        </g>
      ))}
      {/* A–B line */}
      <line x1={A} y1={LY} x2={B} y2={LY} stroke="var(--accent)" strokeWidth={2.2} />
      {crossings.map(([x]) => (
        <circle key={x} cx={x} cy={LY} r={2.6} fill="var(--accent)" />
      ))}
      <text x={A - 4} y={LY - 8} textAnchor="end" fontSize={15} fontWeight={700} fill="var(--accent)" {...halo}>
        A
      </text>
      <text x={B + 4} y={LY - 8} fontSize={15} fontWeight={700} fill="var(--accent)" {...halo}>
        B
      </text>

      {/* Projection lines */}
      {crossings.map(([x, h]) => (
        <line key={x} x1={x} y1={LY + 4} x2={x} y2={sy(h)} stroke="var(--muted)" strokeWidth={0.8} strokeDasharray="2 3" />
      ))}

      {/* Section */}
      <text x={16} y={244} fontSize={15} fontWeight={700} fill="var(--ink)">
        Keresztmetszet A–B mentén
      </text>
      {[0, 100, 200, 300, 400, 500].map((h) => (
        <g key={h}>
          <line x1={A} y1={sy(h)} x2={B} y2={sy(h)} stroke="var(--line)" strokeWidth={h === 0 ? 1.4 : 0.8} />
          <text x={A - 6} y={sy(h) + 4} textAnchor="end" fontSize={13} fill="var(--muted)">
            {h}
          </text>
        </g>
      ))}
      <text x={B + 6} y={sy(500) + 4} fontSize={13} fill="var(--muted)">
        m
      </text>
      <path d={area} fill={LAND} fillOpacity={0.75} />
      <path d={line} fill="none" stroke="var(--ink)" strokeWidth={2} />
      {crossings.map(([x, h]) => (
        <circle key={x} cx={x} cy={sy(h)} r={2.6} fill="var(--accent)" />
      ))}
      <text x={175} y={sy(462) - 8} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">
        462 m
      </text>
      <text x={405} y={sy(338) - 8} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">
        338 m
      </text>
      <text x={322} y={sy(262) + 22} textAnchor="middle" fontSize={13} fill="#1B2430">
        nyereg
      </text>
      <text x={114} y={sy(40)} fontSize={13} fontWeight={700} fill="#1B2430">
        meredek
      </text>
      <text x={520} y={sy(40)} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1B2430">
        lankás
      </text>
      <text x={16} y={394} fontSize={13} fill="var(--muted)">
        sűrű szintvonalak: meredek lejtő · ritka szintvonalak: lankás lejtő
      </text>
      <text x={B} y={394} textAnchor="end" fontSize={13} fill="var(--muted)">
        a magasság túlozva
      </text>
    </svg>
  );
}
