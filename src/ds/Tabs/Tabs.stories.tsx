import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import Tabs from "./Tabs";

const meta: Meta<typeof Tabs> = { title: "Molécules/Onglets", component: Tabs, tags: ["a-valider"], decorators: [(Story) => <div style={{ maxWidth: 720 }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Tabs>;

const MARK = (color: string) => <span style={{ display: "inline-block", width: 20, height: 20, borderRadius: 6, background: color }} />;

/** « Où utilisez-vous l'IA ? »: three assistants, then « Outil de code ▾ »; the remembered choice (ChatGPT) opens on its own. */
function Demo({ start, lang }: { start: string; lang: "fr" | "en" }) {
  const [value, setValue] = useState(start);
  const fr = lang !== "en";
  return <>
    <Tabs label={fr ? "Où utilisez-vous l'IA ?" : "Where do you use AI?"} value={value} onChange={setValue} panelId="story-panel"
      tabs={[{ value: "claude", label: "Claude", icon: MARK("#D97757") }, { value: "chatgpt", label: "ChatGPT", icon: MARK("#10A37F") }, { value: "gemini", label: "Gemini", icon: MARK("#8E75F0") }]}
      more={{ label: fr ? "Outil de code" : "Coding tool", short: "Code", menuLabel: fr ? "Outil de code" : "Coding tool", closeLabel: fr ? "Fermer" : "Close",
        options: [{ value: "claude-code", label: "Claude Code" }, { value: "cursor", label: "Cursor" }, { value: "vs-code", label: "VS Code" }, { value: "any", label: fr ? "Adresse du serveur (autre outil)" : "Server address (another tool)" }] }} />
    <div id="story-panel" role="tabpanel" style={{ paddingTop: 24 }}>{fr ? "Étapes pour " : "Steps for "}<strong data-chosen="">{value}</strong></div>
  </>;
}

export const Assistants: Story = {
  render: (_args, { globals }) => <Demo start="chatgpt" lang={globals.lang} />,
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    // The remembered tab is open on its own, and it is the one in the tab order.
    await expect(canvas.getByRole("tab", { name: /ChatGPT/ })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tab", { name: /ChatGPT/ })).toHaveAttribute("tabindex", "0");
    // Arrow keys move and choose; End reaches the menu tab without opening it.
    canvas.getByRole("tab", { name: /ChatGPT/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("tab", { name: /Gemini/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Home}");
    await expect(canvas.getByRole("tab", { name: /Claude/ })).toHaveAttribute("aria-selected", "true");
    // A coding tool through the menu: the tab then carries its name.
    await userEvent.click(canvas.getByRole("tab", { name: fr ? /Outil de code/ : /Coding tool/ }));
    await userEvent.click(within(document.body).getByRole("menuitemradio", { name: "Cursor" }));
    await waitFor(() => expect(document.body.style.pointerEvents).not.toBe("none"));
    await expect(canvas.getByRole("tab", { name: /Cursor/ })).toHaveAttribute("aria-selected", "true");
    await expect(canvasElement.querySelector("[data-chosen]")!.textContent).toBe("cursor");
  },
};
