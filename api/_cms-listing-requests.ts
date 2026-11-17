import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { AccountApiError, getAccountServiceClient } from "./_account-auth.js";
import tools from "../src/data/tools_v4.json";
import type { Json } from "../src/integrations/supabase/types.js";

type Actor = { userId: string; sessionId: string };
type PublicTool = { id: string; slug: string; name: string; websiteUrl?: string | null };

const publicTools: readonly PublicTool[] = tools;
const publicToolsById = new Map(publicTools.map((tool) => [tool.id, tool]));
const publicSlugs = new Set(publicTools.map((tool) => tool.slug));

export const invalidListing = () => new AccountApiError(400, "INVALID_LISTING_REQUEST");

function urlDetails(value: string) {
  try {
    if (!/^https?:\/\//i.test(value) || /[\u0000-\u001F\u007F\\]/.test(value)) return null;
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
    if (url.username || url.password || !hostname.includes(".") || isIP(hostname)
      || !hostname.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
    url.hostname = url.hostname.replace(/\.$/, "");
    url.hash = "";
    if (url.href.length > 500) return null;
    return { websiteUrl: url.href, hostname };
  } catch {
    return null;
  }
}

function normalizeName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

function makeSlug(name: string) {
  const normalized = name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100).replace(/-$/, "");
  return slug || `outil-${createHash("sha256").update(normalized).digest("hex").slice(0, 16)}`;
}

type Identity = { name: string; websiteUrl: string; hostname: string; slug: string };
const publicByHostname = new Map<string, PublicTool[]>();
for (const tool of publicTools) {
  if (!tool.websiteUrl) continue;
  const parsed = urlDetails(tool.websiteUrl);
  if (!parsed) continue;
  const matches = publicByHostname.get(parsed.hostname) ?? [];
  matches.push(tool);
  publicByHostname.set(parsed.hostname, matches);
}

export function parseIdentity(input: Record<string, unknown>): Identity {
  if (typeof input.name !== "string" || typeof input.websiteUrl !== "string") throw invalidListing();
  const name = normalizeName(input.name);
  const parsed = urlDetails(input.websiteUrl.trim());
  if (!name || name.length > 160 || /[\u0000-\u001F\u007F]/.test(name) || !parsed) throw invalidListing();
  return { name, ...parsed, slug: makeSlug(name) };
}

export function findPublicCandidates(identity: Identity) {
  return (publicByHostname.get(identity.hostname) ?? [])
    .map(({ id, slug, name, websiteUrl }) => ({ kind: "tool", id, slug, name, websiteUrl }));
}

export function checkAvailablePublicIdentity(identity: Identity) {
  if (publicSlugs.has(identity.slug)
    || (publicByHostname.get(identity.hostname) ?? []).some(({ name }) => makeSlug(normalizeName(name)) === identity.slug)) {
    throw new AccountApiError(409, "LISTING_SLUG_UNAVAILABLE");
  }
}

export function readPublicClaimTarget(toolId: unknown) {
  if (typeof toolId !== "string" || !toolId || toolId.length > 200) throw invalidListing();
  const tool = publicToolsById.get(toolId);
  if (!tool) throw new AccountApiError(404, "LISTING_TOOL_NOT_FOUND");
  return { toolId: tool.id, slug: tool.slug };
}

type ListingAction = "list" | "read" | "lookup" | "create" | "claimExisting" | "save" | "submit" | "withdraw";
type AdminAction = "list" | "inspectClaim" | "invite" | "revokeInvitation";
type InitialReviewAction = "adminRead" | "ownerRead" | "prepareInitial" | "requestFactualReview"
  | "respondFactualReview" | "approveInitialEditorial" | "promoteInitial";
type RpcResult = { data: Json | null; error: { code: string; message: string } | null };
type ActorArguments = { p_actor: string; p_session: string };
type ListingRpc = (
  ...call:
    | [name: "cms_listing_requests", args: ActorArguments & { p_action: ListingAction; p_payload: Record<string, Json> }]
    | [name: "cms_admin_listing_requests", args: ActorArguments & { p_action: AdminAction; p_payload: Record<string, Json> }]
    | [name: "cms_accept_listing_invitation", args: ActorArguments & { p_digest: string }]
    | [name: "cms_initial_listing_review", args: ActorArguments & { p_action: InitialReviewAction; p_payload: Record<string, Json> }]
) => PromiseLike<RpcResult>;

const conflictCodes = new Set([
  "ACCOUNT_DELETING", "LISTING_IDEMPOTENCY_CONFLICT", "LISTING_SLUG_UNAVAILABLE",
  "LISTING_REVISION_CONFLICT", "LISTING_NOT_EDITABLE", "LISTING_REQUIREMENTS_PENDING",
  "LISTING_ATTRIBUTION_CONFLICT", "LISTING_INVITATION_REVOKED", "LISTING_INVITATION_EXPIRED", "LISTING_INVITATION_USED",
  "LISTING_REVIEW_INCOMPLETE", "LISTING_COMMERCIAL_IDENTITY_MISMATCH",
]);

async function callListingRpc(...call: Parameters<ListingRpc>) {
  const client = getAccountServiceClient();
  // The migrations' service-only RPCs are outside the generated public client types.
  const rpc = client.rpc.bind(client) as unknown as ListingRpc;
  const { data, error } = await rpc(...call);
  if (error?.code === "PT401") throw new AccountApiError(401, "ACCOUNT_SESSION_INVALID");
  if (error?.code === "PT403") throw new AccountApiError(403,
    error.message === "LISTING_INVITATION_ACCOUNT_MISMATCH" ? error.message : "CMS_ACCESS_DENIED");
  if (error?.code === "PT404") throw new AccountApiError(404,
    error.message === "LISTING_INVITATION_NOT_FOUND" ? error.message : "LISTING_NOT_FOUND");
  if (error?.code === "PT400") throw invalidListing();
  if (error?.code === "PT409") throw new AccountApiError(409, conflictCodes.has(error.message) ? error.message : "LISTING_CONFLICT");
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    throw new AccountApiError(503, "CMS_LISTING_UNAVAILABLE");
  }
  return data;
}

