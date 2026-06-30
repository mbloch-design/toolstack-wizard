# Tooltrim — Recette G0 produit du 29 juin 2026

> Statut : G0 accepté avec réserves après reprise complète
> Périmètre : Créatif
> Interface testée : `http://localhost:8080/en/selector`
> Méthode : recette navigateur locale sur scénarios `G0_PRODUCT_RECIPE.md`.

## Synthèse

La recette produit initiale a d’abord été jouée sur deux sessions critiques : G0-R1 et G0-R2.

La logique cœur est bonne :

- le parcours part bien de la production réelle ;
- Figma, Sketch et Penpot sont présentés comme réponses possibles au même besoin ;
- un outil peut être rattaché à plusieurs usages sans duplication ;
- l’écosystème Figma est contextualisé ;
- Adobe Illustrator et Adobe InDesign sont regroupés dans une seule clarification commerciale Adobe.

Mais les deux sessions révèlent des réserves bloquantes côté UX/restitution :

- mélange FR/EN dans un parcours anglais ;
- contradiction de restitution entre score parfait et signaux de fragilité ;
- suite commerciale proposée comme outil de workflow ;
- budget Adobe confirmé à `70 €/mo` dans le pré-verdict puis restitué à `0 €/mo` dans le dashboard ;
- charge commerciale encore sensible dès que des plugins sont ajoutés.

La règle G0 initiale est atteinte : deux sessions contiennent des P1. G0 produit est donc refusé à ce stade.

Un lot court a ensuite été appliqué et rejoué sur G0-R1/G0-R2. Les P1 initiaux ont été levés, puis G0-R3 à G0-R8 ont été rejoués dans le navigateur réel.

Décision mise à jour : **G0 produit est accepté avec réserves**. La Phase 1 peut être préparée comme parcours Créatif candidat observé, sans ouvrir de nouvelle verticale.

## Correctifs P1 appliqués après cette recette

Le 29 juin 2026, un lot court de correction a été appliqué sur les P1 observés, sans changer le statut G0.

Correctifs couverts :

- libellés anglais des questions utiles, options, sous-titres, transition d’analyse et verdict ;
- propagation du contrat confirmé dans le pré-verdict, le dashboard, les panneaux de synthèse et le PDF ;
- exclusion des conteneurs commerciaux des suggestions de workflow et d’écosystème ;
- plafonnement du score des petites stacks légères pour éviter une restitution `100/100` “Optimized” avec signaux de fragilité.

Validation automatique post-correction :

- tests ciblés P1 : PASS, 57 tests ;
- `npm run validate:diagnostic` : PASS, 119 tests métier ciblés ;
- `npm run validate:g0` : PASS, build production inclus ;
- `git diff --check` sur les fichiers touchés : PASS.

Ces résultats ont ensuite été complétés par la reprise navigateur de G0-R3 à G0-R8. La nouvelle décision est écrite dans `docs/diagnostic/G0_PRODUCT_DECISION.md`.

## Replay post-correction — G0-R2 Adobe

> Date : 29 juin 2026
> Interface testée : `http://localhost:8080/en/selector`
> Statut : PASS ciblé sur les P1 Adobe observés.

Parcours rejoué :

- profil : Creative ;
- production : Brand identities, visuals or layouts ;
- priorité : Reduce costs ;
- outil 1 : Adobe Illustrator pour Identity and visual creation ;
- Brief and references : marqué non applicable ;
- outil 2 : Adobe InDesign pour Layout and publishing ;
- Around Adobe Illustrator, Review, Resources : marqués non applicables ;
- revue commerciale : Adobe regroupé une seule fois pour Illustrator + InDesign ;
- option sélectionnée : Creative Cloud — All Apps ;
- montant saisi : `70`.

Résultats observés :

- “Around Adobe Illustrator” ne propose plus Adobe Creative Cloud comme outil ou complément ;
- la revue commerciale affiche un seul contrat Adobe pour Adobe Illustrator et Adobe InDesign ;
- le champ montant en anglais affiche `€/mo`, plus `€/mois` ;
- après contrat confirmé, Tooltrim ne repose plus la question tarifaire outil par outil ;
- la question héritée “Tu utilises combien d'apps Adobe régulièrement ?” ne réapparaît plus après contrat Adobe confirmé ;
- le pré-verdict affiche `74/100`, “Good”, budget `70 €/mo` et `0` plan à clarifier ;
- la restitution finale affiche `74/100`, “Good”, budget `70 €/mo`, budget déclaré `70 €/mo` ;
- la restitution ne contient plus `Optimized`, `Optimisée`, ni budget `0 €/mo` sur ce scénario ;
- aucune fuite FR évidente n’a été observée dans le chemin rejoué.

