import type { Meta, StoryObj } from "@storybook/react-vite";
import BackofficeRecords from "./BackofficeRecords";
import { records } from "./BackofficeRecords.fixtures";
const meta: Meta = { title: "Back-office/Liste de fiches", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
export const Filled: Story = { render: (_args, { globals: { lang } }) => <BackofficeRecords records={records} lang={lang === "en" ? "en" : "fr"} onEdit={() => {}} onLegacy={() => {}} /> };
export const Empty: Story = { render: (_args, { globals: { lang } }) => <BackofficeRecords records={[]} lang={lang === "en" ? "en" : "fr"} onEdit={() => {}} onLegacy={() => {}} /> };
