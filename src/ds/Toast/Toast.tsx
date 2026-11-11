import type { CSSProperties, ReactNode } from "react";
import { Scissors } from "@/lib/icons";
import styles from "./Toast.module.css";

/** A welcome that lands: the person's logos drop into place, two short lines, a small burst. */
export default function WelcomeToast({ logos, title, detail }: { logos: ReactNode[]; title: string; detail: string }) {
  return (
    <div className={styles.toast} role="status">
      <span className={styles.logos} aria-hidden="true">{logos.slice(0, 4).map((logo, at) => <span key={at} style={{ animationDelay: `${120 + at * 90}ms` }}>{logo}</span>)}</span>
      <span className={styles.words}><b className={styles.title}>{title}</b><small className={styles.detail}>{detail}</small></span>
      <span className={styles.spark} aria-hidden="true">{Array.from({ length: 6 }, (_, at) => <i key={at} style={{ ["--a" as string]: `${at * 60}deg` }} />)}</span>
    </div>
  );
}

/**
 * A removal you can take back (planche, « Retrait avec annulation »): an ink pill, the message, « Annuler ». The undo
 * window is a cut line along its foot: the scissors run it back from right to left, then the pill leaves.
 */
export function UndoToast({ message, saving, undoLabel, onUndo, duration }: { message: string; saving?: string; undoLabel: string; onUndo: () => void; duration: number }) {
  return (
    <div className={styles.undo} role="status" style={{ "--life": `${duration}ms` } as CSSProperties}>
      <span className={styles.undoText}>{message}{saving && <b className={styles.undoSaving}>{saving}</b>}</span>
      <button type="button" className={styles.undoButton} onClick={onUndo}>{undoLabel}</button>
      <span className={styles.life} aria-hidden="true" />
      <span className={styles.lifeScissors} aria-hidden="true"><Scissors /></span>
    </div>
  );
}
