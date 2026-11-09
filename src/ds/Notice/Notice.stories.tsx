import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cloud } from "@/lib/icons";
import Button, { TextButton } from "../Button/Button";
import Logo from "../Logo/Logo";
import PageLoading from "../PageLoading/PageLoading";
import WelcomeToast from "../Toast/Toast";
import { Notice, NoticeRows, NoticeText, StatusLine, StatusMark } from "./Notice";

const meta: Meta = { title: "Ma stack/États", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

/** Where the stack is saved: a visitor is invited, an account is quietly confirmed. */
export const Saving: Story = {
  render: (_a, { globals: { lang } }) => <div style={{ display: "grid", gap: 24, maxWidth: 900 }}>
    <Notice name="account" icon={<Cloud />} title={t(lang, "Retrouvez votre stack partout", "Take your stack everywhere")}
      actions={<><Button>{t(lang, "Enregistrer ma stack", "Save my stack")}</Button><TextButton tone="quiet">{t(lang, "J’ai déjà un compte", "I already have an account")}</TextButton></>}>
      <NoticeText>{t(lang, "Créez un compte gratuit pour enregistrer vos outils et retrouver votre stack sur tous vos appareils.", "Create a free account to save your tools and access your stack across your devices.")}</NoticeText>
    </Notice>
    <Notice name="account" tone="line" icon={<Cloud />} title={t(lang, "Enregistrement de la stack", "Stack saving")}><NoticeText>{t(lang, "Enregistrée il y a un instant.", "Saved a moment ago.")}</NoticeText></Notice>
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <StatusMark icon={<Cloud />} label={t(lang, "Stack enregistrée", "Stack saved")} focusable />
      <StatusLine icon={<Cloud />}>{t(lang, "Vos ajouts seront enregistrés automatiquement.", "Your additions will be saved automatically.")}</StatusLine>
    </div>
  </div>,
};

/** What the page says about itself: a browser that cannot save, tools that left the catalogue. */
export const Problems: Story = {
  render: (_a, { globals: { lang } }) => <div style={{ display: "grid", gap: 24, maxWidth: 900 }}>
    <Notice name="storage" role="status"><NoticeText>{t(lang, "Le navigateur ne permet pas l’enregistrement local. Votre stack reste disponible pour cette session.", "Your browser cannot save locally. Your stack remains available for this session.")}</NoticeText></Notice>
    <Notice name="unavailable" title={t(lang, "Outils indisponibles", "Unavailable tools")}>
      <NoticeText>{t(lang, "Ces références ne sont plus disponibles dans le catalogue actuel. Votre sélection est conservée.", "These references are unavailable in the current catalogue. Your selection is retained.")}</NoticeText>
      <NoticeRows rows={["old-crm", "a-very-long-tool-slug-that-no-longer-exists-in-the-catalogue"].map((slug) => ({ id: slug, label: slug, action: <TextButton tone="danger">{t(lang, "Retirer de ma stack", "Remove from stack")}</TextButton> }))} />
    </Notice>
  </div>,
};

/** Finding the stack: the title, a breathing mark, one line, a neutral outline. */
export const Loading: Story = {
  render: (_a, { globals: { lang } }) => <PageLoading title={t(lang, "Ma stack", "My stack")} mark={<Logo tool={{ name: "ToolTrim" }} size={40} localOnly />}
    message={t(lang, "On retrouve vos outils…", "Finding your tools…")} note={t(lang, "Votre espace se prépare.", "Making room for your stack.")} />,
};

/** The welcome after the onboarding. */
export const Welcome: Story = {
  render: (_a, { globals: { lang } }) => <WelcomeToast title={t(lang, "Bienvenue chez vous.", "Welcome home.")} detail={t(lang, "3 outils rangés, 2 petites décisions.", "3 tools in place, 2 small decisions.")}
    logos={["notion", "figma", "canva"].map((slug) => <Logo key={slug} tool={{ name: slug, slug }} size={24} localOnly />)} />,
};
