import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "playwright/test";

const routes = [
  { path: "/fr/tools", landmark: "main" },
  { path: "/fr/search?q=design", landmark: "main" },
  { path: "/fr/explorer?type=outil&source=framer", landmark: "main" },
  { path: "/fr/ma-stack", landmark: "main" },
] as const;

async function expectNoHighImpactViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
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

  const trigger = page.locator(".tce-action-trigger").first();
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
