import { describe, expect, it } from "vitest";
import toolsData from "@/data/tools_v4.json";
import {
  CREATIVE_OUTPUTS,
  buildCreativeQuestions,
  planCreativeQuestions,
  rankToolsForCreativeQuestion,
} from "@/lib/creativeAdaptiveEngine";
import { getToolRelations } from "@/lib/toolRelations";
import { runDiagnostic } from "@/utils/scoring";
import type { SessionState, Tool } from "@/types/diagnostic";

function mapCatalogTool(raw: Record<string, unknown>): Tool {
  return {
    id: String(raw.id || ""),
    name: String(raw.name || raw.id || ""),
    price: Number(raw.defaultMonthlyPrice || 0),
    category: String(raw.category || ""),
    functional_needs: Array.isArray(raw.functional_needs) ? raw.functional_needs.filter((value): value is string => typeof value === "string") : [],
    verticals: Array.isArray(raw.verticals) ? raw.verticals.filter((value): value is string => typeof value === "string") : [],
    host_app: typeof raw.host_app === "string" ? raw.host_app : undefined,
    bundle_parent: typeof raw.bundle_parent === "string" ? raw.bundle_parent : undefined,
    substitution_cluster_v2: typeof raw.substitution_cluster_v2 === "string" ? raw.substitution_cluster_v2 : undefined,
    tool_type: (raw.tool_type as Tool["tool_type"]) || "satellite",
    usage: "medium",
    prescription_quality: "oui",
    force_silence: false,
  };
}

const catalog = (toolsData as Array<Record<string, unknown>>)
  .map(mapCatalogTool)
  .filter((tool) => tool.id && tool.name);

const expectedQuestions: Record<string, string[]> = {
  "brand-visual": ["visual-identity", "layout-publishing"],
  "ui-product": ["ui-design", "prototype-handoff"],
  photo: ["photo-development", "photo-retouch"],
  video: ["video-edit", "video-finish"],
  motion: ["motion-compositing", "video-finish"],
  illustration: ["illustration-drawing"],
  "three-d": ["three-d-creation", "three-d-render"],
  spaces: ["space-design", "space-documentation", "three-d-render"],
  audio: ["audio-production", "audio-publishing"],
  "social-content": ["social-visuals", "video-edit", "social-publishing"],
};

const sharedQuestionIds = [
  "creative-brief-input",
  "creative-assets",
  "creative-review-delivery",
];

