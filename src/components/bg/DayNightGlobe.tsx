import { useEffect, useMemo, useState } from 'react';
import { geoCircle, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { loadBase, formatCoord, type BaseLayers } from '@/data/geo';
import { subsolarPoint } from '@/lib/sun';

/**
 * Real-time day–night globe: the terminator and the subsolar point computed from the
 * current date and time (solar declination + equation of time). Ties to topic 2.
 */
export function DayNightGlobe({ size = 220 }: { size?: number }) {
  const [now, setNow] = useState(() => new Date());
  const [world, setWorld] = useState<BaseLayers | null>(null);
  useEffect(() => {
    void loadBase('world').then(setWorld);
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const sun = useMemo(() => subsolarPoint(now), [now]);
  // Face the globe towards Hungary's longitude so the student sees "our" side.
  const projection = useMemo(() => geoOrthographic().rotate([-19, -25]).fitSize([size, size], { type: 'Sphere' }), [size]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const night = useMemo(() => geoCircle().center([sun[0] + 180, -sun[1]]).radius(90)(), [sun]);
  const sunXY = projection(sun);
  const visible = sunXY && path({ type: 'Point', coordinates: sun });
  const time = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

  return (
    <figure className="globe">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`A Föld nappali és éjszakai oldala most (${time}). Most itt delel a Nap: ${formatCoord(sun)}.`}>
        <defs>
          <radialGradient id="globe-shade" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#2E6FA8" />
            <stop offset="100%" stopColor="#0E2C4F" />
          </radialGradient>
        </defs>
        <path d={path({ type: 'Sphere' }) ?? ''} fill="url(#globe-shade)" />
        <path d={path(geoGraticule10()) ?? ''} fill="none" stroke="rgba(220,233,245,0.18)" strokeWidth={0.6} />
        {world && <path d={path(world.countries) ?? ''} fill="#E3D3B4" fillOpacity={0.95} stroke="#0E2238" strokeWidth={0.3} />}
        <path d={path(night) ?? ''} fill="#02060C" fillOpacity={0.72} />
        <path d={path(geoCircle().center([sun[0] + 180, -sun[1]]).radius(90)()) ?? ''} fill="none" stroke="#F2C14E" strokeOpacity={0.85} strokeWidth={1.4} />
        {visible && sunXY && (
          <g transform={`translate(${sunXY[0]},${sunXY[1]})`}>
            <title>Most itt delel a Nap</title>
            <circle r={9} fill="#F2C14E" fillOpacity={0.3} />
            <circle r={4.5} fill="#F2C14E" stroke="#fff" strokeWidth={1} />
          </g>
        )}
        <path d={path({ type: 'Sphere' }) ?? ''} fill="none" stroke="rgba(220,233,245,0.5)" />
      </svg>
      <figcaption>
        <strong>Most itt delel a Nap:</strong> {formatCoord(sun)} <span className="muted">({time})</span>
      </figcaption>
    </figure>
  );
}
