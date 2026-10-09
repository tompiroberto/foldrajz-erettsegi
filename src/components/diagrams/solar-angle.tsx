import type { DiagramProps } from './types';

const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => n.toFixed(1);
const SEA = '#4A90C2';
const SUN = '#F2C14E';

const E = { x: 330, y: 222, r: 160 };
const BEAM = 9; // half-width of a sunbeam

const SITES = [
  
  { lat: 47.5, name: 'Budapest (é. sz. 47,5°)', angle: '42,5°' },
  { lat: 0, name: 'Egyenlítő (0°)', angle: '90°' },
  { lat: -70, name: 'd. sz. 70°', angle: '20°' },
];

/** Point on the limb at latitude lat (sunlit left side). */
const limb = (lat: number) => ({ x: E.x - E.r * Math.cos(rad(lat)), y: E.y - E.r * Math.sin(rad(lat)) });
const latAtY = (y: number) => (Math.asin((E.y - y) / E.r) * 180) / Math.PI;

export default function SolarAngle(_props: DiagramProps) {
  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="A napsugarak hajlásszöge nap-éj egyenlőségkor: az Egyenlítőn 90°, Budapesten 42,5°, az é. sz. 70°-on 20°; a delelési magasság képlete m = 90° − |φ − δ|."
      style={{ fontFamily: 'inherit' }}
    >
      <text x={16} y={28} fontSize={17} fontWeight={700} fill="var(--ink)">
        A napsugarak hajlásszöge
        <tspan fill="var(--muted)" fontWeight={400}>
          {'  ·  nap-éj egyenlőségkor (δ = 0°)'}
        </tspan>
      </text>

      {/* Beams (behind the Earth) */}
      {SITES.map((s) => {
        const p = limb(s.lat);
        const pa = limb(latAtY(p.y - BEAM));
        const pb = limb(latAtY(p.y + BEAM));
        return (
          <path
            key={s.lat}
            d={'M16,' + f(p.y - BEAM) + ' L' + f(pa.x) + ',' + f(pa.y) + ' A' + E.r + ',' + E.r + ' 0 0 0 ' + f(pb.x) + ',' + f(pb.y) + ' L16,' + f(p.y + BEAM) + ' Z'}
            fill={SUN}
            opacity={0.22}
          />
        );
      })}

      {/* Northern half of the Earth (left part) */}
      <path d={`M${E.x},${E.y - E.r} A${E.r},${E.r} 0 0 0 ${E.x - E.r},${E.y} L${E.x},${E.y} Z`} fill={SEA} />
      <path d={`M${E.x - E.r},${E.y} A${E.r},${E.r} 0 0 0 ${E.x},${E.y + E.r} L${E.x},${E.y} Z`} fill={SEA} />
      <line x1={E.x} y1={E.y - E.r - 14} x2={E.x} y2={E.y + E.r} stroke="var(--ink)" strokeWidth={1.5} />
      <text x={E.x + 6} y={E.y - E.r - 2} fontSize={13} fontWeight={700} fill="var(--ink)">
        É
      </text>
      <line x1={E.x - E.r} y1={E.y} x2={E.x} y2={E.y} stroke="var(--paper)" strokeWidth={1} opacity={0.8} />

      {SITES.map((s) => {
        const p = limb(s.lat);
        const sn = Math.sin(rad(s.lat));
        const cs = Math.cos(rad(s.lat));
        // tangent towards the north: (sin φ, −cos φ)
        const tx = sn;
        const ty = -cs;
        // footprint of the beam on the surface
        const la = latAtY(p.y - BEAM);
        const lb = latAtY(p.y + BEAM);
        const pa = limb(la);
        const pb = limb(lb);
        // angle arc between the ray (towards the Sun, 180°) and the surface towards the Equator
        const south = s.lat < 0;
        // direction along the surface towards the Equator
        const aSurf = south ? Math.atan2(-cs, sn) : Math.atan2(cs, -sn);
        const R = 30;
        const q1 = { x: p.x + R * Math.cos(aSurf), y: p.y + R * Math.sin(aSurf) };
        const q2 = { x: p.x - R, y: p.y };
        const a2 = south ? aSurf + 2 * Math.PI : aSurf;
        const mid = (a2 + Math.PI) / 2;
        const lab0 = { x: p.x + (R + 18) * Math.cos(mid), y: p.y + (R + 18) * Math.sin(mid) };
        const lab = Math.abs(lab0.y - p.y) < BEAM + 8 ? { x: lab0.x - 6, y: south ? p.y - BEAM - 8 : p.y + BEAM + 12 } : lab0;
        return (
          <g key={s.lat}>
            {/* parallel */}
            <line x1={p.x} y1={p.y} x2={E.x} y2={p.y} stroke="var(--paper)" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
            {/* ray */}
            <line x1={16} y1={p.y} x2={p.x - 6} y2={p.y} stroke={SUN} strokeWidth={2.2} />
            <path d={`M${f(p.x)},${f(p.y)} l-10,-4.5 v9 Z`} fill={SUN} />
            {/* footprint */}
            <path d={`M${f(pa.x)},${f(pa.y)} A${E.r},${E.r} 0 0 0 ${f(pb.x)},${f(pb.y)}`} fill="none" stroke={SUN} strokeWidth={5} />
            {/* local horizon */}
            <line x1={p.x - tx * 30} y1={p.y - ty * 30} x2={p.x + tx * 30} y2={p.y + ty * 30} stroke="var(--ink)" strokeWidth={1.6} />
            {/* angle */}
            {s.lat === 0 ? (
              <path d={`M${p.x - 12},${p.y} v12 h12`} fill="none" stroke="var(--accent)" strokeWidth={2} />
            ) : (
              <path d={south ? `M${f(q2.x)},${f(q2.y)} A${R},${R} 0 0 1 ${f(q1.x)},${f(q1.y)}` : `M${f(q1.x)},${f(q1.y)} A${R},${R} 0 0 1 ${f(q2.x)},${f(q2.y)}`} fill="none" stroke="var(--accent)" strokeWidth={2} />
            )}
            <text
              x={s.lat === 0 ? p.x - 24 : lab.x}
              y={s.lat === 0 ? p.y + 30 : lab.y + 5}
              textAnchor="middle"
              fontSize={14}
              fontWeight={700}
              fill="var(--accent)"
            >
              {s.angle}
            </text>
            <text x={20} y={p.y - BEAM - 5} fontSize={13} fill="var(--ink)">
              {s.name}
            </text>
          </g>
        );
      })}


      {/* Formula panel */}
      <rect x={356} y={50} width={276} height={238} rx={10} fill="var(--paper)" stroke="var(--line)" />
      <text x={372} y={74} fontSize={13} fill="var(--muted)">
        Delelési magasság (a Nap szöge délben)
      </text>
      <text x={372} y={106} fontSize={24} fontWeight={700} fill="var(--accent)">
        m = 90° − |φ − δ|
      </text>
      <text x={372} y={132} fontSize={13} fill="var(--ink)">
        φ: a hely földrajzi szélessége
      </text>
      <text x={372} y={150} fontSize={13} fill="var(--ink)">
        δ: ahol a napsugár merőleges
      </text>
      <text x={386} y={168} fontSize={13} fill="var(--muted)">
        (−23,5° … +23,5°)
      </text>
      <line x1={372} y1={180} x2={616} y2={180} stroke="var(--line)" />
      <text x={372} y={200} fontSize={13} fontWeight={700} fill="var(--ink)">
        Budapest, φ = 47,5°
      </text>
      {[
        ['márc. 21., szept. 23. (δ = 0°)', '42,5°'],
        ['jún. 21. (δ = +23,5°)', '66°'],
        ['dec. 21. (δ = −23,5°)', '19°'],
      ].map(([a, b], i) => (
        <g key={a}>
          <text x={372} y={222 + i * 20} fontSize={13} fill="var(--ink)">
            {a}
          </text>
          <text x={616} y={222 + i * 20} textAnchor="end" fontSize={13} fontWeight={700} fill="var(--accent)">
            {b}
          </text>
        </g>
      ))}

      <text x={356} y={318} fontSize={13} fill="var(--ink)">
        Kisebb szög → ugyanaz a sugárnyaláb
      </text>
      <text x={356} y={336} fontSize={13} fill="var(--ink)">
        nagyobb felületen oszlik el (sárga sáv)
      </text>
      <text x={356} y={354} fontSize={13} fill="var(--ink)">
        → kevesebb energia jut 1 m²-re → hidegebb.
      </text>
    </svg>
  );
}
