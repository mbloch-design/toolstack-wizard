import { useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import AccountPageFrame from "@/components/account/AccountPageFrame";
import Button, { buttonAttrs } from "@/ds/Button/Button";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useTheme } from "@/hooks/useTheme";
import { useLang } from "@/hooks/useLang";
import { accountPath, safeAccountReturnTo } from "@/lib/accountPaths";
import { keepPublisherInvitation, publisherPath } from "@/lib/publisherCatalogApi";
import PublisherDashboard from "@/components/publisher/PublisherDashboard";
import PublisherToolPage from "./PublisherToolPage";
import styles from "@/components/publisher/PublisherWorkspace.module.css";

export default function PublisherPage() {
  useTheme();
  const { t, lang, prefix } = useLang();
  const account = useStackAccount();
  const location = useLocation();
  const { slug, invitationToken } = useParams();
  const navigate = useNavigate();
  const cmsEnabled = import.meta.env.VITE_PUBLISHER_CMS_ENABLED === "true";
  const query = new URLSearchParams(location.search);
  const title = query.has("listingId") ? t("Suivi de la fiche", "Listing progress") : t("Mes fiches", "My listings");
  useEffect(() => {
    if (!cmsEnabled || !invitationToken) return;
    const kept = keepPublisherInvitation(invitationToken);
    navigate(publisherPath(prefix) + (kept ? "?invite=continue" : "?invite=manual"), { replace: true });
  }, [cmsEnabled, invitationToken, navigate, prefix]);

  if (!cmsEnabled) return <AccountPageFrame title={title} wide>
    <p>{t("L’espace éditeur est indisponible pour le moment.", "The publisher workspace is temporarily unavailable.")}</p>
  </AccountPageFrame>;
  if (invitationToken) return <AccountPageFrame title={title} wide>
    <p role="status">{t("Ouverture de l’invitation…", "Opening invitation…")}</p>
  </AccountPageFrame>;
  if (location.pathname === "/fr/editeur" || location.pathname === "/fr/editeur/") {
    const clean = new URLSearchParams();
    for (const key of ["listingId", "payment", "offer"]) {
      const value = query.get(key);
      if (value) clean.set(key, value);
    }
    return <Navigate to={publisherPath(prefix) + (clean.size ? `?${clean}` : "")} replace />;
  }
  if (location.pathname === "/en/editeur" || location.pathname === "/en/editeur/") return <Navigate to={publisherPath(prefix)} replace />;

  let content;
  if (!account.enabled) content = <p>{t("L’espace éditeur est indisponible pour le moment.", "The publisher workspace is temporarily unavailable.")}</p>;
  else if (!account.authInitialized) content = <p role="status">{t("Chargement du compte…", "Loading account…")}</p>;
  else if (!account.user) {
    const returnTo = encodeURIComponent(safeAccountReturnTo(location.pathname + location.search + location.hash, lang, window.location.origin));
    content = <section className={styles.section}>
      <p>{t("Connectez-vous pour proposer un outil, reprendre une demande ou mettre à jour une fiche.", "Sign in to suggest a tool, resume an application or update a listing.")}</p>
      <div className={styles.actions}>
        <Link {...buttonAttrs("primary")} to={`${accountPath(lang, "signin")}?returnTo=${returnTo}`}>{t("Se connecter", "Sign in")}</Link>
        <Link {...buttonAttrs()} to={`${accountPath(lang, "signup")}?returnTo=${returnTo}`}>{t("Créer un compte", "Create account")}</Link>
      </div>
    </section>;
  } else if (!account.user.email_confirmed_at && !account.user.confirmed_at) {
    content = <section className={styles.section}>
      <p>{t("Confirmez votre adresse e-mail pour accéder à vos fiches.", "Confirm your email address to access your listings.")}</p>
      <Button onClick={() => window.location.reload()}>{t("Vérifier à nouveau", "Check again")}</Button>
    </section>;
  } else if (slug) {
    return <PublisherToolPage key={`${account.user.id}:${slug}`} slug={slug} getToken={account.getAccessToken} />;
  } else {
    content = <PublisherDashboard key={account.user.id} getToken={account.getAccessToken} />;
  }
  return <AccountPageFrame title={title} wide>{content}</AccountPageFrame>;
}
