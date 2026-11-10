# Back-office unifié — plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à l’administration ToolTrim un menu unique, des listes prévisibles et un éditeur centré sur la fiche.

**Architecture:** `AppShellV2` garde son cadre et affiche un modèle de navigation fourni par la route d’administration. Les vues existantes gardent leurs données et sessions. Les compositions de listes, d’en-tête et d’édition réutilisent les molécules de `src/ds`.

**Tech Stack:** React 18, React Router, TypeScript, CSS Modules, Storybook et Playwright.

**Spec:** `docs/superpowers/specs/2026-11-09-backoffice-workspace-design.md` (approuvée).

## Global Constraints

- Routes d’administration uniquement ; parcours publics conservés.
- Navigation principale : Vue d’ensemble, Fiches, Utilisateurs, Stacks et outils, Activité. Sources et Diagnostic sont secondaires. « Retour au site » mène à l’accueil dans la langue courante.
- Aucun nouvel habillage dans `src/index.css`. Compositions `src/ds`, jetons `--tt-*`, composants existants, icônes centralisées.
- FR/EN, clair/sombre, clavier, 390/768/1280 px. Stories avant composition ; références visuelles marquées `a-valider` tant qu’elles ne sont pas validées.
- Contrats d’accès, de brouillon et de publication inchangés. Tests d’écriture sur serveur isolé.

## Review Focus

- Une URL Sources ou Diagnostic ouverte directement ou par retour navigateur sélectionne la bonne vue.
- Un changement de rubrique depuis une fiche en cours de sauvegarde conserve les saisies et bloque la sortie si l’enregistrement échoue.
- Un téléphone ne présente qu’un bouton de menu et retrouve le focus à sa fermeture.
- Une fiche prévisualisée et rechargée reste celle du brouillon, y compris ses sections tarifaires et éditoriales.
- Une publication affiche toutes les fiches du lot et refuse une révision devenue obsolète.

### Task 1: Cadre et navigation

**Files:** `src/components/v2shell/AppShellV2.tsx`, `src/components/v2shell/MobileMenu.tsx`, `src/pages/BackOfficePage.tsx`, `src/components/backoffice/AccountsDashboard.tsx`, nouveau `src/components/backoffice/backofficeNavigation.tsx`, nouvelle composition `src/ds/BackofficeNavigation/`, `e2e/backoffice-accounts.spec.ts`.

**Interfaces:** `BackofficeSection = "overview" | "catalog" | "users" | "stacks" | "usage" | "sources" | "diagnostic"`. `readBackofficeSection(search: string): BackofficeSection`, défaut `overview`. `BackofficeNavigationModel = { section: BackofficeSection; onNavigate(section: BackofficeSection): Promise<boolean> }`. Le cadre affiche Retour au site seul avant authentification ; le propriétaire autorisé publie le modèle via contexte. Le résultat booléen permet au menu mobile de rester ouvert si la sortie est bloquée.

- [ ] Créer les stories du menu desktop et de son contenu mobile avec Sources active et libellés EN.
- [ ] Ajouter les régressions navigateur : lien direct Sources, une seule navigation principale admin sur desktop, menu téléphone et retour du focus, lien Retour au site, rubriques publiques absentes dans le cadre admin.
- [ ] Constater l’échec ciblé sur l’ancien cadre, puis brancher le modèle dans le cadre existant. Retirer la rangée de boutons du tableau de bord et le bouton Diagnostic détaché.
- [ ] Garder une seule lecture de la rubrique dans les paramètres de route. Utiliser la navigation React Router pour les transitions de rubrique ; préserver `tool` et `editor` pour les liens directs Catalogue. Brancher Diagnostic sur `view=diagnostic` et préserver ses onglets internes. Utiliser le garde de brouillon existant avant de changer de rubrique. Vérifier aussi la restauration par retour navigateur et changement de langue.
- [ ] Exécuter les parcours navigateur de navigation et les tests de reconnexion du parent. Commit `feat(backoffice): unify administration navigation`.

