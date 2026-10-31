import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import {
  ArrowUp,
  ArrowDown,
  CirclePlus,
  CircleMinus,
  RefreshCw,
} from "@/lib/icons";
import { catalogFieldAt, type CatalogField } from "@/lib/catalogFieldRegistry";
import { getFeatureLabel } from "@/lib/featureLabels";
import verticals from "@/data/verticals.json";
import {
  catalogInheritedText,
  catalogIssueMessage,
  catalogText,
  catalogFieldLabel,
  catalogValueAt,
  canEdit,
  defaultValue,
  priceChange,
  record,
  type CatalogEditingValue,
  type CatalogPath,
} from "./catalogEditingModel";

function PlainControl({
  value,
  disabled,
  schema,
  onChange,
  ...accessibility
}: React.AriaAttributes & {
  id?: string;
  value: unknown;
  disabled: boolean;
  schema: CatalogField;
  onChange: (value: unknown) => boolean | void;
}) {
  const [text, setText] = useState(value == null ? "" : String(value));
  const composing = useRef(false);
  useEffect(() => {
    if (!composing.current) setText(value == null ? "" : String(value));
  }, [value]);
  const common = {
    ...accessibility,
    value: text,
    disabled,
    onCompositionStart: () => {
      composing.current = true;
    },
    onCompositionEnd: (
      event: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      composing.current = false;
      if (
        onChange(
          schema.kind === "number"
            ? event.currentTarget.value === ""
              ? null
              : Number(event.currentTarget.value)
            : event.currentTarget.value,
        ) === false
      )
        setText(value == null ? "" : String(value));
    },
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setText(event.target.value);
      if (
        !composing.current &&
        onChange(
          schema.kind === "number"
            ? event.target.value === ""
              ? null
              : Number(event.target.value)
            : event.target.value,
        ) === false
      )
        setText(value == null ? "" : String(value));
    },
  };
  return schema.kind === "text" ? (
    <Textarea {...common} rows={1} />
  ) : (
    <Input
      {...common}
      type={
        schema.kind === "number"
          ? "number"
          : schema.kind === "date"
            ? "date"
            : "url"
      }
      min={schema.min}
      max={schema.max}
      step={schema.integer ? 1 : "any"}
    />
  );
}
function choices(
  context: CatalogEditingValue,
  path: CatalogPath,
): { value: string; label: string }[] | null {
  const root = path[0],
    last = path.at(-1);
  if (root === "category")
    return context.categories.map((category) => ({
      value: category.id,
      label: category.name,
    }));
  if (root === "tool_type")
    return ["metier", "plugin", "ia", "gestion", "satellite", "bundle"].map(
      (value) => ({
        value,
        label: {
          metier: "Outil métier",
          plugin: "Extension",
          ia: "IA",
          gestion: "Gestion",
          satellite: "Spécialisé",
          bundle: "Suite",
        }[value]!,
      }),
    );
  if (last === "nativeCurrency")
    return ["EUR", "USD", "GBP", "CAD", "AUD", "CHF", "JPY"].map((value) => ({
      value,
      label: value,
    }));
  if (
    [
      "host_app",
      "bundle_parent",
      "freeAlternative",
      "integrates_with",
      "complements",
      "targetToolId",
      "aiTools",
    ].includes(String(root)) ||
    ["targetToolId", "tool"].includes(String(last))
  )
    return context.tools.map((tool) => ({
      value: tool.slug || tool.id,
      label: tool.name,
    }));
  if (typeof last !== "number") return null;
  if (
    ["functional_needs", "covers", "needKeys"].includes(String(root)) ||
    path.includes("needKeys")
  ) {
    const values = new Set([
      ...Object.values(verticals).flatMap((v) => v.functional_needs),
      ...context.tools.flatMap((tool) => [
        ...(tool.covers ?? []),
        ...(tool.functional_needs ?? []),
      ]),
    ]);
    return [...values].sort().map((value) => ({
      value,
      label: getFeatureLabel(value, context.lang ?? "fr"),
    }));
  }
  if (root === "verticals")
    return Object.entries(verticals).map(([value, item]) => ({
      value,
      label: item.label,
    }));
  if (root === "personas")
    return [...new Set(context.tools.flatMap((tool) => tool.personas ?? []))]
      .sort()
      .map((value) => ({
        value,
        label: getFeatureLabel(value, context.lang ?? "fr"),
      }));
  return null;
}
const optionLabels: Record<string, string> = {
  paid: "Payant",
  free: "Gratuit",
  quote: "Sur devis",
  unknown: "Non communiqué",
  usage: "Selon l’usage",
  month: "Mois",
  monthly: "Mensuel",
  annual: "Annuel",
  year: "Année",
  quarterly: "Trimestre",
  week: "Semaine",
  day: "Jour",
  one_time: "Achat unique",
  "one-time": "Achat unique",
  annual_prepaid: "Annuel prépayé",
  included: "Incluses",
  excluded: "Exclues",
  ht: "Hors taxes",
  ttc: "Taxes comprises",
  tax_included: "Taxes comprises",
};
function UnionField({
  context,
  path,
  schema,
}: {
  context: CatalogEditingValue;
  path: CatalogPath;
  schema: CatalogField;
}) {
  const t = (fr: string, en: string) => catalogText(context, fr, en);
  const value = catalogValueAt(context.value, path);
  const variants = schema.variants ?? [];
  const active = variants.findIndex((variant) =>
    variant.kind === "array"
      ? Array.isArray(value)
      : variant.kind === "object"
        ? record(value)
        : typeof value === "string",
  );
  const [pending, setPending] = useState("");
  const label = catalogFieldLabel(path, context.lang),
    disabled = !canEdit(context, path);
  return (
    <div className="bo-inline-union" data-catalog-path={path.join(".")}>
      <Field label={`${label} · ${t("format", "format")}`}>
        <Select
          disabled={disabled}
          value={pending || (active >= 0 ? String(active) : "")}
          onChange={(event) => setPending(event.target.value)}
        >
          <option value="">{t("Choisir un format", "Choose a format")}</option>
          {variants.map((variant, index) => (
            <option key={index} value={index}>
              {variant.kind === "array"
                ? t("Liste", "List")
                : variant.kind === "object"
                  ? t("Informations structurées", "Structured information")
                  : t("Texte", "Text")}
            </option>
          ))}
        </Select>
      </Field>
      {pending !== "" && Number(pending) !== active && (
        <p>
          {t(
            "Le contenu existant reste conservé jusqu’au remplacement explicite.",
            "Existing content is retained until you explicitly replace it.",
          )}{" "}
          <Button
            disabled={disabled}
            onClick={() => {
              context.onChange(path, defaultValue(variants[Number(pending)]));
              setPending("");
            }}
          >
            {t("Utiliser ce format", "Use this format")}
          </Button>
        </p>
      )}
      {active >= 0 && (
        <CatalogFieldEditor
          context={context}
          path={path}
          schema={variants[active]}
        />
      )}
    </div>
  );
}
let rowSequence = 0;
function ArrayField({
  context,
  path,
  schema,
}: {
  context: CatalogEditingValue;
  path: CatalogPath;
  schema: CatalogField;
}) {
  const t = (fr: string, en: string) => catalogText(context, fr, en);
  const current = catalogValueAt(context.value, path),
    values = Array.isArray(current) ? current : [];
  const identities = useRef<string[]>([]);
  while (identities.current.length < values.length)
    identities.current.push(`catalog-row-${++rowSequence}`);
  if (identities.current.length > values.length)
    identities.current.length = values.length;
  const [removedList, setRemovedList] = useState<{
    value: unknown;
    ids: string[];
  } | null>(null);
  const [removed, setRemoved] = useState<{
    item: unknown;
    index: number;
    id: string;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null),
    label = catalogFieldLabel(path, context.lang),
    allowed = canEdit(context, path);
  const focusRow = (id: string) =>
    queueMicrotask(() =>
      rootRef.current
        ?.querySelector<HTMLElement>(
          `[data-catalog-row="${id}"] textarea, [data-catalog-row="${id}"] input, [data-catalog-row="${id}"] select`,
        )
        ?.focus(),
    );
  function update(next: unknown[]) {
    if (allowed) context.onChange(path, next);
  }
  function move(index: number, offset: number) {
    const next = [...values],
      target = index + offset,
      id = identities.current[index];
    [next[index], next[target]] = [next[target], next[index]];
    [identities.current[index], identities.current[target]] = [
      identities.current[target],
      identities.current[index],
    ];
    update(next);
    focusRow(id);
  }
  return (
    <div
      ref={rootRef}
      className="bo-inline-array"
      data-catalog-path={path.join(".")}
    >
      <h4>{label}</h4>
      {values.map((value, index) => (
        <div
          className="bo-inline-array-row"
          data-catalog-row={identities.current[index]}
          key={identities.current[index]}
        >
          <CatalogFieldEditor
            context={context}
            path={[...path, index]}
            schema={schema.item!}
          />
          <div className="bo-inline-collection-actions">
            <Button
              size="compact"
              disabled={!allowed || index === 0}
              aria-label={t("Monter", "Move up")}
              icon={<ArrowUp />}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => move(index, -1)}
            />
            <Button
              size="compact"
              disabled={!allowed || index === values.length - 1}
              aria-label={t("Descendre", "Move down")}
              icon={<ArrowDown />}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => move(index, 1)}
            />
            <Button
              size="compact"
              disabled={!allowed}
              aria-label={t("Retirer cet élément", "Remove this item")}
              icon={<CircleMinus />}
              onClick={() => {
                if (!allowed) return;
                const id = identities.current.splice(index, 1)[0];
                setRemoved({ item: value, index, id });
                update(values.filter((_, i) => i !== index));
              }}
            />
          </div>
        </div>
      ))}
      <div className="bo-inline-collection-actions">
        {schema.optional && current !== undefined && (
          <Button
            size="compact"
            variant="quiet"
            disabled={!allowed}
            onClick={() => {
              if (allowed) {
                setRemovedList({
                  value: current,
                  ids: [...identities.current],
                });
                context.onRemove(path);
              }
            }}
          >
            {t("Retirer", "Remove")} {label}
          </Button>
        )}
        {removedList && current === undefined && (
          <Button
            size="compact"
            disabled={!allowed}
            onClick={() => {
              if (allowed) {
                identities.current = removedList.ids;
                context.onChange(path, removedList.value);
                setRemovedList(null);
              }
            }}
          >
            {t("Annuler le retrait de la liste", "Undo collection removal")}
          </Button>
        )}
        <Button
          size="compact"
          disabled={!allowed}
          icon={<CirclePlus />}
          onClick={() => {
            const id = `catalog-row-${++rowSequence}`;
            identities.current.push(id);
            update([
              ...values,
              defaultValue(
                schema.item!.kind === "union"
                  ? schema.item!.variants![0]
                  : schema.item!,
              ),
            ]);
            focusRow(id);
          }}
        >
          {t("Ajouter", "Add")} {label}
        </Button>
        {removed && (
          <Button
            size="compact"
            disabled={!allowed}
            icon={<RefreshCw />}
            onClick={() => {
              const next = [...values];
              next.splice(removed.index, 0, removed.item);
              identities.current.splice(removed.index, 0, removed.id);
              update(next);
              focusRow(removed.id);
              setRemoved(null);
            }}
          >
            {t("Annuler le retrait", "Undo removal")}
          </Button>
        )}
      </div>
    </div>
  );
}
function ProtectedValue({ value }: { value: unknown }) {
  if (Array.isArray(value))
    return (
      <ul>
        {value.map((item, index) => (
          <li key={index}>
            <ProtectedValue value={item} />
          </li>
        ))}
      </ul>
    );
  if (record(value))
    return (
      <dl>
        {Object.entries(value).map(([key, item]) => (
          <div key={key}>
            <dt>
              {key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ")}
            </dt>
            <dd>
              <ProtectedValue value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  return <span>{value == null ? "—" : String(value)}</span>;
}
function effectiveSourceExplanation(
  context: CatalogEditingValue,
  path: CatalogPath,
): string | null {
  if (path.length !== 1) return null;
  const notes: Record<string, [string, string]> = {
    articles: [
      "Les guides affichés proviennent de la sélection éditoriale des guides, pas de cette liste d’articles enregistrée. Cette liste reste conservée sans pilotage du bloc Guides public.",
      "The displayed guides come from the editorial guide selection, not this stored articles list. This list is retained but does not drive the public Guides block.",
    ],
    alternatives: [
      "Seules les alternatives enregistrées comme identifiants d’outils alimentent actuellement les cartes publiques. Les objets historiques avec nom et motif restent conservés sans carte publique correspondante.",
      "Only alternatives stored as tool identifiers currently feed public cards. Historical name/reason objects are retained without a corresponding public card.",
    ],
    migrationGuide: [
      "Le guide de migration est conservé sans bloc public dédié dans la fiche actuelle.",
      "The migration guide is stored without a dedicated public block in the current listing.",
    ],
    downgradePlan: [
      "Le déclassement est conservé sans bloc public dédié dans la fiche actuelle.",
      "Downgrade information is stored without a dedicated public block in the current listing.",
    ],
  };
  const note = notes[String(path[0])];
  return note ? catalogText(context, note[0], note[1]) : null;
}
export function CatalogFieldEditor({
  context,
  path,
  schema: supplied,
  inherited,
  omit = [],
}: {
  context: CatalogEditingValue;
  path: CatalogPath;
  schema?: CatalogField;
  inherited?: ReactNode;
  omit?: string[];
}) {
  const t = (fr: string, en: string) => catalogText(context, fr, en);
  const registration = catalogFieldAt(path),
    schema = supplied ?? registration?.schema;
  const value = catalogValueAt(context.value, path),
    disabled = !canEdit(context, path),
    label = catalogFieldLabel(path, context.lang);
  const [removed, setRemoved] = useState<{ value: unknown } | null>(null);
  const [mutationError, setMutationError] = useState("");
  if (!schema)
    return (
      <p>
        {t(
          "Information protégée non administrable.",
          "Protected information cannot be edited.",
        )}
      </p>
    );
  if (!registration?.editable)
    return (
      <div className="bo-inline-protected" data-catalog-path={path.join(".")}>
        <strong>{label}</strong>
        <ProtectedValue value={value} />
        <small>
          {registration?.ownership === "alias"
            ? t(
                "Valeur historique conservée. Modifier le champ principal correspondant.",
                "Historical value retained. Edit the corresponding primary field.",
              )
            : t(
                "Information gérée par le système, conservée sans modification.",
                "System-managed information, retained unchanged.",
              )}
        </small>
      </div>
    );
  const showRootNotes =
    !supplied ||
    registration.schema.kind !== "union" ||
    supplied.kind === "union";
  const sourceExplanation = showRootNotes
    ? effectiveSourceExplanation(context, path)
    : null;
  const sourceNote = sourceExplanation ? (
    <p className="bo-inline-note">{sourceExplanation}</p>
  ) : null;
  const inheritedPreview =
    inherited != null && inherited !== ""
      ? inherited
      : catalogInheritedText(context.value, path);
  const inheritanceNote =
    showRootNotes && (value == null || value === "") && inheritedPreview ? (
      <p className="bo-inline-note">
        {t("Contenu hérité :", "Inherited content:")} {inheritedPreview}.{" "}
        {t(
          "Ajouter une traduction ici ne recopie pas le repli.",
          "Adding a translation here does not copy the fallback.",
        )}
      </p>
    ) : null;
  if (schema.kind === "union")
    return (
      <>
        {sourceNote}
        {inheritanceNote}
        <UnionField context={context} path={path} schema={schema} />
      </>
    );
  if (schema.kind === "array")
    return (
      <>
        {sourceNote}
        {inheritanceNote}
        <ArrayField context={context} path={path} schema={schema} />
      </>
    );
  const error =
    mutationError ||
    context.issues
      .filter((issue) => issue.path === path.join("."))
      .map((issue) => catalogIssueMessage(issue.code, context.lang))
      .join(" · ");
  const change = (next: unknown) => {
    if (disabled) return false;
    const result = priceChange(context, path, next);
    if (result === "forbidden") {
      setMutationError(
        t(
          "Ce prix est lié à des champs que vous ne pouvez pas modifier.",
          "This price is linked to fields you cannot edit.",
        ),
      );
      return false;
    }
    setMutationError("");
    if (!result) context.onChange(path, next);
    return true;
  };
  const remove =
    schema.optional &&
    value !== undefined &&
    registration.deletion === "remove";
  const help =
    (value == null || value === "") && inheritedPreview ? (
      <>
        {t("Contenu affiché par repli :", "Inherited display content:")}{" "}
        {inheritedPreview}.{" "}
        {t(
          "Ajouter une valeur ici crée la traduction sans recopier le repli.",
          "Enter a value to add this translation without copying the fallback.",
        )}
      </>
    ) : !registration.publicConsumers.length ? (
      t(
        "Métadonnée conservée ; aucun affichage public direct aujourd’hui.",
        "Stored metadata; no direct public display currently.",
      )
    ) : undefined;
  if (schema.kind === "object")
    return (
      <fieldset className="bo-inline-object" data-catalog-path={path.join(".")}>
        <legend>{label}</legend>
        {sourceNote}
        {inheritanceNote}
        {value == null ? (
          <Button size="compact" disabled={disabled} onClick={() => change({})}>
            {t("Ajouter", "Add")} {label}
          </Button>
        ) : (
          Object.entries(schema.children ?? {})
            .filter(([key]) => !omit.includes(key))
            .map(([key, child]) => (
              <CatalogFieldEditor
                key={key}
                context={context}
                path={[...path, key]}
                schema={child}
              />
            ))
        )}
        {remove && (
          <Button
            size="compact"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setRemoved({ value });
                if (!priceChange(context, path, undefined))
                  context.onRemove(path);
              }
            }}
          >
            {t("Retirer", "Remove")} {label}
          </Button>
        )}
        {removed && value === undefined && (
          <Button
            size="compact"
            disabled={disabled}
            onClick={() => {
              change(removed.value);
              setRemoved(null);
            }}
          >
            {t("Annuler le retrait", "Undo removal")}
          </Button>
        )}
      </fieldset>
    );
  const legacyAmount = [
    "defaultMonthlyPrice",
    "compare_price_monthly_eur",
    "monthly_eur",
    "annual_monthly_eur",
    "price_original",
    "conversion_rate_to_eur",
  ].includes(String(path.at(-1)));
  const hasCanonical = ["pricing_v5", "pricing_v5En"].some((root) => {
    const plans = catalogValueAt(context.value, [root, "plans"]);
    return (
      Array.isArray(plans) &&
      plans.some(
        (plan) =>
          plan?.isComparePlan && !plan?.isFree && plan?.nativeAmount != null,
      )
    );
  });
  if (legacyAmount && hasCanonical)
    return (
      <div className="bo-inline-protected" data-catalog-path={path.join(".")}>
        <strong>{label}</strong>
        <ProtectedValue value={value} />
        <p>
          {t(
            "Valeur historique conservée ; les offres canoniques déterminent le prix affiché.",
            "Historical value retained; canonical offers determine the displayed price.",
          )}
        </p>
      </div>
    );
  const options =
    choices(context, path) ??
    (schema.kind === "enum"
      ? schema.options!.map((value) => ({
          value,
          label:
            context.lang === "en"
              ? ((
                  {
                    paid: "Paid",
                    free: "Free",
                    quote: "Contact sales",
                    unknown: "Not disclosed",
                    usage: "Usage based",
                    one_time: "One-time",
                    "one-time": "One-time",
                    annual_prepaid: "Annual prepaid",
                    ht: "Tax excluded",
                    ttc: "Tax included",
                    tax_included: "Tax included",
                  } as Record<string, string>
                )[value] ?? value.replaceAll("_", " "))
              : (optionLabels[value] ?? value),
        }))
      : null);
  return (
    <span className="bo-inline-field" data-catalog-path={path.join(".")}>
      <Field
        label={label}
        error={error || undefined}
        help={
          legacyAmount
            ? t(
                "Prix de repli historique actif. Modifier uniquement après vérification de sa source ; créer une offre canonique pour un prix publié dans sa devise.",
                "Active historical fallback. Edit only after verifying its source; add a canonical offer for a price published in its own currency.",
              )
            : help
        }
      >
        {schema.kind === "boolean" ? (
          <Select
            disabled={disabled}
            value={value == null ? "" : value ? "true" : "false"}
            onChange={(event) =>
              change(
                event.target.value === ""
                  ? null
                  : event.target.value === "true",
              )
            }
          >
            <option value="">{t("Non renseigné", "Not specified")}</option>
            <option value="true">{t("Oui", "Yes")}</option>
            <option value="false">{t("Non", "No")}</option>
          </Select>
        ) : options ? (
          <Select
            disabled={disabled}
            value={value == null ? "" : String(value)}
            onChange={(event) => change(event.target.value || null)}
          >
            <option value="">{t("Non renseigné", "Not specified")}</option>
            {value != null &&
              value !== "" &&
              !options.some((option) => option.value === String(value)) && (
                <option value={String(value)}>
                  {String(value)} · {t("valeur historique", "historical value")}
                </option>
              )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : (
          <PlainControl
            value={value}
            disabled={disabled}
            schema={schema}
            onChange={change}
          />
        )}
      </Field>
      {remove && (
        <Button
          variant="quiet"
          size="compact"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setRemoved({ value });
              if (!priceChange(context, path, undefined))
                context.onRemove(path);
            }
          }}
        >
          {t("Retirer", "Remove")} {label}
        </Button>
      )}
      {removed && value === undefined && (
        <Button
          size="compact"
          disabled={disabled}
          onClick={() => {
            change(removed.value);
            setRemoved(null);
          }}
        >
          {t("Annuler le retrait", "Undo removal")}
        </Button>
      )}
    </span>
  );
}
