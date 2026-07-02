/**
 * fetch-og-images.mjs
 * One-shot script: scrape og:image from each tool's website and store it
 * in Supabase (column `og_image_url` on the `tools` table).
 *
 * Usage:
 *   node scripts/fetch-og-images.mjs                  # dry-run (no writes)
 *   node scripts/fetch-og-images.mjs --apply          # write to Supabase
 *   node scripts/fetch-og-images.mjs --apply --limit=50   # first 50 only
 *   node scripts/fetch-og-images.mjs --apply --slug=figma  # single tool
 *
 * Prerequisites:
 *   - The `tools` table must have an `og_image_url` text column.
 *     Run in Supabase SQL editor:
 *       ALTER TABLE tools ADD COLUMN IF NOT EXISTS og_image_url text;
 *   - SUPABASE_SERVICE_ROLE_KEY in .env / .env.local / .env.production
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

/* ── env ── */
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
const fileEnv = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.preprod"),
  ...loadEnvFile(".env.production"),
};
const pick = (...names) => names.map((n) => process.env[n] || fileEnv[n]).find(Boolean);
const SUPABASE_URL = pick("SUPABASE_URL", "VITE_SUPABASE_URL") || "https://rtfyfuwfdpnsogovkwai.supabase.co";
const SERVICE_KEY = pick("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SERVICE_ROLE_KEY");

/* ── args ── */
const APPLY  = process.argv.includes("--apply");
const RETRY_MISS = process.argv.includes("--retry-miss");
const LIMIT  = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "9999");
const SINGLE = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
const ONLY   = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]?.split(",");
const CACHE  = "scripts/og-images-cache.json";

/* ── Supabase ── */
const supabase = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;

if (APPLY && !supabase) {
  console.error("SUPABASE_SERVICE_ROLE_KEY introuvable — impossible d'écrire.");
  process.exit(1);
}

/* ── tools source ── */
const tools = JSON.parse(readFileSync("src/data/tools_v4.json", "utf8"));

/* ── og:image extractor ── */
async function fetchOgImage(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ToolTrimBot/1.0; +https://tooltrim.com)",
        "Accept": "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    // Some sites (Next.js head managers, mostly) emit og:image under name=
    // instead of property=, which the OG spec doesn't technically allow but
    // browsers/crawlers accept anyway — so we match both.
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (!match?.[1]) return null;
    try {
      return new URL(match[1], url).href;
    } catch {
      return match[1];
    }
  } catch {
    return null;
  }
}

/* ── sleep ── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── load cache ── */
let cache = {};
try { cache = JSON.parse(readFileSync(CACHE, "utf8")); } catch { /* first run */ }
if (RETRY_MISS) {
  for (const slug of Object.keys(cache)) {
    if (cache[slug] === "") delete cache[slug];
  }
}

/* ── main ── */
let list = tools.filter((t) => {
  const url = t.websiteUrl || t.website_url || t.affiliateLink || t.affiliate_link;
  return !!url;
});

if (SINGLE) list = list.filter((t) => (t.slug || t.id) === SINGLE);
if (ONLY)   list = list.filter((t) => ONLY.includes(t.slug || t.id));
list = list.slice(0, LIMIT);

console.log(`\nMode : ${APPLY ? "APPLY (écriture Supabase)" : "DRY-RUN"}`);
console.log(`Outils à traiter : ${list.length}\n`);

let ok = 0, skip = 0, fail = 0;

for (const tool of list) {
  const slug = tool.slug || tool.id;
  const url  = tool.websiteUrl || tool.website_url || tool.affiliateLink || tool.affiliate_link;

  /* skip if already cached */
  if (cache[slug] !== undefined) {
    console.log(`CACHE  ${slug}`);
    skip++;
    continue;
  }

  const imgUrl = await fetchOgImage(url);
  cache[slug] = imgUrl ?? "";

  if (!imgUrl) {
    console.log(`MISS   ${slug}  (${url})`);
    fail++;
  } else {
    console.log(`OK     ${slug}  →  ${imgUrl.slice(0, 80)}`);
    ok++;

    if (APPLY && supabase) {
      const { error } = await supabase
        .from("tools")
        .update({ og_image_url: imgUrl })
        .eq("slug", slug);
      if (error) console.error(`       ERR Supabase: ${error.message}`);
    }
  }

  /* save cache after each tool (crash-safe) */
  writeFileSync(CACHE, JSON.stringify(cache, null, 2));

  /* ~1 req / 400ms — polite but fast */
  await sleep(400);
}

/* summary */
console.log(`\n── Résultat ──`);
console.log(`OK:    ${ok}`);
console.log(`Cache: ${skip}`);
console.log(`Miss:  ${fail}`);
console.log(`Cache sauvegardé dans ${CACHE}`);
if (!APPLY) console.log(`\nRelance avec --apply pour écrire dans Supabase.`);
