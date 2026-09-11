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
 * Seuil en mots. Cale empiriquement : a 10, le francais ne perd que 5 blocs
 * par rapport aux 80 caracteres d'origine, et l'anglais en gagne une
 * cinquantaine. A 12, le francais en perdait 121 sans que l'anglais y gagne.
 * Les gabarits de remplissage font 8 et 16 mots, donc le seuil ne suffit pas
 * a les ecarter : c'est le role de FILLER_PATTERNS.
 */
export const EDITORIAL_MIN_WORDS = 10;

export function isEditorialFiller(text: string): boolean {
  return FILLER_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

export function hasEditorialSubstance(text: string | null | undefined): boolean {
  const value = (text || "").trim();
  if (!value || isEditorialFiller(value)) return false;
  return value.split(/\s+/).filter(Boolean).length >= EDITORIAL_MIN_WORDS;
}
