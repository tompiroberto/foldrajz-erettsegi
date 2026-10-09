import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { geoGraticule10, geoPath, type GeoProjection } from 'd3-geo';
import { select } from 'd3-selection';
import 'd3-transition';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import type { Feature } from 'geojson';
import { loadBase, loadItems, WARM_CURRENTS, type BaseLayers, type PlaceGeo, type RegionView } from '@/data/geo';

export const MAP_W = 1000;
export const MAP_H = 680;

export interface MapItem {
  id: string;
  name: string;
  /** Number shown on the marker (workbook style). */
  no?: number;
  capital?: boolean;
}

export type LabelMode = 'all' | 'none' | 'selected';

export interface AtlasMapHandle {
  fitTo: (ids: string[] | 'all', duration?: number) => void;
  zoomBy: (k: number) => void;
  /** Screen-space distance in px between a map click and a geometry, for the "Hol van?" quiz. */
  projection: () => GeoProjection | null;
  transform: () => ZoomTransform;
  /** lon/lat → screen (viewBox units, after zoom). */
  toScreen: (ll: [number, number]) => [number, number] | null;
  /** screen (viewBox units) → lon/lat. */
  toLonLat: (xy: [number, number]) => [number, number] | null;
  geometry: (id: string) => Feature | undefined;
}

interface Props {
  view: RegionView;
  items: MapItem[];
  places: Record<string, PlaceGeo>;
  selectedId?: string | null;
  highlightIds?: string[];
  /** Hide everything except these (flashcards / quiz). */
  onlyIds?: string[];
  labels?: LabelMode;
  showNumbers?: boolean;
  /** Dim all items: the blank "Hol van?" map. */
  blank?: boolean;
  onSelect?: (id: string) => void;
  /** Click on empty map (lon/lat) – quiz answers. */
  onMapClick?: (lonLat: [number, number], screen: [number, number]) => void;
  marker?: [number, number] | null;
  /** Térképszerkesztő: geometries that replace the loaded ones, and the drawing in progress. */
  overrides?: Record<string, Feature>;
  draft?: { type: 'point' | 'line' | 'polygon'; pts: [number, number][] } | null;
  ariaLabel: string;
  className?: string;
}

const isWater = (cat: string) => /Vízrajz|Óceánok|Tengeráramlás/.test(cat);

