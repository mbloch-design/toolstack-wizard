import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

const BASE = "https://tooltrim.io";
const LANGS = ["fr", "en"];
const STATIC_PAGES = ["", "tools", "category", "guides", "selector", "about", "methodology", "transparency", "contact"];
const EXCLUDE_SITEMAP_PATTERNS = ["/selector/results", "/methodology"]; // methodology redirected from old URL

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

        const COMPARISONS = [
          "chatgpt-vs-claude", "dropbox-vs-google-drive", "zapier-vs-make",
          "notion-vs-obsidian", "typeform-vs-tally", "midjourney-vs-firefly",
          "github-copilot-vs-cursor", "grammarly-vs-claude",
        ];
        for (const comp of COMPARISONS) {
          add(`${BASE}/fr/comparatif/${comp}`, "monthly", "0.7");
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

            const canonical = `<link rel="canonical" href="${url}" />`;
            const hreflangs = [
              `<link rel="alternate" hreflang="fr" href="https://www.tooltrim.io/fr/tool/${slug}" />`,
              `<link rel="alternate" hreflang="en" href="https://www.tooltrim.io/en/tool/${slug}" />`,
              `<link rel="alternate" hreflang="x-default" href="https://www.tooltrim.io/fr/tool/${slug}" />`,
            ].join("\n    ");

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
              canonical,
              hreflangs,
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
            `<link rel="canonical" href="${lp.canonical}" />`,
            `<link rel="alternate" hreflang="fr" href="https://www.tooltrim.io/fr" />`,
            `<link rel="alternate" hreflang="en" href="https://www.tooltrim.io/en" />`,
            `<link rel="alternate" hreflang="x-default" href="https://www.tooltrim.io/fr" />`,
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

        console.log(`✅ Prerender : ${count} pages tools + 3 landing pages générées`);
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
