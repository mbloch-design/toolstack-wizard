import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const actor = { userId: "abac1234-905c-46ed-b637-b115d69173a3", sessionId: "1973d735-e77b-4b65-be59-f3fbe1f2f065" };
const attempt = {
  id: "a45e0bf3-45b7-44bd-af63-e457dc8ab249",
  listingId: "c8046934-5514-439d-b174-d24b91d04376",
  ownerId: actor.userId,
  websiteUrl: "https://example.com/original",
  offerVersion: 1,
  locale: "fr" as const,
  mode: "prod" as const,
  productId: "prod_2LMoN4zyRhNAb53r3rWpwX",
  checkoutId: "ch_one",
};
const receipt = {
  id: "ch_one", request_id: attempt.id, mode: "prod", status: "completed", units: 1,
  product: "prod_2LMoN4zyRhNAb53r3rWpwX",
  metadata: {
    tooltrim_listing_id: attempt.listingId, tooltrim_owner_id: actor.userId,
    tooltrim_offer_version: "1", tooltrim_tool_url: attempt.websiteUrl,
  },
  order: { id: "ord_one", transaction: "tran_one", currency: "USD", amount: 2900,
    product: "prod_2LMoN4zyRhNAb53r3rWpwX", status: "paid", type: "onetime", amount_paid: 3509,
    created_at: "2026-11-16T21:00:00Z" },
};
const transaction = { id: "tran_one", order: "ord_one", amount: 2900, amount_paid: 3509,
  currency: "USD", type: "payment", status: "paid", mode: "prod" };
const fetchCreem = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("CREEM_API_KEY", "unit-tests-no-credentials");
  vi.stubGlobal("fetch", fetchCreem);
  fetchCreem.mockReset().mockImplementation(async (url) => new Response(JSON.stringify(
    String(url).includes("/transactions?") ? transaction : receipt,
  )));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

async function commercial() { return import("../../api/_cms-commercial-creem.js"); }

describe("CMS Creem payment verification", () => {
  it("validates immutable listing and quote metadata and accepts a tax-inclusive total", async () => {
    const { readListingReceipt } = await commercial();
    expect(await readListingReceipt(attempt, "ch_one")).toEqual({
      checkoutId: "ch_one", orderId: "ord_one", transactionId: "tran_one", state: "paid",
      paidAt: "2026-11-16T21:00:00.000Z",
    });
  });

  it("accepts a tax-inclusive quoted base only if the subtotal and tax reconcile to it", async () => {
    fetchCreem.mockResolvedValueOnce(new Response(JSON.stringify({ ...receipt, order: {
      ...receipt.order, sub_total: 2500, tax_amount: 400, amount: 2900, amount_paid: 2900,
    } })));
    const { readListingReceipt } = await commercial();
    expect(await readListingReceipt(attempt, "ch_one")).toMatchObject({ state: "paid" });
  });

  it.each([
    { id: "ch_other" }, { mode: "test" }, { request_id: "other" }, { product: "prod_other" },
    { metadata: { ...receipt.metadata, tooltrim_owner_id: "elsewhere" } },
    { metadata: { ...receipt.metadata, tooltrim_tool_url: "https://example.com/edited" } },
    { order: { ...receipt.order, amount: 2500 } }, { order: { ...receipt.order, currency: "EUR" } },
    { order: { ...receipt.order, status: "pending" } },
  ])("refuses a mismatched provider receipt (%j)", async (override) => {
    fetchCreem.mockResolvedValueOnce(new Response(JSON.stringify({ ...receipt, ...override })));
    const { readListingReceipt } = await commercial();
    await expect(readListingReceipt(attempt, "ch_one")).rejects.toThrow("CREEM_RECEIPT_MISMATCH");
  });

  it("reads the transaction before granting or renewing a paid right", async () => {
    fetchCreem.mockResolvedValueOnce(new Response(JSON.stringify(receipt)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...transaction, status: "partially_refunded" })));
    const { readListingReceipt } = await commercial();
    expect(await readListingReceipt(attempt, "ch_one")).toMatchObject({ state: "review_required" });
  });

  it("verifies precise raw webhook bytes and refuses a reserialized body", async () => {
    const { parseCreemEvent } = await commercial();
    const raw = Buffer.from('{ "id":"evt_123", "eventType":"checkout.completed", "created_at":1728734325927, "object":{} }');
    const signature = createHmac("sha256", "fixture-secret").update(raw).digest("hex");
    expect(parseCreemEvent(raw, signature, "fixture-secret")).toMatchObject({ id: "evt_123" });
    expect(() => parseCreemEvent(Buffer.from(JSON.stringify(JSON.parse(raw.toString()))), signature, "fixture-secret"))
      .toThrow("CREEM_SIGNATURE_INVALID");
  });

  it("checks the existing product price and one-time terms before asking Creem to create checkout", async () => {
    fetchCreem.mockResolvedValueOnce(new Response(JSON.stringify({
      id: attempt.productId, object: "product", mode: "prod", price: 2900, currency: "USD", billing_type: "recurring", status: "active",
    })));
    const { createListingCheckout } = await commercial();
    await expect(createListingCheckout(attempt)).rejects.toThrow("CREEM_PRODUCT_MISMATCH");
    expect(fetchCreem).toHaveBeenCalledTimes(1);
  });
});

