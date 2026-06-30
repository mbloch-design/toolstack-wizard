import type { Tool } from "@/data/types";

/**
 * Similarity-based filter for algorithmic "alternative" suggestions
 * (ToolDetailPage's "Substituables directement" chips, driven by
 * substitution_cluster_v2). Built after an external audit found Allstate
 * (health insurance) and Auvik (network monitoring) surfacing as
 * "direct substitutes" for Asana — both shared the same broad
 * substitution_cluster_v2 / category tag as real project-management
 * tools, with nothing checking whether they actually do the same job.
 *
 * S_sim(A,B) = Jaccard(functionalNeeds_A, functionalNeeds_B)
 *            x Jaccard(verticals_A, verticals_B)
 *
 * functional_needs approximates "key features" (F), verticals
 * approximates "target roles" (R). Both factors must be reasonably high
 * for the product to clear the threshold - a tool sharing the audience
 * but not the function (or vice versa) is correctly scored low.
 *
 * Known data limitation (see alternativesSimilarity.test.ts): functional_
 * needs isn't a normalized taxonomy across the catalog - the same
 * project-management concept appears as "project management" (English,
 * spaced) on some tools and "gestion-taches"/"collaboration"/"planning"
 * (French slugs) on others. normalizeTag() below only catches case/
 * separator differences, not cross-language synonyms, so two genuinely
 * similar tools tagged in different "dialects" can still score 0 on the
 * F factor. This is flagged, not silently patched around, because fixing
 * it for real means normalizing functional_needs across ~1109 tools (a
 * content task), not a tweak to this function.
 */

const SIMILARITY_THRESHOLD = 0.75;

function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/[\s_]+/g, "-");
}

function jaccard(a: string[] | undefined, b: string[] | undefined): number {
  const setA = new Set((a || []).map(normalizeTag).filter(Boolean));
  const setB = new Set((b || []).map(normalizeTag).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const tag of setA) if (setB.has(tag)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** S_sim(A, B) — see module docstring. Symmetric: computeSimilarity(A, B) === computeSimilarity(B, A). */
export function computeSimilarity(toolA: Pick<Tool, "functional_needs" | "verticals">, toolB: Pick<Tool, "functional_needs" | "verticals">): number {
  const fSim = jaccard(toolA.functional_needs, toolB.functional_needs);
  const rSim = jaccard(toolA.verticals, toolB.verticals);
  return fSim * rSim;
}

/** Strictly greater than the threshold — a score of exactly 0.75 is excluded, per spec. */
export function isRelevantAlternative(
  toolA: Pick<Tool, "functional_needs" | "verticals">,
  toolB: Pick<Tool, "functional_needs" | "verticals">,
  threshold: number = SIMILARITY_THRESHOLD,
): boolean {
  return computeSimilarity(toolA, toolB) > threshold;
}

/**
 * Filters and ranks candidates by similarity to `tool`, excluding `tool`
 * itself and anything at or below the threshold. Used as the relevance
 * gate on top of whatever produced the candidate list (cluster tag,
 * category, etc.) — it doesn't replace candidate generation, it stops
 * irrelevant candidates from being displayed.
 */
export function findSimilarTools(
  tool: Tool,
  candidates: Tool[],
  threshold: number = SIMILARITY_THRESHOLD,
): Tool[] {
  return candidates
    .filter((c) => c.id !== tool.id)
    .map((c) => ({ tool: c, score: computeSimilarity(tool, c) }))
    .filter(({ score }) => score > threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ tool: t }) => t);
}
