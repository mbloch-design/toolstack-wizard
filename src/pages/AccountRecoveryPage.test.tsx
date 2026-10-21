import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { INITIAL_ACCOUNT_SNAPSHOT } from "@/lib/stackAccountCoordinator";
import AccountRecoveryPage from "./AccountRecoveryPage";
const mocks = vi.hoisted(() => ({ account: {} as Record<string, unknown> }));
vi.mock("@/hooks/useStackAccount", () => ({
  useStackAccount: () => mocks.account,
}));
beforeEach(() => {
  mocks.account = {
    ...INITIAL_ACCOUNT_SNAPSHOT,
    enabled: true,
    authInitialized: true,
    recoveryStatus: "ready",
    user: { id: "A" },
    completePasswordReset: vi
      .fn()
      .mockResolvedValue({
        ok: true,
        outcome: "password-updated",
        warning: "ACCOUNT_OTHER_SESSIONS_NOT_REVOKED",
      }),
  };
});
afterEach(cleanup);
const view = () =>
  render(
    <MemoryRouter initialEntries={["/fr/compte/reinitialiser?recovery=true"]}>
      <AccountRecoveryPage />
    </MemoryRouter>,
  );
it("requires actual recovery proof and offers a new link otherwise", () => {
  mocks.account = { ...mocks.account, recoveryStatus: "none" };
  view();
  expect(
    screen.queryByLabelText("Nouveau mot de passe"),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/Ce lien est invalide ou expiré/)).toBeVisible();
});
it("requires matching passwords and separates successful change from revocation warning", async () => {
  view();
  fireEvent.change(screen.getByLabelText("Nouveau mot de passe"), {
    target: { value: "long password" },
  });
  fireEvent.change(screen.getByLabelText("Confirmer le mot de passe"), {
    target: { value: "wrong password" },
  });
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", {
        name: "Enregistrer le nouveau mot de passe",
      }),
    ),
  );
  expect(screen.getByRole("alert")).toHaveTextContent("ne correspondent pas");
  expect(mocks.account.completePasswordReset).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Confirmer le mot de passe"), {
    target: { value: "long password" },
  });
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", {
        name: "Enregistrer le nouveau mot de passe",
      }),
    ),
  );
  expect(screen.getByText("Votre mot de passe a été modifié.")).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent("autres sessions");
  expect(
    screen.queryByLabelText("Nouveau mot de passe"),
  ).not.toBeInTheDocument();
});

it("waits for SDK initialization before evaluating a cold recovery link", () => {
  mocks.account = { ...mocks.account, user: null, authInitialized: false, recoveryStatus: "none" };
  const mounted = view();
  expect(screen.getByRole("status")).toHaveTextContent("Vérification de votre lien");
  expect(screen.queryByText(/Ce lien est invalide ou expiré/)).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Nouveau mot de passe")).not.toBeInTheDocument();
  mocks.account = { ...mocks.account, user: { id: "A" }, authInitialized: true, recoveryStatus: "ready" };
  mounted.rerender(<MemoryRouter><AccountRecoveryPage /></MemoryRouter>);
  expect(screen.getByLabelText("Nouveau mot de passe")).toBeVisible();
  expect(screen.queryByText(/Ce lien est invalide ou expiré/)).not.toBeInTheDocument();
});
