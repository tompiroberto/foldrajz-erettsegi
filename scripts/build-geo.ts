// Geo pipeline (brief §8.1): finds a geometry for every one of the 802 official
// topography items and writes
//   public/data/places.json            id → type, anchor, bbox, aliases, English name, source, confidence
//   public/data/geo/items-<region>.topo.json   the item geometries per region
//   public/data/geo/base-<view>.topo.json      blank contour-map base layers
//   review/geo-report.md                manual / low-confidence / unmatched items
// Coverage must be 100%: the script exits with an error if any id has no geometry.
//   npx tsx scripts/build-geo.ts [--allow-missing]
import fs from 'node:fs';
import * as turf from '@turf/turf';
import { topology } from 'topojson-server';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import type { Feature, Geometry, LineString, MultiLineString, MultiPolygon, Polygon, Position } from 'geojson';
import { NAME_MAP, type GeoType, type Rule } from './name-map.ts';
import { find, key, layer, type F, type LayerKey } from './geo/sources.ts';

interface Item {
  id: string;
  name: string;
  region: string;
  category: string;
  level: string;
}
type Source = 'naturalearth' | 'pb2002' | 'geoboundaries' | 'computed' | 'manual';
type Confidence = 'high' | 'medium' | 'low';

interface Resolved {
  type: GeoType;
  geometry: Geometry;
  source: Source;
  confidence: Confidence;
  detail: string;
  capital?: boolean;
}

const items = (JSON.parse(fs.readFileSync('starter-data/topography.json', 'utf8')) as { items: Item[] }).items;
const allowMissing = process.argv.includes('--allow-missing');

// ---------- helpers ----------

const typeOf = (g: Geometry): GeoType =>
  g.type === 'Point' || g.type === 'MultiPoint' ? 'point' : g.type === 'LineString' || g.type === 'MultiLineString' ? 'line' : 'polygon';

function combine(features: F[]): Geometry | null {
  const geoms = features.map((f) => f.geometry).filter(Boolean);
  if (!geoms.length) return null;
  if (geoms.length === 1) return geoms[0]!;
  const t = typeOf(geoms[0]!);
  if (t === 'polygon') {
    const polys: Position[][][] = [];
    for (const g of geoms) {
      if (g.type === 'Polygon') polys.push(g.coordinates);
      else if (g.type === 'MultiPolygon') polys.push(...g.coordinates);
    }
    try {
      const u = turf.union(turf.featureCollection(polys.map((p) => turf.polygon(p))));
      if (u) return u.geometry;
    } catch {
      /* fall back to a plain multipolygon */
    }
    return { type: 'MultiPolygon', coordinates: polys } as MultiPolygon;
  }
  if (t === 'line') {
    const lines: Position[][] = [];
    for (const g of geoms) {
      if (g.type === 'LineString') lines.push(g.coordinates);
      else if (g.type === 'MultiLineString') lines.push(...g.coordinates);
    }
    return { type: 'MultiLineString', coordinates: lines } as MultiLineString;
  }
  return geoms[0]!;
}

const inBbox = (f: F, b: [number, number, number, number]) => {
  const [w, s, e, n] = turf.bbox(f);
  return e >= b[0] && w <= b[2] && n >= b[1] && s <= b[3];
};

/** Most important candidate first (largest population / lowest scalerank). */
function best(fs_: F[]): F[] {
  return [...fs_].sort((a, b) => {
    const pa = Number(a.properties.POP_MAX ?? 0);
    const pb = Number(b.properties.POP_MAX ?? 0);
    if (pa !== pb) return pb - pa;
    return Number(a.properties.SCALERANK ?? a.properties.scalerank ?? 9) - Number(b.properties.SCALERANK ?? b.properties.scalerank ?? 9);
  });
}

function nameForms(name: string): string[] {
  const out = new Set([name, name.replace(/\s*\([^)]*\)/g, '').trim()]);
  for (const mm of name.matchAll(/\(([^)]+)\)/g)) if (!mm[1]!.includes(',')) out.add(mm[1]!);
  return [...out];
}

const countryBy = (en: string | string[]) =>
  (Array.isArray(en) ? en : [en]).flatMap((n) =>
    layer('country').filter((f) => [f.properties.ADMIN, f.properties.NAME, f.properties.NAME_LONG, f.properties.SOVEREIGNT].some((v) => key(v) === key(n))),
  );

// ---------- manual geometries ----------

