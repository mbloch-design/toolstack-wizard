import BackofficeRecords from "@/ds/BackofficeRecords/BackofficeRecords";
import listStyles from "@/ds/BackofficePageHeading/BackofficeList.module.css";
import Field from "@/ds/Field/Field";
import Button from "@/ds/Button/Button";
import BackofficePageHeading from "@/ds/BackofficePageHeading/BackofficePageHeading";
import styles from "@/ds/CatalogAuthoring/CatalogAuthoring.module.css";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useLang } from "@/hooks/useLang";
import { useCatalogExitGuard } from "./useCatalogExitGuard";
import { Button as StackButton } from "@/components/stack/StackKit";
import { RefreshCw, ArrowUpRight } from "@/lib/icons";
import {
  EDITABLE_CATALOG_FIELDS,
  changedCatalogFields,
  type CatalogTool,
  type CatalogWorkspace,
  type CatalogEditorDetail,
  type CatalogPublication,
} from "@/lib/backofficeCatalog";
import {
  loadCatalogWorkspace,
  loadCatalogDetail,
  saveCatalogDraft,
  discardCatalogDraft,
  publishCatalogDrafts,
} from "@/lib/backofficeCatalogApi";
import { CatalogField, CatalogValue, catalogFieldLabel } from "./CatalogFields";

import { CatalogDraftSession } from "./catalogDraftSession";
import { CatalogInlineFiche } from "./CatalogInlineFiche";
import {
  catalogValidationIssues,
  type CatalogValidationIssue,
} from "@/lib/catalogValidation";
import { catalogIssueMessage } from "./catalogEditingModel";

