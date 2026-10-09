import type { DiagramProps } from './types';

const SEA = '#4A90C2';
const R = 60;
const CY = 190;
const f = (n: number) => n.toFixed(1);
const TILT = 0.2; // ry / rx of parallels (slight view from above)

/** Globe with graticule (seen slightly from above). */
function Globe({ cx }: { cx: number }) {
  const lats = [-60, -30, 0, 30, 60];
  return (
    <g>
      <circle cx={cx} cy={CY} r={R} fill={SEA} opacity={0.55} />
      {lats.map((l) => {
        const y = CY - R * Math.sin((l * Math.PI) / 180);
        const rx = R * Math.cos((l * Math.PI) / 180);
        return (
          <ellipse
            key={l}
            cx={cx}
            cy={y}
            rx={rx}
            ry={rx * TILT}
            fill="none"
            stroke="var(--paper)"
            strokeWidth={l === 0 ? 1.4 : 0.8}
            opacity={0.8}
          />
        );
      })}
      <ellipse cx={cx} cy={CY} rx={R * 0.45} ry={R} fill="none" stroke="var(--paper)" strokeWidth={0.8} opacity={0.8} />
      <line x1={cx} y1={CY - R} x2={cx} y2={CY + R} stroke="var(--paper)" strokeWidth={0.8} opacity={0.8} />
      <circle cx={cx} cy={CY} r={R} fill="none" stroke="var(--ink)" strokeWidth={1.4} />
    </g>
  );
}

const SURF = { fill: 'var(--accent-2)', fillOpacity: 0.18, stroke: 'var(--ink)', strokeWidth: 1.6 } as const;
const BEST = { stroke: 'var(--accent)', strokeWidth: 5, fill: 'none', strokeLinecap: 'round' as const };

function Caption({ cx, title, best, use }: { cx: number; title: string; best: string; use: string }) {
  return (
    <g>
      <text x={cx} y={306} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--ink)">
        {title}
      </text>
      <text x={cx} y={325} textAnchor="middle" fontSize={13} fill="var(--muted)">
        legkisebb torzulás:
      </text>
      <text x={cx} y={342} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--accent)">
        {best}
      </text>
      <text x={cx} y={361} textAnchor="middle" fontSize={13} fill="var(--muted)">
        {use}
      </text>
    </g>
  );
}

export default function Projections(_props: DiagramProps) {
  const A = 110;
  const B = 320;
  const C = 530;

  // Cone tangent along latitude 45°.
  const phi = Math.PI / 4;
  const tx = R * Math.cos(phi);
  const ty = CY - R * Math.sin(phi);
  const apexY = CY - R / Math.sin(phi);
  const baseY = CY + 4;
  const k = (baseY - apexY) / (ty - apexY);
  const baseHalf = tx * k;

  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="Vetülettípusok: a síkvetület a sarkon érinti a földgömböt, a hengervetület az Egyenlítő mentén, a kúpvetület egy szélességi kör mentén; a legkisebb torzulás az érintési pontnál, illetve vonal mentén van."
      style={{ fontFamily: 'inherit' }}
    >
      <text x={16} y={28} fontSize={17} fontWeight={700} fill="var(--ink)">
        Vetületi felületek
        <tspan fill="var(--muted)" fontWeight={400}>
          {'  ·  a földgömböt érintő sík, henger és kúp'}
        </tspan>
      </text>

      {/* Plane (azimuthal) touching the North Pole */}
      <Globe cx={A} />
      <path
        d={`M${A - 92},${CY - R + 14} L${A + 64},${CY - R + 14} L${A + 92},${CY - R - 14} L${A - 64},${CY - R - 14} Z`}
        {...SURF}
      />
      <ellipse cx={A} cy={CY - R} rx={22} ry={22 * TILT * 1.6} {...BEST} />
      <circle cx={A} cy={CY - R} r={3.5} fill="var(--accent)" />
      <text x={A + 28} y={CY - R - 24} fontSize={13} fill="var(--ink)">
        érintési pont
      </text>
      <Caption cx={A} title="Síkvetület" best="az érintési pont körül" use="pl. sarkvidékek térképe" />

      {/* Cylinder touching the Equator */}
      <g>
        <rect x={B - R} y={CY - 76} width={2 * R} height={152} fill="var(--accent-2)" fillOpacity={0.12} stroke="none" />
        <Globe cx={B} />
        <ellipse cx={B} cy={CY - 76} rx={R} ry={R * TILT} {...SURF} />
        <path d={`M${B - R},${CY + 76} A${R},${R * TILT} 0 0 0 ${B + R},${CY + 76}`} {...SURF} fillOpacity={0} />
        <line x1={B - R} y1={CY - 76} x2={B - R} y2={CY + 76} stroke="var(--ink)" strokeWidth={1.6} />
        <line x1={B + R} y1={CY - 76} x2={B + R} y2={CY + 76} stroke="var(--ink)" strokeWidth={1.6} />
        <ellipse cx={B} cy={CY} rx={R} ry={R * TILT} {...BEST} />
        <text x={B - R - 6} y={CY + 4} textAnchor="end" fontSize={13} fill="var(--ink)">
          Egyenlítő
        </text>
      </g>
      <Caption cx={B} title="Hengervetület" best="az Egyenlítő mentén" use="pl. Mercator-térkép" />

      {/* Cone touching latitude 45° */}
      <g>
        <path
          d={`M${C},${f(apexY)} L${f(C - baseHalf)},${baseY} A${f(baseHalf)},${f(baseHalf * TILT)} 0 0 0 ${f(C + baseHalf)},${baseY} Z`}
          fill="var(--accent-2)"
          fillOpacity={0.12}
        />
        <Globe cx={C} />
        <line x1={C} y1={apexY} x2={C - baseHalf} y2={baseY} stroke="var(--ink)" strokeWidth={1.6} />
        <line x1={C} y1={apexY} x2={C + baseHalf} y2={baseY} stroke="var(--ink)" strokeWidth={1.6} />
        <path d={`M${f(C - baseHalf)},${baseY} A${f(baseHalf)},${f(baseHalf * TILT)} 0 0 0 ${f(C + baseHalf)},${baseY}`} {...SURF} fillOpacity={0} />
        <ellipse cx={C} cy={ty} rx={tx} ry={tx * TILT} {...BEST} />
        <text x={C + tx + 8} y={ty - 6} fontSize={13} fill="var(--ink)">
          é. sz. 45°
        </text>
      </g>
      <Caption cx={C} title="Kúpvetület" best="az érintő szélességi kör mentén" use="pl. Európa, mérsékelt öv" />

      {/* Legend */}
      <line x1={16} y1={388} x2={40} y2={388} {...BEST} />
      <text x={48} y={392} fontSize={13} fill="var(--muted)">
        a legkisebb torzulás helye (érintési pont / vonal)
      </text>
    </svg>
  );
}
