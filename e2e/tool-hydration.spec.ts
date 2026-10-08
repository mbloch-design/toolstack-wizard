import { expect, test } from "@playwright/test";

// This regression requires generated HTML, not Vite's development SPA shell.
// Dropping canonical FR fields from the EN bootstrap must trigger this test.
for (const slug of ["notion", "1001bit-tools", "17hats", "8fig", "adobe-acrobat-sign", "condeco", "viso-ai"]) {
  for (const lang of ["fr", "en"]) {
    for (const suffix of ["", lang === "fr" ? "/prix" : "/pricing"]) {
      test(`${lang}/${slug}${suffix}: prerender hydrates without replacing its content`, async ({ page, context }) => {
        const hydrationErrors: string[] = [];
        page.on("pageerror", error => hydrationErrors.push(error.message));
        page.on("console", message => {
          if (message.type() === "error" && /hydrat|server HTML|Minified React error/.test(message.text())) {
            hydrationErrors.push(message.text());
          }
        });
        await context.route("**/*supabase.co/**", route => route.abort());
        await context.route("**/_vercel/insights/**", route => route.fulfill({ contentType: "application/javascript", body: "" }));
        await context.addInitScript(() => localStorage.setItem("tooltrim-analytics-consent", "refused"));
        const route = `/${lang}/tool/${slug}${suffix}`;
        const staticContext = await context.browser()!.newContext({ javaScriptEnabled: false });
        const staticPage = await staticContext.newPage();
        await staticPage.goto(new URL(route, test.info().project.use.baseURL).href);
        await expect(staticPage.locator("#__SSR_TOOL__")).toHaveCount(1);
        const heading = await staticPage.locator("h1").innerText();
        const subtitle = await staticPage.locator(".td-hero-desc").allTextContents();
        await staticContext.close();
        await page.goto(route, { waitUntil: "load" });
        await expect(page.locator("h1")).toHaveText(heading, { useInnerText: true });
        expect(await page.locator(".td-hero-desc").allTextContents()).toEqual(subtitle);
        // A different active tab without a document request proves React handled it.
        const target = suffix ? `/${lang}/tool/${slug}` : `/${lang}/tool/${slug}/${lang === "fr" ? "prix" : "pricing"}`;
        const navigations: string[] = [];
        page.on("request", request => {
          if (request.isNavigationRequest() && request.frame() === page.mainFrame()) navigations.push(request.url());
        });
        await page.locator(`.td-tool-subnav a[href="${target}"]`).click();
        await expect(page).toHaveURL(new URL(target, test.info().project.use.baseURL).href);
        await expect(page.locator(`.td-tool-subnav a[href="${target}"]`)).toHaveAttribute("aria-current", "page");
        await expect(page.locator("h1")).toBeVisible();
        expect(navigations).toEqual([]);
        expect(hydrationErrors).toEqual([]);
      });
    }
  }
}
