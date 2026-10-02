import { describe, expect, it } from "vitest";
import config from "@/data/bestOfGuides.json";
import data from "@/data/bestOfGuidesData.json";
import { quickPicks, rankTools, type BestOfTool } from "./bestOfRanking";

const toolsOf = (id: string) => {
  const guide = config.guides.find((g) => g.id === id)!;
  return guide.tools.map((slug) => (data as Record<string, BestOfTool>)[slug]);
};

describe("pages « meilleurs outils »", () => {
  it("classe chaque page sur la note, sans trou ni doublon", () => {
    for (const guide of config.guides) {
      const rows = rankTools(toolsOf(guide.id), "en");
      expect(rows.map((r) => r.rank)).toEqual(rows.map((_, i) => i + 1));
      expect(new Set(rows.map((r) => r.tool.slug)).size).toBe(guide.tools.length);
      for (let i = 1; i < rows.length; i++) expect((rows[i - 1].score ?? 0) >= (rows[i].score ?? 0)).toBe(true);
    }
  });

  it("n'affiche jamais un prix converti : la devise vient de la fiche", () => {
    // Archicad publie dollars et euros : chaque langue lit sa propre grille.
    // Notion n'a qu'une grille en euros : euros sur les deux pages.
    const notion = (data as Record<string, BestOfTool>).notion;
    expect(rankTools([notion], "en")[0].priceText).toContain("€");
    expect(rankTools([notion], "fr")[0].priceText).toContain("€");
    const obsidian = (data as Record<string, BestOfTool>).obsidian;
    expect(rankTools([obsidian], "fr")[0].priceText).toContain("$");
  });

  it("ne compare pas une licence à vie avec un abonnement pour le moins cher", () => {
    for (const guide of config.guides) {
      const picks = quickPicks(rankTools(toolsOf(guide.id), "en"));
      if (picks.budget) expect(["recurring", "one_time"]).toContain(picks.budget.priceKind);
    }
  });
});
