// Haladás dashboard (brief §6.9): rings per region / category / topic / hashtag, activity heatmap,
// weak spots by name and a weekly plan towards the exam date.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Flame, Target } from 'lucide-react';
import { PageHead } from '@/components/PageHead';
import { ProgressRing } from '@/components/ProgressRing';
import topo from '../../starter-data/topography.json';
import type { TopographyFile } from '@/data/types';
import { OBJECTIVES, TOPICS } from '@/data/requirements';
import { loadConcepts, useLoad } from '@/data/content';
import { TAGS } from '@/content/tags';
import { PROCESSES } from '@/content/catalog';
import { generatorById } from '@/lib/calc/generators';
import { isDue, statusOf, DAY, type SrsState } from '@/lib/srs';
import { dayKey, streak, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { daysUntil } from './Home';

const PLACES = (topo as TopographyFile).items;
const PLACE_NAME = new Map(PLACES.map((p) => [p.id, p]));
const OBJ = new Map(OBJECTIVES.map((o) => [o.id, o]));
const REGIONS = [...new Set(PLACES.map((p) => p.region))];

interface Tally {
  total: number;
  mastered: number;
  learning: number;
}
const tally = (ids: string[], srs: Record<string, SrsState>): Tally => {
  const t = { total: ids.length, mastered: 0, learning: 0 };
  for (const id of ids) {
    const s = statusOf(srs[id]);
    if (s === 'mastered') t.mastered++;
    else if (s === 'learning') t.learning++;
  }
  return t;
};

function Ring({ title, t, to, small }: { title: string; t: Tally; to?: string; small?: boolean }) {
  const body = (
    <>
      <ProgressRing value={t.total ? t.mastered / t.total : 0} size={small ? 44 : 64} stroke={small ? 5 : 7} showText={!small} label={title} />
      <div style={{ minWidth: 0 }}>
        <div className="dash-title">{title}</div>
        <span className="muted tabular" style={{ fontSize: '0.82rem' }}>
          {t.mastered}/{t.total} elsajátítva{t.learning ? ` · ${t.learning} folyamatban` : ''}
        </span>
      </div>
    </>
  );
  return to ? (
    <Link to={to} className="card row dash-ring is-link">
      {body}
    </Link>
  ) : (
    <div className="card row dash-ring">{body}</div>
  );
}

/** GitHub-style 26-week activity grid. */
function Heatmap({ activity }: { activity: Record<string, number> }) {
  const weeks = 26;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime() - ((weeks - 1) * 7 + ((today.getDay() + 6) % 7)) * DAY;
  const cells: { key: string; n: number; t: number }[] = [];
  for (let t = start; t <= today.getTime(); t += DAY) {
    const key = dayKey(t + DAY / 2);
    cells.push({ key, n: activity[key] ?? 0, t });
  }
  const level = (n: number) => (n === 0 ? 0 : n < 10 ? 1 : n < 25 ? 2 : n < 50 ? 3 : 4);
  return (
    <div className="heatmap-wrap" tabIndex={0} role="region" aria-label="Aktivitási naptár (görgethető)">
      <div className="heatmap" role="img" aria-label={`Aktivitás az elmúlt ${weeks} hétben`}>
        {cells.map((c) => (
          <span key={c.key} className={`hm l${level(c.n)}`} title={`${c.key}: ${c.n} válasz`} />
        ))}
      </div>
      <div className="row muted" style={{ fontSize: '0.8rem', gap: 4 }}>
        kevesebb {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`hm l${l}`} aria-hidden />)} több
      </div>
    </div>
  );
}

