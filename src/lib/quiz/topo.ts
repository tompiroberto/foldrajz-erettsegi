// Topography quiz question builder (brief §5).
import { geoContains, geoDistance } from 'd3-geo';
import type { Feature, Geometry, Position } from 'geojson';
import type { TopoItem } from '@/data/types';
import type { BaseLayers, PlaceGeo } from '@/data/geo';

export type TopoQType = 'holvan' | 'beiros' | 'valasztos' | 'feladatlap' | 'fekves';

export const QTYPE_LABEL: Record<TopoQType, string> = {
  holvan: '„Hol van?” – kattints a térképre',
  beiros: '„Mi ez?” – írd be a nevét',
  valasztos: '„Mi ez?” – válassz 4 közül',
  feladatlap: 'Kontúrtérképes feladatlap',
  fekves: 'Fekvés-kérdés',
};

export type TopoQuestion =
  | { kind: 'holvan'; id: string }
  | { kind: 'beiros'; id: string }
  | { kind: 'valasztos'; id: string; options: string[] }
  | { kind: 'feladatlap'; ids: string[]; category: string }
  | { kind: 'fekves'; id: string; prompt: string; options: string[]; answer: string; explain: string };

export const EARTH_KM = 6371;
export const kmBetween = (a: [number, number], b: [number, number]) => geoDistance(a, b) * EARTH_KM;

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Three confusable wrong answers: same category, nearest first, a little shuffled. */
export function nearbyDistractors(item: TopoItem, pool: TopoItem[], places: Record<string, PlaceGeo>, rng: () => number, n = 3): TopoItem[] {
  const me = places[item.id]?.anchor;
  const same = pool.filter((p) => p.id !== item.id && p.category === item.category && p.name !== item.name);
  const candidates = same.length >= n ? same : pool.filter((p) => p.id !== item.id && p.name !== item.name);
  const sorted = me
    ? [...candidates].sort((a, b) => kmBetween(me, places[a.id]?.anchor ?? me) - kmBetween(me, places[b.id]?.anchor ?? me))
    : shuffle(candidates, rng);
  return shuffle(sorted.slice(0, Math.max(n + 3, 6)), rng).slice(0, n);
}

function nearestRiver(anchor: [number, number], rivers: { item: TopoItem; geom: Geometry }[]) {
  let best: { item: TopoItem; km: number } | null = null;
  for (const r of rivers) {
    const lines: Position[][] = r.geom.type === 'LineString' ? [r.geom.coordinates] : r.geom.type === 'MultiLineString' ? r.geom.coordinates : [];
    for (const line of lines) {
      for (const c of line) {
        const km = kmBetween(anchor, c as [number, number]);
        if (!best || km < best.km) best = { item: r.item, km };
      }
    }
  }
  return best;
}

export interface FekvesContext {
  base: BaseLayers | null;
  geoms: Map<string, Feature>;
}

