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
      const normalizedTerm = normalize(term);
      if (!normalizedTerm) return [];
      const result = await search(database, {
        term: term.trim(),
        properties: ["label", "searchText"],
        boost: { label: 4, searchText: 1 },
        tolerance: 1,
        threshold: 0,
        limit,
      });

      const fuzzyHits = result.hits.map((hit) => ({
        ...(hit.document as CatalogSearchDocument),
        score: hit.score,
      }));

      // A short exact name can be pushed below the fuzzy-search cutoff by
      // unrelated near-matches. Put literal label/slug matches first so a
      // query such as "viso" cannot hide the Viso AI listing.
      const literalHits = documents
        .filter((document) => {
          const label = normalize(document.label);
          const slug = normalize(document.slug.replaceAll("-", " "));
          return label.startsWith(normalizedTerm) || slug.startsWith(normalizedTerm);
        })
        .sort((left, right) => {
          const priority = (document: CatalogSearchDocument) => {
            const label = normalize(document.label);
            const slug = normalize(document.slug.replaceAll("-", " "));
            if (label === normalizedTerm) return 4;
            if (slug === normalizedTerm) return 3;
            if (label.startsWith(normalizedTerm)) return 2;
            return 1;
          };
          return priority(right) - priority(left) || left.label.length - right.label.length;
        })
        .map((document) => ({ ...document, score: Number.MAX_SAFE_INTEGER }));

      const seen = new Set<string>();
      return [...literalHits, ...fuzzyHits]
        .filter((hit) => {
          if (seen.has(hit.id)) return false;
          seen.add(hit.id);
          return true;
        })
        .slice(0, limit);
    },
  };
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
