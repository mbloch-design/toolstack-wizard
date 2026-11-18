import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Check, X } from "@/lib/icons";
import ToneCard, { ToneCards } from "./ToneCard";

// « Notre avis » as two verdict cards: gain and caution tints of the system, never the navigation's grey.
const meta: Meta<typeof ToneCard> = { title: "Molécules/Carte teintée", component: ToneCard, tags: ["a-valider"] };
export default meta;
type Story = StoryObj<typeof ToneCard>;

export const Avis: Story = {
  render: (_args, { globals }) => {
    const fr = globals.lang !== "en";
    return (
      <ToneCards>
        <ToneCard tone="gain" icon={<Check />} title={fr ? "Utile si" : "Useful if"}>{fr ? "Vous rangez déjà vos notes, vos clients ou vos projets dans Notion et vous perdez du temps à les retrouver." : "You already keep your notes, clients or projects in Notion and lose time finding them again."}</ToneCard>
        <ToneCard tone="caution" icon={<X />} title={fr ? "Moins utile si" : "Less useful if"}>{fr ? "Vous êtes invité dans l'espace d'un client : les invités ne peuvent pas se connecter." : "You are a guest in a client's workspace: guests cannot connect."}</ToneCard>
      </ToneCards>
    );
  },
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>("[data-tone]")];
    await expect(cards.map((card) => card.dataset.tone)).toEqual(["gain", "caution"]);
  },
};
