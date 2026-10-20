import { describe, expect, it } from "vitest";
import { hasGenuineFreeTier } from "./pricing";

describe("hasGenuineFreeTier", () => {
  it("reads an elided « pas d'offre gratuite » as no free plan", () => {
    expect(hasGenuineFreeTier("Pas d'offre gratuite permanente.")).toBe(false);
    expect(hasGenuineFreeTier("Pas d’offre gratuite dans la grille publiée.")).toBe(false);
    expect(hasGenuineFreeTier("No permanent free plan.")).toBe(false);
  });

  it("keeps a free plan that lists what it lacks", () => {
    expect(hasGenuineFreeTier("Plan gratuit : 3 projets, aucun agent IA.")).toBe(true);
  });
});
