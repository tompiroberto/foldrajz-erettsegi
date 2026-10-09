import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Flame, Play, RotateCcw, X } from 'lucide-react';
import { PageHead } from '@/components/PageHead';
import { ExamPractice } from '@/components/exam/ExamPractice';
import { Diagram } from '@/components/diagrams';
import { loadCards, loadConcepts, loadProcess, processContentIds, type ProcessContent } from '@/data/content';
import { OBJECTIVES, TOPICS } from '@/data/requirements';
import { TAGS } from '@/content/tags';
import { checkAnswer } from '@/lib/normalize';
import { rngFrom, checkNumeric } from '@/lib/calc/core';
import { generatorById } from '@/lib/calc/generators';
import { buildTheoryQuiz, THEORY_QTYPE_LABEL, type TheoryPool, type TheoryQType, type TheoryQuestion } from '@/lib/quiz/theory';
import { gradeFromAnswer } from '@/lib/srs';
import { useProgress } from '@/store/progress';

interface Setup {
  topics: number[];
  tags: string[];
  level: 'all' | 'emelt';
  count: number;
  types: TheoryQType[];
  only?: string[];
}
interface Result {
  q: TheoryQuestion;
  ok: boolean;
  warn?: boolean;
}

const OBJ_BY_ID = new Map(OBJECTIVES.map((o) => [o.id, o]));

async function loadPool(): Promise<TheoryPool> {
  const [concepts, cards, processes] = await Promise.all([loadConcepts(), loadCards(), Promise.all(processContentIds().map(loadProcess))]);
  return {
    entries: concepts.entries,
    cards: [...cards.values()].map((card) => ({ objective: OBJ_BY_ID.get(card.objectiveId)!, card })).filter((c) => c.objective),
    processes: processes.filter((p): p is ProcessContent => !!p),
  };
}

function filterPool(pool: TheoryPool, s: Setup): TheoryPool {
  const okTopic = (n: number) => !s.topics.length || s.topics.includes(n);
  return {
    entries: pool.entries.filter(
      (e) => okTopic(e.topicNo) && (!s.tags.length || s.tags.some((t) => e.tags.includes(t))) && (s.level === 'all' || e.level === 'emelt') && (!s.only || s.only.includes(`concept:${e.id}`)),
    ),
    cards: pool.cards.filter((c) => okTopic(c.objective.topicNo) && (s.level === 'all' || c.objective.level === 'emelt')),
    processes: pool.processes,
  };
}

// ---------- question views ----------

function Choice({ options, answer, onAnswer, done }: { options: string[]; answer: string; onAnswer: (opt: string) => void; done: string | null }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      const i = Number(e.key) - 1;
      if (i >= 0 && i < options.length) onAnswer(options[i]!);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, onAnswer, done]);
  return (
    <div className="answer-grid">
      {options.map((o, i) => (
        <button key={o} type="button" disabled={!!done} className={`answer-btn${done && o === answer ? ' is-ok' : ''}${done === o && o !== answer ? ' is-bad' : ''}`} onClick={() => onAnswer(o)}>
          <kbd>{i + 1}</kbd> <span>{o}</span>
          {done && o === answer && <Check size={18} aria-label="helyes" />}
          {done === o && o !== answer && <X size={18} aria-label="hibás" />}
        </button>
      ))}
    </div>
  );
}

