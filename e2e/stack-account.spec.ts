import { test, expect, state, draft, login, saved, snapshot, change, control, isolate, signOut, dismissConsent } from './fixtures/accounts';

for (const lang of ['fr', 'en'] as const) for (const width of [390, 1440]) {
  test(`${lang} ${width}: full personal state survives new device and persistent removal`, async ({ page, browser, request }) => {
    await page.setViewportSize({ width, height: 1000 });
    const full = state(['notion', 'figma']);
    full.selection.needs.push({ id: 'fixture-custom', labelFr: 'Mon besoin', labelEn: 'My need', order: 90, source: 'custom' });
    full.selection.toolEntries[0].needIds = ['fixture-custom']; full.selection.toolEntries[0].assignmentMode = 'manual';
    full.selection.toolEntries[1].intent = 'wishlist';
    full.billing = { paid: ['notion'], reviewed: ['notion', 'figma'], choices: { notion: { source: 'custom', amount: 37, currency: 'EUR', period: 'annual', seats: 3, perSeat: true } } };
    full.decisions = { 'figma|notion': { kind: 'keep-both', kept: 'notion', saving: 12, savingCurrency: 'EUR', at: '2026-10-19T12:00:00Z' } };
    await draft(page, full); await page.goto(`/${lang}/ma-stack`);
    await login(page, lang, 'roundtrip@example.invalid'); await saved(page, lang);
    expect(await snapshot(page)).toEqual(full);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.ms-account').screenshot({ path: test.info().outputPath(`${lang}-${width}-account.png`) });
    // A clean context signs in independently: no localStorage or session copied.
    const second = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL, viewport: { width, height: 1000 } }); await isolate(second);
    const other = await second.newPage(); const otherErrors: string[] = []; other.on('pageerror', error => otherErrors.push(error.message)); await other.goto(`/${lang}/ma-stack`);
    await login(other, lang, 'roundtrip@example.invalid'); await saved(other, lang);
    expect(await snapshot(other)).toEqual(full);
    await other.locator('.ms-tool').filter({ hasText: 'Notion' }).click();
    await other.getByRole('button', { name: lang === 'fr' ? 'Retirer de ma stack' : 'Remove from my stack', exact: true }).click();
    await saved(other, lang);
    await other.reload(); await saved(other, lang);
    expect((await snapshot(other)).selection.pinnedToolSlugs).toEqual(['figma']);
    const remote = await control(request, 'state'); expect(remote.accounts[0].stack.state.selection.pinnedToolSlugs).toEqual(['figma']);
    expect(otherErrors).toEqual([]); await second.close();
  });
}

for (const choice of ['saved', 'merge', 'equivalent']) test(`anonymous divergent/equivalent draft: ${choice}`, async ({ page, request }) => {
  const remote = state(['notion']); remote.billing.choices.notion = { source: 'custom', amount: 11, currency: 'USD', period: 'monthly' }; remote.billing.paid = ['notion'];
  const local = choice === 'equivalent' ? remote : state(['notion', 'figma']);
  if (choice !== 'equivalent') { local.billing.choices.notion = { source: 'custom', amount: 99, currency: 'EUR', period: 'monthly' }; local.billing.paid = ['notion']; }
  await control(request, 'seed', { email: 'draft@example.invalid', state: remote }); await draft(page, local); await page.goto('/en/ma-stack'); await login(page, 'en', 'draft@example.invalid');
  const load = page.getByRole('button', { name: 'Load my saved stack', exact: true });
  if (choice === 'equivalent') await expect(load).toHaveCount(0);
  else { await expect(load).toBeVisible(); await page.getByRole('button', { name: choice === 'saved' ? 'Load my saved stack' : 'Add my new selection', exact: true }).click(); }
  await saved(page); const result = await snapshot(page);
  expect(result.selection.pinnedToolSlugs).toEqual(choice === 'merge' ? ['notion', 'figma'] : ['notion']); expect(result.billing.choices.notion.amount).toBe(11);
});

