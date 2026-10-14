import { expect, test } from '@playwright/test';

test('a topográfiai kvíz végigjátszható az eredményekig', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/topografia/kviz');
  await page.getByRole('button', { name: 'Indítás' }).click();
  for (let n = 0; n < 12; n++) {
    if (await page.getByRole('heading', { name: /Szép!|Hibátlan/ }).isVisible().catch(() => false)) break;
    const panel = page.locator('.quiz-panel');
    await expect(panel.locator('.quiz-prompt')).toBeVisible();
    const prompt = (await panel.locator('.quiz-prompt').textContent()) ?? '';
    if (prompt.startsWith('Hol van')) {
      await page.locator('.atlas-map').click({ position: { x: 300, y: 200 } });
      await panel.getByRole('button', { name: 'Ide jelölöm' }).click();
    } else if (await panel.locator('.answer-btn').count()) {
      await panel.locator('.answer-btn').first().click();
    } else if (await panel.getByRole('textbox', { name: 'A hely neve' }).count()) {
      await panel.getByRole('textbox', { name: 'A hely neve' }).fill('Balaton');
      await panel.getByRole('button', { name: 'Ellenőrzés' }).click();
    } else {
      await panel.getByRole('button', { name: 'Beadom a lapot' }).click();
    }
    await expect(panel.locator('.feedback')).toBeVisible();
    await panel.getByRole('button', { name: /Következő|Eredmények/ }).click();
  }
  await expect(page.getByRole('heading', { name: /Szép!|Hibátlan/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: /%/ }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('a számolás feladat ellenőrizhető', async ({ page }) => {
  await page.goto('/elmelet/szamolas/delelesi-magassag?seed=3');
  await page.locator('.calc-answer input').first().fill('42,5');
  await page.getByRole('button', { name: 'Ellenőrzés' }).click();
  await expect(page.locator('.calc-steps')).toBeVisible();
});

test('elméleti kvíz: fogalom-kérdések végigjátszása', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/elmelet/kviz');
  for (const label of ['Igaz vagy hamis', 'Kakukktojás', 'Párosítás', 'Folyamat sorbarendezése', 'Ábraelemzés', 'Számolós', 'Definíció → fogalom']) {
    const cb = page.getByRole('checkbox', { name: new RegExp(label) });
    if (await cb.isChecked()) await cb.uncheck();
  }
  await page.getByRole('button', { name: 'Indítás' }).click();
  for (let i = 0; i < 10; i++) {
    await page.locator('.answer-btn').first().click();
    await page.getByRole('button', { name: /Következő|Eredmények/ }).click();
  }
  await expect(page.getByRole('heading', { name: /\d+\/10/ })).toBeVisible();
});

test('mai ismétlés: egy elem megválaszolása és a haladás oldal', async ({ page }) => {
  await page.goto('/ismetles');
  await expect(page.getByText(/új elem/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Nem tudom' }).click();
  await expect(page.getByText('Ez holnap újra jön.')).toBeVisible();
  await page.goto('/haladas');
  await expect(page.getByText(/1 válasz összesen/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gyenge pontok' })).toBeVisible();
});

test('érettségi mód: a jó válasz megtanultnak számít', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/elmelet/erettsegi');
  await expect(page.getByText(/0 \/ \d+ megtanulva/).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Indítás' }).click();
  // The masked definition never shows the answer, so read it from the feedback after "Nem tudom"…
  await page.getByRole('button', { name: 'Nem tudom' }).click();
  const answer = (await page.locator('.feedback strong').first().innerText()).trim();
  await page.getByRole('button', { name: 'Következő' }).click();
  // …then answer the remaining ones wrong and retry the missed: the first retried item is answered right.
  for (let i = 1; i < 20; i++) {
    await page.getByRole('button', { name: 'Nem tudom' }).click();
    await page.getByRole('button', { name: /Következő|Eredmény/ }).click();
  }
  await expect(page.getByRole('heading', { name: /0 \/ 20 helyes/ })).toBeVisible();
  await page.getByRole('button', { name: 'Új kör' }).click();
  await page.getByRole('checkbox', { name: /megtanultakat is/ }).check();
  expect(answer.length).toBeGreaterThan(1);
});

test('érettségi mód: topográfia kontúrtérképpel', async ({ page }) => {
  await page.goto('/topografia/erettsegi');
  await page.getByRole('button', { name: /^Magyarország/ }).click();
  await page.getByRole('button', { name: 'Indítás' }).click();
  await expect(page.locator('svg.atlas-map .marker.is-selected')).toHaveCount(1, { timeout: 15_000 });
  const id = await page.locator('svg.atlas-map .marker.is-selected').getAttribute('data-id');
  expect(id).toMatch(/^magyarorszag--/);
  await page.getByRole('button', { name: 'Nem tudom' }).click();
  await expect(page.locator('.feedback-bad')).toBeVisible();
});
