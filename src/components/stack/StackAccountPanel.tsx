import { Link } from "react-router-dom";
import { Cloud } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import AccountStackStatus from "@/components/account/AccountStackStatus";
import { accountPath } from "@/lib/accountPaths";
export default function StackAccountPanel() {
  const account = useStackAccount();
  const experience = useAccountExperience();
  const { t, lang } = useLang();
  if (!account.enabled) return null;
  const needsAuth = !account.user || account.syncStatus === "session-expired";
  return (
    <section
      className="ms-account-panel"
      aria-label={t("Enregistrement de ma stack", "My stack saving")}
    >
      <div className="ms-account-heading">
        <Cloud size={18} aria-hidden />
        <strong>
          {needsAuth
            ? t("Retrouvez votre stack partout", "Take your stack everywhere")
            : t("Votre stack personnelle", "Your personal stack")}
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
                  "Vos outils restent sur cet appareil. Connectez-vous pour les retrouver ailleurs.",
                  "Your tools stay on this device. Sign in to find them elsewhere.",
                )}
          </p>
          <button
            className="ac-button"
            onClick={() => experience.openAuth("signin")}
          >
            {t("Enregistrer ma stack", "Save my stack")}
          </button>
        </>
      ) : (
        <Link className="ac-text-button" to={accountPath(lang, "settings")}>
          {t("Paramètres du compte", "Account settings")}
        </Link>
      )}
      <AccountStackStatus key={account.user?.id ?? "visitor"} />
    </section>
  );
}
