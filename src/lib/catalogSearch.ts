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
  /** Category names, needs and uses: what the tool is for, ranked above the
   * free text so "CRM" finds CRMs before names that merely contain ".com". */
  tags?: string;
  /** The tool's category names alone: a short field, so a category match
   * ("gestion de projet") is not diluted by a long list of uses. */
  category?: string;
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
      tags: "string",
      category: "string",
    },
  }) as AnyOrama;

  // Indexed without accents or punctuation on both sides, so "vidéo" meets
  // "video"; hits return the original documents for display.
  const byId = new Map(documents.map((document) => [document.id, document]));
  await insertMultiple(database, documents.map((document) => ({
    ...document,
    label: normalize(document.label),
    searchText: normalize(document.searchText),
    tags: normalize(document.tags || ""),
    category: normalize(document.category || ""),
  })), 250);

  return {
    async search(term, limit = 24) {
      const normalizedTerm = normalize(term);
      if (!normalizedTerm) return [];
      // Function words carry no meaning ("gestion de projet"), and a typo is
      // only tolerated on words of 5 letters or more: on short words one edit
      // turns "crm" into "com" and "ia" into "io" (search audit, 9 Oct 2026).
      const words = normalizedTerm.split(" ").filter((word) => !STOP_WORDS.has(word));
      const query = (words.length > 0 ? words : normalizedTerm.split(" ")).join(" ");
      const allowTypo = query.split(" ").every((word) => word.length >= 5);
      const run = (tolerance: number) => search(database, {
        term: query,
        properties: ["label", "category", "tags", "searchText"],
        boost: { label: 4, category: 3, tags: 2, searchText: 1 },
        tolerance,
        threshold: 0,
        limit,
      });
      // The typo pass is a fallback, not a blend: "notion" spelled right must
      // not pull Motion, Motion Bro and Figma Motion in after Notion (search
      // review, 9 Oct 2026). It only runs when the exact pass finds little.
      const exact = await run(0);
      const fuzzy = allowTypo && exact.hits.length < 3 ? await run(1) : null;
      const rawHits = fuzzy
        ? [...exact.hits, ...fuzzy.hits.filter((hit) => !exact.hits.some((known) => known.id === hit.id))]
        : exact.hits;

      const fuzzyHits = rawHits.flatMap((hit) => {
        const document = byId.get((hit.document as CatalogSearchDocument).id);
        return document ? [{ ...document, score: hit.score }] : [];
      });

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

const STOP_WORDS = new Set([
  "de", "du", "des", "la", "le", "les", "l", "d", "un", "une", "et", "ou", "pour", "en", "a", "au", "aux", "avec", "sur", "par",
  "the", "of", "and", "or", "for", "to", "in", "on", "with", "an",
]);

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
