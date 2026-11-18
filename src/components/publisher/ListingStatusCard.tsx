import CatalogMediaUpload, { CatalogMediaPreview } from "./CatalogMediaUpload";
import type { ProductDraft } from "@/lib/publisherCatalog";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Button, { buttonAttrs, linkClass } from "@/ds/Button/Button";
import Field, { TextAreaField } from "@/ds/Field/Field";
import { useLang } from "@/hooks/useLang";
import { PublisherApiError, publisherPath, publisherRequest, type ListingCommerce, type ListingRequest, type PublisherToken } from "@/lib/publisherCatalogApi";
import { listingCommercialLabel, listingOfferLabel } from "@/lib/listingOfferPresentation";
import { useCatalogExitGuard } from "@/components/backoffice/useCatalogExitGuard";
import ListingFactualReview from "./ListingFactualReview";
import styles from "./PublisherWorkspace.module.css";

type Translate = (fr: string, en: string) => string;

export function listingStatus(status: string, t: Translate) {
  const labels: Record<string, string> = {
    draft: t("Brouillon", "Draft"),
    submitted: t("Envoyée à ToolTrim", "Submitted to ToolTrim"),
    in_preparation: t("Rédaction ToolTrim", "ToolTrim is preparing the listing"),
    facts_to_review: t("Faits à relire", "Facts to review"),
    changes_requested: t("Corrections demandées", "Changes requested"),
    ready: t("Prête pour la livraison", "Ready for delivery"),
    rejected: t("Demande refusée", "Application declined"),
    archived: t("Demande archivée", "Application archived"),
  };
  return labels[status] ?? t("En cours", "In progress");
}

