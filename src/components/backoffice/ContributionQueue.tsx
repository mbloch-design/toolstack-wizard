import { useEffect, useRef, useState } from "react";
import BackofficePageHeading from "@/ds/BackofficePageHeading/BackofficePageHeading";
import Button from "@/ds/Button/Button";
import { TextAreaField } from "@/ds/Field/Field";
import { Notice, NoticeText } from "@/ds/Notice/Notice";
import { useLang } from "@/hooks/useLang";
import { supabase } from "@/integrations/supabase/client";
import type { ProductDraft } from "@/lib/publisherCatalog";
import { pricePresentation } from "@/lib/publisherPricing";
import styles from "./ContributionQueue.module.css";

type Summary = {
  id: string;
  toolId: string;
  name?: string;
  version: number;
  status: string;
  submittedAt: string;
};
type Detail = Summary & { value: ProductDraft };
type Published = { name: string; slug: string; websiteUrl: string | null; shortDescription: string | null; shortDescriptionEn: string | null };
type ReleasePreview = {
  sourceHead: string;
  legacyItems: { slug: string; version: number }[];
  items: { approvalId: string; toolId: string; version: number }[];
};
type ReleaseHistory = { batch_key: string; prepared_at: string; commit_sha: string | null; verified_at: string | null; cancelled_at: string | null; leased_until: string };
type Decision = "approved" | "changes_requested" | "rejected" | "cancel_approval";

async function request(id?: string, decision?: { status: Decision; note: string }, mode?: string, batchKey?: string) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("SESSION_REQUIRED");
  const params = new URLSearchParams();
  if (id) params.set("id", id);
  if (mode) params.set("mode", mode);
  const body = decision ?? (batchKey ? { batchKey } : undefined);
  const url = "/api/backoffice-contributions" + (params.size ? "?" + params : "");
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + data.session.access_token,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

