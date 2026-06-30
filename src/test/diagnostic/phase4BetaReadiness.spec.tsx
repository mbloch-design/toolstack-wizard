import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { describe, expect, it } from "vitest";
import DashActions from "@/components/dashboard/DashActions";
import DashOverview from "@/components/dashboard/DashOverview";
import { serializeDiagnosticResultForPdf } from "@/components/dashboard/DashPdfExport";
import { buildDiagnosticDecisionPlan, getProvenRecommendations } from "@/utils/diagnosticDecisionPlan";
import { runDiagnostic } from "@/utils/scoring";
import type { DiagnosticResult, SessionState, Tool } from "@/types/diagnostic";

const t = (fr: string) => fr;

function tool(input: Partial<Tool> & Pick<Tool, "id" | "name">): Tool {
  return {
    id: input.id,
    name: input.name,
    price: input.price ?? 0,
    priceCurrency: input.priceCurrency,
    catalogMonthlyPrice: input.catalogMonthlyPrice,
    catalogMonthlyPriceCurrency: input.catalogMonthlyPriceCurrency,
    category: input.category ?? "",
    functional_needs: input.functional_needs ?? [],
    verticals: input.verticals ?? [],
    tool_type: input.tool_type ?? "metier",
    usage: input.usage ?? "medium",
    prescription_quality: input.prescription_quality ?? "oui",
    force_silence: false,
    host_app: input.host_app,
    bundle_parent: input.bundle_parent,
    provider_id: input.provider_id,
    commercial_family: input.commercial_family,
    ia_use_case: input.ia_use_case,
    pertinence_by_persona: input.pertinence_by_persona,
  };
}

function session(patch: Partial<SessionState> = {}): SessionState {
  return {
    firstName: "Camille",
    tjm: 0,
    language: "fr",
    persona: "SOFIA",
    primarySpecialty: "social-audio",
    complementarySkills: [],
    selectedTools: [],
    discoveryAnswers: new Map(),
    closingAnswers: ["", "", ""],
    ...patch,
  };
}

const canva = tool({
  id: "canva",
  name: "Canva",
  price: 12,
  tool_type: "metier",
  commercial_family: "canva",
  functional_needs: ["design-visuel", "social-media", "templates", "brand-kit"],
});
const canvaAi = tool({
  id: "canva-ai",
  name: "Canva AI",
  price: 0,
  tool_type: "ia",
  commercial_family: "canva",
  bundle_parent: "canva",
  ia_use_case: "generation-image",
  functional_needs: ["generation-image", "generation-texte"],
});
const capcut = tool({
  id: "capcut",
  name: "CapCut",
  price: 8,
  tool_type: "metier",
  functional_needs: ["montage-video", "sous-titres", "social-video"],
});
const buffer = tool({
  id: "buffer",
  name: "Buffer",
  price: 6,
  tool_type: "satellite",
  functional_needs: ["publication-sociale", "planification-posts"],
});
const descript = tool({
  id: "descript",
  name: "Descript",
  price: 15,
  tool_type: "metier",
  functional_needs: ["montage-audio", "transcription", "sous-titres"],
});
const figma = tool({
  id: "figma",
  name: "Figma",
  price: 15,
  functional_needs: ["ui-design", "design-system"],
});

