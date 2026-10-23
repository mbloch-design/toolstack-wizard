import { normalizeOAuthAvatar } from "../src/lib/accountIdentityProfile.js";
import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";
import { AccountApiError, accountRpcError, getAccountServiceClient, requireAccount, requireAccountsEnabled } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { AccountProfileValidationError, normalizeDisplayName, parseAccountProfile } from "../src/lib/accountProfile.js";

export const config = { api: { bodyParser: false } };
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  try {
    requireAccountsEnabled();
    if (req.method !== "GET" && req.method !== "PUT") {
      res.setHeader("Allow", "GET, PUT"); res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } }); return;
    }
    let displayName: string | null = null;
    if (req.method === "PUT") {
      const body = await readAccountBody(req, 4096, "INVALID_ACCOUNT_PROFILE");
      if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 1 || !Object.prototype.hasOwnProperty.call(body, "displayName")) {
        throw new AccountApiError(400, "INVALID_ACCOUNT_PROFILE");
      }
      displayName = normalizeDisplayName((body as Record<string, unknown>).displayName);
    }
    const account = await requireAccount(req);
    const client = getAccountServiceClient();
    const args = { p_owner: account.userId, p_session: account.sessionId };
    const { data, error } = req.method === "GET" ? account.oauthProfile ? await client.rpc("import_personal_oauth_profile", { ...args, p_provider: account.oauthProfile.provider, p_display_name: account.oauthProfile.displayName, p_avatar_url: account.oauthProfile.avatarUrl, p_provider_locale: account.oauthProfile.providerLocale }) : await client.rpc("read_personal_profile", args)
      : await client.rpc("update_personal_profile", { ...args, p_display_name: displayName });
    if (error) {
      if (error.code === "PT400") throw new AccountApiError(400, "INVALID_ACCOUNT_PROFILE");
      if (error.code === "PT401" || error.code === "PT409") throw accountRpcError(error);
      throw new AccountApiError(503, "ACCOUNT_PROFILE_UNAVAILABLE");
    }
    let profile;
    try {
      if (!data || typeof data !== "object" || Array.isArray(data) || data.userId !== account.userId) throw new Error("Invalid owner source");
      const allowed = new Set((process.env.BACKOFFICE_ADMIN_EMAILS ?? "").split(",").map(email => email.trim().toLowerCase()).filter(Boolean));
      profile = parseAccountProfile({ ...data, avatarUrl: data.avatarUrl === null ? null : normalizeOAuthAvatar(data.avatarUrl, null), email: account.accountEmail, emailConfirmed: account.emailConfirmed,
        canAccessBackoffice: Boolean(account.email && allowed.has(account.email.trim().toLowerCase())) });
    } catch { throw new AccountApiError(503, "ACCOUNT_PROFILE_UNAVAILABLE"); }
    res.status(200).json({ profile });
  } catch (cause) {
    const error = cause instanceof AccountApiError ? cause : cause instanceof AccountProfileValidationError
      ? new AccountApiError(400, "INVALID_ACCOUNT_PROFILE") : new AccountApiError(503, "ACCOUNT_PROFILE_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
