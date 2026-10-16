import { test, expect } from "@playwright/test";

// An expired, fictitious session catches accidental SDK initialization/refresh.
// Never use a real access or refresh token in this browser recipe.
const authKey = "sb-rtfyfuwfdpnsogovkwai-auth-token";
const expiredSession = JSON.stringify({
  access_token: "fixture.expired.signature", refresh_token: "fixture-not-a-token",
  expires_at: 1, expires_in: 1, token_type: "bearer",
  user: { id: "00000000-0000-4000-8000-000000000000" },
});

for (const lang of ["fr", "en"]) {
  test(`${lang}: public catalogue never contacts Supabase, including client navigation`, async ({ page, baseURL }) => {
    const attempts: string[] = [];
    const errors: string[] = [];
    page.on("request", request => {
      if (new URL(request.url()).hostname.endsWith(".supabase.co")) attempts.push(new URL(request.url()).pathname);
    });
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => new URL(route.request().url()).origin === new URL(baseURL!).origin ? route.continue() : route.abort());
    await page.addInitScript(({ authKey, expiredSession }) => {
      localStorage.setItem(authKey, expiredSession);
      localStorage.setItem("tooltrim-analytics-consent", JSON.stringify({ version: 1, choice: "refused", decidedAt: Date.now(), expiresAt: Date.now() + 3600000 }));
    }, { authKey, expiredSession });

    await page.goto(`/${lang}/tools`);
    await expect(page.locator('main a[href*="/tool/"]').first()).toBeVisible();
    await page.locator(".tt-pill--more").click();
    await expect(page.locator(".tt-filter-panel")).toBeVisible();
    await page.locator(".tt-pill--more").click();
    await page.evaluate(() => { document.documentElement.dataset.catalogRecipe = "same-document"; });
    // A real card link enters a fiche through the router, without SSR context.
    const card = page.locator('main a[href="/' + lang + '/tool/notion"]').first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/tool/notion$`));
    await expect(page.locator("h1")).toContainText("Notion");
    await expect(page.locator("html")).toHaveAttribute("data-catalog-recipe", "same-document");
    await expect(page.locator(".td-tool-subnav")).toHaveClass(/td-reveal/);

    await page.goto(`/${lang}/category/communication`);
    await expect(page.locator('main a[href*="/tool/"]').first()).toBeVisible();
    await page.goto(`/${lang}/ma-stack`);
    await expect(page.locator("h1")).toHaveText(lang === "fr" ? "Mes outils" : "My tools");
    await page.locator(".ms-search input").fill("Notion");
    await expect(page.locator(".ms-results")).toContainText("Notion");
    await page.goto(`/${lang}/comparatif/notion-vs-airtable`);
    await expect(page.locator("h1")).toContainText(/Notion/);
    await page.goto(`/${lang}/guides`);
    const guide = page.locator('a[href*="/guide/"]').first();
    await expect(guide).toBeVisible();
    await guide.click();
    await expect(page.locator("h1")).toBeVisible();
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), authKey)).toBe(expiredSession);
    expect(attempts).toEqual([]);
    expect(errors).toEqual([]);
  });
}
