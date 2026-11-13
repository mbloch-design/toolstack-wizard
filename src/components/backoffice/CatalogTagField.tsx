import { useId, useRef, useState } from "react";
import { Button, Field, IconButton, Input } from "@/ds/Controls/Controls";
import { CirclePlus, X } from "@/lib/icons";
import styles from "@/ds/CatalogRecordWorkspace/CatalogRecordWorkspace.module.css";
import { catalogChoices } from "./CatalogFieldEditor";
import { canEdit, catalogFieldLabel, catalogText, type CatalogEditingValue } from "./catalogEditingModel";

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function CatalogTagField({ context, root }: {
  context: CatalogEditingValue;
  root: "functional_needs" | "covers" | "personas" | "verticals";
}) {
  const t = (fr: string, en: string) => catalogText(context, fr, en);
  const label = catalogFieldLabel([root], context.lang);
  const path = [root];
  const current = context.value[root];
  const values: unknown[] = Array.isArray(current) ? current : [];
  const vocabulary = catalogChoices(context, [root, 0]) ?? [];
  const labelFor = (value: unknown) => vocabulary.find((item) => item.value === value)?.label ??
    (typeof value === "string" ? value : t("Valeur historique", "Historical value"));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [removed, setRemoved] = useState<{ index: number; value: unknown; count: number } | null>(null);
  const add = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const undo = useRef<HTMLButtonElement>(null);
  const group = useId();
  const allowed = canEdit(context, path);
  const needle = normalize(query);
  const matches = open ? vocabulary.filter(({ value, label }) =>
    !values.includes(value) && (normalize(label).includes(needle) || normalize(value).includes(needle)),
  ) : [];
  function closePicker() {
    setOpen(false);
    setQuery("");
    add.current?.focus();
  }
  function removeAt(index: number) {
    const value = values[index];
    setRemoved({ index, value, count: values.filter((item) => item === value).length });
    context.onChange(path, values.filter((_, i) => i !== index));
    setAnnouncement(t("Retiré de cette fiche", "Removed from this record") + " · " + labelFor(value));
    requestAnimationFrame(() => undo.current?.focus());
  }
  function restore() {
    if (!removed) return;
    const next = [...values];
    if (next.filter((item) => item === removed.value).length < removed.count) next.splice(removed.index, 0, removed.value);
    context.onChange(path, next);
    setRemoved(null);
    add.current?.focus();
  }
  return <fieldset className={styles.form} data-catalog-path={root}>
    <legend className={styles.label}>{label}</legend>
    {values.length ? <ul className={styles.chips} aria-label={label}>
      {values.map((value, index) => <li className={styles.chip} key={index}>
        {labelFor(value)}
        {allowed && <IconButton size="compact" variant="quiet" icon={<X />}
          aria-label={t("Retirer ", "Remove ") + labelFor(value)} onClick={() => removeAt(index)} />}
      </li>)}
    </ul> : <p className={styles.note}>{t("Aucune valeur renseignée.", "No value provided.")}</p>}
    {allowed && <div className={styles.actions}>
      <Button ref={add} size="compact" icon={<CirclePlus />} aria-expanded={open} aria-controls={open ? group : undefined} onClick={() => {
        if (open) closePicker();
        else { setOpen(true); requestAnimationFrame(() => search.current?.focus()); }
      }}>{t("Ajouter", "Add")} · {label}</Button>
      {removed && <Button ref={undo} size="compact" onClick={restore}>
        {t("Annuler le retrait de", "Undo removal of")} {labelFor(removed.value)}
      </Button>}
    </div>}
    {allowed && open && <div id={group} className={styles.form}>
      <Field label={t("Rechercher", "Search") + " · " + label}
        help={t("Choisissez une valeur du vocabulaire ToolTrim.", "Choose a value from the ToolTrim vocabulary.")}>
        <Input ref={search} type="search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
            if (event.key === "Escape") { event.preventDefault(); closePicker(); }
          }} />
      </Field>
      {matches.length ? <div className={styles.actions} role="group" aria-label={t("Suggestions", "Suggestions")}>
        {matches.slice(0, 8).map(({ label, value }) => <Button key={value} size="compact" icon={<CirclePlus />}
          onClick={() => {
            if (values.includes(value)) return;
            context.onChange(path, [...values, value]);
            setAnnouncement(t("Ajouté", "Added") + " · " + label);
            setQuery("");
            search.current?.focus();
          }}>{label}</Button>)}
      </div> : <p className={styles.note} role="status">{t("Aucun résultat.", "No matches.")}</p>}
      {matches.length > 8 && <p className={styles.note}>{t("Affinez votre recherche pour voir d’autres résultats.", "Refine your search to see more results.")}</p>}
    </div>}
    <p className={styles.note} aria-live="polite">{announcement}</p>
  </fieldset>;
}
