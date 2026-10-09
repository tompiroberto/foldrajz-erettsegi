// Térképszerkesztő panel (brief §8.1). Shown in the map drawer when the URL has `?edit=1`.
import { Download, MapPin, PenLine, Pentagon, Trash2, Undo2 } from 'lucide-react';
import type { Geometry } from 'geojson';
import type { PlaceGeo } from '@/data/geo';
import type { TopoItem } from '@/data/types';
import { editsToGeoJSON, useGeoEdits } from '@/store/geoEdits';

export type Draft = { type: 'point' | 'line' | 'polygon'; pts: [number, number][] };

interface Props {
  item: TopoItem;
  place?: PlaceGeo;
  draft: Draft | null;
  setDraft: (d: Draft | null) => void;
}

/** Mentés / Visszavonás / Mégse – shown in the map toolbar while drawing, right above the map. */
export function DraftBar({ item, place, draft, setDraft }: Props) {
  const save = useGeoEdits((s) => s.save);
  if (!draft) return null;
  const commit = () => {
    const r = (p: [number, number]): [number, number] => [Math.round(p[0] * 1e4) / 1e4, Math.round(p[1] * 1e4) / 1e4];
    const pts = draft.pts.map(r);
    let geometry: Geometry;
    if (draft.type === 'point') geometry = { type: 'Point', coordinates: pts[0]! };
    else if (draft.type === 'line') geometry = { type: 'LineString', coordinates: pts };
    else geometry = { type: 'Polygon', coordinates: [[...pts, pts[0]!]] };
    // Moving the point of an area or a line only moves its label anchor.
    const kind = draft.type === 'point' && place && place.type !== 'point' ? 'anchor' : 'geometry';
    save(item.id, { kind, geometry, name: item.name });
    setDraft(null);
  };
  const ready = draft.type === 'point' ? draft.pts.length === 1 : draft.type === 'line' ? draft.pts.length >= 2 : draft.pts.length >= 3;
  return (
    <div className="row draft-bar" style={{ gap: 6 }} role="group" aria-label="Rajzolás">
      <span className="muted" style={{ fontSize: '0.85rem' }} aria-live="polite">
        {draft.type === 'point' ? (draft.pts.length ? 'Pont kijelölve' : 'Kattints az új helyre') : `${draft.pts.length} pont`}
      </span>
      <button type="button" className="btn small primary" disabled={!ready} onClick={commit}>
        Mentés
      </button>
      {draft.type !== 'point' && (
        <button type="button" className="btn small" disabled={!draft.pts.length} onClick={() => setDraft({ ...draft, pts: draft.pts.slice(0, -1) })}>
          <Undo2 size={14} /> Visszavonás
        </button>
      )}
      <button type="button" className="btn small" onClick={() => setDraft(null)}>
        Mégse
      </button>
    </div>
  );
}

export function MapEditor({ item, place, draft, setDraft }: Props) {
  const edits = useGeoEdits((s) => s.edits);
  const remove = useGeoEdits((s) => s.remove);
  const clear = useGeoEdits((s) => s.clear);
  const mine = edits[item.id];
  const n = Object.keys(edits).length;
  const start = (type: Draft['type']) => {
    setDraft({ type, pts: [] });
    // Bring the map back into view (on narrow screens the panel sits below it).
    const stage = document.querySelector('.map-stage');
    if (stage) window.scrollTo({ top: Math.max(0, stage.getBoundingClientRect().top + window.scrollY - 80) });
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(editsToGeoJSON(edits), null, 1)], { type: 'application/geo+json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `szerkeszto-javitasok-${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="editor-panel stack" style={{ gap: 8 }} aria-label="Térképszerkesztő">
      <strong>Térképszerkesztő</strong>
      {!draft ? (
        <>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            {place?.type === 'point' ? 'Kattints a pont új helyére.' : 'Áthelyezheted a jelölőt (horgonyt), vagy újrarajzolhatod az alakzatot pontonként kattintva.'}
          </p>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <button type="button" className="btn small" onClick={() => start('point')}>
              <MapPin size={14} /> {place?.type === 'point' ? 'Pont áthelyezése' : 'Jelölő áthelyezése'}
            </button>
            {place?.type !== 'point' && (
              <>
                <button type="button" className="btn small" onClick={() => start('line')}>
                  <PenLine size={14} /> Vonal rajzolása
                </button>
                <button type="button" className="btn small" onClick={() => start('polygon')}>
                  <Pentagon size={14} /> Terület rajzolása
                </button>
              </>
            )}
          </div>
          {mine && (
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Javítva ({mine.kind === 'anchor' ? 'jelölő' : 'alakzat'}, {mine.at.slice(0, 10)}){' '}
              <button type="button" className="link-btn" onClick={() => remove(item.id)}>
                visszaállítás
              </button>
            </p>
          )}
        </>
      ) : (
        <>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }} aria-live="polite">
            {draft.type === 'point' ? 'Kattints a térképen az új helyre, majd a térkép fölötti Mentés gombbal mentsd.' : 'Kattints a térképen a töréspontokra; a térkép fölötti sávban menthetsz vagy visszavonhatsz.'}
          </p>
        </>
      )}
      <div className="row muted" style={{ gap: 6, fontSize: '0.85rem', flexWrap: 'wrap' }}>
        {n} javítás összesen
        <button type="button" className="btn small" disabled={!n} onClick={download}>
          <Download size={14} /> Exportálás (.geojson)
        </button>
        <button type="button" className="btn small" disabled={!n} onClick={() => confirm('Biztosan törlöd az összes térképjavítást?') && clear()}>
          <Trash2 size={14} /> Mind törlése
        </button>
      </div>
    </section>
  );
}