const manual = new Map<string, Feature>();
/** Label-anchor corrections from the Térképszerkesztő (properties.anchorOnly): geometry stays, only the anchor moves. */
const anchorFix = new Map<string, [number, number]>();
// Térképszerkesztő exports (szerkeszto*.geojson) are read last and may override any geometry.
const manualFiles = (fs.existsSync('scripts/manual-geo') ? fs.readdirSync('scripts/manual-geo') : []).sort((a, b) => Number(a.startsWith('szerkeszto')) - Number(b.startsWith('szerkeszto')));
for (const f of manualFiles) {
  if (!f.endsWith('.geojson')) continue;
  const fromEditor = f.startsWith('szerkeszto');
  const fc = JSON.parse(fs.readFileSync(`scripts/manual-geo/${f}`, 'utf8'));
  for (const ft of fc.features as Feature[]) {
    const id = String(ft.properties?.id ?? '');
    if (fromEditor && ft.properties?.anchorOnly && ft.geometry.type === 'Point') {
      anchorFix.set(id, ft.geometry.coordinates as [number, number]);
      continue;
    }
    if (manual.has(id) && !fromEditor) throw new Error(`duplicate manual geometry: ${id}`);
    manual.set(id, ft);
  }
}

// ---------- resolving ----------

const pickSingle = (r: Rule, f: F[]) => (r.src === 'place' || r.src === 'elevation' || r.src === 'point' ? best(f).slice(0, 1) : f);

function byRule(rule: Rule): Resolved | null {
  const ne = (k: LayerKey, names: string | string[], pred?: (f: F) => boolean): Resolved | null => {
    const fs_ = pickSingle(rule, find(k, names, pred));
    const g = combine(fs_);
    if (!g) return null;
    const conf: Confidence = k === 'region' ? 'medium' : 'high';
    const capital = k === 'place' && fs_[0] ? String(fs_[0].properties.FEATURECLA) === 'Admin-0 capital' : undefined;
    return { capital, type: typeOf(g), geometry: g, source: 'naturalearth', confidence: conf, detail: `${k}: ${[...new Set(fs_.map((f) => String(f.properties.NAME ?? f.properties.name)))].join(', ')}` };
  };
  switch (rule.src) {
    case 'country': {
      const g = combine(countryBy(rule.en));
      return g ? { type: 'polygon', geometry: g, source: 'naturalearth', confidence: 'high', detail: `country: ${rule.en}` } : null;
    }
    case 'countries': {
      const fs_ = countryBy(rule.en);
      const g = combine(fs_);
      const missing = rule.en.filter((n) => !countryBy(n).length);
      return g ? { type: 'polygon', geometry: g, source: 'naturalearth', confidence: 'medium', detail: `union of ${fs_.length} countries${missing.length ? ` (not found: ${missing.join(', ')})` : ''}` } : null;
    }
    case 'place':
      return ne('place', rule.en, rule.adm0 ? (f) => key(f.properties.ADM0NAME) === key(rule.adm0) || key(f.properties.SOV0NAME) === key(rule.adm0) : undefined);
    case 'river': {
      const fs_ = [...find('river', rule.en), ...find('riverEu', rule.en)].filter((f) => !rule.bbox || inBbox(f, rule.bbox));
      const g = combine(fs_);
      return g ? { type: 'line', geometry: g, source: 'naturalearth', confidence: 'high', detail: `river: ${fs_.length} segments` } : null;
    }
    case 'lake':
      return ne('lake', rule.en) ?? ne('lakeEu', rule.en);
    case 'marine':
      return ne('marine', rule.en);
    case 'region':
      return ne('region', rule.en, rule.cls ? (f) => key(f.properties.FEATURECLA) === key(rule.cls) : undefined);
    case 'point':
      return ne('regionPoint', rule.en);
    case 'elevation':
      return ne('elevation', rule.en);
    case 'island':
      return ne('island', rule.en);
    case 'admin1': {
      const want = (Array.isArray(rule.en) ? rule.en : [rule.en]).map(key);
      const fs_ = layer('admin1').filter((f) => f.properties.adm0_a3 === rule.adm0 && [f.properties.name, f.properties.name_en, f.properties.name_alt].some((v) => want.includes(key(v))));
      const g = combine(fs_);
      return g ? { type: 'polygon', geometry: g, source: 'naturalearth', confidence: 'high', detail: `admin-1: ${[rule.en].flat().join(", ")}` } : null;
    }
    case 'plates': {
      const fs_ = layer('plate').filter((f) => rule.codes.includes(String(f.properties.Code)));
      const g = combine(fs_);
      return g ? { type: 'polygon', geometry: g, source: 'pb2002', confidence: 'high', detail: `PB2002 ${rule.codes.join('+')}` } : null;
    }
    case 'county': {
      const fs_ = layer('county').filter((f) => key(f.properties.shapeName) === key(rule.name));
      const g = combine(fs_);
      return g ? { type: 'polygon', geometry: g, source: 'geoboundaries', confidence: 'high', detail: `county: ${rule.name}` } : null;
    }
    case 'counties': {
      const fs_ = layer('county').filter((f) => rule.names.some((n) => key(n) === key(f.properties.shapeName)));
      const bp = rule.withBudapest ? layer('admin1').filter((f) => f.properties.adm0_a3 === 'HUN' && f.properties.name === 'Budapest') : [];
      const parts = [...fs_, ...bp];
      let g = combine(parts);
      // geoBoundaries' Pest includes Budapest: cut it out for the Pest region.
      if (g && !rule.withBudapest && rule.names.length === 1 && rule.names[0] === 'Pest') {
        const budapest = layer('admin1').find((f) => f.properties.adm0_a3 === 'HUN' && f.properties.name === 'Budapest');
        if (budapest) g = turf.difference(turf.featureCollection([turf.feature(g as Polygon), budapest as Feature<Polygon>]))?.geometry ?? g;
      }
      return g ? { type: 'polygon', geometry: g, source: 'geoboundaries', confidence: 'high', detail: `counties: ${rule.names.join(', ')}${rule.withBudapest ? ' + Budapest (NE)' : ''}` } : null;
    }
    case 'parallel': {
      const coords: Position[] = [];
      for (let lon = -180; lon <= 180; lon += 2) coords.push([lon, rule.lat]);
      return { type: 'line', geometry: { type: 'LineString', coordinates: coords } as LineString, source: 'computed', confidence: 'high', detail: `parallel ${rule.lat}°` };
    }
    case 'meridian': {
      const coords: Position[] = [];
      for (let lat = -90; lat <= 90; lat += 2) coords.push([rule.lon, lat]);
      return { type: 'line', geometry: { type: 'LineString', coordinates: coords } as LineString, source: 'computed', confidence: 'high', detail: `meridian ${rule.lon}°` };
    }
    case 'pole':
      return { type: 'point', geometry: { type: 'Point', coordinates: [0, rule.lat] }, source: 'computed', confidence: 'high', detail: 'pole' };
    case 'manual':
      return null;
  }
}