function Pairing({ pairs, onDone }: { pairs: { term: string; def: string; id: string }[]; onDone: (ok: boolean) => void }) {
  const defs = useMemo(() => [...pairs].sort(() => Math.random() - 0.5), [pairs]);
  const [sel, setSel] = useState<string | null>(null);
  const [match, setMatch] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const colorOf = (id: string) => Object.keys(match).indexOf(id);
  return (
    <div className="stack">
      <p className="muted" style={{ margin: 0 }}>
        Kattints egy fogalomra, majd a hozzá illő meghatározásra.
      </p>
      <div className="pairing">
        <div className="stack" style={{ gap: 6 }}>
          {pairs.map((p) => (
            <button key={p.id} type="button" className={`pair-btn${sel === p.id ? ' is-sel' : ''}${match[p.id] ? ` pair-c${colorOf(p.id)}` : ''}`} onClick={() => !checked && setSel(p.id)} aria-pressed={sel === p.id}>
              {p.term}
            </button>
          ))}
        </div>
        <div className="stack" style={{ gap: 6 }}>
          {defs.map((d) => {
            const owner = Object.entries(match).find(([, v]) => v === d.id)?.[0];
            const ok = checked && owner === d.id;
            return (
              <button
                key={d.id}
                type="button"
                className={`pair-btn def${owner ? ` pair-c${colorOf(owner)}` : ''}${checked ? (ok ? ' is-ok' : ' is-bad') : ''}`}
                onClick={() => {
                  if (!sel || checked) return;
                  setMatch((m) => {
                    const n = Object.fromEntries(Object.entries(m).filter(([, v]) => v !== d.id));
                    n[sel] = d.id;
                    return n;
                  });
                  setSel(null);
                }}
              >
                {d.def}
                {checked && !ok && <span className="feedback-bad"> → {pairs.find((p) => p.id === d.id)?.term}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {!checked && (
        <button
          type="button"
          className="btn primary"
          disabled={Object.keys(match).length < pairs.length}
          onClick={() => {
            setChecked(true);
            onDone(pairs.every((p) => match[p.id] === p.id));
          }}
        >
          Ellenőrzés
        </button>
      )}
    </div>
  );
}

export function Order({ p, onDone }: { p: ProcessContent; onDone: (ok: boolean) => void }) {
  const correct = p.steps.map((s) => s.title);
  const [order, setOrder] = useState(() => [...correct].sort(() => Math.random() - 0.5));
  const [checked, setChecked] = useState(false);
  const move = (i: number, d: number) =>
    setOrder((o) => {
      const j = i + d;
      if (j < 0 || j >= o.length) return o;
      const c = [...o];
      [c[i], c[j]] = [c[j]!, c[i]!];
      return c;
    });
  return (
    <div className="stack">
      <ol className="order-list">
        {order.map((t, i) => (
          <li key={t} className={checked ? (t === correct[i] ? 'is-ok' : 'is-bad') : ''}>
            <span className="num-chip tabular">{i + 1}</span>
            <span style={{ flex: 1 }}>{t}</span>
            {!checked && (
              <>
                <button type="button" className="icon-btn" aria-label={`${t} feljebb`} onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button type="button" className="icon-btn" aria-label={`${t} lejjebb`} onClick={() => move(i, 1)}>
                  ↓
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
      {!checked && (
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            setChecked(true);
            onDone(order.every((t, i) => t === correct[i]));
          }}
        >
          Ellenőrzés
        </button>
      )}
    </div>
  );
}

export function Calc({ id, seed, onDone }: { id: string; seed: number; onDone: (ok: boolean) => void }) {
  const g = generatorById(id)!;
  const p = useMemo(() => g.generate(rngFrom(seed)), [g, seed]);
  const [vals, setVals] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  return (
    <div className="stack">
      <p style={{ margin: 0 }}>{p.question}</p>
      {p.data && (
        <table className="data-table">
          <tbody>
            {p.data.map(([k, v]) => (
              <tr key={k}>
                <th scope="row">{k}</th>
                <td className="tabular">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {p.answers.map((a, i) => (
        <label key={a.label} className="row calc-answer">
          <span className="calc-label">{a.label}</span>
          <input type="text" value={vals[i] ?? ''} disabled={checked} onChange={(e) => setVals((v) => Object.assign([...v], { [i]: e.target.value }))} />
          {a.answer.unit && <span className="muted">{a.answer.unit}</span>}
          {checked && (checkNumeric(vals[i] ?? '', a.answer) ? <Check size={18} className="feedback-ok" aria-label="helyes" /> : <span className="feedback-bad">Helyesen: {a.answer.display}</span>)}
        </label>
      ))}
      {!checked ? (
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            setChecked(true);
            onDone(p.answers.every((a, i) => checkNumeric(vals[i] ?? '', a.answer)));
          }}
        >
          Ellenőrzés
        </button>
      ) : (
        <ol className="calc-steps">
          {p.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Explain({ p, onDone }: { p: ProcessContent; onDone: (ok: boolean) => void }) {
  const [text, setText] = useState('');
  const [show, setShow] = useState(false);
  const [ticks, setTicks] = useState<Record<number, boolean>>({});
  const total = p.essay.elements.reduce((a, e) => a + e.points, 0);
  const got = p.essay.elements.reduce((a, e, i) => a + (ticks[i] ? e.points : 0), 0);
  return (
    <div className="stack">
      <p style={{ margin: 0 }}>{p.essay.prompt}</p>
      {!show ? (
        <>
          <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Írj 3–6 mondatot…" aria-label="A válaszod" />
          <button type="button" className="btn primary" onClick={() => setShow(true)}>
            Mintaválasz és önpontozás
          </button>
        </>
      ) : (
        <>
          {text && <blockquote className="my-answer">{text}</blockquote>}
          <div className="tip-box">{p.essay.modelAnswer}</div>
          <ul className="essay-elements">
            {p.essay.elements.map((e, i) => (
              <li key={i}>
                <label className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={!!ticks[i]} onChange={(ev) => setTicks((t) => ({ ...t, [i]: ev.target.checked }))} />
                  <span style={{ flex: 1 }}>{e.text}</span>
                  <span className="muted tabular">{e.points} p</span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" className="btn primary" onClick={() => onDone(got >= total * 0.6)}>
            Kész: {got} / {total} pont
          </button>
        </>
      )}
    </div>
  );
}

// ---------- session ----------

function Session({ setup, pool, onDone }: { setup: Setup; pool: TheoryPool; onDone: (r: Result[]) => void }) {
  const questions = useMemo(() => buildTheoryQuiz(filterPool(pool, setup), setup.types, setup.count, rngFrom(Date.now() % 1e9)), [pool, setup]);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [current, setCurrent] = useState<Result | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [streak, setStreak] = useState(0);
  const rate = useProgress((s) => s.rate);
  const q = questions[i];

  const finish = useCallback(
    (ok: boolean, warn = false) => {
      if (!q || current) return;
      setCurrent({ q, ok, warn });
      setStreak((s) => (ok ? s + 1 : 0));
      rate(q.key.split(':').slice(0, 2).join(':'), gradeFromAnswer(ok, warn));
    },
    [q, current, rate],
  );
  const next = () => {
    if (!current) return;
    const all = [...results, current];
    setResults(all);
    setCurrent(null);
    setPicked(null);
    setTyped('');
    if (i + 1 >= questions.length) onDone(all);
    else setI(i + 1);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && current && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!questions.length) return <p className="placeholder">Ebből a válogatásból nem lehet kérdést készíteni – válassz több témakört vagy típust.</p>;
  if (!q) return null;

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
          <span className="streak">
            <Flame size={16} aria-hidden /> {streak}
          </span>
        )}
      </div>
      <div className="card stack theory-q" aria-live="polite">
        <p className="muted" style={{ margin: 0 }}>
          {THEORY_QTYPE_LABEL[q.kind]} · {q.topicNo}. témakör
        </p>
        {q.kind === 'fog-def' && (
          <>
            <h2 className="quiz-prompt">Mit jelent: {q.entry.term}?</h2>
            <Choice options={q.options} answer={q.answer} done={picked} onAnswer={(o) => (setPicked(o), finish(o === q.answer))} />
          </>
        )}
        {q.kind === 'def-fog' && (
          <>
            <h2 className="quiz-prompt">Melyik fogalom?</h2>
            <p className="concept-def">{q.entry.definition.replace(new RegExp(q.entry.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '…')}</p>
            {!current ? (
              <form
                className="row"
                onSubmit={(e) => {
                  e.preventDefault();
                  const r = checkAnswer(typed, q.entry.term, q.entry.aliases ?? []);
                  finish(r.ok, r.ok && r.kind !== 'exact');
                }}
              >
                <input type="text" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="A fogalom neve" autoComplete="off" />
                <button type="submit" className="btn primary">
                  Ellenőrzés
                </button>
              </form>
            ) : null}
          </>
        )}
        {q.kind === 'igaz-hamis' && (
          <>
            <h2 className="quiz-prompt">Igaz vagy hamis?</h2>
            <p className="concept-def">{q.statement}</p>
            <Choice options={['Igaz', 'Hamis']} answer={q.truth ? 'Igaz' : 'Hamis'} done={picked} onAnswer={(o) => (setPicked(o), finish((o === 'Igaz') === q.truth))} />
            {current && !q.truth && q.correction && (
              <div className="tip-box">
                <strong>Mi a hiba?</strong> {q.correction}
              </div>
            )}
          </>
        )}
        {q.kind === 'kakukk' && (
          <>
            <h2 className="quiz-prompt">Melyik a kakukktojás?</h2>
            <Choice options={q.options.map((o) => o.term)} answer={q.options.find((o) => o.id === q.odd)!.term} done={picked} onAnswer={(o) => (setPicked(o), finish(o === q.options.find((x) => x.id === q.odd)!.term))} />
            {current && <p className="muted">{q.reason}</p>}
          </>
        )}
        {q.kind === 'parositas' && (
          <>
            <h2 className="quiz-prompt">Párosítsd a fogalmakat a meghatározásukkal!</h2>
            <Pairing pairs={q.pairs} onDone={(ok) => finish(ok)} />
          </>
        )}
        {q.kind === 'sorrend' && (
          <>
            <h2 className="quiz-prompt">Állítsd sorrendbe: {q.process.title}</h2>
            <Order p={q.process} onDone={(ok) => finish(ok)} />
          </>
        )}
        {q.kind === 'abra' && (
          <>
            <h2 className="quiz-prompt">{q.process.title}: melyik szakaszt mutatja az ábra?</h2>
            <Diagram id={q.diagram} step={q.step} caption={false} />
            <Choice options={q.options} answer={q.process.steps[q.step]!.title} done={picked} onAnswer={(o) => (setPicked(o), finish(o === q.process.steps[q.step]!.title))} />
          </>
        )}
        {q.kind === 'szamolas' && (
          <>
            <h2 className="quiz-prompt">{generatorById(q.generator)?.title}</h2>
            <Calc id={q.generator} seed={q.seed} onDone={(ok) => finish(ok)} />
          </>
        )}
        {q.kind === 'magyarazd' && (
          <>
            <h2 className="quiz-prompt">Magyarázd el! – {q.process.title}</h2>
            <Explain p={q.process} onDone={(ok) => finish(ok)} />
          </>
        )}

        {current && (
          <div className="feedback">
            <p className={current.ok ? 'feedback-ok' : 'feedback-bad'}>
              {current.ok ? <Check size={18} aria-hidden /> : <X size={18} aria-hidden />} {current.ok ? 'Helyes!' : 'Nem egészen.'}
              {current.warn && q.kind === 'def-fog' && <> Helyesírás: <strong>{q.entry.term}</strong>.</>}
              {!current.ok && q.kind === 'def-fog' && <> A helyes válasz: <strong>{q.entry.term}</strong>.</>}
            </p>
            {(q.kind === 'fog-def' || q.kind === 'def-fog') && (
              <Link to={`/elmelet/fogalomtar/${q.entry.id}`}>A fogalom a fogalomtárban</Link>
            )}
            {q.kind === 'igaz-hamis' && <Link to={`/elmelet/tananyag/${q.objective.subtopicId}#${q.objective.id}`}>A tanulókártya</Link>}
            {(q.kind === 'sorrend' || q.kind === 'abra' || q.kind === 'magyarazd') && <Link to={`/elmelet/folyamatok/${q.process.id}`}>A folyamat animációja</Link>}
            <button type="button" className="btn primary" onClick={next} autoFocus>
              {i + 1 >= questions.length ? 'Eredmények' : 'Következő'} <kbd>Enter</kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Results({ results, onRetry, onNew }: { results: Result[]; onRetry: (keys: string[]) => void; onNew: () => void }) {
  const ok = results.filter((r) => r.ok).length;
  const byTopic = new Map<number, { ok: number; all: number }>();
  const byTag = new Map<string, { ok: number; all: number }>();
  for (const r of results) {
    const t = byTopic.get(r.q.topicNo) ?? { ok: 0, all: 0 };
    t.all++;
    if (r.ok) t.ok++;
    byTopic.set(r.q.topicNo, t);
    for (const tag of r.q.tags.filter((x) => !x.endsWith('témakör'))) {
      const g = byTag.get(tag) ?? { ok: 0, all: 0 };
      g.all++;
      if (r.ok) g.ok++;
      byTag.set(tag, g);
    }
  }
  const weak = results.filter((r) => !r.ok && (r.q.kind === 'fog-def' || r.q.kind === 'def-fog'));
  const wrongKeys = results.filter((r) => !r.ok && r.q.key.startsWith('concept:')).map((r) => r.q.key);
  return (
    <div className="card stack">
      <h2 style={{ margin: 0 }}>
        {ok === results.length ? 'Hibátlan! 🎉' : 'Szép!'} {ok}/{results.length}
      </h2>
      <div className="grid">
        <table className="data-table">
          <thead>
            <tr>
              <th>Témakör</th>
              <th>Pontosság</th>
            </tr>
          </thead>
          <tbody>
            {[...byTopic.entries()].map(([t, e]) => (
              <tr key={t}>
                <th scope="row">
                  {t}. {TOPICS[t]}
                </th>
                <td className="tabular">
                  {e.ok}/{e.all}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {byTag.size > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Hashtag</th>
                <th>Pontosság</th>
              </tr>
            </thead>
            <tbody>
              {[...byTag.entries()].map(([t, e]) => (
                <tr key={t}>
                  <th scope="row">#{t}</th>
                  <td className="tabular">
                    {e.ok}/{e.all}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {weak.length > 0 && (
        <div>
          <strong>Ezeket nézd át:</strong>{' '}
          {weak.map((r) =>
            r.q.kind === 'fog-def' || r.q.kind === 'def-fog' ? (
              <Link key={r.q.entry.id} className="chip" to={`/elmelet/fogalomtar/${r.q.entry.id}`}>
                {r.q.entry.term}
              </Link>
            ) : null,
          )}
        </div>
      )}
      <div className="row">
        {wrongKeys.length > 0 && (
          <button type="button" className="btn primary" onClick={() => onRetry(wrongKeys)}>
            <RotateCcw size={16} /> Hibásak újra
          </button>
        )}
        <button type="button" className="btn" onClick={onNew}>
          Új kvíz
        </button>
      </div>
    </div>
  );
}

export default function TheoryQuiz() {
  const [pool, setPool] = useState<TheoryPool | null>(null);
  const [setup, setSetup] = useState<Setup>({ topics: [], tags: [], level: 'all', count: 10, types: ['fog-def', 'def-fog', 'igaz-hamis', 'kakukk', 'parositas', 'sorrend', 'abra', 'szamolas'] });
  const [running, setRunning] = useState(0);
  const [results, setResults] = useState<Result[] | null>(null);
  useEffect(() => void loadPool().then(setPool), []);
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <>
      <PageHead eyebrow="Elmélet" title="Kvíz" lead="Fogalmak, igaz–hamis, kakukktojás, párosítás, sorbarendezés, ábraelemzés, számolás és „Magyarázd el!” – vegyesen." />
      {!running && !results && (
        <form
          className="card stack quiz-setup"
          onSubmit={(e) => {
            e.preventDefault();
            setRunning((r) => r + 1);
          }}
        >
          <fieldset>
            <legend>Témakör (üres = mind)</legend>
            <div className="chip-row">
              {Object.entries(TOPICS).map(([n, t]) => (
                <button key={n} type="button" className={`chip${setup.topics.includes(Number(n)) ? ' selected' : ''}`} aria-pressed={setup.topics.includes(Number(n))} onClick={() => setSetup({ ...setup, topics: toggle(setup.topics, Number(n)) })} title={t}>
                  {n}. {t.length > 34 ? `${t.slice(0, 32)}…` : t}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Hashtag (üres = mind)</legend>
            <div className="chip-row tag-cloud">
              {TAGS.filter((t) => !t.tag.endsWith('témakör')).map((t) => (
                <button key={t.tag} type="button" className={`chip${setup.tags.includes(t.tag) ? ' selected' : ''}`} aria-pressed={setup.tags.includes(t.tag)} onClick={() => setSetup({ ...setup, tags: toggle(setup.tags, t.tag) })}>
                  #{t.tag}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Kérdéstípusok</legend>
            <div className="stack" style={{ gap: 6 }}>
              {(Object.keys(THEORY_QTYPE_LABEL) as TheoryQType[]).map((t) => (
                <label key={t} className="row" style={{ gap: 8 }}>
                  <input type="checkbox" checked={setup.types.includes(t)} onChange={() => setSetup({ ...setup, types: toggle(setup.types, t) })} /> {THEORY_QTYPE_LABEL[t]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="row">
            <label className="row" style={{ gap: 6 }}>
              Szint
              <select value={setup.level} onChange={(e) => setSetup({ ...setup, level: e.target.value as Setup['level'] })}>
                <option value="all">Mind</option>
                <option value="emelt">Csak emelt</option>
              </select>
            </label>
            <label className="row" style={{ gap: 6 }}>
              Kérdések
              <select value={setup.count} onChange={(e) => setSetup({ ...setup, count: Number(e.target.value) })}>
                {[10, 20, 40].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn primary" disabled={!pool || !setup.types.length}>
              <Play size={16} /> {pool ? 'Indítás' : 'Betöltés…'}
            </button>
          </div>
        </form>
      )}
      {running > 0 && !results && pool && <Session key={running} setup={setup} pool={pool} onDone={(r) => setResults(r)} />}
      {results && (
        <Results
          results={results}
          onRetry={(keys) => {
            setSetup({ ...setup, only: keys, types: ['fog-def', 'def-fog'], count: keys.length });
            setResults(null);
            setRunning((r) => r + 1);
          }}
          onNew={() => {
            setResults(null);
            setRunning(0);
            setSetup({ ...setup, only: undefined });
          }}
        />
      )}
      {!running && !results && (
        <div style={{ marginTop: 32 }}>
          <ExamPractice title="Korábbi érettségi feladatok" />
        </div>
      )}
    </>
  );
}
