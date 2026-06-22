import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import postcss from "postcss";
import { componentTagger } from "lovable-tagger";
import { STACKS } from "./src/data/stacks";
import { computeToolTrimScore } from "./src/lib/toolTrimScore";

const BASE = "https://tooltrim.com";
const LANGS = ["fr", "en"];
// /selector excluded from sitemap (noindex tunnel)
const STATIC_PAGES = ["", "tools", "category", "guides", "stacks", "about", "methodology", "transparency", "contact"];
const EXCLUDE_SITEMAP_PATTERNS = ["/selector/results", "/methodology"];

// SEO landing + persona pillar pages (localized slugs)
const SEO_LANDING_PAGE_PAIRS: { fr: string; en: string; priority: string }[] = [
  { fr: "/fr/audit-saas-gratuit", en: "/en/free-saas-audit", priority: "0.9" },
];

const CATEGORY_EN: Record<string, { name: string; description: string }> = {
  "ia-generaliste":       { name: "AI & Generative Tools",  description: "AI tools for writing, research and brainstorming for freelancers." },
  "organisation":         { name: "Organisation",           description: "Keep your work organized without spending hours on setup." },
  "communication":        { name: "Communication",          description: "Manage clients and meetings without losing your mind." },
  "creation-design":      { name: "Content Creation",       description: "Create professional visuals and copy without being a designer." },
  "finance-facturation":  { name: "Finance & Invoicing",    description: "Get paid fast and stay compliant with invoicing tools." },
  "stockage":             { name: "Storage",                description: "Keep your files safe and accessible anywhere." },
  "automatisation":       { name: "Automation",             description: "Let the robots do the work for you." },
  "gestion-projet":       { name: "Project Management",     description: "Organize tasks and collaborate efficiently." },
  "email-marketing":      { name: "Email & Marketing",      description: "Master your inbox and automate marketing." },
  "communication-equipe": { name: "Team Communication",     description: "Collaborate and communicate with clients and partners." },
  "design-prototypage":   { name: "Design & Prototyping",   description: "Create professional interfaces and mockups." },
  "securite":             { name: "Security",               description: "Protect your data and manage passwords securely." },
  "suivi-temps":          { name: "Time Tracking",          description: "Track your time to bill at the right rate." },
  "nocode-web":           { name: "No-Code & Web",          description: "Build websites and products without writing code." },
  "analytics":            { name: "Analytics",              description: "Analyze your site traffic while respecting privacy." },
  "formation-education":  { name: "Education & Training",   description: "Create and sell online courses or train your clients." },
};

const PERSONA_PILLAR_PAIRS: { fr: string; en: string; priority: string }[] = [
  { fr: "/fr/guide/meilleurs-outils-developpeur-freelance",    en: "/en/guide/best-tools-freelance-developer",      priority: "0.8" },
  { fr: "/fr/guide/meilleurs-outils-designer-freelance",       en: "/en/guide/best-tools-freelance-designer",       priority: "0.8" },
  { fr: "/fr/guide/meilleurs-outils-consultant-freelance",     en: "/en/guide/best-tools-freelance-consultant",     priority: "0.8" },
  { fr: "/fr/guide/meilleurs-outils-createur-contenu-freelance", en: "/en/guide/best-tools-freelance-content-creator", priority: "0.8" },
  { fr: "/fr/guide/meilleurs-outils-ops-manager-freelance",    en: "/en/guide/best-tools-freelance-ops-manager",    priority: "0.8" },
];

const GUIDE_SLUG_ALTERNATES: Record<string, string> = {
  "loom-prix-alternatives": "loom-pricing-alternatives",
  "conseils-ia-freelances-2026": "ai-tips-freelancers-2026",
  "notion-gratuit-ou-payant": "notion-free-or-paid",
  "toggl-track-gratuit-ou-payant": "toggl-track-free-or-paid",
  "calendly-gratuit-suffisant": "calendly-free-enough",
  "chatgpt-plus-utile-ou-inutile": "chatgpt-plus-worth-it",
  "grammarly-gratuit-ou-payant": "grammarly-free-or-paid",
  "stripe-vs-virement": "stripe-vs-bank-transfer",
  "claude-vs-chatgpt-2026-lequel-choisir-business": "claude-vs-chatgpt-deepseek",
  "grammarly-vs-languagetool-comparaison": "grammarly-vs-languagetool-comparison-2026",
  "notion-vs-coda-comparatif-2026": "notion-vs-coda-comparison-2026",
  "chatgpt-vs-claude-comparatif-2026": "chatgpt-vs-claude-comparison-2026",
  "zapier-vs-make-comparatif-2026": "zapier-vs-make-comparison-2026",
  "figma-vs-canva-comparatif-2026": "figma-vs-canva-comparison-2026",
  "slack-vs-teams-comparatif-2026": "slack-vs-teams-comparison-2026",
  "stack-redactrice-freelance": "stack-freelance-writer",
};

const GUIDE_EN_TO_FR = Object.fromEntries(
  Object.entries(GUIDE_SLUG_ALTERNATES).map(([fr, en]) => [en, fr]),
) as Record<string, string>;

const GUIDE_COMPARISON_REDIRECTS = new Set([
  "notion-vs-coda-comparatif-2026",
  "notion-vs-coda-comparison-2026",
  "chatgpt-vs-claude-comparatif-2026",
  "chatgpt-vs-claude-comparison-2026",
  "zapier-vs-make-comparatif-2026",
  "zapier-vs-make-comparison-2026",
  "figma-vs-canva-comparatif-2026",
  "figma-vs-canva-comparison-2026",
  "slack-vs-teams-comparatif-2026",
  "slack-vs-teams-comparison-2026",
]);

const GUIDE_FR_ONLY_SLUGS = new Set([
  "claude-sonnet-4-6-vs-chatgpt-vs-deepseek-vs-gemini-fevrier-2026",
  "meilleurs-outils-ia-freelances-2026",
  "claude-opus-4-6-guide-complet-freelances",
  "alternatives-gratuites-notion-freelance-2026",
  "stack-minimaliste-freelance-2026",
  "stripe-freelance-tarifs-alternatives",
  "perplexity-vs-chatgpt-recherche",
  "notion-gratuit-vs-payant-vrai-calcul",
]);

function buildToolMetaDesc(tool: any, lang: string): string {
  // Snippet SERP orienté CTR : valeur (description courte) + signal PRIX
  // (l'intention dominante) + crochet aligné sur le titre. Borné à 160c.
  const isFr = lang === "fr";
  const rawShort = isFr
    ? (tool.shortDescription || "")
    : (tool.shortDescriptionEn || tool.shortDescription || "");
  const long = isFr
    ? (tool.longDescription || "")
    : (tool.longDescriptionEn || tool.longDescription || "");
  const price: number = tool.defaultMonthlyPrice || 0;
  const hasFree = !!(tool.pricing && tool.pricing.free);

  // Base = description courte (curatée, punchy) ; on ne bascule sur la 1re
  // phrase de la longue que si la courte est vraiment trop maigre.
  let base = (rawShort || "").replace(/\s+/g, " ").trim();
  if (base.length < 45 && long) {
    const sentence = (long.split(/(?<=[.!?])\s/)[0] || "").trim();
    if (sentence.length > base.length) base = sentence;
  }

  const mentionsFree = /gratuit|free/i.test(base);
  // Licence à vie / perpétuelle : pas de "/mois" dans le snippet.
  const oneTime = /licence|à vie|perp[ée]tuel|one-?time|perpetual/i.test(tool.pricing?.paid || "");
  const per = isFr ? (oneTime ? "" : "/mois") : (oneTime ? "" : "/mo");
  const priceClause = isFr
    ? (price > 0 ? `Prix dès ${price}€${per}.` : (hasFree && !mentionsFree ? "Version gratuite." : ""))
    : (price > 0 ? `From €${price}${per}.` : (hasFree && !mentionsFree ? "Free version." : ""));
  const hook = isFr
    ? "Avis ToolTrim et alternatives moins chères."
    : "ToolTrim review and cheaper alternatives.";

  const tail = [priceClause, hook].filter(Boolean).join(" ");
  // Rogne la base pour réserver la place au prix + crochet (sans couper un mot).
  const avail = 160 - tail.length - 1;
  if (base.length > avail) {
    base = base.substring(0, Math.max(40, avail)).replace(/\s+\S*$/, "");
  }
  base = base.replace(/[\s.,;:!?–—-]+$/, "").trim();
  if (base) base += ".";

  return `${base} ${tail}`.replace(/\s+/g, " ").trim().substring(0, 160);
}

