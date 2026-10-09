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

  it("garde une correspondance littérale courte visible malgré les résultats flous", async () => {
    const noise = Array.from({ length: 24 }, (_, index): CatalogSearchDocument => ({
      id: `tool-viso-adjacent-${index}`,
      kind: "tool",
      entityId: `viso-adjacent-${index}`,
      slug: `viso-adjacent-${index}`,
      label: `Viso adjacent ${index}`,
      meta: "Tools",
      searchText: "visual workflow platform",
    }));
    const engine = await createCatalogSearchEngine([
      ...noise,
      {
        id: "tool-viso-ai",
        kind: "tool",
        entityId: "viso-ai",
        slug: "viso-ai",
        label: "Viso AI",
        meta: "AI & Generative Tools",
        searchText: "computer vision platform",
      },
    ]);

    const hits = await engine.search("viso", 17);
    expect(hits[0]?.id).toBe("tool-viso-ai");
  });

  it("retrouve un outil par usage et tolère une faute simple", async () => {
    const engine = await createCatalogSearchEngine(documents);
    const hits = await engine.search("animaton interactive");
    expect(hits.some((hit) => hit.id === "tool-rive")).toBe(true);
  });

  it("ne confond pas un sigle court avec un mot voisin (crm ≠ .com, ia ≠ .io)", async () => {
    const engine = await createCatalogSearchEngine([
      { id: "tool-monday", kind: "tool", entityId: "monday", slug: "monday", label: "Monday.com", meta: "Projet", searchText: "work management", category: "Gestion de projet" },
      { id: "tool-pipedrive", kind: "tool", entityId: "pipedrive", slug: "pipedrive", label: "Pipedrive", meta: "CRM", searchText: "pipeline commercial", category: "CRM" },
      { id: "tool-reply", kind: "tool", entityId: "reply-io", slug: "reply-io", label: "Reply.io", meta: "Email", searchText: "sales engagement", category: "Email" },
      { id: "tool-runway", kind: "tool", entityId: "runway", slug: "runway", label: "Runway", meta: "Vidéo", searchText: "génération vidéo par IA", category: "Création de contenu" },
    ]);
    const crm = await engine.search("CRM");
    expect(crm[0]?.id).toBe("tool-pipedrive");
    expect(crm.some((hit) => hit.id === "tool-monday")).toBe(false);
    const video = await engine.search("IA vidéo");
    expect(video[0]?.id).toBe("tool-runway");
    expect(video.some((hit) => hit.id === "tool-reply")).toBe(false);
  });

  it("ignore les mots vides et classe la catégorie avant le texte libre", async () => {
    const engine = await createCatalogSearchEngine([
      { id: "tool-hr", kind: "tool", entityId: "hr", slug: "hr", label: "PayrollCo", meta: "RH", searchText: "gestion de la paie et des projets de recrutement", category: "SIRH" },
      { id: "tool-pm", kind: "tool", entityId: "pm", slug: "pm", label: "Planify", meta: "Projet", searchText: "tableaux kanban", category: "Gestion de projet" },
    ]);
    const hits = await engine.search("gestion de projet");
    expect(hits[0]?.id).toBe("tool-pm");
  });
});
