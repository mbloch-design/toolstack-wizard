# GO15 - Onboarding persona et qualite de captation

## Objectif

GO15 ameliore le debut du diagnostic ToolTrim pour mieux capter le contexte metier avant la selection d'outils.

Le but n'est pas d'allonger le tunnel, mais de rendre le choix persona plus fiable et plus exploitable par l'algorithme, la restitution et le back-office.

## Ajouts UX

- cartes persona plus explicites avec signaux analyses par profil ;
- capture de la confiance persona :
  - profil clair ;
  - profil hybride ;
  - profil a confirmer ;
- capture de l'objectif principal du diagnostic :
  - reduire les couts ;
  - gagner du temps ;
  - simplifier ;
  - mieux choisir.

## Ajouts moteur

Les reponses d'onboarding alimentent maintenant `answerSignals` :

- `onboarding_persona_hybrid` ;
- `onboarding_persona_uncertain` ;
- `onboarding_goal_reduce_costs` ;
- `onboarding_goal_save_time` ;
- `onboarding_goal_simplify` ;
- `onboarding_goal_quality`.

Un persona incertain cree aussi un flag de calibration, pour eviter une restitution trop certaine quand l'angle metier n'est pas encore stable.

## Base de donnees

Une colonne `diagnostic_context` est ajoutee sur `diagnostic_sessions`.

Elle stocke :

- `persona_confidence` ;
- `stack_goal` ;
- `complementary_skills` ;
- `primary_specialty` ;
- `complementary_specialties`.

Le back-office expose ce contexte dans le detail session et dans les exports CSV.

## Validation

Commande dediee :

```bash
npm run test:go15 -- --environment node
```

GO15 complete GO14 : le banc metier valide le comportement global, GO15 valide specifiquement que l'onboarding nourrit bien les insights et la calibration.
