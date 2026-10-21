import { normalizeDisplayName, parseAccountProfile, type AccountProfile } from "./accountProfile";
export class AccountProfileApiError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); this.name = "AccountProfileApiError"; }
}
async function request(token: string, method: "GET" | "PUT", signal?: AbortSignal, displayName?: string | null): Promise<AccountProfile> {
  let response: Response;
  try {
    response = await fetch("/api/account-profile", { method, signal, cache: "no-store", headers: {
      Authorization: `Bearer ${token}`, ...(method === "PUT" ? { "Content-Type": "application/json" } : {}),
    }, ...(method === "PUT" ? { body: JSON.stringify({ displayName }) } : {}) });
  } catch { throw new AccountProfileApiError(0, signal?.aborted ? "ACCOUNT_PROFILE_CANCELLED" : "ACCOUNT_PROFILE_NETWORK_ERROR"); }
  let value: unknown;
  try { value = await response.json(); } catch { throw new AccountProfileApiError(response.ok ? 503 : response.status, "ACCOUNT_PROFILE_UNAVAILABLE"); }
  if (!response.ok) {
    const error = value && typeof value === "object" && "error" in value ? value.error : null;
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "ACCOUNT_PROFILE_UNAVAILABLE";
    throw new AccountProfileApiError(response.status, code);
  }
  try { return parseAccountProfile(value && typeof value === "object" && "profile" in value ? value.profile : undefined); }
  catch { throw new AccountProfileApiError(503, "ACCOUNT_PROFILE_UNAVAILABLE"); }
}
export async function loadAccountProfile(token: string, signal?: AbortSignal): Promise<AccountProfile> { return request(token, "GET", signal); }
export async function saveAccountProfile(token: string, displayName: string | null, signal?: AbortSignal): Promise<AccountProfile> {
  const name = normalizeDisplayName(displayName);
  return request(token, "PUT", signal, name);
}
