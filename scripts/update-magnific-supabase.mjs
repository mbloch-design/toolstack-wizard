/**
 * update-magnific-supabase.mjs
 *
 * Mise à jour ciblée de la fiche `magnific-ai` directement dans Supabase
 * (elle a été retirée de tools_v4.json, la base est désormais la source).
 *
 * Contexte (recherche juin 2026) : Magnific n'est plus un simple upscaler.
 *  - Mai 2024 : Freepik rachète Magnific AI (upscaler viral).
 *  - Avril 2026 : Freepik abandonne son nom et rebaptise TOUTE l'entreprise
 *    "Magnific" : plateforme créative IA complète (image Mystic, vidéo,
 *    canvas nodal Spaces, 40+ modèles), ~230M$ ARR, 1M+ abonnés, bootstrapée.
 *  - Concurrence frontale avec Krea AI (Nodes) et Weavy (racheté par Figma
 *    fin 2025, relancé en "Figma Weave"). Tendance : le canvas nodal multi-modèles.
 *
 * DRY-RUN par défaut. --apply pour écrire.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}
const fileEnv = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.preprod"),
  ...loadEnvFile(".env.production"),
};
const pick = (...names) => names.map((n) => process.env[n] || fileEnv[n]).find(Boolean);

const SUPABASE_URL =
  pick("SUPABASE_URL", "VITE_SUPABASE_URL") || "https://rtfyfuwfdpnsogovkwai.supabase.co";
const SERVICE_KEY = pick(
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
  "SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE"
);
if (!SERVICE_KEY) {
  console.error("Clé service_role introuvable (.env.preprod : SUPABASE_SERVICE_ROLE_KEY=...).");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const SLUG = "magnific-ai";

const longFr =
  "Magnific a une histoire qui résume à elle seule la tendance IA du moment. Au départ, c'est un upscaler d'images devenu viral en 2024 : il n'agrandit pas seulement une image, il 'réinvente' du détail qui n'existait pas (détails 'hallucinés'), avec un rendu spectaculaire sur les visuels générés par IA. En mai 2024, l'outil est racheté par Freepik. Puis en avril 2026, coup de théâtre : Freepik abandonne son propre nom et rebaptise toute l'entreprise 'Magnific'.\n\n" +
  "Résultat, Magnific n'est plus un simple upscaler, c'est devenu une plateforme créative IA complète : génération d'images (famille de modèles Mystic, photoréaliste en 2K), génération de vidéo (qui pèse déjà la moitié du chiffre d'affaires, via des modèles comme Veo et Seedance plus des outils de pré-production maison), un canvas nodal collaboratif (Spaces) pour enchaîner les modèles, des outils 3D, et l'accès à plus de 40 modèles d'IA dans une seule interface. L'entreprise est rentable et bootstrapée, autour de 230 millions de dollars de revenus annuels récurrents et plus d'un million d'abonnés payants. Un détail qui compte pour les pros : l'indemnisation juridique sur l'usage commercial des visuels générés (sur les plans haut de gamme).\n\n" +
  "Concrètement, deux choses à retenir. D'abord, le produit upscaler historique reste vendu à part (Pro 39$/mois, Premium 99$, Business 299$), cher et sans offre gratuite, et il 'invente' du détail : pour un agrandissement fidèle à l'original, Topaz Gigapixel reste plus précis et moins cher. Ensuite, Magnific la plateforme se positionne désormais comme un agrégateur de modèles, en concurrence frontale avec Krea AI (et ses Nodes) ou Weavy, racheté fin 2025 par Figma et relancé sous le nom Figma Weave. C'est ça, la grande bascule : on ne paie plus un outil pour une tâche, on paie un canvas qui orchestre tous les modèles. Si tu veux juste de l'upscaling créatif ponctuel, Magnific reste une référence ; si tu cherches une plateforme tout-en-un, compare-la sérieusement à Krea avant de t'engager.";

const longEn =
  "Magnific's story sums up the current AI trend on its own. It started as an image upscaler that went viral in 2024: it doesn't just enlarge an image, it 'reinvents' detail that wasn't there ('hallucinated' detail), with spectacular results on AI-generated visuals. In May 2024, Freepik acquired it. Then in April 2026, the twist: Freepik dropped its own name and rebranded the entire company as 'Magnific'.\n\n" +
  "As a result, Magnific is no longer a simple upscaler, it has become a full AI creative platform: image generation (the Mystic model family, photorealistic 2K), video generation (already about half of revenue, via models like Veo and Seedance plus in-house pre-production tools), a collaborative node canvas (Spaces) to chain models, 3D tools, and access to 40+ AI models in a single interface. The company is profitable and bootstrapped, around $230 million in annual recurring revenue and over a million paying subscribers. One detail that matters for pros: legal indemnification on commercial use of generated visuals (on higher-tier plans).\n\n" +
  "Two things to remember. First, the original upscaler product is still sold separately (Pro $39/month, Premium $99, Business $299), pricey and with no free tier, and it 'invents' detail: for enlargement faithful to the original, Topaz Gigapixel stays more precise and cheaper. Second, Magnific the platform now positions itself as a model aggregator, in direct competition with Krea AI (and its Nodes) or Weavy, which Figma acquired in late 2025 and relaunched as Figma Weave. That's the real shift: you no longer pay for a single-task tool, you pay for a canvas that orchestrates every model. If you just want occasional creative upscaling, Magnific is still a benchmark; if you want an all-in-one platform, seriously compare it to Krea before committing.";

const values = {
  short_description:
    "Magnific : l'upscaler IA devenu une plateforme créative complète, ex-Freepik.",
  short_description_en:
    "Magnific: the AI upscaler that became a full creative platform (ex-Freepik).",
  description: longFr,
  long_description: longFr,
  long_description_en: longEn,
  default_monthly_price: 39,
  pricing: {
    paid:
      "Upscaler : Pro 39$/mois, Premium 99$, Business 299$ (pas d'offre gratuite). Plateforme Magnific (ex-Freepik) : plans séparés.",
  },
  pricing_en: {
    paid:
      "Upscaler: Pro $39/month, Premium $99, Business $299 (no free tier). Magnific platform (ex-Freepik): separate plans.",
  },
  pricing_v5: {
    cautions: [
      "L'upscaler (39$/mois) et la plateforme Magnific ex-Freepik ont des plans distincts",
      "Pas d'offre gratuite sur l'upscaler",
    ],
    verified_on: "2026-06-17",
    source_domain: "magnific.ai",
    usage_sensitive: true,
    compare_plan_kind: "seat",
    compare_plan_name: "Pro",
    price_reliability: "high",
    location_sensitive: false,
    official_source_url: "https://magnific.ai/pricing",
    verification_status: "official_explicit",
    compare_price_monthly_eur: 39,
  },
  verdict: {
    keepIf: [
      "Tu veux un upscaling créatif qui réinvente les détails (rendu artistique, pas fidèle)",
      "Tu cherches une plateforme IA tout-en-un (image, vidéo, multi-modèles) avec indemnisation commerciale",
    ],
    avoidIf: [
      "Tu veux un agrandissement fidèle et moins cher : Topaz Gigapixel est plus adapté",
      "Tu compares les plateformes : teste aussi Krea AI et Figma Weave avant de t'engager",
    ],
    threshold:
      "Pertinent pour de l'upscaling créatif haut de gamme, ou comme plateforme IA tout-en-un si tu l'as comparée à Krea. Pour un simple agrandissement fidèle, Topaz Gigapixel suffit.",
  },
  verdict_en: {
    keepIf: [
      "You want creative upscaling that reinvents detail (artistic, not faithful)",
      "You want an all-in-one AI platform (image, video, multi-model) with commercial indemnification",
    ],
    avoidIf: [
      "You want faithful, cheaper enlargement: Topaz Gigapixel fits better",
      "You're comparing platforms: also test Krea AI and Figma Weave before committing",
    ],
    threshold:
      "Worth it for high-end creative upscaling, or as an all-in-one AI platform once you've compared it to Krea. For plain faithful enlargement, Topaz Gigapixel is enough.",
  },
  pros: [
    "Upscaling créatif unique : ajoute du détail saisissant, au-delà d'un simple agrandissement",
    "Devenu une plateforme complète : image (Mystic), vidéo, canvas nodal, 40+ modèles",
    "Indemnisation juridique sur l'usage commercial (plans haut de gamme)",
    "Entreprise rentable et solide (ex-Freepik, ~230M$ ARR), pas un produit fragile",
  ],
  pros_en: [
    "Unique creative upscaling: adds striking detail beyond a simple enlargement",
    "Now a full platform: image (Mystic), video, node canvas, 40+ models",
    "Legal indemnification on commercial use (higher-tier plans)",
    "Profitable, solid company (ex-Freepik, ~$230M ARR), not a fragile product",
  ],
  cons: [
    "L'upscaler reste cher : abonnement dès 39$/mois, sans offre gratuite",
    "Réinvente les détails : pas fidèle à l'original (Topaz Gigapixel plus précis et moins cher)",
    "Marque devenue confuse : 'Magnific' désigne à la fois l'upscaler et toute la plateforme ex-Freepik",
    "Sur la partie plateforme, Krea AI et Figma Weave sont des concurrents sérieux à comparer",
  ],
  cons_en: [
    "The upscaler stays pricey: subscription from $39/month, no free tier",
    "Reinvents detail: not faithful to the original (Topaz Gigapixel is more precise and cheaper)",
    "Brand is now confusing: 'Magnific' means both the upscaler and the whole ex-Freepik platform",
    "On the platform side, Krea AI and Figma Weave are serious competitors to compare",
  ],
  use_cases: [
    "Agrandir une image avec un rendu détaillé et créatif",
    "Rehausser une image générée par IA pour le print ou un portfolio",
    "Produire image et vidéo IA depuis une seule plateforme",
    "Enchaîner plusieurs modèles d'IA dans un canvas (Spaces)",
  ],
  use_cases_en: [
    "Enlarge an image with a detailed, creative result",
    "Boost an AI-generated image for print or a portfolio",
    "Produce AI image and video from a single platform",
    "Chain several AI models in a canvas (Spaces)",
  ],
  seo: {
    metaDescription:
      "Magnific en 2026 : l'upscaler IA devenu plateforme créative complète (ex-Freepik), prix, pivot vidéo et concurrents (Krea, Figma Weave). Le verdict ToolTrim.",
  },
  alternatives: ["topaz-gigapixel", "krea-ai", "leonardo-ai"],
  relevant_for: ["createur-contenu", "designer"],
  better_alternative: {
    tool: "topaz-gigapixel",
    reason:
      "Pour un agrandissement fidèle à l'original (sans détails réinventés), Topaz Gigapixel est plus précis et revient moins cher en licence unique.",
    saving: 30,
    performanceGain: null,
  },
  prescription_quality: "question",
};

const { data: row, error: selErr } = await supabase
  .from("tools")
  .select("*")
  .eq("slug", SLUG)
  .maybeSingle();
if (selErr) {
  console.error(`Lecture impossible : ${selErr.message}`);
  process.exit(1);
}
if (!row) {
  console.error(`Aucune ligne Supabase pour ${SLUG}.`);
  process.exit(1);
}

const cols = new Set(Object.keys(row));
const update = {};
const ignored = [];
for (const [col, val] of Object.entries(values)) {
  if (cols.has(col)) update[col] = val;
  else ignored.push(col);
}

console.log(`\nMode : ${APPLY ? "APPLICATION RÉELLE (--apply)" : "DRY-RUN"}`);
console.log(`Colonnes à écrire : ${Object.keys(update).join(", ")}`);
if (ignored.length) console.log(`Colonnes absentes (ignorées) : ${ignored.join(", ")}`);

if (!APPLY) {
  console.log("\nDry-run terminé. Relance avec --apply pour écrire.");
  process.exit(0);
}

const { error: updErr } = await supabase.from("tools").update(update).eq("slug", SLUG);
if (updErr) {
  console.error(`Écriture échouée : ${updErr.message}`);
  process.exit(1);
}
console.log(`\nOK — ${SLUG} : ${Object.keys(update).length} colonnes mises à jour.`);
