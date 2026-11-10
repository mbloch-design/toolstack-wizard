import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/ds/Controls/Controls";
import styles from "@/ds/CatalogRecordWorkspace/CatalogRecordWorkspace.module.css";
import { CATALOG_FIELD_REGISTRY } from "@/lib/catalogFieldRegistry";
import { CatalogValidationError, validateCatalogDraft } from "@/lib/catalogValidation";
import { getFeatureLabel } from "@/lib/featureLabels";
import { CatalogFieldEditor, catalogChoices } from "./CatalogFieldEditor";
import { CatalogOfferWorkspace } from "./CatalogOfferWorkspace";
import type { CatalogStagedBlock, CatalogStagedUpdate } from "./catalogDraftSession";
import { CatalogTagField } from "./CatalogTagField";
import {
  applyChanges, canEdit, catalogFieldLabel, catalogIssueMessage, catalogValueAt,
  differences, record, type CatalogChange, type CatalogEditingValue,
} from "./catalogEditingModel";

type TagRoot = "functional_needs" | "covers" | "personas" | "verticals";
const tagRoots = new Set<string>(["functional_needs", "covers", "personas", "verticals"]);
const mediaRoots = new Set<string>(["logo", "ogImageUrl", "galleryImages"]);
const pricingRoots = new Set<string>(["pricing_v5", "pricing_v5En"]);
const fields = CATALOG_FIELD_REGISTRY.filter((field) => !field.path.includes("."));
const textExists = (value: unknown) => value != null && value !== "" &&
  (!Array.isArray(value) || value.length > 0);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function changeValue(value: CatalogEditingValue["value"], changes: CatalogChange[]) {
  const next = structuredClone(value);
  for (const change of changes) {
    let parent: Record<string | number, unknown> = next;
    change.path.slice(0, -1).forEach((key, index) => {
      parent[key] ??= typeof change.path[index + 1] === "number" ? [] : {};
      parent = parent[key] as typeof parent;
    });
    const key = change.path.at(-1)!;
    if (change.remove) delete parent[key];
    else parent[key] = change.value === undefined ? undefined : structuredClone(change.value);
  }
  return next;
}

function mediaSource(value: string) {
  return /^(?:https?:\/\/|\/(?!\/))/i.test(value) ? value : undefined;
}

function ReadValue({ value, root, lang, path = [root], detailed = false }: { value: unknown; root: string; lang: "fr" | "en"; path?: string[]; detailed?: boolean }) {
  const yes = lang === "fr" ? "Oui" : "Yes";
  const no = lang === "fr" ? "Non" : "No";
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) return <ul className={tagRoots.has(root) || mediaRoots.has(root) ? styles.chips : styles.textList}>
      {value.map((item, index) => <li className={tagRoots.has(root) || mediaRoots.has(root) ? styles.chip : styles.value} key={index}>
        {mediaRoots.has(root) && mediaSource(item) ? <MediaThumbnail url={item} /> :
          tagRoots.has(root) ? getFeatureLabel(item, lang) : item}
      </li>)}
    </ul>;
    if (detailed) return <ul className={styles.textList}>{value.map((item, index) =>
      <li key={index}><ReadValue value={item} root={root} lang={lang} path={[...path, String(index)]} detailed /></li>
    )}</ul>;
    return <p className={styles.note}>{value.length} {lang === "fr" ? "élément(s)" : "item(s)"}</p>;
  }
  if (record(value) && (root === "verdict" || root === "verdictEn")) {
    const summary = [value.label, value.summary].filter((item): item is string => typeof item === "string" && !!item.trim());
    if (typeof value.score === "number") summary.unshift(`${value.score} / 5`);
    if (summary.length) return <p className={styles.value}>{summary.join(" · ")}</p>;
  }
  if (record(value) && root === "toolTrimRating") {
    const scores = ["puissance", "reversibilite", "simplicite", "utilisation", "valeurAjoutee"].filter((key) => typeof value[key] === "number");
    if (scores.length) return <ul className={styles.chips}>{scores.map((key) =>
      <li key={key} className={styles.chip}>{catalogFieldLabel([root, key], lang)} · {String(value[key])} / 5</li>
    )}</ul>;
  }
  if (detailed && record(value)) return <dl className={styles.values}>
    {Object.entries(value).filter(([key, item]) => textExists(item) && !(pricingRoots.has(root) && key === "plans")).map(([key, item]) =>
      <div key={key}>
        <dt className={styles.note}>{catalogFieldLabel([...path, key], lang)}</dt>
        <dd><ReadValue value={item} root={root} lang={lang} path={[...path, key]} detailed /></dd>
      </div>
    )}
  </dl>;
  if (value && typeof value === "object") return <p className={styles.note}>{lang === "fr" ? "Renseigné" : "Provided"}</p>;
  if (typeof value === "string" && mediaRoots.has(root) && mediaSource(value)) return <MediaThumbnail url={value} />;
  return <p className={styles.value}>{typeof value === "boolean" ? value ? yes : no : String(value)}</p>;
}

