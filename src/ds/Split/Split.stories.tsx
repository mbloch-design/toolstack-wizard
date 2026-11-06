import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import Split from "./Split";
import { splitStates } from "./Split.fixtures";

// The card as the board shows it: the wide column on desktop, full width on a phone.
const meta: Meta<typeof Split> = {
  title: "Ma stack/Répartition",
  component: Split,
  tags: ["a-valider"],
  decorators: [(Story) => <div style={{ maxWidth: 720 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof Split>;
const state = (name: keyof typeof splitStates): Story => ({ render: (_args, context) => <Split {...splitStates[name](context.globals.lang)} localLogosOnly /> });

export const OneTool = state("oneTool");
export const ThreeAreas = state("threeAreas");
export const TwelveTools = state("twelveTools");
export const SevenAreas = state("sevenAreas");
export const TinyArea = state("tinyArea");
export const WithReview = state("withReview");
export const Unpriced = state("unpriced");
export const Converted = state("converted");
export const Dollars = state("dollars");
/** A second area opened from the list: its tools show, its segment stands out, the ring's heart follows it. */
export const OtherAreaOpen: Story = {
  ...state("twelveTools"),
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByRole("button", { expanded: false });
    await userEvent.click(rows[0]);
  },
};