/** Spatial-relation question for one item, or null when none applies. */
export function fekvesQuestion(item: TopoItem, pool: TopoItem[], places: Record<string, PlaceGeo>, ctx: FekvesContext, rng: () => number): TopoQuestion | null {
  const pl = places[item.id];
  if (!pl || !ctx.base) return null;
  const isTown = item.category === 'Városok' || item.category === 'Települések';
  const hungary = item.region === 'Magyarország';

  // Towns next to a big river of the same region: "Melyik folyó partján fekszik X?"
  if (isTown && rng() < 0.5) {
    const rivers = pool
      .filter((p) => p.category === 'Vízrajz' && places[p.id]?.type === 'line')
      .map((p) => ({ item: p, geom: ctx.geoms.get(p.id)?.geometry }))
      .filter((r): r is { item: TopoItem; geom: Geometry } => !!r.geom);
    const near = nearestRiver(pl.anchor, rivers);
    if (near && near.km < 12 && rivers.length >= 4) {
      const others = shuffle(rivers.filter((r) => r.item.name !== near.item.name), rng).slice(0, 3).map((r) => r.item.name);
      return {
        kind: 'fekves',
        id: item.id,
        prompt: `Melyik folyó partján fekszik ${item.name}?`,
        options: shuffle([near.item.name, ...others], rng),
        answer: near.item.name,
        explain: `${item.name} a(z) ${near.item.name} partján fekszik.`,
      };
    }
  }

  // Hungarian items: county.
  if (hungary && ctx.base.counties && pl.type !== 'line') {
    const c = ctx.base.counties.features.find((f) => geoContains(f, pl.anchor));
    if (c) {
      const name = `${c.properties.shapeName} megye`;
      const others = shuffle(ctx.base.counties.features.filter((f) => f !== c), rng)
        .sort((a, b) => kmBetween(pl.anchor, centroidOf(a)) - kmBetween(pl.anchor, centroidOf(b)))
        .slice(0, 3)
        .map((f) => `${f.properties.shapeName} megye`);
      return {
        kind: 'fekves',
        id: item.id,
        prompt: `Melyik megyében ${isTown ? 'fekszik' : 'található'} ${item.name}?`,
        options: shuffle([name, ...others], rng),
        answer: name,
        explain: `${item.name} ${name} területén ${isTown ? 'fekszik' : 'található'}.`,
      };
    }
    return null;
  }

  // Everywhere else: country (capital phrasing for capitals).
  if (pl.type === 'point' || (pl.type === 'polygon' && item.category !== 'Országok' && item.category !== 'A földrész részei')) {
    const country = ctx.base.countries.features.find((f) => geoContains(f, pl.anchor));
    if (!country) return null;
    const name = country.properties.NAME_HU ?? country.properties.ADMIN;
    const near = ctx.base.countries.features
      .filter((f) => f !== country && (f.properties.NAME_HU ?? f.properties.ADMIN) !== name)
      .sort((a, b) => kmBetween(pl.anchor, centroidOf(a)) - kmBetween(pl.anchor, centroidOf(b)))
      .slice(0, 6);
    const others = shuffle(near, rng)
      .slice(0, 3)
      .map((f) => f.properties.NAME_HU ?? f.properties.ADMIN);
    if (others.length < 3) return null;
    const prompt = pl.capital ? `${item.name} melyik ország fővárosa?` : `Melyik ország területén ${isTown ? 'fekszik' : 'található'} ${item.name}?`;
    return {
      kind: 'fekves',
      id: item.id,
      prompt,
      options: shuffle([name, ...others], rng),
      answer: name,
      explain: pl.capital ? `${item.name} ${name} fővárosa.` : `${item.name} ${name} területén ${isTown ? 'fekszik' : 'található'}.`,
    };
  }
  return null;
}

const centroidCache = new WeakMap<object, [number, number]>();
function centroidOf(f: Feature): [number, number] {
  let c = centroidCache.get(f);
  if (!c) {
    // Mean of the outline vertices is good enough to rank neighbours.
    let x = 0,
      y = 0,
      n = 0;
    const walk = (g: unknown): void => {
      if (Array.isArray(g) && typeof g[0] === 'number') {
        x += g[0] as number;
        y += g[1] as number;
        n++;
      } else if (Array.isArray(g)) g.forEach(walk);
    };
    walk((f.geometry as { coordinates: unknown }).coordinates);
    c = n ? [x / n, y / n] : [0, 0];
    centroidCache.set(f, c);
  }
  return c;
}

export interface BuildOptions {
  types: TopoQType[];
  count: number;
  rng: () => number;
  ctx: FekvesContext;
}

/** Builds a mixed question list from the filtered pool. */
export function buildTopoQuiz(pool: TopoItem[], places: Record<string, PlaceGeo>, { types, count, rng, ctx }: BuildOptions): TopoQuestion[] {
  const usable = pool.filter((i) => places[i.id]);
  const items = shuffle(usable, rng);
  const out: TopoQuestion[] = [];
  const singleTypes = types.filter((t) => t !== 'feladatlap');
  const sheetEvery = types.includes('feladatlap') ? (singleTypes.length ? 6 : 1) : Infinity;
  let k = 0;
  for (const item of items) {
    if (out.length >= count) break;
    if ((out.length + 1) % sheetEvery === 0 || !singleTypes.length) {
      // A workbook-style sheet from the same category.
      const cat = item.category;
      const same = shuffle(usable.filter((i) => i.category === cat), rng).slice(0, 8 + Math.floor(rng() * 8));
      if (same.length >= 5) {
        out.push({ kind: 'feladatlap', ids: same.map((i) => i.id), category: cat });
        continue;
      }
    }
    const t = singleTypes[k++ % singleTypes.length]!;
    if (t === 'holvan' || t === 'beiros') out.push({ kind: t, id: item.id });
    else if (t === 'valasztos') {
      const wrong = nearbyDistractors(item, usable, places, rng);
      out.push({ kind: 'valasztos', id: item.id, options: shuffle([item.id, ...wrong.map((w) => w.id)], rng) });
    } else if (t === 'fekves') {
      const q = fekvesQuestion(item, usable, places, ctx, rng);
      out.push(q ?? { kind: 'beiros', id: item.id });
    }
  }
  return out;
}
