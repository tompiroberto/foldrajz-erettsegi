import { Suspense, lazy, useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronLeft, ChevronRight, MapPin, Pause, Play, Shuffle, X } from 'lucide-react';
import { PageHead } from '@/components/PageHead';
import { GeneratedBadge } from '@/components/GeneratedBadge';
import { Diagram, hasDiagram } from '@/components/diagrams';
import { PROCESSES, type ProcessDef } from '@/content/catalog';
import { loadConcepts, loadProcess, processContentIds, useLoad, type ProcessContent } from '@/data/content';
import { usePrefersReducedMotion } from '@/lib/appearance';
import { itemId, useProgress } from '@/store/progress';
import topo from '../../starter-data/topography.json';
import type { TopographyFile } from '@/data/types';

const PLACE_NAME = new Map((topo as TopographyFile).items.map((i) => [i.id, i.name]));

// The generic step chain is optional until it is drawn.
type FlowProps = { steps: { title: string; icon?: string }[]; step: number; reduced?: boolean };
const flowModule = import.meta.glob<{ FlowDiagram: ComponentType<FlowProps> }>('../components/diagrams/FlowDiagram.tsx');
const FlowDiagram = Object.values(flowModule)[0] ? lazy(() => Object.values(flowModule)[0]!().then((m) => ({ default: m.FlowDiagram }))) : null;

function Stepper({ def, p }: { def: ProcessDef; p: ProcessContent }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = usePrefersReducedMotion();
  const n = p.steps.length;
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStep((s) => (s + 1 >= n ? (setPlaying(false), s) : s + 1)), 4000);
    return () => clearInterval(t);
  }, [playing, n]);
  const s = p.steps[step]!;
  return (
    <section className="card stack stepper" aria-label="Lépésenkénti ábra">
      <div className="stepper-visual">
        {def.diagram !== 'flow' && hasDiagram(def.diagram) ? (
          <Diagram id={def.diagram} step={step} caption={false} />
        ) : FlowDiagram ? (
          <Suspense fallback={<div className="skeleton" style={{ aspectRatio: '16 / 9' }} />}>
            <FlowDiagram steps={p.steps} step={step} reduced={reduced} />
          </Suspense>
        ) : (
          <ol className="flow-fallback">
            {p.steps.map((x, i) => (
              <li key={x.title} className={i === step ? 'active' : ''}>
                {x.title}
              </li>
            ))}
          </ol>
        )}
      </div>
      <div aria-live="polite">
        <h3 style={{ margin: '0 0 4px' }}>
          {step + 1}. {s.title}
        </h3>
        <p style={{ margin: 0 }}>{s.caption}</p>
      </div>
      <div className="row stepper-controls">
        <button type="button" className="icon-btn" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0} aria-label="Előző lépés">
          <ChevronLeft size={20} />
        </button>
        <button type="button" className="btn small primary" onClick={() => (step + 1 >= n ? (setStep(0), setPlaying(true)) : setPlaying((x) => !x))}>
          {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Szünet' : 'Lejátszás'}
        </button>
        <button type="button" className="icon-btn" onClick={() => setStep((x) => Math.min(n - 1, x + 1))} disabled={step === n - 1} aria-label="Következő lépés">
          <ChevronRight size={20} />
        </button>
        <input type="range" min={0} max={n - 1} value={step} onChange={(e) => (setPlaying(false), setStep(Number(e.target.value)))} aria-label="Idővonal" style={{ flex: 1 }} />
        <span className="tabular muted">
          {step + 1}/{n}
        </span>
      </div>
    </section>
  );
}

