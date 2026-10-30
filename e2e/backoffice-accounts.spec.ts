import { test, expect, state, control, saved, change, snapshot, dismissConsent } from './fixtures/accounts';

async function passwordLogin(page: import('@playwright/test').Page, lang: 'fr' | 'en', email = 'admin@example.invalid') {
  const current = await control(page.request, 'state');
  if (!current.accounts.some((user: {email: string}) => user.email === email)) await control(page.request, 'seed', { email });
  await page.goto(`/${lang}/back-office`); await dismissConsent(page);
  await page.getByLabel(lang === 'fr' ? 'E-mail administrateur' : 'Admin email', { exact: true }).fill(email);
  await page.getByLabel(lang === 'fr' ? 'Mot de passe' : 'Password', { exact: true }).fill('fixture-password');
  await page.locator('.ba-login').getByRole('button', { name: lang === 'fr' ? 'Se connecter' : 'Sign in', exact: true }).click();
  if (email === 'admin@example.invalid') {
    await expect(page.getByRole('heading', { name: lang === 'fr' ? 'Vue d’ensemble' : 'Overview', exact: true })).toBeVisible();
    await page.getByRole('button', { name: lang === 'fr' ? 'Utilisateurs' : 'Users', exact: true }).click();
  }
}
for (const lang of ['fr', 'en'] as const) for (const width of [390, 1440]) test(`back office ${lang} ${width}: direct password, global counts, paging, search and JSON details`, async ({ page, request }) => {
  await page.setViewportSize({ width, height: 1000 });
  const personal = state(['figma', 'missing-json-fixture']); personal.selection.toolEntries[1].intent = 'wishlist';
  personal.trade = 'designer'; personal.dailyRate = { amount: 450, currency: 'EUR' }; personal.usage = { figma: 4 };
  personal.selection.toolEntries[0].needIds = ['design'];
  personal.billing.choices.figma = { source: 'custom', amount: 23, currency: 'EUR', period: 'monthly' }; personal.billing.paid = ['figma'];
  personal.decisions = { fixture: { kind: 'keep-both', kept: 'figma', saving: 7, at: '2026-10-19T12:00:00Z' } };
  const legacy = { version: 3, pinnedToolSlugs: ['notion'], needs: [], toolEntries: [{ toolSlug: 'notion', needIds: [], intent: 'stack', assignmentMode: 'pending', addedAt: '2026-10-19T12:00:00Z' }] };
  await control(request, 'reset', { users: [ { email: 'admin@example.invalid' }, { email: 'detail@example.invalid', state: personal }, { email: 'legacy@example.invalid', state: legacy }, { email: 'empty@example.invalid', state: state([]) }, ...Array.from({ length: 23 }, (_, i) => ({ email: `ordinary-${i}@example.invalid` })) ] });
  await passwordLogin(page, lang); await expect(page.getByTestId('accounts-total')).toHaveText('27');
  await expect(page.getByRole('complementary', {includeHidden:true})).toHaveCount(1);
  await page.getByRole('button', {name: lang === 'fr' ? 'Vue d’ensemble' : 'Overview',exact:true}).click();
  await page.locator('.asv2-root').screenshot({path:test.info().outputPath(`${lang}-${width}-overview.png`)});
  await page.getByRole('button', {name:lang === 'fr' ? 'Utilisateurs':'Users',exact:true}).click();
  await expect(page.locator('.bo-metrics strong')).toHaveText(['27', '3', '2']);
  if (width === 390) {
    await page.getByRole('button', {name:`${lang === 'fr' ? 'Voir la stack de' : 'View stack for'} admin@example.invalid`,exact:true}).click();
    const profile = page.getByRole('region', {name:lang === 'fr' ? 'Détail du compte':'Account detail'});
    await expect(profile).toBeInViewport();
    await page.getByRole('button', {name:`${lang === 'fr' ? 'Voir la stack de' : 'View stack for'} admin@example.invalid`,exact:true}).click();
    await expect(profile).toBeInViewport();
    await expect(profile).toContainText(lang === 'fr' ? 'Aucune stack enregistrée.' : 'No saved stack.');
    await profile.getByRole('button', {name:lang === 'fr' ? 'Fermer le détail':'Close detail',exact:true}).click();
  } await expect(page.locator('.bo-user-table tbody tr')).toHaveCount(25);
  await page.getByRole('button', { name: lang === 'fr' ? 'Page suivante' : 'Next page', exact: true }).click(); await expect(page.locator('.bo-user-table tbody tr')).toHaveCount(2);
  await expect(page.getByTestId('accounts-total')).toHaveText('27');
  const search = page.getByLabel(lang === 'fr' ? 'Chercher un compte' : 'Search accounts', { exact: true });
  await search.fill('detail@'); await page.locator('.bo-search').getByRole('button').click(); await expect(page.locator('.bo-user-table tbody tr')).toHaveCount(1);
  await expect(page.getByTestId('accounts-total')).toHaveText('27'); await page.getByRole('button', { name: `${lang === 'fr' ? 'Voir la stack de' : 'View stack for'} detail@example.invalid`, exact: true }).click();
  await expect(page.locator('.bo-detail')).toContainText('450 EUR');
  await page.getByRole('tab', {name:lang === 'fr' ? 'Usage déclaré':'Declared usage',exact:true}).click();
  await expect(page.getByRole('tabpanel')).toContainText('4 / 5');
  await expect(page.getByRole('tabpanel')).toContainText(lang === 'fr' ? 'Usage soutenu':'Frequent use');
  await page.getByRole('tab', {name:lang === 'fr' ? 'Tableaux':'Boards',exact:true}).click();
  await expect(page.getByRole('tabpanel').getByRole('heading', {name:lang === 'fr' ? /Créer des visuels/:/Create visuals/})).toBeVisible();
  await page.getByRole('tab', {name:lang === 'fr' ? 'Outils':'Tools',exact:true}).click();
  await expect(page.locator('.bo-detail')).toContainText('Figma'); await expect(page.locator('.bo-detail')).toContainText('missing-json-fixture');
  await expect(page.locator('.bo-detail')).toContainText(lang === 'fr' ? 'Référence absente du catalogue JSON' : 'Reference missing from the JSON catalogue');
  await page.getByRole('tab', { name: lang === 'fr' ? 'Budget déclaré' : 'Declared budget', exact: true }).click();
  await expect(page.locator('.bo-detail')).toContainText('23 EUR');
  await page.getByRole('tab', { name: lang === 'fr' ? 'Décisions' : 'Decisions', exact: true }).click(); await expect(page.locator('.bo-detail')).toContainText(lang === 'fr' ? 'Économie historique' : 'Historical saving');
  await page.getByRole('tab', { name: lang === 'fr' ? 'Données' : 'Data', exact: true }).click();
  await page.locator('.bo-record summary').click(); await expect(page.locator('.bo-record pre')).toContainText('"version": 4');
  await page.locator('.bo-workspace').screenshot({ path: test.info().outputPath(`${lang}-${width}-backoffice.png`) });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await search.fill('legacy@'); await page.locator('.bo-search').getByRole('button').click(); await page.getByRole('button', { name: `${lang === 'fr' ? 'Voir la stack de' : 'View stack for'} legacy@example.invalid`, exact: true }).click();
  await expect(page.locator('.bo-detail')).toContainText('Notion');
  await control(request, 'fault', { path: '/api/backoffice-accounts', method: 'GET', status: 503 }); await page.getByRole('button', { name: lang === 'fr' ? 'Actualiser' : 'Refresh', exact: true }).click();
  await expect(page.locator('.bo-workspace [role=alert]')).toContainText(lang === 'fr' ? 'Données indisponibles' : 'Data unavailable'); await expect(page.getByTestId('accounts-total')).toHaveCount(0);
  await page.getByRole('button', { name: lang === 'fr' ? 'Réessayer' : 'Retry', exact: true }).click(); await expect(page.getByTestId('accounts-total')).toHaveText('27');
  const requests = (await control(request, 'state')).requests;
  expect(requests.filter((r: { path: string }) => r.path.includes('backoffice') && r.path !== '/api/backoffice-accounts')).toEqual([]);
});

