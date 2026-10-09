// Prints, for each topography item, the candidate source features matching its name.
// Used to write scripts/name-map.ts.   npx tsx scripts/geo/analyze.ts [region]
import fs from 'node:fs';
import { key, layer, namesOf, type LayerKey } from './sources.ts';

const items = JSON.parse(fs.readFileSync('starter-data/topography.json', 'utf8')).items as { id: string; name: string; region: string; category: string }[];
const only = process.argv[2];
const LAYERS: LayerKey[] = ['country', 'place', 'river', 'riverEu', 'lake', 'lakeEu', 'region', 'regionPoint', 'elevation', 'marine', 'island', 'county'];

const index = new Map<string, { l: LayerKey; label: string }[]>();
for (const l of LAYERS) {
  for (const f of layer(l)) {
    const label = `${l}:${String(f.properties.NAME ?? f.properties.name ?? f.properties.shapeName)}${f.properties.FEATURECLA || f.properties.featurecla ? `(${f.properties.FEATURECLA ?? f.properties.featurecla})` : ''}`;
    for (const n of new Set(namesOf(f).map(key))) {
      if (!index.has(n)) index.set(n, []);
      index.get(n)!.push({ l, label });
    }
  }
}

for (const i of items) {
  if (only && i.region !== only) continue;
  const forms = [i.name, i.name.replace(/\s*\([^)]*\)/g, ''), ...[...i.name.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]!)];
  const hits = [...new Set(forms.map(key))].flatMap((k) => index.get(k) ?? []);
  console.log(`${i.id}\t${hits.slice(0, 4).map((h) => h.label).join(' | ') || '—'}`);
}
