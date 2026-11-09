import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./CatalogAuthoring.module.css";

type DisclosureProps = ComponentPropsWithoutRef<"details"> & { summary: ReactNode };

export function CatalogSettings({ summary, className, children, flush, ...props }: DisclosureProps & { flush?: boolean }) {
  return <details {...props} className={className ? `${styles.settings} ${className}` : styles.settings} data-catalog-settings="" data-flush={flush || undefined}>
    <summary>{summary}</summary>
    {children}
  </details>;
}

export function CatalogIssues({ summary, children, ...props }: Omit<DisclosureProps, "className">) {
  return <details {...props} className={styles.issues}>
    <summary>{summary}</summary>
    {children}
  </details>;
}

export function CatalogToolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar} data-catalog-toolbar="">{children}</div>;
}

export function CatalogNote({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}