describe("complete creative journey matrix", () => {
  it("covers every declared creative output", () => {
    expect(Object.keys(expectedQuestions).sort()).toEqual(CREATIVE_OUTPUTS.map((output) => output.id).sort());
  });

  for (const [outputId, coreQuestionIds] of Object.entries(expectedQuestions)) {
    it(`[${outputId}] builds only its relevant core branch plus shared workflow`, () => {
      const questions = buildCreativeQuestions([outputId], [], catalog);
      const ids = questions.map((question) => question.id);

      for (const questionId of [...coreQuestionIds, ...sharedQuestionIds]) {
        expect(ids).toContain(questionId);
      }
      expect(new Set(ids).size).toBe(ids.length);

      const unrelatedCoreIds = Object.values(expectedQuestions)
        .flat()
        .filter((questionId) => !coreQuestionIds.includes(questionId));
      for (const questionId of unrelatedCoreIds) {
        expect(ids).not.toContain(questionId);
      }
    });

    it(`[${outputId}] has real catalog suggestions for every core question`, () => {
      const questions = buildCreativeQuestions([outputId], [], catalog)
        .filter((question) => coreQuestionIds.includes(question.id));

      for (const question of questions) {
        const suggestions = rankToolsForCreativeQuestion(question, catalog, [outputId]);
        expect(suggestions.length, `${question.id} should have at least two suggestions`).toBeGreaterThanOrEqual(2);
      }
    });
  }

  it("combines multiple creative outputs without duplicating questions", () => {
    const questions = buildCreativeQuestions(["brand-visual", "ui-product", "social-content"], [], catalog);
    const ids = questions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("visual-identity");
    expect(ids).toContain("ui-design");
    expect(ids).toContain("social-visuals");
    expect(ids.filter((id) => id === "creative-brief-input")).toHaveLength(1);
  });

  it.each([
    ["figma", "ui-product"],
    ["canva", "brand-visual"],
    ["adobe-after-effects", "motion"],
    ["adobe-premiere-pro", "video"],
    ["adobe-photoshop", "photo"],
    ["adobe-lightroom", "photo"],
    ["capture-one", "photo"],
    ["blender", "three-d"],
    ["cinema-4d", "three-d"],
    ["3ds-max", "three-d"],
    ["maya", "three-d"],
    ["houdini", "three-d"],
    ["sketchup-pro", "spaces"],
    ["revit", "spaces"],
  ] as const)("opens a usable ecosystem for %s", (toolId, outputId) => {
    const host = catalog.find((tool) => tool.id === toolId);
    expect(host, `${toolId} must exist in the catalog`).toBeDefined();
    const ecosystem = buildCreativeQuestions([outputId], [host!], catalog)
      .find((question) => question.id === `ecosystem-${toolId}`);
    expect(ecosystem).toBeDefined();
    const suggestions = rankToolsForCreativeQuestion(ecosystem!, catalog, [outputId], new Set([toolId]));
    expect(suggestions.length, `${toolId} ecosystem should contain a real catalog tool`).toBeGreaterThan(0);
    expect(suggestions.map((item) => item.tool.id)).not.toContain(toolId);
  });

  it("covers spatial design, technical documentation and rendering as distinct jobs", () => {
    const questions = buildCreativeQuestions(["spaces"], [], catalog);
    const byId = new Map(questions.map((question) => [question.id, question]));

    const designIds = rankToolsForCreativeQuestion(byId.get("space-design")!, catalog, ["spaces"])
      .map((item) => item.tool.id);
    const documentationIds = rankToolsForCreativeQuestion(byId.get("space-documentation")!, catalog, ["spaces"])
      .map((item) => item.tool.id);
    const renderIds = rankToolsForCreativeQuestion(byId.get("three-d-render")!, catalog, ["spaces"])
      .map((item) => item.tool.id);

    expect(designIds).toContain("sketchup-pro");
    expect(designIds).toContain("revit");
    expect(documentationIds).toContain("layout-sketchup");
    expect(documentationIds).toContain("autocad");
    expect(renderIds).toContain("enscape");
    expect(renderIds).toContain("twinmotion");
  });

  it("opens the real SketchUp Pro extension ecosystem without suggesting the host again", () => {
    const sketchup = catalog.find((tool) => tool.id === "sketchup-pro")!;
    const ecosystem = buildCreativeQuestions(["spaces"], [sketchup], catalog)
      .find((question) => question.id === "ecosystem-sketchup-pro")!;
    const ids = rankToolsForCreativeQuestion(ecosystem, catalog, ["spaces"], new Set(["sketchup-pro"]))
      .map((item) => item.tool.id);

    expect(ids).toContain("layout-sketchup");
    expect(ids).toContain("fredo6-bundle");
    expect(ids).not.toContain("sketchup-pro");
  });

  it("keeps the default journey bounded and defers lower-impact shared areas", () => {
    const questions = buildCreativeQuestions(["ui-product", "three-d"], [], catalog);
    const plan = planCreativeQuestions(questions, {
      outputIds: ["ui-product", "three-d"],
      selectedTools: [],
      coveredIds: new Set(),
      skippedIds: new Set(),
      maxQuestions: 6,
    });
    const ids = plan.questions.map((question) => question.id);

    expect(plan.questions).toHaveLength(6);
    expect(ids).toEqual(expect.arrayContaining([
      "ui-design",
      "prototype-handoff",
      "three-d-creation",
      "three-d-render",
    ]));
    expect(plan.deferred.some((question) => sharedQuestionIds.includes(question.id))).toBe(true);
  });

  it("raises the confirmed host ecosystem without mixing Figma and Sketch plugins", () => {
    const figma = catalog.find((tool) => tool.id === "figma")!;
    const sketch = catalog.find((tool) => tool.id === "sketch")!;
    const figmaQuestions = buildCreativeQuestions(["ui-product"], [figma], catalog);
    const figmaPlan = planCreativeQuestions(figmaQuestions, {
      outputIds: ["ui-product"],
      selectedTools: [figma],
      toolUsageMap: { figma: ["ui-design"] },
      coveredIds: new Set(["ui-design"]),
      skippedIds: new Set(),
      currentId: "prototype-handoff",
      maxQuestions: 6,
    });
    expect(figmaPlan.questions.map((question) => question.id)).toContain("ecosystem-figma");

    const sketchEcosystem = buildCreativeQuestions(["ui-product"], [sketch], catalog)
      .find((question) => question.id === "ecosystem-sketch")!;
    const sketchIds = rankToolsForCreativeQuestion(
      sketchEcosystem,
      catalog,
      ["ui-product"],
      new Set(["sketch"])
    ).map((item) => item.tool.id);

    expect(sketchIds).toContain("zeplin");
    expect(sketchIds.some((id) => id.startsWith("figma-"))).toBe(false);
  });

  it("does not suggest Canva Pro as a workflow complement", () => {
    const canva = catalog.find((tool) => tool.id === "canva")!;
    const canvaEcosystem = buildCreativeQuestions(["social-content"], [canva], catalog)
      .find((question) => question.id === "ecosystem-canva")!;
    const ids = rankToolsForCreativeQuestion(canvaEcosystem, catalog, ["social-content"])
      .map((item) => item.tool.id);

    expect(ids).toContain("canva-templates");
    expect(ids).not.toContain("canva-pro");
  });

  it("keeps Blender and Cinema 4D ecosystems specific to their real hosts", () => {
    const blender = catalog.find((tool) => tool.id === "blender")!;
    const cinema4d = catalog.find((tool) => tool.id === "cinema-4d")!;
    const blenderEcosystem = buildCreativeQuestions(["three-d"], [blender], catalog)
      .find((question) => question.id === "ecosystem-blender")!;
    const cinemaEcosystem = buildCreativeQuestions(["three-d"], [cinema4d], catalog)
      .find((question) => question.id === "ecosystem-cinema-4d")!;
    const blenderIds = rankToolsForCreativeQuestion(blenderEcosystem, catalog, ["three-d"])
      .map((item) => item.tool.id);
    const cinemaIds = rankToolsForCreativeQuestion(cinemaEcosystem, catalog, ["three-d"])
      .map((item) => item.tool.id);

    expect(blenderIds).toEqual(expect.arrayContaining([
      "quixel-megascans",
      "substance-3d-painter",
    ]));
    expect(blenderIds).not.toContain("adobe-after-effects");
    expect(blenderIds).not.toContain("redshift");
    expect(cinemaIds).toEqual(expect.arrayContaining([
      "redshift",
      "adobe-after-effects",
    ]));
    expect(cinemaIds).not.toContain("quixel-megascans");
  });

  it("opens a Lightroom workflow with photo-specific finishing and delivery tools", () => {
    const lightroom = catalog.find((tool) => tool.id === "adobe-lightroom")!;
    const ecosystem = buildCreativeQuestions(["photo"], [lightroom], catalog)
      .find((question) => question.id === "ecosystem-adobe-lightroom")!;
    const ids = rankToolsForCreativeQuestion(ecosystem, catalog, ["photo"])
      .map((item) => item.tool.id);

    expect(ids).toEqual(expect.arrayContaining(["nik-collection", "pixieset"]));
    expect(ids.some((id) => id.startsWith("figma-"))).toBe(false);
  });
});

