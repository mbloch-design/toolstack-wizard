import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { STACKS } from "./src/data/stacks";

const BASE = "https://www.tooltrim.com";
const LANGS = ["fr", "en"];
// /selector excluded from sitemap (noindex tunnel)
const STATIC_PAGES = ["", "tools", "category", "guides", "stacks", "about", "methodology", "transparency", "contact"];
const EXCLUDE_SITEMAP_PATTERNS = ["/selector/results", "/methodology"];

// SEO landing + persona pillar pages (localized slugs)
const SEO_LANDING_PAGES: { path: string; priority: string }[] = [
  { path: "/fr/audit-saas-gratuit", priority: "0.9" },
  { path: "/en/free-saas-audit", priority: "0.9" },
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

const PERSONA_PILLARS: { path: string; priority: string }[] = [
  { path: "/fr/guide/meilleurs-outils-developpeur-freelance", priority: "0.8" },
  { path: "/fr/guide/meilleurs-outils-designer-freelance", priority: "0.8" },
  { path: "/fr/guide/meilleurs-outils-consultant-freelance", priority: "0.8" },
  { path: "/fr/guide/meilleurs-outils-createur-contenu-freelance", priority: "0.8" },
  { path: "/fr/guide/meilleurs-outils-ops-manager-freelance", priority: "0.8" },
  { path: "/en/guide/best-tools-freelance-developer", priority: "0.8" },
  { path: "/en/guide/best-tools-freelance-designer", priority: "0.8" },
  { path: "/en/guide/best-tools-freelance-consultant", priority: "0.8" },
  { path: "/en/guide/best-tools-freelance-content-creator", priority: "0.8" },
  { path: "/en/guide/best-tools-freelance-ops-manager", priority: "0.8" },
];

function buildToolMetaDesc(tool: any, lang: string): string {
  const short = lang === "fr"
    ? tool.shortDescription || ""
    : tool.shortDescriptionEn || tool.shortDescription || "";
  const long = lang === "fr"
    ? tool.longDescription || ""
    : tool.longDescriptionEn || tool.longDescription || "";

  // If short desc is already long enough, use it
  if (short.length >= 110) return short.substring(0, 160);

  // Try to enrich with pricing info
  let desc = short;
  const pricingFree: string = tool.pricing?.free || "";
  const pricingPaid: string = tool.pricing?.paid || "";
  const price: number = tool.defaultMonthlyPrice || 0;

  if (lang === "fr") {
    if (pricingFree && desc.length + pricingFree.length + 12 < 155) {
      desc = desc ? `${desc} Gratuit : ${pricingFree}.` : `Gratuit : ${pricingFree}.`;
    } else if (price > 0 && desc.length + 25 < 155) {
      desc = desc ? `${desc} À partir de ${price}€/mois.` : `À partir de ${price}€/mois.`;
    } else if (pricingPaid && desc.length + pricingPaid.length + 8 < 155) {
      desc = desc ? `${desc} Payant : ${pricingPaid}.` : pricingPaid;
    }
    // If still short, prepend first sentence of longDescription
    if (desc.length < 110 && long) {
      const sentence = long.split(/(?<=[.!?])\s/)[0] || "";
      if (sentence.length > 30) desc = sentence.substring(0, 160).trim();
    }
    // Last resort: add a keepIf
    if (desc.length < 80 && tool.verdict?.keepIf?.[0]) {
      desc = `${desc} Idéal si : ${tool.verdict.keepIf[0]}.`;
    }
  } else {
    if (price > 0 && desc.length + 20 < 155) {
      desc = desc ? `${desc} From €${price}/month.` : `From €${price}/month.`;
    } else if (pricingPaid && desc.length + pricingPaid.length + 9 < 155) {
      desc = desc ? `${desc} Paid: ${pricingPaid}.` : pricingPaid;
    }
    if (desc.length < 110 && long) {
      const sentence = long.split(/(?<=[.!?])\s/)[0] || "";
      if (sentence.length > 30) desc = sentence.substring(0, 160).trim();
    }
  }

  return (desc || short).substring(0, 160).trim();
}

function sitemapPlugin(): Plugin {
  return {
    name: "generate-sitemap",
    closeBundle() {
      try {
        const raw = fs.readFileSync(path.resolve(__dirname, "src/data/content.json"), "utf-8");
        const data = JSON.parse(raw);
        const toolsRaw = fs.readFileSync(path.resolve(__dirname, "src/data/tools_v4.json"), "utf-8");
        const categoriesRaw = fs.readFileSync(path.resolve(__dirname, "src/data/categories_index.json"), "utf-8");
        const tools = JSON.parse(toolsRaw);
        const categories = JSON.parse(categoriesRaw);
        const urls: string[] = [];

        const buildDate = new Date().toISOString().split("T")[0];
        const add = (loc: string, freq: string, prio: string, lastmod = buildDate) => {
          urls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`);
        };

        for (const lang of LANGS) {
          for (const page of STATIC_PAGES) {
            const p = page ? `/${lang}/${page}` : `/${lang}`;
            const prio = page === "" ? "1.0" : page === "tools" ? "0.9" : "0.7";
            add(`${BASE}${p}`, page === "" ? "daily" : "weekly", prio);
          }
        }

        for (const t of tools || []) {
          const slug = t.slug || t.id;
          for (const lang of LANGS) {
            add(`${BASE}/${lang}/tool/${slug}`, "weekly", "0.8");
            // Sub-pages: own URL, own canonical, own SEO intent
            add(`${BASE}/${lang}/tool/${slug}/prix`, "monthly", "0.7");
            add(`${BASE}/${lang}/tool/${slug}/alternatives`, "monthly", "0.7");
            add(`${BASE}/${lang}/tool/${slug}/faq`, "monthly", "0.6");
          }
        }

        for (const c of categories || []) {
          for (const lang of LANGS) {
            add(`${BASE}/${lang}/category/${c.slug}`, "weekly", "0.7");
          }
        }

        for (const a of data.articles || []) {
          const lang = a.lang || "fr";
          const articleDate = a.date || buildDate;
          add(`${BASE}/${lang}/guide/${a.slug}`, "monthly", "0.6", articleDate);
        }

        // Posts from posts-fr.json and posts-en.json
        const postsFrRaw = fs.readFileSync(path.resolve(__dirname, "src/data/posts-fr.json"), "utf-8");
        const postsEnRaw = fs.readFileSync(path.resolve(__dirname, "src/data/posts-en.json"), "utf-8");
        const allPosts = [
          ...(JSON.parse(postsFrRaw) as any[]).map((p: any) => ({ ...p, lang: "fr" })),
          ...(JSON.parse(postsEnRaw) as any[]).map((p: any) => ({ ...p, lang: "en" })),
        ];
        const contentArticleSlugs = new Set((data.articles || []).map((a: any) => a.slug));
        for (const post of allPosts) {
          if (!contentArticleSlugs.has(post.slug)) {
            add(`${BASE}/${post.lang}/guide/${post.slug}`, "monthly", "0.7", post.date || buildDate);
          }
        }

        // Comparative guides with localized slugs
        const GUIDE_COMPARISONS: [string, string][] = [
          ["notion-vs-coda-comparatif-2026", "notion-vs-coda-comparison-2026"],
          ["chatgpt-vs-claude-comparatif-2026", "chatgpt-vs-claude-comparison-2026"],
          ["zapier-vs-make-comparatif-2026", "zapier-vs-make-comparison-2026"],
          ["figma-vs-canva-comparatif-2026", "figma-vs-canva-comparison-2026"],
          ["slack-vs-teams-comparatif-2026", "slack-vs-teams-comparison-2026"],
        ];
        for (const [frSlug, enSlug] of GUIDE_COMPARISONS) {
          add(`${BASE}/fr/guide/${frSlug}`, "monthly", "0.7");
          add(`${BASE}/en/guide/${enSlug}`, "monthly", "0.7");
        }

        // Comparisons index page
        for (const lang of LANGS) {
          add(`${BASE}/${lang}/comparatifs`, "weekly", "0.8");
        }

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
            add(`${BASE}/${lang}/comparatif/${comp}`, "monthly", "0.7");
          }
        }

        // SEO landing pages (audit)
        for (const lp of SEO_LANDING_PAGES) {
          add(`${BASE}${lp.path}`, "monthly", lp.priority);
        }

        // Stack hub + stack detail pages
        for (const stack of STACKS) {
          for (const lang of LANGS) {
            add(`${BASE}/${lang}/stacks/${stack.slug}`, "monthly", "0.7");
          }
        }

        // Persona pillar pages
        for (const pp of PERSONA_PILLARS) {
          add(`${BASE}${pp.path}`, "monthly", pp.priority);
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

        const distPath = path.resolve(__dirname, "dist/sitemap.xml");
        
        if (fs.existsSync(path.resolve(__dirname, "dist"))) {
          fs.writeFileSync(distPath, xml, "utf-8");
        }
        
        console.log(`✅ Sitemap generated with ${urls.length} URLs`);
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
    closeBundle() {
      try {
        const toolsRaw = fs.readFileSync(path.resolve(__dirname, "src/data/tools_v4.json"), "utf-8");
        const categoriesRaw = fs.readFileSync(path.resolve(__dirname, "src/data/categories_index.json"), "utf-8");
        const tools = JSON.parse(toolsRaw);
        const categories = JSON.parse(categoriesRaw);

        const distDir = path.resolve(__dirname, "dist");
        const indexPath = path.resolve(distDir, "index.html");
        if (!fs.existsSync(indexPath)) {
          console.warn("⚠️ Prerender: dist/index.html not found, skipping");
          return;
        }
        const baseHtml = fs.readFileSync(indexPath, "utf-8");
        let count = 0;

        for (const tool of tools) {
          const slug = tool.slug || tool.id;
          const name = tool.name || slug;
          const price = tool.defaultMonthlyPrice || null;

          for (const lang of LANGS) {
            const isFr = lang === "fr";
            const title = isFr
              ? `${name} — Avis, prix et alternatives | ToolTrim`
              : `${name} — Review, pricing and alternatives | ToolTrim`;
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
            if (price && typeof price === "number" && price > 0) {
              jsonLd.offers = {
                "@type": "Offer",
                price: price.toString(),
                priceCurrency: "EUR",
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
              `<meta property="og:image" content="https://www.tooltrim.com/og-image.png" />`,
              `<meta name="twitter:image" content="https://www.tooltrim.com/og-image.png" />`,
              `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
              `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
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
              ? `${name} — ${description} Avis, prix vérifiés et alternatives moins chères sur ToolTrim.`
              : `${name} — ${description} Honest review, verified pricing and cheaper alternatives on ToolTrim.`;
            html = html.replace("</body>", `    <noscript><p>${toolBodyText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></noscript>\n  </body>`);

            const outDir = path.resolve(distDir, lang, "tool", slug);
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.resolve(outDir, "index.html"), html, "utf-8");
            count++;
          }
        }

        // --- Prerender tool sub-pages: /prix, /alternatives, /faq ---
        type SubPageDef = {
          path: string;
          buildTitle: (name: string, isFr: boolean) => string;
          buildDesc: (name: string, price: number | null, isFr: boolean) => string;
          buildBody: (name: string, price: number | null, isFr: boolean) => string;
        };
        const TOOL_SUB_PAGES: SubPageDef[] = [
          {
            path: "prix",
            buildTitle: (name, isFr) => isFr
              ? `${name} : prix et tarifs 2026 | ToolTrim`
              : `${name} pricing & plans 2026 | ToolTrim`,
            buildDesc: (name, price, isFr) => isFr
              ? (price ? `Combien coûte vraiment ${name} ? Plans, tarifs détaillés et comparaison — mis à jour 2026. Vaut-il ses ${price}€/mois ?` : `Plans et tarifs de ${name} : gratuit, freemium ou payant ? Toutes les options décryptées par ToolTrim.`)
              : (price ? `How much does ${name} really cost? Detailed plans, pricing breakdown — updated 2026. Is it worth €${price}/mo?` : `${name} plans and pricing: free, freemium or paid? All options explained by ToolTrim.`),
            buildBody: (name, price, isFr) => isFr
              ? `Retrouvez tous les plans et tarifs de ${name}${price ? ` (à partir de ${price}€/mois)` : ""} sur ToolTrim. Analyse indépendante du rapport qualité-prix et des alternatives moins chères.`
              : `Find all ${name} plans and pricing${price ? ` (from €${price}/month)` : ""} on ToolTrim. Independent analysis of value for money and cheaper alternatives.`,
          },
          {
            path: "alternatives",
            buildTitle: (name, isFr) => isFr
              ? `Meilleures alternatives à ${name} en 2026 | ToolTrim`
              : `Best ${name} alternatives in 2026 | ToolTrim`,
            buildDesc: (name, _price, isFr) => isFr
              ? `Quelles sont les meilleures alternatives à ${name} ? ToolTrim compare les options moins chères, gratuites ou plus adaptées — mise à jour 2026.`
              : `What are the best alternatives to ${name}? ToolTrim compares cheaper, free and better-fit options — updated 2026.`,
            buildBody: (name, _price, isFr) => isFr
              ? `Alternatives à ${name} sélectionnées par ToolTrim : comparaison des fonctionnalités, des prix et du positionnement pour chaque profil freelance.`
              : `${name} alternatives selected by ToolTrim: feature comparison, pricing and positioning for every freelance profile.`,
          },
          {
            path: "faq",
            buildTitle: (name, isFr) => isFr
              ? `${name} : questions fréquentes 2026 | ToolTrim`
              : `${name} FAQ 2026 | ToolTrim`,
            buildDesc: (name, _price, isFr) => isFr
              ? `Toutes les questions fréquentes sur ${name} : prix, plans, alternatives, intégrations et conseils d'utilisation — réponses ToolTrim 2026.`
              : `All frequently asked questions about ${name}: pricing, plans, alternatives, integrations and usage tips — ToolTrim answers 2026.`,
            buildBody: (name, _price, isFr) => isFr
              ? `FAQ sur ${name} par ToolTrim : combien ça coûte, quelles alternatives, comment annuler, est-ce que ça vaut le coup pour un freelance ?`
              : `${name} FAQ by ToolTrim: how much does it cost, what are the alternatives, how to cancel, is it worth it for a freelancer?`,
          },
        ];

        for (const tool of tools) {
          const slug = tool.slug || tool.id;
          const name = tool.name || slug;
          const price: number | null = tool.defaultMonthlyPrice || null;

          for (const lang of LANGS) {
            const isFr = lang === "fr";
            for (const sub of TOOL_SUB_PAGES) {
              const url      = `${BASE}/${lang}/tool/${slug}/${sub.path}`;
              const frUrl    = `${BASE}/fr/tool/${slug}/${sub.path}`;
              const enUrl    = `${BASE}/en/tool/${slug}/${sub.path}`;
              const mainUrl  = `${BASE}/${lang}/tool/${slug}`;
              const title    = sub.buildTitle(name, isFr);
              const desc     = sub.buildDesc(name, price, isFr);
              const bodyText = sub.buildBody(name, price, isFr);

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
                `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
              ].join("\n    ");

              let html = baseHtml;
              html = html.replace(/(<html[^>]*)lang="[^"]*"/, `$1lang="${lang}"`);
              html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/, "");
              html = html.replace(/<title>[^<]*<\/title>/, "");
              html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
              html = html.replace("</head>", `    ${metaTags}\n  </head>`);
              html = html.replace("</body>", `    <noscript><p>${bodyText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></noscript>\n  </body>`);

              const outDir = path.resolve(distDir, lang, "tool", slug, sub.path);
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
            title: "ToolTrim — Optimisez votre stack SaaS | Avis, prix et alternatives",
            description: "ToolTrim analyse vos outils SaaS et vous aide à réduire vos coûts. Comparez les prix, découvrez des alternatives gratuites et optimisez votre stack en quelques clics.",
            bodyText: "ToolTrim est le comparateur indépendant d'outils SaaS pour freelances, startups et équipes tech. Analysez votre stack actuelle, identifiez les abonnements inutiles et découvrez des alternatives plus économiques. Chaque outil est testé manuellement pendant 2 à 4 semaines. Nos recommandations sont neutres, vérifiées et conçues pour vous faire gagner du temps et de l'argent.",
          },
          {
            file: "fr/index.html",
            lang: "fr",
            canonical: `${BASE}/fr`,
            title: "ToolTrim — Optimisez votre stack SaaS | Avis, prix et alternatives",
            description: "ToolTrim analyse vos outils SaaS et vous aide à réduire vos coûts. Comparez les prix, découvrez des alternatives gratuites et optimisez votre stack en quelques clics.",
            bodyText: "ToolTrim est le comparateur indépendant d'outils SaaS pour freelances, startups et équipes tech. Analysez votre stack actuelle, identifiez les abonnements inutiles et découvrez des alternatives plus économiques. Chaque outil est testé manuellement pendant 2 à 4 semaines. Nos recommandations sont neutres, vérifiées et conçues pour vous faire gagner du temps et de l'argent.",
          },
          {
            file: "en/index.html",
            lang: "en",
            canonical: `${BASE}/en`,
            title: "ToolTrim — Optimize your SaaS stack | Reviews, pricing & alternatives",
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
            title: "Audit SaaS gratuit pour freelances — Optimisez votre stack en 5 min | tooltrim.com",
            description: "Combien gaspillez-vous en abonnements SaaS ? Audit gratuit : détectez doublons, fantômes et outils inadaptés. Selon tooltrim.com, 35% des freelances paient en double.",
            bodyText: "Auditez votre stack SaaS en 5 minutes. Détectez les doublons, abonnements fantômes et gaspillage dans vos outils freelance. Selon tooltrim.com, 35% des freelances paient en double pour des outils qui se chevauchent — économie moyenne récupérable : 485€/mois.",
          },
          {
            path: "/en/free-saas-audit",
            title: "Free SaaS audit for freelancers — Optimize your stack in 5 min | tooltrim.com",
            description: "How much are you wasting on SaaS subscriptions? Free audit: detect duplicates, ghost subs and misfit tools. According to tooltrim.com, 35% of freelancers overpay.",
            bodyText: "Audit your SaaS stack in 5 minutes. Detect duplicates, ghost subscriptions and waste in your freelance toolset. According to tooltrim.com, 35% of freelancers pay twice for overlapping tools — average recoverable waste: €485/month.",
          },
          {
            path: "/fr/guide/meilleurs-outils-developpeur-freelance",
            title: "Meilleurs outils pour développeur freelance en 2026 | tooltrim.com",
            description: "Stack idéale pour dev freelance : Cursor, Vercel, Supabase, ChatGPT Pro… Selon tooltrim.com, un développeur freelance dépense 280€/mois en SaaS. Voici comment optimiser.",
            bodyText: "Un développeur freelance utilise en moyenne 12 outils SaaS pour 280€/mois. Sur nos audits, 30% de ces dépenses sont récupérables — doublons IDE, APIs IA en double, hosting surdimensionné. Voici la stack optimale selon tooltrim.com.",
          },
          {
            path: "/fr/guide/meilleurs-outils-designer-freelance",
            title: "Meilleurs outils pour designer freelance en 2026 | tooltrim.com",
            description: "Stack créative optimale : Figma, Adobe CC, Midjourney, Loom… Selon tooltrim.com, un designer freelance dépense 350€/mois en SaaS. 40% est récupérable.",
            bodyText: "Un designer freelance dépense en moyenne 350€/mois en outils — le budget SaaS le plus élevé parmi nos 5 personas. Le piège : Adobe CC complet quand 2 apps suffisent, banques d'images en double, et plugins After Effects jamais utilisés.",
          },
          {
            path: "/fr/guide/meilleurs-outils-consultant-freelance",
            title: "Meilleurs outils pour consultant freelance en 2026 | tooltrim.com",
            description: "Stack conseil optimale : Calendly, HubSpot, Zoom, Notion… Selon tooltrim.com, un consultant dépense 180€/mois en SaaS.",
            bodyText: "Un consultant freelance dépense en moyenne 180€/mois en outils SaaS. Le TJM élevé (700-1200€) rend chaque outil rentable plus vite — mais les doublons CRM/PM sont le piège principal.",
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
            bodyText: "A freelance developer uses 12 SaaS tools on average for €280/month. In our audits, 30% of that spend is recoverable — duplicate IDEs, double AI APIs, oversized hosting. Here's the optimal stack according to tooltrim.com.",
          },
          {
            path: "/en/guide/best-tools-freelance-designer",
            title: "Best tools for freelance designers in 2026 | tooltrim.com",
            description: "Optimal creative stack: Figma, Adobe CC, Midjourney… According to tooltrim.com, a freelance designer spends €350/mo on SaaS. 40% is recoverable.",
            bodyText: "A freelance designer spends €350/month on tools on average — the highest SaaS budget among our 5 personas. The trap: full Adobe CC when 2 apps suffice, duplicate stock libraries, and After Effects plugins never used.",
          },
          {
            path: "/en/guide/best-tools-freelance-consultant",
            title: "Best tools for freelance consultants in 2026 | tooltrim.com",
            description: "Optimal consulting stack: Calendly, HubSpot, Zoom, Notion… According to tooltrim.com, a freelance consultant spends €180/mo on SaaS.",
            bodyText: "A freelance consultant spends €180/month on SaaS tools on average. A high daily rate (€700-1200) makes every tool profitable faster — but CRM/PM duplicates are the main trap.",
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
            title: "Loom Pricing 2026: Worth It for Freelancers? Honest Review + Alternatives — tooltrim.com",
            description: "Loom costs $15/month per user in 2026. According to tooltrim.com, 68% of freelancers who pay for Loom use less than 20% of its features. Verdict and 4 cheaper alternatives.",
            bodyText: "Loom Business at $15/user/month is only worth it if you send more than 8 recorded videos per week. Below that threshold, you're overpaying. According to tooltrim.com, the free plan covers 60% of solo freelance use cases — and Tella, Claap or Scribe match 80% of Loom's features for less.",
          },
          {
            path: "/fr/guide/loom-prix-alternatives",
            title: "Prix Loom 2026 : ça vaut le coup pour un freelance ? Avis honnête + alternatives — tooltrim.com",
            description: "Loom coûte 15$/mois par utilisateur en 2026. Selon tooltrim.com, 68% des freelances qui payent Loom utilisent moins de 20% de ses fonctionnalités. Verdict et 4 alternatives moins chères.",
            bodyText: "Loom Business à 15$/utilisateur/mois ne vaut le coup que si tu envoies plus de 8 vidéos enregistrées par semaine. En dessous, tu surpayes. Selon tooltrim.com, le plan gratuit couvre 60% des cas d'usage freelance solo — et Tella, Claap ou Scribe couvrent 80% des fonctions de Loom pour moins cher.",
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
            path: "/en/guide/ai-tips-freelancers-2026",
            title: "AI Tips for Freelancers in 2026: Minimal Stack, Prompts That Actually Work, and Cutting the Waste | tooltrim.com",
            description: "Minimal AI stack, role-based prompts and waste audit. According to tooltrim.com, 62% of freelancers pay for two AIs in parallel. Honest verdict + real ROI.",
            bodyText: "In 2026, a freelancer needs one general-purpose AI subscription (ChatGPT Plus or Claude Pro) plus one role-specific tool. According to tooltrim.com, 62% of freelancers stack ChatGPT + Claude + Perplexity + Copilot for $60-80/month when one tool would suffice. Average recoverable saving: $45/month.",
          },
        ];

        for (const sp of SEO_PAGES) {
          const url = `${BASE}${sp.path}`;
          const spLang = sp.path.startsWith("/en/") ? "en" : "fr";
          const metaTags = [
            `<link rel="canonical" href="${url}" />`,
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
          { path: "/en/contact",    lang: "en", title: "Contact ToolTrim | Questions and suggestions",            description: "Have a question about ToolTrim or a tool suggestion? Contact us — we reply to every message." },
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
            const description = isFr
              ? `${stack.subtitle} Budget cible : ${stack.monthlyBudget}€/mois. Stack divisée par usages, risques et alternatives.`
              : `${stack.subtitleEn} Target budget: €${stack.monthlyBudget}/month. Stack divided by use cases, risks and alternatives.`;
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
              ? `${catName} — Meilleurs outils SaaS pour freelances | ToolTrim`
              : `${catName} — Best SaaS tools for freelancers | ToolTrim`;
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
              ? `${label} — Comparatif 2026 | ToolTrim`
              : `${label} — Comparison 2026 | ToolTrim`;
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
        ];

        for (const post of allPostsData) {
          const lang: string = post.lang;
          const slug: string = post.slug;
          const url = `${BASE}/${lang}/guide/${slug}`;
          const frUrl = `${BASE}/fr/guide/${slug}`;
          const enUrl = `${BASE}/en/guide/${slug}`;
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

          const postMetaTags = [
            `<link rel="canonical" href="${url}" />`,
            `<link rel="alternate" hreflang="fr" href="${frUrl}" />`,
            `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
            `<link rel="alternate" hreflang="x-default" href="${frUrl}" />`,
            `<title>${title.replace(/</g, "&lt;")}</title>`,
            `<meta name="description" content="${description.replace(/"/g, "&quot;").substring(0, 160)}" />`,
            `<meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:description" content="${description.replace(/"/g, "&quot;").substring(0, 160)}" />`,
            `<meta property="og:url" content="${url}" />`,
            `<meta property="og:image" content="https://www.tooltrim.com/og-image.png" />`,
            `<meta name="twitter:image" content="https://www.tooltrim.com/og-image.png" />`,
            ...(post.seo?.keywords ? [`<meta name="keywords" content="${post.seo.keywords.replace(/"/g, "&quot;")}" />`] : []),
            `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`,
            `<script type="application/ld+json">${JSON.stringify(postBreadcrumb)}</script>`,
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

        const subPageCount = tools.length * 2 * 3; // 3 sub-pages × 2 langs
        console.log(`✅ Prerender : ${count} tool pages + ${subPageCount} tool sub-pages (/prix, /alternatives, /faq) + 3 landings + ${SEO_PAGES.length} SEO pages + ${SECTION_PAGES.length} sections + ${categories.length * 2} categories + ${COMPARISONS_PRERENDER.length * 2} comparisons + 404.html`);
      } catch (e) {
        console.warn("⚠️ Prerender failed:", e);
      }
    },
  };
}



// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
    sitemapPlugin(),
    staticPrerenderPlugin(),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/src/data/tools_v4.json")) return "data-tools";
          if (id.includes("/src/data/tools_index.json")) return "data-tool-index";
          if (id.includes("/src/data/categories_index.json")) return "data-category-index";
          if (id.includes("/src/data/content.json")) return "data-content";
          if (id.includes("/src/data/posts-fr.json")) return "data-posts-fr";
          if (id.includes("/src/data/posts-en.json")) return "data-posts-en";
          if (id.includes("/src/data/")) return "data-catalog";
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