Décision de replay :

**Les P1 Adobe observés dans G0-R2 sont levés sur ce replay ciblé.**

Ce replay participe à la décision finale G0 acceptée avec réserves.

## Replay post-correction — G0-R1 Figma

> Date : 29 juin 2026
> Interface testée : `http://localhost:8080/en/selector`
> Statut : PASS ciblé sur les P1 Figma observés.

Parcours rejoué :

- profil : Creative ;
- production : Interfaces and prototypes ;
- priorité : Choose better ;
- outil principal : Figma ;
- usages confirmés : UI design, Brief and references, Prototype and handoff, Review/delivery/archives ;
- écosystème : Iconify for Figma, Figma Tokens / Tokens Studio ;
- ressources : marquées non applicables ;
- revue commerciale : accès non clarifié complètement, donc budget catalogue restant à confirmer.

Résultats observés :

- l’entrée reste centrée sur la production : Figma, Sketch, Penpot ou autre outil sont présentés comme réponses possibles au même besoin ;
- Figma reste une seule entrée dans la stack malgré plusieurs usages ;
- “Around Figma” propose Iconify, Tokens Studio, Stark et Anima, sans plugins Sketch ;
- en recherche, Figma peut être rattaché à Review sans duplication ;
- les questions utiles anglaises ne montrent plus les fuites FR observées initialement ;
- le pré-verdict affiche `74/100`, “Good”, profil fragile assumé, sans `100/100` ni “Optimized/Optimisée” ;
- la restitution finale affiche `74/100`, “Good”, Figma en production/review/secure et Iconify + Tokens Studio en satellites ;
- la restitution affiche `Budget to confirm` pour les `16 €/mo` non confirmés, et non `Declared budget` ;
- aucun plugin Sketch n’est affiché dans la branche Figma.

Corrections supplémentaires déclenchées par ce replay :

- libellé dynamique “Budget to confirm” / “Budget à confirmer” quand le montant est un repère catalogue ou un mode non clarifié ;
- garde-fou contre un micro-crash possible quand une reprise de session filtre les questions utiles et laisse un index hors borne.

Réserves P2 maintenues :

- Figma pourrait être proposé plus spontanément dans la zone Review, sans nécessiter une recherche ;
- `3 contracts to clarify` après Figma + deux plugins reste potentiellement fatigant pour un utilisateur, même si la logique commerciale est défendable.

Décision de replay :

**Les P1 Figma observés dans G0-R1 sont levés sur ce replay ciblé.**

Ce replay participe à la décision finale G0 acceptée avec réserves.

## Replay post-correction — G0-R3 usages atypiques

> Date : 29 juin 2026
> Interface testée : `http://localhost:8080/en/selector`
> Statut : PASS après corrections ciblées.

Parcours rejoué :

- profil : Creative ;
- production : Brand identities, visuals or layouts ;
- priorité : Choose better ;
- méthode libre : `I build moodboards in Illustrator and prepare client quotes in InDesign when the project is visual.`

Résultats observés :

- la phrase libre est acceptée sans juger l’usage atypique ;
- Adobe Illustrator est rattaché à l’identité visuelle ;
- Adobe InDesign est détecté et peut être rattaché à la mise en page ;
- Illustrator peut aussi être lié à Brief and references pour le moodboard, sans duplication ;
- le contrat Adobe est regroupé une seule fois ;
- le parcours anglais ne montre pas de fuite FR sur le chemin rejoué ;
- le pré-verdict reste cohérent à `74/100`, “Good”.

Corrections déclenchées :

- suppression du faux positif “Microsoft Project” causé par le mot générique `project` ;
- remplacement du wording “tool(s)” par “pricing or access point(s)” quand le compteur inclut un contrat ou un accès à clarifier.

Réserve P2 :

