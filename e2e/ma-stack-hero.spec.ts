import { test, expect } from "@playwright/test";

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

const key = "tooltrim-ma-stack-mvp-v3";
const slugs = ["chatgpt", "claude", "notion", "figma", "canva", "slack", "zapier", "make", "stripe", "pennylane"];
const seed = { version: 3, needs: [], pinnedToolSlugs: slugs, toolEntries: slugs.map((toolSlug) => ({ toolSlug, needIds: [], intent: "stack", addedAt: "2026-10-21T00:00:00.000Z", assignmentMode: "pending" })) };

test.beforeEach(async ({ page }) => {
  await page.route("**/*supabase.co/**", (route) => route.abort());
  await page.route(/google-analytics\.com|googletagmanager\.com|vercel-insights\.com|vercel-scripts\.com|_vercel\/insights/, (route) => route.abort());
  await page.addInitScript(([k, s]) => {
    localStorage.setItem(k, s);
    localStorage.setItem("tooltrim-analytics-consent", JSON.stringify({ version: 1, choice: "refused", decidedAt: Date.now(), expiresAt: Date.now() + 3600000 }));
  }, [key, JSON.stringify(seed)] as const);
});

for (const lang of ["fr", "en"] as const) for (const width of [390, 1440]) {
  test(`stack workspace ${lang} ${width}px`, async ({ page }) => {
    const fr = lang === "fr";
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${lang}/ma-stack`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: fr ? "Mes outils" : "My tools" })).toBeVisible();
    // Read first: what the stack costs, then the one decision of the moment.
    await expect(page.locator('[data-card="price"]')).toContainText(fr ? "Budget partiel renseigné" : "Known budget so far");
    const map = page.getByRole("group", { name: fr ? "Mes outils" : "My tools", exact: true });
    await expect(map.locator(".tt-toolcard")).toHaveCount(10);
    await expect(page.locator(".tt-toolcard")).toHaveCount(10);
    // Every card says what the tool costs and its status.
    await expect(map.locator(".tt-toolcard .tt-amount")).toHaveCount(10);
    await expect(map.locator(".tt-toolcard .tt-tag")).toHaveCount(10);
    // The map opens the tool sheet.
    await map.getByRole("button").first().click();
    await expect(page.locator(".ms-tool-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".ms-tool-sheet")).toHaveCount(0);
    // One decision at a time: answering moves the deck and the ring.
    const deck = page.getByRole("region", { name: fr ? "Prochaine décision" : "Next decision" });
    await expect(deck.getByRole("heading", { level: 3 })).toHaveCount(1);
    const first = await deck.getByRole("heading", { level: 3 }).textContent();
    await answerPlan(deck, false, lang);
    await expect(deck.getByRole("heading", { level: 3 })).not.toHaveText(first || "");
    await deck.getByRole("button", { name: fr ? /^Aucun n’est payant/ : /^None is paid/ }).click();
    await expect(deck.getByRole("heading", { level: 3 })).toHaveText(fr
      ? "ChatGPT et Claude font le même travail."
      : "ChatGPT and Claude do the same job.");
    // The pair decision still offers both individual tools and keeping both.
    await expect(deck.locator(".mf-choice--keep")).toHaveCount(2);
    await expect(deck.locator(".mf-choice--both")).toBeVisible();
    // The same stack as cards, then as a list.
    await page.locator(".ms-layout").getByRole("button", { name: fr ? "Liste" : "List", exact: true }).click();
    await expect(page.locator('#ms-all-grid[data-layout="list"] .tt-toolcard')).toHaveCount(10);
    await page.locator(".ms-layout").getByRole("button", { name: fr ? "Grille" : "Grid", exact: true }).click();
    await expect(page.locator('#ms-all-grid[data-layout="grid"] .tt-toolcard')).toHaveCount(10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
}
