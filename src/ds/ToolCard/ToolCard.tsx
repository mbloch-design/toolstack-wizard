import { forwardRef, type CSSProperties, type ReactNode } from "react";
import Logo from "../Logo/Logo";
import type { LogoTool } from "@/lib/useToolLogoSource";
import Amount from "../Amount/Amount";
import Tag from "../Tag/Tag";
import { Fall, Tilt } from "../Gesture/Gesture";
import styles from "./ToolCard.module.css";

export type ToolStatus = "ok" | "review" | "overlap";
export type ToolCardProps = {
  lang: "fr" | "en";
  tool: LogoTool & { id: string };
  /** What the person pays, already formatted (« 36 € »), or a word (« Gratuit », « Prix ? »). */
  amount: string;
  /** A monthly amount shows « /mois » after it. */
  monthly: boolean;
  status: ToolStatus;
  /** The tool's area, shown when the list is not grouped by area. */
  area?: string;
  /** The colour of its area: a dot before the name, so a group cut by the end of a row still reads. */
  areaColor?: string;
  selected?: boolean;
  /** Edit mode: the card stops opening, a minus badge removes the tool. */
  editing?: boolean;
  onOpen: (button: HTMLButtonElement) => void;
  onRemove?: () => void;
  /** The trim: the card falls before it leaves the stack. */
  leaving?: boolean;
  localLogosOnly?: boolean;
};

const STATUS: Record<ToolStatus, [string, string]> = { ok: ["Prix renseigné", "Price recorded"], review: ["À vérifier", "To check"], overlap: ["Doublon", "Overlap"] };

/** One tool of the stack: logo, what it costs, name, one status. The same card in every view; views only arrange it. */
export default function ToolCard({ lang, tool, amount, monthly, status, area, areaColor, selected, editing, onOpen, onRemove, leaving = false, localLogosOnly = false }: ToolCardProps) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const label = t(...STATUS[status]);
  const tag: ReactNode = <Tag tone={status === "ok" ? "ok" : status === "overlap" ? "overlap" : "neutral"} on="tile" data-status-tag={status}>{label}</Tag>;
  return (
    <div className={styles.wrap} data-flip-id={tool.id}>
      <Fall leaving={leaving}>
      <Tilt>
      <button type="button" className={styles.card} data-tool-id={tool.id} data-tool-name={tool.name} data-status={status} data-selected={selected ? "" : undefined}
        aria-haspopup="dialog" aria-label={`${tool.name}, ${amount}${monthly ? t("/mois", "/mo") : ""}, ${label}`} tabIndex={editing ? -1 : undefined}
        onClick={(event) => { if (!editing) onOpen(event.currentTarget); }}>
        <span className={styles.logo}><Logo tool={tool} size={40} localOnly={localLogosOnly} /></span>
        <span className={styles.amount} data-amount="" aria-hidden="true"><Amount value={amount} unit={monthly ? t("/mois", "/mo") : undefined} /></span>
        <span className={styles.name} data-name="" aria-hidden="true">{areaColor && <i className={styles.dot} style={{ "--c": areaColor } as CSSProperties} />}{tool.name}</span>
        <span className={styles.foot} aria-hidden="true">{tag}{area && <span className={styles.note}>{area}</span>}</span>
      </button>
      </Tilt>
      {editing && onRemove && <button type="button" className={styles.remove} data-remove="" onClick={onRemove} aria-label={t(`Retirer ${tool.name} de ma stack`, `Remove ${tool.name} from my stack`)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
      </button>}
      </Fall>
    </div>
  );
}

/** The cards of one group, as a grid or a list. */
export function ToolCards({ layout, children }: { layout: "grid" | "list"; children: ReactNode }) {
  return <div className={styles.cards} data-layout={layout}>{children}</div>;
}

/** An area of the stack: its colour, name, how many tools and what they cost. */
export function ToolGroup({ label, color, note, children }: { label?: string; color?: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.group} aria-label={label}>
      {label && <header className={styles.groupName} style={{ "--c": color } as CSSProperties}><i aria-hidden="true" /><h3 className={styles.label}>{label}</h3>{note && <span className={styles.note}>{note}</span>}</header>}
      {children}
    </section>
  );
}

/** All the groups of the inventory, and what to say when a filter leaves nothing. */
export const ToolGroups = forwardRef<HTMLDivElement, { id?: string; label: string; layout: "grid" | "list"; grouped: boolean; editing: boolean; empty?: string; children: ReactNode }>(
  function ToolGroups({ id, label, layout, grouped, editing, empty, children }, ref) {
    return (
      <div id={id} ref={ref} className={styles.groups} role="group" aria-label={label} data-layout={layout} data-grouped={grouped ? "" : undefined} data-editing={editing || undefined}>
        {children}
        {empty && <p className={styles.note}>{empty}</p>}
      </div>
    );
  },
);
