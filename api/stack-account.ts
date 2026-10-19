import type { VercelRequest, VercelResponse } from "../types/vercel-http";
import { AccountApiError, accountRpcError, getAccountServiceClient, requireAccount, requireAccountsEnabled } from "./_account-auth";
import { normalizePersonalStack, PersonalStackValidationError, validatePersonalStack, type PersonalStackRecord } from "../src/lib/personalStack";
import type { Json } from "../src/integrations/supabase/types";

// Framework adapters can disable body parsing. Standalone Vercel lazy getters
// are bypassed below; its restored raw stream is capped before JSON parsing.
export const config = { api: { bodyParser: false } };
const MAX_BODY_BYTES = 1024 * 1024;

async function readBody(req: VercelRequest): Promise<unknown> {
  const length = req.headers["content-length"];
  if (length !== undefined && (typeof length !== "string" || !/^\d+$/.test(length))) throw new AccountApiError(400, "INVALID_PERSONAL_STACK");
  if (length && Number(length) > MAX_BODY_BYTES) throw new AccountApiError(413, "PAYLOAD_TOO_LARGE");
  let raw: string;
  const descriptor = Object.getOwnPropertyDescriptor(req, "body");
  const suppliedBody = descriptor && "value" in descriptor ? descriptor.value : undefined;
  if (suppliedBody !== undefined) {
    // Parsed bodies occur in adapters/tests. Never JSON-clone them: NaN/Infinity must be rejected as such.
    if (typeof suppliedBody !== "string" && !Buffer.isBuffer(suppliedBody)) {
      if (Buffer.byteLength(JSON.stringify(suppliedBody) ?? "") > MAX_BODY_BYTES) throw new AccountApiError(413, "PAYLOAD_TOO_LARGE");
      return suppliedBody;
    }
    if (Buffer.byteLength(suppliedBody) > MAX_BODY_BYTES) throw new AccountApiError(413, "PAYLOAD_TOO_LARGE");
    raw = suppliedBody.toString();
  } else {
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.byteLength;
      if (bytes > MAX_BODY_BYTES) throw new AccountApiError(413, "PAYLOAD_TOO_LARGE");
      chunks.push(buffer);
    }
    raw = Buffer.concat(chunks).toString("utf8");
  }
  try { return JSON.parse(raw); } catch { throw new AccountApiError(400, "INVALID_PERSONAL_STACK"); }
}

/** Stored v3 rows stay untouched; responses always expose a complete V4 envelope. */
export function personalStackRecordFromRpc(value: unknown): PersonalStackRecord | null {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE");
  const record = value as Record<string, unknown>;
  if (!Number.isSafeInteger(record.revision) || (record.revision as number) < 1 || typeof record.updatedAt !== "string"
    || !Number.isFinite(Date.parse(record.updatedAt)) || !record.state || typeof record.state !== "object") {
    throw new AccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE");
  }
  return { state: normalizePersonalStack(record.state), revision: record.revision as number, updatedAt: record.updatedAt };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  try {
    requireAccountsEnabled();
    if (req.method === "DELETE") throw new AccountApiError(503, "ACCOUNT_DELETION_UNAVAILABLE");
    if (req.method !== "GET" && req.method !== "PUT") {
      res.setHeader("Allow", "GET, PUT, DELETE");
      res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } }); return;
    }
    const body = req.method === "PUT" ? await readBody(req) : null;
    const account = await requireAccount(req);
    const client = getAccountServiceClient();
    const args = { p_owner: account.userId, p_session: account.sessionId };
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
