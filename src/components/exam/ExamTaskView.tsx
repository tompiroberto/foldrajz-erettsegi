import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, Eye, FileText, X } from 'lucide-react';
import { pdfUrl, type ExamItem, type ExamPart, type ExamTaskRef } from '@/data/exams';
import { SUBTOPIC_BY_ID } from '@/data/requirements';
import { normalizeHu } from '@/lib/normalize';
import { PdfPage } from '../PdfPage';

export interface PartScore {
  earned: number;
  max: number;
}

interface Props {
  task: ExamTaskRef;
  /** Hide the solution buttons until the whole test is submitted (Próbavizsga). */
  lockSolutions?: boolean;
  /** Show solutions right away (after submitting a mock exam). */
  revealAll?: boolean;
  onScore?: (partKey: string, score: PartScore) => void;
  headingLevel?: 'h2' | 'h3';
}

/** Compares an item answer with the official key; tolerant of case, spaces and order of numbers. */
export function itemCorrect(given: string, key: string): boolean {
  const g = normalizeHu(given);
  if (!g) return false;
  const alts = key.split('/').map((a) => normalizeHu(a));
  const sortNums = (s: string) => s.split(/[ ,;]+/).filter(Boolean).sort().join(',');
  return alts.some((a) => a === g || sortNums(a) === sortNums(g));
}

