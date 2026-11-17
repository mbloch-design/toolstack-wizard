import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Button, { linkClass } from "@/ds/Button/Button";
import Field, { SelectField, TextAreaField } from "@/ds/Field/Field";
import Page from "@/ds/Page/Page";
import { CATALOG_NEEDS } from "@/data/catalogNeeds";
import { STACK_PERSONAS } from "@/data/stacks";
import { VERTICAL_FAMILIES } from "@/data/types";
import { useCatalogExitGuard } from "@/components/backoffice/useCatalogExitGuard";
import { useLang } from "@/hooks/useLang";
import { validateProductDraft, type CmsIssue, type ProductDraft } from "@/lib/publisherCatalog";
import { PublisherApiError, type PublisherToken } from "@/lib/publisherCatalogApi";
import PublisherPricing from "./PublisherPricing";
import CatalogMediaUpload, { CatalogMediaPreview } from "./CatalogMediaUpload";
import styles from "./PublisherWorkspace.module.css";

type Locale = "fr" | "en";
type Section = "overview" | "usage" | "pricing" | "media" | "classification" | "integrations";
type FieldError = (path: string) => { id: string; error?: string };
type FicheProps = {
  value: ProductDraft;
  canEdit: boolean;
  onSave?: (value: ProductDraft) => Promise<ProductDraft>;
  onDenied?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  lockWebsite?: boolean;
  renderReview?: (save: () => Promise<boolean>, disabled: boolean) => ReactNode;
  publicSlug?: string;
  mediaAccess?: { getToken: PublisherToken; toolId?: string; listingId?: string };
  onAllocate?: (planId?: string) => Promise<ProductDraft>;
};

function reorder<T>(items: T[], index: number, offset: number) {
  const next = [...items];
  [next[index], next[index + offset]] = [next[index + offset], next[index]];
  return next;
}

function useIssueMessage() {
  const { t } = useLang();
  return (code: string) => {
    if (code === "REQUIRED") return t("Renseignez ce champ.", "Fill in this field.");
    if (code === "MAX_LENGTH") return t("Raccourcissez cette valeur.", "Shorten this value.");
    if (code === "DUPLICATE_IDENTITY") return t("Supprimez les doublons dans cette rubrique.", "Remove duplicates in this section.");
    if (code === "TOO_MANY_MEDIA") return t("La fiche ne peut contenir qu’un logo, une couverture et douze captures.", "Use up to one logo, one cover and twelve screenshots.");
    return t("Vérifiez le format de cette valeur.", "Check the format of this value.");
  };
}

function OrderActions({ index, length, move, remove }: {
  index: number; length: number; move: (offset: number) => void; remove?: () => void;
}) {
  const { t } = useLang();
  return <div className={styles.actions}>
    <Button disabled={index === 0} onClick={() => move(-1)}>{t("Monter", "Move up")}</Button>
    <Button disabled={index + 1 === length} onClick={() => move(1)}>{t("Descendre", "Move down")}</Button>
    {remove && <Button variant="quiet" onClick={remove}>{t("Retirer", "Remove")}</Button>}
  </div>;
}

