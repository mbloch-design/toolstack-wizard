import { describe, expect, it } from "vitest";
import {
  buildCommercialFamilies,
  contractCoveredProductIds,
  contractMonthlyTotal,
  contractsForFamily,
  productsCoveredByContract,
} from "@/lib/commercialAccess";
import {
  deriveWorkflowUsages,
  inferWorkflowMethod,
  upsertWorkflowUsage,
  usageMapFromWorkflowUsages,
} from "@/lib/workflowUsage";
import {
  aiCapabilityOptionsForObjective,
  aiCapabilityOptionsForTool,
  createAiActor,
  deriveAiModeFromActors,
  integratedAiFeatureOptions,
  reconcileAiActorsForMode,
  resolveAiCaptureMode,
  setAiActorFeature,
  toggleAiCapability,
  toggleAiConstraint,
} from "@/lib/aiWorkflow";
import { buildAiDiagnosticAnalysis } from "@/lib/aiDiagnostic";
import { runDiagnostic } from "@/utils/scoring";
import {
  formatMonthlyTotal,
  getMonthlyBudgetBreakdown,
  getPricingCaptureSummary,
} from "@/utils/diagnosticPricing";
import type { SessionState, Tool } from "@/types/diagnostic";

function tool(id: string, name: string, price = 0, extra: Partial<Tool> = {}): Tool {
  return {
    id,
    name,
    price,
    category: "creative",
    functional_needs: [],
    tool_type: "metier",
    usage: "medium",
    prescription_quality: "oui",
    force_silence: false,
    ...extra,
  };
}

