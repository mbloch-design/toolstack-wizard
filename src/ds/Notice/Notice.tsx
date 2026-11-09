import type { ReactNode } from "react";
import styles from "./Notice.module.css";

/**
 * Something the page has to say about itself: where the stack is saved, a browser that cannot save,
 * tools that left the catalogue. A tile (to act on) or a quiet line (all is well), never an alarm.
 */
export function Notice({ icon, title, children, actions, tone = "tile", label, role, name }: {
  /** For the page and its tests: data-notice="account". */
  name?: string;
  icon?: ReactNode; title?: ReactNode; children?: ReactNode; actions?: ReactNode;
  tone?: "tile" | "line"; label?: string; role?: "status" | "alert";
}) {
  return (
    <section className={styles.notice} data-tone={tone} aria-label={label} role={role} data-notice={name ?? ""}>
      <div className={styles.body}>
        {title && <p className={styles.title}>{icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}{title}</p>}
        {children}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  );
}

/** A sentence inside a notice. */
export function NoticeText({ children }: { children: ReactNode }) {
  return <p className={styles.text}>{children}</p>;
}

/** A small mark that says a state without words on screen (« Stack enregistrée »): an icon, its name for screen readers and on hover. */
export function StatusMark({ icon, label, live = false, focusable = false }: { icon: ReactNode; label: string; live?: boolean; focusable?: boolean }) {
  return <span className={styles.mark} role={live ? "status" : undefined} title={label} tabIndex={focusable ? 0 : undefined} data-status-mark="">
    <span aria-hidden="true">{icon}</span><span className={styles.srOnly}>{label}</span>
  </span>;
}

/** A quiet line with an icon (« Vos ajouts seront enregistrés automatiquement. »). */
export function StatusLine({ icon, children, live = false }: { icon: ReactNode; children: ReactNode; live?: boolean }) {
  return <p className={styles.line} role={live ? "status" : undefined} data-status-line=""><span className={styles.icon} aria-hidden="true">{icon}</span>{children}</p>;
}

/** Rows inside a notice: a name and its action (« Retirer de ma stack »). */
export function NoticeRows({ rows }: { rows: { id: string; label: string; action: ReactNode }[] }) {
  return <ul className={styles.rows}>{rows.map((row) => <li key={row.id} className={styles.row} data-notice-row=""><span>{row.label}</span>{row.action}</li>)}</ul>;
}
