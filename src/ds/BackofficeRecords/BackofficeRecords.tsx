import { Notice, NoticeText } from "../Notice/Notice";
import Logo from "../Logo/Logo";
import { TextButton } from "../Button/Button";
import styles from "./BackofficeRecords.module.css";

export type RecordSummary = { slug: string; name: string; category: string; draft: unknown };
export default function BackofficeRecords({ records, lang, busy = false, onEdit, onLegacy }: { records: RecordSummary[]; lang: "fr" | "en"; busy?: boolean; onEdit: (slug: string) => void; onLegacy: (slug: string) => void }) {
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  if (!records.length) return <Notice name="records-empty"><NoticeText>{t("Aucune fiche trouvée.", "No records found.")}</NoticeText></Notice>;
  return <ul className={styles.list} aria-label={t("Fiches du catalogue", "Catalogue records")}>{records.map((record) => <li className={styles.row} key={record.slug}>
    <button className={styles.edit} disabled={busy} onClick={() => onEdit(record.slug)} aria-label={t(`Édition directe · ${record.name}`, `Direct editing · ${record.name}`)}><Logo tool={{ slug: record.slug, name: record.name }} size={32} /><span className={styles.identity}><strong>{record.name}</strong><small>{record.category}</small></span><span>{record.draft ? t("Brouillon", "Draft") : t("Publié", "Published")}</span></button>
    <details className={styles.more}><summary>{t("Autres actions", "More actions")}</summary><TextButton disabled={busy} onClick={() => onLegacy(record.slug)} aria-label={t(`Modifier ${record.name}`, `Edit ${record.name}`)}>{t("Ancien formulaire (temporaire)", "Legacy form (temporary)")}</TextButton></details>
  </li>)}</ul>;
}
