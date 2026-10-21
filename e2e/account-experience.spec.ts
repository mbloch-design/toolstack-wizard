import { test, expect, control, draft, state, snapshot, saved, isolate, login, signOut, dismissConsent, change } from './fixtures/accounts';

test('signup requires confirmation delivered only through local mailbox', async ({ page, request, browser }) => {
  const full = state(['notion', 'figma']); full.billing = { paid: ['notion'], reviewed: ['figma'], choices: { notion: { source: 'custom', amount: 49, currency: 'EUR', period: 'annual', seats: 2 } } }; full.decisions = { 'figma|notion': { kind: 'keep-both', kept: 'notion', saving: 4, at: '2026-10-19T12:00:00Z' } };
  await draft(page, full); await page.goto('/en/sign-up'); await dismissConsent(page);
  await page.getByRole('button', { name: 'Continue with email', exact: true }).click();
  await page.getByLabel('Email address', { exact: true }).fill('signup@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill(' fixture signup pass ');
  await page.getByRole('button', { name: 'Create my account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Check your email', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Resend confirmation link/ })).toBeDisabled();
  await page.goto('/__accounts-test/mailbox');
  await page.getByRole('link', { name: 'Confirm signup@example.invalid', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/ma-stack$/);
  await saved(page); expect(await snapshot(page)).toEqual(full);
  const otherContext = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL }); await isolate(otherContext); const other = await otherContext.newPage();
  await other.goto('/en/ma-stack'); await login(other, 'en', 'signup@example.invalid', ' fixture signup pass '); await saved(other); expect(await snapshot(other)).toEqual(full); await otherContext.close();
  expect((await control(request, 'state')).requests.some((r: { path: string }) => r.path === '/auth/v1/signup')).toBe(true);
});

async function emailForm(page: import('@playwright/test').Page, email: string, password: string) {
 await page.getByRole('button', { name: 'Continue with email', exact: true }).click();
 await page.getByLabel('Email address', { exact: true }).fill(email);
 await page.getByLabel('Password', { exact: true }).fill(password);
}

test('wrong password never creates an account; unconfirmed email can resend with cooldown', async ({ page, request }) => {
 await control(request, 'seed', { email: 'unconfirmed@example.invalid', confirmed: false });
 await page.goto('/en/sign-in'); await dismissConsent(page); await page.clock.install();
 await emailForm(page, 'unknown@example.invalid', 'bad');
 await page.locator('.ac-form').getByRole('button', { name: 'Sign in', exact: true }).click();
 await expect(page.getByRole('alert')).toContainText(/email|password/i);
 expect((await control(request, 'state')).accounts).toHaveLength(1);
 await page.getByLabel('Email address', { exact: true }).fill('unconfirmed@example.invalid');
 await page.getByLabel('Password', { exact: true }).fill('fixture-password');
 await page.locator('.ac-form').getByRole('button', { name: 'Sign in', exact: true }).click();
 await expect(page.getByRole('alert')).toContainText(/confirm/i);
 const resend = page.getByRole('button', { name: /Resend confirmation link/ });
 await resend.click(); await expect(page.getByRole('status')).toContainText('If this address'); await page.getByLabel('Password', { exact: true }).fill('fixture-password'); await page.locator('.ac-form').getByRole('button', { name: 'Sign in', exact: true }).click(); await expect(resend).toBeDisabled(); await page.clock.runFor(61_000); await expect(resend).toBeEnabled(); await resend.click();
 expect((await control(request, 'state')).requests.filter((r: { path: string }) => r.path === '/auth/v1/resend')).toHaveLength(2);
});