describe("workflow usage model", () => {
  it("keeps one tool linked to multiple conventional or unusual objectives", () => {
    const objectives = [
      { id: "layout-publishing", fr: "Mise en page", en: "Layout" },
      { id: "quotes", fr: "Devis", en: "Quotes" },
      { id: "moodboard", fr: "Moodboard", en: "Moodboard" },
    ];
    let usages = deriveWorkflowUsages({
      indesign: ["layout-publishing", "quotes"],
      "adobe-illustrator": ["moodboard"],
    }, objectives);
    usages = upsertWorkflowUsage(usages, objectives[1], {
      customMethod: "Je crée mes devis directement dans InDesign",
      method: "mixed",
      satisfaction: "acceptable",
    });

    expect(usages.find((usage) => usage.objectiveId === "quotes")).toMatchObject({
      toolIds: ["indesign"],
      customMethod: "Je crée mes devis directement dans InDesign",
    });
    expect(usageMapFromWorkflowUsages(usages).indesign).toEqual([
      "layout-publishing",
      "quotes",
    ]);
  });

  it("supports manual work and AI as independent dimensions", () => {
    expect(inferWorkflowMethod([], "Je le fais à la main")).toBe("manual");
    expect(inferWorkflowMethod(["figma"], "Puis je termine à la main")).toBe("mixed");
  });

  it("suggests AI capabilities from the objective rather than a software tree", () => {
    const photo = aiCapabilityOptionsForObjective("photo-development", [
      "raw",
      "retouche-photo",
    ]).map((option) => option.id);
    const ui = aiCapabilityOptionsForObjective("ui-design", [
      "ui-design",
      "design-system",
    ]).map((option) => option.id);

    expect(photo).toContain("organize_classify");
    expect(photo).toContain("edit_enhance");
    expect(ui).toContain("generate_layout");
    expect(ui).toContain("generate_code");
    expect(ui).not.toContain("generate_3d");
  });

  it("maps precise capabilities and constraints to the AI actor providing them", () => {
    const photoshopActor = toggleAiConstraint(
      toggleAiCapability(
        createAiActor("integrated", "adobe-photoshop"),
        "remove_extend"
      ),
      "credits"
    );
    const chatgptActor = toggleAiCapability(
      createAiActor("external", "chatgpt"),
      "research_ideation"
    );

    expect(photoshopActor).toMatchObject({
      source: "integrated",
      toolId: "adobe-photoshop",
      capabilityIds: ["remove_extend"],
      constraints: ["credits"],
    });
    expect(deriveAiModeFromActors([photoshopActor, chatgptActor])).toBe("mixed");
    expect(resolveAiCaptureMode("mixed", [photoshopActor])).toBe("mixed");
    expect(resolveAiCaptureMode("automated", [createAiActor("automation")])).toBe("automated");

    const automatedActors = reconcileAiActorsForMode(
      "automated",
      [photoshopActor, chatgptActor],
      ["chatgpt"]
    );
    expect(automatedActors).toMatchObject([
      {
        source: "automation",
        toolId: "chatgpt",
        capabilityIds: ["research_ideation"],
      },
    ]);
    expect(
      reconcileAiActorsForMode("mixed", automatedActors, ["chatgpt"], "adobe-photoshop")
    ).toMatchObject([
      { source: "integrated", toolId: "adobe-photoshop" },
      {
        source: "external",
        toolId: "chatgpt",
        capabilityIds: ["research_ideation"],
      },
    ]);
  });

  it("filters external AI capabilities by the actual AI tool", () => {
    const objectiveOptions = aiCapabilityOptionsForObjective(
      "photo-development",
      ["raw", "retouche-photo"]
    );
    const chatgpt = tool("chatgpt", "ChatGPT", 20, {
      tool_type: "ia",
      functional_needs: ["generation-texte", "brainstorming", "analyse"],
      ia_use_case: "assistant-generaliste",
    });
    const ids = aiCapabilityOptionsForTool(
      objectiveOptions,
      chatgpt
    ).map((option) => option.id);

    expect(ids).toContain("research_ideation");
    expect(ids).toContain("generate_text");
    expect(ids).not.toContain("render_upscale");
    expect(ids).toContain("other");
  });

  it("suggests a named built-in AI capability from the shared ecosystem and current objective", () => {
    const photoshop = tool("adobe-photoshop", "Adobe Photoshop", 26, {
      bundle_parent: "adobe-cc",
      functional_needs: ["retouche-photo"],
    });
    const firefly = tool("firefly", "Adobe Firefly", 0, {
      tool_type: "ia",
      bundle_parent: "adobe-cc",
      functional_needs: ["generation-image", "retouche-photo"],
      ia_use_case: "generation-image",
    });
    const podcast = tool("adobe-podcast-ai", "Adobe Podcast AI", 0, {
      tool_type: "ia",
      bundle_parent: "adobe-cc",
      functional_needs: ["montage-audio", "qualite-podcast"],
      ia_use_case: "traitement-audio",
    });

    expect(
      integratedAiFeatureOptions(
        photoshop,
        [photoshop, firefly, podcast],
        "photo-retouch",
        ["retouche-photo"]
      ).map((item) => item.id)
    ).toEqual(["firefly"]);

    expect(
      setAiActorFeature(createAiActor("integrated", photoshop.id), firefly)
    ).toMatchObject({
      toolId: "adobe-photoshop",
      featureToolId: "firefly",
      featureName: "Adobe Firefly",
    });

    const notion = tool("notion", "Notion", 10, {
      functional_needs: ["brief", "documentation"],
    });
    const notionAi = tool("notion-ai", "Notion AI", 7, {
      tool_type: "ia",
      bundle_parent: "notion",
      functional_needs: ["generation-texte", "synthese"],
    });
    expect(
      integratedAiFeatureOptions(
        notion,
        [notion, notionAi],
        "creative-brief-input",
        ["brief"]
      ).map((item) => item.id)
    ).toEqual(["notion-ai"]);
  });

  it("resolves a built-in AI feature through its ecosystem contract without adding another stack tool", () => {
    const photoshop = tool("adobe-photoshop", "Adobe Photoshop", 26, {
      bundle_parent: "adobe-cc",
    });
    const analysis = buildAiDiagnosticAnalysis({
      selectedTools: [photoshop],
      commercialContracts: [{
        id: "contract-adobe",
        familyId: "adobe",
        familyName: "Adobe",
        accessMode: "suite",
        planId: "photography",
        payer: "self",
        productIds: ["adobe-photoshop", "firefly"],
        monthlyPrice: 12,
        confirmed: true,
      }],
      workflowUsages: [{
        id: "usage-photo-retouch",
        objectiveId: "photo-retouch",
        objectiveLabelFr: "Retouche photo",
        objectiveLabelEn: "Photo retouching",
        method: "tool",
        toolIds: ["adobe-photoshop"],
        aiMode: "integrated",
        aiToolIds: [],
        aiActors: [{
          id: "ai-integrated-adobe-photoshop",
          source: "integrated",
          toolId: "adobe-photoshop",
          featureToolId: "firefly",
          featureName: "Adobe Firefly",
          capabilityIds: ["remove_extend"],
          constraints: ["quota"],
        }],
      }],
    });

    expect(analysis.actorCount).toBe(1);
    expect(analysis.workflows[0].actors[0]).toMatchObject({
      toolName: "Adobe Firefly",
      hostToolName: "Adobe Photoshop",
      accessStatus: "included_limited",
      commercialContractName: "Adobe",
    });
    expect(analysis.unresolvedAccessCount).toBe(0);
    expect(analysis.findings.some((finding) => finding.kind === "access_gap")).toBe(false);
  });

  it("does not create a quota warning when the included AI allowance is sufficient", () => {
    const photoshop = tool("adobe-photoshop", "Adobe Photoshop", 26);
    const analysis = buildAiDiagnosticAnalysis({
      selectedTools: [photoshop],
      commercialContracts: [{
        id: "contract-adobe",
        familyId: "adobe",
        familyName: "Adobe",
        accessMode: "suite",
        payer: "self",
        productIds: ["adobe-photoshop", "firefly"],
        monthlyPrice: 12,
        aiAllowanceStatus: "enough",
        confirmed: true,
      }],
      workflowUsages: [{
        id: "usage-photo-retouch",
        objectiveId: "photo-retouch",
        objectiveLabelFr: "Retouche photo",
        objectiveLabelEn: "Photo retouching",
        method: "tool",
        toolIds: ["adobe-photoshop"],
        aiMode: "integrated",
        aiToolIds: [],
        aiActors: [{
          id: "ai-integrated-adobe-photoshop",
          source: "integrated",
          toolId: "adobe-photoshop",
          featureToolId: "firefly",
          featureName: "Adobe Firefly",
          capabilityIds: ["remove_extend"],
          frequency: "systematic",
          constraints: ["quota"],
        }],
      }],
    });

    expect(analysis.workflows[0].actors[0]).toMatchObject({
      accessStatus: "included",
      allowanceStatus: "enough",
      allowanceLabelFr: "Enveloppe suffisante",
    });
    expect(
      analysis.findings.some((finding) =>
        finding.kind === "usage_pressure" || finding.kind === "risk"
      )
    ).toBe(false);
  });

  it("treats built-in AI as contract-covered when the suite plan is selected even if the amount is still missing", () => {
    const photoshop = tool("adobe-photoshop", "Adobe Photoshop", 26, {
      bundle_parent: "adobe-cc",
    });
    const analysis = buildAiDiagnosticAnalysis({
      selectedTools: [photoshop],
      commercialContracts: [{
        id: "contract-adobe",
        familyId: "adobe",
        familyName: "Adobe",
        accessMode: "suite",
        planId: "photography",
        payer: "self",
        productIds: ["adobe-photoshop", "firefly"],
        confirmed: false,
      }],
      workflowUsages: [{
        id: "usage-photo-retouch",
        objectiveId: "photo-retouch",
        objectiveLabelFr: "Retouche photo",
        objectiveLabelEn: "Photo retouching",
        method: "tool",
        toolIds: ["adobe-photoshop"],
        aiMode: "integrated",
        aiToolIds: [],
        aiActors: [{
          id: "ai-integrated-adobe-photoshop",
          source: "integrated",
          toolId: "adobe-photoshop",
          featureToolId: "firefly",
          featureName: "Adobe Firefly",
          capabilityIds: ["remove_extend"],
        }],
      }],
    });

    expect(analysis.workflows[0].actors[0]).toMatchObject({
      toolName: "Adobe Firefly",
      hostToolName: "Adobe Photoshop",
      accessStatus: "included",
      commercialContractName: "Adobe",
    });
    expect(analysis.unresolvedAccessCount).toBe(0);
    expect(analysis.findings.some((finding) => finding.kind === "access_gap")).toBe(false);
  });

  it("turns recurring AI top-ups into a variable cost and an actionable finding", () => {
    const runway = tool("runway", "Runway", 15, { tool_type: "ia" });
    const contracts: NonNullable<SessionState["commercialContracts"]> = [{
      id: "contract-runway",
      familyId: "runway",
      familyName: "Runway",
      accessMode: "single_products",
      payer: "self",
      productIds: ["runway"],
      monthlyPrice: 15,
      aiAllowanceStatus: "extra_purchases",
      variableMonthlyPrice: 18,
      confirmed: true,
    }];
    const state: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      complementarySkills: [],
      selectedTools: [runway],
      commercialContracts: contracts,
      workflowUsages: [{
        id: "usage-video-generation",
        objectiveId: "video-generation",
        objectiveLabelFr: "Génération vidéo",
        objectiveLabelEn: "Video generation",
        method: "tool",
        toolIds: [],
        aiMode: "external",
        aiToolIds: ["runway"],
        aiActors: [{
          id: "ai-external-runway",
          source: "external",
          toolId: "runway",
          capabilityIds: ["animate"],
          frequency: "regular",
          constraints: ["credits"],
        }],
      }],
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };
    const analysis = buildAiDiagnosticAnalysis(state);
    const result = runDiagnostic(state, {
      allTools: [runway],
      doublonRules: [],
      discoveryQuestions: [],
    });

    expect(contractMonthlyTotal(contracts)).toBe(33);
    expect(result.stackTotalCost).toBe(33);
    expect(analysis.workflows[0].actors[0]).toMatchObject({
      accessStatus: "usage_based",
      allowanceStatus: "extra_purchases",
      variableMonthlyCost: 18,
    });
    expect(analysis.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "usage_pressure",
          severity: "medium",
          reviewRecommended: true,
          labelFr: "Coût IA variable — Runway",
        }),
      ])
    );
  });

  it("keeps team-paid Figma and a personal Midjourney subscription economically distinct", () => {
    const figma = tool("figma", "Figma", 16);
    const midjourney = tool("midjourney", "Midjourney", 9, {
      tool_type: "ia",
    });
    const analysis = buildAiDiagnosticAnalysis({
      selectedTools: [figma, midjourney],
      commercialContracts: [{
        id: "contract-figma",
        familyId: "figma",
        familyName: "Figma",
        accessMode: "team_employer",
        payer: "employer",
        productIds: ["figma"],
        monthlyPrice: 0,
        confirmed: true,
      }, {
        id: "contract-midjourney",
        familyId: "midjourney",
        familyName: "Midjourney",
        accessMode: "single_products",
        payer: "self",
        productIds: ["midjourney"],
        monthlyPrice: 9,
        confirmed: true,
      }],
      workflowUsages: [{
        id: "usage-ui-design",
        objectiveId: "ui-design",
        objectiveLabelFr: "Conception UI",
        objectiveLabelEn: "UI design",
        method: "tool",
        toolIds: ["figma"],
        aiMode: "mixed",
        aiToolIds: ["midjourney"],
        aiActors: [{
          id: "ai-integrated-figma",
          source: "integrated",
          toolId: "figma",
          capabilityIds: ["generate_layout"],
        }, {
          id: "ai-external-midjourney",
          source: "external",
          toolId: "midjourney",
          capabilityIds: ["generate_visual"],
        }],
      }],
    });

    expect(analysis.workflows[0].actors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ toolName: "Figma", accessStatus: "sponsored" }),
        expect.objectContaining({
          toolName: "Midjourney",
          accessStatus: "separate_subscription",
        }),
      ])
    );
  });

  it("turns declared AI limits into a review signal instead of a generic AI badge", () => {
    const photoshop = tool("adobe-photoshop", "Adobe Photoshop", 26, {
      functional_needs: ["retouche-photo"],
    });
    const state: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      primarySpecialty: "photo",
      complementarySkills: [],
      selectedTools: [photoshop],
      toolUsageMap: { "adobe-photoshop": ["photo-retouch"] },
      workflowUsages: [{
        id: "usage-photo-retouch",
        objectiveId: "photo-retouch",
        objectiveLabelFr: "Retouche photo",
        objectiveLabelEn: "Photo retouching",
        method: "tool",
        toolIds: ["adobe-photoshop"],
        aiMode: "integrated",
        aiToolIds: [],
        aiActors: [{
          id: "ai-integrated-adobe-photoshop",
          source: "integrated",
          toolId: "adobe-photoshop",
          capabilityIds: ["remove_extend"],
          constraints: ["credits", "privacy"],
          handlesSensitiveData: true,
        }],
      }],
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };

    const result = runDiagnostic(state, {
      allTools: [photoshop],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const aiSignal = result.insights.answerSignals.find((signal) =>
      signal.id === "ai-risk-photo-retouch-ai-integrated-adobe-photoshop"
    );

    expect(aiSignal).toMatchObject({
      source: "workflow",
      impact: "review",
      toolIds: ["adobe-photoshop"],
    });
    expect(aiSignal?.actionFr).toContain("fichiers");
    expect(result.insights.aiAnalysis).toMatchObject({
      objectiveCount: 1,
      actorCount: 1,
      capabilityCount: 1,
      constrainedActorCount: 1,
    });
    expect(result.insights.riskFlags[0]?.id).toBe(aiSignal?.id);
    expect(result.healthScore).toBeLessThanOrEqual(69);
    expect(result.healthLabel).not.toBe("Optimisée");
    expect(result.insights.maturity.id).toBe("emerging");
  });

  it("only challenges AI tools when the same capability overlaps in the same objective", () => {
    const chatgpt = tool("chatgpt", "ChatGPT", 20, {
      tool_type: "ia",
      ia_use_case: "assistant-generaliste",
    });
    const claude = tool("claude", "Claude", 18, {
      tool_type: "ia",
      ia_use_case: "assistant-generaliste",
    });
    const baseState: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      complementarySkills: [],
      selectedTools: [chatgpt, claude],
      toolUsageMap: {
        chatgpt: ["creative-brief-input"],
        claude: ["creative-brief-input"],
      },
      workflowUsages: [{
        id: "usage-creative-brief-input",
        objectiveId: "creative-brief-input",
        objectiveLabelFr: "Brief et références",
        objectiveLabelEn: "Brief and references",
        method: "tool",
        toolIds: [],
        aiMode: "external",
        aiToolIds: ["chatgpt", "claude"],
        aiActors: [{
          id: "ai-external-chatgpt",
          source: "external",
          toolId: "chatgpt",
          capabilityIds: ["research_ideation"],
          frequency: "regular",
        }, {
          id: "ai-external-claude",
          source: "external",
          toolId: "claude",
          capabilityIds: ["generate_text"],
          frequency: "regular",
        }],
      }],
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };

    const distinctResult = runDiagnostic(baseState, {
      allTools: [chatgpt, claude],
      doublonRules: [],
      discoveryQuestions: [],
    });
    expect(
      distinctResult.prescriptions.phase3.filter((item) => item.type === "doublon-ia")
    ).toHaveLength(0);

    const overlapState: SessionState = {
      ...baseState,
      workflowUsages: [{
        ...baseState.workflowUsages![0],
        aiActors: baseState.workflowUsages![0].aiActors!.map((actor) => ({
          ...actor,
          capabilityIds: ["research_ideation"],
        })),
      }],
    };
    const overlapResult = runDiagnostic(overlapState, {
      allTools: [chatgpt, claude],
      doublonRules: [],
      discoveryQuestions: [],
    });
    expect(
      overlapResult.prescriptions.phase3.filter((item) => item.type === "doublon-ia")
    ).toHaveLength(1);
    expect(overlapResult.insights.aiAnalysis.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "overlap",
          capabilityId: "research_ideation",
          reviewRecommended: true,
        }),
      ])
    );
  });

  it("keeps built-in and separate AI as complementary until their roles are proven redundant", () => {
    const photoshop = tool("adobe-photoshop", "Adobe Photoshop", 26);
    const chatgpt = tool("chatgpt", "ChatGPT", 20, { tool_type: "ia" });
    const analysis = buildAiDiagnosticAnalysis({
      selectedTools: [photoshop, chatgpt],
      workflowUsages: [{
        id: "usage-photo-retouch",
        objectiveId: "photo-retouch",
        objectiveLabelFr: "Retouche photo",
        objectiveLabelEn: "Photo retouching",
        method: "tool",
        toolIds: ["adobe-photoshop"],
        aiMode: "mixed",
        aiToolIds: ["chatgpt"],
        aiActors: [{
          id: "ai-integrated-adobe-photoshop",
          source: "integrated",
          toolId: "adobe-photoshop",
          capabilityIds: ["edit_enhance"],
        }, {
          id: "ai-external-chatgpt",
          source: "external",
          toolId: "chatgpt",
          capabilityIds: ["edit_enhance"],
        }],
      }],
    });

    expect(analysis.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "overlap",
          reviewRecommended: false,
          labelFr: "Rôles IA à différencier",
        }),
      ])
    );
  });

  it("spots a blocked manual step as an automation experiment, not an automatic tool recommendation", () => {
    const analysis = buildAiDiagnosticAnalysis({
      selectedTools: [],
      workflowUsages: [{
        id: "usage-client-review",
        objectiveId: "client-review",
        objectiveLabelFr: "Validation client",
        objectiveLabelEn: "Client review",
        method: "manual",
        toolIds: [],
        aiMode: "none",
        aiToolIds: [],
        satisfaction: "blocked",
      }],
    });

    expect(analysis.actorCount).toBe(0);
    expect(analysis.findings).toEqual([
      expect.objectContaining({
        kind: "automation_opportunity",
        severity: "medium",
        reviewRecommended: true,
      }),
    ]);
  });

  it("groups the same AI tool across objectives while preserving each role and source", () => {
    const chatgpt = tool("chatgpt", "ChatGPT", 20, { tool_type: "ia" });
    const analysis = buildAiDiagnosticAnalysis({
      selectedTools: [chatgpt],
      commercialContracts: [{
        id: "contract-chatgpt",
        familyId: "chatgpt",
        familyName: "ChatGPT",
        accessMode: "single_products",
        payer: "self",
        productIds: ["chatgpt"],
        monthlyPrice: 20,
        confirmed: true,
      }],
      workflowUsages: [{
        id: "usage-brief",
        objectiveId: "creative-brief",
        objectiveLabelFr: "Brief créatif",
        objectiveLabelEn: "Creative brief",
        method: "tool",
        toolIds: [],
        aiMode: "external",
        aiToolIds: ["chatgpt"],
        aiActors: [{
          id: "ai-external-chatgpt",
          source: "external",
          toolId: "chatgpt",
          capabilityIds: ["research_ideation"],
          frequency: "regular",
        }],
      }, {
        id: "usage-social-variants",
        objectiveId: "social-variants",
        objectiveLabelFr: "Déclinaisons sociales",
        objectiveLabelEn: "Social variants",
        method: "tool",
        toolIds: [],
        aiMode: "automated",
        aiToolIds: ["chatgpt"],
        aiActors: [{
          id: "ai-automation-chatgpt",
          source: "automation",
          toolId: "chatgpt",
          capabilityIds: ["automate_workflow", "generate_text"],
          frequency: "systematic",
        }],
      }],
    });

    expect(analysis.actorCount).toBe(1);
    expect(analysis.actorOccurrenceCount).toBe(2);
    expect(analysis.globalActors).toEqual([
      expect.objectContaining({
        toolName: "ChatGPT",
        sourceLabelFr: "Plusieurs modes",
        sources: ["external", "automation"],
        objectiveCount: 2,
        capabilityIds: expect.arrayContaining([
          "research_ideation",
          "automate_workflow",
          "generate_text",
        ]),
        roles: [
          expect.objectContaining({
            objectiveId: "creative-brief",
            source: "external",
          }),
          expect.objectContaining({
            objectiveId: "social-variants",
            source: "automation",
          }),
        ],
      }),
    ]);
  });

  it("creates one quota action when the same contract affects several objectives", () => {
    const runway = tool("runway", "Runway", 15, { tool_type: "ia" });
    const state: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      complementarySkills: [],
      selectedTools: [runway],
      commercialContracts: [{
        id: "contract-runway",
        familyId: "runway",
        familyName: "Runway",
        accessMode: "single_products",
        payer: "self",
        productIds: ["runway"],
        monthlyPrice: 15,
        aiAllowanceStatus: "extra_purchases",
        variableMonthlyPrice: 18,
        confirmed: true,
      }],
      workflowUsages: [
        {
          id: "usage-video-concepts",
          objectiveId: "video-concepts",
          objectiveLabelFr: "Concepts vidéo",
          objectiveLabelEn: "Video concepts",
          method: "tool",
          toolIds: [],
          aiMode: "external",
          aiToolIds: ["runway"],
          aiActors: [{
            id: "ai-external-runway",
            source: "external",
            toolId: "runway",
            capabilityIds: ["generate_visual"],
            frequency: "regular",
            constraints: ["credits"],
          }],
        },
        {
          id: "usage-video-animation",
          objectiveId: "video-animation",
          objectiveLabelFr: "Animation vidéo",
          objectiveLabelEn: "Video animation",
          method: "tool",
          toolIds: [],
          aiMode: "external",
          aiToolIds: ["runway"],
          aiActors: [{
            id: "ai-external-runway",
            source: "external",
            toolId: "runway",
            capabilityIds: ["animate"],
            frequency: "regular",
            constraints: ["credits"],
          }],
        },
      ],
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };
    const result = runDiagnostic(state, {
      allTools: [runway],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const quotaFindings = result.insights.aiAnalysis.findings.filter(
      (finding) => finding.kind === "usage_pressure"
    );
    const quotaSignals = result.insights.answerSignals.filter(
      (signal) => signal.id === quotaFindings[0]?.id
    );

    expect(result.insights.aiAnalysis.actorCount).toBe(1);
    expect(result.insights.aiAnalysis.actorOccurrenceCount).toBe(2);
    expect(quotaFindings).toEqual([
      expect.objectContaining({
        occurrenceCount: 2,
        objectiveIds: ["video-concepts", "video-animation"],
        reviewRecommended: true,
      }),
    ]);
    expect(quotaFindings[0].detailFr).toContain("Concerne 2 étapes");
    expect(quotaSignals).toHaveLength(1);
  });

  it("creates one AI overlap prescription across several objectives", () => {
    const chatgpt = tool("chatgpt", "ChatGPT", 20, { tool_type: "ia" });
    const claude = tool("claude", "Claude", 18, { tool_type: "ia" });
    const sharedActors = [{
      id: "ai-external-chatgpt",
      source: "external" as const,
      toolId: "chatgpt",
      capabilityIds: ["research_ideation" as const],
      frequency: "regular" as const,
    }, {
      id: "ai-external-claude",
      source: "external" as const,
      toolId: "claude",
      capabilityIds: ["research_ideation" as const],
      frequency: "regular" as const,
    }];
    const state: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      complementarySkills: [],
      selectedTools: [chatgpt, claude],
      workflowUsages: [{
        id: "usage-brief",
        objectiveId: "brief",
        objectiveLabelFr: "Brief",
        objectiveLabelEn: "Brief",
        method: "tool",
        toolIds: [],
        aiMode: "external",
        aiToolIds: ["chatgpt", "claude"],
        aiActors: sharedActors,
      }, {
        id: "usage-references",
        objectiveId: "references",
        objectiveLabelFr: "Références",
        objectiveLabelEn: "References",
        method: "tool",
        toolIds: [],
        aiMode: "external",
        aiToolIds: ["chatgpt", "claude"],
        aiActors: sharedActors,
      }],
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };
    const result = runDiagnostic(state, {
      allTools: [chatgpt, claude],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const overlapFindings = result.insights.aiAnalysis.findings.filter(
      (finding) => finding.kind === "overlap"
    );

    expect(overlapFindings).toEqual([
      expect.objectContaining({
        occurrenceCount: 2,
        objectiveIds: ["brief", "references"],
      }),
    ]);
    expect(
      result.prescriptions.phase3.filter(
        (prescription) => prescription.type === "doublon-ia"
      )
    ).toHaveLength(1);
  });
});

