import { supabase } from "@/integrations/supabase/client";
import {
  parseAccountDetail,
  parseAccountsDashboard,
  type AccountDetail,
  type AccountsDashboard,
} from "./backofficeAccounts";
export type {
  AccountDetail,
  AccountSummary,
  AccountsDashboard,
} from "./backofficeAccounts";

export class BackofficeAccountsError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = "BackofficeAccountsError";
  }
}
async function request(query: URLSearchParams): Promise<unknown> {
  let response: Response;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token)
      throw new BackofficeAccountsError(401, "ACCOUNT_SESSION_INVALID");
    response = await fetch(`/api/backoffice-accounts?${query}`, {
      method: "GET",
      cache: "no-store",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
  } catch (error) {
    if (error instanceof BackofficeAccountsError) throw error;
    throw new BackofficeAccountsError(503, "BACKOFFICE_UNAVAILABLE");
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new BackofficeAccountsError(503, "BACKOFFICE_UNAVAILABLE");
  }
  if (!response.ok) {
    const code =
      response.status === 401
        ? "ACCOUNT_SESSION_INVALID"
        : response.status === 403
          ? "BACKOFFICE_FORBIDDEN"
          : "BACKOFFICE_UNAVAILABLE";
    throw new BackofficeAccountsError(response.status, code);
  }
  return body;
}
export async function loadAccountsDashboard({
  search = "",
  page = 1,
  pageSize = 25,
  includeInsights = false,
}: {
  search?: string;
  page?: number;
  pageSize?: number;
  includeInsights?: boolean;
} = {}): Promise<AccountsDashboard> {
  const params = new URLSearchParams({
    search,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (includeInsights) params.set("include", "insights");
  const value = await request(params);
  try {
    return parseAccountsDashboard(value);
  } catch {
    throw new BackofficeAccountsError(503, "BACKOFFICE_UNAVAILABLE");
  }
}
export async function loadAccountDetail(
  userId: string,
): Promise<AccountDetail | null> {
  const value = await request(
    new URLSearchParams({ mode: "detail", userId, include: "identity" }),
  );
  try {
    if (!value || typeof value !== "object" || !("account" in value))
      throw new Error("Invalid detail response");
    return parseAccountDetail(value.account);
  } catch {
    throw new BackofficeAccountsError(503, "BACKOFFICE_UNAVAILABLE");
  }
}
