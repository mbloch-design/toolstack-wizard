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
});

export function stagingProfileFor(slug) {
  const profile = STAGING_PROFILES[slug];
  if (!profile) throw new Error(`staging: aucun profil métier validé pour ${slug}`);
  return profile;
}
