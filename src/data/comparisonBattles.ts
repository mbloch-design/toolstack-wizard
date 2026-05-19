import canvaVsPhotoshopElements from "./comparison-battles/canva-vs-photoshop-elements.json";
import chatgptVsClaude from "./comparison-battles/chatgpt-vs-claude.json";
import chatgptVsGemini from "./comparison-battles/chatgpt-vs-gemini.json";
import clickupVsAsana from "./comparison-battles/clickup-vs-asana.json";
import figmaVsCanva from "./comparison-battles/figma-vs-canva.json";
import hubspotVsPipedrive from "./comparison-battles/hubspot-vs-pipedrive.json";
import makeVsZapier from "./comparison-battles/make-vs-zapier.json";
import notionVsAirtable from "./comparison-battles/notion-vs-airtable.json";
import slackVsMicrosoftTeams from "./comparison-battles/slack-vs-microsoft-teams.json";
import stripeVsPaypal from "./comparison-battles/stripe-vs-paypal.json";
import trelloVsLinear from "./comparison-battles/trello-vs-linear.json";
import webflowVsFramer from "./comparison-battles/webflow-vs-framer.json";

export const BATTLE_COMPARISON_DATA = {
  "canva-vs-photoshop-elements": canvaVsPhotoshopElements,
  "chatgpt-vs-claude": chatgptVsClaude,
  "chatgpt-vs-gemini": chatgptVsGemini,
  "clickup-vs-asana": clickupVsAsana,
  "figma-vs-canva": figmaVsCanva,
  "hubspot-vs-pipedrive": hubspotVsPipedrive,
  "make-vs-zapier": makeVsZapier,
  "notion-vs-airtable": notionVsAirtable,
  "slack-vs-microsoft-teams": slackVsMicrosoftTeams,
  "stripe-vs-paypal": stripeVsPaypal,
  "trello-vs-linear": trelloVsLinear,
  "webflow-vs-framer": webflowVsFramer,
} as const;

export type BattleComparisonSlug = keyof typeof BATTLE_COMPARISON_DATA;
export type BattleComparisonData = (typeof BATTLE_COMPARISON_DATA)[BattleComparisonSlug];
