import { useEffect, useMemo, useRef } from 'react';
import { createNoise2D } from 'simplex-noise';
import { useCanvasLoop } from './useCanvasLoop';

/**
 * Theory background: a deep-blue cross-section of the Earth's spheres, read top to bottom.
 * The top of the page shows the exosphere; scrolling down passes the thermosphere (aurora),
 * mesosphere (meteors), stratosphere (ozone layer), troposphere (clouds, airliner), the
 * ocean, the crust, the mantle and finally the core. Every sphere has a small label with
 * its typical height/depth and temperature (well-established round textbook values).
 */

interface Band {
  name: string;
  top: number; // fraction of the column
  bottom: number;
  colors: [string, string];
  label: string;
  detail: string;
  /** Short rail lines: height/depth, temperature, the characteristic feature. */
  rail: [string, string, string];
}

// Rounded values as in Hungarian secondary-school textbooks (they differ slightly between books).
const BANDS: Band[] = [
  { name: 'Exoszféra', top: 0, bottom: 0.1, colors: ['#03070F', '#060E1C'], label: 'Műholdak keringenek', detail: '500 km felett · a ritka gáz hőmérséklete 1000 °C fölötti is lehet', rail: ['500 km felett','akár 1000 °C fölött','műholdak'] },
  { name: 'Termoszféra (ionoszféra)', top: 0.1, bottom: 0.22, colors: ['#060E1C', '#0A1830'], label: 'Sarki fény', detail: 'kb. 80–500 km · felfelé –90 °C-ról 1000 °C fölé melegszik', rail: ['80–500 km', '–90 → 1000 °C fölé', 'sarki fény'] },
  { name: 'Mezoszféra', top: 0.22, bottom: 0.32, colors: ['#0A1830', '#0E2238'], label: 'Itt égnek el a hullócsillagok', detail: 'kb. 50–80 km · felfelé 0 °C-ról kb. –90 °C-ra hűl', rail: ['50–80 km','0 → –90 °C','hullócsillagok'] },
  { name: 'Sztratoszféra', top: 0.32, bottom: 0.42, colors: ['#0E2238', '#143154'], label: 'Ózonréteg', detail: 'kb. 12–50 km · az ózon elnyeli az UV-t: –56 °C-ról 0 °C-ra melegszik', rail: ['12–50 km','–56 → 0 °C','ózonréteg (20–30 km)'] },
  { name: 'Troposzféra', top: 0.42, bottom: 0.54, colors: ['#143154', '#1D4470'], label: 'Felhők, időjárás; utasszállító ~10 km-en', detail: '0–12 km (sarkokon ~8, Egyenlítőn ~17 km) · felszín átl. +15 °C, 100 m-enként ~0,65 °C-kal hűl', rail: ['0–12 km','+15 → –56 °C','felhők, repülő ~10 km'] },
  { name: 'Vízburok – óceán', top: 0.54, bottom: 0.62, colors: ['#123A5E', '#0A2440'], label: 'Mélytengeri víz', detail: 'átl. mélység kb. 3,8 km · a mélyben 0–4 °C', rail: ['átl. 3,8 km mély','mélyben 0–4 °C','mélytengeri víz'] },
  { name: 'Földkéreg', top: 0.62, bottom: 0.76, colors: ['#3B3226', '#4A2E22'], label: 'Üledékes kőzetrétegek, gyűrődések', detail: 'óceáni 5–10 km, szárazföldi 30–70 km vastag · lefelé átl. ~3 °C-kal melegszik 100 m-enként', rail: ['5–70 km vastag','~3 °C / 100 m','kőzetrétegek'] },
  { name: 'Köpeny (asztenoszféra)', top: 0.76, bottom: 0.9, colors: ['#5A1E14', '#8E2A12'], label: 'Áramló, képlékeny kőzetanyag', detail: 'kb. 2900 km mélységig · kb. 1000–3500 °C', rail: ['2900 km-ig', '~1000–3500 °C', 'áramló kőzetanyag'] },
  { name: 'Földmag', top: 0.9, bottom: 1, colors: ['#A33A12', '#E0782A'], label: 'Folyékony külső mag, szilárd belső mag', detail: '2900–6371 km · kb. 4000–6000 °C', rail: ['2900–6371 km','~4000–6000 °C','külső folyékony, belső szilárd'] },
];

