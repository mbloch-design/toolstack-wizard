import { describe, expect, it } from "vitest";
import toolsCatalog from "@/data/tools_v4.json";
import { hasEditorialSubstance, isEditorialFiller } from "./editorialSubstance";

/**
 * Le bloc editorial des fiches outil etait ouvert par `longueur >= 80
 * caracteres`, applique tel quel aux deux langues. L'anglais etant plus
 * compact, des traductions fideles echouaient la ou le francais passait, et le
 * bloc disparaissait des fiches anglaises.
 *
 * Ce test verrouille les deux proprietes qui comptent : le critere ne doit pas
 * favoriser une langue, et il doit ecarter les textes de remplissage quelle que
 * soit leur longueur.
 */

const tools = toolsCatalog as unknown as Record<string, any>[];

describe("substance editoriale des fiches outil", () => {
  it("accepte une phrase reelle dans les deux langues", () => {
    // Meme phrase, traduite fidelement. L'ancien seuil en caracteres acceptait
    // la version francaise (85) et rejetait l'anglaise (69).
    expect(hasEditorialSubstance(
      "Base de données relationnelle robuste pour SaaS, back-offices et applications métier.",
    )).toBe(true);
    expect(hasEditorialSubstance(
      "Robust relational database for SaaS, back offices, and business apps.",
    )).toBe(true);
  });

  it("rejette les gabarits de remplissage", () => {
    for (const filler of [
      "Tool or resource used in ToolTrim creator stacks.",
      "Specialist tool used in ToolTrim consulting stacks.",
      "Affiliate Dashboards est référencé pour couvrir un besoin précis dans les stacks créateurs de contenu ToolTrim.",
    ]) {
      expect(isEditorialFiller(filler), filler).toBe(true);
      expect(hasEditorialSubstance(filler), filler).toBe(false);
    }
  });

  it("rejette le vide et les fragments", () => {
    for (const empty of ["", "   ", null, undefined, "Gestion de projet."]) {
      expect(hasEditorialSubstance(empty as any)).toBe(false);
    }
  });

  it("ne laisse pas le francais devancer l'anglais sur le catalogue", () => {
    // La propriete qui a motive le correctif : les deux langues doivent ouvrir
    // le bloc sur un nombre comparable de fiches. Avant, c'etait 998 contre
    // 925. La marge de 5 % laisse vivre l'ecart editorial reel sans laisser
    // revenir un biais structurel.
    const fr = tools.filter((t) => hasEditorialSubstance(t.longDescription)).length;
    const en = tools.filter((t) => hasEditorialSubstance(t.longDescriptionEn)).length;
    expect(en, `FR ${fr} / EN ${en}`).toBeGreaterThan(fr * 0.95);
  });
});
