import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({
  list: vi.fn(),
  detail: vi.fn(),
  save: vi.fn(),
  publish: vi.fn(),
  discard: vi.fn(),
}));
vi.mock("@/lib/backofficeCatalogApi", () => ({
  loadCatalogWorkspace: api.list,
  loadCatalogDetail: api.detail,
  saveCatalogDraft: api.save,
  discardCatalogDraft: api.discard,
  publishCatalogDrafts: api.publish,
}));
vi.mock("@/hooks/useSupabaseData", async original => ({
  ...(await original<typeof import("@/hooks/useSupabaseData")>()),
  useToolSummaries: () => ({ tools: [], loading: false }),
  useCategories: () => ({ categories: [{ id: "productivity", slug: "productivity", name: "Productivité", nameEn: "Productivity", tools: [] }], loading: false }),
}));
import { CatalogEditor } from "./CatalogEditor";
import { catalogCapabilities } from "@/lib/catalogPolicy";
const tool = {
  id: "notion",
  slug: "notion",
  name: "Notion",
  category: "productivity",
  shortDescription: "Avant",
};
const caps = catalogCapabilities({ isAdmin: true });
const detail = {
  tool,
  published: tool,
  version: 0,
  baseHash: "hash",
  draft: null,
  conflict: false,
  capabilities: caps,
};
beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState({}, "", "/fr/back-office");
  api.list.mockResolvedValue({
    revision: 0,
    tools: [{ ...tool, draft: null }],
    drafts: [],
    total: 1,
    page: 1,
    pageSize: 25,
    headSha: "head",
    capabilities: caps,
  });
  api.detail.mockResolvedValue(detail);
});
it("makes the complete direct editor the primary record entry", async () => {
  render(<CatalogEditor />);
  expect(
    await screen.findByRole("button", { name: "Édition directe · Notion" }),
  ).toBeVisible();
});

it("ignores a detail response after the account workspace unmounts", async () => {
  window.history.replaceState({}, "", "/fr/back-office?view=catalog&tool=notion&editor=inline");
  let resolve!: (value: typeof detail) => void;
  api.detail.mockReturnValue(new Promise(r => { resolve = r; }));
  const session = new CatalogDraftSession(api.save);
  const mounted = render(<CatalogEditor session={session} />);
  await act(async () => {});
  mounted.unmount();
  await act(async () => resolve(detail));
  expect(session.get("notion")).toBeUndefined();
});

