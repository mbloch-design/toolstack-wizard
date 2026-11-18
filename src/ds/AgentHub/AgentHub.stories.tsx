import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { CatalogSection } from "../Catalog/Catalog";
import { ToolRow, ToolRows } from "../ToolSheet/ToolSheet";
import { cardLine, say, skillFoot, type SkillCard } from "@/lib/agents";
import { agentShelves } from "@/lib/agentShelves";
import { GRAVITY, hasVerdict, recipesFor, reportRows, serverFoot, stackHeadline } from "@/lib/agentReport";
import { Notice } from "../Notice/Notice";
import { linkClass } from "../Button/Button";
import skillsIndex from "@/data/agents/skills_index.json";
import { AgentRowNote, RecipeCards } from "./AgentHub";
import { STACK, cards, logo, toolName } from "./AgentHub.fixtures";

// The agents section on the catalogue's pieces (step 8, 18/11/2026): servers and skills are the catalogue's rows
// (ToolRow) with one line of meta; the recipes are the section's own cards.
const meta: Meta<typeof RecipeCards> = {
  title: "Agents/Hub",
  component: RecipeCards,
  tags: ["a-valider"],
  decorators: [(Story) => <div style={{ maxWidth: 1080 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RecipeCards>;

const SKILLS = skillsIndex as SkillCard[];
const status = (card: (typeof cards)[number]) => serverFoot(card, "claude", "fr")[0].kind as "one_click" | "configure" | "elsewhere";

/** The hub's shelves: the card sentence, then one line of meta (status, and a consequence only when grave). */
export const Rayons: Story = {
  render: (_args, { globals }) => <div style={{ display: "grid", gap: 48 }}>
    {agentShelves(cards, globals.lang).map((shelf) => (
      <CatalogSection key={shelf.id} id={`story-shelf-${shelf.id}`} title={shelf.title} count={shelf.cards.length}>
        <ToolRows>
          {shelf.cards.map((card) => {
            const worst = GRAVITY.find((kind) => card.kinds.includes(kind));
            return <ToolRow key={card.slug} logo={logo(card.host_tool, 40)} name={toolName(card.host_tool)}
              note={<AgentRowNote lang={globals.lang} status={status(card)} summary={card.card ? say(globals.lang, card.card) : cardLine(say(globals.lang, card.summary))} {...(worst ? { gravest: worst } : {})} />}
              renderMain={(className, content) => <a className={className} href={`/fr/mcp/${card.slug}`}>{content}</a>} />;
          })}
        </ToolRows>
      </CatalogSection>
    ))}
  </div>,
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvasElement.querySelectorAll("[data-status]").length).toBe(cards.length);
    await expect(canvas.queryByText(fr ? /Officiel/ : /Official/)).toBeNull();
    await expect(canvas.getAllByText(fr ? "Engage un paiement" : "Makes a payment").length).toBe(1);
    await expect(canvas.queryByText(fr ? "Lecture seule" : "Read only")).toBeNull();
    await expect(canvas.queryByText(fr ? "Modifie vos données" : "Edits your data")).toBeNull();
  },
};

/** /skills and the skill sheet: the same rows, the meta says where the know-how works. */
export const SavoirFaire: Story = {
  render: (_args, { globals }) => (
    <ToolRows>
      {SKILLS.filter((skill) => ["notion", "figma"].includes(skill.host_tool)).slice(0, 6).map((skill) => (
        <ToolRow key={skill.slug} logo={logo(skill.host_tool, 40)} name={skill.name}
          note={<AgentRowNote lang={globals.lang} summary={cardLine(say(globals.lang, skill.summary))} meta={skillFoot(skill, globals.lang)[0]} />}
          renderMain={(className, content) => <a className={className} href={`/fr/skills/${skill.slug}`}>{content}</a>} />
      ))}
    </ToolRows>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-meta]").length).toBe(6);
  },
};

/** Recipes for the nine-tool stack with Claude. */
export const Recettes: Story = {
  render: (_args, { globals }) => (
    <RecipeCards lang={globals.lang} items={recipesFor(STACK, "claude").map((recipe) => ({
      id: recipe.id, request: globals.lang === "en" ? recipe.request.en : recipe.request.fr,
      sides: recipe.sides.map((side) => ({ name: toolName(side.host_tool), logo: logo(side.host_tool), ...(side.gravest ? { gravest: side.gravest } : {}) })),
    }))} />
  ),
  play: async ({ canvas, canvasElement, globals }) => {
    await expect(canvasElement.querySelectorAll("[data-recipe]").length).toBe(3);
    await expect(canvas.getAllByRole("button", { name: globals.lang !== "en" ? "Copier la demande" : "Copy the request" }).length).toBe(3);
  },
};

const STACKS: Record<string, string[]> = { none: ["google-sheets", "asana"], mix: ["notion", "asana"], all: ["notion", "stripe", "figma"] };
const NAMES: Record<string, string> = { "google-sheets": "Google Sheets", asana: "Asana", notion: "Notion", stripe: "Stripe", figma: "Figma" };

/**
 * The hub's line on your stack (step 8d), in plain words: none of its tools looked at yet (named, « Nous le
 * signaler »), a mix (the verdict, the one not looked at named, « Voir le bilan »), all looked at.
 */
export const LigneDeStack: Story = {
  render: (_args, { globals }) => {
    const fr = globals.lang !== "en";
    return <div style={{ display: "grid", gap: 24 }}>
      {Object.entries(STACKS).map(([id, slugs]) => {
        const rows = reportRows(slugs, "claude");
        return <div key={id} data-stack={id}><Notice tone="line" title={stackHeadline(rows, "claude", globals.lang, (slug) => NAMES[slug] ?? slug)}
          actions={<a className={linkClass()} href="#">{hasVerdict(rows) ? (fr ? "Voir le bilan" : "See the report") : (fr ? "Nous le signaler" : "Tell us")}</a>} /></div>;
      })}
    </div>;
  },
  play: async ({ canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    const line = (id: string) => canvasElement.querySelector<HTMLElement>(`[data-stack=${id}]`)!.textContent!.replace(/\u00a0/g, " ");
    await expect(line("none")).toContain(fr ? "Nous n'avons pas encore vérifié si Google Sheets et Asana se branchent à Claude" : "We have not checked yet whether Google Sheets and Asana plug into Claude");
    await expect(line("none")).toContain(fr ? "Nous le signaler" : "Tell us");
    await expect(line("mix")).toContain(fr ? "1 de vos 2 outils se branche à Claude ; nous n'avons pas encore regardé Asana" : "1 of your 2 tools plugs into Claude; we have not looked at Asana yet");
    await expect(line("mix")).toContain(fr ? "Voir le bilan" : "See the report");
    await expect(line("all")).not.toMatch(fr ? /regardé|vérifié/ : /looked at|checked/);
  },
};
