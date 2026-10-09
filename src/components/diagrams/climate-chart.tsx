import { motion } from 'framer-motion';
import type { DiagramProps } from './types';

// Approximate long-term monthly means of Budapest (example, nedves kontinentális éghajlat).
const MONTHS = ['J', 'F', 'M', 'Á', 'M', 'J', 'J', 'A', 'Sz', 'O', 'N', 'D'];
const TEMP = [-1, 1, 6, 12, 17, 20, 22, 21.5, 17, 11, 5, 1];
const PREC = [37, 32, 33, 42, 62, 63, 45, 50, 40, 39, 53, 45];

const X0 = 90;
const X1 = 550;
const Y_TOP = 60;
const Y_BOT = 340;
const T_MIN = -10;
const T_MAX = 35;
const yT = (t: number) => Y_BOT - ((t - T_MIN) / (T_MAX - T_MIN)) * (Y_BOT - Y_TOP);
const yP = (mm: number) => yT(mm / 2); // 10 °C = 20 mm
const colW = (X1 - X0) / 12;
const xM = (i: number) => X0 + colW * (i + 0.5);

export default function ClimateChart({ reduced = false }: DiagramProps) {
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' as const };
  const line = TEMP.map((v, i) => `${i ? 'L' : 'M'}${xM(i).toFixed(1)} ${yT(v).toFixed(1)}`).join(' ');
  const tTicks = [-10, 0, 10, 20, 30];
  const avgT = TEMP.reduce((a, b) => a + b, 0) / 12;
  const sumP = PREC.reduce((a, b) => a + b, 0);
  return (
    <svg
      viewBox="0 0 640 400"
      width="100%"
      role="img"
      aria-label={`Éghajlati diagram példa egy budapesti típusú nedves kontinentális állomásra: évi középhőmérséklet kb. ${avgT.toFixed(0)} °C, évi csapadék kb. ${Math.round(sumP / 10) * 10} mm, nyári csapadékmaximummal.`}
      style={{ fontFamily: 'inherit' }}
    >
      <rect x="0" y="0" width="640" height="400" fill="var(--paper)" />
      <text x="320" y="26" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--ink)">
        Budapest (példa) – nedves kontinentális éghajlat
      </text>
      <text x="320" y="46" textAnchor="middle" fontSize="13" fill="var(--muted)">
        évi középhőmérséklet ≈ {avgT.toFixed(0)} °C · évi csapadék ≈ {Math.round(sumP / 10) * 10} mm · hőingás ≈ {Math.max(...TEMP) - Math.min(...TEMP)} °C
      </text>

      {/* grid */}
      {tTicks.map((v) => (
        <line key={v} x1={X0} x2={X1} y1={yT(v)} y2={yT(v)} stroke="var(--line)" strokeWidth={v === 0 ? 1.6 : 0.8} strokeDasharray={v === 0 ? undefined : '3 4'} />
      ))}

      {/* precipitation bars */}
      {PREC.map((mm, i) => (
        <motion.rect
          key={i}
          x={xM(i) - colW * 0.36}
          width={colW * 0.72}
          initial={reduced ? false : { y: yP(0), height: 0 }}
          animate={{ y: yP(mm), height: yP(0) - yP(mm) }}
          transition={{ ...t, delay: reduced ? 0 : i * 0.015 }}
          fill="#4A90C2"
          fillOpacity={0.75}
        />
      ))}

      {/* temperature line */}
      <motion.path
        d={line}
        fill="none"
        stroke="#D64545"
        strokeWidth={3}
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...t, duration: reduced ? 0 : 0.8 }}
      />
      {TEMP.map((v, i) => (
        <circle key={i} cx={xM(i)} cy={yT(v)} r={3.5} fill="#D64545" />
      ))}

      {/* axes */}
      <line x1={X0} x2={X0} y1={Y_TOP} y2={Y_BOT} stroke="#D64545" strokeWidth={1.5} />
      <line x1={X1} x2={X1} y1={yP(0)} y2={Y_TOP} stroke="#4A90C2" strokeWidth={1.5} />
      <line x1={X0} x2={X1} y1={Y_BOT} y2={Y_BOT} stroke="var(--ink)" strokeWidth={1} />
      {tTicks.map((v) => (
        <text key={v} x={X0 - 8} y={yT(v) + 4.5} textAnchor="end" fontSize="13" fill="#D64545">
          {v}
        </text>
      ))}
      {[0, 20, 40, 60].map((mm) => (
        <text key={mm} x={X1 + 8} y={yP(mm) + 4.5} fontSize="13" fill="#4A90C2">
          {mm}
        </text>
      ))}
      <text x={X0 - 8} y={Y_TOP - 8} textAnchor="end" fontSize="13" fontWeight="700" fill="#D64545">
        °C
      </text>
      <text x={X1 + 8} y={Y_TOP - 8} fontSize="13" fontWeight="700" fill="#4A90C2">
        mm
      </text>
      <text transform={`translate(28 ${(Y_TOP + Y_BOT) / 2}) rotate(-90)`} textAnchor="middle" fontSize="13" fill="var(--muted)">
        havi középhőmérséklet
      </text>
      <text transform={`translate(612 ${(Y_TOP + yP(0)) / 2}) rotate(90)`} textAnchor="middle" fontSize="13" fill="var(--muted)">
        havi csapadék
      </text>
      {MONTHS.map((m, i) => (
        <text key={i} x={xM(i)} y={Y_BOT + 18} textAnchor="middle" fontSize="13" fill="var(--ink)">
          {m}
        </text>
      ))}

      {/* legend */}
      <g transform={`translate(${X0} 372)`} fontSize="13" fill="var(--ink)">
        <line x1="0" x2="22" y1="0" y2="0" stroke="#D64545" strokeWidth={3} />
        <text x="28" y="4.5">hőmérséklet</text>
        <rect x="130" y="-7" width="16" height="14" fill="#4A90C2" fillOpacity={0.75} />
        <text x="152" y="4.5">csapadék</text>
        <text x="460" y="4.5" textAnchor="end" fill="var(--muted)">
          lépték: 10 °C = 20 mm
        </text>
      </g>
    </svg>
  );
}
