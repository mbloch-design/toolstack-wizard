import CatalogMediaUpload, { CatalogMediaPreview } from "./CatalogMediaUpload";
import type { ProductDraft } from "@/lib/publisherCatalog";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Button, { linkClass } from "@/ds/Button/Button";
import Field, { TextAreaField } from "@/ds/Field/Field";
import { useLang } from "@/hooks/useLang";
import { PublisherApiError, publisherRequest, type ListingCommerce, type ListingRequest, type PublisherToken } from "@/lib/publisherCatalogApi";
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

function commercialStatus(status: string, t: Translate) {
  return status === "satisfied" ? t("Condition remplie", "Requirement met")
    : status === "verifying" ? t("Vérification en cours", "Verification in progress")
      : status === "issue" ? t("À vérifier avec ToolTrim", "Check with ToolTrim")
        : t("Condition à remplir", "Requirement to complete");
}

export default function ListingStatusCard({ listing, getToken, update, returnedFromPayment, clearPaymentReturn }: {
  listing: ListingRequest; getToken: PublisherToken; update: (listing: ListingRequest) => void;
  returnedFromPayment: boolean; clearPaymentReturn: () => void;
}) {
  const { t, lang } = useLang();
  const [media, setMedia] = useState(listing.media ?? []);
  const [uploading, setUploading] = useState(false);
  const [role, setRole] = useState(listing.representativeRole ?? "");
  const [notes, setNotes] = useState(listing.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [refreshError, setRefreshError] = useState(false);
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

  async function refresh() {
    try {
      const { listing: next } = await publisherRequest<{ listing: ListingRequest }>(getToken, `/api/listing-requests?id=${encodeURIComponent(listing.id)}`);
      update(next);
      setRefreshError(false);
    } catch {
      setRefreshError(true);
    }
  }

  const verified = listing.representationStatus === "verified";
  const active = listing.status !== "archived" && listing.status !== "rejected";
  return <>
    <section className={styles.section} aria-labelledby="publisher-listing-name">
      <h2 id="publisher-listing-name">{listing.name}</h2>
      <a href={listing.websiteUrl} target="_blank" rel="noreferrer" className={linkClass("inline")}>{listing.websiteUrl}</a>
      <dl className={styles.states}>
        <div><dt>{t("Demande", "Application")}</dt><dd>{listingStatus(listing.status, t)}</dd></div>
        <div><dt>{t("Offre", "Offer")}</dt><dd>{commercialStatus(listing.commercialStatus, t)}</dd></div>
        <div><dt>{t("Représentation", "Representation")}</dt><dd>{verified ? t("Vérifiée", "Verified")
          : ["rejected", "revoked"].includes(listing.representationStatus) ? t("Accès refusé ou retiré", "Access declined or revoked")
            : t("En attente de vérification", "Awaiting verification")}</dd></div>
        <div><dt>{t("Fiche publique", "Public listing")}</dt><dd>{
          listing.deliveryStatus === "published" ? t("En ligne", "Live")
            : listing.deliveryStatus === "publishing" ? t("Publication en cours", "Publishing")
              : listing.deliveryStatus === "offline" ? t("Hors ligne", "Offline") : t("Non publiée", "Unpublished")}</dd></div>
      </dl>
      {listing.status === "in_preparation" && <p>{t("ToolTrim prépare votre fiche. Vous pourrez vérifier les faits avant publication.", "ToolTrim is preparing your listing. You will be able to check the facts before it goes live.")}</p>}
      {refreshError && <div className={styles.actions}><p role="alert">{t("Impossible d’actualiser le statut de la demande.", "The application status could not be refreshed.")}</p><Button onClick={() => void refresh()}>{t("Réessayer", "Try again")}</Button></div>}
    </section>
    {active && <ListingOfferStatus listing={listing} getToken={getToken} returnedFromPayment={returnedFromPayment}
      clearPaymentReturn={clearPaymentReturn} onChange={refresh} locked={dirty || busy} />}
    {["facts_to_review", "changes_requested", "ready"].includes(listing.status) &&
      <ListingFactualReview listing={listing} getToken={getToken} update={update} />}
    {editable && <section className={styles.section} aria-labelledby="publisher-submission-title">
      <h2 id="publisher-submission-title">{t("Préparer la demande", "Prepare the application")}</h2>
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
        {listing.commercialStatus === "pending" && !dirty && <Button variant="quiet" disabled={busy} onClick={() => {
          if (window.confirm(t("Archiver ce brouillon ?", "Archive this draft?"))) void mutate("withdraw");
        }}>{t("Archiver le brouillon", "Archive draft")}</Button>}
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </section>}
  </>;
}

type CommerceAction = "status" | "start" | "reconcile" | "checkBadge" | "requestHistoricalReview";

function ListingOfferStatus({ listing, getToken, returnedFromPayment, clearPaymentReturn, onChange, locked }: {
  listing: ListingRequest; getToken: PublisherToken; returnedFromPayment: boolean;
  clearPaymentReturn: () => void; onChange: () => Promise<void>; locked: boolean;
}) {
  const { t } = useLang();
  const standard = listing.offer === "standard_badge";
  const [status, setStatus] = useState<ListingCommerce["state"] | null>(null);
  const [badgeUrl, setBadgeUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [badgeHelp, setBadgeHelp] = useState(false);
  const paymentReturn = useRef(returnedFromPayment);
  const listingUpdated = useRef(onChange);
  listingUpdated.current = onChange;
  const clearReturn = useRef(clearPaymentReturn);
  clearReturn.current = clearPaymentReturn;
  const pending = useRef(false);
  const scope = useRef<AbortController | null>(null);

  async function checkout(action: CommerceAction, signal?: AbortSignal) {
    return publisherRequest<ListingCommerce>(getToken, "/api/listing-checkout", {
      method: "POST", body: { action, listingId: listing.id, ...(action === "checkBadge" && badgeUrl.trim() && { badgeUrl: badgeUrl.trim() }) }, signal,
    });
  }

  useEffect(() => {
    const controller = new AbortController();
    scope.current = controller;
    const reconcile = paymentReturn.current && !standard;
    void checkout(reconcile ? "reconcile" : "status", controller.signal).then(async (result) => {
      if (controller.signal.aborted) return;
      setStatus(result.state);
      if (reconcile) {
        await listingUpdated.current();
        if (!controller.signal.aborted) clearReturn.current();
      }
    }, () => {
      if (!controller.signal.aborted) setStatus(null);
    });
    return () => controller.abort();
  }, [getToken, listing.id, standard]);

  async function run(action: CommerceAction) {
    if (pending.current || !scope.current) return;
    const signal = scope.current.signal;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await checkout(action, signal);
      if (signal.aborted) return;
      setStatus(next.state);
      if (action === "start" && next.checkoutUrl) {
        const url = new URL(next.checkoutUrl);
        if (url.protocol !== "https:" || !/(^|\.)creem\.io$/i.test(url.hostname) || url.username || url.password) throw new Error("Invalid checkout URL");
        window.location.assign(url.href);
        return;
      }
      await onChange();
      if (paymentReturn.current && !signal.aborted) clearPaymentReturn();
    } catch {
      if (!signal.aborted) setError(t("Impossible de vérifier la condition de l’offre. Réessayez.", "The offer requirement could not be verified. Try again."));
    } finally {
      pending.current = false;
      if (!signal.aborted) setBusy(false);
    }
  }

  const labels: Record<ListingCommerce["state"], string> = {
    unchecked: standard ? t("Badge à vérifier", "Badge needs verification") : t("Paiement en attente", "Awaiting payment"),
    missing: t("Badge introuvable sur la page indiquée", "Badge not found on the specified page"),
    unreachable: t("Page du badge inaccessible", "Badge page unavailable"),
    present: t("Badge détecté", "Badge detected"),
    pending: t("Paiement en cours de vérification", "Payment verification in progress"),
    paid: t("Paiement confirmé", "Payment confirmed"),
    review_required: t("Rapprochement ToolTrim nécessaire", "ToolTrim needs to match your payment"),
    contact: t("Contactez ToolTrim", "Contact ToolTrim"),
  };
  const badgeCode = '<a href="https://tooltrim.com/"><img src="https://tooltrim.com/tooltrim-badge.svg" alt="ToolTrim" height="54"></a>';

  return <section className={styles.section} aria-labelledby="publisher-listing-offer">
    <h2 id="publisher-listing-offer">{standard ? t("Revue standard · 0 $", "Standard review · $0") : t("Fiche prioritaire · 29 $ une fois", "Priority listing · $29 once")}</h2>
    <p role="status">{status ? labels[status] : t("Vérification de l’état de l’offre…", "Checking offer status…")}</p>
    {locked && <p className={styles.muted}>{t("Enregistrez ou annulez vos changements pour continuer.", "Save or cancel your changes to continue.")}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {status === null && <div className={styles.actions}><Button disabled={busy || locked} onClick={() => void run(paymentReturn.current ? "reconcile" : "status")}>{t("Actualiser le statut", "Refresh status")}</Button></div>}
    {standard && status && status !== "present" && <div className={styles.fields}>
      <div className={styles.actions}><Button variant="quiet" aria-expanded={badgeHelp} onClick={() => setBadgeHelp(!badgeHelp)}>{t("Voir le code du badge", "View badge code")}</Button></div>
      {badgeHelp && <TextAreaField readOnly label={t("Code à installer sur votre site", "Code to install on your website")} value={badgeCode} />}
      <form onSubmit={(event) => { event.preventDefault(); void run("checkBadge"); }}>
        <Field label={t("URL publique de la page du badge", "Public URL of the badge page")} help={t("Laissez vide si le badge est sur la page d’accueil de l’outil.", "Leave blank if the badge is on the tool’s homepage.")} type="url"
          value={badgeUrl} onChange={(event) => setBadgeUrl(event.target.value)} disabled={busy || locked} />
        <div className={styles.actions}><Button variant="primary" type="submit" disabled={busy || locked}>{t("Vérifier le badge", "Verify badge")}</Button></div>
      </form>
    </div>}
    {!standard && (status === "unchecked" || status === "pending") && <div className={styles.actions}>
      <Button variant="primary" disabled={busy || locked} onClick={() => void run("start")}>{status === "pending" ? t("Reprendre le paiement", "Resume payment") : t("Continuer vers le paiement", "Continue to payment")}</Button>
      {status === "pending" && <Button disabled={busy || locked} onClick={() => void run("reconcile")}>{t("Vérifier le paiement", "Verify payment")}</Button>}
      {status === "unchecked" && <Button disabled={busy || locked} onClick={() => void run("requestHistoricalReview")}>{t("J’ai déjà payé", "I’ve already paid")}</Button>}
    </div>}
    {status === "review_required" && <p>{t("Envoyez votre reçu Creem à ToolTrim pour rattacher votre paiement à ce dossier.", "Send your Creem receipt to ToolTrim to link your payment to this application.")} <a className={linkClass("inline")} href={`mailto:contact@tooltrim.com?subject=${encodeURIComponent(t("Rapprochement de paiement", "Payment matching"))}&body=${encodeURIComponent(listing.id)}`}>contact@tooltrim.com</a></p>}
    {status === "contact" && <a href="mailto:contact@tooltrim.com" className={linkClass("inline")}>{t("Contacter ToolTrim", "Contact ToolTrim")}</a>}
  </section>;
}
