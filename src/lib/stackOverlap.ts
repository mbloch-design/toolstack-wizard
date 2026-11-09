import type { Category } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { convertAmount, type Currency } from "@/lib/currencyRates";
import { toolMonthlyCost } from "@/lib/stackCost";
import { stackRelations } from "@/lib/stackUsage";
import { toolKey } from "@/lib/stackView";
import { pairKey, type StackDecision } from "@/hooks/useStackDecisions";

/*
 * Overlaps of Ma stack: pairs of tools that do the same job (explicit catalogue alternative or
 * shared uses), each with an estimated cost to review: when both are paid, the cheaper one.
 * Not proof of redundant spending; the person decides.
 */

export type ScoredPair = { a: ToolSummary; b: ToolSummary; shared: string[]; explicit: boolean; double: number; cheaper: ToolSummary };

/**
 * Pairs of tools that overlap (explicit catalogue alternative or shared
 * catalogue uses), each with an estimated cost to review: when both have
 * a positive cost, the cheaper one. This is not proof of redundant spending. Sorted by that amount. `doubleTotal` counts each tool once.
 * Shared by the hero figure and the Overlaps section so both say the same.
 * Pairs the person chose to keep both are left out.
 */
export function scoreOverlapPairs(tools: ToolSummary[], categories: Category[], isPaid: (slug: string) => boolean, currency: Currency, lang: "fr" | "en", decisions: Record<string, StackDecision> = {}) {
  const monthly = (tool: ToolSummary) => {
    const cost = toolMonthlyCost(tool, isPaid, lang);
    return cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0;
  };
  const pairs: ScoredPair[] = [];
  const seen = new Set<string>();
  for (const a of tools) {
    for (const relation of stackRelations(a, tools, categories, lang)) {
      if (!relation.explicit && relation.commonUses.length === 0) continue;
      const key = [a.id, relation.tool.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      // A pair the person decided to keep is no longer "to review" nor included in the review amount.
      if (decisions[pairKey(toolKey(a), toolKey(relation.tool))]?.kind === "keep-both") continue;
      const [ca, cb] = [monthly(a), monthly(relation.tool)];
      pairs.push({ a, b: relation.tool, shared: relation.commonUses, explicit: relation.explicit, double: ca > 0 && cb > 0 ? Math.min(ca, cb) : 0, cheaper: ca <= cb ? a : relation.tool });
    }
  }
  pairs.sort((x, y) => y.double - x.double || Number(y.explicit) - Number(x.explicit));
  const counted = new Set<string>();
  const doubleTotal = pairs.reduce((sum, pair) => {
    if (!pair.double || counted.has(pair.cheaper.id)) return sum;
    counted.add(pair.cheaper.id);
    return sum + pair.double;
  }, 0);
  return { pairs, doubleTotal };
}
