import chatgptVsClaude from "./comparison-battles/chatgpt-vs-claude.json";
import figmaVsCanva from "./comparison-battles/figma-vs-canva.json";
import makeVsZapier from "./comparison-battles/make-vs-zapier.json";
import notionVsAirtable from "./comparison-battles/notion-vs-airtable.json";
import webflowVsFramer from "./comparison-battles/webflow-vs-framer.json";

export const BATTLE_COMPARISON_DATA = {
  "chatgpt-vs-claude": chatgptVsClaude,
  "figma-vs-canva": figmaVsCanva,
  "make-vs-zapier": makeVsZapier,
  "notion-vs-airtable": notionVsAirtable,
  "webflow-vs-framer": webflowVsFramer,
} as const;

export type BattleComparisonSlug = keyof typeof BATTLE_COMPARISON_DATA;
export type BattleComparisonData = (typeof BATTLE_COMPARISON_DATA)[BattleComparisonSlug];
