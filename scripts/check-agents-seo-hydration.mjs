#!/usr/bin/env node
/**
 * The agents section's head, served then hydrated (step 9, 19/11/2026): for each page of the section, the prerendered
 * title, description, og:image and JSON-LD (dist/) must be the ones the page writes once React has run. Both come
 * from src/lib/agentsSeo.ts; this check proves it on the built site.
 *
 *   npm run build && node scripts/check-agents-seo-hydration.mjs [--all]
 *
 * Without --all: the three indexes and every server sheet in both languages, plus ten skill sheets.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PORT = 4319;
const ALL = process.argv.includes("--all");
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/agents/catalog.json"), "utf8"));
const paths = ["fr", "en"].flatMap((lang) => [
  `/${lang}/agents`, `/${lang}/mcp`, `/${lang}/skills`,
  ...catalog.servers.map((s) => `/${lang}/mcp/${s.slug}`),
  ...(ALL ? catalog.skills : catalog.skills.slice(0, 5)).map((k) => `/${lang}/skills/${k.slug}`),
]);

const decode = (text) => text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
function served(route) {
  const html = fs.readFileSync(path.join(ROOT, "dist", route, "index.html"), "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  const jsonLd = {};
  for (const m of head.matchAll(/<script id="(agents-jsonld|agent-sheet-jsonld)" type="application\/ld\+json">([\s\S]*?)<\/script>/g)) jsonLd[m[1]] = JSON.parse(m[2]);
  return {
    title: decode(head.match(/<title>([^<]*)<\/title>/)?.[1] ?? ""),
    description: decode(head.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ""),
    ogImage: head.match(/<meta property="og:image" content="([^"]*)"/)?.[1] ?? "",
    jsonLd,
  };
}

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("vite preview did not start")), 30000);
  server.stdout.on("data", (chunk) => { if (String(chunk).includes(String(PORT))) { clearTimeout(timer); resolve(); } });
});

const failures = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const route of paths) {
    const want = served(route);
    if (!Object.keys(want.jsonLd).length) failures.push(`${route} : pas de JSON-LD au prérendu`);
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const got = await page.evaluate((ids) => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "",
      jsonLd: Object.fromEntries(ids.map((id) => [id, JSON.parse(document.getElementById(id)?.textContent ?? "null")])),
      scripts: ids.map((id) => document.querySelectorAll(`script#${id}`).length),
    }), Object.keys(want.jsonLd));
    for (const key of ["title", "description", "ogImage"]) if (want[key] !== got[key]) failures.push(`${route} : ${key} servi « ${want[key]} » ≠ hydraté « ${got[key]} »`);
    for (const id of Object.keys(want.jsonLd)) if (JSON.stringify(want.jsonLd[id]) !== JSON.stringify(got.jsonLd[id])) failures.push(`${route} : JSON-LD ${id} différent après hydratation`);
    if (got.scripts.some((count) => count !== 1)) failures.push(`${route} : JSON-LD en double (${got.scripts.join(", ")})`);
  }
} finally {
  await browser.close();
  server.kill();
}

for (const failure of failures) console.log(`✗ ${failure}`);
console.log(`${paths.length} page(s) vérifiée(s), ${failures.length} écart(s).`);
process.exit(failures.length ? 1 : 0);
