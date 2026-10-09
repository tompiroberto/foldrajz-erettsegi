import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { LearningCard } from '@/components/LearningCard';
import { SUBTOPICS, SUBTOPIC_BY_ID, TOPICS } from '@/data/requirements';
import { EXAM_TASK_SUMMARIES } from '@/data/exams';
import { loadCards, loadConcepts, useLoad } from '@/data/content';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { ProgressRing } from '@/components/ProgressRing';

/** Thin bar at the top showing how far the page is read. */
function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return <div className="reading-progress" style={{ transform: `scaleX(${p})` }} aria-hidden />;
}

function SubtopicView({ id }: { id: string }) {
  const sub = SUBTOPIC_BY_ID.get(id);
  const visit = useProgress((s) => s.visit);
  const understood = useProgress((s) => s.understood);
  const levelFilter = useSettings((s) => s.levelFilter);
  const cards = useLoad(loadCards);
  const concepts = useLoad(loadConcepts);
  const { hash } = useLocation();
  useEffect(() => {
    if (sub) visit(`/elmelet/tananyag/${id}`, `Tananyag: ${sub.title}`);
  }, [id, sub, visit]);
  useEffect(() => {
    if (hash && cards) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash, cards]);
  if (!sub) return <p>Nincs ilyen alcím. <Link to="/elmelet/tananyag">Vissza a tananyaghoz</Link></p>;

  const siblings = SUBTOPICS.filter((s) => s.topicNo === sub.topicNo);
  const idx = SUBTOPICS.findIndex((s) => s.id === id);
  const prev = SUBTOPICS[idx - 1];
  const next = SUBTOPICS[idx + 1];
  const tasks = EXAM_TASK_SUMMARIES.filter((t) => t.subtopics.includes(id));
  const objectives = sub.objectives.filter((o) => levelFilter === 'all' || o.level === 'emelt');

  return (
    <>
      <ReadingProgress />
      <div className="reader">
        <nav className="reader-toc" aria-label={`${sub.topicNo}. témakör tartalma`}>
          <strong>
            {sub.topicNo}. {TOPICS[sub.topicNo]}
          </strong>
          <ol>
            {siblings.map((s) => {
              const done = s.objectives.filter((o) => understood[o.id] === 'ok').length;
              return (
                <li key={s.id}>
                  <Link to={`/elmelet/tananyag/${s.id}`} aria-current={s.id === id ? 'page' : undefined} className={s.id === id ? 'active' : ''}>
                    <ProgressRing value={done / s.objectives.length} size={18} stroke={3} label={s.title} /> {s.title}
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="reader-main">
          <PageHead eyebrow={`${sub.topicNo}. ${TOPICS[sub.topicNo]}${sub.parents.length ? ` › ${sub.parents.join(' › ')}` : ''}`} title={sub.title} />
          {(['kozep', 'emelt'] as const).map((lv) => {
            const list = objectives.filter((o) => o.level === lv);
            if (!list.length) return null;
            return (
              <section key={lv} className="stack" style={{ marginBottom: 28 }}>
                <h2>{lv === 'kozep' ? 'Középszint (emelten is kell)' : 'Emelt szint (csak emelten)'}</h2>
                {list.map((o) => (
                  <LearningCard key={o.id} objective={o} card={cards?.get(o.id)} concepts={concepts} />
                ))}
              </section>
            );
          })}
          {tasks.length > 0 && (
            <section className="stack">
              <h2>Érettségi feladatok ebből az alcímből ({tasks.length})</h2>
              <ul className="exam-link-list">
                {tasks.map((t) => (
                  <li key={`${t.examId}-${t.no}`}>
                    <Link to={`/vizsga/feladatsor/${t.examId}#f${t.no}`}>{t.source}</Link> – {t.title}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <nav className="row prev-next" aria-label="Lapozás">
            {prev && (
              <Link className="btn" to={`/elmelet/tananyag/${prev.id}`}>
                ← {prev.title}
              </Link>
            )}
            <span className="spacer" />
            {next && (
              <Link className="btn" to={`/elmelet/tananyag/${next.id}`}>
                {next.title} →
              </Link>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}

export default function Tananyag() {
  const { subId } = useParams();
  const understood = useProgress((s) => s.understood);
  const { hash } = useLocation();
  useEffect(() => {
    if (!subId && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [subId, hash]);
  if (subId) return <SubtopicView id={subId} />;
  return (
    <>
      <PageHead eyebrow="Elmélet" title="Tananyag" lead="A hivatalos követelmények témakörönként és alcímenként – minden követelményhez tanulókártya magyarázattal, ábrával és önellenőrzéssel." />
      {Object.entries(TOPICS).map(([no, title]) => (
        <section key={no} id={`tema-${no}`} style={{ marginBottom: 28 }}>
          <h2>
            {no}. {title}
          </h2>
          <div className="grid">
            {SUBTOPICS.filter((s) => s.topicNo === Number(no)).map((s) => {
              const done = s.objectives.filter((o) => understood[o.id] === 'ok').length;
              return (
                <Link key={s.id} to={`/elmelet/tananyag/${s.id}`} className="card is-link">
                  {s.parents.length > 0 && <div className="muted" style={{ fontSize: '0.8rem' }}>{s.parents[s.parents.length - 1]}</div>}
                  <h3 style={{ fontSize: '1.05rem' }}>{s.title}</h3>
                  <div className="row">
                    <ProgressRing value={done / s.objectives.length} size={28} stroke={3.5} label="Megértve" />
                    <span className="muted tabular">
                      {done}/{s.objectives.length} megértve · {s.objectives.filter((o) => o.level === 'emelt').length} emelt
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