describe("commercial contracts", () => {
  const photoshop = tool("adobe-photoshop", "Adobe Photoshop", 26);
  const lightroom = tool("adobe-lightroom", "Adobe Lightroom", 12);
  const indesign = tool("indesign", "Adobe InDesign", 26);

  it("groups Adobe applications under one commercial family", () => {
    const families = buildCommercialFamilies([photoshop, lightroom, indesign]);
    expect(families).toHaveLength(1);
    expect(families[0].id).toBe("adobe");
    expect(families[0].tools.map((item) => item.id)).toEqual([
      "adobe-photoshop",
      "adobe-lightroom",
      "indesign",
    ]);
  });

  it("groups an integrated Canva AI capability with Canva instead of creating another contract", () => {
    const canva = tool("canva", "Canva", 14, {
      bundle_parent: "canva-pro",
    });
    const canvaAi = tool("canva-ai", "Canva AI", 0, {
      bundle_parent: "canva-pro",
      tool_type: "ia",
    });
    const families = buildCommercialFamilies([canva, canvaAi]);

    expect(families).toHaveLength(1);
    expect(families[0]).toMatchObject({
      id: "canva",
      name: "Canva",
    });
    expect(families[0].tools.map((item) => item.id)).toEqual(["canva", "canva-ai"]);
  });

  it("understands that Photography includes some Adobe apps, not every selected app", () => {
    const family = buildCommercialFamilies([photoshop, lightroom, indesign])[0];
    const photography = family.plans.find((plan) => plan.id === "photography")!;
    expect(productsCoveredByContract(family, photography)).toEqual([
      "adobe-photoshop",
      "adobe-lightroom",
    ]);
    const mixed = family.plans.find((plan) => plan.id === "photography-plus")!;
    expect(productsCoveredByContract(family, mixed)).toEqual([
      "adobe-photoshop",
      "adobe-lightroom",
      "indesign",
    ]);
  });

  it("counts a confirmed suite once instead of summing every included product", () => {
    const session: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      complementarySkills: [],
      selectedTools: [photoshop, lightroom, indesign],
      toolUsageMap: {
        "adobe-photoshop": ["photo-retouch"],
        "adobe-lightroom": ["photo-development"],
        indesign: ["layout-publishing"],
      },
      commercialContracts: [{
        id: "contract-adobe",
        familyId: "adobe",
        familyName: "Adobe",
        accessMode: "suite",
        planId: "all-apps",
        planLabel: "Creative Cloud — toutes les apps",
        payer: "self",
        productIds: ["adobe-photoshop", "adobe-lightroom", "indesign"],
        monthlyPrice: 70,
        currency: "EUR",
        confirmed: true,
      }],
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };
    const result = runDiagnostic(session, {
      allTools: session.selectedTools,
      doublonRules: [],
      discoveryQuestions: [],
    });
    expect(result.stackTotalCost).toBe(70);
    expect(result.healthScore).toBeLessThan(80);
    expect(result.healthLabel).not.toBe("Optimisée");
  });

  it("supports Adobe Photography personal plus another Adobe app paid by a client", () => {
    const illustrator = tool("adobe-illustrator", "Adobe Illustrator", 26);
    const contracts: NonNullable<SessionState["commercialContracts"]> = [{
      id: "contract-adobe-photography",
      familyId: "adobe",
      familyName: "Adobe",
      accessMode: "suite",
      planId: "photography",
      planLabel: "Photography plan",
      payer: "self",
      productIds: ["adobe-photoshop", "adobe-lightroom", "firefly"],
      monthlyPrice: 12,
      currency: "EUR",
      confirmed: true,
    }, {
      id: "contract-adobe-client-illustrator",
      familyId: "adobe",
      familyName: "Adobe",
      accessMode: "client_paid",
      planId: "client-paid",
      planLabel: "Paid by a client",
      payer: "client",
      productIds: ["adobe-illustrator"],
      monthlyPrice: 0,
      currency: "EUR",
      confirmed: true,
    }];
    const session: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      complementarySkills: [],
      selectedTools: [photoshop, lightroom, illustrator],
      toolUsageMap: {
        "adobe-photoshop": ["photo-retouch"],
        "adobe-lightroom": ["photo-development"],
        "adobe-illustrator": ["visual-identity"],
      },
      commercialContracts: contracts,
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };
    const family = buildCommercialFamilies(session.selectedTools)[0];
    const result = runDiagnostic(session, {
      allTools: session.selectedTools,
      doublonRules: [],
      discoveryQuestions: [],
    });
    const summary = getPricingCaptureSummary(result.sessionState.selectedTools, contracts);
    const breakdown = getMonthlyBudgetBreakdown(result.sessionState.selectedTools, contracts);

    expect(contractsForFamily(contracts, family)).toHaveLength(2);
    expect(contractMonthlyTotal(contracts)).toBe(12);
    expect(result.stackTotalCost).toBe(12);
    expect(formatMonthlyTotal(result.sessionState.selectedTools, (fr) => fr, contracts)).toBe("12 €");
    expect(breakdown).toMatchObject({
      confirmedEur: 12,
      toVerifyEur: 0,
      hasToVerify: false,
    });
    expect(summary.needsVerificationCount).toBe(0);
    expect(contractCoveredProductIds(contracts)).toEqual(new Set([
      "adobe-photoshop",
      "adobe-lightroom",
      "firefly",
      "adobe-illustrator",
    ]));
    expect(result.sessionState.selectedTools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "adobe-photoshop",
          commercialContractId: "contract-adobe-photography",
          includedInBundle: true,
        }),
        expect.objectContaining({
          id: "adobe-illustrator",
          commercialContractId: "contract-adobe-client-illustrator",
          includedInBundle: true,
        }),
      ])
    );
  });

  it("keeps an employer Creative Cloud contract separate from a personal plugin", () => {
    const illustrator = tool("adobe-illustrator", "Adobe Illustrator", 26);
    const redGiant = tool("red-giant-universe", "Red Giant Universe", 30, {
      tool_type: "plugin",
      host_app: "adobe-after-effects",
      commercial_family: "maxon",
    });
    const contracts: NonNullable<SessionState["commercialContracts"]> = [{
      id: "contract-adobe-employer",
      familyId: "adobe",
      familyName: "Adobe",
      accessMode: "team_employer",
      planId: "team-employer",
      planLabel: "Team or employer license",
      payer: "employer",
      productIds: ["adobe-illustrator"],
      monthlyPrice: 0,
      confirmed: true,
    }, {
      id: "contract-red-giant-personal",
      familyId: "maxon",
      familyName: "Maxon",
      accessMode: "single_products",
      planId: "single-products",
      planLabel: "Separate products",
      payer: "self",
      productIds: ["red-giant-universe"],
      monthlyPrice: 30,
      currency: "EUR",
      confirmed: true,
    }];
    const session: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      complementarySkills: [],
      selectedTools: [illustrator, redGiant],
      toolUsageMap: {
        "adobe-illustrator": ["visual-identity"],
        "red-giant-universe": ["motion-templates"],
      },
      commercialContracts: contracts,
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };
    const result = runDiagnostic(session, {
      allTools: session.selectedTools,
      doublonRules: [],
      discoveryQuestions: [],
    });

    expect(contractMonthlyTotal(contracts)).toBe(30);
    expect(result.stackTotalCost).toBe(30);
    expect(result.sessionState.selectedTools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "adobe-illustrator",
          includedVia: "Adobe",
          commercialContractId: "contract-adobe-employer",
        }),
        expect.objectContaining({
          id: "red-giant-universe",
          includedVia: "Maxon",
          commercialContractId: "contract-red-giant-personal",
        }),
      ])
    );
  });

  it("keeps Canva Pro and included Canva AI under one contract", () => {
    const canva = tool("canva", "Canva", 14, {
      bundle_parent: "canva-pro",
    });
    const canvaAi = tool("canva-ai", "Canva AI", 0, {
      bundle_parent: "canva-pro",
      tool_type: "ia",
    });
    const session: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      complementarySkills: [],
      selectedTools: [canva, canvaAi],
      commercialContracts: [{
        id: "contract-canva-pro",
        familyId: "canva",
        familyName: "Canva",
        accessMode: "single_products",
        planId: "pro",
        planLabel: "Canva Pro",
        payer: "self",
        productIds: ["canva", "canva-ai"],
        monthlyPrice: 14,
        aiAllowanceStatus: "enough",
        confirmed: true,
      }],
      workflowUsages: [{
        id: "usage-social-templates",
        objectiveId: "social-templates",
        objectiveLabelFr: "Templates sociaux",
        objectiveLabelEn: "Social templates",
        method: "tool",
        toolIds: ["canva"],
        aiMode: "integrated",
        aiToolIds: [],
        aiActors: [{
          id: "ai-integrated-canva",
          source: "integrated",
          toolId: "canva",
          featureToolId: "canva-ai",
          featureName: "Canva AI",
          capabilityIds: ["generate_visual"],
        }],
      }],
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };
    const result = runDiagnostic(session, {
      allTools: session.selectedTools,
      doublonRules: [],
      discoveryQuestions: [],
    });
    const analysis = buildAiDiagnosticAnalysis(result.sessionState);

    expect(buildCommercialFamilies(session.selectedTools)).toHaveLength(1);
    expect(result.stackTotalCost).toBe(14);
    expect(analysis.workflows[0].actors[0]).toMatchObject({
      toolName: "Canva AI",
      hostToolName: "Canva",
      accessStatus: "included",
      commercialContractName: "Canva",
    });
  });

  it("keeps Maxon One and Octane as separate 3D contracts", () => {
    const cinema4d = tool("cinema-4d", "Cinema 4D", 65);
    const redshift = tool("redshift", "Redshift", 25);
    const octane = tool("octane-render", "Octane Render", 24, {
      commercial_family: "otoy",
      tool_type: "plugin",
      host_app: "cinema-4d",
    });
    const session: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      complementarySkills: [],
      selectedTools: [cinema4d, redshift, octane],
      toolUsageMap: {
        "cinema-4d": ["3d-modeling"],
        redshift: ["3d-rendering"],
        "octane-render": ["3d-rendering"],
      },
      commercialContracts: [{
        id: "contract-maxon-one",
        familyId: "maxon",
        familyName: "Maxon",
        accessMode: "suite",
        planId: "maxon-one",
        planLabel: "Maxon One",
        payer: "self",
        productIds: ["cinema-4d", "redshift"],
        monthlyPrice: 75,
        confirmed: true,
      }, {
        id: "contract-octane",
        familyId: "otoy",
        familyName: "Octane Render",
        accessMode: "single_products",
        planId: "single-products",
        planLabel: "I pay for this tool",
        payer: "self",
        productIds: ["octane-render"],
        monthlyPrice: 24,
        confirmed: true,
      }],
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };
    const result = runDiagnostic(session, {
      allTools: session.selectedTools,
      doublonRules: [],
      discoveryQuestions: [],
    });

    expect(buildCommercialFamilies(session.selectedTools).map((family) => family.id)).toEqual([
      "maxon",
      "otoy",
    ]);
    expect(result.stackTotalCost).toBe(99);
    expect(result.sessionState.selectedTools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "cinema-4d",
          commercialContractId: "contract-maxon-one",
        }),
        expect.objectContaining({
          id: "redshift",
          commercialContractId: "contract-maxon-one",
        }),
        expect.objectContaining({
          id: "octane-render",
          commercialContractId: "contract-octane",
        }),
      ])
    );
  });

  it("keeps a free tool with paid credits as variable cost instead of a fake subscription", () => {
    const removeBg = tool("remove-bg", "remove.bg", 0, {
      tool_type: "ia",
    });
    const contracts: NonNullable<SessionState["commercialContracts"]> = [{
      id: "contract-remove-bg-credits",
      familyId: "remove-bg",
      familyName: "remove.bg",
      accessMode: "usage_based",
      planId: "credits",
      planLabel: "Credits",
      payer: "self",
      productIds: ["remove-bg"],
      monthlyPrice: 0,
      variableMonthlyPrice: 5,
      confirmed: true,
    }];
    const state: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      complementarySkills: [],
      selectedTools: [removeBg],
      commercialContracts: contracts,
      workflowUsages: [{
        id: "usage-background-removal",
        objectiveId: "background-removal",
        objectiveLabelFr: "Détourage",
        objectiveLabelEn: "Background removal",
        method: "tool",
        toolIds: [],
        aiMode: "external",
        aiToolIds: ["remove-bg"],
        aiActors: [{
          id: "ai-external-remove-bg",
          source: "external",
          toolId: "remove-bg",
          capabilityIds: ["remove_extend"],
          constraints: ["credits"],
        }],
      }],
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };
    const result = runDiagnostic(state, {
      allTools: [removeBg],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const analysis = buildAiDiagnosticAnalysis(state);

    expect(contractMonthlyTotal(contracts)).toBe(5);
    expect(result.stackTotalCost).toBe(5);
    expect(analysis.workflows[0].actors[0]).toMatchObject({
      accessStatus: "usage_based",
      variableMonthlyCost: 5,
    });
  });

  it("does not call an uncertain commercial stack optimized", () => {
    const figma = tool("figma", "Figma", 16, {
      catalogMonthlyPrice: 16,
      selectedOffer: "unknown",
      selectedPriceIsEstimate: true,
    });
    const sketch = tool("sketch", "Sketch", 12, {
      selectedOffer: "paid",
      selectedPriceIsEstimate: false,
    });
    const penpot = tool("penpot", "Penpot", 0, {
      selectedOffer: "free",
      selectedPriceIsEstimate: false,
    });
    const zeplin = tool("zeplin", "Zeplin", 8, {
      selectedOffer: "paid",
      selectedPriceIsEstimate: false,
    });
    const session: SessionState = {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      complementarySkills: [],
      selectedTools: [figma, sketch, penpot, zeplin],
      toolUsageMap: {
        figma: ["ui-design"],
        sketch: ["ui-design"],
        penpot: ["prototype"],
        zeplin: ["handoff"],
      },
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };

    const result = runDiagnostic(session, {
      allTools: session.selectedTools,
      doublonRules: [],
      discoveryQuestions: [],
    });

    expect(result.healthScore).toBeLessThan(80);
    expect(result.healthLabel).not.toBe("Optimisée");
    expect(result.insights.maturity.id).not.toBe("optimized");
    expect(result.insights.profile.id).not.toBe("healthy");
  });

  it("counts one tool once when both its mode and catalog price need verification", () => {
    const summary = getPricingCaptureSummary([
      {
        ...photoshop,
        selectedOffer: "unknown",
        selectedPriceIsEstimate: true,
      },
      {
        ...tool("midjourney", "Midjourney", 9),
        selectedOffer: "unknown",
        selectedPriceIsEstimate: true,
      },
    ]);

    expect(summary.unknownModeCount).toBe(2);
    expect(summary.estimateCount).toBe(2);
    expect(summary.needsVerificationCount).toBe(2);
  });

  it("counts a selected but unpriced suite contract once instead of once per covered app", () => {
    const summary = getPricingCaptureSummary([
      {
        ...photoshop,
        selectedOffer: "unknown",
        selectedPriceIsEstimate: true,
      },
      {
        ...tool("chatgpt", "ChatGPT", 20, { tool_type: "ia" }),
        selectedOffer: "unknown",
        selectedPriceIsEstimate: true,
      },
    ], [{
      id: "contract-adobe",
      familyId: "adobe",
      familyName: "Adobe",
      accessMode: "suite",
      planId: "photography",
      planLabel: "Photography plan",
      payer: "self",
      productIds: ["adobe-photoshop", "firefly"],
      confirmed: false,
    }]);

    expect(summary.needsVerificationCount).toBe(2);
  });
});

