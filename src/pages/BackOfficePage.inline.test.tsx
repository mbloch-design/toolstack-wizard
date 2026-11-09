import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { StackAccountProvider } from "@/hooks/useStackAccount";
import { catalogCapabilities } from "@/lib/catalogPolicy";
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
  list: vi.fn(),
  catalog: vi.fn(),
  detail: vi.fn(),
  save: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signOut: mocks.signOut,
    },
  },
}));
vi.mock("@/lib/backofficeAccountsApi", () => ({
  loadAccountsDashboard: mocks.list,
  loadAccountDetail: vi.fn(),
}));
vi.mock("@/lib/backofficeCatalogApi", () => ({
  loadCatalogWorkspace: mocks.catalog,
  loadCatalogDetail: mocks.detail,
  saveCatalogDraft: mocks.save,
  discardCatalogDraft: vi.fn(),
  publishCatalogDrafts: vi.fn(),
}));
vi.mock("@/hooks/useSupabaseData", async original => ({
  ...(await original<typeof import("@/hooks/useSupabaseData")>()),
  useToolSummaries: () => ({ tools: [], loading: false }),
  useCategories: () => ({ categories: [{ id: "productivity", slug: "productivity", name: "Productivité", nameEn: "Productivity", tools: [] }], loading: false }),
}));
import BackOfficePage from "./BackOfficePage";
const auth = (id = "one", token = "first") => ({
  access_token: token,
  user: { id, email: `${id}@example.test` },
});
const tool = {
  id: "notion",
  slug: "notion",
  name: "Notion",
  category: "productivity",
  shortDescription: "Before",
};
let notify: (event: string, session: ReturnType<typeof auth> | null) => void;
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.stubGlobal("localStorage", window.sessionStorage);
  window.history.replaceState(
    {},
    "",
    "/fr/back-office?view=catalog&tool=notion&editor=inline",
  );
  mocks.getSession.mockResolvedValue({ data: { session: auth() } });
  mocks.onAuthStateChange.mockImplementation((cb) => {
    notify = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  mocks.list.mockResolvedValue({
    totals: { accounts: 1, accountsWithStack: 0, nonemptyStacks: 0 },
    topTools: [],
    accounts: [],
    page: 1,
    pageSize: 25,
    total: 1,
    updatedAt: "",
  });
  mocks.catalog.mockResolvedValue({
    revision: 0,
    tools: [tool],
    drafts: [],
    total: 1,
    page: 1,
    pageSize: 25,
    headSha: "head",
    capabilities: catalogCapabilities({ isAdmin: true }),
  });
  mocks.detail.mockResolvedValue({
    tool,
    published: tool,
    version: 0,
    baseHash: "hash",
    draft: null,
    conflict: false,
    capabilities: catalogCapabilities({ isAdmin: true }),
  });
  mocks.signOut.mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
async function mount() {
  render(
    <MemoryRouter initialEntries={[`${window.location.pathname}${window.location.search}`]}>
      <StackAccountProvider enabled={false}>
        <BackOfficePage />
      </StackAccountProvider>
    </MemoryRouter>,
  );
  await act(async () => {});
  return screen.getByLabelText("Description courte · français");
}
it("opens the actual deep-linked fiche and keeps focused pending input on TOKEN_REFRESHED", async () => {
  const field = await mount();
  fireEvent.change(field, { target: { value: "Pending text" } });
  await act(async () => notify("TOKEN_REFRESHED", auth("one", "renewed")));
  expect(screen.getByLabelText("Description courte · français")).toBe(field);
  expect(field).toHaveValue("Pending text");
});
it("recovers only the same user in memory through expiry and clears when another user logs in", async () => {
  mocks.save.mockImplementation(async input => ({
    tool: input.value, published: tool, version: 1, baseHash: "hash",
    draft: { slug: "notion", name: "Notion", version: 1, updatedAt: "now", fields: ["shortDescription"] },
    conflict: false, capabilities: catalogCapabilities({ isAdmin: true }),
  }));
  const field = await mount();
  fireEvent.change(field, { target: { value: "Private text" } });
  await act(async () => notify("SIGNED_OUT", null));
  expect(screen.queryByLabelText("Description courte · français")).toBeNull();
  await act(async () => notify("SIGNED_IN", auth()));
  expect(screen.getByLabelText("Description courte · français")).toHaveValue(
    "Private text",
  );
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(mocks.save).toHaveBeenCalledOnce();
  expect(mocks.save.mock.calls[0][0].value.shortDescription).toBe("Private text");
  await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
  expect(mocks.save).toHaveBeenCalledOnce();
  await act(async () => notify("SIGNED_OUT", null));
  await act(async () => notify("SIGNED_IN", auth("two")));
  expect(screen.getByLabelText("Description courte · français")).toHaveValue(
    "Before",
  );
});
it("guards explicit signout and deletes recovery after confirmed discard", async () => {
  const field = await mount();
  fireEvent.change(field, { target: { value: "Discarded" } });
  fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
  expect(mocks.signOut).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Me déconnecter sans enregistrer" }),
  );
  await act(async () => {});
  await act(async () => notify("SIGNED_IN", auth()));
  expect(screen.getByLabelText("Description courte · français")).toHaveValue(
    "Before",
  );
});
it("offers same-account reauthentication after API expiry without losing unsaved input", async () => {
  mocks.save.mockRejectedValue({ status: 401 });
  const field = await mount();
  fireEvent.change(field, { target: { value: "Recover me" } });
  fireEvent.click(screen.getByRole("button", { name: "Retour aux fiches" }));
  await act(async () => {});
  expect(screen.queryByText("Me reconnecter")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Me reconnecter"));
  expect(
    screen.getByRole("form", { name: "Connexion administrateur" }),
  ).toBeInTheDocument();
  await act(async () => notify("SIGNED_IN", auth()));
  expect(screen.getByLabelText("Description courte · français")).toHaveValue(
    "Recover me",
  );
});
