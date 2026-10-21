import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { accountPath, safeAccountReturnTo } from "@/lib/accountPaths";
import { AccountAuthJourney } from "@/components/account/AccountAuthDialog";
import AccountPageFrame from "@/components/account/AccountPageFrame";
export default function AccountCallbackPage() {
  const { t, lang } = useLang();
  const account = useStackAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const [waiting, setWaiting] = useState(true);
  const returnTo = safeAccountReturnTo(
    new URLSearchParams(location.search).get("returnTo"),
    lang,
    typeof window === "undefined"
      ? "https://tooltrim.com"
      : window.location.origin,
  );
  const complete = useCallback(
    () => navigate(returnTo, { replace: true }),
    [returnTo, navigate],
  );
  const denied = [location.search, location.hash.replace(/^#/, "?")].some(
    (value) => new URLSearchParams(value).has("error"),
  );
  useEffect(() => {
    const timer = setTimeout(() => setWaiting(false), 8000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <AccountPageFrame
      narrow
      title={t("Connexion à ToolTrim", "Signing in to ToolTrim")}
    >
      {account.enabled && account.user ? (
        <AccountAuthJourney
          mode="signin"
          onModeChange={() =>
            navigate(accountPath(lang, "signin"), { replace: true })
          }
          onComplete={complete}
          returnTo={returnTo}
        />
      ) : (
        <div className="ac-auth-card">
          <p role={denied ? "alert" : "status"}>
            {!account.enabled
              ? t("Connexion indisponible.", "Sign-in is unavailable.")
              : denied
                ? t(
                    "La connexion a été annulée ou refusée. Votre sélection est conservée.",
                    "Sign-in was cancelled or denied. Your selection is preserved.",
                  )
                : waiting
                  ? t(
                      "Vérification de votre connexion…",
                      "Checking your sign-in…",
                    )
                  : t(
                      "Ce lien n’a pas permis de vous connecter. Réessayez ou demandez un nouveau lien.",
                      "This link could not sign you in. Try again or request a new link.",
                    )}
          </p>
          <Link
            className="ac-button"
            to={`${accountPath(lang, "signin")}?returnTo=${encodeURIComponent(returnTo)}`}
          >
            {t("Retour à la connexion", "Back to sign in")}
          </Link>
        </div>
      )}
    </AccountPageFrame>
  );
}
