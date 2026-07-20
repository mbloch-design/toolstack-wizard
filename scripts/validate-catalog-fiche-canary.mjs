#!/usr/bin/env node
import process from "node:process";
import { chromium } from "playwright";

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173").replace(/\/$/, "");

const CANARY = [
  { slug: "wix", id: "wix", name: "Wix" },
  { slug: "balsamiq", id: "balsamiq", name: "Balsamiq" },
  { slug: "kit", id: "convertkit", name: "Kit" },
  { slug: "aircall", id: "aircall-inc", name: "Aircall" },
  { slug: "figma", id: "figma", name: "Figma" },
  { slug: "framer", id: "framer", name: "Framer" },
  { slug: "adcreative", id: "adcreative", name: "AdCreative.ai" },
  { slug: "gamma", id: "gamma", name: "Gamma" },
  { slug: "unbounce", id: "unbounce", name: "Unbounce" },
  { slug: "notion", id: "notion", name: "Notion" },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspectSsrPage(page, tool, lang) {
  const url = `${BASE_URL}/${lang}/tool/${tool.slug}`;
  const pageErrors = [];
  const consoleErrors = [];
  const failedResponses = [];
  const onPageError = (error) => pageErrors.push(error.message);
  const onConsole = (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  const onResponse = (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  };
  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  page.on("response", onResponse);

  try {
    // Vite preview serves directory prerenders on the trailing-slash URL.
    // Production clean-URL routing maps the canonical URL to this same file.
    const rawResponse = await fetch(`${url}/`);
    assert(rawResponse.ok, `${url} répond HTTP ${rawResponse.status}`);
    const responseHtml = await rawResponse.text();
    const ssrMatch = responseHtml.match(/<script id="__SSR_TOOL__" type="application\/json">([\s\S]*?)<\/script>/);
    const ssrTool = ssrMatch ? JSON.parse(ssrMatch[1]) : null;
    const response = await page.goto(`${url}/`, { waitUntil: "networkidle" });
    assert(response?.ok(), `${url} répond HTTP ${response?.status() ?? "inconnu"}`);
    await page.locator("h1").first().waitFor({ state: "visible" });

    const result = await page.evaluate(() => {
      const overlay = document.querySelector("vite-error-overlay, .vite-error-overlay, #webpack-dev-server-client-overlay");
      return {
        htmlLang: document.documentElement.lang,
        h1: document.querySelector("h1")?.textContent?.trim() || "",
        bodyLength: document.body.innerText.trim().length,
        hasOverlay: Boolean(overlay),
      };
    });

    assert(result.htmlLang === lang, `${url} a lang=${result.htmlLang}`);
    assert(result.h1.includes(tool.name), `${url} H1 inattendu : ${result.h1}`);
    assert(result.bodyLength > 900, `${url} contenu trop court (${result.bodyLength} caractères)`);
    assert(!result.hasOverlay, `${url} affiche un overlay d'erreur`);
    assert(ssrTool, `${url} ne contient pas __SSR_TOOL__`);
    assert(ssrTool.id === tool.id, `${url} id SSR=${ssrTool.id}, attendu ${tool.id}`);
    assert(ssrTool.slug === tool.slug, `${url} slug SSR=${ssrTool.slug}`);
    assert(ssrTool.shortDescription, `${url} shortDescription vide`);
    assert(ssrTool.shortDescriptionEn, `${url} shortDescriptionEn vide`);
    assert(ssrTool.verdict && typeof ssrTool.verdict === "object", `${url} verdict absent`);
    assert(ssrTool.verdictEn && typeof ssrTool.verdictEn === "object", `${url} verdictEn absent`);
    assert(ssrTool.alternatives.every((value) => typeof value === "string"), `${url} alternatives non normalisées`);
    const localFailures = failedResponses.filter((item) => item.includes(BASE_URL));
    const actionableConsoleErrors = consoleErrors.filter((message) =>
      !message.startsWith("Failed to load resource:") || localFailures.length > 0
    );
    assert(pageErrors.length === 0, `${url} pageerror : ${pageErrors.join(" | ")}`);
    assert(localFailures.length === 0, `${url} ressource locale en erreur : ${localFailures.join(" | ")}`);
    assert(actionableConsoleErrors.length === 0, `${url} console.error : ${actionableConsoleErrors.join(" | ")}`);

    if (tool.slug === "wix") {
      assert(ssrTool.defaultMonthlyPrice === 16.8, `${url} prix comparatif Wix inattendu`);
      assert(ssrTool.pricing_v5?.price_reliability === "approved", `${url} Wix n'est pas projeté comme approved`);
      assert(ssrTool.pricing_v5?.plans?.length === 5, `${url} n'expose pas les 5 plans Wix`);
      const paidAmounts = ssrTool.pricing_v5.plans
        .filter((plan) => plan.nativeAmount != null)
        .map((plan) => plan.nativeAmount)
        .sort((a, b) => a - b);
      assert(JSON.stringify(paidAmounts) === JSON.stringify([16.8, 30, 40.8, 178.8]), `${url} plans Wix incomplets`);
    }
    if (tool.slug === "balsamiq") {
      assert(ssrTool.verdictEn.keepIf?.length > 0, `${url} fallback verdict EN vide`);
    }
    if (tool.slug === "adcreative") {
      assert(ssrTool.alternatives.includes("canva"), `${url} alternative canonique Canva absente`);
    }
  } finally {
    page.off("pageerror", onPageError);
    page.off("console", onConsole);
    page.off("response", onResponse);
  }
}

async function inspectSpaNavigation(page) {
  const errors = [];
  const localFailures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith(BASE_URL)) {
      localFailures.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.goto(`${BASE_URL}/fr/tool/figma`, { waitUntil: "networkidle" });
  const canvaLink = page.locator('a[href="/fr/tool/canva"]').first();
  await canvaLink.waitFor({ state: "visible" });
  await canvaLink.click();
  await page.waitForURL("**/fr/tool/canva");
  await page.getByRole("heading", { level: 1, name: /Canva/i }).waitFor({ state: "visible" });
  await page.waitForLoadState("networkidle");
  assert(errors.length === 0, `Navigation SPA Figma → Canva : ${errors.join(" | ")}`);
  assert(localFailures.length === 0, `Navigation SPA Figma → Canva, ressource locale : ${localFailures.join(" | ")}`);
}

async function inspectWixPricingSubpage(page) {
  const url = `${BASE_URL}/fr/tool/wix/prix/`;
  const response = await fetch(url);
  assert(response.ok, `${url} répond HTTP ${response.status}`);
  const html = await response.text();
  const match = html.match(/<script id="__SSR_TOOL__" type="application\/json">([\s\S]*?)<\/script>/);
  const tool = match ? JSON.parse(match[1]) : null;
  assert(tool?.pricing_v5?.price_reliability === "approved", `${url} SSR non canonical`);
  assert(tool?.pricing_v5?.plans?.length === 5, `${url} SSR sans les 5 plans`);
  await page.goto(url, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  for (const expected of ["Gratuit", "Light", "Essentiel", "Business Plus", "16,80", "30,00", "40,80", "178,80", "TVA comprise"]) {
    assert(body.includes(expected), `${url} n'affiche pas ${expected}`);
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
let passed = 0;

try {
  for (const tool of CANARY) {
    for (const lang of ["fr", "en"]) {
      await inspectSsrPage(page, tool, lang);
      passed += 1;
      console.log(`[OK] SSR ${lang.toUpperCase()} ${tool.slug}`);
    }
  }
  await inspectSpaNavigation(page);
  console.log("[OK] SPA Figma → Canva via catalog_api");
  await inspectWixPricingSubpage(page);
  console.log("[OK] SSR + rendu sous-page Wix Prix");
  console.log(`\nCanari Fiche : ${passed + 2}/${CANARY.length * 2 + 2} contrôles verts (${CANARY.length} fiches, 2 langues).`);
} finally {
  await context.close();
  await browser.close();
}
