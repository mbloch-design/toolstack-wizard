import { BackofficeNavigationContext, BackofficeSignOutContext, type BackofficeNavigationModel, type BackofficeSignOutModel } from "@/components/backoffice/backofficeNavigation";
import { BackofficeNavigation } from "@/ds/BackofficeNavigation/BackofficeNavigation";
import adminStyles from "@/ds/BackofficeNavigation/BackofficeNavigation.module.css";
import { CATALOG_EXIT_BLOCKED_EVENT } from "@/components/backoffice/useCatalogExitGuard";
import { Notice, NoticeText } from "@/ds/Notice/Notice";
import { IconButton } from "@/ds/Button/Button";
import Button from "@/ds/Button/Button";
import { MenuGroup, MenuLink } from "@/ds/Shell/Shell";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Home, Lightbulb, ChevronLeft, Bookmark, LayoutGrid, Boxes, Columns2, CirclePlus, UserRound, Menu, Languages } from "@/lib/icons";
import type { IconComponent } from "@/lib/icons";
import ShellMenuBody, { RouterLink, ShellAccountMenu } from "@/components/v2shell/ShellMenuBody";
import { BackLink, Crumbs, SearchTrigger, SideFootLink, Sidebar, StackLink, TabBar, Topbar } from "@/ds/Shell/Shell";
import Drawer, { DrawerTitle } from "@/ds/Drawer/Drawer";
import HomeGreeting from "@/components/v2shell/HomeGreeting";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import logoToolTrim from "@/assets/logo-tooltrim.svg";
import pictoToolTrim from "@/assets/picto-logo.svg";
import { SearchModal } from "@/components/SearchModal";
import Footer from "@/components/Footer";
import { getLanguageSwitchPath } from "@/lib/seo";
import { TopbarBreadcrumbContext, type TopbarBreadcrumbItem } from "@/contexts/TopbarBreadcrumbContext";

type NavItem = {
  id: string;
  labelFr: string;
  labelEn: string;
  Icon: IconComponent;
  to: string;
  /** Path segments (relative to /:lang) that mark this item active — covers index + detail routes. */
  match: string[];
};

const NAV_ITEMS: NavItem[] = [
  { id: "home",       labelFr: "Accueil",     labelEn: "Home",       Icon: Home,     to: "",             match: [""] },
  // Pictos choisis pour l'affordance (US-NAV-01) : une grille pour un
  // catalogue (la clé à molette évoquait des réglages), des paquets pour une
  // stack d'outils (l'ancien glyphe montrait une pile de documents), deux
  // colonnes côte à côte pour un comparatif (« Scale » rendait un poids).
  { id: "tools",      labelFr: "Outils",      labelEn: "Tools",      Icon: LayoutGrid, to: "/tools",       match: ["/tools", "/tool/"] },
  { id: "stacks",     labelFr: "Stacks",      labelEn: "Stacks",     Icon: Boxes,      to: "/stacks",      match: ["/stacks"] },
  { id: "compare",    labelFr: "Comparatifs", labelEn: "Compare",    Icon: Columns2,   to: "/comparatifs", match: ["/comparatifs", "/comparatif/"] },
  // Une ampoule pour des guides de conseil : le livre ouvert avait la même
  // silhouette que les deux colonnes des comparatifs.
  { id: "guides",     labelFr: "Guides",      labelEn: "Guides",     Icon: Lightbulb, to: "/guides",      match: ["/guides", "/guide/"] },
];

/** Expanded unless the visitor collapsed it. Prerendered HTML ships expanded;
    the inline script in index.html collapses it before first paint, so on
    hydrated pages the DOM already matches this value. */
function readSidebarPreference(): boolean {
  if (typeof window === "undefined") return true;
  try { return localStorage.getItem("tooltrim:sidebar-expanded") !== "false"; } catch { return true; }
}

