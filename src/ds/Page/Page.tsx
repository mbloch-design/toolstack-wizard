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
