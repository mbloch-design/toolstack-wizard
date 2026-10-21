import { useState } from "react";
import { Link } from "react-router-dom";
import { UserRound, Settings2, LogOut, Bookmark } from "@/lib/icons";
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
  if (!account.user || account.syncStatus === "session-expired")
    return (
      <button
        type="button"
        className="ac-header-trigger"
        onClick={() => experience.openAuth("signin")}
        aria-label={t("Se connecter", "Sign in")}
      >
        <UserRound size={20} aria-hidden />
        <span className="ac-header-label">{t("Se connecter", "Sign in")}</span>
      </button>
    );
  const label =
    experience.profile?.displayName ||
    account.user.email ||
    t("Mon compte", "My account");
  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ac-header-trigger"
          aria-label={t(`Compte : ${label}`, `Account: ${label}`)}
        >
          <span className="ac-avatar" aria-hidden>
            {label.charAt(0).toUpperCase()}
          </span>
          <span className="ac-header-label ac-header-name">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="ac-menu" align="end" sideOffset={8}>
        <div className="ac-menu-identity">
          <strong>{label}</strong>
          {label !== account.user.email && <span>{account.user.email}</span>}
        </div>
        <nav aria-label={t("Mon compte", "My account")}>
          <Link to={`${prefix}/ma-stack`} onClick={() => setOpen(false)}>
            <Bookmark size={18} aria-hidden />
            {t("Ma stack", "My stack")}
          </Link>
          <Link
            to={accountPath(lang, "settings")}
            onClick={() => setOpen(false)}
          >
            <Settings2 size={18} aria-hidden />
            {t("Paramètres", "Settings")}
          </Link>
          {experience.profile?.canAccessBackoffice && (
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