export default function AppShellV2({ children }: { children: ReactNode }) {
  const { t, prefix, lang } = useLang();
  const location = useLocation();
  // Back office (another workstream, 11/11/2026): its own sections in the sidebar, no search, no Ma stack, a sign-out.
  const isAdmin = !!matchPath("/:lang/back-office", location.pathname);
  const navigate = useNavigate();
  const [adminNavigation, setAdminNavigation] = useState<BackofficeNavigationModel | null>(null);
  const [adminSignOut, setAdminSignOut] = useState<BackofficeSignOutModel | null>(null);
  const [adminBlocked, setAdminBlocked] = useState(false);
  const adminMenuRef = useRef<HTMLButtonElement>(null);
  // The control that opened the phone menu gets the focus back when it closes (Escape, a choice, the close button).
  const menuOpener = useRef<HTMLElement | null>(null);
  const openMenu = () => { menuOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setMenuOpen(true); };
  const [searchOpen, setSearchOpen] = useState(false);
  // The labelled navigation is the canonical desktop state. The compact rail
  // remains available as a deliberate choice and is remembered per browser.
  // Read the stored choice in the first render, not after mounting: most pages
  // are re-rendered by createRoot (not hydrated), so starting "expanded" then
  // correcting in an effect painted the wide bar and animated it shut.
  const [sidebarExpanded, setSidebarExpanded] = useState(readSidebarPreference);
  const contentRef = useRef<HTMLElement>(null);
  const { state: cartState } = useStackPins();
  const cartCount = cartState.pinnedToolSlugs.length;
  const cartLabel = t("Ma stack", "My stack");
  const otherLang = lang === "fr" ? "en" : "fr";
  const currentSearch = typeof window !== "undefined" && isAdmin ? window.location.search : location.search;
  const languageHref = `${getLanguageSwitchPath(location.pathname, otherLang)}${currentSearch}${location.hash}`;
  const [breadcrumb, setBreadcrumb] = useState<TopbarBreadcrumbItem[] | null>(null);
  // US-NAV-01 : la barre du haut cède la place au contenu quand on descend,
  // revient dès qu'on remonte, et reprend son état complet en haut de page.
  const [chromeHidden, setChromeHidden] = useState(false);
  const topbarRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    // Radix rend la main au bouton qui a ouvert le menu.
  }, []);
  const breadcrumbCtx = useMemo(() => ({ setBreadcrumb }), []);
  // Niveau supérieur de la page courante : avant-dernier maillon du fil
  // d'Ariane qui porte un lien, hors accueil (l'onglet du bas y mène déjà).
  const mobileParent = breadcrumb && breadcrumb.length >= 3
    ? [...breadcrumb.slice(1, -1)].reverse().find((item) => item.href) || null
    : null;

  // Path relative to the /:lang prefix, e.g. "/tool/notion" or "" for the homepage.
  const relPath = location.pathname.startsWith(prefix)
    ? location.pathname.slice(prefix.length).replace(/\/$/, "")
    : location.pathname;
  const isHome = relPath === "";
  const isAuthCallback = relPath === "/connexion/retour" || relPath === "/sign-in/callback";
  // A handful of routes intentionally have no breadcrumb and should keep
  // showing the search bar by default, rather than the blank placeholder
  // used everywhere else while a page's breadcrumb is still registering
  // (avoids flashing the search bar for a frame on pages that do have one).
  const showsSearchByDefault = relPath === "/search";

  // Ma stack changes view through query parameters while keeping the same
  // pathname. Always return the shared content rail to its canonical
  // horizontal origin so a focused/oversized child cannot make the whole
  // shell jump sideways between the board and a tool profile.
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollLeft = 0;
  }, [location.pathname, location.search]);

  // Le défilement vit dans .asv2-content sur ordinateur et sur la fenêtre en
  // mobile (voir index.css, max-width: 640px) : on écoute le bon conteneur.
  useEffect(() => {
    setChromeHidden(false);
    if (isAdmin) return;
    const mobile = window.matchMedia("(max-width: 640px)");
    let lastY = 0;
    let frame = 0;
    const scroller = () => (mobile.matches ? null : contentRef.current);
    const readY = () => scroller()?.scrollTop ?? window.scrollY;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = readY();
        const delta = y - lastY;
        // Le clavier dans la barre du haut ou la recherche ouverte la gardent visible.
        const focusInTopbar = !!topbarRef.current?.contains(document.activeElement);
        if (y < 64 || focusInTopbar) setChromeHidden(false);
        else if (delta > 6 && y > 120) setChromeHidden(true);
        else if (delta < -6) setChromeHidden(false);
        if (Math.abs(delta) > 6 || y < 64) lastY = y;
      });
    };
    lastY = readY();
    const content = contentRef.current;
    content?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      content?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isAdmin, location.pathname]);

  useEffect(() => {
    if (searchOpen || menuOpen) setChromeHidden(false);
  }, [searchOpen, menuOpen]);

  // Le raccourci affiché suit le clavier : ⌘K sur Mac, Ctrl K ailleurs. Rendu
  // « ⌘K » au premier passage (comme le prérendu), corrigé après montage.
  const [shortcut, setShortcut] = useState("⌘K");
  useEffect(() => {
    const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || navigator.userAgent;
    if (!/mac|iphone|ipad|ipod/i.test(platform)) setShortcut("Ctrl K");
  }, []);

  // ⌘K / Ctrl+K ouvre la recherche depuis n'importe quelle page : le raccourci
  // était affiché dans la barre sans être branché.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isAdmin && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAdmin]);

  // De 641 à 1 180 px, la barre est une colonne imposée pour laisser la place
  // au contenu. Elle peut quand même se déplier : elle pousse alors le contenu,
  // comme sur grand écran (Michael, 8 oct. 2026 ; avant : par-dessus), sans
  // toucher à la préférence enregistrée (US-NAV-01).
  const [forcedRail, setForcedRail] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 641px) and (max-width: 1180px)");
    const sync = () => { setForcedRail(query.matches); if (!query.matches) setRailOpen(false); };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const closedByNavigation = useRef(false);
  useEffect(() => { closedByNavigation.current = true; setRailOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!railOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setRailOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [railOpen]);
  const railIsOpen = forcedRail && railOpen;
  // Focus : il entre dans la barre dépliée sur sa première entrée et revient
  // sur le bouton « déplier » quand elle se referme (Échap, clic à côté).
  const sidebarRef = useRef<HTMLElement | HTMLDivElement>(null);
  const railWasOpen = useRef(false);
  useEffect(() => {
    if (railIsOpen) {
      requestAnimationFrame(() => sidebarRef.current?.querySelector<HTMLElement>("nav a, nav button")?.focus());
    } else if (railWasOpen.current && !closedByNavigation.current) {
      requestAnimationFrame(() => sidebarRef.current?.querySelector<HTMLElement>("button[aria-expanded]")?.focus());
    }
    closedByNavigation.current = false;
    railWasOpen.current = railIsOpen;
  }, [railIsOpen]);
  // Ce que l'utilisateur voit : dépliée ou non, quelle que soit la largeur.
  const shownExpanded = forcedRail ? railIsOpen : sidebarExpanded;
  const onSidebarToggle = () => (forcedRail ? setRailOpen((open) => !open) : toggleSidebar());

  const toggleSidebar = () => {
    setSidebarExpanded((current) => {
      const next = !current;
      try { localStorage.setItem("tooltrim:sidebar-expanded", String(next)); } catch { /* Keep session navigation. */ }
      return next;
    });
  };

  // Phone (≤ 640 px): the tab bar at the foot carries Ma stack and the menu; the top bar keeps search only.
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const sync = () => setPhone(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  // The catalogue guard blocks a link during capture and announces it: the open admin menu explains why.
  useEffect(() => {
    if (!isAdmin || !menuOpen) return;
    setAdminBlocked(false);
    const onBlocked = () => setAdminBlocked(true);
    document.addEventListener(CATALOG_EXIT_BLOCKED_EVENT, onBlocked);
    return () => document.removeEventListener(CATALOG_EXIT_BLOCKED_EVENT, onBlocked);
  }, [isAdmin, menuOpen]);
  const isCurrent = (item: NavItem) => item.id === "home" ? relPath === "" : item.match.some((m) => relPath === m || relPath.startsWith(m));
  const stackHref = `${prefix}/ma-stack`;
  const onStack = location.pathname === stackHref;
  const sideItems = [
    ...NAV_ITEMS.map((item) => ({ id: item.id, label: t(item.labelFr, item.labelEn), to: `${prefix}${item.to}`, icon: <item.Icon />, current: isCurrent(item) })),
    { id: "stack", label: cartLabel, to: stackHref, icon: <Bookmark />, current: onStack, count: cartCount },
  ];
  const tabIds = ["home", "tools", "compare"];
  const tabItems = [
    ...sideItems.filter((item) => tabIds.includes(item.id)),
    sideItems[sideItems.length - 1],
    { id: "menu", label: t("Menu", "Menu"), to: "#", icon: <UserRound />, onClick: openMenu },
  ];

  return (
    <TopbarBreadcrumbContext.Provider value={breadcrumbCtx}>
    <BackofficeNavigationContext.Provider value={setAdminNavigation}>
    <BackofficeSignOutContext.Provider value={setAdminSignOut}>
    <div className={`asv2-root${sidebarExpanded || railIsOpen ? " asv2-root--sidebar-expanded" : ""}${railIsOpen ? " asv2-root--rail-open" : ""}`} data-chrome={chromeHidden ? "hidden" : "shown"} suppressHydrationWarning>
      {railIsOpen && <button type="button" className="asv2-rail-backdrop" tabIndex={-1} aria-label={t("Réduire la barre latérale", "Collapse sidebar")} onClick={() => setRailOpen(false)} />}
      {/* The system's shell (src/ds/Shell, validated 11/11/2026). The wrappers only place it in the page. */}
      <div ref={sidebarRef as React.RefObject<HTMLDivElement>} className="shell-side" suppressHydrationWarning>
        <Sidebar link={RouterLink} lang={lang === "en" ? "en" : "fr"} home={prefix || "/"} expanded={shownExpanded} onToggle={onSidebarToggle}
          logo={<img className="shell-logo-full" src={logoToolTrim} alt="" width={96} height={21} />} mark={<img src={pictoToolTrim} alt="" width={24} height={24} />}
          label={t("Navigation principale", "Main navigation")} items={sideItems}
          nav={isAdmin ? <BackofficeNavigation {...(adminNavigation ?? {})} lang={lang === "en" ? "en" : "fr"} homeHref={prefix} collapsed={!shownExpanded} /> : undefined}
          foot={isAdmin
            // Back office: the language stays a real link in reach (its section survives the switch).
            ? <SideFootLink link={RouterLink} to={languageHref} icon={<Languages />} label={lang === "fr" ? "English" : "Français"} expanded={shownExpanded}
                ariaLabel={t("Site en français. Passer en anglais", "Site in English. Switch to French")}
                onClick={(event) => { if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(`${getLanguageSwitchPath(location.pathname, otherLang)}${window.location.search}${location.hash}`); }} />
            : <SideFootLink link={RouterLink} to={`${prefix}/submit`} icon={<CirclePlus />} label={t("Soumettre un outil", "Submit a tool")} expanded={shownExpanded} />} />
      </div>

      <div className="asv2-workspace">
        <div ref={topbarRef as React.RefObject<HTMLDivElement>} className="shell-top" data-has-parent={mobileParent ? "true" : undefined}>
          {isAdmin ? <Topbar
            start={<span className={adminStyles.workspaceTitle}>{t("Back-office", "Back office")}</span>}
            end={<>
              {adminSignOut && <Button variant="secondary" disabled={adminSignOut.busy} onClick={adminSignOut.onSignOut}>{t("Me déconnecter", "Sign out")}</Button>}
              {phone && <IconButton ref={adminMenuRef} label={t("Ouvrir le menu", "Open menu")} icon={<Menu />} tone="grey" size={40} onClick={openMenu} aria-haspopup="dialog" aria-expanded={menuOpen} />}
            </>} />
          : <Topbar
            start={phone
              ? (mobileParent ? <BackLink link={RouterLink} to={mobileParent.href!} label={mobileParent.label} icon={<ChevronLeft />} />
                : <Link to={prefix || "/"} aria-label="ToolTrim" className="shell-phone-logo"><img className="shell-logo-full" src={logoToolTrim} alt="" width={110} height={24} /></Link>)
              : isHome ? <HomeGreeting /> : breadcrumb ? <Crumbs link={RouterLink} homeIcon={<Home />} label={t("Fil d’Ariane", "Breadcrumb")} items={breadcrumb.map((item) => ({ label: item.label, to: item.href }))} /> : null}
            end={<>
              <SearchTrigger label={t("Rechercher", "Search")} shortcut={shortcut} onClick={() => setSearchOpen(true)} />
              {!phone && <ShellAccountMenu languageHref={languageHref} />}
              {!phone && <StackLink link={RouterLink} to={stackHref} label={cartLabel} icon={<Bookmark />} count={cartCount} current={onStack} />}
            </>} />}
        </div>

        {/* The scroll container holds the page's <main> and the footer as
            siblings, so the footer is a real contentinfo landmark and not
            nested in main (a11y audit, 8 Oct 2026). */}
        <div ref={contentRef as React.RefObject<HTMLDivElement>} className="asv2-content">
          <main id="main-content" tabIndex={-1} className="asv2-main">
            {children}
          </main>
          {!isAuthCallback && !isAdmin && <Footer />}
        </div>
      </div>

      {/* Phone: the tab bar at the foot. Drawn once mounted on a phone only: fixed to the screen's foot, it shifts
          nothing when it appears, and it stays out of every page's critical CSS (artefact budget, 11/11/2026). */}
      {phone && !isAdmin && <div className="shell-tabs">
        <TabBar link={RouterLink} label={t("Navigation", "Navigation")} items={tabItems} />
      </div>}

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      <Drawer open={menuOpen} onClose={closeMenu} closeLabel={t("Fermer le menu", "Close menu")}
        onCloseAutoFocus={(event) => { event.preventDefault(); (menuOpener.current?.isConnected ? menuOpener.current : adminMenuRef.current)?.focus(); }}>
        <DrawerTitle>{t("Menu", "Menu")}</DrawerTitle>
        {isAdmin
          ? <div className="shell-drawer-menu">
              <BackofficeNavigation {...(adminNavigation ?? {})} lang={lang === "en" ? "en" : "fr"} homeHref={prefix} onDone={closeMenu} onBlocked={() => setAdminBlocked(true)} />
              {adminBlocked && <Notice role="alert"><NoticeText>{t("Enregistrez ou abandonnez les modifications de la fiche avant de quitter cet écran.", "Save or discard your record edits before leaving this screen.")}</NoticeText></Notice>}
              <MenuGroup label={t("Réglages", "Settings")}>
                {/* A real link, so the catalogue guard can hold it while a record has unsaved edits. */}
                <MenuLink link={RouterLink} to={languageHref} icon={<Languages />}>{lang === "fr" ? "English" : "Français"}</MenuLink>
              </MenuGroup>
            </div>
          : <div className="shell-drawer-menu"><ShellMenuBody languageHref={languageHref} places onDone={closeMenu} /></div>}
      </Drawer>
    </div>
    </BackofficeSignOutContext.Provider>
    </BackofficeNavigationContext.Provider>
    </TopbarBreadcrumbContext.Provider>
  );
}
