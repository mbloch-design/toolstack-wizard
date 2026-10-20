import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures/accounts";

// The unified test-only Auth/API server is supplied by Task 8. Never target a remote service.
const fixtureBase = process.env.PLAYWRIGHT_BASE_URL;
test.skip(!fixtureBase, "Supply the isolated simulated account fixture via PLAYWRIGHT_BASE_URL.");
if (fixtureBase && !["127.0.0.1", "localhost"].includes(new URL(fixtureBase).hostname)) throw new Error("Account lifecycle tests require a loopback fixture.");

async function login(page: Page, lang: "fr" | "en", email: string) {
  await page.getByRole("button", { name: lang === "fr" ? "Enregistrer ma stack" : "Save my stack", exact: true }).click();
  await page.getByLabel(lang === "fr" ? "Adresse e-mail" : "Email address", { exact: true }).fill(email);
  await page.getByRole("button", { name: lang === "fr" ? "Recevoir un code" : "Send me a code", exact: true }).click();
  await page.getByLabel(lang === "fr" ? "Code reçu par e-mail" : "Email code", { exact: true }).fill("123456");
  await page.getByRole("button", { name: lang === "fr" ? "Vérifier le code" : "Verify code", exact: true }).click();
  await expect(page.getByRole("heading", { name: email, exact: true })).toBeVisible();
  await expect(page.locator(".ms-account-summary [role=status]")).toHaveText(lang === "fr" ? "Enregistré" : "Saved");
}

for (const lang of ["fr", "en"] as const) test(`account deletion ${lang}: explicit confirmation, failure retry and fresh recreation`, async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("tooltrim-analytics-consent", "refused");
    if (sessionStorage.getItem("lifecycle-seeded")) return;
    sessionStorage.setItem("lifecycle-seeded", "1");
    localStorage.setItem("tooltrim-ma-stack-mvp-v3", JSON.stringify({ version: 3, needs: [], pinnedToolSlugs: ["notion"], toolEntries: [{ toolSlug: "notion", needIds: [], intent: "stack", assignmentMode: "pending", addedAt: "2026-10-19T12:00:00Z" }] }));
    localStorage.setItem("tooltrim-ma-stack-paid-plans-v1", '["notion"]');
    localStorage.setItem("tooltrim-ma-stack-plan-choices-v1", JSON.stringify({ notion: { source: "custom", amount: 17, currency: "USD", period: "monthly" } }));
  });
  await page.goto(`${fixtureBase}/${lang}/ma-stack`, { waitUntil: "domcontentloaded" });
  const email = `lifecycle-${lang}-${Date.now()}@example.invalid`;
  await login(page, lang, email);
  let deleteCalls = 0;
  await page.route("**/api/stack-account", async route => {
    if (route.request().method() !== "DELETE") return route.continue();
    deleteCalls++;
    if (deleteCalls === 1) return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "ACCOUNT_DELETION_FAILED" } }) });
    return route.continue();
  });
  const trigger = page.getByRole("button", { name: lang === "fr" ? "Supprimer mon compte" : "Delete my account", exact: true });
  const confirm = page.getByRole("button", { name: lang === "fr" ? "Supprimer définitivement mon compte" : "Permanently delete my account", exact: true });
  await trigger.click(); await expect(confirm).toBeFocused(); expect(deleteCalls).toBe(0);
  await page.getByRole("button", { name: lang === "fr" ? "Conserver mon compte" : "Keep my account", exact: true }).click();
  await expect(trigger).toBeFocused(); expect(deleteCalls).toBe(0);
  await trigger.click(); await confirm.click();
  await expect(page.locator(".ms-account [role=alert]")).toContainText(lang === "fr" ? "La suppression n’a pas abouti" : "Deletion did not complete");
  await confirm.click();
  await expect(page.getByText(lang === "fr" ? "Votre compte a été supprimé." : "Your account was deleted.", { exact: true })).toBeVisible();
  expect(deleteCalls).toBe(2);
  expect(await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith("tooltrim-personal-stack-v4:account:"));
    return keys.every(key => {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return !key.endsWith(":backup") && !key.endsWith(":sync") && value?.selection?.pinnedToolSlugs?.length === 0 && Object.keys(value?.billing?.choices || {}).length === 0 && Object.keys(value?.decisions || {}).length === 0;
    }) && localStorage.getItem("tooltrim-ma-stack-mvp-v3") === null && localStorage.getItem("tooltrim-ma-stack-plan-choices-v1") === null;
  })).toBe(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await login(page, lang, email);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /^tooltrim-personal-stack-v4:account:[^:]+$/.test(key)).every(key => JSON.parse(localStorage.getItem(key)!).selection.pinnedToolSlugs.length === 0))).toBe(true);
  expect(errors).toEqual([]);
});
