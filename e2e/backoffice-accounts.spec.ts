import { test, expect, state, control } from './fixtures/accounts';

async function passwordLogin(page: import('@playwright/test').Page, lang: 'fr' | 'en', email = 'admin@example.invalid') {
  await page.goto(`/${lang}/back-office`);
  await page.getByLabel(lang === 'fr' ? 'E-mail administrateur' : 'Admin email', { exact: true }).fill(email);
  await page.getByLabel(lang === 'fr' ? 'Mot de passe' : 'Password', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: lang === 'fr' ? 'Se connecter' : 'Sign in', exact: true }).click();
}
for (const lang of ['fr', 'en'] as const) for (const width of [390, 1440]) test(`back office ${lang} ${width}: direct password, global counts, paging, search and JSON details`, async ({ page, request }) => {
  await page.setViewportSize({ width, height: 1000 });
  const personal = state(['figma', 'missing-json-fixture']); personal.selection.toolEntries[1].intent = 'wishlist';
  personal.billing.choices.figma = { source: 'custom', amount: 23, currency: 'EUR', period: 'monthly' }; personal.billing.paid = ['figma'];
  personal.decisions = { fixture: { kind: 'keep-both', kept: 'figma', saving: 7, at: '2026-10-19T12:00:00Z' } };
  const legacy = { version: 3, pinnedToolSlugs: ['notion'], needs: [], toolEntries: [{ toolSlug: 'notion', needIds: [], intent: 'stack', assignmentMode: 'pending', addedAt: '2026-10-19T12:00:00Z' }] };
  await control(request, 'reset', { users: [ { email: 'admin@example.invalid' }, { email: 'detail@example.invalid', state: personal }, { email: 'legacy@example.invalid', state: legacy }, { email: 'empty@example.invalid', state: state([]) }, ...Array.from({ length: 23 }, (_, i) => ({ email: `ordinary-${i}@example.invalid` })) ] });
  await passwordLogin(page, lang); await expect(page.getByTestId('accounts-total')).toHaveText('27');
  await expect(page.locator('.ba-metrics strong')).toHaveText(['27', '3', '2']); await expect(page.locator('.ba-dashboard > .ba-table-wrap tbody tr')).toHaveCount(25);
  await page.getByRole('button', { name: lang === 'fr' ? 'Page suivante' : 'Next page', exact: true }).click(); await expect(page.locator('.ba-dashboard > .ba-table-wrap tbody tr')).toHaveCount(2);
  await expect(page.getByTestId('accounts-total')).toHaveText('27');
  const search = page.getByLabel(lang === 'fr' ? 'Chercher un compte' : 'Search accounts', { exact: true });
  await search.fill('detail@'); await page.locator('.ba-search').getByRole('button').click(); await expect(page.locator('.ba-dashboard > .ba-table-wrap tbody tr')).toHaveCount(1);
  await expect(page.getByTestId('accounts-total')).toHaveText('27'); await page.getByRole('button', { name: `${lang === 'fr' ? 'Voir la stack de' : 'View stack for'} detail@example.invalid`, exact: true }).click();
  await expect(page.locator('.ba-detail')).toContainText('Figma'); await expect(page.locator('.ba-detail')).toContainText('missing-json-fixture');
  await expect(page.locator('.ba-detail')).toContainText(lang === 'fr' ? 'Référence absente du catalogue JSON' : 'Reference missing from the JSON catalogue');
  await expect(page.locator('.ba-detail')).toContainText('23 EUR'); await expect(page.locator('.ba-detail')).toContainText(lang === 'fr' ? 'Économie historique' : 'Historical saving');
  await page.locator('.ba-record summary').click(); await expect(page.locator('.ba-record pre')).toContainText('"version": 4');
  await page.locator('.ba-dashboard').screenshot({ path: test.info().outputPath(`${lang}-${width}-backoffice.png`) });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await search.fill('legacy@'); await page.locator('.ba-search').getByRole('button').click(); await page.getByRole('button', { name: `${lang === 'fr' ? 'Voir la stack de' : 'View stack for'} legacy@example.invalid`, exact: true }).click();
  await expect(page.locator('.ba-detail')).toContainText('Notion');
  await control(request, 'fault', { path: '/api/backoffice-accounts', method: 'GET', status: 503 }); await page.getByRole('button', { name: lang === 'fr' ? 'Actualiser' : 'Refresh', exact: true }).click();
  await expect(page.locator('.ba-dashboard [role=alert]')).toContainText(lang === 'fr' ? 'Données indisponibles' : 'Data unavailable'); await expect(page.getByTestId('accounts-total')).toHaveCount(0);
  await page.getByRole('button', { name: lang === 'fr' ? 'Réessayer' : 'Retry', exact: true }).click(); await expect(page.getByTestId('accounts-total')).toHaveText('27');
  const requests = (await control(request, 'state')).requests;
  expect(requests.filter((r: { path: string }) => r.path.includes('backoffice') && r.path !== '/api/backoffice-accounts')).toEqual([]);
});

for (const forged of [false, true]) test(`ordinary account denied despite forged admin metadata: ${forged}`, async ({ page, request }) => {
  await control(request, 'seed', { email: 'ordinary@example.invalid', metadata: forged ? { role: 'admin', is_admin: true } : {} });
  await passwordLogin(page, 'en', 'ordinary@example.invalid');
  await expect(page.locator('.ba-dashboard [role=alert]')).toContainText('Access is restricted'); await expect(page.getByTestId('accounts-total')).toHaveCount(0);
  const result = await page.evaluate(async () => {
    const modulePath = '/src/integrations/supabase/client.ts'; const { supabase } = await import(/* @vite-ignore */ modulePath);
    const { data } = await supabase.auth.getSession(); return (await fetch('/api/backoffice-accounts', { headers: { Authorization: `Bearer ${data.session.access_token}` } })).status;
  }); expect(result).toBe(403);
});
