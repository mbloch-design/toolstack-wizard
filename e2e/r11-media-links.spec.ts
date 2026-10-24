import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({version:1,choice:'refused',decidedAt:Date.now(),expiresAt:Date.now()+3600000})));
  await page.route(/google-analytics\.com|googletagmanager\.com|_vercel\/insights/, route => route.abort());
});

for (const lang of ['fr', 'en']) {
  test(`${lang}: unavailable publisher links do not leave an empty local-nav CTA`, async ({ page }) => {
    await page.goto(`/${lang}/tool/logomeai`);
    await expect(page.locator('h1')).toContainText(/logome/i);
    await expect(page.locator('.td-localnav-cta')).toHaveCount(0);
    await expect(page.locator('.td-hero-site-link')).toHaveCount(0);
    await expect(page.locator('a[href*="logomeai.partnerlinks.io"]')).toHaveCount(0);
  });
}

for (const slug of ['openai', 'personio', 'jquery']) {
  test(`${slug}: known blank or bot-check covers never appear in the tool hero`, async ({ page }) => {
    await page.goto(`/fr/tool/${slug}`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator(`.td-hero-media img[src*="/og-screenshots/${slug}.jpg"]`)).toHaveCount(0);
  });
}

test('an audited local product gallery remains visible after recovering a formerly blocked cover', async ({ page }) => {
  await page.goto('/fr/tool/ae-gifgun');
  const image = page.locator('.td-hero-media img[src="/tool-media/ae-gifgun/official-demo.jpg"]');
  await expect(image).toHaveCount(1);
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(320);
});
