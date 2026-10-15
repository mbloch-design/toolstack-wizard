import { describe, expect, it } from "vitest";
import { summarizeExplorerReview } from "./explorer-r5-review.mjs";
const candidate = [{ slug: "source", top: [
  { slug: "a", direction: "adjacent", reason: "Shared use" },
  { slug: "b", direction: "alternatives", reason: "Compare" },
] }];
const results = [
  { source: "source", target: "a", rank: 1, direction: "adjacent", status: "credible", critical: false, displayed_reason: "Shared use" },
  { source: "source", target: "b", rank: 2, direction: "alternatives", status: "unknown", critical: true, displayed_reason: "Compare" },
];
describe("R5 editorial evidence integrity", () => {
  it("keeps empty slots and critical reservations in the quality gate", () => {
    const report = summarizeExplorerReview(candidate, { results });
    expect(report.metrics.top8.target_slots).toBe(8);
    expect(report.metrics.top8.available).toBe(2);
    expect(report.metrics.top8.missing).toBe(6);
    expect(report.metrics.top8.by_status).toEqual({ credible: 1, partial: 0, unknown: 1, reject: 0 });
    expect(report.metrics.top8.credible_over_available).toBe(0.5);
    expect(report.metrics.top8.credible_slots_over_target).toBe(0.125);
    expect(report.metrics.top4.critical).toBe(1);
    expect(report.quality_gate).toBe("NOT_ATTAINED");
  });
  it("rejects a stale review after order or wording changes", () => {
    expect(() => summarizeExplorerReview([{ ...candidate[0], top: [...candidate[0].top].reverse() }], { results })).toThrow(/rank/);
    expect(() => summarizeExplorerReview([{ ...candidate[0], top: [{ ...candidate[0].top[0], reason: "Different" }, candidate[0].top[1]] }], { results })).toThrow(/reason/);
  });
  it("rejects missing, duplicate, orphan and invalid judgments", () => {
    expect(() => summarizeExplorerReview(candidate, { results: results.slice(0, 1) })).toThrow(/missing/);
    expect(() => summarizeExplorerReview(candidate, { results: [...results, results[0]] })).toThrow(/duplicate/);
    expect(() => summarizeExplorerReview(candidate, { results: [...results, { ...results[0], target: "orphan" }] })).toThrow(/orphan/);
    expect(() => summarizeExplorerReview(candidate, { results: [{ ...results[0], status: "auto-approved" }, results[1]] })).toThrow(/status/);
  });
  it("requires at least 80 percent of all top-eight slots and no critical top-four reservation", () => {
    const top = Array.from({ length: 8 }, (_, i) => ({ slug: `t${i}`, direction: "adjacent", reason: "Use" }));
    const judgments = top.map((row, i) => ({ source: "source", target: row.slug, rank: i + 1, direction: row.direction, displayed_reason: row.reason, status: i < 7 ? "credible" : "partial", critical: false }));
    expect(summarizeExplorerReview([{ slug: "source", top }], { results: judgments }).quality_gate).toBe("ATTAINED");
    judgments[0].critical = true;
    expect(summarizeExplorerReview([{ slug: "source", top }], { results: judgments }).quality_gate).toBe("NOT_ATTAINED");
  });
});
