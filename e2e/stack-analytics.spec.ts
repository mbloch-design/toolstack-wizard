import { test, expect, type Page } from '@playwright/test';

const stackKey = 'tooltrim-ma-stack-mvp-v3';
const journeyNames = ['explorer_view', 'explorer_save', 'explorer_back'];
async function events(page: Page) {
  return page.evaluate(names => (window.dataLayer ?? [])
    .map(command => Array.from(command as ArrayLike<unknown>))
    .filter(command => command[0] === 'event' && names.includes(command[1] as string)), journeyNames);
}
async function seed(page: Page, choice: 'accepted' | 'refused' | null) {
  await page.addInitScript(({ key, choice }) => {
    if (choice && !localStorage.getItem('tooltrim-analytics-consent')) {
      localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({version:1, choice, decidedAt:Date.now(), expiresAt:Date.now()+3600000}));
    }
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      version:3, needs:[{id:'private-client',labelFr:'Client confidentiel',labelEn:'Private client',order:0,source:'custom'}],
      pinnedToolSlugs:['figma'], toolEntries:[{toolSlug:'figma',needIds:['private-client'],intent:'stack',addedAt:'2026-10-14T00:00:00Z',assignmentMode:'manual'}],
    }));
  }, {key:stackKey, choice});
}
async function saveIdea(page: Page, lang = 'fr') {
  const card = page.locator('[data-tool-slug]').filter({has:page.locator('button:not([disabled])')}).first();
  const slug = await card.getAttribute('data-tool-slug');
  await card.getByRole('button').click();
  const toast = page.locator('.stack-toast');
  await expect(toast).toBeVisible();
  await expect(page.locator(`[data-tool-slug="${slug}"]`).getByRole('button')).toBeDisabled();
}

test.beforeEach(async ({page}) => {
  // No recipe interaction reaches a live analytics account.
  await page.route('**/_vercel/insights/**', route => route.fulfill({status:200, body:''}));
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({status:200,contentType:'application/javascript',body:''}));
  await page.route('https://*.google-analytics.com/**', route => route.abort());
  await page.route('**/*supabase.co/**', route => route.abort());
});

for (const [lang, width] of [['fr',390], ['en',1440]] as const) {
  test(`consented discovery funnel ${lang}/${width}: confirmed save, no private collection data`, async ({page}) => {
    await page.setViewportSize({width,height:1000});
    await seed(page, 'accepted');
    await page.goto(`/${lang}/ma-stack`);
    await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent)).toBe(true);
    await page.getByRole('link', {name:lang === 'fr' ? 'Explorer autour de ma stack' : 'Explore around my stack',exact:true}).click();
    await expect.poll(async () => (await events(page)).filter(c => c[1] === 'explorer_view').length).toBe(1);
    await saveIdea(page, lang);
    await expect.poll(async () => (await events(page)).map(c => c[1])).toEqual(['explorer_view','explorer_save']);
    await page.getByRole('button', {name:lang === 'fr' ? 'Retour à Ma stack' : 'Back to My stack',exact:true}).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe(`/${lang}/ma-stack`);
    expect(await events(page)).toEqual([
      ['event','explorer_view',{source_type:'stack'}],
      ['event','explorer_save',{source_type:'stack',intent:'stack'}],
      ['event','explorer_back',{source_type:'stack'}],
    ]);
    await expect(page.locator('.ms-tool')).toHaveCount(2);
    const payload = JSON.stringify(await events(page));
    expect(payload).not.toMatch(/private-client|Client confidentiel|Private client|figma/);
  });
}

test('refusal keeps discovery usable without detailed journey events', async ({page}) => {
  await seed(page, 'refused');
  await page.goto('/fr/explorer?type=stack&source=ma-stack');
  await expect(page.locator('[data-tool-slug]').first()).toBeVisible();
  await saveIdea(page);
  await page.getByRole('button',{name:'Retour à Ma stack',exact:true}).click();
  await expect(page).toHaveURL(/\/fr\/ma-stack$/);
  expect(await events(page)).toEqual([]);
});

test('late acceptance measures the current view without replaying earlier saves', async ({page}) => {
  await seed(page, null);
  await page.goto('/fr/explorer?type=stack&source=ma-stack');
  await saveIdea(page);
  expect(await events(page)).toEqual([]);
  // A hovered success toast pauses dismissal and can overlap the consent CTA.
  // Move away and wait for its normal dismissal; never force a covered click.
  await page.mouse.move(0, 0);
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
  await page.getByRole('button',{name:'Accepter',exact:true}).click();
  await expect.poll(async () => (await events(page)).map(c => c[1])).toEqual(['explorer_view']);
});

test('direct arrival waits for a slow tag and does not duplicate the view on filters', async ({page}) => {
  await seed(page, 'accepted');
  let release!: () => void;
  const gate = new Promise<void>(resolve => {release = resolve;});
  await page.route('https://www.googletagmanager.com/**', async route => {
    await gate; await route.fulfill({status:200,contentType:'application/javascript',body:''});
  });
  await page.goto('/fr/explorer/around/figma', {waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-tool-slug]').first()).toBeVisible();
  expect(await events(page)).toEqual([]);
  release();
  await expect.poll(async () => (await events(page)).map(c => c[1])).toEqual(['explorer_view']);
  const category = page.locator('button.ex-tag-filter-item').nth(1);
  await expect(category).toBeVisible();
  await category.click();
  await expect(page).toHaveURL(/category=/);
  expect(await events(page)).toEqual([['event','explorer_view',{source_type:'outil'}]]);
});

test('withdrawal stops the new journey events after the required reload', async ({page}) => {
  await seed(page, 'accepted');
  await page.goto('/fr/explorer?type=stack&source=ma-stack');
  await expect.poll(async () => (await events(page)).length).toBe(1);
  await page.getByRole('button',{name:'Préférences cookies',exact:true}).click();
  await page.getByRole('button',{name:'Refuser',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__tooltrimAnalyticsConsent).catch(() => undefined)).toBe(false);
  await saveIdea(page);
  expect(await events(page)).toEqual([]);
});

