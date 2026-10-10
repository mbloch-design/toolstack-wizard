import { describe, expect, it } from "vitest";
import catalog from "@/data/tools_index.json";
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
  it.each([["notion", "obsidian"], ["slack", "discord"]])("treats %s and %s as alternatives, not product extensions", (sourceSlug, candidateSlug) => {
    const source = catalog.find((item) => item.slug === sourceSlug) as ToolSummary;
    const candidate = catalog.find((item) => item.slug === candidateSlug) as ToolSummary;
    const [relation] = buildExplorationCandidates({ getCategoryLabel: () => "", sourceTools: [source], tools: [source, candidate], stackEntries: [] });
    expect(relation.direction).toBe("alternatives");
  });

  it("does not invent an ecosystem relation from a shared slug prefix", () => {
    const drive = tool({ id: "google-drive", name: "Google Drive", categoryId: "storage" });
    const ads = tool({ id: "google-ads", name: "Google Ads", categoryId: "advertising" });
    expect(buildExplorationCandidates({ getCategoryLabel: () => "", sourceTools: [drive], tools: [drive, ads], stackEntries: [] })).toEqual([]);
  });

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
    const figma = tool({ id: "figma", name: "Figma", functional_needs: ["ui-design"] });
    const penpot = tool({ id: "penpot", name: "Penpot", functional_needs: ["ui-design"] });
    const entry = { toolSlug: "penpot", needIds: ["dev"], addedAt: "2026-01-01T00:00:00.000Z", assignmentMode: "manual" as const, intent: "stack" as const };
    const [elsewhere] = buildExplorationCandidates({ destinationId: "design", getCategoryLabel: () => "Design", sourceTools: [figma], stackEntries: [entry], tools: [figma, penpot] });
    const [atDestination] = buildExplorationCandidates({ destinationId: "dev", getCategoryLabel: () => "Design", sourceTools: [figma], stackEntries: [entry], tools: [figma, penpot] });

    expect(elsewhere.stackState).toBe("in-stack");
    expect(atDestination.stackState).toBe("in-destination");
  });

  it("génère et relit une URL partageable", () => {
    const href = getExplorerHref("/fr", { type: "outil", slug: "figma" }, { angle: "extensions", destination: "design" });
    const url = new URL(href, "https://tooltrim.test");

    expect(href).toBe("/fr/explorer/around/figma?destination=design&angle=extensions");
    expect(url.pathname).toBe("/fr/explorer/around/figma");
    expect(url.searchParams.get("destination")).toBe("design");
    expect(url.searchParams.get("angle")).toBe("extensions");
    expect(parseExplorationSource(new URLSearchParams("type=outil&source=figma"))).toEqual({ type: "outil", slug: "figma" });
    expect(getExplorerHref("/fr", { type: "stack" })).toBe("/fr/explorer?type=stack&source=ma-stack");
    expect(parseExplorationSource(new URLSearchParams("type=stack&source=ma-stack"))).toEqual({ type: "stack" });
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


describe("Explorer R5 evidence gates", () => {
  const candidates = (source: ToolSummary, others: ToolSummary[]) => buildExplorationCandidates({ relationPolicy: "audited", getCategoryLabel: () => "", sourceTools: [source], tools: [source, ...others], stackEntries: [] });
  const fromCatalog = (slug: string) => catalog.find(item => item.slug === slug) as ToolSummary;

  it("preserves declared comparisons without trusting a polluted substitution cluster", () => {
    const source = fromCatalog("blender");
    const results = candidates(source, [fromCatalog("adobe-photoshop"), fromCatalog("cinema-4d")]);
    expect(results.map(item => item.tool.slug)).toEqual(["cinema-4d"]);
    expect(results[0].direction).toBe("adjacent");
    expect(results[0].reasonFr).toContain("vérifier");
  });
  it("does not recommend stock management around a deployment platform", () => {
    expect(candidates(fromCatalog("vercel"), [fromCatalog("gelato"), fromCatalog("finale-inventory")])).toEqual([]);
  });
  it("does not assert extension compatibility between sibling suite apps", () => {
    const [result] = candidates(fromCatalog("adobe-photoshop"), [fromCatalog("adobe-illustrator")]);
    expect(result.direction).toBe("adjacent");
    expect(result.reasonFr).toContain("suite");
    expect(result.reasonEn).toContain("suite");
  });
  it("does not infer an alternative from generic collaboration or no-code tags", () => {
    expect(candidates(fromCatalog("slack"), [fromCatalog("penpot")])).toEqual([]);
    expect(candidates(fromCatalog("wordpress"), [fromCatalog("browserstack")])).toEqual([]);
  });
  it("labels a shared use as adjacent instead of claiming substitutability", () => {
    const a=tool({id:"a",name:"A",functional_needs:["notes"]});
    const b=tool({id:"b",name:"B",functional_needs:["notes"]});
    expect(candidates(a,[b])[0].direction).toBe("adjacent");
  });
  it("accepts an explicit alternative across categories and aliases", () => {
    const a=tool({id:"source-id",slug:"source",name:"Source",categoryId:"one",functional_needs:["notes"]});
    const b=tool({id:"target-id",slug:"target",name:"Target",categoryId:"two",functional_needs:["notes"],alternatives:["source-id"]});
    expect(candidates(a,[b])[0].direction).toBe("alternatives");
  });
  it("does not emit unrelated candidates from a vertical or category alone", () => {
    const a=tool({id:"a",name:"A",verticals:["creative"]});
    const b=tool({id:"b",name:"B",verticals:["creative"]});
    expect(candidates(a,[b])).toEqual([]);
  });
  it("does not claim a plugin for another host is a replacement for its source app", () => {
    const a=tool({id:"source",name:"Source",alternatives:["plugin"]});
    const plugin=tool({id:"plugin",name:"Plugin",host_app:"other"});
    expect(candidates(a,[plugin])).toEqual([]);
  });
});


it("does not promote a one-way inverse link without shared functional evidence", () => {
 const source=catalog.find(item=>item.slug==="supabase") as ToolSummary;
 const candidate=catalog.find(item=>item.slug==="remix") as ToolSummary;
 expect(buildExplorationCandidates({getCategoryLabel:()=>"",sourceTools:[source],tools:[source,candidate],stackEntries:[]})).toEqual([]);
});
it("does not mix recruitment sourcing and web research", () => {
 const source=catalog.find(item=>item.slug==="perplexity") as ToolSummary;
 const candidate=catalog.find(item=>item.slug==="lever") as ToolSummary;
 expect(buildExplorationCandidates({getCategoryLabel:()=>"",sourceTools:[source],tools:[source,candidate],stackEntries:[]})).toEqual([]);
});


it("qualifies a forward comparison without shared use instead of claiming replacement", () => {
 const source=catalog.find(item=>item.slug==="google-drive") as ToolSummary;
 const candidate=catalog.find(item=>item.slug==="wetransfer") as ToolSummary;
 const [result]=buildExplorationCandidates({getCategoryLabel:()=>"",sourceTools:[source],tools:[source,candidate],stackEntries:[]});
 expect(result.direction).toBe("adjacent");
 expect(result.reasonFr).toContain("vérifier");
});
it("does not use a generic AI-assistant tag to link an API with a task app", () => {
 const source=catalog.find(item=>item.slug==="claude") as ToolSummary;
 const candidate=catalog.find(item=>item.slug==="superlist") as ToolSummary;
 expect(buildExplorationCandidates({getCategoryLabel:()=>"",sourceTools:[source],tools:[source,candidate],stackEntries:[]})).toEqual([]);
});
it("names the shared catalogue use in both languages", () => {
 const source=tool({id:"a",name:"A",functional_needs:["retouche-photo"]});
 const candidate=tool({id:"b",name:"B",functional_needs:["retouche-photo"]});
 const [result]=buildExplorationCandidates({relationPolicy:"audited",getCategoryLabel:()=>"",sourceTools:[source],tools:[source,candidate],stackEntries:[]});
 expect(result.reasonFr).toContain("Retouche photo");
 expect(result.reasonEn).toContain("Photo editing");
});


it.each([["chatgpt", "slido"], ["make", "crayo-ai"], ["n8n", "crayo-ai"]])("does not treat broad method tags as evidence between %s and %s", (sourceSlug, candidateSlug) => {
 const source=catalog.find(item=>item.slug===sourceSlug) as ToolSummary;
 const candidate=catalog.find(item=>item.slug===candidateSlug) as ToolSummary;
 expect(buildExplorationCandidates({getCategoryLabel:()=>"",sourceTools:[source],tools:[source,candidate],stackEntries:[]})).toEqual([]);
});


describe("R5 bounded rollout", () => {
 it("preserves legacy relations for an unaudited source", () => {
  const source=tool({id:"unaudited",name:"Unaudited"});
  const target=tool({id:"other",name:"Other"});
  const options={getCategoryLabel:()=>"",sourceTools:[source],tools:[source,target],stackEntries:[]};
  expect(buildExplorationCandidates(options)).toEqual(buildExplorationCandidates({...options,relationPolicy:"legacy"}));
  expect(buildExplorationCandidates(options)).toHaveLength(1);
  expect(buildExplorationCandidates({...options,relationPolicy:"audited"})).toEqual([]);
 });
 it("keeps multi-source stack exploration on the existing policy", () => {
  const source=catalog.find(item=>item.slug==="vercel") as ToolSummary;
  const second=catalog.find(item=>item.slug==="supabase") as ToolSummary;
  const options={getCategoryLabel:()=>"",sourceTools:[source,second],tools:catalog as ToolSummary[],stackEntries:[]};
  expect(buildExplorationCandidates(options)).toEqual(buildExplorationCandidates({...options,relationPolicy:"legacy"}));
 });
});

describe("R5 second-pass relationship semantics", () => {
  const fromCatalog = (slug: string) => catalog.find(item => item.slug === slug) as ToolSummary;
  const relate = (source: ToolSummary, candidate: ToolSummary) => buildExplorationCandidates({
    relationPolicy: "audited", sourceTools: [source], tools: [source, candidate], stackEntries: [], getCategoryLabel: () => "",
  });
  it.each([false, true])("keeps a declared parent/child out of alternatives (reverse=%s)", reverse => {
    const parent = tool({ id: "parent", name: "Parent", functional_needs: ["notes"], alternatives: ["child"] });
    const child = tool({ id: "child", name: "Child", bundle_parent: "parent", functional_needs: ["notes"], alternatives: ["parent"] });
    const [result] = reverse ? relate(child, parent) : relate(parent, child);
    expect(result.direction).toBe("adjacent");
    expect(result.reasonFr).toContain("suite");
  });
  it.each([false, true])("does not treat a suite subscription as a standalone app alternative (reverse=%s)", reverse => {
    const app = tool({ id: "app", name: "App", tool_type: "metier", functional_needs: ["montage-video"], alternatives: ["suite"] });
    const suite = tool({ id: "suite", name: "Suite", tool_type: "bundle", functional_needs: ["montage-video"], alternatives: ["app"] });
    expect((reverse ? relate(suite, app) : relate(app, suite))[0].direction).toBe("adjacent");
  });
  it("keeps actual peer suites comparable", () => {
    const a=tool({id:"a",name:"A",tool_type:"bundle",functional_needs:["documents"],alternatives:["b"]});
    const b=tool({id:"b",name:"B",tool_type:"bundle",functional_needs:["documents"]});
    expect(relate(a,b)[0].direction).toBe("alternatives");
  });
  it("labels a plugin differently from a built-in function sharing the host", () => {
    const figma=fromCatalog("figma");
    expect(relate(figma,fromCatalog("figma-tokens"))[0].reasonFr).toBe("Extension de Figma");
    expect(relate(figma,fromCatalog("figma-dev-mode"))[0].reasonFr).toBe("Rattaché à Figma");
    expect(relate(figma,fromCatalog("figma-draw"))[0].reasonEn).toBe("Attached to Figma");
  });
  it.each([["figma","framer"],["chatgpt","claude"],["chatgpt","deepseek"],["chatgpt","google-ai-studio"],["claude","chatgpt"]])("qualifies the reviewed surface conflict %s→%s", (source,target) => {
    const [result]=relate(fromCatalog(source),fromCatalog(target));
    expect(result.direction).toBe("adjacent");
    expect(result.reasonFr).toContain("vérifier");
    expect(result.reasonEn).toContain("verify");
  });
  it("excludes the reviewed false replacement Framer→Figma Design", () => {
    expect(relate(fromCatalog("framer"),fromCatalog("figma"))).toEqual([]);
  });
});

it("keeps an unverified comparison behind declared host relations despite family diversification", () => {
 const source=catalog.find(item=>item.slug==="figma") as ToolSummary;
 const comparison=catalog.find(item=>item.slug==="framer") as ToolSummary;
 const plugins=[1,2,3,4].map(id=>tool({id:`plugin-${id}`,name:`Plugin ${id}`,tool_type:"plugin",host_app:"figma"}));
 const result=buildExplorationCandidates({relationPolicy:"audited",sourceTools:[source],tools:[source,comparison,...plugins],stackEntries:[],getCategoryLabel:()=>""});
 expect(result.at(-1)?.tool.slug).toBe("framer");
});

it.each([["davinci-resolve", "adobe-creative-cloud"], ["cinema-4d", "cinema-4d-lite"]])("qualifies the actual suite/limited-edition mismatch %s→%s despite misleading catalogue type", (sourceSlug,targetSlug) => {
 const source=catalog.find(item=>item.slug===sourceSlug) as ToolSummary;
 const target=catalog.find(item=>item.slug===targetSlug) as ToolSummary;
 const [result]=buildExplorationCandidates({relationPolicy:"audited",sourceTools:[source],tools:[source,target],stackEntries:[],getCategoryLabel:()=>""});
 expect(result.direction).toBe("adjacent");
 expect(result.comparisonNeedsReview).toBe(true);
 expect(result.reasonFr).toContain("vérifier");
});

it("does not turn Cinebench's audience tag into a claim that it creates motion graphics", () => {
 const source=catalog.find(item=>item.slug==="cinema-4d") as ToolSummary;
 const target=catalog.find(item=>item.slug==="cinebench") as ToolSummary;
 const [result]=buildExplorationCandidates({relationPolicy:"audited",sourceTools:[source],tools:[source,target],stackEntries:[],getCategoryLabel:()=>""});
 expect(result.reasonFr).not.toContain("Animation graphique");
 expect(result.comparisonNeedsReview).toBe(true);
});
