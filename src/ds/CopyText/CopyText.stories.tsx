import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import CopyText from "./CopyText";

// A technical name that copies itself: action identifiers, slugs, addresses.
const meta: Meta<typeof CopyText> = { title: "Molécules/Texte copiable", component: CopyText, tags: ["a-valider"] };
export default meta;
type Story = StoryObj<typeof CopyText>;

/** Click: the clipboard holds exactly the value, the icon turns to a check and « Copié » is said. */
export const Copier: Story = {
  render: (_args, { globals }) => <p>Mettre des pages à la corbeille <CopyText value="notion-delete-pages" lang={globals.lang} /></p>,
  beforeEach: () => {
    const writeText = fn(async (_value: string) => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    (globalThis as { __writeText?: typeof writeText }).__writeText = writeText;
  },
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    const button = canvas.getByRole("button", { name: fr ? "Copier notion-delete-pages" : "Copy notion-delete-pages" });
    await userEvent.click(button);
    const writeText = (globalThis as { __writeText?: ReturnType<typeof fn> }).__writeText!;
    await expect(writeText).toHaveBeenCalledWith("notion-delete-pages");
    await waitFor(() => expect(canvas.getByText(fr ? "Copié" : "Copied")).toBeInTheDocument());
    await expect(button).toHaveAttribute("data-copied");
  },
};
