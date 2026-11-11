import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

for (const lang of ["fr", "en"] as const) for (const width of [390, 768, 1440]) {
  test(`inline public parity ${lang} ${width}: representative raw records survive generated hydration`, async ({ page, context }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 1000 });
    await context.route("**/*supabase.co/**", route => route.abort());
    await context.addInitScript(() => localStorage.setItem("tooltrim-analytics-consent", JSON.stringify({ version: 1, choice: "refused", decidedAt: Date.now(), expiresAt: Date.now() + 3600000 })));
    const raw = JSON.parse(readFileSync("src/data/tools_v4.json", "utf8"));
    const staticContext = await context.browser()!.newContext({ javaScriptEnabled: false, viewport: { width, height: 1000 } });
    const staticPage = await staticContext.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const slug of ["notion", "attio", "asana", "chronokura"]) {
      const record = raw.find((tool: { slug: string }) => tool.slug === slug);
      const route = `/${lang}/tool/${slug}/${lang === "fr" ? "prix" : "pricing"}`;
      await staticPage.goto(new URL(route, test.info().project.use.baseURL).href);
      const snapshot = async (target: typeof page) => ({
        name: await target.locator("h1").innerText(),
        description: await target.locator(".td-hero-desc").allTextContents(),
        plans: await target.locator(".td-plan-name, .td-plan-price").allTextContents(),
        title: await target.title(),
        meta: await target.locator('meta[name="description"]').getAttribute("content"),
      });
      const before = await snapshot(staticPage);
      const beforeGraphs = await staticPage.locator('script[type="application/ld+json"]').allTextContents();
      expect(before.name).toContain(record.name);
      await page.goto(route);
      await expect(page.locator(".td-tool-subnav")).toHaveClass(/td-reveal/);
      expect(await snapshot(page)).toEqual(before);
      const afterGraphs = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(afterGraphs).toEqual(expect.arrayContaining(beforeGraphs));
      // The existing client adds richer JSON-LD graphs alongside SSR graphs.
      // Compare their business price facts, not their optional descriptive keys.
      const offers = (graphs: string[]) => [...new Set(graphs.map(text => JSON.parse(text))
        .filter(graph => graph["@type"] === "SoftwareApplication")
        .map(graph => JSON.stringify(graph.offers ? {
          price: graph.offers.price, lowPrice: graph.offers.lowPrice,
          highPrice: graph.offers.highPrice, priceCurrency: graph.offers.priceCurrency,
          offerCount: graph.offers.offerCount,
        } : null)))];
      expect(offers(afterGraphs)).toEqual(offers(beforeGraphs));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator(".td-pricing").scrollIntoViewIfNeeded();
      await page.screenshot({ path: test.info().outputPath(`${slug}-${lang}-${width}-public-viewport.png`), animations: "disabled" });
    }
    await staticContext.close();
    expect(errors).toEqual([]);
  });
}

// Keep synthetic hydration journeys out of production analytics.
test.beforeEach(async ({ context }) => {
  await context.route(/https?:\/\/(?:[^/]+\.)?(?:google-analytics\.com|googletagmanager\.com|analytics\.google\.com|vercel-insights\.com|vercel-scripts\.com)\/|\/_vercel\/insights\//, route => route.abort());
});

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
          await context.addInitScript(() => localStorage.setItem("tooltrim-analytics-consent", JSON.stringify({
            version: 1, choice: "refused", decidedAt: Date.now(), expiresAt: Date.now() + 3600000,
          })));
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
          // Historical bootstrap removal must also preserve secondary tool tabs.
          const secondaryTabs = await page.locator(".td-tool-subnav a").evaluateAll(links =>
            links.map(link => link.getAttribute("href") || "").filter(href => /\/(alternatives|avis|reviews)$/.test(href)));
          for (const secondary of secondaryTabs) {
            await page.locator(`.td-tool-subnav a[href="${secondary}"]`).click();
            await expect(page).toHaveURL(new URL(secondary, test.info().project.use.baseURL).href);
            await expect(page.locator(`.td-tool-subnav a[href="${secondary}"]`)).toHaveAttribute("aria-current", "page");
            await expect(page.locator("h1")).toBeVisible();
          }
          expect(navigations).toEqual([]);
          if (savedStack) {
            await expect(page.locator(".td-hero-actions [data-pin-tool][aria-pressed="true"]")).toBeVisible();
            expect(await page.evaluate(() => localStorage.getItem("tooltrim-ma-stack-mvp-v3"))).toBe(savedState);
            await page.reload({ waitUntil: "load" });
            await expect(page.locator(".td-hero-actions [data-pin-tool][aria-pressed="true"]")).toBeVisible();
            expect(await page.evaluate(() => localStorage.getItem("tooltrim-ma-stack-mvp-v3"))).toBe(savedState);
          }
          expect(hydrationErrors).toEqual([]);
        });
      }
    }
  }
}

// Hold every application script: the visible HTML must not offer an inert add action.
test("prerendered stack add waits for scripts, then saves on the first click", async ({ page }) => {
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => { releaseScripts = resolve; });
  await page.route("**/assets/*.js", async (route) => {
    await scriptsReady;
    await route.continue();
  });
  await page.route("**/*supabase.co/**", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("tooltrim-analytics-consent", JSON.stringify({
    version: 1, choice: "refused", decidedAt: Date.now(), expiresAt: Date.now() + 3600000,
  })));
  try {
    await page.goto("/fr/tool/figma", { waitUntil: "commit" });
    const cta = page.locator(".td-hero-actions [data-pin-tool]");
    await expect(cta).toBeVisible();
    await expect(cta).toBeDisabled();
    releaseScripts();
    await expect(cta).toBeEnabled();
    await cta.click();
    await expect(cta).toContainText("Dans ma stack");
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("tooltrim-personal-stack-v4:anonymous") || "{}").selection?.pinnedToolSlugs)).toContain("figma");
    await cta.click();
    await expect(page.locator("[data-confirm]")).toBeVisible();
    await page.locator("[data-confirm]").getByRole("button", { name: "Garder" }).click();
    await expect(page.locator("[data-confirm]")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("tooltrim-personal-stack-v4:anonymous") || "{}").selection?.pinnedToolSlugs)).toContain("figma");
  } finally {
    releaseScripts();
  }
});

test("saved stack hydrates while the detail route chunk is slow", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && /hydrat|server HTML|Minified React error/.test(message.text())) errors.push(message.text());
  });
  await context.route("**/*supabase.co/**", route => route.abort());
  await page.route("**/assets/ToolDetailPage-*.js", async route => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.addInitScript(() => {
    localStorage.setItem("tooltrim-analytics-consent", JSON.stringify({ version: 1, choice: "refused", decidedAt: Date.now(), expiresAt: Date.now() + 3600000 }));
    localStorage.setItem("tooltrim-ma-stack-mvp-v3", JSON.stringify({ version: 3, needs: [], pinnedToolSlugs: ["viso-ai"], toolEntries: [{ toolSlug: "viso-ai", needIds: [], intent: "stack", assignmentMode: "pending", addedAt: "2026-10-05T00:00:00.000Z" }] }));
  });
  await page.goto("/en/tool/viso-ai", {waitUntil:"domcontentloaded"});
  await expect(page.locator(".td-hero-actions [data-pin-tool]")).toBeEnabled();
  expect(errors).toEqual([]);
});
