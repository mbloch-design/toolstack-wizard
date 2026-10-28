import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const fixturePath = path.resolve("e2e/fixtures/design-system-baseline.json");
const evidencePath = path.resolve(process.env.DESIGN_SYSTEM_EVIDENCE_DIR || "reports/design-system-baseline");
const record = process.env.DESIGN_SYSTEM_RECORD === "1";
const routes = [
  ["home", ""], ["tools", "/tools"], ["notion", "/tool/notion"],
  ["stacks", "/stacks"], ["guides", "/guides"],
  ["comparison", "/comparatif/notion-vs-airtable"], ["submit", "/submit"],
  ["ma-stack", "/ma-stack"],
] as const;

async function isolateAnonymousVisit(page: Page) {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) || /\/_vercel\/insights\//.test(url.pathname)) {
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("theme", "light");
    localStorage.setItem("tooltrim-analytics-consent", JSON.stringify({
      version: 1, choice: "refused", decidedAt: Date.now(), expiresAt: Date.now() + 86_400_000,
    }));
    localStorage.setItem("tooltrim-ma-stack-mvp-v2", JSON.stringify({
      version: 2,
      needs: [{ id: "ia", labelFr: "Travailler avec l'IA", labelEn: "Work with AI", order: 10, source: "suggested" }],
      toolEntries: [{ toolSlug: "chatgpt", needIds: ["ia"], addedAt: "2026-01-01T00:00:00.000Z", assignmentMode: "manual" }],
      pinnedToolSlugs: ["chatgpt"],
    }));
  });
}

async function measure(page: Page) {
  return page.evaluate(() => {
    const rendered = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
    };
    const content = Array.from(document.querySelectorAll('button,a,input,select,textarea'))
      .filter(el => rendered(el) && !el.closest('header,footer,nav,[role="dialog"],#cc-main'));
    const items: [string, Element | undefined | null][] = [
      ["body", document.body], ["heading", document.querySelector("h1")],
      ["navigation", Array.from(document.querySelectorAll('header button,header a,nav button,nav a')).find(rendered)],
      ...content.slice(0, 4).map((el, i): [string, Element] => [`control-${i}`, el]),
      ["field", Array.from(document.querySelectorAll('input:not([type="hidden"]),textarea,select')).find(rendered)],
    ];
    const round = (n: number) => Math.round(n * 100) / 100;
    return Object.fromEntries(items.filter(([, el]) => el).map(([key, el]) => {
      const s = getComputedStyle(el!);
      const r = el!.getBoundingClientRect();
      return [key, {
        tag: el!.tagName.toLowerCase(), className: el!.getAttribute('class') || '',
        text: (el!.getAttribute('aria-label') || (el instanceof HTMLInputElement ? el.placeholder : el!.textContent) || '').replace(/\s+/g, ' ').trim().slice(0, 100),
        geometry: { x: round(r.x), y: round(r.y), width: round(r.width), height: round(r.height) },
        style: Object.fromEntries([
          'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
          'color', 'backgroundColor', 'borderColor', 'borderWidth', 'borderRadius',
          'minHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
          'display', 'gap', 'boxShadow',
        ].map(property => [property, s[property as keyof CSSStyleDeclaration]])),
      }];
    }));
  });
}

for (const lang of ["fr", "en"] as const) for (const width of [390, 1440]) for (const [name, suffix] of routes) {
  test(`${lang} ${name} ${width}px preserves the built public reference`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await isolateAnonymousVisit(page);
    const response = await page.goto(`/${lang}${suffix}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    // Font readiness and two frames avoid recording a fallback font or a CSS swap.
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    expect(await page.locator('script[src*="/@vite/client"]').count()).toBe(0);
    const sheets = await page.evaluate(() => [...document.styleSheets].map(sheet => sheet.href).filter(Boolean));
    expect(sheets.some(href => /\/assets\/.*\.css/.test(href!))).toBe(true);
    const key = `${lang}-${name}-${width}`;
    const measurements = await measure(page);
    fs.mkdirSync(evidencePath, { recursive: true });
    await page.screenshot({ path: path.join(evidencePath, `${key}.png`), animations: "disabled" });
    fs.writeFileSync(path.join(evidencePath, `${key}.json`), JSON.stringify(measurements, null, 2) + '\n');
    await testInfo.attach("rendered measurements", { body: JSON.stringify(measurements, null, 2), contentType: "application/json" });
    if (record) {
      const baseline = fs.existsSync(fixturePath) ? JSON.parse(fs.readFileSync(fixturePath, "utf8")) : {};
      baseline[key] = measurements;
      fs.writeFileSync(fixturePath, JSON.stringify(baseline, null, 2) + '\n');
      return;
    }
    const baseline = JSON.parse(fs.readFileSync(fixturePath, "utf8"))[key];
    expect(baseline, `Missing reviewed baseline ${key}; record against the pre-migration build`).toBeTruthy();
    expect(Object.keys(measurements)).toEqual(Object.keys(baseline));
    for (const [sample, actual] of Object.entries(measurements)) {
      const expected = baseline[sample];
      expect(actual.tag, `${key} ${sample} semantics`).toBe(expected.tag);
      expect(actual.text, `${key} ${sample} content`).toBe(expected.text);
      expect(actual.style, `${key} ${sample} computed styles`).toEqual(expected.style);
      for (const dimension of ['x', 'y', 'width', 'height'] as const) {
        expect(Math.abs(actual.geometry[dimension] - expected.geometry[dimension]), `${key} ${sample} ${dimension}`).toBeLessThanOrEqual(1);
      }
    }
  });
}
