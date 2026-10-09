import { expect, test } from "@playwright/test";

for (const lang of ["fr", "en"]) for (const family of ["diagnostic", "selector"]) for (const suffix of ["", "/step", "/step/details"]) {
  test(`${lang}/${family}${suffix} redirects to Ma Stack without adding a history entry`, async ({ page, context }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await context.route("**/*supabase.co/**", route => route.abort());
    await context.route("**/_vercel/insights/**", route => route.fulfill({ contentType: "application/javascript", body: "" }));
    await context.addInitScript(() => localStorage.setItem("tooltrim-analytics-consent", "refused"));
    await page.goto(`/${lang}/tools`, { waitUntil: "load" });
    await expect(page.locator("h1")).toBeVisible();
    await page.goto(`/${lang}/${family}${suffix}`, { waitUntil: "load" });
    await expect(page).toHaveURL(new RegExp(`/${lang}/ma-stack$`));
    await expect(page.locator(".ms-search input")).toBeVisible();
    await page.goBack({ waitUntil: "load" });
    await expect(page).toHaveURL(new RegExp(`/${lang}/tools$`));
    expect(errors).toEqual([]);
  });
}
