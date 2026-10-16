/**
 * French typography helpers for generated copy.
 *
 * Elision: "de" -> "d'", "que" -> "qu'" before a vowel sound, so tool names
 * read "autour d'Airtable", "même usage qu'Asana". "h" is left alone: whether
 * it is mute depends on the word, and a wrong elision reads worse than none.
 */
const VOWEL_START = /^[aeiouyàâäéèêëîïôöùûüœæ]/i;

export const startsWithVowel = (name: string) => VOWEL_START.test(name.trim());
/** "de Notion" / "d'Airtable" */
export const deName = (name: string) => (startsWithVowel(name) ? `d'${name}` : `de ${name}`);
/** "que Notion" / "qu'Airtable" */
export const queName = (name: string) => (startsWithVowel(name) ? `qu'${name}` : `que ${name}`);

/**
 * French sentence case for catalogue labels stored in Title Case
 * ("Gestion de Projet" -> "Gestion de projet"). Acronyms written in capitals
 * (IA, SIRH, CRM, UX/UI) keep them.
 */
export function frSentenceCase(label: string): string {
  return label.split(/(\s+)/).map((word, index) => {
    if (index === 0 || /^\s+$/.test(word)) return word;
    const letters = word.replace(/[^\p{L}]/gu, "");
    if (letters.length >= 2 && letters === letters.toLocaleUpperCase("fr")) return word;
    return word.toLocaleLowerCase("fr");
  }).join("");
}
