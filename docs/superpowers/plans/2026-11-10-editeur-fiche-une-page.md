# Éditeur de fiche sur une page — plan d’implémentation

> **For agentic workers:** Use superpowers:executing-plans or superpowers:subagent-driven-development. Keep steps checkable and stage explicit paths.

**Goal:** Lire la fiche et modifier chaque bloc à son emplacement, avec des actions adaptées aux usages et aux offres.

**Architecture:** L’espace auteur compose des sections à partir du registre de champs. Une transaction locale prépare les modifications d’un bloc et les applique au service de brouillons à sa fermeture. Les offres réutilisent les opérations tarifaires et l’aperçu réutilise la fiche publique.

**Tech Stack:** React, TypeScript, CSS Modules, Storybook, Vitest et Playwright.

**Spec:** docs/superpowers/specs/2026-11-10-editeur-fiche-une-page-design.md.

## Global Constraints

- Routes et API d’administration existantes. Fiche continue, FR/EN, claire et sombre, clavier et mobile.
- Jetons du design system, CSS Modules, stories avant composition et preuves sur le rendu.
- Conservation des valeurs historiques, permissions et publication groupée. Aucune écriture catalogue pour la recette.

## Review Focus

- Champ absent ou protégé, annulation locale, erreur après envoi, navigation pendant la saisie.
- Tags historiques et doublons, recherche sans résultat, retour du focus.
- Ajout abandonné, réordre et retrait d’une offre liée, remplacement du prix de référence.

### Task 1: Sélecteur d’usages
- [ ] Introduire le composant de sélection par pastilles et ses stories.
- [ ] Adapter le vocabulaire existant pour les familles d’usages, publics et secteurs.
- [ ] Vérifier recherche, retrait, annulation, valeur historique, exclusion des doublons et identifiants conservés.

### Task 2: Liste d’offres
- [ ] Afficher les offres de la langue choisie, leur résumé et leurs actions.
- [ ] Fournir au formulaire transactionnel un ajout provisoire et les champs conditionnels. Réutiliser les règles de prix partagé, de retrait et de rétablissement.
- [ ] Tester l’abandon de l’ajout, les types de prix et les actions de collection.

### Task 3: Fiche et brouillon
- [ ] Composer les sections dédiées à partir du registre, avec raccourcis, états au repos et accès aux champs avancés.
- [ ] Isoler les modifications du bloc ouvert. **Terminer** applique un seul changement de brouillon, **Annuler** abandonne ce bloc. Brancher le garde de navigation et conserver l’aperçu privé.
- [ ] Vérifier la couverture du registre, le retour du focus, la sauvegarde et le rechargement sur le parcours réel.

### Task 4: Recette et intégration
- [ ] Exécuter tests ciblés, typecheck, lint DS, Storybook et build. Vérifier les gestes sur le serveur de test.
- [ ] Examiner le rendu à 390, 768 et 1280 px et faire relire le diff. Livrer sur la branche de travail et publier si la recette permet une itération utile.
