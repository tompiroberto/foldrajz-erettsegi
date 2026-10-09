import { describe, expect, it } from 'vitest';
import { checkNumeric, clock, hu, parseHuNumber, rngFrom } from './core';
import { GENERATORS, KM_PER_DEG, foehn, localTimeDiff, means, naturalIncrease, noonAltitude, scaleArea, scaleDistance, zoneOf } from './generators';

describe('hand-computed cases', () => {
  it('scale: 4 cm on 1:50 000 = 2 km; 1:100 000 → 1 cm² = 1 km²', () => {
    expect(scaleDistance(50_000, 4).km).toBeCloseTo(2);
    expect(scaleDistance(1_000_000, 7.5).km).toBeCloseTo(75);
    expect(scaleArea(100_000, 1).km2).toBeCloseTo(1);
    expect(scaleArea(50_000, 12).km2).toBeCloseTo(3);
  });
  it('1° along the Equator ≈ 111 km', () => {
    expect(KM_PER_DEG).toBeCloseTo(111.1, 1);
  });
  it('local time: 15° = 1 hour, east is later', () => {
    expect(localTimeDiff(0, 15)).toBe(60);
    expect(localTimeDiff(19, -74)).toBe(-372); // Budapest → New York: 93° = 6 h 12 min earlier
    expect(clock(12 * 60 + localTimeDiff(19, -74))).toBe('05:48');
  });
  it('time zones by the 15° rule', () => {
    expect(zoneOf(19)).toBe(1);
    expect(zoneOf(-74)).toBe(-5);
    expect(zoneOf(140)).toBe(9);
    expect(zoneOf(151)).toBe(10);
    expect(zoneOf(179)).toBe(12);
  });
  it('noon solar altitude', () => {
    expect(noonAltitude(47.5, 0)).toBeCloseTo(42.5); // Budapest, equinox
    expect(noonAltitude(47.5, 23.5)).toBeCloseTo(66); // June solstice
    expect(noonAltitude(47.5, -23.5)).toBeCloseTo(19); // December solstice
    expect(noonAltitude(-33.9, 23.5)).toBeCloseTo(32.6); // Cape Town, June
    expect(noonAltitude(23.5, 23.5)).toBeCloseTo(90); // Tropic of Cancer, June: zenith
  });
  it('foehn: dry 1 °C, wet 0.5 °C per 100 m', () => {
    // 20 °C at 200 m, cloud base 1000 m, ridge 2500 m, back down to 200 m
    const r = foehn(20, 200, 1000, 2500, 200);
    expect(r.tCloud).toBeCloseTo(12);
    expect(r.tTop).toBeCloseTo(4.5);
    expect(r.tLee).toBeCloseTo(27.5);
  });
  it('means and ranges', () => {
    expect(means([2, 10, 6, 4]).avg).toBeCloseTo(5.5);
    expect(means([2, 10, 6, 4]).range).toBe(8);
  });
  it('natural increase in ‰', () => {
    expect(naturalIncrease(90_000, 130_000, 9_600_000)).toBeCloseTo(-4.17, 2);
    expect(naturalIncrease(30_000, 10_000, 1_000_000)).toBeCloseTo(20);
  });
});

describe('number helpers', () => {
  it('formats and parses Hungarian numbers', () => {
    expect(hu(1234567)).toBe('1 234 567');
    expect(hu(-3.25, 1)).toBe('−3,3');
    expect(parseHuNumber('12,5')).toBe(12.5);
    expect(parseHuNumber('1 200')).toBe(1200);
    expect(parseHuNumber('−3')).toBe(-3);
    expect(parseHuNumber('abc')).toBeNull();
  });
  it('checks numeric answers with tolerance', () => {
    expect(checkNumeric('42,5', { value: 42.5, tolerance: 0.1, display: '' })).toBe(true);
    expect(checkNumeric('43', { value: 42.5, tolerance: 0.1, display: '' })).toBe(false);
    expect(checkNumeric('05:48', { value: '05:48', display: '' })).toBe(true);
  });
});

describe('every generator', () => {
  for (const g of GENERATORS) {
    it(`${g.id}: 200 random problems are well-formed and self-consistent`, () => {
      for (let s = 1; s <= 200; s++) {
        const p = g.generate(rngFrom(s * 7919));
        expect(p.question.length).toBeGreaterThan(20);
        expect(p.steps.length).toBeGreaterThan(0);
        expect(p.hint.length).toBeGreaterThan(10);
        for (const a of p.answers) {
          if (typeof a.answer.value === 'number') expect(Number.isFinite(a.answer.value)).toBe(true);
          // The displayed solution must be accepted by the checker.
          if (typeof a.answer.value === 'number') expect(checkNumeric(String(a.answer.value).replace('.', ','), a.answer)).toBe(true);
        }
        expect(p.question).not.toMatch(/NaN|undefined|Infinity/);
        expect(p.steps.join(' ')).not.toMatch(/NaN|undefined|Infinity/);
      }
    });
  }
  it('noon altitude problems never use impossible latitudes', () => {
    const g = GENERATORS.find((x) => x.id === 'delelesi-magassag')!;
    for (let s = 1; s <= 300; s++) {
      const p = g.generate(rngFrom(s));
      const v = p.answers[0]!.answer.value as number;
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThanOrEqual(90);
    }
  });
});
