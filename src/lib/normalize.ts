// Hungarian-aware normalisation and answer checking (brief §6.4).

const DASHES = /[‐-―−-]/g;

/** Lowercase, trim, unify hyphens/dashes/spaces, drop a leading article. Accents are kept. */
export function normalizeHu(s: string): string {
  let t = s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[„”"“'’.,;:!?()[\]]/g, ' ')
    .replace(DASHES, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  t = t.replace(/^(a|az) (?=\S)/, '');
  return t;
}

/** Remove accents as well (ő→o, ű→u, á→a …). */
export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

/** For search: both case- and accent-insensitive. */
export const searchKey = (s: string) => stripAccents(normalizeHu(s));

/**
 * Accepted spellings of an official name. Every name in parentheses is an alias:
 * "Csomolungma (Mt. Everest)" → ["Csomolungma", "Mt. Everest"];
 * "Japán (Keleti)-tenger" → ["Japán-tenger", "Keleti-tenger"];
 * "Tokaji (Zempléni)-hegység" → ["Tokaji-hegység", "Zempléni-hegység"].
 */
export function aliasesOf(name: string): string[] {
  const out = new Set<string>();
  const m = name.match(/^(.*?)\s*\(([^)]+)\)(.*)$/);
  if (!m) {
    out.add(name.trim());
    return [...out];
  }
  const [, before = '', inside = '', after = ''] = m;
  if (after.trim()) {
    // Infix alias: the parenthesised part replaces the word before it.
    out.add(`${before}${after}`.trim());
    out.add(`${inside}${after}`.trim());
  } else {
    out.add(before.trim());
    // "Nagy-Britannia (Anglia, Skócia, Wales) és …" — a list inside, not an alias.
    if (!/,/.test(inside)) out.add(inside.trim());
  }
  out.add(name.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim());
  return [...out].filter(Boolean);
}

/** Optimal string alignment (restricted Damerau–Levenshtein) distance. */
export function damerauLevenshtein(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  if (!n) return m;
  if (!m) return n;
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) => {
    const row = new Array<number>(m + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= m; j++) d[0]![j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[n]![m]!;
}

export type CheckResult =
  | { ok: true; kind: 'exact'; expected: string }
  | { ok: true; kind: 'accent'; expected: string }
  | { ok: true; kind: 'typo'; expected: string; distance: number }
  | { ok: false; expected: string };

/** Typo tolerance: ≤ 1 edit from 5 characters, ≤ 2 edits from 10 characters, none below 5. */
export function allowedTypos(len: number): number {
  if (len >= 10) return 2;
  if (len >= 5) return 1;
  return 0;
}

/**
 * Pairs that look alike but are different official names. A typo match is never allowed
 * onto the other member of the pair (e.g. "Nigeria" is a typo of Nigéria, never of Niger).
 */
function competingNames(expected: string, others: string[]): string[] {
  return others.filter((o) => normalizeHu(o) !== normalizeHu(expected));
}

/**
 * Check a typed answer against an official name (and its aliases).
 * `others` = the other names in the pool, used so a near-miss that is really a
 * different official name is rejected instead of being accepted as a typo.
 */
export function checkAnswer(input: string, expected: string, extraAliases: string[] = [], others: string[] = []): CheckResult {
  const answer = normalizeHu(input);
  const forms = [...aliasesOf(expected), ...extraAliases];
  const display = forms[0] ?? expected;
  if (!answer) return { ok: false, expected: display };

  const normForms = forms.map(normalizeHu);
  if (normForms.includes(answer)) return { ok: true, kind: 'exact', expected: display };

  const bare = stripAccents(answer);
  // Accent-only difference: accepted with a warning, unless the unaccented answer is
  // itself another official name (Niger ≠ Nigéria is not an accent issue).
  const competitors = competingNames(expected, others).map(normalizeHu);
  if (normForms.some((f) => stripAccents(f) === bare) && !competitors.includes(answer)) {
    return { ok: true, kind: 'accent', expected: display };
  }

  if (competitors.includes(answer)) return { ok: false, expected: display };

  let best = Infinity;
  for (const f of normForms) {
    const limit = allowedTypos(f.length);
    if (!limit) continue;
    const dist = Math.min(damerauLevenshtein(answer, f), damerauLevenshtein(bare, stripAccents(f)));
    if (dist <= limit) best = Math.min(best, dist);
  }
  if (best !== Infinity) {
    // Reject when the answer is at least as close to a competing official name.
    const closerOther = competitors.some((c) => damerauLevenshtein(bare, stripAccents(c)) <= best);
    if (!closerOther) return { ok: true, kind: 'typo', expected: display, distance: best };
  }
  return { ok: false, expected: display };
}
