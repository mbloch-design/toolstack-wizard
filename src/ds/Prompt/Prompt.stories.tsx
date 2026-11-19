import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import Prompt from "./Prompt";

// A request to the assistant with its copy button: on the sheet (steps, request cards), the hub and the gateway.
const meta: Meta<typeof Prompt> = {
  title: "Molécules/Demande",
  component: Prompt,
  tags: ["a-valider"],
  decorators: [(Story) => <div style={{ maxWidth: 480 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Prompt>;

const REQUEST = "Résume mes notes de réunion de cette semaine et liste les actions à faire.";

/** Click: the clipboard holds the request alone, without guillemets, and « Copié » shows. */
export const Copier: Story = {
  render: (_args, { globals }) => <Prompt text={REQUEST} lang={globals.lang} />,
  beforeEach: () => {
    const writeText = fn(async (_value: string) => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    (globalThis as { __writeText?: typeof writeText }).__writeText = writeText;
  },
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    await userEvent.click(canvas.getByRole("button", { name: fr ? "Copier la demande" : "Copy the request" }));
    const writeText = (globalThis as { __writeText?: ReturnType<typeof fn> }).__writeText!;
    await expect(writeText).toHaveBeenCalledWith(REQUEST);
    await waitFor(() => expect(canvas.getByRole("button", { name: fr ? "Copié" : "Copied" })).toBeVisible());
  },
};
export const Grande: Story = { render: (_args, { globals }) => <Prompt text={REQUEST} lang={globals.lang} size="lead" /> };

