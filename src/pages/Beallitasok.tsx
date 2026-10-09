import { useRef, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { PageHead } from '@/components/PageHead';
import { DEFAULT_SETTINGS, useSettings, type Settings } from '@/store/settings';
import { exportProgress, parseImport, useProgress } from '@/store/progress';

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function Beallitasok() {
  const s = useSettings();
  const progress = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const doExport = () => {
    const { srs, reviewed, notes, understood, activity, lastVisited } = useProgress.getState();
    const { set: _s, reset: _r, ...settings } = useSettings.getState();
    void _s;
    void _r;
    const today = new Date().toISOString().slice(0, 10);
    download(`foldrajz-haladas-${today}.json`, exportProgress({ srs, reviewed, notes, understood, activity, lastVisited }, settings));
  };

  const doImport = async (f: File) => {
    try {
      const { progress: p, settings } = parseImport(JSON.parse(await f.text()));
      progress.importData(p);
      if (settings) s.set({ ...DEFAULT_SETTINGS, ...(settings as Partial<Settings>) });
      setMsg({ ok: true, text: `Betöltve: ${Object.keys(p.srs).length} elem haladása.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Nem sikerült betölteni.' });
    }
  };

  return (
    <>
      <PageHead eyebrow="Beállítások" title="Beállítások" />
      <div className="stack" style={{ gap: 20, maxWidth: 720 }}>
        <section className="card stack">
          <h2>Tanulás</h2>
          <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend>Szint</legend>
            <label className="row">
              <input type="radio" name="level" checked={s.levelFilter === 'all'} onChange={() => s.set({ levelFilter: 'all' })} />
              Minden (közép + emelt) – ajánlott, emelten minden kell
            </label>
            <label className="row">
              <input type="radio" name="level" checked={s.levelFilter === 'emelt'} onChange={() => s.set({ levelFilter: 'emelt' })} />
              Csak az emelt szintű többlet
            </label>
          </fieldset>
          <label className="row">
            Napi cél:
            <input
              type="number"
              min={5}
              max={300}
              value={s.dailyGoal}
              onChange={(e) => s.set({ dailyGoal: Math.max(5, Math.min(300, Number(e.target.value) || 40)) })}
              style={{ width: 90 }}
            />
            elem (~{Math.round(s.dailyGoal / 2)} perc)
          </label>
          <label className="row">
            Az írásbeli napja:
            <input type="date" value={s.examDate} onChange={(e) => e.target.value && s.set({ examDate: e.target.value })} />
          </label>
        </section>

        <section className="card stack">
          <h2>Megjelenés</h2>
          <label className="row">
            Téma:
            <select value={s.theme} onChange={(e) => s.set({ theme: e.target.value as Settings['theme'] })}>
              <option value="system">Rendszer szerint</option>
              <option value="light">Világos</option>
              <option value="dark">Sötét</option>
            </select>
          </label>
          <label className="row">
            <input type="checkbox" checked={s.animations} onChange={(e) => s.set({ animations: e.target.checked })} />
            Animációk és mozgó háttér
          </label>
          <label className="row">
            <input type="checkbox" checked={s.sound} onChange={(e) => s.set({ sound: e.target.checked })} />
            Hangjelzés a kvízekben
          </label>
        </section>

        <section className="card stack">
          <h2>Haladás mentése</h2>
          <p className="muted">
            A haladásod csak ebben a böngészőben van. Mentsd fájlba, és töltsd be a telefonodon (vagy fordítva).
          </p>
          <div className="row">
            <button type="button" className="btn primary" onClick={doExport}>
              <Download size={16} /> Exportálás (.json)
            </button>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Importálás
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void doImport(f);
                e.target.value = '';
              }}
            />
          </div>
          {msg && (
            <p role="status" className={msg.ok ? 'feedback-ok' : 'feedback-bad'}>
              {msg.ok ? '✓ ' : '✕ '}
              {msg.text}
            </p>
          )}
        </section>

        <section className="card stack">
          <h2>Hibajegyzetek ({progress.notes.length})</h2>
          <p className="muted">A „Hibát találtam” gombbal mentett megjegyzéseid. Exportáld, és küldd el annak, aki javítja a tartalmat.</p>
          {progress.notes.length > 0 && (
            <>
              <ul>
                {progress.notes.map((n) => (
                  <li key={n.id}>
                    <code>{n.contentId}</code>: {n.text}{' '}
                    <button type="button" className="btn ghost small" onClick={() => progress.removeNote(n.id)} aria-label="Jegyzet törlése">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn small" onClick={() => download('foldrajz-hibajegyzetek.json', progress.notes)}>
                <Download size={16} /> Jegyzetek exportálása
              </button>
            </>
          )}
        </section>

        <section className="card stack">
          <h2>Visszaállítás</h2>
          <div className="row">
            <button
              type="button"
              className="btn"
              onClick={() => confirm('Biztosan törlöd az összes haladást? Ezt nem lehet visszavonni.') && progress.resetAll()}
            >
              <Trash2 size={16} /> Haladás törlése
            </button>
            <button type="button" className="btn" onClick={() => s.reset()}>
              Beállítások alaphelyzetbe
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
