# Refonte du process design : composants, Storybook, tests visuels

Date : 06/11/2026. Statut : à valider par Michael.

## Pourquoi

Le 06/11, la carte Budget affiche « Verc / el » et « 100 / % ». La répartition est à moitié vide, la décision est mal alignée et « Now and then » tient sur trois lignes. Tous les audits passaient pourtant. Les causes :

1. Deux sources de vérité : la planche HTML écrite à la main et le site React. Le site dérive dès qu'on le lâche.
2. La planche valide un état idéal (FR, 3 outils, noms courts, €). Le site affiche l'anglais, 1 outil, des prix manquants et des $.
3. Les contrôles mesurent la conformité aux jetons, pas la qualité : mot coupé, vide, désalignement, contraste.
4. L'auteur relit son propre travail.
5. Des rustines sur l'héritage : `index.css` fait 23 151 lignes, avec des ponts et des `!important`, et les classes globales `tt-*` fuient.

## Objectif

Les vrais composants React sont la seule source. Chacun est montré, testé et validé dans tous ses états réels avant d'arriver sur le site, et la page ne peut plus le déformer.

Hors champ : le hero, les ciseaux du logo, les pages autres que Ma stack (elles suivront la même méthode plus tard).

## Choix techniques

| Besoin | Choix |
|---|---|
| Styles | **CSS Modules** par composant, plus `src/ds/tokens.css` (seuls les jetons `--tt-*` restent globaux). Portée garantie par le compilateur : une règle de page ne peut pas viser un composant. Aucun poids ajouté au HTML prérendu (budget Vercel). |
| Garde des styles | **Stylelint** : dans un module, couleurs, tailles de police, graisses, interlettrage, espaces et rayons viennent de `var(--tt-*)`. `!important` et `:global` interdits. |
| Planche | **Storybook** (`@storybook/react-vite`, version exacte figée à l'installation). Il remplace `design-system/planche.html` comme référence. |
| États | Une story par état, avec des données issues du vrai catalogue (`*.fixtures.ts`). Barre d'outils : langue FR/EN, thème clair/sombre, devise. |
| Invariants de mise en page | Tests `play` (addon Vitest de Storybook, navigateur réel) : aucun mot coupé (un mot ne donne qu'un rectangle de ligne), aucun débordement horizontal, montant et unité sur la même ligne, aucune carte plus haute que son contenu. |
| Accessibilité | addon a11y (axe). Une violation fait échouer le test. |
| Régression visuelle | **Playwright `toHaveScreenshot`** sur chaque story, en 390, 768 et 1280, en clair et en sombre. Captures générées dans l'image Docker officielle de Playwright, pour avoir le même rendu en local et en CI. |
| CI | `preprod-ci.yml` lance Stylelint, les tests de stories et les captures. Une différence bloque. |
| Publication | Storybook statique sur un projet Vercel dédié, protégé par l'authentification Vercel (`design.tooltrim…`). Mis à jour à chaque push sur `main`. |

## Arborescence

```
src/ds/
  tokens.css                 jetons validés (extraits de tooltrim-system.css)
  fonts.css
  Budget/
    Budget.tsx
    Budget.module.css
    Budget.fixtures.ts       1 outil, 3, 12, nom long, prix manquants, $, €
    Budget.stories.tsx
    Budget.test.ts           invariants (play)
  ...
.storybook/                  config, décorateurs langue / thème / devise
e2e/visual/                  captures par story
```

Les composants du système ne reçoivent que des données déjà calculées (montants, libellés traduits fournis par l'appelant ou via `lang`). La logique métier reste dans `src/lib` et les conteneurs de page.

## Règles de robustesse (écrites dans les composants, testées)

- Un nom se coupe aux espaces, jamais au milieu d'un mot. Trop long sur deux lignes, il se termine par une ellipse sur un mot entier.
- Un nombre et son unité sont insécables. Une colonne de chiffres a une largeur minimale garantie.
- Chaque composant se met en page selon sa propre largeur (requêtes de conteneur), jamais selon l'écran.
- Une carte prend la hauteur de son contenu. Le tableau aligne sans étirer.
- Les états vide, partiel et chargement sont des stories comme les autres.

## Process par module

1. **Brief** (5 lignes, validé par Michael) : à quoi sert le module, ses états, ses données extrêmes, sa ligne d'humour.
2. **Stories d'abord** : la matrice part des pires données.
3. **Composant** jusqu'à ce que Stylelint, les invariants et l'a11y passent.
4. **Revue indépendante** : un sous-agent design-review qui n'a pas écrit le code reçoit les captures de la matrice et une liste : coupures, vides, alignements, contrastes, langue, ton.
5. **Validation de Michael** sur l'URL Storybook. Les captures validées sont commitées comme référence (commit « validé par Michael »). Elles remplacent les étiquettes `planche-validee-*`.
6. **Intégration** : la page importe le composant, sans aucun style ajouté. L'ancien code et ses classes (`mf-*`, `ms-*`, `mu-*`, `tt-*` concernées, ponts d'`index.css`) sont supprimés dans le même commit.

## Pilote : la carte Budget

C'est le module le plus en vue et le plus simple en interactions. Il concentre les défauts du 06/11 (noms coupés, pourcentages, devises, prix manquants) et il contient la molécule « part d'un total », réutilisée par la répartition. Il éprouve toute la chaîne : jetons, module, stories, invariants, captures, revue, validation, intégration, suppression.

Ordre ensuite : Répartition, Décision, Vos usages, puis le tableau qui les assemble, puis l'inventaire et la découverte.

## Ce qu'on garde, ce qu'on retire

- **Gardés** : les jetons et la règle typographique validés, les atomes, le jeu de cartes, le ton et l'humour.
- **Retirés au fil des modules** :
  - la planche HTML manuelle (gelée en lecture seule, puis archivée quand Ma stack est migrée) ;
  - `planche:check` et `build-planche.mjs` ;
  - les couches `mf-*`, `ms-*` et `mu-*` ;
  - les ponts d'`index.css` ;
  - la grille bento qui force les hauteurs.
- **Repris** : les propositions en attente (décision au repos, accueil pour tous, formule en rangées) repassent par un brief dans le nouveau process.
- **À mettre à jour** : `AGENTS.md` (convention CSS) et `docs/DESIGN_SYSTEM.md` (nouvelle référence).

## Risques

- **Deux systèmes cohabitent pendant la migration.** Les composants `src/ds` ne lisent que `tokens.css`, donc aucune interférence dans ce sens. L'ancien CSS global peut encore viser des balises nues : `tokens.css` s'accompagne d'un reset limité aux racines des composants.
- **Captures instables** (polices, animations) : on attend `document.fonts.ready`, le mouvement est réduit et les captures sont faites dans Docker.
- **Poids** : Storybook et ses addons sont des dépendances de dev, sans effet sur le build du site.
