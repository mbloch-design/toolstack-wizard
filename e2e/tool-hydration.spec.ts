import { expect, test } from "@playwright/test";

// This regression requires generated HTML, not Vite's development SPA shell.
// Dropping canonical FR fields from the EN bootstrap must trigger this test.
for (const slug of ["notion", "1001bit-tools", "17hats", "8fig", "adobe-acrobat-sign", "condeco", "viso-ai"]) {
  for (const lang of ["fr", "en"]) {
    for (const suffix of ["", lang === "fr" ? "/prix" : "/pricing"]) {
      for (const savedStack of [false, true]) {
        test(`${lang}/${slug}${suffix}/${savedStack ? "saved-stack" : "empty-stack"}: prerender hydrates without replacing its content`, async ({ page, context }) => {
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
          const savedState = JSON.stringify({
            version: 3,
            needs: [{ id: "custom-client", labelFr: "Projet client", labelEn: "Client project", order: 10, source: "custom" }],
            pinnedToolSlugs: [...new Set([slug, "figma"])],
            toolEntries: [...new Set([slug, "figma"])].map(toolSlug => ({
              toolSlug, needIds: ["custom-client"], intent: toolSlug === slug ? "stack" : "wishlist",
              assignmentMode: "manual", addedAt: "2026-10-08T00:00:00.000Z",
            })),
          });
          if (savedStack) await context.addInitScript(value => {
            if (!localStorage.getItem("tooltrim-ma-stack-mvp-v3")) localStorage.setItem("tooltrim-ma-stack-mvp-v3", value);
          }, savedState);
          const route = `/${lang}/tool/${slug}${suffix}`;
          const staticContext = await context.browser()!.newContext({ javaScriptEnabled: false });
          const staticPage = await staticContext.newPage();
          await staticPage.goto(new URL(route, test.info().project.use.baseURL).href);
          await expect(staticPage.locator("#__SSR_TOOL__")).toHaveCount(1);
          const heading = await staticPage.locator("h1").innerText();
          const subtitle = await staticPage.locator(".td-hero-desc").allTextContents();
          await staticContext.close();
          await page.goto(route, { waitUntil: "load" });
          // The reveal class is installed by ToolDetailPage after mount, absent in
          // SSR. Wait for that effect before exercising React navigation.
          await expect(page.locator(".td-tool-subnav")).toHaveClass(/td-reveal/);
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
          if (savedStack) {
            await expect(page.locator(".td-hero-actions .pin-tool-button--active")).toBeVisible();
            expect(await page.evaluate(() => localStorage.getItem("tooltrim-ma-stack-mvp-v3"))).toBe(savedState);
            await page.reload({ waitUntil: "load" });
            await expect(page.locator(".td-hero-actions .pin-tool-button--active")).toBeVisible();
            expect(await page.evaluate(() => localStorage.getItem("tooltrim-ma-stack-mvp-v3"))).toBe(savedState);
          }
          expect(hydrationErrors).toEqual([]);
        });
      }
    }
  }
}
