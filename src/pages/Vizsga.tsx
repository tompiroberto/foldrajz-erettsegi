import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Clock, ExternalLink, FileText, Play, Shuffle } from 'lucide-react';
import { PageHead } from '@/components/PageHead';
import { EXAM_INDEX, examMeta, pdfUrl, useExamTasks, type ExamTaskRef } from '@/data/exams';
import { ExamTaskView, type PartScore } from '@/components/exam/ExamTaskView';
import { useSettings } from '@/store/settings';
import { daysUntil } from './Home';

/** Exam format summary, from starter-data/exam-format.txt (emelt szint). */
function FormatSummary() {
  return (
    <section className="grid" aria-label="Az emelt szintű vizsga felépítése">
      <div className="card">
        <h3>Írásbeli</h3>
        <p className="tabular" style={{ fontSize: '1.4rem', margin: '0 0 6px' }}>
          <strong>240 perc · 100 pont</strong>
        </p>
        <p className="muted">
          A dolgozat 200 pontos, a pontszámot 2-vel osztják (felfelé kerekítve). Segédeszköz: zsebszámológép és vonalzó –{' '}
          <strong>atlasz nem használható.</strong>
        </p>
        <ul>
          <li>50% földrajzi-környezeti ismeretanyag (zárt és nyílt végű feladatok, esszé, rajz)</li>
          <li>20% topográfia (a követelmény névanyaga)</li>
          <li>30% gyakorlati feladat (grafikon- és ábraelemzés, számolás, forráselemzés, prognózis)</li>
        </ul>
      </div>
      <div className="card">
        <h3>Szóbeli</h3>
        <p className="tabular" style={{ fontSize: '1.4rem', margin: '0 0 6px' }}>
          <strong>20 perc · 50 pont</strong>
        </p>
        <p className="muted">Központi tételsor, két feladat: egy természetföldrajzi és egy társadalomföldrajzi (25–25 pont). Atlasz használható.</p>
        <ul>
          <li>Tartalmi összetevők: 20 pont</li>
          <li>Logikus felépítés: 2 pont</li>
          <li>Szaknyelv, térkép- és eszközhasználat: 3 pont</li>
        </ul>
      </div>
    </section>
  );
}

