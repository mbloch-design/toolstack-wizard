import { Cloud } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import AccountStackStatus from "@/components/account/AccountStackStatus";
export default function StackAccountPanel({ empty = false, placement = "all" }: { empty?: boolean; placement?: "all" | "inline" | "notice" }) {
  const account = useStackAccount();
  const experience = useAccountExperience();
  const { t } = useLang();
  if (!account.enabled) return null;
  const needsAuth = !account.user || account.syncStatus === "session-expired";
  const healthyProgress = !needsAuth && ["unsaved", "syncing"].includes(account.syncStatus)
    && !account.pendingDraftChoice && !account.conflict && !account.error
    && !account.privacyWarning && !account.deletionConfirmed;
  if (healthyProgress) {
    if (placement === "notice") return null;
    const label = t("Enregistrement…", "Saving…");
    return empty
      ? <p className="ms-empty-autosave" role="status"><Cloud size={16} aria-hidden />{label}</p>
      : <span className="ms-save-indicator" role="status" title={label}><Cloud size={16} aria-hidden /><span className="sr-only">{label}</span></span>;
  }
  if (empty && !needsAuth && account.syncStatus === "synced" && !account.pendingDraftChoice && !account.conflict && !account.error && !account.privacyWarning && !account.deletionConfirmed) {
    return <p className="ms-empty-autosave"><Cloud size={16} aria-hidden />{t("Vos ajouts seront enregistrés automatiquement.", "Your additions will be saved automatically.")}</p>;
  }
  if (!empty && !needsAuth && account.syncStatus === "synced" && !account.pendingDraftChoice && !account.conflict && !account.error && !account.privacyWarning && !account.deletionConfirmed) {
    if (placement === "notice") return null;
    return <span className="ms-save-indicator" role="status" tabIndex={0} title={t("Stack enregistrée", "Stack saved")}><Cloud size={16} aria-hidden /><span className="sr-only">{t("Stack enregistrée", "Stack saved")}</span></span>;
  }
  if (placement === "inline") return null;
  return (
    <section
      className={`ms-account ac-stack-status ${needsAuth ? "ms-account--guest" : "ms-account--connected"}`}
      aria-label={t("Enregistrement de ma stack", "My stack saving")}
    >
      <div className="ac-stack-heading">
        <Cloud size={18} aria-hidden />
        <strong>
          {needsAuth
            ? t("Retrouvez votre stack partout", "Take your stack everywhere")
            : t("Enregistrement de la stack", "Stack saving")}
        </strong>
      </div>
      {needsAuth ? (
        <>
          <p>
            {account.syncStatus === "session-expired"
              ? t(
                  "Votre session a expiré. Reconnectez-vous pour enregistrer vos modifications.",
                  "Your session expired. Sign in again to save your changes.",
                )
              : t(
                  empty ? "Un compte vous permettra d’enregistrer votre sélection et de la retrouver sur vos autres appareils." : "Créez un compte gratuit pour enregistrer vos outils et retrouver votre stack sur tous vos appareils.",
                  empty ? "An account lets you save your selection and access it across your devices." : "Create a free account to save your tools and access your stack across your devices.",
                )}
          </p>
          <div className="ac-actions">
            <button
              className={account.syncStatus === "session-expired" ? "ac-button ac-button--primary" : "ac-button"}
              onClick={() => experience.openAuth(account.syncStatus === "session-expired" ? "signin" : "signup")}
            >
              {account.syncStatus === "session-expired"
                ? t("Me reconnecter", "Sign in again")
                : empty ? t("Créer un compte gratuit", "Create a free account") : t("Enregistrer ma stack", "Save my stack")}
            </button>
            {account.syncStatus !== "session-expired" && <button className="ac-text-button" onClick={() => experience.openAuth("signin")}>
              {t("J’ai déjà un compte", "I already have an account")}
            </button>}
          </div>
        </>
      ) : null}
      <AccountStackStatus key={account.user?.id ?? "visitor"} />
    </section>
  );
}
