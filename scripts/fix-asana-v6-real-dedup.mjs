/** fix-asana-v6-real-dedup.mjs
 * Round 6, after the user pushed back twice asking "did you actually read
 * this?" A full top-to-bottom read (not grepping for expected strings)
 * showed the core "good for teams, not solo" message restated near-
 * verbatim across 7 sections, the price-jump fact repeated 4 times, and
 * a duplicate I introduced myself: the team-size cost breakdown existed
 * both as prose in the long analysis AND as the new cost table, with the
 * exact same numbers.
 *
 * Fixed within the content I actually control (long analysis prose, one
 * FAQ answer):
 * - Long analysis paragraph 2 no longer restates the verdict (team good /
 *   solo bad, Trello suffices) - it now explains the mechanism (task
 *   dependencies cascading without a Slack message) instead, which is new
 *   information, not a repeat.
 * - Paragraph 3 no longer re-quotes the 2.3x multiplier and $15k/year
 *   figure (already stated in "Limite principale" and cons[0]) - it
 *   explains what's specifically gated behind Advanced instead.
 * - Paragraph 4 (prose cost-by-team-size breakdown) is removed entirely:
 *   it duplicated the new cost table number-for-number. The table is
 *   the better format for that data; the prose added nothing on top of it.
 * - Added a faqPriceAnswer override (read by toolFaq.ts, falls back to
 *   verdict.threshold for every tool without one) so the "vaut-il son
 *   prix" FAQ answer isn't a fourth verbatim copy of the same two
 *   sentences shown in the hero and "Décision rapide".
 *
 * Not changed (flagged to the user instead of silently fixed): the
 * verdict.threshold full text still appears in the hero, "Décision
 * rapide", and ToolSummaryBlock's "Verdict ToolTrim" row - those are
 * shared, site-wide components (the hero subtitle and ToolSummaryBlock
 * pattern run on all 1109 tool pages), so changing their behavior is a
 * bigger call than a content edit.
 */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const tool = tools.find((x) => (x.slug || x.id) === "asana");
if (!tool) throw new Error("asana not found");

const descFr = "Asana propose plusieurs vues de travail (listes, tableaux Kanban, timeline, calendrier) que chaque équipe peut adapter à son processus. Asana Intelligence résume les tâches et suggère des actions directement dans le flux de travail existant.\n\nCe qui justifie vraiment Asana, ce n'est pas la liste de tâches : c'est la dépendance entre tâches. Si le design prend du retard, le développement le voit tout de suite, sans qu'un humain ait besoin de l'annoncer sur Slack. Cette mécanique ne sert à rien si tu es seul sur tes propres dossiers, mais elle change la donne dès qu'une agence gère 5 comptes clients en parallèle ou qu'une équipe produit empile les dépendances entre specs, design et dev.\n\nLe piège classique : rester sur Starter parce que ça semble suffisant, puis réaliser que les dépendances, les règles d'automatisation et le reporting portfolio (les fonctionnalités qui justifient Asana face à une liste de tâches gratuite) sont réservées à Advanced. En dessous de ce palier, tu paies surtout pour la marque. Le détail chiffré par taille d'équipe est dans la section prix, plus bas.";
tool.description = descFr;
tool.longDescription = descFr;

const descEn = "Asana offers several work views (lists, Kanban boards, timeline, calendar) that each team can adapt to its process. Asana Intelligence summarizes tasks and suggests actions directly within the existing workflow.\n\nWhat actually justifies Asana isn't the task list, it's the dependency between tasks. If design runs late, development sees it immediately, with no one needing to flag it on Slack. That mechanic does nothing for you if you're solo on your own files, but it changes the math once an agency runs 5 client accounts in parallel or a product team stacks dependencies across specs, design and dev.\n\nThe classic trap: stay on Starter because it looks like enough, then find out dependencies, automation rules and portfolio reporting (the features that actually justify Asana over a free task list) are locked to Advanced. Below that tier, you're mostly paying for the name. The numbers by team size are in the pricing section below.";
tool.descriptionEn = descEn;
tool.longDescriptionEn = descEn;

tool.verdict.faqPriceAnswer = "Oui si ton équipe a plusieurs personnes et plusieurs projets à coordonner : la timeline et les dépendances justifient le prix. Pour un usage solo ou une simple liste de tâches, le rapport qualité-prix est moins bon que Trello ou Notion.";
tool.verdictEn.faqPriceAnswer = "Yes, if your team is coordinating several people across several projects: timeline and dependencies justify the price. For solo use or a simple task list, Trello or Notion give you better value.";

writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log("Asana v6 (vraie relecture, dédoublonnage du contenu maîtrisé) mise à jour.");
