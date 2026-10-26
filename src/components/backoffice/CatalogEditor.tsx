import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { useCatalogExitGuard } from "./useCatalogExitGuard";
import { Button as StackButton } from "@/components/stack/StackKit";
import ToolLogo from "@/components/ToolLogo";
import { Search, RefreshCw, ArrowUpRight } from "@/lib/icons";
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
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { lang, t } = useLang();
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
  const editorRef = useRef<HTMLElement>(null),
    requestId = useRef(0);
  const dirty = Boolean(
    detail && value && JSON.stringify(detail.tool) !== JSON.stringify(value),
  );
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
  useCatalogExitGuard(dirty, blockedExit);
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
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await publishCatalogDrafts(review.revision);
      setReceipt(result);
      setNotice(
        t(
          "Commit envoyé sur main. La reconstruction du site doit encore se terminer avant la mise en ligne.",
          "Commit sent to main. The site rebuild must finish before the changes are live.",
        ),
      );
      setReview(null);
      setReload((n) => n + 1);
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
      aria-label={t("Édition du catalogue", "Catalogue editor")}
    >
      <div className="bo-catalog-publishbar">
        <div>
          <strong>
            {t(
              "Vos fiches, une seule publication",
              "Your records, one publication",
            )}
          </strong>
          <p>
            {t(
              "Enregistrez vos brouillons, puis publiez tout le lot ensemble.",
              "Save drafts, then publish the whole batch together.",
            )}
          </p>
        </div>
        <StackButton
          variant="primary"
          type="button"

          disabled={!workspace?.drafts.length || busy || dirty || listLoading}
          onClick={() => {
            setReview(workspace);
            setError("");
          }}
        >
          {t(
            `Publier toutes les modifications (${workspace?.drafts.length ?? 0})`,
            `Publish all changes (${workspace?.drafts.length ?? 0})`,
          )}
        </StackButton>
      </div>
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
          <h2>
            {t(
              "Relire le lot avant publication",
              "Review the batch before publishing",
            )}
          </h2>
          <p>
            {t(
              "Toutes les fiches ci-dessous seront envoyées dans un seul commit. Les saisies non enregistrées sont exclues.",
              "All records below will be sent in one commit. Unsaved edits are excluded.",
            )}
          </p>
          <ul>
            {review.drafts.map((d) => (
              <li key={d.slug}>
                <strong>{d.name}</strong>
                <span>
                  {d.fields.map((f) => catalogFieldLabel(f, lang)).join(", ")}
                </span>
                <button
                  className="mk-link"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setReview(null);
                    void open(d.slug);
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
              disabled={busy || dirty}
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
      <form
        className="bo-search"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(query.trim());
          setPage(1);
        }}
      >
        <div className="bo-search-field">
          <Search size={18} aria-hidden />
          <input
            type="search"
            aria-label={t("Rechercher une fiche", "Search records")}
            placeholder={t("Rechercher une fiche…", "Search records…")}
            value={query}
            maxLength={200}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button
          className="mk-button tt-button-secondary"
          type="submit"
          disabled={busy}
        >
          {t("Rechercher", "Search")}
        </button>
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
            <div
              className="bo-catalog-list"
              aria-label={t("Fiches du catalogue", "Catalogue records")}
            >
              {workspace.tools.map((tool) => (
                <button
                  type="button"
                  className="bo-catalog-list-row"
                  key={tool.slug}
                  disabled={busy}
                  aria-label={t(`Modifier ${tool.name}`, `Edit ${tool.name}`)}
                  aria-current={
                    detail?.tool.slug === tool.slug ? "true" : undefined
                  }
                  onClick={() => void open(tool.slug)}
                >
                  <ToolLogo
                    tool={{ slug: tool.slug, name: tool.name }}
                    size={28}
                  />
                  <span>
                    <strong>{tool.name}</strong>
                    <small>{tool.category}</small>
                  </span>
                  <span className="bo-caption">
                    {tool.draft
                      ? t("Brouillon", "Draft")
                      : t("Publié", "Published")}
                  </span>
                </button>
              ))}
            </div>
            {workspace.tools.length === 0 && (
              <p>{t("Aucune fiche trouvée.", "No records found.")}</p>
            )}
            <div className="bo-catalog-pagination">
              <span>
                {workspace.total} {t("fiches", "records")} · {t("Page", "Page")}{" "}
                {workspace.page}
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
                disabled={page * workspace.pageSize >= workspace.total || busy}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("Suivante", "Next")}
              </button>
            </div>
          </>
        )
      )}
      {detail && value && (
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
              <fieldset disabled={busy} className="bo-catalog-fields">
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
