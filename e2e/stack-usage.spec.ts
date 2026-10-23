import { test, expect } from "@playwright/test";

// The optimisation answers live in the personal stack (they follow the account).
const slugs = ["workable", "sysaid", "hotjar"];
test("a usage answer is saved in the personal stack and survives a reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((ids) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem("tooltrim-analytics-consent", "refused");
    localStorage.setItem("tooltrim-ma-stack-mvp-v3", JSON.stringify({ version: 3, needs: [], pinnedToolSlugs: ids,
      toolEntries: ids.map((toolSlug) => ({ toolSlug, needIds: [], intent: "stack", addedAt: "2026-10-13T00:00:00.000Z", assignmentMode: "pending" })) }));
  }, slugs);
  await page.goto("/fr/ma-stack", { waitUntil: "domcontentloaded" });
  const fit = page.locator(".mf-fit");
  await expect(fit.locator(".mf-fit-bars button")).toHaveCount(5);
  const tool = (await fit.locator(".mf-fit-name").first().textContent())?.trim().split(/\s/)[0] || "";
  await fit.getByRole("radio", { name: "Sieste" }).click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("tooltrim-personal-stack-v4:anonymous") || "{}").usage);
  expect(Object.values(stored)).toEqual([1]);
  expect(await page.evaluate(() => localStorage.getItem("tooltrim-ma-stack-usage-v1"))).toBeNull();
  await page.reload({ waitUntil: "domcontentloaded" });
  // The next tool is asked; the first one keeps its answer.
  await expect(fit.locator(".mf-fit-name").first()).not.toContainText(tool);
  expect(Object.values(await page.evaluate(() => JSON.parse(localStorage.getItem("tooltrim-personal-stack-v4:anonymous") || "{}").usage))).toEqual([1]);
});
