import type { ReactNode } from "react";
import styles from "./Page.module.css";

/**
 * The column of a page: its blocks one under the other, nothing wider than the column.
 * rhythm="chapters" spaces them as chapters (the page's longest distance); a group keeps blocks
 * together with the same gap.
 */
export default function Page({ children, group = false, rhythm = "blocks" }: { children: ReactNode; group?: boolean; rhythm?: "blocks" | "chapters" }) {
  return <div className={styles.page} data-rhythm={rhythm} data-page={group ? undefined : ""} data-page-group={group ? "" : undefined}>{children}</div>;
}

/**
 * A chapter: what it is about in a few words, then its content after the head distance.
 * The head is a sentence (21), not a section title: the content leads.
 */
export function Chapter({ title, lead, aside, label, children }: { title?: ReactNode; lead?: ReactNode; aside?: ReactNode; label?: string; children: ReactNode }) {
  return (
    <section className={styles.chapter} aria-label={label}>
      {(title || lead || aside) && <div className={styles.chapterTop}>
        <div className={styles.chapterHead}>{title && <h2 className={styles.chapterTitle}>{title}</h2>}{lead && <p className={styles.chapterLead}>{lead}</p>}</div>
        {aside}
      </div>}
      {children}
    </section>
  );
}

/** Two works side by side, the main one wider (7 / 5); one column when narrow. */
export function Pair({ main, side }: { main: ReactNode; side: ReactNode }) {
  return <div className={styles.pair}><div className={styles.pairMain}>{main}</div><div className={styles.pairSide}>{side}</div></div>;
}
