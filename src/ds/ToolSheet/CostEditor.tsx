import type { ReactNode } from "react";
import { ValueChange } from "../Motion/Motion";
import styles from "./CostEditor.module.css";

/**
 * « Modifier mon abonnement »: a form, not instant settings. The choices make a draft; a preview says the
 * new cost; nothing changes in the stack before « Enregistrer ».
 */
export default function CostEditor({ blocks, previewLabel, preview, previewNote, actions }: {
  blocks: ReactNode; previewLabel: string; preview: string; previewNote?: string; actions: ReactNode;
}) {
  return (
    <div className={styles.editor} data-cost-editor="">
      {blocks}
      <div className={styles.foot}>
        <p className={styles.preview} aria-live="polite">
          <span className={styles.eyebrow}>{previewLabel}</span>
          <strong className={styles.amount} data-nowrap=""><ValueChange value={preview}>{preview}</ValueChange></strong>
          {previewNote && <span className={styles.note}>{previewNote}</span>}
        </p>
        <div className={styles.actions}>{actions}</div>
      </div>
    </div>
  );
}

/** One question of the form under its small title. */
export function EditorBlock({ label, children }: { label: string; children: ReactNode }) {
  return <div className={styles.block}><p className={styles.eyebrow}>{label}</p>{children}</div>;
}
