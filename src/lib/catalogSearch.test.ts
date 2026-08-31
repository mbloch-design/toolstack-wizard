import { describe, expect, it } from "vitest";
import { createCatalogSearchEngine, type CatalogSearchDocument } from "@/lib/catalogSearch";

const documents: CatalogSearchDocument[] = [
  {
    id: "tool-rive",
    kind: "tool",
    entityId: "rive",
    slug: "rive",
    label: "Rive",
    meta: "Animation",
    searchText: "animation interactive vectorielle web mobile motion design",
  },
  {
    id: "tool-notion",
    kind: "tool",
    entityId: "notion",
    slug: "notion",
    label: "Notion",
    meta: "Organisation",
    searchText: "notes documentation gestion de projet base de données",
  },
  {
    id: "guide-animation",
    kind: "guide",
    entityId: "guide-animation",
    slug: "animation-web",
    label: "Choisir un outil d’animation web",
    meta: "5 min",
    searchText: "guide animation web designers",
  },
];

describe("catalogSearch", () => {
  it("classe le nom exact avant les correspondances éditoriales", async () => {
    const engine = await createCatalogSearchEngine(documents);
    const hits = await engine.search("Rive");
    expect(hits[0]?.id).toBe("tool-rive");
  });

  it("retrouve un outil par usage et tolère une faute simple", async () => {
    const engine = await createCatalogSearchEngine(documents);
    const hits = await engine.search("animaton interactive");
    expect(hits.some((hit) => hit.id === "tool-rive")).toBe(true);
  });
});
