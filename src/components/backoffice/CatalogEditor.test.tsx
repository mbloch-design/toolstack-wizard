import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { fireEvent, render as testingRender, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({
  list: vi.fn(),
  detail: vi.fn(),
  save: vi.fn(),
  discard: vi.fn(),
  publish: vi.fn(),
}));
vi.mock("@/lib/backofficeCatalogApi", () => ({
  loadCatalogWorkspace: api.list,
  loadCatalogDetail: api.detail,
  saveCatalogDraft: api.save,
  discardCatalogDraft: api.discard,
  publishCatalogDrafts: api.publish,
}));
import { CatalogEditor } from "./CatalogEditor";
const tool = {
  id: "notion",
  slug: "notion",
  name: "Notion",
  category: "productivity",
  shortDescription: "Avant",
  shortDescriptionEn: "Before",
  longDescription: "Analyse",
  pros: ["Simple"],
  cons: [],
  useCases: [],
  verdict: { keepIf: ["Solo"], avoidIf: [], threshold: "Tester" },
  seo: { metaDescription: "Meta" },
  pricing: { free: "Gratuit", paid: "Payant" },
  pricing_v5: {
    plans: [
      {
        planKey: "pro",
        displayName: "Pro",
        isFree: false,
        isComparePlan: true,
        nativeAmount: 12,
        nativeCurrency: "USD",
        billingPeriod: "monthly",
        detailsSourceUrl: "https://example.com/pricing",
      },
    ],
  },
  research: { untouched: true },
};
const summary = {
  slug: "notion",
  name: "Notion",
  version: 1,
  updatedAt: "2026-10-26T12:00:00Z",
  fields: ["shortDescription"],
};
const workspace = {
  revision: 0,
  tools: [
    { slug: "notion", name: "Notion", category: "productivity", draft: null },
  ],
  drafts: [],
  total: 1,
  page: 1,
  pageSize: 25,
  headSha: "a".repeat(40),
};
const detail = {
  tool,
  published: tool,
  baseHash: "b".repeat(64),
  version: 0,
  draft: null,
  conflict: false,
};
beforeEach(() => {
  vi.resetAllMocks();
  api.list.mockResolvedValue(workspace);
  api.detail.mockResolvedValue(detail);
  api.save.mockImplementation(async (input) => ({
    ...detail,
    tool: input.value,
    version: 1,
    draft: summary,
  }));
  api.publish.mockResolvedValue({
    commitSha: "c".repeat(40),
    commitUrl:
      "https://github.com/mbloch-design/toolstack-wizard/commit/" +
      "c".repeat(40),
    published: 2,
    cleanupPending: false,
  });
});
it("edits through a form, preserves unknown data, saves without publishing and previews local changes", async () => {
  render(<CatalogEditor />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Modifier Notion" }),
  );
  const field = await screen.findByLabelText("Description courte");
  fireEvent.change(field, { target: { value: "Après" } });
  fireEvent.click(screen.getByRole("button", { name: "Aperçu" }));
  expect(screen.getByTestId("catalog-preview")).toHaveTextContent("Après");
  expect(api.publish).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Revenir à l’édition" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Enregistrer le brouillon" }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Brouillon enregistré",
  );
  expect(api.save).toHaveBeenCalledWith({
    slug: "notion",
    version: 0,
    baseHash: detail.baseHash,
    value: { ...tool, shortDescription: "Après" },
  });
  expect(api.publish).not.toHaveBeenCalled();
});
it("reviews all saved drafts and publishes the reviewed global revision once", async () => {
  api.list.mockResolvedValue({
    ...workspace,
    revision: 5,
    drafts: [summary, { ...summary, slug: "figma", name: "Figma" }],
  });
  render(<CatalogEditor />);
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Publier toutes les modifications (2)",
    }),
  );
  expect(
    screen.getByRole("button", {
      name: "Publier toutes les modifications (2)",
    }),
  ).toHaveAttribute("data-variant", "primary");
  const review = screen.getByRole("region", {
    name: "Modifications à publier",
  });
  expect(within(review).getByText("Notion")).toBeVisible();
  expect(within(review).getByText("Figma")).toBeVisible();
  expect(api.publish).not.toHaveBeenCalled();
  fireEvent.click(
    within(review).getByRole("button", {
      name: "Confirmer la publication de 2 fiches",
    }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent("Commit envoyé");
  expect(api.publish).toHaveBeenCalledTimes(1);
  expect(api.publish).toHaveBeenCalledWith(5);
});
it("keeps form text on save conflict and offers reload without silently overwriting", async () => {
  api.save.mockRejectedValue({ status: 409, code: "CATALOG_DRAFT_CONFLICT" });
  render(<CatalogEditor />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Modifier Notion" }),
  );
  fireEvent.change(await screen.findByLabelText("Description courte"), {
    target: { value: "Mon texte" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Enregistrer le brouillon" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("modifié");
  expect(screen.getByLabelText("Description courte")).toHaveValue("Mon texte");
  expect(api.publish).not.toHaveBeenCalled();
});
it("blocks switching tools until unsaved edits are resolved and does not label failed requests as empty catalogue", async () => {
  api.list.mockResolvedValue({
    ...workspace,
    tools: [
      ...workspace.tools,
      { slug: "figma", name: "Figma", category: "design", draft: null },
    ],
    total: 2,
  });
  render(<CatalogEditor />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Modifier Notion" }),
  );
  fireEvent.change(await screen.findByLabelText("Description courte"), {
    target: { value: "Non enregistré" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Modifier Figma" }));
  expect(screen.getByRole("alert")).toHaveTextContent("enregistrées");
  expect(api.detail).toHaveBeenCalledTimes(1);
});
it("shows explicit provider activation failure", async () => {
  api.list.mockRejectedValue({
    status: 503,
    code: "CATALOG_GITHUB_UNCONFIGURED",
  });
  render(<CatalogEditor />);
  expect(await screen.findByRole("alert")).toHaveTextContent("GitHub");
  expect(screen.queryByText("Aucune fiche trouvée.")).not.toBeInTheDocument();
});
it("renders nested price fields without JSON and retains zero amounts", async () => {
  render(<CatalogEditor />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Modifier Notion" }),
  );
  await screen.findByLabelText("Description courte");
  fireEvent.click(screen.getByRole("button", { name: "Prix" }));
  fireEvent.change(screen.getByLabelText("Montant natif"), {
    target: { value: "0" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Enregistrer le brouillon" }),
  );
  await screen.findByRole("status");
  expect(api.save.mock.calls[0][0].value.pricing_v5.plans[0].nativeAmount).toBe(
    0,
  );
});
it("freezes editable fields while a save is pending so newer input cannot be overwritten", async () => {
  let complete!: (value: unknown) => void;
  api.save.mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  render(<CatalogEditor />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Modifier Notion" }),
  );
  fireEvent.change(await screen.findByLabelText("Description courte"), {
    target: { value: "Envoyé" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Enregistrer le brouillon" }),
  );
  expect(screen.getByLabelText("Description courte")).toBeDisabled();
  complete({
    ...detail,
    tool: { ...tool, shortDescription: "Envoyé" },
    version: 1,
    draft: summary,
  });
  await screen.findByRole("status");
  expect(screen.getByLabelText("Description courte")).toBeEnabled();
});
it("preserves unsupported nested fields visibly read-only instead of offering edits that the server rejects", async () => {
  api.detail.mockResolvedValue({
    ...detail,
    tool: { ...tool, seo: { ...tool.seo, aiAngle: "Contexte IA existant" } },
  });
  render(<CatalogEditor />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Modifier Notion" }),
  );
  await screen.findByLabelText("Description courte");
  fireEvent.click(screen.getByRole("button", { name: "SEO" }));
  expect(screen.getByText("Contexte IA existant")).toBeVisible();
  expect(screen.getByText(/Lecture seule/)).toBeVisible();
  expect(screen.queryByLabelText("ai Angle")).not.toBeInTheDocument();
});

function render(ui: ReactNode) { return testingRender(<MemoryRouter>{ui}</MemoryRouter>); }
