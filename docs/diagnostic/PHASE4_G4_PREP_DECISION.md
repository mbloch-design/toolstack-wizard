# Tooltrim — Décision de préparation Phase 4, bêta privée Créatif

> Date : 30 juin 2026
> Périmètre : Créatif uniquement
> Type de décision : préparation autonome interne
> Protocole source : `docs/diagnostic/PHASE4_PRIVATE_BETA_PROTOCOL.md`

## Décision

**Phase 4A prête pour recrutement. G4 non accepté.**

Tooltrim dispose maintenant du protocole, du panel cible, de la grille d’observation et du garde-fou documentaire nécessaires pour lancer une bêta privée Créatif.

Cette décision ne valide pas la bêta. Elle autorise seulement à recruter et observer les utilisateurs réels.

## Ce qui est prêt

- Protocole de session de 35 à 50 minutes.
- Panel cible de 12 à 18 participants.
- Quotas par segment créatif.
- Mix obligatoire : solo, petite équipe, Adobe, non-Adobe, IA intensive, IA occasionnelle, contrats flous, usages atypiques.
- Grille d’observation structurée.
- Définition mesurable d’un diagnostic actionnable.
- Critères G4 et règles P0/P1/P2/P3.
- Journal structuré des sessions bêta.
- Script d’évaluation `npm run assess:g4`.
- Dry-runs automatisés sur Social/Audio, rendu restauré et payload PDF.
- Kit de recrutement Phase 4B.
- Script de modération.
- Tracker vague 1.
- Modèle JSON de session prêt à remplir.
- Brief consentement et messages de suivi.
- Protocole opérations Phase 4C pour éviter les métriques incomparables.
- Pipeline candidat vide et privé, sans données personnelles ni faux participants.
- Validation qualité du journal réel avec `npm run validate:phase4:sessions`.
- Synthèse de vague avec `npm run summarize:phase4`.

## Ce qui n’est pas validé

- Aucun participant réel Phase 4 n’a encore été observé.
- G1 terrain reste non accepté.
- Les réserves Social/Audio et mobile restent ouvertes.
- La revue experte métier G3 reste à organiser.
- Les métriques G4 ne sont pas mesurées.
- Les dry-runs internes ne remplacent pas les sessions terrain.

## Conditions avant première session

Avant la première bêta, vérifier :

- environnement local ou préprod stable ;
- lien de session prêt ;
- outil de prise de notes ou enregistrement autorisé ;
- consentement utilisateur ;
- capacité à retrouver `sessionId` ou export de session ;
- modérateur aligné sur la consigne “ne pas aider pendant le parcours”.

## Conditions de passage G4

G4 ne pourra être accepté qu’après :

- 12 sessions minimum ;
- 6 familles créatives couvertes ;
- diagnostic actionnable ≥ 70 % ;
- fidélité perçue ≥ 85 % ;
- complétion ≥ 70 % ;
- temps médian jusqu’au pré-verdict ≤ 8 minutes ;
- zéro P0 ouvert ;
- moins de trois P1 ouverts ;
- synthèse des abandons et corrections prioritaires.

## Validation observée

Validation observée le 30 juin 2026 :

- `npm run validate:phase4:sessions` : PASS, journal prêt et vide, aucune session réelle enregistrée ;
- `npm run summarize:phase4` : PASS, décision attendue “poursuivre le recrutement, ne pas accepter G4” ;
- `npm run validate:phase4` : PASS, 23 checks ;
- `npm run assess:g4` : PASS d’exécution, verdict attendu `G4 NON ACCEPTÉ` faute de sessions réelles ;
- `npx vitest run --config vitest.diagnostic.config.ts src/test/diagnostic/phase4BetaReadiness.spec.tsx` : PASS, 3 tests ;
- `npm run validate:diagnostic` : PASS, 134 tests métier ciblés + garde-fous ;
- `npm run validate:g0` : PASS, build production inclus ;
- `git diff --check` : PASS.

## Décision finale

La Phase 4 peut entrer en recrutement.

La prochaine action produit n’est pas d’ajouter du code par défaut : c’est d’envoyer les invitations, jouer les premières sessions, classer les retours, puis corriger uniquement les P0/P1 reproductibles.
