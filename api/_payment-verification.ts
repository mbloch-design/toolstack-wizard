const PRODUCT_ID = "prod_2LMoN4zyRhNAb53r3rWpwX";

export class PaymentVerificationError extends Error {
  constructor(public readonly status: 400 | 503, code: string) { super(code); }
}
const invalid = () => new PaymentVerificationError(400, "payment_verification_required");
const unavailable = () => new PaymentVerificationError(503, "payment_verification_unavailable");
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const productId = (value: unknown) => typeof value === "string" ? value : record(value).id;
const siteUrl = (value: unknown) => {
  if (typeof value !== "string" || value.length > 300) throw invalid();
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw invalid();
    return url.href;
  } catch { throw invalid(); }
};

/** Read-only provider proof. This does not consume a checkout or deduplicate emails. */
export async function verifySubmissionPayment(input: { checkoutId?: unknown; paymentReference?: unknown; toolUrl?: unknown }) {
  const { checkoutId, paymentReference } = input;
  if (typeof checkoutId !== "string" || !/^(?:ch|chk)_[A-Za-z0-9_-]{1,128}$/.test(checkoutId)
    || typeof paymentReference !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(paymentReference)) throw invalid();
  const toolUrl = siteUrl(input.toolUrl);
  const key = process.env.CREEM_API_KEY;
  if (!key) throw unavailable();
  let checkout: Record<string, unknown>;
  try {
    const response = await fetch(`https://api.creem.io/v1/checkouts?checkout_id=${encodeURIComponent(checkoutId)}`, {
      headers: { "x-api-key": key }, redirect: "error", signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404) throw invalid();
    if (!response.ok) throw unavailable();
    checkout = record(await response.json());
    if (!checkout.id || !checkout.status) throw unavailable();
  } catch (error) {
    if (error instanceof PaymentVerificationError) throw error;
    throw unavailable();
  }
  const metadata = record(checkout.metadata);
  if (checkout.id !== checkoutId || checkout.mode !== "prod" || checkout.status !== "completed"
    || record(checkout.order).status !== "paid"
    || productId(checkout.product) !== PRODUCT_ID
    || metadata.tooltrim_submission_id !== paymentReference
    || metadata.tooltrim_tool_url !== toolUrl) throw invalid();
}