describe("CMS commerce HTTP contracts", () => {
  it("does not accept a browser checkout id or paid flag", async () => {
    const { parseListingCommerce } = await import("../../api/listing-checkout.js");
    expect(parseListingCommerce({ listingId: attempt.listingId, action: "reconcile" })).toEqual({
      listingId: attempt.listingId, action: "reconcile", badgeUrl: undefined,
    });
    expect(() => parseListingCommerce({ listingId: attempt.listingId, action: "reconcile", checkoutId: "ch_one" }))
      .toThrow("INVALID_LISTING_COMMERCE");
    expect(() => parseListingCommerce({ listingId: attempt.listingId, action: "start", paid: true }))
      .toThrow("INVALID_LISTING_COMMERCE");
  });

  it("rejects a webhook with a parsed object instead of its raw bytes", async () => {
    const { httpFixture } = await import("./http.js");
    const { default: handler } = await import("../../api/creem-webhook.js");
    vi.stubEnv("PUBLISHER_CMS_ENABLED", "true");
    vi.stubEnv("CREEM_WEBHOOK_SECRET", "fixture-secret");
    const request = httpFixture({ eventType: "checkout.completed" });
    request.req.headers["creem-signature"] = "a".repeat(64);
    await handler(request.req, request.res);
    expect(request.res.statusCode).toBe(400);
    expect(request.body).toEqual({ error: { code: "CREEM_RAW_BODY_REQUIRED" } });
  });
});

describe("CMS badge download protections", () => {
  it.each(["::ffff:127.0.0.1", "fe80::1", "169.254.169.254", "100.64.0.1", "192.0.0.7"])("rejects nonpublic addresses, including %s", async (address) => {
    const { isPublicBadgeAddress } = await import("../../api/_cms-commercial-badge.js");
    expect(isPublicBadgeAddress(address)).toBe(false);
  });

  it("stops an oversized streamed response even if a badge is present in the prefix", async () => {
    const { readBoundedBadgePage } = await import("../../api/_badge-verification.js");
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(Buffer.from('<a href="https://tooltrim.com"><img src="https://tooltrim.com/tooltrim-badge.svg"></a>'));
        controller.enqueue(new Uint8Array(1_000_001));
      },
      cancel() { cancelled = true; },
    });
    await expect(readBoundedBadgePage(new Response(stream))).rejects.toThrow("page_unreachable");
    expect(cancelled).toBe(true);
  });
});
