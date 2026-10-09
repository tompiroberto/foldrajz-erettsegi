import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ConceptEntry } from '@/data/content';

/** A concept that may be auto-linked inside a text. */
export interface LinkTerm {
  forms: string[];
  entry: ConceptEntry;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Minimal markdown for generated texts: paragraphs (blank line), "- " bullet lists and
 * **bold**. The first occurrence of each given concept is linked to the dictionary with a
 * hover/focus preview of its definition.
 */
export function RichText({ text, terms = [] }: { text: string; terms?: LinkTerm[] }) {
  const used = new Set<string>();
  // Longer forms first so "mérsékelt övezeti ciklon" wins over "ciklon".
  const all = terms.flatMap((t) => t.forms.filter((f) => f.length >= 4).map((f) => ({ f, t }))).sort((a, b) => b.f.length - a.f.length);
  const re = all.length ? new RegExp(`(${all.map((x) => esc(x.f)).join('|')})`, 'giu') : null;

  const inline = (s: string, key: string): ReactNode[] => {
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={`${key}b${i}`}>{p.slice(2, -2)}</strong>;
      if (!re) return <Fragment key={`${key}t${i}`}>{p}</Fragment>;
      const out: ReactNode[] = [];
      let last = 0;
      for (const m of p.matchAll(re)) {
        const hit = all.find((x) => x.f.toLowerCase() === m[0].toLowerCase());
        if (!hit || used.has(hit.t.entry.id)) continue;
        // Whole words only (Hungarian suffixes may follow: "ciklonok").
        const before = p[m.index! - 1];
        if (before && /[\p{L}]/u.test(before)) continue;
        used.add(hit.t.entry.id);
        out.push(p.slice(last, m.index));
        out.push(
          <span key={`${key}l${m.index}`} className="term-link">
            <Link to={`/elmelet/fogalomtar/${hit.t.entry.id}`}>{m[0]}</Link>
            <span className="term-preview" role="tooltip">
              <strong>{hit.t.entry.term}</strong> {hit.t.entry.definition}
            </span>
          </span>,
        );
        last = m.index! + m[0].length;
      }
      out.push(p.slice(last));
      return <Fragment key={`${key}t${i}`}>{out}</Fragment>;
    });
  };

  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="rich-text">
      {blocks.map((b, bi) => {
        const lines = b.split('\n');
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return (
            <ul key={bi}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-•]\s+/, ''), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        // Mixed block: leading text then bullets.
        const firstBullet = lines.findIndex((l) => /^\s*[-•]\s+/.test(l));
        if (firstBullet > 0) {
          return (
            <Fragment key={bi}>
              <p>{inline(lines.slice(0, firstBullet).join(' '), `${bi}p`)}</p>
              <ul>
                {lines.slice(firstBullet).map((l, li) => (
                  <li key={li}>{inline(l.replace(/^\s*[-•]\s+/, ''), `${bi}-${li}`)}</li>
                ))}
              </ul>
            </Fragment>
          );
        }
        return <p key={bi}>{inline(lines.join(' '), `${bi}`)}</p>;
      })}
    </div>
  );
}
