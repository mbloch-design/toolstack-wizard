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

for (const lang of ['fr', 'en']) {
  test(`R5 ${lang}: a shared relation filter is applied and can be cleared`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.route('**/*supabase.co/**', route => route.abort());
    await page.goto(`/${lang}/explorer/around/vercel?destination=r5&angle=extensions&category=nocode-web`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-tool-slug]')).toHaveCount(0);
    await expect(page.locator('.ex-empty')).toBeVisible();
    await page.locator('.ex-empty button').click();
    await expect(page.locator('[data-tool-slug="netlify"]')).toBeVisible();
    const resetURL = new URL(page.url());
    expect(resetURL.searchParams.has('angle')).toBe(false);
    expect(resetURL.searchParams.has('category')).toBe(false);
    expect(resetURL.searchParams.get('destination')).toBe('r5');
    await page.goto(`/${lang}/explorer/around/vercel?angle=alternatives`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-tool-slug="netlify"]')).toBeVisible();
    await expect(page.locator('.ex-card-relation').filter({ hasText: /^(Usage commun|Shared use|Comparaison|Comparison|Même suite|Same suite)/ })).toHaveCount(0);
    await page.getByRole('button', { name: lang === 'fr' ? 'Voir toutes les relations' : 'Show all relations', exact: true }).click();
    await expect(page.locator('.ex-card-relation').filter({ hasText: /^(Usage commun|Shared use)/ }).first()).toBeVisible();
    expect(new URL(page.url()).searchParams.has('angle')).toBe(false);
  });
}

for (const lang of ['fr', 'en']) {
  test(`R5 ${lang}: host attachment and uncertain product surfaces remain distinct`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.route('**/*supabase.co/**', route => route.abort());
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /hydration|hydrating|did not match|minified react error/i.test(message.text())) errors.push(message.text());
    });
    await page.goto(`/${lang}/explorer/around/figma?angle=extensions`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-tool-slug="figma-tokens"] .ex-card-relation')).toContainText(lang === 'fr' ? 'Extension de Figma' : 'Extension for Figma');
    await expect(page.locator('[data-tool-slug="figma-dev-mode"] .ex-card-relation')).toContainText(lang === 'fr' ? 'Rattaché à Figma' : 'Attached to Figma');
    await expect(page.locator('[data-tool-slug="framer"]')).toHaveCount(0);
    await page.goto(`/${lang}/explorer/around/chatgpt?angle=alternatives`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-tool-slug="gemini"]')).toBeVisible();
    await expect(page.locator('[data-tool-slug="claude"], [data-tool-slug="deepseek"], [data-tool-slug="google-ai-studio"]')).toHaveCount(0);
    await page.getByRole('button', { name: lang === 'fr' ? 'Voir toutes les relations' : 'Show all relations', exact: true }).click();
    await expect(page.locator('[data-tool-slug="claude"] .ex-card-relation')).toContainText(lang === 'fr' ? 'périmètre à vérifier' : 'Scope comparison to verify');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    expect(errors).toEqual([]);
  });
}
