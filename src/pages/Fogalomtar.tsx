import { useEffect, useMemo } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Fuse from 'fuse.js';
import { ArrowLeft, Check, MapPin } from 'lucide-react';
import { PageHead } from '@/components/PageHead';
import { GeneratedBadge } from '@/components/GeneratedBadge';
import { loadConcepts, useLoad, type ConceptEntry, type ConceptIndex } from '@/data/content';
import { TOPICS } from '@/data/requirements';
import { TAGS } from '@/content/tags';
import { searchKey } from '@/lib/normalize';
import { statusOf } from '@/lib/srs';
import { itemId, useProgress } from '@/store/progress';
import topo from '../../starter-data/topography.json';
import type { TopographyFile } from '@/data/types';

const PLACE_NAME = new Map((topo as TopographyFile).items.map((i) => [i.id, i.name]));
const collator = new Intl.Collator('hu', { sensitivity: 'base' });
const DIGRAPHS = ['dzs', 'cs', 'dz', 'gy', 'ly', 'ny', 'sz', 'ty', 'zs'];
const FOLD: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ő: 'ö', ú: 'u', ű: 'ü' };

/** Sort key: no leading quote or article ("a bolygók…" → "bolygók…"). */
const sortKey = (term: string) => term.replace(/^[„"'(]+/, '').replace(/^(a|az)\s+/i, '').toLowerCase();

/** Hungarian index letter: digraphs count as one letter (Cs, Gy, Sz…), long vowels fold to short. */
export function indexLetter(term: string): string {
  const t = sortKey(term);
  const d = DIGRAPHS.find((g) => t.startsWith(g));
  if (d) return d[0]!.toUpperCase() + d.slice(1);
  const c = t[0] ?? '#';
  const f = FOLD[c] ?? c;
  return /[a-zöü]/.test(f) ? f.toUpperCase() : '#';
}
const ALPHABET = ['A', 'B', 'C', 'Cs', 'D', 'Dz', 'Dzs', 'E', 'F', 'G', 'Gy', 'H', 'I', 'J', 'K', 'L', 'Ly', 'M', 'N', 'Ny', 'O', 'Ö', 'P', 'Q', 'R', 'S', 'Sz', 'T', 'Ty', 'U', 'Ü', 'V', 'W', 'X', 'Y', 'Z', 'Zs', '#'];

function KnowButtons({ id }: { id: string }) {
  const st = statusOf(useProgress((s) => s.srs[itemId('concept', id)]));
  const rate = useProgress((s) => s.rate);
  return (
    <div className="row" role="group" aria-label="Mennyire tudod?">
      <span className="muted">{st === 'new' ? 'Még nem jelölted' : st === 'mastered' ? 'Elsajátítva' : 'Tanulás alatt'}</span>
      <button type="button" className="btn small" onClick={() => rate(itemId('concept', id), 0)}>
        Még nem tudom
      </button>
      <button type="button" className="btn small primary" onClick={() => rate(itemId('concept', id), 2)}>
        <Check size={14} /> Tudom
      </button>
    </div>
  );
}

function EntryView({ idx, entry }: { idx: ConceptIndex; entry: ConceptEntry }) {
  const visit = useProgress((s) => s.visit);
  useEffect(() => visit(`/elmelet/fogalomtar/${entry.id}`, `Fogalom: ${entry.term}`), [entry, visit]);
  const parent = entry.parent ? idx.byId.get(entry.parent) : undefined;
  const children = idx.entries.filter((e) => e.parent === entry.id);
  const related = (entry.related ?? []).map((r) => idx.byId.get(r)).filter(Boolean) as ConceptEntry[];
  return (
    <>
      <Link to="/elmelet/fogalomtar" className="btn ghost small">
        <ArrowLeft size={16} /> Fogalomtár
      </Link>
      <article className="card stack concept-entry" style={{ marginTop: 12 }}>
        <div className="row">
          <h1 style={{ margin: 0 }}>{entry.term}</h1>
          {entry.level === 'emelt' && <span className="badge-emelt">EMELT</span>}
        </div>
        {!!entry.aliases?.length && <p className="muted" style={{ margin: 0 }}>Más néven: {entry.aliases.join(', ')}</p>}
        {parent && (
          <p style={{ margin: 0 }}>
            Része: <Link to={`/elmelet/fogalomtar/${parent.id}`}>{parent.term}</Link>
          </p>
        )}
        <p className="concept-def">{entry.definition}</p>
        {entry.example && (
          <div className="tip-box">
            <strong>Példa:</strong> {entry.example}
            {!!entry.examplePlaces?.length && (
              <div className="row" style={{ marginTop: 6 }}>
                {entry.examplePlaces.map((p) => (
                  <Link key={p} className="chip chip-topo" to={`/topografia/terkep?hely=${encodeURIComponent(p)}`}>
                    <MapPin size={12} /> {PLACE_NAME.get(p) ?? p}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        {children.length > 0 && (
          <div className="stack" style={{ gap: 6 }}>
            <strong>Fajtái, részei</strong>
            <div className="chip-row">
              {children.map((c) => (
                <Link key={c.id} className="chip" to={`/elmelet/fogalomtar/${c.id}`}>
                  {c.term}
                </Link>
              ))}
            </div>
          </div>
        )}
        {related.length > 0 && (
          <div className="stack" style={{ gap: 6 }}>
            <strong>Kapcsolódó fogalmak</strong>
            <div className="chip-row">
              {related.map((c) => (
                <Link key={c.id} className="chip" to={`/elmelet/fogalomtar/${c.id}`}>
                  {c.term}
                </Link>
              ))}
            </div>
          </div>
        )}
        <p className="muted" style={{ margin: 0 }}>
          {entry.topicNo}. {TOPICS[entry.topicNo]} · {entry.subtopic}
        </p>
        <div className="chip-row">
          {entry.tags.map((t) => (
            <Link key={t} className="chip" to={`/elmelet/fogalomtar?tag=${encodeURIComponent(t)}`}>
              #{t}
            </Link>
          ))}
        </div>
        {!!entry.sourceLabels?.length && <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>Hivatalos címke: „{entry.sourceLabels.join('”, „')}”</p>}
        <KnowButtons id={entry.id} />
        <GeneratedBadge contentId={`concept:${entry.id}`} />
      </article>
    </>
  );
}

export default function Fogalomtar() {
  const { slug } = useParams();
  const idx = useLoad(loadConcepts);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') ?? '';
  const tags = params.getAll('tag');
  const any = params.get('mod') === 'vagy';
  const topic = Number(params.get('tema') ?? 0);
  const level = params.get('szint') ?? 'all';

  const fuse = useMemo(
    () =>
      idx &&
      new Fuse(
        idx.entries.map((e) => ({ e, key: searchKey([e.term, ...(e.aliases ?? [])].join(' ')), def: searchKey(e.definition) })),
        { keys: [{ name: 'key', weight: 0.8 }, { name: 'def', weight: 0.2 }], threshold: 0.3, ignoreLocation: true },
      ),
    [idx],
  );

  const list = useMemo(() => {
    if (!idx) return [];
    let l = q.trim().length >= 2 && fuse ? fuse.search(searchKey(q)).map((r) => r.item.e) : idx.entries.filter((e) => !e.parent);
    if (tags.length) l = l.filter((e) => (any ? tags.some((t) => e.tags.includes(t)) : tags.every((t) => e.tags.includes(t))));
    if (topic) l = l.filter((e) => e.topicNo === topic);
    if (level === 'emelt') l = l.filter((e) => e.level === 'emelt');
    return q.trim().length >= 2 ? l : [...l].sort((a, b) => collator.compare(sortKey(a.term), sortKey(b.term)));
  }, [idx, fuse, q, tags, any, topic, level]);

  if (!idx) return <div className="skeleton" style={{ height: 300 }} aria-busy="true" />;
  if (slug) {
    const e = idx.byId.get(slug);
    return e ? <EntryView idx={idx} entry={e} /> : <p>Nincs ilyen fogalom. <Link to="/elmelet/fogalomtar">Vissza</Link></p>;
  }
  // A link with an exact official label (from cards, exams) opens its entry.
  const exact = q && idx.byLabel.get(q)?.[0];
  if (exact) return <Navigate to={`/elmelet/fogalomtar/${exact.id}`} replace />;

  const set = (k: string, v: string | null, multi = false) => {
    const n = new URLSearchParams(params);
    if (multi && v) {
      const cur = n.getAll(k);
      n.delete(k);
      (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).forEach((x) => n.append(k, x));
    } else if (v) n.set(k, v);
    else n.delete(k);
    setParams(n, { replace: true });
  };
  const groups = new Map<string, ConceptEntry[]>();
  if (q.trim().length < 2) for (const e of list) groups.set(indexLetter(e.term), [...(groups.get(indexLetter(e.term)) ?? []), e]);

  return (
    <>
      <PageHead eyebrow="Elmélet" title="Fogalomtár" lead={`${idx.entries.length} szócikk – mind az 1025 hivatalos fogalom, meghatározással, példával és hashtagekkel.`} />
      <div className="dict-filters card stack">
        <input type="search" value={q} onChange={(e) => set('q', e.target.value || null)} placeholder="Keresés: fogalom, rokon szó, meghatározás…" aria-label="Keresés a fogalmak között" />
        <div className="row">
          <select value={topic} onChange={(e) => set('tema', e.target.value === '0' ? null : e.target.value)} aria-label="Témakör">
            <option value={0}>Minden témakör</option>
            {Object.entries(TOPICS).map(([n, t]) => (
              <option key={n} value={n}>
                {n}. {t}
              </option>
            ))}
          </select>
          <select value={level} onChange={(e) => set('szint', e.target.value === 'all' ? null : e.target.value)} aria-label="Szint">
            <option value="all">Közép + emelt</option>
            <option value="emelt">Csak emelt</option>
          </select>
          <label className="row" style={{ gap: 6 }}>
            <input type="checkbox" checked={any} onChange={(e) => set('mod', e.target.checked ? 'vagy' : null)} /> Hashtagek: VAGY (alapból ÉS)
          </label>
          <span className="muted tabular" aria-live="polite">
            {list.length} találat
          </span>
        </div>
        <div className="chip-row tag-cloud">
          {TAGS.map((t) => (
            <button key={t.tag} type="button" title={t.desc} className={`chip${tags.includes(t.tag) ? ' selected' : ''}`} aria-pressed={tags.includes(t.tag)} onClick={() => set('tag', t.tag, true)}>
              #{t.tag}
            </button>
          ))}
        </div>
      </div>

      <div className="dict-layout">
        {groups.size > 0 && (
          <nav className="letter-rail" aria-label="Betűk">
            {ALPHABET.map((l) =>
              groups.has(l) ? (
                <a key={l} href={`#betu-${l}`}>
                  {l}
                </a>
              ) : (
                <span key={l} aria-hidden>
                  {l}
                </span>
              ),
            )}
          </nav>
        )}
        <div className="stack" style={{ flex: 1, minWidth: 0 }}>
          {groups.size > 0
            ? ALPHABET.filter((l) => groups.has(l)).map((l) => (
                <section key={l} id={`betu-${l}`} className="dict-group">
                  <h2>{l}</h2>
                  <ul className="concept-list">
                    {groups.get(l)!.map((e) => (
                      <ConceptRow key={e.id} e={e} onOpen={() => navigate(`/elmelet/fogalomtar/${e.id}`)} />
                    ))}
                  </ul>
                </section>
              ))
            : (
              <ul className="concept-list">
                {list.map((e) => (
                  <ConceptRow key={e.id} e={e} onOpen={() => navigate(`/elmelet/fogalomtar/${e.id}`)} />
                ))}
              </ul>
            )}
          {!list.length && <p className="placeholder">Nincs találat. Próbálj kevesebb szűrőt.</p>}
        </div>
      </div>
    </>
  );
}

function ConceptRow({ e, onOpen }: { e: ConceptEntry; onOpen: () => void }) {
  return (
    <li>
      <button type="button" className="card is-link concept-row" onClick={onOpen}>
        <span className="row" style={{ gap: 6 }}>
          <strong>{e.term}</strong>
          {e.level === 'emelt' && <span className="badge-emelt">EMELT</span>}
        </span>
        <span className="muted concept-snippet">{e.definition}</span>
      </button>
    </li>
  );
}