function auto(item: Item): Resolved | null {
  const forms = nameForms(item.name);
  const byHu = (k: LayerKey, pred?: (f: F) => boolean) => {
    const fs_ = layer(k).filter((f) => {
      const hu = f.properties.NAME_HU ?? f.properties.name_hu;
      return typeof hu === 'string' && forms.some((n) => key(n) === key(hu)) && (!pred || pred(f));
    });
    return fs_;
  };
  const cat = item.category;
  const hungary = item.region === 'Magyarország';
  if (cat === 'Országok') {
    const fs_ = byHu('country');
    const g = combine(fs_);
    if (g) return { type: 'polygon', geometry: g, source: 'naturalearth', confidence: 'high', detail: `country (hu): ${fs_.map((f) => f.properties.ADMIN).join(', ')}` };
  }
  if (cat === 'Városok' || cat === 'Települések') {
    const pred = hungary ? (f: F) => f.properties.ADM0NAME === 'Hungary' : undefined;
    let fs_ = byHu('place', pred);
    if (!fs_.length) fs_ = find('place', forms, pred);
    const f = best(fs_)[0];
    if (f) return { type: 'point', geometry: f.geometry, source: 'naturalearth', confidence: 'high', detail: `place: ${f.properties.NAME} (${f.properties.ADM0NAME})`, capital: String(f.properties.FEATURECLA).startsWith('Admin-0 capital') && !String(f.properties.FEATURECLA).includes('alt') };
    return null;
  }
  for (const k of ['lake', 'lakeEu', 'marine', 'region', 'regionPoint', 'elevation', 'island'] as LayerKey[]) {
    // Never match a landscape to a country or a country to a landscape (e.g. "Szudán").
    const fs_ = byHu(k, hungary ? (f) => inBbox(f, [15.5, 45.3, 23.5, 49]) : undefined);
    const g = combine(k === 'regionPoint' || k === 'elevation' ? fs_.slice(0, 1) : fs_);
    if (g) return { type: typeOf(g), geometry: g, source: 'naturalearth', confidence: k === 'region' ? 'medium' : 'high', detail: `${k} (hu): ${fs_.map((f) => f.properties.NAME ?? f.properties.name).join(', ')}` };
  }
  return null;
}