test('cold SDK recovery waits for transport, survives reload, changes exact password and distinguishes revocation warning', async ({ page, request, browser }) => {
 await control(request, 'seed', { email: 'recovery@example.invalid' });
 await page.goto('/en/sign-in'); await dismissConsent(page); await emailForm(page, 'recovery@example.invalid', 'irrelevant');
 await page.getByRole('button', { name: 'Forgot password?', exact: true }).click();
 await page.getByRole('button', { name: 'Send link', exact: true }).click(); await expect(page.getByRole('status')).toContainText('If this address');
 const cold = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL }); await isolate(cold);
 await cold.addInitScript(() => {
  (window as unknown as { invalidFlash: boolean }).invalidFlash = false;
  new MutationObserver(() => { if (document.body?.textContent?.includes('This link is invalid or expired')) (window as unknown as { invalidFlash: boolean }).invalidFlash = true; }).observe(document, { subtree: true, childList: true, characterData: true });
 });
 const recovered = await cold.newPage(); const errors: string[] = []; recovered.on('pageerror', error => errors.push(error.message)); await recovered.goto('/__accounts-test/mailbox');
 await control(request, 'fault', { path: '/auth/v1/user', method: 'GET', delayMs: 800 });
 await recovered.getByRole('link', { name: 'Recover recovery@example.invalid', exact: true }).click();
 await expect(recovered.getByRole('status')).toContainText('Checking your recovery link');
 await expect(recovered.getByLabel('New password', { exact: true })).toBeVisible();
 expect(await recovered.evaluate(() => (window as unknown as { invalidFlash: boolean }).invalidFlash)).toBe(false);
 await expect(recovered).toHaveURL(/\/en\/account\/reset-password#?$/);
 await recovered.reload(); await expect(recovered.getByLabel('New password', { exact: true })).toBeVisible();
 expect(await recovered.evaluate(() => (window as unknown as { invalidFlash: boolean }).invalidFlash)).toBe(false);
 await recovered.getByLabel('New password', { exact: true }).fill(' new fixture password ');
 await recovered.getByLabel('Confirm password', { exact: true }).fill('mismatched password');
 await recovered.getByRole('button', { name: 'Save new password', exact: true }).click(); await expect(recovered.getByRole('alert')).toContainText('do not match');
 await recovered.getByLabel('Confirm password', { exact: true }).fill(' new fixture password ');
 await control(request, 'fault', { path: '/auth/v1/logout', method: 'POST', status: 500 });
 await recovered.getByRole('button', { name: 'Save new password', exact: true }).click();
 await expect(recovered.getByRole('status')).toContainText('Your password has been changed');
 await expect(recovered.getByRole('alert')).toContainText('Your new password is saved');
 const requests = (await control(request, 'state')).requests;
 expect(requests.filter((r: { path: string; method: string }) => r.path === '/auth/v1/user' && r.method === 'PUT')).toHaveLength(1);
 expect(JSON.stringify(requests)).not.toContain('new fixture password');
 expect(await recovered.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('new fixture password');
 await recovered.getByRole('link', { name: 'Open my settings', exact: true }).click(); await dismissConsent(recovered); await signOut(recovered);
 await recovered.goto('/en/ma-stack'); await login(recovered, 'en', 'recovery@example.invalid', ' new fixture password '); await saved(recovered);
 expect(errors).toEqual([]); await cold.close();
});

test('expired recovery and forged URL cannot authorize password update', async ({ page, request }) => {
 await control(request, 'seed', { email: 'expired@example.invalid' });
 await page.goto('/en/ma-stack'); await login(page, 'en', 'expired@example.invalid'); await saved(page);
 await page.goto('/en/account/settings'); await page.getByRole('button', { name: 'Send password link', exact: true }).click();
 await expect(page.getByText('If this address can receive this message, a link will be sent.', { exact: true })).toBeVisible();
 await control(request, 'expire-mail'); await signOut(page);
 await page.goto('/__accounts-test/mailbox'); await page.getByRole('link', { name: 'Recover expired@example.invalid', exact: true }).click();
 await expect(page.getByText('This link is invalid or expired. Request a new link.', { exact: true })).toBeVisible();
 await page.goto('/en/account/reset-password?recovery=true'); await expect(page.getByLabel('New password', { exact: true })).toHaveCount(0);
 expect((await control(request, 'state')).requests.filter((r: { path: string; method: string }) => r.path === '/auth/v1/user' && r.method === 'PUT')).toHaveLength(0);
});

