import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency, type Currency } from "@/hooks/useCurrency";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import AccountPageFrame from "@/components/account/AccountPageFrame";
import AccountStackStatus from "@/components/account/AccountStackStatus";
import { accountErrorMessage } from "@/components/account/accountMessages";
import { accountPath } from "@/lib/accountPaths";
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
    <form className="ac-form" onSubmit={submit}>
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
      <button className="ac-button" disabled={busy}>
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
    </form>
  );
}
export default function AccountSettingsPage() {
  const { t, lang, prefix } = useLang();
  const account = useStackAccount();
  const experience = useAccountExperience();
  const { profile, status } = experience;
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
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
  return (
    <AccountPageFrame
      title={t("Paramètres du compte", "Account settings")}
      intro={t(
        "Votre profil, vos préférences et vos données, au même endroit.",
        "Your profile, preferences and data, in one place.",
      )}
    >
      {!authenticated || unavailable ? (
        <section className="ac-settings-section">
          <h2>{t("Votre espace ToolTrim", "Your ToolTrim space")}</h2>
          <p>
            {unavailable
              ? t(
                  "Les comptes seront bientôt disponibles.",
                  "Accounts will be available soon.",
                )
              : expired
                ? t("Votre session a expiré.", "Your session expired.")
                : t(
                    "Connectez-vous pour retrouver votre profil et votre stack enregistrée.",
                    "Sign in to access your profile and saved stack.",
                  )}
          </p>
          {!unavailable && (
            <button
              className="ac-button ac-button--primary"
              onClick={() =>
                experience.openAuth("signin", accountPath(lang, "settings"))
              }
            >
              {t("Se connecter", "Sign in")}
            </button>
          )}
          <Link className="ac-text-button" to={`${prefix}/ma-stack`}>
            {t(
              "Retrouver ma stack sur cet appareil",
              "Open my stack on this device",
            )}
          </Link>
          {!account.user && (
            <button className="ac-button" onClick={exportStack}>
              {t("Exporter ma stack en JSON", "Export my stack as JSON")}
            </button>
          )}
          {exportError && (
            <p role="alert">
              {t(
                "Export indisponible. Réessayez.",
                "Export unavailable. Try again.",
              )}
            </p>
          )}
        </section>
      ) : (
        <div className="ac-settings">
          <section className="ac-settings-section" aria-labelledby="ac-profile">
            <div className="ac-section-heading">
              <h2 id="ac-profile">{t("Profil", "Profile")}</h2>
              <p>
                {t(
                  "Juste l’essentiel pour vous retrouver.",
                  "Just the essentials to make this space yours.",
                )}
              </p>
            </div>
            <div className="ac-section-content">
              {status === "loading" && !profile ? (
                <p role="status">
                  {t("Chargement du profil…", "Loading profile…")}
                </p>
              ) : profile ? (
                <>
                  <div className="ac-profile-summary">
                    <span className="ac-avatar ac-avatar--large" aria-hidden>
                      {(profile.displayName || profile.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                    <div>
                      <strong>
                        {profile.displayName || t("Mon compte", "My account")}
                      </strong>
                      <p>
                        {profile.email ??
                          t("E-mail non confirmé", "Email not confirmed")}
                      </p>
                      <small>
                        {profile.emailConfirmed
                          ? t("E-mail confirmé", "Email confirmed")
                          : t("E-mail non confirmé", "Email not confirmed")}
                      </small>
                      <p className="ac-note">
                        {t("Compte créé le ", "Joined ")}
                        {new Date(profile.createdAt).toLocaleDateString(
                          lang === "fr" ? "fr-FR" : "en-GB",
                        )}
                      </p>
                    </div>
                  </div>
                  <ProfileEditor
                    key={profile.userId}
                    profile={profile}
                    save={experience.saveDisplayName}
                  />
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
          <section
            className="ac-settings-section"
            aria-labelledby="ac-security"
          >
            <div className="ac-section-heading">
              <h2 id="ac-security">
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
            aria-labelledby="ac-preferences"
          >
            <div className="ac-section-heading">
              <h2 id="ac-preferences">
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
              <label htmlFor="ac-theme">{t("Thème", "Theme")}</label>
              <select
                id="ac-theme"
                value={theme}
                onChange={(event) =>
                  setTheme(event.target.value as "light" | "dark")
                }
              >
                <option value="light">{t("Clair", "Light")}</option>
                <option value="dark">{t("Sombre", "Dark")}</option>
              </select>
              <label htmlFor="ac-currency">{t("Devise", "Currency")}</label>
              <select
                id="ac-currency"
                value={currency}
                onChange={(event) =>
                  setCurrency(event.target.value as Currency)
                }
              >
                <option>EUR</option>
                <option>USD</option>
                <option>GBP</option>
              </select>
              <span>{t("Langue", "Language")}</span>
              <div className="ac-actions">
                <Link
                  className="ac-text-button"
                  to={accountPath("fr", "settings")}
                  aria-current={lang === "fr" ? "page" : undefined}
                >
                  Français
                </Link>
                <Link
                  className="ac-text-button"
                  to={accountPath("en", "settings")}
                  aria-current={lang === "en" ? "page" : undefined}
                >
                  English
                </Link>
              </div>
            </div>
          </section>
          <section className="ac-settings-section" aria-labelledby="ac-data">
            <div className="ac-section-heading">
              <h2 id="ac-data">{t("Stack et données", "Stack and data")}</h2>
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
      )}
    </AccountPageFrame>
  );
}