export default function PublisherFiche({ value, canEdit, onSave, onDenied, onDirtyChange, lockWebsite, renderReview, publicSlug, mediaAccess, onAllocate }: FicheProps) {
  const { t, lang, prefix } = useLang();
  const [saved, setSaved] = useState(value);
  const [draft, setDraft] = useState(value);
  const [locale, setLocale] = useState<Locale>(lang);
  const [editing, setEditing] = useState<Section | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newMediaRole, setNewMediaRole] = useState<ProductDraft["media"][number]["role"]>("gallery");
  const saving = useRef(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<CmsIssue[]>([]);
  const issueMessage = useIssueMessage();
  const dirty = draft !== saved && JSON.stringify(draft) !== JSON.stringify(saved);
  const guarded = dirty || busy || uploading;
  useEffect(() => { onDirtyChange?.(guarded); }, [guarded, onDirtyChange]);
  const positions = useRef<Partial<Record<Section, HTMLButtonElement | null>>>({});

  useCatalogExitGuard(guarded, () => setError(t("Enregistrez ou annulez vos modifications avant de quitter la fiche.", "Save or cancel your edits before leaving the listing.")));

  const labels: Record<Section, string> = {
    overview: t("Vue d’ensemble", "Overview"), usage: t("Fonctionnalités et usages", "Features and uses"),
    pricing: t("Prix", "Pricing"), media: t("Visuels", "Images"),
    classification: t("Suggestions de classement", "Category suggestions"), integrations: t("Intégrations", "Integrations"),
  };
  const editLabels: Record<Section, string> = {
    overview: t("Modifier la présentation", "Edit overview"), usage: t("Modifier les usages", "Edit uses"),
    pricing: t("Modifier les prix", "Edit pricing"), media: t("Modifier les visuels", "Edit images"),
    classification: t("Modifier le classement proposé", "Edit category suggestions"),
    integrations: t("Modifier les intégrations", "Edit integrations"),
  };

  function field(path: string) {
    const issue = issues.find((item) => item.path === path);
    return { id: `publisher-${path}`, error: issue ? issueMessage(issue.code) : undefined };
  }

  function showIssues(next: CmsIssue[]) {
    setIssues(next);
    requestAnimationFrame(() => {
      const target = next.map(({ path }) => document.getElementById(`publisher-${path}`)).find(Boolean);
      (target ?? document.getElementById("publisher-edit-error"))?.focus();
    });
  }

  async function save() {
    if (saving.current || uploading) return false;
    setError("");
    setIssues([]);
    if (!dirty) return true;
    setNotice("");
    if (!onSave) return false;
    const validation = validateProductDraft(draft, { phase: "draft", purpose: "update" });
    if (validation.length) {
      showIssues(validation);
      return false;
    }
    saving.current = true;
    setBusy(true);
    try {
      const next = await onSave(draft);
      setSaved(next);
      setDraft(next);
      setNotice(t("Brouillon enregistré.", "Draft saved."));
      return true;
    } catch (cause) {
      if (cause instanceof PublisherApiError && (cause.status === 401 || cause.status === 403)) onDenied?.();
      if (cause instanceof PublisherApiError && cause.issues.length) showIssues(cause.issues);
      else setError(cause instanceof PublisherApiError && cause.status === 409
        ? t("Une version plus récente existe. Copiez vos changements, puis rechargez la fiche avant de les reprendre.", "A newer version exists. Copy your changes, then reload the listing before reapplying them.")
        : t("L’enregistrement a échoué. Vos changements sont encore dans ce bloc.", "Saving failed. Your edits are still in this section."));
      return false;
    } finally {
      setBusy(false);
      saving.current = false;
    }
  }

  async function open(next: Section | null) {
    if (!await save()) return;
    setEditing(next);
    setPreview(false);
    if (!next && editing) requestAnimationFrame(() => positions.current[editing]?.focus());
    else if (next) requestAnimationFrame(() => {
      document.getElementById(`publisher-section-${next}`)?.querySelector<HTMLElement>("input, textarea, select, fieldset button")?.focus();
    });
  }

  function cancel() {
    setDraft(saved);
    setError("");
    setIssues([]);
    setEditing(null);
    if (editing) requestAnimationFrame(() => positions.current[editing]?.focus());
  }

  async function allocate(planId?: string) {
    if (!onAllocate || !await save()) return;
    saving.current = true;
    setBusy(true);
    try {
      const next = await onAllocate(planId);
      setSaved(next);
      setDraft(next);
      setNotice(planId ? t("Nouveau tarif ajouté au brouillon.", "New price added to draft.") : t("Nouvelle offre ajoutée au brouillon.", "New plan added to draft."));
    } catch (cause) {
      if (cause instanceof PublisherApiError && (cause.status === 401 || cause.status === 403)) onDenied?.();
      setError(t("Impossible d’ajouter cet élément. Actualisez la fiche avant de réessayer.", "This item could not be added. Refresh the listing before trying again."));
    } finally {
      setBusy(false);
      saving.current = false;
    }
  }

  function section(id: Section, content: ReactNode, form: ReactNode, editable = true) {
    const active = editing === id;
    return <section className={styles.section} id={id} key={id} aria-labelledby={`publisher-title-${id}`}>
      <div className={styles.split}>
        <h2 id={`publisher-title-${id}`}>{labels[id]}</h2>
        {!active && canEdit && !preview && editable &&
          <Button ref={(element) => { positions.current[id] = element; }} disabled={busy || uploading} onClick={() => void open(id)}>
            {editLabels[id]}
          </Button>}
      </div>
      {active ? <form id={`publisher-section-${id}`} onSubmit={(event: FormEvent) => { event.preventDefault(); void open(null); }}>
        <fieldset className={styles.fields} disabled={busy}>
          {form}
        </fieldset>
        {(error || issues.length > 0) && <p id="publisher-edit-error" tabIndex={-1} role="alert" className={styles.error}>
          {error || t("Corrigez les valeurs signalées dans ce bloc.", "Correct the highlighted values in this section.")}
        </p>}
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={busy || uploading}>{busy ? t("Enregistrement…", "Saving…") : t("Enregistrer le brouillon", "Save draft")}</Button>
          <Button disabled={busy || uploading} onClick={cancel}>{t("Annuler", "Cancel")}</Button>
        </div>
      </form> : content}
    </section>;
  }

  const read = saved.localized[locale];
  const write = draft.localized[locale];
  const updateLocale = (next: Partial<ProductDraft["localized"][Locale]>) => setDraft({
    ...draft, localized: { ...draft.localized, [locale]: { ...write, ...next } },
  });
  const empty = t("À renseigner.", "Not yet provided.");
  const mediaRoles = [
    { id: "logo", label: "Logo", limit: 1 },
    { id: "cover", label: t("Couverture", "Cover image"), limit: 1 },
    { id: "gallery", label: t("Capture", "Screenshot"), limit: 12 },
  ] as const;
  const availableMediaRoles = mediaRoles.filter(({ id, limit }) => draft.media.filter((asset) => asset.role === id).length < limit);
  const chosenMediaRole = availableMediaRoles.find((role) => role.id === newMediaRole) ?? availableMediaRoles[0];

  return <Page>
    <div className={styles.split}>
      <div className={styles.actions} aria-label={t("Langue du contenu", "Content language")} role="group">
        {(["fr", "en"] as const).map((language) => <Button key={language} lang={language} pressed={language === locale} disabled={busy || uploading}
          onClick={async () => { if (await save()) { setEditing(null); setLocale(language); } }}>
          {language === "fr" ? "Français" : "English"}
        </Button>)}
      </div>
      {onSave && <Button disabled={busy || uploading} pressed={preview} onClick={async () => {
        if (await save()) { setEditing(null); setPreview(!preview); }
      }}>{preview ? t("Quitter l’aperçu", "Close preview") : t("Aperçu", "Preview")}</Button>}
    </div>
    {preview && <p>{t("Aperçu de votre proposition · non publiée", "Preview of your proposal · unpublished")}</p>}
    {!preview && renderReview?.(async () => {
      if (!await save()) return false;
      setEditing(null);
      return true;
    }, busy || uploading)}
    {notice && <p role="status" className={styles.muted}>{notice}</p>}
    {error && !editing && <p role="alert" className={styles.error}>{error}</p>}
    <nav className={styles.toc} aria-label={t("Sommaire de la fiche", "Listing contents")}>
      {Object.entries(labels).map(([id, label]) => <a key={id} className={linkClass()} href={`#${id}`}
        onClick={(event) => { event.preventDefault(); document.getElementById(id)?.scrollIntoView(); }}>{label}</a>)}
      {publicSlug && <a className={linkClass()} href="#publisher-editorial">{t("Analyse ToolTrim", "ToolTrim analysis")}</a>}
    </nav>
    {section("overview", <div className={styles.fields}>
      {saved.name && <h3>{saved.name}</h3>}
      {saved.websiteUrl && <a href={saved.websiteUrl} target="_blank" rel="noreferrer" className={linkClass("inline")}>{saved.websiteUrl}</a>}
      {read.shortDescription && <p className={styles.content}>{read.shortDescription}</p>}
      {read.productDescription && <p className={styles.content}>{read.productDescription}</p>}
      {!read.shortDescription && !read.productDescription && <p className={styles.muted}>{t("La description du produit reste à renseigner.", "Add a description of the product.")}</p>}
    </div>, <>
      <Field label={t("Nom du produit", "Product name")} {...field("name")} maxLength={120} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      <Field label={t("Site officiel", "Official website")} {...field("websiteUrl")} type="url" disabled={lockWebsite} maxLength={2048} value={draft.websiteUrl} onChange={(event) => setDraft({ ...draft, websiteUrl: event.target.value })} />
      <TextAreaField label={t("Description courte", "Short description")} {...field(`localized.${locale}.shortDescription`)} maxLength={350} value={write.shortDescription ?? ""} onChange={(event) => updateLocale({ shortDescription: event.target.value || null })} />
      <TextAreaField label={t("Description du produit", "Product description")} {...field(`localized.${locale}.productDescription`)} maxLength={8000} value={write.productDescription ?? ""} onChange={(event) => updateLocale({ productDescription: event.target.value || null })} />
    </>)}
    {section("usage", <div className={styles.cards}>{(["features", "useCases"] as const).map((key) => <div className={styles.card} key={key}>
      <h3>{key === "features" ? t("Fonctionnalités", "Features") : t("Cas d’usage", "Use cases")}</h3>
      {read[key].length ? <ul>{read[key].map((item) => <li key={item.id}>{item.text || empty}</li>)}</ul> : <p className={styles.muted}>{empty}</p>}
    </div>)}</div>, <div className={styles.cards}>
      {(["features", "useCases"] as const).map((key) => <div className={styles.card} key={key}>
        <h3>{key === "features" ? t("Fonctionnalités", "Features") : t("Cas d’usage", "Use cases")}</h3>
        {write[key].map((item, index) => <div className={styles.fields} key={item.id}>
          <TextAreaField label={key === "features" ? t(`Fonctionnalité ${index + 1}`, `Feature ${index + 1}`) : t(`Cas d’usage ${index + 1}`, `Use case ${index + 1}`)}
            {...field(`localized.${locale}.${key}.${index}.text`)} maxLength={800} value={item.text}
            onChange={(event) => updateLocale({ [key]: write[key].map((row) => row.id === item.id ? { ...row, text: event.target.value } : row) })} />
          <OrderActions index={index} length={write[key].length} move={(offset) => updateLocale({ [key]: reorder(write[key], index, offset) })}
            remove={() => updateLocale({ [key]: write[key].filter((row) => row.id !== item.id) })} />
        </div>)}
        <Button disabled={write[key].length >= 30} onClick={() => updateLocale({ [key]: [...write[key], { id: crypto.randomUUID(), text: "" }] })}>
          {key === "features" ? t("Ajouter une fonctionnalité", "Add a feature") : t("Ajouter un cas d’usage", "Add a use case")}
        </Button>
      </div>)}
    </div>)}
    {section("pricing", <PublisherPricing plans={saved.plans} locale={locale} />, <PublisherPricing plans={draft.plans} locale={locale} field={field}
      update={(plans) => setDraft({ ...draft, plans })} allocate={onAllocate ? allocate : undefined} />)}
    {section("media", saved.media.length ? <div className={styles.cards}>{saved.media.map((asset) => <div className={styles.card} key={asset.assetId}>
      <h3>{asset.role === "logo" ? "Logo" : asset.role === "cover" ? t("Couverture", "Cover") : t("Capture", "Screenshot")}</h3>
      {mediaAccess && <CatalogMediaPreview asset={asset} locale={locale} getToken={mediaAccess.getToken} />}
      <p>{asset.caption[locale] || asset.alt[locale] || empty}</p>
    </div>)}</div> : <p className={styles.muted}>{t("Aucun visuel dans ce brouillon.", "This draft has no images.")}</p>, <>
      {draft.media.map((asset, index) => {
        const updateMedia = (next: Partial<typeof asset>) => setDraft({ ...draft, media: draft.media.map((item) => item.assetId === asset.assetId ? { ...item, ...next } : item) });
        return <div className={styles.card} key={asset.assetId}>
          {mediaAccess && <CatalogMediaPreview asset={asset} locale={locale} getToken={mediaAccess.getToken} />}
          <SelectField label={t("Emplacement du visuel", "Image placement")} {...field(`media.${index}.role`)} value={asset.role} onChange={(event) => updateMedia({ role: event.target.value as typeof asset.role })}>
            <option value="logo">Logo</option><option value="cover">{t("Couverture", "Cover")}</option><option value="gallery">{t("Galerie", "Gallery")}</option>
          </SelectField>
          <Field label={t("Texte alternatif", "Alternative text")} {...field(`media.${index}.alt.${locale}`)} maxLength={500} value={asset.alt[locale]} onChange={(event) => updateMedia({ alt: { ...asset.alt, [locale]: event.target.value } })} />
          <Field label={t("Légende", "Caption")} {...field(`media.${index}.caption.${locale}`)} maxLength={500} value={asset.caption[locale]} onChange={(event) => updateMedia({ caption: { ...asset.caption, [locale]: event.target.value } })} />
          {!uploading && <OrderActions index={index} length={draft.media.length} move={(offset) => setDraft({ ...draft, media: reorder(draft.media, index, offset) })}
            remove={() => setDraft({ ...draft, media: draft.media.filter((item) => item.assetId !== asset.assetId) })} />}
          {mediaAccess && <details>
            <summary>{t("Remplacer le visuel", "Replace image")}</summary>
            <CatalogMediaUpload {...mediaAccess} role={asset.role} replaceAssetId={asset.assetId} setUploading={setUploading}
              disabled={uploading} onReady={(assetId) => setDraft((current) => ({
                ...current, media: current.media.map((item) => item.assetId === asset.assetId ? { ...item, assetId } : item),
              }))} />
          </details>}
        </div>;
      })}
      {mediaAccess && chosenMediaRole && <div className={styles.fields}>
        <SelectField label={t("Type de visuel à ajouter", "Image type to add")} value={chosenMediaRole.id} disabled={uploading}
          onChange={(event) => setNewMediaRole(event.target.value as typeof newMediaRole)}>
          {availableMediaRoles.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </SelectField>
        <CatalogMediaUpload key={chosenMediaRole.id} {...mediaAccess} role={chosenMediaRole.id} setUploading={setUploading}
          disabled={uploading} onReady={(assetId) => setDraft((current) => ({
            ...current, media: [...current.media, { assetId, role: chosenMediaRole.id, alt: { fr: "", en: "" }, caption: { fr: "", en: "" } }],
          }))} />
      </div>}
    </>, !!mediaAccess || saved.media.length > 0)}
    {section("classification", <PublisherClassification value={saved.classificationProposals} />, <PublisherClassification
      value={draft.classificationProposals} update={(classificationProposals) => setDraft({ ...draft, classificationProposals })} />)}
    {section("integrations", <PublisherIntegrations value={saved.integrations} />, <PublisherIntegrations
      value={draft.integrations} field={field} update={(integrations) => setDraft({ ...draft, integrations })} />)}
    {publicSlug && <section className={styles.section} id="publisher-editorial">
      <h2>{t("Analyse indépendante de ToolTrim", "Independent ToolTrim analysis")}</h2>
      <a className={linkClass("inline")} href={`${prefix}/tool/${encodeURIComponent(publicSlug)}`} target="_blank" rel="noreferrer">
        {t("Consulter les alternatives, le verdict et la FAQ sur la fiche publique", "Read alternatives, the verdict and FAQs on the public listing")}
      </a>
    </section>}
  </Page>;
}

function PublisherClassification({ value, update }: {
  value: ProductDraft["classificationProposals"];
  update?: (value: ProductDraft["classificationProposals"]) => void;
}) {
  const { lang, t } = useLang();
  const vocabularies = [
    { key: "functional_needs", label: t("Besoins couverts", "Needs covered"), options: CATALOG_NEEDS.map((item) => ({ id: item.id, label: lang === "fr" ? item.fr : item.en })) },
    { key: "personas", label: t("Profils", "Customer profiles"), options: STACK_PERSONAS.filter((item) => item.value !== "all").map((item) => ({ id: item.value, label: lang === "fr" ? item.label : item.labelEn })) },
    { key: "verticals", label: t("Secteurs", "Industries"), options: VERTICAL_FAMILIES.map((item) => ({ id: item.value, label: lang === "fr" ? item.label : item.labelEn })) },
  ];
  return <div className={styles.cards}>{vocabularies.map(({ key, label, options }) => {
    const selected = value.find((item) => item.key === key)?.values ?? [];
    const change = (values: string[]) => {
      const existing = value.some((item) => item.key === key);
      const rows = existing ? value.map((item) => item.key === key ? { key, values } : item) : [...value, { key, values }];
      update?.(rows.filter((item) => item.values.length));
    };
    return <div key={key} className={styles.card}>
      <h3>{label}</h3>
      {selected.length ? <ul>{selected.map((id) => {
        const name = options.find((item) => item.id === id)?.label ?? id;
        return <li key={id}>{name} {update && <Button variant="quiet" aria-label={t(`Retirer ${name}`, `Remove ${name}`)} onClick={() => change(selected.filter((value) => value !== id))}>{t("Retirer", "Remove")}</Button>}</li>;
      })}</ul> : <p className={styles.muted}>{t("Aucune suggestion.", "No suggestions.")}</p>}
      {update && <SelectField label={t(`Ajouter · ${label}`, `Add · ${label}`)} value="" disabled={selected.length >= 30}
        onChange={(event) => { if (event.target.value) change([...selected, event.target.value]); }}>
        <option value="">{t("Choisir", "Choose")}</option>
        {options.filter(({ id }) => !selected.includes(id)).map(({ id, label }) => <option value={id} key={id}>{label}</option>)}
      </SelectField>}
    </div>;
  })}</div>;
}

function PublisherIntegrations({ value, update, field }: {
  value: ProductDraft["integrations"];
  update?: (value: ProductDraft["integrations"]) => void;
  field?: FieldError;
}) {
  const { t } = useLang();
  const typeLabels = { integration: t("Intégration", "Integration"), host: t("Hôte", "Host"), bundle: t("Offre groupée", "Bundle") };
  return <div className={styles.fields}>
    {!update && !value.length && <p className={styles.muted}>{t("Aucune intégration renseignée.", "No integrations provided.")}</p>}
    {value.map((item, index) => {
      const change = (next: Partial<typeof item>) => update?.(value.map((row) => row.id === item.id ? { ...row, ...next } : row));
      return <div className={styles.card} key={item.id}>
        {update ? <>
          <Field label={t("Identifiant de l’outil lié", "Related tool identifier")} {...field?.(`integrations.${index}.relatedToolId`)} value={item.relatedToolId} onChange={(event) => change({ relatedToolId: event.target.value })} />
          <SelectField label={t("Type de relation", "Relationship type")} {...field?.(`integrations.${index}.type`)} value={item.type} onChange={(event) => change({ type: event.target.value as typeof item.type })}>
            {Object.entries(typeLabels).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
          </SelectField>
          <Field type="url" label={t("Documentation officielle", "Official documentation")} {...field?.(`integrations.${index}.sourceUrl`)} value={item.sourceUrl} onChange={(event) => change({ sourceUrl: event.target.value })} />
          <OrderActions index={index} length={value.length} move={(offset) => update(reorder(value, index, offset))} remove={() => update(value.filter((row) => row.id !== item.id))} />
        </> : <><h3>{item.relatedToolId}</h3><p>{typeLabels[item.type]}</p><a href={item.sourceUrl} className={linkClass("inline")} target="_blank" rel="noreferrer">{t("Source", "Source")}</a></>}
      </div>;
    })}
    {update && <Button disabled={value.length >= 30} onClick={() => update([...value, { id: crypto.randomUUID(), relatedToolId: "", type: "integration", sourceUrl: "" }])}>
      {t("Ajouter une intégration", "Add an integration")}
    </Button>}
  </div>;
}
