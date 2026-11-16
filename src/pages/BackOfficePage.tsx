import { BackofficeNavigation } from "@/ds/BackofficeNavigation/BackofficeNavigation";
import { MemoryRouter, useInRouterContext, useLocation, useNavigate } from "react-router-dom";
import { readBackofficeSection, useBackofficeNavigationPublisher, useBackofficeSignOutPublisher, type BackofficeSection } from "@/components/backoffice/backofficeNavigation";
import { useCallback, useEffect, useId, useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { Button as StackButton } from "@/components/stack/StackKit";
import { CatalogDraftSession } from "@/components/backoffice/catalogDraftSession";
import { AccountsDashboard } from "@/components/backoffice/AccountsDashboard";
import type { Session } from "@supabase/supabase-js";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useLang } from "@/hooks/useLang";
import { removeNoindex, setNoindex } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Lock, LogOut } from "@/lib/icons";

const LEGACY_SESSION_STORAGE_KEY = "tooltrim.backoffice.admin_session";
const LEGACY_STORAGE_KEY = "tooltrim.backoffice.admin_key";

type AdminSession = {
  userId: string;
  accessToken: string;
  email: string | null;
  expiresAt: string | null;
};

function toAdminSession(session: Session | null): AdminSession | null {
  if (!session?.access_token) return null;
  return {
    userId: session.user.id || session.user.email || "",
    accessToken: session.access_token,
    email: session.user.email || null,
    expiresAt: typeof session.expires_at === "number"
      ? new Date(session.expires_at * 1000).toISOString()
      : null,
  };
}

export default function BackOfficePage() {
  const inRouter = useInRouterContext();
  return inRouter ? <BackOfficePageContent /> : <MemoryRouter initialEntries={[`${window.location.pathname}${window.location.search}${window.location.hash}`]}><BackOfficePageContent /></MemoryRouter>;
}