### Task 2: En-têtes, listes et états

**Files:** `src/components/backoffice/AccountsDashboard.tsx`, `BackofficeOverview.tsx`, `AccountDetailPanel.tsx`, `CatalogEditor.tsx` dans le même dossier, `src/pages/BackOfficePage.tsx`, nouvelle composition `src/ds/BackofficePageHeading/`, tests concernés.

**Interfaces:** `BackofficePageHeading({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode })`. Les actions, filtres, compteurs et données restent propriété de leur vue.

- [ ] Créer les stories en-tête sans action, avec action et titre long ; montrer une liste pleine et un état vide avec les composants réels.
- [ ] Mettre un titre et une action de page, puis associer la recherche et les filtres à leur liste. Réutiliser Button, Field, Chip, PageLoading et Notice lorsque leurs interfaces correspondent.
- [ ] Simplifier les lignes Fiches et Utilisateurs. Donner à l’édition directe le premier accès. Placer l’ancien formulaire dans les actions secondaires. Garder l’accès au détail utilisateur et la recherche/pagination.
- [ ] Appliquer le même cadre aux vues Stacks, Activité, Sources et Diagnostic. Distinguer données disponibles et sources manquantes. Garder les exports et sous-sections du diagnostic.
- [ ] Vérifier la liste filtrée, son état vide, une erreur avec relance et le retour du détail. Contrôler 390/768/1280 et commit `refactor(backoffice): simplify lists and page actions`.

### Task 3: Fiche et publication

**Files:** `src/components/backoffice/CatalogInlineFiche.tsx`, `CatalogEditor.tsx`, `CatalogEditingContext.tsx`, `src/pages/ToolDetailPage.tsx`, `src/lib/catalogEditingPresentation.ts`, `src/ds/CatalogAuthoring/`, `e2e/backoffice-catalog.spec.ts`, `e2e/backoffice-inline-acceptance.spec.ts`.

**Interfaces:** `CatalogInlineFiche` conserve session et callbacks de sauvegarde. `ToolDetailPresentation` reçoit un mode d’auteur explicite pour la composition épurée. L’aperçu reçoit la projection du même brouillon, en mode privé et en lecture seule, avec une sélection locale de la sous-page publique.

- [ ] Ajouter les stories d’édition et d’aperçu. Dans le parcours navigateur, vérifier un en-tête avec titre de fiche, état de sauvegarde et bouton Aperçu ; vérifier l’absence des actions publiques dans la vue d’édition.
- [ ] Retirer les éléments publics décoratifs en mode auteur. Conserver chaque section et chaque contrôle d’offre sur place. L’aperçu montre le brouillon courant via le rendu partagé et peut ouvrir Prix, Avis et Alternatives sans changer le brouillon ni quitter l’administration.
- [ ] Regrouper la publication dans l’en-tête catalogue. Ouvrir sa revue comme une vue de travail avec retour, liste du lot et confirmation existante. Conserver flush, révision, annulation et confirmation de suppression de brouillon.
- [ ] Vérifier modification, sauvegarde, aperçu, retour à la liste filtrée et lot complet. Rejouer conflits, réauthentification et révision obsolète. Commit `refactor(backoffice): focus record editing and publish review`.

### Task 4: Recette intégrée

- [ ] Exécuter les suites application, types et parcours back-office concernés. Relire les rendus 390/768/1280 et le cadre public sur une route témoin.
- [ ] Exécuter `npm run lint:ds`, `npm run test:ds`, `npm run build-storybook`, `npm run test:visual` et l’audit typographique prévu dans la CI. Utiliser des captures séparées de la liste, du menu mobile et de la fiche.
- [ ] Obtenir la revue design indépendante prévue par le projet. Corriger les défauts bloquants et vérifier le build complet. Documenter la recette et présenter l’aperçu intégré pour validation visuelle.
