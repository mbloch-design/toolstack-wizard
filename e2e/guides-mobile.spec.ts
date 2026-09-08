import { expect, test } from "playwright/test";

test.describe("Guides — parcours mobile-first", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("recherche, sticky et contenu d'article restent utilisables", async ({ page }) => {
    await page.route("**/*.supabase.co/**", (route) => route.abort("failed"));
    await page.goto("/fr/guides", { waitUntil: "domcontentloaded" });

    const toolbar = page.locator(".gi-catalog-toolbar");
    const search = page.getByRole("searchbox", { name: "Rechercher un guide" });
    await expect(toolbar).toBeVisible();
    await expect(search).toBeVisible();

    await search.fill("Huberman");
    const hubermanCard = page.locator(".gi-card", { hasText: "Huberman" }).first();
    await expect(hubermanCard).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 500));
    await expect.poll(async () => Math.round((await toolbar.boundingBox())?.y ?? -1)).toBe(56);

    await hubermanCard.click();
    await expect(page).toHaveURL(/\/fr\/guide\/andrew-huberman-kit-systeme-audience/);

    const mobileToc = page.locator(".ga-mobile-toc");
    await expect(mobileToc).toBeVisible();
    await expect(mobileToc).not.toHaveAttribute("open", "");
    await expect(page.locator(".ga-content")).toContainText("Andrew Huberman");
  });

  test("l'article anglais hydraté directement reste stable", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route("**/*.supabase.co/**", (route) => route.abort("failed"));

    await page.goto("/en/guide/andrew-huberman-kit-systeme-audience", {
      waitUntil: "networkidle",
    });

    await expect(page.locator(".ga-content")).toContainText(
      "Andrew Huberman already had a substantial audience",
    );
    await expect(page.locator(".ga-content p")).toHaveCount(48);
    expect(pageErrors).toEqual([]);
  });
});
