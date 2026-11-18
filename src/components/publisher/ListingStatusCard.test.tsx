import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LangContext } from "@/hooks/useLang";
import type { ListingRequest } from "@/lib/publisherCatalogApi";
import ListingStatusCard from "./ListingStatusCard";

const listing: ListingRequest = {
  id: "be5ded44-7413-44e3-8651-ce92a98819ee",
  name: "Example", slug: "example", websiteUrl: "https://example.com",
  offer: "standard_badge", commercialStatus: "satisfied", status: "submitted",
  version: 1, createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z",
  reservationExpiresAt: null, representationStatus: "pending", deliveryStatus: "unpublished",
  representativeRole: "Founder", notes: "",
};

function view(record = listing, returnedFromPayment = false) {
  const update = vi.fn();
  const clearPaymentReturn = vi.fn();
  const getToken = async () => "fixture-token";
  render(<MemoryRouter>
    <LangContext.Provider value={{ lang: "en", prefix: "/en", t: (_fr, en) => en }}>
      <ListingStatusCard listing={record} getToken={getToken} update={update}
        returnedFromPayment={returnedFromPayment} clearPaymentReturn={clearPaymentReturn} />
    </LangContext.Provider>
  </MemoryRouter>);
  return { update, clearPaymentReturn };
}

afterEach(() => vi.unstubAllGlobals());

it("offers a one-time upgrade without starting checkout until explicitly requested", async () => {
  const fetch = vi.fn(async () => Response.json({ state: "present", canUpgrade: true }));
  vi.stubGlobal("fetch", fetch);
  view();
  const block = await screen.findByRole("region", { name: "Payments" });
  fireEvent.click(await within(block).findByRole("button", { name: "Upgrade to priority" }));
  expect(within(block).getByText(/US\$29 once/)).toBeVisible();
  expect(within(block).getByText(/free offer stays active/)).toBeVisible();
  fireEvent.click(within(block).getByRole("button", { name: "Keep the free offer" }));
  expect(within(block).queryByRole("button", { name: "Continue to payment" })).not.toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Standard review · Free with a badge")).toBeVisible();
});

it("reconciles a return for a free listing and refreshes before clearing the return marker", async () => {
  const upgraded: ListingRequest = { ...listing, offer: "priority_paid", version: 2 };
  const fetch = vi.fn(async (url: string, options?: RequestInit) => url === "/api/listing-checkout"
    ? Response.json({ state: "paid" })
    : Response.json({ listing: upgraded }));
  vi.stubGlobal("fetch", fetch);
  const { update, clearPaymentReturn } = view(listing, true);
  await waitFor(() => expect(clearPaymentReturn).toHaveBeenCalledOnce());
  expect(fetch).toHaveBeenCalledWith("/api/listing-checkout", expect.objectContaining({
    body: JSON.stringify({ action: "reconcile", listingId: listing.id }),
  }));
  expect(update).toHaveBeenCalledWith(upgraded);
});

it("keeps a confirmed payment visible with its actual amount and test provenance", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ state: "paid", canUpgrade: false, payments: [{
    reference: "ord_confirmed", paidAt: "2026-11-18T09:00:00Z", amountPaidMinor: 3509, currency: "USD", status: "paid", mode: "test",
  }] })));
  view({ ...listing, offer: "priority_paid", commercialStatus: "satisfied" });
  expect(await screen.findByText("ord_confirmed")).toBeVisible();
  expect(screen.getByText(/USD\s35\.09/)).toBeVisible();
  expect(screen.getByText("Test payment")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Continue to payment" })).not.toBeInTheDocument();
});

it("provides a retry when payment history fails to load", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ error: { code: "CMS_COMMERCE_UNAVAILABLE" } }, { status: 503 }))
    .mockResolvedValueOnce(Response.json({ state: "paid", payments: [] }));
  vi.stubGlobal("fetch", fetch);
  view({ ...listing, offer: "priority_paid", commercialStatus: "satisfied" });
  expect(await screen.findByRole("alert")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("No payments are recorded for this listing.")).toBeVisible();
});
