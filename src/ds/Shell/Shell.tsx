import { forwardRef, useEffect, useRef, type ComponentType, type MouseEvent, type ReactElement, type ReactNode, type RefAttributes } from "react";
import * as Popover from "@radix-ui/react-popover";
import { PanelLeftClose, PanelLeftOpen, Search } from "@/lib/icons";
import Tooltip from "../Tooltip/Tooltip";
import styles from "./Shell.module.css";

/**
 * The site's frame (planche, « Naviguer »): the sidebar on the left, the top bar with the breadcrumb on the left
 * and the actions on the right. Router-free: every link is drawn by `link`, so the site passes its router link
 * and Storybook a plain anchor.
 */
export type ShellLinkProps = { to: string; className?: string; children: ReactNode; "aria-current"?: "page"; "aria-label"?: string; title?: string; onClick?: (event: MouseEvent<HTMLAnchorElement>) => void };
/** Forwards its ref and any other prop: the tooltip of the folded sidebar anchors on the link itself. */
export type ShellLink = ComponentType<ShellLinkProps & RefAttributes<HTMLAnchorElement>>;
const PlainLink: ShellLink = forwardRef<HTMLAnchorElement, ShellLinkProps>(function PlainLink({ to, children, ...rest }, ref) { return <a ref={ref} href={to} {...rest}>{children}</a>; });

/** Folded sidebar: the place's name shows in the system's tooltip, on the right, on hover or keyboard focus. */
function Folded({ on, label, children }: { on: boolean; label: string; children: ReactElement }) {
  return on ? <Tooltip label={label} side="right">{children}</Tooltip> : children;
}

/** A count that bumps when it changes (planche: « le compteur rebondit »). */
function Count({ value, max = 99 }: { value: number; max?: number }) {
  const first = useRef(true);
  useEffect(() => { first.current = false; }, []);
  if (value <= 0) return null;
  return <span key={value} className={styles.count} data-bump={first.current ? undefined : ""} aria-hidden="true">{value > max ? `${max}+` : value}</span>;
}

export type SideItem = { id: string; label: string; to: string; icon: ReactNode; current?: boolean; count?: number };

/** The sidebar: the sign, the way to fold it, the places of the site, and the submit link at the foot. */
export function Sidebar({ link: Link = PlainLink, logo, mark, home, expanded, onToggle, label, items, nav, foot, lang }: {
  link?: ShellLink; logo: ReactNode;
  /** The small sign, shown when folded; the fold button takes its place on hover or keyboard focus. */
  mark: ReactNode;
  home: string; expanded: boolean; onToggle: () => void; label: string; items: SideItem[];
  /** Another navigation in place of the site's places (the back office's sections). */
  nav?: ReactNode;
  foot?: ReactNode; lang: "fr" | "en";
}) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  return (
    <aside className={styles.sidebar} data-expanded={expanded || undefined} data-shell-sidebar="">
      <div className={styles.sideHead}>
        <Link to={home} className={styles.logo} aria-label="ToolTrim">{expanded ? logo : mark}</Link>
        <button type="button" className={styles.fold} onClick={onToggle} aria-expanded={expanded}
          aria-label={expanded ? t("Réduire la barre latérale", "Collapse sidebar") : t("Déployer la barre latérale", "Expand sidebar")}>
          {expanded ? <PanelLeftClose /> : <PanelLeftOpen />}
        </button>
      </div>
      {nav ?? <nav className={styles.nav} aria-label={label}>
        {items.map((item) => (
          <Folded key={item.id} on={!expanded} label={item.label}><Link to={item.to} className={styles.sideLink} aria-current={item.current ? "page" : undefined}
            aria-label={item.count ? `${item.label} · ${item.count}` : undefined}>
            <span className={styles.sideIcon} aria-hidden="true" data-stack-target={item.id === "stack" ? "" : undefined}>{item.icon}{!expanded && <Count value={item.count ?? 0} />}</span>
            <span className={styles.sideLabel}>{item.label}</span>
            {expanded && <Count value={item.count ?? 0} />}
          </Link></Folded>
        ))}
      </nav>}
      {foot && <div className={styles.sideFoot}>{foot}</div>}
    </aside>
  );
}

/** A quiet link at the foot of the sidebar (« Soumettre un outil »). */
export function SideFootLink({ link: Link = PlainLink, to, icon, label, expanded, ariaLabel, onClick }: { link?: ShellLink; to: string; icon: ReactNode; label: string; expanded: boolean;
  /** A fuller name when the label alone is not enough (« Site en français. Passer en anglais »). */
  ariaLabel?: string; onClick?: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  return <Folded on={!expanded} label={label}><Link to={to} className={styles.sideLink} aria-label={ariaLabel} onClick={onClick}><span className={styles.sideIcon} aria-hidden="true">{icon}</span><span className={styles.sideLabel}>{label}</span></Link></Folded>;
}

/** The top bar: where you are on the left, what you can do on the right. */
export function Topbar({ start, end }: { start?: ReactNode; end: ReactNode }) {
  return <header className={styles.topbar} data-shell-topbar=""><div className={styles.topStart}>{start}</div><div className={styles.topEnd}>{end}</div></header>;
}

/** The breadcrumb: links in note size, the current page leaning on its weight, « / » in watermark. */
export function Crumbs({ link: Link = PlainLink, label, items, homeIcon }: { link?: ShellLink; label: string; items: { label: string; to?: string }[];
  /** The first step drawn as a house in a round: its name stays for assistive tech. */
  homeIcon?: ReactNode }) {
  return (
    <nav className={styles.crumbs} aria-label={label}>
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          if (index === 0 && homeIcon && item.to && !last) return <li key="home"><Link to={item.to} className={styles.crumbHome} aria-label={item.label} title={item.label}>{homeIcon}</Link></li>;
          return <li key={`${index}-${item.label}`}>{item.to && !last ? <Link to={item.to}>{item.label}</Link> : <span aria-current={last ? "page" : undefined}>{item.label}</span>}</li>;
        })}
      </ol>
    </nav>
  );
}

