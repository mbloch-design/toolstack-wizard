import { expect, test } from "@playwright/test";

test.describe("Sidebar preferences", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fr/tools");
    await page.evaluate(() => {
      localStorage.removeItem("tooltrim:sidebar-expanded");
      localStorage.setItem("tooltrim:theme", "light");
    });
    await page.reload();
  });

  test("expands, persists and exposes the utility area", async ({ page }) => {
    const sidebar = page.locator(".asv2-sidebar");
    const toggle = page.getByRole("button", { name: "Déployer la barre latérale" });

    await expect(sidebar).toHaveAttribute("data-expanded", "false");
    await toggle.click();
    await expect(sidebar).toHaveAttribute("data-expanded", "true");
    await expect(page.getByText("Préférences")).toBeVisible();
    await expect(page.getByText("Mode sombre")).toBeVisible();

    await page.reload();
    await expect(sidebar).toHaveAttribute("data-expanded", "true");
  });

  test("switches theme and keeps the current route when changing language", async ({ page }) => {
    await page.getByRole("button", { name: "Passer en mode sombre" }).click();

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Passer en mode clair" })).toHaveAttribute("aria-pressed", "true");

    const languageLink = page.getByRole("link", { name: "Passer le site en anglais" });
    await expect(languageLink).toHaveAttribute("href", "/en/tools");
  });
});
