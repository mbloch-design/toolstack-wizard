import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";

/**
 * /fr/tool/{slug}.md and /en/tool/{slug}.md (rewritten here by vercel.json):
 * the published facts and verdict of a tool as compact Markdown, for answer
 * engines and agents. One function instead of ~2,700 static files (the
 * artefact has a file-count budget). Source: the site's own llms-full.txt,
 * generated at build from the same data as the pages, cached in memory and
 * on the CDN. Canonical points back to the HTML page (header in vercel.json).
 */

type Verdict = { score?: string; label?: string; keep_if?: string; avoid_if?: string; strengths?: string[]; weaknesses?: string[] };
type ToolRecord = {
  name: string; slug: string; url_fr: string; url_en: string; website?: string;
  pricing?: { free?: string; paid?: string }; description_fr?: string; description_en?: string;
  alternatives?: string[]; price_verified_on?: string; verdict_fr?: Verdict; verdict_en?: Verdict;
};

const CACHE_MS = 60 * 60 * 1000;
let cache: { at: number; bySlug: Map<string, ToolRecord> } | null = null;

export function parseCatalogue(text: string): Map<string, ToolRecord> {
  const start = text.indexOf("\n[");
  if (start < 0) throw new Error("llms-full.txt: catalogue array not found");
  const records = JSON.parse(text.slice(start + 1)) as ToolRecord[];
  return new Map(records.map((record) => [record.slug, record]));
}

const line = (label: string, value?: string) => (value ? `- **${label}** : ${value}\n` : "");
const section = (title: string, values?: string[]) => (values?.length ? `\n## ${title}\n\n${values.map((value) => `- ${value}`).join("\n")}\n` : "");

export function toolMarkdown(record: ToolRecord, lang: "fr" | "en"): string {
  const fr = lang === "fr";
  const verdict = fr ? record.verdict_fr : record.verdict_en;
  const url = fr ? record.url_fr : record.url_en;
  const verified = record.price_verified_on ? new Date(`${String(record.price_verified_on).slice(0, 10)}T00:00:00Z`) : null;
  const date = verified && !Number.isNaN(verified.getTime())
    ? new Intl.DateTimeFormat(fr ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(verified)
    : undefined;
  const description = (fr ? record.description_fr : record.description_en || record.description_fr) || "";
  return `# ${record.name}\n\n${description}\n\n`
    + line(fr ? "Page ToolTrim" : "ToolTrim page", url)
    + line(fr ? "Site officiel" : "Official website", record.website)
    + line(fr ? "Plan gratuit" : "Free plan", record.pricing?.free)
    + line(fr ? "Offre payante" : "Paid plans", record.pricing?.paid)
    + line(fr ? "Prix vérifié le" : "Price verified on", date)
    + (verdict?.score ? line(fr ? "Note ToolTrim" : "ToolTrim score", `${verdict.score} (${verdict.label})`) : "")
    + line(fr ? "À garder si" : "Keep it if", verdict?.keep_if)
    + line(fr ? "À éviter si" : "Look elsewhere if", verdict?.avoid_if)
    + section(fr ? "Points forts" : "Strengths", verdict?.strengths)
    + section(fr ? "Points faibles" : "Weaknesses", verdict?.weaknesses)
    + (record.alternatives?.length ? `\nAlternatives : ${record.alternatives.join(", ")}\n` : "")
    + `\nSource : ${url}. ${fr ? "La note ToolTrim n'est jamais influencée par un paiement." : "The ToolTrim score is never influenced by payment."}\n`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") return res.status(405).send("Method not allowed");
  const lang = req.query.lang === "en" ? "en" : req.query.lang === "fr" ? "fr" : null;
  const slug = typeof req.query.slug === "string" && /^[a-z0-9-]{1,120}$/.test(req.query.slug) ? req.query.slug : null;
  if (!lang || !slug) return res.status(400).send("Bad request");

  try {
    if (!cache || Date.now() - cache.at > CACHE_MS) {
      const host = String(req.headers.host || "tooltrim.com");
      const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
      const response = await fetch(`${proto}://${host}/llms-full.txt`);
      if (!response.ok) throw new Error(`llms-full.txt ${response.status}`);
      cache = { at: Date.now(), bySlug: parseCatalogue(await response.text()) };
    }
  } catch {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Temporarily unavailable");
  }

  const record = cache.bySlug.get(slug);
  if (!record) {
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    return res.status(404).send("Not found");
  }
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  return res.status(200).send(toolMarkdown(record, lang));
}
