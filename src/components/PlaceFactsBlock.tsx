// Fekvés + key facts of one topography place (src/content/places-facts), with links to the
// related concepts and processes. Used in the map drawer and in the quiz feedback.
import { Link } from 'react-router-dom';
import { Workflow } from 'lucide-react';
import { loadConcepts, loadPlaceFacts, useLoad } from '@/data/content';
import { PROCESSES } from '@/content/catalog';
import { GeneratedBadge } from './GeneratedBadge';

export function PlaceFactsBlock({ id, compact }: { id: string; compact?: boolean }) {
  const facts = useLoad(loadPlaceFacts);
  const concepts = useLoad(loadConcepts);
  const f = facts?.get(id);
  if (!facts) return null;
  if (!f) {
    return compact ? null : (
      <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
        Ehhez a helyhez még nincs fekvésleírás.
      </p>
    );
  }
  return (
    <div className="place-facts stack" style={{ gap: 8 }}>
      <p style={{ margin: 0 }}>
        <strong>Fekvése:</strong> {f.fekves}
      </p>
      {!compact && f.facts.length > 0 && (
        <ul className="place-fact-list">
          {f.facts.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      )}
      {!compact && ((f.concepts?.length ?? 0) > 0 || (f.processes?.length ?? 0) > 0) && (
        <div className="chip-row">
          {f.concepts?.map((label) => {
            const e = concepts?.byLabel.get(label)?.[0];
            return e ? (
              <Link key={label} className="chip" to={`/elmelet/fogalomtar/${e.id}`}>
                {e.term}
              </Link>
            ) : null;
          })}
          {f.processes?.map((p) => (
            <Link key={p} className="chip chip-theory" to={`/elmelet/folyamatok/${p}`}>
              <Workflow size={12} /> {PROCESSES.find((x) => x.id === p)?.title ?? p}
            </Link>
          ))}
        </div>
      )}
      {!compact && <GeneratedBadge contentId={`place:${id}`} />}
    </div>
  );
}
