import type { Meta, StoryObj } from "@storybook/react-vite";
import Budget from "./Budget";
import { budgetStates } from "./Budget.fixtures";

// The card as the page shows it: one tile, the width of a board column on desktop, full width on a phone.
const meta: Meta<typeof Budget> = {
  title: "Ma stack/Budget",
  component: Budget,
  decorators: [(Story) => <div style={{ maxWidth: 520 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof Budget>;
const state = (name: keyof typeof budgetStates): Story => ({ render: (_args, context) => <Budget {...budgetStates[name](context.globals.lang)} onConfirmNext={() => {}} onStart={() => {}} localLogosOnly /> });

export const OneTool = state("one");
export const ThreeTools = state("three");
export const TwelveTools = state("twelve");
export const LongNames = state("longNames");
export const Partial = state("partial");
export const NothingKnown = state("nothingKnown");
export const Converted = state("converted");
export const Dollars = state("dollars");
export const BigAmounts = state("bigAmounts");
// The saving stays on the card (validated by Michael on 06/11/2026).
export const WithSaving = state("withSaving");
