import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { geoCentroid, geoContains } from 'd3-geo';
import type { Feature } from 'geojson';
import { Crosshair, Footprints, Layers3, Minus, Plus, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import topo from '../../starter-data/topography.json';
import type { TopographyFile, TopoItem } from '@/data/types';
import { REGION_VIEWS, formatCoord, loadBase, loadPlaces, viewFor, type BaseLayers, type PlaceGeo } from '@/data/geo';
import { PlaceFactsBlock } from '@/components/PlaceFactsBlock';
import { DraftBar, MapEditor, type Draft } from '@/components/map/MapEditor';
import { useGeoEdits } from '@/store/geoEdits';
import { AtlasMap, type AtlasMapHandle, type LabelMode, type MapItem } from '@/components/map/AtlasMap';
import { aliasesOf } from '@/lib/normalize';
import { statusOf, type Grade, type ItemStatus } from '@/lib/srs';
import { itemId, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

const ALL = (topo as TopographyFile).items;
type Mode = 'bongeszes' | 'kartyak' | 'seta';
const STATUS_LABEL: Record<ItemStatus | 'all', string> = { all: 'Mind', new: 'Új', learning: 'Tanulás alatt', mastered: 'Elsajátítva' };
const SOURCE_LABEL: Record<PlaceGeo['geoSource'], string> = {
  naturalearth: 'Natural Earth',
  pb2002: 'PB2002 lemezmodell',
  geoboundaries: 'geoBoundaries',
  manual: 'kézzel rajzolt',
};
const CONF_LABEL = { high: 'pontos', medium: 'közelítő', low: 'vázlatos' } as const;

function usePlaces() {
  const [p, setP] = useState<Record<string, PlaceGeo> | null>(null);
  useEffect(() => void loadPlaces().then(setP), []);
  return p;
}

/** Country (Hungarian name) that contains a point, from the 1:50m world layer. */
function useCountryOf(anchor: [number, number] | undefined) {
  const [world, setWorld] = useState<BaseLayers | null>(null);
  useEffect(() => void loadBase('world').then(setWorld), []);
  return useMemo(() => {
    if (!anchor || !world) return null;
    const f = world.countries.features.find((c) => geoContains(c, anchor));
    return f ? (f.properties.NAME_HU ?? f.properties.ADMIN) : null;
  }, [anchor, world]);
}

function Drawer({ item, place, onClose, onPractice, children }: { item: TopoItem; place?: PlaceGeo; onClose: () => void; onPractice: () => void; children?: React.ReactNode }) {
  const country = useCountryOf(place?.type === 'point' ? place.anchor : undefined);
  const aliases = aliasesOf(item.name).filter((a) => a !== item.name);
  const st = statusOf(useProgress((s) => s.srs[itemId('place', item.id)]));
  return (
    <aside className="map-drawer card" aria-label={`${item.name} részletei`}>
      <div className="row">
        <h2 style={{ margin: 0, flex: 1 }}>{item.name}</h2>
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Bezárás">
          <X size={18} />
        </button>
      </div>
      {aliases.length > 0 && <p className="muted" style={{ margin: 0 }}>Más néven: {aliases.join(', ')}</p>}
      <div className="row" style={{ gap: 6 }}>
        <span className="chip chip-topo">{item.region}</span>
        <span className="chip">{item.category}</span>
        {item.level === 'emelt' && <span className="badge-emelt">EMELT</span>}
        <span className="chip">{STATUS_LABEL[st]}</span>
      </div>
      <dl className="facts">
        {place && (
          <>
            <dt>Koordináta</dt>
            <dd>
              {place.type === 'point' ? formatCoord(place.anchor) : `középpontja kb. ${formatCoord(place.anchor)}`}
              {country && place.type === 'point' && <> · {country}</>}
            </dd>
            {place.en && (
              <>
                <dt>Nemzetközi név</dt>
                <dd>{place.en}</dd>
              </>
            )}
            <dt>Térképi forrás</dt>
            <dd>
              {SOURCE_LABEL[place.geoSource]} ({CONF_LABEL[place.confidence]})
            </dd>
          </>
        )}
      </dl>
      <PlaceFactsBlock id={item.id} />
      {children}
      <div className="row">
        <button className="btn primary" type="button" onClick={onPractice}>
          <Crosshair size={16} /> Gyakorold
        </button>
      </div>
    </aside>
  );
}

const CAT_ORDER = ['A földrész részei', 'Földrészek', 'Óceánok', 'Kőzetlemezek', 'Nagyszerkezeti egységek', 'Fő tájegységek', 'Tájak', 'Egyéb tájak, területek', 'Vízrajz', 'Tengeráramlások', 'Országok', 'Megyék', 'Nagyrégiók, régiók', 'Történelmi tájnevek', 'Városok', 'Települések', 'Iparvidékek', 'Nemzeti parkok, világörökségek'];

export default function TopoMap() {
  const [params, setParams] = useSearchParams();
  const rawPlaces = usePlaces();
  const editMode = params.get('edit') === '1';
  const [draft, setDraft] = useState<Draft | null>(null);
  const edits = useGeoEdits((s) => s.edits);
  // In the Térképszerkesztő the local corrections are drawn instead of the shipped data.
  const places = useMemo(() => {
    if (!rawPlaces || !editMode || !Object.keys(edits).length) return rawPlaces;
    const p = { ...rawPlaces };
    for (const [id, e] of Object.entries(edits)) {
      const pl = p[id];
      if (!pl) continue;
      const anchor = (e.geometry.type === 'Point' ? e.geometry.coordinates : geoCentroid(e.geometry)) as [number, number];
      const type = e.kind === 'anchor' ? pl.type : e.geometry.type === 'Point' ? 'point' : e.geometry.type === 'LineString' ? 'line' : 'polygon';
      p[id] = { ...pl, anchor, type, confidence: 'medium' };
    }
    return p;
  }, [rawPlaces, editMode, edits]);
  const overrides = useMemo(() => {
    if (!editMode) return undefined;
    const o: Record<string, Feature> = {};
    for (const [id, e] of Object.entries(edits)) if (e.kind === 'geometry') o[id] = { type: 'Feature', properties: { id }, geometry: e.geometry };
    return o;
  }, [editMode, edits]);
  const mapRef = useRef<AtlasMapHandle>(null);
  const srs = useProgress((s) => s.srs);
  const rate = useProgress((s) => s.rate);
  const visit = useProgress((s) => s.visit);
  const levelPref = useSettings((s) => s.levelFilter);

  const focusId = params.get('hely');
  const focusItem = focusId ? ALL.find((i) => i.id === focusId) : undefined;
  const region = params.get('regio') ?? focusItem?.region ?? 'Magyarország';
  const view = viewFor(region);
  const mode = (params.get('mod') as Mode) ?? 'bongeszes';
  const setParam = (k: string, v: string | null) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        if (v == null) n.delete(k);
        else n.set(k, v);
        return n;
      },
      { replace: true },
    );

  const [cats, setCats] = useState<string[]>([]);
  const [level, setLevel] = useState<'all' | 'emelt'>(levelPref);
  const [state, setState] = useState<ItemStatus | 'all'>('all');
  const [country, setCountry] = useState<string>('');
  const [labels, setLabels] = useState<LabelMode>('none');
  const [selected, setSelected] = useState<string | null>(focusId);
  const [panelOpen, setPanelOpen] = useState(false);
  const [base, setBase] = useState<BaseLayers | null>(null);

  useEffect(() => {
    void loadBase(view.base).then(setBase);
    setCats([]);
    setCountry('');
  }, [view]);
  useEffect(() => visit(`/topografia/terkep?regio=${encodeURIComponent(region)}`, `Térkép: ${region}`), [region, visit]);

  const regionItems = useMemo(() => ALL.filter((i) => i.region === region), [region]);
  const categories = useMemo(
    () => [...new Set(regionItems.map((i) => i.category))].sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b)),
    [regionItems],
  );

  const countryFeature = useMemo(() => base?.countries.features.find((f) => f.properties.ADM0_A3 === country), [base, country]);

  const filtered = useMemo(() => {
    return regionItems.filter((i) => {
      if (cats.length && !cats.includes(i.category)) return false;
      if (level === 'emelt' && i.level !== 'emelt') return false;
      if (state !== 'all' && statusOf(srs[itemId('place', i.id)]) !== state) return false;
      if (countryFeature && places) {
        const pl = places[i.id];
        if (!pl) return false;
        const [x, y] = pl.anchor;
        // Small buffer so border rivers and coastal features count too.
        const probes: [number, number][] = [[x, y], [x + 0.6, y], [x - 0.6, y], [x, y + 0.6], [x, y - 0.6]];
        if (!probes.some((p) => geoContains(countryFeature, p))) return false;
      }
      return true;
    });
  }, [regionItems, cats, level, state, countryFeature, places, srs]);

  const mapItems: MapItem[] = useMemo(
    () => filtered.map((i, n) => ({ id: i.id, name: i.name, no: n + 1, capital: places?.[i.id]?.capital })),
    [filtered, places],
  );

  // Walk order: by category, then west → east.
  const walk = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category) || (places?.[a.id]?.anchor[0] ?? 0) - (places?.[b.id]?.anchor[0] ?? 0),
      ),
    [filtered, places],
  );
  // Flashcards: due first, then new, then the rest.
  const cards = useMemo(() => {
    const now = Date.now();
    const score = (i: TopoItem) => {
      const s = srs[itemId('place', i.id)];
      if (!s) return 1;
      return s.due <= now ? 0 : 2 + s.due / 1e13;
    };
    return [...filtered].sort((a, b) => score(a) - score(b));
  }, [filtered, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const [step, setStep] = useState(0);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    setStep(0);
    setFlipped(false);
  }, [mode, region, cats, level, state, country]);

  const current = mode === 'kartyak' ? cards[step] : mode === 'seta' ? walk[step] : undefined;
  const selItem = (mode === 'bongeszes' ? ALL.find((i) => i.id === selected) : current) ?? undefined;

  // Zoom to the current card / walk step / selected place.
  useEffect(() => {
    if (!places) return;
    const id = current?.id ?? (mode === 'bongeszes' ? selected : null);
    const t = setTimeout(() => {
      if (id) mapRef.current?.fitTo([id]);
      else mapRef.current?.fitTo('all', 0);
    }, 120);
    return () => clearTimeout(t);
  }, [current?.id, selected, places, mode]);

  const rateCard = (g: Grade) => {
    if (!current) return;
    rate(itemId('place', current.id), g);
    setFlipped(false);
    setStep((s) => s + 1);
  };

  useEffect(() => {
    if (mode !== 'kartyak') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) rateCard((Number(e.key) - 1) as Grade);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const toggleCat = (c: string) => setCats((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  const countries = useMemo(
    () =>
      view.drilldown && base
        ? base.countries.features
            .map((f) => ({ code: f.properties.ADM0_A3, name: f.properties.NAME_HU ?? f.properties.ADMIN }))
            .filter((c) => regionItems.some((i) => i.category === 'Országok' && i.name.startsWith(c.name.split(' ')[0]!)))
            .sort((a, b) => a.name.localeCompare(b.name, 'hu'))
        : [],
    [view, base, regionItems],
  );

  return (
    <div className={`topo-map-page mode-${mode}`}>
      <aside className={`map-panel${panelOpen ? ' is-open' : ''}`} aria-label="Szűrők">
        <div className="map-panel-inner">
          <h1 className="map-title">Térkép</h1>
          <div className="pill-tabs" role="tablist" aria-label="Tanulási mód">
            {(
              [
                ['bongeszes', 'Böngészés', Layers3],
                ['kartyak', 'Kártyák', RotateCcw],
                ['seta', 'Felfedező séta', Footprints],
              ] as const
            ).map(([m, label, Icon]) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} className={`pill${mode === m ? ' active' : ''}`} onClick={() => setParam('mod', m)}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <fieldset>
            <legend>Régió</legend>
            <div className="chip-row">
              {REGION_VIEWS.map((v) => (
                <button key={v.region} type="button" className={`chip${v.region === region ? ' selected' : ''}`} aria-pressed={v.region === region} onClick={() => (setParam('regio', v.region), setParam('hely', null), setSelected(null))}>
                  {v.region}
                </button>
              ))}
            </div>
          </fieldset>

          {view.drilldown && (
            <label className="stack" style={{ gap: 4 }}>
              <span className="legend-like">Ország szerint</span>
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">Az egész régió</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <fieldset>
            <legend>Kategória</legend>
            <div className="chip-row">
              {categories.map((c) => (
                <button key={c} type="button" className={`chip${cats.includes(c) ? ' selected' : ''}`} aria-pressed={cats.includes(c)} onClick={() => toggleCat(c)}>
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="row">
            <label className="row" style={{ gap: 6 }}>
              Szint
              <select value={level} onChange={(e) => setLevel(e.target.value as 'all' | 'emelt')}>
                <option value="all">Mind</option>
                <option value="emelt">Csak emelt</option>
              </select>
            </label>
            <label className="row" style={{ gap: 6 }}>
              Állapot
              <select value={state} onChange={(e) => setState(e.target.value as ItemStatus | 'all')}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="row" style={{ gap: 6 }}>
            Feliratok
            <select value={labels} onChange={(e) => setLabels(e.target.value as LabelMode)}>
              <option value="none">ki</option>
              <option value="all">be</option>
              <option value="selected">csak a kiválasztott</option>
            </select>
          </label>

          <p className="muted tabular" aria-live="polite" style={{ margin: 0 }}>
            {filtered.length} név a térképen
          </p>

          {mode === 'bongeszes' && (
            <ol className="number-list">
              {mapItems.map((m) => (
                <li key={m.id}>
                  <button type="button" className={m.id === selected ? 'active' : ''} onClick={() => setSelected(m.id)}>
                    <span className="num-chip tabular">{m.no}</span> {m.name}
                    {ALL.find((i) => i.id === m.id)?.level === 'emelt' && <span className="badge-emelt">E</span>}
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>

      <section className="map-stage" aria-label="Térkép">
        <div className="map-toolbar">
          <button type="button" className="btn small map-filter-toggle" onClick={() => setPanelOpen((o) => !o)} aria-expanded={panelOpen}>
            <SlidersHorizontal size={15} /> Szűrők
          </button>
          {editMode && draft && selItem && <DraftBar item={selItem} place={places?.[selItem.id]} draft={draft} setDraft={setDraft} />}
          <span className="spacer" />
          <button type="button" className="icon-btn" aria-label="Nagyítás" onClick={() => mapRef.current?.zoomBy(1.6)}>
            <Plus size={18} />
          </button>
          <button type="button" className="icon-btn" aria-label="Kicsinyítés" onClick={() => mapRef.current?.zoomBy(1 / 1.6)}>
            <Minus size={18} />
          </button>
          <button
            type="button"
            className="btn small"
            onClick={() => mapRef.current?.fitTo(selItem ? [selItem.id] : filtered.map((i) => i.id))}
            title="Illesztés a kiválasztásra"
          >
            <Crosshair size={15} /> Illesztés
          </button>
        </div>
        {places ? (
          <AtlasMap
            ref={mapRef}
            view={view}
            items={mapItems}
            places={places}
            selectedId={selItem?.id}
            onlyIds={mode === 'kartyak' && current ? [current.id] : undefined}
            labels={mode === 'kartyak' ? 'none' : mode === 'seta' ? 'selected' : labels}
            showNumbers={mode === 'bongeszes'}
            onSelect={mode === 'bongeszes' && !draft ? setSelected : undefined}
            overrides={overrides}
            draft={draft}
            onMapClick={editMode && draft ? (ll) => setDraft((d) => d && (d.type === 'point' ? { ...d, pts: [ll] } : { ...d, pts: [...d.pts, ll] })) : undefined}
            ariaLabel={`${region} vaktérképe, ${filtered.length} névvel`}
          />
        ) : (
          <div className="skeleton" style={{ aspectRatio: '1000 / 680' }} />
        )}

        {mode === 'kartyak' && (
          <div className="card flashcard" aria-live="polite">
            {current ? (
              <>
                <p className="muted tabular" style={{ margin: 0 }}>
                  {step + 1} / {cards.length} · {current.category}
                </p>
                {flipped ? (
                  <>
                    <h2 style={{ margin: '4px 0' }}>
                      {current.name} {current.level === 'emelt' && <span className="badge-emelt">EMELT</span>}
                    </h2>
                    <div className="row grade-row" role="group" aria-label="Mennyire tudtad?">
                      {(['Nem tudtam', 'Nehéz', 'Jó', 'Könnyű'] as const).map((l, g) => (
                        <button key={l} type="button" className={`btn${g === 2 ? ' primary' : ''}`} onClick={() => rateCard(g as Grade)}>
                          <kbd>{g + 1}</kbd> {l}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h2 style={{ margin: '4px 0' }}>Mi ez a kiemelt hely?</h2>
                    <button type="button" className="btn primary" onClick={() => setFlipped(true)}>
                      Megfordítom <kbd>Szóköz</kbd>
                    </button>
                  </>
                )}
              </>
            ) : (
              <p style={{ margin: 0 }}>
                Kész ezzel a szűréssel! 🎉 <Link to="/topografia/kviz">Jöhet a kvíz?</Link>
              </p>
            )}
          </div>
        )}

        {mode === 'seta' && (
          <div className="card flashcard" aria-live="polite">
            {current ? (
              <>
                <p className="muted tabular" style={{ margin: 0 }}>
                  {step + 1} / {walk.length} · {current.category}
                </p>
                <h2 style={{ margin: '4px 0' }}>{current.name}</h2>
                <p className="muted" style={{ margin: 0 }}>
                  {places?.[current.id] ? formatCoord(places[current.id]!.anchor) : ''}
                </p>
                <div className="row">
                  <button type="button" className="btn" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                    ← Előző
                  </button>
                  <button type="button" className="btn primary" onClick={() => setStep((s) => s + 1)}>
                    Következő →
                  </button>
                </div>
              </>
            ) : (
              <p style={{ margin: 0 }}>A séta végére értél. <button className="btn small" type="button" onClick={() => setStep(0)}>Újra</button></p>
            )}
          </div>
        )}
      </section>

      {mode === 'bongeszes' && selItem && (
        <Drawer
          item={selItem}
          place={places?.[selItem.id]}
          onClose={() => setSelected(null)}
          onPractice={() => setParams({ regio: region, mod: 'kartyak' })}
        >
          {editMode && <MapEditor item={selItem} place={places?.[selItem.id]} draft={draft} setDraft={setDraft} />}
        </Drawer>
      )}
    </div>
  );
}