// --- Source de données du build SEO (sitemap + prerender) : Supabase est la
// source de vérité au runtime. On la fusionne PAR-DESSUS le JSON groupé
// (Supabase gagne) pour que le build reflète le contenu live et couvre les
// fiches retirées de tools_v4.json. Fallback : si le fetch échoue, on garde le
// JSON seul (comportement historique), donc le build n'est jamais pire qu'avant.
const SB_PRERENDER_URL = "https://rtfyfuwfdpnsogovkwai.supabase.co";
const SB_PRERENDER_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZnlmdXdmZHBuc29nb3Zrd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTcyMDcsImV4cCI6MjA4ODg3MzIwN30.pwpmh9Qe8dLZFq1rMqtCRmEMJ9dnbcdvT_B4CjIu4Xc";
const SB_RENAME: Record<string, string> = {
  short_description: "shortDescription",
  short_description_en: "shortDescriptionEn",
  long_description: "longDescription",
  long_description_en: "longDescriptionEn",
  default_monthly_price: "defaultMonthlyPrice",
  pricing_en: "pricingEn",
  verdict_en: "verdictEn",
  pros_en: "prosEn",
  cons_en: "consEn",
  use_cases: "useCases",
  use_cases_en: "useCasesEn",
  relevant_for: "relevantFor",
  better_alternative: "betterAlternative",
  free_alternative: "freeAlternative",
  website_url: "websiteUrl",
  affiliate_link: "affiliateLink",
  time_gained_hours_per_month: "timeGainedHoursPerMonth",
  migration_guide: "migrationGuide",
  downgrade_plan: "downgradePlan",
  solo_relevance: "soloRelevance",
  team_relevance: "teamRelevance",
};
function sbRowToTool(row: Record<string, any>): Record<string, any> {
  const t: Record<string, any> = {};
  for (const [col, val] of Object.entries(row)) {
    if (col === "pertinence_by_persona") continue;
    t[SB_RENAME[col] || col] = val;
  }
  if (t.description === undefined && t.longDescription != null) t.description = t.longDescription;
  return t;
}
let _sbToolsCache: Record<string, any>[] | null = null;
async function getMergedTools(jsonTools: any[]): Promise<any[]> {
  try {
    if (!_sbToolsCache) {
      const res = await fetch(`${SB_PRERENDER_URL}/rest/v1/tools?select=*&limit=2000`, {
        headers: { apikey: SB_PRERENDER_ANON, Authorization: `Bearer ${SB_PRERENDER_ANON}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) throw new Error("empty response");
      _sbToolsCache = rows as Record<string, any>[];
    }
    const bySlug = new Map<string, any>();
    for (const t of jsonTools) bySlug.set(t.slug || t.id, t);
    for (const row of _sbToolsCache) {
      if (!row.slug) continue;
      bySlug.set(row.slug, sbRowToTool(row));
    }
    console.log(
      `✓ Build SEO source: ${jsonTools.length} JSON + ${_sbToolsCache.length} Supabase = ${bySlug.size} fiches`
    );
    return [...bySlug.values()];
  } catch (e: any) {
    console.warn(
      `⚠️ Build SEO: fetch Supabase échoué (${e?.message}); fallback JSON seul (${jsonTools.length})`
    );
    return jsonTools;
  }
}

function sitemapPlugin(): Plugin {
  return {
    name: "generate-sitemap",
    async closeBundle() {
      try {
        const raw = fs.readFileSync(path.resolve(__dirname, "src/data/content.json"), "utf-8");
        const data = JSON.parse(raw);
        const toolsRaw = fs.readFileSync(path.resolve(__dirname, "src/data/tools_v4.json"), "utf-8");
        const categoriesRaw = fs.readFileSync(path.resolve(__dirname, "src/data/categories_index.json"), "utf-8");
        const tools = await getMergedTools(JSON.parse(toolsRaw));
        const categories = JSON.parse(categoriesRaw);
        const urls: string[] = [];

        const buildDate = new Date().toISOString().split("T")[0];

        /** Single URL entry — no hreflang (lang-specific or unpaired content) */
        const addSingle = (loc: string, freq: string, prio: string, lastmod = buildDate) => {
          urls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`);
        };

        /** FR+EN pair — both entries share the same hreflang block (x-default → FR) */
        const addPair = (frLoc: string, enLoc: string, freq: string, prio: string, lastmod = buildDate) => {
          const hl = `\n    <xhtml:link rel="alternate" hreflang="fr" href="${frLoc}" />\n    <xhtml:link rel="alternate" hreflang="en" href="${enLoc}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${frLoc}" />`;
          urls.push(`  <url>\n    <loc>${frLoc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>${hl}\n  </url>`);
          urls.push(`  <url>\n    <loc>${enLoc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>${hl}\n  </url>`);
        };

        // Helper: check if a path matches any exclusion pattern
        const isExcluded = (path: string) =>
          EXCLUDE_SITEMAP_PATTERNS.some((pat) => path.includes(pat));

        // ── Static pages ──────────────────────────────────────────────────────
        for (const page of STATIC_PAGES) {
          const frPath = page ? `/fr/${page}` : `/fr`;
          const enPath = page ? `/en/${page}` : `/en`;
          if (isExcluded(frPath)) continue; // e.g. /methodology excluded intentionally
          const prio = page === "" ? "1.0" : page === "tools" ? "0.9" : "0.7";
          const freq = page === "" ? "daily" : "weekly";
          addPair(`${BASE}${frPath}`, `${BASE}${enPath}`, freq, prio);
        }

        // ── Tool pages + sub-pages ────────────────────────────────────────────
        for (const t of tools || []) {
          const slug = t.slug || t.id;
          addPair(`${BASE}/fr/tool/${slug}`,              `${BASE}/en/tool/${slug}`,              "weekly",  "0.8");
          addPair(`${BASE}/fr/tool/${slug}/prix`,         `${BASE}/en/tool/${slug}/pricing`,      "monthly", "0.7");
          addPair(`${BASE}/fr/tool/${slug}/alternatives`, `${BASE}/en/tool/${slug}/alternatives`, "monthly", "0.7");
          addPair(`${BASE}/fr/tool/${slug}/avis`,         `${BASE}/en/tool/${slug}/reviews`,      "monthly", "0.6");
          addPair(`${BASE}/fr/tool/${slug}/faq`,          `${BASE}/en/tool/${slug}/faq`,          "monthly", "0.6");
        }

        // ── Category pages ────────────────────────────────────────────────────
        for (const c of categories || []) {
          addPair(`${BASE}/fr/category/${c.slug}`, `${BASE}/en/category/${c.slug}`, "weekly", "0.7");
        }

        // ── Articles from content.json (lang-specific, no guaranteed pair) ────
        for (const a of data.articles || []) {
          const lang = a.lang || "fr";
          const articleDate = a.date || buildDate;
          addSingle(`${BASE}/${lang}/guide/${a.slug}`, "monthly", "0.6", articleDate);
        }

        // ── Posts from posts-fr.json / posts-en.json ──────────────────────────
        const postsFrRaw = fs.readFileSync(path.resolve(__dirname, "src/data/posts-fr.json"), "utf-8");
        const postsEnRaw = fs.readFileSync(path.resolve(__dirname, "src/data/posts-en.json"), "utf-8");
        const postsFr = JSON.parse(postsFrRaw) as any[];
        const postsEn = JSON.parse(postsEnRaw) as any[];
        const contentArticleSlugs = new Set((data.articles || []).map((a: any) => a.slug));
        const enPostBySlug = new Map(postsEn.map((p: any) => [p.slug, p]));
        const pairedEnSlugs = new Set<string>();

        for (const post of postsFr) {
          if (contentArticleSlugs.has(post.slug)) continue;
          const enSlug = GUIDE_SLUG_ALTERNATES[post.slug] || post.slug;
          const enPost = enPostBySlug.get(enSlug);
          if (!GUIDE_FR_ONLY_SLUGS.has(post.slug) && enPost) {
            addPair(
              `${BASE}/fr/guide/${post.slug}`,
              `${BASE}/en/guide/${enSlug}`,
              "monthly", "0.7", post.date || buildDate
            );
            pairedEnSlugs.add(enSlug);
          } else {
            addSingle(`${BASE}/fr/guide/${post.slug}`, "monthly", "0.7", post.date || buildDate);
          }
        }
        for (const post of postsEn) {
          if (
            contentArticleSlugs.has(post.slug) ||
            pairedEnSlugs.has(post.slug) ||
            GUIDE_COMPARISON_REDIRECTS.has(post.slug) ||
            GUIDE_EN_TO_FR[post.slug] ||
            GUIDE_FR_ONLY_SLUGS.has(post.slug)
          ) continue;
          addSingle(`${BASE}/en/guide/${post.slug}`, "monthly", "0.7", post.date || buildDate);
        }

        // ── Comparisons index + detail pages ──────────────────────────────────
        addPair(`${BASE}/fr/comparatifs`, `${BASE}/en/comparatifs`, "weekly", "0.8");

        const COMPARISONS = [
          "chatgpt-vs-claude", "dropbox-vs-google-drive", "zapier-vs-make",
          "notion-vs-obsidian", "typeform-vs-tally", "midjourney-vs-firefly",
          "github-copilot-vs-cursor", "grammarly-vs-claude",
          "figma-vs-canva", "linear-vs-jira", "notion-vs-airtable",
          "vercel-vs-replit", "semrush-vs-similarweb", "stripe-vs-razorpay",
          "slack-vs-front", "notion-vs-coda",
        ];
        for (const comp of COMPARISONS) {
          addPair(`${BASE}/fr/comparatif/${comp}`, `${BASE}/en/comparatif/${comp}`, "monthly", "0.7");
        }

        // ── SEO landing pages ─────────────────────────────────────────────────
        for (const lp of SEO_LANDING_PAGE_PAIRS) {
          addPair(`${BASE}${lp.fr}`, `${BASE}${lp.en}`, "monthly", lp.priority);
        }

        // ── Stack hub + stack detail pages ────────────────────────────────────
        for (const stack of STACKS) {
          addPair(`${BASE}/fr/stacks/${stack.slug}`, `${BASE}/en/stacks/${stack.slug}`, "monthly", "0.7");
        }

        // ── Standalone FR article: facturation freelance 2026 ─────────────────
        addSingle(`${BASE}/fr/guide/outils-facturation-freelance-2026`, "monthly", "0.8", "2026-05-08");

        // ── Persona pillar pages ──────────────────────────────────────────────
        for (const pp of PERSONA_PILLAR_PAIRS) {
          addPair(`${BASE}${pp.fr}`, `${BASE}${pp.en}`, "monthly", pp.priority);
        }

        // Deduplicate — tool slugs in data may have duplicates (flux, framer, perplexity …)
        const seenLocs = new Set<string>();
        const deduped = urls.filter((entry) => {
          const match = entry.match(/<loc>(.*?)<\/loc>/);
          if (!match) return true;
          if (seenLocs.has(match[1])) return false;
          seenLocs.add(match[1]);
          return true;
        });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
          `        xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
          deduped.join("\n"),
          `</urlset>`,
        ].join("\n");

        const distPath = path.resolve(__dirname, "dist/sitemap.xml");
        if (fs.existsSync(path.resolve(__dirname, "dist"))) {
          fs.writeFileSync(distPath, xml, "utf-8");
        }

        const dupeCount = urls.length - deduped.length;
        console.log(`✅ Sitemap generated with ${deduped.length} URLs (hreflang included)${dupeCount > 0 ? ` — ${dupeCount} duplicates removed` : ""}`);
      } catch (e) {
        console.warn("⚠️ Sitemap generation failed:", e);
      }
    },
  };
}

function staticPrerenderPlugin(): Plugin {
  return {
    name: "static-prerender-tools",
    apply: "build",
    async closeBundle() {
      try {
        const toolsRaw = fs.readFileSync(path.resolve(__dirname, "src/data/tools_v4.json"), "utf-8");
        const categoriesRaw = fs.readFileSync(path.resolve(__dirname, "src/data/categories_index.json"), "utf-8");
        const tools = await getMergedTools(JSON.parse(toolsRaw));
        const categories = JSON.parse(categoriesRaw);

        const distDir = path.resolve(__dirname, "dist");
        const indexPath = path.resolve(distDir, "index.html");
        if (!fs.existsSync(indexPath)) {
          console.warn("⚠️ Prerender: dist/index.html not found, skipping");
          return;
        }
        const baseHtml = fs.readFileSync(indexPath, "utf-8");
        let count = 0;

        // Real SSR for the main tool route only (Phase 1 — see plan
        // "linked-dazzling-thimble"). Sub-pages (/prix, /alternatives, /avis,
        // /faq) keep the previous meta-only prerender for now.
        let renderToolPage: ((path: string, tool: any, lang: string) => Promise<{ html: string; relatedPosts: any[] }>) | null = null;
        const ssrEntryPath = path.resolve(__dirname, "dist-ssr/entry-server.js");
        if (fs.existsSync(ssrEntryPath)) {
          try {
            const ssrModule = await import(`file://${ssrEntryPath}?t=${Date.now()}`);
            renderToolPage = ssrModule.renderToolPage;
          } catch (e) {
            console.warn("⚠️ SSR entry failed to load, falling back to meta-only prerender:", e);
          }
        } else {
          console.warn("⚠️ dist-ssr/entry-server.js not found — run `vite build --ssr` first. Falling back to meta-only prerender.");
        }

        for (const tool of tools) {
          const slug = tool.slug || tool.id;
          const name = tool.name || slug;
          const price = tool.defaultMonthlyPrice || null;

          for (const lang of LANGS) {
            const isFr = lang === "fr";
            // Titre mené par le prix : la requête dominante est "combien ça coûte".
            // Prix concret si payant, "gratuit" si offre gratuite, sinon "prix".
            const priceTag = isFr
              ? (price && price > 0 ? `prix dès ${price}€` : (tool.pricing?.free ? "gratuit" : "prix"))
              : (price && price > 0 ? `pricing from €${price}` : (tool.pricing?.free ? "free" : "pricing"));
            const presentationOverride = isFr ? tool.seo?.presentationTitleFr : tool.seo?.presentationTitleEn;
            const title = presentationOverride || (isFr
              ? `${name} : ${priceTag}, avis et alternatives 2026 | ToolTrim`
              : `${name}: ${priceTag}, review & alternatives 2026 | ToolTrim`);
            const description = buildToolMetaDesc(tool, lang);
            const url = `${BASE}/${lang}/tool/${slug}`;


            const productUrl = tool.websiteUrl || tool.affiliateLink || tool.website_url || tool.affiliate_link || "";
            const jsonLd: Record<string, any> = {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name,
              ...(productUrl ? { url: productUrl } : {}),
              description: description || title,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
            };
            // offers est requis par le rich result Software App (prix, ou "0"
            // pour un outil gratuit) ; sans lui, pas d'étoiles même avec review.
            jsonLd.offers = {
              "@type": "Offer",
              price: (price && typeof price === "number" && price > 0 ? price : 0).toString(),
              priceCurrency: "EUR",
              ...(productUrl ? { url: productUrl } : {}),
            };
            // Note éditoriale ToolTrim (affichée sur la page) exposée en Review.
            // C'est l'avis du média sur un outil tiers (légitime), PAS un
            // aggregateRating à faux compteur d'avis utilisateurs.
            const ts = computeToolTrimScore(tool);
            if (ts && typeof ts.score === "number") {
              jsonLd.review = {
                "@type": "Review",
                author: { "@type": "Organization", name: "ToolTrim" },
                itemReviewed: { "@type": "SoftwareApplication", name, applicationCategory: "BusinessApplication" },
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: ts.score.toString(),
                  bestRating: "5",
                  worstRating: "1",
                },
                ...(isFr ? { name: `Avis ToolTrim : ${ts.labelFr}` } : { name: `ToolTrim review: ${ts.labelEn}` }),
                ...(tool.verdict?.threshold ? { reviewBody: String(tool.verdict.threshold).substring(0, 280) } : {}),
                ...(tool.pricing_v5?.verified_on ? { datePublished: tool.pricing_v5.verified_on } : {}),
              };
            }

            const frToolUrl = `${BASE}/fr/tool/${slug}`;
            const enToolUrl = `${BASE}/en/tool/${slug}`;

            const breadcrumb = {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "ToolTrim", item: `${BASE}/${lang}` },
                { "@type": "ListItem", position: 2, name: isFr ? "Outils" : "Tools", item: `${BASE}/${lang}/tools` },
                { "@type": "ListItem", position: 3, name, item: url },
              ],
            };

            const metaTags = [
              `<link rel="canonical" href="${url}" />`,
              `<link rel="alternate" hreflang="fr" href="${frToolUrl}" />`,
              `<link rel="alternate" hreflang="en" href="${enToolUrl}" />`,
              `<link rel="alternate" hreflang="x-default" href="${frToolUrl}" />`,
              `<title>${title}</title>`,
              `<meta name="description" content="${(description || title).replace(/"/g, "&quot;")}" />`,
              `<meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />`,
              `<meta property="og:description" content="${(description || title).replace(/"/g, "&quot;")}" />`,
              `<meta property="og:url" content="${url}" />`,
              `<meta property="og:image" content="${BASE}/og-image.png" />`,
              `<meta name="twitter:image" content="${BASE}/og-image.png" />`,
              `<script id="tool-software-jsonld" type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
              `<script id="tool-breadcrumb-jsonld" type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
            ].join("\n    ");

            // Inject into <head>, replacing existing title/meta if present
            let html = baseHtml;
            // Fix lang attribute for this locale
            html = html.replace(/(<html[^>]*)lang="[^"]*"/, `$1lang="${lang}"`);
            // Remove existing canonical (re-injected per-page above)
            html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/, "");
            // Remove existing title
            html = html.replace(/<title>[^<]*<\/title>/, "");
            // Remove existing meta description
            html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
            // Inject before </head>
            html = html.replace("</head>", `    ${metaTags}\n  </head>`);
            // Inject noscript body text for crawlers
            const toolBodyText = isFr
              ? `${name}. ${description} Avis, prix vérifiés et alternatives moins chères sur ToolTrim.`
              : `${name}. ${description} Honest review, verified pricing and cheaper alternatives on ToolTrim.`;
            html = html.replace("</body>", `    <noscript><p>${toolBodyText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></noscript>\n  </body>`);

            if (renderToolPage) {
              try {
                const { html: markup, relatedPosts } = await renderToolPage(`/${lang}/tool/${slug}`, tool, lang);
                html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
                const ssrJson = JSON.stringify(tool).replace(/<\/script/gi, "<\\/script");
                const relatedPostsJson = JSON.stringify(relatedPosts).replace(/<\/script/gi, "<\\/script");
                html = html.replace(
                  "</body>",
                  `    <script id="__SSR_TOOL__" type="application/json">${ssrJson}</script>\n` +
                  `    <script id="__SSR_RELATED_POSTS__" type="application/json">${relatedPostsJson}</script>\n  </body>`
                );
              } catch (e) {
                console.warn(`⚠️ SSR render failed for ${lang}/tool/${slug}, falling back to meta-only:`, e);
              }
            }

            const outDir = path.resolve(distDir, lang, "tool", slug);
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.resolve(outDir, "index.html"), html, "utf-8");
            count++;
          }
        }

        // --- Prerender tool sub-pages: /prix, /alternatives, /faq, /avis ---
        // EN path overrides for FR-only slug names
        const EN_SUB_PATH: Record<string, string> = { prix: "pricing", avis: "reviews" };

        type SubPageDef = {
          path: string;
          buildTitle: (name: string, isFr: boolean, tool: any) => string;
          buildDesc: (name: string, price: number | null, isFr: boolean, tool: any) => string;
          buildBody: (name: string, price: number | null, isFr: boolean, tool: any) => string;
        };

        // Build a slug→name lookup for enriching alternative names
        const slugToName: Record<string, string> = {};
        for (const t of tools) { slugToName[t.slug || t.id] = t.name || t.slug || t.id; }

        const TOOL_SUB_PAGES: SubPageDef[] = [
          {
            path: "prix",
            buildTitle: (name, isFr, tool) => {
              const override = isFr ? tool?.seo?.prixTitleFr : tool?.seo?.prixTitleEn;
              if (override) return override;
              return isFr
                ? `${name} : prix et tarifs 2026 | ToolTrim`
                : `${name} pricing & plans 2026 | ToolTrim`;
            },
            buildDesc: (name, price, isFr) => isFr
              ? (price ? `Combien coûte vraiment ${name} ? Plans, tarifs détaillés et comparaison, à jour 2026. Vaut-il ses ${price}€/mois ?` : `Plans et tarifs de ${name} : gratuit, freemium ou payant ? Toutes les options décryptées par ToolTrim.`)
              : (price ? `How much does ${name} really cost? Detailed plans, pricing breakdown, updated 2026. Is it worth €${price}/mo?` : `${name} plans and pricing: free, freemium or paid? All options explained by ToolTrim.`),
            buildBody: (name, price, isFr, tool) => {
              const v5 = tool.pricing_v5;
              const planNote = v5?.compare_plan_name ? (isFr ? ` (plan ${v5.compare_plan_name})` : ` (${v5.compare_plan_name} plan)`) : "";
              const caution = v5?.cautions?.[0] ? ` ${v5.cautions[0]}` : "";
              return isFr
                ? `Tous les plans et tarifs de ${name}${price ? ` : à partir de ${price}€/mois${planNote}` : " : gratuit ou freemium"}. ${caution || `Prix vérifié par ToolTrim : analyse du rapport qualité-prix pour freelances.`}`
                : `All ${name} plans and pricing${price ? `: from €${price}/month${planNote}` : ": free or freemium"}. ${caution || `Price verified by ToolTrim: value analysis for freelancers.`}`;
            },
          },
          {
            path: "alternatives",
            // tool.seo.altTitle/altMetaDescription let a fiche override the generic
            // template when there's a sharper, situational hook (e.g. "X merged into Y").
            buildTitle: (name, isFr, tool) => {
              const override = isFr ? tool?.seo?.altTitleFr : tool?.seo?.altTitleEn;
              if (override) return override;
              return isFr
                ? `Meilleures alternatives à ${name} en 2026 | ToolTrim`
                : `Best ${name} alternatives in 2026 | ToolTrim`;
            },
            buildDesc: (name, _price, isFr, tool) => {
              const override = isFr ? tool?.seo?.altMetaDescriptionFr : tool?.seo?.altMetaDescriptionEn;
              if (override) return override;
              return isFr
                ? `Quelles sont les meilleures alternatives à ${name} ? ToolTrim compare les options moins chères, gratuites ou plus adaptées, à jour 2026.`
                : `What are the best alternatives to ${name}? ToolTrim compares cheaper, free and better-fit options, updated 2026.`;
            },
            buildBody: (name, _price, isFr, tool) => {
              const altIds: string[] = tool.alternatives || [];
              const altNames = altIds.slice(0, 5).map((id: string) => slugToName[id] || id).filter(Boolean);
              const altList = altNames.length > 0
                ? (isFr ? ` Principales alternatives : ${altNames.join(", ")}.` : ` Top alternatives: ${altNames.join(", ")}.`)
                : "";
              const freeAlt = tool.freeAlternative ? (isFr ? ` Alternative gratuite : ${tool.freeAlternative}.` : ` Free alternative: ${tool.freeAlternative}.`) : "";
              return isFr
                ? `Alternatives à ${name} sélectionnées par ToolTrim : comparaison des fonctionnalités, prix et positionnement pour chaque profil freelance.${altList}${freeAlt}`
                : `${name} alternatives selected by ToolTrim: feature, pricing and positioning comparison for every freelance profile.${altList}${freeAlt}`;
            },
          },
          {
            path: "faq",
            buildTitle: (name, isFr) => isFr
              ? `${name} : questions fréquentes 2026 | ToolTrim`
              : `${name} FAQ 2026 | ToolTrim`,
            buildDesc: (name, _price, isFr) => isFr
              ? `Toutes les questions fréquentes sur ${name} : prix, plans, alternatives, intégrations et conseils d'utilisation. Réponses ToolTrim 2026.`
              : `All frequently asked questions about ${name}: pricing, plans, alternatives, integrations and usage tips. ToolTrim answers 2026.`,
            buildBody: (name, price, isFr, tool) => {
              const threshold = (isFr ? tool.verdict?.threshold : tool.verdictEn?.threshold || tool.verdict?.threshold) || "";
              const soloNote = (isFr ? tool.soloRelevance : null) || "";
              const thresholdPart = threshold ? ` ${threshold}` : "";
              const soloPart = soloNote ? ` ${soloNote}` : "";
              return isFr
                ? `FAQ ToolTrim sur ${name} : combien ça coûte${price ? ` (${price}€/mois)` : ""}, quelles alternatives, comment annuler.${thresholdPart}${soloPart}`
                : `ToolTrim FAQ for ${name}: how much does it cost${price ? ` (€${price}/month)` : ""}, what are the alternatives, how to cancel.${thresholdPart}`;
            },
          },
          {
            path: "avis",
            buildTitle: (name, isFr) => isFr
              ? `Avis ${name} 2026 : Note ToolTrim & retours d'expérience | ToolTrim`
              : `${name} Reviews 2026: ToolTrim Rating & User Feedback | ToolTrim`,
            buildDesc: (name, _price, isFr, tool) => {
              const short = (isFr ? tool.shortDescription : tool.shortDescriptionEn || tool.shortDescription) || "";
              const excerpt = short.split(/[.!?]/)[0]?.trim() || "";
              const part = excerpt.length > 30 ? `${excerpt}. ` : "";
              return isFr
                ? `${part}Avis indépendant sur ${name} : points forts, points faibles, rapport qualité-prix et verdict ToolTrim, à jour 2026.`
                : `${part}Independent review of ${name}: pros, cons, value for money and ToolTrim verdict, updated 2026.`;
            },
            buildBody: (name, price, isFr, tool) => {
              const threshold = (isFr ? tool.verdict?.threshold : tool.verdictEn?.threshold || tool.verdict?.threshold) || "";
              const pros = (isFr ? tool.pros : tool.prosEn || tool.pros) || [];
              const firstPro = Array.isArray(pros) && pros[0] ? String(pros[0]) : "";
              const proPart = firstPro ? (isFr ? ` Point fort : ${firstPro}.` : ` Top strength: ${firstPro}.`) : "";
              const thresholdPart = threshold ? ` Verdict : ${threshold}` : "";
              return isFr
                ? `Avis ToolTrim sur ${name} : analyse indépendante des fonctionnalités, du prix${price ? ` (${price}€/mois)` : ""} et de la valeur réelle pour freelances et indépendants.${proPart}${thresholdPart}`
                : `ToolTrim review of ${name}: independent analysis of features, pricing${price ? ` (€${price}/month)` : ""} and real value for freelancers and solopreneurs.${proPart}${thresholdPart}`;
            },
          },
        ];

        for (const tool of tools) {
          const slug = tool.slug || tool.id;
          const name = tool.name || slug;
          const price: number | null = tool.defaultMonthlyPrice || null;

          for (const lang of LANGS) {
            const isFr = lang === "fr";
            for (const sub of TOOL_SUB_PAGES) {
              const localizedPath = !isFr && EN_SUB_PATH[sub.path] ? EN_SUB_PATH[sub.path] : sub.path;
              const url      = `${BASE}/${lang}/tool/${slug}/${localizedPath}`;
              const frUrl    = `${BASE}/fr/tool/${slug}/${sub.path}`;
              const enUrl    = `${BASE}/en/tool/${slug}/${EN_SUB_PATH[sub.path] ?? sub.path}`;
              const mainUrl  = `${BASE}/${lang}/tool/${slug}`;
              // tool.seo.<prefix>Title/MetaDescription override any subpage's
              // generic template (prefix: "alt" for /alternatives, else sub.path).
              const overridePrefix = sub.path === "alternatives" ? "alt" : sub.path;
              const titleOverride = isFr ? tool.seo?.[`${overridePrefix}TitleFr`] : tool.seo?.[`${overridePrefix}TitleEn`];
              const descOverride  = isFr ? tool.seo?.[`${overridePrefix}MetaDescriptionFr`] : tool.seo?.[`${overridePrefix}MetaDescriptionEn`];
              const title    = titleOverride || sub.buildTitle(name, isFr, tool);
              const desc     = descOverride  || sub.buildDesc(name, price, isFr, tool);
              const bodyText = sub.buildBody(name, price, isFr, tool);

              // BreadcrumbList for sub-page
              const breadcrumb = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "ToolTrim", item: `${BASE}/${lang}` },
                  { "@type": "ListItem", position: 2, name: isFr ? "Outils" : "Tools", item: `${BASE}/${lang}/tools` },
                  { "@type": "ListItem", position: 3, name, item: mainUrl },
                  { "@type": "ListItem", position: 4, name: title.split("|")[0].trim(), item: url },
                ],
              };

              // FAQPage schema — /faq sub-page only, injected in static HTML
              // so Google's first-pass crawler (no JS) can validate it
              const verdictThreshold = (isFr ? tool.verdict?.threshold : tool.verdictEn?.threshold || tool.verdict?.threshold) || "";
              const altNames = (tool.alternatives || []).slice(0, 3)
                .map((id: string) => slugToName[id] || id).filter(Boolean);
              const altAnswer = altNames.length > 0
                ? (isFr ? `Les principales alternatives à ${name} sont : ${altNames.join(", ")}.` : `The main alternatives to ${name} are: ${altNames.join(", ")}.`)
                : (isFr ? `ToolTrim référence les meilleures alternatives à ${name} avec comparaison des prix et fonctionnalités.` : `ToolTrim lists the best alternatives to ${name} with price and feature comparisons.`);

              const faqSchema = sub.path === "faq" ? {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: isFr ? `À quoi sert ${name} ?` : `What is ${name} used for?`,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: (isFr ? tool.shortDescription : tool.shortDescriptionEn || tool.shortDescription) || `${name} is a SaaS tool.`,
                    },
                  },
                  {
                    "@type": "Question",
                    name: isFr ? `Combien coûte ${name} ?` : `How much does ${name} cost?`,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: isFr
                        ? `${name} coûte ${price === 0 ? "0€ (gratuit)" : price ? `${price}€/mois` : "variable selon le plan"}. Prix vérifié par ToolTrim.`
                        : `${name} costs ${price === 0 ? "€0 (free)" : price ? `€${price}/month` : "variable by plan"}. Price verified by ToolTrim.`,
                    },
                  },
                  {
                    "@type": "Question",
                    name: isFr ? `${name} vaut-il son prix ?` : `Is ${name} worth the price?`,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: verdictThreshold || (isFr
                        ? `Cela dépend de votre usage. Consultez notre verdict complet sur la page principale de ${name}.`
                        : `It depends on your usage. See our full verdict on ${name}'s main page.`),
                    },
                  },
                  {
                    "@type": "Question",
                    name: isFr ? `Quelles sont les meilleures alternatives à ${name} ?` : `What are the best alternatives to ${name}?`,
                    acceptedAnswer: { "@type": "Answer", text: altAnswer },
                  },
                ],
              } : null;

              const subProductUrl = tool.websiteUrl || tool.affiliateLink || tool.website_url || tool.affiliate_link || "";
              const subScore = computeToolTrimScore(tool);

              // Nœud SoftwareApplication complet (name + offers + review) émis
              // sur /avis et /prix : le rich result Google exige offers ET review
              // ensemble. offers="0" pour un outil gratuit.
              const appSchema = (sub.path === "avis" || sub.path === "prix") ? {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name,
                ...(subProductUrl ? { url: subProductUrl } : {}),
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                offers: {
                  "@type": "Offer",
                  price: (price && price > 0 ? price : 0).toString(),
                  priceCurrency: "EUR",
                  ...(subProductUrl ? { url: subProductUrl } : {}),
                },
                ...(subScore && typeof subScore.score === "number" ? {
                  review: {
                    "@type": "Review",
                    author: { "@type": "Organization", name: "ToolTrim" },
                    reviewRating: { "@type": "Rating", ratingValue: subScore.score.toString(), bestRating: "5", worstRating: "1" },
                    ...(isFr ? { name: `Avis ToolTrim : ${subScore.labelFr}` } : { name: `ToolTrim review: ${subScore.labelEn}` }),
                    ...(verdictThreshold ? { reviewBody: String(verdictThreshold).substring(0, 280) } : {}),
                    ...(tool.pricing_v5?.verified_on ? { datePublished: tool.pricing_v5.verified_on } : {}),
                  },
                } : {}),
              } : null;

              const metaTags = [
                `<link rel="canonical" href="${url}" />`,
                `<link rel="alternate" hreflang="fr" href="${frUrl}" />`,
                `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
                `<link rel="alternate" hreflang="x-default" href="${frUrl}" />`,
                `<title>${title}</title>`,
                `<meta name="description" content="${desc.replace(/"/g, "&quot;")}" />`,
                `<meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />`,
                `<meta property="og:description" content="${desc.replace(/"/g, "&quot;")}" />`,
                `<meta property="og:url" content="${url}" />`,
                `<meta property="og:image" content="${BASE}/og-image.png" />`,
                `<script id="tool-subpage-breadcrumb-jsonld" type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
                ...(faqSchema ? [`<script id="tool-faq-jsonld" type="application/ld+json">${JSON.stringify(faqSchema)}</script>`] : []),
                ...(appSchema ? [`<script id="tool-subpage-app-jsonld" type="application/ld+json">${JSON.stringify(appSchema)}</script>`] : []),
              ].join("\n    ");

              let html = baseHtml;
              html = html.replace(/(<html[^>]*)lang="[^"]*"/, `$1lang="${lang}"`);
              html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/, "");
              html = html.replace(/<title>[^<]*<\/title>/, "");
              html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
              html = html.replace("</head>", `    ${metaTags}\n  </head>`);
              html = html.replace("</body>", `    <noscript><p>${bodyText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></noscript>\n  </body>`);

              const outDir = path.resolve(distDir, lang, "tool", slug, localizedPath);
              fs.mkdirSync(outDir, { recursive: true });
              fs.writeFileSync(path.resolve(outDir, "index.html"), html, "utf-8");
            }
          }
        }

        // --- Generate landing pages: /, /fr, /en ---
        const landings: { file: string; lang: string; canonical: string; title: string; description: string; bodyText: string }[] = [
          {
            file: "index.html",
            lang: "fr",
            canonical: `${BASE}/fr`,
            title: "ToolTrim : optimisez votre stack SaaS | Avis, prix et alternatives",
            description: "ToolTrim analyse vos outils SaaS et vous aide à réduire vos coûts. Comparez les prix, découvrez des alternatives gratuites et optimisez votre stack en quelques clics.",
            bodyText: "ToolTrim est le comparateur indépendant d'outils SaaS pour freelances, startups et équipes tech. Analysez votre stack actuelle, identifiez les abonnements inutiles et découvrez des alternatives plus économiques. Chaque outil est testé manuellement pendant 2 à 4 semaines. Nos recommandations sont neutres, vérifiées et conçues pour vous faire gagner du temps et de l'argent.",
          },
          {
            file: "fr/index.html",
            lang: "fr",
            canonical: `${BASE}/fr`,
            title: "ToolTrim : optimisez votre stack SaaS | Avis, prix et alternatives",
            description: "ToolTrim analyse vos outils SaaS et vous aide à réduire vos coûts. Comparez les prix, découvrez des alternatives gratuites et optimisez votre stack en quelques clics.",
            bodyText: "ToolTrim est le comparateur indépendant d'outils SaaS pour freelances, startups et équipes tech. Analysez votre stack actuelle, identifiez les abonnements inutiles et découvrez des alternatives plus économiques. Chaque outil est testé manuellement pendant 2 à 4 semaines. Nos recommandations sont neutres, vérifiées et conçues pour vous faire gagner du temps et de l'argent.",
          },
          {
            file: "en/index.html",
            lang: "en",
            canonical: `${BASE}/en`,
            title: "ToolTrim : optimize your SaaS stack | Reviews, pricing & alternatives",
            description: "ToolTrim analyzes your SaaS tools and helps you cut costs. Compare pricing, find free alternatives and optimize your stack in just a few clicks.",
            bodyText: "ToolTrim is the independent SaaS tool comparison platform for freelancers, startups and tech teams. Audit your current stack, spot unnecessary subscriptions and discover cheaper alternatives. Every tool is manually tested for 2 to 4 weeks. Our recommendations are unbiased, verified and designed to save you time and money.",
          },
        ];

        for (const lp of landings) {
          const frCanonical = `${BASE}/fr`;
          const enCanonical = `${BASE}/en`;

          const metaTags = [
            `<link rel="canonical" href="${lp.canonical}" />`,
            `<link rel="alternate" hreflang="fr" href="${frCanonical}" />`,
            `<link rel="alternate" hreflang="en" href="${enCanonical}" />`,
            `<link rel="alternate" hreflang="x-default" href="${frCanonical}" />`,
            `<title>${lp.title}</title>`,
            `<meta name="description" content="${lp.description.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:title" content="${lp.title.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:description" content="${lp.description.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:url" content="${lp.canonical}" />`,
            `<meta property="og:site_name" content="ToolTrim" />`,
          ].join("\n    ");

          const staticParagraph = `<noscript><p>${lp.bodyText}</p></noscript>`;

          let html = baseHtml;
          html = html.replace(/(<html[^>]*)lang="[^"]*"/, `$1lang="${lp.lang}"`);
          html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/, "");
          html = html.replace(/<title>[^<]*<\/title>/, "");
          html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
          html = html.replace("</head>", `    ${metaTags}\n  </head>`);
          html = html.replace("</body>", `    ${staticParagraph}\n  </body>`);

          const outPath = path.resolve(distDir, lp.file);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, html, "utf-8");
        }

        // --- Prerender SEO landing + persona pillar pages ---
        const SEO_PAGES: { path: string; title: string; description: string; bodyText: string }[] = [
          {
            path: "/fr/audit-saas-gratuit",
            title: "Audit SaaS gratuit pour freelances : optimisez votre stack en 5 min | tooltrim.com",
            description: "Combien gaspillez-vous en abonnements SaaS ? Audit gratuit : détectez doublons, fantômes et outils inadaptés. Selon tooltrim.com, 35% des freelances paient en double.",
            bodyText: "Auditez votre stack SaaS en 5 minutes. Détectez les doublons, abonnements fantômes et gaspillage dans vos outils freelance. Selon tooltrim.com, 35% des freelances paient en double pour des outils qui se chevauchent. Économie moyenne récupérable : 485€/mois.",
          },
          {
            path: "/en/free-saas-audit",
            title: "Free SaaS audit for freelancers: optimize your stack in 5 min | tooltrim.com",
            description: "How much are you wasting on SaaS subscriptions? Free audit: detect duplicates, ghost subs and misfit tools. According to tooltrim.com, 35% of freelancers overpay.",
            bodyText: "Audit your SaaS stack in 5 minutes. Detect duplicates, ghost subscriptions and waste in your freelance toolset. According to tooltrim.com, 35% of freelancers pay twice for overlapping tools. Average recoverable waste: €485/month.",
          },
          {
            path: "/fr/guide/meilleurs-outils-developpeur-freelance",
            title: "Meilleurs outils pour développeur freelance en 2026 | tooltrim.com",
            description: "Stack idéale pour dev freelance : Cursor, Vercel, Supabase, ChatGPT Pro… Selon tooltrim.com, un développeur freelance dépense 280€/mois en SaaS. Voici comment optimiser.",
            bodyText: "Un développeur freelance utilise en moyenne 12 outils SaaS pour 280€/mois. Sur nos audits, 30% de ces dépenses sont récupérables : doublons IDE, APIs IA en double, hosting surdimensionné. Voici la stack optimale selon tooltrim.com.",
          },
          {
            path: "/fr/guide/meilleurs-outils-designer-freelance",
            title: "Meilleurs outils pour designer freelance en 2026 | tooltrim.com",
            description: "Stack créative optimale : Figma, Adobe CC, Midjourney, Loom… Selon tooltrim.com, un designer freelance dépense 350€/mois en SaaS. 40% est récupérable.",
            bodyText: "Un designer freelance dépense en moyenne 350€/mois en outils, le budget SaaS le plus élevé parmi nos 5 personas. Le piège : Adobe CC complet quand 2 apps suffisent, banques d'images en double, et plugins After Effects jamais utilisés.",
          },
          {
            path: "/fr/guide/meilleurs-outils-consultant-freelance",
            title: "Meilleurs outils pour consultant freelance en 2026 | tooltrim.com",
            description: "Stack conseil optimale : Calendly, HubSpot, Zoom, Notion… Selon tooltrim.com, un consultant dépense 180€/mois en SaaS.",
            bodyText: "Un consultant freelance dépense en moyenne 180€/mois en outils SaaS. Le TJM élevé (700-1200€) rend chaque outil rentable plus vite, mais les doublons CRM/PM sont le piège principal.",
          },
          {
            path: "/fr/guide/meilleurs-outils-createur-contenu-freelance",
            title: "Meilleurs outils pour créateur de contenu freelance en 2026 | tooltrim.com",
            description: "Stack content optimale : Beehiiv, ChatGPT Pro, Canva, Buffer… Selon tooltrim.com, un créateur de contenu dépense 220€/mois en SaaS.",
            bodyText: "Un créateur de contenu freelance dépense en moyenne 220€/mois en outils SaaS. Le piège : empiler des outils IA, des plateformes newsletter en double et des schedulers sociaux qui font la même chose.",
          },
          {
            path: "/fr/guide/meilleurs-outils-ops-manager-freelance",
            title: "Meilleurs outils pour ops manager freelance en 2026 | tooltrim.com",
            description: "Stack ops optimale : Asana, Qonto, Indy, Pipedrive… Selon tooltrim.com, un ops manager freelance dépense 200€/mois en SaaS.",
            bodyText: "Un ops manager ou COO fractionnaire dépense en moyenne 200€/mois en outils SaaS. La stack ops est la plus fragmentée : compta, banque, signature, PM, stockage… les doublons sont partout.",
          },
          {
            path: "/en/guide/best-tools-freelance-developer",
            title: "Best tools for freelance developers in 2026 | tooltrim.com",
            description: "Ideal stack for freelance devs: Cursor, Vercel, Supabase, ChatGPT Pro… According to tooltrim.com, a freelance dev spends €280/mo on SaaS. Here's how to optimize.",
            bodyText: "A freelance developer uses 12 SaaS tools on average for €280/month. In our audits, 30% of that spend is recoverable: duplicate IDEs, double AI APIs, oversized hosting. Here's the optimal stack according to tooltrim.com.",
          },
          {
            path: "/en/guide/best-tools-freelance-designer",
            title: "Best tools for freelance designers in 2026 | tooltrim.com",
            description: "Optimal creative stack: Figma, Adobe CC, Midjourney… According to tooltrim.com, a freelance designer spends €350/mo on SaaS. 40% is recoverable.",
            bodyText: "A freelance designer spends €350/month on tools on average, the highest SaaS budget among our 5 personas. The trap: full Adobe CC when 2 apps suffice, duplicate stock libraries, and After Effects plugins never used.",
          },
          {
            path: "/en/guide/best-tools-freelance-consultant",
            title: "Best tools for freelance consultants in 2026 | tooltrim.com",
            description: "Optimal consulting stack: Calendly, HubSpot, Zoom, Notion… According to tooltrim.com, a freelance consultant spends €180/mo on SaaS.",
            bodyText: "A freelance consultant spends €180/month on SaaS tools on average. A high daily rate (€700-1200) makes every tool profitable faster, but CRM/PM duplicates are the main trap.",
          },
          {
            path: "/en/guide/best-tools-freelance-content-creator",
            title: "Best tools for freelance content creators in 2026 | tooltrim.com",
            description: "Optimal content stack: Beehiiv, ChatGPT Pro, Canva, Buffer… According to tooltrim.com, a freelance content creator spends €220/mo on SaaS.",
            bodyText: "A freelance content creator spends €220/month on SaaS tools on average. The trap: stacking AI tools, duplicate newsletter platforms, and social schedulers doing the same thing.",
          },
          {
            path: "/en/guide/best-tools-freelance-ops-manager",
            title: "Best tools for freelance ops managers in 2026 | tooltrim.com",
            description: "Optimal ops stack: Asana, Qonto, Stripe, Pipedrive… According to tooltrim.com, a freelance ops manager spends €200/mo on SaaS.",
            bodyText: "A fractional COO or ops manager spends €200/month on SaaS tools on average. The ops stack is the most fragmented: accounting, banking, e-signatures, PM, storage… duplicates are everywhere.",
          },
          {
            path: "/en/guide/loom-pricing-alternatives",
            title: "Loom Pricing 2026: Worth It for Freelancers? Honest Review + Alternatives | tooltrim.com",
            description: "Loom costs $15/month per user in 2026. According to tooltrim.com, 68% of freelancers who pay for Loom use less than 20% of its features. Verdict and 4 cheaper alternatives.",
            bodyText: "Loom Business at $15/user/month is only worth it if you send more than 8 recorded videos per week. Below that threshold, you're overpaying. According to tooltrim.com, the free plan covers 60% of solo freelance use cases, and Tella, Claap or Scribe match 80% of Loom's features for less.",
          },
          {
            path: "/fr/guide/loom-prix-alternatives",
            title: "Prix Loom 2026 : ça vaut le coup pour un freelance ? Avis honnête + alternatives | tooltrim.com",
            description: "Loom coûte 15$/mois par utilisateur en 2026. Selon tooltrim.com, 68% des freelances qui payent Loom utilisent moins de 20% de ses fonctionnalités. Verdict et 4 alternatives moins chères.",
            bodyText: "Loom Business à 15$/utilisateur/mois ne vaut le coup que si tu envoies plus de 8 vidéos enregistrées par semaine. En dessous, tu surpayes. Selon tooltrim.com, le plan gratuit couvre 60% des cas d'usage freelance solo, et Tella, Claap ou Scribe couvrent 80% des fonctions de Loom pour moins cher.",
          },
          {
            path: "/en/guide/grammarly-vs-languagetool-comparison-2026",
            title: "Grammarly vs LanguageTool 2026: Which One Is Worth Paying For? | tooltrim.com",
            description: "Grammarly costs $12/mo vs LanguageTool at $4/mo. According to tooltrim.com, 70% of freelancers don't need Grammarly Premium. Honest comparison + verdict.",
            bodyText: "Grammarly Premium costs $12/month vs $4/month for LanguageTool Premium. According to tooltrim.com, 70% of freelancers who pay for Grammarly Premium use less than 30% of its features. Stay free under 10,000 words/month, pick LanguageTool for multilingual writing, and only pay Grammarly if you write 20,000+ English words/month for native-English clients.",
          },
          {
            path: "/fr/guide/conseils-ia-freelances-2026",
            title: "Conseils IA pour freelances en 2026 : stack minimale, prompts qui marchent et anti-gaspillage | tooltrim.com",
            description: "Stack IA minimale, prompts par métier et anti-gaspillage. Selon tooltrim.com, 62% des freelances paient 2 IA en double. Verdict honnête + ROI réel.",
            bodyText: "En 2026, un freelance n'a besoin que d'un seul abonnement IA généraliste (ChatGPT Plus ou Claude Pro) plus un outil métier spécialisé. Selon tooltrim.com, 62% des freelances cumulent ChatGPT + Claude + Perplexity + Copilot pour 60-80€/mois alors qu'un seul outil suffit. Économie moyenne récupérable : 45€/mois.",
          },
          {
            path: "/fr/guide/outils-facturation-freelance-2026",
            title: "Logiciel facturation freelance 2026 : le guide honnête (+ obligation e-invoicing) | tooltrim.com",
            description: "Comparatif sans filtre des meilleurs outils de facturation pour freelances et TPE en 2026. Pennylane, Indy, Freebe, Dougs, et tout ce que vous devez savoir sur l'obligation de facturation électronique de septembre 2026.",
            bodyText: "À partir du 1er septembre 2026, toutes les entreprises assujetties à la TVA (freelances et TPE inclus) doivent pouvoir recevoir des factures électroniques via une PDP agréée. Comparatif honnête : Freebe (9-15€/mois) pour micro-entrepreneurs, Indy (facturation gratuite) pour BNC, Pennylane (37€/mois) pour TPE structurées, Dougs (49€/mois) pour SASU qui veut tout déléguer, et le module Qonto intégré pour ceux qui facturent moins de 20 fois par mois. Selon tooltrim.com, 30% des freelances paient deux outils compta qui se chevauchent.",
          },
          {
            path: "/en/guide/ai-tips-freelancers-2026",
            title: "AI Tips for Freelancers in 2026: Minimal Stack, Prompts That Actually Work, and Cutting the Waste | tooltrim.com",
            description: "Minimal AI stack, role-based prompts and waste audit. According to tooltrim.com, 62% of freelancers pay for two AIs in parallel. Honest verdict + real ROI.",
            bodyText: "In 2026, a freelancer needs one general-purpose AI subscription (ChatGPT Plus or Claude Pro) plus one role-specific tool. According to tooltrim.com, 62% of freelancers stack ChatGPT + Claude + Perplexity + Copilot for $60-80/month when one tool would suffice. Average recoverable saving: $45/month.",
          },
        ];

        for (const sp of SEO_PAGES) {
          const url = `${BASE}${sp.path}`;
          const spLang = sp.path.startsWith("/en/") ? "en" : "fr";
          const slug = sp.path.split("/").pop() || "";
          const frSlug = spLang === "fr" ? slug : GUIDE_EN_TO_FR[slug] || slug;
          const enSlug = spLang === "en" ? slug : GUIDE_SLUG_ALTERNATES[slug] || slug;
          const frCanonical = sp.path.includes("/guide/") ? `${BASE}/fr/guide/${frSlug}` : url;
          const enCanonical = sp.path.includes("/guide/") ? `${BASE}/en/guide/${enSlug}` : url;
          const metaTags = [
            `<link rel="canonical" href="${url}" />`,
            ...(sp.path.includes("/guide/") ? [
              `<link rel="alternate" hreflang="fr" href="${frCanonical}" />`,
              `<link rel="alternate" hreflang="en" href="${enCanonical}" />`,
              `<link rel="alternate" hreflang="x-default" href="${frCanonical}" />`,
            ] : []),
            `<title>${sp.title}</title>`,
            `<meta name="description" content="${sp.description.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:title" content="${sp.title.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:description" content="${sp.description.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:url" content="${url}" />`,
            `<meta property="og:site_name" content="ToolTrim" />`,
          ].join("\n    ");

          const staticParagraph = `<noscript><p>${sp.bodyText}</p></noscript>`;

          let html = baseHtml;
          html = html.replace(/(<html[^>]*)lang="[^"]*"/, `$1lang="${spLang}"`);
          html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/, "");
          html = html.replace(/<title>[^<]*<\/title>/, "");
          html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
          html = html.replace("</head>", `    ${metaTags}\n  </head>`);
          html = html.replace("</body>", `    ${staticParagraph}\n  </body>`);

          const outDir = path.resolve(distDir, sp.path.replace(/^\//, ""));
          fs.mkdirSync(outDir, { recursive: true });
          fs.writeFileSync(path.resolve(outDir, "index.html"), html, "utf-8");
        }

        // --- Prerender static section pages (/fr/tools, /fr/guides, etc.) ---
        const SECTION_PAGES: { path: string; lang: string; title: string; description: string }[] = [
          { path: "/fr/tools",      lang: "fr", title: "Tous les outils SaaS pour freelances | ToolTrim",         description: "Comparez 200+ outils SaaS : avis honnêtes, prix vérifiés et alternatives moins chères. Filtrez par catégorie et trouvez la meilleure stack pour votre activité." },
          { path: "/en/tools",      lang: "en", title: "All SaaS tools for freelancers | ToolTrim",               description: "Compare 200+ SaaS tools: honest reviews, verified pricing and cheaper alternatives. Filter by category and find the best stack for your business." },
          { path: "/fr/guides",     lang: "fr", title: "Guides et comparatifs SaaS pour freelances | ToolTrim",   description: "Nos guides pratiques pour choisir les meilleurs outils SaaS : comparatifs, analyses de prix et recommandations par profil freelance." },
          { path: "/en/guides",     lang: "en", title: "SaaS guides and comparisons for freelancers | ToolTrim",  description: "Practical guides to choose the best SaaS tools: comparisons, pricing analyses and recommendations by freelance profile." },
          { path: "/fr/stacks",     lang: "fr", title: "Stacks SaaS types pour freelances | ToolTrim",             description: "Stacks SaaS sobres par profil freelance, budget et niveau de maturité. Des combinaisons d'outils pensées pour vendre, livrer et payer moins." },
          { path: "/en/stacks",     lang: "en", title: "SaaS stack templates for freelancers | ToolTrim",          description: "Lean SaaS stack templates by freelance profile, budget, and maturity. Tool combinations designed to sell, deliver, and pay less." },
          { path: "/fr/comparatifs",lang: "fr", title: "Comparatifs d'outils SaaS 2026 | ToolTrim",              description: "Comparez les meilleurs outils SaaS face à face : fonctionnalités, prix réels et verdict pour chaque profil freelance." },
          { path: "/en/comparatifs",lang: "en", title: "SaaS tool comparisons 2026 | ToolTrim",                  description: "Compare the best SaaS tools head-to-head: features, real pricing and verdict for every freelance profile." },
          { path: "/fr/about",      lang: "fr", title: "À propos de ToolTrim | Audit SaaS indépendant",           description: "ToolTrim est un comparateur indépendant d'outils SaaS. Prix vérifiés manuellement, aucune affiliation commerciale. Notre mission : vous aider à payer moins." },
          { path: "/en/about",      lang: "en", title: "About ToolTrim | Independent SaaS auditor",               description: "ToolTrim is an independent SaaS tool comparator. Manually verified pricing, no commercial affiliation. Our mission: help you pay less." },
          { path: "/fr/contact",    lang: "fr", title: "Contactez ToolTrim | Questions et suggestions",           description: "Vous avez une question sur ToolTrim ou une suggestion d'outil ? Contactez-nous, on répond à tous les messages." },
          { path: "/en/contact",    lang: "en", title: "Contact ToolTrim | Questions and suggestions",            description: "Have a question about ToolTrim or a tool suggestion? Contact us, we reply to every message." },
          { path: "/fr/transparency",lang:"fr", title: "Transparence et méthodologie | ToolTrim",                 description: "Comment ToolTrim évalue les outils SaaS : critères de sélection, fréquence de mise à jour et politique d'indépendance éditoriale." },
          { path: "/en/transparency",lang:"en", title: "Transparency and methodology | ToolTrim",                 description: "How ToolTrim evaluates SaaS tools: selection criteria, update frequency and editorial independence policy." },
        ];

        for (const sp of SECTION_PAGES) {
          const url = `${BASE}${sp.path}`;
          const altLang = sp.lang === "fr" ? "en" : "fr";
          const altPath = sp.path.replace(`/${sp.lang}/`, `/${altLang}/`);
          const metaTags = [
            `<link rel="canonical" href="${url}" />`,
            `<link rel="alternate" hreflang="${sp.lang}" href="${url}" />`,
            `<link rel="alternate" hreflang="${altLang}" href="${BASE}${altPath}" />`,
            `<link rel="alternate" hreflang="x-default" href="${BASE}${sp.path.replace(`/${sp.lang}/`, "/fr/")}" />`,
            `<title>${sp.title}</title>`,
            `<meta name="description" content="${sp.description.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:title" content="${sp.title.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:description" content="${sp.description.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:url" content="${url}" />`,
          ].join("\n    ");

          let html = baseHtml;
          html = html.replace(/(<html[^>]*)lang="[^"]*"/, `$1lang="${sp.lang}"`);
          html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/, "");
          html = html.replace(/<title>[^<]*<\/title>/, "");
          html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
          html = html.replace("</head>", `    ${metaTags}\n  </head>`);

          const outDir = path.resolve(distDir, sp.path.replace(/^\//, ""));
          fs.mkdirSync(outDir, { recursive: true });
          fs.writeFileSync(path.resolve(outDir, "index.html"), html, "utf-8");
        }

        // --- Prerender stack detail pages ---
        for (const stack of STACKS) {
          for (const lang of LANGS) {
            const isFr = lang === "fr";
            const title = isFr
              ? `${stack.title} : outils, usages et budget | ToolTrim`
              : `${stack.titleEn}: tools, use cases and budget | ToolTrim`;
            const description = stack.slug === "developpeur-freelance-shipper"
              ? isFr
                ? "Stack dev freelance pour coder, partager une preview client, documenter et encaisser sans payer une stack produit trop lourde. Budget cible : 32€/mois."
                : "Freelance dev stack to code, share a client preview, document, and get paid without paying for an overweight product stack. Target budget: €32/month."
              : isFr
                ? `${stack.subtitle} Budget cible : ${stack.monthlyBudget}€/mois. Stack organisée par workflow, budget, risques et calibrage.`
                : `${stack.subtitleEn} Target budget: €${stack.monthlyBudget}/month. Stack organized by workflow, budget, risks and calibration.`;
            const url = `${BASE}/${lang}/stacks/${stack.slug}`;
            const frUrl = `${BASE}/fr/stacks/${stack.slug}`;
            const enUrl = `${BASE}/en/stacks/${stack.slug}`;

            const metaTags = [
              `<link rel="canonical" href="${url}" />`,
              `<link rel="alternate" hreflang="fr" href="${frUrl}" />`,
              `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
              `<link rel="alternate" hreflang="x-default" href="${frUrl}" />`,
              `<title>${title.replace(/"/g, "&quot;")}</title>`,
              `<meta name="description" content="${description.replace(/"/g, "&quot;")}" />`,
              `<meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />`,
              `<meta property="og:description" content="${description.replace(/"/g, "&quot;")}" />`,
              `<meta property="og:url" content="${url}" />`,
            ].join("\n    ");

            let html = baseHtml;
            html = html.replace(/(<html[^>]*)lang="[^"]*"/, `$1lang="${lang}"`);
            html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/, "");
            html = html.replace(/<title>[^<]*<\/title>/, "");
            html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
            html = html.replace("</head>", `    ${metaTags}\n  </head>`);
            html = html.replace("</body>", `    <noscript><p>${description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></noscript>\n  </body>`);

            const outDir = path.resolve(distDir, lang, "stacks", stack.slug);
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.resolve(outDir, "index.html"), html, "utf-8");
          }
        }

        // --- Prerender category pages ---
        for (const cat of categories) {
          const slug = cat.slug;
          const frName = ((cat.name || slug).replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+/gu, "").replace(/\s+/g, " ").trim()) || cat.name;
          const frDesc = cat.description || "";
          const enData = CATEGORY_EN[slug] || { name: frName, description: frDesc };

          for (const lang of LANGS) {
            const isFr = lang === "fr";
            const catName = isFr ? frName : enData.name;
            const catDesc = isFr ? frDesc : enData.description;
            const title = isFr
              ? `${catName} : meilleurs outils SaaS pour freelances 2026 | ToolTrim`
              : `${catName}: best SaaS tools for freelancers 2026 | ToolTrim`;
            const description = isFr
              ? `${catDesc} Comparez les meilleurs outils de la catégorie ${catName} : avis, prix vérifiés et alternatives. Recommandations ToolTrim pour freelances.`
              : `${catDesc} Compare the best ${catName} tools: honest reviews, verified pricing and alternatives. ToolTrim recommendations for freelancers.`;
            const url = `${BASE}/${lang}/category/${slug}`;
            const frUrl = `${BASE}/fr/category/${slug}`;
            const enUrl = `${BASE}/en/category/${slug}`;

            const catBreadcrumb = {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "ToolTrim", item: `${BASE}/${lang}` },
                { "@type": "ListItem", position: 2, name: isFr ? "Catégories" : "Categories", item: `${BASE}/${lang}/tools` },
                { "@type": "ListItem", position: 3, name: catName, item: url },
              ],
            };

            const catTools = tools.filter((t: any) => t.categoryId === cat.id).slice(0, 10);
            const itemList = catTools.length > 0 ? {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: isFr ? `Meilleurs outils ${catName}` : `Best ${catName} tools`,
              url,
              numberOfItems: catTools.length,
              itemListElement: catTools.map((t: any, i: number) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${BASE}/${lang}/tool/${t.slug}`,
                name: t.name,
              })),
            } : null;

            const metaTags = [
              `<link rel="canonical" href="${url}" />`,
              `<link rel="alternate" hreflang="fr" href="${frUrl}" />`,
              `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
              `<link rel="alternate" hreflang="x-default" href="${frUrl}" />`,
              `<title>${title}</title>`,
              `<meta name="description" content="${description.replace(/"/g, "&quot;")}" />`,
              `<meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />`,
              `<meta property="og:description" content="${description.replace(/"/g, "&quot;")}" />`,
              `<meta property="og:url" content="${url}" />`,
              `<script type="application/ld+json">${JSON.stringify(catBreadcrumb)}</script>`,
              ...(itemList ? [`<script type="application/ld+json">${JSON.stringify(itemList)}</script>`] : []),
            ].join("\n    ");

            let html = baseHtml;
            html = html.replace(/(<html[^>]*)lang="[^"]*"/, `$1lang="${lang}"`);
            html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/, "");
            html = html.replace(/<title>[^<]*<\/title>/, "");
            html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
            html = html.replace("</head>", `    ${metaTags}\n  </head>`);
            html = html.replace("</body>", `    <noscript><p>${description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></noscript>\n  </body>`);

            const outDir = path.resolve(distDir, lang, "category", slug);
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.resolve(outDir, "index.html"), html, "utf-8");
          }
        }

        // --- Prerender comparison pages ---
        const BRAND_NAMES: Record<string, string> = {
          chatgpt: "ChatGPT", claude: "Claude", github: "GitHub", google: "Google",
          hubspot: "HubSpot", typeform: "Typeform", languagetool: "LanguageTool",
          airtable: "Airtable", midjourney: "Midjourney", semrush: "SEMrush",
          dropbox: "Dropbox", notion: "Notion", zapier: "Zapier", figma: "Figma",
          canva: "Canva", linear: "Linear", jira: "Jira", obsidian: "Obsidian",
          firefly: "Firefly", cursor: "Cursor", grammarly: "Grammarly",
          similarweb: "Similarweb", stripe: "Stripe", razorpay: "Razorpay",
          slack: "Slack", front: "Front", coda: "Coda", vercel: "Vercel",
          replit: "Replit", drive: "Drive", copilot: "Copilot", make: "Make",
          tally: "Tally", loom: "Loom",
        };
        const toBrandName = (slug: string) =>
          slug.split("-").map(w => BRAND_NAMES[w.toLowerCase()] ?? (w.charAt(0).toUpperCase() + w.slice(1))).join(" ");

        const COMPARISONS_PRERENDER = [
          "chatgpt-vs-claude", "dropbox-vs-google-drive", "zapier-vs-make",
          "notion-vs-obsidian", "typeform-vs-tally", "midjourney-vs-firefly",
          "github-copilot-vs-cursor", "grammarly-vs-claude",
          "figma-vs-canva", "linear-vs-jira", "notion-vs-airtable",
          "vercel-vs-replit", "semrush-vs-similarweb", "stripe-vs-razorpay",
          "slack-vs-front", "notion-vs-coda",
        ];
        for (const comp of COMPARISONS_PRERENDER) {
          const parts = comp.split("-vs-");
          const toolA = toBrandName(parts[0]);
          const toolB = parts[1] ? toBrandName(parts[1]) : "";
          const label = `${toolA} vs ${toolB}`;
          for (const lang of LANGS) {
            const isFr = lang === "fr";
            const title = isFr
              ? `${label} : comparatif 2026 | ToolTrim`
              : `${label}: comparison 2026 | ToolTrim`;
            const description = isFr
              ? `Comparatif ${label} : fonctionnalités, prix réels et verdict selon tooltrim.com. Quel outil choisir pour votre stack freelance en 2026 ?`
              : `${label} comparison: features, real pricing and verdict by tooltrim.com. Which tool should you choose for your freelance stack in 2026?`;
            const url = `${BASE}/${lang}/comparatif/${comp}`;
            const frUrl = `${BASE}/fr/comparatif/${comp}`;
            const enUrl = `${BASE}/en/comparatif/${comp}`;

            const compBreadcrumb = {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "ToolTrim", item: `${BASE}/${lang}` },
                { "@type": "ListItem", position: 2, name: isFr ? "Comparatifs" : "Comparisons", item: `${BASE}/${lang}/comparatifs` },
                { "@type": "ListItem", position: 3, name: label, item: url },
              ],
            };

            const metaTags = [
              `<link rel="canonical" href="${url}" />`,
              `<link rel="alternate" hreflang="fr" href="${frUrl}" />`,
              `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
              `<link rel="alternate" hreflang="x-default" href="${frUrl}" />`,
              `<title>${title}</title>`,
              `<meta name="description" content="${description.replace(/"/g, "&quot;")}" />`,
              `<meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />`,
              `<meta property="og:description" content="${description.replace(/"/g, "&quot;")}" />`,
              `<meta property="og:url" content="${url}" />`,
              `<script type="application/ld+json">${JSON.stringify(compBreadcrumb)}</script>`,
            ].join("\n    ");

            let html = baseHtml;
            html = html.replace(/(<html[^>]*)lang="[^"]*"/, `$1lang="${lang}"`);
            html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/, "");
            html = html.replace(/<title>[^<]*<\/title>/, "");
            html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
            html = html.replace("</head>", `    ${metaTags}\n  </head>`);
            html = html.replace("</body>", `    <noscript><p>${description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></noscript>\n  </body>`);

            const outDir = path.resolve(distDir, lang, "comparatif", comp);
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.resolve(outDir, "index.html"), html, "utf-8");
          }
        }

        // --- Prerender blog post / guide pages ---
        const postsFrData: any[] = JSON.parse(fs.readFileSync(path.resolve(__dirname, "src/data/posts-fr.json"), "utf-8"));
        const postsEnData: any[] = JSON.parse(fs.readFileSync(path.resolve(__dirname, "src/data/posts-en.json"), "utf-8"));
        const allPostsData = [
          ...postsFrData.map((p: any) => ({ ...p, lang: "fr" })),
          ...postsEnData.map((p: any) => ({ ...p, lang: "en" })),
        ].filter((post: any) => {
          if (GUIDE_COMPARISON_REDIRECTS.has(post.slug)) return false;
          if (post.lang !== "en") return true;
          if (GUIDE_FR_ONLY_SLUGS.has(post.slug)) return false;
          return !Object.prototype.hasOwnProperty.call(GUIDE_SLUG_ALTERNATES, post.slug);
        });

        for (const post of allPostsData) {
          const lang: string = post.lang;
          const slug: string = post.slug;
          const url = `${BASE}/${lang}/guide/${slug}`;
          const frSlug = lang === "fr" ? slug : GUIDE_EN_TO_FR[slug] || slug;
          const enSlug = lang === "en" ? slug : GUIDE_SLUG_ALTERNATES[slug] || slug;
          const frUrl = `${BASE}/fr/guide/${frSlug}`;
          const enUrl = `${BASE}/en/guide/${enSlug}`;
          const title = post.seo?.metaTitle || post.title || slug;
          const description = post.seo?.metaDescription || post.excerpt || "";

          const postBreadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "ToolTrim", item: `${BASE}/${lang}` },
              { "@type": "ListItem", position: 2, name: lang === "fr" ? "Guides" : "Guides", item: `${BASE}/${lang}/guides` },
              { "@type": "ListItem", position: 3, name: post.title || slug, item: url },
            ],
          };

          const articleSchema = {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title || slug,
            description: description,
            datePublished: post.date || "",
            dateModified: post.date || "",
            author: {
              "@type": "Person",
              name: "Équipe ToolTrim",
              url: `${BASE}/methodology`,
            },
            publisher: { "@type": "Organization", name: "ToolTrim", url: BASE, logo: { "@type": "ImageObject", url: `${BASE}/og-image.png` } },
            url,
          };

          // FAQPage schema: use pre-built seo.schema if available, else build from faq[]
          let faqSchema: object | null = null;
          if (post.seo?.schema?.["@type"] === "FAQPage") {
            faqSchema = post.seo.schema;
          } else if (Array.isArray(post.faq) && post.faq.length > 0) {
            faqSchema = {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: post.faq.map((item: any) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            };
          }

          const postMetaTags = [
            `<link rel="canonical" href="${url}" />`,
            `<link rel="alternate" hreflang="fr" href="${frUrl}" />`,
            `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
            `<link rel="alternate" hreflang="x-default" href="${frUrl}" />`,
            `<title>${title.replace(/</g, "&lt;")}</title>`,
            `<meta name="description" content="${description.replace(/"/g, "&quot;").substring(0, 160)}" />`,
            `<meta property="og:type" content="article" />`,
            `<meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:description" content="${description.replace(/"/g, "&quot;").substring(0, 160)}" />`,
            `<meta property="og:url" content="${url}" />`,
            `<meta property="og:image" content="${BASE}/og-image.png" />`,
            `<meta name="twitter:image" content="${BASE}/og-image.png" />`,
            ...(post.seo?.keywords ? [`<meta name="keywords" content="${post.seo.keywords.replace(/"/g, "&quot;")}" />`] : []),
            `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`,
            `<script type="application/ld+json">${JSON.stringify(postBreadcrumb)}</script>`,
            ...(faqSchema ? [`<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`] : []),
          ].join("\n    ");

          let html = baseHtml;
          html = html.replace(/(<html[^>]*)lang="[^"]*"/, `$1lang="${lang}"`);
          html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/, "");
          html = html.replace(/<title>[^<]*<\/title>/, "");
          html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
          html = html.replace("</head>", `    ${postMetaTags}\n  </head>`);
          html = html.replace("</body>", `    <noscript><p>${description.replace(/</g, "&lt;").replace(/>/g, "&gt;").substring(0, 300)}</p></noscript>\n  </body>`);

          const outDir = path.resolve(distDir, lang, "guide", slug);
          fs.mkdirSync(outDir, { recursive: true });
          fs.writeFileSync(path.resolve(outDir, "index.html"), html, "utf-8");
          count++;
        }

        // --- Generate 404.html for Vercel custom error page ---
        const meta404 = [
          `<title>Page introuvable | ToolTrim</title>`,
          `<meta name="description" content="Cette page n'existe pas. Découvrez nos avis et comparatifs d'outils SaaS sur ToolTrim." />`,
          `<meta name="robots" content="noindex, follow" />`,
        ].join("\n    ");
        let html404 = baseHtml;
        html404 = html404.replace(/<link\s+rel="canonical"[^>]*\/?>/, "");
        html404 = html404.replace(/<title>[^<]*<\/title>/, "");
        html404 = html404.replace(/<meta\s+name="description"[^>]*\/?>/, "");
        html404 = html404.replace("</head>", `    ${meta404}\n  </head>`);
        fs.writeFileSync(path.resolve(distDir, "404.html"), html404, "utf-8");

        const subPageCount = tools.length * 2 * 4; // 4 sub-pages (prix, alternatives, faq, avis) × 2 langs
        const guidesCount = allPostsData.length;
        console.log(`✅ Prerender : ${count} tool pages + ${subPageCount} tool sub-pages + 3 landings + ${SEO_PAGES.length} SEO/pillar pages + ${SECTION_PAGES.length} section pages + ${categories.length * 2} category pages (ItemList) + ${COMPARISONS_PRERENDER.length * 2} comparisons + ${guidesCount} guide pages (Article + FAQPage) + 404.html`);
      } catch (e) {
        console.warn("⚠️ Prerender failed:", e);
      }
    },
  };
}

