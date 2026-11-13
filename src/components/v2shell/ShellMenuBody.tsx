import { useNavigate } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { Boxes, CirclePlus, Lightbulb, LogOut, Settings2, ShieldCheck } from "@/lib/icons";
import Button from "@/ds/Button/Button";
import Segmented from "@/ds/Segmented/Segmented";
import { forwardRef, useState } from "react";
import { MenuButton, MenuGroup, MenuIdentity, MenuLink, MenuSetting, ShellMenu, type ShellLink, type ShellLinkProps } from "@/ds/Shell/Shell";
import { UserRound } from "@/lib/icons";
import AccountAvatar from "@/components/account/AccountAvatar";
import { useLang } from "@/hooks/useLang";
import { useCurrency, type Currency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import { accountPath } from "@/lib/accountPaths";
import { trackEvent } from "@/lib/analytics";

/** The router's link, for the system's shell (src/ds/Shell is router-free). */
export const RouterLink: ShellLink = forwardRef<HTMLAnchorElement, ShellLinkProps>(function RouterLink({ to, children, ...rest }, ref) { return <Link ref={ref} to={to} {...rest}>{children}</Link>; });

/** Who is there: nobody to ask (no accounts), still loading, a visitor, or a signed-in person. */
export function useShellAccount() {
  const account = useStackAccount();
  const experience = useAccountExperience();
  const { t } = useLang();
  if (!account.enabled) return { kind: "off" as const };
  if (!account.authInitialized) return { kind: "loading" as const };
  if (!account.user || account.syncStatus === "session-expired") return { kind: "guest" as const, expired: account.syncStatus === "session-expired" };
  const profile = experience.profile?.userId === account.user.id ? experience.profile : null;
  const name = profile?.displayName || account.user.email || t("Mon compte", "My account");
  return { kind: "user" as const, id: account.user.id, name, email: account.user.email ?? undefined, avatarUrl: profile?.avatarUrl ?? null, backoffice: !!profile?.canAccessBackoffice, busy: account.authBusy };
}

/**
 * The menu on the right (11/11/2026): who you are or how to sign in, then the site's settings with their state
 * written out. On a phone it also carries the places the tab bar leaves out.
 */
export default function ShellMenuBody({ languageHref, places = false, onDone }: { languageHref: string; places?: boolean; onDone: () => void }) {
  const { t, lang, prefix } = useLang();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const experience = useAccountExperience();
  const who = useShellAccount();
  return <>
    {who.kind === "user" && <MenuGroup><MenuIdentity name={who.name} detail={who.email !== who.name ? who.email : undefined} /></MenuGroup>}
    {who.kind === "guest" && <MenuGroup>
      <Button variant="primary" onClick={() => { onDone(); experience.openAuth("signin", `${prefix}/ma-stack`); }}>{who.expired ? t("Me reconnecter", "Sign in again") : t("Se connecter", "Sign in")}</Button>
    </MenuGroup>}
    {places && <MenuGroup label={t("Explorer", "Explore")}>
      <MenuLink link={RouterLink} to={`${prefix}/stacks`} icon={<Boxes />} onClick={onDone}>{t("Stacks", "Stacks")}</MenuLink>
      <MenuLink link={RouterLink} to={`${prefix}/guides`} icon={<Lightbulb />} onClick={onDone}>{t("Guides", "Guides")}</MenuLink>
      <MenuLink link={RouterLink} to={`${prefix}/submit`} icon={<CirclePlus />} onClick={onDone}>{t("Soumettre un outil", "Submit a tool")}</MenuLink>
    </MenuGroup>}
    <MenuGroup label={t("Réglages", "Settings")}>
      <MenuSetting name={t("Langue", "Language")}>
        <Segmented label={t("Langue", "Language")} value={lang === "en" ? "en" : "fr"} onChange={(next) => { if (next !== lang) { onDone(); navigate(languageHref); } }}
          options={[{ value: "fr" as const, label: "FR", ariaLabel: "Français" }, { value: "en" as const, label: "EN", ariaLabel: "English" }]} />
      </MenuSetting>
      <MenuSetting name={t("Devise", "Currency")}>
        <Segmented label={t("Devise", "Currency")} value={currency} onChange={(next: Currency) => { if (next !== currency) trackEvent("currency_switch", { from: currency, to: next }); setCurrency(next); }}
          options={[{ value: "EUR" as const, label: "€", ariaLabel: "Euro" }, { value: "USD" as const, label: "$", ariaLabel: t("Dollar américain", "US dollar") }, { value: "GBP" as const, label: "£", ariaLabel: t("Livre sterling", "Pound sterling") }]} />
      </MenuSetting>
      <MenuSetting name={t("Thème", "Theme")}>
        <Segmented label={t("Thème", "Theme")} value={theme === "dark" ? "dark" : "light"} onChange={(next) => { if (next !== theme) toggleTheme(); }}
          options={[{ value: "light" as const, label: t("Clair", "Light") }, { value: "dark" as const, label: t("Sombre", "Dark") }]} />
      </MenuSetting>
    </MenuGroup>
    {who.kind === "user" && <MenuGroup>
      <MenuLink link={RouterLink} to={accountPath(lang, "settings")} icon={<Settings2 />} onClick={onDone}>{t("Paramètres du compte", "Account settings")}</MenuLink>
      {who.backoffice && <MenuLink link={RouterLink} to={`${prefix}/back-office`} icon={<ShieldCheck />} onClick={onDone}>{t("Back-office", "Back office")}</MenuLink>}
      <MenuButton icon={<LogOut />} disabled={who.busy} onClick={() => { onDone(); experience.requestSignOut(); }}>{t("Me déconnecter", "Sign out")}</MenuButton>
    </MenuGroup>}
  </>;
}

/** The round menu at the top right on a computer: the avatar (or a person), then the menu's body. */
export function ShellAccountMenu({ languageHref }: { languageHref: string }) {
  const { t } = useLang();
  const who = useShellAccount();
  const [open, setOpen] = useState(false);
  if (who.kind === "loading") return null;
  return (
    <ShellMenu label={who.kind === "user" ? t(`Compte : ${who.name}`, `Account: ${who.name}`) : t("Réglages", "Settings")}
      open={open} onOpenChange={setOpen} signedIn={who.kind === "user"} account={who.kind !== "off"}
      trigger={who.kind === "user" ? <AccountAvatar ownerId={who.id} label={who.name} avatarUrl={who.avatarUrl} /> : <UserRound />}>
      <ShellMenuBody languageHref={languageHref} onDone={() => setOpen(false)} />
    </ShellMenu>
  );
}