for (const forged of [false, true]) test(`ordinary account denied despite forged admin metadata: ${forged}`, async ({ page, request }) => {
  await control(request, 'seed', { email: 'ordinary@example.invalid', metadata: forged ? { role: 'admin', is_admin: true } : {} });
  await passwordLogin(page, 'en', 'ordinary@example.invalid');
  await expect(page.locator('.bo-workspace [role=alert]')).toContainText('Access is restricted'); await expect(page.getByTestId('accounts-total')).toHaveCount(0);
  const result = await page.evaluate(async () => {
    const modulePath = '/src/integrations/supabase/client.ts'; const { supabase } = await import(/* @vite-ignore */ modulePath);
    const { data } = await supabase.auth.getSession(); return (await fetch('/api/backoffice-accounts', { headers: { Authorization: `Bearer ${data.session.access_token}` } })).status;
  }); expect(result).toBe(403);
});

async function openBackOffice(page: import('@playwright/test').Page) {
  await page.evaluate(() => { history.pushState({}, '', '/en/back-office'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByTestId('accounts-total')).toBeVisible();
  await page.getByRole('button', { name: 'Users', exact: true }).click();
}
async function seededAdmin(page: import('@playwright/test').Page, request: import('@playwright/test').APIRequestContext) {
  const personal = state(['figma']);
  personal.billing.choices.figma = { source: 'custom', amount: 37, currency: 'EUR', period: 'annual' };
  personal.billing.paid = ['figma']; personal.decisions = { historical: { kind: 'keep-both', kept: 'figma', saving: 12, at: '2026-10-19T12:00:00Z' } };
  await control(request, 'seed', { email: 'admin@example.invalid', state: personal });
  await passwordLogin(page, 'en'); await expect(page.getByTestId('accounts-total')).toBeVisible();
  await page.goto('/en/ma-stack'); await saved(page); return personal;
}
test('back-office clean logout purges private primary, backup, plans and decisions', async ({ page, request }) => {
  await seededAdmin(page, request); await openBackOffice(page);
  await page.locator('.bo-account-toolbar').getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('form', { name: 'Administrator sign-in' })).toBeVisible();
  await page.goto('/en/ma-stack'); await expect(page.getByRole('button', { name: 'I already have an account', exact: true })).toBeVisible();
  expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual([]);
  expect(await page.evaluate(() => Object.entries(localStorage).filter(([key]) => /tooltrim-(personal-stack|ma-stack)/.test(key)).every(([, value]) => !value.includes('figma') && !value.includes('historical')))).toBe(true);
});
test('back-office dirty logout supports cancel, failed signout retry and confirmed privacy cleanup', async ({ page, request }) => {
  const personal = await seededAdmin(page, request);
  await page.route('**/api/stack-account', route => route.request().method() === 'PUT' ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":{"code":"STACK_ACCOUNT_UNAVAILABLE"}}' }) : route.continue());
  personal.billing.choices.figma.amount = 99; await change(page, personal);
  // A failed write followed by the older remote snapshot requires resolution;
  // the debounce's transient unsaved state is intentionally no longer a notice.
  await expect(page.locator('.ms-account [role=status]')).toHaveText('Two versions to resolve');
  await openBackOffice(page); await page.locator('.bo-account-toolbar').getByRole('button', { name: 'Sign out', exact: true }).click();
  const confirm = page.getByRole('button', { name: 'Sign out without saving', exact: true }); await expect(confirm).toBeVisible();
  await page.getByRole('button', { name: 'Keep editing', exact: true }).click(); await expect(confirm).toHaveCount(0);
  expect((await snapshot(page)).billing.choices.figma.amount).toBe(99);
  await page.locator('.bo-account-toolbar').getByRole('button', { name: 'Sign out', exact: true }).click();
  await control(request, 'fault', { path: '/auth/v1/logout', method: 'POST', status: 400 });
  await confirm.click(); await expect(page.getByRole('alert')).toContainText('Sign-out failed');
  await expect(page.getByTestId('accounts-total')).toBeVisible(); expect((await snapshot(page)).billing.choices.figma.amount).toBe(99);
  await confirm.click(); await expect(page.getByRole('form', { name: 'Administrator sign-in' })).toBeVisible();
  await page.goto('/en/ma-stack'); expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual([]);
});

for (const theme of ['light', 'dark'] as const) test(`account surfaces remain readable in ${theme} theme`, async ({ page, request }) => {
  await page.addInitScript(theme => localStorage.setItem('tooltrim:theme', theme), theme);
  await page.goto('/en/back-office');
  const surface = theme === 'dark' ? 'rgb(26, 26, 26)' : 'rgb(255, 255, 255)';
  async function readable(selector: string, expectedSurface: string | null = surface) {
    const elements = page.locator(selector); await expect(elements.first()).toBeVisible();
    const styles = await elements.evaluateAll(nodes => nodes.map(node => {
      const style = getComputedStyle(node);
      const luminance = (color: string) => {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d')!; context.fillStyle = color; context.fillRect(0, 0, 1, 1);
        const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => { const s = value / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; });
        return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
      };
      const a = luminance(style.color), b = luminance(style.backgroundColor);
      return { background: style.backgroundColor, contrast: (Math.max(a,b) + .05) / (Math.min(a,b) + .05) };
    }));
    for (const style of styles) { if (expectedSurface) expect(style.background).toBe(expectedSurface); expect(style.contrast).toBeGreaterThanOrEqual(4.5); }
  }
  await readable('.ba-login, .ba-login-field input');
  await seededAdmin(page, request); await openBackOffice(page);
  await readable('.bo-button, .bo-search-field, .bo-metrics', null);
  await page.getByRole('button', { name: 'View stack for admin@example.invalid', exact: true }).click();
  // The loading shell has the same class and is replaced by the profile.
  // Measure the settled panel, not a node detached during evaluateAll.
  await expect(page.locator('.bo-detail').getByRole('heading', { level: 2 })).toHaveText('admin@example.invalid');
  await readable('.bo-detail', null);
  await page.locator('.bo-account-toolbar').getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('form', { name: 'Administrator sign-in' })).toBeVisible();
  await page.goto('/en/ma-stack'); await page.getByRole('button', { name: 'I already have an account', exact: true }).click();
  await page.getByRole('button', { name: 'Continue with email', exact: true }).click(); await readable('.ac-providers .ac-button', null); await readable('.ac-form input');
});
