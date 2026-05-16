# ToolTrim — Template : Page Outil

> Structure obligatoire pour chaque page `/fr/outil/[slug]`. Sprint 6.

---

## URL

Format : `/fr/outil/[slug]`

Exemple : `/fr/outil/notion`, `/fr/outil/beehiiv`, `/fr/outil/google-analytics`

---

## Structure de la page

### 1. Breadcrumb

```
Accueil > Outils > [Catégorie] > [Nom de l'outil]
```

### 2. Hero

```
[Logo de l'outil]
[Nom H1]                     ex: "Notion"
[Tagline éditorial]          ex: "Le workspace tout-en-un pour les équipes qui pensent en blocs"
[Badges]                     ex: "Freemium" · "SaaS" · "Productivité"
[Prix d'entrée]              ex: "Gratuit · Pro à partir de 10$/mois"
[Lien CTA]                   "Voir Notion →" (lien officiel)
```

### 3. Notre avis

Section éditoriale = élément de différentiation ToolTrim :

```
## Notre avis sur [Outil]
[Paragraphe 100–200 mots — verdict tranché]

✅ Idéal pour :
- [cas d'usage 1]
- [cas d'usage 2]
- [cas d'usage 3]

❌ Pas adapté si :
- [limite 1]
- [limite 2]
```

### 4. Tableau pricing

| Plan | Prix | Ce qui est inclus |
|------|------|-------------------|
| Gratuit | 0€ | [Features principales] |
| Pro | 10$/mois | [Features pro] |
| Business | 18$/mois par user | [Features business] |

_Pricing vérifié en [mois année]_

### 5. Stacks qui incluent cet outil

```
## [Nom de l'outil] dans les stacks ToolTrim
[3–6 cards de stacks qui utilisent cet outil, filtrées depuis stacks.ts]
```

### 6. Comparatifs de cet outil

```
## Comparer [Nom de l'outil]
[Chips vers les comparatifs qui impliquent cet outil]
```

Exemple pour Notion :
- Notion vs Airtable
- Notion vs Obsidian
- Notion vs Confluence

### 7. Alternatives

```
## Alternatives à [Nom de l'outil]
[3–4 cards d'outils alternatifs avec lien]
```

### 8. Intégrations clés

```
## [Nom de l'outil] s'intègre avec
[Grille d'icônes d'outils intégrés — données issues du champ integrations]
```

### 9. Footer éditorial

```
Catégorie : [Catégorie] · [Sous-catégorie]
Dernière vérification du pricing : [mois année]
[Lien "Signaler une information incorrecte"]
```

---

## Template données `tools.ts`

```typescript
{
  id: "notion",
  name: "Notion",
  tagline: "Le workspace tout-en-un pour les équipes qui pensent en blocs",
  taglineEn: "The all-in-one workspace for teams that think in blocks",
  category: "productivity",
  subcategory: "note-taking",
  tags: ["wiki", "base-de-connaissance", "gestion-de-projet", "collaboration"],
  hasFree: true,
  startingPrice: 0,
  pricingUrl: "https://notion.so/pricing",
  verdict: "Notion est imbattable pour centraliser sa knowledge base et son éditorial. Mais sa courbe d'apprentissage est réelle, et il devient lent sur des bases > 10 000 pages. Pour de la pure gestion de données relationnelles, Airtable gagne.",
  bestFor: [
    "Centraliser sa documentation et ses process",
    "Gérer un calendrier éditorial",
    "Créer une knowledge base d'équipe",
    "Onboarding de nouveaux collaborateurs",
  ],
  notFor: [
    "Gérer des bases de données relationnelles complexes",
    "Des équipes qui ont besoin de reporting avancé",
  ],
  alternatives: ["airtable", "obsidian", "confluence", "coda"],
  url: "https://notion.so",
  logoUrl: "https://notion.so/favicon.ico",
  updatedAt: "2026-05-16",
  featured: true,
}
```

---

## Checklist éditoriale avant publication

- [ ] `id` en kebab-case, correspond au slug dans `comparisons.ts` et `stacks.ts`
- [ ] `tagline` : max 10 mots, pas de superlatifs creux
- [ ] `verdict` : mention d'une limite réelle, pas seulement positif
- [ ] `bestFor` : 2–4 items, chacun < 60 caractères, commence par un verbe
- [ ] `notFor` : 1–3 items, honnêtes et spécifiques
- [ ] `alternatives` : slugs valides dans `tools.ts`
- [ ] Pricing vérifié manuellement (pas de copié-collé sans vérification)
- [ ] `updatedAt` = date de vérification du pricing
- [ ] Logo : SVG ou PNG haute résolution, hébergé localement si possible
- [ ] Meta title : "[Nom outil] — Avis, prix et alternatives [Année] | ToolTrim"
- [ ] Meta description : 155 caractères, mentionne catégorie + verdict principal

---

## Règles de contenu éditorial

### Verdict
- Toujours mentionner UNE vraie limite de l'outil
- Ne pas copier la description officielle du produit
- Parler en termes de cas d'usage, pas de features abstraites

### Pricing
- Toujours vérifier le pricing sur le site officiel avant publication
- Indiquer si le pricing a changé récemment (ex: "Mise à jour : augmentation de 20% en janvier 2026")
- Ne jamais extrapoler un pricing non vérifié

### Alternatives
- Minimum 2 alternatives, maximum 5
- Toujours expliquer pourquoi chaque alternative est pertinente (dans le contenu de la page, pas juste un lien)

### Stacks liées
- Si aucune stack n'utilise encore cet outil : ne pas afficher la section (hide conditionnellement)
- Si > 6 stacks : afficher les 6 premières par recommandation puis "Voir toutes les stacks →"

---

## Catégories d'outils

| Catégorie | Exemples |
|-----------|---------|
| `productivity` | Notion, Airtable, Obsidian, ClickUp |
| `marketing` | Beehiiv, Mailchimp, Kit (ex-ConvertKit), Brevo |
| `dev` | GitHub, Vercel, Supabase, Railway |
| `design` | Figma, Canva, Framer, Webflow |
| `ops` | Zapier, Make, n8n, Airtable |
| `ai` | Claude, ChatGPT, Perplexity, Cursor |
| `finance` | Pennylane, Stripe, Qonto |
| `communication` | Slack, Loom, Linear, Notion |

---

_Dernière mise à jour : 2026-05-16_
