import { Cloud } from "@/lib/icons";
import Button, { TextButton } from "@/ds/Button/Button";
import { Notice, NoticeText, StatusLine, StatusMark } from "@/ds/Notice/Notice";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import AccountStackStatus from "@/components/account/AccountStackStatus";
export default function StackAccountPanel({ empty = false, placement = "all" }: { empty?: boolean; placement?: "all" | "inline" | "notice" }) {
  const account = useStackAccount();
  const experience = useAccountExperience();
  const { t } = useLang();
  if (!account.enabled) return null;
  const needsAuth = !account.user || account.syncStatus === "session-expired";
  const healthyProgress = !needsAuth && ["unsaved", "syncing"].includes(account.syncStatus)
    && !account.pendingDraftChoice && !account.conflict && !account.error
    && !account.privacyWarning && !account.deletionConfirmed;
  if (healthyProgress) {
    if (placement === "notice") return null;
    const label = t("Enregistrement…", "Saving…");
    return empty
      ? <StatusLine icon={<Cloud />} live>{label}</StatusLine>
      : <StatusMark icon={<Cloud />} label={label} live />;
  }
  if (empty && !needsAuth && account.syncStatus === "synced" && !account.pendingDraftChoice && !account.conflict && !account.error && !account.privacyWarning && !account.deletionConfirmed) {
    return <StatusLine icon={<Cloud />}>{t("Vos ajouts seront enregistrés automatiquement.", "Your additions will be saved automatically.")}</StatusLine>;
  }
  if (!empty && !needsAuth && account.syncStatus === "synced" && !account.pendingDraftChoice && !account.conflict && !account.error && !account.privacyWarning && !account.deletionConfirmed) {
    if (placement === "notice") return null;
    return <StatusMark icon={<Cloud />} label={t("Stack enregistrée", "Stack saved")} live focusable />;
  }
  if (placement === "inline") return null;
  return (
    <Notice name="account" tone={needsAuth ? "tile" : "line"} icon={<Cloud />} label={t("Enregistrement de ma stack", "My stack saving")}
      title={needsAuth ? t("Retrouvez votre stack partout", "Take your stack everywhere") : t("Enregistrement de la stack", "Stack saving")}
      actions={needsAuth ? <>
        <Button variant={account.syncStatus === "session-expired" ? "primary" : "secondary"}
          onClick={() => experience.openAuth(account.syncStatus === "session-expired" ? "signin" : "signup")}>
          {account.syncStatus === "session-expired"
            ? t("Me reconnecter", "Sign in again")
            : empty ? t("Créer un compte gratuit", "Create a free account") : t("Enregistrer ma stack", "Save my stack")}
        </Button>
        {account.syncStatus !== "session-expired" && <TextButton tone="quiet" onClick={() => experience.openAuth("signin")}>{t("J’ai déjà un compte", "I already have an account")}</TextButton>}
      </> : undefined}>
      {needsAuth && <NoticeText>
        {account.syncStatus === "session-expired"
          ? t("Votre session a expiré. Reconnectez-vous pour enregistrer vos modifications.", "Your session expired. Sign in again to save your changes.")
          : t(
              empty ? "Un compte vous permettra d’enregistrer votre sélection et de la retrouver sur vos autres appareils." : "Créez un compte gratuit pour enregistrer vos outils et retrouver votre stack sur tous vos appareils.",
              empty ? "An account lets you save your selection and access it across your devices." : "Create a free account to save your tools and access your stack across your devices.",
            )}
      </NoticeText>}
      <AccountStackStatus key={account.user?.id ?? "visitor"} />
    </Notice>
  );
}
