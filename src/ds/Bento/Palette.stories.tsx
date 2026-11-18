import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Copy, PiggyBank, Wallet } from "@/lib/icons";
import Bento, { BentoRow, Tile, type Palette } from "./Bento";
import { FigureCard, FigureCards } from "../Catalog/Catalog";
import { Checkpoints } from "../StackBoard/StackBoard";
import { Key } from "../Narrative/Narrative";

// Ma stack's palette (trial, 18/11/2026; Michael: « on oublie les effets lourds »): flat colours and their inks, no
// glass, no light, no grain. Each tile is the colour Ma stack gives it; the contrast invariant reads every word at AA.
const meta: Meta = { title: "Ma stack/Palette (essai)", tags: ["a-valider"], decorators: [(Story) => <div style={{ maxWidth: 1180 }}><Story /></div>] };
export default meta;
type Story = StoryObj;

const link = (className: string, content: React.ReactNode) => <a className={className} href="#">{content}</a>;

export const Tuiles: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 32 }}>
      <FigureCards label="Ma stack en chiffres">
        <FigureCard palette="butter" icon={<Wallet />} figure="84 €" unit="/mois" name="Dépense" detail="2 prix à préciser" renderLink={link} />
        <FigureCard palette="sky" figure="9" name="Outils" renderLink={link} />
        <FigureCard palette="coral" icon={<Copy />} tone="overlap" figure="4" name="Doublons" detail="Notion et Milanote se marchent dessus" renderLink={link} />
        <FigureCard palette="mint" icon={<PiggyBank />} tone="gain" figure="−12 €" unit="/mois" name="Économisé" detail="La tirelire se remplit" renderLink={link} />
      </FigureCards>
      <Bento compact label="Ma stack en bref">
        <BentoRow>
          <Tile span={7} palette="bone" label="Vos métiers" statement={<><Key>4</Key> sur 5</>} status={{ text: "Pas de site. Votre portfolio vit sur Instagram, c'est ça ?" }} />
          <Tile span={5} palette="night" label="À faire · ça prend forme" statement={<><Key tone="overlap">2</Key> étapes</>}
            footer={<Checkpoints progressLabel="1 étape sur 3 réglée" label="Étapes" steps={[
              { id: "a", name: "Doublons", note: "Notion ou Milanote ?", done: false, icon: <Copy /> },
              { id: "b", name: "Prix", note: "9 à préciser", done: false, icon: <Wallet /> },
              { id: "c", name: "Facturer", note: "Couvert", done: true, icon: <PiggyBank /> },
            ]} />} />
        </BentoRow>
        <BentoRow>
          <Tile span={12} palette="pink-soft" label="Votre assistant IA" statement={<><Key>1</Key> sur 2</>} status={{ text: "1 de vos 2 outils se branche à Claude ; nous n'avons pas encore regardé Asana." }} />
        </BentoRow>
        <BentoRow>
          {(["blue", "mint-soft"] as Palette[]).map((palette) => <Tile key={palette} span={6} palette={palette} label={palette} statement={<><Key>3</Key> outils</>} status={{ text: "Une phrase sur la tuile, au corps du texte." }} />)}
        </BentoRow>
        <BentoRow>
          {(["sky-soft", "plain"] as Palette[]).map((palette) => <Tile key={palette} span={6} palette={palette} label={palette} statement={<><Key>3</Key> outils</>} status={{ text: "Une phrase sur la tuile, au corps du texte." }} />)}
        </BentoRow>
      </Bento>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Flat: no glass matter in any tile of the palette.
    for (const tile of canvasElement.querySelectorAll<HTMLElement>("[data-palette]")) await expect(tile.querySelector("[class*=matter]")).toBeNull();
    await expect(canvasElement.querySelectorAll("[data-palette]").length).toBe(11);
  },
};
