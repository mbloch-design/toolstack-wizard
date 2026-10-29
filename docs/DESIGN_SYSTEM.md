# Système de design ToolTrim

Cette référence décrit le socle actif. Les anciennes prescriptions contradictoires restent consultables dans Git ; elles ne constituent plus un catalogue de composants à copier. La migration des consommateurs restants et ses preuves sont suivies dans [DESIGN_SYSTEM_MIGRATION.md](DESIGN_SYSTEM_MIGRATION.md).

## Autorités

| Décision | Propriétaire source |
| --- | --- |
| Couleurs, échelles, typographie, thèmes et breakpoints de tokens | `src/styles/foundations.css` |
| Adaptation des tokens aux utilitaires | `tailwind.config.ts` |
| Ordre de compilation | `src/index.css` et `postcss.config.js` |
| Actions, navigation et formulaires génériques | `src/components/ui/primitives.tsx` |
| Apparence et états des primitives | `src/styles/ui.css` |
| Disposition et contenu métier | Modules propriétaires sous `src/styles/components/` et `src/styles/domains/` |
| Icônes | `src/lib/icons.tsx` (Iconoir centralisé) |

Un token n’est pas redéfini dans une page pour obtenir une autre apparence. Les variantes de thème et de breakpoint gardent leur contexte. Les familles HSL utilisées par les utilitaires et les couleurs sémantiques CSS ne sont pas interchangeables : ne pas appliquer `hsl()` à un token hexadécimal.

## Ajouter un contrôle

Importer depuis `@/components/ui/primitives`. Un contrôle générique ne dépend jamais de StackKit, d’une page compte ni d’un ancêtre admin. La page décide de sa place ; le socle décide de sa forme et de ses états.

```tsx
import { Button, ButtonLink, Field, Input } from '@/components/ui/primitives';

<Field label="Nom" help="Nom visible dans le catalogue">
  <Input name="name" required />
</Field>
<Button type="submit" variant="primary" loading={saving}>Enregistrer</Button>
<ButtonLink to="/fr/tools">Voir le catalogue</ButtonLink>
```

| Besoin | Contrôle | Contrat |
| --- | --- | --- |
| Déclencher une action | `Button` | `type="button"` par défaut ; submit/reset explicites ; props et ref natifs |
| Naviguer avec apparence de bouton | `ButtonLink` | Vrai lien ; navigation modifiée et ouverture native conservées |
| Naviguer discrètement | `TextLink` | Destination obligatoire ; pour une action sur place, Button quiet |
| Action avec icône seule | `IconButton` | Nom accessible obligatoire ; icône décorative |
| Saisie | `Input`, `Select`, `Textarea` | Valeur, nom, ref et attributs natifs ; apparence détenue par le socle |
| Label, aide et erreur | `Field` | IDs stables, descriptions cumulées, état invalide et message d’erreur associés |
| Sections / filtre | `Segmented` | Mode tabs : un arrêt clavier, flèches/Home/End ; toggle : boutons avec état pressed |
| Ouvrir un élément de liste | `ActionRow` | Action native, texte, détail, valeur et chevron ; attente/disabled conservés |
| Surface, titre et actions | `Surface`, `PageHeader`, `Toolbar` | Structure et reflow, sans emprunter un kit métier |

Une action désactivée ou en attente ne déclenche ni callback ni soumission. Un lien bloqué n’expose pas de destination navigable. Ne pas remplacer ces contrôles par un div cliquable.

## Variantes explicites

- `variant` : `primary`, `secondary`, `quiet`, `danger`. La hiérarchie découle de l’action ; une couleur différente n’est pas un nouveau composant.
- `size` : défaut 44 px minimum ; `compact` 40 px minimum. Une taille compacte est un choix explicite du consommateur.
- `appearance` : défaut pour l’administration ; `stack`, `account`, `public` pour préserver les formes approuvées de ces parcours. Ces adaptations sont définies dans le socle, jamais par `.ms-page .ui-button` ou une surcharge locale.
- Les liens texte, contrôles spécialisés et réponses métier gardent leur sémantique propre. Les cartes de diagnostic, graphiques, jauges et choix entre deux outils restent des composants métier ; ils ne définissent pas le bouton générique du site.

Les libellés longs doivent rester lisibles sans largeur minimale arbitraire ; les actions se réorganisent dans une Toolbar ou un PageHeader. Le focus reste visible. Les animations de contrôle respectent `prefers-reduced-motion`.

## Typographie et couleurs

Les familles actives sont `--font-brand` (Uncut Sans) pour l’expression de marque et `--font-ui` (Inter Tight) pour l’interface. Les échelles `--tt-size-*`, `--space-*` et `--radius-*` sont détenues par les fondations ; ne pas recréer une liste de valeurs dans un guide ou un composant.

Utiliser les rôles `--color-text`, `--color-text-secondary`, `--color-text-meta`, `--color-bg`, `--color-surface`, `--color-surface-soft` et `--color-border`. Les couleurs de statut, graphiques et contenus éditoriaux ont des rôles nommés. Elles ne changent pas la hiérarchie globale des actions. Les pages outils conservent leurs CTA en encre ; aucun nouveau bouton bleu n’est introduit par défaut.

Il n’existe pas de rayon universel imposé à toutes les cartes métier. Une surface, un champ, un logo d’application et une carte de décision n’ont pas la même fonction. Leurs valeurs sont explicites chez leur propriétaire, pas héritées d’une ancienne page.

## Cascade et propriété

L’entrée CSS déclare `theme, base, components`. Preflight et fondations sont dans base. Les styles applicatifs et les utilitaires générés partagent components, avec un ordre d’import explicite qui conserve leur spécificité. Les règles importantes applicatives restent dans cette même couche : créer une couche supplémentaire peut inverser leur priorité.

Les fichiers `components/` puis `domains/` correspondent aux étapes ordonnées des sources existantes. Ne pas trier leurs imports alphabétiquement. Une migration supprime les déclarations remplacées au lieu d’ajouter une passe à la fin de l’entrée. `ui.css` est le propriétaire des primitives, sans ancêtre métier ni règle de compatibilité.

Le CSS critique est extrait de l’AST compilé, dans le même ordre, avec les contextes layer/media/supports et les dépendances. Le premier affichage et la feuille complète suivent la même cascade. Le plugin historique qui retirait les couches est supprimé ; aucun nouvel aplatisseur ne le remplace.

Les classes éditoriales peuvent être présentes dans les JSON ou construites dynamiquement. Une recherche JSX vide ne prouve pas qu’une classe est morte. Le diagnostic historique du back-office est maintenu.

## Vérification

- Tester les interactions, la sémantique native, les erreurs et les attentes pour les parcours touchés.
- Compiler le build complet, jusqu’aux audits de l’artefact et au code de sortie final.
- Comparer le rendu sur preview produit avec `playwright.design-system.config.ts` : FR/EN, 390 et 1440 px. La référence antérieure à la migration ne se réenregistre pas pour masquer une différence.
- Vérifier aussi focus, thèmes existants, mouvement réduit et état de consentement ; les 32 références de contrôle ne constituent pas à elles seules une validation de toute l’application.
- Suivre les suppressions et les exceptions dans l’inventaire de migration. Une famille remplacée ne reste pas une seconde solution recommandée.

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour le shell, les routes et le build, et [AGENTS.md](../AGENTS.md) pour le workflow commun.
