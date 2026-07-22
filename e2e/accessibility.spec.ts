import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "playwright/test";

const routes = [
  { path: "/fr/tools", landmark: "main" },
  { path: "/fr/search?q=design", landmark: "main" },
  { path: "/fr/explorer?type=outil&source=framer", landmark: "main" },
  { path: "/fr/ma-stack", landmark: "main" },
] as const;

async function expectNoHighImpactViolations(page: Page, include?: string) {
  const audit = new AxeBuilder({ page });
  if (include) audit.include(include);
  const results = await audit.analyze();
  const violations = results.violations.filter(
    ({ impact }) => impact === "critical" || impact === "serious",
  );

  expect(
    violations,
    violations
      .map(({ id, impact, help, nodes }) => `${impact}: ${id} — ${help} (${nodes.length})`)
      .join("\n"),
  ).toEqual([]);
}

for (const route of routes) {
  test(`${route.path} has no serious accessibility violation`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.locator(route.landmark).first()).toBeVisible();
    await expectNoHighImpactViolations(page);
  });
}

test("search result filters expose their actual pressed state", async ({ page }) => {
  await page.goto("/fr/search?q=design");

  const filters = page.getByRole("group", { name: "Filtrer les résultats par type" });
  const firstFilter = filters.getByRole("button").first();
  await expect(firstFilter).toHaveAttribute("aria-pressed", "true");

  const nextFilter = filters.getByRole("button").nth(1);
  await nextFilter.focus();
  await page.keyboard.press("Enter");
  await expect(nextFilter).toHaveAttribute("aria-pressed", "true");
});

test("editorial card menu closes with Escape and returns focus", async ({ page }) => {
  await page.goto("/fr/tools");

  const trigger = page.getByLabel("Actions pour Framer");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".tce-action-menu[open]").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".tce-action-menu[open]")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("card motion is removed when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/fr/tools");

  const image = page.locator(".tce-card--media .tc-image img").first();
  await expect(image).toBeVisible();
  await expect(image).toHaveCSS("transition-duration", "0s");
});

test("global search traps focus and returns it to its trigger", async ({ page }) => {
  await page.goto("/fr/tools");

  const trigger = page.locator(".asv2-search");
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Recherche" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("combobox")).toBeFocused();
  await expectNoHighImpactViolations(page, ".search-modal-dialog");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("mobile search has an explicit close action", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/fr/tools");

  const trigger = page.locator(".asv2-search");
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Recherche" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Fermer la recherche" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("Explorer returns focus after Escape", async ({ page }) => {
  await page.goto("/fr/back-office");

  const trigger = page.locator(".nav-explorer-btn");
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Menu exploration" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button").first()).toBeFocused();
  await expectNoHighImpactViolations(page, ".editorial-panel");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("catalog filter popover restores focus after Escape", async ({ page }) => {
  await page.goto("/fr/tools");

  const trigger = page.getByRole("button", { name: "Catégorie", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");

  const filterDialog = page.getByRole("dialog", { name: "Catégorie" });
  await expect(filterDialog).toBeVisible();
  await expectNoHighImpactViolations(page, ".tf-dd-panel");
  await page.keyboard.press("Escape");
  await expect(filterDialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("stack filter dialog has a complete keyboard cycle", async ({ page }) => {
  await page.goto("/fr/stacks");

  const trigger = page.getByRole("button", { name: "Ouvrir les filtres" });
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Filtres" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Fermer" })).toBeFocused();
  await expectNoHighImpactViolations(page, ".sk-filters-panel");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
