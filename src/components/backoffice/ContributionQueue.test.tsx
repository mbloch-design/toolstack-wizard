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

it("shows and publishes a batch containing only ToolTrim and commercial revisions", async () => {
  const fetch = vi.fn(async (url: string) => {
    const mode = new URL(url, "http://localhost").searchParams.get("mode");
    if (mode === "release-preview") return Response.json({
      manifest: { sourceHead: "a".repeat(40), items: [], legacyItems: [],
        editorialItems: [{ approvalId: "editorial-1", toolId: "tool-1", name: "Example", version: 3 }],
        commercialItems: [{ approvalId: "commercial-1", toolId: "tool-1", name: "Example", version: 2, offer: "priority_paid" }],
      }, canDeliver: true, batchKey: "b".repeat(64), blocked: [],
    });
    if (mode === "publish-release") return Response.json({
      release: { commit_sha: "c".repeat(40), verified_at: null }, cleanupPending: false,
    });
    return Response.json({ submissions: [] });
  });
  vi.stubGlobal("fetch", fetch);
  render(<ContributionQueue onBack={() => {}} />);
  fireEvent.click(await screen.findByRole("button", { name: "Vérifier le lot approuvé" }));
  expect(await screen.findByText("Example · Analyse et paramètres ToolTrim · Version 3")).toBeVisible();
  expect(screen.getByText("Example · Offre prioritaire sans badge · Version 2")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Publier le lot complet" }));
  expect(await screen.findByText("Commit créé. Mise en ligne à vérifier.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Vérifier la mise en ligne" })).toBeVisible();
});
