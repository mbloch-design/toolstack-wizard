const BASE = "https://tooltrim.com";

const AXES = ["valeurAjoutee", "simplicite", "utilisation", "puissance", "reversibilite"];
const LABELS = (score, fr) => fr
  ? (score >= 4.5 ? "Exceptionnel" : score >= 4 ? "Excellent" : score >= 3.5 ? "Très bon" : score >= 3 ? "Bon" : score >= 2.5 ? "Correct" : "Limité")
  : (score >= 4.5 ? "Exceptional" : score >= 4 ? "Excellent" : score >= 3.5 ? "Very good" : score >= 3 ? "Good" : score >= 2.5 ? "Fair" : "Limited");
const clean = (value) => (typeof value === "string" ? value.trim().replace(/[.\s]+$/, "") : "");
const list = (values, max = 3) => (Array.isArray(values) ? values.map(clean).filter(Boolean).slice(0, max) : []);

/**
 * The editorial verdict exactly as published on the tool page, for answer
 * engines. Only the evidence-based five-axis score is exported (same average
 * as src/lib/toolTrimScore.ts, same 12-month staleness cap); a tool without a
 * complete rating gets no number rather than a heuristic one.
 */
export function verdictRecord(full, lang) {
  if (!full) return undefined;
  const fr = lang === "fr";
  const verdict = fr ? full.verdict : (full.verdictEn || undefined);
  const rating = full.toolTrimRating;
  let score;
  if (rating && AXES.every((axis) => typeof rating[axis] === "number")) {
    score = AXES.reduce((sum, axis) => sum + rating[axis], 0) / AXES.length;
    if (rating.lastActivityVerifiedOn && (Date.now() - new Date(rating.lastActivityVerifiedOn).getTime()) / 86_400_000 > 365) score = Math.min(score, 3.5);
    score = Math.round(score * 10) / 10;
  }
  const record = {
    score: score === undefined ? undefined : `${score}/5`,
    label: score === undefined ? undefined : LABELS(score, fr),
    keep_if: clean(verdict?.keepIf?.[0]) || undefined,
    avoid_if: clean(verdict?.avoidIf?.[0]) || undefined,
    strengths: list(fr ? full.pros : full.prosEn),
    weaknesses: list(fr ? full.cons : full.consEn),
  };
  if (!record.strengths.length) delete record.strengths;
  if (!record.weaknesses.length) delete record.weaknesses;
  return Object.values(record).some((value) => value !== undefined) ? record : undefined;
}

export function toolRecords(tools, fullBySlug = new Map()) {
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
      price_verified_on: fullBySlug.get(slug)?.pricing_v5?.verified_on || undefined,
      verdict_fr: verdictRecord(fullBySlug.get(slug), "fr"),
      verdict_en: verdictRecord(fullBySlug.get(slug), "en"),
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