- la restitution peut encore afficher `Secure 0` alors qu’un point prix/accès reste à préciser ; à observer en Phase 1.

## Replay post-correction — G0-R4 3D et écosystèmes hôtes

> Date : 29 juin 2026
> Interface testée : `http://localhost:8080/en/selector`
> Statut : PASS après correction catalogue.

Résultats observés :

- Blender et Cinema 4D sont présentés comme pairs pour la création 3D ;
- la création 3D, le rendu et l’écosystème sont séparés ;
- la branche Blender affiche Quixel Megascans, Auto-Rig Pro, Hard Ops / Boxcutter, Octane Render et BlenderKit ;
- Redshift n’est plus proposé par défaut autour de Blender ;
- la branche Cinema 4D conserve Redshift, Octane Render et X-Particles ;
- aucun plugin Cinema 4D n’est affiché dans la branche Blender ;
- aucune fuite FR évidente n’a été observée.

Correction déclenchée :

- retrait de Redshift de l’override Blender et ajout de compléments Blender-first.

## Replay post-correction — G0-R5 social, Canva, CapCut et publication

> Date : 29 juin 2026
> Interface testée : `http://localhost:8080/en/selector`
> Statut : PASS après correction commerciale.

Parcours rejoué :

- profil : Creative ;
- production : Content and social formats ;
- priorité : Save time ;
- Canva pour les formats sociaux ;
- IA intégrée Canva ;
- CapCut pour le montage ;
- Buffer pour la publication.

Résultats observés :

- Canva couvre la production visuelle sans bloquer sur le plan ;
- CapCut est rattaché au montage vidéo ;
- Buffer est rattaché à la publication ;
- l’écosystème Canva affiche Envato Elements, Icons8, Noun Project et Canva Templates ;
- Canva Pro n’est plus proposé comme complément de workflow ;
- aucune fuite FR évidente n’a été observée.

Correction déclenchée :

- Canva Pro est traité comme conteneur commercial, pas comme satellite workflow.

## Replay post-correction — G0-R6 IA hybride

> Date : 29 juin 2026
> Interface testée : `http://localhost:8080/en/selector`
> Statut : PASS après corrections P1, avec réserves P2.

Parcours rejoué :

- profil : Creative ;
- production : Photography and retouching ;
- priorité : Choose better ;
- Adobe Photoshop pour le développement/retouche photo ;
- mode IA : Built-in + separate ;
- Adobe Firefly comme capacité intégrée dans Photoshop ;
- ChatGPT comme outil IA séparé ;
- capacités Photoshop/Firefly : suppression, extension, rendu/upscale ;
- capacités ChatGPT : recherche/idées, génération/réécriture de texte.

Résultats observés :

- la capture IA est par objectif et par capacité, pas par liste de logos ;
- la restitution affiche deux acteurs IA : fonction intégrée Photoshop/Firefly et outil séparé ChatGPT ;
- Firefly/Photoshop est maintenant lu comme `Included in the contract · Adobe` quand le plan Adobe est choisi ;
- ChatGPT reste un accès séparé à clarifier ;
- le double comptage prix a été réduit : contrat Adobe sélectionné + ChatGPT ne produisent plus un compteur par application ;
- la question utile LLM est entièrement traduite en anglais.

Corrections déclenchées :

- traduction de la question historique LLM et de ses options ;
- lecture IA intégrée couverte par plan choisi même si le montant du contrat reste à renseigner ;
- compteur de points prix/accès dédupliqué quand un contrat non chiffré couvre une application.

Réserves P2 :

- le détail de la section prix peut encore afficher l’application couverte plutôt que le contrat parent quand le montant manque ;
- la question utile sur les zones sautées reste utile mais peut être ressentie comme répétitive.

## Replay post-correction — G0-R7 outil inconnu

> Date : 29 juin 2026
> Interface testée : `http://localhost:8080/en/selector`
> Statut : PASS, avec réserve P2.

Parcours rejoué :

- profil : Creative ;
- production : Illustration ;
- priorité : Choose better ;
- outil libre ajouté : `BrushForge Studio`.

Résultats observés :

