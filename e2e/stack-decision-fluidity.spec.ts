import { test, expect } from '@playwright/test';

for (const reducedMotion of ["no-preference", "reduce"] as const) for (const width of [390, 1440]) for (const choice of [0, 1, 2]) {
  test(`pair choice ${choice} advances promptly at ${width}px (${reducedMotion})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion });
    await page.route('**/*supabase.co/**', route => route.abort());
    await page.addInitScript(() => {
      const slugs = ['chatgpt', 'claude', 'supabase', 'mongodb-atlas'];
      localStorage.setItem('tooltrim-personal-stack-v4:anonymous', JSON.stringify({
        version: 4,
        selection: { version: 3, needs: [], pinnedToolSlugs: slugs,
          toolEntries: slugs.map(toolSlug => ({ toolSlug, needIds: [], intent: 'stack', addedAt: '2026-10-21T00:00:00Z', assignmentMode: 'pending' })) },
        billing: { paid: slugs, reviewed: slugs, choices: Object.fromEntries(slugs.map(slug => [slug, { source: 'custom', amount: 10, currency: 'EUR', period: 'monthly' }])) },
        decisions: {}, usage: {}, trade: null, dailyRate: null,
      }));
      localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({ version: 1, choice: 'refused', decidedAt: Date.now(), expiresAt: Date.now() + 3600000 }));
    });
    await page.goto('/fr/ma-stack', { waitUntil: 'domcontentloaded' });
    const card = page.locator('.mf-now[data-kind="pair"]');
    await expect(card).toBeVisible();
    const expand = card.locator('.mf-expand');
    if (await expand.isVisible()) await expand.click();
    const buttons = card.locator('.mf-choice-group > button');
    await expect(buttons).toHaveCount(3);
    const entry = await buttons.first().evaluate(button => ({ duration: getComputedStyle(button).animationDuration, delay: getComputedStyle(button).animationDelay }));
    expect(entry).toEqual({ duration: reducedMotion === 'reduce' ? '0s' : '0.16s', delay: '0s' });
    const before = await card.locator('.mf-face-name').allTextContents();
    await card.scrollIntoViewIfNeeded();
    if (choice === 1 && reducedMotion === 'no-preference') await page.screenshot({ path: `/tmp/tooltrim-pair-fluidity-${width}.png` });
    await page.clock.install();
    await buttons.nth(choice).click();
    if (reducedMotion === 'no-preference') for (const button of await buttons.all()) await expect(button).toBeDisabled();
    await page.clock.runFor(200);
    await expect.poll(async () => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('tooltrim-personal-stack-v4:anonymous') || '{}').decisions || {}).length)).toBe(1);
    await expect.poll(async () => card.locator('.mf-face-name').allTextContents()).not.toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}