export default function ListingStatusCard({ listing, toolSlug, getToken, update, returnedFromPayment, clearPaymentReturn }: {
  listing: ListingRequest; getToken: PublisherToken; update: (listing: ListingRequest) => void;
  toolSlug?: string; returnedFromPayment: boolean; clearPaymentReturn: () => void;
}) {
  const { t, lang, prefix } = useLang();
  const [media, setMedia] = useState(listing.media ?? []);
  const [uploading, setUploading] = useState(false);
  const [role, setRole] = useState(listing.representativeRole ?? "");
  const [notes, setNotes] = useState(listing.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [refreshError, setRefreshError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pending = useRef(false);
  const editable = ["draft", "changes_requested"].includes(listing.status);
  const dirty = editable && (role !== (listing.representativeRole ?? "") || notes !== (listing.notes ?? "") || JSON.stringify(media) !== JSON.stringify(listing.media ?? []));
  useCatalogExitGuard(dirty || busy || uploading, () => setError(t("Enregistrez ou annulez vos modifications avant de quitter.", "Save or cancel your edits before leaving.")));

  async function mutate(action: "save" | "submit" | "withdraw") {
    if (pending.current || uploading) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const body = { action, id: listing.id, version: listing.version, ...(action === "save" && { representativeRole: role.trim(), notes: notes.trim(),
        ...(JSON.stringify(media) !== JSON.stringify(listing.media ?? []) && { media }),
      }) };
      const { listing: next } = await publisherRequest<{ listing: ListingRequest }>(getToken, "/api/listing-requests", { method: "POST", body });
      update(next);
      setRole(next.representativeRole ?? "");
      setNotes(next.notes ?? "");
      setMedia(next.media ?? []);
      setMessage(action === "save" ? t("Brouillon enregistré.", "Draft saved.") : action === "submit" ? t("Demande envoyée à ToolTrim.", "Application submitted to ToolTrim.") : t("Demande archivée.", "Application archived."));
    } catch (cause) {
      setError(cause instanceof PublisherApiError && cause.status === 409
        ? t("Le dossier a changé ou ses conditions ne sont pas remplies. Actualisez son statut avant de réessayer.", "The application has changed or its requirements are incomplete. Refresh its status before retrying.")
        : t("L’opération a échoué. Vous pouvez réessayer.", "The action failed. You can try again."));
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }

  async function refresh(signal?: AbortSignal) {
    setRefreshing(true);
    try {
      const { listing: next } = await publisherRequest<{ listing: ListingRequest }>(getToken, `/api/listing-requests?id=${encodeURIComponent(listing.id)}`, { signal });
      if (signal?.aborted) return false;
      update(next);
      setRefreshError(false);
      return true;
    } catch {
      if (!signal?.aborted) setRefreshError(true);
      return false;
    } finally {
      setRefreshing(false);
    }
  }

  const verified = listing.representationStatus === "verified";
  const active = listing.status !== "archived" && listing.status !== "rejected";
  const published = listing.deliveryStatus === "published";
  const paymentRequired = listing.offer === "priority_paid";
  const commercialComplete = listing.commercialStatus === "satisfied";
  const offerAction = paymentRequired ? t("Voir le paiement", "View payment") : t("Installer le badge", "Set up the badge");
  const waitingMessage = published || !active ? null : {
    submitted: t("ToolTrim vérifie votre demande et votre lien avec l’outil.", "ToolTrim is checking your application and your relationship with the tool."),
    in_preparation: t("ToolTrim prépare la fiche et vous enverra les informations produit à relire.", "ToolTrim is preparing the listing and will send you the product facts to review."),
    ready: t("ToolTrim prépare la publication. Vous pourrez ouvrir la fiche publique ici une fois la mise en ligne vérifiée.", "ToolTrim is preparing publication. You can open the public listing here once it is confirmed live."),
  }[listing.status];
  const next = !active || published ? null
    : !commercialComplete ? { target: "#publisher-listing-offer", label: listing.commercialStatus === "pending"
      ? offerAction : paymentRequired ? t("Vérifier le paiement", "Check payment") : t("Vérifier le badge", "Check badge") }
      : listing.status === "facts_to_review" ? { target: "#publisher-facts-review", label: t("Relire les informations produit", "Review product facts") }
        : editable ? { target: "#publisher-submission-title", label: listing.status === "changes_requested"
          ? t("Reprendre la demande", "Resume the application") : t("Compléter la demande", "Complete the application") } : null;
  return <>
    <section className={styles.section} aria-labelledby="publisher-listing-name">
      <header className={styles.fields}>
        <h2 id="publisher-listing-name">{listing.name}</h2>
        <a href={listing.websiteUrl} target="_blank" rel="noreferrer" className={linkClass("inline")}>{listing.websiteUrl}</a>
      </header>
      <dl className={styles.card}>
        <dt className={styles.muted}>{t("Votre offre", "Your offer")}</dt>
        <dd><strong>{listingOfferLabel(listing.offer, t)}</strong></dd>
        <dd>{listingCommercialLabel(listing.offer, listing.commercialStatus, t)}</dd>
      </dl>
      <dl className={styles.states}>
        <div><dt>{t("Demande", "Application")}</dt><dd>{listingStatus(listing.status, t)}</dd></div>
        <div><dt>{t("Représentation", "Representation")}</dt><dd>{verified ? t("Vérifiée", "Verified")
          : ["rejected", "revoked"].includes(listing.representationStatus) ? t("Accès refusé ou retiré", "Access declined or revoked")
            : t("En attente de vérification", "Awaiting verification")}</dd></div>
        <div><dt>{t("Fiche publique", "Public listing")}</dt><dd>{
          listing.deliveryStatus === "published" ? t("En ligne", "Live")
            : listing.deliveryStatus === "publishing" ? t("Publication en cours", "Publishing")
              : listing.deliveryStatus === "offline" ? t("Hors ligne", "Offline") : t("Non publiée", "Unpublished")}</dd></div>
      </dl>
      {waitingMessage && <p>{waitingMessage}</p>}
      {refreshError && <p role="alert">{t("Impossible d’actualiser le statut de la demande.", "The application status could not be refreshed.")}</p>}
      <div className={styles.actions}>
        {next && <a {...buttonAttrs("primary")} href={next.target}>{next.label}</a>}
        {active && next?.target !== "#publisher-listing-offer" && <a {...buttonAttrs()} href="#publisher-listing-offer">{t("Offre et paiements", "Payments")}</a>}
        {published && <Link {...buttonAttrs("primary")} to={`${prefix}/tool/${encodeURIComponent(listing.slug)}`}>{t("Voir la fiche publique", "View public listing")}</Link>}
        {published && toolSlug && <Link {...buttonAttrs()} to={publisherPath(prefix, toolSlug)}>{t("Gérer la fiche", "Manage listing")}</Link>}
        {(waitingMessage || refreshError) && <Button disabled={refreshing || dirty || busy} onClick={() => void refresh()}>{refreshing
          ? t("Actualisation…", "Refreshing…") : refreshError ? t("Réessayer", "Try again") : t("Actualiser le suivi", "Refresh progress")}</Button>}
      </div>
    </section>
    {(active || paymentRequired) && <ListingOfferStatus listing={listing} getToken={getToken} returnedFromPayment={returnedFromPayment}
      clearPaymentReturn={clearPaymentReturn} onChange={refresh} locked={dirty || busy || uploading} active={active} />}
    {["facts_to_review", "changes_requested", "ready"].includes(listing.status) &&
      <ListingFactualReview listing={listing} getToken={getToken} update={update} />}
    {editable && <section id="publisher-submission-title" tabIndex={-1} className={styles.section} aria-labelledby="publisher-submission-heading">
      <h2 id="publisher-submission-heading">{t("Préparer la demande", "Prepare the application")}</h2>
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); void mutate("save"); }}>
        <Field label={t("Votre rôle auprès de l’outil", "Your role with the tool")} value={role} maxLength={120} disabled={busy}
          onChange={(event) => setRole(event.target.value)} placeholder={t("Ex. fondatrice ou responsable produit", "E.g. founder or product manager")} />
        <TextAreaField label={t("Informations produit à transmettre (facultatif)", "Product details to share (optional)")} value={notes}
          maxLength={3000} disabled={busy} onChange={(event) => setNotes(event.target.value)} />
        <h3>{t("Visuels du produit", "Product images")}</h3>
        {media.map((asset) => <div key={asset.assetId} className={styles.content}>
          <CatalogMediaPreview asset={asset} locale={lang} getToken={getToken} />
          <Button disabled={busy || uploading} onClick={() => setMedia((items) => items.filter((item) => item.assetId !== asset.assetId))}>
            {t("Retirer le visuel", "Remove image")}
          </Button>
        </div>)}
        {(["logo", "cover", "gallery"] as const).map((mediaRole) => {
          const count = media.filter((asset) => asset.role === mediaRole).length;
          if (count >= (mediaRole === "gallery" ? 12 : 1)) return null;
          return <div key={mediaRole}>
            <p>{mediaRole === "logo" ? t("Logo", "Logo") : mediaRole === "cover" ? t("Couverture", "Cover") : t("Capture d’écran", "Screenshot")}</p>
            <CatalogMediaUpload listingId={listing.id} role={mediaRole} getToken={getToken} setUploading={setUploading}
              disabled={busy || uploading} onReady={(assetId) => {
                const asset: ProductDraft["media"][number] = { assetId, role: mediaRole, alt: { fr: "", en: "" }, caption: { fr: "", en: "" } };
                setMedia((items) => [...items, asset]);
              }} />
          </div>;
        })}
        {dirty && <div className={styles.actions}>
          <Button variant="primary" type="submit" disabled={busy}>{t("Enregistrer le brouillon", "Save draft")}</Button>
          <Button disabled={busy} onClick={() => { setRole(listing.representativeRole ?? ""); setNotes(listing.notes ?? ""); setMedia(listing.media ?? []); setError(""); }}>{t("Annuler", "Cancel")}</Button>
        </div>}
      </form>
      {listing.commercialStatus !== "satisfied" && <p className={styles.muted}>{t("Remplissez la condition de l’offre avant d’envoyer votre demande.", "Complete the offer requirement before sending your application.")}</p>}
      {listing.commercialStatus === "satisfied" && !role.trim() && <p className={styles.muted}>{t("Renseignez votre rôle pour envoyer votre demande.", "Enter your role to send your application.")}</p>}
      <div className={styles.actions}>
        {listing.commercialStatus === "satisfied" && role.trim() && !dirty && <Button variant="primary" disabled={busy || uploading} onClick={() => void mutate("submit")}>{t("Envoyer à ToolTrim", "Send to ToolTrim")}</Button>}
        {!paymentRequired && listing.commercialStatus === "pending" && !dirty && <Button variant="quiet" disabled={busy} onClick={() => {
          if (window.confirm(t("Archiver ce brouillon ?", "Archive this draft?"))) void mutate("withdraw");
        }}>{t("Archiver le brouillon", "Archive draft")}</Button>}
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </section>}
  </>;
}

