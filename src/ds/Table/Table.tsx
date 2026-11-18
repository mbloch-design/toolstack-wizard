import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "@/lib/icons";
import styles from "./Table.module.css";

export interface TableRow {
  key: string;
  cells: ReactNode[];
  /** For the page and its tests: data-kind="delete". */
  kind?: string;
}

/** The rows a table keeps folded, each group with its subtitle (a row-group head) when it has one. */
export interface TableMore {
  groups: { key: string; title?: string; rows: TableRow[] }[];
  /** « Voir les 20 autres actions », given the number of rows folded. */
  showLabel: (count: number) => string;
  hideLabel: string;
}

/**
 * A two-column data table (step 8b, 18/11/2026; Michael on the server sheet's actions: « tableau, non ? »): a real
 * <table>, its column heads, rows separated by a hairline as in the comparisons' decision table. On a narrow column
 * each row stacks, the second cell under the first. Its name comes from a heading outside (labelledBy) or a caption.
 * Folded rows (step 8c, « idem ici »): the fold is the table's last row, a full-width button in its foot that says how
 * many rows are hidden; opened, the rows follow in place, by group under a row-group head, and the foot says « Réduire ».
 * Folded rows stay in the HTML.
 */
export default function Table({ columns, rows, labelledBy, caption, more }: { columns: [string, string]; rows: TableRow[]; labelledBy?: string; caption?: string; more?: TableMore }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const hidden = more ? more.groups.reduce((sum, group) => sum + group.rows.length, 0) : 0;
  const line = (row: TableRow) => (
    <tr key={row.key} className={styles.row} data-kind={row.kind}>
      {row.cells.map((cell, index) => index === 0 ? <th key={index} scope="row" className={styles.first}>{cell}</th> : <td key={index} className={styles.cell}>{cell}</td>)}
    </tr>
  );
  return (
    <div className={styles.frame}>
      <table className={styles.table} aria-labelledby={labelledBy}>
        {caption && <caption className={styles.caption}>{caption}</caption>}
        <thead><tr>{columns.map((column) => <th key={column} scope="col" className={styles.head}>{column}</th>)}</tr></thead>
        <tbody>{rows.map(line)}</tbody>
        {more && more.groups.map((group, index) => (
          <tbody key={group.key} id={index === 0 ? `${id}-more` : undefined} hidden={!open} data-folded="">
            {group.title && <tr className={styles.groupRow}><th scope="rowgroup" colSpan={2} className={styles.group}>{group.title}</th></tr>}
            {group.rows.map(line)}
          </tbody>
        ))}
        {more && hidden > 0 && (
          <tfoot>
            <tr className={styles.footRow}>
              <td colSpan={2} className={styles.foot}>
                <button type="button" className={styles.fold} aria-expanded={open} aria-controls={`${id}-more`} onClick={() => setOpen((value) => !value)}>
                  {open ? more.hideLabel : more.showLabel(hidden)}<ChevronDown className={styles.chevron} data-open={open || undefined} aria-hidden="true" />
                </button>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
