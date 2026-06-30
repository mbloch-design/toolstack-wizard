import { beforeEach, describe, expect, it } from "vitest";
import {
  loadDiagnosticRecovery,
  saveDiagnosticRecovery,
} from "@/lib/diagnosticRecovery";
import type { SessionState, Tool } from "@/types/diagnostic";

const blender: Tool = {
  id: "blender",
  name: "Blender",
  price: 0,
  priceCurrency: "EUR",
  category: "3d",
  functional_needs: ["modelisation-3d", "rendu-3d"],
  verticals: ["motion-video"],
  tool_type: "metier",
  usage: "high",
  prescription_quality: "oui",
  pricing: { free: "Gratuit" },
  pricing_v5: {
    billing_model: "free",
    compare_price_monthly_eur: 0,
  },
  selectedOffer: "free",
  catalogMonthlyPrice: 0,
  catalogMonthlyPriceCurrency: "EUR",
  selectedPriceIsEstimate: false,
  force_silence: false,
};

function session(): SessionState {
  return {
    firstName: "Sofia",
    tjm: 500,
    language: "fr",
    persona: "SOFIA",
    personaConfidence: "clear",
    stackGoal: "quality",
    complementarySkills: [],
    primarySpecialty: "three-d",
    complementarySpecialties: ["motion"],
    selectedTools: [blender],
    toolUsageMap: {
      blender: ["three-d-creation", "three-d-render"],
    },
    workflowUsages: [{
      id: "usage-three-d-creation",
      objectiveId: "three-d-creation",
      objectiveLabelFr: "Création 3D",
      objectiveLabelEn: "3D creation",
      method: "mixed",
      toolIds: ["blender"],
      customMethod: "Je monte aussi certaines vidéos dans Blender",
      aiMode: "external",
      aiToolIds: ["chatgpt"],
      aiActors: [{
        id: "ai-external-chatgpt",
        source: "external",
        toolId: "chatgpt",
        featureToolId: "chatgpt-credits",
        featureName: "ChatGPT image credits",
        capabilityIds: ["research_ideation"],
        frequency: "regular",
        constraints: ["privacy"],
        handlesSensitiveData: true,
      }],
      satisfaction: "acceptable",
    }],
    commercialContracts: [{
      id: "contract-blender",
      familyId: "blender.org",
      familyName: "Blender",
      accessMode: "free",
      payer: "self",
      productIds: ["blender"],
      monthlyPrice: 0,
      aiAllowanceStatus: "extra_purchases",
      variableMonthlyPrice: 9,
      currency: "EUR",
      confirmed: true,
    }],
    selectionCoverage: {
      covered: ["three-d-creation"],
      skipped: [],
      confidence: "medium",
    },
    adaptiveDiscoveryQuestions: [{
      id: "adaptive_free_tier_check",
      persona: "ALL",
      question: "Le plan payant est-il justifié ?",
      subtitle: "Cette réponse protège le verdict.",
      options: [
        { label: "Oui", impact: "keep", affectedTools: ["blender"] },
        { label: "Non", impact: "review", affectedTools: ["blender"] },
      ],
      condition_tool_ids: ["blender"],
      condition_type: "any",
    }],
    discoveryAnswers: new Map([["adaptive_free_tier_check", 0]]),
    closingAnswers: ["", "", ""],
  };
}

describe("diagnostic recovery", () => {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };

  beforeEach(() => {
    values.clear();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage },
    });
  });

  it("preserves multi-need usage and the selected billing choice", () => {
    saveDiagnosticRecovery({
      funnelVersion: "test",
      step: 2,
      session: session(),
      dbSessionId: null,
      dbSessionToken: null,
      finalSaveDone: false,
      reportEmailQueued: false,
    });

    const recovered = loadDiagnosticRecovery("fr", "test");
    expect(recovered?.session.toolUsageMap?.blender).toEqual(["three-d-creation", "three-d-render"]);
    expect(recovered?.session.workflowUsages).toEqual([
      expect.objectContaining({
        objectiveId: "three-d-creation",
        customMethod: "Je monte aussi certaines vidéos dans Blender",
        aiMode: "external",
        aiToolIds: ["chatgpt"],
        aiActors: [
          expect.objectContaining({
            source: "external",
            toolId: "chatgpt",
            featureToolId: "chatgpt-credits",
            featureName: "ChatGPT image credits",
            capabilityIds: ["research_ideation"],
            frequency: "regular",
            constraints: ["privacy"],
            handlesSensitiveData: true,
          }),
        ],
      }),
    ]);
    expect(recovered?.session.commercialContracts).toEqual([
      expect.objectContaining({
        familyId: "blender.org",
        accessMode: "free",
        aiAllowanceStatus: "extra_purchases",
        variableMonthlyPrice: 9,
        confirmed: true,
      }),
    ]);
    expect(recovered?.session.selectionCoverage).toEqual({
      covered: ["three-d-creation"],
      skipped: [],
      confidence: "medium",
    });
    expect(recovered?.session.selectedTools).toHaveLength(1);
    expect(recovered?.session.selectedTools[0]).toMatchObject({
      id: "blender",
      selectedOffer: "free",
      selectedPriceIsEstimate: false,
      catalogMonthlyPriceCurrency: "EUR",
    });
    expect(recovered?.session.discoveryAnswers.get("adaptive_free_tier_check")).toBe(0);
    expect(recovered?.session.adaptiveDiscoveryQuestions).toEqual([
      expect.objectContaining({
        id: "adaptive_free_tier_check",
        options: [
          expect.objectContaining({ impact: "keep", affectedTools: ["blender"] }),
          expect.objectContaining({ impact: "review", affectedTools: ["blender"] }),
        ],
      }),
    ]);
  });
});
