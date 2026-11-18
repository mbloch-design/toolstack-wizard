import type { ReactNode } from "react";
import styles from "./Table.module.css";

export interface TableRow {
  key: string;
  cells: ReactNode[];
  /** Folded: the row stays in the HTML (indexed, read by assistive tech once shown), only hidden from view. */
  hidden?: boolean;
  /** For the page and its tests: data-kind="delete". */
  kind?: string;
}

/**
 * A two-column data table (step 8b, 18/11/2026; Michael on the server sheet's actions: « tableau, non ? »): a real
 * <table>, its column heads, rows separated by a hairline as in the comparisons' decision table. On a narrow column
 * each row stacks, the second cell under the first. Its name comes from a heading outside (labelledBy) or a caption.
 */
export default function Table({ columns, rows, labelledBy, caption }: { columns: [string, string]; rows: TableRow[]; labelledBy?: string; caption?: string }) {
  return (
    <div className={styles.frame}>
      <table className={styles.table} aria-labelledby={labelledBy}>
        {caption && <caption className={styles.caption}>{caption}</caption>}
        <thead><tr>{columns.map((column) => <th key={column} scope="col" className={styles.head}>{column}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={styles.row} hidden={row.hidden} data-kind={row.kind}>
              {row.cells.map((cell, index) => index === 0 ? <th key={index} scope="row" className={styles.first}>{cell}</th> : <td key={index} className={styles.cell}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
