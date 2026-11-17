import type { Meta, StoryObj } from "@storybook/react-vite";
import Logo from "./Logo";

const meta: Meta<typeof Logo> = { title: "Atomes/Logo", component: Logo };
export default meta;
type Story = StoryObj<typeof Logo>;

const row = (tools: { name: string; slug?: string }[], size: 24 | 32 | 40 = 40): Story => ({
  render: () => <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{tools.map((tool) => <Logo key={tool.name} tool={tool} size={size} localOnly />)}</div>,
});

/** Self-hosted logos, wide marks and thin marks (n8n, Make, Airtable get a thinner margin). */
export const Files = row([{ name: "Notion", slug: "notion" }, { name: "Figma", slug: "figma" }, { name: "Canva", slug: "canva" }, { name: "n8n", slug: "n8n" }, { name: "Make", slug: "make" }, { name: "Airtable", slug: "airtable" }, { name: "Stripe", slug: "stripe" }]);
/** No file answers: the first letter, on the same tile. */
export const Initials = row([{ name: "Microsoft Dynamics 365 Finance and Operations" }, { name: "CallTrackingMetrics" }, { name: "Vercel", slug: "vercel" }]);
export const Sizes32 = row([{ name: "Notion", slug: "notion" }, { name: "Vercel", slug: "vercel" }], 32);
export const Sizes24 = row([{ name: "Notion", slug: "notion" }, { name: "Vercel", slug: "vercel" }], 24);
