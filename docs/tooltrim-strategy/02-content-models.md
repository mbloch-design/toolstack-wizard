# ToolTrim — Modèles de données (Content Models)

> Référence technique et éditoriale pour toutes les entités de données du site.

---

## 1. Stack

Fichier source : `src/data/stacks.ts`

```typescript
interface Stack {
  // Identité
  id: string;               // slug unique, ex: "createur-newsletter-intermediaire"
  title: string;            // Titre éditorial FR, ex: "Stack Newsletter Créateur"
  titleEn: string;          // Titre EN
  description: string;      // Description FR (1–2 phrases, 80–120 caractères)
  descriptionEn: string;    // Description EN

  // Classification
  persona: StackPersona;    // "createur" | "consultant" | "designer" | "developpeur" | "ops" | "solo"
  stage: StackStage;        // "débutant" | "intermédiaire" | "avancé"
  subProfiles: string[];    // Sous-profils couverts, ex: ["newsletter", "copywriting"]
  tags: string[];           // Tags libres pour affichage

  // Budget
  monthlyBudget: number;    // Coût mensuel estimé en €
  budgetLabel?: string;     // Label override si besoin

  // Outils
  tools: StackTool[];       // Liste des outils composant la stack
  
  // Éditorial
  recommended?: boolean;    // True = badge "Recommandé par ToolTrim"
  updatedAt?: string;       // Date de dernière révision "YYYY-MM-DD"
}

interface StackTool {
  id: string;               // Slug de l'outil, ex: "notion"
  name: string;             // Nom affiché
  role: string;             // Rôle dans la stack, ex: "Base de connaissance"
  url?: string;             // URL officielle
  priceLabel?: string;      // Ex: "Gratuit", "9$/mois", "Freemium"
  required?: boolean;       // Outil indispensable de la stack
}
```

### Règles éditoriales Stack

- `id` : format `[persona]-[sous-profil]-[stade]`, tout en kebab-case
- `title` : max 60 caractères, commence par "Stack"
- `description` : doit mentionner le persona et l'objectif principal
- `monthlyBudget` : arrondi au multiple de 5 le plus proche
- `tools` : minimum 3 outils, maximum 8
- `recommended` : réservé aux stacks validées éditoriales avec score > 4/5

---

## 2. Tool (Outil)

Fichier source : `src/data/tools.ts` _(à créer, Sprint 6)_

```typescript
interface Tool {
  // Identité
  id: string;               // Slug unique, ex: "notion"
  name: string;             // Nom officiel, ex: "Notion"
  tagline: string;          // FR: phrase courte de positionnement
  taglineEn: string;        // EN

  // Classification
  category: ToolCategory;   // "productivity" | "marketing" | "dev" | "design" | "ops" | "ai"
  subcategory?: string;     // Ex: "note-taking", "crm", "email-marketing"
  tags: string[];           // Tags libres

  // Pricing
  hasFree: boolean;         // Tier gratuit disponible
  startingPrice?: number;   // Prix d'entrée en $ ou €/mois
  pricingUrl?: string;      // URL page pricing officielle

  // Contenu éditorial
  verdict: string;          // Avis tranché ToolTrim (2–3 phrases)
  bestFor: string[];        // Cas d'usage recommandés (2–4 items)
  notFor: string[];         // Cas d'usage déconseillés (1–3 items)
  alternatives: string[];   // Slugs d'outils alternatifs

  // Liens
  url: string;              // URL officielle
  logoUrl?: string;         // URL logo (SVG préféré)

  // Méta
  updatedAt: string;        // "YYYY-MM-DD"
  featured?: boolean;       // Apparaît dans les listings prioritaires
}

type ToolCategory = "productivity" | "marketing" | "dev" | "design" | "ops" | "ai" | "finance" | "communication";
```

### Règles éditoriales Tool

- `id` : kebab-case, pas d'accents, ex: "google-analytics"
- `tagline` : 10 mots maximum
- `verdict` : avoir une opinion — positif ET négatif
- `bestFor` : maximum 4 items, chacun < 60 caractères
- `alternatives` : minimum 2 slugs valides dans `tools.ts`
- `updatedAt` : mettre à jour lors de chaque révision du pricing ou des features

---

## 3. Comparison (Comparatif)

Fichier source : `src/data/comparisons.ts`