for (const provider of ['Google', 'GitHub']) for (const denied of [false, true]) test(`${provider} ${denied ? 'cancel' : 'success'} returns to fiche and preserves draft`, async ({ page, request }) => {
 await draft(page, state(['figma'])); await control(request, 'oauth', { denied }); await page.goto('/en/tool/notion?source=account-test'); await dismissConsent(page);
 await page.locator('.ac-header-trigger').click(); await page.getByRole('button', { name: `Continue with ${provider}`, exact: true }).click();
 if (denied) { await expect(page.getByRole('alert')).toContainText('cancelled or denied'); await page.getByRole('link', { name: 'Back to sign in', exact: true }).click(); await expect(page).toHaveURL(/returnTo=%2Fen%2Ftool%2Fnotion/); }
 else { await expect(page).toHaveURL('/en/tool/notion?source=account-test'); await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', `Account: ${provider.toLowerCase()}@example.invalid`); await page.goto('/en/account/settings'); await expect(page.locator('.ac-identities')).toHaveText(`${provider}Connected`); }
 expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual(['figma']);
});

for (const lang of ['fr', 'en'] as const) for (const width of [390, 1440]) for (const theme of ['light', 'dark'] as const) test(`${lang} ${width} ${theme}: modal, menu and settings keyboard and clean renders`, async ({ page }) => {
 await page.setViewportSize({ width, height: 1000 }); await page.addInitScript(theme => localStorage.setItem('tooltrim:theme', theme), theme);
 await page.goto(`/${lang}/tool/notion`); await dismissConsent(page);
 const header = page.locator('.ac-header-trigger'); await header.focus(); await page.keyboard.press('Enter');
 const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible(); await expect(dialog.getByRole('button', { name: /Google/ })).toBeFocused();
 expect(await page.locator('main').evaluate(node => !!node.closest('[aria-hidden=true]'))).toBe(true);
 for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true); }
 const directory = '.superpowers/sdd/2026-10-21-account-experience/render-task4';
 await page.screenshot({ path: `${directory}/modal-${lang}-${width}-${theme}.png` });
 await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(header).toBeFocused();
 await page.goto(`/${lang}/ma-stack`); await login(page, lang, 'render@example.invalid'); await saved(page, lang); await expect(page.getByRole('dialog')).toHaveCount(0); await expect(header).toBeFocused();
 await header.focus(); await page.keyboard.press('Enter'); await expect(page.locator('.ac-menu')).toBeVisible();
 expect(await page.locator('.ac-menu').evaluate(node => node.contains(document.activeElement))).toBe(true);
 for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); expect(await page.locator('.ac-menu').evaluate(node => node.contains(document.activeElement))).toBe(true); }
 await page.screenshot({ path: `${directory}/menu-${lang}-${width}-${theme}.png` });
 await page.keyboard.press('Escape'); await expect(page.locator('.ac-menu')).toHaveCount(0); await expect(header).toBeFocused();
 await header.click(); await page.getByRole('link', { name: lang === 'fr' ? 'Paramètres' : 'Settings', exact: true }).click();
 await expect(page.getByLabel(lang === 'fr' ? 'Nom d’affichage (facultatif)' : 'Display name (optional)', { exact: true })).toBeVisible();
 await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1); await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
 await expect(page.locator('html')).toHaveAttribute('lang', lang);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.screenshot({ path: `${directory}/settings-${lang}-${width}-${theme}.png` });
});

