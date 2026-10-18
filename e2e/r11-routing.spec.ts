import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({version:1,choice:'refused',decidedAt:Date.now(),expiresAt:Date.now()+3600000})));
  await page.route(/google-analytics\.com|googletagmanager\.com|_vercel\/insights/, route => route.abort());
});

for (const route of ['/fr/r11-route-inexistante', '/en/tool/r11-inexistant', '/fr/guide/r11-inexistant', '/en/explorer/around/r11-inexistant']) {
  test(`${route}: unknown static documents return a real noindex 404`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('404');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await page.getByRole('link', { name: "Retourner à l'accueil" }).click();
    await expect(page).toHaveURL(/\/fr$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://tooltrim.com/fr');
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
  });
}
for (const lang of ['fr', 'en']) {
  test(`${lang}: direct search preserves its query and owns its metadata`, async ({ page }) => {
    const response = await page.goto(`/${lang}/search?q=notion`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main input').first()).toHaveValue('notion');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://tooltrim.com/${lang}/search`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(new URL(page.url()).searchParams.get('q')).toBe('notion');
  });
  test(`${lang}: private routes start without homepage SEO`, async ({ request }) => {
    const response = await request.get(`/${lang}/back-office`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toMatch(/name="robots" content="noindex, follow"/);
    expect(html).not.toMatch(/rel="(?:canonical|alternate)"/);
  });
}
for (const slug of ['meilleurs-outils-ia-freelances-2026', 'claude-opus-4-6-guide-complet-freelances', 'alternatives-gratuites-notion-freelance-2026', 'stack-minimaliste-freelance-2026', 'stripe-freelance-tarifs-alternatives', 'perplexity-vs-chatgpt-recherche', 'notion-gratuit-vs-payant-vrai-calcul']) {
  test(`${slug}: the published English translation is not redirected to French`, async ({ request }) => {
    const response = await request.get(`/en/guide/${slug}`, { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('lang="en"');
    expect(html).toContain(`rel="canonical" href="https://tooltrim.com/en/guide/${slug}"`);
  });
}
