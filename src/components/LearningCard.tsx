import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, Lightbulb, RotateCcw, Workflow } from 'lucide-react';
import type { Objective } from '@/data/types';
import type { Card, ConceptIndex } from '@/data/content';
import { PROCESSES } from '@/content/catalog';
import { Diagram, hasDiagram } from './diagrams';
import { GeneratedBadge } from './GeneratedBadge';
import { RichText, type LinkTerm } from './RichText';
import { useProgress } from '@/store/progress';

const PROCESS_TITLE = new Map(PROCESSES.map((p) => [p.id, p.title]));

function SelfCheck({ items }: { items: Card['selfCheck'] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <div className="self-check">
      <strong>Ellenőrizd magad</strong>
      <ol>
        {items.map((x, i) => (
          <li key={i}>
            <button type="button" className="self-q" aria-expanded={!!open[i]} onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>
              {x.q} <ChevronDown size={14} style={{ transform: open[i] ? 'rotate(180deg)' : undefined }} aria-hidden />
            </button>
            {open[i] && <p className="self-a">{x.a}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function LearningCard({ objective, card, concepts }: { objective: Objective; card?: Card; concepts?: ConceptIndex }) {
  const understood = useProgress((s) => s.understood[objective.id]);
  const setUnderstood = useProgress((s) => s.setUnderstood);
  const rate = useProgress((s) => s.rate);

  const chips = useMemo(() => {
    if (!card || !concepts) return [];
    return card.concepts.map((label) => ({ label, entry: concepts.byLabel.get(label)?.[0] }));
  }, [card, concepts]);
  const terms: LinkTerm[] = useMemo(
    () =>
      chips
        .filter((c) => c.entry)
        .flatMap((c) => {
          const kids = concepts!.entries.filter((e) => e.parent === c.entry!.id);
          return [c.entry!, ...kids].map((e) => ({ entry: e, forms: [e.term, ...(e.aliases ?? [])].map((f) => f.replace(/\s*\(.*\)$/, '')) }));
        }),
    [chips, concepts],
  );

  return (
    <article id={objective.id} className={`card learning-card${understood === 'ok' ? ' is-done' : ''}`}>
      <h3 className="lc-title">
        {objective.level === 'emelt' && <span className="badge-emelt">EMELT</span>} {objective.text}
      </h3>
      {!card ? (
        <p className="muted" style={{ margin: 0 }}>
          A magyarázat még készül.
        </p>
      ) : (
        <>
          <div className="lc-body">
            <RichText text={card.explanation} terms={terms} />
            {card.diagram && hasDiagram(card.diagram) && (
              <div className="lc-diagram">
                <Diagram id={card.diagram} />
              </div>
            )}
          </div>
          {chips.length > 0 && (
            <div className="lc-row">
              <strong>Kulcsfogalmak</strong>
              <div className="chip-row">
                {chips.map((c) =>
                  c.entry ? (
                    <Link key={c.label} className="chip" to={`/elmelet/fogalomtar/${c.entry.id}`}>
                      {c.entry.term}
                    </Link>
                  ) : (
                    <span key={c.label} className="chip">
                      {c.label}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}
          {card.processes.length > 0 && (
            <div className="lc-row">
              <strong>Kapcsolódó folyamat</strong>
              <div className="chip-row">
                {card.processes.map((p) => (
                  <Link key={p} className="chip chip-theory" to={`/elmelet/folyamatok/${p}`}>
                    <Workflow size={12} /> {PROCESS_TITLE.get(p) ?? p}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="tip-box">
            <Lightbulb size={15} aria-hidden /> <strong>Vizsgatipp:</strong> {card.examTip}
          </div>
          <SelfCheck items={card.selfCheck} />
          <GeneratedBadge contentId={`card:${objective.id}`} />
        </>
      )}
      <div className="row lc-actions" role="group" aria-label="Mennyire megy?">
        <button
          type="button"
          className={`btn small${understood === 'ok' ? ' primary' : ''}`}
          aria-pressed={understood === 'ok'}
          onClick={() => {
            setUnderstood(objective.id, understood === 'ok' ? null : 'ok');
            if (understood !== 'ok') rate(`card:${objective.id}`, 2);
          }}
        >
          <Check size={15} /> Megértettem
        </button>
        <button
          type="button"
          className={`btn small${understood === 'practice' ? ' primary' : ''}`}
          aria-pressed={understood === 'practice'}
          onClick={() => {
            setUnderstood(objective.id, understood === 'practice' ? null : 'practice');
            if (understood !== 'practice') rate(`card:${objective.id}`, 0);
          }}
        >
          <RotateCcw size={15} /> Még gyakorolnom kell
        </button>
      </div>
    </article>
  );
}
