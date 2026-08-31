import { create, insertMultiple, search, type AnyOrama } from "@orama/orama";

export type CatalogSearchKind = "tool" | "category" | "guide";

export type CatalogSearchDocument = {
  id: string;
  kind: CatalogSearchKind;
  entityId: string;
  slug: string;
  label: string;
  meta: string;
  searchText: string;
};

export type CatalogSearchHit = CatalogSearchDocument & { score: number };

export type CatalogSearchEngine = {
  search: (term: string, limit?: number) => Promise<CatalogSearchHit[]>;
};

export async function createCatalogSearchEngine(
  documents: CatalogSearchDocument[],
): Promise<CatalogSearchEngine> {
  const database = create({
    schema: {
      id: "string",
      kind: "string",
      entityId: "string",
      slug: "string",
      label: "string",
      meta: "string",
      searchText: "string",
    },
  }) as AnyOrama;

  await insertMultiple(database, documents, 250);

  return {
    async search(term, limit = 24) {
      const result = await search(database, {
        term: term.trim(),
        properties: ["label", "searchText"],
        boost: { label: 4, searchText: 1 },
        tolerance: 1,
        threshold: 0,
        limit,
      });

      return result.hits.map((hit) => ({
        ...(hit.document as CatalogSearchDocument),
        score: hit.score,
      }));
    },
  };
}
