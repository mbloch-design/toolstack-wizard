import { expect, test } from "@playwright/test";

const stackKey = "tooltrim-ma-stack-mvp-v3";
function seed(slugs: string[]) {
  return { version: 3, needs: [], pinnedToolSlugs: slugs, toolEntries: slugs.map(toolSlug => ({ toolSlug, needIds: [], intent: "stack", addedAt: "2026-10-07T00:00:00.000Z", assignmentMode: "pending" })) };
}

test.beforeEach(async ({ page }) => {
  await page.route("**/*supabase.co/**", route => route.abort());
  await page.addInitScript(() => localStorage.setItem("tooltrim-analytics-consent", "refused"));
});

for (const lang of ["fr", "en"]) {
  test(`${lang}: an audio licence keeps its one-time cost throughout the comparison`, async ({ page }) => {
    await page.goto(`/${lang}/comparatif/ableton-live-vs-logic-pro`, { waitUntil: "domcontentloaded" });
    const ableton = page.locator(".cp-price-card").filter({ has: page.getByRole("heading", { name: "Ableton Live", exact: true }) });
    await expect(ableton.locator(".cp-price-amount")).toContainText("99");
    await expect(ableton).toContainText(lang === "fr" ? "achat unique" : "one-time");
    await expect(ableton).not.toContainText(/\/mois|\/mo\b|one_time/);
    await expect(page.locator(".cp-spec")).not.toContainText(/Plan gratuit possible|Free plan possible/);
    await expect(page.locator(".cp-vs-duel")).not.toContainText(/Gratuit|Free/);
    await page.locator("#doutes summary").first().click();
    await expect(page.locator("#doutes")).not.toContainText(/a un plan gratuit|has a free plan/);
  });

  test(`${lang}: an unknown stack cost is not free and a mixed total is partial`, async ({ page }) => {
    await page.addInitScript(({ key, state }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state)); }, { key: stackKey, state: seed(["adp-workforce"]) });
    await page.goto(`/${lang}/ma-stack`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".ms-hero-stats")).toContainText(lang === "fr" ? "Coût non renseigné" : "Cost unknown");
    await expect(page.locator(".ms-hero-stats")).not.toContainText(/Gratuit|Free|rien de payant|nothing paid/);
    await expect(page.locator("#ms-budget")).not.toContainText(/Rien de payant|Nothing paid/);
    await page.locator(".ms-tools-actions").getByRole("button", { name: lang === "fr" ? "Ajouter" : "Add", exact: true }).click();
    await page.getByRole("searchbox").fill("chatgpt");
    await page.getByRole("button", { name: lang === "fr" ? "Ajouter ChatGPT" : "Add ChatGPT", exact: true }).click();
    await page.evaluate(() => localStorage.setItem("tooltrim-ma-stack-paid-plans-v1", JSON.stringify(["chatgpt"])));
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".ms-hero-stats")).toContainText(lang === "fr" ? "Total partiel" : "Partial total");
    await expect(page.locator(".ms-tool")).toHaveCount(2);
  });
}

test("a recorded saving retains its currency across changes and reloads", async ({ page }) => {
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
    if (!localStorage.getItem("tooltrim:currency")) localStorage.setItem("tooltrim:currency", "EUR");
    localStorage.setItem("tooltrim-ma-stack-paid-plans-v1", JSON.stringify(["figma", "canva"]));
  }, { key: stackKey, state: seed(["figma", "canva"]) });
  await page.goto("/fr/ma-stack", { waitUntil: "domcontentloaded" });
  await page.locator(".ms-pair-decide").first().click();
  await page.getByRole("button", { name: /Garder Figma/ }).click();
  await expect(page.locator(".ms-decided-saved")).toContainText("9");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("tooltrim-ma-stack-decisions-v1") || "{}"));
  expect(stored["canva|figma"].savingCurrency).toBe("EUR");
  await page.evaluate(() => localStorage.setItem("tooltrim:currency", "USD"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-decided-saved")).toContainText("11");
  await page.goto("/fr/comparatif/figma-vs-canva", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-cd-status")).toContainText("11");
});

test("old savings without a currency keep the decision without inventing an amount", async ({ page }) => {
  await page.addInitScript(({ key, state }) => {
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem("tooltrim-ma-stack-decisions-v1", JSON.stringify({ "canva|figma": { kind: "keep-one", kept: "figma", removed: "canva", saving: 9.17, at: "2026-10-07T00:00:00.000Z" } }));
  }, { key: stackKey, state: seed(["figma"]) });
  await page.goto("/fr/ma-stack", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#ms-overlaps")).toContainText("devise inconnue");
  await expect(page.locator(".ms-decided-saved")).toHaveCount(0);
  await page.goto("/fr/comparatif/figma-vs-canva", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-cd-status")).toContainText("vous gardez Figma");
  await expect(page.locator(".ms-cd-status")).not.toContainText(/9|€/);
});

for (const lang of ["fr", "en"]) test(`${lang}: the Claude web comparison uses the web scope instead of an API description`, async ({ page }) => {
  await page.goto(`/${lang}/comparatif/chatgpt-vs-claude`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".cp-vs-pitch").nth(1)).not.toContainText(/API|Haiku|Fable/);
  await expect(page.locator(".cp-vs-pitch").nth(1)).toContainText(lang === "fr" ? /application/i : /app/i);
  await expect(page.locator(".cp-guide-scope")).toContainText(lang === "fr" ? "Applications" : "apps");
});


test("replacing a paid tool with an unknown price does not invent a saving", async ({ page }) => {
  await page.addInitScript(({ key, state }) => {
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem("tooltrim-ma-stack-paid-plans-v1", JSON.stringify(["chatgpt"]));
  }, { key: stackKey, state: seed(["chatgpt"]) });
  await page.goto("/fr/comparatif/chatgpt-vs-adp-workforce", { waitUntil: "domcontentloaded" });
  const replace = page.getByRole("button", { name: /Remplacer par ADP/ });
  await expect(replace).toContainText("Écart de coût inconnu");
  await expect(replace).not.toContainText("en moins");
  await replace.click();
  await expect(page.locator(".ms-cd-status")).not.toContainText("en moins");
});
