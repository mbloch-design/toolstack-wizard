import { AccountApiError, getAccountServiceClient } from "./_account-auth.js";
import { catalogHash } from "./_backoffice-catalog-contract.js";
import { cmsActorArgs, requireCmsRpcSuccess, type CmsActor } from "./_cms-store.js";
import {
  CATALOG_FIELD_REGISTRY, catalogCapabilities, validateCatalogDraft,
  validateCatalogPublication, type CatalogDraftSummary, type CatalogEditorDetail, type CatalogTool,
} from "../src/lib/backofficeCatalog.js";

const productRoots = new Set([
  "name", "websiteUrl", "shortDescription", "shortDescriptionEn", "logo", "ogImageUrl", "galleryImages",
]);
const editableRegistrations = CATALOG_FIELD_REGISTRY.filter(({ editable, path }) =>
  editable && !productRoots.has(path.split(".")[0]));
const reservedRoots = new Set(editableRegistrations.filter(({ path }) => !path.includes(".")).map(({ path }) => path));
const capabilities = {
  ...catalogCapabilities({ isAdmin: true, editablePaths: editableRegistrations.map(({ path }) => path) }),
  canPublishAll: true,
};

type EditorialPatch = { set: Record<string, unknown>; remove: string[] };
type EditorialSnapshot = {
  version: number;
  baseHash: string | null;
  patch: EditorialPatch | null;
  updatedAt: string | null;
  state: "approved" | "delivered" | null;
};
type EditorialAction = "read" | "save" | "discard" | "approve";

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const serviceUnavailable = () => new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");

async function editorialRpc(name: string, args: Record<string, unknown>) {
  const client = getAccountServiceClient();
  const rpc = client.rpc.bind(client) as unknown as (
    name: string, args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { code: string; message: string } | null }>;
  const { data, error } = await rpc(name, args);
  requireCmsRpcSuccess(error);
  return data;
}

function parsePatch(value: unknown): EditorialPatch {
  if (!record(value) || !record(value.set) || !Array.isArray(value.remove)
    || Object.keys(value.set).some((key) => !reservedRoots.has(key))
    || value.remove.some((key) => typeof key !== "string" || !reservedRoots.has(key) || Object.prototype.hasOwnProperty.call(value.set as object, key))) {
    throw new AccountApiError(409, "CMS_EDITORIAL_PATCH_INVALID");
  }
  return { set: value.set, remove: value.remove };
}

export function editorialBaseHash(tool: CatalogTool) {
  return catalogHash(Object.fromEntries(Object.entries(tool).filter(([key]) => reservedRoots.has(key))));
}

function mergeEditorialPatch(tool: CatalogTool, { set, remove }: EditorialPatch) {
  const result = { ...tool, ...set };
  for (const field of remove) delete result[field];
  return result;
}

export function applyEditorialPatch(tool: CatalogTool, input: unknown) {
  return validateCatalogDraft(tool, mergeEditorialPatch(tool, parsePatch(input)), capabilities);
}

function editorialPatch(base: CatalogTool, value: CatalogTool) {
  const patch: EditorialPatch = { set: {}, remove: [] };
  for (const key of reservedRoots) {
    if (catalogHash(base[key] ?? null) === catalogHash(value[key] ?? null)
      && Object.prototype.hasOwnProperty.call(base, key) === Object.prototype.hasOwnProperty.call(value, key)) continue;
    if (Object.prototype.hasOwnProperty.call(value, key)) patch.set[key] = value[key];
    else patch.remove.push(key);
  }
  return patch;
}