- l’écran propose des outils connus sans imposer Illustrator ou Procreate ;
- l’action `I can’t find my tool` ouvre une saisie libre ;
- le message précise que Tooltrim infère le rôle depuis l’objectif courant ;
- `BrushForge Studio` est ajouté à la stack et rattaché à `Illustration-Drawing` ;
- la revue finale conserve l’outil libre, sa fréquence et son accès à clarifier ;
- la restitution conserve l’outil dans la chaîne de production.

Réserve P2 :

- la clarification “Free” n’a pas été cliquée par son nom exact dans le replay automatisé ; l’accessibilité/nom accessible des options génériques doit être vérifié.

## Replay post-correction — G0-R8 reprise

> Date : 29 juin 2026
> Interface testée : `http://localhost:8080/en/selector`
> Statut : PASS.

Résultats observés :

- après reload, l’interface affiche `We picked up your diagnostic where you left off` ;
- les réponses utiles, l’état de pré-verdict et la restitution sont restaurés ;
- la session inconnue R7 est restaurée avec `1 tool` et `BrushForge Studio` dans la restitution ;
- le parcours conserve la langue anglaise sans fuite FR évidente ;
- le diagnostic peut être ouvert après reprise.

## Décision G0 post-reprise

Moyenne post-correction estimée : `13,5/16`.

| Session | Statut post-correction | Note retenue |
|---|---|---:|
| G0-R1 | PASS avec réserves P2 | 13/16 |
| G0-R2 | PASS | 14/16 |
| G0-R3 | PASS avec réserve P2 | 13/16 |
| G0-R4 | PASS | 14/16 |
| G0-R5 | PASS | 14/16 |
| G0-R6 | PASS avec réserves P2 | 13/16 |
| G0-R7 | PASS avec réserve P2 | 13/16 |
| G0-R8 | PASS | 14/16 |

Décision : **G0 accepté avec réserves**.

La Phase 1 peut être préparée comme observation du parcours Créatif candidat. Les réserves P2 ci-dessus deviennent une grille d’observation, pas un prétexte pour rouvrir un développement au fil de l’eau.

## G0-R1 — UI avec Figma / Sketch — recette initiale

### Scénarios couverts

- CR-01 — UI avec Figma ;
- CR-02 — UI avec Sketch, partiellement observé via l’écran de choix ;
- risque testé : même besoin, outils différents, écosystème hôte, outil multi-usage.

### Parcours joué

- Profil : Creative.
- Production : Interfaces and prototypes.
- Priorité : Choose better.
- Outil principal : Figma.
- Usages confirmés :
  - interface design ;
  - brief and references ;
  - prototype and handoff ;
  - review, delivery and archives.
- Écosystème :
  - Iconify for Figma ;
  - Figma Tokens / Tokens Studio.
- IA : non utilisée dans cette session.
- Ressources/assets : activité marquée non applicable.

### Signaux positifs

- L’entrée demande “What do you produce most often?” et non un logiciel.
- Le texte précise : “without assuming Figma, Adobe, Canva or Blender”.
- La question métier dit : “No tool is assumed: Figma, Sketch, Penpot or another one.”
- Figma, Sketch et Penpot apparaissent comme réponses équivalentes au besoin UI.
- Après sélection de Figma, l’interface propose “You also use Figma for…” avec “Confirm other uses without adding the tool twice.”
- Figma reste une seule entrée dans la stack tout en couvrant plusieurs zones.
- L’écosystème affiché autour de Figma contient Iconify, Tokens Studio, Stark et Anima.
- Aucun plugin Sketch n’est affiché dans la branche Figma.
- En recherche, Figma ressort dans Review avec “Already in your stack · use it for this need”.
- La restitution “Creative chain” classe correctement :
  - Figma en production ;
  - Iconify et Tokens Studio en satellites ;
  - Figma en review ;
  - Figma en secure/licences.

### P1 observés

#### P1 — Langue mélangée dans le parcours anglais

Le parcours anglais bascule en français dans les questions utiles :

- “Tu collabores avec des clients ou une équipe dans Figma ?”
- “Utilises-tu les fonctionnalités pro de ton outil de design ?”
- “Oui, quotidiennement”
- “3 outils à analyser...”
- “Optimisée”

Impact : la confiance baisse fortement sur une recette utilisateur anglophone. Ce n’est pas un simple polish si le test Phase 1 se fait en anglais.

#### P1 — Restitution contradictoire

Le pré-verdict et la restitution affichent simultanément :

