import type { ReactNode } from "react";
import styles from "./BackofficePageHeading.module.css";

export default function BackofficePageHeading({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return <header className={styles.heading}><div className={styles.copy}><h1 className={styles.title}>{title}</h1>{description && <p className={styles.description}>{description}</p>}</div>{action && <div className={styles.action}>{action}</div>}</header>;
}
