import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { accountPath } from "@/lib/accountPaths";
import { accountCallbackReturnTo, clearAccountCallbackReturnTo } from "@/lib/accountAuth";
import { AccountAuthJourney } from "@/components/account/AccountAuthDialog";
import AccountPageFrame from "@/components/account/AccountPageFrame";
export default function AccountCallbackPage() {
  const { t, lang } = useLang();
  const account = useStackAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const [waiting, setWaiting] = useState(true);
  const [returnTo] = useState(() => accountCallbackReturnTo(lang, new URLSearchParams(location.search).get("returnTo")));
  const complete = useCallback(
    () => { clearAccountCallbackReturnTo(lang); navigate(returnTo, { replace: true }); },
    [returnTo, navigate, lang],
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
      transition
      title={t("Connexion à ToolTrim", "Signing in to ToolTrim")}
    >
      {account.enabled && account.user ? (
        <div className="ac-callback-content">
        {!account.pendingDraftChoice && !account.conflict && !["error", "unsaved"].includes(account.syncStatus) && <span className="ac-transition-mark" aria-hidden />}
        <p className="ac-transition-title" role="status">{account.pendingDraftChoice || account.conflict ? t("Retrouvez la bonne version de votre stack.", "Choose the right version of your stack.") : ["error", "unsaved"].includes(account.syncStatus) ? t("Vous êtes connecté.", "You are signed in.") : t("Un instant, on retrouve votre stack.", "One moment, finding your stack.")}</p>
        {!waiting && account.syncStatus === "connecting" && <p className="ac-note">{t("Le chargement prend plus de temps que prévu. Vous pouvez ouvrir votre stack et y suivre la synchronisation.", "Loading is taking longer than expected. You can open your stack and follow synchronization there.")} <Link to={returnTo} replace className="ac-text-button">{t("Continuer", "Continue")}</Link></p>}
        <AccountAuthJourney
          transition
          mode="signin"
          onModeChange={() =>
            navigate(accountPath(lang, "signin"), { replace: true })
          }
          onComplete={complete}
          returnTo={returnTo}
        />
        </div>
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
