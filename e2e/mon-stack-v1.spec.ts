import { test, expect } from "@playwright/test";
import fs from "node:fs";
const key = "tooltrim-ma-stack-mvp-v3";
const slugs = ["figma", "canva", "notion", "slack", "chatgpt", "claude", "miro", "zapier", "make", "dropbox", "calendly", "typeform"];
const seed = (ids = slugs) => ({ version: 3, needs: [], pinnedToolSlugs: ids, toolEntries: ids.map((toolSlug) => ({ toolSlug, needIds: [], intent: "stack", addedAt: "2026-10-05T00:00:00.000Z", assignmentMode: "pending" })) });

test.beforeEach(async ({ page }) => {
  await page.route("**/*supabase.co/**", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("tooltrim-analytics-consent", "refused"));
});

test("empty → search → add → inspect → remove → undo → persist", async ({ page }) => {
  await page.goto("/fr/ma-stack", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Mes outils", exact: true })).toBeVisible();
  await expect(page.locator(".ms-card-grid")).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Rechercher un outil", exact: true }).fill("figma");
  await page.getByRole("button", { name: "Ajouter Figma", exact: true }).click();
  await expect(page).toHaveURL(/ma-stack$/);
  await expect(page.locator(".ms-tool")).toHaveCount(1);
  await page.locator(".ms-tool").click();
  await expect(page.locator(".ms-tool-sheet")).toBeVisible();
  await page.getByRole("button", { name: "Retirer de ma stack", exact: true }).click();
  await expect(page.locator(".ms-tool")).toHaveCount(0);
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page.locator(".ms-tool")).toHaveCount(1);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-tool")).toHaveCount(1);
  const storage = await page.context().storageState();
  const context = await page.context().browser()!.newContext({ storageState: storage });
  await context.route("**/*supabase.co/**", (route) => route.abort());
  const reopened = await context.newPage();
  await reopened.goto(`${test.info().project.use.baseURL}/fr/ma-stack`, { waitUntil: "domcontentloaded" });
  await expect(reopened.locator(".ms-tool")).toHaveCount(1);
  await context.close();
});

test("tool profile adds with one click and its saved CTA opens stack context", async ({ page }) => {
  await page.goto("/fr/tool/figma", { waitUntil: "domcontentloaded" });
  const cta = page.locator(".td-hero-actions .pin-tool-button--full");
  await cta.click();
  await expect(page).toHaveURL(/\/fr\/tool\/figma$/);
  await expect(cta).toContainText("Dans ma stack");
  await cta.click();
  await expect(page).toHaveURL(/ma-stack\?outil=figma/);
  await expect(page.locator(".ms-tool-sheet .ms-ts-title")).toHaveText("Figma");
  await page.locator(".ms-tool-sheet").getByRole("link", { name: "Fiche complète", exact: true }).click();
  await expect(page).toHaveURL(/\/fr\/tool\/figma$/);
});

