import { expect, test } from '@playwright/test';

const ROUTES = [
  ['/', 'Mit gyakorolsz ma?'],
  ['/topografia', 'Az atlasz'],
  ['/topografia/terkep', 'Térkép'],
  ['/topografia/kviz', 'Kvíz'],
  ['/elmelet', 'A rétegek'],
  ['/elmelet/tananyag', 'Tananyag'],
  ['/elmelet/tananyag/2-3-a-fold-es-mozgasai', '2.3. A Föld és mozgásai'],
  ['/elmelet/fogalomtar', 'Fogalomtár'],
  ['/elmelet/folyamatok', 'Folyamatok'],
  ['/elmelet/szamolas', 'Számolás'],
  ['/elmelet/kviz', 'Kvíz'],
  ['/ismetles', 'Mai ismétlés'],
  ['/haladas', 'Hol tartasz?'],
  ['/vizsga', 'Az emelt szintű földrajz érettségi'],
  ['/vizsga/probavizsga', 'Próbavizsga'],
  ['/beallitasok', 'Beállítások'],
] as const;

for (const [path, heading] of ROUTES) {
  test(`${path} megnyílik`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('a mód a fejlécben vált', async ({ page, isMobile }) => {
  await page.goto('/topografia');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'topo');
  if (isMobile) await page.locator('.mode-toggle').getByRole('button', { name: /Elmélet/ }).click();
  else await page.locator('.mode-theory .mode-label').click();
  await expect(page).toHaveURL(/\/elmelet/);
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'theory');
});

test('a kereső a / billentyűre nyílik és talál', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('/');
  const input = page.getByRole('dialog', { name: 'Keresés' }).getByRole('searchbox');
  await input.fill('csad to');
  await expect(page.getByRole('option').first()).toContainText('Csád');
});

test('egy érettségi feladatsor megnyílik, a megoldás kattintásra látszik', async ({ page }) => {
  await page.goto('/vizsga/feladatsor/2024-tavasz');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('2024');
  await page.getByRole('button', { name: 'Megoldás megmutatása' }).first().click();
  await expect(page.getByText('Javítási-értékelési útmutató').first()).toBeVisible();
});

test('térképszerkesztő: pont áthelyezése és export', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a Térképszerkesztő asztali eszköz');
  test.setTimeout(90_000);
  await page.goto('/topografia/terkep?edit=1&hely=magyarorszag--telepulesek--szeged');
  await page.waitForTimeout(2500); // let the map finish framing the place
  await page.getByRole('button', { name: 'Pont áthelyezése' }).click();
  await page.waitForTimeout(300); // the editor scrolls back to the map
  const box = (await page.locator('svg.atlas-map').boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.getByRole('button', { name: 'Mentés' }).click();
  await expect(page.getByText('1 javítás összesen')).toBeVisible();
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: /Exportálás/ }).click();
  expect((await dl).suggestedFilename()).toMatch(/^szerkeszto-javitasok-.*\.geojson$/);
});
