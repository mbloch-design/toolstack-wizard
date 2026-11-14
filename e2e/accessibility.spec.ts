import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "playwright/test";

// These scenarios exercise navigation after the visitor has made a consent choice.
// The consent dialog itself is covered by analytics-consent.spec.ts.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("tooltrim-analytics-consent", JSON.stringify({
      version: 1, choice: "refused", decidedAt: Date.now(), expiresAt: Date.now() + 3600000,
    }));
  });
});

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

for (const lang of ["fr", "en"] as const) for (const width of [390, 1440]) {
test(`editorial card direct save is keyboard accessible and persists ${lang}/${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`/${lang}/tools`);
  // The catalogue's media card (13/11/2026): the card is a link, its round button adds the tool to my stack.
  const card = page.locator("li:has(> button[data-media-add])").first();
  const save = card.locator("button[data-media-add]");
  const link = card.locator("a").first();
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();
  const slug = href!.split("/").pop()!;
  await expect(save).toBeEnabled();
  await link.focus();
  await page.keyboard.press("Tab");
  await expect(save).toBeVisible();
  await expect(save).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(save).toHaveAttribute("data-state", "added");
  await expect.poll(() => new URL(page.url()).pathname).toBe(`/${lang}/tools`);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("tooltrim-personal-stack-v4:anonymous") || "{}").selection?.pinnedToolSlugs)).toEqual([slug]);
  await page.reload();
  await expect(page.locator(`li:has(> a[href="${href}"]) button[data-media-add]`)).toHaveAttribute("data-state", "added");
});

}

test("card motion is removed when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/fr/tools");

  const image = page.locator(".tce-card--media .tc-image img").first();
  await expect(image).toBeVisible();
  await expect(image).toHaveCSS("transition-duration", "0s");
});

test("global search traps focus and returns it to its trigger", async ({ page }) => {
  await page.goto("/fr/tools");

  const trigger = page.getByRole("button", { name: /^Rechercher \(/ });
  await expect(trigger).toBeVisible();
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Recherche globale", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("combobox")).toBeFocused();
  // Audit the settled colors, not opacity blended during the staggered entrance.
  await dialog.evaluate(async (element) => {
    const finiteAnimations = element.getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity);
    await Promise.allSettled(finiteAnimations.map((animation) => animation.finished));
  });
  await expectNoHighImpactViolations(page, ".gs-dialog");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("mobile search has an explicit close action", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/fr/tools");

  const trigger = page.getByRole("button", { name: /^Rechercher \(/ });
  await expect(trigger).toBeVisible();
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Recherche globale", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("mobile menu restores focus after Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/fr/tools");
  // The shell's phone menu (11/11/2026): the last tab of the tab bar opens it from the bottom.
  const trigger = page.locator("[data-shell-tabbar]").getByRole("button", { name: "Menu", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Menu", exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await expectNoHighImpactViolations(page, "[data-drawer]");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

for (const lang of ["fr", "en"] as const) for (const width of [390, 1440]) for (const catalog of ["tools", "stacks"] as const) {
  test(`${catalog} filters keep selection and restore keyboard focus ${lang}/${width}`, async ({ page }) => {
    const en = lang === "en";
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/${lang}/${catalog}`);
    const triggerName = catalog === "tools"
      ? (en ? "Filters and sort" : "Filtres et tri") : (en ? "Filters" : "Filtres");
    const trigger = page.getByRole("button", { name: triggerName, exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");
    // A modal sheet (tools) hides the page from assistive tech while open: read the trigger by its stable hook.
    await expect(catalog === "tools" ? page.locator("[data-filters-trigger]") : trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = page.getByRole("dialog", { name: en ? "Filters" : "Filtres", exact: true });
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await expectNoHighImpactViolations(page, catalog === "tools" ? "[data-drawer]" : ".tt-filter-panel");
    const choice = catalog === "tools"
      ? dialog.getByRole("button", { name: en ? "Free plan" : "Plan gratuit", exact: true })
      : dialog.getByRole("radiogroup", { name: en ? "Sort by" : "Trier par", exact: true }).getByRole("radio", { name: "Budget", exact: true });
    // The catalogue's sheet uses the system's segmented choices (pressed buttons); the category page keeps radios.
    const chosen = catalog === "tools" ? "aria-pressed" : "aria-checked";
    await choice.focus();
    await page.keyboard.press("Space");
    await expect(choice).toHaveAttribute(chosen, "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(choice).toHaveAttribute(chosen, "true");
    if (width === 390) {
      const close = dialog.getByRole("button", { name: en ? "Close" : "Fermer", exact: true });
      await expect(close).toBeVisible();
      await close.focus();
      await page.keyboard.press("Enter");
    } else {
      await page.keyboard.press("Escape");
    }
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