- score `100/100` ;
- verdict “Optimized” / “Optimisée” ;
- profil “Fragile stack” ;
- message “The stack is light, but some core links may be missing” ;
- fiabilité `68/100` ;
- risque principal “Light foundation”.

Impact : l’utilisateur peut reconnaître la cartographie, mais ne sait pas s’il doit se sentir rassuré ou inquiet. Cette contradiction touche directement la confiance du diagnostic.

### P2 observés

#### P2 — Découvrabilité du multi-usage Figma pour la review

Figma couvre bien la review si l’utilisateur le recherche, mais il n’apparaît pas spontanément dans les exemples visibles de la zone “Review, delivery and archives”.

Impact : un utilisateur peut croire qu’il doit ajouter WeTransfer, Google Drive, Frame.io ou Pixieset alors qu’il valide déjà dans Figma.

#### P2 — Charge commerciale plugins

Après ajout de Figma + deux plugins, l’interface annonce `3 contracts to clarify`.

Impact : techniquement défendable si les plugins sont payés séparément, mais potentiellement lourd pour l’utilisateur. À surveiller dans les scénarios Adobe, Maxon et Canva.

### Score G0-R1

| Dimension | Note | Commentaire |
|---|---:|---|
| Entrée par production | 2 | Très claire |
| Langage métier | 1 | Bon au départ, cassé par mélange FR/EN |
| Outil multi-usage | 2 | Très bon |
| Usage atypique | 2 | Non central ici, mais l’interface rappelle que les usages inhabituels sont acceptés |
| IA dans le flux | 2 | Non utilisée, pas de confusion |
| Écosystème hôte | 2 | Branche Figma correcte |
| Contrats / plans | 1 | Charge potentiellement lourde avec plugins |
| Restitution | 1 | Chaîne reconnue, mais contradiction score/fragilité |

**Score : 13/16**

### Décision session

**PASS avec réserve forte.**

G0-R1 valide la logique cœur, mais révèle deux P1 à arbitrer avant d’accepter G0 produit sans réserve.

## G0-R2 — Adobe et suites — recette initiale

### Scénarios couverts

- CR-06 — identité avec Illustrator et InDesign ;
- CR-17 — suite Adobe avec plusieurs applications ;
- risque testé : plusieurs applications d’une même suite, plan Adobe demandé une seule fois, applications incluses mais non utilisées, budget restitué.

### Parcours joué

- Profil : Creative.
- Production : Brand identities, visuals or layouts.
- Priorité : Reduce costs.
- Outils principaux :
  - Adobe Illustrator pour la création identité / visuel ;
  - Adobe InDesign pour layout and publishing.
- Zones volontairement marquées non applicables pour concentrer le test :
  - brief and references ;
  - around Adobe Illustrator ;
  - review, delivery and archives ;
  - resources and assets.
- IA : non utilisée dans cette session.
- Revue commerciale :
  - Adobe est regroupé une seule fois ;
  - la revue affiche “Adobe — Adobe Illustrator, Adobe InDesign — to clarify” ;
  - question posée : “How do you access Adobe?” ;
  - option sélectionnée : Creative Cloud — All Apps ;
  - montant saisi : `70` ;
  - le pré-verdict affiche `70 €/mo` et `0 contracts to clarify`.

### Signaux positifs

- L’entrée reste centrée sur la production et la priorité, pas sur le choix initial d’un logiciel.
- Illustrator et InDesign sont bien deux applications actives, pas une activation automatique de toute la suite Adobe.
- La clarification commerciale Adobe est regroupée une seule fois pour les deux applications.
- La revue commerciale propose des options réalistes : All Apps, Photography, Photography + other app(s), single apps, team/employer license, unknown.
- Le parcours demande si les zones ignorées l’ont été volontairement : “You skipped several areas without tools. Was that intentional?”.
- La restitution reconnaît les deux outils actifs dans la chaîne de production : Adobe Illustrator et Adobe InDesign.

### P1 observés

#### P1 — Langue mélangée répétée

Le parcours anglais continue à afficher du français :

- “Tu utilises combien d'apps Adobe régulièrement ?”
- “Si 3+ apps, le pack complet est plus rentable”
- “2 outils à analyser...”
- “Optimisée”

