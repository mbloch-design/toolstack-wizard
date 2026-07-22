import { expect, test } from "playwright/test";

test.describe("Carrousels éditoriaux", () => {
  test("partagent les mêmes contrôles et changent de page", async ({ page }) => {
    await page.goto("/fr", { waitUntil: "networkidle" });

    const section = page.locator(".v2-section-head").first();
    const controls = section.locator(".tt-carousel-controls");
    const previous = controls.getByRole("button", { name: "Page précédente" });
    const next = controls.getByRole("button", { name: "Page suivante" });

    await expect(controls).toBeVisible();
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();
    await expect(next).toHaveCSS("width", "36px");
    await expect(next).toHaveCSS("height", "36px");

    const pagination = page.locator(".tt-carousel-pagination").first();
    await expect(pagination.locator("button").first()).toHaveAttribute("aria-current", "true");
    await next.click();
    await expect(previous).toBeEnabled();
    await expect(pagination.locator("button").nth(1)).toHaveAttribute("aria-current", "true");
  });

  test("le rail principal accepte un balayage tactile", async ({ page }) => {
    await page.goto("/fr", { waitUntil: "networkidle" });

    const rail = page.locator(".tc-grid").first();
    const pagination = page.locator(".tt-carousel-pagination").first();
    await rail.dispatchEvent("touchstart", {
      touches: [{ identifier: 1, clientX: 260, clientY: 300 }],
    });
    await rail.dispatchEvent("touchend", {
      changedTouches: [{ identifier: 1, clientX: 150, clientY: 300 }],
    });

    await expect(pagination.locator("button").nth(1)).toHaveAttribute("aria-current", "true");
  });
});
