import type { CSSProperties, ReactNode, Ref } from "react";
import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import { ChevronLeft, ChevronRight, Filter, X } from "@/lib/icons";
import styles from "./Catalog.module.css";

/**
 * The catalogue's own pieces (11/11/2026, « mise à plat du catalogue »). Everything else on a catalogue page comes
 * from the system: Chip(s) for the needs and facets, Drawer + Segmented for the filters, MediaCard for the featured
 * tools, ToolRow(s) for the shelves, Button for « Afficher plus ».
 */

/** The page title, with the number of tools as a light figure after it (read as a sentence by assistive tech). */
export function CatalogTitle({ title, count, countLabel, lead, sentinelRef }: { title: string; count?: number; countLabel?: string;
  /** The page's own sentence under its title (a category's lead: unique, crawlable copy). */
  lead?: string;
  /** The filter bar's sticky detector, set at the title's foot so it takes no row of its own. */
  sentinelRef?: Ref<HTMLDivElement> }) {
  return (
    <div className={styles.head}>
      <h1 className={styles.title}>
        {title}
        {count !== undefined && <sup className={styles.count}><span aria-hidden="true">{count}</span>{countLabel && <span className={styles.sr}>{countLabel}</span>}</sup>}
      </h1>
      {lead && <p className={styles.lead}>{lead}</p>}
      {sentinelRef && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
    </div>
  );
}

/**
 * The filter bar (reworked 11/11/2026): the needs on a rail that shows it scrolls (a fade on the side that has more,
 * round arrows on a computer), never clipping a chip's outline or focus ring; the filters action apart at the end.
 * It sits 24 px under the title and sticks under the top bar, turning to glass once stuck.
 */
export function FilterBar({ stuck, rail, railRef, railLabel, tail, prevLabel, nextLabel }: {
  stuck: boolean; rail: ReactNode; railRef?: MutableRefObject<HTMLElement | null>; railLabel: string; tail: ReactNode; prevLabel: string; nextLabel: string;
}) {
  const own = useRef<HTMLElement | null>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const setRail = (node: HTMLElement | null) => { own.current = node; if (railRef) railRef.current = node; };
  useEffect(() => {
    const node = own.current;
    if (!node) return;
    const read = () => setEdges({ start: node.scrollLeft <= 2, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 2 });
    read();
    node.addEventListener("scroll", read, { passive: true });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(read) : null;
    observer?.observe(node);
    return () => { node.removeEventListener("scroll", read); observer?.disconnect(); };
  }, []);
  const go = (direction: 1 | -1) => own.current?.scrollBy({ left: direction * own.current.clientWidth * 0.7, behavior: "smooth" });
  // The slot keeps the bar's height in the page and gives the floating bar its left edge and width.
  const slot = useRef<HTMLDivElement | null>(null);
  // Coming back to its place: the colours swap at once and the bar fades in, so no chip is seen turning.
  const wasStuck = useRef(stuck);
  const [settling, setSettling] = useState(false);
  useLayoutEffect(() => {
    if (wasStuck.current && !stuck) { setSettling(true); const id = window.setTimeout(() => setSettling(false), 400); wasStuck.current = stuck; return () => window.clearTimeout(id); }
    wasStuck.current = stuck;
  }, [stuck]);
  const [frame, setFrame] = useState({ left: 0, width: 0, height: 0 });
  useEffect(() => {
    const node = slot.current;
    if (!node) return;
    const measure = () => { const r = node.getBoundingClientRect(); setFrame((f) => ({ left: r.left, width: r.width, height: stuck ? f.height : (node.firstElementChild as HTMLElement | null)?.offsetHeight ?? f.height })); };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [stuck]);
  return (
    <div ref={slot} className={styles.barSlot} style={stuck && frame.height ? { height: frame.height } : undefined}>
    <div data-toolbar="catalog" className={styles.bar} data-stuck={stuck || undefined} data-settling={settling || undefined}
      style={{ "--bar-left": `${frame.left}px`, "--bar-width": `${frame.width}px` } as CSSProperties}>
      <div className={styles.railWrap} data-start={edges.start || undefined} data-end={edges.end || undefined}>
        <button type="button" className={styles.railArrow} data-side="start" onClick={() => go(-1)} aria-label={prevLabel} tabIndex={-1} hidden={edges.start}><ChevronLeft aria-hidden="true" /></button>
        <nav ref={setRail} className={styles.rail} aria-label={railLabel}>{rail}</nav>
        <button type="button" className={styles.railArrow} data-side="end" onClick={() => go(1)} aria-label={nextLabel} tabIndex={-1} hidden={edges.end}><ChevronRight aria-hidden="true" /></button>
      </div>
      <div className={styles.tail}>{tail}</div>
    </div>
    </div>
  );
}

/** A section of the catalogue page: its title (a figure beside it, a link to see all), then its content. */
export function CatalogSection({ id, title, count, action, children, as = "h2" }: { id: string; title: ReactNode; count?: number; action?: ReactNode; children: ReactNode; as?: "h2" | "h3" }) {
  const Heading = as;
  return (
    <section className={styles.section} aria-labelledby={id}>
      <header className={styles.sectionHead}>
        <Heading id={id} className={styles.sectionTitle}>{title}{count !== undefined && <span className={styles.sectionCount}>{count}</span>}</Heading>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Nothing matches: a quiet mark, one sentence, the way out. */
export function EmptyState({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyMark} aria-hidden="true">{icon}</span>
      <p className={styles.emptyTitle}>{title}</p>
      {action}
    </div>
  );
}

/** What is filtered, each removable, and a way to clear them all. */
export function ActiveFilters({ label, children }: { label: string; children: ReactNode }) {
  return <div className={styles.active} role="group" aria-label={label}>{children}</div>;
}

/** One active filter: its name and a cross; the whole pill removes it. */
export function ActiveFilter({ children, onRemove, removeLabel }: { children: ReactNode; onRemove: () => void; removeLabel: string }) {
  return <button type="button" className={styles.activeChip} onClick={onRemove} aria-label={removeLabel}>{children}<X aria-hidden="true" /></button>;
}

/** The foot of the filters sheet: the live count as the main action, clearing beside it. */
export function FiltersFoot({ children }: { children: ReactNode }) {
  return <div className={styles.foot}>{children}</div>;
}

/** The body of the filters sheet: its groups spaced on the system's rhythm. */
export function FiltersPanel({ children }: { children: ReactNode }) {
  return <div className={styles.filters} data-filter-panel="">{children}</div>;
}

/**
 * The filters button: an action that opens the sheet, not one more need. It stands apart from the rail: a raised
 * pill with its icon, the number of active filters in an ink badge.
 */
export const FiltersButton = forwardRef<HTMLButtonElement, { label: string; count: number; open: boolean; onClick: () => void; ariaLabel?: string }>(
  function FiltersButton({ label, count, open, onClick, ariaLabel }, ref) {
    return (
      <button ref={ref} type="button" className={styles.filtersButton} aria-haspopup="dialog" aria-expanded={open} aria-label={ariaLabel} data-filters-trigger="" data-active={count > 0 || undefined} onClick={onClick}>
        <Filter aria-hidden="true" />{label}{count > 0 && <span className={styles.filtersCount} aria-hidden="true">{count}</span>}
      </button>
    );
  });

/** Every item of a page as plain links, in columns (crawlers do not press « Afficher plus »). */
export function LinkIndex({ label, children }: { label: string; children: ReactNode }) {
  return <ul className={styles.index} aria-label={label}>{children}</ul>;
}

/** A place to go next, as a row: its name and one figure (« 128 outils »). renderLink gives the router link. */
export function LinkRow({ name, note, renderLink }: { name: string; note?: string; renderLink: (className: string, content: ReactNode) => ReactNode }) {
  return <li>{renderLink(styles.linkRow, <><span className={styles.linkName}>{name}</span>{note && <span className={styles.linkNote}>{note}</span>}<ChevronRight className={styles.linkArrow} aria-hidden="true" /></>)}</li>;
}

export function LinkRows({ children }: { children: ReactNode }) {
  return <ul className={styles.linkRows}>{children}</ul>;
}