export function callListing(actor: Actor, action: ListingAction, payload: Record<string, Json> = {}) {
  return callListingRpc("cms_listing_requests", {
    p_actor: actor.userId, p_session: actor.sessionId, p_action: action, p_payload: payload,
  });
}

export function callAdminListing(actor: Actor, action: AdminAction, payload: Record<string, Json> = {}) {
  return callListingRpc("cms_admin_listing_requests", {
    p_actor: actor.userId, p_session: actor.sessionId, p_action: action, p_payload: payload,
  });
}

export function invitationDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function acceptListingInvitation(actor: Actor, token: unknown) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw invalidListing();
  return callListingRpc("cms_accept_listing_invitation", {
    p_actor: actor.userId, p_session: actor.sessionId, p_digest: invitationDigest(token),
  });
}

export function readListingBrandDomain(value: unknown) {
  if (typeof value !== "string") throw invalidListing();
  const domain = value.trim().toLowerCase();
  const parsed = urlDetails("https://" + domain);
  if (!parsed || parsed.websiteUrl !== `https://${domain}/` || parsed.hostname.length > 253) throw invalidListing();
  return parsed.hostname;
}

export function callListingInitialReview(actor: Actor, action: InitialReviewAction, payload: Record<string, Json>) {
  return callListingRpc("cms_initial_listing_review", {
    p_actor: actor.userId, p_session: actor.sessionId, p_action: action, p_payload: payload,
  });
}

export const listingUuid = (value: unknown): value is string => typeof value === "string"
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function listingBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalidListing();
  return value as Record<string, unknown>;
}

export function listingFieldsOnly(value: Record<string, unknown>, keys: readonly string[]) {
  if (Object.keys(value).some((key) => !keys.includes(key))) throw invalidListing();
}

export function readListingBrand(input: Record<string, unknown>, role: string): Record<string, Json> {
  if (input.brandId !== undefined) {
    if (!listingUuid(input.brandId) || input.brandName !== undefined || input.brandDomain !== undefined) throw invalidListing();
    return { brandId: input.brandId };
  }
  if (role !== "owner" || typeof input.brandName !== "string") throw invalidListing();
  const brandName = input.brandName.trim();
  if (!brandName || brandName.length > 160 || /[\u0000-\u001F\u007F]/.test(brandName)) throw invalidListing();
  return { brandName, brandDomain: readListingBrandDomain(input.brandDomain) };
}
