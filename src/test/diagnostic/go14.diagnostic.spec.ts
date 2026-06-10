// @vitest-environment node
import { describe, expect, it } from "vitest";
import { runDiagnostic } from "@/utils/scoring";
import { GO14_DIAGNOSTIC_DATA, GO14_SCENARIOS } from "@/test/diagnostic/go14Fixtures";
import type { SessionState, Tool } from "@/types/diagnostic";

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

  it("prend en compte les plans gratuits et paliers d'offre avant de recommander une coupure", () => {
    const baseTool = GO14_DIAGNOSTIC_DATA.allTools.find((tool) => tool.id === "notion");
    expect(baseTool).toBeTruthy();
    const paidToolWithFreeTier = {
      ...baseTool!,
      price: 12,
      usage: "low" as const,
      pricing: {
        free: "Plan gratuit disponible",
        paid: "Plus 12€/mois",
      },
      pricing_v5: {
        compare_plan_name: "Plus",
        compare_price_monthly_eur: 12,
        price_reliability: "high",
        source_domain: "notion.so",
      },
    };

    const result = runDiagnostic({
      firstName: "Plan",
      tjm: 400,
      language: "fr",
      persona: "CLAIRE",
      complementarySkills: [],
      selectedTools: [paidToolWithFreeTier],
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    }, {
      ...GO14_DIAGNOSTIC_DATA,
      allTools: [paidToolWithFreeTier],
      doublonRules: [],
      discoveryQuestions: [],
    });

    const prescriptions = [
      ...result.prescriptions.phase1,
      ...result.prescriptions.phase2,
      ...result.prescriptions.phase3,
    ];
    const pricingPrescription = prescriptions.find((item) => item.toolId === "notion");

    expect(pricingPrescription?.type).toBe("pricing-tier");
    expect(pricingPrescription?.verdict).toBe("downgrade");
    expect(pricingPrescription?.pricingContext?.hasFreeTier).toBe(true);
    expect(result.insights.metrics.pricingTierCount).toBe(1);
    expect(result.insights.riskFlags.map((flag) => flag.id)).toContain("pricing_tier_mismatch");
  });

  it("utilise l'objectif du diagnostic pour prioriser les recommandations", () => {
    const overlapToolA: Tool = {
      id: "research-a",
      name: "Research A",
      price: 18,
      category: "research",
      functional_needs: ["research", "notes", "summary"],
      tool_type: "satellite",
      usage: "medium",
      prescription_quality: "oui",
      pertinence_by_persona: { THEO: 88, SOFIA: 50, MARC: 50, ALIX: 50, CLAIRE: 50 },
      force_silence: false,
    };
    const overlapToolB: Tool = {
      id: "research-b",
      name: "Research B",
      price: 25,
      category: "research",
      functional_needs: ["research", "notes", "summary"],
      tool_type: "satellite",
      usage: "medium",
      prescription_quality: "oui",
      pertinence_by_persona: { THEO: 84, SOFIA: 50, MARC: 50, ALIX: 50, CLAIRE: 50 },
      force_silence: false,
    };
    const poorFitTool: Tool = {
      id: "creative-suite",
      name: "Creative Suite",
      price: 12,
      category: "design",
      functional_needs: ["design", "assets"],
      tool_type: "satellite",
      usage: "medium",
      prescription_quality: "oui",
      pertinence_by_persona: { THEO: 20, SOFIA: 94, MARC: 50, ALIX: 72, CLAIRE: 50 },
      force_silence: false,
    };
    const baseSession: SessionState = {
      firstName: "Theo",
      tjm: 0,
      language: "fr",
      persona: "THEO",
      complementarySkills: [],
      selectedTools: [overlapToolA, overlapToolB, poorFitTool],
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };
    const data = {
      allTools: [overlapToolA, overlapToolB, poorFitTool],
      doublonRules: [],
      discoveryQuestions: [],
    };

    const simplifyResult = runDiagnostic({ ...baseSession, stackGoal: "simplify" }, data);
    const qualityResult = runDiagnostic({ ...baseSession, stackGoal: "quality" }, data);

    expect(simplifyResult.prescriptions.phase3[0]?.type).toBe("doublon");
    expect(qualityResult.prescriptions.phase3[0]?.type).toBe("inadapté");
  });
});
