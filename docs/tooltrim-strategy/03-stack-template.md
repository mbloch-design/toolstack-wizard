# ToolTrim — Template : Page Stack

> Structure obligatoire pour chaque page stack. Ne pas dévier sans validation.

---

## Structure de la page `/fr/stack/[id]`

### 1. Breadcrumb

```
Accueil > Stacks > [Persona] > [Titre de la stack]
```

### 2. Hero

```
[Eyebrow : PERSONA + STADE]          ex: "CRÉATEUR · INTERMÉDIAIRE"
[Titre H1]                           ex: "Stack Newsletter Créateur"
[Description 1 phrase]               ex: "La stack optimisée pour créer, gérer et monétiser une newsletter."
[Budget mensuel estimé]              ex: "≈ 89 €/mois"
[Tags sous-profils]                  ex: "newsletter" "copywriting"
[Badge Recommandé si applicable]
```

### 3. Outils de la stack

Format : grille de cards outils (minimum 3, maximum 8)

Chaque card contient :
- Logo de l'outil
- Nom de l'outil
- Rôle dans la stack (ex: "Base de connaissance")
- Prix indicatif (ex: "Gratuit / 8€/mois")
- Lien vers la page outil `/fr/outil/[slug]`

### 4. Pourquoi cette stack

Section éditoriale obligatoire :

```
## Pourquoi cette stack
[Paragraphe 80–150 mots]
Expliquer le choix des outils, leur complémentarité, pour quel profil exact.
Ne pas répéter la description du hero.
```

### 5. Pour qui exactement

```
✅ Idéal si tu...
- [critère 1]
- [critère 2]
- [critère 3]

❌ Pas adapté si tu...
- [critère 1]
- [critère 2]
```

### 6. Alternatives

```
## Tu pourrais aussi regarder
[2–3 stacks alternatives avec lien]
```

Format : cards horizontales avec titre + budget + lien.

### 7. Comparatifs liés

```
## Comparer les outils de cette stack
[Chips vers les comparatifs liés aux outils de la stack]
```

Ex: Si la stack inclut Notion et Airtable → lien vers `/fr/comparatif/airtable-vs-notion`

### 8. Footer éditorial

```
Dernière mise à jour : [date]
[Lien "Signaler une information incorrecte"]
```

---

## Template données `stacks.ts`

```typescript
{
  id: "createur-newsletter-intermediaire",
  title: "Stack Newsletter Créateur",
  titleEn: "Creator Newsletter Stack",
  description: "La stack optimisée pour créer, gérer et monétiser une newsletter.",
  descriptionEn: "The stack to create, manage and monetize a newsletter.",
  persona: "createur",
  stage: "intermédiaire",
  subProfiles: ["newsletter", "copywriting"],
  tags: ["email", "audience", "monetisation"],
  monthlyBudget: 89,
  recommended: true,
  updatedAt: "2026-05-16",
  tools: [
    {
      id: "beehiiv",
      name: "Beehiiv",
      role: "Plateforme newsletter",
      url: "https://beehiiv.com",
      priceLabel: "Gratuit / 39$/mois",
      required: true,
    },
    {
      id: "notion",
      name: "Notion",
      role: "Éditorial + calendrier de contenu",
      url: "https://notion.so",
      priceLabel: "Gratuit / 10$/mois",
      required: true,
    },
    {
      id: "canva",
      name: "Canva",
      role: "Visuels newsletters",
      url: "https://canva.com",
      priceLabel: "Gratuit / 15€/mois",
    },
  ],
}
```

---

## Checklist éditoriale avant publication

- [ ] `id` unique, format kebab-case `[persona]-[sous-profil]-[stade]`
- [ ] `description` : 80–120 caractères, mentionne persona + objectif
- [ ] `monthlyBudget` : arrondi au 5€ le plus proche, cohérent avec le pricing des outils
- [ ] `tools` : entre 3 et 8 outils
- [ ] Au moins 1 outil `required: true`
- [ ] Tous les `id` d'outils existent dans `tools.ts` (ou sont prévus Sprint 6)
- [ ] `updatedAt` = date du jour
- [ ] `recommended: true` uniquement si score éditorial > 4/5
- [ ] `subProfiles` alignés avec `OBJECTIVE_SUBPROFILES` dans `StacksPage.tsx`

---

## Règles de contenu éditorial

### Tone of voice
- Tutoyer le lecteur
- Commencer les critères "Idéal si" par "tu" + verbe
- Pas de bullet points avec juste des noms d'outils — toujours contextualiser le rôle

### Section "Pourquoi cette stack"
- Expliquer la complémentarité des outils, pas juste les lister
- Mentionner au moins 1 limitation / compromis honnête
- Si possible, mentionner un outil exclu et pourquoi

### Section alternatives
- Ne pas rediriger vers des stacks identiques à budget différent
- Privilégier des stacks avec une vraie différence d'approche

---

_Dernière mise à jour : 2026-05-16_
