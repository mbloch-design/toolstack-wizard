# Tooltrim — Protocole opérations Phase 4C, bêta privée Créatif

> Statut : prêt à utiliser
> Date : 30 juin 2026
> Périmètre : verticale Créatif uniquement
> Objectif : rendre les sessions réelles comparables, mesurables et exploitables sans inventer de validation terrain.

## 1. Pourquoi cette couche existe

Phase 4B rend la bêta envoyable. Phase 4C rend la bêta exploitable.

Le risque n’est plus de manquer de documents. Le risque est de faire des sessions intéressantes mais impossibles à comparer :

- participants mal qualifiés ;
- notes incomplètes ;
- métriques remplies différemment selon la session ;
- dry-runs ou contacts ajoutés comme “sessions réelles” ;
- corrections lancées sur une impression isolée ;
- confusion entre cartographie existante et recommandation Tooltrim.

La règle produit reste stricte : **G4 non accepté tant que les utilisateurs réels ne sont pas observés et mesurés.**

## 2. Boucle opérationnelle après chaque candidat

Pour chaque personne contactée :

1. renseigner le pipeline candidat sans donnée personnelle sensible dans le dépôt ;
2. vérifier le segment, le type de stack, l’usage IA, les contrats flous et les usages atypiques ;
3. confirmer le créneau et le consentement ;
4. jouer la session sans aider pendant le parcours ;
5. remplir le journal réel dans les 24 heures ;
6. lancer la validation qualité du journal ;
7. lancer la synthèse de vague ;
8. décider : continuer, corriger un P0/P1, ou suspendre.

Commandes associées :

- `npm run validate:phase4:sessions` ;
- `npm run summarize:phase4` ;
- `npm run assess:g4`.

## 3. Ce qui compte comme session réelle

Une entrée peut aller dans `realSessions` uniquement si :

- la personne est un professionnel créatif ou une petite équipe dans le périmètre pilote ;
- elle a donné son consentement ;
- elle a parcouru Tooltrim sur une version stable identifiée ;
- le modérateur n’a pas expliqué les réponses pendant la capture ;
- les métriques minimales sont remplies ou l’abandon est explicitement noté ;
- les problèmes observés sont classés P0/P1/P2/P3.

Ne sont pas des sessions réelles :

- dry-run interne ;
- replay proxy ;
- test développeur ;
- discussion commerciale sans parcours ;
- candidat recruté mais non venu ;
- démo où le modérateur guide les choix ;
- observation d’une autre verticale.

## 4. Pipeline candidat

Le fichier `PHASE4B_CANDIDATE_PIPELINE.json` sert à piloter la vague sans créer de faux participants.

Il doit contenir :

- les créneaux cibles de vague 1 ;
- les quotas à couvrir ;
- les statuts autorisés ;
- une liste `candidates` vide ou remplie seulement avec des identifiants anonymes.

Ne jamais commiter :

- nom complet ;
- email ;
- téléphone ;
- entreprise identifiable si elle n’est pas publique et autorisée ;
- lien d’enregistrement privé ;
- notes contenant des clients, prix confidentiels ou données sensibles.

Les informations personnelles restent dans l’outil privé de recrutement ou de calendrier.

## 5. Qualité du journal de sessions

Chaque session réelle doit préserver les questions produit qui ont guidé toute la roadmap :

- l’utilisateur a-t-il reconnu sa manière de travailler ?
- une suite comme Adobe, Maxon, Canva ou Microsoft a-t-elle créé une ambiguïté ?
- un même outil a-t-il couvert plusieurs objectifs sans doublon ?
- un usage atypique a-t-il été capturé sans jugement ?
- l’IA a-t-elle été oubliée, mal rattachée, ou correctement reliée à une étape ?
- la clarification commerciale est-elle arrivée au bon moment ?
- la restitution a-t-elle produit une décision concrète ?
- l’utilisateur a-t-il cru recevoir une recommandation pendant la capture ?

Les champs critiques ne doivent pas rester vagues :

- `segment` utilise une des six familles créatives ;
- `preVerdictMinutes` mesure le temps jusqu’au pré-verdict ;
- `mappingFidelityScore` et `trustScore` sont notés de 1 à 5 ;
- `actionableDiagnostic` est vrai seulement si l’utilisateur cite une décision concrète ;
- `firstDecisionQuoted` reprend cette décision avec les mots de l’utilisateur ;
- `manualVerification` distingue outils, usages, IA, contrats, coûts et décisions ;
- `issues` contient seulement des problèmes observés, classés et rattachables.

## 6. Règle de correction pendant la vague 1

La bêta n’est pas un sprint de polish permanent.

- P0 reproductible : suspendre la prochaine session et corriger.
- P1 reproductible : corriger avant d’élargir au-delà de la vague en cours.
- P1 isolé mais critique pour la confiance : rejouer ou provoquer un second cas proche.
- P2 répété : documenter et regrouper pour arbitrage vague 2.
- P2 isolé : ne pas interrompre.
- P3 : backlog.

Une correction ne doit pas ouvrir Tech, Conseil, Content ou Ops.

## 7. Synthèse vague 1

Après 6 sessions, produire `PHASE4C_WAVE1_SYNTHESIS_TEMPLATE.md` rempli.

La synthèse ne doit pas chercher à “faire passer” G4. Elle répond seulement :

- quels segments ont été réellement observés ;
- quelles ambiguïtés se répètent ;
- quelles métriques sont déjà inquiétantes ;
- quels P0/P1 bloquent la suite ;
- quelles corrections sont nécessaires avant la vague 2 ;
- quels apprentissages doivent rester en observation.

Aucune métrique ne doit être inventée. Si une donnée n’a pas été capturée, la synthèse doit écrire `non mesuré`.

## 8. Décision autorisée après vague 1

Après les six premières sessions, seules quatre décisions sont autorisées :

1. continuer vers la vague 2 sans correction bloquante ;
2. corriger des P0/P1 puis rejouer les cas concernés ;
3. ajuster le recrutement si des segments ou signaux manquent ;
4. suspendre si la promesse “cartographie reconnue + décision concrète” échoue trop souvent.

G4 reste non accepté avant 12 sessions réelles minimum et couverture des six familles créatives.