function MediaThumbnail({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className={styles.note}>{url}</span> :
    <img className={styles.thumbnail} src={mediaSource(url)} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

type Group = { id: string; title: string; edit: string; roots: string[]; summary?: string[]; collapsible?: boolean };

export function CatalogRecordWorkspace({ context, currency, transaction, onTransaction }: {
  context: CatalogEditingValue;
  currency: string;
  transaction: CatalogStagedBlock | null;
  onTransaction: (value: CatalogStagedUpdate) => void;
}) {
  const lang = context.lang ?? "fr";
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  const uid = useId();
  const [errors, setErrors] = useState<CatalogEditingValue["issues"]>([]);
  const [notice, setNotice] = useState("");
  const origin = useRef<HTMLElement | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const active = transaction?.id ?? null;
  useEffect(() => {
    if (active) form.current?.querySelector<HTMLElement>("input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled)")?.focus();
  }, [active]);

  function start(id: string, initial: CatalogChange[] = []) {
    if (transaction) return;
    origin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setNotice("");
    setErrors([]);
    onTransaction({ id, original: context.value, value: changeValue(context.value, initial) });
  }
  function stage(changes: CatalogChange[]) {
    setErrors([]);
    setNotice("");
    onTransaction((current) => current ? { ...current, value: changeValue(current.value, changes) } : null);
  }
  function close() {
    onTransaction(null);
    setErrors([]);
    setNotice("");
    requestAnimationFrame(() => {
      if (origin.current?.isConnected && !origin.current.matches(":disabled")) origin.current.focus();
      else workspace.current?.focus({ preventScroll: true });
    });
  }
  function finish() {
    if (!transaction) return;
    const changes = differences(transaction.original, transaction.value);
    if (!changes.length) { close(); return; }
    if (changes.some(({ path }) => !same(catalogValueAt(transaction.original, path), catalogValueAt(context.value, path)))) {
      setNotice(t("La fiche a changé pendant la saisie. Copiez votre texte avant de fermer ce bloc.", "The record changed while you were editing. Copy your input before closing this block."));
      return;
    }
    const candidate = changeValue(context.value, changes);
    if (transaction.id.startsWith("offer:")) {
      const pricing = lang === "en" ? "pricing_v5En" : "pricing_v5";
      const plans = catalogValueAt(candidate, [pricing, "plans"]);
      const prior = catalogValueAt(transaction.original, [pricing, "plans"]);
      const issues: CatalogEditingValue["issues"] = [];
      if (Array.isArray(plans)) plans.forEach((plan, index) => {
        if (!record(plan)) return;
        const old = Array.isArray(prior) ? prior[index] : undefined;
        const previous = record(old) ? old : {};
        if ((!old || plan.displayName !== previous.displayName) && !(typeof plan.displayName === "string" && plan.displayName.trim())) {
          issues.push({ path: `${pricing}.plans.${index}.displayName`, code: "REQUIRED", severity: "error", stage: "draft" });
        }
        if (plan.priceStatus === "paid" && (!old || plan.priceStatus !== previous.priceStatus || plan.nativeAmount !== previous.nativeAmount) && !(Number(plan.nativeAmount) > 0)) {
          issues.push({ path: `${pricing}.plans.${index}.nativeAmount`, code: "REQUIRED", severity: "error", stage: "draft" });
        }
      });
      if (issues.length) { setErrors(issues); return; }
    }
    try {
      validateCatalogDraft(context.base, candidate, context.capabilities);
    } catch (error) {
      if (error instanceof CatalogValidationError) setErrors(error.issues);
      else setNotice(t("Impossible de valider ces modifications.", "Could not validate these changes."));
      return;
    }
    if (!applyChanges(context, changes)) {
      setNotice(t("Ces modifications dépassent les droits de ce compte.", "These changes are outside this account’s permissions."));
      return;
    }
    close();
  }
  function renderEditor(id: string, content: (staged: CatalogEditingValue) => ReactNode) {
    if (transaction?.id !== id) return null;
    const staged: CatalogEditingValue = {
      ...context, value: transaction.value, issues: errors,
      onChange: (path, value) => stage([{ path, value }]),
      onRemove: (path) => stage([{ path, value: undefined, remove: true }]),
      onChanges: stage,
    };
    return <form ref={form} className={styles.form} onSubmit={(event) => { event.preventDefault(); finish(); }}>
      {content(staged)}
      {notice && <p className={styles.note} role="alert">{notice}</p>}
      {errors.length > 0 && <ul className={styles.note} role="alert">{errors.map((issue, index) =>
        <li key={index}>{catalogFieldLabel(issue.path.split("."), lang)} · {catalogIssueMessage(issue.code, lang)}</li>
      )}</ul>}
      <div className={styles.actions}>
        <Button type="submit" variant="primary">{t("Terminer", "Done")}</Button>
        <Button onClick={close}>{t("Annuler", "Cancel")}</Button>
      </div>
    </form>;
  }

  function readRoot(root: string) {
    const value = context.value[root];
    if (root === "category" && typeof value === "string") {
      const category = context.categories.find((entry) => entry.id === value || entry.slug === value);
      if (category) return lang === "en" ? category.nameEn || category.name : category.name;
    }
    if (root === "tool_type" && typeof value === "string") {
      return catalogChoices(context, [root])?.find((choice) => choice.value === value)?.label ?? value;
    }
    return value;
  }

  const description = ["shortDescription", "shortDescriptionEn", "description", "descriptionEn", "tagline"];
  const rootsIn = (family: string) => fields.filter((field) => field.editable && field.family === family).map(({ path }) => path);
  const mainGroups: Group[] = [
    { id: "identity", title: t("Identité", "Identity"), edit: t("Modifier l’identité", "Edit identity"), roots: ["name", "category", "tool_type"] },
    { id: "description", title: t("Description", "Description"), edit: t("Modifier la description", "Edit description"), roots: description, summary: [lang === "fr" ? "shortDescription" : "shortDescriptionEn"] },
    { id: "website", title: t("Site et liens", "Website and links"), edit: t("Modifier les liens", "Edit links"), roots: rootsIn("links"), summary: ["websiteUrl"] },
    { id: "tags", title: t("Usages et fonctions", "Uses and features"), edit: t("Modifier les usages", "Edit uses"), roots: ["functional_needs", "covers"] },
    { id: "audience", title: t("Publics et secteurs", "Audiences and industries"), edit: t("Modifier les publics et secteurs", "Edit audiences and industries"), roots: ["personas", "verticals", "relevantFor", "relevantForEn", "soloRelevance", "teamRelevance"], summary: ["personas", "verticals"] },
    { id: "examples", title: t("Exemples d’usage", "Use cases"), edit: t("Modifier les exemples", "Edit examples"), roots: ["useCases", "useCasesEn", "ia_use_case"], summary: [lang === "fr" ? "useCases" : "useCasesEn"] },
    { id: "images", title: t("Logo et images", "Logo and images"), edit: t("Modifier les médias", "Edit media"), roots: rootsIn("media") },
    { id: "analysis", title: t("Verdict et notation", "Verdict and rating"), edit: t("Modifier l’analyse", "Edit analysis"), roots: ["verdict", "verdictEn", "toolTrimRating", "timeGainedHoursPerMonth"], summary: ["toolTrimRating", lang === "fr" ? "verdict" : "verdictEn"] },
    { id: "strengths", title: t("Points forts et limites", "Strengths and limitations"), edit: t("Modifier les points forts et limites", "Edit strengths and limitations"), roots: ["pros", "prosEn", "cons", "consEn", "longDescription", "longDescriptionEn"], summary: lang === "fr" ? ["pros", "cons"] : ["prosEn", "consEn"] },
  ];
  const assigned = new Set(mainGroups.flatMap((group) => group.roots));
  const remaining = fields.filter(({ path, editable }) => editable && !assigned.has(path));
  const advanced = Object.entries({
    pricing: t("Sources et paramètres tarifaires", "Pricing sources and settings"),
    relations: t("Alternatives et relations", "Alternatives and relations"),
    seo: t("Référencement", "Search metadata"),
    classification: t("Classement complémentaire", "Additional classification"),
    metadata: t("Paramètres de la fiche", "Record settings"),
    analysis: t("Analyse complémentaire", "Additional analysis"),
    presentation: t("Présentation complémentaire", "Additional presentation"),
  }).map(([family, title]) => ({
    id: family, title, edit: t("Modifier", "Edit") + " · " + title,
    roots: remaining.filter((field) => field.family === family).map(({ path }) => path), collapsible: true,
  }));
  const allocated = new Set(advanced.flatMap(({ roots }) => roots));
  const other = remaining.filter(({ path }) => !allocated.has(path)).map(({ path }) => path);
  if (other.length) advanced.push({ id: "other", title: t("Autres champs", "Other fields"), edit: t("Modifier les autres champs", "Edit other fields"), roots: other, collapsible: true });
  const sections = [
    ["presentation", t("Présentation", "Presentation")],
    ["offers", t("Prix et offres", "Pricing and offers")],
    ["usage", t("Usages et tags", "Usage and tags")],
    ["media", t("Médias", "Media")],
    ["analysis", t("Analyse ToolTrim", "ToolTrim analysis")],
    ["advanced", t("Réglages avancés", "Advanced settings")],
  ] as const;

  function renderGroup(group: Group) {
    const id = "group:" + group.id;
    const visible = (group.summary ?? group.roots).filter((root) => textExists(context.value[root]));
    const editable = group.roots.some((root) => canEdit(context, [root]) || context.capabilities.editablePaths.some((path) => path.startsWith(root + ".")));
    if (!group.roots.length) return null;
    const values = visible.length ? <dl className={styles.values}>
      {visible.map((root) => <div key={root}>
        <dt className={styles.note}>{catalogFieldLabel([root], lang)}</dt>
        <dd><ReadValue value={readRoot(root)} root={root} lang={lang} detailed={group.collapsible} /></dd>
      </div>)}
    </dl> : <p className={styles.note}>{t("Aucune valeur renseignée.", "No value provided.")}</p>;
    return <div className={styles.card} key={id}>
      <div className={styles.cardHeader}>
        <h3 className={styles.label}>{group.title}</h3>
        {editable && <span hidden={active === id}><Button size="compact" disabled={!!active} onClick={() => start(id)}>
          {!visible.length && group.id === "tags" ? t("Ajouter des usages", "Add uses") :
            !visible.length && group.id === "images" ? t("Ajouter un média", "Add media") : group.edit}
        </Button></span>}
      </div>
      {active === id ? renderEditor(id, (staged) => group.roots.map((root) =>
        tagRoots.has(root) ? <CatalogTagField key={root} root={root as TagRoot} context={staged} /> :
          <CatalogFieldEditor key={root} context={staged} path={[root]} omit={pricingRoots.has(root) ? ["plans"] : undefined} />
      )) : group.collapsible && visible.length ? <details>
        <summary className={styles.label}>{t("Voir les valeurs", "View values")}</summary>
        {values}
      </details> : values}
    </div>;
  }

  function section(id: string, content: ReactNode) {
    const label = sections.find(([key]) => key === id)?.[1];
    return <section id={uid + id} className={styles.section} aria-labelledby={uid + id + "-title"}>
      <h2 id={uid + id + "-title"} className={styles.title} tabIndex={-1}>{label}</h2>
      {content}
    </section>;
  }

  return <div ref={workspace} className={styles.workspace} tabIndex={-1}>
    <nav className={styles.actions} aria-label={t("Sections de la fiche", "Record sections")}>
      {sections.map(([id, title]) => <Button key={id} size="compact" onClick={() => {
        const heading = document.getElementById(uid + id + "-title");
        document.getElementById(uid + id)?.scrollIntoView({ block: "start" });
        heading?.focus({ preventScroll: true });
      }}>{title}</Button>)}
    </nav>
    {section("presentation", mainGroups.slice(0, 3).map(renderGroup))}
    {section("offers", <CatalogOfferWorkspace context={context} activeEditor={active} start={start} renderEditor={renderEditor} currency={currency} />)}
    {section("usage", mainGroups.slice(3, 6).map(renderGroup))}
    {section("media", renderGroup(mainGroups[6]))}
    {section("analysis", <><p className={styles.note}>{t("Analyse et notation de l’équipe ToolTrim.", "Analysis and rating by the ToolTrim team.")}</p>{mainGroups.slice(7).map(renderGroup)}</>)}
    {section("advanced", <>
      {advanced.map(renderGroup)}
      <details className={styles.card}>
        <summary className={styles.label}>{t("Identifiants et données protégées", "Identifiers and protected data")}</summary>
        {fields.filter(({ editable, path }) => !editable && textExists(context.value[path])).map(({ path }) =>
          <CatalogFieldEditor key={path} context={context} path={[path]} />)}
      </details>
    </>)}
  </div>;
}
