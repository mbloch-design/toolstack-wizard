/**
 * screenshot-fallback-images.mjs
 * For tools with no scrapable og:image (see scripts/og-images-cache.json,
 * empty-string entries), fetch a real screenshot of the homepage via
 * thum.io (free, no API key, handles JS-rendered sites) and store it
 * locally under public/og-screenshots/<slug>.jpg so it ships with the
 * static build — no ongoing dependency on the third-party service once
 * captured.
 *
 * (A local headless-browser capture via Playwright was tried first, but
 * spawning a browser subprocess hangs indefinitely in this sandboxed
 * environment — outbound sockets opened outside Node's own fetch() stack
 * seem to be blocked. Plain HTTPS requests via fetch() work fine, which
 * is why an HTTP screenshot API is used instead of a local browser.)
 *
 * Usage:
 *   node scripts/screenshot-fallback-images.mjs                 # dry-run (count only)
 *   node scripts/screenshot-fallback-images.mjs --apply         # capture + write cache + Supabase
 *   node scripts/screenshot-fallback-images.mjs --apply --limit=20
 *   node scripts/screenshot-fallback-images.mjs --apply --slug=krita
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

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
const SITE_BASE = "https://tooltrim.com";

/* ── args ── */
const APPLY  = process.argv.includes("--apply");
const LIMIT  = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "9999");
const SINGLE = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
const CACHE  = "scripts/og-images-cache.json";
const OUT_DIR = "public/og-screenshots";

const supabase = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;
if (APPLY && !supabase) {
  console.error("SUPABASE_SERVICE_ROLE_KEY introuvable — impossible d'écrire.");
  process.exit(1);
}

/* ── tools + cache ── */
const tools = JSON.parse(readFileSync("src/data/tools_v4.json", "utf8"));
let cache = {};
try { cache = JSON.parse(readFileSync(CACHE, "utf8")); } catch { /* none */ }

let targets = tools.filter((t) => {
  const slug = t.slug || t.id;
  const url = t.websiteUrl || t.website_url || t.affiliateLink || t.affiliate_link;
  return !!url && cache[slug] === "";
});
if (SINGLE) targets = targets.filter((t) => (t.slug || t.id) === SINGLE);
targets = targets.slice(0, LIMIT);

console.log(`\nMode : ${APPLY ? "APPLY (capture + écriture)" : "DRY-RUN"}`);
console.log(`Outils sans OG image à capturer : ${targets.length}\n`);

if (!APPLY) {
  targets.slice(0, 30).forEach((t) => console.log(`  - ${t.slug || t.id}`));
  if (targets.length > 30) console.log(`  … +${targets.length - 30} autres`);
  console.log(`\nRelance avec --apply pour capturer.`);
  process.exit(0);
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, fail = 0;

async function captureOne(tool) {
  const slug = tool.slug || tool.id;
  const url = tool.websiteUrl || tool.website_url || tool.affiliateLink || tool.affiliate_link;
  const shotUrl = `https://image.thum.io/get/width/1200/crop/630/noanimate/${url}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(shotUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) throw new Error("image trop petite, probablement une page d'erreur");

    const filePath = `${OUT_DIR}/${slug}.png`;
    writeFileSync(filePath, buf);
    const publicUrl = `${SITE_BASE}/og-screenshots/${slug}.png`;
    cache[slug] = publicUrl;
    console.log(`OK     ${slug}`);
    ok++;

    if (supabase) {
      const { error } = await supabase
        .from("tools")
        .update({ og_image_url: publicUrl })
        .eq("slug", slug);
      if (error) console.error(`       ERR Supabase: ${error.message}`);
    }
  } catch (e) {
    console.log(`FAIL   ${slug}  (${e.message})`);
    fail++;
  } finally {
    writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  }
}

for (const tool of targets) {
  await captureOne(tool);
  // thum.io free tier is rate-limited; stay polite between requests
  await sleep(700);
}

console.log(`\n── Résultat ──`);
console.log(`OK:   ${ok}`);
console.log(`Fail: ${fail}`);
console.log(`Cache sauvegardé dans ${CACHE}`);
console.log(`Images dans ${OUT_DIR}/`);
