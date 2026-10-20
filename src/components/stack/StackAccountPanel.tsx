import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { Cloud, Check, Mail, LogOut } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { getStackAccountLabel, useStackAccount } from "@/hooks/useStackAccount";

const RESEND_SECONDS = 60;

export default function StackAccountPanel() {
  const account = useStackAccount();
  const { t, lang } = useLang();
  const location = useLocation();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [nextSendAt, setNextSendAt] = useState(0);
  const [now, setNow] = useState(0);
  const [dismissLogout, setDismissLogout] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  const interaction = useRef(0);
  const restoreTriggerFocus = useRef(false);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const deleteConfirm = useRef<HTMLButtonElement>(null);
  const restoreDeleteFocus = useRef(false);
  const seconds = Math.max(0, Math.ceil((nextSendAt - now) / 1000));
  const expired = account.syncStatus === "session-expired";
  const needsAuth = !account.user || expired;
  const authOptions = { lang, returnTo: `${location.pathname}${location.search}${location.hash}` };
  const cancelledOAuth = [location.search, location.hash.replace(/^#/, "?")].some(value => new URLSearchParams(value).get("error") === "access_denied");
  const error = localError || account.error || (cancelledOAuth && !account.user ? "ACCOUNT_GOOGLE_SIGN_IN_FAILED" : null);
  const invalidCode = step === "code" && error === "ACCOUNT_EMAIL_CODE_INVALID";
  const candidate = getStackAccountLabel(account.user);
  const accountLabel = typeof candidate === "string" && candidate.trim() ? candidate
    : typeof account.user?.email === "string" ? account.user.email : t("Mon compte", "My account");

  useEffect(() => {
    interaction.current++;
    setEmail(""); setSentTo(""); setCode(""); setLocalError(null); setBusy(null);
    setStep("email"); setOpen(false); setDeleteOpen(false); setNextSendAt(0); setNow(0); setDismissLogout(false);
  }, [account.user?.id, account.deletionConfirmed]);
  useEffect(() => () => { interaction.current++; }, []);
  useEffect(() => {
    if (deleteOpen) deleteConfirm.current?.focus();
    else if (restoreDeleteFocus.current) { restoreDeleteFocus.current = false; deleteTrigger.current?.focus(); }
  }, [deleteOpen]);

  useEffect(() => {
    if (open) (step === "code" ? codeInput : emailInput).current?.focus();
    else if (restoreTriggerFocus.current) {
      restoreTriggerFocus.current = false;
      trigger.current?.focus();
    }
  }, [open, step]);
  useEffect(() => {
    if (!nextSendAt) return;
    const timer = window.setInterval(() => {
      const value = Date.now(); setNow(value);
      if (value >= nextSendAt) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [nextSendAt]);

  if (!account.enabled) return null;

  function errorMessage(value: string) {
    switch (value) {
      case "ACCOUNT_GOOGLE_SIGN_IN_FAILED": return t("La connexion Google n’a pas abouti. Votre sélection est conservée.", "Google sign-in did not complete. Your selection is preserved.");
      case "ACCOUNT_EMAIL_CODE_INVALID": return t("Code incorrect ou expiré. Vérifiez le code ou demandez-en un nouveau.", "Incorrect or expired code. Check the code or request a new one.");
      case "ACCOUNT_EMAIL_CODE_FAILED": return t("Le code n’a pas pu être envoyé. Réessayez dans un instant.", "The code could not be sent. Try again shortly.");
      case "ACCOUNT_SESSION_INVALID": return t("Votre session a expiré. Reconnectez-vous pour enregistrer vos modifications.", "Your session expired. Sign in again to save your changes.");
      case "STACK_REVISION_CONFLICT": return t("Une autre version a été enregistrée. Choisissez la version à conserver.", "Another version was saved. Choose which version to keep.");
      case "ACCOUNT_SIGN_OUT_FAILED": return t("La déconnexion a échoué. Réessayez.", "Sign-out failed. Please try again.");
      case "ACCOUNT_DELETION_FAILED": return t("La suppression n’a pas abouti. Vous pouvez réessayer ; votre compte reste protégé pendant la reprise.", "Deletion did not complete. You can retry; your account remains protected while you do.");
      case "ACCOUNT_HAS_CONTRIBUTIONS": return t("Ce compte est lié à des contributions. La suppression est interrompue pour préserver leur historique. Contactez ToolTrim pour organiser la suite.", "This account is linked to contributions. Deletion is paused to preserve their history. Contact ToolTrim to arrange the next step.");
      case "ACCOUNT_DELETION_UNCONFIRMED": return t("Votre session s’est terminée et la suppression n’a pas été confirmée. Vous pouvez effacer les données de cet appareil sans confirmer la suppression du compte.", "Your session ended and account deletion was not confirmed. You can clear this device without confirming remote account deletion.");
      default: return t("L’enregistrement est indisponible pour le moment. Votre sélection reste disponible sur cet appareil.", "Saving is unavailable right now. Your selection remains available on this device.");
    }
  }
  async function run(name: string, action: () => Promise<boolean>, failure?: string) {
    if (busy) return false;
    const version = interaction.current;
    setBusy(name); setLocalError(null);
    try {
      const ok = await action();
      if (version !== interaction.current) return false;
      if (!ok && failure) setLocalError(failure);
      return ok;
    } catch {
      if (version === interaction.current) setLocalError(failure || "STACK_ACCOUNT_UNAVAILABLE");
      return false;
    } finally { if (version === interaction.current) setBusy(null); }
  }
  function cancel() {
    restoreTriggerFocus.current = true;
    interaction.current++; setBusy(null); setOpen(false); setLocalError(null);
  }
  async function send(event?: FormEvent) {
    event?.preventDefault();
    if (busy || seconds > 0) return;
    const normalized = (step === "code" ? sentTo : email).trim().toLowerCase();
    if (!normalized) return;
    const time = Date.now(); setNow(time); setNextSendAt(time + RESEND_SECONDS * 1000);
    if (await run("send", () => account.sendEmailCode(normalized, authOptions), "ACCOUNT_EMAIL_CODE_FAILED")) {
      setSentTo(normalized); setStep("code"); setCode(""); codeInput.current?.focus();
    }
  }
  async function verify(event: FormEvent) {
    event.preventDefault();
    if (code.length < 6) return;
    if (await run("verify", () => account.verifyEmailCode(sentTo, code), "ACCOUNT_EMAIL_CODE_INVALID")) setOpen(false);
  }
  const status = account.syncStatus === "synced" ? t("Enregistré", "Saved")
    : account.syncStatus === "syncing" ? t("Enregistrement…", "Saving…")
      : account.syncStatus === "connecting" ? t("Connexion…", "Connecting…")
        : account.syncStatus === "local" ? t("Sur cet appareil", "On this device") : t("Non enregistré", "Not saved");

  return <section className="ms-account" aria-labelledby={`${id}-title`}>
    <div className="ms-account-bar">
      <div className="ms-account-summary">
        {account.syncStatus === "synced" ? <Check size={20} aria-hidden /> : <Cloud size={20} aria-hidden />}
        <div><h2 id={`${id}-title`}>{account.user ? accountLabel : t("Votre stack, d’un appareil à l’autre", "Your stack, across your devices")}</h2>
          <p role="status" aria-live="polite">{status}{!account.user && account.syncStatus === "local" ? t(" · Enregistrez-la pour la retrouver ailleurs.", " · Save it to find it elsewhere.") : ""}</p></div>
      </div>
      <div className="ms-account-actions">
        {needsAuth && <button ref={trigger} type="button" className="tt-button-primary ms-account-button" disabled={!!busy} aria-expanded={open} aria-controls={`${id}-auth`}
          onClick={() => { interaction.current++; setOpen(!open); setLocalError(null); }}>
          {expired ? t("Me reconnecter", "Sign in again") : t("Enregistrer ma stack", "Save my stack")}
        </button>}
        {account.user && <button type="button" className="ms-account-text-button" disabled={!!busy} onClick={() => { setDismissLogout(false); void run("logout", () => account.signOut()); }}>
          <LogOut size={16} aria-hidden />{t("Se déconnecter", "Sign out")}
        </button>}
        {account.user && !expired && <button ref={deleteTrigger} type="button" className="ms-account-text-button" disabled={!!busy} aria-expanded={deleteOpen} aria-controls={`${id}-delete`}
          onClick={() => setDeleteOpen(true)}>{t("Supprimer mon compte", "Delete my account")}</button>}
        {account.user && !expired && !account.pendingDraftChoice && !account.conflict && (account.syncStatus === "error" || account.syncStatus === "unsaved") &&
          <button type="button" className="tt-button-primary ms-account-button" disabled={!!busy} onClick={() => void run("retry", account.retry)}>{t("Réessayer", "Try again")}</button>}
      </div>
    </div>
    {error && <p id={`${id}-error`} className="ms-account-error" role="alert">{errorMessage(error)}</p>}
    {account.deletionConfirmed && <p role="status">{t("Votre compte a été supprimé.", "Your account was deleted.")}</p>}
    {account.privacyWarning && <p className="ms-account-error" role="alert">{account.privacyWarning === "ACCOUNT_LOCAL_RECOVERY_PENDING"
      ? t("Certaines données locales n’ont pas encore pu être récupérées. Elles sont conservées sur cet appareil pour une nouvelle tentative.", "Some local data could not be recovered yet. It remains on this device for another attempt.")
      : t("L’affichage personnel a été effacé, mais le navigateur a bloqué une partie du nettoyage. Effacez les données du site ToolTrim dans les réglages de votre navigateur avant de fermer cet appareil partagé.", "Your personal view was cleared, but the browser blocked part of the cleanup. Clear ToolTrim site data in your browser settings before leaving this shared device.")}</p>}
    {error === "ACCOUNT_DELETION_UNCONFIRMED" && <button type="button" className="ms-account-outline-button" disabled={!!busy} onClick={() => void run("cleanup", account.clearLocalAccount)}>{t("Effacer les données de cet appareil", "Clear this device's data")}</button>}

    {deleteOpen && account.user && <div id={`${id}-delete`} className="ms-account-choice" aria-labelledby={`${id}-delete-title`} aria-busy={!!busy}>
      <h3 id={`${id}-delete-title`}>{t("Supprimer votre compte ?", "Delete your account?")}</h3>
      <p>{t("Votre compte et sa stack enregistrée seront supprimés définitivement. Les modifications non enregistrées seront abandonnées.", "Your account and saved stack will be permanently deleted. Unsaved changes will be discarded.")}</p>
      <div className="ms-account-actions"><button ref={deleteConfirm} type="button" className="ms-account-outline-button" disabled={!!busy} onClick={() => void run("delete", account.deleteAccount)}>{t("Supprimer définitivement mon compte", "Permanently delete my account")}</button>
        <button type="button" className="ms-account-text-button" disabled={!!busy} onClick={() => { restoreDeleteFocus.current = true; setDeleteOpen(false); }}>{t("Conserver mon compte", "Keep my account")}</button></div>
    </div>}

    {open && needsAuth && <div id={`${id}-auth`} className="ms-account-auth" aria-busy={!!busy}>
      {step === "email" ? <>
        <button type="button" className="ms-account-google" disabled={!!busy} onClick={() => void run("google", () => account.signInWithGoogle(authOptions), "ACCOUNT_GOOGLE_SIGN_IN_FAILED")}>{busy === "google" ? t("Connexion…", "Connecting…") : t("Continuer avec Google", "Continue with Google")}</button>
        <span className="ms-account-or">{t("ou par e-mail", "or by email")}</span>
        <form onSubmit={send} className="ms-account-form">
          <label htmlFor={`${id}-email`}>{t("Adresse e-mail", "Email address")}</label>
          <div className="ms-account-fields"><input ref={emailInput} id={`${id}-email`} type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={!!busy} />
            <button type="submit" className="tt-button-primary ms-account-button" disabled={!!busy || !email.trim() || seconds > 0}><Mail size={16} aria-hidden />{busy === "send" ? t("Envoi…", "Sending…") : t("Recevoir un code", "Send me a code")}</button></div>
          {seconds > 0 && <p>{t(`Nouvel envoi possible dans ${seconds} s.`, `You can request another code in ${seconds}s.`)}</p>}
        </form>
      </> : <form onSubmit={verify} className="ms-account-form">
        <p>{t(`Un code a été envoyé à ${sentTo}.`, `A code was sent to ${sentTo}.`)}</p>
        <label htmlFor={`${id}-code`}>{t("Code reçu par e-mail", "Email code")}</label>
        <div className="ms-account-fields"><input ref={codeInput} id={`${id}-code`} className="ms-account-code" type="text" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6,10}" maxLength={10} value={code}
          aria-invalid={invalidCode || undefined} aria-describedby={invalidCode ? `${id}-error` : undefined}
          onChange={event => { setCode(event.target.value.replace(/\D/g, "").slice(0, 10)); setLocalError(null); }} disabled={!!busy} />
          <button type="submit" className="tt-button-primary ms-account-button" disabled={!!busy || code.length < 6}>{busy === "verify" ? t("Vérification…", "Verifying…") : t("Vérifier le code", "Verify code")}</button></div>
        <div className="ms-account-actions"><button type="button" className="ms-account-text-button" disabled={!!busy || seconds > 0} onClick={() => void send()}>{t("Renvoyer le code", "Resend code")}{seconds > 0 ? ` (${seconds} s)` : ""}</button>
          <button type="button" className="ms-account-text-button" disabled={!!busy} onClick={() => { setStep("email"); setCode(""); setLocalError(null); }}>{t("Changer d’adresse", "Change email")}</button></div>
      </form>}
      <div className="ms-account-auth-foot"><p>{t("Sans mot de passe. Votre sélection reste disponible pendant la connexion.", "No password. Your selection stays available while you sign in.")}</p><button type="button" className="ms-account-text-button" onClick={cancel}>{t("Annuler", "Cancel")}</button></div>
    </div>}

    {account.pendingDraftChoice && <div className="ms-account-choice" aria-labelledby={`${id}-choice`} aria-busy={!!busy}>
      <h3 id={`${id}-choice`}>{t("Vous avez déjà une stack enregistrée", "You already have a saved stack")}</h3>
      <p>{t("Retrouvez-la ou ajoutez votre nouvelle sélection. Vos choix déjà enregistrés restent prioritaires.", "Load it or add your new selection. Your previously saved choices take priority.")}</p>
      <div className="ms-account-actions"><button type="button" className="tt-button-primary ms-account-button" disabled={!!busy} onClick={() => void run("saved", account.loadSaved)}>{t("Retrouver ma stack enregistrée", "Load my saved stack")}</button>
        <button type="button" className="ms-account-outline-button" disabled={!!busy} onClick={() => void run("draft", account.addDraft)}>{t("Ajouter ma nouvelle sélection", "Add my new selection")}</button></div>
    </div>}
    {account.conflict && <div className="ms-account-choice" aria-labelledby={`${id}-conflict`} aria-busy={!!busy}>
      <h3 id={`${id}-conflict`}>{t("Une autre version a été enregistrée", "Another version was saved")}</h3>
      <p>{t("Chargez la version enregistrée ou confirmez l’enregistrement de votre version actuelle.", "Load the saved version or confirm saving your current version.")}</p>
      <div className="ms-account-actions"><button type="button" className="tt-button-primary ms-account-button" disabled={!!busy} onClick={() => void run("latest", account.reloadLatest)}>{t("Charger la version enregistrée", "Load the saved version")}</button>
        <button type="button" className="ms-account-outline-button" disabled={!!busy} onClick={() => void run("current", account.keepCurrent)}>{t("Enregistrer ma version actuelle", "Save my current version")}</button></div>
    </div>}
    {account.signOutNeedsConfirmation && !dismissLogout && <div className="ms-account-choice">
      <p>{t("Certaines modifications ne sont pas enregistrées. Les abandonner en vous déconnectant ?", "Some changes are not saved. Discard them and sign out?")}</p>
      <div className="ms-account-actions"><button type="button" className="ms-account-outline-button" disabled={!!busy} onClick={() => void run("logout", () => account.signOut({ discardUnsaved: true }))}>{t("Me déconnecter sans enregistrer", "Sign out without saving")}</button>
        <button type="button" className="ms-account-text-button" onClick={() => setDismissLogout(true)}>{t("Rester connecté", "Stay signed in")}</button></div>
    </div>}
  </section>;
}
