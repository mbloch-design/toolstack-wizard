import type { ReactNode } from "react";
import Chip, { Chips } from "../Chip/Chip";
import Segmented from "../Segmented/Segmented";
import styles from "./Toolbar.module.css";

/** The head of a page section: title (with what sits beside it), a summary line, and the section's one action. */
export function SectionHead({ title, titleId, beside, note, action }: { title: string; titleId?: string; beside?: ReactNode; note?: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.sectionHead}>
      <div className={styles.sectionText}>
        <div className={styles.titleRow}><h2 id={titleId} tabIndex={-1} className={styles.titleSection}>{title}</h2>{beside}</div>
        {note && <p className={styles.lead}>{note}</p>}
      </div>
      {action && <div className={styles.sectionAction}>{action}</div>}
    </div>
  );
}

/** Three controls, three affordances: filter chips for what needs me, a menu to sort, icons for the layout. */
export default function Toolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>;
}

export function ToolbarTools({ children }: { children: ReactNode }) {
  return <div className={styles.tools}>{children}</div>;
}

export type Filter<T extends string> = { id: T; label: string; count: number; alert?: boolean };
/** Filter chips: the pressed one turns ink with a check that draws itself. */
export function FilterChips<T extends string>({ label, filters, value, onChange }: { label: string; filters: Filter<T>[]; value: T; onChange: (id: T) => void }) {
  return (
    <Chips label={label}>
      {filters.map((filter) => <Chip key={filter.id} check pressed={value === filter.id} count={filter.count} alert={filter.alert} onClick={() => onChange(filter.id)}>{filter.label}</Chip>)}
    </Chips>
  );
}

/** A sort menu on a pill: the native select, styled. */
export function SortSelect<T extends string>({ label, caption, value, options, onChange }: { label: string; caption: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <label className={styles.select}><span>{caption}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)} aria-label={label}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </label>
  );
}

/** Two or three icon buttons for the layout; the pressed one rises on a white pill. */
export function IconSwitch<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; icon: ReactNode }[]; onChange: (value: T) => void }) {
  // The system's segmented picker, with icons for labels and their names for screen readers.
  return <Segmented label={label} value={value} onChange={onChange} options={options.map((option) => ({ value: option.value, label: option.icon, ariaLabel: option.label }))} />;
}


/** A page section: its head, its controls and its content, spaced as one block. */
export function Section({ labelledBy, id, name, children }: { labelledBy: string; id?: string; name?: string; children: ReactNode }) {
  return <section className={styles.section} id={id} data-section={name} aria-labelledby={labelledBy}>{children}</section>;
}

/** The end of a section: one centred action (« D'autres pistes »). */
export function SectionFoot({ children }: { children: ReactNode }) {
  return <div className={styles.sectionFoot}>{children}</div>;
}
