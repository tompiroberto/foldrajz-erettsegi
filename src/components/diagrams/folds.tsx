import { useId, type ReactNode } from 'react';
import type { DiagramProps } from './types';

const halo = { stroke: 'var(--paper-2)', strokeWidth: 4, paintOrder: 'stroke', strokeLinejoin: 'round' } as const;

function Txt({ x, y, children, a = 'middle', s = 13, c = 'var(--ink)', w = 500 }: { x: number; y: number; children: ReactNode; a?: 'start' | 'middle' | 'end'; s?: number; c?: string; w?: number }) {
  return (
    <text x={x} y={y} textAnchor={a} fontSize={s} fill={c} fontWeight={w} style={halo}>
      {children}
    </text>
  );
}

function head(x: number, y: number, ang: number, h = 9) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return `${x},${y} ${x - h * c + (h / 2) * s},${y - h * s - (h / 2) * c} ${x - h * c - (h / 2) * s},${y - h * s + (h / 2) * c}`;
}

function Arrow({ x1, y1, x2, y2, c = 'var(--ink)', w = 2.5, h = 10 }: { x1: number; y1: number; x2: number; y2: number; c?: string; w?: number; h?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - h * 0.8 * Math.cos(a)} y2={y2 - h * 0.8 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <polygon points={head(x2, y2, a, h)} fill={c} />
    </g>
  );
}

const BANDS: { fill: string; op: number }[] = [
  { fill: '#C9B79C', op: 1 },
  { fill: '#F2C14E', op: 0.75 },
  { fill: '#E4572E', op: 0.5 },
  { fill: '#DCEBF5', op: 0.9 },
  { fill: '#5E9C5A', op: 0.6 },
  { fill: '#C9B79C', op: 1 },
  { fill: '#F2C14E', op: 0.75 },
  { fill: '#E4572E', op: 0.5 },
];

const PW = 196;
const PH = 136;

/** One fold panel. sh = horizontal shear (tilt of the axial plane). */
function Fold({ x0, y0, sh, amp, id, recumbent = false }: { x0: number; y0: number; sh: number; amp: number; id: string; recumbent?: boolean }) {
  const yc = PH / 2;
  const th = 15;
  const curve = (k: number) => {
    const pts: string[] = [];
    for (let x = -260; x <= 460; x += 6) {
      const y = -10 + k * th + amp * (1 - Math.cos((2 * Math.PI * (x - PW / 2)) / 200)) / 2;
      pts.push(`${x + sh * (y - yc)},${y}`);
    }
    return pts;
  };
  const bands = [...BANDS, ...BANDS].slice(0, 11).map((b, k) => {
    const top = curve(k);
    const bot = curve(k + 1).reverse();
    return { d: `M${top.join(' L')} L${bot.join(' L')} Z`, ...b };
  });
  const ax0 = PW / 2 + sh * (0 - yc);
  const ax1 = PW / 2 + sh * (PH - yc);
  // fekvő redő: koncentrikus, oldalra dőlt boltozat (orra jobbra mutat)
  const XN = 128;
  const R = (k: number) => k * 12;
  const lying = BANDS.slice(0, 6).map((b, k) => {
    const r0 = R(k);
    const r1 = R(k + 1);
    return {
      d: `M-60,${yc - r1} L${XN},${yc - r1} A${r1},${r1} 0 0 1 ${XN},${yc + r1} L-60,${yc + r1} L-60,${yc + r0} L${XN},${yc + r0} A${Math.max(r0, 0.1)},${Math.max(r0, 0.1)} 0 0 0 ${XN},${yc - r0} L-60,${yc - r0} Z`,
      ...b,
    };
  });
  return (
    <g transform={`translate(${x0},${y0})`}>
      <clipPath id={id}>
        <rect x={0} y={0} width={PW} height={PH} rx={8} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={0} y={0} width={PW} height={PH} fill="#C9B79C" fillOpacity={0.5} />
        {recumbent ? (
          <g transform={`rotate(10 ${XN} ${yc})`}>
            {lying.map((b, k) => (
              <path key={k} d={b.d} fill={b.fill} fillOpacity={b.op} stroke="var(--ink)" strokeOpacity={0.35} strokeWidth={0.8} />
            ))}
            <line x1={-40} y1={yc} x2={XN + 80} y2={yc} stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="6 4" />
          </g>
        ) : (
          <>
            {bands.map((b, k) => (
              <path key={k} d={b.d} fill={b.fill} fillOpacity={b.op} stroke="var(--ink)" strokeOpacity={0.35} strokeWidth={0.8} />
            ))}
            <line x1={ax0} y1={0} x2={ax1} y2={PH} stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="6 4" />
          </>
        )}
      </g>
      <rect x={0} y={0} width={PW} height={PH} rx={8} fill="none" stroke="var(--line)" />
    </g>
  );
}

