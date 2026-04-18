import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE = "https://www.tooltrim.io";
const LANGS = ["fr", "en"];
const STATIC_PAGES = ["", "tools", "category", "guides", "selector", "about", "transparency", "contact"];

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch data
  const [{ data: tools }, { data: categories }, { data: posts }] = await Promise.all([
    supabase.from("tools").select("slug, id"),
    supabase.from("categories").select("slug"),
    supabase.from("posts").select("slug, lang"),
  ]);

  const urls: string[] = [];

  const addUrl = (loc: string, changefreq: string, priority: string) => {
    urls.push(`  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`);
  };

  // Static pages
  for (const lang of LANGS) {
    for (const page of STATIC_PAGES) {
      const path = page ? `/${lang}/${page}` : `/${lang}`;
      const priority = page === "" ? "1.0" : page === "tools" ? "0.9" : "0.7";
      addUrl(`${BASE}${path}`, page === "" ? "daily" : "weekly", priority);
    }
  }

  // Tools
  for (const tool of tools || []) {
    for (const lang of LANGS) {
      addUrl(`${BASE}/${lang}/tool/${tool.slug || tool.id}`, "weekly", "0.8");
    }
  }

  // Categories
  for (const cat of categories || []) {
    for (const lang of LANGS) {
      addUrl(`${BASE}/${lang}/category/${cat.slug}`, "weekly", "0.7");
    }
  }

  // Comparisons index
  for (const lang of LANGS) {
    addUrl(`${BASE}/${lang}/comparatifs`, "weekly", "0.8");
  }

  // SEO landing pages (localized slugs)
  addUrl(`${BASE}/fr/audit-saas-gratuit`, "weekly", "0.9");
  addUrl(`${BASE}/en/free-saas-audit`, "weekly", "0.9");

  // Featured comparisons
  const COMPARISONS = [
    "chatgpt-vs-claude", "dropbox-vs-google-drive", "zapier-vs-make",
    "notion-vs-obsidian", "typeform-vs-tally", "midjourney-vs-firefly",
    "github-copilot-vs-cursor", "grammarly-vs-claude",
    "figma-vs-canva", "linear-vs-jira", "notion-vs-airtable",
    "vercel-vs-replit", "semrush-vs-similarweb", "stripe-vs-razorpay",
    "slack-vs-front", "notion-vs-coda",
  ];
  for (const comp of COMPARISONS) {
    for (const lang of LANGS) {
      addUrl(`${BASE}/${lang}/comparatif/${comp}`, "monthly", "0.7");
    }
  }

  // Posts
  for (const post of posts || []) {
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
