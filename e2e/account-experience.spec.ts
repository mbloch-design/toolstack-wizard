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
 await admin.goto('/en/back-office');await admin.getByRole('navigation',{name:'Back-office navigation',exact:true}).getByRole('button',{name:'Users',exact:true}).click();await expect(admin.locator('tbody').getByText(displayName,{exact:true})).toBeVisible();await admin.getByRole('button',{name:`View stack for ${provider}@example.invalid`,exact:true}).click();await expect(admin.locator('.bo-detail')).toContainText(`Initial profile provider: ${provider==='google'?'Google':'GitHub'}`);await expect(admin.locator('.bo-detail')).toContainText('Provider language: en-US');await context.close();
 await page.screenshot({path:test.info().outputPath(`oauth-${provider}-profile.png`)});
 await name.fill('');await page.getByRole('button',{name:'Save name',exact:true}).click();await expect(page.getByRole('status',{name:'Profile'})).toHaveText('Name saved.');
 await signOut(page);await connect();await page.goto('/en/account/settings');await expect(name).toHaveValue('');await page.reload();await expect(name).toHaveValue('');
 await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label',`Account: ${provider}@example.invalid`);
 expect((await snapshot(page)).version).toBe(4);
});

test('a guest builds a stack before the account, and finds it waiting after signing in', async ({page,request}) => {
 await page.goto('/en/ma-stack'); await dismissConsent(page);
 await expect(page.getByRole('heading',{name:'Pay for what works. Nothing more.',exact:true})).toBeVisible();
 const keep=page.getByRole('button',{name:'See the full diagnosis',exact:true});
 await expect(keep).toBeDisabled();
 for (const name of ['Notion','Trello','Asana']) await page.getByRole('button',{name:`I use ${name}`,exact:true}).click();
 const stack=page.locator('.ss-stack');
 await expect(stack.locator('.ss-facts div').filter({hasText:'Tools'}).locator('dd')).toHaveText('3');
 // The count of overlaps is real; the other side of each pair comes with the account.
 await expect(stack.locator('.ss-reading')).toHaveText('3 pairs do the same job.');
 await expect(stack.locator('.ss-pairs li').first()).toContainText('and another tool');
 await keep.click();
 await expect(page.getByRole('dialog').getByRole('heading',{name:'Create your ToolTrim account',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 // Nothing is pinned without an account: the picks are a draft on this page.
 expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual([]);
 await page.reload(); await expect(stack.getByRole('button',{name:'Remove Notion',exact:true})).toBeVisible();
 await control(request,'seed',{email:'first-tool@example.invalid',state:state([])});
 await login(page,'en','first-tool@example.invalid'); await saved(page);
 // Signed in, the onboarding opens in the person's space with the guest picks already there.
 await expect(page.getByRole('heading',{level:1,name:/^Good (morning|afternoon|evening)\.$/})).toBeVisible();
 await expect(page.getByText(/Your 3 tools have already moved in/)).toBeVisible();
 await page.getByRole('button',{name:'Let’s go',exact:true}).click();
 await page.getByRole('button',{name:/^Operations/}).click();
 await expect(page.getByRole('heading',{level:1,name:'And your day rate?',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'I’d rather not say',exact:true}).click();
 for (const name of ['Notion','Trello','Asana']) await expect(page.locator('.ss-wall').getByRole('button',{name:`Remove ${name}`,exact:true})).toBeVisible();
 await page.locator('.ss-stack').getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByRole('heading',{level:1,name:'All set.',exact:true})).toBeVisible();
 expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual([]);
 await page.getByRole('button',{name:'Open my space',exact:true}).click();
 await expect.poll(async()=>(await snapshot(page)).selection.pinnedToolSlugs.sort()).toEqual(['asana','notion','trello']);
 expect((await snapshot(page)).trade).toBe('ops');
 expect((await snapshot(page)).dailyRate).toBeNull();
 await saved(page);
 const remote=(await control(request,'state')).accounts.find((account:{email:string})=>account.email==='first-tool@example.invalid');
 expect(remote.stack.state.trade).toBe('ops');
 await expect(page.getByRole('heading',{name:'All set.',exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('tooltrim-stack-starter-draft'))).toBeNull();
});

for (const width of [390, 1440]) test(`navigation roles ${width}: cart access stays top right, contextual add and account menu stay distinct`, async ({page}) => {
 await page.setViewportSize({width,height:900});
 await draft(page,state([])); await page.goto('/en/ma-stack'); await dismissConsent(page);
 const cart=page.locator('.asv2-topbar').getByRole('link',{name:'My stack',exact:true});
 await expect(cart).toHaveAttribute('aria-current','page');
 await expect(cart).toBeVisible();
 await expect(cart).toHaveAttribute('href','/en/ma-stack');
 await expect(page.locator('.asv2-sidebar').getByRole('link',{name:'My stack',exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Which tools do you use?',exact:true})).toBeVisible();
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
 const fr=lang==='fr';
 await page.setViewportSize({width,height:1000});
 await control(request,'seed',{email:`empty-start-${lang}-${width}@example.invalid`,displayName:'Camille Martin'});
 await page.goto(`/${lang}/ma-stack`);await login(page,lang,`empty-start-${lang}-${width}@example.invalid`,undefined,'Camille Martin');
 // Hello by first name, in the person's own space.
 await expect(page.getByRole('heading',{level:1,name:fr?/^(Bonjour|Bonsoir), Camille\.$/:/^Good (morning|afternoon|evening), Camille\.$/})).toBeVisible();
 await expect(page.getByText(fr?'Stack enregistrée':'Stack saved',{exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await page.getByRole('button',{name:fr?'C’est parti':'Let’s go',exact:true}).click();
 await expect(page.getByRole('heading',{level:1,name:fr?'Que faites-vous, Camille ?':'What do you do, Camille?',exact:true})).toBeVisible();
 await page.getByRole('button',{name:fr?/^Conseil/:/^Consulting/}).click();
 await expect(page.getByRole('heading',{level:1,name:fr?'Et votre tarif journalier, Camille ?':'And your day rate, Camille?',exact:true})).toBeVisible();
 const go=page.locator('.so-step').getByRole('button',{name:fr?'Continuer':'Continue',exact:true});
 await expect(go).toBeDisabled();
 await page.locator('.so-rate-chips button').nth(3).click();
 await page.getByRole('button',{name:fr?'Augmenter de 25':'Raise by 25',exact:true}).click();
 await expect(page.locator('.so-rate-hint')).toContainText(fr?'sur une journée de 7 heures':'on a 7-hour day');
 await go.click();
 const rate=(await snapshot(page)).dailyRate;
 expect(rate?.amount).toBe(525);
 await expect(page.getByRole('heading',{level:1,name:fr?'Vos trois premiers outils.':'Your first three tools.',exact:true})).toBeVisible();
 await page.getByRole('button',{name:fr?'J’utilise Notion':'I use Notion',exact:true}).click();
 await page.screenshot({path:`test-results/accounts/empty-start-${lang}-${width}.png`,fullPage:true});
 await page.locator('.ss-stack').getByRole('button',{name:fr?'Continuer':'Continue',exact:true}).click();
 await expect(page.getByRole('heading',{level:1,name:fr?'C’est prêt, Camille.':'All set, Camille.',exact:true})).toBeVisible();
 await page.getByRole('button',{name:fr?'Ouvrir mon espace':'Open my space',exact:true}).click();
 await expect.poll(async()=> (await snapshot(page)).selection.pinnedToolSlugs).toContain('notion');
 expect((await snapshot(page)).trade).toBe('consultant');
 await saved(page,lang);
 const remote=(await control(request,'state')).accounts.find((account:{email:string})=>account.email===`empty-start-${lang}-${width}@example.invalid`);
 expect(remote.stack.state.trade).toBe('consultant');
 expect(remote.stack.state.dailyRate).toEqual(rate);
 await expect(page.getByRole('heading',{name:fr?'Mes outils':'My tools',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:fr?'Mes outils':'My tools',exact:true})).toBeFocused();
 await expect(page.locator('[data-sonner-toast]').filter({hasText:fr?'Bienvenue chez vous, Camille. Profitez-en.':'Welcome home, Camille. Enjoy.'})).toBeVisible();
});
test('OAuth opens the destination with a quiet arrival while reading the stack',async({page,request})=>{
 await page.route('**/api/stack-account',async route=>{if(route.request().method()==='GET')await new Promise(resolve=>setTimeout(resolve,1800));await route.continue();});
 await page.goto('/en/sign-in');await dismissConsent(page);await page.getByRole('button',{name:'Continue with Google',exact:true}).click();
 await expect(page).toHaveURL(/\/en\/ma-stack$/);
 await expect(page.locator('.ms-arrival [role=status]')).toContainText('Finding your tools…');
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
 await expect(page.locator('.mf-budget-onboarding')).toContainText("Let's talk budget.");
 await expect(page.locator('.mf-price')).not.toContainText('$0');
 await expect(page.locator('.mf-balance')).toHaveCount(0);
 await expect(page.locator('.mf-fit')).toHaveCount(0);
 await expect(page.locator('.mf-now')).toContainText('Notion');
 await page.getByRole('button',{name:'Choose my first plan',exact:true}).click();
 await expect(page.locator('.mf-now')).toHaveAttribute('data-open','');
 await page.screenshot({path:'test-results/accounts/first-plan-budget.png',fullPage:true});
});

test('undoing the first free plan restores the unanswered question after reload', async ({page,request}) => {
 await page.emulateMedia({reducedMotion:'reduce'});
 await control(request,'seed',{email:'undo-plan@example.invalid',state:state(['notion'])});
 await page.goto('/en/ma-stack');await login(page,'en','undo-plan@example.invalid');await saved(page,'en');
 await expect(page.locator('.mf-budget-onboarding')).toContainText("Let's talk budget.");
 await expect(page.locator('.mf-plan')).toHaveCount(3);
 await page.locator('.mf-plan').filter({hasText:'Free plan'}).first().click();
 await expect(page.locator('.mf-now')).toHaveCount(0);
 await page.getByRole('button',{name:'Undo',exact:true}).click();
 await expect(page.locator('.mf-now')).toContainText('Notion');
 await expect(page.locator('.mf-budget-onboarding')).toContainText("Let's talk budget.");
 await saved(page,'en');await page.reload();await saved(page,'en');
 await expect(page.locator('.mf-budget-onboarding')).toContainText("Let's talk budget.");
});

for(const width of [390,1440]) test(`personal welcome recognises the signed-in owner ${width}`,async({page,request})=>{
 await page.setViewportSize({width,height:1000});
 await control(request,'seed',{email:'welcome@example.invalid',displayName:'Michael',state:state(['notion'])});
 await page.goto('/fr/ma-stack');await login(page,'fr','welcome@example.invalid','fixture-password','Michael');
 await expect(page.locator('.ms-personal-greeting')).toContainText(/(Bonjour|Bonsoir), Michael/);
 await expect(page.locator('.ms-personal-message')).toContainText('Promis, aucune ne mord');
 await expect(page.getByRole('heading',{name:'Mes outils',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 const greeting=await page.locator('.ms-personal-greeting').boundingBox();const title=await page.getByRole('heading',{name:'Mes outils',exact:true}).boundingBox();expect(title!.y).toBeGreaterThan(greeting!.y);
 await page.screenshot({path:`test-results/accounts/personal-welcome-${width}.png`,fullPage:true,animations:'disabled'});
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
 if(width>760){await expect.poll(async()=>{const price=await page.locator('.mf-price').boundingBox();const next=await page.locator('.mf-starter-next').boundingBox();return Math.abs(price!.y-next!.y);}).toBeLessThan(3);}
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


test('healthy autosave stays inline while a write waits, but a real failure offers retry', async ({ page }) => {
 await draft(page, state(['notion'])); await page.goto('/en/ma-stack');
 await login(page, 'en', 'save-progress@example.invalid'); await saved(page);
 let release!: () => void;
 const pending = new Promise<void>(resolve => { release = resolve; });
 await page.route('**/api/stack-account', async route => {
   if (route.request().method() === 'PUT') await pending;
   await route.continue();
 });
 await change(page, state(['notion', 'figma']));
 try {
   await expect(page.locator('.ms-save-indicator')).toHaveText('Saving…');
   await expect(page.locator('.ms-account')).toHaveCount(0);
   await expect(page.getByRole('button', { name: 'Retry saving', exact: true })).toHaveCount(0);
   await page.screenshot({path:'test-results/accounts/healthy-autosave.png'});
 } finally { release(); }
 await saved(page);
 await page.unroute('**/api/stack-account');
 await page.route('**/api/stack-account', route => route.abort());
 await change(page, state(['figma']));
 await expect(page.getByRole('button', { name: 'Retry saving', exact: true })).toBeVisible();
});

for (const lang of ['fr', 'en'] as const) test(`${lang}: default OAuth opens the stack while its initial data is pending`, async ({page,request}) => {
 await page.setViewportSize({width:lang==='fr'?390:1440,height:900});
 await control(request,'seed',{email:'google@example.invalid',state:state(['notion'])});
 await control(request,'fault',{path:'/api/stack-account',method:'GET',delayMs:6000});
 await page.goto(lang==='fr'?'/fr/connexion':'/en/sign-in');await dismissConsent(page);
 await page.getByRole('button',{name:lang==='fr'?'Continuer avec Google':'Continue with Google',exact:true}).click();
 await expect(page).toHaveURL(`/${lang}/ma-stack`,{timeout:2500});
 await expect(page.getByRole('heading',{name:lang==='fr'?'Ma stack':'My stack',exact:true})).toBeVisible();
 await expect(page.locator('.ms-arrival')).toHaveAttribute('aria-busy','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 const pendingLog=(await control(request,'state')).requests;
 expect(pendingLog.some((r:{path:string;method:string})=>r.path==='/api/account-profile'&&r.method==='GET')).toBe(true);
 await expect(page.locator('.so, .ms-tool, .ms-welcome')).toHaveCount(0);
 await expect(page.locator('.ms-arrival')).toBeHidden({timeout:10000});
 await expect(page.locator('.ms-tool')).toHaveCount(1);
 const log=(await control(request,'state')).requests;
 expect(log.filter((r:{path:string;method:string})=>r.path==='/api/stack-account'&&r.method==='GET')).toHaveLength(1);
});


test('password sign-in opens the stack before synchronization and errors keep retry actionable', async ({page,request}) => {
 await control(request,'seed',{email:'arrival@example.invalid'});
 await control(request,'fault',{path:'/api/stack-account',method:'GET',delayMs:5000,status:503});
 await page.goto('/en/ma-stack');await login(page,'en','arrival@example.invalid');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.locator('.ms-arrival')).toHaveAttribute('aria-busy','true');
 await expect(page.locator('.so, .ms-welcome')).toHaveCount(0);
 await expect(page.locator('.ms-arrival')).toHaveAttribute('aria-busy','false',{timeout:10000});
 await expect(page.getByRole('button',{name:'Retry saving',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Retry saving',exact:true}).click();
 await expect(page.locator('#ss-title')).toBeVisible();
});

test('a slow stack route module retains the same arrival presentation', async ({page,request}) => {
 await control(request,'seed',{email:'google@example.invalid',state:state(['notion'])});
 let moduleHeld=false;let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/src/pages/CartPage.tsx*',async route=>{moduleHeld=true;await held;await route.continue();});
 try {
  await page.goto('/en/sign-in',{waitUntil:'domcontentloaded'});await dismissConsent(page);
  await page.getByRole('button',{name:'Continue with Google',exact:true}).click({noWaitAfter:true});
  await expect(page).toHaveURL('/en/ma-stack',{timeout:4000});
  expect(moduleHeld).toBe(true);
  await expect(page.locator('.ms-arrival')).toBeVisible();
  await expect(page.getByRole('heading',{name:'My stack',exact:true})).toBeVisible();
 } finally { release(); }
 await expect(page.locator('.ms-tool')).toHaveCount(1);
});

for (const width of [390,1440]) test(`switching stack language ${width} keeps the document, account and saved state`, async ({page,request}) => {
 await page.setViewportSize({width,height:1000});
 await control(request,'seed',{email:'language@example.invalid',state:state(['notion'])});
 await page.goto('/en/ma-stack');await login(page,'en','language@example.invalid');await saved(page);
 await page.evaluate(()=>{(window as unknown as {languageMarker:string}).languageMarker='same-document';});
 const before=(await control(request,'state')).requests.filter((r:{path:string})=>r.path==='/api/stack-account'||r.path==='/api/account-profile').length;
 if(width===390){
  await page.getByRole('button',{name:'Open menu',exact:true}).click();
  await page.locator('.asv2-mm-panel').getByRole('link',{name:'Français',exact:true}).click();
 }else await page.getByRole('link',{name:'Site in English. Switch to French',exact:true}).click();
 await expect(page).toHaveURL('/fr/ma-stack');
 expect(await page.evaluate(()=>(window as unknown as {languageMarker?:string}).languageMarker)).toBe('same-document');
 await expect(page.locator('.ms-tool')).toHaveCount(1);await saved(page,'fr');
 expect((await control(request,'state')).requests.filter((r:{path:string})=>r.path==='/api/stack-account'||r.path==='/api/account-profile').length).toBe(before);
});

for (const lang of ['fr','en'] as const) for(const width of [390,1440]) test(`bento completion ${lang} ${width}: review choices without unsupported advice`,async({page,request})=>{
 const fr=lang==='fr';await page.setViewportSize({width,height:1000});
 const stack=state(['motion-array','grammarly']);stack.billing={paid:['motion-array','grammarly'],reviewed:['motion-array','grammarly'],choices:{'motion-array':{source:'custom',amount:29,currency:'EUR',period:'monthly'},grammarly:{source:'custom',amount:12,currency:'EUR',period:'monthly'}}};
 await control(request,'seed',{email:'bento-review@example.invalid',state:stack});
 await page.goto(`/${lang}/ma-stack`);await login(page,lang,'bento-review@example.invalid');await saved(page,lang);
 const card=page.locator('.mu-card');
 await expect(card.getByRole('heading',{name:fr?'Vos usages':'Your use',exact:true})).toBeVisible();
 await card.getByRole('radio',{name:fr?'Peu — Usage faible':'Rarely — Low use',exact:true}).click();
 await expect(card.getByRole('heading',{name:'Motion Array',exact:true})).toBeVisible();
 await card.getByRole('button',{name:fr?'Suivant':'Next',exact:true}).click();
 await card.getByRole('radio',{name:fr?'À fond — Usage intensif':'A lot — Intensive use',exact:true}).click();
 await card.getByRole('button',{name:fr?'Terminer':'Finish',exact:true}).click();
 await expect(card.getByRole('heading',{name:fr?'Casting au complet.':"That's the whole cast.",exact:true})).toBeVisible();
 await expect(card).not.toContainText(fr?/bonne taille|marathonien|Puissance/:/right size|marathon runner|Power/);
 await card.scrollIntoViewIfNeeded();await page.screenshot({path:`/tmp/tooltrim-bento-complete-${lang}-${width}.png`,fullPage:false});
 await card.getByRole('button',{name:fr?'Revoir mes usages':'Review my use',exact:true}).click();
 const row=card.getByRole('group',{name:fr?'Usage de Motion Array':'Use of Motion Array',exact:true});
 await expect(row.getByRole('radio',{name:fr?'Peu — Usage faible':'Rarely — Low use',exact:true})).toHaveAttribute('aria-checked','true');
 await row.getByRole('radio',{name:fr?'Souvent — Usage soutenu':'Often — Frequent use',exact:true}).click();
 await expect.poll(async()=>(await snapshot(page)).usage?.['motion-array']).toBe(4);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 const heights=await card.locator('button').evaluateAll(buttons=>buttons.map(button=>button.getBoundingClientRect().height));expect(heights.every(height=>height>=44)).toBe(true);
 await card.getByRole('button',{name:fr?'Résumé':'Summary',exact:true}).click();
 await card.getByRole('button',{name:fr?'Voir mes outils':'View my tools',exact:true}).click();await expect(page.locator('#ms-all-title')).toBeFocused();
});

test('reviewing a kept pair preserves its answer until a replacement is confirmed',async({page,request})=>{
 const stack=state(['notion','trello']);stack.billing={paid:[],reviewed:['notion','trello'],choices:{}};
 stack.decisions={'notion|trello':{kind:'keep-both',kept:'notion',saving:0,at:'2026-10-19T12:00:00.000Z'}};
 await control(request,'seed',{email:'pair-review@example.invalid',state:stack});await page.goto('/en/ma-stack');await login(page,'en','pair-review@example.invalid');await saved(page);
 const before=(await snapshot(page)).decisions;
 await page.getByRole('button',{name:'Review my choices',exact:true}).click();
 await page.locator('.mu-history').getByRole('button',{name:/^(Review again|Review this choice)$/}).click();
 expect((await snapshot(page)).decisions).toEqual(before);
 await expect(page.locator('.mf-now')).toBeVisible();
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:900});
  await expect(page.locator('.mf-choice-group button')).toHaveCount(3);
  await expect(page.locator('.mf-now').getByRole('button',{name:'Review this choice',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Cancel review',exact:true})).toBeVisible();
  expect((await page.getByRole('button',{name:'Cancel review',exact:true}).boundingBox())!.height).toBeGreaterThanOrEqual(43.99); // Chromium subpixel rounding of the 44px target.
  expect(await page.locator('.mf-now').evaluate(el=>{const box=el.getBoundingClientRect();return Array.from(el.querySelectorAll('.mf-choice-group button')).every(b=>b.getBoundingClientRect().bottom<=box.bottom+1);})).toBe(true);
  await expect(page.locator('.mf-choice-group').getByRole('button',{name:'Cancel review',exact:true})).toHaveCount(0);
  if(width===390) await expect(page.locator('.mf-now .mf-expand')).toHaveAttribute('aria-expanded','true');
  for(const face of await page.locator('.mf-face').all()) {
  await face.hover();
  await expect.poll(async()=>face.evaluate(el=>{
   const logo=el.querySelector('.mf-face-logo')!.getBoundingClientRect();
   const image=el.querySelector('.mf-face-logo > :first-child')!.getBoundingClientRect();
   const name=el.querySelector('.mf-face-name')!.getBoundingClientRect();
   return image.width<=logo.width+1 && (image.right<=name.left || image.bottom<=name.top);
  })).toBe(true);
  }
 }
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:'Cancel review',exact:true}).click();
 await expect(page.locator('.mu-history').getByRole('button',{name:'Review this choice',exact:true})).toBeFocused();
 expect((await snapshot(page)).decisions).toEqual(before);
 await page.locator('.mu-history').getByRole('button',{name:'Review this choice',exact:true}).click();
 await page.getByRole('button',{name:'Keep Notion, remove Trello',exact:true}).click();
 await expect.poll(async()=>(await snapshot(page)).decisions['notion|trello']?.kind).toBe('keep-one');
 await expect(page.locator('#ms-all-title')).toBeFocused();
});


test('reviewing a saved pair takes priority over another pending question and never duplicates it',async({page,request})=>{
 const stack=state(['notion','trello','motion-array','grammarly']);
 stack.billing={paid:['motion-array'],reviewed:['notion','trello','motion-array'],choices:{'motion-array':{source:'custom',amount:29,currency:'EUR',period:'monthly'}}};
 stack.usage={'motion-array':4};stack.decisions={'notion|trello':{kind:'keep-both',kept:'notion',saving:0,at:'2026-10-19T12:00:00.000Z'}};
 await control(request,'seed',{email:'pair-pending@example.invalid',state:stack});await page.goto('/en/ma-stack');await login(page,'en','pair-pending@example.invalid');await saved(page);
 await page.getByRole('button',{name:'Review my use',exact:true}).click();
 await page.getByRole('button',{name:'Summary',exact:true}).click();
 await page.getByRole('button',{name:'History',exact:true}).click();
 await expect.poll(async()=>{const card=await page.locator('.mu-card').boundingBox();const board=await page.locator('.ms-board').boundingBox();return !!card&&!!board&&card.y+card.height<=board.y;}).toBe(true);
 await page.locator('.mu-history').getByRole('button',{name:'Review this choice',exact:true}).click();
 await expect(page.locator('.mf-now')).toHaveAttribute('data-kind','pair');
 await expect(page.locator('.mf-now')).toContainText('Your current choice is to keep both.');
 expect((await snapshot(page)).decisions['notion|trello'].kind).toBe('keep-both');
 const countBefore=(await page.locator('.mf-step').getAttribute('aria-label'))?.match(/\d+$/)?.[0];expect(countBefore).toBeTruthy();
 await change(page,{...(await snapshot(page)),decisions:{}});
 await expect(page.getByRole('button',{name:'Cancel review',exact:true})).toHaveCount(0);
 await expect(page.locator('.mf-step')).toHaveAttribute('aria-label',new RegExp(`of ${countBefore}$`));
 expect((await snapshot(page)).decisions).toEqual({});
});


test('removing a tool closes its saved-pair review without deleting the historic decision',async({page,request})=>{
 const stack=state(['notion','trello']);stack.billing={paid:[],reviewed:['notion','trello'],choices:{}};
 stack.decisions={'notion|trello':{kind:'keep-both',kept:'notion',saving:0,at:'2026-10-19T12:00:00.000Z'}};
 await control(request,'seed',{email:'pair-removal@example.invalid',state:stack});await page.goto('/en/ma-stack');await login(page,'en','pair-removal@example.invalid');await saved(page);
 await page.getByRole('button',{name:'Review my choices',exact:true}).click();
 await page.locator('.mu-history').getByRole('button',{name:'Review this choice',exact:true}).click();
 await expect(page.getByRole('button',{name:'Cancel review',exact:true})).toBeVisible();
 const current=await snapshot(page);
 await change(page,{...current,selection:{...current.selection,pinnedToolSlugs:['notion'],toolEntries:current.selection.toolEntries.filter(entry=>entry.toolSlug==='notion')}});
 await expect(page.getByRole('button',{name:'Cancel review',exact:true})).toHaveCount(0);
 await expect(page.locator('.mf-now[data-kind="pair"]')).toHaveCount(0);
 expect((await snapshot(page)).decisions['notion|trello'].kind).toBe('keep-both');
});

for(const lang of ['fr','en'] as const) test(`friendly logout ${lang}: real pending feedback then home`,async({page,request})=>{
 const fr=lang==='fr';await page.setViewportSize({width:fr?390:1440,height:900});
 await page.goto(`/${lang}/ma-stack`);await login(page,lang,`farewell-${lang}@example.invalid`);await saved(page,lang);
 await control(request,'fault',{path:'/auth/v1/logout',method:'POST',delayMs:2200});
 await page.locator('.ac-header-trigger').click();await page.getByRole('button',{name:fr?'Me déconnecter':'Sign out',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:fr?'Me déconnecter':'Sign out',exact:true}).click();
 await expect(dialog.getByRole('heading',{name:fr?'On ferme la porte…':'Closing the door…',exact:true})).toBeVisible();
 await expect(dialog.getByRole('status')).toHaveText(fr?'Déconnexion en cours…':'Signing you out…');
 await expect(dialog.locator('.ac-farewell-mark > span')).toHaveCSS('border-radius','50%');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:test.info().outputPath(`logout-${lang}.png`)});
 await expect(page).toHaveURL(`/${lang}`);await expect(dialog).toHaveCount(0);
 await expect(page.locator('.asv2-topbar').getByRole('button',{name:fr?'Se connecter':'Sign in',exact:true})).toBeVisible();
});

for(const lang of ['fr','en'] as const) test(`all-free stack ${lang}: compact budget and honest completion`,async({page,request})=>{
 const slugs=['supabase','typescript','make'];const stack=state(slugs);stack.billing={paid:[],reviewed:slugs,choices:{typescript:{source:'custom',amount:0,currency:'EUR',period:'monthly'}}};
 await control(request,'seed',{email:`free-only-${lang}@example.invalid`,state:stack});
 await page.setViewportSize({width:1440,height:900});await page.goto(`/${lang}/ma-stack`);await login(page,lang,`free-only-${lang}@example.invalid`);await saved(page,lang);
 await expect(page.locator('.mu-card')).toBeVisible();
 await expect(page.locator('.mf-grid')).toHaveCSS('grid-template-areas','"price fit"');
 await expect.poll(async()=>{const price=await page.locator('.mf-price').boundingBox();const review=await page.locator('.mu-card').boundingBox();return Math.abs(price!.y-review!.y);}).toBeLessThan(2);
 await expect.poll(async()=>Math.abs((await page.locator('.mu-card').boundingBox())!.height-290)).toBeLessThan(1);
 await expect(page.locator('.mu-card')).toContainText(lang==='fr'?'Votre stack, sans abonnement payant.':'Your stack has no paid plans.');
 await expect(page.locator('.mf-balance')).toHaveCount(0);
 await page.screenshot({path:test.info().outputPath(`free-only-${lang}-desktop.png`)});
 await page.setViewportSize({width:820,height:900});
 await expect.poll(async()=>Math.abs((await page.locator('.mu-card').boundingBox())!.height-295)).toBeLessThan(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.setViewportSize({width:390,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('.mu-card')).toBeVisible();
});

for (const lang of ['fr','en'] as const) for (const [width,height,expected] of [[320,900,330],[390,900,330],[820,900,295],[1440,900,290],[1440,800,255.2],[1440,700,230]]) {
 test(`usage envelope ${lang} ${width}x${height}: answer, next, correction, summary and history stay still`,async({page,request})=>{
  const fr=lang==='fr';await page.setViewportSize({width,height});
  const value=state(['motion-array','grammarly','notion','trello']);
  value.billing={paid:['motion-array','grammarly'],reviewed:['motion-array','grammarly','notion','trello'],choices:{'motion-array':{source:'custom',amount:25,currency:'EUR',period:'monthly'},grammarly:{source:'custom',amount:12,currency:'EUR',period:'monthly'}}};
  value.decisions={'notion|trello':{kind:'keep-both',kept:'notion',saving:0,at:'2026-10-25T00:00:00.000Z'}};
  await control(request,'seed',{email:'usage-height@example.invalid',state:value});await page.goto(`/${lang}/ma-stack`);await login(page,lang,'usage-height@example.invalid');await saved(page,lang);
  const card=page.locator('.mu-card');await expect(card).toBeVisible();await card.scrollIntoViewIfNeeded();
  await page.addStyleTag({content:'html, .mu-question { scrollbar-gutter: stable; } @media(max-width:340px) { .mu-question { max-width:236px !important; } .mu-gauge button small { font-family: Arial, sans-serif; } }'});
  const anchors=()=>card.evaluate(el=>{const box=el.getBoundingClientRect(),footer=el.querySelector('.mu-footer')!.getBoundingClientRect(),primary=el.querySelector('.mu-next')!.getBoundingClientRect();return {top:footer.top-box.top,right:primary.right-box.left};});
  const initialAnchors=await anchors();
  const stable=async()=>{await expect.poll(async()=>Math.abs((await card.boundingBox())!.height-expected)).toBeLessThan(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);const current=await anchors();expect(Math.abs(current.top-initialAnchors.top)).toBeLessThan(1);expect(Math.abs(current.right-initialAnchors.right)).toBeLessThan(1);};
  await expect(card.getByLabel(fr?'Outil 1 sur 2':'Tool 1 of 2')).toContainText('1 / 2');
  await expect(card.getByRole('button',{name:fr?'Outil précédent':'Previous tool',exact:true})).toBeDisabled();
  expect(await card.locator('.mu-gauge').evaluate(el=>el.getBoundingClientRect().width)).toBeLessThanOrEqual(640);
  const levels=await card.getByRole('radio').evaluateAll(radios=>radios.map(r=>{const bar=r.querySelector('.mu-meter-bar')!.getBoundingClientRect(),target=r.getBoundingClientRect();return {bottom:bar.bottom,height:bar.height,targetWidth:target.width,targetHeight:target.height};}));
  for (const [i,level] of levels.entries()) {
   expect(Math.abs(level.bottom-levels[0].bottom),JSON.stringify(levels)).toBeLessThan(1);
   if(i>0) expect(level.height).toBeGreaterThan(levels[i-1].height);
   expect(level.targetWidth).toBeGreaterThanOrEqual(44);
   expect(level.targetHeight).toBeGreaterThanOrEqual(44);
  }
  expect(await card.locator('.mu-tool-label').evaluate(el=>{const title=el.querySelector('h3')!.getBoundingClientRect(),price=el.querySelector('p')!.getBoundingClientRect();return Math.abs(title.left-price.left)<1&&price.top>=title.bottom;})).toBe(true);
  await page.mouse.move(0,0);await card.evaluate(el=>el.scrollIntoView({block:'center'}));
  expect(await card.getByRole('radio').locator('small').evaluateAll(labels=>labels.every(label=>{const css=getComputedStyle(label);return label.scrollWidth<=label.clientWidth&&label.getBoundingClientRect().height<=parseFloat(css.lineHeight)+parseFloat(css.paddingTop)+parseFloat(css.paddingBottom)+1;}))).toBe(true);
  expect(await card.locator('.mu-footer button:not(:disabled)').evaluateAll(buttons=>buttons.every(button=>{const r=button.getBoundingClientRect();return button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}))).toBe(true);
  await card.screenshot({path:test.info().outputPath('question.png')});
  await card.getByRole('button',{name:fr?'Faire une pause':'Take a break',exact:true}).click();await stable();
  await card.screenshot({path:test.info().outputPath('partial-summary.png')});
  await card.getByRole('button',{name:fr?'Renseigner l’usage de Grammarly':'Record use of Grammarly',exact:true}).click();await stable();
  await expect(card.getByRole('heading',{name:'Grammarly',exact:true})).toBeFocused();
  await card.getByRole('button',{name:fr?'Résumé':'Summary',exact:true}).click();await stable();
  await card.getByRole('button',{name:fr?'Reprendre':'Resume',exact:true}).click();await stable();
  await stable();
  expect(await card.getByRole('radio').evaluateAll(radios=>radios.every(r=>r.getBoundingClientRect().height>=56))).toBe(true);
  const rocket=card.getByRole('radio',{name:fr?'À fond — Usage intensif':'A lot — Intensive use',exact:true});
  await rocket.hover();
  await expect(card.locator('.mu-reaction')).toHaveCSS('animation-name','none');
  await expect(rocket.locator('.mu-meter-bar')).toHaveCSS('transition-duration','0s');
  const low=card.getByRole('radio',{name:fr?'Peu — Usage faible':'Rarely — Low use',exact:true});await low.hover();await stable();
  await low.press('Space');await expect(card.getByRole('heading',{name:'Motion Array',exact:true})).toBeVisible();await stable();
  await rocket.hover();await expect(low).toHaveAttribute('aria-checked','true');await expect(rocket).toHaveAttribute('aria-checked','false');
  const next=card.getByRole('button',{name:fr?'Suivant':'Next',exact:true});await next.focus();
  const before=await page.evaluate(()=>({window:scrollY,content:document.querySelector('.asv2-content')?.scrollTop}));
  await page.keyboard.press('Enter');await expect(card.getByRole('heading',{name:'Grammarly',exact:true})).toBeFocused();
  expect(await page.evaluate(()=>({window:scrollY,content:document.querySelector('.asv2-content')?.scrollTop}))).toEqual(before);await stable();
  await card.getByRole('radio',{name:fr?'Régulier — Usage régulier':'Regular — Regular use',exact:true}).focus();await page.keyboard.press('End');
  await expect(card.getByRole('radio',{name:fr?'À fond — Usage intensif':'A lot — Intensive use',exact:true})).toHaveAttribute('aria-checked','true');await stable();
  await page.mouse.move(0,0);await card.screenshot({path:test.info().outputPath('answered.png')});
  await card.getByRole('button',{name:fr?'Terminer':'Finish',exact:true}).click();await stable();
  await card.screenshot({path:test.info().outputPath('complete-summary.png')});
  await card.getByRole('button',{name:fr?'Revoir mes usages':'Review my use',exact:true}).click();await stable();
  await card.getByRole('radio',{name:fr?'Souvent — Usage soutenu':'Often — Frequent use',exact:true}).click();await expect.poll(async()=>(await snapshot(page)).usage?.['motion-array']).toBe(4);await stable();
  await card.getByRole('button',{name:fr?'Résumé':'Summary',exact:true}).click();await card.getByRole('button',{name:fr?'Historique':'History',exact:true}).click();await stable();
  await expect(card.getByRole('region',{name:fr?'Historique des choix':'Choice history'})).toBeVisible();
  await card.screenshot({path:test.info().outputPath('history.png')});
  await card.getByRole('button',{name:fr?'Résumé':'Summary',exact:true}).click();await stable();
  await saved(page,lang);await page.reload();await saved(page,lang);await stable();
  expect((await snapshot(page)).usage).toMatchObject({'motion-array':4,grammarly:5});
  await page.screenshot({path:test.info().outputPath(`usage-${lang}-${width}-${height}.png`)});
 });
}

test('many usage rows and a long choice history stay inside the compact scene',async({page,request})=>{
 await page.setViewportSize({width:320,height:900});
 const slugs=['microsoft-dynamics-business-central','motion-array','grammarly','notion','trello'];
 const value=state(slugs);const paid=slugs.slice(0,3);
 value.billing={paid,reviewed:slugs,choices:Object.fromEntries(paid.map((slug,index)=>[slug,{source:'custom',amount:index===0?99999:99-index,currency:'EUR',period:'monthly'}]))};
 for(let a=0;a<slugs.length;a++)for(let b=a+1;b<slugs.length;b++){const pair=[slugs[a],slugs[b]].sort().join('|');value.decisions[pair]={kind:'keep-both',kept:slugs[a],saving:0,at:'2026-10-25T00:00:00.000Z'};}
 await control(request,'seed',{email:'long-usage@example.invalid',state:value});await page.goto('/en/ma-stack');await login(page,'en','long-usage@example.invalid');await saved(page);
 const card=page.locator('.mu-card');await expect(card.getByRole('heading',{name:/Business Central/})).toBeVisible();
 for(let index=0;index<3;index++){
  const geometry=await card.evaluate(el=>{const tool=el.querySelector('.mu-tool')!.getBoundingClientRect(),gauge=el.querySelector('.mu-gauge')!.getBoundingClientRect(),caption=el.querySelector('.mu-caption')!.getBoundingClientRect(),footer=el.querySelector('.mu-footer')!.getBoundingClientRect();return {height:el.getBoundingClientRect().height,noOverlap:tool.bottom<=gauge.top+1&&caption.bottom<=footer.top+1};});
  await card.screenshot({path:test.info().outputPath(`long-tool-${index}.png`)});
  expect(geometry.height).toBe(330);expect(geometry.noOverlap).toBe(true);
  await card.getByRole('radio',{name:'Regular — Regular use',exact:true}).click();await card.getByRole('button',{name:index<2?'Next':'Finish',exact:true}).click();
 }
 await card.getByRole('button',{name:'History',exact:true}).click();const history=card.getByRole('region',{name:'Choice history'});
 await expect(history.getByRole('button',{name:'Review this choice',exact:true})).toHaveCount(10);
 expect(await history.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
 await history.getByRole('button',{name:'Review this choice',exact:true}).last().scrollIntoViewIfNeeded();
 expect(await card.evaluate(el=>el.getBoundingClientRect().height)).toBe(330);
 await page.emulateMedia({reducedMotion:'no-preference'});await card.getByRole('button',{name:'Summary',exact:true}).click();
 await card.getByRole('button',{name:'Review my use',exact:true}).click();await card.getByRole('radio',{name:'A lot — Intensive use',exact:true}).hover();
 expect(await card.evaluate(el=>el.getBoundingClientRect().height)).toBe(330);
});

test('usage answers survive a failed cloud write and retry without lying about saved status', async ({page,request}) => {
 const value=state(['motion-array','grammarly']);
 value.billing={paid:['motion-array','grammarly'],reviewed:['motion-array','grammarly'],choices:{'motion-array':{source:'custom',amount:25,currency:'EUR',period:'monthly'},grammarly:{source:'custom',amount:12,currency:'EUR',period:'monthly'}}};
 await control(request,'seed',{email:'usage-retry@example.invalid',state:value});
 await page.goto('/en/ma-stack');await login(page,'en','usage-retry@example.invalid');await saved(page);
 await page.route('**/api/stack-account',route=>route.abort());
 const card=page.locator('.mu-card');await card.getByRole('radio',{name:'Often — Frequent use',exact:true}).click();
 await expect(page.getByRole('button',{name:'Retry saving',exact:true})).toBeVisible();
 await expect(card.getByRole('radio',{name:'Often — Frequent use',exact:true})).toHaveAttribute('aria-checked','true');
 expect((await snapshot(page)).usage?.['motion-array']).toBe(4);
 await page.unroute('**/api/stack-account');await page.getByRole('button',{name:'Retry saving',exact:true}).click();await saved(page);
 await page.reload();await saved(page);
 expect((await snapshot(page)).usage?.['motion-array']).toBe(4);
});

test('usage scenes and answers follow the account through A B A reconnection', async ({page,request}) => {
 const value=state(['motion-array','grammarly']);
 value.billing={paid:['motion-array','grammarly'],reviewed:['motion-array','grammarly'],choices:{'motion-array':{source:'custom',amount:25,currency:'EUR',period:'monthly'},grammarly:{source:'custom',amount:12,currency:'EUR',period:'monthly'}}};
 await control(request,'seed',{email:'usage-a@example.invalid',state:value});
 await control(request,'seed',{email:'usage-b@example.invalid',state:{...value,usage:{'motion-array':5,grammarly:2}}});
 await page.goto('/en/ma-stack');await login(page,'en','usage-a@example.invalid');await saved(page);
 await page.locator('.mu-card').getByRole('radio',{name:'Rarely — Low use',exact:true}).click();await saved(page);
 await signOut(page);await page.goto('/en/ma-stack');await login(page,'en','usage-b@example.invalid');await saved(page);
 const card=page.locator('.mu-card');await expect(card.getByRole('heading',{name:"That's the whole cast.",exact:true})).toBeVisible();
 await card.getByRole('button',{name:'Review my use',exact:true}).click();
 await expect(card.getByRole('radio',{name:'A lot — Intensive use',exact:true})).toHaveAttribute('aria-checked','true');
 await signOut(page);await page.goto('/en/ma-stack');await login(page,'en','usage-a@example.invalid');await saved(page);
 await expect(card.getByRole('heading',{name:'Grammarly',exact:true})).toBeVisible();
 expect((await snapshot(page)).usage).toEqual({'motion-array':1});
});

test('usage keeps the original envelope and readable nonoverlapping controls with doubled text', async ({page,request}) => {
 await page.setViewportSize({width:320,height:568});
 const value=state(['motion-array','grammarly']);
 value.billing={paid:['motion-array','grammarly'],reviewed:['motion-array','grammarly'],choices:{'motion-array':{source:'custom',amount:25,currency:'EUR',period:'monthly'},grammarly:{source:'custom',amount:12,currency:'EUR',period:'monthly'}}};
 await control(request,'seed',{email:'usage-text@example.invalid',state:value});
 await page.goto('/fr/ma-stack');await login(page,'fr','usage-text@example.invalid');await saved(page,'fr');
 const card=page.locator('.mu-card');
 await card.evaluate(el=>{for(const text of el.querySelectorAll<HTMLElement>('h2,h3,p,small,.mu-count,.mu-footer button'))text.style.fontSize=`${parseFloat(getComputedStyle(text).fontSize)*2}px`;});
 expect(await card.evaluate(el=>el.getBoundingClientRect().height)).toBe(330);
 expect(await card.getByRole('radio').evaluateAll(radios=>radios.every(r=>{const icon=r.querySelector('.mu-meter-track')!.getBoundingClientRect(),label=r.querySelector('small')!.getBoundingClientRect();return label.top>=icon.bottom&&label.bottom<=r.getBoundingClientRect().bottom+1&&label.width<=r.getBoundingClientRect().width+1;}))).toBe(true);
 expect(await card.evaluate(el=>{const tool=el.querySelector('.mu-tool')!.getBoundingClientRect(),gauge=el.querySelector('.mu-gauge')!.getBoundingClientRect(),caption=el.querySelector('.mu-caption')!.getBoundingClientRect();return tool.bottom<=gauge.top+1&&gauge.bottom<=caption.top+1;})).toBe(true);
 expect(await card.evaluate(el=>{const tool=el.querySelector('.mu-tool')!,gauge=el.querySelector('.mu-gauge')!,caption=el.querySelector('.mu-caption')!;return tool.querySelector('h3')!.getBoundingClientRect().bottom<=tool.getBoundingClientRect().bottom+1&&Array.from(gauge.querySelectorAll('button')).every(b=>b.getBoundingClientRect().bottom<=gauge.getBoundingClientRect().bottom+1)&&caption.scrollHeight<=caption.clientHeight+1;})).toBe(true);
 expect(await card.evaluate(el=>{const scene=el.querySelector('.mu-scene')!.getBoundingClientRect(),footer=el.querySelector('.mu-footer')!.getBoundingClientRect();return scene.bottom<=footer.top+1;})).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:test.info().outputPath('usage-text-double.png')});
});

test('usage conflict keeps the local answer until the person resolves it explicitly', async ({page,request}) => {
 const value=state(['motion-array','grammarly']);
 value.billing={paid:['motion-array','grammarly'],reviewed:['motion-array','grammarly'],choices:{'motion-array':{source:'custom',amount:25,currency:'EUR',period:'monthly'},grammarly:{source:'custom',amount:12,currency:'EUR',period:'monthly'}}};
 await control(request,'seed',{email:'usage-conflict@example.invalid',state:value});
 await page.goto('/en/ma-stack');await login(page,'en','usage-conflict@example.invalid');await saved(page);
 await page.route('**/api/stack-account',route=>route.request().method()==='PUT'?route.abort():route.continue());
 const card=page.locator('.mu-card');await card.getByRole('radio',{name:'Often — Frequent use',exact:true}).click();
 await expect(page.getByRole('button',{name:'Save my current version',exact:true})).toBeVisible();
 await expect(card.getByRole('radio',{name:'Often — Frequent use',exact:true})).toHaveAttribute('aria-checked','true');
 await page.unroute('**/api/stack-account');await page.getByRole('button',{name:'Save my current version',exact:true}).click();await saved(page);
 await page.reload();await saved(page);expect((await snapshot(page)).usage?.['motion-array']).toBe(4);
});

test('usage follows a paid-to-free change without retaining a stale preview or keyboard focus', async ({page,request}) => {
 const value=state(['motion-array','grammarly','notion']);
 value.billing={paid:['motion-array','grammarly','notion'],reviewed:['motion-array','grammarly','notion'],choices:{'motion-array':{source:'custom',amount:25,currency:'EUR',period:'monthly'},grammarly:{source:'custom',amount:12,currency:'EUR',period:'monthly'},notion:{source:'custom',amount:9,currency:'EUR',period:'monthly'}}};
 await control(request,'seed',{email:'usage-free-change@example.invalid',state:value});
 await page.goto('/en/ma-stack');await login(page,'en','usage-free-change@example.invalid');await saved(page);
 const card=page.locator('.mu-card');await card.getByRole('radio',{name:'A lot — Intensive use',exact:true}).focus();
 await expect(card).toContainText('It knows your shortcuts by heart.');
 const next=await snapshot(page);next.billing.paid=['grammarly','notion'];next.billing.choices['motion-array']={source:'custom',amount:0,currency:'EUR',period:'monthly'};
 await change(page,next);
 await expect(card.getByRole('heading',{name:'Grammarly',exact:true})).toBeFocused();
 await expect(card).not.toContainText('It knows your shortcuts by heart.');
 expect((await snapshot(page)).usage).toEqual({});
 await card.getByRole('radio',{name:'Rarely — Low use',exact:true}).press('ArrowDown');
 expect((await snapshot(page)).usage).toEqual({grammarly:2});
});

for(const lang of ['en','fr'] as const) for(const width of [320,1440]) test(`invoice currency ${lang} ${width}: tester stack, mixed invoice, direct editor and reload`,async({page,request})=>{
 const en=lang==='en';await page.setViewportSize({width,height:900});
 const value=state(['cursor','github','vercel']);
 value.billing={paid:['cursor','github'],reviewed:['cursor','github','vercel'],choices:{cursor:{source:'plan',label:'Teams',amount:40,currency:'USD',period:'monthly',perSeat:true,seats:5}}};
 await control(request,'seed',{email:'invoice@example.invalid',state:value});
 await page.addInitScript(()=>localStorage.setItem('tooltrim:currency','USD'));
 await page.goto(`/${lang}/ma-stack`);await login(page,lang,'invoice@example.invalid');await saved(page,lang);
 const card=page.locator('.mf-now');
 const expander=card.locator('.mf-expand[aria-expanded=false]');if(await expander.isVisible())await expander.click();
 // Resolve a pair first only if the catalogue detects one; keep all tools.
 if(await card.getByRole('button',{name:en?'Keep both':'Garder les deux',exact:true}).count())await card.getByRole('button',{name:en?'Keep both':'Garder les deux',exact:true}).click();
 await expect(card.getByRole('textbox')).toBeVisible();
 expect(await card.locator('.mf-now-q h3').evaluate(el=>getComputedStyle(el).paddingRight)).toBe('0px');
 expect((await snapshot(page)).billing.choices.github).toBeUndefined();
 expect(await page.locator('.mf-price .mk-odo').first().getAttribute('aria-label')).toMatch(/200/);
 await expect(card.getByRole('combobox',{name:en?'Invoice currency':'Devise de facture'})).toHaveValue('USD');
 await card.getByRole('textbox').fill(en?'12.50':'12,50');
 await card.getByRole('combobox').selectOption('GBP');
 if(en && width===1440) {
  await page.getByRole('button',{name:'Choose currency, US dollar selected',exact:true}).click();
  await page.getByRole('radio',{name:/EUR/}).click();
  await expect(card.getByRole('combobox')).toHaveValue('GBP');await expect(card.getByRole('textbox')).toHaveValue('12.50');
  await expect(card.locator('.mf-invoice-help')).toContainText('GBP → EUR');
  await page.getByRole('button',{name:/Choose currency, Euro selected/}).click();await page.getByRole('radio',{name:/USD/}).click();
 }
 await expect(card.locator('.mf-invoice-help')).toContainText('GBP → USD');
 await expect(card.locator('.mf-invoice-help')).toContainText('2026-08-27');
 const save=card.getByRole('button',{name:en?'Save':'Enregistrer',exact:true});
 expect(await save.evaluate(el=>{const c=getComputedStyle(el).backgroundColor.match(/\d+/g)!.map(Number);return c[2]>c[0]+50;})).toBe(true);
 expect(await card.evaluate(el=>{const b=el.getBoundingClientRect();return Array.from(el.querySelectorAll('.mf-price-entry input,.mf-price-entry select,.mf-price-entry button')).every(x=>x.getBoundingClientRect().bottom<=b.bottom+1);})).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await card.screenshot({path:`/tmp/tooltrim-invoice-${lang}-${width}.png`});
 await card.getByRole('button',{name:en?'Save':'Enregistrer',exact:true}).click();await saved(page,lang);
 expect((await snapshot(page)).billing.choices.github).toEqual({source:'custom',amount:12.5,currency:'GBP',period:'monthly'});
 expect((await snapshot(page)).billing.choices.cursor?.seats).toBe(5);
 await expect(page.locator('.mf-price')).toContainText('2026-08-27');
 await page.reload();await saved(page,lang);
 expect((await snapshot(page)).billing.choices.github?.currency).toBe('GBP');
 // Restore unknown price to exercise the explicit direct-editor link.
 const next=await snapshot(page);delete next.billing.choices.github;await change(page,next);
 const open=card.locator('.mf-expand[aria-expanded=false]');if(await open.isVisible())await open.click();
 await card.getByRole('button',{name:en?'Currency, users or yearly billing':'Devise, utilisateurs ou facture annuelle',exact:true}).click();
 const sheet=page.getByRole('dialog');const input=sheet.getByLabel(en?'Billed amount':'Montant facturé',{exact:true});
 await expect(input).toBeVisible();await expect(input).toBeFocused();
 await input.fill(en?'120.12':'120,12');
 await sheet.getByRole('group',{name:en?'Invoice currency':'Devise de facture'}).getByRole('button',{name:'EUR',exact:true}).click();
 await sheet.getByRole('button',{name:en?'Yearly':'Annuel',exact:true}).click();
 await sheet.locator('.ms-ce-actions').getByRole('button',{name:en?'Cancel':'Annuler',exact:true}).click();
 await expect(sheet.getByRole('button',{name:en?'Edit my subscription':'Modifier mon abonnement'})).toBeFocused();
 expect((await snapshot(page)).billing.choices.github).toBeUndefined();
 await sheet.getByRole('button',{name:en?'Edit my subscription':'Modifier mon abonnement'}).click();
 await input.fill(en?'120.12':'120,12');
 await sheet.getByRole('group',{name:en?'Invoice currency':'Devise de facture'}).getByRole('button',{name:'EUR',exact:true}).click();
 await sheet.getByRole('button',{name:en?'Yearly':'Annuel',exact:true}).click();
 await input.fill('-1');await expect(sheet.locator('.ms-ce-save')).toBeDisabled();await input.press('Enter');
 expect((await snapshot(page)).billing.choices.github).toBeUndefined();
 await input.fill(en?'120.12':'120,12');await sheet.locator('.ms-ce-save').click();await saved(page,lang);
 expect((await snapshot(page)).billing.choices.github).toEqual({source:'custom',amount:120.12,currency:'EUR',period:'annual'});
 await sheet.getByRole('button',{name:en?'Close':'Fermer',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('invoice zero can become paid again and editor cancellation restores a visible focus target',async({page,request})=>{
 const value=state(['notion','vercel']);value.billing={paid:['notion'],reviewed:['notion','vercel'],choices:{notion:{source:'custom',amount:0,currency:'USD',period:'monthly'}}};
 await control(request,'seed',{email:'zero-invoice@example.invalid',state:value});await page.goto('/en/ma-stack');await login(page,'en','zero-invoice@example.invalid');await saved(page);
 await page.locator('.ms-inv').getByRole('button',{name:/^Notion,/}).click();const sheet=page.getByRole('dialog');
 const paid=sheet.getByRole('switch',{name:'Paid subscription for Notion',exact:true});await expect(paid).toHaveAttribute('aria-checked','false');await paid.click();
 await expect(paid).toHaveAttribute('aria-checked','true');expect((await snapshot(page)).billing.choices.notion).toBeUndefined();
 const adjust=sheet.getByRole('button',{name:'Edit my subscription'});await adjust.click();
 await sheet.getByLabel('Or the billed amount',{exact:true}).fill('0');await sheet.locator('.ms-ce-save').click();
 await expect(adjust).toBeFocused();await expect(paid).toHaveAttribute('aria-checked','false');
 await adjust.click();await sheet.getByLabel('Or the billed amount',{exact:true}).fill('99');await sheet.getByRole('button',{name:'Cancel',exact:true}).click();
 await expect(adjust).toBeFocused();expect((await snapshot(page)).billing.choices.notion?.amount).toBe(0);
});

test('invoice draft cannot cross a personal-stack scope change',async({page,request})=>{
 const first=state(['github','vercel']);first.billing={paid:['github'],reviewed:['github','vercel'],choices:{github:{source:'custom',amount:15,currency:'USD',period:'monthly'}}};
 await control(request,'seed',{email:'scope-invoice@example.invalid',state:first});await page.goto('/en/ma-stack');await login(page,'en','scope-invoice@example.invalid');await saved(page);await page.locator('.ms-inv').getByRole('button',{name:/^GitHub,/}).click();
 const sheet=page.getByRole('dialog');await sheet.getByRole('button',{name:'Edit my subscription'}).click();
 await sheet.getByLabel('Billed amount',{exact:true}).fill('111');
 const second=state(['github','vercel']);second.billing={paid:['github'],reviewed:['github','vercel'],choices:{github:{source:'custom',amount:29,currency:'GBP',period:'monthly'}}};
 await page.evaluate(async value=>{const path='/src/lib/personalStackStore.ts';const store=await import(/* @vite-ignore */ path);store.setPersonalStackScope('invoice-scope-b');store.replacePersonalStack(value);},second);
 await expect(sheet.getByRole('button',{name:'Edit my subscription'})).toHaveAttribute('aria-expanded','false');
 await sheet.getByRole('button',{name:'Edit my subscription'}).click();await expect(sheet.getByLabel('Billed amount',{exact:true})).toHaveValue('29');
 expect((await snapshot(page)).billing.choices.github).toEqual(second.billing.choices.github);
});

test('invoice native cents remain visible in the recorded budget',async({page,request})=>{
 const value=state(['cursor','github','vercel']);value.billing={paid:['cursor','github'],reviewed:['cursor','github','vercel'],choices:{cursor:{source:'plan',label:'Teams',amount:40,currency:'USD',period:'monthly',perSeat:true,seats:5},github:{source:'custom',amount:12.5,currency:'USD',period:'monthly'}}};
 await control(request,'seed',{email:'cents-invoice@example.invalid',state:value});await page.goto('/en/ma-stack');await login(page,'en','cents-invoice@example.invalid');await saved(page);
 await expect(page.locator('.mf-price .mk-odo').first()).toHaveAttribute('aria-label','$212.50');
});
