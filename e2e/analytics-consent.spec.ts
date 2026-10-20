import { test, expect, type Page } from '@playwright/test';

async function commands(page: Page) {
  return page.evaluate(() => (window.dataLayer ?? []).map(c => Array.from(c as ArrayLike<unknown>)));
}
async function views(page: Page) { return (await commands(page)).filter(c => c[0] === 'event' && c[1] === 'page_view'); }
const consentCookie = async (page: Page) => (await page.context().cookies()).find(c => c.name === 'tooltrim_consent');

test.beforeEach(async ({ page }) => {
  // External services are isolated: no test visit reaches a live analytics account.
  await page.route('**/_vercel/insights/**', route => route.fulfill({status:200, body:''}));
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({
    status:200, contentType:'application/javascript', body:'',
  }));
  await page.route('https://*.google-analytics.com/**', route => route.abort());
});

test('late acceptance, SPA navigation, reload, withdrawal and refusal', async ({ page }) => {
  await page.goto('/fr/privacy-policy');
  const accept = page.getByRole('button', {name:'Accepter', exact:true});
  await accept.waitFor();
  await page.waitForTimeout(500); // Reproduce acceptance after the initial route effect.
  expect(await views(page)).toHaveLength(1);
  await expect(page.locator('script[data-tooltrim-ga]')).toHaveCount(1);
  await accept.click();
  await expect.poll(async () => (await consentCookie(page))?.value ?? '').toContain('analytics');
  await page.waitForTimeout(400);
  expect(await views(page)).toHaveLength(1);
  await page.context().addCookies([{name:'_ga',value:'withdrawal-test',url:new URL('/fr',page.url()).origin}]);
  await page.getByRole('link', {name:'Mentions légales', exact:true}).click();
  await expect.poll(async () => (await views(page)).length).toBe(2);
  await page.reload();
  await expect.poll(async () => (await views(page)).length).toBe(1);
  await expect(page.getByRole('button', {name:'Accepter', exact:true})).toHaveCount(0);
  await page.getByRole('button', {name:'Préférences cookies', exact:true}).click();
  await page.getByRole('button', {name:'Refuser', exact:true}).click();
  await expect.poll(async () => (await page.context().cookies()).filter(c => c.name.startsWith('_ga')).length).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent).catch(() => undefined)).toBe(false);
  await expect(page.locator('script[data-tooltrim-ga]')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('button', {name:'Accepter', exact:true})).toHaveCount(0);
});

test('a slow tag reports the current route and configures before page_view', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('https://www.googletagmanager.com/**', async route => { await gate; await route.fulfill({status:200,body:''}); });
  // The held async tag can delay load on generated HTML; the DOM is usable.
  await page.goto('/fr/privacy-policy', {waitUntil:'domcontentloaded'});
  await page.getByRole('button', {name:'Accepter', exact:true}).click();
  await page.getByRole('link', {name:'Mentions légales', exact:true}).click();
  await page.waitForTimeout(400);
  expect(await views(page)).toHaveLength(0);
  release();
  await expect.poll(async () => (await views(page)).length).toBe(1);
  expect((await views(page))[0][2]).toMatchObject({page_path:'/fr/legal-notice'});
  const log = await commands(page);
  expect(log.findIndex(c=>c[0]==='config')).toBeLessThan(log.findIndex(c=>c[1]==='page_view'));
});

test('refusal in another tab reloads an already consenting tab', async ({ page, context }) => {
  await page.goto('/fr/privacy-policy');
  await page.getByRole('button', {name:'Accepter', exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent)).toBe(true);
  const documentStarted = await page.evaluate(() => performance.timeOrigin);
  const other = await context.newPage();
  await other.route('https://www.googletagmanager.com/**', route => route.fulfill({status:200,body:''}));
  await other.goto('/fr/privacy-policy');
  await other.getByRole('button', {name:'Préférences cookies', exact:true}).click();
  await other.getByRole('button', {name:'Refuser', exact:true}).click();
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => page.evaluate(() => performance.timeOrigin).catch(() => documentStarted)).not.toBe(documentStarted);
  await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent).catch(() => undefined)).toBe(false);
});

test('a dated legacy choice is kept, an undated one is asked again', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tooltrim-analytics-consent', 'accepted'));
  await page.goto('/fr/privacy-policy');
  await expect(page.getByRole('button', {name:'Accepter', exact:true})).toBeVisible();
  await expect(page.locator('script[data-tooltrim-ga]')).toHaveCount(1);

  const fresh = await page.context().newPage();
  await fresh.route('https://www.googletagmanager.com/**', route => route.fulfill({status:200,body:''}));
  await fresh.context().clearCookies();
  await fresh.addInitScript(() => localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({version:1,choice:'accepted',decidedAt:1,expiresAt:Date.now()+86400000})));
  await fresh.goto('/fr/legal-notice');
  await expect.poll(() => fresh.evaluate(() => window.__tooltrimAnalyticsConsent)).toBe(true);
  await expect(fresh.getByRole('button', {name:'Accepter', exact:true})).toHaveCount(0);
});

test('English mobile banner, equal choices and preferences keyboard dismissal', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/en/privacy-policy');
  const accept = page.getByRole('button', {name:'Accept', exact:true});
  const refuse = page.getByRole('button', {name:'Refuse', exact:true});
  await expect(accept).toBeVisible();
  // The banner slides in: measure once it has settled.
  await expect.poll(async () => { const b = await refuse.boundingBox(); return b!.y + b!.height; }).toBeLessThanOrEqual(844);
  const [a, r] = [await accept.boundingBox(), await refuse.boundingBox()];
  expect(Math.round(a!.height)).toBe(Math.round(r!.height));
  await page.screenshot({path:test.info().outputPath('consent-mobile.png')});
  await refuse.click();
  const prefs = page.getByRole('button', {name:'Cookie preferences', exact:true});
  await prefs.click();
  await expect(page.getByRole('dialog', {name:'Cookie preferences'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', {name:'Cookie preferences'})).toBeHidden();
});

test('outside consent regions GA4 measures without a banner, and refusal still works', async ({ page }) => {
  await page.route('**/api/consent-region', route => route.fulfill({
    status:200, contentType:'application/json', body:JSON.stringify({consentRequired:false}),
  }));
  await page.goto('/en/privacy-policy');
  await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent)).toBe(true);
  await expect.poll(async () => (await views(page)).length).toBe(1);
  expect((await views(page))[0][2]).toMatchObject({page_path:'/en/privacy-policy'});
  await expect(page.getByRole('button', {name:'Accept', exact:true})).toHaveCount(0);
  await page.getByRole('button', {name:'Cookie preferences', exact:true}).click();
  await page.getByRole('button', {name:'Refuse', exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent).catch(() => undefined)).toBe(false);
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent).catch(() => undefined)).toBe(false);
});

test('a failing region lookup keeps the banner', async ({ page }) => {
  await page.route('**/api/consent-region', route => route.fulfill({status:500, body:''}));
  await page.goto('/en/privacy-policy');
  await expect(page.getByRole('button', {name:'Accept', exact:true})).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent)).toBe(false);
});
