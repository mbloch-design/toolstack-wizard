import type { CSSProperties, ReactNode } from "react";
import { Check, Plus } from "@/lib/icons";
import Logo, { type LogoProps } from "../Logo/Logo";
import styles from "./StackBoard.module.css";

/*
 * The stack at a glance, to be seen rather than read (M01, 14/11/2026, Michael: « on ne lit pas »).
 * TradeMap: the five everyday jobs as pictograms, lit with the logos of the tools that do them, dashed when empty.
 * Checkpoints: the steps to a tidy stack as a track of pastilles, a green tick once settled, the action under an open one.
 */

export type Trade = { id: string; name: string; icon: ReactNode; tools: LogoProps["tool"][]; /** The job's colour (an area token). */ color?: string };

export function TradeMap({ label, trades, addLabel, onAdd, localLogosOnly = false }: {
  label: string; trades: Trade[]; addLabel: (trade: string) => string; onAdd?: (trade: string) => void; localLogosOnly?: boolean;
}) {
  return (
    <ul className={styles.trades} aria-label={label}>
      {trades.map((trade, index) => {
        const on = trade.tools.length > 0;
        return (
          <li key={trade.id} className={styles.trade} data-on={on || undefined} style={{ "--c": trade.color ?? "var(--tt-ink)", "--i": index } as CSSProperties}>
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

export function Checkpoints({ label, steps, layout = "row", progressLabel }: { label: string; steps: Checkpoint[];
  /** A track of one segment per step above the list, filled as steps are settled (« 2 étapes sur 3 »). */
  progressLabel?: string;
  /** row: side by side (a wide tile); list: one under the other, the action at the end of its line (a narrow tile). */
  layout?: "row" | "list" }) {
  return (
    <div className={styles.checkpoints}>
    {progressLabel && <span className={styles.track} role="img" aria-label={progressLabel}>
      {steps.map((step) => <span key={step.id} className={styles.segment} data-done={step.done || undefined} />)}
    </span>}
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
    </div>
  );
}

export type SpendItem = { id: string; tool: LogoProps["tool"]; amount: number;
  /** A short line under the name: the job it does. */
  area?: string;
  /** Overlaps another tool: its bar turns orange and says with which one. */
  overlapWith?: string };

/**
 * Where the money goes, tool by tool (M01, 14/11/2026): a ranked list of bars on one baseline, the most expensive
 * first, so amounts compare at a glance (a stacked bar hid the middle). Colour carries one meaning only: orange
 * for a tool that overlaps another, the money a decision can save. Past five tools, the rest folds into one line.
 */
export function SpendBar({ label, items, format, unpriced = [], unpricedLabel, priceAction, note, otherLabel, overlapLabel, localLogosOnly = false }: {
  label: string; items: SpendItem[]; format: (amount: number) => string;
  unpriced?: LogoProps["tool"][]; unpricedLabel?: string; priceAction?: ReactNode; note?: string;
  /** « 3 autres » for the folded line. */ otherLabel?: (count: number) => string;
  /** « Doublon avec Canva ». */ overlapLabel?: (other: string) => string;
  localLogosOnly?: boolean;
}) {
  const sorted = [...items].sort((x, y) => y.amount - x.amount);
  const shown = sorted.length > 6 ? sorted.slice(0, 5) : sorted;
  const rest = sorted.slice(shown.length);
  const restAmount = rest.reduce((sum, item) => sum + item.amount, 0);
  const max = Math.max(...shown.map((item) => item.amount), restAmount, 1);
  return (
    <div className={styles.spend}>
      <ol className={styles.spendList} aria-label={label}>
        {shown.map((item, index) => (
          <li key={item.id} className={styles.spendRow} data-overlap={item.overlapWith ? "" : undefined}>
            <Logo tool={item.tool} size={24} localOnly={localLogosOnly} />
            <span className={styles.spendWho}>
              <span className={styles.spendName}>{item.tool.name}</span>
              <span className={styles.spendArea}>{item.overlapWith && overlapLabel ? overlapLabel(item.overlapWith) : item.area}</span>
            </span>
            <span className={styles.spendTrack} aria-hidden="true"><span className={styles.spendFill} style={{ "--w": item.amount / max, "--i": index } as CSSProperties} /></span>
            <span className={styles.spendAmount}>{format(item.amount)}</span>
          </li>
        ))}
        {rest.length > 0 && <li className={styles.spendRow}>
          <span className={styles.spendMore} aria-hidden="true">+{rest.length}</span>
          <span className={styles.spendWho}><span className={styles.spendName}>{otherLabel ? otherLabel(rest.length) : `+${rest.length}`}</span></span>
          <span className={styles.spendTrack} aria-hidden="true"><span className={styles.spendFill} style={{ "--w": restAmount / max, "--i": shown.length } as CSSProperties} /></span>
          <span className={styles.spendAmount}>{format(restAmount)}</span>
        </li>}
      </ol>
      {unpriced.length > 0 && <div className={styles.unpriced}>
        <span className={styles.unpricedLabel}>{unpricedLabel}</span>
        <span className={styles.unpricedTools}>{unpriced.slice(0, 6).map((tool) => <Logo key={tool.id} tool={tool} size={24} localOnly={localLogosOnly} />)}{unpriced.length > 6 && <span className={styles.more}>+{unpriced.length - 6}</span>}</span>
        {priceAction}
      </div>}
      {note && <p className={styles.spendNote}>{note}</p>}
    </div>
  );
}
