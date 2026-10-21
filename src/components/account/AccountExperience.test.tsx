import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { INITIAL_ACCOUNT_SNAPSHOT } from "@/lib/stackAccountCoordinator";
import type { StackAccountContext } from "@/hooks/useStackAccount";
import AccountAuthForm from "./AccountAuthForm";
let account: StackAccountContext;
vi.mock("@/hooks/useStackAccount", () => ({ useStackAccount: () => account }));
vi.mock("@/config/features", () => ({
  ACCOUNT_GOOGLE_ENABLED: true,
  ACCOUNT_GITHUB_ENABLED: true,
}));
beforeEach(() => {
  account = {
    ...INITIAL_ACCOUNT_SNAPSHOT,
    enabled: true,
    signInWithPassword: vi
      .fn()
      .mockResolvedValue({ ok: false, error: "ACCOUNT_INVALID_CREDENTIALS" }),
    signUpWithPassword: vi
      .fn()
      .mockResolvedValue({ ok: true, outcome: "confirmation-required" }),
    signInWithProvider: vi.fn(),
    requestPasswordReset: vi
      .fn()
      .mockResolvedValue({ ok: true, outcome: "email-sent" }),
    resendConfirmation: vi
      .fn()
      .mockResolvedValue({ ok: true, outcome: "email-sent" }),
  } as unknown as StackAccountContext;
});
afterEach(cleanup);
const view = (mode: "signin" | "signup" = "signin") =>
  render(
    <MemoryRouter>
      <AccountAuthForm
        mode={mode}
        onModeChange={vi.fn()}
        onAuthenticated={vi.fn()}
      />
    </MemoryRouter>,
  );
async function emailForm() {
  fireEvent.click(
    screen.getByRole("button", { name: "Continuer avec l’e-mail" }),
  );
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "person@example.test" },
  });
}
it("offers both providers and explicit email sign-in without implicit signup", async () => {
  view();
  expect(
    screen.getByRole("button", { name: "Continuer avec Google" }),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Continuer avec GitHub" }),
  ).toBeVisible();
  await emailForm();
  const password = screen.getByLabelText("Mot de passe");
  expect(password).toHaveAttribute("autocomplete", "current-password");
  expect(password).not.toHaveAttribute("minlength");
  fireEvent.change(password, { target: { value: "  old  " } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
  });
  expect(account.signInWithPassword).toHaveBeenCalledWith(
    "person@example.test",
    "  old  ",
    expect.any(Object),
  );
  expect(account.signUpWithPassword).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "E-mail ou mot de passe incorrect",
  );
});
it("requires eight characters only for a new password and shows confirmation", async () => {
  view("signup");
  await emailForm();
  const password = screen.getByLabelText("Mot de passe");
  expect(password).toHaveAttribute("autocomplete", "new-password");
  expect(password).toHaveAttribute("minlength", "8");
  fireEvent.change(password, { target: { value: "long password" } });
  fireEvent.click(
    screen.getByRole("button", { name: "Afficher le mot de passe" }),
  );
  expect(password).toHaveAttribute("type", "text");
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
  });
  expect(screen.getByText("Vérifiez votre e-mail")).toBeVisible();
  expect(screen.queryByLabelText("Mot de passe")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Renvoyer/ })).toBeDisabled();
});
it("respects shared busy state when the form mounts again", async () => {
  account.authBusy = true;
  view();
  expect(
    screen.getByRole("button", { name: "Continuer avec Google" }),
  ).toBeDisabled();
});
it("uses a neutral password reset response", async () => {
  view();
  await emailForm();
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Mot de passe oublié ?" }),
    );
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Envoyer le lien" }));
  });
  expect(screen.getByRole("status")).toHaveTextContent("Si cette adresse");
});

