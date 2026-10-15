import { describe, expect, it } from "vitest";
import { splitPlanFeature } from "@/components/tool/ToolPricingSection";

describe("splitPlanFeature", () => {
  it("splits a comma list into capitalised lines and drops the final 'et'", () => {
    expect(splitPlanFeature("Uploads de fichiers illimités, historique de page de 30 jours, invités illimités, formulaires et sites personnalisés"))
      .toEqual(["Uploads de fichiers illimités", "Historique de page de 30 jours", "Invités illimités", "Formulaires et sites personnalisés"]);
  });

  it("splits at semicolons and keeps decimal commas and parentheses whole", () => {
    expect(splitPlanFeature("Facturé 11,50 €/mois sans engagement ; crédits IA (10 $ pour 1 000, renouvelés) en plus"))
      .toEqual(["Facturé 11,50 €/mois sans engagement", "Crédits IA (10 $ pour 1 000, renouvelés) en plus"]);
  });

  it("leaves a single idea untouched", () => {
    expect(splitPlanFeature("Sur devis.")).toEqual(["Sur devis."]);
  });
});

describe("splitPlanFeature keeps meaning", () => {
  it("does not split a list whose long tail carries the verb", () => {
    expect(splitPlanFeature("Gratuit pour les équipes ; les collaborateurs en lecture seule, les soumissions de formulaire et les liens de partage ne comptent pas dans les sièges"))
      .toEqual(["Gratuit pour les équipes", "Les collaborateurs en lecture seule, les soumissions de formulaire et les liens de partage ne comptent pas dans les sièges"]);
  });
});