test('profile save is confirmed and reread; shared theme, language, currency, export and dirty logout retain ownership', async ({ page, request }) => {
 const full = state(['notion']); full.billing.choices.notion = { source: 'custom', amount: 67, currency: 'USD', period: 'monthly' }; full.billing.paid = ['notion'];
 await draft(page, full); await page.goto('/en/ma-stack'); await login(page, 'en', 'admin@example.invalid'); await saved(page);
 await page.goto('/en/account/settings'); const name = page.getByLabel('Display name (optional)', { exact: true });
 await control(request, 'fault', { path: '/api/account-profile', method: 'PUT', status: 503 });
 await name.fill('My display name'); await page.getByRole('button', { name: 'Save name', exact: true }).click(); await expect(page.getByRole('alert', { name: 'Profile' })).toContainText('not saved');
 await page.getByRole('button', { name: 'Save name', exact: true }).click(); await expect(page.getByRole('status', { name: 'Profile' })).toHaveText('Name saved.');
 await page.reload(); await expect(name).toHaveValue('My display name'); await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', 'Account: My display name');
 await page.locator('.ac-header-trigger').click(); await expect(page.getByRole('link', { name: 'Back office', exact: true })).toBeVisible(); await page.keyboard.press('Escape');
 await expect(page.locator('.ac-identities')).toHaveText('EmailConnected');
 await page.getByLabel('Theme', { exact: true }).selectOption('dark'); await expect(page.locator('html')).toHaveClass(/dark/);
 await page.getByLabel('Currency', { exact: true }).selectOption('EUR');
 expect(await page.evaluate(() => localStorage.getItem('tooltrim:theme'))).toBe('dark');
 await page.locator('.ac-settings').getByRole('link', { name: 'Français', exact: true }).click(); await expect(page).toHaveURL('/fr/compte/parametres');
 await expect(page.getByLabel('Thème', { exact: true })).toHaveValue('dark'); await expect(page.getByLabel('Devise', { exact: true })).toHaveValue('EUR');
 const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Exporter ma stack en JSON', exact: true }).click();
 const file = await (await download).path(); const { readFile } = await import('node:fs/promises'); expect(JSON.parse(await readFile(file!, 'utf8'))).toEqual(full);
 await page.route('**/api/stack-account', route => route.request().method() === 'PUT' ? route.abort() : route.continue());
 await change(page, state(['figma'])); await expect(page.getByText('Modifications non enregistrées', { exact: true })).toBeVisible();
 await page.getByRole('button', { name: 'Me déconnecter', exact: true }).click(); await page.getByRole('button', { name: 'Rester connecté', exact: true }).click(); expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual(['figma']);
 await page.getByRole('button', { name: 'Me déconnecter', exact: true }).click();
 await control(request, 'fault', { path: '/auth/v1/logout', method: 'POST', status: 400 });
 await page.getByRole('button', { name: 'Me déconnecter sans enregistrer', exact: true }).click(); await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
 await page.getByRole('button', { name: 'Me déconnecter sans enregistrer', exact: true }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', 'Se connecter');
 expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('My display name');
 expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual([]);
});

test('late profile A response cannot appear in B menu or settings', async ({ page, request }) => {
 await control(request, 'seed', { email: 'profile-a@example.invalid', displayName: 'Private Alice' });
 await control(request, 'seed', { email: 'profile-b@example.invalid', displayName: 'Private Bob' });
 await control(request, 'fault', { path: '/api/account-profile', method: 'GET', delayMs: 1800 });
 await page.goto('/en/ma-stack'); await login(page, 'en', 'profile-a@example.invalid'); await saved(page); await signOut(page);
 await login(page, 'en', 'profile-b@example.invalid'); await saved(page);
 await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', 'Account: Private Bob');
 await page.goto('/en/account/settings'); await expect(page.getByLabel('Display name (optional)', { exact: true })).toHaveValue('Private Bob');
 await page.waitForTimeout(2000); await expect(page.locator('body')).not.toContainText('Private Alice'); await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', 'Account: Private Bob');
});

test('closing a pending password request restores focus and keeps its return journey', async ({ page, request }) => {
 await control(request, 'seed', { email: 'pending@example.invalid' }); await page.goto('/en/tool/notion'); await dismissConsent(page);
 await page.locator('.ac-header-trigger').click(); await emailForm(page, 'pending@example.invalid', 'fixture-password');
 await control(request, 'fault', { path: '/auth/v1/token', method: 'POST', delayMs: 800 });
 await page.getByRole('dialog').getByRole('button', { name: 'Sign in', exact: true }).click(); await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.locator('.ac-header-trigger')).toBeFocused();
 await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', 'Account: pending@example.invalid');
 await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page).toHaveURL('/en/tool/notion');
});