/**
 * Extracts the small, foundational slice of index.css (CSS variables,
 * @font-face, base resets) that the rest of the page depends on to avoid
 * broken colors (unresolved var() falling back to transparent/black), then
 * inlines it and defers the main stylesheet so it stops blocking render.
 * Built from src/index.css directly (not a hand-maintained copy) so the two
 * never drift apart.
 */
function extractCriticalCss(): string {
  const css = fs.readFileSync(path.resolve(__dirname, "src/index.css"), "utf-8");
  const root = postcss.parse(css);
  const critical: string[] = [];

  root.walkAtRules("font-face", (rule) => {
    critical.push(rule.toString());
  });

  root.walkRules((rule) => {
    const sel = rule.selector.trim();
    if (sel === ":root" || sel === ".dark") {
      let inMediaGutter = false;
      let p = rule.parent;
      while (p) {
        if (p.type === "atrule" && p.name === "media" && /max-width:\s*(1023|767)px/.test(p.params)) {
          inMediaGutter = true;
        }
        p = p.parent;
      }
      // Top-level :root/.dark (not the responsive --layout-gutter overrides,
      // those are non-critical and can arrive with the deferred stylesheet)
      if (!inMediaGutter) critical.push(rule.toString());
    }
    if (sel === "body") critical.push(rule.toString());
  });

  return critical.join("\n\n");
}

