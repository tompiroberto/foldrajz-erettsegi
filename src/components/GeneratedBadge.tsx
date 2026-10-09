import { useState } from 'react';
import { Bot, Flag, ShieldCheck } from 'lucide-react';
import { useProgress } from '@/store/progress';

/**
 * "AI-generált – ellenőrizd a tankönyvvel" marker (brief §8.2). Disappears once the
 * student ticks "Ellenőriztem"; "Hibát találtam" saves a note to the exportable list.
 */
export function GeneratedBadge({ contentId }: { contentId: string }) {
  const reviewed = useProgress((s) => !!s.reviewed[contentId]);
  const setReviewed = useProgress((s) => s.setReviewed);
  const addNote = useProgress((s) => s.addNote);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);

  return (
    <div className="gen-badge">
      {reviewed ? (
        <span className="gen-ok">
          <ShieldCheck size={14} aria-hidden /> Ellenőrizted
        </span>
      ) : (
        <span className="ai-marker">
          <Bot size={14} aria-hidden /> AI-generált – ellenőrizd a tankönyvvel
        </span>
      )}
      <label className="gen-check">
        <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(contentId, e.target.checked)} /> Ellenőriztem
      </label>
      <button type="button" className="btn ghost small" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Flag size={14} /> Hibát találtam
      </button>
      {open && (
        <form
          className="gen-note"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            addNote(contentId, text.trim());
            setText('');
            setOpen(false);
            setSaved(true);
          }}
        >
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Mi a hiba, és mi a helyes? (A Beállításokban exportálhatod.)" aria-label="Hiba leírása" />
          <button type="submit" className="btn small primary">
            Mentés
          </button>
        </form>
      )}
      {saved && (
        <span className="muted" role="status">
          Mentve a hibajegyzetek közé.
        </span>
      )}
    </div>
  );
}
