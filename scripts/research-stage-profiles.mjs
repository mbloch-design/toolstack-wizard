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
});

export function stagingProfileFor(slug) {
  const profile = STAGING_PROFILES[slug];
  if (!profile) throw new Error(`staging: aucun profil métier validé pour ${slug}`);
  return profile;
}
