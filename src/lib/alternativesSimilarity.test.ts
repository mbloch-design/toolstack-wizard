// @vitest-environment node
import { describe, it, expect } from "vitest";
import { computeSimilarity, isRelevantAlternative, findSimilarTools } from "./alternativesSimilarity";
import type { Tool } from "@/data/types";

// Minimal fixtures — only the fields the similarity function reads.
function tool(overrides: Partial<Tool> & { id: string }): Tool {
  return {
    name: overrides.id,
    categoryId: "",
    shortDescription: "",
    pricing: { free: "", paid: "" },
    defaultMonthlyPrice: 0,
    verdict: { keepIf: [], avoidIf: [], threshold: "" },
    pros: [],
    cons: [],
    relevantFor: [],
    affiliateLink: "",
    tool_type: "satellite",
    substitutable: true,
    verticals: [],
    functional_needs: [],
    prescription_quality: "silence",
    ...overrides,
  } as Tool;
}

const asana = tool({
  id: "asana",
  functional_needs: ["project management"],
  verticals: ["manager-dsi", "fondateur-saas", "consultant-b2b"],
});

const wrike = tool({
  id: "wrike",
  functional_needs: ["project management"],
  verticals: ["manager-dsi", "fondateur-saas", "consultant-b2b"],
});

const allstate = tool({
  id: "allstate",
  functional_needs: ["insurance"],
  verticals: ["consultant-b2b", "fondateur-saas"],
});

const auvik = tool({
  id: "auvik",
  functional_needs: ["it management"],
  verticals: ["consultant-b2b", "fondateur-saas"],
});

// Real catalog data (verified 2026-06-25): ClickUp and Trello are tagged
// with French-slug functional_needs ("gestion-taches", "collaboration",
// "planning") while Asana/Wrike use the English phrase "project
// management" for the same concept. Documents the known taxonomy
// limitation described in alternativesSimilarity.ts's module docstring.
const clickup = tool({
  id: "clickup",
  functional_needs: ["gestion-taches", "collaboration", "planning"],
  verticals: ["manager-dsi", "fondateur-saas", "consultant-b2b"],
});

describe("computeSimilarity", () => {
  it("scores two tools with identical functional_needs and verticals at 1", () => {
    expect(computeSimilarity(asana, wrike)).toBe(1);
  });

  it("scores a tool with completely unrelated functional_needs at 0, even with overlapping verticals", () => {
    // Allstate shares 2 of Asana's 3 verticals (same target audience), but
    // "insurance" has zero overlap with "project management" - this is
    // exactly the Allstate-as-Asana-alternative case the external audit
    // flagged. The product correctly comes out at 0 because the F factor
    // is 0, regardless of how high the R factor is.
    expect(computeSimilarity(asana, allstate)).toBe(0);
    expect(computeSimilarity(asana, auvik)).toBe(0);
  });

  it("is symmetric: computeSimilarity(A, B) === computeSimilarity(B, A)", () => {
    expect(computeSimilarity(asana, allstate)).toBe(computeSimilarity(allstate, asana));
    expect(computeSimilarity(asana, wrike)).toBe(computeSimilarity(wrike, asana));
  });

  it("returns 0 when either tool has no functional_needs or no verticals", () => {
    const bare = tool({ id: "bare", functional_needs: [], verticals: [] });
    expect(computeSimilarity(asana, bare)).toBe(0);
  });

  it("normalizes case and separator differences (spaces/underscores -> hyphens)", () => {
    const spaced = tool({ id: "spaced", functional_needs: ["Project Management"], verticals: ["manager-dsi"] });
    const hyphenated = tool({ id: "hyphenated", functional_needs: ["project-management"], verticals: ["manager_dsi"] });
    expect(computeSimilarity(spaced, hyphenated)).toBe(1);
  });

  it("KNOWN LIMITATION: cross-language functional_needs tags for the same concept score 0, not normalized as synonyms", () => {
    // ClickUp is a real, editorially-recommended Asana alternative
    // (betterAlternative.tool === "clickup" on the live Asana fiche), but
    // its functional_needs use French slugs while Asana's use an English
    // phrase. This test exists to make the limitation visible in CI, not
    // to assert it's correct behavior - see the module docstring.
    expect(computeSimilarity(asana, clickup)).toBe(0);
  });
});

describe("isRelevantAlternative", () => {
  it("excludes a tool scoring exactly at the threshold (0.75), not just below it", () => {
    // Construct an exact 0.75: F=1 (identical needs), R=3/4 (B is A's
    // verticals plus one extra: intersection 3, union 4).
    const a = tool({ id: "a", functional_needs: ["x"], verticals: ["r1", "r2", "r3"] });
    const b = tool({ id: "b", functional_needs: ["x"], verticals: ["r1", "r2", "r3", "r4"] });
    expect(computeSimilarity(a, b)).toBeCloseTo(0.75, 5);
    expect(isRelevantAlternative(a, b)).toBe(false);
  });

  it("includes a tool scoring above the threshold", () => {
    expect(isRelevantAlternative(asana, wrike)).toBe(true);
  });

  it("accepts a custom threshold", () => {
    expect(isRelevantAlternative(asana, clickup, 0)).toBe(false); // score is exactly 0, must be > 0
    expect(isRelevantAlternative(asana, wrike, 0.99)).toBe(true);
  });
});

describe("findSimilarTools", () => {
  it("excludes the tool itself and anything at/below the threshold, ranked by score descending", () => {
    const candidates = [wrike, allstate, auvik, clickup, asana];
    const result = findSimilarTools(asana, candidates);
    expect(result.map((t) => t.id)).toEqual(["wrike"]);
  });

  it("returns an empty array when no candidate clears the threshold", () => {
    expect(findSimilarTools(asana, [allstate, auvik])).toEqual([]);
  });
});