test('offline dirty cache survives reload, retry and lost acknowledgement', async ({ page, request }) => {
  await draft(page, state()); await page.goto('/en/ma-stack'); await login(page, 'en', 'offline@example.invalid'); await saved(page);
  await page.route('**/api/stack-account', route => route.abort());
  await change(page, state(['notion', 'figma'])); await expect(page.locator('.ms-account [role=status]')).toHaveText(/Unsaved changes|Saving unavailable/);
  await page.reload(); await expect.poll(async () => (await snapshot(page)).selection.pinnedToolSlugs).toEqual(['notion', 'figma']);
  await expect(page.locator('.ms-account [role=status]')).toHaveText(/Unsaved changes|Saving unavailable/);
  await page.unroute('**/api/stack-account'); await page.getByRole('button', { name: 'Retry saving', exact: true }).click(); await saved(page);
  await control(request, 'fault', { path: '/api/stack-account', method: 'PUT', commitThenFail: true, status: 503 });
  await change(page, state(['figma']));
  await expect.poll(async () => (await control(request, 'state')).accounts[0].stack.revision).toBe(3); await saved(page);
  await expect(page.getByRole('heading', { name: 'Another version was saved', exact: true })).toHaveCount(0);
  expect((await control(request, 'state')).accounts[0].stack.revision).toBe(3);
});

for (const resolve of ['latest', 'current']) test(`CAS409 requires explicit choice: ${resolve}`, async ({ page, request }) => {
  await draft(page, state()); await page.goto('/en/ma-stack'); await login(page, 'en', 'cas@example.invalid'); await saved(page);
  await control(request, 'seed', { email: 'cas@example.invalid', state: state(['slack']), revision: 2 });
  await change(page, state(['notion', 'figma'])); await expect(page.getByRole('heading', { name: 'Another version was saved', exact: true })).toBeVisible();
  expect((await control(request, 'state')).accounts[0].stack.state.selection.pinnedToolSlugs).toEqual(['slack']);
  await page.getByRole('button', { name: resolve === 'latest' ? 'Load the saved version' : 'Save my current version', exact: true }).click(); await saved(page);
  expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual(resolve === 'latest' ? ['slack'] : ['notion', 'figma']);
});

test('late A response cannot hydrate or save as B after sign out', async ({ page, request }) => {
  await control(request, 'seed', { email: 'a@example.invalid', state: state(['notion']) });
  await control(request, 'seed', { email: 'b@example.invalid', state: state(['figma']) });
  await page.goto('/en/ma-stack'); await login(page, 'en', 'a@example.invalid'); await saved(page);
  await control(request, 'fault', { path: '/api/stack-account', method: 'GET', delayMs: 1500 });
  await page.reload(); await expect(page.locator('.ac-header-trigger')).toBeVisible(); await signOut(page);
  await login(page, 'en', 'b@example.invalid'); await saved(page);
  // Wait on the delayed transport completion, then check scoped state again.
  await expect.poll(async () => (await control(request, 'state')).requests.filter((r: { method: string; path: string }) => r.path === '/api/stack-account' && r.method === 'GET').length).toBeGreaterThanOrEqual(3);
  await page.waitForTimeout(1700); expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual(['figma']);
  expect((await control(request, 'state')).accounts.find((a: { email: string }) => a.email === 'b@example.invalid').stack.state.selection.pinnedToolSlugs).toEqual(['figma']);
});

test('Google success returns safely and adopts the SDK session without losing draft', async ({ page, request }) => {
  await draft(page, state(['figma'])); await page.goto('/en/ma-stack?recette=google');
  const safeReturns = await page.evaluate(async () => {
    const path = '/src/lib/stackAccountCoordinator.ts'; const { getStackAccountReturnUrl } = await import(/* @vite-ignore */ path);
    return ['https://outside.example.invalid/path', '//outside.example.invalid/path', '/en/not-a-route', '/\\outside.example.invalid'].map(returnTo => getStackAccountReturnUrl({ lang: 'en', returnTo }));
  }); expect(safeReturns).toEqual(Array(4).fill(`${process.env.PLAYWRIGHT_BASE_URL}/en/ma-stack`));
  await dismissConsent(page); await page.getByRole('button', { name: 'Save my stack', exact: true }).click(); await page.getByRole('button', { name: 'Continue with Google', exact: true }).click();
  await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', 'Account: Google Fixture'); await saved(page);
  await expect(page).toHaveURL(/\/en\/ma-stack\?recette=google#?$/); expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual(['figma']);
  expect((await control(request, 'state')).accounts[0].stack.state.selection.pinnedToolSlugs).toEqual(['figma']);
});