function criticalCssPlugin(): Plugin {
  let criticalCss = "";
  return {
    name: "critical-css-inline",
    apply: "build",
    buildStart() {
      criticalCss = extractCriticalCss();
    },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        // 1. Inline the critical slice right at the top of <head>, so it's
        //    available before anything else in the document.
        let out = html.replace(
          "<head>",
          `<head>\n    <style id="critical-css">${criticalCss}</style>`
        );
        // 2. Defer the main stylesheet Vite injected (same pattern already
        //    used for Google Fonts below) so it no longer blocks render.
        out = out.replace(
          /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/,
          (_match, href) =>
            `<link rel="stylesheet" crossorigin href="${href}" media="print" onload="this.media='all'">\n` +
            `    <noscript><link rel="stylesheet" crossorigin href="${href}" /></noscript>`
        );
        return out;
      },
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // These three only make sense for the client build — they write into
    // dist/ (sitemap, prerendered HTML) or transform index.html, none of
    // which exist/apply during the separate `vite build --ssr` pass.
    !isSsrBuild && sitemapPlugin(),
    !isSsrBuild && criticalCssPlugin(),
    !isSsrBuild && staticPrerenderPlugin(),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: isSsrBuild ? undefined : {
        manualChunks(id) {
          // Data chunks only — vendor splitting is left to Vite's defaults
          // to avoid circular reference issues between React chunks
          if (id.includes("/src/data/tools_v4.json")) return "data-tools";
          if (id.includes("/src/data/tools_index.json")) return "data-tool-index";
          if (id.includes("/src/data/categories_index.json")) return "data-category-index";
          if (id.includes("/src/data/content.json")) return "data-content";
          if (id.includes("/src/data/posts-fr.json")) return "data-posts-fr";
          if (id.includes("/src/data/posts-en.json")) return "data-posts-en";
          if (id.includes("/src/data/stacks.ts")) return "data-stacks";
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