function ExamList() {
  return (
    <section>
      <h2>Korábbi feladatsorok ({EXAM_INDEX.length})</h2>
      <p className="muted">
        Az Oktatási Hivatal által közzétett emelt szintű földrajz írásbelik és javítási-értékelési útmutatók. Teljes lista az eredeti linkekkel:{' '}
        <code>docs/erettsegi-feladatsorok/INDEX.md</code>.
      </p>
      {EXAM_INDEX.length === 0 && <p className="placeholder">A feladatsorok feldolgozása folyamatban.</p>}
      <div className="grid">
        {EXAM_INDEX.map((e) => (
          <Link key={e.id} to={`/vizsga/feladatsor/${e.id}`} className="card is-link">
            <h3>{e.label}</h3>
            <p className="muted tabular" style={{ margin: 0 }}>
              {e.date} · {e.tasks.length} feladat · {e.totalPoints} pont
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ExamPaper({ id }: { id: string }) {
  const exam = examMeta(id);
  const { hash } = useLocation();
  const loaded = useExamTasks(id);
  useEffect(() => {
    if (hash && loaded) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash, id, loaded]);
  if (!exam) return <p>Nincs ilyen feladatsor. <Link to="/vizsga">Vissza</Link></p>;
  const tasks = loaded ?? [];
  return (
    <>
      <PageHead eyebrow="Érettségi feladatsor" title={exam.label} lead={`${exam.date} · emelt szintű írásbeli · ${exam.tasks.length} feladat · ${exam.totalPoints} pont`}>
        <div className="row">
          <a className="btn" href={pdfUrl(exam.files.feladatlap)} target="_blank" rel="noreferrer">
            <FileText size={16} /> Feladatlap (PDF)
          </a>
          <a className="btn" href={pdfUrl(exam.files.utmutato)} target="_blank" rel="noreferrer">
            <FileText size={16} /> Javítási útmutató (PDF)
          </a>
          <a className="btn ghost" href={exam.sourceUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> oktatas.hu
          </a>
          <Link className="btn primary" to={`/vizsga/probavizsga?feladatsor=${exam.id}`}>
            <Play size={16} /> Megírom próbavizsgaként
          </Link>
        </div>
      </PageHead>
      {!loaded && <p className="placeholder" aria-busy="true">Feladatsor betöltése…</p>}
      <nav className="row toc-row" aria-label="Feladatok">
        {exam.tasks.map((t) => (
          <a key={t.no} href={`#f${t.no}`} className="chip">
            {t.no}. {t.title}
          </a>
        ))}
      </nav>
      <div className="stack">
        {tasks.map((t) => (
          <ExamTaskView key={t.no} task={t} headingLevel="h2" />
        ))}
      </div>
    </>
  );
}

const fmt = (s: number) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Mixed paper: topography-heavy tasks first, then the rest, about 200 points from different years. */
function mixedPaper(all: ExamTaskRef[], seed: number): ExamTaskRef[] {
  let x = seed;
  const rnd = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
  const shuffled = [...all].sort(() => rnd() - 0.5);
  const topo = shuffled.filter((t) => t.places.length >= 3);
  const rest = shuffled.filter((t) => t.places.length < 3);
  const out: ExamTaskRef[] = [];
  let pts = 0;
  const used = new Set<string>();
  const take = (pool: ExamTaskRef[], until: number) => {
    for (const t of pool) {
      if (pts >= until) break;
      const key = `${t.examId}-${t.no}`;
      if (used.has(key) || pts + t.points > until + 10) continue;
      used.add(key);
      out.push(t);
      pts += t.points;
    }
  };
  take(topo, 40);
  take(rest, 200);
  return out;
}

function MockExam() {
  const params = new URLSearchParams(useLocation().search);
  const paperId = params.get('feladatsor');
  const [seed, setSeed] = useState(() => Date.now() % 100000);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [left, setLeft] = useState(240 * 60);
  const scores = useRef(new Map<string, PartScore>());
  const [, force] = useState(0);

  const loaded = useExamTasks(paperId ?? '*');
  const tasks = useMemo(() => (!loaded ? [] : paperId ? loaded : mixedPaper(loaded, seed)), [loaded, paperId, seed]);
  const max = tasks.reduce((a, t) => a + t.points, 0);

  useEffect(() => {
    if (!started || submitted) return;
    const t = setInterval(() => setLeft((l) => (l <= 1 ? (setSubmitted(true), 0) : l - 1)), 1000);
    return () => clearInterval(t);
  }, [started, submitted]);

  const earned = [...scores.current.values()].reduce((a, s) => a + s.earned, 0);
  const scored = [...scores.current.values()].reduce((a, s) => a + s.max, 0);
  const exam = paperId ? examMeta(paperId) : undefined;

  if (!loaded) return <p className="placeholder" aria-busy="true">Feladatok betöltése…</p>;

  if (!started) {
    return (
      <div className="card stack">
        <h2>{exam ? `Próbavizsga: ${exam.label}` : 'Vegyes próbavizsga'}</h2>
        <p className="muted">
          {exam
            ? 'Az eredeti feladatsor, 240 perc. A megoldásokat a beadás után látod.'
            : `Korábbi érettségik feladataiból összeállítva: előbb topográfiai, aztán elméleti és számolós feladatok, összesen ${max} pont, 240 perc. Minden feladatnál ott a forrása.`}
        </p>
        <p className="muted">
          A gépileg ellenőrizhető részeket (igaz–hamis, betűjelek, sorszámok) az app pontozza, a többit a hivatalos útmutató alapján te pontozod – ahogy a javító tanár.
        </p>
        <div className="row">
          <button className="btn primary" type="button" onClick={() => setStarted(true)}>
            <Play size={16} /> Indítás (240 perc)
          </button>
          {!exam && (
            <button className="btn" type="button" onClick={() => setSeed((s) => s + 1)}>
              <Shuffle size={16} /> Másik összeállítás
            </button>
          )}
        </div>
        <ol className="muted">
          {tasks.map((t) => (
            <li key={`${t.examId}-${t.no}`}>
              {t.title} <span className="tabular">({t.points} pont)</span> – {t.source}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <>
      <div className="mock-bar card" role="status">
        <Clock size={18} aria-hidden />
        <span className="tabular" aria-label="Hátralévő idő">
          {fmt(left)}
        </span>
        <span className="spacer" />
        {submitted ? (
          <strong className="tabular">
            Eredmény: {earned} / {max} pont{scored < max ? ` (még ${max - scored} pont pontozatlan)` : ''} → {Math.ceil(earned / 2)} vizsgapont
          </strong>
        ) : (
          <button type="button" className="btn primary small" onClick={() => setSubmitted(true)}>
            Beadom
          </button>
        )}
      </div>
      <div className="stack">
        {tasks.map((t, i) => (
          <ExamTaskView
            key={`${t.examId}-${t.no}`}
            task={t}
            lockSolutions={!submitted}
            revealAll={submitted}
            headingLevel="h2"
            onScore={(k, s) => {
              scores.current.set(`${i}:${k}`, s);
              force((n) => n + 1);
            }}
          />
        ))}
      </div>
    </>
  );
}

export default function Vizsga() {
  const { examId, sub } = useParams();
  const examDate = useSettings((s) => s.examDate);
  if (examId) return <ExamPaper id={examId} />;
  if (sub === 'probavizsga')
    return (
      <>
        <PageHead eyebrow="Vizsga" title="Próbavizsga" />
        <MockExam />
      </>
    );
  return (
    <>
      <PageHead
        eyebrow="Vizsga"
        title="Az emelt szintű földrajz érettségi"
        lead={`Még ${daysUntil(examDate)} nap az írásbeliig. Itt a vizsga felépítése, a korábbi feladatsorok és a próbavizsga.`}
      >
        <Link to="/vizsga/probavizsga" className="btn primary">
          <Play size={16} /> Vegyes próbavizsga indítása
        </Link>
      </PageHead>
      <div className="stack" style={{ gap: 28 }}>
        <FormatSummary />
        <ExamList />
      </div>
    </>
  );
}
