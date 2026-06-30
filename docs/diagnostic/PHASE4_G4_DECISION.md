# Tooltrim — Décision G4 Phase 4, bêta privée Créatif

> Date : 30 juin 2026
> Périmètre : Créatif uniquement
> Type de décision : évaluation autonome de porte
> Journal source : `docs/diagnostic/PHASE4_BETA_SESSIONS.json`

## Décision

**G4 non accepté.**

La Phase 4 est prête à être jouée, et des dry-runs internes protègent maintenant les angles Social/Audio, rendu restauré et export PDF. Mais la porte G4 exige des utilisateurs réels.

À ce stade, aucune session réelle Phase 4 n’a été enregistrée. Il serait donc dangereux de considérer la bêta comme validée.

## Ce qui a été fait en autonomie

- Protocole bêta privée Créatif.
- Panel de recrutement.
- Grille d’observation.
- Journal structuré des sessions.
- Dry-runs Phase 4 automatisés.
- Évaluation G4 scriptable.
- Garde-fou empêchant de confondre dry-run et terrain.
- Kit Phase 4B prêt à envoyer : recrutement, screener, script de session, consentement, tracker vague 1 et follow-up.
- Couche Phase 4C d’opérations bêta : pipeline candidat privé, validation qualité du journal et synthèse de vague.

## Ce qui bloque G4

- 12 sessions réelles minimum non jouées.
- 6 familles créatives non couvertes par utilisateurs réels.
- Diagnostic actionnable non mesuré.
- Fidélité perçue non mesurée.
- Complétion réelle non mesurée.
- Temps médian jusqu’au pré-verdict non mesuré.
- P0/P1 terrain non connus.

## Rectification appliquée

Le sérialiseur PDF est maintenant exporté sous `serializeDiagnosticResultForPdf` afin d’être testé directement.

Un dry-run vérifie que :

- le payload PDF contient trois décisions principales maximum ;
- chaque décision exportée possède une preuve ;
- les recommandations sans preuve ne partent pas dans l’export.

## Validation observée

Validation observée le 30 juin 2026 :

- `npx vitest run --config vitest.diagnostic.config.ts src/test/diagnostic/phase4BetaReadiness.spec.tsx` : PASS, 3 tests ;
- `npm run validate:phase4:sessions` : PASS, journal prêt et vide, aucune session réelle enregistrée ;
- `npm run summarize:phase4` : PASS, décision attendue “poursuivre le recrutement, ne pas accepter G4” ;
- `npm run validate:phase4` : PASS, 23 checks ;
- `npm run assess:g4` : PASS d’exécution, verdict attendu `G4 NON ACCEPTÉ` ;
- `npm run validate:diagnostic` : PASS, 134 tests métier ciblés + garde-fous ;
- `npm run validate:g0` : PASS, build production inclus ;
- `git diff --check` : PASS.

## Prochaine action nécessaire

Jouer les premières sessions réelles :

1. recruter 6 participants couvrant au moins 4 segments créatifs ;
2. utiliser `PHASE4B_RECRUITMENT_KIT.md` pour inviter et filtrer ;
3. conduire les sessions avec `PHASE4B_SESSION_SCRIPT.md` et `PHASE4_OBSERVATION_GRID.md` ;
4. remplir `PHASE4_BETA_SESSIONS.json` avec le modèle `PHASE4B_SESSION_LOG_TEMPLATE.json` ;
5. vérifier le journal avec `npm run validate:phase4:sessions` ;
6. produire la synthèse avec `npm run summarize:phase4` ;
7. corriger uniquement les P0/P1 reproductibles ;
8. relancer `npm run assess:g4` après chaque vague.

## Décision finale

La totalité exploitable de Phase 4 a été préparée et sécurisée en autonomie.

La porte G4 reste **non acceptée** tant que les sessions réelles ne sont pas observées.
