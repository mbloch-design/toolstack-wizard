import { expect, test, type Page } from "playwright/test";

async function getActiveScrollTop(page: Page) {
  return page.evaluate(() => {
    const main = document.getElementById("main-content");
    return main
      && ["auto", "scroll"].includes(getComputedStyle(main).overflowY)
      && main.scrollHeight > main.clientHeight + 1
      ? main.scrollTop
      : window.scrollY;
  });
}

async function scrollActiveContainer(page: Page, top: number) {
  await page.evaluate((nextTop) => {
    const main = document.getElementById("main-content");
    if (main
      && ["auto", "scroll"].includes(getComputedStyle(main).overflowY)
      && main.scrollHeight > main.clientHeight + 1) main.scrollTo(0, nextTop);
    else window.scrollTo(0, nextTop);
  }, top);
  await page.waitForTimeout(150);
}

test.describe("Continuité de navigation", () => {
  test("une nouvelle fiche démarre en haut et le retour restaure le catalogue", async ({ page }) => {
    await page.goto("/fr/tools", { waitUntil: "networkidle" });
    const target = page.locator(".tce-primary-link").nth(14);
    await target.scrollIntoViewIfNeeded();
    const catalogPosition = await getActiveScrollTop(page);
    expect(catalogPosition).toBeGreaterThan(300);

    await target.click();
    await expect(page).toHaveURL(/\/fr\/tool\//);
    await expect.poll(() => getActiveScrollTop(page)).toBeLessThanOrEqual(2);

    await page.goBack({ waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/fr\/tools$/);
    await expect.poll(() => getActiveScrollTop(page)).toBeGreaterThan(300);
  });

  test("recharger une fiche profondément scrollée revient en haut", async ({ page }) => {
    await page.goto("/fr/tool/framer", { waitUntil: "networkidle" });
    await scrollActiveContainer(page, 10_000);
    expect(await getActiveScrollTop(page)).toBeGreaterThan(500);

    await page.reload({ waitUntil: "networkidle" });
    await expect.poll(() => getActiveScrollTop(page)).toBeLessThanOrEqual(2);
  });

  test("le reset fonctionne aussi avec le scroll document sur mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/fr/tools", { waitUntil: "networkidle" });
    const target = page.locator(".tce-primary-link").nth(10);
    await target.scrollIntoViewIfNeeded();
    expect(await getActiveScrollTop(page)).toBeGreaterThan(300);

    await target.click();
    await expect(page).toHaveURL(/\/fr\/tool\//);
    await expect.poll(() => getActiveScrollTop(page)).toBeLessThanOrEqual(2);
  });
});
