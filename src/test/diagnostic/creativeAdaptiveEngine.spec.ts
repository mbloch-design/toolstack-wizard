import { describe, expect, it } from "vitest";
import {
  buildCreativeQuestions,
  classifyCreativeWorkflowTools,
  rankToolsForCreativeQuestion,
} from "@/lib/creativeAdaptiveEngine";
import type { Tool } from "@/types/diagnostic";

function tool(input: Partial<Tool> & Pick<Tool, "id" | "name">): Tool {
  return {
    id: input.id,
    name: input.name,
    price: 0,
    category: "",
    functional_needs: [],
    verticals: [],
    tool_type: "metier",
    usage: "medium",
    prescription_quality: "oui",
    force_silence: false,
    ...input,
  };
}

const catalog = [
  tool({ id: "figma", name: "Figma", functional_needs: ["ui-design", "prototypage", "design-system"], verticals: ["ux-ui"] }),
  tool({ id: "sketch", name: "Sketch", functional_needs: ["ui-design", "prototypage", "design-system"], verticals: ["ux-ui"] }),
  tool({ id: "penpot", name: "Penpot", functional_needs: ["ui-design", "prototyping"], verticals: ["ux-ui"] }),
  tool({ id: "canva", name: "Canva", functional_needs: ["design-visuel", "presentations"], verticals: ["community-manager"] }),
  tool({ id: "blender", name: "Blender", functional_needs: ["modelisation-3d", "rendu-3d"], verticals: ["motion-video"] }),
  tool({ id: "cinema-4d", name: "Cinema 4D", functional_needs: ["3d", "motion-design"], verticals: ["motion-video"] }),
  tool({ id: "blenderkit", name: "BlenderKit", tool_type: "plugin", host_app: "blender", functional_needs: ["assets"] }),
  tool({ id: "cycles", name: "Cycles", tool_type: "plugin", host_app: "blender", functional_needs: ["rendu-3d"] }),
  tool({ id: "redshift", name: "Redshift", tool_type: "plugin", host_app: "cinema-4d", functional_needs: ["rendu-3d"] }),
  tool({ id: "x-particles", name: "X-Particles", tool_type: "plugin", host_app: "cinema-4d", functional_needs: ["simulation-3d"] }),
  tool({ id: "generic-renderer", name: "Generic Renderer", tool_type: "plugin", functional_needs: ["rendu-3d"] }),
  tool({ id: "figma-iconify", name: "Iconify", tool_type: "plugin", host_app: "figma", functional_needs: ["iconographie"] }),
  tool({ id: "niche-ui-tool", name: "Niche UI Tool", functional_needs: ["ui-design"], verticals: ["ux-ui"] }),
  tool({
    id: "adobe-illustrator",
    name: "Adobe Illustrator",
    functional_needs: ["illustration-vectorielle", "design-visuel"],
    verticals: ["design"],
    relations: [{ kind: "included_in", targetToolId: "adobe-cc" }],
  }),
  tool({
    id: "adobe-cc",
    name: "Adobe Creative Cloud",
    functional_needs: ["retouche-photo", "illustration-vectorielle"],
    verticals: ["design"],
  }),
  tool({
    id: "adobe-creative-cloud",
    name: "Adobe Creative Cloud All Apps",
    functional_needs: ["retouche-photo", "illustration-vectorielle"],
    verticals: ["design"],
  }),
];

