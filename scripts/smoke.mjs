/**
 * Headless smoke test: renders the app, exercises the main interactions and
 * captures screenshots. Map tiles and Commons photos need outbound network, so
 * their absence is expected in restricted environments.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4173/Planfoy/';
const OUT = 'screenshots';

const errors = [];

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  · ${name}.png`);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

for (const [name, viewport] of [
  ['desktop', { width: 1360, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  const context = await browser.newContext({ viewport, locale: 'fr-FR' });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`[${name}] ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`[${name}] pageerror: ${error.message}`));

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('.pin', { timeout: 15000 });
  const pins = await page.locator('.pin:not(.pin--home)').count();
  console.log(`${name}: ${pins} marqueurs`);
  await page.waitForTimeout(600);
  await shot(page, `${name}-map`);

  // Marker → card → fullscreen sheet. Dispatched rather than clicked: at the
  // default zoom the Saint-Étienne pins overlap, which is a map property, not
  // a wiring problem.
  await page.locator('[data-place-id="ste03"]').dispatchEvent('click');
  await page.waitForTimeout(700);
  await shot(page, `${name}-selected`);

  await page.locator('.mini--active .mini__actions .btn', { hasText: 'Détails' }).click();
  await page.waitForSelector('.sheet', { timeout: 5000 });
  await page.waitForTimeout(500);
  await shot(page, `${name}-sheet`);
  await page.locator('.sheet__close').click();
  await page.waitForTimeout(300);

  // Filters.
  await page.locator('.filters__more').click();
  await page.waitForTimeout(200);
  await shot(page, `${name}-filters`);
  await page.locator('.chip', { hasText: 'Nature' }).first().click();
  await page.waitForTimeout(400);
  const natureCount = await page.locator('.pin:not(.pin--home)').count();
  console.log(`${name}: ${natureCount} marqueurs après filtre Nature`);
  await page.locator('.filters__more').click();

  // Carousel scroll should move the selection. Filtering cleared the previous
  // selection (that place is no longer visible), so pick a card first.
  await page.locator('.mini__hit').first().dispatchEvent('click');
  await page.waitForTimeout(1100);
  const before = await page.locator('.mini--active .mini__name').first().textContent();
  await page.locator('.carousel__scroller').evaluate((el) => el.scrollBy({ left: 520 }));
  await page.waitForTimeout(900);
  const after = await page.locator('.mini--active .mini__name').first().textContent();
  console.log(`${name}: carrousel ${JSON.stringify(before)} → ${JSON.stringify(after)}`);

  // Collapse the carousel: the floating card takes over.
  await page.locator('.carousel__grip').click();
  await page.waitForTimeout(400);
  await shot(page, `${name}-collapsed`);
  await page.locator('.carousel__grip').click();

  // List view.
  await page.locator('.segmented--view .segmented__item', { hasText: 'Liste' }).click();
  await page.waitForTimeout(400);
  await shot(page, `${name}-list`);

  await context.close();
}

await browser.close();

if (errors.length > 0) {
  console.error('\nErreurs console :');
  for (const error of [...new Set(errors)]) console.error(` - ${error}`);
} else {
  console.log('\nAucune erreur console.');
}
