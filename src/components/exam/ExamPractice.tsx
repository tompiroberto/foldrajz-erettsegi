import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';
import { useExamTasks, type ExamTaskRef } from '@/data/exams';
import { TOPICS, SUBTOPICS } from '@/data/requirements';
import { useProgress, itemId } from '@/store/progress';
import { ExamTaskView } from './ExamTaskView';

interface Props {
  /** Restrict the pool, e.g. to tasks built on place names for the topography quiz. */
  filter?: (t: ExamTaskRef) => boolean;
  title: string;
}

/** Practise past exam tasks one at a time, filtered by topic, with solutions on click. */
export function ExamPractice({ filter, title }: Props) {
  const [topic, setTopic] = useState<number | 0>(0);
  const [order, setOrder] = useState(0);
  const [i, setI] = useState(0);
  const rate = useProgress((s) => s.rate);
  const all = useExamTasks('*');

  const pool = useMemo(() => {
    const subIds = topic ? new Set(SUBTOPICS.filter((s) => s.topicNo === topic).map((s) => s.id)) : null;
    const list = (all ?? []).filter((t) => (!filter || filter(t)) && (!subIds || t.subtopics.some((s) => subIds.has(s))));
    if (!order) return list;
    let x = order;
    const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
    return [...list].sort(() => rnd() - 0.5);
  }, [all, filter, topic, order]);

  const task = pool[Math.min(i, pool.length - 1)];

  if (!all) return <p className="placeholder" aria-busy="true">A 44 korábbi feladatsor betöltése…</p>;

  return (
    <section className="stack">
      <h2>{title}</h2>
      <div className="row">
        <label htmlFor="ep-topic">Témakör:</label>
        <select
          id="ep-topic"
          value={topic}
          onChange={(e) => {
            setTopic(Number(e.target.value));
            setI(0);
          }}
        >
          <option value={0}>Mind</option>
          {Object.entries(TOPICS).map(([n, t]) => (
            <option key={n} value={n}>
              {n}. {t}
            </option>
          ))}
        </select>
        <button type="button" className="btn small" onClick={() => (setOrder(Date.now() % 100000), setI(0))}>
          <Shuffle size={16} /> Keverés
        </button>
        <span className="muted tabular" aria-live="polite">
          {pool.length ? `${Math.min(i, pool.length - 1) + 1} / ${pool.length} feladat` : 'Nincs ilyen feladat.'}
        </span>
      </div>
      {task && (
        <>
          <ExamTaskView key={`${task.examId}-${task.no}`} task={task} />
          <div className="row">
            <button type="button" className="btn" disabled={i === 0} onClick={() => setI((n) => n - 1)}>
              <ArrowLeft size={16} /> Előző
            </button>
            <span className="spacer" />
            <span className="muted">Hogy ment?</span>
            <button type="button" className="btn small" onClick={() => (rate(itemId('exam', `${task.examId}-${task.no}`), 0), setI((n) => n + 1))}>
              Nem ment
            </button>
            <button type="button" className="btn small" onClick={() => (rate(itemId('exam', `${task.examId}-${task.no}`), 1), setI((n) => n + 1))}>
              Nehéz volt
            </button>
            <button type="button" className="btn primary small" onClick={() => (rate(itemId('exam', `${task.examId}-${task.no}`), 2), setI((n) => n + 1))}>
              Jól ment <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