function OrderingGame({ p, onDone }: { p: ProcessContent; onDone: (ok: boolean) => void }) {
  const correct = p.steps.map((s) => s.title);
  const [order, setOrder] = useState<string[]>(() => shuffle(correct));
  const [checked, setChecked] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const move = (i: number, d: number) =>
    setOrder((o) => {
      const j = i + d;
      if (j < 0 || j >= o.length) return o;
      const c = [...o];
      [c[i], c[j]] = [c[j]!, c[i]!];
      return c;
    });
  const ok = order.every((t, i) => t === correct[i]);
  return (
    <section className="card stack">
      <h2 style={{ margin: 0 }}>Sorbarendezés</h2>
      <p className="muted" style={{ margin: 0 }}>
        Húzd a lépéseket helyes sorrendbe (vagy használd a nyilakat), aztán ellenőrizd!
      </p>
      <ol className="order-list">
        {order.map((t, i) => (
          <li
            key={t}
            draggable={!checked}
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag == null || drag === i) return;
              setOrder((o) => {
                const c = [...o];
                const [x] = c.splice(drag, 1);
                c.splice(i, 0, x!);
                return c;
              });
              setDrag(null);
            }}
            className={checked ? (t === correct[i] ? 'is-ok' : 'is-bad') : ''}
          >
            <span className="num-chip tabular">{i + 1}</span>
            <span style={{ flex: 1 }}>{t}</span>
            {checked ? (
              t === correct[i] ? (
                <Check size={18} className="feedback-ok" aria-label="jó helyen" />
              ) : (
                <X size={18} className="feedback-bad" aria-label="rossz helyen" />
              )
            ) : (
              <>
                <button type="button" className="icon-btn" aria-label={`${t} feljebb`} onClick={() => move(i, -1)}>
                  <ArrowUp size={16} />
                </button>
                <button type="button" className="icon-btn" aria-label={`${t} lejjebb`} onClick={() => move(i, 1)}>
                  <ArrowDown size={16} />
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
      <div className="row" aria-live="polite">
        {!checked ? (
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setChecked(true);
              onDone(ok);
            }}
          >
            Ellenőrzés
          </button>
        ) : (
          <>
            <span className={ok ? 'feedback-ok' : 'feedback-bad'}>{ok ? '✓ Hibátlan sorrend!' : '✕ Van, ami rossz helyen van – nézd meg az ábrát újra.'}</span>
            <button type="button" className="btn" onClick={() => (setOrder(shuffle(correct)), setChecked(false))}>
              <Shuffle size={16} /> Újra
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function shuffle<T>(a: T[]): T[] {
  const c = [...a];
  for (let k = 0; k < 6 && c.every((x, i) => x === a[i]); k++) c.sort(() => Math.random() - 0.5);
  return c;
}

function Essay({ p }: { p: ProcessContent }) {
  const [text, setText] = useState('');
  const [show, setShow] = useState(false);
  const [ticks, setTicks] = useState<Record<number, boolean>>({});
  const total = p.essay.elements.reduce((a, e) => a + e.points, 0);
  const got = p.essay.elements.reduce((a, e, i) => a + (ticks[i] ? e.points : 0), 0);
  return (
    <section className="card stack">
      <h2 style={{ margin: 0 }}>Magyarázd el!</h2>
      <p style={{ margin: 0 }}>{p.essay.prompt}</p>
      <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Írj 3–6 mondatot…" aria-label="A válaszod" />
      <button type="button" className="btn" onClick={() => setShow((s) => !s)} aria-expanded={show}>
        {show ? 'Mintaválasz elrejtése' : 'Mintaválasz és pontozás'}
      </button>
      {show && (
        <div className="stack">
          <div className="tip-box">{p.essay.modelAnswer}</div>
          <strong>Tartalmi elemek – pipáld be, ami benne van a válaszodban:</strong>
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
          <p className="tabular" aria-live="polite">
            <strong>
              Tartalmi pont: {got} / {total}
            </strong>{' '}
            <span className="muted">(a szóbelin ezen felül a logikus felépítés és a szaknyelv is számít)</span>
          </p>
        </div>
      )}
    </section>
  );
}

function ProcessView({ def }: { def: ProcessDef }) {
  const p = useLoad(() => loadProcess(def.id), [def.id]);
  const concepts = useLoad(loadConcepts);
  const rate = useProgress((s) => s.rate);
  const visit = useProgress((s) => s.visit);
  useEffect(() => visit(`/elmelet/folyamatok/${def.id}`, `Folyamat: ${def.title}`), [def, visit]);
  if (p === undefined) return <div className="skeleton" style={{ height: 400 }} aria-busy="true" />;
  if (!p) return <p className="placeholder">Ennek a folyamatnak a tartalma még készül.</p>;
  return (
    <div className="stack" style={{ gap: 20 }}>
      <Link to="/elmelet/folyamatok" className="btn ghost small" style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={16} /> Folyamatok
      </Link>
      <PageHead eyebrow={def.group} title={p.title} lead={p.summary} />
      <Stepper def={def} p={p} />
      <div className="ccc">
        {(
          [
            ['Okok', p.causes],
            ['Lefolyás', p.course],
            ['Következmények', p.consequences],
          ] as const
        ).map(([t, list], i) => (
          <section key={t} className="card ccc-block">
            <h3>
              {t} {i < 2 && <span aria-hidden>→</span>}
            </h3>
            <ul>
              {list.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Példák a térképen</h2>
        <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
          {p.examples.map((e) => (
            <li key={e.text}>
              {e.text}{' '}
              {e.places?.map((pl) => (
                <Link key={pl} className="chip chip-topo" to={`/topografia/terkep?hely=${encodeURIComponent(pl)}`}>
                  <MapPin size={12} /> {PLACE_NAME.get(pl) ?? pl}
                </Link>
              ))}
            </li>
          ))}
        </ul>
        <div className="chip-row">
          {p.concepts.map((l) => {
            const e = concepts?.byLabel.get(l)?.[0];
            return e ? (
              <Link key={l} className="chip" to={`/elmelet/fogalomtar/${e.id}`}>
                {e.term}
              </Link>
            ) : (
              <span key={l} className="chip">
                {l}
              </span>
            );
          })}
        </div>
      </section>
      <OrderingGame p={p} onDone={(ok) => rate(itemId('process', def.id), ok ? 2 : 0)} />
      <Essay p={p} />
      <GeneratedBadge contentId={`process:${def.id}`} />
    </div>
  );
}

export default function Folyamatok() {
  const { id } = useParams();
  const available = useMemo(() => new Set(processContentIds()), []);
  const def = id ? PROCESSES.find((p) => p.id === id) : undefined;
  if (def) return <ProcessView def={def} />;
  const groups = [...new Set(PROCESSES.map((p) => p.group))];
  return (
    <>
      <PageHead eyebrow="Elmélet" title="Folyamatok" lead="Lépésenként animált ábrák: okok → lefolyás → következmények, sorbarendező játékkal és „Magyarázd el!” feladattal – ezekre épülnek a kifejtős kérdések." />
      {groups.map((g) => (
        <section key={g} style={{ marginBottom: 24 }}>
          <h2>{g}</h2>
          <div className="grid">
            {PROCESSES.filter((p) => p.group === g).map((p) => (
              <Link key={p.id} to={`/elmelet/folyamatok/${p.id}`} className="card is-link">
                <h3 style={{ fontSize: '1.05rem' }}>{p.title}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {available.has(p.id) ? `${p.outline?.length ?? '4–8'} lépés` : 'Készül…'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
