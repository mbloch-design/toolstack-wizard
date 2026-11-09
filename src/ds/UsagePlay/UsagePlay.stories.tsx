import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { formatAmount } from "@/lib/currencyRates";
import UsagePlay, { type UsageRow } from "./UsagePlay";

const meta: Meta = { title: "Ma stack/Vos usages", tags: ["a-valider"], decorators: [(Story) => <div style={{ maxWidth: 460 }}><Story /></div>] };
export default meta;
type Story = StoryObj;

type Seed = [name: string, slug: string | undefined, cost: number, usage?: number];

/** A playable game: answers are kept in state, as the page keeps them in the store. */
function Game({ lang, seeds, freeOnly }: { lang: "fr" | "en"; seeds: Seed[]; freeOnly?: boolean }) {
  const [usage, setUsage] = useState<(number | undefined)[]>(seeds.map((seed) => seed[3]));
  const rows: UsageRow[] = seeds.map(([name, slug, cost], index) => ({
    tool: { id: slug ?? name, name, slug }, cost, usage: usage[index],
    setUsage: (value) => setUsage((current) => current.map((old, i) => (i === index ? value ?? undefined : old))),
  }));
  return <UsagePlay rows={rows} lang={lang} format={(n) => formatAmount(n, "EUR", lang)} freeOnly={freeOnly} onReviewTools={() => {}} localLogosOnly />;
}
const game = (seeds: Seed[], freeOnly = false): Story => ({ render: (_args, { globals: { lang } }) => <Game lang={lang} seeds={seeds} freeOnly={freeOnly} /> });

const answered = (seeds: Seed[], answers: (number | undefined)[]): Seed[] => seeds.map(([name, slug, cost], index) => [name, slug, cost, answers[index]]);
const FIVE: Seed[] = [["Notion", "notion", 36], ["Airtable", "airtable", 24], ["ChatGPT", "chatgpt", 20], ["Figma", "figma", 15], ["Loom", "loom", 15]];

export const NewGame = game(FIVE);
export const MidGame = game(answered(FIVE, [5, 3, 1]));
export const LongName = game([["Microsoft Dynamics 365 Finance and Operations", undefined, 1100], ["CallTrackingMetrics", undefined, 79]]);
export const DoneWithDust = game(answered(FIVE, [5, 1, 5, 3, 1]));
export const DoneAllUsed = game(answered(FIVE, [5, 5, 5, 5, 5]));
export const NoPaidTool = game([], true);

/** The narrow card the board gives the game on some desktops (about 280 px of content). */
export const NarrowCard: Story = { ...game(FIVE), decorators: [(Story) => <div style={{ maxWidth: 320 }}><Story /></div>] };
