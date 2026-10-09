import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { Diagram, hasDiagram } from '@/components/diagrams';
import { DIAGRAMS, PROCESSES } from '@/content/catalog';

/** Gallery of every diagram with a step selector (for review). /elmelet/abrak?d=<key>&step=<n> */
export default function Abrak() {
  const [params] = useSearchParams();
  const only = params.get('d');
  const keys = Object.keys(DIAGRAMS).filter((k) => !only || k === only);
  return (
    <>
      <PageHead eyebrow="Elmélet" title="Ábrák" lead={`${Object.keys(DIAGRAMS).filter(hasDiagram).length} / ${Object.keys(DIAGRAMS).length} ábra elkészült.`} />
      <div className="grid diagram-gallery">
        {keys.map((k) => (
          <DiagramCard key={k} id={k} initialStep={Number(params.get('step') ?? 0)} />
        ))}
      </div>
    </>
  );
}

function DiagramCard({ id, initialStep }: { id: string; initialStep: number }) {
  const outline = PROCESSES.find((p) => p.diagram === id)?.outline;
  const [step, setStep] = useState(initialStep);
  return (
    <section className="card stack" data-diagram={id}>
      <h3 style={{ margin: 0 }}>
        {id} <span className="muted">– {DIAGRAMS[id]}</span>
      </h3>
      {hasDiagram(id) ? <Diagram id={id} step={step} caption={false} /> : <p className="placeholder">Még nincs megrajzolva.</p>}
      {outline && (
        <label className="stack" style={{ gap: 4 }}>
          <span className="muted">
            {step + 1}. lépés: {outline[step]}
          </span>
          <input type="range" min={0} max={outline.length - 1} value={step} onChange={(e) => setStep(Number(e.target.value))} />
        </label>
      )}
    </section>
  );
}