const socialAudioSession = session({
  selectedTools: [canva, canvaAi, capcut, buffer, descript],
  toolUsageMap: {
    canva: ["social-media", "templates", "brand-kit"],
    "canva-ai": ["generation-image", "generation-texte"],
    capcut: ["social-video", "sous-titres"],
    buffer: ["publication-sociale"],
    descript: ["montage-audio", "transcription"],
  },
  workflowUsages: [
    {
      id: "usage-social-visuals",
      objectiveId: "social-visuals",
      objectiveLabelFr: "Déclinaisons sociales",
      objectiveLabelEn: "Social variations",
      method: "mixed",
      toolIds: ["canva"],
      customMethod: "Templates Canva + adaptations manuelles",
      aiMode: "integrated",
      aiToolIds: ["canva-ai"],
      aiActors: [{
        id: "ai-integrated-canva",
        source: "integrated",
        toolId: "canva",
        featureToolId: "canva-ai",
        featureName: "Canva AI",
        capabilityIds: ["generate_visual", "generate_text"],
        frequency: "regular",
      }],
      satisfaction: "good",
      importance: "high",
      frequency: "daily",
    },
    {
      id: "usage-short-video",
      objectiveId: "short-video",
      objectiveLabelFr: "Montage vertical court",
      objectiveLabelEn: "Short vertical editing",
      method: "tool",
      toolIds: ["capcut"],
      aiMode: "integrated",
      aiToolIds: ["capcut"],
      aiActors: [{
        id: "ai-integrated-capcut",
        source: "integrated",
        toolId: "capcut",
        capabilityIds: ["transcribe_translate", "edit_enhance"],
        frequency: "systematic",
      }],
      satisfaction: "acceptable",
      importance: "high",
      frequency: "weekly",
    },
    {
      id: "usage-audio-captions",
      objectiveId: "audio-captions",
      objectiveLabelFr: "Audio, transcription et sous-titres",
      objectiveLabelEn: "Audio, transcription and captions",
      method: "mixed",
      toolIds: ["descript", "capcut"],
      customMethod: "Je transcris dans Descript puis je finis les sous-titres dans CapCut",
      aiMode: "mixed",
      aiToolIds: ["descript", "capcut"],
      aiActors: [{
        id: "ai-external-descript",
        source: "external",
        toolId: "descript",
        capabilityIds: ["transcribe_translate", "edit_enhance"],
        frequency: "regular",
      }],
      satisfaction: "friction",
      importance: "critical",
      frequency: "weekly",
    },
    {
      id: "usage-publishing",
      objectiveId: "social-publishing",
      objectiveLabelFr: "Publication et planification",
      objectiveLabelEn: "Publishing and scheduling",
      method: "tool",
      toolIds: ["buffer"],
      aiMode: "none",
      aiToolIds: [],
      satisfaction: "good",
      importance: "medium",
      frequency: "weekly",
    },
  ],
  commercialContracts: [{
    id: "contract-canva",
    familyId: "canva",
    familyName: "Canva",
    accessMode: "suite",
    planId: "canva-pro",
    planLabel: "Canva Pro",
    payer: "self",
    productIds: ["canva", "canva-ai"],
    monthlyPrice: 12,
    aiAllowanceStatus: "enough",
    confirmed: true,
  }],
  selectionCoverage: {
    covered: ["social-visuals", "short-video", "audio-captions", "social-publishing"],
    skipped: [],
    confidence: "high",
  },
});

describe("Phase 4 beta readiness dry-runs", () => {
  it("keeps the Social/Audio dry-run inside the trusted restitution contract", () => {
    const result = runDiagnostic(socialAudioSession, {
      allTools: [canva, canvaAi, capcut, buffer, descript, figma],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const decisions = buildDiagnosticDecisionPlan(result);
    const provenRecommendations = getProvenRecommendations(result);

    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions.length).toBeLessThanOrEqual(3);
    expect(decisions.every((decision) => decision.evidenceFr.trim().length > 0)).toBe(true);
    expect(decisions.some((decision) => decision.detailFr.includes("Descript"))).toBe(true);
    expect(provenRecommendations.every(({ evidence }) => evidence.reasonFr.trim().length > 0)).toBe(true);
  });

  it("renders the mobile-sensitive overview and action plan from a restored Social/Audio session", () => {
    const result = runDiagnostic({
      ...socialAudioSession,
      firstName: "Mobile",
      selectionCoverage: {
        covered: ["social-visuals", "short-video"],
        skipped: ["social-publishing"],
        confidence: "medium",
      },
    }, {
      allTools: [canva, canvaAi, capcut, buffer, descript],
      doublonRules: [],
      discoveryQuestions: [],
    });

    const overviewHtml = renderToStaticMarkup(<DashOverview result={result} t={t} />);
    const actionsHtml = renderToStaticMarkup(
      <StaticRouter location="/fr/selector">
        <DashActions result={result} allTools={[canva, canvaAi, capcut, buffer, descript]} t={t} />
      </StaticRouter>
    );

    expect(overviewHtml).toContain("Rapport d’audit");
    expect(overviewHtml).toContain("Chaîne créative");
    expect(actionsHtml).toContain("Plan guidé");
    expect(actionsHtml).toContain("trois décisions");
  });

  it("exports the same proven decision contract to the PDF payload", () => {
    const base = runDiagnostic(socialAudioSession, {
      allTools: [canva, canvaAi, capcut, buffer, descript, figma],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const resultWithUnprovedRecommendation: DiagnosticResult = {
      ...base,
      recommendations: [...base.recommendations, figma],
      recommendationEvidence: base.recommendationEvidence,
    };

    const payload = serializeDiagnosticResultForPdf(resultWithUnprovedRecommendation, t);

    expect(payload.primaryDecisions.length).toBeLessThanOrEqual(3);
    expect(payload.primaryDecisions.every((decision) => decision.evidence.trim().length > 0)).toBe(true);
    expect(payload.recommendations.some((recommendation) => recommendation.id === "figma")).toBe(false);
  });
});
