// Subsolar point from the date and time (NOAA low-precision solar position):
// the solar declination gives its latitude, the equation of time its longitude.

const RAD = Math.PI / 180;

/** Fractional year γ in radians (NOAA). */
function gamma(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - start) / 86_400_000) + 1;
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  const leap = new Date(Date.UTC(d.getUTCFullYear(), 1, 29)).getUTCMonth() === 1;
  return ((2 * Math.PI) / (leap ? 366 : 365)) * (dayOfYear - 1 + (hour - 12) / 24);
}

/** Solar declination in degrees (≈ +23.44° at the June solstice, −23.44° in December). */
export function solarDeclination(d: Date): number {
  const g = gamma(d);
  const rad =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  return rad / RAD;
}

/** Equation of time in minutes (true solar time − mean solar time). */
export function equationOfTime(d: Date): number {
  const g = gamma(d);
  return 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
}

/** [longitude, latitude] where the Sun is at the zenith right now. */
export function subsolarPoint(d: Date): [number, number] {
  const minutes = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
  // Local apparent noon happens where true solar time is 12:00.
  let lon = -((minutes + equationOfTime(d) - 720) / 4);
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  return [lon, solarDeclination(d)];
}
