import { describe, expect, it } from 'vitest';
import { equationOfTime, solarDeclination, subsolarPoint } from './sun';

describe('solar position', () => {
  it('declination is about +23.4° at the June solstice and −23.4° in December', () => {
    expect(solarDeclination(new Date(Date.UTC(2026, 5, 21, 12)))).toBeCloseTo(23.44, 0);
    expect(solarDeclination(new Date(Date.UTC(2026, 11, 21, 12)))).toBeCloseTo(-23.44, 0);
  });
  it('declination is about 0° at the equinoxes', () => {
    expect(Math.abs(solarDeclination(new Date(Date.UTC(2026, 2, 20, 12))))).toBeLessThan(0.6);
    expect(Math.abs(solarDeclination(new Date(Date.UTC(2026, 8, 23, 12))))).toBeLessThan(0.6);
  });
  it('equation of time: about −14 min in mid-February, +16 min in early November', () => {
    expect(equationOfTime(new Date(Date.UTC(2026, 1, 11, 12)))).toBeCloseTo(-14.2, 0);
    expect(equationOfTime(new Date(Date.UTC(2026, 10, 3, 12)))).toBeCloseTo(16.4, 0);
  });
  it('the Sun culminates near the prime meridian at 12:00 UTC (± equation of time)', () => {
    const [lon] = subsolarPoint(new Date(Date.UTC(2026, 3, 15, 12)));
    expect(Math.abs(lon)).toBeLessThan(1);
  });
  it('one hour later the subsolar point is 15° further west', () => {
    const a = subsolarPoint(new Date(Date.UTC(2026, 3, 15, 12)))[0];
    const b = subsolarPoint(new Date(Date.UTC(2026, 3, 15, 13)))[0];
    expect(a - b).toBeCloseTo(15, 1);
  });
});
