import { NEED_UNIVERSES } from "@/data/needUniverses";
import type { Lang, McpCard } from "@/lib/agents";

/*
 * The full list of servers in a few families (step 4, 17/11/2026): the catalogue's need universes (Explorer), not its
 * fine categories, which left a shelf per one or two servers. A category belongs to the universe it heads, or else to
 * the one that lists it as related; two universes that list each other share a shelf (Design with Content creation).
 * A category in no universe goes to « Autres outils », always last, and only when it holds two tools or more: a lone
 * tool joins the largest shelf rather than make a shelf of one.
 */
type Universe = (typeof NEED_UNIVERSES)[number];

/**
 * Categories no universe names, given the universe that holds their need (17/11): team chat is communication;
 * payments sit with e-commerce, a sub-need of « Développement & No-Code » (Shopify's shelf). No Finance universe exists.
 */
const HOME: Record<string, string> = { "communication-team": "communication", finance: "nocode-web" };

const universeOf = (category: string | null) => {
  if (!category) return undefined;
  const home = HOME[category] ?? category;
  return NEED_UNIVERSES.find((universe) => universe.categoryId === home) ?? NEED_UNIVERSES.find((universe) => universe.related.includes(home));
};
const mutual = (a: Universe, b: Universe) => a.related.includes(b.categoryId) && b.related.includes(a.categoryId);

/** One short name per shelf (step 8, 18/11): its first universe alone, the same in the bar's chip and the shelf title. */
export interface Shelf { id: string; title: string; short: string; cards: McpCard[] }

export function agentShelves(cards: McpCard[], lang: Lang): Shelf[] {
  const groups: { universes: Universe[]; cards: McpCard[] }[] = [];
  const rest: McpCard[] = [];
  for (const card of cards) {
    const universe = universeOf(card.category);
    if (!universe) { rest.push(card); continue; }
    let group = groups.find((g) => g.universes.some((u) => u === universe || mutual(u, universe)));
    if (!group) { group = { universes: [], cards: [] }; groups.push(group); }
    if (!group.universes.includes(universe)) group.universes.push(universe);
    group.cards.push(card);
  }
  const label = (universe: Universe) => (lang === "en" ? universe.labelEn : universe.labelFr);
  const shelves = groups
    .sort((a, b) => b.cards.length - a.cards.length || label(a.universes[0]).localeCompare(label(b.universes[0])))
    .map((group) => ({ id: group.universes.map((u) => u.categoryId).join("+"), title: label(group.universes[0]), short: label(group.universes[0]), cards: group.cards }));
  if (rest.length === 1 && shelves.length) shelves[0].cards.push(...rest);
  return rest.length > 1 ? [...shelves, { id: "other", title: lang === "en" ? "Other" : "Autres", short: lang === "en" ? "Other" : "Autres", cards: rest }] : shelves;
}
