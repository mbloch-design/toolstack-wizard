import { describe, expect, it } from "vitest";
import { frenchTypography } from "@/lib/typography";

describe("frenchTypography", () => {
  it("met les espaces insécables et les apostrophes typographiques", () => {
    expect(frenchTypography("Quelle plateforme choisir ?", "fr")).toBe("Quelle plateforme choisir ?");
    expect(frenchTypography("Visibilité dans les IA : mesurer", "fr")).toBe("Visibilité dans les IA : mesurer");
    expect(frenchTypography("L'automatisation qu'il faut", "fr")).toBe("L’automatisation qu’il faut");
    expect(frenchTypography("Une boutique e-commerce", "fr")).toBe("Une boutique e‑commerce");
  });
  it("ne touche ni l'anglais ni les URL", () => {
    expect(frenchTypography("Which one ?", "en")).toBe("Which one ?");
    expect(frenchTypography("voir https://tooltrim.com", "fr")).toBe("voir https://tooltrim.com");
  });
});
