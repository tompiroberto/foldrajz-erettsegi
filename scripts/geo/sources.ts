// Loads the downloaded geo sources (data-src/) into indexed layers.
import fs from 'node:fs';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type LayerKey =
  | 'country'
  | 'country50'
  | 'admin1'
  | 'place'
  | 'river'
  | 'riverEu'
  | 'lake'
  | 'lakeEu'
  | 'region'
  | 'regionPoint'
  | 'elevation'
  | 'marine'
  | 'island'
  | 'plate'
  | 'plateBoundary'
  | 'county';

const FILES: Record<LayerKey, string> = {
  country: 'ne_10m_admin_0_countries.geojson',
  country50: 'ne_50m_admin_0_countries.geojson',
  admin1: 'ne_10m_admin_1_states_provinces.geojson',
  place: 'ne_10m_populated_places.geojson',
  river: 'ne_10m_rivers_lake_centerlines.geojson',
  riverEu: 'ne_10m_rivers_europe.geojson',
  lake: 'ne_10m_lakes.geojson',
  lakeEu: 'ne_10m_lakes_europe.geojson',
  region: 'ne_10m_geography_regions_polys.geojson',
  regionPoint: 'ne_10m_geography_regions_points.geojson',
  elevation: 'ne_10m_geography_regions_elevation_points.geojson',
  marine: 'ne_10m_geography_marine_polys.geojson',
  island: 'ne_10m_minor_islands.geojson',
  plate: 'pb2002_plates.json',
  plateBoundary: 'pb2002_boundaries.json',
  county: 'geoBoundaries-HUN-ADM1.geojson',
};

export type F = Feature<Geometry, Record<string, unknown>>;

const cache = new Map<LayerKey, F[]>();
export function layer(k: LayerKey): F[] {
  let l = cache.get(k);
  if (!l) {
    const fc = JSON.parse(fs.readFileSync(`data-src/${FILES[k]}`, 'utf8')) as FeatureCollection;
    l = fc.features as F[];
    cache.set(k, l);
  }
  return l;
}

/** Lowercase, accent-free, hyphen/space-insensitive key for name matching. */
export const key = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[‐-―−\-–'’.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Every name-like property value of a feature (Hungarian, English, local, alternates). */
export function namesOf(f: F): string[] {
  const p = f.properties;
  const out: string[] = [];
  for (const k of ['NAME_HU', 'name_hu', 'NAME', 'name', 'NAME_EN', 'name_en', 'NAMEALT', 'namealt', 'name_alt', 'NAMEASCII', 'MEGANAME', 'shapeName', 'PlateName', 'ADMIN', 'NAME_LONG']) {
    const v = p[k];
    if (typeof v === 'string' && v.trim()) out.push(v);
  }
  return out;
}

export function find(k: LayerKey, names: string | string[], pred?: (f: F) => boolean): F[] {
  const want = new Set((Array.isArray(names) ? names : [names]).map(key));
  return layer(k).filter((f) => namesOf(f).some((n) => want.has(key(n))) && (!pred || pred(f)));
}