function Block({ poly, dy, id }: { poly: string; dy: number; id: string }) {
  return (
    <g>
      <clipPath id={id}>
        <polygon points={poly} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        {[...BANDS, ...BANDS].map((b, k) => (
          <rect key={k} x={-10} y={dy + k * 18 - 40} width={400} height={18} fill={b.fill} fillOpacity={b.op} />
        ))}
      </g>
      <polygon points={poly} fill="none" stroke="var(--ink)" strokeWidth={1.4} />
    </g>
  );
}

export default function Folds(_props: DiagramProps) {
  const uid = useId().replace(/:/g, '');
  const f1 = (y: number) => 100 - (y / 140) * 20;
  const f2 = (y: number) => 190 + (y / 140) * 20;
  const f3 = (y: number) => 290 - (y / 140) * 20;
  const fv = (y: number) => 140 - (y / 140) * 40;
  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label="Gyűrődés és vetődés: álló, ferde és fekvő redő, valamint vetődés, kiemelt rög (sasbérc) és süllyedt rög (árok) keresztmetszetben."
    >
      <Txt x={14} y={22} a="start" s={14} w={700}>
        Gyűrődés: a képlékeny rétegek oldalirányú nyomásra meghajlanak
      </Txt>
      {[
        { x: 12, sh: 0, amp: 46, t: 'álló redő', sub: 'függőleges tengelysík' },
        { x: 222, sh: 0.75, amp: 46, t: 'ferde redő', sub: 'ferde tengelysík' },
        { x: 432, sh: 0, amp: 46, t: 'fekvő redő', sub: 'közel vízszintes tengelysík' },
      ].map((p, i) => (
        <g key={p.t}>
          <Fold x0={p.x} y0={32} sh={p.sh} amp={p.amp} id={`${uid}f${i}`} recumbent={i === 2} />
          <Txt x={p.x + PW / 2} y={186} w={700}>
            {p.t}
          </Txt>
          <Txt x={p.x + PW / 2} y={202} s={12} c="var(--muted)">
            {p.sub}
          </Txt>
        </g>
      ))}
      <Txt x={12 + PW / 2} y={50} s={12} w={700}>
        boltozat
      </Txt>
      <Txt x={34} y={160} s={12} w={700}>
        teknő
      </Txt>

      <Txt x={14} y={232} a="start" s={14} w={700}>
        Vetődés: a merev kőzetek eltörnek, a darabok elmozdulnak
      </Txt>
      {/* vetődés */}
      <g transform="translate(12,242)">
        <Block id={`${uid}v1`} poly={`0,30 ${fv(30)},30 100,140 0,140`} dy={30} />
        <Block id={`${uid}v2`} poly={`${fv(4)},4 220,4 220,140 100,140`} dy={4} />
        <Arrow x1={92} y1={64} x2={78} y2={110} c="var(--ink)" />
        <Arrow x1={154} y1={102} x2={168} y2={56} c="var(--ink)" />
        <Txt x={176} y={126} a="start" s={12} w={700}>
          vetődési sík
        </Txt>
        <line x1={174} y1={122} x2={112} y2={110} stroke="var(--ink)" strokeWidth={1} />
        <Txt x={110} y={156} w={700}>
          vetődés
        </Txt>
      </g>
      {/* rögök */}
      <g transform="translate(262,242)">
        <Block id={`${uid}r1`} poly={`0,34 ${f1(34)},34 80,140 0,140`} dy={34} />
        <Block id={`${uid}r2`} poly={`100,0 190,0 210,140 80,140`} dy={0} />
        <Block id={`${uid}r3`} poly={`${f2(70)},70 ${f3(70)},70 270,140 210,140`} dy={70} />
        <Block id={`${uid}r4`} poly={`${f3(34)},34 366,34 366,140 270,140`} dy={34} />
        <Arrow x1={145} y1={128} x2={145} y2={96} c="var(--accent)" w={3} />
        <Arrow x1={240} y1={86} x2={240} y2={124} c="var(--accent)" w={3} />
        <Txt x={240} y={30} w={700}>
          árok
        </Txt>
        <Txt x={240} y={46} s={12}>
          (süllyedt rög)
        </Txt>
        <Txt x={145} y={156} w={700}>
          sasbérc (kiemelt rög)
        </Txt>
        <Txt x={40} y={24} s={12}>
          rög
        </Txt>
        <Txt x={326} y={24} s={12}>
          rög
        </Txt>
      </g>
    </svg>
  );
}
