import type { ReactNode } from "react";
import { Check, Plus } from "@/lib/icons";
import Logo, { type LogoProps } from "../Logo/Logo";
import styles from "./StackBoard.module.css";

/*
 * The stack at a glance, to be seen rather than read (M01, 14/11/2026, Michael: « on ne lit pas »).
 * TradeMap: the five everyday jobs as pictograms, lit with the logos of the tools that do them, dashed when empty.
 * Checkpoints: the steps to a tidy stack as a track of pastilles, a green tick once settled, the action under an open one.
 */

export type Trade = { id: string; name: string; icon: ReactNode; tools: LogoProps["tool"][] };

export function TradeMap({ label, trades, addLabel, onAdd, localLogosOnly = false }: {
  label: string; trades: Trade[]; addLabel: (trade: string) => string; onAdd?: (trade: string) => void; localLogosOnly?: boolean;
}) {
  return (
    <ul className={styles.trades} aria-label={label}>
      {trades.map((trade) => {
        const on = trade.tools.length > 0;
        return (
          <li key={trade.id} className={styles.trade} data-on={on || undefined}>
            <span className={styles.tradeIcon} aria-hidden="true">{trade.icon}</span>
            <span className={styles.tradeName}>{trade.name}</span>
            {on
              ? <span className={styles.tradeTools}>{trade.tools.slice(0, 3).map((tool) => <Logo key={tool.id} tool={tool} size={24} localOnly={localLogosOnly} />)}
                {trade.tools.length > 3 && <span className={styles.more}>+{trade.tools.length - 3}</span>}</span>
              : <button type="button" className={styles.tradeAdd} onClick={() => onAdd?.(trade.id)} aria-label={addLabel(trade.name)}><Plus aria-hidden /></button>}
          </li>
        );
      })}
    </ul>
  );
}

export type Checkpoint = { id: string; name: string; icon: ReactNode; done: boolean; note: string; action?: ReactNode };

export function Checkpoints({ label, steps, layout = "row" }: { label: string; steps: Checkpoint[];
  /** row: side by side (a wide tile); list: one under the other, the action at the end of its line (a narrow tile). */
  layout?: "row" | "list" }) {
  return (
    <ol className={styles.steps} aria-label={label} data-layout={layout}>
      {steps.map((step) => (
        <li key={step.id} className={styles.step} data-done={step.done || undefined}>
          <span className={styles.stepMark} aria-hidden="true">{step.done ? <Check /> : step.icon}</span>
          <span className={styles.stepName}>{step.name}</span>
          <span className={styles.stepNote}>{step.note}</span>
          {!step.done && step.action && <span className={styles.stepAction}>{step.action}</span>}
        </li>
      ))}
    </ol>
  );
}