function resolve(item: Item): Resolved | null {
  const man = manual.get(item.id);
  if (man) {
    const p = man.properties ?? {};
    return {
      type: typeOf(man.geometry),
      geometry: man.geometry,
      source: 'manual',
      confidence: (p.confidence as Confidence) ?? 'low',
      detail: String(p.note ?? 'kézzel rajzolt'),
    };
  }
  const entry = NAME_MAP[item.id];
  if (entry && entry.rule.src !== 'manual') return byRule(entry.rule);
  if (entry?.rule.src === 'manual') return null;
  return auto(item);
}

// ---------- run ----------

for (const id of Object.keys(NAME_MAP)) if (!items.some((i) => i.id === id)) console.warn(`! name-map: unknown id ${id}`);

const regionSlug: Record<string, string> = {
  Föld: 'fold',
  Afrika: 'afrika',
  Amerika: 'amerika',
  'Ausztrália és Óceánia': 'ausztralia-oceania',
  Ázsia: 'azsia',
  Európa: 'europa',
  Magyarország: 'magyarorszag',
};

const places: Record<string, unknown> = {};
const byRegion = new Map<string, Feature[]>();
const missing: Item[] = [];
const report: { item: Item; r: Resolved }[] = [];

for (const item of items) {
  let r: Resolved | null = null;
  try {
    r = resolve(item);
  } catch (e) {
    console.warn(`! ${item.id}: ${(e as Error).message}`);
  }
  if (!r) {
    missing.push(item);
    continue;
  }
  const expected = NAME_MAP[item.id]?.rule;
  if (expected?.src === 'manual' && expected.type !== r.type) console.warn(`! ${item.id}: expected ${expected.type}, got ${r.type}`);
  const feat = turf.feature(r.geometry, { id: item.id });
  // Simplify heavy outlines; keep enough detail for the Hungary view.
  // Simplify relative to the feature's size: a country needs far less detail than a small landscape.
  const [bw, bs, be, bn] = turf.bbox(feat);
  const baseTol = item.region === 'Magyarország' ? 0.002 : item.region === 'Európa' ? 0.008 : 0.03;
  const tol = Math.max(baseTol, Math.hypot(be - bw, bn - bs) / 500);
  const simple = r.type === 'point' ? feat : turf.simplify(feat, { tolerance: tol, highQuality: false });
  const anchor =
    anchorFix.get(item.id) ??
    (r.type === 'point'
      ? turf.getCoord(turf.pointOnFeature(simple))
      : r.type === 'line'
        ? lineMid(simple as Feature<LineString | MultiLineString>)
        : turf.getCoord(turf.pointOnFeature(simple)));
  const bbox = turf.bbox(simple).map((v) => Math.round(v * 1000) / 1000);
  places[item.id] = {
    type: r.type,
    anchor: anchor.map((v: number) => Math.round(v * 10000) / 10000),
    bbox,
    en: NAME_MAP[item.id]?.en ?? null,
    geoSource: r.source === 'computed' ? 'naturalearth' : r.source,
    // Natural Earth flags Johannesburg as an Admin-0 capital; it is not one.
    ...(r.capital && item.id !== 'afrika--varosok--johannesburg' ? { capital: true } : {}),
    confidence: r.confidence,
  };
  const slug = regionSlug[item.region]!;
  if (!byRegion.has(slug)) byRegion.set(slug, []);
  simple.id = item.id;
  byRegion.get(slug)!.push(simple as Feature);
  report.push({ item, r });
}

function lineMid(f: Feature<LineString | MultiLineString>): Position {
  // Midpoint along the longest part.
  const parts = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const longest = parts.reduce((a, b) => (turf.length(turf.lineString(b)) > turf.length(turf.lineString(a)) ? b : a));
  const ls = turf.lineString(longest);
  return turf.getCoord(turf.along(ls, turf.length(ls) / 2));
}

fs.mkdirSync('public/data/geo', { recursive: true });
fs.writeFileSync('public/data/places.json', JSON.stringify(places));
for (const [slug, feats] of byRegion) {
  const topo = topology({ items: turf.featureCollection(feats) }, 5e4);
  fs.writeFileSync(`public/data/geo/items-${slug}.topo.json`, JSON.stringify(topo));
}

