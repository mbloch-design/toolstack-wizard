const BASE = "https://tooltrim.com";

export function toolRecords(tools) {
  const slugs = new Set();
  return tools.map((tool) => {
    const slug = String(tool.slug || "").trim();
    if (!slug || slugs.has(slug)) throw new Error(`Missing or duplicate tool slug: ${slug}`);
    slugs.add(slug);
    const alternatives = [tool.freeAlternative, tool.betterAlternative]
      .filter((value) => typeof value === "string" && value.trim())
      .map((value) => value.trim());
    return {
      name: tool.name,
      slug,
      url_fr: `${BASE}/fr/tool/${slug}`,
      url_en: `${BASE}/en/tool/${slug}`,
      website: tool.websiteUrl || tool.affiliateLink || undefined,
      category: tool.categoryId || undefined,
      // The legacy defaultMonthlyPrice lacks currency/billing evidence. Export
      // editorial pricing verbatim, never infer a monthly EUR price or free plan.
      pricing: tool.pricing ?? undefined,
      description_fr: tool.shortDescription || undefined,
      description_en: tool.shortDescriptionEn || undefined,
      alternatives: alternatives.length ? [...new Set(alternatives)] : undefined,
    };
  });
}

export function decodeEntities(value) {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity) => {
    if (!entity.startsWith("#")) return named[entity.toLowerCase()] ?? match;
    const hex = entity.slice(0, 2).toLowerCase() === "#x";
    const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
    return code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map(([, key, double, single]) => [key.toLowerCase(), decodeEntities(double ?? single)]));
}

export function editorialUrls(xml) {
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map(([, url]) => decodeEntities(url))
    .filter((url) => /^https:\/\/tooltrim\.com\/(fr|en)\/(guide|comparatif)\/[^/?#]+$/.test(url));
  if (!urls.length) throw new Error("No canonical editorial URLs in the generated sitemap.");
  if (new Set(urls).size !== urls.length) throw new Error("Duplicate editorial sitemap URL.");
  return urls;
}

export function editorialRecord(url, html) {
  const match = new URL(url).pathname.match(/^\/(fr|en)\/(guide|comparatif)\/([^/]+)$/);
  if (new URL(url).origin !== BASE || !match) throw new Error(`Invalid editorial URL: ${url}`);
  const [, language, kind, slug] = match;
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => attributes(tag));
  const canonical = links.find((link) => link.rel === "canonical")?.href;
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => attributes(tag));
  if (canonical !== url) throw new Error(`Editorial canonical mismatch: ${url}`);
  if (metas.some((meta) => /^(robots|googlebot)$/i.test(meta.name ?? "") && /\b(noindex|none)\b/i.test(meta.content ?? ""))) {
    throw new Error(`Non-indexable editorial page: ${url}`);
  }
  const title = decodeEntities(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
  const summary = metas.find((meta) => meta.name === "description")?.content?.trim();
  if (!title) throw new Error(`Missing editorial title: ${url}`);
  // Older published guides can lack a meta description. Keep their canonical
  // link discoverable without inventing a summary or copying navigation text.
  return { type: kind === "guide" ? "guide" : "comparison", language, slug, url, title, summary: summary || undefined };
}
