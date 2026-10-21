import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { accountPath, safeAccountReturnTo } from "@/lib/accountPaths";
import { AccountAuthJourney } from "@/components/account/AccountAuthDialog";
import AccountPageFrame from "@/components/account/AccountPageFrame";
import type { AuthMode } from "@/components/account/AccountAuthForm";
export default function AccountAuthPage({ mode }: { mode: AuthMode }) {
  const { t, lang } = useLang();
  const account = useStackAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = safeAccountReturnTo(
    new URLSearchParams(location.search).get("returnTo"),
    lang,
    typeof window === "undefined"
      ? "https://tooltrim.com"
      : window.location.origin,
  );
  const destination = [
    accountPath(lang, "signin"),
    accountPath(lang, "signup"),
  ].includes(returnTo.split("?")[0])
    ? `/${lang}/ma-stack`
    : returnTo;
  const complete = useCallback(
    () => navigate(destination, { replace: true }),
    [destination, navigate],
  );
  return (
    <AccountPageFrame
      narrow
      title={
        mode === "signup"
          ? t("Créer un compte", "Create an account")
          : t("Se connecter", "Sign in")
      }
      intro={t(
        "Retrouvez vos outils et gérez votre stack, sur tous vos appareils.",
        "Keep your tools and manage your stack across your devices.",
      )}
    >
      {account.enabled ? (
        <div className="ac-auth-card">
          <AccountAuthJourney
            mode={mode}
            returnTo={destination}
            onModeChange={(next) =>
              navigate(
                `${accountPath(lang, next)}?returnTo=${encodeURIComponent(destination)}`,
                { replace: true },
              )
            }
            onComplete={complete}
          />
        </div>
      ) : (
        <p className="ac-notice">
          {t(
            "Les comptes seront bientôt disponibles. Votre stack reste utilisable sur cet appareil.",
            "Accounts will be available soon. You can keep using your stack on this device.",
          )}
        </p>
      )}
    </AccountPageFrame>
  );
}
