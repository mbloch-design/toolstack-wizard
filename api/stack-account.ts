import type { VercelRequest, VercelResponse } from "../types/vercel-http";
import { AccountApiError, accountRpcError, getAccountServiceClient, requireAccount, requireAccountsEnabled } from "./_account-auth";
import { normalizeStoredPersonalStack, PersonalStackValidationError, validatePersonalStack, type PersonalStackRecord } from "../src/lib/personalStack";
import { readAccountBody } from "./_account-body";
import type { Json } from "../src/integrations/supabase/types";

// Framework adapters can disable body parsing. Standalone Vercel lazy getters
// are bypassed below; its restored raw stream is capped before JSON parsing.
export const config = { api: { bodyParser: false } };
const MAX_BODY_BYTES = 1024 * 1024;

/** Stored v3 rows stay untouched; responses always expose a complete V4 envelope. */
export function personalStackRecordFromRpc(value: unknown): PersonalStackRecord | null {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE");
  const record = value as Record<string, unknown>;
  if (!Number.isSafeInteger(record.revision) || (record.revision as number) < 1 || typeof record.updatedAt !== "string"
    || !Number.isFinite(Date.parse(record.updatedAt)) || !record.state || typeof record.state !== "object") {
    throw new AccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE");
  }
  return { state: normalizeStoredPersonalStack(record.state), revision: record.revision as number, updatedAt: record.updatedAt };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  try {
    requireAccountsEnabled();
    if (req.method !== "GET" && req.method !== "PUT" && req.method !== "DELETE") {
      res.setHeader("Allow", "GET, PUT, DELETE");
      res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } }); return;
    }
    const body = req.method === "PUT" ? await readAccountBody(req, MAX_BODY_BYTES, "INVALID_PERSONAL_STACK") : null;
    const account = await requireAccount(req);
    const client = getAccountServiceClient();
    const args = { p_owner: account.userId, p_session: account.sessionId };
    if (req.method === "DELETE") {
      const barrier = await client.rpc("begin_personal_account_deletion", args);
      if (barrier.error) throw accountRpcError(barrier.error);
      const history = await client.rpc("personal_account_has_contributions", args);
      if (history.error) throw accountRpcError(history.error);
      if (history.data !== false) throw new AccountApiError(history.data === true ? 409 : 503,
        history.data === true ? "ACCOUNT_HAS_CONTRIBUTIONS" : "STACK_ACCOUNT_UNAVAILABLE");
      const deleted = await client.auth.admin.deleteUser(account.userId);
      if (deleted.error) throw new AccountApiError(deleted.error.code === "23503" ? 409 : 503,
        deleted.error.code === "23503" ? "ACCOUNT_HAS_CONTRIBUTIONS" : "ACCOUNT_DELETION_FAILED");
      res.status(204).end(); return;
    }
    if (req.method === "GET") {
      const { data, error } = await client.rpc("read_personal_stack", args);
      if (error) throw accountRpcError(error);
      res.status(200).json({ stack: personalStackRecordFromRpc(data) }); return;
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AccountApiError(400, "INVALID_PERSONAL_STACK");
    const input = body as Record<string, unknown>;
    if (!Number.isSafeInteger(input.expectedRevision) || (input.expectedRevision as number) < 0 || (input.expectedRevision as number) >= Number.MAX_SAFE_INTEGER) {
      throw new AccountApiError(400, "INVALID_PERSONAL_STACK");
    }
    const state = validatePersonalStack(input.state);
    const { data, error } = await client.rpc("save_personal_stack", { ...args,
      p_expected_revision: input.expectedRevision as number, p_state: state as unknown as Json });
    if (error) throw accountRpcError(error);
    const stack = personalStackRecordFromRpc(data);
    if (!stack) throw new AccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE");
    res.status(200).json({ stack });
  } catch (cause) {
    const error = cause instanceof AccountApiError ? cause : cause instanceof PersonalStackValidationError
      ? new AccountApiError(400, "INVALID_PERSONAL_STACK") : new AccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
