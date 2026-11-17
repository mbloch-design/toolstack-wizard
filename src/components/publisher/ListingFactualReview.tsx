import { useEffect, useRef, useState } from "react";
import Button from "@/ds/Button/Button";
import { TextAreaField } from "@/ds/Field/Field";
import { useLang } from "@/hooks/useLang";
import type { ProductDraft } from "@/lib/publisherCatalog";
import { PublisherApiError, publisherRequest, type ListingRequest, type PublisherToken } from "@/lib/publisherCatalogApi";
import { useCatalogExitGuard } from "@/components/backoffice/useCatalogExitGuard";
import PublisherFiche from "./PublisherFiche";
import styles from "./PublisherWorkspace.module.css";

type ReviewDecision = "confirm" | "requestChanges";
type Review = {
  listing: ListingRequest;
  productRevision: { id: string; hash: string; value: ProductDraft } | null;
  confirmation: { decision: ReviewDecision; note: string; productRevisionId: string } | null;
};

export default function ListingFactualReview({ listing, getToken, update }: {
  listing: ListingRequest;
  getToken: PublisherToken;
  update: (listing: ListingRequest) => void;
}) {
  const { t } = useLang();
  const [review, setReview] = useState<Review | null>(null);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const scope = useRef<AbortController | null>(null);
  const available = listing.status === "facts_to_review" && listing.version === review?.listing.version;
  const endpoint = `/api/listing-review?id=${encodeURIComponent(listing.id)}`;
  useCatalogExitGuard(decision === "requestChanges" && Boolean(note.trim()), () => setError(t(
    "Envoyez votre demande de corrections ou annulez avant de quitter.",
    "Send your request for corrections or cancel before leaving.",
  )));

  useEffect(() => {
    const controller = new AbortController();
    scope.current = controller;
    setError("");
    void publisherRequest<{ review: Review }>(getToken, endpoint, { signal: controller.signal }).then(({ review }) => {
      if (!controller.signal.aborted) setReview(review);
    }, () => {
      if (!controller.signal.aborted) {
        setReview(null);
        setError(t("Impossible de charger la version à relire.", "The version for review could not be loaded."));
      }
    });
    return () => controller.abort();
  }, [getToken, endpoint, retry, listing.version, t]);

  async function respond() {
    const revision = review?.productRevision;
    const signal = scope.current?.signal;
    if (!available || busy || !decision || !revision || !signal || signal.aborted) return;
    setBusy(true);
    setError("");
    try {
      const { review: next } = await publisherRequest<{ review: Review }>(getToken, "/api/listing-review", {
        method: "POST", signal, body: {
          action: "respondFactualReview", id: listing.id, version: listing.version,
          productRevisionId: revision.id, hash: revision.hash, decision, note: decision === "requestChanges" ? note.trim() : "",
        },
      });
      if (signal.aborted) return;
      setReview(next);
      setDecision(null);
      setNote("");
      update(next.listing);
    } catch (cause) {
      if (!signal.aborted) setError(cause instanceof PublisherApiError && cause.status === 409
        ? t("La version à relire a changé. Actualisez avant de répondre.", "The review version changed. Refresh before responding.")
        : t("La réponse n’a pas pu être enregistrée. Réessayez.", "Your response could not be saved. Try again."));
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }

  return <div className={styles.fields}>
    <section aria-labelledby="publisher-facts-review" className={styles.section}>
      <h2 id="publisher-facts-review">{t("Relire les faits", "Review product facts")}</h2>
      {review?.productRevision && available && <p>{t("Vérifiez les informations produit ci-dessous. Votre réponse porte sur cette version.", "Check the product information below. Your response applies to this version.")}</p>}
      {review?.confirmation && <p role="status">{review.confirmation.decision === "confirm"
        ? t("Vous avez confirmé les faits de cette version.", "You confirmed the facts for this version.")
        : t("Votre demande de corrections a été transmise.", "Your request for corrections was sent.")}</p>}
      {review?.confirmation?.note && <p className={styles.content}>{review.confirmation.note}</p>}
      {!review && !error && <p role="status">{t("Chargement de la version à relire…", "Loading the version for review…")}</p>}
      {error && <div className={styles.actions}>
        <p role="alert" className={styles.error}>{error}</p>
        <Button disabled={busy} onClick={() => setRetry(retry + 1)}>{t("Actualiser la version", "Refresh version")}</Button>
      </div>}
    </section>
    {review?.productRevision && <PublisherFiche key={review.productRevision.id} value={review.productRevision.value} canEdit={false} />}
    {review?.productRevision && available && <section className={styles.section} aria-label={t("Répondre à ToolTrim", "Respond to ToolTrim")}>
      {decision === "confirm" && <p>{t("Confirmer que les informations produit affichées sont exactes ?", "Confirm that the product facts shown are accurate?")}</p>}
      {decision === "requestChanges" && <TextAreaField label={t("Corrections à apporter", "Corrections needed")}
        value={note} maxLength={2000} disabled={busy} onChange={(event) => setNote(event.target.value)} />}
      <div className={styles.actions}>
        {!decision ? <>
          <Button variant="primary" onClick={() => setDecision("confirm")}>{t("Confirmer les faits", "Confirm product facts")}</Button>
          <Button onClick={() => setDecision("requestChanges")}>{t("Demander des corrections", "Request corrections")}</Button>
        </> : <>
          <Button variant="primary" disabled={busy || decision === "requestChanges" && !note.trim()} onClick={() => void respond()}>{t("Envoyer ma réponse", "Send my response")}</Button>
          <Button disabled={busy} onClick={() => { setDecision(null); setNote(""); setError(""); }}>{t("Annuler", "Cancel")}</Button>
        </>}
      </div>
    </section>}
  </div>;
}
