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
});

export function stagingProfileFor(slug) {
  const profile = STAGING_PROFILES[slug];
  if (!profile) throw new Error(`staging: aucun profil métier validé pour ${slug}`);
  return profile;
}