function ItemInput({
  item,
  type,
  value,
  onChange,
  checked,
}: {
  item: ExamItem;
  type: ExamPart['type'];
  value: string;
  onChange: (v: string) => void;
  checked: boolean;
}) {
  const ok = checked && item.answer ? itemCorrect(value, item.answer) : null;
  return (
    <li className={`exam-item${ok === true ? ' is-ok' : ok === false ? ' is-bad' : ''}`}>
      <span className="exam-item-n tabular">{item.n}.</span>
      <span className="exam-item-text">{item.text}</span>
      <span className="exam-item-input">
        {type === 'true-false' ? (
          <span className="tf" role="radiogroup" aria-label={`${item.n}. állítás`}>
            {(['I', 'H'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={value === v}
                className={`btn small${value === v ? ' primary' : ''}`}
                disabled={checked}
                onClick={() => onChange(v)}
              >
                {v === 'I' ? 'Igaz' : 'Hamis'}
              </button>
            ))}
          </span>
        ) : (
          <input
            type="text"
            value={value}
            disabled={checked}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${item.n}. válasz`}
            size={8}
          />
        )}
        {ok === true && <Check size={18} className="feedback-ok" aria-label="Helyes" />}
        {ok === false && (
          <span className="feedback-bad">
            <X size={18} aria-hidden /> <span className="sr-only">Hibás, helyesen:</span>
            {item.answer}
          </span>
        )}
      </span>
    </li>
  );
}

function PartView({
  part,
  partKey,
  lockSolutions,
  revealAll,
  onScore,
}: {
  part: ExamPart;
  partKey: string;
  lockSolutions?: boolean;
  revealAll?: boolean;
  onScore?: Props['onScore'];
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [show, setShow] = useState(false);
  const [self, setSelf] = useState<number | null>(null);
  const auto = !!part.autoCheck && !!part.items?.length;
  const reveal = revealAll || show;

  const autoScore = useMemo(() => {
    if (!auto || !part.items) return 0;
    const good = part.items.filter((i) => i.answer && itemCorrect(answers[i.n] ?? '', i.answer)).length;
    // Point per item when the totals match, otherwise proportional.
    return part.items.length === part.points ? good : Math.round((good / part.items.length) * part.points);
  }, [auto, part, answers]);

  const check = () => {
    setChecked(true);
    onScore?.(partKey, { earned: autoScore, max: part.points });
  };

  // Submitting a mock exam scores every auto-checkable part at once.
  useEffect(() => {
    if (revealAll && auto && !checked) check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealAll]);

  return (
    <section className="exam-part">
      <div className="exam-part-head">
        {part.label && <span className="exam-part-label">{part.label})</span>}
        <p className="exam-prompt">{part.prompt}</p>
        <span className="exam-points tabular">{part.points} pont</span>
      </div>
      {part.options && part.options.length > 0 && (
        <ul className="exam-options">
          {part.options.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      )}
      {part.items && part.items.length > 0 && (
        <ol className="exam-items" aria-label="Állítások">
          {part.items.map((it) => (
            <ItemInput
              key={it.n}
              item={it}
              type={part.type}
              value={answers[it.n] ?? ''}
              checked={checked}
              onChange={(v) => setAnswers((a) => ({ ...a, [it.n]: v }))}
            />
          ))}
        </ol>
      )}
      <div className="row exam-part-actions">
        {auto && !checked && !lockSolutions && (
          <button type="button" className="btn primary small" onClick={check}>
            <Check size={16} /> Ellenőrzés
          </button>
        )}
        {checked && (
          <span className="tabular" aria-live="polite">
            <strong>
              {autoScore} / {part.points} pont
            </strong>
          </span>
        )}
        {!lockSolutions && (
          <button type="button" className="btn small" aria-expanded={reveal} onClick={() => setShow((s) => !s)}>
            <Eye size={16} /> {reveal ? 'Megoldás elrejtése' : 'Megoldás megmutatása'}
          </button>
        )}
      </div>
      {reveal && (
        <div className="exam-solution">
          <div className="exam-solution-label">Javítási-értékelési útmutató</div>
          <p>{part.solution}</p>
          {!auto && onScore && (
            <div className="row self-score">
              <label htmlFor={`self-${partKey}`}>Saját pontszámod:</label>
              <input
                id={`self-${partKey}`}
                type="number"
                min={0}
                max={part.points}
                value={self ?? ''}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(part.points, Number(e.target.value)));
                  setSelf(v);
                  onScore(partKey, { earned: v, max: part.points });
                }}
              />
              <span className="muted">/ {part.points}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function ExamTaskView({ task, lockSolutions, revealAll, onScore, headingLevel = 'h3' }: Props) {
  const [pagesOpen, setPagesOpen] = useState(task.needsFigure);
  const H = headingLevel;
  const flUrl = pdfUrl(task.exam.files.feladatlap);
  const utUrl = pdfUrl(task.exam.files.utmutato);
  return (
    <article className="card exam-task" id={`f${task.no}`}>
      <header className="exam-task-head">
        <span className="chip chip-exam">{task.source}</span>
        <H>
          {task.no}. {task.title}
        </H>
        <span className="muted tabular">{task.points} pont</span>
      </header>
      {task.instruction && <p className="exam-instruction">{task.instruction}</p>}
      {task.context && <p className="exam-context">{task.context}</p>}

      <div className="exam-original">
        <button type="button" className="btn ghost small" aria-expanded={pagesOpen} onClick={() => setPagesOpen((o) => !o)}>
          <ChevronDown size={16} style={{ transform: pagesOpen ? 'rotate(180deg)' : undefined }} />
          Eredeti {task.pages.length > 1 ? 'oldalak' : 'oldal'} ({task.pages.join(', ')}.)
          {task.needsFigure && <span className="ai-marker">ábra kell hozzá</span>}
        </button>
        <a className="btn ghost small" href={`${flUrl}#page=${task.pages[0] ?? 1}`} target="_blank" rel="noreferrer">
          <FileText size={16} /> Feladatlap PDF
        </a>
        <a className="btn ghost small" href={`${utUrl}#page=${task.guidePages?.[0] ?? 1}`} target="_blank" rel="noreferrer">
          <FileText size={16} /> Útmutató PDF
        </a>
      </div>
      {pagesOpen && (
        <div className="exam-pages">
          {task.figureNote && <p className="muted">{task.figureNote}</p>}
          {task.pages.map((p) => (
            <PdfPage key={p} url={flUrl} page={p} alt={`${task.source}, a feladatlap ${p}. oldala. ${task.figureNote ?? ''}`} />
          ))}
        </div>
      )}

      {task.parts.map((p, i) => (
        <PartView
          key={`${p.label}-${i}`}
          part={p}
          partKey={`${task.examId}#${task.no}${p.label || i}`}
          lockSolutions={lockSolutions}
          revealAll={revealAll}
          onScore={onScore}
        />
      ))}

      {(task.subtopics.length > 0 || task.concepts.length > 0) && (
        <footer className="exam-tags">
          {task.subtopics.map((s) => (
            <Link key={s} className="chip chip-theory" to={`/elmelet/tananyag/${s}`}>
              {SUBTOPIC_BY_ID.get(s)?.title ?? s}
            </Link>
          ))}
          {task.concepts.map((c) => (
            <Link key={c} className="chip" to={`/elmelet/fogalomtar?q=${encodeURIComponent(c)}`}>
              {c}
            </Link>
          ))}
        </footer>
      )}
      {task.note && <p className="muted exam-note">Megjegyzés: {task.note}</p>}
    </article>
  );
}
