# Tooltrim — Mémoire du diagnostic

## Objectif

Comprendre la stack réelle de l’utilisateur pour identifier :

- les besoins couverts ou manquants ;
- les doublons et outils complémentaires ;
- les outils sous-utilisés ou surdimensionnés ;
- les branches métier et écosystèmes pertinents ;
- les arbitrages de coût, simplicité, temps et qualité.

## Logique métier retrouvée

- Le diagnostic part du travail produit, pas d’un outil supposé.
- Pour le profil créatif, une production principale et plusieurs productions secondaires déterminent les besoins à explorer.
- Les outils sont proposés selon leurs besoins fonctionnels, verticales métier, types et références explicites.
- Un outil peut couvrir plusieurs besoins : il reste unique dans la stack et ses usages sont enregistrés dans `toolUsageMap`.
- La sélection d’une application hôte peut ouvrir une branche d’écosystème : plugins, moteurs, extensions, assets ou services associés.
- La création 3D et le rendu 3D sont deux besoins distincts. Blender et Cinema 4D sont des options comparables, sans outil présumé par défaut.

## Règles déjà présentes

- Questions créatives construites depuis les productions sélectionnées.
- Classement des outils par adéquation au besoin, au métier et au type attendu.
- Reconnaissance possible d’un outil de niche via ses `functional_needs`, sans branche codée spécialement.
- Écosystèmes obtenus par règles explicites et champs `host_app` / `bundle_parent`.
- Doublons détectés par règles connues ou similarité élevée des besoins fonctionnels.
- Doublons IA regroupés par cas d’usage.
- Détection des outils dormants, plans à réduire et outils peu adaptés au profil.
- Priorisation des recommandations selon l’objectif : coût, simplicité, temps ou qualité.

## Fichiers clés

- `src/lib/creativeAdaptiveEngine.ts`
- `src/test/diagnostic/creativeAdaptiveEngine.spec.ts`
- `src/components/diagnostic/DiagStepProfileGoal.tsx`
- `src/components/diagnostic/DiagStepStackScan.tsx`
- `src/types/diagnostic.ts`
- `src/hooks/useDiagnosticData.ts`
- `src/lib/diagnosticRecovery.ts`
- `src/utils/scoring.ts`
- `src/utils/diagnosticInsights.ts`
- `src/data/tools_v4.json`

## Cas test importants

- Une production UI déclenche les besoins UI, pas la branche 3D.
- Figma, Sketch et Penpot sont proposés comme alternatives pour un même besoin.
- Blender et Cinema 4D sont tous deux proposés pour la création 3D : testé.
- Un outil déjà sélectionné reste proposé pour un second besoin : testé.
- Les écosystèmes Blender et Cinema 4D restent distincts : testé.
- La sélection de Figma ouvre son écosystème pertinent : testé.
- Un outil de niche correctement renseigné peut être proposé sans règle explicite.
- Deux outils complémentaires ne doivent pas devenir de faux doublons.

## Sujets incomplets

- Tests automatisés de `toolUsageMap` et de sa persistance après reprise.
- Validation visuelle de bout en bout du scénario Blender / Cinema 4D dans le scanner.
- Propagation des usages multiples vers la couverture, le scoring et les recommandations.
- Distinction robuste entre substitut, complément, moteur, plugin et bundle.
- Neutralisation des faux doublons lorsque des outils proches remplissent des rôles différents.
- Définition métier plus précise du surdimensionnement.

## Prochaine action recommandée

Tester la persistance de `toolUsageMap` :

1. associer Blender ou Cinema 4D à plusieurs besoins ;
2. sauvegarder puis restaurer la session ;
3. vérifier que l’outil reste unique et que tous ses usages sont conservés ;
4. vérifier que les étapes ne sont validées que par l’action explicite « Zone suivante » ;
5. ne modifier le scoring qu’après cette validation.

## Dernière validation

- Tests du moteur adaptatif : 7/7 passent.
- TypeScript : aucune erreur.
- Configuration légère ajoutée dans `vitest.diagnostic.config.ts` pour isoler ces tests de la configuration Vite principale.
