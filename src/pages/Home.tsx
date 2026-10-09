import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Compass, Flame, Layers, RotateCcw } from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
import { TOTAL_CONCEPT_LABELS, TOTAL_PLACES } from '@/data/counts';
import { useDueCount, useMasteredShare } from '@/store/selectors';
import { streak, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

export function daysUntil(iso: string, now = new Date()): number {
  const target = new Date(`${iso}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86_400_000));
}

export default function Home() {
  const topo = useMasteredShare('place:', TOTAL_PLACES);
  const theory = useMasteredShare('concept:', TOTAL_CONCEPT_LABELS);
  const due = useDueCount();
  const goal = useSettings((s) => s.dailyGoal);
  const examDate = useSettings((s) => s.examDate);
  const activity = useProgress((s) => s.activity);
  const last = useProgress((s) => s.lastVisited);
  const days = daysUntil(examDate);
  const st = streak(activity);

  return (
    <div className="home">
      <div className="page-head">
        <div className="eyebrow">Emelt szintű földrajz érettségi</div>
        <h1>Mit gyakorolsz ma?</h1>
        <p className="lead">Válassz módot: a térképes névanyag, vagy a tananyag, a fogalmak és a folyamatok.</p>
      </div>

      <div className="home-modes">
        <Link to="/topografia" className="card is-link mode-card mode-card-topo">
          <div className="mode-card-bg" aria-hidden />
          <div className="row">
            <Compass size={22} aria-hidden />
            <span className="eyebrow-inline">Topográfia</span>
          </div>
          <h2>Az atlasz</h2>
          <p className="muted">802 hivatalos név vaktérképen: tájak, vizek, országok, városok, megyék.</p>
          <div className="row">
            <ProgressRing value={topo} size={56} stroke={6} showText label="Topográfia elsajátítva" />
            <span className="muted tabular">{Math.round(topo * TOTAL_PLACES)} / {TOTAL_PLACES} elsajátítva</span>
            <span className="spacer" />
            <ArrowRight aria-hidden />
          </div>
        </Link>
        <Link to="/elmelet" className="card is-link mode-card mode-card-theory">
          <div className="mode-card-bg" aria-hidden />
          <div className="row">
            <Layers size={22} aria-hidden />
            <span className="eyebrow-inline">Elmélet</span>
          </div>
          <h2>A rétegek</h2>
          <p className="muted">10 témakör, 1025 fogalom, folyamatok, számolás és érettségi feladatok.</p>
          <div className="row">
            <ProgressRing value={theory} size={56} stroke={6} showText label="Fogalmak elsajátítva" />
            <span className="muted tabular">{Math.round(theory * TOTAL_CONCEPT_LABELS)} / {TOTAL_CONCEPT_LABELS} elsajátítva</span>
            <span className="spacer" />
            <ArrowRight aria-hidden />
          </div>
        </Link>
      </div>

      <div className="grid home-stats">
        <Link to="/ismetles" className="card is-link">
          <RotateCcw aria-hidden />
          <h3>Mai ismétlés</h3>
          <p className="muted">
            {due > 0
              ? `Ma ${due} elem vár ismétlésre (~${Math.max(1, Math.round(due / 2))} perc).`
              : `Nincs esedékes elem – kezdj ${goal} új elemmel!`}
          </p>
        </Link>
        <Link to="/vizsga" className="card is-link">
          <CalendarClock aria-hidden />
          <h3 className="tabular">{days} nap</h3>
          <p className="muted">az írásbeliig ({examDate.replaceAll('-', '. ')}.). 44 korábbi feladatsor vár.</p>
        </Link>
        <Link to="/haladas" className="card is-link">
          <Flame aria-hidden />
          <h3 className="tabular">{st} napos sorozat</h3>
          <p className="muted">{st ? 'Szép, tartsd meg ma is!' : 'Egy válasz ma, és indul a sorozat.'}</p>
        </Link>
        {last && (
          <Link to={last.path} className="card is-link">
            <ArrowRight aria-hidden />
            <h3>Folytasd ott, ahol abbahagytad</h3>
            <p className="muted">{last.label}</p>
          </Link>
        )}
      </div>
    </div>
  );
}
