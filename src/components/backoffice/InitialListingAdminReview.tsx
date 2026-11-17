import { useEffect, useRef, useState } from "react";
import BackofficePageHeading from "@/ds/BackofficePageHeading/BackofficePageHeading";
import Button, { linkClass } from "@/ds/Button/Button";
import Field, { FormGrid, SelectField, TextAreaField } from "@/ds/Field/Field";
import { Notice } from "@/ds/Notice/Notice";
import { useLang } from "@/hooks/useLang";
import categories from "@/data/categories_index.json";
import { supabase } from "@/integrations/supabase/client";
import type { ProductDraft } from "@/lib/publisherCatalog";
import { PublisherApiError, publisherRequest, type ListingRequest } from "@/lib/publisherCatalogApi";
import PublisherFiche from "@/components/publisher/PublisherFiche";
import { listingStatus } from "@/components/publisher/ListingStatusCard";
import { useCatalogExitGuard } from "./useCatalogExitGuard";
import styles from "./ContributionQueue.module.css";

type ProductRevision = { id: string; hash: string; value: ProductDraft };
type EditorialRevision = { id: string; hash: string; category: string; fields: Record<string, unknown> };
type Brand = { id: string; name: string; websiteDomain: string };
type Review = {
  listing: ListingRequest;
  approvalId: string | null;
  productRevision: ProductRevision | null;
  editorialRevision: EditorialRevision | null;
  confirmation: { decision: "confirm" | "requestChanges"; note: string; productRevisionId: string } | null;
  badgeUrl: string | null;
};
type Approval = { approvalId: string; toolId: string; version: number };
const endpoint = "/api/backoffice-listing-review";
const editableStatuses = ["submitted", "in_preparation", "changes_requested", "ready"];
const analysisStatuses = [...editableStatuses, "facts_to_review"];

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function emptyFacts({ name, websiteUrl, media }: ListingRequest): ProductDraft {
  const emptyLocale = { shortDescription: null, productDescription: null, features: [], useCases: [] };
  return {
    schemaVersion: 1, name, websiteUrl, localized: { fr: emptyLocale, en: emptyLocale },
    plans: [], media: media ?? [], classificationProposals: [], integrations: [],
  };
}

