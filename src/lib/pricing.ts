/**
 * Whether a tool's `pricing.free` text describes a genuine free tier
 * (usable indefinitely, no card required) rather than a time-limited trial.
 *
 * Was previously duplicated ~7 times across the codebase as "free text is
 * non-empty and doesn't say no free/aucun/pas de" — that check let any
 * "Essai gratuit 14 jours" (free trial) through as "Gratuit", which is
 * what freeText actually is for ~50 tools in the catalog (Xero, Soldo,
 * Cinema 4D, Intercom, HoneyBook, Qonto...). A free trial is not a free
 * plan; showing "Gratuit" on those cards overstates what the tool costs.
 */
export function hasGenuineFreeTier(freeText: string | null | undefined): boolean {
  const text = (freeText || "").trim();
  if (!text) return false;
  const lower = text.toLowerCase();
  if (NEGATION_RE.test(lower)) return false;
  if (TRIAL_ONLY_RE.test(lower) && !PERMANENT_FREE_OVERRIDE_RE.test(lower)) return false;
  return true;
}

/**
 * Whether a tool has a genuine free tier AND a paid tier above it — i.e.
 * "Freemium", not simply "Gratuit". A flat "Gratuit" label on a tool that
 * also has a $20/mo Pro plan (Claude, ChatGPT, Notion...) overstates what
 * most users will actually end up paying once they hit the free tier's
 * limits. 264 of the catalog's 533 tools are in this situation — most of
 * what shows as "Gratuit" today is really "free to start, paid to use
 * seriously".
 */
export function isFreemiumPricing(pricing: { free?: string | null; paid?: string | null } | null | undefined): boolean {
  return hasGenuineFreeTier(pricing?.free) && !!pricing?.paid?.trim();
}

/**
 * Canonical monthly comparison price used everywhere a tool price is stated.
 * pricing_v5 is the editorially verified source; the legacy catalog value is
 * only a fallback for tools that have not been migrated yet. Keeping this in
 * one helper prevents visible copy, metadata, JSON-LD and SSR from drifting.
 */
/**
 * 237 tools carry the sentinel plan "Prix non public" with a 0 comparison
 * price: the vendor publishes no price list. That 0 means "unknown", not
 * "free", and must never be printed as "Free" or as a plan name.
 */
export function isPriceUndisclosed(tool: {
  pricing_v5?: { compare_plan_name?: string | null } | null;
}): boolean {
  return /non public/i.test(tool.pricing_v5?.compare_plan_name || "");
}

export function resolveMonthlyPrice(tool: {
  pricing_v5?: { compare_price_monthly_eur?: number | null } | null;
  defaultMonthlyPrice?: number | null;
}): number {
  const verified = tool.pricing_v5?.compare_price_monthly_eur;
  if (typeof verified === "number" && Number.isFinite(verified) && verified >= 0) return verified;
  const legacy = tool.defaultMonthlyPrice;
  return typeof legacy === "number" && Number.isFinite(legacy) && legacy >= 0 ? legacy : 0;
}

// Only a negation of the free plan itself counts. "Plan gratuit : …, aucun
// agent IA" describes a free plan; a bare /aucun|pas de/ match marked
// Mailchimp, Zoom and Blender as having none. « Pas d’offre gratuite » (elided
// « de ») read as a free plan and titled 30 paid-only fiches « free plan ».
const NEGATION_RE = /^\s*(?:pas de|aucune?|no|non|sans)\b|(?:pas de|pas d['’]|pas une?|aucune?|sans)\s*(?:plan|version|offre|formule|forfait|palier|tier)\s+gratuit|no free (?:plan|tier|version)|non communiqué/i;
const TRIAL_ONLY_RE = /essai|trial|jours? gratuit|demo gratuite|démo gratuite/i;
// Phrases that override a trial-word match — the free text can mention
// "essai" while describing an actually-permanent free plan (Dubsado: "essai
// gratuit illimité dans le temps, limité à 3 clients" is a capped-forever
// free tier, not a trial; Logseq mentions "sans... essai" while being fully
// free/open-source).
const PERMANENT_FREE_OVERRIDE_RE = /gratuit (a|à) vie|forever free|always free|toujours gratuit|plan free permanent|illimité dans le temps|sans limite de temps|entièrement gratuit|plan gratuit permanent|produit complet|open-?source/i;

/**
 * Bulk placeholders written on tools that were never researched (19/10/2026:
 * 104 « Gratuit ou open source selon usage », 13 « Gratuit ou plan gratuit
 * disponible »...). They read like facts, so Logic Pro ($199.99) was served
 * to Google as free, down to its FAQPage JSON-LD, and Jest got an invented
 * « Paid plan ». They are not evidence of anything and must never be shown
 * or turned into a claim.
 */
const PLACEHOLDER_PRICING_TEXTS = new Set([
  "gratuit ou open source selon usage",
  "free or open source depending on usage",
  "gratuit ou plan gratuit disponible",
  "options payantes possibles selon hébergement, équipe ou volume",
  "paid options may apply depending on hosting, team, or volume",
  "fonctionnalités de base",
  "core features",
  "toutes les fonctionnalités",
  "all features",
  "version payante disponible",
  "paid version available",
  "tarif à vérifier selon plan et usage",
]);

export function isPlaceholderPricingText(text: string | null | undefined): boolean {
  return PLACEHOLDER_PRICING_TEXTS.has(String(text || "").trim().toLowerCase().replace(/\.$/, ""));
}

/**
 * A free tier ToolTrim can state: from the verified plan grid when there is
 * one, otherwise from a specific `pricing.free` text, never from a placeholder.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasConfirmedFreeTier(tool: any): boolean {
  const plans = [...(tool?.pricing_v5?.plans || []), ...(tool?.pricing_v5En?.plans || [])];
  if (plans.some((plan) => plan?.isFree)) return true;
  const free = tool?.pricing?.free;
  return hasGenuineFreeTier(free) && !isPlaceholderPricingText(free);
}
