import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/topografia', '/topografia/terkep', '/elmelet', '/elmelet/tananyag/2-3-a-fold-es-mozgasai', '/elmelet/fogalomtar', '/elmelet/kviz', '/ismetles', '/haladas', '/vizsga', '/beallitasok'];

for (const path of PAGES) {
  test(`${path}: nincs súlyos akadálymentességi hiba`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(path);
    await page.getByRole('heading', { level: 1 }).waitFor();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${v.id}: ${v.nodes.length}× ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
  });
}
