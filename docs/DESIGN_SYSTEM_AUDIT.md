# Audit structurel du design system ToolTrim

État inspecté le 27 octobre 2026, commit `ea96a2031874603b065e9b3681364fe1be95c48e`. Audit de sources et de compilation ; aucune refonte ni conformité visuelle globale n'est déclarée livrée par ce document.

## Conclusion

Le retour des anciens styles est rendu possible par l'architecture actuelle. Le projet possède des tokens et des composants, mais pas de contrat unique qui rende leur réutilisation autonome, prédictible et obligatoire. Le back-office rend cette dette visible ; il n'en est pas la seule origine.

Trois analyses en lecture seule ont été croisées : cascade/build, composants/consommateurs et documentation/contrôles. Les causes centrales ont été reproduites dans le checkout par le coordinateur.

## Causes vérifiées

### 1. La compilation préserve la priorité historique

`postcss.config.js:5` exécute `legacyCssCascade()` après Tailwind. `scripts/lib/legacy-css-cascade.mjs:14-23` sort le contenu de `theme`, `base`, `components`, `utilities`, puis le place avant les règles hors couche. Une correction ajoutée à la fin du fichier source dans `@layer components` peut ainsi être émise avant une ancienne règle hors couche.

Reproduction exécutée avec PostCSS et le véritable plugin :

```css
/* source */
.probe { color: red }
@layer components { .probe { color: green } }

/* sortie réelle */
.probe { color: green }
.probe { color: red }
```

Cas actif : `.ms-page .mf .mf-grid` apparaît à partir de `src/index.css:38850` hors couche et à `:41134` dans une couche, avec `!important` pour faire passer la correction. Le consommateur est `src/components/stack/StackFindings.tsx:304`.

### 2. Le back-office emprunte plusieurs systèmes métier

| Usage actuel | Source réelle | Conséquence |
| --- | --- | --- |
| Enveloppe du back-office | `BackOfficePage.tsx:1341-1348`, classes `bo-shell ms-page` | L'apparence interne dépend de la présence d'un ancêtre Ma Stack. |
| Boutons d'administration et catalogue | `StackKit.tsx:126-129`, `AccountsDashboard.tsx:255`, `CatalogEditor.tsx:432` | Mélange de `mk-button`, `tt-button-*` et styles de page, parfois copiés sans composant React. |
| Navigation interne | `AccountsDashboard.tsx:272-284` | Utilisation directe du sélecteur métier `mk-segmented`. |
| En-tête et liens | `AccountsDashboard.tsx:299`, `BackofficeOverview.tsx:4` | Emprunts aux familles compte et Ma Stack. |
| Diagnostic historique accessible | `AccountsDashboard.tsx:286-293`, `BackOfficePage.tsx:1352` et suivantes | Coexistence de `ba-button`, utilities Tailwind et composants du kit Stack. |

Les styles `.ms-page .mk-button.tt-button-*` à `src/index.css:35624-35630` modifient la géométrie et les couleurs du composant réutilisé. Le commentaire à `:40853` confirme que cette dépendance est intentionnelle dans l'implémentation actuelle. Ce n'est donc pas un simple oubli de classes sur un écran.

Les formulaires reproduisent cette fragmentation : `.ac-form`, `.ba-login-field`, `.bo-search-field` et `.bo-catalog-field` ont des définitions autonomes (`index.css:37755`, `:37913`, `:40909`, `:40940`).

### 3. Les références actives se contredisent

- `AGENTS.md:47-48` reproduit l'ancienne palette ; `docs/DESIGN_SYSTEM.md:50-60` la déclare remplacée et reconnaît que des spécifications obsolètes restent dans le même document.
- `DESIGN_SYSTEM.md:1693-1716` prescrit à la fois des cartes avec ombre/rayon 22 et sans ombre/rayon 14, ainsi que des boutons pilule et des boutons rayon 10.
- `:307-309` interdit l'ancien panneau de hero `.sd-snapshot`, mais `:1006-1027` en donne encore une spécification prescriptive.
- `:158-160` et `:290` donnent des échelles de titres de section différentes ; `:162` parle de Lucide tandis que `AGENTS.md:55` et `:1409` imposent Iconoir.
- `DESIGN.md` et `CLAUDE.md` renvoient déjà vers les références communes. Le défaut réside notamment à l'intérieur des documents désignés comme autorité.

