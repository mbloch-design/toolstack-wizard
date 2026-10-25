import { normalizeOAuthAvatar } from "../src/lib/accountIdentityProfile.js";
import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";
import {
  AccountApiError,
  accountRpcError,
  getAccountServiceClient,
  requireAccount,
} from "./_account-auth.js";
import {
  parseAccountDetail,
  parseAccountsDashboard,
  summarizeAccountStack,
} from "../src/lib/backofficeAccounts.js";

function queryValue(req: VercelRequest, name: string, fallback = ""): string {
  const value = req.query[name];
  if (value === undefined) return fallback;
  if (typeof value !== "string")
    throw new AccountApiError(400, "INVALID_ACCOUNTS_QUERY");
  return value;
}
function pageValue(
  req: VercelRequest,
  name: string,
  fallback: number,
  max: number,
): number {
  const raw = queryValue(req, name, String(fallback));
  const value = Number(raw);
  if (
    !/^\d+$/.test(raw) ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > max
  )
    throw new AccountApiError(400, "INVALID_ACCOUNTS_QUERY");
  return value;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
  }
  try {
    const account = await requireAccount(req);
    // Same server-controlled comma-separated email authority as the existing
    // back-office. requireAccount exposes email only after email confirmation.
    const allowed = new Set(
      (process.env.BACKOFFICE_ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    );
    if (!allowed.size) throw new AccountApiError(503, "BACKOFFICE_UNAVAILABLE");
    if (!account.email || !allowed.has(account.email.trim().toLowerCase()))
      throw new AccountApiError(403, "BACKOFFICE_FORBIDDEN");
    const mode = queryValue(req, "mode", "list");
    const include = queryValue(req, "include");
    if (include && include !== (mode === "detail" ? "identity" : "insights"))
      throw new AccountApiError(400, "INVALID_ACCOUNTS_QUERY");
    let query:
      | { mode: string; userId: string }
      | { mode: string; search: string; page: number; pageSize: number };
    if (mode === "detail") {
      const userId = queryValue(req, "userId");
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          userId,
        )
      )
        throw new AccountApiError(400, "INVALID_ACCOUNTS_QUERY");
      query = { mode, userId };
    } else if (mode === "list") {
      const search = queryValue(req, "search");
      if (search.length > 320)
        throw new AccountApiError(400, "INVALID_ACCOUNTS_QUERY");
      query = {
        mode,
        search,
        page: pageValue(req, "page", 1, Number.MAX_SAFE_INTEGER),
        pageSize: pageValue(req, "pageSize", 25, 100),
      };
    } else throw new AccountApiError(400, "INVALID_ACCOUNTS_QUERY");
    const client = getAccountServiceClient();
    const { data, error } = await client.rpc("accounts_dashboard", {
      p_admin: account.userId,
      p_session: account.sessionId,
      p_query: query,
    });
    if (error) {
      if (error.code === "PT400")
        throw new AccountApiError(400, "INVALID_ACCOUNTS_QUERY");
      throw accountRpcError(error);
    }
    if (query.mode === "detail" && "userId" in query) {
      if (data === null) return res.status(200).json({ account: null });
      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        data.userId !== query.userId
      )
        throw new AccountApiError(503, "BACKOFFICE_UNAVAILABLE");
      // Privileged cosmetic read only after verified administrator and result owner.
      const { data: row, error: profileError } = await client
        .from("profiles")
        .select("id, avatar_url, provider_locale, oauth_profile_source, locale")
        .eq("id", query.userId)
        .maybeSingle();
      if (profileError || (row && row.id !== query.userId))
        throw new AccountApiError(503, "BACKOFFICE_UNAVAILABLE");
      let identity;
      if (include === "identity") {
        const { data: auth, error: authError } =
          await client.auth.admin.getUserById(query.userId);
        if (authError || !auth.user || auth.user.id !== query.userId)
          throw new AccountApiError(503, "BACKOFFICE_UNAVAILABLE");
        identity = {
          lastSignInAt: auth.user.last_sign_in_at ?? null,
          emailConfirmedAt: auth.user.email_confirmed_at ?? null,
          locale: row?.locale ?? null,
        };
      }
      return res
        .status(200)
        .json({
          account: parseAccountDetail({
            ...data,
            avatarUrl: normalizeOAuthAvatar(row?.avatar_url, null),
            providerLocale: row?.provider_locale ?? null,
            oauthProfileSource: row?.oauth_profile_source ?? null,
            ...(identity ? { identity } : {}),
          }),
        });
    }
    const dashboard = parseAccountsDashboard(data);
    if (include === "insights") {
      const ids = dashboard.accounts
        .filter((account) => account.hasStack)
        .map((account) => account.userId);
      if (new Set(ids).size !== ids.length)
        throw new AccountApiError(503, "BACKOFFICE_UNAVAILABLE");
      if (ids.length) {
        const { data: rows, error: sourceError } = await client
          .from("stack_snapshots")
          .select("owner_id, state")
          .in("owner_id", ids);
        if (
          sourceError ||
          !rows ||
          rows.length !== ids.length ||
          new Set(rows.map((row) => row.owner_id)).size !== ids.length ||
          rows.some((row) => !ids.includes(row.owner_id))
        )
          throw new AccountApiError(503, "BACKOFFICE_UNAVAILABLE");
        const summaries = new Map(
          rows.map((row) => [row.owner_id, summarizeAccountStack(row.state)]),
        );
        dashboard.accounts = dashboard.accounts.map((account) => ({
          ...account,
          insights: summaries.get(account.userId) ?? null,
        }));
      } else
        dashboard.accounts = dashboard.accounts.map((account) => ({
          ...account,
          insights: null,
        }));
    }
    return res.status(200).json(dashboard);
  } catch (error) {
    const controlled =
      error instanceof AccountApiError
        ? error
        : new AccountApiError(503, "BACKOFFICE_UNAVAILABLE");
    return res
      .status(controlled.status)
      .json({ error: { code: controlled.code } });
  }
}
