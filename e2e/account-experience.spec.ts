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
 await expect(recovered.getByRole('status').filter({hasText:'Checking your recovery link'})).toContainText('Checking your recovery link');
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
 await page.goto('/en/account/settings'); await page.getByRole('navigation', { name: 'Settings sections' }).getByRole('link', { name: 'Sign-in and security', exact: true }).click(); await page.getByRole('button', { name: 'Send password link', exact: true }).click();
 await expect(page.getByText('If this address can receive this message, a link will be sent.', { exact: true })).toBeVisible();
 await control(request, 'expire-mail'); await signOut(page);
 await page.goto('/__accounts-test/mailbox'); await page.getByRole('link', { name: 'Recover expired@example.invalid', exact: true }).click();
 await expect(page.getByText('This link is invalid or expired. Request a new link.', { exact: true })).toBeVisible();
 await page.goto('/en/account/reset-password?recovery=true'); await expect(page.getByLabel('New password', { exact: true })).toHaveCount(0);
 expect((await control(request, 'state')).requests.filter((r: { path: string; method: string }) => r.path === '/auth/v1/user' && r.method === 'PUT')).toHaveLength(0);
});

for (const provider of ['Google', 'GitHub']) for (const denied of [false, true]) test(`${provider} ${denied ? 'cancel' : 'success'} returns to fiche and preserves draft`, async ({ page, request }) => {
 await draft(page, state(['figma'])); await control(request, 'oauth', { denied }); await page.goto('/en/tool/notion?source=account-test'); await dismissConsent(page);
 await page.goto('/en/sign-in?returnTo='+encodeURIComponent('/en/tool/notion?source=account-test')); await page.getByRole('button', { name: `Continue with ${provider}`, exact: true }).click();
 if (denied) { await expect(page.getByRole('alert')).toContainText('cancelled or denied'); await page.getByRole('link', { name: 'Back to sign in', exact: true }).click(); await expect(page).toHaveURL(/returnTo=%2Fen%2Ftool%2Fnotion/); }
 else { await expect(page).toHaveURL('/en/tool/notion?source=account-test'); await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', `Account: ${provider === 'Google' ? 'Google' : 'GitHub'} Fixture`); await page.goto('/en/account/settings'); await page.getByRole('navigation', { name: 'Settings sections' }).getByRole('link', { name: 'Sign-in and security', exact: true }).click(); await expect(page.locator('.ac-identities')).toHaveText(`${provider}Connected`); }
 expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual(['figma']);
});

for (const lang of ['fr', 'en'] as const) for (const width of [390, 1440]) for (const theme of ['light', 'dark'] as const) test(`${lang} ${width} ${theme}: modal, menu and settings keyboard and clean renders`, async ({ page }) => {
 await page.setViewportSize({ width, height: 1000 }); await page.addInitScript(theme => localStorage.setItem('tooltrim:theme', theme), theme);
 await page.goto(`/${lang}/ma-stack`); await dismissConsent(page);
 const entry = page.getByRole('button',{name:lang==='fr'?'J’ai déjà un compte':'I already have an account',exact:true});
 const header = page.locator('.ac-header-trigger'); await entry.focus(); await page.keyboard.press('Enter');
 const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible(); await expect(dialog.getByRole('button', { name: /Google/ })).toBeFocused();
 expect(await page.locator('main').evaluate(node => !!node.closest('[aria-hidden=true]'))).toBe(true);
 for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true); }
 const directory = '.superpowers/sdd/2026-10-21-account-experience/render-task4';
 await page.screenshot({ path: `${directory}/modal-${lang}-${width}-${theme}.png` });
 await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(entry).toBeFocused();
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
 await page.getByRole('navigation', { name: 'Settings sections' }).getByRole('link', { name: 'Preferences', exact: true }).click();
 await page.getByRole('radio', { name: 'Dark', exact: true }).check(); await expect(page.locator('html')).toHaveClass(/dark/);
 await page.getByRole('radio', { name: 'EUR', exact: true }).check();
 expect(await page.evaluate(() => localStorage.getItem('tooltrim:theme'))).toBe('dark');
 await page.locator('.ac-settings').getByRole('link', { name: 'Français', exact: true }).click(); await expect(page).toHaveURL('/fr/compte/parametres#ac-preferences-section');
 await expect(page.getByRole('radio', { name: 'Sombre', exact: true })).toBeChecked(); await expect(page.getByRole('radio', { name: 'EUR', exact: true })).toBeChecked();
 await page.getByRole('navigation', { name: 'Rubriques des paramètres' }).getByRole('link', { name: 'Stack et données', exact: true }).click();
 const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Exporter ma stack en JSON', exact: true }).click();
 const file = await (await download).path(); const { readFile } = await import('node:fs/promises'); expect(JSON.parse(await readFile(file!, 'utf8'))).toEqual(full);
 await page.route('**/api/stack-account', route => route.request().method() === 'PUT' ? route.abort() : route.continue());
 await change(page, state(['figma'])); await expect(page.getByText('Modifications non enregistrées', { exact: true })).toBeVisible();
 await page.getByRole('navigation', { name: 'Rubriques des paramètres' }).getByRole('link', { name: 'Connexion et sécurité', exact: true }).click();
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
 await login(page, 'en', 'profile-b@example.invalid', 'fixture-password', 'Private Bob'); await saved(page);
 await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', 'Account: Private Bob');
 await page.goto('/en/account/settings'); await expect(page.getByLabel('Display name (optional)', { exact: true })).toHaveValue('Private Bob');
 await page.waitForTimeout(2000); await expect(page.locator('body')).not.toContainText('Private Alice'); await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', 'Account: Private Bob');
});

