import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

const BASE = "https://www.tooltrim.io";
const LANGS = ["fr", "en"];
// /selector excluded from sitemap (noindex tunnel)
const STATIC_PAGES = ["", "tools", "category", "guides", "about", "methodology", "transparency", "contact"];
const EXCLUDE_SITEMAP_PATTERNS = ["/selector/results", "/methodology"];

// SEO landing + persona pillar pages (localized slugs)
const SEO_LANDING_PAGES: { path: string; priority: string }[] = [
  { path: "/fr/audit-saas-gratuit", priority: "0.9" },
  { path: "/en/free-saas-audit", priority: "0.9" },
];

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

function sitemapPlugin(): Plugin {
  return {
    name: "generate-sitemap",
    closeBundle() {
      try {
        const raw = fs.readFileSync(path.resolve(__dirname, "src/data/content.json"), "utf-8");
        const data = JSON.parse(raw);
        const urls: string[] = [];

        const add = (loc: string, freq: string, prio: string) => {
          urls.push(`  <url>\n    <loc>${loc}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`);
        };

        for (const lang of LANGS) {
          for (const page of STATIC_PAGES) {
            const p = page ? `/${lang}/${page}` : `/${lang}`;
            const prio = page === "" ? "1.0" : page === "tools" ? "0.9" : "0.7";
            add(`${BASE}${p}`, page === "" ? "daily" : "weekly", prio);
          }
        }

        for (const t of data.tools || []) {
          const slug = t.slug || t.id;
          for (const lang of LANGS) {
            add(`${BASE}/${lang}/tool/${slug}`, "weekly", "0.8");
          }
        }

        for (const c of data.categories || []) {
          for (const lang of LANGS) {
            add(`${BASE}/${lang}/category/${c.slug}`, "weekly", "0.7");
          }
        }

        for (const a of data.articles || []) {
          const lang = a.lang || "fr";
          add(`${BASE}/${lang}/guide/${a.slug}`, "monthly", "0.6");
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
        const contentRaw = fs.readFileSync(path.resolve(__dirname, "src/data/content.json"), "utf-8");
        const content = JSON.parse(contentRaw);
        const tools = content.tools || [];

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
          const descFr = tool.shortDescription || tool.longDescription || "";
          const descEn = tool.shortDescriptionEn || tool.longDescriptionEn || descFr;
          const price = tool.defaultMonthlyPrice || tool.pricing?.paid || null;

          for (const lang of LANGS) {
            const isFr = lang === "fr";
            const title = isFr
              ? `${name} — Avis, prix et alternatives | ToolTrim`
              : `${name} — Review, pricing and alternatives | ToolTrim`;
            const description = isFr ? descFr : descEn;
            const url = `https://www.tooltrim.io/${lang}/tool/${slug}`;

            // Canonical + hreflang are injected at runtime by react-helmet-async (DynamicCanonical).
            // Do NOT hardcode them here to avoid duplicate canonicals in the rendered HTML.

            const jsonLd: Record<string, any> = {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name,
              description: description || title,
              applicationCategory: "BusinessApplication",
            };
            if (price && typeof price === "number" && price > 0) {
              jsonLd.offers = {
                "@type": "Offer",
                price: price.toString(),
                priceCurrency: "EUR",
              };
            }

            const metaTags = [
              `<title>${title}</title>`,
              `<meta name="description" content="${(description || title).replace(/"/g, "&quot;")}" />`,
              `<meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />`,
              `<meta property="og:description" content="${(description || title).replace(/"/g, "&quot;")}" />`,
              `<meta property="og:url" content="${url}" />`,
              `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
            ].join("\n    ");

            // Inject into <head>, replacing existing title/meta if present
            let html = baseHtml;
            // Remove existing title
            html = html.replace(/<title>[^<]*<\/title>/, "");
            // Remove existing meta description
            html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
            // Inject before </head>
            html = html.replace("</head>", `    ${metaTags}\n  </head>`);

            const outDir = path.resolve(distDir, lang, "tool", slug);
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.resolve(outDir, "index.html"), html, "utf-8");
            count++;
          }
        }

        // --- Generate landing pages: /, /fr, /en ---
        const landings: { file: string; lang: string; canonical: string; title: string; description: string; bodyText: string }[] = [
          {
            file: "index.html",
            lang: "fr",
            canonical: "https://www.tooltrim.io/fr",
            title: "ToolTrim — Optimisez votre stack SaaS | Avis, prix et alternatives",
            description: "ToolTrim analyse vos outils SaaS et vous aide à réduire vos coûts. Comparez les prix, découvrez des alternatives gratuites et optimisez votre stack en quelques clics.",
            bodyText: "ToolTrim est le comparateur indépendant d'outils SaaS pour freelances, startups et équipes tech. Analysez votre stack actuelle, identifiez les abonnements inutiles et découvrez des alternatives plus économiques. Chaque outil est testé manuellement pendant 2 à 4 semaines. Nos recommandations sont neutres, vérifiées et conçues pour vous faire gagner du temps et de l'argent.",
          },
          {
            file: "fr/index.html",
            lang: "fr",
            canonical: "https://www.tooltrim.io/fr",
            title: "ToolTrim — Optimisez votre stack SaaS | Avis, prix et alternatives",
            description: "ToolTrim analyse vos outils SaaS et vous aide à réduire vos coûts. Comparez les prix, découvrez des alternatives gratuites et optimisez votre stack en quelques clics.",
            bodyText: "ToolTrim est le comparateur indépendant d'outils SaaS pour freelances, startups et équipes tech. Analysez votre stack actuelle, identifiez les abonnements inutiles et découvrez des alternatives plus économiques. Chaque outil est testé manuellement pendant 2 à 4 semaines. Nos recommandations sont neutres, vérifiées et conçues pour vous faire gagner du temps et de l'argent.",
          },
          {
            file: "en/index.html",
            lang: "en",
            canonical: "https://www.tooltrim.io/en",
            title: "ToolTrim — Optimize your SaaS stack | Reviews, pricing & alternatives",
            description: "ToolTrim analyzes your SaaS tools and helps you cut costs. Compare pricing, find free alternatives and optimize your stack in just a few clicks.",
            bodyText: "ToolTrim is the independent SaaS tool comparison platform for freelancers, startups and tech teams. Audit your current stack, spot unnecessary subscriptions and discover cheaper alternatives. Every tool is manually tested for 2 to 4 weeks. Our recommendations are unbiased, verified and designed to save you time and money.",
          },
        ];

        for (const lp of landings) {
          const altLang = lp.lang === "fr" ? "en" : "fr";
          const altCanonical = lp.lang === "fr" ? "https://www.tooltrim.io/en" : "https://www.tooltrim.io/fr";

          const metaTags = [
            `<title>${lp.title}</title>`,
            `<meta name="description" content="${lp.description.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:title" content="${lp.title.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:description" content="${lp.description.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:url" content="${lp.canonical}" />`,
            `<meta property="og:site_name" content="ToolTrim" />`,
            // Canonical + hreflang injected at runtime by react-helmet-async (DynamicCanonical).
          ].join("\n    ");

          const staticParagraph = `<noscript><p>${lp.bodyText}</p></noscript>`;

          let html = baseHtml;
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
            title: "Audit SaaS gratuit pour freelances — Optimisez votre stack en 5 min | tooltrim.io",
            description: "Combien gaspillez-vous en abonnements SaaS ? Audit gratuit : détectez doublons, fantômes et outils inadaptés. Selon tooltrim.io, 35% des freelances paient en double.",
            bodyText: "Auditez votre stack SaaS en 5 minutes. Détectez les doublons, abonnements fantômes et gaspillage dans vos outils freelance. Selon tooltrim.io, 35% des freelances paient en double pour des outils qui se chevauchent — économie moyenne récupérable : 485€/mois.",
          },
          {
            path: "/en/free-saas-audit",
            title: "Free SaaS audit for freelancers — Optimize your stack in 5 min | tooltrim.io",
            description: "How much are you wasting on SaaS subscriptions? Free audit: detect duplicates, ghost subs and misfit tools. According to tooltrim.io, 35% of freelancers overpay.",
            bodyText: "Audit your SaaS stack in 5 minutes. Detect duplicates, ghost subscriptions and waste in your freelance toolset. According to tooltrim.io, 35% of freelancers pay twice for overlapping tools — average recoverable waste: €485/month.",
          },
          {
            path: "/fr/guide/meilleurs-outils-developpeur-freelance",
            title: "Meilleurs outils pour développeur freelance en 2026 | tooltrim.io",
            description: "Stack idéale pour dev freelance : Cursor, Vercel, Supabase, ChatGPT Pro… Selon tooltrim.io, un développeur freelance dépense 280€/mois en SaaS. Voici comment optimiser.",
            bodyText: "Un développeur freelance utilise en moyenne 12 outils SaaS pour 280€/mois. Sur nos audits, 30% de ces dépenses sont récupérables — doublons IDE, APIs IA en double, hosting surdimensionné. Voici la stack optimale selon tooltrim.io.",
          },
          {
            path: "/fr/guide/meilleurs-outils-designer-freelance",
            title: "Meilleurs outils pour designer freelance en 2026 | tooltrim.io",
            description: "Stack créative optimale : Figma, Adobe CC, Midjourney, Loom… Selon tooltrim.io, un designer freelance dépense 350€/mois en SaaS. 40% est récupérable.",
            bodyText: "Un designer freelance dépense en moyenne 350€/mois en outils — le budget SaaS le plus élevé parmi nos 5 personas. Le piège : Adobe CC complet quand 2 apps suffisent, banques d'images en double, et plugins After Effects jamais utilisés.",
          },
          {
            path: "/fr/guide/meilleurs-outils-consultant-freelance",
            title: "Meilleurs outils pour consultant freelance en 2026 | tooltrim.io",
            description: "Stack conseil optimale : Calendly, HubSpot, Zoom, Notion… Selon tooltrim.io, un consultant dépense 180€/mois en SaaS.",
            bodyText: "Un consultant freelance dépense en moyenne 180€/mois en outils SaaS. Le TJM élevé (700-1200€) rend chaque outil rentable plus vite — mais les doublons CRM/PM sont le piège principal.",
          },
          {
            path: "/fr/guide/meilleurs-outils-createur-contenu-freelance",
            title: "Meilleurs outils pour créateur de contenu freelance en 2026 | tooltrim.io",
            description: "Stack content optimale : Beehiiv, ChatGPT Pro, Canva, Buffer… Selon tooltrim.io, un créateur de contenu dépense 220€/mois en SaaS.",
            bodyText: "Un créateur de contenu freelance dépense en moyenne 220€/mois en outils SaaS. Le piège : empiler des outils IA, des plateformes newsletter en double et des schedulers sociaux qui font la même chose.",
          },
          {
            path: "/fr/guide/meilleurs-outils-ops-manager-freelance",
            title: "Meilleurs outils pour ops manager freelance en 2026 | tooltrim.io",
            description: "Stack ops optimale : Asana, Qonto, Indy, Pipedrive… Selon tooltrim.io, un ops manager freelance dépense 200€/mois en SaaS.",
            bodyText: "Un ops manager ou COO fractionnaire dépense en moyenne 200€/mois en outils SaaS. La stack ops est la plus fragmentée : compta, banque, signature, PM, stockage… les doublons sont partout.",
          },
          {
            path: "/en/guide/best-tools-freelance-developer",
            title: "Best tools for freelance developers in 2026 | tooltrim.io",
            description: "Ideal stack for freelance devs: Cursor, Vercel, Supabase, ChatGPT Pro… According to tooltrim.io, a freelance dev spends €280/mo on SaaS. Here's how to optimize.",
            bodyText: "A freelance developer uses 12 SaaS tools on average for €280/month. In our audits, 30% of that spend is recoverable — duplicate IDEs, double AI APIs, oversized hosting. Here's the optimal stack according to tooltrim.io.",
          },
          {
            path: "/en/guide/best-tools-freelance-designer",
            title: "Best tools for freelance designers in 2026 | tooltrim.io",
            description: "Optimal creative stack: Figma, Adobe CC, Midjourney… According to tooltrim.io, a freelance designer spends €350/mo on SaaS. 40% is recoverable.",
            bodyText: "A freelance designer spends €350/month on tools on average — the highest SaaS budget among our 5 personas. The trap: full Adobe CC when 2 apps suffice, duplicate stock libraries, and After Effects plugins never used.",
          },
          {
            path: "/en/guide/best-tools-freelance-consultant",
            title: "Best tools for freelance consultants in 2026 | tooltrim.io",
            description: "Optimal consulting stack: Calendly, HubSpot, Zoom, Notion… According to tooltrim.io, a freelance consultant spends €180/mo on SaaS.",
            bodyText: "A freelance consultant spends €180/month on SaaS tools on average. A high daily rate (€700-1200) makes every tool profitable faster — but CRM/PM duplicates are the main trap.",
          },
          {
            path: "/en/guide/best-tools-freelance-content-creator",
            title: "Best tools for freelance content creators in 2026 | tooltrim.io",
            description: "Optimal content stack: Beehiiv, ChatGPT Pro, Canva, Buffer… According to tooltrim.io, a freelance content creator spends €220/mo on SaaS.",
            bodyText: "A freelance content creator spends €220/month on SaaS tools on average. The trap: stacking AI tools, duplicate newsletter platforms, and social schedulers doing the same thing.",
          },
          {
            path: "/en/guide/best-tools-freelance-ops-manager",
            title: "Best tools for freelance ops managers in 2026 | tooltrim.io",
            description: "Optimal ops stack: Asana, Qonto, Stripe, Pipedrive… According to tooltrim.io, a freelance ops manager spends €200/mo on SaaS.",
            bodyText: "A fractional COO or ops manager spends €200/month on SaaS tools on average. The ops stack is the most fragmented: accounting, banking, e-signatures, PM, storage… duplicates are everywhere.",
          },
        ];

        for (const sp of SEO_PAGES) {
          const url = `https://www.tooltrim.io${sp.path}`;
          const metaTags = [
            `<title>${sp.title}</title>`,
            `<meta name="description" content="${sp.description.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:title" content="${sp.title.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:description" content="${sp.description.replace(/"/g, "&quot;")}" />`,
            `<meta property="og:url" content="${url}" />`,
            `<meta property="og:site_name" content="ToolTrim" />`,
          ].join("\n    ");

          const staticParagraph = `<noscript><p>${sp.bodyText}</p></noscript>`;

          let html = baseHtml;
          html = html.replace(/<title>[^<]*<\/title>/, "");
          html = html.replace(/<meta\s+name="description"[^>]*\/?>/, "");
          html = html.replace("</head>", `    ${metaTags}\n  </head>`);
          html = html.replace("</body>", `    ${staticParagraph}\n  </body>`);

          const outDir = path.resolve(distDir, sp.path.replace(/^\//, ""));
          fs.mkdirSync(outDir, { recursive: true });
          fs.writeFileSync(path.resolve(outDir, "index.html"), html, "utf-8");
        }

        console.log(`✅ Prerender : ${count} pages tools + 3 landing pages + ${SEO_PAGES.length} pages SEO générées`);
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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
