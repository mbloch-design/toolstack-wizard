#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const slugs = ["audionotes", "visualcv", "jenni"];
const tools = JSON.parse(await readFile("src/data/tools_v4.json", "utf8"));
const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

const planGuidance = {
  audionotes: {
    fr: { pricing_model: "Abonnement par compte, avec un palier gratuit durable, une offre individuelle et une offre équipe sur devis.", deployment_note: "Service hébergé disponible sur le Web et via applications mobiles et desktop.", cautions: ["Le palier gratuit limite la longueur des captures.", "Les limites de fichiers et l'usage raisonnable peuvent s'appliquer."], free_plan_card: "Palier gratuit durable pour tester les captures courtes." },
    en: { pricing_model: "Per-account subscription with a permanent free tier, an individual offer and a quoted team offer.", deployment_note: "Hosted service available on the web and through mobile and desktop apps.", cautions: ["The free tier limits capture length.", "File limits and fair-use rules may apply."], free_plan_card: "Permanent free tier for testing short captures." },
  },
  visualcv: {
    fr: { pricing_model: "Compte gratuit et abonnement individuel ; le cycle trimestriel affiché doit rester distinct d'un prix mensuel ferme.", deployment_note: "Service Web hébergé avec export de documents et liens partageables.", cautions: ["L'affichage par mois peut correspondre à une facturation trimestrielle.", "Les prestations humaines de rédaction sont des services séparés."], free_plan_card: "Compte gratuit durable pour créer et prévisualiser un premier CV." },
    en: { pricing_model: "Free account and individual membership; the displayed quarterly cycle must remain distinct from a firm monthly price.", deployment_note: "Hosted web service with document exports and shareable links.", cautions: ["A monthly-looking amount may be billed quarterly.", "Human resume-writing services are separate add-ons."], free_plan_card: "Permanent free account for creating and previewing a first resume." },
  },
  jenni: {
    fr: { pricing_model: "Abonnement individuel avec plan gratuit durable et deux niveaux payants selon le volume d'usage.", deployment_note: "Éditeur Web hébergé, avec bibliothèque de sources et import de documents.", cautions: ["Les citations et références générées doivent être vérifiées.", "La tarification peut être adaptée dans l'application selon la région."], free_plan_card: "Plan gratuit durable avec limites d'usage." },
    en: { pricing_model: "Individual subscription with a permanent free plan and two paid levels based on usage volume.", deployment_note: "Hosted web editor with a source library and document imports.", cautions: ["Generated citations and references require verification.", "In-app pricing may vary by region."], free_plan_card: "Permanent free plan with usage limits." },
  },
};

function localized(tool, lang) {
  const en = lang === "en";
  const verdict = en ? tool.verdictEn : tool.verdict;
  const seo = tool.seo || {};
  const ai = seo.aiAngle || {};
  const guidance = planGuidance[tool.slug][lang];
  return {
    short_description: en ? tool.shortDescriptionEn : tool.shortDescription,
    long_description: en ? tool.longDescriptionEn : tool.longDescription,
    verdict,
    pros: en ? tool.prosEn : tool.pros,
    cons: en ? tool.consEn : tool.cons,
    use_cases: en ? tool.useCasesEn : tool.useCases,
    covers: tool.covers,
    relevant_for: tool.relevantFor,
    personas: tool.personas?.length ? tool.personas : tool.relevantFor,
    functional_needs: tool.functional_needs,
    verticals: tool.verticals,
    solo_relevance: tool.soloRelevance,
    team_relevance: tool.teamRelevance,
    ai_angle: en ? { augmentEn: ai.augmentEn, replaceEn: ai.replaceEn, idealForEn: verdict.threshold, stance: ai.stance, aiTools: ai.aiTools || [] }
      : { augmentFr: ai.augmentFr, replaceFr: ai.replaceFr, idealForFr: verdict.threshold, stance: ai.stance, aiTools: ai.aiTools || [] },
    seo: { metaDescription: seo.metaDescription, aiAngle: { stance: ai.stance } },
    pricing_guidance: { ...guidance, price_reliability: "official_verified", usage_sensitive: false, location_sensitive: tool.slug === "jenni", plan_details: {} },
  };
}

for (const slug of slugs) {
  const path = `research/tool-pages/${slug}.json`;
  const doc = JSON.parse(await readFile(path, "utf8"));
  const tool = bySlug.get(slug);
  const facts = [...new Set((doc.collector?.sources || []).flatMap((source) => (source.captures || []).map((capture) => capture.capture_id)).filter(Boolean))];
  doc.editorial_drafts = {
    author: "Codex",
    content_version: 1,
    en: localized(tool, "en"),
    facts_basis: facts,
    fr: localized(tool, "fr"),
    generated_on: "2026-08-18",
    pricing_facts_policy: "Aucun montant, devise, engagement ou quota tarifaire dans la rédaction : les faits de prix restent exclusivement dans collector.observations.",
    status: "draft",
  };
  await writeFile(path, `${JSON.stringify(doc, null, 2)}\n`);
}

console.log(JSON.stringify({ editorial_drafts: slugs }, null, 2));