type CommerceAction = "status" | "start" | "reconcile" | "checkBadge" | "requestHistoricalReview";

function ListingOfferStatus({ listing, getToken, returnedFromPayment, clearPaymentReturn, onChange, locked, active }: {
  listing: ListingRequest; getToken: PublisherToken; returnedFromPayment: boolean;
  clearPaymentReturn: () => void; onChange: (signal?: AbortSignal) => Promise<boolean>; locked: boolean; active: boolean;
}) {
  const { t, lang } = useLang();
  const standard = listing.offer === "standard_badge";
  const [commerce, setCommerce] = useState<ListingCommerce | null>(null);
  const [badgeUrl, setBadgeUrl] = useState("");
  const [busy, setBusy] = useState(true);
  const [errorAction, setErrorAction] = useState<CommerceAction | null>(null);
  const [badgeHelp, setBadgeHelp] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const upgradeButton = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);
  const scope = useRef<AbortController | null>(null);
  const callbacks = useRef({ onChange, clearPaymentReturn });
  callbacks.current = { onChange, clearPaymentReturn };

  const perform = useCallback(async (action: CommerceAction, signal: AbortSignal, badgeUrl?: string) => {
    const next = await publisherRequest<ListingCommerce>(getToken, "/api/listing-checkout", {
      method: "POST", body: { action, listingId: listing.id, ...(action === "checkBadge" && badgeUrl && { badgeUrl }) }, signal,
    });
    if (signal.aborted) return;
    setCommerce(next);
    if (action === "start" && next.checkoutUrl) {
      const url = new URL(next.checkoutUrl);
      if (url.protocol !== "https:" || !/(^|\.)creem\.io$/i.test(url.hostname) || url.username || url.password) throw new Error("Invalid checkout URL");
      window.location.assign(url.href);
      return;
    }
    if (action !== "status") {
      const refreshed = await callbacks.current.onChange(signal);
      if (!refreshed && !signal.aborted) throw new Error("Listing refresh failed");
      if (action === "reconcile" && returnedFromPayment && !signal.aborted) callbacks.current.clearPaymentReturn();
    }
  }, [getToken, listing.id, returnedFromPayment]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    scope.current = controller;
    const action = returnedFromPayment ? "reconcile" : "status";
    setBusy(true);
    setErrorAction(null);
    void perform(action, signal).catch(() => {
      if (!signal.aborted) setErrorAction(action);
    }).finally(() => {
      if (!signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [perform, returnedFromPayment]);

  async function run(action: CommerceAction) {
    if (busy || locked || pending.current || !scope.current) return;
    const { signal } = scope.current;
    pending.current = true;
    setBusy(true);
    setErrorAction(null);
    try {
      await perform(action, signal, badgeUrl.trim());
    } catch {
      if (!signal.aborted) setErrorAction(action);
    } finally {
      pending.current = false;
      if (!signal.aborted) setBusy(false);
    }
  }

  const status = commerce?.state;
  const inProgress = status === "pending" && Boolean(commerce?.attemptId);
  const canStartPriority = active && !standard && (status === "unchecked" || status === "pending") && !inProgress;
  const canUpgrade = active && standard && commerce?.canUpgrade && !inProgress;
  const badgeVerified = listing.commercialStatus === "satisfied" || status === "present";
  const canCheckBadge = active && standard && !badgeVerified && status !== "review_required" && status !== "contact";
  const blocked = busy || locked;
  const badgeCode = '<a href="https://tooltrim.com/"><img src="https://tooltrim.com/tooltrim-badge.svg" alt="ToolTrim" height="54"></a>';
  const payments = commerce?.payments;
  const labels: Record<ListingCommerce["state"], string> = {
    unchecked: standard ? t("Badge à vérifier", "Badge needs verification") : t("Paiement à effectuer", "Payment required"),
    missing: t("Badge introuvable sur la page indiquée", "Badge not found on the specified page"),
    unreachable: t("Page du badge inaccessible", "Badge page unavailable"),
    present: t("Badge détecté", "Badge detected"),
    pending: inProgress ? t("Paiement en attente de confirmation", "Awaiting payment confirmation") : t("Paiement à effectuer", "Payment required"),
    paid: t("Paiement vérifié par Creem", "Payment verified by Creem"),
    review_required: t("Paiement à rapprocher avec ToolTrim", "Payment needs to be matched by ToolTrim"),
    contact: t("Contactez ToolTrim", "Contact ToolTrim"),
  };

  return <section id="publisher-listing-offer" tabIndex={-1} className={styles.section} aria-labelledby="publisher-listing-offer-heading">
    <h2 id="publisher-listing-offer-heading">{t("Offre et paiements", "Payments")}</h2>
    {busy && <p role="status">{t("Actualisation de l’offre et des paiements…", "Refreshing the offer and payments…")}</p>}
    {!busy && status && status !== "present" && status !== "paid" && <p role="status">{labels[status]}</p>}
    {locked && <p className={styles.muted}>{t("Enregistrez ou annulez vos changements pour continuer.", "Save or cancel your changes to continue.")}</p>}
    {errorAction && <div className={styles.fields}>
      <p role="alert" className={styles.error}>{t("Impossible d’actualiser l’offre ou le paiement.", "The offer or payment could not be updated.")}</p>
      {!["start", "checkBadge", "requestHistoricalReview"].includes(errorAction) &&
        <div className={styles.actions}><Button disabled={blocked} onClick={() => void run(errorAction)}>{t("Réessayer", "Try again")}</Button></div>}
    </div>}
    {canCheckBadge && status && <div className={styles.fields}>
      <h3>{t("Badge ToolTrim", "ToolTrim badge")}</h3>
      <div className={styles.actions}><Button variant="quiet" aria-expanded={badgeHelp} onClick={() => setBadgeHelp(!badgeHelp)}>{t("Voir le code du badge", "View badge code")}</Button></div>
      {badgeHelp && <TextAreaField readOnly label={t("Code à installer sur votre site", "Code to install on your website")} value={badgeCode} />}
      <form onSubmit={(event) => { event.preventDefault(); void run("checkBadge"); }}>
        <Field label={t("URL publique de la page du badge", "Public URL of the badge page")} help={t("Laissez vide si le badge est sur la page d’accueil de l’outil.", "Leave blank if the badge is on the tool’s homepage.")} type="url"
          value={badgeUrl} onChange={(event) => setBadgeUrl(event.target.value)} disabled={blocked} />
        <div className={styles.actions}><Button variant="primary" type="submit" disabled={blocked}>{t("Vérifier le badge", "Verify badge")}</Button></div>
      </form>
    </div>}
    {canUpgrade && <div className={styles.card}>
      <h3>{t("Fiche prioritaire", "Priority listing")}</h3>
      <p>{t("29 $ US en un seul paiement. Après confirmation, le badge devient facultatif.", "US$29 once. Once payment is confirmed, the badge becomes optional.")}</p>
      <div className={styles.actions}>
        <Button ref={upgradeButton} aria-expanded={showUpgrade} disabled={blocked} onClick={() => setShowUpgrade(!showUpgrade)}>{t("Passer à l’offre prioritaire", "Upgrade to priority")}</Button>
      </div>
      {showUpgrade && <div className={styles.fields}>
        <p>{t("Votre offre gratuite reste active jusqu’à la confirmation du paiement.", "Your free offer stays active until payment is confirmed.")}</p>
        <div className={styles.actions}>
          <Button variant="primary" disabled={blocked} onClick={() => void run("start")}>{t("Continuer vers le paiement", "Continue to payment")}</Button>
          <Button disabled={blocked} onClick={() => { setShowUpgrade(false); upgradeButton.current?.focus(); }}>{t("Garder l’offre gratuite", "Keep the free offer")}</Button>
        </div>
      </div>}
    </div>}
    {active && (canStartPriority || inProgress) && <div className={styles.fields}>
      {standard && inProgress && <p>{t("Votre offre gratuite reste active jusqu’à la confirmation du paiement.", "Your free offer stays active until payment is confirmed.")}</p>}
      <div className={styles.actions}>
        <Button variant="primary" disabled={blocked} onClick={() => void run("start")}>{inProgress ? t("Reprendre le paiement", "Resume payment") : t("Continuer vers le paiement", "Continue to payment")}</Button>
        {inProgress && <Button disabled={blocked} onClick={() => void run("reconcile")}>{t("Vérifier le paiement", "Verify payment")}</Button>}
        {canStartPriority && <Button disabled={blocked} onClick={() => void run("requestHistoricalReview")}>{t("J’ai déjà payé", "I’ve already paid")}</Button>}
      </div>
    </div>}
    {status === "review_required" && <p>{t("Pour faire vérifier ce paiement, contactez ToolTrim avec votre référence Creem si vous l’avez.", "To check this payment, contact ToolTrim with your Creem reference if you have it.")} <a className={linkClass("inline")} href={`mailto:contact@tooltrim.com?subject=${encodeURIComponent(t("Rapprochement de paiement", "Payment matching"))}&body=${encodeURIComponent(listing.id)}`}>contact@tooltrim.com</a></p>}
    {status === "contact" && <a href="mailto:contact@tooltrim.com" className={linkClass("inline")}>{t("Contacter ToolTrim", "Contact ToolTrim")}</a>}
    {commerce && <div className={styles.fields}>
      <h3>{t("Historique des paiements", "Payment history")}</h3>
      {!payments ? <p className={styles.muted}>{t("Historique indisponible pour le moment.", "Payment history is currently unavailable.")}</p>
        : payments.length === 0 ? <p className={styles.muted}>{t("Aucun paiement enregistré pour cette fiche.", "No payments are recorded for this listing.")}</p>
          : <ul className={styles.fields}>{payments.map((payment) => <li className={styles.card} key={payment.reference}>
            <strong>{payment.mode === "test" ? t("Paiement de test", "Test payment") : t("Fiche prioritaire", "Priority listing")}</strong>
            <dl className={styles.states}>
              <div><dt>{t("État", "Status")}</dt><dd>{payment.status === "paid" ? t("Confirmé", "Confirmed") : t("À vérifier avec ToolTrim", "Check with ToolTrim")}</dd></div>
              {payment.amountPaidMinor !== null && payment.currency && <div><dt>{t("Montant", "Amount")}</dt><dd>{new Intl.NumberFormat(lang, {
                style: "currency", currency: payment.currency, currencyDisplay: "code",
              }).format(payment.amountPaidMinor / 100)}</dd></div>}
              <div><dt>{t("Date", "Date")}</dt><dd><time dateTime={payment.paidAt}>{new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(new Date(payment.paidAt))}</time></dd></div>
              <div><dt>{t("Référence Creem", "Creem reference")}</dt><dd>{payment.reference}</dd></div>
            </dl>
          </li>)}</ul>}
    </div>}
  </section>;
}
