// Mai ismétlés (brief §6.8): the due items of every kind first, then new ones up to the daily goal.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, Flame, X } from 'lucide-react';
import { PageHead } from '@/components/PageHead';
import { PlaceFactsBlock } from '@/components/PlaceFactsBlock';
import { AtlasMap } from '@/components/map/AtlasMap';
import topo from '../../starter-data/topography.json';
import type { TopographyFile, TopoItem } from '@/data/types';
import { loadPlaces, viewFor, type PlaceGeo } from '@/data/geo';
import { loadCards, loadConcepts, loadProcess, type Card, type ConceptEntry, type ProcessContent } from '@/data/content';
import { OBJECTIVES } from '@/data/requirements';
import { PROCESSES } from '@/content/catalog';
import { checkAnswer } from '@/lib/normalize';
import { rngFrom } from '@/lib/calc/core';
import { generatorById } from '@/lib/calc/generators';
import { gradeFromAnswer, isDue, startOfDay, type Grade } from '@/lib/srs';
import { dayKey, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { Calc, Order } from './TheoryQuiz';

const PLACES = (topo as TopographyFile).items;
const PLACE_BY_ID = new Map(PLACES.map((p) => [p.id, p]));
const OBJ_BY_ID = new Map(OBJECTIVES.map((o) => [o.id, o]));

type QueueItem =
  | { kind: 'place'; key: string; item: TopoItem; isNew: boolean }
  | { kind: 'concept'; key: string; entry: ConceptEntry; isNew: boolean }
  | { kind: 'card'; key: string; objectiveId: string; card: Card; isNew: boolean }
  | { kind: 'process'; key: string; process: ProcessContent; isNew: boolean }
  | { kind: 'calc'; key: string; generator: string; isNew: boolean };

const KIND_LABEL: Record<QueueItem['kind'], string> = {
  place: 'Topográfia',
  concept: 'Fogalom',
  card: 'Tanulókártya',
  process: 'Folyamat',
  calc: 'Számolás',
};

/** Deterministic daily shuffle so a reload keeps the same order. */
function shuffleDay<T>(arr: T[], seed: number): T[] {
  const rng = rngFrom(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

async function buildQueue(srs: ReturnType<typeof useProgress.getState>['srs'], goal: number, level: 'all' | 'emelt'): Promise<QueueItem[]> {
  const now = Date.now();
  const seed = startOfDay(now) / 86_400_000;
  const [concepts, cards] = await Promise.all([loadConcepts(), loadCards()]);
  const conceptById = concepts.byId;
  const out: QueueItem[] = [];

  // 1. Due items, most overdue first.
  const due = Object.entries(srs)
    .filter(([, s]) => isDue(s, now))
    .sort((a, b) => a[1].due - b[1].due);
  for (const [key] of due) {
    const [kind, ...rest] = key.split(':');
    const id = rest.join(':');
    if (kind === 'place' && PLACE_BY_ID.has(id)) out.push({ kind: 'place', key, item: PLACE_BY_ID.get(id)!, isNew: false });
    else if (kind === 'concept' && conceptById.has(id)) out.push({ kind: 'concept', key, entry: conceptById.get(id)!, isNew: false });
    else if (kind === 'card' && cards.has(id)) {
      const card = cards.get(id)!;
      if (card.selfCheck.length) out.push({ kind: 'card', key, objectiveId: id, card, isNew: false });
    } else if (kind === 'process') {
      const p = await loadProcess(id);
      if (p) out.push({ kind: 'process', key, process: p, isNew: false });
    } else if (kind === 'calc' && generatorById(id)) out.push({ kind: 'calc', key, generator: id, isNew: false });
  }

  // 2. New items to fill the goal: places and concepts alternately, középszint first.
  const room = Math.max(0, goal - out.length);
  if (room > 0) {
    const lvOk = (l: string) => level === 'all' || l === 'emelt';
    const rank = (l: string) => (l === 'kozep' ? 0 : 1);
    const newPlaces = shuffleDay(PLACES.filter((p) => !srs[`place:${p.id}`] && lvOk(p.level)), seed).sort((a, b) => rank(a.level) - rank(b.level) || a.regionNo - b.regionNo);
    const newConcepts = shuffleDay(concepts.entries.filter((e) => !e.parent && !srs[`concept:${e.id}`] && lvOk(e.level)), seed + 1).sort((a, b) => rank(a.level) - rank(b.level) || a.topicNo - b.topicNo);
    // Keep the new places of one session in one region so the map does not jump around.
    const region = newPlaces[0]?.region;
    const placesPick = newPlaces.filter((p) => p.region === region).slice(0, Math.ceil(room / 2));
    const conceptPick = newConcepts.slice(0, room - placesPick.length);
    const fresh: QueueItem[] = [
      ...placesPick.map((item) => ({ kind: 'place' as const, key: `place:${item.id}`, item, isNew: true })),
      ...conceptPick.map((entry) => ({ kind: 'concept' as const, key: `concept:${entry.id}`, entry, isNew: true })),
    ];
    out.push(...shuffleDay(fresh, seed + 2));
  }
  return out;
}

// ---------- renderers ----------

function PlaceReview({ item, onDone }: { item: TopoItem; onDone: (ok: boolean, warn?: boolean) => void }) {
  const [places, setPlaces] = useState<Record<string, PlaceGeo> | null>(null);
  const [typed, setTyped] = useState('');
  const [res, setRes] = useState<{ ok: boolean; warn: boolean } | null>(null);
  useEffect(() => void loadPlaces().then(setPlaces), []);
  const view = viewFor(item.region);
  return (
    <div className="review-place">
      <div className="quiz-map">
        {places && (
          <AtlasMap
            key={item.id}
            view={view}
            items={[{ id: item.id, name: item.name, capital: places[item.id]?.capital }]}
            places={places}
            selectedId={item.id}
            labels={res ? 'selected' : 'none'}
            showNumbers={false}
            ariaLabel={`Vaktérkép: ${item.region}`}
          />
        )}
      </div>
      <div className="stack">
        <h2 className="quiz-prompt">Mi a kiemelt hely neve?</h2>
        <p className="muted" style={{ margin: 0 }}>
          {item.region} · {item.category}
        </p>
        {!res ? (
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              const others = PLACES.filter((p) => p.region === item.region && p.id !== item.id).map((p) => p.name);
              const r = checkAnswer(typed, item.name, [], others);
              const ok = r.ok;
              setRes({ ok, warn: r.ok && r.kind !== 'exact' });
              onDone(ok, r.ok && r.kind !== 'exact');
            }}
          >
            <input type="text" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="A hely neve" autoComplete="off" />
            <button type="submit" className="btn primary">
              Ellenőrzés
            </button>
            <button type="button" className="btn" onClick={() => (setRes({ ok: false, warn: false }), onDone(false))}>
              Nem tudom
            </button>
          </form>
        ) : (
          <p>
            <strong>{item.name}</strong> · <Link to={`/topografia/terkep?hely=${item.id}`}>A térképen</Link>
          </p>
        )}
        {res && <PlaceFactsBlock id={item.id} compact />}
      </div>
    </div>
  );
}

function ConceptReview({ entry, onDone }: { entry: ConceptEntry; onDone: (ok: boolean, warn?: boolean) => void }) {
  const [typed, setTyped] = useState('');
  const [res, setRes] = useState<boolean | null>(null);
  const masked = entry.definition.replace(new RegExp(entry.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '…');
  return (
    <div className="stack">
      <h2 className="quiz-prompt">Melyik fogalom?</h2>
      <p className="concept-def">{masked}</p>
      {res === null ? (
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            const r = checkAnswer(typed, entry.term, entry.aliases ?? []);
            const ok = r.ok;
            setRes(ok);
            onDone(ok, r.ok && r.kind !== 'exact');
          }}
        >
          <input type="text" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="A fogalom neve" autoComplete="off" />
          <button type="submit" className="btn primary">
            Ellenőrzés
          </button>
          <button type="button" className="btn" onClick={() => (setRes(false), onDone(false))}>
            Nem tudom
          </button>
        </form>
      ) : (
        <p>
          <strong>{entry.term}</strong> · <Link to={`/elmelet/fogalomtar/${entry.id}`}>A fogalomtárban</Link>
        </p>
      )}
    </div>
  );
}

