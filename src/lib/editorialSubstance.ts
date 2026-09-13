/**
 * Decide si une description de fiche outil merite d'ouvrir le bloc editorial.
 *
 * Le test precedent etait `longueur >= 80 caracteres`, applique identiquement
 * aux deux langues. L'anglais est structurellement plus compact que le
 * francais : sur les textes longs du catalogue, le rapport median de longueur
 * EN/FR est de 0,868. Une meme phrase traduite fidelement passait donc le seuil
 * en francais et echouait en anglais.
 *
 * Effet mesure avant correction : le bloc "Comprendre X", avec ses sous-parties
 * "Fonctionnalites et usages" et "Pour qui", manquait sur des centaines de
 * fiches anglaises alors qu'il s'affichait sur leur equivalent francais. C'est
 * la cause principale de l'ecart median de 78 mots entre les deux versions.
 *
 * On compte donc des mots, pas des caracteres, et on rejette explicitement les
 * textes de remplissage. Ces gabarits passaient le seuil en francais, ou ils
 * sont plus bavards, et remplissaient la page sans rien apprendre au lecteur.
 * Les laisser affiches en francais seulement rendait la version francaise
 * artificiellement plus fournie que l'anglaise.
 */

const FILLER_PATTERNS: RegExp[] = [
  /^Tool or resource used in ToolTrim/i,
  /^Specialist tool used in ToolTrim/i,
  /est référencée? pour couvrir un besoin précis dans les stacks/i,
];

/**
 * Plancher de bon sens, pas un critere de qualite.
 *
 * Le seuil a d'abord ete pose a 10 mots, en transposant les 80 caracteres
 * d'origine. Mesure ensuite sur le catalogue : il masquait 143 fiches dont la
 * description tient en une phrase juste en dessous, alors que la phrase est
 * reelle. "Widely used JavaScript testing framework" fait 5 mots et decrit
 * Jest correctement ; "Plugin WordPress pour structurer champs, contenus et
 * interfaces d'administration" en fait 9 et decrit ACF correctement.
 *
 * C'est FILLER_PATTERNS qui fait le tri utile, pas la longueur. A 4 mots, les
 * deux langues ouvrent le bloc sur un nombre quasi identique de fiches
 * (1112 et 1111) et les seules ecartees sont les 60 gabarits de remplissage.
 * A 10, on en ecartait 143 dont 83 portaient un vrai texte.
 */
export const EDITORIAL_MIN_WORDS = 4;

export function isEditorialFiller(text: string): boolean {
  return FILLER_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

export function hasEditorialSubstance(text: string | null | undefined): boolean {
  const value = (text || "").trim();
  if (!value || isEditorialFiller(value)) return false;
  return value.split(/\s+/).filter(Boolean).length >= EDITORIAL_MIN_WORDS;
}
