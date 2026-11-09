import type { ReactNode } from "react";
import styles from "./Page.module.css";

/**
 * The column of a page: its blocks one under the other, the same gap between them, nothing wider
 * than the column. A group keeps blocks together (the stack and its discovery) with the same gap.
 */
export default function Page({ children, group = false }: { children: ReactNode; group?: boolean }) {
  return <div className={styles.page} data-page={group ? undefined : ""} data-page-group={group ? "" : undefined}>{children}</div>;
}
