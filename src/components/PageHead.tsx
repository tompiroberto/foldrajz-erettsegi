import type { ReactNode } from 'react';

export function PageHead({ eyebrow, title, lead, children }: { eyebrow?: ReactNode; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-head">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      {children}
    </div>
  );
}

/** Placeholder for a feature that arrives in a later build phase. */
export function ComingSoon({ phase, children }: { phase: number; children: ReactNode }) {
  return (
    <div className="placeholder">
      <p>
        <strong>Hamarosan</strong> – a {phase}. építési fázisban készül el.
      </p>
      <p className="muted" style={{ margin: 0 }}>
        {children}
      </p>
    </div>
  );
}
