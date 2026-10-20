import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StackAccountContext } from "@/hooks/useStackAccount";
import { LangContext } from "@/hooks/useLang";
import { normalizePersonalStack } from "@/lib/personalStack";
import { pinToolInState } from "@/lib/stackState";
import StackAccountPanel from "./StackAccountPanel";

let account: StackAccountContext;
vi.mock("@/hooks/useStackAccount", () => ({
  useStackAccount: () => account,
  getStackAccountLabel: (value: StackAccountContext["user"]) => value?.user_metadata?.full_name || value?.email || null,
}));
const user = { id: "A", aud: "authenticated", role: "authenticated", email: "person@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" };
function content(lang: "fr" | "en" = "fr", route = `/${lang}/ma-stack?outil=notion#ms-list`) {
  return <MemoryRouter initialEntries={[route]}><LangContext.Provider value={{ lang, prefix: `/${lang}`, t: (fr, en) => lang === "en" ? en : fr }}><StackAccountPanel /></LangContext.Provider></MemoryRouter>;
}
function view(lang: "fr" | "en" = "fr", route = `/${lang}/ma-stack?outil=notion#ms-list`) { return render(content(lang, route)); }
async function click(name: string) { await act(async () => { fireEvent.click(screen.getByRole("button", { name })); }); }
async function sendCode() {
  await click("Enregistrer ma stack");
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), { target: { value: "  Person@Example.com " } });
  await click("Recevoir un code");
}
beforeEach(() => {
  vi.useFakeTimers();
  account = {
    enabled: true, user: null, syncStatus: "local", status: "local", error: null, pendingDraftChoice: null, conflict: null,
    magicLinkSentTo: null, hasUnsavedChanges: false, signOutNeedsConfirmation: false, deletionConfirmed: false, privacyWarning: null,
    signInWithGoogle: vi.fn().mockResolvedValue(true), sendEmailCode: vi.fn().mockResolvedValue(true), sendMagicLink: vi.fn().mockResolvedValue(true),
    verifyEmailCode: vi.fn().mockResolvedValue(true), loadSaved: vi.fn().mockResolvedValue(true), addDraft: vi.fn().mockResolvedValue(true),
    reloadLatest: vi.fn().mockResolvedValue(true), keepCurrent: vi.fn().mockResolvedValue(true), retry: vi.fn().mockResolvedValue(true),
    signOut: vi.fn().mockResolvedValue(true), deleteAccount: vi.fn().mockResolvedValue(false), clearLocalAccount: vi.fn().mockResolvedValue(true),
  };
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("inline personal account panel", () => {
  it.each(["fr", "en"] as const)("requires explicit account deletion confirmation and supports cancel in %s", async lang => {
    account.user = user; account.syncStatus = "synced";
    view(lang);
    const trigger = lang === "fr" ? "Supprimer mon compte" : "Delete my account";
    const confirm = lang === "fr" ? "Supprimer définitivement mon compte" : "Permanently delete my account";
    await click(trigger); expect(account.deleteAccount).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: confirm })).toHaveFocus();
    await click(lang === "fr" ? "Conserver mon compte" : "Keep my account");
    expect(screen.getByRole("button", { name: trigger })).toHaveFocus();
    await click(trigger); await click(confirm);
    expect(account.deleteAccount).toHaveBeenCalledTimes(1);
  });

  it("resets private email/code state across account switching and logout", async () => {
    const mounted = view(); await sendCode();
    fireEvent.change(screen.getByLabelText("Code reçu par e-mail"), { target: { value: "123456" } });
    account = { ...account, user, syncStatus: "synced" }; mounted.rerender(content());
    account = { ...account, user: { ...user, id: "B", email: "b@example.test" } }; mounted.rerender(content());
    account = { ...account, user: null, syncStatus: "local" }; mounted.rerender(content());
    await click("Enregistrer ma stack");
    expect(screen.getByLabelText("Adresse e-mail")).toHaveValue("");
    expect(screen.queryByLabelText("Code reçu par e-mail")).not.toBeInTheDocument();
    expect(screen.queryByText(/person@example.com/)).not.toBeInTheDocument();
  });

  it("does not expose a late old email-code failure in the next account", async () => {
    let finish!: (value: boolean) => void;
    account.sendEmailCode = vi.fn().mockImplementation(() => new Promise<boolean>(resolve => { finish = resolve; }));
    const mounted = view(); await click("Enregistrer ma stack");
    fireEvent.change(screen.getByLabelText("Adresse e-mail"), { target: { value: "private-a@example.test" } });
    await click("Recevoir un code");
    account = { ...account, user: { ...user, id: "B" }, syncStatus: "synced" }; mounted.rerender(content());
    await act(async () => { finish(false); });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("distinguishes unconfirmed remote deletion from explicit device cleanup", async () => {
    account.user = user; account.syncStatus = "session-expired"; account.error = "ACCOUNT_DELETION_UNCONFIRMED";
    view();
    expect(screen.getByRole("alert")).toHaveTextContent("suppression n’a pas été confirmée");
    await click("Effacer les données de cet appareil");
    expect(account.clearLocalAccount).toHaveBeenCalledTimes(1); expect(account.deleteAccount).not.toHaveBeenCalled();
    expect(screen.queryByText("Votre compte a été supprimé.")).not.toBeInTheDocument();
  });

  it("explains remaining browser cleanup after confirmed remote deletion without claiming local erasure", () => {
    account.deletionConfirmed = true; account.privacyWarning = "ACCOUNT_LOCAL_CLEANUP_INCOMPLETE";
    view();
    expect(screen.getByText("Votre compte a été supprimé.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("réglages de votre navigateur");
  });

  it("remains hidden when account activation is disabled", () => {
    account.enabled = false; view(); expect(screen.queryByRole("button", { name: "Enregistrer ma stack" })).not.toBeInTheDocument();
  });
  it.each(["fr", "en"] as const)("opens a labelled email form and restores focus on cancel in %s", async lang => {
    view(lang); const save = lang === "fr" ? "Enregistrer ma stack" : "Save my stack";
    await click(save); expect(screen.getByLabelText(lang === "fr" ? "Adresse e-mail" : "Email address")).toHaveFocus();
    expect(screen.getByRole("button", { name: lang === "fr" ? "Continuer avec Google" : "Continue with Google" })).toBeVisible();
    await click(lang === "fr" ? "Annuler" : "Cancel");
    expect(screen.getByRole("button", { name: save })).toHaveFocus();
  });
  it("sends to the normalized address, focuses code and bounds resend requests", async () => {
    view(); await sendCode();
    expect(account.sendEmailCode).toHaveBeenCalledWith("person@example.com", { lang: "fr", returnTo: "/fr/ma-stack?outil=notion#ms-list" });
    expect(screen.getByLabelText("Code reçu par e-mail")).toHaveFocus();
    expect(screen.getByLabelText("Code reçu par e-mail")).toHaveAttribute("autocomplete", "one-time-code");
    const resend = screen.getByRole("button", { name: /Renvoyer le code/ }); expect(resend).toBeDisabled();
    fireEvent.click(resend); expect(account.sendEmailCode).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(60000); });
    await click("Renvoyer le code"); expect(account.sendEmailCode).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: /Renvoyer le code/ })).toBeDisabled();
  });
  it("cannot strand a delayed email request by toggling the save trigger", async () => {
    let finish!: (ok: boolean) => void;
    vi.mocked(account.sendEmailCode).mockReturnValueOnce(new Promise<boolean>(resolve => { finish = resolve; }));
    view(); await sendCode();
    const save = screen.getByRole("button", { name: "Enregistrer ma stack" });
    // A slow request used to let these collapse/reopen clicks invalidate its
    // completion while leaving busy set forever on the reopened form.
    fireEvent.click(save); fireEvent.click(save);
    await act(async () => { finish(true); });
    expect(screen.getByLabelText("Code reçu par e-mail")).toBeEnabled();
    expect(screen.getByLabelText("Code reçu par e-mail")).toHaveFocus();
    expect(save).toBeEnabled();
    expect(screen.getByRole("button", { name: /Renvoyer le code/ })).toBeDisabled();
    expect(account.sendEmailCode).toHaveBeenCalledTimes(1);
  });

  it("allows cancel during a slow send and restores focus without bypassing cooldown", async () => {
    let finish!: (ok: boolean) => void;
    vi.mocked(account.sendEmailCode).mockReturnValueOnce(new Promise<boolean>(resolve => { finish = resolve; }));
    view(); await sendCode();
    await click("Annuler");
    expect(screen.getByRole("button", { name: "Enregistrer ma stack" })).toHaveFocus();
    await act(async () => { finish(true); });
    expect(screen.queryByLabelText("Code reçu par e-mail")).not.toBeInTheDocument();
    await click("Enregistrer ma stack");
    expect(screen.getByLabelText("Adresse e-mail")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Recevoir un code" })).toBeDisabled();
    expect(account.sendEmailCode).toHaveBeenCalledTimes(1);
  });

  it("keeps the code form available on an invalid or expired code and permits correction", async () => {
    vi.mocked(account.verifyEmailCode).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    view(); await sendCode();
    fireEvent.change(screen.getByLabelText("Code reçu par e-mail"), { target: { value: "123 456" } });
    await click("Vérifier le code");
    expect(screen.getByRole("alert")).toHaveTextContent("Code incorrect ou expiré");
    expect(screen.getByLabelText("Code reçu par e-mail")).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(screen.getByLabelText("Code reçu par e-mail"), { target: { value: "654321" } });
    await click("Vérifier le code");
    expect(account.verifyEmailCode).toHaveBeenLastCalledWith("person@example.com", "654321");
    expect(screen.queryByLabelText("Code reçu par e-mail")).not.toBeInTheDocument();
    expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
  });
  it("keeps identification available after Google cancellation and never reports saved", async () => {
    vi.mocked(account.signInWithGoogle).mockResolvedValue(false); view(); await click("Enregistrer ma stack"); await click("Continuer avec Google");
    expect(screen.getByRole("alert")).toHaveTextContent("Votre sélection est conservée");
    expect(screen.getByLabelText("Adresse e-mail")).toBeVisible(); expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
    expect(account.signInWithGoogle).toHaveBeenCalledWith({ lang: "fr", returnTo: "/fr/ma-stack?outil=notion#ms-list" });
  });
  it("recognizes a denied OAuth return without displaying provider-supplied error text", () => {
    view("en", "/en/ma-stack?error=access_denied&error_description=untrusted");
    expect(screen.getByRole("alert")).toHaveTextContent("Your selection is preserved");
    expect(screen.queryByText("untrusted")).not.toBeInTheDocument();
  });
  it.each(["loadSaved", "addDraft"] as const)("offers the two explicit draft choices and performs %s", async action => {
    const draft = normalizePersonalStack(null); draft.selection = pinToolInState(draft.selection, "draft-tool");
    const saved = { state: normalizePersonalStack(null), revision: 2, updatedAt: "2026-10-19T00:00:00Z" };
    account = { ...account, user, syncStatus: "choice", status: "choice", pendingDraftChoice: { draft, saved } }; view();
    expect(screen.getByRole("button", { name: "Retrouver ma stack enregistrée" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Ajouter ma nouvelle sélection" })).toBeVisible();
    await click(action === "loadSaved" ? "Retrouver ma stack enregistrée" : "Ajouter ma nouvelle sélection"); expect(account[action]).toHaveBeenCalledTimes(1);
  });
  it.each(["reloadLatest", "keepCurrent"] as const)("keeps revision conflicts distinct and performs %s", async action => {
    account = { ...account, user, syncStatus: "conflict", status: "conflict", conflict: { local: normalizePersonalStack(null), remote: null } }; view("en");
    expect(screen.queryByRole("button", { name: "Add my new selection" })).not.toBeInTheDocument();
    await click(action === "reloadLatest" ? "Load the saved version" : "Save my current version"); expect(account[action]).toHaveBeenCalledTimes(1);
  });
  it("renders confirmed status without a draft prompt and guards untrusted account display metadata", () => {
    account = { ...account, user: { ...user, user_metadata: { full_name: { malicious: true } } }, syncStatus: "synced", status: "synced" }; view("en");
    expect(screen.getByRole("status")).toHaveTextContent("Saved"); expect(screen.getByText("person@example.com")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Load my saved stack" })).not.toBeInTheDocument();
  });
  it("offers sign-in again when a private session expires and translates errors", async () => {
    account = { ...account, syncStatus: "session-expired", status: "session-expired", error: "ACCOUNT_SESSION_INVALID", hasUnsavedChanges: true }; view();
    expect(screen.getByRole("status")).toHaveTextContent("Non enregistré");
    await click("Me reconnecter"); expect(screen.getByLabelText("Adresse e-mail")).toHaveFocus();
    expect(screen.queryByText("ACCOUNT_SESSION_INVALID")).not.toBeInTheDocument();
  });
});
