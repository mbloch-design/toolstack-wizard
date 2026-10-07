import { describe, expect, it } from "vitest";
import catalogue from "@/data/tools_index.json";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { stackMapTerritories, stackPlacement, stackRelations, stackUsageLabels } from "@/lib/stackUsage";
import { stackCatalogPrice } from "@/lib/stackView";
const tools = catalogue as unknown as ToolSummary[];
const find = (slug: string) => tools.find((tool) => tool.slug === slug)!;
const ids = ["zbrush", "houdini", "cinema-4d", "adobe-express", "audacity", "grammarly", "motion-array", "ae-red-giant", "vidiq", "adobe-after-effects", "adobe-acrobat", "fly-io", "wix", "figma", "miro", "make", "zapier", "notion", "slack", "chatgpt", "claude", "dropbox", "calendly", "typeform", "canva"];

describe("Mon Stack V2 semantic reading", () => {
  it("separates the observed broad creation category using real summary metadata", () => {
    const expected = { zbrush: "3d", houdini: "3d", "cinema-4d": "3d", "adobe-express": "design", audacity: "audio", grammarly: "writing", "motion-array": "video", "ae-red-giant": "video", vidiq: "audience", "adobe-after-effects": "video", "adobe-acrobat": "knowledge", "fly-io": "hosting", wix: "sites", figma: "interface", miro: "interface", make: "workflows", zapier: "workflows" };
    for (const [slug, group] of Object.entries(expected)) expect(stackPlacement(find(slug), [], "fr").id, slug).toBe(group);
  });
  for (const size of [1, 5, 13, 25]) it(`keeps ${size} tools unique and creates only populated groups`, () => {
    const selected = ids.slice(0, size).map(find);
    expect(selected.every(Boolean)).toBe(true);
    const map = stackMapTerritories(selected, [], "fr");
    const flattened = map.flatMap((territory) => territory.groups.flatMap((group) => group.tools));
    expect(flattened).toHaveLength(size);
    expect(new Set(flattened.map((tool) => tool.id)).size).toBe(size);
    expect(map.every((territory) => territory.groups.every((group) => group.tools.length > 0))).toBe(true);
  });
  it("distinguishes a mapped neighbour from an explicit alternative, and excludes category-only links", () => {
    const sameCategory = { ...find("motion-array"), id: "unknown", slug: "unknown", functional_needs: [], covers: [], substitution_cluster_v2: undefined, freeAlternative: undefined, betterAlternative: undefined };
    const relations = stackRelations(find("motion-array"), [find("motion-array"), find("ae-red-giant"), find("audacity"), sameCategory], [], "fr");
    expect(relations.map((item) => item.tool.slug)).toEqual(["ae-red-giant"]);
    expect(relations[0].label).toBe("Également dans Vidéo & Motion");
    const explicit = { ...find("make"), alternatives: ["zapier"] };
    expect(stackRelations(explicit, [find("zapier")], [], "en")[0].label).toBe("Known alternative in your stack");
  });
  it("explains shared catalogue uses across territories without inferring unknown capabilities", () => {
    const source = { ...find("figma"), functional_needs: ["prototyping", "unknown-tag"], covers: ["prototyping"] };
    const crossTerritory = { ...find("notion"), functional_needs: ["prototyping", "unknown-tag"], covers: [] };
    const unknownOnly = { ...find("dropbox"), functional_needs: ["unknown-tag"], covers: [] };
    const generalNeighbour = { ...find("miro"), functional_needs: [], covers: [] };
    const relations = stackRelations(source, [generalNeighbour, crossTerritory, unknownOnly, source], [], "fr");
    expect(relations.map((item) => item.tool.slug)).toEqual(["notion", "miro"]);
    expect(relations[0].commonUses).toEqual(["Prototypage"]);
    expect(relations[0].label).toBe("Usages communs au catalogue");
    expect(relations[1].commonUses).toEqual([]);
    expect(stackRelations(source, [crossTerritory], [], "en")[0].commonUses).toEqual(["Prototyping"]);
  });
  it("keeps broad labels as territory context rather than precise cross-domain links", () => {
    const relations = stackRelations(find("zbrush"), [find("cinema-4d"), find("ae-red-giant"), find("audacity")], [], "fr");
    expect(relations.map((item) => item.tool.slug)).toEqual(["cinema-4d"]);
    expect(relations[0].commonUses).toEqual([]);
    const design = stackRelations(find("adobe-express"), [find("canva")], [], "fr");
    expect(design[0].commonUses).not.toContain("Design visuel");
  });
  it("provides a precise shared use and leaves an unrelated audio tool without invented links", () => {
    expect(stackRelations(find("figma"), [find("miro")], [], "fr")[0].commonUses).toContain("Prototypage");
    expect(stackRelations(find("audacity"), [find("figma"), find("miro"), find("canva")], [], "fr")).toEqual([]);
  });
  it("translates known uses without exposing unknown slugs or guessing a placement", () => {
    expect(stackPlacement(find("chatgpt"), [], "en").id).toBe("ai");
    expect(stackPlacement(find("claude"), [], "en").id).toBe("ai");
    expect(stackPlacement(find("dropbox"), [], "en").id).toBe("storage");
    expect(stackPlacement(find("typeform"), [], "en").id).toBe("forms");
    expect(stackUsageLabels(find("motion-array"), "fr")).toEqual(["Ressources motion", "Stock vidéo", "Templates vidéo", "Musique & Effets sonores"]);
    const unknown = { ...find("audacity"), functional_needs: ["unknown-raw-tag"], covers: [], substitution_cluster_v2: undefined };
    expect(stackUsageLabels(unknown, "en")).toEqual([]);
    expect(stackPlacement(unknown, [], "fr").evidence).toBe("category");
  });
  it("summarizes genuine free, freemium, paid and custom pricing without false free/zero/approximate labels", () => {
    expect(stackCatalogPrice(find("audacity"), "fr")).toBe("Gratuit");
    expect(stackCatalogPrice(find("grammarly"), "en")).toBe("Freemium");
    expect(stackCatalogPrice(find("cinema-4d"), "fr")).toBe("Dès 69,92\u00a0$/mois");
    expect(stackCatalogPrice(find("cinema-4d"), "en")).toBe("From $69.92/mo");
    expect(stackCatalogPrice(find("fly-io"), "fr")).toBeNull();
    expect(stackCatalogPrice(find("adobe-express"), "fr")).toBeNull();
    const price = (paid: string, free = "", nativePrices?: { amount: number; currency: string; period: "monthly" | "annual" | "once" }[]) => stackCatalogPrice({ pricing: { free, paid }, nativePrices }, "fr");
    expect(price("Sur devis")).toBe("Sur devis");
    // Attested compare-plan prices only: an amount in editorial text is never read.
    expect(price("Starter 12 €/mois, Enterprise sur devis")).toBe("Sur devis");
    expect(price("Starter 12 €/mois, Enterprise sur devis", "", [{ amount: 12, currency: "EUR", period: "monthly" }])).toBe("Dès 12\u00a0€/mois");
    expect(price("Startup : 600 $US/mois", "", [{ amount: 600, currency: "USD", period: "monthly" }])).toBe("Dès 600\u00a0$/mois");
    expect(price("", "", [{ amount: 120, currency: "EUR", period: "annual" }])).toBe("Dès 120\u00a0€/an");
    expect(stackCatalogPrice({ pricing: { free: "", paid: "Sur devis" }, priceUndisclosed: true }, "fr")).toBe("Sur devis");
    expect(price("Prix non public", "Plan gratuit disponible")).toBeNull();
    expect(price("$1,000/month")).toBeNull();
    expect(price("$0/month")).toBeNull();
    expect(price("", "Essai gratuit 7 jours")).toBeNull();
  });
});
