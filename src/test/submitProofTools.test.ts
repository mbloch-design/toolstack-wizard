import { describe, expect, it } from "vitest";
import { PROOF_TOOL_SLUGS, pickProofTools } from "@/lib/submitProofTools";
import toolsIndex from "@/data/tools_index.json";

describe("pickProofTools", () => {
  it("returns every curated tool from the real catalogue, in order", () => {
    const picked = pickProofTools(toolsIndex as { name?: string; slug?: string }[]);
    expect(picked.map((tool) => tool.slug)).toEqual(PROOF_TOOL_SLUGS);
  });

  it("drops a slug that is not in the catalogue instead of inventing it", () => {
    const picked = pickProofTools([{ slug: "notion", name: "Notion" }], ["notion", "ghost-tool"]);
    expect(picked).toEqual([{ slug: "notion", name: "Notion", websiteUrl: undefined }]);
  });
});