describe("recommendations respect the real outcome, not conventional tool usage", () => {
  const indesign = tool("indesign", "Adobe InDesign", 26, {
    functional_needs: ["mise-en-page", "print"],
  });
  const figma = tool("figma", "Figma", 15, {
    functional_needs: ["ui-design", "design-system", "wireframing"],
  });

  function session(satisfaction: "good" | "friction"): SessionState {
    return {
      firstName: "",
      tjm: 0,
      language: "fr",
      persona: "SOFIA",
      primarySpecialty: "ui-product",
      complementarySkills: [],
      selectedTools: [indesign],
      toolUsageMap: { indesign: ["ui-design"] },
      workflowUsages: [{
        id: "usage-ui-design",
        objectiveId: "ui-design",
        objectiveLabelFr: "Conception d’interfaces",
        objectiveLabelEn: "Interface design",
        method: "mixed",
        toolIds: ["indesign"],
        customMethod: "Je fais mes écrans dans InDesign",
        aiMode: "none",
        aiToolIds: [],
        satisfaction,
      }],
      selectionCoverage: {
        covered: ["ui-design"],
        skipped: [],
        confidence: "high",
      },
      discoveryAnswers: new Map(),
      closingAnswers: ["", "", ""],
    };
  }

  it("does not correct an unusual workflow when the user says it works", () => {
    const result = runDiagnostic(session("good"), {
      allTools: [indesign, figma],
      doublonRules: [],
      discoveryQuestions: [],
    });
    expect(result.recommendations).toHaveLength(0);
  });

  it("offers a testable alternative only when the user reports friction", () => {
    const result = runDiagnostic(session("friction"), {
      allTools: [indesign, figma],
      doublonRules: [],
      discoveryQuestions: [],
    });
    expect(result.recommendations.map((item) => item.id)).toContain("figma");
    expect(result.recommendationEvidence?.figma?.reasonFr).toContain("friction");
  });
});
