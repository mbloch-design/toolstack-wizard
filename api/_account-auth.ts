import { normalizeOAuthProfileSeed, type OAuthProfileSeed } from "../src/lib/accountIdentityProfile.js";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types.js";
import type { VercelRequest } from "../types/vercel-http.js";

export class AccountApiError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); this.name = "AccountApiError"; }
}

export function requireAccountsEnabled(): void {
  if (process.env.STACK_ACCOUNT_ENABLED !== "true") throw new AccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE");
}

/** Server-only environment names; never fall back to browser keys or client metadata. */
export function getAccountServiceClient() {
  requireAccountsEnabled();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new AccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export function accountRpcError(error: { code?: string; message?: string }): AccountApiError {
  if (error.code === "PT401") return new AccountApiError(401, "ACCOUNT_SESSION_INVALID");
  if (error.code === "PT409") return new AccountApiError(409, error.message === "ACCOUNT_DELETING" ? "ACCOUNT_DELETING" : "STACK_REVISION_CONFLICT");
  if (error.code === "PT400") return new AccountApiError(400, "INVALID_PERSONAL_STACK");
  return new AccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE");
}

export async function requireAccount(req: VercelRequest): Promise<{ userId: string; sessionId: string; email: string | null; accountEmail: string | null; emailConfirmed: boolean; oauthProfile: OAuthProfileSeed | null }> {
  requireAccountsEnabled();
  const authorization = req.headers.authorization;
  const token = typeof authorization === "string" ? /^Bearer ([^\s]+)$/i.exec(authorization)?.[1] : undefined;
  if (!token || token.length > 16384) throw new AccountApiError(401, "ACCOUNT_SESSION_INVALID");
  const client = getAccountServiceClient();
  const { data, error } = await client.auth.getUser(token);
  if (error) {
    throw new AccountApiError(error.status && error.status < 500 ? 401 : 503,
      error.status && error.status < 500 ? "ACCOUNT_SESSION_INVALID" : "STACK_ACCOUNT_UNAVAILABLE");
  }
  const user = data.user;
  if (!user || user.is_anonymous) throw new AccountApiError(401, "ACCOUNT_SESSION_INVALID");
  // Decode only after getUser validated this exact token. Payload claims alone grant nothing.
  let claims: Record<string, unknown>;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("JWT structure");
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch { throw new AccountApiError(401, "ACCOUNT_SESSION_INVALID"); }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!claims || claims.sub !== user.id || typeof claims.session_id !== "string" || !uuid.test(claims.session_id)) {
    throw new AccountApiError(401, "ACCOUNT_SESSION_INVALID");
  }
  const result = await client.rpc("require_account_session", { p_owner: user.id, p_session: claims.session_id });
  if (result.error) throw accountRpcError(result.error);
  const accountEmail = typeof user.email === "string" && user.email ? user.email : null;
  const emailConfirmed = Boolean(accountEmail && user.email_confirmed_at);
  // email retains the confirmed-only authorization contract. accountEmail is
  // verified account data for private display and never confers a capability.
  return { userId: user.id, sessionId: claims.session_id, email: emailConfirmed ? accountEmail : null, accountEmail, emailConfirmed, oauthProfile: normalizeOAuthProfileSeed(user) };
}
