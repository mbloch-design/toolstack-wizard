# Tooltrim — Protocole Phase 0 / Porte G0

> Statut : actif
> Source de priorité : `ROADMAP_DIAGNOSTIC.md`
> Périmètre : diagnostic Créatif uniquement
> But : prouver que la base est mesurable et reproductible avant toute nouvelle fonctionnalité.

## 1. Décision de phase

La Phase 0 ne cherche pas à améliorer le parcours. Elle cherche à rendre le parcours vérifiable.

Tant que G0 n’est pas validée :

- pas de nouvelle verticale ;
- pas de nouveau scoring ;
- pas de nouvelle branche catalogue non nécessaire aux scénarios de référence ;
- pas de refonte visuelle ;
- pas d’ajout fonctionnel “par intuition”.

## 2. Commandes de validation

### Validation quotidienne

```bash
npm run validate:diagnostic
```

Cette commande vérifie le socle reproductible :

- TypeScript ;
- tests métier ciblés du diagnostic Créatif ;
- garde-fous parcours Créatif ;
- garde-fous restitution ;
- garde-fous catalogue ;
- garde-fous modèles commerciaux.

Elle ne lance pas le build de production par défaut, car l’environnement local peut être perturbé par des dépendances déchargées par iCloud.

Les tests UI jsdom sont isolés pour éviter qu’un blocage du runner masque l’état métier :

```bash
npm run validate:diagnostic:ui
```

À ce stade, ces tests sont considérés comme une zone à stabiliser, pas comme le socle quotidien.

### Porte G0 complète

```bash
npm run validate:g0
```

Cette commande ajoute le build de production. Elle doit passer dans un environnement sain avant d’autoriser la Phase 1.

Le build de production passe par `scripts/build-production.mjs`, qui nettoie les dossiers générés `dist` et `dist-ssr` avant de reconstruire SSR, client et alias d’assets.

## 3. Critères G0

G0 est validée seulement si tous les points suivants sont vrais :

- `npm run validate:g0` passe ;
- les scénarios de référence Créatif sont figés et relus ;
- la recette `docs/diagnostic/G0_PRODUCT_RECIPE.md` est jouée ou explicitement marquée comme non jouée ;
- la décision `docs/diagnostic/G0_PRODUCT_DECISION.md` est remplie ;
- les événements de début, progression, reprise, abandon et complétion sont identifiés ;
- les limites de l’environnement local sont documentées ;
- `ROADMAP_DIAGNOSTIC.md` reste la source de priorité ;
- `AI_HANDOFF.md` décrit l’avancement réel sans ouvrir un nouveau chantier fonctionnel.

## 4. Ce que les validateurs couvrent déjà

| Zone | Couverture actuelle |
|---|---|
| Entrée Créatif | tests de profil, productions et objectifs |
| Moteur adaptatif | tests de planification, fatigue, scénarios métier |
| Outil multi-usage | tests `workflowUsages` et contrats d’usage |
| Reprise | tests de sauvegarde et restauration |
| Restitution | tests de rendu diagnostic et garde-fous GO59 |
| Catalogue | garde-fous GO60 sur outils réels, placeholders et prix sourcés |
| Modèle commercial | garde-fous GO61 sur bundles, inclusions, achats uniques et crédits |
| Readiness produit G0 | garde-fou documentaire sur protocole, scénarios, recette et décision |
| UI jsdom | isolée dans `validate:diagnostic:ui`, actuellement à stabiliser |

## 5. Points non couverts par les tests automatiques

Ces points doivent être validés par recette ou observation :

- compréhension réelle des questions ;
- sensation de répétition ;
- charge cognitive au moment des plans ;
- distinction perçue entre cartographie et recommandation ;
- lisibilité mobile ;
- exactitude métier des recommandations finales ;
- fidélité ressentie de la cartographie.

## 6. Événements disponibles

Les événements déjà identifiés pour la mesure Phase 0 sont :

| Besoin de mesure | Signal disponible |
|---|---|
| Début de session | création d’une session diagnostic |
| Progression | `step_viewed`, `step_completed`, `last_step_id`, `completion_pct` |
| Retour arrière | `step_back` |
| Reprise | `session_resumed`, `resumed_at`, état de reprise local |
| Abandon | `abandoned_at`, raison `visibility_hidden` ou `page_hide` |
| Fin | `session_completed`, snapshot final, `completed_at` |
| Rapport demandé | `report_requested` |
| Restitution consultée | `restitution_tab_viewed` |
| Partage | `restitution_share_opened` |
| PDF | `restitution_pdf_export_clicked` |

## 7. Bloquants environnement connus

- Le build global peut se bloquer si `node_modules` contient des fichiers déchargés par iCloud.
- Le build échouait auparavant sur `ENOTEMPTY` lors du nettoyage implicite de `dist/fr`; le nettoyage est désormais explicite dans `scripts/build-production.mjs`.
- Les tests UI jsdom `profileGoalUx` et `topBarPricingUx` peuvent bloquer le runner local ; ils sont isolés hors validation quotidienne.
- Le navigateur intégré peut refuser l’accès local selon sa politique de sécurité.
- La recette visuelle navigateur doit donc être faite dans un environnement explicitement autorisé ou documentée comme bloquée.

## 8. Règle de décision

| Résultat | Décision |
|---|---|
| Validation quotidienne échoue | Corriger avant tout autre travail |
| Validation quotidienne passe mais build échoue pour raison environnementale documentée | G0 reste non validée, mais le socle peut être analysé |
| Validation G0 complète passe | Phase 1 peut être proposée |
| Scénarios figés absents ou incomplets | G0 échoue |
| Événements de mesure non identifiés | G0 échoue |

## 9. Sortie attendue de Phase 0

À la fin de Phase 0, l’équipe doit pouvoir dire :

> “Nous savons exactement quels scénarios protègent le parcours Créatif, quelle commande les vérifie, quels signaux mesurent le tunnel, et ce qui bloque encore la validation terrain.”
