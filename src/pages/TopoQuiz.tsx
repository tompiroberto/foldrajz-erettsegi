import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { geoContains } from 'd3-geo';
import type { Feature, Position } from 'geojson';
import { Check, Clock, Flame, MapPin, Play, RotateCcw, X } from 'lucide-react';
import topo from '../../starter-data/topography.json';
import type { TopographyFile, TopoItem } from '@/data/types';
import { REGION_VIEWS, formatCoord, loadBase, loadItems, loadPlaces, viewFor, type PlaceGeo } from '@/data/geo';
import { PlaceFactsBlock } from '@/components/PlaceFactsBlock';
import { AtlasMap, MAP_H, MAP_W, type AtlasMapHandle } from '@/components/map/AtlasMap';
import { PageHead } from '@/components/PageHead';
import { ExamPractice } from '@/components/exam/ExamPractice';
import { checkAnswer, type CheckResult } from '@/lib/normalize';
import { rngFrom } from '@/lib/calc/core';
import { buildTopoQuiz, kmBetween, QTYPE_LABEL, type TopoQType, type TopoQuestion } from '@/lib/quiz/topo';
import { gradeFromAnswer } from '@/lib/srs';
import { itemId, useProgress } from '@/store/progress';
import type { ExamTaskRef } from '@/data/exams';

const ALL = (topo as TopographyFile).items;
const BY_ID = new Map(ALL.map((i) => [i.id, i]));
const topoTasks = (t: ExamTaskRef) => t.places.length > 0;

type Timer = 'off' | '10s' | 'exam';
interface Setup {
  region: string;
  cats: string[];
  level: 'all' | 'emelt';
  count: number;
  timer: Timer;
  types: TopoQType[];
  only?: string[];
}

interface Outcome {
  q: TopoQuestion;
  /** Per-item results (a sheet has many rows). */
  rows: { id: string; ok: boolean; warn?: string; given?: string; km?: number }[];
}

// ---------- hit testing for "Hol van?" ----------

