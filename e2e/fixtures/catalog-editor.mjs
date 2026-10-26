// Synthetic browser fixture only. Production APIs are covered separately with transport mocks.
import { createHash } from "node:crypto";
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const initial = () =>
  ["notion", "figma"].map((slug) => ({
    id: slug,
    slug,
    name: slug === "notion" ? "Notion" : "Figma",
    category: "productivity",
    shortDescription: "Description française de test.",
    shortDescriptionEn: "Synthetic English description.",
    longDescription: "Analyse française de test.",
    longDescriptionEn: "Synthetic editorial analysis.",
    pros: ["Point fort de test"],
    prosEn: ["Synthetic strength"],
    cons: ["Limite de test"],
    consEn: ["Synthetic limitation"],
    useCases: [],
    useCasesEn: [],
    verdict: {
      keepIf: ["Travail individuel"],
      avoidIf: [],
      threshold: "Tester le parcours",
    },
    verdictEn: {
      keepIf: ["Solo work"],
      avoidIf: [],
      threshold: "Try the workflow",
    },
    pricing: { free: "Offre gratuite de test", paid: "Offre payante de test" },
    pricingEn: { free: "Synthetic free tier", paid: "Synthetic paid tier" },
    websiteUrl: `https://${slug}.example.invalid`,
    seo: { metaDescription: "Meta de test" },
  }));
export function catalogFixture() {
  let tools = initial(),
    revision = 0;
  const drafts = new Map();
  const summary = (d) => ({
    slug: d.slug,
    name: d.value.name,
    version: d.version,
    updatedAt: d.updatedAt,
    fields: Object.keys(d.value).filter(
      (k) => JSON.stringify(d.value[k]) !== JSON.stringify(d.base[k]),
    ),
  });
  const detail = (t) => {
    const d = drafts.get(t.slug);
    return {
      tool: d?.value ?? t,
      published: t,
      baseHash: d?.baseHash ?? hash(t),
      version: d?.version ?? 0,
      draft: d ? summary(d) : null,
      conflict: !!d && d.baseHash !== hash(t),
    };
  };
  return {
    reset() {
      tools = initial();
      revision = 0;
      drafts.clear();
    },
    async handle({ req, url, input, user, server, send, fail, res }) {
      if (user.email !== "admin@example.invalid" || !user.email_confirmed_at)
        return fail(res, 403, "BACKOFFICE_FORBIDDEN");
      if (req.method === "GET" && url.searchParams.get("mode") !== "detail") {
        const search = (url.searchParams.get("search") ?? "").toLowerCase(),
          page = Number(url.searchParams.get("page") ?? 1);
        const filtered = tools.filter(
          (t) =>
            (t.name.toLowerCase().includes(search) ||
              t.slug.includes(search)) &&
            (url.searchParams.get("draftsOnly") !== "true" ||
              drafts.has(t.slug)),
        );
        return send(res, 200, {
          revision,
          tools: filtered
            .slice((page - 1) * 25, page * 25)
            .map((t) => ({
              slug: t.slug,
              name: t.name,
              category: t.category,
              draft: drafts.has(t.slug) ? summary(drafts.get(t.slug)) : null,
            })),
          drafts: [...drafts.values()].map(summary),
          total: filtered.length,
          page,
          pageSize: 25,
          headSha: "a".repeat(40),
        });
      }
      if (req.method === "POST") {
        if (input.revision !== revision)
          return fail(res, 409, "CATALOG_REVISION_CONFLICT");
        if (!drafts.size) return fail(res, 400, "CATALOG_NO_DRAFTS");
        const published = drafts.size;
        tools = tools.map((t) => drafts.get(t.slug)?.value ?? t);
        drafts.clear();
        revision++;
        return send(res, 200, {
          commitSha: "c".repeat(40),
          commitUrl:
            "https://github.com/mbloch-design/toolstack-wizard/commit/" +
            "c".repeat(40),
          published,
          cleanupPending: false,
        });
      }
      const slug =
          req.method === "GET" ? url.searchParams.get("slug") : input.slug,
        t = tools.find((t) => t.slug === slug);
      if (!t) return fail(res, 404, "CATALOG_TOOL_NOT_FOUND");
      if (req.method === "GET") return send(res, 200, detail(t));
      if (input.version !== (drafts.get(slug)?.version ?? 0))
        return fail(res, 409, "CATALOG_DRAFT_CONFLICT");
      if (req.method === "DELETE") {
        drafts.delete(slug);
        revision++;
        return send(res, 200, { ok: true });
      }
      if (input.baseHash !== hash(t))
        return fail(res, 409, "CATALOG_SOURCE_CONFLICT");
      const { validateCatalogTool } = await server.ssrLoadModule(
        "/src/lib/backofficeCatalog.ts",
      );
      let value;
      try {
        value = validateCatalogTool(t, input.value);
      } catch {
        return fail(res, 400, "INVALID_CATALOG_TOOL");
      }
      revision++;
      drafts.set(slug, {
        slug,
        base: t,
        baseHash: hash(t),
        value,
        version: revision,
        updatedAt: new Date().toISOString(),
      });
      return send(res, 200, detail(t));
    },
  };
}
