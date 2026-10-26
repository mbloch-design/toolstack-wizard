import { supabase } from "@/integrations/supabase/client";
import type {
  CatalogWorkspace,
  CatalogEditorDetail,
  CatalogPublication,
  CatalogTool,
} from "./backofficeCatalog";

export class CatalogApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = "CatalogApiError";
  }
}
async function request(
  method: string,
  query: Record<string, string> = {},
  body?: unknown,
): Promise<unknown> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token)
      throw new CatalogApiError(401, "ACCOUNT_SESSION_INVALID");
    const response = await fetch(
      `/api/backoffice-catalog?${new URLSearchParams(query)}`,
      {
        method,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    const value = await response.json();
    if (!response.ok)
      throw new CatalogApiError(
        response.status,
        typeof value?.error?.code === "string"
          ? value.error.code
          : "CATALOG_UNAVAILABLE",
      );
    if (!value || typeof value !== "object")
      throw new CatalogApiError(503, "CATALOG_UNAVAILABLE");
    return value;
  } catch (error) {
    if (error instanceof CatalogApiError) throw error;
    throw new CatalogApiError(503, "CATALOG_UNAVAILABLE");
  }
}
export async function loadCatalogWorkspace({
  search = "",
  page = 1,
  draftsOnly = false,
}: {
  search?: string;
  page?: number;
  draftsOnly?: boolean;
} = {}): Promise<CatalogWorkspace> {
  const value = (await request("GET", {
    mode: "list",
    search,
    page: String(page),
    draftsOnly: String(draftsOnly),
  })) as CatalogWorkspace;
  if (
    !Array.isArray(value.tools) ||
    !Array.isArray(value.drafts) ||
    !Number.isSafeInteger(value.revision) ||
    !Number.isSafeInteger(value.total)
  )
    throw new CatalogApiError(503, "CATALOG_UNAVAILABLE");
  return value;
}
export async function loadCatalogDetail(
  slug: string,
): Promise<CatalogEditorDetail> {
  return parseDetail(await request("GET", { mode: "detail", slug }));
}
function parseDetail(value: unknown): CatalogEditorDetail {
  const result = value as CatalogEditorDetail;
  if (
    !result?.tool?.slug ||
    !result?.published?.slug ||
    result.tool.slug !== result.published.slug ||
    typeof result.baseHash !== "string" ||
    !Number.isSafeInteger(result.version)
  )
    throw new CatalogApiError(503, "CATALOG_UNAVAILABLE");
  return result;
}
export async function saveCatalogDraft(input: {
  slug: string;
  version: number;
  baseHash: string;
  value: CatalogTool;
}): Promise<CatalogEditorDetail> {
  return parseDetail(await request("PUT", {}, input));
}
export async function discardCatalogDraft(
  slug: string,
  version: number,
): Promise<void> {
  await request("DELETE", {}, { slug, version });
}
export async function publishCatalogDrafts(
  revision: number,
): Promise<CatalogPublication> {
  const value = (await request("POST", {}, { revision })) as CatalogPublication;
  if (
    !/^[a-f0-9]{40}$/.test(value.commitSha) ||
    value.commitUrl !==
      `https://github.com/mbloch-design/toolstack-wizard/commit/${value.commitSha}` ||
    !Number.isSafeInteger(value.published)
  )
    throw new CatalogApiError(503, "CATALOG_UNAVAILABLE");
  return value;
}
