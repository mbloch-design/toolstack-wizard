import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";
import { httpFixture } from "./http";

const deps = vi.hoisted(() => ({ rpc: vi.fn(), requireAccount: vi.fn(), readCatalog: vi.fn() }));
vi.mock("../../api/_account-auth.js", async (original) => ({
  ...await original<typeof import("../../api/_account-auth.js")>(),
  getAccountServiceClient: () => ({ rpc: deps.rpc }),
  requireAccount: deps.requireAccount,
}));
vi.mock("../../api/_backoffice-catalog-github.js", () => ({ readCatalog: deps.readCatalog }));
import handler from "../../api/backoffice-listings";
import { catalogHash } from "../../api/_backoffice-catalog-contract";

const ownerId = "00000000-0000-0000-0000-000000000001";
const tool = {
  id: "stable-id", slug: "live-slug", name: "A public product", websiteUrl: "https://example.com/",
  shortDescription: "Résumé FR", shortDescriptionEn: "EN summary", productDescription: "Présentation FR",
  longDescription: "protected analysis", toolTrimRating: { note: 10 }, defaultMonthlyPrice: 19,
};
const invite = { action: "invite", ownerId, toolId: tool.id, brandName: "Example", brandDomain: "example.com", role: "owner" };

beforeEach(() => {
  deps.requireAccount.mockReset().mockResolvedValue({ userId: "admin", sessionId: "session", emailConfirmed: true });
  deps.rpc.mockReset().mockResolvedValue({ data: { claim: { toolId: tool.id, slug: tool.slug } }, error: null });
  deps.readCatalog.mockReset().mockResolvedValue({ headSha: "4".repeat(40), tools: [tool] });
});

it("checks admin rights and pending claim before allowing import from Git", async () => {
  deps.rpc.mockResolvedValueOnce({ data: null, error: { code: "PT403", message: "CMS_ACCESS_DENIED" } });
  const result = httpFixture(invite);
  await handler(result.req, result.res);
  expect(result.res.statusCode).toBe(403);
  expect(deps.readCatalog).not.toHaveBeenCalled();
});

it("creates an invitation using exact Git identity and a factual baseline with its pinned hash", async () => {
  deps.rpc.mockResolvedValueOnce({ data: { claim: { toolId: tool.id, slug: tool.slug } }, error: null })
    .mockResolvedValueOnce({ data: { invitation: { id: "invite" } }, error: null });
  const result = httpFixture(invite);
  await handler(result.req, result.res);
  expect(result.res.statusCode).toBe(200);
  expect(result.res.getHeader("Cache-Control")).toBe("no-store");
  const token = (result.body as { invitation: { token: string } }).invitation.token;
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  const [, { p_payload: input }] = deps.rpc.mock.lastCall!;
  expect(input).toMatchObject({
    digest: createHash("sha256").update(token).digest("hex"),
    toolId: "stable-id", slug: "live-slug", sourceSha: "4".repeat(40), baseHash: catalogHash(tool),
    draft: {
      name: tool.name, websiteUrl: tool.websiteUrl,
      localized: { fr: { shortDescription: "Résumé FR", productDescription: "Présentation FR" }, en: { shortDescription: "EN summary" } },
    },
  });
  expect(JSON.stringify(input)).not.toContain(token);
  expect(JSON.stringify(input.draft)).not.toContain("protected analysis");
  expect(input.draft).not.toHaveProperty("toolTrimRating");
  expect(input.draft).not.toHaveProperty("defaultMonthlyPrice");
});

it("keeps a claim on its stable public ID and refuses changed source identity", async () => {
  deps.readCatalog.mockResolvedValueOnce({ headSha: "4".repeat(40), tools: [{ ...tool, slug: "renamed-slug" }] });
  const result = httpFixture(invite);
  await handler(result.req, result.res);
  expect(result.res.statusCode).toBe(409);
  expect(deps.rpc).toHaveBeenCalledTimes(1);
});
