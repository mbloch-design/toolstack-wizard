# ToolTrim — Template : Page Comparatif

> Structure obligatoire pour chaque page `/fr/comparatif/[slug-pair]`.

---

## URL et slug

Format : `/fr/comparatif/[outil-a]-vs-[outil-b]`

Règle : `outil-a` < `outil-b` alphabétiquement (tri sur le slug).

Exemple : `/fr/comparatif/airtable-vs-notion` ✅  
Exemple : `/fr/comparatif/notion-vs-airtable` ❌ → doit rediriger vers le premier

---

## Structure de la page

### 1. Breadcrumb

```
Accueil > Comparatifs > [Outil A] vs [Outil B]
```

### 2. Hero

```
[Eyebrow : COMPARATIF]
[Titre H1]                   ex: "Airtable vs Notion"
[Sous-titre]                 ex: "Lequel choisir pour ta stack ?"
[Description 1 phrase]       ex: "Le comparatif éditorial qui t'aide à décider en 5 minutes."
[Date de mise à jour]        ex: "Mis à jour en mai 2026"
```

### 3. Verdict rapide (above the fold)

Section clé — doit apparaître sans scroll :

```
🏆 VAINQUEUR : [Nom de l'outil gagnant]

[Outil A] est meilleur si :
- [keepIf[0]]
- [keepIf[1]]

[Outil B] vaut mieux si :
- [switchIf[0]]
- [switchIf[1]]
```

### 4. Tableau de scores

| Critère | [Outil A] | [Outil B] |
|---------|-----------|-----------|
| Facilité d'utilisation | ★★★★☆ (8/10) | ★★★☆☆ (7/10) |
| Richesse des features | ★★★☆☆ (7/10) | ★★★★★ (9/10) |
| Rapport qualité/prix | ★★★★☆ (8/10) | ★★★★☆ (8/10) |
| Support & documentation | ★★★☆☆ (6/10) | ★★★★☆ (8/10) |
| Intégrations | ★★★★☆ (8/10) | ★★★★☆ (8/10) |

### 5. Analyse détaillée

Structure recommandée pour le contenu long :

```
## [Outil A] — Points forts et faiblesses
[Paragraphe 150–250 mots]
- ✅ Point fort 1
- ✅ Point fort 2
- ❌ Limite 1
- ❌ Limite 2

## [Outil B] — Points forts et faiblesses
[Paragraphe 150–250 mots]
- ✅ Point fort 1
- ✅ Point fort 2
- ❌ Limite 1
- ❌ Limite 2

## Pricing comparé
[Tableau pricing simple : Free / Pro / Business]

## Cas d'usage typiques
[2–3 scenarios concrets avec recommandation claire]
```

### 6. Verdict final éditorial

```
## Notre verdict

[Outil gagnant] est le choix par défaut pour la majorité des [personas].
[2–4 phrases d'argumentation tranchée]

Mais [outil perdant] reste pertinent si [condition spécifique].
```

### 7. Stacks qui utilisent ces outils

```
## Ces stacks utilisent [Outil A] ou [Outil B]
[3–6 cards de stacks liées, avec lien]
```

### 8. Comparatifs similaires

```
## À lire aussi
[3–4 liens vers des comparatifs proches]
```

---

## Template données `comparisons.ts`

```typescript
{
  slugPair: "airtable-vs-notion",
  toolA: "airtable",
  toolB: "notion",
  title: "Airtable vs Notion",
  shortDescription: "Base de données ou wiki ? Le comparatif qui tranche.",
  verdict: {
    winner: "notion",
    keepIf: [
      "Gérer une knowledge base + contenus éditoriaux",
      "Collaborer en équipe avec du contenu riche",
      "Centraliser ta documentation et tes process",
    ],
    switchIf: [
      "Gérer des données relationnelles complexes avec vues multiples",
      "Créer des interfaces internes ou des mini-apps sur tes données",
    ],
  },
  scores: {
    airtable: { ease: 7, features: 9, price: 6, support: 7, integrations: 9 },
    notion:   { ease: 8, features: 8, price: 8, support: 8, integrations: 7 },
  },
  forPersonas: ["createur", "consultant", "ops"],
  updatedAt: "2026-05-16",
  featured: true,
}
```

---

## Checklist éditoriale avant publication

- [ ] `slugPair` au format alphabétique `a-vs-b`
- [ ] `winner` clairement défini — pas de match nul sans nuance
- [ ] `keepIf` : 2–4 items, commencent par un verbe
- [ ] `switchIf` : 1–3 items, cas d'usage spécifiques et honnêtes
- [ ] Scores cohérents avec le verdict (le gagnant ne doit pas perdre tous les critères)
- [ ] `forPersonas` : 1–3 personas pertinents
- [ ] `updatedAt` = date du jour de publication/révision
- [ ] Redirect configuré : `b-vs-a` → `a-vs-b`
- [ ] Meta title : "[Outil A] vs [Outil B] — Lequel choisir en [Année] ? | ToolTrim"
- [ ] Meta description : 155 caractères max, mentionne le gagnant et le cas d'usage principal

---

## Règles de contenu éditorial

### Verdict
- Ne jamais écrire "les deux sont bien selon les besoins" sans spécifier lesquels
- Le verdict doit trancher pour un outil par défaut
- L'outil perdant doit avoir au moins 1 cas d'usage clair où il gagne

### Scores
- Granularité : 0.5 points
- Ne pas mettre 10/10 sans justification explicite
- La somme des scores n'a pas besoin d'être équilibrée — l'honnêteté prime

### Pricing
- Toujours indiquer la date du pricing vérifié
- Ne jamais extrapoler un prix non vérifié
- Mentionner si un tier gratuit existe

### Liens
- Liens vers les outils : utiliser l'URL officielle (pas d'affiliate link non documenté)
- Liens internes : vers les stacks qui utilisent ces outils, vers les comparatifs similaires

---

_Dernière mise à jour : 2026-05-16_
