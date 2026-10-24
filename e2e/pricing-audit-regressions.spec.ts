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
    await expect(page.locator(".mf-price")).toContainText(lang === "fr" ? "Coût non renseigné" : "Cost unknown");
    await expect(page.locator(".mf-price")).not.toContainText(/Gratuit|Free|rien de payant|nothing paid/i);
    await page.locator(".ms-tools-actions").getByRole("button", { name: lang === "fr" ? "Ajouter un outil" : "Add a tool", exact: true }).click();
    await page.getByRole("searchbox").fill("chatgpt");
    await page.getByRole("button", { name: lang === "fr" ? "Ajouter ChatGPT" : "Add ChatGPT", exact: true }).click();
    await expect(page.locator(".ms-tool")).toHaveCount(2);
    await page.evaluate(() => {
      const key = "tooltrim-personal-stack-v4:anonymous";
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      state.billing.paid = ["chatgpt"];
      localStorage.setItem(key, JSON.stringify(state));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".mf-price")).toContainText(lang === "fr" ? "Estimation partielle" : "Partial estimate");
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
  // Both freemium plans are confirmed paid, then the pair comes up in the deck.
  const deck = page.locator(".mf-now");
  const top = deck.locator("h3");
  await expect(top).toBeVisible();
  for (let i = 0; i < 2; i++) {
    const title = (await top.textContent()) || "";
    if (!title.startsWith("Quelle formule")) break;
    await answerPlan(deck, true);
    await expect(top).not.toHaveText(title);
  }
  await deck.getByRole("button", { name: /^Garder Figma/ }).click();
  // The saving is said once, in the budget card.
  await expect(page.locator(".mf")).toContainText(/économisez déjà 9\s€ par mois/);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("tooltrim-personal-stack-v4:anonymous") || "{}").decisions);
  expect(stored["canva|figma"].savingCurrency).toBe("EUR");
  await page.evaluate(() => localStorage.setItem("tooltrim:currency", "USD"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".mf")).toContainText(/économisez déjà 11\s\$(US)? par mois/);
  await page.goto("/fr/comparatif/figma-vs-canva", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ms-cd-status")).toContainText("11");
});

test("old savings without a currency keep the decision without inventing an amount", async ({ page }) => {
  await page.addInitScript(({ key, state }) => {
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem("tooltrim-ma-stack-decisions-v1", JSON.stringify({ "canva|figma": { kind: "keep-one", kept: "figma", removed: "canva", saving: 9.17, at: "2026-10-07T00:00:00.000Z" } }));
  }, { key: stackKey, state: seed(["figma"]) });
  await page.goto("/fr/ma-stack", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".mf")).toContainText("devise inconnue");
  await expect(page.locator(".mf")).not.toContainText("économisez");
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
