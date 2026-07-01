# Tooltrim — Diagnostic handoff

> Mise à jour : 19 juin 2026 — audit produit et recette utilisateur Créatif en cours.
>
> Mémoire de référence unique : ce fichier. `AI_HANDOFF 2.md` est une ancienne version incomplète.

## Objectif

Analyser la stack réelle d’un utilisateur pour identifier les besoins couverts ou manquants, les doublons, les outils complémentaires, les plans surdimensionnés et les recommandations adaptées au métier et à l’objectif déclaré.

## Logique métier en place

- Le chantier actif porte uniquement sur la verticale Créatif. Les autres profils restent fonctionnels mais ne doivent pas être étendus avant validation de cette verticale.
- Chaque parcours pose des questions métier propres et remonte des outils classés selon références explicites, `functional_needs`, type d’outil et pertinence persona.
- Le parcours créatif part des productions réelles : UI, identité, photo, vidéo, motion, illustration, 3D, architecture, audio ou social.
- Un outil reste unique dans la stack mais peut couvrir plusieurs besoins via `toolUsageMap`.
- Une étape n’est validée que par l’action explicite « Zone suivante » ; ajouter un outil ne coche pas automatiquement les autres étapes.
- Les applications hôtes ouvrent des branches d’écosystème ciblées. La branche n’affiche que ses relations explicites et n’affiche plus l’application hôte elle-même.
- Blender et Cinema 4D sont des pairs pour la création 3D. Création, rendu et écosystème sont traités séparément.

## Règles présentes

- Doublons : règles explicites, similarité fonctionnelle élevée ou même cas d’usage IA.
- `toolUsageMap` neutralise un doublon si deux outils similaires servent des besoins déclarés distincts.
- Cette neutralisation s’applique aussi aux outils IA partageant le même cas d’usage technique mais affectés à des rôles créatifs différents.
- Les relations hôte/plugin, bundle/enfant et outils inclus ne sont pas considérées comme des doublons.
- Détection des outils dormants, mauvais fit persona et possibilités de downgrade.
- Priorisation selon l’objectif : coûts, simplification, temps ou qualité.
- Reprise de session : usages multiples, offre choisie, métadonnées de prix et couverture des zones sont conservés.
- Les questions adaptatives sont restaurées avec leurs options et outils concernés : une réponse garde donc sa signification après reprise.
- Une réponse explicite « plan payant justifié » protège l’outil contre une recommandation contradictoire de downgrade ou d’alternative gratuite.

## Audit utilisateur en cours

- Persona de référence : créatif pressé, interrompu par des retours client, qui ne connaît pas toujours le nom exact de son plan et utilise souvent un même outil à plusieurs étapes.
- Promesse de confiance : toute action présentée comme enregistrée doit survivre immédiatement à un rechargement ou une fermeture.
- Défaut critique reproduit le 18 juin : un outil ajouté et son plan disparaissaient après rechargement si « Zone suivante » n’avait pas encore été cliqué.
- Correction terminée : chaque ajout, retrait, changement de plan, usage, validation et skip est synchronisé avec la session centrale dès l’action.

## Fichiers clés

- `src/lib/personaAdaptiveEngine.ts`
- `src/lib/creativeAdaptiveEngine.ts`
- `src/components/diagnostic/DiagStepProfileGoal.tsx`
- `src/components/diagnostic/DiagStepStackScan.tsx`
- `src/lib/diagnosticRecovery.ts`
- `src/utils/scoring.ts`
- `src/types/diagnostic.ts`
- `src/test/diagnostic/adaptiveJourney.spec.ts`
- `src/test/diagnostic/creativeAdaptiveEngine.spec.ts`
- `src/test/diagnostic/diagnosticRender.spec.tsx`
- `src/test/diagnostic/diagnosticRecovery.spec.ts`
- `vitest.diagnostic.config.ts`

## Cas validés

