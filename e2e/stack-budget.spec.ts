import { test, expect } from "@playwright/test";
import fs from "node:fs";

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
    const budget = page.locator("#ms-budget");
    const toolsToggle = budget.getByRole("button", { name: lang === "fr" ? "Outils" : "Tools", exact: true });
    if (await toolsToggle.count()) await toolsToggle.click();
    await expect(budget.locator(".ms-budget-link")).toHaveCount(8);
    await expect(budget.locator(".ms-budget-status").first()).toBeVisible();
    // The same attested fallback as the tool page must power both the
    // free-tier question and the monthly budget after declaring a payment.
    for (const name of ["Claude", "Perplexity"]) {
      const row = budget.locator(".ms-budget-other-list li").filter({ has: page.getByRole("button", { name, exact: true }) });
      await expect(row).toContainText(lang === "fr" ? "Freemium compté gratuit" : "Freemium counted as free");
    }
    await budget.locator(".ms-inline-link").click();
    for (const name of ["Claude", "Perplexity"]) {
      const control = page.getByRole("switch", { name: `${lang === "fr" ? "Abonnement payant pour" : "Paid subscription for"} ${name}`, exact: true });
      await expect(control.locator("xpath=..")).toContainText(lang === "fr" ? "20 $" : "$20/mo");
      await control.click();
    }
    await page.locator(".ms-sheet-done").click();
    for (const name of ["Claude", "Perplexity"]) {
      const row = budget.locator(".sg-budget-viz li").filter({ has: page.getByRole("button", { name, exact: true }) });
      await expect(row.locator(".sg-budget-value")).toHaveText(lang === "fr" ? "≈ 17 €" : "≈ $20");
    }
    await budget.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    fs.mkdirSync("/private/tmp/tooltrim-stack-budget", { recursive: true });
    await budget.screenshot({ path: `/private/tmp/tooltrim-stack-budget/${lang}-${width}.png` });
    const unknown = budget.locator(".ms-budget-other-list li").filter({ hasText: lang === "fr" ? "Coût non renseigné" : "Cost unknown" }).first();
    await expect(unknown).toBeVisible();
    await unknown.getByRole("button").click();
    await expect(page.locator(".ms-tool-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(budget.locator(".ms-budget-other-list li")).not.toHaveCount(0);
    for (const name of ["Claude", "Perplexity"]) {
      await expect(budget.locator(".sg-budget-viz li").filter({ has: page.getByRole("button", { name, exact: true }) })).toBeVisible();
    }
  });
}