/** Opens the search (⌘K): a field in look, a button in fact. */
export function SearchTrigger({ label, shortcut, onClick }: { label: string; shortcut: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.search} onClick={onClick} aria-label={`${label} (${shortcut})`} aria-keyshortcuts={shortcut === "⌘K" ? "Meta+K" : "Control+K"}>
      <Search aria-hidden="true" /><span className={styles.searchLabel}>{label}</span><kbd className={styles.kbd}>{shortcut}</kbd>
    </button>
  );
}

/** Ma stack, the call of the bar: an ink pill with its count. */
export function StackLink({ link: Link = PlainLink, to, label, icon, count, current }: { link?: ShellLink; to: string; label: string; icon: ReactNode; count: number; current?: boolean }) {
  return (
    <Link to={to} className={styles.stack} aria-current={current ? "page" : undefined} aria-label={count > 0 ? `${label} · ${count}` : label}>
      <span className={styles.stackIcon} aria-hidden="true" data-stack-target="">{icon}</span>
      <span className={styles.stackLabel}>{label}</span>
      <Count value={count} />
    </Link>
  );
}

/** The menu on the right: who you are (or how to sign in), then the site's settings with their state written out. */
export function ShellMenu({ trigger, label, open, onOpenChange, children, signedIn }: { trigger: ReactNode; label: string; open?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode;
  /** Marks the trigger of a signed-in person (pages and tests tell the account from the settings). */
  signedIn?: boolean }) {
  return (
    // Modal: keyboard focus stays in the menu while it is open and returns to its trigger on Escape.
    <Popover.Root modal open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild><button type="button" className={styles.menuTrigger} aria-label={label} data-account-trigger="" data-signed-in={signedIn || undefined}>{trigger}</button></Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className={styles.menu} align="end" sideOffset={8} aria-label={label} data-shell-menu="">{children}</Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** A group of the menu: an optional caps label, then its rows. */
export function MenuGroup({ label, children }: { label?: string; children: ReactNode }) {
  return <div className={styles.menuGroup} role="group" aria-label={label}>{label && <p className={styles.menuLabel}>{label}</p>}{children}</div>;
}

/** A setting: its name on the left, its control on the right. */
export function MenuSetting({ name, children }: { name: string; children: ReactNode }) {
  return <div className={styles.menuSetting}><span className={styles.menuName}>{name}</span>{children}</div>;
}

/** A place to go from the menu (« Paramètres », « Se déconnecter »). */
export function MenuLink({ link: Link = PlainLink, to, icon, children, onClick }: { link?: ShellLink; to: string; icon: ReactNode; children: ReactNode; onClick?: () => void }) {
  return <Link to={to} className={styles.menuLink} onClick={onClick}><span aria-hidden="true">{icon}</span>{children}</Link>;
}

/** Phone: the way up to the parent page, in the logo's place (« ‹ Outils »). */
export function BackLink({ link: Link = PlainLink, to, label, icon }: { link?: ShellLink; to: string; label: string; icon: ReactNode }) {
  return <Link to={to} className={styles.back}><span aria-hidden="true">{icon}</span>{label}</Link>;
}

/** Phone: the tab bar at the foot, within thumb reach. The current tab carries the blue mark on its top. */
export function TabBar({ link: Link = PlainLink, label, items }: { link?: ShellLink; label: string; items: (SideItem & { onClick?: () => void })[] }) {
  return (
    <nav className={styles.tabbar} aria-label={label} data-shell-tabbar="">
      {items.map((item) => {
        const inner = <><span className={styles.tabIcon} aria-hidden="true" data-stack-target={item.id === "stack" ? "" : undefined}>{item.icon}<Count value={item.count ?? 0} /></span><span className={styles.tabLabel}>{item.label}</span></>;
        return item.onClick
          ? <button key={item.id} type="button" className={styles.tab} onClick={item.onClick} aria-haspopup="dialog">{inner}</button>
          : <Link key={item.id} to={item.to} className={styles.tab} aria-current={item.current ? "page" : undefined} aria-label={item.count ? `${item.label} · ${item.count}` : undefined}>{inner}</Link>;
      })}
    </nav>
  );
}

/** An action of the menu that is not a place (« Se déconnecter »). */
export function MenuButton({ icon, children, onClick, disabled }: { icon: ReactNode; children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" className={styles.menuLink} onClick={onClick} disabled={disabled}><span aria-hidden="true">{icon}</span>{children}</button>;
}

/** Who is signed in, at the top of the menu. */
export function MenuIdentity({ name, detail }: { name: string; detail?: string }) {
  return <div className={styles.menuIdentity}><p className={styles.menuName}>{name}</p>{detail && <p className={styles.menuDetail}>{detail}</p>}</div>;
}

/** In the breadcrumb's place where there is no way to show (home): a short line in the same white pill, leading somewhere. */
export function ShellNote({ link: Link = PlainLink, to, children }: { link?: ShellLink; to: string; children: ReactNode }) {
  return <Link to={to} className={styles.note}>{children}</Link>;
}