test('closing a pending password request restores focus and keeps its return journey', async ({ page, request }) => {
 await control(request, 'seed', { email: 'pending@example.invalid' }); await page.goto('/en/ma-stack'); await dismissConsent(page);
 await page.getByRole('button',{name:'I already have an account',exact:true}).click(); await emailForm(page, 'pending@example.invalid', 'fixture-password');
 await control(request, 'fault', { path: '/auth/v1/token', method: 'POST', delayMs: 800 });
 await page.getByRole('dialog').getByRole('button', { name: 'Sign in', exact: true }).click(); await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.locator('.ac-header-trigger')).toBeFocused();
 await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', 'Account: pending@example.invalid');
 await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page).toHaveURL('/en/ma-stack');
});

for (const provider of ['google','github'] as const) test(`OAuth useful profile ${provider}: import, reread, reconnect, explicit null and back office`,async({page,request,browser})=>{
 const displayName=provider==='google'?'Google Fixture':'GitHub Fixture';
 const photo=provider==='google'?'https://lh3.googleusercontent.com/a/fixture?sz=96':'https://avatars.githubusercontent.com/u/123?v=4';
 // Deliver a visible local fixture avatar; no request ever reaches a provider host.
 const avatar='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#315edd"/><circle cx="32" cy="25" r="11" fill="#fff"/><path d="M13 58c2-13 10-19 19-19s17 6 19 19" fill="#fff"/></svg>';
 await page.route(/https:\/\/(lh3\.googleusercontent\.com|avatars\.githubusercontent\.com)\//,route=>route.fulfill({contentType:'image/svg+xml',body:avatar}));
 const connect=async()=>{await page.goto('/en/sign-in');await dismissConsent(page);await page.getByRole('button',{name:`Continue with ${provider==='google'?'Google':'GitHub'}`,exact:true}).click();await expect(page).toHaveURL(/\/en\/ma-stack$/);await saved(page);};
 await connect();await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label',`Account: ${displayName}`);
 await page.goto('/en/account/settings');const name=page.getByLabel('Display name (optional)',{exact:true});await expect(name).toHaveValue(displayName);
 await expect(page.locator('.ac-profile-summary img')).toHaveAttribute('src',photo);await expect(page.locator('.ac-profile-summary img')).toHaveAttribute('referrerpolicy','no-referrer');
 await page.getByText('Account information',{exact:true}).click();await expect(page.getByText('Provider language',{exact:true})).toBeVisible();await expect(page.getByText('en-US',{exact:true})).toBeVisible();await page.reload();await expect(name).toHaveValue(displayName);
 const context=await browser.newContext({baseURL:process.env.PLAYWRIGHT_BASE_URL});await isolate(context);const admin=await context.newPage();
 await control(request,'seed',{email:'admin@example.invalid'});await admin.goto('/en/sign-in');await dismissConsent(admin);await emailForm(admin,'admin@example.invalid','fixture-password');await admin.locator('.ac-form').getByRole('button',{name:'Sign in',exact:true}).click();await expect(admin).toHaveURL(/\/en\/ma-stack$/);
 await admin.goto('/en/back-office');await expect(admin.getByText(displayName,{exact:true})).toBeVisible();await admin.getByRole('button',{name:`View stack for ${provider}@example.invalid`,exact:true}).click();await expect(admin.locator('.ba-detail')).toContainText(`Initial profile provider: ${provider==='google'?'Google':'GitHub'}`);await expect(admin.locator('.ba-detail')).toContainText('Provider language: en-US');await context.close();
 await page.screenshot({path:test.info().outputPath(`oauth-${provider}-profile.png`)});
 await name.fill('');await page.getByRole('button',{name:'Save name',exact:true}).click();await expect(page.getByRole('status',{name:'Profile'})).toHaveText('Name saved.');
 await signOut(page);await connect();await page.goto('/en/account/settings');await expect(name).toHaveValue('');await page.reload();await expect(name).toHaveValue('');
 await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label',`Account: ${provider}@example.invalid`);
 expect((await snapshot(page)).version).toBe(4);
});

test('empty guest stack explains its value and requires an account before adding tools', async ({page,request}) => {
 await page.goto('/en/ma-stack'); await dismissConsent(page);
 await expect(page.getByRole('heading',{name:'The right tools. Just the essentials.',exact:true})).toBeVisible();
 await expect(page.getByRole('searchbox',{name:'Add a tool to my stack',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Create my stack',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('heading',{name:'Create your ToolTrim account',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual([]);
 await control(request,'seed',{email:'first-tool@example.invalid',state:state([])});
 await login(page,'en','first-tool@example.invalid'); await saved(page);
 await page.getByRole('searchbox',{name:'Add a tool to my stack',exact:true}).fill('Notion');
 await page.locator('.ms-results').getByRole('button',{name:'Add Notion',exact:true}).click();
 expect((await snapshot(page)).selection.pinnedToolSlugs).toContain('notion'); await saved(page);
});

for (const width of [390, 1440]) test(`navigation roles ${width}: cart access stays top right, contextual add and account menu stay distinct`, async ({page}) => {
 await page.setViewportSize({width,height:900});
 await draft(page,state([])); await page.goto('/en/ma-stack'); await dismissConsent(page);
 const cart=page.locator('.asv2-topbar').getByRole('link',{name:'My stack',exact:true});
 await expect(cart).toHaveAttribute('aria-current','page');
 await expect(cart).toBeVisible();
 await expect(cart).toHaveAttribute('href','/en/ma-stack');
 await expect(page.locator('.asv2-sidebar').getByRole('link',{name:'My stack',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Create my stack',exact:true})).toBeVisible();
 await expect(page.getByRole('searchbox',{name:'Add a tool to my stack',exact:true})).toHaveCount(0);
 await login(page,'en',`navigation-${width}@example.invalid`); await saved(page);
 await page.locator('.ac-header-trigger--account').click();
 await expect(page.locator('.ac-menu').getByRole('link',{name:'My stack',exact:true})).toHaveCount(0);
 await expect(page.locator('.ac-menu').getByRole('link',{name:'Settings',exact:true})).toBeVisible();
});

test('signing out from settings returns home and anonymous settings cannot reopen', async ({page}) => {
 await page.goto('/en/ma-stack'); await login(page,'en','settings-exit@example.invalid'); await saved(page);
 await page.goto('/en/account/settings'); await expect(page.getByLabel('Display name (optional)')).toBeVisible();
 await signOut(page);
 await expect(page).toHaveURL('/en');
 await expect(page.getByRole('heading',{name:'Account settings',exact:true})).toHaveCount(0);
 await page.goto('/en/account/settings'); await expect(page).toHaveURL('/en');
 await expect(page.locator('.ac-profile-summary')).toHaveCount(0);
 await expect(page.locator('.asv2-topbar').getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
});

test('catalogue add requires authentication and never claims an anonymous save', async ({page,request}) => {
 await draft(page,state([])); await page.goto('/en/tool/notion'); await dismissConsent(page);
 await page.locator('.pin-tool-button:visible').first().click();
 await expect(page.getByRole('dialog').getByRole('heading',{name:'Create your ToolTrim account',exact:true})).toBeVisible();
 expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual([]);
 await expect(page.locator('[data-sonner-toast]').filter({hasText:'added to your stack'})).toHaveCount(0);
 await page.keyboard.press('Escape');
 const requests=(await control(request,'state')).requests;
 expect(requests.filter((r:{path:string;method:string})=>r.path==='/api/stack-account'&&r.method==='PUT')).toHaveLength(0);
});

for (const lang of ['fr','en'] as const) for (const width of [390,1440]) test(`connected empty stack onboarding ${lang} ${width}`, async ({page,request}) => {
 await page.setViewportSize({width,height:1000});
 await control(request,'seed',{email:'empty-start@example.invalid'});
 await page.goto(`/${lang}/ma-stack`);await login(page,lang,'empty-start@example.invalid');
 await expect(page.getByRole('heading',{name:lang==='fr'?"Choisir,\u00a0pas empiler.":"Choose. Don't pile up.",exact:true})).toBeVisible();
 await expect(page.getByText(lang==='fr'?'Stack enregistrée':'Stack saved',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('searchbox',{name:lang==='fr'?'Ajouter un outil à ma stack':'Add a tool to my stack'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await page.screenshot({path:`test-results/accounts/empty-start-${lang}-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:lang==='fr'?'Ajouter Notion':'Add Notion',exact:true}).click();
 await expect.poll(async()=> (await snapshot(page)).selection.pinnedToolSlugs).toContain('notion');
 await saved(page,lang);
 await expect(page.getByRole('heading',{name:lang==='fr'?'Mes outils':'My tools',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:lang==='fr'?'Mes outils':'My tools',exact:true})).toBeFocused();
});
test('OAuth callback remains a quiet transition while reading stack, then returns automatically',async({page,request})=>{
 await page.route('**/api/stack-account',async route=>{if(route.request().method()==='GET')await new Promise(resolve=>setTimeout(resolve,1800));await route.continue();});
 await page.goto('/en/sign-in');await dismissConsent(page);await page.getByRole('button',{name:'Continue with Google',exact:true}).click();
 await expect(page.locator('.ac-transition-title')).toHaveText('One moment, finding your stack.');
 await expect(page.locator('footer')).toHaveCount(0);
 await expect(page.getByText('You are signed in.',{exact:true})).toHaveCount(0);
 await expect(page).toHaveURL(/\/en\/ma-stack$/);
});

for (const width of [390, 1440]) test(`partial stack budget stays consistent ${width}`, async ({page, request}) => {
 await page.setViewportSize({width, height:1000});
 const full = state(['motion-array','audacity','figma','grammarly']);
 full.billing = {paid:['motion-array'],reviewed:['motion-array'],choices:{'motion-array':{source:'custom',amount:29,currency:'USD',period:'monthly'}}};
 await control(request,'seed',{email:'partial-budget@example.invalid',state:full});
 await page.goto('/en/ma-stack'); await login(page,'en','partial-budget@example.invalid'); await saved(page,'en');
 await expect(page.getByText('Known budget so far',{exact:true})).toBeVisible();
 const expandPrice = page.locator('.mf-price .mf-expand[aria-expanded="false"]');
 if(await expandPrice.isVisible()) await expandPrice.click();
 await expect(page.getByText('2 of 4 tools priced',{exact:true})).toBeVisible();
 await expect(page.getByText('Stack saving',{exact:true})).toHaveCount(0);
 await expect(page.locator('.ms-all-sum')).toContainText('partial');
 const expandSplit = page.locator('.mf-balance .mf-expand[aria-expanded="false"]');
 if(await expandSplit.isVisible()) await expandSplit.click();
 await expect(page.locator('.mf-balance .mf-bb')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await page.screenshot({path:`test-results/accounts/partial-budget-${width}.png`,fullPage:true});
});

test('budget includes the two free tools alongside two paid tools', async ({page,request}) => {
 const full=state(['motion-array','grammarly','figma','audacity']);
 full.billing={paid:['motion-array','grammarly'],reviewed:['motion-array','grammarly','figma','audacity'],choices:{'motion-array':{source:'custom',amount:29,currency:'USD',period:'monthly'},grammarly:{source:'custom',amount:12,currency:'USD',period:'monthly'}}};
 await control(request,'seed',{email:'four-tools-budget@example.invalid',state:full});
 await page.goto('/en/ma-stack');await login(page,'en','four-tools-budget@example.invalid');await saved(page,'en');
 await expect(page.locator('.mf-price')).toContainText('2 free tools · no added cost');
 await expect(page.locator('.mf-cost-zero')).toContainText('Figma');
 await expect(page.locator('.mf-cost-zero')).toContainText('Audacity');
 await expect(page.locator('.mf-shares li')).toHaveCount(2);
 await page.screenshot({path:'test-results/accounts/four-tools-budget.png',fullPage:true});
});

test('first unconfirmed plan has no zero budget or empty analysis cards', async ({page,request}) => {
 await page.emulateMedia({reducedMotion:'reduce'});
 await control(request,'seed',{email:'first-budget@example.invalid',state:state(['notion'])});
 await page.goto('/en/ma-stack');await login(page,'en','first-budget@example.invalid');await saved(page,'en');
 await expect(page.locator('.mf-unknown-total')).toContainText('Budget not set yet');
 await expect(page.locator('.mf-price')).not.toContainText('$0');
 await expect(page.locator('.mf-balance')).toHaveCount(0);
 await expect(page.locator('.mf-fit')).toHaveCount(0);
 await expect(page.locator('.mf-now')).toContainText('Notion');
 await page.screenshot({path:'test-results/accounts/first-plan-budget.png',fullPage:true});
});

test('undoing the first free plan restores the unanswered question after reload', async ({page,request}) => {
 await page.emulateMedia({reducedMotion:'reduce'});
 await control(request,'seed',{email:'undo-plan@example.invalid',state:state(['notion'])});
 await page.goto('/en/ma-stack');await login(page,'en','undo-plan@example.invalid');await saved(page,'en');
 await expect(page.locator('.mf-unknown-total')).toContainText('Budget not set yet');
 await expect(page.locator('.mf-plan')).toHaveCount(3);
 await page.locator('.mf-plan').filter({hasText:'Free plan'}).first().click();
 await expect(page.locator('.mf-now')).toHaveCount(0);
 await page.getByRole('button',{name:'Undo',exact:true}).click();
 await expect(page.locator('.mf-now')).toContainText('Notion');
 await expect(page.locator('.mf-unknown-total')).toContainText('Budget not set yet');
 await saved(page,'en');await page.reload();await saved(page,'en');
 await expect(page.locator('.mf-unknown-total')).toContainText('Budget not set yet');
});

for(const width of [390,1440]) test(`personal welcome recognises the signed-in owner ${width}`,async({page,request})=>{
 await page.setViewportSize({width,height:1000});
 await control(request,'seed',{email:'welcome@example.invalid',displayName:'Michael',state:state(['notion'])});
 await page.goto('/fr/ma-stack');await login(page,'fr','welcome@example.invalid','fixture-password','Michael');
 await expect(page.locator('.ms-personal-greeting')).toContainText('Bonjour, Michael');
 await expect(page.locator('.ms-personal-message')).toContainText('Quelques choix restent à préciser');
 await expect(page.getByRole('heading',{name:'Mes outils',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await page.screenshot({path:`test-results/accounts/personal-welcome-${width}.png`,fullPage:true});
});

for(const width of [390,1440]) test(`one paid tool offers a next step instead of empty charts ${width}`,async({page,request})=>{
 await page.setViewportSize({width,height:1000});
 const full=state(['notion']);full.billing={paid:['notion'],reviewed:['notion'],choices:{notion:{source:'custom',amount:11,currency:'USD',period:'monthly'}}};
 await control(request,'seed',{email:'starter@example.invalid',displayName:'Michael',state:full});
 await page.goto('/en/ma-stack');await login(page,'en','starter@example.invalid','fixture-password','Michael');await saved(page,'en');
 await expect(page.getByRole('heading',{name:'Your stack is taking shape.',exact:true})).toBeVisible();
 await expect(page.locator('.ms-inventory-heading .ms-save-indicator')).toHaveAttribute('title','Stack saved');
 await expect(page.locator('.ms-page > .ms-empty-autosave')).toHaveCount(0);
 await expect(page.locator('.mf-balance')).toHaveCount(0);await expect(page.locator('.mf-fit')).toHaveCount(0);
 if(width>760){const price=await page.locator('.mf-price').boundingBox();const next=await page.locator('.mf-starter-next').boundingBox();expect(Math.abs(price!.y-next!.y)).toBeLessThan(3);}
 await page.screenshot({path:`test-results/accounts/starter-space-${width}.png`,fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Add another tool',exact:true}).click();
 await expect(page.getByRole('searchbox',{name:'Add a tool to my stack'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});
test('general header sign-in opens the personal stack',async({page,request})=>{
 await control(request,'seed',{email:'header-return@example.invalid',displayName:'Michael',state:state(['notion'])});
 await page.goto('/en');await dismissConsent(page);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await emailForm(page,'header-return@example.invalid','fixture-password');
 await page.locator('.ac-form').getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page).toHaveURL(/\/en\/ma-stack$/);
 await expect(page.locator('.ms-personal-greeting')).toContainText('Michael');
});
