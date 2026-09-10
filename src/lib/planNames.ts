/**
 * Traduction des noms de plan tarifaire pour les pages anglaises.
 *
 * `pricing_v5.compare_plan_name` est saisi en francais et n'a pas de variante
 * anglaise. La plupart des noms sont des marques ("Growth", "Pro", "Starter")
 * qui n'ont rien a traduire, mais 44 d'entre eux portent un qualificatif
 * francais, presque toujours entre parentheses : "Pro (annuel)",
 * "Standard (1 utilisateur)", "Licence perpetuelle". Ces chaines partaient
 * telles quelles dans les titres et meta descriptions anglaises.
 *
 * Chemin relatif attendu cote appelant : vite.config.ts importe ce module sous
 * Node pour le prerendu, donc pas de dependance a React ni a Vite ici.
 */

// Ordre significatif : les expressions les plus longues d'abord, sinon
// "licence" mangerait "licence perpetuelle".
const REPLACEMENTS: [RegExp, string][] = [
  [/licence à vie/gi, "lifetime license"],
  [/licence perpétuelle/gi, "perpetual license"],
  [/licence commerciale/gi, "commercial license"],
  [/achat unique/gi, "one-time purchase"],
  [/par siège, annuel/gi, "per seat, annual"],
  [/annuel, (\d+) sièges/gi, "annual, $1 seats"],
  [/(\d+) utilisateurs?/gi, "$1 user"],
  [/sous (\d+)M\$/gi, "under $$$1M"],
  [/plan unique/gi, "single plan"],
  [/\bmensuel\b/gi, "monthly"],
  [/\bannuel\b/gi, "annual"],
  [/\bgratuit\b/gi, "free"],
  [/\bfacturation\b/gi, "billing"],
];

/**
 * Rend un nom de plan lisible en anglais. Renvoie la chaine inchangee pour le
 * francais, et pour tout nom qui ne contient aucun des qualificatifs connus.
 */
export function localizePlanName(name: string | null | undefined, lang: string): string {
  if (!name) return "";
  if (lang !== "en") return name;
  let out = name;
  for (const [pattern, replacement] of REPLACEMENTS) out = out.replace(pattern, replacement);
  // Montant reste au format francais dans certains noms ("6,99 $") : virgule
  // decimale et espace avant le symbole, illisibles en anglais.
  out = out.replace(/(\d+),(\d{2})\s*\$/g, "$$$1.$2");
  // "Free (free)" n'apporte rien : on retire un qualificatif redondant.
  out = out.replace(/^Free \(free\)$/i, "Free");
  // Majuscule apres un separateur, sinon "Open source / free".
  out = out.replace(/(\/\s*)([a-z])/g, (_, sep, c) => sep + c.toUpperCase());
  // Majuscule initiale quand le nom entier a ete traduit.
  return out.charAt(0).toUpperCase() + out.slice(1);
}
