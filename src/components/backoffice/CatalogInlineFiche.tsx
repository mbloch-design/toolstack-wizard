import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCategories, useToolSummaries } from "@/hooks/useSupabaseData";
import { useCurrency } from "@/hooks/useCurrency";
import { ToolDetailPresentation, type ToolDetailSubPage } from "@/pages/ToolDetailPage";
import { mapToolFromJson } from "@/lib/toolFromJson";
import { catalogCapabilities } from "@/lib/catalogPolicy";
import { CatalogEditorPresentation } from "./CatalogEditingContext";
import { catalogIssueMessage } from "./catalogEditingModel";
import type { CatalogDraftSession } from "./catalogDraftSession";
import { Button, LinkAction } from "@/ds/Controls/Controls";
import { CatalogIssues, CatalogToolbar } from "@/ds/CatalogAuthoring/CatalogAuthoring";
import styles from "@/ds/CatalogAuthoring/CatalogAuthoring.module.css";

export function CatalogInlineFiche({
  session,
  slug,
  lang,
  onBack,
  onError,
  locked,
  onReload,
  onRemoveDraft,
  onReauthenticate,
}: {
  onReauthenticate?: () => void;
  locked: boolean;
  onReload: () => void;
  onRemoveDraft: (version: number) => void;
  session: CatalogDraftSession;
  slug: string;
  lang: "fr" | "en";
  onBack: () => void;
  onError: (e: unknown) => void;
}) {
  const previewTrigger = useRef<HTMLButtonElement>(null);
  const previewBack = useRef<HTMLButtonElement>(null);
  const wasPreviewOpen = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState<ToolDetailSubPage>("presentation");
  const [confirmVersion, setConfirmVersion] = useState<number | null>(null);
  useEffect(() => {
    if (previewOpen) previewBack.current?.focus();
    else if (wasPreviewOpen.current) previewTrigger.current?.focus();
    wasPreviewOpen.current = previewOpen;
  }, [previewOpen]);
  const { tools } = useToolSummaries({ refreshRemote: false });
  const { categories } = useCategories();
  const { currency } = useCurrency();
  const entry = session.get(slug);
  if (!entry) return null;
  const { detail, value } = entry;
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const issues = session.issues(slug);
  const dirty = JSON.stringify(detail.tool) !== JSON.stringify(value);
  const caps = detail.capabilities ?? catalogCapabilities(null);
  const error = entry.error as { status?: number } | undefined;
  return (
    <section
      className={styles.editor}
      data-catalog-editor=""
      aria-label={t("Édition directe de la fiche", "Direct record editing")}
    >
      <div hidden={previewOpen}>
      <CatalogToolbar>
        <h1 className={styles.editorTitle}>{value.name}</h1>
        <Button onClick={onBack}>
          {t("Retour aux fiches", "Back to records")}
        </Button>
        <Button ref={previewTrigger} onClick={() => setPreviewOpen(true)}>{t("Aperçu", "Preview")}</Button>
        <p role="status">
          {entry.saving
            ? t("Enregistrement…", "Saving…")
            : error
              ? t(
                  "Saisies conservées sur cet écran",
                  "Edits retained on this screen",
                )
              : dirty
                ? t("Modifications locales", "Local changes")
                : detail.draft
                  ? t("Brouillon enregistré", "Draft saved")
                  : t("Version publiée", "Published version")}
        </p>
        <p>
          {t(
            "Le brouillon est enregistré automatiquement après votre saisie.",
            "Your draft saves automatically after you finish typing.",
          )}
        </p>
      </CatalogToolbar>
      {!caps.canSaveDraft && (
        <p role="alert">
          {t(
            "Votre accès ne permet pas de modifier cette fiche.",
            "Your access does not allow editing this record.",
          )}
        </p>
      )}
      {(error || detail.conflict) && (
        <div className="bo-catalog-feedback" role="alert">
          <p>
            {error?.status === 409 || detail.conflict
              ? t(
                  "Cette fiche a changé ailleurs. Vos saisies sont conservées. Comparez la fiche publiée avant d’abandonner ou de reprendre vos modifications.",
                  "This record changed elsewhere. Your edits are retained. Compare the published record before discarding or reapplying your changes.",
                )
              : error?.status === 401 || error?.status === 403
                ? t(
                    "Reconnectez-vous avec le même compte pour retrouver vos saisies puis réessayez.",
                    "Sign in with the same account to recover your edits, then retry.",
                  )
                : t(
                    "Le brouillon n’a pas pu être enregistré. Corrigez les champs signalés ou réessayez.",
                    "The draft could not be saved. Correct the highlighted fields or retry.",
                  )}
          </p>
          {(error?.status === 401 || error?.status === 403) &&
            onReauthenticate && (
              <Button onClick={onReauthenticate}>
                {t("Me reconnecter", "Sign in again")}
              </Button>
            )}
          {error?.status !== 409 && !detail.conflict && (
            <Button onClick={() => void session.flush().catch(onError)}>
              {t("Réessayer l’enregistrement", "Retry saving")}
            </Button>
          )}
        </div>
      )}
      {issues.length > 0 && (
        <CatalogIssues summary={`${t("À vérifier avant mise en ligne", "Check before publishing")} (${issues.length})`}>
          <ul>
            {issues.map((i, n) => (
              <li key={n}>
                {i.path} · {catalogIssueMessage(i.code, lang)}
                {i.severity === "warning"
                  ? t(" (information)", " (information)")
                  : ""}
              </li>
            ))}
          </ul>
        </CatalogIssues>
      )}
      <fieldset disabled={locked} className={styles.content}>
        <CatalogEditorPresentation
          key={slug}
          context={{
            lang,
            value,
            base: entry.base,
            published: detail.published,
            capabilities: caps,
            issues,
            categories,
            tools,
            onChange: (path, value) => session.change(slug, [{ path, value }]),
            onRemove: (path) =>
              session.change(slug, [{ path, value: undefined, remove: true }]),
            onChanges: (changes) => session.change(slug, changes),
          }}
        >
          {(editing) => (
            <ToolDetailPresentation
              tool={mapToolFromJson(value)}
              tools={tools}
              categories={categories}
              lang={lang}
              currency={currency}
              privateMode
              authorMode
              editing={editing}
            />
          )}
        </CatalogEditorPresentation>
      </fieldset>
      <CatalogToolbar>
        <Button
          disabled={locked || entry.saving || !dirty}
          onClick={() => session.discardLocal(slug)}
        >
          {t("Abandonner mes saisies", "Discard my edits")}
        </Button>
        <Button disabled={locked || entry.saving || dirty} onClick={onReload}>
          {t("Recharger la fiche", "Reload record")}
        </Button>
        {detail.draft && caps.canDiscardDraft && (
          <Button
            disabled={locked || entry.saving || dirty}
            onClick={() => setConfirmVersion(detail.version)}
          >
            {t("Supprimer ce brouillon", "Remove this draft")}
          </Button>
        )}
        <LinkAction
          href={`/${lang}/tool/${slug}`}
          target="_blank"
          rel="noreferrer"
        >
          {t("Comparer à la fiche publiée", "Compare with published record")}
        </LinkAction>
      </CatalogToolbar>
      </div>
      {previewOpen && <section aria-label={t("Aperçu du brouillon", "Draft preview")} data-testid="catalog-live-preview">
        <nav aria-label={t("Navigation de l’aperçu", "Preview navigation")}>
        <CatalogToolbar>
          <Button ref={previewBack} onClick={() => setPreviewOpen(false)}>{t("Revenir à l’édition", "Back to editing")}</Button>
          {([ ["presentation", "Présentation", "Overview"], ["prix", "Prix", "Pricing"], ["avis", "Avis", "Reviews"], ["alternatives", "Alternatives", "Alternatives"] ] as const).map(([page, fr, en]) => <Button key={page} aria-pressed={previewPage === page} onClick={() => setPreviewPage(page)}>{t(fr, en)}</Button>)}
        </CatalogToolbar>
        </nav>
        <ToolDetailPresentation tool={mapToolFromJson(value)} tools={tools} categories={categories} lang={lang} currency={currency} privateMode previewMode subPage={previewPage} />
      </section>}
      <Dialog open={confirmVersion !== null} onOpenChange={(open) => { if (!open) setConfirmVersion(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Supprimer le brouillon", "Remove draft")}</DialogTitle>
            <DialogDescription>{t(`Supprimer le brouillon de ${value.name} effacera définitivement ses modifications enregistrées. La fiche publiée restera inchangée.`, `Removing the draft for ${value.name} permanently discards its saved changes. The published record remains unchanged.`)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setConfirmVersion(null)}>{t("Annuler", "Cancel")}</Button>
            <Button disabled={locked || entry.saving || dirty || confirmVersion !== detail.version} onClick={() => { if (confirmVersion !== null) onRemoveDraft(confirmVersion); setConfirmVersion(null); }}>{t("Confirmer la suppression", "Confirm removal")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
