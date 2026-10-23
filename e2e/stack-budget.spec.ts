import { test, expect } from "@playwright/test";
import fs from "node:fs";

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


const slugs = ["substance-3d-painter", "ae-red-giant", "red-giant-shine", "adobe-creative-cloud", "claude", "gemini", "perplexity", "notebook-lm"];
for (const lang of ["fr", "en"]) for (const width of [390, 1440]) {
  test(`budget ${lang} ${width}px: every tool is accessible, including unpriced tools`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const origin = new URL(String(test.info().project.use.baseURL)).origin;
    await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.addInitScript((ids) => {
      localStorage.setItem("tooltrim-analytics-consent", "refused");
      localStorage.setItem("tooltrim-ma-stack-mvp-v3", JSON.stringify({ version: 3, needs: [], pinnedToolSlugs: ids,
        toolEntries: ids.map((toolSlug) => ({ toolSlug, needIds: [], intent: "stack", addedAt: "2026-10-13T00:00:00.000Z", assignmentMode: "pending" })) }));
    }, slugs);
    await page.goto(`/${lang}/ma-stack`, { waitUntil: "domcontentloaded" });
    const consent = page.getByRole("button", { name: lang === "fr" ? "Refuser" : "Refuse", exact: true });
    if (await consent.isVisible()) await consent.click();
    await expect(page.locator(".ms-tool")).toHaveCount(8);
    // Every card names its cost, including unpriced ones.
    const map = page.locator(".ms-inv");
    await expect(map.locator(".ms-inv-cost")).toHaveCount(8);
    // The same attested fallback as the tool page powers the free-tier
    // question and the monthly budget after declaring a payment.
    for (const name of ["Claude", "Perplexity"]) await expect(map.getByRole("button", { name: new RegExp(`^${name}, `) })).toContainText("Freemium");
    const deck = page.locator(".mf-now");
    const top = deck.locator("h3");
    await expect(top).toBeVisible();
    for (let i = 0; i < 8; i++) {
      const title = (await top.textContent()) || "";
      if (!(lang === "fr" ? /^Quelle formule/ : /^Which .* plan/).test(title)) break;
      const paid = /Claude|Perplexity/.test(title);
      await answerPlan(deck, paid, lang as "fr" | "en");
      await expect(top).not.toHaveText(title);
    }
    for (const name of ["Claude", "Perplexity"]) await expect(map.getByRole("button", { name: new RegExp(`^${name}, `) }).locator(".ms-inv-cost")).toHaveText(lang === "fr" ? "17 €/mois" : "$20/mo");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    fs.mkdirSync("/private/tmp/tooltrim-stack-budget", { recursive: true });
    await map.screenshot({ path: `/private/tmp/tooltrim-stack-budget/${lang}-${width}.png` });
    // An unpriced tool is hatched and opens its sheet to enter the price.
    const unknown = map.locator('.ms-inv-card:has(.ms-inv-cost[data-tone="unknown"])').first();
    await expect(unknown).toBeVisible();
    await unknown.click();
    await expect(page.locator(".ms-tool-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.reload({ waitUntil: "domcontentloaded" });
    for (const name of ["Claude", "Perplexity"]) await expect(map.getByRole("button", { name: new RegExp(`^${name}, `) }).locator(".ms-inv-cost")).toHaveText(lang === "fr" ? "17 €/mois" : "$20/mo");
  });
}
