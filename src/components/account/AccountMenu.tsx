import AccountAvatar from "./AccountAvatar";
import { useState } from "react";
import { Link } from "react-router-dom";
import { UserRound, Settings2, LogOut, ChevronDown } from "@/lib/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "./AccountExperienceProvider";
import { accountPath } from "@/lib/accountPaths";
export default function AccountMenu() {
  const account = useStackAccount();
  const experience = useAccountExperience();
  const { t, lang, prefix } = useLang();
  const [open, setOpen] = useState(false);
  if (!account.enabled) return null;
  if (!account.authInitialized) return <span className="ac-header-loading" role="status" aria-label={t("Chargement du compte", "Loading account")} />;
  if (!account.user || account.syncStatus === "session-expired") return (
    <button type="button" className="ac-header-trigger" onClick={() => experience.openAuth("signin")}
      aria-label={account.syncStatus === "session-expired" ? t("Me reconnecter", "Sign in again") : t("Se connecter", "Sign in")}>
      <UserRound size={20} aria-hidden />
      <span className="ac-header-label">{account.syncStatus === "session-expired" ? t("Me reconnecter", "Sign in again") : t("Se connecter", "Sign in")}</span>
    </button>
  );
  const profile = experience.profile?.userId === account.user.id ? experience.profile : null;
  const label =
    profile?.displayName ||
    account.user.email ||
    t("Mon compte", "My account");
  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ac-header-trigger ac-header-trigger--account"
          aria-label={t(`Compte : ${label}`, `Account: ${label}`)}
        >
          <AccountAvatar ownerId={account.user.id} label={label} avatarUrl={profile?.avatarUrl ?? null}/>
          <ChevronDown size={14} className="ac-account-chevron" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="ac-menu" align="end" sideOffset={8}>
        <div className="ac-menu-identity">
          <strong>{label}</strong>
          {label !== account.user.email && <span>{account.user.email}</span>}
        </div>
        <nav aria-label={t("Mon compte", "My account")}>
          <Link
            to={accountPath(lang, "settings")}
            onClick={() => setOpen(false)}
          >
            <Settings2 size={18} aria-hidden />
            {t("Paramètres", "Settings")}
          </Link>
          {profile?.canAccessBackoffice && (
            <Link to={`${prefix}/back-office`} onClick={() => setOpen(false)}>
              {t("Back-office", "Back office")}
            </Link>
          )}
          <button
            type="button"
            disabled={account.authBusy}
            onClick={() => {
              setOpen(false);
              experience.requestSignOut();
            }}
          >
            <LogOut size={18} aria-hidden />
            {t("Me déconnecter", "Sign out")}
          </button>
        </nav>
      </PopoverContent>
    </Popover>
  );
}
