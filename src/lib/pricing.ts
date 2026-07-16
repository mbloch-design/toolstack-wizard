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
export function resolveMonthlyPrice(tool: {
  pricing_v5?: { compare_price_monthly_eur?: number | null } | null;
  defaultMonthlyPrice?: number | null;
}): number {
  const verified = tool.pricing_v5?.compare_price_monthly_eur;
  if (typeof verified === "number" && Number.isFinite(verified) && verified >= 0) return verified;
  const legacy = tool.defaultMonthlyPrice;
  return typeof legacy === "number" && Number.isFinite(legacy) && legacy >= 0 ? legacy : 0;
}

const NEGATION_RE = /no free|aucun|pas de|non communiqué/i;
const TRIAL_ONLY_RE = /essai|trial|jours? gratuit|demo gratuite|démo gratuite/i;
// Phrases that override a trial-word match — the free text can mention
// "essai" while describing an actually-permanent free plan (Dubsado: "essai
// gratuit illimité dans le temps, limité à 3 clients" is a capped-forever
// free tier, not a trial; Logseq mentions "sans... essai" while being fully
// free/open-source).
const PERMANENT_FREE_OVERRIDE_RE = /gratuit (a|à) vie|forever free|illimité dans le temps|sans limite de temps|entièrement gratuit|plan gratuit permanent|produit complet|open-?source/i;
