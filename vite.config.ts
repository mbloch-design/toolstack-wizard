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

        // Static pages
        for (const lang of LANGS) {
          for (const page of STATIC_PAGES) {
            const p = page ? `/${lang}/${page}` : `/${lang}`;
            const prio = page === "" ? "1.0" : page === "tools" ? "0.9" : "0.7";
            add(`${BASE}${p}`, page === "" ? "daily" : "weekly", prio);
          }
        }

        // Tools
        for (const t of data.tools || []) {
          const slug = t.slug || t.id;
          for (const lang of LANGS) {
            add(`${BASE}/${lang}/tool/${slug}`, "weekly", "0.8");
          }
        }

        // Categories
        for (const c of data.categories || []) {
          for (const lang of LANGS) {
            add(`${BASE}/${lang}/category/${c.slug}`, "weekly", "0.7");
          }
        }

        // Articles
        for (const a of data.articles || []) {
          const lang = a.lang || "fr";
          add(`${BASE}/${lang}/guide/${a.slug}`, "monthly", "0.6");
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

        // Write to dist (build output) and public (for dev/preview)
        const distPath = path.resolve(__dirname, "dist/sitemap.xml");
        const publicPath = path.resolve(__dirname, "public/sitemap.xml");
        
        if (fs.existsSync(path.resolve(__dirname, "dist"))) {
          fs.writeFileSync(distPath, xml, "utf-8");
        }
        fs.writeFileSync(publicPath, xml, "utf-8");
        
        console.log(`✅ Sitemap generated with ${urls.length} URLs`);
      } catch (e) {
        console.warn("⚠️ Sitemap generation failed:", e);
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
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
