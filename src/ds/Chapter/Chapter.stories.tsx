import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import Chapter, { Chapters } from "./Chapter";

// A long page's chapters (step 1 bis of the agents section): title 42 (21 on a phone), standfirst 21 (17 on a phone),
// content on the reading column or the wide grid, all on the white sheet; footnotes in the notes variant.
const meta: Meta<typeof Chapter> = {
  title: "Molécules/Chapitre",
  component: Chapter,
  // No reference until Michael validates the agents section.
  tags: ["a-valider"],
};
export default meta;
type Story = StoryObj<typeof Chapter>;

export const Bandes: Story = {
  render: (_args, { globals }) => {
    const fr = globals.lang !== "en";
    return (
      <Chapters>
        <Chapter chapter="one" title={fr ? "Brancher Notion" : "Plug in Notion"} lead={fr ? "Choisissez votre assistant : les étapes s'adaptent." : "Pick your assistant: the steps follow."}>
          <p>{fr ? "Le contenu d'un chapitre, sur la colonne de lecture." : "A chapter's content, on the reading column."}</p>
        </Chapter>
        <Chapter chapter="two" width="wide" title={fr ? "Ce qu'il peut faire" : "What it can do"} lead={fr ? "L'assistant n'a jamais plus de droits que votre compte." : "The assistant never has more rights than your account."}>
          <p>{fr ? "Le rythme vient de l'échelle, des écarts et des objets, jamais d'un fond gris." : "The rhythm comes from the scale, the gaps and the objects, never a grey background."}</p>
        </Chapter>
        <Chapter chapter="notes" tone="notes">
          <p>{fr ? "Des notes de bas de page, sans titre." : "Footnotes, untitled."}</p>
        </Chapter>
      </Chapters>
    );
  },
  play: async ({ canvasElement }) => {
    const bands = [...canvasElement.querySelectorAll<HTMLElement>("[data-chapter]")];
    await expect(bands.map((band) => band.dataset.tone)).toEqual(["white", "white", "notes"]);
    // The grey of the navigation is never a chapter's background (17/11).
    for (const band of bands) await expect(getComputedStyle(band).backgroundColor).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    await expect(canvasElement.querySelectorAll("h2").length).toBe(2);
  },
};
