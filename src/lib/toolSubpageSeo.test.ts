import { describe, expect, it } from "vitest";
import { getAlternateLinks } from "./seo";
import { isToolSubpageIndexable, isToolSubpagePairIndexable, parseToolSubpagePath } from "./toolSubpageSeo";

describe("tool sub-page indexation", () => {
  it("reads both languages' segments", () => {
    expect(parseToolSubpagePath("/en/tool/loom/pricing")).toEqual({ lang: "en", slug: "loom", kind: "prix" });
    expect(parseToolSubpagePath("/fr/tool/loom/avis")).toEqual({ lang: "fr", slug: "loom", kind: "avis" });
    expect(parseToolSubpagePath("/fr/tool/loom")).toBeNull();
  });

  it("keeps a sub-page with search demand in the index", () => {
    // 21 947 impressions in three months (export of 25/11/2026).
    expect(isToolSubpageIndexable("en", "supabase", "alternatives")).toBe(true);
  });

  it("takes out a page ranking on the opposite intent, with no hreflang", () => {
    expect(isToolSubpageIndexable("en", "ruby", "alternatives")).toBe(false);
    expect(isToolSubpagePairIndexable("ruby", "alternatives")).toBe(false);
    expect(getAlternateLinks("/en/tool/ruby/alternatives")).toEqual([]);
  });

  it("never takes out a review page or a fiche", () => {
    expect(isToolSubpageIndexable("fr", "ruby", "avis")).toBe(true);
    expect(getAlternateLinks("/fr/tool/ruby").length).toBe(3);
  });
});
