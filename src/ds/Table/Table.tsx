import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "@/lib/icons";
import styles from "./Table.module.css";

export interface TableRow {
  key: string;
  /** Two cells; one cell spans both columns (a sentence in place of a list). */
  cells: ReactNode[];
  /** For the page and its tests: data-kind="delete". */
  kind?: string;
}

/** A group of rows under its own head (a row-group head), with the rows past `visible` folded in its last row. */
export interface TableSection {
  key: string;
  head?: ReactNode;
  rows: TableRow[];
  /** Rows in view before the fold; all when absent. */
  visible?: number;
  /** « Voir les 8 autres actions », given the number of rows folded. */
  showLabel?: (count: number) => string;
  hideLabel?: string;
  /** For the page and its tests: data-group="write". */
  group?: string;
}

/**
 * A two-column data table (step 8b, 18/11/2026; Michael on the server sheet's actions: « tableau, non ? »): a real
 * <table>, one head of columns, rows separated by a hairline as in the comparisons' decision table; on a narrow column
 * each row stacks, the second cell under the first. Fixed columns (step 8d, « aucune structure »): the second column
 * keeps the same width and the same left edge all the way down. Its rows come in sections, each opened by a row-group
 * head; a long section folds in its own last row (« Voir les 8 autres actions », then « Réduire »), its folded rows
 * still in the HTML.
 */
export default function Table({ columns, sections, labelledBy, caption, second = "40%" }: { columns: [string, string]; sections: TableSection[]; labelledBy?: string; caption?: string;
  /** The second column's width (fixed layout). */
  second?: string }) {
  return (
    <div className={styles.frame}>
      <table className={styles.table} aria-labelledby={labelledBy} data-table="">
        {caption && <caption className={styles.caption}>{caption}</caption>}
        <colgroup><col /><col style={{ width: second }} /></colgroup>
        <thead><tr>{columns.map((column) => <th key={column} scope="col" className={styles.head}>{column}</th>)}</tr></thead>
        {sections.map((section) => <Section key={section.key} section={section} />)}
      </table>
    </div>
  );
}

function Line({ row }: { row: TableRow }) {
  return (
    <tr className={styles.row} data-kind={row.kind}>
      {row.cells.length === 1
        ? <td colSpan={2} className={styles.cell}>{row.cells[0]}</td>
        : row.cells.map((cell, index) => index === 0 ? <th key={index} scope="row" className={styles.first}>{cell}</th> : <td key={index} className={styles.cell}>{cell}</td>)}
    </tr>
  );
}

function Section({ section }: { section: TableSection }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const visible = section.visible ?? section.rows.length;
  const folded = section.rows.slice(visible);
  return <>
    <tbody data-group={section.group}>
      {section.head && <tr className={styles.sectionRow}><th scope="rowgroup" colSpan={2} className={styles.section}>{section.head}</th></tr>}
      {section.rows.slice(0, visible).map((row) => <Line key={row.key} row={row} />)}
    </tbody>
    {folded.length > 0 && <>
      <tbody id={id} hidden={!open} data-folded="" data-group={section.group}>{folded.map((row) => <Line key={row.key} row={row} />)}</tbody>
      <tbody data-group={section.group}>
        <tr className={styles.footRow}>
          <td colSpan={2} className={styles.foot}>
            <button type="button" className={styles.fold} aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
              {open ? section.hideLabel : section.showLabel?.(folded.length)}<ChevronDown className={styles.chevron} data-open={open || undefined} aria-hidden="true" />
            </button>
          </td>
        </tr>
      </tbody>
    </>}
  </>;
}
