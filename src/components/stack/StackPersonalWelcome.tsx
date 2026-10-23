import type { ReactNode } from "react";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import { useLang } from "@/hooks/useLang";

/** Only the current account's chosen name is used; never derive a name from email. */
export default function StackPersonalWelcome({ empty, pending = 0, children }: { empty: boolean; pending?: number; children?: ReactNode }) {
  const { user, syncStatus } = useStackAccount();
  const { profile } = useAccountExperience();
  const { t } = useLang();
  if (!user || syncStatus === "session-expired") return <>{children}</>;
  const name = profile?.userId === user.id ? profile.displayName : null;
  return <div className="ms-personal-welcome">
    <p className="ms-personal-greeting">{name ? t(`Bonjour, ${name}`, `Hi, ${name}`) : t("Bonjour", "Hello")} <span aria-hidden="true">👋</span></p>
    {children}
    <p className="ms-personal-message">{empty
      ? t("Bienvenue chez vous. Commençons par un outil que vous aimez utiliser.", "Make yourself at home. Start with a tool you enjoy using.")
      : pending > 0
        ? t("On fait le point, un choix à la fois. Pas besoin de tout régler aujourd’hui.", "One choice at a time. No need to sort everything out today.")
        : t("Vos outils, vos choix. Gardons ce qui vous simplifie vraiment la vie.", "Your tools, your choices. Keep what makes your day easier.")}</p>
  </div>;
}
