import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import topo from '../../starter-data/topography.json';
import type { TopographyFile } from '@/data/types';
import { PageHead } from '@/components/PageHead';
import { ProgressRing } from '@/components/ProgressRing';
import { useProgress } from '@/store/progress';
import { statusOf } from '@/lib/srs';

const items = (topo as TopographyFile).items;

export default function TopoHome() {
  const srs = useProgress((s) => s.srs);
  const regions = useMemo(() => {
    const map = new Map<string, { name: string; total: number; emelt: number; mastered: number; categories: Set<string> }>();
    for (const i of items) {
      const r = map.get(i.region) ?? { name: i.region, total: 0, emelt: 0, mastered: 0, categories: new Set() };
      r.total++;
      if (i.level === 'emelt') r.emelt++;
      if (statusOf(srs[`place:${i.id}`]) === 'mastered') r.mastered++;
      r.categories.add(i.category);
      map.set(i.region, r);
    }
    return [...map.values()];
  }, [srs]);

  return (
    <>
      <PageHead
        eyebrow="Topográfia"
        title="Az atlasz"
        lead="Az emelt szinten kérdezhető 802 név régiónként. Térképen tanulhatod őket, kártyákkal és kvízzel gyakorolhatod."
      />
      <div className="grid">
        {regions.map((r) => (
          <Link key={r.name} to={`/topografia/terkep?regio=${encodeURIComponent(r.name)}`} className="card is-link">
            <div className="row">
              <h3 style={{ margin: 0 }}>{r.name}</h3>
              <span className="spacer" />
              <ProgressRing value={r.mastered / r.total} size={44} stroke={5} showText label={`${r.name} elsajátítva`} />
            </div>
            <p className="muted tabular" style={{ margin: '8px 0 6px' }}>
              {r.total} név · ebből {r.emelt} csak emelt
            </p>
            <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
              {[...r.categories].join(' · ')}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
