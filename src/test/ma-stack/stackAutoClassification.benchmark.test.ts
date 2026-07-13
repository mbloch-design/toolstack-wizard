import { describe, expect, it } from "vitest";
import toolsCatalog from "@/data/tools_v4.json";
import { classifyToolForStack, type SuggestedStackNeedId } from "@/lib/stackAutoClassification";
import { STACK_CLASSIFICATION_BENCHMARK } from "./stackAutoClassification.benchmark";

type CatalogTool = Record<string, unknown> & { id?: string; slug?: string; categoryId?: string; category?: string };

describe("benchmark du rangement autonome", () => {
  it("mesure 100 outils représentatifs et respecte les seuils MVP", () => {
    expect(STACK_CLASSIFICATION_BENCHMARK).toHaveLength(100);
    const catalog = toolsCatalog as CatalogTool[];
    const missing: string[] = [];
    const wrongConfident: string[] = [];
    const unassigned: string[] = [];
    const acceptable: string[] = [];
    const counts = new Map<SuggestedStackNeedId, number>();

    STACK_CLASSIFICATION_BENCHMARK.forEach((fixture) => {
      counts.set(fixture.acceptableNeedIds[0], (counts.get(fixture.acceptableNeedIds[0]) || 0) + 1);
      const tool = catalog.find((candidate) => (candidate.slug || candidate.id) === fixture.slug);
      if (!tool) {
        missing.push(fixture.slug);
        return;
      }
      const result = classifyToolForStack({
        ...tool,
        categoryId: String(tool.categoryId || tool.category || ""),
      });
      const productionNeedIds = result.confidence === "low" ? [] : result.needIds;
      if (productionNeedIds.some((needId) => fixture.acceptableNeedIds.includes(needId))) {
        acceptable.push(fixture.slug);
      } else if (productionNeedIds.length === 0) {
        unassigned.push(fixture.slug);
      } else {
        wrongConfident.push(`${fixture.slug}:${productionNeedIds.join("+")}`);
      }
    });

    const report = {
      acceptable: acceptable.length,
      acceptableRate: acceptable.length / STACK_CLASSIFICATION_BENCHMARK.length,
      wrongConfident,
      wrongConfidentRate: wrongConfident.length / STACK_CLASSIFICATION_BENCHMARK.length,
      unassigned,
      unassignedRate: unassigned.length / STACK_CLASSIFICATION_BENCHMARK.length,
    };
    console.info("Ma stack classification benchmark", report);

    expect(missing, "Tous les outils du benchmark doivent exister").toEqual([]);
    expect(Array.from(counts.keys()).sort()).toEqual(["automation", "design", "dev", "finance", "ia", "marketing", "organisation", "vente"]);
    expect(report.acceptableRate, JSON.stringify(report, null, 2)).toBeGreaterThanOrEqual(0.85);
    expect(report.wrongConfidentRate, JSON.stringify(report, null, 2)).toBeLessThan(0.05);
    expect(report.unassignedRate, JSON.stringify(report, null, 2)).toBeLessThan(0.25);
  });
});
