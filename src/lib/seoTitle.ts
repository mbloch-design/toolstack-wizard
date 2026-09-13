/**
 * Suffixe de marque des balises title, sans dépendance à React ni à Vite.
 *
 * Ce module existe pour la même raison que `currencyRates` : le prérendu
 * (vite.config.ts, sous Node) et l'application construisent les mêmes titres,
 * et une divergence fait changer le titre de l'onglet à l'hydratation.
 *
 * Elle existait. Le prérendu retirait « | ToolTrim » au-delà de 60 caractères
 * sur la racine des fiches outil, l'application le gardait toujours : la fiche
 * Notion servait « Notion: pricing from €10, review & alternatives 2026 » puis
 * affichait la même chose plus « | ToolTrim » une fois hydratée. Le HTML servi
 * et le DOM final annonçaient deux titres différents pour la même page.
 *
 * Règle unique : la marque est un bonus, pas une obligation. Elle est ajoutée
 * tant qu'elle tient dans la limite de troncature, retirée sinon, parce que
 * Google réaffiche le nom du site de lui-même dans ses résultats.
 */

export const BRAND_SUFFIX = " | ToolTrim";

/**
 * Limite de troncature retenue. Google coupe autour de 600 pixels, ce qui
 * correspond en pratique à une soixantaine de caractères latins.
 */
export const TITLE_MAX_CHARS = 60;

/**
 * Ajoute le suffixe de marque quand le titre complet tient dans la limite.
 *
 * `core` est le message utile, sans marque. Les titres qui portent déjà leur
 * propre suffixe éditorial (les récits, par exemple) passent le leur en
 * second argument.
 */
export function fitBrandedTitle(core: string, brand: string = BRAND_SUFFIX): string {
  const trimmed = (core || "").trim();
  if (!trimmed) return trimmed;
  const withBrand = `${trimmed}${brand}`;
  return withBrand.length <= TITLE_MAX_CHARS ? withBrand : trimmed;
}
