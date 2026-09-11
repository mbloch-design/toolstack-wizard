/**
 * Localise la categorie affichee d'un guide.
 *
 * La categorie est stockee en clair dans `posts-*.json` et sert a la fois de
 * libelle et de cle de filtre (`post.category === "Comparatifs"` dans
 * GuidesPage). Cote anglais, le champ avait ete rempli des deux cotes : sur 40
 * articles on trouvait "Comparatifs" et "Guides", "IA Généraliste" et
 * "AI Tools", "Productivité" et "Productivity", "Organisation" et
 * "Organization". Des pages anglaises indexees affichaient donc une categorie
 * francaise, et le meme concept existait en double dans la taxonomie.
 *
 * On traduit a l'affichage plutot que de renommer la donnee : renommer
 * casserait les filtres, qui comparent la valeur francaise.
 */

const EN_LABELS: Record<string, string> = {
  "Comparatifs": "Comparisons",
  "IA Généraliste": "General-purpose AI",
  "Productivité": "Productivity",
  "Organisation": "Organization",
  "Création & Design": "Creative & design",
  "Communication": "Communication",
  "Finance": "Finance",
  "Marketing": "Marketing",
  "Guides": "Guides",
  "Stories": "Stories",
};

export function localizeGuideCategory(category: string | null | undefined, lang: string): string {
  const value = (category || "").trim();
  if (!value || lang !== "en") return value;
  return EN_LABELS[value] ?? value;
}