function BackOfficePageContent() {
  const { lang, t } = useLang();
  const account = useStackAccount();
  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [logoutCleanupWarning, setLogoutCleanupWarning] = useState(false);
  const locale = lang === "en" ? "en" : "fr";
  const loginId = useId();

  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [catalogSession] = useState(() => new CatalogDraftSession());
  const [catalogDirty, setCatalogDirty] = useState(false);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
  const location = useLocation();
  const routerNavigate = useNavigate();
  const publishNavigation = useBackofficeNavigationPublisher();
  const publishSignOut = useBackofficeSignOutPublisher();
  const section = readBackofficeSection(location.search);
  const [sectionError, setSectionError] = useState(false);
  const setAuthorization = useCallback((authorized: boolean) => setVerifiedUserId(authorized ? adminSession?.userId ?? null : null), [adminSession?.userId]);
  const navigateSection = useCallback(async (next: BackofficeSection): Promise<boolean> => {
    if (section === next) return true;
    if (section === "catalog" && catalogDirty) {
      if (catalogSession.stagedEditing || !catalogSession.dirty) { setSectionError(true); return false; }
      try { await catalogSession.flush(); } catch { setSectionError(true); return false; }
    }
    const params = new URLSearchParams(window.location.search || location.search);
    params.set("view", next);
    if (next !== "catalog") { params.delete("tool"); params.delete("editor"); }
    if (next !== "users") params.delete("account");
    setSectionError(false);
    routerNavigate({ pathname: location.pathname, search: `?${params}`, hash: location.hash });
    return true;
  }, [catalogDirty, catalogSession, location, routerNavigate, section]);
  const accountLocation = useCallback((id: string | null) => {
    const params = new URLSearchParams(location.search);
    params.set("view", "users");
    params.delete("tool"); params.delete("editor");
    if (id) params.set("account", id); else params.delete("account");
    return { pathname: location.pathname, search: `?${params}`, hash: location.hash };
  }, [location]);
  const navigateAccount = useCallback((id: string | null) => routerNavigate(accountLocation(id)), [accountLocation, routerNavigate]);
  const accountHref = useCallback((id: string) => { const target = accountLocation(id); return `${target.pathname}${target.search}${target.hash}`; }, [accountLocation]);
  const acceptSession = useCallback((session: Session | null) => {
    const next = toAdminSession(session);
    if (next) catalogSession.setOwner(next.userId);
    else { catalogSession.suspend(); setVerifiedUserId(null); }
    setAdminSession(next);
  }, [catalogSession]);
  const [authLoading, setAuthLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNoindex();
    return () => removeNoindex();
  }, []);

  useEffect(() => {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);

    void supabase.auth.getSession().then(({ data }) => {
      acceptSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      acceptSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [acceptSession]);

  const connect = useCallback(async () => {
    const email = adminEmailInput.trim();
    const password = adminPasswordInput;
    if (!email || !password || account.authBusy) return;
    setAuthLoading(true);
    setError(null);
    try {
      let session: Session | null;
      if (account.enabled) {
        const result = await account.signInWithPassword(email, password);
        if (!result.ok) throw new Error(t("Connexion impossible. Vérifiez vos identifiants ou réessayez plus tard.", "Unable to sign in. Check your credentials or try again later."));
        session = (await supabase.auth.getSession()).data.session;
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        session = data.session;
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      acceptSession(session);
      setAdminPasswordInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Connexion impossible", "Unable to sign in"));
    } finally {
      setAuthLoading(false);
    }
  }, [adminEmailInput, adminPasswordInput, account, t, acceptSession]);

  const disconnect = useCallback(async (discardUnsaved = false) => {
    if (authLoading) return;
    setLogoutError(false);
    if (catalogDirty && !discardUnsaved) { setLogoutPrompt(true); return; }
    if (account.enabled && account.hasUnsavedChanges && !discardUnsaved) {
      setLogoutPrompt(true);
      await account.signOut();
      return;
    }
    setAuthLoading(true);
    try {
      if (account.enabled) {
        if (!await account.signOut({ discardUnsaved })) { setLogoutError(true); return; }
      } else {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      }
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      } catch { setLogoutCleanupWarning(true); }
      catalogSession.clear();
      setCatalogDirty(false);
      setLogoutPrompt(false);
      setAdminSession(null);
      setError(null);
    } catch { setLogoutError(true); }
    finally { setAuthLoading(false); }
  }, [account, authLoading, catalogDirty, catalogSession]);

  useEffect(() => {
    if (!publishNavigation || !adminSession || verifiedUserId !== adminSession.userId) return;
    publishNavigation({ section, onNavigate: navigateSection });
    return () => publishNavigation(null);
  }, [publishNavigation, adminSession, verifiedUserId, section, navigateSection]);

  useEffect(() => {
    if (!publishSignOut || !adminSession) return;
    publishSignOut({ onSignOut: () => void disconnect(), busy: authLoading });
    return () => publishSignOut(null);
  }, [publishSignOut, adminSession, disconnect, authLoading]);

  const logoutFeedback = <>
    {logoutError && <p className="ba-login-error" role="alert">{t("La déconnexion a échoué. Réessayez.", "Sign-out failed. Please try again.")}</p>}
    {(account.privacyWarning || logoutCleanupWarning) && <p className="ba-login-error" role="alert">{account.privacyWarning === "ACCOUNT_LOCAL_RECOVERY_PENDING"
      ? t("Certaines données locales n’ont pas encore pu être récupérées. Elles sont conservées sur cet appareil pour une nouvelle tentative.", "Some local data could not be recovered yet. It remains on this device for another attempt.")
      : t("L’affichage personnel a été effacé, mais le navigateur a bloqué une partie du nettoyage. Effacez les données du site ToolTrim dans les réglages de votre navigateur avant de fermer cet appareil partagé.", "Your personal view was cleared, but the browser blocked part of the cleanup. Clear ToolTrim site data in your browser settings before leaving this shared device.")}</p>}
    {logoutPrompt && <div className="ms-account-choice" aria-busy={authLoading}>
      <p>{t("Certaines modifications ne sont pas enregistrées. Les abandonner en vous déconnectant ?", "Some changes are not saved. Discard them and sign out?")}</p>
      <div className="ms-account-actions">
        <button type="button" className="ms-account-outline-button" disabled={authLoading} onClick={() => void disconnect(true)}>{t("Me déconnecter sans enregistrer", "Sign out without saving")}</button>
        <button type="button" className="ms-account-text-button" disabled={authLoading} onClick={() => setLogoutPrompt(false)}>{t("Continuer mes modifications", "Keep editing")}</button>
      </div>
    </div>}
  </>;

  if (!adminSession) {
    return (
      <section className="ba-shell ba-access" aria-labelledby={`${loginId}-page-title`}>
        <Breadcrumb items={[{ label: t("Back-office", "Back office") }]} includeSchema={false}/>
        <header className="ba-heading ba-entry-header"><div>
          <h1 id={`${loginId}-page-title`}>{t("Back-office ToolTrim", "ToolTrim back office")}</h1>
          <p>{t("Retrouvez les comptes et les stacks enregistrées.", "View accounts and their saved stacks.")}</p>
        </div></header>
        {logoutFeedback}
        <form className="ba-login" aria-label={t("Connexion administrateur", "Administrator sign-in")} aria-busy={authLoading}
          onSubmit={event => { event.preventDefault(); void connect(); }}>
          <div className="ba-login-heading"><Lock size={20} aria-hidden="true"/><h2>{t("Accès administrateur", "Administrator access")}</h2></div>
          <p className="ba-login-intro">{t("Connectez-vous avec votre e-mail et votre mot de passe administrateur.", "Sign in with your admin email and password.")}</p>
          {error && <p id={`${loginId}-error`} className="ba-login-error" role="alert">{error}</p>}
          <div className="ba-login-field">
            <label htmlFor={`${loginId}-email`}>{t("E-mail administrateur", "Admin email")}</label>
            <input id={`${loginId}-email`} type="email" name="username" autoComplete="username" inputMode="email" required
              value={adminEmailInput} onChange={event => setAdminEmailInput(event.target.value)} disabled={authLoading}
              aria-describedby={error ? `${loginId}-error` : undefined}/>
          </div>
          <div className="ba-login-field">
            <label htmlFor={`${loginId}-password`}>{t("Mot de passe", "Password")}</label>
            <input id={`${loginId}-password`} type="password" name="password" autoComplete="current-password" required
              value={adminPasswordInput} onChange={event => setAdminPasswordInput(event.target.value)} disabled={authLoading}
              aria-describedby={error ? `${loginId}-error` : undefined}/>
          </div>
          <button type="submit" className="tt-button-primary ba-login-submit" disabled={authLoading}>
            {authLoading ? t("Connexion…", "Signing in…") : t("Se connecter", "Sign in")}
          </button>
          <p className="ba-login-note">{t("L’accès est réservé aux comptes autorisés côté serveur.", "Access is restricted to accounts authorized by the server.")}</p>
        </form>
      </section>
    );
  }

  const standaloneNavigation = !publishNavigation ? <BackofficeNavigation section={section} onNavigate={navigateSection} lang={locale} homeHref={`/${locale}`} /> : null;

  return (
    <div className="bo-shell ms-page">
      {standaloneNavigation}
      <Breadcrumb items={[{ label: t("Back-office", "Back office") }]} includeSchema={false}/>
      <div className="bo-account-toolbar"><p>{t("Administration", "Administration")}<span aria-hidden> · </span>{adminSession.email || t("Compte connecté", "Signed-in account")}</p>
        {!publishNavigation && <StackButton className="bo-signout" disabled={authLoading} onClick={() => void disconnect()} icon={<LogOut size={16} aria-hidden/>}>{t("Fermer", "Sign out")}</StackButton>}
      </div>
      {logoutFeedback}
      {sectionError && <p role="alert">{t("Enregistrez ou abandonnez les modifications de la fiche avant de quitter cet écran.", "Save or discard your record edits before leaving this screen.")}</p>}
      <AccountsDashboard accountHref={accountHref} accountId={section === "users" ? new URLSearchParams(location.search).get("account") : null} onAccountNavigate={navigateAccount} onAuthorization={setAuthorization} section={section} onSectionNavigate={navigateSection} key={adminSession.userId} catalogSession={catalogSession} onCatalogReauthenticate={()=>{catalogSession.suspend();setAdminSession(null);}} onCatalogDirtyChange={setCatalogDirty} initialView="overview"/>
    </div>
  );
}
