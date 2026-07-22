/**
 * Décisions métier explicites nécessaires au staging, non inférables depuis
 * une page fournisseur. Étendre ce registre fiche par fiche après revue.
 */
export const STAGING_PROFILES = Object.freeze({
  wix: Object.freeze({
    planOrder: Object.freeze(["free", "light", "core", "business", "business_elite"]),
    comparePlanKey: "light",
    locale: "fr-FR",
  }),
  webflow: Object.freeze({
    planOrder: Object.freeze(["starter", "basic", "premium"]),
    comparePlanKey: "basic",
    freePlanKey: "starter",
    locale: "fr-FR",
  }),
  n8n: Object.freeze({
    // Plan gratuit = Community Edition auto-hébergée (freePlanKey non nommé "free").
    // Enterprise (contact sales) reste éditorial : hors planOrder, sans observation de prix.
    planOrder: Object.freeze(["community", "starter", "pro", "business"]),
    comparePlanKey: "starter",
    freePlanKey: "community",
    locale: "fr-FR",
    // Fiche legacy quasi vide : l'éditorial DOIT venir de research.editorial_drafts.
    // Aucun fallback silencieux vers le legacy (voir buildStagingProposal).
    editorialSource: "research",
  }),
  framer: Object.freeze({
    // Free/Basic/Pro (+Enterprise sur devis, hors planOrder). Marché global USD (registre).
    planOrder: Object.freeze(["free", "basic", "pro"]),
    comparePlanKey: "basic",
    freePlanKey: "free",
    locale: "fr-FR",
    editorialSource: "research",
  }),
  squarespace: Object.freeze({
    // Basic/Core/Plus/Advanced, pas de plan gratuit durable (essai seulement). Hôte fr.* => locale FR.
    planOrder: Object.freeze(["basic", "core", "plus", "advanced"]),
    comparePlanKey: "basic",
    locale: "fr-FR",
    editorialSource: "research",
  }),
  contra: Object.freeze({
    // Plateforme freelances : Free durable + Pro. Prix peu publics => observations souvent needs_review.
    planOrder: Object.freeze(["free", "pro"]),
    comparePlanKey: "pro",
    freePlanKey: "free",
    locale: "fr-FR",
    editorialSource: "research",
  }),
  notion: Object.freeze({
    // Par utilisateur. Free + Plus + Business ; Enterprise sur devis (exclu). EUR par géo => candidat reference_fr.
    planOrder: Object.freeze(["free", "plus", "business"]),
    comparePlanKey: "plus",
    freePlanKey: "free",
    locale: "fr-FR",
    editorialSource: "research",
  }),
  loom: Object.freeze({
    // Par utilisateur. Starter gratuit + Business + Business+AI ; Enterprise sur devis (exclu). Global USD.
    planOrder: Object.freeze(["free", "business", "business_ai"]),
    comparePlanKey: "business",
    freePlanKey: "free",
    locale: "fr-FR",
    editorialSource: "research",
  }),
  linear: Object.freeze({
    // Par utilisateur, engagement annuel. Free + Basic + Business ; Enterprise sur devis (exclu). Global USD.
    planOrder: Object.freeze(["free", "basic", "business"]),
    comparePlanKey: "basic",
    freePlanKey: "free",
    locale: "fr-FR",
    editorialSource: "research",
  }),
  calendly: Object.freeze({
    // SaaS par utilisateur (siège). Free + Standard + Teams ; Enterprise sur devis (hors planOrder).
    planOrder: Object.freeze(["free", "standard", "teams"]),
    comparePlanKey: "standard",
    freePlanKey: "free",
    locale: "fr-FR",
    editorialSource: "research",
  }),
  "angular-material": Object.freeze({
    // Bibliothèque open-source MIT : un seul "plan" gratuit, aucun prix. free=compare.
    // openSource: licence libre VÉRIFIÉE (claim MIT) -> unité pricing_unit="open_source"
    // (véridique) pour satisfaire la contrainte du plan comparatif, sans fabriquer de prix.
    planOrder: Object.freeze(["free"]),
    comparePlanKey: "free",
    freePlanKey: "free",
    openSource: true,
    locale: "fr-FR",
    editorialSource: "research",
  }),
});

export function stagingProfileFor(slug) {
  const profile = STAGING_PROFILES[slug];
  if (!profile) throw new Error(`staging: aucun profil métier validé pour ${slug}`);
  return profile;
}
