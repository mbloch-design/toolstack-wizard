import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bookmark, Boxes, ChevronLeft, CirclePlus, Columns2, Home, LayoutGrid, Lightbulb, LogOut, Search, Settings2, UserRound } from "@/lib/icons";
import logoToolTrim from "@/assets/logo-tooltrim.svg";
import pictoToolTrim from "@/assets/picto-logo.svg";
import Segmented from "../Segmented/Segmented";
import Button, { IconButton } from "../Button/Button";
import Drawer, { DrawerTitle } from "../Drawer/Drawer";
import { BackLink, Crumbs, MenuGroup, MenuLink, MenuSetting, SearchTrigger, ShellMenu, SideFootLink, Sidebar, StackLink, TabBar, Topbar } from "./Shell";

const meta: Meta = { title: "Coquille/Navigation", tags: ["a-valider"], parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

/** The whole frame: sidebar, top bar (breadcrumb on the left, search, menu and Ma stack on the right), a page. */
function Frame({ lang, signedIn, count: start, folded = false }: { lang: Lang; signedIn: boolean; count: number; folded?: boolean }) {
  // Below a laptop the bar starts folded, as on the site.
  const [expanded, setExpanded] = useState(!folded && (typeof window === "undefined" || window.innerWidth >= 1024));
  const [count, setCount] = useState(start);
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP">("EUR");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<Lang>(lang);
  const items = [
    { id: "home", label: t(lang, "Accueil", "Home"), to: "#", icon: <Home /> },
    { id: "tools", label: t(lang, "Outils", "Tools"), to: "#", icon: <LayoutGrid />, current: true },
    { id: "stacks", label: t(lang, "Stacks", "Stacks"), to: "#", icon: <Boxes /> },
    { id: "compare", label: t(lang, "Comparatifs", "Compare"), to: "#", icon: <Columns2 /> },
    { id: "guides", label: t(lang, "Guides", "Guides"), to: "#", icon: <Lightbulb /> },
    { id: "stack", label: t(lang, "Ma stack", "My stack"), to: "#", icon: <Bookmark />, count },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", minHeight: 560, background: "var(--tt-bg)" }}>
      <Sidebar lang={lang} logo={<img src={logoToolTrim} alt="" width={96} height={21} />} mark={<img src={pictoToolTrim} alt="" width={24} height={24} />} home="#" expanded={expanded} onToggle={() => setExpanded((v) => !v)}
        label={t(lang, "Navigation principale", "Main navigation")} items={items}
        foot={<SideFootLink to="#" icon={<CirclePlus />} label={t(lang, "Soumettre un outil", "Submit a tool")} expanded={expanded} />} />
      <div style={{ minWidth: 0 }}>
        <Topbar
          start={<Crumbs homeIcon={<Home />} label={t(lang, "Fil d’Ariane", "Breadcrumb")} items={[{ label: t(lang, "Accueil", "Home"), to: "#" }, { label: t(lang, "Outils", "Tools"), to: "#" }, { label: t(lang, "Organisation", "Organisation"), to: "#" }, { label: "Notion" }]} />}
          end={<>
            <SearchTrigger label={t(lang, "Rechercher", "Search")} shortcut="⌘K" onClick={() => undefined} />
            <ShellMenu label={signedIn ? t(lang, "Compte et réglages", "Account and settings") : t(lang, "Réglages", "Settings")} trigger={signedIn ? <span style={{ font: "var(--tt-label-font)", letterSpacing: "var(--tt-label-tracking)" }}>CM</span> : <UserRound />}>
              <MenuGroup>
                {signedIn
                  ? <div><p style={{ margin: 0, font: "var(--tt-label-font)", letterSpacing: "var(--tt-label-tracking)" }}>Camille Martin</p><p style={{ margin: 0, font: "var(--tt-note-font)", letterSpacing: "var(--tt-note-tracking)" }}>camille@exemple.fr</p></div>
                  : <Button variant="primary">{t(lang, "Se connecter", "Sign in")}</Button>}
              </MenuGroup>
              <MenuGroup label={t(lang, "Réglages", "Settings")}>
                <MenuSetting name={t(lang, "Langue", "Language")}>
                  <Segmented label={t(lang, "Langue", "Language")} value={language} onChange={setLanguage} options={[{ value: "fr" as const, label: "FR", ariaLabel: "Français" }, { value: "en" as const, label: "EN", ariaLabel: "English" }]} />
                </MenuSetting>
                <MenuSetting name={t(lang, "Devise", "Currency")}>
                  <Segmented label={t(lang, "Devise", "Currency")} value={currency} onChange={setCurrency} options={[{ value: "EUR" as const, label: "€", ariaLabel: "Euro" }, { value: "USD" as const, label: "$", ariaLabel: "Dollar" }, { value: "GBP" as const, label: "£", ariaLabel: "Livre" }]} />
                </MenuSetting>
                <MenuSetting name={t(lang, "Thème", "Theme")}>
                  <Segmented label={t(lang, "Thème", "Theme")} value={theme} onChange={setTheme} options={[{ value: "light" as const, label: t(lang, "Clair", "Light") }, { value: "dark" as const, label: t(lang, "Sombre", "Dark") }]} />
                </MenuSetting>
              </MenuGroup>
              {signedIn && <MenuGroup>
                <MenuLink to="#" icon={<Settings2 />}>{t(lang, "Paramètres du compte", "Account settings")}</MenuLink>
                <MenuLink to="#" icon={<LogOut />}>{t(lang, "Se déconnecter", "Sign out")}</MenuLink>
              </MenuGroup>}
            </ShellMenu>
            <StackLink to="#" label={t(lang, "Ma stack", "My stack")} icon={<Bookmark />} count={count} />
          </>} />
        <main style={{ minWidth: 0, padding: "48px var(--tt-page-pad)", display: "grid", gap: 16, justifyItems: "start" }}>
          <h1 style={{ margin: 0, font: "var(--tt-title-xl-font)", letterSpacing: "var(--tt-title-xl-tracking)", overflowWrap: "anywhere" }}>Notion</h1>
          <p style={{ margin: 0, font: "var(--tt-note-font)", letterSpacing: "var(--tt-note-tracking)" }}>{t(lang, "Le compteur rebondit quand il change :", "The count bumps when it changes:")}</p>
          <Button onClick={() => setCount((n) => n + 1)}>{t(lang, "Ajouter", "Add")}</Button>
        </main>
      </div>
    </div>
  );
}

export const Visitor: Story = { name: "Visiteur", render: (_a, { globals: { lang } }) => <Frame lang={lang} signedIn={false} count={0} /> };
export const SignedIn: Story = { name: "Connecté, 4 outils", render: (_a, { globals: { lang } }) => <Frame lang={lang} signedIn count={4} /> };
export const Folded: Story = { name: "Barre repliée", render: (_a, { globals: { lang } }) => <Frame lang={lang} signedIn count={12} folded /> };

/** The menu's body, the same on a computer (popover) and a phone (panel from the bottom). */
function Settings({ lang, signedIn, places }: { lang: Lang; signedIn: boolean; places?: boolean }) {
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP">("EUR");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<Lang>(lang);
  return <>
    <MenuGroup>
      {signedIn
        ? <div><p style={{ margin: 0, font: "var(--tt-label-font)", letterSpacing: "var(--tt-label-tracking)" }}>Camille Martin</p><p style={{ margin: 0, font: "var(--tt-note-font)", letterSpacing: "var(--tt-note-tracking)" }}>camille@exemple.fr</p></div>
        : <Button variant="primary">{t(lang, "Se connecter", "Sign in")}</Button>}
    </MenuGroup>
    {places && <MenuGroup label={t(lang, "Explorer", "Explore")}>
      <MenuLink to="#" icon={<Boxes />}>{t(lang, "Stacks", "Stacks")}</MenuLink>
      <MenuLink to="#" icon={<Lightbulb />}>{t(lang, "Guides", "Guides")}</MenuLink>
      <MenuLink to="#" icon={<CirclePlus />}>{t(lang, "Soumettre un outil", "Submit a tool")}</MenuLink>
    </MenuGroup>}
    <MenuGroup label={t(lang, "Réglages", "Settings")}>
      <MenuSetting name={t(lang, "Langue", "Language")}>
        <Segmented label={t(lang, "Langue", "Language")} value={language} onChange={setLanguage} options={[{ value: "fr" as const, label: "FR", ariaLabel: "Français" }, { value: "en" as const, label: "EN", ariaLabel: "English" }]} />
      </MenuSetting>
      <MenuSetting name={t(lang, "Devise", "Currency")}>
        <Segmented label={t(lang, "Devise", "Currency")} value={currency} onChange={setCurrency} options={[{ value: "EUR" as const, label: "€", ariaLabel: "Euro" }, { value: "USD" as const, label: "$", ariaLabel: "Dollar" }, { value: "GBP" as const, label: "£", ariaLabel: "Livre" }]} />
      </MenuSetting>
      <MenuSetting name={t(lang, "Thème", "Theme")}>
        <Segmented label={t(lang, "Thème", "Theme")} value={theme} onChange={setTheme} options={[{ value: "light" as const, label: t(lang, "Clair", "Light") }, { value: "dark" as const, label: t(lang, "Sombre", "Dark") }]} />
      </MenuSetting>
    </MenuGroup>
    {signedIn && <MenuGroup>
      <MenuLink to="#" icon={<Settings2 />}>{t(lang, "Paramètres du compte", "Account settings")}</MenuLink>
      <MenuLink to="#" icon={<LogOut />}>{t(lang, "Se déconnecter", "Sign out")}</MenuLink>
    </MenuGroup>}
  </>;
}

/** Phone: the top bar (the sign, or the way up on a deep page; search on the right), the tab bar at the foot with the menu as its last tab. */
function Phone({ lang, deep, count }: { lang: Lang; deep: boolean; count: number }) {
  const [menu, setMenu] = useState(false);
  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", width: 390, height: 720, margin: "0 auto", background: "var(--tt-bg)", boxShadow: "0 0 0 1px var(--tt-line)" }}>
      <Topbar
        start={deep ? <BackLink to="#" label={t(lang, "Organisation", "Organisation")} icon={<ChevronLeft />} /> : <img src={logoToolTrim} alt="ToolTrim" width={110} height={24} />}
        end={<IconButton label={t(lang, "Rechercher", "Search")} icon={<Search />} tone="grey" size={40} />} />
      <main style={{ padding: "24px 20px", display: "grid", alignContent: "start", gap: 12 }}>
        <h1 style={{ margin: 0, font: "var(--tt-title-xl-font)", letterSpacing: "var(--tt-title-xl-tracking)" }}>{deep ? "Notion" : t(lang, "Choisir, pas empiler.", "Choose, don't stack.")}</h1>
      </main>
      <TabBar label={t(lang, "Navigation", "Navigation")} items={[
        { id: "home", label: t(lang, "Accueil", "Home"), to: "#", icon: <Home />, current: !deep },
        { id: "tools", label: t(lang, "Outils", "Tools"), to: "#", icon: <LayoutGrid />, current: deep },
        { id: "compare", label: t(lang, "Comparatifs", "Compare"), to: "#", icon: <Columns2 /> },
        { id: "stack", label: t(lang, "Ma stack", "My stack"), to: "#", icon: <Bookmark />, count },
        { id: "menu", label: t(lang, "Menu", "Menu"), to: "#", icon: <UserRound />, onClick: () => setMenu(true) },
      ]} />
      <Drawer open={menu} onClose={() => setMenu(false)} closeLabel={t(lang, "Fermer le menu", "Close menu")}>
        <DrawerTitle>{t(lang, "Menu", "Menu")}</DrawerTitle>
        <div style={{ display: "grid", gap: "var(--tt-gap-group)" }}><Settings lang={lang} signedIn places /></div>
      </Drawer>
    </div>
  );
}

export const PhoneHome: Story = { name: "Téléphone, accueil", parameters: { viewport: { defaultViewport: "mobile1" } }, render: (_a, { globals: { lang } }) => <Phone lang={lang} deep={false} count={4} /> };
export const PhoneDeep: Story = { name: "Téléphone, page profonde", render: (_a, { globals: { lang } }) => <Phone lang={lang} deep count={4} /> };