export const AtlasMap = forwardRef<AtlasMapHandle, Props>(function AtlasMap(
  { view, items, places, selectedId, highlightIds, onlyIds, labels = 'none', showNumbers = true, blank, onSelect, onMapClick, marker, overrides, draft, ariaLabel, className },
  ref,
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const tRef = useRef<ZoomTransform>(zoomIdentity);
  const [base, setBase] = useState<BaseLayers | null>(null);
  const [loaded, setGeoms] = useState<Map<string, Feature> | null>(null);
  const geoms = useMemo(() => (loaded && overrides ? new Map([...loaded, ...Object.entries(overrides)]) : loaded), [loaded, overrides]);
  const [k, setK] = useState(1);

  useEffect(() => {
    let alive = true;
    setBase(null);
    setGeoms(null);
    void loadBase(view.base).then((b) => alive && setBase(b));
    // Föld items are shown on every world-scale view too (currents, plates…), so load both.
    void Promise.all([loadItems(view.slug), view.slug !== 'fold' ? loadItems('fold') : Promise.resolve(new Map())]).then(([a, b]) => {
      if (alive) setGeoms(new Map([...b, ...a]));
    });
    return () => {
      alive = false;
    };
  }, [view]);

  const projection = useMemo(() => {
    const p = view.projection();
    const [w, s, e, n] = view.extent;
    const frame: Feature = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPoint',
        coordinates: [
          [w, s],
          [e, s],
          [w, n],
          [e, n],
          [(w + e) / 2, s],
          [(w + e) / 2, n],
          [w, (s + n) / 2],
          [e, (s + n) / 2],
        ],
      },
    };
    p.fitExtent(
      [
        [16, 16],
        [MAP_W - 16, MAP_H - 16],
      ],
      frame,
    );
    return p;
  }, [view]);
  const path = useMemo(() => geoPath(projection), [projection]);

  // Zoom & pan.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 40])
      .on('zoom', (ev) => {
        tRef.current = ev.transform;
        gRef.current?.setAttribute('transform', ev.transform.toString());
        gRef.current?.style.setProperty('--ik', String(1 / ev.transform.k));
      })
      .on('end', (ev) => setK(ev.transform.k));
    zoomRef.current = z;
    select(svg).call(z).on('dblclick.zoom', null);
    select(svg).call(z.transform, zoomIdentity);
    return () => {
      select(svg).on('.zoom', null);
    };
  }, [view]);

  const fitTo = (ids: string[] | 'all', duration = 650) => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const list = ids === 'all' ? [] : ids;
    for (const id of list) {
      const g = geoms?.get(id);
      const pl = places[id];
      let b: [[number, number], [number, number]] | null = null;
      if (g) b = path.bounds(g) as [[number, number], [number, number]];
      else if (pl) {
        const pt = projection(pl.anchor);
        if (pt) b = [pt as [number, number], pt as [number, number]];
      }
      if (!b || !Number.isFinite(b[0][0])) continue;
      x0 = Math.min(x0, b[0][0]);
      y0 = Math.min(y0, b[0][1]);
      x1 = Math.max(x1, b[1][0]);
      y1 = Math.max(y1, b[1][1]);
    }
    let t = zoomIdentity;
    if (Number.isFinite(x0)) {
      const w = Math.max(x1 - x0, 40);
      const h = Math.max(y1 - y0, 40);
      const kk = Math.min(24, 0.8 / Math.max(w / MAP_W, h / MAP_H));
      t = zoomIdentity.translate(MAP_W / 2, MAP_H / 2).scale(kk).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    }
    const sel = select(svg);
    const reduced = document.documentElement.dataset.motion === 'reduced';
    if (reduced || !duration) sel.call(z.transform, t);
    else sel.transition().duration(duration).call(z.transform, t);
  };

  useImperativeHandle(ref, () => ({
    fitTo,
    zoomBy: (kk: number) => svgRef.current && zoomRef.current && select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, kk),
    projection: () => projection,
    transform: () => tRef.current,
    toScreen: (ll) => {
      const p = projection(ll);
      return p ? (tRef.current.apply(p as [number, number]) as [number, number]) : null;
    },
    toLonLat: (xy) => {
      const ll = projection.invert?.(tRef.current.invert(xy));
      return ll ? (ll as [number, number]) : null;
    },
    geometry: (id) => geoms?.get(id),
  }));

  const graticule = useMemo(() => path(geoGraticule10()) ?? '', [path]);
  const sphere = useMemo(() => path({ type: 'Sphere' }) ?? '', [path]);
  const highlight = new Set(highlightIds ?? []);
  const only = onlyIds ? new Set(onlyIds) : null;
  const shown = items.filter((i) => !only || only.has(i.id));

  // Draw order: polygons, then lines, then points so small things stay clickable.
  const byType = (t: string) => shown.filter((i) => places[i.id]?.type === t);
  // Big areas (oceans, plates) go underneath so smaller shapes stay clickable.
  const area = (id: string) => {
    const g = geoms?.get(id);
    return g ? path.area(g) : 0;
  };
  const polys = byType('polygon').sort((a, b) => area(b.id) - area(a.id));
  const ordered = [...polys, ...byType('line'), ...byType('point')];

  const labelFor = (i: MapItem) => labels === 'all' || (labels === 'selected' && i.id === selectedId);

  return (
    <svg
      ref={svgRef}
      className={`atlas-map ${blank ? 'is-blank' : ''} ${className ?? ''}`}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      role="application"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!onMapClick || !svgRef.current) return;
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = svgRef.current.getScreenCTM();
        if (!ctm) return;
        const p = pt.matrixTransform(ctm.inverse());
        const [x, y] = tRef.current.invert([p.x, p.y]);
        const ll = projection.invert?.([x, y]);
        if (ll) onMapClick(ll as [number, number], [p.x, p.y]);
      }}
    >
      <defs>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" className="hatch-line" />
        </pattern>
        <pattern id="hatch-sel" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" className="hatch-line-sel" />
        </pattern>
        <marker id="arrow-warm" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="arrow-warm" />
        </marker>
        <marker id="arrow-cold" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="arrow-cold" />
        </marker>
        <filter id="soft" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <g ref={gRef} style={{ ['--ik' as string]: '1' }}>
        <path d={sphere} className="map-sea" />
        <path d={graticule} className="map-graticule" />
        {base && (
          <>
            <g className="map-land">
              {base.countries.features.map((f, i) => (
                <path key={i} d={path(f) ?? ''} className={view.base === 'hungary' ? (f.properties.ADM0_A3 === 'HUN' ? 'is-home' : 'is-neighbour') : undefined} />
              ))}
            </g>
            {base.counties && (
              <g className="map-counties">
                {base.counties.features.map((f, i) => (
                  <path key={i} d={path(f) ?? ''} />
                ))}
              </g>
            )}
            <g className="map-lakes">
              {base.lakes.features.map((f, i) => (
                <path key={i} d={path(f) ?? ''} />
              ))}
            </g>
          </>
        )}
        {!base && <text x={MAP_W / 2} y={MAP_H / 2} textAnchor="middle" className="map-loading">Térkép betöltése…</text>}

        {geoms && (
          <g className="map-items">
            {ordered.map((it) => {
              const pl = places[it.id];
              const g = geoms.get(it.id);
              if (!pl) return null;
              const sel = it.id === selectedId || highlight.has(it.id);
              const cls = `item item-${pl.type}${sel ? ' is-selected' : ''}`;
              const click = onSelect ? () => onSelect(it.id) : undefined;
              if (pl.type === 'polygon' && g) {
                return (
                  <path
                    key={it.id}
                    d={path(g) ?? ''}
                    className={cls}
                    fill={sel ? 'url(#hatch-sel)' : undefined}
                    onClick={click}
                    data-id={it.id}
                  >
                    <title>{blank ? '' : it.name}</title>
                  </path>
                );
              }
              if (pl.type === 'line' && g) {
                const current = it.id.includes('tengeraramlasok');
                const warm = WARM_CURRENTS.has(it.id);
                const d = path(g) ?? '';
                return (
                  <g key={it.id} className={`${cls}${current ? (warm ? ' current-warm' : ' current-cold') : ''}`} onClick={click} data-id={it.id}>
                    <path d={d} className="hit" />
                    <path d={d} className="stroke" markerEnd={current ? `url(#arrow-${warm ? 'warm' : 'cold'})` : undefined} />
                    {current && <path d={d} className="flow" />}
                    <title>{blank ? '' : it.name}</title>
                  </g>
                );
              }
              return null;
            })}
            {/* Numbered markers and point symbols, constant size on screen. */}
            {ordered.map((it) => {
              const pl = places[it.id];
              if (!pl) return null;
              const pt = projection(pl.anchor);
              if (!pt) return null;
              const sel = it.id === selectedId || highlight.has(it.id);
              const isPoint = pl.type === 'point';
              return (
                <g
                  key={`m-${it.id}`}
                  className={`marker${sel ? ' is-selected' : ''}${isPoint ? ' is-point' : ''}`}
                  style={{ transform: `translate(${pt[0]}px, ${pt[1]}px) scale(var(--ik))` }}
                  onClick={onSelect ? () => onSelect(it.id) : undefined}
                  data-id={it.id}
                >
                  {isPoint && (it.capital ? <rect x={-4} y={-4} width={8} height={8} className="pt-capital" /> : null)}
                  {isPoint && <circle r={it.capital ? 6 : 4.5} className="pt" />}
                  {showNumbers && it.no != null && (
                    <g transform={isPoint ? 'translate(9,-9)' : undefined}>
                      <circle r={9} className="num-bg" />
                      <text className="num" textAnchor="middle" dy="0.35em">
                        {it.no}
                      </text>
                    </g>
                  )}
                  {labelFor(it) && (
                    <text className={`label${isWater(it.id.split('--')[1] ?? '') || /vizrajz|oceanok|tengeraramlas/.test(it.id) ? ' is-water' : ''}`} x={12} y={showNumbers && it.no != null ? 22 : 4}>
                      {it.name}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
        {draft && draft.pts.length > 0 && (
          <g className="edit-draft">
            {draft.type !== 'point' && (
              <path
                d={path({ type: 'Feature', properties: {}, geometry: draft.type === 'polygon' && draft.pts.length > 2 ? { type: 'Polygon', coordinates: [[...draft.pts, draft.pts[0]!]] } : { type: 'LineString', coordinates: draft.pts } }) ?? ''}
                className={draft.type === 'polygon' ? 'draft-poly' : 'draft-line'}
              />
            )}
            {draft.pts.map((p, i) => {
              const pt = projection(p);
              return pt ? <circle key={i} className="draft-pt" style={{ transform: `translate(${pt[0]}px, ${pt[1]}px) scale(var(--ik))` }} r={draft.type === 'point' ? 7 : 4} /> : null;
            })}
          </g>
        )}
        {marker && (() => {
          const pt = projection(marker);
          return pt ? <g className="click-marker" style={{ transform: `translate(${pt[0]}px, ${pt[1]}px) scale(var(--ik))` }}><circle r={7} /><path d="M-11 0H11M0-11V11" /></g> : null;
        })()}
      </g>
      <text x={MAP_W - 10} y={MAP_H - 10} textAnchor="end" className="map-zoom-k" aria-hidden>
        {k > 1.05 ? `${k.toFixed(1)}×` : ''}
      </text>
    </svg>
  );
});
