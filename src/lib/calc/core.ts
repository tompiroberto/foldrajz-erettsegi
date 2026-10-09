// Shared helpers for the SZÁMOLÁS generators.

export interface CalcAnswer {
  /** Expected value (numbers) or text (e.g. a date, "északi"). */
  value: number | string;
  unit?: string;
  /** Accepted absolute tolerance for numeric answers. */
  tolerance?: number;
  /** Shown form, e.g. "13 óra 24 perc". */
  display: string;
}

export interface CalcProblem {
  type: string;
  question: string;
  /** Given data as label → value lines (rendered as a small table). */
  data?: [string, string][];
  answers: { label: string; answer: CalcAnswer }[];
  steps: string[];
  hint: string;
}

export interface CalcGenerator {
  id: string;
  title: string;
  topic: string;
  level: 'kozep' | 'emelt';
  generate: (rng: () => number) => CalcProblem;
}

/** Deterministic PRNG (mulberry32), so a problem can be reproduced from its seed. */
export function rngFrom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const int = (rng: () => number, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
export const pick = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]!;

/** Hungarian number format: decimal comma, thin-space thousands. */
export function hu(n: number, decimals = 0): string {
  const s = n.toFixed(decimals);
  const [i, d] = s.split('.');
  const neg = i!.startsWith('-');
  const digits = neg ? i!.slice(1) : i!;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${neg ? '−' : ''}${grouped}${d ? `,${d}` : ''}`;
}

/** Round to a sensible number of decimals for display. */
export const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

/** Parses a typed Hungarian number: "12,5", "1 200", "−3", "12.5". */
export function parseHuNumber(s: string): number | null {
  const t = s.trim().replace(/\s| /g, '').replace('−', '-').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

export function checkNumeric(input: string, a: CalcAnswer): boolean {
  if (typeof a.value === 'string') return input.trim().toLowerCase() === a.value.toLowerCase();
  const v = parseHuNumber(input);
  if (v === null) return false;
  return Math.abs(v - a.value) <= (a.tolerance ?? 0.05 * Math.max(1, Math.abs(a.value)));
}

/** "hh:mm" for minutes after midnight (wraps to 0–24 h). */
export function clock(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** "k. h. 19°" / "ny. h. 74°" */
export const lonLabel = (lon: number) => (lon === 0 ? '0° (kezdő hosszúsági kör)' : `${lon > 0 ? 'k. h.' : 'ny. h.'} ${hu(Math.abs(lon), Number.isInteger(lon) ? 0 : 1)}°`);
export const latLabel = (lat: number) => (lat === 0 ? '0° (Egyenlítő)' : `${lat > 0 ? 'é. sz.' : 'd. sz.'} ${hu(Math.abs(lat), Number.isInteger(lat) ? 0 : 1)}°`);
