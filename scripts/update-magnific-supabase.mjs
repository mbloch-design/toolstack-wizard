/**
 * update-magnific-supabase.mjs
 *
 * Mise à jour ciblée de la fiche `magnific-ai` directement dans Supabase
 * (elle a été retirée de tools_v4.json, la base est désormais la source).
 *
 * Contexte (recherche vérifiée juin 2026, sources officielles + presse) :
 *  - Mai 2024 : Freepik rachète l'upscaler viral Magnific AI.
 *  - 28 avril 2026 : Freepik abandonne son nom et rebaptise TOUTE l'entreprise
 *    "Magnific". Ce n'est plus un upscaler : c'est une plateforme créative IA
 *    tout-en-un (image, vidéo 4K+audio, 3D, espace collaboratif temps réel,
 *    assistant IA, 40+ modèles, bibliothèque 250M+ d'assets héritée de Freepik).
 *    ~230M$ ARR, 1M+ abonnés payants, ~290 équipes enterprise (BBC, Guess, R/GA),
 *    bootstrapée et rentable. CEO Joaquín Cuenca Abela.
 *  - IMPORTANT : l'ancienne grille upscaler magnific.ai ($39/$99/$299) a été
 *    RETIRÉE ; magnific.ai redirige vers la plateforme. Pricing réel désormais :
 *    Gratuit (~20 images/jour), Premium 20$/mois (14,50$ annuel),
 *    Premium+ 45$ (33,75$ annuel), Pro 280$, Business 55$/siège. Au crédit.
 *  - Concurrents directs multi-modèles : Krea AI (Nodes) et Figma Weave (ex-Weavy).
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
  "Magnific, c'est le nouveau nom de Freepik. En avril 2026, l'entreprise espagnole (fondée à Málaga en 2010) a abandonné la marque Freepik pour tout regrouper sous Magnific : une plateforme créative IA tout-en-un. L'upscaler viral racheté en 2024, qui a donné son nom à l'ensemble, n'est plus qu'une brique parmi d'autres.\n\n" +
  "Concrètement, la plateforme couvre toute la chaîne de création : génération d'images, génération de vidéo (jusqu'en 4K avec audio), l'outil d'upscaling et d'amélioration d'origine, un espace de travail collaboratif en temps réel, des outils 3D et de scènes virtuelles, un assistant IA, et l'accès à plus de 40 modèles d'IA dans une seule interface. S'y ajoute l'héritage de Freepik : une bibliothèque de plus de 250 millions d'assets. L'entreprise est rentable et bootstrapée, autour de 230 millions de dollars de revenus annuels récurrents, plus d'un million d'abonnés payants et près de 290 équipes enterprise (BBC, Guess, R/GA).\n\n" +
  "Côté prix : il y a un plan gratuit (environ 20 images par jour), puis Premium à 20$/mois (14,50$ en annuel), Premium+ à 45$ (33,75$ en annuel, avec de l'illimité sur une dizaine de modèles), Pro à 280$ et Business à 55$/siège. Tout fonctionne au crédit. Si tu cherches une plateforme multi-modèles, ses concurrents directs sont Krea AI et Figma Weave (ex-Weavy) : compare-les. Et si tout ce que tu veux, c'est l'upscaling fidèle qui a fait sa réputation, un outil dédié comme Topaz Gigapixel reste plus précis et moins cher qu'un abonnement plateforme.";

const longEn =
  "Magnific is the new name for Freepik. In April 2026, the Spanish company (founded in Málaga in 2010) dropped the Freepik brand to bring everything under Magnific: an all-in-one AI creative platform. The viral upscaler it acquired in 2024, which gave the whole thing its name, is now just one piece among many.\n\n" +
  "In practice, the platform covers the full creation chain: image generation, video generation (up to 4K with audio), the original upscaling and enhancement tool, a real-time collaborative workspace, 3D and virtual-scene tools, an AI assistant, and access to 40+ AI models in a single interface. On top of that comes Freepik's legacy: a library of over 250 million assets. The company is profitable and bootstrapped, around $230 million in annual recurring revenue, over a million paying subscribers, and nearly 290 enterprise teams (BBC, Guess, R/GA).\n\n" +
  "On price: there's a free plan (around 20 images per day), then Premium at $20/month ($14.50 annual), Premium+ at $45 ($33.75 annual, with unlimited use on about ten models), Pro at $280, and Business at $55/seat. Everything runs on credits. If you want a multi-model platform, its direct competitors are Krea AI and Figma Weave (ex-Weavy): compare them. And if all you want is the faithful upscaling that built its reputation, a dedicated tool like Topaz Gigapixel stays more precise and cheaper than a platform subscription.";

const values = {
  short_description:
    "Magnific (ex-Freepik) : plateforme IA tout-en-un pour l'image, la vidéo et le design.",
  short_description_en:
    "Magnific (ex-Freepik): an all-in-one AI platform for image, video, and design.",
  description: longFr,
  long_description: longFr,
  long_description_en: longEn,
  default_monthly_price: 20,
  pricing: {
    free: "Gratuit (~20 images/jour)",
    paid: "Premium 20$/mois (14,50$ annuel), Premium+ 45$, Pro 280$, Business 55$/siège",
  },
  pricing_en: {
    free: "Free (~20 images/day)",
    paid: "Premium $20/month ($14.50 annual), Premium+ $45, Pro $280, Business $55/seat",
  },
  pricing_v5: {
    cautions: [
      "Plateforme unifiée ex-Freepik : facturation au crédit, plans Premium à Business",
      "L'ancienne grille upscaler magnific.ai (39$/99$/299$) a été retirée",
    ],
    verified_on: "2026-06-17",
    source_domain: "magnific.com",
    usage_sensitive: true,
    compare_plan_kind: "seat",
    compare_plan_name: "Premium",
    price_reliability: "high",
    location_sensitive: false,
    official_source_url: "https://magnific.com/pricing",
    verification_status: "official_explicit",
    compare_price_monthly_eur: 20,
  },
  verdict: {
    keepIf: [
      "Tu veux une plateforme IA tout-en-un : image, vidéo, 3D et 40+ modèles au même endroit",
      "Tu produis beaucoup de visuels et l'accès illimité à certains modèles (Premium+) t'intéresse",
    ],
    avoidIf: [
      "Tu veux juste de l'upscaling fidèle : Topaz Gigapixel est plus précis et moins cher",
      "Tu compares les plateformes multi-modèles : teste aussi Krea AI et Figma Weave",
    ],
    threshold:
      "Pertinent comme plateforme créative IA complète si tu en exploites plusieurs briques (image, vidéo, modèles). Pour un seul usage ponctuel, un outil dédié revient moins cher.",
  },
  verdict_en: {
    keepIf: [
      "You want an all-in-one AI platform: image, video, 3D, and 40+ models in one place",
      "You produce a lot of visuals and unlimited use of some models (Premium+) appeals to you",
    ],
    avoidIf: [
      "You just want faithful upscaling: Topaz Gigapixel is more precise and cheaper",
      "You're comparing multi-model platforms: also test Krea AI and Figma Weave",
    ],
    threshold:
      "Worth it as a full AI creative platform if you use several of its pieces (image, video, models). For a single occasional task, a dedicated tool is cheaper.",
  },
  pros: [
    "Plateforme tout-en-un : image, vidéo (4K + audio), 3D, upscaling, 40+ modèles",
    "Bibliothèque héritée de Freepik : plus de 250 millions d'assets",
    "Plan gratuit (~20 images/jour) et entrée de gamme abordable (Premium dès 14,50$ en annuel)",
    "Entreprise rentable et solide (~230M$ ARR, 1M+ abonnés), adoptée par des équipes enterprise",
  ],
  pros_en: [
    "All-in-one platform: image, video (4K + audio), 3D, upscaling, 40+ models",
    "Library inherited from Freepik: over 250 million assets",
    "Free plan (~20 images/day) and affordable entry tier (Premium from $14.50 annual)",
    "Profitable, solid company (~$230M ARR, 1M+ subscribers), adopted by enterprise teams",
  ],
  cons: [
    "Facturation au crédit : le coût réel grimpe vite en usage intensif",
    "Pour un seul besoin (ex : upscaling fidèle), un outil dédié comme Topaz est moins cher",
    "Marque déroutante : 'Magnific' désigne maintenant toute la plateforme ex-Freepik, plus seulement l'upscaler",
    "Concurrence frontale de Krea AI et Figma Weave sur le créneau multi-modèles",
  ],
  cons_en: [
    "Credit-based billing: real cost climbs fast under heavy use",
    "For a single need (e.g. faithful upscaling), a dedicated tool like Topaz is cheaper",
    "Confusing brand: 'Magnific' now means the whole ex-Freepik platform, not just the upscaler",
    "Direct competition from Krea AI and Figma Weave in the multi-model space",
  ],
  use_cases: [
    "Générer images et vidéos IA depuis une seule plateforme",
    "Améliorer et agrandir des visuels avec l'upscaler maison",
    "Piocher dans 250M+ d'assets et 40+ modèles pour un projet",
    "Collaborer en équipe sur un espace de travail créatif IA",
  ],
  use_cases_en: [
    "Generate AI images and videos from a single platform",
    "Enhance and enlarge visuals with the in-house upscaler",
    "Pull from 250M+ assets and 40+ models for a project",
    "Collaborate as a team in an AI creative workspace",
  ],
  seo: {
    metaDescription:
      "Magnific (ex-Freepik) en 2026 : la plateforme IA tout-en-un (image, vidéo, 3D, 40+ modèles). Prix réels, scope et concurrents (Krea, Figma Weave). Le verdict ToolTrim.",
  },
  alternatives: ["krea-ai", "figma-weave"],
  relevant_for: ["createur-contenu", "designer", "motion-video"],
  better_alternative: null,
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
