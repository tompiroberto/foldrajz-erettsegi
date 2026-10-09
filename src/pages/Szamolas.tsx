import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Calculator, Check, Eye, Lightbulb, RefreshCw, X } from 'lucide-react';
import { PageHead } from '@/components/PageHead';
import { GENERATORS, generatorById } from '@/lib/calc/generators';
import { checkNumeric, rngFrom } from '@/lib/calc/core';
import { gradeFromAnswer, statusOf } from '@/lib/srs';
import { itemId, useProgress } from '@/store/progress';

const TOPIC_TITLE: Record<string, string> = {
  '1': '1. Tájékozódás a földrajzi térben',
  '2': '2. Tájékozódás a kozmikus térben és az időben',
  '3': '3. A geoszférák földrajza',
  '5': '5. Népesség és települések',
  '6': '6. Gazdaság és pénzügyek',
};

function Problem({ id }: { id: string }) {
  const gen = generatorById(id);
  const [params, setParams] = useSearchParams();
  const seed = Number(params.get('seed')) || 1;
  const problem = useMemo(() => gen?.generate(rngFrom(seed * 7919)), [gen, seed]);
  const [inputs, setInputs] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const [solution, setSolution] = useState(false);
  const rate = useProgress((s) => s.rate);
  const visit = useProgress((s) => s.visit);

  useEffect(() => {
    setInputs([]);
    setChecked(false);
    setHint(false);
    setSolution(false);
  }, [seed, id]);
  useEffect(() => {
    if (gen) visit(`/elmelet/szamolas/${id}`, `Számolás: ${gen.title}`);
  }, [gen, id, visit]);

  if (!gen || !problem) return <p>Nincs ilyen feladattípus. <Link to="/elmelet/szamolas">Vissza</Link></p>;
  const results = problem.answers.map((a, i) => checkNumeric(inputs[i] ?? '', a.answer));
  const allOk = results.every(Boolean);

  const check = () => {
    setChecked(true);
    rate(itemId('calc', id), gradeFromAnswer(allOk, allOk && hint));
  };

  return (
    <>
      <PageHead eyebrow={<><Calculator size={14} /> Számolás · {gen.level === 'emelt' ? 'emelt' : 'közép- és emelt szint'}</>} title={gen.title} />
      <div className="card stack calc-card">
        <p className="calc-question">{problem.question}</p>
        {problem.data && (
          <table className="data-table">
            <tbody>
              {problem.data.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td className="tabular">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          {problem.answers.map((a, i) => (
            <label key={a.label} className="row calc-answer">
              <span className="calc-label">{a.label}</span>
              <input
                type="text"
                inputMode={typeof a.answer.value === 'number' ? 'decimal' : 'text'}
                value={inputs[i] ?? ''}
                onChange={(e) => setInputs((xs) => Object.assign([...xs], { [i]: e.target.value }))}
                disabled={checked}
                aria-invalid={checked && !results[i]}
                placeholder={typeof a.answer.value === 'string' && a.answer.value.includes(':') ? 'óó:pp' : ''}
              />
              {a.answer.unit && <span className="muted">{a.answer.unit}</span>}
              {checked &&
                (results[i] ? (
                  <span className="feedback-ok row" style={{ gap: 4 }}>
                    <Check size={18} aria-hidden /> Helyes
                  </span>
                ) : (
                  <span className="feedback-bad row" style={{ gap: 4 }}>
                    <X size={18} aria-hidden /> Helyesen: {a.answer.display}
                  </span>
                ))}
            </label>
          ))}
          <div className="row">
            {!checked && (
              <button type="submit" className="btn primary">
                <Check size={16} /> Ellenőrzés
              </button>
            )}
            <button type="button" className="btn" onClick={() => setHint(true)} disabled={hint}>
              <Lightbulb size={16} /> Tipp
            </button>
            <button type="button" className="btn" onClick={() => setSolution((s) => !s)} aria-expanded={solution}>
              <Eye size={16} /> Megoldás menete
            </button>
            <span className="spacer" />
            <button type="button" className="btn" onClick={() => setParams({ seed: String(seed + 1) })}>
              <RefreshCw size={16} /> Új feladat
            </button>
          </div>
        </form>
        <div aria-live="polite">
          {checked && <p className={allOk ? 'feedback-ok' : 'feedback-bad'}>{allOk ? '✓ Szép, minden stimmel!' : '✕ Nézd meg a megoldás menetét, aztán próbáld újra egy új feladattal.'}</p>}
          {hint && (
            <div className="tip-box">
              <strong>Tipp:</strong> {problem.hint}
            </div>
          )}
        </div>
        {(solution || checked) && (
          <ol className="calc-steps">
            {problem.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}

export default function Szamolas() {
  const { calcId } = useParams();
  const srs = useProgress((s) => s.srs);
  const navigate = useNavigate();
  if (calcId) return <Problem id={calcId} />;
  const groups = Object.entries(
    GENERATORS.reduce<Record<string, typeof GENERATORS>>((acc, g) => {
      const t = g.topic.split('.')[0]!;
      (acc[t] ??= []).push(g);
      return acc;
    }, {}),
  );
  return (
    <>
      <PageHead
        eyebrow="Elmélet"
        title="Számolás"
        lead={`${GENERATORS.length} feladattípus a követelmények minden számítási feladatára, mindig új adatokkal, kidolgozott megoldással.`}
      />
      {groups.map(([t, gens]) => (
        <section key={t} style={{ marginBottom: 24 }}>
          <h2>{TOPIC_TITLE[t] ?? `${t}. témakör`}</h2>
          <div className="grid">
            {gens.map((g) => {
              const st = statusOf(srs[itemId('calc', g.id)]);
              return (
                <button key={g.id} type="button" className="card is-link calc-tile" onClick={() => navigate(`/elmelet/szamolas/${g.id}?seed=${Math.floor(Math.random() * 1e6)}`)}>
                  <h3>{g.title}</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    {g.level === 'emelt' ? <span className="badge-emelt">EMELT</span> : null} {st === 'new' ? 'Még nem próbáltad' : st === 'mastered' ? 'Megy már' : 'Gyakorlás alatt'}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
