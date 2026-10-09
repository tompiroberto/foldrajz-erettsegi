// Downloads the free geo sources used by scripts/build-geo.ts into data-src/ (not committed).
//   node scripts/download-geo.mjs
import { mkdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';
const SOURCES = {
  // Natural Earth 1:10m (public domain)
  'ne_10m_admin_0_countries.geojson': `${NE}/ne_10m_admin_0_countries.geojson`,
  'ne_10m_populated_places.geojson': `${NE}/ne_10m_populated_places.geojson`,
  'ne_10m_rivers_lake_centerlines.geojson': `${NE}/ne_10m_rivers_lake_centerlines.geojson`,
  'ne_10m_rivers_europe.geojson': `${NE}/ne_10m_rivers_europe.geojson`,
  'ne_10m_lakes.geojson': `${NE}/ne_10m_lakes.geojson`,
  'ne_10m_lakes_europe.geojson': `${NE}/ne_10m_lakes_europe.geojson`,
  'ne_10m_geography_regions_polys.geojson': `${NE}/ne_10m_geography_regions_polys.geojson`,
  'ne_10m_geography_regions_points.geojson': `${NE}/ne_10m_geography_regions_points.geojson`,
  'ne_10m_geography_regions_elevation_points.geojson': `${NE}/ne_10m_geography_regions_elevation_points.geojson`,
  'ne_10m_geography_marine_polys.geojson': `${NE}/ne_10m_geography_marine_polys.geojson`,
  'ne_10m_land.geojson': `${NE}/ne_10m_land.geojson`,
  'ne_50m_land.geojson': `${NE}/ne_50m_land.geojson`,
  'ne_50m_admin_0_countries.geojson': `${NE}/ne_50m_admin_0_countries.geojson`,
  'ne_10m_minor_islands.geojson': `${NE}/ne_10m_minor_islands.geojson`,
  // PB2002 plate model, Peter Bird (2003), via github.com/fraxen/tectonicplates
  'pb2002_boundaries.json': 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json',
  'pb2002_plates.json': 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json',
  // geoBoundaries Hungary ADM1 counties (CC BY 4.0)
  'geoBoundaries-HUN-ADM1.geojson':
    'https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/HUN/ADM1/geoBoundaries-HUN-ADM1.geojson',
};

const dir = 'data-src';
mkdirSync(dir, { recursive: true });
for (const [name, url] of Object.entries(SOURCES)) {
  const dest = join(dir, name);
  if (existsSync(dest) && statSync(dest).size > 1000) {
    console.log(`= ${name}`);
    continue;
  }
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    console.log(`✕ ${name}: HTTP ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  console.log(`✓ ${name} (${(buf.length / 1e6).toFixed(1)} MB)`);
}
