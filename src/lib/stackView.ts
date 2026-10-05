import type { Category, Tool, ToolPricingPlan } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { getCategoryLabel } from "@/lib/categoryLabel";
import { hasGenuineFreeTier } from "@/lib/pricing";

export const STACK_VIEW_KEY = "tooltrim:stack-view";
export type StackViewMode = "stack" | "map";
export const toolKey = (tool: Pick<Tool, "slug" | "id">) => tool.slug || tool.id;

export function readStackView(): StackViewMode {
  try { return window.localStorage.getItem(STACK_VIEW_KEY) === "map" ? "map" : "stack"; }
  catch { return "stack"; }
}

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

// Use literal catalogue prices, never defaultMonthlyPrice (normalized EUR)
// or a currency conversion. Omit ambiguous/long strings from the overview.
export function stackCatalogPrice(tool: Pick<Tool, "pricing" | "pricingEn"> & { priceUndisclosed?: boolean }, lang: string): string | null {
  if (tool.priceUndisclosed) return null;
  const pricing = lang === "en" ? tool.pricingEn || tool.pricing : tool.pricing;
  if (hasGenuineFreeTier(pricing?.free)) return lang === "en" ? "Free plan" : "Offre gratuite";
  const paid = pricing?.paid?.trim();
  if (!paid || !/\d/.test(paid) || !/[$€£]|\b(?:USD|EUR|GBP)\b/i.test(paid)) return null;
  // English copy must have an English catalogue source; do not translate a
  // tariff by dropping billing conditions from its French source.
  if (lang === "en" && !tool.pricingEn) return null;
  return paid.length <= 100 ? paid : null;
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
  return `${amount} ${plan.nativeCurrency}${period}${plan.pricingUnit ? ` · ${plan.pricingUnit}` : ""}${tax}${commitment}`;
}
