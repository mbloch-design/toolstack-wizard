import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { McpSheetView, SkillSheetView } from "./AgentSheet";
import { sheetStates, skillStates } from "./AgentSheet.fixtures";

// The sheet as /mcp/:slug and /skills/:slug show it, in the reading column.
const meta: Meta<typeof McpSheetView> = {
  title: "Agents/Fiche",
  component: McpSheetView,
  decorators: [(Story) => <div style={{ maxWidth: 880 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof McpSheetView>;
const server = (name: keyof typeof sheetStates): Story => ({ render: (_args, context) => <McpSheetView sheet={sheetStates[name]} lang={context.globals.lang} /> });

/** Every kind but paying, riskiest first; the tool list folds out. */
export const Notion: Story = {
  ...server("notion"),
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByText(fr ? "Supprimer" : "Delete")).toBeVisible();
    const toggle = canvas.getByRole("button", { name: fr ? /voir la liste/i : /show the list/i });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(canvas.getByText("notion-delete-pages")).toBeVisible());
  },
};
export const FigmaRemote = server("figma");
export const FigmaDesktop = server("figmaDesktop");
/** Paying comes first, with its confirmation. */
export const StripePays: Story = {
  ...server("stripe"),
  play: async ({ canvas, globals }) => {
    await expect(canvas.getAllByText(globals.lang === "en" ? "Pay" : "Payer")[0]).toBeVisible();
  },
};
/** No tool list published: the sheet says so instead of showing an empty list. */
export const AhrefsNoToolList = server("ahrefs");
export const SkillFigmaUse: Story = { render: (_args, context) => <SkillSheetView skill={skillStates.figmaUse} lang={context.globals.lang} /> };
export const SkillNothingToInstall: Story = { render: (_args, context) => <SkillSheetView skill={skillStates.notionSkills} lang={context.globals.lang} /> };
