/**
 * Promoted placements on the tools catalogue (/tools).
 *
 * One place to decide what the catalogue puts forward, editorial or paid:
 *   - placement "spotlight": the "Featured" band of large cards at the top;
 *   - placement "<categoryId>": pinned first in that category's shelf;
 *   - placement "need:<needId>" (ids in catalogNeeds.ts): first of the three
 *     top picks shown when a visitor opens that need, e.g. "need:design".
 *
 * A paid placement MUST set `sponsored: true`: the page then labels it
 * "Sponsored" (advertising has to be identifiable as such, French and EU
 * consumer law). `until` (YYYY-MM-DD, inclusive) retires an entry on its
 * own, so an expired deal never lingers on the page.
 *
 * Copy fields are optional: without them the card falls back to the tool's
 * category and short description.
 */
export interface CatalogPlacement {
  placement: "spotlight" | string;
  slug: string;
  sponsored?: boolean;
  until?: string;
  eyebrowFr?: string;
  eyebrowEn?: string;
  pitchFr?: string;
  pitchEn?: string;
}

export const CATALOG_PLACEMENTS: CatalogPlacement[] = [
  { placement: "spotlight", slug: "framer" },
  { placement: "spotlight", slug: "notion" },
  { placement: "spotlight", slug: "figma" },
];

/** Placements still running on `today` (YYYY-MM-DD). */
export function activePlacements(today: string): CatalogPlacement[] {
  return CATALOG_PLACEMENTS.filter((entry) => !entry.until || entry.until >= today);
}