```typescript
interface Comparison {
  // Identité
  slugPair: string;         // "outil-a-vs-outil-b" (alphabétique)
  toolA: string;            // Slug outil A
  toolB: string;            // Slug outil B
  title?: string;           // Titre éditorial override
  shortDescription?: string; // Description courte pour cards

  // Verdict éditorial
  verdict: {
    winner: string;         // Slug du gagnant global
    keepIf: string[];       // Raisons de choisir le gagnant (2–3 items)
    switchIf: string[];     // Quand switcher vers le perdant (1–2 items)
  };

  // Scores (0–10)
  scores: {
    [toolSlug: string]: {
      ease: number;         // Facilité d'utilisation
      features: number;     // Richesse des fonctionnalités
      price: number;        // Rapport qualité/prix
      support: number;      // Support et documentation
      integrations: number; // Écosystème d'intégrations
    };
  };

  // Personas recommandés
  forPersonas: StackPersona[];

  // Méta
  updatedAt: string;        // "YYYY-MM-DD"
  featured?: boolean;       // Comparatif mis en avant
}
```

### Règles éditoriales Comparison

- `slugPair` : toujours `outil-a-vs-outil-b` avec A < B alphabétiquement
- `winner` : obligatoire — pas de "les deux sont bons" sans nuance
- `keepIf` : commencer par un verbe à l'infinitif ("Gérer...", "Créer...", "Collaborer...")
- Scores sur 10, granularité 0.5
- `forPersonas` : minimum 1, idéalement 2–3

---

## 4. Guide

Fichier source : `src/data/guides.ts` _(à créer, Sprint 7)_

```typescript
interface Guide {
  // Identité
  id: string;               // "creer-du-contenu", "vendre-en-ligne", etc.
  title: string;            // Titre FR H1
  titleEn: string;
  description: string;      // Meta description FR (155 caractères max)
  descriptionEn: string;

  // Classification
  objective: StackFacetObjective; // Lien avec la facette objectif
  
  // Contenu (MDX ou structure JSON)
  sections: GuideSection[];
  
  // Relations
  recommendedStacks: string[];    // Slugs de stacks recommandées
  featuredTools: string[];        // Slugs d'outils mis en avant
  relatedComparisons: string[];   // Slugs de comparatifs liés

  // Méta
  wordCount?: number;
  readingTime?: number;           // En minutes
  updatedAt: string;
  author?: string;
}

interface GuideSection {
  id: string;               // Ancre HTML
  title: string;            // Titre H2
  content: string;          // Contenu Markdown
  type?: "intro" | "how-to" | "comparison" | "recommendation" | "faq";
}
```

---

## 5. AuditResult (Audit de stack)

À créer pour Sprint 8.

```typescript
interface AuditResult {
  // Session
  sessionId: string;        // UUID généré côté client
  createdAt: string;        // ISO timestamp

  // Inputs utilisateur
  persona: StackPersona;
  objective: StackFacetObjective;
  budget: StackFacetBudget;
  complexity: StackFacetComplexity;
  currentTools?: string[];  // Outils déjà utilisés (optionnel)

  // Recommandations
  recommendedStacks: string[];  // Slugs triés par pertinence
  score: number;                // Score de confiance 0–100

  // Partage
  shareUrl?: string;        // URL partageable avec params encodés
}
```

---

## Relations entre entités

```
Stack ─── contient ───> Tool (via StackTool.id)
Stack ─── classifiée par ───> StackPersona, StackStage
Comparison ─── référence ───> Tool × 2
Guide ─── recommande ───> Stack[], Tool[], Comparison[]
AuditResult ─── génère ───> Stack[] (recommandations)
Tool ─── a des alternatives ───> Tool[]
```

---

## Conventions de slugs

| Entité | Format | Exemple |
|--------|--------|---------|
| Stack | `[persona]-[sous-profil]-[stade]` | `createur-newsletter-intermediaire` |
| Tool | nom officiel kebab-case | `google-analytics`, `notion` |
| Comparison | `[tool-a]-vs-[tool-b]` alphabétique | `airtable-vs-notion` |
| Guide | objectif kebab-case | `creer-du-contenu` |
| Persona | français kebab-case | `createur`, `developpeur` |

---

_Dernière mise à jour : 2026-05-16_