- Matrice complète des dix productions créatives : identité/visuel, UI/produit, photo, vidéo, motion, illustration, 3D, espaces/architecture, audio et contenus sociaux.
- Chaque production ouvre uniquement ses besoins métier propres, plus les étapes transverses de brief, IA, assets et validation/livraison.
- Les suggestions proviennent du vrai catalogue `tools_v4.json`, avec au moins deux options réelles pour chaque besoin principal.
- Plusieurs productions peuvent être combinées sans dupliquer les questions transverses.
- Les outils proposés changent réellement selon la question.
- Réutilisation d’un outil sur plusieurs besoins sans duplication.
- Blender et Cinema 4D proposés comme options 3D comparables.
- Blender réutilisable pour le rendu puis ouverture de son écosystème.
- Écosystèmes validés pour Figma, Canva, After Effects, Premiere Pro, Photoshop, Lightroom, Capture One, Blender, Cinema 4D, 3ds Max, Maya et Houdini.
- Le scénario social commence par la création/déclinaison des formats sociaux ; le montage vidéo reste une branche complémentaire.
- Le scénario social couvre maintenant aussi planification, publication multi-plateformes et analytics avec le vrai catalogue.
- Le scénario audio couvre maintenant hébergement, flux RSS, diffusion et analytics podcast.
- La validation finale inclut livraison, versions, sauvegarde et archivage.
- Pas de faux doublon entre rôles distincts, application/plugin ou bundle.
- Navigation directe entre questions visible et fonctionnelle.
- Affichage desktop et mobile vérifié.

## Validation au 19 juin 2026

- 75 tests diagnostic passent dans 6 fichiers.
- Les faux doublons IA entre rôles créatifs distincts sont maintenant couverts.
- La couverture des zones est maintenant restaurée par la reprise de session.
- Auto-sauvegarde vérifiée en navigateur sur desktop : Figma Professional à 16 €/mois survit à un rechargement avant « Zone suivante » et son écosystème reste présent.
- Reprise vérifiée après validation UI et skip 3D : les états « remplie » et « marquée vide » sont restaurés et le parcours reprend sur le brief.
- Reprise mobile vérifiée en 390 × 844 sans erreur applicative pertinente.
- Parcours social vérifié avec Buffer, Metricool, Later, Hootsuite, Sprout Social et Planoly.
- Parcours audio vérifié avec Spotify for Podcasters, Buzzsprout, Ausha, Acast et Podbean.
- La chaîne créative du dashboard est maintenant reconstruite depuis `toolUsageMap`, avec une étape « Diffuser » et la possibilité pour un outil polyvalent d’apparaître dans plusieurs maillons.
- L’arbitrage des doublons IA protège d’abord l’outil le plus utilisé ; à usage égal, il challenge le plus cher.
- Le pré-verdict utilise la même classification que le dashboard : Audacity + Buzzsprout produit bien 1 outil de production et 1 outil de diffusion.
- Recette après rechargement : le plan Buzzsprout déclaré justifié reste protégé, Buzzsprout apparaît dans « Diffuser » et aucune alternative gratuite contradictoire n’est recommandée.
- TypeScript passe sans erreur.
- Build production réussi le 19 juin 2026, avec pages SEO et sitemap générés.

## Sujets encore perfectibles

- La qualité des branches dépend des `functional_needs`, `host_app` et outils réellement présents dans le catalogue.
- Le surdimensionnement reste principalement fondé sur prix, usage, palier et fit persona ; il pourra être enrichi par des critères métier plus fins.
- Les recommandations finales utilisent encore le moteur historique généraliste, même si les doublons tiennent maintenant compte des usages déclarés.
- Le parcours espaces/architecture n’a pas encore reçu la même recette approfondie que UI, social et audio.
- La couverture métier et la maturité restent partiellement fondées sur des catégories génériques ; elles doivent être confrontées à des stacks réelles avant recalibrage.

## Prochaine action recommandée

Faire une recette complète espaces/architecture : SketchUp ou Revit, documentation, moteur de rendu, plugins et livraison. Vérifier les identifiants réels du catalogue, les relations hôte/plugin/bundle et les faux doublons. Puis tester des stacks réelles contenant volontairement un vrai doublon pour contrôler la qualité du verdict, pas seulement sa présence.
