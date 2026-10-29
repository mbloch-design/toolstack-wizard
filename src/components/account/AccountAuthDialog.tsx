import { Button } from "@/components/ui/primitives";
import { isStackReturn } from "@/lib/stackPageLoader";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect } from "react";
import { X } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import AccountAuthForm, { type AuthMode } from "./AccountAuthForm";
import AccountWelcome from "./AccountWelcome";
import AccountStackStatus from "./AccountStackStatus";
export function AccountAuthJourney({
  mode,
  onModeChange,
  onComplete,
  returnTo,
  transition = false,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onComplete: () => void;
  returnTo?: string;
  transition?: boolean;
}) {
  const account = useStackAccount();
  const { t } = useLang();
  const signedIn = !!account.user && account.syncStatus !== "session-expired";
  const complete =
    signedIn &&
    !account.authBusy &&
    (account.syncStatus === "synced" || (isStackReturn(returnTo) && account.syncStatus === "connecting")) &&
    !account.pendingDraftChoice &&
    !account.conflict;
  useEffect(() => {
    if (complete) onComplete();
  }, [complete, onComplete]);
  if (!signedIn)
    return (
      <AccountAuthForm
        key={account.user?.id ?? "visitor"}
        mode={mode}
        onModeChange={onModeChange}
        onAuthenticated={() => undefined}
        returnTo={returnTo}
      />
    );
  return (
    <div className="ac-auth">
      {!transition && <p className="ac-notice">
        {t("Vous êtes connecté.", "You are signed in.")}
      </p>}
      {(!transition || !["connecting", "syncing", "synced"].includes(account.syncStatus) || account.pendingDraftChoice || account.conflict) && <AccountStackStatus />}
      {["error", "unsaved"].includes(account.syncStatus) && (
        <Button appearance="account" variant="quiet" type="button"  onClick={onComplete}>
          {t(
            "Continuer avec la sauvegarde indisponible",
            "Continue while saving is unavailable",
          )}
        </Button>
      )}
    </div>
  );
}
export default function AccountAuthDialog({
  open,
  mode,
  onModeChange,
  onClose,
  onComplete,
  returnTo,
  restoreFocus,
}: {
  open: boolean;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  onComplete: () => void;
  returnTo: string;
  restoreFocus: () => void;
}) {
  const { t } = useLang();
  const account = useStackAccount();
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="ac-overlay" />
        <Dialog.Content
          className={`ac-dialog ac-dialog--auth${mode === "signup" ? " ac-dialog--signup" : ""}`}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
          onEscapeKeyDown={(event) => {
            if (account.pendingDraftChoice) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (account.pendingDraftChoice) event.preventDefault();
          }}
        >
          {mode === "signup" && <AccountWelcome />}
          <div className="ac-auth-pane">
          <span className="ac-eyebrow">{mode === "signup" ? t("Votre espace personnel", "Your personal space") : t("Content de vous revoir", "Good to see you again")}</span>
          <Dialog.Title className="ac-title">
            {account.user && account.syncStatus !== "session-expired"
              ? t("Retrouvez votre stack", "Your stack is waiting")
              : mode === "signup"
                ? t(
                    "Créez votre compte ToolTrim",
                    "Create your ToolTrim account",
                  )
                : t("Bienvenue sur ToolTrim", "Welcome to ToolTrim")}
          </Dialog.Title>
          <Dialog.Description className="ac-intro">
            {t(
              "Retrouvez vos outils et gérez votre stack, sur tous vos appareils.",
              "Keep your tools and manage your stack across your devices.",
            )}
          </Dialog.Description>
          <AccountAuthJourney
            mode={mode}
            onModeChange={onModeChange}
            onComplete={onComplete}
            returnTo={returnTo}
          />
          </div>
          {!account.pendingDraftChoice && (
            <Dialog.Close
              className="ac-close"
              aria-label={t("Fermer", "Close")}
            >
              <X size={20} aria-hidden />
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
