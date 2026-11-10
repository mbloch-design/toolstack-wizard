import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "../Button/Button";
import { Notice, NoticeText } from "../Notice/Notice";
import BackofficePageHeading from "./BackofficePageHeading";

const meta: Meta = { title: "Back-office/En-tête de page", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
export const WithoutAction: Story = { render: (_args, { globals: { lang } }) => <BackofficePageHeading title={lang === "en" ? "Activity" : "Activité"} description={lang === "en" ? "Available site data." : "Les données disponibles du site."} /> };
export const WithAction: Story = { render: (_args, { globals: { lang } }) => <BackofficePageHeading title={lang === "en" ? "Records" : "Fiches"} description={lang === "en" ? "Manage catalogue records." : "Gérer les fiches du catalogue."} action={<Button variant="primary">{lang === "en" ? "Publish" : "Mettre en ligne"}</Button>} /> };
export const LongTitle: Story = { render: (_args, { globals: { lang } }) => <BackofficePageHeading title={lang === "en" ? "A particularly long administrative page title" : "Un titre de page administrative particulièrement long"} action={<Button>{lang === "en" ? "Refresh" : "Actualiser"}</Button>} /> };
export const ListStates: Story = { render: (_args, { globals: { lang } }) => <><BackofficePageHeading title={lang === "en" ? "Users" : "Utilisateurs"} /><Notice name="users" title={lang === "en" ? "Registered accounts" : "Comptes enregistrés"}><NoticeText>alex@example.com</NoticeText></Notice><Notice name="empty" title={lang === "en" ? "No accounts found" : "Aucun compte trouvé"}><NoticeText>{lang === "en" ? "Try another search." : "Essayez une autre recherche."}</NoticeText></Notice></> };
