import type { ToolSummary } from "@/hooks/useSupabaseData";
import { convertAmount, isCurrency, type Currency } from "@/lib/currencyRates";
import { pickNativePrice, stackCatalogPrice, toolKey } from "@/lib/stackView";

/**
 * Coût mensuel catalogue d'une stack, pour la vue Par usage.
 *
 * Décisions de Michael (7 oct. 2026) :
 * - un outil freemium compte 0 sauf s'il est déclaré payé (useStackPaidPlans) ;
 * - le total est converti dans la devise d'affichage, au taux daté du site, et
 *   affiché comme tel (« ≈ … , converti »). Exception assumée à la règle
 *   « jamais de conversion » des fiches, limitée à ce budget.
 * Un outil sans prix attesté, une licence à vie ou une devise non gérée sont
 * laissés hors du total et comptés comme tels.
 */

export type ToolCost =
  | { kind: "free" }
  | { kind: "freemium-free" }
  | { kind: "paid"; monthly: number; currency: Currency; declared: boolean }
  | { kind: "unknown" };

export function toolMonthlyCost(tool: ToolSummary, isPaid: (slug: string) => boolean, lang: string): ToolCost {
  const label = stackCatalogPrice(tool, lang);
  if (label === "Free" || label === "Gratuit") return { kind: "free" };
  const price = pickNativePrice(tool, lang);
  const usable = price && price.period !== "once" && isCurrency(price.currency) ? price : null;
  if (label === "Freemium") {
    if (!isPaid(toolKey(tool))) return { kind: "freemium-free" };
    return usable ? { kind: "paid", monthly: usable.period === "annual" ? usable.amount / 12 : usable.amount, currency: usable.currency as Currency, declared: true } : { kind: "unknown" };
  }
  if (!usable) return { kind: "unknown" };
  return { kind: "paid", monthly: usable.period === "annual" ? usable.amount / 12 : usable.amount, currency: usable.currency as Currency, declared: false };
}

export type StackCost = { total: number; paid: number; freemiumFree: number; free: number; unknown: number };

export function stackMonthlyCost(tools: ToolSummary[], isPaid: (slug: string) => boolean, target: Currency, lang: string): StackCost {
  const result: StackCost = { total: 0, paid: 0, freemiumFree: 0, free: 0, unknown: 0 };
  for (const tool of new Map(tools.map((tool) => [tool.id, tool])).values()) {
    const cost = toolMonthlyCost(tool, isPaid, lang);
    if (cost.kind === "paid") { result.total += convertAmount(cost.monthly, cost.currency, target); result.paid++; }
    else if (cost.kind === "freemium-free") result.freemiumFree++;
    else if (cost.kind === "free") result.free++;
    else result.unknown++;
  }
  return result;
}
