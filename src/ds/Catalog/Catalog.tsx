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
  stuck: boolean; rail: ReactNode; railRef?: MutableRefObject<HTMLElement | null>; railLabel: string; tail?: ReactNode; prevLabel: string; nextLabel: string;
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
  // Three moments, each with its own move: floating (rises in), leaving (sinks out, still smoked), then back in
  // its place (fades in, light). Never two places changing in the same frame.
  const [mode, setMode] = useState<"inline" | "float" | "leaving">(stuck ? "float" : "inline");
  const [settling, setSettling] = useState(false);
  useLayoutEffect(() => {
    if (stuck) { setMode("float"); setSettling(false); return; }
    if (mode !== "float") return;
    // Back at once (13/11/2026): waiting for the floating bar to sink first left the top slot empty for ~0.7 s.
    setMode("inline");
    setSettling(true);
  }, [stuck]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!settling) return;
    const id = window.setTimeout(() => setSettling(false), 240);
    return () => window.clearTimeout(id);
  }, [settling]);
  const floating = mode !== "inline";
  const [frame, setFrame] = useState({ left: 0, width: 0, height: 0 });
  useEffect(() => {
    const node = slot.current;
    if (!node) return;
    const measure = () => { const r = node.getBoundingClientRect(); setFrame((f) => ({ left: r.left, width: r.width, height: floating ? f.height : (node.firstElementChild as HTMLElement | null)?.offsetHeight ?? f.height })); };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [floating]);
  return (
    <div ref={slot} className={styles.barSlot} style={floating && frame.height ? { height: frame.height } : undefined}>
    <div data-toolbar="catalog" className={styles.bar} data-stuck={floating || undefined} data-leaving={mode === "leaving" || undefined} data-settling={settling || undefined}
      style={{ "--bar-left": `${frame.left}px`, "--bar-width": `${frame.width}px` } as CSSProperties}>
      <div className={styles.railWrap} data-start={edges.start || undefined} data-end={edges.end || undefined}>
        <button type="button" className={styles.railArrow} data-side="start" onClick={() => go(-1)} aria-label={prevLabel} tabIndex={-1} hidden={edges.start}><ChevronLeft aria-hidden="true" /></button>
        <nav ref={setRail} className={styles.rail} aria-label={railLabel}>{rail}</nav>
        <button type="button" className={styles.railArrow} data-side="end" onClick={() => go(1)} aria-label={nextLabel} tabIndex={-1} hidden={edges.end}><ChevronRight aria-hidden="true" /></button>
      </div>
      {tail && <div className={styles.tail}>{tail}</div>}
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

/**
 * A place to go next, as a row: its sign, its name and one line on what it holds, one figure (« 128 outils »).
 * renderLink gives the router link. A row is a card too: the same hairline and quiet lift as the media card.
 */
export function LinkRow({ name, note, detail, icon, renderLink }: { name: string; note?: string; detail?: string; icon?: ReactNode; renderLink: (className: string, content: ReactNode) => ReactNode }) {
  return <li>{renderLink(styles.linkRow, <>
    {icon && <span className={styles.linkIcon} aria-hidden="true">{icon}</span>}
    <span className={styles.linkText}><span className={styles.linkName}>{name}</span>{detail && <span className={styles.linkDetail}>{detail}</span>}</span>
    {note && <span className={styles.linkNote}>{note}</span>}
    <ChevronRight className={styles.linkArrow} aria-hidden="true" />
  </>)}</li>;
}

export function LinkRows({ children }: { children: ReactNode }) {
  return <ul className={styles.linkRows}>{children}</ul>;
}


/* Three rhythms for an index page (12/11/2026): a few large tiles for the strong moment, compact cards led by
   a figure, then chapters of dense rows. The scale changes, so the page breathes. */

/** The strong moment: a few large tiles, each a place with its sign, its name large, why, and who is inside. */
export function PlaceTiles({ label, children }: { label: string; children: ReactNode }) {
  return <ul className={styles.placeTiles} aria-label={label}>{children}</ul>;
}

export function PlaceTile({ icon, name, detail, note, faces, renderLink }: { icon: ReactNode; name: string; detail?: string; note?: string;
  /** A few logos of what the place holds (the system's Logo, 24 px). */
  faces?: ReactNode; renderLink: (className: string, content: ReactNode) => ReactNode }) {
  return <li className={styles.placeSlot}>{renderLink(styles.placeTile, <>
    <span className={styles.placeTop}><span className={styles.placeIcon} aria-hidden="true">{icon}</span>{faces && <span className={styles.placeFaces} aria-hidden="true">{faces}</span>}</span>
    <span className={styles.placeName}>{name}</span>
    {detail && <span className={styles.placeDetail}>{detail}</span>}
    {note && <span className={styles.placeNote}>{note}<ChevronRight aria-hidden="true" /></span>}
  </>)}</li>;
}

/** Compact cards led by one figure (a budget, a saving): the figure first, large; what it is, under it. */
export function FigureCards({ label, children }: { label: string; children: ReactNode }) {
  return <ul className={styles.figureCards} aria-label={label}>{children}</ul>;
}

export function FigureCard({ figure, unit, name, detail, renderLink }: { figure: string; unit?: string; name: string; detail?: string; renderLink: (className: string, content: ReactNode) => ReactNode }) {
  return <li className={styles.placeSlot}>{renderLink(styles.figureCard, <>
    <span className={styles.figure}>{figure}{unit && <small>{unit}</small>}</span>
    <span className={styles.figureName}>{name}</span>
    {detail && <span className={styles.figureDetail}>{detail}</span>}
  </>)}</li>;
}

/** A chapter: its title, its sentence and its figure on the left (they stay in view), its content on the right. */
export function Chapter({ id, title, detail, count, children }: { id: string; title: string; detail?: string; count?: number; children: ReactNode }) {
  return (
    <section className={styles.chapter} aria-labelledby={id}>
      <header className={styles.chapterHead}>
        <h2 id={id} className={styles.sectionTitle}>{title}{count !== undefined && <span className={styles.sectionCount}>{count}</span>}</h2>
        {detail && <p className={styles.chapterDetail}>{detail}</p>}
      </header>
      <div className={styles.chapterBody}>{children}</div>
    </section>
  );
}
