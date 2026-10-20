/**
 * Checks written titles and meta descriptions before they reach tools_v4.json.
 *   npx tsx scripts/seo-meta/validate.mts <briefs.json> <metas.json>
 * metas.json: { [slug]: { presentation: {title?: {fr,en}, meta: {fr,en}}, prix, alt, avis } }
 */
import fs from "node:fs";

const briefs = new Map(JSON.parse(fs.readFileSync(process.argv[2], "utf8")).map((b: any) => [b.slug, b]));
const metas = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const LIMITS = { meta: [110, 155], title: [25, 60] } as const;
const PAGES = ["presentation", "prix", "alt", "avis"];
const seen = new Map<string, string>();
const errors: string[] = [];
let count = 0;

function render(raw: string, b: any, lang: "fr" | "en"): string {
  return raw.split("{price}").join(b.price?.[lang] || "").split("{verified}").join(b.verified?.[lang] || "")
    .split("{rating}").join(b.rating?.[lang] || "").split("{year}").join("2026");
}

for (const [slug, pages] of Object.entries<any>(metas)) {
  const b: any = briefs.get(slug);
  if (!b) { errors.push(`${slug}: no brief`); continue; }
  for (const page of PAGES) if (!pages[page]?.meta) errors.push(`${slug} ${page}: meta missing`);
  for (const [page, kinds] of Object.entries<any>(pages)) {
    for (const kind of ["meta", "title"] as const) {
      if (!kinds?.[kind]) continue;
      for (const lang of ["fr", "en"] as const) {
        const raw: string = kinds[kind][lang];
        const where = `${slug} ${page} ${kind} ${lang}`;
        if (!raw) { errors.push(`${where}: missing`); continue; }
        count++;
        if (raw.includes("{price}") && !b.price) errors.push(`${where}: {price} without a verified price`);
        if (raw.includes("{verified}") && !b.verified) errors.push(`${where}: {verified} without a recent check`);
        const text = render(raw, b, lang);
        const [min, max] = LIMITS[kind];
        if (text.length > max || text.length < min) errors.push(`${where}: ${text.length} chars (${min}-${max})`);
        if (/ToolTrim\s*$/.test(text) && kind === "title") errors.push(`${where}: brand is added automatically`);
        // « After Effects » for Adobe After Effects: the vendor prefix may be dropped.
        const name = String(b.name).toLowerCase();
        const short = name.split(" ").length > 1 ? name.split(" ").slice(1).join(" ") : name;
        if (!text.toLowerCase().includes(name.split(" ")[0]) && !text.toLowerCase().includes(short)) errors.push(`${where}: tool name missing`);
        if (/—/.test(text)) errors.push(`${where}: em dash`);
        if (/!/.test(text)) errors.push(`${where}: exclamation mark`);
        // Same rule as src/test/seo/seoOverridePrices.spec.ts: no literal amount at
        // all. The compare price goes through {price}; fees and thresholds are
        // described in words, since they are not in the verified grid.
        if (/(?:[€$£]\s?\d|\d\s?(?:[€$£]|EUR|USD))/.test(raw)) errors.push(`${where}: literal amount, use {price} or words`);
        // Past years are facts (« limits tightened in 2024 »); the current one goes stale.
        if (new RegExp(`\\b${new Date().getFullYear()}\\b`).test(raw)) errors.push(`${where}: hard-coded current year, use {year}`);
        if (/\b\d[.,]\d\s?\/\s?5\b/.test(raw)) errors.push(`${where}: hard-coded score, use {rating}`);
        if (/\b(gratuit|free)\b/i.test(text.replace(/\w+-free/gi, "")) && !b.freePlan && !/(pas d['’]offre gratuite|aucune offre gratuite|sans offre gratuite|no free|not free|pas gratuit|free alternatives?|alternatives? gratuites?|gratuites? (ou|et)|free (or|and)|(ou|or) (free|gratuit)|no free plan|no permanent free|ni gratuit|pas de gratuit|free trial|essai gratuit|free whois|whois privé gratuit|whois gratuite|pas d['’]offre gratuite permanente|offre gratuite[^.]*absente?s?)/i.test(text)) errors.push(`${where}: claims free without a confirmed free plan`);
        if (lang === "en" && /\s[:;?]/.test(text)) errors.push(`${where}: French spacing in English`);
        if (lang === "fr" && /\S[:;?](\s|$)/.test(text.replace(/https?:\/\/\S+/g, ""))) errors.push(`${where}: missing space before : ; ? in French`);
        const key = `${kind}:${text}`;
        const prev = seen.get(key);
        if (prev) errors.push(`${where}: duplicate of ${prev}`);
        seen.set(key, where);
      }
    }
  }
}
console.log(`${count} texts checked, ${errors.length} problems`);
for (const e of errors.slice(0, 300)) console.log(" - " + e);
process.exit(errors.length ? 1 : 0);
