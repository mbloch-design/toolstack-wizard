# Tooltrim — Décision G0 produit

> Date : 29 juin 2026
> Statut : accepté avec réserves
> Phase : 0 — Reprise de contrôle
> Périmètre : Créatif

## Décision actuelle

**G0 produit est accepté avec réserves.**

La baseline technique passe, les P1 initiaux ont été corrigés, puis les scénarios G0-R3 à G0-R8 ont été rejoués dans l’interface réelle.

La décision suit la règle de seuil décrite dans `docs/diagnostic/G0_PRODUCT_RECIPE.md` :

- aucun P0 ouvert ;
- aucun P1 ouvert après les corrections du 29 juin 2026 ;
- moyenne post-correction estimée : `13,5/16` ;
- porte complète `npm run validate:g0` : PASS après correction du build reproductible ;
- `git diff --check` : PASS ;
- des P2 UX restent à traiter ou à surveiller avant bêta large.

Conséquence : la Phase 1 peut être préparée, mais uniquement comme **parcours Créatif candidat observé**, pas comme nouvelle extension fonctionnelle ni nouvelle verticale.

## Sessions rejouées

- G0-R1 — UI Figma / Sketch : PASS post-correction, avec P2 découvrabilité review et charge commerciale plugins.
- G0-R2 — Adobe et suites : PASS post-correction, Adobe regroupé une seule fois et budget confirmé conservé.
- G0-R3 — usages atypiques : PASS après correction du faux positif Microsoft Project et du wording budget.
- G0-R4 — 3D Blender / Cinema 4D : PASS après correction de Redshift hors branche Blender.
- G0-R5 — social Canva / CapCut / publication : PASS après retrait de Canva Pro des compléments workflow.
- G0-R6 — IA hybride Photoshop / Firefly / ChatGPT : PASS après correction i18n LLM, accès IA intégré et double comptage contrat.
- G0-R7 — outil inconnu : PASS, outil libre rattaché au besoin courant et conservé jusqu’à la restitution.
- G0-R8 — reprise : PASS, session restaurée après reload avec état et restitution exploitables.

Voir le détail dans `docs/diagnostic/G0_PRODUCT_RUN_2026-06-29.md`.

## Ce qui est validé

- Le parcours part de la production et de l’objectif utilisateur, pas d’un outil présumé.
- Un outil peut couvrir plusieurs besoins sans duplication.
- Les usages atypiques sont acceptés comme faits, sans jugement immédiat.
- Les branches d’écosystème dépendent de l’hôte réellement choisi.
- Les suites commerciales ne sont plus proposées comme outils de workflow.
- IA intégrée et IA séparée sont distinguées par rôle et par objectif.
- Un outil inconnu peut être ajouté sans bloquer la cartographie.
- La reprise de session conserve le parcours et permet de reprendre la restitution.
- Le score reste cohérent avec une petite stack fragile : `74/100`, “Good”, pas `100/100 Optimized`.

## Réserves à porter en Phase 1

Ces points ne bloquent plus G0, mais doivent être observés ou améliorés avant d’élargir :

- la clarification commerciale reste le moment le plus fragile du parcours ;
- les détails de prix peuvent encore afficher une application couverte plutôt que le contrat parent quand le montant n’est pas saisi ;
- certains boutons de plan générique, notamment gratuit/inclus sur outil inconnu, restent à vérifier en accessibilité et nom exact ;
- les zones sautées déclenchent une question utile pertinente, mais potentiellement fatigante si l’utilisateur a déjà explicitement dit “non applicable” ;
- Figma pourrait être proposé plus naturellement dans la review sans recherche manuelle ;
- les plugins gratuits/freemium peuvent créer une impression de “contrats à clarifier” trop lourde.

## Conditions d’ouverture Phase 1

Les deux conditions techniques de porte sont satisfaites au 29 juin 2026 :

- `npm run validate:g0` : PASS ;
- `git diff --check` : PASS.

La Phase 1 peut donc être préparée, avec trois contraintes :

1. les réserves ci-dessus deviennent une grille d’observation utilisateur ;
2. aucun développement hors verticale Créatif n’est engagé ;
3. la Phase 1 vise la validation terrain du parcours candidat, pas l’ajout de nouvelles branches.

## Décision opérationnelle

Prochaine étape autorisée :

- préparer la Phase 1 — parcours Créatif candidat ;
- définir les observations utilisateurs à mener sur le moment contrat, l’IA hybride, l’outil inconnu et la reprise ;
- ne pas démarrer Tech, Conseil, Content ou Ops avant validation terrain Créatif.