const GROUPS = [
  {
    id: "content",
    fr: "Contenu",
    en: "Content",
    fields: [
      "name",
      "nameEn",
      "category",
      "description",
      "descriptionEn",
      "shortDescription",
      "shortDescriptionEn",
      "longDescription",
      "longDescriptionEn",
      "pros",
      "prosEn",
      "cons",
      "consEn",
      "useCases",
      "useCasesEn",
      "relevantFor",
      "relevantForEn",
    ],
  },
  {
    id: "decision",
    fr: "Décision",
    en: "Decision",
    fields: ["verdict", "verdictEn"],
  },
  {
    id: "pricing",
    fr: "Prix",
    en: "Pricing",
    fields: [
      "pricing",
      "pricingEn",
      "pricing_v5",
      "pricing_v5En",
      "defaultMonthlyPrice",
    ],
  },
  {
    id: "links",
    fr: "Liens et médias",
    en: "Links and media",
    fields: [
      "websiteUrl",
      "affiliateLink",
      "logo",
      "ogImageUrl",
      "galleryImages",
      "alternatives",
    ],
  },
  { id: "seo", fr: "SEO", en: "SEO", fields: ["seo"] },
];
export function CatalogEditor({
  onDirtyChange,
  session: suppliedSession,
  onReauthenticate,
}: {
  session?: CatalogDraftSession;
  onReauthenticate?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { lang, t } = useLang();
  const [ownSession] = useState(() => new CatalogDraftSession());
  const session = suppliedSession ?? ownSession;
  useSyncExternalStore(session.subscribe, session.snapshot, session.snapshot);
  const [inlineSlug, setInlineSlug] = useState<string | null>(null);
  const [reviewDetails, setReviewDetails] = useState<
    Record<string, CatalogEditorDetail>
  >({});
  const [reviewIssues, setReviewIssues] = useState<
    Record<string, CatalogValidationIssue[]>
  >({});
  const reviewSequence = useRef(0);
  const link = (slug: string | null) => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "catalog");
    if (slug) {
      url.searchParams.set("tool", slug);
      url.searchParams.set("editor", "inline");
    } else {
      url.searchParams.delete("tool");
      url.searchParams.delete("editor");
    }
    window.history.replaceState(window.history.state, "", url);
  };
  const [workspace, setWorkspace] = useState<CatalogWorkspace | null>(null),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [draftsOnly, setDraftsOnly] = useState(false),
    [reload, setReload] = useState(0);
  const [detail, setDetail] = useState<CatalogEditorDetail | null>(null),
    [value, setValue] = useState<CatalogTool | null>(null),
    [group, setGroup] = useState("content"),
    [locale, setLocale] = useState<"fr" | "en">("fr"),
    [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false),
    [listLoading, setListLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [review, setReview] = useState<CatalogWorkspace | null>(null),
    [receipt, setReceipt] = useState<CatalogPublication | null>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const publishTriggerRef = useRef<HTMLButtonElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const reviewWasOpen = useRef(false);
  useEffect(() => {
    if (review) reviewHeadingRef.current?.focus();
    else if (reviewWasOpen.current && !inlineSlug) {
      const trigger = publishTriggerRef.current;
      if (trigger && !trigger.disabled) trigger.focus();
      else workspaceRef.current?.focus();
    }
    reviewWasOpen.current = Boolean(review);
  }, [review, inlineSlug]);
  const editorRef = useRef<HTMLElement>(null),
    requestId = useRef(0);
  const draftCount = new Set([
    ...(workspace?.drafts.map((d) => d.slug) ?? []),
    ...session.savedDrafts.map((d) => d.slug),
  ]).size;
  const legacyDirty = Boolean(
    detail && value && JSON.stringify(detail.tool) !== JSON.stringify(value),
  );
  const dirty = legacyDirty || session.dirty || session.stagedEditing;
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);
  const blockedExit = useCallback(
    () =>
      setError(
        t(
          "Des modifications ne sont pas enregistrées. Enregistrez ou abandonnez vos saisies avant de quitter cet écran.",
          "You have unsaved changes. Save or discard your edits before leaving this screen.",
        ),
      ),
    [t],
  );
  useCatalogExitGuard(dirty, blockedExit, Boolean(suppliedSession));
  function message(error: unknown): string {
    const e = error as { status?: number; code?: string };
    if (e.code?.includes("UNCONFIGURED") || e.code?.includes("NOT_CONFIGURED"))
      return t(
        "La connexion GitHub du serveur doit être configurée pour activer l’édition et la publication.",
        "Configure the server GitHub connection to enable editing and publishing.",
      );
    if (e.status === 401 || e.status === 403)
      return t(
        "Votre session administrateur n’autorise plus cet accès. Reconnectez-vous.",
        "Your administrator session no longer permits access. Sign in again.",
      );
    if (e.status === 409)
      return t(
        "Le brouillon ou le catalogue a été modifié ailleurs. Vos saisies sont conservées. Rechargez la fiche après les avoir copiées, ou actualisez le lot avant publication.",
        "The draft or catalogue was modified elsewhere. Your edits are retained. Copy them before reloading the record, or refresh the batch before publishing.",
      );
    if (e.status === 400 || e.status === 413)
      return t(
        "Certains champs sont invalides ou la fiche est trop volumineuse. Vérifiez les valeurs, les URLs, les prix et leurs sources. Vos saisies sont conservées.",
        "Some fields are invalid or the record is too large. Check values, URLs, pricing and sources. Your edits are retained.",
      );
    return t(
      "Le catalogue est indisponible. Réessayez ; vos saisies sont conservées.",
      "The catalogue is unavailable. Try again; your edits are retained.",
    );
  }
  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    void loadCatalogWorkspace({ search, page, draftsOnly })
      .then((data) => {
        if (!cancelled) setWorkspace(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setWorkspace(null);
          setError(message(e));
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, page, draftsOnly, reload]);
  useEffect(
    () => () => {
      requestId.current++;
    },
    [],
  );
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("editor") === "inline" && params.get("tool"))
      void openInline(params.get("tool")!);
  }, []);
  async function openInline(slug: string) {
    if (legacyDirty) {
      blockedExit();
      return;
    }
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    setReview(null);
    try {
      if (!session.get(slug)) await session.flush();
      if (id !== requestId.current) return;
      const result = await loadCatalogDetail(slug);
      if (id !== requestId.current) return;
      session.adopt(result);
      setInlineSlug(slug);
      setDetail(null);
      setValue(null);
      link(slug);
    } catch (e) {
      if (id === requestId.current) setError(message(e));
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }
  async function reloadInline(removeDraft: boolean, reviewedVersion?: number) {
    if (!inlineSlug) return;
    const entry = session.get(inlineSlug);
    if (!entry || entry.saving) return;
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    setReview(null);
    try {
      if (removeDraft) {
        if (!entry.detail.capabilities?.canDiscardDraft) throw { status: 403 };
        if (reviewedVersion !== entry.detail.version) throw { status: 409 };
        await discardCatalogDraft(inlineSlug, reviewedVersion);
      }
      const result = await loadCatalogDetail(inlineSlug);
      if (id !== requestId.current) return;
      session.adopt(result, true);
      setReload((n) => n + 1);
    } catch (e) {
      if (id === requestId.current) setError(message(e));
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }
  async function backToRecords() {
    if (session.stagedEditing) { blockedExit(); return; }
    setBusy(true);
    try {
      await session.flush();
      if (inlineSlug) session.setStagedBlock(inlineSlug, null);
      setInlineSlug(null);
      link(null);
      setReload((n) => n + 1);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function prepareReview() {
    if (legacyDirty) {
      blockedExit();
      return;
    }
    setBusy(true);
    setError("");
    setReview(null);
    try {
      await session.flush();
      const next = await loadCatalogWorkspace();
      if (!next.capabilities?.canPublishAll) throw { status: 403 };
      const grouped: Record<string, CatalogValidationIssue[]> = {};
      const records: Record<string, CatalogEditorDetail> = {};
      const pending = [...next.drafts];
      await Promise.all(
        Array.from({ length: Math.min(3, pending.length) }, async () => {
          while (pending.length) {
            const draft = pending.shift()!;
            const d = await loadCatalogDetail(draft.slug);
            if (d.tool.slug !== draft.slug || d.version !== draft.version)
              throw { status: 409 };
            records[draft.slug] = d;
            grouped[draft.slug] = d.conflict
              ? [
                  {
                    path: "",
                    code: "SOURCE_CONFLICT",
                    stage: "publish",
                    severity: "error",
                  },
                ]
              : catalogValidationIssues(d.published, d.tool);
          }
        }),
      );
      const current = await loadCatalogWorkspace();
      if (
        current.revision !== next.revision ||
        current.headSha !== next.headSha
      )
        throw { status: 409 };
      setReviewDetails(records);
      setReviewIssues(grouped);
      reviewSequence.current = session.snapshot();
      setReview(current);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function open(slug: string, replaceUnsaved = false) {
    if (dirty && !replaceUnsaved) {
      setError(
        t(
          "Des modifications ne sont pas enregistrées. Enregistrez le brouillon ou abandonnez vos saisies avant de changer de fiche.",
          "You have unsaved changes. Save the draft or discard your edits before switching records.",
        ),
      );
      return;
    }
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await loadCatalogDetail(slug);
      if (id !== requestId.current) return;
      setInlineSlug(null);
      link(null);
      setDetail(result);
      setValue(result.tool);
      setGroup("content");
      setPreview(false);
      requestAnimationFrame(() => {
        editorRef.current?.scrollIntoView?.({ block: "start" });
        editorRef.current?.focus({ preventScroll: true });
      });
    } catch (e) {
      if (id === requestId.current) setError(message(e));
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }
  async function save() {
    if (!detail || !value || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await saveCatalogDraft({
        slug: detail.tool.slug,
        version: detail.version,
        baseHash: detail.baseHash,
        value,
      });
      setDetail(result);
      setValue(result.tool);
      setNotice(
        t(
          "Brouillon enregistré. Il sera inclus dans la prochaine publication groupée.",
          "Draft saved. It will be included in the next batch publication.",
        ),
      );
      setReload((n) => n + 1);
      setReview(null);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function discard() {
    if (!detail || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await discardCatalogDraft(detail.tool.slug, detail.version);
      const result = await loadCatalogDetail(detail.tool.slug);
      setDetail(result);
      setValue(result.tool);
      setReload((n) => n + 1);
      setReview(null);
      setNotice(
        t(
          "Brouillon supprimé. La fiche publiée est conservée.",
          "Draft removed. The published record is preserved.",
        ),
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (!review || dirty || busy) return;
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await session.flush();
      if (session.snapshot() !== reviewSequence.current) throw { status: 409 };
      const current = await loadCatalogWorkspace();
      if (
        current.revision !== review.revision ||
        current.headSha !== review.headSha
      )
        throw { status: 409 };
      if (!current.capabilities?.canPublishAll) throw { status: 403 };
      if (id !== requestId.current) return;
      const result = await publishCatalogDrafts(review.revision);
      if (id !== requestId.current) return;
      setReceipt(result);
      setNotice(
        t(
          "Commit envoyé sur main. La reconstruction du site doit encore se terminer avant la mise en ligne.",
          "Commit sent to main. The site rebuild must finish before the changes are live.",
        ),
      );
      setReview(null);
      session.clear();
      setReload((n) => n + 1);
      if (inlineSlug) {
        try {
          const next = await loadCatalogDetail(inlineSlug);
          if (id !== requestId.current) return;
          session.adopt(next);
        } catch {
          if (id !== requestId.current) return;
          // Publication succeeded; a failed read must not strand an empty fiche.
          setInlineSlug(null);
          link(null);
          setError(t(
            "La publication a été transmise, mais la fiche n’a pas pu être rechargée. Rouvrez-la depuis la liste pour réessayer.",
            "Publication was transmitted, but the record could not be reloaded. Reopen it from the list to retry.",
          ));
        }
      }
      if (detail) {
        try {
          const next = await loadCatalogDetail(detail.tool.slug);
          setDetail(next);
          setValue(next.tool);
        } catch {
          /* Commit receipt remains valid even when the follow-up read fails. */
        }
      }
    } catch (e) {
      setError(message(e));
      setReview(null);
      setReload((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }
  const fields = value
    ? GROUPS.find((g) => g.id === group)!.fields.filter(
        (field) =>
          (EDITABLE_CATALOG_FIELDS as readonly string[]).includes(field) &&
          field in value &&
          (group === "links" ||
            field === "name" ||
            field === "category" ||
            field === "defaultMonthlyPrice" ||
            field === "seo" ||
            (locale === "en" ? field.endsWith("En") : !field.endsWith("En"))),
      )
    : [];
  return (
    <section
      className="bo-catalog"
      ref={workspaceRef}
      tabIndex={-1}
      aria-label={t("Édition du catalogue", "Catalogue editor")}
    >
      {!review && !inlineSlug && <BackofficePageHeading title={t("Fiches", "Records")} description={t("Enregistrez vos brouillons, puis publiez tout le lot ensemble.", "Save drafts, then publish the whole batch together.")} action={<StackButton ref={publishTriggerRef} variant="primary" type="button" disabled={(!draftCount && !session.dirty) || busy || legacyDirty || listLoading || !workspace?.capabilities?.canPublishAll} onClick={() => void prepareReview()}>{t(`Mettre en ligne (${draftCount})`, `Publish (${draftCount})`)}</StackButton>} />}
      {error && (
        <div className="bo-catalog-feedback" role="alert">
          <p>{error}</p>
          <button
            className="mk-link"
            type="button"
            disabled={busy}
            onClick={() => {
              setError("");
              setReload((n) => n + 1);
            }}
          >
            {t("Actualiser le catalogue", "Refresh catalogue")}
          </button>
        </div>
      )}
      {notice && (
        <p className="bo-catalog-feedback" role="status">
          {notice}
        </p>
      )}
      {receipt && (
        <p className="bo-caption">
          <a
            className="mk-link"
            href={receipt.commitUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t("Voir le commit", "View commit")}{" "}
            {receipt.commitSha.slice(0, 10)}{" "}
            <ArrowUpRight size={14} aria-hidden />
          </a>
          {receipt.cleanupPending &&
            ` · ${t("Le nettoyage des brouillons reste à réconcilier. Réessayez la publication pour le terminer.", "Draft cleanup needs reconciliation. Retry publication to finish it.")}`}
        </p>
      )}
      {review && (
        <section
          className="bo-catalog-review"
          aria-label={t("Modifications à publier", "Changes to publish")}
        >
          <Button disabled={busy} onClick={() => setReview(null)}>{t("Retour aux fiches", "Back to records")}</Button>
          <h1 ref={reviewHeadingRef} tabIndex={-1}>
            {t(
              "Relire le lot avant publication",
              "Review the batch before publishing",
            )}
          </h1>
          <p>
            {t(
              "Toutes les saisies sont enregistrées. Toutes les fiches ci-dessous seront transmises ensemble après vérification.",
              "All edits are saved. Every record below will be transmitted together after review.",
            )}
          </p>
          <ul>
            {review.drafts.map((d) => (
              <li key={d.slug}>
                <strong>{d.name}</strong>
                <span>
                  {d.fields.map((f) => catalogFieldLabel(f, lang)).join(", ")}
                </span>
                {reviewDetails[d.slug] &&
                  changedCatalogFields(
                    reviewDetails[d.slug].published,
                    reviewDetails[d.slug].tool,
                  ).map((field) => (
                    <details className={styles.reviewChange} key={field}>
                      <summary>{catalogFieldLabel(field, lang)}</summary>
                      <div>
                        <p>{t("Fiche publiée", "Published record")}</p>
                        <CatalogValue
                          value={reviewDetails[d.slug].published[field]}
                        />
                        <p>{t("Brouillon", "Draft")}</p>
                        <CatalogValue
                          value={reviewDetails[d.slug].tool[field]}
                        />
                      </div>
                    </details>
                  ))}
                <ul>
                  {reviewIssues[d.slug]?.map((i, n) => (
                    <li key={n}>
                      {i.path} · {catalogIssueMessage(i.code, lang)}
                    </li>
                  ))}
                </ul>
                <button
                  className="mk-link"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setReview(null);
                    void openInline(d.slug);
                  }}
                >
                  {t("Relire la fiche", "Review record")}
                </button>
              </li>
            ))}
          </ul>
          <div className="bo-catalog-actions">
            <StackButton
              variant="primary"

              type="button"
              disabled={
                busy ||
                dirty ||
                Object.values(reviewIssues)
                  .flat()
                  .some((i) => i.severity === "error")
              }
              onClick={() => void publish()}
            >
              {t(
                `Confirmer la publication de ${review.drafts.length} fiches`,
                `Confirm publication of ${review.drafts.length} records`,
              )}
            </StackButton>
            <button
              className="mk-button tt-button-secondary"
              type="button"
              disabled={busy}
              onClick={() => setReview(null)}
            >
              {t("Annuler", "Cancel")}
            </button>
          </div>
        </section>
      )}
      {!review && !inlineSlug && (
        <>
          <form
            className={listStyles.search}
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(query.trim());
              setPage(1);
            }}
          >
            <Field type="search" label={t("Rechercher une fiche", "Search records")} placeholder={t("Rechercher une fiche…", "Search records…")} value={query} maxLength={200} onChange={(event) => setQuery(event.target.value)} />
            <Button type="submit" disabled={busy}>{t("Rechercher", "Search")}</Button>
            <label className="bo-catalog-filter">
              <input
                type="checkbox"
                checked={draftsOnly}
                onChange={(event) => {
                  setDraftsOnly(event.target.checked);
                  setPage(1);
                }}
              />
              {t("Brouillons uniquement", "Drafts only")}
            </label>
            <button
              className="mk-link"
              type="button"
              aria-label={t("Actualiser les fiches", "Refresh records")}
              disabled={busy || listLoading}
              onClick={() => {
                setError("");
                setReload((n) => n + 1);
              }}
            >
              <RefreshCw size={18} />
            </button>
          </form>
          {listLoading ? (
            <p>{t("Chargement du catalogue…", "Loading catalogue…")}</p>
          ) : (
            workspace && (
              <>
                <BackofficeRecords records={workspace.tools} lang={lang} busy={busy} onEdit={(slug) => void openInline(slug)} onLegacy={(slug) => void open(slug)} />
                <div className="bo-catalog-pagination">
                  <span>
                    {workspace.total} {t("fiches", "records")} ·{" "}
                    {t("Page", "Page")} {workspace.page}
                  </span>
                  <button
                    className="mk-link"
                    type="button"
                    disabled={page <= 1 || busy}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {t("Précédente", "Previous")}
                  </button>
                  <button
                    className="mk-link"
                    type="button"
                    disabled={
                      page * workspace.pageSize >= workspace.total || busy
                    }
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("Suivante", "Next")}
                  </button>
                </div>
              </>
            )
          )}
        </>
      )}
      {!review && inlineSlug && (
        <CatalogInlineFiche
          key={inlineSlug}
          session={session}
          slug={inlineSlug}
          lang={lang}
          onReauthenticate={onReauthenticate}
          locked={busy || Boolean(review)}
          onReload={() => void reloadInline(false)}
          onRemoveDraft={(version) => void reloadInline(true, version)}
          onBack={() => void backToRecords()}
          onError={(e) => setError(message(e))}
        />
      )}
      {!review && detail && value && (
        <section
          className="bo-catalog-editor"
          ref={editorRef}
          tabIndex={-1}
          aria-label={t("Modifier la fiche", "Edit record")}
        >
          <header className="bo-detail-toolbar">
            <div>
              <p className="bo-eyebrow">
                {detail.tool.slug} ·{" "}
                {detail.draft
                  ? t("Brouillon sauvegardé", "Saved draft")
                  : t("Version publiée", "Published version")}
              </p>
              <h2>{value.name}</h2>
            </div>
            <div className="bo-catalog-actions">
              <button
                className="mk-button tt-button-secondary"
                type="button"
                disabled={busy}
                onClick={() => setPreview((v) => !v)}
              >
                {preview
                  ? t("Revenir à l’édition", "Back to editing")
                  : t("Aperçu", "Preview")}
              </button>
              <StackButton
                variant="primary"

                type="button"
                disabled={!dirty || busy || detail.conflict}
                onClick={() => void save()}
              >
                {t("Enregistrer le brouillon", "Save draft")}
              </StackButton>
            </div>
          </header>
          {detail.conflict && (
            <p className="bo-catalog-feedback" role="alert">
              {t(
                "Cette fiche a changé dans le dépôt depuis le début du brouillon. Copiez vos modifications puis supprimez le brouillon pour repartir de la version publiée.",
                "This record changed in the repository since the draft began. Copy your edits, then remove the draft to start from the published version.",
              )}
            </p>
          )}
          <div className="bo-catalog-actions">
            <div
              className="mk-segmented"
              aria-label={t("Langue du contenu", "Content language")}
            >
              {(["fr", "en"] as const).map((language) => (
                <button
                  key={language}
                  type="button"
                  aria-pressed={locale === language}
                  onClick={() => setLocale(language)}
                >
                  {language === "fr" ? "Français" : "English"}
                </button>
              ))}
            </div>
            <p className="bo-caption">
              {dirty
                ? t("Modifications non enregistrées", "Unsaved changes")
                : t(
                    "Toutes les saisies sont enregistrées",
                    "All edits are saved",
                  )}
            </p>
          </div>
          {preview ? (
            <article
              className="bo-catalog-preview"
              data-testid="catalog-preview"
            >
              <p className="bo-eyebrow">
                {t(
                  "Aperçu du contenu · non publié",
                  "Content preview · unpublished",
                )}
              </p>
              <h3>{value.name}</h3>
              <p>
                {String(
                  value[
                    locale === "fr" ? "shortDescription" : "shortDescriptionEn"
                  ] ?? "",
                )}
              </p>
              {GROUPS.map((g) => (
                <section key={g.id}>
                  <h3>{t(g.fr, g.en)}</h3>
                  {g.fields
                    .filter(
                      (f) =>
                        (EDITABLE_CATALOG_FIELDS as readonly string[]).includes(
                          f,
                        ) &&
                        f in value &&
                        (g.id === "seo" ||
                          g.id === "links" ||
                          f === "name" ||
                          f === "category" ||
                          f === "defaultMonthlyPrice" ||
                          (locale === "en"
                            ? f.endsWith("En")
                            : !f.endsWith("En"))),
                    )
                    .map((field) => (
                      <div key={field} className="bo-catalog-preview-field">
                        <h4>
                          {catalogFieldLabel(field, lang)}
                          {changedCatalogFields(
                            detail.published,
                            value,
                          ).includes(field)
                            ? ` · ${t("modifié", "changed")}`
                            : ""}
                        </h4>
                        <CatalogValue value={value[field]} />
                      </div>
                    ))}
                </section>
              ))}
            </article>
          ) : (
            <>
              <div
                className="mk-segmented bo-tabs"
                aria-label={t("Rubriques de la fiche", "Record sections")}
              >
                {GROUPS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={group === g.id}
                    onClick={() => setGroup(g.id)}
                  >
                    {t(g.fr, g.en)}
                  </button>
                ))}
              </div>
              {group === "pricing" && (
                <p className="bo-caption">
                  {t(
                    "Conservez les montants, devises, périodes et sources tels qu’observés. Aucune conversion ni traduction automatique.",
                    "Keep amounts, currencies, periods and sources as observed. No automatic conversion or translation.",
                  )}
                </p>
              )}
              <fieldset
                disabled={busy || Boolean(review)}
                className="bo-catalog-fields"
              >
                {fields.length ? (
                  fields.map((field) => (
                    <CatalogField
                      key={field}
                      field={field}
                      value={value[field]}
                      onChange={(next) => {
                        setValue({ ...value, [field]: next });
                        setNotice("");
                        setReview(null);
                      }}
                    />
                  ))
                ) : (
                  <p>
                    {t(
                      "Aucun champ de cette rubrique dans cette langue.",
                      "No fields in this section for this language.",
                    )}
                  </p>
                )}
              </fieldset>
            </>
          )}
          <footer className="bo-catalog-editor-footer">
            <div>
              <p className="bo-caption">
                {t(
                  "Les identifiants, les relations techniques et les données non éditables sont conservés.",
                  "Identifiers, technical relations and non-editable data are preserved.",
                )}
              </p>
              <a
                className="mk-link"
                href={`/${lang}/tool/${detail.tool.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("Voir la fiche publiée", "View published record")}{" "}
                <ArrowUpRight size={14} aria-hidden />
              </a>
            </div>
            <div className="bo-catalog-actions">
              {dirty && (
                <button
                  type="button"
                  className="mk-link"
                  disabled={busy}
                  onClick={() => {
                    setValue(detail.tool);
                    setError("");
                  }}
                >
                  {t("Abandonner mes saisies", "Discard my edits")}
                </button>
              )}
              {detail.draft && (
                <button
                  type="button"
                  className="mk-link"
                  disabled={busy || dirty}
                  onClick={() => void discard()}
                >
                  {t("Supprimer ce brouillon", "Remove this draft")}
                </button>
              )}
              <button
                type="button"
                className="mk-link"
                disabled={busy || dirty}
                onClick={() => void open(detail.tool.slug)}
              >
                {t("Recharger la fiche", "Reload record")}
              </button>
            </div>
          </footer>
        </section>
      )}
    </section>
  );
}
