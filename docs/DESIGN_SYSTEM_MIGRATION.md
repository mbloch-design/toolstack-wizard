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

## État publié de la branche — 29 octobre 2026

Implémentation en cours de validation, pas une clôture de la remise à plat.

- Cascade native en place ; plugin `legacyCssCascade` et extraction critique historique supprimés. Entrée CSS réduite à une liste explicite de modules et tokens fondamentaux consolidés. 537 déclarations strictement redondantes retirées sans déplacer leurs règles.
- Primitives communes autonomes ; back-office complet, comptes et contrôles génériques Ma Stack migrés. Anciennes familles génériques `tt-button-*`, `ac-button`, `ba-button`, `mk-button/link/segmented`, ancien Segmented motion et champs génériques copiés retirés des consommateurs et de leurs styles remplacés. Les cartes, radios, choix et graphiques métier restent spécialisés.
- Documentation active unifiée ; contrôle AST des imports, classes copiées, tokens, surcharges directes et indirectes des primitives. Les anciens budgets agrégés sont remplacés par des exceptions exactes, par propriétaire et condition de retrait ; aucune suppression ailleurs ne finance une nouvelle violation.
- Premier build intégré complet : PASS, y compris SEO, routage, compactage et budgets. CSS critique mutualisé : 44 variantes, ensemble CSS 11,4 Mio ; aucune hausse des budgets. La correction mémoire d’externalisation est couverte par un test de charge sous 96 Mio.
- Dernière comparaison du build : 26/32 références passent. Six écarts restent ouverts : Soumettre mobile FR/EN (CTA du plan : 48/13px contre 52/15px) et Ma Stack FR/EN mobile/desktop (lien texte devenu plus haut et contrôle de tri). Le contrat de référence n’a pas été réenregistré pour masquer ces écarts.
- Revue : corrections de l’alignement des icônes, du mouvement réduit, des métadonnées compactes et des surcharges de couleur/taille partagées implémentées et testées. Contrôle final stable du thème compte et du parcours usage à hauteur700 encore requis ; les essais avec HMR ont enregistré une erreur de contexte Provider.

Cette branche peut être poussée pour sauvegarde et revue. La fusion et la mise en production de la remise à plat restent conditionnées aux écarts rendus et à la vérification finale de l’état exact à publier.
