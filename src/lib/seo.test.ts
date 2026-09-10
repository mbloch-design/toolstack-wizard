import { describe, expect, it } from "vitest";
import { getLanguageSwitchPath, hasNonCanonicalSearchParams } from "./seo";

describe("hasNonCanonicalSearchParams", () => {
  it("keeps clean catalogue paths indexable", () => {
    expect(hasNonCanonicalSearchParams(new URLSearchParams())).toBe(false);
  });

  it("marks every filter, search or tracking variant as non-canonical", () => {
    for (const query of ["q=notion", "category=crm", "sort=name", "utm_source=test"]) {
      expect(hasNonCanonicalSearchParams(new URLSearchParams(query))).toBe(true);
    }
  });
});

describe("getLanguageSwitchPath", () => {
  it("translates localized tool route suffixes", () => {
    expect(getLanguageSwitchPath("/fr/tool/notion/prix", "en")).toBe("/en/tool/notion/pricing");
    expect(getLanguageSwitchPath("/en/tool/notion/reviews", "fr")).toBe("/fr/tool/notion/avis");
  });

  it("translates paired guide slugs", () => {
    expect(getLanguageSwitchPath("/fr/guide/notion-gratuit-ou-payant", "en")).toBe(
      "/en/guide/notion-free-or-paid",
    );
    expect(getLanguageSwitchPath("/en/guide/notion-free-or-paid", "fr")).toBe(
      "/fr/guide/notion-gratuit-ou-payant",
    );
    expect(getLanguageSwitchPath("/fr/guide/meilleurs-outils-designer-freelance", "en")).toBe(
      "/en/guide/best-tools-freelance-designer",
    );
  });

  it("does not invent an English URL for a French-only guide", () => {
    expect(
      getLanguageSwitchPath(
        "/fr/guide/notion-gratuit-vs-payant-vrai-calcul",
        "en",
      ),
    ).toBe("/en/guides");
  });

  it("keeps neutral route segments unchanged", () => {
    expect(getLanguageSwitchPath("/fr/tools", "en")).toBe("/en/tools");
  });
});
