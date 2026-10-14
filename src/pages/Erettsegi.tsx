// Érettségi mode: exam-style "Mi ez? Írd be a nevét!" questions.
// Topográfia: one numbered place on the blank contour map of its region.
// Elmélet: a definition with the term masked.
// A name typed exactly right counts the item as learned (mastered); a wrong answer un-learns it.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, GraduationCap, Maximize2, Minus, Play, Plus, RotateCcw, X } from 'lucide-react';
import { PageHead } from '@/components/PageHead';
import { AtlasMap, type AtlasMapHandle } from '@/components/map/AtlasMap';
import { PlaceFactsBlock } from '@/components/PlaceFactsBlock';
import topo from '../../starter-data/topography.json';
import type { TopographyFile, TopoItem } from '@/data/types';
import { loadPlaces, viewFor, type PlaceGeo } from '@/data/geo';
import { loadConcepts, useLoad, type ConceptEntry } from '@/data/content';
import { TOPICS } from '@/data/requirements';
import { checkAnswer } from '@/lib/normalize';
import { statusOf } from '@/lib/srs';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

type Part = 'topo' | 'theory';

const PLACES = (topo as TopographyFile).items;
const REGIONS = [...new Set([...PLACES].sort((a, b) => a.regionNo - b.regionNo).map((p) => p.region))];

/** One question, whatever the part. */
interface Question {
  key: string; // srs id: place:<id> / concept:<id>
  answer: string;
  aliases: string[];
  others: string[];
  group: string; // region or topic label
  place?: TopoItem;
  entry?: ConceptEntry;
}
interface Outcome {
  q: Question;
  typed: string;
  result: 'ok' | 'almost' | 'wrong';
}

const shuffle = <T,>(a: T[]) => {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
};
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripParen = (s: string) => s.replace(/\s*\(.*?\)\s*/g, ' ').trim();

/** The definition with the term (and its aliases) hidden. */
function maskedDefinition(e: ConceptEntry) {
  const forms = [e.term, stripParen(e.term), ...(e.aliases ?? [])].filter((f) => f.length > 2).sort((a, b) => b.length - a.length);
  return forms.reduce((d, f) => d.replace(new RegExp(escapeRe(f), 'gi'), '…'), e.definition);
}

// ---------- question views ----------

function PlaceQuestion({ q, places, answered }: { q: Question; places: Record<string, PlaceGeo>; answered: boolean }) {
  const item = q.place!;
  const view = viewFor(item.region);
  const mapRef = useRef<AtlasMapHandle>(null);
  // Every question starts on the whole region, like the exam's contour map.
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.fitTo('all', 0), 60);
    return () => clearTimeout(t);
  }, [item.id]);
  return (
    <div className="quiz-map erettsegi-map">
      <AtlasMap
        ref={mapRef}
        view={view}
        items={[{ id: item.id, name: item.name, no: 1, capital: places[item.id]?.capital }]}
        places={places}
        selectedId={item.id}
        labels={answered ? 'selected' : 'none'}
        showNumbers
        ariaLabel={`${item.region} kontúrtérképe, rajta az 1-es számú hely`}
      />
      <div className="map-zoom-btns" role="group" aria-label="Nagyítás">
        <button type="button" className="icon-btn" aria-label="Nagyítás" onClick={() => mapRef.current?.zoomBy(1.6)}>
          <Plus size={18} />
        </button>
        <button type="button" className="icon-btn" aria-label="Kicsinyítés" onClick={() => mapRef.current?.zoomBy(1 / 1.6)}>
          <Minus size={18} />
        </button>
        <button type="button" className="icon-btn" aria-label="Teljes térkép" onClick={() => mapRef.current?.fitTo('all')}>
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}

// ---------- session ----------

