import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ContributionQueue } from "./ContributionQueue";

vi.mock("@/hooks/useLang", () => {
  const t = (fr: string) => fr;
  return { useLang: () => ({ lang: "fr", t }) };
});
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "fixture" } } }) } },
}));

afterEach(() => vi.unstubAllGlobals());

it("lets ToolTrim examine a sealed proposal and request a correction with a note", async () => {
  const row = { id: "proposal", toolId: "tool-id", name: "Tool", version: 2, status: "submitted", submittedAt: "2026-11-17T09:00:00Z" };
  const locale = { shortDescription: "Fait dans le brouillon", productDescription: null, features: [], useCases: [] };
  const json = (value: unknown) => ({ ok: true, json: async () => value });
  const fetch = vi.fn()
    .mockResolvedValueOnce(json({ submissions: [row] }))
    .mockResolvedValueOnce(json({ submission: { ...row, value: {
      name: "Tool", websiteUrl: "https://example.org", localized: { fr: locale, en: { ...locale, shortDescription: null } },
      plans: [], media: [], integrations: [], classificationProposals: [],
    } } }))
    .mockResolvedValueOnce(json({ submission: { ...row, status: "changes_requested" } }))
    .mockResolvedValue(json({ submissions: [] }));
  vi.stubGlobal("fetch", fetch);

  render(<ContributionQueue onBack={() => {}} />);
  fireEvent.click(await screen.findByRole("button", { name: "Examiner" }));
  expect(await screen.findByText("Fait dans le brouillon")).toBeInTheDocument();
  const request = screen.getByRole("button", { name: "Demander des corrections" });
  expect(request).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Message à l’éditeur"), { target: { value: "Ajoutez la source du tarif." } });
  fireEvent.click(request);
  expect(await screen.findByText("Décision enregistrée.")).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith("/api/backoffice-contributions?id=proposal", expect.objectContaining({
    method: "POST",
    body: JSON.stringify({ status: "changes_requested", note: "Ajoutez la source du tarif." }),
  }));
});
