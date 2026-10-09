import { expect, test } from "@playwright/test";

const stackKey = "tooltrim-ma-stack-mvp-v3";
const paidKey = "tooltrim-ma-stack-paid-plans-v1";
const decisionsKey = "tooltrim-ma-stack-decisions-v1";
const seed = (slugs: string[]) => ({ version: 3, needs: [], pinnedToolSlugs: slugs, toolEntries: slugs.map(toolSlug => ({ toolSlug, needIds: [], intent: "stack", assignmentMode: "pending", addedAt: "2026-10-07T00:00:00Z" })) });

test.beforeEach(async ({ context }) => {
  await context.route("**/*supabase.co/**", route => route.abort());
  await context.addInitScript(() => localStorage.setItem("tooltrim-analytics-consent", "refused"));
});

for (const lang of ["fr", "en"]) {
  test(`${lang}: a missing stack finishes loading and returns to the stack catalogue`, async ({ page }) => {
    await page.goto(`/${lang}/stacks/does-not-exist-audit`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/${lang}/stacks$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test(`${lang}: a host without remote data has a visible fallback`, async ({ page }) => {
    await page.goto(`/${lang}/plugins/after-effects`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${lang}/(?:tool/after-effects|tools)$`));
  });
}

test("paid choices propagate between browser tabs without losing earlier choices", async ({ context, page }) => {
  await context.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key: stackKey, state: seed(["figma", "canva"]) });
  await page.goto("/fr/ma-stack", { waitUntil: "domcontentloaded" });
  const other = await context.newPage();
  await other.goto("/fr/ma-stack", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Indiquer lesquels", exact: true }).click();
  await other.getByRole("button", { name: "Indiquer lesquels", exact: true }).click();
  await page.getByRole("switch", { name: "Abonnement payant pour Figma", exact: true }).click();
  await expect(other.getByRole("switch", { name: "Abonnement payant pour Figma", exact: true })).toHaveAttribute("aria-checked", "true");
  await other.getByRole("switch", { name: "Abonnement payant pour Canva", exact: true }).click();
  await expect(page.getByRole("switch", { name: "Abonnement payant pour Canva", exact: true })).toHaveAttribute("aria-checked", "true");
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key) || "[]"), paidKey)).toEqual(expect.arrayContaining(["figma", "canva"]));
  await other.close();
});

test("corrupt decisions do not hide valid decisions or crash my stack", async ({ page }) => {
  await page.addInitScript(({ key, state, decisionKey }) => {
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem(decisionKey, JSON.stringify({ bad: null, "canva|figma": { kind: "keep-both", kept: "figma", saving: 0, at: "2026-10-07T00:00:00Z" } }));
  }, { key: stackKey, state: seed(["figma", "canva"]), decisionKey: decisionsKey });
  await page.goto("/fr/ma-stack", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Mes outils", exact: true })).toBeVisible();
  await expect(page.locator("#ms-overlaps")).toContainText("gardée volontairement");
  await expect(page.locator(".ms-tool")).toHaveCount(2);
});
