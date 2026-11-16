import { AccountApiError, getAccountServiceClient } from "./_account-auth.js";
import type { Json } from "../src/integrations/supabase/types.js";
import { parseProductDraft, type ProductDraft } from "../src/lib/publisherCatalog.js";

export type CmsActor = { userId: string; sessionId: string };
type DraftSnapshot = { brandId: string; version: number; updatedAt: string; canEdit: boolean; value: ProductDraft };

const rpcErrors = {
  PT400: [400, "INVALID_PUBLISHER_DRAFT"],
  PT401: [401, "ACCOUNT_SESSION_INVALID"],
  PT403: [403, "CMS_ACCESS_DENIED"],
  PT404: [404, "CMS_WORKSPACE_NOT_FOUND"],
  PT409: [409, "CMS_REVISION_CONFLICT"],
} as const;

function parseSnapshot(data: Json | null, error: { code: string; message: string } | null): DraftSnapshot {
  if (error) {
    if (error.code === "PT409" && error.message === "ACCOUNT_DELETING") {
      throw new AccountApiError(409, "ACCOUNT_DELETING");
    }
    const known = rpcErrors[error.code as keyof typeof rpcErrors];
    if (known) throw new AccountApiError(known[0], known[1]);
    throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)
    || typeof data.brandId !== "string" || typeof data.canEdit !== "boolean"
    || typeof data.version !== "number" || !Number.isSafeInteger(data.version) || data.version < 1
    || typeof data.updatedAt !== "string" || !Number.isFinite(Date.parse(data.updatedAt))) {
    throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
  }

  const { draft } = parseProductDraft(data.value, { phase: "draft", purpose: "update" });
  if (!draft) throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
  return {
    brandId: data.brandId, version: data.version, updatedAt: data.updatedAt,
    canEdit: data.canEdit, value: draft,
  };
}

const target = (actor: CmsActor, toolId: string) => ({
  p_actor: actor.userId, p_session: actor.sessionId, p_tool: toolId,
});

export async function readPublisherDraft(actor: CmsActor, toolId: string) {
  const { data, error } = await getAccountServiceClient().rpc("cms_read_tool_draft", target(actor, toolId));
  return parseSnapshot(data, error);
}

/** Call using the validated draft and the snapshot read for this mutation. */
export async function savePublisherDraft(actor: CmsActor, toolId: string, snapshot: DraftSnapshot, value: ProductDraft) {
  const { data, error } = await getAccountServiceClient().rpc("cms_save_tool_draft", {
    ...target(actor, toolId),
    p_expected_brand: snapshot.brandId,
    p_expected_version: snapshot.version,
    p_value: value,
  });
  return parseSnapshot(data, error);
}
