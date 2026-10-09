import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { DayNightGlobe } from '@/components/bg/DayNightGlobe';
import { SUBTOPICS, TOPICS } from '@/data/requirements';
import { EXAM_TASK_SUMMARIES } from '@/data/exams';

export default function TheoryHome() {
  return (
    <>
      <div className="theory-hero">
        <PageHead
          eyebrow="Elmélet"
          title="A rétegek"
          lead="A részletes vizsgakövetelmény 10 témaköre. Minden követelménymondathoz tanulókártya, fogalmak és érettségi feladatok tartoznak."
        />
        <DayNightGlobe />
      </div>
      <div className="grid">
        {Object.entries(TOPICS).map(([no, title]) => {
          const n = Number(no);
          const subs = SUBTOPICS.filter((s) => s.topicNo === n);
          const objectives = subs.reduce((a, s) => a + s.objectives.length, 0);
          const ids = new Set(subs.map((s) => s.id));
          const tasks = EXAM_TASK_SUMMARIES.filter((t) => t.subtopics.some((s) => ids.has(s))).length;
          return (
            <Link key={no} to={`/elmelet/tananyag#tema-${no}`} className="card is-link topic-card">
              <span className="topic-no tabular">{no}.</span>
              <h3>{title}</h3>
              <p className="muted tabular" style={{ margin: 0 }}>
                {subs.length} alcím · {objectives} követelmény{tasks ? ` · ${tasks} érettségi feladat` : ''}
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
