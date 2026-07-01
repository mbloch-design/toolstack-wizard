/** fix-asana-fiche.mjs — Asana revision per user's detailed editorial critique:
 * sharper solo/team framing, "rentable si" thresholds, resolved Linear vs.
 * alternatives table inconsistency, official pricing source, concrete AI example. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const a = tools.find((x) => (x.slug || x.id) === "asana");
if (!a) throw new Error("asana not found");

a.soloRelevance = "low";
a.teamRelevance = "high";

// idealForFr/idealForEn live under seo (not top-level) so they ride along
// with the existing "seo" Supabase column instead of needing a schema change.
a.seo.idealForFr = "Idéal pour petites équipes projet, studios et agences qui ont plusieurs projets clients en parallèle. Surdimensionné pour un solo qui gère surtout ses propres tâches.";
a.seo.idealForEn = "Best for small project teams, studios and agencies juggling several client projects in parallel. Overkill for a solo operator mostly managing their own tasks.";

const rentableFr = "Asana est rentable si : votre équipe compte au moins 3 à 5 personnes sur un même projet, vous gérez plusieurs projets actifs en parallèle (clients ou internes), vous avez besoin d'un point de suivi hebdomadaire ou d'un reporting régulier vers des clients ou la direction, et vous utilisez réellement les dépendances, règles d'automatisation ou formulaires — pas seulement une liste de tâches. En dessous de ces seuils, le passage à Advanced (jusqu'à 2,3x le prix de Starter) n'est presque jamais justifié.";
const rentableEn = "Asana pays off if: your team has at least 3 to 5 people on the same project, you're running several active projects in parallel (client or internal), you need a weekly check-in or regular reporting to clients or leadership, and you actually use dependencies, automation rules or forms — not just a task list. Below these thresholds, upgrading to Advanced (up to 2.3x the Starter price) is almost never worth it.";

a.longDescription = a.longDescription.trimEnd() + "\n\n" + rentableFr;
a.longDescriptionEn = a.longDescriptionEn.trimEnd() + "\n\n" + rentableEn;

a.verdict.threshold = "Garde Asana si ton équipe travaille déjà dedans et utilise timeline, dépendances, règles, formulaires ou reporting. Challenge-le si tu t'en sers comme simple to-do list.";
a.verdictEn.threshold = "Keep Asana if your team already works in it and uses timeline, dependencies, rules, forms or reporting. Challenge it if you're just using it as a plain to-do list.";

// Linear stays the "recommended alternative" card, but now also appears in
// the comparison table (it previously vanished after the card, which read
// as an unexplained inconsistency) — and the card no longer prints a raw
// internal slug ("plus-adapte-tech") as its reason text.
a.alternatives = ["linear", "clickup", "monday", "trello"];
a.betterAlternative = {
  tool: "linear",
  reason: "Linear est 10x plus rapide et pensé pour les équipes produit/tech qui veulent un outil minimaliste — mais sans la richesse de personnalisation (formulaires, règles, reporting) qu'Asana offre aux équipes projet ou en relation client.",
  saving: 5,
  performanceGain: "Linear est 10x plus rapide, pensé pour les équipes produit/tech",
};

// Pricing: replace the forum-sourced metadata with the official pricing page.
a.pricing_v5 = {
  ...a.pricing_v5,
  verified_on: "2026-06-24",
  source_domain: "asana.com",
  compare_plan_kind: "seat",
  compare_plan_name: "Starter",
  price_reliability: "high",
  location_sensitive: false,
  official_source_url: "https://asana.com/pricing",
  verification_status: "official_explicit",
  compare_price_monthly_eur: 10.99,
};
a.defaultMonthlyPrice = 10.99;

a.seo.aiAngle.augmentFr = "Asana a ajouté un assistant IA pour résumer des projets, rédiger des statuts et suggérer des sous-tâches à partir d'un objectif. Concrètement : si tu gères 12 projets clients actifs, l'IA d'Asana peut t'aider à produire des statuts hebdo automatiquement ; si tu es solo avec une vingtaine de tâches, ça ne justifie pas de passer en Advanced pour y accéder.";
a.seo.aiAngle.augmentEn = "Asana added an AI assistant to summarize projects, draft status updates and suggest subtasks from a goal. Concretely: if you're running 12 active client projects, Asana's AI can help auto-generate weekly status reports; if you're solo with about twenty tasks, that doesn't justify upgrading to Advanced just to access it.";

writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log("Asana fiche updated.");
