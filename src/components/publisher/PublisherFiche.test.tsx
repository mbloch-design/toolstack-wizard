import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LangContext } from "@/hooks/useLang";
import type { ProductDraft } from "@/lib/publisherCatalog";
import PublisherFiche from "./PublisherFiche";

it("edits and saves just the factual draft in place, with a visible confirmation", async () => {
  const language = { shortDescription: null, productDescription: null, features: [], useCases: [] };
  const value: ProductDraft = {
    schemaVersion: 1, name: "Example", websiteUrl: "https://example.com", localized: { fr: language, en: language },
    plans: [], media: [], classificationProposals: [], integrations: [],
  };
  const save = vi.fn(async (next: ProductDraft) => next);
  render(
    <MemoryRouter>
      <LangContext.Provider value={{ lang: "en", prefix: "/en", t: (_fr, en) => en }}>
        <PublisherFiche value={value} canEdit onSave={save} />
      </LangContext.Provider>
    </MemoryRouter>,
  );
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Edit overview" }));
  fireEvent.change(await screen.findByRole("textbox", { name: "Product description" }), { target: { value: "An example for small teams." } });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith({ ...value, localized: { fr: language, en: { ...language, productDescription: "An example for small teams." } } }));
  expect(await screen.findByText("An example for small teams.")).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Draft saved.");
  expect(screen.queryByRole("textbox", { name: /verdict|rating/i })).not.toBeInTheDocument();
});
