#!/usr/bin/env node
// Collecte d'une fiche soumise, sans modèle : un seul passage réseau, un fichier compact.
//
//   node scripts/catalog/submission-intake.mjs --url=https://exemple.com --slug=exemple [--max-pages=40]
//
// Écrit research/submissions/<slug>/intake.json :
//   badge  : le lien vers tooltrim.com est-il présent, sur quelles pages, avec quel rel ;
//   media  : og:image, twitter:image, favicon de l'accueil ;
//   pages  : texte lisible des pages utiles (accueil, prix, à propos, CGU, confidentialité,
//            sécurité, FAQ, docs), plafonné par page.
// Affiche un résumé de quelques lignes. Le rédacteur ne lit que ce fichier, pas le site.

import { mkdir, writeFile } from "node:fs/promises";

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, "").split("=");
  return [k, v.join("=") || true];
}));
if (!args.url || !args.slug) {
  console.error("Usage : --url=https://exemple.com --slug=exemple [--max-pages=40]");
  process.exit(2);
}
const root = new URL(args.url);
const maxPages = Number(args["max-pages"] || 40);
const UA = "Mozilla/5.0 (compatible; ToolTrimIntake/1.0; +https://tooltrim.com)";
const KEY = /(pric|tarif|plan|about|a-propos|propos|pourquoi|team|terms|cgu|cgv|conditions|legal|mentions|privacy|confidential|security|securite|faq|aide|help|docs?|features|fonctionnal|produit|product|beta|telecharg|download)/i;
const TEXT_CAP = 12000;

async function get(url) {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
    return { status: res.status, url: res.url, body: res.ok ? await res.text() : "" };
  } catch (error) {
    return { status: 0, url, body: "", error: String(error.message || error) };
  }
}

function sameSite(href) {
  try {
    const u = new URL(href, root);
    return u.hostname.replace(/^www\./, "") === root.hostname.replace(/^www\./, "") ? u : null;
  } catch {
    return null;
  }
}

const decode = (s) => s
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

function toText(html) {
  return decode(html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

const meta = (html, re) => (html.match(re) || [])[1] || null;

// 1. Inventaire : sitemap, sinon liens de l'accueil.
const home = await get(root.href);
if (!home.body) {
  console.error(`Accueil injoignable (${home.status}) : ${root.href}`);
  process.exit(1);
}
let urls = [];
const sitemap = await get(new URL("/sitemap.xml", root).href);
if (sitemap.body) urls = [...sitemap.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
// Le sitemap ne liste pas toujours les pages légales, où le badge est souvent posé.
urls = [...urls, ...[...home.body.matchAll(/href="([^"#]+)"/g)].map((m) => m[1])];
const pages = [...new Set([root.href, ...urls.map((u) => sameSite(u)?.href).filter(Boolean)])]
  .filter((u) => !/\.(png|jpe?g|webp|svg|gif|pdf|css|js|ico|xml|json)(\?|$)/i.test(u))
  // Pages utiles d'abord, pour que le plafond ne soit pas mangé par le blog.
  .sort((a, b) => Number(KEY.test(new URL(b).pathname)) - Number(KEY.test(new URL(a).pathname)))
  .slice(0, maxPages);

// 2. Passage unique : badge sur toutes les pages, texte des pages utiles.
const badge = [];
const kept = [];
for (const url of pages) {
  const page = url === root.href ? home : await get(url);
  if (!page.body) continue;
  for (const m of page.body.matchAll(/<a\b[^>]*href="(https?:\/\/(?:www\.)?tooltrim\.com[^"]*)"[^>]*>/gi)) {
    const rel = (m[0].match(/rel="([^"]*)"/i) || [])[1] || "";
    badge.push({ page: url, href: decode(m[1]), rel, dofollow: !/nofollow|sponsored|ugc/i.test(rel) });
  }
  const path = new URL(url).pathname;
  if (url === root.href || (KEY.test(path) && !/\/(blog|news|actualites|articles?)\//i.test(path))) {
    const title = toText(meta(page.body, /<title[^>]*>([\s\S]*?)<\/title>/i) || "");
    // Les réponses de FAQ en JSON-LD portent souvent prix, limites et hébergement.
    const faq = [...page.body.matchAll(/"name"\s*:\s*"([^"]+\?)"\s*,\s*"acceptedAnswer"\s*:\s*\{[^}]*?"text"\s*:\s*"([^"]+)"/g)]
      .map((m) => `Q: ${decode(m[1])}\nR: ${decode(m[2])}`);
    kept.push({ url, title, text: toText(page.body).slice(0, TEXT_CAP), ...(faq.length ? { faq } : {}) });
  }
}

const abs = (v) => (v ? new URL(decode(v), root).href : null);
const media = {
  ogImage: abs(meta(home.body, /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)),
  twitterImage: abs(meta(home.body, /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i)),
  favicon: abs(meta(home.body, /<link[^>]+rel="(?:shortcut )?icon"[^>]+href="([^"]+)"/i)) || new URL("/favicon.ico", root).href,
};

const out = {
  slug: args.slug,
  url: root.href,
  fetchedOn: new Date().toISOString().slice(0, 10),
  scanned: pages.length,
  badge: { active: badge.length > 0, dofollow: badge.some((b) => b.dofollow), links: badge.slice(0, 10) },
  media,
  pages: kept,
};
const dir = `research/submissions/${args.slug}`;
await mkdir(dir, { recursive: true });
await writeFile(`${dir}/intake.json`, `${JSON.stringify(out, null, 2)}\n`);

const pagesWithBadge = [...new Set(badge.map((b) => b.page))];
console.log(`${args.slug} : ${pages.length} pages parcourues, ${kept.length} gardées → ${dir}/intake.json`);
console.log(out.badge.active
  ? `Badge ToolTrim actif sur ${pagesWithBadge.length} page(s) (${out.badge.dofollow ? "dofollow" : "nofollow"}) : ${pagesWithBadge.slice(0, 3).join(", ")}`
  : "Badge ToolTrim ABSENT de toutes les pages parcourues.");
console.log(`Médias : og=${media.ogImage || "—"} · favicon=${media.favicon}`);
