/**
 * qc-og-screenshots.mjs
 * Some tools' captured screenshot (public/og-screenshots/<slug>.png) is
 * actually a 404/error page — the source URL had gone dead by the time
 * thum.io rendered it, and the script had no way to tell "a real page"
 * from "a real page that happens to say 404". This re-checks every tool
 * whose ogImageUrl points at our own screenshot capture and flags ones
 * whose source URL currently returns a non-2xx status.
 *
 * Usage:
 *   node scripts/qc-og-screenshots.mjs                 # dry-run, report only
 *   node scripts/qc-og-screenshots.mjs --apply          # clear cache + Supabase + delete the bad screenshot
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { supabase } from "./lib/supabase-env.mjs";

const APPLY = process.argv.includes("--apply");
const CACHE = "scripts/og-images-cache.json";
const OUT_DIR = "public/og-screenshots";

if (APPLY && !supabase) {
  console.error("SUPABASE_SERVICE_ROLE_KEY introuvable — impossible d'écrire.");
  process.exit(1);
}

const tools = JSON.parse(readFileSync("src/data/tools_v4.json", "utf8"));
let cache = {};
try { cache = JSON.parse(readFileSync(CACHE, "utf8")); } catch { /* none */ }

const targets = tools.filter((t) => {
  const slug = t.slug || t.id;
  return typeof cache[slug] === "string" && cache[slug].includes("/og-screenshots/");
});

console.log(`\nMode : ${APPLY ? "APPLY (nettoyage)" : "DRY-RUN"}`);
console.log(`Screenshots à vérifier : ${targets.length}\n`);

let ok = 0, broken = 0;

for (const tool of targets) {
  const slug = tool.slug || tool.id;
  const url = tool.websiteUrl || tool.website_url || tool.affiliateLink || tool.affiliate_link;
  if (!url) continue;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ToolTrimBot/1.0; +https://tooltrim.com)" },
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.log(`BROKEN ${slug}  (HTTP ${res.status})  ${url}`);
      broken++;
      if (APPLY) {
        delete cache[slug];
        const filePath = `${OUT_DIR}/${slug}.png`;
        if (existsSync(filePath)) unlinkSync(filePath);
        if (supabase) {
          const { error } = await supabase.from("tools").update({ og_image_url: null }).eq("slug", slug);
          if (error) console.error(`       ERR Supabase: ${error.message}`);
        }
      }
    } else {
      ok++;
    }
  } catch (e) {
    console.log(`FAIL   ${slug}  (${e.message}) — treating as broken  ${url}`);
    broken++;
    if (APPLY) {
      delete cache[slug];
      const filePath = `${OUT_DIR}/${slug}.png`;
      if (existsSync(filePath)) unlinkSync(filePath);
      if (supabase) {
        const { error } = await supabase.from("tools").update({ og_image_url: null }).eq("slug", slug);
        if (error) console.error(`       ERR Supabase: ${error.message}`);
      }
    }
  }

  await new Promise((r) => setTimeout(r, 300));
}

if (APPLY) writeFileSync(CACHE, JSON.stringify(cache, null, 2));

console.log(`\n── Résultat ──`);
console.log(`OK:     ${ok}`);
console.log(`Broken: ${broken}`);
if (!APPLY) console.log(`\nRelance avec --apply pour nettoyer (cache + Supabase + fichier local).`);
