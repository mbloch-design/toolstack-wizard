import { FEATURED_COMPARISONS } from "@/data/comparisons";

/**
 * Link to compare two tools. A written comparison is used when it exists, in
 * either order; otherwise the generic a-vs-b page, which renders any pair from
 * catalogue data and stays out of the index (ComparePage).
 */
export function comparisonPath(prefix: string, a: string, b: string): string {
  const written = FEATURED_COMPARISONS.find((c) => (c.toolA === a && c.toolB === b) || (c.toolA === b && c.toolB === a));
  return `${prefix}/comparatif/${written ? written.slugPair : `${a}-vs-${b}`}`;
}