function Session({ part, questions, places, onDone }: { part: Part; questions: Question[]; places: Record<string, PlaceGeo> | null; onDone: (o: Outcome[]) => void }) {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [current, setCurrent] = useState<Outcome | null>(null);
  const rate = useProgress((s) => s.rate);
  const markLearned = useProgress((s) => s.markLearned);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = questions[i];

  const sessionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setTyped('');
    // On phones the keyboard would cover the map: show the map first, type after a tap.
    if (window.matchMedia('(pointer: coarse)').matches) {
      const top = sessionRef.current?.getBoundingClientRect().top;
      if (top !== undefined) window.scrollTo({ top: Math.max(0, top + window.scrollY - 70) });
    } else inputRef.current?.focus({ preventScroll: true });
  }, [i]);

  const submit = (text: string) => {
    if (!q || current) return;
    const r = text.trim() ? checkAnswer(text, q.answer, q.aliases, q.others) : null;
    const result: Outcome['result'] = !r || !r.ok ? 'wrong' : r.kind === 'exact' ? 'ok' : 'almost';
    if (result === 'ok') markLearned(q.key);
    else rate(q.key, result === 'almost' ? 1 : 0);
    setCurrent({ q, typed: text, result });
  };
  const next = () => {
    if (!current) return;
    const all = [...outcomes, current];
    setOutcomes(all);
    setCurrent(null);
    if (i + 1 >= questions.length) onDone(all);
    else setI(i + 1);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && current) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!q) return null;
  const okSoFar = outcomes.filter((o) => o.result === 'ok').length;

  const panel = (
    <div className={`card stack ${part === 'topo' ? 'quiz-panel' : 'theory-q'}`} aria-live="polite">
      <p className="muted" style={{ margin: 0 }}>
        {q.group}
      </p>
      {part === 'theory' && <p className="concept-def">{maskedDefinition(q.entry!)}</p>}
      <h2 className="quiz-prompt">{part === 'topo' ? 'Mi az 1-es számmal jelölt hely? Írd be a nevét!' : 'Mi ez? Írd be a fogalom nevét!'}</h2>
      {!current ? (
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            submit(typed);
          }}
        >
          <input ref={inputRef} type="text" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label={part === 'topo' ? 'A hely neve' : 'A fogalom neve'} autoComplete="off" autoCapitalize="off" spellCheck={false} />
          <button type="submit" className="btn primary" disabled={!typed.trim()}>
            Ellenőrzés
          </button>
          <button type="button" className="btn" onClick={() => submit('')}>
            Nem tudom
          </button>
        </form>
      ) : (
        <div className="feedback">
          {current.result === 'ok' && (
            <p className="feedback-ok">
              <Check size={18} aria-hidden /> Helyes: <strong>{q.answer}</strong> – megtanultnak jelöltem.
            </p>
          )}
          {current.result === 'almost' && (
            <p className="feedback-warn">
              Majdnem! Helyesen: <strong>{q.answer}</strong>. Csak a pontosan (ékezettel együtt) beírt név számít megtanultnak.
            </p>
          )}
          {current.result === 'wrong' && (
            <p className="feedback-bad">
              <X size={18} aria-hidden /> {current.typed ? <>Nem: „{current.typed}”. </> : null}A helyes válasz: <strong>{q.answer}</strong>.
            </p>
          )}
          {q.place && <PlaceFactsBlock id={q.place.id} compact />}
          {q.entry && (
            <Link to={`/elmelet/fogalomtar/${q.entry.id}`} target="_blank">
              A fogalom a fogalomtárban
            </Link>
          )}
          <button type="button" className="btn primary" onClick={next} autoFocus>
            {i + 1 >= questions.length ? 'Eredmény' : 'Következő'} <kbd>Enter</kbd>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="quiz-session" ref={sessionRef}>
      <div className="quiz-bar">
        <div className="quiz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={i + 1} aria-label="Haladás">
          <span style={{ width: `${((i + (current ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        <span className="tabular">
          {i + 1} / {questions.length}
        </span>
        <span className="tabular muted">{okSoFar + (current?.result === 'ok' ? 1 : 0)} helyes</span>
      </div>
      {part === 'topo' ? (
        <div className="quiz-layout">
          {places ? <PlaceQuestion q={q} places={places} answered={!!current} /> : <div className="skeleton" style={{ aspectRatio: '1000 / 680' }} />}
          {panel}
        </div>
      ) : (
        panel
      )}
    </div>
  );
}

function Results({ outcomes, onRetry, onNew }: { outcomes: Outcome[]; onRetry: (keys: string[]) => void; onNew: () => void }) {
  const ok = outcomes.filter((o) => o.result === 'ok');
  const missed = outcomes.filter((o) => o.result !== 'ok');
  const pct = Math.round((ok.length / outcomes.length) * 100);
  return (
    <div className="card stack">
      <h2 style={{ margin: 0 }}>
        {ok.length} / {outcomes.length} helyes ({pct}%)
      </h2>
      <p style={{ margin: 0 }}>
        {ok.length > 0 ? `${ok.length} elemet megtanultnak jelöltem. ` : ''}
        {missed.length > 0 ? 'A hibásakat a Mai ismétlés is visszahozza.' : 'Hibátlan kör! 🎉'}
      </p>
      {missed.length > 0 && (
        <div>
          <strong>Ezeket nézd át:</strong>
          <ul className="weak-list">
            {missed.map((o) => (
              <li key={o.q.key}>
                {o.q.place ? <Link to={`/topografia/terkep?hely=${o.q.place.id}`}>{o.q.answer}</Link> : <Link to={`/elmelet/fogalomtar/${o.q.entry!.id}`}>{o.q.answer}</Link>}
                <span className="muted"> – {o.typed ? `ezt írtad: „${o.typed}”` : 'nem tudtad'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="row">
        {missed.length > 0 && (
          <button type="button" className="btn primary" onClick={() => onRetry(missed.map((o) => o.q.key))}>
            <RotateCcw size={16} /> Hibásak újra
          </button>
        )}
        <button type="button" className="btn" onClick={onNew}>
          Új kör
        </button>
      </div>
    </div>
  );
}

// ---------- page ----------

export default function Erettsegi({ part }: { part: Part }) {
  const srs = useProgress((s) => s.srs);
  const levelPref = useSettings((s) => s.levelFilter);
  const concepts = useLoad(loadConcepts);
  const [places, setPlaces] = useState<Record<string, PlaceGeo> | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [count, setCount] = useState<number>(20);
  const [includeLearned, setIncludeLearned] = useState(false);
  const [level, setLevel] = useState<'all' | 'emelt'>(levelPref);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [round, setRound] = useState(0);
  const [outcomes, setOutcomes] = useState<Outcome[] | null>(null);

  useEffect(() => {
    if (part === 'topo') void loadPlaces().then(setPlaces);
  }, [part]);
  // Switching between Topográfia and Elmélet starts over.
  useEffect(() => {
    setGroups([]);
    setQuestions(null);
    setOutcomes(null);
  }, [part]);

  // Every askable item of this part, with its group (region / topic).
  const all: Question[] = useMemo(() => {
    if (part === 'topo') {
      return PLACES.filter((p) => level === 'all' || p.level === 'emelt').map((p) => ({
        key: `place:${p.id}`,
        answer: p.name,
        aliases: [],
        others: PLACES.filter((o) => o.region === p.region && o.id !== p.id).map((o) => o.name),
        group: p.region,
        place: p,
      }));
    }
    const entries = (concepts?.entries ?? []).filter((e) => !e.parent && e.definition && stripParen(e.term).length <= 40 && (level === 'all' || e.level === 'emelt'));
    return entries.map((e) => ({
      key: `concept:${e.id}`,
      answer: e.term,
      aliases: [...new Set([stripParen(e.term), ...(e.aliases ?? [])])].filter((a) => a !== e.term),
      others: entries.filter((o) => o.topicNo === e.topicNo && o.id !== e.id).map((o) => o.term),
      group: `${e.topicNo}. ${TOPICS[e.topicNo]}`,
      entry: e,
    }));
  }, [part, level, concepts]);

  const groupList = part === 'topo' ? REGIONS : Object.entries(TOPICS).map(([n, t]) => `${n}. ${t}`);
  const learned = (q: Question) => statusOf(srs[q.key]) === 'mastered';
  const stats = (g?: string) => {
    const list = g ? all.filter((q) => q.group === g) : all;
    return { done: list.filter(learned).length, total: list.length };
  };
  const selected = all.filter((q) => !groups.length || groups.includes(q.group));
  const askable = includeLearned ? selected : selected.filter((q) => !learned(q));

  const start = (only?: string[]) => {
    const pool = only ? all.filter((q) => only.includes(q.key)) : askable;
    setQuestions(shuffle(pool).slice(0, only ? pool.length : count || pool.length));
    setOutcomes(null);
    setRound((r) => r + 1);
  };
  const total = stats();
  const sel = { done: selected.filter(learned).length, total: selected.length };

  return (
    <>
      <PageHead
        eyebrow={part === 'topo' ? 'Topográfia' : 'Elmélet'}
        title="Érettségi"
        lead={
          part === 'topo'
            ? 'Mint az érettségin: a kontúrtérképen egy számmal jelölt helyet kell felismerned és pontosan beírnod a nevét. Ami jó, azt megtanultnak veszi a rendszer.'
            : 'Mint az érettségin: a meghatározás alapján írd be a fogalom pontos nevét. Ami jó, azt megtanultnak veszi a rendszer.'
        }
      />

      {!questions && (
        <form
          className="card stack quiz-setup"
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          <div className="row erettsegi-total">
            <GraduationCap size={22} aria-hidden />
            <strong className="tabular">
              {total.done} / {total.total} megtanulva
            </strong>
            <div className="quiz-progress" style={{ flex: 1, minWidth: 120 }} aria-hidden>
              <span style={{ width: `${total.total ? (total.done / total.total) * 100 : 0}%` }} />
            </div>
          </div>
          <fieldset>
            <legend>{part === 'topo' ? 'Melyik földrészből? (üres = mindegyikből)' : 'Melyik témakörből? (üres = mindegyikből)'}</legend>
            <div className="chip-row">
              <button type="button" className={`chip${!groups.length ? ' selected' : ''}`} aria-pressed={!groups.length} onClick={() => setGroups([])}>
                Mindegyik
              </button>
              {groupList.map((g) => {
                const st = stats(g);
                const on = groups.includes(g);
                return (
                  <button key={g} type="button" className={`chip${on ? ' selected' : ''}`} aria-pressed={on} onClick={() => setGroups(on ? groups.filter((x) => x !== g) : [...groups, g])} title={g}>
                    {g.length > 36 ? `${g.slice(0, 34)}…` : g}{' '}
                    <span className="tabular muted">
                      {st.done}/{st.total}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <label className="row" style={{ gap: 6 }}>
              Kérdések
              <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                <option value={0}>Mind ({askable.length})</option>
              </select>
            </label>
            <label className="row" style={{ gap: 6 }}>
              Szint
              <select value={level} onChange={(e) => setLevel(e.target.value as 'all' | 'emelt')}>
                <option value="all">Mind</option>
                <option value="emelt">Csak emelt</option>
              </select>
            </label>
            <label className="row" style={{ gap: 6 }}>
              <input type="checkbox" checked={includeLearned} onChange={(e) => setIncludeLearned(e.target.checked)} /> A már megtanultakat is kérdezze
            </label>
          </div>
          <div className="row">
            <button type="submit" className="btn primary" disabled={!askable.length || (part === 'topo' && !places)}>
              <Play size={16} /> Indítás
            </button>
            <span className="muted tabular">
              A válogatásban: {sel.done}/{sel.total} megtanulva
              {!askable.length && sel.total > 0 ? ' – mind megvan! Pipáld be, hogy a megtanultakat is kérdezze.' : ''}
            </span>
          </div>
        </form>
      )}

      {questions && !outcomes && <Session key={round} part={part} questions={questions} places={places} onDone={setOutcomes} />}
      {questions && outcomes && <Results outcomes={outcomes} onRetry={(keys) => start(keys)} onNew={() => (setQuestions(null), setOutcomes(null))} />}
    </>
  );
}
