import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AccountPageFrame from "@/components/account/AccountPageFrame";
import PublisherFiche from "@/components/publisher/PublisherFiche";
import styles from "@/components/publisher/PublisherWorkspace.module.css";
import Button, { buttonAttrs, linkClass } from "@/ds/Button/Button";
import { useLang } from "@/hooks/useLang";
import { PublisherApiError, publisherPath, publisherRequest, type ListingRequest, type PublisherDraft, type PublisherSubmission, type PublisherToken, type PublisherTool } from "@/lib/publisherCatalogApi";
import { listingCommercialLabel, listingOfferLabel } from "@/lib/listingOfferPresentation";
import type { ProductDraft } from "@/lib/publisherCatalog";

export default function PublisherToolPage({ slug, getToken }: { slug: string; getToken: PublisherToken }) {
  const { lang, prefix, t } = useLang();
  const [state, setState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [tool, setTool] = useState<PublisherTool | null>(null);
  const [application, setApplication] = useState<ListingRequest>();
  const [draft, setDraft] = useState<PublisherDraft | null>(null);
  const latestDraft = useRef<PublisherDraft | null>(null);
  const [submissions, setSubmissions] = useState<PublisherSubmission[] | null>(null);
  const [request, retry] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submissionPending = useRef(false);
  const [summary, setSummary] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function clearAccess() {
    setDraft(null);
    setTool(null);
    latestDraft.current = null;
    setSubmissions(null);
    setState("denied");
  }

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    async function load() {
      try {
        const { tools } = await publisherRequest<{ tools: PublisherTool[] }>(getToken, "/api/publisher-catalog", { signal });
        const selected = tools.find((item) => item.slug === slug);
        if (signal.aborted) return;
        if (!selected) { clearAccess(); return; }
        const query = `?tool=${encodeURIComponent(selected.id)}`;
        const { draft } = await publisherRequest<{ draft: PublisherDraft }>(getToken, "/api/publisher-catalog" + query, { signal });
        if (signal.aborted) return;
        latestDraft.current = draft;
        setDraft(draft);
        setTool(selected);
        setState("ready");
        void publisherRequest<{ listings: ListingRequest[] }>(getToken, "/api/listing-requests", { signal }).then(
          ({ listings }) => { if (!signal.aborted) setApplication(listings.find((item) => item.toolId === selected.id)); },
          () => { if (!signal.aborted) setApplication(undefined); },
        );
        const { submissions } = await publisherRequest<{ submissions: PublisherSubmission[] }>(getToken, "/api/publisher-contributions" + query, { signal });
        if (!signal.aborted) setSubmissions(submissions);
      } catch (cause) {
        if (signal.aborted) return;
        if (cause instanceof PublisherApiError && [401, 403, 404].includes(cause.status) && cause.code !== "CMS_DISABLED") clearAccess();
        else if (!latestDraft.current) setState("error");
      }
    }
    void load();
    return () => controller.abort();
  }, [slug, getToken, request]);

  async function save(value: ProductDraft) {
    const expected = latestDraft.current;
    if (!tool || !expected) throw new PublisherApiError(403, "CMS_ACCESS_DENIED");
    const query = `?tool=${encodeURIComponent(tool.id)}`;
    const { draft: saved } = await publisherRequest<{ draft: PublisherDraft }>(getToken, "/api/publisher-catalog" + query, {
      method: "PUT", body: { version: expected.version, brandId: expected.brandId, value },
    });
    latestDraft.current = saved;
    setDraft(saved);
    setSummary(false);
    return saved.value;
  }

  async function allocate(planId?: string) {
    const expected = latestDraft.current;
    if (!tool || !expected) throw new PublisherApiError(403, "CMS_ACCESS_DENIED");
    const query = `?tool=${encodeURIComponent(tool.id)}`;
    const { draft: result } = await publisherRequest<{ draft: PublisherDraft }>(getToken, "/api/publisher-catalog" + query, {
      method: "PATCH", body: { version: expected.version, brandId: expected.brandId, action: planId ? "addPriceOption" : "addPlan", ...(planId && { planId }) },
    });
    latestDraft.current = result;
    setDraft(result);
    setSummary(false);
    return result.value;
  }

  async function submit(saveCurrent: () => Promise<boolean>) {
    if (submissionPending.current) return;
    submissionPending.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      if (!await saveCurrent()) return;
      const expected = latestDraft.current;
      if (!tool || !expected) return;
      const { submission } = await publisherRequest<{ submission: PublisherSubmission }>(getToken, `/api/publisher-contributions?tool=${encodeURIComponent(tool.id)}`, {
        method: "POST", body: { brandId: expected.brandId, version: expected.version },
      });
      setSubmissions((current) => [submission, ...(current ?? []).filter((item) => item.id !== submission.id)]);
      setSummary(false);
    } catch (cause) {
      if (cause instanceof PublisherApiError && [401, 403].includes(cause.status)) clearAccess();
      else if (cause instanceof PublisherApiError && cause.code === "CMS_NEW_REVISION_REQUIRED") {
        setSubmitError(t("Modifiez puis enregistrez le brouillon avant de l’envoyer à nouveau.", "Edit and save the draft before sending it again."));
      } else setSubmitError(cause instanceof PublisherApiError && cause.status === 409
        ? t("La proposition ou le brouillon a changé. Rechargez la fiche pour afficher la version actuelle.", "The proposal or draft has changed. Reload the listing to see the current version.")
        : t("L’envoi n’a pas abouti. Vérifiez les tarifs des offres avant de réessayer.", "The proposal could not be sent. Check the plan prices before trying again."));
    } finally {
      submissionPending.current = false;
      setSubmitting(false);
    }
  }

  const statusLabels: Record<string, string> = {
    submitted: t("Envoyée", "Submitted"), in_review: t("En cours de vérification", "In review"),
    approved: t("Acceptée", "Approved"), changes_requested: t("À corriger", "Changes requested"),
    applied: t("Intégrée au catalogue", "Added to the catalogue"), rejected: t("Refusée", "Declined"),
    withdrawn: t("Retirée", "Withdrawn"),
  };
  const current = submissions?.[0];
  const inReview = current && ["submitted", "in_review", "approved"].includes(current.status);
  const canSubmit = !!submissions && !!draft?.canEdit && !inReview;
  const updated = draft && new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short" }).format(Date.parse(draft.updatedAt));
  return <AccountPageFrame wide title={draft?.value.name || tool?.name || t("Fiche éditeur", "Publisher listing")}
    headerExtra={<Link to={publisherPath(prefix)} className={linkClass()}>{t("Mes fiches", "My listings")}</Link>}>
    {state === "ready" && application && application.toolId === tool?.id && <section className={styles.section} aria-label={t("Votre offre", "Your offer")}>
      <div className={styles.split}>
        <div>
          <p><strong>{listingOfferLabel(application.offer, t)}</strong></p>
          <p className={styles.muted}>{listingCommercialLabel(application.offer, application.commercialStatus, t)}</p>
        </div>
        <Link {...buttonAttrs()} to={`${publisherPath(prefix)}?listingId=${encodeURIComponent(application.id)}`}>{t("Voir le suivi", "View progress")}</Link>
      </div>
    </section>}
    {state === "loading" && <p role="status">{t("Chargement de la fiche…", "Loading listing…")}</p>}
    {state === "denied" && <p role="alert">{t("Cette fiche n’est pas accessible depuis votre compte. ToolTrim vérifie les demandes d’accès.", "Your account cannot access this listing. ToolTrim verifies requests for access.")}</p>}
    {state === "error" && <section className={styles.section}>
      <p role="alert">{t("Impossible de charger cette fiche.", "This listing could not be loaded.")}</p>
      <Button onClick={() => { setState("loading"); retry(request + 1); }}>{t("Réessayer", "Try again")}</Button>
    </section>}
    {state === "ready" && draft && tool && <PublisherFiche value={draft.value} canEdit={draft.canEdit && !submitting} onSave={save}
      onAllocate={allocate} mediaAccess={{ getToken, toolId: tool.id }} onDenied={clearAccess} publicSlug={tool.slug}
      renderReview={(saveCurrent, saving) => <section className={styles.section} aria-label={t("Envoi et suivi", "Submission and status")}>
        <dl className={styles.states}>
          <div><dt>{t("Dernière sauvegarde", "Last saved")}</dt><dd>{updated}</dd></div>
          <div><dt>{t("Proposition", "Proposal")}</dt><dd>{current ? statusLabels[current.status] ?? t("En traitement", "In progress") : submissions ? t("Brouillon", "Draft") : t("Statut indisponible", "Status unavailable")}</dd></div>
          <div><dt>{t("Catalogue public", "Public catalogue")}</dt><dd><Link to={`${prefix}/tool/${encodeURIComponent(tool.slug)}`} className={linkClass("inline")} target="_blank" rel="noreferrer">{t("Voir la fiche publique", "View public listing")}</Link></dd></div>
        </dl>
        {current?.reviewNote && <p className={styles.content}>{current.reviewNote}</p>}
        {summary && <p>{t("ToolTrim va examiner les faits de cette version du brouillon avant toute mise à jour de la fiche publique.", "ToolTrim will review the facts in this draft version before updating the public listing.")}</p>}
        {submitError && <p role="alert">{submitError}</p>}
        {draft.canEdit && current?.status === "submitted" && <div className={styles.actions}>
          <Button disabled={submitting || saving} onClick={async () => {
            if (submissionPending.current || !window.confirm(t("Retirer cette proposition de la revue ?", "Withdraw this proposal from review?"))) return;
            submissionPending.current = true;
            setSubmitting(true);
            setSubmitError("");
            try {
              await publisherRequest(getToken, `/api/publisher-contributions?tool=${encodeURIComponent(tool.id)}&id=${encodeURIComponent(current.id)}`, { method: "DELETE" });
              setSubmissions((previous) => previous?.map((item) => item.id === current.id ? { ...item, status: "withdrawn" } : item) ?? []);
            } catch (cause) {
              if (cause instanceof PublisherApiError && [401, 403].includes(cause.status)) clearAccess();
              else setSubmitError(t("La proposition n’a pas pu être retirée. Actualisez la fiche pour vérifier son statut.", "The proposal could not be withdrawn. Refresh the listing to check its status."));
            } finally {
              setSubmitting(false);
              submissionPending.current = false;
            }
          }}>{t("Retirer la proposition", "Withdraw proposal")}</Button>
        </div>}
        {canSubmit && <div className={styles.actions}>
          <Button variant="primary" disabled={saving || submitting} onClick={() => {
            if (summary) void submit(saveCurrent);
            else void saveCurrent().then((ok) => { if (ok) setSummary(true); });
          }}>{submitting ? t("Envoi…", "Sending…") : summary ? t("Confirmer l’envoi", "Confirm submission") : t("Envoyer à ToolTrim", "Send to ToolTrim")}</Button>
          {summary && <Button disabled={submitting} onClick={() => setSummary(false)}>{t("Annuler", "Cancel")}</Button>}
        </div>}
      </section>} />}
  </AccountPageFrame>;
}
