/**
 * fetch-gallery-images.mjs
 * Scrape multiple sub-pages per tool to build a gallery_images[] array.
 * Tries homepage, /features, /product, /pricing, /screenshots + GitHub repo.
 *
 * Usage:
 *   node scripts/fetch-gallery-images.mjs              # dry-run
 *   node scripts/fetch-gallery-images.mjs --apply      # write to Supabase
 *
 * Prerequisite — run in Supabase SQL editor:
 *   ALTER TABLE tools ADD COLUMN IF NOT EXISTS gallery_images text[];
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

function loadEnvFile(path) {
  const env = {};
  let content;
  try { content = readFileSync(path, "utf8"); } catch { return env; }
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}
const fileEnv = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...loadEnvFile(".env.preprod"), ...loadEnvFile(".env.production") };
const pick = (...names) => names.map((n) => process.env[n] || fileEnv[n]).find(Boolean);
const SUPABASE_URL = pick("SUPABASE_URL", "VITE_SUPABASE_URL") || "https://rtfyfuwfdpnsogovkwai.supabase.co";
const SERVICE_KEY = pick("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SERVICE_ROLE_KEY");

const APPLY = process.argv.includes("--apply");
const CACHE = "scripts/gallery-cache.json";

const supabase = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;

if (APPLY && !supabase) { console.error("SERVICE_KEY manquant."); process.exit(1); }

/* ── Tools to process ── */
const FEATURED_SLUGS = [
  "invision","framer","chakra-ui","echarts","shadcn-ui","recharts","ant-design",
  "material-ui","storybook","17hats","adcreative","adobe","adobe-after-effects",
  "adobe-cc","adobe-illustrator","indesign","adobe-lightroom","adobe-photoshop",
  "adobe-premiere-pro","adobe-xd","affinity-photo","airslate","figma-anima",
  "ae-animation-composer","asana","audacity","autocad","ae-bao-boa",
  "basecamp","better-proposals","blender","bloom-crm",
];

const tools = JSON.parse(readFileSync("src/data/tools_v4.json", "utf8"));
const toolMap = new Map(tools.map((t) => [t.slug || t.id, t]));

/* Sub-pages to try per domain */
const SUBPAGES = ["/features", "/product", "/product-tour", "/screenshots", "/tour", "/pricing"];

/* Known GitHub repos for open-source tools */
const GITHUB_MAP = {
  "chakra-ui":   "chakra-ui/chakra-ui",
  "echarts":     "apache/echarts",
  "shadcn-ui":   "shadcn-ui/ui",
  "recharts":    "recharts/recharts",
  "ant-design":  "ant-design/ant-design",
  "material-ui": "mui/material-ui",
  "storybook":   "storybookjs/storybook",
  "blender":     "blender/blender",
  "audacity":    "audacity/audacity",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOg(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ToolTrimBot/1.0)", "Accept": "text/html" },
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    const img = m?.[1];
    if (!img) return null;
    // Resolve relative URLs
    if (img.startsWith("http")) return img;
    const base = new URL(url);
    return new URL(img, base.origin).href;
  } catch {
    return null;
  }
}

/* Load cache */
let cache = {};
try { cache = JSON.parse(readFileSync(CACHE, "utf8")); } catch {}

console.log(`\nMode: ${APPLY ? "APPLY" : "DRY-RUN"} — ${FEATURED_SLUGS.length} outils\n`);

for (const slug of FEATURED_SLUGS) {
  if (cache[slug]) {
    console.log(`CACHE  ${slug} (${cache[slug].length} images)`);
    continue;
  }

  const tool = toolMap.get(slug);
  const baseUrl = tool?.websiteUrl || tool?.website_url || tool?.affiliateLink || tool?.affiliate_link;
  const imgs = new Set();

  /* 1. Sub-pages of the tool's own site */
  if (baseUrl) {
    let origin;
    try { origin = new URL(baseUrl).origin; } catch {}
    if (origin) {
      for (const sub of SUBPAGES) {
        const img = await fetchOg(origin + sub);
        if (img) imgs.add(img);
        await sleep(300);
        if (imgs.size >= 4) break;
      }
    }
  }

  /* 2. GitHub repo page */
  const ghRepo = GITHUB_MAP[slug];
  if (ghRepo && imgs.size < 4) {
    const img = await fetchOg(`https://github.com/${ghRepo}`);
    if (img) imgs.add(img);
    await sleep(300);
  }

  const result = [...imgs].slice(0, 4);
  cache[slug] = result;
  writeFileSync(CACHE, JSON.stringify(cache, null, 2));

  console.log(`${result.length > 0 ? "OK " : "MISS"} ${slug.padEnd(26)} ${result.length} images`);
  if (result.length > 0) console.log(`       ${result[0].slice(0, 80)}`);

  if (APPLY && supabase && result.length > 0) {
    const { error } = await supabase.from("tools").update({ gallery_images: result }).eq("slug", slug);
    if (error) console.error(`       ERR Supabase: ${error.message}`);
    else console.log(`       → Supabase OK`);
  }

  await sleep(200);
}

console.log("\n── Résumé ──");
const counts = Object.values(cache).map((v) => v.length);
console.log(`Avec images : ${counts.filter((n) => n > 0).length}/${FEATURED_SLUGS.length}`);
console.log(`Moyenne     : ${(counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1)} images/outil`);
if (!APPLY) console.log("\nRelance avec --apply pour écrire dans Supabase.");
