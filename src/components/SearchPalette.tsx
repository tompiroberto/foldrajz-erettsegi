import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { Search, X } from 'lucide-react';
import type { SearchDoc } from '@/data/searchIndex';

interface SearchUi {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}
export const useSearch = create<SearchUi>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

type SearchFn = (q: string, limit?: number) => SearchDoc[];
let searchFn: Promise<SearchFn> | null = null;
const loadSearch = () => (searchFn ??= import('@/data/searchIndex').then((m) => m.search));

const CHIP: Record<SearchDoc['mode'], { label: string; cls: string }> = {
  topo: { label: 'Topográfia', cls: 'chip-topo' },
  theory: { label: 'Elmélet', cls: 'chip-theory' },
  exam: { label: 'Érettségi', cls: 'chip-exam' },
};

/** Opens on "/" anywhere except inside inputs. */
export function useSearchShortcut() {
  const open = useSearch((s) => s.open);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
}

export function SearchPalette() {
  const { isOpen, close } = useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchDoc[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQ('');
    setResults([]);
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 0);
    setLoading(true);
    void loadSearch().then(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    let alive = true;
    void loadSearch().then((fn) => {
      if (alive) {
        setResults(fn(q));
        setActive(0);
      }
    });
    return () => {
      alive = false;
    };
  }, [q]);

  const go = (d: SearchDoc | undefined) => {
    if (!d) return;
    close();
    navigate(d.to);
  };

  const summary = useMemo(() => {
    if (q.trim().length < 2) return 'Írj be legalább 2 betűt: helynév, fogalom, követelmény vagy érettségi feladat.';
    return results.length ? `${results.length} találat` : 'Nincs találat.';
  }, [q, results]);

  if (!isOpen) return null;
  return (
    <div className="palette-backdrop" onMouseDown={close}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Keresés"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
          else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') go(results[active]);
        }}
      >
        <div className="palette-input">
          <Search size={18} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Keresés: Csád-tó, passzátszél, delelési magasság…"
            aria-label="Keresés"
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `pr-${active}` : undefined}
          />
          <button type="button" className="icon-btn" onClick={close} aria-label="Bezárás">
            <X size={18} />
          </button>
        </div>
        <p className="palette-summary muted" aria-live="polite">
          {loading ? 'Kereső betöltése…' : summary}
        </p>
        <ul id="palette-results" className="palette-results" role="listbox">
          {results.map((r, i) => (
            <li
              key={`${r.kind}-${r.to}-${i}`}
              id={`pr-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
            >
              <span className={`chip ${CHIP[r.mode].cls}`}>{CHIP[r.mode].label}</span>
              <span className="palette-title">{r.title}</span>
              <span className="palette-sub muted">{r.subtitle}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
