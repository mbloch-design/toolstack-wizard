import type { Meta, StoryObj } from "@storybook/react";
import { BackofficeNavigation } from "./BackofficeNavigation";

const meta: Meta<typeof BackofficeNavigation> = { title: "Back-office/Navigation", component: BackofficeNavigation, tags: ["a-valider"] };
export default meta;
type Story = StoryObj<typeof meta>;
export const DesktopSources: Story = { args: { lang: "en", section: "sources", onNavigate: async () => true, homeHref: "/en" } };
export const MobileSources: Story = { args: { lang: "en", section: "sources", onNavigate: async () => true, homeHref: "/en" }, parameters: { viewport: { defaultViewport: "mobile1" } } };