describe("creative adaptive engine", () => {
  it("starts from the selected creative output instead of a default product", () => {
    const questions = buildCreativeQuestions(["ui-product"], [], catalog);
    expect(questions.some((question) => question.id === "ui-design")).toBe(true);
    expect(questions.some((question) => question.id === "three-d-creation")).toBe(false);
  });

  it("offers equivalent tools for the same need", () => {
    const question = buildCreativeQuestions(["ui-product"], [], catalog)
      .find((item) => item.id === "ui-design");
    expect(question).toBeDefined();
    const ids = rankToolsForCreativeQuestion(question!, catalog, ["ui-product"])
      .map((item) => item.tool.id);
    expect(ids.slice(0, 3)).toEqual(["figma", "sketch", "penpot"]);
    expect(ids).not.toContain("canva");
  });

  it("supports Blender and Cinema 4D as peers for 3D creation", () => {
    const question = buildCreativeQuestions(["three-d"], [], catalog)
      .find((item) => item.id === "three-d-creation");
    const ids = rankToolsForCreativeQuestion(question!, catalog, ["three-d"])
      .map((item) => item.tool.id);
    expect(ids).toContain("blender");
    expect(ids).toContain("cinema-4d");
  });

  it("keeps commercial suite containers out of workflow tool suggestions", () => {
    const photoQuestion = buildCreativeQuestions(["photo"], [], catalog)
      .find((item) => item.id === "photo-development");
    const ids = rankToolsForCreativeQuestion(photoQuestion!, catalog, ["photo"])
      .map((item) => item.tool.id);

    expect(ids).not.toContain("adobe-creative-cloud");
    expect(ids).not.toContain("adobe-cc");
  });

  it("keeps commercial suite containers out of host ecosystems", () => {
    const illustrator = catalog.find((item) => item.id === "adobe-illustrator")!;
    const ecosystem = buildCreativeQuestions(["brand-visual"], [illustrator], catalog)
      .find((item) => item.id === "ecosystem-adobe-illustrator");
    const ids = rankToolsForCreativeQuestion(ecosystem!, catalog, ["brand-visual"])
      .map((item) => item.tool.id);

    expect(ids).not.toContain("adobe-cc");
  });

  it("keeps an already selected tool available for another need", () => {
    const blender = catalog.find((item) => item.id === "blender")!;
    const renderQuestion = buildCreativeQuestions(["three-d"], [blender], catalog)
      .find((item) => item.id === "three-d-render");
    const result = rankToolsForCreativeQuestion(
      renderQuestion!,
      catalog,
      ["three-d"],
      new Set(["blender"])
    ).find((item) => item.tool.id === "blender");

    expect(result).toBeDefined();
    expect(result?.reasonEn).toContain("already in your stack");
  });

  it("opens distinct ecosystems for Blender and Cinema 4D", () => {
    const blender = catalog.find((item) => item.id === "blender")!;
    const cinema4d = catalog.find((item) => item.id === "cinema-4d")!;
    const questions = buildCreativeQuestions(["three-d"], [blender, cinema4d], catalog);
    const blenderEcosystem = questions.find((item) => item.id === "ecosystem-blender");
    const cinemaEcosystem = questions.find((item) => item.id === "ecosystem-cinema-4d");

    expect(blenderEcosystem?.explicitToolIds).toContain("blenderkit");
    expect(blenderEcosystem?.explicitToolIds).not.toContain("x-particles");
    expect(blenderEcosystem?.explicitToolIds).not.toContain("redshift");
    expect(cinemaEcosystem?.explicitToolIds).toContain("x-particles");
    expect(cinemaEcosystem?.explicitToolIds).toContain("redshift");
    expect(cinemaEcosystem?.explicitToolIds).not.toContain("blenderkit");
    const blenderSuggestions = rankToolsForCreativeQuestion(blenderEcosystem!, catalog, ["three-d"])
      .map((item) => item.tool.id);
    expect(blenderSuggestions).not.toContain("blender");
    expect(blenderSuggestions).not.toContain("generic-renderer");
  });

  it("adds an ecosystem question from a selected host application", () => {
    const figma = catalog.find((item) => item.id === "figma")!;
    const questions = buildCreativeQuestions(["ui-product"], [figma], catalog);
    const ecosystem = questions.find((question) => question.id === "ecosystem-figma");
    expect(ecosystem).toBeDefined();
    const ids = rankToolsForCreativeQuestion(ecosystem!, catalog, ["ui-product"])
      .map((item) => item.tool.id);
    expect(ids).toContain("figma-iconify");
  });

  it("can understand a niche tool through shared needs without a hard-coded branch", () => {
    const question = buildCreativeQuestions(["ui-product"], [], catalog)
      .find((item) => item.id === "ui-design");
    const result = rankToolsForCreativeQuestion(question!, catalog, ["ui-product"])
      .find((item) => item.tool.id === "niche-ui-tool");
    expect(result?.score).toBeGreaterThan(30);
  });

  it("reconstructs the creative workflow from declared roles", () => {
    const figma = catalog.find((item) => item.id === "figma")!;
    const blender = catalog.find((item) => item.id === "blender")!;
    const buffer = tool({ id: "buffer", name: "Buffer", tool_type: "satellite" });
    const buzzsprout = tool({ id: "buzzsprout", name: "Buzzsprout", tool_type: "satellite" });
    const stages = classifyCreativeWorkflowTools(
      [figma, blender, buffer, buzzsprout],
      {
        figma: ["ui-design", "prototype-handoff"],
        blender: ["three-d-creation", "three-d-render"],
        buffer: ["social-publishing"],
        buzzsprout: ["audio-publishing"],
      }
    );

    expect(stages.produce.map((item) => item.id)).toEqual(expect.arrayContaining(["figma", "blender"]));
    expect(stages.accelerate.map((item) => item.id)).toContain("blender");
    expect(stages.review.map((item) => item.id)).toContain("figma");
    expect(stages.publish.map((item) => item.id)).toEqual(expect.arrayContaining(["buffer", "buzzsprout"]));
  });
});
