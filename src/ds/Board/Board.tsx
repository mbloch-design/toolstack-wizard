import type { ReactNode } from "react";
import styles from "./Board.module.css";

export type BoardProps = {
  /** What the stack costs: always there. */
  budget: ReactNode;
  /** The one thing to do now: the decision card, or the starter when the stack has one tool. */
  action?: ReactNode;
  usage?: ReactNode;
  split?: ReactNode;
  label: string;
};

/**
 * The top of Ma stack, read as a statement, an action, then the detail. The board knows which cards it holds,
 * so it picks its own grid; DOM order is reading order, on a phone too. Cards keep their content height.
 */
export default function Board({ budget, action, usage, split, label }: BoardProps) {
  return (
    <section className={styles.board} data-board="" aria-label={label} data-action={action ? "" : undefined} data-usage={usage ? "" : undefined} data-split={split ? "" : undefined}>
      <div className={styles.grid}>
        <div className={styles.budget}>{budget}</div>
        {action && <div className={styles.action}>{action}</div>}
        {usage && <div className={styles.usage}>{usage}</div>}
        {split && <div className={styles.split}>{split}</div>}
      </div>
    </section>
  );
}