export default function InitialListingAdminReview({ listingId, brands, onBack }: {
  listingId: string;
  brands: Brand[];
  onBack: () => void;
}) {
  const { t } = useLang();
  const [review, setReview] = useState<Review | null>(null);
  const latest = useRef<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [factEdits, setFactEdits] = useState(false);
  const operation = useRef(false);
  const scope = useRef<AbortController | null>(null);
  const text = useRef(t);
  text.current = t;

  useEffect(() => {
    const controller = new AbortController();
    scope.current = controller;
    latest.current = null;
    setReview(null);
    setError("");
    setApproval(null);
    setFactEdits(false);
    void publisherRequest<{ review: Review }>(getToken, `${endpoint}?id=${encodeURIComponent(listingId)}`, { signal: controller.signal })
      .then(({ review }) => {
        if (controller.signal.aborted) return;
        latest.current = review;
        setReview(review);
      }, () => {
        if (!controller.signal.aborted) setError(text.current("Impossible de charger cette demande.", "This application could not be loaded."));
      });
    return () => controller.abort();
  }, [listingId, reload]);

  async function mutate(command: object) {
    const signal = scope.current?.signal;
    if (!latest.current || operation.current || !signal || signal.aborted) throw new Error("LISTING_ACTION_UNAVAILABLE");
    const { id, version } = latest.current.listing;
    operation.current = true;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await publisherRequest<{ review: Review } | { approval: Approval }>(getToken, endpoint, {
        method: "POST", signal, body: { ...command, id, version },
      });
      if (signal.aborted) throw new Error("LISTING_ACTION_UNAVAILABLE");
      if ("review" in result) {
        latest.current = result.review;
        setReview(result.review);
      } else {
        setApproval(result.approval);
      }
      setNotice("approval" in result
        ? t("Fiche rattachée. Sa première version est prête pour le lot de publication.", "Listing assigned. Its first version is ready for the publication batch.")
        : t("Étape enregistrée.", "Update saved."));
      return result;
    } catch (cause) {
      if (!signal.aborted) {
        if (cause instanceof PublisherApiError && [401, 403].includes(cause.status)) {
          latest.current = null;
          setReview(null);
        }
        setError(cause instanceof PublisherApiError && cause.status === 409
          ? t("La version ou les conditions de ce dossier ont changé. Actualisez avant de poursuivre.", "The application version or requirements changed. Refresh before continuing.")
          : t("L’étape n’a pas été enregistrée. Vérifiez les champs et réessayez.", "The update could not be saved. Check the fields and try again."));
      }
      throw cause;
    } finally {
      operation.current = false;
      if (!signal.aborted) setBusy(false);
    }
  }

  const listing = review?.listing;
  const product = review?.productRevision;
  const editorial = review?.editorialRevision;
  const sealed = !!(review?.approvalId || approval);
  const editable = !!listing && editableStatuses.includes(listing.status) && !sealed;
  const canApproveEditorial = !!listing && analysisStatuses.includes(listing.status) && !sealed;
  const confirmed = !!product && review?.confirmation?.decision === "confirm" && review.confirmation.productRevisionId === product.id;
  const canRequestReview = !!product && listing?.status === "in_preparation" && !review?.confirmation && !sealed;
  const promotable = !!product && !!editorial && confirmed && listing?.status === "ready" && !sealed;

  async function saveFacts(value: ProductDraft) {
    const result = await mutate({ action: "prepareInitial", value });
    if (!("review" in result) || !result.review.productRevision) throw new Error("MISSING_REVISION");
    return result.review.productRevision.value;
  }

  return <section className={styles.queue} aria-busy={busy}>
    <BackofficePageHeading title={listing?.name || t("Première fiche", "Initial listing")} action={<Button disabled={busy || factEdits} onClick={onBack}>{t("Retour aux demandes", "Back to requests")}</Button>} />
    {error && <Notice title={error} role="alert" actions={<Button disabled={busy || factEdits} onClick={() => setReload(reload + 1)}>{t("Actualiser", "Refresh")}</Button>} />}
    {notice && <p role="status">{notice}</p>}
    {!review && !error && <p role="status">{t("Chargement du dossier…", "Loading application…")}</p>}
    {listing && review && <>
      <section className={styles.content} aria-label={t("État du dossier", "Application status")}>
        <dl className={styles.metadata}>
          <div><dt>{t("Demande", "Application")}</dt><dd>{listingStatus(listing.status, t)}</dd></div>
          <div><dt>{t("Site officiel", "Official website")}</dt><dd><a href={listing.websiteUrl} className={linkClass("inline")} target="_blank" rel="noreferrer">{listing.websiteUrl}</a></dd></div>
          <div><dt>{t("Rôle déclaré", "Applicant role")}</dt><dd>{listing.representativeRole || "—"}</dd></div>
          <div><dt>{t("Informations transmises", "Information provided")}</dt><dd>{listing.notes || "—"}</dd></div>
          <div><dt>{t("Condition commerciale", "Offer requirement")}</dt><dd>{listing.commercialStatus === "satisfied" ? t("Remplie", "Met") : t("À vérifier", "Needs verification")}</dd></div>
          <div><dt>{t("Fiche publique", "Public listing")}</dt><dd>{listing.deliveryStatus === "published" ? t("En ligne", "Live") : t("Non publiée", "Unpublished")}</dd></div>
        </dl>
        {review.badgeUrl && <a href={review.badgeUrl} className={linkClass("inline")} target="_blank" rel="noreferrer">{t("Ouvrir la page du badge", "Open the badge page")}</a>}
      </section>
      {review.confirmation && <Notice title={confirmed ? t("Cette version factuelle est confirmée.", "This factual version is confirmed.")
        : t("Le représentant a demandé des corrections.", "The representative requested corrections.")}>
        {review.confirmation.note && <p>{review.confirmation.note}</p>}
      </Notice>}
      {sealed && <Notice title={t("Première version approuvée. La livraison est suivie dans le lot de publication.", "First version approved. Delivery is tracked in the publication batch.")} />}
      <section className={styles.content} aria-labelledby="initial-product-facts">
        <h2 id="initial-product-facts">{t("Faits produit", "Product facts")}</h2>
        <PublisherFiche value={product?.value ?? emptyFacts(listing)} canEdit={editable && !busy} onSave={editable ? saveFacts : undefined}
          onDirtyChange={setFactEdits} lockWebsite
          renderReview={(saveCurrent, saving) => <div className={styles.actions}>
            {editable && !product && <Button variant="primary" disabled={busy || saving || factEdits} onClick={() => void saveFacts(emptyFacts(listing)).catch(() => {})}>
              {t("Préparer les faits", "Prepare product facts")}
            </Button>}
            {canRequestReview && <Button variant="primary" disabled={busy || saving} onClick={async () => {
              if (!await saveCurrent() || !latest.current?.productRevision) return;
              void mutate({ action: "requestFactualReview", productRevisionId: latest.current.productRevision.id }).catch(() => {});
            }}>{t("Demander la relecture factuelle", "Request factual review")}</Button>}
          </div>} />
      </section>
      {canApproveEditorial && <EditorialForm key={editorial?.id ?? "new"}
        revision={editorial ?? null} disabled={busy || factEdits} approve={async (category, fields) => {
          await mutate({ action: "approveInitialEditorial", category, fields });
        }} />}
      {promotable && product && editorial && <PromotionForm listing={listing} brands={brands} disabled={busy || factEdits}
        promote={async (brand, idempotencyKey) => {
          await mutate({ action: "promoteInitial", productRevisionId: product.id, editorialRevisionId: editorial.id, idempotencyKey, ...brand });
        }} />}
    </>}
  </section>;
}

