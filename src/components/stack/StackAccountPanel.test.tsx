import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StackAccountContext } from "@/hooks/useStackAccount";
import { LangContext } from "@/hooks/useLang";
import { normalizePersonalStack } from "@/lib/personalStack";
import { pinToolInState } from "@/lib/stackState";
import StackAccountPanel from "./StackAccountPanel";

let account: StackAccountContext;
const openAuth = vi.fn();
vi.mock("@/components/account/AccountExperienceProvider", () => ({
  useAccountExperience: () => ({ openAuth }),
}));
vi.mock("@/hooks/useStackAccount", () => ({
  useStackAccount: () => account,
  getStackAccountLabel: (value: StackAccountContext["user"]) =>
    value?.user_metadata?.full_name || value?.email || null,
}));
const user = {
  id: "A",
  aud: "authenticated",
  role: "authenticated",
  email: "person@example.com",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-19T00:00:00Z",
};
function content(
  lang: "fr" | "en" = "fr",
  route = `/${lang}/ma-stack?outil=notion#ms-list`,
) {
  return (
    <MemoryRouter initialEntries={[route]}>
      <LangContext.Provider
        value={{
          lang,
          prefix: `/${lang}`,
          t: (fr, en) => (lang === "en" ? en : fr),
        }}
      >
        <StackAccountPanel />
      </LangContext.Provider>
    </MemoryRouter>
  );
}
function view(
  lang: "fr" | "en" = "fr",
  route = `/${lang}/ma-stack?outil=notion#ms-list`,
) {
  return render(content(lang, route));
}
async function click(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
}
beforeEach(() => {
  vi.useFakeTimers();
  account = {
    authBusy: false,
    recoveryStatus: "none",
    lastAuthMethod: null,
    signInWithProvider: vi.fn(),
    signInWithPassword: vi.fn(),
    signUpWithPassword: vi.fn(),
    resendConfirmation: vi.fn(),
    requestPasswordReset: vi.fn(),
    completePasswordReset: vi.fn(),
    getAccessToken: vi.fn().mockResolvedValue(null),
    enabled: true,
    user: null,
    syncStatus: "local",
    status: "local",
    error: null,
    pendingDraftChoice: null,
    conflict: null,
    magicLinkSentTo: null,
    hasUnsavedChanges: false,
    signOutNeedsConfirmation: false,
    deletionConfirmed: false,
    privacyWarning: null,
    signInWithGoogle: vi.fn().mockResolvedValue(true),
    sendEmailCode: vi.fn().mockResolvedValue(true),
    sendMagicLink: vi.fn().mockResolvedValue(true),
    verifyEmailCode: vi.fn().mockResolvedValue(true),
    loadSaved: vi.fn().mockResolvedValue(true),
    addDraft: vi.fn().mockResolvedValue(true),
    reloadLatest: vi.fn().mockResolvedValue(true),
    keepCurrent: vi.fn().mockResolvedValue(true),
    retry: vi.fn().mockResolvedValue(true),
    signOut: vi.fn().mockResolvedValue(true),
    deleteAccount: vi.fn().mockResolvedValue(false),
    clearLocalAccount: vi.fn().mockResolvedValue(true),
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("shared account stack panel", () => {
  it.each(["loadSaved", "addDraft"] as const)(
    "offers the two explicit draft choices and performs %s",
    async (action) => {
      const draft = normalizePersonalStack(null);
      draft.selection = pinToolInState(draft.selection, "draft-tool");
      const saved = {
        state: normalizePersonalStack(null),
        revision: 2,
        updatedAt: "2026-10-19T00:00:00Z",
      };
      account = {
        ...account,
        user,
        syncStatus: "choice",
        status: "choice",
        pendingDraftChoice: { draft, saved },
      };
      view();
      expect(
        screen.getByRole("button", { name: "Retrouver ma stack enregistrée" }),
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Ajouter ma nouvelle sélection" }),
      ).toBeVisible();
      await click(
        action === "loadSaved"
          ? "Retrouver ma stack enregistrée"
          : "Ajouter ma nouvelle sélection",
      );
      expect(account[action]).toHaveBeenCalledTimes(1);
    },
  );
  it.each(["reloadLatest", "keepCurrent"] as const)(
    "keeps revision conflicts distinct and performs %s",
    async (action) => {
      account = {
        ...account,
        user,
        syncStatus: "conflict",
        status: "conflict",
        conflict: { local: normalizePersonalStack(null), remote: null },
      };
      view("en");
      expect(
        screen.queryByRole("button", { name: "Add my new selection" }),
      ).not.toBeInTheDocument();
      await click(
        action === "reloadLatest"
          ? "Load the saved version"
          : "Save my current version",
      );
      expect(account[action]).toHaveBeenCalledTimes(1);
    },
  );

  it("opens the shared sign-in experience without a second public form", async () => {
    view();
    await click("Enregistrer ma stack");
    expect(openAuth).toHaveBeenCalledWith("signin");
    expect(screen.queryByLabelText("Adresse e-mail")).not.toBeInTheDocument();
    expect(screen.queryByText("Recevoir un code")).not.toBeInTheDocument();
  });
  it("links to settings rather than exposing destructive account controls", () => {
    account.user = user;
    account.syncStatus = "synced";
    view();
    expect(
      screen.getByRole("link", { name: "Paramètres du compte" }),
    ).toHaveAttribute("href", "/fr/compte/parametres");
    expect(
      screen.queryByRole("button", { name: "Supprimer mon compte" }),
    ).not.toBeInTheDocument();
  });
  it("remains hidden when disabled", () => {
    account.enabled = false;
    const { container } = view();
    expect(container).toBeEmptyDOMElement();
  });
  it("distinguishes unconfirmed remote deletion and permits explicit local cleanup", async () => {
    account.user = user;
    account.error = "ACCOUNT_DELETION_UNCONFIRMED";
    account.syncStatus = "session-expired";
    view();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "suppression n’a pas été confirmée",
    );
    await click("Effacer les données de cet appareil");
    expect(account.clearLocalAccount).toHaveBeenCalledTimes(1);
    expect(account.deleteAccount).not.toHaveBeenCalled();
  });
  it("offers retry without claiming an unavailable stack is saved", async () => {
    account.user = user;
    account.syncStatus = "error";
    view();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Sauvegarde indisponible",
    );
    await click("Réessayer l’enregistrement");
    expect(account.retry).toHaveBeenCalledTimes(1);
  });
});
