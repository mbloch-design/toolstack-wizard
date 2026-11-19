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
  mode: "prod" | "test";
  productId: string;
  checkoutId?: string | null;
  legacyReference?: string | null;
};

const unavailable = () => new AccountApiError(503, "CREEM_UNAVAILABLE");
const mismatch = () => new AccountApiError(409, "CREEM_RECEIPT_MISMATCH");

export const cmsCreemMode = () => process.env.CMS_CREEM_MODE === "test" ? "test" as const : "prod" as const;
export function cmsCreemProductId() {
  const id = cmsCreemMode() === "test" ? process.env.CMS_CREEM_TEST_PRODUCT_ID : PRIORITY_PRODUCT_ID;
  if (!id || !/^prod_[a-zA-Z0-9_-]{1,128}$/.test(id)) throw unavailable();
  return id;
}

async function creem(path: string, mode: CheckoutAttempt["mode"], body?: Record<string, unknown>) {
  if (mode !== cmsCreemMode()) throw mismatch();
  const key = mode === "test" ? process.env.CMS_CREEM_TEST_API_KEY : process.env.CREEM_API_KEY;
  if (!key) throw unavailable();
  try {
    const host = mode === "test" ? "test-api.creem.io" : "api.creem.io";
    const result = await fetch(`https://${host}/v1/${path}`, {
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
  if (attempt.mode !== cmsCreemMode() || attempt.productId !== cmsCreemProductId() || attempt.offerVersion !== 1) {
    throw new AccountApiError(409, "CREEM_PRODUCT_MISMATCH");
  }
  const product = await creem(`products?product_id=${encodeURIComponent(attempt.productId)}`, attempt.mode);
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
  const origin = new URL(process.env.CMS_PUBLIC_ORIGIN ?? "https://tooltrim.com");
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.port ||
    (attempt.mode === "test" && origin.hostname === "tooltrim.com")) throw unavailable();
  const successUrl = new URL(attempt.locale === "fr" ? "/fr/editeur" : "/en/publisher", origin.origin);
  successUrl.searchParams.set("listingId", attempt.listingId);
  successUrl.searchParams.set("payment", "return");
  const checkout = await creem("checkouts", attempt.mode, {
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
  amountPaidMinor: number;
  currency: "USD";
};

export async function readListingReceipt(attempt: CheckoutAttempt, checkoutId: string): Promise<Receipt | null> {
  if (!creemCheckoutId(checkoutId) || (attempt.checkoutId && attempt.checkoutId !== checkoutId)) throw mismatch();
  const checkout = await creem(`checkouts?checkout_id=${encodeURIComponent(checkoutId)}`, attempt.mode);
  if (attempt.legacyReference) {
    const metadata=asObject(checkout.metadata);
    if (checkout.id !== checkoutId || checkout.mode !== attempt.mode || entityId(checkout.product) !== attempt.productId
      || metadata.tooltrim_submission_id !== attempt.legacyReference || metadata.tooltrim_tool_url !== attempt.websiteUrl) throw mismatch();
  } else if (assertCheckout(attempt, checkout) !== checkoutId) throw mismatch();
  if (checkout.status !== "completed") return null;
  return readPaidCheckoutReceipt(attempt, checkout);
}

async function readPaidCheckoutReceipt(attempt: Pick<CheckoutAttempt, "mode" | "productId">, checkout: Record<string, unknown>): Promise<Receipt | null> {
  const checkoutId = String(checkout.id);
  const order = asObject(checkout.order);
  const matchesBasePrice = (order.sub_total ?? order.amount) === PRIORITY_AMOUNT
    || (order.amount === PRIORITY_AMOUNT && typeof order.sub_total === "number" && order.sub_total > 0
      && typeof order.tax_amount === "number" && order.tax_amount >= 0 && order.sub_total + order.tax_amount === PRIORITY_AMOUNT);
  if (!orderId(order.id) || !creemTransactionId(order.transaction) || order.currency !== PRIORITY_CURRENCY
    || entityId(order.product) !== attempt.productId || order.status !== "paid" || order.type !== "onetime"
    || !matchesBasePrice || Number(order.discount_amount ?? 0) !== 0
    || typeof order.amount_paid !== "number" || !Number.isSafeInteger(order.amount_paid) || order.amount_paid <= 0) throw mismatch();
  const transaction = await creem(`transactions?transaction_id=${encodeURIComponent(order.transaction)}`, attempt.mode);
  if (transaction.id !== order.transaction || transaction.mode !== attempt.mode || transaction.order !== order.id
    || transaction.type !== "payment" || transaction.currency !== PRIORITY_CURRENCY) throw mismatch();
  const incident = ["refunded", "partialRefund", "chargedBack", "partially_refunded", "chargeback"].includes(String(transaction.status))
    || Number(transaction.refunded_amount ?? 0) > 0;
  if (transaction.status !== "paid" && !incident) return null;
  const paidAt = transaction.created_at ?? order.created_at;
  if ((typeof paidAt !== "string" && typeof paidAt !== "number") || !Number.isFinite(new Date(paidAt).getTime())) throw mismatch();
  return { checkoutId, orderId: order.id, transactionId: order.transaction, state: incident ? "review_required" : "paid", paidAt: new Date(paidAt).toISOString(),
    amountPaidMinor: order.amount_paid, currency: "USD" };
}

/** Legacy receipts are matched by their original immutable submission metadata, never by email alone. */
export async function readHistoricalListingReceipt(checkoutId: string, paymentReference: string, websiteUrl: string): Promise<Receipt> {
  if (!creemCheckoutId(checkoutId) || !listingUuid(paymentReference) || cmsCreemMode() !== "prod") throw mismatch();
  const checkout = await creem(`checkouts?checkout_id=${encodeURIComponent(checkoutId)}`, "prod");
  const metadata = asObject(checkout.metadata);
  if (checkout.id !== checkoutId || checkout.mode !== "prod" || checkout.status !== "completed"
    || entityId(checkout.product) !== PRIORITY_PRODUCT_ID
    || metadata.tooltrim_submission_id !== paymentReference || metadata.tooltrim_tool_url !== websiteUrl) throw mismatch();
  const receipt = await readPaidCheckoutReceipt({ mode: "prod", productId: PRIORITY_PRODUCT_ID }, checkout);
  if (!receipt || receipt.state !== "paid") throw mismatch();
  return receipt;
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
