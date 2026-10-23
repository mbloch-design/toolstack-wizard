import { test, expect } from '@playwright/test';
const paths = {
 fr: ['/fr/connexion', '/fr/inscription', '/fr/connexion/retour', '/fr/compte/reinitialiser', '/fr/compte/parametres'],
 en: ['/en/sign-in', '/en/sign-up', '/en/sign-in/callback', '/en/account/reset-password', '/en/account/settings'],
};
for (const [lang, routes] of Object.entries(paths)) for (const path of routes) test(`fresh production flags off: ${path}`, async ({ page, context }) => {
 const privateRequests: string[] = [], errors: string[] = [];
 const origin = 'http://127.0.0.1:8193';
 await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (/\/auth\/v1\/|\/api\/(account-profile|stack-account)/.test(url.pathname)) privateRequests.push(url.pathname);
  return url.origin === origin ? route.continue() : route.abort();
 });
 page.on('pageerror', error => errors.push(error.message));
 const response = await page.goto(path);
 expect(response?.status()).toBe(200); expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
 expect(response?.headers()['cache-control']).toBe('no-store');
 await expect(page.locator('h1')).toHaveCount(1);
 await expect(page.locator('html')).toHaveAttribute('lang', lang);
 if (path.endsWith('/parametres') || path.endsWith('/settings')) {
  await expect(page).toHaveURL(`/${lang}`);
  await expect(page.locator('.ac-page')).toHaveCount(0);
  await expect(page.locator('.ac-header-trigger')).toHaveCount(0);
  expect(privateRequests).toEqual([]); expect(errors).toEqual([]);
  return;
 }
 await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
 await expect(page.locator('.ac-header-trigger')).toHaveCount(0);
 await expect(page.locator('.ac-page')).toContainText(lang === 'fr' ? /bientôt|indisponible/ : /soon|unavailable/);
 expect(privateRequests).toEqual([]); expect(errors).toEqual([]);
});
test('generated unknown remains 404 and public fiche remains indexable', async ({ page, request, context }) => {
 await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:8193' ? route.continue() : route.abort());
 const missing = await request.get('/en/account/unknown'); expect(missing.status()).toBe(404);
 const response = await page.goto('/en/tool/notion'); expect(response?.status()).toBe(200);
 expect(response?.headers()['x-robots-tag']).toBeUndefined();
 await expect(page.locator('h1')).toContainText('Notion');
 expect(await page.locator('meta[name=robots]').getAttribute('content')).not.toContain('noindex');
 await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://tooltrim.com/en/tool/notion');
});
