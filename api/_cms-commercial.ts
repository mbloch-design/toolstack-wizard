import { AccountApiError, getAccountServiceClient } from "./_account-auth.js";
import { pinnedBadgeTransport } from "./_cms-commercial-badge.js";
import { verifyBadgeOnPage } from "./_badge-verification.js";
import {
  asObject, checkoutRedirect, cmsCreemMode, cmsCreemProductId, creemCheckoutId, creemTransactionId, dispatchListingCheckout, listingUuid,
  parseCreemEvent, readListingReceipt, validatePriorityProduct, type CheckoutAttempt, type Receipt,
} from "./_cms-commercial-creem.js";
import type { CmsActor } from "./_cms-store.js";

const errorCodes = {
  PT400: [400, "INVALID_LISTING_COMMERCE"], PT401: [401, "ACCOUNT_SESSION_INVALID"],
  PT403: [403, "CMS_ACCESS_DENIED"], PT404: [404, "CMS_LISTING_NOT_FOUND"],
  PT409: [409, "CMS_LISTING_COMMERCE_CONFLICT"], "23505": [409, "CMS_LISTING_COMMERCE_CONFLICT"],
  PT429: [429, "CMS_BADGE_CHECK_RATE_LIMIT"],
} as const;

export function requireListingCommerceEnabled() {
  if (process.env.PUBLISHER_CMS_ENABLED !== "true") throw new AccountApiError(503, "CMS_COMMERCE_UNAVAILABLE");
}

// The checked-in types cover the account API. Keep the CMS adapter local until the
// pending migrations have been applied and their public RPC types can be regenerated.
async function rpc(name: string, args: Record<string, unknown>): Promise<unknown> {
  const client = getAccountServiceClient();
  const call = client.rpc.bind(client) as unknown as (rpcName: string, rpcArgs: Record<string, unknown>) =>
    PromiseLike<{ data: unknown; error: { code: string } | null }>;
  const { data, error } = await call(name, args);
  if (!error) return data;
  const known = errorCodes[error.code as keyof typeof errorCodes];
  throw known ? new AccountApiError(known[0], known[1]) : new AccountApiError(503, "CMS_COMMERCE_UNAVAILABLE");
}

const states = ["unchecked", "missing", "unreachable", "present", "pending", "paid", "review_required", "contact"] as const;
type CommerceState = typeof states[number];
export type CommerceAction = "status" | "start" | "reconcile" | "checkBadge" | "requestHistoricalReview";
type CommerceSnapshot = {
  state: CommerceState;
  attempt: (CheckoutAttempt & { dispatchStartedAt: string | null }) | null;
  websiteUrl: string;
  badgeUrl: string | null;
  badgeRequestedAt: string | null;
  badgeVerificationRequired: boolean;
  checkoutUrl: string | null;
  checkedAt: string | null;
  dispatch: boolean;
  canUpgrade: boolean;
  payments: Array<{ reference: string; paidAt: string; amountPaidMinor: number | null; currency: string | null; status: "paid" | "review_required"; mode: "prod" | "test" }>;
};

type Operation = "status" | "prepare" | "dispatch" | "bind" | "beginBadge" | "badge" | "requestHistoricalReview";
async function ownedCommerce(actor: CmsActor, listingId: string, action: Operation, value = {}) {
  const data = asObject(await rpc("cms_listing_commerce", {
    p_actor: actor.userId, p_session: actor.sessionId, p_listing: listingId, p_action: action, p_value: value,
  }));
  if (!states.includes(data.state as CommerceState) || typeof data.websiteUrl !== "string") {
    throw new AccountApiError(503, "CMS_COMMERCE_UNAVAILABLE");
  }
  return data as CommerceSnapshot;
}

function visible(snapshot: CommerceSnapshot) {
  const stalled = snapshot.attempt?.dispatchStartedAt && !snapshot.attempt.checkoutId
    && Date.now() - Date.parse(snapshot.attempt.dispatchStartedAt) > 60000;
  const state = snapshot.state === "pending" && stalled ? "review_required" : snapshot.state;
  const checkoutUrl = state === "pending" ? checkoutRedirect(snapshot.checkoutUrl) : null;
  return {
    state,
    payments: snapshot.payments ?? [],
    canUpgrade: snapshot.canUpgrade === true,
    ...(snapshot.checkedAt && { checkedAt: snapshot.checkedAt }),
    ...(snapshot.attempt && { attemptId: snapshot.attempt.id }),
    ...(checkoutUrl && { checkoutUrl }),
  };
}

