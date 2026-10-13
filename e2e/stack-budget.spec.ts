import { test, expect } from "@playwright/test";
import fs from "node:fs";

const slugs = ["substance-3d-painter", "ae-red-giant", "red-giant-shine", "adobe-creative-cloud", "claude", "gemini", "perplexity", "notebook-lm"];
for (const lang of ["fr", "en"]) for (const width of [390, 1440]) {
  test(`budget ${lang} ${width}px: every tool is accessible, including unpriced tools`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/*supabase.co/**", (route) => route.abort());
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
  });
}
