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
  await expect(page.getByRole("button", { name: "Cartes", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".ms-tool")).toHaveCount(1);
  await page.locator(".ms-tool").click();
  await expect(page.locator(".ms-inspector")).toBeVisible();
  await page.getByRole("button", { name: "Retirer de mes outils", exact: true }).click();
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
  await expect(cta).toContainText("Dans mon stack");
  await cta.click();
  await expect(page).toHaveURL(/ma-stack\?outil=figma/);
  await expect(page.locator(".ms-inspector h3")).toHaveText("Figma");
  await page.getByRole("link", { name: "Voir la fiche complète", exact: true }).click();
  await expect(page).toHaveURL(/\/fr\/tool\/figma$/);
});

for (const lang of ["fr", "en"]) for (const width of [390, 820, 1440]) {
  test(`${lang} / ${width}px: territories, Map, keyboard and no overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key, state: seed() });
    await page.goto(`/${lang}/ma-stack`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".ms-tool")).toHaveCount(slugs.length);
    await expect(page.locator(".ms-card-grid")).not.toHaveCount(0);
    await expect(page.getByRole("button", { name: lang === "fr" ? "Cartes" : "Cards", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: lang === "fr" ? "Par usage" : "By use", exact: true }).click();
    await expect(page.locator(".ms-usage-explorer")).toBeVisible();
    await expect(page.locator(".ms-usage-bubble")).not.toHaveCount(0);
    await page.locator(".ms-usage-tree > li > button").filter({ hasText: lang === "fr" ? "Créer" : "Create" }).click();
    await page.locator(".ms-usage-tree-groups > li > button").filter({ hasText: lang === "fr" ? "Interfaces et prototypes" : "Interfaces & Prototyping" }).click();
    await expect(page.locator(".ms-usage-tree-tool").first()).toBeVisible();
    await expect(page.locator(".ms-usage-tree-tool").first()).toBeEnabled();
    await page.locator(".ms-usage-tree-tool").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".ms-inspector")).toBeVisible();
    await expect(page.locator(".ms-inspector h3")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator(".ms-inspector")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const screenshotDir = "/private/tmp/tooltrim-mon-stack-v2";
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.locator(".ms-header h1").click();
    await page.screenshot({ path: `${screenshotDir}/${lang}-${width}-map.png`, fullPage: true });
    await page.getByRole("button", { name: lang === "fr" ? "Cartes" : "Cards", exact: true }).click();
    await page.screenshot({ path: `${screenshotDir}/${lang}-${width}-stack.png`, fullPage: true });
    await page.getByRole("button", { name: lang === "fr" ? "Par usage" : "By use", exact: true }).click();
    // Clear the init script by opening a new page: only local mode survives.
    const next = await page.context().newPage();
    await next.goto(`/${lang}/ma-stack`, { waitUntil: "domcontentloaded" });
    await expect(next.getByRole("button", { name: lang === "fr" ? "Par usage" : "By use", exact: true })).toHaveAttribute("aria-pressed", "true");
    await next.close();
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
  let price = "12 €/mois";
  await page.route("**/*supabase.co/**", async (route) => {
    expect(["GET", "OPTIONS"]).toContain(route.request().method());
    if (route.request().url().includes("/rest/v1/tools?")) {
      await route.fulfill({ json: [{ id: "figma", slug: "figma", name: "Figma", category: "design-tools", pricing: { free: "", paid: price } }] });
    } else await route.abort();
  });
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key, state: seed(["figma"]) });
  await page.goto("/fr/ma-stack", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-tool")).toContainText("12 €/mois");
  price = "15 €/mois";
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-tool")).toContainText("15 €/mois");
  const stored = await page.evaluate((key) => localStorage.getItem(key), key);
  expect(stored).not.toMatch(/pricing|logo|description|15 €/);
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
  await expect(page.locator(".ms-inspector")).toContainText("Claude");
  await expect(page.locator(".ms-inspector")).not.toContainText("Figma");
  await page.locator(".ms-overlap-tool").filter({ hasText: "Claude" }).first().click();
  await expect(page.locator(".ms-inspector h3")).toHaveText("Claude");
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
  await page.getByRole("button", { name: "Par usage", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