### 4. Les tokens ne garantissent pas une sémantique unique

Dans le même `:root`, `--radius-2xl` vaut `1.5rem` à `index.css:130`, puis `28px` à `:138`. La seconde définition gagne. Le kit Ma Stack utilise ce token via `--ms-r` à `:35573`.

Le projet cumule une échelle `--radius-*`, une échelle `--tt-radius-*`, des rayons métier et des noms Tailwind dont certains commentaires ne correspondent plus aux valeurs réelles (`tailwind.config.ts:107-111`). Les variations de thème et de breakpoint peuvent être légitimes ; elles ne doivent pas être confondues avec cette redéfinition inconditionnelle.

### 5. Le premier rendu possède une seconde approximation de la cascade

`vite.config.ts:2587-2618` extrait des règles critiques en parcourant les classes du HTML, au lieu de conserver l'ordre global du CSS compilé. L'indexeur à `:2533-2583` reconnaît un sous-ensemble de sélecteurs et de contextes. `extractCriticalCss`, à `:2438-2495`, constitue séparément une base depuis la source.

Exemple déduit de la boucle d'extraction : `.a{color:red}.b{color:blue}` et `class="b a"` peuvent produire `.b{color:blue}.a{color:red}` dans l'extrait critique. La priorité initiale peut donc différer de celle de la feuille complète. Ce scénario doit devenir une régression exécutée contre l'extracteur réel avant modification.

Retirer immédiatement le plugin de compatibilité ou introduire des couches natives sans migrer ces lecteurs serait dangereux : les règles imbriquées dans de nouvelles couches pourraient être ignorées.

### 6. Les contrôles actuels ne vérifient pas le contrat de design

`validate-design-tokens.mjs` contrôle principalement des nombres agrégés de littéraux ; les définitions de propriétés personnalisées sont exclues (`:68-71`). Il ne garantit ni le composant employé, ni son autonomie, ni les états, ni la priorité calculée. Une suppression ailleurs peut financer une nouvelle violation ; transformer une valeur en token ad hoc suffit à la sortir du compte.

Exécution vérifiée : le contrôle passe avec 121 occurrences de couleurs CSS, 164 rayons CSS, 12 couleurs TSX, 0 rayon TSX et 84 lignes de styles inline. La baseline autorise respectivement 130, 221, 15, 0 et 100. Ces nombres ne mesurent pas la cohérence d'un bouton.

La configuration Playwright standard lance Vite en développement si aucune URL externe n'est donnée (`playwright.config.ts:23-29`). Un build effectué avant ces tests ne prouve pas que ceux-ci observent le CSS de production.

## État quantitatif indicatif

Mesures PostCSS de la source : environ 41 179 lignes, 1,70 Mo, 11 332 règles hors étapes d'animations, dont 4 737 dans des couches et 6 595 hors couche ; 516 déclarations `!important`. 1 791 chaînes de sélecteurs sont répétées ; `.ms-page .mf .mf-grid` apparaît 16 fois.

Ces répétitions incluent des variantes responsive et d'état légitimes. Ce sont des indicateurs de dispersion, pas une liste de suppressions automatiques.

## Ce qui ne doit pas être supprimé aveuglément

- Le diagnostic historique est accessible : préserver ses fonctions ou décider explicitement de son retrait produit avant de le débrancher.
- `.sd-faq-*` est encore utilisé par `StackDetailPage.tsx:910` ; un ancien préfixe n'implique pas un code mort.
- Des classes sans correspondance JSX simple peuvent provenir des articles JSON, du prerender ou de chaînes construites dynamiquement.
- Le shell effectif est `AppShellV2` (`App.tsx:176`), pas nécessairement `Navbar.tsx`, pourtant encore cité comme header dans le guide.
- Les données catalogue, preuves éditoriales, fonctions de compte et règles d'autorisation sont hors nettoyage visuel.

## Décision proposée

Remplacer progressivement l'architecture, avec suppression des implémentations remplacées dans chaque lot. Un kit neuf posé sur les anciens styles, un nouveau nom de token ou un déplacement mécanique des 41 000 lignes ne répondrait pas au problème.

La proposition de périmètre et ses critères de fin sont dans `docs/superpowers/specs/2026-10-27-design-system-reset-design.md`. Elle attend validation ; aucun code produit n'a été modifié pour cet audit.
