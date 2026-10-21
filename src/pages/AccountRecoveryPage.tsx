import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { accountPath } from "@/lib/accountPaths";
import AccountAuthForm from "@/components/account/AccountAuthForm";
import AccountPageFrame from "@/components/account/AccountPageFrame";
import { accountErrorMessage } from "@/components/account/accountMessages";
export default function AccountRecoveryPage() {
  const { t, lang } = useLang();
  const account = useStackAccount();
  const id = useId();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [warning, setWarning] = useState(false);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setPassword("");
    setConfirmation("");
    setShow(false);
    setDone(false);
    setWarning(false);
    setError(null);
    setBusy(false);
  }, [account.user?.id]);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || account.authBusy) return;
    if (password !== confirmation) {
      setError("MISMATCH");
      return;
    }
    if (password.length < 8) {
      setError("ACCOUNT_PASSWORD_TOO_SHORT");
      return;
    }
    const current = generation.current;
    setBusy(true);
    setError(null);
    try {
      const result = await account.completePasswordReset(password);
      if (current !== generation.current) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPassword("");
      setConfirmation("");
      setDone(true);
      setWarning(!!result.warning);
    } catch {
      if (current === generation.current) setError("ACCOUNT_AUTH_UNAVAILABLE");
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  return (
    <AccountPageFrame narrow title={t("Nouveau mot de passe", "New password")}>
      <div className="ac-auth-card">
        {!account.enabled ? (
          <p>
            {t(
              "La récupération est indisponible.",
              "Password recovery is unavailable.",
            )}
          </p>
        ) : !account.authInitialized ? (
          <p role="status">
            {t("Vérification de votre lien…", "Checking your recovery link…")}
          </p>
        ) : done ? (
          <>
            <p className="ac-notice" role="status">
              {t(
                "Votre mot de passe a été modifié.",
                "Your password has been changed.",
              )}
            </p>
            {warning && (
              <p className="ac-error" role="alert">
                {t(
                  "La fermeture des autres sessions n’a pas été confirmée. Le nouveau mot de passe est enregistré ; contactez ToolTrim si vous devez sécuriser ces autres sessions.",
                  "Closing other sessions was not confirmed. Your new password is saved; contact ToolTrim if you need to secure those other sessions.",
                )}
              </p>
            )}
            <Link className="ac-button" to={accountPath(lang, "settings")}>
              {t("Ouvrir mes paramètres", "Open my settings")}
            </Link>
          </>
        ) : account.recoveryStatus === "ready" ? (
          <form
            className="ac-form"
            onSubmit={submit}
            aria-busy={busy || account.authBusy}
          >
            <label htmlFor={`${id}-new`}>
              {t("Nouveau mot de passe", "New password")}
            </label>
            <input
              id={`${id}-new`}
              autoComplete="new-password"
              type={show ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy || account.authBusy}
            />
            <p className="ac-note">
              {t(
                "8 caractères minimum. Les phrases et espaces sont acceptés.",
                "At least 8 characters. Phrases and spaces are welcome.",
              )}
            </p>
            <label htmlFor={`${id}-confirm`}>
              {t("Confirmer le mot de passe", "Confirm password")}
            </label>
            <input
              id={`${id}-confirm`}
              autoComplete="new-password"
              type={show ? "text" : "password"}
              required
              minLength={8}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={busy || account.authBusy}
            />
            <button
              type="button"
              className="ac-text-button"
              aria-pressed={show}
              onClick={() => setShow(!show)}
            >
              {show
                ? t("Masquer les mots de passe", "Hide passwords")
                : t("Afficher les mots de passe", "Show passwords")}
            </button>
            {error && (
              <p className="ac-error" role="alert">
                {error === "MISMATCH"
                  ? t(
                      "Les mots de passe ne correspondent pas.",
                      "Passwords do not match.",
                    )
                  : accountErrorMessage(error, t)}
              </p>
            )}
            <button
              className="ac-button ac-button--primary"
              disabled={busy || account.authBusy}
            >
              {t("Enregistrer le nouveau mot de passe", "Save new password")}
            </button>
          </form>
        ) : account.recoveryStatus === "complete" ? (
          <>
            <p role="status">
              {t(
                "Votre mot de passe a été modifié.",
                "Your password has been changed.",
              )}
            </p>
            <Link to={accountPath(lang, "settings")}>
              {t("Ouvrir mes paramètres", "Open my settings")}
            </Link>
          </>
        ) : (
          <>
            <p className="ac-error">
              {t(
                "Ce lien est invalide ou expiré. Demandez un nouveau lien.",
                "This link is invalid or expired. Request a new link.",
              )}
            </p>
            <AccountAuthForm
              mode="signin"
              initialReset
              onModeChange={() => undefined}
              onAuthenticated={() => undefined}
            />
          </>
        )}
      </div>
    </AccountPageFrame>
  );
}
