import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";
import { readAccountBody } from "./_account-body.js";
import { AccountApiError, requireAccount } from "./_account-auth.js";
import {
  validateCatalogTool,
  CatalogValidationError,
  type CatalogEditorDetail,
  type CatalogTool,
} from "../src/lib/backofficeCatalog.js";
import {
  CATALOG_REPO,
  catalogError,
  catalogHash,
  draftSummary,
  validSlug,
  type CatalogDraft,
} from "./_backoffice-catalog-contract.js";
import {
  getCatalogSnapshot,
  saveCatalogDraft,
  deleteCatalogDraft,
  cleanupCatalogDrafts,
} from "./_backoffice-catalog-store.js";
import { readCatalog, publishCatalog } from "./_backoffice-catalog-github.js";
const query = (req: VercelRequest, key: string, fallback = "") => {
  const v = req.query[key] ?? fallback;
  if (typeof v !== "string") throw catalogError(400, "INVALID_CATALOG_QUERY");
  return v;
};
function detail(tool: CatalogTool, draft?: CatalogDraft): CatalogEditorDetail {
  return {
    tool: draft?.value ?? tool,
    published: tool,
    baseHash: draft?.baseHash ?? catalogHash(tool),
    version: draft?.version ?? 0,
    draft: draft ? draftSummary(draft) : null,
    conflict: !!draft && draft.baseHash !== catalogHash(tool),
  };
}
function version(v: unknown): number {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0)
    throw catalogError(400, "INVALID_CATALOG_REQUEST");
  return v;
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "PUT", "DELETE", "POST"].includes(req.method ?? "")) {
    res.setHeader("Allow", "GET, PUT, DELETE, POST");
    return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
  }
  try {
    const account = await requireAccount(req);
    const allowed = new Set(
      (process.env.BACKOFFICE_ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
    if (!allowed.size) throw catalogError(503, "BACKOFFICE_UNAVAILABLE");
    if (!account.email || !allowed.has(account.email.toLowerCase()))
      throw catalogError(403, "BACKOFFICE_FORBIDDEN");
    let body: Record<string, unknown> = {};
    if (req.method !== "GET") {
      const parsed = await readAccountBody(
        req,
        256 * 1024,
        "INVALID_CATALOG_REQUEST",
      );
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw catalogError(400, "INVALID_CATALOG_REQUEST");
      body = parsed as Record<string, unknown>;
    }
    const mode = query(req, "mode", "list"),
      search = query(req, "search");
    const rawPage = query(req, "page", "1"),
      page = Number(rawPage);
    const only = query(req, "draftsOnly", "false");
    if (
      search.length > 200 ||
      !/^\d+$/.test(rawPage) ||
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !["true", "false"].includes(only) ||
      !["list", "detail"].includes(mode)
    )
      throw catalogError(400, "INVALID_CATALOG_QUERY");
    const snapshot = await getCatalogSnapshot();
    if (req.method === "POST" && version(body.revision) !== snapshot.revision)
      throw catalogError(409, "CATALOG_REVISION_CONFLICT");
    const source = await readCatalog();
    const bySlug = new Map(source.tools.map((t) => [t.slug, t]));
    if (req.method === "POST") {
      if (!snapshot.drafts.length) throw catalogError(400, "CATALOG_NO_DRAFTS");
      const replacements = new Map<string, CatalogTool>();
      for (const d of snapshot.drafts) {
        const current = bySlug.get(d.slug);
        if (!current) throw catalogError(409, "CATALOG_SOURCE_CONFLICT");
        validateCatalogTool(d.base, d.value);
        if (catalogHash(current) === catalogHash(d.value)) continue;
        if (catalogHash(current) !== d.baseHash)
          throw catalogError(409, "CATALOG_SOURCE_CONFLICT");
        replacements.set(d.slug, d.value);
      }
      const commit = replacements.size
        ? await publishCatalog(
            source,
            source.tools.map((t) => replacements.get(t.slug) ?? t),
          )
        : {
            commitSha: source.headSha,
            commitUrl: `https://github.com/${CATALOG_REPO}/commit/${source.headSha}`,
          };
      let cleanupPending = false;
      try {
        await cleanupCatalogDrafts(snapshot.drafts);
      } catch {
        cleanupPending = true;
      }
      return res
        .status(200)
        .json({ ...commit, published: snapshot.drafts.length, cleanupPending });
    }
    if (req.method === "GET" && mode === "list") {
      const drafts = snapshot.drafts.map(draftSummary);
      const summaries = new Map(drafts.map((d) => [d.slug, d]));
      const needle = search.trim().toLowerCase();
      const filtered = source.tools.filter(
        (t) =>
          (!needle || `${t.name} ${t.slug}`.toLowerCase().includes(needle)) &&
          (only !== "true" || summaries.has(t.slug)),
      );
      return res
        .status(200)
        .json({
          revision: snapshot.revision,
          tools: filtered
            .slice((page - 1) * 25, page * 25)
            .map((t) => ({
              slug: t.slug,
              name: t.name,
              category: typeof t.category === "string" ? t.category : "",
              draft: summaries.get(t.slug) ?? null,
            })),
          drafts,
          total: filtered.length,
          page,
          pageSize: 25,
          headSha: source.headSha,
        });
    }
    const slug = req.method === "GET" ? query(req, "slug") : body.slug;
    if (!validSlug(slug)) throw catalogError(400, "INVALID_CATALOG_REQUEST");
    const tool = bySlug.get(slug);
    if (!tool) throw catalogError(404, "CATALOG_TOOL_NOT_FOUND");
    const draft = snapshot.drafts.find((d) => d.slug === slug);
    if (req.method === "GET") return res.status(200).json(detail(tool, draft));
    const expected = version(body.version);
    if (req.method === "DELETE") {
      await deleteCatalogDraft(slug, expected);
      return res.status(200).json({ ok: true });
    }
    if (
      typeof body.baseHash !== "string" ||
      body.baseHash !== catalogHash(tool) ||
      (draft && draft.baseHash !== body.baseHash)
    )
      throw catalogError(409, "CATALOG_SOURCE_CONFLICT");
    const value = validateCatalogTool(tool, body.value);
    if (
      value.category !== tool.category &&
      !source.tools.some((t) => t.category === value.category)
    )
      throw catalogError(400, "INVALID_CATALOG_TOOL");
    if (catalogHash(value) === catalogHash(tool)) {
      // A no-op still compares the supplied version atomically: a newer
      // saved draft must survive a stale tab reverting its local edits.
      await deleteCatalogDraft(slug, expected);
      return res.status(200).json(detail(tool));
    }
    const saved = await saveCatalogDraft(
      {
        slug,
        version: 0,
        baseHash: body.baseHash,
        base: tool,
        value,
        updatedAt: new Date().toISOString(),
      },
      expected,
    );
    return res.status(200).json(detail(tool, saved));
  } catch (error) {
    const e =
      error instanceof AccountApiError
        ? error
        : error instanceof CatalogValidationError
          ? catalogError(400, error.code)
          : catalogError();
    return res.status(e.status).json({ error: { code: e.code } });
  }
}