function editorDetail(tool: CatalogTool, snapshot: EditorialSnapshot): CatalogEditorDetail {
  const conflict = !!snapshot.baseHash && snapshot.baseHash !== editorialBaseHash(tool);
  const fields = snapshot.patch ? [...Object.keys(snapshot.patch.set), ...snapshot.patch.remove].sort() : [];
  const persisted = fields.length > 0;
  const draft = persisted ? {
    slug: tool.slug, name: tool.name, fields, version: snapshot.version, updatedAt: snapshot.updatedAt ?? "",
    editorial: snapshot.state ?? "draft" as const,
  } : null;
  // Keep a conflicted draft available for recovery. The editor prevents edits,
  // approval and automatic overwrite while its editorial base differs.
  const value = snapshot.patch && persisted && snapshot.state !== "delivered" ? mergeEditorialPatch(tool, snapshot.patch) : tool;
  return {
    tool: value, published: tool, baseHash: editorialBaseHash(tool), version: snapshot.version,
    draft, conflict: persisted && conflict && snapshot.state !== "delivered",
    capabilities: snapshot.state === "delivered" ? { ...capabilities, canSaveDraft: false, canDiscardDraft: false } : capabilities,
    editorial: snapshot.state ?? (persisted ? "draft" : "empty"),
  };
}

export async function editorialWorkspace(
  actor: CmsActor, tool: CatalogTool, action: EditorialAction = "read",
  options?: { version: number; baseHash?: unknown; value?: unknown },
): Promise<CatalogEditorDetail | null> {
  const call = async (step: EditorialAction, patch: EditorialPatch | null = null) => {
    const data = await editorialRpc("cms_editorial_workspace", {
      ...cmsActorArgs(actor), p_tool: tool.id, p_action: step, p_expected: options?.version ?? null,
      p_base: step === "read" ? null : editorialBaseHash(tool), p_patch: patch,
    });
    if (data === null && step === "read") return null;
    if (!record(data) || typeof data.version !== "number" || !Number.isSafeInteger(data.version) ||
      data.version < 0 || (data.baseHash !== null && typeof data.baseHash !== "string") ||
      (data.updatedAt !== null && typeof data.updatedAt !== "string") ||
      (data.state !== null && data.state !== "approved" && data.state !== "delivered")) throw serviceUnavailable();
    const snapshot: EditorialSnapshot = {
      version: data.version, baseHash: data.baseHash, updatedAt: data.updatedAt, state: data.state,
      patch: data.patch === null ? null : parsePatch(data.patch),
    };
    return snapshot;
  };
  const current = await call("read");
  if (!current) return null;
  if (action === "read") return editorDetail(tool, current);
  if (!options || options.version !== current.version
    || (action !== "discard" && options.baseHash !== editorialBaseHash(tool))) {
    throw new AccountApiError(409, "CMS_REVISION_CONFLICT");
  }
  if (action !== "discard" && current.baseHash && current.baseHash !== editorialBaseHash(tool)
    && (Object.keys(current.patch?.set ?? {}).length || current.patch?.remove.length)) {
    throw new AccountApiError(409, "CMS_REVISION_CONFLICT");
  }
  let patch: EditorialPatch | null = null;
  if (action === "save") patch = editorialPatch(tool, validateCatalogDraft(tool, options.value, capabilities));
  if (action === "approve") {
    if (!current.patch) throw new AccountApiError(409, "CMS_REVISION_CONFLICT");
    validateCatalogPublication(tool, applyEditorialPatch(tool, current.patch), capabilities);
  }
  const next = await call(action, patch);
  if (!next) throw serviceUnavailable();
  return editorDetail(tool, next);
}

export async function editorialDraftSummaries(actor: CmsActor, tools: readonly CatalogTool[]) {
  const data = await editorialRpc("cms_list_editorial_workspaces", cmsActorArgs(actor));
  if (!Array.isArray(data)) throw serviceUnavailable();
  const toolsById = new Map(tools.map((tool) => [tool.id, tool]));
  return data.flatMap((row): CatalogDraftSummary[] => {
    if (!record(row) || typeof row.toolId !== "string" || typeof row.version !== "number"
      || typeof row.updatedAt !== "string" || (row.state !== "draft" && row.state !== "approved" && row.state !== "delivered")
      || !Array.isArray(row.fields) || row.fields.some((field) => !reservedRoots.has(field))) {
      throw serviceUnavailable();
    }
    const tool = toolsById.get(row.toolId);
    if (!tool) return [];
    return [{ slug: tool.slug, name: tool.name, updatedAt: row.updatedAt, version: row.version,
      fields: row.fields.sort(), editorial: row.state }];
  });
}