const axes = [
  ["valeurAjoutee", "Valeur ajoutée", "Added value"],
  ["simplicite", "Simplicité", "Ease of use"],
  ["utilisation", "Utilisation", "Task effectiveness"],
  ["puissance", "Puissance", "Power"],
  ["reversibilite", "Réversibilité", "Reversibility"],
] as const;
type Axis = typeof axes[number][0];
type Rating = Partial<Record<Axis, number>> & { notedOn?: string; lastActivityVerifiedOn?: string; evidence?: Partial<Record<Axis, string>>; evidenceEn?: Partial<Record<Axis, string>> };
const plain = (value: unknown) => typeof value === "string" ? value : "";
const lines = (value: unknown) => Array.isArray(value) ? value.filter((item) => typeof item === "string").join("\n") : "";
const splitLines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

function EditorialForm({ revision, disabled, approve }: {
  revision: EditorialRevision | null;
  disabled: boolean;
  approve: (category: string, fields: Record<string, unknown>) => Promise<void>;
}) {
  const { lang, t } = useLang();
  const original = revision?.fields ?? {};
  const [category, setCategory] = useState(revision?.category ?? "");
  const [fields, setFields] = useState(original);
  const [guard, setGuard] = useState("");
  const rating = (fields.toolTrimRating ?? {}) as Rating;
  const rated = axes.some(([axis]) => !!rating[axis]);
  const dirty = category !== (revision?.category ?? "") || JSON.stringify(fields) !== JSON.stringify(original);
  useCatalogExitGuard(dirty, () => setGuard(t("Approuvez l’analyse ou annulez vos changements avant de quitter.", "Approve the analysis or cancel your edits before leaving.")));
  const patch = (key: string, value: unknown) => setFields((current) => ({ ...current, [key]: value }));
  const patchRating = (value: Rating) => patch("toolTrimRating", { ...rating, ...value });

  return <form className={styles.content} aria-labelledby="initial-editorial" onSubmit={(event) => {
    event.preventDefault();
    if (disabled || !category || !plain(fields.longDescription).trim() || !plain(fields.longDescriptionEn).trim()) return;
    setGuard("");
    void approve(category, fields).catch(() => {});
  }}>
    <h2 id="initial-editorial">{t("Analyse indépendante de ToolTrim", "Independent ToolTrim analysis")}</h2>
    {revision && <p>{t("Une version de l’analyse est approuvée.", "An analysis version is approved.")}</p>}
    <SelectField label={t("Catégorie de la fiche", "Listing category")} required value={category} disabled={disabled} onChange={(event) => setCategory(event.target.value)}>
      <option value="">{t("Choisir une catégorie", "Choose a category")}</option>
      {categories.map((item) => <option value={item.id} key={item.id}>{lang === "fr" ? item.name : item.nameEn}</option>)}
    </SelectField>
    <FormGrid>
      {(["fr", "en"] as const).map((locale) => {
        const suffix = locale === "fr" ? "" : "En";
        const language = locale === "fr" ? t("français", "French") : t("anglais", "English");
        const verdictKey = `verdict${suffix}`;
        const verdict = fields[verdictKey] as Record<string, unknown> | undefined;
        return <div className={styles.content} key={locale}>
          <TextAreaField required label={t(`Analyse · ${language}`, `Analysis · ${language}`)} value={plain(fields[`longDescription${suffix}`])} disabled={disabled}
            onChange={(event) => patch(`longDescription${suffix}`, event.target.value)} />
          <TextAreaField label={t(`Verdict · ${language}`, `Verdict · ${language}`)} value={plain(verdict?.summary)} disabled={disabled}
            onChange={(event) => patch(verdictKey, { ...verdict, summary: event.target.value })} />
          {[["pros", t("Points forts", "Strengths")], ["cons", t("Limites", "Limitations")]].map(([key, label]) => <TextAreaField
            key={key} label={`${label} · ${language}`} value={lines(fields[key + suffix])} disabled={disabled}
            help={t("Un élément par ligne.", "One item per line.")}
            onChange={(event) => patch(key + suffix, event.target.value.split("\n"))} onBlur={(event) => patch(key + suffix, splitLines(event.target.value))} />)}
        </div>;
      })}
    </FormGrid>
    <details className={styles.content}>
      <summary>{t("Notation ToolTrim", "ToolTrim rating")}</summary>
      <FormGrid>
        <Field label={t("Date de la notation", "Rating date")} type="date" required={rated} value={rating.notedOn ?? ""} disabled={disabled}
          onChange={(event) => patchRating({ notedOn: event.target.value })} />
        <Field label={t("Dernière activité vérifiée", "Last verified activity")} type="date" value={rating.lastActivityVerifiedOn ?? ""} disabled={disabled}
          onChange={(event) => patchRating({ lastActivityVerifiedOn: event.target.value || undefined })} />
      </FormGrid>
      {axes.map(([axis, fr, en]) => <FormGrid key={axis}>
        <SelectField label={t(fr, en)} value={rating[axis] ?? ""} disabled={disabled} onChange={(event) => patchRating({ [axis]: event.target.value ? Number(event.target.value) : undefined })}>
          <option value="">{t("Sans note", "Unrated")}</option>
          {[1, 2, 3, 4, 5].map((score) => <option value={score} key={score}>{score}</option>)}
        </SelectField>
        <Field label={t(`Preuve · ${fr} · français`, `Evidence · ${en} · French`)} value={rating.evidence?.[axis] ?? ""} required={!!rating[axis]} disabled={disabled}
          onChange={(event) => patchRating({ evidence: { ...rating.evidence, [axis]: event.target.value } })} />
        <Field label={t(`Preuve · ${fr} · anglais`, `Evidence · ${en} · English`)} value={rating.evidenceEn?.[axis] ?? ""} disabled={disabled}
          onChange={(event) => patchRating({ evidenceEn: { ...rating.evidenceEn, [axis]: event.target.value } })} />
      </FormGrid>)}
    </details>
    {guard && <p role="alert">{guard}</p>}
    <div className={styles.actions}>
      <Button type="submit" variant="primary" disabled={disabled || !dirty}>{t("Approuver cette analyse", "Approve this analysis")}</Button>
      {dirty && <Button disabled={disabled} onClick={() => { setCategory(revision?.category ?? ""); setFields(original); setGuard(""); }}>{t("Annuler", "Cancel")}</Button>}
    </div>
  </form>;
}