describe("creative recommendations follow confirmed missing needs", () => {
  const baseSession: SessionState = {
    firstName: "",
    tjm: 0,
    language: "fr",
    persona: "SOFIA",
    primarySpecialty: "ui-product",
    complementarySkills: [],
    selectedTools: [],
    discoveryAnswers: new Map(),
    closingAnswers: ["", "", ""],
  };

  it("recommends one explained tool only for a declared uncovered production need", () => {
    const notion = catalog.find((tool) => tool.id === "notion")!;
    const result = runDiagnostic({
      ...baseSession,
      selectedTools: [notion],
      selectionCoverage: {
        covered: ["creative-brief-input"],
        skipped: ["ui-design"],
        confidence: "medium",
      },
    }, { allTools: catalog, doublonRules: [], discoveryQuestions: [] });

    expect(result.recommendations.map((tool) => tool.id)).toContain("figma");
    expect(result.recommendationEvidence?.figma?.needId).toContain("ui-design");
  });

  it("does not add another tool when the existing one can cover the skipped usage", () => {
    const figma = catalog.find((tool) => tool.id === "figma")!;
    const result = runDiagnostic({
      ...baseSession,
      selectedTools: [figma],
      toolUsageMap: { figma: ["ui-design"] },
      selectionCoverage: {
        covered: ["ui-design"],
        skipped: ["prototype-handoff"],
        confidence: "medium",
      },
    }, { allTools: catalog, doublonRules: [], discoveryQuestions: [] });

    expect(result.recommendations).toHaveLength(0);
  });

  it("does not recommend for skipped areas the user marked as irrelevant", () => {
    const notion = catalog.find((tool) => tool.id === "notion")!;
    const result = runDiagnostic({
      ...baseSession,
      selectedTools: [notion],
      selectionCoverage: {
        covered: [],
        skipped: ["ui-design", "prototype-handoff", "creative-brief-input"],
        confidence: "low",
      },
      discoveryAnswers: new Map([["adaptive_skipped_areas", 2]]),
    }, { allTools: catalog, doublonRules: [], discoveryQuestions: [] });

    expect(result.recommendations).toHaveLength(0);
  });
});

