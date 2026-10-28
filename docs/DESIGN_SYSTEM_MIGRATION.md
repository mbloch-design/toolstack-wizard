# Migration du système de design

Référence : [spécification approuvée](superpowers/specs/2026-10-27-design-system-reset-design.md). Cette liste suit les consommateurs réels jusqu’au retrait de leurs anciennes implémentations. Une famille encore présente n’est pas déclarée morte parce qu’une recherche JSX ne la trouve pas.

## Référence de rendu

`e2e/design-system.spec.ts` et `playwright.design-system.config.ts` contrôlent le build servi par preview, jamais le serveur de développement. La référence `e2e/fixtures/design-system-baseline.json` a été capturée avant migration : huit routes, FR/EN, 390 et 1440 px (32 visites). Elle mesure typographie, couleurs, bordures, espacements et géométrie des contrôles visibles. Les captures PNG complémentaires restent dans les artefacts locaux. Consentement refusé, état anonyme déterministe, ressources externes bloquées de manière identique.

Cette référence ne suffit pas aux états privés, aux interactions clavier ni aux contrôles sous la ligne de flottaison : ils demandent les tests ciblés de chaque lot. Une mise à jour automatique de la référence après migration ne constitue pas une validation de parité.

## Consommateurs et retraits

| Famille / propriétaire actuel | Consommateurs maintenus | Lot / condition de retrait |
| --- | --- | --- |
| `legacyCssCascade` | Compilation PostCSS de toute l’application | 4 : cascade native vérifiée contre les 32 références ; supprimer plugin et test historique |
| Extraction critique source et index de classes manuel | Plugin critique Vite et prérendu | 2 : extraction AST du CSS compilé, ordre et contextes testés |
| `mk-button`, boutons StackKit | BackOfficePage, CatalogEditor ; StackKit, StackStarter, StackFreemiumPlans, StackToolSheet, StackCostEditor | 5 puis 6 : primitives communes avec variante Stack explicite, supprimer anciennes apparences |
| Classes `mk-button tt-button-*` copiées | AccountsDashboard, AccountDetailPanel, CatalogEditor | 5 : importer Button, supprimer classes copiées |
| `ms-page` / tokens `--ms-*` empruntés par le back-office | BackOfficePage, styles `bo-*` | 5 : supprimer ancêtre et dépendance métier ; tokens neutres |
| `ac-page-header` emprunté | AccountsDashboard | 5 : PageHeader commun |
| `ba-button`, champs diagnostic / connexion | Branches maintenues BackOfficePage | 5 : actions et champs communs ; conserver les fonctions historiques |
| `ac-button`, champs compte | AccountAuthForm, AccountLifecycleDialog, AccountStackStatus, AccountSettingsPage, AccountRecoveryPage, AccountCallbackPage ; StackAccountPanel | 6 : contrôles communs, variante compte préservée |
| `tt-button-primary/secondary` génériques | ContactPage, TransparencyPage, SubmitToolPage, ComparePage ; familles ci-dessus | 7 : variante publique explicite, plus aucun consommateur avant suppression CSS |
| Boutons métier spécialisés | navigation AppShellV2, choix de diagnostic, cartes/outils, filtres et réponses Stack | 6/7 : conserver sémantique métier ; composer le socle quand générique, propriété explicite sinon |
| Classes éditoriales dynamiques | JSON de guides et de catalogue, prérendu | 7 : vérifier sources de données et construction dynamique avant suppression |
| Tokens et budget de violations agrégé | index.css, validate-design-tokens.mjs | 4/7 : propriétaire unique, scan modulaire et exceptions exactes |

## État

- Référence publique capturée ; reproduction après capture en cours de vérification.
- Extraction critique, primitives, cascade et migrations : en cours ; aucune remise à plat complète revendiquée.
- Le diagnostic historique reste une fonctionnalité active, pas du code mort.
