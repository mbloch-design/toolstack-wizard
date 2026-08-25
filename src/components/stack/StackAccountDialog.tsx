import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { User } from "@supabase/supabase-js";
import { Check, Cloud, LoaderCircle, LogOut, Mail, ShieldCheck, Trash2, X } from "lucide-react";
import { getStackAccountLabel, type StackSyncStatus } from "@/hooks/useStackAccount";

interface StackAccountDialogProps {
  isOpen: boolean;
  user: User | null;
  status: StackSyncStatus;
  error: string | null;
  magicLinkSentTo: string | null;
  onClose: () => void;
  onGoogle: () => Promise<void>;
  onMagicLink: (email: string) => Promise<boolean>;
  onSignOut: () => Promise<void>;
  onDeleteAccount: () => Promise<boolean>;
  t: (fr: string, en: string) => string;
}

export function StackAccountDialog({
  isOpen,
  user,
  status,
  error,
  magicLinkSentTo,
  onClose,
  onGoogle,
  onMagicLink,
  onSignOut,
  onDeleteAccount,
  t,
}: StackAccountDialogProps) {
  const [email, setEmail] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setConfirmDelete(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const busy = status === "connecting" || status === "syncing";
  const accountLabel = getStackAccountLabel(user);

  async function submitEmail(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    await onMagicLink(email);
  }

  return createPortal((
    <div className="stack-account-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} tabIndex={-1} className="stack-account-dialog" role="dialog" aria-modal="true" aria-labelledby="stack-account-title">
        <button type="button" className="stack-account-close" onClick={onClose} aria-label={t("Fermer", "Close")}><X size={20} aria-hidden /></button>

        {user ? (
          <>
            <header className="stack-account-head">
              <span className="stack-account-icon"><Cloud size={23} aria-hidden /></span>
              <div>
                <span>{t("Compte ToolTrim", "ToolTrim account")}</span>
                <h2 id="stack-account-title">{t("Votre stack est synchronisée", "Your stack is synced")}</h2>
                <p>{accountLabel}</p>
              </div>
            </header>

            <div className={`stack-account-sync-state is-${status}`} aria-live="polite">
              {busy ? <LoaderCircle size={18} className="is-spinning" aria-hidden /> : <Check size={18} aria-hidden />}
              <span>{busy
                ? t("Synchronisation en cours…", "Syncing…")
                : t("Vos collections sont sauvegardées sur ce compte.", "Your collections are saved to this account.")}</span>
            </div>

            {error && <p className="stack-account-error" role="alert">{error}</p>}

            <footer className="stack-account-session-actions">
              <button type="button" onClick={onSignOut}><LogOut size={17} aria-hidden />{t("Se déconnecter", "Sign out")}</button>
              {!confirmDelete ? (
                <button type="button" className="is-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={17} aria-hidden />{t("Supprimer mon compte", "Delete my account")}</button>
              ) : (
                <div className="stack-account-delete-confirm">
                  <p>{t("Le compte et sa copie synchronisée seront supprimés. Votre stack restera sur cet appareil.", "The account and its synced copy will be deleted. Your stack will remain on this device.")}</p>
                  <button type="button" className="is-danger" disabled={busy} onClick={async () => (await onDeleteAccount()) && onClose()}>{t("Confirmer la suppression", "Confirm deletion")}</button>
                  <button type="button" onClick={() => setConfirmDelete(false)}>{t("Annuler", "Cancel")}</button>
                </div>
              )}
            </footer>
          </>
        ) : (
          <>
            <header className="stack-account-head">
              <span className="stack-account-icon"><Cloud size={23} aria-hidden /></span>
              <div>
                <span>{t("Sauvegarde facultative", "Optional backup")}</span>
                <h2 id="stack-account-title">{t("Retrouvez votre stack partout", "Find your stack everywhere")}</h2>
                <p>{t("Connectez-vous seulement quand vous souhaitez protéger et synchroniser vos sélections.", "Sign in only when you want to protect and sync your selections.")}</p>
              </div>
            </header>

            <ul className="stack-account-benefits">
              <li><Check size={16} aria-hidden />{t("Vos outils et collections fusionnés sans doublon", "Your tools and collections merged without duplicates")}</li>
              <li><ShieldCheck size={16} aria-hidden />{t("Données privées, accessibles uniquement par vous", "Private data, accessible only to you")}</li>
              <li><Cloud size={16} aria-hidden />{t("Synchronisation automatique entre vos appareils", "Automatic sync across your devices")}</li>
            </ul>

            <button type="button" className="stack-account-google" onClick={onGoogle} disabled={busy}>
              <span aria-hidden>G</span>{t("Continuer avec Google", "Continue with Google")}
            </button>

            <div className="stack-account-separator"><span>{t("ou par email", "or with email")}</span></div>

            <form className="stack-account-email" onSubmit={submitEmail}>
              <label htmlFor="stack-account-email">{t("Adresse email", "Email address")}</label>
              <div><Mail size={17} aria-hidden /><input id="stack-account-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" /><button type="submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="is-spinning" aria-label={t("Envoi…", "Sending…")} /> : t("Recevoir le lien", "Send me a link")}</button></div>
            </form>

            {magicLinkSentTo && <p className="stack-account-success" role="status"><Check size={17} aria-hidden />{t(`Lien envoyé à ${magicLinkSentTo}.`, `Link sent to ${magicLinkSentTo}.`)}</p>}
            {error && <p className="stack-account-error" role="alert">{error}</p>}
            <p className="stack-account-privacy">{t("Aucun mot de passe à retenir. ToolTrim ne vend pas vos données.", "No password to remember. ToolTrim does not sell your data.")}</p>
          </>
        )}
      </section>
    </div>
  ), document.body);
}

export default StackAccountDialog;
