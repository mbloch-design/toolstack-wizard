import { expect, it } from "vitest";
import { catalogHash } from "../../api/_backoffice-catalog-contract";
import { assembleCmsRelease } from "../../api/_cms-release";

const headSha = "a".repeat(40);
const linked = { id: "id-1", slug: "linked", name: "Linked", verdict: { summary: "ToolTrim" } };
const witness = { id: "id-2", slug: "witness", name: "JSON only", futureField: ["preserved"] };
const source = { headSha, tools: [linked, witness] };
const approved: Parameters<typeof assembleCmsRelease>[1]["changes"][number] = {
  approvalId: "one", version: 3, toolId: linked.id, baseHash: catalogHash(linked),
  tool: { ...linked, name: "New name", alternatives: [{ name: witness.name }] },
};
const assemble = (changes: Parameters<typeof assembleCmsRelease>[1]["changes"] = [approved], expectedHead = headSha) =>
  assembleCmsRelease(source, { expectedHead, attachedToolIds: [linked.id], changes });

it("preserves JSON tools and supports references to JSON-only tools", () => {
  const result = assemble();
  expect(result.tools).toEqual([approved.tool, witness]);
  expect(result.tools[1]).toBe(witness);
  expect(result.manifest).toMatchObject({ sourceHead: headSha, items: [
    { approvalId: "one", version: 3, toolId: linked.id, hash: catalogHash(approved.tool) },
  ] });
  expect(result.manifest.items[0]).not.toHaveProperty("tool");
  expect(assemble().manifest).toEqual(result.manifest);
});

it("rejects drafts for unlinked tools, duplicate approval and stale source", () => {
  expect(() => assemble([{ ...approved, toolId: witness.id, tool: witness }])).toThrow("CMS_TOOL_NOT_ATTACHED");
  expect(() => assemble([approved, approved])).toThrow("CMS_RELEASE_DUPLICATE");
  expect(() => assemble([approved], "b".repeat(40))).toThrow("CMS_RELEASE_SOURCE_CHANGED");
  expect(() => assemble([{ ...approved, baseHash: catalogHash(witness) }])).toThrow("CMS_RELEASE_SOURCE_CHANGED");
});

it("preserves identity on update and refuses a new reserved slug", () => {
  expect(() => assemble([{ ...approved, tool: { ...linked, slug: "renamed" } }])).toThrow("CMS_RELEASE_IDENTITY_CONFLICT");
  expect(() => assembleCmsRelease(source, {
    expectedHead: headSha, attachedToolIds: ["new-id"], archivedSlugs: ["retired"],
    changes: [{ approvalId: "initial", version: 1, toolId: "new-id", baseHash: null,
      tool: { id: "new-id", name: "New", slug: "retired" } }],
  })).toThrow("CMS_RELEASE_IDENTITY_CONFLICT");
});

it("projects only approved product facts and keeps attested prices and editorial fields intact", async () => {
  const { projectPublisherFacts } = await import("../../api/_cms-release");
  const productLocale = {
    shortDescription: "Actual description", productDescription: "What the product does",
    features: [{ id: "private-key", text: "A feature" }], useCases: [],
  };
  const text = { name: "Basic", highlights: ["Feature"], summary: null };
  const original = { ...linked, pricing_v5: { verification_status: "withheld", compare_price_monthly_eur: 10 } };
  const result = projectPublisherFacts(original, {
    schemaVersion: 1, name: "Public name", websiteUrl: "https://example.org",
    localized: { fr: productLocale, en: productLocale }, media: [{ role: "logo", assetId: "private-asset", alt: { fr: "", en: "" }, caption: { fr: "", en: "" } }],
    classificationProposals: [], integrations: [],
    plans: [{ id: "private-plan", planKey: "basic", localized: { fr: text, en: text }, archived: false,
      options: [{ id: "private-price", type: "quote", amount: "120", currency: "EUR", period: "year",
        unit: null, commitment: null, tax: "unknown", market: "FR", offerLocale: null, sourceUrl: null, observedOn: null }],
    }],
  });
  expect(result.verdict).toEqual(original.verdict);
  expect(result.pricing_v5).toEqual(original.pricing_v5);
  expect(result.publisherFacts).toMatchObject({
    localized: { fr: { productDescription: "What the product does", features: ["A feature"] } },
    plans: [{ options: [{ type: "quote", market: "FR" }] }],
  });
  expect(JSON.stringify(result)).not.toMatch(/private-|120/);
});

it("combines reviewed publisher edits and existing admin drafts against the same Git rev", () => {
  const legacy = { ...witness, name: "Admin JSON edit" };
  const batch = assembleCmsRelease(source, {
    expectedHead: headSha, attachedToolIds: [linked.id], changes: [approved],
    legacyDrafts: [{ tool: legacy, baseHash: catalogHash(witness), version: 2 }],
  });
  expect(batch.tools).toEqual([approved.tool, legacy]);
  expect(batch.manifest.legacyItems).toEqual([{ slug: witness.slug, version: 2, hash: catalogHash(legacy) }]);
  expect(() => assembleCmsRelease(source, {
    expectedHead: headSha, attachedToolIds: [linked.id], changes: [approved],
    legacyDrafts: [{ tool: linked, baseHash: catalogHash(linked), version: 2 }],
  })).toThrow("CMS_RELEASE_DRAFT_OVERLAP");
});
