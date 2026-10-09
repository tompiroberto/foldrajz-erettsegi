// Map data: region views (projection + extent), base layers and item geometries.
// Everything is fetched lazily from /data (precached by the service worker).
import { geoAzimuthalEqualArea, geoEqualEarth, geoMercator, type GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { RegionName } from './types';

export type GeoType = 'point' | 'line' | 'polygon';
export type BaseView = 'world' | 'europe' | 'hungary';

export interface PlaceGeo {
  type: GeoType;
  anchor: [number, number];
  bbox: [number, number, number, number];
  en: string | null;
  geoSource: 'naturalearth' | 'pb2002' | 'geoboundaries' | 'manual';
  confidence: 'high' | 'medium' | 'low';
  capital?: boolean;
}

export interface RegionView {
  region: RegionName;
  slug: string;
  base: BaseView;
  /** [west, south, east, north] */
  extent: [number, number, number, number];
  projection: () => GeoProjection;
  /** Countries offered in the "Ország szerint" drill-down. */
  drilldown: boolean;
}

export const REGION_VIEWS: RegionView[] = [
  { region: 'Föld', slug: 'fold', base: 'world', extent: [-180, -60, 180, 84], projection: () => geoEqualEarth(), drilldown: false },
  { region: 'Afrika', slug: 'afrika', base: 'world', extent: [-20, -36, 55, 38], projection: () => geoAzimuthalEqualArea().rotate([-18, -2]), drilldown: true },
  { region: 'Amerika', slug: 'amerika', base: 'world', extent: [-170, -56, -30, 83], projection: () => geoAzimuthalEqualArea().rotate([85, -15]), drilldown: true },
  { region: 'Ausztrália és Óceánia', slug: 'ausztralia-oceania', base: 'world', extent: [110, -48, 180, 0], projection: () => geoAzimuthalEqualArea().rotate([-150, 25]), drilldown: false },
  { region: 'Ázsia', slug: 'azsia', base: 'world', extent: [25, -11, 160, 78], projection: () => geoAzimuthalEqualArea().rotate([-95, -38]), drilldown: true },
  { region: 'Európa', slug: 'europa', base: 'europe', extent: [-25, 34, 50, 71], projection: () => geoAzimuthalEqualArea().rotate([-15, -52]), drilldown: true },
  { region: 'Magyarország', slug: 'magyarorszag', base: 'hungary', extent: [15.9, 45.6, 23.0, 48.65], projection: () => geoMercator(), drilldown: false },
];

export const viewFor = (r: string) => REGION_VIEWS.find((v) => v.region === r) ?? REGION_VIEWS[0]!;

const json = new Map<string, Promise<unknown>>();
function get<T>(url: string): Promise<T> {
  let p = json.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url}: ${r.status}`);
      return r.json();
    });
    json.set(url, p);
  }
  return p as Promise<T>;
}

export const loadPlaces = () => get<Record<string, PlaceGeo>>(`${import.meta.env.BASE_URL}data/places.json`);

export interface BaseLayers {
  countries: FeatureCollection<Geometry, { ADMIN: string; NAME_HU?: string; ADM0_A3: string }>;
  lakes: FeatureCollection;
  counties?: FeatureCollection<Geometry, { shapeName: string }>;
}

const baseCache = new Map<BaseView, Promise<BaseLayers>>();
export function loadBase(view: BaseView): Promise<BaseLayers> {
  let p = baseCache.get(view);
  if (!p) {
    p = get<Topology>(`${import.meta.env.BASE_URL}data/geo/base-${view}.topo.json`).then((t) => {
      const fc = (k: string) => (t.objects[k] ? (feature(t, t.objects[k] as GeometryCollection) as FeatureCollection) : undefined);
      return { countries: fc('countries') as BaseLayers['countries'], lakes: fc('lakes')!, counties: fc('counties') as BaseLayers['counties'] };
    });
    baseCache.set(view, p);
  }
  return p;
}

const itemCache = new Map<string, Promise<Map<string, Feature>>>();
/** Item geometries of one region, keyed by topography id. */
export function loadItems(slug: string): Promise<Map<string, Feature>> {
  let p = itemCache.get(slug);
  if (!p) {
    p = get<Topology>(`${import.meta.env.BASE_URL}data/geo/items-${slug}.topo.json`).then((t) => {
      const fc = feature(t, t.objects.items as GeometryCollection) as FeatureCollection;
      return new Map(fc.features.map((f) => [String(f.id ?? f.properties?.id), f]));
    });
    itemCache.set(slug, p);
  }
  return p;
}

/** Warm currents are drawn red, cold ones blue (atlas convention). */
export const WARM_CURRENTS = new Set([
  'fold--tengeraramlasok--golf-aramlas',
  'fold--tengeraramlasok--eszak-atlanti-aramlas',
  'fold--tengeraramlasok--kuro-shio-aramlas',
  'fold--tengeraramlasok--braziliai-aramlas',
  'fold--tengeraramlasok--del-egyenlitoi-aramlas',
  'fold--tengeraramlasok--eszak-egyenlitoi-aramlas',
]);

/** "é. sz. 47,5°, k. h. 19,0°" */
export function formatCoord([lon, lat]: [number, number]): string {
  const f = (v: number) => Math.abs(v).toFixed(1).replace('.', ',');
  return `${lat >= 0 ? 'é. sz.' : 'd. sz.'} ${f(lat)}°, ${lon >= 0 ? 'k. h.' : 'ny. h.'} ${f(lon)}°`;
}