export default function Haladas() {
  const srs = useProgress((s) => s.srs);
  const activity = useProgress((s) => s.activity);
  const understood = useProgress((s) => s.understood);
  const examDate = useSettings((s) => s.examDate);
  const dailyGoal = useSettings((s) => s.dailyGoal);
  const concepts = useLoad(loadConcepts);

  const data = useMemo(() => {
    const placeIds = (f: (p: (typeof PLACES)[number]) => boolean) => PLACES.filter(f).map((p) => `place:${p.id}`);
    const regions = REGIONS.map((r) => ({ r, t: tally(placeIds((p) => p.region === r), srs) }));
    const cats = [...new Set(PLACES.map((p) => p.category))].map((c) => ({ c, t: tally(placeIds((p) => p.category === c), srs) }));
    const entries = concepts?.entries.filter((e) => !e.parent) ?? [];
    const topics = Object.entries(TOPICS).map(([n, title]) => {
      const no = Number(n);
      const objs = OBJECTIVES.filter((o) => o.topicNo === no);
      return {
        no,
        title,
        t: tally(entries.filter((e) => e.topicNo === no).map((e) => `concept:${e.id}`), srs),
        cards: objs.filter((o) => understood[o.id] === 'ok').length,
        cardTotal: objs.length,
      };
    });
    const tags = TAGS.filter((t) => !t.tag.endsWith('témakör'))
      .map((tg) => ({ tag: tg.tag, t: tally(entries.filter((e) => e.tags.includes(tg.tag)).map((e) => `concept:${e.id}`), srs) }))
      .filter((x) => x.t.total > 0);

    const all = Object.entries(srs);
    const weak = all
      .filter(([, s]) => s.wrong > 0 && statusOf(s) !== 'mastered')
      .sort((a, b) => b[1].wrong - b[1].correct - (a[1].wrong - a[1].correct))
      .slice(0, 16);
    const now = Date.now();
    const dueIn7 = all.filter(([, s]) => s.seen > 0 && s.due <= now + 7 * DAY).length;
    const answers = Object.values(activity).reduce((a, b) => a + b, 0);
    const last7 = Array.from({ length: 7 }, (_, i) => activity[dayKey(now - i * DAY)] ?? 0).reduce((a, b) => a + b, 0);
    return {
      regions,
      cats,
      topics,
      tags,
      weak,
      dueNow: all.filter(([, s]) => isDue(s, now)).length,
      dueIn7,
      answers,
      last7,
      mastered: all.filter(([, s]) => statusOf(s) === 'mastered').length,
      totalItems: PLACES.length + entries.length,
      unseen: PLACES.length + entries.length - all.filter(([k]) => k.startsWith('place:') || k.startsWith('concept:')).length,
    };
  }, [srs, activity, understood, concepts]);

  const nameOf = (key: string): { label: string; to: string } => {
    const [kind, ...rest] = key.split(':');
    const id = rest.join(':');
    if (kind === 'place') {
      const p = PLACE_NAME.get(id);
      return { label: p ? `${p.name} (${p.region})` : id, to: `/topografia/terkep?hely=${id}` };
    }
    if (kind === 'concept') return { label: concepts?.byId.get(id)?.term ?? id, to: `/elmelet/fogalomtar/${id}` };
    if (kind === 'card') {
      const o = OBJ.get(id);
      return { label: o ? o.text : id, to: o ? `/elmelet/tananyag/${o.subtopicId}#${o.id}` : '/elmelet/tananyag' };
    }
    if (kind === 'process') return { label: PROCESSES.find((p) => p.id === id)?.title ?? id, to: `/elmelet/folyamatok/${id}` };
    if (kind === 'calc') return { label: generatorById(id)?.title ?? id, to: `/elmelet/szamolas/${id}` };
    return { label: key, to: '/' };
  };

  // Weekly plan: spread the unseen items over the days left, leaving the last two weeks for revision.
  const days = examDate ? daysUntil(examDate) : null;
  const studyDays = days !== null ? Math.max(1, days - 14) : null;
  const newPerDay = studyDays ? Math.ceil(data.unseen / studyDays) : null;
  const weakestRegion = [...data.regions].sort((a, b) => a.t.mastered / a.t.total - b.t.mastered / b.t.total)[0];
  const weakestTopic = [...data.topics].sort((a, b) => (a.t.mastered + a.cards) / (a.t.total + a.cardTotal || 1) - (b.t.mastered + b.cards) / (b.t.total + b.cardTotal || 1))[0];

  return (
    <>
      <PageHead eyebrow="Haladás" title="Hol tartasz?" />

      <div className="grid dash-top">
        <div className="card stack">
          <div className="row">
            <Flame size={20} aria-hidden /> <strong className="tabular">{streak(activity)} napos sorozat</strong>
          </div>
          <span className="muted tabular">
            {data.answers} válasz összesen · {data.last7} az elmúlt 7 napban · {data.mastered} elem elsajátítva
          </span>
          <Heatmap activity={activity} />
        </div>
        <div className="card stack">
          <div className="row">
            <CalendarDays size={20} aria-hidden /> <strong>Heti terv</strong>
          </div>
          {days === null ? (
            <p style={{ margin: 0 }}>
              Add meg a vizsga dátumát a <Link to="/beallitasok">Beállításokban</Link>, és kiszámolom a napi adagot.
            </p>
          ) : (
            <ul className="plan-list">
              <li>
                <strong className="tabular">{days}</strong> nap van hátra a vizsgáig{days > 14 ? ', az utolsó 2 hét ismétlésre marad.' : ' – most már az ismétlésé a főszerep.'}
              </li>
              {newPerDay !== null && days > 14 && (
                <li>
                  Még <strong className="tabular">{data.unseen}</strong> elemet nem láttál: ez napi kb. <strong className="tabular">{newPerDay}</strong> új elem
                  {newPerDay + 10 > dailyGoal ? ` – a napi célod (${dailyGoal}) ehhez kevés lehet.` : '.'}
                </li>
              )}
              <li>
                A következő 7 napban kb. <strong className="tabular">{data.dueIn7}</strong> ismétlés esedékes (most: {data.dueNow}).
              </li>
              {weakestRegion && (
                <li>
                  Topográfia: a héten a(z) <Link to={`/topografia/kviz?regio=${encodeURIComponent(weakestRegion.r)}`}>{weakestRegion.r}</Link> legyen a fókusz.
                </li>
              )}
              {weakestTopic && (
                <li>
                  Elmélet: a(z) <Link to={`/elmelet/tananyag#tema-${weakestTopic.no}`}>{weakestTopic.no}. {weakestTopic.title}</Link> témakörön van a legtöbb tennivaló.
                </li>
              )}
            </ul>
          )}
          <Link className="btn primary" to="/ismetles">
            <Target size={16} /> Mai ismétlés
          </Link>
        </div>
      </div>

      <h2 className="dash-h">Topográfia régiónként</h2>
      <div className="grid dash-grid">
        {data.regions.map(({ r, t }) => (
          <Ring key={r} title={r} t={t} to={`/topografia/terkep?regio=${encodeURIComponent(r)}`} />
        ))}
      </div>

      <h2 className="dash-h">Topográfia kategóriánként</h2>
      <div className="grid dash-grid small">
        {data.cats.map(({ c, t }) => (
          <Ring key={c} title={c} t={t} small />
        ))}
      </div>

      <h2 className="dash-h">Elmélet témakörönként</h2>
      <div className="grid dash-grid">
        {data.topics.map((x) => (
          <Link key={x.no} to={`/elmelet/tananyag#tema-${x.no}`} className="card row dash-ring is-link">
            <ProgressRing value={x.t.total ? x.t.mastered / x.t.total : 0} size={64} stroke={7} showText label={`${x.no}. témakör fogalmai`} />
            <div style={{ minWidth: 0 }}>
              <div className="dash-title">
                {x.no}. {x.title}
              </div>
              <span className="muted tabular" style={{ fontSize: '0.82rem' }}>
                {x.t.mastered}/{x.t.total} fogalom · {x.cards}/{x.cardTotal} kártya megértve
              </span>
            </div>
          </Link>
        ))}
      </div>

      {data.tags.length > 0 && (
        <>
          <h2 className="dash-h">Hashtagek szerint</h2>
          <div className="grid dash-grid small">
            {data.tags.map(({ tag, t }) => (
              <Ring key={tag} title={`#${tag}`} t={t} to={`/elmelet/fogalomtar?tag=${encodeURIComponent(tag)}`} small />
            ))}
          </div>
        </>
      )}

      <h2 className="dash-h">Gyenge pontok</h2>
      {data.weak.length ? (
        <ul className="weak-list">
          {data.weak.map(([id, s]) => {
            const n = nameOf(id);
            return (
              <li key={id}>
                <Link to={n.to}>{n.label}</Link>{' '}
                <span className="muted tabular">
                  – {s.wrong} hibás, {s.correct} jó
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">Még nincs hibás válaszod – vagy még nem kezdtél bele. 🙂</p>
      )}
    </>
  );
}