describe("creative relation data is resilient", () => {
  it("normalizes object-shaped relation targets without crashing the journey", () => {
    const tool = {
      ...catalog.find((candidate) => candidate.id === "figma")!,
      alternatives: [{ id: "sketch" }] as unknown as string[],
      relations: [{
        kind: "complements",
        targetToolId: { tool: "zeplin" },
      }] as unknown as Tool["relations"],
    };

    expect(getToolRelations(tool)).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "alternative_to", targetToolId: "sketch" }),
      expect.objectContaining({ kind: "complements", targetToolId: "zeplin" }),
    ]));
  });
});

describe("creative duplicate decisions use declared roles", () => {
  const baseSession: SessionState = {
    firstName: "",
    tjm: 0,
    language: "fr",
    persona: "SOFIA",
    complementarySkills: [],
    selectedTools: [],
    discoveryAnswers: new Map(),
    closingAnswers: ["", "", ""],
  };

  function testTool(id: string, price: number, extra: Partial<Tool> = {}): Tool {
    return {
      id,
      name: id,
      price,
      category: "creative",
      functional_needs: ["design", "assets", "review"],
      tool_type: "metier",
      usage: "medium",
      prescription_quality: "oui",
      force_silence: false,
      ...extra,
    };
  }

  it("keeps similar tools when the user assigned distinct creative roles", () => {
    const creation = testTool("creation-tool", 20);
    const delivery = testTool("delivery-tool", 25);
    const result = runDiagnostic({
      ...baseSession,
      selectedTools: [creation, delivery],
      toolUsageMap: {
        "creation-tool": ["visual-identity"],
        "delivery-tool": ["creative-review-delivery"],
      },
    }, { allTools: [creation, delivery], doublonRules: [], discoveryQuestions: [] });

    expect(result.prescriptions.phase3.some((item) => item.type === "doublon")).toBe(false);
  });

  it("detects overlap when similar tools serve the same creative need", () => {
    const first = testTool("first-tool", 20);
    const second = testTool("second-tool", 25);
    const result = runDiagnostic({
      ...baseSession,
      selectedTools: [first, second],
      toolUsageMap: {
        "first-tool": ["visual-identity"],
        "second-tool": ["visual-identity"],
      },
    }, { allTools: [first, second], doublonRules: [], discoveryQuestions: [] });

    expect(result.prescriptions.phase3.some((item) => item.type === "doublon")).toBe(true);
  });

  it("never treats a creative host and its plugin as duplicates", () => {
    const host = testTool("creative-host", 30);
    const plugin = testTool("creative-plugin", 12, { tool_type: "plugin", host_app: "creative-host" });
    const result = runDiagnostic({
      ...baseSession,
      selectedTools: [host, plugin],
      toolUsageMap: {
        "creative-host": ["motion-compositing"],
        "creative-plugin": ["motion-compositing"],
      },
    }, { allTools: [host, plugin], doublonRules: [], discoveryQuestions: [] });

    expect(result.prescriptions.phase3.some((item) => item.type === "doublon")).toBe(false);
  });

  it("never treats a host and a bundled companion as duplicates", () => {
    const sketchup = testTool("sketchup-pro", 29.44);
    const layout = testTool("layout-sketchup", 0, {
      tool_type: "satellite",
      host_app: "sketchup-pro",
      bundle_parent: "sketchup-pro",
      includedInBundle: true,
      includedVia: "sketchup-pro",
    });
    const result = runDiagnostic({
      ...baseSession,
      selectedTools: [sketchup, layout],
      toolUsageMap: {
        "sketchup-pro": ["space-documentation"],
        "layout-sketchup": ["space-documentation"],
      },
    }, { allTools: [sketchup, layout], doublonRules: [], discoveryQuestions: [] });

    expect(result.prescriptions.phase3.some((item) => item.type === "doublon")).toBe(false);
    expect(result.estimatedWaste).toBe(0);
  });

  it("keeps AI tools when the user assigned them distinct creative roles", () => {
    const exploration = testTool("exploration-ai", 20, { tool_type: "ia", ia_use_case: "visual-generation" });
    const production = testTool("production-ai", 25, { tool_type: "ia", ia_use_case: "visual-generation" });
    const result = runDiagnostic({
      ...baseSession,
      selectedTools: [exploration, production],
      toolUsageMap: {
        "exploration-ai": ["creative-ai"],
        "production-ai": ["video-finish"],
      },
    }, { allTools: [exploration, production], doublonRules: [], discoveryQuestions: [] });

    expect(result.prescriptions.phase3.some((item) => item.type === "doublon-ia")).toBe(false);
  });

  it("flags AI overlap when both tools serve the same declared role", () => {
    const first = testTool("first-ai", 20, {
      tool_type: "ia",
      ia_use_case: "visual-generation",
      functional_needs: ["concept-art"],
    });
    const second = testTool("second-ai", 25, {
      tool_type: "ia",
      ia_use_case: "visual-generation",
      functional_needs: ["generation-image"],
    });
    const result = runDiagnostic({
      ...baseSession,
      selectedTools: [first, second],
      toolUsageMap: {
        "first-ai": ["creative-ai"],
        "second-ai": ["creative-ai"],
      },
    }, { allTools: [first, second], doublonRules: [], discoveryQuestions: [] });

    expect(result.prescriptions.phase3).toEqual(expect.arrayContaining([
      expect.objectContaining({
        toolId: "second-ai",
        type: "doublon-ia",
      }),
    ]));
  });

  it("protects the AI tool used most even when it costs more", () => {
    const daily = testTool("daily-ai", 30, {
      tool_type: "ia",
      ia_use_case: "visual-generation",
      usage: "high",
      functional_needs: ["concept-art"],
    });
    const occasional = testTool("occasional-ai", 10, {
      tool_type: "ia",
      ia_use_case: "visual-generation",
      usage: "low",
      functional_needs: ["generation-image"],
    });
    const result = runDiagnostic({
      ...baseSession,
      selectedTools: [daily, occasional],
      toolUsageMap: {
        "daily-ai": ["creative-ai"],
        "occasional-ai": ["creative-ai"],
      },
    }, { allTools: [daily, occasional], doublonRules: [], discoveryQuestions: [] });

    expect(result.prescriptions.phase3).toEqual(expect.arrayContaining([
      expect.objectContaining({
        toolId: "occasional-ai",
        type: "doublon-ia",
      }),
    ]));
  });

  it("honors an explicit answer that a paid creative plan is justified", () => {
    const hosting = testTool("hosting-tool", 20, {
      tool_type: "satellite",
      prescription_quality: "question",
      freeAlternative: "free-hosting",
      functional_needs: ["distribution-podcast"],
    });
    const planQuestion = {
      id: "adaptive_free_tier_check",
      persona: "ALL" as const,
      question: "Le plan payant est-il justifié ?",
      subtitle: "",
      options: [
        { label: "Oui", impact: "keep" as const, affectedTools: ["hosting-tool"] },
        { label: "Non", impact: "review" as const, affectedTools: ["hosting-tool"] },
      ],
      condition_tool_ids: ["hosting-tool"],
      condition_type: "any" as const,
    };
    const result = runDiagnostic({
      ...baseSession,
      selectedTools: [hosting],
      adaptiveDiscoveryQuestions: [planQuestion],
      discoveryAnswers: new Map([["adaptive_free_tier_check", 0]]),
    }, {
      allTools: [hosting],
      doublonRules: [],
      discoveryQuestions: [planQuestion],
    });

    expect([
      ...result.prescriptions.phase1,
      ...result.prescriptions.phase2,
      ...result.prescriptions.phase3,
    ].some((item) => item.toolId === "hosting-tool")).toBe(false);
    expect(result.estimatedWaste).toBe(0);
  });
});
