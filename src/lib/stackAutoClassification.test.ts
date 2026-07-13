import { describe, expect, it } from "vitest";
import { classifyToolForStack } from "@/lib/stackAutoClassification";
import toolsCatalog from "@/data/tools_v4.json";

const expectedTools = {
  chatgpt: "ia",
  claude: "ia",
  notion: "organisation",
  clickup: "organisation",
  loom: "organisation",
  figma: "design",
  canva: "design",
  make: "automation",
  zapier: "automation",
  mailchimp: "marketing",
  buffer: "marketing",
  hubspot: "vente",
  pipedrive: "vente",
  stripe: "finance",
  pennylane: "finance",
  github: "dev",
  vercel: "dev",
  attio: "vente",
  folk: "vente",
  railway: "dev",
  netlify: "dev",
} as const;

describe("stack automatic classification", () => {
  Object.entries(expectedTools).forEach(([slug, needId]) => {
    it(`classifies ${slug} as ${needId}`, () => {
      const catalogTool = (toolsCatalog as Array<Record<string, unknown>>).find((tool) => (tool.slug || tool.id) === slug);
      expect(catalogTool, `${slug} must exist in the catalog`).toBeTruthy();
      expect(classifyToolForStack({
        ...(catalogTool as Record<string, unknown>),
        categoryId: String(catalogTool?.category || ""),
      })).toMatchObject({ needIds: [needId], confidence: "high" });
    });
  });

  it("uses structured functional signals before a misleading category", () => {
    const result = classifyToolForStack({
      slug: "crm-specialise",
      categoryId: "organization",
      functional_needs: ["crm", "pipeline", "lead-generation"],
    });
    expect(result).toMatchObject({ needIds: ["vente"], confidence: "high", reason: "structured-signals" });
  });

  it("leaves conflicting free text unassigned", () => {
    const result = classifyToolForStack({
      slug: "outil-inconnu",
      shortDescription: "Assistant IA pour automatiser le marketing et le design.",
    });
    expect(result).toMatchObject({ needIds: [], reason: "unclassified" });
  });
});
