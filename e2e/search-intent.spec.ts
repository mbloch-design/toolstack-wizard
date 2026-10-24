import { test, expect } from '@playwright/test';

test.beforeEach(async ({page, baseURL}) => {
 await page.addInitScript(() => localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({version:1,choice:'refused',decidedAt:Date.now(),expiresAt:Date.now()+3600000})));
 await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL!).origin ? route.continue() : route.abort());
});

for (const [lang, query, expected] of [
 ['en', 'appointment scheduling', 'Calendly'],
 ['fr', 'alternative à Notion', 'Obsidian'],
 ['en', 'alternatives to Notion', 'Obsidian'],
] as const) {
 test(`${lang}: search page respects intent ${query}`, async ({page}) => {
  await page.goto(`/${lang}/search?q=${encodeURIComponent(query)}`);
  await expect(page.locator('.tcc-name').filter({hasText:expected})).toBeVisible();
  if (expected === 'Obsidian') {
   await expect(page.locator('.tcc-name').first()).toHaveText('Obsidian');
   await expect(page.locator('.tcc-name').filter({hasText:'Notionlytics'})).toHaveCount(0);
  }
 });
 test(`${lang}: global search respects intent ${query}`, async ({page}) => {
  await page.goto(`/${lang}/tools`);
  await page.getByRole('button',{name:lang==='fr'?/^Rechercher dans le catalogue \(/:/^Search the catalogue \(/}).click();
  const dialog=page.getByRole('dialog',{name:lang==='fr'?'Recherche globale':'Global search',exact:true});
  await dialog.getByRole('combobox').fill(query);
  await expect(dialog.getByRole('option').filter({hasText:expected})).toBeVisible();
  if (expected === 'Obsidian') {
   await expect(dialog.getByRole('option').first()).toContainText('Obsidian');
   await expect(dialog.getByRole('option').filter({hasText:'Notionlytics'})).toHaveCount(0);
  }
 });
}
