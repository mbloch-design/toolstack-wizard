import type { ReactNode, Ref } from "react";
import { useReveal } from "@/lib/useReveal";
import { DrawerDescription, DrawerTitle } from "../Drawer/Drawer";
import Tag from "../Tag/Tag";
import styles from "./ToolSheet.module.css";

/*
 * The parts of a tool's sheet in Ma stack. The sheet answers « what does this tool do in my stack? »:
 * what it costs me, what it covers, what it overlaps, what else to consider, then open it or let it go.
 * The page computes the words and figures; these parts only lay them out.
 */

/** Logo, where it sits in the stack, the name, one sentence. */
export function SheetHead({ logo, eyebrow, title, lead, explore }: { logo: ReactNode; eyebrow: string; title: string; lead?: string; explore?: ReactNode }) {
  return (
    <div className={styles.headBlock}>
      <header className={styles.head}>
        <span className={styles.logo}>{logo}</span>
        <div className={styles.titles}><p className={styles.eyebrow}>{eyebrow}</p><DrawerTitle>{title}</DrawerTitle></div>
      </header>
      {lead && <DrawerDescription>{lead}</DrawerDescription>}
      {explore}
    </div>
  );
}

/** The white card of what the tool costs me: its rows are separated by a hairline. */
export function CostCard({ label, children }: { label: string; children: ReactNode }) {
  return <section className={styles.costCard} aria-label={label} data-cost-card="">{children}</section>;
}

/** The figure of the sheet, large, with where it comes from and the official prices. */
export function CostFigure({ label, value, source, link }: { label: string; value: ReactNode; source?: string; link?: ReactNode }) {
  return (
    <div className={styles.costFigure}>
      <span className={styles.eyebrow}>{label}</span>
      <strong className={styles.figure} data-nowrap="">{value}</strong>
      {source && <span className={styles.note}>{source}</span>}
      {link}
    </div>
  );
}

/** A row of the cost card: a setting and its control (a switch). */
export function SettingRow({ title, note, control }: { title: string; note?: string; control: ReactNode }) {
  return <div className={styles.row}><span className={styles.rowText}><span className={styles.label}>{title}</span>{note && <span className={styles.note}>{note}</span>}</span>{control}</div>;
}

const CHEVRON = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>;
/** A row that opens what follows it (« Modifier mon abonnement »). */
export function DisclosureRow({ title, note, open, onToggle, buttonRef }: { title: string; note?: string; open: boolean; onToggle: () => void; buttonRef?: Ref<HTMLButtonElement> }) {
  return (
    <button type="button" ref={buttonRef} className={styles.disclosure} aria-expanded={open} onClick={onToggle}>
      <span className={styles.rowText}><span className={styles.label}>{title}</span>{note && <span className={styles.note}>{note}</span>}</span>
      <span className={styles.chevron}>{CHEVRON}</span>
    </button>
  );
}

/** What a row opens, inside the card. */
export function CardPanel({ children }: { children: ReactNode }) {
  return <div className={styles.panel}>{children}</div>;
}

/** A section of the sheet under a small title. */
export function SheetSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className={styles.section}><h3 className={styles.eyebrow}>{title}</h3>{children}</section>;
}

export function TagList({ items }: { items: string[] }) {
  return <ul className={styles.tags}>{items.map((item) => <li key={item}><Tag>{item}</Tag></li>)}</ul>;
}

export function SheetNote({ children }: { children: ReactNode }) {
  return <p className={styles.text}>{children}</p>;
}

/**
 * Another tool, as a row: its logo, name and one line (what is shared, its price and the gap),
 * the row itself opens it (renderMain gives a button or a link), an action on the right.
 */
export function ToolRow({ logo, name, note, renderMain, action }: { logo: ReactNode; name: string; note?: ReactNode; renderMain: (className: string, content: ReactNode) => ReactNode; action?: ReactNode }) {
  const reveal = useReveal<HTMLLIElement>();
  return (
    <li ref={reveal} className={styles.toolRow}>
      {renderMain(styles.toolMain, <>{logo}<span className={styles.rowText}><span className={styles.label}>{name}</span>{note && <span className={styles.note}>{note}</span>}</span></>)}
      {action}
    </li>
  );
}

export function ToolRows({ children }: { children: ReactNode }) {
  return <ul className={styles.toolRows}>{children}</ul>;
}

/** The actions of a tool I use: open it, read its profile, or let it go. */
export function SheetFoot({ actions, remove }: { actions: ReactNode; remove: ReactNode }) {
  return <footer className={styles.foot}><div className={styles.footActions}>{actions}</div>{remove}</footer>;
}
