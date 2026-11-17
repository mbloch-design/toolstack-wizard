import { createHmac, timingSafeEqual } from "node:crypto";
import { AccountApiError } from "./_account-auth.js";
import { PRIORITY_PRODUCT_ID } from "./_payment-verification.js";

export const PRIORITY_AMOUNT = 2900;
export const PRIORITY_CURRENCY = "USD";
export const listingUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
export const creemCheckoutId = (value: unknown): value is string =>
  typeof value === "string" && /^(?:ch|chk)_[A-Za-z0-9_-]{1,128}$/.test(value);
export const creemTransactionId = (value: unknown): value is string =>
  typeof value === "string" && /^(?:tx|tran)_[A-Za-z0-9_-]{1,128}$/.test(value);
const orderId = (value: unknown): value is string =>
  typeof value === "string" && /^ord_[A-Za-z0-9_-]{1,128}$/.test(value);
export const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const entityId = (value: unknown) => typeof value === "string" ? value : asObject(value).id;

export type CheckoutAttempt = {
  id: string;
  listingId: string;
  ownerId: string;
  websiteUrl: string;
  offerVersion: number;
  locale: "fr" | "en";
  mode: "prod";
  productId: string;
  checkoutId?: string | null;
};

const unavailable = () => new AccountApiError(503, "CREEM_UNAVAILABLE");
const mismatch = () => new AccountApiError(409, "CREEM_RECEIPT_MISMATCH");

async function creem(path: string, body?: Record<string, unknown>) {
  const key = process.env.CREEM_API_KEY;
  if (!key) throw unavailable();
  try {
    const result = await fetch(`https://api.creem.io/v1/${path}`, {
      headers: { "x-api-key": key, ...(body && { "Content-Type": "application/json" }) },
      redirect: "error", signal: AbortSignal.timeout(8000),
      ...(body && { method: "POST", body: JSON.stringify(body) }),
    });
    if (!result.ok) throw unavailable();
    return asObject(await result.json());
  } catch { throw unavailable(); }
}

const checkoutMetadata = (attempt: CheckoutAttempt) => ({
  tooltrim_listing_id: attempt.listingId,
  tooltrim_owner_id: attempt.ownerId,
  tooltrim_offer_version: String(attempt.offerVersion),
  tooltrim_tool_url: attempt.websiteUrl,
});

function assertCheckout(attempt: CheckoutAttempt, checkout: Record<string, unknown>) {
  const metadata = asObject(checkout.metadata);
  if (!creemCheckoutId(checkout.id) || (attempt.checkoutId && checkout.id !== attempt.checkoutId)
    || checkout.mode !== attempt.mode || checkout.request_id !== attempt.id || checkout.units !== 1
    || entityId(checkout.product) !== attempt.productId
    || !Object.entries(checkoutMetadata(attempt)).every(([key, value]) => metadata[key] === value)) throw mismatch();
  return checkout.id;
}

export async function validatePriorityProduct(attempt: CheckoutAttempt) {
  if (attempt.productId !== PRIORITY_PRODUCT_ID || attempt.offerVersion !== 1) {
    throw new AccountApiError(409, "CREEM_PRODUCT_MISMATCH");
  }
  const product = await creem(`products?product_id=${encodeURIComponent(attempt.productId)}`);
  if (product.id !== attempt.productId || product.mode !== attempt.mode || product.billing_type !== "onetime"
    || product.status !== "active" || product.currency !== PRIORITY_CURRENCY || product.price !== PRIORITY_AMOUNT) {
    throw new AccountApiError(409, "CREEM_PRODUCT_MISMATCH");
  }
}

export function checkoutRedirect(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["checkout.creem.io", "www.creem.io", "creem.io"].includes(url.hostname)
      && !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}

export async function createListingCheckout(attempt: CheckoutAttempt) {
  await validatePriorityProduct(attempt);
  return dispatchListingCheckout(attempt);
}