export function StrataBackground({ animate }: { animate: boolean }) {
  const noise = useMemo(() => createNoise2D(() => 0.42), []);
  const scroll = useRef(0);
  const stars = useMemo(() => Array.from({ length: 90 }, (_, i) => ({ x: (i * 0.6180339) % 1, y: (i * 0.381966 * 7) % 1, r: 0.4 + ((i * 13) % 7) / 8 })), []);
  const clouds = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ x: i / 6 + 0.05, y: 0.15 + ((i * 37) % 60) / 100, s: 0.6 + ((i * 7) % 5) / 6 })), []);

  useEffect(() => {
    const on = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scroll.current = Math.min(1, window.scrollY / max);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const ref = useCanvasLoop(
    (ctx, w, h, t) => {
      const H = h * 5; // virtual column height
      // Top of the page = exosphere (top of the column); scrolling down goes into the Earth.
      const view = scroll.current * (H - h);
      const Y = (colY: number) => colY - view;
      const visible = (b: Band) => Y(H * b.bottom) > -40 && Y(H * b.top) < h + 40;
      const band = (name: string) => BANDS.find((b) => b.name.startsWith(name))!;
      const yOf = (b: Band, f: number) => Y(H * (b.top + (b.bottom - b.top) * f));
      ctx.clearRect(0, 0, w, h);

      // Background gradients of every sphere.
      for (const b of BANDS) {
        if (!visible(b)) continue;
        const g = ctx.createLinearGradient(0, Y(H * b.top), 0, Y(H * b.bottom));
        g.addColorStop(0, b.colors[0]);
        g.addColorStop(1, b.colors[1]);
        ctx.fillStyle = g;
        ctx.fillRect(0, Y(H * b.top), w, H * (b.bottom - b.top) + 1);
      }

      // Exosphere + thermosphere: stars and a small satellite.
      const exo = band('Exoszféra');
      const thermo = band('Termoszféra');
      if (visible(exo) || visible(thermo)) {
        ctx.fillStyle = '#DCE9F5';
        for (const s of stars) {
          ctx.globalAlpha = 0.3 + 0.25 * Math.sin(t * 0.8 + s.x * 40);
          ctx.beginPath();
          ctx.arc(s.x * w, Y(H * 0.22 * s.y), s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 0.85;
        const sx = ((t * 0.02) % 1.2) * w - 0.1 * w;
        const sy = yOf(exo, 0.55) + Math.sin(t * 0.3) * 8;
        ctx.fillStyle = '#9FB7D3';
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
        ctx.fillStyle = '#4C7FC0';
        ctx.fillRect(sx - 15, sy - 2, 10, 4);
        ctx.fillRect(sx + 5, sy - 2, 10, 4);
        ctx.globalAlpha = 1;
      }

      // Thermosphere: aurora curtains.
      if (visible(thermo)) {
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          const base = yOf(thermo, 0.75 - k * 0.12);
          for (let x = 0; x <= w; x += 10) {
            const y = base + Math.sin(x / 140 + t * 0.4 + k) * 18 + noise(x / 260, t * 0.08 + k) * 22;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          for (let x = w; x >= 0; x -= 10) ctx.lineTo(x, base - 90 - k * 10 + noise(x / 200, k + t * 0.05) * 30);
          ctx.closePath();
          const g = ctx.createLinearGradient(0, base, 0, base - 100);
          g.addColorStop(0, k === 1 ? 'rgba(170,110,255,0.22)' : 'rgba(80,240,160,0.28)');
          g.addColorStop(1, 'rgba(80,240,160,0)');
          ctx.fillStyle = g;
          ctx.fill();
        }
      }

      // Mesosphere: meteors burning up.
      const meso = band('Mezoszféra');
      if (visible(meso)) {
        for (let k = 0; k < 4; k++) {
          const p = (t * 0.25 + k * 0.37) % 1.6;
          if (p > 1) continue;
          const x0 = ((k * 0.29 + 0.1) % 1) * w;
          const x = x0 + p * 160;
          const y = yOf(meso, 0.15) + p * (yOf(meso, 0.8) - yOf(meso, 0.15));
          const g = ctx.createLinearGradient(x, y, x - 60, y - 40);
          g.addColorStop(0, 'rgba(255,214,150,0.9)');
          g.addColorStop(1, 'rgba(255,214,150,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 60, y - 40);
          ctx.stroke();
        }
      }

      // Stratosphere: glowing ozone band.
      const strato = band('Sztratoszféra');
      if (visible(strato)) {
        const oy = yOf(strato, 0.55);
        const g = ctx.createLinearGradient(0, oy - 40, 0, oy + 40);
        g.addColorStop(0, 'rgba(120,200,255,0)');
        g.addColorStop(0.5, `rgba(120,200,255,${0.16 + 0.04 * Math.sin(t)})`);
        g.addColorStop(1, 'rgba(120,200,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, oy - 40, w, 80);
      }

      // Troposphere: drifting clouds and an airliner.
      const tropo = band('Troposzféra');
      if (visible(tropo)) {
        ctx.fillStyle = '#DCE9F5';
        ctx.globalAlpha = 0.09;
        for (const c of clouds) {
          const cx = ((c.x + t * 0.004 * c.s) % 1.2) * w - 0.1 * w;
          const cy = yOf(tropo, 0.35 + c.y * 0.6);
          for (let k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.ellipse(cx + k * 38 * c.s, cy - (k % 2) * 14 * c.s, 60 * c.s, 22 * c.s, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 0.6;
        const px = w - (((t * 0.03) % 1.2) * w - 0.1 * w);
        const py = yOf(tropo, 0.18);
        ctx.beginPath();
        ctx.moveTo(px - 18, py);
        ctx.lineTo(px + 18, py);
        ctx.moveTo(px - 2, py);
        ctx.lineTo(px + 6, py - 9);
        ctx.moveTo(px - 2, py);
        ctx.lineTo(px + 6, py + 9);
        ctx.strokeStyle = '#DCE9F5';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 0.25;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(px + 18, py);
        ctx.lineTo(px + 140, py);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Ocean surface with a wave.
      const ocean = band('Vízburok');
      if (visible(ocean)) {
        const seaTop = H * ocean.top;
        ctx.fillStyle = '#1A4E7A';
        ctx.beginPath();
        ctx.moveTo(0, Y(seaTop + 30));
        for (let x = 0; x <= w; x += 12) ctx.lineTo(x, Y(seaTop + Math.sin(x / 90 + t * 0.6) * 5 + noise(x / 300, t * 0.05) * 6));
        ctx.lineTo(w, Y(seaTop + 30));
        ctx.closePath();
        ctx.fill();
      }

      // Crust: gently folded rock strata.
      const crust = band('Földkéreg');
      if (visible(crust)) {
        const cols = ['#2A2A2E', '#3B3226', '#4A3B2A', '#3A3A44', '#523C2B', '#40353A', '#5A2E22'];
        cols.forEach((col, i) => {
          const top = crust.top + ((crust.bottom - crust.top) * i) / cols.length;
          const next = crust.top + ((crust.bottom - crust.top) * (i + 1)) / cols.length;
          ctx.fillStyle = col;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 16) {
            const y = Y(H * top + (i ? Math.sin(x / 260 + i * 0.7) * 14 + noise(x / 400, i) * 10 : 0));
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          for (let x = w; x >= 0; x -= 16) ctx.lineTo(x, Y(H * next + Math.sin(x / 260 + (i + 1) * 0.7) * 14 + noise(x / 400, i + 1) * 10));
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 0.18;
          ctx.strokeStyle = '#C9B79C';
          ctx.stroke();
          ctx.globalAlpha = 1;
        });
      }

      // Mantle and core: glowing convection.
      for (const b of [band('Köpeny'), band('Földmag')]) {
        if (!visible(b)) continue;
        const top = H * b.top;
        const ht = H * (b.bottom - b.top);
        for (let k = 0; k < 5; k++) {
          const cx = ((k + 0.5) / 5) * w + Math.sin(t * 0.15 + k) * 40;
          const cy = Y(top + ht * (0.5 + 0.3 * Math.sin(t * 0.2 + k * 1.7)));
          const r = 120 + 40 * Math.sin(t * 0.3 + k);
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          glow.addColorStop(0, b.name === 'Földmag' ? 'rgba(255,190,90,0.5)' : 'rgba(228,87,46,0.55)');
          glow.addColorStop(1, 'rgba(228,87,46,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        }
      }

      // Veil so the foreground text always reads well.
      ctx.fillStyle = 'rgba(14,34,56,0.42)';
      ctx.fillRect(0, 0, w, h);

      // Boundaries + a narrow altitude rail on the left edge (outside the content column).
      const showRail = w >= 1100;
      ctx.textAlign = 'left';
      for (const b of BANDS) {
        if (!visible(b)) continue;
        const y0 = Y(H * b.top);
        if (b.top > 0) {
          ctx.globalAlpha = 0.28;
          ctx.strokeStyle = '#DCE9F5';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 6]);
          ctx.beginPath();
          ctx.moveTo(0, y0);
          ctx.lineTo(w, y0);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (!showRail) continue;
        // Sticky label: stays under the header while its sphere fills the screen.
        const ly = Math.max(y0 + 24, Math.min(Y(H * b.bottom) - 76, 96));
        const x = 16;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#F0875A';
        ctx.font = '700 11px system-ui, sans-serif';
        ctx.fillText(b.name.split(' ')[0]!.toUpperCase(), x, ly);
        ctx.font = '600 12px system-ui, sans-serif';
        ctx.fillStyle = '#DCE9F5';
        ctx.fillText(b.rail[0], x, ly + 17);
        ctx.fillText(b.rail[1], x, ly + 33);
        ctx.globalAlpha = 0.7;
        ctx.font = 'italic 400 11.5px system-ui, sans-serif';
        const words = b.rail[2].split(' ');
        let line = '';
        let yy = ly + 50;
        for (const wd of words) {
          if ((line + ' ' + wd).trim().length > 16) {
            ctx.fillText(line.trim(), x, yy);
            yy += 15;
            line = '';
          }
          line += ' ' + wd;
        }
        ctx.fillText(line.trim(), x, yy);
        ctx.globalAlpha = 1;
      }
    },
    { fps: 24, animate, redrawOnScroll: true },
  );

  return <canvas ref={ref} className="bg-canvas" aria-hidden />;
}
