// Checks one manual-geo file: ids exist, geometry types match name-map, rings closed,
// coordinates are [lon, lat] and inside the item's region.
//   npx tsx scripts/geo/check-manual.ts scripts/manual-geo/<file>.geojson
import fs from 'node:fs';
import * as turf from '@turf/turf';
import type { Feature, Position } from 'geojson';
import { NAME_MAP } from '../name-map.ts';

const file = process.argv[2]!;
const items = new Map(
  (JSON.parse(fs.readFileSync('starter-data/topography.json', 'utf8')).items as { id: string; name: string; region: string; category: string }[]).map((i) => [i.id, i]),
);
const REGION_BOX: Record<string, [number, number, number, number]> = {
  Magyarország: [16.0, 45.6, 23.0, 48.7],
  Európa: [-25, 34, 66, 72],
  Afrika: [-26, -36, 60, 38],
  Amerika: [-180, -57, -30, 84],
  'Ausztrália és Óceánia': [110, -50, 180, 0],
  // Asia reaches past the antimeridian (Chukotka, Bering Strait).
  Ázsia: [-180, -11, 180, 82],
  Föld: [-180, -90, 180, 90],
};
const POINT_CATS = /Települések|Városok/;

const fc = JSON.parse(fs.readFileSync(file, 'utf8'));
let errors = 0;
const err = (m: string) => (errors++, console.log(`✕ ${m}`));
const seen = new Set<string>();
for (const f of fc.features as Feature[]) {
  const id = String(f.properties?.id);
  const it = items.get(id);
  if (!it) {
    err(`ismeretlen id: ${id}`);
    continue;
  }
  if (seen.has(id)) err(`kétszer szerepel: ${id}`);
  seen.add(id);
  if (!['high', 'medium', 'low'].includes(String(f.properties?.confidence))) err(`${id}: confidence hiányzik`);
  const t = f.geometry.type;
  const kind = t.includes('Point') ? 'point' : t.includes('Line') ? 'line' : 'polygon';
  const want = NAME_MAP[id]?.rule.src === 'manual' ? (NAME_MAP[id]!.rule as { type: string }).type : POINT_CATS.test(it.category) ? 'point' : null;
  if (want && want !== kind) err(`${id}: ${want} kellene, ${kind} van`);
  const coords = turf.coordAll(f as Feature);
  if (coords.some(([x, y]) => Math.abs(x!) > 180 || Math.abs(y!) > 90)) err(`${id}: koordináta tartományon kívül`);
  const box = REGION_BOX[it.region]!;
  const outside = coords.filter(([x, y]) => x! < box[0] || x! > box[2] || y! < box[1] || y! > box[3]).length;
  if (it.region !== 'Föld' && outside > coords.length * 0.3) err(`${id}: a pontok ${outside}/${coords.length} része a(z) ${it.region} régión kívül esik – fel van cserélve a [lon, lat]?`);
  if (t === 'Polygon' || t === 'MultiPolygon') {
    const rings: Position[][] = t === 'Polygon' ? (f.geometry as { coordinates: Position[][] }).coordinates : (f.geometry as { coordinates: Position[][][] }).coordinates.flat();
    for (const r of rings) {
      const a = r[0]!;
      const b = r[r.length - 1]!;
      if (a[0] !== b[0] || a[1] !== b[1]) err(`${id}: nem zárt gyűrű`);
      if (r.length < 5) err(`${id}: túl kevés csúcspont (${r.length})`);
    }
    try {
      if (turf.kinks(f as Feature<import('geojson').Polygon>).features.length) err(`${id}: önmetsző poligon`);
    } catch {
      /* multipolygon kinks unsupported in some turf versions */
    }
  }
}
console.log(`${fc.features.length} geometria, ${errors} hiba`);
process.exit(errors ? 1 : 0);