export async function dispatchListingCheckout(attempt: CheckoutAttempt) {
  const successUrl = new URL(attempt.locale === "fr" ? "/fr/editeur" : "/en/publisher", "https://tooltrim.com");
  successUrl.searchParams.set("listingId", attempt.listingId);
  successUrl.searchParams.set("payment", "return");
  const checkout = await creem("checkouts", {
    product_id: attempt.productId,
    request_id: attempt.id,
    units: 1,
    success_url: successUrl.href,
    metadata: checkoutMetadata(attempt),
  });
  const checkoutId = assertCheckout(attempt, checkout);
  const checkoutUrl = checkoutRedirect(checkout.checkout_url);
  if (!checkoutUrl || checkout.status !== "pending") throw mismatch();
  return { checkoutId, checkoutUrl };
}

export type Receipt = {
  checkoutId: string;
  orderId: string;
  transactionId: string;
  state: "paid" | "review_required";
  paidAt: string;
};

export async function readListingReceipt(attempt: CheckoutAttempt, checkoutId: string): Promise<Receipt | null> {
  if (!creemCheckoutId(checkoutId) || (attempt.checkoutId && attempt.checkoutId !== checkoutId)) throw mismatch();
  const checkout = await creem(`checkouts?checkout_id=${encodeURIComponent(checkoutId)}`);
  if (assertCheckout(attempt, checkout) !== checkoutId) throw mismatch();
  if (checkout.status !== "completed") return null;
  const order = asObject(checkout.order);
  const matchesBasePrice = (order.sub_total ?? order.amount) === PRIORITY_AMOUNT
    || (order.amount === PRIORITY_AMOUNT && typeof order.sub_total === "number" && order.sub_total > 0
      && typeof order.tax_amount === "number" && order.tax_amount >= 0 && order.sub_total + order.tax_amount === PRIORITY_AMOUNT);
  if (!orderId(order.id) || !creemTransactionId(order.transaction) || order.currency !== PRIORITY_CURRENCY
    || entityId(order.product) !== attempt.productId || order.status !== "paid" || order.type !== "onetime"
    || !matchesBasePrice || Number(order.discount_amount ?? 0) !== 0
    || typeof order.amount_paid !== "number" || order.amount_paid <= 0) throw mismatch();
  const transaction = await creem(`transactions?transaction_id=${encodeURIComponent(order.transaction)}`);
  if (transaction.id !== order.transaction || transaction.mode !== attempt.mode || transaction.order !== order.id
    || transaction.type !== "payment" || transaction.currency !== PRIORITY_CURRENCY) throw mismatch();
  const incident = ["refunded", "partialRefund", "chargedBack", "partially_refunded", "chargeback"].includes(String(transaction.status))
    || Number(transaction.refunded_amount ?? 0) > 0;
  if (transaction.status !== "paid" && !incident) return null;
  const paidAt = transaction.created_at ?? order.created_at;
  if ((typeof paidAt !== "string" && typeof paidAt !== "number") || !Number.isFinite(new Date(paidAt).getTime())) throw mismatch();
  return { checkoutId, orderId: order.id, transactionId: order.transaction, state: incident ? "review_required" : "paid", paidAt: new Date(paidAt).toISOString() };
}

export function parseCreemEvent(raw: Buffer, signature: unknown, secret: string) {
  if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)
    || !timingSafeEqual(createHmac("sha256", secret).update(raw).digest(), Buffer.from(signature, "hex"))) {
    throw new AccountApiError(401, "CREEM_SIGNATURE_INVALID");
  }
  try {
    const { id, eventType, created_at, object } = asObject(JSON.parse(raw.toString("utf8")));
    if (typeof id !== "string" || !/^evt_[a-z0-9_-]{1,128}$/i.test(id) || typeof eventType !== "string"
      || typeof created_at !== "number" || !Number.isSafeInteger(created_at) || created_at <= 0
      || !Number.isFinite(new Date(created_at).getTime())) throw new Error();
    return { id, eventType, occurredAt: new Date(created_at).toISOString(), object: asObject(object) };
  } catch { throw new AccountApiError(400, "CREEM_EVENT_INVALID"); }
}
