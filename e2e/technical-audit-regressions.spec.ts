import { expect, test } from "@playwright/test";

/** Answers the plan question on top: a plan card when the catalogue has plans, else the yes/no buttons. */
async function answerPlan(deck: import("@playwright/test").Locator, paid: boolean, lang: "fr" | "en" = "fr") {
  // On a phone the decision card is a summary: open it first.
  const expand = deck.locator(".mf-expand[aria-expanded='false']");
  if (await expand.isVisible().catch(() => false)) await expand.click();
  const cards = deck.locator(".mf-plan");
  // Catalogue plans load after the deck: give them a moment before falling back to the yes/no buttons.
  if (await cards.first().waitFor({ timeout: 4000 }).then(() => true, () => false)) {
    if (paid) {
      await cards.filter({ hasNotText: lang === "fr" ? "Version gratuite" : "Free plan" }).first().click();
      // A per-user plan asks for the number of people first.
      const confirm = deck.locator(".mf-seats").getByRole("button", { name: lang === "fr" ? "Valider" : "Confirm" });
      if (await confirm.isVisible().catch(() => false)) await confirm.click();
    }
    else await cards.filter({ hasText: lang === "fr" ? "Version gratuite" : "Free plan" }).first().click();
    return;
  }
  await deck.getByRole("button", { name: paid ? (lang === "fr" ? "Oui, payant" : "Yes, paid") : (lang === "fr" ? "Non, version gratuite" : "No, free version"), exact: true }).click();
}


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
  // Answering the deck in one tab moves the deck in the other.
  await answerPlan(page.locator(".mf-now"), true);
  await expect(other.locator(".mf-now h3")).toHaveText("Quelle formule de Canva avez-vous\u00a0?");
  await answerPlan(other.locator(".mf-now"), true);
  await expect(page.locator(".mf-now h3")).not.toHaveText(/Quelle formule/);
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
  await expect(page.locator(".mf")).toContainText("gardée volontairement");
  await expect(page.locator(".tt-toolcard")).toHaveCount(2);
});
