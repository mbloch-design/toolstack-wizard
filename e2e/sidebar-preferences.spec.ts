import { expect, test } from "@playwright/test";

// The shell (src/ds/Shell, 11/11/2026): the sidebar folds and remembers it; theme, currency and language live in
// the settings menu at the top right, each with its state written out.
test.describe("Sidebar preferences", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/fr/tools");
    await page.evaluate(() => {
      localStorage.removeItem("tooltrim:sidebar-expanded");
      localStorage.setItem("tooltrim:theme", "light");
    });
    await page.reload();
  });

  test("folds, persists and unfolds", async ({ page }) => {
    const sidebar = page.locator("[data-shell-sidebar]");
    await expect(sidebar).toHaveAttribute("data-expanded", "true");
    await page.getByRole("button", { name: "Réduire la barre latérale" }).click();
    await expect(sidebar).not.toHaveAttribute("data-expanded", "true");
    await page.reload();
    await expect(sidebar).not.toHaveAttribute("data-expanded", "true");
    await page.getByRole("button", { name: "Déployer la barre latérale" }).click();
    await expect(sidebar).toHaveAttribute("data-expanded", "true");
  });

  test("switches theme and keeps the current route when changing language", async ({ page }) => {
    const settings = page.locator("[data-shell-topbar]").getByRole("button", { name: "Réglages", exact: true });
    await settings.click();
    const menu = page.getByRole("dialog");
    await menu.getByRole("button", { name: "Sombre", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(menu.getByRole("button", { name: "Sombre", exact: true })).toHaveAttribute("aria-pressed", "true");
    await menu.getByRole("button", { name: "English", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/tools$/);
  });
});
