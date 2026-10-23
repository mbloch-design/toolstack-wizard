import { describe, expect, it } from "vitest";
import { stackDiagnosis, stackVerdict } from "@/lib/stackDiagnosis";
import type { ToolSummary } from "@/hooks/useSupabaseData";

const tool = (id: string) => ({ id, slug: id, name: id, categoryId: "x", pricing: { free: "", paid: "" } } as ToolSummary);

describe("stackDiagnosis", () => {
  it("orders the steps by what changes the result: freemium, pairs, prices", () => {
    const d = stackDiagnosis({ pairs: 4, amountToReview: 0, unreviewedFreemium: [tool("Canva"), tool("Slack")], unknownPrice: [tool("Stripe")] });
    expect(d.steps.map((s) => s.kind)).toEqual(["freemium", "pairs", "prices"]);
    expect(d.settled).toBe(false);
  });
  it("drops the steps that have nothing to do", () => {
    const d = stackDiagnosis({ pairs: 0, amountToReview: 0, unreviewedFreemium: [], unknownPrice: [tool("Stripe")] });
    expect(d.steps.map((s) => s.kind)).toEqual(["prices"]);
  });
  it("is settled when nothing is left", () => {
    expect(stackDiagnosis({ pairs: 0, amountToReview: 0, unreviewedFreemium: [], unknownPrice: [] }).settled).toBe(true);
  });
});

describe("stackVerdict", () => {
  it("says how many pairs are left, singular and plural, in both languages", () => {
    expect(stackVerdict(1, "fr")).toBe("1 doublon possible à trancher.");
    expect(stackVerdict(4, "fr")).toBe("4 doublons possibles à trancher.");
    expect(stackVerdict(1, "en")).toBe("1 possible overlap to settle.");
    expect(stackVerdict(4, "en")).toBe("4 possible overlaps to settle.");
  });
  it("says there is nothing to settle", () => {
    expect(stackVerdict(0, "fr")).toBe("Aucun doublon à trancher.");
    expect(stackVerdict(0, "en")).toBe("No overlap to settle.");
  });
});
