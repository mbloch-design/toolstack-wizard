import type { CmsIssue, ProductDraft } from "./publisherCatalog";

export type PublisherToken = () => Promise<string | null>;
export type PublisherTool = { id: string; slug: string; name: string; canEdit: boolean };
export type PublisherDraft = { brandId: string; version: number; updatedAt: string; canEdit: boolean; value: ProductDraft };
export type PublisherSubmission = { id: string; version: number; status: string; submittedAt: string; reviewNote?: string | null };
export type ListingOffer = "standard_badge" | "priority_paid";
export type ListingRequest = {
  id: string; name: string; websiteUrl: string; slug: string; offer: ListingOffer;
  status: string; version: number; createdAt: string; updatedAt: string;
  reservationExpiresAt: string | null; commercialStatus: string; representationStatus: string; deliveryStatus: string;
  toolId?: string | null;
  representativeRole: string; notes: string; media?: ProductDraft["media"];
};
export type ListingCandidate = { kind: "tool" | "listing"; id: string; slug: string; name: string; websiteUrl: string };
export type ListingCommerce = {
  state: "unchecked" | "missing" | "unreachable" | "present" | "pending" | "paid" | "review_required" | "contact";
  checkedAt?: string; checkoutUrl?: string; attemptId?: string;
};

export class PublisherApiError extends Error {
  constructor(readonly status: number, readonly code: string, readonly issues: CmsIssue[] = []) {
    super(code);
  }
}

export async function publisherRequest<T>(getToken: PublisherToken, path: string, options: {
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  body?: object;
  signal?: AbortSignal;
} = {}): Promise<T> {
  const token = await getToken();
  if (!token) throw new PublisherApiError(401, "ACCOUNT_SESSION_INVALID");
  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, ...(options.body && { "Content-Type": "application/json" }) },
    cache: "no-store",
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || (!payload && response.status !== 204)) {
    throw new PublisherApiError(response.status, payload?.error?.code ?? "CMS_WORKSPACE_UNAVAILABLE", payload?.error?.issues);
  }
  return payload;
}

export function publisherPath(prefix: string, slug?: string) {
  return `${prefix}/publisher${slug ? `/tools/${encodeURIComponent(slug)}` : ""}`;
}

const invitationKey = "tooltrim:publisher-invitation";
const invitationPattern = /^[a-zA-Z0-9_-]{43}$/;

export function keepPublisherInvitation(token: string) {
  if (!invitationPattern.test(token)) return false;
  try {
    sessionStorage.setItem(invitationKey, JSON.stringify({ token, expiresAt: Date.now() + 60 * 60 * 1000 }));
    return true;
  } catch {
    return false;
  }
}

export function readPublisherInvitation() {
  try {
    const value = JSON.parse(sessionStorage.getItem(invitationKey) ?? "null");
    if (value && Number.isFinite(value.expiresAt) && value.expiresAt > Date.now() && invitationPattern.test(value.token)) return value.token as string;
    sessionStorage.removeItem(invitationKey);
  } catch { /* The invitation can also be entered manually. */ }
  return "";
}

export function clearPublisherInvitation() {
  try { sessionStorage.removeItem(invitationKey); } catch { /* Storage can be unavailable. */ }
}
