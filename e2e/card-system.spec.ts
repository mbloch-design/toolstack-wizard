import { expect, test, type Page } from "playwright/test";

const STACK_STORAGE_KEY = "tooltrim-ma-stack-mvp-v2";

async function seedDecisionCard(page: Page) {
  await page.addInitScript(({ storageKey }) => {
    localStorage.setItem(storageKey, JSON.stringify({
      version: 2,
      needs: [
        { id: "ia", labelFr: "Travailler avec l'IA", labelEn: "Work with AI", order: 10, source: "suggested" },
      ],
      toolEntries: [
        { toolSlug: "chatgpt", needIds: ["ia"], addedAt: "2026-01-01T00:00:00.000Z", assignmentMode: "manual" },
      ],
      pinnedToolSlugs: ["chatgpt"],
    }));
  }, { storageKey: STACK_STORAGE_KEY });
}

test.describe("Cards outils — contrats visuels et interactifs", () => {
  test("les routes de découverte ne chargent pas le catalogue de fiches complet", async ({ page }) => {
    const routes = [
      "/fr/tools",
      "/fr/category",
      "/fr/category/design-tools",
      "/fr/guides",
      "/fr/guide/top-5-competences-ia-freelance-2026",
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: "networkidle" });
      const resources = await page.evaluate(() => performance
        .getEntriesByType("resource")
        .map((entry) => entry.name));
      expect(resources.some((url) => /(?:data-tools-|tools_v4\.json)/.test(url))).toBe(false);
    }
  });

  test("card média : surface complète, menu indépendant et référence visuelle", async ({ page }) => {
    await page.goto("/fr/tools");
    const card = page.locator(".tce-card--media", {
      has: page.locator('.tce-primary-link[href="/fr/tool/framer"]'),
    }).first();
    const primaryLink = card.locator(".tce-primary-link");
    const menu = card.locator(".tce-action-menu");

    await expect(card).toBeVisible();
    await expect(primaryLink).toHaveAttribute("href", /\/fr\/tool\//);
    await expect(card.locator('[data-image-state="ready"]')).toBeVisible();
    await primaryLink.focus();
    await expect(primaryLink).toBeFocused();

    await menu.locator("summary").click();
    await expect(menu).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
    await expect(menu).not.toHaveAttribute("open", "");
    await expect(menu.locator("summary")).toBeFocused();

    await expect(card).toHaveScreenshot("tool-card-media.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("card compacte : identité stable et action secondaire séparée", async ({ page }) => {
    await page.goto("/fr/search?q=framer");
    const card = page.locator(".tcc-card").first();
    const primaryLink = card.locator(".tcc-primary-link");
    const exploreLink = card.locator(".tcc-explore");

    await expect(card).toBeVisible();
    await expect(primaryLink).toHaveAttribute("href", "/fr/tool/framer");
    await expect(exploreLink).toHaveAttribute("href", /\/fr\/explorer/);
    await expect(card).toHaveScreenshot("tool-card-compact-desktop.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(exploreLink).toHaveCSS("width", "44px");
    await expect(exploreLink).toHaveCSS("height", "44px");
    await expect(card).toHaveScreenshot("tool-card-compact-mobile.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("card décision : variante dédiée à Ma Stack", async ({ page }) => {
    await seedDecisionCard(page);
    await page.goto("/fr/ma-stack");
    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();

    const card = page.locator(".tce-card--compact").first();
    await expect(card).toBeVisible();
    await expect(card).toHaveScreenshot("tool-card-decision.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });
});
