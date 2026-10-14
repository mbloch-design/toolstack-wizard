type ToolsIndexEntry = { name?: string; slug?: string; websiteUrl?: string };
export type ProofTool = { name: string; slug: string; websiteUrl?: string };

export const PROOF_TOOL_SLUGS = ["notion", "figma", "slack", "canva", "hubspot", "airtable", "zapier", "linear"];

/** Keeps the curated order and silently drops any slug no longer in the catalogue. */
export function pickProofTools(index: ToolsIndexEntry[], slugs: string[] = PROOF_TOOL_SLUGS): ProofTool[] {
  const bySlug = new Map(index.filter((entry) => entry?.slug && entry?.name).map((entry) => [entry.slug as string, entry]));
  return slugs.flatMap((slug) => {
    const entry = bySlug.get(slug);
    return entry ? [{ name: entry.name as string, slug, websiteUrl: entry.websiteUrl }] : [];
  });
}
