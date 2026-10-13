import { test, expect, type Page } from '@playwright/test';

async function commands(page: Page) {
  return page.evaluate(() => (window.dataLayer ?? []).map(c => Array.from(c as ArrayLike<unknown>)));
}
async function views(page: Page) { return (await commands(page)).filter(c => c[0] === 'event' && c[1] === 'page_view'); }

test.beforeEach(async ({ page }) => {
  // External services are isolated: no test visit reaches a live analytics account.
  await page.route('https://datafa.st/**', route => route.fulfill({status:200, body:''}));
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
  await expect.poll(async () => (await views(page)).length).toBe(1);
  await page.waitForTimeout(400);
  expect(await views(page)).toHaveLength(1);
  await page.context().addCookies([{name:'_ga',value:'withdrawal-test',url:new URL('/fr',page.url()).origin}]);
  await expect.poll(async () => (await page.context().cookies()).filter(c=>c.name.startsWith('_ga')).length).toBe(1);
  await page.getByRole('link', {name:'Mentions légales', exact:true}).click();
  await expect.poll(async () => (await views(page)).length).toBe(2);
  await page.reload();
  await expect.poll(async () => (await views(page)).length).toBe(1);
  const prefs = page.getByRole('button', {name:'Préférences cookies', exact:true});
  await prefs.click();
  await page.getByRole('button', {name:'Refuser', exact:true}).click();
  await expect(page.locator('script[data-tooltrim-ga]')).toHaveCount(1);
  await expect.poll(async () => (await page.context().cookies()).filter(c => c.name.startsWith('_ga')).length).toBe(0);
  await expect.poll(async () => (await views(page)).length).toBe(1);
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await prefs.click();
  await page.getByRole('button', {name:'Accepter', exact:true}).click();
  await expect.poll(async () => (await views(page)).length).toBe(1);
});

test('a slow tag reports the current route and configures before page_view', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('https://www.googletagmanager.com/**', async route => { await gate; await route.fulfill({status:200,body:''}); });
  await page.goto('/fr/privacy-policy');
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

test('refusal propagates to an already consenting tab', async ({ page, context }) => {
  await page.goto('/fr/privacy-policy');
  await page.getByRole('button', {name:'Accepter', exact:true}).click();
  await expect.poll(async () => (await views(page)).length).toBe(1);
  const documentStarted = await page.evaluate(() => performance.timeOrigin);
  const other = await context.newPage();
  await other.route('https://www.googletagmanager.com/**', route => route.fulfill({status:200,body:''}));
  await other.route('https://datafa.st/**', route => route.fulfill({status:200,body:''}));
  await other.goto('/fr/privacy-policy');
  await other.getByRole('button', {name:'Préférences cookies', exact:true}).click();
  await other.getByRole('button', {name:'Refuser', exact:true}).click();
  await expect.poll(() => page.evaluate(() => performance.timeOrigin).catch(() => documentStarted)).not.toBe(documentStarted);
  await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent).catch(() => undefined)).toBe(false);
  await expect.poll(async () => (await views(page)).length).toBe(1);
  await expect(other.locator('script[data-tooltrim-ga]')).toHaveCount(1);
});

test('expired or legacy decisions request consent again', async ({ page }) => {
  for (const decision of ['accepted', JSON.stringify({version:1,choice:'accepted',expiresAt:1})]) {
    await page.addInitScript(value => localStorage.setItem('tooltrim-analytics-consent', value), decision);
    await page.goto('/fr/privacy-policy');
    await expect(page.getByRole('button', {name:'Accepter', exact:true})).toBeVisible();
    await expect(page.locator('script[data-tooltrim-ga]')).toHaveCount(1);
  }
});

test('English mobile preferences, keyboard dismissal and focus restoration', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/en/privacy-policy');
  await expect(page.getByRole('dialog')).toBeVisible();
  const box = await page.getByRole('dialog').boundingBox();
  expect(box!.x).toBe(0);
  expect(box!.width).toBe(390);
  expect(box!.y + box!.height).toBeLessThanOrEqual(845);
  await page.screenshot({path:'/private/tmp/tooltrim-consent-mobile.png'});
  await page.getByRole('button', {name:'Refuse', exact:true}).click();
  const prefs = page.getByRole('button', {name:'Cookie preferences', exact:true});
  await prefs.click();
  await expect(page.getByRole('dialog')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(prefs).toBeFocused();
});

test('blocked storage still allows a page-session choice', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {get:()=> {throw new DOMException('blocked','SecurityError');}});
  });
  await page.goto('/fr/privacy-policy');
  await page.getByRole('button', {name:'Accepter', exact:true}).click();
  await expect.poll(async () => (await views(page)).length).toBe(1);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('withdrawal survives reload when the stored acceptance is readable but writes fail', async ({page}) => {
  await page.goto('/fr/privacy-policy');
  await page.getByRole('button', {name:'Accepter', exact:true}).click();
  await expect.poll(async () => (await views(page)).length).toBe(1);
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('quota','QuotaExceededError'); };
  });
  await page.reload();
  await expect.poll(async () => (await views(page)).length).toBe(1);
  await page.getByRole('button', {name:'Préférences cookies', exact:true}).click();
  await page.getByRole('button', {name:'Refuser', exact:true}).click();
  await expect(page.locator('script[data-tooltrim-ga]')).toHaveCount(1);
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent).catch(() => undefined)).toBe(false);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a newer refusal in another tab supersedes session acceptance', async ({page, context}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('tooltrim-analytics-consent')) sessionStorage.setItem('tooltrim-analytics-consent', JSON.stringify({version:1,choice:'accepted',decidedAt:1,expiresAt:Date.now()+86400000}));
  });
  await page.goto('/fr/privacy-policy');
  await expect.poll(async () => (await views(page)).length).toBe(1);
  const other = await context.newPage();
  await other.route('https://datafa.st/**', route=>route.fulfill({status:200,body:''}));
  await other.goto('/fr/privacy-policy');
  await other.getByRole('button', {name:'Refuser',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent).catch(() => undefined)).toBe(false);
});

test('tab fallback expiry is enforced when storage remains blocked', async ({page}) => {
  await page.addInitScript(() => {
    for (const key of ['localStorage','sessionStorage']) Object.defineProperty(window,key,{get:()=>{throw new DOMException('blocked','SecurityError');}});
  });
  await page.goto('/fr/privacy-policy');
  await page.getByRole('button',{name:'Accepter',exact:true}).click();
  await expect.poll(async ()=>(await views(page)).length).toBe(1);
  await page.evaluate(() => {
    window.name = window.name.replace(/(\n__tooltrimConsentV1=accepted:\d+:)\d+/, '$11');
    window.dispatchEvent(new Event('focus'));
  });
  await expect(page.getByRole('button',{name:'Accepter',exact:true})).toBeVisible();
  await expect(page.locator('script[data-tooltrim-ga]')).toHaveCount(1);
});