/** Self-graded flashcard: question → reveal → Nem ment / Nehéz / Ment / Könnyű. */
function SelfGrade({ question, answer, onGrade }: { question: React.ReactNode; answer: React.ReactNode; onGrade: (g: Grade) => void }) {
  const [shown, setShown] = useState(false);
  const [graded, setGraded] = useState(false);
  return (
    <div className="stack">
      {question}
      {!shown ? (
        <button type="button" className="btn primary" onClick={() => setShown(true)} autoFocus>
          <Eye size={16} /> Megmutatom a választ
        </button>
      ) : (
        <>
          <div className="tip-box">{answer}</div>
          {!graded && (
            <div className="row" role="group" aria-label="Mennyire ment?">
              {(['Nem ment', 'Nehéz volt', 'Ment', 'Könnyű'] as const).map((l, g) => (
                <button key={l} type="button" className={`btn${g === 2 ? ' primary' : ''}`} onClick={() => (setGraded(true), onGrade(g as Grade))}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------- page ----------

export default function Ismetles() {
  const goal = useSettings((s) => s.dailyGoal);
  const level = useSettings((s) => s.levelFilter);
  const rate = useProgress((s) => s.rate);
  const doneToday = useProgress((s) => s.activity[dayKey(Date.now())] ?? 0);
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ ok: 0, bad: 0 });
  const [streak, setStreak] = useState(0);

  // Build once per visit from the current SRS state (later ratings must not reshuffle the queue).
  useEffect(() => {
    void buildQueue(useProgress.getState().srs, Math.max(0, goal - doneToday) || 10, level).then(setQueue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, level]);

  const q = queue?.[i];
  const record = (grade: Grade) => {
    if (!q || answered !== null) return;
    const ok = grade >= 1;
    rate(q.key, grade);
    setAnswered(ok);
    setStats((s) => (ok ? { ...s, ok: s.ok + 1 } : { ...s, bad: s.bad + 1 }));
    setStreak((s) => (ok ? s + 1 : 0));
  };
  const next = () => {
    setAnswered(null);
    setI((n) => n + 1);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && answered !== null) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const dueCount = useMemo(() => queue?.filter((x) => !x.isNew).length ?? 0, [queue]);

  return (
    <>
      <PageHead
        eyebrow="Mai ismétlés"
        title="Mai ismétlés"
        lead={queue ? `${dueCount} esedékes ismétlés és ${queue.length - dueCount} új elem – a napi célod ${goal} elem, ma eddig ${doneToday} megvan.` : 'A sor összeállítása…'}
      />
      {queue && !queue.length && (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>Mára nincs több teendő 🎉</h2>
          <p style={{ margin: 0 }}>
            Elérted a napi célt. Ha van kedved, gyakorolj a <Link to="/topografia/kviz">topográfiai</Link> vagy az <Link to="/elmelet/kviz">elméleti kvízzel</Link>.
          </p>
        </div>
      )}
      {queue && queue.length > 0 && !q && (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>Kész a mai sor! {stats.ok}/{stats.ok + stats.bad}</h2>
          <p style={{ margin: 0 }}>A hibás elemek ma még egyszer, holnap pedig újra előkerülnek.</p>
          <div className="row">
            <Link className="btn primary" to="/haladas">
              Haladás
            </Link>
            <button type="button" className="btn" onClick={() => location.reload()}>
              Még egy kör
            </button>
          </div>
        </div>
      )}
      {queue && q && (
        <div className="quiz-session">
          <div className="quiz-bar">
            <div className="quiz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={i + 1} aria-label="Haladás">
              <span style={{ width: `${((i + (answered !== null ? 1 : 0)) / queue.length) * 100}%` }} />
            </div>
            <span className="tabular">
              {i + 1} / {queue.length}
            </span>
            {streak >= 2 && (
              <span className="streak">
                <Flame size={16} aria-hidden /> {streak}
              </span>
            )}
          </div>
          <div className="card stack" aria-live="polite">
            <p className="muted" style={{ margin: 0 }}>
              {KIND_LABEL[q.kind]} · {q.isNew ? 'új' : 'ismétlés'}
            </p>
            {q.kind === 'place' && <PlaceReview key={q.key} item={q.item} onDone={(ok, warn) => record(gradeFromAnswer(ok, warn))} />}
            {q.kind === 'concept' && <ConceptReview key={q.key} entry={q.entry} onDone={(ok, warn) => record(gradeFromAnswer(ok, warn))} />}
            {q.kind === 'card' && (
              <SelfGrade
                key={q.key}
                question={
                  <>
                    <p className="muted" style={{ margin: 0 }}>
                      {OBJ_BY_ID.get(q.objectiveId)?.text}
                    </p>
                    <h2 className="quiz-prompt">{q.card.selfCheck[i % q.card.selfCheck.length]!.q}</h2>
                  </>
                }
                answer={q.card.selfCheck[i % q.card.selfCheck.length]!.a}
                onGrade={record}
              />
            )}
            {q.kind === 'process' && (
              <>
                <h2 className="quiz-prompt">Állítsd sorrendbe: {PROCESSES.find((p) => p.id === q.process.id)?.title ?? q.process.title}</h2>
                <Order key={q.key} p={q.process} onDone={(ok) => record(gradeFromAnswer(ok))} />
              </>
            )}
            {q.kind === 'calc' && (
              <>
                <h2 className="quiz-prompt">{generatorById(q.generator)?.title}</h2>
                <Calc key={q.key} id={q.generator} seed={Date.now() % 1e6} onDone={(ok) => record(gradeFromAnswer(ok))} />
              </>
            )}
            {answered !== null && (
              <div className="feedback">
                <p className={answered ? 'feedback-ok' : 'feedback-bad'}>
                  {answered ? <Check size={18} aria-hidden /> : <X size={18} aria-hidden />} {answered ? 'Rendben!' : 'Ez holnap újra jön.'}
                </p>
                <button type="button" className="btn primary" onClick={next} autoFocus>
                  Következő <kbd>Enter</kbd>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
