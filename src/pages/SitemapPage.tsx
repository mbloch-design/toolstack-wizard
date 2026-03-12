import { useEffect } from "react";
import { useTools, useCategories, usePosts } from "@/hooks/useSupabaseData";

const BASE = "https://tooltrim.com";
const LANGS = ["fr", "en"];

const STATIC_PAGES = [
  "", "tools", "category", "guides", "selector", "about", "transparency", "contact"
];

function buildSitemap(tools: any[], categories: any[], posts: any[]): string {
  const urls: { loc: string; changefreq: string; priority: string }[] = [];

  // Static pages per lang
  for (const lang of LANGS) {
    for (const page of STATIC_PAGES) {
      const path = page ? `/${lang}/${page}` : `/${lang}`;
      const priority = page === "" ? "1.0" : page === "tools" ? "0.9" : "0.7";
      urls.push({ loc: `${BASE}${path}`, changefreq: page === "" ? "daily" : "weekly", priority });
    }
  }

  // Tool pages
  for (const tool of tools) {
    for (const lang of LANGS) {
      urls.push({ loc: `${BASE}/${lang}/tool/${tool.slug || tool.id}`, changefreq: "weekly", priority: "0.8" });
    }
  }

  // Category pages
  for (const cat of categories) {
    for (const lang of LANGS) {
      urls.push({ loc: `${BASE}/${lang}/category/${cat.slug}`, changefreq: "weekly", priority: "0.7" });
    }
  }

  // Guide/post pages
  for (const post of posts) {
    urls.push({ loc: `${BASE}/${post.lang}/guide/${post.slug}`, changefreq: "monthly", priority: "0.6" });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return xml;
}

const SitemapPage = () => {
  const { tools } = useTools();
  const { categories } = useCategories();
  const { posts: postsFr } = usePosts("fr");
  const { posts: postsEn } = usePosts("en");

  useEffect(() => {
    if (tools.length === 0) return;

    const allPosts = [...postsFr, ...postsEn];
    const xml = buildSitemap(tools, categories, allPosts);

    // Serve as downloadable XML
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);

    // Replace the page content with raw XML
    document.open();
    document.write(`<html><head><meta http-equiv="Content-Type" content="application/xml; charset=utf-8" /></head><body><pre>${xml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`);
    document.close();

    return () => URL.revokeObjectURL(url);
  }, [tools, categories, postsFr, postsEn]);

  return <div className="container py-20 text-center text-muted-foreground">Generating sitemap...</div>;
};

export default SitemapPage;
