# Titres et meta descriptions des fiches outils : brief de rédaction

Le titre et la meta description sont ce que Google affiche. Ils décident du clic. Chaque fiche publiée a quatre pages, en anglais et en français ; pour chacune on écrit un **titre** et une **meta description**.

| Clé | Page | Requête visée | Ce que le texte doit faire |
|---|---|---|---|
| `presentation` | `/tool/{slug}` | « notion », « notion avis » | Dire concrètement ce que fait l'outil, pour qui, et le signal de prix. |
| `prix` | `/tool/{slug}/pricing` (EN), `/prix` (FR) | « notion pricing », « notion prix », « is notion free » | Répondre à la question de prix : `{price}`, offre gratuite oui ou non, piège de facturation (engagement, par utilisateur, crédits). |
| `alt` | `/tool/{slug}/alternatives` | « notion alternatives » | Dire pourquoi on part (limite réelle tirée de `avoidIf` ou `cons`) et nommer 2 ou 3 alternatives de la liste. |
| `avis` | `/tool/{slug}/reviews` (EN), `/avis` (FR) | « notion review », « avis notion » | Donner le verdict : pour qui le garder, quand l'éviter. |

## Ce qui fait cliquer

1. **La requête d'abord.** Le texte commence par les mots que l'internaute tape (« Notion pricing », « Prix de Notion », « Alternatives à Keeper », « Avis Calendly »). Google les met en gras.
2. **La réponse dans les 120 premiers caractères.** Sur mobile, Google coupe vers 120. La réponse concrète (prix, gratuit ou non, verdict) doit tenir avant ; la suite est un bonus.
3. **Des faits précis plutôt que des promesses.** « {price}/mois par membre », « 90 crédits par agrandissement 2K », « facturé uniquement à l'année » valent mieux que « tous les tarifs expliqués ». Pas de fin vague du type « Our verdict. », « Pour qui, et ses limites. », « Découvrez ».
4. **La confiance.** Sur la page prix, quand `verified` existe, mentionner la vérification : « Prix vérifiés en {verified} » / « Prices checked {verified} ». Sur la page avis, on peut citer la note : « Note ToolTrim {rating} ».

## Jetons (remplacés au rendu, jamais en dur)

| Jeton | Rendu | Condition |
|---|---|---|
| `{price}` | « 9,50 € » / « $9.50 » | `price` non nul. Suivi de « /mois » / « /mo » si mensuel, « en achat unique » / « one-time » si `price.oneTime`. |
| `{verified}` | « octobre 2026 » / « October 2026 » | `verified` non nul. |
| `{rating}` | « 3,6/5 » / « 3.6/5 » | Toujours disponible : c'est la note affichée sur la fiche. |
| `{year}` | « 2026 » | Pour les titres datés. |

Jamais de prix, de note ou d'année écrits en dur : le texte doit rester juste quand la donnée change.

## Longueurs

- **Meta description : 120 à 155 caractères**, jetons remplacés. Viser 140-150.
- **Titre : 30 à 60 caractères**, jetons remplacés, **sans** « | ToolTrim » (ajouté automatiquement s'il tient). Viser 45-55 pour laisser la place à la marque.

## Règles de fond

1. **Le nom de l'outil** figure dans chaque texte, au début du titre.
2. **Gratuit** : ne dire qu'il existe une offre gratuite que si `freePlan` est `true`.
3. **Rien d'inventé.** Seuls les faits du brief sont autorisés (descriptions, verdict, avantages, limites, mise en garde, alternatives).
4. **Cas particuliers** : `lifecycle` ou `access` = `discontinued` → dire que l'outil est arrêté et orienter vers les alternatives ; `access: included` → inclus dans une suite, sans tarif autonome ; `usageBased: true` → mentionner la facturation à l'usage ou en crédits sur la page prix.
5. **Style** : phrases actives, vocabulaire de l'utilisateur. Pas de superlatifs creux, pas de « Découvrez », pas de point d'exclamation, **pas de tiret cadratin (—)**. Varier les formulations d'une fiche à l'autre.
6. **Anglais** : langue source, anglais américain naturel, ponctuation anglaise.
7. **Français** : français naturel, vouvoiement, typographie française (espace avant `:` `;` `?`).
8. **Quatre pages distinctes** : chaque titre et chaque meta répondent à leur intention, sans recopier la présentation.

## Format de sortie

```json
{ "<slug>": {
  "presentation": { "title": {"en": "...", "fr": "..."}, "meta": {"en": "...", "fr": "..."} },
  "prix": { ... }, "alt": { ... }, "avis": { ... }
} }
```

Contrôle : `npx tsx scripts/seo-meta/validate.mts <briefs.json> <metas.json>`. Application : `node scripts/seo-meta/apply.mjs <metas.json>`.

## Exemples de ton (Notion : prix 9,50 € / €9.50, offre gratuite, vérifié en septembre 2026 ; les faits doivent toujours venir du brief de l'outil)

- presentation, titre EN : `Notion: notes, docs and databases, free to start`
- presentation, meta FR : `Notion réunit notes, docs, wikis et bases de données. Gratuit en solo, payant dès {price}/mois par membre. Pour qui c'est rentable, et quand l'éviter.`
- prix, titre FR : `Prix de Notion : gratuit, puis {price}/mois par membre`
- prix, meta EN : `Notion pricing: free for solo use, then Plus at {price}/mo per seat. Page limits, annual savings and extra AI credits. Prices checked {verified}.`
- alt, titre EN : `Notion alternatives: Obsidian, Coda, ClickUp`
- avis, meta FR : `Avis Notion, note ToolTrim {rating} : à garder pour réunir docs et bases légères, à éviter pour de la gestion de projet lourde. Forces et limites.`
