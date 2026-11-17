import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LangContext } from "@/hooks/useLang";
import InitialListingAdminReview from "./InitialListingAdminReview";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "admin" } } }) } },
}));

afterEach(() => vi.unstubAllGlobals());

it("sends the exact saved product revision for factual review", async () => {
  const productRevision = { id: "product-revision", hash: "hash", value: {
    schemaVersion: 1, name: "Publisher fixture", websiteUrl: "https://example.org/",
    localized: {
      fr: { shortDescription: null, productDescription: null, features: [], useCases: [] },
      en: { shortDescription: "Version to review", productDescription: null, features: [], useCases: [] },
    }, plans: [], media: [], classificationProposals: [], integrations: [],
  } };
  const review = {
    listing: {
      id: "listing-1", name: "Publisher fixture", websiteUrl: "https://example.org/", status: "in_preparation",
      version: 4, offer: "priority_paid", commercialStatus: "satisfied", representationStatus: "verified", deliveryStatus: "unpublished",
      representativeRole: "Founder", notes: "Initial request",
    },
    productRevision,
    editorialRevision: null, approvalId: null, confirmation: null,
  };
  const fetch = vi.fn(async (_path: string, options: RequestInit) => {
    if (options.method === "POST") {
      return Response.json({ review: { ...review, listing: { ...review.listing, version: 5, status: "facts_to_review" } } });
    }
    return Response.json({ review });
  });
  vi.stubGlobal("fetch", fetch);
  render(
    <LangContext.Provider value={{ lang: "en", prefix: "/en", t: (_fr, en) => en }}>
      <InitialListingAdminReview listingId={review.listing.id} brands={[]} onBack={() => {}} />
    </LangContext.Provider>,
  );
  expect(await screen.findByText("Version to review")).toBeVisible();
  expect(screen.getByText(/\$29.*no badge/i)).toBeVisible();
  expect(screen.getByText("Payment confirmed")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Request factual review" }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(JSON.parse(String(fetch.mock.calls[1][1].body))).toEqual({
    action: "requestFactualReview", id: review.listing.id, version: 4, productRevisionId: productRevision.id,
  });
  expect(await screen.findByText("Awaiting the publisher’s review")).toBeVisible();
});
