import { describe, expect, it } from "vitest";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { buildExplorationCandidates, getExplorerHref, getObjectiveExplorationThemeId, getObjectiveExplorationThemes, parseExplorationSource } from "@/lib/toolExploration";

function tool(overrides: Partial<ToolSummary> & Pick<ToolSummary, "id" | "name">): ToolSummary {
  return {
    categoryId: "design",
    covers: [],
    functional_needs: [],
    slug: overrides.id,
    verticals: [],
    ...overrides,
  } as ToolSummary;
}

describe("toolExploration", () => {
  it("attribue une relation à l’outil source exact le plus fort", () => {
    const figma = tool({ id: "figma", name: "Figma", functional_needs: ["prototypage"] });
    const notion = tool({ id: "notion", name: "Notion", categoryId: "organisation", functional_needs: ["notes"] });
    const plugin = tool({ id: "tokens-studio", name: "Tokens Studio", host_app: "figma" });
    const [candidate] = buildExplorationCandidates({
      getCategoryLabel: () => "Design",
      sourceTools: [notion, figma],
      stackEntries: [],
      tools: [figma, notion, plugin],
    });

    expect(candidate.relatedSource.name).toBe("Figma");
    expect(candidate.direction).toBe("extensions");
    expect(candidate.reasonFr).toBe("Extension de Figma");
  });

  it("conserve les outils de la stack et distingue la destination", () => {
    const figma = tool({ id: "figma", name: "Figma", functional_needs: ["design"] });
    const penpot = tool({ id: "penpot", name: "Penpot", functional_needs: ["design"] });
    const entry = { toolSlug: "penpot", needIds: ["dev"], addedAt: "2026-01-01T00:00:00.000Z", assignmentMode: "manual" as const };
    const [elsewhere] = buildExplorationCandidates({ destinationId: "design", getCategoryLabel: () => "Design", sourceTools: [figma], stackEntries: [entry], tools: [figma, penpot] });
    const [atDestination] = buildExplorationCandidates({ destinationId: "dev", getCategoryLabel: () => "Design", sourceTools: [figma], stackEntries: [entry], tools: [figma, penpot] });

    expect(elsewhere.stackState).toBe("in-stack");
    expect(atDestination.stackState).toBe("in-destination");
  });

  it("génère et relit une URL partageable", () => {
    const href = getExplorerHref("/fr", { type: "outil", slug: "figma" }, { angle: "extensions", destination: "design" });
    const params = new URL(href, "https://tooltrim.test").searchParams;

    expect(href).toBe("/fr/explorer?type=outil&source=figma&destination=design&angle=extensions");
    expect(parseExplorationSource(params)).toEqual({ type: "outil", slug: "figma" });
  });

  it("transforme un objectif en thématiques plutôt qu’en types de relation", () => {
    const figmaPlugin = tool({ id: "tokens-studio", name: "Tokens Studio", host_app: "figma", functional_needs: ["design-system"] });
    const photo = tool({ id: "affinity-photo", name: "Affinity Photo", functional_needs: ["retouche-photo"] });
    const video = tool({ id: "davinci-resolve", name: "DaVinci Resolve", functional_needs: ["montage-video"] });
    const candidates = [
      { categoryLabel: "Design", tool: figmaPlugin },
      { categoryLabel: "Photo", tool: photo },
      { categoryLabel: "Vidéo", tool: video },
    ];

    expect(getObjectiveExplorationThemeId("design", figmaPlugin)).toBe("interfaces");
    expect(getObjectiveExplorationThemeId("design", photo)).toBe("image-identite");
    expect(getObjectiveExplorationThemeId("design", video)).toBe("video-mouvement");
    expect(getObjectiveExplorationThemes("design", candidates).map((theme) => theme.labelFr)).toEqual([
      "Interfaces",
      "Image & identité",
      "Vidéo & mouvement",
    ]);
  });
});
