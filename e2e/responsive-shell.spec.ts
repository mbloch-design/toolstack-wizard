import { expect, test, type Page } from "playwright/test";

const STACK_STORAGE_KEY = "tooltrim-ma-stack-mvp-v2";
const VIEWPORTS = [
  { name: "mobile", width: 320, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const;

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}

async function seedStack(page: Page) {
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

for (const viewport of VIEWPORTS) {
  test.describe(`Responsive global — ${viewport.name}`, () => {
    test.use({ viewport });

    test("catalogue et recherche restent contenus dans la fenêtre", async ({ page }) => {
      await page.goto("/fr/tools", { waitUntil: "networkidle" });
      await expect(page.locator(".tce-card--media").first()).toBeVisible();
      await expectNoPageOverflow(page);

      await page.goto("/fr/search?q=design", { waitUntil: "networkidle" });
      await expect(page.locator(".tcc-card").first()).toBeVisible();
      await expect(page.locator(".sp-category-card").first()).toBeVisible();
      await expectNoPageOverflow(page);

      const categoryBox = await page.locator(".sp-category-card").first().boundingBox();
      expect(categoryBox).not.toBeNull();
      expect(categoryBox!.x).toBeGreaterThanOrEqual(0);
      expect(categoryBox!.x + categoryBox!.width).toBeLessThanOrEqual(viewport.width);
    });

    test("Explorer et Ma stack gardent leur axe responsive", async ({ page }) => {
      await page.goto("/fr/explorer?type=outil&source=framer", { waitUntil: "networkidle" });
      await expect(page.locator(".ex-card").first()).toBeVisible();
      await expectNoPageOverflow(page);

      await seedStack(page);
      await page.goto("/fr/ma-stack", { waitUntil: "networkidle" });
      await expect(page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true })).toBeVisible();
      await expectNoPageOverflow(page);
    });
  });
}
