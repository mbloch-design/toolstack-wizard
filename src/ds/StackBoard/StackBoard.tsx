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

export type SpendItem = { id: string; tool: LogoProps["tool"]; amount: number; color: string };

/**
 * Where the money goes, tool by tool (M01, 14/11/2026): one bar cut into the tools, each in its job's colour, so
 * the shares read at a glance; then the ranked list (logo, name, amount, share). A single-slice ring said nothing.
 * The tools without a price wait as small chips with the action that prices them.
 */
export function SpendBar({ label, items, format, unpriced = [], unpricedLabel, priceAction, note, localLogosOnly = false }: {
  label: string; items: SpendItem[]; format: (amount: number) => string;
  unpriced?: LogoProps["tool"][]; unpricedLabel?: string; priceAction?: ReactNode; note?: string; localLogosOnly?: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.amount, 0) || 1;
  const share = (amount: number) => `${Math.round((amount / total) * 100)} %`;
  return (
    <div className={styles.spend}>
      <span className={styles.spendBar} role="img" aria-label={`${label} : ${items.map((item) => `${item.tool.name} ${share(item.amount)}`).join(", ")}`}>
        {items.map((item, index) => <span key={item.id} className={styles.spendSegment} style={{ "--c": item.color, "--g": item.amount, "--i": index } as CSSProperties} />)}
      </span>
      <ol className={styles.spendList} aria-label={label}>
        {items.map((item) => (
          <li key={item.id} className={styles.spendRow}>
            <span className={styles.spendDot} style={{ "--c": item.color } as CSSProperties} aria-hidden="true" />
            <Logo tool={item.tool} size={24} localOnly={localLogosOnly} />
            <span className={styles.spendName}>{item.tool.name}</span>
            <span className={styles.spendAmount}>{format(item.amount)}</span>
            <span className={styles.spendShare}>{share(item.amount)}</span>
          </li>
        ))}
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