import { MemoryRouter } from "react-router-dom";
import { CatalogDraftSession } from "./catalogDraftSession";
import { afterEach } from "vitest";
afterEach(() => vi.useRealTimers());
const draft = (slug: string, name = slug) => ({
  slug,
  name,
  version: 1,
  updatedAt: "now",
  fields: ["shortDescription"],
});
it("opens saved raw data from the deep URL and denies absent capabilities", async () => {
  window.history.replaceState(
    {},
    "",
    "/fr/back-office?view=catalog&tool=notion&editor=inline",
  );
  api.detail.mockResolvedValue({
    ...detail,
    tool: { ...tool, shortDescription: "Persisted draft" },
    draft: draft("notion"),
    capabilities: undefined,
  });
  render(
    <MemoryRouter>
      <CatalogEditor />
    </MemoryRouter>,
  );
  const field = await screen.findByLabelText("Description courte · français");
  expect(field).toHaveValue("Persisted draft");
  expect(field).toBeDisabled();
  expect(
    screen
      .getAllByRole("alert")
      .some((e) => e.textContent?.includes("ne permet pas")),
  ).toBe(true);
});
it("flushes pending edits before reviewing every global draft outside the filtered list", async () => {
  const session = new CatalogDraftSession(api.save);
  session.adopt(detail);
  session.change("notion", [{ path: ["shortDescription"], value: "Latest" }]);
  const drafts = [draft("notion", "Notion"), draft("figma", "Figma")];
  api.save.mockImplementation(async (input) => ({
    ...detail,
    tool: input.value,
    version: 1,
    draft: drafts[0],
  }));
  api.list.mockImplementation(async () => ({
    revision: 5,
    tools: [tool],
    drafts,
    total: 1,
    page: 1,
    pageSize: 25,
    headSha: "h",
    capabilities: caps,
  }));
  api.detail.mockImplementation(async (slug) => ({
    ...detail,
    tool: { ...tool, slug, name: slug === "notion" ? "Notion" : "Figma" },
    published: { ...tool, slug, name: slug === "notion" ? "Notion" : "Figma" },
    version: 1,
    draft: draft(slug),
  }));
  render(<CatalogEditor session={session} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Mettre en ligne (2)" }),
  );
  const review = await screen.findByRole("region", {
    name: "Modifications à publier",
  });
  expect(within(review).getByText("Notion")).toBeVisible();
  expect(within(review).getByText("Figma")).toBeVisible();
  expect(api.save.mock.calls[0][0].value.shortDescription).toBe("Latest");
  expect(api.publish).not.toHaveBeenCalled();
  fireEvent.click(
    within(review).getByRole("button", {
      name: "Confirmer la publication de 2 fiches",
    }),
  );
  await act(async () => {});
  expect(api.publish).toHaveBeenCalledWith(5);
});
it("requires a new review when the workspace revision changes and never sends a subset", async () => {
  let revision = 5;
  const d = draft("notion", "Notion");
  api.list.mockImplementation(async () => ({
    revision,
    tools: [tool],
    drafts: [d],
    total: 1,
    page: 1,
    pageSize: 25,
    headSha: "h",
    capabilities: caps,
  }));
  api.detail.mockResolvedValue({ ...detail, version: 1, draft: d });
  render(<CatalogEditor />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Mettre en ligne (1)" }),
  );
  const review = await screen.findByRole("region", {
    name: "Modifications à publier",
  });
  revision = 6;
  fireEvent.click(
    within(review).getByRole("button", {
      name: "Confirmer la publication de 1 fiches",
    }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("modifié");
  expect(api.publish).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("region", { name: "Modifications à publier" }),
  ).toBeNull();
});
it("keeps the global publish action available after an autosave without refetching the list", async () => {
  const session = new CatalogDraftSession(api.save);
  session.adopt(detail);
  render(<CatalogEditor session={session} />);
  await screen.findByRole("button", { name: "Édition directe · Notion" });
  const requests = api.list.mock.calls.length;
  api.save.mockResolvedValue({
    ...detail,
    tool: { ...tool, name: "Saved" },
    version: 1,
    draft: draft("notion", "Saved"),
  });
  await act(async () => {
    session.change("notion", [{ path: ["name"], value: "Saved" }]);
    await session.flush();
  });
  expect(
    screen.getByRole("button", { name: "Mettre en ligne (1)" }),
  ).toBeEnabled();
  expect(api.list).toHaveBeenCalledTimes(requests);
});
it("shows the before and after values of grouped changes in the global review", async () => {
  const d = draft("notion", "Notion");
  api.list.mockResolvedValue({
    revision: 2,
    tools: [tool],
    drafts: [d],
    total: 1,
    page: 1,
    pageSize: 25,
    headSha: "h",
    capabilities: caps,
  });
  api.detail.mockResolvedValue({
    ...detail,
    tool: { ...tool, shortDescription: "New editorial text" },
    version: 1,
    draft: d,
  });
  render(<CatalogEditor />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Mettre en ligne (1)" }),
  );
  const review = await screen.findByRole("region", {
    name: "Modifications à publier",
  });
  expect(within(review).getByText("New editorial text")).toBeInTheDocument();
  expect(within(review).getByText("Avant")).toBeInTheDocument();
});

it("retains the publication receipt and a usable list/deep-link retry after detail refresh fails", async () => {
  window.history.replaceState({}, "", "/fr/back-office?view=catalog&tool=notion&editor=inline");
  let published = false;
  let rejectRefresh = true;
  const edited = { ...tool, shortDescription: "Published copy" };
  api.list.mockImplementation(async () => ({
    revision: published ? 3 : 2, tools: [tool], drafts: published ? [] : [draft("notion", "Notion")],
    total: 1, page: 1, pageSize: 25, headSha: "h", capabilities: caps,
  }));
  api.detail.mockImplementation(async () => {
    if (published && rejectRefresh) { rejectRefresh = false; throw { status: 503 }; }
    return { ...detail, tool: edited, published: published ? edited : tool,
      version: published ? 0 : 1, draft: published ? null : draft("notion", "Notion") };
  });
  api.publish.mockImplementation(async () => {
    published = true;
    return { commitSha: "abc123", commitUrl: "https://example.test/commit/abc123", published: 1, cleanupPending: false };
  });
  render(<MemoryRouter><CatalogEditor /></MemoryRouter>);
  await screen.findByLabelText("Description courte · français");
  fireEvent.click(screen.getByRole("button", { name: "Mettre en ligne (1)" }));
  const review = await screen.findByRole("region", { name: "Modifications à publier" });
  fireEvent.click(within(review).getByRole("button", { name: "Confirmer la publication de 1 fiches" }));
  expect(await screen.findByRole("link", { name: /Voir le commit/ })).toHaveAttribute("href", "https://example.test/commit/abc123");
  const retry = await screen.findByRole("button", { name: "Édition directe · Notion" });
  expect(new URLSearchParams(window.location.search).has("tool")).toBe(false);
  expect(screen.getByRole("alert")).toHaveTextContent("fiche");
  fireEvent.click(retry);
  expect(await screen.findByLabelText("Description courte · français")).toHaveValue("Published copy");
  expect(new URLSearchParams(window.location.search).get("tool")).toBe("notion");
  fireEvent.click(screen.getByRole("button", { name: "Retour aux fiches" }));
  expect(await screen.findByRole("button", { name: "Édition directe · Notion" })).toBeVisible();
});

it("preserves the searched draft-only page when global review is cancelled", async () => {
  const drafts = [draft("notion", "Notion"), draft("figma", "Figma")];
  api.list.mockImplementation(async params => ({
    revision: 2, drafts, total: 2, pageSize: 1, headSha: "h", capabilities: caps,
    page: params?.page ?? 1,
    tools: params ? [{ ...tool, name: params.page === 2 ? "Notion page two" : "Notion" }]
      : [tool, { ...tool, slug: "figma", name: "Figma" }],
  }));
  api.detail.mockImplementation(async slug => ({ ...detail,
    tool: { ...tool, slug }, published: { ...tool, slug }, version: 1, draft: draft(slug),
  }));
  render(<CatalogEditor />);
  const search = await screen.findByRole("searchbox", { name: "Rechercher une fiche" });
  fireEvent.change(search, { target: { value: "Notion" } });
  fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Brouillons uniquement" }));
  fireEvent.click(await screen.findByRole("button", { name: "Suivante" }));
  await screen.findByText("2 fiches · Page 2");
  fireEvent.click(screen.getByRole("button", { name: "Mettre en ligne (2)" }));
  const review = await screen.findByRole("region", { name: "Modifications à publier" });
  expect(within(review).getByText("Figma")).toBeVisible();
  fireEvent.click(within(review).getByRole("button", { name: "Annuler" }));
  expect(screen.getByRole("searchbox")).toHaveValue("Notion");
  expect(screen.getByRole("checkbox", { name: "Brouillons uniquement" })).toBeChecked();
  expect(screen.getByText("2 fiches · Page 2")).toBeVisible();
  expect(screen.getByRole("button", { name: "Édition directe · Notion page two" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Édition directe · Figma" })).toBeNull();
});

it("confirms deletion of the reviewed saved draft and allows cancellation", async () => {
  window.history.replaceState({}, "", "/fr/back-office?view=catalog&tool=notion&editor=inline");
  api.detail.mockResolvedValue({ ...detail, version: 4, draft: draft("notion", "Notion") });
  api.discard.mockResolvedValue(undefined);
  render(<MemoryRouter><CatalogEditor /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "Supprimer ce brouillon" }));
  expect(api.discard).not.toHaveBeenCalled();
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText(/Notion/)).toBeVisible();
  fireEvent.click(within(dialog).getByRole("button", { name: "Annuler" }));
  expect(api.discard).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Supprimer ce brouillon" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmer la suppression" }));
  expect(api.discard).toHaveBeenCalledTimes(1);
  expect(api.discard).toHaveBeenCalledWith("notion", 4);
});
it.each([{ status: 409 }, new Error("network")])("retains the visible saved draft when deletion fails: %s", async (failure) => {
  window.history.replaceState({}, "", "/fr/back-office?view=catalog&tool=notion&editor=inline");
  api.detail.mockResolvedValue({ ...detail, tool: { ...tool, shortDescription: "Saved text" }, version: 4, draft: draft("notion") });
  api.discard.mockRejectedValue(failure);
  render(<MemoryRouter><CatalogEditor /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "Supprimer ce brouillon" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmer la suppression" }));
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(screen.getAllByText("Saved text").some(element => element.isConnected)).toBe(true);
  expect(api.discard).toHaveBeenCalledTimes(1);
  expect(api.detail).toHaveBeenCalledTimes(1);
});
