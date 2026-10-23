import { Cloud } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import AccountStackStatus from "@/components/account/AccountStackStatus";
export default function StackAccountPanel({ empty = false }: { empty?: boolean }) {
  const account = useStackAccount();
  const experience = useAccountExperience();
  const { t } = useLang();
  if (!account.enabled) return null;
  const needsAuth = !account.user || account.syncStatus === "session-expired";
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