import AccountExperienceProvider, {
  useAccountExperience,
} from "./AccountExperienceProvider";
import { useLocation } from "react-router-dom";
import { normalizePersonalStack } from "@/lib/personalStack";
import AccountMenu from "./AccountMenu";
vi.mock("@/hooks/useAccountProfile", () => ({
  useAccountProfile: () => ({
    profile: null,
    status: "idle",
    error: null,
    saveDisplayName: vi.fn(),
    retry: vi.fn(),
  }),
}));
function Harness() {
  const experience = useAccountExperience();
  const location = useLocation();
  return (
    <>
      <AccountMenu />
      <button
        onClick={() =>
          experience.openAuth("signin", "/fr/tool/notion?plan=free#pricing")
        }
      >
        Open auth
      </button>
      <button onClick={experience.requestDeleteAccount}>Delete account</button>
      <button onClick={experience.requestSignOut}>Sign out action</button>
      <span data-testid="current-path">
        {location.pathname}
        {location.search}
        {location.hash}
      </span>
    </>
  );
}
const centralContent = () => (
  <MemoryRouter initialEntries={["/fr/tool/notion"]}>
    <AccountExperienceProvider>
      <Harness />
    </AccountExperienceProvider>
  </MemoryRouter>
);
const user = {
  id: "A",
  email: "a@example.test",
  aud: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-21T00:00:00Z",
};
it("clears passwords on close and restores the initiating focus", async () => {
  render(centralContent());
  const trigger = screen.getByRole("button", { name: "Open auth" });
  trigger.focus();
  fireEvent.click(trigger);
  await emailForm();
  fireEvent.change(screen.getByLabelText("Mot de passe"), {
    target: { value: "private password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
  await waitFor(() => expect(trigger).toHaveFocus());
  fireEvent.click(trigger);
  await emailForm();
  expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
});
it("keeps a global draft decision after auth from a tool page and waits for synchronization", async () => {
  const mounted = render(centralContent());
  fireEvent.click(screen.getByRole("button", { name: "Open auth" }));
  account = { ...account, user, syncStatus: "connecting" };
  mounted.rerender(centralContent());
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(screen.getByText("Vous êtes connecté.")).toBeVisible();
  const draft = normalizePersonalStack(null);
  account = {
    ...account,
    syncStatus: "choice",
    pendingDraftChoice: {
      draft,
      saved: { state: draft, revision: 2, updatedAt: "2026-10-21T00:00:00Z" },
    },
    loadSaved: vi.fn().mockResolvedValue(true),
    addDraft: vi.fn().mockResolvedValue(true),
  };
  mounted.rerender(centralContent());
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter ma nouvelle sélection" }),
    ),
  );
  expect(account.addDraft).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("current-path")).toHaveTextContent(
    "/fr/tool/notion",
  );
  expect(
    screen.queryByRole("button", { name: "Fermer" }),
  ).not.toBeInTheDocument();
  account = { ...account, pendingDraftChoice: null, syncStatus: "synced" };
  mounted.rerender(centralContent());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByTestId("current-path")).toHaveTextContent(
    "/fr/tool/notion?plan=free#pricing",
  );
});
it("reopens a closed busy form on eventual success and retains draft decision", async () => {
  const mounted = render(centralContent());
  fireEvent.click(screen.getByRole("button", { name: "Open auth" }));
  account = { ...account, authBusy: true };
  mounted.rerender(centralContent());
  fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  account = {
    ...account,
    user,
    authBusy: false,
    syncStatus: "choice",
    pendingDraftChoice: {
      draft: normalizePersonalStack(null),
      saved: {
        state: normalizePersonalStack(null),
        revision: 1,
        updatedAt: "2026-10-21T00:00:00Z",
      },
    },
  };
  mounted.rerender(centralContent());
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(
    screen.getByText("Vous avez déjà une stack enregistrée"),
  ).toBeVisible();
});
it("keeps signed-in stack failure distinct and allows explicit continuation", () => {
  const mounted = render(centralContent());
  fireEvent.click(screen.getByRole("button", { name: "Open auth" }));
  account = { ...account, user, syncStatus: "error" };
  mounted.rerender(centralContent());
  expect(screen.getByText("Vous êtes connecté.")).toBeVisible();
  expect(screen.getByText("Sauvegarde indisponible")).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", {
      name: "Continuer avec la sauvegarde indisponible",
    }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("never opens lifecycle UI from a historical back-office dirty flag", () => {
  account = {
    ...account,
    user,
    signOutNeedsConfirmation: true,
    hasUnsavedChanges: true,
  };
  render(centralContent());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("supports cancelling dirty logout and confirms exactly once through shared action", async () => {
  account = {
    ...account,
    user,
    hasUnsavedChanges: true,
    signOut: vi.fn().mockResolvedValue(true),
  };
  render(centralContent());
  fireEvent.click(screen.getByRole("button", { name: "Sign out action" }));
  fireEvent.click(screen.getByRole("button", { name: "Rester connecté" }));
  expect(account.signOut).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Sign out action" }));
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: "Me déconnecter sans enregistrer" }),
    ),
  );
  expect(account.signOut).toHaveBeenCalledWith({ discardUnsaved: true });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("keeps contribution-protected deletion failure visible", async () => {
  account = {
    ...account,
    user,
    deleteAccount: vi.fn().mockImplementation(async () => {
      account.error = "ACCOUNT_HAS_CONTRIBUTIONS";
      return false;
    }),
  };
  render(centralContent());
  fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
  expect(account.deleteAccount).not.toHaveBeenCalled();
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", {
        name: "Supprimer définitivement mon compte",
      }),
    ),
  );
  expect(screen.getByRole("alert")).toHaveTextContent("contributions");
  expect(screen.getByRole("dialog")).toBeVisible();
});
it("cancels an open destructive intent when identity changes", () => {
  account = { ...account, user };
  const mounted = render(centralContent());
  fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
  account = { ...account, user: { ...user, id: "B", email: "b@example.test" } };
  mounted.rerender(centralContent());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("keeps cleanup warnings visible after the user signs out", () => {
  account = { ...account, privacyWarning: "ACCOUNT_LOCAL_CLEANUP_INCOMPLETE" };
  render(centralContent());
  expect(screen.getByRole("alert")).toHaveTextContent(
    "réglages de votre navigateur",
  );
});
it("keeps an unconfirmed deletion and local cleanup accessible globally", async () => {
  account = {
    ...account,
    error: "ACCOUNT_DELETION_UNCONFIRMED",
    clearLocalAccount: vi.fn().mockResolvedValue(true),
  };
  render(centralContent());
  expect(screen.getByRole("alert")).toHaveTextContent(
    "suppression n’a pas été confirmée",
  );
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", {
        name: "Effacer les données de cet appareil",
      }),
    ),
  );
  expect(account.clearLocalAccount).toHaveBeenCalledOnce();
});

it("distinguishes a recoverable local draft from incomplete privacy cleanup", () => {
  account = { ...account, privacyWarning: "ACCOUNT_LOCAL_RECOVERY_PENDING" };
  render(centralContent());
  expect(screen.getByRole("alert")).toHaveTextContent("conservées sur cet appareil");
  expect(screen.getByRole("alert")).not.toHaveTextContent("vue personnelle a été effacée");
});