// ---------- base maps ----------

type Box = [number, number, number, number];
/** Clips every feature to the view box so far-away parts of big countries are dropped. */
function clip(fs_: Feature[], box: Box): Feature[] {
  const out: Feature[] = [];
  for (const f of fs_) {
    if (!f.geometry || !inBbox(f as F, box)) continue;
    try {
      const c = turf.bboxClip(f as Feature<Polygon | MultiPolygon>, box);
      if (turf.coordAll(c).length) out.push({ ...c, properties: f.properties });
    } catch {
      /* skip broken geometries */
    }
  }
  return out;
}
function base(name: string, layers: Record<string, Feature[]>, q: number, keep: number) {
  let topo = topology(Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, turf.featureCollection(v)])), q);
  topo = presimplify(topo as never) as typeof topo;
  topo = simplify(topo as never, quantile(topo as never, keep)) as typeof topo;
  fs.writeFileSync(`public/data/geo/base-${name}.topo.json`, JSON.stringify(topo));
}
const props = (f: F, keep: string[]) => ({ ...f, properties: Object.fromEntries(keep.map((k) => [k, f.properties[k]])) }) as Feature;
const C = ['ADMIN', 'NAME_HU', 'ADM0_A3'];
const country50 = layer('country50').map((f) => props(f, C));
const bigLakes = layer('lake').filter((f) => Number(f.properties.scalerank ?? 9) <= 1).map((f) => props(f, ['name']));
base('world', { countries: country50, lakes: bigLakes }, 5e4, 0.08);
const eu: Box = [-26, 33, 62, 72];
base('europe', { countries: clip(country50.filter((f) => inBbox(f as F, eu)), eu), lakes: clip(layer('lake').filter((f) => Number(f.properties.scalerank ?? 9) <= 4).map((f) => props(f, ['name'])), eu) }, 5e4, 0.15);
const hu: Box = [13, 44.2, 28, 50.2];
const huCountries = clip(layer('country').filter((f) => inBbox(f, hu)).map((f) => props(f, C)), hu);
const counties = layer('county').map((f) => props(f, ['shapeName']));
const huLakes = clip([...layer('lake'), ...layer('lakeEu')].filter((f) => inBbox(f, hu)).map((f) => props(f, ['name'])), hu);
base('hungary', { countries: huCountries, counties, lakes: huLakes }, 5e4, 0.2);

// ---------- report ----------

const total = items.length;
const covered = total - missing.length;
const bySource = report.reduce<Record<string, number>>((a, { r }) => ((a[r.source] = (a[r.source] ?? 0) + 1), a), {});
const lines = [
  '# Térképi geometriák – ellenőrzési jelentés',
  '',
  `Lefedettség: **${covered} / ${total}** (${((covered / total) * 100).toFixed(1)}%).`,
  '',
  `Források: ${Object.entries(bySource).map(([k, v]) => `${k} ${v}`).join(' · ')}.`,
  '',
  'Ezeket érdemes az iskolai atlasszal összevetni; javítani a Térképszerkesztővel (`?edit=1`) vagy a `scripts/manual-geo/*.geojson` fájlokban lehet.',
  '',
];
if (missing.length) {
  lines.push(`## ❌ Hiányzó geometria (${missing.length})`, '', ...missing.map((i) => `- \`${i.id}\` – ${i.name} (${i.region} / ${i.category})`), '');
}
const manualOnes = report.filter(({ r }) => r.source === 'manual');
const low = report.filter(({ r }) => r.source !== 'manual' && r.confidence !== 'high');
lines.push(`## Kézzel rajzolt (${manualOnes.length})`, '', ...manualOnes.map(({ item, r }) => `- ${item.name} (${item.region} / ${item.category}) – ${r.confidence} – ${r.detail}`), '');
lines.push(`## Közepes / alacsony megbízhatóságú forrásegyezés (${low.length})`, '', ...low.map(({ item, r }) => `- ${item.name} (${item.region}) – ${r.confidence} – ${r.detail}`), '');
fs.mkdirSync('review', { recursive: true });
fs.writeFileSync('review/geo-report.md', lines.join('\n'));

console.log(`geometry: ${covered}/${total}; sources: ${JSON.stringify(bySource)}; missing: ${missing.length}`);
if (missing.length) {
  console.log(missing.map((i) => `  - ${i.id}`).join('\n'));
  if (!allowMissing) process.exit(1);
}
