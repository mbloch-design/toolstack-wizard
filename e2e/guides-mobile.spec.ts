import { expect, test } from "playwright/test";

test.describe("Guides — parcours mobile-first", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("recherche simple et contenu d'article restent utilisables", async ({ page }) => {
    await page.route("**/*.supabase.co/**", (route) => route.abort("failed"));
    await page.goto("/fr/guides", { waitUntil: "domcontentloaded" });

    const controls = page.locator(".gi-simple-controls");
    const search = page.getByRole("searchbox", { name: "Rechercher un guide" });
    await expect(controls).toBeVisible();
    await expect(search).toBeVisible();
    await expect(controls).toHaveCSS("position", "static");

    await search.fill("Huberman");
    const hubermanCard = page.locator(".gi-card", { hasText: "Huberman" }).first();
    await expect(hubermanCard).toBeVisible();

    await hubermanCard.click();
    await expect(page).toHaveURL(/\/fr\/guide\/andrew-huberman-kit-systeme-audience/);

    const mobileToc = page.locator(".ga-mobile-toc");
    await expect(mobileToc).toBeVisible();
    await expect(mobileToc).not.toHaveAttribute("open", "");
    await expect(page.locator(".ga-content")).toContainText("Andrew Huberman");
  });

  test("l'article anglais hydraté directement reste stable", async ({ page }) => {
    const pageErrors: string[] = [];
    const editorialApiRequests: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("request", (request) => {
      if (/\/rest\/v1\/(posts|tools)(?:\?|$)/.test(request.url())) {
        editorialApiRequests.push(request.url());
      }
    });
    await page.route("**/*.supabase.co/**", (route) => route.abort("failed"));

    await page.goto("/en/guide/andrew-huberman-kit-systeme-audience", {
      waitUntil: "networkidle",
    });

    await expect(page.locator(".ga-content")).toContainText(
      "Andrew Huberman already had a substantial audience",
    );
    await expect(page.locator(".ga-content p")).toHaveCount(48);
    const sections = page.locator(".ga-article-section");
    for (const index of [0, Math.floor(await sections.count() / 2), await sections.count() - 1]) {
      await sections.nth(index).scrollIntoViewIfNeeded();
      await expect(sections.nth(index)).toBeVisible();
    }
    expect(pageErrors).toEqual([]);
    expect(editorialApiRequests).toEqual([]);
  });
});
