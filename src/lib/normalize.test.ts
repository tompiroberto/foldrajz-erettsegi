import { describe, expect, it } from 'vitest';
import { aliasesOf, checkAnswer, damerauLevenshtein, normalizeHu, searchKey } from './normalize';

describe('normalizeHu', () => {
  it('lowercases, trims and collapses spaces', () => {
    expect(normalizeHu('  Csád-TÓ  ')).toBe('csád tó');
  });
  it('treats hyphen, en dash and space as equal', () => {
    expect(normalizeHu('Duna–Tisza köze')).toBe(normalizeHu('Duna-Tisza köze'));
    expect(normalizeHu('Duna Tisza köze')).toBe(normalizeHu('Duna-Tisza köze'));
  });
  it('strips a leading article', () => {
    expect(normalizeHu('a Balaton')).toBe('balaton');
    expect(normalizeHu('Az Alföld')).toBe('alföld');
  });
  it('keeps a word that only starts like an article', () => {
    expect(normalizeHu('Alpok')).toBe('alpok');
    expect(normalizeHu('Azori-szigetek')).toBe('azori szigetek');
  });
  it('searchKey ignores accents', () => {
    expect(searchKey('Győr')).toBe(searchKey('gyor'));
  });
});

describe('aliasesOf', () => {
  it('splits a trailing parenthesised alias', () => {
    expect(aliasesOf('Csomolungma (Mt. Everest)')).toEqual(expect.arrayContaining(['Csomolungma', 'Mt. Everest']));
  });
  it('handles an infix alias', () => {
    expect(aliasesOf('Japán (Keleti)-tenger')).toEqual(expect.arrayContaining(['Japán-tenger', 'Keleti-tenger']));
    expect(aliasesOf('Tokaji (Zempléni)-hegység')).toEqual(expect.arrayContaining(['Tokaji-hegység', 'Zempléni-hegység']));
  });
  it('does not treat a list in parentheses as an alias', () => {
    const a = aliasesOf('Nagy-Britannia (Anglia, Skócia, Wales) és Észak-Írország Egyesült Királysága');
    expect(a).not.toContain('Anglia, Skócia, Wales');
    expect(a).toContain('Nagy-Britannia és Észak-Írország Egyesült Királysága');
  });
  it('returns the name itself when there is no alias', () => {
    expect(aliasesOf('Balaton')).toEqual(['Balaton']);
  });
});

describe('damerauLevenshtein', () => {
  it('counts a transposition as one edit', () => {
    expect(damerauLevenshtein('baltaon', 'balaton')).toBe(1);
  });
  it('counts substitutions', () => {
    expect(damerauLevenshtein('szlovakia', 'szlovenia')).toBe(2);
  });
});

describe('checkAnswer', () => {
  it('accepts the exact name in any case', () => {
    expect(checkAnswer('csád-tó', 'Csád-tó')).toMatchObject({ ok: true, kind: 'exact' });
  });
  it('accepts every alias', () => {
    expect(checkAnswer('Mt. Everest', 'Csomolungma (Mt. Everest)')).toMatchObject({ ok: true, kind: 'exact' });
    expect(checkAnswer('csomolungma', 'Csomolungma (Mt. Everest)')).toMatchObject({ ok: true, kind: 'exact' });
    expect(checkAnswer('Keleti-tenger', 'Japán (Keleti)-tenger')).toMatchObject({ ok: true, kind: 'exact' });
  });
  it('accepts a missing accent with a warning', () => {
    expect(checkAnswer('Csad-to', 'Csád-tó')).toMatchObject({ ok: true, kind: 'accent', expected: 'Csád-tó' });
    expect(checkAnswer('Gyor', 'Győr')).toMatchObject({ ok: true, kind: 'accent' });
  });
  it('accepts one typo from 5 letters, two from 10', () => {
    expect(checkAnswer('Balatno', 'Balaton')).toMatchObject({ ok: true, kind: 'typo', distance: 1 });
    expect(checkAnswer('Hódmezővásárhey', 'Hódmezővásárhely')).toMatchObject({ ok: true, kind: 'typo' });
    expect(checkAnswer('Hódmezővsárhey', 'Hódmezővásárhely')).toMatchObject({ ok: true, kind: 'typo', distance: 2 });
    expect(checkAnswer('Balatnoo', 'Balaton').ok).toBe(false);
  });
  it('allows no typo below 5 letters', () => {
    expect(checkAnswer('Dunna', 'Duna').ok).toBe(false);
    expect(checkAnswer('Raba', 'Rába')).toMatchObject({ ok: true, kind: 'accent' });
    expect(checkAnswer('Rábx', 'Rába')).toMatchObject({ ok: false });
  });
  it('rejects look-alike official names', () => {
    const pool = ['Niger', 'Nigéria', 'Szlovákia', 'Szlovénia', 'Duna', 'Kis-Balaton', 'Balaton'];
    expect(checkAnswer('Niger', 'Nigéria', [], pool).ok).toBe(false);
    expect(checkAnswer('Nigéria', 'Niger', [], pool).ok).toBe(false);
    expect(checkAnswer('Szlovákia', 'Szlovénia', [], pool).ok).toBe(false);
    expect(checkAnswer('Szlovénia', 'Szlovákia', [], pool).ok).toBe(false);
    expect(checkAnswer('Dunaj', 'Duna', [], pool).ok).toBe(false);
    expect(checkAnswer('Duna', 'Dunaj', [], pool).ok).toBe(false);
    expect(checkAnswer('Balaton', 'Kis-Balaton', [], pool).ok).toBe(false);
    expect(checkAnswer('Kis-Balaton', 'Balaton', [], pool).ok).toBe(false);
  });
  it('rejects the pairs even without a pool', () => {
    expect(checkAnswer('Niger', 'Nigéria').ok).toBe(false);
    expect(checkAnswer('Szlovákia', 'Szlovénia').ok).toBe(false);
    expect(checkAnswer('Kis-Balaton', 'Balaton').ok).toBe(false);
  });
  it('rejects an empty answer', () => {
    expect(checkAnswer('   ', 'Balaton').ok).toBe(false);
  });
});
