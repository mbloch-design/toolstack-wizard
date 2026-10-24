import { loadStackPage } from "@/lib/stackPageLoader";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useLang } from "@/hooks/useLang";
import { useStackAccount, type AuthResult } from "@/hooks/useStackAccount";
import {
  ACCOUNT_GOOGLE_ENABLED,
  ACCOUNT_GITHUB_ENABLED,
} from "@/config/features";
import { Mail, ArrowRight } from "@/lib/icons";
import AccountProviderIcon from "./AccountProviderIcon";
import { accountErrorMessage } from "./accountMessages";
export type AuthMode = "signin" | "signup";
export default function AccountAuthForm({
  mode,
  onModeChange,
  onAuthenticated,
  returnTo,
  initialReset = false,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: () => void;
  returnTo?: string;
  initialReset?: boolean;
}) {
  const { t, lang } = useLang();
  useEffect(() => {
    if (!initialReset) void loadStackPage().catch(() => undefined);
  }, [initialReset]);
  const account = useStackAccount();
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"providers" | "email" | "confirm" | "reset">(
    initialReset ? "reset" : "providers",
  );
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const locked = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const disabled = busy || account.authBusy;
  useEffect(() => {
    generation.current++;
    setPassword("");
    setEmail("");
    setShow(false);
    setError(null);
    setSent(false);
    setBusy(false);
    locked.current = false;
    setStep(initialReset ? "reset" : "providers");
  }, [mode, account.user?.id, initialReset]);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  useEffect(() => {
    if (step === "email" || step === "reset") emailRef.current?.focus();
  }, [step]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function run(action: () => Promise<AuthResult>, emailAction = false) {
    if (disabled || locked.current) return;
    const current = generation.current;
    locked.current = true;
    setBusy(true);
    setError(null);
    setSent(false);
    try {
      const result = await action();
      if (current !== generation.current) return;
      if (!result.ok) {
        setError(result.error);
        if (result.error === "ACCOUNT_RATE_LIMITED") setCooldown(60);
        return;
      }
      setPassword("");
      setShow(false);
      if (result.outcome === "confirmation-required") {
        setStep("confirm");
        setCooldown(60);
      } else if (result.outcome === "email-sent") {
        setSent(true);
        setCooldown(60);
      } else if (result.outcome === "signed-in") onAuthenticated();
      if (emailAction) setCooldown(60);
    } catch {
      if (current === generation.current) setError("ACCOUNT_AUTH_UNAVAILABLE");
    } finally {
      if (current === generation.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (step === "reset") {
      void run(
        () => account.requestPasswordReset(email, { lang, returnTo }),
        true,
      );
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("ACCOUNT_PASSWORD_TOO_SHORT");
      return;
    }
    void run(() =>
      mode === "signup"
        ? account.signUpWithPassword(email, password, { lang, returnTo })
        : account.signInWithPassword(email, password, { lang, returnTo }),
    );
  }
  return (
    <div className="ac-auth" aria-busy={disabled}>
      {step !== "confirm" && step !== "reset" && (
        <>
          <div className="ac-providers">
            {(["google", "github"] as const).map((provider) => {
              const ready =
                provider === "google"
                  ? ACCOUNT_GOOGLE_ENABLED
                  : ACCOUNT_GITHUB_ENABLED;
              const name = provider === "google" ? "Google" : "GitHub";
              return (
                <button
                  type="button"
                  className={`ac-button ac-provider ac-provider--${provider}`}
                  key={provider}
                  disabled={disabled || !ready}
                  onClick={() =>
                    void run(() =>
                      account.signInWithProvider(provider, { lang, returnTo }),
                    )
                  }
                >
                  <AccountProviderIcon provider={provider} />
                  <span>{t(`Continuer avec ${name}`, `Continue with ${name}`)}</span>
                  {!ready && (
                    <small>
                      {t("Bientôt disponible", "Not available yet")}
                    </small>
                  )}
                </button>
              );
            })}
          </div>
          {account.lastAuthMethod && (
            <p className="ac-note">
              {t("Dernière méthode utilisée : ", "Last used: ")}
              {account.lastAuthMethod === "email"
                ? "E-mail"
                : account.lastAuthMethod === "google"
                  ? "Google"
                  : "GitHub"}
            </p>
          )}
          <div className="ac-divider">
            <span>{t("ou", "or")}</span>
          </div>
        </>
      )}
      {step === "providers" && (
        <button
          type="button"
          className="ac-button"
          disabled={disabled}
          onClick={() => setStep("email")}
        >
          <Mail size={20} aria-hidden />
          {t("Continuer avec l’e-mail", "Continue with email")}
          <ArrowRight size={17} aria-hidden />
        </button>
      )}
      {(step === "email" || step === "reset") && (
        <form className="ac-form" onSubmit={submit}>
          {step === "reset" && (
            <p>
              {t(
                "Recevez un lien pour définir un nouveau mot de passe.",
                "Receive a link to set a new password.",
              )}
            </p>
          )}
          <label htmlFor={`${id}-email`}>
            {t("Adresse e-mail", "Email address")}
          </label>
          <input
            ref={emailRef}
            id={`${id}-email`}
            type="email"
            autoComplete="username"
            maxLength={254}
            required
            value={email}
            disabled={disabled}
            onChange={(event) => setEmail(event.target.value)}
          />
          {step === "email" && (
            <>
              <label htmlFor={`${id}-password`}>
                {t("Mot de passe", "Password")}
              </label>
              <div className="ac-password">
                <input
                  id={`${id}-password`}
                  type={show ? "text" : "password"}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  minLength={mode === "signup" ? 8 : undefined}
                  required
                  value={password}
                  disabled={disabled}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="ac-text-button"
                  aria-label={
                    show
                      ? t("Masquer le mot de passe", "Hide password")
                      : t("Afficher le mot de passe", "Show password")
                  }
                  aria-pressed={show}
                  onClick={() => setShow(!show)}
                >
                  {show ? t("Masquer", "Hide") : t("Afficher", "Show")}
                </button>
              </div>
              {mode === "signup" ? (
                <p className="ac-note">
                  {t(
                    "8 caractères minimum. Les phrases et espaces sont acceptés.",
                    "At least 8 characters. Phrases and spaces are welcome.",
                  )}
                </p>
              ) : (
                <button
                  className="ac-text-button"
                  type="button"
                  onClick={() => {
                    setPassword("");
                    setError(null);
                    setStep("reset");
                  }}
                >
                  {t("Mot de passe oublié ?", "Forgot password?")}
                </button>
              )}
            </>
          )}
          <button
            className="ac-button ac-button--primary"
            type="submit"
            disabled={disabled || (step === "reset" && cooldown > 0)}
          >
            {disabled
              ? t("Patientez…", "Please wait…")
              : step === "reset"
                ? t("Envoyer le lien", "Send link")
                : mode === "signup"
                  ? t("Créer mon compte", "Create my account")
                  : t("Se connecter", "Sign in")}
          </button>
        </form>
      )}
      {step === "confirm" && (
        <div className="ac-confirm">
          <h3>{t("Vérifiez votre e-mail", "Check your email")}</h3>
          <p>
            {t(
              `Ouvrez le lien envoyé à ${email} pour confirmer votre compte.`,
              `Open the link sent to ${email} to confirm your account.`,
            )}
          </p>
        </div>
      )}
      {(step === "confirm" || error === "ACCOUNT_EMAIL_UNCONFIRMED") && (
        <button
          className="ac-button"
          type="button"
          disabled={disabled || cooldown > 0}
          onClick={() =>
            void run(
              () => account.resendConfirmation(email, { lang, returnTo }),
              true,
            )
          }
        >
          {t("Renvoyer le lien de confirmation", "Resend confirmation link")}
          {cooldown > 0 ? ` (${cooldown}s)` : ""}
        </button>
      )}
      {error && (
        <p className="ac-error" role="alert">
          {accountErrorMessage(error, t)}
        </p>
      )}
      {sent && (
        <p className="ac-notice" role="status">
          {t(
            "Si cette adresse peut recevoir ce message, un lien vous sera envoyé. Consultez aussi les courriers indésirables.",
            "If this address can receive this message, a link will be sent. Check your spam folder too.",
          )}
        </p>
      )}
      {step === "reset" && cooldown > 0 && (
        <p className="ac-note">
          {t(`Nouvel envoi dans ${cooldown} s.`, `Send again in ${cooldown}s.`)}
        </p>
      )}
      <div className="ac-auth-footer">
        {step === "confirm" || step === "reset" ? (
          <button
            type="button"
            className="ac-text-button"
            onClick={() => {
              setPassword("");
              setStep("email");
              setError(null);
              setSent(false);
              onModeChange("signin");
            }}
          >
            {t("Retour à la connexion", "Back to sign in")}
          </button>
        ) : (
          <>
            <span>
              {mode === "signin"
                ? t("Pas encore de compte ?", "New to ToolTrim?")
                : t("Déjà un compte ?", "Already have an account?")}
            </span>
            <button
              type="button"
              className="ac-text-button"
              onClick={() =>
                onModeChange(mode === "signin" ? "signup" : "signin")
              }
            >
              {mode === "signin"
                ? t("Créer un compte", "Create an account")
                : t("Se connecter", "Sign in")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
