import type { Category, Tool, ToolPricingPlan } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { getCategoryLabel } from "@/lib/categoryLabel";
import { hasGenuineFreeTier } from "@/lib/pricing";

export const toolKey = (tool: Pick<Tool, "slug" | "id">) => tool.slug || tool.id;

export function stackTerritories(tools: ToolSummary[], categories: Category[], lang: string) {
  const grouped = new Map<string, ToolSummary[]>();
  for (const tool of tools) {
    const key = tool.categoryId || "uncategorized";
    grouped.set(key, [...(grouped.get(key) || []), tool]);
  }
  return Array.from(grouped, ([id, members]) => ({
    id,
    label: getCategoryLabel(categories.find((category) => category.id === id), lang)
      || (lang === "en" ? "Other tools" : "Autres outils"),
    tools: [...members].sort((a, b) => a.name.localeCompare(b.name, lang)),
  })).sort((a, b) => a.label.localeCompare(b.label, lang));
}

export type NativePrice = { amount: number; currency: string; period: "monthly" | "annual" | "once" };
type PricedTool = Pick<Tool, "pricing" | "pricingEn"> & { priceUndisclosed?: boolean; nativePrices?: NativePrice[] };

/** The attested entry price to show, in the page's preferred real currency
 *  when the vendor publishes it, never converted. */
export function pickNativePrice(tool: PricedTool, lang: string): NativePrice | null {
  const prices = tool.nativePrices || [];
  const preferred = lang === "en" ? "USD" : "EUR";
  return prices.find((price) => price.currency === preferred) || prices[0] || null;
}

export function formatNativePrice(price: NativePrice, lang: string): string {
  // Cents shown in full when there are any: "$35.90", not "$35.9".
  const cents = !Number.isInteger(price.amount);
  const value = new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 }).format(price.amount);
  const symbol = { USD: "$", EUR: "€", GBP: "£" }[price.currency] || price.currency;
  // "$22.99" in English, "22,99 $" in French, as on the tool page.
  const money = lang === "en" && symbol.length === 1 ? `${symbol}${value}` : `${value}\u00a0${symbol}`;
  const period = price.period === "monthly" ? (lang === "en" ? "/mo" : "/mois")
    : price.period === "annual" ? (lang === "en" ? "/yr" : "/an")
    : (lang === "en" ? " one-time" : " achat unique");
  return `${money}${period}`;
}

