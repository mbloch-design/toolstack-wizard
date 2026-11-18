import { UserRound, ShieldCheck, Palette, Database, Settings2, Download, CheckCircle2, Sun, Moon, Check, FileText } from "@/lib/icons";
import AccountLanguageIcon from "@/components/account/AccountLanguageIcon";
import AccountAvatar from "@/components/account/AccountAvatar";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency, type Currency } from "@/hooks/useCurrency";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import AccountPageFrame from "@/components/account/AccountPageFrame";
import AccountStackStatus from "@/components/account/AccountStackStatus";
import { accountErrorMessage } from "@/components/account/accountMessages";
import { accountPath } from "@/lib/accountPaths";
import { usePublisherAccess } from "@/hooks/usePublisherAccess";
import { publisherPath } from "@/lib/publisherCatalogApi";
import { listingCommercialLabel, listingOfferLabel } from "@/lib/listingOfferPresentation";
import Button, { buttonAttrs, linkClass } from "@/ds/Button/Button";
import { Notice } from "@/ds/Notice/Notice";
import publisherStyles from "@/components/publisher/PublisherWorkspace.module.css";
import {
  getPersonalStackScope,
  readPersonalStack,
} from "@/lib/personalStackStore";
import type { AccountProfile } from "@/lib/accountProfile";
function ProfileEditor({
  profile,
  save,
}: {
  profile: AccountProfile;
  save: (name: string | null) => Promise<boolean>;
}) {
  const { t } = useLang();
  const [name, setName] = useState(profile.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => setName(profile.displayName ?? ""), [profile.displayName]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const ok = await save(name);
      if (mounted.current) setMessage(ok ? "saved" : "error");
    } catch {
      if (mounted.current) setMessage("error");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <form className="ac-form ac-profile-editor" onSubmit={submit}>
      <h3>{t("Personnalisation", "Personalization")}</h3>
      <label htmlFor="ac-display-name">
        {t("Nom d’affichage (facultatif)", "Display name (optional)")}
      </label>
      <input
        id="ac-display-name"
        maxLength={80}
        autoComplete="nickname"
        value={name}
        disabled={busy}
        onChange={(event) => {
          setName(event.target.value);
          setMessage(null);
        }}
      />
      <p className="ac-note">
        {t(
          "Le nom qui apparaît dans votre menu de compte. 80 caractères maximum.",
          "The name shown in your account menu. Up to 80 characters.",
        )}
      </p>
      <div className="ac-form-footer">
      <button className="ac-button ac-button--primary" disabled={busy || name.trim() === (profile.displayName ?? "")}>
        {!busy && <Check size={16} aria-hidden />}
        {busy
          ? t("Enregistrement…", "Saving…")
          : t("Enregistrer le nom", "Save name")}
      </button>
      {message && (
        <p
          role={message === "saved" ? "status" : "alert"}
          aria-label={t("Profil", "Profile")}
          className={message === "error" ? "ac-error" : "ac-notice"}
        >
          {message === "saved"
            ? t("Nom enregistré.", "Name saved.")
            : t(
                "Le nom n’a pas été enregistré. Réessayez.",
                "Your name was not saved. Try again.",
              )}
        </p>
      )}
      </div>
    </form>
  );
}
export default function AccountSettingsPage() {
  const { t, lang, prefix } = useLang();
  const account = useStackAccount();
  const experience = useAccountExperience();
  const { status } = experience;
  const publisher = usePublisherAccess();
  const profile = experience.profile?.userId === account.user?.id ? experience.profile : null;
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const location = useLocation();
  const requestedSection = location.hash.match(/^#ac-(profile|publisher|security|preferences|data)-section$/)?.[1];
  const hasPublisherSection = publisher.status !== "unavailable";
  const activeSection = !requestedSection || requestedSection === "publisher" && !hasPublisherSection ? "profile" : requestedSection;
  const workspace = publisherPath(prefix);
  const hasPendingRequests = publisher.listings.some((listing) => !listing.toolId && !["archived", "rejected"].includes(listing.status))
    || publisher.claims.some((claim) => claim.status === "pending");
  const needsOnboarding = publisher.status === "ready" && !publisher.tools.length && !hasPendingRequests;
  const roles = {
    owner: t("Propriétaire", "Owner"),
    admin: t("Administrateur de marque", "Brand administrator"),
    editor: t("Éditeur", "Editor"),
    viewer: t("Lecteur", "Viewer"),
  };
  const [preferenceFeedback, setPreferenceFeedback] = useState(false);
  useEffect(() => {
    if (!preferenceFeedback) return;
    const timer = setTimeout(() => setPreferenceFeedback(false), 2200);
    return () => clearTimeout(timer);
  }, [preferenceFeedback]);
  const [reset, setReset] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(false);
  const [exportError, setExportError] = useState(false);
  const identity = useRef(account.user?.id);
  identity.current = account.user?.id;
  useEffect(() => {
    setReset(null);
    setResetBusy(false);
    setResetCooldown(false);
    setExportError(false);
  }, [account.user?.id]);
  useEffect(() => {
    if (!resetCooldown) return;
    const timer = setTimeout(() => setResetCooldown(false), 60000);
    return () => clearTimeout(timer);
  }, [resetCooldown]);
  async function requestReset() {
    if (!account.user?.email || resetBusy || account.authBusy || resetCooldown)
      return;
    const owner = account.user.id;
    setResetBusy(true);
    setReset(null);
    try {
      const result = await account.requestPasswordReset(account.user.email, {
        lang,
      });
      if (identity.current === owner) {
        setReset(result.ok ? "sent" : result.error);
        if (
          result.ok ||
          (!result.ok && result.error === "ACCOUNT_RATE_LIMITED")
        )
          setResetCooldown(true);
      }
    } catch {
      if (identity.current === owner) setReset("ACCOUNT_AUTH_UNAVAILABLE");
    } finally {
      if (identity.current === owner) setResetBusy(false);
    }
  }
  function exportStack() {
    setExportError(false);
    const owner = account.user?.id;
    if (getPersonalStackScope() !== (owner ?? "anonymous")) {
      setExportError(true);
      return;
    }
    try {
      const json = JSON.stringify(readPersonalStack(), null, 2);
      const url = URL.createObjectURL(
        new Blob([json], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "tooltrim-stack.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError(true);
    }
  }
  const unavailable = !account.enabled;
  const expired = account.syncStatus === "session-expired";
  const authenticated = !!account.user && !expired;
  if (account.enabled && !account.authInitialized) return <p role="status">{t("Chargement du compte…", "Loading account…")}</p>;
  if (!authenticated || unavailable) return <Navigate to={prefix || "/"} replace />;
  return (
    <AccountPageFrame
      wide
      icon={<Settings2 size={24} />}
      title={t("Paramètres du compte", "Account settings")}
      intro={t(
        "Votre profil, vos préférences et vos données, au même endroit.",
        "Your profile, preferences and data, in one place.",
      )}
    >
        <div className="ac-settings-layout">
          <nav className="ac-settings-nav" aria-label={t("Rubriques des paramètres", "Settings sections")}>
            <span className="ac-nav-label">{t("Paramètres", "Settings")}</span>
            {[
              { id: "profile", label: t("Profil", "Profile"), Icon: UserRound },
              ...(hasPublisherSection ? [{ id: "publisher", label: t("Espace éditeur", "Publisher workspace"), Icon: FileText }] : []),
              { id: "security", label: t("Connexion et sécurité", "Sign-in and security"), Icon: ShieldCheck },
              { id: "preferences", label: t("Préférences", "Preferences"), Icon: Palette },
              { id: "data", label: t("Stack et données", "Stack and data"), Icon: Database },
            ].map(({ id, label, Icon }) => <Link key={id} to={`${location.pathname}#ac-${id}-section`} aria-current={activeSection === id ? "location" : undefined}><Icon size={18} aria-hidden />{label}</Link>)}
          </nav>
          <div className="ac-settings">
          <section className="ac-settings-section" id="ac-profile-section" hidden={activeSection !== "profile"} aria-labelledby="ac-profile">
            <div className="ac-section-heading">
              <h2 id="ac-profile"><UserRound size={21} aria-hidden />{t("Profil", "Profile")}</h2>
            </div>
            <div className="ac-section-content">
              {status === "loading" && !profile ? (
                <p role="status">
                  {t("Chargement du profil…", "Loading profile…")}
                </p>
              ) : profile ? (
                <>
                  <div className="ac-profile-summary">
                    <AccountAvatar ownerId={profile.userId} label={profile.displayName || profile.email || "?"} avatarUrl={profile.avatarUrl} large/>
                    <div>
                      <strong>
                        {profile.displayName || t("Mon compte", "My account")}
                      </strong>
                      <p>
                        {profile.email ??
                          t("E-mail non confirmé", "Email not confirmed")}
                      </p>
                      <small className="ac-verified">
                        {profile.emailConfirmed && <CheckCircle2 size={14} aria-hidden />}
                        {profile.emailConfirmed
                          ? t("E-mail confirmé", "Email confirmed")
                          : t("E-mail non confirmé", "Email not confirmed")}
                      </small>
                    </div>
                  </div>
                  <ProfileEditor
                    key={profile.userId}
                    profile={profile}
                    save={experience.saveDisplayName}
                  />
                  <details className="ac-profile-details">
                    <summary>{t("Informations du compte", "Account information")}</summary>
                    <dl>
                      <div><dt>{t("Compte créé le", "Joined")}</dt><dd>{new Date(profile.createdAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB")}</dd></div>
                      {profile.providerLocale && <div><dt>{t("Langue du fournisseur", "Provider language")}</dt><dd>{profile.providerLocale}</dd></div>}
                    </dl>
                  </details>
                </>
              ) : null}
              {status === "error" && (
                <>
                  <p className="ac-error" role="alert">
                    {t(
                      "Le profil est indisponible. Vos données n’ont pas été remplacées.",
                      "Your profile is unavailable. Your data has not been replaced.",
                    )}
                  </p>
                  <button className="ac-button" onClick={experience.retry}>
                    {t("Réessayer le profil", "Retry profile")}
                  </button>
                </>
              )}
            </div>
          </section>
          {hasPublisherSection && <section className="ac-settings-section" id="ac-publisher-section"
            hidden={activeSection !== "publisher"} aria-labelledby="ac-publisher">
            <div className="ac-section-heading">
              <h2 id="ac-publisher"><FileText size={21} aria-hidden />{t("Espace éditeur", "Publisher workspace")}</h2>
            </div>
            <div className="ac-section-content">
              {publisher.status === "loading" && <p role="status">{t("Chargement de vos accès…", "Loading your access…")}</p>}
              {publisher.status === "error" && <Notice title={t("Vos accès sont momentanément indisponibles.", "Your access details are temporarily unavailable.")}
                role="alert" actions={<Button onClick={publisher.retry}>{t("Réessayer", "Try again")}</Button>} />}
              {needsOnboarding && <p>
                {t("Proposez un outil ou demandez l’accès à une fiche existante si vous représentez son éditeur.", "Suggest a tool or request access to an existing listing if you represent its publisher.")}
              </p>}
              <div className={publisherStyles.actions}>
                {needsOnboarding
                  ? <Link {...buttonAttrs("primary")} to={`${workspace}#publisher-new`}>{t("Proposer un outil", "Suggest a tool")}</Link>
                  : <Link {...buttonAttrs("primary")} to={workspace}>{t("Ouvrir Mes fiches", "Open My listings")}</Link>}
                {publisher.status === "ready" && !needsOnboarding && <Link {...buttonAttrs()} to={`${workspace}#publisher-new`}>
                  {t("Proposer un autre outil", "Suggest another tool")}
                </Link>}
                <Link {...buttonAttrs()} to={`${workspace}?invite=manual`}>{t("Accepter une invitation", "Accept an invitation")}</Link>
              </div>
              {publisher.status === "ready" && <>
                {publisher.listings.length > 0 && <section className={publisherStyles.fields} aria-labelledby="ac-publisher-billing">
                  <h3 id="ac-publisher-billing">{t("Offres et paiements", "Offers and payments")}</h3>
                  <div className={publisherStyles.cards}>
                    {publisher.listings.map((listing) => {
                      const label = listing.offer === "priority_paid" ? t("Voir le paiement", "View payment") : t("Voir le badge", "View badge");
                      return <article className={publisherStyles.card} key={listing.id}>
                        <strong>{listing.name}</strong>
                        <p>{listingOfferLabel(listing.offer, t)}</p>
                        <p>{listingCommercialLabel(listing.offer, listing.commercialStatus, t)}</p>
                        <div className={publisherStyles.actions}>
                          <Link className={linkClass("inline")} aria-label={`${label} · ${listing.name}`}
                            to={`${workspace}?listingId=${encodeURIComponent(listing.id)}#publisher-listing-offer`}>{label}</Link>
                        </div>
                      </article>;
                    })}
                  </div>
                </section>}
                {publisher.tools.length > 0 && <>
                  <h3>{t("Vos droits par fiche", "Your access by listing")}</h3>
                  <div className={publisherStyles.cards}>{publisher.tools.map((tool) => {
                    const application = publisher.listings.find(({ toolId }) => toolId === tool.id);
                    const awaitingPublication = application && ["unpublished", "publishing"].includes(application.deliveryStatus);
                    const destination = awaitingPublication
                      ? `${workspace}?listingId=${encodeURIComponent(application.id)}` : publisherPath(prefix, tool.slug);
                    const action = awaitingPublication ? t("Suivre la publication", "Track publication")
                      : tool.canEdit ? t("Modifier la fiche", "Edit listing") : t("Consulter la fiche", "View listing");
                    return <article className={publisherStyles.card} key={tool.id}>
                      <strong>{tool.name}</strong>
                      <p>{tool.role && `${roles[tool.role]} · `}{tool.canEdit
                        ? t("Modification autorisée", "Editing allowed") : t("Lecture seule", "Read-only access")}</p>
                      <div className={publisherStyles.actions}>
                        <Link className={linkClass("inline")} to={destination}>{action}</Link>
                      </div>
                    </article>;
                  })}</div>
                </>}
                {hasPendingRequests && <p>{t("Retrouvez vos demandes et leur avancement dans Mes fiches.", "Find your applications and their progress in My listings.")}</p>}
              </>}
            </div>
          </section>}
          <section
            className="ac-settings-section"
            id="ac-security-section" hidden={activeSection !== "security"} aria-labelledby="ac-security"
          >
            <div className="ac-section-heading">
              <h2 id="ac-security"><ShieldCheck size={21} aria-hidden />
                {t("Connexion et sécurité", "Sign-in and security")}
              </h2>
              <p>
                {t(
                  "Les méthodes associées à votre compte.",
                  "The sign-in methods linked to your account.",
                )}
              </p>
            </div>
            <div className="ac-section-content">
              <ul className="ac-identities">
                {[
                  ...new Set(
                    account.user?.identities?.map(
                      (identity) => identity.provider,
                    ) ?? [],
                  ),
                ].map((provider) => (
                  <li key={provider}>
                    <strong>
                      {provider === "email"
                        ? t("E-mail", "Email")
                        : provider === "google"
                          ? "Google"
                          : provider === "github"
                            ? "GitHub"
                            : provider}
                    </strong>
                    <span>{t("Associé", "Connected")}</span>
                  </li>
                ))}
              </ul>
              {!account.user?.identities?.length && (
                <p>
                  {t(
                    "Aucune méthode de connexion confirmée à afficher.",
                    "No confirmed sign-in method to display.",
                  )}
                </p>
              )}
              <p>
                {t(
                  "Un lien par e-mail permet de définir ou réinitialiser votre mot de passe.",
                  "An email link lets you set or reset your password.",
                )}
              </p>
              <div className="ac-actions">
                <button
                  className="ac-button"
                  disabled={
                    !account.user?.email ||
                    resetBusy ||
                    account.authBusy ||
                    resetCooldown
                  }
                  onClick={() => void requestReset()}
                >
                  {t("Recevoir un lien de mot de passe", "Send password link")}
                </button>
                <button
                  className="ac-text-button"
                  disabled={account.authBusy}
                  onClick={experience.requestSignOut}
                >
                  {t("Me déconnecter", "Sign out")}
                </button>
              </div>
              {reset && (
                <p
                  role={reset === "sent" ? "status" : "alert"}
                  className={reset === "sent" ? "ac-notice" : "ac-error"}
                >
                  {reset === "sent"
                    ? t(
                        "Si cette adresse peut recevoir ce message, un lien vous sera envoyé.",
                        "If this address can receive this message, a link will be sent.",
                      )
                    : accountErrorMessage(reset, t)}
                </p>
              )}
            </div>
          </section>
          <section
            className="ac-settings-section"
            id="ac-preferences-section" hidden={activeSection !== "preferences"} aria-labelledby="ac-preferences"
          >
            <div className="ac-section-heading">
              <h2 id="ac-preferences"><Palette size={21} aria-hidden />
                {t("Préférences d’affichage", "Display preferences")}
              </h2>
              <p>
                {t(
                  "Ces choix sont enregistrés sur cet appareil.",
                  "These choices are saved on this device.",
                )}
              </p>
            </div>
            <div className="ac-section-content ac-form">
              <fieldset className="ac-preference-group">
                <legend>{t("Thème", "Theme")}</legend>
                <div className="ac-theme-choices">
                  {(["light", "dark"] as const).map(value => {
                    const ThemeIcon = value === "light" ? Sun : Moon;
                    return <label className="ac-option" key={value}>
                      <input type="radio" name="account-theme" value={value} checked={theme === value} onChange={() => { setTheme(value); setPreferenceFeedback(true); }} />
                      <span className="ac-option-body">
                        <span className={`ac-theme-preview ac-theme-preview--${value}`} aria-hidden><i /><i /><i /></span>
                        <span className="ac-option-caption"><ThemeIcon size={18} aria-hidden />{value === "light" ? t("Clair", "Light") : t("Sombre", "Dark")}<CheckCircle2 size={17} className="ac-option-check" aria-hidden /></span>
                      </span>
                    </label>;
                  })}
                </div>
              </fieldset>
              <fieldset className="ac-preference-group">
                <legend>{t("Devise", "Currency")}</legend>
                <div className="ac-segmented">
                  {(["EUR", "USD", "GBP"] as Currency[]).map(value => <label className="ac-option" key={value}>
                    <input type="radio" name="account-currency" value={value} checked={currency === value} onChange={() => { setCurrency(value); setPreferenceFeedback(true); }} />
                    <span className="ac-option-body"><span aria-hidden>{value === "EUR" ? "€" : value === "USD" ? "$" : "£"}</span>{value}<Check size={15} className="ac-option-check" aria-hidden /></span>
                  </label>)}
                </div>
              </fieldset>
              <span className="ac-preference-label">{t("Langue", "Language")}</span>
              <div className="ac-language-choices">
                <Link
                  className="ac-language-option"
                  to={`${accountPath("fr", "settings")}#ac-preferences-section`}
                  aria-current={lang === "fr" ? "page" : undefined}
                >
                  <AccountLanguageIcon language="fr" />Français
                  {lang === "fr" && <Check size={15} aria-hidden />}
                </Link>
                <Link
                  className="ac-language-option"
                  to={`${accountPath("en", "settings")}#ac-preferences-section`}
                  aria-current={lang === "en" ? "page" : undefined}
                >
                  <AccountLanguageIcon language="en" />English
                  {lang === "en" && <Check size={15} aria-hidden />}
                </Link>
              </div>
              <span className="ac-preference-feedback" aria-label={t("Préférences", "Preferences")} role="status" aria-live="polite">{preferenceFeedback && <><CheckCircle2 size={15} aria-hidden />{t("Préférence appliquée", "Preference applied")}</>}</span>
            </div>
          </section>
          <section className="ac-settings-section" id="ac-data-section" hidden={activeSection !== "data"} aria-labelledby="ac-data">
            <div className="ac-section-heading">
              <h2 id="ac-data"><Database size={21} aria-hidden />{t("Stack et données", "Stack and data")}</h2>
              <p>
                {t(
                  "Gardez une copie et contrôlez vos données.",
                  "Keep a copy and control your data.",
                )}
              </p>
            </div>
            <div className="ac-section-content">
              <AccountStackStatus key={account.user?.id} />
              <div className="ac-actions">
                <Link className="ac-button" to={`${prefix}/ma-stack`}>
                  {t("Ouvrir Ma stack", "Open My stack")}
                </Link>
                <button className="ac-button" onClick={exportStack}>
                  <Download size={17} aria-hidden />
                  {t("Exporter ma stack en JSON", "Export my stack as JSON")}
                </button>
              </div>
              <p className="ac-note">
                {account.syncStatus === "synced"
                  ? t(
                      "L’export contient la version présente sur cet appareil.",
                      "The export contains the version currently on this device.",
                    )
                  : t(
                      "La version sur cet appareil n’est pas synchronisée. L’export peut différer de votre sauvegarde en ligne.",
                      "The version on this device is not synced. Your export may differ from your online backup.",
                    )}
              </p>
              {exportError && (
                <p className="ac-error" role="alert">
                  {t(
                    "L’export est indisponible pendant le chargement de votre stack. Réessayez.",
                    "Export is unavailable while your stack loads. Try again.",
                  )}
                </p>
              )}
              <div className="ac-danger-zone">
                <h3>{t("Supprimer mon compte", "Delete my account")}</h3>
                <p>
                  {t(
                    "La suppression est définitive. Une confirmation vous sera demandée.",
                    "Deletion is permanent. You will be asked to confirm.",
                  )}
                </p>
                <button
                  className="ac-text-button ac-danger"
                  disabled={account.authBusy}
                  onClick={experience.requestDeleteAccount}
                >
                  {t("Supprimer mon compte", "Delete my account")}
                </button>
              </div>
            </div>
          </section>
          </div>
        </div>
    </AccountPageFrame>
  );
}