for (const lang of ["fr", "en"]) for (const width of [390, 820, 1440]) {
  test(`${lang} / ${width}px: territories, Map, keyboard and no overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key, state: seed() });
    await page.goto(`/${lang}/ma-stack`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".ms-tool")).toHaveCount(slugs.length);
    await expect(page.locator(".ms-card-grid")).not.toHaveCount(0);
    // Area tabs filter My tools; All brings every tool back.
    const tab = page.locator(".ms-domain-filters button").nth(1);
    await tab.click();
    await expect(tab).toHaveAttribute("aria-pressed", "true");
    expect(await page.locator(".ms-tool").count()).toBeLessThanOrEqual(slugs.length);
    await page.locator(".ms-domain-filters button").first().click();
    await expect(page.locator(".ms-tool")).toHaveCount(slugs.length);
    // Edit mode: a minus badge removes a tool, Undo restores it.
    await page.locator(".ms-tools-actions").getByRole("button", { name: lang === "fr" ? "Modifier" : "Edit" }).click();
    await page.locator(".ms-card-remove").first().dispatchEvent("click"); // cards wiggle in edit mode
    await expect(page.locator(".ms-tool")).toHaveCount(slugs.length - 1);
    await page.getByRole("button", { name: lang === "fr" ? "Annuler" : "Undo", exact: true }).click();
    await expect(page.locator(".ms-tool")).toHaveCount(slugs.length);
    await page.locator(".ms-tools-actions").getByRole("button", { name: lang === "fr" ? "Terminé" : "Done" }).click();
    await page.locator(".ms-tool").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".ms-tool-sheet")).toBeVisible();
    // The sheet is a dialog: focus moves inside it.
    expect(await page.evaluate(() => !!document.activeElement?.closest(".ms-tool-sheet"))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.locator(".ms-tool-sheet")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const screenshotDir = "/private/tmp/tooltrim-mon-stack-v2";
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.locator(".ms-hero h1").click();
    await page.screenshot({ path: `${screenshotDir}/${lang}-${width}-dashboard.png`, fullPage: true });
  });
}

test("invalid catalogue ID and missing price remain usable", async ({ page }) => {
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key, state: seed(["no-such-tool", "figma"]) });
  await page.goto("/en/ma-stack", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-unavailable")).toContainText("no-such-tool");
  await page.locator(".ms-unavailable button").click();
  await expect(page.locator(".ms-unavailable")).toHaveCount(0);
  await expect(page.locator(".ms-tool")).toHaveCount(1);
  await expect(page.locator(".ms-page")).not.toContainText(/undefined|null|\$0/);
});

test("corrupt storage recovers without crashing", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "{invalid"), key);
  await page.goto("/en/ma-stack", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("searchbox", { name: "Search for a tool", exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search for a tool", exact: true }).fill("slack");
  await page.getByRole("button", { name: "Add Slack", exact: true }).click();
  await expect(page.locator(".ms-tool")).toHaveCount(1);
});

test("blocked localStorage getter keeps selection usable in memory", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } }));
  await page.goto("/en/ma-stack", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("searchbox", { name: "Search for a tool", exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search for a tool", exact: true }).fill("slack");
  await page.getByRole("button", { name: "Add Slack", exact: true }).click();
  await expect(page.locator(".ms-tool")).toHaveCount(1);
  await expect(page.locator(".ms-storage-notice")).toContainText("session");
});


test("catalogue refresh updates the same saved selection without persisting tool data", async ({ page }) => {
  let name = "Figma — catalogue initial";
  await page.route("**/*supabase.co/**", async (route) => {
    expect(["GET", "OPTIONS"]).toContain(route.request().method());
    if (route.request().url().includes("/rest/v1/tools?")) {
      await route.fulfill({ json: [{
        id: "figma", slug: "figma", name, category: "design-tools",
        pricing: { free: "", paid: "Sur devis" },
      }] });
    } else await route.abort();
  });
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key, state: seed(["figma"]) });
  await page.goto("/fr/ma-stack", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-tool")).toContainText("Figma — catalogue initial");
  name = "Figma — catalogue actualisé";
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-tool")).toContainText("Figma — catalogue actualisé");
  const stored = await page.evaluate((key) => localStorage.getItem(key), key);
  expect(stored).not.toMatch(/pricing|logo|description|catalogue initial|catalogue actualisé/);
});

test("corrupt main snapshot recovers its backup", async ({ page }) => {
  await page.addInitScript(({ key, state }) => {
    localStorage.setItem(key, "{broken");
    localStorage.setItem(`${key}-backup`, JSON.stringify(state));
  }, { key, state: seed(["slack"]) });
  await page.goto("/en/ma-stack", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-tool")).toHaveCount(1);
  await expect(page.locator(".ms-storage-notice")).toContainText("recovered");
});

test("known alternatives stay contextual and selection stays in the workspace", async ({ page }) => {
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key, state: seed(["chatgpt", "claude", "figma"]) });
  await page.goto("/fr/ma-stack?outil=chatgpt", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-tool-sheet")).toContainText("Claude");
  await expect(page.locator(".ms-tool-sheet")).not.toContainText("Figma");
  await page.locator(".ms-ts-other").filter({ hasText: "Claude" }).first().click();
  await expect(page.locator(".ms-tool-sheet .ms-ts-title")).toHaveText("Claude");
  await expect(page).toHaveURL(/ma-stack\?outil=claude/);
  await page.screenshot({ path: "/private/tmp/tooltrim-mon-stack-v2/fr-1440-context.png", fullPage: true });
});

test("a substantial stack stays readable at 320px", async ({ page }) => {
  const ids = JSON.parse(fs.readFileSync("src/data/tools_index.json", "utf8")).slice(0, 60).map((tool: { slug: string }) => tool.slug);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key, state: seed(ids) });
  await page.goto("/fr/ma-stack", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-tool").first()).toBeVisible();
  expect(await page.locator(".ms-tool").count() + await page.locator(".ms-unavailable > div").count()).toBe(60);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