type BrandSelection = { brandId: string } | { brandName: string; brandDomain: string };

function PromotionForm({ listing, brands, disabled, promote }: {
  listing: ListingRequest;
  brands: Brand[];
  disabled: boolean;
  promote: (brand: BrandSelection, key: string) => Promise<void>;
}) {
  const { t } = useLang();
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState(listing.name);
  const [brandDomain, setBrandDomain] = useState(() => new URL(listing.websiteUrl).hostname.replace(/^www\./, ""));
  const key = useRef<string | null>(null);
  return <form className={styles.content} aria-labelledby="initial-approval" onSubmit={(event) => {
    event.preventDefault();
    if (disabled) return;
    key.current ??= crypto.randomUUID();
    void promote(brandId ? { brandId } : { brandName: brandName.trim(), brandDomain: brandDomain.trim() }, key.current).catch(() => {});
  }}>
    <h2 id="initial-approval">{t("Valider la première fiche", "Approve the initial listing")}</h2>
    <p>{t("Vérifiez que le demandeur représente cet outil et sélectionnez sa marque. La fiche sera rattachée et sa première version proposée au lot de publication.", "Verify that the applicant represents this tool and select their brand. The listing will be assigned and its first version added to the publication batch.")}</p>
    <SelectField label={t("Marque responsable", "Responsible brand")} value={brandId} disabled={disabled} onChange={(event) => {
      key.current = null;
      setBrandId(event.target.value);
    }}>
      <option value="">{t("Créer une marque", "Create a brand")}</option>
      {brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name} · {brand.websiteDomain}</option>)}
    </SelectField>
    {!brandId && <FormGrid>
      <Field required label={t("Nom de la marque", "Brand name")} maxLength={160} value={brandName} disabled={disabled} onChange={(event) => {
        key.current = null;
        setBrandName(event.target.value);
      }} />
      <Field required label={t("Domaine vérifié", "Verified domain")} value={brandDomain} disabled={disabled} onChange={(event) => {
        key.current = null;
        setBrandDomain(event.target.value);
      }} />
    </FormGrid>}
    <div className={styles.actions}>
      <Button type="submit" variant="primary" disabled={disabled}>{t("Valider le rattachement", "Approve assignment")}</Button>
    </div>
  </form>;
}

export { InitialListingAdminReview };
