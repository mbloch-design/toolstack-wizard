import * as Popover from "@radix-ui/react-popover";
import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown } from "@/lib/icons";
import { useIsMobile } from "@/hooks/use-mobile";
import Drawer, { DrawerTitle } from "../Drawer/Drawer";
import styles from "./Tabs.module.css";

export type TabItem<T extends string> = { value: T; label: string;
  /** The name on a phone, when the full one would not let the row fit (« Code »). */
  short?: string;
  /** A brand is recognised by its mark before its name: 20 px. */
  icon?: ReactNode };

/**
 * Tabs (step 8c, 18/11/2026; Michael on the assistant choice: « réfléchis à l'ergonomie »): a choice that changes the
 * content below it, so tabs, not filter chips. A tablist on the segmented control's look (the thumb slides to the
 * chosen tab), arrow keys, Home and End. An optional last tab gathers the rarer choices behind a menu (a popover on a
 * computer, a sheet from the bottom on a phone); once one is chosen, the tab shows its name (« Cursor ▾ »).
 */
export default function Tabs<T extends string>({ label, value, onChange, tabs, more, panelId }: {
  label: string; value: T; onChange: (value: T) => void; tabs: TabItem<T>[];
  more?: { label: string; short?: string; icon?: ReactNode; menuLabel: string; closeLabel: string; options: TabItem<T>[] };
  /** The content the tabs drive (role="tabpanel"). */
  panelId?: string;
}) {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const chosenMore = more?.options.find((option) => option.value === value);
  const index = chosenMore ? tabs.length : Math.max(0, tabs.findIndex((tab) => tab.value === value));
  const count = tabs.length + (more ? 1 : 0);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const node = list.current;
    if (!node) return;
    const place = () => { const tab = node.querySelectorAll<HTMLElement>("[role=tab]")[index]; if (tab) setThumb({ left: tab.offsetLeft, width: tab.offsetWidth }); };
    place();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [index, count, chosenMore?.value]);

  const focusTab = (to: number) => list.current?.querySelectorAll<HTMLElement>("[role=tab]")[to]?.focus();
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, at: number) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    const to = step !== undefined ? (at + step + count) % count : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : undefined;
    if (to === undefined) return;
    event.preventDefault();
    focusTab(to);
    // Automatic activation for the plain tabs; the menu tab waits for Enter or Space.
    if (to < tabs.length) onChange(tabs[to].value);
  };
  const face = (item: { label: string; short?: string; icon?: ReactNode }) => <>
    {item.icon && <span className={styles.icon} aria-hidden="true">{item.icon}</span>}
    <span className={styles.name} data-short={item.short ? "" : undefined}>{item.label}</span>
    {item.short && <span className={styles.short} aria-hidden="true">{item.short}</span>}
  </>;
  const pick = (next: T) => { onChange(next); setOpen(false); requestAnimationFrame(() => focusTab(tabs.length)); };
  const menu = more && (
    <div className={styles.menu} role="menu" aria-label={more.menuLabel}
      onKeyDown={(event) => {
        const items = [...event.currentTarget.querySelectorAll<HTMLElement>("[role=menuitemradio]")];
        const at = items.indexOf(document.activeElement as HTMLElement);
        const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
        if (step === undefined) return;
        event.preventDefault();
        items[(at + step + items.length) % items.length]?.focus();
      }}>
      {more.options.map((option) => (
        <button key={option.value} type="button" role="menuitemradio" aria-checked={option.value === value} className={styles.item} onClick={() => pick(option.value)}>
          {option.icon && <span className={styles.icon} aria-hidden="true">{option.icon}</span>}{option.label}
        </button>
      ))}
    </div>
  );
  const moreTab = more && (
    <button type="button" role="tab" aria-selected={!!chosenMore} aria-controls={panelId} aria-haspopup="menu" aria-expanded={open} tabIndex={index === tabs.length ? 0 : -1}
      className={styles.tab} data-more="" onClick={() => setOpen((v) => !v)} onKeyDown={(event) => onKeyDown(event, tabs.length)}>
      {face(chosenMore ?? more)}<ChevronDown className={styles.chevron} aria-hidden="true" />
    </button>
  );
  return (
    <div className={styles.frame}>
    <div ref={list} className={styles.tabs} role="tablist" aria-label={label}
      style={(thumb ? { "--thumb-x": `${thumb.left}px`, "--thumb-w": `${thumb.width}px` } : {}) as CSSProperties}>
      <span className={styles.thumb} data-measured={thumb ? "" : undefined} aria-hidden="true" />
      {tabs.map((tab, at) => (
        <button key={tab.value} type="button" role="tab" aria-selected={at === index && !chosenMore} aria-controls={panelId} tabIndex={at === index && !chosenMore ? 0 : -1}
          className={styles.tab} onClick={() => onChange(tab.value)} onKeyDown={(event) => onKeyDown(event, at)}>{face(tab)}</button>
      ))}
      {more && (mobile
        ? <>{moreTab}<Drawer open={open} onClose={() => setOpen(false)} closeLabel={more.closeLabel}><DrawerTitle>{more.menuLabel}</DrawerTitle>{menu}</Drawer></>
        : <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>{moreTab}</Popover.Trigger>
            <Popover.Portal><Popover.Content className={styles.popover} align="end" sideOffset={8}
              onOpenAutoFocus={(event) => { event.preventDefault(); (event.currentTarget as HTMLElement).querySelector<HTMLElement>("[aria-checked=true], [role=menuitemradio]")?.focus(); }}>
              {menu}
            </Popover.Content></Popover.Portal>
          </Popover.Root>)}
    </div>
    </div>
  );
}
