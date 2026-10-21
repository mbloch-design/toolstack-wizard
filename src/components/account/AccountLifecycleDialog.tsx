import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { accountErrorMessage } from "./accountMessages";
export default function AccountLifecycleDialog({
  kind,
  onClose,
  restoreFocus,
}: {
  kind: "signout" | "delete";
  onClose: () => void;
  restoreFocus: () => void;
}) {
  const { t } = useLang();
  const account = useStackAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function confirm() {
    if (busy || account.authBusy) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await (kind === "delete"
        ? account.deleteAccount()
        : account.signOut({ discardUnsaved: true }));
      if (ok) onClose();
      else
        setError(
          kind === "delete"
            ? "ACCOUNT_DELETION_FAILED"
            : "ACCOUNT_SIGN_OUT_FAILED",
        );
    } catch {
      setError("ACCOUNT_AUTH_UNAVAILABLE");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="ac-overlay" />
        <Dialog.Content
          className="ac-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
        >
          <Dialog.Title className="ac-title">
            {kind === "delete"
              ? t("Supprimer votre compte ?", "Delete your account?")
              : t("Vous déconnecter ?", "Sign out?")}
          </Dialog.Title>
          <Dialog.Description className="ac-intro">
            {kind === "delete"
              ? t(
                  "Votre compte et sa stack enregistrée seront supprimés définitivement. Les modifications non enregistrées seront abandonnées.",
                  "Your account and saved stack will be permanently deleted. Unsaved changes will be discarded.",
                )
              : account.hasUnsavedChanges
                ? t(
                    "Certaines modifications ne sont pas enregistrées. Les abandonner en vous déconnectant ?",
                    "Some changes are not saved. Discard them and sign out?",
                  )
                : t(
                    "Votre stack enregistrée vous attendra à votre prochaine connexion.",
                    "Your saved stack will be here when you sign in again.",
                  )}
          </Dialog.Description>
          {error && (
            <p className="ac-error" role="alert">
              {accountErrorMessage(account.error || error, t)}
            </p>
          )}
          <div className="ac-actions">
            <button className="ac-button" disabled={busy} onClick={onClose}>
              {kind === "delete"
                ? t("Conserver mon compte", "Keep my account")
                : t("Rester connecté", "Stay signed in")}
            </button>
            <button
              className="ac-button ac-button--danger"
              disabled={busy || account.authBusy}
              onClick={() => void confirm()}
            >
              {busy
                ? t("Patientez…", "Please wait…")
                : kind === "delete"
                  ? t(
                      "Supprimer définitivement mon compte",
                      "Permanently delete my account",
                    )
                  : account.hasUnsavedChanges
                    ? t(
                        "Me déconnecter sans enregistrer",
                        "Sign out without saving",
                      )
                    : t("Me déconnecter", "Sign out")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
