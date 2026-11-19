import { useEffect, useRef, useState } from "react";
import Button from "@/ds/Button/Button";
import Field, { TextAreaField } from "@/ds/Field/Field";
import { useLang } from "@/hooks/useLang";
import { PublisherApiError, publisherRequest, type PublisherToken } from "@/lib/publisherCatalogApi";
import styles from "./ContributionQueue.module.css";

type Inspection = { listingId: string; websiteUrl: string; reviewRequested: boolean; paid: boolean };
const endpoint = "/api/backoffice-listing-payments";

export default function HistoricalListingPayment({ listingId, getToken, disabled, onAttached }: {
  listingId: string; getToken: PublisherToken; disabled: boolean; onAttached: () => void;
}) {
  const { t } = useLang();
  const [opened, setOpened] = useState(false);
  const [inspection, setInspection] = useState<Inspection>();
  const [checkoutId, setCheckoutId] = useState("");
  const [paymentReference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const pending = useRef(false);
  const scope = useRef<AbortController>();
  useEffect(() => {
    if (!opened) return;
    const controller = new AbortController(); scope.current = controller;
    setBusy(true); setError("");
    void publisherRequest<Inspection>(getToken, `${endpoint}?listingId=${encodeURIComponent(listingId)}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setInspection(result); })
      .catch(() => { if (!controller.signal.aborted) setError(t("Impossible de charger le rapprochement.", "Payment matching could not be loaded.")); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [opened, listingId, getToken, retry, t]);
  async function attach() {
    if (pending.current || disabled || !inspection?.reviewRequested || !scope.current || scope.current.signal.aborted) return;
    pending.current = true; setBusy(true); setError("");
    const signal = scope.current.signal;
    try {
      await publisherRequest(getToken, endpoint, { method: "POST", signal, body: {
        listingId, checkoutId: checkoutId.trim(), paymentReference: paymentReference.trim(), reviewNote: note.trim(),
      } });
      if (!signal.aborted) onAttached();
    } catch (cause) {
      if (!signal.aborted) setError(cause instanceof PublisherApiError && cause.code === "CMS_RECEIPT_ALREADY_USED"
        ? t("Ce reçu est déjà rattaché à une autre fiche. Vérifiez le dossier d’origine.", "This receipt is already attached to another listing. Check the original application.")
        : t("Le paiement n’a pas pu être rattaché. Vérifiez les références, le site et le reçu Creem ; aucun nouveau paiement n’a été lancé.", "The payment could not be matched. Check the references, website and Creem receipt; no new payment was started."));
    } finally { pending.current = false; if (!signal.aborted) setBusy(false); }
  }
  return <section className={styles.content} aria-label={t("Ancien paiement", "Previous payment")}>
    <div className={styles.actions}><Button disabled={disabled || busy} aria-expanded={opened} onClick={() => setOpened(!opened)}>
      {t("Rapprocher un ancien paiement", "Match a previous payment")}
    </Button></div>
    {opened && <>
      <p>{t("Rattachez un achat déjà effectué à cette fiche. Creem vérifie le paiement et le site d’origine ; l’analyse et les droits d’édition restent indépendants.", "Attach an existing purchase to this listing. Creem verifies the payment and original website; analysis and editing access remain independent.")}</p>
      {busy && <p role="status">{t("Vérification…", "Checking…")}</p>}
      {error && <p role="alert">{error}</p>}
      {!inspection && !busy && <Button onClick={() => setRetry(value => value + 1)}>{t("Réessayer", "Try again")}</Button>}
      {inspection?.paid && <p>{t("Un paiement est déjà confirmé sur ce dossier.", "A payment is already confirmed for this application.")}</p>}
      {inspection && !inspection.paid && !inspection.reviewRequested && <p>{t("Le demandeur doit choisir « J’ai déjà payé » dans son dossier pour ouvrir ce rapprochement.", "The applicant must choose “I’ve already paid” in their application to request matching.")}</p>}
      {inspection?.reviewRequested && !inspection.paid && <form className={styles.content} onSubmit={event => { event.preventDefault(); void attach(); }}>
        <p>{t("Site à vérifier : ", "Website to verify: ")}{inspection.websiteUrl}</p>
        <Field label={t("Identifiant du paiement Creem", "Creem checkout ID")} value={checkoutId} required disabled={disabled || busy}
          placeholder="ch_…" onChange={event => setCheckoutId(event.target.value)} />
        <Field label={t("Référence de la soumission d’origine", "Original submission reference")} value={paymentReference} required disabled={disabled || busy}
          help={t("Identifiant tooltrim_submission_id dans les métadonnées du paiement Creem.", "The tooltrim_submission_id in the Creem payment metadata.")} onChange={event => setReference(event.target.value)} />
        <TextAreaField label={t("Comment avez-vous vérifié le représentant et l’acheteur ?", "How did you verify the representative and purchaser?")}
          value={note} required minLength={20} maxLength={2000} disabled={disabled || busy}
          help={t("Cette vérification est conservée dans l’historique du dossier.", "This verification is retained in the application history.")} onChange={event => setNote(event.target.value)} />
        <div className={styles.actions}><Button type="submit" variant="primary" disabled={disabled || busy || note.trim().length < 20}>
          {t("Vérifier et rattacher ce paiement", "Verify and attach payment")}
        </Button></div>
      </form>}
    </>}
  </section>;
}