// Short catalogue labels. The amount comes only from the attested compare plan
// (nativePrices, in the vendor's currency): never read out of editorial text,
// never converted (Michael's rule: "only what is attested"). No attested price,
// no amount. Free / freemium / quote stay as categorical labels.
export function stackCatalogPrice(tool: PricedTool, lang: string): string | null {
  const pricing = tool.pricing;
  const paid = pricing?.paid?.trim();
  const quote = /sur devis|contact.{0,12}(vente|sales)|custom pricing|quote/i.test(paid || "");
  const free = hasGenuineFreeTier(pricing?.free) && /gratuit|free|open.?source/i.test(pricing?.free || "");
  const native = tool.priceUndisclosed ? null : pickNativePrice(tool, lang);
  if (tool.priceUndisclosed) return quote ? (lang === "en" ? "Custom pricing" : "Sur devis") : null;
  if (free && (native || quote)) return "Freemium";
  if (free && (!paid || /^(?:non|aucun|pas d[e’']|none|no paid|gratuit)/i.test(paid))) return lang === "en" ? "Free" : "Gratuit";
  if (native) return `${lang === "en" ? "From" : "Dès"} ${formatNativePrice(native, lang)}`;
  if (quote) return lang === "en" ? "Custom pricing" : "Sur devis";
  return null;
}

export function knownStackAlternatives(source: ToolSummary | Tool, selected: ToolSummary[]) {
  const keys = (tool: ToolSummary | Tool) => [tool.id, tool.slug, tool.name].filter(Boolean).map((value) => value!.toLowerCase());
  const references = (tool: ToolSummary | Tool) => [
    ...("alternatives" in tool ? tool.alternatives || [] : []),
    tool.freeAlternative, tool.betterAlternative?.tool,
  ].filter(Boolean).map((value) => value!.toLowerCase());
  const sourceKeys = keys(source);
  const sourceRefs = references(source);
  return selected.filter((candidate) => {
    const candidateKeys = keys(candidate);
    if (candidateKeys.some((key) => sourceKeys.includes(key))) return false;
    return sourceRefs.some((ref) => candidateKeys.includes(ref))
      || references(candidate).some((ref) => sourceKeys.includes(ref))
      || Boolean(source.substitution_cluster_v2 && source.substitution_cluster_v2 === candidate.substitution_cluster_v2);
  });
}

export function stackPlanPrice(plan: ToolPricingPlan, lang: string): string | null {
  if (plan.isFree) return lang === "en" ? "Free" : "Gratuit";
  if (plan.nativeAmount == null || !Number.isFinite(plan.nativeAmount) || plan.nativeAmount <= 0 || !plan.nativeCurrency) return null;
  const amount = new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR", { maximumFractionDigits: 2 }).format(plan.nativeAmount);
  const period = plan.billingPeriod === "monthly" ? (lang === "en" ? "/month" : "/mois")
    : plan.billingPeriod === "annual" ? (lang === "en" ? "/year" : "/an") : "";
  const commitment = plan.billingCommitment === "annual_prepaid" ? (lang === "en" ? " · annual billing" : " · facturation annuelle") : "";
  const tax = plan.taxInclusion === "ht" ? (lang === "en" ? " excl. tax" : " HT") : plan.taxInclusion === "ttc" ? (lang === "en" ? " incl. tax" : " TTC") : "";
  const units: Record<string, [string, string]> = {
    seat: ["par utilisateur", "per seat"], "per seat": ["par utilisateur", "per seat"], "par utilisateur": ["par utilisateur", "per seat"], "par membre": ["par membre", "per member"], "par collaborateur": ["par collaborateur", "per collaborator"],
    account: ["par compte", "per account"], "par compte": ["par compte", "per account"], workspace: ["par espace", "per workspace"],
    usage: ["selon la consommation", "usage based"], one_time: ["achat unique", "one-time purchase"], open_source: ["open source", "open source"],
    site: ["par site", "per site"], "par équipe": ["par équipe", "per team"], "par commerce": ["par commerce", "per store"], "par licence": ["par licence", "per license"], "par entreprise": ["par entreprise", "per company"], "par CV": ["par CV", "per resume"],
    "licence à vie": ["licence à vie", "lifetime license"], organization: ["par organisation", "per organization"], listing: ["par annonce", "per listing"],
    "par mois": ["par mois", "per month"], mois: ["par mois", "per month"], "par trimestre": ["par trimestre", "per quarter"],
    "mois, facturé annuellement": ["par mois, facturé annuellement", "per month, billed annually"],
    "jusqu’à 1 000 abonnés": ["jusqu’à 1 000 abonnés", "up to 1,000 subscribers"], "jusqu’à 10 000 abonnés": ["jusqu’à 10 000 abonnés", "up to 10,000 subscribers"],
    "1 000 contacts, tarif affiché avec facturation annuelle": ["1 000 contacts, facturation annuelle", "1,000 contacts, billed annually"],
  };
  // An unrecognized unit can change the meaning of the amount. Omit that plan
  // instead of silently presenting an incomplete price or an internal enum.
  if (plan.pricingUnit && !units[plan.pricingUnit]) return null;
  const unit = plan.pricingUnit && units[plan.pricingUnit][lang === "en" ? 1 : 0];
  return `${amount} ${plan.nativeCurrency}${period}${unit ? ` · ${unit}` : ""}${tax}${commitment}`;
}
