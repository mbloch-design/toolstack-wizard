import { describe, expect, it } from "vitest";
import { deName, frSentenceCase, queName } from "./frenchText";

describe("frenchText", () => {
  it("elides before a vowel only", () => {
    expect(deName("Airtable")).toBe("d'Airtable");
    expect(deName("Adobe Lightroom")).toBe("d'Adobe Lightroom");
    expect(deName("Notion")).toBe("de Notion");
    expect(deName("HubSpot")).toBe("de HubSpot");
    expect(queName("Asana")).toBe("qu'Asana");
    expect(queName("Figma")).toBe("que Figma");
  });

  it("turns Title Case labels into French sentence case, keeping acronyms", () => {
    expect(frSentenceCase("Gestion de Projet")).toBe("Gestion de projet");
    expect(frSentenceCase("IA Généraliste")).toBe("IA généraliste");
    expect(frSentenceCase("SIRH & Paie")).toBe("SIRH & paie");
    expect(frSentenceCase("Design & Prototypage")).toBe("Design & prototypage");
  });
});
