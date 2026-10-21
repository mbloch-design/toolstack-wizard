import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { accountErrorMessage } from "./accountMessages";
export function AccountPrivacyNotice() {
  const account = useStackAccount();
  const { t } = useLang();
  const [cleaning, setCleaning] = useState(false);
  async function clearDevice() {
    if (cleaning) return;
    setCleaning(true);
    try {
      await account.clearLocalAccount();
    } finally {
      setCleaning(false);
    }
  }
  return (
    <>
      {account.error === "ACCOUNT_DELETION_UNCONFIRMED" && (
        <div className="ac-notice">
          <p role="alert">{accountErrorMessage(account.error, t)}</p>
          <button
            type="button"
            className="ac-button"
            disabled={cleaning}
            onClick={() => void clearDevice()}
          >
            {t(
              "Effacer les données de cet appareil",
              "Clear this device's data",
            )}
          </button>
        </div>
      )}
      {account.deletionConfirmed && (
        <p className="ac-notice" role="status">
          {t("Votre compte a été supprimé.", "Your account was deleted.")}
        </p>
      )}
      {account.privacyWarning && (
        <p className="ac-error" role="alert">
          {account.privacyWarning === "ACCOUNT_LOCAL_RECOVERY_PENDING"
            ? t(
                "Certaines données locales n’ont pas encore pu être récupérées. Elles sont conservées sur cet appareil pour une nouvelle tentative.",
                "Some local data could not be recovered yet. It remains on this device for another attempt.",
              )
            : t(
                "Votre vue personnelle a été effacée, mais le navigateur a bloqué une partie du nettoyage. Effacez les données du site ToolTrim dans les réglages de votre navigateur avant de fermer cet appareil partagé.",
                "Your personal view was cleared, but the browser blocked part of the cleanup. Clear ToolTrim site data in your browser settings before leaving this shared device.",
              )}
        </p>
      )}
    </>
  );
}
function stackStatusLabel(
  status: string,
  t: (fr: string, en: string) => string,
) {
  const labels: Record<string, [string, string]> = {
    local: ["Sur cet appareil", "On this device"],
    connecting: ["Chargement de votre stack…", "Loading your stack…"],
    syncing: ["Enregistrement…", "Saving…"],
    synced: ["Stack enregistrée", "Stack saved"],
    unsaved: ["Modifications non enregistrées", "Unsaved changes"],
    choice: ["Choisissez votre stack", "Choose your stack"],
    conflict: ["Deux versions à départager", "Two versions to resolve"],
    "session-expired": ["Session expirée", "Session expired"],
    error: ["Sauvegarde indisponible", "Saving unavailable"],
  };
  return t(...(labels[status] ?? labels.error));
}
/** Shared resolution controls: all mutations stay in the existing coordinator. */
export default function AccountStackStatus() {
  const account = useStackAccount();
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function run(action: () => Promise<boolean>) {
    if (busy || account.authBusy) return;
    setBusy(true);
    setFailed(false);
    try {
      setFailed(!(await action()));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ac-stack-status" aria-busy={busy}>
      <p role="status">{stackStatusLabel(account.syncStatus, t)}</p>
      {account.pendingDraftChoice && (
        <div className="ac-choice">
          <h3>
            {t(
              "Vous avez déjà une stack enregistrée",
              "You already have a saved stack",
            )}
          </h3>
          <p>
            {t(
              "Retrouvez-la ou ajoutez votre nouvelle sélection. Vos choix déjà enregistrés restent prioritaires.",
              "Load it or add your new selection. Your previously saved choices take priority.",
            )}
          </p>
          <div className="ac-actions">
            <button
              className="ac-button ac-button--primary"
              disabled={busy || account.authBusy}
              onClick={() => void run(account.loadSaved)}
            >
              {t("Retrouver ma stack enregistrée", "Load my saved stack")}
            </button>
            <button
              className="ac-button"
              disabled={busy || account.authBusy}
              onClick={() => void run(account.addDraft)}
            >
              {t("Ajouter ma nouvelle sélection", "Add my new selection")}
            </button>
          </div>
        </div>
      )}
      {account.conflict && (
        <div className="ac-choice">
          <h3>
            {t(
              "Une autre version a été enregistrée",
              "Another version was saved",
            )}
          </h3>
          <p>
            {t(
              "Choisissez la version à conserver.",
              "Choose which version to keep.",
            )}
          </p>
          <div className="ac-actions">
            <button
              className="ac-button"
              disabled={busy || account.authBusy}
              onClick={() => void run(account.reloadLatest)}
            >
              {t("Charger la version enregistrée", "Load the saved version")}
            </button>
            <button
              className="ac-button"
              disabled={busy || account.authBusy}
              onClick={() => void run(account.keepCurrent)}
            >
              {t("Enregistrer ma version actuelle", "Save my current version")}
            </button>
          </div>
        </div>
      )}
      {(account.syncStatus === "error" ||
        account.syncStatus === "unsaved" ||
        failed) && (
        <>
          <p className="ac-note">
            {t(
              "Votre sélection reste sur cet appareil. Réessayez pour retrouver la sauvegarde.",
              "Your selection stays on this device. Try again to restore saving.",
            )}
          </p>
          <button
            className="ac-button"
            disabled={busy || account.authBusy}
            onClick={() => void run(account.retry)}
          >
            {t("Réessayer l’enregistrement", "Retry saving")}
          </button>
        </>
      )}
      {account.error === "ACCOUNT_DELETION_UNCONFIRMED" && (
        <>
          <p className="ac-error" role="alert">
            {accountErrorMessage(account.error, t)}
          </p>
          <button
            className="ac-button"
            disabled={busy}
            onClick={() => void run(account.clearLocalAccount)}
          >
            {t(
              "Effacer les données de cet appareil",
              "Clear this device's data",
            )}
          </button>
        </>
      )}
    </div>
  );
}
