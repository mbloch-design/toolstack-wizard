# ToolTrim — Règles éditoriales

> La voix de ToolTrim. Ce document s'applique à tout contenu publié sur le site.

---

## Principes fondamentaux

1. **Opinion tranchée** — ToolTrim a un avis. On ne publie pas "ça dépend" sans expliquer de quoi ça dépend exactement.
2. **Honnêteté non négociable** — On mentionne les limites des outils qu'on recommande. Toujours.
3. **Contextualisation** — Chaque recommandation est liée à un persona, un budget, un objectif.
4. **Mise à jour datée** — Chaque page affiche sa date de dernière révision. Le contenu non révisé depuis 12 mois doit être revu.
5. **Zéro langue de bois** — Pas de "solution robuste et flexible", pas de "outil puissant adapté à tous".

---

## Ton et voix

### Register

| Contexte | Ton |
|----------|-----|
| Recommandations | Direct, assertif — "Notion est le meilleur choix pour..." |
| Limites / critiques | Honnête, factuel — "Notion devient lent au-delà de 10 000 pages" |
| Verdicts | Tranché mais nuancé — "Gagnant : Notion. Sauf si tu..." |
| Onboarding / tooltips | Chaleureux, concis |
| Erreurs / états vides | Bienveillant, actionnable |

### Règles de tutoiement

- Toujours tutoyer : "tu", "ton", "ta stack", "tes outils"
- Jamais "vous" ni "votre" dans le contenu éditorial
- Exception : communications légales ou formulaires officiels

### Ce qu'on dit / ce qu'on ne dit pas

| ✅ On dit | ❌ On ne dit pas |
|----------|-----------------|
| "La stack juste pour toi" | "La meilleure stack du marché" |
| "Notion est idéal si tu centralises ton éditorial" | "Notion est l'outil ultime de productivité" |
| "Airtable gagne sur les données relationnelles" | "Airtable a de nombreuses fonctionnalités avancées" |
| "Budget estimé : 89€/mois" | "À partir de quelques euros par mois" |
| "Mis à jour : mai 2026" | (pas de date ou date floue) |
| "Limite : devient lent sur grandes bases" | "Quelques petits inconvénients mineurs" |

---

## Mots à éviter absolument

| Mot / expression | Pourquoi |
|-----------------|---------|
| "solution" | Mot corporate, vague |
| "robuste" | Surutilisé, ne veut rien dire |
| "flexible" | Idem |
| "puissant" | Superlatif vide |
| "intuitif" | Subjectif, chaque outil se dit intuitif |
| "tout-en-un" | Sauf si c'est vraiment factuel (ex: Notion) |
| "révolutionnaire" | Jamais |
| "game-changer" | Jamais |
| "best-in-class" | Jamais |
| "cliquez ici" | Inacceptable dans un lien |
| "en savoir plus" | Remplacer par un lien descriptif |

---

## Vocabulaire ToolTrim obligatoire

Utiliser ces termes de façon cohérente sur tout le site :

| Terme ToolTrim | Ne pas utiliser |
|---------------|----------------|
| stack | "sélection d'outils", "liste d'outils" |
| persona | "type d'utilisateur", "profil" (sauf si explication) |
| stade | "niveau", "niveau de maturité" (dans le contenu texte) |
| verdict | "notre avis" (dans les données), "avis" (dans le contenu) |
| comparatif | "comparison" (en FR), "versus" |
| sous-profil | "spécialisation" |
| budget mensuel | "coût mensuel", "tarif", "prix" |

---

## Structure des textes

### Titres

- H1 : toujours inclure le nom de la page + mot-clé principal
- H2 : navigables, descriptifs, pas de questions rhétoriques sans réponse
- H3 : sous-sections, pas d'abus

Format H1 :
- Stack : "Stack [Persona] [Sous-profil]" — ex: "Stack Créateur Newsletter"
- Comparatif : "[A] vs [B]" — ex: "Notion vs Airtable"
- Outil : "[Nom de l'outil]" — ex: "Notion"
- Guide : "[Objectif] — Guide [Année]" — ex: "Créer du contenu — Guide 2026"

### Paragraphes

- 3–5 phrases maximum par paragraphe
- 1 idée par paragraphe
- Pas de paragraphe > 100 mots dans les verdicts
- Retour à la ligne entre chaque paragraphe (pas de blocs denses)

### Listes

- Bullet lists : 2–6 items maximum
- Chaque item commence par le même type grammatical (verbe, nom, adjectif)
- Pas d'item > 15 mots

### Tableaux

- Utiliser pour les comparaisons de pricing et de scores
- Maximum 6 colonnes
- Header de colonne court (< 20 caractères)

---

## Dates et mises à jour

### Affichage

- Format : "mai 2026" (mois en français, pas de numéro)
- Afficher : "Mis à jour en [mois année]" sous le titre
- Dans les données : `updatedAt: "2026-05-16"` (ISO 8601)

### Politique de révision

| Type de contenu | Révision obligatoire |
|----------------|---------------------|
| Pricing d'outil | Tous les 6 mois |
| Verdict comparatif | Tous les 12 mois |
| Stack (outils inclus) | Tous les 12 mois |
| Guide | Tous les 12 mois |
| Checklist SEO | Tous les 6 mois |

---

## Gestion des informations non vérifiées

- **Prix non vérifiés** : ne pas publier. Chercher sur le site officiel.
- **Features annoncées mais pas encore disponibles** : ne pas inclure dans les verdicts
- **Témoignages utilisateurs** : citer la source exacte (pas de "certains utilisateurs disent")
- **Statistiques** : toujours citer la source et la date

---

## Liens et références

### Liens internes

Voir `09-internal-linking.md` pour les règles complètes.

Principes :
- Ancre descriptive : "voir notre comparatif Notion vs Airtable" ✅
- Pas de "cliquez ici" ❌
- Pas de "en savoir plus" sans sujet ❌

### Liens externes

- Liens vers les sites officiels des outils : toujours
- Liens vers des sources tierces : uniquement si fiables et récents (< 2 ans)
- Pas de liens vers des forums ou Reddit sans vérification
- Affiliate links : `rel="sponsored"` + disclosure en début de page si applicable

---

## Checklist éditoriale finale

Avant publication de tout contenu :

```
[ ] Opinion tranchée : le verdict est clair, pas de "ça dépend" sans suite
[ ] Limites mentionnées : au moins 1 vraie limite de l'outil/stack recommandé
[ ] Persona cible précisé : pas de recommandation universelle
[ ] Budget indiqué : montant chiffré, pas de "abordable"
[ ] Date vérifiée : pricing et features vérifiés sur le site officiel
[ ] Tutoiement partout
[ ] Aucun mot interdit de la liste
[ ] Liens internes pertinents ajoutés (minimum 2)
[ ] Lien externe vers le site officiel de l'outil
[ ] updatedAt mis à jour dans les données
[ ] Meta title et description conformes au format
```

---

_Dernière mise à jour : 2026-05-16_