function distToSegment(p: [number, number], a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

export function hitTest(map: AtlasMapHandle, place: PlaceGeo, geom: Feature | undefined, click: [number, number]): { ok: boolean; km: number } {
  const screen = map.toScreen(click);
  const anchorScreen = map.toScreen(place.anchor);
  const km = Math.round(kmBetween(click, place.anchor));
  if (!screen || !anchorScreen) return { ok: false, km };
  if (place.type === 'point' || !geom) return { ok: Math.hypot(screen[0] - anchorScreen[0], screen[1] - anchorScreen[1]) <= 18, km };
  if (place.type === 'line') {
    const g = geom.geometry;
    const lines: Position[][] = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
    let best = Infinity;
    for (const line of lines) {
      for (let i = 1; i < line.length; i++) {
        const a = map.toScreen(line[i - 1] as [number, number]);
        const b = map.toScreen(line[i] as [number, number]);
        if (a && b) best = Math.min(best, distToSegment(screen, a, b));
      }
    }
    return { ok: best <= 16, km: best <= 16 ? 0 : km };
  }
  if (geoContains(geom, click)) return { ok: true, km: 0 };
  // Small areas: close enough to the label point counts.
  return { ok: Math.hypot(screen[0] - anchorScreen[0], screen[1] - anchorScreen[1]) <= 22, km };
}

// ---------- setup ----------

function SetupForm({ initial, onStart }: { initial: Setup; onStart: (s: Setup) => void }) {
  const [s, setS] = useState<Setup>(initial);
  const regionItems = ALL.filter((i) => i.region === s.region);
  const cats = [...new Set(regionItems.map((i) => i.category))];
  const pool = regionItems.filter((i) => (!s.cats.length || s.cats.includes(i.category)) && (s.level === 'all' || i.level === 'emelt'));
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <form
      className="card stack quiz-setup"
      onSubmit={(e) => {
        e.preventDefault();
        if (pool.length && s.types.length) onStart(s);
      }}
    >
      <fieldset>
        <legend>Régió</legend>
        <div className="chip-row">
          {REGION_VIEWS.map((v) => (
            <button key={v.region} type="button" className={`chip${v.region === s.region ? ' selected' : ''}`} aria-pressed={v.region === s.region} onClick={() => setS({ ...s, region: v.region, cats: [] })}>
              {v.region}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Kategória (üres = mind)</legend>
        <div className="chip-row">
          {cats.map((c) => (
            <button key={c} type="button" className={`chip${s.cats.includes(c) ? ' selected' : ''}`} aria-pressed={s.cats.includes(c)} onClick={() => setS({ ...s, cats: toggle(s.cats, c) })}>
              {c}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Kérdéstípus</legend>
        <div className="stack" style={{ gap: 6 }}>
          {(Object.keys(QTYPE_LABEL) as TopoQType[]).map((t) => (
            <label key={t} className="row" style={{ gap: 8 }}>
              <input type="checkbox" checked={s.types.includes(t)} onChange={() => setS({ ...s, types: toggle(s.types, t) })} /> {QTYPE_LABEL[t]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="row">
        <label className="row" style={{ gap: 6 }}>
          Szint
          <select value={s.level} onChange={(e) => setS({ ...s, level: e.target.value as Setup['level'] })}>
            <option value="all">Mind</option>
            <option value="emelt">Csak emelt</option>
          </select>
        </label>
        <label className="row" style={{ gap: 6 }}>
          Kérdések
          <select value={s.count} onChange={(e) => setS({ ...s, count: Number(e.target.value) })}>
            {[10, 20, 40, 999].map((n) => (
              <option key={n} value={n}>
                {n === 999 ? 'mind' : n}
              </option>
            ))}
          </select>
        </label>
        <label className="row" style={{ gap: 6 }}>
          Időzítő
          <select value={s.timer} onChange={(e) => setS({ ...s, timer: e.target.value as Timer })}>
            <option value="off">nincs</option>
            <option value="10s">10 mp / kérdés</option>
            <option value="exam">vizsgaszerű (30 mp / név)</option>
          </select>
        </label>
      </div>
      <div className="row">
        <button type="submit" className="btn primary" disabled={!pool.length || !s.types.length}>
          <Play size={16} /> Indítás
        </button>
        <span className="muted tabular">{pool.length} név a válogatásban</span>
      </div>
    </form>
  );
}

// ---------- session ----------

function Session({ setup, onDone }: { setup: Setup; onDone: (o: Outcome[], seconds: number) => void }) {
  const view = viewFor(setup.region);
  const mapRef = useRef<AtlasMapHandle>(null);
  const [places, setPlaces] = useState<Record<string, PlaceGeo> | null>(null);
  const [geoms, setGeoms] = useState<Map<string, Feature> | null>(null);
  const [questions, setQuestions] = useState<TopoQuestion[] | null>(null);
  const [i, setI] = useState(0);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [current, setCurrent] = useState<Outcome | null>(null);
  const [typed, setTyped] = useState('');
  const [sheet, setSheet] = useState<Record<string, string>>({});
  const [click, setClick] = useState<[number, number] | null>(null);
  const [streak, setStreak] = useState(0);
  const [left, setLeft] = useState<number | null>(null);
  const started = useRef(Date.now());
  const rate = useProgress((s) => s.rate);

  const pool = useMemo(
    () =>
      ALL.filter(
        (it) =>
          it.region === setup.region &&
          (!setup.cats.length || setup.cats.includes(it.category)) &&
          (setup.level === 'all' || it.level === 'emelt') &&
          (!setup.only || setup.only.includes(it.id)),
      ),
    [setup],
  );
  const poolNames = useMemo(() => ALL.filter((i) => i.region === setup.region).map((i) => i.name), [setup.region]);

  useEffect(() => {
    void Promise.all([loadPlaces(), loadBase(view.base), loadItems(view.slug)]).then(([p, b, g]) => {
      setPlaces(p);
      setGeoms(g);
      setQuestions(buildTopoQuiz(pool, p, { types: setup.types, count: setup.count, rng: rngFrom(Date.now() % 1e9), ctx: { base: b, geoms: g } }));
    });
  }, [pool, setup, view]);

  const q = questions?.[i];
  const qIds = q ? (q.kind === 'feladatlap' ? q.ids : [q.id]) : [];

  // Frame the map for each question.
  useEffect(() => {
    if (!q || !places) return;
    setTyped('');
    setSheet({});
    setClick(null);
    const t = setTimeout(() => {
      if (q.kind === 'holvan') mapRef.current?.fitTo('all', 0);
      else mapRef.current?.fitTo(q.kind === 'feladatlap' ? q.ids : [q.id]);
    }, 80);
    return () => clearTimeout(t);
  }, [q, places]);

  const finish = useCallback(
    (o: Outcome) => {
      setCurrent(o);
      const allOk = o.rows.every((r) => r.ok);
      setStreak((s) => (allOk ? s + 1 : 0));
      for (const r of o.rows) rate(itemId('place', r.id), gradeFromAnswer(r.ok, !!r.warn));
    },
    [rate],
  );

  // Timer.
  useEffect(() => {
    if (!q || current || setup.timer === 'off') return setLeft(null);
    const secs = setup.timer === '10s' ? 10 : 30 * (q.kind === 'feladatlap' ? q.ids.length : 1);
    setLeft(secs);
    const t = setInterval(() => setLeft((l) => (l == null ? l : l - 1)), 1000);
    return () => clearInterval(t);
  }, [q, current, setup.timer]);

  const submit = useCallback(() => {
    if (!q || current || !places) return;
    if (q.kind === 'holvan') {
      const pl = places[q.id];
      if (!pl || !mapRef.current) return;
      const r = click ? hitTest(mapRef.current, pl, geoms?.get(q.id), click) : { ok: false, km: 0 };
      finish({ q, rows: [{ id: q.id, ok: r.ok, km: click ? r.km : undefined }] });
    } else if (q.kind === 'beiros') {
      const it = BY_ID.get(q.id)!;
      const r: CheckResult = checkAnswer(typed, it.name, [], poolNames);
      finish({ q, rows: [{ id: q.id, ok: r.ok, given: typed, warn: r.ok && r.kind !== 'exact' ? (r.kind === 'accent' ? 'ékezet' : 'elírás') : undefined }] });
    } else if (q.kind === 'feladatlap') {
      finish({
        q,
        rows: q.ids.map((id) => {
          const r = checkAnswer(sheet[id] ?? '', BY_ID.get(id)!.name, [], poolNames);
          return { id, ok: r.ok, given: sheet[id] ?? '', warn: r.ok && r.kind !== 'exact' ? (r.kind === 'accent' ? 'ékezet' : 'elírás') : undefined };
        }),
      });
    }
  }, [q, current, places, click, geoms, typed, sheet, poolNames, finish]);

  const choose = useCallback(
    (opt: string) => {
      if (!q || current) return;
      if (q.kind === 'valasztos') finish({ q, rows: [{ id: q.id, ok: opt === q.id, given: BY_ID.get(opt)?.name }] });
      if (q.kind === 'fekves') finish({ q, rows: [{ id: q.id, ok: opt === q.answer, given: opt }] });
    },
    [q, current, finish],
  );

  useEffect(() => {
    if (left === 0 && !current) submit();
    if (left === 0 && !current && q && (q.kind === 'valasztos' || q.kind === 'fekves')) choose('');
  }, [left, current, submit, choose, q]);

  const next = useCallback(() => {
    if (!current || !questions) return;
    const all = [...outcomes, current];
    setOutcomes(all);
    setCurrent(null);
    if (i + 1 >= questions.length) onDone(all, Math.round((Date.now() - started.current) / 1000));
    else setI(i + 1);
  }, [current, questions, outcomes, i, onDone]);

  // Keyboard: Enter submits / next, 1–4 choose.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === 'Enter' && current) {
        e.preventDefault();
        next();
      } else if (e.key === 'Enter' && q?.kind === 'holvan' && click) {
        e.preventDefault();
        submit();
      } else if (!current && tag !== 'INPUT' && ['1', '2', '3', '4'].includes(e.key) && q && (q.kind === 'valasztos' || q.kind === 'fekves')) {
        const opt = q.options[Number(e.key) - 1];
        if (opt) choose(opt);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, next, q, click, submit, choose]);

  // Keyboard crosshair for "Hol van?": arrow keys move the mark on the focused map.
  const onMapKey = (e: React.KeyboardEvent) => {
    if (q?.kind !== 'holvan' || current || !mapRef.current) return;
    const step = e.shiftKey ? 40 : 10;
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (!d[e.key]) return;
    e.preventDefault();
    const from = click ? mapRef.current.toScreen(click) : ([MAP_W / 2, MAP_H / 2] as [number, number]);
    if (!from) return;
    const ll = mapRef.current.toLonLat([from[0] + d[e.key]![0], from[1] + d[e.key]![1]]);
    if (ll) setClick(ll);
  };

  if (!questions || !places) return <div className="skeleton" style={{ height: 420 }} aria-busy="true" />;
  if (!questions.length) return <p className="placeholder">Ebből a válogatásból nem lehet kérdést készíteni. Válassz többet!</p>;
  if (!q) return null;

  const item = q.kind !== 'feladatlap' ? BY_ID.get(q.id) : undefined;
  const reveal = !!current;
  const mapIds = q.kind === 'holvan' ? (reveal ? [q.id] : []) : qIds;
  const missedRows = current?.rows.filter((r) => !r.ok) ?? [];

  return (
    <div className="quiz-session">
      <div className="quiz-bar">
        <div className="quiz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={i + 1} aria-label="Haladás">
          <span style={{ width: `${((i + (current ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        <span className="tabular">
          {i + 1} / {questions.length}
        </span>
        {streak >= 2 && (
          <span className="streak" title="Sorozat">
            <Flame size={16} aria-hidden /> {streak}
          </span>
        )}
        {left != null && (
          <span className={`tabular timer${left <= 3 ? ' is-low' : ''}`}>
            <Clock size={15} aria-hidden /> {left} mp
          </span>
        )}
      </div>

      <div className="quiz-layout">
        <div className="quiz-map" onKeyDown={onMapKey} tabIndex={q.kind === 'holvan' ? 0 : -1} aria-label={q.kind === 'holvan' ? 'Térkép: nyilakkal mozgathatod a jelölést, Enterrel véglegesítheted' : undefined}>
          <AtlasMap
            ref={mapRef}
            view={view}
            items={mapIds.map((id, n) => ({ id, name: BY_ID.get(id)?.name ?? id, no: q.kind === 'feladatlap' ? n + 1 : undefined, capital: places[id]?.capital }))}
            places={places}
            selectedId={q.kind === 'feladatlap' ? null : reveal || q.kind !== 'holvan' ? q.id : null}
            labels={reveal && q.kind !== 'feladatlap' ? 'selected' : 'none'}
            showNumbers={q.kind === 'feladatlap'}
            onMapClick={q.kind === 'holvan' && !reveal ? (ll) => setClick(ll) : undefined}
            marker={q.kind === 'holvan' ? click : null}
            ariaLabel="Kvíz vaktérkép"
          />
        </div>

        <div className="quiz-panel card" aria-live="polite">
          <p className="muted" style={{ margin: 0 }}>
            {QTYPE_LABEL[q.kind]}
          </p>
          {q.kind === 'holvan' && item && (
            <>
              <h2 className="quiz-prompt">Hol van: {item.name}?</h2>
              {!reveal && (
                <>
                  <p className="muted">Koppints a térképre (nagyíthatsz is), majd erősítsd meg.</p>
                  <button type="button" className="btn primary" disabled={!click} onClick={submit}>
                    <MapPin size={16} /> Ide jelölöm
                  </button>
                </>
              )}
            </>
          )}
          {q.kind === 'beiros' && (
            <>
              <h2 className="quiz-prompt">Mi a kiemelt hely neve?</h2>
              {!reveal && (
                <form
                  className="row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                >
                  <input type="text" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="A hely neve" autoComplete="off" spellCheck={false} />
                  <button type="submit" className="btn primary">
                    Ellenőrzés
                  </button>
                </form>
              )}
            </>
          )}
          {(q.kind === 'valasztos' || q.kind === 'fekves') && (
            <>
              <h2 className="quiz-prompt">{q.kind === 'fekves' ? q.prompt : 'Mi a kiemelt hely neve?'}</h2>
              <div className="answer-grid">
                {q.options.map((opt, n) => {
                  const label = q.kind === 'valasztos' ? BY_ID.get(opt)?.name : opt;
                  const correct = q.kind === 'valasztos' ? opt === q.id : opt === q.answer;
                  const picked = current?.rows[0]?.given === label;
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`answer-btn${reveal && correct ? ' is-ok' : ''}${reveal && picked && !correct ? ' is-bad' : ''}`}
                      disabled={reveal}
                      onClick={() => choose(opt)}
                    >
                      <kbd>{n + 1}</kbd> {label}
                      {reveal && correct && <Check size={18} aria-label="helyes" />}
                      {reveal && picked && !correct && <X size={18} aria-label="hibás" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {q.kind === 'feladatlap' && (
            <>
              <h2 className="quiz-prompt">Írd be a számokkal jelölt nevek helyét! ({q.category})</h2>
              <form
                className="sheet"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                {q.ids.map((id, n) => {
                  const row = current?.rows.find((r) => r.id === id);
                  return (
                    <label key={id} className={`sheet-row${row ? (row.ok ? ' is-ok' : ' is-bad') : ''}`}>
                      <span className="num-chip tabular">{n + 1}</span>
                      <input type="text" value={sheet[id] ?? ''} disabled={reveal} onChange={(e) => setSheet((s) => ({ ...s, [id]: e.target.value }))} aria-label={`${n + 1}. név`} autoComplete="off" spellCheck={false} />
                      {row && (row.ok ? <Check size={16} className="feedback-ok" aria-label="helyes" /> : <span className="feedback-bad">{BY_ID.get(id)?.name}</span>)}
                    </label>
                  );
                })}
                {!reveal && (
                  <button type="submit" className="btn primary">
                    Beadom a lapot
                  </button>
                )}
              </form>
            </>
          )}

          {current && (
            <div className="feedback">
              {q.kind === 'feladatlap' ? (
                <p className={missedRows.length ? 'feedback-bad' : 'feedback-ok'}>
                  {current.rows.length - missedRows.length} / {current.rows.length} sor helyes.
                </p>
              ) : current.rows[0]!.ok ? (
                <p className="feedback-ok">
                  <Check size={18} aria-hidden /> Helyes!{current.rows[0]!.warn === 'ékezet' && <> Ékezet hiányzik: <strong>{item?.name}</strong>.</>}
                  {current.rows[0]!.warn === 'elírás' && <> Elírás – helyesen: <strong>{item?.name}</strong>.</>}
                </p>
              ) : (
                <p className="feedback-bad">
                  <X size={18} aria-hidden /> {q.kind === 'fekves' ? `Helyesen: ${q.answer}` : <>Ez <strong>{item?.name}</strong>.</>}
                  {q.kind === 'holvan' && current.rows[0]!.km != null && ` A jelölésed kb. ${current.rows[0]!.km} km-re volt.`}
                </p>
              )}
              {q.kind === 'fekves' && <p className="muted">{q.explain}</p>}
              {item && q.kind !== 'feladatlap' && <PlaceFactsBlock id={item.id} compact />}
              {item && places[item.id] && q.kind !== 'fekves' && (
                <p className="muted" style={{ margin: 0 }}>
                  {item.category} · {formatCoord(places[item.id]!.anchor)} ·{' '}
                  <Link to={`/topografia/terkep?hely=${encodeURIComponent(item.id)}`}>Megnyitás a térképen</Link>
                </p>
              )}
              <button type="button" className="btn primary" onClick={next} autoFocus>
                {i + 1 >= questions.length ? 'Eredmények' : 'Következő'} <kbd>Enter</kbd>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- results ----------

function Results({ setup, outcomes, seconds, onRetry, onNew }: { setup: Setup; outcomes: Outcome[]; seconds: number; onRetry: (ids: string[]) => void; onNew: () => void }) {
  const rows = outcomes.flatMap((o) => o.rows);
  const ok = rows.filter((r) => r.ok).length;
  const byCat = new Map<string, { ok: number; all: number }>();
  for (const r of rows) {
    const c = BY_ID.get(r.id)?.category ?? '?';
    const e = byCat.get(c) ?? { ok: 0, all: 0 };
    e.all++;
    if (r.ok) e.ok++;
    byCat.set(c, e);
  }
  const weakest = [...byCat.entries()].sort((a, b) => a[1].ok / a[1].all - b[1].ok / b[1].all)[0];
  const missed = rows.filter((r) => !r.ok).map((r) => r.id);
  const [places, setPlaces] = useState<Record<string, PlaceGeo> | null>(null);
  const mapRef = useRef<AtlasMapHandle>(null);
  useEffect(() => void loadPlaces().then(setPlaces), []);
  useEffect(() => {
    if (places && missed.length) setTimeout(() => mapRef.current?.fitTo(missed), 150);
  }, [places]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="card stack">
        <h2 style={{ margin: 0 }}>
          {ok === rows.length ? 'Hibátlan! 🎉' : 'Szép!'} {ok}/{rows.length}
          {weakest && weakest[1].ok < weakest[1].all ? ` – a(z) ${weakest[0]} még csiszolható.` : ''}
        </h2>
        <p className="muted tabular" style={{ margin: 0 }}>
          Idő: {Math.floor(seconds / 60)} perc {seconds % 60} mp
        </p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Kategória</th>
              <th>Pontosság</th>
            </tr>
          </thead>
          <tbody>
            {[...byCat.entries()].map(([c, e]) => (
              <tr key={c}>
                <th scope="row">{c}</th>
                <td className="tabular">
                  {e.ok}/{e.all} ({Math.round((e.ok / e.all) * 100)}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row">
          {missed.length > 0 && (
            <button type="button" className="btn primary" onClick={() => onRetry(missed)}>
              <RotateCcw size={16} /> Csak a hibásakat újra ({missed.length})
            </button>
          )}
          <button type="button" className="btn" onClick={onNew}>
            Új kvíz
          </button>
        </div>
      </div>
      {missed.length > 0 && places && (
        <section className="stack">
          <h2>A hibáid térképen</h2>
          <AtlasMap
            ref={mapRef}
            view={viewFor(setup.region)}
            items={missed.map((id, n) => ({ id, name: BY_ID.get(id)?.name ?? id, no: n + 1 }))}
            places={places}
            labels="all"
            ariaLabel="A hibás válaszok helye"
          />
          <ol className="missed-list">
            {missed.map((id) => (
              <li key={id}>
                <Link to={`/topografia/terkep?hely=${encodeURIComponent(id)}`}>{BY_ID.get(id)?.name}</Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

export default function TopoQuiz() {
  const [params] = useSearchParams();
  const focus = params.get('hely');
  const focusItem: TopoItem | undefined = focus ? BY_ID.get(focus) : undefined;
  const [setup, setSetup] = useState<Setup | null>(null);
  const [result, setResult] = useState<{ outcomes: Outcome[]; seconds: number } | null>(null);
  const [runId, setRunId] = useState(0);
  const initial: Setup = {
    region: focusItem?.region ?? params.get('regio') ?? 'Magyarország',
    cats: focusItem ? [focusItem.category] : [],
    level: 'all',
    count: 10,
    timer: 'off',
    types: ['holvan', 'beiros', 'valasztos'],
  };

  return (
    <>
      <PageHead eyebrow="Topográfia" title="Kvíz" lead="Hol van? · Mi ez? · Kontúrtérképes feladatlap · Fekvés-kérdések – a vaktérképen, mint a vizsgán." />
      {!setup && !result && <SetupForm initial={initial} onStart={(s) => (setSetup(s), setRunId((r) => r + 1))} />}
      {setup && !result && <Session key={runId} setup={setup} onDone={(outcomes, seconds) => setResult({ outcomes, seconds })} />}
      {setup && result && (
        <Results
          setup={setup}
          outcomes={result.outcomes}
          seconds={result.seconds}
          onRetry={(ids) => {
            setSetup({ ...setup, only: ids, count: ids.length, cats: [] });
            setResult(null);
            setRunId((r) => r + 1);
          }}
          onNew={() => {
            setSetup(null);
            setResult(null);
          }}
        />
      )}
      {!setup && (
        <div style={{ marginTop: 32 }}>
          <ExamPractice title="Érettségi feladatok helynevekkel" filter={topoTasks} />
        </div>
      )}
    </>
  );
}
