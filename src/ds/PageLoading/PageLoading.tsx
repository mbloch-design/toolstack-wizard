import type { ReactNode } from "react";
import styles from "./PageLoading.module.css";

/** While a page finds its data: the title, a mark that breathes, one line, and a neutral outline of what comes (no invented figures). */
export default function PageLoading({ title, mark, message, note, pending = true, children }: {
  title: string; mark: ReactNode; message: string; note: string; pending?: boolean; children?: ReactNode;
}) {
  return (
    <div className={styles.loading} aria-busy={pending} data-page-loading="">
      <h1 className={styles.title}>{title}</h1>
      {pending && <>
        <div className={styles.welcome} role="status">
          <span className={styles.mark} aria-hidden="true">{mark}</span>
          <div className={styles.words}><p className={styles.message}>{message}</p><p className={styles.note}>{note}</p></div>
        </div>
        <div className={styles.outline} aria-hidden="true" data-loading-outline=""><span /><span /><span /></div>
      </>}
      {children}
    </div>
  );
}
