import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import { useLang } from "@/hooks/useLang";

/** Only the current account's chosen name is used; never derive a name from email. */
export default function StackPersonalWelcome({ empty, pending = 0 }: { empty: boolean; pending?: number }) {
  const { user, syncStatus } = useStackAccount();
  const { profile } = useAccountExperience();
  const { t } = useLang();
  if (!user || syncStatus === "session-expired") return null;
  const name = profile?.userId === user.id ? profile.displayName : null;
  return <div className="ms-personal-welcome">
    <p className="ms-personal-greeting">{name ? t(`Bonjour, ${name}`, `Hi, ${name}`) : t("Bonjour", "Hello")} <span aria-hidden="true">👋</span></p>
    <p className="ms-personal-message">{empty
      ? t("Bienvenue chez vous. Commençons par un outil que vous aimez utiliser.", "Make yourself at home. Start with a tool you enjoy using.")
      : pending > 0
        ? t("Retrouvons ce qui vous sert vraiment. Quelques choix restent à préciser.", "Let's find what works for you. A few choices still need your input.")
        : t("Vos outils sont réunis. À vous de faire évoluer votre stack, à votre rythme.", "Your tools are all here. Shape your stack at your own pace.")}</p>
  </div>;
}