export function ContributionQueue({ onBack }: { onBack: () => void }) {
  const { lang, t } = useLang();
  const [rows, setRows] = useState<Summary[]>();
  const [detail, setDetail] = useState<Detail>();
  const [mediaPreviews, setMediaPreviews] = useState<{ assetId: string; url: string }[]>([]);
  const [published, setPublished] = useState<Published>();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [release, setRelease] = useState<ReleasePreview>();
  const [batchKey, setBatchKey] = useState("");
  const [blocked, setBlocked] = useState<{ toolId: string; approvalId: string }[]>([]);
  const [canDeliver, setCanDeliver] = useState(false);
  const [history, setHistory] = useState<ReleaseHistory[]>();
  const [releaseState, setReleaseState] = useState<"committed" | "live">();
  const [revision, reload] = useState(0);
  const back = useRef<HTMLButtonElement>(null);
  const selected = useRef<string>();

  useEffect(() => {
    let active = true;
    void request().then((result) => {
      if (!active) return;
      if (!Array.isArray(result.submissions)) throw new Error("INVALID_QUEUE");
      setRows(result.submissions);
    }).catch(() => {
      if (active) setError(t("Impossible de charger les propositions.", "Could not load submissions."));
    });
    return () => { active = false; };
  }, [revision, t]);

  async function open(row: Summary) {
    selected.current = row.id;
    setBusy(true);
    setError("");
    setFeedback("");
    setNote("");
    setRelease(undefined);
    try {
      const result = await request(row.id);
      if (selected.current !== row.id) return;
      if (!result.submission?.value) throw new Error("INVALID_SUBMISSION");
      setPublished(result.published);
      setMediaPreviews(Array.isArray(result.media) ? result.media : []);
      setDetail(result.submission);
      requestAnimationFrame(() => back.current?.focus());
    } catch {
      if (selected.current === row.id) setError(t("Impossible d’ouvrir cette proposition.", "Could not open this submission."));
    } finally {
      if (selected.current === row.id) setBusy(false);
    }
  }

  async function review(status: Decision) {
    if (!detail || busy || (status !== "approved" && !note.trim())) return;
    setBusy(true);
    setError("");
    try {
      await request(detail.id, { status, note: note.trim() });
      setDetail(undefined);
      setRows((current) => current?.flatMap((row) => row.id !== detail.id ? [row]
        : status === "approved" ? [{ ...row, status }] : []));
      setFeedback(status === "approved"
        ? t("Proposition approuvée. Elle attend la publication.", "Submission approved and awaiting publication.")
        : t("Décision enregistrée.", "Decision saved."));
    } catch {
      setError(t("Décision non enregistrée. Actualisez avant de réessayer.", "Decision could not be saved. Refresh before trying again."));
    } finally {
      setBusy(false);
    }
  }

  async function previewRelease() {
    setBusy(true);
    setError("");
    setRelease(undefined);
    try {
      const result = await request(undefined, undefined, "release-preview");
      setBatchKey(typeof result.batchKey === "string" ? result.batchKey : "");
      setCanDeliver(result.canDeliver === true);
      setReleaseState(undefined);
      if (!Array.isArray(result.manifest?.items) || !Array.isArray(result.manifest?.legacyItems)) throw new Error("INVALID_RELEASE");
      setBlocked(Array.isArray(result.blocked) ? result.blocked : []);
      setRelease(result.manifest);
    } catch {
      setError(t("Impossible de préparer l’aperçu du lot. Vérifiez les rattachements et l’état des fiches publiées.",
        "Could not prepare the batch preview. Check the assignments and the published records."));
    } finally {
      setBusy(false);
    }
  }

  async function loadHistory() {
    setBusy(true);
    setError("");
    try {
      const result = await request(undefined, undefined, "release-history");
      if (!Array.isArray(result.history)) throw new Error("INVALID_RELEASE");
      setHistory(result.history);
      setCanDeliver(result.canDeliver === true);
    } catch {
      setError(t("Impossible de lire le suivi des publications.", "Could not load publication history."));
    } finally {
      setBusy(false);
    }
  }

  async function deliver(mode: "publish-release" | "verify-release", requestedKey = batchKey) {
    if (!requestedKey || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await request(undefined, undefined, mode, requestedKey);
      if (!result.release?.commit_sha) throw new Error("INVALID_RELEASE");
      if (requestedKey === batchKey) setReleaseState(result.release.verified_at ? "live" : "committed");
      setHistory((rows) => rows?.map((row) => row.batch_key === requestedKey
        ? { ...row, commit_sha: result.release.commit_sha, verified_at: result.release.verified_at } : row));
      setFeedback(result.cleanupPending ? t("Le commit est créé. Le nettoyage des brouillons reste à faire.", "Commit created. Draft cleanup is pending.") : "");
      reload((n) => n + 1);
    } catch {
      setError(mode === "verify-release"
        ? t("La mise en ligne reste à vérifier. Réessayez après le déploiement.", "The release remains unverified. Try again after deployment.")
        : t("Impossible de confirmer le commit. Réessayez pour reprendre le même lot.", "The commit could not be confirmed. Retry to resume the same batch."));
    } finally {
      setBusy(false);
    }
  }

  async function cancelRelease(key: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await request(undefined, undefined, "cancel-release", key);
      if (!result.release?.cancelled_at) throw new Error("INVALID_RELEASE");
      setHistory((rows) => rows?.map((row) => row.batch_key === key ? { ...row, cancelled_at: result.release.cancelled_at } : row));
      setFeedback(t("Lot annulé. Les propositions approuvées sont conservées.", "Batch cancelled. Approved submissions are preserved."));
    } catch {
      setError(t("Le lot reste actif. Vérifiez le suivi après la tentative de publication.", "The batch is still active. Check its status after the publication attempt."));
    } finally {
      setBusy(false);
    }
  }

  return <section className={styles.queue} aria-busy={busy}>
    <BackofficePageHeading title={t("Propositions éditeur", "Publisher submissions")}
      action={<Button ref={back} onClick={() => {
        if (detail) setDetail(undefined);
        else onBack();
      }} disabled={busy}>{detail ? t("Toutes les propositions", "All submissions") : t("Retour aux fiches", "Back to records")}</Button>} />
    {feedback && <p role="status">{feedback}</p>}
    {error && <Notice title={error} role="alert"
      actions={<Button onClick={() => { setError(""); setDetail(undefined); setRows(undefined); reload((n) => n + 1); }}>
        {t("Actualiser", "Refresh")}
      </Button>} />}
    {!detail && !rows && !error && <p role="status">{t("Chargement des propositions…", "Loading submissions…")}</p>}
    {!detail && rows && (rows.length === 0
      ? <p>{t("Aucune proposition à examiner.", "No submissions to review.")}</p>
      : <ul className={styles.rows}>{rows.map((row) => <li key={row.id}>
        <span>{row.name || row.toolId} · {new Date(row.submittedAt).toLocaleDateString(lang)} · {t("Version", "Version")} {row.version}{row.status === "approved" && (" · " + t("Approuvée", "Approved"))}</span>
        <Button disabled={busy} onClick={() => void open(row)}>{t("Examiner", "Review")}</Button>
      </li>)}</ul>)}
    {!detail && <div className={styles.content}>
      <Button disabled={busy} onClick={() => void previewRelease()}>{t("Vérifier le lot approuvé", "Check the approved batch")}</Button>
      {blocked.length > 0 && <Notice title={t("Propositions exclues du lot", "Submissions excluded from the batch")}>
        <NoticeText>{t("Le rattachement ou les conditions de mise en ligne doivent être revérifiés.", "The assignment or publication requirements need checking.")}</NoticeText>
        <ul>{blocked.map((item) => <li key={item.approvalId}>{item.toolId}</li>)}</ul>
      </Notice>}
      {release && <Notice title={(release.items.length || release.legacyItems.length)
        ? t("Lot prêt pour vérification", "Batch ready for verification")
        : t("Aucun changement approuvé à préparer", "No approved changes to prepare")}>
        <ul>
          {release.items.map((item) => <li key={item.approvalId}>
            {item.toolId} · {t("Proposition éditeur", "Publisher submission")} · {t("Version", "Version")} {item.version}
          </li>)}
          {release.legacyItems.map((item) => <li key={item.slug}>
            {item.slug} · {t("Brouillon ToolTrim", "ToolTrim draft")} · {t("Version", "Version")} {item.version}
          </li>)}
        </ul>
        {batchKey && canDeliver && (release.items.length > 0 || release.legacyItems.length > 0) && <div className={styles.actions}>
          {!releaseState && <Button variant="primary" disabled={busy} onClick={() => void deliver("publish-release")}>
            {t("Publier le lot complet", "Publish the whole batch")}
          </Button>}
          {releaseState === "committed" && <>
            <p role="status">{t("Commit créé. Mise en ligne à vérifier.", "Commit created. Deployment verification pending.")}</p>
            <Button disabled={busy} onClick={() => void deliver("verify-release")}>{t("Vérifier la mise en ligne", "Verify deployment")}</Button>
          </>}
          {releaseState === "live" && <p role="status">{t("Mise en ligne vérifiée.", "Deployment verified.")}</p>}
        </div>}
      </Notice>}
    </div>}
    {!detail && <section className={styles.content}>
      <Button disabled={busy} onClick={() => void loadHistory()}>{t("Suivi des publications", "Publication history")}</Button>
      {history && (history.length > 0 ? <ul className={styles.rows}>{history.map((row) =>
        <li key={row.batch_key}>
          <span>{new Date(row.prepared_at).toLocaleString(lang)} · {row.cancelled_at ? t("Annulé", "Cancelled") : row.verified_at
            ? t("En ligne, vérifiée", "Live, verified")
            : row.commit_sha ? t("Commit créé", "Commit created") : t("Préparée", "Prepared")}</span>
          {canDeliver && !row.cancelled_at && !row.verified_at && <Button disabled={busy}
            onClick={() => void deliver(row.commit_sha ? "verify-release" : "publish-release", row.batch_key)}>
            {row.commit_sha ? t("Vérifier la mise en ligne", "Verify deployment") : t("Reprendre le lot", "Resume batch")}
          </Button>}
          {canDeliver && !row.cancelled_at && !row.commit_sha && Date.parse(row.leased_until) <= Date.now()
            && <Button variant="quiet" disabled={busy} onClick={() => void cancelRelease(row.batch_key)}>
              {t("Annuler le lot préparé", "Cancel the prepared batch")}
            </Button>}
        </li>
      )}</ul> : <p>{t("Aucune publication préparée.", "No prepared publications.")}</p>)}
    </section>}
    {detail && <div className={styles.content}>
      <div>
        <h2>{detail.value.name}</h2>
        <p>{detail.value.websiteUrl}</p>
        {published && <p><a href={`/${lang}/tool/${encodeURIComponent(published.slug)}`}
          target="_blank" rel="noreferrer">{t("Consulter la fiche publiée", "Open the published record")}</a></p>}
      </div>
      {(["fr", "en"] as const).map((language) => {
        const copy = detail.value.localized[language];
        return <section key={language}>
          <h3>{language === "fr" ? "Français" : "English"}</h3>
          {published && (language === "fr" ? published.shortDescription : published.shortDescriptionEn) !== copy.shortDescription && <dl>
            <dt>{t("Description publiée", "Published description")}</dt>
            <dd>{(language === "fr" ? published.shortDescription : published.shortDescriptionEn) || "—"}</dd>
            <dt>{t("Description proposée", "Proposed description")}</dt>
            <dd>{copy.shortDescription || "—"}</dd>
          </dl>}
          {(!published || (language === "fr" ? published.shortDescription : published.shortDescriptionEn) === copy.shortDescription)
            && copy.shortDescription && <p>{copy.shortDescription}</p>}
          {copy.productDescription && <p>{copy.productDescription}</p>}
          {copy.features.length > 0 && <ul>{copy.features.map((item) => <li key={item.id}>{item.text}</li>)}</ul>}
          {copy.useCases.length > 0 && <ul>{copy.useCases.map((item) => <li key={item.id}>{item.text}</li>)}</ul>}
        </section>;
      })}
      {!!detail.value.plans.length && <section>
        <h3>{t("Offres et tarifs", "Plans and prices")}</h3>
        <ul>{detail.value.plans.map((plan) => <li key={plan.id}>
          <strong>{plan.localized[lang === "fr" ? "fr" : "en"].name || plan.planKey}</strong>
          {plan.archived ? ` · ${t("Archivée", "Archived")}` : plan.options.map((option) => {
            const price = pricePresentation(option, lang === "fr" ? "fr" : "en");
            return <div key={option.id}>
              <p>{[price.amountLabel, price.billingLabel, option.unit, option.market].filter(Boolean).join(" · ")}</p>
              {(option.sourceUrl || option.observedOn) && <p>
                {option.sourceUrl && <a href={option.sourceUrl} target="_blank" rel="noreferrer">{t("Source du tarif", "Pricing source")}</a>}
                {option.observedOn && <span> · {option.observedOn}</span>}
              </p>}
            </div>;
          })}
        </li>)}</ul>
      </section>}
      {(detail.value.media.length > 0 || detail.value.integrations.length > 0 || detail.value.classificationProposals.length > 0) &&
        <Notice title={t("Éléments à vérifier", "Items to check")}>
          <NoticeText>{t("Médias, intégrations et classement figurent dans la proposition ci-dessous.", "Media, integrations and classification are listed below.")}</NoticeText>
          <dl className={styles.metadata}>
            {detail.value.media.map((media) => {
              const preview = mediaPreviews.find((item) => item.assetId === media.assetId);
              const alt = media.alt[lang] || media.alt[lang === "fr" ? "en" : "fr"];
              return <div key={media.assetId}><dt>{media.role}</dt><dd>{preview
                ? <img className={styles.mediaPreview} src={preview.url} alt={alt} referrerPolicy="no-referrer" />
                : <span>{t("Aperçu indisponible", "Preview unavailable")}</span>}</dd></div>;
            })}
            {detail.value.integrations.map((item) => <div key={item.id}><dt>{item.type}</dt><dd>{item.relatedToolId}</dd></div>)}
            {detail.value.classificationProposals.map((item) => <div key={item.key}><dt>{item.key}</dt><dd>{item.values.join(", ")}</dd></div>)}
          </dl>
        </Notice>}
      <TextAreaField label={t("Message à l’éditeur", "Message to publisher")} value={note} maxLength={2000}
        onChange={(event) => setNote(event.target.value)}
        help={t("Indiquez ce que l’éditeur doit corriger si vous demandez une modification ou refusez la proposition.", "Explain what the publisher needs to change if you request corrections or reject the submission.")} />
      {detail.status === "approved" ? <Button disabled={busy || !note.trim()} variant="quiet"
        onClick={() => void review("cancel_approval")}>{t("Retirer l’approbation", "Withdraw approval")}</Button> : <div className={styles.actions}>
        <Button disabled={busy} variant="primary" onClick={() => void review("approved")}>{t("Approuver la proposition", "Approve submission")}</Button>
        <Button disabled={busy || !note.trim()} onClick={() => void review("changes_requested")}>{t("Demander des corrections", "Request changes")}</Button>
        <Button disabled={busy || !note.trim()} variant="quiet" onClick={() => void review("rejected")}>{t("Refuser", "Reject")}</Button>
      </div>}
    </div>}
  </section>;
}
