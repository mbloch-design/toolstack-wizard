import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { normalizePersonalStack } from "@/lib/personalStack";
const mocks = vi.hoisted(() => ({ list: vi.fn(), detail: vi.fn() }));
vi.mock("@/lib/backofficeAccountsApi", () => ({
  loadAccountsDashboard: mocks.list,
  loadAccountDetail: mocks.detail,
}));
import { AccountsDashboard } from "./AccountsDashboard";
const at = "2026-10-25T08:00:00Z";
const account = {
  userId: "id",
  displayName: "Camille",
  email: "camille@example.test",
  createdAt: at,
  hasStack: true,
  stackUpdatedAt: at,
  insights: {
    usedTools: 1,
    wishlistTools: 1,
    boards: 8,
    trade: "designer",
    hasDailyRate: true,
    amounts: 1,
    usage: 1,
    decisions: 0,
  },
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.list.mockResolvedValue({
    totals: { accounts: 30, accountsWithStack: 18, nonemptyStacks: 12 },
    topTools: [{ toolSlug: "tapstitch", usedAccounts: 8, wishlistAccounts: 3 }],
    accounts: [account],
    page: 1,
    pageSize: 25,
    total: 30,
    updatedAt: at,
  });
});
it("opens on a global overview with user drill-down and explicit analytics availability", async () => {
  render(<AccountsDashboard initialView="overview" />);
  expect(
    await screen.findByRole("heading", { name: "Vue d’ensemble" }),
  ).toBeVisible();
  expect(await screen.findByTestId("accounts-total")).toHaveTextContent("30");
  fireEvent.click(screen.getByRole("button", { name: "Utilisateurs" }));
  expect(
    await screen.findByRole("table", { name: "Comptes enregistrés" }),
  ).toBeVisible();
  expect(screen.getByText("Designer")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Usage du site" }));
  expect(screen.getByText("Reporting GA4 non connecté")).toBeVisible();
  expect(screen.queryByText(/visiteurs aujourd’hui/)).not.toBeInTheDocument();
});
it("presents context, usage, declared budget and board contents without reading JSON", async () => {
  const state = normalizePersonalStack({
    version: 4,
    selection: {
      version: 3,
      needs: [],
      pinnedToolSlugs: ["tapstitch"],
      toolEntries: [
        {
          toolSlug: "tapstitch",
          needIds: ["design"],
          intent: "stack",
          assignmentMode: "manual",
          addedAt: at,
        },
      ],
    },
    billing: {
      paid: ["tapstitch"],
      reviewed: ["tapstitch"],
      choices: {
        tapstitch: {
          source: "custom",
          amount: 0,
          currency: "USD",
          period: "annual",
          seats: 2,
          perSeat: true,
        },
      },
    },
    decisions: {},
    trade: "designer",
    dailyRate: { amount: 450, currency: "EUR" },
    usage: { tapstitch: 4 },
  });
  mocks.detail.mockResolvedValue({
    ...account,
    avatarUrl: null,
    providerLocale: null,
    oauthProfileSource: null,
    identity: { lastSignInAt: at, emailConfirmedAt: at, locale: "fr" },
    stack: { state, revision: 3, updatedAt: at },
  });
  render(<AccountsDashboard />);
  await screen.findByText("Camille");
  fireEvent.click(
    screen.getByRole("button", {
      name: "Voir la stack de camille@example.test",
    }),
  );
  const detail = await screen.findByRole("region", {
    name: "Détail du compte",
  });
  expect(await within(detail).findByText("450 EUR / jour")).toBeVisible();
  fireEvent.click(within(detail).getByRole("tab", { name: "Usage déclaré" }));
  expect(within(detail).getByText("Usage soutenu")).toBeVisible();
  expect(within(detail).getByText("4 / 5")).toBeVisible();
  fireEvent.click(within(detail).getByRole("tab", { name: "Budget déclaré" }));
  expect(within(detail).getByText(/0 USD \/ an/)).toBeVisible();
  fireEvent.click(within(detail).getByRole("tab", { name: "Tableaux" }));
  expect(
    within(detail).getByRole("heading", { name: /Créer des visuels/ }),
  ).toBeVisible();
  fireEvent.click(within(detail).getByRole("tab", { name: "Décisions" }));
  expect(
    within(detail).getByText("Aucune décision enregistrée."),
  ).toBeVisible();
});
it("keeps search when switching views and does not reinterpret a filtered page as recent registrations", async () => {
  render(<AccountsDashboard />);
  await screen.findByText("Camille");
  fireEvent.change(
    screen.getByRole("searchbox", { name: "Chercher un compte" }),
    { target: { value: "Camille" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));
  await screen.findByText("Camille");
  fireEvent.click(screen.getByRole("button", { name: "Vue d’ensemble" }));
  expect(await screen.findByText("Inscriptions récentes")).toBeVisible();
  expect(mocks.list).toHaveBeenCalledWith({
    search: "",
    page: 1,
    pageSize: 25,
    includeInsights: true,
  });
  fireEvent.click(screen.getByRole("button", { name: "Utilisateurs" }));
  expect(
    screen.getByRole("searchbox", { name: "Chercher un compte" }),
  ).toHaveValue("Camille");
});
it("shows one visible access denial on overview without a duplicate hidden alert", async () => {
  mocks.list.mockRejectedValue({ status: 403 });
  render(<AccountsDashboard initialView="overview" />);
  expect(await screen.findAllByRole("alert")).toHaveLength(1);
  expect(screen.getByRole("alert")).toHaveTextContent("Accès réservé");
});
it("keeps account identity fields readable even before a first stack save", async () => {
  mocks.detail.mockResolvedValue({
    ...account,
    avatarUrl: null,
    providerLocale: null,
    oauthProfileSource: null,
    identity: { lastSignInAt: at, emailConfirmedAt: at, locale: "fr" },
    stack: null,
  });
  render(<AccountsDashboard />);
  await screen.findByText("Camille");
  fireEvent.click(
    screen.getByRole("button", {
      name: "Voir la stack de camille@example.test",
    }),
  );
  const detail = await screen.findByRole("region", {
    name: "Détail du compte",
  });
  expect(
    await within(detail).findByText("Aucune stack enregistrée."),
  ).toBeVisible();
  expect(within(detail).getByText("Langue du profil")).toBeVisible();
  expect(within(detail).getByText("fr")).toBeVisible();
  expect(within(detail).getByText("E-mail confirmé le")).toBeVisible();
});
