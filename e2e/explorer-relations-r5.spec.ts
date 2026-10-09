import { test, expect } from '@playwright/test';

for (const lang of ['fr', 'en']) for (const width of [390, 1440]) {
  test(`R5 ${lang}/${width}: reasons, recenter/back, collection and canonical`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/*supabase.co/**', route => route.abort());
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      if (sessionStorage.getItem('r5-seeded')) return;
      sessionStorage.setItem('r5-seeded', '1');
      localStorage.setItem('tooltrim-analytics-consent', 'refused');
      localStorage.setItem('tooltrim-ma-stack-mvp-v3', JSON.stringify({ version: 3, needs: [{ id: 'r5', labelFr: 'Recette R5', labelEn: 'R5 recipe', source: 'custom', order: 10 }], pinnedToolSlugs: [], toolEntries: [] }));
    });
    const sourcePath = `/${lang}/explorer/around/vercel?destination=r5&angle=alternatives`;
    await page.goto(sourcePath, { waitUntil: 'domcontentloaded' });
    const netlify = page.locator('[data-tool-slug="netlify"]');
    await expect(netlify).toBeVisible();
    await expect(netlify.locator('.ex-card-relation')).toContainText('Vercel');
    await expect(page.locator('[data-tool-slug="gelato"], [data-tool-slug="finale-inventory"], [data-tool-slug="remix"]')).toHaveCount(0);
    await expect(page.locator('.ex-relations-note')).toContainText(lang === 'fr' ? 'n’indique pas une intégration' : 'does not establish an integration');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://tooltrim.com/${lang}/explorer/around/vercel`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    await netlify.locator('.ex-card-identity').click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/explorer/around/netlify\\?`));
    await expect(page.locator('#explorer-title')).toContainText('Netlify');
    await expect(page.locator('.ex-relations-note, .ex-card-relation')).toHaveCount(0);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(netlify).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${lang}/explorer/around/vercel\\?`));
    await netlify.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
    await netlify.hover();
    await netlify.getByRole('button').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: lang === 'fr' ? 'Terminer' : 'Done', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(netlify.getByRole('button')).toBeDisabled();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(netlify.getByRole('button')).toBeDisabled();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('tooltrim-ma-stack-mvp-v3') || '{}'));
    expect(state.toolEntries.find((entry: { toolSlug: string }) => entry.toolSlug === 'netlify').needIds).toContain('r5');
    await page.locator('#explorer-title').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/private/tmp/r5-${lang}-${width}.png` });
    expect(errors).toEqual([]);
  });
}
