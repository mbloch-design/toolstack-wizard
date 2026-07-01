# Tooltrim — AI handoff

Mise à jour : 19 juin 2026.

## État du chantier

- Périmètre actif : parcours adaptatif du profil **Créatif**. Les autres métiers viendront après validation.
- Le parcours part désormais de la production réelle, puis explore : besoin → outil utilisé → usages → écosystème.
- Productions couvertes : identité/visuel, UI, photo, vidéo, motion, illustration, 3D, espaces/architecture, audio et social.
- Un même outil peut couvrir plusieurs besoins via `toolUsageMap` sans être ajouté plusieurs fois.
- Les outils socles ouvrent des branches contextualisées : plugins, IA, moteurs, ressources et services.
- Le catalogue local complet est fusionné avec Supabase et les données hétérogènes sont normalisées.
- TypeScript et build production passent. La suite diagnostic dédiée compte actuellement 75 tests passants.

## Décisions importantes

- Ne jamais partir d’un produit présumé : la première entrée est un **besoin métier**.
- Les suggestions sont classées par références explicites, `functional_needs`, verticale et type d’outil.
- Toujours permettre recherche libre, ajout manuel et « je n’utilise rien ».
- Séparer cartographie de l’existant et recommandations finales.
- Une étape n’est validée que par une action explicite, jamais par simple correspondance de mots-clés.
- Les relations hôte/plugin, bundle/enfant et usages distincts ne sont pas des doublons.
- L’architecture du moteur doit rester générique pour être réutilisée ensuite par les autres personas.

## Fichiers importants

- `src/lib/creativeAdaptiveEngine.ts` — taxonomie, classement et branches d’écosystème.
- `src/components/diagnostic/DiagStepProfileGoal.tsx` — choix des productions créatives.
- `src/components/diagnostic/DiagStepStackScan.tsx` — capture besoin/outils/usages.
- `src/hooks/useDiagnosticData.ts` — fusion et normalisation du catalogue.
- `src/lib/diagnosticRecovery.ts` — reprise de session.
- `src/utils/scoring.ts` — doublons et verdict.
- `src/types/diagnostic.ts` — contrats de données.
- `src/test/diagnostic/creativeAdaptiveEngine.spec.ts`
- `src/test/diagnostic/creativeJourneyMatrix.spec.ts`
- `src/test/diagnostic/diagnosticRecovery.spec.ts`
- `vitest.diagnostic.config.ts`

## Validation réalisée

- Figma, Sketch et Penpot apparaissent comme alternatives UI.
- Figma peut couvrir UI, brief et prototype sans duplication.
- La sélection de Figma ouvre son écosystème : Tokens Studio, Iconify, Stark, Anima, Zeplin, etc.
- Blender et Cinema 4D sont traités comme pairs ; création, rendu et extensions sont séparés.
- Parcours social, audio, desktop, mobile et reprise de session couverts par la recette.

## Bugs et risques restants

- La pertinence dépend encore de la qualité de `functional_needs`, `host_app`, bundles et relations du catalogue.
- La verticale espaces/architecture doit être testée plus profondément avec SketchUp/Revit et leurs plugins.
- Le scoring final reste partiellement généraliste malgré la nouvelle cartographie des usages.
- Il faut encore confronter le moteur à plusieurs stacks réelles avec de vrais doublons.
- Le worktree contient de nombreuses modifications locales non liées : ne jamais utiliser `git add -A`.

## Prochaine action

Faire une recette complète espaces/architecture :

1. choisir SketchUp ou Revit ;
2. vérifier documentation, rendu, plugins et livraison ;
3. contrôler les relations hôte/plugin/bundle ;
4. tester un vrai doublon puis valider le verdict ;
5. corriger, relancer TypeScript, tests et build avant commit ciblé.