Impact : le P1 observé en G0-R1 n’est pas isolé à Figma. Il touche le moteur de questions utiles et la restitution.

#### P1 — Suite commerciale proposée comme outil de workflow

Dans la zone “Around Adobe Illustrator”, l’interface propose “Use Adobe Creative Cloud for this objective”.

Impact : Adobe Creative Cloud est un conteneur commercial, pas une méthode de production. Le parcours doit proposer les applications, fonctions ou compléments réellement utilisés, puis traiter Creative Cloud dans la revue commerciale.

#### P1 — Restitution contradictoire répétée

Le pré-verdict et la restitution affichent simultanément :

- score `100/100` ;
- verdict “Optimized” / “Optimisée” ;
- profil ou message de fragilité ;
- message “some core links may be missing” ;
- fiabilité `63/100` ;
- risque principal “Light foundation”.

Impact : le diagnostic donne deux lectures opposées : “tout va très bien” et “la fondation est légère”. L’utilisateur ne peut pas savoir quelle décision croire.

#### P1 — Budget confirmé puis perdu en restitution

Après saisie du plan Adobe All Apps à `70`, le pré-verdict affiche `70 €/mo`.

La restitution finale affiche ensuite :

- “Budget 0 €/mo” ;
- “Declared budget 0 €/mo” ;
- “No obvious waste detected in the declared plans”.

Impact : c’est un problème de confiance majeur. L’utilisateur vient de clarifier un contrat Adobe, mais la restitution oublie ou ignore ce montant.

### P2 observés

#### P2 — Question Adobe utile mais encore formulée comme optimisation tarifaire

La question “Tu utilises combien d'apps Adobe régulièrement ?” est pertinente sur le fond, car elle permet de challenger All Apps vs apps seules.

Mais elle arrive dans la même dynamique que la cartographie et mélange langue, contrat et usage.

Impact : cette logique doit rester, mais dans un module clair de vérification commerciale, avec une formulation métier stable.

### Score G0-R2

| Dimension | Note | Commentaire |
|---|---:|---|
| Entrée par production | 2 | La production et la priorité restent le point de départ |
| Langage métier | 1 | Bon début, mais langue mélangée et suite proposée comme usage |
| Outil multi-usage | 2 | Deux apps Adobe actives, pas de duplication du contrat |
| Usage atypique | 2 | Non central ici, aucune correction abusive observée |
| IA dans le flux | 2 | Non utilisée, pas de confusion |
| Écosystème hôte | 0 | Creative Cloud apparaît comme complément de workflow |
| Contrats / plans | 1 | Regroupement Adobe réussi, mais budget perdu en restitution |
| Restitution | 0 | Contradiction score/risque et budget incorrect |

**Score : 10/16**

### Décision session

**FAIL.**

G0-R2 valide une partie importante de l’architecture commerciale — Adobe est demandé une seule fois — mais révèle trois blocages de confiance : i18n, confusion suite commerciale / outil de workflow, et budget perdu dans la restitution.

## Décision G0 initiale, remplacée après reprise

G0 produit est **refusé à ce stade**.

Raisons :

- G0-R1 contient des P1 ;
- G0-R2 contient des P1 ;
- la règle de recette dit : “Deux sessions ou plus contiennent un P1 ⇒ G0 refusé” ;
- le score moyen des deux sessions jouées est `11,5/16`, sous le seuil de `12/16` ;
- les problèmes touchent la confiance utilisateur, pas seulement le polish.

À ce moment-là, la recette n’avait pas besoin d’être poussée jusqu’à G0-R8 avant correction : le seuil de refus était déjà atteint. Les sessions restantes ont ensuite été rejouées après correction des P1.

Cette décision initiale est remplacée par la décision post-reprise documentée plus haut : **G0 accepté avec réserves**.

## Prochain lot Phase 0 initial, réalisé ensuite

Avant toute Phase 1 :

1. conserver les garde-fous i18n, score/verdict, budget et conteneurs commerciaux ;
2. rejouer G0-R3 à G0-R8 dans le navigateur — réalisé ;
3. documenter tout P1/P2 nouveau — réalisé ;
4. écrire une nouvelle décision G0 — réalisé ;
5. ouvrir Phase 1 uniquement si cette décision accepte G0 — décision actuelle : accepté avec réserves.