async function startListingCheckout(actor: CmsActor, listingId: string) {
  let snapshot = await ownedCommerce(actor, listingId, "prepare", { mode: cmsCreemMode(), productId: cmsCreemProductId() });
  const attempt = snapshot.attempt;
  if (!attempt || snapshot.state !== "pending" || attempt.dispatchStartedAt) return visible(snapshot);
  await validatePriorityProduct(attempt);
  snapshot = await ownedCommerce(actor, listingId, "dispatch");
  if (!snapshot.dispatch) return visible(snapshot);
  // The durable dispatch claim precedes the provider POST. In case of an
  // ambiguous timeout we keep the claim and reconcile, so starts cannot double-charge.
  const checkout = await dispatchListingCheckout(attempt);
  return visible(await ownedCommerce(actor, listingId, "bind", { attemptId: attempt.id, ...checkout }));
}

function applyBilling(kind: string, eventId: string | null, occurredAt: string, proof: Record<string, unknown>) {
  return rpc("cms_apply_listing_billing", { p_event: eventId, p_kind: kind, p_occurred_at: occurredAt, p_proof: proof });
}

function applyReceipt(attempt: CheckoutAttempt, proof: Receipt, event?: ReturnType<typeof parseCreemEvent>) {
  return applyBilling(event ? "checkout.completed" : "reconcile", event?.id ?? null, event?.occurredAt ?? proof.paidAt,
    { ...proof, attemptId: attempt.id });
}

async function reconcileListingPayment(actor: CmsActor, listingId: string) {
  const snapshot = await ownedCommerce(actor, listingId, "status");
  const attempt = snapshot.attempt;
  if (!attempt?.checkoutId || snapshot.state === "review_required") return visible(snapshot);
  const proof = await readListingReceipt(attempt, attempt.checkoutId);
  if (proof) await applyReceipt(attempt, proof);
  return visible(await ownedCommerce(actor, listingId, "status"));
}

async function checkListingBadge(actor: CmsActor, listingId: string, badgeUrl?: string) {
  const listing = await ownedCommerce(actor, listingId, "beginBadge", { reuseRecent: badgeUrl === undefined });
  if (!listing.badgeVerificationRequired) return { ...visible(listing), state: "present" as const };
  const url = badgeUrl ?? listing.badgeUrl ?? listing.websiteUrl;
  let state: "present" | "missing" | "unreachable";
  try {
    await verifyBadgeOnPage(url, listing.websiteUrl, pinnedBadgeTransport);
    state = "present";
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (["badge_wrong_domain", "https_required", "invalid_url", "private_url", "Invalid URL"].includes(reason)) {
      throw new AccountApiError(400, "CMS_INVALID_BADGE_URL");
    }
    state = reason === "badge_not_found" ? "missing" : "unreachable";
  }
  const snapshot = await ownedCommerce(actor, listingId, "badge", { websiteUrl: listing.websiteUrl, badgeUrl: url, requestedAt: listing.badgeRequestedAt, state });
  return { ...visible(snapshot), state };
}

export async function runListingCommerce(actor: CmsActor, listingId: string, action: CommerceAction, badgeUrl?: string) {
  switch (action) {
    case "start": return startListingCheckout(actor, listingId);
    case "reconcile": return reconcileListingPayment(actor, listingId);
    case "checkBadge": return checkListingBadge(actor, listingId, badgeUrl);
    case "status":
    case "requestHistoricalReview": return visible(await ownedCommerce(actor, listingId, action));
  }
}

export async function applyVerifiedBillingEvent(event: ReturnType<typeof parseCreemEvent>) {
  if (event.eventType === "refund.created" || event.eventType === "dispute.created") {
    const transaction = asObject(event.object.transaction);
    if (!creemTransactionId(transaction.id) || transaction.mode !== cmsCreemMode() || transaction.type !== "payment"
      || transaction.currency !== "USD" || (event.eventType === "refund.created" && event.object.status !== "succeeded")) {
      return { ignored: true };
    }
    return applyBilling(event.eventType, event.id, event.occurredAt, { transactionId: transaction.id });
  }
  if (event.eventType !== "checkout.completed" || event.object.mode !== cmsCreemMode()
    || !listingUuid(event.object.request_id) || !creemCheckoutId(event.object.id)
    || !listingUuid(asObject(event.object.metadata).tooltrim_listing_id)) return { ignored: true };
  const lookup = asObject(await rpc("cms_lookup_listing_payment", { p_attempt: event.object.request_id, p_event: event.id }));
  if (lookup.duplicate === true) return { duplicate: true };
  if (!lookup.attempt) return { ignored: true };
  const attempt = lookup.attempt as CheckoutAttempt;
  const proof = await readListingReceipt(attempt, event.object.id);
  if (!proof) throw new AccountApiError(503, "CREEM_RECEIPT_PENDING");
  return applyReceipt(attempt, proof, event);
}
