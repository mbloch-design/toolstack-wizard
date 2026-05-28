// @vitest-environment node
import { describe, expect, it } from "vitest";
import { runDiagnostic } from "@/utils/scoring";
import { GO14_DIAGNOSTIC_DATA, GO14_SCENARIOS } from "@/test/diagnostic/go14Fixtures";

function expectNumberBetween(value: number, min?: number, max?: number) {
  if (typeof min === "number") {
    expect(value).toBeGreaterThanOrEqual(min);
  }
  if (typeof max === "number") {
    expect(value).toBeLessThanOrEqual(max);
  }
}

describe("GO14 - Banc de recette metier", () => {
  it("verifie que le jeu de scenarios est coherent", () => {
    expect(GO14_SCENARIOS.length).toBeGreaterThanOrEqual(6);
  });

  for (const scenario of GO14_SCENARIOS) {
    it(`[${scenario.id}] ${scenario.title}`, () => {
      const result = runDiagnostic(scenario.sessionState, GO14_DIAGNOSTIC_DATA);
      const expected = scenario.expected;

      expectNumberBetween(result.healthScore, expected.healthMin, expected.healthMax);

      if (expected.healthLabel) {
        expect(result.healthLabel).toBe(expected.healthLabel);
      }

      if (expected.profileIn && expected.profileIn.length > 0) {
        expect(expected.profileIn).toContain(result.insights.profile.id);
      }

      if (expected.maturityIn && expected.maturityIn.length > 0) {
        expect(expected.maturityIn).toContain(result.insights.maturity.id);
      }

      if (typeof expected.minAnnualSavings === "number") {
        expect(result.annualSavings).toBeGreaterThanOrEqual(expected.minAnnualSavings);
      }

      if (typeof expected.maxAnnualSavings === "number") {
        expect(result.annualSavings).toBeLessThanOrEqual(expected.maxAnnualSavings);
      }

      if (typeof expected.minConfidence === "number") {
        expect(result.insights.confidence.score).toBeGreaterThanOrEqual(expected.minConfidence);
      }

      if (typeof expected.reviewRequired === "boolean") {
        expect(result.insights.calibration.reviewRequired).toBe(expected.reviewRequired);
      }

      if (expected.mustIncludeRiskIds && expected.mustIncludeRiskIds.length > 0) {
        const currentRiskIds = new Set(result.insights.riskFlags.map((flag) => flag.id));
        for (const riskId of expected.mustIncludeRiskIds) {
          expect(currentRiskIds.has(riskId)).toBe(true);
        }
      }

      if (expected.mustIncludeSignalIds && expected.mustIncludeSignalIds.length > 0) {
        const currentSignalIds = new Set(result.insights.answerSignals.map((signal) => signal.id));
        for (const signalId of expected.mustIncludeSignalIds) {
          expect(currentSignalIds.has(signalId)).toBe(true);
        }
      }
    });
  }
});
