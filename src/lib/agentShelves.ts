import { NEED_UNIVERSES } from "@/data/needUniverses";
import type { Lang, McpCard } from "@/lib/agents";

/*
 * The full list of servers in a few families (step 4, 17/11/2026): the catalogue's need universes (Explorer), not its
 * fine categories, which left a shelf per one or two servers. A category belongs to the universe it heads, or else to
 * the one that lists it as related; two universes that list each other share a shelf (Design with Content creation).
 * A category in no universe goes to « Autres outils », always last.
 */
type Universe = (typeof NEED_UNIVERSES)[number];

const universeOf = (category: string | null) => category
  ? NEED_UNIVERSES.find((universe) => universe.categoryId === category) ?? NEED_UNIVERSES.find((universe) => universe.related.includes(category))
  : undefined;
const mutual = (a: Universe, b: Universe) => a.related.includes(b.categoryId) && b.related.includes(a.categoryId);

export interface Shelf { id: string; title: string; cards: McpCard[] }

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
    .map((group) => ({ id: group.universes.map((u) => u.categoryId).join("+"), title: group.universes.map(label).join(lang === "en" ? " and " : " et "), cards: group.cards }));
  return rest.length ? [...shelves, { id: "other", title: lang === "en" ? "Other tools" : "Autres outils", cards: rest }] : shelves;
}
